# Specification: Agent Names in the Inbox

- **Specification ID**: 033
- **Date**: 2026-11-02
- **Slug**: agent-names-in-inbox
- **Status**: Implemented
- **Owner**: Admin — Overview and Inbox (`src/features/attention`)
- **Related Specification**: [Backend 041 — Agent Names in Attention Signals](../../backend/specs/041-2026-11-02-agent-names-in-signals.md) (`context.agent_name`)
- **Related Specification**: [030 — Investigate with Agent, Subject and Token Exchanges](030-2026-10-31-investigate-agent-subject-and-token-exchanges.md) (the token exchange item, section 5)

---

## Context & Background

The Inbox items of denied requests and denied token exchanges name their agent by its UUID. The line of a denied requests item already reads `context.agent_name`, but the backend does not send it yet. The line of a denied token exchanges item reads only `context.agent`.

---

## Problem Statement

### 1. The Inbox shows a UUID for the agent

An administrator can not tell which agent an item is about without opening Investigate.

---

## Solution

1. Both item types show the agent name from `context.agent_name`, and the ID when the name is missing (an agent that no longer exists), as Investigate does.
2. The token exchange line keeps its order: the agent, then "for {subject}" when the item names a subject. The subject stays its raw value (Backend 041 Implementation Decision 2).

---

## Practical Gains & Operational Outcomes

1. **A readable Inbox**:
   - *Before*: `e0000000-0000-4000-8000-000000000001`.
   - *Now*: the name of the agent.

---

## User Stories

- [x] 1. As an administrator, I see the name of the agent in each denied requests and denied token exchanges item of the Inbox.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language

- **Context**: Admin — Overview and Inbox. The backend owns the name.
- **Package Ownership**: `src/features/attention/targets.ts` (`contextLines`).
- **Terms**: *Agent name* is the name of the agent record.

### 2. Aggregate Root & State Transitions

- No state. It is display only.

### 3. Commands, Queries & Domain Ports

- None new: the signal list and detail reads of Backend 041.

---

## Implementation Decisions

1. `contextLines` uses `context.agent_name || context.agent` for both item types.

---

## Backend dependencies

1. **Agent name in the signal context:** [Backend 041](../../backend/specs/041-2026-11-02-agent-names-in-signals.md) Solution 1 (decided 2026-11-02: `context.agent_name`, never stored).

---

## Testing Decisions

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build`. The user runs the interface test in the built-in browser.

---

## Acceptance Criteria

- [x] 1. Denied requests and denied token exchanges items show the agent name, and the ID for an agent that no longer exists.
- [x] 2. `npm run check` and `npm run build` pass.
- [x] 3. Functional test: [033-2026-11-02-agent-names-in-inbox](functional-tests/033-2026-11-02-agent-names-in-inbox.md).

---

## Out of Scope

- Subject names in denied token exchanges items (follow-up).
