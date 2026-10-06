## What this repository is

The Template (this repository, named **Project Generator**): a project factory that generates Derived Projects (backend, web frontend and mobile app repositories) for AI-driven development. It is never copied; its skills read the recipes and create new repositories. Vocabulary in `GLOSSARY.md`, decisions in `docs/adr/`.

- `recipes/decision-guide.md`: how a Derived Project's technologies are chosen.
- `recipes/backend/`, `recipes/frontend/` (React: `react.md`), `recipes/mobile/`: Stack Recipes.
- `recipes/quality-gates.md`, `recipes/coding-standards.md`: what every generated repository must pass and how its code is written.
- `recipes/repository-layout.md`, `recipes/agent-rules.md`, `recipes/autonomous-runs.md`, `recipes/new-project.md`: what a generated repository contains, what each of its rule files holds, how the agent works in it, and how it is created.
- `recipes/dev-commands.md`: the `project` script every generated repository has (`project start:dev`, `project check`…), the same commands in every stack.
- `recipes/vscode-extensions.md`: the VS Code extensions each generated repository installs or recommends, per stack.
- `recipes/shared-workflows.md`: the catalog of reusable CI and deploy workflows every generated repository calls.

## Working on the Template

- **The generator changes with what it generates.** Whenever a change to a generated project affects how projects are generated (a fix, a new file, a different command, a user preference), apply it to the generator in the same step: the recipes and the `/new-project` skill. A generated project that passes while the generator still produces the old version is a bug, and the next run would repeat the failure.
- **The Template holds no project files** (ADR-0001): recipes describe every file precisely enough to write it, and the skill keeps only its own tools (`.claude/skills/new-project/tools/`). Do not copy a generated project's files into the Template.

## Language

Write everything technical that lands in the repository or on GitHub in English: code, logs, error codes, docs, tickets, specs, ADRs, commit messages and pull request descriptions. Text shown to end users of a Derived Project is in that product's language. Conversation with the user may be in Portuguese.

## Agent skills

### Issue tracker

Issues for the Template itself live as local markdown files under `.scratch/<feature>/`. Derived Projects use GitHub Issues instead. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
