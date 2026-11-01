---
name: handoff-note
description: Keep the single handoff note on a GitHub issue (done, left, next), so any agent on any AI can resume the ticket. Use after every push, when starting or resuming a ticket, and before a session ends.
---

The handoff note is **one comment on the issue**, edited in place, never a new comment each time. It is the only memory a ticket has between sessions: the next session may be another role or another AI.

## Find it

The note is the issue comment whose first line is `<!-- agent-team handoff -->`. If none exists, create it. If several exist, edit the oldest and say so in it.

## Shape

```markdown
<!-- agent-team handoff -->
**Handoff note**: updated <ISO date and time> by <role> on <claude|codex>

**Branch:** `<branch>` · **Pull request:** #<n> or none yet · **Last pushed commit:** `<sha>`

**Done**
- <what is finished and pushed, one line each>

**Left**
- <what remains for the acceptance criteria>

**Next**
<the one next step, concrete enough to start without reading the session>

**Open questions**
- <questions asked on the issue and not yet answered, or "none">
```

## Rules

- Update it after every push, and before stopping for any reason.
- Write only what is pushed: work that is not on the branch does not exist for the next session.
- Facts, not reasoning: what was done and what is next, not why the agent believes its approach is right. QA must be able to read it without being steered.
- Keep it short: it is rewritten every time, not appended to.
