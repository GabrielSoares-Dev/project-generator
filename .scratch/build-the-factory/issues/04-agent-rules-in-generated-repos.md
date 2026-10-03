# 04: Agent rules in the generated repositories

**What to build:** each generated repository carries what an agent needs to work in it on its own. Rule files resolved for the chosen stack (short `AGENTS.md`, `CLAUDE.md` pointing to it, `CODING_STANDARDS.md`, `GLOSSARY.md`, `docs/architecture.md`, `docs/conventions.md`, issue tracker and triage docs for GitHub Issues, `.template-version`), the ADRs recording the choices made, a README, the vendored skills subset in `.claude/skills/`, agent guardrails in `.claude/settings.json`, and Lefthook hooks. Follows the repository layout recipe.

**Blocked by:** 01 (Laravel backend generated and green)

**Status:** ready-for-agent

- [ ] Backend and frontend repositories contain the files listed in the repository layout recipe, with no references to technologies that were not chosen
- [ ] `AGENTS.md` is short and points to the detailed docs
- [ ] Each choice from the interview exists as an ADR
- [ ] `.claude/skills/` holds exactly the vendored subset listed in the layout recipe
- [ ] The settings block `terraform apply`, merges, force pushes, pushes to `main`, reading `.env` files and triggering deploys
- [ ] Lefthook runs lint, format and typecheck on pre-commit, and unit tests and architecture validation on pre-push; a deliberately broken commit is rejected
- [ ] `.template-version` records the current Template version
