# Production on a VPS

What every generated repository carries to run in production on a VPS (ADR-0013). The same files exist in the backend and the web frontend; only the image differs. The VPS runs Docker and Portainer; the repository never holds server credentials.

## Files

| File | Backend | Frontend |
|---|---|---|
| `Dockerfile`, target `prod` | the stack's production image (`recipes/backend/php.md`, *Implementation notes*), non-root, health check on `GET /health` | multi-stage: the `build` stage runs `pnpm build` with `VITE_API_URL` as a build argument, the `prod` stage is `nginxinc/nginx-unprivileged` serving `dist/` with SPA fallback to `index.html` and cache headers for hashed assets |
| `docker-compose.prod.yml` | services `app` and `db` (PostgreSQL, named volume) | service `app` |
| `stack.env.example` (backend) / `.env.example` | every runtime variable with a production placeholder (`APP_ENV=production`, `change-me` passwords), copied into the Portainer stack; the backend's `.env.example` is the local development file (`recipes/backend/php.md`, item 23) | `VITE_API_URL` documented in `.env.example` (it is a build argument for production, a runtime variable only for the dev server) |
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

The backend adds the `db` service (PostgreSQL image of the pinned major, `volumes: - <slug>-db:/var/lib/postgresql`, the same `stack.env`, a health check with `pg_isready`) and `depends_on: db: condition: service_healthy`. The frontend's container listens on `8080` (unprivileged nginx) and declares **no network**: it needs none (the browser reaches the API through the published port), and two stacks declaring a network with the same name make Compose warn that the network "was not created for project". Host ports differ per project so several stacks share one VPS; they are recorded in the plan.

The compose file is validated with `docker compose -f docker-compose.prod.yml config`, and the `prod` image is built and run once during generation (the skill's step 7): `GET /health` for the backend, `/` and a deep link for the frontend. The backend's `config` needs a `stack.env` (Compose fails on a missing `env_file`): make it from `stack.env.example` with real test values (`APP_KEY` from the dev `.env`, `CORS_ALLOWED_ORIGINS` set to the frontend's origin as the headless browser sees it) and keep it out of Git. Run each compose file with a project name of its own (`docker compose -p <slug>-prod-backend -f docker-compose.prod.yml up -d`): without it the project name is the folder's, the same as the development Compose file, whose `app` service would be recreated. The two production containers are proven together with the headless browser (`recipes/frontend/react.md`, *Verify in a browser*), the frontend image built with `VITE_API_URL` set to the backend's published port as the browser reaches it (`http://host.docker.internal:8081`).

## Lean images

Production images are small, because the VPS pulls them on every deploy and holds several projects on little disk and memory:

- **Multi-stage**: dependencies and the build happen in earlier stages; the `prod` stage copies only what runs. No `dev` tools in it: no Composer, Git, Xdebug, test and quality tools, `node_modules` or source maps of the build.
- **Smallest base that works**: Alpine variants (`dunglas/frankenphp:<php>-alpine` with only the extensions the app uses, `nginxinc/nginx-unprivileged:<version>-alpine-slim`). Install production dependencies only (`composer install --no-dev --optimize-autoloader --classmap-authoritative`); one `RUN` per concern with the package cache removed in the same layer (`apk add --no-cache`).
- **`.dockerignore`** excludes `.git`, `node_modules`, `vendor` (rebuilt in the image), `tests`, `docs`, `coverage`, `build`, `.env*` (but `.env.example`), `tools/`, `.claude/` and the other repository-only files, so the build context is small and no secret enters a layer.
- **What measuring found** (2026-10-06): the frontend on `nginx-unprivileged:<version>-alpine` was 91.5 MB and on `-alpine-slim` 30 MB (the slim variant keeps the gzip module; it drops the optional ones). The backend on the Alpine FrankenPHP image was 440 MB until the `prod` stage was flattened (`FROM scratch` + `COPY --from=runtime / /`) after removing `php-cgi`, `phpdbg`, the PHP sources and the extension tooling in the `runtime` stage: 240 MB. Deleting files in a later layer does not shrink an image; the flattening does (`recipes/backend/php.md`, item 20).
- **Measured, not assumed**: during generation `docker image ls` reports each `prod` image; the sizes are written in the README and the `0007-deploy-vps` ADR. Targets: frontend under 60 MB, backend under 250 MB. A size above the target is a failure to explain or fix, not to ignore.

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
permissions:
  contents: write
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

The frontend's caller adds `build_args: VITE_API_URL=${{ vars.VITE_API_URL }}` and its own `image`. The Shared Workflow (`recipes/shared-workflows.md`) does, in order: build the `prod` target → push `deploy-YYYY-MM-DD.N` and `latest` → POST the Portainer webhook → when `health_url` is set, poll it until it answers 200 and, for the backend, reports the new version → tag the commit and publish the GitHub Release. With `rollback_tag` it skips the build: it pulls that tag, pushes it as `latest` and calls the webhook.

## What the VPS needs, once (listed for the user, `recipes/new-project.md`)

- Docker and Portainer running; a stack per repository created from its `docker-compose.prod.yml`, with the variables of `.env.example` filled in the stack's environment; the stack's **webhook** enabled, its URL stored as `PORTAINER_WEBHOOK_URL`.
- A reverse proxy with TLS in front of the published ports, and DNS for `app.<domain>` and `api.<domain>`.
- A Docker Hub account and an access token, stored as `DOCKER_HUB_USERNAME` and `DOCKER_HUB_ACCESS_TOKEN`; repository variables `HEALTH_URL` and (frontend) `VITE_API_URL`.
- A scheduled dump of the database volume to a place off the VPS.
