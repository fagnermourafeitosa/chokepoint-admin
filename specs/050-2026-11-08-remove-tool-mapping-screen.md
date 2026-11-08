# Specification: Remove the Tool Mapping Screen, the Resource Block and the Resource ID Identifier

- **Specification ID**: 050
- **Date**: 2026-11-08
- **Slug**: remove-tool-mapping-screen
- **Status**: Not Implemented
- **Owner**: Admin — Integrations, Context sources
- **Related Specification**: [048 — Relation Side Panel and Rules Only](048-2026-11-06-relation-side-panel.md)
- **Related Specification**: [027 — Tool Resource Mapping Review](027-2026-10-31-tool-resource-mapping-review.md)
- **Related Backend Specification**: none; the backend does not change.

---

## Context & Background

Integrations shows **COAZ default · Configure mapping** on each tool of a custom MCP server. The button opens the screen **Authorization mapping · Map the call to AuthZEN** (`src/features/mcp/ToolMappingManager.tsx`), with Subject identity (locked to `$token.sub`), **Action name · literal or CEL**, **Resource type**, **Resource ID · literal or CEL**, a JSON / CEL mode, and an **AuthZEN request** block that projects sample arguments and claims through the backend without a decision.

Admin 048 took allowed values out of the Admin, and on 2026-11-08 the user decided not to bring them back behind a feature flag. Without allowed values the screen changes no decision (checked in the code on 2026-11-08):

- The subject is locked.
- No step of the decision reads the action: the PDP checks the delegation, the tool grant by tool name, allowed values and rules (`backend/docs/authorization-domain-model.md`); the rule builder writes rules on `context.chokepoint.arguments` only.
- The resource only feeds allowed values and the trusted attributes identifier **Resource ID · from the call (resource.id)** (`backend/internal/pip/parameters.go`). Without a mapping, the COAZ default projects the resource as `{type: "tool", id: "$params.name"}` (`src/features/mcp/resource-api.ts`), so `resource.id` is the tool name.

**Resource ID** is also the default identifier of a new trusted attributes binding about the **Object of the call** (`src/features/sources/BindingEditor.tsx`), so that binding calls the customer API with the tool name instead of the value of the call.

Each tool also has a **Resource** block (Admin 027, `src/features/mcp/ResourceMapping.tsx`): the line **Resource** `/order_id → order_id`, **Configure resource**, and an editor that since Admin 048 offers only "No resource". It edits the allowed values parameter, which has no use without allowed values.

The user decided on 2026-11-08: remove the screen and the Resource block, and make **Tool argument** the identifier of the object of the call, without the Resource ID option. "Resource" is not a concept of the domain model (`backend/docs/authorization-domain-model.md`).

---

## Problem Statement

### 1. Screens that change no decision

Configure mapping edits fields that no step of the decision reads, and the Resource block edits a parameter that only allowed values use. Both speak of a concept that the domain model does not have.

### 2. A default that reads the wrong value

A new binding about the object of the call reads `resource.id`, which is the tool name.

---

## Solution

### Integrations

1. **No mapping screen**: the tool rows of a custom MCP server have no **Configure mapping** button and no mapping source badge (**COAZ default**, local or server). The route state that opens `ToolMappingManager` goes away with the screen.
2. **Removed code**: `ToolMappingManager.tsx`, `MappingReview.tsx`, `useMappingEditor.ts`, `MappingContextFields.tsx`, and the parts of `mapping-fields.ts` and `mapping-api.ts` that only they use. Code still used by another screen stays.
3. **No Resource block**: the tool rows have no **Resource** line, no **Configure resource** and no Resource editor. `ResourceMapping.tsx`, `ResourceEditor.tsx`, `ResourceImpact.tsx`, `useResourceMapping.ts`, the server resource-types read of `MCPRegistry.tsx` (with "Loading resource…" and "Could not load the resources of this server") and the parts of `resource-api.ts` that only they use are removed. `toolArguments`, which Access uses, stays.
4. **Access**: the tool panel loses the warning of Admin 048 Resolved Decision 1 ("This tool checks allowed values… Set the tool to no resource in Integrations"), which points to the removed block. The Access catalog keeps reading the resource types of each server, because the document keeps the allowed values that it has when it is saved (048 Implementation Decision 6).
5. **Backend unchanged**: the backend keeps the COAZ mapping, its default, the resource-types routes and the preview route. A tool keeps the mapping it has.

### Context sources: identifiers of trusted attributes

6. **Value from**: the options are **Verified subject ID · from the token (sub)**, **Verified issuer · from the token (iss)** and **Tool argument · from the call arguments**. **Resource ID · from the call (resource.id)** is not offered.
7. **Default**: when an OpenAPI operation is chosen, each URI parameter of a binding about the **Subject** starts as Verified subject ID, as today. Each URI parameter of a binding about the **Object of the call** starts as **Tool argument**, with the argument pointer `/<URI parameter name>`; the administrator changes the pointer when the tool names the argument differently.
8. **Existing bindings**: there is no production and no customer data. A binding saved with Resource ID shows Tool argument with an empty pointer when it is edited, and saving needs a pointer.

---

## Practical Gains & Operational Outcomes

1. **No dead screens**:
   - *Before*: Every tool offers Configure mapping and a Resource block, in words of a concept the model does not have.
   - *Now*: The tool rows show only what the authorization uses.

2. **Trusted attributes read the call**:
   - *Before*: A new binding about the object of the call looks the customer API up with the tool name.
   - *Now*: It looks it up with the value of a tool argument.

---

## User Stories

- [ ] 1. As an administrator, I want no mapping screen in Integrations, so that I do not edit fields that change no decision.
- [ ] 2. As an administrator, I want trusted attributes about the object of the call to read a tool argument by default, so that the customer API receives the value of the call.

---

## Implementation Decisions

1. The removal follows the code: delete the screen and the modules only it uses; `npm run check` finds what still imports them.
2. `README.md` and `docs/` drop the mapping screen and the Resource ID option.

---

## Testing Decisions

Admin rule: no test files; verification is `npm run check`, `npm run build` and the functional test in the browser.

- Integrations: a custom MCP server shows its tools with no Configure mapping button, no mapping badge and no Resource block.
- Access: the tool panel of a tool has no allowed values warning.
- Context sources: a new binding about the object of the call starts with Tool argument and the pointer of each URI parameter; Value from has no Resource ID.

---

## Acceptance Criteria

- [ ] 1. No tool row offers Configure mapping or a Resource block, and no screen says "Map the call to AuthZEN" or "Configure resource".
- [ ] 2. Value from has no Resource ID option.
- [ ] 3. A new binding about the object of the call starts with Tool argument and `/<URI parameter name>`.
- [ ] 4. Functional test: `specs/functional-tests/050-2026-11-08-remove-tool-mapping-screen.md`.
- [ ] 5. `npm run check` and `npm run build` pass.

---

## Out of Scope

- Any backend change: the COAZ mapping, the resource-types routes, the `resource_id` identifier and the preview route stay in the backend.
- The allowed values that an existing document has, which the Admin keeps when it saves.
- Allowed values in the Admin (the user decided on 2026-11-08 not to bring them back behind a feature flag).
