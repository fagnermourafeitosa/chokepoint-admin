---
# Functional test of one specification. File name: the file name of the specification.
spec: 057-2026-11-15-tool-review-history
title: Tool Review History and Remembered Denials
stack:
  - Development stack (dev-infra/up.sh) with the local MCP fixtures (dev-infra/mcp run.py), workspace Development Workspace A, environment Sandbox
  - Admin on https://app.xokepoint.localhost (through Envoy), signed in as admin-a@chokepoint.test
  - Backend feat/096-tool-review-history (migration 00048 applied) and Admin feat/057-tool-review-history, each started by its dev.sh from its worktree
data: >-
  Catalog (127.0.0.1:8761), with Example agent granted current_time, list_test_items and get_test_item.
  Before S2 the stored descriptions of current_time and echo were shortened in chokepoint.mcp_servers, and
  add was stored as denied (unselected, disabled, reviewed) with a shortened description, so the next
  discovery finds a granted change, a plain change and a change of a denied tool.
scenarios:
  - id: S1
    title: The Custom MCPs list pages and searches on the server
    criteria: [1]
    steps:
      - Open Access › Integrations › Custom MCPs.
      - Type 8764 in Find a connection.
    expected:
      - The pager reads 3 records, 1 / 1; each row has one small Discover or Review button and a More menu, and a status switch.
      - The request carries q=8764 and only Acme Issues (endpoint port 8764) is listed, 1 record.
    last_run:
      date: 2026-11-15
      result: passed
      notes: 'GET …/mcp-servers?limit=10&offset=0&q=8764 → 200, Acme Issues only.'
  - id: S2
    title: The review is ordered by criticality and a denied tool comes back last
    criteria: [1]
    steps:
      - Click Discover on Catalog.
    expected:
      - To review lists current_time (Granted to 1 agent), echo, then add (Denied before); Keep 1 denied is offered.
      - add says that it was denied before, its diff reads Changes since you denied it; current_time says Granted to 1 agent.
      - The tool-discovery signal counts 2 changed, not add; the history has a system event disabling echo and current_time.
    last_run:
      date: 2026-11-15
      result: passed
      notes: 'Signal origin Catalog:41 changed 2. Event 1: rediscovery, revision 41, no actor, disabled_changed echo and current_time.'
  - id: S3
    title: Keep N denied, decisions and the review event
    criteria: [1]
    steps:
      - Click Keep 1 denied, Trust this change on current_time, Keep echo disabled, then Confirm review.
    expected:
      - add reads Kept denied; the review is 3 of 3 decided.
      - The history gets a review event with the reviewer and kept_disabled echo, denied add, change_trusted current_time; add stays stored as denied and unchanged.
    last_run:
      date: 2026-11-15
      result: passed
      notes: 'The first click on Keep 1 denied did not register while the page advanced to the next tool; the second did. Event 2: review, revision 43, actor admin-a. The run found that the response-only facts (granted_agents, review_order) were written to the stored document as zeros; fixed with omitempty, the next write left them out.'
  - id: S4
    title: Review history panel
    criteria: [2]
    steps:
      - Open the More menu of Catalog and choose Review history.
    expected:
      - The panel lists the review (Development Admin A) and the Tools disabled event of the discovery (Xokepoint, after a discovery), and the review shows 1 approved, 2 denied with each tool and its decision.
    last_run:
      date: 2026-11-15
      result: passed
  - id: S5
    title: The status switch disables with its impact and enables through a review
    criteria: [1]
    steps:
      - Turn off the switch of Catalog, read the confirmation, click Disable server.
      - Turn the switch on again, then Confirm review.
    expected:
      - The confirmation shows 4 managed tools, 1 agent (Example agent) and the allowed calls of the last 24 hours; after Disable server the row reads Disabled.
      - Turning it on opens the review page with Enable server after review checked; after Confirm review Catalog is enabled.
    last_run:
      date: 2026-11-15
      result: passed
      notes: 'Impact: 4 tools, Example agent, 1 allowed call. Database after the review: enabled true, no review facts stored.'
  - id: S6
    title: Small row actions, Review coverage and the Inbox link
    criteria: [1]
    steps:
      - Open Identity providers, then Review coverage, then Review on a Tool discovery item of the Overview Inbox.
    expected:
      - Identity Edit and the More trigger are small (32 px) under a right-aligned Actions header; Review coverage shows Open tool small, a Reviewed or Needs review badge and Actions; the tour button is an icon with the label Take the tour.
      - The Inbox Review opens the review page of Catalog with the back link Overview.
    last_run:
      date: 2026-11-15
      result: passed
      notes: 'The first run added review=server twice to the Inbox URL (Admin 055 target and the new target context); fixed by keeping it in the target context only.'
---

# Tool Review History and Remembered Denials — functional test

Run by hand in the built-in browser on the development stack. The scenarios above are the record.
