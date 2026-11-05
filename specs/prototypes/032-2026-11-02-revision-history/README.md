# Archived Prototype: Admin 032

> Temporal record. Read [the prototypes README](../README.md) first. This is not the current Admin and not a source of truth.

- **Specification**: [032 — Revision History](../../032-2026-11-02-revision-history.md)
- **Screens at that time**: the revision history panel in Delegation and access (Permissions), and the revision of a decision in the Investigate inspector. This prototype was drawn in the real screens, before the `/prototype` route existed.
- **Snapshot**: the 15 files changed by commit `28bc29c` (2026-11-02) on the earlier branch `design/038-revision-history`, as they were at that commit. The same change is commit `5d92ea7` on `main`.
- **This specification's part**: `src/features/access/delegation/RevisionHistory.tsx` (fixed data), `prototypeRevision` in `src/features/investigate/DecisionInspector.tsx`, the changes to `PublishBar.tsx`, `DelegationEditor.tsx` and `PermissionsPage.tsx`, and the new `SidePanel` component with its design system documentation and styles.

The files keep their original paths under `src/` and `docs/` in this folder. Their imports resolve against the code at commit `28bc29c` (`git show 28bc29c:<path>`), not against the current code. The folder is not compiled.
