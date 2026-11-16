/**
 * The layout of Car Drive's practice road, shared by CarPractice.astro, which
 * draws it, and carPractice.ts, which drives it. In pixels.
 */
export const road = {
  width: 200,
  height: 110,
  roadX: 81,
  roadWidth: 38,
  /** Width of one of the three lanes. */
  lane: 12,
  /** The top of the player's car. */
  playerY: 86,
};

/** The x of a lane's middle, lanes counted 0 to 2 from the left. */
export const laneCenter = (n: number) => road.roadX + 1 + n * road.lane + 6;
