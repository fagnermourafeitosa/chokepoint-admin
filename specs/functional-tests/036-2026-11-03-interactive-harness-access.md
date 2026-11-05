---
spec: 036-2026-11-03-interactive-harness-access
title: Interactive Harness Access
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
  - Harness login of the demo - realm acme, login client acme-harness-login, group Finance (refunds-assistant)
  - A harness; the CLI run is in dev-infra/functional-tests/harness-cli.md
data: Restore the Harness login settings, the blocked people and the sessions that a scenario changes.
scenarios:
  - id: S1
    title: Harness login block of the agent
    criteria: [1, 2, 3]
    steps:
      - Open the agent, Delegation and access, the Harness login block.
      - Try to publish without a group; pick a group from the groups read; block a person and publish.
    expected:
      - Publish is refused without a group; the rule box says that only members of the groups can log in.
      - Groups come from the groups read.
      - The block is part of the draft and is published as a revision.
    last_run:
      date: 2026-11-03
      result: passed
      notes: Published as revision 8. The Not found mark of a missing group and the history entry by code inspection.
  - id: S2
    title: Harness login card of the Identity view
    criteria: [4]
    steps:
      - Open the agent Identity view.
    expected:
      - The Harness login card is the second card, with one MCP URL line for each server of the agent and the catalog buttons.
    last_run:
      date: 2026-11-03
      result: passed
      notes: One URL line for each server is a recorded deviation (Further Notes of the specification).
  - id: S3
    title: Harness sessions and revoke
    criteria: [5]
    steps:
      - Log in from a harness, then open Harness sessions and revoke one machine.
    expected:
      - The view lists people and machines; the revoked machine leaves the list.
    last_run:
      date: 2026-11-03
      result: passed
      notes: null
  - id: S4
    title: Harness login section of the identity connection form
    criteria: [6]
    steps:
      - Open the Keycloak identity connection form.
    expected:
      - The Harness login section is there, with no groups claim field.
    last_run:
      date: 2026-11-03
      result: passed
      notes: null
  - id: S5
    title: Authorization server pages
    criteria: [7]
    steps:
      - Log in from a harness as a member (consent, connected), as a blocked person and with a client that is not allowed.
    expected:
      - The consent, connected, blocked and not-allowed pages match section 5.
    last_run:
      date: 2026-11-03
      result: passed
      notes: Provider and agent choice by backend unit tests.
  - id: S6
    title: Help on hover and focus
    criteria: [8]
    steps:
      - Hover and focus each help of the screens above.
    expected:
      - Each help opens.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance, refunds-assistant. Keyboard focus showed the tooltip of each of the 49 help triggers of Identity, Harness sessions and Delegation and access (with the Acme Identity panel); a real pointer hover showed it too.
---

# Functional test: Interactive Harness Access
