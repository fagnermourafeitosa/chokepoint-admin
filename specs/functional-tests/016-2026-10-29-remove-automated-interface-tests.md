---
spec: 016-2026-10-29-remove-automated-interface-tests
title: Remove Automated Interface Tests
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Read-only.
scenarios:
  - id: S1
    title: Styled annotation tags in the tool rows
    criteria: [9]
    steps:
      - Open Access › Integrations › Custom, the details of an Acme server (for example Acme Analytics).
    expected:
      - The annotation tags have padding, radius and bold weight; read-only tags use the green variant; the tag group wraps.
      - No console error.
    last_run:
      date: 2026-10-29
      result: passed
      notes: Server "Local catalog" in Development Workspace A / Sandbox. 12 tags with padding 4px 8px and radius 6px.
---

# Functional test: Remove Automated Interface Tests
