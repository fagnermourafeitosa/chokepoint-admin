---
spec: 050-2026-11-08-remove-tool-mapping-screen
title: Remove the Tool Mapping Screen, the Resource Block and the Resource ID Identifier
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test
data: The Acme Billing custom MCP server and its tools; the Acme context sources of populate.py. S2 starts a new binding and cancels it, so nothing is saved.
scenarios:
  - id: S1
    title: The tools of a custom MCP server have no mapping screen and no Resource block
    criteria: [1]
    steps:
      - Open Integrations, Custom MCPs, Acme Billing.
      - Look at the rows of get_order, list_refunds and refund_order.
    expected:
      - No row shows Configure mapping or a mapping badge (COAZ default, local, server).
      - No row shows a Resource line or Configure resource.
      - No page of the Admin says "Map the call to AuthZEN" or "Authorization mapping".
    last_run:
      date: 2026-11-08
      result: passed
      notes: "Demo instance, Production, Admin from the feat/050 worktree on 5174. Acme Billing shows get_order, list_refunds and refund_order with no Configure mapping, no mapping badge, no Resource line and no Configure resource; the page has no Map the call to AuthZEN, Authorization mapping or COAZ default."
  - id: S2
    title: Trusted attributes about the object of the call read a tool argument
    criteria: [2, 3]
    steps:
      - Open Access, Context sources, a source of Acme, Trusted attributes, Add trusted attributes.
      - Choose a tool, choose The object of the call, and import or choose an operation with a URI parameter.
      - Open Value from of each URI parameter.
      - Cancel.
    expected:
      - Each URI parameter starts as Tool argument, with the argument pointer /<URI parameter name>.
      - Value from offers Verified subject ID, Verified issuer and Tool argument, and no Resource ID.
    last_run:
      date: 2026-11-08
      result: passed
      notes: "Source of Acme, Add trusted attributes, The object of the call (default). Add parameter starts as Tool argument. A pasted OpenAPI with GET /orders/{order_id}, Inspect GET operations, Use this operation: order_id starts as Tool argument with the pointer /order_id. Value from offers Verified subject ID, Verified issuer and Tool argument, no Resource ID. Cancel; nothing saved."
---
