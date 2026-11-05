---
spec: 030-2026-10-31-investigate-agent-subject-and-token-exchanges
title: Investigate with Agent, Subject and Token Exchanges
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Read-only. The Token exchange denied signal needs enough denied exchanges in its window; the last run used a local 1-minute window.
scenarios:
  - id: S1
    title: The three views and their filters
    criteria: [1, 4, 6]
    steps:
      - Open Investigate; use the Agent, Reason and Result filters in each of the three views.
      - Click a cell of a row.
    expected:
      - The decision lists show Agent, On behalf of and Resource with the reasons of section 2.
      - The Token exchanges view lists exchanges with short reasons.
      - A click anywhere on a row opens the decision or exchange.
    last_run:
      date: 2026-11-02
      result: passed
      notes: null
  - id: S2
    title: Inspector and actions
    criteria: [2, 3, 5]
    steps:
      - Open a decision of each deny reason and click its action.
      - Click an occurrence of the problem.
    expected:
      - The inspector shows "{agent} acted for {subject}" and the four steps with the relation checked.
      - condition, no_grant, no_resource and no_delegation open the Rules, Add tools, tool and identity provider panels of the agent; the action only navigates.
      - The occurrence opens in the same detail.
    last_run:
      date: 2026-11-02
      result: passed
      notes: null
  - id: S3
    title: Overview and Inbox
    criteria: [7, 8]
    steps:
      - Open Overview Most denied and click a row.
      - Open the Token exchange denied signal in the Inbox.
    expected:
      - Most denied groups by the verified agent and opens Investigate.
      - The signal shows its count and opens the filtered Token exchanges view.
    last_run:
      date: 2026-11-02
      result: passed
      notes: The run found and fixed two defects - the count missing in the Inbox item, and a signal target opened as an unavailable decision.
---

# Functional test: Investigate with Agent, Subject and Token Exchanges
