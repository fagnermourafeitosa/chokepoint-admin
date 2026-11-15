# Specification: Tool Review Text

- **Specification ID**: 055
- **Date**: 2026-11-14
- **Slug**: tool-review-text
- **Status**: Not Implemented
- **Owner**: Admin / MCP integrations
- **Related Specification**: [Backend 047 — Protocol setup without bypass](../../backend/specs/047-2026-11-03-protocol-setup-without-bypass.md), [Backend 088 — Automatic tool rediscovery](../../backend/specs/088-2026-11-13-automatic-tool-rediscovery.md)
- **Related Mock Contract**: none
- **Visual Reference**: [prototype folder](prototypes/055-2026-11-14-tool-review-text/), page `/prototype/tool-review` (Active)

---

## Context & Background

The Review discovered tools dialog lists each tool with its title, name, description and annotations. The parameters, with their descriptions, and the comparison of a changed tool with its approved version are only in the collapsed "Contract and metadata" JSON. The server `instructions` are only in the "Server discovery metadata" JSON. Agents get the reviewed definition stored in the registry (Backend 047), without the server `instructions`, name or version; nobody edits the text of a tool: the reviewer approves or denies it (user decision, 2026-11-14).

## Problem Statement

### 1. The reviewer does not see the whole text that the model reads

An order hidden in a parameter description, or added to a description after approval, is only visible in raw JSON. The reviewer can miss it.

### 2. The reviewer has no guidance about the risk

Nothing tells the reviewer what to look for, or where the risk is documented.

## Solution

Approved by the user on the prototype on 2026-11-15. The layout follows the list-detail pattern ([SAP](https://www.sap.com/design-system/hcm/patterns/structure-and-layout/master-detail/usage), [Microsoft](https://learn.microsoft.com/dual-screen/design/list-detail)): the list shows each item and its state, the detail shows the item and holds its actions; buttons name the action and the object ([Oracle](https://www.oracle.com/webfolder/ux/mobile/pattern/masterdetail.html)); a change is reviewed as the old next to the new, and declining keeps the current state ([GitHub Apps](https://docs.github.com/en/apps/using-github-apps/approving-updated-permissions-for-a-github-app)).

1. **A page of its own** (user decision, 2026-11-14) replaces the preview step of the dialog: a back link to Integrations, the server name, the title "Review discovered tools" and a progress bar "N of M decided".
2. **The list** (left, behind a vertical divider) has three groups: To review (new and changed tools, each with its New or Changed badge and its decision state: To review, Approved, Denied, Change trusted or Kept disabled), Server (instructions and identity) and a collapsed group of unchanged tools, which need no decision. There are no checkboxes. The item under review uses the selected row color of the design system (`--cp-admin-color-row-selected`), hover uses `--cp-admin-color-row-hover`, the divider uses the separator color (`--cp-admin-color-border`), and the progress bar is the coverage meter of the Overview.
3. **The detail** (right) shows the text that the model reads, without JSON: the description, each parameter with its type, whether it is required and its description, and the annotations. For a changed tool, a warning `Notice` says that it stays disabled until a decision, and the changes use the diff of the revision history (design system, `history-summary`, `history-count`, `history-diff`): a summary "Changes since you approved it" with its count, then, for the description and each changed parameter, a removed row (−, the approved text) and an added row (+, the discovered text). Unchanged parameters follow as plain fields.
4. **The decision** is in the detail, with buttons that name the action and the tool, with the design system hierarchy (the ink primary for Approve and Trust this change, the secondary for Deny and Keep disabled; Deny opens no confirmation, so it is not `danger-soft`): Deny `<tool>` and Approve `<tool>` for a new tool; Keep `<tool>` disabled and Trust this change for a changed tool. After a decision, the detail moves to the next tool to review. Confirm review, in the footer next to Cancel, is enabled when every new and changed tool has a decision; the footer has no count text.
5. **A "Before you decide" guide** in the design system accordion (`cp-admin-accordion`), closed by default, with a warning icon at the start of its header, sits above the decision. It lists what to look for, each with its entry of the OWASP Top 10 for Agentic Applications 2026 and the printed page where the entry starts: an order to the model in the description or a parameter (ASI04, p. 18), a request to call another tool or send data or secrets elsewhere (ASI02, p. 12), and, for a changed tool, a change with no known reason (ASI04, p. 18). The link opens [the official page of the list](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) in a new tab (user decision, 2026-11-14): the download link of the document does not open from outside the site, so it cannot carry `#page`. OWASP classes a malicious tool description sent by an MCP server as ASI04 ("Tool-descriptor injection", "Compromised MCP / Registry Server"); ASI02 covers the misuse of a legitimate tool.
6. **The Server item** says Not sent to agents in the list. Its detail opens with an info `Notice` (design system) that says that nothing in it reaches agents, whatever the text says, and that there is nothing to decide; the `instructions` and the server identity (`serverInfo` name and version) each carry a Not sent to agents badge. Agents get the server name from the registry (Backend 047).
7. Nobody edits the text of a tool, and nothing is detected automatically. A future evaluator that marks risky text is out of scope.

## Implementation Decisions

Decided with the user on 2026-11-15, after reading how the backend detects a change (`backend/internal/mcpregistry/review.go`, `Compare`): every discovery, manual or automatic every 15 minutes (Backend 088), compares the saved contract of each tool with the discovered one by JSON value; a different contract makes the tool `changed`, disables it and keeps the saved contract in `previous` and the discovered one in `contract`. The backend says that a tool changed, not what changed.

1. **The field diff is computed in the Admin**, from `previous` and `contract`, which the server details already return. No API change. The Inbox item keeps saying that tools changed, without the fields.
2. **What counts as a change**, by JSON path of the contract:
   - the text that the model reads, each shown with a removed row (−) and an added row (+): `description`, `title`, and the `description` of each parameter at any depth of `inputSchema` (nested `properties`, array `items`, `$defs`);
   - a parameter added or removed, and a change of its `type` or of whether it is `required`, each as one row;
   - every other difference (`annotations`, `outputSchema`, `_meta`, `icons` or any other key) grouped in one row, Other fields changed, with the JSON of both versions.

   The count of the summary ("~N changed") is the number of rows.
3. **No normalization of the text before the comparison.** A description that carries a value that changes by itself (a date, a version) makes the tool `changed` at every rediscovery, so it stays disabled and raises Inbox items. Ignoring part of the text would open a gap exactly where an order is hidden, and no real server with this behavior is known. Known risk, to decide when a case appears.
4. **"Changes since you approved it" needs the approved contract.** Today a second change before the review overwrites `previous` with the pending contract that nobody approved. The backend fix is a dependency (below).

5. **The Inbox opens the review with the tool already open** (user decision, 2026-11-15). The `tool-discovery` item stays one item per server with its counts (Backend 088, `discovery_signal.go`: `TargetParams` has `server_id` and `connection_type`, no tool). Its Review action opens the Review discovered tools page of that server instead of the server in Integrations. The page reads the stored server and opens the detail of the first tool that needs a decision (`changed` or `removed`); the others are in To review. No backend change.

## Backend dependencies

- [ ] [Backend 091 — Keep the Approved Tool Contract Across Repeated Changes](../../backend/specs/091-2026-11-15-keep-approved-tool-contract.md): `previous` keeps the last approved contract while a tool stays `changed`, so the review compares with what was approved.

## Acceptance Criteria

- [x] 1. The user approves the layout on the prototype (2026-11-15).
- [ ] 2. Before the merge to `main`, the public documentation in `frontend/content/docs`, in `en` and `pt-BR`, describes the implemented screen:
  - `platform/mcp-servers/tool-review.mdx`: the review page (list and detail), the decisions (Approve and Deny, Trust this change and Keep disabled), "Changes since you approved it" (Backend 091), the reviewer guide with its OWASP entries, and that nobody edits the text of a tool;
  - `platform/mcp-servers/server-details.mdx`: the review is a page, not a dialog;
  - `platform/mcp-servers/custom-servers.mdx` and `platform/mcp-servers/enterprise-servers.mdx`: the review step after a discovery;
  - `platform/operations/inbox.mdx`: the Review action of a tool discovery item opens the review page with the first pending tool open.

## Out of Scope

- Editing the text of a tool.
- Automatic detection of risky text.
- Review of the result of a tool call.
