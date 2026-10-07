# 04: Agent rules in the generated repositories

**What to build:** each generated repository carries what an agent needs to work in it on its own. Rule files resolved for the chosen stack (short `AGENTS.md`, `CLAUDE.md` pointing to it, `CODING_STANDARDS.md`, `GLOSSARY.md`, `docs/architecture.md`, `docs/conventions.md`, issue tracker and triage docs for GitHub Issues, `.template-version`), the ADRs recording the choices made, a README, the vendored skills subset in `.claude/skills/`, agent guardrails in `.claude/settings.json`, and Lefthook hooks. Follows the repository layout recipe.

**Blocked by:** 01 (Laravel backend generated and green)

**Status:** proven locally on 2026-10-07 by the Pet Clinic run (`generator-runs/pet-clinic`); what a local run cannot prove is listed at the end

- [x] Backend and frontend repositories contain the files listed in the repository layout recipe, with no references to technologies that were not chosen: a search of the tracked files (ADRs, vendored skills, lock files and `openapi` left out) finds only Laravel's own Symfony components, the Terraform deny rules the recipe mandates, and the `slim` tag of the nginx image. Not generated: the CI caller workflows (`recipes/shared-workflows.md` defines no inputs for them yet), a gap to close with the Shared Workflows
- [x] `AGENTS.md` is short (51 lines in each repository) and points to the detailed docs
- [x] Each choice from the interview exists as an ADR (0001 to 0007, byte-identical in both repositories)
- [x] `.claude/skills/` holds exactly the 20 vendored skills of the layout recipe plus `LICENSE`, the same list in both repositories (source `mattpocock/skills@6fd947921b935b7e1e69293a200400f0fdd5c15f`)
- [x] The settings block `terraform apply`, merges, force pushes, pushes to `main`, reading `.env` files and triggering deploys: the hook returned `2` for 26 blocked cases (including `git -C . push origin main`, `git push origin HEAD:main`, `terraform -chdir=infra destroy`, `source ./.env`, `cat stack.env`) and `0` for 10 allowed ones (`git push -u origin feature/42-add-role`, `git push origin feature/main-menu`, `cat .env.example`, `terraform plan`, `./project check`…)
- [x] Lefthook runs lint and typecheck on pre-commit and unit tests and architecture on pre-push: in both repositories a broken commit was rejected (a Pint violation in the backend, an `id-denylist` error in the frontend), the fixed one went through, and `lefthook run pre-push` passed. The format step is part of `project lint` as a check; no hook rewrites files
- [x] `.template-version` records the Template commit (`3c82d81…`), the date, the skills commit and `dirty=true` (the Template had uncommitted changes)
- [x] The VS Code extensions of the chosen stack are listed as in `recipes/vscode-extensions.md` (in `.devcontainer/devcontainer.json` in both, plus `.vscode/extensions.json` in the frontend), with format on save using the lint gate's formatter (Pint through `open-southeners.laravel-pint`, Prettier plus ESLint fix)

Not proven by a local run: opening either folder with VS Code's *Reopen in Container* (the dev container was simulated with its image, mounts and user, and ran `project setup` and a gate); the extension IDs were not installed.

Unproven path now observed: a commit made from the host terminal, where Lefthook is not installed, prints `Can't find lefthook in PATH` and goes through without any hook (backend and frontend alike). The README of each repository says so; `recipes/agent-rules.md` records it.

## Progress

Done in the Template (2026-10-06):

- `recipes/agent-rules.md`: what each rule file holds (`CLAUDE.md`, `AGENTS.md` at most about 60 lines, `CODING_STANDARDS.md`, `GLOSSARY.md`, `docs/architecture.md`, `docs/conventions.md`, one ADR per plan decision with the same numbers in both repositories, `docs/agents/`, vendored skills, settings and hook, Lefthook, `.template-version`).
- Vendored skills come from `github.com/mattpocock/skills` at the newest `main` commit of the run day, then pinned in `.template-version`; all 20 listed skills exist there (checked on 2026-10-06 at `6fd9479`). `docs/agents/` is copied from its `setup-matt-pocock-skills` templates (`issue-tracker-github.md`); the Template's own `triage-labels.md` and `domain.md` are identical to them.
- The guardrails are two layers: `permissions.deny` and a `PreToolUse` hook. A permission rule matches only the command text (`git -C . push origin main` slips past `Bash(git push *)`), so the hook is what holds.
- The vendored `git-guardrails-claude-code` script blocks every `git push`, which would stop an Autonomous Run from opening its pull request, so the generated hook blocks only pushes to `main`, force pushes and branch deletions. It needs no `jq`. A reference implementation passed 32 cases (23 blocked, 9 allowed) and was then deleted (ADR-0001: no project files in the Template).
- Lefthook calls the `project` script: pre-commit `lint` + `typecheck` (check only), pre-push `test:unit` + `arch`. `recipes/backend/php.md` said the pre-commit hook applies Pint, which contradicted `recipes/dev-commands.md`; it now says the hook checks.
- Skill step 12 writes and proves the rule files; `recipes/repository-layout.md`, `php.md` (item 18) and `react.md` (item 17) point to the recipe.

Pending: a `/new-project` run that generates both repositories and checks every criterion above. Unproven: a backend commit from the host terminal, where Lefthook is not installed.
