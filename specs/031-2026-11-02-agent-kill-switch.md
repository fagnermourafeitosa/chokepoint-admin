# Specification: Agent Kill Switch

- **Specification ID**: 031
- **Date**: 2026-11-02
- **Slug**: agent-kill-switch
- **Status**: Implemented
- **Owner**: Admin — Access and Permissions
- **Related Specification**: [Backend 032 — PEP Chokepoint Token and Actor Projection](../../backend/specs/032-2026-10-31-pep-chokepoint-token-and-actor-projection.md) (agent status, Resolved Decision 2 and Admin contract)
- **Related Specification**: [026 — Agent Delegation Editor](026-2026-10-31-agent-delegation-editor.md) (moved from section 1, Resolved Decision 1)
- **Visual reference**: layout prototype at `/prototype/agent` in the Admin (agent header). Fixed data.

---

## Context & Background

Admin 026 first held the agent status and the kill switch in the agent header. They depend on the agent status API of Backend 032, which comes later in the implementation order, so the user moved them here on 2026-11-02.

---

## Problem Statement

### 1. No way to stop an agent at once

An administrator who sees an agent misbehave can only remove its permissions and publish. The agent keeps its 5-minute tokens until they expire.

---

## Solution

1. The agent header shows the agent status, **Active** or **Disabled**, as a text chip.
2. A **Disable agent** / **Enable agent** action changes the status (Backend 032 Resolved Decision 2). Disabled: the AS issues no new token and the PEP rejects the next call. The configuration and the client key stay.
3. The action sends the agent `revision`. A revision conflict asks for a reload.

---

## User Stories

- [x] 1. As an administrator, I disable an agent at once, and its next call is rejected.
- [x] 2. As an administrator, I enable a disabled agent again with its configuration and key.

---

## Backend dependencies

1. **Agent status API:** [Backend 032](../../backend/specs/032-2026-10-31-pep-chokepoint-token-and-actor-projection.md), Admin contract: `status`, `status_changed_by`, `status_changed_at` on the agent; `POST …/agents/:agent_id/disable` and `…/enable` with `revision`.

---

## Testing Decisions

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build`. The user runs the interface test in the built-in browser.

---

## Acceptance Criteria

- [x] 1. The header shows Active or Disabled.
- [x] 2. Disable agent and Enable agent call the Backend 032 API with the revision, and a conflict asks for a reload.
- [x] 3. No "Waiting backend" chip remains for an implemented item.
- [x] 4. `npm run check` and `npm run build` pass.
- [x] 5. The user confirms the interface test. Run by Claude in the built-in browser at the user's request (2026-11-02): Disable agent showed Disabled, a token issued before got HTTP 401 and a new exchange got `invalid_client`; a stale revision showed the conflict with Reload, which loaded the current status; Enable agent restored the calls with the same delegations and key.

---

## Out of Scope

- Deleting the agent client or its key (Admin 029).
