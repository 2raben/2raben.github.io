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

/** Vertical stretch and sideways shift of the drawing being projected (see Pose). */
let rise = 1;
let shiftX = 0;

function project(point: Point) {
  const [x, y, z] = toCamera(view, point);
  return [(focal * x) / z + shiftX, (focal * (eyeHeight - y * rise)) / z];
}

/** Whether the outside of a wall plane faces the camera (see `at`). */
const facing = (axis: "x" | "z", plane: number) =>
  axis === "z" ? view.x > plane : view.z < plane;

/**
 * Where the monastery stands: the middle of the church front in world
 * metres, how far the building is turned (radians, positive: right), how
 * many degrees the view orbits around it per degree turned left, how much
 * taller than measured it is drawn, and optionally the heading (radians)
 * from which it is drawn as if looked at straight on.
 */
export interface Pose {
  x: number;
  z: number;
  turn: number;
  orbit: number;
  rise: number;
  look?: number;
}
const centre = [front + 3, 102.4] as const;
export const homePose: Pose = {
  x: centre[0],
  z: centre[1],
  turn: 0,
  orbit: 1.5,
  rise: 1,
};

/**
 * The camera for a view turned by `degrees` (negative: left). Turning left
 * orbits around the church front by `pose.orbit` times the turn, as in a 3D
 * map, so that the west front is seen more and more from the front; whatever
 * the orbit leaves of the turn, and turning right, only turns the camera.
 */
export function viewFor(degrees: number, pose: Pose = homePose): View {
  const left = Math.min(0, degrees);
  const orbit = (left * pose.orbit * Math.PI) / 180;
  const turn = Math.max(0, degrees) + left * Math.max(0, 1 - pose.orbit);
  // The pivot lies just in front of the church.
  const [px, pz] = [pose.x + 2, pose.z];
  return {
    x: px - px * Math.cos(orbit) - pz * Math.sin(orbit),
    z: pz + px * Math.sin(orbit) - pz * Math.cos(orbit),
    yaw: orbit + (turn * Math.PI) / 180,
  };
}

/** The camera in the monastery's own coordinates for a pose. */
function poseCamera(camera: View, pose: Pose): View {
  const dx = camera.x - pose.x;
  const dz = camera.z - pose.z;
  const cos = Math.cos(pose.turn);
  const sin = Math.sin(pose.turn);
  return {
    x: centre[0] + dx * cos - dz * sin,
    z: centre[1] + dx * sin + dz * cos,
    yaw: camera.yaw - pose.turn,
  };
}

/**
 * A pose that shows the monastery at scene x `target`, about `span` scene
 * units wide: further away, and turned towards the viewer up to `oblique`
 * degrees short of facing it, so that it is still seen from the north-west.
 */
export function poseAt(target: number, span: number, oblique = 45): Pose {
  // Close, so that the near (left) tower stands larger than the far one,
  // and the front and its wings overfill `span` a little.
  const distance = (focal * 65) / span;
  const bearing = Math.atan(target / focal);
  return {
    x: distance * Math.sin(bearing),
    z: distance * Math.cos(bearing),
    turn: Math.PI / 2 + bearing - (oblique * Math.PI) / 180,
    // Orbiting around the distant monastery would swing the camera across
    // the floor, the river and the ski jumps, so the view only turns, and
    // the monastery moves with it, behind the text if need be.
    orbit: 0,
    // Seen nearly from the front, the long building looks squat.
    rise: 1.15,
    // Far off the centre of the view, a flat projection stretches it
    // sideways by 1 / cos(bearing), about 1.7 times; it is drawn as if
    // looked at, then moved to where its heading lies on the screen.
    look: bearing,
  };
}

const fixed = (n: number) => n.toFixed(1);

function path(points: Point[], closed = true) {
  // Shapes reaching behind the camera are left out rather than distorted.
  if (points.some((point) => toCamera(view, point)[2] < 1)) return "";
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

/** A point on a wall: u runs along it, y up. */
type Surface = (u: number, y: number) => Point;
const wall =
  (axis: "x" | "z", plane: number): Surface =>
  (u, y) =>
    at(axis, plane, u, y);

/** An arched opening between u = from and u = to. */
function archOn(
  surface: Surface,
  from: number,
  to: number,
  y0: number,
  y1: number,
) {
  const radius = (to - from) / 2;
  const points: Point[] = [surface(from, y0), surface(from, y1 - radius)];
  for (let i = 1; i < 8; i++) {
    const angle = Math.PI - (i * Math.PI) / 8;
    points.push(
      surface(
        from + radius + Math.cos(angle) * radius,
        y1 - radius + Math.sin(angle) * radius,
      ),
    );
  }
  points.push(surface(to, y1 - radius), surface(to, y0));
  return path(points);
}

function arch(
  axis: "x" | "z",
  plane: number,
  from: number,
  to: number,
  y0: number,
  y1: number,
) {
  return facing(axis, plane) ? archOn(wall(axis, plane), from, to, y0, y1) : "";
}

/** A round window or a clock's rim. */
function ringOn(surface: Surface, u: number, y: number, r: number, steps = 20) {
  return path(
    Array.from({ length: steps }, (_, i) => {
      const angle = (i / steps) * Math.PI * 2;
      return surface(u + Math.cos(angle) * r, y + Math.sin(angle) * r);
    }),
  );
}

/** The time the clocks show; set by monasteryFrom(). */
export interface ClockTime {
  hours: number;
  minutes: number;
}
let time: ClockTime = { hours: 10, minutes: 10 };

/**
 * A clock face. The main clocks have an hour and a minute hand; the upper
 * ones only a minute hand across the full dial, pointing with its tip.
 */
function clock(
  axis: "x" | "z",
  plane: number,
  u: number,
  y: number,
  r: number,
  hands: "both" | "minute" = "both",
) {
  if (!facing(axis, plane)) return "";
  const surface = wall(axis, plane);
  // u runs to the right on every wall the camera sees, y up.
  const minute = (time.minutes / 60) * Math.PI * 2;
  const hour = (((time.hours % 12) + time.minutes / 60) / 12) * Math.PI * 2;
  const tip = (angle: number, length: number) =>
    surface(u + Math.sin(angle) * length, y + Math.cos(angle) * length);
  if (hands === "minute") {
    const side = minute + Math.PI / 2;
    const at = (along: number, across: number) =>
      surface(
        u + Math.sin(minute) * along + Math.sin(side) * across,
        y + Math.cos(minute) * along + Math.cos(side) * across,
      );
    return (
      ringOn(surface, u, y, r) +
      path([tip(minute + Math.PI, r * 0.92), tip(minute, r * 0.92)], false) +
      path([at(r * 0.6, -r * 0.14), at(r * 0.92, 0), at(r * 0.6, r * 0.14)])
    );
  }
  return (
    ringOn(surface, u, y, r) +
    path([tip(hour, r * 0.5), surface(u, y), tip(minute, r * 0.82)], false)
  );
}

/** A standing figure, `height` tall, on a surface at (u, y). */
function statueOn(surface: Surface, u: number, y: number, height: number) {
  const k = height / 2.8;
  const robe = [
    [-0.6, 0],
    [-0.35, 1.7],
    [-0.5, 2],
    [0, 2.15],
    [0.5, 2],
    [0.35, 1.7],
    [0.6, 0],
  ];
  return (
    path(robe.map(([du, dy]) => surface(u + du * k, y + dy * k))) +
    ringOn(surface, u, y + 2.5 * k, 0.32 * k, 10)
  );
}

const line = (from: Point, to: Point) => path([from, to], false);

/**
 * A dome over a square plan, such as the towers' copper domes: four curved
 * faces that meet in ridges at the corners. `rings` are [height above
 * `base`, half the width] from the bottom up. Returns the faces the camera
 * sees, and their ridges, seams and bands as lines.
 */
function squareDome(
  cx: number,
  cz: number,
  base: number,
  rings: number[][],
  band?: number,
) {
  const w0 = rings[0][1];
  // Each side: outward direction in plan, and whether the camera sees it.
  const sides = [
    { nx: 0, nz: -1, seen: view.z < cz - w0 },
    { nx: 1, nz: 0, seen: view.x > cx + w0 },
    { nx: 0, nz: 1, seen: view.z > cz + w0 },
    { nx: -1, nz: 0, seen: view.x < cx - w0 },
  ].filter((side) => side.seen);
  /** A point on a side at height h; `s` runs from -1 to 1 across it. */
  const on = (side: (typeof sides)[number], h: number, w: number, s: number) =>
    [
      cx + side.nx * w - side.nz * s * w,
      base + h,
      cz + side.nz * w + side.nx * s * w,
    ] as Point;
  const faces = sides
    .map((side) =>
      path([
        ...rings.map(([h, w]) => on(side, h, w, -1)).reverse(),
        ...rings.map(([h, w]) => on(side, h, w, 1)),
      ]),
    )
    .join("");
  const lines = sides
    .map((side) => {
      const ridge = (s: number) =>
        path(
          rings.map(([h, w]) => on(side, h, w, s)),
          false,
        );
      const seams = [-0.5, 0, 0.5].map(ridge).join("");
      const ring =
        band === undefined
          ? ""
          : path(
              [-1, 1].map((s) => on(side, rings[band][0], rings[band][1], s)),
              false,
            );
      return ridge(-1) + ridge(1) + seams + ring;
    })
    .join("");
  return { faces, lines };
}

/** A ball, round from every side. */
function ball(cx: number, y: number, cz: number, r: number) {
  const [px, py] = project([cx, y, cz]);
  const radius = (focal * r) / toCamera(view, [cx, y, cz])[2];
  return `M${Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    return `${fixed(px + Math.cos(angle) * radius)} ${fixed(py + Math.sin(angle) * radius)}`;
  }).join("L")}Z`;
}

let shapes: LandmarkShape[] = [];
const add = (
  d: string,
  fill: string,
  stroke: string,
  width: number,
  glow?: number,
) => {
  if (d) shapes.push({ d, fill, stroke, width, glow });
};

interface Row {
  y0: number;
  y1: number;
  arched?: boolean;
  pediment?: boolean;
}
// Four storeys under the wings' cornice at 16 m, five in the pavilions.
const wingRows: Row[] = [
  { y0: 1.8, y1: 4.6, arched: true },
  { y0: 5.8, y1: 8.8, pediment: true },
  { y0: 9.8, y1: 12.4 },
  { y0: 13.3, y1: 15 },
];
const pavilionRows: Row[] = [...wingRows, { y0: 16.3, y1: 17.9 }];

/**
 * A wing or corner pavilion: wall, window rows with pediments, string
 * courses, a hipped roof with dormers, and on pavilions a small turret.
 */
function wing(
  x: number,
  z0: number,
  z1: number,
  options: {
    eave: number;
    ridge: number;
    seed: number;
    rows: Row[];
    depth?: number;
    nearEnd?: boolean;
    turret?: boolean;
  },
) {
  const { eave, ridge, seed, rows, depth = 16 } = options;
  if (options.nearEnd)
    add(face(z0, x - depth, x, 0, eave), "#160c2e", pink, 1.6, 8);
  add(side(x, z0, z1, 0, eave), "#1b1036", pink, 2, 10);
  const dark: string[] = [];
  const lit: string[] = [];
  const warm: string[] = [];
  const pediments: string[] = [];
  const spacing = 2.9;
  const count = Math.floor((z1 - z0 - 1.6) / spacing);
  const startZ = z0 + (z1 - z0 - (count - 1) * spacing - 1.3) / 2;
  rows.forEach((row, r) => {
    for (let c = 0; c < count; c++) {
      const za = startZ + c * spacing;
      const zb = za + 1.3;
      const d = row.arched
        ? arch("z", x + 0.05, za, zb, row.y0, row.y1 + 0.4)
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
              [x + 0.1, row.y1 + 1.1, (za + zb) / 2],
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
    [5.2, 9.3, 12.85, 15.6, eave - 0.3]
      .filter((y) => y < eave)
      .map((y) => line([x + 0.1, y, z0], [x + 0.1, y, z1]))
      .join(""),
    "none",
    "#9a5fe0",
    1.2,
  );
  // Hipped roof: whichever hip end faces the camera, then the front slope.
  // Short pavilions get a pyramid roof.
  const back = x - depth / 2;
  const mid = (z0 + z1) / 2;
  const hip = Math.min(depth / 2, (z1 - z0) / 2);
  const tilt = (hip * (eave - eyeHeight / rise)) / (ridge - eave);
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
  if (!options.turret) {
    const dormers: string[] = [];
    for (let z = z0 + hip + 1; z < z1 - hip - 2; z += 5.8) {
      const dx = x - 2.6;
      dormers.push(
        side(dx, z, z + 1.4, eave + 1.2, eave + 3) +
          path(
            [
              [dx, eave + 3, z - 0.3],
              [dx, eave + 3.9, z + 0.7],
              [dx, eave + 3, z + 1.7],
            ],
            false,
          ),
      );
    }
    add(dormers.join(""), "#241338", "#ff8ab8", 1.1, 4);
    return;
  }
  // The small lantern turret on top of a pavilion's roof.
  add(
    face(mid - 0.9, back - 0.9, back + 0.9, ridge - 1, ridge + 1.6) +
      side(back + 0.9, mid - 0.9, mid + 0.9, ridge - 1, ridge + 1.6),
    "#241338",
    "#ff8ab8",
    1.2,
    5,
  );
  add(
    squareDome(back, mid, ridge + 1.6, [
      [0, 1.15],
      [0.4, 1.15],
      [0.9, 0.95],
      [1.3, 0.62],
      [1.6, 0.3],
      [1.75, 0.12],
    ]).faces,
    "#0f3f52",
    cyan,
    1.2,
    6,
  );
  add(
    line([back, ridge + 3.4, mid], [back, ridge + 4.6, mid]),
    "none",
    amber,
    1.4,
    8,
  );
}

/**
 * A tower's copper dome after the photographs, [height above its base, half
 * the width]: square like the stage below and as wide, a short upright
 * skirt, then four faces curving in to the lantern.
 */
const domeHalf = 4.05;
const domeRings = [
  [0, domeHalf],
  [0.6, domeHalf],
  ...[0.2, 0.4, 0.55, 0.7, 0.8, 0.88, 0.94, 0.975, 0.992].map((t) => [
    0.6 + 4.9 * t,
    domeHalf * Math.sqrt(1 - t * t),
  ]),
];
/** The small square lantern on top of it, with its cap. */
const lanternRings = [
  [5.4, 0.5],
  [6.3, 0.5],
  [6.45, 0.68],
  [6.6, 0.42],
  [6.7, 0.18],
];

/**
 * One of the twin towers, 10.3 m square: a shaft rising above the roofs, a
 * stage with a tall window, the main clock, the belfry with two arched
 * openings on each side, a small clock under the cornice, then the square
 * copper dome with its lantern, ball and cross.
 */
function tower(z0: number, dim: boolean) {
  const x0 = front - 7.3;
  const x1 = front + 3;
  const z1 = z0 + 10.3;
  const mx = (x0 + x1) / 2;
  const mz = (z0 + z1) / 2;
  const edge = dim ? violet : pink;
  const glass = dim ? "#8a6fe0" : cyan;
  const fill = dim ? "#1a0f34" : "#22133f";
  const glow = dim ? 5 : 10;
  // Stages: from, to and how far each is set back.
  const stages = [
    [0, 22.4, 0],
    [22.4, 36.4, 0.3],
    [36.4, 42.2, 0.6],
    [42.2, 46.2, 1.1],
  ];
  for (const [y0, y1, inset] of stages) {
    add(
      face(z0 + inset, x0 + inset, x1 - inset, y0, y1),
      fill,
      edge,
      1.8,
      glow,
    );
    add(
      side(x1 - inset, z0 + inset, z1 - inset, y0, y1),
      "#1d1039",
      edge,
      1.8,
      glow,
    );
  }
  // Cornices around the two visible sides, and corner pilasters.
  const ledge = (y: number, out: number) =>
    path(
      [
        [x0 - out, y, z0 - out],
        [x1 + out, y, z0 - out],
        [x1 + out, y, z1 + out],
      ],
      false,
    );
  add(
    [ledge(15.9, 0.2), ledge(22.4, 0.3), ledge(31, 0), ledge(36.4, 0)]
      .concat([ledge(42.2, -0.2), ledge(46.2, -0.7)])
      .join("") +
      line([x1 - 0.9, 0, z0], [x1 - 0.9, 22.4, z0]) +
      line([x1, 0, z1 - 0.9], [x1, 22.4, z1 - 0.9]) +
      line([x1 - 1.2, 22.4, z0 + 0.3], [x1 - 1.2, 36.4, z0 + 0.3]) +
      line([x1 - 0.3, 22.4, z1 - 1.2], [x1 - 0.3, 36.4, z1 - 1.2]),
    "none",
    "#c189ff",
    1.3,
  );
  // Windows: the shaft's rows, the tall window, the belfry's openings.
  const windows = (axis: "x" | "z", u: number) => {
    const plane = (inset: number) =>
      axis === "x" ? z0 + inset - 0.05 : x1 - inset + 0.05;
    return (
      wingRows
        .slice(1)
        .map((row) =>
          arch(axis, plane(0), u - 0.7, u + 0.7, row.y0, row.y1 + 0.4),
        )
        .join("") +
      arch(axis, plane(0.3), u - 0.85, u + 0.85, 24.4, 29.6) +
      arch(axis, plane(0.6), u - 2.5, u - 0.6, 37.2, 41.4) +
      arch(axis, plane(0.6), u + 0.6, u + 2.5, 37.2, 41.4)
    );
  };
  add(windows("x", mx) + windows("z", mz), "#070818", glass, 1.3, dim ? 0 : 8);
  add(
    clock("x", z0 + 0.25, mx, 33.6, 1.7) +
      clock("z", x1 - 0.25, mz, 33.6, 1.7) +
      clock("x", z0 + 1.05, mx, 44.2, 1, "minute") +
      clock("z", x1 - 1.05, mz, 44.2, 1, "minute"),
    "#132240",
    amber,
    1.6,
    dim ? 0 : 10,
  );
  // The copper dome, its lantern, the gilded ball and the cross.
  const base = 46.2;
  const copper = dim ? "#123048" : "#0f3f52";
  const dome = squareDome(mx, mz, base, domeRings, 1);
  add(dome.faces, copper, glass, 2, dim ? 5 : 12);
  add(dome.lines, "none", dim ? "#5a7fc0" : "#9ff8ffaa", 1);
  const lantern = squareDome(mx, mz, base, lanternRings);
  add(lantern.faces, copper, glass, 1.6, dim ? 4 : 9);
  add(ball(mx, base + 7.15, mz, 0.45), "#ffc46b", amber, 1, dim ? 0 : 10);
  add(
    line([mx, base + 7.6, mz], [mx, base + 10.2, mz]) +
      line([mx, base + 9.4, mz - 0.6], [mx, base + 9.4, mz + 0.6]),
    "none",
    amber,
    1.6,
    dim ? 0 : 10,
  );
}

/**
 * The convex centre of the west front between the towers: the curved front
 * with its portal, oculus and tall windows, the balustrade, and the attic
 * with the Madonna's niche and three statues; the nave's roof behind.
 */
function church(z0: number, z1: number) {
  const mid = (z0 + z1) / 2;
  const bulge = (z: number) =>
    front + 3 + 5 * Math.sin((Math.PI * (z - z0)) / (z1 - z0));
  const surface: Surface = (u, y) => [bulge(u) + 0.05, y, u];
  const along = (y: number, from = z0, to = z1, steps = 16) =>
    Array.from({ length: steps + 1 }, (_, i): Point => {
      const z = from + ((to - from) * i) / steps;
      return [bulge(z), y, z];
    });
  add(
    path([
      [front - 2, 24, z0 + 2],
      [front - 150, 24, z0 + 2],
      [front - 150, 33, mid],
      [front - 2, 33, mid],
    ]),
    "#3d1240",
    roofRed,
    1.8,
    8,
  );
  // The attic: upright to 31 m, a curved gable over the middle, and
  // scrolls stepping down to the balustrade at both ends.
  const half = 10.7;
  const top = (z: number) => {
    const d = Math.abs(z - mid);
    if (d <= 4.5) return 31 + 3.6 * Math.sqrt(1 - (d / 4.5) ** 2);
    if (d <= 8) return 31;
    return 27 + 4 * Math.sqrt(Math.max(0, 1 - ((d - 8) / (half - 8)) ** 2));
  };
  const attic = along(0, mid - half, mid + half, 40).map(([x, , z]): Point => [
    x,
    top(z),
    z,
  ]);
  add(
    path([...along(24, mid - half, mid + half, 40).reverse(), ...attic]),
    "#211241",
    pink,
    2,
    10,
  );
  add(path([...along(0), ...along(24).reverse()]), "#1d1039", pink, 2, 10);
  // Cornices, the balustrade and pilasters.
  add(
    path(along(9.2), false) +
      path(along(17.6), false) +
      path(along(25.4), false) +
      along(24, z0, z1, 30)
        .map(([x, , z]) => line([x, 24, z], [x, 25.4, z]))
        .join("") +
      [-14, -11, -6.8, -3.2, 3.2, 6.8, 11, 14]
        .map((dz) => path([surface(mid + dz, 0), surface(mid + dz, 24)], false))
        .join(""),
    "none",
    "#c189ff",
    1.2,
  );
  add(
    archOn(surface, mid - 1.4, mid + 1.4, 10.6, 16.2) +
      archOn(surface, mid - 7.85, mid - 6.15, 11, 15.6) +
      archOn(surface, mid + 6.15, mid + 7.85, 11, 15.6) +
      archOn(surface, mid - 7.8, mid - 6.2, 2.2, 6.4) +
      archOn(surface, mid + 6.2, mid + 7.8, 2.2, 6.4) +
      ringOn(surface, mid, 19.6, 1.1) +
      ringOn(surface, mid - 7, 19.6, 0.75) +
      ringOn(surface, mid + 7, 19.6, 0.75),
    "#070818",
    cyan,
    1.4,
    8,
  );
  // The portal.
  add(
    archOn(surface, mid - 1.7, mid + 1.7, 0, 5.8) +
      path([surface(mid, 0), surface(mid, 4.1)], false),
    "#2a0c20",
    amber,
    1.6,
    8,
  );
  // The Madonna's niche in the attic, and the statues on top.
  add(
    archOn(surface, mid - 1.2, mid + 1.2, 26, 30.4),
    "#070818",
    violet,
    1.4,
    6,
  );
  add(
    statueOn(surface, mid, 26.3, 3.2) +
      statueOn(surface, mid, top(mid), 3.4) +
      statueOn(surface, mid - 4.5, top(mid - 4.5), 2.8) +
      statueOn(surface, mid + 4.5, top(mid + 4.5), 2.8) +
      statueOn(surface, mid - 8, 31, 1.8) +
      statueOn(surface, mid + 8, 31, 1.8),
    "#2a1a10",
    amber,
    1.2,
    8,
  );
}

/**
 * The monastery as seen by `camera`, after photographs of the west front:
 * corner pavilions with turrets, wings, the twin towers and the convex
 * church front, 145 m in all. The painting order, from the south end towards
 * the north-west corner, holds while the camera stays north of the towers,
 * as every view from viewFor() does. `pose` places and turns the whole
 * building; moving the camera the opposite way keeps every facing test.
 */
export function monasteryFrom(
  camera: View,
  at: ClockTime = time,
  pose: Pose = homePose,
) {
  const look = pose.look ?? camera.yaw;
  view = poseCamera({ ...camera, yaw: look }, pose);
  rise = pose.rise;
  shiftX = focal * Math.tan(look - camera.yaw);
  time = at;
  shapes = [];
  const wingSpec = { eave: 15.9, ridge: 23, rows: wingRows };
  const pavilion = {
    eave: 19,
    ridge: 25,
    rows: pavilionRows,
    depth: 20,
    nearEnd: true,
    turret: true,
  };
  // The north wing runs east from the north-west pavilion to the north-east
  // pavilion, about 105 m, after the abbey's outline in OpenStreetMap
  // (© OpenStreetMap contributors, measurements only); the
  // east and south wings stay out of sight from the north-west. wing()
  // draws fronts that face +X, so these are drawn in a frame turned 90° to
  // the right, where local X points north (-Z) and local Z west (+X), far
  // end first; painted first, the front stands before them.
  const outer = view;
  view = { x: -outer.z, z: outer.x, yaw: outer.yaw - Math.PI / 2 };
  wing(-28.5, front - 145, front - 123, {
    ...pavilion,
    nearEnd: false,
    turret: false,
    seed: 1,
  });
  wing(-30, front - 123, front + 1.5 - 20, { ...wingSpec, seed: 4 });
  view = outer;
  wing(front + 1.5, 155.8, 174.8, { ...pavilion, seed: 2 });
  wing(front, 128.2, 155.8, { ...wingSpec, seed: 3 });
  tower(117.9, true);
  church(86.9, 117.9);
  tower(76.6, false);
  wing(front, 49, 76.6, { ...wingSpec, seed: 0 });
  wing(front + 1.5, 30, 49, { ...pavilion, seed: 5 });
  view = standing;
  rise = 1;
  shiftX = 0;
  return shapes;
}

/**
 * Wide screens leave a margin left of the page's text column (`.shell`:
 * min(100% - 6rem, 80rem)). From 200 px on the monastery stands there,
 * centred and filling most of it; otherwise it stays at home.
 */
export function abbeyPose(
  width: number,
  layout: { vanishX: number; scale: number },
) {
  const margin = (width - Math.min(width - 96, 1280)) / 2;
  if (width < 1024 || margin < 200) return homePose;
  // The church front stands near the text, so that the north wing has room
  // to recede to the left.
  return poseAt(
    (margin * 0.9 - layout.vanishX) / layout.scale,
    Math.min(340, (margin * 0.8) / layout.scale),
  );
}

/*
 * The ski jumps of Einsiedeln on the far bank of the Alp, drawn freely after
 * a photograph: two in-runs on concrete pillars, the large one from a start
 * tower on the hilltop, landing hills with distance marks and
 * floodlights, and a judges' tower between them. Each jump is laid out along
 * its axis in metres: `s` downhill from the start tower, `h` up and `w`
 * across, positive towards the viewer. The jumps face left, towards the
 * monastery: the axis runs straight across, at about 45° to the line of
 * sight, so that the in-runs show in profile and the landing hills their
 * width.
 */
const jumpFoot = [330, 400];
const jumpAxis = [-1, 0];
const jumpAcross = [0, -1];
const onJump = (s: number, h: number, w: number): Point => [
  jumpFoot[0] + s * jumpAxis[0] + w * jumpAcross[0],
  h,
  jumpFoot[1] + s * jumpAxis[1] + w * jumpAcross[1],
];

/** Linear interpolation along a profile of [s, h] points. */
function profileAt(profile: number[][], s: number) {
  if (s <= profile[0][0]) return profile[0][1];
  for (let i = 1; i < profile.length; i++) {
    const [s0, h0] = profile[i - 1];
    const [s1, h1] = profile[i];
    if (s <= s1) return h0 + ((h1 - h0) * (s - s0)) / (s1 - s0);
  }
  return profile[profile.length - 1][1];
}

/** Samples every `step` metres from `from` to `to`, both included. */
const along = (from: number, to: number, step = 4) =>
  Array.from(
    { length: Math.ceil((to - from) / step) + 1 },
    (_, i) => from + Math.min(i * step, to - from),
  );

// The large hill: a steep in-run curving into the take-off table, then the
// knoll, the landing slope and the outrun on the valley floor. The in-run
// runs well above the hillside, as on the photograph.
const inrun = [
  [0, 97],
  [62, 58],
  [76, 51],
  [92, 48],
];
const landing = [
  [91, 44],
  [108, 40],
  [128, 30],
  [160, 12],
  [184, 3],
  [204, 0],
  [250, 0],
];
const hillside = [
  [-110, 0],
  [-60, 30],
  [-20, 58],
  [10, 62],
  [50, 46],
  [91, 40],
];
const ground = (s: number) =>
  s < 91 ? profileAt(hillside, s) : profileAt(landing, s);

/** One jump, scaled by `k` and moved `offset` metres down and `w` across. */
function jump(k: number, offset: number, w: number, half: number) {
  const at = (s: number, h: number, dw: number) =>
    onJump(offset + s * k, h * k, w + dw);
  const end = landing[landing.length - 1][0];
  const top = inrun[0][1];
  // The hillside facing the viewer, from the hilltop to the outrun; the
  // medium hill's would hide the large one's landing behind it.
  if (k === 1)
    add(
      path(along(hillside[0][0], end).map((s) => at(s, ground(s), half))),
      "#120926",
      "#7a4fd0",
      1.4,
      6,
    );
  // The start tower with its wider cabin, seen from downhill and the side.
  const box = (
    s0: number,
    s1: number,
    w0: number,
    w1: number,
    h0: number,
    h1: number,
  ) =>
    path([at(s1, h0, w0), at(s1, h1, w0), at(s1, h1, w1), at(s1, h0, w1)]) +
    path([at(s0, h0, w1), at(s0, h1, w1), at(s1, h1, w1), at(s1, h0, w1)]);
  add(
    box(-5, 2, -3, 3, ground(0) - 2, top + 1) +
      box(-8, 4, -5, 5, top + 1, top + 5),
    "#1b1036",
    pink,
    1.8,
    10,
  );
  add(
    path([at(4, top + 3, -5), at(4, top + 3, 5)], false) +
      path([at(-8, top + 3, 5), at(4, top + 3, 5)], false),
    "none",
    cyan,
    1.2,
    8,
  );
  // The landing surface, its side rails and distance marks.
  const slope = along(landing[0][0], end);
  add(
    path([
      ...slope.map((s) => at(s, profileAt(landing, s), -half)),
      ...slope.map((s) => at(s, profileAt(landing, s), half)).reverse(),
    ]),
    "#0d3a46",
    cyan,
    1.6,
    10,
  );
  add(
    along(112, 196, 12)
      .map((s) =>
        line(
          at(s, profileAt(landing, s), -half * 0.75),
          at(s, profileAt(landing, s), half * 0.75),
        ),
      )
      .join(""),
    "none",
    "#9ff8ffaa",
    1,
  );
  // Concrete pillars carrying the in-run, the largest under the curve.
  const deck = (s: number) => profileAt(inrun, s);
  add(
    [
      [14, 1],
      [30, 1],
      [46, 1.2],
      [64, 2.4],
      [84, 1.4],
    ]
      .map(([s, width]) => {
        const under = deck(s) - 2.4;
        const foot = Math.min(under, ground(s)) - 1;
        return path([
          at(s - width, foot, 1.4),
          at(s - width, under, 1.4),
          at(s + width, under, 1.4),
          at(s + width, foot, 1.4),
        ]);
      })
      .join(""),
    "#1d1039",
    pink,
    1.4,
    8,
  );
  // The in-run: its girder seen from the side, and the lit track on top.
  const run = along(0, inrun[inrun.length - 1][0], 3);
  add(
    path([
      ...run.map((s) => at(s, deck(s), 1.8)),
      ...run.map((s) => at(s, deck(s) - 2.6, 1.8)).reverse(),
    ]),
    "#22133f",
    pink,
    1.8,
    10,
  );
  add(
    [-1.4, 1.4]
      .map((dw) =>
        path(
          run.map((s) => at(s, deck(s) + 0.4, dw)),
          false,
        ),
      )
      .join(""),
    "none",
    cyan,
    1.4,
    10,
  );
  // Floodlights along both sides of the landing hill.
  const poles = along(104, 200, 24).flatMap((s) =>
    [-1, 1].map((side) => ({
      s,
      h: profileAt(landing, s),
      dw: side * (half + 3),
    })),
  );
  add(
    poles.map(({ s, h, dw }) => line(at(s, h, dw), at(s, h + 18, dw))).join(""),
    "none",
    "#c189ff",
    1,
  );
  add(
    poles
      .map(({ s, h, dw }) => {
        const [x, y, z] = at(s, h + 18, dw);
        return ball(x, y, z, 0.9 * k);
      })
      .join(""),
    "#fff1c4",
    amber,
    1,
    10,
  );
}

/** The ski jumps as seen by `camera`; the large one behind, then the small. */
export function skiJumpFrom(camera: View) {
  view = camera;
  shapes = [];
  // A small, smooth hill behind the jumps, a little above the hilltop.
  const crest = along(-90, 230, 5).map((s) => {
    const t = (s - 10) / (s < 10 ? 100 : 220);
    return onJump(s, 68 * (1 - t * t) ** 2, -34);
  });
  add(path(crest), "#140a2c", "#7a4fd0", 1.4, 6);
  jump(1, 0, 0, 13);
  // The judges' tower between the hills, with its lit cabin.
  const tower = (s: number, w: number) => (h0: number, h1: number, r: number) =>
    path([
      onJump(s + r, h0, w - r),
      onJump(s + r, h1, w - r),
      onJump(s + r, h1, w + r),
      onJump(s + r, h0, w + r),
    ]) +
    path([
      onJump(s - r, h0, w + r),
      onJump(s - r, h1, w + r),
      onJump(s + r, h1, w + r),
      onJump(s + r, h0, w + r),
    ]);
  const judges = tower(150, 17);
  add(judges(0, 30, 3.5) + judges(30, 36, 4.5), "#1b1036", pink, 1.6, 8);
  add(
    path([onJump(154.5, 33, 13), onJump(154.5, 33, 21)], false) +
      path([onJump(146, 33, 21.5), onJump(154.5, 33, 21.5)], false),
    "none",
    amber,
    1.2,
    8,
  );
  // The medium hill, closer to the viewer, starts lower on the slope.
  jump(0.62, 60, 44, 9);
  view = standing;
  return shapes;
}

export const skiJump = skiJumpFrom(standing);

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
