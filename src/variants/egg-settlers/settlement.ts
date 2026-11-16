/**
 * The two interactions of the Egg Settlers home page, loaded by
 * Settlement.astro. Optional enhancements under ADR 0004: without this script
 * the egg stands with its first ring, the status says "Im Bau", and the build
 * button and the settler stay hidden.
 *
 * - "Bauen" adds one ring of shell to the giant egg, with a puff of dust. When
 *   the egg is finished, the settlers celebrate and the button offers to
 *   build it again.
 * - Clicking the settler shows the next reply, more fed up each time.
 * - Clicking free meadow on the map, or "Haus bauen", sends a crew from the
 *   egg's plaza to build a house there. Where houses may stand comes from a
 *   grid that map.ts computes at build time; new houses take their cells.
 *
 * All text comes from the page's data attributes or this file and is set with
 * textContent; sprites are <use> elements made with createElementNS. Nothing
 * is stored; a reload starts over.
 */

/** From this reply on, the settler frowns. */
const grumpyFrom = 3;

function readLines(element: HTMLElement, key: string): string[] {
  try {
    const value: unknown = JSON.parse(element.dataset[key] ?? "[]");
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

/** Restarts a one-shot CSS animation by removing and re-adding its class. */
function replay(element: Element, className: string): void {
  element.classList.remove(className);
  void element.getBoundingClientRect();
  element.classList.add(className);
}

function setUpBuilding(site: HTMLElement): void {
  const scene = site.querySelector<HTMLElement>("[data-scene]");
  const courses = Array.from(site.querySelectorAll("[data-course]"));
  const progress = site.querySelector<HTMLProgressElement>("[data-progress]");
  const progressText = site.querySelector<HTMLElement>("[data-progress-text]");
  const status = site.querySelector<HTMLElement>("[data-status]");
  const button = site.querySelector<HTMLButtonElement>("[data-build-button]");
  if (!button || courses.length === 0) return;

  const statuses = readLines(site, "statuses");
  const format = site.dataset.progressFormat ?? "";
  const total = courses.length;
  let built = courses.filter((course) =>
    course.classList.contains("is-built"),
  ).length;

  const render = () => {
    const done = built >= total;
    courses.forEach((course, index) =>
      course.classList.toggle("is-built", index < built),
    );
    scene?.classList.toggle("is-complete", done);
    if (progress) progress.value = built;
    if (progressText) {
      progressText.textContent = format
        .replace("{built}", String(built))
        .replace("{total}", String(total));
    }
    if (status) status.textContent = statuses[built - 1] ?? "";
    button.textContent =
      (done ? site.dataset.labelRebuild : site.dataset.labelBuild) ?? "";
  };

  button.addEventListener("click", () => {
    built = built >= total ? 1 : built + 1;
    render();
    if (scene) replay(scene, "is-building");
  });
  button.hidden = false;
}

function setUpSettler(site: HTMLElement): void {
  const settler = site.querySelector<HTMLElement>("[data-settler]");
  const button = settler?.querySelector<HTMLButtonElement>("button");
  const reply = settler?.querySelector<HTMLElement>("[data-reply]");
  if (!settler || !button || !reply) return;

  const replies = readLines(settler, "replies");
  if (replies.length === 0) return;
  let clicks = 0;

  button.addEventListener("click", () => {
    const index = clicks % replies.length;
    reply.textContent = replies[index] ?? "";
    button.dataset.mood = index >= grumpyFrom ? "grumpy" : "calm";
    replay(button, "is-poked");
    clicks += 1;
  });
  settler.hidden = false;
}

const svgNs = "http://www.w3.org/2000/svg";
const maxHouses = 24;
/** Map pixels per second for the building crew. */
const crewPace = 40;
const buildTime = 2400;

interface SpriteRef {
  id: string;
  w: number;
  h: number;
}
interface CrewMember {
  walk: string[];
  work: string[];
}
interface Grid {
  cell: number;
  cols: number;
  rows: number;
  cells: string;
}

function readJson<T>(element: HTMLElement, key: string, fallback: T): T {
  try {
    return JSON.parse(element.dataset[key] ?? "") as T;
  } catch {
    return fallback;
  }
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** A sprite, or two frames that styles.css alternates, at map pixels x, y. */
function sprite(ids: string[], x: number, y: number): SVGGElement {
  const group = document.createElementNS(svgNs, "g");
  if (ids.length > 1) group.classList.add("frames");
  for (const id of ids) {
    const use = document.createElementNS(svgNs, "use");
    use.setAttribute("href", `#${id}`);
    use.setAttribute("x", String(Math.round(x)));
    use.setAttribute("y", String(Math.round(y)));
    group.append(use);
  }
  return group;
}

function setUpHouses(site: HTMLElement): void {
  const scene = site.querySelector<HTMLElement>("[data-scene]");
  const svg = scene?.querySelector("svg");
  const houseLayer = svg?.querySelector("[data-new-houses]");
  const crewLayer = svg?.querySelector("[data-crews]");
  const button = site.querySelector<HTMLButtonElement>("[data-house-button]");
  const hint = site.querySelector<HTMLElement>("[data-house-hint]");
  const count = site.querySelector<HTMLElement>("[data-house-count]");
  const status = site.querySelector<HTMLElement>("[data-house-status]");
  const grid = readJson<Grid | null>(site, "grid", null);
  const houses = readJson<SpriteRef[]>(site, "houses", []);
  const plot = readJson<SpriteRef | null>(site, "site", null);
  const crew = readJson<CrewMember[]>(site, "crew", []);
  const [startX, startY] = readJson<number[]>(site, "crewStart", [240, 196]);
  if (!svg || !houseLayer || !crewLayer || !grid || !plot) return;
  if (houses.length === 0 || crew.length === 0) return;

  const cells = [...grid.cells];
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  let built = 0;

  const say = (text: string) => {
    if (count) count.textContent = text;
    if (status) status.textContent = text;
  };
  const cellAt = (x: number, y: number) => {
    const c = Math.floor(x / grid.cell);
    const r = Math.floor(y / grid.cell);
    if (c < 0 || r < 0 || c >= grid.cols || r >= grid.rows) return -1;
    return r * grid.cols + c;
  };
  /** Whether a house fits with its foot at (cx, base). */
  const fits = (cx: number, base: number) => {
    for (let y = base - 10; y <= base + 2; y += grid.cell) {
      for (let x = cx - 12; x <= cx + 12; x += grid.cell) {
        const i = cellAt(x, y);
        if (i < 0 || cells[i] !== "1") return false;
      }
    }
    return true;
  };
  const reserve = (cx: number, base: number) => {
    for (let y = base - 26; y <= base + 6; y += grid.cell) {
      for (let x = cx - 18; x <= cx + 18; x += grid.cell) {
        const i = cellAt(x, y);
        if (i >= 0) cells[i] = "0";
      }
    }
  };
  /** The free spot nearest to a point, within a short reach. */
  const nearest = (x: number, y: number): [number, number] | null => {
    for (let r = 0; r <= 24; r += 4) {
      const steps = Math.max(1, Math.round((r * Math.PI) / 3));
      for (let k = 0; k < steps; k++) {
        const a = (k / steps) * Math.PI * 2;
        const cx = Math.round(x + Math.cos(a) * r);
        const base = Math.round(y + Math.sin(a) * r);
        if (fits(cx, base)) return [cx, base];
      }
    }
    return null;
  };
  /** Screen coordinates to map pixels. */
  const toMap = (clientX: number, clientY: number) => {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(clientX, clientY).matrixTransform(
      matrix.inverse(),
    );
    return [point.x, point.y] as const;
  };
  /** A free spot in the visible middle of the map, close to the village. */
  const somewhere = (): [number, number] | null => {
    const a = toMap(window.innerWidth * 0.15, window.innerHeight * 0.2);
    const b = toMap(window.innerWidth * 0.85, window.innerHeight * 0.7);
    if (!a || !b) return null;
    const found: [number, number][] = [];
    for (let i = 0; i < 400; i++) {
      const cx = Math.round(a[0] + Math.random() * (b[0] - a[0]));
      const base = Math.round(a[1] + Math.random() * (b[1] - a[1]));
      if (fits(cx, base)) found.push([cx, base]);
    }
    found.sort(
      (p, q) =>
        Math.hypot(p[0] - startX, p[1] - startY) -
        Math.hypot(q[0] - startX, q[1] - startY),
    );
    return found[Math.floor(Math.random() * Math.min(8, found.length))] ?? null;
  };

  /** Adds a sprite to the new houses, drawn in order of their feet. */
  const addToHouses = (element: SVGGElement, base: number) => {
    element.dataset.base = String(base);
    const after = [...houseLayer.children].find(
      (child) => Number((child as SVGElement).dataset.base) > base,
    );
    houseLayer.insertBefore(element, after ?? null);
  };

  /** Walks a settler from one point to another; resolves on arrival. */
  const walk = async (
    member: CrewMember,
    from: [number, number],
    to: [number, number],
  ) => {
    const mover = document.createElementNS(svgNs, "g");
    mover.append(sprite(member.walk, from[0] - 4, from[1] - 14));
    crewLayer.append(mover);
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const duration = (Math.hypot(dx, dy) / crewPace) * 1000;
    await mover.animate(
      [
        { transform: "translate(0px, 0px)" },
        { transform: `translate(${dx}px, ${dy}px)` },
      ],
      { duration, easing: "linear", fill: "forwards" },
    ).finished;
    mover.remove();
  };

  /** Trees on the plot make way for the house. */
  const fell = (cx: number, base: number) => {
    for (const tree of svg.querySelectorAll<SVGGElement>("[data-foot]")) {
      const [x = 0, y = 0] = (tree.dataset.foot ?? "").split(" ").map(Number);
      if (Math.abs(x - cx) < 18 && y > base - 22 && y < base + 8) {
        tree.classList.add("is-felled");
      }
    }
  };

  const build = async (cx: number, base: number) => {
    reserve(cx, base);
    built += 1;
    const house = houses[(built - 1) % houses.length];
    if (!house) return;
    const finish = () => {
      const done = sprite([house.id], cx - house.w / 2, base - house.h);
      done.classList.add("new-house");
      addToHouses(done, base);
      say(built === 1 ? "1 neues Haus" : `${built} neue Häuser`);
    };
    if (still.matches) {
      fell(cx, base);
      finish();
      return;
    }
    say("Die Siedler machen sich auf den Weg …");
    const team = crew.slice(0, 3);
    const spots: [number, number][] = [
      [cx - 14, base + 2],
      [cx + 14, base + 3],
      [cx - 2, base + 6],
    ];
    const starts: [number, number][] = team.map((_, i) => [
      startX + (i - 1) * 7,
      startY + (i % 2) * 3,
    ]);
    await Promise.all(
      team.map((member, i) =>
        walk(member, starts[i] ?? [startX, startY], spots[i] ?? [cx, base]),
      ),
    );
    fell(cx, base);
    const plotSprite = sprite([plot.id], cx - plot.w / 2, base - plot.h + 2);
    addToHouses(plotSprite, base);
    const workers = team.map((member, i) => {
      const [x, y] = spots[i] ?? [cx, base];
      const worker = sprite(member.work, x - 4, y - 14);
      worker.style.setProperty("--frame", `${0.45 + i * 0.1}s`);
      crewLayer.append(worker);
      return worker;
    });
    say("Die Siedler bauen ein Haus.");
    await wait(buildTime);
    plotSprite.remove();
    workers.forEach((worker) => worker.remove());
    finish();
    await Promise.all(
      team.map((member, i) =>
        walk(member, spots[i] ?? [cx, base], starts[i] ?? [startX, startY]),
      ),
    );
  };

  const request = (spot: [number, number] | null) => {
    if (built >= maxHouses) {
      say("Genug gebaut! Die Siedler wollen ans Ei.");
      return;
    }
    if (!spot) {
      say("Hier ist kein Platz für ein Haus.");
      return;
    }
    void build(spot[0], spot[1]);
  };

  svg.addEventListener("click", (event) => {
    const point = toMap(event.clientX, event.clientY);
    if (point) request(nearest(Math.round(point[0]), Math.round(point[1]) + 6));
  });
  button?.addEventListener("click", () => request(somewhere()));
  scene?.classList.add("is-buildable");
  if (button) button.hidden = false;
  if (hint) hint.hidden = false;
}

const site = document.querySelector<HTMLElement>("[data-build]");
if (site) {
  setUpBuilding(site);
  setUpSettler(site);
  setUpHouses(site);
}
