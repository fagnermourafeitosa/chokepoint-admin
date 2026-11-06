---
spec: 021-2026-10-29-overview-dashboard
title: Overview Dashboard
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: S3 marks Inbox items Reviewed and Resolved; this state stays.
scenarios:
  - id: S1
    title: Metrics and traffic chart
    criteria: [1, 2]
    steps:
      - Open Overview after some allowed and denied calls today.
      - Hover and focus the traffic chart.
    expected:
      - Three current metrics with real values, no priority UI.
      - The chart covers exactly 24 UTC hours with clipped boundary buckets; yesterday uses the matching UTC interval; the tooltip shows on hover and keyboard focus.
    last_run:
      date: 2026-10-30
      result: passed
      notes: null
  - id: S2
    title: Most denied and unused tools
    criteria: [3, 6]
    steps:
      - Click a Most denied row and an unused tool.
    expected:
      - Each opens its real context; unused tools count once for each server and tool; the unused-tools detail states what its indicator does not prove.
    last_run:
      date: 2026-10-30
      result: passed
      notes: Most denied now groups by agent (Admin 030).
  - id: S3
    title: Inbox filters, review and resolution
    criteria: [4, 5]
    steps:
      - Use each status and type filter and the pager of the Inbox.
      - Open an item from its Inbox action, then return; click Mark resolved on another row.
    expected:
      - The Inbox defaults to Open and Reviewed.
      - Opening an item makes it Reviewed without a dialog; Mark resolved stores the actor and time and moves the item to Resolved (Admin 045).
    last_run:
      date: 2026-11-06
      result: passed
      notes: Rewritten for Admin 045; run with the Admin 045 scenarios S2 and S3.
  - id: S4
    title: Errors, scope and narrow screen
    criteria: []
    steps:
      - Switch the environment; let the session expire; open Overview at 390 px.
    expected:
      - The data follows the scope; expiry leads to sign-in without repeated private requests; no horizontal scroll.
    last_run:
      date: 2026-10-30
      result: passed
      notes: The session expiry loop was found and fixed in this run.
---

# Functional test: Overview Dashboard

Migrated from the verification record of 2026-10-30 ([`docs/verification/2026-10-30-investigation-overview.md`](../../docs/verification/2026-10-30-investigation-overview.md)).
