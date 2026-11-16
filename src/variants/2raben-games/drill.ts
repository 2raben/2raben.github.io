/**
 * The key warm-ups on the game pages: a small pixel canvas per game where the
 * keys from the game's controls table move a motorbike or a car, and a raven
 * comments. Not the games themselves: no traps, no traffic, no score.
 *
 * Optional, as ADR 0004 asks: the warm-up stays hidden without script or
 * without a 2D canvas. Keys are handled only while the warm-up has focus, the
 * scene only moves while it has focus, and nothing is stored or sent.
 */
import {
  bubbleRuns,
  bubbleSize,
  car,
  composeBackdrop,
  flame,
  layer,
  motorbike,
  palette,
  ravenKrah,
  ravenSit,
  ravenTop,
  recolor,
  scarf,
  spriteRuns,
  spriteSize,
  type Run,
  type Sprite,
} from "./pixels";

const W = 160;
const H = 80;

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

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** What a game's scene needs from the shared frame around it. */
interface Scene {
  press(action: string, repeat: boolean): void;
  release(action: string): void;
  update(dt: number): void;
  draw(view: CanvasRenderingContext2D): void;
  /** A pointer over the scene, in scene pixels; only for the mouse. */
  hover?(x: number, y: number): void;
}

/** A speech bubble that one scene shows for a moment. */
function bubbles() {
  const cache = new Map<string, HTMLCanvasElement>();
  let current: { image: HTMLCanvasElement; left: number } | null = null;
  return {
    say(text: string) {
      let image = cache.get(text);
      if (!image) {
        const { w, h } = bubbleSize(text);
        image = paint(bubbleRuns(text), w, h);
        cache.set(text, image);
      }
      current = { image, left: 1.2 };
    },
    update(dt: number) {
      if (current && (current.left -= dt) <= 0) current = null;
    },
    get showing() {
      return current !== null;
    },
    /** Draws the bubble with its tail at (x, y). */
    draw(view: CanvasRenderingContext2D, x: number, y: number) {
      if (!current) return;
      const { image } = current;
      view.drawImage(
        image,
        clamp(Math.round(x - image.width / 2), 1, W - image.width - 1),
        Math.max(1, Math.round(y - image.height)),
      );
    },
  };
}

/* ---------- Moto Devil ---------- */

function motoScene(status: (text: string) => void): Scene {
  const backdrop = composeBackdrop(W, H);
  const ground = backdrop.ground;
  // A ramp rising to the right, then a drop back to the ground.
  const ramp = { x0: 96, x1: 124, rise: 10 };
  const surface = (x: number) =>
    x >= ramp.x0 && x < ramp.x1
      ? ground - Math.round(((x - ramp.x0) / (ramp.x1 - ramp.x0)) * ramp.rise)
      : ground;
  const slope = (x: number) =>
    x >= ramp.x0 && x < ramp.x1 ? -Math.atan2(ramp.rise, ramp.x1 - ramp.x0) : 0;
  const rampRuns: Run[] = [];
  for (let x = ramp.x0; x < ramp.x1; x++) {
    const top = surface(x);
    rampRuns.push({ x, y: top, w: 1, h: ground - top, color: palette.e });
    rampRuns.push({ x, y: top, w: 1, h: 1, color: palette.k });
  }
  rampRuns.push({
    x: ramp.x1 - 1,
    y: ground - ramp.rise,
    w: 1,
    h: ramp.rise,
    color: palette.k,
  });
  const base = paint(
    [
      ...backdrop.runs,
      ...backdrop.props.flatMap((p) => spriteRuns(p.sprite, p.x, p.y)),
      ...rampRuns,
    ],
    W,
    H,
  );
  const bike = paintSprite(motorbike);
  const flames = flame.map((f) => paintSprite(f));
  // The raven with the scarf sits on the rightmost fir and comments.
  const perch = backdrop.perches
    .filter((p) => p.x0 === p.x1 && p.x0 <= W - 14)
    .reduce((a, b) => (b.x0 > a.x0 ? b : a));
  const sitting = paintSprite(layer(ravenSit, scarf.sit), true);
  const calling = paintSprite(layer(ravenKrah, scarf.krah), true);
  const bubble = bubbles();

  const start = { x: 24 };
  const s = {
    x: start.x,
    y: ground,
    vx: 0,
    vy: 0,
    angle: 0,
    spin: 0,
    dir: 1 as 1 | -1,
    air: false,
    jetFor: 0,
    crashed: 0,
    time: 0,
  };
  const held = new Set<string>();

  function say(text: string, words: string) {
    bubble.say(text);
    status(words);
  }

  function reset() {
    Object.assign(s, {
      x: start.x,
      y: ground,
      vx: 0,
      vy: 0,
      angle: 0,
      spin: 0,
      dir: 1,
      air: false,
      jetFor: 0,
      crashed: 0,
    });
  }

  /** The angle between two directions, in -π..π. */
  const turnBetween = (a: number, b: number) =>
    Math.atan2(Math.sin(a - b), Math.cos(a - b));

  return {
    press(action, repeat) {
      if (s.crashed) return;
      if (repeat && action !== "jump") return;
      held.add(action);
      if (action === "jump" && !repeat && !s.air) {
        s.air = true;
        s.vy = -78;
        s.spin = 0;
        say("HOPP!", "Springen");
      } else if (action === "turn" && !repeat) {
        s.dir = s.dir === 1 ? -1 : 1;
        s.vx *= -0.3;
        say("WENDE!", "Umgedreht");
      } else if (action === "restart" && !repeat) {
        reset();
        say("NEU!", "Level neu gestartet");
      } else if (action === "gas" && !repeat) {
        status("Gas");
      } else if (action === "brake" && !repeat) {
        status("Bremsen");
      }
    },
    release(action) {
      held.delete(action);
      if (action === "jump") s.jetFor = 0;
    },
    update(dt) {
      s.time += dt;
      bubble.update(dt);
      if (s.crashed) {
        s.crashed -= dt;
        if (s.crashed <= 0) reset();
        return;
      }
      const tilt = (held.has("forward") ? 1 : 0) - (held.has("back") ? 1 : 0);
      if (held.has("gas")) s.vx += s.dir * 90 * dt;
      if (held.has("brake")) s.vx -= s.vx * Math.min(1, 4 * dt);
      s.vx = clamp(s.vx, -80, 80);

      if (!s.air) {
        s.vx -= s.vx * Math.min(1, 0.7 * dt);
        let x = s.x + s.vx * dt;
        // The drop side of the ramp is a wall when riding left.
        if (surface(x) < surface(s.x) - 2) {
          x = s.x;
          s.vx = 0;
        }
        const before = surface(s.x);
        s.x = x;
        if (surface(s.x) > before + 2 && s.vx > 0) {
          // Off the end of the ramp: into the air.
          s.air = true;
          s.vy = -Math.abs(s.vx) * 0.45;
          s.spin = 0;
          s.y = before;
        } else {
          s.y = surface(s.x);
          // On the ground, tilting only leans the bike a little: A to the
          // left, D to the right, as in the air.
          s.angle += (slope(s.x) + tilt * 0.4 - s.angle) * Math.min(1, dt * 10);
        }
      } else {
        // Holding Space after the jump fires the jet.
        if (held.has("jump")) {
          s.jetFor += dt;
          if (s.jetFor > 0.25) {
            s.vy -= 260 * dt;
            if (s.jetFor - dt <= 0.25) say("WUSCH!", "Düsenschub");
          }
        }
        s.vy = Math.max(s.vy + 180 * dt, -70);
        s.x += s.vx * dt;
        s.y = Math.max(16, s.y + s.vy * dt);
        const turn = tilt * 6 * dt;
        s.angle += turn;
        s.spin += turn;
        if (s.y >= surface(s.x) && s.vy > 0) {
          s.y = surface(s.x);
          s.air = false;
          s.vy = 0;
          if (Math.abs(turnBetween(s.angle, slope(s.x))) > 1.1) {
            s.crashed = 0.9;
            say("UPS!", "Gestürzt, zurück zum Start");
          } else if (Math.abs(s.spin) > Math.PI * 1.7) {
            say("SALTO!", "Salto!");
          }
          s.angle = slope(s.x);
          s.spin = 0;
        }
      }
      // Off one edge, on at the other.
      if (s.x > W + 10) s.x = -10;
      if (s.x < -10) s.x = W + 10;
      if (!s.air) s.y = surface(clamp(s.x, 0, W - 1));
    },
    draw(view) {
      view.drawImage(base, 0, 0);
      const talking = bubble.showing;
      view.drawImage(
        talking ? calling : sitting,
        perch.x0 - 8,
        perch.y - sitting.height,
      );
      view.save();
      view.translate(Math.round(s.x), Math.round(s.y));
      view.rotate(s.crashed ? s.dir * 1.6 : s.angle);
      view.scale(s.dir, 1);
      if (s.air && held.has("jump") && s.jetFor > 0.25) {
        const f = flames[Math.floor(s.time * 12) % 2];
        view.drawImage(f, -10 - f.width, -6);
      }
      view.drawImage(bike, -10, -bike.height);
      view.restore();
      bubble.draw(view, perch.x0 - 4, perch.y - sitting.height - 1);
    },
  };
}

/* ---------- Car Drive ---------- */

function carScene(status: (text: string) => void): Scene {
  const road = { x: 50, w: 60 };
  const laneX = (lane: number) => road.x + lane * 20 + 10;
  const laneNames = ["linken", "mittleren", "rechten"];
  const carImage = paintSprite(recolor(car, { s: "r" }));
  const flames = flame.map((f) =>
    paintSprite(f.map((row) => [...row].reverse().join(""))),
  );
  const raven = paintSprite(ravenTop);
  const shadow = paint(
    spriteRuns(ravenTop).map((r) => ({ ...r, color: "rgb(0 0 0 / 0.25)" })),
    raven.width,
    raven.height,
  );
  const bubble = bubbles();
  const s = { lane: 1, x: laneX(1), y: 60, scroll: 0, boost: 0, time: 0 };

  function setLane(lane: number) {
    const next = clamp(lane, 0, 2);
    if (next === s.lane) return;
    s.lane = next;
    status(`Auf der ${laneNames[next]} Spur`);
  }

  function drawRoad(view: CanvasRenderingContext2D) {
    view.fillStyle = palette.H;
    view.fillRect(0, 0, W, H);
    view.fillStyle = palette.a;
    view.fillRect(road.x, 0, road.w, H);
    view.fillStyle = palette.w;
    view.fillRect(road.x, 0, 1, H);
    view.fillRect(road.x + road.w - 1, 0, 1, H);
    const offset = Math.floor(s.scroll) % 10;
    view.fillStyle = palette.e;
    for (const lane of [1, 2]) {
      for (let y = offset - 10; y < H; y += 10) {
        view.fillRect(road.x + lane * 20, y, 1, 5);
      }
    }
    view.fillStyle = palette.G;
    const grass = Math.floor(s.scroll) % 16;
    for (let y = grass - 16; y < H; y += 16) {
      view.fillRect(12, y + 3, 2, 1);
      view.fillRect(34, y + 11, 2, 1);
      view.fillRect(124, y + 6, 2, 1);
      view.fillRect(146, y + 13, 2, 1);
    }
  }

  return {
    press(action, repeat) {
      if (repeat) return;
      if (action === "left") setLane(s.lane - 1);
      else if (action === "right") setLane(s.lane + 1);
      else if (action === "boost") {
        s.boost = 1.2;
        bubble.say("BOOST!");
        status("Boost!");
      } else if (action === "restart") {
        s.lane = 1;
        s.boost = 0;
        bubble.say("NEU!");
        status("Neustart");
      }
    },
    release() {},
    update(dt) {
      s.time += dt;
      bubble.update(dt);
      s.boost = Math.max(0, s.boost - dt);
      s.scroll += (s.boost ? 130 : 45) * dt;
      s.x += (laneX(s.lane) - s.x) * Math.min(1, dt * 12);
      s.y += ((s.boost ? 48 : 60) - s.y) * Math.min(1, dt * 6);
    },
    draw(view) {
      drawRoad(view);
      const cx = Math.round(s.x - carImage.width / 2);
      const cy = Math.round(s.y);
      if (s.boost) {
        const f = flames[Math.floor(s.time * 12) % 2];
        // The flame points down, behind the car.
        view.save();
        view.translate(cx + carImage.width / 2, cy + carImage.height);
        view.rotate(Math.PI / 2);
        view.drawImage(f, 0, -Math.floor(f.height / 2));
        view.restore();
      }
      view.drawImage(carImage, cx, cy);
      // The raven glides over the grass beside the road: the bird's-eye view.
      const rx = 14;
      const ry = Math.round(20 + Math.sin(s.time * 1.5) * 4);
      view.drawImage(shadow, rx + 5, ry + 6);
      view.drawImage(raven, rx, ry);
      bubble.draw(view, rx + raven.width / 2, ry - 1);
    },
    hover(x) {
      if (x >= road.x && x < road.x + road.w) {
        setLane(Math.floor((x - road.x) / 20));
      }
    },
  };
}

/* ---------- The frame around both ---------- */

const keyActions: Record<string, Record<string, string>> = {
  moto: {
    w: "gas",
    arrowup: "gas",
    s: "brake",
    arrowdown: "brake",
    a: "back",
    arrowleft: "back",
    d: "forward",
    arrowright: "forward",
    " ": "jump",
    e: "turn",
    r: "restart",
  },
  car: {
    a: "left",
    arrowleft: "left",
    d: "right",
    arrowright: "right",
    " ": "boost",
    r: "restart",
  },
};

export function mountDrill(root: HTMLElement) {
  const game = root.dataset.drill === "car" ? "car" : "moto";
  const canvas = root.querySelector<HTMLCanvasElement>("canvas");
  const ctx = canvas?.getContext("2d");
  const live = root.querySelector<HTMLElement>("[data-drill-status]");
  if (!canvas || !ctx) return;
  const view = ctx;
  const surface = canvas;
  canvas.width = W;
  canvas.height = H;
  view.imageSmoothingEnabled = false;

  const status = (text: string) => {
    if (live) live.textContent = text;
  };
  const scene = game === "car" ? carScene(status) : motoScene(status);
  const actions = keyActions[game];
  let frame = 0;
  let last = 0;
  let active = false;

  function resize() {
    const box = surface.parentElement;
    if (!box?.clientWidth) return;
    const style = getComputedStyle(box);
    const room =
      box.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight);
    const scale = Math.max(1, Math.floor(room / W));
    surface.style.width = `${W * scale}px`;
    surface.style.height = `${H * scale}px`;
  }

  function step(now: number) {
    frame = requestAnimationFrame(step);
    const dt = (now - last) / 1000;
    if (dt < 1 / 32) return;
    last = now;
    scene.update(Math.min(dt, 0.1));
    scene.draw(view);
  }

  function setActive(value: boolean) {
    active = value;
    root.dataset.active = String(value);
    if (value && !frame) {
      last = performance.now();
      frame = requestAnimationFrame(step);
    } else if (!value && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      for (const action of new Set(Object.values(actions)))
        press(action, false);
    }
  }

  const button = (action: string) =>
    root.querySelector<HTMLElement>(`[data-action="${action}"]`);

  /** Presses (down) or releases (up) an action, and shows it on its key. */
  function press(action: string, down: boolean, repeat = false) {
    if (down) scene.press(action, repeat);
    else scene.release(action);
    button(action)?.classList.toggle("is-pressed", down);
  }

  root.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Escape") {
      root.blur();
      return;
    }
    const action = actions[event.key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    press(action, true, event.repeat);
  });
  root.addEventListener("keyup", (event) => {
    const action = actions[event.key.toLowerCase()];
    if (action) press(action, false);
  });

  // The on-screen keys work by pointer too, held as long as they are pressed.
  for (const key of root.querySelectorAll<HTMLElement>("[data-action]")) {
    const action = key.dataset.action ?? "";
    key.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      root.focus();
      key.setPointerCapture(event.pointerId);
      press(action, true);
    });
    const up = () => {
      if (key.classList.contains("is-pressed")) press(action, false);
    };
    key.addEventListener("pointerup", up);
    key.addEventListener("pointercancel", up);
    key.addEventListener("lostpointercapture", up);
  }

  surface.addEventListener("pointerdown", () => root.focus());
  surface.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || !active || !scene.hover) return;
    const box = surface.getBoundingClientRect();
    scene.hover(
      ((event.clientX - box.left) / box.width) * W,
      ((event.clientY - box.top) / box.height) * H,
    );
  });

  root.addEventListener("focus", () => setActive(true));
  root.addEventListener("blur", () => setActive(false));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) setActive(false);
    else if (document.activeElement === root) setActive(true);
  });
  new ResizeObserver(resize).observe(root);

  root.hidden = false;
  resize();
  scene.update(0);
  scene.draw(view);
}
