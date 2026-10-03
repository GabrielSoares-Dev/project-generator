Status: ready-for-agent

# Build the factory: local first slice (PHP Laravel + React + PostgreSQL)

## Problem Statement

The Template is fully designed (Stack Recipes, Decision Guide, Quality Gates, ADRs) but nothing executable exists yet. There is no `/new-project` skill, so the user cannot create a Derived Project, and the recipes have never been executed, so nobody knows whether they produce repositories that pass the Quality Gates.

## Solution

Build the smallest `/new-project` that generates a complete Derived Project on the user's machine: a PHP Laravel backend and a React web frontend with PostgreSQL, running locally, with every local Quality Gate green and the agent rules in place. No GitHub repositories, no AWS, no deploy. The run doubles as the first test of the recipes: whatever breaks becomes a correction to the recipes. Once a run is clean, the next specs cover GitHub creation and protection, Shared Workflows, Terraform and deploy, `/validate-recipe` and the other stacks.

## User Stories

1. As a founder, I want to run `/new-project` in a local session inside the Template, so that it can use Docker and my own tools (G9).
2. As a founder, I want `/new-project` to interview me about the product and the team, so that technologies are chosen from what the maintainers master (Decision Guide).
3. As a founder, I want the interview to collect project name, domain, product language, dark mode and Brand Tokens, so that nothing needs to be edited by hand afterwards.
4. As a founder, I want `/new-project` to show the full plan and wait for my confirmation, so that nothing is created before I agree.
5. As a founder, I want each technology choice recorded as an ADR in the generated repository, so that future agents and teammates know why it was chosen.
6. As a founder, I want the backend generated from the Laravel recipe with the shared clean-architecture structure and PostgreSQL in Docker Compose, so that it runs locally in one command.
7. As a founder, I want the backend to answer `GET /health` with its version and to publish an `openapi.json`, so that I can see it working and the frontend has a contract.
8. As a founder, I want the frontend generated from the React recipe with shadcn/ui and my Brand Tokens, so that it matches my identity from the first screen.
9. As a founder, I want the frontend's API client generated from the backend's local `openapi.json`, so that both repositories agree on the contract (ADR-0008).
10. As a founder, I want every local Quality Gate run on both repositories and generation to stop if one fails, so that what I receive is already green.
11. As a founder, I want each repository to contain `CLAUDE.md`, `AGENTS.md`, `CODING_STANDARDS.md`, `GLOSSARY.md`, `.template-version`, `docs/` resolved for my stack and a README, so that the agent has everything it needs.
12. As a founder, I want `AGENTS.md` kept short with pointers to detailed docs, so that the agent is not slowed by a long always-loaded file.
13. As a founder, I want the vendored Matt Pocock skills subset in each repository's `.claude/skills/`, so that skills follow the agent into cloud sessions (ADR-0005).
14. As a founder, I want the generated `.claude/settings.json` to block `terraform apply`, merges, force pushes, pushes to `main`, reading `.env` files and triggering deploys, so that "the human always merges" holds by rule.
15. As a founder, I want Lefthook hooks (pre-commit and pre-push) in each repository, so that failures are caught before code leaves the machine.
16. As a founder, I want all tool and dependency versions pinned to the latest stable on creation day, so that machine and later CI match (version policy).
17. As the Template owner, I want every failure of a run turned into a correction of the recipe, with the reason recorded, so that the recipes improve from real use.
18. As the Template owner, I want a clean end-to-end run on a throwaway directory as the exit criterion, so that I know the recipes work before building the rest of the factory.

## Implementation Decisions

- **Scope is local only.** `/new-project` in this slice writes to a local directory and does not create GitHub repositories, branch protection, labels or a Project, and never touches a cloud account. Those steps of the new-project recipe are deferred.
- **Combination:** PHP Laravel (lean, API only, FrankenPHP in containers) + React (shadcn/ui) + PostgreSQL. AWS is recorded as the Deploy Target in the ADRs but nothing is deployed.
- **Modules to build:**
  - `/new-project` skill: interview, plan and confirmation, generation from recipes, local Quality Gates, ADRs and README. Create mode only.
  - Templates for the generated rule files, resolved for the chosen stack, plus Lefthook configuration.
  - The vendored skills subset and the generated agent guardrails, as listed in the repository layout recipe.
- **Generation order:** backend first (its local `openapi.json` feeds the frontend client), all gates green locally, then frontend, then rule files.
- **Incremental construction:** the skill is built first with fixed answers to prove generation, then the interview replaces the fixed answers.
- **Recipes are the source of truth.** A failure is fixed in the recipe (or the skill), never patched only in the generated code.
- **Language:** everything technical written to the repository is English; end-user text follows the product language chosen in the interview.
- **Tickets for building the Template live in `.scratch/`**; Derived Projects use GitHub Issues.

## Testing Decisions

- **One seam:** a full `/new-project` run into a throwaway directory. A run passes when both generated repositories pass every local Quality Gate for their stack (lint and format, typecheck, unit tests with 80% coverage, integration tests against a real PostgreSQL container, accessibility, architecture validation, bundle size, dependency audit), the backend `prod` Dockerfile target builds, the frontend client matches `openapi.json`, and backend and frontend start together with the frontend reaching `GET /health`.
- A good test checks external behavior of the generated repositories, not the internals of the skill.
- **Prior art:** none in this repository. The gate list comes from the quality gates recipe; the Laravel structure from the PHP recipe.

## Out of Scope

- Creating GitHub repositories, branch protection, labels and the GitHub Project.
- Shared Workflows, CI caller workflows, deploy, rollback and restore-test workflows.
- Terraform (bootstrap and infrastructure), the `/wizard` manual steps, Renovate.
- `/validate-recipe` as a separate skill, `/sync-template`, the add mode of `/new-project`.
- Java, Node, Go, Angular and mobile recipes' validation; MySQL, DynamoDB, GCP, container runtime, external authentication providers and on-demand mechanisms.
- Removing the local `mattpocock-skills` plugin and tagging the workflows repository `v1`: housekeeping, done when it becomes necessary.

## Further Notes

- After the first clean run, pause and adjust the recipe format from what it taught (ADR-0001), then write the spec for the deferred parts.
- To verify later: how agent pull requests appear on GitHub (author), to see whether a required human approval can be added.
