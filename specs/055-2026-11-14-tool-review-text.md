# Specification: Tool Review Text

- **Specification ID**: 055
- **Date**: 2026-11-14
- **Slug**: tool-review-text
- **Status**: Proposed
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

Proposed on the prototype. None is approved yet.

1. The dialog is wider. The tool list stays on the left with its selection; a right column shows the chosen tool.
2. The right column shows, without JSON, the text that the model reads: the description, each parameter with its type, whether it is required and its description, and the annotations.
3. For a changed tool, the description shows the approved and the discovered version, with the changed part marked; a changed parameter description is marked too.
4. A "Before you approve" guide lists what to look for, each with its entry of the OWASP Top 10 for Agentic Applications 2026 and the printed page where the entry starts: an order to the model in the description or a parameter (ASI04, p. 18), a request to call another tool or send data or secrets elsewhere (ASI02, p. 12), and, for a changed tool, a change with no known reason (ASI04, p. 18). The link opens [the official page of the list](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) in a new tab (user decision, 2026-11-14): the download link of the document does not open from outside the site, so it cannot carry `#page`. OWASP classes a malicious tool description sent by an MCP server as ASI04 ("Tool-descriptor injection", "Compromised MCP / Registry Server"); ASI02 covers the misuse of a legitimate tool.
5. A Server entry above the tools shows the `instructions` that the server sent, marked as not sent to agents, and the server identity, which agents get from the registry.
6. Nothing is detected automatically. A future evaluator that marks risky text is out of scope.

## Acceptance Criteria

- [ ] 1. The user approves the layout on the prototype.

## Out of Scope

- Editing the text of a tool.
- Automatic detection of risky text.
- Review of the result of a tool call.
