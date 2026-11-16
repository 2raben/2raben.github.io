/**
 * The raven stage: the pixel canvas behind the home page's hero, where the
 * two ravens fly, sit, peck, call and bump each other. It draws the same sprites and scenery as the
 * static picture (pixels.ts) at a low resolution, scaled up in whole steps.
 *
 * Optional, as ADR 0004 asks: without script, with reduced motion or without
 * a 2D canvas the still picture stays. Keys are handled only while the stage
 * itself has focus; nothing is stored or sent.
 */
import {
  bubbleRuns,
  bubbleSize,
  cloud,
  cloudSmall,
  composeBackdrop,
  formation,
  layer,
  ravenBlink,
  ravenFlyDown,
  ravenFlyUp,
  ravenKrah,
  ravenPeck,
  ravenSit,
  scarf,
  spriteRuns,
  spriteSize,
  type Backdrop,
  type Run,
  type Sprite,
} from "./pixels";

type Pose = "sit" | "blink" | "krah" | "peck" | "flyUp" | "flyDown";

const poses: Record<Pose, Sprite> = {
  sit: ravenSit,
  blink: ravenBlink,
  krah: ravenKrah,
  peck: ravenPeck,
  flyUp: ravenFlyUp,
  flyDown: ravenFlyDown,
};

const scarves: Record<Pose, Sprite> = {
  sit: scarf.sit,
  blink: scarf.sit,
  krah: scarf.krah,
  peck: scarf.peck,
  flyUp: scarf.flyUp,
  flyDown: scarf.flyDown,
};

/** Seconds the ravens hold the formation of the coat of arms at the start. */
const INTRO = 2.4;
/** Seconds the ravens wait for the visitor after a click or key. */
const CONTROL = 8;

interface Target {
  x: number;
  y: number;
  land: boolean;
}

interface Raven {
  /** Feet: bottom centre, in stage pixels. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  flying: boolean;
  target: Target | null;
  /** Seconds before the next idea: flying on, or bumping the other one. */
  rest: number;
  act: "peck" | "krah" | null;
  actLeft: number;
  nextAct: number;
  blinkLeft: number;
  nextBlink: number;
  hopLeft: number;
  hopDx: number;
  clock: number;
  bubble: { image: HTMLCanvasElement; left: number } | null;
  scarf: boolean;
}

const HOP = 0.3;

function paint(runs: Run[], w: number, h: number) {
  const image = document.createElement("canvas");
  image.width = w;
  image.height = h;
  const ctx = image.getContext("2d");
  if (ctx) {
    for (const r of runs) {
      ctx.fillStyle = r.color;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
  }
  return image;
}

function paintSprite(sprite: Sprite, flip = false) {
  const { w, h } = spriteSize(sprite);
  return paint(spriteRuns(sprite, 0, 0, flip), w, h);
}

const random = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function raven(x: number, y: number, withScarf: boolean): Raven {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    facing: 1,
    flying: true,
    target: null,
    rest: 0,
    act: null,
    actLeft: 0,
    nextAct: random(1, 3),
    blinkLeft: 0,
    nextBlink: random(1, 4),
    hopLeft: 0,
    hopDx: 0,
    clock: withScarf ? 0.06 : 0,
    bubble: null,
    scarf: withScarf,
  };
}

export function mountStage(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>("[data-stage-canvas]");
  const ctx = canvas?.getContext("2d");
  const stills = root.querySelectorAll<SVGElement>(".stage-fallback");
  const controls = document.querySelector<HTMLElement>("[data-stage-controls]");
  const steerButton =
    document.querySelector<HTMLButtonElement>("[data-stage-steer]");
  const pauseButton =
    document.querySelector<HTMLButtonElement>("[data-stage-pause]");
  if (!canvas || !ctx || !controls || !steerButton || !pauseButton) return;
  const view = ctx;
  const surface = canvas;
  const steer = steerButton;
  const pause = pauseButton;
  const panel = controls;

  // Every pose of both ravens, facing both ways, painted once.
  const frames = new Map<string, HTMLCanvasElement>();
  for (const pose of Object.keys(poses) as Pose[]) {
    for (const withScarf of [false, true]) {
      const sprite = withScarf
        ? layer(poses[pose], scarves[pose])
        : poses[pose];
      frames.set(`${pose}-${withScarf}-r`, paintSprite(sprite));
      frames.set(`${pose}-${withScarf}-l`, paintSprite(sprite, true));
    }
  }
  const cloudImage = paintSprite(cloud);
  const cloudSmallImage = paintSprite(cloudSmall);
  const bubbles = new Map<string, HTMLCanvasElement>();
  function bubbleImage(text: string) {
    let image = bubbles.get(text);
    if (!image) {
      const { w, h } = bubbleSize(text);
      image = paint(bubbleRuns(text), w, h);
      bubbles.set(text, image);
    }
    return image;
  }

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let backdrop: Backdrop = composeBackdrop(160, 96);
  let base = paint([], 1, 1);
  let leader = raven(0, 0, false);
  let follower = raven(0, 0, true);
  let time = 0;
  let intro = INTRO;
  let control = 0;
  let enabled = false;
  let paused = false;
  let onScreen = true;
  let frame = 0;
  let last = 0;
  const keys = new Set<string>();
  const later: { left: number; run: () => void }[] = [];

  /* ---------- Size ---------- */

  function resize() {
    const box = root.getBoundingClientRect();
    if (!box.width || !box.height) return;
    // About 140 stage pixels high and at least 120 wide, in whole steps.
    const scale = clamp(
      Math.round(Math.min(box.height / 140, box.width / 120)),
      2,
      6,
    );
    const w = Math.ceil(box.width / scale);
    const h = Math.ceil(box.height / scale);
    if (w === width && h === height) return;
    const first = width === 0;
    const sx = first ? 1 : w / width;
    width = w;
    height = h;
    surface.width = w;
    surface.height = h;
    surface.style.width = `${w * scale}px`;
    surface.style.height = `${h * scale}px`;
    backdrop = composeBackdrop(w, h);
    base = paint(
      [
        ...backdrop.runs,
        ...backdrop.props.flatMap((p) => spriteRuns(p.sprite, p.x, p.y)),
      ],
      w,
      h,
    );
    if (first) {
      const [top, bottom] = formation(w, h);
      leader = raven(top.x, top.y, false);
      follower = raven(bottom.x, bottom.y, true);
    } else {
      // Keep the ravens where they were, and let them find a new place.
      for (const r of [leader, follower]) {
        r.x = clamp(r.x * sx, 10, w - 10);
        r.y = clamp(r.y, 16, backdrop.ground);
        r.target = null;
        if (!r.flying) takeOff(r);
      }
    }
    draw();
  }

  /* ---------- Behaviour ---------- */

  function move(r: Raven, dt: number) {
    r.x = clamp(r.x + r.vx * dt, 10, width - 10);
    r.y = clamp(r.y + r.vy * dt, 16, backdrop.ground);
    if (Math.abs(r.vx) > 3) r.facing = r.vx > 0 ? 1 : -1;
  }

  /** Flies towards t; true on arrival. */
  function steerTo(
    r: Raven,
    t: { x: number; y: number },
    speed: number,
    dt: number,
  ) {
    const dx = t.x - r.x;
    const dy = t.y - r.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) {
      r.x = t.x;
      r.y = t.y;
      return true;
    }
    const want = Math.min(speed, d * 2.5);
    const k = Math.min(1, dt * 5);
    r.vx += ((dx / d) * want - r.vx) * k;
    r.vy += ((dy / d) * want - r.vy) * k;
    move(r, dt);
    return false;
  }

  function brake(r: Raven, dt: number) {
    const k = Math.min(1, dt * 6);
    r.vx -= r.vx * k;
    r.vy -= r.vy * k;
    move(r, dt);
  }

  function takeOff(r: Raven) {
    if (r.flying) return;
    r.flying = true;
    r.act = null;
    r.y -= 1;
  }

  function land(r: Raven, y: number) {
    r.flying = false;
    r.y = y;
    r.vx = 0;
    r.vy = 0;
    r.target = null;
    r.rest = random(3, 7);
    r.nextAct = random(0.8, 2.5);
  }

  function say(r: Raven, text: string) {
    r.act = "krah";
    r.actLeft = 0.6;
    r.bubble = { image: bubbleImage(text), left: 1.4 };
  }

  function hop(r: Raven, dx: number) {
    r.hopLeft = HOP;
    r.hopDx = dx;
  }

  /** A perch, or a point in the sky. */
  function wander(r: Raven) {
    const { perches, ground } = backdrop;
    if (Math.random() < 0.7) {
      const p = perches[Math.floor(Math.random() * perches.length)];
      r.target = { x: Math.round(random(p.x0, p.x1)), y: p.y, land: true };
    } else {
      r.target = {
        x: Math.round(random(14, width - 14)),
        y: Math.round(random(18, ground - 28)),
        land: false,
      };
    }
    takeOff(r);
  }

  /** Where a click sends the leader: onto a perch near it, or into the air. */
  function clickTarget(x: number, y: number): Target {
    const { perches, ground } = backdrop;
    const perch = perches.find(
      (p) => Math.abs(y - p.y) <= 8 && x >= p.x0 - 6 && x <= p.x1 + 6,
    );
    if (perch)
      return { x: clamp(x, perch.x0, perch.x1), y: perch.y, land: true };
    if (y >= ground - 8)
      return { x: clamp(x, 10, width - 10), y: ground, land: true };
    return {
      x: clamp(x, 10, width - 10),
      y: clamp(y, 16, ground - 4),
      land: false,
    };
  }

  function idle(r: Raven, dt: number) {
    if (r.act) {
      r.actLeft -= dt;
      if (r.actLeft <= 0) r.act = null;
      return;
    }
    r.nextAct -= dt;
    if (r.nextAct > 0) return;
    r.nextAct = random(1.5, 4.5);
    const onGround = r.y >= backdrop.ground - 0.5;
    if (onGround && Math.random() < 0.6) {
      r.act = "peck";
      r.actLeft = 0.5;
    } else if (Math.random() < 0.3) {
      say(r, "Krah!");
    }
  }

  function lead(dt: number) {
    const r = leader;
    const dx = (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0);
    const dy = (keys.has("down") ? 1 : 0) - (keys.has("up") ? 1 : 0);
    if (dx || dy) {
      if (!r.flying && (dx || dy < 0)) takeOff(r);
      if (!r.flying) return;
      r.target = null;
      r.rest = 1.5;
      const k = Math.min(1, dt * 6);
      r.vx += (dx * 55 - r.vx) * k;
      r.vy += (dy * 55 - r.vy) * k;
      move(r, dt);
      if (dy > 0 && r.y >= backdrop.ground) land(r, backdrop.ground);
      return;
    }
    if (r.flying && r.target) {
      if (steerTo(r, r.target, 48, dt)) {
        if (r.target.land) land(r, r.target.y);
        else {
          r.target = null;
          r.rest = random(0.8, 2);
        }
      }
      return;
    }
    if (r.flying) {
      // Hovering after a key or a point in the sky.
      brake(r, dt);
      r.rest -= dt;
      if (r.y >= backdrop.ground - 0.5) land(r, backdrop.ground);
      else if (r.rest <= 0 && control <= 0) wander(r);
      return;
    }
    r.rest -= dt;
    if (r.rest <= 0 && control <= 0) wander(r);
    else idle(r, dt);
  }

  /** Where the second raven sits down next to the first. */
  function followerSpot() {
    const { perches, ground } = backdrop;
    const l = leader;
    const perch = perches.find(
      (p) => p.y === l.y && l.x >= p.x0 && l.x <= p.x1,
    );
    if (perch && perch.x1 - perch.x0 >= 30) {
      const behind = l.x - 18 * l.facing;
      const x =
        behind >= perch.x0 && behind <= perch.x1 ? behind : l.x + 18 * l.facing;
      return { x: clamp(x, perch.x0, perch.x1), y: perch.y };
    }
    // No room up there: wait on the ground below.
    const grounds = perches.filter((p) => p.y === ground);
    const best = grounds.reduce((a, b) =>
      Math.abs(clamp(l.x, a.x0, a.x1) - l.x) <=
      Math.abs(clamp(l.x, b.x0, b.x1) - l.x)
        ? a
        : b,
    );
    return { x: clamp(l.x - 10, best.x0, best.x1), y: ground };
  }

  function follow(dt: number) {
    const f = follower;
    const l = leader;
    if (l.flying) {
      takeOff(f);
      // Always a wing length behind, a little lower: as in the coat of arms.
      const t = {
        x: l.x - l.facing * 22,
        y: Math.min(l.y + 4, backdrop.ground),
      };
      steerTo(f, t, 75, dt);
      if (Math.abs(f.vx) < 3) f.facing = l.facing;
      return;
    }
    if (f.flying) {
      const spot = followerSpot();
      if (steerTo(f, spot, 60, dt)) {
        land(f, spot.y);
        f.facing = l.x >= f.x ? 1 : -1;
      }
      return;
    }
    idle(f, dt);
    f.rest -= dt;
    const ground = backdrop.ground;
    if (
      f.rest <= 0 &&
      f.y === ground &&
      l.y === ground &&
      Math.abs(l.x - f.x) < 30 &&
      !l.act &&
      !l.hopLeft
    ) {
      // Bump.
      const side = l.x >= f.x ? 1 : -1;
      f.facing = side;
      hop(f, 5 * side);
      later.push({
        left: 0.25,
        run: () => {
          if (leader.flying) return;
          leader.facing = side === 1 ? -1 : 1;
          hop(leader, 6 * side);
          say(leader, "Hey!");
        },
      });
      f.rest = random(6, 12);
    }
  }

  function tick(r: Raven, dt: number) {
    r.clock += dt;
    if (r.bubble) {
      r.bubble.left -= dt;
      if (r.bubble.left <= 0) r.bubble = null;
    }
    r.nextBlink -= dt;
    if (r.nextBlink <= 0) {
      r.blinkLeft = 0.15;
      r.nextBlink = random(2, 5);
    }
    r.blinkLeft = Math.max(0, r.blinkLeft - dt);
    if (r.hopLeft > 0) {
      const step = Math.min(dt, r.hopLeft);
      r.x = clamp(r.x + (r.hopDx / HOP) * step, 10, width - 10);
      r.hopLeft -= step;
    }
  }

  function update(dt: number) {
    time += dt;
    for (let i = later.length - 1; i >= 0; i--) {
      later[i].left -= dt;
      if (later[i].left <= 0) later.splice(i, 1)[0].run();
    }
    if (intro > 0) {
      intro -= dt;
      if (intro <= 0) {
        say(leader, "Krah!");
        later.push({ left: 0.4, run: () => say(follower, "Krah!") });
        if (!leader.target) wander(leader);
      }
    } else {
      control = Math.max(0, control - dt);
      lead(dt);
      follow(dt);
    }
    tick(leader, dt);
    tick(follower, dt);
  }

  /* ---------- Drawing ---------- */

  function poseOf(r: Raven): Pose {
    if (r.flying) return Math.floor(r.clock * 8) % 2 ? "flyUp" : "flyDown";
    if (r.act) return r.act;
    return r.blinkLeft > 0 ? "blink" : "sit";
  }

  function draw() {
    if (!width) return;
    view.drawImage(base, 0, 0);
    const span = width + 20;
    for (const c of backdrop.clouds) {
      const x = ((((c.x + time * c.speed) % span) + span) % span) - 16;
      view.drawImage(
        c.small ? cloudSmallImage : cloudImage,
        Math.round(x),
        c.y,
      );
    }
    const ravens = [leader, follower].sort((a, b) => a.y - b.y);
    for (const r of ravens) {
      const image = frames.get(
        `${poseOf(r)}-${r.scarf}-${r.facing > 0 ? "r" : "l"}`,
      );
      if (!image) continue;
      const hopY =
        r.hopLeft > 0 ? Math.sin((Math.PI * r.hopLeft) / HOP) * 4 : 0;
      const bob = intro > 0 ? Math.sin(time * 5 + (r.scarf ? 1 : 0)) * 1.2 : 0;
      view.drawImage(
        image,
        Math.round(r.x - image.width / 2),
        Math.round(r.y - image.height - hopY + bob),
      );
    }
    for (const r of ravens) {
      if (!r.bubble) continue;
      const image = r.bubble.image;
      const x = clamp(
        Math.round(r.x - image.width / 2 + r.facing * 4),
        1,
        width - image.width - 1,
      );
      const y = Math.max(1, Math.round(r.y - 15 - image.height));
      view.drawImage(image, x, y);
    }
  }

  /* ---------- Loop ---------- */

  function step(now: number) {
    frame = requestAnimationFrame(step);
    const dt = (now - last) / 1000;
    if (dt < 1 / 32) return; // about 30 frames per second are plenty
    last = now;
    update(Math.min(dt, 0.1));
    draw();
  }

  function sync() {
    const run = enabled && !paused && onScreen && !document.hidden;
    if (run && !frame) {
      last = performance.now();
      frame = requestAnimationFrame(step);
    } else if (!run && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function enable() {
    enabled = true;
    surface.hidden = false;
    stills.forEach((still) => (still.style.display = "none"));
    panel.hidden = false;
    root.tabIndex = -1;
    root.setAttribute("role", "application");
    root.setAttribute(
      "aria-label",
      "Rabenbühne. Pfeiltasten: fliegen. Leertaste: Krah. Escape: zurück zum Knopf.",
    );
    root.setAttribute("aria-describedby", "buehne-hilfe");
    resize();
    sync();
  }

  function disable() {
    enabled = false;
    surface.hidden = true;
    stills.forEach((still) => (still.style.display = ""));
    panel.hidden = true;
    root.removeAttribute("tabindex");
    root.removeAttribute("role");
    root.removeAttribute("aria-label");
    root.removeAttribute("aria-describedby");
    keys.clear();
    sync();
  }

  function setPaused(value: boolean) {
    paused = value;
    pause.setAttribute("aria-pressed", String(value));
    pause.textContent = value ? "Weiter" : "Pause";
    sync();
  }

  /* ---------- Input ---------- */

  const keyMap: Record<string, string> = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    a: "left",
    d: "right",
    w: "up",
    s: "down",
  };

  root.addEventListener("keydown", (event) => {
    if (!enabled || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape") {
      steer.focus();
      return;
    }
    if (paused) return;
    const key =
      keyMap[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (key) {
      event.preventDefault();
      keys.add(key);
      control = CONTROL;
    } else if (event.key === " ") {
      event.preventDefault();
      if (event.repeat) return;
      control = CONTROL;
      say(leader, "Krah!");
      later.push({ left: 0.5, run: () => say(follower, "Krah?") });
    }
  });

  root.addEventListener("keyup", (event) => {
    const key =
      keyMap[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (key) keys.delete(key);
  });

  root.addEventListener("blur", () => keys.clear());

  surface.addEventListener("click", (event) => {
    if (!enabled || paused) return;
    const box = surface.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * width;
    const y = ((event.clientY - box.top) / box.height) * height;
    control = CONTROL;
    const hit = [leader, follower].find(
      (r) => Math.abs(r.x - x) <= 10 && y <= r.y + 1 && y >= r.y - 15,
    );
    if (hit) {
      say(hit, "Krah!");
      return;
    }
    if (intro > 0) intro = 0.01;
    leader.target = clickTarget(x, y);
    takeOff(leader);
  });

  steer.addEventListener("click", () => {
    setPaused(false);
    root.focus();
  });

  pause.addEventListener("click", () => setPaused(!paused));

  new ResizeObserver(() => {
    if (enabled) resize();
  }).observe(root);

  new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    sync();
  }).observe(root);

  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", () =>
    motion.matches ? disable() : enable(),
  );

  if (!motion.matches) enable();
}
