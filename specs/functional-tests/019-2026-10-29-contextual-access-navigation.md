---
spec: 019-2026-10-29-contextual-access-navigation
title: Contextual Access Navigation
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Read-only. Navigation never saves or publishes.
scenarios:
  - id: S1
    title: Signal target opens Access in context and survives refresh
    criteria: [2, 4, 5]
    steps:
      - From an Inbox signal, open its Access target.
      - Refresh the page; go back to the list.
    expected:
      - Access opens the exact agent, server and tool of the target; nothing is saved or published.
      - The deep link works after refresh; the signal state and the list position return without a duplicate modal.
    last_run:
      date: 2026-10-30
      result: passed
      notes: The run used the group model; the targets now open the agent panels of Admin 030.
---

# Functional test: Contextual Access Navigation

Criteria 1 and 3 named groups and policies of the old permission model. [Admin 026](../026-2026-10-31-agent-delegation-editor.md) replaced it, and [Admin 030](030-2026-10-31-investigate-agent-subject-and-token-exchanges.md) tests the actions that open the agent panels.
