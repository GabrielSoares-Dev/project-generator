# Errors are Problem Details with a stable error code; successes have no envelope

Every backend, in every language, returns errors as **Problem Details (RFC 9457)**, `application/problem+json`, extended with a required **`code`** (stable, `UPPER_SNAKE_CASE`), a **`traceId`** (the request ID that appears in every log line of that request) and, for validation failures, an `errors` list where each entry has `field`, `code` and `message`. Successful responses return the resource directly, with no envelope. This deliberately replaces the `BaseResponse` envelope of `GabrielSoares-Dev/Boilerplate-spring-boot-serverless`: a public standard means every backend speaks one error format, Spring and Quarkus support it natively, and the frontend handles all errors in one place.

## Consequences

- Error codes are an enum in the domain (`domain/enums/ErrorCode`); `BusinessException` takes an `ErrorCode`, never a free-text message alone. Each code knows its HTTP status and derives its `type` URI.
- There is a single `BusinessException(ErrorCode)` for every rule violation; the code already carries the status (404, 409, 422…), so there is no exception hierarchy. Unexpected technical errors are not caught along the way: the global handler turns them into `500` with `code: INTERNAL_ERROR`, the detail goes only to the log (with the request ID), and a stack trace never reaches the response.
- The enum is published in the OpenAPI spec, so orval generates a union type of every code for the frontend (ADR-0008); a check against a code that does not exist fails typecheck.
- The frontend decides on `code`, never on message text; messages can change freely. The `shared/http` interceptor shows `detail` in a toast and maps `errors` onto form fields.
