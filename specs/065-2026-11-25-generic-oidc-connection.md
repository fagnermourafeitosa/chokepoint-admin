# Specification: Generic OIDC Connection

- **Specification ID**: 065
- **Date**: 2026-11-25
- **Slug**: generic-oidc-connection
- **Status**: In Progress
- **Owner**: Admin — Access and Integrations
- **Related Specification**: [Backend 106 — Generic OIDC Connection](../../backend/specs/106-2026-11-25-generic-oidc-connection.md)
- **Related Specification**: [043 — Okta Connection Form](043-2026-11-05-okta-connection-form.md)
- **Related Specification**: [036 — Interactive Harness Access](036-2026-11-03-interactive-harness-access.md)
- **Related Specification**: [026 — Agent Delegation Editor](026-2026-10-31-agent-delegation-editor.md)
- **Related Specification**: [061 — Inbox Categories](061-2026-11-16-inbox-categories.md)

> Layout approved by the user on the prototype on 2026-11-25. Grilling recorded in Backend 106, Resolved Decisions. Specification approved by the user on 2026-11-25.

## Context & Background

The Connect identity provider screen shows one card for each provider of the backend catalog: Keycloak, Microsoft Entra ID and Okta, then Google Workspace under OIDC integrations. Each card opens its own form, and every provider reads a directory.

Backend 106 adds the provider `oidc`, Generic OIDC: any OpenID Connect provider with asymmetric signatures, without a directory. A person exists after the first harness login or token exchange, groups come from a claim of the ID token, and the administrator chooses per connection who can log in from a harness: chosen groups, everyone, or approved people only.

## Problem Statement

1. No card and no form exist for a provider outside the catalog.
2. The setup of the login client is the only step that the customer does in their own server. The existing harness login section names the fields "Login client ID" and "Login client secret" and explains them with OAuth terms, so an administrator does not know what to register or where.
3. Without a directory, the Admin has no place that lists the people of a connection, and no place to approve them.
4. The administrator needs to know when people wait for approval, and where to go.

## Solution

1. **Provider card.** Generic OIDC, under OIDC integrations, after Google Workspace, with the lucide `KeyRound` icon. Its name and availability come from the backend catalog.
2. **Generic OIDC form** (`GenericOidcConnectionForm.tsx`), with the `identity-form-section` layout and the `SectionHeading`, `Help` and `GuideLink` components:

   | Section | Field | Rule |
   | :--- | :--- | :--- |
   | Connection | Connection name | Required, up to 80 characters |
   | Connection | Enable connection | Switch, on by default |
   | Provider | Issuer URL | Required https URL; the `iss` of the tokens |
   | Provider | Enter endpoints manually | Switch, off by default; on shows Authorization endpoint, Token endpoint and Public keys URL (JWKS), each https and required |
   | Provider | Read discovery / Check endpoints | Runs the check of Backend 106 Protocol contract 2; on success shows the endpoints, signing algorithms, number of keys and claims; on `oidc_symmetric_only` shows the danger notice "This provider can not be verified" with the algorithms found |
   | Who is who | Person identifier | Read-only `iss + sub` |
   | Who is who | Email claim | Default `email`; "Shown in the Admin only when email_verified is true." |
   | Who is who | Groups claim | Optional; "A list of strings in the token." |
   | Who is who | No directory notice | Says that a person appears in People after the first harness login or token exchange, and that group names are typed as they come in the claim |
   | Request authentication | Accept tokens from your services | Switch; on shows Accepted audiences (1 to 10) |
   | Harness login | Allow harness login | Switch |
   | Harness login | Who can log in | Radio: People in chosen groups (disabled without a groups claim), Everyone who signs in with this provider (with the warning "Anyone with an account can log in"), Approved people only |
   | Harness login | Steps 1 to 3 | 1. Register the platform in your login server (once, for everyone who logs in from a harness, by the administrator of the OIDC server). 2. Allow this redirect URI (with copy; shown after the first save). 3. Paste the client ID and secret |
   | Harness login | Client ID, Client secret | Required when harness login is on; the secret is write-only and masked after save, with Change |
   | Harness login | Additional scopes | Optional, space-separated, with help: some providers add the groups claim only when a scope asks for it |

   Create connection is enabled after a successful check. The footer is the editor footer of the other forms: Cancel and Create connection (or Save changes) on the right.
3. **People page of a connection** (`ConnectionPeople.tsx`), opened from Integrations, Identity providers:
   - "Back to Identity providers" secondary button; title with the connection name and help; the current "Who can log in" mode as a neutral badge.
   - A notice with the count of people waiting for approval, when there are any.
   - Search by name, email or sub; status filter (All statuses, Pending approval with its count, Approved, Approval revoked, Seen in token exchanges); Approve selected (N).
   - Table: selection (pending and revoked rows only), Person (icon, name, verified email or `sub`), Groups (neutral badges), Status (badge: Pending approval warning, Approved success, Approval revoked danger, Seen neutral), First seen (time and Harness login or Token exchange), Last sign-in, Actions.
   - Actions: Approve on pending and revoked rows; Revoke approval (danger soft) on approved rows, with a confirmation dialog that warns that the harness sessions of the person stop at once in every agent of the connection.
   - The pager of the other lists.
   - The page opens with the Pending approval filter when people are pending, otherwise All statuses.
4. **Entry points.**
   - Integrations, Identity providers: the row of an `oidc` connection shows "Generic OIDC" after its issuer, a warning badge "N pending approval" in Status when people are pending, and a People action (ghost small) before Edit. Rows of other providers do not change.
   - Overview, Inbox: the `identity_approval_pending` item of Backend 106 (Access category) shows the count as its subject, the connection name and "Generic OIDC · <mode>" as its context, and People as its action.
5. **Agent editor for an `oidc` connection** (no prototype; same components, other data source):
   - Delegation and access (026): the subject picker of an `oidc` connection lists the people of the connection (Backend 106 Protocol contract 7) instead of directory users, and has no groups list.
   - Harness login card of the agent (036): in the mode `groups`, the eligible groups are typed names; in the modes `everyone` and `approved`, the card turns person consent on without groups and says which mode the connection uses.

## User Stories

- [ ] 1. As an administrator, I see Generic OIDC under OIDC integrations and start a connection with an issuer.
- [ ] 2. As an administrator, I type the three endpoints when my server has no discovery document.
- [ ] 3. As an administrator, I read why a provider is refused when it signs only with a shared secret.
- [ ] 4. As an administrator, I understand from the three steps what to register in my login server, and that it is done once for everyone.
- [ ] 5. As an administrator, I choose who can log in from a harness: chosen groups, everyone, or approved people only.
- [ ] 6. As an administrator, I open the People of a connection from its row in Identity providers or from the Inbox item.
- [ ] 7. As an administrator, I approve several people at once and revoke an approval when I need to stop someone.
- [ ] 8. As an administrator, I pick the people of a Generic OIDC connection as delegates in an agent, and type group names in its harness login card.

## Architecture Gate

- Admin owns the forms, the People page, local state and presentation. Backend 106 owns validation, discovery, the people, approval and the Inbox signal.
- The Admin never calls the customer OIDC server.
- Keep the feature in `src/features/identity/`: `GenericOidcConnectionForm.tsx`, `ConnectionPeople.tsx`, and the provider choice in `IdentityConnectionForm.tsx`. The People API client goes in `api.ts` of the feature. Split a file that nears 300 lines.
- `HarnessLoginSection` keeps one provider-neutral way to show the steps of the login client; the Generic OIDC copy is passed in, not branched inside it.
- The check messages live in the safe message map of `api.ts`.

## Prototype

Visual reference: [`specs/prototypes/065-2026-11-25-generic-oidc-connection/`](prototypes/065-2026-11-25-generic-oidc-connection/), approved by the user on 2026-11-25. Pages:

- `/prototype/generic-oidc`: card and form; `?state=rejected` shows a provider that signs only with HS256.
- `/prototype/generic-oidc-people`: People of the connection.
- `/prototype/generic-oidc-integrations`: the People action and the pending badge in Identity providers.
- `/prototype/generic-oidc-inbox`: the Inbox item.

Changes during the layout review: the login client fields were renamed Client ID and Client secret and preceded by three steps (the user did not understand what they were for); manual endpoints and the third mode Approved people only were added after the grilling; the Block action of the People page was replaced by Revoke approval, because blocking one agent already exists in Harness sessions (036); the entry points were drawn after the user asked where the page opens from.

The prototype was reviewed outside the signed-in Admin, with the real header and Access navigation and a fixed session, because the demo address served another checkout.

### Backend dependencies

Every chip of the prototype cites Backend 106:

- Discovery or typed endpoints, and the refusal of symmetric signatures: Backend 106 Protocol contract 2.
- Groups claim: Backend 106 Resolved Decision 5 and Protocol contract 4.
- Who can log in: Backend 106 Resolved Decision 6 and Protocol contract 4.
- People list, approve and revoke: Backend 106 Protocol contract 7.
- People action and pending count in Identity providers: Backend 106 Protocol contract 7 (list with `status=pending`).
- Inbox item: Backend 106 Protocol contract 8.

## Implementation Decisions

1. Reuse `docs/design-system/styles/index.css` and the `cp-admin-*`, `identity-*`, `mcp-badge` and attention classes. No new visual tokens.
2. Native form validation plus local messages; the local message has priority over the last server error (as Admin 042 and 043).
3. Error text comes from the safe message map. No raw provider or discovery text reaches the screen.
4. Field names follow the Backend 106 API: `manual_endpoints`, `email_claim`, `groups_claim`, `extra_scopes`, `eligibility`.
5. The copy of the prototype is the copy. Wording changes are trivial and do not need a new decision.
6. No product name in Admin copy: the login steps say "the platform".
7. The harness login card of an agent shows the published groups, not the mode of the connection. In the mode `everyone` or `approved`, the switch is on only when the agent holds the group `oidc:everyone`; groups typed while the connection used chosen groups show in a warning with "Remove these groups", and switching on replaces them. In the mode `groups`, the group `oidc:everyone` is not a typed group, so an agent that holds only it shows "Choose at least one group". Found in the functional test: the card said everyone while only `finance` could log in.

## Verification

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build`, then the functional test in the built-in browser on the demo instance, with a Keycloak realm of the demo registered as Generic OIDC (Backend 106, Integration & Contract Tests).

## Acceptance Criteria

- [ ] 1. Generic OIDC is under OIDC integrations, after Google Workspace, when the backend catalog lists it as available.
- [ ] 2. The form has the fields of Solution 2; manual endpoints show only with their switch on.
- [ ] 3. The check shows the discovered endpoints, algorithms and keys, and the danger notice for a provider that signs only with a symmetric algorithm.
- [ ] 4. The three login client steps and the redirect URI with copy show in Harness login; the secret is never shown after save.
- [ ] 5. Who can log in offers the three modes; chosen groups is disabled without a groups claim; Everyone shows its warning.
- [ ] 6. The People page lists the people with their status, filters by status, approves one or several, and revokes an approval with its confirmation.
- [ ] 7. The People action and the pending badge show on the row of an `oidc` connection only, and the Inbox item opens the People page.
- [ ] 8. The delegation editor lists the people of an `oidc` connection, and the harness login card of an agent follows the mode of the connection.
- [ ] 9. The other provider forms behave as before.
- [ ] 10. `npm run check` and `npm run build` pass.
- [ ] 11. Functional test: [065-2026-11-25-generic-oidc-connection](functional-tests/065-2026-11-25-generic-oidc-connection.md).

## Out of Scope

Dynamic Client Registration, opaque tokens and introspection, symmetric signatures, a list of group names seen in tokens, approval for token exchange, invitations by email, SAML (Backend 106, Out of Scope).

## Further Notes

- Solution 5 (the agent editor changes) has no prototype: it changes the data of existing components, not their layout. If its layout needs a review, it gets a prototype page before implementation.
