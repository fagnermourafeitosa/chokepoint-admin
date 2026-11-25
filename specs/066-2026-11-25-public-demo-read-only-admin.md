# Specification: Read-only Admin of the Public Demo

- **Specification ID**: 066
- **Date**: 2026-11-25
- **Slug**: public-demo-read-only-admin
- **Status**: In Progress
- **Owner**: Admin, authentication and account area
- **Related Specification**: [Backend 107 — Public Demo Workspace for Claude Code](../../backend/specs/107-2026-11-25-public-demo-workspace.md), [051 — Account Area](051-2026-11-11-account-area.md)

---

## Context & Background

Backend 107 creates a public demo workspace and publishes its Admin login on the site: `xokepoint@example.com`, password `xokepoint-demo-2026`. The session of that login only reads: the backend answers 403 `demo_read_only` to every write (Backend 107, `internal/demoworkspace/guard.go`). The user decided (2026-11-25) that this visitor sees everything and changes nothing, and that the account area is disabled for it.

---

## Problem Statement

### 1. The visitor lands on the account area

The account area holds the workspace list, events export, Barricade and account info. None of it is for a visitor, and every action there is refused by the backend.

### 2. The account area is reachable from the profile menu

The profile menu links **Account** for every session.

---

## Solution

1. For the session of the demo owner, the account area is not reachable: every `/account` path opens the Admin of the demo workspace, in its Sandbox.
2. In the profile menu, **Account** is shown disabled for that session, with the hint "Not available in the demo".
3. Everything of the demo lives in `src/features/demo/`. The account route and the profile menu each have one hook into it; no other screen has a demo branch.

---

## User Stories

- [ ] 1. As a visitor of the demo, I want to land on the Admin of the demo Sandbox after the login, so that I see the configuration and the calls at once.
- [ ] 2. As a visitor of the demo, I want the Account entry shown disabled, so that I know it is not part of the demo.
- [ ] 3. As the platform owner, I want no demo branch in the screens of real customers, so that the demo never changes their behavior.

---

## Decisions

1. **Who is the demo.** The session user ID equals the fixed owner ID of Backend 107 (`00000000-0000-4000-8000-00000000d3e0`). The ID is public and fixed by a backend migration.
2. **Account area redirect.** A route element in `src/features/demo/` wraps the account routes: for the demo session it navigates to `/`, where the Admin opens the only workspace in its Sandbox (Admin 051).
3. **Profile menu.** The Account entry is a component of `src/features/demo/`: the normal link for every session, and for the demo session a disabled entry with `aria-disabled` and the hint.
4. **Writes.** The other screens keep their actions; the backend refuses them with 403. A read-only banner on every screen is out of scope.

---

## Acceptance Criteria

- [ ] 1. Signed in as the demo login, the Admin opens the demo Sandbox, not the account area.
- [ ] 2. Signed in as the demo login, `/account/workspaces` typed in the address bar opens the Admin of the demo.
- [ ] 3. Signed in as the demo login, the profile menu shows Account disabled with the hint.
- [ ] 4. Signed in as another user, the account area and the profile menu are unchanged.
- [ ] 5. Functional test: [066-2026-11-25-public-demo-read-only-admin](functional-tests/066-2026-11-25-public-demo-read-only-admin.md).
- [ ] 6. `npm run check` and `npm run build` pass.

---

## Out of Scope

- A read-only banner and disabled actions on the other screens.
- The site menu of the demo (Frontend prototype 041).
