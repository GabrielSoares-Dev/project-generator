# No Backend-for-Frontend by default

A Derived Project's frontend is a single-page app that calls its backend directly; authentication uses an `httpOnly` cookie set by the backend, so tokens never live in browser storage. A BFF layer was considered and rejected as a default: with one backend serving one frontend it would only relay calls, while adding a third repository per project with its own recipe, CI, deploy, latency and failure surface. Because the backend already exposes a clean API contract, a BFF can be added later without touching the backend, so the decision is cheap to revisit.

## Consequences

- When a project needs server-side rendering, React switches React Router from SPA mode to **framework mode** (the router is already in place, so routes and components carry over with no rewrite), and Angular adds `@angular/ssr`. Next.js is rejected as the default: it imposes its own `app/` folder structure and leans toward Vercel-specific hosting, against ADR-0002; it stays available only if a client demands it.
- The decision guide offers a BFF (or the SSR mode above) only when a project gains a second client (e.g. a mobile app), aggregates several backends, needs to hide third-party API keys, or needs server-side rendering.
