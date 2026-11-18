---
spec: 060-2026-11-16-behavior-drift-inbox
title: Behavior Drift in the Inbox
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test
data: In Barricade, Acme Production is set to a learning period of 1 day and known after 1 day so that the demo history is a pattern; restore the market defaults (7 and 2) after the run. The scenarios add calls with traffic.py runs aimed at one agent.
scenarios:
  - id: S1
    title: A spike shows its numbers
    criteria: [1, 5, 7]
    steps:
      - Run more than 5 times the p90 of the hourly windows with calls of one tool of one agent, and at least 20 calls, in one hour (Backend 104).
      - After the next hourly job, open the Inbox and filter by Behavior drift.
      - Click the action of the row.
    expected:
      - A Medium row says "{agent} called {tool} far more than usual" and its note gives the count and the p90 of its pattern.
      - Investigate opens filtered by the agent, the tool and the hour.
    last_run:
      date: 2026-11-18
      result: passed
      notes: "40 get_order calls of rafael through refunds-assistant in one hour: Medium row \"refunds-assistant called get_order far more than usual\", note \"40 calls in this hour; its p90 in an hour is 4.\" (Backend 104). Investigate opened All decisions filtered by agent, tool and 19:00-20:00, 40 records. The hour was detected at once by a one-off run of the job against the demo database."
  - id: S2
    title: A new tool nobody called is High
    criteria: [1, 2, 3, 7]
    steps:
      - Call, through one agent, a granted tool that no agent of Production called in the period.
      - After the next hourly job, open the Inbox.
    expected:
      - A High row says "{agent} called {tool} for the first time" and "No agent in this environment called this tool in the period."
      - When another agent has call conditions on the tool and this one has none, the note adds that sentence.
    last_run:
      date: 2026-11-16
      result: passed
      notes: "get_issue of issues-manager, never called in Production: High row \"called get_issue for the first time\", note \"No agent in this environment called this tool in the period. The tool is high in Brings untrusted content.\" (sensitive leg). The conditions_elsewhere sentence was not exercised: no other agent has conditions on get_issue."
  - id: S3
    title: A new sequence names both tools
    criteria: [1, 7]
    steps:
      - As one person, call one tool of an agent several times in a row, then another tool in an order not seen in the pattern.
      - After the next hourly job, open the Inbox.
    expected:
      - A Medium row says "{agent} chained {previous_tools} → {tool} for the first time" and the note "This agent never called {tool} after {previous_tools}."
      - The repeated calls of one tool form no sequence.
    last_run:
      date: 2026-11-16
      result: passed
      notes: "Julia with issues-manager: list_issues three times in a row, then create_issue. One Medium row for create_issue, departures new-sequence, previous_tools list_issues; the three list_issues calls formed no pair and no list_issues → list_issues was stored. The hour was detected by a one-off run of the job against the demo database, with the learning period at 1 day for the run."
  - id: S4
    title: Slack offers the type, off by default
    criteria: [6, 7]
    steps:
      - Open Integrations, External apps, Slack settings.
    expected:
      - Behavior drift is in the signal type list and is not selected.
    last_run:
      date: 2026-11-16
      result: passed
      notes: "Slack settings list Behavior drift with its description, not selected."
  - id: S5
    title: A suspended tool is restored on the agent
    criteria: [7, 8, 9]
    steps:
      - In Barricade, set the response to New tool to Suspend the tool for the agent for Acme Production.
      - Call, through one agent, a granted tool it never called, and wait for the hourly job.
      - Open the Inbox row and its action, then Restore the tool on the agent and confirm.
    expected:
      - The note says the tool was suspended and the action opens the agent in Access.
      - The tool shows Suspended with its time; a call of it is denied with tool_suspended.
      - After Restore the chip is gone and the next call of the tool runs.
    last_run:
      date: 2026-11-16
      result: passed
      notes: "With New tool set to Suspend: the get_issue note added \"The tool was suspended for this agent.\" and the action read Open agent; the agent showed the notice with get_issue, Suspended and the time; a call was denied (Investigate: \"The tool is suspended for this agent\"). After Restore and confirmation the notice was gone and the next call ran. Barricade restored to 7, 30, 2, 5, 20 and Alert."
  - id: S6
    title: One row lists every departure of a tool in its hour
    criteria: [1, 2, 7]
    steps:
      - With New tool set to Suspend, as one person, call a tool of one agent, then at least 20 calls of a granted tool that nobody in the environment called.
      - After the hourly job, open the Inbox.
    expected:
      - One High row says "{agent} called {tool} for the first time", and its note has a sentence for the new tool, the spike with "nobody called this tool before", the new sequence and the suspension.
    last_run:
      date: 2026-11-16
      result: passed
      notes: "camila with analytics-assistant: run_report, then 25 list_datasets. One High row: \"No agent in this environment called this tool in the period. 25 calls in this hour, and nobody called this tool before. This agent never called list_datasets after list_datasets and run_report. The tool was suspended for this agent.\" The hour was detected by a one-off run of the job against the demo database."
  - id: S7
    title: A second restore of the same suspension says who restored it
    criteria: [8]
    steps:
      - Open the agent with a suspended tool in two tabs.
      - Restore it in the second tab, then click Restore and confirm in the first tab.
    expected:
      - The first tab says "Already restored by {name} at {time}." with no error, and the suspended tool is gone.
    last_run:
      date: 2026-11-16
      result: passed
      notes: "analytics-assistant, list_datasets: the stale tab said \"Already restored by Beatriz Nunes at Nov 16, 23:33 UTC.\" The restore of a tool suspended again (409) is covered by the backend unit tests, not by this run: it needs a new detection in a later hour."
  - id: S8
    title: Two drift runs of the same hour raise and suspend once
    criteria: [7]
    steps:
      - With New tool set to Suspend, call a tool that is not known for one agent.
      - Run the drift job of that hour twice at the same time, in two processes.
    expected:
      - The hour is added once; one suspension, one "suspended" entry in the agent's history and one Behavior drift signal.
    last_run:
      date: 2026-11-17
      result: passed
      notes: "analytics-assistant, list_datasets, hour 00:00 UTC; two compiled processes of a one-off run of the job, started together. Both exited 0; drift_hours had one row for the hour, tool_suspensions one row, drift_tool_hours one row of 2 calls, and the Inbox one signal (new-tool, suspend_tool)."
  - id: S9
    title: Two restores of the same suspension at the same time
    criteria: [8]
    steps:
      - Send two restores of the same suspension at the same time.
    expected:
      - Both answer 200; one restored it and the other gets that restore with already_restored; the history has one "restored" entry.
    last_run:
      date: 2026-11-17
      result: passed
      notes: "Two DELETE requests with Promise.all from the signed-in Admin page: one already_restored false, one already_restored true, the same restored_at (00:53:29 UTC) and author; tool_suspension_events had one suspended and one restored entry for the suspension, and the suspension was gone."
  - id: S10
    title: A newer signal replaces the suspension of a suspended tool
    criteria: [8]
    steps:
      - Suspend a tool for an agent with one signal, then with another signal.
      - Restore the first suspension, then the current one.
    expected:
      - The second signal gives the suspension a new id; the same signal again changes nothing.
      - The restore of the first id answers 409 suspension_changed with the current suspension; the restore of the current id answers 200.
    last_run:
      date: 2026-11-17
      result: passed
      notes: "analytics-assistant, list_datasets on the demo database: the suspend statement of the drift job, taken from the code, ran with signal A, then B, then B again; the id changed from 6e9e2c74 to be335f34 and stayed. DELETE of 6e9e2c74 answered 409 suspension_changed with be335f34; DELETE of be335f34 answered 200. The run left test entries with origin keys race-check|signal-A and B in the history of the agent."
---

# Functional test: Behavior Drift in the Inbox

The hourly job of Backend 099 needs a pattern; the Barricade values in `data` shorten the learning period and the known rule so that the demo history is enough.
