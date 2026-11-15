# Architecture

A static website built with Astro 7, Tailwind CSS 4 and daisyUI 5
([ADR 0001](decisions/0001-build-a-static-site-with-astro-and-daisyui.md)) and
published on GitHub Pages. It has no server and no client-side JavaScript. Until
the studio's name is chosen, the site holds one complete version per name
candidate ([ADR 0002](decisions/0002-compare-name-candidates-as-variant-routes.md)).
All text on the site is German, written with Swiss spelling ("ss", not "ß").
See [CONTRIBUTING.md](../../CONTRIBUTING.md) for checks.

## Routes

| Route | Page | Source |
| --- | --- | --- |
| `/` | Overview of the name candidates, each in its own theme | [src/pages/index.astro](../../src/pages/index.astro) |
| `/<variant>/` | Home: name, tagline, game cards | [src/pages/[variant]/index.astro](../../src/pages/[variant]/index.astro) |
| `/<variant>/ueber-uns/` | About the studio | [src/pages/[variant]/ueber-uns.astro](../../src/pages/[variant]/ueber-uns.astro) |
| `/<variant>/spiele/<game>/` | Game idea, what to expect, controls, play link | [src/pages/[variant]/spiele/[game].astro](../../src/pages/[variant]/spiele/[game].astro) |

`/moto-devil/` and `/carrrgh/` on the same domain belong to the games' own Pages
sites and take precedence; no route of this site may use them.

## Modules

| Path | Responsibility |
| --- | --- |
| [src/variants.ts](../../src/variants.ts) | Name candidates: slug, name, daisyUI theme, tagline; rejects reserved slugs |
| [src/content.config.ts](../../src/content.config.ts) | The `games` collection schema: title, tagline, `playUrl`, `sourceUrl`, order |
| [src/content/games/](../../src/content/games/) | One Markdown file per game; the file name is the route segment |
| [src/layouts/Layout.astro](../../src/layouts/Layout.astro) | HTML shell, `data-theme`, navigation and footer of a variant |
| [src/components/GameCard.astro](../../src/components/GameCard.astro) | A game card linking to the game and to its page |
| [src/lib/url.ts](../../src/lib/url.ts) | `href()`: prefixes internal paths with the base path |
| [src/styles/global.css](../../src/styles/global.css) | Tailwind, typography plugin, and the enabled daisyUI themes |
| [astro.config.mjs](../../astro.config.mjs) | Site URL and base path from `SITE_URL` / `BASE_PATH`, trailing slashes, Tailwind |

## Conventions

- Link internal pages with `href("/path/")`, never a bare `/path/`, so the site
  works under a base path. URLs end with a slash (`trailingSlash: "always"`).
- Game links point to the games' deployments (`playUrl`); this site never copies
  game builds. When the organization is renamed, update every `playUrl` and
  `sourceUrl`.
- Style with daisyUI components and Tailwind utilities. A theme used by a variant
  must be enabled in `src/styles/global.css`.

## Deployment

[pages.yml](../../.github/workflows/pages.yml) builds and deploys `dist/` on every
push to `main`; [ci.yml](../../.github/workflows/ci.yml) runs `mise run check` on
pull requests. The repository name decides the address: a repository named
`<owner>.github.io` is served at `https://<owner>.github.io/`; any other name at
`https://<owner>.github.io/<repository>/`. On the free organization plan the
repository must be public, and Pages must use "GitHub Actions" as its source.
