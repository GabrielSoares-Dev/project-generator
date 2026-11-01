# Roles run on Claude Code or Codex, with failover when quota runs out

Each role is a neutral document rendered into the files each tool reads (`.claude/agents/*.md`, `.codex/agents/*.toml`, the skills in `.claude/skills/` and `.agents/skills/`). The second AI is a failover, not a per-role choice: Claude is the primary and Codex the fallback by default, configurable per project. Both run in their vendor's cloud on the user's subscription, extending ADR-0005 of the Template.

Work survives a switch because its state is in GitHub: every role pushes after each green test and keeps one handoff note on the issue. Codex only takes over work that already has a pull request (it is started by a `@codex` comment there); a ticket without one waits for the primary's quota. Failover fires on a usage-limit failure or after 30 minutes without a commit, comment or event.

When both AIs have quota, the Reviewer and QA run on the model the Dev did not use; when only one has, it reviews its own model's code and the pull request is labelled `same-model-review`.

## Considered Options

- **One AI per role**: rejected; the user wants continuity when quota runs out, not specialisation.
- **The tools' own formats written by hand**: rejected; two copies drift.
- **Agent SDKs with API keys on a server**: rejected for now; per-token cost and a server to run. Kept as a later layer if both subscriptions run out often.

## Consequences

- Only portable features are shared: `AGENTS.md`, standard `SKILL.md` frontmatter, GitHub. Hooks and subagent options stay per tool.
- Several Codex facts (the skills folder, the agent TOML keys, `@codex` on issues) are unconfirmed and are verified first-hand before the first release.
