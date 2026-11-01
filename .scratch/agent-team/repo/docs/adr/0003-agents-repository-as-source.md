# This repository is the source of the agents; projects pin a version

Projects install the agents from a pinned tag of this repository and commit the rendered files, because a cloud session only sees what is in the repository (ADR-0005 of the Template). Updating is a pull request that bumps the tag and re-renders. A project adds rules to a role in `agents/overrides/<role>.md`; additions are appended and can never remove the role's own rules, so guarantees such as "QA never changes production code" hold everywhere. A drift check fails when a rendered file differs from its source.

The dispatcher lives here too, as a reusable workflow, so roles and the dispatcher that starts them always share a version.

## Considered Options

- **Roles described in the Template's recipes**: rejected; the agents change faster than the Template and are shared by every project.
- **Git submodule**: rejected; complicates clones and CI.
- **A Claude Code plugin**: rejected; Codex cannot use it and it does not follow the session to the cloud.

## Consequences

- The Template's ADR-0005 consequence about vendoring skills into the Template is superseded: skills are vendored here.
- `/new-project` installs a pinned version in every new project.
