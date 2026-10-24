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

The admin shell follows the workbench reference layout. Overview, Access and Investigate have separate routes and entirely empty content areas. Navigation uses React Router and browser history. Workspace and profile controls open design-system dropdowns. The environment selector switches between Sandbox and Production in shell state. Search and audit are absent.

```sh
npm run dev
npm run check
npm run build
npm run preview
```

The development server binds to `127.0.0.1:5173`. Production hosting must serve `index.html` for application routes such as `/access` and `/investigate`.

## Design System

The application imports [the admin design system](docs/design-system/README.md), including its local fonts and semantic tokens. The [workbench mock](docs/chokepoint-workbench/README.md) remains a reference and is not modified.

## Specifications

| ID | Specification | Status |
| :--- | :--- | :--- |
| 001 | [Admin Shell](specs/001-2026-10-24-admin-shell.md) | Waiting Approve |
