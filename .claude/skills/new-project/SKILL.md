---
name: new-project
description: Create a Derived Project from the Template's Stack Recipes. Use when the user wants a new project, a new backend, or says "/new-project". Runs locally and interactively, never as an Autonomous Run.
---

# /new-project

Generates a Derived Project from the recipes in this repository. The recipes are the source of truth: this skill says **in what order** to work and **what to verify**, never how a stack is built.

Read first: `recipes/new-project.md` (the flow and its guardrails), `recipes/decision-guide.md`, `recipes/repository-layout.md`, `recipes/dev-commands.md`, `recipes/quality-gates.md`, `recipes/coding-standards.md`.

## Current scope

This skill is being built in slices (`.scratch/build-the-factory/`). Today it covers:

- **Create mode**, local only: write the repositories to a local directory. No GitHub repositories, no branch protection, no Terraform, no cloud calls. Never run `terraform apply`.
- **Backend: PHP Laravel + PostgreSQL** (`recipes/backend/php.md`, `recipes/backend/clean-architecture.md`) and **web frontend: React** (`recipes/frontend/react.md`). Other stacks: say they are not available yet and stop.
- **Fixed answers** until the interview exists: project `invoice-manager`, product language `pt-BR`, Deploy Target AWS (recorded, not deployed).

## Tools

The generator carries no project files (ADR-0001): every file of a generated repository is written from the recipes. It keeps only two tools of its own in `tools/`, **never copied into a project**:

- `tools/strip-comments.php`: run over a generated PHP project (`recipes/backend/php.md`, item 16).
- `tools/check-page.cjs`: the browser check (`recipes/frontend/react.md`, Verify in a browser).

## Steps

1. **Check the machine**: Docker is running (`docker info`). The host needs nothing else; PHP, Composer and the tools run in containers.
2. **Pick an output directory** outside this repository (for example `../generator-runs/<run>/`), and tell the user where it is.
3. **Generate the backend** by following `recipes/backend/php.md`, section *Generating the project*, in its order, then **the frontend** by following `recipes/frontend/react.md`. Do not improvise around a step; if a step is wrong, fix the recipe (step 6). Before installing any tool, check that its peer dependencies accept the versions chosen (`react.md` item 2); install with strict peers so a conflict fails at once.
4. **Run every gate on its own**, one command per gate, and read each result before the next: `project format`, `project lint`, `project typecheck`, `project arch`, `project coverage`, `project test:integration`, `project audit`, `project openapi:check`. Then start the app (`project start:dev`) and call `GET /health`, and build the `prod` Dockerfile target and run it. Run `project check` only at the end, as the all-in-one confirmation.
   **Then prove the two repositories work together**: start both, open the home page in headless Chrome as described in `recipes/frontend/react.md` (Verify in a browser), and confirm it shows the version the backend returned with a clean console.
5. **Prove a gate can fail** the first time it is set up for a stack: break one thing on purpose (an import across layers, a coverage threshold above the real value), see the gate fail, undo it.
6. **Every failure becomes a correction in the recipe or in this skill**, with the reason, in the ticket that is being worked. Never patch only the generated code: the next run would repeat the failure.
7. **Write the project's `README.md`** as described in `recipes/dev-commands.md` (README section), starting with the requirements (Docker only; VS Code and the Dev Containers extension are optional).
8. **Write the VS Code setup** for the chosen stack from `recipes/vscode-extensions.md`: the extensions in `.devcontainer/devcontainer.json` (backend, web frontend; the frontend also in `.vscode/extensions.json`) or `.vscode/extensions.json` (mobile), and format on save in `.vscode/settings.json` using the formatter of the lint gate.
9. **Commit the `project` script executable** (`git update-index --chmod=+x project`) when the repository is initialised.
10. **Prove the three ways to run it**: `./project <command>` typed on the host (it hands the command to Docker), `docker compose` directly, and the dev container. Simulate the dev container by running its image with the same mounts and user and executing `project setup` and a gate; when VS Code is available, ask the user to open the folder with *Reopen in Container* and report whether `./project setup` and `./project start:dev` worked. Only opening it in VS Code proves it.

## Rules

- **No explanatory comments** in generated code, tests included; only comments a tool reads (`recipes/coding-standards.md`, Comments). Strip the comments that skeletons and published vendor configuration ship with, then run the formatter.
- **Frontend names**: kebab-case folders named after the component, `index.tsx` as the entry, tests named after the folder (`recipes/frontend/architecture.md`).
- Nothing technical is invented: commands, versions and tool choices come from the recipes; versions are the latest stable on the day of the run and are then pinned.
- Deleting is the user's call when the environment blocks it: do not work around a blocked removal; list exactly what is to be deleted and why.
- Everything technical written into the generated repository is in English; end-user text is in the product language.
