# Agent rules in a generated repository

How `/new-project` writes the files that let an agent work in a generated repository on its own (`recipes/repository-layout.md` lists them; this recipe says what each one holds). Every file is written for **this** repository: the chosen stack, the product's answers, the sibling repository's name. Nothing mentions a technology that was not chosen, except the ADRs, which are the one place where the rejected options are recorded.

The backend and the web frontend get the same set; where they differ, it is said below.

## `CLAUDE.md`

One line: `@AGENTS.md`. Nothing else, so every agent reads the same rules.

## `AGENTS.md`

Short and always loaded, written following `/writing-for-agents`: **at most about 60 lines**, rules and pointers only, no explanations an agent can find in `docs/`. In this order:

1. **What this repository is**: one paragraph with the product name, the one-sentence description from the interview, the kind of repository (backend or web frontend) and the sibling repository's name (`<slug>-frontend` / `<slug>-backend`), and that the backend's `openapi.json` is the contract between them (ADR-0008).
2. **Rules**, as short imperatives:
   - work only through pull requests; never merge, never push to `main`, never force-push; the human always merges;
   - one ticket per session and one pull request per ticket, opened with `/pr` (`recipes/autonomous-runs.md`, Pull request contents);
   - tests first (`/tdd`); `./project check` must pass before a pull request is opened;
   - never guess: when a ticket is ambiguous, comment the questions on the issue, switch it to `needs-info`, open a draft pull request if there is partial work, and stop;
   - follow `CODING_STANDARDS.md`; no explanatory comments in code;
   - everything technical in English; text the end user sees in the product language (`pt-BR`, …).
3. **Commands**: a four-row table (`project setup`, `project start:dev`, `project test`, `project check`) and a pointer to `docs/conventions.md` for the rest.
4. **Where things are**: `docs/architecture.md`, `docs/conventions.md`, `CODING_STANDARDS.md`, `GLOSSARY.md`, `docs/adr/`.
5. **Autonomous Runs**: the three prompts (`Implement issue #N`, `Implement the next ready ticket`, `Implement all ready tickets`) with one line each, and the limit of parallel subagents (**3**, the number the coordinator reads; the human may change it here).
6. **`## Agent skills`**: the block `setup-matt-pocock-skills` writes, filled in: `### Issue tracker` (GitHub Issues, see `docs/agents/issue-tracker.md`), `### Triage labels` (the five default labels, see `docs/agents/triage-labels.md`), `### Domain docs` (single-context, see `docs/agents/domain.md`).

## `CODING_STANDARDS.md`

`recipes/coding-standards.md` resolved for the repository: the backend keeps *Use case shape* and drops *Component shape (frontend)*, the frontend the opposite; the size and complexity limits and the tooling section name only this stack's tools (Pint, PHPStan, Deptrac, PHPMD for PHP; ESLint, Prettier, dependency-cruiser for React). It is `/code-review`'s criterion, so every rule stays checkable.

## `GLOSSARY.md`

In the Template's format (`GLOSSARY.md`: a title, one sentence on the product, a `## Language` section with **Term**, its definition and `_Avoid_:` synonyms). It starts with the product's own name and the domain nouns the user used in the interview (the things the product keeps and the people who use it), each defined in one sentence from the user's words. No technical terms. `/domain-modeling` grows it later.

## `docs/architecture.md` and `docs/conventions.md`

- **`docs/architecture.md`**: the stack recipe resolved for this project. Backend: `recipes/backend/clean-architecture.md` plus `recipes/backend/php.md`'s conventions, with only the chosen database and the VPS deployment (no "or MySQL", no "on GCP"), the folder tree with the real namespace, and the mechanisms the project uses (none yet means the section says none). Frontend: `recipes/frontend/architecture.md`, `libraries.md` and `security.md`, resolved for React.
- **`docs/conventions.md`**: naming, API paths and responses, errors (Problem Details with `code`, ADR-0011), logs, database naming (backend), the full `project` command table (`recipes/dev-commands.md`) and the Quality Gates with the command that runs each one alone and what the Lefthook hooks run.

## `docs/adr/`

One ADR per decision of the plan, numbered from `0001`, in the Template's ADR format (a title, a paragraph with the decision and the reason, then `## Considered Options` and `## Consequences`). The reason is the one the plan gave, tied to the user's own answers; the considered options are the rows' alternatives. Both repositories carry **the same set, with the same numbers**, so each knows the whole project:

| ADR | Decision |
|---|---|
| `0001-product-identity` | product and project name, product language, dark mode, Brand Tokens; the domain, Docker Hub user, host ports, monthly budget and alert email |
| `0002-repositories` | which repositories exist and why (polyrepo, ADR-0006 of the Template) |
| `0003-backend-<language>` | backend language, framework and runtime model |
| `0004-frontend-<framework>` | frontend framework and design system, single-page app, no BFF (ADR-0007) |
| `0005-database-<engine>` | the database engine |
| `0006-authentication` | the method chosen, or that none is generated yet and which one the plan expects |
| `0007-deploy-vps` | the VPS deploy target: Docker Hub images, Portainer webhook, host ports, the database as a container (ADR-0013 of the Template); the cloud move is recorded as a later phase |

A row the user marked as "not available" still gets its ADR, saying what was wanted and what was generated instead. Later decisions continue the numbering.

## `docs/agents/`

Copied from the vendored skills' source (*Vendored skills* below), from `skills/engineering/setup-matt-pocock-skills/`: `issue-tracker-github.md` saved as `issue-tracker.md` (its "PRs as a request surface" flag left at **no**), `triage-labels.md` and `domain.md` as they are. The Template's own `docs/agents/issue-tracker.md` is the local-markdown variant and is never copied.

## Vendored skills

The skills listed in `recipes/repository-layout.md` come from **`github.com/mattpocock/skills`**, at the newest commit of `main` on the day of the run, which is then pinned: clone it with `--depth 1`, record the commit, and copy each listed skill's folder (`skills/<group>/<name>/`, with its `scripts/` and other files) to `.claude/skills/<name>/`. The source is MIT-licensed: copy its `LICENSE` to `.claude/skills/LICENSE`. Check that every listed skill exists in the clone; a missing one stops the run (it was renamed or removed upstream, and the list in `recipes/repository-layout.md` must be fixed first). The upstream files use CRLF: convert the copied files to LF (`find .claude/skills docs/agents -type f -exec sed -i 's/\r$//' {} +`), since the repository forces LF and Git otherwise warns on every file. The original `git-guardrails-claude-code/scripts/block-dangerous-git.sh` stays in the vendored folder as shipped; the script registered in `settings.json` is the adapted `.claude/hooks/guardrails.sh`. The clone is a temporary folder outside both repositories and is deleted afterwards (an explicit `rm -r <absolute path of the clone>` works; a path held in a shell variable is refused unless written `"${VAR:?}/…"`).

## `.claude/settings.json` and the guardrail hook

The rules of `recipes/repository-layout.md` (*Agent guardrails*) in two layers, because a permission rule matches only the command text Claude writes (`git -C . push`, a full path or `sh -c` slip past it) while a hook sees every Bash call:

1. **`permissions.deny`**, the readable list:
   - `Bash(terraform apply *)`, `Bash(terraform destroy *)`, `Bash(terraform import *)`, `Bash(terraform state *)`;
   - `Bash(gh pr merge *)`;
   - `Bash(git push --force *)`, `Bash(git push -f *)`, `Bash(git push --force-with-lease *)`, `Bash(git push origin main *)`, `Bash(git push origin HEAD:main *)`;
   - `Bash(gh workflow run *)`;
   - `Read(./.env)` and one rule per other environment file the stack creates (backend: `Read(./.env.testing)`; `Read(./stack.env)` as well, the production variables a user may keep beside the repository; frontend: `Read(./.env.local)` when it exists). Never `Read(.env.*)`: it would also match `.env.example`, which the agent must read, and an allow rule cannot carve an exception out of a deny.
2. **`hooks.PreToolUse`** with matcher `Bash`, running `"$CLAUDE_PROJECT_DIR"/.claude/hooks/guardrails.sh`. The script is the vendored `git-guardrails-claude-code` script **adapted**, because the original blocks every `git push` and an Autonomous Run must push its own branch to open a pull request. It reads the hook's JSON from standard input and matches the raw text with `grep -E`, **without `jq`** (the dev images and the cloud session may not have it), and exits with code `2` and a `BLOCKED: <reason>` line on standard error when the command:
   - pushes to `main` (`main` or `:main` as a push target), force-pushes (`--force`, `-f`, `--force-with-lease`, a `+` refspec) or deletes a remote branch (`--delete`, `:branch`);
   - merges a pull request (`gh pr merge`, `gh api` on a `/merge` path);
   - runs `terraform` with `apply`, `destroy`, `import` or `state`;
   - triggers a workflow (`gh workflow run`, `gh api` on a `/dispatches` path);
   - reads an environment file (`.env`, `.env.testing`, `stack.env` as a word), whatever the program (`cat`, `less`, `grep`, `source`…); the script first deletes every `.env.example` and `stack.env.example` from the text with `sed`, since a regular expression has no look-ahead;
   - runs the destructive git commands of the original (`reset --hard`, `clean -f`, `branch -D`, `checkout .`, `restore .`).

   Otherwise it exits `0`. It is LF, executable (`git update-index --chmod=+x`), and has no comments (`recipes/coding-standards.md`).

**Prove it**: pipe a JSON line per rule into the script (`printf '%s' '{"tool_input":{"command":"git push origin main"}}' | .claude/hooks/guardrails.sh`) and check exit `2` for each blocked case, including the forms a permission rule misses (`git -C . push origin main`, `git push origin HEAD:main`, `terraform -chdir=infra destroy`, `source ./.env`), and exit `0` for `git push -u origin feature/42-add-role`, `git push origin feature/main-menu` (`main` inside a branch name), `cat .env.example`, `terraform plan`, `git status` and `./project check`. Pure `bash` and `grep -E` over the raw input pass all of these (run of 2026-10-07: 26 blocked cases returned `2` and 10 allowed cases returned `0`, with the script written from this description only).

## Lefthook

`lefthook.yml` at the root, calling the `project` script so the hooks run the same commands as a human and CI (`recipes/dev-commands.md`, Documented, not repeated):

- `pre-commit`: `./project lint` and `./project typecheck`, in parallel; both only check, they never rewrite files.
- `pre-push`: `./project test:unit` and `./project arch`.

Lefthook is pinned like any tool: in the backend, the release binary installed in the `dev` stage of the `Dockerfile` (for the image's architecture); in the frontend, the `lefthook` package as an exact `devDependency`, which pnpm must be allowed to build (`allowBuilds` in `pnpm-workspace.yaml`). `project setup` runs `lefthook install`, so the hooks exist after the first setup in the dev container and in the cloud session (`scripts/agent-setup.sh`).

**Prove it**: after `project setup`, commit a file with a lint error and check the commit is rejected, then fix it and check the commit goes through; then run the push hook (`lefthook run pre-push`; in the frontend `pnpm exec lefthook run pre-push`, since Lefthook is a project dependency there). With only Docker on the host, the commit is made inside the container (`docker compose run --rm -T app git commit -q -F - <<'EOF' … EOF`; the repository needs `user.name` and `user.email` set locally before, and the dev image `safe.directory` of item 18 in `recipes/backend/php.md` / item 21 in `recipes/frontend/react.md`). Run of 2026-10-07: both repositories rejected a broken commit (a Pint violation, an `id-denylist` error) and accepted the fixed one, and both pre-push hooks passed.

**A commit made from the host terminal**, where Lefthook is not installed (it lives in the container; the frontend's `node_modules` is in a Docker volume), was observed on 2026-10-07: Git prints `Can't find lefthook in PATH` and the commit goes through **without any hook**. So the hooks protect only commits made in the container or the cloud session; CI stays the authority, and the README's *Requirements* say that committing from the host skips them.

## `.template-version`

Three `key=value` lines, read by `/sync-template`:

```
commit=<the Template's full commit hash at generation>
date=<YYYY-MM-DD>
skills=mattpocock/skills@<the vendored commit hash>
```

When the Template has uncommitted changes during the run, add `dirty=true`, so a later sync knows the rules came from a state that was never recorded.
