# Shared Workflows catalog

What the central repository `GabrielSoares-Dev/workflows` must contain (ADR-0004), pinned by tag (`@v1`). Each generated repository has thin caller workflows that point at these. This catalog is **derived from decisions already recorded** in the Template; each workflow is confirmed when it is written.

## Checks on every pull request

- **Common to every repository**: pull request title follows Conventional Commits; branch name matches `<type>/<ticket>-<description>`; expired feature flags warning (when the project uses flags).
- **Backend, per stack** (`ci-java`, `ci-php`, `ci-node`, `ci-go`): install, the stack's lint and format check, typecheck, architecture validation, unit and integration tests against a real database container, **80% coverage** on `domain` + `application`, dependency audit, size and complexity limits, **build of the `Dockerfile` `prod` target**, `openapi.json` up to date with the code, and Terraform `fmt` / `validate` / TFLint plus `terraform plan` when `infra/` changed.
- **Web frontend** (`ci-react`, `ci-angular`): install, lint (with the accessibility and raw-HTML rules), typecheck, unit and component tests with 80% coverage, bundle size, dependency audit, and the generated API client up to date with the backend's `openapi.json`.
- **Mobile** (`ci-expo`): the web checks with the mobile tools, Maestro end-to-end on Android on every pull request, iOS on demand.

## Manual workflows (`workflow_dispatch`)

- **Backend deploy** (per runtime), in this order: assume the cloud role through OIDC → `terraform apply` → create the database restore point → run migrations (expand-only) → deploy the application (Serverless Framework / Bref, or the container image) → smoke test `GET /health` and check the live version → tag `deploy-YYYY-MM-DD.N` and publish the GitHub Release.
- **Frontend deploy**: build with the project's public configuration → upload to the bucket → invalidate the CDN → upload source maps.
- **Rollback**: the same deploy workflow run with an earlier tag (`recipes/quality-gates.md`).
- **Restore test**: restore the latest backup to a temporary database, verify it, delete it (`recipes/backend/clean-architecture.md`).
- **Mobile** (when the project has an app): `release-store`, `promote-store`, `update-ota` (`recipes/mobile/architecture.md`).
