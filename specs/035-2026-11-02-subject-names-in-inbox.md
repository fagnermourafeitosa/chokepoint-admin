# Specification: Subject Names in the Inbox

- **Specification ID**: 035
- **Date**: 2026-11-02
- **Slug**: subject-names-in-inbox
- **Status**: Implemented
- **Owner**: Admin — Overview and Inbox (`src/features/attention`)
- **Related Specification**: [Backend 043 — Subject Names in Attention Signals](../../backend/specs/043-2026-11-02-subject-names-in-signals.md) (`context.subject_name`)
- **Related Specification**: [033 — Agent Names in the Inbox](033-2026-11-02-agent-names-in-inbox.md) (the agent of the same line)

---

## Context & Background

A denied token exchanges item of the Inbox ends with "for {subject}" when the exchanges failed for an expired or invalid subject token (Admin 030 section 5). The subject is the raw value of the identity provider.

---

## Problem Statement

### 1. The Inbox shows the raw subject

An administrator sees a provider identifier, not the person or the service.

---

## Solution

1. The item shows "for {subject name}" from `context.subject_name`, and the raw subject when the name is missing (a signal raised before Backend 043, an unknown subject, or a directory failure).
2. The link of the item to Investigate does not change: it still searches the raw subject.

---

## Practical Gains & Operational Outcomes

1. **A readable Inbox item**:
   - *Before*: `for 8a1f…` (the provider subject).
   - *Now*: `for Alice Martins`.

---

## User Stories

- [x] 1. As an administrator, I see the name of the person or service of a denied token exchanges item in the Inbox.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language

- **Context**: Admin — Overview and Inbox. The backend owns the name.
- **Package Ownership**: `src/features/attention/targets.ts` (`contextLines`).
- **Terms**: *Subject* as in Backend 034.

### 2. Aggregate Root & State Transitions

- No state. It is display only.

### 3. Commands, Queries & Domain Ports

- None new: the signal reads of Backend 043.

---

## Implementation Decisions

1. `contextLines` uses `context.subject_name || context.subject` after "for".

---

## Backend dependencies

1. **Subject name in the signal context:** [Backend 043](../../backend/specs/043-2026-11-02-subject-names-in-signals.md) Solution 2 (decided 2026-11-02: read time, never stored; the raw subject when the directory fails).

---

## Testing Decisions

No automated tests (see `AGENTS.md`). Run `npm run check` and `npm run build`. The user runs the interface test in the built-in browser.

---

## Acceptance Criteria

- [x] 1. A denied token exchanges item with a named subject shows its name, and the raw subject when the name is missing.
- [x] 2. The Investigate link of the item is unchanged.
- [x] 3. `npm run check` and `npm run build` pass.
- [x] 4. The user confirms the interface test. (Run by the agent in the built-in browser and accepted by the user on 2026-11-02; no local signal names a subject yet, so a subject and a name were added to the responses inside the page only. No data was changed.)

---

## Out of Scope

- Names of subjects in other item types.
