# Template design: grilling progress

Status: `/grill-with-docs` in progress, paused 2026-10-02. Resume by reading this file, `GLOSSARY.md`, `docs/adr/` and `recipes/`, then ask the open questions below. When the frontier is empty and the user confirms shared understanding, run `/to-spec` then `/to-tickets` (keep it in one context window).

## Already written down

- `GLOSSARY.md`: Template, Derived Project, Stack Recipe, Quality Gates, Brand Tokens, Shared Workflows, Autonomous Run, Local Review, Deploy Target.
- `docs/adr/0001`–`0009`: recipes over skeletons; deploy targets, cloud, runtime, databases, frontend hosting; real-DB integration tests; central workflows pinned by tag; Autonomous Runs in Claude Code cloud + skills vendored; Template as factory + polyrepo; no BFF + SSR via React Router framework mode / `@angular/ssr`; OpenAPI contract + orval; auth always, backend-owned session.
- `recipes/backend/clean-architecture.md`, `recipes/frontend/architecture.md` (Atomic Design + services/state/shared), `recipes/frontend/libraries.md`, `recipes/quality-gates.md` (incl. Lefthook, accessibility gate).

## Decided, not yet captured in a document (goes into the spec)

- Stack menu: frontend React or Angular; backend Java, Go, Node or PHP; chosen per Derived Project via a decision guide (agent interviews, recommends, user decides, recorded as ADR in the Derived Project).
- Design system chosen per project: recommended menu (React: Tailwind + shadcn/ui; Angular: Tailwind + spartan/ui or Angular Material); the agent may suggest others, only with user approval. Design-system components are generated into `components/atoms/`.
- Feature design in Derived Projects follows Matt Pocock's flow: `/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement`.
- Autonomous Runs: started from the Claude mobile app (Code tab) in cloud sessions; agent only opens PRs, the human always merges. Plan: stay on Pro, never auto-upgrade or buy extra usage.
- Git flow: trunk-based, single `main`; branch protection blocks merge unless CI is green; deploy is a manually triggered workflow; production is the only environment by default (staging addable per project).
- Coverage: 80% backend `domain` + `application`; 80% frontend excluding generated design-system atoms and config.
- Tickets: the Template uses local markdown in `.scratch/`; Derived Projects use GitHub Issues (`/new-project` must rewrite `AGENTS.md` + `docs/agents/issue-tracker.md` accordingly). Cross-repo features: ticket lives in the repo it changes, spec in the backend repo, GitHub Project board spans both.
- Frontend: Storybook not by default; config fixed at build time.
- Auth (2026-10-02, supersedes the Q28 permission parts): Template does authentication only, no authorization/RBAC (added per project when needed). Login sets the `httpOnly` cookie and returns no user data. Route guard sends unauthenticated users to `/login`; no `<Can>`/`*appCan`, no permissions in the front. Recorded in ADR-0009.

## Open questions (resume here)

- ~~Q27~~ decided (see above). Q27.2 decided: companion `logged_in=1` readable cookie next to the `httpOnly` session cookie; guard checks it (ADR-0009).
- (old Q27 text) What login returns. Recommended: token stays in `httpOnly` cookie; login body returns basic info (id, name, permissions); `GET /v1/auth/session` returns the same basic info on page reload; full user data fetched on demand. (User's wish: "return the token with some info, fetch user data when needed"; option of token in body conflicts with ADR-0009.)
- ~~Q29~~ decided (ADR-0009, recipes/frontend/security.md, recipes/quality-gates.md). Front and API on the same parent domain, `SameSite=Lax` + custom anti-CSRF header. Recommended: yes.
- ~~Q30~~ decided (ADR-0009, recipes/frontend/security.md, recipes/quality-gates.md). Short access token + rotating refresh token, both `httpOnly`; interceptor refreshes on 401. Recommended: yes.
- ~~Q31~~ decided (ADR-0009, recipes/frontend/security.md, recipes/quality-gates.md). Lint bans raw HTML (`dangerouslySetInnerHTML`, `bypassSecurityTrust*`), security headers (CSP, HSTS…) on the CDN via Terraform, no secrets in frontend env. Recommended: yes.
- ~~Q32~~ decided (ADR-0009, recipes/frontend/security.md, recipes/quality-gates.md). Renovate/Dependabot + `pnpm audit` (and per-language equivalents) as a CI gate. Recommended: yes.
- ~~Q21~~ decided 2026-10-02: no Sentry; errors found in cloud logs. (was:) Sentry in front and back, disabled when the env var is unset. Recommended: yes.
- **Q16** Build order. Recommended: one complete slice first (core: vendored skills, `AGENTS.md`, decision guide, `/new-project`; plus one backend, one frontend, one database, one cloud), then a real project, then the other recipes. User must name the first combination.
- **Q33** Is the Template too big, should it be split? Raised by the user at pause. Assessment given: the risk is breadth of combinations, not repo size; splitting repos doesn't reduce work. Options: (a) one repo, scope cut to "recipes written only when a real project first needs them" (ties to Q16); (b) split the AI kit (skills, AGENTS.md, quality gates, Autonomous Run setup, usable in existing repos too) from the project factory (recipes, decision guide, `/new-project`); (c) keep everything as designed. Recommended: (a), optionally (b) later. User clarified: the Template is for building real projects; they will not create a project per combination just to test recipes. Proposed refinement of (a), awaiting confirmation: when `/new-project` picks a stack/DB/cloud with no recipe yet, writing that recipe becomes the first step of creating that project, so each recipe is born and validated by a real project.
- Purpose clarified by the user: the Template is a way to create projects **with technologies the user already masters**. The stack menu is exactly that set, and mastery matters because the human reviews and merges every agent PR. The decision guide must weigh this (pick, among mastered options, the best fit for the product), and the first slice (Q16) should be the combination the user masters most.
- User then said they want the agent **ready for every combination they master** up front (not on demand). Assessment given: reasonable, since recipes are documents the user can review well; the real risk is unvalidated recipes. Proposed middle path, awaiting decision: write all recipes up front, built in order of mastery (first one end to end, then the rest), and validate each one with a throwaway smoke generation (agent generates a project from the recipe and runs every Quality Gate, then discards it), optionally re-run periodically to catch stale recipes. Terraform modules and Shared Workflows per Deploy Target are the expensive part; they could still be built on first use.
- Q34 decided: dev container for backend repos only; frontends run on the host with pinned Node/pnpm (recorded in recipes). Q35 decided: ADR-0010.
- **Q36** Backend libraries, being defined now. User (2026-10-02): `/new-project` must ask **about the team** (who will maintain the project and what they know); Java has three framework variants the user masters: **Spring Boot, plain Java, Quarkus**, so each language may have several framework variants, chosen per project. Pending: Q36.1 variant tables (Spring Boot / Quarkus / plain Java), Q36.2 Go, Q36.3 Node, Q36.4 PHP.
- `recipes/frontend/security.md` written.

## Session 2026-10-02 (continued): Java closed

Recorded in `recipes/backend/java.md`, `recipes/backend/clean-architecture.md`, `recipes/decision-guide.md`, ADR-0002, ADR-0009, ADR-0010, ADR-0011:
- Java variants (Spring Boot, Quarkus, plain Java for Event Functions only, full structure), libraries, selection criteria (team outweighs technical fit), version policy (latest LTS supported by the framework at creation, pinned).
- `application` may use only Jakarta DI annotations, constructor injection; transactions only in repositories.
- DTOs as records, hand-written mapping. UUID v7 IDs. Page pagination (cursor on NoSQL). Success: writes return nothing (201 empty / 204), reads return data; extras only when a ticket needs them. Errors: Problem Details + required `code` (ADR-0011). `GET /health`.
- Extra mechanisms on demand; Java libs per mechanism; scheduling always triggered by the cloud (no `@Scheduled`); push consumers by default; Spring Batch/JBeret for long batches (relational only); mechanisms mocked in tests; Local Review uses a `-dev` set of mechanism resources (ADR-0002); messaging rules (idempotency, DLQ, outbox when needed).
- Auth: authentication only, no RBAC; `session` + `logged_in` cookies; short access + rotating refresh; same parent domain + CSRF header (ADR-0009). Secrets where used, OIDC for CI (ADR-0010).

Remaining: Q36.1.1 (frameworks mastered in Go, Node, PHP → their recipes, applying the same mechanism logic), Q21 (deferred: Sentry, metrics, tracing), Q33, Q16.

## Session 2026-10-02 (continued): operations and conventions closed

- Resilience, migrations on deploy, backups + manual restore-test workflow, observability (logs only by default, request ID, OTel on demand, no Sentry, frontend errors via `POST /v1/client-errors`, minimum alerts incl. budget), boilerplate logging pattern (LoggerService port, Start/steps/Finish at debug, masking, LOG_LEVEL), English everywhere (also in AGENTS.md), feature flags on demand (OpenFeature, trial period, expiry check). All in `recipes/backend/clean-architecture.md`, `recipes/backend/java.md`, `recipes/frontend/*`, `recipes/decision-guide.md`, ADR-0002/0011.
- Conventions: Conventional Commits without commitlint, squash merge only, branch `<type>/<ticket>-<desc>` checked in CI (`recipes/quality-gates.md`); Java conventions enforced by Spotless/ArchUnit/Checkstyle, root package = project name; frontend conventions from the user's React/Angular boilerplates (one `.prettierrc` with semicolons, per-framework file naming, co-located `.spec`, aliases without aggregated barrels, strict TS/ESLint with naming-convention and import order, named exports, no frontend use-case layer) in `recipes/frontend/architecture.md`.

Remaining: Q36.1.1 (Go, Node, PHP frameworks; the user has NestJS and Laravel boilerplates on GitHub: Boilerplate-nestjs-*, Boilerplate-laravel-10-*), Q33, Q16.

## Session 2026-10-02 (continued): naming, clean code, BFF role, autonomous runs closed

- Naming (DB snake_case plural tables, API `/v1/<plural-kebab>`, test names "should … when …", env vars, events, queues, cloud resources): `recipes/backend/clean-architecture.md`, `recipes/quality-gates.md`.
- Clean code: `recipes/coding-standards.md` (source of each repo's `CODING_STANDARDS.md` read by `/code-review`): SOLID mapping, use case shape (single public `execute`, last; private methods in call order; descriptive names; renamed from `run` everywhere), component shape, size/complexity limits, writing rules (comments not regulated), no SonarCloud.
- Backend serves the screens (BFF role, SDUI level 2): screen endpoints, server-side rules/sorting/filtering/pagination, backend formats display values (Accept-Language + X-Timezone) and sends raw + formatted, semantic content fields and `variant` only for components with variants, backend validation is the source of truth.
- Generated repo layout (`recipes/repository-layout.md`) and Autonomous Runs (`recipes/autonomous-runs.md`): triggers, one ticket per session, `Implement all ready tickets` with max 3 subagents, `scripts/agent-setup.sh`, stuck → `needs-info`, PR contents, agent-ready ticket shape.

Next (agreed order): `/new-project` flow step by step + Terraform (state, bootstrap, structure); then Go/Node/PHP recipes (Q36.1.1); then Q33 and Q16.

## Session 2026-10-02 (continued): Java details, new-project flow, Terraform

- Java: entities with private constructor + `create`/`restore` (all languages), value objects only in the domain, type rules, test structure, single `BusinessException(ErrorCode)` (ADR-0011), CORS only the frontend origin (ADR-0009), Swagger UI local only (ADR-0008), own-auth crypto (Argon2id, 15 min / 7 days, hashed refresh, login rate limit; ADR-0009).
- `/new-project` flow, manual steps via `/wizard`, Terraform layout with community modules, resources only via pipeline + one-time bootstrap (OIDC + state): `recipes/new-project.md`, ADR-0010.

Next: Q36.1.1 (Go, Node, PHP recipes; the user has NestJS and Laravel boilerplates on GitHub), then Q33 and Q16.

## Session 2026-10-02 (continued): frontend extras and mobile closed

- Frontend: screen states (skeleton / empty / error with traceId), performance (lazy routes, bundle-size gate 500 KB / 1 MB, modern images), mobile-first mandatory, dark mode optional.
- Mobile added as a third repository kind (ADR-0012): Expo only, same architecture as web, NativeWind + react-native-reusables, same libraries/conventions, SecureStore tokens via `X-Client: mobile` (ADR-0009), jest-expo + Maestro in CI, EAS Update/Build/Submit, production channel only, JS errors to the backend, push notifications on demand. Recipe: `recipes/mobile/architecture.md`.

Next: Q36.1.1 (Go, Node, PHP recipes), then Q33 and Q16.

## Session 2026-10-02 (continued): gap reviews

- Mobile store pipelines (TestFlight / internal track, then promote; `release-store`, `promote-store`, `update-ota`), TypeScript, LAN/tunnel for Local Review.
- Gap review fixes: docs made consistent (Local Review per repo kind, menus include mobile, stale references removed). New decisions: deploy tags + GitHub Release + rollback by earlier tag (`recipes/quality-gates.md`); recipe validation workflow (ADR-0001); product language per project for end-user text, code in English (G4); development seed (G5).

Remaining: Q36.1.1, Q33, Q16. Then confirm shared understanding, run `/to-spec` and `/to-tickets`.

## Session 2026-10-02 (continued): reviews 3 and 4

- Fixed: migrations no longer include seeds; RBAC leftovers removed; product-language for validation messages; mobile coverage; local cookies without `Secure`; ADR wording (0001, 0006, 0008, 0011, 0012) and glossary (Quality Gates, Brand Tokens, Stack Recipe).
- G6: external auth providers use the real provider's `-dev` resources for Local Review (needs internet). G7: `/sync-template` skill opens PRs in existing projects with rule/config differences; `.template-version` per repository (ADR-0006). Implies the Template itself is versioned (tags).

Remaining: Q36.1.1, Q33, Q16.

## Session 2026-10-03: PHP recipe closed

`recipes/backend/php.md`: variants Laravel / Symfony / Slim / plain PHP with criteria; structure from the user's Laravel boilerplate with corrections; PHP on AWS = Bref + Serverless Framework for Lambda/API Gateway, Terraform for the rest (exception in ADR-0002); FrankenPHP in containers; lean Laravel (API only); latest stable versions; PHPUnit + Mockery, real DB, Pint, PHPStan max + Larastan, Deptrac, PHPMD, 80%; library table per variant (APCu / Redis because PHP is shared-nothing). Q33 decided: all recipes up front (ADR-0001). G8: Template tags `template-v<n>` (ADR-0006).

Remaining: Node recipe (NestJS per the user's boilerplates), Go recipe (framework unknown), Q16 (first combination). Then confirm shared understanding → `/to-spec` → `/to-tickets`.

## Session 2026-10-03 (continued): Node and Go closed

- Rules reorganized: general Code / Testing / Extra mechanisms rules in `recipes/backend/clean-architecture.md`; language recipes only say "how". Coding standards and quality gates updated with PHP / Node / Go tools. Frontend test structure added. Version policy covers every tool. Dockerfile with `dev` / `prod` targets for every backend (prod built in CI).
- Node (`recipes/backend/node.md`): custom stack default (Fastify + Zod), NestJS by team rule, plain Node for Event Functions; Drizzle; PascalCase file = class name; Vitest, strict TS; Serverless Framework + esbuild on AWS with a single `@fastify/aws-lambda` handler file (exception in ADR-0002).
- Go (`recipes/backend/go.md`): learning stack (never recommended, explanatory PRs, stricter gates); net/http + Huma; sqlc + goose; same type names, snake_case files, errors as values; testify/mockery/testcontainers-go, golangci-lint, -race; Serverless Framework + adapter on AWS, distroless static; library table.

Q16 decided: first slice = PHP Laravel + React + PostgreSQL + AWS (ADR-0001). Frontier empty: waiting for the user to confirm shared understanding, then `/to-spec` → `/to-tickets`.

## Session 2026-10-03 (continued): generator review closed

- Clarified: what we build now is the **factory** (recipes, skills, central workflows, Terraform modules); a real project exists only when the user runs `/new-project`. The first slice (PHP Laravel + React + PostgreSQL + AWS) is built and checked with a throwaway project.
- Generator fixes and decisions: interview inputs complete (project name, domain, region, budget, alert email, language, dark mode); repo protection after the initial push; extra manual steps (Claude GitHub access, cross-repo read token, DNS / certificate); `recipes/shared-workflows.md` catalog; `/new-project` runs locally and interactively (G9); `/validate-recipe` skill, no scheduled routine (G10, ADR-0001); agent guardrails in `.claude/settings.json` (G11); vendored skills subset (G12); add mode in `/new-project` (G13).
- To verify during construction: how agent PRs appear on GitHub (author) to see if a required human approval can be added.

Frontier empty. Waiting for the user's go-ahead, then `/to-spec` → `/to-tickets` (tickets are about building the Template, kept in `.scratch/`).

## Pending actions after the interview

- Vendor Matt Pocock's skills into `.claude/skills/` and uninstall the local `mattpocock-skills` plugin (and the `mattpocock` local marketplace) to avoid duplicates.
- Install the `gh` CLI; create the Template's GitHub repository.
- Tag `GabrielSoares-Dev/workflows` with `v1` before adding new reusable workflows (via PR).
- Optional: the `done-sound` dev mod in `~/.claude/dev-mods/` never played; leave it or delete it.
