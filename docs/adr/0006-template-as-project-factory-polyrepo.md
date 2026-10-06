# The Template is a project factory, and Derived Projects are polyrepo

A Derived Project's backend and frontend live in separate repositories, because projects are meant to grow and monorepos get complicated as they do. Using the Template as a GitHub "template repository" would then copy every recipe into every repository, so the Template is never copied at all: a session in the Template runs a `/new-project` skill that interviews the user through the decision guide and creates the needed repositories on GitHub (backend, web frontend, mobile app, in any combination), each containing only its own generated code, its CI callers to the Shared Workflows, the agent skills, its `AGENTS.md` and ADRs recording the choices made.

## Considered Options

- **Monorepo per Derived Project**: rejected; harder to manage as projects grow.
- **Two GitHub template repositories (frontend and backend)**: rejected; two places to maintain recipes, guide and agent setup.

## Consequences

- Because each repository gets a **copy** of the rules (`AGENTS.md`, `CODING_STANDARDS.md`, lint and architecture configs, agent skills), Template improvements do not reach existing projects on their own (only CI does, through the Shared Workflows tag). A **`/sync-template`** skill in the Template compares a chosen project's rule and config files with the current Template and opens a pull request in that project with the differences, which the human reviews and merges. Each repository records the Template version it came from in `.template-version`, so the comparison knows what changed. The Template is versioned with tags `template-v<n>` (`template-v1`, `template-v2`…), cut when a pull request changing recipes, standards or skills is merged, with a `CHANGELOG.md` generated from pull request titles; `/sync-template` shows in the project's pull request what changed between the two versions.
- A feature touching both sides is split by repository: each ticket lives in the repository it changes, the spec lives in the backend repository (which owns the API contract), and frontend and mobile tickets are blocked by the backend tickets they depend on. A GitHub Project board spans both repositories for a single view. Each Autonomous Run therefore works one ticket in one repository.
- Each repository runs on its own (the backend with its Docker Compose, the web frontend in its dev container or with pnpm on the host). The frontend reaches the backend only through a configurable API URL (environment variable), so Local Review of a frontend change means starting the backend separately and pointing the frontend at it.
