# Specification: Relation Side Panel and Rules Only

- **Specification ID**: 048
- **Date**: 2026-11-06
- **Slug**: relation-side-panel
- **Status**: Waiting Approve
- **Owner**: Admin — Access, Delegation and access
- **Related Specification**: [026 — Agent Delegation Editor](026-2026-10-31-agent-delegation-editor.md)
- **Related Specification**: [027 — Tool Resource Mapping Review](027-2026-10-31-tool-resource-mapping-review.md)
- **Related Backend Specification**: Backend 031 — PDP Relation Checks and Call Conditions (`backend/specs/031-2026-10-31-pdp-relation-checks-and-call-conditions.md`)
- **Related Backend Specification**: Backend 033 — Agent Permission Administration and Tuple Publication (`backend/specs/033-2026-10-31-agent-permission-administration-and-tuple-publication.md`)
- **Related Backend Specification**: Backend 009 — Trusted API Attribute Sources (`backend/specs/009-2026-10-26-trusted-api-attribute-sources.md`)
- **Superseded in part**: [026](026-2026-10-31-agent-delegation-editor.md) (the relation editor column, the Resources section, Add resource and the resource nodes of the graph), [027](027-2026-10-31-tool-resource-mapping-review.md) (the concrete resource choice of the Resource editor)
- **Visual reference**: layout prototype at `/prototype/relation-side-panel` (`specs/prototypes/048-2026-11-06-relation-side-panel/`). Fixed data. It is the visual specification of this screen.

---

## Context & Background

Admin 026 delivered the Delegation and access editor of an agent: a graph of who can delegate → agent → server and tools → resources, with the editor of the selected node or edge in a column next to the graph. Admin 027 added the review of the resource mapping of a tool in Integrations.

On 2026-11-06 the user and the agent iterated the layout in the prototype of this specification and decided the domain changes below. The canonical names are in `backend/docs/authorization-domain-model.md` and in `backend/PRODUCT.md`, sections 3 to 6.

The backend does not change. It keeps allowed values (`resource#can_act_on`), the COAZ projection of `resource` and instance limits. Only the Admin stops offering them, for the reasons recorded in `backend/PRODUCT.md` section 6 ("Not used in the Admin for now").

---

## Problem Statement

### 1. The relation editor competes with the graph

The editor column sits next to the graph and shrinks it. A design-system `SidePanel` exists for this.

### 2. Three mechanisms look like one

The tool editor shows Resource mapping, Resources and Rules side by side. Allowed values only check a list of exact values, which a rule does (`order_id in ["1001", "1002"]`); their parameter belongs to the tool, so choosing it in one agent denies every other agent that calls the tool and has no values. Instance limits are set by the agent instance itself and are checked one call at a time, so they are not a control of the administrator. Harness login sends no limits.

### 3. Internal names in the screens

"Resource", "Resource mapping", "call conditions", "relation", "Add a check", "Required bindings" and "Generated CEL" are internal or repeated words.

---

## Solution

### Side panel

1. A click on a node or an edge of the graph, on a row of the List view, or on a section button opens the editor in the design-system `SidePanel` on the right edge of the window. The graph keeps its full width.
2. A panel opened from another panel (the Identity providers list, the agent panel) shows **Back to <title>** at the top. A panel opened from the graph or the list has no Back.
3. The `SidePanel` title accepts content, not only text (`title: ReactNode`), so that the tool panel can show a path with icons.

### Tool panel (agent · server · tool edge)

4. Title: the path `[agent icon] <agent> → [server icon] <server>` on the first line and `[tool icon] <tool>` always on the second line. No eyebrow, no separate Server section.
5. Sections, each with a divider and a bold title of the body size: **Expires**, then **Rules**, then a footer.
6. **Expires** is a select with **Never** and **On a date**. Choosing On a date shows a date input with today + 90 days and opens its calendar at once. An info `Notice` below says what happens:
   - Never: "<agent> can call <tool> until you remove it."
   - On a date: "After this day (UTC), <agent> can no longer call <tool>. Its calls are denied."
7. **Rules** (help icon: what a rule is, what it reads, every rule must pass):
   - each rule is a card with its name and its expression in grey monospace; a rule that is not published shows the chip **New in draft**; the card has only Remove;
   - **No rules.** when the tool has none;
   - a **Trusted attributes** box (help icon: facts about the subject or the object of the call from context sources; only a rule uses them; they belong to the tool, so every agent with a rule on it reads the same) lists each binding of the tool (source, Subject or Object of the call, attribute names), or "None on this tool.", and always ends with the link **Add trusted attributes in Context sources →**;
   - **Add rule**, a secondary button on the right, opens the rule editor at once.
   - the link leaves for Access › Context sources with the agent and the tool in the URL; that page shows a banner "Adding trusted attributes for <agent> · <tool>" with **Back to <agent> · <tool>**, which opens the panel of the tool again.
8. Footer: **Remove access** on the right (danger). Its confirmation says "<agent> can no longer call <tool>, and its rules on this tool are removed. The tool stays on <server> for other agents. The change goes into the draft."
9. The tool panel has no allowed values, no parameter choice and no Compare with a rule call to action.

### Rule editor

10. Order: **Name \*** (required, no placeholder; Add to draft stays disabled until it has text), "Allow the call when all / any of these are true:", the conditions, **Add a condition** on the right, the **Reads as** box, **Edit as CEL (advanced)**, then Add to draft and Cancel.
11. Each line of a rule is a **condition** (Add a condition, Remove this condition).
12. The operator **is one of** edits its values as an array: `[ 1001 × , 1002 × ]` and an input; Enter or a comma adds a value, a pasted list adds all, Backspace on an empty input removes the last. The stored value and the CEL do not change.
13. A condition compares with a typed value or, with **Compare with a trusted attribute**, with a trusted attribute of the same type. The link shows only when one exists. A condition never compares two call arguments.
14. **Reads as** is one line of running text on a grey surface, in the success color with a check icon, and joins conditions with **AND** or **OR** in capitals; a list reads `[1001, 1002]`.
15. The editor has no title, no Generated CEL, no instance limits field and no Required bindings line. The bindings that a rule needs are still computed and saved with it.

### Agent panel and lists

16. The agent node opens a summary panel: "These permissions apply to every instance of <agent> and to every subject that delegates to it.", the enforcement mode, who can delegate (one row per identity provider, opens its panel), the tools (server and rule count, opens the tool panel) and buttons to the Identity and Harness sessions views.
17. **Manage identity providers <n>** opens the panel of the identity provider when there is one, otherwise the Identity providers list (each row opens its panel; Add identity provider when an enabled one is left). **Manage tools** opens Add tools. The user icon of the section bar counts the subjects who delegate.
18. The section bar has no Allowed values section. The filter has no Expiring option, and its placeholder is "Filter by identity provider, subject or tool".
19. The agent tabs and the Graph / List and Draft / Published toggles share one row; the toggles show only on Delegation and access; Graph and List are icons with a tooltip.
20. The List view has no Allowed values section and no resource column; its Rules column counts rules.
21. The collapse button of the agent list sits on the gap between the list and the content, centered in the gap, open or collapsed.

### Graph

22. A tool node shows its rule count ("No rules", "1 rule", "3 rules"). There are no value nodes.
23. When a rule of a tool reads trusted attributes, a dashed edge goes from the tool to a **context source** node ("Context source · subject" or "· object of the call"), labelled **reads <attributes>** with only the attributes that the rules of that tool read (parsed from the saved expressions). A click on the node opens the panel of the first tool that uses it.

### How this works

24. The dialog shows three checks in order (delegation `no_delegation`, tool grant `no_grant`, rules `condition`), a "Rules are CEL" section with what a rule reads (call arguments, trusted attributes of the object of the call and of the subject), and examples where a list is a rule (`repository in [...]`).

### Design system

25. New `Notice` component (`src/components/ui/notice`) with `tone` `info` (Info icon, light blue), `warning` (TriangleAlert, light yellow) or `error` (CircleAlert, light red) and an optional bold title. The three surfaces have the same lightness. Info is `role="status"`, warning and error `role="alert"`. New tokens `--cp-admin-color-info` (#1d4f8f) and `--cp-admin-color-info-bg` (#deedff), `.cp-admin-notice--info` and `.cp-admin-notice-body` (regular body, bold title). Info says what happens after a choice and changes with it; a fixed explanation of a field is helper text, not a notice. Documented in `docs/design-system/components.md`, `tokens.md` and `preview.html`.

### Copy

26. The Access heading says "Choose who can delegate to each agent, the tools it can call and the rules of each call."
27. Investigate keeps the deny reason `no_resource` (the backend can still return it for a tool mapped in Integrations) and says "The value of the call is not one of the allowed values of the agent." instead of "The agent can not act on this resource."
28. Context sources says trusted attributes come from context sources; it never says "Trusted data for your policies" or "from your APIs".

---

## Resolved Decision 1: the resource editor of Integrations (user, 2026-11-06)

Admin 027 lets an administrator give a tool a concrete resource mapping in Integrations. With this specification the Admin can no longer add allowed values, but the backend still denies every call to a mapped tool by an agent without values (`no_resource`). A mapping saved in Integrations would block every agent with no way to fix it in the Admin.

Decided: **hide the concrete resource choice in Integrations.** The Resource editor of Admin 027 keeps the COAZ mapping but offers only "no resource" (`type: "tool"`) for a new or changed mapping. A tool that already has a concrete resource shows a warning `Notice` in Integrations and in its Access panel: every agent that calls it without allowed values is denied, and the Admin can no longer add them; the administrator can set it back to no resource. The backend does not change.

Not chosen: keeping Integrations as it is, which leaves a mapping that blocks every agent with no fix in the Admin.

---

## User Stories

- [ ] 1. As an administrator, I want the editor of a relation in a side panel, so that the graph keeps its full width.
- [ ] 2. As an administrator, I want one way to limit a tool, rules, so that I do not choose between three mechanisms.
- [ ] 3. As an administrator, I want to see which context sources the rules of a tool read, so that I know which customer API a decision depends on.
- [ ] 4. As an administrator, I want a new rule marked as draft, so that I know it does not apply before I publish.
- [ ] 5. As an administrator, I want a list of values edited as an array, so that I see each value at once.
- [ ] 6. As an administrator, I want "Remove access" to say what it does, so that I do not think the tool is deleted from the server.

---

## Implementation Decisions

1. Promote the prototype copies into `src/features/access/delegation` and remove the replaced code: the tool panel, the agent panel, the Identity providers list, the side panel routing and Back, the Expires select, the rule editor and rule builder changes, the filter, the section bar, the list view and the graph help. The prototype folder is the reference until then.
2. The graph post-processes `delegationLayout` instead of changing its four-column contract: the layout receives the document without resources and mappings, tool subtitles become rule counts, and context source nodes take the fourth column, 150 px further right so that edge labels fit.
3. The context source edges use the existing `conditions[].bindings` and parse `chokepoint["<binding>"].values["<name>"]` from each expression. No new API.
4. "New in draft" compares rule IDs of the draft with the published document of the same tool.
5. The `Notice` component and the info tokens live in the design system; `.relation-field > div.cp-admin-notice` keeps the flex layout inside fields.
6. No backend contract changes. Allowed values and instance limits in an existing document are kept when the Admin saves it; the Admin only stops showing and creating them.

---

## Testing Decisions

- Type check and production build pass.
- Browser checks on the demo instance (functional tests in `specs/functional-tests/`): each node and edge opens its side panel; Back appears only from another panel; Expires opens the calendar on On a date; a new rule shows New in draft and Publish clears it; is one of edits an array; Compare with a trusted attribute appears only with a binding of the same type; a tool whose rule reads a binding draws the labelled edge; Remove access confirms and removes the grant in the draft; the collapse button sits on the gap.
- Regression: an existing document with resources or limits keeps them after a save and publish from the Admin.

---

## Acceptance Criteria

- [x] 1. Every node, edge and list row opens the `SidePanel`; the editor column is gone.
- [x] 2. The tool panel matches items 4 to 9; no allowed values or instance limits are shown or created.
- [x] 3. The rule editor matches items 10 to 15.
- [x] 4. The agent panel, section bar, filter, tabs row, list and collapse button match items 16 to 21. (The collapse button was measured in the prototype, not on the branch: functional test S8.)
- [ ] 5. The graph shows rule counts and labelled context source edges (items 22 and 23). Rule counts seen on the demo; the labelled edge needs a rule that reads a binding, not published on the demo yet (functional test S7, not run).
- [x] 6. How this works matches item 24.
- [x] 7. The `Notice` component, tokens and docs exist (item 25).
- [x] 8. The copy of items 26 to 28 is in place; no screen of the Admin says "Resource mapping", "Resources", "call conditions" or "trusted attributes from your APIs".
- [x] 9. Resolved Decision 1 is applied: Integrations offers only no resource for a new or changed mapping, and a tool with a concrete resource shows the warning. (The warning was checked by code inspection; no Acme tool has a concrete resource.)

---

## Out of Scope

- Any backend change. Allowed values, the COAZ `resource` projection and instance limits stay in the backend.
- Editing a saved rule (the user kept Remove only, 2026-11-06).
- Limits that count across calls or that the administrator sets.
- Delegation by directory group (future, OpenFGA userset).
- The public site and its documentation (frontend), which follow in their own specification.

---

## Further Notes

- Several rules equal one rule whose conditions are joined by AND. The user kept several rules because the deny names the rule that failed and one part can be removed alone.
- Allowed values have no hierarchy today (`resource#parent` is declared and never written; `can_act_on` does not inherit). They may return with a hierarchy.
- The prototype also carries Identity and Harness sessions with the real components over a pre-filled query cache; they do not change in this specification.
