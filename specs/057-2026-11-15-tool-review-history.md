# Specification: Tool Review History and Remembered Denials

- **Specification ID**: 057
- **Date**: 2026-11-15
- **Slug**: tool-review-history
- **Status**: Proposed
- **Owner**: Admin / MCP integrations
- **Related Specification**: [Backend 096 — Tool Review History and Remembered Denials](../../backend/specs/096-2026-11-15-tool-review-history.md), [055 — Tool Review Text](055-2026-11-14-tool-review-text.md)
- **Related Mock Contract**: none
- **Visual Reference**: [prototype folder](prototypes/057-2026-11-15-tool-review-history/), pages `/prototype/tool-review-order` (review page) and `/prototype/review-history` (Review history of a server)

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

---

## Solution (from the prototype)

1. **Order.** To review follows `review_order` from the backend: tools granted to agents first, then the others, then the tools denied before; inside each, destructive, write, open world and read only (Backend 096, decision 6).
2. **Use and history in the list.** A tool granted to agents shows "Granted to N agents" under its name; a tool denied before shows "Denied before".
3. **Keep N denied.** Next to "Approve N read-only", "Keep N denied" keeps every changed tool that was denied before denied at once (Backend 096, decision 8). The decision of each one is still visible and can be changed before Confirm.
4. **Detail of a tool denied before.** An info notice says that it was denied in an earlier review and came back because the server changed it; the diff reads "Changes since you denied it"; the buttons are "Keep <tool> denied" and "Approve <tool>". A changed granted tool says how many agents grant it.
5. **Review history.** The server details have a "Review history" action that opens a side panel in the pattern of the agent revision history: a timeline of reviews (reviewer and time) and automatic rediscoveries (Xokepoint), and for the selected event the count of approved, denied and disabled tools and each tool with its decision and, on demand, the text decided on.

---

## Backend dependencies

- [ ] [Backend 096](../../backend/specs/096-2026-11-15-tool-review-history.md): `review_order` and the granted agent count in previews and servers; denied tools kept and marked denied before; the review history API with the reviewer name; the system events of the automatic rediscovery.

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
