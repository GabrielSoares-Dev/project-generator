# Publishing to GitHub

What `/new-project` creates on GitHub **after** the repositories pass every gate locally and **only when the user asks for it**, with the plan's confirmation. The skill uses the `gh` CLI the user is already logged in to. The agent never runs any of this on its own in a Derived Project.

## The CI caller

Each repository has `.github/workflows/ci.yml`, a thin caller of the Shared Workflow `project-ci` (ADR-0004, `recipes/shared-workflows.md`):

```yaml
name: CI
on:
  pull_request:
    branches: [main]
permissions:
  contents: read
  pull-requests: read
jobs:
  ci:
    uses: GabrielSoares-Dev/workflows/.github/workflows/project-ci.yml@1.1
    with:
      gates: lint typecheck arch coverage test:integration audit openapi:check
```

The backend's `gates` are `lint typecheck arch coverage test:integration audit openapi:check`. The frontend's are `lint typecheck arch coverage audit size openapi:check`, plus `backend_repository: <owner>/<slug>-backend` under `with:` and `secrets: backend_read_token: ${{ secrets.BACKEND_READ_TOKEN }}` (`recipes/frontend/react.md`, item 15, passes `BACKEND_REPOSITORY` and `GITHUB_TOKEN` into the container). The job names the required checks refer to are `ci / pr-rules` and `ci / gates`.

## The agent team workflows

Each repository also has the agent team's two callers, from agent-team's `examples/` at the pinned tag (`recipes/agent-rules.md`, *The agent team*):

- `.github/workflows/agent-team.yml`: the dispatcher, on `issues: [labeled]`, `pull_request: [opened, closed]`, `issue_comment: [created]`, a 10-minute `schedule` and `workflow_dispatch`, calling `GabrielSoares-Dev/agent-team/.github/workflows/dispatcher.yml@<tag>` with `agents-repository` and `agents-ref`.
- `.github/workflows/agent-paths.yml`: on `pull_request: [opened, synchronize, reopened]`, calling `agent-paths.yml@<tag>`; its job is `paths / paths`.

`project agents:update` moves both to a new tag with the config.

**Once per account**: the `workflows` repository is private, so its reusable workflows run in other repositories only after *Settings → Actions → General → Access → Accessible from repositories owned by the user*; without it every caller fails before starting, with no job. **agent-team, when private, needs a read token**: the access setting lets its callers start, but its workflows then check agent-team out, and the calling repository's `GITHUB_TOKEN` cannot read a private repository (`Repository not found`, seen in the Ensemble run of 2026-11-04). Since agent-team v0.5.1 the callers pass `AGENT_TEAM_READ_TOKEN`: set it in every generated repository, a fine-grained token with *Contents: Read-only* on agent-team and *Issues: Read-only* on every repository of the project (agent-team v0.6.0 reads the `Blocked by` tickets of the other repositories with it) (`gh secret set AGENT_TEAM_READ_TOKEN --repo <owner>/<repo>`); it expires, so the user notes the date. A public agent-team needs no token. **The CI caller pins `project-ci.yml@1.1`**: the `v1` tag predates the step that lets the dev container's user write the checkout, so a web frontend, whose container runs as `node`, fails `./project setup` with `cp: cannot create regular file '.env': Permission denied`.

## Creating the repositories

1. Ask for the owner (the user's account or an organization) and the visibility (private by default).
2. `gh repo create <owner>/<slug>-backend --private --source <folder> --remote origin --push`, then the same for the frontend. The first push goes to `main` **before** the protection exists, because a protected branch rejects it.
3. **Repository settings** (`gh api -X PATCH repos/<owner>/<repo>`): `allow_rebase_merge` true, `allow_squash_merge` false, `allow_merge_commit` false, `delete_branch_on_merge` true (rebase and merge only, the user's choice: `recipes/quality-gates.md`). With rebase merging a pull request behind `main` is brought up to date with GitHub's **Update branch → Update with rebase**, never by merging `main` into it, since a merge commit cannot be rebased onto `main`.
4. **Branch protection** on `main` (`gh api -X PUT repos/<owner>/<repo>/branches/main/protection`): pull request required with zero approvals (the human is the only reviewer and cannot approve their own pull request, so the merge button is the review), required status checks `ci / pr-rules`, `ci / gates` and `paths / paths` with branches up to date, no force pushes, no deletion, `enforce_admins` false so the owner can recover a broken repository.
5. **Labels**: every label of the agent team's flow, the five triage labels included, with agent-team's `bin/agents-labels --repository <owner>/<repo>` (from the same clone at the pinned tag; it uses the `gh` login). The skeleton's default labels stay.
6. **GitHub Project** spanning both repositories: `gh project create --owner <owner> --title "<Product name>"` and `gh project link` for each repository. It needs the `project` token scope; if it is missing, list `gh auth refresh -s project` as a step for the user and go on.
7. **Variables** the workflows read (`gh variable set`): `HEALTH_URL` in each repository (`https://api.<domain>/health` for the backend, `https://app.<domain>` for the frontend) and `VITE_API_URL` (`https://api.<domain>`) in the frontend.
8. **Scheduled tasks are never created by the skill** (the whole activation, environment and trigger shapes included, is `recipes/agent-team-activation.md`): they live in the user's claude.ai account. At the end it prints, ready to paste, the `/schedule` prompt that closes the scheduled-task step of each repository's `docs/agents/agent-team-setup.md` (agent-team v0.5.2 or later), and tells the user to paste it in Claude Code (v2.1.225 or later) opened in that repository's folder, with the Claude GitHub App (github.com/apps/claude) installed on the repository: it creates every task of `.agents/scheduled-tasks.json` with its model, exact prompt and a GitHub trigger filtered to its label, and lists them before saving. The PM's API trigger is added later on the web (claude.ai/code/routines), when the platform needs it, since its token can only be created there.
9. **Secrets are never created by the skill.** It lists them for the user: `DOCKER_HUB_USERNAME`, `DOCKER_HUB_ACCESS_TOKEN`, `PORTAINER_URL` and `PORTAINER_API_KEY` in each repository (`recipes/vps-deploy.md`), and `BACKEND_READ_TOKEN` in the frontend (a fine-grained token with read access to the backend repository's contents).

## Proving it

Open a first pull request from a branch named `feat/1-first-check` in each repository, watch the three required checks pass (`ci / pr-rules`, `ci / gates`, `paths / paths`), then confirm that a pull request with a title that is not Conventional Commits or a branch named outside the pattern fails `ci / pr-rules`, and that a direct push to `main` is rejected. Prove `paths / paths` fails once too: a commit ending with `Agent-Role: qa` that changes a file outside the test paths. Report each result; a check that was not seen failing is not proven.
