---
spec: 045-2026-11-06-inbox-item-status-without-exit-guard
title: Inbox Item Status Without an Exit Guard
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: S2, S3 and S4 mark Inbox items Reviewed and Resolved; this state stays (the Admin has no reopen). Use items of a condition deny on refund_order and any other Open item.
scenarios:
  - id: S1
    title: Open the rule opens the rule, from Investigate and from the Inbox
    criteria: [1, 2]
    steps:
      - In Investigate › By problem, open a "A policy condition was not met" problem; click Open the rule.
      - In Access, click Overview in the primary navigation; then go back to the inspector and click Back to the list.
      - In the Overview Inbox, click the action of a requests-denied item; in the inspector, click Open the rule.
    expected:
      - No dialog opens at any step; Access shows the agent, the server tool and its rule.
      - No URL in the address bar contains signal_id.
    last_run:
      date: null
      result: not_run
      notes: null
  - id: S2
    title: Reviewed when the item is opened
    criteria: [3, 4]
    steps:
      - In the Inbox (filter Open), note an Open item and click its action; return to the Overview.
      - In Investigate › By problem, open a problem whose Inbox item is Open.
    expected:
      - The destination opens at once; the Inbox row then shows Reviewed.
      - The inspector header shows "Inbox item" with Reviewed.
    last_run:
      date: null
      result: not_run
      notes: null
  - id: S3
    title: Mark resolved in the inspector and in the Inbox
    criteria: [5]
    steps:
      - In an inspector with a Reviewed item, click Mark resolved.
      - In the Inbox, click Mark resolved on another row; select the Resolved filter.
      - Open the inspector of a Resolved item again.
    expected:
      - The chip shows Resolved without a confirmation; the button disappears.
      - The resolved rows are in the Resolved filter with the chip only.
      - Viewing a Resolved item keeps it Resolved.
    last_run:
      date: null
      result: not_run
      notes: null
  - id: S4
    title: Resolve failure
    criteria: [5]
    steps:
      - Block the resolve request (browser offline mode or a stopped API), then click Mark resolved.
    expected:
      - An alert says the item could not be resolved, with Retry; the chip keeps the previous status.
    last_run:
      date: null
      result: not_run
      notes: null
---

# Functional test: Inbox Item Status Without an Exit Guard

The scenarios check that navigation never opens a dialog and that the status of an Inbox item changes only by opening it (Reviewed) or by Mark resolved.
