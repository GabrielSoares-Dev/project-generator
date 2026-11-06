# 06: Installing the agents in a project, and the Template side

**What to build:** how a project pins and updates the agents (C1c) and how the Template installs them (`recipes/`, `/new-project`), applied in the same step per the Template's rule.

**Blocked by:** 03, 05

**Status:** done, proven by the Ensemble run (2026-11): both repositories pin agent-team, render the team, run `agents:check` in `project check` and `paths` in CI; the activation outside the repositories is `recipes/agent-team-activation.md`

- [x] `.agents/config.json` pins agent-team's tag; `project agents:sync` renders; `project agents:update <tag>` bumps it (agent-team v0.1.1)
- [x] `project check` runs `agents:check` (`recipes/dev-commands.md`)
- [x] The `agent-paths` check runs in CI and is a required check (`recipes/github-setup.md`)
- [x] Recipes describe the files (`repository-layout.md`, `agent-rules.md`, `github-setup.md`, `autonomous-runs.md`); `/new-project` installs them (steps 12 and 15); ADR-0014, and ADR-0005's consequence updated
- [x] `.github/ISSUE_TEMPLATE/ticket.md` with verifiable acceptance criteria (B4)
- [x] `/new-project` stops cloning mattpocock/skills: the skills and `docs/agents/` come from the agent-team repository at its pinned tag (agent-team ADR-0006). Update `recipes/repository-layout.md` (Vendored skills: the list moves to agent-team), `recipes/agent-rules.md` (Vendored skills, `docs/agents/`, `.template-version` records `agents=GabrielSoares-Dev/agent-team@<tag>` instead of `skills=mattpocock/skills@<commit>`), the `new-project` skill (step 12), and ADR-0005's consequence about vendoring skills into the Template
- [x] Existing projects (SpeakBigO) adopt with `agents-install --adopt` (`recipes/agent-rules.md`); not run on SpeakBigO (C1)

## Comments

- The user chose option (b): the agent-team repository is the source of every vendored skill and of `docs/agents/`; agent-team #3 (skills) and #9 (`project-docs/` rendering and `--adopt`).

- Also: the frontend's Prettier, ESLint and jscpd ignore `.agents`, `.codex` and `docs/agents`; the `.dockerignore` lists of `php.md` and `vps-deploy.md` exclude `.agents`, `.codex` and `agents`.
- To prove on the next `/new-project` run: the install, `agents:check` failing after a hand edit, `paths / paths` failing once, `agents-labels` on GitHub.
