---
spec: 008-2026-10-25-customer-oidc-connection-management
title: Customer OIDC Connection Management
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Delete the temporary connection after the run.
scenarios:
  - id: S1
    title: Identity connection CRUD
    criteria: [1, 3, 4]
    steps:
      - Open Access › Integrations › Identity providers (URL with ?type=identity).
      - Create a temporary connection, edit it, check it, disable it, delete it.
    expected:
      - Each step works and the list updates; no console error.
    last_run:
      date: 2026-10-25
      result: passed
      notes: The Keycloak form changed in Admin 017.
---

# Functional test: Customer OIDC Connection Management
