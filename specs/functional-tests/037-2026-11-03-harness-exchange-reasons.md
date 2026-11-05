---
spec: 037-2026-11-03-harness-exchange-reasons
title: Harness Login Reasons in Investigate
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
  - Harness login of the demo - realm acme, login client acme-harness-login, group Finance (refunds-assistant)
  - Harness client https://claude.ai/oauth/claude-code-client-metadata against the demo authorization server; people of the realm acme
data: S3 changes the harness allowlist and the consent of the person who logs in; restore both after the run.
scenarios:
  - id: S1
    title: Reason labels, filter and inspector of exchanges in local data
    criteria: [1, 2, 3, 5]
    steps:
      - Open Investigate › Token exchanges and the problems.
      - Open the Reason filter and pick refresh_reuse.
      - Open exchanges with blocked (with agent), not_allowed_client (no agent) and refresh_reuse (with and without agent).
    expected:
      - Each reason shows its short label with the sentence as hover text, in the list and in the problems.
      - The filter offers the twelve reasons; reason=refresh_reuse lists its exchanges.
      - The inspector shows the sentence, the hint and the action, or the text without a button when there is no agent; Harness and Reference when present; the Subject and Returned to the agent texts.
    last_run:
      date: 2026-11-03
      result: passed
      notes: Exchanges 73, 67, 72, 64 and 69. Reads and navigation only.
  - id: S2
    title: no_group from a real harness login
    criteria: [1, 3]
    steps:
      - Log in from the harness as Camila (not in developers).
      - Search the reference shown on the refused page in Investigate.
      - Click Open the harness login.
    expected:
      - The search finds the exchange; its inspector shows no_group; the action opens the Harness login block.
    last_run:
      date: 2026-11-03
      result: passed
      notes: null
  - id: S3
    title: dpop_invalid, not_allowed_client with an agent and code_reuse
    criteria: [1, 3]
    steps:
      - Alice consents. Then send a refresh with a DPoP proof that is not valid, remove Claude Code from the allowlist and refresh, and send the same code a second time.
      - Open each exchange in Investigate and click its actions.
    expected:
      - The token endpoint answers invalid_dpop_proof, invalid_grant and invalid_grant.
      - Each inspector, its actions (Identity, Harness sessions) and its facts match the specification.
    last_run:
      date: 2026-11-03
      result: passed
      notes: claude mcp login of Claude Code 2.1.222 did not find the authorization server then (backend follow-up), so the flow used the same client against the advertised endpoints.
  - id: S4
    title: Agent view links
    criteria: [4]
    steps:
      - Open /access?agent_id=<id>&view=identity, then view=sessions, then no view; switch the view by hand after a view link.
    expected:
      - Identity, Harness sessions and Delegation and access open in turn; the manual switch works.
    last_run:
      date: 2026-11-03
      result: passed
      notes: null
  - id: S5
    title: no_group or blocked without a subject
    criteria: [3]
    steps:
      - Open an exchange with no_group or blocked and no subject.
    expected:
      - The inspector shows the text of the specification.
    last_run:
      date: 2026-11-05
      result: blocked
      notes: The demo data has no no_group or blocked exchange without a subject; code inspection only.
---

# Functional test: Harness Login Reasons in Investigate

The Admin branch can be served on another port (for example `127.0.0.1:5174`) with the session cookie of the sign-in on `127.0.0.1:5173`.
