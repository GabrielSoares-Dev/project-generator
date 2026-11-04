# 01: Go backend generated and green

**What to build:** `/new-project` generates the Go backend (`recipes/backend/go.md`, the learning stack) the way it generates Laravel: the clean-architecture structure, PostgreSQL in Docker Compose, `GET /health` with the live version, a committed `openapi.json`, the `project` script, the dev container and the `prod` image, with every backend Quality Gate run one by one. A new section *Generating the project* in `recipes/backend/go.md` records the steps learned, and the skill and `recipes/new-project.md` list Go as available. Needed before the agent-team platform (`.scratch/platform/spec.md`, D1).

**Blocked by:** None

**Status:** in progress

- [ ] `recipes/backend/go.md` has *Generating the project*, proven by a run (`pet-clinic`, module `github.com/gabrielsoares-dev/pet-clinic-backend`)
- [ ] `project lint`, `typecheck`, `arch`, `coverage` (80% on domain + application), `test:integration` (real PostgreSQL), `audit`, `openapi:check` pass one by one, and `project check` as a whole
- [ ] Each gate proven failing once (a lint error, a forbidden import, coverage below 80%, a stale `openapi.json`)
- [ ] `prod` image: distroless, non-root, migrates at start, answers `GET /health`, health check healthy, size measured
- [ ] `.claude/skills/new-project/SKILL.md`, `recipes/new-project.md`, `recipes/quality-gates.md`, `recipes/coding-standards.md`, `recipes/agent-rules.md`, `recipes/vps-deploy.md` name Go where they name PHP
- [ ] agent-team's Dev backend carries the Go standards (separate pull request in agent-team)

## Decisions taken in the run (to confirm in review)

| Decision | Why |
|---|---|
| Go 1.27.3 (`golang:1.27.3-trixie`), PostgreSQL 18.6, `gcr.io/distroless/static-debian13:nonroot` | latest stable on 2026-11-04 |
| The quality tools live in a separate module, `tools/go.mod`, with `tool` directives (`go get -tool`), installed in the `dev` image with `go install tool` | versions pinned in the repository and updated by Renovate, without mixing the tools' dependencies into the application's module (golangci-lint advises against sharing them) |
| Tools: golangci-lint v2.15.0, arch-go v1.7.0, mockery v3.9.0, sqlc v1.31.1, govulncheck v1.9.0, air v1.67.4, lefthook v2.2.2 | latest on the day |
| Libraries: Huma v2.40.0, pgx v5.12.0, goose v3.29.0, caarlos0/env v11.4.2, google/uuid v1.6.0, testify v1.12.1 | latest on the day |
| Integration tests use the Compose `db` service with an `app_test` database, like PHP, instead of testcontainers-go | testcontainers needs the Docker socket inside the dev container and in CI's `docker compose run`; the Compose database is what every other recipe uses |
| One binary with subcommands (`serve`, `migrate`, `healthcheck`, `openapi`); `serve` runs the goose migrations (embedded) before listening; the compose health check runs `healthcheck` | distroless has no shell or curl, and the VPS recipe migrates at start |
| Commands live in a `Makefile` the `project` script calls | Go has no script runner of its own; `make` ships in the Go image |

## Progress

- 2026-11-04: images pulled, Go module and tools module created. The sandbox of this session needs a local Go image with the proxy's CA (not part of the project).
