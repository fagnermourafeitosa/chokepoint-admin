---
spec: 041-2026-11-04-agent-report-only-mode
title: Agent Report-only Mode
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Put back the mode, review date and note of each agent that a scenario changes.
scenarios:
  - id: S1
    title: Switch to Report-only and back
    criteria: [1]
    steps:
      - Open an agent (support-assistant on the demo) and switch it to Report-only with a review date and a note.
      - Switch it back to Enforce.
    expected:
      - The dialog takes the optional review date and note; the agent shows Report-only, then Enforce.
      - The Enforce dialog says it is counting while the would-deny count loads.
    last_run:
      date: 2026-11-04
      result: passed
      notes: The conflict path (reload) by code inspection, same mapping as the kill switch.
  - id: S2
    title: Mode, review date and notice
    criteria: [2]
    steps:
      - Look at the agent list, the agent header and the notice of an agent in Report-only.
      - Change the review date, then remove it.
    expected:
      - Chips in the list and the header; the notice shows author, date and would-deny count.
      - Change date and Remove date work.
    last_run:
      date: 2026-11-04
      result: passed
      notes: The overdue chip by code inspection; no agent was overdue in the real data.
  - id: S3
    title: Report-only banner
    criteria: [3]
    steps:
      - Open Overview, Access and Investigate in Production, then in Sandbox.
      - Click View report, then Hide for this session, and change screens.
    expected:
      - The banner shows on every screen, with the stronger style in Production; it does not show in an environment without an agent in Report-only.
      - Hidden for the session across screens.
    last_run:
      date: 2026-11-04
      result: passed
      notes: The quiet state by code inspection; every agent in Report-only had would-deny calls in 7 days.
  - id: S4
    title: Would deny in Investigate
    criteria: [4]
    steps:
      - In Investigate, filter Would deny and open a would-deny call.
      - Open the Result menu at the start of a wrapped toolbar row.
    expected:
      - The WOULD DENY chip and the Report-only chip on the agent; problems and Deny never include would-deny calls.
      - The inspector shows Not blocked, Failed · not enforced, would deny count, Mode and Reference.
      - The filter menu opens whole.
    last_run:
      date: 2026-11-04
      result: passed
      notes: null
  - id: S5
    title: Inbox types
    criteria: [5]
    steps:
      - Open the Inbox and the Would deny item.
    expected:
      - The Would deny and Review due types are apart from Requests denied; the item shows its subject, note, context and the Investigate target.
    last_run:
      date: 2026-11-04
      result: passed
      notes: Review due by code inspection; its item was resolved by the backend during the test.
  - id: S6
    title: Overview metrics
    criteria: [6]
    steps:
      - Open Overview with agents in Report-only, then switch one more agent.
    expected:
      - Denied today counts blocked calls only; the Report-only metric shows the agent count; the traffic chart has the Would deny segment.
      - The metric updates without a reload after a mode change.
    last_run:
      date: 2026-11-04
      result: passed
      notes: The metric went from 2 to 3 agents.
  - id: S7
    title: Mode events in the revision history
    criteria: [7, 8]
    steps:
      - Open the revision history of an agent with mode changes (refunds-assistant on the demo).
    expected:
      - Mode events with author, time, note and review date; entry order, absolute UTC time, no filled selection, the eye dot; the diff across mode events; the path line is visible.
    last_run:
      date: 2026-11-04
      result: passed
      notes: Diff of Revision 6 against Revision 4.
  - id: S8
    title: Mobile width
    criteria: [9]
    steps:
      - Repeat the banner, Overview, Access header and notice, and Inbox rows at 375 px.
    expected:
      - Each screen works as section 10 states.
    last_run:
      date: 2026-11-04
      result: passed
      notes: null
---

# Functional test: Agent Report-only Mode

The 2026-11-04 run found and fixed one defect: the banner and the Inbox detail guard shared a React key in `AdminLayout`.
