# Design System Verification

Checked on 2026-10-23. This verifies the reusable reference assets and static specimens, not a completed Vite/Next.js application or full WCAG conformance.

## Asset and reference checks

- 60 Markdown/HTML local references have existing targets; HTML anchors and unique IDs checked.
- CSS import/font URLs resolve; variable references have definitions.
- Local font files have WOFF2 signatures and accompanying OFL licenses.
- Each specimen has one h1 and a skip link; form fields have labels.

## Contrast pairs

Ratios use the sRGB relative-luminance formula and unrounded comparisons against the stated threshold.

| Foreground token | Background token | Ratio | Threshold |
| :--- | :--- | ---: | ---: |
| `color-text` | `color-canvas` | 14.42:1 | 4.5:1 |
| `color-text-muted` | `color-canvas` | 5.42:1 | 4.5:1 |
| `color-accent-text` | `color-surface` | 5.91:1 | 4.5:1 |
| `color-on-action` | `color-action` | 7.63:1 | 4.5:1 |
| `color-success` | `color-success-bg` | 4.67:1 | 4.5:1 |
| `color-danger` | `color-danger-bg` | 5.63:1 | 4.5:1 |
| `color-code-text` | `color-code-bg` | 12.90:1 | 4.5:1 |
| `color-control-border` | `color-surface` | 3.79:1 | 3:1 |
| `color-focus` | `color-canvas` | 5.59:1 | 3:1 |
| `color-warning` | `color-warning-bg` | 5.74:1 | 4.5:1 |

## Browser checks

Chrome rendered the specimens at 320, 375, 768, 1024, and 1440 CSS pixels. No document-level horizontal overflow was measured at these widths. Local fonts loaded. The admin workbench becomes a single column on mobile; the docs hide the desktop sidebar/TOC and expose native expandable navigation. The public reading column caps at 800px.

The font loader intentionally leaves unused unicode subsets unloaded. This is not a failed font request. Sample code or table content may scroll within its own region. The specimens are not interactive platform screens, and the Fumadocs/shadcn bridges still require verification in the eventual real components.

## Source fingerprints

The following original files were used as references and were not migrated by this work.

| Source | SHA-256 |
| :--- | :--- |
| `admin/docs/chokepoint-workbench/styles.css` | `19e2eacf6d4c869da2515bfb1e7c04c14d8b249b452b35ce6b03c261d1de4b68` |
| `admin/docs/chokepoint-workbench/src/app.tsx` | `d9a989c4f543f54c091f118929316d9207c358ff0b0c61cbec61961ddbd04138` |

## Extended control checks

The expanded galleries were rendered at the same five viewport widths with no document-level horizontal overflow or failed asset requests. Local DOM interaction checks passed for checkbox, switch, radio, segmented output, range output, invalid/valid form state, submission without network, reset, native dialog opening/focus/closing/focus restoration, disclosure opening/Escape, and local notification visibility. The admin's native mixed checkbox state was also checked.

Topbar/footer specimens exist in both systems; frontend includes separate public and docs variants. Coarse-pointer compact actions measured 44px minimum height. These are local demonstrations, not production React components.

## Table hover and selection

Table body rows and More options links hover with `color-row-hover` (`#e6e5dc`). Checking a row checkbox applies `color-row-selected`, including while hovered; unchecking clears the selected background. These states reuse semantic tokens and need no JavaScript styling state.
