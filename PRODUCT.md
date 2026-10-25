# Product

## Register

product

## Users

Platform administrators and developers manage workspaces, environments, agents, and access configuration. The admin is the React + Vite management application. Public presentation belongs to the separate frontend module.

## Product Purpose

Make agent access configuration clear while keeping authentication, tenant authorization, and policy enforcement at their correct boundaries. UI state does not prove authorization.

## Brand Personality

Restrained, clear, operational. Follow the existing workbench and admin design system. Use short, explicit labels and truthful loading, empty, and error states.

## Anti-references

Do not introduce the public frontend's marketing hero, a new dark theme, remote fonts, decorative glass, generic card grids, or fictional connected data. Do not edit reference mocks to implement application behavior.

## Design Principles

- Preserve the existing admin visual language and semantic tokens.
- Show authorized workspace and environment context clearly.
- Keep page composition, reusable components, hooks, and transport separate.
- Explain the next action without making unverified security claims.
- Treat backend authorization as authoritative.

## Accessibility & Inclusion

Preserve the documented contrast, visible focus, native control semantics, readable labels, browser font scaling, and reduced-motion support. Status must not depend on color alone. See docs/design-system/tokens.md for the existing accessibility choices.

## Sources

AGENTS.md, README.md, docs/design-system/README.md, docs/design-system/DESIGN.md, docs/design-system/tokens.md, and specification 003 establish this context. The login design proposal is recorded separately in specification 004.
