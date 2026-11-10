# Activating the agent team in a Derived Project

What turns a generated project's agent team on, after `/new-project` has published its repositories (`recipes/github-setup.md`). Everything here lives outside the repositories (GitHub settings, the user's claude.ai account, a cloud environment), so the skill prints it as a checklist and never does it itself. Learned by turning the team on for Ensemble (2026-11); every shape below is the one the server stored, not a guess.

## 1. GitHub, once per repository

1. **The Claude GitHub App** (github.com/apps/claude) installed on every repository of the project. Without it, scheduled tasks receive no GitHub events.
2. **The Ensemble GitHub App** installed on every repository of the project, which registers them in Ensemble: Ensemble is the dispatcher (ADR-0015), so without it nothing moves the work between the roles. The App needs Issues and Pull requests (write), Contents, Metadata and Actions (read), and the Issues, Issue comment, Pull request and Workflow run events.
3. **Labels**: `bin/agents-labels --repository <owner>/<repo>` (`recipes/github-setup.md`, item 5).
4. **Secrets the callers read**: `AGENT_TEAM_READ_TOKEN` (a fine-grained token: Contents read-only on agent-team while it is private); `BACKEND_READ_TOKEN` in the frontend (Contents read-only on the backend), for `openapi:check`. Without the first, `paths` fails at the checkout with `Repository not found`; without the second, the frontend's `gates` fail at `openapi:check`.
5. **The uptime workflow off until the first deploy** (Actions, agent-team uptime, Disable workflow): before production exists it opens a `Production is down` issue that never closes.

## 2. A cloud environment where `./project check` passes

The scheduled tasks run as Claude Code cloud sessions in one environment of the user's account. The default image has no project database and older toolchains, so each project gets its own personal environment, named after the product, with:

- `PROJECT_LOCAL=1` (the `project` script runs the commands in the session, not through Docker Compose);
- the hosts the gates need beyond the package registries: `vuln.go.dev` for a Go backend's `audit`;
- a setup script, run as root from the folder that holds the checkouts, that skips a repository that is not there. For a Go backend and a React frontend:

```bash
#!/bin/bash
set -euo pipefail
if [ -d <slug>-backend ]; then
  service postgresql start
  grep -q ' db$' /etc/hosts || echo '127.0.0.1 db' >> /etc/hosts
  su postgres -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='app'\"" | grep -q 1 \
    || su postgres -c "psql -c \"CREATE USER app WITH PASSWORD 'app' CREATEDB;\""
  for db in app app_test; do su postgres -c "createdb -O app $db" 2>/dev/null || true; done
  (cd <slug>-backend/tools && GOTOOLCHAIN=go<version of go.mod> GOBIN=/usr/local/bin go install tool)
fi
if [ -d <slug>-frontend ]; then
  if [ ! -x /opt/node24/bin/node ]; then
    mkdir -p /opt/node24
    curl -fsSL https://nodejs.org/dist/v24.22.2/node-v24.22.2-linux-x64.tar.xz | tar -xJ -C /opt/node24 --strip-components=1
  fi
  mkdir -p /root/.local/bin
  for tool in node npm npx corepack; do ln -sf /opt/node24/bin/$tool /root/.local/bin/$tool; done
  /opt/node24/bin/corepack enable --install-directory /root/.local/bin
fi
```

Why each line: `.env.example` points `DB_HOST` at the Compose service `db`, so the host name resolves to the local PostgreSQL; the user, password and databases are the ones of `.env.example` and the integration database `app_test`; the Go tools must be built with the module's toolchain (built with an older one, golangci-lint refuses the module); the frontend's `engines` asks for Node 24 and its `packageManager` for pnpm through corepack, while the image ships Node 22 on the `PATH`, so Node 24 goes first in `/root/.local/bin`. Proven for Ensemble: the backend passed every gate but `audit` until `vuln.go.dev` was allowed, the frontend passed every gate.

Two `Default` environments with the same name cannot be told apart by tools that switch environments: rename the spare one.

## 3. The scheduled tasks

One task per role and repository: nine per repository, from `.agents/scheduled-tasks.json`. They are created from Claude Code (v2.1.225 or later) with the `/schedule` prompt that closes the scheduled-task step of `docs/agents/agent-team-setup.md` (agent-team v0.5.2 or later), in the environment of section 2. What the server accepts:

- **Each task has two GitHub triggers**, `hook_type` `app`, `source` `github`, `scope_id` `<owner>/<repo>`: one with `events` `["issues.labeled"]` and filter `{"clauses":[{"field":"issue.labels","op":"FILTER_OP_IN","values":["run:<role>"]}]}`, one with `events` `["pull_request.labeled"]` and the field `pr.labels`. One trigger with both events and a filter is refused (`cannot combine issues.* and pull_request.* events with a filter`); a filter in any other shape (`{"label": …}`, `labels`, `conditions`) is dropped without an error, which leaves a task that runs on every label. Check that every create response carries `filter`.
- **The web editor holds one GitHub trigger per task**; the second one is added from Claude Code. Its filter dropdown (Rótulos, "está entre") stores the same shape.
- **No connectors**: a task created from Claude Code gets the account's connectors attached; pass `clear_mcp_connections: true` and check the task page.
- **Push notifications** come on by default: turn them off for the team's tasks, or every run notifies the phone.
- The PM's **API trigger** (for the platform's PM chat) is added on the web later; its token is shown once.

Rejected alternative: one shared task per role for every project, fired through its API trigger with the repository and issue in the payload. Tested: the payload arrives, but a session reaches only the repositories selected on the task and cannot attach another, so a shared task would clone every repository of every project on each run.

## 4. The first ticket

With `"supervised": true` in `.agents/config.json`, the human applies `ready-for-agent` to a `spec-ready` ticket and answers each `/ok` the dispatcher asks for between hand-offs. A run's transcript opens from the task's History on claude.ai/code/routines.

## 5. Running the backlog

From agent-team v0.6.0 the order is each ticket's `## Blocked by`: the human may apply `ready-for-agent` to every `spec-ready` ticket at once. The ones whose blockers are open wait as `blocked`, and each merge releases what it unblocked, at most `maxConcurrent` at a time. With `"supervised": false` (the user's choice for Ensemble once the first tickets ran clean) the Dev, QA and the Reviewer hand off without `/ok`, and the human only reviews and merges what reaches `ready-for-human`. A ticket whose `## UI` section changes a screen or the UX (a flow, an interaction, texts, states) goes to the Designer first: its specification waits on the issue in `design-review` until the human replies `/approve` (or comments changes, and the Designer revises), and only then the Dev starts (the user's choice, for every project: every change to a screen or to the UX is approved before it is built).
