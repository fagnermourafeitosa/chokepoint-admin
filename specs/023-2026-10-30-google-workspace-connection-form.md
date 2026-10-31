# Specification: Google Workspace Connection Form

- **Specification ID**: 023
- **Date**: 2026-10-30
- **Slug**: google-workspace-connection-form
- **Status**: Waiting Approve
- **Owner**: Admin — Access and Integrations
- **Related Specification**: [Backend 026 — Google Workspace OIDC Integration](../../backend/specs/026-2026-10-30-google-workspace-oidc-integration.md)
- **Related Specification**: [017 — Simplified Keycloak Connection Form](017-2026-10-29-simplified-keycloak-connection-form.md)
- **Related Specification**: [022 — Admin Design System Refresh](022-2026-10-30-admin-design-system.md)

> Approved for implementation by the user on 2026-10-30. The request and response field names come from the Backend 026 implementation.

## Context & Background

The Connect identity provider screen shows one card for each provider from the backend catalog. Keycloak is available. Auth0 and Okta are not available yet. Google Workspace is a different kind of provider (an OIDC integration with a directory), so it needs its own category and its own fields.

A local preview already exists in the working tree: a Google card and a form that saves and checks nothing. It follows the design system. This specification replaces it with the real form when Backend 026 delivers the contract.

## Problem Statement

The Keycloak form asks for a client ID, a client secret and a token issuing client. A Google Workspace connection needs different data: fixed issuer, OAuth client IDs, a primary domain, a delegated administrator and a service account key. Mixing them in one form would show wrong fields and wrong help text.

## Solution

1. **Provider cards.** All cards are compact. The cards for Keycloak, Auth0 and Okta stay in the identity provider group. Google Workspace is in a second group named "OIDC integrations" (a temporary name).
2. **Unavailable cards.** A card that is not available is disabled and has no inline text. The hover and focus tooltip says "Not available yet".
3. **Google form.** Sections use the existing `identity-form-section` layout:

   | Section | Field | Rule |
   | :--- | :--- | :--- |
   | Connection | Connection name | Required, up to 80 characters |
   | Connection | Enable connection | Switch, on by default |
   | Request authentication | Issuer URL | Fixed `https://accounts.google.com`, read only |
   | Request authentication | OAuth client IDs (audiences) | List with Add and Remove, 1 to 10 values |
   | Request authentication | Primary domain | One domain. Matches the `hd` claim of the token |
   | User directory | Delegated admin e-mail | A Workspace administrator that the service account acts as |
   | User directory | Service account key (JSON) | Write-only. Shown masked after save, with a Change action |
   | User directory | Check connection | Same inline check pattern as Keycloak |

4. **Removed for Google.** The token issuing client, the client list and the lifecycle section do not apply. The lifecycle section is hidden.
5. **Setup steps.** The User directory section starts with a numbered step list, in the same pattern as the Keycloak lifecycle steps (`lifecycle-steps`, a step bubble, a title and an explanation). The steps are the setup that Backend 026 requires, in order: a Google Cloud project with the Admin SDK API enabled, a service account with a JSON key, and domain-wide delegation. For the delegation, in the Google Admin console, a Super Admin authorizes the service account client ID with the scope `https://www.googleapis.com/auth/admin.directory.user.readonly`. A change can take up to 24 hours. Steps 1 to 3 each link to the official Google guide in a new tab: [enable APIs](https://developers.google.com/workspace/guides/enable-apis), [create a service account and key](https://developers.google.com/workspace/guides/create-credentials#service-account) and [domain-wide delegation](https://knowledge.workspace.google.com/admin/apps/control-api-access-with-domain-wide-delegation).

## Temporary Implementation Warnings

Show a warning near the Check connection action with `cp-admin-notice identity-mapping-warning` and a `TriangleAlert` icon until the real-Workspace evidence of Backend 026 Open Decision 3 is recorded: the connection check does not prove that the token subject equals the directory user ID. Remove the warning when the proof is recorded.

A second warning at the top of the form, above the Connection section, states plainly that user synchronization is not supported (Backend 026 Out of Scope and Resolved Decision B): Chokepoint does not receive Google user changes, a user who is suspended or deleted in Google keeps access until the access token expires, and the user list is read only when the administrator opens it. It is the first thing the administrator reads. Remove it when synchronization exists.

In the edit form, a warning near the User directory fields states: if you change the service account key or the delegated administrator to another Google organization, the people associated before belong to the previous organization and lose access. Chokepoint does not block the change (Backend 026 Implementation Decision 5). The warning shows only when editing a saved connection.

The OAuth client IDs help states that the ID token of the signed-in user is the request credential (Backend 026 Resolved Decision D), and recommends a client ID used only for Chokepoint. It is a recommendation, not a requirement: any client ID of the customer works.

The Primary domain help also states that the customer's Google OAuth client must send the `hd` parameter in its sign-in request. Without it Google omits the claim and Chokepoint rejects the token.

## User Stories

- [x] 1. As an administrator, I see Google Workspace in its own category and I can start a connection. — evidence: live
- [x] 2. As an administrator, I see Auth0 and Okta as disabled, with "Not available yet" on hover. — evidence: live
- [x] 3. As an administrator, I fill only the fields that Google needs, and I understand each one from its help text. — evidence: live
- [x] 4. As an administrator, I cannot read a stored service account key again. — evidence: code inspection; a Google connection cannot be saved without a Workspace

## Architecture Gate

- Admin owns the form, local state and presentation. Backend 026 owns validation, key storage and the Google protocol.
- The Admin does not call Google. It does not parse the key JSON for use. It may check that the pasted value is JSON to give an early message.
- Keep the feature in `src/features/identity/`: `GoogleConnectionForm.tsx` for the form, the shared provider choice in `IdentityConnectionForm.tsx`. Split a file that nears 300 lines.
- No fallbacks: when the backend catalog lists Google, the local card definition is removed.

## Implementation Decisions

1. Reuse `docs/design-system/styles/index.css`, the `cp-admin-*` classes and the `identity-*` classes. No new visual tokens.
2. The key field is a text area with the mono font. A JSON file picker may fill it, as the design system gallery shows.
3. Use native form validation, like the Keycloak form.
4. Error text for the Google check comes from a safe message map. No raw provider text reaches the screen.
5. The exact API shape waits for Backend 026. Do not invent field names before it exists.

## Verification

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build` when the user says the screen is ready. The user runs the interface test in the browser: card groups, disabled cards with tooltip, form sections, key masking after save, and the narrow-screen layout.

## Acceptance Criteria

- [ ] 1. All provider cards are compact; Google is in its own group.
- [ ] 2. Unavailable cards are disabled and show the tooltip on hover and focus.
- [ ] 3. The Google form has the fields in the table above and no Keycloak-only field.
- [ ] 4. The stored key is never shown; replacing it needs an explicit Change action.
- [x] 5. The temporary warning shows until the real-Workspace evidence of Backend 026 Open Decision 3 is recorded. — evidence: live; the warning stays because the Workspace evidence is excluded
- [x] 6. The warning that user synchronization is not supported shows at the top of the form until synchronization exists. — evidence: live
- [x] 7. In the edit form, the warning about a change to another Google organization shows near the User directory fields. — evidence: code inspection, same reason as 4
- [x] 8. The Keycloak form behaves as before. — evidence: live edit form
- [x] 9. `npm run check` and `npm run build` pass.
- [ ] 10. The user confirms the interface test. — waiting for the user

## Out of Scope

Groups, lifecycle controls for Google, People selection changes, SAML, the final name of the category.

## Further Notes

The category name "OIDC integrations" is temporary. A rename is a one-line change.
