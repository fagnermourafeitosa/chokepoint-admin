# Specification: Remove Enterprise MCP

- **Specification ID**: 056
- **Date**: 2026-11-15
- **Slug**: remove-enterprise-mcp
- **Status**: Implemented
- **Owner**: Admin / MCP integrations
- **Related Specification**: [Backend 095 — Remove Enterprise MCP](../../backend/specs/095-2026-11-15-remove-enterprise-mcp.md), [055 — Tool Review Text](055-2026-11-14-tool-review-text.md)
- **Related Mock Contract**: none

---

## Context & Background

The Admin shows Enterprise MCP in Access > Integrations: an Enterprise MCPs tab with the GitHub card, the GitHub App setup, the OAuth connection, and the Enterprise entry of the tool review page (Admin 055). Backend 095 removes Enterprise MCP and its API on the user's decision of 2026-11-15; a new design replaces it later.

---

## Problem Statement

### 1. Screens for a removed backend

Without Backend 095's routes, the Enterprise MCPs tab, the GitHub App dialog, the OAuth return and the Enterprise review call endpoints that no longer exist.

---

## Solution

1. Delete `src/features/mcp/enterprise/`, `EnterpriseToolReview.tsx` and the provider mark, and every Enterprise branch: the Enterprise MCPs tab, `type=enterprise`, the `preview`/`tenant`/`environment` OAuth return, the reconnect action, and the `connection_type`, `provider_id`, `account` and `authentication_status` fields.
2. Integrations keeps Custom MCPs and Identity providers. The tool review page keeps its Custom entry (Admin 055).
3. Inbox, Investigate, Review coverage and the delegation graph open every MCP server as a Custom MCP.
4. Public docs drop the Enterprise MCP pages and mentions before the merge.

---

## Acceptance Criteria

- [x] 1. No Enterprise MCP screen, route, API call or field remains in the Admin.
- [x] 2. Custom MCP connection, review, Inbox and Review coverage work as before.
- [x] 3. `npm run check` and `npm run build` pass.
- [x] 4. Functional test in the browser on the development stack.
- [x] 5. Public docs no longer describe Enterprise MCP.

---

## Out of Scope

- The new design for vendor-hosted MCP servers.

**Verification (2026-11-15).** `npm run check` and `npm run build` pass. Functional test in the browser on the development stack with Backend 095: Integrations opens on Custom MCPs with two tabs (Custom MCPs, Identity providers), `type=enterprise` falls back to Custom MCPs, the Inbox opens a Custom MCP review without `connection_type` and its confirmation stores the tool, Review coverage lists the tools, the delegation graph labels each server Custom MCP, and the removed backend routes are not called. Public docs dropped the Enterprise MCP pages and the vendor server passages (frontend `c6856d9`).
