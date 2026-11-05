---
spec: 044-2026-11-05-sober-visual-system
title: Sober Visual System
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Read-only.
scenarios:
  - id: S1
    title: Primary buttons, yellow and selected tone on every screen
    criteria: [1, 2, 4, 5]
    steps:
      - Open the Admin sign-in, Overview, Access (agent list, delegation graph and list, Identity), Investigate (list and inspector), Integrations and Quick incident.
    expected:
      - The primary button is ink with cream text and a grey shadow.
      - Yellow shows only in the wordmark, the active primary navigation item and text selection.
      - Section navigation, inner tabs, toggles, pressed buttons, the selected agent and the agent node use the neutral selected tone.
      - Danger-soft buttons are outlined in red.
    last_run:
      date: 2026-11-05
      result: passed
      notes: null
  - id: S2
    title: Outcome colors keep their labels
    criteria: [3]
    steps:
      - Look at the traffic chart, the sparklines, outcome chips, path dots, policy results and the denied count.
    expected:
      - Allowed is green and denied is red; each keeps its text label.
    last_run:
      date: 2026-11-05
      result: passed
      notes: null
  - id: S3
    title: Xokepoint name on sign-in pages
    criteria: [6]
    steps:
      - Open the Admin sign-in page, then the Keycloak sign-in page.
      - Read the help texts of the screens of S1.
    expected:
      - Both pages show the Xokepoint wordmark and name; user-visible help text says Xokepoint.
    last_run:
      date: 2026-11-05
      result: passed
      notes: null
---

# Functional test: Sober Visual System
