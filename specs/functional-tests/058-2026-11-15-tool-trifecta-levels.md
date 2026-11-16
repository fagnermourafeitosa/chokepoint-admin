---
# Functional test of one specification. File name: the file name of the specification.
spec: 058-2026-11-15-tool-trifecta-levels
title: Tool Trifecta Levels
stack:
  - Demo instance (dev-infra/demo-instance - up.sh with backend-097 and admin-058, after populate.py), workspace Acme, environment Sandbox
  - Admin on https://acme.xokepoint.localhost, signed in as beatriz@acme.test
  - No ANTHROPIC_API_KEY in the demo: every label is failed, so the scenarios set the levels by hand
data: Acme Helpdesk of the Sandbox. S2 and S3 store level corrections on get_ticket and reply_ticket and two session calls; restore with a review that undoes the corrections, and the session rows leave after 24 hours.
scenarios:
  - id: S1
    title: The Custom MCPs list shows the lethal trifecta column, per tool, with the documentation link
    criteria: [4, 5]
    steps:
      - Open Access › Integrations › Custom MCPs.
      - Read the Lethal trifecta column and its header.
    expected:
      - The header is a Documentation link with ArrowUpRight that opens the public documentation in a new tab.
      - Servers whose tools have no usable levels show "N tools are failed", never OK.
    last_run:
      date: 2026-11-15
      result: passed
      notes: Header link target _blank to https://xokepoint.com/docs/platform/mcp-servers/lethal-trifecta (the page does not exist yet). Rerun with the labeler key and the conceptual prompt; after a manual discovery Acme Issues showed "1 tool is two legs high"; the servers not discovered by hand stayed "N tools are failed", since in development the automatic rediscovery never labels.
  - id: S2
    title: A failed label is shown, and the reviewer sets and corrects the levels, kept in the review history
    criteria: [1, 2, 3, 6, 7]
    steps:
      - Discover Acme Helpdesk; open get_ticket in the unchanged tools.
      - Set the levels; choose High, High, OK; Confirm review.
      - Open reply_ticket; Set the levels to OK, OK, High; Confirm review.
    expected:
      - The block shows Failed and "Set the levels" before the correction.
      - With two High legs the warning notice appears; each corrected leg shows "Corrected · Undo".
      - The list shows "1 tool is two legs high" for Acme Helpdesk.
      - The review history has level_corrected decisions with the reviewer.
      - Before you decide is the warning accordion with the lethal trifecta item; the tour button sits at the left of the footer line, with the Route icon.
    last_run:
      date: 2026-11-15
      result: passed
      notes: Review events with decisions level_corrected (leg, level) and an actor were stored. The page stayed in place when the accordion opened. Rerun with the labeler key: the model labels of a manual discovery were stored with attempted_at (Acme Issues get_issue High/High/OK, merge_pull_request and move_issue OK; Acme Helpdesk close_ticket OK). Fixed and rerun: with the labeler down, after Set the levels and Done the footer read "You set these levels; the model could not. Change" with no "Corrected"; the leg names and chips stayed on one line (the review was cancelled, nothing stored).
  - id: S3
    title: The call that closes the trifecta runs and raises a signal
    criteria: [1]
    steps:
      - As pedro with support-assistant, call get_ticket, then reply_ticket (traffic.py helpers).
      - As marina with support-assistant, call reply_ticket.
      - Open the call in Investigate; after the hour closes, open the Inbox.
    expected:
      - Pedro's reply_ticket runs (nothing is blocked by the trifecta); its trace has the Lethal trifecta step Closed; Marina's runs with the step Passed.
      - Investigate shows nothing of the trifecta; the call path reads Delegation, Agent, MCP server, Rules, Tool.
      - After the hour closes, the Inbox has a High Lethal trifecta closed signal, with the context reply_ticket and "support-assistant · 1 call · 1 person", whose Open agent opens support-assistant in Access.
    last_run:
      date: 2026-11-16
      result: passed
      notes: Rerun after the change to signal-only. Pedro's reply_ticket ran with the step closed and stayed in trifecta_calls; Marina's reply_ticket ran with Passed. The job raised the signal at 01:00:32 UTC. The first Inbox check showed an empty context (no case for the type, no agent name); fixed in targets.ts and in the backend enrichment, then the row showed reply_ticket and "support-assistant · 1 call · 1 person", and Open agent opened support-assistant in Access.
---

# Functional test: Tool Trifecta Levels

The demo runs with an Anthropic API key (kept outside the repositories), so the tools have model levels and "Model is wrong?". Without a key the labeler fails for every tool and the scenarios use the correction path.
