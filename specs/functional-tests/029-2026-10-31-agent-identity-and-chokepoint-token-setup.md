---
spec: 029-2026-10-31-agent-identity-and-chokepoint-token-setup
title: Agent Identity and Chokepoint Token Setup
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Use a temporary agent and delete it after the run. Do not change an Acme agent or its key.
scenarios:
  - id: S1
    title: Generate key and download
    criteria: [1, 2, 3]
    steps:
      - Create a temporary agent and open its Identity view.
      - Click Generate key and download; watch the request.
      - Open the Identity view again.
    expected:
      - The request sends only the public key; one file downloads with client_id, issuer, token_endpoint, kid, alg and private_key.
      - The Admin never shows the private key again.
    last_run:
      date: 2026-11-02
      result: passed
      notes: null
  - id: S2
    title: Rotate key and own public key
    criteria: [4, 5]
    steps:
      - Click Rotate key and confirm.
      - Use my own public key with a private key, then with a public key.
    expected:
      - Rotate asks for confirmation and downloads a new file.
      - A private key is rejected.
    last_run:
      date: 2026-11-02
      result: passed
      notes: null
  - id: S3
    title: Custom server with the Chokepoint token
    criteria: [6, 7, 8, 9]
    steps:
      - Open the custom server dialog.
      - Click a server row and open its details; click Copy example.
      - Hover and focus each help, also inside the dialog.
    expected:
      - No None or Bearer option; Issuer, JWKS and Audience show without scroll.
      - A click anywhere on the row opens the details; the FastMCP example copies.
      - Every help opens on hover and focus.
    last_run:
      date: 2026-11-02
      result: passed
      notes: null
---

# Functional test: Agent Identity and Chokepoint Token Setup
