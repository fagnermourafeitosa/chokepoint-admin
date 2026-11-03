# Specification: Harness Login Reasons in Investigate

- **Specification ID**: 037
- **Date**: 2026-11-03
- **Slug**: harness-exchange-reasons
- **Status**: In Progress
- **Owner**: Admin — Investigate (`src/features/investigate`), with the agent view target of Access (`src/features/access`)
- **Related Specification**: [Backend 045 — Interactive Agent Login](../../backend/specs/045-2026-11-03-interactive-agent-login.md) (the six new issuance denial reasons, `client_id` and `reference` of an issuance)
- **Related Specification**: [036 — Interactive Harness Access](036-2026-11-03-interactive-harness-access.md) (Harness login block, Harness login card, Harness sessions view)
- **Related Specification**: [030 — Investigate](030-2026-10-31-investigate-agent-subject-and-token-exchanges.md) section 4 (the exchange reasons, their hints and actions)
- **Public documentation**: Frontend 015, `platform/operations/token-exchange-inspector.mdx` (table "Each reason")

---

## Context & Background

Backend 045 records six new denial reasons in the token exchanges list: `no_group`, `blocked`, `not_allowed_client`, `code_reuse`, `refresh_reuse` and `dpop_invalid`. An issuance of a harness login also has `presence`, `grant_id`, `client_id` and `reference` (`ExchangeRow`). Admin 036 added the Harness login block, the Harness login card and the Harness sessions view. The public documentation (Frontend 015) describes each reason with its meaning, what to check and what the client gets.

`src/features/investigate/labels.ts` (`exchangeShort`, `exchangeText`) and the hints of `ExchangeInspector.tsx` know only the six reasons of Backend 034.

---

## Problem Statement

### 1. The list shows the backend description

`DecisionLists.tsx` shows `exchangeShort[label] ?? description`. A new reason shows the long backend sentence, and its row has no hover text.

### 2. The Reason filter does not offer the new reasons

`InvestigationToolbar.tsx` builds the options from `exchangeShort`. An administrator can not filter by `no_group` or `dpop_invalid`.

### 3. The inspector has no "What to check" for the new reasons

`hints[reason]` is undefined, so the inspector shows "The agent proved its key, the token of the subject was valid…", which is wrong for a refused exchange.

### 4. Some facts of the inspector are wrong for a harness login

- **Returned to the agent** says `invalid_grant`. A refused login gets a refused page with a reference code, and a DPoP failure can get `invalid_dpop_proof`.
- **Subject** says "Not verified: the token signature was not valid" for every missing subject. A harness login has no subject token.
- The inspector does not show the harness (`client_id`) or the reference code that the person saw on the refused page.

### 5. Access can not open the Identity or the Harness sessions view

`/access?agent_id=…` always opens the Delegation and access view. The allowlist of harnesses is in the Identity view, and the machines are in Harness sessions.

---

## Solution

1. Add the six reasons to `ExchangeReasonLabel`, `exchangeShort` and `exchangeText` (table below). The list, the Reason filter and the Inbox (`attention/targets.ts`, which uses `exchangeText`) get them with no other change.
2. Add a hint and an action for each reason to the inspector (table below).
3. Add `view=identity|sessions` to the Access target. The agent opens in that view. Without it, the Delegation and access view opens as today.
4. Add `client_id` and `reference` to the `Exchange` type, and the facts **Harness** and **Reference** when they are present.
5. Correct the **Returned to the agent** and the missing **Subject** texts for the new reasons.

### Labels

| Reason | Short (list, filter) | Sentence (inspector, row hover, Inbox) |
| :--- | :--- | :--- |
| `no_group` | Person not in an allowed group | Harness login: the person is not in an eligible group of an agent of this harness. |
| `blocked` | Person blocked on the agent | Harness login: the person is blocked on the agent. |
| `not_allowed_client` | Harness not allowed | Harness login: the harness is not allowed for an agent. |
| `code_reuse` | Authorization code used twice | An authorization code was used twice. Chokepoint revoked the machine. |
| `refresh_reuse` | Refresh token used twice | A refresh token was used twice. Chokepoint revoked the machine. |
| `dpop_invalid` | DPoP proof not valid | The DPoP proof is missing, not valid or from another key. |

### What to check

| Reason | Hint | Action (agent recorded) | Target |
| :--- | :--- | :--- | :--- |
| `no_group` | Check if this person must be in a group chosen in the Harness login of the identity provider. | Open the harness login | `section=people&connection_id={subject connection}` |
| `blocked` | Check if the block of this person is still needed. Unblock the person in the Harness login of the identity provider. | Open the harness login | `section=people&connection_id={subject connection}` |
| `not_allowed_client` | Check the allowed harnesses of the agent. Add this harness if the agent must accept it. | Open the agent identity | `view=identity` |
| `code_reuse` | Check if the code leaked from the computer of the person. Chokepoint revoked the machine; the person must log in again. | Open the harness sessions | `view=sessions` |
| `refresh_reuse` | Check if the refresh token was copied from the computer of the person. Chokepoint revoked the machine; the person must log in again. | Open the harness sessions | `view=sessions` |
| `dpop_invalid` | Check if the token was copied from the harness that holds the key. | Open the harness sessions | `view=sessions` |

When the exchange has no agent, the inspector shows the hint and this text, without a button:

- `no_group`, `blocked`, `not_allowed_client`: "Several agents or no agent use this harness. Check the Harness login of each agent that must accept this person."
- `code_reuse`, `refresh_reuse`, `dpop_invalid`: "The request named no agent of this environment."

The rule of a deleted agent does not change (Admin 032 section 7).

### Facts

- **Subject**, when it is missing:
  - `no_group`, `blocked`: "Not recorded: the identity provider is disabled or does not allow harness login".
  - `not_allowed_client`: "Not checked: the harness was refused before the login".
  - `dpop_invalid`: "Not checked: the DPoP proof failed first".
  - `code_reuse`, `refresh_reuse`: "Not recorded: the machine was not found".
  - The texts of the Backend 034 reasons do not change.
- **Harness**: `client_id`, when present.
- **Reference**: `reference`, when present.
- **Returned to the agent**:
  - `no_group`, `blocked`: "A refused page with the reference code".
  - `not_allowed_client`: "A refused page with the reference code" when `reference` is present, else `invalid_grant` (a refresh after the harness was removed).
  - `code_reuse`, `refresh_reuse`: `invalid_grant`.
  - `dpop_invalid`: "`invalid_dpop_proof` or `invalid_grant`" (the record does not say which).
  - The Backend 034 reasons do not change.

---

## Practical Gains & Operational Outcomes

1. **A readable list and filter**:
   - *Before*: "The person is not in an eligible group of the agent." in the row; no filter option.
   - *Now*: "Person not in an allowed group" in the row and in the Reason filter.
2. **A correct inspector**:
   - *Before*: a refused login says that the subject delegated to the agent and that the agent got `invalid_grant`.
   - *Now*: it says what to check, opens the place of the fix, and shows the harness and the reference code.

---

## User Stories

- [ ] 1. As an administrator, I read a short label for each harness login reason in the token exchanges list.
- [ ] 2. As an administrator, I filter the token exchanges by each harness login reason.
- [ ] 3. As an administrator, I open the place that fixes a refused harness login from the inspector.
- [ ] 4. As an administrator, I see the harness and the reference code of a refused login, so I can match the code that a person sends me.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language

- **Context**: Admin — Investigate. The backend owns the reasons and their records.
- **Package Ownership**:
  - `src/features/investigate/types.ts` (`ExchangeReasonLabel`, `Exchange`), `labels.ts` (`exchangeShort`, `exchangeText`), `ExchangeInspector.tsx` (hints, actions, facts).
  - `src/features/access/target-context.ts` (`AccessTarget.view`), `components/AgentDetails.tsx` (initial view from the target).
- **Terms**: *Harness*, *Harness login*, *Blocked* and *Harness sessions* as in Admin 036. *Reference code* as in Backend 045 Resolved Decision 4.

### 2. Aggregate Root & State Transitions

- No state. It is display and navigation only. Navigation never changes permissions (Admin 030 section 3).

### 3. Commands, Queries & Domain Ports

- No new request. The list, the problems and the detail of the exchanges already return the reasons, `client_id` and `reference` (Backend 045).
- Access URL: `view` is `identity` or `sessions`. Another value is ignored.

---

## Implementation Decisions

1. The order of the Reason filter is the order of `exchangeShort`: the Backend 034 reasons, then the harness login reasons.
2. `view` is part of the place that resets the agent view in `AgentDetails`, so a new navigation with another view opens that view.
3. `accessTarget` accepts a URL that has only `agent_id` and `view`.
4. The labels use the reason codes of the public documentation and do not rename them.

---

## Testing Decisions

This module has no automated tests (`AGENTS.md`, Verification).

- `npm run check` and `npm run build`.
- Functional test in the built-in browser as `admin-a`: the list rows, the Reason filter, and the inspector of each new reason that local data can produce (a refused harness login gives `no_group`, `blocked` or `not_allowed_client`). Each action opens the expected place. A reason that local data can not produce is checked by code inspection and recorded here.

---

## Acceptance Criteria

- [ ] 1. Each of the six reasons shows its short label in the token exchanges list and in the problems, with the sentence as hover text.
- [ ] 2. The Reason filter offers the six reasons and filters by them.
- [ ] 3. The inspector shows the sentence, the hint and the action of each reason, and the text without a button when there is no agent.
- [ ] 4. `/access?agent_id=…&view=identity` opens the Identity view and `view=sessions` opens Harness sessions. Without `view`, the Delegation and access view opens.
- [ ] 5. The inspector shows **Harness** and **Reference** when present, and the **Subject** and **Returned to the agent** texts of this specification.
- [ ] 6. `npm run check` and `npm run build` pass.
- [ ] 7. The functional test in the built-in browser passed.

---

## Out of Scope

- `presence` and `grant_id` in the inspector.
- A filter by harness or by presence.
- Backend changes: the reasons, their descriptions and the search by reference code exist (Backend 045).
- The public documentation: Frontend 015 already describes these reasons.

---

## Further Notes

- The search of the exchanges already matches the reference code (Backend 045), so the reference that a person sends finds the refused login.
- `no_group`, `blocked` and a login-time `not_allowed_client` have an agent only when one agent is a candidate for the harness (Backend 045, `interactive.go`).
