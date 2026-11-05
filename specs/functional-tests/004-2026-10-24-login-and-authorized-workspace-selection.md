---
spec: 004-2026-10-24-login-and-authorized-workspace-selection
title: Login and Authorized Workspace Selection
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: The demo platform admin beatriz@acme.test.
scenarios:
  - id: S1
    title: Login and logout
    criteria: [1, 2, 6]
    steps:
      - Open a protected route signed out; click Continue to sign in; sign in as beatriz@acme.test with the one-time code (totp.py).
      - Sign out; press Back.
    expected:
      - No private content before the session is validated; the login goes through Keycloak and returns to a clean Admin route.
      - After logout, Back does not show the private screen.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance. Sign out led to /login; Back to /access went to /login with no private content; sign-in through Keycloak with the one-time code returned to /.
  - id: S2
    title: Workspace and environment switch
    criteria: [3, 5]
    steps:
      - Switch the environment, then the workspace.
    expected:
      - The choices come only from the server; the data of the old scope disappears before the new one renders.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance. Sandbox showed no agent; Production showed the four Acme agents again. Acme has one workspace, so a workspace switch was not exercised.
---

# Functional test: Login and Authorized Workspace Selection
