# Role format

A role is one Markdown file in `roles/`, named after the role (`roles/qa.md`). `bin/agents-sync` renders it for each tool.

## Frontmatter

```yaml
---
name: qa
description: One sentence saying when the role is used, for the tools' agent pickers.
capability: tests-only
skills: handoff-note, tdd
---
```

| Key | Values |
|---|---|
| `name` | lower-case, the file name without `.md` |
| `description` | one line |
| `capability` | `read-only`, `tests-only` or `full` |
| `skills` | comma-separated skill folders of `skills/` the role relies on |

## Body

These sections, in this order, all required:

1. `## Mission`: what the role is for, in two or three sentences.
2. `## Inputs`: what it reads (the issue, the pull request, the handoff note) and what it must not read.
3. `## Steps`: numbered, what it does.
4. `## Outputs`: what it leaves behind (commits, comments, labels).
5. `## Labels`: the transitions it makes.
6. `## Never`: what it must never do.

## Capabilities

| Capability | Claude Code (`.claude/agents/<name>.md`) | Codex (`.codex/agents/<name>.toml`) | Also enforced by |
|---|---|---|---|
| `read-only` | `tools`: read, search and GitHub comment tools only; no Edit, Write or Bash | `sandbox_mode = "read-only"` | the dispatcher ignores its commits |
| `tests-only` | every tool | `sandbox_mode = "workspace-write"` | a CI check that its commits touch only test paths |
| `full` | every tool | `sandbox_mode = "workspace-write"` | branch protection (no merge, no push to `main`) |

## Overrides

A project's `agents/overrides/<name>.md` is plain Markdown appended to the rendered role under `## Additions for this project`. It may add rules; text that contradicts the role's `## Never` is a review error, since the check cannot judge meaning.
