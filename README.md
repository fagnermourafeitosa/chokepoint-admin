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

## Installed Dependencies

React, React DOM, React Router, TanStack Query, React Hook Form, Zod, Lucide, and UI composition helpers. Vite, TypeScript, Tailwind CSS, and the shadcn CLI are local development dependencies.

This setup installs dependencies only. Application entrypoints, routes, framework configuration, and UI components will be implemented separately.

shadcn/ui components are added as project source when needed; installing the local CLI does not generate components. `@hookform/resolvers` is pinned to `5.9.2` because version `6.0.0` currently produces an optional-peer dependency conflict during installation with npm 10.

## Design System

See the [module design system](docs/design-system/README.md) for tokens, page composition, reusable CSS, local fonts, and visual specimens.
