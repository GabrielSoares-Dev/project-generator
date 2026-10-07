# 05: Full run and recipe corrections

**What to build:** the exit criterion of the slice. Run `/new-project` from the interview to the end into a throwaway directory, then start backend and frontend together and use them. Everything that breaks or needed manual intervention becomes a correction in the recipes or the skill, with the reason recorded. Repeat with a second set of answers until a run is clean. Then record what the run taught about the recipe format, to decide adjustments before the remaining recipes (ADR-0001).

**Blocked by:** 03 (Interview and plan with confirmation), 04 (Agent rules in the generated repositories)

**Status:** third run done on 2026-10-07 (Pet Clinic, `generator-runs/pet-clinic`), the first written from the recipes alone with no reference left: every gate green, tickets 04 and 06 proven. The remaining reservation is below.

## Third run: Pet Clinic (2026-10-07)

Answers: Laravel + PostgreSQL and React + shadcn/ui, language `es`, dark mode **no**, primary `#facc15` (a light color), default radius, system font, VPS ports 8081 and 8082.

- [x] Every local gate green, one at a time, then `project check` in both repositories (backend: 8 unit tests, 100% coverage of `Domain` and `Application`, 9 integration tests; frontend: 21 tests, 100% lines and 89.47% branches, bundle 119 kB brotli of the 1 MB limit, one allowed advisory). A gate failing on purpose was shown for each stack: a forbidden call in `Domain` (Deptrac), a public method after `execute` and a `config()` call in a use case (the custom PHPStan rules), a coverage threshold above the real value (backend and frontend), a component importing a service (dependency-cruiser), a Pint violation and an `id-denylist` error through the commit hook.
- [x] **Dark mode off**: no `.dark` block, no `@custom-variant dark`, no color-scheme hook, no `dark:` utility in the atoms (after deleting the ones the shadcn CLI writes), no `color-scheme` in the built CSS.
- [x] **Spanish**: `<html lang="es">`, the page (`Estado del sistema`, `Versión`, `Base de datos`, `Reintentar`, `Código de seguimiento`), the `ErrorCode` titles and the Problem Details texts are Spanish; code, logs, test names and docs are English.
- [x] **Dark foreground**: `brand-tokens.mjs "#facc15"` printed `primaryForeground: oklch(0.145 0 0)`, which is in `src/index.css` (`--primary-foreground`), with the primary `oklch(0.861 0.173 91.936)`.
- [x] `git init` and a first commit in each repository, `project` committed executable (`100755`), `docker/entrypoint.sh` and the hook script too; `.env`, `vendor/`, `node_modules`, `build/` and `dist/` are not tracked; `composer.lock` and `pnpm-lock.yaml` are.
- [x] The three ways to run: `./project <command>` from the host, `docker compose run --rm app …` directly, and the dev container simulated with its image, mounts and user (`./project setup`, `typecheck`). Reopening in VS Code remains the user's to try.
- [~] Reservation: this was one agent session writing every file from the recipes, so it proves the recipes are sufficient with the corrections below, not that a second agent would reproduce the same files; the corrections are the measure of what the recipes lacked.
- [ ] Not proven: a Windows-less machine (the run was on Windows 11 with Docker Desktop only).

### Corrections from the third run

| Found | Why | Fixed in |
|---|---|---|
| PHPMD 3.0 installs next to Laravel 13 and its command changed | The Symfony conflict that forced `tools/phpmd/` is gone; the positional CLI is deprecated and paths are space separated | `php.md` item 9 (check every tool with a dry run, isolate only the one that fails), `lint` script |
| `qossmic/deptrac` is abandoned | Replaced by `deptrac/deptrac` 4 (`classLike` collectors, regex with `\\` in YAML) | `php.md` item 9 |
| An unused forbidden `use` did not fail Deptrac | It records only references the code uses | `php.md` item 9: prove the gate with a call |
| `phpunit.xml` `<env>` lost to the container's environment (`version` saw `dev`, the log channel was not `null`) | The Compose `env_file` puts `.env` in the process environment and Laravel reads `$_SERVER` first | `php.md` item 22: set each variable as `<env>` and `<server>` |
| The idle dev container showed `unhealthy` | The FrankenPHP base image health-checks its admin port | `php.md` item 18: `HEALTHCHECK NONE` |
| Git refused the bind-mounted repository inside the containers (hooks, commits) | Another owner | `php.md` item 18, `react.md` item 21: `git config --system --add safe.directory /app` |
| `compose config` failed without `stack.env`; production `.env.example` would run the image with `APP_ENV=local` | `env_file` overrides the image's `ENV` | `stack.env.example` (`php.md` item 23, `vps-deploy.md`, `repository-layout.md`, guardrails) |
| Compose warned about the network shared by two stacks; `up` for the production file would recreate the dev `app` | Same network name; same project name as the dev file | frontend compose has no network; `-p <slug>-prod-…` (`vps-deploy.md`) |
| Production images over the lean targets (440 MB, 91.5 MB) | Layers keep deleted files; the `nginx` full alpine image | `php.md` item 20 (four stages, `FROM scratch`), `react.md` item 19 and `vps-deploy.md` (`alpine-slim`) |
| `shadcn add` installed `cn` and `radix-ui` and wrote `dark:` classes | As found before, plus Tailwind's default `dark:` follows the system | `react.md` item 5 |
| Tailwind scanned `.claude/skills` and `docs` (CSS 16.3 to 19.5 kB) | Automatic source detection | `react.md` item 5: `source('.')` |
| ESLint: `heading-has-content` on heading atoms, `jsx-handler-names` on `retry.onClick` | The rules cannot see `{...props}` or a member expression | `react.md` items 5 and 20 |
| `msw` blocked pnpm (`ERR_PNPM_IGNORED_BUILDS`) | Install script not decided | `react.md` item 3: `msw: false` |
| orval's schema file is `petClinic.schemas.ts` | `info.title` is the product name from `APP_NAME`, not the slug | `react.md` item 6 |
| Bash tool turned `\\` into `\` and refused long here-documents | Tool behaviour | skill *Rules*: write such files with the file tool |
| Skills copied from upstream had CRLF | Upstream line endings | `agent-rules.md`: convert to LF |
| `lefthook` not found in the frontend container | It is a project dependency | `agent-rules.md`: `pnpm exec lefthook` |
| Commit from the host skipped the hooks silently | Lefthook lives in the container | `agent-rules.md`, `dev-commands.md`, READMEs |

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
- Unproven paths: dark mode off, a language other than pt-BR and a color that needs a dark foreground are now proven (third run); Windows-less machines are not.
- The third run, written from prose with no reference, needed about twenty corrections, almost all of them tool-version facts (PHPMD, Deptrac, PHPUnit, pnpm, shadcn, Tailwind) and container details, not structure; the recipes' structure held. Writing the mechanical files again is still the dominant cost, but each correction above is now in the recipe, which is the point of ADR-0001's accepted cost.
- The generated project is kept at `C:\projects\person\generator-runs\pet-clinic` until the user says the generator is finished; nothing was deleted.
