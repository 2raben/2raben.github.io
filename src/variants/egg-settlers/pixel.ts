/**
 * A small pixel-art renderer for this variant's illustrations, which look like
 * the top-down maps of 1990s settlement games without copying any of them.
 *
 * A drawing is a grid of colors, filled from hand-drawn rows or from the
 * generators below (trees, huts, the egg, paths). It becomes one SVG path per
 * color, one rectangle run per row, so a drawing stays a handful of elements
 * however many pixels it has. A seeded random generator keeps every build
 * identical.
 */

export interface Layer {
  fill: string;
  d: string;
}

/** A deterministic random generator (mulberry32). */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Pixels {
  private readonly cells: (string | undefined)[];

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.cells = new Array<string | undefined>(width * height);
  }

  get(x: number, y: number): string | undefined {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return undefined;
    return this.cells[y * this.width + x];
  }

  has(x: number, y: number): boolean {
    return this.get(x, y) !== undefined;
  }

  set(x: number, y: number, color: string | undefined): void {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return;
    this.cells[py * this.width + px] = color;
  }

  rect(x: number, y: number, w: number, h: number, color: string): void {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) this.set(px, py, color);
    }
  }

  /** Draws rows of palette keys; keys missing from the palette stay as they are. */
  rows(
    rows: readonly string[],
    palette: Record<string, string>,
    ox = 0,
    oy = 0,
  ): void {
    rows.forEach((row, y) => {
      [...row].forEach((key, x) => {
        const color = palette[key];
        if (color) this.set(ox + x, oy + y, color);
      });
    });
  }

  /**
   * Copies another drawing's colored pixels onto this one. A shadow darkens
   * the color beneath it instead of replacing it.
   */
  stamp(sprite: Pixels, ox: number, oy: number): void {
    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        const color = sprite.get(x, y);
        if (!color) continue;
        const under = this.get(ox + x, oy + y);
        this.set(
          ox + x,
          oy + y,
          color === colors.shadow && under?.startsWith("#")
            ? darken(under, 0.7)
            : color,
        );
      }
    }
  }

  /** One SVG path per color, made of one run per row. */
  layers(): Layer[] {
    const paths = new Map<string, string[]>();
    for (let y = 0; y < this.height; y++) {
      let x = 0;
      while (x < this.width) {
        const color = this.get(x, y);
        let end = x + 1;
        while (end < this.width && this.get(end, y) === color) end++;
        if (color) {
          const list = paths.get(color) ?? [];
          list.push(`M${x} ${y}h${end - x}v1H${x}z`);
          paths.set(color, list);
        }
        x = end;
      }
    }
    return [...paths].map(([fill, parts]) => ({ fill, d: parts.join("") }));
  }
}

/** A hex color with each channel multiplied by factor. */
export function darken(hex: string, factor: number): string {
  const value = Number.parseInt(hex.slice(1, 7), 16);
  const channel = (shift: number) =>
    Math.round(((value >> shift) & 255) * factor)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

/** The drawing as a CSS url() to an SVG, for tiled backgrounds. */
export function svgUrl(pixels: Pixels): string {
  const paths = pixels
    .layers()
    .map((layer) => `<path fill="${layer.fill}" d="${layer.d}"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels.width}" height="${pixels.height}" shape-rendering="crispEdges">${paths}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/* ---------- Palette ---------- */

export const colors = {
  shadow: "rgba(16, 36, 8, 0.32)",
  grass: "#4f9e2c",
  grassDark: "#3f8624",
  grassLight: "#67b83a",
  grassDeep: "#33731c",
  flowers: ["#f0a3c4", "#f4d65a", "#b9a3ea", "#f6f3e8", "#e8735f"],
  trail: "#cdb98f",
  trailLight: "#ddcfa9",
  trailDark: "#b8a479",
  trailEdge: "#9c8a62",
  leafOutline: "#1d4612",
  leafDark: "#2c661b",
  leaf: "#3d8726",
  leafLight: "#58a833",
  leafShine: "#7cc44a",
  trunk: "#5a3a1c",
  trunkLight: "#7a5230",
  thatchOutline: "#5a3c18",
  thatchDark: "#94672a",
  thatch: "#ba8b3d",
  thatchLight: "#dcb05a",
  wall: "#a06d3b",
  wallDark: "#6e4724",
  door: "#3e2814",
  stone: "#a39f96",
  stoneDark: "#7a766e",
  stoneLight: "#c4c0b6",
  mortar: "#5f5b54",
  slate: "#58626b",
  dome: "#5f7d72",
  domeLight: "#86a596",
  wood: "#8b5a2b",
  woodDark: "#5a3818",
  woodLight: "#b07a42",
  dirt: "#9a7a4e",
  dirtDark: "#7f6340",
  water: "#3f7fb5",
  waterDeep: "#2f6290",
  waterLight: "#7fb3dd",
  wheat: "#dcbc4c",
  wheatDark: "#bf9c33",
  hat: "#e2b84a",
  skin: "#f0c08f",
  legs: "#3b2a1c",
  ink: "#2b1d12",
  yolk: "#e0a526",
  white: "#fffdf4",
};

export const shell = {
  outline: "#5a4630",
  deep: "#b39466",
  dark: "#cdb07e",
  mid: "#e8d4a8",
  light: "#f7ecd2",
  shine: "#ffffff",
  seam: "#a68858",
};

/* ---------- Shapes ---------- */

type Paint =
  | string
  | ((x: number, y: number, nx: number, ny: number) => string | undefined);

/** Fills an ellipse; a function paint can vary the color or skip pixels. */
export function ellipse(
  p: Pixels,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  paint: Paint,
): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      const color = typeof paint === "string" ? paint : paint(x, y, nx, ny);
      if (color) p.set(x, y, color);
    }
  }
}

/** Draws a one-pixel line. */
export function line(
  p: Pixels,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    p.set(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, color);
  }
}

/** Gives the drawn pixels that touch an empty one an outline color. */
export function outline(p: Pixels, color: string): void {
  const edges: [number, number][] = [];
  for (let y = 0; y < p.height; y++) {
    for (let x = 0; x < p.width; x++) {
      if (!p.has(x, y)) continue;
      if (
        !p.has(x - 1, y) ||
        !p.has(x + 1, y) ||
        !p.has(x, y - 1) ||
        !p.has(x, y + 1)
      ) {
        edges.push([x, y]);
      }
    }
  }
  for (const [x, y] of edges) p.set(x, y, color);
}

/** A four-pointed sparkle. */
export function sparkle(p: Pixels, x: number, y: number, color: string): void {
  p.set(x, y, colors.white);
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    p.set(x + dx, y + dy, color);
  }
}

/* ---------- Generators ---------- */

/** A tile of meadow: grass in three greens, tufts and a few flowers. */
export function grassTile(seed: number, size = 48, flowers = 6): Pixels {
  const rng = seeded(seed);
  const p = new Pixels(size, size);
  p.rect(0, 0, size, size, colors.grass);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const r = rng();
      if (r < 0.15) p.set(x, y, colors.grassDark);
      else if (r < 0.23) p.set(x, y, colors.grassLight);
    }
  }
  for (let i = 0; i < 16; i++) {
    const x = Math.floor(rng() * size);
    const y = Math.floor(rng() * size);
    p.set(x, y, colors.grassDeep);
    p.set(x, (y + size - 1) % size, colors.grassDark);
    p.set((x + 1) % size, y, colors.grassLight);
  }
  for (let i = 0; i < flowers; i++) {
    const x = Math.floor(rng() * size);
    const y = Math.floor(rng() * size);
    const flower =
      colors.flowers[Math.floor(rng() * colors.flowers.length)] ?? colors.white;
    p.set(x, y, flower);
    if (rng() < 0.5) p.set((x + 1) % size, y, flower);
  }
  return p;
}

/** Dirt paths along routes of points, with darker edges and a speckled surface. */
export function trails(
  p: Pixels,
  routes: readonly (readonly [number, number])[][],
  width: number,
  seed: number,
): void {
  const mask = new Pixels(p.width, p.height);
  const r = width / 2;
  for (const route of routes) {
    for (let i = 1; i < route.length; i++) {
      const [x0, y0] = route[i - 1] ?? [0, 0];
      const [x1, y1] = route[i] ?? [0, 0];
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let s = 0; s <= steps; s++) {
        const t = s / Math.max(steps, 1);
        ellipse(mask, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, r, "x");
      }
    }
  }
  const rng = seeded(seed);
  for (let y = 0; y < p.height; y++) {
    for (let x = 0; x < p.width; x++) {
      if (!mask.has(x, y)) continue;
      const edge =
        !mask.has(x - 1, y) ||
        !mask.has(x + 1, y) ||
        !mask.has(x, y - 1) ||
        !mask.has(x, y + 1);
      const roll = rng();
      p.set(
        x,
        y,
        edge
          ? colors.trailEdge
          : roll < 0.14
            ? colors.trailLight
            : roll < 0.24
              ? colors.trailDark
              : colors.trail,
      );
    }
  }
}

/** A leafy tree with its shadow, lit from the upper left. */
export function tree(seed: number, size = 7): Pixels {
  const rng = seeded(seed);
  const w = size * 2 + 6;
  const h = Math.round(size * 2.9) + 3;
  const p = new Pixels(w, h);
  const cx = w / 2;
  const cy = size + 1;
  ellipse(p, cx + 2, h - 2.5, size * 0.95, 2.2, colors.shadow);
  for (let y = Math.round(cy + size * 0.4); y < h - 2; y++) {
    p.set(cx - 1, y, colors.trunkLight);
    p.set(cx, y, colors.trunk);
  }
  const canopy = new Pixels(w, h);
  const blobs: [number, number, number][] = [[cx, cy, size]];
  for (let i = 0; i < 4; i++) {
    blobs.push([
      cx + (rng() - 0.5) * size * 1.1,
      cy + (rng() - 0.5) * size * 0.9,
      size * (0.45 + rng() * 0.25),
    ]);
  }
  for (const [bx, by, br] of blobs) {
    ellipse(canopy, bx, by, br, br * 0.92, (x, y) => {
      const light =
        (-0.55 * (x + 0.5 - cx)) / size -
        (0.75 * (y + 0.5 - cy)) / size +
        (rng() - 0.5) * 0.7;
      return light > 0.75
        ? colors.leafShine
        : light > 0.25
          ? colors.leafLight
          : light > -0.35
            ? colors.leaf
            : colors.leafDark;
    });
  }
  outline(canopy, colors.leafOutline);
  p.stamp(canopy, 0, 0);
  return p;
}

/** A low bush. */
export function bush(seed: number, size = 4): Pixels {
  const rng = seeded(seed);
  const p = new Pixels(size * 2 + 4, size * 2 + 2);
  ellipse(p, size + 3, size * 1.6 + 1, size, 1.6, colors.shadow);
  const leaves = new Pixels(p.width, p.height);
  ellipse(leaves, size + 1.5, size + 0.5, size, size * 0.8, (x, y) => {
    const light =
      -(x + 0.5 - size - 1.5) / size -
      (y + 0.5 - size) / size +
      rng() * 0.6 -
      0.3;
    return light > 0.4
      ? colors.leafLight
      : light > -0.3
        ? colors.leaf
        : colors.leafDark;
  });
  outline(leaves, colors.leafOutline);
  p.stamp(leaves, 0, 0);
  return p;
}

/** A hut with a thatched roof, plank walls on a stone footing, door and window. */
export function hut(w = 20, roofH = 9, wallH = 8): Pixels {
  const h = roofH + wallH + 2;
  const p = new Pixels(w + 3, h);
  ellipse(p, w / 2 + 2.5, h - 2, w / 2 + 1, 2, colors.shadow);
  for (let y = roofH; y < roofH + wallH; y++) {
    for (let x = 1; x < w - 1; x++) {
      const footing = y === roofH + wallH - 1;
      p.set(
        x,
        y,
        x === 1 || x === w - 2
          ? colors.thatchOutline
          : footing
            ? x % 2
              ? colors.stone
              : colors.stoneDark
            : x % 3 === 0
              ? colors.wallDark
              : colors.wall,
      );
    }
  }
  const doorX = Math.floor(w / 2) + 1;
  p.rect(doorX, roofH + 2, 3, wallH - 3, colors.door);
  p.rect(4, roofH + 2, 2, 2, colors.ink);
  for (let i = 0; i < roofH; i++) {
    const inset = Math.max(0, Math.round((roofH - 1 - i) * 0.45));
    for (let x = inset; x <= w - 1 - inset; x++) {
      const edge = x === inset || x === w - 1 - inset || i === 0;
      p.set(
        x,
        i,
        edge
          ? colors.thatchOutline
          : i === roofH - 1
            ? colors.thatchDark
            : i === 1
              ? colors.thatchLight
              : (x + i) % 4 === 0
                ? colors.thatchDark
                : (x - i) % 5 === 0
                  ? colors.thatchLight
                  : colors.thatch,
      );
    }
  }
  return p;
}

/**
 * A stone church with two towers and onion domes, seen from above: a loose nod
 * to Einsiedeln, not a picture of its monastery.
 */
export function twoTowers(): Pixels {
  const p = new Pixels(36, 31);
  ellipse(p, 20, 28.5, 17, 2.5, colors.shadow);
  p.rect(7, 12, 22, 3, colors.slate);
  for (let y = 15; y < 28; y++) {
    for (let x = 7; x < 29; x++) {
      p.set(x, y, (x + y) % 7 === 0 ? colors.stoneDark : colors.stone);
    }
  }
  for (let x = 9; x < 28; x += 3) {
    p.set(x, 18, colors.ink);
    p.set(x, 22, colors.ink);
  }
  p.rect(16, 23, 4, 5, colors.door);
  for (const tx of [3, 25]) {
    for (let y = 7; y < 28; y++) {
      for (let x = tx; x < tx + 8; x++) {
        p.set(
          x,
          y,
          x === tx
            ? colors.stoneLight
            : x === tx + 7
              ? colors.stoneDark
              : colors.stone,
        );
      }
    }
    p.rect(tx + 3, 11, 2, 3, colors.ink);
    p.rect(tx + 3, 17, 2, 3, colors.ink);
    const widths = [2, 4, 6, 8, 6];
    widths.forEach((width, i) => {
      for (let x = 0; x < width; x++) {
        p.set(
          tx + 4 - width / 2 + x,
          2 + i,
          x < width / 2 ? colors.domeLight : colors.dome,
        );
      }
    });
    p.rect(tx + 3, 0, 2, 2, colors.ink);
  }
  return p;
}

/**
 * The giant egg, lit from the upper left. With rings, it is built of courses
 * of shell with seams and joints; `only` draws just that course, counted from
 * the bottom.
 */
export function egg(w: number, h: number, rings = 0, only = 0): Pixels {
  const p = new Pixels(w, h);
  const ring = rings ? Math.floor(h / rings) : h;
  const half = (y: number) => {
    const t = ((y + 0.5) / h) * 2 - 1;
    return (w / 2) * Math.sqrt(Math.max(0, 1 - t * t)) * (0.84 + 0.16 * t);
  };
  const inside = (x: number, y: number) =>
    y >= 0 && y < h && Math.abs(x + 0.5 - w / 2) <= half(y);
  for (let y = 0; y < h; y++) {
    const course = rings
      ? Math.min(rings, Math.floor((h - 1 - y) / ring) + 1)
      : 0;
    if (only && course !== only) continue;
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) continue;
      const edge =
        !inside(x - 1, y) ||
        !inside(x + 1, y) ||
        !inside(x, y - 1) ||
        !inside(x, y + 1);
      if (edge) {
        p.set(x, y, shell.outline);
        continue;
      }
      const nx = (x + 0.5 - w / 2) / (w / 2);
      const ny = ((y + 0.5) / h) * 2 - 1;
      const dither = w >= 24 ? ((x + y) % 2 ? 0.07 : -0.07) : 0;
      const light = -0.6 * nx - 0.55 * ny + 0.1 + dither;
      let color =
        light > 0.8
          ? shell.shine
          : light > 0.4
            ? shell.light
            : light > -0.1
              ? shell.mid
              : light > -0.55
                ? shell.dark
                : shell.deep;
      if (rings && course < rings && (h - 1 - y) % ring === ring - 1) {
        color = shell.seam;
      } else if (rings && (x + (course % 2) * 5) % 10 === 0) {
        color = color === shell.deep ? shell.seam : shell.dark;
      }
      p.set(x, y, color);
    }
  }
  return p;
}

/** A settler: straw hat, tunic, and maybe a piece of shell on the head. */
export function settler(tunic: string, carrying = false): Pixels {
  const p = new Pixels(5, carrying ? 12 : 10);
  const top = carrying ? 2 : 0;
  if (carrying) {
    p.rows([".WWW.", "wWWWw"], { W: shell.light, w: shell.dark });
  }
  p.rows(
    [
      ".HHH.",
      "HHHHH",
      ".SSS.",
      ".SSS.",
      "CCCCC",
      "SCCCS",
      ".CbC.",
      ".L.L.",
      ".L.L.",
      ".sss.",
    ],
    {
      H: colors.hat,
      S: colors.skin,
      C: tunic,
      b: colors.legs,
      L: colors.legs,
      s: colors.shadow,
    },
    0,
    top,
  );
  return p;
}

/** A field of wheat in rows. */
export function field(w: number, h: number): Pixels {
  const p = new Pixels(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      p.set(
        x,
        y,
        edge ? colors.dirtDark : y % 3 === 0 ? colors.wheatDark : colors.wheat,
      );
    }
  }
  return p;
}

/** A pond with a sandy shore and a few ripples. */
export function pond(seed: number, rx: number, ry: number): Pixels {
  const rng = seeded(seed);
  const p = new Pixels(Math.ceil(rx * 2) + 2, Math.ceil(ry * 2) + 2);
  const cx = p.width / 2;
  const cy = p.height / 2;
  ellipse(p, cx, cy, rx, ry, colors.trailEdge);
  ellipse(p, cx, cy, rx - 1, ry - 1, (_x, _y, nx, ny) =>
    nx * nx + ny * ny > 0.55
      ? colors.waterDeep
      : rng() < 0.08
        ? colors.waterLight
        : colors.water,
  );
  return p;
}
