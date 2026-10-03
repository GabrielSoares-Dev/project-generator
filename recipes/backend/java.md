# Java

The Java backend Stack Recipe. It follows `recipes/backend/clean-architecture.md`, whose **Code rules, Testing rules and Extra mechanisms rules** apply as written; this recipe only says how Java meets them and which tools it uses. The variant is chosen per Derived Project through `recipes/decision-guide.md`.

## Common to every variant

- Java: the latest LTS supported by the chosen framework on the day the project is created (version policy in `recipes/decision-guide.md`); Maven.
- Logback with structured JSON logs.
- Tests: JUnit 5 + Mockito + AssertJ; coverage with JaCoCo.
- Quality: Spotless (google-java-format), Checkstyle, PMD, ArchUnit.
- NoSQL, when chosen: AWS SDK v2 (DynamoDB Enhanced Client) / Google Cloud Firestore client.

## How Java meets the general rules

- **Framework-free inner layers**: `application` may use only the standard Jakarta DI annotations (`jakarta.inject`: `@Inject`, `@Singleton`; CDI scopes such as `@ApplicationScoped`), never framework ones (`@Service`, `@Autowired`, anything under `org.springframework` or `io.quarkus`). Spring accepts the Jakarta annotations, so a use case moves between Spring Boot and Quarkus unchanged. ArchUnit enforces it.
- **Transactions**: `application` may not import `jakarta.transaction`; repositories use `@Transactional` or the store's API (`TransactWriteItems`, `runTransaction`); plain-Java Event Functions open and commit JDBC transactions explicitly.
- **Types**: dates are `Instant`, never `Date` or zone-less `LocalDateTime`; money is never `double` / `float` (Checkstyle / PMD) but `long` cents in a `Money` `record`; `Optional` only as a lookup return type, never as a field or parameter; collections returned with `List.copyOf`.
- **DTOs and value objects** are `record`s, with no Lombok; mapping is static `from` / `to` methods, with no MapStruct or other annotation processor, so the agent reads exactly what runs.
- **Tests**: Mockito for ports, builders in `tests/helpers`, SQL fixtures as in the original boilerplate, AssertJ assertions (`assertThat(role.name()).isEqualTo("admin")`).

## Spring Boot and Quarkus

| Category | Spring Boot | Quarkus |
|---|---|---|
| HTTP | Spring Web | Quarkus REST |
| OpenAPI | springdoc-openapi | SmallRye OpenAPI |
| Relational database | Spring Data JPA (Hibernate) | Hibernate ORM with Panache, repository pattern (not active record) |
| Migrations | Flyway | Flyway extension |
| Validation | Bean Validation | Hibernate Validator |
| Auth | Spring Security + java-jwt | SmallRye JWT |
| Dependency injection | Spring | CDI (ArC) |
| Health check (`GET /health`) | Spring Boot Actuator | SmallRye Health |
| Integration tests | Testcontainers + MockMvc | Dev Services (Testcontainers built in) + RestAssured |

## Fast startup on serverless functions

- **Quarkus native**: building the GraalVM native executable takes minutes, so CI runs tests on the JVM and only the deploy workflow builds the native executable.
- **Spring Boot on Lambda**: Lambda SnapStart is enabled automatically (in Terraform) whenever a project picks Spring Boot with a Lambda runtime, which keeps the "team knows only Spring" rule of the decision guide viable on functions.

## Conventions enforced by tools

Every convention in `recipes/backend/clean-architecture.md` is a rule that fails CI:

- **Format**: Spotless with google-java-format (as in the original boilerplate); CI runs `spotless:check`, the pre-commit hook applies it.
- **Naming and structure (ArchUnit)**:
  - classes in `application.useCases` end in `UseCase` and expose a single public method, `execute`, declared after all their private methods;
  - types in `application.repositories` and `application.services` are interfaces ending in `Interface`;
  - DTOs are `record`s ending in `Dto`;
  - controllers live in `infra.http.controllers` and end in `Controller`; request validators end in `Validator`;
  - plus the layer, annotation and transaction rules above.
- **Checkstyle**: camelCase variables and methods, no wildcard imports, no `System.out` / `printStackTrace`.

## Implementation notes

- The root package is the **project name alone**, normalized to a valid Java package (lowercase, hyphens and spaces removed: `invoice-manager` → `invoicemanager`), with the layers right below it: `invoicemanager.domain`, `invoicemanager.application`, `invoicemanager.infra`. No owner name, no reverse domain, no repetition.
- `LoggerService` sits on SLF4J with logstash-logback-encoder for real JSON output; the request ID goes into the MDC so it appears on every log line.
- `Dockerfile` `prod` target (rule in `recipes/backend/clean-architecture.md`): a minimal JRE (distroless or Temurin JRE), non-root user, layered for faster builds; Quarkus native uses a distroless base for the native executable.
- **Virtual threads** on by default in Spring Boot (`spring.threads.virtual.enabled=true`); in Quarkus, `@RunOnVirtualThread` on endpoints that block (database, outbound HTTP). More concurrent requests per instance at the same memory, so fewer instances.
- Configuration comes from environment variables; no per-environment files holding secrets.
- Validation messages shown to end users are in the product's language; everything technical stays in English.

## Resilience

Rules in `recipes/backend/clean-architecture.md`. Libraries: **Resilience4j** (Spring Boot) and **SmallRye Fault Tolerance** (Quarkus, MicroProfile annotations such as `@Timeout`), used in `infra` adapters only. In-code rate limiting: **Bucket4j** (Spring Boot) / the Quarkiverse rate-limiter extension, built on Bucket4j (Quarkus), as an `infra/http/filters` filter, with a Redis backend when counters must be shared. Graceful shutdown: `server.shutdown=graceful` with `spring.lifecycle.timeout-per-shutdown-phase` below the cloud's grace period (Spring Boot); on by default, with `quarkus.shutdown.timeout` set likewise (Quarkus).

## Extra mechanisms

Rules in `recipes/backend/clean-architecture.md` (Extra mechanisms rules). Java libraries:

| Mechanism | Spring Boot | Quarkus |
|---|---|---|
| Scheduled job | the use case behind an Event Function or protected endpoint; `@Scheduled` and Quartz forbidden | same; Quarkus Scheduler forbidden |
| Queue / events: consuming (push) | an Event Function (Lambda) or endpoint (Pub/Sub push); `@SqsListener` only on an always-on container | same; Quarkus Messaging pull consumers only on an always-on container |
| Queue / events: publishing | Spring Cloud AWS / Spring Cloud GCP | Quarkus SQS / SNS / Pub/Sub extensions |
| File storage (pre-signed URLs) | Spring Cloud AWS / Spring Cloud GCP | Quarkus Amazon S3 / Google Cloud Storage extensions |
| Long batch (chunked reader → processor → writer, resumable through the JobRepository; reader / writer in `infra`, the processor calls the use case; a second entry point of the backend image) | Spring Batch | JBeret (Jakarta Batch) |
| Cache (per instance, Redis when shared) | Spring Cache + Caffeine | Quarkus Cache (Caffeine) |
| Email (SMTP) | Spring Mail + Thymeleaf templates | Quarkus Mailer + Qute templates |
| Kafka / RabbitMQ | Spring for Apache Kafka / Spring AMQP | Quarkus Messaging with the Kafka / RabbitMQ connectors |

## Plain Java

Only for small Event Functions (no HTTP, no framework). They use the **full** clean-architecture structure, same as any backend (feature subfolders, use case and repository DTOs), so every Java codebase looks the same regardless of size. Libraries: the JDK, a JSON library, JDBC or the cloud SDK for data access, and a thin per-platform adapter in `infra/functions/` (ADR-0002). Tests: JUnit 5 + Mockito, integration tests calling the adapter with a sample event and Testcontainers for the database.
