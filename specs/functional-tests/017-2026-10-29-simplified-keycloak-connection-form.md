---
spec: 017-2026-10-29-simplified-keycloak-connection-form
title: Simplified Keycloak Connection Form
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: S3 removes view-clients from the directory service account in Keycloak; give the role back after the run.
scenarios:
  - id: S1
    title: Create with one check
    criteria: [1, 2, 3]
    steps:
      - Create a Keycloak connection with name, issuer, audience, directory client ID and secret.
      - Click Check connection; pick the issuing client; save.
    expected:
      - No SCIM API URL or token endpoint input.
      - Checking… with the form locked, then Connection verified.
      - The issuing client select is disabled before the check, then lists only non-internal clients (chokepoint-test-user); the connection saves with status Verified.
    last_run:
      date: 2026-10-29
      result: passed
      notes: null
  - id: S2
    title: Edit
    criteria: [3]
    steps:
      - Open the saved connection; change the secret.
    expected:
      - The saved issuing client shows; changing the secret clears the list until the next check.
    last_run:
      date: 2026-10-29
      result: passed
      notes: null
  - id: S3
    title: Missing view-clients
    criteria: [4]
    steps:
      - Remove view-clients from the service account and click Check connection.
    expected:
      - The message names view-clients; the select stays disabled; the status shows Not checked; save is blocked.
    last_run:
      date: 2026-10-29
      result: passed
      notes: The run found and fixed a stale Connection verified status. The clients_unavailable message by code inspection.
  - id: S4
    title: Notices
    criteria: [5]
    steps:
      - Hover the help next to Check connection.
    expected:
      - The help opens on hover; only the administrative access notice stays visible.
    last_run:
      date: 2026-10-29
      result: passed
      notes: The Lifecycle sync help was removed by Admin 028.
---

# Functional test: Simplified Keycloak Connection Form
