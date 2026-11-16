# Specification: Tool Trifecta Levels

- **Specification ID**: 058
- **Date**: 2026-11-15
- **Slug**: tool-trifecta-levels
- **Status**: Implemented
- **Owner**: Admin / MCP integrations
- **Related Specification**: [Backend 097 — Session Rules (Lethal Trifecta)](../../backend/specs/097-2026-11-15-session-rules-lethal-trifecta.md), [055 — Tool Review Text](055-2026-11-14-tool-review-text.md), [057 — Tool Review History and Remembered Denials](057-2026-11-15-tool-review-history.md)
- **Related Mock Contract**: none
- **Visual Reference**: [prototype folder](prototypes/058-2026-11-15-tool-trifecta-levels/), pages `/prototype/tool-trifecta` (review page) and `/prototype/tool-trifecta-integrations` (Custom MCPs list)

> **Approved** by the user on 2026-11-15, with the layout of the review page (`/prototype/tool-trifecta`) and of the Custom MCPs list (`/prototype/tool-trifecta-integrations`).

---

## Context & Background

Backend 097 gives each tool a level for each leg of the lethal trifecta (private data, untrusted content, external communication), set by a language model from the tool text, and raises a High signal in the Inbox when a call closes the three legs in one session; nothing is blocked by the trifecta (Backend 097, user decision 2026-11-15). Backend 097 Implementation Decision 4 lets an operator correct a level when the labeler is wrong. The review page (Admin 055, 057) is where the reviewer reads the tool text and decides it.

---

## Problem Statement

### 1. The reviewer cannot see the levels

The levels decide which calls raise the lethal trifecta signal, but no screen shows them.

### 2. A wrong level cannot be corrected

A level that is too low lets an exfiltration chain pass; a level that is too high raises signals on legitimate work.

---

## Solution

1. **Concept**: the lethal trifecta is the intersection of three legs, and only their result asks for attention (user, 2026-11-15). The section is a visual block of its own after the tool text, apart from the input schema: the muted surface (`color-surface-muted`), padding, no border (user, 2026-11-15). It has a **Lethal trifecta** label, preceded by a magnifier icon (`Search`) that marks it as the gateway's investigation of the tool (user, 2026-11-15), then the three legs side by side, each with its name and its level, and under it the meaning of that level for that leg, always shown, from the level definitions of Backend 097 Implementation Decision 8 (for example "Writes only to a fixed destination of the customer, chosen by the server." for Sends data out · Low). A fixed sentence repeated for every tool was rejected: the description follows the level (user, 2026-11-15). Each level is a colored chip (`mcp-badge`), one meaning per color: **OK** green (success) for no leg, **Low** yellow (warning), **High** red (danger) (user, 2026-11-15). The label of the `none` level is **OK**, because "None" read as an empty value (user, 2026-11-15); the backend value stays `none`. Under the legs, one muted line: "A model read the tool text and set these levels." followed by the link **Model is wrong?**. A correction is an exception, so it is a link in that line, not a button (user, 2026-11-15; the button "Correct a level" did not say what it does or why it exists). The link turns each level into a Select (OK, Low, High) and the line into "Pick the level that the text of this tool supports. Your level replaces the model's for this version of the tool and is kept in the review history; when the server changes the tool, the model labels it again." with the link **Done**. Earlier layouts were rejected: three Selects always open (a form), a line under the parameters (more schema), a white accordion, a muted line, and facts tiles (user, 2026-11-15).
2. **No shift when the page grows**: opening Before you decide made the page taller than the window; the scrollbar appeared and the top bar (logo and menu) moved sideways. The design system now always shows the vertical scrollbar (`overflow-y: scroll` on the document, `docs/design-system/styles/base.css`, documented in `layouts.md`) for the whole Admin (user, 2026-11-15). **Before you decide** uses the new design system variant `cp-admin-accordion--warning`. In the design system a callout is a Notice by default; a toned accordion (info, warning, danger) is optional, for a long body that can stay closed, with a chevron in the color of its tone that shows it opens; both without border (user, 2026-11-15). Before you decide: the warning background, without border, instead of the form surface; the white accordion read as a form field (user, 2026-11-15). The design system also drops the border of every toned Notice (info, warning, error, success): the background alone marks the tone. This applies to the whole Admin at once, since `docs/design-system/styles/controls.css` is the Admin stylesheet (user, 2026-11-15). The rule above the decision buttons is removed. Its guide gets one more item, linked to [The lethal trifecta for AI agents](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/), so the reviewer can learn what the lethal trifecta is: deny or check a tool that shows two High legs, because with another tool that brings the third leg it can send private data out after reading an injected instruction (user, 2026-11-15). This changes the review page of Admin 055.
3. **The result is the only alert**: a warning notice under the legs when two legs are High ("Two legs are High. In a session where another tool brings the third leg, the call that closes it raises a High signal in the Inbox.") and when the three are High ("This tool reads private data, brings untrusted content and sends data out. Every call to it closes the lethal trifecta and raises a High signal in the Inbox."). Nothing is blocked (user decision, 2026-11-15). With fewer than two High legs there is no alert. The decision stays the loud element of the review (sober design principles).
4. A level the reviewer changed shows **Corrected** under it, with **Undo** while correcting.
5. The leg names follow the open roadmap item: Reads private data, Brings untrusted content, Sends data out.
6. The section says that each level comes from what the tool text declares, not from what the server does. The gateway does not see the workload; neither does the market (Open Edison, Invariant Guardrails) nor FIDES, which trusts the tool owner to label (Backend 097 Implementation Decision 6) (user decision, 2026-11-15).
7. **Custom MCPs list** (`/prototype/tool-trifecta-integrations`, the list of Admin 057 that opens the review): a **Lethal trifecta** column between Managed tools and Status. **The evaluation is per tool** (user, 2026-11-15): the row counts the managed tools by their own result, as a chip with no tool names: red "1 tool is high" for tools with the three legs High (user's wording, 2026-11-15), yellow "2 tools are two legs high" for tools with two legs High (approved with the layout, 2026-11-15). When both apply, the red chip is above the yellow one; a row has at most these two (user, 2026-11-15). A server without such tools shows a green chip with the count of its managed tools, "9 tools OK" (user, 2026-11-15). A tool without usable levels (its labeling failed and nobody completed it, or it was not labeled yet) is never counted as OK: it shows in a neutral chip, "2 tools are failed" (implementation, 2026-11-15). The legs of different tools are never summed: that would mark a server red when no agent gets those tools together, and miss two OK servers that one agent combines. The Admin computes it from the levels of the tools of the server (Backend 097). The column header **Lethal trifecta** is a **Documentation link**, a new design system component (`cp-admin-docs-link`, documented in `docs/design-system/components.md`; its React component `DocsLink` is created at implementation): it ends with `ArrowUpRight` at 14 px, pointing to the upper right as on the public home, and opens the public documentation in a new tab (`target="_blank"`) (user, 2026-11-15).
8. **Public documentation, before merge**: a page of the public documentation (`frontend`) explains what the lethal trifecta is, how each tool gets its levels (a model reads the tool text; the reviewer can correct a level), how a call that closes the trifecta raises a signal, and how to read these screens, with screenshots of the review page and of the Custom MCPs list. The Lethal trifecta column header opens it in a new tab. Proposed path: `/docs/platform/mcp-servers/lethal-trifecta`, next to `tool-review`. It is not written yet; it must exist before this specification merges (user, 2026-11-15).
9. **Take the tour** moves to the bottom left corner of every Admin page, at the same height as the footer buttons (`--cp-admin-control-height`, normal button size instead of small) and on their line: on a page with a sticky footer of actions (the review page) the button is the first item of that footer, at its left end, so it shares the line of Cancel and Confirm review whether the footer is stuck or not; on other pages it is fixed at the bottom left (`bottom: var(--cp-admin-space-4)`), with a tour icon (`Route`) instead of the help icon (`CircleHelp`) (user, 2026-11-15). Real change at implementation: `.first-access-restart` and `.first-access-restart-button` in `src/features/onboarding/first-access.css` and the icon in `src/features/onboarding/FirstAccessTour.tsx`; the review footer drops the right padding that kept Confirm review clear of it (`.tr-footer` in `src/features/mcp/review/tool-review.css`). The prototype hides the real button and shows its own (`TourButton.tsx`).
10. **Icons of the server and of the tool** on the review page: the label above the title is the server name (`Acme Support`) after the `Server` icon, without "· Custom MCP" (user, 2026-11-15), and the title of the tool in the detail starts with the `Wrench` icon, as the server and the tool are shown elsewhere in the Admin (user, 2026-11-15).
11. **Labeler failure**: when the labeler failed for a tool, the Lethal trifecta block of the review shows **Failed** in place of the levels (user, 2026-11-15; Backend 097 Open Question 1). It shows a neutral-red **Failed** chip with "The model could not set the levels of this tool. The session check ignores it until its levels are set." and the link **Set the levels**, which opens the three Selects (implementation, 2026-11-15). Once the reviewer has set the three levels, the footer says "You set these levels; the model could not." with the link **Change**, and no leg shows "Corrected", since there is no model level to correct (user, 2026-11-15). A correction that a later model label agrees with is dropped when the tool is labeled, so it no longer shows "Corrected" (Backend 097). The leg name and its level chip stay on one line.
12. **Discovery wait**: while a discovery runs, which now includes the labeler calls, the review page shows the canonical design system Loader centered in the content area, with no border: three ink squares that light up in turn, and "Discovering the tools of {server}…" below (user, 2026-11-15).
13. **Inbox signal**: the signal type `lethal-trifecta` shows in the Inbox as **Lethal trifecta closed**, severity High, with the context agent, tool, count and people (first line the tool; second line the agent name, then "N calls" and "N people"; the backend names the agent, as for the Report-only signals), and the action **Open agent**, which opens the agent in Access (Backend 097 Implementation Decision 16; user decision, 2026-11-15, changed 2026-11-16). Investigate is the trail of the calls and shows nothing of the trifecta: no deny reason, no filter, no step (user decision, 2026-11-16). In the call detail the path reads Delegation, Agent, MCP server, Rules and Tool: the rules are checked before the call (user decision, 2026-11-16).

---

## User Stories

- [ ] 1. As a reviewer, I want to see the level of each trifecta leg of a tool while I review its text, so that I know what the gateway will count.
- [ ] 2. As a reviewer, I want to correct a wrong level and undo my correction, so that I am not bound to a mistake of the labeler.
- [ ] 3. As a reviewer, I want a warning when a tool has two or three legs High, so that I know when the levels change what happens to its calls.
- [ ] 4. As an administrator, I want the Custom MCPs list to count the tools of each server that are high or two legs high, so that I see where to look without opening each review.
- [ ] 5. As an administrator, I want the Lethal trifecta header to open the public documentation, so that I can learn what it means.

---

## Implementation Decisions

1. The review section and the list column reuse the design system: `mcp-badge` with the success, warning and danger tones for the levels and the list chips, `SelectMenu` for a corrected level, `Notice` (warning) for the result, the `Search` icon before the section label.
2. New in the design system with this specification: the Documentation link (`cp-admin-docs-link`, React `DocsLink` in `src/components/ui/docs-link`), the toned accordions (`cp-admin-accordion--info`, `--warning`, `--danger`) with their chevron, borderless toned Notices, and the always visible vertical scrollbar. The CSS and its documentation are already on `main` (`docs/design-system/styles/controls.css`, `base.css`, `components.md`, `layouts.md`); `DocsLink` is created at implementation.
3. The list column is computed in the Admin from the levels of the managed tools of each server; no new endpoint.

---

## Backend dependencies

- The three levels of each tool and their source in the tool of the discovery preview and of the server: [Backend 097](../../backend/specs/097-2026-11-15-session-rules-lethal-trifecta.md), Implementation Decision 4.
- Saving a correction, recorded in the review history: [Backend 097](../../backend/specs/097-2026-11-15-session-rules-lethal-trifecta.md), Implementation Decision 4.
- The label state `failed` of a tool: [Backend 097](../../backend/specs/097-2026-11-15-session-rules-lethal-trifecta.md), Open Question 1.
- The levels already present when the review page opens on a discovery preview: [Backend 097](../../backend/specs/097-2026-11-15-session-rules-lethal-trifecta.md), Implementation Decision 2 (labeling inside the discovery). The Admin has no labeling state: the existing "Discovering the tools of…" wait covers it.

---

## Testing Decisions

- `npm run check` and `npm run build`.
- Functional test in the built-in browser on the demo instance, recorded in `specs/functional-tests/058-2026-11-15-tool-trifecta-levels.md`.

---

## Acceptance Criteria

- [x] 1. The review detail of every tool shows the three levels and their source.
- [x] 2. A reviewer can correct a level and undo the correction before Confirm review.
- [x] 3. The review detail shows the warning notice when a tool has two or three legs High, and no notice otherwise.
- [x] 4. The Custom MCPs list shows, for each server, the red and yellow chips of its tools, or the green "N tools OK".
- [x] 5. The Lethal trifecta header opens the public documentation page in a new tab, and that page exists before the merge. Evidence (2026-11-16): `frontend/content/docs/{en,pt-BR}/platform/mcp-servers/lethal-trifecta.mdx`, listed after Tool review, with the screenshots `tool-trifecta.png` (new capture `tool-trifecta` of `dev-infra/demo-instance/screenshot.py`) and `custom-mcps.png` (recaptured with the column); the Inbox page lists the Lethal trifecta signal. Both locales render with their images on the development server. Not committed yet.
- [x] 6. Before you decide uses the warning accordion with its chevron and the lethal trifecta item; opening it moves nothing above it.
- [x] 7. Take the tour has the `Route` icon and sits at the bottom left, on the line of the footer buttons of the review page.
- [x] 8. Functional test: [058-2026-11-15-tool-trifecta-levels.md](functional-tests/058-2026-11-15-tool-trifecta-levels.md)

---

## Implementation Notes (2026-11-15)

Branch `feat/058-tool-trifecta-levels` (worktree `admin-058`).

1. Corrections stay in the review page and travel with Confirm review (`trifecta_corrections`, Backend 097 Implementation Notes 1).
2. By concept: `src/features/mcp/trifecta.ts` is the vocabulary of the lethal trifecta (legs, level names and colors, effective levels), shared by the review block `src/features/mcp/review/TrifectaLevels.tsx` and the list column in `ConnectionTable.tsx`; `DocsLink` is a design system component in `src/components/ui/docs-link`.
3. Take the tour renders into the `[data-tour-slot]` of the review footer through a portal, and is fixed at the bottom left elsewhere.
4. Investigate shows nothing of the trifecta, and its call path reads Delegation, Agent, MCP server, Rules and Tool; the Inbox lists the **Lethal trifecta closed** signal (High) with Open agent.
5. The design system files changed on `main` during the prototype were copied into the branch with the same content.
6. `npm run check` and `npm run build`: pass. Functional test passed on the demo (see the file).
7. At merge: remove the routes of the prototype from `src/features/prototype/PrototypePage.tsx` and mark it Archived in `specs/prototypes/README.md`.

---

## Out of Scope

- The `lethal-trifecta` signal and its Open agent target.
- MCP annotations as a source of the levels.
