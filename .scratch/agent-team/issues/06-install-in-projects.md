# 06: Installing the agents in a project, and the Template side

**What to build:** how a project pins and updates the agents (C1c) and how the Template installs them (`recipes/`, `/new-project`), applied in the same step per the Template's rule.

**Blocked by:** 03, 05

**Status:** ready

- [ ] `agents.lock` (or equivalent) pins the agents repository tag; `./project agents:sync` renders; `./project agents:update` bumps the tag in a pull request
- [ ] `./project check` runs the drift check
- [ ] The QA path check runs in CI
- [ ] Recipes describe the files; `/new-project` installs them; ADR-0005's vendored-skills consequence updated to point to the agents repository
- [ ] Issue template with verifiable acceptance criteria (B4)
- [ ] `/new-project` stops cloning mattpocock/skills: the skills and `docs/agents/` come from the agent-team repository at its pinned tag (agent-team ADR-0006). Update `recipes/repository-layout.md` (Vendored skills: the list moves to agent-team), `recipes/agent-rules.md` (Vendored skills, `docs/agents/`, `.template-version` records `agents=GabrielSoares-Dev/agent-team@<tag>` instead of `skills=mattpocock/skills@<commit>`), the `new-project` skill (step 12), and ADR-0005's consequence about vendoring skills into the Template
- [ ] Existing projects (SpeakBigO) run `agents-sync --adopt` once, when they adopt the agents

## Comments

- The user chose option (b): the agent-team repository is the source of every vendored skill and of `docs/agents/`; agent-team #3 (skills) and #9 (`project-docs/` rendering and `--adopt`).
