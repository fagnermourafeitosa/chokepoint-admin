---
spec: 060-2026-11-16-behavior-drift-inbox
title: Behavior Drift in the Inbox
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test
data: The API runs with BEHAVIOR_DRIFT_LEARNING_DAYS=0 and BEHAVIOR_DRIFT_KNOWN_DAYS=1 so that one day of traffic.py history is a pattern. The scenarios add calls with traffic.py runs aimed at one agent; restore by unsetting the two variables.
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
      date: null
      result: not_run
      notes: ""
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
      date: null
      result: not_run
      notes: ""
  - id: S3
    title: A new sequence names both tools
    criteria: [1, 7]
    steps:
      - As one person, call two tools of one agent in an order not seen in the pattern.
      - After the next hourly job, open the Inbox.
    expected:
      - A Medium row says "{agent} chained {previous_tool} → {tool} for the first time" and the context line shows the pair.
    last_run:
      date: null
      result: not_run
      notes: ""
  - id: S4
    title: Slack offers the type, off by default
    criteria: [6, 7]
    steps:
      - Open Integrations, External apps, Slack settings.
    expected:
      - Behavior drift is in the signal type list and is not selected.
    last_run:
      date: null
      result: not_run
      notes: ""
---

# Functional test: Behavior Drift in the Inbox

The hourly job of Backend 099 needs a pattern; the two environment variables in `data` shorten the learning period and the known rule so that the demo history is enough.
