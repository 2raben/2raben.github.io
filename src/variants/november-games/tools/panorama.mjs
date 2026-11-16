// Downloads swisstopo terrain and summit data and generates ../panorama.ts.
//
//   node src/variants/november-games/tools/panorama.mjs [--cache <dir>]
//
// Downloads are cached (default: node_modules/.cache/november-games-panorama),
// so a rerun only fetches what is missing; delete the cache to refresh. A full
// download makes about 3000 requests to api3.geo.admin.ch and takes several
// minutes. Data: © swisstopo (swissALTI3D/DHM25 heights, swissNAMES3D names).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";

const api = "https://api3.geo.admin.ch/rest/services";
const output = fileURLToPath(new URL("../panorama.ts", import.meta.url));
const cacheArg = process.argv.indexOf("--cache");
const cache =
  cacheArg > 0
    ? path.resolve(process.argv[cacheArg + 1])
    : path.resolve("node_modules/.cache/november-games-panorama");

// Viewpoint: the Klosterplatz west of the monastery (LV95), raised so that
// the hills near Einsiedeln no longer hide the Mythen.
const origin = [2699650, 1220350];
const eyeAboveGround = 450;
const rayLength = 32000;
const rayPoints = 1000;
// Rays every 0.4°, denser towards the Mythen.
const rayGrids = [
  [140, 270, 0.4],
  [170, 235, 0.2],
  [195, 216, 0.1],
];
// Scene units per degree (as in landscapeLayout()), heading at the vanishing
// point, the drawn range of headings, how many degrees at either end ease
// down into the plain, and the vertical drawing.
const perDegree = 42;
const heading = 197.5;
const [fromHeading, toHeading] = [140, 252];
const taper = 12;
const baseAngle = 0.2;
const exaggeration = 2.2;
const earthRadius = 6371000;
const refraction = 0.87;
/** Depth bands in metres, far first. */
const bands = [
  [13000, 32000],
  [7000, 13000],
  [3000, 7000],
  [500, 3000],
];
// swissNAMES3D search area south of Einsiedeln (LV95), in 6 km tiles.
const nameArea = { east: [2672000, 2722000], north: [1190000, 1222000] };
const tile = 6000;
const summitKinds = new Set([
  "Gipfel",
  "Hauptgipfel",
  "Huegel",
  "Alpiner Gipfel",
  "Haupthuegel",
]);
/** swissNAMES3D name → label and official height in metres. Only these are labelled. */
const labels = {
  Druesberg: ["Druesberg", 2282],
  Forstberg: ["Forstberg", 2215],
  Chaiserstock: ["Chaiserstock", 2515],
  Rossstock: ["Rossstock", 2461],
  Gschwändstock: ["Gschwändstock", 1616],
  Amselspitz: ["Amselspitz", 1491],
  "Chli Amslen": ["Chli Amslen", 1399],
  Klingenstock: ["Klingenstock", 1935],
  Rophaien: ["Rophaien", 2078],
  "Gross Mythen": ["Grosser Mythen", 1898],
  Gitschen: ["Gitschen", 2513],
  Fronalpstock: ["Fronalpstock", 1921],
  "Chli Mythen": ["Kleiner Mythen", 1811],
  Haggenspitzli: ["Haggenspitz", 1762],
  Näbikenfirst: ["Näbikenfirst", 1565],
  Höchtändli: ["Höchtändli", 1523],
  Nüsellstock: ["Nüsellstock", 1478],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET JSON politely: a short pause before each request, retries with backoff. */
async function getJson(url) {
  for (let attempt = 0; ; attempt++) {
    try {
      await sleep(300);
      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === 4) throw new Error(`${url}: ${error.message}`);
      await sleep(2000 + attempt * 3000);
    }
  }
}

/** Runs `task` for every item with `workers` parallel requests. */
async function pool(items, workers, task) {
  let next = 0;
  const run = async () => {
    while (next < items.length) await task(items[next++]);
  };
  await Promise.all(Array.from({ length: workers }, run));
}

async function load(name, fallback) {
  try {
    return JSON.parse(await readFile(path.join(cache, name), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}
const save = (name, data) =>
  writeFile(path.join(cache, name), JSON.stringify(data));

/** Named summits of the search area: [{ name, kind, e, n }]. */
async function fetchNames() {
  const cached = await load("names.json", null);
  if (cached) return cached;
  const found = new Map();
  for (let e = nameArea.east[0]; e < nameArea.east[1]; e += tile) {
    for (let n = nameArea.north[0]; n < nameArea.north[1]; n += tile) {
      const extent = `${e},${n},${e + tile},${n + tile}`;
      for (let offset = 0; ; offset += 200) {
        const query = new URLSearchParams({
          geometryType: "esriGeometryEnvelope",
          geometry: extent,
          imageDisplay: "1000,1000,96",
          mapExtent: extent,
          tolerance: "0",
          layers: "all:ch.swisstopo.swissnames3d",
          sr: "2056",
          returnGeometry: "true",
          geometryFormat: "geojson",
          offset: String(offset),
        });
        const { results } = await getJson(
          `${api}/ech/MapServer/identify?${query}`,
        );
        for (const feature of results) {
          const { name, objektart: kind } = feature.properties;
          if (summitKinds.has(kind) && feature.geometry.type === "MultiPoint") {
            const [east, north] = feature.geometry.coordinates[0];
            found.set(feature.id, { name, kind, e: east, n: north });
          }
        }
        if (results.length < 200) break;
      }
    }
  }
  const names = [...found.values()];
  await save("names.json", names);
  console.log(`names: ${names.length} summits`);
  return names;
}

const height = async (e, n) =>
  Number(
    (
      await getJson(
        `${api}/height?easting=${e.toFixed(1)}&northing=${n.toFixed(1)}&sr=2056`,
      )
    ).height,
  );

/** The highest terrain point near a named summit: a 15 m grid, then 4 m. */
async function summitTop(summit) {
  const best = (a, b) =>
    a[0] !== b[0]
      ? a[0] > b[0]
        ? a
        : b
      : a[1] !== b[1]
        ? a[1] > b[1]
          ? a
          : b
        : a[2] >= b[2]
          ? a
          : b;
  const search = async (e, n, reach, step) => {
    const points = [];
    for (let dx = -reach; dx <= reach; dx += step) {
      for (let dy = -reach; dy <= reach; dy += step) {
        points.push([e + dx, n + dy]);
      }
    }
    const heights = [];
    for (const [pe, pn] of points) heights.push([await height(pe, pn), pe, pn]);
    return heights.reduce(best);
  };
  let top = await search(summit.e, summit.n, 60, 15);
  top = best(top, await search(top[1], top[2], 8, 4));
  return { ...summit, top: top[0], te: top[1], tn: top[2] };
}

/** Summit tops for every labelled name; candidates with the same name included. */
async function fetchSummits(names) {
  const summits = await load("summits.json", []);
  const key = (s) => `${s.name}@${s.e},${s.n}`;
  const done = new Set(summits.map(key));
  const missing = names.filter((s) => s.name in labels && !done.has(key(s)));
  await pool(missing, 2, async (summit) => {
    summits.push(await summitTop(summit));
    await save("summits.json", summits);
  });
  if (missing.length) console.log(`summits: ${missing.length} measured`);
  return summits;
}

/** Terrain profiles fanning out from the origin: { heading: [[distance, height]] }. */
async function fetchRays() {
  const data = await load("rays.json", { origin, rays: {} });
  const azimuths = new Set();
  for (const [from, to, step] of rayGrids) {
    for (let i = 0; i <= Math.round((to - from) / step); i++) {
      azimuths.add(Number((from + i * step).toFixed(2)));
    }
  }
  const have = new Set(Object.keys(data.rays).map(Number));
  const missing = [...azimuths].filter((az) => !have.has(az));
  let fetched = 0;
  await pool(missing, 2, async (az) => {
    const a = (az * Math.PI) / 180;
    const geom = JSON.stringify({
      type: "LineString",
      coordinates: [
        origin,
        [
          origin[0] + Math.sin(a) * rayLength,
          origin[1] + Math.cos(a) * rayLength,
        ],
      ],
    });
    const query = new URLSearchParams({
      geom,
      sr: "2056",
      nb_points: String(rayPoints),
      distinct_points: "true",
    });
    const profile = await getJson(`${api}/profile.json?${query}`);
    data.rays[az] = profile.map((p) => [p.dist, p.alts.COMB]);
    if (++fetched % 20 === 0 || fetched === missing.length) {
      await save("rays.json", data);
      console.log(`rays: ${fetched}/${missing.length}`);
    }
  });
  return Object.entries(data.rays)
    .map(([az, profile]) => [Number(az), profile])
    .sort((a, b) => a[0] - b[0]);
}

function generate(rays, summits) {
  const eye = rays[0][1][0][1] + eyeAboveGround;
  // Elevation angle seen from the eye, with earth curvature and refraction.
  const angle = (h, d) =>
    (Math.atan2(h - eye - (refraction * d * d) / (2 * earthRadius), d) * 180) /
    Math.PI;
  const x = (az) => (az - heading) * perDegree;
  const y = (a) => -(a - baseAngle) * perDegree * exaggeration;
  const highest = (profile, test) =>
    profile.reduce((m, [d, h]) => (test(d) ? Math.max(m, angle(h, d)) : m), -9);
  const round = (value) => Number(value.toFixed(1));

  const bottom = 60;
  const drawn = rays.filter(([az]) => az >= fromHeading && az <= toHeading);
  // Smoothly from 0 at the ends of the drawn range to 1 inside it.
  const ease = (az) => {
    const t = Math.min(1, (az - fromHeading) / taper, (toHeading - az) / taper);
    return t * t * (3 - 2 * t);
  };
  const layers = bands.map(([near, far]) => {
    const points = drawn.map(([az, profile]) => [
      x(az),
      Math.max(y(highest(profile, (d) => d >= near && d < far)), -1000) *
        ease(az),
    ]);
    const line = points
      .map(([px, py]) => `L${px.toFixed(1)} ${Math.min(py, bottom).toFixed(1)}`)
      .join("");
    const [first, last] = [points[0][0], points.at(-1)[0]];
    return `M${first.toFixed(1)} ${bottom}${line}L${last.toFixed(1)} ${bottom}Z`;
  });

  // Several summits share a name; use the one closest to the official height.
  const chosen = new Map();
  for (const summit of summits) {
    const official = labels[summit.name]?.[1];
    const current = chosen.get(summit.name);
    if (
      official &&
      (!current ||
        Math.abs(summit.top - official) < Math.abs(current.top - official))
    ) {
      chosen.set(summit.name, summit);
    }
  }
  const peaks = [];
  for (const summit of chosen.values()) {
    const [name, officialHeight] = labels[summit.name];
    const [de, dn] = [summit.te - origin[0], summit.tn - origin[1]];
    const az = ((Math.atan2(de, dn) * 180) / Math.PI + 360) % 360;
    const distance = Math.hypot(de, dn);
    if (az < fromHeading + taper || az > toHeading - taper) continue;
    const a = angle(summit.top, distance);
    const [, profile] = rays.reduce((nearest, ray) =>
      Math.abs(ray[0] - az) < Math.abs(nearest[0] - az) ? ray : nearest,
    );
    const block = highest(profile, (d) => d > 300 && d < distance - 400);
    if (a < block - 0.02) {
      console.log(`hidden: ${name}`);
      continue;
    }
    peaks.push({
      name,
      height: officialHeight,
      x: round(x(az)),
      y: round(y(a)),
      km: round(distance / 1000),
    });
  }
  peaks.sort((a, b) => a.x - b.x);

  const km = (m) => m / 1000;
  return `// Generated by tools/panorama.mjs from swisstopo elevation data
// (swissALTI3D/DHM25 via the api3.geo.admin.ch profile service) and
// swissNAMES3D summit names; © swisstopo. Viewpoint: ${eyeAboveGround} m above the
// Klosterplatz Einsiedeln (LV95 ${origin[0]}/${origin[1]}, eye at ${eye.toFixed(0)} m), heading
// ${heading}° at the vanishing point. Scene units: ${perDegree} per degree; heights are
// drawn ${exaggeration}× (vertical exaggeration). Do not edit by hand.

/** Skylines in four depth bands, far first: ${bands.map(([a, b]) => `${km(a)}–${km(b)}`).join(", ")} km. */
export const panoramaLayers = ${JSON.stringify(layers)};

/** Visible named summits with their official heights in metres. */
export const panoramaPeaks = ${JSON.stringify(peaks)};

/** Scene units per degree of heading, as in landscapeLayout(). */
export const panoramaPerDegree = ${perDegree};
`;
}

await mkdir(cache, { recursive: true });
const summits = await fetchSummits(await fetchNames());
const rays = await fetchRays();
const source = generate(rays, summits);
const options = await prettier.resolveConfig(output);
await writeFile(
  output,
  await prettier.format(source, { ...options, filepath: output }),
);
console.log(`wrote ${path.relative(process.cwd(), output)}`);
