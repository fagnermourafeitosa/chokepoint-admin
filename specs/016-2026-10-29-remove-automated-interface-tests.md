# Specification: Remove Automated Interface Tests

- **Specification ID**: 016
- **Date**: 2026-10-29
- **Slug**: remove-automated-interface-tests
- **Status**: Implemented
- **Approval**: The user approved the reviewed result, commit, merge and push on 2026-10-29.
- **Owner**: Admin module
- **Related Specification**: [015 — Identity Lifecycle Sync Management](015-2026-10-28-identity-lifecycle-sync-management.md) (acceptance criterion 6 depends on this decision)

---

## Context & Background

Specification 003 added Vitest, Testing Library and jsdom with rendered-behavior tests. On 2026-10-25, commit e9c250c added the module Testing Policy: no TDD, no automated tests, test suites, test fixtures or test infrastructure. Specifications 006–014 were delivered without running the suite.

On 2026-10-29 the user directed: automated interface tests are waived in this module; existing ones must be removed. Only backend tests remain in force.

---

## Problem Statement

### 1. The remaining suite contradicts the Testing Policy

`main` keeps 12 test files, 3 test-only fixtures, a Vitest configuration, a setup file, an `npm test` script and 5 test-only development dependencies. The policy forbids this infrastructure.

### 2. The suite has drifted from the product

18 of 40 tests fail on `main`. Triage found no product defect: the failures come from missing providers in test harnesses, removed features (local visual preview, unavailable-IdP placeholder) and a stale API mock. Keeping the suite produces false failures that block unrelated work, for example specification 015 criterion 6.

---

## Solution

1. Delete all admin test files and test-only fixtures.
2. Delete the test setup and Vitest configuration.
3. Remove the `test` script and the test-only development dependencies, and regenerate `package-lock.json`.
4. Update `README.md` so it no longer documents `npm test`.
5. Review extension (user-directed 2026-10-29): delete the unused local-preview code, remove the `tdd` agent skill and correct README text that describes local preview drafts.
6. Ship the MCP tool annotation tag styles, which `main` does not bundle.

Application source changes are limited to deleting unused local-preview code and importing the annotation tag styles.

---

## Implementation Decisions

1. Delete these files:
   - `src/app/AccessPreview.test.tsx`, `src/app/App.test.tsx`
   - `src/components/ui/empty-state/EmptyState.test.tsx`
   - `src/features/access/components/ToolAnnotations.test.tsx`, `src/features/access/pages/IntegrationsPage.test.tsx`
   - `src/features/auth/Auth.test.tsx`
   - `src/features/mcp/MCPDialog.test.tsx`, `MCPRegistry.test.tsx`, `ToolRows.test.tsx`, `api.test.tsx`, `useMCPForm.test.tsx`, `useMCPRegistry.test.tsx`
   - Test-only fixtures: `src/features/auth/testing.ts`, `src/features/access/testing/agents.ts`, `src/features/mcp/test-data.ts`
   - Tooling: `src/test-setup.ts`, `vitest.config.ts`
2. Remove from `package.json`: script `test`; devDependencies `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`. Regenerate the lockfile with npm 10.9.8 / Node 22.23.1. Do not change any other dependency version.
3. Delete a file only after a search confirms that no application code imports it.
4. Delete the unused local-preview code in `src/features/access`: `components/AccessActions.tsx`, `ReviewChangesDialog.tsx`, `AgentPeople.tsx`, `ToolGroup.tsx`, `ToolRow.tsx`, their style sheets `access-actions.css` and `lists.css`, `hooks/useAgentDetails.ts`, and the types `ToolSummary`, `PersonSummary`, `AgentSummary`, `AgentInput`, `PreviewChange`, `AccessData` in `types.ts`. Keep `MCPToolAnnotations` and `ToolAnnotations`, which live code uses. Fix the pre-existing unstyled annotation tags (user-directed 2026-10-29): move the `access-tool-annotations` and `access-tool-tag` rules from `components/tools.css` into `components/tool-annotations.css`, imported by `ToolAnnotations.tsx`, unchanged. Delete the rest of `tools.css`, whose classes no live component uses. Delete only modules that no remaining module imports. Unused modules outside the local preview (`src/api/ping.ts`, `src/app/context/useAdminEnvironment.ts`) stay.
6. Delete `.agents/skills/tdd/`; it contradicts the Testing Policy.
7. Rewrite the README "Login and Backend Session" and "State and Data Organization" sentences about local preview drafts to describe current persisted Access data.
8. Historical specifications keep their recorded test evidence unchanged.

---

## Acceptance Criteria

- [x] 1. No `*.test.ts(x)` file, test-only fixture, `src/test-setup.ts` or `vitest.config.ts` remains in the module.
- [x] 2. `package.json` has no `test` script and none of the five test devDependencies; `package-lock.json` matches it (`npm ci` succeeds).
- [x] 3. `README.md` no longer documents `npm test` or the test suite.
- [x] 4. `npm run check` and `npm run build` pass.
- [x] 5. Application source changes are limited to deleting unused local-preview code and importing the annotation tag styles.
- [x] 6. No module in `src` imports a deleted local-preview module or type, and no remaining local-preview module is unused.
- [x] 7. `.agents/skills/tdd/` no longer exists.
- [x] 8. `README.md` no longer describes local preview drafts.
- [x] 9. The production CSS bundle contains the `access-tool-tag` rules, and a manual desktop browser check shows styled annotation tags in an MCP server's tool rows.

---

## Out of Scope

- Unused modules outside the local preview (`src/api/ping.ts`, `src/app/context/useAdminEnvironment.ts`).
- The two test files added by specification 015 on its own branch, and that specification's criterion 6. Its owner must update them.
- Backend tests.

---

## Further Notes

This specification is written on branch `fix/admin-test-suite` instead of `main`. The main checkout holds uncommitted work for specification 015 and must not be switched.

## Implementation Notes - 2026-10-29

Deleted 12 test files, 3 test-only fixtures, `src/test-setup.ts` and `vitest.config.ts`. A search before deletion found no application import of the fixtures. Removed the `test` script and the five test devDependencies. `npm install --package-lock-only` (npm 10.9.8, Node 22.23.1) regenerated the lockfile: 74 entries removed, no remaining entry changed version, resolved URL or integrity. npm added six `inBundle` metadata entries under the optional `@tailwindcss/oxide-wasm32-wasi` package; they are bundled in that package and not installed on other platforms. `README.md` no longer lists `npm test` or the suite description, and it no longer states that representative records live in test fixtures.

Evidence: `npm ci` succeeded with the new lockfile and installed none of the removed packages. `npm run check` exited 0. `npm run build` exited 0. `npm audit` reports the same 3 low findings as `main` (`shadcn`, `@shadcn/registry`, `deepmerge`). `git diff --check` passed. A search outside `specs/` found no remaining reference to Vitest, jsdom, Testing Library or the setup file. `git diff --name-only -- src` lists only deleted test and fixture files.

Deviation: none from this specification.

## Review Extension Notes - 2026-10-29

The formal review found three cleanups; the user directed all three. Deleted `AccessActions.tsx`, `ReviewChangesDialog.tsx`, `AgentPeople.tsx`, `ToolGroup.tsx`, `ToolRow.tsx`, `access-actions.css`, `lists.css` and `hooks/useAgentDetails.ts`, and removed the six preview types from `types.ts` (only `MCPToolAnnotations` remains). Deleted `.agents/skills/tdd/`. Rewrote three README sentences: scope switching now names the pending-changes guard, the hook list drops tool grouping, and TanStack Query holds backend Access responses with no local drafts or sample records.

Finding: `tools.css` held the only `access-tool-annotations` and `access-tool-tag` rules used by the live `ToolAnnotations` (MCP tool rows). Only the dead `ToolGroup` imported it, so a production build of `main` (7ba65bf) contained no `access-tool-tag` rule and the tags rendered unstyled.

Evidence: `npm run check` exited 0. `npm run build` exited 0. `git diff --check` passed. An import-graph scan of `src` finds no unused module except `src/api/ping.ts`, `src/app/context/useAdminEnvironment.ts` (out of scope) and `tools.css` (kept above). A search finds no reference to a deleted component, hook or type.

## Annotation Style Fix Notes - 2026-10-29

The user directed the fix. The annotation rules moved unchanged (the two `.access-tool-tag` blocks merged into one) to `components/tool-annotations.css`, which `ToolAnnotations.tsx` imports. The rest of `tools.css` styled only deleted components and was removed. Modified source files: `src/features/access/types.ts` and `src/features/access/components/ToolAnnotations.tsx`; added `components/tool-annotations.css`.

Evidence: `npm run check` and `npm run build` exited 0; the production CSS contains the `.access-tool-annotations` and `.access-tool-tag` rules, including the read-only variant. An import-graph scan finds no unused module except the out-of-scope `ping.ts` and `useAdminEnvironment.ts`. Manual desktop check in the built-in browser (worktree dev server on port 5174, local backend, Development Workspace A / Sandbox, Custom MCP "Local catalog"): 12 tags render with padding 4px 8px, radius 6px and bold weight; read-only tags are green (rgb(37, 122, 88) on rgb(232, 245, 237)), other tags use the accent colors; the tag group is a wrapping flex row; the console has no errors. The same page served from the unfixed code showed the tags with a transparent background, no padding and normal weight.
