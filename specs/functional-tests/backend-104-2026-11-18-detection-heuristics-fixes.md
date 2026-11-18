---
# Functional test of one specification. File name: the file name of the specification (Backend 104, whose Admin part lives in this module by its Implementation Decision 6).
spec: backend/specs/104-2026-11-18-detection-heuristics-fixes
title: Detection Heuristics Fixes
stack:
  - Demo instance (dev-infra/demo-instance), workspace Acme, environment Production
  - Admin on https://acme.xokepoint.localhost (through Envoy), signed in as beatriz@acme.test
  - Backend branch feat/104-detection-heuristics-fixes (API on 8082 with migration 00056) and Admin branch feat/104-detection-heuristics-fixes
data: >-
  S2 sets the approved contract of Acme Analytics · run_report in chokepoint.mcp_servers (inputSchema.description
  "Runs one report of a dataset.", properties.days.maximum 60); the server still sends the real contract, so the next
  discovery finds run_report changed. Restore: Trust this change and set its levels (Reads private data High, the others
  OK). S3 sets the label of Acme Billing · list_refunds to {"state":"failed"} in the database; S3 itself restores it with
  Set the levels (Low, OK, OK). S4 deletes the trifecta_calls and forwarded_decisions rows of support-assistant, so
  pedro's session starts empty. S5 runs 40 get_order calls of rafael through refunds-assistant. The signal windows and
  the drift hour are closed at once by a one-off run of the jobs against the demo database, not by waiting for the tick.
scenarios:
  - id: S1
    title: The Spike factor explains its reference
    criteria: [3]
    steps:
      - Open Account, Barricade, environment Production.
      - Hover the help icon next to the Spike factor unit.
    expected:
      - The Spike factor unit reads "× a usual busy window" and its help line says "above this multiple of a usual busy window in the pattern".
      - 'The tooltip reads "The reference is a usual busy window of the agent on this tool in the pattern period: 9 in 10 of its windows with calls have at most this many calls. One unusual peak does not raise it. Without a history of the agent, the windows of the other agents on the tool are used."'
    last_run:
      date: 2026-11-18
      result: passed
      notes: Unit, help line and tooltip text as expected.
  - id: S2
    title: A change without a readable row is listed by its JSON path
    criteria: [2]
    steps:
      - Set the approved contract of run_report as in data.
      - Open the review of Acme Analytics in Production.
    expected:
      - run_report is Changed, To review, and Changes since you approved it shows ~2 changed.
      - One item INPUTSCHEMA.PROPERTIES.DAYS.MAXIMUM with 60 removed and 90 added, and one item INPUTSCHEMA.DESCRIPTION with "Runs one report of a dataset." removed and Not set added.
      - The notice "The server went back to the text that you approved" is not shown.
    last_run:
      date: 2026-11-18
      result: passed
      notes: 'Both paths listed with both values; before Backend 104 the root description was dropped from the comparison. Restored with Trust this change and the levels High, OK, OK; the stored contract is the discovered one. Not run: the reverted notice for equal contracts (no stored pending change that went back) and the items.type of an array parameter (no demo tool has one); both follow from the same comparison, by code inspection.'
  - id: S3
    title: A tool without a label raises one coverage signal, resolved when it gets levels
    criteria: [5]
    steps:
      - Set the label of list_refunds to failed as in data.
      - Call list_refunds three times as rafael through refunds-assistant, then close the signal window.
      - Open the Inbox, filter by Trifecta check incomplete, and click Review.
      - Open list_refunds, Set the levels Low, OK, OK, and Confirm review.
    expected:
      - Each call records the step trifecta skipped with the cause no_label.
      - One Low row Trifecta check incomplete for list_refunds, "3 calls without the check · The tool has no trifecta levels".
      - Review opens the review of Acme Billing.
      - After Confirm review the signal is resolved.
    last_run:
      date: 2026-11-18
      result: passed
      notes: 'The three decisions carry {"key":"trifecta","state":"skipped","cause":"no_label"}; the signal has origin key server|list_refunds and target the Acme Billing review; resolved_at was set by the Confirm review. Rerun after the review (user, 2026-11-18: a failed read raises no signal; only calls with a forwarding confirmation count): 5 skipped calls, all forwarded, gave count 5 and a context without a cause. Not run: a failed read of the label or session store, which records skipped with the cause unavailable and raises nothing (unit test of the PEP).'
  - id: S4
    title: The Inbox counts only the call that closes the lethal trifecta
    criteria: [4]
    steps:
      - Empty pedro's session as in data.
      - As pedro through support-assistant, call get_ticket, reply_ticket, reply_ticket and get_ticket, then close the signal window.
      - Open the Inbox.
    expected:
      - The trifecta step and the forwarding confirmation read passed, closed, exposed and exposed.
      - One High row Lethal trifecta closed for reply_ticket with "1 call · 1 person".
    last_run:
      date: 2026-11-18
      result: passed
      notes: Step and confirmation matched for the four calls; the signal counted 1 call. Before Backend 104 the later calls were closed again and counted.
  - id: S5
    title: A spike note gives the p90 of the pattern
    criteria: [3]
    steps:
      - Run 40 get_order calls of rafael through refunds-assistant in one hour, then run the drift job for that hour.
      - Open the Inbox and filter by Behavior drift.
    expected:
      - A Medium row "refunds-assistant called get_order far more than usual" with the note "40 calls in this hour; its p90 in an hour is 4."
    last_run:
      date: 2026-11-18
      result: passed
      notes: The signal context carries p90_window_calls 4 and baseline agent.
---

# Functional test: Detection Heuristics Fixes

The Admin part of Backend 104: the tool review diff (decision 2), the Spike factor help and the p90 note of a spike (decision 3), and the Inbox rows of the lethal trifecta and of the new coverage signal (decisions 4 and 5).
