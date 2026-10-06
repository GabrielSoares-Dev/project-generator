# PHP

The PHP backend Stack Recipe. It follows `recipes/backend/clean-architecture.md`; the variant is chosen per Derived Project through `recipes/decision-guide.md`. Built from the user's `Boilerplate-laravel-10-clean-architecture` and `Boilerplate-laravel-10-serverless`, updated to the Template's decisions.

## Variants

- **Laravel**: the default for HTTP APIs, or when the team knows Laravel; the most productive, with the fullest ecosystem (queues, mail, cache, validation).
- **Symfony**: for complex domains where clean architecture must be stricter: Doctrine (data mapper) keeps entities apart from persistence naturally, and dependency injection is explicit. Also when the team knows Symfony.
- **Slim**: for small, lean APIs (few endpoints, a microservice) where fast startup and a small package matter, e.g. a serverless function with HTTP; ORM, validation and DI come in as standalone libraries.
- **Plain PHP**: only for small Event Functions, no HTTP and no framework, with the full clean-architecture structure (same rule as plain Java).
- The team rule applies: if the people maintaining the project know only one of them, that one wins.

## Structure

Kept from the user's boilerplate: `src/Domain`, `src/Application`, `src/Infra`, with no Laravel `app/` folder (`useAppPath` points at `src/Infra`), PascalCase namespaces rooted at the **project name** (`InvoiceManager\Application\UseCases\Role\CreateRoleUseCase`, mapped to `src/` in `composer.json`, like the Java root package; the boilerplate's `Src\` root is not used), and ports bound to their implementations in service providers (Laravel) or in the service configuration (Symfony). Slim and plain PHP use the same folders. Folder names follow PHP's PascalCase convention; layers and responsibilities are those of `recipes/backend/clean-architecture.md`.

Corrections applied to the boilerplate:

- use cases expose `execute`, declared last (not `run`);
- `BusinessException` lives in `Domain` and takes an `ErrorCode`;
- Problem Details from one global exception handler (ADR-0011), no `try/catch` in each controller, no `BaseResponse` / `HttpException` envelope;
- UUID v7 instead of auto-increment IDs;
- authentication only: no Spatie Permission (ADR-0009);
- `httpOnly` cookies for the web (Bearer only for mobile) instead of `tymon/jwt-auth` with Bearer everywhere;
- `Start` / `Finish` flow logs at `debug` through `LoggerServiceInterface`, with sensitive fields masked.

## How PHP meets the general rules

The **Code rules, Testing rules and Extra mechanisms rules** of `recipes/backend/clean-architecture.md` apply as written; this section only says how PHP meets them.

- **Framework-free inner layers**: no `Illuminate\*`, `Symfony\*`, `Slim\*` or Doctrine imports in `Domain` or `Application`; **Laravel facades** (`DB::`, `Log::`, `Cache::`, `Http::`…) and global helpers (`config()`, `app()`, `now()`…) only in `Infra`. Dependencies arrive as constructor-promoted `private readonly` properties (as in the boilerplate). Deptrac and PHPStan enforce it.
- **Transactions**: `DB::transaction` (Laravel) or Doctrine's `wrapInTransaction`, only inside repositories.
- **Types**: `declare(strict_types=1);` in every file; dates are `DateTimeImmutable` in UTC (Carbon only inside `Infra`); money is `int` cents in a `Money` value object, never `float`; native backed `enum`s, not the boilerplate's classes of constants; lookups return a nullable type (`?Role`), never `false` or an empty array as "not found".
- **DTOs and value objects** are `readonly` classes with constructor promotion; repositories return output DTOs, **never `stdClass`, raw arrays or Eloquent models** (the boilerplate returned `stdClass` / arrays); mapping is hand-written (`fromModel` / `toArray`).
- **Tests**: Mockery for ports, builders in `tests/Helpers`, factories or the API for integration data, `RefreshDatabase` / transaction rollback between tests.
- **Mechanisms**: Laravel's scheduler (`schedule:run`) and cron inside the container are forbidden; SQS consumers are Bref handlers or the Bref Laravel bridge (push); `queue:work` / `messenger:consume` workers only on an always-on container.

## Tests and quality

- **PHPUnit + Mockery** (as in the boilerplate), with PHPStan's Mockery extension.
- Integration tests against **MySQL or PostgreSQL in a container**, never SQLite in memory (ADR-0003).
- **Pint** with the boilerplate's `pint.json` for formatting.
- **PHPStan at max level**, with **Larastan** on Laravel.
- **Deptrac** for architecture validation (the framework namespaces are a layer that only `Infra` may use); **PHPMD**, installed in its own `tools/phpmd/` tree (see Generating the project), for the size and complexity limits of `CODING_STANDARDS.md`.
- **80% coverage** on `Domain` + `Application`, checked by a script over the Clover report (PHPUnit has no minimum option, unlike the boilerplate's `--min=80`).

## Generating the project

Learned from generating a Laravel backend end to end. Follow in this order:

1. **Create the skeleton with Composer in a container** (`composer create-project laravel/laravel`), so the host needs only Docker.
2. **Delete the skeleton's leftovers before creating anything of ours.** Besides the Lean Laravel list below, delete the skeleton's `AGENTS.md`, `CLAUDE.md` and `README.md` (the Template writes its own), `app/`, `tests/Feature`, `tests/Unit`, `tests/TestCase.php`, `database/factories`, `database/seeders`, the default migrations and the `session` and `mail` configs. Keep `config/filesystems.php`, reduced to the `local` disk with `serve` off: without the file the framework falls back to a default that serves `/storage/{path}`. The order matters: the skeleton's `tests/Unit` and our `tests/unit` are the same folder on a case-insensitive file system (Windows, macOS), and a folder created with the wrong case breaks the Composer autoload on Linux CI.
3. **Autoload** `InvoiceManager\` → `src/` **and** `InvoiceManager\Infra\` → `src/Infra/`, with `useAppPath` pointing at `src/Infra`. Without the second entry Laravel cannot detect the application namespace and `artisan route:list` and the `make:*` commands fail.
4. **Test autoload**: `Tests\Unit\` → `tests/unit/`, `Tests\Integration\` → `tests/integration/`, `Tests\Helpers\` → `tests/Helpers/` (PSR-4 is case-sensitive on Linux, so each lowercase folder gets its own entry).
5. **Routing**: `api:` with an empty `apiPrefix` (`GET /health` at the root, resources under `/v1`), no `web:` routing; the request ID filter prepended globally; Problem Details registered as the exception renderer.
6. **Database**: only the `pgsql` connection, with a 3-second connect timeout. Integration tests use their own database (`app_test`, created by an init script mounted into the PostgreSQL container), never the development one. With the PostgreSQL 18 image the volume is mounted at `/var/lib/postgresql`, not `/var/lib/postgresql/data`.
7. **`config:cache` at container start, not at build.** Caching configuration at build bakes the build-time environment into the image; the entrypoint runs it when the container starts, with the real environment. `route:cache` and `event:cache` stay at build.
8. **OpenAPI with Scramble**: `api_path` empty so `/health` is documented, a fixed contract `version`, the local server URL, and the minimal `filesystems` config (item 2) so the framework's `/storage/{path}` route does not enter the contract. Run the formatter again after publishing any vendor config: published files lack `declare_strict_types` and fail the lint gate. `openapi.json` is committed and a CI gate fails when it differs from what the code generates.
9. **Tools in their own tree when they conflict with Laravel.** The current PHPMD requires Symfony components older than the ones Laravel's latest major needs, so Composer silently resolves it to a years-old release that crashes on a current PHP. PHPMD lives in `tools/phpmd/` with its own `composer.json` and `vendor/`, and runs with deprecation notices of the tool itself silenced (`php -d error_reporting=8191`). Check any new tool the same way: if Composer picks a very old version, isolate it.
10. **PHPStan** also loads `phpstan/phpstan-mockery`; without it every mocked port is reported as the wrong type. Docblocks type array contents (`array<mixed>`), closures (`Closure(Request): Response`) and Laravel's untyped returns; `config()->string()` / `->array()` give typed configuration reads.
11. **Thresholds are inclusive in PHPMD**: a limit of "at most 30 lines" is `minimum` 31, "at most 4 parameters" is 5, "complexity at most 10" is `reportLevel` 11, "at most 300 lines" is 301.
12. **Coverage**: PHPUnit has no minimum-coverage option, so a small script reads the Clover report and fails below 80%. The coverage scope (`Domain` + `Application`) is set in `phpunit.xml`.
13. **Pint's Laravel preset writes test methods in `snake_case`** (`should_throw_when_role_already_exists`); the `#[TestDox]` attribute carries the readable sentence.
15. **Git setup before the first commit.** The skeleton's `.gitignore` ignores `/.vscode`, which the Template commits (`recipes/vscode-extensions.md`), and knows nothing about our output: remove `/.vscode` from it and add `/build`, `/.deptrac.cache` and `/tools/*/vendor`. Keep the skeleton's `.gitattributes` (`* text=auto eol=lf`): without forced LF, a clone on Windows turns `project` and `docker/entrypoint.sh` into CRLF files that fail inside the Linux container. Record the executable bit of both scripts (`git update-index --chmod=+x`). Before pushing, check that `.env`, `vendor/` and `build/` are not tracked and that `composer.lock` and `tools/phpmd/composer.lock` are.
14. **`audit` is a Composer command**, so the `project` script calls `composer audit` directly instead of a script of that name; the audit runs in `tools/phpmd/` too.
17. **CORS**: publish `config/cors.php` (`artisan config:publish cors`) and set `paths` to `health` and `v1/*` (the API has no `api/` prefix, which is what the default matches), `allowed_origins` from `CORS_ALLOWED_ORIGINS`, `supports_credentials` on and `X-Request-Id` exposed. With a single configured origin Laravel answers with that origin for any caller, so the test asserts that an unknown origin is never echoed back and that `*` is never used.
16. **Strip comments last** (`recipes/coding-standards.md`, Comments): the generator's `.claude/skills/new-project/tools/strip-comments.php` (a PHP script over `token_get_all`, run as `php strip-comments.php tags <files>` for code and `php strip-comments.php all <files>` for configuration) removes every comment from `config/`, `public/index.php` and `artisan`, and from the code in `src/`, `tests/`, `routes/` and `bootstrap/` keeps only the type annotations (`@param`, `@return`, `@var`, `@throws`, `@template`), leaving the Scramble docblocks in `Http/Controllers` untouched; then run the formatter to clean the blank lines and run every gate again, since the OpenAPI gate and PHPStan both read docblocks. For Dockerfile, shell, YAML and SQL files delete the comment lines and keep the shebang and `# syntax=`.

## Dev commands

The `project` script (`recipes/dev-commands.md`) maps each command to a **Composer script** of the same name in `composer.json` (`start:dev`, `test:unit`, `lint`, `typecheck`, `arch`, `check`…), so the definitions live where PHP tools expect them and `composer <name>` works too. `check` runs, in CI order: Pint `--test`, PHPStan, Deptrac, PHPMD, the unit and integration tests with the coverage check, and `composer audit`. `start:dev` runs the FrankenPHP server of the `dev` target.

## Conventions enforced by tools

- **Format**: Pint (CI runs `pint --test`, the pre-commit hook applies it).
- **Architecture and naming** (Deptrac + custom PHPStan rules):
  - classes in `Application\UseCases` end in `UseCase` and expose a single public method, `execute`, declared after all private methods;
  - types in `Application\Repositories` and `Application\Services` are interfaces ending in `Interface`;
  - DTOs are `readonly` classes ending in `Dto`;
  - controllers end in `Controller`, request validators in `Request` (Laravel) or `Validator`;
  - plus the layer, facade and transaction rules above.
- **PHPMD**: the size and complexity limits, plus no `else` after `return`, no superglobals, no `exit`/`die`, no `var_dump`/`dd`/`dump` outside tests.

## Implementation notes

- `LoggerService` on Monolog with a JSON formatter; a Monolog processor adds the request ID to every log line.
- Production: Laravel `config:cache`, `route:cache` and `event:cache` at build time (as in the boilerplate's `Dockerfile.prod`), **OPcache** with preloading, containers on FrankenPHP running as a non-root user.
- Configuration comes from environment variables; no per-environment files holding secrets.
- Validation messages shown to end users are in the product's language; everything technical stays in English.
- Graceful shutdown: FrankenPHP and php-fpm finish in-flight requests on `SIGTERM`; Octane workers are configured to stop before the cloud's grace period.

## Versions

PHP and every framework (Laravel, Symfony, Slim) use **the latest stable release** on the day the project is created (version policy in `recipes/decision-guide.md`): for PHP, the newest stable version that the chosen framework and, on AWS, the Bref runtime both support. Versions are then pinned (`composer.json`, `composer.lock`, Dockerfile, dev container, CI) and only move through a major-update ticket.

## Libraries

PHP is shared-nothing (every request starts from scratch under php-fpm and Bref), so there is no in-process memory across requests: per-instance cache uses **APCu**, and rate-limit counters use **Redis** from the start.

| Category | Laravel | Symfony | Slim |
|---|---|---|---|
| ORM / database | Eloquent (only in `Infra/Models`) | Doctrine ORM | Doctrine DBAL |
| Migrations | Laravel migrations | Doctrine Migrations | Doctrine Migrations |
| Validation | Form Requests | Symfony Validator | Symfony Validator |
| Dependency injection | Laravel container | Symfony DI | PHP-DI |
| OpenAPI (generated from code) | Scramble | NelmioApiDocBundle | swagger-php (attributes) |
| JWT | lcobucci/jwt (replaces tymon/jwt-auth) | lexik/jwt-authentication-bundle | lcobucci/jwt |
| Passwords | Laravel Hash (Argon2id) | PasswordHasher (Argon2id) | `password_hash` (Argon2id) |
| Health check (`GET /health`) | own `CheckHealthUseCase` behind ports (database, version), so it follows the architecture rules | own controller | own controller |
| JSON logs | Monolog | MonologBundle | Monolog |
| Outbound HTTP + retry | Laravel HTTP client (`retry()`) | HttpClient + RetryableHttpClient | Guzzle + retry middleware |
| Circuit breaker | ackintosh/ganesha | ackintosh/ganesha | ackintosh/ganesha |
| In-code rate limit | Laravel RateLimiter (Redis) | Symfony RateLimiter (Redis) | symfony/rate-limiter (Redis) |
| Queue / events | Laravel Queue (SQS driver), consumed through the Bref Laravel bridge (push) | Messenger (SQS / Pub/Sub transports) | aws-sdk-php / google-cloud-pubsub |
| File storage | Laravel Storage (Flysystem S3 / GCS) | Flysystem bundle | Flysystem |
| Email (SMTP) | Laravel Mail, Blade only for email templates | Mailer + Twig | symfony/mailer |
| Cache | APCu per instance; Redis when shared | Cache component (APCu / Redis) | symfony/cache (APCu / Redis) |
| Long batch | Laravel job in an ECS task / Cloud Run Job | Messenger worker in an ECS task / Cloud Run Job | script in an ECS task / Cloud Run Job |

**Plain PHP** (Event Functions): Bref handlers, PDO, Monolog and the cloud SDK.

**Common**: Composer, PHPUnit, Mockery, Pint, PHPStan, Deptrac, PHPMD.

## Lean Laravel

Laravel is used as an API only, so the generated project removes everything that belongs to a traditional web app or to tools not in use:

- views and Blade, `web` routes, frontend assets (`resources/js`, `resources/css`, Vite, `package.json`);
- Laravel sessions, Laravel CSRF and encrypted cookies (the session is the JWT cookie of ADR-0009; CSRF defense is the custom header);
- broadcasting, Sanctum, Telescope, Sail and their providers;
- unused configuration files (only the needed ones are published);
- the default `User` model and migrations, replaced by the recipe's (UUID v7).

Laravel's queues, mail and cache come in only when the matching mechanism is chosen. A check in CI keeps the removed pieces from coming back (e.g. no `resources/views`). The result is less code for the agent to read and a faster Lambda cold start.

## Runtime

- **AWS Lambda**: **Bref** (php-fpm runtime) deployed with the **Serverless Framework**, the pair Bref is built for (exception recorded in ADR-0002). The app stays a plain `public/index.php`; Event Functions use Bref's handlers (`SqsHandler`…) as the thin adapter in `infra/functions/`. Lambda and API Gateway live in `serverless.yml`; everything else in Terraform, linked through SSM parameters. Deploys run only in the pipeline, via OIDC.
- **Containers** (Cloud Run, ECS): the `Dockerfile` `prod` target on the **FrankenPHP** image (non-root, OPcache with preloading), with Laravel Octane's worker mode when a project needs the performance. The `dev` target carries PHP with Xdebug for coverage, Composer and the quality tools.
