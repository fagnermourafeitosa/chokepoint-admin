---
spec: 011-2026-10-28-keycloak-authentication-experience
title: Keycloak Authentication Experience
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Do not finish a registration; no new platform user is created.
scenarios:
  - id: S1
    title: Themed login and registration pages
    criteria: [1, 2, 3]
    steps:
      - From the Admin, click Continue to sign in; then go back and open the signup.
    expected:
      - The Keycloak login and registration pages use the theme; the form actions, the navigation and the localization are unchanged.
    last_run:
      date: 2026-10-28
      result: passed
      notes: Unnumbered criteria; numbers are list positions. The navigation from the Admin signup to the registration form was verified.
  - id: S2
    title: Keyboard, focus, errors and responsive layout
    criteria: [5]
    steps:
      - Use the login page with the keyboard only; submit a wrong password; open it at 375 px.
    expected:
      - Visible focus; the error shows; no horizontal scroll.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Keycloak sign-in at 375 px - no horizontal scroll; Tab moves focus with a 3px outline; a wrong password shows Invalid username or password.
---

# Functional test: Keycloak Authentication Experience

The wordmark of the theme changed in [Admin 044](../044-2026-11-05-sober-visual-system.md).
