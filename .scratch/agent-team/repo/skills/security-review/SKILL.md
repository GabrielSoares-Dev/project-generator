---
name: security-review
description: Review a diff for security problems (secrets, authentication and authorisation, injection, unsafe input, personal data). Use as part of every pull request review.
---

Read the diff and the code it calls. Report each finding with the file and line, the risk, and the fix. A finding is blocking when it can be exploited or leaks data; otherwise it is a suggestion.

## Checklist

- **Secrets**: keys, tokens, passwords or connection strings in code, tests, fixtures, logs or config committed to the repository.
- **Authentication**: every new endpoint or route states who may call it; nothing new is public by accident.
- **Authorisation**: a user can only read or change their own data; identifiers from the request are checked against the session, not trusted.
- **Injection**: queries built from strings, shell commands with request data, unescaped output in HTML, template injection.
- **Input**: request bodies, headers, files and query strings validated at the boundary; sizes and types limited; uploads checked.
- **Personal data**: never logged; returned only when needed; deletion and export still work when new personal data is stored.
- **Dependencies**: new packages are maintained and needed; no copy-pasted code from unknown sources.
- **Errors**: error responses reveal no stack traces, queries or internal identifiers.

The project's ADRs and `docs/conventions.md` override this list where they are stricter.
