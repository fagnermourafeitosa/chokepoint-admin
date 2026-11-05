# Archived Prototype: Admin 029

> Temporal record. Read [the prototypes README](../README.md) first. This is not the current Admin and not a source of truth.

- **Specification**: [029 — Agent Identity and Chokepoint Token Setup](../../029-2026-10-31-agent-identity-and-chokepoint-token-setup.md)
- **Route at that time**: `/prototype/agent` (tab Identity) and `/prototype/mcp-server`
- **Snapshot**: the files as they were at commit `46ee5ce` (2026-11-02), the last commit before the prototype was removed by `b5fab79` (Give agents their key and custom MCP servers the Chokepoint token (Admin 029)).
- **This specification's part**: `AgentPrototype` and `McpServerPrototype` in `PrototypePage.tsx`, `src/features/access/delegation/AgentIdentity.tsx` and `src/features/mcp/ChokepointTokenSetup.tsx`.

The files keep their original paths under `src/` in this folder. Their imports resolve against `src/` at commit `46ee5ce` (`git show 46ee5ce:<path>`), not against the current code. The folder is not compiled.
