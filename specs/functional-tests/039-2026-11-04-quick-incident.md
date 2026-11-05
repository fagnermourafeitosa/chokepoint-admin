---
spec: 039-2026-11-04-quick-incident
title: Quick Incident
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Read-only. Use incident codes of the local decisions and token exchanges (a denied tool call, a refused login, a refused token exchange).
scenarios:
  - id: S1
    title: Control on the three pages
    criteria: [1, 5]
    steps:
      - Open /, /access and /investigate.
      - Press / on each page.
    expected:
      - Quick incident is right-aligned on the title row of each page, and / opens its field.
    last_run:
      date: 2026-11-04
      result: passed
      notes: null
  - id: S2
    title: Decision and exchange codes open their inspector
    criteria: [2, 4]
    steps:
      - From Overview, search the code of a denied tool call.
      - From Access, search the code of a refused login and of a refused token exchange.
    expected:
      - The decision code opens the decision inspector, which shows Reference.
      - The exchange codes open the exchange inspector; a login_error shows its label, sentence, hints by cause and the Cause fact.
    last_run:
      date: 2026-11-04
      result: passed
      notes: BMBO2573 opened decision 83; aq56-k5pj opened exchange 163 (redirect_uri_invalid), on the Backend 053 branch at 127.0.0.1:8083.
  - id: S3
    title: Format, not found and several matches
    criteria: [3]
    steps:
      - Search k3f9-x2ab (format), zzzz-zzzz (not found) and a code with several matches.
    expected:
      - Each behaves as in Solution.
    last_run:
      date: 2026-11-04
      result: blocked
      notes: Format and not found passed; several matches only by code inspection, because no environment has two equal codes.
  - id: S4
    title: Open from the URL
    criteria: [5]
    steps:
      - Open /investigate?incident=<exchange code>.
    expected:
      - The exchange opens on load and the parameter is cleared.
    last_run:
      date: 2026-11-04
      result: passed
      notes: x4av-75q6 opened exchange 162.
  - id: S5
    title: Investigate search finds the code
    criteria: []
    steps:
      - Type an incident code in the Investigate search.
    expected:
      - The search still works and finds the code.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance. Searching kxkg-uxha in All decisions returned its one decision. The count label reads 1 decisions (plural).
---

# Functional test: Quick Incident
