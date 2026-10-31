# Specification: Service Principal Selection

- **Specification ID**: 024
- **Date**: 2026-10-30
- **Slug**: service-principal-selection
- **Status**: Waiting Approve
- **Owner**: Admin — Access and Permissions
- **Related Specification**: [Backend 027 — Service Principals](../../backend/specs/027-2026-10-30-service-principals.md)
- **Related Specification**: [012 — SCIM People Selection](012-2026-10-28-scim-people-selection.md)
- **Related Specification**: [023 — Google Workspace Connection Form](023-2026-10-30-google-workspace-connection-form.md)

> Approved for implementation by the user on 2026-10-30. The API field names come from the Backend 027 implementation.

## Context & Background

A permission group ("agent") holds people selected from the provider directory. The main customer use case is a microservice that runs agents and calls MCP tools by itself. Backend 027 makes that microservice a member (a service principal), identified by issuer and subject, like a person. The Admin must let an administrator select it.

## Problem Statement

The People selection lists only directory users. A Keycloak client or a Google service account cannot be selected, so a microservice cannot receive a grant.

## Solution

1. **One selection, two kinds.** The member picker has two views for the selected provider, People and Services. Each row shows its kind as a chip with text, not only an icon or a color. The kinds are named "People" and "Services" (Backend 027 Resolved Decision B).
2. **Keycloak.** Services come from the backend list (clients with service accounts on). The row shows the client ID.
3. **Google.** Moved to [Admin 025 — Google Service Account Registration](025-2026-10-30-google-service-account-registration.md) on 2026-10-30, with Backend 028.
4. **Group detail.** Members list people and services together. Each member shows its kind as a chip, "Person" or "Service", from the `kind` that Backend 027 Resolved Decision D stores on the member. The picker rows show the same chip. A member saved without a kind is not accepted; there is no fallback label.
5. **Selection per view.** Switching between People and Services clears the selection, so one view never associates what the other view selected.
6. **Members without a kind.** A saved member that has no kind (a draft from before the kind existed) shows no chip. A warning near the group list says that the member must be selected again and that the draft cannot be saved until then. The warning informs; it does not block. There is no fallback label.
7. **Service names in the group list.** For each connection that has service members, the Admin reads the service list of that connection and shows the service name next to the member. When the name cannot be read, the member shows its subject only.
8. **People pagination follows the cursor contract.** Backend 026 Resolved Decision G replaces `start` and `next_start` with an opaque cursor, and the total can be null. The People list sends `cursor`, keeps a stack of the cursors it has seen for Previous, and shows "N users" when the total is known and "N users on this page" when it is not.
9. **Services error.** A provider without a service list answers HTTP 501; the Admin shows "This identity provider does not list services" from the status, not from error text.
10. **Help text.** A service acts by itself with its own token (client credentials in Keycloak, a service account ID token in Google). An application ID in the decision trace is not a member and grants nothing.

## User Stories

- [x] 1. As an administrator, I can find a customer microservice and add it to a permission group. — evidence: live
- [x] 2. As an administrator, I can tell people and services apart, by a chip, in the picker and in the group. — evidence: live, after reload

## Architecture Gate

- Admin owns the picker, local state and labels. Backend 027 owns listing, registration and verification.
- Keep the code in the existing People and identity feature folders. Split a file that nears 300 lines.
- Reuse the design system classes. No new tokens.
- Do not invent API fields before Backend 027 defines them.

## Verification

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build` when the user says the screen is ready. The user runs the interface test.

## Acceptance Criteria

- [ ] 1. Services appear in the picker with a kind chip.
- [ ] 2. A selected service is saved as a member with kind `service` and appears in the group with its chip. A selected person is saved with kind `person`.
- [x] 4. People selection behaves as before. — evidence: live
- [ ] 4b. People pagination works with the cursor, for a provider with a total and for one without. — partly met: one page with a total (Keycloak) seen live; several pages and a null total not exercised
- [x] 4a. Switching views clears the selection; a member without a kind shows the warning; a service member shows its name when the list can be read. — evidence: service names live; view switch and the untyped warning by code inspection
- [x] 5. `npm run check` and `npm run build` pass.
- [ ] 6. The user confirms the interface test. — waiting for the user

## Out of Scope

Token exchange, roles and scopes, agentic coding clients.
