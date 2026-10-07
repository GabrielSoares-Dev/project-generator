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

## Creating the repositories

1. Ask for the owner (the user's account or an organization) and the visibility (private by default).
2. `gh repo create <owner>/<slug>-backend --private --source <folder> --remote origin --push`, then the same for the frontend. The first push goes to `main` **before** the protection exists, because a protected branch rejects it.
3. **Repository settings** (`gh api -X PATCH repos/<owner>/<repo>`): `allow_squash_merge` true, `allow_merge_commit` false, `allow_rebase_merge` false, `squash_merge_commit_title` `PR_TITLE`, `squash_merge_commit_message` `BLANK`, `delete_branch_on_merge` true.
4. **Branch protection** on `main` (`gh api -X PUT repos/<owner>/<repo>/branches/main/protection`): pull request required with zero approvals (the human is the only reviewer and cannot approve their own pull request, so the merge button is the review), required status checks `ci / pr-rules` and `ci / gates` with branches up to date, no force pushes, no deletion, `enforce_admins` false so the owner can recover a broken repository.
5. **Labels**: the five triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) with `gh label create`; the skeleton's default labels stay.
6. **GitHub Project** spanning both repositories: `gh project create --owner <owner> --title "<Product name>"` and `gh project link` for each repository. It needs the `project` token scope; if it is missing, list `gh auth refresh -s project` as a step for the user and go on.
7. **Variables** the workflows read (`gh variable set`): `HEALTH_URL` in each repository (`https://api.<domain>/health` for the backend, `https://app.<domain>` for the frontend) and `VITE_API_URL` (`https://api.<domain>`) in the frontend.
8. **Secrets are never created by the skill.** It lists them for the user: `DOCKER_HUB_USERNAME`, `DOCKER_HUB_ACCESS_TOKEN`, `PORTAINER_WEBHOOK_URL` in each repository, and `BACKEND_READ_TOKEN` in the frontend (a fine-grained token with read access to the backend repository's contents).

## Proving it

Open a first pull request from a branch named `feat/1-first-check` in each repository, watch both required checks pass, then confirm that a pull request with a title that is not Conventional Commits or a branch named outside the pattern fails `ci / pr-rules`, and that a direct push to `main` is rejected. Report each result; a check that was not seen failing is not proven.
