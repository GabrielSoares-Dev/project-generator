# Stack Recipes instead of ready-made skeletons

Each Derived Project picks its own stack at creation time from a fixed menu (frontend: React or Angular; backend: Java, Go, Node or PHP; mobile: React Native with Expo, added by ADR-0012), so the Template does not ship working code for every option. Instead it holds a stack-neutral core (dev container, Docker Compose, generic CI, agent skills, `AGENTS.md`) plus one Stack Recipe per option, and the agent generates the chosen stack's skeleton from its recipe when the Derived Project is created, using current tool versions. A maintained skeleton per stack would rot between uses, and generating code from written conventions is exactly the work the agent does well.

## Considered Options

- **Ready-made skeletons for every stack**: rejected; every stack combination would be code to keep compiling and up to date.
- **Skeletons for the most-used stacks, recipes for the rest**: rejected for now; revisit if one stack becomes the clear default.

## Consequences

- Recipes are validated by a **`/validate-recipe` skill** in the Template: it generates a throwaway project for one stack combination, runs every Quality Gate, and deletes it. Generation needs the agent, so it is not a GitHub Actions workflow (that would require an API key, which the plan avoids). The user runs it in a session after a recipe changes, and again whenever they want to check for recipes gone stale; there is no scheduled routine.
- **Every recipe is written up front**, before the first Derived Project, so the factory is ready for every stack the user masters. Order: one complete combination end to end first (**PHP Laravel + React + PostgreSQL + AWS**, the user's choice), then a pause to adjust the recipe format from what it taught, then the remaining recipes, each one approved by the `/validate-recipe` skill.
- Stack choice is guided: the Template carries a decision guide, the agent interviews the user about the product and recommends a stack, the user decides, and the choice is recorded as an ADR in the Derived Project.
- The backend recipes share one clean-architecture folder structure, documented in `recipes/backend/clean-architecture.md` and translated per language. It was originally derived from `GabrielSoares-Dev/Boilerplate-spring-boot-serverless`, but this repository's document is the source of truth.
- **The mechanical files (gate configuration, scripts, Docker and dev container files) are written from the recipes on every run, and the cost is accepted** (decided on 2026-10-06, after two end-to-end runs). Fixed templates or a scripted generator were rejected: each is one more place that must be kept in step with every tool and version change, and a stale one produces a project that fails its own gates, which is worse than the cost of writing the files. What keeps the cost down instead: recipes precise enough to be followed without a reference, quiet gate output (summaries, not logs), running only the gates a change touches during generation with the full `project check` at the end, and not repeating a failure the recipes already record.
