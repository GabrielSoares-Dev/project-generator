# A deterministic dispatcher moves the work; supervised mode at first

Hand-offs follow fixed rules (a label means one next role), so a GitHub Actions workflow decides them, not an AI: cheaper, predictable, testable. It changes labels, starts roles, counts returns (three escalate to the user) and runs the failover. It never applies `ready-for-agent` and never merges.

For the first five tickets of a project, the dispatcher runs in supervised mode: before each hand-off it comments what happened and waits for the user's confirmation. The user switches it off per project; it never switches off by itself.

## Considered Options

- **A coordinating agent** that reads the board and decides: rejected; it costs quota on every decision and can be wrong. An observing agent may come later to report stalled tickets and write daily summaries, without control of the flow.
- **Supervising only failover and returns**: rejected by the user; the roles and the dispatcher are new together.
