# Specification: Quick Incident Help Tip

- **Specification ID**: 040
- **Date**: 2026-11-04
- **Slug**: quick-incident-help-tip
- **Status**: Implemented
- **Owner**: Admin — shared component (`src/components/quick-incident`)
- **Supersedes**: [039 — Quick Incident](039-2026-11-04-quick-incident.md), section "Control", the help panel before the first search
- **Public documentation**: Frontend 019 capture `public/docs/platform/quick-incident.png`; demo instance capture `quick-incident` (`dev-infra/demo-instance/screenshot.py`)

---

## Context & Background

Admin 039 opens Quick incident with a help panel under the field: "Paste the code a person or a developer sent you." and three sources (refused harness login page, denied tool call, refused token exchange). The panel stays open while the operator types.

---

## Problem Statement

The panel appears as soon as the field opens and stays while the operator types. It covers part of the page and says nothing about what the operator is doing. The list of three sources is not needed to use the field.

---

## Solution

1. Remove the help panel of the idle state.
2. Add a help icon in the open field, with the design system pattern: `Tooltip` around `CircleHelp` (14 px), as in `Fields.tsx` and `ChokepointTokenSetup.tsx`. Tooltip: "Paste the reference code of a refusal that a person or a developer sent you. It opens the denied call or the refused login in this environment."
3. The panel under the field shows only the result of a search: the format message, not found, several matches, or an error.

---

## User Stories

- [x] 1. As a security operator, I type a code without a panel over the page.
- [x] 2. As a security operator, I read what the field is for in the help tip.

---

## Implementation Decisions

### Resolved decisions (2026-11-04)

1. A help icon with a tooltip replaces the help panel (user request).
2. The tooltip gives only the hint of what the field is; the three sources are not listed.

### Admin code changes

- `QuickIncident.tsx`: no idle panel content; the panel renders only for a result; the help icon between the code field and **Find incident**.
- `quick-incident.css`: the icon spacing.

### Documentation

- Recapture `quick-incident.png` with the demo instance; the capture shows the open field with the tooltip.
- `screenshot.py`: the `quick-incident` capture waits for the field and hovers the help icon.

---

## Testing Decisions

No automated tests (Admin AGENTS.md, Verification). `npm run check`, `npm run build` and a check in the built-in browser.

---

## Acceptance Criteria

- [x] 1. Opening Quick incident shows no panel; typing shows no panel. — checked in the built-in browser: the panel is `hidden` after `/` and after typing `k3f7`.
- [x] 2. The help icon shows the tooltip on hover and on keyboard focus. — hover checked in the browser; keyboard focus comes from the design system `Tooltip` (focusable trigger).
- [ ] 3. Format, not found and several matches still show their message under the field. — format (`k3f7`) and not found (`k3f7-zzzz`) checked in the browser; several matches by code inspection only.
- [x] 4. The documentation capture and its demo instance capture match the new control. — `quick-incident` capture now hovers the help icon (dev-infra `feat/040-quick-incident-capture`); new `quick-incident.png` in frontend `feat/040-quick-incident-capture`.

---

## Out of Scope

- Any other change of Quick incident.
