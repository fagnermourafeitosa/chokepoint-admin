---
# Functional test of one specification. File name: the file name of the specification.
spec: 059-2026-11-15-slack-integration
title: Slack Integration
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test
  - A Slack workspace where a Slack app can be created and installed, with one public channel, one private channel and two people
data: Acme has no Slack configuration. To restore, delete the Slack configuration of Acme / Production.
scenarios:
  - id: S1
    title: The External apps tab shows Slack as a card that is not configured
    criteria: [1]
    steps:
      - Open Access, Integrations, then the External apps tab.
    expected:
      - The Communication category shows the Slack card with the logo in ink and the Not configured badge, and no pager.
      - Hovering the card shows the ink border and shadow.
    last_run:
      date: null
      result: not_run
      notes: null
  - id: S2
    title: The configuration shows what the app can do and the guide
    criteria: [2]
    steps:
      - Click the Slack card.
      - Open How to create the Slack app.
    expected:
      - Configure Slack shows the two scopes chat:write and mpim:write, Never requested and Nothing is retained.
      - The guide has five steps and the manifest asks only for chat:write and mpim:write, with the Messages tab on and read-only.
      - With Send to on Channel, the warning to add the app with /invite is shown.
    last_run:
      date: null
      result: not_run
      notes: null
  - id: S3
    title: Saving a channel destination makes Slack configured, and the card opens the edit page
    criteria: [1, 3]
    steps:
      - Create and install the Slack app from the manifest; invite it to the public channel.
      - Choose Channel, type the Channel ID, keep the default signal types, paste the token and click Save.
      - Go back to External apps and click the Slack card.
    expected:
      - The card shows the Slack logo in color and the Configured badge.
      - The click opens Edit Slack with the saved Channel ID and the stored token behind Change.
    last_run:
      date: null
      result: not_run
      notes: null
  - id: S4
    title: Send test message reaches each kind of destination
    criteria: [4]
    steps:
      - Send test message with the public channel, then with the private channel before and after /invite, then with a group message of two people, then with one person.
    expected:
      - The message arrives in the channel, the group message and the direct message of the app.
      - Before /invite, the private channel fails with a message that says the app is not in the channel.
    last_run:
      date: null
      result: not_run
      notes: null
  - id: S5
    title: A new signal of a chosen type sends one message
    criteria: [3]
    steps:
      - Run traffic.py --once so that a call is denied.
    expected:
      - One message with a link to the Requests denied signal arrives at the destination; Would deny, off by default, sends nothing.
    last_run:
      date: null
      result: not_run
      notes: null
---

# Functional test: Slack Integration

The scenarios that send (S3 to S5) need a real Slack workspace. Without one they are `blocked`, and the notes say so.
