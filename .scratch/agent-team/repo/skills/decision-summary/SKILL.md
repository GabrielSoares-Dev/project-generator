---
name: decision-summary
description: Write the decision summary for a ticket escalated to the human (three returns, an ADR or plan to approve, a disagreement between agents), so the human can decide in one read. Use when a ticket gets ready-for-human because of an escalation.
---

The human leads the team and decides; this summary does the reading for them. Post it as one comment on the issue, starting with `<!-- agent-team decision -->`.

## Gather

1. The issue's acceptance criteria.
2. Every verdict comment on the pull request (`<!-- agent-team verdict ... -->`) and the replies to them.
3. The failing tests or review findings each return named.
4. The handoff note.

## Shape

```markdown
<!-- agent-team decision -->
**Decision needed**: <one-line question, answerable with one of the options>

**At stake:** <what is blocked and what each answer changes>

| | Position | Evidence |
|---|---|---|
| Dev | ... | <commit, test or comment link> |
| QA | ... | ... |
| Reviewer | ... | ... |

**Options**
1. <option>: <consequence>
2. <option>: <consequence>

**Recommendation:** <option number> because <reason tied to the criteria, a standard or an ADR>.

**If this becomes a rule:** <the line to add to AGENTS.md or an ADR, or "not a rule">
```

## Rules

- Neutral on positions: state each agent's case at its strongest, then recommend.
- Every position cites evidence that can be opened.
- One question per summary; split if there are more.
- Never decide: no label changes, no commits.
