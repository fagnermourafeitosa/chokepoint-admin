# Specification: Agent Report-only Mode

- **Specification ID**: 041
- **Date**: 2026-11-04
- **Slug**: agent-report-only-mode
- **Status**: Implemented
- **Owner**: Admin — Access and Permissions, Investigate, Overview, Inbox
- **Related Specification**: [Backend 057 — Agent Report-only Mode](../../backend/specs/057-2026-11-04-agent-report-only-mode.md) (defines every backend item below; Proposed)
- **Related Specification**: [031 — Agent Kill Switch](031-2026-11-02-agent-kill-switch.md) (agent status, revision conflict)
- **Related Specification**: [032 — Revision History](032-2026-11-02-revision-history.md) (side panel, timeline)
- **Related Specification**: [030 — Investigate with Agent, Subject and Token Exchanges](030-2026-10-31-investigate-agent-subject-and-token-exchanges.md) (decision lists and inspector)
- **Related Specification**: [039 — Quick Incident](039-2026-11-04-quick-incident.md) (reference codes)
- **Visual reference**: layout prototype at `/prototype/report-only` on the remote branch [`design/report-only-mode`](https://github.com/fagnermourafeitosa/chokepoint-admin/tree/design/report-only-mode), commit `e81938f`, based on `main` at `7ff758d`. Fixed data in `src/features/prototype/report-only/`. Reviewed screen by screen with the user on 2026-11-04 against the demo instance (Acme, Production), at desktop and mobile (375 px) width.

> Implementation approved by the user on 2026-11-04, together with Backend 057. Reviewed result approved by the user on 2026-11-04.

---

## Context & Background

A company that already has authorization in place, or that pilots Chokepoint, can not put an agent behind Chokepoint and block from the first day: a missing grant or a wrong call rule stops real work. The administrator needs to see what the policy of an agent would deny on real traffic before it blocks anything.

Today an agent is Active or Disabled (Admin 031). Every deny of the PDP blocks the call. Investigate, the Inbox and the Overview show only enforced decisions.

This specification adds a second dimension to an agent: its **enforcement mode**, Enforce or Report-only. In Report-only the PDP still evaluates every call, records a deny of the policy as **Would deny**, and lets the call run. The Admin shows the mode on every screen that shows the agent or its decisions, keeps would-deny calls apart from real denials, and records each mode change in the revision history.

The name "Report-only" follows the Conditional Access term that IT and security administrators already know.

---

## Problem Statement

### 1. No safe first step for an agent in production

An administrator must choose between no Chokepoint and full blocking. There is no way to observe the policy on real calls first.

### 2. A would-deny call must never look like a real denial

If would-deny calls mix with denials, the Overview counts, the By problem view and the Requests denied items become wrong, and an administrator can act on a call that was never blocked.

### 3. An agent in Report-only is not protected by its policy

An agent can stay in Report-only and be forgotten. In Production this is a security gap that the Admin must keep visible.

---

## Solution

### Terms

- **Enforcement mode** of an agent: `enforce` (default) or `report_only`. It is agent metadata, like the status of Admin 031. It is not part of the permission document and does not create a permission revision.
- **Would deny**: a decision of an agent in Report-only that its policy denies. The call ran. Reasons and path are the same as a deny: `no_grant`, `no_resource`, `condition`.
- **Always enforced**, also in Report-only: an invalid or expired token, a disabled identity connection, the kill switch (Disabled), a deleted agent, and delegation (no token exchange without a delegation in OpenFGA).
- **Review date**: an optional date that the administrator sets for the review of the mode. It only reminds: the mode never changes by itself.

### 1. Mode change (Access, agent header)

1. The agent header has one mode action next to Disable agent: **Report-only** when the agent is in Enforce, **Enforce access** when it is in Report-only.
2. The action opens a dialog.
   - **Switch to Report-only**: the agent runs each call; Chokepoint still evaluates its tool grants, resources and call rules and records a denied call as Would deny, but does not block it. A list states what is always enforced. In Production a danger notice says: "In Production, this agent is not protected by its policy until you switch it back to Enforce." Fields: **Review by (optional)**, a date from today on, with the help text "On this date, the Inbox reminds you to review the mode. The agent stays in Report-only until you change it."; **Why this change? (optional)**, at most 500 characters.
   - **Enforce access**: the agent starts to block each call that its policy denies. The text gives the would-deny count of the last 24 hours ("After this change, those calls fail with a reference code"), or says that no call would have been denied in the last 7 days. Field: **Why this change? (optional)**.
   - Both say that the change is recorded in the revision history with the author and the note.
3. The change applies at once (no OpenFGA write). It sends the agent `revision`; a conflict says that the agent changed in another session and asks for a reload, like the kill switch (Admin 031).

### 2. Mode in Access

1. **Agent list**: an agent in Report-only shows the **Report-only** chip under its description; an agent whose review date has passed also shows **Review overdue** (danger tone).
2. **Agent header**: the **Report-only** chip next to Active. The muted line reads "Report-only: its calls run, and Chokepoint records the calls that its policy would deny."
3. **Report-only notice** under the header, in the warning tone (danger border when the review is overdue):
   - "Report-only since {UTC time} · by {name}";
   - the review date: "Review by {date}", or "Review overdue since {date}" as a danger chip, or "No review date"; with **Change date** or **Set a review date**, which open the review date dialog (item 5);
   - "{N} calls would have been denied in the last 24 hours. Last at {UTC time}.", or "No call would have been denied in 7 days.";
   - **View would-deny calls** (opens Investigate filtered on this agent and Would deny) and **History** (opens the revision history on the mode change).
4. The Delegation and access editor does not change. The mode does not change the permission document.
5. **Review date dialog**, titled "Change review date" or "Set a review date". The mode does not change. Text: "{agent} stays in Report-only. On the review date, the Inbox reminds you to review the mode."; "Current date: {date}." (with "(overdue)" when it passed) when a date exists. Fields: **Review by** (from today on) and **Why this change? (optional)**, at most 500 characters. The text says that the change is recorded in the revision history with the author and the note. Actions on one row: **Remove date** on the left (only when a date exists), **Cancel** and **Save date** on the right; Save date is disabled without a date. A saved or removed date is an event in the revision history (section 7).

### 3. Report-only banner (every Admin screen)

1. A banner under the header, on every screen, while the current environment has at least one agent in Report-only. It is not a modal and does not block.
2. Text: "{N} agents in Report-only" (with the prefix "Production:" in Production), the count "{N} review overdue" as a danger tag when any review date has passed, and "{N} calls would be denied in the last 24 hours. These agents run every call: their tool grants, resources and call rules do not block yet."
3. **View report** opens Investigate, All decisions, with Result = Would deny and an agent filter on the agents in Report-only (one agent: that agent).
4. When no call of these agents would have been denied in 7 days, the banner changes to the success tone: "No call would be denied in 7 days. {agent} is ready to enforce." (or "These agents are ready to enforce."), with **Open agent** / **Open agents**.
5. In Production the banner is stronger: ink border and offset shadow.
6. The close button hides it for this browser session only. It shows again at the next sign-in while an agent is in Report-only.

### 4. Investigate

1. The Result filter of All decisions has **All results, Deny, Would deny, Allow**.
2. A would-deny row shows the outcome chip **WOULD DENY** (Report-only palette, dashed border, eye icon), its reason, and "The call ran". The agent cell shows the **Report-only** chip for an agent that was in Report-only at decision time.
3. An agent filter set by the banner shows as a removable chip: "Agents in Report-only: {names}". *Implementation: the decision list filters one agent (Backend 034). With one agent in Report-only the banner filters on it; with several it filters on Would deny only, which already holds only the calls of agents in Report-only, and no chip is shown.*
4. **By problem** and the **Deny** filter never include would-deny calls.
5. **Decision inspector of a would-deny call.** The same layout as the inspector of Admin 030, with these differences:
   - the large outcome chip **Would deny** (Report-only palette, dashed, eye icon) in place of Allowed or Denied; under the tool name: "{reason}. The call ran because {agent} was in Report-only.";
   - a **Not blocked** notice under the title (warning tone): "Chokepoint evaluated this call and its policy denies it, but {agent} was in Report-only, so the call reached {server}. In Enforce, the same call is denied and the caller gets a reference code.";
   - the path shows the failed step as "Failed · not enforced", with a dashed dot in the Report-only palette; the steps before it pass and the steps after it are not evaluated, as for a deny;
   - the rules column, the action of the reason (for example **Open the rule**, **Add {server} · {tool} to {agent}**) and the repetition box are the same as for a deny; the repetition counts "{N} would deny";
   - the facts add **Mode** (the Report-only chip, the mode at decision time) and **Reference code**: "None: the caller was not refused".

### 5. Inbox

1. Two item types, both with the eye icon and the Report-only palette:
   - **Would deny** (dashed tag): would-deny calls grouped by agent, tool, reason and UTC hour. Subject "{agent} would be denied on {tool}", note "Report-only agent: {N} calls ran that its policy denies, in this hour.", context "{server} · {tool}" and "{reason} · {N} people". Action **Investigate**: opens the would-deny calls of that group.
   - **Review due** (solid tag): raised once when the review date of an agent in Report-only passes. Subject "{agent} is still in Report-only", note "Its review date was {date}. Enforce access, or set a new date.", context "{agent} · Report-only since {date}" and the would-deny count of the last 24 hours. Action **Review**: opens the agent.
2. Both types are in the type filter. A would-deny call never raises or counts in a **Requests denied** item.
3. Type tags never wrap; actions use the existing one-word labels.

### 6. Overview

1. **Denied today** counts blocked calls only, with the text "blocked calls only". It never includes would-deny calls.
2. A **Report-only** metric (Report-only palette, eye icon): "{N} agents" and "{N} calls would be denied today". It opens the same Investigate view as the banner. It shows only while the environment has an agent in Report-only; otherwise the row keeps its three metrics.

### 7. Revision history

1. A mode change is an immutable **event** in the same timeline as the permission revisions, in time order. It has no revision number.
2. Timeline entry: title **Mode changed**, the eye icon in place of the dot (Report-only palette), the note, the author, the time.
3. Detail: label **Event**, title "Mode changed", **Changed by**, **When**, **Applied**: "At once", the note as **Why**, and an **Enforcement** section: "~ From Enforce to Report-only" (or the reverse) and, when set, "+ Review by {date} · reminder only". A change of the review date alone is an event too.
4. The **History** link of the Report-only notice opens the panel on the latest mode change.

### 8. Revision history timeline changes (all agents)

These changes apply to the real History of Admin 032, for every agent:

1. **Entry order**: title (with Effective or the other badge), the note (at most two lines), author initials and name, then the UTC time.
2. **Selection**: no filled row. The selected entry has the ink bar on the left and its title in ink; the other titles are muted.
3. **Hover** on an entry that is not selected: the row fills with the row hover color and a muted bar shows.
4. **Path**: the line between the dots is continuous, centered on the dots, and drawn above any row fill.
5. The panel still opens on the latest entry, or on the entry that the caller requests.

### 9. Report-only palette

Every Report-only mark uses the warning tokens (`--cp-admin-color-warning`, `--cp-admin-color-warning-bg`) and the eye icon (`Eye`, lucide): the agent chip, the banner, the notice, the Overview metric, the WOULD DENY chip, the Inbox tags and the mode change dot. A would-deny mark has a dashed border, because nothing was blocked. ALLOW (brand yellow) and DENY (action pink) do not change.

### 10. Narrow screens (720 px and less)

The prototype was checked at 375 px. The real screens follow it:

1. **Banner**: icon, text and close button on the first row, the text on the full width; the overdue count under the title; the action below the text.
2. **Agent header**: chips never break inside; when the title row is full, the chips move whole to the next row.
3. **Report-only notice and inspector notice**: the text takes the full width; a chip next to the text moves under it.
4. **Dialogs**: the buttons keep one line and stay on one row.
5. **Inbox**: each row stacks the type tag, the subject and the context; the time and the action share the last row. This also fixes the real Inbox, where a type tag overlaps the subject at this width.
6. Investigate, the Overview and the revision history keep their current narrow layout.

---

## User Stories

- [ ] 1. As an administrator, I switch an agent to Report-only, so that I see what its policy would deny on real calls without blocking them.
- [ ] 2. As an administrator, I set an optional review date, so that the Inbox reminds me to decide.
- [ ] 3. As an administrator, I see on every screen that agents are in Report-only and how many calls would be denied, so that I do not forget an unprotected agent.
- [ ] 4. As an administrator, I review the would-deny calls in Investigate and the Inbox, apart from real denials, so that I fix the policy before I enforce it.
- [ ] 5. As an administrator, I switch the agent back to Enforce when no unexpected call would be denied.
- [ ] 6. As an auditor, I see who changed the mode of an agent, when and why, in its history.

---

## Backend dependencies

All from [Backend 057](../../backend/specs/057-2026-11-04-agent-report-only-mode.md). Names here are indicative; Backend 057 fixes them.

1. **Agent mode**: `enforcement` (`enforce` or `report_only`), `enforcement_changed_by`, `enforcement_changed_by_name`, `enforcement_changed_at` and `review_by` (date or null) on the agent record and the agent list.
2. **Mode command**: set `enforcement`, `review_by` and an optional `note`, with the agent `revision` and the conflict error of Backend 032. Changing only `review_by` is allowed. It applies at once.
3. **Enforcement in the PEP/PDP**: in Report-only, a policy deny (`no_grant`, `no_resource`, `condition`) lets the call run and is recorded as `would_deny`; the caller gets the normal result and no reference code. Token, identity connection, status, deletion and delegation stay enforced.
4. **Decision outcome**: the trace read API returns `would_deny` as its own outcome (not deny with a flag), with the same reason and path, and the agent mode at decision time; the `result` filter accepts `would_deny`; problems and the `deny` filter exclude it.
5. **Overview aggregates**: denied counts exclude `would_deny`; the overview adds the Report-only agent count and today's would-deny count.
6. **Banner summary** for the current environment: Report-only agent count and IDs, would-deny count of the last 24 hours, whether any would-deny call happened in the last 7 days, and the count of overdue review dates.
7. **Inbox signals**: `report_only_would_deny`, grouped by agent, tool, reason and UTC hour, never counted in `requests-denied`; and `report_only_review_due`, raised once when `review_by` passes for an agent still in Report-only.
8. **Mode history**: each mode or review date change is an immutable event with author, author name, time, from and to mode, review date and note, returned in the same timeline as the permission revisions (or in a list that the Admin merges by time).
9. **Agent counts per mode** for the agent list chips (from item 1).

---

## Implementation Decisions

1. The mode action, notice and chips belong to `src/features/access/components` next to the kill switch; the banner is a shared component mounted by `AdminLayout` for the current workspace and environment.
2. The banner dismissal uses `sessionStorage`, keyed by user, workspace and environment.
3. The Report-only palette is one set of classes in the design system (chip, dashed outcome, tag, metric), documented in `docs/design-system`, not prototype CSS.
4. The timeline changes of section 8 change `RevisionHistory.tsx` and its styles in `delegation.css` for every agent.
5. Times in the timeline are absolute UTC, like the detail and Investigate (this replaces the relative time of Admin 032 Implementation Decision 3).
6. When the real screens are implemented, remove the prototype page `/prototype/report-only`, its fixed data and every "Waiting backend · 057" chip.

---

## Testing Decisions

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build`, and the functional test in the built-in browser with real calls of an agent in Report-only (demo instance or development seed).

---

## Acceptance Criteria

- [x] 1. An administrator switches an agent to Report-only and back with the dialog, with an optional review date and note; a conflict asks for a reload. *Checked in the browser: support-assistant to Report-only with a review date and a note, and back to Enforce. The conflict path by code inspection (same mapping as the kill switch).*
- [x] 2. The agent list, the header and the notice show the mode, the review date and the overdue state; the review date dialog sets, changes and removes the date. *Checked in the browser: chips in the list and the header, the notice with author, date and would-deny count, Change date and Remove date. The overdue chip by code inspection and in the prototype (no agent was overdue in the real data during the test).*
- [x] 3. The banner shows on every screen while the environment has an agent in Report-only, in both states, stronger in Production, and hides for the session only. *Checked: shown on Overview, Access and Investigate in Production with the stronger style, hidden in Sandbox (no agent there), View report, and Hide for this session across screens. The quiet state by code inspection: every real agent in Report-only had would-deny calls in 7 days.*
- [x] 4. Investigate filters Would deny, shows the WOULD DENY chip, and never mixes would-deny calls into By problem or Deny; the inspector of a would-deny call follows section 4 item 5. *Checked: the Would deny filter, the WOULD DENY chip and the Report-only chip on the agent, and the inspector (Not blocked, Failed · not enforced, 1 would deny, Mode and Reference). Problems never include would deny (Backend 057).*
- [x] 5. The Inbox shows the Would deny and Review due types, apart from Requests denied. *Checked: the Would deny item with its subject, note, context and the Investigate target. Review due by code inspection: its item was resolved by the backend during the test.*
- [x] 6. Denied today excludes would-deny calls; the Report-only metric shows only while an agent is in Report-only. *Checked: Denied today says blocked calls only, the Report-only metric with 2 agents, and the traffic chart with the Would deny segment.*
- [x] 7. A mode change shows as an event in the revision history, with author, time, note and review date. *Checked: the mode changes of refunds-assistant in the timeline and the event detail.*
- [x] 8. The timeline changes of section 8 apply to every agent. *Checked: entry order, absolute UTC time, no filled selection, the eye dot, and the diff of Revision 6 against Revision 4 across mode events.*
- [x] 9. Every screen of this specification works at 375 px as section 10 states. *Checked at 375 px: banner, Overview, Access header and notice, Inbox rows.*
- [x] 10. No "Waiting backend" chip and no prototype page remain. *The prototype stays only on the design branch; main has no prototype page.*
- [x] 11. `npm run check` and `npm run build` pass. *Both pass.*
- [x] 12. Functional test in the built-in browser, run by Claude, at desktop and mobile width. *Run on the demo instance (Acme, Production) at desktop and 375 px width.*

---

## Out of Scope

- An automatic switch to Enforce on the review date (rejected: it can block a pilot without notice).
- A mandatory review date in Production.
- Report-only for token exchange or delegation (delegation is always enforced).
- Replay of recorded traffic against a draft (rejected: Chokepoint does not record call arguments).
- A suite of saved policy test cases.
- Recording the kill switch history as events (follow-up: today only the last status change is kept).
- Policy Intelligence suggestions from would-deny calls.

---

## Further Notes

The prototype runs against the demo instance: its Admin runs from the `admin-041` worktree on `http://acme.localhost:5174` (launch configuration `admin-041-demo`), in place of the demo Admin of `dev-infra/demo-instance/up.sh`. The screens around the prototype use real Acme data; the prototype data are fixed.

### Implementation notes (2026-11-04)

- The Inbox subject and note of the two Report-only types are written by the Admin from the signal context (`targets.ts`), like the context lines of the other types.
- The Overview traffic chart stacks the would-deny calls of each hour in the Report-only palette, after the Backend 057 review decision that counts them in the volume.
- A would-deny Inbox item opens All decisions filtered on Would deny, the agent, the tool and the closed hour; it is not a problem, so Investigate does not look one up for it (`useInvestigation`).
- The functional test found and fixed one defect: the banner and the Inbox detail guard shared a React key in `AdminLayout`.
- Review adjustments (2026-11-04): the Enforce access dialog says that it is counting while the would-deny count loads and shows an error when it fails, instead of "No call would have been denied"; a mode change also refreshes the Overview (checked: the Report-only metric went from 2 to 3 agents without a reload).
- Found in the user's review (2026-11-04): a filter menu at the start of a wrapped toolbar row was cut at the left edge of Investigate (the Result menu). `Dropdown` now aligns an open panel to the start of its trigger when the end alignment would leave its clipping container; the design system documents `admin-dropdown-panel[data-align="start"]`. Checked: the Result menu opens whole; a menu at the end of the row keeps the end alignment.
- The path line of the timeline uses the muted text color, so it stays visible on the timeline background (user review, 2026-11-04).
