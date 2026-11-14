---
# Functional test of one specification. File name: the file name of the specification.
spec: 054-2026-11-13-cumulative-limits-and-signal-severity
title: Cumulative Limits in Rules and Signal Severity
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on https://acme.xokepoint.localhost (through Envoy; the Vite port 5174 alone has no API), signed in as beatriz@acme.test
data: >-
  refunds-assistant on Acme Billing · refund_order. Prerequisite: the demo refund_order needs a
  customer_id parameter and an integer amount (today it has a decimal amount and no customer_id).
  Remove the rules that the scenarios add, and start the stopped MCP server again after S6.
scenarios:
  - id: S1
    title: A rule gets limit lines for each operator
    criteria: [1]
    steps:
      - In Access, open refunds-assistant · Acme Billing · refund_order and click Add rule.
      - Click Add a limit; choose sum, Of amount, Per customer_id, In the last 24 hours, Is at most 100000.
      - Click Add a limit again and choose count_calls, then count_distinct, then since_within on the same line.
    expected:
      - sum offers only integer parameters in Of.
      - count_calls has no Of; count_distinct has Of and no Per; since_within has Since, No call of and With the same.
      - The window accepts at most 24 hours.
    last_run:
      date: null
      result: not_run
      notes: ''
  - id: S2
    title: Per is optional and explains both cases
    criteria: [2]
    steps:
      - On a sum line, open Per and hover the help icon.
    expected:
      - The first option is All calls.
      - The help has the per customer example and the all calls example.
    last_run:
      date: null
      result: not_run
      notes: ''
  - id: S3
    title: formerly_within shows its warning
    criteria: [3]
    steps:
      - Choose formerly_within on a limit line, Tool get_order, With the same refund_order.order_id = get_order.order_id.
    expected:
      - The warning "Checks the call, not its result" shows in the line.
    last_run:
      date: null
      result: not_run
      notes: ''
  - id: S4
    title: A rule with limits reads as a sentence
    criteria: [4]
    steps:
      - Name the rule of S1 and click Add to draft.
    expected:
      - The editor and the saved list read "sum of amount per customer_id in the last 24 hours is at most 100000".
    last_run:
      date: null
      result: not_run
      notes: ''
  - id: S5
    title: The Inbox orders by severity, shows the chip and filters
    criteria: [5]
    steps:
      - Open the Overview Inbox with items of several types.
      - Choose Low in Filter by severity.
    expected:
      - The first column shows High, Medium or Low; High items come first.
      - With Low, only Would deny, Review due and Requests denied items show, and the total follows the filter.
    last_run:
      date: null
      result: not_run
      notes: ''
  - id: S6
    title: A disconnected server shows in the Inbox
    criteria: [5]
    steps:
      - Stop the Acme Billing demo MCP server and wait for the next automatic rediscovery (at most about 15 minutes).
      - Start it again and wait for the next rediscovery.
    expected:
      - A High item "Server disconnected" for Acme Billing shows, with the reason unreachable.
      - After the server answers again, the item is resolved.
    last_run:
      date: null
      result: not_run
      notes: ''
---

# Functional test: Cumulative Limits in Rules and Signal Severity

The scenarios need Backend 087 and 088. S1 to S4 also need the demo `refund_order` to have `customer_id` and an integer `amount`.
