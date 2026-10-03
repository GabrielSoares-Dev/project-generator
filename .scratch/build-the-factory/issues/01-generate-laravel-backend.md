# 01: Laravel backend generated and green

**What to build:** the first working piece of `/new-project`. With fixed answers (no interview yet), the skill generates the PHP Laravel backend from the Stack Recipes into a local directory: the shared clean-architecture structure, PostgreSQL in Docker Compose, `GET /health` returning the live version, and a published `openapi.json`. Every Quality Gate that applies to the backend runs locally and the skill stops if one fails. Follows the PHP recipe, the clean-architecture recipe and the quality gates recipe, with versions pinned to the latest stable on the day of the run.

**Blocked by:** None (can start immediately)

**Status:** done, except opening the project in VS Code's dev container, which only the user can do (see Pending)

- [x] `/new-project` exists as a skill (`.claude/skills/new-project/SKILL.md`) and generates the backend into a local directory from fixed answers
- [x] The backend starts with one Docker Compose command and `GET /health` answers with its version (`docker compose up app`; `./project start:dev` itself not run yet, see Pending)
- [x] `openapi.json` is generated and a gate (`openapi:check`) fails when it differs from the code
- [x] Lint and format, typecheck, unit tests (15) with 100% coverage on `Domain` and `Application`, integration tests (4) against a real PostgreSQL container, architecture validation and dependency audit pass locally, each run on its own. Typecheck still reports one error, in the skeleton's `ExampleTest.php` that awaits deletion
- [x] The `project` script exists with the vocabulary of `recipes/dev-commands.md`; `./project check` not yet run as a whole (the gates were run one by one, as requested)
- [x] The `prod` Dockerfile target builds, runs as `www-data`, reads its version from the environment and its healthcheck reports healthy
- [x] Every failure found is fixed in the recipe or the skill, with the reason recorded below

## Corrections made to the recipes (run 1)

| Found | Why it failed | Fixed in |
|---|---|---|
| PHPMD resolved to 2.5.0 and crashed | Laravel 13 needs Symfony 8; current PHPMD needs Symfony 7 or older, so Composer silently picked a years-old release | `recipes/backend/php.md`: PHPMD in its own `tools/phpmd/` tree |
| `project lint` flagged a method with 4 parameters | PHPMD thresholds are inclusive; "at most 4" must be configured as 5 | `recipes/backend/php.md`, `recipes/coding-standards.md` |
| 22 PHPStan errors at max level | Missing Mockery extension; untyped array contents, closures and Laravel returns | `recipes/backend/php.md` (item 10) |
| `artisan route:list` failed: "Unable to detect application namespace" | `useAppPath` moved the app folder, but Composer had no PSR-4 entry for `src/Infra` | `recipes/backend/php.md` (item 3) |
| `/storage/{path}` appeared in `openapi.json` | Laravel's local disk serves files by default | `recipes/backend/php.md` (item 8) |
| Scramble documented no endpoint | Default `api_path` is `api`; ours has no prefix | `recipes/backend/php.md` (item 8) |
| PostgreSQL 18 container exited at start | The image moved the data volume to `/var/lib/postgresql` | `recipes/backend/php.md` (item 6) |
| `app_test` database was not created | Init script was not mounted; also needed the volume recreated | `recipes/backend/php.md` (item 6) |
| `tests/Unit` and `tests/unit` collided | Same folder on a case-insensitive file system; breaks autoload on Linux | `recipes/backend/php.md` (item 2): delete the skeleton's tests first |
| `config:cache` at build would bake build-time env | The recipe said to cache config at build | `recipes/backend/php.md` (item 7), `Dockerfile` entrypoint |
| `composer audit` cannot be a Composer script | Built-in command name | `recipes/backend/php.md` (item 14) |
| PHPUnit has no minimum-coverage option | The boilerplate used Pest's `--min` | `recipes/backend/php.md`: Clover check script |
| Pint renamed test methods to `snake_case` | Laravel preset | `recipes/backend/php.md` (item 13) |
| spatie/laravel-health replaced by an own use case | Keeps the architecture rules and the Problem Details flow | `recipes/backend/php.md` library table |
| The skeleton ships its own `AGENTS.md` and `CLAUDE.md` | Conflict with the Template's | `recipes/backend/php.md` (item 2) |
| `/storage/{path}` came back in `openapi.json` after deleting `config/filesystems.php` | Without the file the framework falls back to a default that serves files | `recipes/backend/php.md` (items 2 and 8): keep a minimal file with `serve` off |
| Lint failed on the published `config/scramble.php` | Vendor config lacks `declare_strict_types` | `recipes/backend/php.md` (item 8): format after publishing |

Also added: `recipes/dev-commands.md` (the `project` script and the README contents), per the user's request during this run.

## Pending

- The skeleton cleanup was done by the user (the environment blocked the agent's removal). After it: `db:reset`, `typecheck` (zero errors), `start:dev`, every gate on its own, and one `project check` all pass. 14 unit tests at 100% coverage, 4 integration tests.
- Not verified: opening the folder with VS Code's *Reopen in Container*. Only the user can do it; report whether `./project setup` and `./project start:dev` work there.
- The Lean Laravel CI check ("no `resources/views`") is not written yet; it belongs with the Shared Workflows, which are out of scope for this slice.
