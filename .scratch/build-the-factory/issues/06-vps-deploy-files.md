# 06: Production files for the VPS

**What to build:** every generated repository carries what it needs to run on a VPS (ADR-0013, `recipes/vps-deploy.md`): a `prod` Dockerfile target, `docker-compose.prod.yml`, `.env.example` and a thin `deploy.yml` caller. The central repository `GabrielSoares-Dev/workflows` gets the `docker-portainer-deploy` workflow.

**Blocked by:** 01 and 02 (both repositories generated and green)

**Status:** proven locally on 2026-10-07 by the Pet Clinic run (`generator-runs/pet-clinic`), except the central workflow, which is outside what a local run can prove

- [x] Backend `prod` target builds, starts with PostgreSQL (the compose file's `db`), runs the migrations at start (`Creating migration table ... DONE` in the container log) and answers `GET /health` (`{"status":"ok","version":"dev","database":"up"}`), as uid 10001, health check `healthy`, OPcache preload active
- [x] Frontend `prod` target builds with `VITE_API_URL`, serves `/` and `/some/deep/link` with status 200 as uid 101 (nginx), a missing `/assets/…` file answers 404, hashed assets carry the immutable cache header
- [x] `docker compose -f docker-compose.prod.yml config` passes in both repositories (the backend's needs a `stack.env`, a recipe gap now written down)
- [x] The two production containers work together: headless Chrome against the frontend on 8082 and the backend on 8081 shows `Pet Clinic`, `Estado del sistema`, `Versión dev`, `Base de datos up`, with no console message at all
- [x] `deploy.yml` caller exists in both, passes `actionlint`, and references only what `recipes/vps-deploy.md` defines (`permissions: contents: write`, `rollback_tag`, `health_url`, the frontend's `build_args`); the workflow was never run
- [ ] `GabrielSoares-Dev/workflows` has `docker-portainer-deploy` (pull request, human merges) with build, push, webhook, health poll, tag and rollback: not proven here (no GitHub access in a local run; the workflow is the user's repository)
- [x] No Terraform, `infra/` or cloud reference in the generated repositories: the only mentions are the ADRs, and the Terraform deny rules of the guardrail hook and `settings.json`, which the agent-rules recipe mandates whatever the stack

## Progress

Lean images (user requirement of 2026-10-07, `recipes/vps-deploy.md`, *Lean images*): the first `prod` images were 440 MB (backend, Alpine FrankenPHP) and 91.5 MB (frontend, `nginx-unprivileged:alpine`), both over the targets. Fixed: the frontend uses the `alpine-slim` variant (**30 MB**, target 60); the backend removes `php-cgi`, `phpdbg`, the PHP sources and the extension tooling in a `runtime` stage and flattens the `prod` stage with `FROM scratch` + `COPY --from` (**240 MB**, target 250). Both sizes are in the READMEs and in `0007-deploy-vps`.

Recipe corrections from this ticket: `stack.env.example` for the backend's production variables (`.env.example` is the local file; the Compose `env_file` overrides the image's `ENV`); the frontend's compose file has no network (two stacks with one network name warn); `docker compose -p <name>` for the production proof so the development containers are not recreated; `HEALTHCHECK NONE` in the backend `dev` stage; `-alpine-slim` nginx; a four-stage backend Dockerfile (`recipes/backend/php.md` item 20).
