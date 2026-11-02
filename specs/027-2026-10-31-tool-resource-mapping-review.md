# Specification: Tool Resource Mapping Review

- **Specification ID**: 027
- **Date**: 2026-10-31
- **Slug**: tool-resource-mapping-review
- **Status**: In Progress
- **Owner**: Admin — Integrations
- **Design**: [Agent delegation authorization](../../backend/docs/agent-delegation-authorization.md)
- **Related Specification**: [Backend 029 — ReBAC Model and OpenFGA Integration](../../backend/specs/029-2026-10-31-rebac-model-and-openfga-integration.md) (the resource comes from the COAZ projection, Resolved Decision 4), [Backend 008 — COAZ-MCP, CEL and AuthZEN Integration](../../backend/specs/008-2026-10-26-coaz-mcp-cel-and-authzen-integration.md) (mapping API and lifecycle)
- **Related Specification**: [Backend 032 — PEP Chokepoint Token and Actor Projection](../../backend/specs/032-2026-10-31-pep-chokepoint-token-and-actor-projection.md) (resource projection)
- **Related Specification**: [026 — Agent Delegation Editor](026-2026-10-31-agent-delegation-editor.md) (consumes the resource types)
- **Related Specification**: [007 — MCP Server Management and Discovery Preview](007-2026-10-25-mcp-server-management-and-discovery-preview.md), [009 — Authorization Management Workbench](009-2026-10-26-authorization-management-workbench.md) (COAZ mapping review)
- **Visual reference**: layout prototype at `/prototype/tools` in the Admin (`src/features/mcp/ResourceMapping.tsx`). Known difference: the prototype keeps its own draft state; this text uses the COAZ mapping lifecycle. Fixed data. It is the visual specification of this screen; where it differs from this text, this text wins.

> Agent identity and the Chokepoint token auth type for custom MCP servers are in [Admin 029](029-2026-10-31-agent-identity-and-chokepoint-token-setup.md).

---

## Context & Background

Integrations shows the tools of each MCP server. Each managed tool has its status, the origin of its COAZ mapping with **Configure mapping**, its description, annotations and contract.

Backend 029 (Resolved Decision 4, 2026-11-01) takes the **resource** of a call from the COAZ projection of the tool: `resource.type` and `resource.id` of the effective mapping, as in the COAZ-MCP example `{ "type": "account", "id": "$params.arguments.account_id" }`. The COAZ-MCP default (`resource.type = "tool"`) means no resource check. A call with a missing, empty or non-string `resource.id` fails closed. The tool identity never comes from the mapping.

Admin 026 shows the resources of each agent as **server › resource type › values**. Those resource types come from this review.

---

## Problem Statement

### 1. No place to declare the resource

The tool review has no field for the argument that identifies the resource of a call. Without it, an agent cannot be limited to concrete objects, for example one GitHub repository.

### 2. A free identifier is hard to choose

The resource type is only a label. An administrator does not know what to write, and a typo silently creates a separate list of values.

### 3. Changes have effects on agents

A changed or removed mapping changes which allowed values apply to calls of the tool. The administrator must see that before approval.

---

## Solution

Each managed tool in the server detail gets a **Resource** block, below the description. It follows the same draft and review lifecycle as the COAZ mapping.

```mermaid
flowchart LR
    Arg["Tool argument<br/>repository"] --> Type["Resource type<br/>merge_pull_request_repository<br/>(proposed, editable)"]
    Type --> Agent["Agent allowed values<br/>acme/payments-api"]
    Call["Call: repository = acme/payments-api"] --> Check{"Agent can act on<br/>GitHub › merge_pull_request_repository › acme/payments-api?"}
```

---

## Practical Gains & Operational Outcomes

1. **Resource-level control**:
   - *Before*: a tool is allowed on every object or on none.
   - *Now*: the administrator names the argument once; each agent then allows concrete values.
2. **No naming effort**:
   - *Before*: not applicable.
   - *Now*: the Admin proposes `<tool>_<argument>`; the administrator only confirms or edits it.
3. **Safe changes**:
   - *Before*: not applicable.
   - *Now*: a draft has no effect, and the screen names the affected agents before approval.

---

## User Stories

- [ ] 1. As an administrator, I select the argument that identifies the resource of a tool.
- [ ] 2. As an administrator, I accept or edit the proposed resource type.
- [ ] 3. As an administrator, I see an example of how a call becomes a checked resource.
- [ ] 4. As an administrator, I save a draft, then approve it, or discard it.
- [ ] 5. As an administrator, I see which agents a change affects before I approve it.
- [ ] 6. As an administrator, I remove a mapping, so the tool has no resource check.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language

- **Context**: Admin — Integrations. The Admin owns the form, the proposal and the view state. `mcpregistry` owns the COAZ mapping, its review and its validation (Backend 008, 029).
- **Package Ownership**: `src/features/mcp`, next to the COAZ mapping review. A separate component for the Resource block; the API client and the data hook in the same feature.
- **Terms**:
  - *Resource mapping*: the `resource` fields (`type`, `id`) of the COAZ mapping of one tool.
  - *Resource type*: a label that identifies one type of resource on a server. Backend field `kind`. The screen never shows the word "kind".

### 2. Aggregate Root & State Transitions

- States on the screen: **none**, **Active**, **Draft** (a new or changed mapping waits for review), **Removal draft**.
- Transitions: Save draft → Draft or Removal draft; Review & approve → Active (or none for a removal); Discard draft → the previous state.
- Invariants: a draft never changes runtime behavior; a mapping exists only for a reviewed tool; one mapping for each tool at most.

### 3. Commands, Queries & Domain Ports

Read the tool schema (current catalog API). Read, save, approve and discard the resource mapping of a tool, and read the agents that have values of a resource type. Exact contracts: see [Backend dependencies](#backend-dependencies).

---

## Implementation Decisions

### 1. Placement

1. The Resource block is in the server detail of Integrations, in each managed tool, below the description. It is not in the discovery selection and not in a removed tool.
2. Collapsed line: "Resource", the active mapping (`/repository → merge_pull_request_repository`, or "None"), the state chip (Active, Draft · new mapping, Removal draft) and **Configure resource**.

### 2. Editor

1. **Argument**: a select from the tool input schema. Each option shows the name, the type and "required". Only string arguments can be selected; other types are disabled with "must be a string" (Backend 029 type check). The first option is "No resource. Calls have no resource check." A tool without arguments says that it cannot have a resource.
2. **Resource type**:
   - When the administrator selects an argument, the field is filled with the proposal **`<tool>_<argument>`**, for example `merge_pull_request_repository`, and marked "proposed".
   - The text below says: "Proposed from the tool and the argument. You can edit it."
   - After an edit, the field keeps the administrator's value; a new argument does not replace it.
   - A plain text field. No dropdown arrow and no suggestion list.
   - A help icon says: "A label that identifies one type of resource on this server. Tools with the same resource type share the allowed values in an agent. It has no other effect." (Resolved Decision 1)
3. **Example**: a sample call and its checked resource, for example `{ "repository": "acme/payments-api" }` → `merge_pull_request_repository › acme/payments-api`, and "Missing, empty or not a string: the call is denied."
4. **Optional argument**: a warning says that a call without it is denied.
5. **Impact**: when an active mapping changes or is removed and agents have values of its resource type, a warning names those agents and the effect:
   - a changed resource type: those values do not apply to this tool after the change;
   - a removed mapping: the tool has no resource check for those agents.
6. **Actions**: Save draft; Review & approve and Discard draft when a draft exists.
7. A note says: "A draft has no effect. After approval, new calls use the mapping. A change needs a new review, like source bindings."

### 3. Lifecycle

The Resource block is a shortcut inside the COAZ mapping of the tool. It writes `resource.type` and `resource.id = $params.arguments.<argument>` into the local mapping draft, and it uses the COAZ mapping actions of Admin 009 and Backend 008: save draft, approve, discard draft, remove. A revision conflict requires a reload. **Configure mapping** shows the same draft with every field.

- When the effective mapping is a reviewed server declaration (`x-authzen-mapping`) with a resource, the block shows that resource as "Declared by the server"; **Configure resource** creates a local draft that replaces it.
- "No resource" sets `resource` back to the COAZ-MCP default (`type = "tool"`).
- The backend validates and owns the result. The Admin does not evaluate a mapping.
- The block edits only a mapping with one `evaluation` whose resource is `tool` or `$params.arguments.<argument>`. Another form (`evaluations`, or a literal or CEL `resource.id`) is read-only in the block, which says to edit it in **Configure mapping** (Admin 027 review, 2026-11-02).

### 4. Resolved decisions (2026-11-02)

1. **Tools can share a resource type** (decided by the user). Two tools of a server with the same resource type share the allowed values of each agent (Further Notes). The backend does not require a unique type. Not chosen: a unique resource type for each tool, enforced by the backend.
2. **The resource is validated by the Admin form and by the backend** (decided by the user). The form accepts only a type that matches `^[a-z][a-z0-9_]{1,79}$` and only a top-level string argument. The backend rejects an invalid resource at save draft and approve ([Backend 032](../../backend/specs/032-2026-10-31-pep-chokepoint-token-and-actor-projection.md) Resolved Decision 3). Until Backend 032, only the form checks it. Not chosen: only the form, with the runtime fail-closed.
3. **A nullable argument is not a string argument** (Admin 027 review, decided by the user). An argument whose schema is a union with `null` (`anyOf`, `oneOf` or a type array) is shown with its types, for example `string | null`, and is disabled. Backend 032 Resolved Decision 3 rejects it too.

### 5. Files

Keep the API client, the data hook and the component separate. Each file stays under about 300 lines.

---

## Backend dependencies

The contracts are written in the backend specifications (2026-11-01).

1. **API and lifecycle:** the existing COAZ mapping API and lifecycle ([Backend 008](../../backend/specs/008-2026-10-26-coaz-mcp-cel-and-authzen-integration.md)): `GET /tool-mapping`, `PUT /tool-mapping/draft`, `POST /tool-mapping/approve`, `DELETE /tool-mapping/draft`, `POST /tool-mapping/remove`, with `tool_name` and `revision`. The Resource block edits the `resource` of the local mapping draft.
2. **Resource type rules:** [Backend 029](../../backend/specs/029-2026-10-31-rebac-model-and-openfga-integration.md), "Resource from the COAZ projection" (`^[a-z][a-z0-9_]{1,79}$`; `tool` means no resource check).
3. **Affected agents:** [Backend 033](../../backend/specs/033-2026-10-31-agent-permission-administration-and-tuple-publication.md), Admin contract 3.
4. **Argument form:** the COAZ expression `$params.arguments.<name>` of a top-level string argument.
5. **Resource validation at save and approve:** [Backend 032](../../backend/specs/032-2026-10-31-pep-chokepoint-token-and-actor-projection.md) Resolved Decision 3 (Resolved Decision 2).

**Waiting backend chip.** In the prototype, each element that needs one of these items has a "Waiting backend · <spec>" chip. When the backend implements an item, remove the chip of each element that it unblocks, in the same change. The real Admin never shows the chip.

---

## Testing Decisions

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build`. The user runs the interface test in the built-in browser.

---

## Acceptance Criteria

- [ ] 1. Each managed tool shows the Resource block with its state.
- [ ] 2. The argument select lists the schema arguments; non-string arguments are disabled.
- [ ] 3. Selecting an argument proposes `<tool>_<argument>`, marked as proposed and editable; the field has no dropdown.
- [ ] 4. The help explains that the resource type is only a label on the server, shared by the tools that use it (Resolved Decision 1).
- [ ] 5. The example, the optional-argument warning and the impact warning appear as in section 2.
- [ ] 6. Save draft, Review & approve and Discard draft follow section 3; a draft has no runtime effect.
- [ ] 7. Every item of Backend dependencies is resolved in a backend specification before implementation.
- [ ] 8. No "Waiting backend" chip remains for an implemented item.
- [ ] 9. `npm run check` and `npm run build` pass.
- [ ] 10. The user confirms the interface test.

---

## Out of Scope

- Agent identity (client, public key) and the Chokepoint token auth type for custom MCP servers ([Admin 029](029-2026-10-31-agent-identity-and-chokepoint-token-setup.md)). The agent status is in [Admin 026](026-2026-10-31-agent-delegation-editor.md).
- The allowed values of each agent (Admin 026).
- A readable label next to the resource type, and resource types provided by enterprise providers (follow-up).
- Nested pointers and more than one mapping for each tool.

---

## Further Notes

The proposal makes one resource type for each tool by default, so each tool has its own list of allowed values in an agent. Two tools share a list only when the administrator gives them the same resource type.
