---
spec: 006-2026-10-25-agent-crud-integration
title: Agent CRUD Integration
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Use a temporary agent and delete it after the run.
scenarios:
  - id: S1
    title: Appearance selector
    criteria: [3, 4]
    steps:
      - Open New agent; open the appearance selector at the top of the modal.
    expected:
      - The layer opens with the upload button first and the Lucide catalog; the modal keeps its size.
    last_run:
      date: 2026-10-25
      result: passed
      notes: null
  - id: S2
    title: Create, edit with an image, delete
    criteria: [1, 3, 4, 5, 7]
    steps:
      - Create a temporary agent with a library icon; edit it and upload a small image; delete it.
    expected:
      - The agent persists with its icon, then its image, in the list and the details; the delete asks for confirmation.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance. ft-temp-agent created with the shield icon; edit with a 64 px PNG showed the image in the list and the header; the delete dialog explained the soft delete; the list went back to four agents.
---

# Functional test: Agent CRUD Integration
