---
# Functional test of one specification. File name: the file name of the specification.
spec: 064-2026-11-24-revision-review
title: Revision Review
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test
data: The agent refunds-assistant (Acme Identity with its delegations, the tools of Acme Billing, the rule of refund_order). Most scenarios end with Discard draft and change nothing. S5 publishes a tool added to refunds-assistant; restore by removing that tool and publishing again. reset.sh --yes rebuilds Acme from zero.
scenarios:
  - id: S1
    title: Removing the only identity provider reads as one change with a loss of access
    criteria: [1, 2, 4, 6]
    steps:
      - Open Access, Permissions, refunds-assistant, Delegation and access, List view, Draft
      - Remove Acme Identity from Who can delegate
      - Check the row and the publication bar; open Review & publish
    expected:
      - The Acme Identity row stays, struck through, with the Removed badge and Open only; the section count is 0
      - The bar says Draft · 1 unpublished change
      - The review panel shows −1 removed, Acme Identity with its people under it, the warning "Access is lost" with the line of the last identity provider, the note, Back to the draft and Publish 1 change
      - The bar shows no inline "Publish 1 change?" step
      - The Published view shows Acme Identity without a mark
      - In the Graph view of the Draft, the Acme Identity box stays dashed, muted and struck through with the Removed badge; its line to the agent is dashed and neutral; the canvas shows the Unpublished chip
    last_run:
      date: 2026-11-27
      result: passed
      notes: "Production, refunds-assistant (two providers: Acme Identity and Acme login). Removed Acme Identity: the row stayed struck through with Removed and Open only, Who can delegate 1, bar Draft · 1 unpublished change. Removed Acme login too: review panel −2 removed, each provider with its people under it, warning with the line of the last identity provider, Publish 2 changes; no inline step in the bar. Graph view: removed box dashed and struck through, its relation dashed, Unpublished chip on the canvas; a click on the removed box opened its panel read only. Discarded."
  - id: S2
    title: Several losses read as one warning with one line each
    criteria: [3, 5, 6]
    steps:
      - In the Draft of refunds-assistant, remove one person of Acme Identity, change the rule of refund_order to a lower amount, remove one tool, set an expiry on another tool
      - Open Review & publish
    expected:
      - The changed rows have the Changed badge and the removed tool has the Removed badge
      - The warning has one line per loss in the order of the change list (people, tool, rule, expiry), each with its deny reason text
      - The rule shows its sentence before, struck through, and after
    last_run:
      date: 2026-11-27
      result: passed
      notes: "Removed Rafael Souza and the tool get_order of Acme Billing 106: Acme Identity Changed (2 → 1 people, Rafael under it), get_order Removed; the warning had the people line and the tool line in that order. Expiry 2026-12-31 on list_refunds: the expiry line. Added the rule Only order A-1 on list_refunds: the added rule line with its sentence. Run again after the review fixes in one draft: four lines in the order of the change list (people, expiry, tool, rule), Publish 4 changes. Removed the rule Refund up to 500: Rules −1 with its sentence, no warning. The UI has no in-place edit of a rule, so a changed rule (before → after) was checked by code inspection; blocked person, narrowed kinds and removed allowed value were checked by code inspection. Discarded each draft."
  - id: S3
    title: A change that only gives access has no warning
    criteria: [2]
    steps:
      - In the Draft of refunds-assistant, add a tool of Acme Billing that the agent does not have
      - Open Review & publish
    expected:
      - The tool row has the Added badge
      - The review panel lists +1 added and shows no warning
    last_run:
      date: 2026-11-27
      result: passed
      notes: "Added Camila Rocha to Acme Identity: row Changed (3 of 7), review panel ~1 changed with Camila under the provider, no warning. Used for S5."
  - id: S4
    title: The history shows the draft first and its answers
    criteria: [7, 8, 9]
    steps:
      - With the draft of S1, open History from the publication bar
      - Select the effective revision and an older one
      - Close it; open the Report-only notice history of an agent in Report-only, if one exists, or check the code path of that history
    expected:
      - The timeline starts with Draft, Not published, 1 unpublished change, selected; its detail shows Changes from revision N, the change list and Publish
      - The numbering note is under the timeline; a revision with the same permission document names what stayed the same
      - The history of the Report-only notice shows no draft
    last_run:
      date: 2026-11-27
      result: passed
      notes: "History from the bar with the draft of S1: Draft first, Not published, 2 unpublished changes, selected, with Changes from revision 104, the list and Publish; numbering note under the timeline; revision 104 reads Acme login · harness login. No agent of Production is in Report-only, so the history of the Report-only notice was checked by code inspection (it gets no draft). A revision with the same permission document was not in the history; its sentence was checked by code inspection."
  - id: S5
    title: Publish from the history asks only for the warning and the note
    criteria: [7]
    steps:
      - With the draft of S3, open History, select the draft, click Publish
      - Type a note; Publish
    expected:
      - The dialog "Publish 1 change to refunds-assistant?" shows no warning, the note, Cancel and Publish
      - After Publish, the history shows the new revision with the note; the bar shows No unpublished changes
    last_run:
      date: 2026-11-27
      result: passed
      notes: "With the draft of S3, History, Draft, Publish: dialog Publish 1 change to refunds-assistant? with no warning; note Admin 064 functional test: add Camila; revision 106 published with that note. Restored through the review panel: the warning named Camila Rocha; revision 108 published with the note Admin 064 functional test: restore. Run again after the review fixes, watched by the user: revisions 110 (add Camila, from the history) and 112 (restore, from the review panel)."
  - id: S6
    title: A blocker disables both Publish buttons
    criteria: [10]
    steps:
      - In the Draft of refunds-assistant, create the blocker of today (Harness login on without a group), if the agent allows it
      - Open Review & publish, then History and Publish
    expected:
      - Publish N changes in the review panel and Publish in the history are disabled with the blocker text
    last_run:
      date: 2026-11-27
      result: passed
      notes: "Turned off the only group (Finance) of harness login on Acme Identity: Publish 1 change in the review panel and Publish in the history draft were disabled with the blocker text. Discarded."
---

# Functional test: Revision Review

The scenarios use refunds-assistant on Acme Billing, the same agent as the layout prototype. Criteria 11 and 13 are checked by code inspection and by `npm run check` and `npm run build`, not here.
