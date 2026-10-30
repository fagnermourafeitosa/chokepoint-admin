# Chokepoint Admin Design System

The [reference image](../../specs/assets/022-admin-design-system/reference.png) defines the direction for the admin. The system uses a warm canvas, quiet surfaces, dark ink, yellow navigation and selection, and pink primary actions. Semantic success, warning and danger colors are distinct and accompanied by text. [Tokens](tokens.md) provide exact values.

## Typography and brand

Barlow Condensed Bold is used for page and section titles. IBM Plex Sans is used for interface copy and controls. IBM Plex Mono is used for code, identifiers and technical data. The home wordmark uses Anton in a yellow box with a dark border and offset shadow. Fonts are local; see [assets and licenses](fonts/README.md).

## Components

Reuse [the shared CSS](styles/index.css) for buttons, fields, panels, tables, badges, notices, menus, tabs and navigation. Use compact spacing and clear boundaries. Primary buttons have dark borders and short solid shadows; panels have lighter borders and subtle corners. Selected navigation uses yellow. Controls need visible focus, disabled and hover states, and states must not rely on color alone. Layouts must retain keyboard access, readable text, narrow-screen overflow handling and reduced-motion support.

The [specimen](preview.html) demonstrates reusable styles. [Layouts](layouts.md) and [components](components.md) describe composition and controls.

## Navigation patterns

Inner tabs share a divider: the active tab has a light surface and yellow underline; inactive tabs use a muted surface. Section navigation joins icon and label items in a dark outlined group, with yellow for the active item. The primary navigation uses compact uppercase labels and a yellow outlined active item with a short offset shadow. Hover uses a neutral surface or a lift into a deeper offset shadow, never yellow, so selection stays distinct; keyboard focus remains visible. [Components](components.md#hover-and-press) lists each treatment. See the reference images in [specification 022](../../specs/022-2026-10-30-admin-design-system.md).
