# Agent Team

The development agents of the user's projects, written once and run on **Claude Code** or **OpenAI Codex**. Each role is a neutral document; `bin/agents-sync` renders it into the files each tool reads. GitHub (labels, issues, pull requests, comments) is the only channel between roles, and a deterministic dispatcher moves the work between them.

The user is the tech lead: they prioritise, break ties, approve ADRs and new rules, and merge.

## The team

| Wave | Role | Does | Capability |
|---|---|---|---|
| 1 | **Dev** | Implements a ticket with TDD and opens the pull request | `full` |
| 1 | **QA** | Verifies the pull request against the acceptance criteria; only adds tests | `tests-only` |
| 1 | **Reviewer** | Reviews the code against the project's standards, with a security pass; only comments | `read-only` |
| 2 | PM, Architect, Designer | Before the code | not written yet |
| 3 | Release, Maintenance, Production Monitor, Coach | After the merge | not written yet |

## The flow

```
ready-for-agent ─► in-progress ─(Dev opens PR)─► ready-for-qa ─(QA)─► ready-for-review ─(Reviewer)─► ready-for-human ─(user)─► merge
                       ▲                              │                      │
                       └────────── returned (+1) ─────┴──────────────────────┘
3 returns ─► ready-for-human (escalated, with a decision summary)
vague criteria (QA) ─► needs-info
no sign of life for 30 minutes on a pull request ─► the fallback AI takes over
```

## Folders

| Path | Holds |
|---|---|
| `roles/` | One neutral document per role (`docs/role-format.md`) |
| `skills/` | Skills the roles call, in the standard `SKILL.md` format: vendored ones under their license, and the team's own |
| `bin/agents-sync` | Renders roles and skills into a project, and checks for drift |
| `dispatcher/` | The reusable workflow that moves work between roles (not written yet) |
| `docs/adr/` | The decisions of this repository |
| `tests/` | Tests of `bin/agents-sync` |

## Installing in a project

From the project's root, with this repository checked out at a pinned tag:

```sh
path/to/agent-team/bin/agents-sync --project .           # render
path/to/agent-team/bin/agents-sync --project . --check   # fail on drift
```

It writes, and the project commits:

| File | Read by |
|---|---|
| `.claude/agents/<role>.md` | Claude Code |
| `.codex/agents/<role>.toml` | Codex |
| `.claude/skills/<skill>/` | Claude Code |
| `.agents/skills/<skill>/` | Codex |

A project adds rules to a role in `agents/overrides/<role>.md`; they are appended, never replace the role's own rules. Rendered files are never edited by hand: the check fails.

The pinned version, `./project agents:sync` and `./project agents:update` are described in the Template's recipes (ticket 06).
