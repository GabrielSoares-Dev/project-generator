# Node (TypeScript)

The Node backend Stack Recipe. It follows `recipes/backend/clean-architecture.md`, whose **Code rules, Testing rules and Extra mechanisms rules** apply as written; this recipe only says how Node meets them and which tools it uses. The variant is chosen per Derived Project through `recipes/decision-guide.md`. Built from the user's `Boilerplate-nestjs-docker` and `Boilerplate-nestjs-serverless`, updated to the Template's decisions.

## Variants

- **Custom stack (the default)**: **Fastify** plus libraries chosen by the Template, with the clean architecture as the only structure; dependency injection is manual, wired in `infra/composition-root.ts`. Emphasized because NestJS tends to over-engineer: its modules, decorators and DI would be a second structure competing with the clean architecture. Fastify is mature and fast, and its **Zod schemas** validate requests and generate the OpenAPI spec straight from code (ADR-0008), with the same Zod the frontend uses. Hono is the alternative only when the smallest possible Lambda cold start is the priority.
- **NestJS**: only when the team maintaining the project already works with Nest, or a client requires it. The clean architecture stays inside; Nest lives only in `infra` (controllers, modules, providers). Use cases stay plain classes, registered as providers from `infra`.
- **Plain Node**: only for small Event Functions, no HTTP and no framework, with the full clean-architecture structure (same rule as plain Java and plain PHP).

## Versions

Node is the latest LTS the chosen libraries support; TypeScript and every library the latest stable, following the version policy in `recipes/decision-guide.md`; pinned through `.nvmrc`, `engines`, `packageManager` and the lockfile.

## Structure and names

- Folders are those of `recipes/backend/clean-architecture.md` (`src/domain`, `src/application/useCases/<feature>`, `src/application/dtos/<…>/<action>`, `src/infra/…`), with path aliases `@domain/*`, `@application/*`, `@infra/*` (as in the boilerplate).
- **File names follow the other backend recipes**: one exported class or type per file, and the **file name is the class name** in PascalCase, as Java and PHP (PSR-4) require: `application/useCases/role/CreateRoleUseCase.ts`, `application/repositories/RoleRepositoryInterface.ts`, `application/dtos/useCases/role/create/CreateRoleUseCaseInputDto.ts`, `infra/repositories/role/RoleRepository.ts`. This replaces the boilerplate's camelCase, entity-less names (`create.usecase.ts`).
- Corrections applied to the boilerplate: `execute` instead of `run`; Problem Details from one global error handler instead of the `{ statusCode, message, content }` envelope and per-controller `try/catch` on message strings; `BusinessException(ErrorCode)` in `domain` (the boilerplate's domain imported it from `application`); UUID v7; authentication only (no `@Permission` / RBAC); `httpOnly` cookies for the web; `Start` / `Finish` flow logs at `debug`.

## How Node meets the general rules

- **Framework-free inner layers**: no Fastify, Nest, Drizzle or SDK imports in `domain` or `application` (dependency-cruiser); dependencies arrive through the constructor (`constructor(private readonly roleRepository: RoleRepositoryInterface)`), wired in the composition root (or as Nest providers in the Nest variant).
- **Transactions**: Drizzle's `db.transaction(...)`, only inside repositories.
- **Types**: dates are `Date` in UTC (ISO strings at the API edge); money is integer cents in a `Money` value object, never a floating-point `number`; enumerations as `as const` objects with a derived union type (`ErrorCode` included); lookups return `T | undefined`, never `null` sentinels; collections returned as `readonly T[]`.
- **DTOs and value objects** are classes with `readonly` properties; mapping is hand-written (`fromModel` / `toDto` functions); repositories never return Drizzle rows.
- **Tests**: Vitest mocks (`vi.fn()`) for ports only, builders in `test/helpers`, the database reset between integration tests.
- **Mechanisms**: in-process schedulers (`node-cron`, `@nestjs/schedule`, `setInterval` jobs) are forbidden; consumers are push (an Event Function per queue on Lambda, a push endpoint for Pub/Sub).

## ORM: Drizzle (both variants)

Replaces the boilerplate's Prisma. SQL-like typed queries; raw SQL through ``sql`...` `` with escaped parameters; schema in TypeScript, with `drizzle-kit generate` producing plain, editable SQL migrations; types straight from the schema (no generate step); no binary engine, which keeps Lambda cold starts low. PostgreSQL and MySQL. Drizzle tables and types stay in `infra/models`.

## Tests and quality

- **Vitest** (replaces the boilerplate's Jest, same runner as the frontend); integration tests with `fastify.inject` (Supertest on NestJS) against the real database through **Testcontainers**.
- **Strict ESLint** with `@typescript-eslint/no-explicit-any` on, and the **same `.prettierrc` as the frontend**.
- **Strict `tsconfig`** (`strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`…), fixing the boilerplate's loose settings.
- **dependency-cruiser** for architecture validation, **jscpd** for duplication, ESLint complexity rules for the limits of `CODING_STANDARDS.md`.
- **80% coverage** on `domain` + `application`.

## Conventions enforced by tools

- **Format**: Prettier (CI checks, pre-commit applies).
- **Architecture and naming** (dependency-cruiser + eslint-plugin-check-file + custom ESLint rules): file name equals the exported class; classes in `application/useCases` end in `UseCase` and expose a single public method, `execute`, declared last; ports in `application/repositories` and `application/services` are interfaces ending in `Interface`; DTOs end in `Dto`; controllers end in `Controller`.
- **ESLint**: no `console.*` outside the logger, no floating promises, no `any`, no non-null assertions.

## Runtime

- **AWS Lambda**: packaged and deployed with the **Serverless Framework**, which manages the Lambda functions and API Gateway; everything else (database, buckets, CDN, alerts, budget, `-dev` resources) stays in Terraform, linked through SSM parameters (exception in ADR-0002). The HTTP API enters through one file, `infra/functions/api/LambdaHandler.ts`, wrapping the Fastify app with `@fastify/aws-lambda` (exception in ADR-0002). Code is **bundled with esbuild** (`serverless-esbuild`): minified, tree-shaken, packaged per function, with the AWS SDK v3 left out because the Lambda runtime provides it, so packages stay small and cold starts low. Deploys run only in the pipeline, via OIDC.
- **Containers** (Cloud Run, ECS): the same Fastify app, no adapter, from the `Dockerfile` `prod` target: the esbuild bundle on a Node slim / distroless base, non-root. The `dev` target carries Node, pnpm and the quality tools with hot reload.

## Implementation notes

- `LoggerService` on **pino** (JSON); the request ID travels through `AsyncLocalStorage` onto every log line.
- Configuration comes from environment variables, validated with Zod at startup; no per-environment files holding secrets.
- Validation messages shown to end users are in the product's language; everything technical stays in English.
- Graceful shutdown: Fastify's `close()` on `SIGTERM`, with a timeout below the cloud's grace period.

## Libraries

Custom stack; NestJS uses the same where it has no built-in equivalent.

| Category | Library |
|---|---|
| HTTP | Fastify |
| Validation + OpenAPI | Zod + `fastify-type-provider-zod` + `@fastify/swagger` |
| ORM / migrations | Drizzle + drizzle-kit |
| Dependency injection | manual, in `infra/composition-root.ts` |
| Configuration | environment variables validated with Zod at startup |
| JSON logs | pino, request ID through AsyncLocalStorage |
| JWT / passwords | jose / argon2 |
| Health check | own `GET /health` route |
| Outbound HTTP + retry | native `fetch` + p-retry |
| Circuit breaker | opossum |
| In-code rate limit | `@fastify/rate-limit`, Redis store when shared |
| Queue / events | AWS SDK v3 / `@google-cloud/pubsub` |
| File storage | AWS SDK v3 (S3, pre-signed URLs) / `@google-cloud/storage` |
| Email (SMTP) | nodemailer |
| Cache | lru-cache per instance; ioredis when shared |
| Long batch | own entry-point script run as an ECS task / Cloud Run Job |
| Graceful shutdown | Fastify `close()` on `SIGTERM` |
| Tests and quality | Vitest, Testcontainers, ESLint, Prettier, dependency-cruiser, jscpd |
