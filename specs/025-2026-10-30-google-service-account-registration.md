# Specification: Google Service Account Registration

- **Specification ID**: 025
- **Date**: 2026-10-30
- **Slug**: google-service-account-registration
- **Status**: Proposed
- **Owner**: Admin — Access and Permissions
- **Related Specification**: [Backend 028 — Google Service Account Principals](../../backend/specs/028-2026-10-30-google-service-account-principals.md)
- **Related Specification**: [024 — Service Principal Selection](024-2026-10-30-service-principal-selection.md)

> **On hold for Backend 028.** Split from Admin 024 on 2026-10-30.

## Solution (draft)

1. In the Services view of a Google connection, a small form registers a service account by e-mail and unique ID, copied from the Google Cloud console. The unique ID is the member subject; the e-mail is shown only.
2. Help text says where to copy both values and that Chokepoint cannot check the account before its first call.
3. The Google connection form shows the service audiences of Backend 028 Open Decision 1, when it is answered.

## Acceptance Criteria

- [ ] 1. A Google service account is registered by e-mail and unique ID; the e-mail is shown, the unique ID is the member subject.
- [ ] 2. `npm run check` and `npm run build` pass.
- [ ] 3. The user confirms the interface test.
