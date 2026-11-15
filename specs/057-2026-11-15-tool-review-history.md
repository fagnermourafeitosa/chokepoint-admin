# Specification: Tool Review History and Remembered Denials

- **Specification ID**: 057
- **Date**: 2026-11-15
- **Slug**: tool-review-history
- **Status**: Proposed
- **Owner**: Admin / MCP integrations
- **Related Specification**: [Backend 096 — Tool Review History and Remembered Denials](../../backend/specs/096-2026-11-15-tool-review-history.md), [055 — Tool Review Text](055-2026-11-14-tool-review-text.md)
- **Related Mock Contract**: none
- **Visual Reference**: [prototype folder](prototypes/057-2026-11-15-tool-review-history/), pages `/prototype/tool-review-order` (review page) and `/prototype/integrations` (Custom MCPs list with the Review history panel)

---

## Context & Background

The review page of Admin 055 lists the tools to review in discovery order. Backend 096 keeps a denied tool, sends it back to review only when it changes, orders each review by criticality and records every review and automatic disable as an immutable event. The decisions of Backend 096 were made with the user on 2026-11-15 (Q1 to Q6).

---

## Problem Statement

### 1. The review does not show what matters first

A tool granted to agents and a tool that was denied before look the same in To review.

### 2. Changed denied tools block the review

Each one needs its own decision before Confirm.

### 3. The history is not visible

Nobody can see who approved or denied a tool, when, or which text it had.

### 4. The server details repeat other screens

A click on a row of the Custom MCPs list opens the server details below the list: what the server must trust and its tools. The Edit dialog already shows what to trust, and the review page shows every tool with more detail. The list has no pager, and "Edit & discover" is one action for two jobs (user, 2026-11-15).

---

## Solution (from the prototype)

1. **Order.** To review follows `review_order` from the backend: tools granted to agents first, then the others, then the tools denied before; inside each, destructive, write, open world and read only (Backend 096, decision 6).
2. **Use and history in the list.** A tool granted to agents shows "Granted to N agents" under its name; a tool denied before shows "Denied before".
3. **Keep N denied.** Next to "Approve N read-only", "Keep N denied" keeps every changed tool that was denied before denied at once (Backend 096, decision 8). The decision of each one is still visible and can be changed before Confirm.
4. **Detail of a tool denied before.** An info notice says that it was denied in an earlier review and came back because the server changed it; the diff reads "Changes since you denied it"; the buttons are "Keep <tool> denied" and "Approve <tool>". A changed granted tool says how many agents grant it.
5. **Review history.** "Review history", in the menu of each row of the Custom MCPs list, opens a side panel in the pattern of the agent revision history: a timeline of reviews (reviewer and time) and automatic rediscoveries (Xokepoint), and for the selected event the count of approved, denied and disabled tools and each tool with its decision and, on demand, the text decided on.
6. **No server details below the list** (user, 2026-11-15). A row does not open details. Each row has one visible action and a "More actions" menu, as the rows of Identity providers in the same screen (user, 2026-11-15: four equal buttons on every row hid the main action). The visible action is Review when a tool needs review (user, 2026-11-15: a Review required row showed Discover) and Discover otherwise, with one width for both labels; both open the review page with the stored connection, without a dialog, and the review runs the discovery. The menu has Edit connection (the dialog: name, endpoint and what the server must trust; saving runs the discovery and opens the review) and Review history. The Status column is the switch of the design system (user, 2026-11-15): turning it off asks first (user, 2026-11-15: a disable cuts every agent off at once): a confirmation names the server and shows its managed tools, the agents that have grants on them (count and names) and the allowed calls of the last 24 hours, with Cancel and Disable server; turning it on opens the review page with Enable server after review checked, because a server is enabled again only by a confirmed review (Admin 055, decision 9). The actions are right-aligned under an Actions header.
7. **Pager.** The Custom MCPs list has the pager of the Admin lists (records count, Previous and Next), 10 servers a page. The footnote "Connections belong to this workspace and environment. Agent permissions determine who can use their tools." is removed (user, 2026-11-15).
8. **Links that opened the details.** Every target that opened the server details (Open tool of a reviewed tool in Review coverage, Open server of an Automatic rediscovery failed item, the tool-catalog targets of Investigate and the Inbox) opens the review page of that server, at that tool when the target names one.
9. **A smaller tour button** (user, 2026-11-15). The fixed "Take the tour" button (Admin 052) covered Confirm review and the Next of the pagers. It becomes a small icon button (a help icon) with the tooltip "Take the tour", and the review footer keeps only its width free.

---

## Backend dependencies

- [ ] [Backend 096](../../backend/specs/096-2026-11-15-tool-review-history.md): `review_order` and the granted agent count in previews and servers; denied tools kept and marked denied before; the review history API with the reviewer name; the system events of the automatic rediscovery; the impact of a disable (granting agents and the allowed calls of the last 24 hours, decision 13).

---

## Acceptance Criteria

- [ ] 1. The review page follows the order and markers of the prototype, with "Keep N denied".
- [ ] 2. The server details open the Review history panel of the prototype with real events.
- [ ] 3. `npm run check` and `npm run build` pass.
- [ ] 4. Functional test in the browser on the development stack with Backend 096.
- [ ] 5. Public docs describe the order, "Keep N denied" and the Review history before the merge.

---

## Out of Scope

- An automatic evaluator that marks a suspicious description.
