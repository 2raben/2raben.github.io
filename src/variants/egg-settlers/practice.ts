/**
 * The practice grounds on the game pages (MotoPractice.astro and
 * CarPractice.astro): a small loop that runs a game's simplified rules, plays
 * a demonstration on its own, and hands over when somebody presses a key from
 * the game's controls table or one of the on-screen buttons. Optional under
 * ADR 0004: without JavaScript the panel stays hidden.
 *
 * The loop runs only while the panel is on screen. With reduced motion there
 * is no demonstration, and the loop runs only while somebody plays.
 */

export interface Input {
  /** Actions whose key or button is held down. */
  held: Set<string>;
  /** Actions pressed since the last step. */
  pressed: Set<string>;
}

export interface Practice {
  /** Shows a short line; in manual mode it is also announced. */
  say(text: string): void;
}

/** After this long without input, the demonstration takes over again. */
const idleMs = 8000;

export function setUpPractice(
  section: HTMLElement,
  keys: Record<string, string>,
  step: (dt: number, input: Input, demo: boolean, practice: Practice) => void,
): void {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  const status = section.querySelector<HTMLElement>("[data-practice-status]");
  const live = section.querySelector<HTMLElement>("[data-practice-live]");
  const mode = section.querySelector<HTMLElement>("[data-practice-mode]");
  const input: Input = { held: new Set(), pressed: new Set() };
  let demo = !still.matches;
  let lastInput = -Infinity;
  let visible = false;
  let frame = 0;
  let last = 0;

  const practice: Practice = {
    say(text) {
      if (status) status.textContent = text;
      if (live && !demo) live.textContent = text;
    },
  };
  const setMode = (isDemo: boolean) => {
    demo = isDemo;
    section.dataset.mode = isDemo ? "demo" : "manual";
    if (mode) {
      mode.textContent = isDemo
        ? (section.dataset.labelDemo ?? "")
        : (section.dataset.labelManual ?? "");
    }
  };

  const tick = (time: number) => {
    frame = 0;
    const dt = Math.min(0.05, (time - (last || time)) / 1000);
    last = time;
    if (!demo && time - lastInput > idleMs && input.held.size === 0) {
      setMode(!still.matches);
    }
    step(dt, input, demo, practice);
    input.pressed.clear();
    const playing = demo || time - lastInput < idleMs || input.held.size > 0;
    if (visible && playing) frame = window.requestAnimationFrame(tick);
    else last = 0;
  };
  const run = () => {
    if (!frame && visible) frame = window.requestAnimationFrame(tick);
  };

  const press = (action: string) => {
    if (!input.held.has(action)) input.pressed.add(action);
    input.held.add(action);
    lastInput = performance.now();
    if (demo) setMode(false);
    section
      .querySelector(`[data-action="${action}"]`)
      ?.classList.add("is-pressed");
    run();
  };
  const release = (action: string) => {
    input.held.delete(action);
    section
      .querySelector(`[data-action="${action}"]`)
      ?.classList.remove("is-pressed");
  };

  section.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const action = keys[event.key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    if (!event.repeat) press(action);
  });
  section.addEventListener("keyup", (event) => {
    const action = keys[event.key.toLowerCase()];
    if (action) release(action);
  });
  section.addEventListener("focusout", () => {
    for (const action of [...input.held]) release(action);
  });
  for (const button of section.querySelectorAll<HTMLElement>("[data-action]")) {
    const action = button.dataset.action ?? "";
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      section.focus({ preventScroll: true });
      button.setPointerCapture(event.pointerId);
      press(action);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      button.addEventListener(type, () => release(action));
    }
  }

  new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    run();
  }).observe(section);
  still.addEventListener("change", () => setMode(demo && !still.matches));

  setMode(demo);
  section.hidden = false;
  /* Draw the first frame even when nothing moves. */
  step(0, input, false, practice);
}
