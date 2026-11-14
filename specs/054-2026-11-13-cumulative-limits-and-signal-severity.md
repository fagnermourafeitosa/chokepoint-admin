# Specification: Cumulative Limits in Rules and Signal Severity

- **Specification ID**: 054
- **Date**: 2026-11-13
- **Slug**: cumulative-limits-and-signal-severity
- **Status**: In Progress
- **Owner**: admin / access (rule editor), attention (Inbox)
- **Related Specification**: [048 — Relation Side Panel](048-2026-11-06-relation-side-panel.md), [049 — Investigate Layout and Rules Read as Sentences](049-2026-11-07-investigate-layout.md)
- **Related Backend Specification**: [Backend 087 — Cumulative Limits Across Calls](../../backend/specs/087-2026-11-13-cumulative-limits-across-calls.md), [Backend 088 — Automatic Tool Rediscovery and Signal Severity](../../backend/specs/088-2026-11-13-automatic-tool-rediscovery.md)
- **Visual reference**: prototype folder [`specs/prototypes/054-2026-11-13-cumulative-limits-and-signal-severity/`](prototypes/054-2026-11-13-cumulative-limits-and-signal-severity/), pages `/prototype/rule-limits` and `/prototype/inbox-severity`
- **Related Mock Contract**: none

> **Approved** by the user on 2026-11-13.

---

## Context & Background

Backend 087 lets a call condition read earlier calls of the same agent through usage definitions (`sum`, `count_calls`, `count_distinct`, `formerly_within`, `since_within`) and denies a reached limit with the reason `reach_limit`. Backend 088 rediscovers tools every 15 minutes, adds the signal `mcpserver_disconnected`, and gives every attention signal a severity from 0 to 3.

The rule editor of the Access side panel (Admin 048) builds conditions on call arguments and trusted attributes, and a saved rule reads as a sentence (Admin 049). The Inbox lists signals by time.

---

## Problem Statement

### 1. The rule editor cannot write a limit

An administrator cannot cap the total, the number of calls or the distinct arguments of an agent in a window.

### 2. The Inbox gives every item the same weight

A changed tool or a disconnected server is listed among denied calls, by time only.

---

## Solution

1. The rule editor gets **Add a limit**, next to **Add a condition**. A limit line chooses the operator, its parameters, **Per** (the key, optional), the window and, for a number, the comparison and the value.
2. The rule reads as one sentence, with the limit lines in it.
3. A `formerly_within` line shows a warning: it checks the call, not its result.
4. The Inbox shows a severity chip on each item and lists the most severe first. It shows the new type `mcpserver_disconnected`.

---

## Practical Gains & Operational Outcomes

1. **Running caps in the rule editor**:
   - *Before*: a rule limits each call alone.
   - *Now*: a rule can limit the calls of an agent in a rolling window, per customer or for all calls.

2. **The Inbox puts the urgent first**:
   - *Before*: the order is by time only.
   - *Now*: high-severity items come first, with a chip.

---

## User Stories

- [ ] 1. As an administrator, I want to add a limit line to a rule, so that I can cap what an agent does across calls.
- [ ] 2. As an administrator, I want help that explains **Per** with an example of each case, so that I know when a total is per customer and when it covers all calls.
- [ ] 3. As an administrator, I want a warning on `formerly_within`, so that I know it does not read the result of the earlier call.
- [ ] 4. As an administrator, I want a rule with limits to read as a sentence, so that I do not read CEL.
- [ ] 5. As an administrator, I want the Inbox ordered by severity with a chip, so that I see the most important item first.
- [ ] 6. As an administrator, I want to see when a server is disconnected, so that I fix it before agents fail.

---

## Implementation Decisions

### Rule editor (Backend 087)

1. **Add a limit** is a button next to **Add a condition** in the rule builder, with a help icon. A rule can mix condition lines and limit lines, and can have more than one limit line.
2. **Operator names** are the Dogwood names written with `_`, in the selector and in the sentence: `sum`, `count_calls`, `count_distinct`, `formerly_within`, `since_within` (Backend 087, Implementation Decision 1). Under the selector, one line says what the operator reads.
3. **Fields of a limit line**, by operator:
   - `sum`: **Of** (integer parameters only), **Per**, **In the last**, **Is** (at most, less than) and a value.
   - `count_calls`: **Per**, **In the last**, **Is** and a value.
   - `count_distinct`: **Of** (any parameter), **In the last**, **Is** and a value.
   - `formerly_within`: **Tool** (another tool of the same server), **With the same** (a parameter of this tool = a parameter of that tool), **In the last**.
   - `since_within`: **Since** (the anchor tool), **No call of** (the watched tool), **With the same**, **In the last**.
4. **Per** is optional. Its first option is **All calls**. Its help, with the two examples of Backend 087 Implementation Decision 16: per `customer_id`, each customer has their own total; **All calls**, one total for every call of the agent to the tool.
5. **In the last**: a number and a unit (minutes, hours). The field itself keeps the value within 24 hours (1440 minutes): a larger number becomes the maximum, a unit change keeps the value within it, and **Add to draft** is disabled while a window is empty (user decision, 2026-11-13). Its help says only that the window is rolling and nothing resets at midnight; no help text repeats the 24 hours, because the field shows them.
6. **`formerly_within` warning**: a warning notice in the line, "Checks the call, not its result": the line checks only that the tool was called with the same argument and did not fail; a call that returned a refusal still counts.
7. **Reads as**: each limit line adds its part to the sentence, joined with the other lines. Examples: "count_calls of refund_order per customer_id in the last 1 hour is at most 10"; "sum of amount per customer_id in the last 24 hours is at most 100000"; "formerly_within get_order in the last 1 hour with the same order_id".

12. **Help texts** (user request, 2026-11-13), in the words of the prototype data file:
    - **Of** of `sum` (help icon): only integer parameters, for example an amount in cents; a call without this argument, or with zero or a negative number, is denied as a rule that is not met, not as a reached limit.
    - **How limits count**, a muted collapsible box under the limit lines while the rule has at least one, closed by default (user decision, 2026-11-13): a call counts from the moment it is allowed, so calls at the same time see each other; a call that fails does not count, and a call without an answer keeps counting until it leaves the window; a call over the limit is denied with the reason `reach_limit`, and for an agent in Report-only it runs, counts and is recorded as would deny; each agent has its own totals, so two agents together can go over the same limit; saving a change to the rule starts its totals from zero.
    - The help of **Per** (item 4), of **In the last** (item 5), the line under each operator (item 2) and the `formerly_within` warning (item 6).

### Inbox (Backend 088)

8. **Severity chip** in a first column, **Severity**: 3 **High**, 2 **Medium**, 1 and 0 **Low** (Backend 088 Implementation Decision 8: 0 and 1 share the label and differ only in the order).
9. **Order**: by severity, then by time, as the backend serves it.
10. **`mcpserver_disconnected`** has the type label **Server disconnected** and opens the server.
11. **Filter by severity** (user decision, 2026-11-13): a third filter of the Inbox, between status and type, with **All severities**, **High**, **Medium** and **Low**. **Low** shows severity 1 and 0. The backend filters, so pagination and the total follow the filter.

---

## Backend dependencies

| Element | Backend item |
| :--- | :--- |
| Limit lines, Per, window, the values in `context.chokepoint.usage` | [Backend 087](../../backend/specs/087-2026-11-13-cumulative-limits-across-calls.md), Implementation Decisions 1–17 |
| Severity of each signal and the order of the list | [Backend 088](../../backend/specs/088-2026-11-13-automatic-tool-rediscovery.md), Implementation Decisions 6–8 |
| The `severity` filter of the signal list | [Backend 088](../../backend/specs/088-2026-11-13-automatic-tool-rediscovery.md), Implementation Decision 7 |
| The `mcpserver_disconnected` signal and its context | [Backend 088](../../backend/specs/088-2026-11-13-automatic-tool-rediscovery.md), Implementation Decisions 5 and 10 |

---

## Acceptance Criteria

- [x] 1. The rule editor adds, edits and removes limit lines for each operator, with the fields of item 3. Evidence: code inspection of `LimitClause.tsx`, `ConditionEditor.tsx`.
- [x] 2. **Per** offers **All calls** and the parameters, with the help of item 4.
- [x] 3. A `formerly_within` line shows the warning of item 6.
- [x] 4. A rule with limits reads as the sentence of item 7, in the editor and in the saved list.
- [x] 5. The Inbox shows the severity chip and the order of items 8 and 9, the type of item 10 and the filter of item 11.
- [x] 6. `npm run check` and `npm run build` pass (2026-11-14).
- [ ] 7. Functional test: [054-2026-11-13-cumulative-limits-and-signal-severity.md](functional-tests/054-2026-11-13-cumulative-limits-and-signal-severity.md) — not met: the functional test runs after Backend 087 and 088 are merged.

---

## Out of Scope

- A total shared by all agents (a future backend specification).
- Values read from the result of a tool.

---

## Further Notes

- The layout of both prototype pages was approved by the user on 2026-11-13.

- The demo `refund_order` has `order_id`, a decimal `amount` and `reason`. The functional test needs a `customer_id` parameter and an integer amount on the demo server; the prototype data adds them.
