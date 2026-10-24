---
name: Chokepoint Admin
description: Visual language extracted from the supplied Chokepoint mocks.
colors:
  canvas: "#f8f9f6"
  surface: "#ffffff"
  ink: "#242624"
  primary: "#ecae83"
  link: "#9c4f20"
  success: "#257a58"
  danger: "#a53f36"
typography:
  body:
    fontFamily: "DM Sans, Manrope, system-ui, sans-serif"
    fontSize: "0.875rem"
    lineHeight: 1.5
rounded:
  control: "8px"
  button: "9px"
  panel: "15px"
spacing:
  small: "8px"
  medium: "16px"
  panel: "24px"
---

# Chokepoint Admin Design System

## Overview

An operator works through permissions and decisions in a light workspace, switching between related tasks without losing the selected agent. The reference is the supplied workbench: warm grey canvas, white panels, charcoal text, peach primary actions, compact controls, and visible structure. The operational UI has a restrained accent strategy.

Use [tokens](tokens.md) for exact values and [layouts](layouts.md) for geometry. The CSS is the canonical source; this frontmatter is a concise summary.

## Colors

Peach marks primary actions and selected context. It is distinct from semantic green ALLOW, red DENY, and warm pending/review states. Main text is charcoal. Secondary text is normalized to a darker grey than the mock. Decorative separators remain faint; input boundaries use a stronger tone.

A source orange is not a readable small-text color by default. Use the dedicated link and status foregrounds.

## Typography

DM Sans carries body copy, labels, controls, and tables. Manrope carries headings. JetBrains Mono carries tool names, code, identifiers, and CEL. Variable WOFF2 files are self-hosted and licensed.

Page headings are 39px, detail titles 32px, section headings 23px, body 14px, secondary copy 13px, and labels at least 12px. Mobile page titles are 28px. Use weight 800 for headings and 600–700 for control emphasis. Do not copy the mock’s isolated 9px labels.

## Elevation

Most structure comes from surface contrast, 1px separators, and 15px corners. Panel shadow is `0 12px 35px rgba(33,35,32,.035)`. Dialogs use a stronger shadow and a dim backdrop. No decorative glass layer is part of the extracted system. Focus is an explicit 2px outline with 3px offset.

## Components

Buttons use 9px corners and a 40px minimum height; fields use 8px corners. Panels use 24px padding, reduced to 16px on mobile. Badges have readable state text. The central workbench is a composition of rail, editor, and inspector, not a generic card list.

Use [reusable CSS](styles/index.css) and the [shadcn bridge](styles/adapters.css). The static [specimen](preview.html) exercises the same CSS. Loading, errors, keyboard interaction, and dialog focus belong to the implemented components. State feedback uses 130/220ms transitions; reduced-motion disables them.

The [control and navigation reference](components.md) covers selection controls, fields, feedback, dialogs, and header/footer specimens.

## Do's and Don'ts

- Do reuse semantic variables instead of copying literals from individual mock selectors.
- Do preserve the shared shell, selected context, and per-screen composition.
- Do use a mono font for identifiers and keep them inside their own layout region.
- Do label decisions explicitly and keep keyboard focus visible.
- Don’t use brand orange to mean DENY or ALLOW.
- Don’t introduce dark mode, new fonts, or a frontend-style hero into management screens.
- Don’t collapse essential actions out of the mobile experience.
- Don’t treat CSS or a visual simulator as an authorization boundary.
