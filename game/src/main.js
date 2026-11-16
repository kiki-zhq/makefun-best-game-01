// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between six screens: title, play, the
// between-wave upgrade draft, paused, game over and victory.
//
// ?seed=N fixes the run. ?shot=title|play|upgrade|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady
// for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_PICK1, ACTION_PICK2, ACTION_PICK3, ACTION_RESTART, createInput } from './input.js';
import { createState, drainSfx, resetRun } from './state.js';
import { stepWorld } from './world.js';
import { startWave } from './waves.js';
import { applyUpgrade } from './gems.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';
import { upgradeCardRects } from './screens.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const rng = createRandom(seed);
const state = createState(rng);
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, state, seed);
  state.best = readBest();
  renderer.resize(); // Size the backing store to the window, or the canvas
  // stays at its 300x150 default and the frame comes out zoomed.
  let painted = 0;
  function paint() {
    renderer.draw(state, scene.screen, state.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.unlock();
    resetRun(state);
    state.best = best;
    startWave(state, 1);
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Survive 10 waves.');
  }

  function pickUpgrade(index) {
    const choice = state.upgradeChoices[index];
    if (!choice) return;
    applyUpgrade(state, choice);
    state.upgradeChoices = [];
    startWave(state, state.wave + 1);
    screen = SCREEN_PLAY;
    announce(`Wave ${state.wave}. Upgrade: ${choice.name}.`);
  }

  function finishRun() {
    screen = state.won ? SCREEN_WIN : SCREEN_OVER;
    if (state.score > best) {
      best = state.score;
      saveBest(best);
    }
    state.best = best;
    announce(state.won
      ? `Victory! Final score ${state.score}.`
      : `Game over. Score ${state.score}. Best ${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) startGame();
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
    if (actions & ACTION_RESTART) {
      if (screen === SCREEN_OVER || screen === SCREEN_WIN) startGame();
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
    if (screen === SCREEN_UPGRADE) {
      if (actions & ACTION_PICK1) pickUpgrade(0);
      else if (actions & ACTION_PICK2) pickUpgrade(1);
      else if (actions & ACTION_PICK3) pickUpgrade(2);
    }
  }

  function handleClicks() {
    const view = renderer.getView();
    for (const click of input.takeClicks()) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) {
        startGame();
        return;
      }
      if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        return;
      }
      if (screen === SCREEN_UPGRADE) {
        const rects = upgradeCardRects();
        for (let i = 0; i < rects.length; i += 1) {
          const r = rects[i];
          if (click.x >= r.x && click.x <= r.x + r.w && click.y >= r.y && click.y <= r.y + r.h) {
            pickUpgrade(i);
            return;
          }
        }
      }
    }
    void view;
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      // A live demo plays behind the title; restart it if the demo ship dies.
      if (state.over) {
        resetRun(state);
        startWave(state, 1);
      }
      const demo = stageDemoInput();
      stepWorld(state, demo.move, demo.aim, demo.firing, STEP);
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const move = input.move();
    const aim = input.aim();
    stepWorld(state, move, aim, input.firing(), STEP);
    drainSfx(state, audio);
    if (state.over) finishRun();
    else if (state.waveState === 'clear' && !state.won) {
      screen = SCREEN_UPGRADE;
      announce(`Wave ${state.wave} cleared. Choose an upgrade.`);
    }
  }

  // The title screen's demo pilot: the same steering the screenshots use.
  function stageDemoInput() {
    const p = state.player;
    let nearest = null;
    let nearestDist = Infinity;
    for (const e of state.enemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < nearestDist) { nearestDist = d; nearest = e; }
    }
    let move = { x: 0, y: 0 };
    if (nearest && nearestDist < 150) {
      move = { x: (p.x - nearest.x) / nearestDist, y: (p.y - nearest.y) / nearestDist };
    }
    const aim = nearest ? { x: nearest.x, y: nearest.y } : { x: p.x, y: p.y - 100 };
    return { move, aim, firing: Boolean(nearest && nearestDist < 480) };
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    handleClicks();
    while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
      step();
      accumulator -= STEP;
    }
    if (screen !== SCREEN_TITLE && screen !== SCREEN_PLAY) accumulator = 0;
    renderer.draw(state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting enemies close in unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  window.addEventListener('resize', () => {
    const view = renderer.resize();
    input.setView(view.scale, view.ox, view.oy);
  });
  const view = renderer.resize();
  input.setView(view.scale, view.ox, view.oy);

  // The title demo starts on a fresh run so something is already moving.
  resetRun(state);
  startWave(state, 1);
  announce('Neon Surge. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
