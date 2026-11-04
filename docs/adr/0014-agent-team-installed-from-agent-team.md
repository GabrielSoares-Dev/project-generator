# Derived Projects install the agent team from agent-team at a pinned release

A generated repository's agents used to be one Autonomous Run plus Matt Pocock's skills, which `/new-project` cloned from mattpocock/skills and copied in. They are now a team of roles (PM, Architect, Designer, the Dev of the repository's kind, QA, Reviewer) with a deterministic dispatcher, kept in their own repository, `github.com/GabrielSoares-Dev/agent-team`, which also vendors every skill the projects use and the `docs/agents/` files. `/new-project` writes `.agents/config.json` with agent-team's latest release and the repository's kind, runs agent-team's installer, and commits what it renders (the cloud session only sees the repository, ADR-0005). The project then updates with `project agents:update <tag>`, a pull request like any other.

## Considered Options

- **Keep vendoring mattpocock/skills from the Template**: rejected; the skills and the roles that load them would come from two sources at two versions, and agent-team's renderer refuses to overwrite files it did not write.
- **Describe the roles in the Template's recipes**: rejected; the agents change faster than the Template and are shared by every project (agent-team ADR-0003).

## Consequences

- `recipes/repository-layout.md` and `recipes/agent-rules.md` describe the installation instead of a skill list; the list lives in agent-team.
- `.template-version` records `agents=GabrielSoares-Dev/agent-team@<tag>` instead of a mattpocock/skills commit.
- `project check` fails when a rendered agent file drifts; branch protection requires agent-team's `paths / paths` check.
- The scheduled tasks that start each role live in the user's claude.ai account; `/new-project` lists them from the rendered `docs/agents/agent-team-setup.md` and never creates them.
- A repository generated before this ADR adopts the team once with `agents-install --adopt`.
