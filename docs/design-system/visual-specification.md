# Visual Specification in the Mock

The [workbench mock](../chokepoint-workbench/dist/index.html) is the visual specification of the target interface. It shows the ideal screen, not the screen that the backend supports today. This page tells how to change it and how to mark what is not implemented.

## Process

1. **Draw the ideal.** Change the mock until the user accepts the format. The user asks for each mock change. A mock change needs no formal specification.
2. **Start from stored data.** Before you propose or draw an element, check that the backend stores its data. Read the backend specification and the code. Do not propose an element from data that is not stored.
3. **Warn before an increment.** An element that needs data or behavior beyond what the backend stores today is an increment. Tell the user before you suggest it, and say what the backend must add.
4. **Mark what is not implemented.** Add the [Planned tag](#planned-tag) to each element that the backend or the Admin does not implement yet. The date is the day you add the tag.
5. **Say what was intended, not what is missing.** The mock shows no text such as "data not available" or "needs the signal". A Planned tag has a hover (and keyboard focus) tooltip of one or two sentences that say what the element is for. Put the reason that it is missing in the specification.
6. **Remove the tag at implementation.** When the element is implemented, remove its tag from the mock in the same change.

The Planned tag is for the mock only. The real Admin does not use it. A limitation of the real Admin uses the temporary warning that [AGENTS.md](../../AGENTS.md) describes.

## Planned tag

Text: `Planned · YYYY-MM-DD`. The date is the day of marking.

| Element | Marking |
| :--- | :--- |
| Field, card title or label | `planned-tag` badge next to the label. |
| Path dot (authorization path) | Dashed ring (`auth-planned`) and the badge inside the tooltip. |

### Differs tag

Use `Differs · YYYY-MM-DD` when the real Admin already has the element but behaves in another way, for example a counter that opens another screen. Use Planned only for an element that does not exist yet. Use the modifier `planned-tag--differs` (blue) on the same badge.

A Differs tag has a hover (and keyboard focus) tooltip that says what differs: what the real Admin does and what the mock shows. Put the text in `data-tip` and add `tabindex="0"`.

```html
<span class="planned-tag" tabindex="0"
  data-tip="Ranks each problem so the most urgent are read first.">Planned · 2026-10-29</span>
<span class="planned-tag planned-tag--differs" tabindex="0"
  data-tip="In the Admin, a reviewed signal leaves the Inbox. The mock keeps it, dimmed.">Differs · 2026-10-29</span>
```

```css
.planned-tag{display:inline-block;margin-left:8px;font-size:9px;font-weight:800;letter-spacing:.02em;color:#8a6a2f;background:#fdf3de;border:1px dashed #e3c98e;border-radius:5px;padding:2px 6px;vertical-align:middle;white-space:nowrap}
.auth-tip .planned-tag{margin:6px 0 0;color:#f1d9a3;background:transparent;border-color:#8a7440;width:max-content}
.auth-planned{background:transparent!important;border:2px dashed currentColor}
.planned-tag--differs{color:#2f5f8a;background:#e8f1fa;border-color:#a9c8e3}
```

The source is in [styles.css](../chokepoint-workbench/styles.css) and `dist/styles.css`. Compile the mock with the options in its `tsconfig.json`; the Admin `tsc` does not accept `module: none`, so pass the same options on the command line with `--ignoreConfig --strict false`.

## Example

The Investigate decision inspector marks the Identity, Relation and Tool review dots, the Context field, the repeat window and the "Rule that allowed" card. The backend decision trace stores only the final deny reason, so the other path steps are not recorded.
