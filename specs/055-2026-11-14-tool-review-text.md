# Specification: Tool Review Text

- **Specification ID**: 055
- **Date**: 2026-11-14
- **Slug**: tool-review-text
- **Status**: Waiting Approve
- **Owner**: Admin / MCP integrations
- **Related Specification**: [Backend 047 — Protocol setup without bypass](../../backend/specs/047-2026-11-03-protocol-setup-without-bypass.md), [Backend 088 — Automatic tool rediscovery](../../backend/specs/088-2026-11-13-automatic-tool-rediscovery.md)
- **Related Mock Contract**: none
- **Visual Reference**: [prototype folder](prototypes/055-2026-11-14-tool-review-text/), pages `/prototype/tool-review` (Custom MCP) and `/prototype/enterprise-review` (Enterprise MCP) (Active)

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
6. **Removed tools** are in a Removed group of the list, with a Removed badge and the state Disabled. Their detail opens with an info `Notice`: the server no longer returns the tool, it stays disabled, agents cannot call it and there is nothing to decide; below it, the text that was last approved. A removed tool needs no decision, as in today's dialog.
7. **A tool whose server went back to the approved contract** (Backend 091) has no change rows; its detail shows an info `Notice` that nothing changed since the approval and that the tool stays disabled until a decision. It keeps the Trust this change and Keep disabled buttons.
8. **The Server item** says Not sent to agents in the list. Its detail opens with an info `Notice` (design system) that says that nothing in it reaches agents, whatever the text says, and that there is nothing to decide; the `instructions` and the server identity (`serverInfo` name and version) each carry a Not sent to agents badge. Agents get the server name from the registry (Backend 047).
9. **Enterprise MCP** (user decision, 2026-11-15: one page for both kinds). The review of an Enterprise MCP (GitHub) uses the same page and replaces `src/features/mcp/enterprise/EnterpriseReview.tsx`. Its heading shows the provider mark, "<provider> · Enterprise MCP" and "Connected as <account>", with the note that calls use this account and that agents still need published tool permissions. The backend compares and confirms both kinds the same way (`Compare`, `mcpApi.confirm`), so the decisions, the diff and Backend 091 apply as they are. Layout approved on `/prototype/enterprise-review` (2026-11-15).
10. **Bulk approval of read-only tools**, for a server with many tools (the GitHub MCP server has about 80 tools in 23 toolsets, [DEV Community](https://dev.to/nishilbhave/github-mcp-server-setup-use-cases-and-limits-2026-99d); gateways approve read-only tools apart from write ones, [Runbear](https://docs.runbear.io/administration/tool-approvals), [TrueFoundry](https://www.truefoundry.com/docs/ai-gateway/mcp/mcp-tool-management)). Next to To review, "Approve N read-only" approves at once every new tool whose `readOnlyHint` annotation is true and that has no decision yet; write and destructive tools still need one decision each. It applies to both kinds. Approved (2026-11-15).
11. Nobody edits the text of a tool, and nothing is detected automatically. A future evaluator that marks risky text is out of scope.

## Implementation Decisions

Decided with the user on 2026-11-15, after reading how the backend detects a change (`backend/internal/mcpregistry/review.go`, `Compare`): every discovery, manual or automatic every 15 minutes (Backend 088), compares the saved contract of each tool with the discovered one by JSON value; a different contract makes the tool `changed`, disables it and keeps the saved contract in `previous` and the discovered one in `contract`. The backend says that a tool changed, not what changed.

1. **The field diff is computed in the Admin**, from `previous` and `contract`, which the server details already return. No API change. The Inbox item keeps saying that tools changed, without the fields.
2. **What counts as a change**, by JSON path of the contract:
   - the text that the model reads, each shown with a removed row (−) and an added row (+): `description`, `title`, and the `description` of each parameter at any depth of `inputSchema` (nested `properties`, array `items`, `$defs`);
   - a parameter added or removed, and a change of its `type` or of whether it is `required`, each as one row;
   - every other difference (`annotations`, `outputSchema`, `_meta`, `icons` or any other key) grouped in one row, Other fields changed, with the JSON of both versions.

   The count of the summary ("~N changed") is the number of changes: a text change shows two rows (− and +) and counts once. On the prototype, `refund_order` shows the four kinds: the description, the type of `amount`, the new parameter `notify_url` and Other fields (`annotations`).
3. **No normalization of the text before the comparison.** A description that carries a value that changes by itself (a date, a version) makes the tool `changed` at every rediscovery, so it stays disabled and raises Inbox items. Ignoring part of the text would open a gap exactly where an order is hidden, and no real server with this behavior is known. Known risk, to decide when a case appears.
4. **"Changes since you approved it" needs the approved contract.** Today a second change before the review overwrites `previous` with the pending contract that nobody approved. The backend fix is a dependency (below).

5. **The Inbox opens the review with the tool already open** (user decision, 2026-11-15). The `tool-discovery` item stays one item per server with its counts (Backend 088, `discovery_signal.go`: `TargetParams` has `server_id` and `connection_type`, no tool). Its Review action opens the Review discovered tools page of that server instead of the server in Integrations. The page reads the stored server and opens the detail of the first tool that needs a decision (`changed` or `removed`); the others are in To review. No backend change.

6. **One page, two entries, no branch by kind inside the page.** One page component receives the tools, a ready heading and the confirm function; it knows nothing of the server kind. Two thin entries, `CustomToolReview` and `EnterpriseToolReview`, each load their data (the stored server or the discovery preview; the OAuth preview of `enterpriseApi.preview`), build their heading and pass them to the page. The route chooses the entry, as `MCPRegistry` does today. Something only one kind needs later goes into its entry.

7. **Review coverage opens the review at the exact tool** (user decision, 2026-11-15). In the Review coverage table (`src/features/mcp/ToolReviewCatalog.tsx`, reached from the Tools reviewed metric of the Overview), the Open tool action of a tool marked Needs review opens the review page of its server with that tool open, for both kinds. A reviewed tool keeps opening the server details in Integrations. No backend change: the row already has the server and the tool name.

8. **Found by the functional test and fixed**: the diff compares canonical JSON with sorted keys, because the stored contract (PostgreSQL jsonb) lists its keys in another order than the discovered one; and the progress reads Nothing to decide when no tool needs a decision.
9. **Enable server after review** stays on the page for an existing server that is disabled (the old dialog had it; the review is where a disabled server is enabled again). It is the only control that the prototype did not show.
10. **Discovery once per visit.** Each entry runs its discovery as a query without an abort signal, so the double mount of React StrictMode shares one request and never cancels a discovery that the backend already stores.

## Backend dependencies

- [ ] [Backend 094 — Manual Discovery of an Enterprise MCP with the Stored Credential](../../backend/specs/094-2026-11-15-enterprise-discovery-stored-credential.md): the review page of an Enterprise MCP gets its preview from a discovery with the stored credential, as the automatic rediscovery does, so it opens from the Inbox and from Review coverage without an OAuth authorization (user decision, 2026-11-15). Today the backend refuses a manual discovery of an Enterprise MCP, and a preview only comes from a new OAuth authorization.
- [x] [Backend 091 — Keep the Approved Tool Contract Across Repeated Changes](../../backend/specs/091-2026-11-15-keep-approved-tool-contract.md): `previous` keeps the last approved contract while a tool stays `changed`, so the review compares with what was approved. Resolved: Backend 091 is Implemented (2026-11-15); the `Waiting backend · 091` chip was removed from the prototype.

## Acceptance Criteria

- [x] 1. The user approves the layout on the prototype (2026-11-15), including the removed tool, the tool whose server went back to the approved contract and the full field diff (Custom MCP page).
- [x] 2. The user approves the Enterprise heading and the bulk approval of read-only tools on the prototype (2026-11-15).
- [x] 3. Before the merge to `main`, the public documentation in `frontend/content/docs`, in `en` and `pt-BR`, describes the implemented screen:
  - `platform/mcp-servers/tool-review.mdx`: the review page (list and detail), the decisions (Approve and Deny, Trust this change and Keep disabled), "Changes since you approved it" (Backend 091), the reviewer guide with its OWASP entries, and that nobody edits the text of a tool;
  - `platform/mcp-servers/server-details.mdx`: the review is a page, not a dialog;
  - `platform/mcp-servers/custom-servers.mdx` and `platform/mcp-servers/enterprise-servers.mdx`: the review step after a discovery;
  - `platform/operations/inbox.mdx`: the Review action of a tool discovery item opens the review page with the first pending tool open.

- [ ] 4. Functional test: [055-2026-11-14-tool-review-text](functional-tests/055-2026-11-14-tool-review-text.md). S1 to S6 passed on 2026-11-15 (Custom MCP: changed, removed, server, trust and confirm, Inbox, Review coverage, new server with bulk approval and denial, disabled server enabled again). **S7 (Enterprise MCP) is blocked**: there is no GitHub App and no Enterprise MCP locally, and connecting one needs a real GitHub App and OAuth. Backend 094 is covered by unit tests.
- [x] 5. `npm run check` and `npm run build` pass.

Evidence of criterion 3: the five pages, in `en` and `pt-BR`, are on the frontend branch `docs/055-tool-review-page` (commit `ce5c638`), checked on the frontend development server (each page answers 200 with the new text). They are published with the merge of this specification.

## Out of Scope

- Editing the text of a tool.
- Automatic detection of risky text.
- Review of the result of a tool call.
