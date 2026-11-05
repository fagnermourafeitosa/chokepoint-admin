---
# Functional test of one specification. File name: the file name of the specification.
spec: 000-YYYY-MM-DD-template # file name of the specification, without .md
title: <Specification title>
stack: # always the demo instance; the sign-in is in AGENTS.md, Local Functional Test
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test
data: <Acme data that the scenarios use, and how to restore what they change>
scenarios: # one or more
  - id: S1
    title: <what the scenario proves, in one line>
    criteria: [1] # acceptance criteria of the specification that this scenario covers
    steps:
      - <one action in the built-in browser>
    expected:
      - <one result seen in the interface, the API or the database>
    last_run:
      date: YYYY-MM-DD # date of the last run; null if never run
      result: not_run # passed | failed | blocked | not_run
      notes: <what was seen; what was not covered and why; code inspection only, if so>
---

# Functional test: <Specification title>

Optional context: what the scenarios cover, a diagram, how to produce data that the local stack does not have.
