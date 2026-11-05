# Investigation and Overview verification

Date: 2026-10-30. Backend 022–025 and Admin 019–021. Implementation branches: `feat/022-025-investigation-overview` and `feat/019-021-investigation-overview`.

## Result

Implementation and functional verification are complete. The user approved the result on 2026-10-30, after the corrections below. All seven specifications and both README indexes are Implemented. Temporary mock screenshots remain available as requested.

## Corrections after the formal review

The user requested a senior code review against the specifications. Its findings were corrected and re-verified on 2026-10-30:

- A disabled person's blocked call is recorded only for a tool known to the catalog. The recorder rejects any decision that would violate the trace table constraints, so one invalid row can no longer fail a whole batch.
- The requested tool name is read leniently for the trace only; parameter validation keeps its original position after authentication.
- Investigate, Inbox and Overview read only the owner data each response uses. Display names are resolved per issuer with one provider credential per batch, bounded parallelism and a short timeout; failures leave a name unavailable. Directory name search is bounded and reports `search_truncated`. Name matches reach SQL as arrays. Spec 023 records the one-minute display-name cache as an explicit exception to Backend 015 §6.
- Migrations 00019–00021 were consolidated into one coherent `00019_signal_lifecycle.sql`, verified on a disposable database with reason-free signals and queued events.
- Overview sparklines use the UTC-today hours; the traffic chart has the mock's hover and keyboard tooltip.
- The user removed the recording-completeness warning from the Admin (specs 020, 021, 022 and 025 record the decision).
- New unit tests cover the recorder guard, blocked-call recording, selective owner reads, the name cache, search truncation, unused-tool actions, the Keycloak batch credential and the directory name lookup/search bounds.

## Executed checks

- Backend: `go vet ./...`, `go build ./...`, `go test ./...`, `go test -race ./...`, formatting inspection and `git diff --check`: passed. Integration build tags were not enabled. Services are tested through fake repository/owner interfaces, without database mocks.
- Admin: `npm run check`, `npm run build` under Node 22.23.1 and `git diff --check`: passed. The build retains the bundle-size warning (approximately 596 kB before gzip). No automated Admin tests or test infrastructure were added.
- Actual development database migrations 018–021 were applied and inspected. The three affected tables retain ENABLE ROW LEVEL SECURITY and FORCE ROW LEVEL SECURITY. The historical signal conversion was verified against the real restricted-role setup, not assumed from unit tests.

## Manual behavior observed

The scenarios of the manual run and their results are in the functional test files of [Admin 018](../../specs/functional-tests/018-2026-10-29-attention-signals-inbox.md), [019](../../specs/functional-tests/019-2026-10-29-contextual-access-navigation.md), [020](../../specs/functional-tests/020-2026-10-29-investigate-problems-and-decisions.md) and [021](../../specs/functional-tests/021-2026-10-29-overview-dashboard.md). The lifecycle receiver (removed by Admin 028) and the SCIM group targets (replaced by Admin 026) were not migrated.

## Runtime isolation during verification

Core navigation/status mutations and initial login were tested on the normal Admin/API ports 5173/8081. Another independent worktree subsequently took port 5173. Final checks used an isolated Admin process on 5174; a temporary Go compiler overlay changed only the verification API listen address to 8082, with ADMIN_ORIGIN set to 5174. This preserved actual Origin/CSRF checks rather than rewriting or bypassing them. The overlay and alternate Vite configuration are outside the repositories; product listen/origin configuration is unchanged. API records and local IdP/MCP/source fixtures were real throughout.

## Review

The final review checked scope authorization, canonical problem keys, recorded-evidence privacy, actual destination IDs, signal state concurrency/idempotence, historical conversion, query cancellation and API/UI contract alignment. No remaining actionable defects were found in the reviewed scope. Existing recorder losses and historical missing evidence are explicit product limitations, not hidden completeness guarantees. Approval of the implementation result is still required before publication.
