# Specification: Investigate with Agent, Subject and Token Exchanges

- **Specification ID**: 030
- **Date**: 2026-10-31
- **Slug**: investigate-agent-subject-and-token-exchanges
- **Status**: Implemented
- **Owner**: Admin — Investigate, Inbox and Overview
- **Design**: [Agent delegation authorization](../../backend/docs/agent-delegation-authorization.md)
- **Related Specification**: [Backend 034 — Decision Trace with Actor and Relations](../../backend/specs/034-2026-10-31-decision-trace-actor-and-relations.md)
- **Related Specification**: [Backend 031 — PDP Relation Checks and Call Conditions](../../backend/specs/031-2026-10-31-pdp-relation-checks-and-call-conditions.md)
- **Related Specification**: [Backend 023 — Decision Trace Read API](../../backend/specs/023-2026-10-29-decision-trace-read-api.md), [Backend 025 — Overview Aggregation API](../../backend/specs/025-2026-10-29-overview-aggregation-api.md)
- **Related Specification**: [026 — Agent Delegation Editor](026-2026-10-31-agent-delegation-editor.md), [028 — Remove Lifecycle Sync Screen and Google Warnings](028-2026-10-31-remove-lifecycle-sync-screen-and-google-warnings.md), [029 — Agent Identity and Chokepoint Token Setup](029-2026-10-31-agent-identity-and-chokepoint-token-setup.md)
- **Superseded in part**: [018 — Attention Signals Inbox](018-2026-10-29-attention-signals-inbox.md), [020 — Investigate Problems and Decisions](020-2026-10-29-investigate-problems-and-decisions.md), [021 — Overview Dashboard](021-2026-10-29-overview-dashboard.md)
- **Visual reference**: layout prototype at `/prototype/investigate` in the Admin (`src/features/investigate/prototype`), with the Inbox signals and the three views. Fixed data. It is the visual specification of this screen; where it differs from this text, this text wins. Archived prototype: [`specs/prototypes/030-2026-10-31-investigate-agent-subject-and-token-exchanges/`](prototypes/030-2026-10-31-investigate-agent-subject-and-token-exchanges/) (see [the prototype index](prototypes/README.md)).

---

## Context & Background

Investigate (Admin 020) lists problems and decisions with the recorded application identifier as "agent", the principal, the server and tool, and the condition. Its inspector shows the path `identity`, `tool review`, `relation`, `capability`, `context`, two boxes ("Rule that denied", "Repeated in this window"), the decisions of the problem with paging, and the facts.

After Backend 031 and 034, each decision records the verified agent (`act.sub`), the subject, the steps `delegation`, `capability`, `resource` and `condition`, each relation checked, and the agent · server · tool of each rule. Each token exchange at the authorization server has its own record and reasons, and a denied exchange raises an attention signal.

---

## Problem Statement

### 1. The agent is an application identifier

The list and the inspector show who called by a client identifier, not the agent that Chokepoint verified, and not for whom it acted.

### 2. The path does not say which relation failed

`no_grant` covers every missing relation. The administrator cannot see if the subject did not delegate, if the tool is not granted, or if the resource is not allowed.

### 3. Token exchanges are invisible

A refused exchange stops an agent before any tool call. Nothing shows it.

---

## Solution

1. **Lists:** the agent is the verified agent; a column "On behalf of" shows the subject; the reasons are those of Backend 031.
2. **Inspector:** "{agent} acted for {subject}", the four steps with the relation checked, the rules of agent · server · tool, and an action for each reason.
3. **Token exchanges view:** each exchange, its reason, and the same detail layout as a decision.
4. **Inbox:** the "Token exchange denied" signal. **Overview:** "Most denied today" grouped by the verified agent.

---

## Practical Gains & Operational Outcomes

1. **Explainable denies**:
   - *Before*: "No grant allows this call" for every missing relation.
   - *Now*: the failed step names the missing delegation, tool or resource, and the screen offers the fix.
2. **Visible token problems**:
   - *Before*: a broken agent key or a disabled user is invisible.
   - *Now*: refused exchanges are listed, grouped and raised in the Inbox.

---

## User Stories

- [x] 1. As an administrator, I see which agent acted for which person or service in each decision.
- [x] 2. As an administrator, I see which relation or rule decided, in the order the PDP checks them.
- [x] 3. As an administrator, I go from a deny to its fix in one click.
- [x] 4. As an administrator, I see refused token exchanges and why.
- [x] 5. As an administrator, I see the occurrences of a problem and inspect each one.
- [x] 6. As an administrator, the Inbox tells me when an agent keeps failing to get a token.
- [x] 7. As an administrator, I open a detail by a click anywhere on its row.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language

- **Context**: Admin — Investigate, Inbox and Overview. The backend owns the records, the grouping into problems and signals, and the aggregates. The Admin never rebuilds a problem from one page of decisions (Admin 020).
- **Package Ownership**: `src/features/investigate`, `src/features/attention`, `src/features/overview`.
- **Terms**:
  - *Agent*: the verified actor of a decision or an exchange (`act.sub`).
  - *Subject*: the person or service on whose behalf the agent acts.
  - *Token exchange*: one request of an agent to the Chokepoint authorization server.

### 2. Aggregate Root & State Transitions

- Read-only screens. The Inbox keeps the Reviewed and Resolved workflow of Admin 018.
- Invariants: no argument value or evaluated fact is shown; the subject of an exchange is shown only when the backend recorded it; no OpenFGA identifier is shown.

### 3. Commands, Queries & Domain Ports

Read problems, decisions and their details (Backend 023 with the 034 fields), read token exchanges, read signals and the overview. Exact contracts: see [Backend dependencies](#backend-dependencies).

---

## Implementation Decisions

### 1. Views

1. Three views: **By problem**, **All decisions** and **Token exchanges**. The toolbar is the same in all views: the view segments, the search with its Search button, **Agent** and **Reason** filters (`SelectMenu`).
2. A click anywhere on a row opens its detail. The arrow at the end stays, with the text "Open the decision details" or "Open the token exchange details". Filter buttons inside a row keep their own click.

### 2. Decision lists

| Column | Content |
| :--- | :--- |
| Result | ALLOW or DENY and the reason in short words |
| Agent | The verified agent |
| On behalf of | The subject, a Person or Service chip, and the identity provider |
| MCP server / tool | Server, tool, and "×N in window · last …" in By problem |
| Resource | Resource type and value, or "No resource check" |

Deny reasons and their text:

| Reason | Text |
| :--- | :--- |
| `no_delegation` | The subject did not delegate to this agent. |
| `no_grant` | The agent can not call this tool. |
| `no_resource` | The agent can not act on this resource. |
| `condition` | A rule of this agent · server · tool was not met. |
| `tool_not_reviewed` | The tool has not been reviewed (blocked before the PDP). |

`user_disabled` is removed (Admin 028).

### 3. Decision inspector

The layout of Admin 020 stays: Back to the list outside the panel; header with the kicker on the left and the ID and time on the right; title; path; two boxes; the paged occurrences; the facts.

1. Below the title: "**{agent}** acted for **{subject}** ({Person or Service} · {identity provider})".
2. Path: **Delegation**, **Tool**, **Resource**, **Rules**, each with its state (Passed, Failed, Not applicable, Not evaluated) and the relation checked, visible without hover. For example "issues-manager → merge_pull_request_repository › acme/infra · Failed".
3. Left box: "Rules of {agent} · {server} · {tool}", each rule with its name, its result, the bindings it reads, the instance limits it reads and the CEL collapsed. "Values of the call and of the attribute sources are never recorded." Then one action for the reason:

   | Reason | Action |
   | :--- | :--- |
   | `no_delegation` | Let {subject} delegate to {agent} |
   | `no_grant` | Add {server} · {tool} to {agent} |
   | `no_resource` | Allow {value} for {tool} |
   | `condition` | Open the rule |
   | `tool_not_reviewed` | Review the tool |

   Each action opens the relevant place of Admin 026 or 027. It never changes permissions by itself.
4. Right box: "Repeated in this window": the count, the hour window, the first and the last occurrence.
5. Below: "Decisions in this problem · N", paged by 6; a click on an occurrence shows it in the same detail.
6. Facts: agent, on behalf of, identity provider, server, tool, resource, decided at.

### 4. Token exchanges

1. Rows: **Result** (ISSUED or REFUSED and a short reason), **Agent**, **Subject** (or "Not verified"), **When** ("×N in window · last …").

   | Reason | Short text | Detail text |
   | :--- | :--- | :--- |
   | `invalid_client` | Agent key did not match | The agent key did not match. The file may be old or exposed. |
   | `subject_token_expired` | Subject token expired | The provider may have disabled the user, or the agent did not renew the token. |
   | `subject_token_invalid` | Subject token not valid | Signature, issuer or audience. |
   | `subject_connection_disabled` | Identity provider disabled | The connection of this identity provider is disabled. |
   | `no_delegation` | Subject did not delegate | The subject did not delegate to this agent. |
   | `invalid_authorization_details` | Instance limits not valid | The instance asked for limits that are not valid, or for a tool that the agent can not call (RFC 9396). |

2. Detail, with the decision layout:
   - left box "What to check": a hint and one action — `invalid_client` opens the agent identity (Admin 029); `subject_token_expired`, `subject_token_invalid` and `subject_connection_disabled` open the identity provider; `no_delegation` opens who can delegate; `invalid_authorization_details` opens the servers and tools of the agent;
   - right box "Repeated in this window";
   - "Exchanges in this problem · N", paged by 6;
   - facts: agent, subject, identity provider, reason, what the agent received (`invalid_client` or `invalid_grant`, Backend 034 Resolved Decision 4), time.
3. The subject is "Not verified: the token signature was not valid" when the backend did not record it.

### 5. Inbox

A **Token exchange denied** item for each signal: the count, the detail text of the reason, the agent, the subject for `subject_token_expired` and `subject_token_invalid`, the time and **Investigate**, which opens the Token exchanges view with its filters. Review and resolution follow Admin 018.

### 6. Overview

"Most denied today" groups by the verified agent: tool, "{agent} · {server}", the reason. No new metric.

---

## Backend dependencies

The contracts and decisions are written in the backend specifications (2026-11-01).

1. **Decision read fields:** [Backend 034](../../backend/specs/034-2026-10-31-decision-trace-actor-and-relations.md), Admin contract 1.
2. **Token exchange read API:** [Backend 034](../../backend/specs/034-2026-10-31-decision-trace-actor-and-relations.md), Admin contract 2.
3. **Exchange signal:** [Backend 034](../../backend/specs/034-2026-10-31-decision-trace-actor-and-relations.md), Admin contract 3 (`token_exchange_denied`).
4. **Overview grouping:** [Backend 034](../../backend/specs/034-2026-10-31-decision-trace-actor-and-relations.md), Admin contract 4.
5. **Problem key:** resolved in Backend 034 (Admin contract, Resolved decision).
6. **Records from before 034:** resolved, [Backend 034](../../backend/specs/034-2026-10-31-decision-trace-actor-and-relations.md) Implementation Decision 1.
7. **Resource of a problem:** [Backend 039](../../backend/specs/039-2026-11-02-problem-resource.md) (found in the review of this specification, 2026-11-02). The By problem view shows the resource of the latest decision.
8. **Refused exchanges with their count:** the Token exchanges view, filtered by Refused, lists the problems of `/token-exchanges/problems` with "×N in window · last …" (section 4.1); the other results list each exchange with its time (decided after the review, 2026-11-02).

**Waiting backend chip.** In the prototype, each element that needs one of these items has a "Waiting backend · <spec>" chip. When the backend implements an item, remove the chip of each element that it unblocks, in the same change. The real Admin never shows the chip.

---

## Testing Decisions

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build`. The user runs the interface test in the built-in browser.

---

## Acceptance Criteria

- [x] 1. The decision lists show Agent, On behalf of and Resource with the reasons of section 2.
- [x] 2. The inspector shows "{agent} acted for {subject}" and the four steps with the relation checked.
- [x] 3. Each deny reason has its action, and the action only navigates.
- [x] 4. The Token exchanges view lists exchanges with short reasons and opens a detail with the decision layout.
- [x] 5. Both details show the paged occurrences of the problem, and a click shows an occurrence.
- [x] 6. A click anywhere on a row opens its detail in every view.
- [x] 7. The Inbox shows the Token exchange denied signal with its target.
- [x] 8. The Overview groups Most denied by the verified agent and adds no metric.
- [x] 9. Every item of Backend dependencies is resolved in a backend specification before implementation.
- [x] 10. No "Waiting backend" chip remains for an implemented item.
- [x] 11. `npm run check` and `npm run build` pass.
- [x] 12. The user confirms the interface test. Run by Claude in the built-in browser at the user's request (2026-11-02): the three views and their Agent, Reason and Result filters; a click on a row cell opens the decision or exchange; the inspector shows who acted for whom and the four steps; the actions of `condition`, `no_grant`, `no_resource` and `no_delegation` open the Rules, Add tools, tool and identity provider panels of the agent; an occurrence opens in the same detail; Overview Most denied groups by the agent and opens Investigate; the Token exchange denied signal (with a local 1-minute window) shows its count and opens the filtered Token exchanges view. The test found and fixed two defects: the count missing in the Inbox item, and a signal target opened as an unavailable decision.

---

## Out of Scope

- "Who can do X" (ListUsers; Backend 034 Out of Scope).
- Priority of problems (future Intelligence work, Admin 020).
- Changing permissions from Investigate: actions only navigate.
