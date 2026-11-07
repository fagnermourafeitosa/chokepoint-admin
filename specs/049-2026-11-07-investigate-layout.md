# Specification: Investigate Layout and Rules Read as Sentences

- **Specification ID**: 049
- **Date**: 2026-11-07
- **Slug**: investigate-layout
- **Status**: In Progress
- **Owner**: Admin — Investigate, Access
- **Related Specification**: [020 — Investigate Problems and Decisions](020-2026-10-29-investigate-problems-and-decisions.md)
- **Related Specification**: [030 — Investigate Agent, Subject and Token Exchanges](030-2026-10-31-investigate-agent-subject-and-token-exchanges.md)
- **Related Specification**: [048 — Relation Side Panel and Rules Only](048-2026-11-06-relation-side-panel.md)
- **Related Backend Specification**: Backend 031 — PDP Relation Checks and Call Conditions (`backend/specs/031-2026-10-31-pdp-relation-checks-and-call-conditions.md`)
- **Visual reference**: layout prototype in `specs/prototypes/049-2026-11-07-investigate-layout/`, with fixed data from the Acme demo instance. It is the visual specification of these screens:
  - `/prototype/investigate`: the Investigate list and the decision detail (items 1 to 13);
  - `/prototype/rules-panel`: the side panel of refunds-assistant · Acme Billing · refund_order in Access, with the Rules list (item 15).


---

## Context & Background

Admin 020 and 030 delivered Investigate: three views (By problem, All decisions, Token exchanges), filters, and the decision and token exchange inspectors. Admin 048 removed allowed values from the Admin: a rule checks the values of a call (`backend/docs/authorization-domain-model.md`, "Not used in the Admin for now"). The backend still records allowed values and the `no_resource` reason.

On 2026-11-07 the user reviewed Investigate in the prototype of this specification and decided the changes below. The backend does not change.

---

## Problem Statement

### 1. Rows repeat the obvious and use internal names

Each agent cell says "Verified agent" for every verified agent. The Resource column shows allowed values, a concept the Admin no longer has, and "No resource check" for every rule deny.

### 2. A rule deny does not say which rule failed

The list shows "A rule of this agent · server · tool was not met." The backend sends the expression of the failed rule (`condition` of a problem or a decision), but the list does not show it.

### 3. Rules are shown as CEL

The rule builder (`RuleBuilder.tsx`) writes CEL from clauses and reads the clauses as a sentence ("Reads as") while a rule is edited. A saved rule keeps only its name and its CEL, so the Rules list of the side panel (`ToolPanel.tsx`) and the decision inspector (`DecisionInspector.tsx`) print the CEL, for example `context.chokepoint.arguments["amount"] <= 500`. An administrator reads code instead of the rule.

### 4. The row action is not the Admin pattern

Each row ends in an arrow icon button in a column without a header. The Admin list pattern is an **Actions** column with a header, right aligned with its buttons.

---

## Solution

### List (By problem, All decisions)

1. The agent cell shows only the agent name. A second line shows only an exceptional state: "Deleted agent" or "Agent not found".
2. The **MCP server / tool** column shows the server with the `Server` icon and, under it, the tool with the `Wrench` icon (pattern of Context sources › Trusted attributes). The tool stays a filter link. The repeat line ("×3 in window · last …") stays under them.
3. The Resource column is replaced by a **Detail** column. For a rule deny (`condition` is set), it shows "Rule not met" and, under it, the failed rule read as a sentence (item 14). For other rows, it is empty.
4. The last column is **Actions**, with a header, right aligned. It holds a **View** button (`cp-admin-button--ghost --small`) that opens the detail. A click on the row still opens the detail.

### Token exchanges

5. The last column is **Actions** with **View**, as in item 4.

### Decision inspector

6. **Page.** The detail has no page title or description. **Back to the list** and **Quick incident** sit in one bar. The "Investigate" kicker above the page title is removed from the list and the detail. The card has no "Decision inspector" kicker: its header keeps the Inbox item badge and the decision time only, without the internal decision ID, and has no line under it.
7. **Path first.** The authorization path comes above the outcome, one dot per step: **Delegation** (subject → agent), **Agent**, **MCP server**, **Tool**, **Rules**. The PDP checks agent → tool once, so the dots are a reading of the recorded steps: Agent passes (a failed identity check shows as its own step); MCP server passes when the tool step was evaluated; Tool carries the capability state; Rules shows the name of the failed rule, for example "Refund up to 500". A `no_grant` deny shows Tool failed and Rules not evaluated.
8. **Title.** The outcome chip and the tool name, then the cause. A rule deny reads "Rule not met: <rule sentence>" (item 14), for example "Rule not met: amount is at most 500", with a help icon: "The values of the call and of the attribute sources are never recorded. The rule shows what was checked, not the value that failed." A would deny adds "The call ran because <agent> was in Report-only." Under it, **Open the rule** is the single primary action.
9. **Removed**: the Rules card (its name moves to the path, its sentence to the title, its action under the title), the "acted for" line, the "Repeated in this window" card and "Reads call arguments only".
10. **Facts.** Under the title, with no line above, two columns of label and value (label muted, value beside it); one column under 900px.
    - Left: Identity provider, On behalf of (name and subject ID), Agent (name and agent ID), MCP server (not "Server"), Tool.
    - Right: **Mode**, with help "The mode of the agent when the call was decided. Enforce blocks a denied call. Report-only lets the call run and records it as would deny."; **Reference**, as a neutral mono chip, with help "The code that the caller receives with a denied call. Paste it in Quick incident to open this decision." (a would deny shows "None: the caller was not refused"); **Permission revision**; **Decided at (UTC)**.
    - No Resource line.
11. **Decisions in this problem.** Title "Decisions in this problem · N denied" (the outcome word follows the decision). Under it, aligned with the title, "Same agent, server, tool, reason and result · window <start> – <end>". Each row shows the time, the subject and the reference code of the call (not the rule). A decision outside a problem shows "Repeated in this window · N" with the window line and no list.
12. **Would deny notice.** "Not blocked — The policy of this call denies it, but <agent> was in Report-only, so the call reached <server>. …".
13. **Copy.** Admin copy never names the product (user rule, 2026-11-07).

### Rules read as sentences (Investigate and Access)

14. A helper of the Admin converts the CEL that the rule builder writes back into clauses, and `ruleSentence` reads them, for example "amount is at most 500", "queue is tier-1", "dataset is one of [sales_daily, inventory]". When the CEL can not be converted (a rule written in **Edit as CEL (advanced)**, or any other shape), the screen shows the CEL (user decision, 2026-11-07).
    - **All or nothing.** When one clause of a rule can not be converted, the whole rule shows its CEL. A sentence never hides part of a rule (user decision, 2026-11-07).
15. The Rules list of the side panel of Access (`ToolPanel.tsx`, Conditions) shows each saved rule with its name and the sentence of item 14, in the **Reads as** style of the rule editor (Admin 048 item 14), instead of the CEL line. A rule that can not be read keeps its CEL line, for example a draft "Even amounts only" written as advanced CEL (`/prototype/rules-panel`).
16. The Detail column (item 3), the decision inspector (items 7 and 8) and the side panel (item 15) use the same helper.

---

## Practical Gains & Operational Outcomes

1. **Faster triage**:
   - *Before*: a rule deny says only that a rule was not met; the administrator opens each detail.
   - *Now*: the list says which rule failed, in plain words.

2. **One vocabulary**:
   - *Before*: Investigate shows allowed values and CEL; Access shows CEL.
   - *Now*: both screens read rules as the sentence of the rule editor; CEL shows only when it can not be read.

3. **Consistent lists**:
   - *Before*: an icon-only action in a column without a header.
   - *Now*: the Actions column of the other Admin lists.

---

## User Stories

- [ ] 1. As an administrator, I want to see which rule a call did not meet in the Investigate list, so that I can decide without opening each decision.
- [ ] 2. As an administrator, I want saved rules read as sentences in Access and Investigate, so that I do not read CEL.
- [ ] 3. As an administrator, I want the same row actions as in the other lists, so that the screens behave alike.

---

## Implementation Decisions

Agreed with the user on 2026-11-07.

1. **Branch**: `feat/049-investigate-layout`, from `main`, after the approval of this specification.
2. **Sentence helper (item 14)**: in `src/features/access/delegation/RuleBuilder.tsx`, next to `ruleCel` and `ruleSentence`. It is the inverse of `clauseCel`: it reads the CEL and returns the clauses, or nothing when it does not recognize the shape. `ruleSentence` reads the clauses with the fields of `ruleFields(catalog, serverId, tool)`; the catalog comes from `useCatalog()`. No backend change: the backend keeps sending the expression in `condition` and in the decision evidence.
3. **Access side panel (item 15)**: `ToolPanel.tsx`, `Conditions`: the `<code className="rule-expression">` becomes the sentence in `rule-sentence--read`, and stays CEL when the helper does not convert.
4. **Investigate list (items 1 to 5)**: `src/features/investigate/DecisionLists.tsx` (agent cell, Server and Wrench icons, Detail column instead of Resource, Actions column with View, also in the token exchange rows); `investigate.css` (grid columns and the Actions alignment); `Investigate.tsx` (no "Investigate" kicker; no page title in the detail).
5. **Decision detail (items 6 to 13)**: `DecisionInspector.tsx` (bar with Back and Quick incident, header, five-step path, title with "Rule not met", two columns of facts, would deny notice); it already uses `CatalogProvider` for the revision history, and the same provider serves the helper. `DecisionBreakdown.tsx` (title "· N denied", window line, reference code per row). `inspector.css` (two columns of facts).
6. **Prototype**: in the same change, remove the 049 routes from `PrototypePage.tsx` and mark the prototype Archived in `specs/prototypes/README.md`.
7. **To check before coding**: whether `CatalogProvider` in `DecisionInspector` loads the context sources in time for the sentence on the first render; whether the Detail column of the list, which has no provider today, needs the catalog or only the argument names.

---

## Testing Decisions

- Type check and production build pass.
- Browser checks on the demo instance (functional tests in `specs/functional-tests/`).

---

## Acceptance Criteria

- [ ] 1. The list matches items 1 to 4; Token exchanges matches item 5.
- [ ] 2. The decision inspector matches items 6 to 12.
- [ ] 3. A rule written by the builder reads as a sentence in the Detail column, the decision inspector and the side panel; a rule written as advanced CEL and a rule with one clause that can not be converted show their CEL (items 14 to 16).
- [ ] 4. No Investigate screen says "Resource", "Verified agent", "No resource check" or the product name.
- [ ] 5. Functional test: [049-2026-11-07-investigate-layout](functional-tests/049-2026-11-07-investigate-layout.md).
- [ ] 6. `npm run check` and `npm run build` pass.

---

## Out of Scope

- The token exchange inspector: not in the prototype yet.
- Showing the value of the argument that failed a rule: the backend does not record call values.

---

## Further Notes

- The demo instance writes its rules in the builder format (`context.chokepoint.arguments["amount"] <= 500`), so they read as sentences. The rules are "Refund up to 500", "Tier-1 queue only" and "Sales and inventory only".
- The prototypes keep the sentences in their fixed data; the helper of item 14 is implementation work.
