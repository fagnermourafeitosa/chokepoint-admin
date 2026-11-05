---
spec: 034-2026-11-02-integrations-one-read-per-server
title: Integrations with One Mapping Read for Each Server
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Discard or approve unchanged each draft that the run writes, so the mapping of run_report stays the same document.
scenarios:
  - id: S1
    title: One read when the server details open
    criteria: [1, 2]
    steps:
      - Open Access › Integrations and the details of an Acme server (for example Acme Analytics); watch the network requests.
    expected:
      - One resource types request and no tool mapping request.
      - Each tool shows the same Resource line, chip and note as before.
    last_run:
      date: 2026-11-02
      result: passed
      notes: null
  - id: S2
    title: Configure resource of one tool
    criteria: [3]
    steps:
      - Click Configure resource on run_report; save a draft, discard it; save again and approve.
    expected:
      - Only the tool mapping of that tool is read; save, discard and approve update the line.
    last_run:
      date: 2026-11-02
      result: passed
      notes: null
---

# Functional test: Integrations with One Mapping Read for Each Server
