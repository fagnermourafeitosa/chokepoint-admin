# Specification: Quick Incident

- **Specification ID**: 039
- **Date**: 2026-11-04
- **Slug**: quick-incident
- **Status**: Implemented
- **Owner**: Admin — shared component (`src/components/quick-incident`), Overview (`src/features/overview`), Access (`src/features/access`), Investigate (`src/features/investigate`)
- **Related Specification**: [Backend 053 — Incident Codes for Refusals](../../backend/specs/053-2026-11-04-incident-codes.md) (the code on every refusal, `GET …/incidents/:code`, `login_error` and its `cause`)
- **Related Specification**: [037 — Harness Login Reasons in Investigate](037-2026-11-03-harness-exchange-reasons.md) (the **Reference** fact, the hints of the harness reasons)
- **Related Specification**: [030 — Investigate](030-2026-10-31-investigate-agent-subject-and-token-exchanges.md) (the decision and exchange inspectors)
- **Public documentation**: Frontend 019 — **merge gate**, see Acceptance Criteria 7
- **Visual reference**: the layout prototype in this branch (`src/components/quick-incident`, placed on the three pages), run on 2026-11-04 against the local backend. It is the visual specification; where it differs from this text, this text wins.

---

## Context & Background

After Backend 053 every recorded refusal has a reference code: a denied tool call shows it in the MCP error, a refused token exchange in `error_description`, a refused login on its page with the workspace and the environment. One endpoint resolves a code to a decision or an exchange.

Today the Admin finds a code only through the search of **Token exchanges** in Investigate, a substring search that also matches subject, issuer and reason. That search is useful and stays.

---

## Problem Statement

### 1. No fast path from a code to the incident

A security operator receives "Reference k3f7-x2ab". They must know to open Investigate, switch to Token exchanges and search. A decision code has no path at all.

### 2. `login_error` is unknown to Investigate

The list, the Reason filter and the inspector have no label, hint or fact for `login_error` and its cause.

---

## Solution

1. A **Quick incident** control on the title row of Overview, Access and Investigate, right-aligned.
2. It resolves a code with `GET …/incidents/:code` in the current environment and opens the decision or exchange inspector.
3. Labels, hints and the **Cause** fact for `login_error`; the **Reference** fact on decisions.

### Placement

| Page | Row |
| :--- | :--- |
| Overview | The status line ("{environment} · {n} items need you") |
| Access (every sub-page) | The Access sub-navigation strip |
| Investigate | The page heading, right of the title |

It is right-aligned with `margin-inline-start: auto`. Below 640 px only the icon shows.

### Control

- **Closed**: a secondary button with the search-bug icon (a magnifier with a small bug inside), "Quick incident" and the shortcut hint `/`.
- **Open** (click or `/` outside a text field): a code field with the placeholder `k3f7-x2ab` in monospace, a primary icon button **Find incident** with the same icon, and a close button. Enter or the icon button finds; Esc, the close button or a click outside closes.
- **Help panel** under the field, before the first search: "Paste the code a person or a developer sent you." and the three sources: refused harness login page, denied tool call, refused token exchange.

### Behavior

- Input: `incident.Normalize` rules of Backend 053 (trim, lowercase, optional dash). A malformed code shows "A reference code has 8 characters, like k3f7-x2ab." without a request.
- One match: navigate and close.
  - `exchange` → `/investigate?view=exchanges&exchange_id={id}`
  - `decision` → `/investigate?view=decisions&decision_id={id}`
- More than one match: a short list in the panel, one row per match (kind, time), each opening its inspector.
- No match: "No refusal with `{code}` in {environment}. Check the code and the environment named with it. Codes older than the retained history are deleted." No hint about other environments or workspaces.
- 400: the format message. Other errors: "The lookup could not be completed. Try again."
- `/investigate?incident={code}` runs the lookup on load, so a link with the code works.

### `login_error`

| Reason | Short (list, filter) | Sentence (inspector, row hover, Inbox) |
| :--- | :--- | :--- |
| `login_error` | Sign-in could not continue | Harness login: the sign-in stopped before consent. The person saw a generic page with the reference code. |

What to check, by `cause`:

| Cause | Hint | Action |
| :--- | :--- | :--- |
| `invalid_request` | The harness sent a malformed authorization request. Check the harness version. | — |
| `invalid_client_id` | The harness did not send a valid client metadata URL. Check the harness version. | — |
| `client_metadata_invalid` | The client metadata document of the harness could not be read or is not valid. Check its URL in the allowed harnesses. | Open the agent identity, when an agent is recorded |
| `redirect_uri_invalid` | The harness asked to return to an address its metadata document does not list. Check the harness version and its document. | Open the agent identity, when an agent is recorded |
| `transaction_expired` | The sign-in expired, was used twice or was continued in another browser. The person must start again from the harness. | — |
| `provider_not_available` | The chosen identity provider does not allow harness login for this harness. Check the Harness login of the identity provider. | Open the identity provider |
| `server_error` | Chokepoint could not complete the sign-in. Check the backend logs at this time. | — |

Facts: **Cause** after **Reason**. **Returned to the agent**: "A generic page with the reference code". **Subject** when missing: "Not signed in: the sign-in stopped before the identity provider".

### Reference on decisions and exchanges

- Decision inspector: fact **Reference** when present; "Returned to the agent" mentions the code.
- Exchange inspector: **Reference** is now shown for every refusal that has one, not only harness logins.

### Investigate search

Unchanged in behavior. The placeholders mention the code and fit the field: "Search agent, tool, person or code…" and "Search agent, subject or code…".

---

## Practical Gains & Operational Outcomes

- From any code to its incident in one action, from any main page.
- Decisions and exchanges share one entry point; a future kind is one route.

---

## User Stories

- [x] 1. As a security operator, I paste a code in Quick incident on any main page and the incident opens.
- [x] 2. As a security operator, I am told plainly when the code is not in this environment.
- [x] 3. As a security operator, I see the cause of a **Sign-in can not continue** page and what to check.
- [x] 4. As a security operator, I share a link with `?incident=` and it opens the same incident.
- [x] 5. As a security operator, I open Quick incident with `/`.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language

**Incident**, **reference code**, **incident kind** as in Backend 053. **Quick incident** is the Admin control.

### 2. Aggregate Root & State Transitions

None. The control is a query; the inspectors gain facts.

### 3. Commands, Queries & Domain Ports

- `incidentApi.find(scope, code)` → `{ code, items: { kind: 'decision' | 'exchange', id, occurred_at }[] }`.
- A route map `kind → path`, the only place a new kind is added.
- `Exchange.cause`, `Decision.reference` in `types.ts`.

---

## Implementation Decisions

### Resolved decisions (grilling, 2026-11-04)

1. A **Quick incident** control on every main page, not only Investigate; the Investigate search stays.
2. Right-aligned on the title row of each page, not in the top header.
3. A button that opens a field; `/` opens it; Enter or the icon button finds.
4. Icon: a magnifier with a bug.
5. Codes of every refusal (decision and exchange) through one endpoint (Backend 053).
6. Lookup in the current environment only; no "found but no access" state (membership grants every environment).
7. The cause of a login error is shown only in Investigate.
8. Public documentation (Frontend 019) before merge to main.

### Backend dependencies

All in [Backend 053](../../backend/specs/053-2026-11-04-incident-codes.md): codes, `GET …/incidents/:code`, `login_error`, `cause`, `reference` on decisions.

### Admin code changes

- `src/components/quick-incident`: `QuickIncident.tsx`, `quick-incident.css`, `api.ts` (lookup and route map), normalization helper.
- `OverviewDashboard.tsx`, `AccessNavigation.tsx`, `Investigate.tsx`: place the control; CSS of each row.
- `useInvestigation.ts`: `incident` URL parameter.
- `labels.ts`, `ExchangeInspector.tsx`, `DecisionInspector.tsx`, `types.ts`: `login_error`, hints by cause, **Cause** and **Reference** facts.
- `InvestigationToolbar.tsx`: placeholders.
- Remove the prototype comments and the **Waiting backend** chips of the help panel.

---

## Testing Decisions

- No automated tests: the Admin has none (Admin AGENTS.md, Verification). `npm run check` and `npm run build`.
- Functional test in the built-in browser: [039-2026-11-04-quick-incident](functional-tests/039-2026-11-04-quick-incident.md).

---

## Acceptance Criteria

- [x] 1. Quick incident is on Overview, Access (all sub-pages) and Investigate, right-aligned on the title row. — checked in the built-in browser on `/`, `/access` and `/investigate`.
- [x] 2. A decision code and an exchange code each open their inspector. — `BMBO2573` from Overview opened decision 83; `aq56-k5pj` from Access opened exchange 163 (against the Backend 053 branch on 127.0.0.1:8083).
- [ ] 3. Format, not-found and multiple-match behaviors as in Solution. — format (`k3f9-x2ab`) and not found (`zzzz-zzzz`) checked in the browser. The list of several matches is checked by code inspection only: no environment has two equal codes.
- [x] 4. `login_error` has its label, sentence, hints by cause and the **Cause** fact; decisions show **Reference**. — exchange 163 (`redirect_uri_invalid`) and decision 83.
- [x] 5. `?incident=` and `/` work. — `/investigate?incident=x4av-75q6` opened exchange 162 and cleared the parameter; the `/` key opened the field on Access.
- [ ] 6. Functional test: [039-2026-11-04-quick-incident](functional-tests/039-2026-11-04-quick-incident.md). — open: S3 blocked (see the file)
- [x] 7. **Merge gate**: the public documentation (Frontend 019) is updated before this work is merged to main. — Frontend 019 merged first (frontend `95e617b`), with the `quick-incident` capture and the `quick-incident` recording scenario of the demo instance.

---

## Out of Scope

- Lookup across environments or workspaces.
- A command palette or a global search of other objects.
- Changes to the Investigate search beyond its placeholders.

---

## Further Notes

- The prototype in this branch resolves only the existing login codes, through the substring search of the exchanges and an exact match in the browser. It marks decision and token exchange codes **Waiting backend · 053**.
