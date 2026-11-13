# Chokepoint Admin

React application for managing the Chokepoint platform.

This module owns the platform management interface. The public-facing Chokepoint page lives in the separate `frontend` module, and backend services and APIs live in `backend`.

Development instructions are in [AGENTS.md](AGENTS.md), including the [Vercel React Best Practices skill](.agents/skills/react-best-practices/SKILL.md). The selected stack is **React + Vite**.

## Technology Choice

Use React with Vite for the platform management application. The admin consumes the Go backend APIs and uses client-side rendering.

## Quick start

`dev.sh` installs the dependencies when needed and starts the development server on `127.0.0.1:5173`. Open the Admin at `ADMIN_PUBLIC_ORIGIN` (`https://app.xokepoint.localhost`): the local Envoy serves it there and routes `/api/v1/` on the same origin to the backend (Backend 071, 072). There is no Vite proxy, so the Admin works only through Envoy. Start `../dev-infra/up.sh` and `../backend/dev.sh` first.

```sh
./dev.sh
```

## Local Environment

Use Node.js `22.23.1` and npm `10.9.8`. Each module has its own `package.json`, `package-lock.json`, and local `node_modules`; run package-manager commands from the module directory.

```sh
nvm install
nvm use
npm ci
```

A local `.env.local` is prepared for this checkout and ignored by Git. For a new checkout, copy `.env.example` to `.env.local`. Environment variables will be added when the relevant integrations are defined. Variables prefixed with `VITE_` are exposed to the browser. Never store secrets in public variables.

## Container Image

`infra/Dockerfile` is the production image: the static build only, served by static-web-server on port 8080, with `/health` for the container health check. Unknown paths return `index.html`, so the client routes load directly. It does not route `/api` and sets no security header: Envoy sends `/api/v1/` on the same origin to the backend and sets the Admin's headers and caching (Backend 072). There is no development image: the `local` VM runs this image behind Envoy.

Production build:

```sh
docker build -f infra/Dockerfile -t chokepoint-admin .
```

## Deploy

`infra/deploy.sh` deploys the Admin, first to `local`, then to `production` (or one of them as argument). It needs a clean checkout equal to `origin/main` and the sibling `backend` and `dev-infra` checkouts. The Admin has its own Terraform root and state (Backend 072, decision 5), so the plan holds only the Admin image and container: Envoy, Keycloak, PostgreSQL, OpenFGA, the backend and the site are never planned or changed. Each environment shows its plan and asks before it applies; the new container is healthy before the old one stops; then the script backs up the states, runs the header check and keeps the two newest Admin images on the host. A rollback is a revert commit on `main`, deployed the same way. See `backend/INFRA.md`, Application Deploys.

## Application

The admin layout follows the workbench reference layout. Overview and Investigate retain empty pages. Access has Permissions, Context sources and Integrations child routes; its production initial collections remain empty. Development and production both start with empty collections. Navigation uses React Router and browser history. Workspace and profile controls show the authenticated identity and authorized backend workspace records. The environment selector uses the selected authorized workspace’s returned Sandbox and Production records. Search and audit are absent.

```sh
npm run dev
npm run check
npm run build
npm run preview
```

The development server binds to `127.0.0.1:5173`; the browser reaches it only through the local Envoy. Production hosting serves `index.html` for application routes such as `/access` and `/investigate`.

## Design System

The application imports [the admin design system](docs/design-system/README.md), including its local fonts and semantic tokens. The visual reference of a new screen is a layout prototype with fixed data in `specs/prototypes/<specification>/`, written on `main` with its specification and served under the `/prototype/<page>` route of the development server only ([visual specification](docs/design-system/visual-specification.md), [prototype index](specs/prototypes/README.md)).

## Source Organization

- `src/app`: application routing and navigation configuration.
- `src/layouts`: shared page composition and selected environment state.
- `src/components/header`: header, navigation, workspace/environment selectors and profile menu.
- `src/components/ui/dropdown`: reusable disclosure behavior and styling, independent of page composition.
- `src/pages`: top-level page composition.
- `src/features/access`: Access navigation, page components, agent rail and feature styles.
- `src/api`: backend HTTP transport and endpoint calls.

## Login and Backend Session

The admin has /login and /signup entry pages and a protected /onboarding/workspace page. Start local Keycloak/Mailpit from [dev-infra](../dev-infra/idps/keycloak/README.md), apply backend migrations and explicit seeds, start the Go API (`../backend/dev.sh`) and run `./dev.sh` here. Open https://app.xokepoint.localhost/login. The public frontend links to these admin destinations; it does not handle credentials.

The browser submits same-origin navigation forms to backend login/signup endpoints. The backend owns the OIDC exchange and HttpOnly cookie session. Keycloak's Chokepoint theme follows this module's fonts, tokens and logo; it processes credentials, verified email and MFA. The admin never sees passwords, provider tokens or session-cookie values. No static Bearer token remains in the client. Authenticated mutations use the in-memory session-bound CSRF token.

Protected routes wait for session and authorized context. The real workspace list comes from active memberships; environments come from the authorized workspace. Multiple workspaces require selection. An enrolled new account can create its first workspace; a seeded no-access account cannot invent membership. Completed onboarding creates Sandbox and Production through the backend's atomic operation. Customer IdP onboarding and agent APIs remain separate scopes.

Private query keys include user, workspace and environment. Switching context cancels/removes scoped data, and the pending-changes guard asks before it discards unsaved edits; logout/expiry clears private state. API 401 returns to login, while service failures show retry. Local logout revokes the backend session; a failed logout hides private UI and does not claim revocation succeeded. There is no login persistence in browser storage.

Production requires a reviewed same-origin admin/API host with TLS, secure cookie deployment and restrictive SPA security headers. Vite's local proxy is not a production deployment. In `dev`, the local Envoy (backend `infra/terraform`, started by `dev-infra/up.sh`) serves the Admin at `ADMIN_PUBLIC_ORIGIN`; the Admin container and its production headers are Backend 072.

## Access Workbench

Open `/access` for Permissions, `/access/context-sources` for Context sources or `/access/integrations` for Integrations. Shared navigation supports direct entry, active links and browser history. Permissions uses the existing Agent rail and backend-connected people, server/tool and fine-grained policy editors. New Agent edits metadata; the selected grouping's permission editor saves an inactive draft and offers separate review/publication, discard and published-access revocation. The workbench mock remains unchanged; no demonstration records seed the application.

This module has no automated interface tests; see the Testing Policy in `AGENTS.md`. Validate changes with `npm run check`, `npm run build` and the functional test of the specification, in `specs/functional-tests/<specification file name>.md` (see `AGENTS.md`, Functional Test Files).

## State and Data Organization

Custom hooks are separate from JSX: Access data/cache, agent workbench selection/search, form handling, shared dropdown/dialog lifecycle and admin layout state each have a dedicated hook file. AppProviders owns the QueryClientProvider with a separate client factory and initialization hook. TanStack Query holds session, authorized-context and backend Access responses. Private Access keys include user, workspace and environment. No sample records are seeded.

## MCP Tool Annotations

Tool metadata uses optional `ToolAnnotations` fields (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint` and optional `title`). Supplied boolean hints are displayed independently, explicit false values are retained, and missing fields are not filled with UI classifications. Tools without annotations render normally without badges. Destructive/idempotent hints are omitted for explicitly read-only tools. Annotation badges expose shared design-system tooltips on hover and keyboard focus, including explanations and their MCP field/value. Tooltips remain reachable by pointer, dismiss with Escape/blur, and use a portal to avoid clipping. These server-provided hints do not control permissions. See the [official MCP schema](https://modelcontextprotocol.io/specification/2026-07-28/schema#toolannotations).

Agent initial-letter blocks and the repeated environment label in details are removed; the current MCP Server icon is retained.

## Specifications

| ID | Specification | Status |
| :--- | :--- | :--- |
| 001 | [Admin Shell](specs/001-2026-10-24-admin-shell.md) | Implemented |
| 002 | [Development HTTP Client](specs/002-2026-10-24-http-client.md) | Implemented |
| 003 | [Access Workbench Layout](specs/003-2026-10-24-access-workbench-layout.md) | Implemented |
| 004 | [Login and Authorized Workspace Selection](specs/004-2026-10-24-login-and-authorized-workspace-selection.md) | Implemented |
| 005 | [First Workspace Onboarding](specs/005-2026-10-24-first-workspace-onboarding.md) | Implemented |
| 006 | [Agent CRUD Integration](specs/006-2026-10-25-agent-crud-integration.md) | Implemented |
| 007 | [MCP Server Management and Discovery Preview](specs/007-2026-10-25-mcp-server-management-and-discovery-preview.md) | Implemented |
| 008 | [Customer OIDC Connection Management](specs/008-2026-10-25-customer-oidc-connection-management.md) | Implemented |
| 009 | [Authorization Management Workbench](specs/009-2026-10-26-authorization-management-workbench.md) | Implemented |
| 010 | [Enterprise and Custom MCP Connections](specs/010-2026-10-27-enterprise-and-custom-mcp-connections.md) | Implemented |
| 011 | [Keycloak Authentication Experience](specs/011-2026-10-28-keycloak-authentication-experience.md) | Implemented |
| 012 | [SCIM People Selection for Agent Permissions](specs/012-2026-10-28-scim-people-selection.md) | Implemented |
| 013 | [Okta People Selection and Provider Configuration](specs/013-2026-10-28-okta-auth0-people-selection-and-provider-configuration.md) | Proposed |
| 014 | [Keycloak Administrative Access Warning](specs/014-2026-10-28-keycloak-administrative-access-warning.md) | Implemented |
| 015 | [Identity Lifecycle Sync Management](specs/015-2026-10-28-identity-lifecycle-sync-management.md) | Implemented |
| 016 | [Remove Automated Interface Tests](specs/016-2026-10-29-remove-automated-interface-tests.md) | Implemented |
| 017 | [Simplified Keycloak Connection Form](specs/017-2026-10-29-simplified-keycloak-connection-form.md) | Implemented |
| 018 | [Attention Signals Inbox](specs/018-2026-10-29-attention-signals-inbox.md) | Implemented |
| 019 | [Contextual Access Navigation](specs/019-2026-10-29-contextual-access-navigation.md) | Implemented |
| 020 | [Investigate Problems and Decisions](specs/020-2026-10-29-investigate-problems-and-decisions.md) | Implemented |
| 021 | [Overview Dashboard](specs/021-2026-10-29-overview-dashboard.md) | Implemented |
| 022 | [Admin Design System Refresh](specs/022-2026-10-30-admin-design-system.md) | Implemented |
| 023 | [Google Workspace Connection Form](specs/023-2026-10-30-google-workspace-connection-form.md) | Implemented |
| 024 | [Service Principal Selection](specs/024-2026-10-30-service-principal-selection.md) | Implemented |
| 025 | [Google Service Account Registration](specs/025-2026-10-30-google-service-account-registration.md) | Proposed |
| 026 | [Agent Delegation Editor](specs/026-2026-10-31-agent-delegation-editor.md) | Implemented |
| 027 | [Tool Resource Mapping Review](specs/027-2026-10-31-tool-resource-mapping-review.md) | Implemented |
| 028 | [Remove Lifecycle Sync Screen and Google Warnings](specs/028-2026-10-31-remove-lifecycle-sync-screen-and-google-warnings.md) | Implemented |
| 029 | [Agent Identity and Chokepoint Token Setup](specs/029-2026-10-31-agent-identity-and-chokepoint-token-setup.md) | Implemented |
| 030 | [Investigate with Agent, Subject and Token Exchanges](specs/030-2026-10-31-investigate-agent-subject-and-token-exchanges.md) | Implemented |
| 031 | [Agent Kill Switch](specs/031-2026-11-02-agent-kill-switch.md) | Implemented |
| 032 | [Revision History](specs/032-2026-11-02-revision-history.md) | Implemented |
| 033 | [Agent Names in the Inbox](specs/033-2026-11-02-agent-names-in-inbox.md) | Implemented |
| 034 | [Integrations with One Mapping Read for Each Server](specs/034-2026-11-02-integrations-one-read-per-server.md) | Implemented |
| 035 | [Subject Names in the Inbox](specs/035-2026-11-02-subject-names-in-inbox.md) | Implemented |
| 036 | [Interactive Harness Access](specs/036-2026-11-03-interactive-harness-access.md) | Implemented |
| 037 | [Harness Login Reasons in Investigate](specs/037-2026-11-03-harness-exchange-reasons.md) | Implemented |
| 038 | [Dev Server Address From the Environment](specs/038-2026-11-04-dev-server-address-from-environment.md) | Implemented |
| 039 | [Quick Incident](specs/039-2026-11-04-quick-incident.md) | Implemented |
| 040 | [Quick Incident Help Tip](specs/040-2026-11-04-quick-incident-help-tip.md) | Implemented |
| 041 | [Agent Report-only Mode](specs/041-2026-11-04-agent-report-only-mode.md) | Implemented |
| 042 | [Microsoft Entra ID Connection Form](specs/042-2026-11-04-microsoft-entra-id-connection-form.md) | Implemented |
| 043 | [Okta Connection Form](specs/043-2026-11-05-okta-connection-form.md) | Implemented |
| 044 | [Sober Visual System](specs/044-2026-11-05-sober-visual-system.md) | Implemented |
| 045 | [Inbox Item Status Without an Exit Guard](specs/045-2026-11-06-inbox-item-status-without-exit-guard.md) | Implemented |
| 046 | [Client Allowlist Route](specs/046-2026-11-06-client-allowlist-route.md) | Implemented |
| 047 | [Codex Harness Icon](specs/047-2026-11-06-codex-harness-icon.md) | Implemented |
| 048 | [Relation Side Panel and Rules Only](specs/048-2026-11-06-relation-side-panel.md) | Implemented |
| 049 | [Investigate Layout and Rules Read as Sentences](specs/049-2026-11-07-investigate-layout.md) | Implemented |
| 050 | [Remove the Tool Mapping Screen, the Resource Block and the Resource ID Identifier](specs/050-2026-11-08-remove-tool-mapping-screen.md) | Implemented |
| 051 | [Account Area](specs/051-2026-11-11-account-area.md) | Implemented |
| 052 | [First-access Onboarding](specs/052-2026-11-12-first-access-onboarding.md) | Implemented |
| 053 | [Trace Export](specs/053-2026-11-12-trace-export.md) | Implemented |

The customer OIDC management contract is coordinated with [Backend 007 — MCP Request and Identity Validation](../backend/specs/007-2026-10-25-mcp-request-and-identity-validation.md) (Implemented). Both contracts have reviewed implementations approved for publication to main. Signed JWT validation is operational; future introspection and grant/exchange capabilities have explicit not-implemented code. Platform login remains separate. See [the canonical architecture decisions](../backend/ARCHITECTURE.md#customer-identity-and-mcp-ingress).

## Persistent Agent Management

Agents remain reusable permission groups. Group rules apply to associated users, while claim values belong to each individual user. An incoming MCP call does not need an authenticated agent name. This CRUD does not implement assignment persistence or permission evaluation; see [the canonical model](../backend/ARCHITECTURE.md#identity-and-permission-ownership).

The Access workbench uses the connected backend 005 API for agent lists, details, creation, editing and permanent deletion. Records belong to the authenticated workspace/environment selection. Query keys include user, workspace and environment; changing scope remounts the workbench, resets forms/selection and cancels private reads through the existing auth context. List filtering applies only to loaded records, and Load more agents requests the next 50 records.

Names allow 1–50 Unicode code points after trimming; descriptions allow up to 200. Any active workspace member can manage agents while roles remain deferred. CRUD saves immediately: it does not pass through the previous local Review changes/Apply preview flow. Tool and people assignments and draft/active lifecycle are not fabricated from agent records.

Create/edit supports a searchable 12-icon Lucide catalog or a small uploaded PNG/JPEG (256 KiB, at most 512×512). The backend re-encodes images as PNG and also limits that saved representation to 256 KiB. Files are sent using the existing authenticated same-origin client with CSRF. Protected image responses are fetched as blobs; temporary URLs are revoked and image caches remain scoped to the current identity/workspace/environment.

For a new agent with an image, creation precedes image upload. If upload fails after creation, the dialog retains the saved identifier and offers Retry save; it reports the partial save and does not repeat POST. Canceling after a partial save leaves the already-created agent available. Returning to a library icon removes the image through backend metadata update/cleanup. Local disk storage, persistent volumes and the later migration debt are owned and documented by the backend.

## MCP Server Management

Access → Integrations provides the MCP server catalog, friendly names, the default Lucide Server icon, connection/edit forms, backend discovery preview, and disable/re-enable. Identity providers have their own implemented OIDC catalog and create/edit form, described below. Context sources retain their existing meaning.

Streamable HTTP supports None or Bearer authentication. stdio is visibly unsupported. The browser uses only the existing same-origin authenticated API; MCP endpoints are contacted by the backend. Saved tokens are never returned or placed in query caches. Private list keys include user, workspace and environment, and forms/requests reset on scope changes. Search filters loaded server pages.

All tools begin checked on initial discovery; users can select all or individual tools before registration. Empty discovery or selection blocks creation. Expandable metadata includes protocol schemas and raw annotations, with existing annotation badges/tooltips. Rediscovery highlights New, Changed and Removed rows; affected contracts have previous/current details. Changed/removed tools remain disabled until reviewed, while missing records are retained. Re-enable requires discovery/review. Disable keeps server and tool records. These are management states, not runtime policy enforcement.

MCP verification: backend unit/race/vet/build checks and admin MCP unit checks (18 tests) plus production build passed. The full admin suite retains ten failures reproduced on the original HEAD; see the current MCP specification for exact evidence. No automated integration suite was run.

## Customer OIDC Identity Connections

This section describes the implemented scope approved for publication to main. AuthZEN SARC is the PEP/PDP evaluation contract; COAZ-MCP mapping and the PDP call are still unwired.

Customer IdPs are managed in Access → Integrations → Identity providers, per workspace/environment. Multiple distinct issuers are supported; Keycloak uses generic OIDC. The form configures name, exact issuer, accepted audiences, optional groups claim and enabled state. A configuration check verifies issuer metadata/public keys, not a complete user authentication flow. CRUD uses the existing administrative session, membership and CSRF protections. The user approved publication of these changes to main.

Incoming MCP tool calls use signed JWT access tokens and separate header-aware/legacy decoders. Opaque-token introspection, ID-JAG and Token Exchange have named code boundaries that return not-implemented errors. Runtime validation alone cannot execute a tool: the current endpoint blocks with 501 until permission evaluation is provided. Agents remain reusable permission groups in the existing CRUD, not required identities in the incoming request.

### Documentation ownership and delivery status

Stable decisions are maintained in [Backend Architecture](../backend/ARCHITECTURE.md#customer-identity-and-mcp-ingress). Admin 008 and Backend 007 record the previously approved identity scope. Task-branch additions under Backend 008–011 now include COAZ projection, PIP enrichment, PAP permission management, fine-grained PDP decisions and authorized tool forwarding. They do not add a complete inbound MCP session proxy or public AuthZEN HTTP endpoint.


## COAZ-MCP Mapping

The Admin has no mapping screen and no Resource block on the tools of an MCP server (Admin 050). The backend keeps the COAZ-MCP mapping of each tool, its default and its routes; the Admin does not edit them. Trusted attributes about the object of a call read a tool argument, not `resource.id`.


## Trusted API Sources (Backend 009 / Admin 009)

`/access/context-sources` manages workspace/environment-scoped API connections and attribute bindings. Credentials are write-only and remain in the backend. Source configuration is reviewed before saving; changed source settings invalidate existing binding approvals.

Bindings can be configured as GET operations manually or proposed by importing OpenAPI 3 JSON/YAML (up to 1 MiB). Import follows local references only and never calls imported servers. The initial profile supports scalar path/query parameters, typed JSON response selection, bearer/API-key/no authentication, 100–3000 ms timeouts and TTL 0–300 seconds. Unsupported operations are reported; OpenAPI import is not a general API execution client.

Drafts, approved bindings, sample extraction and activation review are separate. Binding retirement loads and displays published policy dependencies before confirmation. Sample extraction makes no API call or authorization decision. Runtime source failures stop dependent evaluations before the PDP, following the Cerbos Synapse enrichment reference. Backend 010 requires declared binding dependencies at evaluation; retiring a required binding blocks its policies.

## Permission and Fine-grained Policy CRUD (Backend 010 / Admin 009)

Each existing Agent is a permission grouping. Its editor associates exact issuer/subject users, enables explicit server access, selects individual qualified tools and creates/edits/removes named CEL restrictions. Server access alone grants no tools. Every applicable condition must pass, even when another grouping supplies a positive grant. The PDP defaults deny without explicit permission.

The CEL editor exposes AuthZEN subject/action/resource/context and original arguments under `context.chokepoint.arguments`. It can insert typed PIP attributes and marks their bindings as required. Boolean compilation and publication dependency checks run in the backend. User/source catalogs are real scoped API results; there is no seeded directory or browser policy evaluator.

The backend applies CEL's standard JSON numeric mapping: numbers are `double`. CEL integer-only operations require explicit conversion, for example `int(value) % 100 == 0`; mixed arithmetic is not promoted automatically.

Nested changes use a revisioned draft under the selected Agent's permissions resource. Save draft is inactive; Review & publish shows current and proposed definitions. Revocation preserves an independent draft. Stale revisions return a reload conflict. Scope/group changes unmount the editor and abort requests. All private query keys include user/workspace/environment.

No automated Admin tests were added or run. Use type checking, production build and manual browser checks for this slice. Its formal review and result approval are still pending.

## Enterprise MCP Connections and Agent Graph (Admin 010)

Integrations separates Enterprise MCPs from Custom MCPs. The GitHub button uses the official local brand asset and the backend's availability metadata. The endpoint is fixed by the provider; each customer saves its application credentials through Admin. OAuth returns to an account/tool review before registration.

Agent details include a connection graph based on published associations and grants, with MCP node details, tool counts, contextual help, zoom/fit and a vertical narrow-screen layout. Existing permission controls remain available, and changing graph/permission tabs preserves mounted editor state. The graph shows configuration, not live traffic or guaranteed runtime permits. See specification 010 and its review evidence for the resolved review findings and verification limits.

The GitHub provider offers a numbered setup guide with official documentation links before the customer’s Client ID and secret form. Configure GitHub stores the application within the selected workspace/environment. Connect GitHub is disabled with a setup helper until the scoped application configuration is saved, then uses that customer’s application for OAuth. No global GitHub credentials or API restart is required. The Agent graph omits the implicit Chokepoint enforcement node, duplicate relationship list and repeated permission actions; runtime authorization context is available through the heading help tooltip.

Enterprise MCPs show one connection per provider in the provider block, with account, status, tools and actions. Search, connection tables and pagination apply only to Custom MCPs.

## Investigation and Overview (Admin 019–021)

The coordinated implementation consumes Backend 022–025. Investigate has paged By problem and All decisions views with exact filters, retained UTC periods and historical evidence. The inspector displays recorded path states and configured condition expressions, never actual arguments or source values. Contextual actions use real permission-group, server, tool and policy references; an OAuth application identifier is not an Agent UUID. Since Admin 030 the lists and the inspector show the verified agent, the subject on whose behalf it acted (Person or Service and identity provider) and the resource; the path is Delegation, Tool, Resource and Rules with the relation checked; each deny reason has one action that opens the agent editor at the place of the fix. A third view, Token exchanges, lists the exchanges at the authorization server with their reasons and a detail in the same layout, and the Inbox shows the Token exchange denied signal.

Overview uses backend UTC aggregates for daily comparisons, allowed/denied hourly traffic, most-denied combinations, tool review coverage and distinct granted tools without recorded allowed calls in 30 days. View as table exposes chart values. The unused-tool indicator opens a paged review list. Both Custom and Enterprise tools are reachable through the review catalog.

The Inbox defaults to Open and Reviewed. An item becomes Reviewed when its Inbox action is clicked, or when the inspector of its denial problem opens by any path. Mark resolved is one click, without a confirmation, in the Inbox row and in the inspector header; a failed write shows Retry. Navigation never opens a dialog, and no URL carries the Inbox item (Admin 045). Individual calls have no workflow status.

Access routes select actual groups outside the first rail page, open the relevant permission section and highlight the affected server-qualified tool, policy or exact principal. Missing or ambiguous group evidence is explained rather than replaced with an invented application/group relationship. Navigation never changes or publishes permissions.

Priority remains future Intelligence work. No post-adjustment watcher is implemented. The UI explains asynchronous record loss and retention limits near activity metrics and history. Temporary reference screenshots remain in docs/spec-references until implementation approval. Functional browser verification is reported separately; build checks do not prove authenticated runtime behavior.
