/**
 * The settlement's detailed sprites, built on pixel.ts: houses in an oblique
 * view with front wall, side wall, gable and roof; towers, the windmill, the
 * crane, ships; settlers, men and women, in two frames; animals and the things
 * lying about. Everything is lit from the upper left and casts its shadow to
 * the lower right, at the map's pixel scale.
 */
import {
  Pixels,
  colors,
  darken,
  ellipse,
  line,
  outline,
  seeded,
  shell,
} from "./pixel";

export type Point = readonly [number, number];

/** Copies the sprite over its own shadow, cast dx and dy to the lower right. */
export function withShadow(sprite: Pixels, dx = 3, dy = 2): Pixels {
  const out = new Pixels(sprite.width + dx, sprite.height + dy);
  for (let y = 0; y < sprite.height; y++) {
    for (let x = 0; x < sprite.width; x++) {
      const color = sprite.get(x, y);
      if (!color || color === colors.shadow) continue;
      for (let s = 1; s <= dx; s++) {
        out.set(x + s, y + Math.round((s * dy) / dx), colors.shadow);
      }
    }
  }
  for (let y = 0; y < sprite.height; y++) {
    for (let x = 0; x < sprite.width; x++) {
      const color = sprite.get(x, y);
      if (color) out.set(x, y, color);
    }
  }
  return out;
}

/** A small deterministic hash for textures that must not repeat visibly. */
export function hash(x: number, y: number, seed = 0): number {
  let h = Math.imul(x + 374761393 * seed, 668265263) ^ Math.imul(y, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/* ---------- Houses ---------- */

export type Wall = "plaster" | "timber" | "planks" | "stone" | "brick";
export type Roof = "tile" | "thatch" | "slate" | "battlement";

const wallPalettes: Record<Wall, { base: string; alt: string; line: string }> =
  {
    plaster: { base: "#efe3c4", alt: "#e2d3ae", line: "#cbb78d" },
    timber: { base: "#f1e6c9", alt: "#e4d6b2", line: "#5e3b1d" },
    planks: { base: "#a06a37", alt: "#b9834a", line: "#6e4724" },
    stone: { base: "#b8b2a3", alt: "#c9c3b4", line: "#7a766e" },
    brick: { base: "#b5523b", alt: "#c96a48", line: "#7e3626" },
  };

const roofPalettes: Record<
  Exclude<Roof, "battlement">,
  { base: string; row: string; joint: string; light: string; edge: string }
> = {
  tile: {
    base: "#e0873a",
    row: "#b8601f",
    joint: "#c9702a",
    light: "#f4ab58",
    edge: "#6e3410",
  },
  thatch: {
    base: colors.thatch,
    row: colors.thatchDark,
    joint: colors.thatchDark,
    light: colors.thatchLight,
    edge: colors.thatchOutline,
  },
  slate: {
    base: "#6b7785",
    row: "#4f5a67",
    joint: "#5a6573",
    light: "#8d9aa8",
    edge: "#2f363e",
  },
};

function wallColor(kind: Wall, u: number, z: number, w: number, h: number) {
  const pal = wallPalettes[kind];
  if (z === h - 1) return darken(pal.base, 0.62);
  if (z === 0 && kind !== "stone") {
    return u % 2 ? colors.stone : colors.stoneDark;
  }
  switch (kind) {
    case "timber": {
      const mid = Math.floor(h / 2);
      if (u === 0 || u === w - 1 || u % 6 === 0 || z === mid || z === 1) {
        return pal.line;
      }
      if (z < mid && u % 6 === mid - z) return pal.line;
      return hash(u, z, 3) < 0.12 ? pal.alt : pal.base;
    }
    case "planks":
      return u % 3 === 2 ? pal.line : hash(u, z, 5) < 0.15 ? pal.alt : pal.base;
    case "stone": {
      const course = Math.floor(z / 3);
      if (z % 3 === 2) return pal.line;
      if ((u + (course % 2) * 3) % 6 === 0) return pal.line;
      if (z % 3 === 1 && (u + (course % 2) * 3) % 6 === 1) return pal.alt;
      return hash(u, z, 7) < 0.1 ? colors.stoneDark : pal.base;
    }
    case "brick": {
      if (z % 2 === 0) return pal.line;
      return (u + (Math.floor(z / 2) % 2) * 2) % 4 === 0 ? pal.line : pal.base;
    }
    default:
      return hash(u, z, 9) < 0.14 ? pal.alt : pal.base;
  }
}

function roofColor(
  kind: Exclude<Roof, "battlement">,
  row: number,
  u: number,
): string {
  const pal = roofPalettes[kind];
  if (kind === "thatch") {
    if ((u + row * 2) % 5 === 0) return pal.row;
    if ((u - row) % 7 === 0) return pal.light;
    return pal.base;
  }
  if (row % 2 === 0) return pal.row;
  if ((u + (Math.floor(row / 2) % 2) * 2) % 4 === 0) return pal.joint;
  return pal.base;
}

export interface HouseOptions {
  /** Width of the front, depth and wall height, in pixels. */
  w: number;
  d: number;
  h: number;
  roofH?: number;
  wall: Wall;
  roof: Roof;
  /** Left edge of the door on the front wall, if any. */
  door?: number;
  /** Left edges of the windows on the front wall. */
  windows?: number[];
  shutters?: string;
  /** Position of the chimney along the ridge, if any. */
  chimney?: number;
  /** A big gate instead of a door, such as a barn's or a garage's. */
  gate?: { u: number; w: number; color?: string };
  /** For a flat top: whether it has merlons. */
  merlons?: boolean;
  /** Whether to cast a shadow; off for parts of a larger sprite. */
  shadow?: boolean;
}

export interface House {
  pixels: Pixels;
  /** The top of the chimney, where its smoke rises. */
  chimney?: Point;
}

/**
 * A house in an oblique view: the front wall faces the viewer, the right side
 * wall and gable recede up and to the right, and the roof's ridge runs along
 * the front. Battlements give a flat top with merlons instead of a roof.
 */
export function house(o: HouseOptions): House {
  const { w, d, h, wall, roof } = o;
  const roofH = o.roofH ?? Math.ceil(d / 2) + 1;
  const flat = roof === "battlement";
  const chimneyH = o.chimney === undefined ? 0 : 6;
  const width = w + d + 3;
  const height = (flat ? h + 4 : h + roofH) + d + chimneyH + 4;
  const p = new Pixels(width, height);
  const ox = 1;
  const oy = height - 2;
  const put = (u: number, v: number, z: number, color: string) =>
    p.set(ox + u + v, oy - v - z, color);
  const sideWall = (v: number, z: number) =>
    darken(wallColor(wall, v + 1, z, d + 2, h), 0.72);

  if (!flat) {
    const pal = roofPalettes[roof];
    const half = d / 2;
    /* The back slope, from the ridge down to the back eave. */
    for (let v = d + 1; v >= half; v -= 0.25) {
      const z = h + roofH * (1 - (v - half) / (half + 1));
      const row = Math.round(v - half);
      for (let u = -1; u <= w; u++) {
        put(
          u,
          v,
          z,
          u === -1 || u === w || v >= d + 1
            ? pal.edge
            : darken(roofColor(roof, row, u), 0.78),
        );
      }
    }
  }

  /* The right side wall, darker because it faces away from the light. */
  for (let v = 0; v < d; v++) {
    for (let z = 0; z < h; z++) put(w, v, z, sideWall(v, z));
  }
  if (d >= 8 && h >= 8) {
    const v0 = Math.floor(d / 2) - 1;
    for (let v = v0; v < v0 + 2; v++) {
      for (let z = h - 5; z < h - 3; z++) put(w, v, z, "#1f2b36");
    }
  }

  if (!flat) {
    /* The gable above the side wall. */
    for (let v = 0; v < d; v++) {
      const top = h + roofH * (1 - Math.abs(v + 0.5 - d / 2) / (d / 2));
      for (let z = h; z < top; z++) put(w, v, z, sideWall(v, z));
    }
  }

  /* The front wall. */
  for (let u = 0; u < w; u++) {
    for (let z = 0; z < h; z++) {
      const color = wallColor(wall, u, z, w, h);
      put(u, 0, z, u === 0 && z > 0 && z < h - 1 ? darken(color, 1.06) : color);
    }
  }
  for (const wx of o.windows ?? []) {
    const z0 = h - 6;
    for (let u = wx; u < wx + 3; u++) {
      for (let z = z0; z < z0 + 3; z++) {
        put(u, 0, z, u === wx && z === z0 + 2 ? "#9fc3d9" : "#24323f");
      }
      put(u, 0, z0 - 1, "#f4ecd6");
    }
    if (o.shutters) {
      for (let z = z0; z < z0 + 3; z++) {
        put(wx - 1, 0, z, o.shutters);
        put(wx + 3, 0, z, o.shutters);
      }
    }
  }
  if (o.door !== undefined) {
    const top = Math.min(h - 3, 7);
    for (let u = o.door; u < o.door + 3; u++) {
      for (let z = 1; z < top; z++) {
        put(u, 0, z, z === top - 1 && u !== o.door + 1 ? "#6e4724" : "#4a2e16");
      }
    }
    put(o.door + 2, 0, 3, colors.yolk);
    put(o.door + 1, 0, 0, colors.stoneLight);
  }
  if (o.gate) {
    const { u: gu, w: gw } = o.gate;
    const gateColor = o.gate.color ?? colors.wood;
    for (let u = gu; u < gu + gw; u++) {
      for (let z = 0; z < h - 2; z++) {
        put(
          u,
          0,
          z,
          u === gu || u === gu + gw - 1 || z === h - 3
            ? colors.woodDark
            : u % 3 === 0
              ? darken(gateColor, 0.8)
              : gateColor,
        );
      }
    }
  }

  let chimney: Point | undefined;
  if (flat) {
    const top = "#cfc9bb";
    for (let v = 0; v < d; v++) {
      for (let u = 0; u < w; u++) {
        put(u, v, h, (u + v) % 5 === 0 ? colors.stone : top);
      }
    }
    const merlon = (u: number, v: number, lit: boolean) => {
      put(u, v, h + 1, lit ? colors.stoneLight : colors.stone);
      put(u, v, h + 2, lit ? colors.stoneLight : colors.stone);
      put(u, v, h + 3, colors.white);
    };
    if (o.merlons !== false) {
      for (let u = 0; u < w; u++) if (u % 3 !== 2) merlon(u, d - 1, false);
      for (let v = 0; v < d; v++) if (v % 3 !== 2) merlon(0, v, true);
      for (let v = 0; v < d; v++) {
        if (v % 3 !== 2) {
          put(w - 1, v, h + 1, colors.stoneDark);
          put(w - 1, v, h + 2, colors.stoneDark);
          put(w - 1, v, h + 3, colors.stone);
        }
      }
      for (let u = 0; u < w; u++) if (u % 3 !== 2) merlon(u, 0, true);
    }
  } else {
    const pal = roofPalettes[roof];
    const half = d / 2;
    /* The front slope, from the eave up to the ridge. */
    for (let v = -1; v <= half; v += 0.25) {
      const z = h + roofH * ((v + 1) / (half + 1));
      const row = Math.round(half - v);
      for (let u = -1; u <= w; u++) {
        const edge = u === -1 || u === w || v === -1;
        put(
          u,
          v,
          z,
          edge
            ? pal.edge
            : v >= half - 0.25
              ? pal.light
              : u === 0 || u === 1
                ? darken(roofColor(roof, row, u), 1.08)
                : roofColor(roof, row, u),
        );
      }
    }
    if (o.chimney !== undefined) {
      const [cx, cy] = [ox + o.chimney + half, oy - half - h - roofH];
      for (let y = cy - chimneyH; y < cy + 2; y++) {
        p.set(cx, y, "#c96a48");
        p.set(cx + 1, y, "#a3482f");
        p.set(cx + 2, y, "#7e3626");
      }
      p.rect(cx - 1, cy - chimneyH, 4, 1, colors.mortar);
      chimney = [cx + 1, cy - chimneyH - 1];
    }
  }

  return { pixels: o.shadow === false ? p : withShadow(p, 5, 2), chimney };
}

/** A pointed roof or an onion dome on a tower whose top is w wide. */
function cap(
  p: Pixels,
  cx: number,
  baseY: number,
  w: number,
  kind: "cone" | "dome",
  pal: { light: string; base: string; dark: string; edge: string },
) {
  const coneH = Math.round(w * 1.1);
  const profile =
    kind === "cone"
      ? Array.from({ length: coneH }, (_, i) =>
          Math.max(0.5, (w / 2 + 1) * (1 - i / coneH)),
        )
      : [0.9, 1, 1.05, 1.05, 0.95, 0.75, 0.5, 0.3, 0.18, 0.12, 0.12].map(
          (f) => f * (w / 2 + 1),
        );
  profile.forEach((half, i) => {
    const y = baseY - i;
    const left = Math.round(cx - half);
    const right = Math.round(cx + half);
    for (let x = left; x <= right; x++) {
      const t = (x - left) / Math.max(1, right - left);
      p.set(
        x,
        y,
        x === left || x === right
          ? pal.edge
          : t < 0.3
            ? pal.light
            : t < 0.7
              ? pal.base
              : pal.dark,
      );
    }
  });
  const tip = baseY - profile.length;
  p.set(Math.round(cx), tip, pal.edge);
  p.set(Math.round(cx), tip - 1, colors.yolk);
  return tip - 1;
}

/** A stone tower with battlements, a pointed roof or an onion dome. */
export function tower(o: {
  w: number;
  d: number;
  h: number;
  cap: "cone" | "dome" | "battlement";
  capColors?: { light: string; base: string; dark: string; edge: string };
  wall?: Wall;
}): { pixels: Pixels; top: Point } {
  const body = house({
    w: o.w,
    d: o.d,
    h: o.h,
    wall: o.wall ?? "stone",
    roof: "battlement",
    windows: o.h > 18 ? [Math.floor(o.w / 2) - 1] : [],
    merlons: o.cap === "battlement",
    shadow: false,
  }).pixels;
  const extra = 18;
  const raw = new Pixels(body.width, body.height + extra);
  raw.stamp(body, 0, extra);
  const topCx = 1 + o.w / 2 + o.d / 2 - 0.5;
  const topCy = raw.height - 2 - o.d / 2 - o.h;
  let top: Point = [Math.round(topCx), Math.round(topCy) - 4];
  if (o.cap !== "battlement") {
    const pal = o.capColors ?? {
      light: "#8fb3a2",
      base: "#5f8f7c",
      dark: "#3f6656",
      edge: "#26403a",
    };
    const tip = cap(
      raw,
      topCx,
      Math.round(topCy + o.d / 2),
      o.w + Math.floor(o.d / 2) - 1,
      o.cap,
      pal,
    );
    top = [Math.round(topCx), tip];
  }
  return { pixels: withShadow(raw, 5, 2), top };
}

/* ---------- Landmarks ---------- */

/**
 * A church with two towers and onion domes: a loose nod to Einsiedeln, not a
 * picture of its monastery. No religious symbols.
 */
export function church(): Pixels {
  const nave = house({
    w: 34,
    d: 14,
    h: 14,
    roofH: 8,
    wall: "plaster",
    roof: "slate",
    windows: [12, 19],
  });
  const left = tower({ w: 10, d: 9, h: 30, cap: "dome" });
  const right = tower({ w: 10, d: 9, h: 30, cap: "dome" });
  const p = new Pixels(64, 72);
  p.stamp(nave.pixels, 12, p.height - nave.pixels.height - 2);
  p.stamp(left.pixels, 2, p.height - left.pixels.height);
  p.stamp(right.pixels, 44, p.height - right.pixels.height - 6);
  /* A big portal between the towers. */
  p.rect(26, 63, 6, 6, "#4a2e16");
  p.rect(27, 62, 4, 1, "#4a2e16");
  p.rect(28, 61, 2, 1, "#6e4724");
  return p;
}

/** A windmill's body; the sails are drawn separately in two frames. */
export function windmill(): { pixels: Pixels; hub: Point } {
  const p = new Pixels(22, 40);
  const bottom = 37;
  const top = 12;
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top);
    const half = 4.5 + t * 3.5;
    const left = Math.round(11 - half);
    const right = Math.round(11 + half);
    for (let x = left; x <= right; x++) {
      const s = (x - left) / (right - left);
      p.set(
        x,
        y,
        x === left || x === right
          ? colors.wallDark
          : y === bottom
            ? colors.stoneDark
            : s > 0.68
              ? "#cbb98f"
              : (x + y) % 9 === 0
                ? "#e2d3ae"
                : "#efe3c4",
      );
    }
  }
  p.rect(10, 30, 3, 7, "#4a2e16");
  p.rect(10, 20, 2, 3, "#24323f");
  const tip = cap(p, 11, top, 9, "cone", {
    light: colors.thatchLight,
    base: colors.thatch,
    dark: colors.thatchDark,
    edge: colors.thatchOutline,
  });
  void tip;
  return { pixels: withShadow(p, 5, 2), hub: [11, top - 3] };
}

/** The windmill's sails, turned by 45 degrees in the second frame. */
export function sails(frame: 0 | 1): Pixels {
  const size = 33;
  const c = 16;
  const p = new Pixels(size, size);
  for (let arm = 0; arm < 4; arm++) {
    const a = (arm * Math.PI) / 2 + (frame ? Math.PI / 4 : 0);
    const [dx, dy] = [Math.cos(a), Math.sin(a)];
    const [px, py] = [-dy, dx];
    for (let r = 4; r <= 15; r++) {
      for (let s = 1; s <= 3; s++) {
        p.set(
          c + dx * r + px * s,
          c + dy * r + py * s,
          r % 3 === 0 || s === 3 ? colors.woodLight : "#f3ead2",
        );
      }
    }
    for (let r = 1; r <= 15; r++)
      p.set(c + dx * r, c + dy * r, colors.woodDark);
  }
  p.rect(c - 1, c - 1, 3, 3, colors.woodDark);
  p.set(c, c, colors.woodLight);
  return p;
}

/** A sailing ship seen from the side, with one square sail. */
export function ship(sail = "#f6eedb", pennant = "#a63d2a"): Pixels {
  const p = new Pixels(42, 38);
  /* Hull. */
  for (let y = 26; y <= 33; y++) {
    const i = y - 26;
    const left = Math.round(3 + i * 0.7);
    const right = Math.round(38 - i * 1.4);
    for (let x = left; x <= right; x++) {
      p.set(
        x,
        y,
        y === 26
          ? colors.woodLight
          : x === left || x === right || y === 33
            ? "#3e2814"
            : y % 2
              ? colors.wood
              : "#74481f",
      );
    }
  }
  for (const x of [12, 17, 22, 27]) p.set(x, 28, "#2a1a0c");
  /* Stern castle. */
  p.rect(3, 20, 10, 6, colors.wood);
  p.rect(3, 20, 10, 1, colors.woodLight);
  p.rect(3, 25, 10, 1, "#3e2814");
  p.rect(5, 22, 2, 2, colors.yolk);
  p.rect(9, 22, 2, 2, colors.yolk);
  line(p, 38, 26, 41, 22, colors.woodDark);
  /* Mast, yard and sail. */
  p.rect(21, 3, 2, 23, colors.woodDark);
  line(p, 11, 6, 32, 6, colors.woodDark);
  for (let y = 7; y <= 21; y++) {
    const bulge = Math.round(2 * Math.sin(((y - 7) / 14) * Math.PI));
    const left = 12 - bulge;
    const right = 31 + bulge;
    for (let x = left; x <= right; x++) {
      const s = (x - left) / (right - left);
      p.set(
        x,
        y,
        x === left || x === right || y === 21
          ? "#8a7a5a"
          : y % 5 === 0
            ? darken(sail, 0.9)
            : s > 0.72
              ? darken(sail, 0.85)
              : s < 0.2
                ? darken(sail, 1.02)
                : sail,
      );
    }
  }
  line(p, 22, 22, 39, 25, "#5a4630");
  line(p, 22, 7, 39, 24, "#5a4630");
  /* Pennant. */
  p.rows(["PPPPP", "PPP..", "P...."], { P: pennant }, 23, 0);
  /* Foam along the waterline. */
  for (let x = 2; x <= 40; x++) {
    if ((x * 7) % 5 < 3) p.set(x, 34, colors.white);
    if ((x * 3) % 7 < 2) p.set(x, 35, "#cfe6f5");
  }
  return p;
}

/** A small rowing boat. */
export function rowboat(): Pixels {
  const p = new Pixels(16, 7);
  p.rows(
    [
      "..llllllllllll..",
      ".lwwwwwwwwwwwwl.",
      "lwwbwwwwbwwwwwwl",
      ".ldddddddddddddl",
      "..lllllllllllll.",
      "...ffff.ffff....",
    ],
    {
      l: "#3e2814",
      w: colors.woodLight,
      b: colors.woodDark,
      d: colors.wood,
      f: "#cfe6f5",
    },
  );
  return p;
}

/**
 * The crane beside the egg: a post, a jib reaching over the egg and a
 * treadwheel at its foot. The rope and its load are drawn separately.
 */
export function crane(jib: number, height: number): Pixels {
  const p = new Pixels(jib + 14, height + 6);
  const post = jib + 4;
  const ground = height + 2;
  for (let y = 4; y <= ground; y++) {
    p.set(post, y, colors.woodLight);
    p.set(post + 1, y, colors.wood);
    p.set(post + 2, y, colors.woodDark);
  }
  for (let x = 1; x <= post + 6; x++) {
    p.set(x, 4, colors.woodLight);
    p.set(x, 5, colors.woodDark);
  }
  line(p, post, 22, post - 16, 6, colors.wood);
  line(p, post + 2, 6, post + 6, 2, colors.woodDark);
  p.rect(post + 5, 1, 3, 3, colors.stoneDark);
  p.rect(0, 3, 3, 4, colors.woodDark);
  /* Treadwheel. */
  ellipse(p, post + 1, ground - 9, 8, 9, (_x, _y, nx, ny) => {
    const r = nx * nx + ny * ny;
    if (r < 0.62) return undefined;
    if (r > 0.88) return colors.woodDark;
    return ny < 0 ? colors.woodLight : colors.wood;
  });
  for (let a = 0; a < 4; a++) {
    const ang = (a * Math.PI) / 4;
    line(
      p,
      post + 1 - Math.cos(ang) * 7,
      ground - 9 - Math.sin(ang) * 8,
      post + 1 + Math.cos(ang) * 7,
      ground - 9 + Math.sin(ang) * 8,
      colors.wood,
    );
  }
  p.rect(post - 4, ground, 11, 2, colors.woodDark);
  return withShadow(p, 3, 2);
}

/** The crane's rope with a piece of shell hanging from it. */
export function craneLoad(length: number): Pixels {
  const p = new Pixels(9, length + 7);
  for (let y = 0; y < length; y++) p.set(4, y, "#3e2814");
  p.rows(
    [
      "...o.o...",
      "..ooooo..",
      ".oWWWWwo.",
      "oWWWWWwwo",
      "oWWWwwwdo",
      ".oooooo..",
    ],
    { o: shell.outline, W: shell.light, w: shell.mid, d: shell.dark },
    0,
    length,
  );
  return p;
}

/* ---------- Trees and nature ---------- */

/** A fir tree in tiers, darker and bluer than the leafy trees. */
export function conifer(seed: number, size = 6): Pixels {
  const rng = seeded(seed);
  const w = size * 2 + 3;
  const h = Math.round(size * 3.2) + 4;
  const p = new Pixels(w, h);
  const cx = (w - 1) / 2;
  const tiers = 3;
  const crown = new Pixels(w, h);
  const tierH = Math.round(size * 1.2);
  for (let t = 0; t < tiers; t++) {
    const top = Math.round(t * tierH * 0.72);
    const maxHalf = size * (0.55 + (t / (tiers - 1)) * 0.45);
    for (let r = 0; r < tierH; r++) {
      const half = 0.6 + (r / (tierH - 1)) * maxHalf;
      for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
        if (r === tierH - 1 && (x + t) % 2 === 0 && Math.abs(x - cx) > 1) {
          continue;
        }
        const light = -(x - cx) / (half + 1) + (rng() - 0.5) * 0.6 - r * 0.04;
        crown.set(
          x,
          top + r,
          light > 0.55
            ? "#5f9f4e"
            : light > 0.05
              ? "#3f7f3c"
              : light > -0.45
                ? "#2c6631"
                : "#1f4d2a",
        );
      }
    }
  }
  outline(crown, "#123220");
  const crownBottom = Math.round((tiers - 1) * tierH * 0.72) + tierH;
  for (let y = crownBottom - 1; y < crownBottom + 2; y++) {
    p.set(cx, y, colors.trunk);
  }
  p.stamp(crown, 0, 0);
  const out = withShadow(p, 4, 2);
  return out;
}

const blossomLeaves = {
  outline: "#7a3a4e",
  dark: "#c4688b",
  mid: "#e590b0",
  light: "#f6b9cf",
  shine: "#fff0f5",
};

/** A blossoming tree, its crown in pinks. */
export function blossom(seed: number, size = 6): Pixels {
  const rng = seeded(seed);
  const w = size * 2 + 6;
  const h = Math.round(size * 2.6) + 3;
  const p = new Pixels(w, h);
  const cx = w / 2;
  const cy = size + 1;
  ellipse(p, cx + 3, h - 2.5, size * 0.95, 2.2, colors.shadow);
  for (let y = Math.round(cy + size * 0.4); y < h - 2; y++) {
    p.set(cx - 1, y, colors.trunkLight);
    p.set(cx, y, colors.trunk);
  }
  const crown = new Pixels(w, h);
  for (let i = 0; i < 6; i++) {
    const bx = cx + (rng() - 0.5) * size * 1.1;
    const by = cy + (rng() - 0.5) * size * 0.8;
    const br = size * (i === 0 ? 1 : 0.45 + rng() * 0.3);
    ellipse(
      crown,
      i === 0 ? cx : bx,
      i === 0 ? cy : by,
      br,
      br * 0.9,
      (x, y) => {
        const light =
          (-0.55 * (x + 0.5 - cx)) / size -
          (0.75 * (y + 0.5 - cy)) / size +
          (rng() - 0.5) * 0.9;
        return light > 0.7
          ? blossomLeaves.shine
          : light > 0.2
            ? blossomLeaves.light
            : light > -0.35
              ? blossomLeaves.mid
              : blossomLeaves.dark;
      },
    );
  }
  outline(crown, blossomLeaves.outline);
  p.stamp(crown, 0, 0);
  return p;
}

/** A grey boulder. */
export function rock(seed: number, size = 4): Pixels {
  const rng = seeded(seed);
  const p = new Pixels(size * 2 + 4, size * 2 + 2);
  const stone = new Pixels(p.width, p.height);
  ellipse(
    stone,
    size + 1,
    size + 1,
    size + rng() * 0.8,
    size * 0.75,
    (x, y) => {
      const light =
        -(x - size) / size - (y - size) / size + (rng() - 0.5) * 0.5;
      return light > 0.5
        ? colors.stoneLight
        : light > -0.3
          ? colors.stone
          : colors.stoneDark;
    },
  );
  outline(stone, colors.mortar);
  p.stamp(stone, 0, 0);
  return withShadow(p, 2, 1);
}

/* ---------- Things lying about ---------- */

/** A stack of logs, their cut ends facing the viewer. */
export function logs(): Pixels {
  const p = new Pixels(14, 9);
  p.rows(
    [
      "....oOo.oOo...",
      "...oxyxooxyxo.",
      "..oOooOoOooOo.",
      ".oxyxoxyxoxyxo",
      ".oOooOooOooOo.",
      "oxyxoxyxoxyxo.",
      "oOooOooOooOo..",
    ],
    { o: colors.woodDark, O: colors.wood, x: "#d9b07a", y: "#b07a42" },
  );
  return withShadow(p, 2, 1);
}

/** A pile of shell pieces for the egg. */
export function shellPile(): Pixels {
  const p = new Pixels(16, 8);
  p.rows(
    [
      "......oWWo......",
      "...oWWwoWWWo....",
      "..oWWwwdowWWwo..",
      ".oWWwwddoWWwwdo.",
      "oWWWwwdoWWWwwddo",
      "oooooooooooooooo",
    ],
    { o: shell.outline, W: shell.light, w: shell.mid, d: shell.dark },
    0,
    1,
  );
  return withShadow(p, 2, 1);
}

/** Cut stone blocks. */
export function stones(): Pixels {
  const p = new Pixels(12, 8);
  p.rows(
    [
      "..LLLLm.....",
      "..LsssmLLLm.",
      "..sssddsssd.",
      "LLLLmLLLLm..",
      "LsssmLsssm..",
      "sssddsssdd..",
    ],
    {
      L: colors.stoneLight,
      s: colors.stone,
      d: colors.stoneDark,
      m: colors.mortar,
    },
    0,
    1,
  );
  return withShadow(p, 2, 1);
}

/** A stone well with a small roof. */
export function well(): Pixels {
  const p = new Pixels(14, 16);
  ellipse(p, 7, 12, 6, 3, (_x, _y, nx, ny) =>
    nx * nx + ny * ny < 0.4
      ? "#1f3550"
      : ny < 0
        ? colors.stoneLight
        : colors.stone,
  );
  p.rect(2, 3, 1, 9, colors.woodDark);
  p.rect(11, 3, 1, 9, colors.woodDark);
  p.rows(
    ["...rrrrrrr...", "..rRRRRRRRr..", ".rRRRRRRRRRr.", "rrrrrrrrrrrrr"],
    { r: "#b8601f", R: "#e0873a" },
    0,
    0,
  );
  p.rect(5, 6, 4, 1, colors.wood);
  p.rect(6, 7, 1, 3, "#3e2814");
  p.rect(5, 10, 3, 2, colors.wood);
  return withShadow(p, 3, 1);
}

/** A market stall with a striped awning and crates. */
export function stall(stripe = "#a63d2a"): Pixels {
  const p = new Pixels(20, 16);
  for (let y = 0; y < 5; y++) {
    for (let x = y; x < 18 + y * 0; x++) {
      p.set(x, y, Math.floor((x - y) / 3) % 2 ? colors.white : stripe);
    }
  }
  for (let x = 0; x < 18; x++) {
    if (x % 3 !== 2) p.set(x, 5, Math.floor(x / 3) % 2 ? colors.white : stripe);
  }
  p.rect(0, 6, 1, 7, colors.woodDark);
  p.rect(17, 6, 1, 7, colors.woodDark);
  p.rect(1, 10, 16, 3, colors.wood);
  p.rect(1, 10, 16, 1, colors.woodLight);
  p.rows(
    [".aa.yy.gg.WW.aa.", "aaaayyyggggWWWaa"],
    {
      a: "#d24a32",
      y: colors.wheat,
      g: "#6fae3f",
      W: shell.light,
    },
    1,
    8,
  );
  return withShadow(p, 3, 1);
}

/** A wooden fence along a line of pixels. */
export function fence(length: number, vertical = false): Pixels {
  const p = new Pixels(vertical ? 3 : length, vertical ? length : 4);
  for (let i = 0; i < length; i++) {
    if (vertical) {
      p.set(1, i, i % 4 === 0 ? colors.woodDark : colors.woodLight);
      if (i % 4 === 0) p.set(2, i, colors.shadow);
    } else {
      p.set(i, 1, colors.woodLight);
      p.set(i, 2, colors.wood);
      if (i % 4 === 0) {
        p.set(i, 0, colors.woodLight);
        p.set(i, 3, colors.woodDark);
      }
    }
  }
  return p;
}

/** A field of crops in rows: wheat, cabbages or a freshly ploughed one. */
export function crops(
  w: number,
  h: number,
  kind: "wheat" | "cabbage" | "ploughed" | "sunflower",
): Pixels {
  const p = new Pixels(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      let color: string;
      if (edge) color = colors.dirtDark;
      else if (kind === "wheat") {
        color =
          y % 3 === 0
            ? colors.wheatDark
            : hash(x, y, 1) < 0.12
              ? "#ecd27a"
              : colors.wheat;
      } else if (kind === "ploughed") {
        color = y % 2 === 0 ? colors.dirtDark : colors.dirt;
      } else {
        const plant = y % 3 !== 0 && x % 3 !== 0;
        color = !plant
          ? colors.dirt
          : kind === "cabbage"
            ? (x + y) % 3 === 1
              ? "#9fd36b"
              : "#5f9e3c"
            : (x + y) % 3 === 1
              ? "#4a2e16"
              : colors.yolk;
      }
      p.set(x, y, color);
    }
  }
  return p;
}

/* ---------- Animals ---------- */

/** A hen, white or brown, pecking in the second frame. */
export function hen(frame: 0 | 1, brown = false): Pixels {
  const p = new Pixels(6, 6);
  const body = brown ? "#a8642e" : colors.white;
  const dark = brown ? "#7a4520" : "#d8d2c0";
  p.rows(
    frame
      ? ["......", "......", ".bb...", "bbbbRr", "bddbbY", ".y.y.."]
      : ["...R..", "..bbY.", ".bbbb.", "bbbbb.", "bddbb.", ".y.y.."],
    {
      b: body,
      d: dark,
      R: "#d1382a",
      r: "#d1382a",
      Y: colors.yolk,
      y: "#e08a3a",
    },
  );
  p.set(5, 5, colors.shadow);
  return p;
}

/** A sheep grazing, its head down in the second frame. */
export function sheep(frame: 0 | 1): Pixels {
  const p = new Pixels(9, 7);
  p.rows(
    frame
      ? [
          ".........",
          "..WWWWW..",
          ".WwWWWWW.",
          ".WWWwWWW.",
          ".WWWWWWkk",
          "..k..k.kk",
          "..k..k...",
        ]
      : [
          ".......kk",
          "..WWWWWkk",
          ".WwWWWWk.",
          ".WWWwWWW.",
          ".WWWWWWW.",
          "..k..k...",
          "..k..k...",
        ],
    { W: "#f4f1e6", w: "#d8d2c0", k: "#2b2118" },
  );
  return withShadow(p, 2, 1);
}

/** A seagull, wings up or down. */
export function gull(frame: 0 | 1): Pixels {
  const p = new Pixels(9, 4);
  p.rows(
    frame
      ? ["kk.....kk", "..WW.WW..", "....W....", "........."]
      : [".........", "kWW...WWk", "...WWW...", "....W...."],
    { W: colors.white, k: "#3a3a3a" },
  );
  return p;
}

/** Wisps of chimney smoke. */
export function smoke(): Pixels {
  const p = new Pixels(7, 10);
  p.rows(
    [
      ".ss....",
      "sSSs...",
      ".ss..s.",
      "....sSs",
      "...sSs.",
      "..ss...",
      ".sS....",
      ".s.....",
    ],
    { s: "#d9d6cf", S: "#f4f2ec" },
    0,
    1,
  );
  return p;
}

/* ---------- Settlers ---------- */

export interface Look {
  woman?: boolean;
  clothes: string;
  hair: string;
  head?: "straw" | "cap" | "scarf" | "bare";
  headColor?: string;
  apron?: boolean;
  skin?: string;
  carry?: "shell" | "log" | "basket" | "sack" | "plank";
  tool?: "hammer" | "axe" | "hoe" | "rod";
}

export type Pose = "walk" | "work" | "cheer";

/**
 * A settler, man or woman, 9 × 15 pixels with room for a load on the head and
 * a tool in the hand. Frame 1 moves the feet for walking, or lowers the tool.
 */
export function person(look: Look, pose: Pose, frame: 0 | 1): Pixels {
  const p = new Pixels(9, 15);
  const bx = 2;
  const head = look.head ?? (look.woman ? "bare" : "straw");
  const headTop = look.woman ? 3 : 4;
  const skin = look.skin ?? colors.skin;
  const clothesDark = darken(look.clothes, 0.72);

  const feetA = look.woman ? ".F..." : ".F...";
  const feetB = look.woman ? "...F." : "...F.";
  const feet = pose === "walk" ? (frame ? feetB : feetA) : ".F.F.";
  const arms = pose === "cheer" ? ".DPD." : "ADPDA";
  const rows = look.woman
    ? [
        head === "scarf" ? ".KKK." : ".hhh.",
        head === "scarf" ? "KKKKK" : "hhhhh",
        head === "scarf" ? "KSSSK" : "hSSSh",
        ".SSS.",
        "DDDDD",
        "dDDDd",
        look.apron ? arms : arms.replace("P", "D"),
        look.apron ? "DDPDD" : "DDDDD",
        look.apron ? "DDPDD" : "dDDDd",
        "dDDDd",
        feet,
      ]
    : [
        head === "bare" ? ".hhh." : ".KKK.",
        head === "bare" ? "hSSSh" : "KKKKK",
        ".SSS.",
        ".SSS.",
        "DDDDD",
        "dDDDd",
        pose === "cheer" ? ".DbD." : "ADbDA",
        ".LLL.",
        ".L.L.",
        feet,
      ];
  p.rows(
    rows,
    {
      h: look.hair,
      K:
        head === "straw"
          ? colors.hat
          : (look.headColor ?? (look.woman ? "#d24a32" : "#2f6690")),
      S: skin,
      D: look.clothes,
      d: clothesDark,
      P: "#f4ecd6",
      A: skin,
      b: colors.legs,
      L: "#4a3b2c",
      F: "#2b1d12",
    },
    bx,
    headTop,
  );
  if (head === "straw") {
    p.set(bx, headTop + 1, colors.thatch);
    p.set(bx + 4, headTop + 1, colors.thatch);
  }
  if (look.woman && head !== "scarf") {
    /* A braid over the shoulder. */
    p.set(bx + 4, headTop + 4, look.hair);
    p.set(bx + 4, headTop + 5, look.hair);
  }
  p.set(bx + 1, 14, colors.shadow);
  p.set(bx + 2, 14, colors.shadow);
  p.set(bx + 3, 14, colors.shadow);

  if (pose === "cheer") {
    p.set(bx - 1, headTop + 2, skin);
    p.set(bx - 1, headTop + 3, look.clothes);
    p.set(bx + 5, headTop + 2, skin);
    p.set(bx + 5, headTop + 3, look.clothes);
    p.set(bx - 1, headTop + 4, look.clothes);
    p.set(bx + 5, headTop + 4, look.clothes);
  }

  const load = headTop - 2;
  switch (look.carry) {
    case "shell":
      p.rows([".WWW.", "wWWWw"], { W: shell.light, w: shell.dark }, bx, load);
      break;
    case "log":
      p.rows(["xTTTTTx"], { T: colors.wood, x: "#d9b07a" }, bx - 1, load + 1);
      p.rows([".ttttt."], { t: colors.woodDark }, bx - 1, load + 2);
      break;
    case "plank":
      p.rows(["TTTTTTTTT"], { T: colors.woodLight }, 0, load + 1);
      break;
    case "basket":
      p.rows(
        [".eWe.", "BbBbB"],
        {
          e: shell.light,
          W: colors.white,
          B: colors.thatchDark,
          b: colors.thatch,
        },
        bx,
        load,
      );
      break;
    case "sack":
      p.rows([".kkk.", "kKKKk"], { k: "#b8a479", K: "#ddcfa9" }, bx, load);
      break;
  }
  if (look.carry && pose === "walk") {
    /* Hands up to hold the load. */
    p.set(bx, headTop + 6, look.clothes);
    p.set(bx + 4, headTop + 6, look.clothes);
    p.set(bx - 1, load + 2, skin);
    p.set(bx + 5, load + 2, skin);
  }

  if (pose === "work" && look.tool) {
    const hx = bx + 5;
    const hy = headTop + 6;
    const head =
      look.tool === "axe"
        ? colors.stoneLight
        : look.tool === "hoe"
          ? colors.stoneDark
          : colors.stone;
    if (look.tool === "rod") {
      line(p, hx, hy, 8, frame ? 1 : 0, colors.woodDark);
    } else if (frame === 0) {
      line(p, hx, hy, hx + 1, hy - 5, colors.woodLight);
      p.rect(hx, hy - 6, 2, 2, head);
      p.set(hx, hy, skin);
    } else {
      line(p, hx - 1, hy, hx + 1, hy + 3, colors.woodLight);
      p.rect(hx + 1, hy + 3, 2, 2, head);
      p.set(hx - 1, hy, skin);
    }
  }
  return p;
}

/* ---------- Einsiedeln ---------- */

/**
 * The monastery of Einsiedeln, simplified: a long baroque front, the church's
 * facade jutting out between two towers with onion domes, wings around two
 * courtyards, and the church roof running back between them. No religious
 * symbols. Returns the facade's middle, for the square in front of it.
 */
export function monastery(): { pixels: Pixels; front: number } {
  const W = 86;
  const D = 26;
  const H = 12;
  const wing = 7;
  const facadeW = 24;
  const towerW = 7;
  const towerD = 5;
  const towerH = 32;
  const proj = 3;
  const width = W + D + 6;
  const height = towerH + D + 22;
  const p = new Pixels(width, height);
  const ox = 1;
  const oy = height - 2;
  const put = (u: number, v: number, z: number, color: string) =>
    p.set(ox + u + v, oy - v - z, color);
  const plaster = "#efe0b8";
  const plasterLight = "#f8eed2";
  const plasterDark = darken(plaster, 0.74);
  const cornice = "#c9b58a";
  const glass = "#2a3a4a";
  const roof = { light: "#8d97a0", base: "#6b7580", dark: "#4f5862" };
  const cx = W / 2;

  /* The right side wall. */
  for (let v = 0; v < D; v++) {
    for (let z = 0; z < H; z++) {
      const window = (z === 4 || z === 5 || z === 8 || z === 9) && v % 4 === 2;
      put(
        W,
        v,
        z,
        z >= H - 2 ? darken(cornice, 0.8) : window ? glass : plasterDark,
      );
    }
  }

  /* Roofs of the wings around two courtyards, seen from above. */
  const ridge = Math.floor(wing / 2);
  for (let v = 0; v < D; v++) {
    for (let u = 0; u < W; u++) {
      let color: string;
      const front = v < wing;
      const back = v >= D - wing;
      const left = u < wing;
      const right = u >= W - wing;
      if (front || back) {
        const t = front ? v : v - (D - wing);
        color = t === ridge ? roof.light : t < ridge ? roof.base : roof.dark;
        if (u % 4 === 0 && t !== ridge) color = darken(color, 0.9);
      } else if (left || right) {
        const s = left ? u : u - (W - wing);
        color = s === ridge ? roof.light : s < ridge ? roof.light : roof.dark;
      } else {
        /* Courtyard lawn with a cross of paths, shaded along the north. */
        const cu = u < cx ? (wing + cx - 7) / 2 : (cx + 7 + W - wing) / 2;
        const cv = D / 2;
        if (Math.abs(u + 0.5 - cu) < 1 || Math.abs(v + 0.5 - cv) < 1) {
          color = colors.trailLight;
        } else color = v === D - wing - 1 ? "#3f7f2c" : "#5f9e3c";
      }
      put(u, v, H, color);
    }
  }

  /* The church's long roof between the courtyards, higher than the wings. */
  const naveH = H + 7;
  for (let v = wing - 1; v < D - 1; v++) {
    for (let z = H; z < naveH; z++) put(cx + 7, v, z, plasterDark);
  }
  for (let v = wing - 1; v < D - 1; v++) {
    for (let u = cx - 7; u < cx + 7; u++) {
      const s = u + 0.5 - cx;
      put(
        u,
        v,
        naveH,
        Math.abs(s) < 1 ? roof.light : s < 0 ? roof.base : roof.dark,
      );
    }
  }

  /* The long front: two floors of windows between pilasters. */
  for (let u = 0; u < W; u++) {
    for (let z = 0; z < H; z++) {
      let color = plaster;
      if (z === 0) color = "#cdbf9a";
      else if (z >= H - 2) color = cornice;
      else if (u % 10 === 0) color = plasterLight;
      else if (
        (z === 3 || z === 4 || z === 7 || z === 8) &&
        u % 5 >= 2 &&
        u % 5 <= 3
      ) {
        color = glass;
      }
      put(u, 0, z, color);
    }
  }

  /* The church's facade, jutting out between the towers. */
  const f0 = cx - facadeW / 2;
  const f1 = cx + facadeW / 2;
  const facadeTop = (u: number) =>
    H +
    8 +
    Math.round(
      3 * Math.cos(((u + 0.5 - cx) / (facadeW / 2 - towerW)) * (Math.PI / 2)),
    );
  for (let v = -proj; v < 0; v++) {
    for (let z = 0; z < facadeTop(f1 - towerW - 1); z++)
      put(f1, v, z, plasterDark);
  }
  for (let u = f0 + towerW; u < f1 - towerW; u++) {
    const top = facadeTop(u);
    for (let z = 0; z < top; z++) {
      let color = plasterLight;
      const du = u + 0.5 - cx;
      if (z === top - 1) color = cornice;
      else if (Math.abs(du) < 2.5 && z < 7)
        color = z === 6 && Math.abs(du) > 1.5 ? plasterLight : "#3a2a1c";
      else if (Math.abs(du) < 1.5 && z >= 10 && z <= 13) color = glass;
      else if (z === 8 || z === H + 4) color = cornice;
      put(u, -proj, z, color);
    }
  }

  /* Two towers with onion domes. */
  for (const t0 of [f0, f1 - towerW]) {
    for (let v = -proj; v < -proj + towerD; v++) {
      for (let z = 0; z < towerH; z++)
        put(t0 + towerW, v, z, darken(plaster, 0.7));
    }
    for (let v = -proj; v < -proj + towerD; v++) {
      for (let u = t0; u < t0 + towerW; u++) put(u, v, towerH, cornice);
    }
    for (let u = t0; u < t0 + towerW; u++) {
      for (let z = 0; z < towerH; z++) {
        let color = u === t0 ? plasterLight : plaster;
        const mid = u - t0 === 3;
        if (z === H - 1 || z === H + 8 || z === towerH - 1) color = cornice;
        else if (mid && (z === 5 || z === 6 || z === 14 || z === 15))
          color = glass;
        else if (
          z >= towerH - 7 &&
          z <= towerH - 4 &&
          u - t0 >= 2 &&
          u - t0 <= 4
        ) {
          color = "#3a2a1c";
        } else if (z === towerH - 11 && mid) color = colors.white;
        put(u, -proj, z, color);
      }
    }
    const sx = ox + t0 + towerW / 2 - proj + towerD / 2 - 0.5;
    const sy = oy + proj - towerD / 2 - towerH;
    cap(p, sx, Math.round(sy + 1), towerW + 1, "dome", {
      light: "#7f9a8c",
      base: "#56705f",
      dark: "#3c5245",
      edge: "#26372d",
    });
  }

  return { pixels: withShadow(p, 6, 2), front: ox + cx - proj };
}

/** A low arcade with round arches, like those around the monastery square. */
export function arcade(w: number): Pixels {
  const h = 7;
  const p = house({
    w,
    d: 5,
    h,
    roofH: 3,
    wall: "plaster",
    roof: "slate",
    shadow: false,
  }).pixels;
  for (let u = 1; u < w - 1; u++) {
    for (let z = 1; z < h - 2; z++) {
      const k = u % 4;
      if (k === 0) continue;
      if (z === h - 3 && k !== 2) continue;
      p.set(1 + u, p.height - 2 - z, "#4a3a2a");
    }
  }
  return withShadow(p, 3, 1);
}

/** A fountain with a stone basin and four jets. */
export function fountain(): Pixels {
  const p = new Pixels(22, 16);
  ellipse(p, 11, 11, 10, 4.5, (x, y, nx, ny) =>
    nx * nx + ny * ny < 0.55
      ? hash(x, y, 4) < 0.2
        ? "#a5d0ec"
        : "#4c94c6"
      : ny < 0
        ? colors.stoneLight
        : colors.stone,
  );
  p.rect(10, 3, 2, 8, colors.stoneLight);
  p.rect(11, 3, 1, 8, colors.stone);
  p.rect(8, 6, 6, 1, colors.stone);
  p.rect(10, 1, 2, 2, colors.yolk);
  for (const [x, y] of [
    [7, 7],
    [14, 7],
    [6, 8],
    [15, 8],
    [9, 5],
    [12, 5],
  ] as const) {
    p.set(x, y, "#cfe6f5");
  }
  return withShadow(p, 2, 1);
}

/** The dam: a stone wall across the lake's north end, with a gatehouse. */
export function dam(w: number): Pixels {
  const wall = house({
    w,
    d: 5,
    h: 7,
    wall: "stone",
    roof: "battlement",
    merlons: false,
    shadow: false,
  }).pixels;
  const gate = house({
    w: 9,
    d: 5,
    h: 6,
    roofH: 4,
    wall: "plaster",
    roof: "slate",
    door: 3,
    shadow: false,
  }).pixels;
  const p = new Pixels(wall.width, wall.height + 12);
  p.stamp(wall, 0, 12);
  p.stamp(gate, w - 14, 12 + wall.height - gate.height - 7);
  /* Railings along the crest. */
  for (let x = 2; x < w + 4; x += 2)
    p.set(x, 12 + wall.height - 15, colors.woodDark);
  return withShadow(p, 3, 2);
}

/** A building site: a dug foundation and a wooden frame. */
export function buildingSite(w: number): Pixels {
  const p = new Pixels(w + 8, 22);
  p.rect(2, 14, w + 2, 6, colors.dirt);
  p.rect(2, 14, w + 2, 1, colors.dirtDark);
  p.rect(2, 19, w + 2, 1, colors.stoneDark);
  for (const x of [3, 3 + Math.floor(w / 2), w + 2]) {
    line(p, x, 18, x, 4, colors.woodDark);
    line(p, x + 4, 15, x + 4, 1, colors.wood);
  }
  line(p, 3, 4, w + 2, 4, colors.woodLight);
  line(p, 7, 1, w + 6, 1, colors.woodLight);
  line(p, 3, 4, 7, 1, colors.wood);
  line(p, w + 2, 4, w + 6, 1, colors.wood);
  line(p, 3, 11, w + 2, 11, colors.wood);
  return withShadow(p, 2, 1);
}
