# Shared Workflows catalog

What the central repository `GabrielSoares-Dev/workflows` must contain (ADR-0004), pinned by tag (`@v1`). Each generated repository has thin caller workflows that point at these. This catalog is **derived from decisions already recorded** in the Template; each workflow is confirmed when it is written.

## Checks on every pull request

- **`project-ci`** (implemented, used by every generated repository, `recipes/github-setup.md`): job `pr-rules` (pull request title in Conventional Commits, branch name `<type>/<ticket>-<description>`) and job `gates` (`./project setup`, then each gate of the `gates` input one at a time, then `docker build --target <prod_target>`). Inputs: `gates`, `prod_target` (default `prod`), `backend_repository`; secret `backend_read_token`. Because every stack's `project` script has the same vocabulary, one workflow serves all stacks; the per-stack `ci-*` workflows below are what this one replaces for the stacks the factory builds today.

- **Common to every repository**: pull request title follows Conventional Commits; branch name matches `<type>/<ticket>-<description>`; expired feature flags warning (when the project uses flags).
- **Backend, per stack** (`ci-java`, `ci-php`, `ci-node`, `ci-go`): install, the stack's lint and format check, typecheck, architecture validation, unit and integration tests against a real database container, **80% coverage** on `domain` + `application`, dependency audit, size and complexity limits, **build of the `Dockerfile` `prod` target**, `openapi.json` up to date with the code, and, when the repository holds `infra/` (cloud phase only), Terraform `fmt` / `validate` / TFLint plus `terraform plan`.
- **Web frontend** (`ci-react`, `ci-angular`): install, lint (with the accessibility and raw-HTML rules), typecheck, unit and component tests with 80% coverage, bundle size, dependency audit, and the generated API client up to date with the backend's `openapi.json`.
- **Mobile** (`ci-expo`): the web checks with the mobile tools, Maestro end-to-end on Android on every pull request, iOS on demand.

## Manual workflows (`workflow_dispatch`)

- **`docker-portainer-deploy`** (backend and frontend, ADR-0013, `recipes/vps-deploy.md`), in this order: build the Dockerfile `prod` target (with the frontend's `VITE_API_URL` build argument) → log in to Docker Hub and push `deploy-YYYY-MM-DD.N` and `latest` → POST the Portainer webhook → poll `health_url` until it answers 200 with the new version → tag the commit and publish the GitHub Release. Inputs: `image`, `dockerfile_target`, `rollback_tag`, `health_url`; secrets: `docker_hub_username`, `docker_hub_access_token`, `portainer_webhook_url`. Migrations run in the backend container's entrypoint.
- **Rollback**: the same workflow with `rollback_tag` set to an earlier tag: it skips the build, pushes that image as `latest` and calls the webhook (`recipes/quality-gates.md`).
- **Cloud deploy** (later, when a project moves to the cloud, ADR-0002): assume the cloud role through OIDC → `terraform apply` → database restore point → migrations (expand-only) → deploy the application → smoke test → tag. Frontend: upload to the bucket, invalidate the CDN. Not generated today.
- **Restore test**: restore the latest backup to a temporary database, verify it, delete it (`recipes/backend/clean-architecture.md`).
- **Mobile** (when the project has an app): `release-store`, `promote-store`, `update-ota` (`recipes/mobile/architecture.md`).
