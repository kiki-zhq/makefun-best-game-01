// Energy gems: the pickups enemies drop. They drift, magnet toward the player,
// and build a combo that multiplies their score.
import { comboMultiplier, queueSfx } from './state.js';
import { addText } from './particles.js';

export function updateGems(state, dt) {
  const p = state.player;
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }
  for (let i = state.gems.length - 1; i >= 0; i -= 1) {
    const g = state.gems[i];
    g.t += dt * 4;
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    g.vx *= 0.92;
    g.vy *= 0.92;
    const dx = p.x - g.x;
    const dy = p.y - g.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < p.magnet) {
      const pull = 460 * (1 - dist / (p.magnet + 60));
      g.x += (dx / dist) * pull * dt;
      g.y += (dy / dist) * pull * dt;
    }
    if (dist < p.r + g.r + 6) {
      state.gems.splice(i, 1);
      state.gemsCollected += 1;
      state.combo += 1;
      state.comboTimer = 2;
      const gained = g.value * comboMultiplier(state);
      state.score += gained;
      addText(state, g.x, g.y - 10, `+${gained}`, '#bef264');
      queueSfx(state, 'pickup', state.combo);
    }
  }
}

// Apply one of the between-wave upgrade choices to the player.
export function applyUpgrade(state, upgrade) {
  upgrade.apply(state.player);
  state.upgradeCounts[upgrade.id] = (state.upgradeCounts[upgrade.id] || 0) + 1;
  queueSfx(state, 'upgrade');
}
