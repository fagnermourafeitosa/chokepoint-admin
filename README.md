# Chokepoint Admin

The management application of the platform: administrators configure agents, MCP servers, identity connections, context sources and permissions, and follow what the agents do. Public pages belong in `frontend`; services and business rules belong in `backend`.

Read these before you change code:

| Document | What it gives you |
| :--- | :--- |
| [AGENTS.md](AGENTS.md) | Workflow, specification lifecycle, verification and functional tests |
| [PRODUCT.md](PRODUCT.md) | Design context: users, purpose and tone |
| [Design system](docs/design-system/README.md) | Tokens, fonts, components and layout rules |
| [backend/docs/authorization-domain-model.md](../backend/docs/authorization-domain-model.md) | The canonical names used in every screen |
| [specs/](specs) | The approved specifications, indexed at the end of this file |
| [specs/prototypes/README.md](specs/prototypes/README.md) | Layout prototypes, served only by the development server |

## Baseline

Node.js 22.23.1 and npm 10.9.8 (`.nvmrc`), React 19 with Vite 8 (client-side rendering), React Router, TanStack Query, React Hook Form with Zod, Tailwind CSS 4 and TypeScript. Exact versions are in `package.json`.

## Quick Start

The Admin runs only behind the local Envoy, which serves it and routes `/api/v1/` on the same origin to the backend. Start the stack and the backend first:

```sh
../dev-infra/up.sh
../backend/dev.sh
```

Then, from this directory:

```sh
nvm use
npm ci
./dev.sh
```

`dev.sh` installs the dependencies when needed and starts Vite on `127.0.0.1:5173`. Open <https://app.xokepoint.localhost/login>, never the Vite port: the login callback, the Origin check and the cookies use that origin. The seed users are listed in the [backend README](../backend/README.md#development-users).

| Command | Use |
| :--- | :--- |
| `npm run dev` | Development server |
| `npm run check` | Type check |
| `npm run build` | Type check and production build |
| `npm run preview` | Serve the production build |

Every change is verified with `npm run check`, `npm run build` and a functional test in the browser on the demo instance (see AGENTS.md). This module has no automated tests.

## Configuration

Create `.env.local` from [.env.example](.env.example). `VITE_` values reach the browser: never put a secret in them.

| Variable | Purpose |
| :--- | :--- |
| `ENV` | Environment of the checkout; `development` locally |
| `ADMIN_DEV_HOST`, `ADMIN_DEV_PORT` | Address of the Vite server, where Envoy reaches it |
| `ADMIN_PUBLIC_ORIGIN` | Origin the browser uses; the backend `ADMIN_ORIGIN` must be the same |

## Application

| Area | Route | What it holds |
| :--- | :--- | :--- |
| Overview | `/` | Traffic, metrics, unused tools and the Inbox |
| Access | `/access`, `/access/context-sources`, `/access/integrations` | Agents and their permissions, context sources, identity providers, MCP servers and external apps |
| Investigate | `/investigate` | Tool call and token exchange history, problems and the inspector |
| Inbox signal | `/inbox/:signalId` | Opens a signal from a link, such as a Slack message |
| Account | `/account/info`, `/account/workspaces`, `/account/events-export`, `/account/barricade` | Profile, workspaces, event export destinations and Barricade |
| Entry | `/login`, `/signup`, `/onboarding/workspace` | Sign-in, sign-up and the first workspace |

Every private screen works in the workspace and environment chosen in the header (Sandbox or Production).

## Session and Data

- **Login.** The login and signup pages post to the backend, which runs the OIDC exchange with Keycloak and sets an HttpOnly session cookie. The Admin never sees passwords, provider tokens or the cookie. Mutations send the session-bound CSRF token, kept in memory only.
- **Server state.** TanStack Query holds every backend response. Private query keys include the user, workspace and environment, so switching context drops the old data. A pending-changes guard asks before unsaved edits are discarded.
- **Errors.** A 401 returns to the login page; other failures show a retry. Logout and session expiry clear private state. Nothing private is kept in browser storage.

## Source Organization

| Source | Responsibility |
| :--- | :--- |
| `src/app` | Routes, navigation, providers and the selected context |
| `src/layouts` | Shared page composition |
| `src/pages` | Top-level pages: Overview, Access, Investigate |
| `src/components` | Header, workspace and environment selectors, shared UI parts |
| `src/features/<feature>` | Each feature's API client, data hooks and components: `access`, `account`, `attention`, `auth`, `externalapps`, `identity`, `investigate`, `mcp`, `onboarding`, `overview`, `sources`, `prototype` |
| `src/api` | Backend HTTP transport |
| `docs/design-system` | Design system and its styles |
| `infra` | Production image and deploy |

Hooks live apart from JSX, one file per concern.

## Container Image and Deploy

`infra/Dockerfile` builds the static site and serves it with static-web-server on port 8080, with `/health` for the health check. Unknown paths return `index.html`, so client routes load directly. The image does not route `/api` and sets no security header: Envoy does both. There is no development image.

`infra/deploy.sh` deploys to `local` and then `production` (or one of them as argument). It needs a clean checkout equal to `origin/main` and the sibling `backend` and `dev-infra` checkouts. The Admin has its own Terraform root, so a deploy changes only the Admin container. It shows each plan and asks before it applies, and the new container is healthy before the old one stops. A rollback is a revert commit on `main`, deployed the same way. See `backend/INFRA.md`, Application Deploys.

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
| 054 | [Cumulative Limits in Rules and Signal Severity](specs/054-2026-11-13-cumulative-limits-and-signal-severity.md) | Implemented |
| 055 | [Tool Review Text](specs/055-2026-11-14-tool-review-text.md) | Implemented |
| 056 | [Remove Enterprise MCP](specs/056-2026-11-15-remove-enterprise-mcp.md) | Implemented |
| 057 | [Tool Review History and Remembered Denials](specs/057-2026-11-15-tool-review-history.md) | Implemented |
| 058 | [Tool Trifecta Levels](specs/058-2026-11-15-tool-trifecta-levels.md) | Implemented |
| 059 | [Slack Integration](specs/059-2026-11-15-slack-integration.md) | Implemented |
| 060 | [Behavior Drift in the Inbox](specs/060-2026-11-16-behavior-drift-inbox.md) | Implemented |
| 061 | [Inbox Categories](specs/061-2026-11-16-inbox-categories.md) | Implemented |
| 062 | [Barricade](specs/062-2026-11-16-barricade.md) | Implemented |
| 063 | [PII Policies](specs/063-2026-11-22-pii-policies.md) | Implemented |
| 064 | [Revision Review](specs/064-2026-11-24-revision-review.md) | Not Implemented |
| 065 | [Generic OIDC Connection](specs/065-2026-11-25-generic-oidc-connection.md) | Implemented |
| 066 | [Read-only Admin of the Public Demo](specs/066-2026-11-25-public-demo-read-only-admin.md) | Implemented |
