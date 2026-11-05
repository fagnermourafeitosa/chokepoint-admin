# Specification: Sober Visual System

- **Specification ID**: 044
- **Date**: 2026-11-05
- **Slug**: sober-visual-system
- **Status**: In Progress
- **Owner**: Admin design system
- **Related Specification**: [022 — Admin Design System](022-2026-10-30-admin-design-system.md)

---

## Context & Background

Specification 022 set the Admin visual system: warm canvas, quiet surfaces, dark ink, yellow navigation and selection, and pink primary actions. Later screens added more yellow and pink: traffic charts, outcome chips, Inbox tags, toggles, delegation nodes and path dots.

On 2026-11-05 the public site (frontend `DESIGN.md`) moved to a sober register: neutral surfaces, one meaning for each color, and credibility before playfulness. The Admin must follow the same rules. This specification changes tokens and shared rules. It does not change screen layout, copy (except the product name), data or behavior.

---

## Problem Statement

### 1. One color has several meanings

Yellow marks primary navigation, inner selections, segmented toggles, the selected agent, the agent node, progress meters, "allowed" outcomes and an Inbox tag. Pink marks the primary button, "denied" outcomes, chart bars, a count badge and pressed toggles. A reader cannot learn what a color means.

### 2. Outcome colors contradict the site

"Allowed" is yellow and "denied" is pink. On the site, green means passed and red means stopped.

### 3. The primary action competes with the content

Pink filled buttons are the loudest element of each screen.

### 4. The old product name is visible

The sign-in page shows "CHOKEPOINT" and "Sign in to Chokepoint", and the Keycloak theme shows the old logo and name. Some help text says "Chokepoint". The product name is Xokepoint.

---

## Solution

1. **Primary action is ink.** `--cp-admin-color-action` becomes ink with cream text. Action buttons cast a grey (`#6d685e`) offset shadow, as on the site.
2. **Yellow means primary navigation and the brand only.** The wordmark and the active item of the primary navigation keep yellow. Text selection keeps yellow.
3. **Other selections are neutral.** Section navigation, inner tabs, segmented toggles, pressed buttons, the selected row and the agent node use a paper tone (`--cp-admin-color-selected`) with ink borders or an ink bar.
4. **Outcomes use state colors.** New tokens `--cp-admin-color-allow` / `--cp-admin-color-deny` (solid, for chart bars and path dots) and their `-bg` pairs (for chips). Allowed is green, denied is red, always with text.
5. **Neutral counters.** The "denied" count badge uses the deny pair. The tool review meter uses ink. Inbox tags that are not outcomes (tool discovery) are neutral.
6. **Danger actions are outlined.** `cp-admin-button--danger-soft` keeps red text and gets a red border on a surface background.
7. **Product name.** User-visible text says Xokepoint. The sign-in page uses the wordmark of the header. The Keycloak theme in `dev-infra` uses the same wordmark and name. Code identifiers, realm names and URLs stay as they are.

---

## Practical Gains & Operational Outcomes

1. **Readable color**:
   - *Before*: yellow and pink each meant five things.
   - *Now*: green passed, red stopped, yellow brand and primary navigation, ink the primary action.
2. **Consistency with the site**:
   - *Before*: an operator who read the site saw opposite outcome colors in the Admin.
   - *Now*: the same outcome has the same color in both.
3. **Credibility**:
   - *Before*: the sign-in page showed the old name.
   - *Now*: every screen shows Xokepoint.

---

## User Stories

- [ ] 1. As an administrator, I want allowed and denied calls in green and red, so that I read outcomes the same way on every screen.
- [ ] 2. As an administrator, I want one strong action on a screen, so that I see the next step without competing colors.
- [ ] 3. As an administrator, I want the product name and wordmark to be Xokepoint at sign-in, so that I trust that I am on the right service.

---

## Architecture Gate

### 1. Bounded Context & Ubiquitous Language
- **Context**: Admin presentation (design system).
- **Package Ownership**: `docs/design-system/styles/` (tokens and shared rules), feature stylesheets that set colors (`overview`, `investigate`, `attention`, `access/delegation`, `quick-incident`), `src/features/auth/AuthPages.tsx` and `src/components/header/` (wordmark), and the Keycloak theme in `dev-infra/idps/keycloak/themes/chokepoint/login/`.
- **Ubiquitous Terms**:
  - `action`: the color of the primary button.
  - `selected`: the neutral tone of a selected control that is not the primary navigation.
  - `allow` / `deny`: the state colors of an outcome.

### 2. Aggregate Root & State Transitions
- **Entities & State Machine**: none. Presentation only.
- **Invariants**: status never depends on color alone; contrast of text on every changed background meets WCAG AA; focus stays visible.

### 3. Commands, Queries & Domain Ports
None.

---

## Implementation Decisions

1. Tokens (`tokens.css`): `action` `#15161b`, `action-hover` `#34363a`, `on-action` `#fbfaf7`; `row-selected` and `accent-soft` become paper tones; add `selected` `#e6e4d9`, `allow` `#3f8f2a`, `allow-bg` `#ddf2e3`, `deny` `#c8243f`, `deny-bg` `#fbe4e2`, and `shadow-action`, `shadow-action-lift`, `shadow-action-press` in grey.
2. `cp-admin-button` uses the action shadows. Secondary and dark buttons keep their rules.
3. Each `var(--cp-admin-color-brand)` outside the wordmark and the primary navigation becomes `selected`, `allow` or ink, by meaning. Each `var(--cp-admin-color-action)` used as a fill for a pressed control or an outcome becomes `selected` or `deny`.
4. The sign-in page reuses the header wordmark component; it moves to a shared file.
5. The Keycloak theme replaces the text "CHOKEPOINT" and the old logo image with the Xokepoint wordmark (text plus arrow O), and its title with Xokepoint.
6. `docs/design-system/DESIGN.md` and `tokens.md` describe the new rules; specification 022 stays as history.

---

## Testing Decisions

This module has no automated tests. Verify with `npm run check`, `npm run build` and a manual check in the built-in browser of: sign-in (Admin and Keycloak), Overview, Access (agent list, delegation graph and list, identity), Investigate (list and inspector), Integrations and Quick incident.

---

## Acceptance Criteria

- [ ] 1. The primary button is ink with cream text and a grey shadow on every screen.
- [ ] 2. Yellow appears only in the wordmark, the active primary navigation item and text selection.
- [ ] 3. Allowed outcomes are green and denied outcomes red in the traffic chart, sparklines, outcome chips, path dots, policy results and the denied count; each keeps its text label.
- [ ] 4. Section navigation, inner tabs, toggles, pressed buttons, the selected agent and the agent node use the neutral selected tone.
- [ ] 5. Danger-soft buttons are outlined in red.
- [ ] 6. The Admin sign-in page and the Keycloak theme show the Xokepoint wordmark and name; user-visible help text says Xokepoint.
- [ ] 7. `docs/design-system/DESIGN.md` and `tokens.md` describe the new rules.
- [ ] 8. `npm run check` and `npm run build` pass, and the manual browser check covers the screens above.

---

## Out of Scope

- Fonts and type scale (Barlow Condensed, IBM Plex) stay.
- Screen layout, copy (other than the product name), data and behavior.
- Agent images that an administrator uploads (for example a portrait) are customer content; the Admin shows them as they are.
- Code identifiers, realm names, client IDs and URLs that contain "chokepoint".

---

## Further Notes

The public site rules are in `frontend/DESIGN.md`. This specification supersedes the color rules of specification 022 (pink primary actions, yellow selection).
