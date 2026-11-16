/**
 * The games' vehicles and scenes in this variant's pixel art, for the game
 * pictures (Building.astro) and the practice grounds on the game pages. They
 * show only what the games' own texts describe: Moto Devil's stunt bike in
 * side view with ramps, loops, spikes from the ground, ravens and mountains;
 * Car Drive's cars from above on three lanes, with oncoming traffic, trucks,
 * blinking cars, hearts, a shield and the boost.
 */
import { Pixels, colors, darken, ellipse, line, seeded } from "./pixel";
import { hash, house } from "./sprites";

const ink = "#1d1d1f";

/* ---------- Moto Devil ---------- */

/** A spoked wheel of radius r, centred at (cx, cy). */
function wheel(p: Pixels, cx: number, cy: number, r: number, turn = 0) {
  ellipse(p, cx + 0.5, cy + 0.5, r + 0.5, r + 0.5, (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy);
    if (d > r - 1) return ink;
    if (d > r - 2) return "#4a4f55";
    if (d > r - 2.6) return "#b9c0c7";
    if (d < 1.2) return "#d9dde0";
    const spoke = turn ? Math.abs(dx) === Math.abs(dy) : dx === 0 || dy === 0;
    return spoke ? "#8a939b" : undefined;
  });
}

/**
 * The stunt bike with its rider, facing right, 34 × 24 pixels. The helmet
 * is the rider's own colour; the second frame turns the spokes.
 */
export function bike(frame: 0 | 1 = 0, suit = "#2f6690"): Pixels {
  const p = new Pixels(34, 24);
  const red = "#d1382a";
  const redDark = "#8e2a1f";
  const redLight = "#f06a52";
  const chrome = "#c8ced3";
  const chromeDark = "#7d868f";
  const suitDark = darken(suit, 0.72);

  wheel(p, 6, 17, 6, frame);
  wheel(p, 27, 17, 6, frame);

  /* Swingarm, engine and the high exhaust. */
  line(p, 6, 17, 13, 15, "#5a6068");
  line(p, 6, 16, 13, 14, "#7d868f");
  p.rect(12, 12, 7, 5, "#4a4f55");
  for (let y = 12; y < 17; y += 2) p.rect(13, y, 5, 1, "#6b7178");
  p.rect(12, 16, 7, 1, ink);
  line(p, 13, 12, 3, 9, chrome);
  line(p, 13, 13, 3, 10, chromeDark);
  /* Seat, rear fender, tank and side panel. */
  p.rect(6, 9, 9, 2, "#2b2b2b");
  p.rect(7, 8, 6, 1, "#45474a");
  line(p, 1, 9, 6, 11, red);
  line(p, 1, 10, 6, 12, redDark);
  p.rect(15, 8, 6, 3, red);
  p.rect(16, 8, 4, 1, redLight);
  p.rect(15, 10, 6, 1, redDark);
  p.rect(9, 11, 4, 2, red);
  p.rect(10, 11, 2, 1, colors.white);
  /* Fork, front fender, number plate and handlebar. */
  line(p, 21, 7, 27, 17, chrome);
  line(p, 22, 7, 28, 17, chromeDark);
  line(p, 23, 10, 31, 10, red);
  line(p, 24, 11, 30, 11, redDark);
  p.rect(21, 7, 3, 3, colors.white);
  p.set(22, 8, ink);
  p.rect(19, 5, 4, 1, ink);
  p.set(18, 5, "#45474a");

  /* The rider: helmet with visor, suit leaning forward, arm to the bar. */
  ellipse(p, 16.5, 2.5, 3, 2.6, (x, y) =>
    x >= 18 && y >= 2 && y <= 3
      ? "#2b3a4a"
      : y === 2
        ? red
        : x <= 15
          ? "#f6d77a"
          : colors.yolk,
  );
  p.set(19, 3, "#7fa7c8");
  p.rect(15, 5, 3, 1, suit);
  p.rect(13, 6, 5, 1, suit);
  p.rect(12, 7, 5, 1, suit);
  p.rect(11, 8, 5, 1, suitDark);
  p.rect(14, 5, 1, 1, suitDark);
  line(p, 17, 6, 20, 6, suitDark);
  p.rect(20, 5, 2, 2, ink);
  line(p, 13, 9, 17, 11, suit);
  line(p, 13, 10, 16, 12, suitDark);
  line(p, 17, 12, 15, 14, suit);
  p.rect(14, 14, 3, 2, ink);
  return p;
}

/** Flames of the jet boost, pointing left from the bike's tail. */
export function jet(frame: 0 | 1): Pixels {
  const p = new Pixels(14, 7);
  p.rows(
    frame
      ? [
          "....oooYY.....",
          "..ooyyyYWW....",
          "ooyyyyWWWWW...",
          "..ooyyyYWW....",
          "....oooYY.....",
        ]
      : [
          "......ooYY....",
          "...oooyyYWW...",
          ".ooyyyyWWWWW..",
          "...oooyyYWW...",
          "......ooYY....",
        ],
    { o: "#e8735f", y: "#f4a63a", Y: colors.yolk, W: "#fff4c2" },
    0,
    1,
  );
  return p;
}

/** A raven diving with folded wings. */
export function raven(frame: 0 | 1 = 0): Pixels {
  const p = new Pixels(11, 7);
  p.rows(
    frame
      ? [
          "kk.......kk",
          ".kkk...kkk.",
          "...kkkkk...",
          "....kkkY...",
          ".....kk....",
          "....k..k...",
        ]
      : [
          "...........",
          "kkkk...kkkk",
          "..kkkkkkk..",
          "....kkkY...",
          ".....kk....",
          "....k..k...",
        ],
    { k: "#1f1d24", Y: colors.yolk },
  );
  p.set(6, 3, colors.white);
  return p;
}

/** Steel spikes shooting out of the ground. */
export function spikes(n: number, height: number): Pixels {
  const p = new Pixels(n * 5, height + 1);
  for (let i = 0; i < n; i++) {
    const h = height - (i % 2) * 2;
    for (let y = 0; y < h; y++) {
      const half = Math.floor((y * 2) / h + 0.2) + (y > h * 0.6 ? 1 : 0);
      for (let dx = -half; dx <= half; dx++) {
        p.set(
          i * 5 + 2 + dx,
          height - h + y,
          dx < 0 ? "#e6eaee" : dx === 0 ? "#b9c0c7" : "#7d868f",
        );
      }
    }
  }
  p.rect(0, height, n * 5, 1, "#4a4f55");
  return p;
}

/** The sky, distant mountains and the ground of a side-view track. */
export function trackBackdrop(width: number, height: number, ground: number) {
  const p = new Pixels(width, height);
  const skies = ["#6fb0de", "#86c0e6", "#9fcdec", "#b9dcf2", "#d2e9f7"];
  for (let y = 0; y < ground; y++) {
    const band = Math.min(
      skies.length - 1,
      Math.floor((y / ground) * skies.length),
    );
    const next = Math.min(skies.length - 1, band + 1);
    const t = (y / ground) * skies.length - band;
    for (let x = 0; x < width; x++) {
      const color = t > 0.7 && (x + y) % 2 === 0 ? skies[next] : skies[band];
      p.set(x, y, color ?? skies[0] ?? "#86c0e6");
    }
  }
  /* Clouds. */
  const rng = seeded(4);
  for (let i = 0; i < Math.round(width / 40); i++) {
    const cx = rng() * width;
    const cy = 6 + rng() * ground * 0.25;
    for (let k = 0; k < 4; k++) {
      ellipse(
        p,
        cx + k * 4 - 6,
        cy + (k % 2) * 1.5,
        4 + rng() * 2,
        2.4,
        (_x, y) => (y > cy + 1 ? "#e8f2f8" : colors.white),
      );
    }
  }
  /* Mountains with snow, two layers. */
  const ridge = (x: number, far: boolean) =>
    far
      ? ground - 16 - 14 * Math.abs(Math.sin(x / 23)) - 6 * Math.sin(x / 9)
      : ground - 6 - 9 * Math.abs(Math.sin(x / 17 + 2)) - 3 * Math.sin(x / 5);
  for (const far of [true, false]) {
    for (let x = 0; x < width; x++) {
      const top = Math.round(ridge(x, far));
      for (let y = top; y < ground; y++) {
        const snow = y - top < (far ? 4 : 2) && top < ground - (far ? 24 : 12);
        const lit = ridge(x + 1, far) > ridge(x, far);
        p.set(
          x,
          y,
          snow
            ? lit
              ? colors.white
              : "#d8e2ea"
            : far
              ? lit
                ? "#9fb1c4"
                : "#8798ad"
              : lit
                ? "#6f9a6a"
                : "#5a8456",
        );
      }
    }
  }
  /* Grass and dirt. */
  for (let y = ground; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const d = y - ground;
      p.set(
        x,
        y,
        d === 0
          ? "#7cc44a"
          : d === 1
            ? "#4f9e2c"
            : d === 2
              ? "#3f8624"
              : hash(x, y, 3) < 0.08
                ? "#7f6340"
                : hash(x, y, 4) < 0.05
                  ? colors.stone
                  : "#9a7a4e",
      );
    }
  }
  return p;
}

/** A wooden kicker ramp, rising to the right. */
export function ramp(w: number, h: number): Pixels {
  const p = new Pixels(w, h);
  for (let x = 0; x < w; x++) {
    const top = Math.round(h - 1 - (x / (w - 1)) * (h - 1));
    for (let y = top; y < h; y++) {
      p.set(
        x,
        y,
        y === top
          ? colors.woodLight
          : x === w - 1
            ? colors.woodDark
            : (x + y) % 5 === 0
              ? colors.woodDark
              : colors.wood,
      );
    }
  }
  return p;
}

/** A loop on two posts. */
export function loop(r: number): Pixels {
  const p = new Pixels(r * 2 + 6, r * 2 + 8);
  ellipse(p, r + 3, r + 2, r, r + 1, (_x, _y, nx, ny) => {
    const d = nx * nx + ny * ny;
    if (d < 0.66) return undefined;
    if (d > 0.9) return colors.woodDark;
    return ny < 0 ? colors.woodLight : colors.wood;
  });
  line(p, r - 3, r * 2 + 1, r - 6, r * 2 + 7, colors.woodDark);
  line(p, r + 9, r * 2 + 1, r + 12, r * 2 + 7, colors.woodDark);
  return p;
}

/** A rounded gravestone, where somebody got furthest. */
export function gravestone(): Pixels {
  const p = new Pixels(9, 11);
  p.rows(
    [
      "..LLLL...",
      ".LLssss..",
      "LLsssssd.",
      "Lsskkssd.",
      "Lsssssd..",
      "Lsskksd..",
      "Lsssssd..",
      "Lssssdd..",
      "gggggggg.",
    ],
    {
      L: colors.stoneLight,
      s: colors.stone,
      d: colors.stoneDark,
      k: colors.mortar,
      g: "#3f8624",
    },
    0,
    1,
  );
  return p;
}

/** A chequered goal flag. */
export function goalFlag(): Pixels {
  const p = new Pixels(10, 18);
  for (let y = 0; y < 18; y++) p.set(0, y, ink);
  for (let y = 1; y < 7; y++) {
    for (let x = 1; x < 10; x++) {
      p.set(
        x,
        y,
        (Math.floor(x / 2) + Math.floor((y - 1) / 2)) % 2 ? ink : colors.white,
      );
    }
  }
  return p;
}

/* ---------- Car Drive ---------- */

/**
 * A car from above, 9 × 13 pixels, nose up. Blinking lights the indicators
 * on one side in orange.
 */
export function car(
  body: string,
  options: { blink?: "left" | "right"; stripes?: boolean } = {},
): Pixels {
  const p = new Pixels(9, 13);
  p.rows(
    [
      "..yBBBy..",
      ".BBBBBBB.",
      "kBLBBBBBk",
      "kBWWWWWBk",
      ".BWWWWWB.",
      ".BRRRRRB.",
      ".BRRRRRB.",
      ".BRRRRRB.",
      ".BwwwwwB.",
      "kBBBBBBBk",
      "kBBBBBBBk",
      ".rBBBBBr.",
    ],
    {
      y: "#fff4c2",
      B: body,
      L: darken(body, 1.2),
      W: "#2a3a4a",
      w: "#3d5266",
      R: darken(body, 1.12),
      r: "#d1382a",
      k: ink,
    },
    0,
    0,
  );
  if (options.stripes) {
    for (const y of [0, 1, 2, 5, 6, 7, 9, 10]) {
      p.set(3, y, colors.white);
      p.set(5, y, colors.white);
    }
  }
  if (options.blink) {
    const x = options.blink === "left" ? 0 : 8;
    p.set(x, 1, "#ff9f1c");
    p.set(x, 10, "#ff9f1c");
  }
  for (let x = 1; x < 9; x++) p.set(x, 12, "rgba(0, 0, 0, 0.3)");
  return p;
}

/** The same car with its nose down, for oncoming traffic. */
export function flipped(p: Pixels): Pixels {
  const out = new Pixels(p.width, p.height);
  for (let y = 0; y < p.height - 1; y++) {
    for (let x = 0; x < p.width; x++) {
      const color = p.get(x, y);
      if (color) out.set(x, p.height - 2 - y, color);
    }
  }
  for (let x = 1; x < p.width; x++)
    out.set(x, p.height - 1, "rgba(0, 0, 0, 0.3)");
  return out;
}

/** A truck from above, cab up, 11 × 24 pixels. */
export function truck(cab = "#2f6690"): Pixels {
  const p = new Pixels(11, 24);
  p.rows(
    [
      "..yCCCCCy..",
      ".CCCCCCCCC.",
      "kCWWWWWWWCk",
      ".CWWWWWWWC.",
      ".CCCCCCCCC.",
      "...kkkkk...",
    ],
    { y: "#fff4c2", C: cab, W: "#2a3a4a", k: ink },
  );
  for (let y = 6; y < 23; y++) {
    for (let x = 0; x < 11; x++) {
      const edge = x === 0 || x === 10 || y === 6 || y === 22;
      p.set(x, y, edge ? "#8a939b" : x % 3 === 0 ? "#cfd5da" : "#e6eaee");
    }
    if (y % 6 === 2) {
      p.set(0, y, ink);
      p.set(10, y, ink);
    }
  }
  p.set(1, 22, "#d1382a");
  p.set(9, 22, "#d1382a");
  for (let x = 1; x < 11; x++) p.set(x, 23, "rgba(0, 0, 0, 0.3)");
  return p;
}

/** A heart, full or empty. */
export function heart(full = true): Pixels {
  const p = new Pixels(7, 6);
  p.rows([".hh.hh.", "hHhhhhh", "hhhhhhh", ".hhhhh.", "..hhh..", "...h..."], {
    h: full ? "#d1382a" : "#4a3a3a",
    H: full ? "#ffb3a8" : "#6a5a5a",
  });
  return p;
}

/** A shield pickup. */
export function shieldPickup(): Pixels {
  const p = new Pixels(7, 8);
  p.rows(
    [
      "ooooooo",
      "oBBWBBo",
      "oBBWBBo",
      "oWWWWWo",
      "oBBWBBo",
      ".oBWBo.",
      "..oBo..",
      "...o...",
    ],
    {
      o: ink,
      B: "#2f6690",
      W: "#e6eaee",
    },
  );
  return p;
}

/** Boost flames behind a car driving up. */
export function exhaust(frame: 0 | 1): Pixels {
  const p = new Pixels(9, 7);
  p.rows(
    frame
      ? [
          ".WY...YW.",
          ".Yy...yY.",
          "..y...y..",
          "..o...o..",
          ".........",
          ".........",
        ]
      : [
          ".WY...YW.",
          ".YY...YY.",
          ".yy...yy.",
          "..o...o..",
          "..o...o..",
          ".........",
        ],
    { W: "#fff4c2", Y: colors.yolk, y: "#f4a63a", o: "#e8735f" },
  );
  return p;
}

/** A road with three lanes, seen from above, running up and down. */
export function road(
  width: number,
  height: number,
  lane: number,
  offset = 0,
): Pixels {
  const p = new Pixels(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const edge = x === 0 || x === width - 1;
      const kerb = x === 1 || x === width - 2;
      const divider = (x === lane || x === lane * 2) && (y + offset) % 8 < 4;
      p.set(
        x,
        y,
        edge
          ? "#3a3833"
          : kerb
            ? (y + offset) % 6 < 3
              ? "#d1382a"
              : colors.white
            : divider
              ? colors.white
              : hash(x, y + offset, 2) < 0.06
                ? "#6a6760"
                : "#5d5a55",
      );
    }
  }
  return p;
}

/** A garage where the coins buy other cars, colours, tyres and engines. */
export function garage(): Pixels {
  return house({
    w: 30,
    d: 10,
    h: 12,
    roofH: 5,
    roof: "slate",
    wall: "brick",
    windows: [24],
    gate: { u: 4, w: 16, color: colors.stone },
    chimney: 25,
  }).pixels;
}
