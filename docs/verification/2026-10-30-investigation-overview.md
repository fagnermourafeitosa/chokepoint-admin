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

1. Signed in as admin-a through the real Keycloak password and one-time-code flow, in Workspace A / Sandbox.
2. Alice's echo call was permitted. Bruno's list_test_items call was denied by its configured condition. The authorization outcomes were unchanged after the trace changes.
3. Inspected the new records: executed path and configured expression were present; the sentinel echo argument and the actual source value were absent. A permit identified the actual supporting group reference.
4. A missing-grant call and an unreviewed-tool call retained their original customer responses. The unreviewed-tool inspector showed the failed Tool review step and subsequent Not evaluated steps.
5. Disabled local fixture Alice in the real Keycloak console while retaining her valid token. The lifecycle receiver applied the disable event, the call returned 401, and a user_disabled record showed Identity failed and later steps Not evaluated. Re-enabled Alice immediately; the receiver state returned to enabled and the same token could call echo again. The fixture was restored.
6. The same server/tool/application/hour appeared as separate no_grant and condition problems. Older retained rows displayed missing historical condition/path evidence explicitly.
7. Current directory names appeared for Alice, Bruno and Camila. Searching Bruno returned only his matching retained problems. All decisions showed permits/denies; page 2 worked, and the Allow filter reset the page and returned the three recorded permits present at verification time.
8. Adjust permissions selected the actual SCIM Functional Test group and highlighted its recorded policy. Review tool opened the actual Signal test connection with echo focused. Unused-tool review selected the actual group and server-qualified tool. The person target selected the exact associated principal.
9. Opening an Inbox item persisted Reviewed. Cancel kept the detail open. Keep reviewed allowed departure. Mark resolved persisted actor/time, removed the item from the active list and exposed it under Resolved. Reopening a resolved item did not reopen its workflow state.
10. Historical reason-free signals were converted to canonical reason-qualified targets. An administrator's manual resolved actor/time and existing reviewed states survived conversion. No known-reason copy retained an expired-history marker.
11. Overview metrics reflected actual recorded calls and denials. The chart covered exactly 24 hours with clipped UTC boundary buckets; yesterday used the matching UTC interval. Unused tools were counted once per server/tool across published groups. The warning stated the recorder's actual completeness/retention limit.
12. A request for an inaccessible scope returned 404; an invalid page returned 400.
13. Session expiry exposed an existing cache-observer removal loop. Preserving the observed session query fixed the redirect to login and stopped the repeated private requests. A fresh sign-in succeeded.
14. The narrow-screen investigation filters were checked at a 390-pixel emulated viewport, with no document overflow and readable controls. No further layout changes are part of task completion.

## Runtime isolation during verification

Core navigation/status mutations and initial login were tested on the normal Admin/API ports 5173/8081. Another independent worktree subsequently took port 5173. Final checks used an isolated Admin process on 5174; a temporary Go compiler overlay changed only the verification API listen address to 8082, with ADMIN_ORIGIN set to 5174. This preserved actual Origin/CSRF checks rather than rewriting or bypassing them. The overlay and alternate Vite configuration are outside the repositories; product listen/origin configuration is unchanged. API records and local IdP/MCP/source fixtures were real throughout.

## Review

The final review checked scope authorization, canonical problem keys, recorded-evidence privacy, actual destination IDs, signal state concurrency/idempotence, historical conversion, query cancellation and API/UI contract alignment. No remaining actionable defects were found in the reviewed scope. Existing recorder losses and historical missing evidence are explicit product limitations, not hidden completeness guarantees. Approval of the implementation result is still required before publication.
