# Specification: Codex Harness Icon

- **Specification ID**: 047
- **Date**: 2026-11-06
- **Slug**: codex-harness-icon
- **Status**: Implemented
- **Owner**: Admin — Access, agent Identity view
- **Related Specification**: [036 — Interactive Harness Access](036-2026-11-03-interactive-harness-access.md)
- **Related Backend Specification**: Backend 063 — Codex in the Harness Catalog (`backend/specs/063-2026-11-06-codex-in-harness-catalog.md`)

---

## Context & Background

Backend 063 replaces Visual Studio Code with Codex in the harness catalog. The Admin shows each catalog entry as a button with the icon path of the entry (`/brands/<id>.svg`).

---

## Solution

1. Add `public/brands/codex.svg`, a generic command-line icon in the style of `claude-code.svg`. It is not a vendor logo; the name is shown next to it.
2. Remove `public/brands/vscode.svg` and its line in `public/brands/README.md`.
3. The help texts of the Harness login card and of the Harness login section of the identity connection say "Claude Code, Codex and similar" in place of "Claude Code, VS Code and similar".

---

## Testing Decisions

- Type check and production build pass.
- On the demo instance after Backend 063, the Harness login card shows the Codex button with its icon and no Visual Studio Code button.

---

## Acceptance Criteria

- [x] 1. No Admin source or asset names Visual Studio Code as a harness.
- [x] 2. The Codex button shows the `codex.svg` icon. — on a copy of the demo database: the Harness login card shows Claude Code in the allowlist and a Codex button with `codex.svg`, no Visual Studio Code button; adding and removing Codex worked
- [x] 3. The type check and the production build pass.

---

## Out of Scope

- Vendor logos.
- Any other change to the Harness login card.
