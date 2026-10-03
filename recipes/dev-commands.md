# Dev commands

Every repository `/new-project` creates has a `project` script at its root: one short, memorable vocabulary for running the repository, the same in every stack and every repository kind (backend, web frontend, mobile). The human types it in the dev container or the host terminal; the agent uses it too, so `AGENTS.md` lists the commands instead of the stack's tool invocations.

```
./project start:dev
./project check
```

## Vocabulary

| Command | What it does |
|---|---|
| `project setup` | First run: install dependencies, create the local environment file, prepare the database (backend) and run the development seed. Safe to repeat. |
| `project start:dev` | Run the application for local work, in the foreground, reachable at the URL printed on start. Backend: the HTTP server (the database is already up as a Docker Compose service). Frontend: the dev server pointed at the configured API URL. Mobile: the Expo development server. |
| `project test` | Unit and integration tests. |
| `project test:unit` | Unit tests only (fast). |
| `project test:integration` | Integration tests only. |
| `project coverage` | Unit tests with the coverage threshold check (80%, scope per `recipes/quality-gates.md`). |
| `project lint` | Lint and format **check**, without changing files. |
| `project format` | Apply the formatter. |
| `project typecheck` | Static types / static analysis. |
| `project arch` | Architecture validation. |
| `project audit` | Dependency audit. |
| `project check` | **Every Quality Gate that can run locally**, in the order CI runs them, stopping at the first failure. If `check` passes, the pull request's gates pass. |
| `project db:migrate` | Apply pending migrations (backend). |
| `project db:seed` | Run the development seed (backend). |
| `project db:reset` | Drop the local database, migrate and seed (backend). Local data only. |
| `project openapi` | Regenerate `openapi.json` (backend) or the API client from it (frontend). |
| `project openapi:check` | Fail when `openapi.json` (backend) or the generated API client (frontend) is out of date. |
| `project help` | List the commands. |

## README

Every generated repository's `README.md` is written for the person who just cloned it, not for the agent (`AGENTS.md` is the agent's). It is resolved for the chosen stack and holds, in this order:

0. **Requirements**, stated first and short: Docker is the only thing the machine needs. The dev container route also needs VS Code with the Dev Containers extension; the plain route needs nothing else. Language runtimes and tools are never listed as requirements because they live in the container (frontend and mobile repositories, which have no dev container, list Node and pnpm).
1. **Getting started**: the dev container path and the plain `docker compose` path (backend) or the pnpm path (frontend, mobile), ending with a command that shows it works (`curl /health`, the URL to open).
2. **The command table**: every command of the vocabulary above with what it does in this repository.
3. **Quality Gates**: a table with one row per gate, the command that runs that gate alone, and what makes it fail, plus how to run all of them (`project check`) and what the Lefthook hooks run. Gates are listed and run one at a time, so a failure points at one tool.
4. **Project layout**, a short tree with one line per folder.
5. **Configuration**: the environment variables and what they are for.
6. **The Docker image** (backend): the targets and how to build the production one.
7. **Working with the agent**: one line pointing to `AGENTS.md`.

Detail that belongs to the architecture or the conventions is linked from the README, never copied into it.

## Rules

- **Same names everywhere.** A stack may add commands (`project e2e` on mobile) but never renames or drops one from the vocabulary above; a gate the stack has no tool for (such as `arch` in a stack without one) prints that it does not apply and exits successfully.
- **A thin wrapper.** `project` only maps each name to the stack's own scripts (Composer scripts in PHP, `package.json` scripts in Node and React, Gradle or Maven tasks in Java), so the real definitions live where that stack's tools expect them. The wrapper is POSIX `sh` with no dependencies beyond the stack's package manager.
- **Run one gate at a time.** Each gate has its own command so a failure points at one tool; `project check` exists as the all-in-one shortcut for before opening a pull request, never as the only way to run a gate. The skill that generates a repository runs the gates one by one and reads each result.
- **The script is committed executable.** A file created on Windows has no executable bit, so the generator records it in Git (`git update-index --chmod=+x project`) and the README says that, if `./project` ever reports "permission denied", `sh project <command>` works the same.
- **Runs inside the dev container.** Everything the commands need is installed there. On the host, backends run them through `docker compose run --rm app ./project <command>`; web frontends and mobile apps run on the host with pnpm (no dev container).
- **`check` is the contract with CI.** The CI workflows run the same gates; a change to a gate edits the stack's scripts and the Shared Workflow together.
- **Documented, not repeated.** `AGENTS.md` carries the short table (`start:dev`, `test`, `check`) and points to `docs/conventions.md` for the rest; the Lefthook hooks call `project lint` and `project typecheck` (pre-commit) and `project test:unit` and `project arch` (pre-push).
