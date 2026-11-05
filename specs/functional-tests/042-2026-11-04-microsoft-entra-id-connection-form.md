---
spec: 042-2026-11-04-microsoft-entra-id-connection-form
title: Microsoft Entra ID Connection Form
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
  - backend/dev.sh on 127.0.0.1:8081, with the Entra provider of Backend 058 in the catalog
  - The Entra test tenant of Backend 058 (S4 to S6)
data: Access › Integrations › Identity providers. Delete a connection that a scenario saves, unless the user keeps it.
scenarios:
  - id: S1
    title: Entra card, form fields, setup steps and help texts
    criteria: [1, 2, 3, 4]
    steps:
      - Open Access › Integrations › Identity providers, then the Microsoft Entra ID card.
      - Open each link of the four setup steps and of the redirect URI, audience and tenant ID help texts.
    expected:
      - Card order Keycloak, Microsoft Entra ID, Okta, then Google Workspace in its own group.
      - The form has the fields of Solution 2 and no Keycloak-only or Google-only field.
      - Each link opens in a new tab and answers 200.
    last_run:
      date: 2026-11-04
      result: passed
      notes: Against the Backend 058 API.
  - id: S2
    title: GUID validation and issuer preview
    criteria: [2]
    steps:
      - Type a tenant ID that is not a GUID, then a valid one.
      - Type a client ID.
    expected:
      - The field shows the validation message, and it clears when the value is fixed (the local message wins over an older server error).
      - The issuer follows the tenant ID; the audiences follow the client ID.
    last_run:
      date: 2026-11-04
      result: passed
      notes: The defect of the old server error was found and fixed in this run.
  - id: S3
    title: Wrong tenant check error
    criteria: [6]
    steps:
      - Type a tenant ID of no tenant, and run Check connection.
    expected:
      - The wrong tenant error of Solution 7 shows.
    last_run:
      date: 2026-11-04
      result: passed
      notes: Verified against Microsoft.
  - id: S4
    title: Other check errors on the test tenant
    criteria: [6]
    steps:
      - On the test tenant, produce each other check error of Solution 7.
    expected:
      - Each error shows its text.
    last_run:
      date: null
      result: blocked
      notes: Needs the Entra test tenant.
  - id: S5
    title: Client ID and secret saved once for directory and login
    criteria: [5]
    steps:
      - Save a connection on the test tenant with Harness login on.
    expected:
      - The client ID and secret are typed once and saved in both settings.
    last_run:
      date: null
      result: blocked
      notes: The request sends both settings (code inspection); the save needs the Entra test tenant.
  - id: S6
    title: Stored secret masking
    criteria: [7]
    steps:
      - Open the saved connection again.
    expected:
      - The stored secret is never shown; replacing it needs Change.
    last_run:
      date: null
      result: blocked
      notes: Needs a saved connection on the Entra test tenant.
  - id: S7
    title: Keycloak and Google forms unchanged
    criteria: [8]
    steps:
      - Open the Keycloak and Google forms.
    expected:
      - Same sections; the Google steps and links.
    last_run:
      date: 2026-11-04
      result: passed
      notes: null
  - id: S8
    title: Narrow-screen layout
    criteria: []
    steps:
      - Open the Entra form at 375 px.
    expected:
      - No horizontal scroll; the steps and the fields stay readable.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance at 375 px - the Entra form has no horizontal scroll.
  - id: S9
    title: People and groups of the test tenant
    criteria: []
    steps:
      - With the saved connection, open the People and group lists of the agent delegation.
      - Log in from a harness as a member, then as a guest.
    expected:
      - The lists show the test users and groups and no guest.
      - The member logs in; the guest is refused.
    last_run:
      date: null
      result: blocked
      notes: Needs the Entra test tenant (Backend 058, Resolved Decision 6).
---

# Functional test: Microsoft Entra ID Connection Form

S4 to S6 and S9 need the Entra test tenant of Backend 058.
