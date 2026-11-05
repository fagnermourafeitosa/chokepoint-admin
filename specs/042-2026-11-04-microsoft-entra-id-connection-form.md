# Specification: Microsoft Entra ID Connection Form

- **Specification ID**: 042
- **Date**: 2026-11-04
- **Slug**: microsoft-entra-id-connection-form
- **Status**: In Progress
- **Owner**: Admin — Access and Integrations

> Approved for implementation by the user on 2026-11-04, after the layout approval on the prototype.

> **PENDING — never proven on a real Microsoft Entra tenant.** No test tenant exists (it needs a paid tenant or a card). The save, the stored secret, the users and groups lists and every check message except the wrong tenant are verified only against fakes. The first real connection is the proof; see [Backend 058](../../backend/specs/058-2026-11-04-microsoft-entra-id-integration.md) "Pending verification".
- **Related Specification**: [Backend 058 — Microsoft Entra ID Integration](../../backend/specs/058-2026-11-04-microsoft-entra-id-integration.md)
- **Related Specification**: [023 — Google Workspace Connection Form](023-2026-10-30-google-workspace-connection-form.md)
- **Related Specification**: [036 — Interactive Harness Access](036-2026-11-03-interactive-harness-access.md)

## Context & Background

The Connect identity provider screen shows one card for each provider of the backend catalog. Keycloak and Google Workspace have their own forms. The Google form (023) explains the customer setup with numbered help steps that link to the Google guides. Backend 058 adds Microsoft Entra ID (provider `entra`) to the catalog.

The customer must configure one app registration in the Microsoft Entra admin center before Chokepoint can read its tenant. An administrator who does not know Entra must be able to do it from the help in the form, without support.

## Problem Statement

1. No form exists for Entra. The Keycloak form asks for a token issuing client and an issuer URL; the Google form asks for a service account key and a delegated administrator. Neither fits Entra.
2. The Entra setup has steps in the Entra admin center (app registration, redirect URI, client secret, Graph permissions with admin consent). Without help steps and links, the administrator does not know where to click.

## Solution

1. **Provider card.** Microsoft Entra ID is in the identity provider group, right after Keycloak. Its name and availability come from the backend catalog. The icon `public/idp-icons/entra.svg` is a neutral black mark drawn for Chokepoint (a hexagon with a person), monochrome like the other marks, not the Microsoft logo: Simple Icons, the source of the other marks, has no Microsoft mark.
2. **Entra form.** `EntraConnectionForm.tsx`, with the existing `identity-form-section` layout and the `SectionHeading` and `Help` components of the Google form:

   | Section | Field | Rule |
   | :--- | :--- | :--- |
   | Connection | Connection name | Required, up to 80 characters |
   | Connection | Enable connection | Switch, on by default |
   | Microsoft Entra app | Directory (tenant) ID | Required GUID. The form rejects `common`, `organizations` and `consumers` |
   | Microsoft Entra app | Application (client) ID | Required GUID |
   | Microsoft Entra app | Client secret value | Write-only. Shown masked after save, with a Change action |
   | Microsoft Entra app | Check connection | Same inline check pattern as Keycloak and Google |
   | Request authentication | Issuer URL | Read only, `https://login.microsoftonline.com/<tenant ID>/v2.0`, updated as the tenant ID is typed |
   | Request authentication | Accepted audiences | List with Add and Remove, 1 to 10 values. Default: the client ID and `api://<client ID>` |
   | Harness login | `HarnessLoginSection` | Reused. For Entra, the client ID and secret are the ones of the Microsoft Entra app section; the section shows the switch and the redirect URI, not a second client ID and secret |

   The client ID and the secret are typed once. The save sends them in the directory settings and in the login settings (Backend 058 Resolved Decision 3).
3. **Setup steps.** The Microsoft Entra app section starts with a numbered step list, in the same pattern as the Google steps (`lifecycle-steps`, a step bubble, a title, an explanation and a guide link that opens in a new tab with the `ExternalLink` icon):

   | Step | Title | Text | Link |
   | :--- | :--- | :--- | :--- |
   | 1 | Register an app | In the Microsoft Entra admin center, go to Identity, Applications, App registrations, New registration. Choose "Accounts in this organizational directory only". On the app Overview, copy the Application (client) ID and the Directory (tenant) ID. | [Microsoft guide: register an application](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app) |
   | 2 | Create a client secret | In the app, go to Certificates & secrets, Client secrets, New client secret. Copy the Value at once: Entra shows it only once. Do not copy the Secret ID. Note the expiry date: create a new secret before it expires. | [Microsoft guide: add a client secret](https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials) |
   | 3 | Add the Graph permissions | In the app, go to API permissions, Add a permission, Microsoft Graph, Application permissions. Add `User.Read.All` and `GroupMember.Read.All`. Then select "Grant admin consent". A Global Administrator or a Privileged Role Administrator must grant it. | [Microsoft guide: grant admin consent](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent) |
   | 4 | Paste the values | Enter the tenant ID, the client ID and the secret value below, then select Check connection. | — |

   The Entra admin center itself is linked from step 1: [entra.microsoft.com](https://entra.microsoft.com).
4. **Redirect URI help.** In the Harness login section, the redirect URI label says "register it in Microsoft Entra". The help text: in the app, go to Authentication, Add a platform, Web, and paste the redirect URI. Link: [Microsoft guide: add a redirect URI](https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri). The groups text says that Chokepoint reads groups with `GroupMember.Read.All` (step 3).
5. **Headless agents help.** The Accepted audiences help says: only needed when a service of yours exchanges an Entra token for an agent token. In the app, go to Expose an API, set the Application ID URI (the default is `api://<client ID>`) and add a scope. Link: [Microsoft guide: expose a web API](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-configure-app-expose-web-apis).
6. **Tenant ID help.** The Directory (tenant) ID help says where to find it (app Overview, or Identity, Overview) and links to [Microsoft guide: find your tenant ID](https://learn.microsoft.com/en-us/entra/fundamentals/how-to-find-tenant).
7. **Check messages.** The check result maps the Backend 058 errors to safe text:

   | Backend error | Text |
   | :--- | :--- |
   | Wrong tenant | Microsoft Entra does not know this tenant ID. Copy the Directory (tenant) ID from the app Overview. |
   | Wrong client ID | This application is not in the tenant. Check the Application (client) ID and the tenant ID. |
   | Wrong secret | Microsoft Entra rejected the secret. Paste the secret Value, not the Secret ID. |
   | Expired secret | The client secret expired. Create a new secret (step 2) and paste its value. |
   | Users not readable | The app can not read users. Add `User.Read.All` and grant admin consent (step 3). |
   | Groups of a person not readable (`entra_member_groups_denied`) | Microsoft Entra does not let the app read the groups of a person with GroupMember.Read.All. Add the Microsoft Graph application permission Directory.Read.All, grant admin consent, then check the connection again. |
   | Groups not readable | The app can not read groups. Harness login needs it: add `GroupMember.Read.All` and grant admin consent (step 3). |
   | Unavailable | Could not reach Microsoft Entra. Try again. |

8. **Guests.** A short muted line under the steps: guests (people from other organizations invited to your tenant) are not listed and can not use Chokepoint.
9. **Changing the tenant.** In the edit form, a warning near the tenant ID, like the Google organization warning: if you change the tenant ID, the people associated before belong to the previous tenant and lose access. Chokepoint does not block the change.

## User Stories

- [ ] 1. As an administrator, I see Microsoft Entra ID with the identity providers and I can start a connection.
- [ ] 2. As an administrator, I follow the numbered steps and their Microsoft links to configure the app registration without outside help.
- [ ] 3. As an administrator, I type the client ID and the secret once, for the directory and the harness login.
- [ ] 4. As an administrator, I understand from the check message which step is missing.
- [ ] 5. As an administrator, I cannot read a stored secret again.

## Architecture Gate

- Admin owns the form, local state and presentation. Backend 058 owns validation, secret storage and the Entra protocol.
- The Admin does not call Entra or Graph.
- Keep the feature in `src/features/identity/`: `EntraConnectionForm.tsx` for the form; the provider choice in `IdentityConnectionForm.tsx`. Move `SectionHeading` and `GuideLink` of the Google form to a shared file when both forms use them. Split a file that nears 300 lines.
- `HarnessLoginSection` gains the prop `sharedClient` (`{ guide }`) for a provider whose login client is the directory app (Entra): it hides its client ID and secret fields, shows the redirect URI step with the guide link, and takes the copy for the provider.
- `SectionHeading` and `GuideLink` move to `formParts.tsx`, used by the Google and Entra forms.

## Prototype

The layout was approved by the user on 2026-11-04 on a prototype in the `admin-042` worktree (`EntraConnectionForm.tsx`, served at `acme.localhost:5175`). It shows the Entra card before the backend catalog lists it, and marks the check and the save with `Waiting backend · 058`. Checked in the built-in browser: the four steps and the seven Microsoft links, the issuer that follows the tenant ID, the audiences that follow the client ID, the Harness login section without a second client, and no console errors.

The implementation removes the local catalog entry and the Waiting backend chips, and connects save and check to the Backend 058 API.

The local validation message has priority over the last server error in the Entra form, so that a fixed field never keeps an old error (found in the functional test).

## Implementation Decisions

1. Reuse `docs/design-system/styles/index.css`, the `cp-admin-*` and `identity-*` classes. No new visual tokens.
2. Native form validation; the GUID check is a `pattern` attribute with a clear message.
3. Error text comes from a safe message map. No raw provider text reaches the screen.
4. Field names follow the Backend 058 API when it exists. Do not invent field names before it exists.
5. The step texts above are the copy. Wording changes are trivial and do not need a new decision.

## Verification

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build`. The interface and functional test runs in the built-in browser: card, form sections, steps and links, GUID validation, issuer preview, secret masking after save, check messages and the narrow-screen layout.

## Acceptance Criteria

- [x] 1. Microsoft Entra ID is in the identity provider group when the backend catalog lists it. — evidence: built-in browser on the Backend 058 API; order Keycloak, Microsoft Entra ID, Okta, then Google Workspace in its own group
- [x] 2. The Entra form has the fields of Solution 2 and no Keycloak-only or Google-only field. — evidence: built-in browser
- [x] 3. The four setup steps show with their Microsoft links, opening in a new tab. — evidence: built-in browser; every link answers 200
- [x] 4. The redirect URI, audience and tenant ID help texts show with their links. — evidence: built-in browser
- [ ] 5. The client ID and secret are typed once and saved for directory and login. — the form sends them in both settings (code inspection); a save needs the Entra test tenant (Backend 058)
- [ ] 6. Each check error of Solution 7 shows its text. — wrong tenant verified in the built-in browser against Microsoft; the other errors need the Entra test tenant
- [ ] 7. The stored secret is never shown; replacing it needs an explicit Change action. — needs a saved connection on the Entra test tenant
- [x] 8. The Keycloak and Google forms behave as before. — evidence: built-in browser; same sections, Google steps and links
- [x] 9. `npm run check` and `npm run build` pass.

## Out of Scope

Certificate credentials, a multitenant Chokepoint app, guest access, national clouds, Okta.
