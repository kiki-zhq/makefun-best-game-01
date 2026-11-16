// The player ship: movement, aiming, firing, taking damage.
import { ARENA } from './config.js';
import { queueSfx } from './state.js';

function clampToArena(player) {
  player.x = Math.min(ARENA.width - player.r, Math.max(player.r, player.x));
  player.y = Math.min(ARENA.height - player.r, Math.max(player.r, player.y));
}

function fire(state) {
  const p = state.player;
  const count = p.shots;
  const mid = (count - 1) / 2;
  for (let i = 0; i < count; i += 1) {
    const angle = p.aimAngle + (i - mid) * p.spread;
    state.bullets.push({
      x: p.x + Math.cos(angle) * (p.r + 6),
      y: p.y + Math.sin(angle) * (p.r + 6),
      vx: Math.cos(angle) * p.bulletSpeed,
      vy: Math.sin(angle) * p.bulletSpeed,
      r: 4,
      damage: p.damage,
      pierce: p.pierce,
      life: 1.1,
    });
  }
  state.stats.shotsFired += 1;
  queueSfx(state, 'shoot');
  // Muzzle flash.
  state.particles.push({
    x: p.x + Math.cos(p.aimAngle) * (p.r + 10),
    y: p.y + Math.sin(p.aimAngle) * (p.r + 10),
    vx: 0, vy: 0, life: 0.07, maxLife: 0.07, size: 14, color: '#a5f3fc', drag: 1,
  });
}

export function updatePlayer(state, move, aim, firing, dt) {
  const p = state.player;
  p.x += move.x * p.speed * dt;
  p.y += move.y * p.speed * dt;
  clampToArena(p);
  p.aimAngle = Math.atan2(aim.y - p.y, aim.x - p.x);
  if (p.invuln > 0) p.invuln -= dt;
  if (p.fireCd > 0) p.fireCd -= dt;
  if (firing && p.fireCd <= 0) {
    p.fireCd = 1 / p.fireRate;
    fire(state);
  }
  // Engine trail while moving.
  p.trailTimer -= dt;
  if ((move.x !== 0 || move.y !== 0) && p.trailTimer <= 0) {
    p.trailTimer = 0.05;
    state.particles.push({
      x: p.x - Math.cos(p.aimAngle) * p.r,
      y: p.y - Math.sin(p.aimAngle) * p.r,
      vx: -move.x * 40 + (state.rng.next() - 0.5) * 30,
      vy: -move.y * 40 + (state.rng.next() - 0.5) * 30,
      life: 0.3, maxLife: 0.3, size: 5, color: '#22d3ee', drag: 0.92,
    });
  }
}

// Bullets fly straight, age out, and pierce as far as their pierce count allows.
export function updateBullets(state, dt) {
  const { bullets, enemies } = state;
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < -20 || b.x > ARENA.width + 20 || b.y < -20 || b.y > ARENA.height + 20) {
      bullets.splice(i, 1);
      continue;
    }
    for (let j = enemies.length - 1; j >= 0; j -= 1) {
      const e = enemies[j];
      if (e.dead) continue;
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      const rr = b.r + e.r;
      if (dx * dx + dy * dy < rr * rr) {
        e.hp -= b.damage;
        e.flash = 0.09;
        state.stats.hits += 1;
        queueSfx(state, 'hit');
        state.particles.push({
          x: b.x, y: b.y, vx: (state.rng.next() - 0.5) * 160, vy: (state.rng.next() - 0.5) * 160,
          life: 0.18, maxLife: 0.18, size: 4, color: '#fde68a', drag: 0.9,
        });
        if (b.pierce > 0) {
          b.pierce -= 1;
          b.damage *= 0.8;
        } else {
          bullets.splice(i, 1);
        }
        break;
      }
    }
  }
}

export function damagePlayer(state, amount) {
  const p = state.player;
  if (!p || p.invuln > 0 || state.over) return;
  p.hp -= amount;
  p.invuln = 0.6;
  state.shake = Math.max(state.shake, 9);
  state.combo = 0;
  state.comboTimer = 0;
  queueSfx(state, 'hurt');
  if (p.hp <= 0) {
    p.hp = 0;
    state.over = true;
    queueSfx(state, 'gameOver');
  }
}
