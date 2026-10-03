# Integration tests are mandatory and run against a real database

Every Derived Project's backend has integration tests that run in CI against the same database engine used in production, started in a container (Testcontainers or a GitHub Actions service container). In-memory substitutes such as H2, used in `GabrielSoares-Dev/Boilerplate-spring-boot-serverless`, are deliberately not used: they behave differently from MySQL/Postgres in SQL dialect, constraints and transactions, and code written by an unsupervised agent needs tests that catch the bugs production would hit.
