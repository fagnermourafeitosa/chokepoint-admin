---
spec: 067-2026-11-27-direct-sign-in-and-landing
title: Direct Sign-in and Landing
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test
data: Beatriz Nunes and the workspace Acme. S4 needs an account with no workspace of the demo instance, created through the sign-up only if the user approves it; otherwise it is checked by code inspection. S6 runs against the public demo login of production (Backend 107), read only.
scenarios:
  - id: S1
    title: Sign-in opens Keycloak with no click and lands on the Overview
    criteria: [1, 3]
    steps:
      - Signed out, open /login
      - Sign in as beatriz@acme.test with the one-time code
    expected:
      - The Keycloak sign-in opens with no click on an Admin page
      - The Admin opens / with the Overview of Acme, in Sandbox; the account area does not show
    last_run:
      date: null
      result: not_run
      notes: ""
  - id: S2
    title: Sign-up opens the Keycloak registration with no click
    criteria: [1]
    steps:
      - Signed out, open /signup
    expected:
      - The Keycloak registration opens with no click on an Admin page
    last_run:
      date: null
      result: not_run
      notes: ""
  - id: S3
    title: A failed sign-in stays on the error
    criteria: [2]
    steps:
      - Signed out, open /login?error=authentication_failed
      - Click Try again
    expected:
      - The page shows the error text and Try again, and stays
      - Try again opens the Keycloak sign-in
    last_run:
      date: null
      result: not_run
      notes: ""
  - id: S4
    title: An account with no workspace lands on the onboarding
    criteria: [4]
    steps:
      - Sign in with an account that has no workspace
    expected:
      - The Admin opens /onboarding/workspace
    last_run:
      date: null
      result: not_run
      notes: ""
  - id: S5
    title: Sign-out opens the site
    criteria: [5]
    steps:
      - Signed in, open the profile menu and sign out
    expected:
      - The browser opens the home of the site
    last_run:
      date: null
      result: not_run
      notes: ""
  - id: S6
    title: The demo login lands on the demo Sandbox
    criteria: [6]
    steps:
      - Sign in with the public demo login of the site
    expected:
      - The Overview of the demo workspace, in Sandbox, with the read-only notice
    last_run:
      date: null
      result: not_run
      notes: ""
  - id: S7
    title: A Slack link opened while signed out returns to the signal
    criteria: [7]
    steps:
      - Signed out, open /inbox/<signal id> of an Acme signal
      - Sign in
    expected:
      - The Inbox opens on that signal
    last_run:
      date: null
      result: not_run
      notes: ""
---

# Functional test: Direct Sign-in and Landing

