---
spec: 045-2026-11-06-inbox-item-status-without-exit-guard
title: Inbox Item Status Without an Exit Guard
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: S2, S3 and S4 mark Inbox items Reviewed and Resolved; this state stays (the Admin has no reopen). Use a condition deny on refund_order, a no_resource deny on run_report (customers_pii) and any other Open item. S6 to S8 only open confirmation dialogs and close them with Cancel; do not click the confirm buttons, so that the Acme agents and drafts stay unchanged.
scenarios:
  - id: S1
    title: Open the rule opens the rule, from Investigate and from the Inbox
    criteria: [1, 2]
    steps:
      - In Investigate › By problem, open a "A policy condition was not met" problem; click Open the rule.
      - In Access, click Overview in the primary navigation; then go back to the inspector and click Back to the list.
      - In the Overview Inbox, click the action of a requests-denied item; in the inspector, click Open the rule.
    expected:
      - No dialog opens at any step; Access shows the agent, the server tool and its rule.
      - No URL in the address bar contains signal_id.
    last_run:
      date: 2026-11-06
      result: passed
      notes: Branch Admin on acme.localhost:5175 (proxy with the demo origin) against the demo API. Open the rule from the Inbox and Investigate opened Access with the rule "Refund up to 500"; Back, Back to Investigate and Overview opened no dialog; no URL had signal_id. The Admin 004 Sandbox reset on a full load is out of scope.
  - id: S2
    title: Reviewed when the item is opened
    criteria: [3, 4]
    steps:
      - In the Inbox (filter Open), note an Open item and click its action; return to the Overview.
      - In Investigate › By problem, open a problem whose Inbox item is Open.
    expected:
      - The destination opens at once; the Inbox row then shows Reviewed.
      - The inspector header shows "Inbox item" with Reviewed.
    last_run:
      date: 2026-11-06
      result: passed
      notes: close_ticket Open became Reviewed after its Inbox action; run_report Open became Reviewed when opened from the Investigate list.
  - id: S3
    title: Mark resolved in the inspector and in the Inbox
    criteria: [5]
    steps:
      - In the Inbox, check the When and Action columns of each row.
      - In an inspector with a Reviewed item, click Mark resolved.
      - In the Inbox, click Mark resolved on another row; select the Resolved filter.
      - Open the inspector of a Resolved item again.
    expected:
      - Each row shows the status chip under the time in When, and Mark resolved with its help icon below the destination action in Action; the columns line up across the rows.
      - The chip shows Resolved without a confirmation; the button disappears.
      - The resolved rows are in the Resolved filter with the chip only.
      - Viewing a Resolved item keeps it Resolved.
    last_run:
      date: 2026-11-06
      result: passed
      notes: All rows have the same Action column (destination action on top, Mark resolved below) and the same height. refund_order resolved in the inspector, close_ticket in the Inbox row; both in the Resolved filter with the chip only; refund_order stayed Resolved when opened again.
  - id: S4
    title: Resolve failure
    criteria: [5]
    steps:
      - Block the resolve request (browser offline mode or a stopped API), then click Mark resolved.
    expected:
      - An alert says the item could not be resolved, with Retry; the chip keeps the previous status.
    last_run:
      date: 2026-11-06
      result: passed
      notes: The resolve request was made to fail in the page (fetch rejected); the alert with Retry showed and the chip stayed Reviewed; Retry after restoring resolved the item.
  - id: S5
    title: Open the rule for every deny of a rule, scrolled to the rule
    criteria: [9, 10]
    steps:
      - Open the inspector of a condition deny (refund_order), a no_resource deny (run_report, customers_pii), and a no_grant and a no_delegation deny when the data has them; click the action of each.
    expected:
      - The action is Open the rule; no Allow, Add or Let label shows.
      - Each action opens the same Access section as before (rule, resources, tools, who can delegate).
      - The page scrolls so that the rule is visible: the rules field for condition, the selected relation panel for the others.
    last_run:
      date: 2026-11-06
      result: passed
      notes: condition (refund_order) shows Open the rule; Access scrolls so that the rules field with "Refund up to 500" is fully visible. no_resource (run_report, customers_pii) shows Open the rule; Access scrolls so that the analytics-assistant · Acme Analytics · run_report panel is fully visible. The demo data has no no_grant or no_delegation deny; their label, unchanged destination and the panel scroll were checked by code inspection (reasonAction, DelegationEditor).
  - id: S6
    title: Remove tool asks for confirmation
    criteria: [11, 14]
    steps:
      - In Access, select analytics-assistant and its run_report tool; check the panel footer.
      - Click Remove tool; read the dialog; click Cancel.
    expected:
      - Remove tool is aligned right, with space under the footer border.
      - The Confirmation dialog says "Remove run_report from the tools of analytics-assistant? The change goes into the draft.", with run_report and analytics-assistant in bold.
      - The warning (warning palette, TriangleAlert) says "analytics-assistant also loses access to these resources, because no other granted tool uses them:" with the agent name in bold inside the sentence, and lists each resource in bold.
      - The dialog does not name the product. Cancel keeps the tool and "No unpublished changes".
    last_run:
      date: 2026-11-06
      result: passed
      notes: The button sits at the right edge, 17 px under the border. The dialog showed the question with run_report and analytics-assistant in bold (weight 700); the warning kept the agent name inline and listed "dataset · sales_daily" and "dataset · inventory" in bold. Cancel kept "No unpublished changes". Remove tool in the dialog runs the previous removal code (code inspection).
  - id: S7
    title: Agent header actions and the Report-only button
    criteria: [12, 13]
    steps:
      - In Access, select refunds-assistant; check the header actions.
      - Hover the Report-only button and Edit; hover the help icon next to Report-only.
    expected:
      - Report-only, its help icon and Edit form one group; Disable agent and Delete form a second group after a larger space.
      - The Report-only button uses the warning palette and has the hover effect of Edit; the help icon is spaced from the button and explains the mode.
    last_run:
      date: 2026-11-06
      result: passed
      notes: Measured 8 px inside a group, 24 px between the groups and 8 px between Report-only and its help icon. Report-only is a ghost button (the Edit class) with the warning background, border and text. The hover effect was checked by its class, not by a pointer hover.
  - id: S8
    title: Disable agent and Delete ask for confirmation
    criteria: [14]
    steps:
      - In Access, select refunds-assistant; click Disable agent, read the dialog, click Cancel.
      - Click Delete, read the dialog, click Cancel.
    expected:
      - Disable shows "Disable refunds-assistant?" with the name in bold and the warning "It gets no token, and its next call is rejected."
      - Delete shows "Delete refunds-assistant?" with the name in bold, the muted text "The revision history and the recorded decisions of this agent are kept. Investigate shows its name as deleted." and the warning "The agent loses all delegation and access at once and can not get new tokens. Its saved draft is dropped."
      - No dialog names the product. Cancel keeps the agent Active.
    last_run:
      date: 2026-11-06
      result: passed
      notes: Both dialogs showed these texts with the agent name in bold (weight 700); both Cancel kept the agent Active. The confirm buttons run the previous disable and delete code (code inspection); a failed request shows its error in the dialog (code inspection).
---

# Functional test: Inbox Item Status Without an Exit Guard

The scenarios check that navigation never opens a dialog, that the status of an Inbox item changes only by opening it (Reviewed) or by Mark resolved, that Open the rule opens and shows the rule of every deny of a rule, and that the agent header and the destructive actions of Access follow the design system Confirmation dialog.
