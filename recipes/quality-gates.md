# Quality Gates

The automated checks every repository a Derived Project owns must pass before a pull request can merge. They run in CI through the Shared Workflows (ADR-0004), and branch protection on `main` blocks the merge while any of them fails.

## The rule

Every repository runs **all** of the following gates **whenever its stack has a tool for it**. A Stack Recipe must name the tool it uses for each gate, or state explicitly that the stack has none. A gate is never skipped silently.

| Gate | What it enforces |
|---|---|
| **Lint & format** | Code style and common mistakes; formatting is checked, not just applied. Frontend lint also bans raw HTML injection (`recipes/frontend/security.md`). |
| **Typecheck** | The code compiles / type-checks with strict settings. |
| **Unit tests + coverage** | Unit tests pass and coverage stays at or above **80%** (backend: `domain` + `application` only; frontend: everything except the design-system components generated into `components/atoms/` and config). |
| **Integration tests** | Backend: HTTP API end to end against a real database in a container (ADR-0003). Frontend: component tests against an API mocked with MSW. |
| **Accessibility** (frontend) | Accessibility lint rules (`eslint-plugin-jsx-a11y` in React, angular-eslint template accessibility rules in Angular) plus automated **axe** checks inside component tests. |
| **Architecture validation** | The dependency rules of the architecture hold, checked by a tool rather than by review. |
| **Bundle size** (frontend) | Initial bundle at most 500 KB (warning) / 1 MB (error): Angular budgets, size-limit in React. |
| **Dependency audit** | `pnpm audit` (or the language's equivalent) blocks high and critical vulnerabilities. Known, unfixable or non-applicable ones go in a versioned allowlist, each entry with a reason and an expiry date. |
| **IaC checks** | When the repository holds Terraform: format, validate and lint. |

## Local hooks

The same gates also run before code leaves the machine, through **Lefthook** (language-agnostic git hooks), so both the human and the agent in a cloud session catch failures before opening a pull request:

- **pre-commit**: lint & format, typecheck. Fast checks only.
- **pre-push**: unit tests, architecture validation.

CI remains the authority: hooks can be bypassed, CI cannot.

## Conventions

- **Commit messages** follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `ci:`…), in English. The agent and the human follow it; no commitlint tool enforces it.
- **Test names** read as a specification, in English, front and back: "should <result> when <condition>". Java: `shouldThrowWhenRoleAlreadyExists()` with `@DisplayName("should throw when role already exists")`; frontend: `it('should show an error when the name is empty')`. Test classes and files are named after what they test (`CreateRoleUseCaseTest`, `Button/index.spec.tsx`).
- **Environment variables**: `UPPER_SNAKE_CASE` with a subject prefix (`DB_HOST`, `DB_NAME`, `AUTH_JWT_SECRET`, `LOG_LEVEL`); frontend ones carry the framework prefix (`VITE_API_URL`).
- **Events**: past tense, PascalCase (`RoleCreated`, `OrderPaid`).
- **Queues and topics**: kebab-case `<project>-<subject>`, `-dlq` suffix for dead-letter queues and `-dev` for the Local Review resources (`invoice-manager-order-paid`, `invoice-manager-order-paid-dlq`).
- **Cloud resources** (Terraform): `<project>-<environment>-<resource>` (`invoice-manager-prod-api`), every resource tagged with `project` and `environment` so the bill can be read per project.
- **Squash merge only**: each pull request becomes a single commit on `main`, whose message is the pull request title, so `main` has one line per ticket and reverting a ticket is reverting one commit. The pull request title must follow Conventional Commits; intermediate commits inside the pull request may be looser. Repository settings allow only squash merging.
- **Branch names**: `<type>/<ticket-number>-<description>` with the commit types (`feature/42-create-role`, `fix/57-login-timeout`), linking each branch to its issue. A CI check rejects pull requests from branches outside the pattern.

## Deploy versions and rollback

- The manual deploy workflow **tags** the deployed commit (`deploy-2026-10-02.1`) and publishes a GitHub Release whose notes are generated from the pull request titles (Conventional Commits).
- **Rollback is the same workflow run with an earlier tag**: the code goes back, migrations do not, which is safe because every migration is backward compatible (expand, then contract).
- `GET /health` returns the version currently live.

## Dependency updates

**Renovate** keeps dependencies current, conservatively, and every update pull request goes through all gates and a human merge:

- **Security fixes**: one pull request as soon as available.
- **Patch and minor**: grouped into a single pull request per week.
- **Major**: one separate, labelled pull request per dependency, never grouped; the human decides when to take it on, and the migration can become its own ticket for the agent.

## Architecture rules to validate

**Backend** (`recipes/backend/clean-architecture.md`):
- `domain` imports nothing from `application`, `infra` or any framework.
- `application` imports only `domain`.
- Only `infra` may import frameworks, database drivers, HTTP libraries or platform SDKs.
- ORM models (`infra/models`) are not imported outside `infra`.

**Frontend** (`recipes/frontend/architecture.md`):
- Each level of `components/` (atoms → molecules → organisms → templates) imports only from the levels below it.
- Atoms, molecules and templates never import `state/` or `services/`.
- Only `organisms` and `pages` import `state/`; only `state/` imports `services/`; only `services/` imports `shared/http`.
- `shared/` imports nothing from the rest of the app.

## Candidate tools per stack

Confirmed in the backend recipes (Java, PHP, Node, Go); frontend and mobile versions are confirmed (current versions, still maintained) when each Stack Recipe is written.

| Stack | Lint & format | Typecheck | Tests + coverage | Architecture |
|---|---|---|---|---|
| Java | Spotless (google-java-format), Checkstyle, PMD | compiler | JUnit 5 + JaCoCo | ArchUnit |
| Go | golangci-lint (broad rule set), gofmt / goimports | compiler, `go vet` | `go test -race -cover` + testify + mockery + testcontainers-go | arch-go or golangci-lint `depguard` |
| Node (TypeScript) | ESLint + Prettier, jscpd | `tsc --noEmit` (strict) | Vitest + Testcontainers | dependency-cruiser |
| PHP | Pint, PHPMD | PHPStan at max level (Larastan on Laravel) | PHPUnit + Mockery + coverage | Deptrac |
| React | ESLint + Prettier | `tsc --noEmit` | Vitest + Testing Library + MSW | dependency-cruiser or eslint-plugin-boundaries |
| Mobile (Expo) | ESLint + Prettier, eslint-plugin-react-native-a11y | `tsc --noEmit` | Jest (`jest-expo`) + React Native Testing Library + MSW; Maestro in CI | dependency-cruiser |
| Angular | ESLint (angular-eslint) + Prettier | `ng build` / `tsc` strict | Vitest or Jest + Testing Library + MSW | dependency-cruiser or eslint-plugin-boundaries |
| Terraform | `terraform fmt -check`, TFLint | `terraform validate` | — | — |
