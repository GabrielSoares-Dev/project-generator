# 04: Agent rules in the generated repositories

**What to build:** each generated repository carries what an agent needs to work in it on its own. Rule files resolved for the chosen stack (short `AGENTS.md`, `CLAUDE.md` pointing to it, `CODING_STANDARDS.md`, `GLOSSARY.md`, `docs/architecture.md`, `docs/conventions.md`, issue tracker and triage docs for GitHub Issues, `.template-version`), the ADRs recording the choices made, a README, the vendored skills subset in `.claude/skills/`, agent guardrails in `.claude/settings.json`, and Lefthook hooks. Follows the repository layout recipe.

**Blocked by:** 01 (Laravel backend generated and green)

**Status:** in progress: the Template side is written (recipe and skill); the run that generates and verifies the files is pending, and needs Docker on the user's machine

- [ ] Backend and frontend repositories contain the files listed in the repository layout recipe, with no references to technologies that were not chosen
- [ ] `AGENTS.md` is short and points to the detailed docs
- [ ] Each choice from the interview exists as an ADR
- [ ] `.claude/skills/` holds exactly the vendored subset listed in the layout recipe
- [ ] The settings block `terraform apply`, merges, force pushes, pushes to `main`, reading `.env` files and triggering deploys
- [ ] Lefthook runs lint, format and typecheck on pre-commit, and unit tests and architecture validation on pre-push; a deliberately broken commit is rejected
- [ ] `.template-version` records the current Template version
- [ ] The VS Code extensions of the chosen stack are listed as in `recipes/vscode-extensions.md` (in `.devcontainer/devcontainer.json` for the backend and the frontend, plus `.vscode/extensions.json` for the frontend), with format on save using the lint gate's formatter

## Progress

Done in the Template (2026-10-06):

- `recipes/agent-rules.md`: what each rule file holds (`CLAUDE.md`, `AGENTS.md` at most about 60 lines, `CODING_STANDARDS.md`, `GLOSSARY.md`, `docs/architecture.md`, `docs/conventions.md`, one ADR per plan decision with the same numbers in both repositories, `docs/agents/`, vendored skills, settings and hook, Lefthook, `.template-version`).
- Vendored skills come from `github.com/mattpocock/skills` at the newest `main` commit of the run day, then pinned in `.template-version`; all 20 listed skills exist there (checked on 2026-10-06 at `6fd9479`). `docs/agents/` is copied from its `setup-matt-pocock-skills` templates (`issue-tracker-github.md`); the Template's own `triage-labels.md` and `domain.md` are identical to them.
- The guardrails are two layers: `permissions.deny` and a `PreToolUse` hook. A permission rule matches only the command text (`git -C . push origin main` slips past `Bash(git push *)`), so the hook is what holds.
- The vendored `git-guardrails-claude-code` script blocks every `git push`, which would stop an Autonomous Run from opening its pull request, so the generated hook blocks only pushes to `main`, force pushes and branch deletions. It needs no `jq`. A reference implementation passed 32 cases (23 blocked, 9 allowed) and was then deleted (ADR-0001: no project files in the Template).
- Lefthook calls the `project` script: pre-commit `lint` + `typecheck` (check only), pre-push `test:unit` + `arch`. `recipes/backend/php.md` said the pre-commit hook applies Pint, which contradicted `recipes/dev-commands.md`; it now says the hook checks.
- Skill step 12 writes and proves the rule files; `recipes/repository-layout.md`, `php.md` (item 18) and `react.md` (item 17) point to the recipe.

Pending: a `/new-project` run that generates both repositories and checks every criterion above. Unproven: a backend commit from the host terminal, where Lefthook is not installed.
