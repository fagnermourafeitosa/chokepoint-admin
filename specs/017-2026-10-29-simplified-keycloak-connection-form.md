# Specification: Simplified Keycloak Connection Form

- **Specification ID**: 017
- **Date**: 2026-10-29
- **Slug**: simplified-keycloak-connection-form
- **Status**: Implemented
- **Owner**: Admin — identity provider connections
- **Related Specification**: [Backend 019 — Keycloak Directory Inference and Client List](../../backend/specs/019-2026-10-29-keycloak-directory-inference-and-client-list.md)
- **Related Specification**: [Admin 014 — Keycloak Administrative Access Warning](014-2026-10-28-keycloak-administrative-access-warning.md)
- **Related Specification**: [Admin 015 — Identity Lifecycle Sync Management](015-2026-10-28-identity-lifecycle-sync-management.md)

> Approved for implementation by the user on 2026-10-29, with the change to notices in Implementation Decision 7.

---

## Context & Background

The Keycloak connection form (`src/features/identity/IdentityConnectionForm.tsx`) has 3 sections, 8 inputs, 2 check buttons and 5 notices before the Lifecycle sync section:

- **Connection:** name.
- **Request authentication:** issuer URL, token issuing client ID, accepted audiences, **Check authentication**, a warning about the user identifier, and an information notice about what the checks verify.
- **User directory (SCIM):** a coverage warning, SCIM API URL, token endpoint, client ID, client secret, an administrative access notice, a "one user required" warning, and **Check directory access**.

Backend 019 derives the SCIM API URL and the token endpoint from the issuer, and returns the realm clients in the directory check.

---

## Problem Statement

1. The form asks for two URLs that have only one correct value.
2. The issuing client ID is typed blind, and an error shows only after a failed check.
3. Two separate checks validate one connection.
4. Five notices before the first save make the form long and hard to scan.

---

## Solution

The Keycloak form becomes:

1. **Connection** — name, issuer URL, accepted audiences.
2. **Directory access** — SCIM client ID, client secret, one **Check connection** button, and a **Token issuing client** select.
3. **Lifecycle sync** — unchanged (Admin 015).
4. **Enable connection** — unchanged.

Rules:

1. The SCIM API URL and token endpoint inputs are removed. The requests do not send them (Backend 019).
2. **Check connection** runs the authentication check, then the directory check. It shows one result: verified, or the first failure with its plain message. While it runs, the button shows "Checking…" and the form is locked.
3. The **Token issuing client** select lists the clients that the directory check returns. It is disabled until a check passes. When editing, it shows the saved value; the list loads on the next check. A change to the issuer or to the SCIM credentials clears the list and requires a new check.
4. If the check returns `clients_unavailable`, the select stays empty, and the message says to grant the service account the `view-clients` role. There is no text fallback.
5. If the list is truncated, the select shows a note that only the first 500 clients are listed.
6. Notices move into help icons (Implementation Decision 7). Only **Keycloak administrative access required** stays visible.
7. Save still requires a selected issuing client.

---

## Implementation Decisions

1. URLs derived by the backend and removed from the form (user decision, 2026-10-29).
2. Client list loaded by the check (user decision).
3. Internal Keycloak clients hidden by the backend (user decision).
4. No fallback when the list fails (user decision; module rule "No Fallbacks").
5. One check button (approved with this specification).
6. Okta and Auth0 forms are unchanged; they are not available yet.
7. Notices (user decision on approval, 2026-10-29): secondary notices move into help icons that open on hover, focus or tap, so the form stays short. This is an exception to the module rule that shows limitation warnings in the screen.
   - **What the checks verify**, **At least one user required** and **Verify the Keycloak user identifier**: one help icon next to **Check connection**.
   - **Directory coverage**: the help icon of the User directory (SCIM) heading.
   - **Delivery limitations** (Admin 015): a help icon next to the Lifecycle sync heading.
   - **Keycloak administrative access required**: stays visible, unchanged.
8. Section layout: Connection (name), Request authentication (issuer, audiences), User directory (SCIM) (client ID, secret, administrative access notice, **Check connection**, **Token issuing client**). The two existing section headings are kept to limit the change.
9. Error codes: the HTTP client keeps the backend error `code`, so `clients_unavailable` shows its own message.

---

## Testing Decisions

Following the module Testing Policy, there are no automated tests. Validation uses `npm run check`, `npm run build` and a manual check in the built-in browser against the local Backend 019 stack:

- Create a Keycloak connection with only name, issuer, audience, SCIM client ID and secret; run **Check connection**; pick the issuing client; save.
- Edit it: the saved issuing client shows; changing the secret clears the list until the next check.
- Remove `view-clients` from the service account: the check shows the plain message, and save is blocked.

---

## Acceptance Criteria

- [x] 1. The form has no SCIM API URL or token endpoint input, and saving works without them. Verified in the browser: the local Keycloak connection saved with status Verified.
- [x] 2. One **Check connection** button replaces the two checks and shows one result. Verified in the browser: "Checking…" with the form locked, then "Connection verified."
- [x] 3. The issuing client is chosen from the list; internal clients are not listed. Verified in the browser: the select was disabled before the check and then listed only `chokepoint-test-user`.
- [x] 4. Without `view-clients`, the form shows a plain message that names `view-clients` and blocks save. Verified in the browser with the role removed: the check showed the administrative-access message, the select stayed disabled, and the status showed "Not checked". A defect was found and fixed here: the status kept "Connection verified." from the previous check; a new check now clears it. The `clients_unavailable` message is verified by code inspection, because it needs a connection without a selected issuing client.
- [x] 5. Notices follow Implementation Decision 7. Verified in the browser: the help next to **Check connection** and next to **Lifecycle sync** open on hover; only the administrative access notice stays visible.
- [x] 6. Check and build pass; the browser checks above pass. Verified: `npm run check` and `npm run build` pass, and criteria 1 to 5 were checked in the browser.

---

## Out of Scope

- Okta and Auth0 forms.
- Inference of accepted audiences or of the groups claim.
- Lifecycle sync changes.
