---
spec: 009-2026-10-26-authorization-management-workbench
title: Authorization Management Workbench
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Remove the mapping state that the run creates; revisions stay monotonic.
scenarios:
  - id: S1
    title: COAZ mapping lifecycle
    criteria: [3, 5]
    steps:
      - Open a tool mapping; look at the sample list projection; save, review and approve; discard a draft; remove the active mapping.
    expected:
      - Sample, saved, approved and effective results are distinct; each step works; no console error.
    last_run:
      date: 2026-10-26
      result: passed
      notes: null
  - id: S2
    title: Context sources
    criteria: [3, 4]
    steps:
      - Open Access › Context sources; create a manual GET source and an OpenAPI import; bind an attribute.
    expected:
      - Import describes operations and does not validate a live source; credentials never show after save.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance. ft-temp-source on the Acme directory origin; OpenAPI import listed GET /employees/{subject} and filled the path, attribute and pointer; sample extraction; binding saved as Draft only; the credential field shows Saved credential, never the value. Draft discarded and source deleted (inline Confirm deletion, enabled only without bindings).
---

# Functional test: Authorization Management Workbench

The people, grants and policy editors were replaced by [Admin 026](../026-2026-10-31-agent-delegation-editor.md).
