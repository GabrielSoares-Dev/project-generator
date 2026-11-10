# The dispatcher is Ensemble's, not a workflow of the project

A generated repository used to call agent-team's reusable dispatcher workflow from its own `.github/workflows/agent-team.yml`, on every label, comment and pull request and every ten minutes. That spent too many GitHub Actions minutes. The Ensemble platform now runs the same rules from its GitHub App's webhooks (agent-team ADR-0008; Ensemble ADR-0018 and ADR-0019), and the workflow was retired for good: agent-team v0.7.0 no longer ships it.

## Decision

- `/new-project` writes no `agent-team.yml`; the only agent team caller is `agent-paths.yml`.
- Activating the team includes installing the Ensemble GitHub App on every repository (`recipes/agent-team-activation.md`): without it, nothing moves the work between the roles.
- `AGENT_TEAM_READ_TOKEN` only needs Contents read on agent-team: the blockers in other repositories are read by Ensemble's App, and the `AGENT_TEAM_PAUSED` variable and the events token secrets no longer exist.

## Consequences

- A project generated before this decision deletes its `agent-team.yml` (`project agents:update` to agent-team v0.7.0 does it), or Ensemble's health flags it, since it would dispatch a second time.
