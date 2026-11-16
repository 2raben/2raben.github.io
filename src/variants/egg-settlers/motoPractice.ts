/**
 * Rides Moto Devil's practice course (MotoPractice.astro) with simplified
 * rules from the game's text: gas, brakes, tilting into saltos, jumping and a
 * jet boost while the jump is held, a ramp, spikes that shoot out of the
 * ground and a goal that drives away. A crash restarts at the checkpoint.
 * The demonstration rides it on its own: jet over the ramp with a salto, a
 * jump over the spikes, and a chase after the goal.
 */
import { course } from "./motoCourse";
import { setUpPractice, type Input, type Practice } from "./practice";

const keys: Record<string, string> = {
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
};

const gravity = 170;
const jetThrust = 330;
const maxSpeed = 72;
const rampSlope = course.rampHeight / (course.rampEnd - course.rampStart);
const rampAngle = (-Math.atan(rampSlope) * 180) / Math.PI;

const heightAt = (x: number) =>
  x >= course.rampStart && x <= course.rampEnd
    ? (x - course.rampStart) * rampSlope
    : 0;

for (const section of document.querySelectorAll<HTMLElement>(
  '[data-practice="moto"]',
)) {
  const bike = section.querySelector<SVGGElement>("[data-bike]");
  const sprite = section.querySelector<SVGUseElement>("[data-bike-sprite]");
  const flame = section.querySelector<SVGUseElement>("[data-jet]");
  const spikes = section.querySelector<SVGGElement>("[data-spikes]");
  const goal = section.querySelector<SVGGElement>("[data-goal]");
  if (!bike || !sprite || !flame || !spikes || !goal) continue;

  const s = {
    x: course.start,
    h: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    spin: 0,
    dir: 1,
    air: false,
    airTime: 0,
    fromRamp: false,
    jetting: false,
    crash: 0,
    finish: 0,
    spikesUp: false,
    goalShift: 0,
    wheel: 0,
    blink: 0,
  };

  const reset = () => {
    Object.assign(s, {
      x: course.start,
      h: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      spin: 0,
      dir: 1,
      air: false,
      airTime: 0,
      fromRamp: false,
      jetting: false,
      crash: 0,
      finish: 0,
      spikesUp: false,
      goalShift: 0,
    });
  };

  const render = () => {
    const y = course.ground - s.h;
    bike.setAttribute(
      "transform",
      `translate(${Math.round(s.x)} ${Math.round(y)}) rotate(${Math.round(s.angle)}) scale(${s.dir} 1)`,
    );
    bike.style.opacity =
      s.crash > 0 && Math.floor(s.blink * 8) % 2 ? "0.3" : "1";
    sprite.setAttribute("href", `#es-bike-${s.wheel % 2}`);
    flame.setAttribute("href", `#es-jet-${s.wheel % 2}`);
    flame.style.visibility = s.jetting ? "visible" : "hidden";
    spikes.setAttribute("transform", `translate(0 ${s.spikesUp ? 0 : 12})`);
    goal.setAttribute("transform", `translate(${Math.round(s.goalShift)} 0)`);
  };

  const crash = (practice: Practice, text: string) => {
    s.crash = 1.1;
    s.blink = 0;
    s.vx = 0;
    s.jetting = false;
    practice.say(text);
  };

  const step = (
    dt: number,
    input: Input,
    demo: boolean,
    practice: Practice,
  ) => {
    if (s.crash > 0) {
      s.crash -= dt;
      s.blink += dt;
      if (s.crash <= 0) {
        reset();
        practice.say("Zurück zum Checkpoint.");
      }
      render();
      return;
    }
    if (s.finish > 0) {
      s.finish -= dt;
      if (s.finish <= 0) reset();
      render();
      return;
    }

    let gas = input.held.has("gas");
    const brake = input.held.has("brake");
    let back = input.held.has("back");
    let forward = input.held.has("forward");
    let jump = input.pressed.has("jump");
    let jetHeld = input.held.has("jump");
    if (input.pressed.has("restart")) {
      reset();
      practice.say("Neustart.");
    }
    if (input.pressed.has("turn")) {
      s.dir *= -1;
      practice.say("Umdrehen.");
    }
    if (demo) {
      /* The demonstration rides right, jets off the ramp into a salto and
         jumps the spikes before they catch it. */
      gas = true;
      back = false;
      forward =
        s.air && s.fromRamp && s.airTime > 0.12 && Math.abs(s.spin) < 345;
      jump =
        !s.air && s.x > course.spikeTrigger + 6 && s.x < course.spikeFrom - 4;
      jetHeld = s.air && s.airTime < (s.fromRamp ? 0.42 : 0.25);
    }

    /* Riding. */
    if (gas) s.vx += s.dir * 95 * dt;
    if (brake) s.vx -= Math.sign(s.vx) * Math.min(Math.abs(s.vx), 170 * dt);
    if (!gas && !brake && !s.air) {
      s.vx -= Math.sign(s.vx) * Math.min(Math.abs(s.vx), 25 * dt);
    }
    s.vx = Math.max(-maxSpeed, Math.min(maxSpeed, s.vx));
    const before = s.x;
    s.x += s.vx * dt;
    if (s.x < 6 || s.x > course.width - 6) {
      s.x = Math.max(6, Math.min(course.width - 6, s.x));
      s.vx = 0;
    }
    if (Math.abs(s.vx) > 4) s.wheel = Math.floor(performance.now() / 90);

    s.jetting = false;
    if (!s.air) {
      const onRamp = s.x >= course.rampStart && s.x <= course.rampEnd;
      const leftRamp = before <= course.rampEnd && s.x > course.rampEnd;
      if (leftRamp && s.vx > 20) {
        s.air = true;
        s.fromRamp = true;
        s.airTime = 0;
        s.vy = s.vx * rampSlope;
        s.h = course.rampHeight;
      } else if (jump) {
        s.air = true;
        s.fromRamp = false;
        s.airTime = 0;
        s.vy = 70;
        practice.say("Sprung!");
      } else {
        s.h = heightAt(s.x);
        const target = onRamp && s.vx >= 0 ? rampAngle : 0;
        const wheelie = (back ? -14 : 0) + (forward ? 8 : 0);
        s.angle += (target + wheelie * s.dir - s.angle) * Math.min(1, dt * 12);
      }
    }
    if (s.air) {
      s.airTime += dt;
      s.vy -= gravity * dt;
      if (jetHeld && s.airTime > 0.06) {
        s.vy = Math.min(90, s.vy + jetThrust * dt);
        s.jetting = true;
      }
      s.h += s.vy * dt;
      const turn = ((forward ? 1 : 0) - (back ? 1 : 0)) * 340 * dt * s.dir;
      s.angle += turn;
      s.spin += turn;
      const ground = heightAt(s.x);
      if (s.h <= ground && s.vy < 0) {
        const tilt = (((s.angle % 360) + 540) % 360) - 180;
        s.air = false;
        s.h = ground;
        if (Math.abs(tilt) > 50) {
          crash(practice, "Autsch! Falsch gelandet.");
        } else {
          practice.say(Math.abs(s.spin) >= 300 ? "Salto!" : "Gelandet.");
          s.angle = tilt;
        }
        s.spin = 0;
      }
    }

    /* The traps: spikes out of the ground, and a goal that drives away. */
    if (!s.spikesUp && s.x > course.spikeTrigger && s.vx > 0) {
      s.spikesUp = true;
      practice.say("Stacheln aus dem Boden!");
    }
    if (
      s.spikesUp &&
      s.crash <= 0 &&
      s.h < 9 &&
      s.x > course.spikeFrom - 2 &&
      s.x < course.spikeTo + 2
    ) {
      crash(practice, "Autsch! Die Stacheln.");
    }
    if (s.x > course.goal - 34 && s.goalShift < course.goalRun) {
      if (s.goalShift === 0) practice.say("Das Ziel fährt davon!");
      s.goalShift = Math.min(course.goalRun, s.goalShift + 60 * dt);
    }
    if (s.crash <= 0 && s.x > course.goal + s.goalShift - 2 && !s.air) {
      s.finish = 1.4;
      s.vx = 0;
      practice.say("Im Ziel! Nochmal von vorn.");
    }
    render();
  };

  setUpPractice(section, keys, step);
}
