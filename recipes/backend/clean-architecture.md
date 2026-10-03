# Backend clean architecture

The folder structure, naming and testing layout every backend Stack Recipe follows, whatever the language. Each language recipe translates names to that language's idioms (casing, file extensions, package rules) but keeps the same layers, folders and responsibilities.

## Layers and dependency direction

```
infra  ──►  application  ──►  domain
```

Dependencies point inward only. `domain` imports nothing from the other layers or from any framework. `application` imports only `domain`. `infra` imports both and is the only layer that knows about frameworks, databases, HTTP or the platform the code runs on.

The application is always a plain HTTP server. Nothing in any layer is specific to Lambda, Cloud Functions or any other runtime (see ADR-0002); adapting to a runtime happens in the deploy layer, outside this tree. The one exception is Event Functions, which get a thin per-platform adapter in `infra/functions/`.

Every backend publishes an **OpenAPI specification** generated from its code (routes, request bodies, responses). It is the contract the frontend generates its client from (ADR-0008).

Every backend repository ships a **dev container** (`.devcontainer/`) built on its own `docker-compose` (app + database), with the language toolchain, the Quality Gate tools and Lefthook preinstalled, so nothing but Docker is needed on the host and the machine, CI and cloud sessions run the same versions.

Every backend has **one multi-stage `Dockerfile` with two targets**:

- **`dev`**: the language toolchain, Quality Gate tools, Lefthook and hot reload; used by `docker-compose` and the dev container for local work.
- **`prod`**: the minimal production image: only what runs, **non-root user**, no build tools, a healthcheck on `/health`, pinned versions. Base image per stack: a minimal JRE (distroless or Temurin) for Java, FrankenPHP for PHP, Node slim / distroless for Node.

The `prod` target is **built in CI on every pull request**, even in projects that run on Lambda from a zip (Bref, Serverless Framework), so switching from function to container stays a configuration change (ADR-0002) and the image never breaks unnoticed. A web frontend gets the same two-target `Dockerfile` only when it turns on SSR; an SPA has none (static files on the CDN), and mobile apps have none.

Every backend exposes **`GET /health`**, which also checks the database connection, for containers, Cloud Run and the deploy workflow, and returns the version currently live.

## Folder structure

Organized by layer first, then by feature inside each layer.

```
src/
├── domain/
│   ├── entities/                         Role, User, Invoice
│   ├── enums/                            InvoiceStatus, ErrorCode
│   └── exceptions/                       BusinessException (carries an ErrorCode)
├── application/
│   ├── useCases/<feature>/               CreateRoleUseCase, FindRoleByIdUseCase
│   ├── repositories/                     RoleRepositoryInterface            (ports)
│   ├── services/                         LoggerServiceInterface, AuthServiceInterface (ports)
│   └── dtos/
│       ├── useCases/<feature>/<action>/      CreateRoleUseCaseInputDto, FindRoleByIdUseCaseOutputDto
│       ├── repositories/<feature>/<method>/  CreateRoleRepositoryInputDto, FindRoleByNameRepositoryOutputDto
│       └── services/<service>/<method>/      GetLoggedUserDataOutputDto
└── infra/
    ├── config/                           global exception handler (→ Problem Details), security, DI wiring
    ├── http/
    │   ├── controllers/                  RoleController (routes under /v1/<entity>)
    │   ├── filters/                      AuthenticationFilter, RequestIdFilter, RateLimitFilter
    │   └── validators/<feature>/         CreateRoleValidator (request body validation)
    ├── functions/<name>/                 Event Function adapters: one file per platform (Lambda, GCP) turning the event into a use case input DTO
    ├── models/                           ORM/database models, never leave infra
    ├── repositories/<feature>/           RoleRepository implements RoleRepositoryInterface
    └── services/                         LoggerService implements LoggerServiceInterface
migrations/                               V<n>__<snake_description>.sql, versioned, schema only (development data lives in the dev seed, never in migrations)
```

## Database naming

Relational databases use `snake_case` everywhere, checked on migrations:

- Tables in the **plural** (`roles`, `role_permissions`); columns in the singular (`created_at`, `role_id`).
- Primary key `id` (UUID v7); foreign key `<singular_table>_id` (`role_id`).
- Every table has `created_at` and `updated_at`; booleans start with `is_` / `has_` (`is_active`).
- Named constraints and indexes: `pk_roles`, `fk_role_permissions_role_id`, `uq_roles_name`, `idx_roles_created_at`.
- No reserved words as names.

The ORM maps code camelCase to database snake_case. NoSQL collections and attributes (DynamoDB, Firestore) use camelCase, like the JSON.

## Identifiers

Every entity is identified by a **UUID v7** generated by the application, never by a database auto-increment: it is time-ordered (index-friendly in PostgreSQL and MySQL), works the same in DynamoDB and Firestore, and does not expose record counts or guessable IDs in the API.

## The backend serves the screens

The backend plays the BFF role itself (no separate BFF, ADR-0007): it does as much processing as possible so the frontend stays simple, only displaying data and collecting input.

- **Resource endpoints by default, plus screen endpoints** when a screen needs data from several resources: the screen gets **one endpoint** returning exactly what it shows, already aggregated (`GET /v1/orders/{id}/details`, or `GET /v1/dashboard` for a screen with no owning resource). Each is a regular use case (`GetOrderDetailsUseCase`).
- **The backend computes everything that is a rule or derived from one**: totals, computed statuses ("overdue", "due today"), what the user may do with each item (`canEdit`, `canCancel` booleans in the response), counts, and **sorting, filtering and pagination always server-side**. The frontend never filters, sorts or sums lists.
- **The backend formats values for display**: dates, money and numbers come ready to show, so the frontend formats nothing. The frontend's `shared/http` interceptor sends the browser's `Accept-Language` (`pt-BR`) and `X-Timezone` (`America/Sao_Paulo`) on every request; the backend formats with them and falls back to `pt-BR` / `America/Sao_Paulo` when they are missing. Responses carry **both the raw value and its formatted twin** (`createdAt` + `createdAtFormatted`, `totalCents` + `totalFormatted`): the frontend displays the formatted one, and the raw one serves edit fields and charts.
- **The backend sends display content, not presentation** (server-driven UI level 2):
  - Content comes as **semantic fields**: `title`, `subtitle`, `description`, `label`, `message`, `hint`… (e.g. a screen's title and description, a status label, why a button is disabled). Never markup, HTML tags, heading levels or styles: the frontend decides how each field renders (`h1` or `h2`, which component, which size).
  - Visual state comes as a **semantic `variant`** (`danger`, `warning`, `success`, `info`, `neutral`, an enum in the OpenAPI spec), **only for components that have variants** (badge, alert, button…). Never a color value: the design system maps each variant to the Brand Tokens.
  - The frontend keeps only layout and the mapping from content and variants to components.
- **The backend is the source of truth for validation.** The frontend checks only basic format with the Zod schemas orval generates from the OpenAPI spec (required, length, email format) for instant feedback; every business rule ("name already exists", "date cannot be in the past") comes from the backend as Problem Details with per-field errors, which the frontend only displays. No hand-written validation rules in the frontend.

## API paths

- `/v1/<resource-in-plural-kebab-case>`: `/v1/roles`, `/v1/roles/{id}`, `/v1/user-profiles`.
- Actions that are not CRUD become a verb sub-resource: `POST /v1/roles/{id}/sync-permissions`.
- Query parameters are camelCase, like the JSON (`?page=2&size=20`).

## Success responses

No envelope (ADR-0011): the status code carries the meaning and the body, when there is one, is the resource itself. Dates are UTC ISO 8601, IDs are UUID v7, field names are camelCase, and null fields are always sent as `null`, never omitted, so the orval-generated types (`string | null`) match every response.

| Operation | Response |
|---|---|
| Create (`POST`) | `201 Created`, **empty body** |
| Update (`PUT`/`PATCH`) | `204 No Content` |
| Get one (`GET /{id}`) | `200 OK`, the resource |
| List (`GET`) | `200 OK`, the pagination shape below |
| Delete (`DELETE`) | `204 No Content` |
| Action with no result (sync, logout…) | `204 No Content` |

Rule of thumb: **writes return nothing, reads return data.** A write returns more (a `Location` header with the new ID, or a body) only when a specific feature needs it, and that need is stated in its ticket.

## Messaging rules

Apply to every project that uses queues or events (any language):

- **Idempotent consumers**: delivery is at-least-once, so processing the same message twice must not duplicate effects (e.g. record processed message IDs).
- **Dead-letter queue** on every queue: messages that keep failing land there instead of disappearing.
- **Outbox** only when losing an event is serious (payments, stock): the repository writes the event to an `outbox` table in the same transaction as the data, and a scheduled job (triggered by the cloud) publishes pending rows and marks them sent. On DynamoDB, DynamoDB Streams plays this role natively. Elsewhere, publishing right after the commit is enough.

## Migrations on deploy

- Migrations run in **their own step of the deploy workflow, before the new app version rolls out**, against production with credentials fetched from the secret manager through OIDC (ADR-0010). If the migration fails, the deploy stops and the previous version stays live. The app never migrates on startup (on serverless every new instance would try, slowing startup and risking a timeout mid-migration).
- Every migration is **backward compatible with the version currently running** ("expand, then contract"), because the old version keeps serving traffic against the migrated database during the deploy and must still work if the code is rolled back. A migration only adds (new optional column, new table). Renaming or dropping takes two deploys: first the code stops using the column, then a later migration removes it. The agent follows this rule and review checks it.
- Migrations are **forward-only**: a bad migration is fixed by a new migration, never by an undo script. Before every migration, the deploy workflow creates a **restore point** of the database (a Neon branch, an RDS / Cloud SQL snapshot) for emergencies.

## Development seed

Every backend has a **development seed** (`seed:dev`) that fills the local database with realistic data and a test user with known credentials, so Local Review shows screens with content. The agent updates the seed in the same pull request whenever it adds an entity, and every pull request's review steps include running it. It never runs in production.

When the project uses an external authentication provider (Cognito, Auth0, Clerk…), Local Review logs in through the **real provider's `-dev` resources** (e.g. a `-dev` Cognito user pool, part of the dev set of mechanism resources) holding a test user, which the seed documents. There is no fake local provider.

## Backups

- Automatic backups with **point-in-time recovery** are enabled through Terraform on every database (Neon, TiDB, RDS, Cloud SQL, DynamoDB, Firestore), at the longest retention the plan allows. Each recipe records how many days its free tier offers, since it is often short.
- A **restore test workflow**, triggered manually: it restores the latest backup (or a chosen point in time) to a temporary database, checks it starts, its tables exist, the newest record is recent and counts match production, deletes the temporary database and reports the result. It never touches production. A written restore runbook sits next to it for a real emergency.

## Observability

- Logs are structured JSON (every recipe), collected by the cloud (CloudWatch / Cloud Logging). They are also where errors are found: no separate error-tracking service (no Sentry).
- Every request gets a **request ID**, written into every log line of that request and returned in the Problem Details as a `traceId` field, so an error shown on screen leads straight to its logs. Once a project adopts OpenTelemetry, this ID becomes the OTel trace ID.
- **Logging goes through a port**: `LoggerServiceInterface` in `application/services` (`info`, `debug`, `warn`, `error`, each with an optional object logged as JSON), implemented by `LoggerService` in `infra/services` on the language's logging library. Nothing else calls the logging library directly. Before serializing an object, `LoggerService` **masks sensitive fields** by name (`password`, `token`, `secret`, `authorization`, `cpf`, `cardNumber`…, from a configurable list) as `***`, so use cases can log their whole input safely; a unit test of `LoggerService` guards the masking.
- **Every use case logs its flow**, with a `logContext` holding the class name:
  - at the start: `debug("Start <logContext> with input: ", input)`;
  - after each meaningful step, its result: `debug("found role by same name: ", foundBySameName)`;
  - at the end: `debug("Finish <logContext>")`.

  These are `debug` logs. The level comes from the `LOG_LEVEL` environment variable: `info` day to day, switched to `debug` through configuration (no build) when investigating.
- **Code and everything technical is written in English**: identifiers, log messages, `ErrorCode`s, documentation, and everything kept on GitHub (tickets, specs, ADRs, commit messages, pull request descriptions).
- **Text the end user sees is in the product's language**, chosen per project in `/new-project` (e.g. `pt-BR`): content fields the backend sends (`title`, `label`, `message`…) and the Problem Details `title` / `detail`. With no i18n by default, these texts are written directly in that language; a multi-language project adds i18n as an on-demand mechanism, using the `Accept-Language` header the backend already receives.
- Every backend that serves a frontend exposes **`POST /v1/client-errors`**, rate-limited, which logs frontend errors at `ERROR` level with the same rules as any other log.
- **Log rules**: never log secrets, tokens or sensitive personal data (LGPD); `ERROR` only for what requires action; logs kept **30 days** in the cloud.
- **Minimum alerts**, by email, defined in Terraform: `ERROR` logs above a threshold (CloudWatch metric filter / Cloud Logging log-based metric), health check failing, messages in a dead-letter queue, and a **budget alert** (AWS Budgets / GCP Billing Budget) before the bill passes the amount the user sets.
- Traces and metrics are added only when a project needs them, always through **OpenTelemetry**, so the destination is configuration and switching tools never changes code.

## Resilience

Resilience lives in the `infra` adapters that make outbound calls; use cases never know about it.

- **Timeouts**: every outbound call (database, HTTP APIs, cloud SDKs, email) has an explicit timeout. No library default is trusted, since many are infinite and a slow dependency would hold the request until the function's maximum duration, billed the whole time.
- **Retries**: only for external systems called over HTTP (third-party APIs and other services of ours), only on transient errors (timeout, 429, 503, connection refused), with exponential backoff plus jitter and at most 3 attempts. Cloud SDKs (S3, SQS, SES, Pub/Sub…) keep only their built-in retry, configured, never wrapped in another one (3 × 3 = 9 attempts). No application retries on the database. Only operations that are safe to repeat are retried; a create or charge is retried only with an idempotency key.
- **Circuit breaker**: only around third-party APIs, with a fallback where it makes sense (a default answer, or a clear Problem Details error with its `code`). Not used for our own database, where timeouts suffice. On serverless each instance has its own short-lived breaker, so it protects less than on an always-on server.
- **Rate limiting and throttling, in two layers**:
  - **At the edge (Terraform)**: request limits on API Gateway (AWS) or Cloud Armor (GCP) against abuse, plus maximum instances and concurrency on Lambda / Cloud Run, which also caps the bill.
  - **In code**: fine-grained limits the edge cannot express, per user or per endpoint (e.g. login attempts), as an `infra` filter. Counters are in memory per instance by default (Redis from the start in shared-nothing runtimes such as PHP); when the limit must hold across instances (e.g. brute-force protection), they move to a shared store (Redis).
- **Graceful shutdown**: always on. On the cloud's stop signal (`SIGTERM`, sent on every deploy and scale-in) the app stops accepting new requests, finishes in-flight ones, closes database and queue connections and exits, with a timeout shorter than the cloud's grace period (about 10 s on Cloud Run, 30 s on ECS). Long batches stop at a chunk boundary and resume on the next run.
- **Idempotency keys**: only when the ticket asks. The client sends an `Idempotency-Key` header and the server stores the result for a while, so a repeat with the same key does not create again. The agent proposes it in the ticket whenever a feature is one where a duplicate is costly and hard to undo: payments and charges, orders, transfers and credits (balance, points, coupons), bookings, sends with a cost or external impact (paid SMS, customer notifications). Inbound webhooks are covered by the idempotent-consumer rule in Messaging rules.

## Pagination

List endpoints are paginated by page: `?page=2&size=20` returns `{ items, page, size, total }`. The shape is one shared schema in the OpenAPI spec, so orval generates a single pagination type for the frontend.

Projects on a native NoSQL database (DynamoDB, Firestore) paginate by cursor instead, since those stores have no offset or cheap total count: `?limit=20&cursor=...` returns `{ items, nextCursor }`. The decision guide states this when NoSQL is chosen.

## Responsibilities

**domain**: plain entities with their own invariants. No framework annotations, no I/O. An entity has a private constructor and two static factories, so an invalid entity can never exist:
- `Role.create(name, description)` for something **new**: generates the UUID v7, validates every rule and throws `BusinessException` with an `ErrorCode` on violation;
- `Role.restore(id, name, description, createdAt, updatedAt)` to **reload** from storage without revalidating, used only by repositories.

State changes are methods named after the business action (`role.rename(newName)`, `invoice.cancel()`); there are no public setters.

Concepts with their own rules (format, range, currency) are **value objects that live only in the domain layer** (`Email`, `Money`, `Cpf`, `Slug`), validating themselves on construction (`new Email("x")` throws `BusinessException` with `INVALID_EMAIL`); `Money` holds cents in a `long` plus a currency. DTOs, the API and `infra` keep plain types: the use case converts DTO fields into value objects when it builds entities, and entities expose plain values back to DTOs.

**application**: one class per use case, exposing a single public `execute(InputDto)`. A use case builds and validates domain entities, enforces business rules through the repository and service ports, and returns an output DTO. It never touches infra types. Ports (repository and service interfaces) live here; their implementations live in infra.

**infra**: adapters and delivery.
- Controllers map validated request bodies to use case input DTOs, call `execute`, and return the output directly (no envelope). The global exception handler turns `BusinessException` and validation failures into Problem Details with an error `code` (ADR-0011).
- Repositories implement the application ports using the database and map ORM models to repository output DTOs. ORM models are separate from domain entities and never leave infra.
- Services implement the application service ports (auth, encryption, logging).

## Code rules (every language)

Each language recipe only states **how** its language and tools meet these rules.

- **`domain` and `application` are framework-free**: no framework, ORM, HTTP or SDK types, and no framework-specific annotations, facades or global helpers there; only what the language recipe explicitly allows (e.g. Jakarta DI annotations in Java). Dependencies arrive **through the constructor**, never through fields or service locators.
- **Transactions live only in repositories**, never in use cases. Writes that must succeed or fail together become one repository method running them in a single transaction (`syncPermissions(roleId, permissionIds)`, not `removeAll` + `add` from the use case). NoSQL repositories use their store's transaction API.
- **Type rules**:
  - Dates are timezone-aware instants in UTC inside `domain` and `application`; formatting for the user happens only on output, with the request's timezone header.
  - Money is never a floating-point number: integer cents plus a currency, held by the `Money` value object.
  - Enumerations use the language's native enum type; `ErrorCode` is one.
  - A lookup that may find nothing returns the language's "maybe" type (`Optional`, nullable type, `T | undefined`), never a sentinel value; collections are never `null`, empty instead, and returned immutable where the language allows.
- **DTOs are immutable**, end in `Dto`, and are mapped by hand (explicit `from…` / `to…` functions), with no mapping libraries or code generators. Repositories return repository output DTOs, **never ORM models, generic maps or untyped objects**.

## Testing rules (every language)

- Each test body has three commented blocks, `// given`, `// when`, `// then`, and covers one behaviour; test names follow "should … when …".
- **Mocks only for ports** (repositories and services); entities and value objects are always real.
- **Test data builders** in the tests' helpers folder (`aRole().withName("admin").build()`), instead of assembling objects by hand in each test.
- Integration tests create data through the API or fixtures and **reset the database between tests**.

## Extra mechanisms rules (every language)

Mechanisms (queue, events, scheduled job, long batch, file storage, email, cache) are added only when a project needs them (`recipes/decision-guide.md`), each as a port in `application` with its adapter in `infra`, where the framework library and the cloud SDK live.

- **Scheduled jobs are triggered by the cloud** (EventBridge Scheduler / Cloud Scheduler) calling an Event Function or a protected internal endpoint. In-process schedulers (Spring `@Scheduled`, Quartz, Quarkus Scheduler, Laravel's `schedule:run`, cron inside a container…) are forbidden: serverless instances sleep without traffic, and several instances would run the job more than once.
- **Queue and event consumers are push by default**: the cloud delivers the message and wakes the consumer (SQS triggers an Event Function on Lambda; Pub/Sub pushes to a Cloud Run endpoint). Long-running pull workers only on an always-on container.
- **File uploads** go straight from the client to storage through a **pre-signed URL** issued by the backend, never through the API.
- **Cache** is per instance by default (in process, or the runtime's equivalent), moving to managed Redis only when it must be shared across instances.
- **Email** goes through SMTP, so the provider (SES, Resend…) is a configuration change.
- **Long batches** run as an ECS task / Cloud Run Job with resumable, chunked processing; relational projects only, NoSQL projects handle them case by case.
- **Kafka** only for event streaming and **RabbitMQ** only when a client requires it, always managed and consumed by an always-on container.
- Tests **mock mechanisms at their ports**; only the database runs for real (ADR-0003). Local Review uses the **`-dev` set of mechanism resources** created by Terraform (ADR-0002), so code under review never touches production.

## Naming

| Kind | Pattern | Example |
|---|---|---|
| Use case | `<Verb><Entity>UseCase` | `SyncRoleWithPermissionsUseCase` |
| Use case DTOs | `<Verb><Entity>UseCaseInputDto` / `...OutputDto` | `CreateRoleUseCaseInputDto` |
| Repository port | `<Entity>RepositoryInterface` | `RoleRepositoryInterface` |
| Repository DTOs | `<Verb><Entity>RepositoryInputDto` / `...OutputDto` | `FindRoleByNameRepositoryOutputDto` |
| Service port | `<Name>ServiceInterface` | `LoggerServiceInterface` |
| Service DTOs | `<Method>InputDto` / `<Method>OutputDto` | `GetLoggedUserDataOutputDto` |
| Implementation | bare name | `RoleRepository`, `LoggerService` |
| Request validator | `<Verb><Entity>Validator` | `UpdateRoleValidator` |
| Controller | `<Entity>Controller` | `RoleController` |
| Migration | `V<n>__<snake_description>` | `V1__create_table_roles` |

Every DTO ends in `Dto`, with no exceptions.

## Tests

```
tests/
├── unit/                                  mirrors the layers
│   ├── domain/entities/<feature>/         CreateRoleTest
│   ├── application/useCases/<feature>/    CreateRoleUseCaseTest
│   └── infra/services/                    EncryptionServiceTest
├── integration/http/<feature>Controller/  CreateRoleIntegrationTest
├── helpers/                               BaseAuthenticatedTest (boots the app, creates a test user, logs in), test data builders
└── fixtures/                              insert-*.sql, reset-*.sql
```

- **Unit tests** cover `domain` and `application`, mocking the ports. These two layers must reach 80% coverage; CI fails below it. `infra` is excluded from the threshold.
- **Integration tests** are mandatory. They call the HTTP API end to end against the same database engine used in production, started in a container (ADR-0003). In-memory substitutes are not used.
