# Progress

Resume pointer for any session that picks this work up. The agents repository now lives at https://github.com/GabrielSoares-Dev/agent-team (pull requests #2 merged, #3–#9 open); `repo/` here is the outdated first draft.

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

## Wave 3 (in progress)

Decisions: W1 (a) Release never deploys; it keeps the "next release" checklist (an issue labelled `release-notes`) and reacts to the DEPLOY workflow's result; W1a after every merge and after DEPLOY completes; W2 (a) no Maintenance agent: a Renovate PR whose CI fails gets a dispatcher comment asking `/ok` to start the Dev (even with supervision off); majors stay human tickets; W3 (a) Monitor deferred to the cloud phase; a deterministic uptime workflow checks `HEALTH_URL` every 15 minutes, twice a minute apart, and opens, updates or closes one `production-down` issue; W4 Coach weekly, only if a ticket had returns, escalations or stalls; one rule per pull request, in the project (`AGENTS.md`, `agents/overrides/**`, `docs/adr/**`), agent-team (`roles/**`, own skills) or the Template (`recipes/**`).

Plan: five pull requests in agent-team, each from `main`, no shared files, merged with Rebase and merge:

- [ ] `agents/dispatcher-wave-3` (branch pushed, rules and 7 tests done in `decide.js`): still to do `run.js` (merged PR → release issue, found or created with `release-notes`; `workflow_run` DEPLOY completed → `deployed`; `workflow_run` CI failed on a renovate[bot] PR → `dependency-ci-failed`; weekly cron `0 9 * * 1` → `coach-week` with the tickets of the last 7 days, issue `coach-report`), `labels.tsv` (+ `run:release`, `run:coach`, `release-notes`, `coach-report`, `production-down`), uptime (`checks/uptime.js` + test, `.github/workflows/uptime.yml`, `examples/uptime.yml`), `examples/agent-team.yml` (+ `workflow_run: [CI, DEPLOY]`, weekly cron), docs (dispatcher README, README team table, GLOSSARY).
- [ ] `agents/release`: `roles/release.md` (capability `tracker`), and the read-only tools gain `actions_list`, `actions_get`, `get_job_logs` in `bin/agents-sync`.
- [ ] `agents/coach`: `roles/coach.md` (capability `full`, `paths` of W4b).
- [ ] `agents/dev-dependency-fixes`: both Dev roles: on a dependency-update PR without an issue, the PR is the ticket; make CI pass without weakening anything; handoff note on the PR.
- [ ] `release/v0.2.0-changelog`: CHANGELOG v0.2.0.

Roles must not write `run:` labels in backticks (the labels test would fail before the dispatcher PR is merged).
