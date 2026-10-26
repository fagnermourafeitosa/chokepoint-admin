# Specification: Authorization Management Workbench

- **Specification ID**: 009
- **Date**: 2026-10-26
- **Slug**: authorization-management-workbench
- **Status**: Implemented
- **Approval**: The user approved the reviewed result, merge and push on 2026-10-26. This supersedes earlier approval holds and publication restrictions recorded below.
- **Owner**: Admin
- **Related Specifications**: [Backend COAZ integration](../../backend/specs/008-2026-10-26-coaz-mcp-cel-and-authzen-integration.md), [Trusted API sources](../../backend/specs/009-2026-10-26-trusted-api-attribute-sources.md), [Permission and policy management](../../backend/specs/010-2026-10-26-permission-assignments-and-policy-management.md)
- **Related Mock Contract**: [Workbench screen draft](../docs/chokepoint-workbench/README.md), [Admin design system](../docs/design-system/README.md)

> Mapping and source previews were accepted; the user waived policy previews and requested immediate CRUD implementation. Backend 010 defines the permission contract. The user approved the reviewed result, merge and push on 2026-10-26.

## Context & Background

The production Admin has Agent metadata CRUD, MCP server discovery/review and customer OIDC management. Tool/people assignment and policy editing remain local drafts or placeholders. The reference workbench illustrates a larger permission workflow with fixtures and local browser state.

## Problem Statement

Copying prototype behavior would invent persistent APIs, user discovery, team semantics, rule composition and runtime evaluation. The source-binding draft imports OpenAPI and tests sample extraction; neither action proves trust or live data acquisition.

## Solution

Coordinate the missing management surfaces with their owning backend specifications. Organize this umbrella specification into independently approved slices; it does not require sources or policies before the current COAZ integration can ship. Adapt navigation and editing flows after the contracts are decided.

## Practical Gains & Operational Outcomes

Operators can understand mapping origin, trusted attribute sources and the permissions they manage. Saved drafts, active configuration and sample results have distinct meaning. Backend authority replaces local simulated persistence only within each approved slice.

## User Stories

- [ ] 1. As an administrator, I can inspect upstream/default/local mapping origin and manage approved local mappings.
- [ ] 2. As an administrator, I can manage API sources and typed request/response bindings.
- [ ] 3. As an administrator, I can manage user associations and qualified tool grants for existing Agent groups.
- [ ] 4. As a policy author, I can edit restrictions and inspect validation errors and affected dependencies.
- [ ] 5. As a reviewer, I can distinguish saved changes from active permissions and understand publication impact.

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language

Admin owns interaction, form/query state and API consumption. Backend owns mapping compilation, source resolution, secrets, policy validation and decisions. Agents remain permission groups. Reuse the module design system and current authenticated transport.

### 2. Aggregate Root & State Transitions

The UI reflects the backend-approved lifecycle; it does not invent publication statuses. Workspace/environment changes cancel scoped requests and reset drafts. Browser storage and demonstration fixtures cannot become authoritative policies.

### 3. Commands, Queries & Domain Ports

API resource names, DTOs, validation limits and revision semantics are dependencies on the backend specs. Keep hooks separate from JSX, retain private query scope and existing CSRF/session behavior. No direct browser call to an attribute API or upstream MCP server is introduced.

## Implementation Decisions

### Confirmed direction

The workbench is a draft of screens. Preserve its intent where useful; adapt structure and interactions when contracts or usability require it. Do not modify the reference mock to conceal differences. Follow Impeccable and the Admin design system before designing or implementing layouts.

For trusted API sources, [Cerbos Synapse / External API](https://www.cerbos.dev/ecosystem/cerbos-external-api) is the user-selected gold reference. Management screens must reflect the separation between external attribute enrichment and PDP evaluation defined in Backend 009. Prototype interactions must adapt to that separation.

### Management slices and missing CRUDs

| Slice | Intended operations | Contract owner |
| :--- | :--- | :--- |
| COAZ mapping management | Inspect origin; create/edit/validate/review local mapping; define retirement | Backend 008 |
| Trusted context sources | Create/read/update/retire source and attribute binding; bounded configuration checks | Backend 009 |
| People associations | List/add/remove represented-user associations to an existing grouping | Backend 010 |
| Tool grants | List/grant/revoke qualified capabilities | Backend 010 |
| Policies | Create/read/update/retire restrictions; validation and publication workflow | Backend 010 |

CRUD operation intent is recorded; exact deletion versus retirement and publication behavior remain pending. This table is not an approved endpoint inventory.

### Prototype adaptations to decide

- Use actual tenant/environment/server/tool identity instead of bare tool names and seeded people/team records.
- Separate CEL mapping from policy conditions; two editors must not imply interchangeable expressions.
- Replace the prototype's mandatory Agent selection in evaluation with the accepted represented-user model and effective membership resolution.
- Review whether Visual/CEL modes belong in the initial release; lossless conversion cannot be assumed.
- Decide manual source configuration versus OpenAPI import. Imported schemas and sample extraction are not connection verification.
- Explain source schema, binding and policy dependency changes before allowing removal/publication.
- Review the prototype's nine policy scopes, simulated AND composition, team concept and draft/active Agent states; none is implicitly approved.
- Keep Evaluation Lab, audit/history, samples and production decision traces out of the initial CRUD scope unless explicitly selected. Do not restore previously removed controls from the prototype by default.
- Determine screen placement for mappings, source bindings and policy rules after the responsibilities are settled.

## Testing Decisions

### Unit & Profile Tests

Do not introduce automated Admin tests. Follow the module's applicable build, type checking and linting policy.

### Integration & Contract Tests

Manual backend-connected checks will follow each approved contract. No automated integration suite or live external API checks are authorized by this draft.

### Error Safety & UI Tests

Before delivery, manually check loading/empty/error states, keyboard/focus behavior, revision conflicts, expired sessions and scope changes. Clearly distinguish sample, saved, approved and effective results. Never return or cache source credentials in browser-visible data.

### Regression Tests

Preserve Agent CRUD, MCP review and OIDC connection management. Existing mock data stays in the mock.

## Acceptance Criteria

- [ ] 1. Each implemented slice has an approved backend contract and user-approved scope.
- [ ] 2. Adaptations from the screen draft are documented and serve the accepted objective.
- [ ] 3. The UI does not claim grants, evaluation or source trust from local fixtures.
- [ ] 4. Sensitive data and scoped query state follow current Admin protections.
- [ ] 5. Applicable build/static/manual checks have recorded evidence.

## Out of Scope

Backend-only engine implementation; public frontend; prototype replication as a requirement; new user login; new Agent credentials; automated Admin tests; unapproved Evaluation Lab/audit features.

## Further Notes

The backend review's numeric integration issue is corrected under Backend 010
using the existing CEL-Go JSON adapter. The user authorized the correction after
checking the official specification. JSON numbers consistently enter policy CEL
as doubles; integer-only operations require explicit conversion. No UI code
change was needed for this finding. Verification is recorded in Backend 010.
Backend unit/vet/build and focused race checks passed after the correction;
its focused review found no additional actionable defect. The coordinated slice
returns to Waiting Approve without Git publication.

### Permission CRUD implementation and checks - 2026-10-26

The user explicitly waived policy previews and requested immediate CRUDs. The
existing Agent rail now opens real people, server/tool and fine-grained CEL policy
editors under `src/features/permissions`. The backend owns validation/publication;
the UI offers inactive draft save, explicit current/proposed review, publication,
discard and published-access revocation. It lists real issuer/server/source API
results, paginates catalogs, aborts scoped requests and retains edits after errors.
PIP binding retirement shows actual published PAP policy dependencies.

Type checking and production build passed. Authenticated seed/MFA browser checks
created, edited, saved and published a disposable grouping configuration. The
review showed the issuer/subject, explicit server/tool and CEL condition. Backend
checks verified revision conflict, nonboolean rejection, draft/active separation,
revocation/discard and required binding dependency reporting. Desktop screenshots
were inspected with no horizontal overflow; no mobile checks were performed.
No console warnings/errors were present in the checked permission flow. All
disposable source/group/issuer records were deleted; existing records were kept.
No automated Admin tests were added or run. Result approval remains pending.

Each delivery follows its backend contract. The user later explicitly authorized the missing permission CRUDs and waived the previous preview gate; this supersedes the initial draft-only restriction for that slice.


## Mapping Screen Preview Acceptance - 2026-10-26

The user accepted the displayed mapping catalog, field editor with sample AuthZEN projection and change-review screens ("ta otimo"). The previews are standalone design artifacts under the workspace-level docs/previews/coaz-mapping directory; they do not call APIs, save changes or evaluate policies. The accepted direction keeps mapping management under MCP server/tool context, makes mapping origin visible and separates projection from policy evaluation. This acceptance does not approve source/policy screens that have not yet been shown, or resolve all mapping API and retirement semantics.

Backend 008's runtime formal review found a list-result conversion defect. Its correction requires the backend review-gate response before CRUD implementation proceeds. Admin application source remains unchanged.


## Implemented Mapping Slice - 2026-10-26

The production MCP server tool details now show mapping origin and open a full-page field/JSON editor within the existing integration shell. The backend is the only CEL compiler/projector. Save creates a draft; separate review approves it. Active removal shows the exact fallback and requires confirmation. Draft discard preserves the active mapping; active removal preserves an independent draft. Samples cannot produce an authorization decision.

Backend 008 owns endpoint, revision, shape and lifecycle details. Scoped query/mutation hooks are separate from components; requests abort on unmount/scope changes. Authentication, CSRF and private query conventions are reused. No browser persistence or direct customer-API calls were added.

Node 22.23.1 type checking and production build passed. Manual browser checks against the local backend covered sample list projection, save/review, approval, draft discard and active removal. Test-created mapping state was removed, retaining monotonic revisions. The final console was clear. No automated Admin tests were created or run. The follow-up formal review is recorded with Backend 008.

## Trusted API Source Screen Proposal - Pending Acceptance

The next slice has standalone previews for source catalog, API connection and attribute binding under the workspace-level docs/previews/trusted-api-sources directory. They follow Cerbos Synapse's enrichment-before-PDP separation. User/resource ownership, authentication choices, timeout/cache values and OpenAPI import shown there are design proposals, not implemented contracts. No source CRUD or resolver has been implemented. The user must review these screens before that slice proceeds; policy screens will likewise be shown before their CRUD implementation.


## Mapping Management Review Coordination - 2026-10-26

The formal reviewer stage found a backend static-validation gap recorded in Backend 008: numeric subject.type and scalar batch-entry context can be stored/approved, although runtime blocks them. No correction was applied during review. The UI/manual checks remain valid for the tested well-formed mapping. Source screens remain previews pending review; their CRUD has not started.


## Static Validation Follow-up and Source Screen Acceptance - 2026-10-26

The user authorized Backend 008's static SARC correction, which passed regression/full unit/vet/build/race checks and follow-up review without further actionable findings. No Admin implementation changed for that correction. The user then explicitly accepted the trusted API source screens and directed implementation. This authorizes the source slice, not unshown policy-management screens. Policy CRUDs remain planned under Backend 010 and will be previewed before implementation, as requested.


## Source Delivery Decisions - 2026-10-26

The user selected manual GET configuration and OpenAPI import in the first source delivery, and delegated runtime design to industry practice with Cerbos as the reference. Follow the consolidated Backend 009 contract: separate enrichment, subject/resource attributes through standard AuthZEN properties, backend-owned authority namespace, required-source failure, scoped TTL, separate draft/review/activation, and backend-only credentials. Import describes operations; it does not approve an endpoint or validate a live source. Policy screens are still required before Backend 010/Admin policy CRUD implementation.
