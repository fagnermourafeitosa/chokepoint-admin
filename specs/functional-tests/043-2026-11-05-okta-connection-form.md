---
spec: 043-2026-11-05-okta-connection-form
title: Okta Connection Form
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
  - backend/dev.sh on 127.0.0.1:8081, with the Okta provider of Backend 059 in the catalog
  - The Okta test org of Backend 059 (S4 to S6)
data: Access › Integrations › Identity providers. Delete a connection that a scenario saves, unless the user keeps it.
scenarios:
  - id: S1
    title: Okta card, form fields and setup steps
    criteria: [1, 2, 3]
    steps:
      - Open Access › Integrations › Identity providers.
      - Open the Okta card.
      - Open each link of the four setup steps.
    expected:
      - Card order Keycloak, Microsoft Entra ID, Okta, then Google Workspace in its own group.
      - The form has the fields of Solution 2 and no Keycloak-only, Entra-only or Google-only field.
      - Each link opens in a new tab and answers 200.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Against the Backend 059 API.
  - id: S2
    title: Headless switch
    criteria: [4]
    steps:
      - Turn the headless switch on, then off.
      - Save with the switch off.
    expected:
      - The headless fields show only with the switch on.
      - The save request has no token_issuer.
    last_run:
      date: 2026-11-05
      result: passed
      notes: The switch in the browser; the payload without token_issuer by code inspection.
  - id: S3
    title: Wrong org check message
    criteria: [6]
    steps:
      - Type an org URL that is not an Okta org, and run Check connection.
    expected:
      - The wrong org message of Solution 6 shows.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Verified against Okta.
  - id: S4
    title: Other check messages on the test org
    criteria: [6]
    steps:
      - On the test org, run Check connection with only okta.users.read, okta.groups.read and Read-only Administrator, with DPoP required on the app.
      - Produce a wrong client ID, a key of another app, a missing scope and a missing role.
    expected:
      - The check passes with the minimal permissions.
      - Each message of Solution 6 shows its text.
    last_run:
      date: null
      result: blocked
      notes: Needs the Okta test org.
  - id: S5
    title: Stored private key masking
    criteria: [5]
    steps:
      - Save a connection on the test org, then open it again.
      - Change the org URL or the client ID.
    expected:
      - The stored private key is never shown; replacing it needs Change.
      - A change of the org URL or the client ID asks for the key again.
    last_run:
      date: null
      result: blocked
      notes: Needs a saved connection on the Okta test org.
  - id: S6
    title: Harness login with the test org
    criteria: [7]
    steps:
      - Turn on Harness login on the saved connection and publish the agent group.
      - Log in from a harness as a person of the test org.
    expected:
      - The person logs in through the saved connection.
    last_run:
      date: null
      result: blocked
      notes: Needs the Okta test org.
  - id: S7
    title: Other identity forms unchanged
    criteria: [8]
    steps:
      - Open the Microsoft Entra ID, Keycloak and Google forms.
    expected:
      - Each form keeps its sections and steps, with one footer line.
    last_run:
      date: 2026-11-05
      result: passed
      notes: null
  - id: S8
    title: Narrow-screen layout
    criteria: []
    steps:
      - Open the Okta form at 375 px.
    expected:
      - No horizontal scroll; the steps and the fields stay readable.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance at 375 px - the Okta form has no horizontal scroll.
  - id: S9
    title: People and groups of the test org
    criteria: [7]
    steps:
      - With the saved connection, open the People and group lists of the agent delegation.
      - Log in from a harness as a member, then as a person not assigned to the login app.
    expected:
      - The People list shows the members, a SUSPENDED user as inactive, and no deprovisioned user; the groups list shows OKTA_GROUP groups and no Everyone group.
      - The eligible agents of the member follow the groups; Okta refuses the person not assigned to the login app.
    last_run:
      date: null
      result: blocked
      notes: Needs the Okta test org (Backend 059, Resolved Decision 7).
---

# Functional test: Okta Connection Form

S4 to S6 and S9 need the Okta test org of Backend 059.
