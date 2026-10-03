# Frontend security

The security rules every frontend Stack Recipe follows, for React and Angular alike. Every check here is user experience or defense in depth: the backend enforces access on every route (ADR-0009).

## Authentication

The Template provides authentication only; authorization (roles, permissions, permission-aware UI) is added inside a Derived Project when it needs it.

- **Login** goes through the backend, whatever the method (own JWT or an external provider such as Cognito). It sets two cookies with the same lifetime and returns no user data:
  - `session`: the tokens, `httpOnly`, invisible to JavaScript;
  - `logged_in=1`: no data, no secret, readable by the frontend.
- **Route guard** (React Router loader or protected route; Angular `canMatch`): a protected route requires the `logged_in` cookie, otherwise it redirects to `/login`.
- **Session refresh**: the access token is short-lived and the refresh token rotates. The interceptor in `shared/http`, on a 401, refreshes once and retries the call; if the refresh fails it redirects to `/login`.
- **Logout** calls the backend, which clears both cookies.
- User data is never part of the session; if a project needs it, it gets its own mechanism there.

## CSRF

- Frontend and API live on the same parent domain (`app.<domain>` and `api.<domain>`), so cookies are `SameSite=Lax` and `Secure`.
- `shared/http` sends a custom header (e.g. `X-Requested-With`) on every request; the backend rejects state-changing requests without it.
- Requests send credentials (`withCredentials` / `credentials: 'include'`) to the API origin only.
- In local configuration only, cookies drop the `Secure` flag (the local API runs over plain HTTP on `localhost`); production always sets it.

## XSS

- Lint bans raw HTML injection: `dangerouslySetInnerHTML` in React, `bypassSecurityTrust*` in Angular. An exception needs an explicit, commented lint disable reviewed in the PR.
- Security headers are set on the CDN through Terraform: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
- No secrets in frontend configuration: `VITE_*` variables and `environment.ts` are public by nature. Only public values (such as the API URL) go there.
