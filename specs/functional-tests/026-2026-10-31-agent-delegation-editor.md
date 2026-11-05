---
spec: 026-2026-10-31-agent-delegation-editor
title: Agent Delegation Editor
stack:
  - Demo instance (dev-infra/demo-instance, up.sh after populate.py), workspace Acme, Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (password and one-time code in dev-infra/demo-instance/.local, totp.py)
  - Or the development stack with admin-a; its data has no resource type box with values
data: Edits stay in the browser until Review & publish; discard the draft at the end. S4 publishes; publish back the original delegation after it.
scenarios:
  - id: S1
    title: Delegation and access view and graph
    criteria: [1, 2, 11]
    steps:
      - Open refunds-assistant, then analytics-assistant.
      - Open How this works.
    expected:
      - One Delegation and access view; no Connection graph or Permissions tab.
      - The graph shows the identity provider (Acme Identity, n of 7 people), the agent, the server box with its tools, and the server › resource type box with its values (Acme Analytics · dataset with sales_daily and inventory), with their edges.
      - The help dialog has the diagram, the four checks and the example calls.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance.
  - id: S2
    title: Graph interaction
    criteria: [3]
    steps:
      - Drag a tool box past the corner of the canvas.
      - Zoom in, zoom out, scroll the wheel on the canvas, drag the background, Fit graph to view, Full screen and back.
    expected:
      - The box stops at the edge of the canvas; the canvas keeps its size; the draft stays unchanged.
      - The buttons and the wheel change the zoom; the background drag pans; fit restores the view; full screen widens the canvas and returns.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance, analytics-assistant. Box clamped at the canvas corner; canvas stayed 700 x 382; wheel zoom 122 to 268 px node width; pan moved the agent node by the drag.
  - id: S3
    title: Rules, expiration and list view
    criteria: [5, 6, 7, 8, 9]
    steps:
      - On agent · server · tool (analytics-assistant · run_report), start a Rule on call data: days is at most 30; open Edit as CEL (advanced); Add to draft.
      - Open the delegation relation and the resource group.
      - Open the List view; type a resource in the filter; turn on With rules, then Expiring; choose a server and a tool; Clear filters.
      - Discard draft.
    expected:
      - Expiration and rules on agent · server · tool; expiration and no rules on the delegation; neither on resources.
      - The builder reads days is at most 30 and generates context.chokepoint.arguments["days"] <= 30; the CEL edit says that the rule can not go back to the builder.
      - Three tables, each row with Open, Add condition and Remove.
      - Each column is filtered only when the filter matches something in it; the tool menu follows the server; N of M relations and Clear filters show.
      - No native select; edits apply to the whole draft; Discard draft leaves no unpublished change.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance. Rules, expiration, CEL, list view and filters pass (Expiring 0 of 5 relations; Acme Analytics · run_report 4 of 5). The Person to block field of the Harness login block is now a SelectMenu (it was a native select); choose, Block and Unblock work.
  - id: S4
    title: Publication bar
    criteria: [10]
    steps:
      - Change the draft and look at the bar; Review & publish, Publish; then revert the change and publish again.
    expected:
      - The bar shows the draft changes and the effective revision; while it publishes, Publishing…, then the new revision effective (pending when OpenFGA has not confirmed it).
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance, analytics-assistant. Added the rule days is at most 30 (Draft · 1 unpublished change, then Revision 6 effective), removed it (Publishing…, then Revision 8 effective). The pending state did not show, because the local OpenFGA confirms at once.
  - id: S5
    title: Size of 100 subjects and hundreds of resources
    criteria: []
    steps:
      - Open an agent with 100 subjects and hundreds of resources.
    expected:
      - The graph stays usable.
    last_run:
      date: null
      result: blocked
      notes: User story 6. The demo has 7 people and 2 resources for each agent; the development data has 14 subjects and one resource.
  - id: S6
    title: Group nodes over 8 items
    criteria: [4]
    steps:
      - Open an agent with a column of more than 8 items; search and page the group panel.
    expected:
      - The column shows group nodes with a searchable, paged panel.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance, analytics-assistant. Seven draft values (9 in all) turned the column into the group node 9 values - Open to list and search; the group panel reads dataset on Acme Analytics and filters (ft_c gave 1 of 1). Paging (50 a page) not reached. Draft discarded.
---

# Functional test: Agent Delegation Editor
