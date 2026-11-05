---
spec: 007-2026-10-25-mcp-server-management-and-discovery-preview
title: MCP Server Management and Discovery Preview
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: S3 needs a fixture with a changed contract; stop it after the run. Disable or keep the servers that the run registers.
scenarios:
  - id: S1
    title: Discovery and selection
    criteria: [3, 4]
    steps:
      - Add a custom server on the six-tool, two-tool and empty fixtures; select all, some and no tools; cancel once.
    expected:
      - All tools are selected first, with inspectable metadata; zero tools or zero selection cannot register; cancel creates no record.
      - No browser request goes to an MCP endpoint.
    last_run:
      date: 2026-10-25
      result: passed
      notes: null
  - id: S2
    title: Disable and re-enable
    criteria: [6]
    steps:
      - Disable a server; re-enable it.
    expected:
      - Re-enable requires discovery and review; there is no delete.
    last_run:
      date: 2026-10-25
      result: passed
      notes: null
  - id: S3
    title: Rediscovery review
    criteria: [5]
    steps:
      - Change the fixture contract and rediscover.
    expected:
      - New, Changed and Removed rows are highlighted with previous and current contracts; cancel keeps the disabled changes.
    last_run:
      date: 2026-10-25
      result: passed
      notes: null
---

# Functional test: MCP Server Management and Discovery Preview

None and Bearer authentication (criterion 2, in part) were replaced by the Chokepoint token in [Admin 029](../029-2026-10-31-agent-identity-and-chokepoint-token-setup.md).
