# Architecture

A static website built with Astro 7, Tailwind CSS 4 and daisyUI 5
([ADR 0001](decisions/0001-build-a-static-site-with-astro-and-daisyui.md)) and
published on GitHub Pages. It has no server, and no content depends on client-side
JavaScript; a variant may add small scripts for optional effects
([ADR 0004](decisions/0004-allow-optional-client-side-scripts-in-a-variant.md)). Until
the studio's name is chosen, the site holds one complete version per name
candidate ([ADR 0002](decisions/0002-compare-name-candidates-as-variant-routes.md)),
each with its own pages, layout and theme.
All text on the site is German, written with Swiss spelling ("ss", not "ß").
See [CONTRIBUTING.md](../../CONTRIBUTING.md) for checks.

## Variants

Each name candidate is an independent version of the site
([ADR 0003](decisions/0003-give-each-variant-its-own-pages-and-styles.md)) and owns
two folders named after its slug:

| Path | Contents |
| --- | --- |
| `src/pages/<slug>/` | Its pages: `index.astro`, `ueber-uns.astro`, `spiele/[game].astro`, and any pages only this variant has |
| `src/variants/<slug>/meta.ts` | Slug, name, and tagline |
| `src/variants/<slug>/Layout.astro` | HTML shell with `data-theme="<slug>"`, navigation, footer; loads `styles.css` |
| `src/variants/<slug>/GameCard.astro` | A game card linking to the game and to its page |
| `src/variants/<slug>/styles.css` | Tailwind, typography plugin, and daisyUI without built-in themes |
| `src/variants/<slug>/theme.css` | The variant's custom daisyUI theme, named after the slug |

The variants start from the same layout and pages, and their themes start as
copies of daisyUI's retro (Schafbock Studio), cupcake (Egg Settlers), nord
(November Games) and forest (Waldstatt Games). A variant may add components and
modules of its own to its folder. Change a variant only inside its own folders;
never import another variant's files.

### Schafbock Studio

A pop-art comic starring a superhero ram, shaped in the
[pitch](../pitches/schafbock-studio/pitch--pop-art-superhero.md). Its own theme
replaces the retro copy, and the comic face Bangers comes self-hosted from
`@fontsource/bangers`. Its folder `src/variants/schafbock-studio/` adds:

| Path | Contents |
| --- | --- |
| `Ram.astro`, `RamHead.astro` | The ram as SVG in four poses: landing (home), moto (Moto Devil), car (Car Drive), sketch (Über uns) |
| `Burst.astro`, `Icon.astro` | Sound-effect bursts and small comic icons |
| `comics.ts` | The variant's comic retelling of each game, keyed by game id; `getComicGames()` fails the build when a game has none |
| `MotoTour.astro`, `CarRoad.astro` | Charts of each game's facts: Moto Devil's countries, Car Drive's road and levels |
| `MotoDemo.astro`, `CarDemo.astro` | Key demos for each game's controls; hidden until their script runs |
| `effects.ts` | Optional effects on pointer movement, clicks and typing ([ADR 0004](decisions/0004-allow-optional-client-side-scripts-in-a-variant.md)) |

The game pages show the variant's comic copy first and the shared game Markdown
below it. Running text sits on flat backgrounds; halftone dots only appear behind
shapes and large display headings.

### Adding a variant

1. Copy `src/pages/<existing>/` and `src/variants/<existing>/` to the new slug.
2. Replace the old slug in the copied imports, set `meta.ts`, and rename the theme
   in `theme.css` to the new slug.
3. List the variant in `src/variants/index.ts` and import its `theme.css` in
   `src/styles/overview.css`.

## Routes

| Route | Page | Source |
| --- | --- | --- |
| `/` | Overview of the variants, each card in the variant's theme | [src/pages/index.astro](../../src/pages/index.astro) |
| `/<slug>/` | Home: name, tagline, game cards | `src/pages/<slug>/index.astro` |
| `/<slug>/ueber-uns/` | About the studio | `src/pages/<slug>/ueber-uns.astro` |
| `/<slug>/spiele/<game>/` | Game idea, what to expect, controls, play link | `src/pages/<slug>/spiele/[game].astro` |

`/moto-devil/` and `/carrrgh/` on the same domain belong to the games' own Pages
sites and take precedence; no route of this site may use them.

## Shared modules

| Path | Responsibility |
| --- | --- |
| [src/variants/index.ts](../../src/variants/index.ts) | Lists the variants for the overview; fails the build on unlisted page folders, missing pages, or reserved slugs |
| [src/variants/types.ts](../../src/variants/types.ts) | `VariantMeta`: slug, name, tagline |
| [src/content.config.ts](../../src/content.config.ts) | The `games` collection schema: title, tagline, `playUrl`, `sourceUrl`, order |
| [src/content/games/](../../src/content/games/) | One Markdown file per game; the file name is the route segment |
| [src/lib/games.ts](../../src/lib/games.ts) | `getGames()`: all games in display order |
| [src/lib/url.ts](../../src/lib/url.ts) | `href()`: prefixes internal paths with the base path |
| [src/styles/overview.css](../../src/styles/overview.css) | The overview's stylesheet; imports every variant's theme |
| [astro.config.mjs](../../astro.config.mjs) | Site URL and base path from `SITE_URL` / `BASE_PATH`, trailing slashes, Tailwind |

## Conventions

- Link internal pages with `href("/path/")`, never a bare `/path/`, so the site
  works under a base path. URLs end with a slash (`trailingSlash: "always"`).
- Game links point to the games' deployments (`playUrl`); this site never copies
  game builds. When the organization is renamed, update every `playUrl` and
  `sourceUrl`.
- Style with daisyUI components and Tailwind utilities and the variant's theme
  colors (`bg-base-100`, `btn-primary`, and so on), so a theme change restyles the
  whole variant.

## Deployment

[pages.yml](../../.github/workflows/pages.yml) builds and deploys `dist/` on every
push to `main`; [ci.yml](../../.github/workflows/ci.yml) runs `mise run check` on
pull requests. The repository name decides the address: a repository named
`<owner>.github.io` is served at `https://<owner>.github.io/`; any other name at
`https://<owner>.github.io/<repository>/`. On the free organization plan the
repository must be public, and Pages must use "GitHub Actions" as its source.
