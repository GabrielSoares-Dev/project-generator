# CI/CD lives in a central repository of reusable workflows

Derived Projects do not carry their full CI/CD pipelines; their `.github/workflows/` files are thin callers to reusable GitHub Actions workflows kept in one central repository, `GabrielSoares-Dev/workflows` (reused from the existing boilerplate), so an improvement reaches every Derived Project at once. This is a deliberate exception to the self-contained spirit of Stack Recipes (ADR-0001). Because the agent cannot see the central pipeline from inside a Derived Project, each Derived Project's agent docs point to it, and any change to the central workflows (new or updated) goes through a pull request the human merges, never a direct push.

Derived Projects pin the Shared Workflows by version tag (`@v1`, `@v2`, …), never a branch. Compatible changes move the current major tag and reach every project; breaking changes get a new major tag that each project adopts through its own pull request. A bad merge in the central repository therefore cannot break every project's CI at once.

## Considered Options

- **Full workflows inside each Derived Project**: rejected; every pipeline fix would have to be repeated in each project.
