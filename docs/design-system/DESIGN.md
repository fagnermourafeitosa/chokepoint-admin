# Chokepoint Admin Design System

The [reference image](../../specs/assets/022-admin-design-system/reference.png) defines the direction for the admin. The system uses a warm canvas, quiet surfaces and dark ink. Since [specification 044](../../specs/044-2026-11-05-sober-visual-system.md) each color has one meaning: yellow is the brand and the active primary navigation item, ink is the primary action, green is an allowed outcome and red a denied one. Other selections use a neutral paper tone. This is the same rule as the public site (frontend `DESIGN.md`). Semantic success, warning and danger colors are distinct and accompanied by text. [Tokens](tokens.md) provide exact values.

## Typography and brand

Barlow Condensed Bold is used for page and section titles. IBM Plex Sans is used for interface copy and controls. IBM Plex Mono is used for code, identifiers and technical data. The Xokepoint wordmark of the home uses Anton in a yellow box with a dark border and offset shadow; its first O is the arrow O of the favicon (frontend specifications 010 and 011). Fonts are local; see [assets and licenses](fonts/README.md).

## Components

Reuse [the shared CSS](styles/index.css) for buttons, fields, panels, tables, badges, notices, menus, tabs and navigation. Use compact spacing and clear boundaries. Primary buttons are ink with cream text and a short grey offset shadow; danger buttons are outlined in red; panels have lighter borders and subtle corners. Only the active primary navigation item uses yellow; other selected controls use the neutral selected tone. Controls need visible focus, disabled and hover states, and states must not rely on color alone. Layouts must retain keyboard access, readable text, narrow-screen overflow handling and reduced-motion support.

The [specimen](preview.html) demonstrates reusable styles. [Layouts](layouts.md) and [components](components.md) describe composition and controls.

## Navigation patterns

Inner tabs share a divider: the active tab has a light surface and an ink underline; inactive tabs use a muted surface. Section navigation joins icon and label items in a dark outlined group, with the neutral selected tone and an ink underline for the active item. The primary navigation uses compact uppercase labels and a yellow outlined active item with a short offset shadow. Hover uses a neutral surface or a lift into a deeper offset shadow, never yellow, so selection stays distinct; keyboard focus remains visible. [Components](components.md#hover-and-press) lists each treatment. See the reference images in [specification 022](../../specs/022-2026-10-30-admin-design-system.md).
