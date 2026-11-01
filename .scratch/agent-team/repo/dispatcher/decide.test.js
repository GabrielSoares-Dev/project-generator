'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { decide, readConfig, parseMarkers } = require('./decide');

const auto = { supervised: false };
const issue = (labels) => ({ isPR: false, number: 42, labels });
const pr = (labels, issueLabels = ['in-progress', 'ai:claude']) => ({ isPR: true, number: 50, issueNumber: 42, labels, issueLabels });
const verdict = (role, result) => `**verdict**\n\n<!-- agent-team verdict role=${role} result=${result} -->`;
const comment = (body, extra = {}) => ({ type: 'comment', body, authorCanWrite: true, authorIsAdmin: false, ...extra });

test('a ready ticket starts the Dev on the primary AI', () => {
  const result = decide({ event: { type: 'labeled', label: 'ready-for-agent' }, target: issue(['ready-for-agent']), config: auto });
  assert.deepEqual(result.add.sort(), ['ai:claude', 'in-progress', 'run:dev']);
  assert.deepEqual(result.remove, ['ready-for-agent']);
});

test('supervised mode asks before the Dev starts', () => {
  const result = decide({ event: { type: 'labeled', label: 'ready-for-agent' }, target: issue(['ready-for-agent']), config: {} });
  assert.deepEqual(result.add, ['awaiting-ok']);
  assert.match(result.comments[0], /Next: dev on claude/);
  assert.match(result.comments[0], /<!-- agent-team pending role=dev ai=claude same=false -->/);
});

test('an opened pull request goes to QA on the other AI', () => {
  const result = decide({ event: { type: 'pr-opened' }, target: pr([]), config: auto });
  assert.ok(result.add.includes('ready-for-qa'));
  assert.ok(result.add.includes('ai:codex'));
  assert.ok(result.add.includes('dev-ai:claude'));
  assert.match(result.comments[0], /^@codex Act as the `qa` agent/);
});

test('a pull request not linked to agent work is ignored', () => {
  const result = decide({ event: { type: 'pr-opened' }, target: pr([], []), config: auto });
  assert.deepEqual(result, { add: [], remove: [], comments: [], issue: { add: [], remove: [] } });
});

test('QA approval hands off to the Reviewer', () => {
  const target = pr(['ready-for-qa', 'ai:codex', 'dev-ai:claude']);
  const result = decide({ event: comment(verdict('qa', 'approved')), target, config: auto });
  assert.ok(result.add.includes('ready-for-review'));
  assert.ok(result.remove.includes('ready-for-qa'));
});

test('a return goes back to the Dev on the AI that wrote the code', () => {
  const target = pr(['ready-for-qa', 'ai:codex', 'dev-ai:claude']);
  const result = decide({ event: comment(verdict('qa', 'returned')), target, config: auto });
  assert.ok(result.add.includes('in-progress'));
  assert.ok(result.add.includes('run:dev'));
});

test('the third return escalates to the human with a decision summary', () => {
  const target = pr(['ready-for-review', 'ai:codex', 'dev-ai:claude']);
  const comments = [verdict('qa', 'returned'), verdict('reviewer', 'changes-requested')];
  const result = decide({ event: comment(verdict('reviewer', 'changes-requested')), target, comments, config: auto });
  assert.ok(result.add.includes('ready-for-human'));
  assert.ok(result.add.includes('escalated'));
  assert.ok(result.add.includes('run:decision-summary'));
  assert.ok(!result.add.includes('in-progress'));
});

test('escalation is not held by supervised mode', () => {
  const target = pr(['ready-for-review', 'ai:codex', 'dev-ai:claude']);
  const comments = [verdict('qa', 'returned'), verdict('qa', 'returned')];
  const result = decide({ event: comment(verdict('reviewer', 'changes-requested')), target, comments, config: {} });
  assert.ok(result.add.includes('escalated'));
});

test('Reviewer approval makes it ready for the human', () => {
  const target = pr(['ready-for-review', 'ai:codex', 'dev-ai:claude']);
  const result = decide({ event: comment(verdict('reviewer', 'approved')), target, config: {} });
  assert.deepEqual(result.add, ['ready-for-human']);
});

test('QA needs-info sends the issue to the human', () => {
  const target = pr(['ready-for-qa', 'ai:codex', 'dev-ai:claude']);
  const result = decide({ event: comment(verdict('qa', 'needs-info')), target, config: auto });
  assert.ok(result.add.includes('needs-info'));
  assert.deepEqual(result.issue.add, ['needs-info']);
});

test('the Dev marking a return answered sends it back to QA', () => {
  const target = pr(['in-progress', 'ai:claude', 'dev-ai:claude']);
  const result = decide({ event: comment(verdict('dev', 'ready')), target, config: auto });
  assert.ok(result.add.includes('ready-for-qa'));
});

test('a verdict from someone without write access is ignored', () => {
  const target = pr(['ready-for-qa', 'ai:codex', 'dev-ai:claude']);
  const result = decide({ event: comment(verdict('qa', 'approved'), { authorCanWrite: false }), target, config: auto });
  assert.deepEqual(result.add, []);
});

test('/ok from an admin runs the pending hand-off', () => {
  const pending = '<!-- agent-team pending role=reviewer ai=codex same=false -->';
  const target = pr(['ready-for-qa', 'ai:codex', 'dev-ai:claude', 'awaiting-ok']);
  const result = decide({ event: comment('/ok', { authorIsAdmin: true }), target, comments: [pending], config: {} });
  assert.ok(result.add.includes('ready-for-review'));
  assert.ok(result.remove.includes('awaiting-ok'));
  assert.match(result.comments[0], /@codex Act as the `reviewer` agent/);
});

test('/ok from a non-admin does nothing', () => {
  const pending = '<!-- agent-team pending role=reviewer ai=codex same=false -->';
  const target = pr(['ready-for-qa', 'awaiting-ok']);
  const result = decide({ event: comment('/ok'), target, comments: [pending], config: {} });
  assert.deepEqual(result.add, []);
});

test('a stalled pull request fails over to the other AI', () => {
  const target = pr(['in-progress', 'ai:claude', 'dev-ai:claude']);
  const result = decide({ event: { type: 'tick' }, target, config: auto, now: '2026-11-01T10:31:00Z', lastActivityAt: '2026-11-01T10:00:00Z' });
  assert.ok(result.add.includes('ai:codex'));
  assert.ok(result.add.includes('dev-ai:codex'));
  assert.ok(result.remove.includes('run:dev') || !target.labels.includes('run:dev'));
  assert.match(result.comments[0], /@codex Act as the `dev` agent/);
});

test('a review that fails over to the Dev model is marked same-model-review', () => {
  const target = pr(['ready-for-review', 'ai:codex', 'dev-ai:claude']);
  const result = decide({ event: { type: 'tick' }, target, config: auto, now: '2026-11-01T10:31:00Z', lastActivityAt: '2026-11-01T10:00:00Z' });
  assert.ok(result.add.includes('same-model-review'));
  assert.ok(result.add.includes('run:reviewer'));
});

test('a pull request with recent activity is left alone', () => {
  const target = pr(['in-progress', 'ai:claude']);
  const result = decide({ event: { type: 'tick' }, target, config: auto, now: '2026-11-01T10:20:00Z', lastActivityAt: '2026-11-01T10:00:00Z' });
  assert.deepEqual(result.add, []);
});

test('a ticket without a pull request never fails over', () => {
  const result = decide({ event: { type: 'tick' }, target: issue(['in-progress', 'ai:claude']), config: auto, now: '2026-11-01T12:00:00Z', lastActivityAt: '2026-11-01T10:00:00Z' });
  assert.deepEqual(result.add, []);
});

test('a pull request waiting for /ok never fails over', () => {
  const target = pr(['in-progress', 'ai:claude', 'awaiting-ok']);
  const result = decide({ event: { type: 'tick' }, target, config: auto, now: '2026-11-01T12:00:00Z', lastActivityAt: '2026-11-01T10:00:00Z' });
  assert.deepEqual(result.add, []);
});

test('the dispatcher never applies ready-for-agent', () => {
  for (const type of ['labeled', 'pr-opened', 'tick']) {
    const result = decide({ event: { type, label: 'ready-for-agent' }, target: issue(['ready-for-agent']), config: auto });
    assert.ok(!result.add.includes('ready-for-agent'));
  }
});

test('config rejects the same AI as primary and fallback', () => {
  assert.throws(() => readConfig({ primary: 'codex', fallback: 'codex' }), /one each/);
});

test('markers are parsed with their attributes', () => {
  assert.deepEqual(parseMarkers('x <!-- agent-team verdict role=qa result=approved --> y', 'verdict'), [{ role: 'qa', result: 'approved' }]);
});
