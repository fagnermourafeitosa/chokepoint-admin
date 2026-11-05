---
spec: 022-2026-10-30-admin-design-system
title: Admin Design System Refresh
stack:
  - Demo instance (dev-infra/demo-instance - up.sh, after populate.py once; traffic.py for a recent history), workspace Acme, environment Production
  - Admin on http://acme.localhost:5174, signed in as beatriz@acme.test (AGENTS.md, Local Functional Test)
data: Read-only.
scenarios:
  - id: S1
    title: Shell and representative screens at desktop and 375 px
    criteria: [1, 2, 3, 6]
    steps:
      - Open the shell, Overview, Access (Delegation and access, Context sources, Integrations with Enterprise, Custom and Identity providers), the GitHub App form, dialogs, menus and the authentication screens, at desktop width and at 375 px.
      - Hover, press and focus the controls; turn on reduced motion.
    expected:
      - Fonts, logo and visual roles of the design system on every screen; no horizontal scroll at 375 px.
      - Hover, active and focus states match the documentation; transitions stop under reduced motion.
      - Behavior and navigation are unchanged.
    last_run:
      date: 2026-10-30
      result: passed
      notes: Unnumbered criteria; numbers are list positions. States from computed styles. Investigate was a placeholder then (its screens are in 020, 021 and 030). Under reduced motion the 1px hover lift remained. Colors and the primary button changed later in Admin 044.
---

# Functional test: Admin Design System Refresh

The colors, the primary button and the selected tone are tested in [Admin 044](044-2026-11-05-sober-visual-system.md).
