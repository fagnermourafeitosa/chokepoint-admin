# Specification: Behavior Drift in the Inbox

- **Specification ID**: 060
- **Date**: 2026-11-16
- **Slug**: behavior-drift-inbox
- **Status**: In Progress
- **Owner**: admin / attention, externalapps
- **Related Specification**: [Backend 099 — Behavior Drift](../../backend/specs/099-2026-11-16-behavior-drift.md), [054 — Cumulative Limits and Signal Severity](054-2026-11-13-cumulative-limits-and-signal-severity.md), [058 — Tool Trifecta Levels](058-2026-11-15-tool-trifecta-levels.md), [059 — Slack Integration](059-2026-11-15-slack-integration.md)
- **Related Mock Contract**: none
- **Visual reference**: prototype folder [060-2026-11-16-behavior-drift-inbox](prototypes/060-2026-11-16-behavior-drift-inbox/), page `/prototype/behavior-drift` (development server only)

---

## Context & Background

Backend 099 raises a `behavior-drift` signal each time an agent leaves its usage pattern: a spike, a new tool or a new sequence. The Inbox already lists every signal type with a severity chip, a type tag, a subject, two context lines, the time and one action (Admin 054). Slack settings list the signal types that an administrator sends to Slack (Admin 059).

The scope is the Inbox and Slack only (user decision Q12, 2026-11-16). A view of the agent's pattern, such as the tool-by-day matrix of the public home, is a follow-up.

---

## Problem Statement

### 1. The Inbox does not know the new type

A `behavior-drift` signal would show without a label, a subject or context, and the type filter would not offer it.

### 2. Slack cannot be set for it

The Slack signal type list does not include Behavior drift.

---

## Solution

1. Add the type **Behavior drift** (user decision Q13) to the Inbox: label, type filter, subject, note, context and target, for each departure.
2. Add Behavior drift to the Slack signal type list, off by default (Backend 099).

---

## Practical Gains & Operational Outcomes

1. The administrator reads in one row what changed: which agent, which tool, which departure and its numbers.
2. One click opens the calls of that hour in Investigate.

---

## User Stories

1. As an administrator, I want a Behavior drift row in the Inbox, so that I see that an agent left its pattern.
2. As an administrator, I want the row to say whether it is a spike, a new tool or a new sequence, with its numbers, so that I judge it without opening the trace.
3. As an administrator, I want a High chip when nobody in the workspace called the tool or when the tool is `high` in a leg of the lethal trifecta, so that the strongest cases stand out.
4. As an administrator, I want the row to say when other agents have call conditions on the tool and this agent has none, so that I see a permission that may need a rule.
5. As an administrator, I want to filter the Inbox by Behavior drift, so that I review all drift together.
6. As an administrator, I want Behavior drift in the Slack signal types, so that the team learns where it works.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language
- **Context**: Inbox (`src/features/attention`), External apps Slack settings (`src/features/externalapps`).
- **Ubiquitous Terms**: Behavior drift; departure: spike, new tool, new sequence (Backend 099).

### 2. Aggregate Root & State Transitions
No new state. The signal keeps the Inbox lifecycle: open, reviewed, resolved.

### 3. Commands, Queries & Domain Ports
No new endpoint. The Inbox list and the Slack settings already carry the signal type and its context (Backend 099, Implementation Decisions 11 to 15).

---

## Implementation Decisions

1. **Label and filter**: `behavior-drift` → "Behavior drift", in the type map that feeds the tag and the type filter.
2. **Subject**: one signal lists every departure of one agent, tool and hour (Backend 099 Implementation Decision 12, user decision 2026-11-16). The subject names the strongest departure: `new-tool` "{agent} called {tool} for the first time", else `spike` "{agent} called {tool} far more than usual", else `new-sequence` "{agent} chained {previous_tools} → {tool} for the first time"
3. **Note**: one sentence for each departure of the signal, in the order of `departures`:
   - `spike` with `baseline` `agent`: "{count} calls in this hour; its pattern never passed {pattern_max} in an hour."; with `peers`: "{count} calls in this hour; no other agent passed {pattern_max} in an hour."; with `none`: "{count} calls in this hour, and nobody called this tool before."
   - `new-tool` with `first_in_workspace`: "No agent in this environment called this tool in the period."
   - `new-tool` without it: "The tool was granted, but this agent never called it in the period."
   - When `sensitive_leg` is set, the note adds: "The tool is high in {legs}.", with the leg names of the Lethal trifecta levels (Admin 058).
   - `new-sequence`: "This agent never called {tool} after {previous_tools}."
   - When `conditions_elsewhere` is set, the note adds: "Other agents have call conditions on this tool; this one has none."
4. **Context lines**: the tool, then the agent, the calls and the people, as the Lethal trifecta row (Admin 058).
5. **Severity**: the chip shows the stored severity, Medium or High (Admin 054); no change.
6. **Target**: Investigate, filtered by agent, tool and hour, as Requests denied.
7. **Slack**: Behavior drift joins the signal type list of Slack settings, off by default.
8. **No product name** in any label or note (project rule).
9. **Response that ran** (Backend 099, Implementation Decisions 16b to 16d): when the context has `response`, the note adds "The tool was suspended for this agent." or "The agent was disabled.", and the action opens the agent in Access.
10. **Suspended tool in Access** (user decisions Q1 and Q2, 2026-11-16): on the agent, a suspended tool shows a **Suspended** chip and a **Restore** action, with the time of the suspension. Restore asks for confirmation, removes the suspension and refreshes the agent. It never expires by itself. Restore names the suspension by its `id` (Backend 099 Implementation Decision 16c): when someone else already restored it, the notice says "Already restored by {name} at {time}." and the row goes; when the tool was suspended again, the notice says "{tool} was suspended again at {time}. Review the new behavior drift before you restore it." and the row shows the new suspension.
11. **Investigate** names the reason `tool_suspended` of a denied call.
12. **Where the suspended tools show** (2026-11-16): a warning notice under the agent heading in Access, in the pattern of the Report-only notice: one row for each suspended tool with its name, its server, the **Suspended** chip, the time and **Restore**. Restore asks for confirmation in the confirmation dialog.
13. **An agent disabled by a response** (user decision, 2026-11-16, Backend 099 Implementation Decision 16c): when `status_changed_source` is `barricade`, the agent says "Disabled by Barricade after a behavior drift" instead of naming a person.

---

## Testing Decisions

### Unit & Profile Tests
None: this module has no automated tests (AGENTS.md).

### Integration & Contract Tests
The context keys are those of Backend 099, Implementation Decision 13.

### Error Safety & UI Tests
A missing context key shows the row without that part, never `undefined`.

### Regression Tests
The rows of the other signal types do not change.

---

## Acceptance Criteria

- [ ] 1. A spike, a new tool and a new sequence each show their subject, note and context lines.
- [ ] 2. A new tool with `first_in_workspace` or `sensitive_leg` shows the High chip and its note.
- [ ] 3. `conditions_elsewhere` adds its sentence to the note.
- [ ] 4. The type filter offers Behavior drift.
- [ ] 5. The action opens Investigate filtered by agent, tool and hour.
- [ ] 6. Slack settings list Behavior drift, off by default.
- [ ] 7. A response that ran shows in the note, and the action opens the agent.
- [ ] 8. A suspended tool shows Suspended and Restore on the agent in Access, and Restore brings it back.
- [ ] 9. `npm run check` and `npm run build` pass.
- [ ] 10. Functional test: [060-2026-11-16-behavior-drift-inbox.md](functional-tests/060-2026-11-16-behavior-drift-inbox.md)

---

## Backend dependencies

- The `behavior-drift` signal type, its context keys and its severity: [Backend 099](../../backend/specs/099-2026-11-16-behavior-drift.md), Implementation Decisions 11 to 15.
- Behavior drift in the Slack signal types: [Backend 099](../../backend/specs/099-2026-11-16-behavior-drift.md), Implementation Decision 15.

- Suspended tools of an agent and their restore: [Backend 099](../../backend/specs/099-2026-11-16-behavior-drift.md), Implementation Decision 16c.
- The `response` context key and the agent target of a signal whose response ran: Backend 099, Implementation Decision 16d.

---

## Out of Scope

- A view of the agent's pattern (the tool-by-day matrix): follow-up (user decision Q12).
- The Barricade section, with the workspace settings of the drift heuristics and a shield icon: follow-up specification (user decision, 2026-11-16).

---

## Further Notes

- The heuristics, their defaults and their references are in Backend 099.
