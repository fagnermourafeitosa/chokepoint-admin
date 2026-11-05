---
spec: 035-2026-11-02-subject-names-in-inbox
title: Subject Names in the Inbox
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: No local signal names a subject; the last run added a subject and a name to the responses inside the page only. No data changes.
scenarios:
  - id: S1
    title: Subject name of a denied token exchanges item
    criteria: [1, 2]
    steps:
      - Open the Inbox with a denied token exchanges item that has a subject with a name, then one without a name.
      - Click its Investigate link.
    expected:
      - The item shows the name, or the raw subject when the name is missing.
      - The Investigate link is unchanged.
    last_run:
      date: 2026-11-02
      result: passed
      notes: Responses changed inside the page; accepted by the user.
---

# Functional test: Subject Names in the Inbox
