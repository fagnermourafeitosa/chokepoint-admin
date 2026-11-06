# Specification: Inbox Item Status Without an Exit Guard

- **Specification ID**: 045
- **Date**: 2026-11-06
- **Slug**: inbox-item-status-without-exit-guard
- **Status**: Implemented
- **Owner**: Admin — Attention (`src/features/attention`), Investigate (`src/features/investigate`), Access (`src/features/access`)
- **Supersedes**: [020 — Investigate Problems and Decisions](020-2026-10-29-investigate-problems-and-decisions.md), section "Reviewed/Resolved workflow" and the "preserve originating signal ID" rule of the contextual actions
- **Supersedes**: [019 — Contextual Access Navigation](019-2026-10-29-contextual-access-navigation.md), decision 8 "Inbox exit lifecycle", `signal_id` in decision 1, the signal lookup of decision 4 and the signal ID of decision 7
- **Supersedes**: [021 — Overview](021-2026-10-29-overview-dashboard.md), decision 11 "Review/resolution" (the exit offer and "carry the signal ID to all destination types")
- **Supersedes**: [030 — Investigate Agent, Subject and Token Exchanges](030-2026-10-31-investigate-agent-subject-and-token-exchanges.md), decision 3, the action label of the `no_delegation`, `no_grant` and `no_resource` reasons
- **Supersedes (Admin interaction only)**: [Backend 024 — Signal Review and Resolution](../../backend/specs/024-2026-10-29-attention-signal-review-and-resolution.md), decision 4 "Interaction". The backend commands and read contract do not change.

---

## Context & Background

Admin 020 ties the Inbox item lifecycle to navigation. When a URL has `signal_id`, `SignalDetailGuard` (mounted in `AdminLayout`) marks the item Reviewed and blocks each navigation that leaves the detail with the dialog "Finish reviewing this item" (Cancel, Keep reviewed, Mark resolved). That dialog is the only place in the Admin where an administrator can resolve an item.

`useInvestigation` adds the `signal_id` of the problem to the URL when a decision is opened from the Investigate list, not only from the Inbox. Every contextual action of the inspector (`accessPath`, `actionPath`) and every Inbox target (`targetPath`) carries `signal_id` into Access, Integrations and Investigate lists.

---

## Problem Statement

### 1. A link does not do what it says

Confirmed on the demo instance on 2026-11-05 (Acme, Production, `beatriz@acme.test`): Investigate › By problem › a `condition` deny on `refund_order` adds `signal_id` to the URL. **Open the rule** opens "Finish reviewing this item" instead of the rule. After Keep reviewed, Access opens the rule "Refund up to 500" with the same `signal_id`, and a click on **Overview** in the primary navigation opens the dialog again.

### 2. Resolution has no place of its own

Because resolution exists only in the exit dialog, the lifecycle of an item depends on navigation and on state that the URL carries from page to page. Access and Integrations read Inbox state that does not belong to them.

---

## Solution

1. Navigation never opens a dialog. Remove `SignalDetailGuard` and its exit dialog.
2. Links only lead to places. No contextual action, Inbox target or `return_to` carries `signal_id`. Access and Integrations do not read `signal_id`.
3. An item becomes Reviewed when someone opens it: a click on its action in the Inbox, or the opening of the detail of its denial problem by any path.
4. **Mark resolved** is one click, without a confirmation, in the Inbox row and in the decision inspector of the problem, next to the status chip.
5. Every deny reason that a rule of the agent produced has the same inspector action: **Open the rule**.

---

## Practical Gains & Operational Outcomes

1. **Predictable navigation**:
   - *Before*: Open the rule, Back and the primary navigation open a dialog when the URL has `signal_id`, also when the administrator never opened the Inbox.
   - *Now*: each link goes to its destination. Open the rule opens the rule that produced the deny.
2. **An action that does not suggest a decision**:
   - *Before*: a `no_resource` deny on `customers_pii` offered "Allow customers_pii for run_report".
   - *Now*: every deny of a rule offers Open the rule.
3. **One place to close an item**:
   - *Before*: an item is resolved only from the exit dialog.
   - *Now*: the status and Mark resolved are in the Inbox row and in the inspector of the problem, by any path.
4. **No Inbox state in the URL**:
   - *Before*: `signal_id` travels through Investigate, Access and Integrations.
   - *Now*: the item is found from the problem itself (`detail.problem.signal`) or from the Inbox row.

---

## User Stories

- [x] 1. As an administrator, I want Open the rule to open the rule that produced the deny, so that I can fix it without an interruption.
- [x] 2. As an administrator, I want to move between pages without a dialog, so that navigation is predictable.
- [x] 3. As an administrator, I want to see the status of an Inbox item and mark it resolved in the Inbox and in the inspector of its problem, so that I close it when I decide.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language
- **Context**: Attention owns the Inbox item lifecycle in the Admin. Investigate shows the item of a problem. Access and Integrations own permissions and tools only.
- **Package Ownership**: `src/features/attention` (Inbox row actions, review and resolve mutations, shared status control), `src/features/investigate` (inspector status control, no `signal_id`), `src/features/access` (no `signal_id` reading), `src/layouts/AdminLayout.tsx` (no guard).
- **Ubiquitous Terms**:
  - `Inbox item`: an attention signal (Backend 020, 024).
  - `Open`, `Reviewed`, `Resolved`: the statuses of Backend 024, derived by the backend.

### 2. Aggregate Root & State Transitions
- **Entities & State Machine**: Open → Reviewed (the item is opened) → Resolved (Mark resolved). Open → Resolved is also valid. The Admin has no command that leaves Resolved; the source-driven reopen of Backend 024 decision 8 is unchanged.
- **Invariants**:
  - A navigation never changes the status of an item and never waits for a status write.
  - Viewing a Resolved item does not reopen it (the review command never clears a resolution, Backend 024 decision 3).
  - No status is attached to an individual decision.

### 3. Commands, Queries & Domain Ports
Existing Backend 024 endpoints only, under the scoped attention-signals API:
```text
POST …/attention-signals/:id/review   -> Signal
POST …/attention-signals/:id/resolve  -> Signal
GET  …/attention-signals/:id          -> Signal
```
The decision read of Backend 023 already returns `problem.signal` (`id`, `status`).

---

## Implementation Decisions

1. **No exit guard.** Delete `src/features/attention/SignalDetailGuard.tsx` and its mount in `AdminLayout`. No other component blocks navigation for the Inbox. Remove its CSS (`signal-detail-notice`) when no other element uses it.
2. **No `signal_id` in URLs.** `targetPath` (Inbox targets), `accessPath` and `actionPath` (inspector actions) do not add `signal_id`. `return_to` does not contain it. `useInvestigation` does not add the problem's signal to the URL. `useAccessTarget` and `accessTarget` do not read `signal_id`; a target exists from `section`, `view`, `tool` or `decision_id`, as before, without the signal case. The Investigate list views that a signal opens (Token exchanges, would-deny decisions) are found by their filters, not by `signal_id`. An Inbox item of a historical problem without its reason-qualified parameters (Backend 024 decision 7) has no target: its row shows the existing "Target unavailable" text and keeps Mark resolved, and the Investigate state "This recorded problem is no longer available", which only `signal_id` opened, is removed. Admin 019 decision 1 is now `/access?agent_id=&section=&server_id=&tool=&policy_id=&decision_id=`.
3. **Reviewed from the Inbox.** A click on the action of an Inbox row navigates at once and sends the review command of that item at the same time, when its status is Open. The navigation does not wait for the response. On failure the item stays Open; the Inbox shows its real status when it loads again. On success, invalidate the attention queries.
4. **Reviewed from the inspector.** When the inspector of a decision has `problem.signal` with status Open, it sends the review command once for that signal ID, by any path to the detail (Inbox, Investigate list, Quick incident, a link). A Reviewed or Resolved item is not changed. Selecting another decision of the same problem does not send it again.
5. **Status control.** One shared component in `src/features/attention` shows the status chip (Open, Reviewed, Resolved; the existing `attention-status-chip` style) and, when the status is not Resolved, a **Mark resolved** button with a help icon (`CircleHelp` in `Tooltip`, one focus stop for the button). The tip: "Resolved records your decision. It does not verify that future calls will succeed." The button sends the resolve command at once, without a confirmation. While it waits, the button is disabled and shows "Saving…". On success the chip shows Resolved and the attention queries are invalidated. On failure the chip keeps the previous status and an inline alert says "The item could not be resolved. Try again." with Retry.
6. **Where the control appears.**
   - Inbox row (Overview, `AttentionInbox`), for every item type: the status chip under the time in the When column; Mark resolved in the Action column, below the destination action. In the Resolved filter, the row shows the chip only.
   - Decision inspector: in the inspector header, when `problem.signal` exists, by any path. The label names the item: "Inbox item" before the chip.
   - Not in Access, Integrations, the Token exchanges inspector or the Investigate lists.
7. **Copy.** The dialog text "Finish reviewing this item", "Keep reviewed" and "Keep this item reviewed, or mark it resolved…" are removed from the code.
8. **Open the rule for every deny of a rule.** The action of the decision inspector is **Open the rule** for `no_delegation`, `no_grant`, `no_resource` and `condition`. It opens the rule that produced the deny, at the destination that each reason already has: who can delegate to the agent (`no_delegation`), the tools of the agent on the server (`no_grant`), the resources of the agent for the tool (`no_resource`) and the rule (`condition`). The labels "Let {subject} delegate to {agent}", "Add {server} · {tool} to {agent}" and "Allow {value} for {tool}" are removed: a deny is usually the rule working, and the action does not suggest a decision. `tool_not_reviewed` keeps "Review the tool": no rule of the agent blocks it, the tool is not reviewed.
9. **Scroll to the rule.** When Access opens from Open the rule, the page scrolls so that the rule is visible: for `condition`, the "Rules for this agent on this server tool" field of the selected agent · server · tool; for the other reasons, the panel of the selected relation (who can delegate, the tool, the resources). It scrolls once, when the target relation is selected after the configuration loads.
10. **Remove tool footer and confirmation.** The footer of the agent · server · tool panel has space between its top border and the Remove tool button, which is aligned to the right. Remove tool opens a confirmation dialog: "Remove {tool} from the tools of {agent}? The change goes into the draft.", with Cancel and Remove tool. The note that was next to the button moves into the dialog as a warning notice, shown only when the removal also removes resources, and it says that the agent loses access, not that data is removed: "{agent} also loses access to these resources, because no other granted tool uses them:" and the list of `{kind} · {value}`. The dialog is the new design system component **Confirmation dialog** (`ConfirmDialog` in `src/components/ui/dialog`), with the new warning tone of `cp-admin-notice` (`cp-admin-notice--warning`, `TriangleAlert`), documented in `docs/design-system/components.md` with a specimen in `preview.html`. In every confirmation dialog, each value that comes from the data (tool, agent and resource names) is in bold, without quotes, also inside the warning. A confirmation dialog does not name the product.
11. **Report-only button.** The Report-only button of the agent header (Admin 041) uses the Report-only palette of the design system (warning background, border and text, the `Eye` icon), so that the special mode stands out from the other agent actions. A help icon (`CircleHelp` in `Tooltip`) next to the mode button, in both modes, says: "Report-only lets the calls of this agent run and records each call that its policy would deny, so that you can check a policy before you enforce it. Delegation, a valid token, an enabled identity connection and the kill switch stay enforced." The Enforce access button of an agent in Report-only keeps the secondary style.
12. **Agent header actions.** The actions of the agent header are two groups with a larger space between them: the mode action (Report-only or Enforce access, with its help icon spaced from the button) and Edit; then Disable agent (or Enable agent) and Delete. The Report-only button has the hover effect of Edit (the ghost button: offset shadow and lift) with the Report-only palette.
13. **Confirm Disable agent and Delete.** Disable agent and Delete ask for confirmation in the Confirmation dialog. Disable agent: "Disable {agent}?" (the name in bold), warning "It gets no token, and its next call is rejected.", confirm "Disable agent". Enable agent does not ask. Delete: the text of the existing Delete agent dialog, with "The agent loses all delegation and access at once and can not get new tokens. Its saved draft is dropped." as the warning and "The revision history and the recorded decisions of this agent are kept. Investigate shows its name as deleted." as muted text. A failed request shows its error in the dialog, which stays open.
14. **Documentation in the implementation change.** Update the Admin `README.md` paragraph that describes the shared navigation guard. Rewrite scenario S3 of [020 functional test](functional-tests/020-2026-10-29-investigate-problems-and-decisions.md) and scenario S3 of [021 functional test](functional-tests/021-2026-10-29-overview-dashboard.md), which test the exit dialog. In the documentation check, update the line of the backend `PRODUCT.md` (Inbox section) that says leaving the detail offers Keep reviewed or Mark resolved, and check the public documentation pages of the Inbox and Investigate.

---

## Testing Decisions

This Admin has no automated tests. Run `npm run check`, `npm run build` and the functional test in the built-in browser on the demo instance.

---

## Acceptance Criteria

- [x] 1. Open the rule, the other contextual actions, Back and the primary navigation open their destination without a dialog, from the Inbox and from Investigate.
- [x] 2. No URL built by the Admin contains `signal_id`; Access and Integrations do not read it.
- [x] 3. A click on an Inbox row action makes an Open item Reviewed without delaying navigation.
- [x] 4. Opening the inspector of a denial problem by any path makes its Open item Reviewed; a Resolved item stays Resolved.
- [x] 5. Mark resolved in the Inbox row and in the inspector resolves the item in one click; a failure shows an alert with Retry and keeps the previous status.
- [x] 6. `SignalDetailGuard` and the exit dialog are removed; README and the 020 and 021 functional tests describe the new behavior.
- [x] 7. `npm run check` and `npm run build` pass.
- [x] 8. Functional test: [045-2026-11-06-inbox-item-status-without-exit-guard](functional-tests/045-2026-11-06-inbox-item-status-without-exit-guard.md).
- [x] 9. The decision inspector action is Open the rule for `no_delegation`, `no_grant`, `no_resource` and `condition`, and opens the same destinations as before.
- [x] 10. Open the rule scrolls Access to the rule (the rules field for `condition`, the selected relation panel for the other reasons).
- [x] 11. The Remove tool footer has space under its top border; Remove tool asks for confirmation in the design system Confirmation dialog, with the removal note as a warning.
- [x] 12. The Report-only button uses the Report-only palette and has a help icon with the mode explanation.
- [x] 13. The agent header actions are two groups (mode and Edit; Disable or Enable and Delete), and the Report-only button has the Edit hover effect.
- [x] 14. Disable agent and Delete ask for confirmation in the Confirmation dialog; the Remove tool warning names each removed resource, and Remove tool is aligned right.

---

## Out of Scope

- Undo or Reopen by the administrator (no backend command; not needed).
- Resolving several items at once.
- A note in the inspector that the permissions changed after the decision.
- The environment on a full page load: an Access or Investigate URL opened in a new page selects Sandbox (Admin 004), so Production IDs return not found. Separate follow-up.
- Automatic resolution from a permission change or from later calls (Backend 024 decision 5 still applies).

---

## Further Notes

Decided with the user on 2026-11-05 and 2026-11-06. The user rejected a fix that depends on the page the administrator came from, and a fix that only exempts the contextual actions from the dialog: navigation and the item lifecycle are separate. No backend change is needed; Backend 024 decision 4 describes the old Admin interaction and is superseded here for the Admin. No layout prototype (decided by the user). The user approved this specification for implementation on 2026-11-06.
