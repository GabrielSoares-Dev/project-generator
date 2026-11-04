# The platform: lead the agent team from the web, a TV and later the phone

Status: design and architecture decided; generated with `/new-project` (its stack chosen in the interview, Q6) and built by the agent team (Q4b, Q7). Design canvas: https://claude.ai/artifact/M6xZ65q9kaBNKxCvtCMF6q.

## Decided before (`.scratch/agent-team/spec.md`)

Q1 for the user only; Q3 GitHub is the state of the work, the platform keeps only what GitHub lacks; Q4 a Derived Project; Q6 its stack from the interview; Q7 the agents' debut project; P1a the PM's chat writes the issue's comments; P1b each chat message starts the PM through its scheduled task's API trigger (`/fire`); the platform never starts an agent itself except through `/fire` and GitHub labels.

## Screens

| Id | Decision |
|---|---|
| T5 | First slice, in order: **Decisions** (everything waiting for the user: supervised `/ok`, `spec-ready`, escalations, dependency fixes, merges), the **team wall** (TV), the **control room** (each project's board), the **PM chat**. Later: projects, metrics, new project. |
| T1 | The **team wall** for a TV: one column per agent (PM, Architect, Designer, Dev back, Dev front, QA, Reviewer, Release, Coach) with what it does now, in which project, for how long, and its state (working, waiting for you, queued, stalled, free); big counters on top (waiting for you, running of `maxConcurrent`, queued, production up or down); a ticker of recent activity. |
| T2 | The TV opens a **read-only display URL** with its own token, generated and revoked on the platform; no buttons, titles and states only, never comment bodies; updates by itself. |
| T4 | **Web first, mobile-first**, so the phone works in the browser from day one; the **mobile app** (Expo) comes later as another client of the same API. |

## Architecture

| Id | Decision |
|---|---|
| T3 | Live data: the dispatcher's events (agent-team v0.3.0, `events-url`) and GitHub webhooks, pushed to the screens with **SSE**. Events from inside the agents' sessions come later (they need the cloud environments' network to reach the platform). |
| A1 | **A GitHub App of the user's**: webhooks from every repository in one place; actions (comments, labels, merge) done **as the user**, with the user-to-server token from logging in through the App, so a merge shows as the user's. |
| A2 | **Log in with GitHub** through the same App; only the user's account is allowed; the backend keeps the session in a cookie (ADR-0009 of the Template). |
| A3 | Stored: an append-only **event log** (dispatcher and GitHub), a **projection** for the screens (each ticket's and agent's current state, rebuilt from the events and GitHub when needed), the **project registry** (repositories, kind, agent-team version), and **secrets encrypted at rest** (each task's `/fire` URL and token, the display tokens). |
| A4 | Webhooks are processed at once, idempotent by delivery id; a **reconciliation every 15 minutes** compares the projection with GitHub. It runs in **its own scheduler container** (one replica) in `docker-compose.prod.yml`, same image, another command, an exception to the recipes' ban on in-container schedulers, recorded as an ADR of the platform; if it holds, the Coach proposes it for the VPS phase of the recipes. |
| A5 | Repositories: backend and web frontend now; the mobile app later through `/new-project`'s add mode. |
| A6 | On the VPS (ADR-0013) with a public domain, since GitHub and the dispatcher post to it. |
