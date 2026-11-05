---
spec: 031-2026-11-02-agent-kill-switch
title: Agent Kill Switch
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Enable the agent again at the end.
scenarios:
  - id: S1
    title: Disable and enable the agent
    criteria: [1, 2]
    steps:
      - Get a Chokepoint token for an Acme agent.
      - Click Disable agent; call a tool with the token; request a new token exchange.
      - Click Enable agent and call again.
    expected:
      - The header shows Disabled; the old token gets HTTP 401; the new exchange gets invalid_client.
      - After Enable, the header shows Active and the calls work with the same delegations and key.
    last_run:
      date: 2026-11-02
      result: passed
      notes: null
  - id: S2
    title: Stale revision
    criteria: [2]
    steps:
      - Change the agent status in another tab, then click Disable agent or Enable agent in the first tab.
    expected:
      - The conflict shows with Reload, which loads the current status.
    last_run:
      date: 2026-11-02
      result: passed
      notes: null
---

# Functional test: Agent Kill Switch

The terminal calls are the same as case F of [the authorization test](../../../dev-infra/functional-tests/authorization.md).
