# Visual Specification in the Prototype

The visual specification of a new screen is a **layout prototype**: the real Admin code with fixed data, on a design branch. It shows the target screen, not the screen that the backend supports today. This page tells how to build it and how to mark what the backend does not serve yet.

## Process

1. **Branch and worktree.** Create a `git worktree` on a branch `design/<slug>` from `main`. The prototype is never merged into `main`. The specification links the branch and the folder as its visual reference.
2. **Real screens, fixed data.** Change the real Admin screens and reuse the design system. Keep fixed data in one file next to the prototype. Use realistic data from the central use case, for example an agent that merges a pull request in a GitHub repository. No API call writes data.
3. **Layout first.** Define the layout with the user on the running prototype. Do not block on backend endpoints or field names. Collect them in the "Backend dependencies" section of the specification, each with a link to the backend specification.
4. **Mark what the backend does not serve.** Each element whose data the backend does not serve yet has the [Waiting backend chip](#waiting-backend-chip).
5. **Warn before an increment.** An element that no backend specification defines needs a backend change. Tell the user before you draw it, and record it in the specification.
6. **Say what was intended, not what is missing.** The prototype shows no text such as "data not available". The chip tooltip says what the element is for.
7. **Remove the chip at implementation.** When the backend implements an item, remove the chip of each element that the item unblocks, and mark the item as resolved in the specification.

The chip is for the prototype only. The real Admin never shows it. A limitation of the real Admin uses the temporary warning that [AGENTS.md](../../AGENTS.md) describes.

## Waiting backend chip

Text: `Waiting backend · <backend specification>`, for example `Waiting backend · 033`.

The tooltip (hover and keyboard focus) has one or two sentences that say what the element is for, then the backend specification: "Shows whether the last publication applies now or still waits for the relations to update. Backend 033."

```tsx
<WaitingBackend spec="033" tip="Shows whether the last publication applies now or still waits for the relations to update." />
```

The component and its style are part of the prototype (`WaitingBackend.tsx`, class `waiting-backend`). They use the dashed amber style of the earlier Planned tag.

## Example

Admin 026 (Agent Delegation Editor) and Admin 027 (Tool Resource Mapping Review) use the prototype on the branch `design/agent-delegation-screens`.
