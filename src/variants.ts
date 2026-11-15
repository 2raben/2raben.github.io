/**
 * Name candidates for the studio. Each variant is a complete version of the site
 * under its own route (/<slug>/) and shares the games in src/content/games/.
 * Give a variant its own look by changing its daisyUI theme, or by adding
 * components that only it uses.
 */
export interface Variant {
  /** Route segment; must not collide with a game's GitHub Pages path. */
  slug: string;
  /** Studio name as shown on the site. */
  name: string;
  /** daisyUI theme; enable it in src/styles/global.css. */
  theme: string;
  /** One sentence under the name on the home page. */
  tagline: string;
}

export const variants: Variant[] = [
  {
    slug: "schafbock-studio",
    name: "Schafbock Studio",
    theme: "retro",
    tagline: "Kleine Spiele mit Dickschädel.",
  },
  {
    slug: "egg-settlers",
    name: "Egg Settlers",
    theme: "cupcake",
    tagline: "Aus kleinen Ideen schlüpfen Spiele.",
  },
  {
    slug: "november-games",
    name: "November Games",
    theme: "nord",
    tagline: "Entstanden an einem Donnerstag im November.",
  },
  {
    slug: "waldstatt-games",
    name: "Waldstatt Games",
    theme: "forest",
    tagline: "Hobby-Spiele, direkt im Browser spielbar.",
  },
];

/**
 * Paths served by the games' own GitHub Pages sites on the same domain. A
 * project site takes precedence over the organization site, so a variant with
 * one of these slugs would be unreachable.
 */
const reservedSlugs = new Set(["moto-devil", "carrrgh"]);

for (const variant of variants) {
  if (reservedSlugs.has(variant.slug)) {
    throw new Error(`Variant slug "${variant.slug}" is a game's Pages path`);
  }
}
