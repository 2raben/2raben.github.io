---
tags: [adr]
status: accepted
date: 2026-11-15
amended-by:
  - 0005-enhance-november-games-with-local-interactions.md
  - 0006-make-waldstatt-games-a-browser-game.md
amends:
  - 0001-build-a-static-site-with-astro-and-daisyui.md
sources:
  - src/variants/schafbock-studio/effects.ts
  - src/variants/schafbock-studio/MotoDemo.astro
  - src/variants/schafbock-studio/CarDemo.astro
  - src/variants/schafbock-studio/Layout.astro
  - ../../pitches/schafbock-studio/pitch--pop-art-superhero.md
---

# 0004 — Allow optional client-side scripts in a variant

> Amended by [ADR 0005](0005-enhance-november-games-with-local-interactions.md):
> November Games stores an optional session-scoped effects preference and adds
> the Alt+K navigation shortcut. The original rationale below is preserved.
>
> Amended by [ADR 0006](0006-make-waldstatt-games-a-browser-game.md): Waldstatt
> Games' content depends on its scripts, and it uses localStorage, a service
> worker and PixiJS from npm. The rules below still hold for every other
> variant.

## Context

[ADR 0001](0001-build-a-static-site-with-astro-and-daisyui.md) built the site as
plain HTML and CSS, with no client-side JavaScript. The Schafbock Studio variant
([pitch](../../pitches/schafbock-studio/pitch--pop-art-superhero.md)) asks for
comic effects that react to pointer movement and keyboard input: eyes that follow
the pointer, sound-effect words on clicks and key presses, and small demos of the
games' keys. CSS alone reacts to hover and focus, but not to where the pointer is
or which key was pressed.

Alternatives considered:

- **CSS only.** Keeps ADR 0001 intact, but limits the effects to hover states; no
  pointer tracking and no keyboard effects.
- **A client-side framework** (an Astro island with React or similar). More
  machinery than a few event listeners need, and the project keeps to no
  client-side framework.
- **Plain TypeScript modules** loaded through Astro's processed `<script>` tags,
  which Astro bundles and serves from the site's own origin.

## Decision

A variant may load small plain TypeScript modules from its own folder through
Astro `<script>` tags in its layout or components. The scripts are optional
enhancements:

- every page's content, links and navigation work without them;
- parts that only work with a script, such as the key demos, stay `hidden` until
  the script reveals them;
- they handle keys only inside a focused widget, or listen without calling
  `preventDefault()`, so Tab, Enter, Space and the arrow keys keep their meaning
  elsewhere;
- they honour `prefers-reduced-motion`;
- they make no network requests, use no storage, and load no third-party code.

Schafbock Studio is the first variant to use this: `effects.ts` (loaded by its
`Layout.astro`) and the scripts in `MotoDemo.astro` and `CarDemo.astro`.

This amends ADR 0001, whose consequence "no client-side JavaScript" now reads "no
client-side JavaScript that the content depends on". Its other decisions remain.

## Consequences

- A variant can react to pointer and keyboard input without a framework; other
  variants and the overview at `/` stay script-free unless they opt in.
- Each script is code to maintain and test in a browser; `astro check` type-checks
  it, but only a browser shows whether the effects behave.
- Effects can distract or get in the way of assistive technology. Keeping them
  decorative (`aria-hidden`), out of focus order and quiet under reduced motion
  limits that, but each new effect needs the same care.

## The tell

- `rg -n "<script" src` finds script tags only in variant folders, each importing
  a module from the same folder.
- `rg -n "fetch\(|XMLHttpRequest|localStorage|sessionStorage|import\(\"http" src`
  finds nothing.
- With JavaScript disabled in the browser, every page still shows its content and
  links, and no empty demo panel appears. A search cannot prove this; check it by
  hand when adding a script.
