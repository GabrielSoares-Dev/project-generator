# 05: Dispatcher reusable workflow

**What to build:** the deterministic dispatcher (A4, C1e) as a reusable GitHub Actions workflow plus the per-project config it reads.

**Blocked by:** 02

**Status:** done (pending the first real run)

- [x] Label transitions of B5, on issue and pull request events
- [x] Return counter (B3): the third return applies `ready-for-human` and asks for a decision summary
- [x] Supervised mode (C2): before a hand-off, comment and wait for the user's `/ok`
- [x] Failover (A1.3c, A1.3d): a scheduled check finds stalled pull requests and comments `@codex` with the role's instructions
- [x] Never applies `ready-for-agent` and never merges (D2)
- [x] Config: primary and fallback AI, stall minutes, max returns, supervised tickets left
- [x] The labels it needs, created by `agents:sync --labels` or documented for `/new-project`

## Comments

Design choices to be confirmed by the user:

- Separate trigger labels `run:<role>`: only they start Claude's scheduled tasks, so a stage on Codex does not also start Claude. Stage labels are informational.
- No state: returns are counted from the verdict comments on the pull request.
- The Dev signals "return answered" with `<!-- agent-team verdict role=dev result=ready -->`; a push alone does not restart QA, since the Dev pushes after every green test.
- Supervised mode releases a hand-off only on `/ok` from a repository admin; escalations and `ready-for-human` are never held.
- The failover check runs every 10 minutes; activity is the latest commit or comment on the pull request, so the dispatcher's own comment gives the next AI a full `stallMinutes`.
- `/ok` and verdicts count only from accounts with write access or installed apps (bots).
- Labels are created by GitHub the first time the dispatcher applies them.

Unconfirmed until the first real run: listed in `repo/dispatcher/README.md`.
