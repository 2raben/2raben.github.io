/** What the overview and a variant's own pages know about a name candidate. */
export interface VariantMeta {
  /**
   * Route segment and folder name: the variant's pages live in
   * src/pages/<slug>/, its layout, components and theme in src/variants/<slug>/,
   * and its daisyUI theme is named <slug>.
   */
  slug: string;
  /** Studio name as shown on the site. */
  name: string;
  /** One sentence under the name, on the overview and the variant's home page. */
  tagline: string;
}
