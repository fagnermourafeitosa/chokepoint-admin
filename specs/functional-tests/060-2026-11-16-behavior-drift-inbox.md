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
      - Run more than 5 times the largest hourly count of one tool of one agent, and at least 20 calls, in one hour.
      - After the next hourly job, open the Inbox and filter by Behavior drift.
      - Click the action of the row.
    expected:
      - A Medium row says "{agent} called {tool} far more than usual" and its note gives the count and the pattern maximum.
      - Investigate opens filtered by the agent, the tool and the hour.
    last_run:
      date: 2026-11-16
      result: passed
      notes: "80 get_ticket calls of support-assistant in one hour: Medium row \"called get_ticket far more than usual\", note \"80 calls in this hour; its pattern never passed 1 in an hour.\"; Investigate opened All decisions filtered by agent, tool and 22:00-23:00, 80 records. The hour was detected at once by a one-off run of the job against the demo database, not by waiting for the hourly tick."
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
      - As one person, call two tools of one agent in an order not seen in the pattern.
      - After the next hourly job, open the Inbox.
    expected:
      - A Medium row says "{agent} chained {previous_tool} → {tool} for the first time" and the context line shows the pair.
    last_run:
      date: 2026-11-16
      result: passed
      notes: "Julia called list_issues then get_issue: Medium row \"chained list_issues → get_issue for the first time\", context \"list_issues → get_issue\". A second row \"get_ticket → get_ticket\" came from the 80 repeated calls, correct by the rule."
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
---

# Functional test: Behavior Drift in the Inbox

The hourly job of Backend 099 needs a pattern; the Barricade values in `data` shorten the learning period and the known rule so that the demo history is enough.
