---
spec: 040-2026-11-04-quick-incident-help-tip
title: Quick Incident Help Tip
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Read-only.
scenarios:
  - id: S1
    title: No panel when Quick incident opens
    criteria: [1]
    steps:
      - Press / and then type k3f7.
    expected:
      - No help panel shows (it is hidden after / and after typing).
    last_run:
      date: 2026-11-04
      result: passed
      notes: null
  - id: S2
    title: Help tooltip
    criteria: [2]
    steps:
      - Hover the help icon; move keyboard focus to it.
    expected:
      - The tooltip shows on hover and on focus.
    last_run:
      date: 2026-11-04
      result: passed
      notes: Hover in the browser; keyboard focus by code inspection (design system Tooltip).
  - id: S3
    title: Messages under the field
    criteria: [3]
    steps:
      - Search k3f7 (format), k3f7-zzzz (not found) and a code with several matches.
    expected:
      - Each shows its message under the field.
    last_run:
      date: 2026-11-04
      result: blocked
      notes: Format and not found passed; several matches only by code inspection, because no environment has two equal codes.
---

# Functional test: Quick Incident Help Tip
