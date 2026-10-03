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

- **PHPUnit + Mockery** (as in the boilerplate).
- Integration tests against **MySQL or PostgreSQL in a container**, never SQLite in memory (ADR-0003).
- **Pint** with the boilerplate's `pint.json` for formatting.
- **PHPStan at max level**, with **Larastan** on Laravel.
- **Deptrac** for architecture validation; **PHPMD** for the size and complexity limits of `CODING_STANDARDS.md`.
- **80% coverage** on `Domain` + `Application` (the boilerplate's `--min=80`).

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
| Health check (`GET /health`) | spatie/laravel-health | own controller | own controller |
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
