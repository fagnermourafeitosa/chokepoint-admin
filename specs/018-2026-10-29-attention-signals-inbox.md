# Specification: Attention Signals Inbox

- **Specification ID**: 018
- **Date**: 2026-10-29
- **Slug**: attention-signals-inbox
- **Status**: Proposed
- **Owner**: Admin — Overview page
- **Related Specification**: [Backend 020 — Attention Signals](../../backend/specs/020-2026-10-29-attention-signals.md)
- **Related Specification**: [Admin 016 — Remove Automated Interface Tests](016-2026-10-29-remove-automated-interface-tests.md)

> Approved for implementation by the user on 2026-10-29. The scope decisions below were made by the user on 2026-10-29.
>
> **Pending decision (2026-10-29):** the history block on the Overview (recent changes or recently reviewed signals) is on hold. The user will decide later. Do not implement any history block from this specification. See Deferred Decisions.

---

## Context & Background

The Overview page (`src/pages/OverviewPage.tsx`) is the home of the Admin. The reference prototype is `docs/chokepoint-workbench`. Its Overview shows counters and an Inbox table. The prototype uses sample data.

Backend 020 adds a module that stores attention signals. A signal says that an administrator must look at something. The backend offers a paged list API, a counters API and a "mark as reviewed" operation.

---

## Problem Statement

1. The Overview does not show what needs the administrator's attention.
2. The administrator cannot see, in one place, how many items wait and which ones.
3. The prototype block "Recent changes" has no real data source. The backend has no audit log of published changes. The user removed the block for now.

---

## Solution

Build the Overview from real data:

1. Three counters in a row above the Inbox: **Pending**, **Requests denied today** and **Tools without review**.
2. An **Inbox** table of unreviewed signals, 5 rows for each page, with a type filter.
3. No block of recent changes. See Deferred Decisions.
4. No page title, no search button in the top bar, no "New agent" button on this page.

The Admin only consumes the backend. It does not create or change signals, except for the "mark as reviewed" call.

---

## Decisions

The user made these decisions on 2026-10-29.

1. **Scope**: Inbox and the counters that have a real source. The counter "Requests denied today" was added on 2026-10-29, after Backend 021 (decision trace) provided its source.
2. **Recent changes**: Removed from the Overview for now. The user changed an earlier decision on 2026-10-29 (a block of recently reviewed signals) and will decide later.
3. **Inbox list**: The Inbox shows only unreviewed signals. A signal leaves the Inbox when the administrator opens its target.

### Deferred Decisions

- What the Overview shows for history: recent changes, recently reviewed signals, or nothing. The user decides later.
- Where a reviewed signal is visible. Until this is decided, a reviewed signal is not visible in the Admin. The user must confirm that Decision 3 still holds without a history block.

---

## User Stories

- [ ] 1. As an administrator, I want to see how many signals wait for me, so that I know the state at a glance.
- [ ] 2. As an administrator, I want to see how many tools have no review, so that I know how much of the catalog is not classified.
- [ ] 3. As an administrator, I want a table of unreviewed signals with type, subject, context, time and one action, so that I can act without opening each item.
- [ ] 4. As an administrator, I want to filter the table by type and move between pages, so that I can work through a long list.

---

## Architecture Gate

### 1. Module Ownership

- `src/features/attention/`: API client, data hooks and components for the Inbox and the counters.
- `src/pages/OverviewPage.tsx`: composition only. It places the components. It holds no data logic.
- The module follows the design system in `docs/design-system` (read before implementation) and the `cp-admin-` class prefix.

### 2. Data Contract

The Admin reads the backend 020 API. The Admin shows these fields of a signal: `type`, `subject`, `context`, `occurred_at`, `target_route`, `target_params` and `target_label`.

The Admin keeps a fixed map from `target_route` to an Admin route. A route name that is not in the map is not shown as a link. The Admin never builds a link from a full URL.

**`requests-denied` signals** (Backend 021): the first context line is the tool. The second line is the agent and the count, for example "agent-app · 1 request" or "agent-app · 3 requests".

**`tool-discovery` signals** (Backend 020, Tool Discovery Producer; decided by the user on 2026-10-29):

- Context keys: `server`, `changed` and `removed`. The first context line is the server name. The second line lists the counts that are above zero, for example "2 changed · 1 removed".
- Target: `tool-catalog` with the parameters `server_id` and `connection_type` (`custom` or `enterprise`). The Admin opens `/access/integrations?type=<connection_type>&server=<server_id>`, which selects that connection. Another value of `connection_type` opens the Custom MCP tab.

### 3. Counters

| Counter | Source | Opens |
|---|---|---|
| Pending | Backend 020 counters: number of unreviewed signals | Scrolls to the Inbox |
| Requests denied today | Backend 021 counters: `denied_today`, the denied calls since 00:00 UTC | Filters the Inbox to `requests-denied` signals and scrolls to it |
| Tools without review | Existing MCP registry data (backend 006): managed tools in the review-required state | The MCP tool catalog, filtered to tools that need review |

The Admin adds no new backend endpoint for the second counter. If the existing registry responses do not give this count, the implementation must stop and ask the user.

---

## Implementation Decisions

1. **Layout.** From top to bottom: counter row, Inbox. Both use the full content width. No title block above them.
2. **Inbox columns**: Type, Subject, Context, When, and the action. The Type column shows the signal type name. The action shows `target_label`.
3. **Page size and order.** 5 rows for each page. The newest `occurred_at` is first. A pager shows "1–5 of N" with Previous and Next.
4. **Type filter.** A select above the table: all types, or one type. A change resets the page to the first page.
5. **Open and review.** A click on the action does two things: it calls "mark as reviewed", and it goes to the target page. If the call fails, the Admin still goes to the target page and shows a short error notice on return. It does not block the administrator.
6. **After review**, the Admin refreshes the Inbox and the Pending counter.
7. **Empty states.** No unreviewed signals: "Nothing needs your attention." No match for the filter: "No signals for this type."
8. **Loading and errors.** Show a loading state for each block. A failed block shows a short message and a retry action. One failed block does not hide the others. Do not show raw error text.
9. **Temporary warning.** Removed on 2026-10-29: the `tool-discovery` producer (Backend 020) and the `requests-denied` producer (Backend 021) exist. A future limitation of this page uses the `cp-admin-notice` warning presentation, as `AGENTS.md` requires.
10. **Responsive.** On narrow screens the Inbox shows the type, the subject and the action. The context and time columns are hidden. The counters stack in one column.
11. **No automated tests.** Admin specification 016 removes them. Do not add them.
12. **File size.** Split a file when it reaches 300 lines and the split has a clear responsibility.

---

## Validation

Per Admin specification 016, validate with `npm run check`, `npm run build` and manual checks in the built-in browser. Use the local development credentials from `AGENTS.md`. Report only checks that were run.

Manual checks:

- The counters show the backend values.
- The Inbox shows 5 rows and pages through all signals.
- The type filter limits the rows, and the pager follows the filter.
- A click on the action opens the target page and removes the signal from the Inbox.
- Empty, loading and error states appear as specified.
- The page works at a narrow width.

---

## Acceptance Criteria

- [ ] 1. The Overview shows the Pending, Requests denied today and Tools without review counters with real values.
- [ ] 2. The Inbox shows only unreviewed signals, 5 for each page, with a type filter and a pager.
- [ ] 3. The action of a row marks the signal as reviewed and opens its target.
- [ ] 4. No link is built from a full URL. Unknown route names are not linked.
- [ ] 5. No temporary warning is shown, because both signal producers exist.
- [ ] 6. The Overview has no page title, no "New agent" button, no top bar search button, and no block of recent changes.
- [ ] 7. `npm run check` and `npm run build` pass, and the manual checks pass.

---

## Known Limitations and Pending Implementation

These items are not implemented.

| Pending item | Why it is missing | What removes the limitation |
|---|---|---|
| Admin page for the `decision-detail` target | The Investigate page has no decision list or detail yet. The route opens `/investigate`. | A decision list API and an Admin specification for the Investigate page. |
| Admin pages for `person-detail` and `tool-catalog` targets | The Admin has no detail pages yet. The routes open `/access` and the integrations tab of the signal's connection type, with the server selected. | Detail pages in a later specification. Update `src/features/attention/targets.ts`. |

Update this section when any item changes.

---

## Out of Scope

- A history block (recent changes or recently reviewed signals) and a "view all" page for reviewed signals.
- Creating signals from the Admin.
- A per-user review state.
- Automated interface tests.

---

## Further Notes

- The prototype in `docs/chokepoint-workbench` shows the target layout, but its sample data does not describe real producers. Today the identity lifecycle receiver creates `idp-user-disable` signals, and a rediscovery of an existing MCP server creates `tool-discovery` signals.
- The prototype shows reviewed rows dimmed in the Inbox. This specification removes reviewed rows from the Inbox (Decision 3).
