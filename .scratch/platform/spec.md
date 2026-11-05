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

## Ticket, notifications, health and quota (design boards 11 to 14)

| Id | Decision |
|---|---|
| M1 | **Ticket screen**: the stages (PM, Dev, QA, Reviewer, your merge), a timeline built from the events and GitHub (who picked it up, handoff notes, verdicts with their evidence, returns, PRs and checks, the user's comments), the acceptance criteria with their state, the PR and its checks, and **Comment** (F6). Actions: Decide (when escalated), Try again (F8), Pause this ticket, Abandon. Every card and link that names a ticket opens it. |
| M2 | **Notifications, in the platform only for now** (no push, no e-mail): a **Notifications** screen and a counter in the side menu, live over the same SSE as the activity, with the filters unread, all and by kind (decision, escalation, stall, quota, merge) and "Mark all as read". One per event; a newer one for the same ticket replaces an unread older one; resolving the thing (decide, `/ok`, merge) marks it read everywhere. Pending decisions, escalations, stalls and quota cannot be turned off; "PR ready for merge" and the optional **daily digest** (F5) can. The **team wall** shows the unread ones in a column, read-only: they leave it when resolved. Push comes later. |
| M3 | **Project health**, per repository: App installed and webhooks arriving, the 30 labels, the workflows at the config's version, `agents:check` green, `main` protection, each scheduled task marked with its model (warns when it differs from `"models"`), each role's last wake-up from the events (a `run:<role>` label with no session is a problem), the dispatcher's last event, tick and reconciliation. |
| M4 | **Quota**: the platform cannot read the subscription's quota, so it infers it: **3 stalls of different roles or tickets within 30 minutes** pause the start of new tickets like "Pause all" (F4), marked as *quota*, and hold the retries instead of spending them. Every 30 minutes one stalled ticket is released as a probe; a verdict ends the pause and the stalled ones come back one at a time without counting a retry. "Resume now" and "Not quota, resume" (stalls handled as usual) are the user's. A banner on every screen and on the wall. |

Open, for the dispatcher: what **Pause this ticket** and **Abandon** do on GitHub (a `paused` label per ticket; closing the issue as not planned and the PR), and the probe of M4 (`maxConcurrent` 0 plus one release).

## Login and access (design board 10)

| Id | Decision |
|---|---|
| — | **Login**: "Sign in with GitHub" through the platform's GitHub App (OAuth with `state`). The backend exchanges the code, rejects any login other than the owner's (no session is opened), stores the user-to-server token encrypted and opens an `HttpOnly` cookie session; the token never reaches the browser. It expires in 8 hours and is refreshed with the refresh token; when the refresh fails (App revoked, 6 months), the session ends and the screen says "Session expired", keeping unsent drafts in the browser. |
| — | **First access**: the list of repositories with and without the App installed, and a button to install it on GitHub; a project whose repository lacks the App shows "no access" in place of its cards. |
| — | **TV**: no GitHub login. `/wall` shows a pairing code; the owner confirms it while signed in and the TV gets a **display token** that only reads the wall (A3), listed in the account menu with "Revoke". |
| — | **Account menu** at the foot of the side menu: the account, the paired screens, the App's repositories, "Sign out". The mobile app later uses the same GitHub login. |

## The current project

| Id | Decision |
|---|---|
| — | A **project selector at the top of the side menu** on every web screen (a chip on top of the phone screens) always says which project the user is in. **Project screens** (control room, PM chat, a ticket) show one project, and switching the selector switches the whole screen. **Cross-project screens** (Decisions, the team wall, Metrics) default to **"All projects"**, show the project on every card, and use the selector as a filter. **New Project** shows the draft being created ("Creating now"). |

## The model of each role

| Id | Decision |
|---|---|
| — | The New Project's Team step lists every role with a **model select** (Opus, Sonnet, Haiku), preset from agent-team's role defaults (PM, Architect and Designer on Opus; the Devs, QA, Reviewer and Coach on Sonnet; Release on Haiku). What the user changes becomes `"models"` in the project's `.agents/config.json`, so the setup checklist shows it. After creation, each role card of the control room has the same select: a change opens a pull request on the project changing `"models"` in `.agents/config.json`, and the card says the scheduled task must be changed too until the user marks it done. The model that runs is the scheduled task's on claude.ai, which the user sets; the platform never claims to change it. |

## Buttons (design board 8)

| Id | Decision |
|---|---|
| F1 | A human comment answers the role that stopped to ask: the Architect or the Designer, when its last comment carries a question marker; not the PM. **agent-team**: the roles mark their questions, the dispatcher wakes that role. |
| F2 | "Brainstorm with the team" becomes **"Free conversation with the PM"**: a `needs-spec` issue without a settled idea. |
| F3 | "Ask QA's opinion" is removed: QA only verifies pull requests. |
| F4 | **Pause all**: a `paused` state (label or config) the dispatcher respects: nothing new starts (no new tickets, hand-offs or retries), what runs finishes, the screens show PAUSED until the user resumes. **agent-team**: the dispatcher rule. |
| F5 | **Team stand-up**: a summary built from the day's events, without AI (what came in, went out, is stalled, waits for the user). Platform only. |
| F6 | The loose "message to the team" box is removed; each ticket has **Comment**, which writes the user's comment on it; the agent reads it on its next run; priority stays the queue order. |
| F7 | "Generate project" appears only on step 6 of New Project. |
| F8 | **Try again** (stalled or escalated) clears `escalated` and `stalled` and restores the stage and its `run:` label; **"Dev is right / QA is right"** posts the decision, resets the return count and starts the role that lost. **agent-team**: the dispatcher counts returns only after the last tie-break marker. |

## Screens added to the canvas

New Project steps 3–6 (Stack, Repositories, Team, Generate), the team wall (TV), Decisions on the phone, Metrics (from the events; no money cost), the button flows, and the design system board (colors, the six agent states as semantic variants, type including the TV scale, spacing, radii, components).

## Stack (architecture plan, `architecture.md`)

| Id | Decision |
|---|---|
| D1 | **Go** (the learning stack of `recipes/backend/go.md`, on the user's explicit request): `net/http` + Huma, sqlc + goose on PostgreSQL, `pgx`. Before the platform, `/new-project` must generate Go and pass its Quality Gates, and agent-team's Dev backend must carry the Go standards and the learning-stack rules (explanatory pull requests, stricter lint, `go test -race`). The architecture plan was rewritten for Go on 2026-11-04 (stack, components, SSE hub, scheduler process, risks). |
| D2 | Live updates: PostgreSQL `LISTEN/NOTIFY` with replay from the event log, falling back to polling when a wait times out. |
| D3 | The GitHub App as the login provider, recorded as an ADR in both repositories. |
| D4 | The platform's automatic writes (the quota probe) use the user's token, through the same locked refresh. |
| D5 | Display and events tokens are hashed, not encrypted. |
| D6 | Rate limit in memory (`golang.org/x/time/rate`) while the API has one replica; an ADR says a second replica brings a shared store. |
| D7 | pt-BR only, no i18n. |
| D8 | Every timed job (reconciliation, quota probe, daily digest, pruning) in the one scheduler binary and container (A4), each guarded against overlapping runs. |
| D9 | **No queue or broker.** The API, the scheduler and PostgreSQL. Webhooks and dispatcher events are stored and projected inside the request, idempotent; PostgreSQL's `LISTEN/NOTIFY` is the only bus between the API and the scheduler; the reconciliation repairs anything missed. A queue comes only when processing a delivery needs slow outbound calls or the API runs more than one replica, with an ADR. |
