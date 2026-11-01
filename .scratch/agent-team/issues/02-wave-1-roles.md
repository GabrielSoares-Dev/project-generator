# 02: Wave 1 roles (Dev, QA, Reviewer)

**What to build:** `roles/dev.md`, `roles/qa.md`, `roles/reviewer.md` in the neutral format, following decisions A1.2b, A1.2c, B1–B4 and D2 of `../spec.md`.

**Blocked by:** 01

**Status:** in progress

- [ ] Dev: TDD, push after every green test, handoff note, `/pr`, applies QA and Reviewer feedback, never merges
- [ ] QA: tests only against the acceptance criteria, may only add tests, approves or returns with a failing test, sends vague criteria to `needs-info`
- [ ] Reviewer: reviews against `CODING_STANDARDS.md` with a security pass, comments only, approves or requests changes
- [ ] Each role states its inputs, outputs, label transitions and what it must never do
