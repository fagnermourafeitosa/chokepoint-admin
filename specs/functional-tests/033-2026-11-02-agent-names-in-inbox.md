---
spec: 033-2026-11-02-agent-names-in-inbox
title: Agent Names in the Inbox
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Read-only. The fallback is checked by removing agent_name from the responses inside the page.
scenarios:
  - id: S1
    title: Agent name in denied items
    criteria: [1]
    steps:
      - Open the Inbox with a Denied requests item and a Denied token exchanges item.
      - Remove agent_name from the responses inside the page and reload the list.
    expected:
      - Both items show the agent name; without the name, the agent ID.
    last_run:
      date: 2026-11-02
      result: passed
      notes: null
---

# Functional test: Agent Names in the Inbox
