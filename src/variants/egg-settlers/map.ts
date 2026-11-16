/**
 * The settlement map behind the Egg Settlers home page, 480 × 300 pixels,
 * loosely after Einsiedeln with north at the top: the Sihlsee on the left with
 * its dam at the north end, the Sihl flowing out of the dam, the Alp coming
 * from the south through the village into the Sihl, the monastery with its
 * square, houses, farms and woods, and in the middle the plaza where the
 * settlers build the giant egg. The lake lies west of the village here, not
 * east as in reality, so the picture keeps its composition. Settlement.astro renders what this
 * module computes at build time; nothing here runs in the browser.
 *
 * Sprites are drawn once and placed with <use>. Two-frame sprites (walking
 * settlers, sails, hens) alternate through CSS; walkers follow the roads with
 * keyframes generated here.
 */
import {
  Pixels,
  bush,
  colors,
  darken,
  egg,
  ellipse,
  grassTile,
  line,
  seeded,
  shell,
  sparkle,
  trails,
  tree,
  type Layer,
} from "./pixel";
import * as S from "./sprites";
import type { Look, Point } from "./sprites";

export const width = 480;
export const height = 300;

/* ---------- Pattern tiles ---------- */

function recolor(p: Pixels, map: (color: string) => string): Pixels {
  const out = new Pixels(p.width, p.height);
  for (let y = 0; y < p.height; y++) {
    for (let x = 0; x < p.width; x++) {
      const color = p.get(x, y);
      if (color) out.set(x, y, map(color));
    }
  }
  return out;
}

function waterTile(seed: number, base: string, light: string): Pixels {
  const rng = seeded(seed);
  const p = new Pixels(32, 24);
  p.rect(0, 0, 32, 24, base);
  for (let i = 0; i < 40; i++) {
    p.set(Math.floor(rng() * 32), Math.floor(rng() * 24), darken(base, 1.08));
  }
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(rng() * 32);
    const y = Math.floor(rng() * 24);
    const len = 2 + Math.floor(rng() * 3);
    for (let k = 0; k < len; k++) p.set((x + k) % 32, y, light);
    p.set((x + 1) % 32, (y + 1) % 24, darken(base, 0.85));
  }
  return p;
}

function sandTile(): Pixels {
  const rng = seeded(41);
  const p = new Pixels(24, 24);
  p.rect(0, 0, 24, 24, "#e3cf98");
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 24; x++) {
      const r = rng();
      if (r < 0.12) p.set(x, y, "#d4bc80");
      else if (r < 0.18) p.set(x, y, "#efe0b4");
      else if (r < 0.19) p.set(x, y, "#b9a06a");
    }
  }
  return p;
}

function cobbleTile(): Pixels {
  const p = new Pixels(8, 8);
  p.rows(
    [
      "LLsmsLsm",
      "Lssmsssm",
      "mmmmmmmm",
      "smLLLsmL",
      "smLsssms",
      "mmmmmmmm",
      "LLLsmLLs",
      "sssmmsss",
    ],
    { L: "#cdc5b1", s: "#b4ab96", m: "#8f8774" },
  );
  return p;
}

export const patterns = [
  { id: "es-grass", tile: grassTile(11) },
  {
    id: "es-grass-deep",
    tile: recolor(grassTile(29, 48, 0), (c) => darken(c, 0.86)),
  },
  { id: "es-water", tile: waterTile(5, "#2f6fa8", "#6fa7d6") },
  { id: "es-shallows", tile: waterTile(8, "#4c94c6", "#a5d0ec") },
  { id: "es-river", tile: waterTile(13, "#3f86bf", "#9fcbe8") },
  { id: "es-sand", tile: sandTile() },
  { id: "es-cobble", tile: cobbleTile() },
].map(({ id, tile }) => ({
  id,
  width: tile.width,
  height: tile.height,
  layers: tile.layers(),
}));

/* ---------- Roads ---------- */

/** The Sihlsee's east shore, per row; the lake lies west of it. */
export const coastX = (y: number) =>
  Math.round(86 + 12 * Math.sin(y / 41 + 1) + y * 0.12 + 3 * Math.sin(y / 9));
const beachWidth = (y: number) => Math.round(14 + 3 * Math.sin(y / 23));
/** The lake's west shore: the lake narrows to the north, toward the dam. */
const westShore = (y: number) => (y < 134 ? Math.round((134 - y) * 1.05) : -99);
/** The first row of the lake, just south of the dam. */
const damY = 72;
const isLake = (x: number, y: number) =>
  y >= damY && x < coastX(y) && x > westShore(y);

/** The rivers' courses, from source to mouth. */
const confluence: Point = [160, 40];
export const rivers = {
  sihl: {
    width: 7,
    route: [
      [86, 66],
      [96, 57],
      [116, 49],
      [140, 44],
      confluence,
      [172, 24],
      [178, -6],
    ],
  },
  alp: {
    width: 5,
    route: [
      [166, 306],
      [160, 272],
      [154, 240],
      [152, 206],
      [150, 176],
      [146, 148],
      [142, 118],
      [146, 90],
      [152, 64],
      confluence,
    ],
  },
} satisfies Record<string, { width: number; route: Point[] }>;

const pierY = 196;
const pierStart = coastX(pierY) + 6;

export const roads = {
  harbour: [
    [pierStart, pierY + 2],
    [150, 192],
    [172, 184],
    [192, 178],
  ],
  north: [
    [278, 158],
    [294, 134],
    [312, 118],
    [342, 110],
  ],
  forest: [
    [196, 160],
    [184, 140],
    [166, 124],
    [146, 112],
    [126, 102],
  ],
  east: [
    [304, 180],
    [340, 186],
    [380, 182],
    [420, 174],
    [480, 170],
  ],
  mill: [
    [384, 182],
    [394, 200],
    [396, 220],
    [408, 238],
  ],
  south: [
    [240, 196],
    [238, 222],
    [234, 252],
    [230, 300],
  ],
  southwest: [
    [238, 226],
    [205, 236],
    [176, 248],
    [148, 262],
    [124, 270],
  ],
  southeast: [
    [238, 230],
    [270, 238],
    [304, 250],
    [332, 262],
  ],
  beach: [
    [coastX(120) + 8, 120],
    [coastX(160) + 7, 160],
    [pierStart, pierY + 2],
  ],
} satisfies Record<string, Point[]>;

/* ---------- The egg's place ---------- */

/** How many rings of shell the egg has. */
export const rings = 6;
const eggW = 66;
const eggH = 86;
const eggBase = 178;
export const eggX = 240 - eggW / 2;
export const eggY = eggBase - eggH;
/** The planned egg, as a faint outline, like a building site's preview. */
const plan = new Pixels(eggW, eggH);
{
  const full = egg(eggW, eggH);
  for (let y = 0; y < eggH; y++) {
    for (let x = 0; x < eggW; x++) {
      const color = full.get(x, y);
      if (color === shell.outline) plan.set(x, y, colors.white);
      else if (color && (x + y) % 4 === 0) plan.set(x, y, "#fffdf4");
    }
  }
}
export const planLayers = plan.layers();
export const courses = Array.from({ length: rings }, (_, index) => ({
  number: index + 1,
  layers: egg(eggW, eggH, rings, index + 1).layers(),
}));

/* ---------- Ground ---------- */

const ground = new Pixels(width, height);

/* Patches of deeper grass, irregular blobs from overlapping ellipses. */
{
  const rng = seeded(77);
  const centers: Point[] = [
    [180, 40],
    [440, 120],
    [300, 30],
    [80 + 250, 280],
    [460, 250],
    [150, 290],
  ];
  for (const [cx, cy] of centers) {
    for (let i = 0; i < 7; i++) {
      ellipse(
        ground,
        cx + (rng() - 0.5) * 60,
        cy + (rng() - 0.5) * 34,
        12 + rng() * 18,
        8 + rng() * 10,
        "url(#es-grass-deep)",
      );
    }
  }
}

/** Water, shores and river banks: where nothing grows and nobody builds. */
const wet = new Pixels(width, height);

/* The lake, its shallows, wet sand and the beaches. */
for (let y = damY - 2; y < height; y++) {
  const coast = coastX(y);
  const beach = beachWidth(y);
  const west = westShore(y);
  for (let x = Math.max(0, west - 7); x < coast + beach; x++) {
    wet.set(x, y, "x");
    let color: string;
    if (x <= west) {
      ground.set(x, y, x === west ? "#cdb27a" : "url(#es-sand)");
      continue;
    }
    if (y < damY) {
      ground.set(x, y, "url(#es-sand)");
      continue;
    }
    if (x < west + 2) {
      ground.set(x, y, S.hash(x, y) < 0.6 ? colors.white : "#cfe6f5");
      continue;
    }
    if (x < coast - 9) color = "url(#es-water)";
    else if (x < coast - 1) color = "url(#es-shallows)";
    else if (x < coast) color = S.hash(x, y) < 0.6 ? colors.white : "#cfe6f5";
    else if (x < coast + 2) color = "#cdb27a";
    else if (y < damY + 1) color = "url(#es-sand)";
    else if (x === coast + beach - 1) {
      color = S.hash(x, y, 2) < 0.5 ? "#c6c27a" : "url(#es-sand)";
    } else color = "url(#es-sand)";
    ground.set(x, y, color);
  }
}

/* The rivers, with muddy banks and a little foam below the dam. */
const riverMask = new Pixels(width, height);
for (const { width: w, route } of Object.values(rivers)) {
  for (let i = 1; i < route.length; i++) {
    const [x0, y0] = route[i - 1] ?? [0, 0];
    const [x1, y1] = route[i] ?? [0, 0];
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let t = 0; t <= steps; t++) {
      const k = t / Math.max(steps, 1);
      const r = w / 2 + 0.6 * Math.sin((y0 + (y1 - y0) * k) / 7);
      ellipse(riverMask, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, r, r, "x");
    }
  }
}
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (!riverMask.has(x, y) || isLake(x, y)) continue;
    const edge =
      !riverMask.has(x - 1, y) ||
      !riverMask.has(x + 1, y) ||
      !riverMask.has(x, y - 1) ||
      !riverMask.has(x, y + 1);
    const near =
      !riverMask.has(x - 2, y) ||
      !riverMask.has(x + 2, y) ||
      !riverMask.has(x, y - 2) ||
      !riverMask.has(x, y + 2);
    ground.set(
      x,
      y,
      edge
        ? S.hash(x, y, 6) < 0.5
          ? "#6f7a3a"
          : "#5a6a2e"
        : near
          ? "url(#es-shallows)"
          : "url(#es-river)",
    );
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) wet.set(x + dx, y + dy, "x");
    }
  }
}
for (let y = 58; y < 66; y++) {
  for (let x = 80; x < 96; x++) {
    if (riverMask.has(x, y) && S.hash(x, y, 8) < 0.55) {
      ground.set(x, y, colors.white);
    }
  }
}

trails(ground, Object.values(roads), 5, 7);

/* Bridges where the roads cross the Alp: plank decks with railings. */
const bridges: Point[] = [];
{
  const alp = rivers.alp.route;
  for (const route of Object.values(roads)) {
    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1];
      const b = route[i];
      for (let j = 1; j < alp.length; j++) {
        const c = alp[j - 1];
        const d = alp[j];
        if (!a || !b || !c || !d) continue;
        const den =
          (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]);
        if (den === 0) continue;
        const t =
          ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den;
        const u =
          ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
          bridges.push([
            Math.round(a[0] + t * (b[0] - a[0])),
            Math.round(a[1] + t * (b[1] - a[1])),
          ]);
        }
      }
    }
  }
  for (const [bx, by] of bridges) {
    const half = 7;
    for (let x = bx - half; x <= bx + half; x++) {
      for (let y = by - 3; y <= by + 3; y++) {
        const end = x === bx - half || x === bx + half;
        ground.set(
          x,
          y,
          end
            ? colors.stone
            : y === by - 3 || y === by + 3
              ? colors.woodDark
              : x % 2
                ? colors.woodLight
                : colors.wood,
        );
      }
      ground.set(x, by + 4, "rgba(16, 36, 8, 0.32)");
    }
  }
}

/* The plaza around the egg, cobbled, with a kerb. */
ellipse(ground, 240, eggBase - 4, 72, 24, colors.trailEdge);
ellipse(ground, 240, eggBase - 4, 70, 22.5, "url(#es-cobble)");
ellipse(ground, 240, eggBase - 3, 44, 11, (x, y) =>
  (x * 3 + y * 5) % 7 === 0
    ? colors.mortar
    : (x + y) % 3 === 0
      ? colors.stoneDark
      : colors.stone,
);
ellipse(ground, 240, eggBase - 4, 37, 8, (x, y) =>
  (x * 7 + y * 3) % 9 === 0 ? colors.dirtDark : colors.dirt,
);

/* The monastery square, cobbled, widening toward the village. */
const monasteryCx = 392;
const monasteryBase = 98;
const squareTop = monasteryBase - 2;
const squareBottom = monasteryBase + 26;
let monasteryFront = monasteryCx;
function monasterySquare(front: number) {
  for (let y = squareTop; y <= squareBottom; y++) {
    const half = 40 + (y - squareTop) * 0.45;
    for (let x = Math.round(front - half); x <= Math.round(front + half); x++) {
      const edge =
        y === squareBottom ||
        x === Math.round(front - half) ||
        x === Math.round(front + half);
      ground.set(x, y, edge ? colors.trailEdge : "url(#es-cobble)");
    }
  }
}

/* The pier. */
for (let x = pierStart - 44; x < pierStart; x++) {
  for (let y = pierY; y < pierY + 6; y++) {
    ground.set(
      x,
      y,
      y === pierY
        ? colors.woodLight
        : y === pierY + 5
          ? colors.woodDark
          : x % 4 === 0
            ? colors.woodDark
            : colors.wood,
    );
  }
  if (x % 8 === 0) {
    ground.set(x, pierY + 6, "#3e2814");
    ground.set(x, pierY + 7, "#2a5a86");
  }
}

/* Fields. */
const fields: [
  number,
  number,
  number,
  number,
  Parameters<typeof S.crops>[2],
][] = [
  [336, 192, 52, 22, "wheat"],
  [402, 190, 78, 18, "cabbage"],
  [356, 270, 50, 30, "ploughed"],
  [420, 270, 60, 30, "wheat"],
  [262, 270, 46, 30, "sunflower"],
];
for (const [x, y, w, h, kind] of fields)
  ground.stamp(S.crops(w, h, kind), x, y);

/* ---------- Sprites, drawn once ---------- */

const sprites = new Map<string, Pixels>();
const define = (id: string, pixels: Pixels) => {
  sprites.set(id, pixels);
  return id;
};

/** Two-frame sprites alternate in CSS: [frame A, frame B]. */
type Frames = [string, string];
const define2 = (id: string, a: Pixels, b: Pixels): Frames => [
  define(`${id}-a`, a),
  define(`${id}-b`, b),
];

/* ---------- Placement ---------- */

export interface Thing {
  /** One sprite, or two frames that alternate. */
  sprite: string | Frames;
  x: number;
  y: number;
  /** Sort key: the y of the sprite's foot. */
  base: number;
  className?: string;
  style?: string;
  /** For trees: where the trunk stands, so a new house can clear it. */
  foot?: Point;
}

const things: Thing[] = [];
const occupied: [number, number, number, number][] = [];

/** Places a sprite by the middle of its foot. */
function place(
  sprite: string | Frames,
  cx: number,
  base: number,
  options: { className?: string; style?: string; solid?: boolean } = {},
): Thing {
  const pixels = sprites.get(typeof sprite === "string" ? sprite : sprite[0]);
  const w = pixels?.width ?? 0;
  const h = pixels?.height ?? 0;
  const thing: Thing = {
    sprite,
    x: Math.round(cx - w / 2),
    y: Math.round(base - h),
    base,
    className: options.className,
    style: options.style,
  };
  things.push(thing);
  if (options.solid !== false) {
    occupied.push([thing.x - 2, thing.y + h * 0.3, thing.x + w + 2, base + 3]);
  }
  return thing;
}

/* ---------- Buildings ---------- */

const chimneys: Point[] = [];

function building(id: string, house: S.House, cx: number, base: number) {
  define(id, house.pixels);
  const thing = place(id, cx, base);
  if (house.chimney) {
    chimneys.push([thing.x + house.chimney[0], thing.y + house.chimney[1]]);
  }
}

{
  const abbey = S.monastery();
  define("monastery", abbey.pixels);
  const thing = place("monastery", monasteryCx, monasteryBase);
  monasteryFront = thing.x + abbey.front;
  monasterySquare(monasteryFront);
  define("arcade", S.arcade(18));
  place("arcade", monasteryFront - 50, squareBottom - 4);
  place("arcade", monasteryFront + 50, squareBottom - 4);
  define("fountain", S.fountain());
  place("fountain", monasteryFront, squareBottom - 6);
  occupied.push([
    monasteryFront - 54,
    squareTop,
    monasteryFront + 54,
    squareBottom + 2,
  ]);
}

{
  const w = coastX(damY) - westShore(damY) + 12;
  define("dam", S.dam(w));
  place("dam", Math.round((coastX(damY) + westShore(damY)) / 2) + 2, damY + 3);
}

building(
  "woodcutter",
  S.house({
    w: 18,
    d: 8,
    h: 8,
    roof: "thatch",
    wall: "planks",
    door: 10,
    windows: [3],
  }),
  122,
  96,
);

building(
  "warehouse",
  S.house({
    w: 26,
    d: 12,
    h: 11,
    roofH: 7,
    roof: "tile",
    wall: "stone",
    gate: { u: 9, w: 8 },
  }),
  124,
  180,
);

building(
  "house-north",
  S.house({
    w: 22,
    d: 10,
    h: 10,
    roof: "tile",
    wall: "timber",
    door: 9,
    windows: [3, 15],
    chimney: 5,
  }),
  404,
  166,
);

building(
  "house-west",
  S.house({
    w: 20,
    d: 10,
    h: 9,
    roof: "tile",
    wall: "plaster",
    door: 8,
    windows: [2, 14],
    shutters: "#3f6e2a",
    chimney: 14,
  }),
  176,
  108,
);

building(
  "bakery",
  S.house({
    w: 22,
    d: 10,
    h: 10,
    roof: "tile",
    wall: "brick",
    door: 4,
    windows: [11, 16],
    chimney: 16,
  }),
  322,
  222,
);

building(
  "house-southwest",
  S.house({
    w: 20,
    d: 10,
    h: 9,
    roof: "slate",
    wall: "plaster",
    door: 3,
    windows: [9, 14],
    shutters: "#2f6690",
    chimney: 4,
  }),
  194,
  222,
);

building(
  "house-south",
  S.house({
    w: 18,
    d: 9,
    h: 9,
    roof: "thatch",
    wall: "timber",
    door: 7,
    windows: [2, 12],
  }),
  204,
  276,
);

building(
  "inn",
  S.house({
    w: 28,
    d: 12,
    h: 12,
    roofH: 7,
    roof: "tile",
    wall: "timber",
    door: 12,
    windows: [3, 7, 19, 23],
    chimney: 22,
  }),
  352,
  166,
);

building(
  "farmhouse",
  S.house({
    w: 22,
    d: 10,
    h: 9,
    roof: "tile",
    wall: "plaster",
    door: 9,
    windows: [3, 15],
    shutters: "#a63d2a",
    chimney: 4,
  }),
  454,
  168,
);

building(
  "barn",
  S.house({
    w: 26,
    d: 12,
    h: 11,
    roofH: 8,
    roof: "thatch",
    wall: "planks",
    gate: { u: 9, w: 8, color: "#a63d2a" },
  }),
  452,
  262,
);

building(
  "coop",
  S.house({
    w: 12,
    d: 6,
    h: 6,
    roofH: 4,
    roof: "thatch",
    wall: "planks",
    door: 5,
  }),
  356,
  250,
);

const mill = S.windmill();
define("windmill", mill.pixels);
const millThing = place("windmill", 410, 250);
const millHub: Point = [millThing.x + mill.hub[0], millThing.y + mill.hub[1]];

/* ---------- Small things ---------- */

define("logs", S.logs());
define("shells", S.shellPile());
define("stones", S.stones());
define("well", S.well());
define("stall-red", S.stall());
define("stall-blue", S.stall("#2f6690"));
define("fence", S.fence(32));
define("fence-v", S.fence(18, true));
define("boat", S.rowboat());
for (let i = 0; i < 4; i++) define(`rock-${i}`, S.rock(i + 3, 3 + (i % 3)));

place("logs", 126, 74);
place("shells", pierStart + 10, 212);
place("shells", 286, 208);
place("stones", 178, 196);
place("shells", 292, 198);
place("well", 258, 214);
place("stall-red", 280, 204);
place("stall-blue", 196, 202);
place("rock-0", 470, 64);
place("rock-1", 30, 30);
place("rock-2", 226, 64);
place("rock-3", 330, 290);
place("fence", 352, 266, { solid: false });
place("fence-v", 336, 264, { solid: false });
place("fence", 352, 236, { solid: false });

/* ---------- Ships, gulls, smoke ---------- */

define("ship", S.ship());
define("ship-blue", S.ship("#e9dfc8", "#2f6690"));

export const ships: Thing[] = [
  {
    sprite: "ship",
    x: 34,
    y: 112,
    base: 150,
    className: "ship",
    style: "--drift: 26px; --drift-time: 23s",
  },
  {
    sprite: "ship-blue",
    x: 6,
    y: 232,
    base: 270,
    className: "ship",
    style: "--drift: -18px; --drift-time: 31s; animation-delay: -9s",
  },
  {
    sprite: "boat",
    x: pierStart - 30,
    y: pierY + 7,
    base: pierY + 14,
    className: "boat",
  },
];

const gullFrames = define2("gull", S.gull(0), S.gull(1));
export const gulls: Thing[] = [
  {
    sprite: gullFrames,
    x: -20,
    y: 60,
    base: 0,
    className: "gull",
    style: "--fly-x: 520px; --fly-y: 40px; --fly-time: 26s",
  },
  {
    sprite: gullFrames,
    x: -20,
    y: 150,
    base: 0,
    className: "gull",
    style:
      "--fly-x: 300px; --fly-y: -110px; --fly-time: 34s; animation-delay: -12s",
  },
];

define("smoke", S.smoke());
export const smokes: Thing[] = chimneys.map(([x, y], i) => ({
  sprite: "smoke",
  x: x - 1,
  y: y - 9,
  base: 0,
  className: "smoke",
  style: `animation-delay: ${-i * 0.7}s`,
}));

const sailFrames = define2("sails", S.sails(0), S.sails(1));
export const sails: Thing = {
  sprite: sailFrames,
  x: millHub[0] - 16,
  y: millHub[1] - 16,
  base: 0,
  className: "sails",
};

/* Sparkles on the water, in two alternating sets. */
const glints = [new Pixels(width, height), new Pixels(width, height)] as const;
{
  const rng = seeded(91);
  for (let i = 0; i < 70; i++) {
    const y = damY + 4 + Math.floor(rng() * (height - damY - 4));
    const x0 = Math.max(0, westShore(y) + 3);
    const x = x0 + Math.floor(rng() * (coastX(y) - 4 - x0));
    const set = glints[i % 2];
    set.set(x, y, colors.white);
    set.set(x + 1, y, "#cfe6f5");
  }
}
export const glintLayers = glints.map((g) => g.layers());

/* Cloud shadows drifting over the land. */
const cloud = (seed: number) => {
  const rng = seeded(seed);
  const p = new Pixels(110, 54);
  for (let i = 0; i < 6; i++) {
    ellipse(
      p,
      30 + rng() * 50,
      20 + rng() * 14,
      16 + rng() * 14,
      9 + rng() * 6,
      "rgba(18, 38, 30, 0.16)",
    );
  }
  return p;
};
export const clouds = [
  { layers: cloud(3).layers(), y: 40, style: "--cloud-time: 95s" },
  {
    layers: cloud(8).layers(),
    y: 190,
    style: "--cloud-time: 120s; animation-delay: -60s",
  },
];

/* ---------- Trees and woods ---------- */

const treeIds = {
  conifer: [
    define("fir-1", S.conifer(1, 6)),
    define("fir-2", S.conifer(2, 7)),
    define("fir-3", S.conifer(3, 5)),
    define("fir-4", S.conifer(4, 8)),
  ],
  leafy: [
    define("tree-1", tree(1, 7)),
    define("tree-2", tree(2, 8)),
    define("tree-3", tree(3, 6)),
  ],
  blossom: [
    define("blossom-1", S.blossom(4, 6)),
    define("blossom-2", S.blossom(9, 7)),
  ],
  bush: [define("bush", bush(9, 4)), define("bush-2", bush(13, 3))],
};

const distToSegment = (p: Point, a: Point, b: Point) => {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const len = (bx - ax) ** 2 + (by - ay) ** 2;
  const t = len
    ? Math.max(
        0,
        Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / len),
      )
    : 0;
  return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
};

const nearRoad = (p: Point, clearance: number) =>
  Object.values(roads).some((route) =>
    route.some((a, i) => {
      const b = route[i + 1];
      return b !== undefined && distToSegment(p, a, b) < clearance;
    }),
  );

const planted: Point[] = [];
const free = ([x, y]: Point, gap: number) =>
  !wet.has(x, y) &&
  !wet.has(x - 5, y) &&
  !wet.has(x + 5, y) &&
  !wet.has(x, y - 4) &&
  !wet.has(x, y - 10) &&
  !wet.has(x, y - 16) &&
  !nearRoad([x, y], 8) &&
  !occupied.some(([x0, y0, x1, y1]) => x > x0 && x < x1 && y > y0 && y < y1) &&
  !fields.some(
    ([fx, fy, fw, fh]) =>
      x > fx - 4 && x < fx + fw + 4 && y > fy - 2 && y < fy + fh + 12,
  ) &&
  ((x - 240) / 82) ** 2 + ((y - eggBase) / 30) ** 2 > 1 &&
  !(
    x > eggX - 24 &&
    x < eggX + eggW + 40 &&
    y > eggY - 20 &&
    y < eggBase + 8
  ) &&
  planted.every(([px, py]) => Math.hypot(px - x, (py - y) * 1.3) > gap);

/** Plants trees in a region, at random but the same in every build. */
function wood(
  seed: number,
  region: [number, number, number, number],
  count: number,
  kinds: string[],
  gap = 9,
) {
  const rng = seeded(seed);
  const [x0, y0, x1, y1] = region;
  for (let i = 0, tries = 0; i < count && tries < count * 30; tries++) {
    const pt: Point = [
      Math.round(x0 + rng() * (x1 - x0)),
      Math.round(y0 + rng() * (y1 - y0)),
    ];
    if (!free(pt, gap)) continue;
    planted.push(pt);
    const thing = place(
      kinds[Math.floor(rng() * kinds.length)] ?? "bush",
      pt[0],
      pt[1],
      { solid: false },
    );
    thing.foot = pt;
    i++;
  }
}

const { conifer, leafy, blossom: blossoms, bush: bushes } = treeIds;
wood(1, [110, 0, 300, 82], 46, conifer, 9);
wood(2, [290, -6, 480, 28], 18, [...conifer, ...leafy], 10);
wood(3, [456, 30, 480, 140], 6, [...conifer, ...leafy], 10);
wood(8, [0, -4, 80, 116], 22, [...conifer, ...leafy], 9);
wood(9, [40, -4, 170, 56], 16, conifer, 9);
wood(4, [100, 230, 200, 300], 12, [...conifer, ...leafy, ...bushes], 9);
wood(5, [160, 120, 330, 300], 10, [...blossoms, ...bushes], 14);
wood(6, [320, 100, 480, 300], 12, [...leafy, ...blossoms, ...bushes], 12);
wood(7, [90, 0, 480, 300], 18, [...bushes, ...leafy], 12);

/* ---------- Settlers ---------- */

const looks = {
  shellMan: { clothes: "#a63d2a", hair: "#5a3a1c", carry: "shell" },
  shellWoman: {
    woman: true,
    clothes: "#2f6690",
    hair: "#c98f3f",
    apron: true,
    carry: "shell",
  },
  shellWoman2: {
    woman: true,
    clothes: "#3f6e2a",
    hair: "#2b1d12",
    head: "scarf",
    headColor: "#f4ecd6",
    carry: "shell",
  },
  logMan: {
    clothes: "#3f6e2a",
    hair: "#2b1d12",
    head: "cap",
    headColor: "#7a4b24",
    carry: "log",
  },
  logWoman: {
    woman: true,
    clothes: "#8a5a2b",
    hair: "#a8452a",
    carry: "log",
  },
  basketWoman: {
    woman: true,
    clothes: "#7d4f8c",
    hair: "#3b2a1c",
    head: "scarf",
    headColor: "#d24a32",
    apron: true,
    carry: "basket",
  },
  sackMan: {
    clothes: "#c47f17",
    hair: "#8a8580",
    head: "bare",
    carry: "sack",
    skin: "#d9a273",
  },
  stoneWoman: {
    woman: true,
    clothes: "#a63d2a",
    hair: "#e0c070",
    head: "scarf",
    headColor: "#2f6690",
    carry: "sack",
    skin: "#c58b5c",
  },
  plankMan: {
    clothes: "#2f6690",
    hair: "#5a3a1c",
    head: "bare",
    carry: "plank",
    skin: "#8d5a3b",
  },
  walkerWoman: {
    woman: true,
    clothes: "#d24a32",
    hair: "#5a3a1c",
    apron: true,
  },
  walkerMan: {
    clothes: "#7d4f8c",
    hair: "#2b1d12",
    head: "cap",
    headColor: "#3f6e2a",
  },
  elder: {
    woman: true,
    clothes: "#45423c",
    hair: "#d8d2c0",
    head: "scarf",
    headColor: "#f4ecd6",
  },
  builderMan: { clothes: "#7a4b24", hair: "#2b1d12", tool: "hammer" },
  builderWoman: {
    woman: true,
    clothes: "#3f6e2a",
    hair: "#a8452a",
    head: "scarf",
    headColor: "#c47f17",
    tool: "hammer",
  },
  builderMan2: {
    clothes: "#2f6690",
    hair: "#2b1d12",
    head: "cap",
    headColor: "#a63d2a",
    tool: "hammer",
    skin: "#8d5a3b",
  },
  axeWoman: {
    woman: true,
    clothes: "#a63d2a",
    hair: "#2b1d12",
    tool: "axe",
    skin: "#c58b5c",
  },
  axeMan: {
    clothes: "#3f6e2a",
    hair: "#c98f3f",
    head: "cap",
    headColor: "#5a3818",
    tool: "axe",
  },
  farmerWoman: {
    woman: true,
    clothes: "#c47f17",
    hair: "#5a3a1c",
    head: "straw",
    apron: true,
    tool: "hoe",
  },
  farmerMan: { clothes: "#8a5a2b", hair: "#2b1d12", tool: "hoe" },
  fisherMan: {
    clothes: "#2f6690",
    hair: "#8a8580",
    head: "cap",
    headColor: "#45423c",
    tool: "rod",
  },
  henWoman: { woman: true, clothes: "#2f6690", hair: "#e0c070", apron: true },
  merchantWoman: {
    woman: true,
    clothes: "#7d4f8c",
    hair: "#2b1d12",
    apron: true,
    skin: "#8d5a3b",
  },
  merchantMan: { clothes: "#c47f17", hair: "#a8452a", head: "bare" },
  wheelMan: { clothes: "#a63d2a", hair: "#2b1d12", head: "bare" },
} satisfies Record<string, Look>;
type LookName = keyof typeof looks;

const lookFrames = new Map<string, Frames>();
/** The two frames of a look in a pose, defined once. */
function frames(name: LookName, pose: S.Pose): Frames {
  const key = `${name}-${pose}`;
  const known = lookFrames.get(key);
  if (known) return known;
  const look: Look = looks[name];
  const made = define2(
    `p-${key}`,
    S.person(look, pose, 0),
    S.person(look, pose, 1),
  );
  lookFrames.set(key, made);
  return made;
}

/** Settlers at work in one place: they cheer when the egg is finished. */
export interface Worker {
  work: Frames;
  cheer: Frames;
  x: number;
  y: number;
  speed: string;
}
const worker = (
  name: LookName,
  cx: number,
  base: number,
  speed = "0.7s",
  pose: S.Pose = "work",
): Worker => ({
  work: frames(name, pose),
  cheer: frames(name, "cheer"),
  x: cx - 4,
  y: base - 15,
  speed,
});

export const workers: Worker[] = [
  worker("axeWoman", 176, 62, "0.8s"),
  worker("axeMan", 132, 70, "0.9s"),
  worker("farmerWoman", 366, 210, "1.1s"),
  worker("farmerMan", 440, 206, "1.3s"),
  worker("farmerWoman", 380, 290, "1.2s"),
  worker("fisherMan", pierStart - 40, pierY + 2, "1.6s"),
  worker("henWoman", 372, 260),
  worker("merchantWoman", 280, 196),
  worker("merchantMan", 196, 196),
  worker("elder", monasteryFront - 14, squareBottom - 2),
];

/** Settlers on the scaffold: they disappear with it when the egg is done. */
export const builders: Worker[] = [
  worker("builderMan", 201, 116, "0.55s"),
  worker("builderWoman", 279, 140, "0.6s"),
  worker("builderMan2", 230, 92, "0.5s"),
  worker("builderWoman", 255, 164, "0.65s"),
];

/** The settler in the crane's treadwheel walks on the spot. */
export const wheelWalker: Worker = worker(
  "wheelMan",
  297,
  172,
  "0.35s",
  "walk",
);

/* Hens and sheep. */
const henFrames = define2("hen", S.hen(0), S.hen(1));
const brownHenFrames = define2("hen-brown", S.hen(0, true), S.hen(1, true));
const sheepFrames = define2("sheep", S.sheep(0), S.sheep(1));
export const animals: Thing[] = [
  [henFrames, 364, 246, "1.1s"],
  [brownHenFrames, 378, 244, "0.9s"],
  [henFrames, 386, 252, "1.4s"],
  [brownHenFrames, 362, 258, "1.2s"],
  [henFrames, 346, 262, "0.8s"],
  [henFrames, 260, 222, "1.3s"],
  [sheepFrames, 440, 222, "3s"],
  [sheepFrames, 460, 232, "2.4s"],
  [sheepFrames, 428, 234, "3.6s"],
].map(([sprite, x, y, speed]) => ({
  sprite: sprite as Frames,
  x: x as number,
  y: y as number,
  base: 0,
  style: `--frame: ${speed as string}`,
}));

/** Walkers carry goods along the roads and back, at an easy pace. */
export interface Walker {
  frames: Frames;
  x: number;
  y: number;
  name: string;
  duration: number;
  delay: number;
}

const walkerRoutes: [LookName, Point[], number][] = [
  ["shellMan", roads.harbour, 0],
  ["shellWoman", roads.harbour, -9],
  ["shellWoman2", [...roads.beach].reverse(), -4],
  ["logMan", [...roads.forest].reverse(), -2],
  ["logWoman", [...roads.forest].reverse(), -11],
  ["basketWoman", [...roads.southeast].reverse().concat([[240, 198]]), -3],
  [
    "sackMan",
    [...roads.mill].reverse().concat(roads.east.slice(0, 2).reverse()),
    -6,
  ],
  ["stoneWoman", [...roads.north].reverse(), -14],
  ["plankMan", [...roads.south].reverse(), -5],
  ["walkerWoman", [...roads.southwest].reverse(), -8],
  ["walkerMan", roads.east.slice(2).reverse(), -1],
  ["elder", roads.north, -7],
];

/** Map pixels per second. */
const pace = 7;
/** Percent of the cycle a walker rests at each end of the route. */
const rest = 6;
const keyframes: string[] = [];

export const walkers: Walker[] = walkerRoutes.map(([look, route, delay], i) => {
  const [x0, y0] = route[0] ?? [0, 0];
  const lengths = route.map((pt, j) => {
    const prev = route[j - 1];
    return prev ? Math.hypot(pt[0] - prev[0], pt[1] - prev[1]) : 0;
  });
  const total = lengths.reduce((a, b) => a + b, 0);
  const name = `es-walk-${i}`;
  let run = 0;
  const stops = route.map(([x, y], j) => {
    run += lengths[j] ?? 0;
    const pct = rest + (run / total) * (100 - rest * 2);
    return `${pct.toFixed(1)}%{transform:translate(${x - x0}px,${y - y0}px)}`;
  });
  const [lx, ly] = route[route.length - 1] ?? [x0, y0];
  keyframes.push(
    `@keyframes ${name}{0%{transform:none}${stops.join("")}100%{transform:translate(${lx - x0}px,${ly - y0}px)}}`,
  );
  return {
    frames: frames(look, "walk"),
    x: x0 - 4,
    y: y0 - 13,
    name,
    duration: Math.round((total / pace) * 10) / 10,
    delay,
  };
});

/** The walkers' keyframes, for an inline style element in the map. */
export const walkCss = keyframes.join("");

/* ---------- The construction site ---------- */

/** The wooden frame around the egg, with a ladder on the left. */
const frame = new Pixels(width, height);
{
  const left = eggX - 10;
  const right = eggX + eggW + 2;
  for (const x of [left, left + 9, right, right + 9]) {
    line(frame, x, eggBase + 2, x, eggY + 2, colors.woodDark);
    line(frame, x + 1, eggBase + 2, x + 1, eggY + 2, colors.wood);
  }
  for (const y of [eggY + 14, eggY + 38, eggY + 62]) {
    line(frame, left - 2, y, right + 11, y, colors.wood);
    frame.rect(left - 2, y + 1, 13, 1, colors.woodLight);
    frame.rect(right - 1, y + 1, 13, 1, colors.woodLight);
    frame.rect(left - 2, y + 2, 13, 1, colors.woodDark);
    frame.rect(right - 1, y + 2, 13, 1, colors.woodDark);
  }
  line(frame, left, eggY + 62, left + 9, eggY + 38, colors.wood);
  line(frame, left, eggY + 38, left + 9, eggY + 14, colors.wood);
  line(frame, right, eggY + 38, right + 9, eggY + 62, colors.wood);
  line(frame, right, eggY + 14, right + 9, eggY + 38, colors.wood);
  for (const x of [left - 9, left - 5]) {
    line(frame, x, eggBase + 2, x, eggY + 38, colors.woodDark);
  }
  for (let y = eggY + 42; y < eggBase; y += 4) {
    line(frame, left - 8, y, left - 6, y, colors.woodLight);
  }
}
export const scaffoldLayers = frame.layers();

const craneJib = 44;
const craneHeight = 108;
define("crane", S.crane(craneJib, craneHeight));
const cranePost = eggX + eggW + 28;
export const crane: Thing = {
  sprite: "crane",
  x: cranePost - (craneJib + 4),
  y: eggBase - craneHeight - 2,
  base: eggBase,
};
define("crane-load", S.craneLoad(14));
export const craneLoad: Thing = {
  sprite: "crane-load",
  x: crane.x - 3,
  y: crane.y + 6,
  base: 0,
  className: "crane-load",
};

/** The celebration when the egg is finished: a flag on top and sparkles. */
const party = new Pixels(width, height);
{
  const top = eggY;
  line(party, 240, top, 240, top - 16, colors.ink);
  party.rows(
    ["YYYYYYY", "YRRRRYY", "YYYY...", "YY....."],
    { Y: colors.yolk, R: "#a63d2a" },
    241,
    top - 16,
  );
  const rng = seeded(5);
  for (let i = 0; i < 16; i++) {
    sparkle(
      party,
      Math.round(200 + rng() * 80),
      Math.round(top - 10 + rng() * 70),
      i % 3 ? colors.yolk : "#f0a3c4",
    );
  }
}
export const partyLayers = party.layers();

/* Bunting across the plaza for the celebration. */
const bunting = new Pixels(width, height);
{
  const flags = ["#a63d2a", colors.yolk, "#2f6690", "#3f6e2a", "#f0a3c4"];
  const runs: [Point, Point][] = [
    [
      [168, 152],
      [212, 140],
    ],
    [
      [268, 140],
      [304, 150],
    ],
  ];
  runs.forEach(([[ax, ay], [bx, by]]) => {
    const steps = Math.round(Math.hypot(bx - ax, by - ay));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const sag = Math.sin(t * Math.PI) * 6;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t + sag;
      bunting.set(x, y, colors.ink);
      if (s % 5 === 2) {
        const c = flags[Math.floor(s / 5) % flags.length] ?? colors.yolk;
        bunting.set(x, y + 1, c);
        bunting.set(x + 1, y + 1, c);
        bunting.set(x, y + 2, c);
      }
    }
  });
}
export const buntingLayers = bunting.layers();

/* ---------- Water names ---------- */

/** Map labels for the lake and the rivers, set as SVG text, not drawn. */
export const labels = [
  { text: "Sihlsee", x: 24, y: 178, size: 10, rotate: 0 },
  { text: "Sihl", x: 104, y: 44, size: 6, rotate: -14 },
  { text: "Alp", x: 157, y: 160, size: 6, rotate: -80 },
];

/* ---------- Houses that visitors have the settlers build ---------- */

const newHouseOptions: S.HouseOptions[] = [
  {
    w: 16,
    d: 8,
    h: 8,
    roof: "tile",
    wall: "timber",
    door: 6,
    windows: [2, 11],
    chimney: 3,
  },
  { w: 14, d: 8, h: 7, roof: "thatch", wall: "planks", door: 8, windows: [2] },
  {
    w: 18,
    d: 8,
    h: 8,
    roof: "slate",
    wall: "plaster",
    door: 3,
    windows: [8, 13],
    shutters: "#2f6690",
  },
  {
    w: 16,
    d: 8,
    h: 8,
    roof: "tile",
    wall: "brick",
    door: 10,
    windows: [3],
    chimney: 12,
  },
  {
    w: 15,
    d: 8,
    h: 8,
    roof: "thatch",
    wall: "timber",
    door: 6,
    windows: [1, 11],
  },
  {
    w: 17,
    d: 8,
    h: 8,
    roof: "tile",
    wall: "plaster",
    door: 7,
    windows: [2, 12],
    shutters: "#a63d2a",
    chimney: 13,
  },
];
export const newHouses = newHouseOptions.map((options, i) => {
  const { pixels } = S.house(options);
  return {
    id: `es-${define(`new-house-${i}`, pixels)}`,
    w: pixels.width,
    h: pixels.height,
  };
});
const sitePixels = S.buildingSite(18);
export const houseSite = {
  id: `es-${define("house-site", sitePixels)}`,
  w: sitePixels.width,
  h: sitePixels.height,
};
/** The settlers who go and build: their walking and working frames. */
export const crew = (
  ["builderMan", "builderWoman", "builderMan2"] as const
).map((name) => ({
  walk: frames(name, "walk").map((id) => `es-${id}`),
  work: frames(name, "work").map((id) => `es-${id}`),
}));
/** Where the crew sets out from: the egg's plaza. */
export const crewStart: Point = [240, eggBase + 18];

/**
 * Where a house may stand, in cells of 4 × 4 pixels: "1" for meadow or
 * woods, "0" for water, roads, buildings, fields and the egg's plaza. The
 * crew fells the trees on a new house's plot.
 */
const buildable = ([x, y]: Point) =>
  !wet.has(x, y) &&
  !nearRoad([x, y], 6) &&
  !occupied.some(([x0, y0, x1, y1]) => x > x0 && x < x1 && y > y0 && y < y1) &&
  !fields.some(
    ([fx, fy, fw, fh]) =>
      x > fx - 2 && x < fx + fw + 2 && y > fy - 2 && y < fy + fh + 4,
  ) &&
  ((x - 240) / 80) ** 2 + ((y - eggBase) / 28) ** 2 > 1 &&
  !(x > eggX - 22 && x < eggX + eggW + 38 && y > eggY - 22 && y < eggBase + 6);
const cell = 4;
const cols = width / cell;
const gridRows = Math.ceil(height / cell);
let cells = "";
for (let r = 0; r < gridRows; r++) {
  for (let c = 0; c < cols; c++) {
    cells += buildable([c * cell + 2, r * cell + 2]) ? "1" : "0";
  }
}
export const buildGrid = { cell, cols, rows: gridRows, cells };

/* ---------- Everything sorted for drawing ---------- */

export const groundLayers: Layer[] = ground.layers();

export const defs = [...sprites].map(([id, pixels]) => ({
  id: `es-${id}`,
  layers: pixels.layers(),
}));

const byBase = (a: Thing, b: Thing) => a.base - b.base;
/** Scenery behind the egg's foot, and in front of it. */
export const behind = things.filter((t) => t.base <= eggBase).sort(byBase);
export const before = things.filter((t) => t.base > eggBase).sort(byBase);
