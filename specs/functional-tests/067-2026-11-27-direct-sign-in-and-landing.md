---
spec: 067-2026-11-27-direct-sign-in-and-landing
title: Direct Sign-in and Landing
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test
data: Beatriz Nunes and the workspace Acme on the demo instance. S2, S4, S6 and S7 run on the development stack (Admin of the branch on 5173, API on 8081), because the local Envoy checks a sign-up against the development API and the demo instance has no account without a workspace and no public demo login; they use the seed users admin-both and no-access and the public demo login, and create no account. Between two users, end the Keycloak session of the first one, or Keycloak refuses the second.
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
      date: 2026-11-27
      result: passed
      notes: "Demo instance, Admin of this branch on 5174 and API of Backend 108 on 8082. Signed out, /login opened the Keycloak sign-in with no click (the request carries prompt=login). Signed in as beatriz@acme.test: the Admin opened / with the Overview of Acme, in Sandbox; the account area did not show. Also on the development stack: Sign in on the local site home opened Keycloak with no Admin page, and admin-both (Development Workspace A and B) landed on / with Development Workspace A, the first listed, in Sandbox."
  - id: S2
    title: Sign-up opens the Keycloak registration with no click
    criteria: [1]
    steps:
      - Signed out, open /signup
    expected:
      - The Keycloak registration opens with no click on an Admin page
    last_run:
      date: 2026-11-27
      result: passed
      notes: "Development stack (Admin of this branch on 5173, API of Backend 108 on 8081): /signup opened the Keycloak form Create your account with no click. On the demo instance the form answers 403, because the local Envoy asks the development API, not the demo API, whether the sign-up was started; not related to this change."
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
      date: 2026-11-27
      result: passed
      notes: "Demo instance: /login?error=authentication_failed showed Sign in, the error and Try again, and stayed; Try again opened the Keycloak sign-in."
  - id: S4
    title: An account with no workspace lands on the onboarding
    criteria: [4]
    steps:
      - Sign in with an account that has no workspace
    expected:
      - The Admin opens /onboarding/workspace
    last_run:
      date: 2026-11-27
      result: passed
      notes: "Development stack, seed user no-access (no workspace): the sign-in landed on /onboarding/workspace with Create your workspace. No account was created."
  - id: S5
    title: Sign-out ends the Keycloak session and opens the site; another account then signs in
    criteria: [5]
    steps:
      - Signed in, open the profile menu and sign out
      - On the site, click Sign in and sign in with another account
    expected:
      - The browser passes through the Keycloak end-session page with no confirmation and opens the home of the site
      - The other account signs in in the same browser, with no Keycloak error
    last_run:
      date: 2026-11-27
      result: passed
      notes: "Development stack with Backend 108 (migration applied) and the client setting post.logout.redirect.uris applied to the local Keycloak with the JSON of the realm sync (the other attributes, such as PKCE, stayed). admin-both signed in and signed out: the browser went through the Keycloak end-session page with no confirmation to https://xokepoint.localhost/en. Then Sign in on the site home and no-access signed in in the same browser and landed on the onboarding; its Sign out on the onboarding page opened the site too. Signed in again and waited 5.5 minutes, past the 5-minute life of the ID token: the sign-out still passed with no confirmation, and Keycloak listed 0 sessions for admin-both afterwards. A session opened before the change (no ID token) showed the Keycloak confirmation, whose form the form-action policy blocked; Backend 108 now sends such a session straight to the site, checked by unit test."
  - id: S6
    title: The demo login lands on the demo Sandbox
    criteria: [6]
    steps:
      - Sign in with the public demo login of the site
    expected:
      - The Overview of the demo workspace, in Sandbox, with the read-only notice
    last_run:
      date: 2026-11-27
      result: passed
      notes: "Development stack, public demo login xokepoint@example.com: the Admin opened / with the Overview of Xokepoint demo, in Sandbox, with the Read-only demo notice."
  - id: S7
    title: A Slack link opened while signed out returns to the signal
    criteria: [7]
    steps:
      - Signed out, open /inbox/<signal id> of an Acme signal
      - Sign in
    expected:
      - The Inbox opens on that signal
    last_run:
      date: 2026-11-27
      result: passed
      notes: "Development stack, demo login: signed out, /inbox/<signal>?workspace=<tenant>&environment=<environment> opened the Keycloak sign-in; after it the Admin opened the target of the signal (Investigate, token exchanges of refunds-assistant, no_delegation)."
  - id: S8
    title: Back from Keycloak returns to the page before the sign-in
    criteria: [1]
    steps:
      - Open the site home, then /login
      - On the Keycloak sign-in, press Back
    expected:
      - The browser returns to the site home; the sign-in does not start again
    last_run:
      date: 2026-11-27
      result: passed
      notes: "Demo instance: site home, /login, Keycloak, Back: the browser returned to https://xokepoint.localhost/en. Opening /login again still went to Keycloak with no click."
---

# Functional test: Direct Sign-in and Landing

