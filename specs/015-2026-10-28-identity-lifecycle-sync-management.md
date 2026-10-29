# Specification: Identity Lifecycle Sync Management

- **Specification ID**: 015
- **Date**: 2026-10-28
- **Slug**: identity-lifecycle-sync-management
- **Status**: Implemented
- **Owner**: Admin — identity provider connections
- **Related Specification**: [Backend 016 — IdP Lifecycle Synchronization and Outbound Webhooks](../../backend/specs/016-2026-10-28-idp-lifecycle-sync-and-webhooks.md)
- **Related Specification**: [Admin 014 — Keycloak Administrative Access Warning](014-2026-10-28-keycloak-administrative-access-warning.md)
- **Related Specification**: [Admin 012 — SCIM People Selection](012-2026-10-28-scim-people-selection.md)

> Approved for implementation by the user on 2026-10-28.

---

## Context & Background

Backend 016 adds a Keycloak lifecycle receiver: the Phase Two `keycloak-events` plugin delivers signed user events, and the backend applies them to retained lifecycle users. The backend exposes management under the scoped identity-connection route: `GET`, `POST` and `DELETE /lifecycle`, `POST /lifecycle/rotate-secret` and `POST /lifecycle/complete-rotation`. The receiver was verified functionally with these calls made from the browser console, because the admin has no screen for them.

The Keycloak connection is edited in the identity connection form, which already shows the directory credentials and the Admin 014 permission notices.

---

## Problem Statement

### 1. No way to configure lifecycle delivery

An administrator cannot create a receiver, read its URL, receive its secret, rotate it or remove it without calling the API by hand.

### 2. The secret is shown only once

The backend returns the generated secret only in the create and rotate responses. If the administrator leaves the screen before copying it, the only recovery is another rotation.

### 3. Completing a rotation can lose events

Observed in Backend 016: the provider retries for up to 15 minutes and does not re-sign pending retries after the secret changes. If the administrator completes the rotation before the provider delivers with the new secret, or while retries signed with the previous secret may still arrive, those events are lost. The backend now reports `previous_secret_last_accepted_at` and `current_secret_first_accepted_at` during a rotation.

### 4. Known delivery limitations are not visible

Events are lost when the Chokepoint API is not reachable or when Keycloak restarts during retries. There is no periodic reconciliation. The provider subscription is configured manually in Keycloak.

---

## Solution

1. Add a **Lifecycle sync** section to the identity connection form, below the directory credentials. Show it only for a saved, enabled Keycloak connection with directory settings. Other providers and unsaved connections do not show it.
2. Without a receiver, the section explains the feature and offers **Enable lifecycle sync** (`POST /lifecycle`).
3. With a receiver, the section shows the receiver URL (copyable), enabled state, last committed delivery, last failure time and failure code, and the actions **Rotate secret**, **Complete rotation** (only during a rotation) and **Remove** (`DELETE /lifecycle`, with confirmation that the provider configuration stops working).
4. After create or rotate, show an inline **secret panel** with the receiver URL, the secret and a ready Phase Two subscription body (`enabled`, `url`, `secret`, and the supported `eventTypes`), each with a copy action. The panel closes only after the administrator checks **I have copied the secret**. Leaving the form, or closing the panel otherwise, asks for confirmation because the secret cannot be shown again.
5. During a rotation, always show both rotation evidence times. **Complete rotation** opens a confirmation when either risk applies: no delivery has been accepted with the new secret, or a delivery with the previous secret was accepted less than 15 minutes ago. The confirmation states what can be lost. The administrator may complete anyway. Without risk, completion runs directly.
6. Show one temporary warning (`cp-admin-notice`, warning tokens, `TriangleAlert`) at the top of the section: events are lost if Chokepoint is unreachable or Keycloak restarts during retries; there is no periodic reconciliation; the subscription must be created in Keycloak with the values shown. Record these limitations here and in Backend 016.
7. Map backend errors to plain messages: 409 on enable (already configured) or rotate (rotation in progress) reloads the state and explains it; 404 reloads the state; other failures show a retryable error. Never show raw error text.

---

## User Stories

- [x] 1. As an administrator, I want to enable lifecycle sync from the Keycloak connection, so that I do not call the API by hand.
- [x] 2. As an administrator, I want the URL, secret and a ready subscription body with copy actions, so that I configure Keycloak correctly with the supported event types.
- [x] 3. As an administrator, I want to be stopped from losing the one-time secret by accident, so that I do not need an unplanned rotation.
- [x] 4. As an administrator, I want to see the last delivery and the last failure, so that I know whether delivery works.
- [x] 5. As an administrator, I want to rotate the secret and see which secret Keycloak uses, so that I complete the rotation without losing events.
- [x] 6. As an administrator, I want a warning before completing a risky rotation, so that I can wait or accept the loss knowingly.
- [x] 7. As an administrator, I want to remove the receiver with a clear consequence, so that I do not disable delivery by mistake.
- [x] 8. As an administrator, I want the delivery limitations stated near the configuration, so that I do not assume a guarantee that does not exist.

---

## Implementation Decisions

1. Location: a section of the existing identity connection form (user decision). No new route or navigation.
2. Secret: inline panel that requires an explicit copy acknowledgement before it closes; leaving with an open panel asks for confirmation (user decision).
3. Rotation completion: non-blocking confirmation driven by backend evidence; the 15-minute window is the provider's maximum retry window observed in Backend 016 (user decision).
4. Limitations: one temporary warning at the top of the section (user decision), following the module's warning rule.
5. Data: a lifecycle API module and hook in the identity feature call the five backend endpoints with the existing session and CSRF handling. The section reads state with `GET /lifecycle` and refreshes after each action.
6. Subscription body: the supported event types are fixed in the admin to the list in Backend 016 (`access.REGISTER`, `access.UPDATE_PROFILE`, `access.UPDATE_EMAIL`, `access.DELETE_ACCOUNT`, `admin.USER-CREATE`, `admin.USER-UPDATE`, `admin.USER-DELETE`). The admin shows the receiver URL as returned; it explains that a Keycloak container may need the host name it uses to reach Chokepoint.
7. Visual design follows the module design system and the Impeccable skill; reuse the existing warning, information notice, button and dialog components.

8. Session refresh (defect found during the functional test, fix approved by the user on 2026-10-28): the protected route showed its status screen whenever the session query refetched, including the refetch on window focus. This unmounted every page, discarded unsaved edits, and discarded the one-time secret. The route now shows the status screen only while the session loads for the first time. A background refetch keeps the page; a refetch that ends without a session still leads to sign-in, and a different user still clears private data.

9. Leave guard (review finding, fix approved by the user on 2026-10-29): while the secret is shown, a capture-phase click listener asks before any app link navigates, and `beforeunload` warns before a reload or tab close. React Router `Link` does not navigate when the click is already prevented.

10. Feedback (user request on 2026-10-29): each successful action shows a status message in the section (enabled, new secret created, rotation completed, receiver removed). Copy shows "Copied" for 3 seconds, or "Copy failed. Select the value and copy it manually." when the clipboard is unavailable or refuses. Both results are announced to screen readers, and each click restarts the 3-second display. While a request runs, its button is disabled and names the work: "Enabling…", "Rotating…", "Completing…", "Removing…", "Checking…" for both connection checks; Copy is disabled while it writes. Verified in the browser for "Check directory access". Saving the connection already shows "Identity connection saved." in the registry.

---

## Testing Decisions

Following the module Testing Policy, this module has no automated tests. Validation uses the type check, the build and manual checks in the built-in browser.

### Functional Test (built-in browser)
- Against the local stack of Backend 016: enable, copy values into the Keycloak subscription, make a change in Keycloak and see the last delivery update; rotate, observe evidence and the confirmation; complete; remove.
- With the secret shown, an app link asks for confirmation; after Done, it navigates without a question.
- Copy shows its result.

### Regression
- `npm run check` and `npm run build` pass; existing identity form behavior is unchanged.

---

## Acceptance Criteria

- [x] 1. The section appears only for a saved, enabled Keycloak connection with directory settings. Verified by code inspection (`LifecycleSyncSection` returns nothing for other providers, disabled or directory-less connections) and in the browser for the Keycloak connection.
- [x] 2. Enable, rotate, complete and remove work against the backend and refresh the section. Verified in the built-in browser against the local Backend 016 stack: last delivery updated after a Keycloak change on the new receiver.
- [x] 3. The secret panel shows URL, secret and subscription body with copy actions and cannot be dismissed accidentally. Verified: values, exact event types, Done disabled until acknowledgement (browser), and the panel survives a window focus change (browser, after the session refresh fix). Leaving through an app link while the secret is shown asks for confirmation: in the browser, a click on Overview called the confirmation with the secret message, the refusal kept the page and the secret, and after Done the same click navigated without a question. The accept path and the reload warning are verified by code inspection only, because the built-in browser suppresses native dialogs and answers them with a refusal. Modified clicks and new-tab links do not ask, because they keep the page open. Cancel and Back use the same message. The browser history buttons are not guarded, because BrowserRouter has no navigation blocker.
- [x] 4. Rotation evidence is shown, and the risky-completion confirmation follows the stated rule. Verified in the browser (confirmation with no new-secret delivery; direct completion after a new-secret delivery).
- [x] 5. The limitation warning is present and recorded in this specification and Backend 016.
- [x] 6. The functional browser test passes; check and build pass. Verified: `npm run check` and `npm run build` pass, and the browser checks are recorded in criteria 2 to 4 and in the Copy check ("Copied" shown after a click on Copy).

---

## Out of Scope

- Automatic creation of the Keycloak subscription.
- Agent association display of retained lifecycle users (Backend 016, separate work) and the removal of the People "not synchronized" warning that depends on it.
- Auth0 and Okta lifecycle.
- Periodic reconciliation.

---

## Further Notes

The People editor warning "User lifecycle changes are not synchronized yet" stays until associations read retained lifecycle state; this screen does not change it.
