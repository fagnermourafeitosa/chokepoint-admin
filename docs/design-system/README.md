# Admin Design System

Reusable visual tokens, CSS primitives, and page composition rules for the React + Vite platform management application.

## Read and use

- [Visual language](DESIGN.md): colors, typography, shapes, elevation, components, and guardrails.
- [Token reference](tokens.md): exact values, roles, and documented normalizations.
- [Page layouts](layouts.md): overview, workbench, sources, investigation, catalog, and audit.
- [Static visual specimen](preview.html): typography, palette, controls, and a responsive workbench.
- [Reusable CSS entrypoint](styles/index.css): import once at the application root.
- [Font assets and licenses](fonts/README.md): self-hosted Barlow Condensed, IBM Plex Sans, and IBM Plex Mono.

- [Verification record](verification.md): checked assets, contrast pairs, and browser sizes.

- [Controls and navigation](components.md): reusable control appearances, header/footer patterns, and local demonstrations.

- [Visual specification in the mock](visual-specification.md): how to draw the ideal screen and mark elements that are not implemented.

## Source and scope

Derived from [workbench CSS](../chokepoint-workbench/styles.css) and [React screen structure](../chokepoint-workbench/src/app.tsx). The runnable source mock is [dist/index.html](../chokepoint-workbench/dist/index.html); its parent index references an absent `app.js`.

Specification 022 refreshes the admin visual system using its attached reference. The source remains intact. New semantic names consolidate repeated styles; contrast and tiny type changes are explicitly recorded in [tokens](tokens.md). The frontend owns an independent system, including its own fonts, naming, and page geometry. Similar values do not imply a shared package or cross-repository import.

## CSS integration

```tsx
// Import from the Vite application entrypoint when that entrypoint is created.
import '../docs/design-system/styles/index.css';
```

Put `data-cp-admin` on the document body in Vite's HTML entrypoint. Classes use `cp-admin-`; variables use `--cp-admin-`.

```html
<body data-cp-admin>
  <div id="root"></div>
</body>
```

Importing the entrypoint loads local variable fonts, tokens, scoped defaults, layout primitives, components, and the shadcn semantic bridge. CSS imports retain relative font URLs; retain the complete `styles/` and `fonts/` folders if copying the system. These assets make no remote font calls. The CSS declares standard `theme`, `base`, `components`, and `utilities` layers; it does not require Tailwind to render.

For Tailwind v4, compile the app's stylesheet with Tailwind, then import this entrypoint. Reference token values with utilities or map them in the app's theme. For shadcn, [adapters.css](styles/adapters.css) defines `--background`, `--primary`, `--input`, `--ring`, and related semantic variables. Keep the generated components' own behavior and semantics. Avoid adding a second component theme with competing literal values.

Native dialogs, keyboard/focus management, loading state, and permissions remain application responsibilities. CSS cannot implement a working policy editor, an accessible custom dialog, or a connection to an API.

## Preview

Serve this module with a local static server and open `docs/design-system/preview.html`. The specimen uses the actual reusable stylesheet, local fonts, and static sample data. It is not a replacement admin application.

## Maintenance

Change canonical values in `styles/tokens.css`, update the token table, and review the specimen at desktop, tablet, and mobile sizes. Keep user-facing statuses readable without color alone. No dark mode is specified.
