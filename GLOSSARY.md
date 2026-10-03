# Project Generator

A generator of new software projects, built so an AI agent can implement work autonomously while a human reviews and merges the results.

## Language

**Template**:
This repository (the Project Generator): the single source of recipes, decision guide and agent setup that creates new projects. It is never copied; projects are generated from it.
_Avoid_: boilerplate, starter, base project

**Derived Project**:
A product created by the Template, made of one or more repositories (backend, web frontend, mobile app), each evolving independently.
_Avoid_: child project, instance, generated project

**Stack Recipe**:
A document in the Template describing how to build one technology stack's skeleton (folder structure, naming conventions, libraries, testing, running locally), from which the agent generates code when a Derived Project is created.
_Avoid_: skeleton, scaffold, starter kit

**Decision Guide**:
The Template's rules for choosing a Derived Project's technologies, applied by `/new-project` through an interview about the product and the team, limited to technologies the user masters.
_Avoid_: tech radar, stack selector, questionnaire

**Quality Gates**:
The automated checks (lint and format, typecheck, unit tests with coverage, integration tests, accessibility, architecture validation, bundle size, dependency audit, IaC checks) a repository must pass in CI before a pull request can merge; every gate whose tool exists for the stack is mandatory.
_Avoid_: checks, CI steps, validations

**Brand Tokens**:
A web frontend's or mobile app's visual identity (colors, typography, radii), defined when the Derived Project is created, which every screen the agent builds must follow.
_Avoid_: theme, style guide, branding

**Shared Workflows**:
The central repository of reusable GitHub Actions workflows (CI checks and manual deploy) that every Derived Project calls.
_Avoid_: pipeline repo, CI templates

**Autonomous Run**:
A Claude Code cloud session, started on demand from the phone, in which the agent implements tickets and opens pull requests unsupervised; merging always stays with the human.
_Avoid_: overnight run, night shift, auto-merge

**Local Review**:
How the human verifies a pull request before merging: checking the branch out and running that repository on their own machine (the backend in Docker Compose, the web frontend with pnpm, the mobile app as a development build on their phone).
_Avoid_: preview environment, staging, QA environment

**Event Function**:
A small, non-HTTP unit of work triggered by an event or a schedule (a file arriving, a queue message, a nightly job), as opposed to the HTTP API.
_Avoid_: lambda, job, worker, serverless function

**Deploy Target**:
Where a Derived Project runs in production: AWS or GCP, serverless by default. Chosen per Derived Project.
_Avoid_: environment, hosting, infra
