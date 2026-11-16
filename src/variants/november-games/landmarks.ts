/** Original drawings, shared by Canvas and the no-script SVG. */
import { panoramaLayers, panoramaPerDegree } from "./panorama";

export interface LandmarkShape {
  d: string;
  fill: string;
  stroke: string;
  width: number;
  /** Neon glow radius in CSS pixels; omitted for unlit detail lines. */
  glow?: number;
}

const pink = "#ff5fd2";
const violet = "#b967ff";
const cyan = "#3cf2ff";
const amber = "#ffc46b";
const roofRed = "#ff4f8b";

/*
 * Scene units: the vanishing point of the neon floor (and the sun) is the
 * origin, x grows to the right and y downwards; one unit is one CSS pixel at
 * the reference scale (a 1440 px wide desktop). Every drawing uses them.
 *
 * The monastery is a simplified 3D model of the west front of Kloster
 * Einsiedeln, seen from the north-west as from the Klosterplatz: the north
 * wing is near and large on the left, and the front recedes past the twin
 * towers towards the vanishing point. Metres: X right, Y up, Z depth.
 */
export const eyeHeight = 13;
export const focal = 550;
const front = -40;

type Point = [number, number, number];

/**
 * A camera on the ground plane at eye height: position in metres and heading
 * in radians (0 looks along +Z, positive turns right). Scene units are
 * measured from the point straight ahead on the horizon.
 */
export interface View {
  x: number;
  z: number;
  yaw: number;
}
const standing: View = { x: 0, z: 0, yaw: 0 };
let view = standing;

/** Camera coordinates of a world point: [right, up, ahead]. */
export function toCamera(camera: View, [x, y, z]: Point): Point {
  const dx = x - camera.x;
  const dz = z - camera.z;
  const cos = Math.cos(camera.yaw);
  const sin = Math.sin(camera.yaw);
  return [dx * cos - dz * sin, y, dx * sin + dz * cos];
}

function project(point: Point) {
  const [x, y, z] = toCamera(view, point);
  return [(focal * x) / z, (focal * (eyeHeight - y)) / z];
}

/** Whether the outside of a wall plane faces the camera (see `at`). */
const facing = (axis: "x" | "z", plane: number) =>
  axis === "z" ? view.x > plane : view.z < plane;

// Turning left orbits around the church front, as in a 3D map, so that the
// west front is seen more and more from the front; turning right only turns.
const pivot = [front + 5, 114] as const;
const orbitGain = 1.5;

/** The camera for a view turned by `degrees` (negative: left). */
export function viewFor(degrees: number): View {
  const orbit = (Math.min(0, degrees) * orbitGain * Math.PI) / 180;
  const yaw = orbit + (Math.max(0, degrees) * Math.PI) / 180;
  const [dx, dz] = [-pivot[0], -pivot[1]];
  return {
    x: pivot[0] + dx * Math.cos(orbit) + dz * Math.sin(orbit),
    z: pivot[1] - dx * Math.sin(orbit) + dz * Math.cos(orbit),
    yaw,
  };
}

const fixed = (n: number) => n.toFixed(1);

function path(points: Point[], closed = true) {
  const d = points
    .map((point, i) => {
      const [x, y] = project(point);
      return `${i ? "L" : "M"}${fixed(x)} ${fixed(y)}`;
    })
    .join("");
  return closed ? `${d}Z` : d;
}

/** A rectangle in the plane x = const, seen from the right (+X). */
const side = (x: number, z0: number, z1: number, y0: number, y1: number) =>
  facing("z", x)
    ? path([
        [x, y0, z0],
        [x, y1, z0],
        [x, y1, z1],
        [x, y0, z1],
      ])
    : "";

/** A rectangle in the plane z = const, facing the viewer (-Z). */
const face = (z: number, x0: number, x1: number, y0: number, y1: number) =>
  facing("x", z)
    ? path([
        [x0, y0, z],
        [x0, y1, z],
        [x1, y1, z],
        [x1, y0, z],
      ])
    : "";

/** A point in a side plane (axis "z", x fixed) or a facing plane (axis "x"). */
const at = (axis: "x" | "z", plane: number, u: number, y: number): Point =>
  axis === "z" ? [plane, y, u] : [u, y, plane];

/** An arched opening between u = from and u = to. */
function arch(
  axis: "x" | "z",
  plane: number,
  from: number,
  to: number,
  y0: number,
  y1: number,
) {
  if (!facing(axis, plane)) return "";
  const radius = (to - from) / 2;
  const points: Point[] = [
    at(axis, plane, from, y0),
    at(axis, plane, from, y1 - radius),
  ];
  for (let i = 1; i < 8; i++) {
    const angle = Math.PI - (i * Math.PI) / 8;
    points.push(
      at(
        axis,
        plane,
        from + radius + Math.cos(angle) * radius,
        y1 - radius + Math.sin(angle) * radius,
      ),
    );
  }
  points.push(at(axis, plane, to, y1 - radius), at(axis, plane, to, y0));
  return path(points);
}

/** A clock face with its hands. */
function clock(
  axis: "x" | "z",
  plane: number,
  u: number,
  y: number,
  r: number,
) {
  if (!facing(axis, plane)) return "";
  const rim = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    return at(axis, plane, u + Math.cos(angle) * r, y + Math.sin(angle) * r);
  });
  return (
    path(rim) +
    path(
      [
        at(axis, plane, u, y + r * 0.7),
        at(axis, plane, u, y),
        at(axis, plane, u + r * 0.5, y - r * 0.2),
      ],
      false,
    )
  );
}

const line = (from: Point, to: Point) => path([from, to], false);

let shapes: LandmarkShape[] = [];
const add = (
  d: string,
  fill: string,
  stroke: string,
  width: number,
  glow?: number,
) => shapes.push({ d, fill, stroke, width, glow });

/** A wing: wall, window rows with pediments, string courses, roof, dormers. */
function wing(
  x: number,
  z0: number,
  z1: number,
  options: { eave: number; ridge: number; seed: number; nearEnd?: boolean },
) {
  const { eave, ridge, seed } = options;
  const depth = 16;
  if (options.nearEnd)
    add(face(z0, x - depth, x, 0, eave), "#160c2e", pink, 1.6, 8);
  add(side(x, z0, z1, 0, eave), "#1b1036", pink, 2, 10);
  const rows = [
    { y0: 2.2, y1: 6, arched: true, pediment: false },
    { y0: 7.8, y1: 11.2, arched: false, pediment: true },
    { y0: 12.6, y1: 15.6, arched: false, pediment: false },
    { y0: 16.8, y1: 18.4, arched: false, pediment: false },
  ].filter((row) => row.y1 < eave - 0.4);
  const dark: string[] = [];
  const lit: string[] = [];
  const warm: string[] = [];
  const pediments: string[] = [];
  const count = Math.floor((z1 - z0 - 1.6) / 3.4);
  const startZ = z0 + (z1 - z0 - (count - 1) * 3.4 - 1.5) / 2;
  rows.forEach((row, r) => {
    for (let c = 0; c < count; c++) {
      const za = startZ + c * 3.4;
      const zb = za + 1.5;
      const d = row.arched
        ? arch("z", x + 0.05, za, zb, row.y0, row.y1)
        : side(x + 0.05, za, zb, row.y0, row.y1);
      const pattern = (c * 7 + r * 5 + seed) % 9;
      if (pattern === 0 || pattern === 4) lit.push(d);
      else if (pattern === 7) warm.push(d);
      else dark.push(d);
      if (row.pediment)
        pediments.push(
          path(
            [
              [x + 0.1, row.y1 + 0.3, za - 0.3],
              [x + 0.1, row.y1 + 1.2, (za + zb) / 2],
              [x + 0.1, row.y1 + 0.3, zb + 0.3],
            ],
            false,
          ),
        );
    }
  });
  add(dark.join(""), "#0a0c26", "#3cf2ffb3", 1.1, 3);
  add(lit.join(""), "#ff8ae2", "#ffd3f4", 1.1, 12);
  add(warm.join(""), "#ffb35c", "#ffe0a8", 1.1, 12);
  add(pediments.join(""), "none", "#ff9ee6", 1);
  add(
    [7, 12, 16.2]
      .filter((y) => y < eave)
      .map((y) => line([x + 0.1, y, z0], [x + 0.1, y, z1]))
      .join(""),
    "none",
    "#9a5fe0",
    1.2,
  );
  // Hipped roof: whichever hip end faces the camera, then the front slope.
  const back = x - depth / 2;
  const hip = depth / 2;
  const tilt = (hip * (eave - eyeHeight)) / (ridge - eave);
  for (const [end, inward] of [
    [z0, 1],
    [z1, -1],
  ]) {
    if (inward * (end - view.z) <= tilt) continue;
    add(
      path([
        [x + 0.6, eave, end],
        [x - depth, eave, end],
        [back, ridge, end + inward * hip],
      ]),
      "#3a1240",
      roofRed,
      1.8,
      8,
    );
  }
  add(
    path([
      [x + 0.6, eave, z0],
      [back, ridge, z0 + hip],
      [back, ridge, z1 - hip],
      [x + 0.6, eave, z1],
    ]),
    "#4a1546",
    roofRed,
    2,
    10,
  );
  const dormers: string[] = [];
  for (let z = z0 + hip + 1; z < z1 - hip - 2; z += 6.8) {
    const dx = x - 2.6;
    dormers.push(
      side(dx, z, z + 1.6, eave + 1.2, eave + 3.2) +
        path(
          [
            [dx, eave + 3.2, z - 0.3],
            [dx, eave + 4.2, z + 0.8],
            [dx, eave + 3.2, z + 1.9],
          ],
          false,
        ),
    );
  }
  add(dormers.join(""), "#241338", "#ff8ab8", 1.1, 4);
}

/** One of the twin towers: square body, belfry, onion dome and lantern. */
function tower(z0: number, dim: boolean) {
  const x0 = front - 6;
  const x1 = front + 3;
  const z1 = z0 + 9;
  const mid = (x0 + x1) / 2;
  const edge = dim ? violet : pink;
  const glass = dim ? "#8a6fe0" : cyan;
  const fill = dim ? "#1a0f34" : "#22133f";
  const glow = dim ? 5 : 10;
  add(face(z0, x0, x1, 0, 31), fill, edge, 2, glow);
  add(side(x1, z0, z1, 0, 31), "#1d1039", edge, 2, glow);
  add(face(z0 + 0.8, x0 + 0.8, x1 - 0.8, 31, 41), fill, edge, 1.8, glow);
  add(side(x1 - 0.8, z0 + 0.8, z1 - 0.8, 31, 41), "#1d1039", edge, 1.8, glow);
  add(
    [12, 22, 31, 41]
      .map((y) =>
        path(
          [
            [x0 - 0.4, y, z0 - 0.4],
            [x1 + 0.4, y, z0 - 0.4],
            [x1 + 0.4, y, z1 + 0.4],
          ],
          false,
        ),
      )
      .join("") +
      line([x0 + 1, 0, z0], [x0 + 1, 31, z0]) +
      line([x1 - 1, 0, z0], [x1 - 1, 31, z0]) +
      line([x1, 0, z1 - 1], [x1, 31, z1 - 1]),
    "none",
    "#c189ff",
    1.3,
  );
  add(
    [
      arch("x", z0 - 0.05, mid - 1, mid + 1, 3, 8),
      arch("x", z0 - 0.05, mid - 1, mid + 1, 14, 19.5),
      arch("z", x1 + 0.05, z0 + 3.5, z0 + 5.5, 3, 8),
      arch("z", x1 + 0.05, z0 + 3.5, z0 + 5.5, 14, 19.5),
      arch("x", z0 + 0.75, x0 + 2, x0 + 3.8, 33, 38.5),
      arch("x", z0 + 0.75, x1 - 3.8, x1 - 2, 33, 38.5),
      arch("z", x1 - 0.75, z0 + 2.2, z0 + 4, 33, 38.5),
      arch("z", x1 - 0.75, z1 - 4, z1 - 2.2, 33, 38.5),
    ].join(""),
    "#070818",
    glass,
    1.3,
    dim ? 0 : 8,
  );
  add(
    clock("x", z0 - 0.1, mid, 26.5, 2) +
      clock("z", x1 + 0.1, z0 + 4.5, 26.5, 2),
    "#132240",
    amber,
    1.6,
    dim ? 0 : 10,
  );
  // The onion dome is round, so its outline is the same from every side.
  const z = z0 + 4.5;
  const [cx] = project([mid, 0, z]);
  const scale = focal / toCamera(view, [mid, 0, z])[2];
  const y = (height: number) => project([mid, height, z])[1];
  const outline = (rings: [number, number][]) => {
    const right = rings.map(([h, r]) => [cx + r * scale, y(h)]);
    const left = rings.map(([h, r]) => [cx - r * scale, y(h)]).reverse();
    return `M${[...right, ...left].map(([px, py]) => `${fixed(px)} ${fixed(py)}`).join("L")}Z`;
  };
  add(
    outline([
      [41, 4],
      [42.6, 4.6],
      [44.2, 4.4],
      [46, 3],
      [47.4, 1.2],
      [48.4, 0.8],
    ]) +
      outline([
        [48.4, 1],
        [51.2, 1],
        [51.6, 1.3],
        [52.6, 1],
        [53.6, 0.2],
      ]),
    dim ? "#123048" : "#0f3f52",
    glass,
    2,
    dim ? 5 : 12,
  );
  const top = y(48.4);
  const base = y(41);
  const middle = (top + base) / 2;
  add(
    `M${fixed(cx)} ${fixed(top)}L${fixed(cx)} ${fixed(base)}` +
      `M${fixed(cx - 1.6 * scale)} ${fixed(base)}Q${fixed(cx - 2.6 * scale)} ${fixed(middle)} ${fixed(cx)} ${fixed(top)}` +
      `M${fixed(cx + 1.6 * scale)} ${fixed(base)}Q${fixed(cx + 2.6 * scale)} ${fixed(middle)} ${fixed(cx)} ${fixed(top)}`,
    "none",
    dim ? "#5a7fc0" : "#9ff8ffaa",
    1.1,
  );
  add(
    `M${fixed(cx)} ${fixed(y(53.6))}L${fixed(cx)} ${fixed(y(56.4))}` +
      `M${fixed(cx - 0.8 * scale)} ${fixed(y(55.4))}L${fixed(cx + 0.8 * scale)} ${fixed(y(55.4))}`,
    "none",
    amber,
    1.6,
    dim ? 0 : 10,
  );
}

/** The convex centre of the west front between the towers, with the nave behind. */
function church() {
  add(
    path([
      [front - 2, 26, 104],
      [front - 140, 26, 104],
      [front - 140, 35, 114],
      [front - 2, 35, 114],
    ]),
    "#3d1240",
    roofRed,
    1.8,
    8,
  );
  const x = front + 5;
  const gable = Array.from({ length: 13 }, (_, i): Point => {
    const t = i / 12;
    return [x, 26 + Math.sin(t * Math.PI) * 6.5, 104 + t * 20];
  });
  add(face(104, front - 1, x, 0, 26), "#170c30", pink, 1.6, 6);
  add(path([[x, 0, 104], ...gable, [x, 0, 124]]), "#211241", pink, 2, 10);
  add(
    [
      arch("z", x + 0.05, 112, 116, 0, 8),
      arch("z", x + 0.05, 108, 110.5, 10, 15),
      arch("z", x + 0.05, 117.5, 120, 10, 15),
      arch("z", x + 0.05, 112.5, 115.5, 11, 18),
    ].join(""),
    "#070818",
    cyan,
    1.4,
    8,
  );
  add(
    line([x + 0.1, 9, 104], [x + 0.1, 9, 124]) +
      line([x + 0.1, 26, 104], [x + 0.1, 26, 124]) +
      [106, 110.8, 117.2, 122]
        .map((z) => line([x + 0.1, 0, z], [x + 0.1, 26, z]))
        .join(""),
    "none",
    "#c189ff",
    1.2,
  );
  add(
    clock("z", x + 0.1, 114, 22, 1.4) +
      line([x + 0.2, 32.5, 114], [x + 0.2, 35.5, 114]),
    "#132240",
    amber,
    1.6,
    10,
  );
}

/**
 * The monastery as seen by `camera`. The painting order, from the south end
 * towards the north-west corner, holds while the camera stays north of the
 * towers, as every view from viewFor() does.
 */
export function monasteryFrom(camera: View) {
  view = camera;
  shapes = [];
  wing(front, 134, 192, { eave: 19, ridge: 27, seed: 3 });
  tower(124, true);
  church();
  tower(95, false);
  wing(front, 44, 95, { eave: 19, ridge: 27, seed: 0 });
  // The north-west corner pavilion stands forward a little and rises higher.
  wing(front + 1.5, 30, 44, { eave: 21, ridge: 30, seed: 5, nearEnd: true });
  view = standing;
  return shapes;
}

export const monastery = monasteryFrom(standing);

/**
 * The Alp on the floor, a meandering path in metres on the ground plane. It
 * leaves the Alptal far away (t = 0), where a standing viewer sees it at
 * scene x `valleyX`, and passes to the right of that viewer (t = 1).
 */
export function riverPoint(t: number, valleyX: number): Point {
  const far = 2600;
  const near = 16;
  const z = far * (near / far) ** t;
  const x =
    (valleyX / focal) * z * (1 - t) ** 2 +
    20 * t ** 1.5 +
    Math.sin(t * Math.PI * 4.2 + 0.6) * 14 * t ** 0.8;
  return [x, 0, z];
}

/** Half the river's width in metres. */
export const riverHalf = 3;

/** The river as seen by a standing viewer. */
export function riverAt(t: number, valleyX: number) {
  const point = riverPoint(t, valleyX);
  const [sx, sy] = project(point);
  return { x: sx, y: sy, half: (focal * riverHalf) / point[2] };
}

/** A closed ribbon path for the river in scene units. */
export function riverPath(valleyX: number, steps = 60) {
  const points = Array.from({ length: steps + 1 }, (_, i) =>
    riverAt(i / steps, valleyX),
  );
  const left = points.map((p) => `${fixed(p.x - p.half)} ${fixed(p.y)}`);
  const right = points
    .map((p) => `${fixed(p.x + p.half)} ${fixed(p.y)}`)
    .reverse();
  return `M${left.join("L")}L${right.join("L")}Z`;
}

/**
 * The real skyline from Einsiedeln (panorama.ts), far bands first: paler and
 * hazier in the distance, darker and brighter-edged nearby.
 */
const ridgeStyle = [
  { fill: "#2a1450", stroke: "#8f6ae0", width: 1.2, glow: 6 },
  { fill: "#231040", stroke: pink, width: 2.4, glow: 14 },
  { fill: "#1a0c33", stroke: "#d36cf0", width: 1.8, glow: 10 },
  { fill: "#120926", stroke: "#7a4fd0", width: 1.6, glow: 8 },
];
// The young Alp tumbles from below Grosser Mythen down the Alptal (drawn freely).
const alpStream = "M292 -82Q268 -66 284 -52T252 -32T206 -14T150 -1";
export const ridges: LandmarkShape[] = [
  ...panoramaLayers.map((d, i) => ({ d, ...ridgeStyle[i] })),
  { d: alpStream, fill: "none", stroke: "#3cf2ff4d", width: 6 },
  { d: alpStream, fill: "none", stroke: "#9ff8ff", width: 2, glow: 12 },
];

/** Scene x where the Alp leaves the Alptal below the Mythen (heading 201°). */
export const valleyX = 3.5 * panoramaPerDegree;

export const labelText = (peak: { name: string; height: number }) =>
  `${peak.name.toUpperCase()} ${peak.height} m`;

/**
 * Stacks mountain inscriptions in rows above their summits so that neither
 * texts nor leader lines overlap. Input and output use the same units.
 */
export function layoutLabels<T extends { x: number; y: number; width: number }>(
  labels: T[],
  rowHeight = 15,
  gap = 22,
) {
  const placed: (T & { baseline: number })[] = [];
  for (const label of [...labels].sort((a, b) => a.y - b.y)) {
    for (let row = 0; row < 6; row++) {
      const baseline = label.y - gap - row * rowHeight;
      const left = label.x - label.width / 2 - 6;
      const right = label.x + label.width / 2 + 6;
      const clash = placed.some((other) => {
        const otherLeft = other.x - other.width / 2 - 6;
        const otherRight = other.x + other.width / 2 + 6;
        const textsMeet =
          left < otherRight &&
          right > otherLeft &&
          Math.abs(baseline - other.baseline) < rowHeight;
        const crossesLeader =
          other.x > left &&
          other.x < right &&
          baseline - 12 < other.y &&
          baseline > other.baseline;
        const leaderCrosses =
          label.x > otherLeft &&
          label.x < otherRight &&
          other.baseline - 12 < label.y &&
          other.baseline > baseline;
        return textsMeet || crossesLeader || leaderCrosses;
      });
      if (!clash) {
        placed.push({ ...label, baseline });
        break;
      }
    }
  }
  return placed;
}

/** Scene placement for a viewport; the SVG fallback mirrors these numbers. */
export function landscapeLayout(width: number, height: number) {
  const narrow = width < 760;
  const horizon = height * 0.7;
  // Degrees of view are drawn large: a tele view that keeps the Mythen big.
  const perDegree = narrow ? width / 16 : Math.min(width / 34.3, height / 20);
  return {
    narrow,
    horizon,
    perDegree,
    scale: perDegree / 42,
    vanishX: width * (narrow ? 0.38 : 0.6),
    sunY: horizon - height * (narrow ? 0.4 : 0.38),
    sunRadius:
      Math.min(width * (narrow ? 0.7 : 0.45), height * (narrow ? 0.4 : 0.5)) *
      0.42,
  };
}
