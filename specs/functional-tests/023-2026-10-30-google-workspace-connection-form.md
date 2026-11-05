---
spec: 023-2026-10-30-google-workspace-connection-form
title: Google Workspace Connection Form
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
  - A Google service account key for S3 (no real Workspace is needed to see the masking)
data: Delete a connection that a scenario saves, unless the user keeps it.
scenarios:
  - id: S1
    title: Provider cards
    criteria: [1, 2]
    steps:
      - Open Access › Integrations › Identity providers.
      - Hover and focus an unavailable card.
    expected:
      - All provider cards are compact; Google is in its own group.
      - Unavailable cards are disabled and show the tooltip on hover and focus.
    last_run:
      date: 2026-11-05
      result: blocked
      notes: Demo instance. Cards are compact (88 px) and Google Workspace is in its own group, OIDC integrations. Every provider of the catalog is available now, so no disabled card exists to show the tooltip.
  - id: S2
    title: Google form fields and the organization warning
    criteria: [3, 7]
    steps:
      - Open the Google card; then open a saved Google connection.
    expected:
      - The form has the fields of the table of the specification and no Keycloak-only field.
      - In the edit form, the warning about another Google organization shows near the User directory fields.
    last_run:
      date: 2026-11-05
      result: blocked
      notes: Demo instance. The new form has the fields and no issuing client. The edit warning needs a saved connection, and a save runs a real Google check (domain-wide delegation), so it needs a real Workspace.
  - id: S3
    title: Stored key masking
    criteria: [4]
    steps:
      - Save a Google connection with a key, then open it again.
    expected:
      - The stored key is never shown; replacing it needs Change.
    last_run:
      date: 2026-11-05
      result: blocked
      notes: A save with a generated service account key was refused by the Google check (The service account may not read the directory as this administrator). Needs a real Workspace.
  - id: S4
    title: Keycloak form unchanged
    criteria: [8]
    steps:
      - Open the Keycloak edit form.
    expected:
      - The form behaves as before.
    last_run:
      date: 2026-10-30
      result: passed
      notes: null
  - id: S5
    title: Narrow-screen layout
    criteria: []
    steps:
      - Open the identity providers and the Google form at 375 px.
    expected:
      - No horizontal scroll; the cards and the fields stay readable.
    last_run:
      date: 2026-11-05
      result: passed
      notes: Demo instance at 375 px - the Google, Keycloak, Entra and Okta forms and the list are 375 px wide. Fixed in identity.css - step code and form text wrap long URLs, and the field grid column can shrink (it was 514 px).
---

# Functional test: Google Workspace Connection Form

Acceptance items 5 and 6 (the warnings Not verified with a real Google Workspace and User synchronization is not supported) were removed by [Admin 028](../028-2026-10-31-remove-lifecycle-sync-screen-and-google-warnings.md) and have no scenario.
