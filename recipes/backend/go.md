# Go

The Go backend Stack Recipe. It follows `recipes/backend/clean-architecture.md`, whose **Code rules, Testing rules and Extra mechanisms rules** apply as written; this recipe only says how Go meets them and which tools it uses.

## Status: learning stack

The user is learning Go, so Go is in the menu as a **learning stack**, an explicit exception to the "only technologies the user masters" principle of `recipes/decision-guide.md`:

- The recipe is complete, with the same clean architecture and Quality Gates as every other stack.
- **The decision guide never recommends Go** for client projects or projects with a team; it is used only when the user explicitly asks for it, on personal projects.
- **In Go projects, the agent explains its idiomatic choices in every pull request** (why a channel, why this `defer`, why an interface sits where it does), so each review also teaches.
- The gates are stricter to make up for less experienced review: a broader `golangci-lint` rule set and the race detector (`go test -race`) on every run.
- When the user feels confident in Go, the "learning" status is dropped and Go becomes a regular stack.

## Choices

- **HTTP: the standard library (`net/http`) + Huma.** Since Go 1.22, `net/http` routes by method and path parameters (`GET /v1/roles/{id}`) with no framework. **Huma** sits on top: routes declared with Go types, request validation, the **OpenAPI 3.1 spec generated from code** (ADR-0008), and errors returned as **Problem Details** natively (ADR-0011). Starting from the standard library also teaches idiomatic Go.
- **Structure and names: the same map as the other recipes, with Go file names.**
  - Folders: `internal/domain`, `internal/application/useCases/role`, `internal/application/dtos/…`, `internal/infra/…`; entry points in `cmd/api` and `cmd/<function-or-batch>`.
  - **Type names are the same as in every other recipe** (`CreateRoleUseCase`, `RoleRepositoryInterface`, `CreateRoleUseCaseInputDto`), so the same design is recognizable in any language, deliberately over Go's habit of short names without an `Interface` suffix.
  - **File names in `snake_case`**, as Go tooling and the community expect (`create_role_use_case.go`).
  - **Errors are values**: a `BusinessError` type carrying an `ErrorCode`, returned (`return nil, NewBusinessError(ROLE_ALREADY_EXISTS)`), never `panic`; the global handler turns it into Problem Details. This is Go's form of the single `BusinessException(ErrorCode)` of ADR-0011.
  - Dependency injection is manual, wired in `main` (the composition root).
- **How Go meets the general rules**:
  - **Framework-free inner layers**: no Huma, `net/http`, sqlc, driver or SDK imports in `internal/domain` or `internal/application` (arch-go / depguard); dependencies arrive through constructor functions (`NewCreateRoleUseCase(roleRepository RoleRepositoryInterface)`).
  - **Transactions**: `pgx.Tx` / `sql.Tx`, only inside repositories.
  - **Types**: dates are `time.Time` in UTC; money is `int64` cents in a `Money` value object, never `float64`; enums are typed constants (`type ErrorCode string` with `const` values); a lookup that may find nothing returns `(Role, bool)` or `(*Role, error)` with a sentinel `ErrNotFound`, never a zero value as "not found"; slices returned empty, never `nil`, when a list is expected.
  - **DTOs and value objects** are structs passed by value with unexported fields and constructor functions for value objects (so they stay valid); mapping is hand-written (`fromRow` / `toDto` functions); repositories never return sqlc rows.
  - **Tests**: mockery mocks for ports only, builders in a `testhelpers` package, the database reset between integration tests.
  - **Mechanisms**: in-process schedulers (`robfig/cron`, `time.Ticker` jobs) are forbidden; consumers are push.
- **Conventions enforced by tools**: `gofmt` / `goimports`; golangci-lint (`revive` naming, `funlen`, `gocyclo`, `dupl`, `errcheck`, `forbidigo` against `fmt.Print*` and `panic` outside `main`); arch-go for the layer rules and for use cases exposing only `Execute` (Go exports by capital letter, so the method is `Execute`).
- **Implementation notes**: configuration from environment variables (`caarlos0/env`), validation messages shown to end users in the product's language, `slog` JSON handler with the request ID from the `context.Context`.
- **Plain Go**: Go has no framework split (the standard library is the base), so Event Functions use the same stack without Huma: a binary in `cmd/<function>` with the per-platform adapter in `internal/infra/functions/`.
- **Database: sqlc + goose.** Queries are plain SQL in `.sql` files and **sqlc generates typed Go functions** from them; migrations are numbered SQL files applied by **goose**. Same spirit as Drizzle in Node: explicit, typed SQL. Drivers: `pgx` (PostgreSQL), `go-sql-driver/mysql` (MySQL). Generated code stays in `internal/infra`.
- **Tests and quality**:
  - `testing` + **testify** (assertions) + **mockery** (generated mocks for ports); integration tests against the real database through **testcontainers-go**.
  - **golangci-lint** with a broad rule set: complexity, length and duplication limits (`gocyclo`, `funlen`, `dupl`), style (`revive`), ignored errors (`errcheck`), plus the default linters.
  - **`go test -race`** on every run.
  - **arch-go** (or golangci-lint's `depguard`) for architecture validation; `gofmt` / `goimports` for formatting.
  - **80% coverage** on `domain` + `application`.
- **Libraries**:

  | Category | Library |
  |---|---|
  | HTTP + validation + OpenAPI + Problem Details | `net/http` + Huma |
  | Database / migrations | sqlc + goose (`pgx` / `go-sql-driver/mysql`) |
  | Configuration | environment variables with `caarlos0/env` |
  | JSON logs | `log/slog`, request ID carried in the `context.Context` |
  | UUID v7 | `google/uuid` |
  | JWT / passwords | `golang-jwt/jwt` / `golang.org/x/crypto/argon2` |
  | Retry / circuit breaker | `cenkalti/backoff` / `sony/gobreaker` |
  | In-code rate limit | `golang.org/x/time/rate`; `go-redis/redis_rate` when shared |
  | Queue, events, file storage | `aws-sdk-go-v2` / `cloud.google.com/go` libraries |
  | Email (SMTP) | `wneessen/go-mail` |
  | Cache | `ristretto` per instance; `go-redis` when shared |
  | Long batch | a second binary in `cmd/<batch>`, run as an ECS task / Cloud Run Job |
  | Graceful shutdown | `http.Server.Shutdown` on `SIGTERM` |
- **Versions**: the latest stable Go release (Go has no LTS), following the version policy in `recipes/decision-guide.md`, pinned in `go.mod` (`go` and `toolchain` directives).
- **Runtime**:
  - **AWS Lambda**: a compiled binary on the `provided.al2023` runtime (very low cold start), packaged and deployed with the **Serverless Framework**, like PHP and Node; the HTTP API enters through one adapter file, `internal/infra/functions/api/lambda_handler.go` (`aws-lambda-go-api-proxy`), the same exception as Node. Everything else stays in Terraform, linked through SSM parameters (ADR-0002). Deploys run only in the pipeline, via OIDC.
  - **Containers**: the `Dockerfile` `prod` target is a **distroless static** image holding only the binary, non-root; the `dev` target carries Go, the quality tools and hot reload (air).
