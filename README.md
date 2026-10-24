# Chokepoint Admin

React application for managing the Chokepoint platform.

This module owns the platform management interface. The public-facing Chokepoint page lives in the separate `frontend` module, and backend services and APIs live in `backend`.

Development instructions are in [AGENTS.md](AGENTS.md), including the [Vercel React Best Practices skill](.agents/skills/react-best-practices/SKILL.md). The selected stack is **React + Vite**.

## Technology Choice

Use React with Vite for the platform management application. The admin consumes the Go backend APIs and uses client-side rendering.

## Local Environment

Use Node.js `22.23.1` and npm `10.9.8`. Each module has its own `package.json`, `package-lock.json`, and local `node_modules`; run package-manager commands from the module directory.

```sh
nvm install
nvm use
npm ci
```

A local `.env.local` is prepared for this checkout and ignored by Git. For a new checkout, copy `.env.example` to `.env.local`. Environment variables will be added when the relevant integrations are defined. Variables prefixed with `VITE_` are exposed to the browser. Never store secrets in public variables.

## Application

The admin layout follows the workbench reference layout. Overview and Investigate retain empty pages. Access has Permissions, Context sources and Integrations child routes; its production initial collections remain empty. Development and production both start with empty collections. Representative records are confined to test fixtures. Navigation uses React Router and browser history. Workspace and profile controls open design-system dropdowns. The environment selector switches between Sandbox and Production in layout state. Search and audit are absent.

```sh
npm run dev
npm run check
npm test
npm run build
npm run preview
```

The development server binds to `127.0.0.1:5173`. Production hosting must serve `index.html` for application routes such as `/access` and `/investigate`.

## Design System

The application imports [the admin design system](docs/design-system/README.md), including its local fonts and semantic tokens. The [workbench mock](docs/chokepoint-workbench/README.md) remains a reference and is not modified.

## Source Organization

- `src/app`: application routing and navigation configuration.
- `src/layouts`: shared page composition and selected environment state.
- `src/components/header`: header, navigation, workspace/environment selectors and profile menu.
- `src/components/ui/dropdown`: reusable disclosure behavior and styling, independent of page composition.
- `src/pages`: top-level page composition.
- `src/features/access`: Access navigation, page components, agent rail and feature styles.
- `src/api`: backend HTTP transport and endpoint calls.

## Backend HTTP Client

`src/api/http-client.ts` exposes JSON fetch requests with a hardcoded local-development Bearer token, a ten-second timeout, cancellation and typed HTTP status errors. `src/api/ping.ts` exports `pingBackend()` for GET `/api/v1/ping`; the empty pages do not invoke it automatically.

Run `GOTOOLCHAIN=go1.27.0 go run ./cmd/api` from the backend module. Vite forwards `/api` to `http://127.0.0.1:8081`. Production hosting would need equivalent API routing and real authentication; the fixed token is a development scaffold.

## Access Workbench

Open `/access` for Permissions, `/access/context-sources` for Context sources or `/access/integrations` for Integrations. The shared Access navigation supports direct entry, active links and browser history. Permissions uses selectable agent rows, separate detail/tool/people components and reusable brown-icon no-data placeholders. The mock heading and Agents counter are restored. New agent and Review changes open native dialogs; changes affect only the explicitly labeled local preview. The rail People shortcut and Evaluation Lab stay absent. No demonstration records seed the application. The workbench mock remains unchanged.

`npm test` runs eighteen rendered-behavior tests using Vitest and Testing Library with jsdom. Tests cover navigation, direct URLs, placeholders, selection/search, native-dialog lifecycle integration, draft/review changes, environment isolation and existing header controls. Desktop browser verification includes the visual preview at 1440×1000 and 1000×800; no mobile interface testing was performed.

## State and Data Organization

Custom hooks are separate from JSX: Access data/cache, selection/search, tool grouping, form handling, shared dropdown/dialog lifecycle and admin layout state each have a dedicated hook file. AppProviders owns the QueryClientProvider with a separate client factory and initialization hook. TanStack Query starts with empty data and holds only explicitly local UI drafts; query keys separate environments and no backend URLs are invented. Production builds do not seed the temporary sample records.

## MCP Tool Annotations

Tool metadata uses optional `ToolAnnotations` fields (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint` and optional `title`). Supplied boolean hints are displayed independently, explicit false values are retained, and missing fields are not filled with UI classifications. Tools without annotations render normally without badges. Destructive/idempotent hints are omitted for explicitly read-only tools. Annotation badges expose shared design-system tooltips on hover and keyboard focus, including explanations and their MCP field/value. Tooltips remain reachable by pointer, dismiss with Escape/blur, and use a portal to avoid clipping. These server-provided hints do not control permissions. See the [official MCP schema](https://modelcontextprotocol.io/specification/2026-07-28/schema#toolannotations).

Agent initial-letter blocks and the repeated environment label in details are removed; the current MCP Server icon is retained.

## Specifications

| ID | Specification | Status |
| :--- | :--- | :--- |
| 001 | [Admin Shell](specs/001-2026-10-24-admin-shell.md) | Waiting Approve |
| 002 | [Development HTTP Client](specs/002-2026-10-24-http-client.md) | Waiting Approve |
| 003 | [Access Workbench Layout](specs/003-2026-10-24-access-workbench-layout.md) | Implemented |
