# Production on a VPS

What every generated repository carries to run in production on a VPS (ADR-0013). The same files exist in the backend and the web frontend; only the image differs. The VPS runs Docker and Portainer; the repository never holds server credentials.

## Files

| File | Backend | Frontend |
|---|---|---|
| `Dockerfile`, target `prod` | the stack's production image (`recipes/backend/php.md`, *Implementation notes*), non-root, health check on `GET /health` | multi-stage: the `build` stage runs `pnpm build` with `VITE_API_URL` as a build argument, the `prod` stage is `nginxinc/nginx-unprivileged` serving `dist/` with SPA fallback to `index.html` and cache headers for hashed assets |
| `docker-compose.prod.yml` | services `app` and `db` (PostgreSQL, named volume) | service `app` |
| `.env.example` | every runtime variable with a placeholder | `VITE_API_URL` documented (it is a build argument, not a runtime variable) |
| `.github/workflows/deploy.yml` | caller of the Shared Workflow | the same |

`docker-compose.prod.yml` has no `build:` section: it runs the image from Docker Hub, so Portainer pulls what the pipeline pushed.

```yaml
services:
  app:
    image: <docker-hub-user>/<slug>-backend:latest
    container_name: <slug>-backend
    restart: unless-stopped
    ports:
      - "<host-port>:8080"
    env_file:
      - stack.env
    networks:
      - <slug>
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
networks:
  <slug>:
    name: <slug>
```

The backend adds the `db` service (PostgreSQL image of the pinned major, `volumes: - <slug>-db:/var/lib/postgresql`, the same `stack.env`, a health check with `pg_isready`) and `depends_on: db: condition: service_healthy`. The frontend's container listens on `8080` (unprivileged nginx). Host ports differ per project so several stacks share one VPS; they are recorded in the plan.

The compose file is validated with `docker compose -f docker-compose.prod.yml config`, and the `prod` image is built and run once during generation (the skill's step 7): `GET /health` for the backend, `/` for the frontend.

## Migrations

The backend's entrypoint runs the migrations (`php artisan migrate --force` in Laravel) before it starts serving, as in the user's boilerplates. Migrations are backward compatible (expand, then contract), so a rollback of the image is safe (`recipes/quality-gates.md`).

## The workflow

`.github/workflows/deploy.yml` is a thin caller, manual (`workflow_dispatch`) with an optional `tag` input, pinned to the central repository by tag (ADR-0004):

```yaml
name: DEPLOY
on:
  workflow_dispatch:
    inputs:
      tag:
        description: Earlier tag to roll back to; empty builds the current commit
        required: false
jobs:
  deploy:
    uses: GabrielSoares-Dev/workflows/.github/workflows/docker-portainer-deploy.yml@v1
    with:
      dockerfile_target: prod
      image: <docker-hub-user>/<slug>-backend
      rollback_tag: ${{ inputs.tag }}
      health_url: ${{ vars.HEALTH_URL }}
    secrets:
      docker_hub_username: ${{ secrets.DOCKER_HUB_USERNAME }}
      docker_hub_access_token: ${{ secrets.DOCKER_HUB_ACCESS_TOKEN }}
      portainer_webhook_url: ${{ secrets.PORTAINER_WEBHOOK_URL }}
```

The Shared Workflow (`recipes/shared-workflows.md`) does, in order: build the `prod` target (with `VITE_API_URL` from `vars.VITE_API_URL` for the frontend) → push `deploy-YYYY-MM-DD.N` and `latest` → POST the Portainer webhook → when `health_url` is set, poll it until it answers 200 and, for the backend, reports the new version → tag the commit and publish the GitHub Release. With `rollback_tag` it skips the build: it pulls that tag, pushes it as `latest` and calls the webhook.

## What the VPS needs, once (listed for the user, `recipes/new-project.md`)

- Docker and Portainer running; a stack per repository created from its `docker-compose.prod.yml`, with the variables of `.env.example` filled in the stack's environment; the stack's **webhook** enabled, its URL stored as `PORTAINER_WEBHOOK_URL`.
- A reverse proxy with TLS in front of the published ports, and DNS for `app.<domain>` and `api.<domain>`.
- A Docker Hub account and an access token, stored as `DOCKER_HUB_USERNAME` and `DOCKER_HUB_ACCESS_TOKEN`; repository variables `HEALTH_URL` and (frontend) `VITE_API_URL`.
- A scheduled dump of the database volume to a place off the VPS.
