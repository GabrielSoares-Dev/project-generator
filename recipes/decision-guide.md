# Decision guide

How `/new-project` chooses a Derived Project's technologies. The agent interviews the user about the product **and the team** (who will maintain it, what they know), recommends a choice for each item below, the user decides, and each choice is recorded as an ADR in the Derived Project.

## Principles

- **Only technologies the user masters.** The menu below is that set, because the human reviews and merges every agent pull request and can only review well what they know. It grows only when the user masters something new. The one exception is a **learning stack** (currently Go, `recipes/backend/go.md`): never recommended, used only when the user explicitly asks, on personal projects, with explanatory pull requests and stricter gates.
- **The team outweighs the technical fit.** If the people who will maintain the project only know one option, that option wins, and the guide states the technical cost of the trade-off.
- **Among mastered options, pick the best fit for the product.**

## Version policy

Recipes never pin version numbers; they state this rule, applied by the agent on the day a Derived Project is created:

- **Languages and runtimes with LTS releases** (Java, Node): the latest LTS that the chosen framework supports.
- **Without LTS** (Go, PHP) and **frameworks and libraries**: the latest stable release that the rest of the stack supports (e.g. the newest PHP that both the framework and Bref support; the React Native version that the latest Expo SDK ships).
- **Everything else follows the same rule**: build tools and package managers (Maven, Composer, pnpm), quality tools (linters, formatters, PHPStan…), Terraform CLI, providers and community modules, Docker base images, GitHub Actions used by the workflows, and the Expo SDK.
- The Derived Project **pins** the chosen versions everywhere they appear (build file and lockfile, dev container image, Dockerfile base images, CI, Terraform `required_providers` and module versions, `.nvmrc`/`engines`/`packageManager`), so the machine, CI and production always match.
- Moving to the next LTS or major is a **major update**: its own ticket, never automatic (see Dependency updates in `recipes/quality-gates.md`).

## What gets decided

| Item | Options | Reference |
|---|---|---|
| Repositories | backend, web frontend, mobile app, in any combination | ADR-0006, ADR-0012 |
| Backend language and variant | Java (Spring Boot, Quarkus, plain Java), PHP (Laravel, Symfony, Slim, plain PHP), Node (custom stack by default, NestJS, plain Node), Go (learning stack: only on explicit request) | below, `recipes/backend/php.md`, `recipes/backend/node.md`, `recipes/backend/go.md` |
| Frontend framework | React, Angular | `recipes/frontend/` |
| Design system | React: shadcn/ui; Angular: spartan/ui or Angular Material; mobile: NativeWind + react-native-reusables; others only with user approval | `recipes/frontend/libraries.md` |
| Brand Tokens | colors, typography, radii | GLOSSARY |
| Product language | the language end users see (e.g. `pt-BR`); code stays in English | `recipes/backend/clean-architecture.md` |
| Cloud | AWS, GCP | ADR-0002 |
| Runtime model | container or function | ADR-0002 |
| Database | PostgreSQL, MySQL, or the cloud's native NoSQL (DynamoDB / Firestore); NoSQL ties the project to its cloud and switches list pagination from page to cursor | ADR-0002, `recipes/backend/clean-architecture.md` |
| Authentication method | the Template's own JWT, or an external provider (Cognito, Firebase Auth, Auth0, Clerk) | ADR-0009 |
| Extra mechanisms | queue, events (pub/sub), scheduled job, long batch, file storage, email, cache: only the ones the product needs, asked at creation ("background work? uploads? emails?") and addable later by ticket; each is a port in `application` with a cloud adapter in `infra` | `recipes/backend/java.md` (Extra mechanisms) and each language recipe |
| More on-demand mechanisms | push notifications for mobile apps (Expo Notifications); offline-first mobile (queued actions synced later); OpenTelemetry traces and metrics; frontend real-user monitoring (CloudWatch RUM / Firebase Performance); feature flags (only when a project asks; OpenFeature API behind a port, starting with an environment-variable provider, swappable for AWS AppConfig or flagd without code changes; the backend exposes the non-sensitive flags the frontend may see at `GET /v1/feature-flags`, read at startup with the OpenFeature web SDK, so one change switches a feature on in both; every flag is temporary, with a trial period counted from when it is switched on in production, set per ticket and 30 days by default, after which the flag and the old code path are removed; each flag declares its `expiresAt` date when switched on, `/to-tickets` creates the removal ticket together with the feature, and a CI check warns (without blocking) about expired flags and opens or reopens that ticket for the agent), realtime (SSE / WebSocket: API Gateway WebSocket, Cloud Run), text search (PostgreSQL full-text first, OpenSearch only if needed), audit trail (table written by the repository), multi-tenancy (for SaaS), LGPD / personal data (map personal data, export and delete on request, never log sensitive data); same port + adapter pattern | — |
| SSR / BFF | only for a second client, several backends, hidden third-party keys, or SEO/first-load needs | ADR-0007 |

## Java variants

- **Spring Boot**: the default for HTTP APIs running in containers, or when the team knows Spring.
- **Quarkus**: when the API's Deploy Target is a serverless function (fast startup, native executable, avoids the Java cold-start cost), or when the team knows Quarkus.
- **Plain Java**: only for small Event Functions, no framework.
- The team rule applies: a Spring-only team gets Spring Boot even on functions, with the cold-start cost stated; on AWS, Lambda SnapStart is enabled to reduce it (`recipes/backend/java.md`).
