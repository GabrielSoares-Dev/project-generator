# 01: Go backend generated and green

**What to build:** `/new-project` generates the Go backend (`recipes/backend/go.md`, the learning stack) the way it generates Laravel: the clean-architecture structure, PostgreSQL in Docker Compose, `GET /health` with the live version, a committed `openapi.json`, the `project` script, the dev container and the `prod` image, with every backend Quality Gate run one by one. A new section *Generating the project* in `recipes/backend/go.md` records the steps learned, and the skill and `recipes/new-project.md` list Go as available. Needed before the agent-team platform (Ensemble, `docs/product/spec.md` in ensemble-backend, D1).

**Blocked by:** None

**Status:** in progress: the Template side is done; pending the agent-team Dev standards, `audit` proven where `vuln.go.dev` is reachable, the README, agent rules and CI callers of a full `/new-project` run with Go, and opening the dev container in VS Code

- [x] `recipes/backend/go.md` has *Generating the project*, proven by a run (`pet-clinic`, module `github.com/gabrielsoares-dev/pet-clinic-backend`)
- [x] `project lint`, `typecheck`, `arch`, `coverage` (80% on domain + application), `test:integration` (real PostgreSQL), `openapi:check` pass one by one, and `project check` as a whole up to `audit` (govulncheck cannot reach `vuln.go.dev` from this sandbox: to prove on the user's machine or in CI)
- [x] Each gate proven failing once (a lint error, a forbidden import, coverage below 80%, a stale `openapi.json`)
- [x] `prod` image: distroless, non-root, migrates at start, answers `GET /health`, health check healthy, size measured
- [x] `.claude/skills/new-project/SKILL.md`, `recipes/new-project.md`, `recipes/quality-gates.md`, `recipes/coding-standards.md`, `recipes/agent-rules.md`, `recipes/vps-deploy.md` name Go where they name PHP
- [x] agent-team's Dev backend carries the Go standards (agent-team#36)

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

- 2026-11-04 (2): backend code written (health use case behind ports, Problem Details through Huma's `NewError` / `NewErrorWithContext`, request ID, CORS, slog logger with masking, goose migrations embedded, sqlc `Ping` query), mocks by mockery v3 (`.mockery.yml`, `template: testify`, into `tests/mocks`), Makefile + `project` script. Passing one by one: `lint` (golangci-lint v2, 0 issues after fixing 12 real findings), `typecheck`, `arch` (arch-go 100% compliance and coverage), `test:unit` (3 packages), `coverage` (100% on domain + application), `test:integration` (6 tests against PostgreSQL 18.6), `openapi:check`. `audit`: govulncheck cannot reach `vuln.go.dev` from this sandbox (proxy 403), to prove in CI.
- Learned: Go package names are lowercase, so the folders are `usecases`, `dtos/usecases/health/checkhealth` (the recipe's `useCases` breaks the package-name convention); constants are CamelCase (`DatabaseUnavailable`) with the UPPER_SNAKE value, since revive rejects ALL_CAPS names; `go:embed migrations/*.sql` needs at least one file, so the first migration sets the database timezone to UTC; arch-go's coverage threshold needs a rule for the `tests` packages too; the `tools/` module cannot hold a Go program the root module runs, so the coverage check is `go tool cover -func` + `awk` in the Makefile; `huma.NewError` must be replaced too, or the OpenAPI error schema stays Huma's `ErrorModel`; `CreateHooks = nil` drops the `$schema` property and `Link` header.

- 2026-11-04: images pulled, Go module and tools module created. The sandbox of this session needs a local Go image with the proxy's CA (not part of the project).
- 2026-11-04 (3): every gate proven failing once in a copy (`fmt.Println` → forbidigo; `net/http` in `domain` → arch-go, after adding a `standard` allowlist: `shouldNotDependsOn external` alone let the standard library through; an untested use case → 63.4% < 80%; a changed summary → `openapi.json is out of date`). `./project setup` (needs `.env` loaded into the shell before migrating, since the container started without it), `start:dev` with air (`GET /health` → `{"status":"ok","version":"dev","database":"up"}`, debug flow logs with the request ID), `db:reset`, Lefthook (`lefthook install` creates a default `lefthook.yml` when the file is missing, so it is written first; a commit with `fmt.Println` was rejected, `lefthook run pre-push` passed). `prod` image **24.8 MB**, `nonroot`, health check `["CMD","/app/server","healthcheck"]`; `docker-compose.prod.yml` with `stack.env`: healthy, migrations applied at start (`goose_db_version`, timezone UTC), version from the build argument, `docker stop` exits 0 at once. `.dockerignore` must keep `tools/` (the `dev` stage reads `tools/go.mod`). `./project check` passes every gate up to `audit`, which this sandbox cannot reach.
