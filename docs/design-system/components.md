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
| Segmented selection | `cp-admin-segmented`, `cp-admin-segment` | Native radio choices; selected segment and visible keyboard focus |
| Input/textarea | `cp-admin-input`, `cp-admin-field` | Existing default, readonly, disabled, invalid, and focus styling |
| Select | `admin-select` (`SelectMenu`) | Every choice from a list, in filters and forms. Never a native `select`: its platform chrome ignores the system. Same outlined trigger and option panel as the header environment selector, defined in `styles/controls.css` and shown in the specimen; the current option shows a check. `block` fills a form field, `required` keeps native form validation, and disabled options stay visible |
| Range | `cp-admin-range` | Native keyboard/pointer input; specimen output updates locally |
| Progress | `cp-admin-progress` | Native progress element with an accessible label |
| Notice | `cp-admin-notice` | Neutral, success, and danger appearances; message remains explicit |
| Accordion | `cp-admin-accordion` | Native details/summary expansion |
| Disclosure links | `cp-admin-disclosure` | Native details with ordinary links; intentionally not an ARIA menu |
| Dialog | `cp-admin-dialog` | Native modal in the specimen; Escape and close actions supported |
| Notification | `cp-admin-toast` | Polite local status message in the specimen |
| Action variants | `cp-admin-button--ghost`, `--danger`, `--small` | Secondary emphasis, destructive appearance, compact actions |

Checkboxes, switches, and segmented choices expose state through native inputs. Do not replace their labels with color alone. Range/progress represent different things: a range accepts input, while progress reports a value. Small action buttons retain the 44px coarse-pointer target rule.

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

`cp-admin-notice` without a tone is the neutral information notice; do not add one-off info colors. Success and danger tones use the `--success`/`--danger` modifiers or `data-tone="success|danger"`. Field labels are semibold; the value typed in `cp-admin-input` is always regular, even inside a label. A `small` inside `cp-admin-field` is helper text: label size, muted, regular weight. Menu triggers such as the identity row's More button use the ghost button treatment: dark border, offset shadow and lift.
