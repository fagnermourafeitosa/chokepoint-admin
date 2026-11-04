# Specification: Dev Server Address From the Environment

- **Specification ID**: 038
- **Date**: 2026-11-04
- **Slug**: dev-server-address-from-environment
- **Status**: Waiting Approve
- **Owner**: Admin — development server configuration (`vite.config.ts`, `dev.sh`)
- **Related Specification**: [Backend 052 — HTTP Address From the Environment](../../backend/specs/052-2026-11-04-http-address-from-environment.md) (the same rule on the API side)

---

## Context & Background

`vite.config.ts` hard-codes the host `127.0.0.1`, the port `5173` and the proxy target `http://127.0.0.1:8081` of the development server. Backend 052 moved the listen address of the API to `HTTP_ADDRESS`, so an API can run on any address. The Admin can not follow it.

A second local instance (the demo instance in `dev-infra/demo-instance`, with its own database and API) needs an Admin on another host and port that proxies to another API.

---

## Problem Statement

### 1. The address of the development server is hard-coded

This is a defect. The host, the port and the proxy target are literals. A second Admin can not start, and an Admin can not reach an API on another address.

---

## Solution

1. `vite.config.ts` reads `ADMIN_DEV_HOST`, `ADMIN_DEV_PORT` and `ADMIN_API_TARGET` with Vite `loadEnv` (all variables, no `VITE_` prefix: they are server settings, never browser values). The literals are removed. There is no default and no fallback: a missing value stops the server with an error that names the variable.
2. Process environment values take precedence over `.env.local` (Vite behavior), so a script can start an Admin on another address without a file change.
3. `.env.local` holds the development values: `ADMIN_DEV_HOST=127.0.0.1`, `ADMIN_DEV_PORT=5173`, `ADMIN_API_TARGET=http://127.0.0.1:8081`. `.env.example` documents the three variables.
4. `strictPort` stays on.
5. `dev.sh` reads `ADMIN_DEV_PORT` and `ADMIN_API_TARGET` the same way (process environment first, then `.env.local`), stops the listener of that port and checks that target, instead of the fixed `5173` and `8081`.

Each existing local `.env.local` must add the three variables once.

---

## User Stories

- [x] 1. As a developer, I want the Admin development server address from the environment, so that a second Admin can run next to the first one.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language
- **Context**: local development tooling; no screen or behavior changes.
- **Package Ownership**: `vite.config.ts`, `dev.sh`, `.env.example`.

### 2. Aggregate Root & State Transitions
- None.

### 3. Commands, Queries & Domain Ports
- `npm run dev` reads the address from the environment.

---

## Testing Decisions

Verify with `npm run check`, `npm run build` and a functional test in the built-in browser:

- With `.env.local`, `npm run dev` starts on `127.0.0.1:5173` and signs in through the API on `127.0.0.1:8081`.
- With `ADMIN_DEV_PORT` missing, the server stops with an error that names it.
- With the three variables set in the process environment to other values, the server starts on that host and port and proxies to that target.

---

## Acceptance Criteria

- [x] `vite.config.ts` holds no host, port or proxy target literal.
- [x] A missing variable stops the server with an error that names it.
- [x] Process environment values win over `.env.local`.
- [x] `.env.example` documents the three variables.
- [x] `npm run check` and `npm run build` pass.

---

## Out of Scope

- The demo instance, its data, its traffic and its captures (`dev-infra/demo-instance`, unversioned).
