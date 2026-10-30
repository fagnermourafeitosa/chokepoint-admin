# Admin Design Tokens

[Design system](README.md) · [Layout rules](layouts.md)

`styles/tokens.css` is the canonical value source. The tables below describe the same values; update them together. Values use rem for dimensions (pixel equivalents assume the browser default 16px root). Preserve browser font scaling.

## Colors

| Token | Value | Use / provenance |
| :--- | :--- | :--- |
| `--cp-admin-color-canvas` | `#f5f5ef` | Mock canvas |
| `--cp-admin-color-surface` | `#fbfaf7` | Mock panel and navigation surface |
| `--cp-admin-color-surface-muted` | `#ecece5` | Mock segmented navigation |
| `--cp-admin-color-text` | `#15161b` | Mock ink |
| `--cp-admin-color-text-muted` | `#5d6063` | Normalized for readable secondary text |
| `--cp-admin-color-text-inverse` | `#fbfaf7` | Text on dark actions |
| `--cp-admin-color-border` | `#d6d6cf` | Mock decorative separator; not a control boundary |
| `--cp-admin-color-control-border` | `#34363a` | Mock muted primitive repurposed for visible controls |
| `--cp-admin-color-brand` | `#ffe342` | Yellow navigation and brand |
| `--cp-admin-color-action` | `#f574a8` | Pink primary button fill |
| `--cp-admin-color-action-hover` | `#ee5e99` | Normalized primary hover fill |
| `--cp-admin-color-on-action` | `#15161b` | Text on primary action |
| `--cp-admin-color-accent-text` | `#292a29` | Normalized link and small accent text |
| `--cp-admin-color-accent-soft` | `#fff3c7` | Soft yellow highlight |
| `--cp-admin-color-row-hover` | `var(--cp-admin-color-accent-soft)` | Same soft background as hovered More options links |
| `--cp-admin-color-row-selected` | `#ffedb9` | Selected table rows; takes precedence over hover |
| `--cp-admin-color-strong` | `#15161b` | Mock dark action |
| `--cp-admin-color-focus` | `#784160` | Keyboard focus on light surfaces |
| `--cp-admin-color-success` | `#08744d` | Mock ALLOW text |
| `--cp-admin-color-success-bg` | `#ddf2e3` | Mock ALLOW surface |
| `--cp-admin-color-danger` | `#ad2525` | Normalized DENY text |
| `--cp-admin-color-danger-bg` | `#fbe4e2` | Mock DENY surface |
| `--cp-admin-color-warning` | `#80510c` | Normalized review/pending text |
| `--cp-admin-color-warning-bg` | `#fff1cc` | Warm pending surface |
| `--cp-admin-color-code-bg` | `#202122` | Dark CEL/JSON editor |
| `--cp-admin-color-code-text` | `#f5f5ef` | Text in dark editor |
| `--cp-admin-color-overlay` | `rgba(19, 24, 21, .42)` | Mock backdrop |

## Typography

| Token | Value | Use / provenance |
| :--- | :--- | :--- |
| `--cp-admin-weight-regular` | `400` | Body |
| `--cp-admin-weight-medium` | `500` | Supporting emphasis |
| `--cp-admin-weight-semibold` | `600` | Controls |
| `--cp-admin-weight-bold` | `700` | Labels and subheadings |
| `--cp-admin-weight-heavy` | `800` | Headings |
| `--cp-admin-type-label` | `.75rem` | 12px; minimum reusable UI label |
| `--cp-admin-type-small` | `.8125rem` | 13px; metadata and secondary text |
| `--cp-admin-type-body` | `.875rem` | 14px; compact UI |
| `--cp-admin-type-lead` | `1rem` | 16px; introductory UI copy |
| `--cp-admin-type-section` | `1.4375rem` | 23px; section headings |
| `--cp-admin-leading-ui` | `1.5` | Labels and UI copy |
| `--cp-admin-leading-heading` | `1.18` | Headings |
| `--cp-admin-leading-prose` | `1.7` | Reading content |
| `--cp-admin-tracking-heading` | `-.015em` | Tight heading tracking |
| `--cp-admin-tracking-label` | `.1em` | Short uppercase section labels |
| `--cp-admin-font-body` | `"IBM Plex Sans", system-ui, sans-serif` | Interface stack; self-hosted |
| `--cp-admin-font-heading` | `"Barlow Condensed", sans-serif` | Heading family; self-hosted |
| `--cp-admin-font-mono` | `"IBM Plex Mono", ui-monospace, monospace` | Technical data and code; self-hosted |
| `--cp-admin-type-page` | `2.75rem` | 44px; overview/workbench title |
| `--cp-admin-type-detail` | `2rem` | 32px; catalog/investigation title |
| `--cp-admin-type-page-mobile` | `1.75rem` | 28px; mobile title |

## Spacing

| Token | Value | Use / provenance |
| :--- | :--- | :--- |
| `--cp-admin-space-1` | `.25rem` | 4px; icon separation |
| `--cp-admin-space-2` | `.5rem` | 8px; tight groups |
| `--cp-admin-space-3` | `.75rem` | 12px; related controls |
| `--cp-admin-space-4` | `1rem` | 16px; field groups |
| `--cp-admin-space-5` | `1.25rem` | 20px; panel interiors |
| `--cp-admin-space-6` | `1.5rem` | 24px; section groups |
| `--cp-admin-space-8` | `2rem` | 32px; section separation |
| `--cp-admin-space-10` | `2.5rem` | 40px; page rhythm |
| `--cp-admin-space-12` | `3rem` | 48px; major separation |
| `--cp-admin-space-16` | `4rem` | 64px; public/editorial rhythm |

## Shapes and controls

| Token | Value | Use / provenance |
| :--- | :--- | :--- |
| `--cp-admin-radius-sm` | `.25rem` | 6px; inline code |
| `--cp-admin-radius-control` | `.25rem` | 4px; inputs and tabs |
| `--cp-admin-radius-button` | `.125rem` | 2px; buttons |
| `--cp-admin-radius-panel` | `.5rem` | 8px; content panels |
| `--cp-admin-radius-dialog` | `.5rem` | 16px; elevated dialogs |
| `--cp-admin-radius-pill` | `999px` | Status badges only |
| `--cp-admin-border-width` | `1px` | Separators and control borders |
| `--cp-admin-focus-width` | `2px` | Keyboard focus outline |
| `--cp-admin-focus-offset` | `3px` | Gap between focus ring and control |
| `--cp-admin-control-height` | `2.5rem` | 40px; normalized from 38–41px mock controls |
| `--cp-admin-touch-height` | `2.75rem` | 44px; project choice for coarse pointers |
| `--cp-admin-icon-size` | `1rem` | 16px; inline controls |

## Elevation and motion

| Token | Value | Use / provenance |
| :--- | :--- | :--- |
| `--cp-admin-duration-fast` | `130ms` | Hover feedback |
| `--cp-admin-duration-normal` | `220ms` | Panel and menu transitions |
| `--cp-admin-ease-out` | `cubic-bezier(.22, 1, .36, 1)` | State changes; no bounce |
| `--cp-admin-z-header` | `20` | Sticky navigation |
| `--cp-admin-z-drawer` | `50` | Mobile navigation |
| `--cp-admin-z-overlay` | `100` | Dialog or search backdrop |
| `--cp-admin-z-floating` | `110` | Toast or floating controls |
| `--cp-admin-shadow-panel` | `none` | Mock quiet panel elevation |
| `--cp-admin-shadow-dialog` | `0 35px 85px rgba(23, 32, 25, .25)` | Mock dialog elevation |

## Layout dimensions

| Token | Value | Use / provenance |
| :--- | :--- | :--- |
| `--cp-admin-layout-max` | `92.5rem` | 1480px; workbench and detail container including gutters |
| `--cp-admin-layout-home-max` | `82.5rem` | 1320px; overview container including gutters |
| `--cp-admin-layout-nav-max` | `100rem` | 1600px; navigation |
| `--cp-admin-layout-gutter` | `2.75rem` | 44px; desktop page gutters |
| `--cp-admin-layout-nav-gutter` | `2.625rem` | 42px; desktop navigation gutters |
| `--cp-admin-layout-page-top` | `2.9375rem` | 47px; desktop top padding |
| `--cp-admin-layout-page-bottom` | `3.125rem` | 50px; desktop bottom padding |
| `--cp-admin-layout-header-height` | `4.625rem` | 74px; sticky header |
| `--cp-admin-layout-rail` | `15.3125rem` | 245px; agent rail |
| `--cp-admin-layout-inspector` | `18.4375rem` | 295px; inspector |
| `--cp-admin-layout-gap` | `.875rem` | 14px; workbench columns |
| `--cp-admin-layout-prose` | `70ch` | Maximum explanatory prose width |
| `--cp-admin-layout-dialog` | `32.5rem` | 520px; ordinary dialog |
| `--cp-admin-layout-dialog-wide` | `46.875rem` | 750px; rule editor |

## Extended control dimensions

The operational table uses `--cp-admin-layout-table-min: 34rem` (544px). Narrow viewports scroll within the table region rather than compressing tool names into unreadable fragments.

These component dimensions consolidate the added control specimens; they are documented extensions where the source mocks did not define a complete control vocabulary.

| Token | Value | Use |
| :--- | :--- | :--- |
| `--cp-admin-choice-size` | `1.125rem` | 18px; checkbox/radio visual size; enclosing label supplies the target |
| `--cp-admin-switch-width` | `2.5rem` | 40px; switch track width |
| `--cp-admin-switch-height` | `1.5rem` | 24px; switch track height |
| `--cp-admin-switch-thumb` | `1rem` | 16px; switch thumb and checked-state travel |
| `--cp-admin-switch-inset` | `.1875rem` | 3px; switch thumb inset |
| `--cp-admin-progress-height` | `.5rem` | 8px; progress track |
| `--cp-admin-menu-min-width` | `12rem` | 192px; disclosure panel, capped to viewport |
| `--cp-admin-toast-max-width` | `22rem` | 352px; local notification, capped to viewport |
| `--cp-admin-control-compact-height` | `2rem` | 32px; compact actions; coarse pointer uses touch-height |

## Accessibility choices

Normal text pairings target at least 4.5:1 contrast. Large display text targets at least 3:1. Do not use the decorative border token as the only control boundary. Success and denial require a visible label and icon as well as color. [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

Controls use a 40px minimum height and 44px for coarse pointers as a project choice, rather than copying the smallest mock targets. WCAG 2.2 AA uses a 24px target rule with defined exceptions; 44px is the chosen more generous baseline. [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

The token values above define the current design system. Keep status text readable and use borders, labels, and focus indicators in addition to color.
