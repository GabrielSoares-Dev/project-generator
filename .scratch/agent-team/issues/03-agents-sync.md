# 03: agents-sync renderer and drift check

**What to build:** a dependency-free renderer (POSIX shell and awk, so it runs in any stack's dev container) that reads `roles/*.md`, the project's `agents/overrides/*.md` and `skills/`, and writes the Claude and Codex files into a project; `--check` exits non-zero when any rendered file differs (A2, C1d).

**Blocked by:** 01

**Status:** done (pending first-hand check of the Codex facts)

- [x] Renders `.claude/agents/<role>.md` (frontmatter `name`, `description`, `tools` from the capability) and `.codex/agents/<role>.toml` (`name`, `description`, `sandbox_mode`, `developer_instructions`)
- [x] Copies `skills/` to `.agents/skills/` and `.claude/skills/`
- [x] Appends `agents/overrides/<role>.md` under an "Additions for this project" heading; an override cannot remove text
- [x] Writes a header in every rendered file saying it is generated and where its source is
- [x] `--check` reports each differing file and fails
- [x] Tests cover render, override, check pass and check fail

Unconfirmed facts to verify first-hand before release: Codex reads `.agents/skills`; Codex agent TOML keys.

## Comments

- `tests/run.sh`: 14 tests pass under `sh` and `dash`.
- Rendered files are tracked in `.agents/agent-team.manifest`, so the sync removes a deleted role's files and refuses to overwrite a project's own files (for example its own `.claude/skills/<name>`).
- Open for the user: the Reviewer's Claude `tools` have no `Bash` (so it cannot edit files through the shell), which also means no `git diff` (it reads the diff through the GitHub tools) and no subagents, which the vendored `code-review` skill uses. Options: keep it strict; add `Bash` and rely on the dispatcher ignoring its commits; or add only the subagent tool.
