# Generated repository layout

What `/new-project` writes into every repository it creates, besides the code; what each rule file holds is in `recipes/agent-rules.md`. Rules reach the agent in three layers:

1. **`AGENTS.md`, short and always loaded** (through `CLAUDE.md` → `@AGENTS.md`): the essential rules and pointers to the detailed docs. Written following `/writing-for-agents`; long always-loaded files hurt the agent, so detail lives in `docs/`.
2. **Detailed docs, read when a task needs them**, already **resolved for the chosen stack**: a Spring Boot + PostgreSQL project's `docs/architecture.md` speaks only of Spring Boot and PostgreSQL, never of the alternatives.
3. **Tools enforce**: ArchUnit, Checkstyle, PMD, ESLint, dependency-cruiser and the Quality Gates fail CI on a violation, so a rule holds even if a doc is ignored.

```
<project>-backend/
├── CLAUDE.md                 "@AGENTS.md" only
├── AGENTS.md                 essential rules + where to find the rest
├── CODING_STANDARDS.md       from recipes/coding-standards.md; /code-review's criterion
├── README.md                 how to run the repository: getting started, the dev commands, how to run each Quality Gate, layout, configuration
├── project                   dev commands script: `./project start:dev`, `./project check`... (recipes/dev-commands.md)
├── .template-version         the Template version this repository's rules came from (used by /sync-template)
├── GLOSSARY.md               the project's domain vocabulary
├── docs/
│   ├── architecture.md       the stack recipe, resolved for this project
│   ├── conventions.md        naming, API, database, errors, logs, mechanisms in use
│   ├── adr/                  the /new-project choices as ADRs, then future decisions
│   └── agents/               rendered by the agent team (ADR-0014): issue-tracker.md, triage-labels.md, domain.md, agent-team-setup.md
├── .agents/
│   ├── config.json           the agent team's repository, pinned version, the repository's kind, the dispatcher's settings
│   ├── agents-install        installs and updates the pinned agent team (rendered)
│   ├── skills/               the skills, for Codex (rendered)
│   ├── scheduled-tasks.json  the scheduled tasks this repository needs, for the platform (rendered)
│   └── agent-team.manifest   the files the agent team wrote (rendered)
├── agents/overrides/         this project's additions to a role, appended at render time (only when there are any)
├── .claude/
│   ├── agents/               the agent team's roles for Claude Code (rendered)
│   ├── skills/               the skills, for Claude Code (rendered)
│   ├── hooks/guardrails.sh   blocks what an agent must never run (recipes/agent-rules.md)
│   └── settings.json         agent permissions and hooks for this project
├── .codex/agents/            the same roles in Codex's format (rendered, not used yet)
├── .vscode/                  extensions.json (frontend and mobile) and settings.json: the stack's VS Code extensions and format on save (recipes/vscode-extensions.md)
├── lefthook.yml              pre-commit and pre-push hooks calling the project script
├── .github/workflows/        thin callers: `ci.yml`, `deploy.yml`, and the agent team's `agent-team.yml` and `agent-paths.yml` (recipes/github-setup.md, recipes/vps-deploy.md)
├── .github/ISSUE_TEMPLATE/   `ticket.md`, the agent-ready ticket shape (recipes/agent-rules.md)
├── docker-compose.prod.yml   production stack run by Portainer on the VPS (recipes/vps-deploy.md)
├── .env.example              local runtime variables with placeholders (backend: also stack.env.example, the production ones)
└── src/, tests/, Dockerfile (`dev` and `prod` targets), docker-compose.yml, .devcontainer/ (backend and web frontend; lists the extensions), ...
```

## The agent team

The agents that work in the repository (PM, Architect, Designer, the Dev of its kind, QA, Reviewer), the skills they load and `docs/agents/` come from the **agent-team repository** (`github.com/GabrielSoares-Dev/agent-team`) at a pinned release, rendered into the repository and committed (ADR-0014). The Template no longer clones mattpocock/skills: agent-team vendors every skill the projects use, so the skill list lives there. How `/new-project` installs it is in `recipes/agent-rules.md` (*The agent team*); rendered files are never edited by hand, and `project check` fails when they drift.

## Agent guardrails

The generated `.claude/settings.json` blocks what an autonomous agent must never do, so "the human always merges" is enforced by rule and not only by agreement:

- no `terraform apply` or any infrastructure change command;
- no `gh pr merge` and no merge by any other means;
- no `git push --force` and no push to `main`;
- no reading `.env` files or secrets;
- no triggering the deploy workflows.

The rules live in `permissions.deny` and in a `PreToolUse` hook, `.claude/hooks/guardrails.sh` (`recipes/agent-rules.md`). The hook is the vendored `git-guardrails-claude-code` script adapted: the original blocks every `git push`, but an Autonomous Run must push its own branch to open a pull request, so only pushes to `main`, force pushes and branch deletions are blocked. To verify during construction: how the agent's pull requests appear on GitHub (author), to see whether a required approval from the human can be added on top of these rules.

Web frontend and mobile app repositories have the same files, with their own architecture and conventions; the web frontend has a dev container too, the mobile app has none (it runs on the host).
