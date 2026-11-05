# Layout Prototypes

> **Read this before you use any file in this directory.**
>
> Each folder here is a **layout prototype that belongs to one specification and to one moment in time**. It is not the current Admin, and it is not a source of truth.
>
> - The data are fixed and invented for the layout. They are not real fields, endpoints, claims, states or rules.
> - A prototype can show elements that the backend never implemented, or that a later specification changed or removed.
> - Do not import a file from this directory into real screens. Do not copy a prototype as an implementation.
> - To know the current behavior, read the newest specifications and the code in `src`. To know what a prototype meant, read the specification that owns it.

## What a prototype is

A prototype is the visual specification of an Admin screen: React code with fixed data that uses the real components and the design system. The rules are in [the visual specification rules](../../docs/design-system/visual-specification.md). The procedure is the [`visual-spec` skill](../../.agents/skills/visual-spec/SKILL.md).

## Layout

- One folder for each specification: `specs/prototypes/<specification file name without .md>/`, for example `041-2026-11-04-agent-report-only-mode/`.
- The folder holds the prototype screens, one fixed data file and the prototype CSS.
- A prototype is written on `main`, with its specification. It has no branch of its own.

## States

| State | Meaning | Route | Compiled |
| :--- | :--- | :--- | :--- |
| Active | Its specification is not `Implemented`. The layout is the target. | Registered in `src/features/prototype/PrototypePage.tsx` under `/prototype/<page>` | Yes, through the route import |
| Archived | Its specification is `Implemented` or superseded. The folder is a record of how the layout evolved. | Not registered | No. Its imports can point to components that changed or no longer exist. |

When the real screen is implemented, remove the route of its prototype in the same change and mark the prototype as Archived in the index below. Do not delete the folder. Do not update an archived prototype to follow later changes.

## Restored snapshots

The prototypes of Admin 026 to 036 were written before this directory existed, under `src/features/prototype/` and in the feature folders, and were deleted at implementation. Their folders here are **snapshots** restored from the Git history: the files keep their original `src/` paths, and their imports resolve against the code of the snapshot commit, not against the current code. Each folder has a `README.md` with the source commit and the part that belongs to its specification. One snapshot of `PrototypePage.tsx` can also hold the prototypes of other specifications of the same date. The "Visual reference" line of each of these specifications names the route and the `src/` paths of that time, and links its folder here.

## Index

| Specification | Folder | State | Notes |
| :--- | :--- | :--- | :--- |
| [026 — Agent Delegation Editor](../026-2026-10-31-agent-delegation-editor.md) | [026-2026-10-31-agent-delegation-editor](026-2026-10-31-agent-delegation-editor/) | Archived | Snapshot at `ed4c33d` (2026-11-02). Route `/prototype/agent`, tab Delegation and access. |
| [027 — Tool Resource Mapping Review](../027-2026-10-31-tool-resource-mapping-review.md) | [027-2026-10-31-tool-resource-mapping-review](027-2026-10-31-tool-resource-mapping-review/) | Archived | Snapshot at `d4319cb` (2026-11-02). Route `/prototype/tools`. |
| [029 — Agent Identity and Chokepoint Token Setup](../029-2026-10-31-agent-identity-and-chokepoint-token-setup.md) | [029-2026-10-31-agent-identity-and-chokepoint-token-setup](029-2026-10-31-agent-identity-and-chokepoint-token-setup/) | Archived | Snapshot at `46ee5ce` (2026-11-02). Routes `/prototype/agent` (tab Identity) and `/prototype/mcp-server`. |
| [030 — Investigate Agent, Subject and Token Exchanges](../030-2026-10-31-investigate-agent-subject-and-token-exchanges.md) | [030-2026-10-31-investigate-agent-subject-and-token-exchanges](030-2026-10-31-investigate-agent-subject-and-token-exchanges/) | Archived | Snapshot at `182c433` (2026-11-02). Route `/prototype/investigate`. |
| [031 — Agent Kill Switch](../031-2026-11-02-agent-kill-switch.md) | [031-2026-11-02-agent-kill-switch](031-2026-11-02-agent-kill-switch/) | Archived | Snapshot at `f632cbd` (2026-11-02). Route `/prototype/agent`, agent header. |
| [036 — Interactive Harness Access](../036-2026-11-03-interactive-harness-access.md) | [036-2026-11-03-interactive-harness-access](036-2026-11-03-interactive-harness-access/) | Archived | Snapshot at `7573f24` (2026-11-03). Routes `/prototype/harness-access` and `/prototype/harness-login`. |
| [041 — Agent Report-only Mode](../041-2026-11-04-agent-report-only-mode.md) | [041-2026-11-04-agent-report-only-mode](041-2026-11-04-agent-report-only-mode/) | Archived | Moved on 2026-11-05 from the branch `design/report-only-mode` (commit `4d0f28b`). The imports were changed for this folder, and it compiled and rendered at that date. The specification names the earlier branch and links this folder. Each "Waiting backend · 057" chip shows the state on 2026-11-04. |
