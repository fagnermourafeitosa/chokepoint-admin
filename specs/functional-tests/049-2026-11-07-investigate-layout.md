---
spec: 049-2026-11-07-investigate-layout
title: Investigate Layout and Rules Read as Sentences
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test
data: The Acme rules "Refund up to 500" (refunds-assistant, refund_order), "Tier-1 queue only" (support-assistant, close_ticket) and "Sales and inventory only" (analytics-assistant, run_report), written in the builder format by populate.py; traffic.py records their denies. S4 adds a draft rule in advanced CEL and discards it.
scenarios:
  - id: S1
    title: The list shows the agent, server and tool, the failed rule and the Actions column
    criteria: [1, 4]
    steps:
      - Open Investigate, By problem.
      - Look at a refund_order problem of refunds-assistant.
      - Switch to All decisions, then to Token exchanges.
    expected:
      - The agent cell shows refunds-assistant with no "Verified agent" line.
      - The MCP server / tool cell shows Acme Billing with the Server icon and refund_order with the Wrench icon.
      - The Detail cell shows "Rule not met" and "amount is at most 500"; an allow row has an empty Detail cell.
      - Each view ends in an Actions column with a View button, right aligned with its header.
      - No column or cell says "Resource" or "No resource check".
    last_run:
      date: null
      result: not_run
      notes: null
  - id: S2
    title: View opens the decision detail with the path, the failed rule and the facts
    criteria: [2, 3, 4]
    steps:
      - In By problem, click View on a refund_order problem of refunds-assistant.
      - Hover the help icons of the title, Mode and Reference.
    expected:
      - One bar holds Back to the list and Quick incident; no page title, no Investigate or Decision inspector kicker, no decision ID.
      - The path, above the outcome, shows Delegation, Agent, MCP server and Tool passed, and Rules failed with "Refund up to 500".
      - The title reads Denied refund_order, then "Rule not met: amount is at most 500", then Open the rule; no CEL anywhere.
      - The facts show Identity provider, On behalf of, Agent, MCP server and Tool on the left, and Mode, Reference (a mono chip), Permission revision and Decided at (UTC) on the right; no Resource line.
      - The list title reads "Decisions in this problem · N denied", with the window line under it; each row shows a time, a subject and a reference code.
      - No text names the product.
    last_run:
      date: null
      result: not_run
      notes: null
  - id: S3
    title: The side panel of Access reads a saved rule as a sentence
    criteria: [3]
    steps:
      - Open Access › Permissions, refunds-assistant, and click the refund_order tool.
    expected:
      - The Rules list shows "Refund up to 500" with "Reads as amount is at most 500" in the Reads as style; no CEL line.
    last_run:
      date: null
      result: not_run
      notes: null
  - id: S4
    title: A rule in advanced CEL shows its CEL
    criteria: [3]
    steps:
      - In the refund_order panel of refunds-assistant, click Add rule, then Edit as CEL (advanced).
      - Name it "Even amounts only", type `int(context.chokepoint.arguments["amount"]) % 2 == 0`, and click Add to draft.
      - Click Discard draft.
    expected:
      - Before the discard, the Rules list shows "Even amounts only" with its CEL, because it can not be read as a sentence.
      - After the discard, the rule is gone.
    last_run:
      date: null
      result: not_run
      notes: null
---

# Functional test: Investigate Layout and Rules Read as Sentences

The scenarios cover the list, the decision inspector and the Rules list of the Access side panel. S4 changes only the draft and discards it.
