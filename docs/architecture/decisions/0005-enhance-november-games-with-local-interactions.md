---
tags: [adr]
status: accepted
date: 2026-11-15
amends:
  - 0001-build-a-static-site-with-astro-and-daisyui.md
  - 0004-allow-optional-client-side-scripts-in-a-variant.md
sources:
  - src/variants/november-games/Layout.astro
  - src/variants/november-games/interactions.ts
  - src/variants/november-games/scene.ts
  - src/variants/november-games/landmarks.ts
  - src/variants/november-games/SynthwaveScene.astro
  - src/variants/november-games/KeyboardControls.astro
  - ../../pitches/november-games/pitch--zukunftstag-cyberpunk.md
---

# 0005 — Enhance November Games with local interactions

## Context

After the initial CSS-only November Games design, the user explicitly requested
more synthwave graphics, canvas effects responding to mouse and keyboard, and
keyboard navigation. They also asked to remove the numeric November motif and
allowed SVG. A subsequent request made the scene a full-screen background with
Mythen and Einsiedeln monastery illustrations. These interactions need
client-side behaviour, revising the original
pitch's exclusion of presentation JavaScript and the no-JavaScript consequence
of [ADR 0001](0001-build-a-static-site-with-astro-and-daisyui.md).
[ADR 0004](0004-allow-optional-client-side-scripts-in-a-variant.md) already
allows optional scripts; this record details the November Games canvas and
keyboard-navigation constraints.

CSS and SVG alone can provide static illustrations and hover states but cannot
provide the requested canvas controls. A rendering library or client framework
would add dependencies for a single bounded scene. Native browser APIs suffice.

## Decision

For November Games, extend ADR 0004 to allow optional session storage for the
effects preference and a document-level Alt+K navigation shortcut. Other key
handling remains scoped to focused controls; no network requests are added.

Keep static Astro output and add variant-local TypeScript, bundled through the
November Games layout. Use native Canvas 2D for a fixed full-viewport landscape
on every page of the variant, with shared original landmark paths for its SVG
fallback. Use SVG for decorative game illustrations. The renderer bounds its
pixel density, total raster size, frame rate and impulse count, stops in hidden
tabs, and respects
a pause control and `prefers-reduced-motion`. Pause state is optional session
storage; no input events leave the browser.

Keep every essential navigation action as an ordinary `href()` link. Add a
visible button and Alt+K shortcut for a native modal navigation dialog; preserve
native Tab, Enter and Escape behaviour and restore focus after closing. Arrow
and Home/End handling is scoped to focused link groups. The decorative background
is hidden from assistive technology and never intercepts pointer events. Arrow
handling is scoped to the visible scene-control button; native button activation
provides impulses with click, Enter or Space. Document-level pointer observation
never prevents default actions and ignores interactive targets for impulses. Do not intercept editing fields,
composition or unrelated browser shortcuts. Reduced motion disables visual
movement but does not disable keyboard navigation.

All code and assets stay within the November Games variant. Other variants and
shared game content remain independent. No new packages, remote assets, network
requests, server or client framework are introduced.

## Consequences

- November Games gains interactive scenery while remaining usable with JavaScript
  disabled or without a 2D context. Enhancement controls are hidden without JS.
- The original no-client-JavaScript consequence is relaxed for this requested
  interaction; static hosting and the reasons for choosing Astro are preserved.
- Rendering, pause/resume, focus behaviour and input handling need browser
  validation, beyond a successful static build.
- Artwork is decorative, not a game screenshot or copied game asset. Game facts
  and deployments still come from the shared content collection.

## The tell

- `mise run check` passes. `rg -n '<script|requestAnimationFrame|sessionStorage'
  src/variants/november-games` locates the variant-local interaction code.
- Disable JavaScript or the 2D context: the SVG scenery and all core links still
  work. Check desktop and phone widths for overflow, readable controls and focus.
- Open Navigation via its button and Alt+K. Test arrows, Home/End, Tab, Enter,
  Escape, focus restoration and same-page links. Editing fields must retain input.
- Focus «Szene steuern» and test arrows and Space; Tab must leave it. Test pointer
  movement over the page and clicks outside links and controls, then pause or
  enable reduced motion: continuous
  rendering and parallax stop while links and keyboard navigation still work.
- Scroll and resize: the canvas must remain fixed and viewport-sized, with
  readable content and reachable links above it. Inspect animation scheduling
  with the tab hidden.
  Source searches cannot prove performance, visual quality or keyboard usability.
