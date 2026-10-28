# Specification: Keycloak Administrative Access Warning

- **Specification ID**: 014
- **Date**: 2026-10-28
- **Status**: Implemented
- **Related Specification**: [Backend 015 — SCIM User Directory](../../backend/specs/015-2026-10-28-scim-user-directory.md)

The user requests a warning near the Keycloak service-client credentials and directs implementation of association-time checks. The form collects the token-issuing client ID and explains the service-account permissions required to view the client and selected users. The directory check checks SCIM and client access; user access and the identity mapping are checked for new associations. It must not claim that an example token verifies a real login or detects later mapper changes. Reuse the existing warning style on create and edit.

The user further requires creation and enabled-connection saves to fail when the required access cannot be verified. The check must evaluate an actual directory user, and an empty directory cannot establish this access. Show the actionable error alongside the Keycloak credentials and name `realm-management` roles `view-users` and `view-clients` or equivalent permissions.

Use a blue information notice with an information icon for the explanation of checks and the required administrative permissions. Keep the empty-directory limitation in a separate warning, and retain warning styling for identity-mapping, directory-coverage and lifecycle risks.

The user also requests consistent integration navigation: Enterprise MCPs, Custom MCPs and Identity providers remain visible when Identity providers is selected. Preserve their existing destinations and selected states.

## Acceptance Criteria

- [x] The Keycloak form explains the additional administrative permissions and the current verification limitation. Verified by inspecting the create/edit form implementation.
- [x] The applicable Admin type and build checks pass. `npm run check` and `npm run build` passed.
- [x] The issuing-client field and association check are verified end to end with the backend and a suitably permissioned real Keycloak service account. In the local fixture, the connection was saved, an association was saved and published, and the original associations were restored. Missing `view-users` and `view-clients` each prevented saving and displayed an alert.

The user approved the reviewed result and requested publication on 2026-10-28. The integration navigation was checked in the browser and the Admin type check and build passed. Backend 015 remains in progress for its broader acceptance criteria and the documented mapping limitations.
