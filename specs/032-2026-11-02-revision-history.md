# Specification: Revision History

- **Specification ID**: 032
- **Date**: 2026-11-02
- **Slug**: revision-history
- **Status**: Proposed
- **Owner**: Admin — Access and Permissions, Investigate, design system
- **Related Specification**: [Backend 038 — Permission Revision History and Agent Soft Delete](../../backend/specs/038-2026-11-02-permission-revision-history.md)
- **Related Specification**: [026 — Agent Delegation Editor](026-2026-10-31-agent-delegation-editor.md) (publication bar)
- **Related Specification**: [020 — Investigate](020-2026-10-29-investigate-problems-and-decisions.md) (decision inspector)
- **Related Specification**: [031 — Agent Kill Switch](031-2026-11-02-agent-kill-switch.md) (agent status)
- **Related Specification**: [030 — Investigate with Agent, Subject and Token Exchanges](030-2026-10-31-investigate-agent-subject-and-token-exchanges.md) (current decision inspector facts)
- **Related Specification**: [033 — Agent Names in the Inbox](033-2026-11-02-agent-names-in-inbox.md)
- **Visual reference**: layout prototype on the remote branch [`design/038-revision-history`](https://github.com/fagnermourafeitosa/chokepoint-admin/tree/design/038-revision-history), commit `28bc29c`, based on `main` at `2684d50` (Admin 035). Approved by the user on 2026-11-02. Fixed data in `src/features/access/delegation/RevisionHistory.tsx` and `prototypeRevision` in `src/features/investigate/DecisionInspector.tsx`; the `SidePanel` component and its design system documentation are in the same commit.

---

## Context & Background

Admin 026 publishes the permission document of an agent. The publication bar shows only "Revision N effective". Nobody can see who published, when, why, or what changed. Investigate (020) can not show which revision decided a call.

Backend 038 keeps each published revision with its snapshot, author, time and optional note, records the revision of each decision, and makes agent deletion a soft delete. This specification is the Admin side.

The prototype was built inside the real screens (Access and Investigate), not under `/prototype`, because it adds to existing screens. The user reviewed it there. The prototype was rebased on the inspector of Admin 030; the Permission revision row is the last item of its facts list.

---

## Problem Statement

### 1. A change of access has no author and no reason

Several administrators and developers can publish. The Admin does not show who changed the access of an agent, when, or why.

### 2. Earlier revisions can not be seen or compared

An administrator can not see what an earlier revision allowed or what a publication changed.

### 3. A decision can not be connected to a change of rules

The decision inspector does not show which permission revision applied.

### 4. Delete says the history is lost

The delete dialog says that the agent and its access are removed permanently. With Backend 038 the access is revoked and the history stays.

---

## Solution

1. **Publication bar.** Next to the revision state, show "by {author} · {time} · “{note}”" of the latest published revision, and a **History** action. The author text also opens the history. While a revision is pending, the state reads "Applying revision N · revision M still applies", with a tooltip: Chokepoint is writing the revision to OpenFGA; no approval is needed.
2. **Note on publish.** The "Review & publish" confirmation has an optional field "Why this change? (optional)", at most 500 characters, sent with the publish command.
3. **Revision history side panel.** History opens a wide side panel on the right edge (design system `SidePanel`, `width="wide"`). The eyebrow is the agent name; the title is "Revision history".
   - **Timeline (left):** published revisions, newest first. Each entry: "Revision N", a badge (Effective, Revoked or Never applied), author initials and name, relative time, the first line of the note. Dot: filled green for the effective revision, filled red for a revocation, dashed for a revision that never applied, neutral for the others.
   - **Detail (right):** the selected revision: Publication or Revocation, "Revision N", Published or Revoked by, When, Applied (or "Never. A newer revision replaced it before OpenFGA confirmed it."), the note as a quote ("No note was added to this revision." when absent), counts "+added −removed ~changed" against the previous revision, and the changes grouped by section: Who can delegate, Servers and tools, Resources, Rules. An added row has a green edge, a removed row a red edge and strike-through, a changed row an amber edge.
   - The panel opens on the latest revision.
4. **Diff in the Admin.** The Admin computes the changes from the snapshot of the selected revision and the snapshot of the previous revision (Backend 038 Implementation Decision 1). Delegations compare by identity connection, subject and kind; capabilities by server and tool; resources by server, type and value; rules by condition ID (a changed expression or name is "changed"). A revocation lists every removed item. The first revision lists every item as added.
5. **Decision inspector.** The facts list of a decision gets **Permission revision**: "Revision N" as a link that opens the same side panel on that revision, without leaving Investigate. When the published revision differs from the effective one, add "Revision P was applying". When the decision has no recorded revision, show "Not recorded".
6. **Delete agent.** The dialog says: the agent loses all delegation and access at once and can not get new tokens; its saved draft is dropped; Chokepoint keeps the revision history and the recorded decisions, and Investigate shows its name as deleted. After deletion the agent leaves the list. In Investigate and in the Inbox, a deleted agent shows its name with "(deleted)".
7. **Design system.** The `SidePanel` component (`src/components/ui/side-panel/SidePanel.tsx`) and its styles (`cp-admin-side-panel*` in `docs/design-system/styles/components.css`, tokens `--cp-admin-layout-side-panel` and `--cp-admin-layout-side-panel-wide`) are documented in `components.md`, `layouts.md`, `tokens.md` and the `preview.html` specimen. Done in the prototype; keep it.

---

## User Stories

- [ ] 1. As an administrator, I see who published the current revision, when and why, from the publication bar.
- [ ] 2. As an administrator, I add an optional note when I publish.
- [ ] 3. As an administrator, I open the revision history of an agent and see what each revision changed.
- [ ] 4. As an administrator, I open the revision of a decision from Investigate, without leaving it.
- [ ] 5. As an administrator, I understand before I delete an agent that its access is revoked and its history stays.

---

## Backend dependencies

All from [Backend 038](../../backend/specs/038-2026-11-02-permission-revision-history.md):

1. **Latest revision author:** `published_by`, `published_by_name`, `published_at` and `note` on `GET …/agents/:agent_id/permissions` (Implementation Decision 9).
2. **Publish and revoke note:** optional `note` on the publish and revoke commands (Implementation Decision 7).
3. **History list:** `GET …/permissions/revisions?page=&page_size=` with `revision`, `action`, `published_by`, `published_by_name`, `published_at`, `effective_at`, `note` (Implementation Decision 9).
4. **Revision snapshot:** `GET …/permissions/revisions/:revision` with `document` (Implementation Decision 9).
5. **Revision of a decision:** `effective_revision` and `published_revision` on a decision of the decision trace read API, null when not recorded (Implementation Decision 10).
6. **Soft delete:** `DELETE …/agents/:agent_id` revokes and keeps the agent; deleted agents leave the list; Investigate names stay; the `agent` object of the trace read API gains `status`, and a signal context gains `agent_status`; `deleted` shows "(deleted)" next to the agent name in Investigate and in the Inbox (Implementation Decisions 14 to 18).

---

## Implementation Decisions

1. The side panel loads the history list when it opens and the snapshots of the selected revision and the one before it when a revision is selected. It does not load all snapshots.
2. History pages are newest first, 20 at a time; the timeline loads more at its end.
3. Relative times ("2 hours ago") use the browser clock; the detail shows the absolute time in UTC, like Investigate.
4. Author initials come from `published_by_name`; when the name is absent, show the user ID shortened and no initials.
5. The publication bar shows the author only when a revision is published.
6. Remove the prototype fixed data (`prototypeRevisions`, `prototypeRevision`) and every "Waiting backend · 038" chip when the backend items are implemented.

---

## Testing Decisions

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build`. The user runs the interface test in the built-in browser.

---

## Acceptance Criteria

- [ ] 1. The publication bar shows the author, time and note of the latest revision and opens the history.
- [ ] 2. Publish sends the optional note.
- [ ] 3. The history side panel shows the timeline and the computed diff of the selected revision.
- [ ] 4. The decision inspector shows the permission revision and opens the side panel on it, or shows "Not recorded".
- [ ] 5. The delete dialog states the soft delete; a deleted agent leaves the list and shows as deleted in Investigate.
- [ ] 6. The `SidePanel` component and its documentation are in the design system.
- [ ] 7. No "Waiting backend" chip remains for an implemented item.
- [ ] 8. `npm run check` and `npm run build` pass.
- [ ] 9. The user confirms the interface test.

---

## Out of Scope

- Restoring an earlier revision into the draft ("Open this revision" stays disabled in the prototype).
- A side-by-side compare of any two revisions; the diff is always against the previous revision.
- History of tool mappings, context sources and identity connections.
- Policy Intelligence findings and suggestions.

---

## Further Notes

The prototype points its Vite proxy at a local backend on port 8082 and rewrites the request `Origin` (in `vite.config.ts`), because another session used port 8081. These changes are local to the prototype worktree and must not be committed.
