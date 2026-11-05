# Specification: Interactive Harness Access

- **Specification ID**: 036
- **Date**: 2026-11-03
- **Slug**: interactive-harness-access
- **Status**: Implemented
- **Owner**: Admin — Access and Integrations
- **Visual reference**: the layout prototype `/prototype/harness-access` and `/prototype/harness-login`, approved by the user on 2026-11-03 and removed at implementation (visual specification, point 7). Archived prototype: [`specs/prototypes/036-2026-11-03-interactive-harness-access/`](prototypes/036-2026-11-03-interactive-harness-access/) (see [the prototype index](prototypes/README.md)).
- **Related Specification**: [Backend 045 — Interactive Agent Login](../../backend/specs/045-2026-11-03-interactive-agent-login.md) (every contract of this screen)
- **Related Specification**: [026 — Agent Delegation Editor](026-2026-10-31-agent-delegation-editor.md) (identity provider panel), [029 — Agent Identity and Chokepoint Token Setup](029-2026-10-31-agent-identity-and-chokepoint-token-setup.md) (Identity view), [032 — Revision History](032-2026-11-02-revision-history.md) (published blocks and group changes)

---

## Context & Background

Backend 045 adds an interactive mode: a developer adds the Chokepoint MCP URL to a coding harness (Claude Code, Cursor, Codex), logs in with the company identity provider, consents and calls the tools of an agent. The administrator decides:

- **what**: the agent holds servers, tools, resources and call conditions (026);
- **who**: the IdP groups that can log in to the agent from a harness;
- **veto**: blocked people, above any group or consent;
- **which harnesses**: the client metadata URLs allowed for the agent.

Admin 029 left "sign-in in the browser for MCP clients such as Cursor or Claude Code" out of scope. This specification delivers its administration.

---

## Problem Statement

### 1. No place to say who can use a harness

The identity provider panel lists people one by one. There is no way to allow a group, and no way to veto one person.

### 2. No place to allow a harness

The Identity view has only the agent key. There is no list of the harnesses that can log in.

### 3. No view of who is connected

The administrator cannot see which people and machines are logged in to an agent from a harness, nor revoke one machine.

### 4. The identity connection has no login client

Chokepoint needs its own OIDC client at the identity provider to log people in.

---

## Solution

Five screens, as in the approved prototype:

1. **Identity provider panel → Harness login block** (Delegation and access).
2. **Identity view → Harness login card.**
3. **Harness sessions view** (a third agent view).
4. **Identity connection form → Harness login section** (Integrations).
5. **Pages of the authorization server** (consent and related pages), specified here and served by the backend.

---

## Practical Gains & Operational Outcomes

1. **Access by group**:
   - *Before*: the administrator lists every person.
   - *Now*: the administrator chooses IdP groups; the rule that only members can log in is stated in the screen.
2. **Veto and revocation**:
   - *Before*: removing a person from a delegation is the only control.
   - *Now*: block a person at once, revoke one machine or every machine of a person.
3. **Harness onboarding**:
   - *Before*: no harness can connect.
   - *Now*: the administrator copies one MCP URL and allows known harnesses with one click.

---

## User Stories

- [x] 1. As an administrator, I allow the group `developers` of an identity provider to log in to an agent from a harness, and the screen tells me that only members of that group can.
- [x] 2. As an administrator, I block a person on an agent and see that publishing revokes their machines.
- [x] 3. As an administrator, I allow Claude Code for an agent with one click and copy the MCP URL for developers. — the MCP URL is one line for each server of the agent, because the ingress needs the server ID.
- [x] 4. As an administrator, I see the people and machines logged in to an agent and revoke one machine.
- [x] 5. As an administrator, I configure the login client of an identity connection and copy its redirect URI.
- [x] 6. As a developer, I see what an agent can do before I allow it, and a clear reason when I am refused.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language

- **Context**: Admin — Access (agent views, identity provider panel) and Integrations (identity connection form). The backend owns login, consent, grants, groups and the catalog.
- **Package Ownership**: `src/features/access/delegation` (Harness login block, Harness login card, Harness sessions view), `src/features/access/components/AgentDetails.tsx` (third view), `src/features/identity` (Harness login section). The pages of the authorization server are not Admin code: Backend 045 serves them.
- **Terms**:
  - *Harness*: a coding tool that logs a person in through the browser and calls MCP tools.
  - *Harness login*: the interactive mode of Backend 045.
  - *Machine*: one grant of Backend 045, one login of one harness on one computer.
  - *Blocked*: a person vetoed on an agent.

### 2. Aggregate Root & State Transitions

- Harness login of a scope: **off** → **on with groups**. It cannot be on without groups.
- Blocked person: added in the draft → effective on publish (revokes the machines) → removed in a later draft.
- Machine: **active** → **revoked** (Revoke, Revoke consent, Block).

### 3. Commands, Queries & Domain Ports

Read and edit `person_consent` and `blocked` in the permission document; read groups of an identity connection; read and save the client allowlist; read the harness catalog; list consents and grants and revoke them; save the login client of an identity connection. Exact contracts: [Backend dependencies](#backend-dependencies).

---

## Implementation Decisions

### 1. Identity provider panel → Harness login block

Below the consent record of the panel (026).

1. Heading **Harness login** with a help: people of this identity provider log in from a coding harness and consent themselves; you choose which groups can.
2. When the scope does not include People: "Include People above to let people log in from a harness." and nothing else.
3. Switch **People in chosen groups can log in from a harness**, with "They consent at login. You do not list them one by one."
4. **The group rule is prominent** (Backend 045 Resolved Decision 24). Directly under the switch, a framed rule box with an icon:
   - title: **Only members of these groups can log in.**
   - with groups: "A person of {IdP} outside these groups is refused at login and never sees {agent}." (warning tone);
   - without groups: "Choose at least one group. Without a group, harness login stays off." (danger tone, `role="alert"`). Publication is blocked while the switch is on without groups.
5. **Groups**: chips of the directory groups of the identity provider, with search, from the groups read. Each chip shows the name; for Keycloak, the path on hover. A chosen group that no longer exists in the directory stays visible and is marked "Not found in {IdP}". Help under the chips: "Groups of the {IdP} directory. Membership is read at each login."
6. **Consent lasts** {n} days, **At most** {m} days. The first is at most the second.
7. Warning (always shown when on): "Removing someone from a group in {IdP} does not cut access at once. It ends after 24 hours without use or when the consent ends. To cut access now, block the person." (Backend 045 Resolved Decision 23.)
8. **Blocked · {count}** with a help ("A blocked person can not use this agent, whatever their groups or consent. Blocking revokes their machines at once when you publish."). Each entry: name, subject, reason, **Unblock**. A person picker from the directory and **Block**. Blocking does not need the switch to be on.
9. The block is part of the draft and the publication of 026; the revision history (032) shows it.
10. A provider without the groups capability (Okta today) shows: "{IdP} can not list groups yet, so harness login is not available for it." instead of points 3 to 7.

### 2. Identity view → Harness login card

Second card of the Identity view, right under the Key card (029), above the collapsed sections.

1. Heading **Harness login** with a help: a coding harness logs in a person through the browser; only the harnesses listed here can log in to this agent.
2. Text: "Developers add the MCP URL below to their harness. They log in with your identity provider, consent, and get the tools of {agent}."
3. **MCP URL for developers** on one line: label, value, copy button (same layout as Connection details of 029). The value is the MCP ingress of the environment (Backend 030 Resolved Decision 15).
4. **Allowed harnesses · {count}**: each entry shows the name (`client_name`), the URL and a remove button. When the URL is also allowed in other agents: "Also allowed in {agents}. At login, a person in both agents chooses one." Empty: "No harness yet. Nobody can log in to this agent from a harness."
5. One button for each harness of the catalog that is not allowed yet (name and icon from the catalog).
6. Collapsed **Another harness (client metadata URL)** with a help: "Use it for a harness that is not in the buttons above. A harness identifies itself with a public HTTPS URL, its client metadata document: a small file published by the harness vendor with its name and the addresses it returns to after login. Ask the vendor for this URL or find it in their docs. Only harnesses listed here can log in to this agent." An HTTPS URL field and **Add**.

### 3. Harness sessions view

A third agent view, **Harness sessions**, next to Delegation and access and Identity.

1. Heading with a help: people who logged in from a coding harness; each machine has its own login and can be revoked alone.
2. Summary: "{people} people · {machines} machines".
3. One card for each person: name, subject, "via group {group}", "consent ends {date}", and **Revoke consent** and **Block**.
4. One row for each machine: harness name, "Logged in {time} · used {time}", a badge **Bound to device** (DPoP) or **Bearer**, and **Revoke**.
5. **Block** from this view adds the person to the blocked list of the draft and says: "{name} blocked in the draft. Publish to revoke their machines and stop new logins."
6. Empty: "Nobody is logged in from a harness."

### 4. Identity connection form → Harness login section

Last section of the Keycloak/OIDC and Google forms.

1. Heading **Harness login** with a help: Chokepoint is an OIDC client here; it sends the person to the provider, reads who they are and their groups, then asks for their consent.
2. Switch **Allow harness login**: "Each agent then chooses which groups of this provider can log in."
3. **Redirect URI** with a copy button and "register it in {provider}" (`<issuer>/callback`).
4. **Login client ID** and **Login client secret** (write-only, "Stored encrypted. Existing secrets cannot be displayed."). The client ID help says it is a confidential OIDC client with the authorization code flow, not the directory client (Google: a Web application OAuth client).
5. Note: "At each login, Chokepoint reads the groups of the person from the directory, with the {directory client | service account} above. {It needs permission to read groups | It needs the read-only groups scope of the Directory API}. Check connection tells you when it is missing." There is no groups claim field.

### 5. Pages of the authorization server

The backend serves them at the issuer origin (Backend 045 Resolved Decision 15), without the Admin shell. The prototype `/prototype/harness-login` is their visual reference. Every page shows the Chokepoint mark (the current favicon), "Chokepoint" and "{workspace} · {environment}".

1. **Choose provider** (only with more than one provider allowed): "Sign in to continue", the harness line ("{harness} on this computer is asking to act for you."), one button for each provider.
2. **Choose agent** (only with more than one eligible agent): the signed-in person and one button for each agent, with its servers and "via group {group}".
3. **Consent**: "Allow {agent} to act for you?", the harness line, the signed-in person and group, **It will be able to use** (servers, tools and resources), "Every call is checked by Chokepoint with the rules your administrator set. You can not change them here.", the validity ("Valid for {n} days, until {date}…"), "Only for this computer. Your administrator can revoke it at any time.", **Deny** and **Allow**.
4. **Connected**: "You are connected. Return to {harness}. You can close this tab."
5. **Refused, no group**: "You can not use {harness} here", the signed-in person, "not in a group that your administrator allowed", and a reference code.
6. **Refused, blocked**: "Access to {harness} is blocked", and a reference code.

### 6. Limitations shown in the screen

1. Group removal window (section 1, point 7).
2. Okta without groups (section 1, point 10).

---

## Backend dependencies

All contracts are in [Backend 045](../../backend/specs/045-2026-11-03-interactive-agent-login.md) (2026-11-03).

1. **`person_consent` and `blocked` in the permission document:** Administration API 3 and 4.
2. **Groups of an identity connection:** Administration API 3a, Resolved Decision 26 (one `Groups` contract of the IdP adapter; matching by group ID).
3. **Client allowlist with `client_name` and `other_agents`:** Administration API 2.
4. **Harness catalog:** Administration API 3b, Resolved Decision 27 (`platform_config`, key `harness_catalog`).
5. **Consents and grants, revocation:** Administration API 5.
6. **Login client of an identity connection:** Administration API 1.
7. **MCP ingress URL:** Backend 030 Resolved Decision 15.
8. **Pages of the authorization server:** Solution 5 and Resolved Decisions 15 and 16 of Backend 045; their content is section 5 of this specification.

**Waiting backend chip.** In the prototype, each element that needs one of these items has a "Waiting backend · 045" chip. When the backend implements an item, remove the chip of each element that it unblocks, in the same change. The real Admin never shows the chip.

---

## Testing Decisions

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build`. The user runs the interface test in the built-in browser.

---

## Acceptance Criteria

- [x] 1. The Harness login block cannot be published on without a group, and the rule box states that only members of the groups can log in.
- [x] 2. Groups come from the groups read, and a missing group is marked. — groups read and `ids` checked live; the "Not found" mark by code inspection.
- [x] 3. Blocking a person is part of the draft and shows in the revision history. — block published from the draft as revision 8; history by code inspection.
- [x] 4. The Harness login card is the second card of the Identity view, with the MCP URL on one line and the catalog buttons. — one MCP URL line for each server of the agent (deviation, see Further Notes).
- [x] 5. The Harness sessions view lists people and machines and revokes one machine.
- [x] 6. The identity connection form has the Harness login section without a groups claim field.
- [x] 7. The pages of the authorization server match section 5. — consent, connected, blocked and not-allowed pages checked live; provider and agent choice by unit tests.
- [x] 8. Every help opens on hover and focus. — code inspection: every help uses the shared Tooltip.
- [x] 9. No "Waiting backend" chip remains for an implemented item.
- [x] 10. `npm run check` and `npm run build` pass.
- [x] 11. The interface test passed. — run by Claude in the built-in browser on 2026-11-03, as the user decided ("quem testa é vc"): harness login, consent, sessions, revoke, block and the connection form.

---

## Out of Scope

- A SaaS administration screen for `platform_config` (Backend 045 Resolved Decision 27).
- A self-service page where the person lists or revokes their own machines.
- Enterprise-Managed Authorization (ID-JAG).
- Web clients (non-loopback redirects).

---

## Further Notes

- **Implementation decisions (2026-11-03):**
  - The MCP URL for developers is one line for each server of the agent, because the ingress needs the server ID (Backend 045 Resolved Decision 28). Before the first publication of tools, the card says so.
  - The catalog has Claude Code and Visual Studio Code, the harnesses whose CIMD document was verified (Backend 045 Resolved Decision 29). Their icons are generic Admin icons in `public/brands`, not vendor logos.
  - Block in the Harness sessions view adds the person to the local draft of the Delegation and access editor, next to its unsaved edits (code review, 2026-11-03).
  - The group search waits 300 ms after typing before it reads the directory.
  - The Admin header, favicon and touch icon use the Xokepoint mark of the home (frontend specifications 010 and 011); the pages of the authorization server use it too.

- When the real screens are implemented, remove `src/features/prototype/harness/` and its routes ([visual specification](../docs/design-system/visual-specification.md), point 7).
- The CIMD URLs in the prototype are placeholders. The real ones come from the catalog (Backend 045 Resolved Decision 27).
