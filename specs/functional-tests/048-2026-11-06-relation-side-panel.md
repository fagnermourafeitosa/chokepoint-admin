---
spec: 048-2026-11-06-relation-side-panel
title: Relation Side Panel and Rules Only
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test
data: Agent refunds-assistant (Acme Identity, Acme Billing get_order, refund_order with the rule "Refund up to 500", list_refunds) and the binding Acme Employee Directory on refund_order. S1 to S6 only open panels and editors and close them; S7 adds a rule and publishes it, then removes it and publishes again to restore the agent.
scenarios:
  - id: S1
    title: The tool edge opens the tool panel in the side panel
    criteria: [1, 2]
    steps:
      - In Access › Permissions, select refunds-assistant and click the handle of the edge to refund_order.
    expected:
      - The side panel title is "refunds-assistant → Acme Billing" and "refund_order" on the second line.
      - Sections Expires, Rules (rule cards with the expression, the Trusted attributes box with Acme Employee Directory and the link to Context sources, Add rule on the right) and Remove access on the right.
    last_run:
      date: 2026-11-06
      result: passed
      notes: Branch feat/048 on the demo Admin. The panel showed "Refund up to 500" with double(context.chokepoint.arguments.amount) <= 500.0 and the Employee profile binding (refund_limit, team). No mapping warning, because refund_order has no resource mapping.
  - id: S2
    title: The rule editor follows the specification
    criteria: [3]
    steps:
      - In the refund_order panel, click Add rule.
    expected:
      - Name * first, conditions, Add a condition on the right, Reads as, Edit as CEL (advanced); no instance limits, no Generated CEL, no Required bindings.
      - Compare with a trusted attribute shows for the number argument amount, because the binding has the number refund_limit.
    last_run:
      date: 2026-11-06
      result: passed
      notes: Seen as listed. Cancelled without saving.
  - id: S3
    title: The agent panel, Back and Manage identity providers
    criteria: [4]
    steps:
      - Click the refunds-assistant node; in its panel click get_order.
      - Close the panel; click Manage identity providers.
    expected:
      - The agent panel lists enforcement, who can delegate and the tools; the get_order panel shows "Back to refunds-assistant".
      - With one identity provider, Manage identity providers opens the Acme Identity panel, eyebrow "Who can delegate to refunds-assistant".
    last_run:
      date: 2026-11-06
      result: passed
      notes: Seen as listed.
  - id: S4
    title: Tabs row, List, filter and How this works
    criteria: [4, 6]
    steps:
      - Look at the row of the agent views; switch to List; open How this works.
    expected:
      - The views and the Graph / List icons and Draft / Published share one row.
      - List has Who can delegate and Servers and tools only, with a Rules column; the filter has no Expiring; How this works says three checks.
    last_run:
      date: 2026-11-06
      result: passed
      notes: Seen as listed.
  - id: S5
    title: Add trusted attributes goes to Context sources and comes back
    criteria: [2, 8]
    steps:
      - In the refund_order panel, click Add trusted attributes in Context sources; then click Back to refunds-assistant · refund_order.
    expected:
      - Context sources shows the banner "Adding trusted attributes for refunds-assistant · refund_order" and the new subtitle.
      - Back opens Access with the refund_order panel, still in Production.
    last_run:
      date: 2026-11-06
      result: passed
      notes: Seen as listed.
  - id: S6
    title: Integrations offers only no resource
    criteria: [9]
    steps:
      - In Access › Integrations › Custom MCPs › Acme Billing, click Configure resource on a tool; open the Argument select; press Escape.
    expected:
      - The editor says "Limit this tool with rules in Access. A new resource can not be chosen here."; every argument option is disabled.
    last_run:
      date: 2026-11-06
      result: passed
      notes: order_id was disabled. The warning for a tool with a concrete resource was not seen, because no Acme tool has one.
  - id: S7
    title: A new rule is New in draft, and a rule that reads trusted attributes draws its edge
    criteria: [2, 5]
    steps:
      - In the refund_order panel, add a rule "Within the refund limit" with amount is at most, Compare with a trusted attribute, refund_limit; Add to draft.
      - Look at the card and at the graph; publish; then remove the rule and publish again.
    expected:
      - The card shows New in draft until publication.
      - The graph shows a dashed edge from refund_order to Acme Employee Directory labelled "reads refund_limit".
    last_run:
      date: null
      result: not_run
      notes: Not run, because it publishes on the shared demo agent. Seen in the prototype with fixed data.
  - id: S8
    title: The collapse button of the agent list sits on the gap
    criteria: [4]
    steps:
      - Collapse and expand the agent list.
    expected:
      - The button is centered on the gap between the list and the content in both states.
    last_run:
      date: null
      result: not_run
      notes: Measured in the prototype (centered on the gap, open and collapsed); not measured on the branch.
---

# Functional test: Relation Side Panel and Rules Only

The scenarios use the Acme data of the demo instance. S1 to S6 change nothing. S7 publishes twice on refunds-assistant and leaves it as it was.
