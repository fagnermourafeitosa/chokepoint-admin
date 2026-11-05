---
spec: 005-2026-10-24-first-workspace-onboarding
title: First Workspace Onboarding
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: S2 needs a new platform user; ask the user before any signup.
scenarios:
  - id: S1
    title: Signup navigation
    criteria: [1]
    steps:
      - Open /signup and click Continue to sign up; then the Sign in link.
    expected:
      - Continue to sign up opens the Keycloak registration form; Sign in opens /login.
    last_run:
      date: 2026-10-28
      result: passed
      notes: Unnumbered criteria; numbers are list positions. Run with Admin 011.
  - id: S2
    title: First workspace
    criteria: [1, 2]
    steps:
      - Finish a signup, fill the onboarding form, submit twice.
    expected:
      - One workspace is created; Sandbox and Production come from the backend.
    last_run:
      date: null
      result: blocked
      notes: Needs a new platform user, which needs the user's consent.
---

# Functional test: First Workspace Onboarding
