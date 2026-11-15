import { mountScene } from "./scene";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let prefersReducedMotion = reducedMotion.matches;
const storageKey = "november-games-effects-paused";
let paused = false;
try {
  paused = sessionStorage.getItem(storageKey) === "true";
} catch {
  // Effects and navigation also work when browser storage is unavailable.
}
const isMoving = () => !paused && !prefersReducedMotion;
const effectsButton = document.querySelector<HTMLButtonElement>(
  "[data-effects-toggle]",
);
const effectsState = document.querySelector<HTMLElement>(
  "[data-effects-state]",
);
const cards = [...document.querySelectorAll<HTMLElement>(".game-card")];
const scenes = [...document.querySelectorAll<HTMLElement>("[data-scene]")].map(
  (root) => mountScene(root, isMoving),
);

function updateEffects() {
  document.body.dataset.motion = isMoving() ? "on" : "off";
  if (effectsButton) {
    effectsButton.setAttribute("aria-pressed", String(isMoving()));
    effectsButton.disabled = prefersReducedMotion;
    effectsButton.title = prefersReducedMotion
      ? "Deine Systemeinstellung reduziert Bewegung."
      : "Bewegte Effekte ein- oder ausschalten";
  }
  if (effectsState)
    effectsState.textContent = prefersReducedMotion
      ? "reduziert"
      : isMoving()
        ? "an"
        : "aus";
  cards.forEach((card) => {
    card.style.removeProperty("--tilt-x");
    card.style.removeProperty("--tilt-y");
    card.style.removeProperty("--pointer-x");
    card.style.removeProperty("--pointer-y");
  });
  scenes.forEach((sync) => sync());
}

effectsButton?.addEventListener("click", () => {
  paused = !paused;
  try {
    sessionStorage.setItem(storageKey, String(paused));
  } catch {
    /* Optional. */
  }
  updateEffects();
});
reducedMotion.addEventListener("change", (event) => {
  prefersReducedMotion = event.matches;
  updateEffects();
});
updateEffects();
document.querySelectorAll<HTMLElement>("[data-enhanced]").forEach((element) => {
  element.hidden = false;
});

cards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (!isMoving() || event.pointerType !== "mouse") return;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    card.style.setProperty("--tilt-x", `${(0.5 - y) * 5}deg`);
    card.style.setProperty("--tilt-y", `${(x - 0.5) * 7}deg`);
    card.style.setProperty("--pointer-x", `${x * 100}%`);
    card.style.setProperty("--pointer-y", `${y * 100}%`);
  });
  card.addEventListener("pointerleave", () => {
    card.style.removeProperty("--tilt-x");
    card.style.removeProperty("--tilt-y");
  });
});

// Arrows enhance the focused link group; Tab and browser shortcuts keep their native behaviour.
function moveLink(
  event: KeyboardEvent,
  links: HTMLAnchorElement[],
  axis: "horizontal" | "vertical",
) {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.isComposing
  )
    return;
  const current = links.indexOf(document.activeElement as HTMLAnchorElement);
  if (current < 0 || !links.length) return;
  const previous = axis === "horizontal" ? "ArrowLeft" : "ArrowUp";
  const next = axis === "horizontal" ? "ArrowRight" : "ArrowDown";
  let index = current;
  if (event.key === previous)
    index = (current + links.length - 1) % links.length;
  else if (event.key === next) index = (current + 1) % links.length;
  else if (event.key === "Home") index = 0;
  else if (event.key === "End") index = links.length - 1;
  else return;
  event.preventDefault();
  links[index].focus();
}

const navigation = document.querySelector<HTMLElement>(".site-nav");
navigation?.addEventListener("keydown", (event) => {
  moveLink(
    event,
    [...navigation.querySelectorAll<HTMLAnchorElement>("a")],
    "horizontal",
  );
});
const grid = document.querySelector<HTMLElement>(".games-grid");
grid?.addEventListener("keydown", (event) => {
  const currentCard = (event.target as Element).closest(".game-card");
  if (!currentCard) return;
  const action = [...currentCard.querySelectorAll("a")].indexOf(
    document.activeElement as HTMLAnchorElement,
  );
  if (action < 0) return;
  const links = cards.flatMap((card) => {
    const link = card.querySelectorAll<HTMLAnchorElement>("a")[action];
    return link ? [link] : [];
  });
  moveLink(event, links, "horizontal");
});

const dialog = document.querySelector<HTMLDialogElement>(
  "#keyboard-navigation",
);
const openButton = document.querySelector<HTMLButtonElement>(
  "[data-navigation-open]",
);
let returnFocus: HTMLElement | null = null;
function openNavigation() {
  if (!dialog || dialog.open) return;
  returnFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : openButton;
  dialog.showModal();
  dialog.querySelector<HTMLAnchorElement>("nav a")?.focus();
}
openButton?.addEventListener("click", openNavigation);
document
  .querySelector("[data-navigation-close]")
  ?.addEventListener("click", () => dialog?.close());
dialog?.addEventListener("close", () => {
  returnFocus?.focus({ preventScroll: true });
});
dialog?.addEventListener("click", (event) => {
  const target = event.target as Element;
  // Closing before following same-page anchors avoids leaving the modal over the target.
  if (target.closest("a")) dialog.close();
  if (target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  }
});
dialog?.addEventListener("keydown", (event) => {
  moveLink(
    event,
    [...dialog.querySelectorAll<HTMLAnchorElement>("nav a")],
    "vertical",
  );
});
document.addEventListener("keydown", (event) => {
  if (
    event.repeat ||
    event.isComposing ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  )
    return;
  if (
    (event.target as Element).closest(
      "input, textarea, select, [contenteditable]",
    )
  )
    return;
  if (event.altKey && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (dialog?.open) dialog.close();
    else openNavigation();
  }
});
