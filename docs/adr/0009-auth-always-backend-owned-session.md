# Every project has authentication, owned by the backend behind one session contract

Every Derived Project has authentication; the method is chosen per project through the decision guide (the Template's own JWT and users implementation, or an external provider such as Cognito, Firebase Auth, Auth0 or Clerk). Whatever the method, the backend owns the login: with an external provider it runs the OAuth flow server-side and ends by issuing the same `httpOnly` session cookie, so the provider is an `infra` adapter behind `AuthServiceInterface` and switching providers touches only that adapter. The frontend therefore has one auth contract for every project, and the token never reaches JavaScript.

The Template provides **authentication only**. Authorization (roles, permissions, permission-aware UI) is not part of the Template and is implemented inside a Derived Project when it needs it. Login sets the session cookie and returns no user data; the frontend learns only whether a session is valid, and user data, if ever needed, gets its own mechanism in that project.

## Considered Options

- **Provider SDKs in the frontend**: rejected; frontend auth code would differ per project and tokens would live in the browser.

## Consequences

- Frontend security answers (session discovery, route guards, refresh, CSRF) are the same for every Derived Project and live in `recipes/frontend/security.md`.
- Frontend checks are user experience only; the backend enforces access on every route.
- Login sets two cookies with the same lifetime: `session` (the token, `httpOnly`, invisible to JavaScript) and `logged_in=1` (no data, no secret, readable by the frontend). The route guard only checks that `logged_in` exists; logout and expiry remove both together, and a token revoked early surfaces as a 401 that the interceptor turns into a redirect to `/login`. No session endpoint is needed.
- Sessions use a short-lived access token (minutes) plus a rotating refresh token (days), both `httpOnly` cookies; `logged_in` lives as long as the refresh token. On a 401 the frontend interceptor refreshes once and retries the call; if the refresh fails it redirects to `/login`. With the Template's own implementation the backend issues both tokens; with an external provider (Cognito, Auth0, …) the provider issues them and the backend only stores them in the same cookies and refreshes them through the provider, so the cookie contract never changes.
- Frontend and API share a parent domain (`app.<domain>` and `api.<domain>`, set up in Terraform), so cookies are `SameSite=Lax` and `Secure`; on top of that, the backend requires a custom header (e.g. `X-Requested-With`) on every state-changing request as CSRF defense.
- **Mobile apps** (ADR-0012) get the same session in a different envelope: the browser's cookie protections (`httpOnly`, `SameSite`) do not apply to native apps, so on login the backend returns the access and refresh tokens in the response body when the client identifies itself as mobile (`X-Client: mobile`), and the app stores them in Expo SecureStore (iOS Keychain / Android Keystore) and sends `Authorization: Bearer`. Lifetimes and rotation are the same. The rule "tokens never reach JavaScript" applies to the browser.
- CORS allows only the project's frontend origin (`https://app.<domain>`), read from `CORS_ALLOWED_ORIGINS`, with credentials enabled for the cookies; `http://localhost:<port>` only in local configuration. Never `*` (browsers also reject `*` with credentials).
- With the Template's own implementation: passwords hashed with **Argon2id** (or BCrypt), never SHA or MD5; JWTs signed with an asymmetric key (RS256 / ES256) or HS256 with a long secret from the secret manager (ADR-0010); access token **15 minutes**, rotating refresh token **7 days**, stored **hashed** in the database so logout can revoke it; login attempts rate-limited with Redis-backed counters.
- The Template's own JWT implementation drops the boilerplate's roles and permissions (RBAC); it keeps login, session and protected routes.
