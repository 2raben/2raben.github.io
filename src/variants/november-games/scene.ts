import {
  abbeyPose,
  eyeHeight,
  focal,
  labelText,
  landscapeLayout,
  layoutLabels,
  monasteryFrom,
  ridges as ridgeShapes,
  riverHalf,
  riverPoint,
  skiJumpFrom,
  toCamera,
  valleyX,
  viewFor,
  type LandmarkShape,
  type View,
} from "./landmarks";
import { panoramaPeaks } from "./panorama";

/** Turning limits in degrees: left reaches Druesberg, right the Sihltal hills. */
const turnLimits = [-35, 20] as const;

/** A bounded, local canvas scene. The SVG underneath remains if 2D is unavailable. */
export function mountScene(root: HTMLElement, isMoving: () => boolean) {
  const canvas = root.querySelector<HTMLCanvasElement>("canvas");
  const context = canvas?.getContext("2d");
  if (!canvas || !context) {
    document
      .querySelector("[data-scene-controls]")
      ?.removeAttribute("data-enhanced");
    return () => {};
  }
  const ctx = context;
  const surface = canvas;
  const control = document.querySelector<HTMLButtonElement>(
    "[data-scene-control]",
  );
  // Compile the same paths that render the static SVG, once per page.
  const compile = (shapes: LandmarkShape[]) =>
    shapes.map((shape) => ({ ...shape, path: new Path2D(shape.d) }));
  const ridges = compile(ridgeShapes);
  const glowPad = 40;

  /** Bounding box of a set of scene-unit paths (only coordinate pairs). */
  function bounds(shapes: { d: string }[]) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const { d } of shapes) {
      const numbers = d.match(/-?\d+(?:\.\d+)?/g) ?? [];
      for (let i = 0; i + 1 < numbers.length; i += 2) {
        const x = Number(numbers[i]);
        const y = Number(numbers[i + 1]);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    return { minX, minY, maxX, maxY };
  }

  type Sprite = {
    image: HTMLCanvasElement;
    key: string;
    left: number;
    top: number;
    pixels: number;
  };
  const sprites = new Map<string, Sprite>();

  /** The screen around a sprite placed at (x, y), with room for its glow. */
  const screenFrom = (x: number, y: number, slack = 0) => ({
    left: -x - glowPad,
    top: -y - glowPad - slack,
    right: width - x + glowPad,
    bottom: height - y + glowPad + slack,
  });

  // Neon glow is expensive, so each layer is drawn once per size and view
  // and reused until either changes. Layers that do not pan with the view
  // are cut to `visible`: turned close and far to the side, a drawing can
  // reach thousands of pixels past the screen.
  function sprite(
    name: string,
    variant: string,
    build: () => ReturnType<typeof compile>,
    scale: number,
    maxRatio: number,
    visible?: ReturnType<typeof screenFrom>,
  ) {
    const pixels = Math.min(ratio, maxRatio);
    const key = `${variant}:${scale}:${pixels}:${width}x${height}`;
    const cached = sprites.get(name);
    if (cached?.key === key) return cached;
    const shapes = build();
    const box = bounds(shapes);
    const image = cached?.image ?? document.createElement("canvas");
    const left = Math.max(
      box.minX * scale - glowPad,
      visible?.left ?? -Infinity,
    );
    const top = Math.max(box.minY * scale - glowPad, visible?.top ?? -Infinity);
    const right = Math.min(
      box.maxX * scale + glowPad,
      visible?.right ?? Infinity,
    );
    const bottom = Math.min(
      box.maxY * scale + glowPad,
      visible?.bottom ?? Infinity,
    );
    image.width = Math.max(1, Math.ceil((right - left) * pixels));
    image.height = Math.max(1, Math.ceil((bottom - top) * pixels));
    const layer = image.getContext("2d");
    const result = { image, key, left, top, pixels };
    sprites.set(name, result);
    if (!layer) return result;
    layer.setTransform(
      pixels * scale,
      0,
      0,
      pixels * scale,
      -left * pixels,
      -top * pixels,
    );
    layer.lineJoin = "round";
    layer.lineCap = "round";
    const glowScale = pixels * Math.min(1, 0.4 + scale);
    for (const shape of shapes) {
      if (shape.fill !== "none") {
        layer.fillStyle = shape.fill;
        layer.fill(shape.path);
      }
      layer.strokeStyle = shape.stroke;
      layer.lineWidth = shape.width;
      if (shape.glow) {
        layer.shadowColor = shape.stroke;
        layer.shadowBlur = shape.glow * glowScale;
        layer.stroke(shape.path);
      }
      layer.shadowBlur = 0;
      layer.stroke(shape.path);
    }
    return result;
  }

  function place(item: Sprite, x: number, y: number) {
    ctx.drawImage(
      item.image,
      x + item.left,
      y + item.top,
      item.image.width / item.pixels,
      item.image.height / item.pixels,
    );
  }

  /** Mountain names and heights, laid out in screen pixels for this scale. */
  type Label = (typeof panoramaPeaks)[number] & {
    width: number;
    baseline: number;
  };
  let labelCache: { scale: number; labels: Label[] } = {
    scale: 0,
    labels: [],
  };
  const labelFont = '600 11px "Courier New", monospace';
  function inscriptions(scale: number, x: number, y: number) {
    ctx.font = labelFont;
    if (labelCache.scale !== scale)
      labelCache = {
        scale,
        labels: layoutLabels(
          panoramaPeaks.map((peak) => ({
            ...peak,
            x: peak.x * scale,
            y: peak.y * scale,
            width: ctx.measureText(labelText(peak)).width,
          })),
        ),
      };
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.lineWidth = 1;
    for (const label of labelCache.labels) {
      const left = x + label.x;
      if (left < -100 || left > width + 100) continue;
      // Names fade out behind the headline and return when the view turns.
      ctx.globalAlpha = Math.max(
        0.2,
        Math.min(1, (left - width * 0.3) / (width * 0.12)),
      );
      ctx.strokeStyle = "#9ff8ff8c";
      ctx.beginPath();
      ctx.moveTo(left, y + label.y - 4);
      ctx.lineTo(left, y + label.baseline + 4);
      ctx.stroke();
      ctx.fillStyle = "#9ff8ff";
      ctx.beginPath();
      ctx.arc(left, y + label.y - 4, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e9fbff";
      ctx.shadowColor = "#3cf2ff";
      ctx.shadowBlur = 6;
      ctx.fillText(labelText(label), left, y + label.baseline);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  let width = 800;
  let height = 600;
  let ratio = 1;
  let phase = 0;
  let clock = 0;
  let lastTime = 0;
  let frame = 0;
  const zurich = new Intl.DateTimeFormat("de-CH", {
    timeZone: "Europe/Zurich",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });
  const clockTime = () => {
    const parts = zurich.formatToParts(new Date());
    const part = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? 0);
    return { hours: part("hour"), minutes: part("minute") };
  };
  let visible = false;
  let cameraX = 0;
  let cameraY = 0;
  let targetX = 0;
  let targetY = 0;
  let turn = 0;
  let targetTurn = 0;
  // The floor grid drifts towards the viewer; offsets in metres, modulo 8.
  let flowX = 0;
  let flowZ = 0;
  const pulses: { x: number; y: number; age: number }[] = [];
  const stars = Array.from({ length: 90 }, (_, i) => ({
    x: ((i * 173 + 47) % 997) / 997,
    y: ((i * 139 + 23) % 991) / 991,
    radius: i % 7 === 0 ? 1.8 : i % 3 === 0 ? 1.1 : 0.7,
    color: i % 11 === 0 ? "#7ff3ff" : i % 13 === 0 ? "#ff9ee6" : "#efe4ff",
  }));

  function line(
    points: number[][],
    color: string | CanvasGradient,
    lineWidth = 1,
  ) {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  /** Projects ground points (metres) with the near-field camera. */
  type Ground = {
    camera: View;
    originX: number;
    horizon: number;
    f: number;
    nearClip: number;
  };
  const onScreen = (g: Ground, xc: number, zc: number) => [
    g.originX + (g.f * xc) / zc,
    g.horizon + (g.f * eyeHeight) / zc,
  ];

  /** Adds a ground line, clipped just in front of the camera, to the path. */
  function groundLine(
    g: Ground,
    path: Path2D,
    from: [number, number],
    to: [number, number],
  ) {
    let [ax, , az] = toCamera(g.camera, [from[0], 0, from[1]]);
    let [bx, , bz] = toCamera(g.camera, [to[0], 0, to[1]]);
    if (az < g.nearClip && bz < g.nearClip) return;
    if (az < g.nearClip) {
      ax += ((bx - ax) * (g.nearClip - az)) / (bz - az);
      az = g.nearClip;
    } else if (bz < g.nearClip) {
      bx += ((ax - bx) * (g.nearClip - bz)) / (az - bz);
      bz = g.nearClip;
    }
    const [x0, y0] = onScreen(g, ax, az);
    const [x1, y1] = onScreen(g, bx, bz);
    path.moveTo(x0, y0);
    path.lineTo(x1, y1);
  }

  /** Grid lines of one direction that cross the view up to `far` metres. */
  function gridRange(g: Ground, far: number, axis: 0 | 1, offset: number) {
    const left = -(g.originX + 40) / g.f;
    const right = (width - g.originX + 40) / g.f;
    const values = [g.nearClip, far].flatMap((zc) =>
      [left * zc, right * zc].map((xc) => {
        const cos = Math.cos(g.camera.yaw);
        const sin = Math.sin(g.camera.yaw);
        return axis === 0
          ? g.camera.x + xc * cos + zc * sin
          : g.camera.z - xc * sin + zc * cos;
      }),
    );
    const first = Math.ceil((Math.min(...values) - offset) / 8);
    const last = Math.floor((Math.max(...values) - offset) / 8);
    return { first, last, at: (k: number) => offset + k * 8 };
  }

  /** The 8 m floor grid in the same perspective as the monastery. */
  function floorGrid(g: Ground) {
    const { x, z } = g.camera;
    const bottom = (g.f * eyeHeight) / (height - g.horizon);
    const fade = (from: string, to: string) => {
      const gradient = ctx.createLinearGradient(0, g.horizon, 0, height);
      gradient.addColorStop(0, from);
      gradient.addColorStop(1, to);
      return gradient;
    };
    // Lines across the view: brighter towards the viewer.
    const across = new Path2D();
    const rows = gridRange(g, 560, 1, flowZ);
    for (let k = rows.first; k <= rows.last; k++)
      groundLine(g, across, [x - 3000, rows.at(k)], [x + 3000, rows.at(k)]);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = fade(
      "rgba(255, 70, 215, 0.18)",
      "rgba(255, 70, 215, 0.83)",
    );
    ctx.stroke(across);
    // Lines into the distance, every fifth one cyan.
    const pink = new Path2D();
    const cyan = new Path2D();
    const columns = gridRange(g, bottom * 2.5, 0, flowX);
    for (let k = columns.first; k <= columns.last; k++)
      groundLine(
        g,
        k % 5 === 0 ? cyan : pink,
        [columns.at(k), z - 3000],
        [columns.at(k), z + 6000],
      );
    ctx.lineWidth = 1;
    ctx.strokeStyle = fade(
      "rgba(255, 63, 208, 0.3)",
      "rgba(255, 63, 208, 0.6)",
    );
    ctx.stroke(pink);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = fade(
      "rgba(60, 242, 255, 0.4)",
      "rgba(60, 242, 255, 0.7)",
    );
    ctx.stroke(cyan);
  }

  /**
   * The Alp in the near-field perspective. Its distant part bends to meet the
   * valley in the tele panorama at `valley` (screen x); nearby it stays in 3D.
   */
  function river(g: Ground, valley: number) {
    const steps = 60;
    // Each point holds both banks on screen, 3 m to either side on the ground.
    const points: { left: number[]; right: number[] }[] = [];
    let shift = 0;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const [x, , z] = riverPoint(t, valleyX);
      const ahead = riverPoint(Math.min(1, t + 0.005), valleyX);
      const behind = riverPoint(Math.max(0, t - 0.005), valleyX);
      const [dx, dz] = [ahead[0] - behind[0], ahead[2] - behind[2]];
      const length = Math.hypot(dx, dz);
      const [nx, nz] = [(-dz / length) * riverHalf, (dx / length) * riverHalf];
      const banks = [
        [x + nx, z + nz],
        [x - nx, z - nz],
      ].map(([bx, bz]) => toCamera(g.camera, [bx, 0, bz]));
      if (banks.some(([, , zc]) => zc < g.nearClip)) break;
      const [left, right] = banks.map(([xc, , zc]) => onScreen(g, xc, zc));
      if (i === 0) {
        // Meet the valley while it is near; when a turn has panned it far
        // away, let go rather than drag the river across the floor.
        const gap = valley - (left[0] + right[0]) / 2;
        shift = gap / (1 + (gap / (width * 0.2)) ** 2);
      }
      const bend = shift * (1 - t) ** 3;
      left[0] += bend;
      right[0] += bend;
      points.push({ left, right });
      if (Math.min(left[1], right[1]) > height + 40) break;
    }
    if (points.length < 2) return;
    ctx.beginPath();
    points.forEach(({ left: [x, y] }, i) =>
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
    );
    for (let i = points.length - 1; i >= 0; i--)
      ctx.lineTo(points[i].right[0], points[i].right[1]);
    ctx.closePath();
    const water = ctx.createLinearGradient(0, g.horizon, 0, height);
    water.addColorStop(0, "#9ff8ffee");
    water.addColorStop(0.35, "#2fb8e8b3");
    water.addColorStop(1, "#3b2fc299");
    ctx.fillStyle = water;
    ctx.fill();
    // Two passes fake the neon glow cheaply on every frame.
    for (const [lineWidth, color] of [
      [7, "#3cf2ff2e"],
      [1.6, "#9ff8ff"],
    ] as const) {
      for (const side of ["left", "right"] as const) {
        line(
          points.map((p) => p[side]),
          color,
          lineWidth,
        );
      }
    }
    // Light streaks drift downstream towards the viewer.
    ctx.lineCap = "round";
    const last = points.length - 1;
    for (let k = 0; k < 14; k++) {
      const u = (k / 14 + clock * 0.00008) % 1;
      const from = Math.min(last - 1, Math.floor(u * last));
      const to = Math.min(last, from + 2);
      // Across the river from 0.275 to 0.725 of its width.
      const lane = 0.5 + ((k % 3) - 1) * 0.225;
      const across = ({ left, right }: (typeof points)[number]) => [
        left[0] + (right[0] - left[0]) * lane,
        left[1] + (right[1] - left[1]) * lane,
      ];
      line(
        [across(points[from]), across(points[to])],
        `rgba(230, 253, 255, ${0.15 + u * 0.6})`,
        1 + u * 2.5,
      );
    }
    ctx.lineCap = "butt";
  }

  function draw(delta = 0) {
    phase += delta * 0.00007;
    clock += delta;
    const ease = Math.min(1, delta * 0.006);
    cameraX += (targetX - cameraX) * ease;
    cameraY += (targetY - cameraY) * ease;
    turn += (targetTurn + cameraX * 3 - turn) * Math.min(1, delta * 0.004);
    const layout = landscapeLayout(width, height);
    const { scale } = layout;
    // The panorama is a tele view, the floor and monastery a wide-angle one in
    // 3D: turning pans the panorama and moves the near-field camera
    // (viewFor). Tenths of a degree keep the monastery sprite stable at rest.
    const turned = -turn * layout.perDegree;
    const step = Math.round(turn * 10) / 10;
    const pose = abbeyPose(width, layout);
    const camera = viewFor(step, pose);
    const horizon = layout.horizon + cameraY * 8;
    const f = focal * scale;
    const ground: Ground = {
      camera,
      originX: layout.vanishX,
      horizon,
      f,
      nearClip: (f * eyeHeight) / (height - horizon) / 2,
    };
    const flow = delta * 0.00007 * 40 * 8;
    flowX = (((flowX - Math.sin(camera.yaw) * flow) % 8) + 8) % 8;
    flowZ = (((flowZ - Math.cos(camera.yaw) * flow) % 8) + 8) % 8;
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#0b0624");
    sky.addColorStop(0.45, "#2a0f52");
    sky.addColorStop(0.8, "#6a1662");
    sky.addColorStop(1, "#c42a7f");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, horizon);
    for (const [index, star] of stars.entries()) {
      const x =
        (((star.x * width + turned * 0.3 + cameraX * star.radius * 9) % width) +
          width) %
        width;
      const y = star.y * horizon * 0.8 + cameraY * 7;
      ctx.fillStyle = star.color;
      ctx.globalAlpha =
        0.35 + star.radius * 0.25 + Math.sin(clock * 0.002 + index) * 0.2;
      ctx.beginPath();
      ctx.arc(x, y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // A rare shooting star crosses the upper sky while effects are running.
    const meteor = (clock % 9000) / 900;
    if (clock > 0 && meteor < 1) {
      const mx = width * (0.25 + meteor * 0.3);
      const my = horizon * (0.08 + meteor * 0.14);
      const trail = ctx.createLinearGradient(mx - 120, my - 56, mx, my);
      trail.addColorStop(0, "#ffffff00");
      trail.addColorStop(1, `rgba(220, 250, 255, ${1 - meteor})`);
      line(
        [
          [mx - 120, my - 56],
          [mx, my],
        ],
        trail,
        1.6,
      );
    }
    const radius = layout.sunRadius;
    const sunX = layout.vanishX + turned;
    const sunY = layout.sunY + cameraY * 5;
    const halo = ctx.createRadialGradient(
      sunX,
      sunY,
      radius * 0.8,
      sunX,
      sunY,
      radius * 2.6,
    );
    halo.addColorStop(0, "#ff5fb466");
    halo.addColorStop(0.4, "#ff3fa522");
    halo.addColorStop(1, "#ff3fa500");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, horizon);
    const sunset = ctx.createLinearGradient(0, sunY - radius, 0, sunY + radius);
    sunset.addColorStop(0, "#fff1a8");
    sunset.addColorStop(0.4, "#ffa36c");
    sunset.addColorStop(0.75, "#ff3f9e");
    sunset.addColorStop(1, "#d61fd0");
    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, sunY, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = sunset;
    ctx.fillRect(sunX - radius, sunY - radius, radius * 2, radius);
    // Separated bands reveal the sky, rather than flashing or changing opacity.
    for (let band = 0; band < 7; band++) {
      const y = sunY + (band * radius) / 7;
      ctx.fillRect(
        sunX - radius,
        y,
        radius * 2,
        (radius / 7) * (0.82 - band * 0.07),
      );
    }
    ctx.restore();
    // Pink haze along the horizon behind the peaks.
    const haze = ctx.createLinearGradient(
      0,
      horizon - height * 0.2,
      0,
      horizon,
    );
    haze.addColorStop(0, "#ff3fa500");
    haze.addColorStop(1, "#ff3fa555");
    ctx.fillStyle = haze;
    ctx.fillRect(0, horizon - height * 0.2, width, height * 0.2);
    const ridgeX = layout.vanishX + turned + cameraX * 8;
    place(
      sprite("ridges", "", () => ridges, scale, 1.25),
      ridgeX,
      horizon,
    );
    inscriptions(scale, ridgeX, horizon);
    const floor = ctx.createLinearGradient(0, horizon, 0, height);
    floor.addColorStop(0, "#2a0c45");
    floor.addColorStop(0.25, "#120a2e");
    floor.addColorStop(1, "#0a0620");
    ctx.fillStyle = floor;
    ctx.fillRect(0, horizon, width, height - horizon);
    const reflection = ctx.createRadialGradient(
      sunX,
      horizon,
      0,
      sunX,
      horizon,
      width * 0.35,
    );
    reflection.addColorStop(0, "#ff4fb855");
    reflection.addColorStop(1, "#ff4fb800");
    ctx.fillStyle = reflection;
    ctx.fillRect(0, horizon, width, height - horizon);
    floorGrid(ground);
    ctx.save();
    ctx.shadowColor = "#3cf2ff";
    ctx.shadowBlur = 18;
    line(
      [
        [0, horizon],
        [width, horizon],
      ],
      "#9ff8ff",
      2,
    );
    ctx.restore();
    // Tilting moves the horizon by up to 8 px, which the cut allows for.
    const nearField = screenFrom(layout.vanishX, layout.horizon, 8);
    place(
      sprite(
        "jump",
        `${step}:${pose.x}:${pose.z}`,
        () => compile(skiJumpFrom(camera)),
        scale,
        2,
        nearField,
      ),
      layout.vanishX,
      horizon,
    );
    river(ground, ridgeX + valleyX * scale);
    // The tower clocks show the time in Einsiedeln, to the minute.
    const now = clockTime();
    place(
      sprite(
        "abbey",
        `${step}:${pose.x}:${pose.z}:${now.hours}:${now.minutes}`,
        () => compile(monasteryFrom(camera, now, pose)),
        scale,
        2,
        nearField,
      ),
      layout.vanishX,
      horizon,
    );
    for (let i = pulses.length - 1; i >= 0; i--) {
      const pulse = pulses[i];
      pulse.age += delta;
      if (pulse.age > 1600) {
        pulses.splice(i, 1);
        continue;
      }
      const progress = pulse.age / 1600;
      ctx.beginPath();
      ctx.ellipse(
        pulse.x * width,
        pulse.y * height,
        8 + progress * width * 0.4,
        4 + progress * height * 0.22,
        0,
        0,
        Math.PI * 2,
      );
      ctx.strokeStyle = `rgba(127, 241, 255, ${(1 - progress) * 0.7})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function tick(time: number) {
    frame = 0;
    // Full-screen rendering is capped at 30 fps, including on high-refresh displays.
    if (!lastTime || time - lastTime >= 1000 / 30) {
      const delta = lastTime ? Math.min(time - lastTime, 70) : 33;
      lastTime = time;
      draw(delta);
    }
    if (isMoving() && visible && !document.hidden)
      frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    if (!isMoving()) {
      targetX = cameraX = targetY = cameraY = 0;
      targetTurn = turn = 0;
      flowX = flowZ = 0;
      clock = 0;
      pulses.length = 0;
    }
    if (control) control.disabled = !isMoving();
    draw();
    if (isMoving() && visible && !document.hidden)
      frame = requestAnimationFrame(tick);
  }

  function pulse(x = 0.5, y = 0.65) {
    if (!isMoving()) return;
    // Bounded even when someone holds a key or repeatedly taps the scene.
    if (pulses.length >= 5) pulses.shift();
    pulses.push({ x, y, age: 0 });
  }

  // The background never receives or blocks pointer events from the document.
  document.addEventListener(
    "pointermove",
    (event) => {
      if (
        !isMoving() ||
        event.pointerType === "touch" ||
        (event.target as Element).closest("dialog")
      )
        return;
      targetX = Math.max(-1, Math.min(1, (event.clientX / width) * 2 - 1));
      targetY = Math.max(-1, Math.min(1, (event.clientY / height) * 2 - 1));
    },
    { passive: true },
  );
  document.documentElement.addEventListener("pointerleave", () => {
    targetX = targetY = 0;
  });
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (
        event.button !== 0 ||
        (event.target as Element).closest(
          "a, button, input, textarea, select, [contenteditable], dialog, [data-preview]",
        )
      )
        return;
      pulse(event.clientX / width, event.clientY / height);
    },
    { passive: true },
  );
  control?.addEventListener("keydown", (event) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.isComposing
    )
      return;
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    )
      return;
    event.preventDefault();
    if (!isMoving()) return;
    // Left and right turn the view along the panorama, up and down tilt it.
    if (event.key === "ArrowLeft")
      targetTurn = Math.max(turnLimits[0], targetTurn - 5);
    if (event.key === "ArrowRight")
      targetTurn = Math.min(turnLimits[1], targetTurn + 5);
    if (event.key === "ArrowUp") targetY = Math.max(-1, targetY - 0.25);
    if (event.key === "ArrowDown") targetY = Math.min(1, targetY + 0.25);
  });
  // Native button activation gives touch, Enter and Space the same impulse.
  control?.addEventListener("click", () => pulse());
  const resize = new ResizeObserver(() => {
    const box = surface.getBoundingClientRect();
    width = box.width;
    height = box.height;
    ratio = Math.min(
      window.devicePixelRatio || 1,
      2,
      Math.sqrt(3_000_000 / Math.max(1, width * height)),
    );
    surface.width = Math.round(width * ratio);
    surface.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    sync();
  });
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  surface.hidden = false;
  root.classList.add("scene-ready");
  resize.observe(surface);
  observer.observe(surface);
  document.addEventListener("visibilitychange", sync);
  // Without movement nothing redraws, so the clocks are updated here.
  window.setInterval(() => {
    if (!frame && visible && !document.hidden) draw();
  }, 20_000);
  return sync;
}
