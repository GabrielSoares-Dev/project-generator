# 02: React frontend generated and green

**What to build:** `/new-project` also generates the React web frontend from the frontend recipes, with shadcn/ui and Brand Tokens (fixed values for now). Its API client is generated from the backend's local `openapi.json`, and the first screen reads `GET /health` from the locally running backend through a configurable API URL. Every Quality Gate that applies to the frontend runs locally and the skill stops if one fails.

**Blocked by:** 01 (Laravel backend generated and green)

**Status:** ready-for-agent

- [ ] The frontend is generated into a local directory beside the backend
- [ ] The API client is generated from the backend's `openapi.json` and a check fails when they differ
- [ ] With the backend running, the frontend shows the backend's health and version
- [ ] Lint with the accessibility and raw-HTML rules, typecheck, unit and component tests with at least 80% coverage including axe checks, architecture validation, bundle size and dependency audit all pass locally
- [ ] Brand Tokens are applied through the design system, with dark mode as configured
- [ ] Every failure found is fixed in the recipe or the skill, with the reason recorded in the ticket
