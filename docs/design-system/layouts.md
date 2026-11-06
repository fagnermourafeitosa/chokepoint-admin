# Admin Page Composition

[Design system](README.md) · [Tokens](tokens.md)

## Shared shell

Place a 74px sticky topbar above the page. Its inner width is at most 1600px with 42px desktop gutters. Keep the brand, project/environment context, primary navigation, search, and account actions in that order. Controls can wrap; do not hide a required action merely to preserve a single header row. The `cp-admin-topbar-nav` region can scroll horizontally when labels do not fit, keeping all routes reachable without expanding the header unnecessarily.

Page containers include their padding in the width: 1480px for operational screens, 1320px for Overview, with 44px desktop gutters and 47px top padding. A heading group contains a short contextual label, title, explanation, and at most one visually primary action. Main content follows after 32px. Footer metadata aligns to the same page gutters.

```html
<header class="cp-admin-topbar">
  <div class="cp-admin-topbar-inner">Brand, context, navigation, actions</div>
</header>
<main class="cp-admin-container">
  <header class="cp-admin-page-heading">Page title and primary action</header>
  <!-- Page-specific composition -->
</main>
```

## Screen families

| Screen | Structure | Reusable classes |
| :--- | :--- | :--- |
| Overview | Main attention list + narrower next-action/recent-changes column; questions below | `cp-admin-container--home`, `cp-admin-overview` |
| Access workbench | Agent rail → central capability/member/rule editor → evaluation inspector | `cp-admin-workbench`, `cp-admin-rail`, `cp-admin-inspector` |
| Context Sources | Contextual Access navigation; catalog, import and bindings views; related sources grouped | `cp-admin-source-grid`, `cp-admin-form-grid`, `cp-admin-panel` |
| Investigation | Decision list on the left, selected trace/re-evaluation on the right | `cp-admin-investigation` |
| Catalog | Search/filter controls, aligned rows for tools/agents/people, detail view | `cp-admin-table-scroll`, `cp-admin-table` |
| Audit | Publication events in reading order, supporting context alongside on wide screens | Container + overview/two-column composition |
| Publish review | Change summary, regression results, changes, explicit publish action | `cp-admin-dialog`, `cp-admin-dialog--wide` when needed |

Source-specific view logic remains in the application. These are visual composition rules, not newly defined product workflows.

## Workbench geometry

Desktop columns are 245px / flexible / 295px with a 14px gap. Use `minmax(0, 1fr)` for the center so schemas, code, and tool identifiers cannot force the whole page wider. The inspector is sticky below the header; it becomes ordinary flow when relocated.

At intermediate widths, the inspector moves below the central editor before the central workspace is squeezed. On mobile, the agent selector becomes a horizontally scrollable strip, followed by the editor and evaluation controls in DOM reading order. Do not reorder form controls in CSS away from keyboard order.

## Responsive contract

Breakpoints derive from the mock, not a generic framework preset. They are literal media-query conditions; CSS custom properties cannot be substituted directly into media queries.

| Maximum viewport | Changes |
| :--- | :--- |
| 1290px | 24px gutters; 36px top/bottom padding; 207px rail + flexible editor; inspector beneath editor |
| 1110px | Context Source groups become one column |
| 990px | Overview becomes one column; workbench rail is 230px; inspector spans both columns; investigation list is 290px |
| 740px | 65px header; 14px page gutters; 25px top/30px bottom padding; 28px page headings; workbench/investigation/forms become one column |

The mock contains additional local adjustments at 840/730/680/660/580px. They are feature-specific rather than mandatory page-shell breakpoints; add them only when that component needs them.

## Content rhythm and alignment

Use 8px within compact control groups, 12–16px between related fields, 24px panel padding, and 32–48px between page sections. Labels sit above inputs. Tool identifiers use the mono family and wrap within their own cell. Align row actions to a consistent trailing area. Use tabular numeric formatting for quantities and durations.

Use rows with separators for a catalog or audit list. A panel groups a real task or selection; do not wrap every label or nested subsection in another panel. Containers have 15px corners, controls 8px, and actions 9px. Status badges use compact rounded rectangles.

Long tables and code can scroll inside a named region. Preserve column headers and provide accessible labels when the meaning is not clear from surrounding content. Never solve page overflow by applying `overflow-x: hidden` to the body.


## List tables

Decided on Context sources (Admin 048, 2026-11-06); Identity providers and Integrations follow the same rules.

- **First column**: an icon, the bold name, and one muted line of real detail (a base URL, a GET path in mono). The rest of the columns hold only data that helps choose a row, one idea per column. A qualifier goes inside the column it qualifies ("Of the subject" above the attributes), not in a separate vague column.
- **Status** is always a badge with a tone (`mcp-badge`: success for On or Enabled, warning for Draft or a review, neutral for Disabled), never plain text. Kinds and types are neutral badges.
- **Server and tool** read server first, then tool, each with its icon (`Server`, `Wrench`).
- **Actions** is the last column, with the header "Actions" right aligned over its buttons. Edit is a small ghost button and opens the form of the row. A destructive action is a small red button (`--danger-soft --small`) that opens a `ConfirmDialog`. Do not disable an action with an excuse ("Turn off X first"): do the steps it needs and say them in the confirmation.
- **Cells** are vertically centered.
- **Pager**: every list has the Investigate pager (`TracePager`) under the table: the record count, Previous, page / pages and Next. With one page, Previous and Next are disabled; a search goes back to page 1.

## Forms

- A form uses the full width of its container; do not leave an empty side column. Its name comes first; an on/off field such as Enabled sits at the top.
- **Footer**: the primary action on the left and, after the space, Cancel and the red destructive action on the right. An editor of one item has Cancel and Save on the right.
- **Repeated rows** (parameters, attributes) of a form share one grid, so their columns line up from one section to the next. Remove has the height of the fields and the same width in every row; the buttons of one row have one size.
- **Sections** of a form have a title and a one-line explanation under it. Each option of a select says what it means ("Verified subject ID · from the token (sub)"); an example of the chosen option can follow as helper text.
- **Page heading**: its action keeps the normal size and one line (`access-primary-action`). Help about the whole page sits behind a help icon beside the title, not in a side box.
- Use the select for a choice from a list; `cp-admin-segmented` is not used on product screens. Never show a free-text field for a value that the system must compute.

## States and overlays

Keep space stable when a query is loading; a skeleton should follow the eventual row geometry. Empty states explain the missing item and offer the relevant action. Error states preserve entered values. ALLOW/DENY/PENDING include text or an icon; color is supplementary.

The CSS supplies dialog appearance only. Use a native modal dialog or the selected accessible UI primitive for focus trapping, Escape, return focus, and accessible naming. Ordinary dialogs cap at 520px; the rule editor caps at 750px. Reserve 16px viewport clearance and scroll within the dialog. Avoid nesting dialogs.

A side panel opens from the right edge over a dimmed page and uses the full window height. The default width is 480px; the wide width is 880px, for a list and a detail side by side (for example the revision history: a timeline on the left, the selected revision on the right). Below 760px a wide panel stacks the list above the detail. On a narrow window the panel takes the full width. Its motion is a slide from the right and is turned off for `prefers-reduced-motion`.

Show the selected navigation item using `aria-current="page"`. An unpublished-change indicator does not replace the normal page title or primary navigation. Avoid recreating the mock's entire application inside the design system.
