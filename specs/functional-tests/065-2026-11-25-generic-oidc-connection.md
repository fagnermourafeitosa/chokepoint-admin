---
# Functional test of one specification. File name: the file name of the specification.
spec: 065-2026-11-25-generic-oidc-connection
title: Generic OIDC Connection
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test
  - A second Keycloak realm of the demo (for example `acme-oidc`) registered as Generic OIDC, with a Group Membership mapper that sends `groups` without the full path, a confidential client for harness login, and two test users; and a static discovery document that lists only HS256 for the refusal (Backend 106, Integration & Contract Tests)
data: The Generic OIDC connection, its people and the agent delegations that the scenarios create. Restore by deleting the connection, which deletes its people; reset.sh --yes rebuilds Acme from zero.
scenarios:
  - id: S1
    title: Create a Generic OIDC connection with discovery
    criteria: [1, 2, 3, 4]
    steps:
      - Open Access, Integrations, Identity providers, Connect identity provider; choose Generic OIDC
      - Type the name and the issuer of the acme-oidc realm; Read discovery
      - Turn on Allow harness login; copy the redirect URI after the first save; type the client ID and secret; save
    expected:
      - The card is under OIDC integrations after Google Workspace
      - The check shows the authorization and token endpoints, the JWKS URL with its keys, the signing algorithms and the claims
      - The saved connection shows the secret masked, with Change
    last_run:
      date: 2026-11-25
      result: passed
      notes: "Claude Code 2.1.323, branches feat/generic-oidc (backend API on 127.0.0.1:8083 behind a local TLS front https://gen.xokepoint.localhost:8443, Admin on http://acme.xokepoint.localhost:5177) on the demo database, Production, local Keycloak realm acme-oidc (marina in finance, email verified; lucas in ops, email not verified). Generic OIDC card under OIDC integrations after Google Workspace; Read discovery of http://127.0.0.1:8180/realms/acme-oidc showed the endpoints, the JWKS with 1 key, the algorithms and the claims; Acme login created with harness login, Approved people only and audience acme-oidc-agents; the row shows Generic OIDC."
  - id: S2
    title: Typed endpoints and the refusal of symmetric signatures
    criteria: [2, 3]
    steps:
      - In a new Generic OIDC form, turn on Enter endpoints manually and type the three endpoints of the acme-oidc realm; Check endpoints
      - In another form, type the issuer of the static HS256-only discovery; Read discovery
    expected:
      - Check endpoints shows the keys and their algorithms
      - The HS256-only issuer shows "This provider can not be verified" and Create connection stays disabled
    last_run:
      date: 2026-11-25
      result: passed
      notes: "Claude Code 2.1.323, branches feat/generic-oidc (backend API on 127.0.0.1:8083 behind a local TLS front https://gen.xokepoint.localhost:8443, Admin on http://acme.xokepoint.localhost:5177) on the demo database, Production, local Keycloak realm acme-oidc (marina in finance, email verified; lucas in ops, email not verified). A static discovery that lists only HS256 (http://127.0.0.1:8190/realms/hs): the danger notice 'This provider signs tokens only with a shared secret…' and Create connection disabled. Typed endpoints in a new Production form (authorization, token and certs of the realm): Check endpoints showed 'Public keys read.', 1 key, RS256; the form was cancelled without saving."
  - id: S3
    title: Who can log in, mode by mode
    criteria: [5, 8]
    steps:
      - With a groups claim, choose People in chosen groups; in an agent, turn on harness login and type a group name of one test user
      - Log in from Claude Code with each test user (dev-infra/functional-tests/harness-cli.md)
      - Change the connection to Everyone who signs in with this provider and open the harness login card of the agent; log in with the second user
      - Switch the card on, publish and log in with the second user again
    expected:
      - Chosen groups is disabled while the groups claim is empty; Everyone shows its warning
      - In chosen groups, only the user of the typed group can consent
      - After the change to Everyone, the card shows its switch off and "Only <group> can log in" with Remove these groups, and the second user is refused; after the switch is on and published, the second user can consent
      - The consent page says "Valid for 24 hours"
      - The delegation editor of the agent lists the people of the connection
    last_run:
      date: 2026-11-25
      result: passed
      notes: "Claude Code 2.1.323, branches feat/generic-oidc (backend API on 127.0.0.1:8083 behind a local TLS front https://gen.xokepoint.localhost:8443, Admin on http://acme.xokepoint.localhost:5177) on the demo database, Production, local Keycloak realm acme-oidc (marina in finance, email verified; lucas in ops, email not verified). With the groups claim cleared in the form, People in chosen groups was disabled; Everyone showed 'Anyone with an account can log in'. Chosen groups: finance typed in the agent card (revision 98); marina got the consent page 'group finance' and Claude Code said Authenticated; lucas was refused (5jah-ft2d). With finance published again (revision 102), the connection changed to Everyone: the card showed the switch off and 'Only finance can log in. These groups were chosen while Acme login used People in chosen groups.' with Remove these groups; lucas was refused (befz-zmcb). Switch on and publish (revision 104): lucas got the consent page 'group Everyone of the connection', 'Valid for 24 hours, until Nov 26, 2026 19:34 UTC', and Claude Code said Authenticated. The delegation editor listed Lucas Prado and Marina Lopes. An earlier run the same day failed before the card fix (Admin 065 Implementation Decision 7) and the consent page fix (Backend 106 Implementation Note 8)."
  - id: S4
    title: Approval, Inbox item and revoke
    criteria: [6, 7]
    steps:
      - Choose Approved people only; log in from Claude Code with a new test user
      - Open the Overview and the Inbox item; open People from it, and also from the row in Identity providers
      - Select the pending people and Approve selected; log in again
      - Revoke approval of that person and confirm
    expected:
      - The login page refuses with a reference code and says that an administrator must approve
      - One Approval pending item for the connection in the Access category; the row shows N pending approval and the People action
      - After approval the login works; after revoke the harness session stops and the status is Approval revoked
    last_run:
      date: 2026-11-25
      result: passed
      notes: "Claude Code 2.1.323, branches feat/generic-oidc (backend API on 127.0.0.1:8083 behind a local TLS front https://gen.xokepoint.localhost:8443, Admin on http://acme.xokepoint.localhost:5177) on the demo database, Production, local Keycloak realm acme-oidc (marina in finance, email verified; lucas in ops, email not verified). marina logged in from Claude Code: refused with 'Your access waits for approval' and code mr3b-6444; Identity providers showed '1 pending approval'; People showed Marina with her verified email and the group finance; one Approval pending item was raised and resolved after Approve. After approval: consent page, Authenticated, Connected, get_order ORD-10482 returned the order (through a copy of Acme Billing on 127.0.0.1:8795 that trusts the branch issuer). With the grant aged 25 hours in the database, the refresh answered 400 and Claude Code showed Needs authentication. After a new login, Revoke approval stopped the session at once (Needs authentication; grant revoked by administrator). Token exchange: lucas refused with no_delegation and recorded as Seen (token exchange); delegated in the editor (revision 96); the exchange then issued a token and get_order ORD-10561 returned the order."
  - id: S5
    title: Other providers unchanged
    criteria: [7, 9]
    steps:
      - Open the forms of Keycloak, Microsoft Entra ID, Okta and Google Workspace, and the row of the Acme Keycloak connection
    expected:
      - The forms are as before; the Keycloak row has no People action and no pending badge
    last_run:
      date: 2026-11-25
      result: passed
      notes: "Claude Code 2.1.323, branches feat/generic-oidc (backend API on 127.0.0.1:8083 behind a local TLS front https://gen.xokepoint.localhost:8443, Admin on http://acme.xokepoint.localhost:5177) on the demo database, Production, local Keycloak realm acme-oidc (marina in finance, email verified; lucas in ops, email not verified). The Keycloak row (Acme Identity) has no People action and no pending badge; the Keycloak form opened as before. The Microsoft Entra ID, Okta and Google Workspace forms opened as before."
---

# Functional test: Generic OIDC Connection

The scenarios use a Keycloak realm registered as Generic OIDC, not as Keycloak: the platform then reads no directory and goes through the code of Backend 106. Keycloak can not list only HS256 in its discovery, so S2 uses a static discovery document for the refusal.
