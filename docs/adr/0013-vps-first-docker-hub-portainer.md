# VPS first: images on Docker Hub, updated through Portainer; cloud later

Every Derived Project is deployed first to **a VPS**, as containers: the repository carries a production `Dockerfile` target and a `docker-compose.prod.yml`, and its pipeline builds the image, pushes it to **Docker Hub** and calls a **Portainer** webhook that redeploys the stack on the VPS. The goal of this phase is to validate the product and the factory's ideas cheaply and with the tools the user already runs (their boilerplates `Boilerplate-*-docker-portainer` and the reusable workflow `nestjs-docker-portainer-deploy`); moving to AWS or GCP comes later, for a project that has proved it needs it. This amends ADR-0002 and ADR-0010: their cloud decisions (Terraform, functions, OIDC, managed secrets) stay recorded and apply when a project moves to the cloud, but they are **not generated today**.

## Considered Options

- **Serverless cloud first (ADR-0002)**: deferred; it needs a cloud account, a bootstrap, Terraform and a domain before the first deploy, which is too much to validate an idea.
- **SSH deploy (copy files and `docker compose up` over SSH)**: rejected; it needs an SSH key in CI and a shell on the server, while a Portainer webhook is one HTTPS call that holds no server credentials.
- **Watchtower polling Docker Hub**: rejected; no explicit trigger, so the pipeline cannot report success or failure and rollback is not deterministic.

## Consequences

- **Repository files** (`recipes/vps-deploy.md`): a production `Dockerfile` target in the backend and in the frontend (an SPA served by an unprivileged web server container, since there is no CDN), `docker-compose.prod.yml`, `.env.example` for the runtime variables, and a thin `.github/workflows/deploy.yml` caller of the Shared Workflows (ADR-0004).
- **Images** are `<docker-hub-user>/<slug>-backend` and `<slug>-frontend`, tagged `deploy-YYYY-MM-DD.N` and `latest`. The compose file runs `latest`, so the webhook only needs to pull. **Rollback** is the same workflow run with an earlier tag: it retags that image as `latest` and calls the webhook (`recipes/quality-gates.md`).
- **Secrets**: GitHub Actions secrets `DOCKER_HUB_USERNAME`, `DOCKER_HUB_ACCESS_TOKEN` and `PORTAINER_WEBHOOK_URL`; the application's runtime secrets live in the stack's environment variables in Portainer, never in the repository or in an image. The agent never triggers the deploy workflow (ADR-0005 guardrails).
- **The database** runs as a container in the backend's stack, with a named volume and a scheduled dump, which is enough to validate; a managed database replaces it when the project moves to the cloud.
- **TLS and the domain** are a one-time setup of the VPS (a reverse proxy in front of the published ports), done by the user and listed in `recipes/new-project.md`; the repositories do not carry the proxy.
- **What no longer exists in a generated project today**: Terraform, bootstrap, OIDC, `infra/`, the cloud role in the pipeline, functions and Lambda adapters. Application code is still a plain HTTP server, so moving to the cloud later stays configuration (ADR-0002).
