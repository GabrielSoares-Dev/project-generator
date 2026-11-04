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
    uses: GabrielSoares-Dev/workflows/.github/workflows/project-ci.yml@v1
    with:
      gates: lint typecheck arch coverage test:integration audit openapi:check
```

The backend's `gates` are `lint typecheck arch coverage test:integration audit openapi:check`. The frontend's are `lint typecheck arch coverage audit size openapi:check`, plus `backend_repository: <owner>/<slug>-backend` under `with:` and `secrets: backend_read_token: ${{ secrets.BACKEND_READ_TOKEN }}` (`recipes/frontend/react.md`, item 15, passes `BACKEND_REPOSITORY` and `GITHUB_TOKEN` into the container). The job names the required checks refer to are `ci / pr-rules` and `ci / gates`.

## The agent team workflows

Each repository also has the agent team's two callers, from agent-team's `examples/` at the pinned tag (`recipes/agent-rules.md`, *The agent team*):

- `.github/workflows/agent-team.yml`: the dispatcher, on `issues: [labeled]`, `pull_request: [opened, closed]`, `issue_comment: [created]`, a 10-minute `schedule` and `workflow_dispatch`, calling `GabrielSoares-Dev/agent-team/.github/workflows/dispatcher.yml@<tag>` with `agents-repository` and `agents-ref`.
- `.github/workflows/agent-paths.yml`: on `pull_request: [opened, synchronize, reopened]`, calling `agent-paths.yml@<tag>`; its job is `paths / paths`.

`project agents:update` moves both to a new tag with the config.

**The agent-team repository must be public** (found by the Ensemble run, 2026-11-04): the callers use its reusable workflows, which GitHub refuses to start from another repository while it is private (each run fails at once with no job, so the required `paths / paths` never appears), and the dispatcher checks agent-team out with the calling repository's `GITHUB_TOKEN`, which cannot read a private repository. Check it before publishing: `gh repo view GabrielSoares-Dev/agent-team --json visibility`.

## Creating the repositories

1. Ask for the owner (the user's account or an organization) and the visibility (private by default).
2. `gh repo create <owner>/<slug>-backend --private --source <folder> --remote origin --push`, then the same for the frontend. The first push goes to `main` **before** the protection exists, because a protected branch rejects it.
3. **Repository settings** (`gh api -X PATCH repos/<owner>/<repo>`): `allow_squash_merge` true, `allow_merge_commit` false, `allow_rebase_merge` false, `squash_merge_commit_title` `PR_TITLE`, `squash_merge_commit_message` `BLANK`, `delete_branch_on_merge` true.
4. **Branch protection** on `main` (`gh api -X PUT repos/<owner>/<repo>/branches/main/protection`): pull request required with zero approvals (the human is the only reviewer and cannot approve their own pull request, so the merge button is the review), required status checks `ci / pr-rules`, `ci / gates` and `paths / paths` with branches up to date, no force pushes, no deletion, `enforce_admins` false so the owner can recover a broken repository.
5. **Labels**: every label of the agent team's flow, the five triage labels included, with agent-team's `bin/agents-labels --repository <owner>/<repo>` (from the same clone at the pinned tag; it uses the `gh` login). The skeleton's default labels stay.
6. **GitHub Project** spanning both repositories: `gh project create --owner <owner> --title "<Product name>"` and `gh project link` for each repository. It needs the `project` token scope; if it is missing, list `gh auth refresh -s project` as a step for the user and go on.
7. **Variables** the workflows read (`gh variable set`): `HEALTH_URL` in each repository (`https://api.<domain>/health` for the backend, `https://app.<domain>` for the frontend) and `VITE_API_URL` (`https://api.<domain>`) in the frontend.
8. **Scheduled tasks are never created by the skill**: they live in the user's claude.ai account. It shows the user each repository's `docs/agents/agent-team-setup.md` (one task per role, the label that starts it and its exact prompt, and the PM's API trigger for the platform), to create at claude.ai/code/routines; the API trigger's token can only be created there.
9. **Secrets are never created by the skill.** It lists them for the user: `DOCKER_HUB_USERNAME`, `DOCKER_HUB_ACCESS_TOKEN`, `PORTAINER_WEBHOOK_URL` in each repository, and `BACKEND_READ_TOKEN` in the frontend (a fine-grained token with read access to the backend repository's contents).

## Proving it

Open a first pull request from a branch named `feat/1-first-check` in each repository, watch the three required checks pass (`ci / pr-rules`, `ci / gates`, `paths / paths`), then confirm that a pull request with a title that is not Conventional Commits or a branch named outside the pattern fails `ci / pr-rules`, and that a direct push to `main` is rejected. Prove `paths / paths` fails once too: a commit ending with `Agent-Role: qa` that changes a file outside the test paths. Report each result; a check that was not seen failing is not proven.
