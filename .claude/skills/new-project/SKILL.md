---
name: new-project
description: Create a Derived Project from the Template's Stack Recipes. Use when the user wants a new project, a new backend, or says "/new-project". Runs locally and interactively, never as an Autonomous Run.
---

# /new-project

Generates a Derived Project from the recipes in this repository. The recipes are the source of truth: this skill says **in what order** to work and **what to verify**, never how a stack is built.

Read first: `recipes/new-project.md` (the flow and its guardrails), `recipes/decision-guide.md`, `recipes/repository-layout.md`, `recipes/agent-rules.md`, `recipes/dev-commands.md`, `recipes/quality-gates.md`, `recipes/coding-standards.md`.

## Current scope

This skill is being built in slices (`.scratch/build-the-factory/`). Today it covers:

- **Create mode**: write the repositories to a local directory, with `.github/workflows/ci.yml` and `deploy.yml` callers. **Publishing to GitHub** (step 15) happens only when the user asks and confirms. No calls to Docker Hub, Portainer or any cloud: the deployment files are generated and proven locally (`recipes/vps-deploy.md`, ADR-0013), never run. There is no Terraform in this phase.
- **Backend: PHP Laravel + PostgreSQL** (`recipes/backend/php.md`, `recipes/backend/clean-architecture.md`) and **web frontend: React** (`recipes/frontend/react.md`). Other stacks: say they are not available yet and stop.
- **The interview decides everything**: no fixed answers. The inputs, what is available today and where each answer lands are in `recipes/new-project.md` (*The interview*). The deploy target is always the VPS; Docker Hub user, host ports and domain feed the deploy files, and budget and alert email are only recorded.

## Tools

The generator carries no project files (ADR-0001): every file of a generated repository is written from the recipes. It keeps only three tools of its own in `tools/`, **never copied into a project**:

- `tools/strip-comments.php`: run over a generated PHP project (`recipes/backend/php.md`, item 16).
- `tools/check-page.cjs`: the browser check (`recipes/frontend/react.md`, Verify in a browser).
- `tools/brand-tokens.mjs`: turns the primary color (`#rrggbb`) into the Brand Tokens in `oklch`, with the foreground and the dark-mode variants (`node brand-tokens.mjs "#4f46e5"`); it only prints, it writes nothing.

## Steps

1. **Check the machine**: Docker is running (`docker info`). The host needs nothing else; PHP, Composer and the tools run in containers. This step reads, it writes nothing.
2. **Discovery**, as in `recipes/new-project.md` (*Discovery: deciding the technologies*) and `recipes/decision-guide.md`: ask about the **product**, in plain words, never about technology, with `AskUserQuestion` in groups of at most four questions; then present one **recommendation table** (decision, recommended option, the reason tied to the user's own answers, the trade-off, and whether the factory can build it today) and let the user confirm or adjust a row. Do not turn the technology into a menu the user cannot weigh. "Not yet available" means no recipe has been proven end to end by passing every gate, not that the code cannot be written. If the product needs what the factory cannot build, say so now and offer to generate only the available part.
3. **Interview** about identity, product and brand (`recipes/new-project.md`, *The interview*), same style: groups of at most four questions, the recommended option first with its reason, a free answer always possible. Derive the slug, the PHP namespace and the Brand Tokens from the answers (run `tools/brand-tokens.mjs` for the color).
4. **Show the plan and wait for the user's confirmation** (*The plan and the confirmation* in `recipes/new-project.md`). **Nothing is written to disk before the confirmation**: no folder, no file. If the user changes an answer, show a new plan; if they cancel, stop.
5. **Pick an output directory** outside this repository, a new folder named after the slug (for example `../generator-runs/<slug>/`), never an existing one, and tell the user where it is.
6. **Generate the backend** by following `recipes/backend/php.md`, section *Generating the project*, in its order, then **the frontend** by following `recipes/frontend/react.md`. Do not improvise around a step; if a step is wrong, fix the recipe (step 9). Before installing any tool, check that its peer dependencies accept the versions chosen (`react.md` item 2); install with strict peers so a conflict fails at once.
7. **Run every gate on its own**, one command per gate, and read each result before the next: `project format`, `project lint`, `project typecheck`, `project arch`, `project coverage`, `project test:integration`, `project audit`, `project openapi:check`. Then start the app (`project start:dev`) and call `GET /health`, and prove the production files (`recipes/vps-deploy.md`): `docker compose -f docker-compose.prod.yml config` (the backend needs a `stack.env` made from `stack.env.example`), build the `prod` target, report its size against the lean-image targets (`recipes/vps-deploy.md`) and run it with a project name of its own (backend with its PostgreSQL, `GET /health`; frontend `/` and a deep link). Run `project check` only at the end, as the all-in-one confirmation.
   **Then prove the two repositories work together**: first the two development servers, then the two production containers; for each, open the home page in headless Chrome as described in `recipes/frontend/react.md` (Verify in a browser) and confirm it shows the version the backend returned with a clean console. Before the production check, the frontend image is built with `VITE_API_URL` set to the backend's published port as the browser reaches it, and the backend's `CORS_ALLOWED_ORIGINS` names the frontend's published origin.
8. **Prove a gate can fail** the first time it is set up for a stack: break one thing on purpose (an import across layers, a coverage threshold above the real value), see the gate fail, undo it.
9. **Every failure becomes a correction in the recipe or in this skill**, with the reason, in the ticket that is being worked. Never patch only the generated code: the next run would repeat the failure.
10. **Write the project's `README.md`** as described in `recipes/dev-commands.md` (README section), starting with the requirements (Docker only; VS Code and the Dev Containers extension are optional).
11. **Write the VS Code setup** for the chosen stack from `recipes/vscode-extensions.md`: the extensions in `.devcontainer/devcontainer.json` (backend, web frontend; the frontend also in `.vscode/extensions.json`) or `.vscode/extensions.json` (mobile), and format on save in `.vscode/settings.json` using the formatter of the lint gate.
12. **Write the agent rules** in both repositories from `recipes/agent-rules.md`: `CLAUDE.md`, `AGENTS.md`, `CODING_STANDARDS.md`, `GLOSSARY.md`, `docs/architecture.md`, `docs/conventions.md`, `docs/adr/` (one per plan decision), `docs/agents/`, the vendored skills, `.claude/settings.json` with `.claude/hooks/guardrails.sh`, `lefthook.yml` and `.template-version`. Then prove the guardrail hook (one JSON line per rule, exit `2` for each blocked case, `0` for a feature-branch push) and the hooks (a commit with a lint error is rejected), and search both repositories for the names of the technologies not chosen (other languages, databases, clouds): only the ADRs may mention them (search the tracked files, leaving out the ADRs, the vendored skills, the lock files and `openapi`; hits that are not choices are fine and are listed in the report: the Symfony components Laravel itself uses, the Terraform rules of the guardrails, the `slim` tag of the nginx image). With dark mode off, also search the frontend's sources and built CSS for `dark`, `color-scheme` and `prefers-color-scheme`.
13. **Commit the `project` script executable** (`git update-index --chmod=+x project`) when the repository is initialised.
14. **Prove the three ways to run it**: `./project <command>` typed on the host (it hands the command to Docker), `docker compose` directly, and the dev container. Simulate the dev container by running its image with the same mounts and user and executing `project setup` and a gate; when VS Code is available, ask the user to open the folder with *Reopen in Container* and report whether `./project setup` and `./project start:dev` worked. Only opening it in VS Code proves it.
15. **Publish to GitHub, only when the user asks**, after showing what will be created (repositories, owner, visibility, settings) and getting a confirmation: follow `recipes/github-setup.md` (create and push, squash-only settings, branch protection with the required checks `ci / pr-rules` and `ci / gates`, triage labels, the Project, variables) and prove it with the first pull request. Never create the secrets: list them for the user. Before this step the `ci.yml` caller of each repository must pass `actionlint`.

## Rules

- **No explanatory comments** in generated code, tests included; only comments a tool reads (`recipes/coding-standards.md`, Comments). Strip the comments that skeletons and published vendor configuration ship with, then run the formatter.
- **Frontend names**: kebab-case folders named after the component, `index.tsx` as the entry, tests named after the folder (`recipes/frontend/architecture.md`).
- Nothing technical is invented: commands, versions and tool choices come from the recipes; versions are the latest stable on the day of the run and are then pinned.
- **Writing files from the shell** (found on 2026-10-07): the Bash tool collapses `\\` into `\` and rejected long multi-file `cat <<'EOF'` scripts with "unexpected EOF". Write every file that holds a backslash (PHP namespaces, regular expressions, YAML collectors, Dockerfile continuation edits) with the file-writing tool, never with `sed` or a here-document; the file tool also needs a file that does not exist yet or that was read, so delete the skeleton's file first. A forbidden-import proof edits the file with the edit tool too.
- **Commits in the generated repositories** are made inside the container so the hooks run (`recipes/agent-rules.md`, Lefthook), with `user.name` and `user.email` set in each repository first; the commit message ends with the attribution line of the session.
- Deleting is the user's call when the environment blocks it: do not work around a blocked removal; list exactly what is to be deleted and why.
- Everything technical written into the generated repository is in English; end-user text is in the product language.
