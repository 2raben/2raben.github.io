import { mythen, monastery, landscapeLayout } from "./landmarks";

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
  // Compile the same original paths that render the static SVG, once per page.
  const mountains = mythen.map((shape) => ({
    ...shape,
    path: new Path2D(shape.d),
  }));
  const abbey = monastery.map((shape) => ({
    ...shape,
    path: new Path2D(shape.d),
  }));
  function landmark(
    shapes: typeof mountains,
    position: { x: number; y: number; scale: number },
    parallax: number,
  ) {
    ctx.save();
    ctx.translate(
      position.x + cameraX * parallax,
      position.y + cameraY * parallax * 0.4,
    );
    ctx.scale(position.scale, position.scale);
    for (const shape of shapes) {
      if (shape.fill !== "none") {
        ctx.fillStyle = shape.fill;
        ctx.fill(shape.path);
      }
      ctx.strokeStyle = shape.stroke;
      ctx.lineWidth = shape.width;
      ctx.stroke(shape.path);
    }
    ctx.restore();
  }
  let width = 800;
  let height = 600;
  let phase = 0;
  let lastTime = 0;
  let frame = 0;
  let visible = false;
  let cameraX = 0;
  let cameraY = 0;
  let targetX = 0;
  let targetY = 0;
  const pulses: { x: number; y: number; age: number }[] = [];
  const stars = Array.from({ length: 65 }, (_, i) => ({
    x: ((i * 173 + 47) % 997) / 997,
    y: ((i * 139 + 23) % 991) / 991,
    radius: i % 5 === 0 ? 1.6 : 0.8,
  }));

  function line(points: number[][], color: string, lineWidth = 1) {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function draw(delta = 0) {
    phase += delta * 0.00007;
    cameraX += (targetX - cameraX) * Math.min(1, delta * 0.006);
    cameraY += (targetY - cameraY) * Math.min(1, delta * 0.006);
    const layout = landscapeLayout(width, height);
    const horizon = layout.horizon + cameraY * 8;
    const center = layout.sunX + cameraX * 12;
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#100a2a");
    sky.addColorStop(0.6, "#3b124e");
    sky.addColorStop(1, "#100a2a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(
      center,
      horizon * 0.7,
      0,
      center,
      horizon * 0.7,
      width * 0.5,
    );
    glow.addColorStop(0, "#f857963d");
    glow.addColorStop(1, "#f8579600");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    for (const star of stars) {
      const x = (star.x * width + cameraX * star.radius * 9 + width) % width;
      const y = star.y * horizon * 0.85 + cameraY * 7;
      ctx.fillStyle = "#e6d7ff";
      ctx.globalAlpha = 0.4 + star.radius * 0.25;
      ctx.beginPath();
      ctx.arc(x, y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const radius = layout.sunRadius;
    const sunY = layout.sunY + cameraY * 5;
    const sunset = ctx.createLinearGradient(0, sunY - radius, 0, sunY + radius);
    sunset.addColorStop(0, "#ffe6a2");
    sunset.addColorStop(0.45, "#ff9cbb");
    sunset.addColorStop(1, "#ef3fce");
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, sunY, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = sunset;
    ctx.fillRect(center - radius, sunY - radius, radius * 2, radius);
    // Separated bands reveal the sky, rather than flashing or changing opacity.
    for (let band = 0; band < 7; band++) {
      const y = sunY + (band * radius) / 7;
      ctx.fillRect(
        center - radius,
        y,
        radius * 2,
        (radius / 7) * (0.8 - band * 0.06),
      );
    }
    ctx.restore();
    landmark(mountains, layout.mountain, 18);
    ctx.fillStyle = "#100b29";
    ctx.fillRect(0, horizon, width, height - horizon);
    for (let i = -10; i <= 10; i++) {
      line(
        [
          [center + i * 7, horizon],
          [width / 2 + (i * width) / 6 + cameraX * 30, height],
        ],
        i % 3 === 0 ? "#4cc5e19c" : "#b044b17a",
      );
    }
    for (let i = 0; i < 18; i++) {
      const depth = ((i / 18 + phase) % 1) ** 2.5;
      const y = horizon + depth * (height - horizon);
      line(
        [
          [0, y],
          [width, y],
        ],
        `rgba(237, 83, 213, ${0.2 + depth * 0.5})`,
      );
    }
    line(
      [
        [0, horizon],
        [width, horizon],
      ],
      "#76ecff",
      1.5,
    );
    landmark(abbey, layout.abbey, 28);
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
          "a, button, input, textarea, select, [contenteditable], dialog",
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
    if (event.key === "ArrowLeft") targetX = Math.max(-1, targetX - 0.25);
    if (event.key === "ArrowRight") targetX = Math.min(1, targetX + 0.25);
    if (event.key === "ArrowUp") targetY = Math.max(-1, targetY - 0.25);
    if (event.key === "ArrowDown") targetY = Math.min(1, targetY + 0.25);
  });
  // Native button activation gives touch, Enter and Space the same impulse.
  control?.addEventListener("click", () => pulse());
  const resize = new ResizeObserver(() => {
    const bounds = surface.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(
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
  return sync;
}
