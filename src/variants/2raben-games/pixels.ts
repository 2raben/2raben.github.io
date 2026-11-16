/**
 * The variant's pixel art: palette, sprites and the backdrop of the raven
 * stage. This is the one source for every pixel on the site: PixelArt.astro
 * renders it as static SVG at build time, stage.ts draws the same data on a
 * canvas. All drawings are our own; nothing is taken from the games.
 *
 * A sprite is a list of rows; each character is a palette key, "." is empty.
 */

export const palette: Record<string, string> = {
  k: "#17131f", // raven black, ink
  g: "#41395a", // feather sheen
  b: "#6d6582", // beak and feet
  w: "#ffffff",
  r: "#d7263d", // red, as in the coat of arms
  R: "#98172a", // dark red
  y: "#ffc93c", // yellow
  e: "#a7a2b3", // light grey
  s: "#2f6fd6", // blue
  l: "#a8d8ff", // window blue
  d: "#7f93b8", // far silhouette
  D: "#6a7ea3", // far silhouette, windows
  h: "#9fb3d1", // far hills
  H: "#86c06c", // near hills
  f: "#2f6b3f", // fir
  F: "#3f8a50", // fir, light
  t: "#6b4a2e", // trunk, earth
  G: "#5aa34a", // grass
  c: "#e3eef7", // cloud shadow
  a: "#5d5d6b", // asphalt
  A: "#4b4b58", // asphalt, dark
  u: "#fff3b0", // sun
  o: "#ffe596", // sun, glow
  m: "#c3d0e5", // far mountains
  M: "#b3c2db", // far mountains, shade
  n: "#f6f9fd", // snow
};

export type Sprite = readonly string[];

/** Mirrors each row onto itself: "abc" becomes "abccba" (or "abcba" if odd). */
function mirror(rows: string[], odd = false): Sprite {
  return rows.map((row) => {
    const back = [...row].reverse().join("");
    return row + (odd ? back.slice(1) : back);
  });
}

/* ---------- Ravens, facing right ---------- */

export const ravenSit: Sprite = [
  ".........kkk....",
  "........kkkkk...",
  "........kwwkkk..",
  "........kwkkkbbb",
  ".......kkkkkkbb.",
  ".....kkkkkkkk...",
  "...kkkgggkkkk...",
  "..kkkgggkkkkk...",
  ".kkkkggkkkkkk...",
  "kkkkkkkkkkkk....",
  "kk..kkkkkkk.....",
  ".....kkkkk......",
  "......b..b......",
  ".....bb.bb......",
];

export const ravenKrah: Sprite = [
  ".........kkk..b.",
  "........kkkkkbb.",
  "........kwwkkk..",
  "........kwkkk...",
  ".......kkkkkkbb.",
  ".....kkkkkkkkbb.",
  "...kkkgggkkkk...",
  "..kkkgggkkkkk...",
  ".kkkkggkkkkkk...",
  "kkkkkkkkkkkk....",
  "kk..kkkkkkk.....",
  ".....kkkkk......",
  "......b..b......",
  ".....bb.bb......",
];

export const ravenPeck: Sprite = [
  "................",
  "................",
  "................",
  "................",
  ".....kkkk.......",
  "...kkkgggkkk....",
  "..kkkgggkkkkkk..",
  ".kkkkggkkkkkkkk.",
  "kkkkkkkkkkkwwkk.",
  "kk..kkkkkkkwkkk.",
  ".....kkkkk..kbb.",
  "......kk.....bb.",
  "......b..b......",
  ".....bb.bb......",
];

export const ravenFlyUp: Sprite = [
  "..k.k.k.............",
  "..kkkkkk............",
  "...kkkkkk...........",
  "....kkkkkk..........",
  ".....kkgkkk.........",
  "......kkgkkk...kkk..",
  "kk.....kkgkkk.kwwkk.",
  "kkk..kkkkkkkkkkwkkbb",
  ".kkkkkkkgggkkkkkkb..",
  "..kkkkkkkkkkkkkk....",
  ".kk....kkkkkkk......",
  ".........b.b........",
  "....................",
  "....................",
];

export const ravenFlyDown: Sprite = [
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "...............kkk..",
  "kk............kwwkk.",
  "kkk..kkkkkkkkkkwkkbb",
  ".kkkkkkkgggkkkkkkb..",
  "..kkkkkkkgkkkkkk....",
  ".kk.....kkgkkkk.....",
  "........kkkgkk......",
  ".......kkkkkk.......",
  "......k.k.k.........",
];

/** The raven seen from above, wings spread, heading up. */
export const ravenTop: Sprite = mirror([
  "..........b",
  "..........k",
  ".........kk",
  "...kkkk..kk",
  "kkkkkkkkkkk",
  ".kkkkkkgkkk",
  "...kkkkkkkk",
  "......kkkkk",
  "........kkk",
  ".......kkkk",
  "......kk.kk",
]);

/**
 * The scarf that tells the second raven apart, drawn over a pose. Same size as
 * the pose it belongs to; only the red pixels count.
 */
export const scarf: Record<string, Sprite> = {
  // A band round the neck, knotted at the back, the ends hanging down the
  // wing: well away from the beak, so it never reads as a red mouth.
  sit: ["", "", "", "", "", ".......rrrrr", ".....RRr", "....RR", "...R"],
  krah: ["", "", "", "", "", ".......rrrrr", ".....RRr", "....RR", "...R"],
  peck: ["", "", "", "", "", "", "..........rr", ".........rrr", "........RRr"],
  flyUp: [
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "............rrr",
    "..........RRrr",
    "........RR",
  ],
  flyDown: [
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "............rrr",
    "..........RRrr",
    "........RR",
  ],
};

/* ---------- Props for the vignettes and modules ---------- */

/** A stunt rider on a motorbike, side view, heading right. */
export const motorbike: Sprite = [
  "..........rrr.......",
  ".........rrrrl......",
  ".........rrrr.......",
  "..........ss........",
  ".........sss........",
  "........sssss.......",
  ".......ss..ss.kk....",
  "......ss....kkk.....",
  "....rrrrrrrrrr......",
  "..kkkk.rRRr..kkkk...",
  ".kk..kk.....kk..kk..",
  ".k.ee.k.....k.ee.k..",
  ".kk..kk.....kk..kk..",
  "..kkkk.......kkkk...",
];

/** The jet flame behind a rear wheel, pointing left; two frames. */
export const flame: Sprite[] = [
  ["..yyy", "yyrrr", "..yyy"],
  [".yyyy", "yrrrr", ".yyyy"],
];

/** A car from above, heading up, with the direction arrow of the sketch. */
export const car: Sprite = [
  "..ssss..",
  ".ssssss.",
  "ksllllsk",
  "ksllllsk",
  ".ssssss.",
  ".sswwss.",
  ".swwwws.",
  ".sswwss.",
  ".sswwss.",
  ".ssssss.",
  "ksllllsk",
  "kssssssk",
  ".ssssss.",
];

/** Recolors a sprite, e.g. { s: "r" } turns a blue car red. */
export function recolor(sprite: Sprite, swap: Record<string, string>): Sprite {
  return sprite.map((row) => [...row].map((c) => swap[c] ?? c).join(""));
}

/* ---------- Backdrop ---------- */

/** A small, original pixel silhouette of a twin-towered monastery front. */
export const monastery: Sprite = mirror(
  [
    "...........d.........",
    "..........ddd........",
    ".........ddddd.......",
    "..........ddd........",
    ".........ddddd.......",
    "........ddddddd......",
    "........ddddddd......",
    "........dDdddDd......",
    "........ddddddd......",
    "........ddddddd......",
    "........dDdddDd......",
    "........dddddddd.....",
    "........dddddddddddd.",
    "ddddddddddddddddddddd",
    "dDDddDDddddddddDDdddd",
    "dDDddDDddDDddddDDdddd",
    "ddddddddddddddddddddd",
    "dDDddDDddDDddddDDdddd",
    "dDDddDDddDDdddddddddd",
    "ddddddddddddddddddddd",
  ],
  true,
);

export const fir: Sprite = [
  "...f...",
  "..fFf..",
  "..fff..",
  ".fFfff.",
  "..fff..",
  ".fffFf.",
  "fffffff",
  ".ffFff.",
  "fffffFf",
  "fffffff",
  "...t...",
  "...t...",
];

export const cloud: Sprite = [
  "......wwww......",
  "....wwwwwwww....",
  "..wwwwwwwwwwwww.",
  ".wwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwww",
  ".cccccccccccccc.",
];

export const cloudSmall: Sprite = [
  "...wwww...",
  ".wwwwwwww.",
  "wwwwwwwwww",
  ".cccccccc.",
];

/** A round, soft sun with a ring of light around it. */
export const sun: Sprite = [
  ".....ooooo.....",
  "...oooooooooo..",
  "..ooouuuuuooo..",
  ".oouuuuuuuuuoo.",
  ".ouuuuuuuuuuuo.",
  "oouuuuuuuuuuuoo",
  "ouuuuuuuuuuuuuo",
  "ouuuuuuuuuuuuuo",
  "ouuuuuuuuuuuuuo",
  "oouuuuuuuuuuuoo",
  ".ouuuuuuuuuuuo.",
  ".oouuuuuuuuuoo.",
  "..ooouuuuuooo..",
  "...oooooooooo..",
  ".....ooooo.....",
];

/* ---------- Composition ---------- */

/** A filled run of pixels. */
export interface Run {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

/** Merges each row of a sprite into runs of equal color, offset by (ox, oy). */
export function spriteRuns(
  sprite: Sprite,
  ox = 0,
  oy = 0,
  flip = false,
): Run[] {
  const runs: Run[] = [];
  const width = Math.max(...sprite.map((row) => row.length));
  sprite.forEach((row, y) => {
    const cells = [...row.padEnd(width, ".")];
    if (flip) cells.reverse();
    let x = 0;
    while (x < cells.length) {
      const key = cells[x];
      let end = x + 1;
      while (end < cells.length && cells[end] === key) end++;
      if (key !== "." && palette[key]) {
        runs.push({
          x: ox + x,
          y: oy + y,
          w: end - x,
          h: 1,
          color: palette[key],
        });
      }
      x = end;
    }
  });
  return runs;
}

export function spriteSize(sprite: Sprite) {
  return {
    w: Math.max(...sprite.map((row) => row.length)),
    h: sprite.length,
  };
}

/** A place where a raven can land: a span of x at height y (its feet). */
export interface Perch {
  x0: number;
  x1: number;
  y: number;
}

export interface Backdrop {
  /** Sky, sun, mountains, hills, ground: drawn once. */
  runs: Run[];
  /** Clouds move on the canvas; their resting position is here. */
  clouds: { x: number; y: number; speed: number; small: boolean }[];
  /** Fixed sprites in front of the hills. */
  props: { sprite: Sprite; x: number; y: number }[];
  perches: Perch[];
  ground: number;
}

const sky = [
  "#5cb3ea",
  "#6bbbed",
  "#7dc4f0",
  "#91cef3",
  "#a6d8f5",
  "#bde3f8",
  "#d3edfa",
];

/** A repeatable pseudo-random number in [0, 1) for position i. */
const noise = (i: number) => {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/**
 * The stage's scenery at width w and height h, in stage pixels. The same
 * function feeds the static SVG and the canvas, so both show the same place.
 */
export function composeBackdrop(w: number, h: number): Backdrop {
  const runs: Run[] = [];
  const ground = h - 12;
  // Sky in bands, with a dithered row between two bands.
  const band = Math.ceil(ground / sky.length);
  sky.forEach((color, i) => {
    runs.push({ x: 0, y: i * band, w, h: band, color });
    if (i > 0) {
      for (let x = i % 2; x < w; x += 2) {
        runs.push({ x, y: i * band, w: 1, h: 1, color: sky[i - 1] });
      }
    }
  });
  runs.push(...spriteRuns(sun, Math.round(w * 0.86) - 7, 8));

  // Far mountains with snow on their tops, in a sawtooth of whole pixels.
  const peaks: { x: number; top: number }[] = [];
  for (let x = -20, i = 0; x < w + 40; i++) {
    peaks.push({ x, top: Math.round(ground - 26 - noise(i) * 16) });
    x += 30 + Math.round(noise(i + 50) * 26);
  }
  for (const p of peaks) {
    const base = ground - 8;
    for (let y = p.top; y < base; y++) {
      const half = y - p.top;
      runs.push({ x: p.x - half, y, w: half, h: 1, color: palette.m });
      runs.push({ x: p.x, y, w: half + 1, h: 1, color: palette.M });
      if (half < 4 + (p.x % 3)) {
        runs.push({
          x: p.x - half,
          y,
          w: half * 2 + 1,
          h: 1,
          color: palette.n,
        });
      }
    }
  }

  // Two hill lines, quantized to whole pixels.
  const hill = (x: number, base: number, amp: number, k: number, p: number) =>
    Math.round(
      base -
        amp * (0.6 + 0.4 * Math.sin(x * k + p)) -
        amp * 0.3 * Math.sin(x * k * 2.7 + p * 2),
    );
  for (let x = 0; x < w; x++) {
    const far = hill(x, ground - 6, 14, 0.035, 1.3);
    runs.push({ x, y: far, w: 1, h: ground - far, color: palette.h });
  }
  const monX = Math.round(w * 0.62) - 20;
  const monY = ground - 4 - monastery.length;
  for (let x = 0; x < w; x++) {
    const near = hill(x, ground, 6, 0.05, 4.1);
    runs.push({ x, y: near, w: 1, h: ground - near, color: palette.H });
  }
  // Ground: grass edge over earth.
  runs.push({ x: 0, y: ground, w, h: 2, color: palette.G });
  runs.push({ x: 0, y: ground + 2, w, h: h - ground - 2, color: palette.H });
  for (let x = 3; x < w; x += 7) {
    runs.push({ x, y: ground + 5 + (x % 3), w: 2, h: 1, color: palette.G });
  }
  // Tufts of grass on the edge.
  for (let x = 5; x < w; x += 11 + (x % 5)) {
    runs.push({ x, y: ground - 1, w: 1, h: 1, color: palette.G });
    runs.push({ x: x + 2, y: ground - 1, w: 1, h: 1, color: palette.G });
  }

  const firSpots = [0.06, 0.15, 0.2, 0.84, 0.9, 0.96]
    .map((f) => Math.round(w * f))
    .filter((x) => Math.abs(x - (monX + 20)) > 32);
  const props = [
    { sprite: monastery, x: monX, y: monY },
    ...firSpots.map((x, i) => ({
      sprite: fir,
      x: x - 3,
      y: ground - fir.length + (i % 2),
    })),
  ];
  // Fill the gap between the monastery and the ground with a little hill.
  runs.push({ x: monX - 4, y: ground - 4, w: 49, h: 4, color: palette.H });

  const perches: Perch[] = [
    // the ground, left and right of the monastery
    { x0: 12, x1: Math.max(12, monX - 12), y: ground },
    { x0: Math.min(monX + 52, w - 12), x1: w - 12, y: ground },
    // the roof between the towers
    { x0: monX + 15, x1: monX + 26, y: monY + 12 },
    // the two tower tips and the firs: room for one raven
    { x0: monX + 10, x1: monX + 10, y: monY + 1 },
    { x0: monX + 30, x1: monX + 30, y: monY + 1 },
    ...firSpots.map((x, i) => ({
      x0: x,
      x1: x,
      y: ground - fir.length + (i % 2),
    })),
  ];

  // One cloud for every 50 pixels or so, high in the sky, at their own pace.
  const sky0 = Math.max(4, ground - 110);
  const clouds = Array.from(
    { length: Math.max(3, Math.round(w / 50)) },
    (_, i) => ({
      x: Math.round(
        (i + noise(i + 7) * 0.6) * (w / Math.max(3, Math.round(w / 50))),
      ),
      y: Math.round(sky0 + noise(i + 19) * Math.max(10, ground - 60 - sky0)),
      speed: 1 + noise(i + 3) * 2.5,
      small: noise(i + 11) < 0.45,
    }),
  );
  return { runs, clouds, props, perches, ground };
}

/**
 * Where the two ravens fly at the start: one above the other, as in the coat of
 * arms. On a wide stage they keep to the right, clear of the title; on a tall
 * one they fly low, between the text and the hills.
 */
export function formation(w: number, h: number) {
  const wide = w / h > 1.3;
  const x = Math.round(w * (wide ? 0.72 : 0.6));
  const y = wide ? Math.round(h * 0.3) : h - 82;
  return [
    { x, y },
    { x, y: y + 18 },
  ];
}

/* ---------- A tiny bitmap font for speech bubbles ---------- */

/** Glyphs five pixels high, enough for what the ravens say. */
export const glyphs: Record<string, string[]> = {
  A: [".k.", "k.k", "kkk", "k.k", "k.k"],
  B: ["kk.", "k.k", "kk.", "k.k", "kk."],
  C: [".kk", "k..", "k..", "k..", ".kk"],
  E: ["kkk", "k..", "kk.", "k..", "kkk"],
  H: ["k.k", "k.k", "kkk", "k.k", "k.k"],
  K: ["k.k", "k.k", "kk.", "k.k", "k.k"],
  L: ["k..", "k..", "k..", "k..", "kkk"],
  N: ["k..k", "kk.k", "k.kk", "k..k", "k..k"],
  O: [".k.", "k.k", "k.k", "k.k", ".k."],
  P: ["kk.", "k.k", "kk.", "k..", "k.."],
  R: ["kk.", "k.k", "kk.", "k.k", "k.k"],
  S: [".kk", "k..", ".k.", "..k", "kk."],
  T: ["kkk", ".k.", ".k.", ".k.", ".k."],
  U: ["k.k", "k.k", "k.k", "k.k", "kkk"],
  W: ["k...k", "k...k", "k.k.k", "k.k.k", ".k.k."],
  Y: ["k.k", "k.k", ".k.", ".k.", ".k."],
  "!": ["k", "k", "k", ".", "k"],
  "?": ["kk.", "..k", ".k.", "...", ".k."],
  " ": ["..", "..", "..", "..", ".."],
};

/** The pixels of a word in the bubble font, as a sprite. */
export function textSprite(text: string): Sprite {
  const rows = ["", "", "", "", ""];
  [...text.toUpperCase()].forEach((char, i) => {
    const glyph = glyphs[char] ?? glyphs["?"];
    rows.forEach((_, y) => (rows[y] += (i ? "." : "") + glyph[y]));
  });
  return rows;
}

/**
 * A pixel speech bubble with the text in the bubble font. Its tail points
 * down at column tail (default: the middle); size() tells its full size.
 */
export function bubbleRuns(text: string, ox = 0, oy = 0, tail?: number): Run[] {
  const words = textSprite(text);
  const { w: tw } = spriteSize(words);
  const w = tw + 6;
  const h = 9;
  const t = Math.min(w - 3, Math.max(2, tail ?? Math.floor(w / 2)));
  const ink = palette.k;
  const white = palette.w;
  return [
    { x: ox + 1, y: oy + 1, w: w - 2, h: h - 2, color: white },
    { x: ox + 1, y: oy, w: w - 2, h: 1, color: ink },
    { x: ox + 1, y: oy + h - 1, w: w - 2, h: 1, color: ink },
    { x: ox, y: oy + 1, w: 1, h: h - 2, color: ink },
    { x: ox + w - 1, y: oy + 1, w: 1, h: h - 2, color: ink },
    { x: ox + t, y: oy + h - 1, w: 1, h: 1, color: white },
    { x: ox + t, y: oy + h, w: 1, h: 1, color: ink },
    { x: ox + t - 1, y: oy + h - 1, w: 1, h: 1, color: ink },
    { x: ox + t + 1, y: oy + h - 1, w: 1, h: 1, color: ink },
    ...spriteRuns(words, ox + 3, oy + 2),
  ];
}

export function bubbleSize(text: string) {
  return { w: spriteSize(textSprite(text)).w + 6, h: 10 };
}

/** A sitting raven with its eyes shut, for blinking. */
export const ravenBlink: Sprite = ravenSit.map((row) => row.replace(/w/g, "k"));

/** Draws one sprite over another into a single sprite, so it flips as one. */
export function layer(base: Sprite, over: Sprite): Sprite {
  return base.map((row, y) =>
    [...row]
      .map((c, x) => {
        const top = over[y]?.[x];
        return top && top !== "." ? top : c;
      })
      .join(""),
  );
}
