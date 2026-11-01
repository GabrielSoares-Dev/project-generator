# 03: agents-sync renderer and drift check

**What to build:** a dependency-free renderer (POSIX shell and awk, so it runs in any stack's dev container) that reads `roles/*.md`, the project's `agents/overrides/*.md` and `skills/`, and writes the Claude and Codex files into a project; `--check` exits non-zero when any rendered file differs (A2, C1d).

**Blocked by:** 01

**Status:** in progress

- [ ] Renders `.claude/agents/<role>.md` (frontmatter `name`, `description`, `tools` from the capability) and `.codex/agents/<role>.toml` (`name`, `description`, `sandbox_mode`, `developer_instructions`)
- [ ] Copies `skills/` to `.agents/skills/` and `.claude/skills/`
- [ ] Appends `agents/overrides/<role>.md` under an "Additions for this project" heading; an override cannot remove text
- [ ] Writes a header in every rendered file saying it is generated and where its source is
- [ ] `--check` reports each differing file and fails
- [ ] Tests cover render, override, check pass and check fail

Unconfirmed facts to verify first-hand before release: Codex reads `.agents/skills`; Codex agent TOML keys.
