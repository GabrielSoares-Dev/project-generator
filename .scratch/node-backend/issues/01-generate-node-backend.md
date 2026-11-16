# 01: Node backend generated and green

**What to build:** `/new-project` generates the Node backend (`recipes/backend/node.md`, custom stack: Fastify, Zod, Drizzle, PostgreSQL) the way it generates Laravel and Go: the clean-architecture structure, PostgreSQL in Docker Compose, `GET /health` with the live version, `POST /v1/client-errors`, a committed `openapi.json`, the `project` script and the `prod` image, with every backend Quality Gate run one by one. A new section *Generating the project* in `recipes/backend/node.md` records the steps, and the skill and `recipes/new-project.md` list Node as available. Needed by the draft of issue #18 (`myaniversary`), which asked for a Node backend and stopped on "not yet available".

**Blocked by:** None

**Status:** the code gates, the hooks, the `prod` image and the dev container are proven; the agent-team pull request and a run with the frontend are pending

- [x] `recipes/backend/node.md` has *Generating the project*, proven by a run (`myaniversary-backend`, 2026-11-16)
- [x] `project lint`, `typecheck`, `arch`, `coverage` (100% on domain + application), `test:integration` (real PostgreSQL 18), `openapi:check` and `audit` pass one by one, and `./project check` as a whole, typed on the host (it hands the command to Docker)
- [x] Each gate proven failing once (framework, library, Node module and `infra` imports in the inner layers; a second public method in a use case; `any` and a wrong file name; coverage below 80%; a stale `openapi.json`), and a commit with a lint error rejected by Lefthook
- [x] `prod` image: non-root (uid 1000), migrates at start, answers `GET /health` with the build's version, health check `healthy`, `docker stop` exits 0, size measured (**223 MB**)
- [x] `recipes/new-project.md`, `recipes/vps-deploy.md`, `recipes/agent-rules.md` and `.claude/skills/new-project/SKILL.md` name Node where they name PHP and Go
- [ ] agent-team's Dev backend carries the Node standards: a pull request in `GabrielSoares-Dev/agent-team` updating the per-stack table of `roles/dev-backend.md` (this session cannot reach that repository: open it from a session that can)
- [ ] The two repositories together in a headless browser (a Node backend with the React frontend), and the dev container opened in VS Code
- [ ] `recipes/frontend/react.md`: Node 25 and later images carry no Corepack (items 1 and 15 say `corepack enable`); the first frontend generated on Node 26 must install pnpm with `npm install --global pnpm@<version>` as the Node recipe does

## Decisions taken in the run (to confirm in review)

| Decision | Why |
|---|---|
| Node 26.13.1 (`node:26-bookworm` for `dev`, `node:26-alpine` for `runtime` and `build`), pnpm 12.21.0 installed with npm | latest LTS on 2026-11-16; Node 25+ images have no Corepack |
| TypeScript 6.0.3 | `typescript-eslint` 8.72 accepts TypeScript below 6.1 while 7.0 was `latest` |
| Integration tests use the Compose `db` service with an `app_test` database, not Testcontainers | Testcontainers needs the Docker socket inside the dev container and in CI's `docker compose run`; same decision as Go (ADR-0003) |
| One bundle, several commands (`serve`, `migrate`, `healthcheck`, `openapi`…); `serve` migrates before listening | the image has no shell tools or `curl`, and the VPS recipe migrates at start |
| `prod` is `FROM scratch` over a trimmed Alpine Node image | 223 MB against 252 MB for the Alpine Node image alone; the Node binary is most of what is left |
| Migrations are drizzle-kit's `0000_<name>.sql`, applied by Drizzle's `migrate()` | the tool's own naming and journal; `V<n>__<description>` of the shared layout does not apply |
| An `OpenApiTransform` class post-processes the Zod provider's document | it emits an unused `…Input` copy of every registered schema, and a body for `204` |
| `.dependency-cruiser.mjs` without `includeOnly` | with it, a library import in `domain` passed the gate |
| `src/main.ts` is the one file outside the one-export rule | it exports nothing |

## Progress

- 2026-11-16: issue #18 of this repository (`Draft: myaniversary`) asked for a Node backend and the Generator stopped: Node was "not yet available". The recipe is written from a real generation, in a sandbox with Docker and a proxy that re-signs TLS (the images needed the proxy's CA: not part of the project).
- Learned: Node 26 images have no Corepack; the Zod provider duplicates registered schemas as `…Input` and writes a body for `204`; `drizzle-kit generate` needs at least one schema file even for a custom migration; `simple-import-sort` puts `@infra/…` among the scoped libraries unless the aliases get their own group; a `typescript-eslint` `disableTypeChecked` spread followed by a `languageOptions` key undoes `projectService: false`; Prettier also checks the YAML files, so `docker-compose.prod.yml` failed the first `lint`; the dev and the production Compose files must not name the same container; dependency-cruiser's `includeOnly` hides library imports from the rules.
