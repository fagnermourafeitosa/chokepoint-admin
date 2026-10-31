# Specification: Remove Lifecycle Sync Screen and Google Warnings

- **Specification ID**: 028
- **Date**: 2026-10-31
- **Slug**: remove-lifecycle-sync-screen-and-google-warnings
- **Status**: Not Implemented
- **Owner**: Admin — Integrations and Permissions
- **Supersedes**: [015 — Identity Lifecycle Sync Management](015-2026-10-28-identity-lifecycle-sync-management.md) (all), [023 — Google Workspace Connection Form](023-2026-10-30-google-workspace-connection-form.md) (acceptance item 6 and the "Not verified with a real Google Workspace" warning), [012 — SCIM People Selection](012-2026-10-28-scim-people-selection.md) (the lifecycle state of associated users), [020 — Investigate Problems and Decisions](020-2026-10-29-investigate-problems-and-decisions.md) (the `user_disabled` reason only)
- **Related Specification**: [Backend 036 — Remove Identity Lifecycle Synchronization and SCIM Directory Reads](../../backend/specs/036-2026-10-31-remove-identity-lifecycle-sync-and-scim-read.md), [Backend 034 — Decision Trace with Actor and Relations](../../backend/specs/034-2026-10-31-decision-trace-actor-and-relations.md)

---

## Context & Background

Backend 036 removes lifecycle synchronization and the SCIM directory read. The lifecycle routes and the lifecycle-users lookup go away, and the decision trace loses the `user_disabled` reason. A user disabled in the identity provider loses access when the token exchange at the AS fails (Backend 030); Backend 034 raises the signal.

The Admin still shows what the removed backend did:

- **Identity connection form (Keycloak):** the "Auto sync users" section (`LifecycleSyncSection.tsx`, `useLifecycleSync.ts`) and help texts that mention the SCIM ID.
- **Google connection form:** the warning "User synchronization is not supported" at the top, and the warning "Not verified with a real Google Workspace".
- **People editor:** the warning "Access follows lifecycle events" and the lifecycle state of each associated user (active, disabled, deleted).
- **Investigate:** the reason label `user_disabled`.

---

## Problem Statement

### 1. Screens for a removed capability

The Auto sync section calls routes that no longer exist. The people editor reads a lookup that no longer exists and shows a state that no longer has a source.

### 2. Warnings that describe the old model

The Google warning says that synchronization is not supported, as if it were missing. Synchronization is not part of the product for any provider. The "Not verified" warning is removed by decision of the user on 2026-10-31.

---

## Solution

1. **Identity connection form.** Remove `LifecycleSyncSection.tsx`, `useLifecycleSync.ts`, the secret leave guard and `secretLeaveMessage` in `IdentityConnectionForm.tsx`. Rewrite the help texts that say "SCIM ID" to say "user ID".
2. **API client (`identity/api.ts`).** Remove `lifecycleApi`, `lifecycleKey`, `LifecycleConfiguration`, `LifecycleUserState`, `identityApi.lifecycleUsers` and the `lifecycle` field of `ProviderCapability`.
3. **Google connection form.** Remove the warnings "User synchronization is not supported" and "Not verified with a real Google Workspace". The warning "Changing the Google organization" stays.
4. **People editor.** Remove the warning "Access follows lifecycle events", the lifecycle lookup and the lifecycle status of associated users. The warning "Some members have no type" stays.
5. **Investigate.** Remove `user_disabled` from the reason labels.
6. Remove the CSS that only these elements use.

---

## Practical Gains & Operational Outcomes

1. **No dead screens:**
   - *Before*: the Admin offers Auto sync and shows lifecycle state.
   - *Now*: the Admin shows only what the backend does.
2. **Accurate copy:**
   - *Before*: the Google form warns that synchronization is missing.
   - *Now*: no warning about a capability the product does not have.

---

## User Stories

- [ ] 1. As an administrator, I configure a Keycloak connection without an Auto sync section.
- [ ] 2. As an administrator, I configure a Google connection without the two removed warnings.
- [ ] 3. As an administrator, I see associated users without a lifecycle state.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language
- **Context**: Admin identity integrations and permissions.
- **Package Ownership**: `src/features/identity`, `src/features/permissions/PeopleEditor.tsx`, `src/features/investigate/types.ts`.

### 2. Invariants
- The Admin calls no lifecycle route.
- Directory selection, search and paging are unchanged.

---

## Implementation Decisions

1. **Remove, not hide.** The components, hooks and types go away. Not chosen: hiding them behind a flag.
2. **Copy says "user ID".** The directory read is no longer SCIM, but the token `sub` still matches the Keycloak user ID.

---

## Testing Decisions

- Unit tests of the forms and the people editor no longer reference lifecycle state; tests for the removed parts are deleted.
- `npm run check` and `npm run build` pass.
- The user runs the interface check in the Admin: Keycloak form, Google form, people editor and Investigate.

---

## Acceptance Criteria

- [ ] 1. No Auto sync section, lifecycle API call or lifecycle type remains.
- [ ] 2. The Google form shows neither removed warning; "Changing the Google organization" still shows when editing.
- [ ] 3. The people editor shows no lifecycle warning or state.
- [ ] 4. Investigate has no `user_disabled` label.
- [ ] 5. `npm run check` and `npm run build` pass.

---

## Out of Scope

- The agent delegation editor (026).
- The Inbox view of the token exchange signal (Backend 034); a separate specification.
- The Okta form (Backend 017).
