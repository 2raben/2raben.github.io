/**
 * Comic effects for the Schafbock Studio pages, loaded by Layout.astro. Purely
 * decorative: every page works without this script. With
 * prefers-reduced-motion, only the pupils follow the pointer.
 *
 * - Pointer movement: the ram's pupils follow it, layers marked .parallax
 *   shift, panels marked [data-tilt] lean toward it, and a mouse leaves a short
 *   trail of halftone dots.
 * - Click or tap on anything that is not a control: a sound-effect word pops up.
 * - Typing a letter or digit: a word for that key pops up and every ram nods.
 *   Typing "schafbock" sends the ram flying across the screen.
 *
 * Keys are never intercepted here: Tab, Enter, Space and the arrows keep
 * their usual meaning. The key demos handle their own keys while focused.
 */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;
const layer = document.querySelector<HTMLElement>("[data-sfx-layer]");

const fills = ["#ffd60a", "#00b4d8", "#ff4fa3", "#ffffff", "#ff9f1c"];
const clickWords = [
  "BÄÄM!",
  "MÄÄH!",
  "ZACK!",
  "KLONK!",
  "WUMMS!",
  "PENG!",
  "BOING!",
  "CHLAPF!",
];
const keyWords: Record<string, string> = {
  a: "AUA!",
  b: "BÄÄM!",
  c: "CHLAPF!",
  d: "DONG!",
  e: "EIEIEI!",
  f: "FFFT!",
  g: "GRRR!",
  h: "HUI!",
  i: "IIIH!",
  j: "JUHUI!",
  k: "KLONK!",
  l: "LOS!",
  m: "MÄÄH!",
  n: "NEIN!",
  o: "OHO!",
  p: "PENG!",
  q: "QUIETSCH!",
  r: "RUMMS!",
  s: "SCHWUPP!",
  t: "TÖFF!",
  u: "UFF!",
  v: "VRUMM!",
  w: "WUMMS!",
  x: "X!",
  y: "YIPPIE!",
  z: "ZACK!",
  ä: "ÄTSCH!",
  ö: "ÖHM!",
  ü: "ÜBERRASCHUNG!",
};

const pick = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Shows a sound-effect word at a viewport position. */
export function sfx(
  word: string,
  x: number,
  y: number,
  options: { size?: string; fill?: string } = {},
): void {
  if (!layer || reduceMotion.matches) return;
  while (layer.childElementCount > 24) layer.firstElementChild?.remove();
  const element = document.createElement("span");
  element.className = "sfx";
  element.textContent = word;
  element.style.left = `${clamp(x, 60, window.innerWidth - 60)}px`;
  element.style.top = `${clamp(y, 40, window.innerHeight - 40)}px`;
  element.style.setProperty(
    "--rot",
    `${Math.round(Math.random() * 24 - 12)}deg`,
  );
  element.style.setProperty("--fill", options.fill ?? pick(fills));
  if (options.size) element.style.setProperty("--size", options.size);
  element.addEventListener("animationend", () => element.remove());
  layer.append(element);
}

/** Shows a word above the middle of an element, such as a key demo. */
export function sfxAt(element: Element, word: string): void {
  const rect = element.getBoundingClientRect();
  sfx(
    word,
    rect.left + rect.width * (0.3 + Math.random() * 0.4),
    rect.top + rect.height * 0.3,
  );
}

/** Makes every ram on the page nod, as in a headbutt. */
export function nod(): void {
  if (reduceMotion.matches) return;
  for (const ram of document.querySelectorAll<HTMLElement>("[data-ram]")) {
    ram.classList.remove("is-nodding");
    void ram.offsetWidth;
    ram.classList.add("is-nodding");
  }
}

function flyby(): void {
  const ram = document.querySelector("[data-ram] svg");
  if (!layer || !ram || reduceMotion.matches) return;
  const wrapper = document.createElement("div");
  wrapper.className = "flyby ram";
  wrapper.append(ram.cloneNode(true));
  wrapper.addEventListener("animationend", () => wrapper.remove());
  layer.append(wrapper);
  sfx("SCHAFBOCK!", window.innerWidth / 2, window.innerHeight / 2, {
    size: "4.5rem",
    fill: "#d62828",
  });
}

// ---------- Pointer ----------

const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 3 };
let frame = 0;
let tilted: HTMLElement | null = null;
let lastTrail = 0;

function followPointer(): void {
  frame = 0;
  if (!reduceMotion.matches) {
    root.style.setProperty(
      "--mx",
      ((pointer.x / window.innerWidth) * 2 - 1).toFixed(3),
    );
    root.style.setProperty(
      "--my",
      ((pointer.y / window.innerHeight) * 2 - 1).toFixed(3),
    );
  }
  for (const pupil of document.querySelectorAll<SVGGElement>(".ram-pupil")) {
    const eye = pupil.previousElementSibling;
    if (!eye) continue;
    const rect = eye.getBoundingClientRect();
    if (rect.width === 0) continue;
    const dx = pointer.x - (rect.left + rect.width / 2);
    const dy = pointer.y - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy) || 1;
    const reach = Math.min(1, distance / 120) * 3.6;
    pupil.setAttribute(
      "transform",
      `translate(${((dx / distance) * reach).toFixed(2)} ${((dy / distance) * reach).toFixed(2)})`,
    );
  }
}

function tilt(event: PointerEvent): void {
  const target =
    event.target instanceof Element
      ? event.target.closest<HTMLElement>("[data-tilt]")
      : null;
  if (tilted && tilted !== target) {
    tilted.style.removeProperty("--tilt-x");
    tilted.style.removeProperty("--tilt-y");
  }
  tilted = target;
  if (!target || reduceMotion.matches) return;
  const rect = target.getBoundingClientRect();
  const px = (event.clientX - rect.left) / rect.width - 0.5;
  const py = (event.clientY - rect.top) / rect.height - 0.5;
  target.style.setProperty("--tilt-x", `${(px * 10).toFixed(2)}deg`);
  target.style.setProperty("--tilt-y", `${(-py * 10).toFixed(2)}deg`);
}

function trail(event: PointerEvent): void {
  if (!layer || event.pointerType !== "mouse" || reduceMotion.matches) return;
  if (event.timeStamp - lastTrail < 45) return;
  lastTrail = event.timeStamp;
  const dot = document.createElement("span");
  dot.className = "trail-dot";
  dot.style.left = `${event.clientX}px`;
  dot.style.top = `${event.clientY}px`;
  dot.style.setProperty("--fill", pick(fills));
  dot.addEventListener("animationend", () => dot.remove());
  layer.append(dot);
}

document.addEventListener(
  "pointermove",
  (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (!frame) frame = requestAnimationFrame(followPointer);
    tilt(event);
    trail(event);
  },
  { passive: true },
);

const controls =
  "a, button, input, select, textarea, summary, label, [data-demo]";

document.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  if (event.target instanceof Element && event.target.closest(controls)) return;
  sfx(pick(clickWords), event.clientX, event.clientY);
  nod();
});

// ---------- Keyboard ----------

let typed = "";

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (
    event.target instanceof Element &&
    event.target.closest("[data-demo], input, textarea, [contenteditable]")
  ) {
    return;
  }
  const key = event.key.toLowerCase();
  if (key.length !== 1 || !/[\p{L}\d]/u.test(key)) return;
  typed = (typed + key).slice(-9);
  if (typed === "schafbock") {
    typed = "";
    flyby();
    return;
  }
  sfx(
    keyWords[key] ?? `${key.toUpperCase()}!`,
    pointer.x + (Math.random() * 240 - 120),
    pointer.y + (Math.random() * 160 - 120),
  );
  nod();
});

// ---------- Start ----------

followPointer();
if (!reduceMotion.matches) {
  for (const hint of document.querySelectorAll<HTMLElement>("[data-js-hint]")) {
    hint.hidden = false;
  }
}
