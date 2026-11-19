/**
 * The name candidates, in the order the overview at / lists them. Each variant
 * is a complete, independent version of the site:
 *
 * - src/pages/<slug>/: its pages (home, and usually ueber-uns and spiele/[game]);
 * - src/variants/<slug>/: its meta, layout, components, stylesheet and theme.
 *
 * Only the game texts (src/content/games/) and src/lib/ are shared.
 */
import zweiRabenGames from "./2raben-games/meta";
import eggSettlers from "./egg-settlers/meta";
import novemberGames from "./november-games/meta";
import schafbockStudio from "./schafbock-studio/meta";
import type { VariantMeta } from "./types";

export const variants: VariantMeta[] = [
  schafbockStudio,
  eggSettlers,
  novemberGames,
  zweiRabenGames,
];

/**
 * Paths served by the games' own GitHub Pages sites on the same domain. A
 * project site takes precedence over the organization site, so a variant with
 * one of these slugs would be unreachable.
 */
const reservedSlugs = new Set(["moto-devil", "carrrgh", "waldstatt"]);

/** Every folder in src/pages/ is a variant and must be listed above, and vice versa. */
const pageFolders = new Set(
  Object.keys(import.meta.glob("../pages/*/index.astro")).map(
    (path) => path.split("/")[2],
  ),
);

for (const { slug } of variants) {
  if (reservedSlugs.has(slug)) {
    throw new Error(`Variant "${slug}": the slug is a game's Pages path`);
  }
  if (!pageFolders.has(slug)) {
    throw new Error(
      `Variant "${slug}": src/pages/${slug}/index.astro is missing`,
    );
  }
}
for (const folder of pageFolders) {
  if (!variants.some((variant) => variant.slug === folder)) {
    throw new Error(
      `src/pages/${folder}/ is not listed in src/variants/index.ts`,
    );
  }
}
