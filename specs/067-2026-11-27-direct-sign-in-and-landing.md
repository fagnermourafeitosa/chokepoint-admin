# Specification: Direct Sign-in and Landing

- **Specification ID**: 067
- **Date**: 2026-11-27
- **Slug**: direct-sign-in-and-landing
- **Status**: In Progress
- **Owner**: Admin, authentication
- **Related Specification**: [Backend 108 — Sign-in Lands on the Admin Root](../../backend/specs/108-2026-11-27-sign-in-lands-on-admin-root.md), [004 — Login and Authorized Workspace Selection](004-2026-10-24-login-and-authorized-workspace-selection.md), [051 — Account Area](051-2026-11-11-account-area.md), [066 — Read-only Admin of the Public Demo](066-2026-11-25-public-demo-read-only-admin.md)

---

## Context & Background

Admin 004 made `/login` a page of the Admin with one button, **Continue to sign in**, that posts to the backend, which redirects to Keycloak. Admin 051 made the sign-in land on `/account/workspaces`. The site links **Sign in** to `/login` and **Sign up** to `/signup`.

The user rejected both (2026-11-27): a click on **Sign in** on the site asks again for the sign-in, and the sign-in ends on the account area instead of the Overview. The user never decided the intermediate page.

---

## Problem Statement

### 1. Sign-in needs a second click

`/login` and `/signup` show a page whose only action is the button that starts the sign-in. The visitor already chose to sign in on the site.

### 2. Sign-in ends on the account area

The backend sends the browser to `/workspaces` after the callback, and the Admin redirects `/workspaces` to `/account/workspaces`, also for a person with one workspace. A person with more than one workspace has no chosen workspace after the sign-in, and `RequireSession` sends them to the account area.

---

## Solution

1. `/login` and `/signup` start the sign-in by themselves: on load, with no session and no `error` query parameter, the page submits its form (the same top-level same-origin POST to `/api/v1/auth/login` or `/api/v1/auth/signup` of Admin 004). While the browser leaves, the page shows "Opening sign-in…".
2. With the `error` query parameter, the page does not start the sign-in. It shows the current error text and one button, **Try again**, that submits the form. This keeps a failed callback from looping between the Admin and Keycloak.
2a. When the browser comes back to `/login` with its Back button (from Keycloak), the page does not start the sign-in: it goes one more step back, to the page before it, such as the site. Without this, Back from Keycloak starts the sign-in again and the visitor cannot leave (found in the code review, 2026-11-27).
3. After the sign-in, the backend sends the browser to `/` (Backend 108). `/` opens the Overview.
4. With no chosen workspace, the Admin chooses the first workspace of the list that `GET /v1/workspaces` returns (ordered by name), and its Sandbox, as today. The user decided (2026-11-27) that any listed workspace is fine; the Admin does not remember the last one.
5. A person with no workspace goes to the first-workspace onboarding (`/onboarding/workspace`, Admin 005), as `RequireSession` does today. A person with a workspace never sees it (user, 2026-11-27). This replaces Admin 051 criterion 3, where a new account landed on the empty workspace list.
6. After a confirmed sign-out, the browser goes to the `logout_url` that the backend answers (Backend 108): the end-session page of Keycloak, which ends the Keycloak session and sends the browser to the home of the site. Another account can then sign in in the same browser. The user decided this on 2026-11-27, after the code review found that a sign-in with another account after a sign-out failed in Keycloak; it replaces the first choice, which ended only the Admin session.
7. The demo login of Backend 107 lands on `/` like everyone: the demo owner has one workspace, so the Admin opens it in its Sandbox. `DemoAccountGate` stays for `/account` paths.

---

## Practical Gains & Operational Outcomes

1. **Sign-in**:
   - *Before*: Sign in on the site, then **Continue to sign in**, then Keycloak.
   - *Now*: Sign in on the site, then Keycloak.
2. **Landing**:
   - *Before*: Account › Workspaces after each sign-in; the person picks a workspace.
   - *Now*: the Overview of the first workspace, in its Sandbox.

---

## User Stories

- [ ] 1. As a platform administrator, I want **Sign in** on the site to open the sign-in of the identity provider, so that I do not confirm twice.
- [ ] 2. As a visitor, I want **Sign up** on the site to open the registration of the identity provider, so that I do not confirm twice.
- [ ] 3. As a platform administrator with workspaces, I want to land on the Overview after the sign-in, so that I see the state of my environment at once.
- [ ] 4. As a new account with no workspace, I want to land on the first-workspace onboarding, so that I create my workspace.
- [ ] 5. As a platform administrator whose sign-in failed, I want to see the error and try again, so that the browser does not loop.
- [ ] 6. As a platform administrator, I want the sign-out to end my session and take me to the site, so that another account can sign in in the same browser.
- [ ] 7. As a visitor of the public demo, I want to land on the demo workspace in its Sandbox, so that I see the demo at once.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language
- **Context**: Admin authentication (`src/features/auth/`).
- **Package Ownership**: the login page and its action hook; the workspace choice in the authentication state; the session guard; the `/workspaces` route; the sign-out.
- **Ubiquitous Terms**: workspace, environment, Sandbox, sign-in, sign-out.

### 2. Aggregate Root & State Transitions
- **Login page**: no session and no `error` → starts the sign-in; `error` → shows the error and **Try again**; session → `/`.
- **Invariants**: the page never starts the sign-in on its own when `error` is present. The sign-in starts only by the top-level same-origin POST of Admin 004.

### 3. Commands, Queries & Domain Ports
No new API. `GET /v1/workspaces`, `GET /v1/workspaces/{id}/environments`, `POST /api/v1/auth/login`, `POST /api/v1/auth/signup` and `POST /v1/auth/logout` stay as they are.

---

## Implementation Decisions

1. The login page submits its own form once on load (a ref guards a second submit in development Strict Mode). The form, its action and the button stay, so the sign-in still works if the submit is blocked.
1a. A Back arrival is a page load whose navigation type is `back_forward`, or a page restored from the back-forward cache (`pageshow` with `persisted`).
2. The heading and text of the login page show only while the sign-in starts ("Opening sign-in…") or with the error. **Continue to sign in** and **Continue to sign up** become **Try again**, shown only with the error.
3. The authentication state chooses the first listed workspace when none is chosen, instead of only when the list has one item. The branch of `RequireSession` that sends a person with workspaces and no chosen workspace to `/account/workspaces` is removed: it can no longer happen.
4. `/workspaces` stays as a route and redirects to `/`, for old links. The backend no longer sends the sign-in there (Backend 108).
5. The sign-out reads `logout_url` from the answer of `POST /v1/auth/logout` and sets `window.location` to it. The page stays on "Signing out…" until it unloads, so `/login` never starts a new sign-in in between. The Admin needs no site origin of its own: the backend builds the address.
6. A link of a Slack message opened while signed out (Admin 059) still returns to the signal after the sign-in: `keepReturnLink` runs before the redirect to `/login`, and the return happens after the session loads, on any route.
7. The Local Functional Test of `AGENTS.md` changes with the code: step 2 no longer clicks **Continue to sign in**.

### Decided by market practice

- **No intermediate page before the identity provider** (market practice): applications that sign in only through an external identity provider send the browser straight to it, and keep an application page only for errors. Sources: [Auth0, Universal Login](https://auth0.com/docs/authenticate/login/auth0-universal-login), [Grafana, `auto_login` of the generic OAuth sign-in](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/generic-oauth/).
- **Starting the sign-in from a page that loads by itself is safe**: the callback is bound to the browser by state, nonce, PKCE and the binding cookie (Backend 003), so a sign-in started by a link cannot sign the browser into another account. Source: [OAuth 2.0 Security Best Current Practice, RFC 9700, section 4.7](https://www.rfc-editor.org/rfc/rfc9700#section-4.7).

---

## Testing Decisions

This module has no automated tests (`AGENTS.md`, Verification). The change is verified with `npm run check`, `npm run build` and the functional test.

---

## Acceptance Criteria

- [ ] 1. With no session, `/login` opens the Keycloak sign-in with no click, and `/signup` opens the Keycloak registration with no click.
- [ ] 2. `/login?error=authentication_failed` shows the error and **Try again**, and does not leave the page by itself.
- [ ] 3. After the sign-in, a person with workspaces lands on the Overview of the first listed workspace, in its Sandbox.
- [ ] 4. After the sign-in, a person with no workspace lands on `/onboarding/workspace`.
- [ ] 5. After a confirmed sign-out, Keycloak ends its session with no confirmation page and the browser opens the home of the site; a sign-in with another account then succeeds.
- [ ] 6. The demo login lands on the Overview of the demo workspace, in its Sandbox, with the read-only notice.
- [ ] 7. A link of a Slack message opened while signed out opens the signal after the sign-in.
- [ ] 8. `npm run check` and `npm run build` pass.
- [ ] 9. Functional test: [067-2026-11-27-direct-sign-in-and-landing](functional-tests/067-2026-11-27-direct-sign-in-and-landing.md).

---

## Out of Scope

- Remembering the last workspace or environment.
- The Keycloak session lifetimes and brute-force settings.

---

## Further Notes

Supersedes the login page of Admin 004 (heading, text and **Continue to sign in**) and the landing of Admin 051 (criteria 2 and 3: the sign-in lands on the account area). The account area stays reachable from the profile menu.
