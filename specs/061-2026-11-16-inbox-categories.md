# Specification: Inbox Categories

- **Specification ID**: 061
- **Date**: 2026-11-16
- **Slug**: inbox-categories
- **Status**: Implemented
- **Owner**: admin / attention, externalapps
- **Related Specification**: [Backend 100 — Signal Categories](../../backend/specs/100-2026-11-16-signal-categories.md), [054 — Cumulative Limits and Signal Severity](054-2026-11-13-cumulative-limits-and-signal-severity.md), [060 — Behavior Drift in the Inbox](060-2026-11-16-behavior-drift-inbox.md)
- **Related Mock Contract**: none
- **Visual reference**: prototype folder [061-2026-11-16-inbox-categories](prototypes/061-2026-11-16-inbox-categories/), page `/prototype/inbox-categories` (development server only)

---

## Context & Background

The Inbox lists every signal in one table, ordered by severity, with a type tag (Admin 054). Access, security and operations signals read alike (user, 2026-11-16). Backend 100 gives each signal a category.

---

## Problem Statement

### 1. A possible incident sits among access signals

A Behavior drift row and a Requests denied row look alike, although the first may be an incident and the second is a rule doing its work.

---

## Solution

1. The Inbox has tabs by category, each with its open count (user decision Q2, 2026-11-16): **All**, **Security**, **Access** and **Operations**. All is the default and keeps today's list. The order puts Security first after All, so the strongest signals sit next to the default.
2. Inside a tab, the existing filters (status, severity, type) apply, and the type filter offers only the types of that category.
3. The type tag keeps its color; the tab says the category, so the row shows no category label.

---

## Practical Gains & Operational Outcomes

1. Security signals have a place of their own in the screen that the administrator opens every day.
2. The open count of each tab says where attention is needed.

---

## User Stories

1. As an administrator, I want a Security tab, so that I review possible incidents apart from access signals.
2. As an administrator, I want the open count on each tab, so that I see where attention is needed.
3. As an administrator, I want All to stay the default, so that nothing I saw before disappears.
4. As an administrator, I want the type filter to list only the types of the open tab, so that I do not pick a type with no rows.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language
- **Context**: Inbox (`src/features/attention`).
- **Ubiquitous Terms**: category: Access, Security, Operations (Backend 100).

### 2. Aggregate Root & State Transitions
No new state. The tab is a view filter, kept in the component state like the other Inbox filters (status, severity, type).

### 3. Commands, Queries & Domain Ports
- The list request sends `category` for a tab other than All.
- The tab counts come from `by_category` of the counts request.

---

## Implementation Decisions

1. **Tabs**: All, Security, Access, Operations, as a segmented control above the table, each with `(n)` open signals; All shows the total open count.
2. **Type filter by tab**: the options are the types of the tab's category; switching the tab resets a type filter that does not belong to it.
3. **No category label in the row**: the tab carries it.
4. **Slack**: the message format is the backend's (Backend 100, Implementation Decision 4); the Slack settings do not change.

---

## Backend dependencies

- `category` on each signal, the `category` filter and `by_category` in the counts: [Backend 100](../../backend/specs/100-2026-11-16-signal-categories.md), Implementation Decision 3.

---

## Testing Decisions

### Unit & Profile Tests
None: this module has no automated tests (AGENTS.md).

### Error Safety & UI Tests
A tab with no open signal shows "(0)" and the empty state of the Inbox.

### Regression Tests
All lists what the Inbox listed before; the severity order does not change.

---

## Acceptance Criteria

- [x] 1. The Inbox shows All, Security, Access and Operations with their open counts. Evidence: S1, 2026-11-16.
- [x] 2. Each tab lists only the signals of its category; All lists every signal. Evidence: S1, 2026-11-16.
- [x] 3. The type filter lists only the types of the open tab. Evidence: S2, 2026-11-16.
- [x] 4. `npm run check` and `npm run build` pass. Evidence: run on the task branch, 2026-11-16.
- [x] 5. Functional test: [061-2026-11-16-inbox-categories.md](functional-tests/061-2026-11-16-inbox-categories.md)

---

## Out of Scope

- Moving security signals to the Barricade section (user decision Q2).
