'use strict';

const fs = require('node:fs');
const { decide } = require('./decide');

const API = process.env.GITHUB_API_URL || 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const STAGES = ['in-progress', 'ready-for-qa', 'ready-for-review'];
const LINK = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/i;

async function github(method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 404 && method === 'DELETE') return null;
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

async function all(path) {
  const items = [];
  for (let page = 1; ; page += 1) {
    const batch = await github('GET', `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    items.push(...batch);
    if (batch.length < 100) return items;
  }
}

const names = (labels) => labels.map((label) => (typeof label === 'string' ? label : label.name));

async function permission(user) {
  if (user.type === 'Bot') return { canWrite: true, isAdmin: false };
  try {
    const { permission: level } = await github('GET', `/repos/${REPO}/collaborators/${user.login}/permission`);
    return { canWrite: ['admin', 'maintain', 'write'].includes(level), isAdmin: level === 'admin' };
  } catch {
    return { canWrite: false, isAdmin: false };
  }
}

async function prTarget(number, prBody) {
  const issueNumber = Number((String(prBody || '').match(LINK) || [])[1]) || null;
  const pr = await github('GET', `/repos/${REPO}/issues/${number}`);
  const issueLabels = issueNumber ? names((await github('GET', `/repos/${REPO}/issues/${issueNumber}`)).labels) : [];
  return { isPR: true, number, issueNumber, labels: names(pr.labels), issueLabels };
}

async function commentsOf(number) {
  return (await all(`/repos/${REPO}/issues/${number}/comments`)).map((comment) => comment.body);
}

async function apply(target, result) {
  for (const label of result.remove) await github('DELETE', `/repos/${REPO}/issues/${target.number}/labels/${encodeURIComponent(label)}`);
  if (result.add.length) await github('POST', `/repos/${REPO}/issues/${target.number}/labels`, { labels: result.add });
  for (const body of result.comments) await github('POST', `/repos/${REPO}/issues/${target.number}/comments`, { body });
  if (target.issueNumber) {
    for (const label of result.issue.remove) await github('DELETE', `/repos/${REPO}/issues/${target.issueNumber}/labels/${encodeURIComponent(label)}`);
    if (result.issue.add.length) await github('POST', `/repos/${REPO}/issues/${target.issueNumber}/labels`, { labels: result.issue.add });
  }
  const changed = result.add.length + result.remove.length + result.comments.length;
  console.log(`#${target.number}: +[${result.add}] -[${result.remove}] ${result.comments.length} comment(s)${changed ? '' : ' (nothing to do)'}`);
}

async function lastActivity(number) {
  const commits = await all(`/repos/${REPO}/pulls/${number}/commits`);
  const comments = await all(`/repos/${REPO}/issues/${number}/comments`);
  const dates = [
    ...commits.map((commit) => commit.commit.committer.date),
    ...comments.map((comment) => comment.updated_at),
  ];
  return dates.sort().pop() || null;
}

async function main() {
  const config = JSON.parse(fs.readFileSync(process.env.AGENT_TEAM_CONFIG || '.agents/config.json', 'utf8'));
  const eventName = process.env.GITHUB_EVENT_NAME;
  const payload = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const now = new Date().toISOString();

  if (eventName === 'issues' && payload.action === 'labeled' && !payload.issue.pull_request) {
    const target = { isPR: false, number: payload.issue.number, labels: names(payload.issue.labels) };
    return apply(target, decide({ event: { type: 'labeled', label: payload.label.name }, target, config }));
  }

  if (eventName === 'pull_request' && payload.action === 'opened') {
    const target = await prTarget(payload.pull_request.number, payload.pull_request.body);
    return apply(target, decide({ event: { type: 'pr-opened' }, target, config }));
  }

  if (eventName === 'issue_comment' && payload.action === 'created') {
    const number = payload.issue.number;
    const target = payload.issue.pull_request
      ? await prTarget(number, (await github('GET', `/repos/${REPO}/pulls/${number}`)).body)
      : { isPR: false, number, labels: names(payload.issue.labels) };
    const { canWrite, isAdmin } = await permission(payload.comment.user);
    const comments = (await commentsOf(number)).filter((body) => body !== payload.comment.body);
    const event = { type: 'comment', body: payload.comment.body, authorCanWrite: canWrite, authorIsAdmin: isAdmin };
    return apply(target, decide({ event, target, comments, config }));
  }

  if (eventName === 'schedule' || eventName === 'workflow_dispatch') {
    const pulls = await all(`/repos/${REPO}/pulls?state=open`);
    for (const pull of pulls) {
      if (!names(pull.labels).some((label) => STAGES.includes(label))) continue;
      const target = await prTarget(pull.number, pull.body);
      const lastActivityAt = await lastActivity(pull.number);
      await apply(target, decide({ event: { type: 'tick' }, target, config, now, lastActivityAt }));
    }
    return undefined;
  }

  console.log(`ignored: ${eventName} ${payload.action || ''}`);
  return undefined;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
