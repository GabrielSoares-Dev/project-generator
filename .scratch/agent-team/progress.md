# Progress

Resume pointer for any session (or a scheduled resume) that picks this work up. The agents repository is drafted in `repo/` here until the user creates it on GitHub; then the folder is copied there and removed from the Template.

Branch: `ccr-01cfecc5-xsr2sv` of `project-generator`.

## Steps

- [x] Spec with every decision (`spec.md`)
- [x] Tickets (`issues/`)
- [x] Repository skeleton (`repo/`: README, AGENTS.md, CLAUDE.md, ADRs, glossary)
- [x] Neutral role format (`repo/docs/role-format.md`)
- [x] Wave 1 roles (`repo/roles/dev.md`, `qa.md`, `reviewer.md`)
- [x] Vendored skills (`repo/skills/`, MIT, Matt Pocock) and own skills (handoff note, decision summary)
- [x] `agents-sync` renderer with `--check`, and its tests
- [x] Dispatcher reusable workflow and its config (`repo/dispatcher/`, 22 rule tests)
- [x] Install instructions for a project (`repo/README.md`, `repo/dispatcher/README.md`)
- [ ] Ticket 06, Template side (recipes, `/new-project`, `./project agents:*`): waits for the repository's name and first tag

## Open for the user

- Name of the agents repository on GitHub.
- E2a–E2e (cloud generation), only needed at the New Project screen.
- Verdicts as marked comments instead of GitHub reviews (ticket 02).
- The Reviewer's Claude tools: strict, or with Bash or subagents (ticket 03).
- The dispatcher's design choices listed in ticket 05.
