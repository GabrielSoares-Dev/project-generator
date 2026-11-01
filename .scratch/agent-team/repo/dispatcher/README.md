# Dispatcher

Moves the work between roles with fixed rules (ADR-0004). `decide.js` holds every rule and does no I/O; `run.js` reads the GitHub event, calls `decide`, and applies the labels and comments. It never applies `ready-for-agent` and never merges.

## Events

| Event | Rule |
|---|---|
| `ready-for-agent` applied to an issue (by the user) | Dev on the primary AI |
| Pull request opened that closes an `in-progress` issue | QA on the AI that did not write the code |
| Verdict `qa approved` | Reviewer on the AI that did not write the code |
| Verdict `qa returned` or `reviewer changes-requested` | Dev again, on the AI that wrote the code; the `maxReturns`-th return escalates instead |
| Verdict `dev ready` (the Dev answered a return) | QA again |
| Verdict `qa needs-info` | `needs-info` on the pull request and the issue |
| Verdict `reviewer approved` | `ready-for-human` |
| Every 10 minutes, a pull request with no commit or comment for `stallMinutes` | The same role on the other AI; a review that lands on the Dev's model gets `same-model-review` |
| `/ok` from a repository admin | Runs the hand-off supervised mode is holding |

Verdicts are comments ending with `<!-- agent-team verdict role=<role> result=<result> -->`. Only comments from accounts with write access, or installed apps, count. Returns are counted from the verdicts on the pull request, so the dispatcher keeps no state.

A ticket without a pull request never fails over (it waits for the primary's quota). Escalations and `ready-for-human` are never held by supervised mode.

## Labels

| Label | Meaning |
|---|---|
| `ready-for-agent`, `in-progress`, `ready-for-qa`, `ready-for-review`, `ready-for-human`, `needs-info` | The stage |
| `run:dev`, `run:qa`, `run:reviewer`, `run:decision-summary` | Starts that role on Claude; only these trigger Claude's scheduled tasks |
| `ai:claude`, `ai:codex` | The AI running the current stage |
| `dev-ai:claude`, `dev-ai:codex` | The AI that wrote the code |
| `same-model-review`, `escalated`, `awaiting-ok` | Markers |

Codex is started by a comment: `@codex Act as the <role> agent defined in .codex/agents/<role>.toml …`.

## Setup in a project

1. Copy `examples/agent-team.yml` to `.github/workflows/` and `examples/config.json` to `.agents/config.json`; set `OWNER` and the pinned tag.
2. On claude.ai, create one scheduled task per `run:` label, triggered when that label is added to an issue or pull request of the repository, with the prompt: `Act as the <role> agent (.claude/agents/<role>.md) on the issue or pull request that triggered this run, and follow it exactly.` (`decision-summary` uses the `decision-summary` skill.)
3. Connect Codex to the repository (Codex cloud with the GitHub integration).
4. Keep `"supervised": true` for the first tickets; set it to `false` when you trust the team.

## Unconfirmed

To check on the first real run: that label changes made with the workflow's token reach Claude's scheduled tasks (GitHub does not start other workflows from them, but apps receive the webhooks); that `@codex` from the workflow's bot starts a Codex task; the login of Codex's and Claude's bots for the write check.
