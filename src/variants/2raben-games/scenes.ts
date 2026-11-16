/**
 * Static pixel pictures, composed from the sprites in pixels.ts and rendered
 * as SVG by PixelArt.astro. Each returns its runs and its size in pixels.
 */
import {
  bubbleRuns,
  car,
  cloud,
  cloudSmall,
  composeBackdrop,
  formation,
  layer,
  motorbike,
  palette,
  ravenFlyDown,
  ravenFlyUp,
  ravenKrah,
  ravenSit,
  ravenTop,
  recolor,
  scarf,
  spriteRuns,
  type Run,
} from "./pixels";

export interface Picture {
  runs: Run[];
  w: number;
  h: number;
}

/** The raven stage without script: the two ravens in formation over the scenery. */
export function stageStill(w = 280, h = 144): Picture {
  const backdrop = composeBackdrop(w, h);
  const [top, bottom] = formation(w, h);
  return {
    w,
    h,
    runs: [
      ...backdrop.runs,
      ...backdrop.props.flatMap((p) => spriteRuns(p.sprite, p.x, p.y)),
      ...backdrop.clouds.flatMap((c) =>
        spriteRuns(c.small ? cloudSmall : cloud, c.x, c.y),
      ),
      ...spriteRuns(ravenFlyUp, top.x - 10, top.y - 14),
      ...spriteRuns(
        layer(ravenFlyDown, scarf.flyDown),
        bottom.x - 10,
        bottom.y - 14,
      ),
    ],
  };
}

/**
 * The header crest: two ravens flying one above the other, as in the coat of
 * arms, the lower one with its scarf. Frame 0 and 1 flap in turn.
 */
export function crest(frame: 0 | 1): Picture {
  const [a, b] = frame
    ? [ravenFlyDown, ravenFlyUp]
    : [ravenFlyUp, ravenFlyDown];
  const sb = frame ? scarf.flyUp : scarf.flyDown;
  return {
    w: 24,
    h: 30,
    runs: [...spriteRuns(a, 0, 0), ...spriteRuns(layer(b, sb), 4, 16)],
  };
}

/** Two sitting ravens facing each other, the second with its scarf. */
export function pair(): Picture {
  return {
    w: 36,
    h: 14,
    runs: [
      ...spriteRuns(ravenSit, 0, 0),
      ...spriteRuns(layer(ravenSit, scarf.sit), 20, 0, true),
    ],
  };
}

/** One raven, sitting, with or without scarf; for the comment on a game page. */
export function speaker(withScarf: boolean): Picture {
  return {
    w: 16,
    h: 14,
    runs: spriteRuns(withScarf ? layer(ravenKrah, scarf.krah) : ravenKrah),
  };
}

/** About page: the two ravens on the ground, one of them calls. */
export function aboutPicture(): Picture {
  const w = 64;
  const h = 34;
  return {
    w,
    h,
    runs: [
      { x: 0, y: 0, w, h, color: "#cdeaf9" },
      { x: 0, y: h - 6, w, h: 2, color: palette.G },
      { x: 0, y: h - 4, w, h: 4, color: palette.H },
      ...spriteRuns(ravenSit, 14, h - 6 - 14),
      ...spriteRuns(layer(ravenKrah, scarf.krah), 34, h - 6 - 14, true),
      ...bubbleRuns("Krah!", 30, 2, 8),
    ],
  };
}

/** Moto Devil: a raven in a dive, the documented guest role, above a rider on a ramp. */
export function motoVignette(): Picture {
  const w = 64;
  const h = 44;
  const ground = h - 8;
  const runs: Run[] = [
    { x: 0, y: 0, w, h: 14, color: "#93cff3" },
    { x: 0, y: 14, w, h: ground - 14, color: "#b0ddf6" },
    { x: 0, y: ground, w, h: 2, color: palette.G },
    { x: 0, y: ground + 2, w, h: h - ground - 2, color: palette.t },
  ];
  // A ramp in steps, rising to the right.
  for (let i = 0; i < 10; i++) {
    runs.push({
      x: 36 + i * 2,
      y: ground - 1 - i,
      w: 28 - i * 2,
      h: 1 + i,
      color: palette.e,
    });
  }
  runs.push(...spriteRuns(motorbike, 8, ground - 14));
  // Speed lines behind the raven, in steps.
  for (let i = 0; i < 4; i++) {
    runs.push({ x: 52 + i * 3, y: 3 + i * 2, w: 3, h: 1, color: palette.w });
  }
  runs.push(...spriteRuns(ravenFlyUp, 32, 2, true));
  runs.push(...bubbleRuns("!", 20, 4, 2));
  return { w, h, runs };
}

/** Car Drive: three lanes from above, and a raven who has the same view. */
export function carVignette(): Picture {
  const w = 64;
  const h = 44;
  const road = { x: 14, w: 36 };
  const runs: Run[] = [
    { x: 0, y: 0, w, h, color: palette.H },
    { x: road.x, y: 0, w: road.w, h, color: palette.a },
    { x: road.x, y: 0, w: 1, h, color: palette.w },
    { x: road.x + road.w - 1, y: 0, w: 1, h, color: palette.w },
  ];
  for (const lane of [1, 2]) {
    const x = road.x + Math.round((road.w / 3) * lane);
    for (let y = 1; y < h; y += 6)
      runs.push({ x, y, w: 1, h: 3, color: palette.e });
  }
  const laneX = (lane: number) =>
    road.x + Math.round((road.w / 3) * (lane + 0.5)) - 4;
  runs.push(...spriteRuns(recolor(car, { s: "r" }), laneX(1), 26));
  runs.push(...spriteRuns(car, laneX(0), 8));
  runs.push(
    ...spriteRuns(recolor([...car].reverse(), { s: "G" }), laneX(2), 2),
  );
  // The raven's shadow on the road, then the raven above it.
  runs.push(
    ...spriteRuns(ravenTop, 30, 18).map((r) => ({ ...r, color: palette.A })),
  );
  runs.push(...spriteRuns(ravenTop, 26, 13));
  // Grass details.
  for (let y = 3; y < h; y += 7) {
    runs.push({ x: 4 + (y % 5), y, w: 2, h: 1, color: palette.G });
    runs.push({ x: 56 + (y % 4), y: y + 3, w: 2, h: 1, color: palette.G });
  }
  return { w, h, runs };
}

/** Small icons for the game modules. */
export const icons: Record<"moto" | "car", Picture> = {
  moto: { w: 20, h: 14, runs: spriteRuns(motorbike) },
  car: { w: 8, h: 13, runs: spriteRuns(recolor(car, { s: "r" })) },
};
