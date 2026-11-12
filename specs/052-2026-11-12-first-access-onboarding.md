# Specification: First-access Onboarding

> Approved by the user on 2026-11-12, after the layout approval on the prototype (the tour of 11 steps) and the test of the filled Sandbox of the demo instance. Implemented on 2026-11-12, with Backend 085.

- **Specification ID**: 052
- **Date**: 2026-11-12
- **Slug**: first-access-onboarding
- **Status**: Implemented
- **Owner**: Admin — Overview
- **Related Specification**: [051 — Account Area](051-2026-11-11-account-area.md)
- **Visual reference**: prototype [`specs/prototypes/052-2026-11-12-first-access-onboarding/`](prototypes/052-2026-11-12-first-access-onboarding/), page `/prototype/first-access`, branch `design/052-first-access-onboarding`

---

## Context & Background

After signup, the person types the name of the first workspace (`/onboarding/workspace`, Admin 005). With one workspace, the Admin selects it and opens the Overview (`/`). The Admin opens in Sandbox. In a new workspace every screen is empty, and the Overview shows no guidance.

---

## Problem Statement

### 1. No first steps

A new administrator does not know where to start or in which order.

### 2. The first call needs too much

A call needs an identity provider, an agent, a running MCP server and permissions. The people who delegate to an agent come from the directory of an identity provider, and the token exchange needs a subject token that a trusted identity provider signed (Backend 030, 032). To register an MCP server, the backend runs discovery (`POST .../discover`): the server must already run, be reachable and accept the token that the platform sends (Backend 040). Most people who only want to see the product cannot pass this.

---

## Solution

1. When the first workspace is created, its Sandbox is filled with a sample: a sample identity provider, a sample agent, a sample MCP server, a sample context source, permissions and rules, and calls.
2. The services of the sample (its identity provider, MCP server and context source API) run outside the backend and the Admin, as the services of a customer. The provisioner runs inside the backend and fills the Sandbox through the internal services.
3. The first access lands on the normal screens, already filled. A guided tour goes through the filled sections: the identity provider, the MCP server, the context source, the agent and its permissions, and Investigate. It is built with `react-joyride` 3.2.0 (MIT, React 16.8 to 19), with a custom tooltip made of design-system classes.
4. Production stays empty for the real setup.

---

## Implementation Decisions

- **No setup screen** (user, 2026-11-12). The first-draft screen with the numbered setup steps is removed. The tour goes through the filled screens instead.
- **Sample Sandbox** (user, 2026-11-12): each new workspace gets a Sandbox already filled with the sample. Production stays empty.
- **Trigger** (user, 2026-11-12): the provisioner runs when the first workspace of the person is created. Only the first workspace gets the sample.
- **The provisioner runs inside the backend** (user, 2026-11-12): it writes through the internal services, not through the public API. The public API accepts only the session of a signed-in person (cookie and CSRF), and it has no API key or service token. Not chosen: a short-lived provisioning token for an external provisioner (a new credential in the product), and the Admin passing the session of the person to the provisioner (weakens the session; a closed tab leaves the Sandbox half filled).
- **The provisioner is a separate package** (user, 2026-11-12): its own package in the backend, only for the sample. It calls the existing services as they are. No type, class or rule of the product changes for the sample, and the product has no sample logic, except the call of the trigger.
- **Calls with a temporary key** (user, 2026-11-12): the provisioner gives the sample agent a key, makes a few real calls (allowed and denied) through the token exchange and the MCP ingress, and then removes the key. The sample agent ends with no key, so the person reaches it only from Claude Code. Not chosen: no first calls (an empty Investigate in step 11), and calls written straight into the trace (records that no call produced).
- **The services of the sample are external** (user, 2026-11-12): the realm, the sample MCP server and the sample context source API run outside the backend and the Admin, as the services of a customer. This follows the demo applications of Permit.io and Sentry. The provisioner is in the backend (see above).
- **Sample identity provider** (user, 2026-11-12): one shared realm `xokepoint-samples` in the Xokepoint Keycloak, separate from the platform realm `chokepoint-platform`. It holds only fictitious people. No customer email is in it, so the shared directory shows no person of another workspace. Sample people never sign in to the Admin. This follows the Citadel identity provider of Aserto and the Test Identity Provider of WorkOS.
- **Test from outside the Admin** (user, 2026-11-12): the person signs in as one of the fictitious people, for example from Claude Code. Every fictitious person has the password `123`, the same in every workspace.
- **Sample content** (user, 2026-11-12): a sample MCP server with a simple tool (for example, echo), a sample agent with delegation, one CEL rule, and one rule that reads a trusted attribute from a sample context source. The context source receives the subject as a parameter, to show that a context source can receive parameters. The sample is about refunds (user, 2026-11-12): the MCP server `Sample Billing` with `get_order` and `refund_order`, the rule `amount <= 500`, and the trusted attribute `refund_limit` ([Backend 085](../../backend/specs/085-2026-11-12-first-workspace-sample.md)).
- **The screen is not the Overview** (user, 2026-11-12): superseded by "No setup screen".
- **The tour shows the rules of a tool** (user, 2026-11-12): it opens the side panel of a tool that has rules and shows the rule on the call arguments and the rule on the trusted attribute.
- **Claude Code is allowed for the sample agent** (user, 2026-11-12): the sample comes with Claude Code as the only allowed harness of the sample agent (no Codex) (Identity view, Harness login card, Admin 036). The tour shows that card, with the MCP URL of the sample server.
- **The tour shows how to set up Claude Code** (user, 2026-11-12): the command `claude mcp add --transport http --client-id https://claude.ai/oauth/claude-code-client-metadata sample <MCP URL>` (without `--client-id`, Claude Code tries dynamic client registration, which the platform does not offer), then `/mcp` in Claude Code and the login as a sample person. The command is ready to paste: it has the MCP URL of the sample server, and it has a copy action (user, 2026-11-12). Then it shows the Harness sessions view, where each login appears.
- **The tour starts once, in the browser** (user, 2026-11-12): it opens by itself the first time the Admin shows a Sandbox, and not again after it ends or is skipped. The browser keeps that in `localStorage`; a private window or another browser shows it again. Not chosen: a flag in the account (a backend change), never by itself.
- **The tour is generic, in any Sandbox** (user, 2026-11-12): each stop uses what the screen shows (the first agent, the first tool with rules, the Harness login card), and a stop whose target is not on the screen is skipped. The Admin knows no name of the sample. Not chosen: only when the Sandbox has the sample, recognized by its names (sample names in the Admin code).
- **"Take the tour"** (user, 2026-11-12): a floating button at the bottom right, as in the prototype, only in the Sandbox, opens the tour again. Not chosen: an item in the account menu.
- **Loading steps for the first workspace** (user, 2026-11-12; Backend 085 decision 22): while the first workspace is created, the Admin shows "Preparing your workspace" with four steps that are marked one by one ("Creating the workspace", "Setting up Sandbox and Production", "Preparing the Sandbox", "Opening the Admin"). The timing is simulated, at least 3.6 s. It shows on the onboarding page and in the create dialog of the account area, which is where a person without a workspace lands after sign-in (Admin 051). After the first workspace is created in the account area, the Admin opens it, in its Sandbox, where the tour starts.
- **Generic copy** (user, 2026-11-12): the texts of the tour name no sample, person, password or tool, because the tour runs in any Sandbox. The command of stop 9 names the server `agent`. Supersedes the sample wording of "The tour shows how to set up Claude Code" (the server name `sample` and the login as a sample person with the password `123`).
- **Call simulator: another specification** (user, 2026-11-12). The Admin has no simulator of an agent call today; Report-only mode (Admin 041) records would-deny calls of real traffic only. The simulator is independent of this tour.

---

## Backend dependencies

The first three items run outside the backend and the Admin. The provisioner and the trigger are in the backend.

- **Sample realm** `xokepoint-samples` in the Xokepoint Keycloak, with the fictitious people (password `123`) and a read-only directory client.
- **Sample MCP server** with a simple tool, reachable from the platform, that accepts the token that the platform sends.
- **Sample context source API** that receives the subject as a parameter and returns a trusted attribute.
- **Provisioner** in the backend that fills the Sandbox of a new workspace through the internal services: the identity provider connection with Harness login and its group, the MCP server and its reviewed tools, the context source and its binding, the agent, its delegation, its tool grants, the two rules, Claude Code as the only allowed harness of the agent, and calls.
- **Trigger**: the creation of the first workspace of a person starts the provisioner.

---

## Out of Scope

- A simulator of agent calls (another specification).
- A sample in Production. Production stays empty.
- A sample in the workspaces after the first one.
- Clearing or recreating the sample of the Sandbox.
- A headless agent in the sample. The sample agent is reached only from Claude Code (interactive mode).

---

## Further Notes

- **Implementation verified on the demo instance (2026-11-12)**, branch `feat/052-first-access-onboarding`: `src/features/onboarding/FirstAccessTour.tsx`, mounted in `AdminLayout`. On the Acme Sandbox, the tour opened by itself and went through the 11 stops on the real screens (`/`, `/access/integrations`, `/access/context-sources`, `/access`, `/investigate`); stop 7 rendered inside the side panel; stop 9 showed the command with the MCP URL of the Harness login card. After Done it did not open again on reload; "Take the tour" opened it again; in Production neither the tour nor the button shows. Type check, lint and build pass.
- **Loading steps verified (2026-11-12)**: the seed user `no-access`, with no workspace, created `Harbor Supplies` in the account area. The four steps were marked one by one; then the Admin opened the Sandbox of the new workspace, the tour started by itself and went through the 11 stops over the sample that Backend 085 provisioned.

- **Direction, not in this specification** (user, 2026-11-12): a platform super administrator (the user), with a screen to administer the whole platform and to sign in as any user (impersonation). No specification yet.

- `react-joyride` analysis: see the prototype. The library adds a dependency to the Admin; the Admin AGENTS.md says not to change the stack silently, so the dependency needed user approval. Approved with the specification on 2026-11-12.
- **Claude Code test on the demo instance, 2026-11-12: passed, with a local workaround.** Claude Code 2.1.317, the command of step 9 (with `--client-id`), `claude mcp login`, sign-in to the realm `acme` as Rafael Souza (group Finance), Allow on the consent page, `claude mcp list` Connected. Through Claude Code, `refund_order` of 100 was allowed, and of 800 was denied with reference `fsbu-67y5`: reason `condition`, rule "Refund up to 500", presence `interactive`.
  - First the authorization server refused the login with `client_metadata_invalid`. Cause: `dev-infra/demo-instance/up.sh` exports `SSL_CERT_FILE` with only the mkcert authority before it starts the API. Go 1.27 on macOS honors that variable, so the API rejects the certificate of `claude.ai` (`x509: certificate signed by unknown authority`). Backend 079 already records this as a follow-up in `dev-infra`. For this run the demo API was restarted without `SSL_CERT_FILE`; the mkcert authority is in the macOS system keychain.
  - Fixed in `dev-infra` branch `fix/052-demo-sandbox` (worktree `dev-infra-052`, not committed): `demo-instance/up.sh` passes `SSL_CERT_FILE` only to the Python processes; the API starts without it. Verified: the API fetched the Claude Code CIMD again and sent the authorization to the realm `acme`.
- **The Sandbox of the demo must be filled** (user, 2026-11-12), with the same data as Production if needed. In the real product, Production stays empty. Done on 2026-11-12, in the same `dev-infra` branch (not committed):
  - `populate.py` and `traffic.py` take `--environment sandbox`, with their own agent keys and state in `.local/sandbox/`.
  - The WAF of the local Envoy (Coraza, OWASP CRS rule 934110) refuses a loopback address in a request body as SSRF: the endpoint of the MCP discovery (`http://127.0.0.1:8780/mcp`, also `localhost`) and the `base_url` of the context source (`http://127.0.0.1:8790`). The Production servers were registered before the WAF existed. Decision (user, 2026-11-12): `populate.py` sends only these two requests to the API directly (`DEMO_API_ADDRESS`), with the session cookie and the headers that Envoy adds. The WAF does not change.
  - The harness login of `refunds-assistant` was copied from Production to the Sandbox once, by hand (a scratch script): the Sandbox callback in the redirect URIs of the Keycloak client `acme-harness-login`, harness login on in the Sandbox identity connection, person consent for the group Finance, and Claude Code as the only allowed harness. `populate.py` does not do it, as in Production.
  - Verified: `./traffic.py --environment sandbox --once` made allowed and denied calls. The 11 steps of the tour show Sandbox and the Sandbox data. Claude Code logged in to the Sandbox MCP URL as Rafael Souza (consent page "Acme · sandbox"); `refund_order` of 100 was allowed and of 800 denied (reference `6ql5-yifw`); the Harness sessions step shows Rafael Souza with Claude Code.
- The prototype runs on the demo instance. Its tour goes through the Sandbox screens of the Acme data, which stand in for the sample.
