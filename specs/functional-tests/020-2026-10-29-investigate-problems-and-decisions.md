---
spec: 020-2026-10-29-investigate-problems-and-decisions
title: Investigate Problems and Decisions
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: S3 marks Inbox items Reviewed and Resolved; this state stays.
scenarios:
  - id: S1
    title: Views, filters and pagination
    criteria: [1, 2]
    steps:
      - Open By problem and All decisions; use the filters, the search and page 2; pick the Allow filter.
    expected:
      - The same server, tool and hour shows as separate problems for each reason.
      - The search returns only matching problems; page 2 works; Allow resets the page and lists the permits.
    last_run:
      date: 2026-10-30
      result: passed
      notes: null
  - id: S2
    title: Inspector evidence
    criteria: [3]
    steps:
      - Open a condition deny, a permit and an unreviewed-tool deny.
    expected:
      - The executed path and the configured expression show; source values and arguments never show.
      - The unreviewed-tool inspector shows the failed Tool review step and later steps Not evaluated.
      - Older rows show missing condition and path evidence explicitly.
    last_run:
      date: 2026-10-30
      result: passed
      notes: The step names changed in Admin 030 (four steps with the relation checked).
  - id: S3
    title: Review and resolution from the Inbox
    criteria: [5]
    steps:
      - Open an Inbox item in Investigate; leave with Cancel, then Keep reviewed; open another and Mark resolved.
    expected:
      - The item is Reviewed when it opens; the modal follows the specification; a resolved item does not reopen its workflow.
    last_run:
      date: 2026-10-30
      result: passed
      notes: null
  - id: S4
    title: No priority, no watching, no completeness warning
    criteria: [6]
    steps:
      - Look at the views and the inspector.
    expected:
      - No Priority, no Watching this problem, no recording-completeness warning.
    last_run:
      date: 2026-10-30
      result: passed
      notes: null
  - id: S5
    title: Narrow screen
    criteria: []
    steps:
      - Open the filters at 390 px.
    expected:
      - No horizontal scroll; the controls stay readable.
    last_run:
      date: 2026-10-30
      result: passed
      notes: null
---

# Functional test: Investigate Problems and Decisions

Migrated from the verification record of 2026-10-30. The contextual actions (criterion 4) are tested in [Admin 030](030-2026-10-31-investigate-agent-subject-and-token-exchanges.md), which replaced them.
