# Specification: Inbox Item Status Without an Exit Guard

- **Specification ID**: 045
- **Date**: 2026-11-06
- **Slug**: inbox-item-status-without-exit-guard
- **Status**: In Progress
- **Owner**: Admin — Attention (`src/features/attention`), Investigate (`src/features/investigate`), Access (`src/features/access`)
- **Supersedes**: [020 — Investigate Problems and Decisions](020-2026-10-29-investigate-problems-and-decisions.md), section "Reviewed/Resolved workflow" and the "preserve originating signal ID" rule of the contextual actions
- **Supersedes**: [019 — Contextual Access Navigation](019-2026-10-29-contextual-access-navigation.md), decision 8 "Inbox exit lifecycle", `signal_id` in decision 1, the signal lookup of decision 4 and the signal ID of decision 7
- **Supersedes**: [021 — Overview](021-2026-10-29-overview-dashboard.md), decision 11 "Review/resolution" (the exit offer and "carry the signal ID to all destination types")
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

---

## Practical Gains & Operational Outcomes

1. **Predictable navigation**:
   - *Before*: Open the rule, Back and the primary navigation open a dialog when the URL has `signal_id`, also when the administrator never opened the Inbox.
   - *Now*: each link goes to its destination. Open the rule opens the rule that produced the deny.
2. **One place to close an item**:
   - *Before*: an item is resolved only from the exit dialog.
   - *Now*: the status and Mark resolved are in the Inbox row and in the inspector of the problem, by any path.
3. **No Inbox state in the URL**:
   - *Before*: `signal_id` travels through Investigate, Access and Integrations.
   - *Now*: the item is found from the problem itself (`detail.problem.signal`) or from the Inbox row.

---

## User Stories

- [ ] 1. As an administrator, I want Open the rule to open the rule that produced the deny, so that I can fix it without an interruption.
- [ ] 2. As an administrator, I want to move between pages without a dialog, so that navigation is predictable.
- [ ] 3. As an administrator, I want to see the status of an Inbox item and mark it resolved in the Inbox and in the inspector of its problem, so that I close it when I decide.

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
2. **No `signal_id` in URLs.** `targetPath` (Inbox targets), `accessPath` and `actionPath` (inspector actions) do not add `signal_id`. `return_to` does not contain it. `useInvestigation` does not add the problem's signal to the URL. `useAccessTarget` and `accessTarget` do not read `signal_id`; a target exists from `section`, `view`, `tool` or `decision_id`, as before, without the signal case. The Investigate list views that a signal opens (Token exchanges, would-deny decisions) are found by their filters, not by `signal_id`. Admin 019 decision 1 is now `/access?agent_id=&section=&server_id=&tool=&policy_id=&decision_id=`.
3. **Reviewed from the Inbox.** A click on the action of an Inbox row navigates at once and sends the review command of that item at the same time, when its status is Open. The navigation does not wait for the response. On failure the item stays Open; the Inbox shows its real status when it loads again. On success, invalidate the attention queries.
4. **Reviewed from the inspector.** When the inspector of a decision has `problem.signal` with status Open, it sends the review command once for that signal ID, by any path to the detail (Inbox, Investigate list, Quick incident, a link). A Reviewed or Resolved item is not changed. Selecting another decision of the same problem does not send it again.
5. **Status control.** One shared component in `src/features/attention` shows the status chip (Open, Reviewed, Resolved; the existing `attention-status-chip` style) and, when the status is not Resolved, a **Mark resolved** button. Its tooltip: "Resolved records your decision. It does not verify that future calls will succeed." The button sends the resolve command at once, without a confirmation. While it waits, the button is disabled and shows "Saving…". On success the chip shows Resolved and the attention queries are invalidated. On failure the chip keeps the previous status and an inline alert says "The item could not be resolved. Try again." with Retry.
6. **Where the control appears.**
   - Inbox row (Overview, `AttentionInbox`): in the When/status cell area, for every item type. In the Resolved filter, the row shows the chip only.
   - Decision inspector: in the inspector header, when `problem.signal` exists, by any path. The label names the item: "Inbox item" before the chip.
   - Not in Access, Integrations, the Token exchanges inspector or the Investigate lists.
7. **Copy.** The dialog text "Finish reviewing this item", "Keep reviewed" and "Keep this item reviewed, or mark it resolved…" are removed from the code.
8. **Documentation in the implementation change.** Update the Admin `README.md` paragraph that describes the shared navigation guard. Rewrite scenario S3 of [020 functional test](functional-tests/020-2026-10-29-investigate-problems-and-decisions.md) and scenario S3 of [021 functional test](functional-tests/021-2026-10-29-overview-dashboard.md), which test the exit dialog. In the documentation check, update the line of the backend `PRODUCT.md` (Inbox section) that says leaving the detail offers Keep reviewed or Mark resolved, and check the public documentation pages of the Inbox and Investigate.

---

## Testing Decisions

This Admin has no automated tests. Run `npm run check`, `npm run build` and the functional test in the built-in browser on the demo instance.

---

## Acceptance Criteria

- [ ] 1. Open the rule, the other contextual actions, Back and the primary navigation open their destination without a dialog, from the Inbox and from Investigate.
- [ ] 2. No URL built by the Admin contains `signal_id`; Access and Integrations do not read it.
- [ ] 3. A click on an Inbox row action makes an Open item Reviewed without delaying navigation.
- [ ] 4. Opening the inspector of a denial problem by any path makes its Open item Reviewed; a Resolved item stays Resolved.
- [ ] 5. Mark resolved in the Inbox row and in the inspector resolves the item in one click; a failure shows an alert with Retry and keeps the previous status.
- [ ] 6. `SignalDetailGuard` and the exit dialog are removed; README and the 020 and 021 functional tests describe the new behavior.
- [ ] 7. `npm run check` and `npm run build` pass.
- [ ] 8. Functional test: [045-2026-11-06-inbox-item-status-without-exit-guard](functional-tests/045-2026-11-06-inbox-item-status-without-exit-guard.md).

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
