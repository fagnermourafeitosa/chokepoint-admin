---
spec: 061-2026-11-16-inbox-categories
title: Inbox Categories
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test
data: The Acme Production Inbox after traffic.py, with Requests denied and Tool discovery signals at least.
scenarios:
  - id: S1
    title: Tabs split the Inbox by category with their counts
    criteria: [1, 2, 4]
    steps:
      - Open the Overview and look at the Inbox.
      - Click Security, then Access, then Operations, then All.
    expected:
      - Each tab shows its open count, and All shows the total.
      - Security lists only Lethal trifecta, Behavior drift and Tool discovery; Access only Requests denied, Token exchange denied, Would deny and Review due; Operations only Server disconnected; All lists every signal.
    last_run:
      date: null
      result: not_run
      notes: ""
  - id: S2
    title: The type filter follows the tab
    criteria: [3, 4]
    steps:
      - In All, filter by Requests denied.
      - Click Security.
    expected:
      - The type filter resets to All types and offers only the Security types.
    last_run:
      date: null
      result: not_run
      notes: ""
---

# Functional test: Inbox Categories
