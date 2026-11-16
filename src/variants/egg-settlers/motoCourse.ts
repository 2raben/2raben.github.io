/**
 * The layout of Moto Devil's practice course, shared by MotoPractice.astro,
 * which draws it, and motoPractice.ts, which rides it. In pixels.
 */
export const course = {
  width: 240,
  height: 96,
  /** The y of the ground's surface. */
  ground: 78,
  start: 18,
  rampStart: 46,
  rampEnd: 74,
  rampHeight: 13,
  /** Passing this x makes the spikes shoot out of the ground. */
  spikeTrigger: 100,
  spikeFrom: 118,
  spikeTo: 138,
  /** The goal flag, and how far it drives away when the bike comes close. */
  goal: 196,
  goalRun: 30,
};
