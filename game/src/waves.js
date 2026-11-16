// Waves: what each wave fields, the trickle of spawns, and the upgrade draft
// offered when a wave is cleared.
import { TOTAL_WAVES, UPGRADES, WAVE_TABLE } from './config.js';
import { queueSfx } from './state.js';
import { spawnEnemy, KINDS } from './enemies.js';

export function startWave(state, wave) {
  state.wave = wave;
  state.waveState = 'spawning';
  state.spawnTimer = 0.6;
  const counts = WAVE_TABLE[wave - 1];
  state.spawnQueue = [];
  for (let k = 0; k < counts.length; k += 1) {
    for (let i = 0; i < counts[k]; i += 1) state.spawnQueue.push(KINDS[k]);
  }
  // Shuffle the queue so kinds arrive mixed.
  for (let i = state.spawnQueue.length - 1; i > 0; i -= 1) {
    const j = Math.floor(state.rng.next() * (i + 1));
    [state.spawnQueue[i], state.spawnQueue[j]] = [state.spawnQueue[j], state.spawnQueue[i]];
  }
  state.banner = { text: `WAVE ${wave}`, sub: wave === TOTAL_WAVES ? 'FINAL WAVE' : `${state.spawnQueue.length} hostiles inbound`, t: 2.2 };
  queueSfx(state, 'waveStart');
}

export function enemiesRemaining(state) {
  return state.spawnQueue.length + state.enemies.length;
}

// Three distinct upgrades the player has not maxed out, drawn at random.
export function buildUpgradeChoices(state) {
  const available = UPGRADES.filter((u) => (state.upgradeCounts[u.id] || 0) < u.max);
  const pool = [...available];
  const choices = [];
  while (pool.length > 0 && choices.length < 3) {
    const index = Math.floor(state.rng.next() * pool.length);
    choices.push(pool.splice(index, 1)[0]);
  }
  return choices;
}

export function updateWaves(state, dt) {
  if (state.waveState === 'spawning' || state.waveState === 'fighting') {
    if (state.spawnQueue.length > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        state.spawnTimer = Math.max(0.35, 0.95 - state.wave * 0.05);
        spawnEnemy(state, state.spawnQueue.shift(), state.wave);
        if (state.spawnQueue.length === 0) state.waveState = 'fighting';
      }
    } else if (state.enemies.length === 0) {
      state.waveState = 'clear';
      if (state.wave >= TOTAL_WAVES) {
        state.won = true;
        state.over = true;
        queueSfx(state, 'victory');
      } else {
        state.upgradeChoices = buildUpgradeChoices(state);
        queueSfx(state, 'waveClear');
      }
    }
  }
  if (state.banner) {
    state.banner.t -= dt;
    if (state.banner.t <= 0) state.banner = null;
  }
}
