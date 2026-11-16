// The renderer: fits the 960x600 arena to the window, paints the world with a
// neon glow, then the HUD and whichever screen sits on top.
import { ARENA, COLORS } from './config.js';
import { drawHud } from './hud.js';
import { drawGameOver, drawPaused, drawTitle, drawUpgrade, drawVictory } from './screens.js';
import { shakeOffset } from './particles.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_UPGRADE = 'upgrade';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';
export const SCREEN_PAUSED = 'paused';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  let view = { scale: 1, ox: 0, oy: 0 };

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const scale = Math.min(w / ARENA.width, h / ARENA.height);
    view = { scale, ox: (w - ARENA.width * scale) / 2, oy: (h - ARENA.height * scale) / 2 };
    return view;
  }

  function drawShape(shape, x, y, r, angle, color, glow) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.shadowColor = glow || color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = color;
    ctx.beginPath();
    if (shape === 'diamond') {
      ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0);
    } else if (shape === 'square') {
      ctx.rect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);
    } else if (shape === 'triangle') {
      ctx.moveTo(r * 1.2, 0); ctx.lineTo(-r * 0.8, r * 0.85); ctx.lineTo(-r * 0.8, -r * 0.85);
    } else if (shape === 'hexagon') {
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
    } else {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, ARENA.width, ARENA.height);
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= ARENA.width; x += 48) { ctx.moveTo(x, 0); ctx.lineTo(x, ARENA.height); }
    for (let y = 0; y <= ARENA.height; y += 48) { ctx.moveTo(0, y); ctx.lineTo(ARENA.width, y); }
    ctx.stroke();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 12;
    ctx.strokeRect(2, 2, ARENA.width - 4, ARENA.height - 4);
    ctx.shadowBlur = 0;
  }

  function draw(state, screen, best) {
    const shake = shakeOffset(state);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.setTransform(
      dpr * view.scale, 0, 0, dpr * view.scale,
      dpr * (view.ox + shake.x * view.scale), dpr * (view.oy + shake.y * view.scale),
    );
    drawBackground();

    // Gems.
    for (const g of state.gems) {
      const pulse = 0.8 + 0.2 * Math.sin(g.t);
      drawShape('diamond', g.x, g.y, g.r * pulse, g.t * 0.5, COLORS.gem);
    }

    // Enemies, with a white flash while hit.
    for (const e of state.enemies) {
      const color = e.flash > 0 ? '#ffffff' : e.color;
      drawShape(e.shape, e.x, e.y, e.r, e.angle, color);
      if (e.maxHp > 26 && e.hp < e.maxHp) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(e.x - e.r, e.y - e.r - 10, e.r * 2, 4);
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(e.x - e.r, e.y - e.r - 10, (e.r * 2 * e.hp) / e.maxHp, 4);
      }
      // Lancer telegraph: a bright ring while it winds up.
      if (e.kind === 'lancer' && e.phase === 'telegraph') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r + 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Bullets, additive so they glow.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of state.bullets) {
      ctx.fillStyle = COLORS.bullet;
      ctx.shadowColor = COLORS.bullet;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of state.enemyBullets) {
      ctx.fillStyle = COLORS.enemyBullet;
      ctx.shadowColor = COLORS.enemyBullet;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Player ship, blinking while invulnerable.
    const pl = state.player;
    if (pl && !(pl.invuln > 0 && Math.floor(pl.invuln * 20) % 2 === 0)) {
      drawShape('triangle', pl.x, pl.y, pl.r + 4, pl.aimAngle, COLORS.player);
      ctx.fillStyle = COLORS.playerCore;
      ctx.beginPath();
      ctx.arc(pl.x, pl.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating score text.
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    for (const t of state.texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;

    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED || screen === SCREEN_UPGRADE) drawHud(ctx, state);
    if (screen === SCREEN_TITLE) drawTitle(ctx, best);
    else if (screen === SCREEN_UPGRADE) drawUpgrade(ctx, state);
    else if (screen === SCREEN_OVER) drawGameOver(ctx, state, best);
    else if (screen === SCREEN_WIN) drawVictory(ctx, state, best);
    else if (screen === SCREEN_PAUSED) drawPaused(ctx);
  }

  return { resize, draw, getView: () => view };
}
