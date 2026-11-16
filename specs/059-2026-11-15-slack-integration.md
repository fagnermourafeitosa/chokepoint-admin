# Specification: Slack Integration

- **Specification ID**: 059
- **Date**: 2026-11-15
- **Slug**: slack-integration
- **Status**: In Progress
- **Owner**: Admin — Integrations
- **Related Specification**: [056 — Remove Enterprise MCP](056-2026-11-15-remove-enterprise-mcp.md)
- **Related Backend Specification**: [Backend 098 — Slack Messages for Inbox Signals](../../backend/specs/098-2026-11-15-slack-signal-messages.md) (Proposed).
- **Visual reference**: [`specs/prototypes/059-2026-11-15-slack-integration/`](prototypes/059-2026-11-15-slack-integration/), pages `/prototype/external-apps` and `/prototype/external-apps-slack`.

> Layout and specification approved by the user (2026-11-15).

---

## Context & Background

Integrations has two tabs today, Custom MCPs and Identity providers. This specification adds a third, **External apps**, for apps outside the platform, starting with Slack.

Slack only **receives messages**: the administrator picks one channel, one group message or one person, and the app reads nothing in Slack (user, 2026-11-15). It is an enterprise app, so the Slack permissions it asks for must be visible and minimal (user, 2026-11-15).

A Slack app is needed to send messages. Slack offers two ways (read on 2026-11-15):

| Way | Scope | Destinations | Source |
| :--- | :--- | :--- | :--- |
| Incoming webhook | `incoming-webhook` | One channel, chosen when the webhook is created; private channels only if the creator is a member. The page does not say that it can send to a person or a group message. | https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/ |
| Bot token | `chat:write`, `mpim:write` | A channel the app was added to, a person (the direct message of the app) and a group message. | Slack Web API `chat.postMessage`, `conversations.open` |

The bot token is the only way that reaches the three destinations, with two write scopes and no read scope.

Confirmed in https://docs.slack.dev/reference/methods/chat.postMessage/ (read 2026-11-15): the bot token needs only `chat:write`; with it, a user ID as `channel` posts to that person's direct message with the app (App Home), with no `im:write`. The app must be a member of a channel to post in it (`not_in_channel`, `no_permission`). The Messages tab of the app must be on, or Slack answers `messages_tab_disabled`: the manifest turns it on read-only (`messages_tab_enabled`, `messages_tab_read_only_enabled`), so people cannot reply to the app.

---

## Problem Statement

### 1. Signals stay inside the Admin

An Inbox signal (requests denied, a tool discovery, a server that stopped answering) is seen only when someone opens the Admin. A team that works in Slack learns about it late.

### 2. A chat app is a data risk for an enterprise

A Slack app that can read messages, channels or files would expose company conversations. The administrator and the Slack admin who approves the app must see, before installing it, that it only sends and that nothing is retained.

---

## Solution (from the prototype)

1. **External apps tab.** Integrations has a third tab, **External apps**, after Custom MCPs and Identity providers (user, 2026-11-15).
2. **Apps by category, as square cards.** The tab lists the apps grouped by category; each category has a title and a one-line description, then its apps as square cards in a grid, with no pager: there will be many apps, not so many that they need pages (user, 2026-11-15). A card, a fixed square, shows centered the app logo, its name, one muted line and its status badge (`Not configured` neutral, `Configured` success, `Failing` danger when the last message was not accepted by Slack; user, 2026-11-15: a failing Slack must show). The time of the last delivery is on the failure notice of the edit page, not on the card, which has a fixed size. The logo is in ink when the app is not configured and in its own colors when it is configured; the badge says the same in text (user, 2026-11-15). The whole card is the action, with a hover effect (ink border, hard ink shadow, a small lift; no motion with reduced motion): a click opens the configuration of an app that is not configured, and the edit page (**Edit Slack**, saved values, the stored token behind Change) of an app that is (user, 2026-11-15). A search field stays above.
3. **Communication first.** The first category is **Communication**, with **Slack**: "Sends messages to one channel, group message or person. Reads nothing." (user, 2026-11-15). The Slack icon is the monochrome Slack mark in ink.
4. **Under construction.** Below Communication, three categories show apps that are not built yet, each with the **Under construction** badge, the logo in ink, no hover and no click (user, 2026-11-15): **Code repositories** (GitHub, GitLab), **Project management** (Atlassian: Jira and Confluence) and **Payments** (Stripe). The user named the first category; the other two were chosen here, from the product each vendor is known for.
5. **Configure Slack.** Configure opens a page (Back to Integrations) in the layout of the identity connection form, with these parts in order (user, 2026-11-15):
   1. **How to create the Slack app**: a collapsible, the `cp-admin-accordion--info` accordion, closed by default, at the top of the form, before What the app can do in Slack (user, 2026-11-15). Five numbered steps: create the app from a manifest at api.slack.com/apps; paste the manifest (bot scopes `chat:write` and `mpim:write` only, with Copy manifest); install the app (Install App, Install to Workspace; a Slack admin approves it when the Slack workspace requires approval); copy the Bot User OAuth Token from OAuth & Permissions; for a channel, add the app with `/invite`, with the reason: choosing the channel in Where messages go does not add the app to it, and Slack lets the app post only in channels it is a member of (user, 2026-11-15).
   2. **What the app can do in Slack**: the scopes that the manifest asks for, in a table (Scope, Allows), stated as the only ones: `chat:write` (send to a channel that the app was added to, and to a person in the direct message of the app) and `mpim:write` (start the group message with the chosen people). Under it, **Never requested**: any read scope (messages, channel lists, members, user profiles, email addresses, files); the app cannot read anything in Slack. Then an info Notice, **Nothing is retained**: the messages are sent to Slack and not kept, and nothing is read from Slack, so nothing from Slack is stored (user, 2026-11-15: an enterprise app, the scopes and the absence of retention must be clear).
   3. **Where messages go**: one destination for the environment. **Send to** (design system Select): Channel · public or private, Group message · up to 8 people, Person · direct message. Then the ID field of that choice — Channel ID, Member IDs (comma-separated) or Member ID — with where to find it in Slack (user, 2026-11-15: one channel, one group or one person). When Channel is chosen, a warning Notice under the field says to add the app to the channel with `/invite @Acme alerts`, because choosing the channel does not add the app to it and Slack rejects messages to a channel the app is not in; it is also step 5 of the guide, so it is never hidden (user, 2026-11-15).
   4. **What to send**: the administrator chooses which Inbox signal types become a Slack message (user, 2026-11-15), one switch for each type with a one-line description: Requests denied, Tool discovery, Server disconnected (on by default), Token exchange denied, Would deny, Review due, Lethal trifecta (off by default; Lethal trifecta added for Backend 097, user 2026-11-15). Each new signal of a chosen type sends one message with a link to it in the Admin.
   5. **App credentials**: the Bot User OAuth Token (`xoxb-`), stored encrypted and never shown again, and **Send test message**, which sends one message to the destination to check the token, the destination and that the app is in the channel.
   6. **Failure notice**: when Slack is Failing, the edit page shows an error Notice above the form with the reason in words (the same texts as the test message), the time of the last delivery, and that the next message Slack accepts clears it (user, 2026-11-15).
   7. **Footer**: Cancel and Save on the right, as the editor of one item in `docs/design-system/layouts.md` (user, 2026-11-15). No separator line under App credentials nor above the buttons (user, 2026-11-15).
6. **Copy** of the manifest uses the design system `CopyButton`.
7. **Link of a message** (implementation, 2026-11-15). A Slack message links to `/inbox/<signal ID>?workspace=<tenant>&environment=<environment>`. The route opens that workspace and environment, reads the signal and opens its target with the Inbox logic (`targetPath`), or the Overview when it has none. A signal that no longer exists, or a workspace the person cannot open, shows a short message with a link to the Overview. The route needs a session, not a chosen workspace, so a link opened in a new tab works. A signed-out person signs in and returns to the link: the Admin keeps only `/inbox/` paths, for this browser tab.
8. **Slack app name.** The manifest, the invite step and the channel warning use the workspace name and "alerts" (for example "Acme alerts"), at most 35 characters, the Slack limit.

---

## Backend dependencies

Each item is marked in the prototype with `Waiting backend · 098` and defined in [Backend 098](../../backend/specs/098-2026-11-15-slack-signal-messages.md).

1. The Slack configuration status (Backend 098, API `GET`) in the current workspace environment, which sets the logo color, the badge and whether the card opens the configuration or the edit page.
2. Saving the Slack configuration of the environment (Backend 098, API `PUT`): the destination (kind and Slack IDs), the chosen Inbox signal types and the bot token, stored encrypted and never returned.
3. Send test message (Backend 098, Test message): one message to the destination with the token; the result says whether the token, the destination or the channel membership failed.
4. Sending one message for each new Inbox signal (Backend 098, Messages) of a chosen type, with a link to it, with `chat.postMessage` (and `conversations.open` with `mpim:write` for a group message), never storing their content.

---

## Open Points

None.

---

## Testing Decisions

- No automated tests (AGENTS.md, Verification): `npm run check`, `npm run build` and the functional test in the built-in browser on the demo instance.
- The functional test needs a Slack workspace for the test message and for one real signal; without one, the scenarios that send are `blocked` and say so.

---

## Acceptance Criteria

- [ ] 1. Integrations shows the External apps tab with the Communication category and the Slack card, with no pager; the logo is in ink when not configured and in color when configured, and a click opens the configuration or the edit page.
- [ ] 2. A click on the Slack card shows the two scopes, Never requested, Nothing is retained, the destination, the token and the collapsible guide with the manifest.
- [ ] 3. Saving stores the destination and the encrypted token; the list then shows Slack as Configured.
- [ ] 4. Send test message reaches the chosen channel, group message or person.
- [ ] 5. `npm run check` and `npm run build` pass.
- [ ] 6. Functional test: [059-2026-11-15-slack-integration.md](functional-tests/059-2026-11-15-slack-integration.md)
- [ ] 7. A Slack whose last message failed shows Failing on its card and the reason on the edit page; What to send lists Lethal trifecta, off by default.

---

## Out of Scope

- Building GitHub, GitLab, Atlassian and Stripe: they are only shown as Under construction.
- Any reading from Slack, and Slack as a tool of agents.
