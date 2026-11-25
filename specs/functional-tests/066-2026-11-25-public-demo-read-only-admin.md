---
spec: 066-2026-11-25-public-demo-read-only-admin
title: Read-only Admin of the Public Demo
stack:
  - dev-infra/up.sh with the sample on (ONBOARDING_SAMPLE_ secrets) and backend DEMO_WORKSPACE_ENABLED=true; admin dev server through Envoy at https://app.xokepoint.localhost. The demo instance has no public demo, so this file uses the development stack.
data: the demo workspace that the API creates at startup (Backend 107); the login xokepoint@example.com / xokepoint-demo-2026 of the platform realm.
scenarios:
  - id: S1
    title: The demo login opens the demo Sandbox, not the account area
    criteria: [1, 2]
    steps:
      - Sign in as xokepoint@example.com at https://app.xokepoint.localhost/login, desktop width
      - Type https://app.xokepoint.localhost/account/workspaces in the address bar
    expected:
      - After the login, the Admin of the workspace Xokepoint demo opens in Sandbox
      - The account path opens the Admin again
    last_run:
      date: 2026-11-25
      result: passed
      notes: "Built-in browser, 2259 px. After a sign-out and a new sign-in as xokepoint@example.com the Admin opened / (Overview, Xokepoint demo, Sandbox). /account/workspaces typed in the address bar opened / again."
  - id: S2
    title: Account is disabled in the profile menu of the demo
    criteria: [3]
    steps:
      - Signed in as the demo login, open the profile menu
    expected:
      - Account is shown disabled with the hint "Not available in the demo"
    last_run:
      date: 2026-11-25
      result: passed
      notes: "The profile menu shows Account as a disabled button with the title Not available in the demo; Sign out works."
  - id: S3
    title: Another user keeps the account area
    criteria: [4]
    steps:
      - Sign in as a seed user of the development stack and open the profile menu, then Account
    expected:
      - Account is a link and the account area opens
    last_run:
      date: null
      result: not_run
      notes: "Not run: no other platform login of the development stack at hand. Code inspection: for any other session isDemoSession is false, so the route renders Outlet and the menu renders the same Link as before."
  - id: S4
    title: The demo session shows the read-only notice on every screen
    criteria: [7]
    steps:
      - Signed in as the demo login, open Overview and Access
    expected:
      - Under the header, the notice Read-only demo with its line; on Access its edges match the content edges
    last_run:
      date: 2026-11-25
      result: passed
      notes: "Built-in browser, 2259 px. Overview and Access showed the notice; on Access the notice spans 426 to 1818 px, the content box of the page. On Overview the content is narrower by design (cp-admin-container--home), as for the Report-only banner."
---

# Functional test: Read-only Admin of the Public Demo
