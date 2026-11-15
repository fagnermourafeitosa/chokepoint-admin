---
# Functional test of one specification. File name: the file name of the specification.
spec: 055-2026-11-14-tool-review-text
title: Tool Review Text
stack:
  - Development stack (dev-infra/up.sh) with the local MCP fixtures (dev-infra/mcp run.py), workspace Development Workspace A, environment Sandbox
  - Admin on https://app.xokepoint.localhost (through Envoy), signed in as admin-a@chokepoint.test
  - Backend feat/094-enterprise-discovery-stored-credential (which contains Backend 091) and Admin feat/055-tool-review-text, each started by its dev.sh from its worktree
  - The dev-only WAF exception for the endpoint of a discovery (Envoy, dev_server), so a 127.0.0.1 endpoint can be discovered
data: >-
  Catalog (127.0.0.1:8761) with the removed long_count and slow_count. To get a changed tool, the stored
  approved description of Catalog · echo is set to "Return a message." in chokepoint.mcp_servers; the
  fixture still sends the real text, so the next discovery finds echo changed. A new server, Utilities
  review test (127.0.0.1:8762), is created by S5 and left disabled.
scenarios:
  - id: S1
    title: A changed tool shows only its real changes
    criteria: [1]
    steps:
      - Set the approved description of Catalog · echo to "Return a message." in the database.
      - Open /access/integrations?type=custom&server=<Catalog>&review=server.
    expected:
      - The page opens at echo, Changed, To review, with the warning notice.
      - Changes since you approved it shows ~1 changed, only Description, with the approved text removed and the discovered text added.
      - No Other fields row: the stored contract lists its keys in another order (jsonb), which is not a change.
    last_run:
      date: 2026-11-15
      result: passed
      notes: 'First run showed ~2 changed with a false Other fields row, because the contracts were compared as text and jsonb reorders keys. Fixed: the diff compares canonical JSON with sorted keys. After a reload (a second discovery), the comparison still used the approved text: Backend 091 live.'
  - id: S2
    title: Removed tools and the server item
    criteria: [1]
    steps:
      - Open long_count in the Removed group, then Instructions and identity in Server.
    expected:
      - long_count shows the info notice and no decision buttons.
      - The server item shows the fixture instructions and chokepoint-catalog · version 0.1.0, each Not sent to agents.
    last_run:
      date: 2026-11-15
      result: passed
      notes: 'Instructions "Local development fixture; outputs are test data."; identity chokepoint-catalog 0.1.0.'
  - id: S3
    title: Trust a change and confirm
    criteria: [1]
    steps:
      - On echo, click Trust this change, then Confirm review.
    expected:
      - Progress becomes 1 of 1 decided and echo shows Change trusted.
      - The page returns to the server details; in the database echo is unchanged, reviewed, enabled, with the discovered description and no previous.
    last_run:
      date: 2026-11-15
      result: passed
      notes: 'Database after the confirmation: echo unchanged, reviewed, enabled, "Return a message unchanged. Available on both nonempty fixtures.", no previous; the server stays enabled.'
  - id: S4
    title: The Inbox and Review coverage open the review
    criteria: [1]
    steps:
      - On the Overview Inbox, click Review on the Catalog tool discovery item.
      - With echo changed again, open Review coverage, filter Needs review only and click Open tool on echo.
    expected:
      - The Inbox opens the review page of Catalog with the back link Overview; with nothing to decide, the progress reads Nothing to decide.
      - Review coverage lists echo as Needs review and Open tool opens the review page at echo.
    last_run:
      date: 2026-11-15
      result: passed
      notes: 'Inbox URL keeps return_to=/ and adds review=server. The first run read 0 of 0 decided when nothing needed a decision; fixed to Nothing to decide. Review coverage opened ?tool=echo&review=server at echo. echo was then trusted again to restore the data.'
  - id: S5
    title: A new Custom MCP, bulk approval and denial
    criteria: [1, 2]
    steps:
      - Click Connect custom MCP, type Utilities review test and http://127.0.0.1:8762/mcp, press Discover tools.
      - Click Approve 2 read-only, then open echo and click Deny echo, then Confirm review.
    expected:
      - The dialog closes and the review page opens (review=new) with echo and add, New, and Approve 2 read-only.
      - After the bulk approval both read Approved; after Deny echo, echo reads Denied.
      - The server is created with add only.
    last_run:
      date: 2026-11-15
      result: passed
      notes: 'Database: Utilities review test, enabled, tools [add selected and enabled]; echo was dropped.'
  - id: S6
    title: A disabled server is enabled again by its review
    criteria: [1]
    steps:
      - Disable Utilities review test, open its review page, check Enable server after review, deny echo and confirm.
    expected:
      - Enable server after review appears only because the server is disabled.
      - After the confirmation the server is enabled and add stays selected.
    last_run:
      date: 2026-11-15
      result: passed
      notes: 'Database: enabled true, add selected. The server was then disabled again.'
  - id: S7
    title: Enterprise MCP review
    criteria: [2]
    steps:
      - Connect a GitHub Enterprise MCP, then open its review from the Inbox after a change.
    expected:
      - The page shows the provider, the account and the same review; it opens without a new OAuth authorization (Backend 094).
    last_run:
      date: 2026-11-15
      result: blocked
      notes: 'No GitHub App and no Enterprise MCP in the local data: connecting needs a real GitHub App and OAuth. Backend 094 is covered by unit tests (stored credential discovery, refused connection fields, 422, kept credential on confirmation).'
---

# Tool Review Text — functional test

Run by hand in the built-in browser on the development stack. The scenarios above are the record.
