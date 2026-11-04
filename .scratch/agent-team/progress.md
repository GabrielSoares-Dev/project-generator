# Progress

Resume pointer for any session that picks this work up. The agents repository lives at https://github.com/GabrielSoares-Dev/agent-team (v0.2.0 published; #33 open for v0.2.1); the first draft that lived in `repo/` here was removed.

Branch: `ccr-01cfecc5-xsr2sv` of `project-generator`.

## Steps

- [x] Spec with every decision (`spec.md`)
- [x] Tickets (`issues/`)
- [x] Repository skeleton (`repo/`: README, AGENTS.md, CLAUDE.md, ADRs, glossary)
- [x] Neutral role format (`repo/docs/role-format.md`)
- [x] Wave 1 roles (`repo/roles/dev.md`, `qa.md`, `reviewer.md`)
- [x] Vendored skills (`repo/skills/`, MIT, Matt Pocock) and own skills (handoff note, decision summary)
- [x] `agents-sync` renderer with `--check`, and its tests
- [x] Dispatcher reusable workflow and its config (`repo/dispatcher/`, 22 rule tests)
- [x] Install instructions for a project (`repo/README.md`, `repo/dispatcher/README.md`)
- [x] Ticket 06, Template side: recipes, `/new-project`, `project agents:*`, ADR-0014 (agent-team v0.1.1)

## Open for the user

- E2a–E2e (cloud generation), only needed at the New Project screen.
- Verdicts as marked comments instead of GitHub reviews (ticket 02).
- The Reviewer's Claude tools: strict, or with Bash or subagents (ticket 03).
- The dispatcher's design choices listed in ticket 05.

## Wave 3 (merged, v0.2.0)

Decisions: W1 (a) Release never deploys; it keeps the "next release" checklist (an issue labelled `release-notes`) and reacts to the DEPLOY workflow's result; W1a after every merge and after DEPLOY completes; W2 (a) no Maintenance agent: a Renovate PR whose CI fails gets a dispatcher comment asking `/ok` to start the Dev (even with supervision off); majors stay human tickets; W3 (a) Monitor deferred to the cloud phase; a deterministic uptime workflow checks `HEALTH_URL` every 15 minutes, twice a minute apart, and opens, updates or closes one `production-down` issue; W4 Coach weekly, only if a ticket had returns, escalations or stalls; one rule per pull request, in the project (`AGENTS.md`, `agents/overrides/**`, `docs/adr/**`), agent-team (`roles/**`, own skills) or the Template (`recipes/**`).

Plan: five pull requests in agent-team, each from `main`, no shared files, merged with Rebase and merge:

- [x] agent-team #28 (`agents/wave-3-dispatcher`): rules, `run.js`, uptime check, labels, examples, docs
- [x] agent-team #29: `roles/release.md` (the read-only workflow tools went into #28)
- [x] agent-team #30: `roles/coach.md`
- [x] agent-team #31: both Dev roles fix dependency-update pull requests
- [x] agent-team #32: CHANGELOG v0.2.0; after the merges, the human publishes the v0.2.0 release

Roles must not write `run:` labels in backticks (the labels test would fail before the dispatcher PR is merged).
