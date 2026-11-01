# 05: Dispatcher reusable workflow

**What to build:** the deterministic dispatcher (A4, C1e) as a reusable GitHub Actions workflow plus the per-project config it reads.

**Blocked by:** 02

**Status:** ready

- [ ] Label transitions of B5, on issue and pull request events
- [ ] Return counter (B3): the third return applies `ready-for-human` and asks for a decision summary
- [ ] Supervised mode (C2): before a hand-off, comment and wait for the user's `/ok`
- [ ] Failover (A1.3c, A1.3d): a scheduled check finds stalled pull requests and comments `@codex` with the role's instructions
- [ ] Never applies `ready-for-agent` and never merges (D2)
- [ ] Config: primary and fallback AI, stall minutes, max returns, supervised tickets left
- [ ] The labels it needs, created by `agents:sync --labels` or documented for `/new-project`
