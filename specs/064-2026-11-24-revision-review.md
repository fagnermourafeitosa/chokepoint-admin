# Specification: Revision Review

- **Specification ID**: 064
- **Date**: 2026-11-24
- **Slug**: revision-review
- **Status**: Implemented
- **Owner**: Admin — Access and Permissions (Delegation and access, publication bar, revision history)
- **Related Specification**: [026 — Agent Delegation Editor](026-2026-10-31-agent-delegation-editor.md) (publication bar)
- **Related Specification**: [032 — Revision History](032-2026-11-02-revision-history.md) (history panel and its diff)
- **Related Specification**: [048 — Relation Side Panel](048-2026-11-06-relation-side-panel.md) (List view and side panel)
- **Related Specification**: [Backend 038 — Permission Revision History and Agent Soft Delete](../../backend/specs/038-2026-11-02-permission-revision-history.md)

---

## Context & Background

Delegation and access (Admin 026, 048) edits a draft of the permission document of an agent: who can delegate to it, the tools it can call, the allowed values and the rules of each call. Edits stay in the browser until Review & publish saves the draft and publishes it. The publication bar shows the number of unpublished changes, the effective revision and the History button.

The revision history (Admin 032, Backend 038) lists the published revisions of an agent and what each one changed from the revision before it. The Admin computes that diff in the browser from the snapshots of the two revisions.

The editor already holds the draft and the published document, and the history already loads every snapshot. Nothing in this specification needs a new backend contract.

---

## Problem Statement

### 1. The review does not say what changes

Review & publish turns the bar into one line: "Publish N changes? New calls use them once OpenFGA confirms.", a note field, Back and Publish. It does not list the changes, whether each one adds, removes or changes access, or what the publication takes away. An administrator can remove every delegation of an agent and read only "Publish 1 change?".

### 2. The draft has no diff anywhere

The Draft and Published views show one state at a time with no change marked: a removed row is gone from the Draft view. The history compares published revisions only. An administrator sees the diff of a change only after it is published and effective.

### 3. The diff flattens what belongs together

Removing an identity provider removes its delegations too. The history shows the provider and each of its people as rows of the same level and counts each one: one action reads as three changes. The publication bar counts the same way.

### 4. The history leaves questions open

Revision numbers skip, because a saved draft also takes a number, and nothing says so. A revision whose permission document did not change shows only "This revision has the same access as the one before it".

---

## Solution

The layout and the specification were approved by the user on 2026-11-27.

1. **Review panel.** Review & publish opens a side panel titled "Review changes", with the agent name above it. It shows a summary line ("Draft against revision N", the added, removed and changed counts), the loss-of-access warning when there is one, the change list, and a footer with the note ("Why this change? Optional. It shows in the history."), Back to the draft, and Publish N changes. The draft is compared with the published revision, the revision that the draft replaces. The inline review step of the bar is removed.
2. **Loss-of-access warning.** One warning, titled "Access is lost", with one line for each change that takes access away, in the order of the change list. Each line says who loses what and the reason the call is then denied, with the reason text of Investigate. A change that only gives access (a tool, a person or an identity provider added, a rule removed) has no line. With one line, the warning shows it as a sentence; with more, as a list.

   | Change | Line |
   | :--- | :--- |
   | The last identity provider removed | Nobody can delegate to `<agent>` after this. Every call of the agent is denied: Subject did not delegate. |
   | An identity provider removed while others stay, or people removed | `<people>` can no longer delegate to `<agent>`. The calls made for them are denied: Subject did not delegate. Many people read as a count and the provider, such as "5 people of Acme Identity". |
   | The kinds of an identity provider narrowed (people or services taken out) | `<provider>` no longer delegates `<people or services>` to `<agent>`. The calls made for them are denied: Subject did not delegate. |
   | A person blocked on the agent | `<person>` is blocked on `<agent>`. The calls made for `<person>` are denied: Person blocked on the agent. |
   | A tool removed | `<agent>` can no longer call `<tool>` on `<server>`. Those calls are denied: The agent can not call this tool. |
   | An allowed value removed | `<server>` no longer allows `<value>` as `<resource type>`. Calls with that value are denied: The value of the call is not one of the allowed values of the agent. An allowed value belongs to a server and a resource type, not to one tool. |
   | A rule added or changed | A rule of `<tool>` changed: `<before>` → `<after>` (added: "A rule of `<tool>` was added: `<after>`"). Calls that passed before can be denied: A rule of this agent · server · tool was not met. |
   | An expiry set or shortened, on a delegation or a tool | `<what>` stops on `<date>`. After that, its calls are denied with the reason of that relation. |

   A rule line says "can be denied": the diff can not tell whether the new rule is stricter.
3. **One change, its consequences under it.** A change lists the changes it causes under it, indented and without a sign of their own: the people of a removed or added identity provider sit under the provider. The change counts once, in the summary of the panel, in the history and in the publication bar ("Draft · 1 unpublished change"). A changed rule shows its sentence before (struck through) and after.
4. **Marked rows in the Draft view.** In the List view of the Draft, each added, removed or changed row has an Added, Removed or Changed badge next to its name and a mark of the same tone on its left edge. A removed row stays visible, struck through and muted, until the draft is published or discarded; it has the Open action only. The count of each section does not count removed rows. The Graph view of the Draft marks the same changes: a changed box has the same badge under its title and a border of the badge tone; a removed box stays, dashed, muted and struck through, with Open only; the line of a changed relation is dashed in the neutral line colour, never red. One "Unpublished" chip on the canvas, with a dashed line, reads "Dashed: changed in the draft, not published yet.", so that a dashed line does not read as a failure. The Published view has no marks.
5. **The draft in the history.** When the history opens from the publication bar and the agent has unpublished changes, the timeline shows the draft first ("Draft", "Not published", "N unpublished changes") and selects it. Its detail shows "Changes from revision N", the same change list and a **Publish** button. The history already shows the changes, so Publish does not open the review panel again: it opens a confirmation dialog, "Publish N changes to `<agent>`?", with the loss-of-access warning when there is one, the note, Cancel and Publish, as a merge confirmation does after the changed files of a pull request. The history opened from the Report-only notice of the agent does not show the draft.
6. **Answers in the history.** Under the timeline: "Revision numbers skip: saving a draft also takes a number." A revision with no change to the permission document names what stayed the same: "Who can delegate, the tools and the rules are the same as in revision N."

---

## Practical Gains & Operational Outcomes

1. **Safety of a publication**:
   - *Before*: "Publish 1 change?" can remove every delegation of an agent, with no word about it.
   - *Now*: the review lists the change and says, before Publish, that nobody can delegate to the agent and why its calls will be denied.
2. **Reading a draft**:
   - *Before*: a removed row disappears from the Draft view; the diff exists only after publication.
   - *Now*: the Draft view marks each changed row, and the review panel and the history show the diff before publication.
3. **Honest counts**:
   - *Before*: removing one identity provider with two people reads as three changes.
   - *Now*: it reads as one change, with its two people under it.

---

## User Stories

- [x] 1. As an administrator, I want Review & publish to list what the draft changes, so that I know what I publish.
- [x] 2. As an administrator, I want a warning when a publication takes access away, with who loses what, so that I do not cut an agent off by mistake.
- [x] 3. As an administrator, I want each warning line to name the deny reason that the calls will get, so that I recognize it later in Investigate.
- [x] 4. As an administrator, I want a changed rule to show its sentence before and after, so that I see what the rule now asks.
- [x] 5. As an administrator, I want the people of a removed identity provider under the provider, counted once, so that one action reads as one change.
- [x] 6. As an administrator, I want added, removed and changed rows marked in the Draft view, so that I see my edits where I made them.
- [x] 7. As an administrator, I want a removed row to stay visible until I publish or discard, so that I can still see what I took out.
- [x] 8. As an administrator, I want the draft at the top of the history, so that I read unpublished changes the same way as published ones.
- [x] 9. As an administrator, I want to publish from the history with a short confirmation, so that I do not review the same list twice.
- [x] 10. As an administrator, I want the history to say why revision numbers skip, so that I do not look for a missing revision.
- [x] 11. As an administrator, I want a revision with the same access to say what stayed the same, so that I know the history is not broken.

---

## Architecture Gate

- Admin only. The diff, the losses and their texts are computed in the browser from the draft and the published document that the editor holds, and from the revision snapshots of the history (Backend 038). No backend change.
- Keep the feature in `src/features/access/delegation/`. Split a file that nears 300 lines.
- **Ubiquitous terms**: identity provider, who can delegate, servers and tools, allowed values, rule, draft, published revision, effective revision. "Loss of access" is a presentation term of this screen, not a domain term.

---

## Prototype

Visual reference: [`specs/prototypes/064-2026-11-24-revision-review/`](prototypes/064-2026-11-24-revision-review/), page `/prototype/revision-review`, approved by the user on 2026-11-27. The page draws the whole Access page with refunds-assistant open on Delegation and access (agent list, agent header, views, filters, section bar, Graph and List views, publication bar), so each change reads against the real screen. The Graph view follows the geometry of the real graph and does not pan, zoom or move boxes. Two prototype switches pick the scenario ("Remove an identity provider"; "Change a rule, add a tool, remove a person") and the screen: **Today** draws the same data as the Admin of today (no marks, the inline review step, a flat history diff), **Proposed** draws this specification.

Changes during the layout review: the first prototype drew only the tables and the bar, and the user could not tell where it came from, so it was redrawn as the whole screen; the Today / Proposed switch was added so that the change reads against today; the history button of the draft was renamed from Review & publish to Publish and opens a short confirmation instead of the review panel; the warning, first written for one scenario only, became one line per change that takes access away, by the table of Solution item 2; the Graph view got the marks of the List view, with neutral dashed lines and one Unpublished chip on the canvas, after the user noted that a red line would read as a failure (a chip on each relation crowded the short relations of the tools).

### Backend dependencies

None. The prototype has no Waiting backend chip.

---

## Implementation Decisions

1. **The warning in three parts, each in its own file.** No message is built inside the diff or the components.
   - **The losses**: a pure module next to the revision diff. It takes the changes of the diff and returns the losses as data, not text: the type of loss (last identity provider, people, kinds, blocked person, tool, allowed value, rule, expiry), who loses, what is lost and the deny reason. A change that only gives access returns no loss.
   - **The texts**: one map with one entry per type of loss, in one file, as the deny reasons of Investigate are. Each entry is a small function from the fields of the loss to its line. A new case is one entry in the map and one rule in the module, with no chain of conditions. The deny reason texts come from the Investigate labels, not from copies.
   - **The warning**: one component that takes the losses, reads each line from the map and draws the "Access is lost" notice. It knows nothing of the diff. The review panel and the Publish confirmation of the history use it.
2. **One diff for every place.** The revision diff of Admin 032 becomes the only diff: the review panel, the history (draft and revisions), the row marks and the count of the publication bar read it. It gains what the lines need: a changed rule keeps its expression before and after, each read as a sentence with the rule sentence of the rule builder; a changed expiry keeps both dates; the delegations of an identity provider are grouped under its change, and a provider whose people changed reads as changed with the counts before and after; `blocked` is compared like the other sections. A record changes when its comparison key changes, the same key as the count of unpublished changes, so a provider that stays says what changed in it (kinds, expiry, consent or harness login). The count of the bar is the number of top-level changes; the current count of edited records is replaced.
3. **Marks from the diff.** The List view and the Graph view take the kind of each row, box and relation (added, removed, changed) from the diff of the draft against the published revision. A removed row or box is drawn from the published document; the graph layout places a removed box as if it were still there.
4. **The publication path does not change.** Publish in the review panel and in the history confirmation call the same publish action as today, with the note. A blocker of today (Harness login on without a group) disables both Publish buttons with the same text. A conflict keeps its message and Reload.
5. **The history knows the draft only from the editor.** The publication bar passes the draft and its changes to the history. The history opened from the Report-only notice gets no draft and shows only revisions.
6. **The copy of the prototype is the copy.** Wording changes are trivial and do not need a new decision. No product name in Admin copy.
7. **Design system only.** Reuse the side panel, dialog, notice, `mcp-badge`, history and `delegation-list` classes. No new visual tokens.

---

## Verification

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build`, then the functional test in the built-in browser on the demo instance.

---

## Acceptance Criteria

- [x] 1. Review & publish opens the review panel with the summary, the change list, the note, Back to the draft and Publish N changes; the inline review step of the bar is gone.
- [x] 2. Removing the only identity provider of an agent shows the warning "Access is lost" with the line of the last identity provider; adding a tool alone shows no warning.
- [x] 3. A draft with several losses shows one warning with one line per loss, in the order of the change list, for each type of the table of Solution item 2. Browser: people, tool, expiry, added rule; code inspection: blocked person, narrowed kinds, allowed value, changed rule.
- [x] 4. The people of a removed identity provider sit under it and the change counts once in the panel, in the history and in the publication bar.
- [x] 5. A changed rule shows its sentence before and after. Code inspection: the Admin has no in-place edit of a rule; added and removed rules show their sentence in the browser.
- [x] 6. The List view of the Draft marks added, removed and changed rows; a removed row stays struck through with Open only; the Graph view marks the same boxes and dashes their relations in the neutral colour, with one Unpublished chip on the canvas; the Published view has no marks.
- [x] 7. The history opened from the publication bar shows the draft first with its change list and Publish; Publish opens the confirmation with the warning and the note, and publishes.
- [x] 8. The history opened from the Report-only notice shows no draft. Code inspection: no agent of the demo is in Report-only.
- [x] 9. The history shows the numbering note, and a revision with the same permission document names what stayed the same. The second part by code inspection: no such revision in the demo history.
- [x] 10. A blocker disables Publish in the review panel and in the history confirmation.
- [x] 11. The losses, their texts and the warning live in three separate files; the deny reason texts are read from the Investigate labels.
- [x] 12. Functional test: [064-2026-11-24-revision-review](functional-tests/064-2026-11-24-revision-review.md).
- [x] 13. `npm run check` and `npm run build` pass.

---

## Out of Scope

- The policy simulation of the open roadmap (replay of recent calls against the draft). Without it, a rule line says "can be denied".
- A warning for changes that only give access.
- Any backend change.

---

## Further Notes

A revision can have the same permission document as the one before it. This specification names what stayed the same; it does not show changes outside the permission document.
