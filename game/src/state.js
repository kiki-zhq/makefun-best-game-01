// The run's state: one plain object every system reads and writes.
// Nothing here draws or listens; it only holds the game.
import { ARENA, PLAYER_BASE, TOTAL_WAVES } from './config.js';

export function createState(rng) {
  return {
    rng,
    time: 0,
    player: null,
    bullets: [],
    enemyBullets: [],
    enemies: [],
    gems: [],
    particles: [],
    texts: [],
    wave: 0,
    waveState: 'idle', // idle | spawning | fighting | clear
    spawnQueue: [],
    spawnTimer: 0,
    score: 0,
    best: 0,
    gemsCollected: 0,
    combo: 0,
    comboTimer: 0,
    kills: 0,
    shake: 0,
    banner: null, // { text, sub, t }
    upgradeChoices: [],
    upgradeCounts: {},
    won: false,
    over: false,
    sfx: [], // sound names drained once per frame
    stats: { shotsFired: 0, hits: 0 },
  };
}

export function resetRun(state) {
  const { rng, best } = state;
  const fresh = createState(rng);
  fresh.best = best;
  Object.keys(fresh).forEach((key) => { state[key] = fresh[key]; });
  state.player = {
    x: ARENA.width / 2,
    y: ARENA.height / 2,
    vx: 0,
    vy: 0,
    r: PLAYER_BASE.radius,
    hp: PLAYER_BASE.maxHp,
    maxHp: PLAYER_BASE.maxHp,
    speed: PLAYER_BASE.speed,
    fireRate: PLAYER_BASE.fireRate,
    damage: PLAYER_BASE.damage,
    bulletSpeed: PLAYER_BASE.bulletSpeed,
    shots: PLAYER_BASE.shots,
    pierce: PLAYER_BASE.pierce,
    magnet: PLAYER_BASE.magnet,
    spread: PLAYER_BASE.spread,
    aimAngle: -Math.PI / 2,
    fireCd: 0,
    invuln: 0,
    trailTimer: 0,
  };
}

export function queueSfx(state, name, arg) {
  state.sfx.push({ name, arg });
}

export function drainSfx(state, audio) {
  for (const item of state.sfx) audio.play(item.name, item.arg);
  state.sfx.length = 0;
}

// Combo multiplier from consecutive gem pickups: +1 step every 8, capped at x5.
export function comboMultiplier(state) {
  return Math.min(5, 1 + Math.floor(state.combo / 8));
}

export function totalWaves() {
  return TOTAL_WAVES;
}
