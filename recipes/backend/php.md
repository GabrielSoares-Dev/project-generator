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
- **Deptrac** for architecture validation (the framework namespaces are a layer that only `Infra` may use); **PHPMD** for the size and complexity limits of `CODING_STANDARDS.md` (item 9 says where it is installed); three **custom PHPStan rules** (`tools/phpstan-rules/`, item 21) for the use case shape, the type naming and the global helpers in the inner layers.
- **80% coverage** on `Domain` + `Application`, checked by a script over the Clover report (PHPUnit has no minimum option, unlike the boilerplate's `--min=80`).

## Generating the project

Learned from generating a Laravel backend end to end. Follow in this order:

1. **Create the skeleton with Composer in a container** (`composer create-project laravel/laravel`), so the host needs only Docker.
2. **Delete the skeleton's leftovers before creating anything of ours.** Besides the Lean Laravel list below, delete the skeleton's `AGENTS.md`, `CLAUDE.md` and `README.md` (the Template writes its own), `app/`, `tests/Feature`, `tests/Unit`, `tests/TestCase.php`, `database/factories`, `database/seeders`, the default migrations, `database/.gitignore` and `database/database.sqlite`, `public/favicon.ico` and `public/robots.txt`, and the `session`, `mail`, `auth`, `services` and `queue` configs (the `cache` config is rewritten with the `array` and `file` stores only, `app.php` gains `version` from `APP_VERSION`, `logging.php` has the JSON `stderr` channel and the list of sensitive field names). Keep `config/filesystems.php`, reduced to the `local` disk with `serve` off: without the file the framework falls back to a default that serves `/storage/{path}`. The order matters: the skeleton's `tests/Unit` and our `tests/unit` are the same folder on a case-insensitive file system (Windows, macOS), and a folder created with the wrong case breaks the Composer autoload on Linux CI.
3. **Autoload** `InvoiceManager\` → `src/` **and** `InvoiceManager\Infra\` → `src/Infra/`, with `useAppPath` pointing at `src/Infra`. Without the second entry Laravel cannot detect the application namespace and `artisan route:list` and the `make:*` commands fail.
4. **Test autoload**: `Tests\Unit\` → `tests/unit/`, `Tests\Integration\` → `tests/integration/`, `Tests\Helpers\` → `tests/Helpers/` (PSR-4 is case-sensitive on Linux, so each lowercase folder gets its own entry).
5. **Routing**: `api:` with an empty `apiPrefix` (`GET /health` at the root, resources under `/v1`), no `web:` routing; the request ID filter prepended globally; Problem Details registered as the exception renderer.
6. **Database**: only the `pgsql` connection, with a 3-second connect timeout. Integration tests use their own database (`app_test`, created by an init script mounted into the PostgreSQL container), never the development one. With the PostgreSQL 18 image the volume is mounted at `/var/lib/postgresql`, not `/var/lib/postgresql/data`.
7. **`config:cache` at container start, not at build.** Caching configuration at build bakes the build-time environment into the image; the entrypoint runs it when the container starts, with the real environment. `route:cache` and `event:cache` stay at build.
8. **OpenAPI with Scramble**: `api_path` empty so `/health` is documented, a fixed contract `version`, the local server URL, and the minimal `filesystems` config (item 2) so the framework's `/storage/{path}` route does not enter the contract. Run the formatter again after publishing any vendor config: published files lack `declare_strict_types` and fail the lint gate. `openapi.json` is committed and a CI gate fails when it differs from what the code generates.
9. **Check every dev tool resolves to a current release; isolate one that does not.** Laravel 13's Symfony 8 once forced Composer to pick a years-old PHPMD that crashed (first run), so PHPMD was isolated in `tools/phpmd/`. PHPMD 3.0 supports Symfony 8 (verified 2026-10-06 with `composer require --dev phpmd/phpmd --dry-run`), so it is now an ordinary `require-dev` and there is no `tools/phpmd/`. Run the dry run for each tool: if Composer picks a very old version, isolate that tool in its own tree and run it with its own deprecation notices silenced (`php -d error_reporting=8191`). PHPMD 3 deprecates the positional form: the command is `phpmd analyze --no-progress --format text --ruleset phpmd.xml src tests routes bootstrap config` (paths separated by spaces, not commas). Deptrac is `deptrac/deptrac` (`qossmic/deptrac` is abandoned), version 4: the layers use `classLike` collectors with regular expressions (`^PetClinic\\Domain\\.*` in YAML), and `--fail-on-uncovered`. Deptrac records only references the code actually uses: an unused `use` statement of a forbidden class is not a violation, so prove the gate with a call (`Str::lower()` in `Domain`).
10. **PHPStan** also loads `phpstan/phpstan-mockery`; without it every mocked port is reported as the wrong type. Docblocks type array contents (`array<mixed>`), closures (`Closure(Request): Response`) and Laravel's untyped returns; `config()->string()` / `->array()` give typed configuration reads.
11. **Thresholds are inclusive in PHPMD**: a limit of "at most 30 lines" is `minimum` 31, "at most 4 parameters" is 5, "complexity at most 10" is `reportLevel` 11, "at most 300 lines" is 301.
12. **Coverage**: PHPUnit has no minimum-coverage option, so a small script reads the Clover report and fails below 80%. The coverage scope (`Domain` + `Application`) is set in `phpunit.xml`.
13. **Pint's Laravel preset writes test methods in `snake_case`** (`should_throw_when_role_already_exists`); the `#[TestDox]` attribute carries the readable sentence.
14. **`audit` is a Composer command**, so the `project` script calls `composer audit` directly instead of a script of that name, and the `check` script ends with `composer audit`.
15. **Git setup before the first commit.** The skeleton's `.gitignore` ignores `/.vscode`, which the Template commits (`recipes/vscode-extensions.md`), and knows nothing about our output: remove `/.vscode` from it and add `/build`, `/.deptrac.cache`, `/.phpstan.cache`, `.env.testing` and `stack.env`. Keep the skeleton's `.gitattributes` (`* text=auto eol=lf`): without forced LF, a clone on Windows turns `project` and `docker/entrypoint.sh` into CRLF files that fail inside the Linux container. Record the executable bit of both scripts (`git update-index --chmod=+x`). Before pushing, check that `.env`, `vendor/` and `build/` are not tracked and that `composer.lock` is. Create `.env` by hand from `.env.example` before the first container run (the Compose `env_file` is optional), then `artisan key:generate` fills `APP_KEY`.
16. **Strip comments last** (`recipes/coding-standards.md`, Comments): the generator's `.claude/skills/new-project/tools/strip-comments.php` (a PHP script over `token_get_all`, run as `php strip-comments.php tags <files>` for code and `php strip-comments.php all <files>` for configuration) removes every comment from `config/`, `public/index.php` and `artisan`, and from the code in `src/`, `tests/`, `routes/` and `bootstrap/` keeps only the type annotations (`@param`, `@return`, `@var`, `@throws`, `@template`), leaving the Scramble docblocks in `Http/Controllers` untouched; then run the formatter to clean the blank lines and run every gate again, since the OpenAPI gate and PHPStan both read docblocks. For Dockerfile, shell, YAML and SQL files delete the comment lines and keep the shebang and `# syntax=`.
17. **CORS**: publish `config/cors.php` (`artisan config:publish cors`) and set `paths` to `health` and `v1/*` (the API has no `api/` prefix, which is what the default matches), `allowed_origins` from `CORS_ALLOWED_ORIGINS`, `supports_credentials` on and `X-Request-Id` exposed. With a single configured origin Laravel answers with that origin for any caller, so the test asserts that an unknown origin is never echoed back and that `*` is never used.
18. **Lefthook** in the `dev` stage of the `Dockerfile`, as the pinned release binary for the image's architecture, and `lefthook install` in `project setup` (`recipes/agent-rules.md`, Lefthook). The `dev` stage also runs `git config --system --add safe.directory /app` (the bind-mounted repository belongs to another user, and Git refuses it otherwise, so hooks and commits made inside the container fail) and `HEALTHCHECK NONE` (the FrankenPHP base image ships a health check on its admin port, which would mark the idle dev container unhealthy).
19. **The interview's answers** (`recipes/new-project.md`) reach the backend like this: the project name gives the repository `<slug>-backend`, the Composer package `<slug>/backend`, the root namespace in PascalCase (`invoice-manager` → `InvoiceManager`, in `composer.json`, `deptrac.yaml`, the providers and every `use`), the dev container name and the Compose project; the product name goes in the README and `APP_NAME`; the product language decides the text of `ErrorCode::title()`, the Problem Details `detail` and every message the end user can see (the code, the logs and the test names stay in English); the domain, region, budget and alert email are only written in the README and the ADRs.

20. **Production on the VPS** (`recipes/vps-deploy.md`, ADR-0013, *Lean images*): the `prod` target of the `Dockerfile` on FrankenPHP (non-root, OPcache with preloading, `route:cache` and `event:cache` at build, `config:cache` and `php artisan migrate --force` in the entrypoint at start, a `curl` health check on `GET /health`), `docker-compose.prod.yml` with `app` and `db` (PostgreSQL, named volume), `stack.env.example` and `.github/workflows/ci.yml` and `.github/workflows/deploy.yml` (`recipes/github-setup.md`). The image is built in four stages and measured at 240 MB (the same Alpine `prod` stage without the cleanup and the flattening measured 440 MB, because layers keep what a later `RUN rm` deletes and the base image carries `php-cgi`, `phpdbg` and the PHP sources):
    - `dev`: Debian FrankenPHP with Composer, Git, Xdebug, `pdo_pgsql`, Lefthook (item 18);
    - `runtime`: `dunglas/frankenphp:<version>-php<version>-alpine` with `pdo_pgsql`, `curl` and the `app` user, then **removed in the same layer**: `/usr/src`, `/usr/local/include`, `php-cgi`, `phpdbg`, `phpize`, `php-config`, `install-php-extensions` and the `docker-php-*` helpers (about 90 MB the application never runs);
    - `build`: `FROM runtime`, Composer and Git, `composer install --no-dev --no-scripts --no-autoloader` before copying the sources (a cached layer), then `composer dump-autoload --no-dev --optimize --classmap-authoritative`, `route:cache` and `event:cache`;
    - `prod`: **`FROM scratch`**, `COPY --from=runtime / /` (a deleted file stays in the layers it was deleted from, so the final image is flattened to drop it) and `COPY --from=build --chown=app /app /app`; the `ENV` the base image set (`PATH`, `PHP_INI_DIR`, `GODEBUG=cgocheck=0`, `XDG_CONFIG_HOME`, `XDG_DATA_HOME`) is declared again, plus `APP_ENV=production`, `APP_DEBUG=false` and `APP_VERSION` from a build argument; writable `storage`, `bootstrap/cache` and `/tmp/frankenphp` for the `app` user (Caddy needs the `XDG_*` folders), `USER app`, the health check, the `entrypoint` and `frankenphp php-server --root public --listen :8080`. `setcap -r` on the `frankenphp` binary lets it run without the `NET_BIND_SERVICE` capability.

    `docker/php/prod.ini` sets `opcache.validate_timestamps=0`, `opcache.preload` (a script that `opcache_compile_file`s `src` and the Laravel components that every request loads, skipping `helpers.php`) and `expose_php=0`. The `.dockerignore` lists every repository-only file (`recipes/vps-deploy.md`, *Lean images*): `.git`, `.github`, `.claude`, `.devcontainer`, `.vscode`, `build`, `docs`, `tests`, `tools`, `vendor`, `bootstrap/cache/*.php` (the development package manifest), `.env*` except `.env.example`, `stack.env*`, `*.md` and the tool configuration files. Prove it: `docker compose -f docker-compose.prod.yml config` (with a `stack.env` made from `stack.env.example`), build the `prod` target, `docker image ls`, start the compose file with a project name of its own (`-p <slug>-prod`, so it does not recreate the development containers) and `curl /health`.
21. **Custom PHPStan rules** in `tools/phpstan-rules/` (autoloaded as `<Namespace>\Tools\PhpStan\` in `autoload-dev`, registered as services in `phpstan.neon`): `UseCaseShapeRule` (classes in `Application\UseCases` end in `UseCase`, only `execute` and the constructor are public, `execute` is the last method), `TypeNamingRule` (ports are interfaces ending in `Interface`, DTOs are `readonly` classes ending in `Dto`, controllers end in `Controller`) and `NoGlobalHelpersInInnerLayersRule` (no `config()`, `app()`, `now()`… in `Domain` or `Application`). Prove each by breaking it once (a public method after `execute`, a `config()` call in a use case). Two limits of `recipes/coding-standards.md` have no PHP tool yet: nesting depth and duplicated code, which stay with `/code-review`.
22. **`phpunit.xml` sets every variable twice**, `<env force="true">` and `<server force="true">`: the Compose `env_file` puts `.env` into the real process environment, Laravel reads `$_SERVER` first, and PHPUnit's `<env>` alone then loses (the version test saw `dev` instead of `test-version`, and the `null` log channel was ignored). It also sets `APP_KEY`, `DB_DATABASE=app_test`, `LOG_CHANNEL=null` and the CORS origin.
23. **Environment files**: `.env.example` is the local development file `project setup` copies; `stack.env.example` is the production file (`APP_ENV=production`, `APP_DEBUG=false`, placeholders such as `change-me`, the real origin of the frontend), copied by the user into the Portainer stack. They cannot be one file: the Compose `env_file` overrides the image's `ENV`, so a production stack fed from the local file would run with `APP_ENV=local` and debug on. The PostgreSQL container reads `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB` from the same file as the application's `DB_*`.
24. **Versions seen on 2026-10-06**: PHP 8.5.11, Laravel 13.35, PHPUnit 13.4 (it installs with Laravel 13, unlike what the first run saw), Larastan 3.12, Pint 1.32, Deptrac 4.7, Scramble 0.13, PHPMD 3.0, Composer 2.10, FrankenPHP 1.12.7, PostgreSQL 18, Lefthook 2.1.17. They are examples of the policy, not pins: use the latest on the day.

## Dev commands

The `project` script (`recipes/dev-commands.md`) maps each command to a **Composer script** of the same name in `composer.json` (`start:dev`, `test:unit`, `lint`, `typecheck`, `arch`, `check`…), so the definitions live where PHP tools expect them and `composer <name>` works too. `lint` is Pint `--test` and PHPMD. `check` runs, in CI order: `lint`, PHPStan, Deptrac, the unit tests with the coverage check, the integration tests, `openapi:check` and `composer audit`. Arguments after the command (`./project test:unit --filter X`) go to the Composer script as `composer <name> -- <args>`, only when there are any. `start:dev` runs the FrankenPHP server of the `dev` target.

## Conventions enforced by tools

- **Format**: Pint (CI and the pre-commit hook run `pint --test` through `project lint`; `project format` applies it).
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
- **Containers** (the VPS today, ADR-0013; Cloud Run or ECS in the cloud phase): the `Dockerfile` `prod` target on the **FrankenPHP** image (non-root, OPcache with preloading), with Laravel Octane's worker mode when a project needs the performance. The `dev` target carries PHP with Xdebug for coverage, Composer and the quality tools.
