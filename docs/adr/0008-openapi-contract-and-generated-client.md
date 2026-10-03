# The API contract is OpenAPI, and the frontend client is generated from it

Backend and frontend live in separate repositories (ADR-0006), so nothing would stop them from drifting apart. Every backend therefore publishes an OpenAPI specification generated from its code, and every web frontend and mobile app generates its API layer from that specification with **orval**: types, call functions over `shared/http`, TanStack Query hooks (React) or services (Angular), Zod schemas and MSW mocks. A contract change on the backend becomes a typecheck failure on the frontend in CI instead of a bug in production, and the agent never hand-writes API types.

The backend commits its generated `openapi.json`, and its CI fails if the file is out of date with the code. The frontend fetches that file from the backend repository's `main` branch on GitHub (with a token when the repository is private) and runs orval; its CI regenerates the client and fails if the result differs from what is committed, catching any contract change the frontend has not absorbed. This works the same on the developer's machine, in CI and in cloud sessions, and does not depend on the backend being deployed.

The interactive API documentation (Swagger UI) is enabled only in local configuration, for the developer and the agent; it is off in production, which does not need to expose a map of every endpoint. The `openapi.json` file is still generated and committed.

## Considered Options

- **Hand-written types in `services/<feature>/`**: rejected; the agent would guess or mistype fields, and mismatches would only surface at runtime.
- **openapi-typescript + openapi-fetch**: lighter, but generates no hooks, Zod schemas or MSW mocks.
- **openapi-generator**: heavy to configure and produces verbose code.
