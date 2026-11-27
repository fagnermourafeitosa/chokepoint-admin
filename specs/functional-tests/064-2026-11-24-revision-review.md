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
      date: null
      result: not_run
      notes: Not run yet. End with Discard draft.
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
      date: null
      result: not_run
      notes: Not run yet. Also cover blocking a person, narrowing the kinds of Acme Identity and removing an allowed value, in the same draft or in a second one. End with Discard draft.
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
      date: null
      result: not_run
      notes: Not run yet. Keep this draft for S5, or end with Discard draft.
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
      date: null
      result: not_run
      notes: Not run yet.
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
      date: null
      result: not_run
      notes: Not run yet. Restore by removing the tool and publishing again.
  - id: S6
    title: A blocker disables both Publish buttons
    criteria: [10]
    steps:
      - In the Draft of refunds-assistant, create the blocker of today (Harness login on without a group), if the agent allows it
      - Open Review & publish, then History and Publish
    expected:
      - Publish N changes in the review panel and Publish in the history are disabled with the blocker text
    last_run:
      date: null
      result: not_run
      notes: Not run yet. End with Discard draft.
---

# Functional test: Revision Review

The scenarios use refunds-assistant on Acme Billing, the same agent as the layout prototype. Criteria 11 and 13 are checked by code inspection and by `npm run check` and `npm run build`, not here.
