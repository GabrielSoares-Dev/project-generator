# 02: React frontend generated and green

**What to build:** `/new-project` also generates the React web frontend from the frontend recipes, with shadcn/ui and Brand Tokens (fixed values for now). Its API client is generated from the backend's local `openapi.json`, and the first screen reads `GET /health` from the locally running backend through a configurable API URL. Every Quality Gate that applies to the frontend runs locally and the skill stops if one fails.

**Blocked by:** 01 (Laravel backend generated and green)

**Status:** done, except the user running it on their own machine (see Pending)

- [x] The frontend is generated into a local directory beside the backend (`generator-runs/run1/invoice-manager-frontend`)
- [x] The API client is generated from the backend's `openapi.json`, and `openapi:check` fails when they differ (proved by regenerating; the gate reports "up to date")
- [x] With the backend running, the frontend shows the backend's health and version: verified in headless Chrome against the real API, with a clean console (no errors, no warnings)
- [x] Lint (a11y and raw-HTML rules included), typecheck, 25 tests (7 unit, 18 component) at 98% lines and 83% branches including axe checks, architecture validation (50 modules, no violations), bundle size (98 kB, limit 1 MB) and dependency audit all pass, each run on its own
- [x] Brand Tokens are applied through the design system as CSS variables, with a dark theme that follows the system
- [x] Every failure found is fixed in the recipe or the skill, with the reason recorded below

## Corrections made to the recipes (run 1, frontend)

| Found | Why it failed | Fixed in |
|---|---|---|
| `typescript-eslint` refused TypeScript 7 | Peer ceiling below the `latest` version | `recipes/frontend/react.md` item 2: newest version the rest of the stack supports (6.0) |
| ESLint plugins refused ESLint 10 | Same: React and a11y plugins stop at ESLint 9 | `react.md` item 2 |
| Vitest refused MSW 3 | Its mocker accepts MSW 2 | `react.md` item 2 |
| `@types/node` came as 26 on a Node 24 LTS | Types must match the runtime | `react.md` item 2 |
| `pnpm add` aborted with `ERR_PNPM_IGNORED_BUILDS` | pnpm 12 blocks install scripts by default | `react.md` item 3: `allowBuilds` |
| `.npmrc` settings and `savePrefix` ignored | pnpm 12 reads `pnpm-workspace.yaml` | `react.md` item 3: strip the `^` afterwards |
| `tsc` rejected `baseUrl` and then the `paths` | TypeScript 6 deprecates `baseUrl` | `react.md` item 4 |
| shadcn wrote `from "cn"` and installed the npm package `cn` | The CLI mis-resolves a `utils` alias that is not `@/lib/utils` | `react.md` item 5: check imports and `package.json` after every `shadcn add` |
| shadcn put several components in one file | Its CLI groups them | `recipes/frontend/architecture.md`: one component per file, design-system components included |
| `vitest-axe` had no types for Vitest 5 | Unmaintained since 2022 | `recipes/frontend/libraries.md`: axe-core and a helper |
| Generated mocks failed to compile | They import `@faker-js/faker` | `react.md` item 6 |
| `test:unit` and `test:integration` found no files | Vitest arguments are text filters, not globs | `react.md` item 9: Vitest projects |
| Router test timed out after 17 s | First dynamic import is slow on a shared file system | `react.md` item 9: preload the lazy page, raise `hookTimeout` |
| `state/` needed `ApiError` but may not import `shared/http` | Rule 4 of the architecture | `react.md` item 7: `ApiError` lives in `shared/types` |
| `Promise.reject` lint error | The interceptor rejected with a value that is not an `Error` | `react.md` item 7 |
| `pnpm audit` ran the built-in instead of our script | Built-in command name | `react.md` item 12: `pnpm run audit` |
| High advisory in a dev dependency with no fix | `braces` through `eslint-plugin-check-file` | allowlist script with reason and expiry (`react.md` item 12, `recipes/quality-gates.md`) |
| Console warning on first load, favicon 404 | Missing `HydrateFallback` and favicon | `react.md` items 8 and 14 |
| Bundle gate has one limit | size-limit has no warning level | `recipes/frontend/architecture.md` |
| New file failed the Prettier check | The formatter was not run after writing it | the skill: run the formatter and every gate again |
| **The browser could not have called the API** | The backend had no CORS configuration for its own origin | `recipes/backend/clean-architecture.md`, `recipes/backend/php.md` item 17, plus a backend integration test |
| Dev server in a container served stale code and rejected the Host | File watching does not cross a Windows mount; Vite checks Host | `react.md` item 1 and Verify in a browser |

Also from this run: no explanatory comments (`recipes/coding-standards.md`), kebab-case folders with `index.tsx` and tests named after the folder, README with requirements and per-gate commands, VS Code extensions, `project` script.

## Pending

- Not run on the user's machine. Their Node is 22 and the repository pins Node 24 (`.nvmrc`, `engines`): install Node 24 (nvm) before `./project setup`, or run it in a container.
- The frontend repository exists only locally (one commit); nothing was pushed.
- Lefthook hooks, `AGENTS.md`, ADRs and the vendored skills belong to ticket 04.
