---
spec: 032-2026-11-02-revision-history
title: Revision History
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: S3 soft-deletes an Acme agent. Rebuild the demo after the run - reset.sh --yes, up.sh, populate.py.
scenarios:
  - id: S1
    title: Publication note and publication bar
    criteria: [1, 2]
    steps:
      - Publish two revisions of an agent, one with a note.
    expected:
      - The publication bar shows the author, time and note of the latest revision and opens the history.
    last_run:
      date: 2026-11-03
      result: passed
      notes: null
  - id: S2
    title: History side panel
    criteria: [3, 4]
    steps:
      - Open the history; select revisions; press Escape.
      - From Investigate, open a decision at a known revision and click its permission revision.
    expected:
      - The timeline, the effective revision, the note and the computed diff (a removed resource; the first revision with names from the catalog).
      - Escape closes the panel.
      - The decision opens the panel on its revision; a revision published before Backend 038 says that it was published before the history existed.
    last_run:
      date: 2026-11-03
      result: passed
      notes: Decision at revision 6.
  - id: S3
    title: Delete an agent
    criteria: [5, 6]
    steps:
      - Delete the agent through the dialog.
      - Open the agent list, Investigate, and a token request of the deleted agent.
    expected:
      - The dialog states the soft delete; the revoked event, no OpenFGA tuples left, status deleted with its author.
      - The agent leaves the list; Investigate shows "<name> (deleted)"; the exchange shows the key warning with no Open the agent action.
    last_run:
      date: 2026-11-03
      result: passed
      notes: The revocation and conflict errors, the Inbox text and the Inbox item of a deleted agent by code inspection; no signal was raised.
---

# Functional test: Revision History

The 2026-11-03 run used Backend 038 on port 8083 with its own PostgreSQL, the Admin at `localhost:5175`, the host Keycloak and OpenFGA.
