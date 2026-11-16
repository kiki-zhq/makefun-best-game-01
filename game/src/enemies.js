// Enemies: four kinds with distinct movement and attacks, plus their bullets.
// A splitter bursts into two shards when it dies.
import { ARENA, ENEMY_KINDS, waveHpScale } from './config.js';
import { queueSfx } from './state.js';
import { addText, burst } from './particles.js';
import { damagePlayer } from './player.js';

const KINDS = ['stinger', 'spitter', 'lancer', 'hex'];

function spawnPoint(state) {
  const p = state.player;
  for (let tries = 0; tries < 12; tries += 1) {
    const edge = state.rng.int(0, 3);
    let x;
    let y;
    if (edge === 0) { x = state.rng.range(30, ARENA.width - 30); y = 30; }
    else if (edge === 1) { x = state.rng.range(30, ARENA.width - 30); y = ARENA.height - 30; }
    else if (edge === 2) { x = 30; y = state.rng.range(30, ARENA.height - 30); }
    else { x = ARENA.width - 30; y = state.rng.range(30, ARENA.height - 30); }
    const dx = x - p.x;
    const dy = y - p.y;
    if (dx * dx + dy * dy > 260 * 260) return { x, y };
  }
  return { x: 40, y: 40 };
}

export function spawnEnemy(state, kind, wave) {
  const def = ENEMY_KINDS[kind];
  const at = spawnPoint(state);
  const hp = Math.round(def.hp * waveHpScale(wave));
  state.enemies.push({
    kind,
    x: at.x, y: at.y, vx: 0, vy: 0,
    r: def.radius, hp, maxHp: hp,
    speed: def.speed * state.rng.range(0.9, 1.1),
    damage: def.damage, score: def.score, gems: def.gems,
    color: def.color, shape: def.shape,
    t: state.rng.range(0, 1.5), // per-kind state timer
    phase: 'approach',
    dashX: 0, dashY: 0,
    flash: 0, angle: state.rng.range(0, Math.PI * 2),
    dead: false,
  });
}

function moveToward(e, tx, ty, speed, dt) {
  const dx = tx - e.x;
  const dy = ty - e.y;
  const d = Math.hypot(dx, dy) || 1;
  e.x += (dx / d) * speed * dt;
  e.y += (dy / d) * speed * dt;
  e.angle = Math.atan2(dy, dx);
}

function moveAway(e, tx, ty, speed, dt) {
  const dx = e.x - tx;
  const dy = e.y - ty;
  const d = Math.hypot(dx, dy) || 1;
  e.x += (dx / d) * speed * dt;
  e.y += (dy / d) * speed * dt;
}

function clampEnemy(e) {
  e.x = Math.min(ARENA.width - e.r, Math.max(e.r, e.x));
  e.y = Math.min(ARENA.height - e.r, Math.max(e.r, e.y));
}

function fireEnemyBullet(state, e) {
  const p = state.player;
  const angle = Math.atan2(p.y - e.y, p.x - e.x);
  state.enemyBullets.push({
    x: e.x + Math.cos(angle) * (e.r + 6),
    y: e.y + Math.sin(angle) * (e.r + 6),
    vx: Math.cos(angle) * 185,
    vy: Math.sin(angle) * 185,
    r: 6, damage: e.damage, life: 4,
  });
  queueSfx(state, 'hit');
}

function killEnemy(state, e) {
  e.dead = true;
  state.kills += 1;
  state.score += e.score;
  addText(state, e.x, e.y - e.r - 6, `+${e.score}`, '#e2e8f0');
  burst(state, e.x, e.y, e.color, e.kind === 'hex' ? 16 : 10);
  queueSfx(state, 'enemyDie');
  for (let i = 0; i < e.gems; i += 1) {
    state.gems.push({
      x: e.x + state.rng.range(-14, 14),
      y: e.y + state.rng.range(-14, 14),
      vx: state.rng.range(-50, 50),
      vy: state.rng.range(-50, 50),
      r: 7, value: 10, t: state.rng.range(0, Math.PI * 2),
    });
  }
  if (e.kind === 'hex') {
    for (let i = 0; i < 2; i += 1) {
      const def = ENEMY_KINDS.shard;
      state.enemies.push({
        kind: 'shard',
        x: e.x + state.rng.range(-16, 16), y: e.y + state.rng.range(-16, 16),
        vx: 0, vy: 0, r: def.radius,
        hp: def.hp, maxHp: def.hp, speed: def.speed,
        damage: def.damage, score: def.score, gems: 0,
        color: def.color, shape: def.shape,
        t: 0, phase: 'approach', dashX: 0, dashY: 0,
        flash: 0, angle: 0, dead: false,
      });
    }
  }
}

export function updateEnemies(state, dt) {
  const p = state.player;
  for (const e of state.enemies) {
    if (e.dead) continue;
    if (e.flash > 0) e.flash -= dt;
    e.t += dt;
    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (e.kind === 'stinger' || e.kind === 'shard') {
      moveToward(e, p.x, p.y, e.speed, dt);
    } else if (e.kind === 'spitter') {
      if (dist > 300) moveToward(e, p.x, p.y, e.speed, dt);
      else if (dist < 200) moveAway(e, p.x, p.y, e.speed, dt);
      else { e.x += Math.cos(e.t * 1.3) * e.speed * 0.5 * dt; e.y += Math.sin(e.t * 1.3) * e.speed * 0.5 * dt; }
      if (e.t > 2.2 && dist < 480) {
        e.t = 0;
        fireEnemyBullet(state, e);
      }
    } else if (e.kind === 'lancer') {
      if (e.phase === 'approach') {
        moveToward(e, p.x, p.y, e.speed, dt);
        if (e.t > 1.2) { e.phase = 'telegraph'; e.t = 0; }
      } else if (e.phase === 'telegraph') {
        e.flash = 0.1;
        if (e.t > 0.5) {
          e.phase = 'dash';
          e.t = 0;
          e.dashX = dx / dist;
          e.dashY = dy / dist;
        }
      } else if (e.phase === 'dash') {
        e.x += e.dashX * 520 * dt;
        e.y += e.dashY * 520 * dt;
        if (e.t > 0.35) { e.phase = 'recover'; e.t = 0; }
      } else {
        if (e.t > 0.6) { e.phase = 'approach'; e.t = 0; }
      }
    } else if (e.kind === 'hex') {
      moveToward(e, p.x, p.y, e.speed, dt);
    }
    clampEnemy(e);
    // Contact damage.
    const rr = e.r + p.r - 2;
    if (dx * dx + dy * dy < rr * rr) {
      damagePlayer(state, e.damage);
      // Shove the enemy back so one touch is not a chain of hits.
      e.x -= (dx / dist) * 26;
      e.y -= (dy / dist) * 26;
    }
    if (e.hp <= 0) killEnemy(state, e);
  }
  state.enemies = state.enemies.filter((e) => !e.dead);
}

// Enemy orbs drift and die on the player or the arena edge.
export function updateEnemyBullets(state, dt) {
  const p = state.player;
  for (let i = state.enemyBullets.length - 1; i >= 0; i -= 1) {
    const b = state.enemyBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    const dx = b.x - p.x;
    const dy = b.y - p.y;
    const rr = b.r + p.r;
    if (dx * dx + dy * dy < rr * rr) {
      damagePlayer(state, b.damage);
      state.enemyBullets.splice(i, 1);
      continue;
    }
    if (b.life <= 0 || b.x < -20 || b.x > ARENA.width + 20 || b.y < -20 || b.y > ARENA.height + 20) {
      state.enemyBullets.splice(i, 1);
    }
  }
}

export { KINDS };
