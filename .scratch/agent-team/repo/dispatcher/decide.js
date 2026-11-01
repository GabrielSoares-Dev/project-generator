'use strict';

const AIS = ['claude', 'codex'];
const ROLE_STAGE = { dev: 'in-progress', qa: 'ready-for-qa', reviewer: 'ready-for-review' };
const STAGE_ROLE = Object.fromEntries(Object.entries(ROLE_STAGE).map(([role, stage]) => [stage, role]));
const FLOW_LABELS = ['ready-for-agent', 'in-progress', 'ready-for-qa', 'ready-for-review', 'ready-for-human', 'needs-info'];
const AWAITING = 'awaiting-ok';
const ESCALATED = 'escalated';
const SAME_MODEL = 'same-model-review';
const RETURN_RESULTS = ['returned', 'changes-requested'];

const DEFAULT_CONFIG = Object.freeze({
  primary: 'claude',
  fallback: 'codex',
  stallMinutes: 30,
  maxReturns: 3,
  supervised: true,
});

function readConfig(raw) {
  const config = { ...DEFAULT_CONFIG, ...(raw || {}) };
  if (!AIS.includes(config.primary) || !AIS.includes(config.fallback) || config.primary === config.fallback) {
    throw new Error('config: primary and fallback must be "claude" and "codex", one each');
  }
  if (!(config.stallMinutes > 0) || !(config.maxReturns > 0) || typeof config.supervised !== 'boolean') {
    throw new Error('config: stallMinutes and maxReturns must be positive, supervised a boolean');
  }
  return config;
}

function parseMarkers(body, kind) {
  const found = [];
  const pattern = new RegExp(`<!-- agent-team ${kind}((?: [a-z-]+=[a-z0-9:-]+)*) -->`, 'g');
  for (const match of String(body || '').matchAll(pattern)) {
    const attrs = {};
    for (const pair of match[1].trim().split(' ').filter(Boolean)) {
      const [key, value] = pair.split('=');
      attrs[key] = value;
    }
    found.push(attrs);
  }
  return found;
}

const labelAi = (labels, prefix) => AIS.find((ai) => labels.includes(`${prefix}${ai}`)) || null;
const otherAi = (config, ai) => (ai === config.primary ? config.fallback : config.primary);

function emptyActions() {
  return { add: [], remove: [], comments: [], issue: { add: [], remove: [] } };
}

function merge(target, extra) {
  target.add.push(...extra.add);
  target.remove.push(...extra.remove);
  target.comments.push(...extra.comments);
  target.issue.add.push(...extra.issue.add);
  target.issue.remove.push(...extra.issue.remove);
  return target;
}

function finish(actions, labels) {
  const add = [...new Set(actions.add)];
  const remove = [...new Set(actions.remove)].filter((label) => !add.includes(label) && labels.includes(label));
  return {
    add: add.filter((label) => !labels.includes(label)),
    remove,
    comments: actions.comments,
    issue: { add: [...new Set(actions.issue.add)], remove: [...new Set(actions.issue.remove)] },
  };
}

function clearFlow(labels) {
  return labels.filter((label) => FLOW_LABELS.includes(label) || label.startsWith('run:') || label.startsWith('ai:') || label === AWAITING);
}

function codexRequest(role, target) {
  const where = target.isPR ? 'this pull request' : 'this issue';
  const issue = target.isPR && target.issueNumber ? ` The issue is #${target.issueNumber}.` : '';
  return `@codex Act as the \`${role}\` agent defined in \`.codex/agents/${role}.toml\` for ${where} and follow it exactly.${issue}`;
}

function start(role, ai, target, { same = false } = {}) {
  const actions = emptyActions();
  actions.remove.push(...clearFlow(target.labels));
  actions.add.push(ROLE_STAGE[role], `ai:${ai}`);
  if (role === 'dev' && target.isPR) {
    actions.remove.push(...AIS.map((other) => `dev-ai:${other}`));
    actions.add.push(`dev-ai:${ai}`);
  }
  if (same) actions.add.push(SAME_MODEL);
  if (ai === 'claude') {
    actions.add.push(`run:${role}`);
  } else {
    actions.comments.push(codexRequest(role, target));
  }
  return actions;
}

function handOff(input, role, ai, { same = false, reason = '' } = {}) {
  if (!input.config.supervised) return start(role, ai, input.target, { same });
  const actions = emptyActions();
  const note = same ? ' The same model that wrote the code will review it.' : '';
  actions.add.push(AWAITING);
  actions.comments.push(
    [`**Next: ${role} on ${ai}.** ${reason}${note}`.trim(), '', 'Reply `/ok` to continue.', '', `<!-- agent-team pending role=${role} ai=${ai} same=${same} -->`].join('\n'),
  );
  return actions;
}

function devAiOf(input) {
  return labelAi(input.target.labels, 'dev-ai:') || labelAi(input.target.issueLabels || [], 'ai:') || input.config.primary;
}

function reviewHandOff(input, role, reason) {
  const devAi = devAiOf(input);
  return handOff(input, role, otherAi(input.config, devAi), { reason });
}

function escalate(input, returns) {
  const actions = emptyActions();
  const { target, config } = input;
  actions.remove.push(...clearFlow(target.labels));
  actions.add.push('ready-for-human', ESCALATED);
  actions.comments.push(`**Escalated to the human** after ${returns} returns. A decision summary follows.`);
  if (config.primary === 'claude') {
    actions.add.push('run:decision-summary');
  } else {
    actions.comments.push('@codex Write the decision summary for this pull request with the `decision-summary` skill.');
  }
  return actions;
}

function onVerdict(input, verdict) {
  const { target, config, comments } = input;
  const actions = emptyActions();
  if (verdict.role === 'dev' && verdict.result === 'ready') {
    return reviewHandOff(input, 'qa', 'The Dev answered the return.');
  }
  if (verdict.role === 'qa' && verdict.result === 'approved') {
    return reviewHandOff(input, 'reviewer', 'QA approved.');
  }
  if (verdict.role === 'qa' && verdict.result === 'needs-info') {
    actions.remove.push(...clearFlow(target.labels));
    actions.add.push('needs-info');
    actions.issue.add.push('needs-info');
    actions.issue.remove.push('in-progress');
    actions.comments.push('**Waiting for the human:** QA asked questions on the issue.');
    return actions;
  }
  if (verdict.role === 'reviewer' && verdict.result === 'approved') {
    actions.remove.push(...clearFlow(target.labels));
    actions.add.push('ready-for-human');
    actions.comments.push('**Ready for the human:** QA and the Reviewer approved.');
    return actions;
  }
  if (['qa', 'reviewer'].includes(verdict.role) && RETURN_RESULTS.includes(verdict.result)) {
    const returns = [...comments, input.event.body]
      .flatMap((body) => parseMarkers(body, 'verdict'))
      .filter((marker) => ['qa', 'reviewer'].includes(marker.role) && RETURN_RESULTS.includes(marker.result)).length;
    if (returns >= config.maxReturns) return escalate(input, returns);
    return handOff(input, 'dev', devAiOf(input), { reason: `Returned by ${verdict.role} (${returns} of ${config.maxReturns}).` });
  }
  return actions;
}

function onApproval(input) {
  const pending = input.comments.flatMap((body) => parseMarkers(body, 'pending')).pop();
  if (!pending || !ROLE_STAGE[pending.role] || !AIS.includes(pending.ai)) return emptyActions();
  const actions = start(pending.role, pending.ai, input.target, { same: pending.same === 'true' });
  actions.remove.push(AWAITING);
  return actions;
}

function onTick(input) {
  const { target, config, now, lastActivityAt } = input;
  const stage = target.labels.find((label) => STAGE_ROLE[label]);
  if (!target.isPR || !stage || target.labels.includes(AWAITING) || !lastActivityAt) return emptyActions();
  const idleMinutes = (new Date(now) - new Date(lastActivityAt)) / 60000;
  if (idleMinutes < config.stallMinutes) return emptyActions();
  const role = STAGE_ROLE[stage];
  const current = labelAi(target.labels, 'ai:') || config.primary;
  const next = otherAi(config, current);
  const same = role !== 'dev' && next === devAiOf(input);
  return handOff(input, role, next, { same, reason: `No sign of life for ${Math.floor(idleMinutes)} minutes on ${current}.` });
}

function decide(rawInput) {
  const input = { comments: [], ...rawInput, config: readConfig(rawInput.config) };
  const { event, target } = input;
  let actions = emptyActions();

  if (event.type === 'labeled' && event.label === 'ready-for-agent' && !target.isPR) {
    actions = handOff(input, 'dev', input.config.primary, { reason: 'The ticket is ready.' });
    actions.remove.push('ready-for-agent');
  } else if (event.type === 'pr-opened' && target.isPR && (input.target.issueLabels || []).includes('in-progress')) {
    actions = reviewHandOff(input, 'qa', 'The Dev opened the pull request.');
    actions.add.push(`dev-ai:${devAiOf(input)}`);
    actions.issue.remove.push(...(input.target.issueLabels || []).filter((label) => label.startsWith('run:')));
  } else if (event.type === 'comment' && event.authorCanWrite) {
    const body = String(event.body || '').trim();
    if (body.split(/\s/)[0] === '/ok') {
      if (event.authorIsAdmin && target.labels.includes(AWAITING)) actions = onApproval(input);
    } else {
      const verdict = parseMarkers(body, 'verdict').pop();
      if (verdict && target.isPR) actions = onVerdict(input, verdict);
    }
  } else if (event.type === 'tick') {
    actions = onTick(input);
  }

  const result = finish(actions, target.labels);
  if (result.add.includes('ready-for-agent')) throw new Error('the dispatcher never applies ready-for-agent');
  return result;
}

module.exports = { decide, readConfig, parseMarkers, DEFAULT_CONFIG };
