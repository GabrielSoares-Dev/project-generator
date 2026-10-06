# 05: Full run and recipe corrections

**What to build:** the exit criterion of the slice. Run `/new-project` from the interview to the end into a throwaway directory, then start backend and frontend together and use them. Everything that breaks or needed manual intervention becomes a correction in the recipes or the skill, with the reason recorded. Repeat with a second set of answers until a run is clean. Then record what the run taught about the recipe format, to decide adjustments before the remaining recipes (ADR-0001).

**Blocked by:** 03 (Interview and plan with confirmation), 04 (Agent rules in the generated repositories)

**Status:** second run done (Task Board); blocked on ticket 04 for the agent-rules files, and on one design decision (see Recipe format)

- [~] A run with no manual intervention produces both repositories with every local gate green: Task Board passed every gate on its own, first attempt for the backend. Two reservations: the backend was written from the recipes plus the first run as reference, and the frontend was copied from the first run and adapted by the interview's answers (a permission block on the copy, then granted), so this run proves the interview and the process, not that the recipes alone reproduce the files
- [x] Backend and frontend start together and the frontend reaches the backend's `GET /health` (headless Chrome: Status ok, Versão dev, Banco de dados up, no console errors)
- [x] A second run with different answers than the first is also clean (Invoice Manager, indigo, 0.625rem, system font; then Task Board, teal, 0.25rem, Inter)
- [x] Each correction made to a recipe or the skill is listed with its reason (see below and tickets 01 and 02)
- [x] A short note lists recipe format adjustments suggested by the runs (below)
- [x] The throwaway output is deleted at the end (run 1 and the Task Board folder, with their containers, volumes and images, on the user's instruction)

## Corrections from the second run

| Found | Why | Fixed in |
|---|---|---|
| "Not yet available" confused the user | It reads as "the code cannot be written" | `recipes/new-project.md`, skill: it means no recipe proven by passing every gate; technology is decided by the agent with its reason |
| The strip tool re-indents multi-line type docblocks | It rewrites them without the class indentation | none needed: the formatter fixes it (Pint `phpdoc_indent`) |
| `phpunit/phpunit` resolved to 13.x instead of 12.5 | Newest version the stack supports | none needed: every test passed |
| orval names the schemas file after the API title | `info.title` is the project slug | `recipes/frontend/react.md` item 6 |
| The font came from a third-party link in the first design | Runtime request to Google | `recipes/frontend/react.md` item 13: `@fontsource-variable/<font>` |

## Recipe format

- **The mechanical files are the weak point of "recipes only".** Prose describes the ESLint config, the dependency-cruiser rules, the Docker files and the scripts, but writing them from prose each run is slow, expensive in tokens and may drift from what passed the gates. Both runs reproduced them from a reference. Options were (a) exact code blocks inside the recipes, (b) a scripted generator, (c) accept the cost. **Decided on 2026-10-06: accept the cost** (ADR-0001, Consequences): fixed templates are one more thing to keep in step with every tool change. With the run 1 and Task Board folders deleted there is no reference left, so every recipe must be precise enough to follow alone; each gap found in a future run is closed in the recipe.
- The cost of a run is dominated by rewriting near-identical large files and by the gate output; the first run was several times costlier than a clean one.
- Unproven paths: dark mode off, a language other than pt-BR, a color that needs a dark foreground, Windows-less machines.
