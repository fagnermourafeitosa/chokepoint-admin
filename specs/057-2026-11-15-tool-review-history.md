# Specification: Tool Review History and Remembered Denials

- **Specification ID**: 057
- **Date**: 2026-11-15
- **Slug**: tool-review-history
- **Status**: Implemented
- **Owner**: Admin / MCP integrations
- **Related Specification**: [Backend 096 — Tool Review History and Remembered Denials](../../backend/specs/096-2026-11-15-tool-review-history.md), [055 — Tool Review Text](055-2026-11-14-tool-review-text.md)
- **Related Mock Contract**: none
- **Visual Reference**: [prototype folder](prototypes/057-2026-11-15-tool-review-history/) (Archived; the routes were removed at implementation), pages `/prototype/tool-review-order` (review page), `/prototype/integrations` (Custom MCPs list with the Review history panel, and the Identity providers tab) and `/prototype/review-coverage` (Review coverage)

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
6. **No server details below the list** (user, 2026-11-15). A row does not open details. Each row has one visible action and a "More actions" menu, as the rows of Identity providers in the same screen (user, 2026-11-15: four equal buttons on every row hid the main action). The visible action is Review when a tool needs review (user, 2026-11-15: a Review required row showed Discover) and Discover otherwise, with one width for both labels; both open the review page with the stored connection, without a dialog, and the review runs the discovery. The menu has Edit connection (the dialog: name, endpoint and what the server must trust; saving runs the discovery and opens the review) and Review history. The Status column is the switch of the design system (user, 2026-11-15): turning it off asks first (user, 2026-11-15: a disable cuts every agent off at once): a confirmation names the server and shows its managed tools, the agents that have grants on them (count and names) and the allowed calls of the last 24 hours, with Cancel and Disable server; turning it on opens the review page with Enable server after review checked, because a server is enabled again only by a confirmed review (Admin 055, decision 9). The actions are right-aligned under an Actions header, as small ghost buttons with a More trigger of the same height (design system, layouts.md, Actions).
7. **Pager.** The Custom MCPs list has the pager of the Admin lists (records count, Previous and Next), 10 servers a page. The footnote "Connections belong to this workspace and environment. Agent permissions determine who can use their tools." is removed (user, 2026-11-15).
8. **Links that opened the details.** Every target that opened the server details (Open tool of a reviewed tool in Review coverage, Open server of an Automatic rediscovery failed item, the tool-catalog targets of Investigate and the Inbox) opens the review page of that server, at that tool when the target names one.
9. **A smaller tour button** (user, 2026-11-15). The fixed "Take the tour" button (Admin 052) covered Confirm review and the Next of the pagers. It becomes a small icon button (a help icon) with the tooltip "Take the tour", and the review footer keeps only its width free.
10. **Small row actions in every list of the Admin** (user, 2026-11-15). The design system asks for small ghost row actions (layouts.md, Actions); three tables use the normal size: the Custom MCPs list (replaced by decision 6), the Identity providers list (Edit and the More trigger, `src/features/identity/IdentityRegistry.tsx`) and Review coverage (Open tool, `src/features/mcp/ToolReviewCatalog.tsx`). All of them use `cp-admin-button--ghost cp-admin-button--small`, and the More trigger takes the same height. Their Actions header is right-aligned, and the review state of Review coverage is a badge (Needs review, Reviewed), as the status of the other lists.
11. **The FastMCP example moves to the connection dialog** (found at implementation, 2026-11-15). It was shown only in the server details, which decision 6 removes, and the dialog said "The server details show an example". The Connect and Edit dialog now shows the issuer, JWKS and audience with the FastMCP example, collapsed.

---

## Backend dependencies

- [x] [Backend 096](../../backend/specs/096-2026-11-15-tool-review-history.md): `review_order` and the granted agent count in previews and servers; denied tools kept and marked denied before; the review history API with the reviewer name; the system events of the automatic rediscovery; the impact of a disable (granting agents and the allowed calls of the last 24 hours, decision 13); the total and the search `q` of the server list (decision 14).

---

## Acceptance Criteria

- [x] 1. The review page follows the order and markers of the prototype, with "Keep N denied".
- [x] 2. The server details open the Review history panel of the prototype with real events.
- [x] 3. `npm run check` and `npm run build` pass.
- [x] 4. Functional test in the browser on the development stack with Backend 096.
- [x] 5. Public docs describe the order, "Keep N denied" and the Review history before the merge.

---

## Out of Scope

- An automatic evaluator that marks a suspicious description.

**Verification (2026-11-15).** `npm run check` and `npm run build` pass. Functional test on the development stack with Backend 096: [functional test](functional-tests/057-2026-11-15-tool-review-history.md), S1 to S6 passed. Public docs updated (frontend `0570bfb`): tool review, the server list, customer servers, the custom server integration guide and the Events export. The prototype is archived and its routes removed.
