---
spec: 010-2026-10-27-enterprise-and-custom-mcp-connections
title: Enterprise and Custom MCP Connections
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
  - A customer GitHub App for S2
data: Remove a connection that a scenario creates.
scenarios:
  - id: S1
    title: Enterprise and custom paths
    criteria: [1, 7, 8]
    steps:
      - Open Access › Integrations; open Enterprise and Custom.
    expected:
      - The two paths are distinct and keep the environment; Enterprise starts from a branded GitHub button with no endpoint or transport input; Configure GitHub holds the application credentials; Custom keeps the endpoint entry.
    last_run:
      date: 2026-10-27
      result: passed
      notes: Seed user checks; individual results are in the backend review record 014-enterprise-mcp-review.
  - id: S2
    title: GitHub OAuth and discovery
    criteria: [2, 3, 4]
    steps:
      - Configure GitHub, connect, consent; then deny, cancel and let an attempt expire.
    expected:
      - Each outcome has a usable state; tokens are never copied; the connection state and the tool review are accurate.
    last_run:
      date: null
      result: blocked
      notes: Needs a valid customer GitHub App; real GitHub consent, discovery and execution are unverified.
  - id: S3
    title: Environment switch with an unsaved edit
    criteria: [5]
    steps:
      - Make an unsaved edit, switch the environment; cancel, then confirm.
    expected:
      - The warning shows; Cancel keeps Sandbox and the edit; confirming switches to Production.
    last_run:
      date: 2026-10-27
      result: passed
      notes: Workspace selection uses the same guard (code inspection); one workspace in the seed.
---

# Functional test: Enterprise and Custom MCP Connections

The agent connection graph (criteria 9 to 11) was replaced by [Admin 026](../026-2026-10-31-agent-delegation-editor.md).
