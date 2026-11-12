# Admin Control and Navigation Reference

[Design system](README.md) · [Tokens](tokens.md) · [Layout rules](layouts.md)

## Reusable styling

`styles/index.css` includes [controls.css](styles/controls.css) and [navigation.css](styles/navigation.css). They use this module's existing semantic palette, typography, shapes, spacing, focus, and motion tokens. These files are independent of the other module's CSS.

The static specimens include [scripts/preview.js](scripts/preview.js) for local demonstrations. That script is documentation-only; production React components use their selected library and application state. It sends no requests and persists nothing.

## Control catalog

| Control | CSS class | Behavior / state |
| :--- | :--- | :--- |
| Checkbox | `cp-admin-choice` | Native checked/unchecked/disabled states; whole label is clickable |
| Radio group | `cp-admin-choice-group` | Native exclusive selection with fieldset/legend |
| Switch | `cp-admin-switch` | Native checkbox with switch role and visible label |
| Segmented selection | `cp-admin-segmented`, `cp-admin-segment` | Native radio choices; selected segment and visible keyboard focus. Not used on product screens: a choice from a list is a Select ([Layouts › Forms](layouts.md#forms)) |
| Input/textarea | `cp-admin-input`, `cp-admin-field` | Existing default, readonly, disabled, invalid, and focus styling |
| Select | `admin-select` (`SelectMenu`) | Every choice from a list, in filters and forms. Never a native `select`: its platform chrome ignores the system. Same outlined trigger and option panel as the header environment selector, defined in `styles/controls.css` and shown in the specimen; the current option shows a check. `block` fills a form field, `required` keeps native form validation, and disabled options stay visible |
| Range | `cp-admin-range` | Native keyboard/pointer input; specimen output updates locally |
| Progress | `cp-admin-progress` | Native progress element with an accessible label |
| Notice | `Notice` (`src/components/ui/notice`), `cp-admin-notice` | `tone` is `info` (`Info` icon, light blue), `warning` (`TriangleAlert`, light yellow) or `error` (`CircleAlert`, light red), with an optional bold title. The three backgrounds have the same lightness. Info is `role="status"`; warning and error are `role="alert"`. The class keeps a neutral and a success appearance for other uses; message remains explicit |
| Accordion | `cp-admin-accordion` | Native details/summary expansion |
| Disclosure links | `cp-admin-disclosure` | Native details with ordinary links; intentionally not an ARIA menu |
| Dialog | `cp-admin-dialog` | Native modal in the specimen; Escape and close actions supported |
| Confirmation dialog | `ConfirmDialog` (`src/components/ui/dialog`) | Dialog that confirms a destructive action: one sentence on what the action does, with each value that comes from the data (names, identifiers) in bold and no product name, an optional warning notice (`cp-admin-notice--warning` with `TriangleAlert`) for a consequence, then Cancel and the danger button named after the action. Escape and Cancel keep everything |
| Side panel | `cp-admin-side-panel` (`SidePanel`) | Native modal on the right edge, full height; slides in; Escape, the close button and a click on the backdrop close it. `data-width="wide"` for two columns |
| Pager | `TracePager` (`src/features/investigate/TraceUI.tsx`), `trace-pager` | Under every list table: record count, Previous, page / pages, Next; Previous and Next are disabled on the first and last page. See [Layouts › List tables](layouts.md#list-tables) |
| Notification | `cp-admin-toast` | Polite local status message in the specimen |
| Action variants | `cp-admin-button--ghost`, `--danger`, `--small` | Secondary emphasis, destructive appearance, compact actions |

Checkboxes, switches, and segmented choices expose state through native inputs. Do not replace their labels with color alone. Range/progress represent different things: a range accepts input, while progress reports a value. Small action buttons retain the 44px coarse-pointer target rule.

The side panel uses the same native modal behavior as the dialog: `showModal()` traps focus and focus returns to the opener on close. Its header has an optional eyebrow (for example the name of the agent), the title, and an actions area before the close button. The body scrolls; the header stays fixed. Use it to inspect or browse something that belongs to the current page (history, details, a long list) without leaving the page. Do not use it for a short confirmation; use a dialog. Do not open a side panel from another side panel.

The dialog specimen uses `showModal()` and a `method="dialog"` form. Do not set `open` by hand to imitate modal focus behavior. The disclosure uses links, not menu roles requiring custom arrow-key navigation. Escape closes an open specimen disclosure. Form validation uses native constraints and reports locally; it never submits to a backend.

## Additional admin patterns

The admin gallery adds an input with a trailing selection action, JSON file picker, password field appearance, datalist suggestions, icon button, loading appearance, selectable tool rows, and pagination. The fictional endpoint and tool rows are fixtures. The file picker does not upload/parse files, and pagination is explicitly a static one-page example.

Use `cp-admin-input-group` for grouped input/actions, `cp-admin-toolbar` for related action groups, and `cp-admin-pagination` for the table footer. Keep table overflow inside `cp-admin-table-scroll`; essential row actions remain reachable on small screens.

Table body rows use the same hover background as More options links (`color-row-hover`, an alias of the neutral `color-hover`). A checked `input[data-row-select]` gives its row the subtly darker `color-row-selected` background. Selection remains visible while hovering and clears when unchecked, without a separate JavaScript styling state. React table components can also expose selection with `aria-selected="true"` on the row.

## Topbars and footers

The admin topbar combines brand, workspace/environment context, route navigation, and account actions. `cp-admin-topbar-nav` can scroll horizontally within its region. The account example is a disclosure of links, with a visible name.

The footer uses `cp-admin-shell-footer` and `cp-admin-footer-nav`: product/workspace context, help/reference links, and optionally a clearly labeled status. A status dot is decorative; its text supplies the meaning. The specimen status does not claim a live health check.

`*-topbar--sample` and `*-shell-footer--sample` only frame examples inside the design-system page; do not apply those specimen variants to the live application shell. Sample footers and headers are divisions inside a section, so they do not create competing page-level banner/contentinfo landmarks.

## Interactive demonstration coverage

The specimens demonstrate checking/unchecking, exclusive choices, switches, segmented selection, range output, details expansion, native form validation/reset, modal open/close, and a local notification. Button samples without an attached demonstration are appearance-only. No control changes platform permissions, connects a server, or publishes policy.

## Hover and press

Hover never uses yellow; yellow marks the current or selected item. Elements that rest on an offset shadow lift on hover (`lift` with `shadow-lift`) and press into the shadow when active (`press` with `shadow-press`): primary, ghost and soft destructive buttons, inactive primary navigation items (which gain a dark outline and surface) and graph nodes. Secondary and dark buttons have no shadow; secondary darkens its border and uses `color-hover`. Items inside one outlined group do not lift: section navigation uses `color-hover` with a dark inset underline, inner tabs use `color-hover` with a dark underline, and graph zoom controls use `color-hover` inside their shared border and shadow. Rows use `color-row-hover`. Reduced motion removes the transitions; the shadow change still shows the state.

Destructive actions that open a confirmation use `cp-admin-button--danger-soft` (red text on `color-danger-bg`); the final confirmation keeps `cp-admin-button--danger`.

## Notices, fields and menu triggers

Use the `Notice` component for a message about the screen: `info` says what happens after a choice and changes with it (for example, what Never or a date does; a fixed explanation of a field is helper text, a `small`, not a notice), `warning` names a consequence the person must check before publishing, `error` says what failed. One meaning per tone; do not add one-off colors. The class `cp-admin-notice` without a tone stays the neutral box for content that is not a message; the tones use the `--info`/`--success`/`--warning`/`--danger` modifiers or `data-tone`. Each tone starts with its icon (decided 2026-11-06, Admin 048). Field labels are semibold; the value typed in `cp-admin-input` is always regular, even inside a label. A `small` inside `cp-admin-field` is helper text: label size, muted, regular weight. Menu triggers such as the identity row's More button use the ghost button treatment: dark border, offset shadow and lift.

## Report-only

Every mark of an agent in Report-only (Admin 041) uses the warning tokens and the `Eye` icon: `cp-report-only-chip` (the agent chip, and with `data-tone="danger"` the overdue review chip), `cp-report-only-notice` (the notice of the agent and of a would-deny decision, with a danger border when the review is overdue) and `cp-would-deny` (added to an outcome chip or an Inbox type tag: dashed, because the call ran). ALLOW keeps the brand yellow and DENY the action pink. Chips never wrap inside; a row of chips wraps between chips.

## Direct link to the documentation

The standard way to send the administrator from a screen element to the public docs page that explains it (decided 2026-11-12). The public site uses the same pattern.

- **Mark:** the lucide `ArrowUpRight` icon, with no visible text, placed right after the label or title it explains and vertically centered on it. 14px next to a field label or a card title.
- **Color and motion:** `color-text-muted` at rest; the text color on hover and focus, moving 2px up and right. Keyboard focus uses the standard focus outline. Reduced motion removes the movement. It is not a button: no border, no shadow, no lift.
- **Destination:** the public docs page of that exact topic, in the locale of the Admin, never the docs home.
- **Behavior:** opens in a new tab (`target="_blank" rel="noopener noreferrer"`), so the work on the screen stays open.
- **Name:** `aria-label` and `title` name the destination page and say that it opens a new tab, for example "Agent identity, in the documentation (opens in a new tab)". Admin copy never names the product.

## Dropdown panels

A dropdown panel opens under its trigger, aligned to the end of the trigger. When that would cut it at the left edge of the nearest container that clips its overflow, for example a filter at the start of a wrapped toolbar row, `Dropdown` sets `data-align="start"` and the panel aligns to the start of the trigger.
