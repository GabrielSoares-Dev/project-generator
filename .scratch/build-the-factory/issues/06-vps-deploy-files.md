# 06: Production files for the VPS

**What to build:** every generated repository carries what it needs to run on a VPS (ADR-0013, `recipes/vps-deploy.md`): a `prod` Dockerfile target, `docker-compose.prod.yml`, `.env.example` and a thin `deploy.yml` caller. The central repository `GabrielSoares-Dev/workflows` gets the `docker-portainer-deploy` workflow.

**Blocked by:** 01 and 02 (both repositories generated and green)

**Status:** Template side written (ADR-0013, `recipes/vps-deploy.md`, `php.md` item 20, `react.md` item 19, skill step 7); generation and proof pending

- [ ] Backend `prod` target builds, starts with a throw-away PostgreSQL, runs the migrations at start and answers `GET /health`
- [ ] Frontend `prod` target builds with `VITE_API_URL`, serves `/` and a deep link with status 200 as non-root
- [ ] `docker compose -f docker-compose.prod.yml config` passes in both repositories
- [ ] The two production containers work together (the page shows the backend's version)
- [ ] `deploy.yml` caller exists in both and references only what `recipes/vps-deploy.md` defines
- [ ] `GabrielSoares-Dev/workflows` has `docker-portainer-deploy` (pull request, human merges) with build, push, webhook, health poll, tag and rollback
- [ ] No Terraform, `infra/` or cloud reference in the generated repositories (only the ADR may mention the cloud phase)
