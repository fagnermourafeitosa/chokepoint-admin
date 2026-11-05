# Specification: Integrations with One Mapping Read for Each Server

- **Specification ID**: 034
- **Date**: 2026-11-02
- **Slug**: integrations-one-read-per-server
- **Status**: Implemented
- **Owner**: Admin — Integrations (`src/features/mcp`)
- **Related Specification**: [Backend 042 — Tool Mappings in the Resource Types Read](../../backend/specs/042-2026-11-02-tool-mappings-in-resource-types.md) (`tools`: source, effective, draft)
- **Related Specification**: [027 — Tool Resource Mapping Review](027-2026-10-31-tool-resource-mapping-review.md) (the Resource block of each tool row)

---

## Context & Background

In the server details of Integrations, each managed tool row has a Resource block (Admin 027). Its collapsed line shows the active resource, a state chip (Active, Draft, Removal draft, Declared by the server) and, for an advanced form, a note to use Configure mapping. Each block reads the mapping of its tool with its own request when the details open.

---

## Problem Statement

### 1. One request for each tool

A server with many tools opens its details with as many mapping requests (Admin 027 review finding 4).

---

## Solution

1. **One read for the rows.** The server details read `GET …/mcp-servers/:id/resource-types` once. Each Resource block draws its collapsed line from the `tools` entry of its tool (`source`, `effective`, `draft`) with the same rule as today (`readResource`). The line, the chips and the advanced-form note do not change.
2. **The tool mapping read on demand.** A block reads `GET …/tool-mapping?tool_name=…` only when the administrator opens **Configure resource**: an edit needs the server revision that only this read returns.
3. **After a change.** A save, an approve or a discard also refreshes the server read, so every line shows the new state.
4. **States of the server read.** While it loads, each block shows "Loading resource…". If it fails, one message above the tool rows offers **Retry**; the blocks show no line.
5. **A tool without an entry** (no input schema) shows no Resource block: it can have no resource.

---

## Practical Gains & Operational Outcomes

1. **Faster server details**:
   - *Before*: one mapping request for each managed tool.
   - *Now*: one request for the server, and one more only for the tool that the administrator edits.

---

## User Stories

- [x] 1. As an administrator, I open the details of a server with many tools and the Resource lines appear from one request.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language

- **Context**: Admin — Integrations. The backend owns the mappings.
- **Package Ownership**: `src/features/mcp` (`resource-api.ts`, `useResourceMapping.ts`, `ResourceMapping.tsx`, `MCPRegistry.tsx`).
- **Terms**: *Effective mapping*, *draft* and *source* as in Backend 008.

### 2. Aggregate Root & State Transitions

- No new state. The block states of Admin 027 do not change.

### 3. Commands, Queries & Domain Ports

- The resource types read of Backend 042, cached for each server; the tool mapping read and its writes as today.

---

## Implementation Decisions

1. The server read has its own cache key for each server; the writes of a block invalidate it with the mapping keys that they invalidate today.
2. The Admin 026 catalog keeps its own use of the read (`items`).

---

## Backend dependencies

1. **Tool mappings in the resource types read:** [Backend 042](../../backend/specs/042-2026-11-02-tool-mappings-in-resource-types.md) Solution 1 (decided 2026-11-02: documents, not computed states).

---

## Testing Decisions

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build`. The user runs the interface test in the built-in browser.

---

## Acceptance Criteria

- [x] 1. Opening the details of a server sends one resource types request and no tool mapping request.
- [x] 2. The collapsed Resource line of each tool shows the same resource, chip and note as before.
- [x] 3. Configure resource reads the tool mapping of that tool only, and save, approve and discard update the line.
- [x] 4. `npm run check` and `npm run build` pass.
- [x] 5. Functional test: [034-2026-11-02-integrations-one-read-per-server](functional-tests/034-2026-11-02-integrations-one-read-per-server.md).

---

## Out of Scope

- Changing the Resource editor or the Configure mapping screen.
