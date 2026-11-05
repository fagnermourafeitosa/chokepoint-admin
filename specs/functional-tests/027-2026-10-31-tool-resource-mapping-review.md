---
spec: 027-2026-10-31-tool-resource-mapping-review
title: Tool Resource Mapping Review
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Discard or approve unchanged each draft that the run writes.
scenarios:
  - id: S1
    title: Resource block and argument choice
    criteria: [1, 2, 3, 4, 5]
    steps:
      - Open an Acme server (for example Acme Analytics) details and a managed tool.
      - Open the argument select and pick a string argument.
      - Open the help.
    expected:
      - Each managed tool shows the Resource block with its state.
      - Non-string arguments are disabled; picking an argument proposes <tool>_<argument>, marked as proposed and editable, with no dropdown.
      - The help, the example, the optional-argument warning and the impact warning show as in sections 1 and 2.
    last_run:
      date: 2026-11-02
      result: passed
      notes: null
  - id: S2
    title: Draft lifecycle
    criteria: [6]
    steps:
      - Save draft, Review & approve, Discard draft.
    expected:
      - Each follows section 3; a draft has no runtime effect.
    last_run:
      date: 2026-11-02
      result: passed
      notes: null
  - id: S3
    title: Affected agents before approval
    criteria: []
    steps:
      - Change the mapping of a tool that an agent with published values uses, and open Review & approve.
    expected:
      - The review names the agents that the change affects.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance, Acme Analytics run_report. A draft resource type dataset_v2 showed 1 agent has values of dataset - analytics-assistant (2 values), in the editor and in Review the resource change. Draft discarded; the active mapping is unchanged.
---

# Functional test: Tool Resource Mapping Review
