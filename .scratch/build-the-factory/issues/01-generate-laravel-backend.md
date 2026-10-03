# 01: Laravel backend generated and green

**What to build:** the first working piece of `/new-project`. With fixed answers (no interview yet), the skill generates the PHP Laravel backend from the Stack Recipes into a local directory: the shared clean-architecture structure, PostgreSQL in Docker Compose, `GET /health` returning the live version, and a published `openapi.json`. Every Quality Gate that applies to the backend runs locally and the skill stops if one fails. Follows the PHP recipe, the clean-architecture recipe and the quality gates recipe, with versions pinned to the latest stable on the day of the run.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `/new-project` exists as a skill and generates the backend into a local directory from fixed answers
- [ ] The backend starts with one Docker Compose command and `GET /health` answers with its version
- [ ] `openapi.json` is generated and matches the code
- [ ] Lint and format, typecheck, unit tests with at least 80% coverage on `domain` and `application`, integration tests against a real PostgreSQL container, architecture validation and dependency audit all pass locally
- [ ] The `prod` Dockerfile target builds
- [ ] Every failure found is fixed in the recipe or the skill, with the reason recorded in the ticket
