# A role is an agent only when it needs an isolated context or different permissions

Every agent costs quota and adds a hand-off that can fail. A role becomes an agent only when it must not see another agent's reasoning (QA, Reviewer) or needs permissions others must not have (deploying, read-only review). Everything else is a skill an agent loads (triage, security review, contract keeping) or a check in `./project check` (translations, design tokens, coverage).

## Consequences

- Wave 1 is three agents: Dev, QA, Reviewer. Security starts as a Reviewer skill.
- There is no tech-lead agent: the user keeps every decision (priority, tie-break, ADR approval, new rules, merge).
