# 06: Installing the agents in a project, and the Template side

**What to build:** how a project pins and updates the agents (C1c) and how the Template installs them (`recipes/`, `/new-project`), applied in the same step per the Template's rule.

**Blocked by:** 03, 05

**Status:** ready

- [ ] `agents.lock` (or equivalent) pins the agents repository tag; `./project agents:sync` renders; `./project agents:update` bumps the tag in a pull request
- [ ] `./project check` runs the drift check
- [ ] The QA path check runs in CI
- [ ] Recipes describe the files; `/new-project` installs them; ADR-0005's vendored-skills consequence updated to point to the agents repository
- [ ] Issue template with verifiable acceptance criteria (B4)
