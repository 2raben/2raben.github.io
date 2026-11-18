/**
 * The web manifest that makes the Waldstatt installable (ADR 0006). Its start
 * URL and scope are the variant's path under the base path.
 */
import type { APIRoute } from "astro";
import { href } from "../../lib/url";
import meta from "../../variants/waldstatt-games/meta";

export const GET: APIRoute = () => {
  const scope = href(`/${meta.slug}/`);
  const manifest = {
    name: meta.name,
    short_name: "Waldstatt",
    description: meta.tagline,
    lang: "de",
    start_url: scope,
    scope,
    display: "standalone",
    background_color: "#1c3420",
    theme_color: "#1c3420",
    icons: [192, 512].map((size) => ({
      src: href(`/${meta.slug}/icon-${size}.png`),
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: "any",
    })),
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/manifest+json" },
  });
};
