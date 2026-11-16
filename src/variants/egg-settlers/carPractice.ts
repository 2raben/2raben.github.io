/**
 * Drives Car Drive's practice road (CarPractice.astro) with simplified rules
 * from the game's text: the car drives by itself, you change lanes and use
 * the boost; cars in your direction come slowly, oncoming ones fast, and from
 * level 3 both directions use every lane. Cars blink before changing lanes,
 * trucks join from 4000 metres, a hit costs a heart and gives a moment's
 * protection, and now and then a heart or a shield lies on the road. Every
 * 10 metres earns a coin. The demonstration dodges on its own.
 */
import { laneCenter, road } from "./carRoad";
import { setUpPractice, type Input, type Practice } from "./practice";

const keys: Record<string, string> = {
  a: "left",
  arrowleft: "left",
  d: "right",
  arrowright: "right",
  " ": "boost",
  r: "restart",
};

/** Scroll speed in pixels per second, and metres per pixel. */
const cruise = 46;
const boostFactor = 1.7;
const metresPerPixel = 0.9;

interface Vehicle {
  el: SVGUseElement;
  lane: number;
  x: number;
  y: number;
  /** 1 drives your way, -1 comes towards you. */
  dir: number;
  speed: number;
  truck: boolean;
  color: string;
  blink: number;
  target: number;
}

for (const section of document.querySelectorAll<HTMLElement>(
  '[data-practice="car"]',
)) {
  const player = section.querySelector<SVGGElement>("[data-player]");
  const exhaust = section.querySelector<SVGUseElement>("[data-exhaust]");
  const shieldRing = section.querySelector<SVGRectElement>("[data-shield]");
  const roadLayer = section.querySelector<SVGGElement>("[data-road]");
  const meadow = section.querySelector<SVGGElement>("[data-meadow]");
  const pickupEl = section.querySelector<SVGUseElement>("[data-pickup]");
  const gauge = section.querySelector<SVGRectElement>("[data-gauge]");
  const hearts = [...section.querySelectorAll<SVGUseElement>("[data-heart]")];
  const scenery = [
    ...section.querySelectorAll<SVGUseElement>("[data-scenery]"),
  ].map((el) => ({
    el,
    y: Number(el.getAttribute("y")),
  }));
  const metersEl = section.querySelector<HTMLElement>("[data-meters]");
  const levelEl = section.querySelector<HTMLElement>("[data-level]");
  const coinsEl = section.querySelector<HTMLElement>("[data-coins]");
  if (!player || !roadLayer || !meadow || !pickupEl || !gauge) continue;
  const colors = JSON.parse(section.dataset.colors ?? "[]") as string[];

  const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

  const vehicles: Vehicle[] = [
    ...section.querySelectorAll<SVGUseElement>("[data-vehicle]"),
  ].map((el) => ({
    el,
    lane: 0,
    x: 0,
    y: 999,
    dir: 1,
    speed: 0,
    truck: false,
    color: "blue",
    blink: 0,
    target: 0,
  }));

  const s = {
    lane: 1,
    x: laneCenter(1),
    scroll: 0,
    meters: 0,
    hearts: 3,
    hurt: 0,
    shield: 0,
    gauge: 1,
    boosting: false,
    over: false,
    pickup: { kind: "heart", lane: 0, y: 999 },
    flame: 0,
  };

  const level = () => 1 + Math.floor(s.meters / 1000);
  const tall = (v: Vehicle) => (v.truck ? 24 : 13);

  const spawn = (v: Vehicle, top: number) => {
    v.lane = Math.floor(Math.random() * 3);
    v.dir = level() >= 3 ? (pick([1, -1]) ?? 1) : v.lane === 0 ? -1 : 1;
    v.truck = s.meters >= 4000 && Math.random() < 0.3;
    v.color = pick(colors) ?? "blue";
    v.speed = v.dir > 0 ? 14 + Math.random() * 14 : 26 + Math.random() * 16;
    v.x = laneCenter(v.lane);
    v.y = top - Math.random() * 70;
    v.blink = 0;
    v.target = v.lane;
    /* Keep a gap to the vehicles already in that lane. */
    for (const other of vehicles) {
      if (
        other !== v &&
        other.lane === v.lane &&
        Math.abs(other.y - v.y) < 34
      ) {
        v.y = other.y - 40;
      }
    }
  };

  const reset = () => {
    Object.assign(s, {
      lane: 1,
      x: laneCenter(1),
      meters: 0,
      hearts: 3,
      hurt: 0,
      shield: 0,
      gauge: 1,
      over: false,
    });
    s.pickup.y = -200;
    vehicles.forEach((v, i) => spawn(v, -20 - i * 45));
  };
  reset();

  const free = (laneNo: number, from: number, to: number) =>
    vehicles.every(
      (v) =>
        !(
          (v.lane === laneNo || v.target === laneNo) &&
          v.y + tall(v) > from &&
          v.y < to
        ),
    );

  const render = () => {
    const offset = s.scroll;
    roadLayer.setAttribute(
      "transform",
      `translate(0 ${Math.round((offset % 8) - 8)})`,
    );
    meadow.setAttribute(
      "transform",
      `translate(0 ${Math.round((offset % 48) - 48)})`,
    );
    for (const item of scenery) {
      const y = ((item.y + offset) % (road.height + 30)) - 30;
      item.el.setAttribute(
        "transform",
        `translate(0 ${Math.round(y - item.y)})`,
      );
    }
    player.setAttribute(
      "transform",
      `translate(${Math.round(s.x - 4)} ${road.playerY})`,
    );
    player.style.opacity =
      s.hurt > 0 && Math.floor(s.hurt * 10) % 2 ? "0.35" : "1";
    if (exhaust) {
      exhaust.style.visibility = s.boosting ? "visible" : "hidden";
      exhaust.setAttribute("href", `#es-exhaust-${s.flame % 2}`);
    }
    if (shieldRing)
      shieldRing.style.visibility = s.shield > 0 ? "visible" : "hidden";
    for (const v of vehicles) {
      const id = v.truck
        ? v.dir > 0
          ? "es-truck"
          : "es-truck-down"
        : v.dir < 0
          ? `es-car-${v.color}-down`
          : v.blink > 0 && Math.floor(v.blink * 6) % 2
            ? `es-car-${v.color}-${v.target < v.lane ? "left" : "right"}`
            : `es-car-${v.color}`;
      v.el.setAttribute("href", `#${id}`);
      v.el.setAttribute("x", String(Math.round(v.x - (v.truck ? 5 : 4))));
      v.el.setAttribute("y", String(Math.round(v.y)));
    }
    pickupEl.setAttribute(
      "href",
      s.pickup.kind === "heart" ? "#es-heart" : "#es-shield",
    );
    pickupEl.setAttribute("x", String(laneCenter(s.pickup.lane) - 3));
    pickupEl.setAttribute("y", String(Math.round(s.pickup.y)));
    hearts.forEach((h, i) =>
      h.setAttribute("href", i < s.hearts ? "#es-heart" : "#es-heart-empty"),
    );
    gauge.setAttribute("width", String(Math.round(30 * s.gauge)));
    if (metersEl) metersEl.textContent = String(Math.floor(s.meters));
    if (levelEl) levelEl.textContent = String(level());
    if (coinsEl) coinsEl.textContent = String(Math.floor(s.meters / 10));
  };

  const step = (
    dt: number,
    input: Input,
    demo: boolean,
    practice: Practice,
  ) => {
    if (input.pressed.has("restart")) {
      reset();
      practice.say("Neustart.");
    }
    if (s.over) {
      if (demo) reset();
      render();
      return;
    }
    let left = input.pressed.has("left");
    let right = input.pressed.has("right");
    let boost = input.held.has("boost");
    if (demo) {
      /* The demonstration leaves its lane when something comes, and boosts
         when the way ahead is clear. */
      const ahead = (n: number) =>
        free(n, road.playerY - 46, road.playerY + 16);
      left = right = false;
      if (!ahead(s.lane)) {
        if (s.lane > 0 && ahead(s.lane - 1)) left = true;
        else if (s.lane < 2 && ahead(s.lane + 1)) right = true;
      }
      boost = free(s.lane, road.playerY - 80, road.playerY) && s.gauge > 0.4;
    }
    if (left && s.lane > 0) s.lane -= 1;
    if (right && s.lane < 2) s.lane += 1;
    s.x += (laneCenter(s.lane) - s.x) * Math.min(1, dt * 14);

    s.boosting = boost && s.gauge > 0;
    if (s.boosting) s.gauge = Math.max(0, s.gauge - dt * 0.45);
    else s.gauge = Math.min(1, s.gauge + dt * 0.12);
    const speed = cruise * (s.boosting ? boostFactor : 1);
    const before = level();
    s.scroll += speed * dt;
    s.meters += speed * dt * metresPerPixel * 6;
    s.flame = Math.floor(performance.now() / 80);
    if (level() > before) practice.say(`Level ${level()}: mehr Verkehr.`);
    s.hurt = Math.max(0, s.hurt - dt);
    s.shield = Math.max(0, s.shield - dt);

    for (const v of vehicles) {
      v.y += (speed - v.dir * v.speed) * dt;
      if (v.blink > 0) {
        v.blink -= dt;
        if (v.blink <= 0) v.lane = v.target;
      } else if (
        v.dir > 0 &&
        !v.truck &&
        v.y > 0 &&
        v.y < 50 &&
        Math.random() < dt * 0.25
      ) {
        const to = v.lane + (Math.random() < 0.5 ? -1 : 1);
        if (to >= 0 && to <= 2 && free(to, v.y - 20, v.y + 30)) {
          v.target = to;
          v.blink = 0.9;
        }
      }
      v.x += (laneCenter(v.lane) - v.x) * Math.min(1, dt * 5);
      if (v.y > road.height + 10) spawn(v, -30);
      const hit =
        Math.abs(v.x - s.x) < 8 &&
        v.y + tall(v) > road.playerY + 1 &&
        v.y < road.playerY + 12;
      if (hit && s.hurt <= 0 && s.shield <= 0) {
        s.hearts -= 1;
        s.hurt = 1.5;
        if (s.hearts <= 0) {
          s.over = true;
          practice.say("Keine Herzen mehr. R startet neu.");
        } else practice.say("Autsch! Ein Herz weniger.");
      }
    }

    s.pickup.y += speed * dt;
    if (s.pickup.y > road.height + 10 && Math.random() < dt * 0.15) {
      s.pickup = {
        kind: Math.random() < 0.5 ? "heart" : "shield",
        lane: Math.floor(Math.random() * 3),
        y: -10,
      };
    }
    if (
      s.pickup.lane === s.lane &&
      s.pickup.y > road.playerY - 6 &&
      s.pickup.y < road.playerY + 12
    ) {
      if (s.pickup.kind === "heart") {
        s.hearts = Math.min(3, s.hearts + 1);
        practice.say("Ein Herz!");
      } else {
        s.shield = 4;
        practice.say("Schild: kurz unverwundbar.");
      }
      s.pickup.y = road.height + 20;
    }
    render();
  };

  setUpPractice(section, keys, step);
}
