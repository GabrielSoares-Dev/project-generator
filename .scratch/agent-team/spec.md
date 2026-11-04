# Agent Team: AI-agnostic development agents and the platform to lead them

Status: built. The agent team lives in https://github.com/GabrielSoares-Dev/agent-team (v0.2.0: Waves 1, 2 and 3); the Template installs it (ADR-0014). The cloud generation mode (E2a–E2e) is still open. Decisions taken after the first grilling are under *Later decisions*; where they differ from the tables, they win.

## Problem

Derived Projects already run one agent: the Autonomous Run (`Implement issue #N`, `/tdd`, `/pr`, `./project check`, triage labels). The user wants a **team** of agents with separate roles (Dev, QA, Reviewer, and later more), usable with **Claude Code and OpenAI Codex**, and later a **platform** to observe, talk to and lead that team. The user is the tech lead.

## Decisions

### How the agents run

| Id | Decision |
|---|---|
| A1 | The agents are AI-agnostic: they run on Claude Code and on OpenAI Codex. |
| A1.1 | Role definitions are neutral documents; the orchestration happens through GitHub (labels, issues, pull requests, comments), so any agent that reads an issue and opens a pull request fits. Each tool keeps its own features (hooks, subagents); there is no lowest common denominator. |
| A1.2 | The second AI is a **failover** when the first one runs out of quota, not a per-role choice. |
| A1.2a | Claude is the primary, Codex the fallback; the primary is configurable per project. |
| A1.2b | Agents push after every green test and keep one **handoff note** as a single comment on the issue, edited in place (done / left / next step). Both the fallback and the primary itself (after its quota resets) resume from it. |
| A1.2c | Review by a different model than the Dev when both have quota; when only one has, the same model reviews and the pull request gets the `same-model-review` label. Nothing waits. |
| A1.3 | Each AI runs in its vendor's cloud on the user's subscription (extends ADR-0005). Failover is detected indirectly. |
| A1.3a | Claude is started by Claude Code scheduled tasks triggered by GitHub label events (research preview). Plan B: `claude-code-action` with `CLAUDE_CODE_OAUTH_TOKEN`. |
| A1.3b | No draft pull request is opened up front; `/pr` stays as it is. |
| A1.3c | Failover fires on a usage-limit failure, or after **30 minutes** with no commit, comment or event; configurable per project. |
| A1.3d | Codex only takes over work that **already has a pull request** (started by a `@codex` comment on it). A ticket without a pull request waits for Claude's quota. |
| A2 | Each role is written once in a neutral format; `agents:sync` renders the Claude (`.claude/agents/*.md`) and Codex (`.codex/agents/*.toml`) versions and copies the skills from `.agents/skills/` to `.claude/skills/`. A check fails when a rendered file differs from its source. |
| A4 | A **deterministic dispatcher** (a GitHub Actions workflow with fixed rules, no AI) moves labels, starts each role, counts returns and runs the failover. A coordinating AI may come later only to observe. |

### The team

| Id | Decision |
|---|---|
| A3a | A role becomes an agent only when it needs an isolated context or different permissions; everything else is a skill or a check. |
| A3b | Three waves. **Wave 1**: Dev, QA, Reviewer (security as a Reviewer skill). **Wave 2**: PM (triage skill), Architect (contract-keeper skill for `openapi.json`), Designer. **Wave 3**: Release, Maintenance, Production Monitor, Coach. |
| — | No tech-lead agent: the user is the tech lead. |
| B1 | QA only **adds tests** and never changes production code; enforced by a CI check on the paths its commits touch. |
| B2 | Reviewer only **comments**; enforced by configuration (no edit/write tools on Claude, read-only sandbox on Codex). |
| B3 | After **3 returns** (QA plus Reviewer) the ticket escalates to the user (`ready-for-human`) with a summary of the disagreement. The dispatcher counts returns from label changes. |
| B4 | QA tests only against the issue's acceptance criteria; vague criteria send the issue to `needs-info` with the questions. Issues use a template with verifiable acceptance criteria. |
| B5 | Label flow: `ready-for-agent` → `in-progress` → `ready-for-qa` → `ready-for-review` → `ready-for-human` → merge; returns go back to `in-progress`; `needs-info` from QA; `same-model-review` as a marker. |
| D1 | Every escalation carries a **decision summary** (what is at stake, each agent's position, the evidence, a recommendation), written by an Observer skill. |
| D2 | Only the user decides: priority (`ready-for-agent`), tie-breaks, ADR approval, new rules in `AGENTS.md` and the recipes, merge. The dispatcher never applies `ready-for-agent`; no agent can merge. |

### Where the agents live

| Id | Decision |
|---|---|
| C1 | Not rolled into existing projects (SpeakBigO). |
| C1a | A dedicated **agents repository** is the source of truth; projects install from it and the Template points to it. |
| C1b | No sandbox inside it; the agents debut on a new project. |
| C1c | A project installs a **pinned version** (tag); the rendered files are committed in the project (ADR-0005: the cloud only sees the repository); `agents:update` bumps the version through a pull request. |
| C1d | Per-project additions in `agents/overrides/<role>.md`, appended at sync; an override only adds rules, never removes them. |
| C1e | The dispatcher lives in the agents repository as a reusable workflow, versioned with the roles. |
| C1g | Later: practice tickets with planted bugs in the agents repository as regression tests for the roles. |
| C2 | **Supervised mode** for the first 5 tickets of the first project: the dispatcher asks the user before every hand-off; the user switches it off per project. |

### The platform

| Id | Decision |
|---|---|
| Q1 | For the user only: no accounts for others, no multi-tenancy, no billing. |
| Q3 | GitHub is the state of the work; the platform stores only what GitHub lacks (agent events, history of decisions, metrics). |
| Q4 | A Derived Project generated by the Template, **built by the agents** (Q4b). |
| Q6 | Its stack is chosen in the `/new-project` interview through the decision guide. |
| Q7 | It is the agents' debut project; the risk is accepted, covered by supervised mode and manual merge. |
| Q5 | Its first slice is decided when the agents are ready. Ideas from the sketch: Decisions inbox (supervised-mode confirmations first) and a read-only Control Room. |
| — | The platform never starts an agent: its buttons change labels or write comments, and the dispatcher reacts. |
| E1 | On the platform, the PM asks the product questions, the Architect applies the decision guide and builds the recommendation table, the user confirms each choice; the output is a **plan file** in a defined format that `/new-project` reads. |
| E2 | Project generation from a plan runs **unattended in a cloud session** (changes the "local and interactive" rule of `recipes/new-project.md`; needs its own ADR). Open: E2a trigger, E2b confirmation, E2c credentials, E2d failing gates, E2e VPS setup. |
| E3 | Order: agents → platform (created by the user with today's local `/new-project`) → Wave 2 → New Project screen with cloud generation. |

## Order of work

1. Agents repository: layout, neutral role format, `agents:sync` with its drift check.
2. Wave 1 roles: Dev, QA, Reviewer, with their permissions.
3. Dispatcher: labels, return counter, failover, supervised mode.
4. Template: recipes, `/new-project` installing the agents, the missing vendored skills.
5. `/new-project` for the platform.
6. The trio builds the platform in supervised mode; the user writes the tickets.
7. Wave 2, then Wave 3.

## Known gaps

- The Codex facts (skills folder, hook matchers, `@codex` on issues, SDK billing) came from search snippets; `developers.openai.com` is blocked in the cloud network.
- Per-run cost may not be visible on subscription billing.
- Live events on the platform need the cloud environments' network to reach it.
- ADR-0005 says Matt Pocock's skills are vendored into the Template, but only `new-project` is there; the agents repository vendors them instead.

## Later decisions

| Id | Decision |
|---|---|
| — | **Claude only for now** (agent-team ADR-0007): no Codex failover; supersedes A1.2, A1.2a, A1.2c, A1.3c and A1.3d. A silent role is restarted once; a second stall escalates with `stalled`. Codex files are still rendered. |
| — | The Dev is split per repository kind, `dev-backend` and `dev-frontend`, each carrying the Template's standards (agent-team ADR-0005). |
| — | agent-team vendors every skill and `docs/agents/` (agent-team ADR-0006); the Template stops cloning mattpocock/skills (ADR-0014). |
| P1–P3, R1–R4, G1 | Wave 2: the PM interviews the human on the issue (the platform's chat writes the comments; each message starts the PM through its scheduled task's API trigger, or `run:pm` without the platform) and writes the final ticket; the Architect plans, and for a complex feature writes an architecture plan with Mermaid diagrams the human approves by merging; separate services only for a written reason; the Designer specifies the screen. |
| W1–W4 | Wave 3: the Release never deploys, it keeps the `release-notes` issue and reports the `DEPLOY` result; no Maintenance agent (a Renovate PR whose CI fails asks `/ok` for the Dev); the Production Monitor waits for the cloud phase, an uptime check opens `production-down`; the Coach proposes one rule per pull request, weekly, in the project, agent-team or the Template. |
| — | Agent commits carry `Agent-Role: <role>`; the `agent-paths` check keeps QA in the tests, the Architect in `docs/design/` and `docs/adr/`, the Coach in rule files, and read-only and tracker roles out of commits. |

