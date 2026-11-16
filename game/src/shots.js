// The screenshot scenes behind ?shot=title|play|upgrade|end.
// Each one plays the real rules forward from a fresh run for a fixed time,
// steered by a simple autopilot, so the frame is what a short game really
// looks like and the same seed always gives the same frame.
import { STEP } from './config.js';
import { createRandom } from './random.js';
import { resetRun } from './state.js';
import { startWave } from './waves.js';
import { stepWorld } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE, SCREEN_WIN } from './render.js';

// Steer the ship: chase the nearest gem when it is safe, keep clear of the
// nearest enemy, and always shoot the nearest enemy in range.
function autopilot(state, skill) {
  const p = state.player;
  if (skill === 'end') {
    return { move: { x: 0, y: 0 }, aim: nearestEnemyAim(state), firing: true };
  }
  let move = { x: 0, y: 0 };
  let nearest = null;
  let nearestDist = Infinity;
  for (const e of state.enemies) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < nearestDist) { nearestDist = d; nearest = e; }
  }
  let gem = null;
  let gemDist = Infinity;
  for (const g of state.gems) {
    const d = Math.hypot(g.x - p.x, g.y - p.y);
    if (d < gemDist) { gemDist = d; gem = g; }
  }
  if (nearest && nearestDist < 150) {
    move = { x: (p.x - nearest.x) / nearestDist, y: (p.y - nearest.y) / nearestDist };
  } else if (gem && gemDist < 320) {
    move = { x: (gem.x - p.x) / gemDist, y: (gem.y - p.y) / gemDist };
  } else {
    const cx = 480 - p.x;
    const cy = 300 - p.y;
    const d = Math.hypot(cx, cy) || 1;
    if (d > 120) move = { x: cx / d, y: cy / d };
  }
  const aim = nearest ? { x: nearest.x, y: nearest.y } : { x: p.x, y: p.y - 100 };
  return { move, aim, firing: Boolean(nearest && nearestDist < 480) };
}

function nearestEnemyAim(state) {
  const p = state.player;
  let nearest = null;
  let nearestDist = Infinity;
  for (const e of state.enemies) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < nearestDist) { nearestDist = d; nearest = e; }
  }
  return nearest ? { x: nearest.x, y: nearest.y } : { x: p.x, y: p.y - 100 };
}

function runSteps(state, skill, seconds, stopOnClear = true) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (state.over) break;
    if (state.waveState === 'clear') {
      if (stopOnClear) break;
      // The end scene keeps going: the next wave starts and the ship keeps
      // standing its ground until something finally kills it.
      if (state.won) break;
      startWave(state, state.wave + 1);
    }
    const input = autopilot(state, skill);
    stepWorld(state, input.move, input.aim, input.firing, STEP);
  }
}

// The busiest moment of wave 1: pass 1 finds when the most enemies are alive,
// pass 2 replays the seeded run to that exact moment, so the frame shows the
// fight at its fullest instead of an arena already cleared.
function stageBusiestPlay(state, seed) {
  let bestTime = 0;
  let bestCount = -1;
  for (let i = 0; i < 26 / STEP; i += 1) {
    if (state.over || state.waveState === 'clear') break;
    const input = autopilot(state, 'play');
    stepWorld(state, input.move, input.aim, input.firing, STEP);
    if (state.time > 3 && state.enemies.length > bestCount) {
      bestCount = state.enemies.length;
      bestTime = state.time;
    }
  }
  state.rng = createRandom(seed);
  resetRun(state);
  startWave(state, 1);
  const steps = Math.round(bestTime / STEP);
  for (let i = 0; i < steps; i += 1) {
    const input = autopilot(state, 'play');
    stepWorld(state, input.move, input.aim, input.firing, STEP);
  }
}

/**
 * Set `state` to the named scene and return the screen to draw over it.
 * title: 5 s of autopilot play behind the title. play: mid-combat in wave 1.
 * upgrade: wave 1 cleared, the draft on screen. end: the ship destroyed.
 */
export function stageShot(name, state, seed) {
  resetRun(state);
  startWave(state, 1);
  if (name === 'play') {
    stageBusiestPlay(state, seed);
    return { screen: state.over ? SCREEN_OVER : SCREEN_PLAY };
  }
  if (name === 'upgrade') {
    runSteps(state, 'play', 120);
    if (state.waveState === 'clear' && !state.over) return { screen: SCREEN_UPGRADE };
    return { screen: state.over ? SCREEN_OVER : SCREEN_PLAY };
  }
  if (name === 'end') {
    runSteps(state, 'end', 300, false);
    return { screen: state.won ? SCREEN_WIN : SCREEN_OVER };
  }
  runSteps(state, 'play', 5);
  return { screen: SCREEN_TITLE };
}
