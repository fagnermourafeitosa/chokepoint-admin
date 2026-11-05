# Visual Specification in the Prototype

The visual specification of a new screen is a **layout prototype**: Admin code with fixed data, under the `/prototype` route. It shows the target screen, not the screen that the backend supports today. This page tells how to build it and how to mark what the backend does not serve yet. The [`visual-spec` skill](../../.agents/skills/visual-spec/SKILL.md) is the step-by-step procedure.

## Process

1. **A prototype page.** Write the prototype in `specs/prototypes/<specification file name without .md>/`, on `main`, with its specification. It has no branch of its own. Register its page under `/prototype/<page>` in `src/features/prototype/PrototypePage.tsx`. It is not in the navigation and never replaces a real screen. The specification links the folder and the page as its visual reference. Open it at `http://127.0.0.1:5173/prototype/<page>` after you sign in. [`specs/prototypes/README.md`](../../specs/prototypes/README.md) has the folder rules and the index.
2. **Fixed data, real components.** Reuse the design system and the real components where they fit. Keep fixed data in one file in the prototype folder. Use realistic data from the central use case, for example an agent that merges a pull request in a GitHub repository. No API call writes data.
3. **Layout first.** Define the layout with the user on the running prototype. Do not block on backend endpoints or field names. Collect them in the "Backend dependencies" section of the specification, each with a link to the backend specification.
4. **Mark what the backend does not serve.** Each element whose data the backend does not serve yet has the [Waiting backend chip](#waiting-backend-chip).
5. **Warn before an increment.** An element that no backend specification defines needs a backend change. Tell the user before you draw it, and record it in the specification.
6. **Say what was intended, not what is missing.** The prototype shows no text such as "data not available". The chip tooltip says what the element is for.
7. **Remove the chip at implementation.** When the backend implements an item, remove the chip of each element that the item unblocks, and mark the item as resolved in the specification. When the real screen is implemented, remove the route of its prototype page in the same change and mark the prototype as Archived in [`specs/prototypes/README.md`](../../specs/prototypes/README.md). Keep the folder as a record of how the layout evolved. Do not update an archived prototype.

The chip is for the prototype only. The real Admin never shows it. A limitation of the real Admin uses the temporary warning that [AGENTS.md](../../AGENTS.md) describes.

## Waiting backend chip

Text: `Waiting backend · <backend specification>`, for example `Waiting backend · 033`.

The tooltip (hover and keyboard focus) has one or two sentences that say what the element is for, then the backend specification: "Shows whether the last publication applies now or still waits for the relations to update. Backend 033."

```tsx
<WaitingBackend spec="033" tip="Shows whether the last publication applies now or still waits for the relations to update." />
```

The component and its style are part of the prototype (`WaitingBackend.tsx`, class `waiting-backend`). They use the dashed amber style of the earlier Planned tag.

## Example

No prototype page is open. The archived prototypes of Admin 026, 027, 029, 030, 031, 036 and 041 are in `specs/prototypes/`. The index is in [`specs/prototypes/README.md`](../../specs/prototypes/README.md).
