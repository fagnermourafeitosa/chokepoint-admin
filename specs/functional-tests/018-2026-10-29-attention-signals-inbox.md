---
spec: 018-2026-10-29-attention-signals-inbox
title: Attention Signals Inbox
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: S2 marks a signal as reviewed; this state stays.
scenarios:
  - id: S1
    title: Overview counters and Inbox paging
    criteria: [1, 2, 6]
    steps:
      - Open Overview; compare the counters with the backend values.
      - Page through the Inbox; use the type filter.
    expected:
      - The counters show the backend values.
      - 5 rows for each page; the pager follows the type filter.
      - No page title, no New agent button, no search button, no recent changes block.
    last_run:
      date: 2026-10-30
      result: passed
      notes: The status filters are in Admin 021 (the Inbox defaults to Open and Reviewed).
  - id: S2
    title: Action opens the target
    criteria: [3, 4]
    steps:
      - Click the action of a row.
    expected:
      - The target page opens and the signal is reviewed; unknown route names are not linked.
    last_run:
      date: 2026-10-30
      result: passed
      notes: null
  - id: S3
    title: Empty, loading, error and narrow width
    criteria: [7]
    steps:
      - Open the Inbox with no signal, while loading, with a failed read, and at a narrow width.
    expected:
      - Each state shows as specified; the page works at a narrow width.
    last_run:
      date: 2026-10-30
      result: passed
      notes: Listed as manual checks; their individual results were not recorded.
---

# Functional test: Attention Signals Inbox
