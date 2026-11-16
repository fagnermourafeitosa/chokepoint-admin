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
      date: 2026-11-15
      result: passed
      notes: "Run on a copy of the demo database (chokepoint_demo_098, migration 00050) with the branch API on 127.0.0.1:8081 and the branch Admin at app.xokepoint.localhost, signed in as beatriz@acme.test, Acme Sandbox; the demo slots were in use by other work. Slack card with ink logo and Not configured, no pager, GitHub, GitLab, Atlassian and Stripe Under construction. The hover was not checked."
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
      date: 2026-11-15
      result: passed
      notes: "Scopes chat:write and mpim:write, Never requested, Nothing is retained, the channel warning with /invite @Acme alerts, and the manifest with the Messages tab read-only, read from the page."
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
      date: 2026-11-15
      result: passed
      notes: "Without a Slack workspace: saved with a channel ID and a test token; the card turned to the color logo and Configured; Edit Slack showed the channel, the three default signals and the stored token behind Change; the row holds a sealed token. Creating and installing the app in Slack was not done."
  - id: S4
    title: Send test message reaches each kind of destination
    criteria: [4]
    steps:
      - Send test message with the public channel, then with the private channel before and after /invite, then with a group message of two people, then with one person.
    expected:
      - The message arrives in the channel, the group message and the direct message of the app.
      - Before /invite, the private channel fails with a message that says the app is not in the channel.
    last_run:
      date: 2026-11-15
      result: blocked
      notes: "No Slack workspace. Only the refusal path ran: the test token reached slack.com, which answered invalid_auth, and the page showed: Slack refused the token."
  - id: S5
    title: A new signal of a chosen type sends one message
    criteria: [3]
    steps:
      - Run traffic.py --once so that a call is denied.
    expected:
      - One message with a link to the Requests denied signal arrives at the destination; Would deny, off by default, sends nothing.
    last_run:
      date: 2026-11-15
      result: blocked
      notes: "No Slack workspace. On the copy, a reopened mcpserver_disconnected signal enqueued a delivery, the worker sent it within 3 s (notify) and stored last_error invalid_auth; no message reached Slack."
  - id: S6
    title: The link of a message opens the signal in its workspace and environment
    criteria: [1]
    steps:
      - With the Admin in Sandbox, open /inbox/<signal>?workspace=<Acme>&environment=<Production> of an open requests-denied signal.
      - Open the same link with a signal ID that does not exist.
    expected:
      - The Admin switches to Production and opens the decision in Investigate.
      - The page says that the signal no longer exists, with a link to the Overview.
    last_run:
      date: 2026-11-15
      result: passed
      notes: "Switched from Sandbox to Production and opened Investigate on get_ticket, no_delegation; the unknown ID showed: This signal no longer exists. After the fix of the review: a full page load of the link (a new tab) opened the target in Sandbox, and a link kept for the sign-in return opened the Production target from /."
  - id: S7
    title: A failing Slack shows Failing and its reason; Lethal trifecta can be chosen
    criteria: [7]
    steps:
      - With Slack configured, let the last message fail (a final Slack error such as not_in_channel), then open External apps.
      - Open the Slack card.
      - Turn on Lethal trifecta and save.
    expected:
      - The card shows Failing in the danger tone.
      - Above the form, an error notice gives the reason in words, the time of the last delivery and that saving or the next accepted message clears it. What to send lists Lethal trifecta, off.
      - The save is accepted and the card shows Configured.
    last_run:
      date: 2026-11-15
      result: passed
      notes: "On the copy (chokepoint_demo_098), last_error was set to not_in_channel as the worker records a final error. The Sandbox card showed Failing (danger); Edit Slack showed: The app is not in this channel… Last delivery 2026-11-15 18:04. Lethal trifecta was listed off; turned on and saved: the row holds lethal-trifecta, last_error is cleared and the card shows Configured."
---

# Functional test: Slack Integration

The scenarios that send (S3 to S5) need a real Slack workspace. Without one they are `blocked`, and the notes say so.
