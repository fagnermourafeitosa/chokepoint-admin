# Specification: Keycloak Authentication Experience

- **Specification ID**: 011
- **Date**: 2026-10-28
- **Status**: In Progress
- **Owner**: Admin authentication experience and platform Keycloak theme
- **Related specifications**: [Admin 004 — Login](004-2026-10-24-login-and-authorized-workspace-selection.md), [Admin 005 — Onboarding](005-2026-10-24-first-workspace-onboarding.md), [Frontend 002 — Public Sign-in and Signup](../../frontend/specs/002-2026-10-24-public-signin-and-signup.md), [Backend 003 — Login](../../backend/specs/003-2026-10-24-admin-login-and-workspace-access.md), [Backend 004 — Signup](../../backend/specs/004-2026-10-24-public-signup-and-workspace-bootstrap.md)

> The user selected the public home design for the Keycloak login and registration pages. The current navigation and authentication flow remain unchanged.

## Problem

The custom Keycloak pages do not consistently match the desired Chokepoint design system. Public sign-in and signup currently leave the home for Admin entry routes and then use Keycloak-hosted authentication. The user wants to understand whether this experience can start or remain in a modal on the public home.

## Existing boundaries

The public site links to Admin sign-in and signup. Admin initiates the backend-owned OIDC flow. Keycloak handles credentials, verified email, password setup and MFA. The backend owns the OIDC exchange and application session. The local Keycloak theme is under `dev-infra/idps/keycloak/themes/chokepoint`; that directory is local infrastructure, not the Admin repository.

## Scope

- Apply the public home visual identity to Admin sign-in and signup entry pages and Keycloak login, registration and one-time-code verification, including controls, focus and validation states.
- Preserve provider-owned credential handling, backend OIDC, verified email, MFA and the existing same-tab navigation.
- Keep other provider pages and authentication behavior outside this visual change.
- Verify login and registration presentation and form behavior at practical viewport sizes.
- The local Keycloak theme is unversioned development infrastructure; document this limit explicitly.

## Acceptance criteria

- [x] The public home design is applied to Keycloak login and registration.
- [ ] Existing sign-in and signup form actions and navigation remain unchanged.
- [ ] Existing localization remains intact.
- [ ] The established backend OIDC, session and onboarding contracts remain intact, except for explicitly approved changes.
- [ ] Keyboard access, focus, errors and responsive layouts are verified.
- [ ] The implementation and deployment location for the Keycloak theme is documented; local fixtures are not represented as a production deployment.

## Out of scope

Changing customer identity providers, implementing a password grant or custom credential API, and redesigning authenticated Admin screens.

## Verification so far

The local Keycloak login and registration pages rendered with the selected theme in the in-app browser. Existing form templates and their actions were preserved. The Admin and backend services were not available for an end-to-end session or signup check, so the remaining criteria stay open. The Keycloak theme is in unversioned local infrastructure.
