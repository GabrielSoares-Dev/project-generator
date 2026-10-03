# Autonomous Runs happen in Claude Code cloud sessions, not on a VPS

The original plan was to rent a VPS and leave the agent running there. Instead, Autonomous Runs are started on demand from the Claude mobile app (Code tab) and run in Anthropic-managed cloud sessions: no server to maintain, push notifications on the phone, Docker available for integration tests, and usage drawn from the existing subscription with no extra compute charge. Running unattended on a VPS would also have needed API-key billing, since subscription login is meant for ordinary interactive use.

## Considered Options

- **Remote Control on a VPS**: kept as a fallback for a Derived Project that needs something the cloud cannot provide (private network, heavy services).
- **`@claude` mentions via GitHub Actions**: rejected as the main trigger; it spends API tokens or subscription plus Actions minutes, and is driven by issue comments rather than a session you can follow.

## Consequences

- Everything the agent needs must be in the repository or in the cloud environment's settings: user-installed plugins (such as agent skills) do not follow the agent there, and secrets are configured per cloud environment, never read from a local `.env`.
- Agent skills (Matt Pocock's set) are vendored into `.claude/skills/` in the Template and copied into every repository the Template creates, instead of being installed as a user plugin. The local plugin install is removed to avoid every skill appearing twice.
