# Glossary

**Role**: a kind of agent with one job, its own inputs, outputs and permissions (Dev, QA, Reviewer). Written once in `roles/`.

**Capability**: what a role may change: `read-only`, `tests-only` or `full`. Each tool enforces it its own way (`docs/role-format.md`).

**Primary AI / fallback AI**: the AI a project runs its roles on, and the one that takes over a pull request when the primary runs out of quota or goes silent. Claude and Codex by default.

**Handoff note**: the single comment on an issue, edited in place after every push, that says what is done, what is left and the next step. Any AI resumes from it.

**Return**: QA or the Reviewer sending a pull request back to the Dev. Three returns escalate to the user.

**Escalation**: a ticket moved to `ready-for-human` because the agents could not settle it, with a decision summary.

**Decision summary**: what is at stake, each agent's position, the evidence and a recommendation, written for the user to decide quickly.

**Dispatcher**: the deterministic workflow that moves labels, starts roles, counts returns and runs the failover. It decides no content.

**Supervised mode**: the dispatcher asks the user before every hand-off; on for the first tickets of a project.

**Override**: a project's additions to a role, in `agents/overrides/<role>.md`, appended at render time.

**Rendered file**: a file `bin/agents-sync` writes into a project from a role or skill; committed, never edited by hand.
