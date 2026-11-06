# Specification: Client Allowlist Route

- **Specification ID**: 046
- **Date**: 2026-11-06
- **Slug**: client-allowlist-route
- **Status**: Implemented
- **Owner**: Admin — Access, agent Identity view
- **Related Specification**: [036 — Interactive Harness Access](036-2026-11-03-interactive-harness-access.md) (Harness login card)
- **Related Backend Specification**: Backend 062 — Client Allowlist Naming (`backend/specs/062-2026-11-06-client-allowlist-naming.md`)

---

## Context & Background

The Harness login card of the agent Identity view (Admin 036) lists the harnesses allowed for the agent, adds them from the catalog buttons or a typed client metadata URL, and removes them. It reads and writes the client allowlist through `harnessApi.allowlist` and `harnessApi.saveAllowlist` (`src/features/access/harness-api.ts`), at `…/agents/:agent_id/client/metadata-documents`.

Backend 062 renames that route to `…/agents/:agent_id/client/allowlist` and removes the old path, with no alias.

---

## Problem Statement

### 1. The Admin calls a route that Backend 062 removes

After Backend 062, `…/client/metadata-documents` returns `404`. The Harness login card then shows "Could not load the harnesses." and cannot save.

---

## Solution

1. `harnessApi.allowlist` and `harnessApi.saveAllowlist` call `…/client/allowlist`.
2. Request and response types, the query key, the card layout, its copy and its errors do not change.

---

## Practical Gains & Operational Outcomes

1. **Contract alignment**:
   - *Before*: the Admin calls the allowlist under a name that says "metadata documents".
   - *Now*: the Admin calls it under the domain term *client allowlist*, as the backend does.

---

## User Stories

- [x] 1. As an administrator, I still list, add and remove the harnesses of an agent in the Harness login card, with no change in behavior. — on the demo database copy (`chokepoint_demo062`), Admin 046 against Backend 062: the card listed Claude Code, added Visual Studio Code from the catalog button and removed it; each request went to `…/client/allowlist` (GET and PUT 200)

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language
- **Context**: Access, agent Identity view.
- **Package Ownership**: `src/features/access/harness-api.ts`.
- **Ubiquitous Terms**:
  - `Client allowlist`: the CIMD URLs bound to an agent (Backend 045). The card shows it as "Allowed harnesses".

### 2. Aggregate Root & State Transitions
- **Entities & State Machine**: no change.
- **Invariants**: no change.

### 3. Commands, Queries & Domain Ports
No new port. `harnessApi` keeps its function names and types.

---

## Implementation Decisions

1. Only the two paths in `harness-api.ts` change.
2. No fallback to the old path (pre-launch, no compatibility layer).
3. Admin 046 ships together with Backend 062: each one alone breaks the card.

---

## Testing Decisions

### Static Checks
- The Admin has no unit test runner. The type check (`npm run check`) and the production build (`npm run build`) pass.

### Functional Tests
- On the demo instance with Backend 062, the Harness login card of an agent lists its harnesses, adds a harness from the catalog button, and removes it. Each request goes to `…/client/allowlist`.

---

## Acceptance Criteria

- [x] 1. No Admin source uses `metadata-documents`.
- [x] 2. The Harness login card lists, adds and removes harnesses against Backend 062 on the demo instance. — on the demo database copy (`chokepoint_demo062`), Admin 046 against Backend 062: the card listed Claude Code, added Visual Studio Code from the catalog button and removed it; each request went to `…/client/allowlist` (GET and PUT 200)
- [x] 3. The type check and the production build pass.

---

## Out of Scope

- The harness catalog buttons and their source (`platform_config`, open decision).
- The catalog content (Visual Studio Code and Codex).
- Any layout or copy change of the Harness login card.

---

## Further Notes

Public documentation does not name the route, so no public documentation change is needed.
