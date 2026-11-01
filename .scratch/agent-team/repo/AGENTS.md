## What this repository is

The agents of the user's projects (Dev, QA, Reviewer, and later more), written once in a neutral format and rendered for Claude Code and OpenAI Codex by `bin/agents-sync`. Projects pin a tag of this repository and commit the rendered files.

## Rules

- Work only through pull requests. Never merge, never push to `main`, never force-push; the human always merges.
- A role is an agent only when it needs an isolated context or different permissions; everything else is a skill or a check (ADR-0001).
- Write roles in the format of `docs/role-format.md`. Never edit rendered files; change the source and run `bin/agents-sync`.
- Own skills use only the standard `SKILL.md` frontmatter (`name`, `description`), so both tools read them.
- Vendored skills keep their license and a `SOURCE` file with the upstream repository and commit; change them only by re-vendoring.
- `tests/run.sh` must pass before a pull request is opened.
- Everything is in English. No explanatory comments in code.
- Never guess. When something is ambiguous, ask in the issue and stop.

## Where things are

- `README.md`: the team, the flow, the folders, installing.
- `docs/role-format.md`: how a role is written and rendered.
- `docs/adr/`: the decisions.
- `GLOSSARY.md`: the vocabulary.
