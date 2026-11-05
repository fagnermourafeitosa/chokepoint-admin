# Specification: Okta Connection Form

- **Specification ID**: 043
- **Date**: 2026-11-05
- **Slug**: okta-connection-form
- **Status**: Implemented
- **Owner**: Admin — Access and Integrations
- **Related Specification**: [Backend 059 — Okta Integration](../../backend/specs/059-2026-11-05-okta-integration.md)
- **Related Specification**: [042 — Microsoft Entra ID Connection Form](042-2026-11-04-microsoft-entra-id-connection-form.md)
- **Related Specification**: [036 — Interactive Harness Access](036-2026-11-03-interactive-harness-access.md)

> Approved for implementation by the user on 2026-11-05, after the layout approval on the prototype in the `admin-043` worktree.

> **PENDING — never proven on a real Okta org.** No test org existed at the merge; the user approved the merge with this caveat on 2026-11-05. The save, the stored key, the users and groups lists, harness login and every check message except a wrong org are verified only against the code and the Backend 059 fakes. The first real connection is the proof; see [Backend 059](../../backend/specs/059-2026-11-05-okta-integration.md) "Pending Verification".

## Context & Background

The Connect identity provider screen shows one card for each provider of the backend catalog. Keycloak, Microsoft Entra ID and Google Workspace have their own forms. Okta is in the catalog as unavailable. Backend 059 makes Okta available.

The Okta setup has two apps in the Okta Admin Console. An API Services app reads the directory with a private key and DPoP. An OIDC Web app does the harness login. An optional custom authorization server is needed only for headless agents. An administrator who does not know Okta must be able to do the setup from the help in the form, without support.

Okta is the only screen of this specification. People and group selection, harness login and the Investigate screens are generic: they follow the backend catalog and need no Okta code.

## Problem Statement

1. No form exists for Okta. The Keycloak form asks for a token issuing client; the Entra form asks for a tenant and a client secret. Neither fits Okta.
2. The Okta setup has steps in two apps and two places (General and Admin roles tabs, Okta API Scopes tab). Without help steps and links, the administrator does not know where to click.

## Solution

1. **Provider card.** Okta stays in the identity provider group, after Keycloak and Microsoft Entra ID, with its existing icon `public/idp-icons/okta.svg`. Its name and availability come from the backend catalog. **The Microsoft Entra ID card and form (042) do not change**: order Keycloak, Microsoft Entra ID, Okta, then Google Workspace in its own group.
2. **Okta form.** `OktaConnectionForm.tsx`, with the existing `identity-form-section` layout and the `SectionHeading`, `GuideLink` and `Help` components:

   | Section | Field | Rule |
   | :--- | :--- | :--- |
   | Connection | Connection name | Required, up to 80 characters |
   | Connection | Enable connection | Switch, on by default |
   | Connection | Okta org URL | Required https URL with a host and no path. A host with `-admin` before the first dot shows its own message (the Admin Console address). Link "Find your Okta domain" |
   | Okta API Services app | Client ID | Required |
   | Okta API Services app | Private key (JSON) | Write-only text area. It must parse as JSON with `kid` and `d`. Shown masked after save, with a Change action |
   | Okta API Services app | Check connection | Same inline check pattern as the other forms |
   | Request authentication | Accept tokens from your services | Switch, off by default. On a saved connection, on when it has a token issuer |
   | Request authentication | Custom authorization server issuer | Shown only with the switch on. Required then; it must start with `<org URL>/oauth2/` |
   | Request authentication | Accepted audiences | Shown only with the switch on. List with Add and Remove, 1 to 10 values. Default `api://default` |
   | Harness login | `HarnessLoginSection` | Reused, with its own login client ID and secret (the OIDC Web app, not the API Services app) |

   No read-only issuer field: the connection issuer is the org URL, already in the form. With the switch off, the save sends no token issuer and the audiences `["api://default"]` (Backend 059 Protocol contract 1).
3. **Setup steps.** The Okta API Services app section starts with a numbered step list, in the pattern of the Entra steps (`lifecycle-steps`):

   | Step | Title | Text | Link |
   | :--- | :--- | :--- | :--- |
   | 1 | Create an API Services app | In the Okta Admin Console, go to Applications, Applications, Create App Integration, and choose API Services. Name it, for example, Chokepoint directory. Copy its Client ID. | [Okta guide: create a service app](https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/main/) |
   | 2 | Generate a key | In the app, General tab, Client Credentials, select Edit and choose Public key / Private key. Under Save keys in Okta, select Add key, then Generate new key. Copy the private key in JSON format at once: Okta shows it only once. Keep DPoP required. | [Okta guide: generate the key](https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/main/#generate-the-jwk-using-the-admin-console) |
   | 3 | Grant the scopes | In the app, Okta API Scopes tab, grant `okta.users.read` and `okta.groups.read`. Only a Super Administrator can grant scopes. | [Okta guide: grant scopes](https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/main/#grant-allowed-scopes) |
   | 4 | Assign an admin role | In the app, Admin roles tab, select Edit assignments and assign Read-only Administrator. Then paste the client ID and the key below. | [Okta guide: assign admin roles](https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/main/#assign-admin-roles-to-the-oauth-2-0-service-app) |

   The section help says that Chokepoint signs in with the private key, binds every token with DPoP, asks only for the two read-only scopes, and does not list deactivated people or the Everyone group.
4. **Request authentication help.** The section help says: only needed for agents that run without a person at the keyboard; Okta does not let other parties validate the access tokens of the org authorization server, so this needs a custom authorization server, part of Okta API Access Management. The switch text: needs a custom authorization server in Okta; harness login and the directory work without it. The issuer help says where to find it (Security, API, Authorization Servers) and links to [Okta guide: custom authorization server](https://developer.okta.com/docs/guides/customize-authz-server/main/). The audience help says the default server uses `api://default`.
5. **Harness login help.** For Okta, the section adds one line: create an OIDC Web Application in Okta (Applications, Create App Integration) and paste the redirect URI in Sign-in redirect URIs; assign it the groups of the people who may log in: Okta refuses everyone else. Link: [Okta guide: create an OIDC app](https://help.okta.com/oie/en-us/content/topics/apps/apps_app_integration_wizard_oidc.htm). The login client ID hint says: the OIDC Web app, not the API Services app. The groups text says that Chokepoint reads groups with the API Services app and needs `okta.groups.read` (step 3).
6. **Check messages.** The check result maps the Backend 059 codes to safe text:

   | Backend code | Text |
   | :--- | :--- |
   | `okta_org_not_found` | Chokepoint could not read this Okta org. Check the org URL: https://acme.okta.com or your custom domain, without "-admin". |
   | `okta_authorization_server_not_found` | Chokepoint could not read this custom authorization server. Copy its Issuer from Security, API, Authorization Servers. |
   | `okta_client_rejected` | Okta rejected the app. Check the client ID, paste the private key of this app, and check that its client authentication is Public key / Private key (step 2). |
   | `okta_scope_missing` | A scope is not granted. Grant okta.users.read and okta.groups.read (step 3). |
   | `okta_role_missing` | The app can not read users. Assign it the Read-only Administrator role (step 4). |
   | Groups not readable | The app can not read groups. Harness login needs it: grant okta.groups.read (step 3). |
   | Unavailable | Could not reach Okta. Try again. |

7. **Changing the org.** In the edit form, a warning near the org URL, like the Entra tenant warning: if you change the org URL, the people associated before belong to the previous org and lose access. Chokepoint does not block the change. A change of the org URL or the client ID opens the private key field and asks for the key of that app (Backend 059 Protocol contract 2).
8. **Form footer.** The last section of every provider form has no bottom line; the footer line is the only separator above the actions. This applies to the Keycloak, Entra, Google and Okta forms (shared `identity.css`); it was a double line before.

## User Stories

- [ ] 1. As an administrator, I see Okta with the identity providers and I can start a connection.
- [ ] 2. As an administrator, I follow the numbered steps and their Okta links to configure the API Services app without outside help.
- [ ] 3. As an administrator, I paste the private key once, and I cannot read it again.
- [ ] 4. As an administrator, I see the headless fields only when I turn them on.
- [ ] 5. As an administrator, I understand from the check message which step is missing.

## Architecture Gate

- Admin owns the form, local state and presentation. Backend 059 owns validation, key storage and the Okta protocol.
- The Admin does not call Okta.
- Keep the feature in `src/features/identity/`: `OktaConnectionForm.tsx` for the form; the provider choice in `IdentityConnectionForm.tsx`. Split a file that nears 300 lines.
- `HarnessLoginSection` takes the Okta copy through one provider-neutral prop for the guide of the login app, not an Okta-only prop (the prototype used `oktaGuide`).
- The check messages live in the safe message map of `api.ts`, next to the Entra ones.

## Prototype

The layout was approved by the user on 2026-11-05 on a prototype in the `admin-043` worktree (branch `design/okta-connection-form`, served at `127.0.0.1:5175` against a backend of the current `main` at `127.0.0.1:8083`). It shows the Okta card as available before the backend catalog lists it, and marks the private key, the check and the custom authorization server with `Waiting backend · 059`.

Checked in the built-in browser:

- Card order Keycloak, Microsoft Entra ID, Okta, Google Workspace.
- The four steps and their links (every link answers 200; the `help.okta.com` page was also read).
- The `-admin` message, the private key check, the custom authorization server of another org.
- The headless fields hidden until the switch is on.
- No overflow at 375 px wide.
- One footer line in the four provider forms.

Changes during the layout review: the read-only issuer field, the fifth step and the muted line under the steps were removed, and the headless fields were moved behind a switch (the user asked whether the whole form was needed); the footer chip and the double line were removed (the user found them).

The implementation removes the local catalog override and the Waiting backend chips, and connects save and check to the Backend 059 API.

## Implementation Decisions

1. Reuse `docs/design-system/styles/index.css`, the `cp-admin-*` and `identity-*` classes. No new visual tokens; the key text area uses `identity-key`.
2. Native form validation plus the local messages of Solution 2. The local validation message has priority over the last server error (as Admin 042).
3. Error text comes from a safe message map. No raw provider text reaches the screen.
4. Field names follow the Backend 059 API: `directory.private_key` and `token_issuer`.
5. The step texts above are the copy. Wording changes are trivial and do not need a new decision.

## Verification

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build`. The interface and functional test runs in the built-in browser on the Okta test org of Backend 059: card, sections, steps and links, org URL and key validation, headless switch, key masking after save, each check message, harness login with the test org, and the narrow-screen layout.

## Acceptance Criteria

- [x] 1. Okta is in the identity provider group when the backend catalog lists it as available, in the order Keycloak, Microsoft Entra ID, Okta. — evidence: built-in browser on the Backend 059 API; order Keycloak, Microsoft Entra ID, Okta, then Google Workspace in its own group
- [x] 2. The Okta form has the fields of Solution 2 and no Keycloak-only, Entra-only or Google-only field. — evidence: built-in browser
- [x] 3. The four setup steps show with their Okta links, opening in a new tab. — evidence: built-in browser; every link answers 200
- [x] 4. The headless fields show only with the switch on, and a save with the switch off sends no token issuer. — evidence: built-in browser for the switch; the payload without `token_issuer` by code inspection
- [ ] 5. The stored private key is never shown; replacing it needs an explicit Change action, or a change of the org URL or the client ID. — needs a saved connection on the Okta test org
- [ ] 6. Each check message of Solution 6 shows on the test org. — wrong org verified in the built-in browser against Okta; the other messages need the test org
- [ ] 7. A person of the test org logs in from a harness through the saved connection. — needs the Okta test org
- [x] 8. The Microsoft Entra ID, Keycloak and Google forms behave as before, with one footer line. — evidence: built-in browser; the Entra form with its four steps, one footer line in the four forms
- [x] 9. `npm run check` and `npm run build` pass. — evidence: `npm run check` and `npm run build`

## Out of Scope

An API token (SSWS), a key generated by Chokepoint, Okta for Government, the Everyone group.
