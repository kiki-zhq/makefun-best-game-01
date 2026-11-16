// The HUD: hull, score, wave, hostiles left, gems and combo — everything the
// player needs to know how they are doing, in one glance.
import { ARENA, TOTAL_WAVES } from './config.js';
import { comboMultiplier } from './state.js';
import { enemiesRemaining } from './waves.js';

export function drawHud(ctx, state) {
  const p = state.player;
  ctx.textBaseline = 'alphabetic';

  // Hull bar, top left.
  ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
  ctx.fillRect(14, 12, 220, 40);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(22, 20, 150, 14);
  const hpFrac = Math.max(0, p.hp / p.maxHp);
  ctx.fillStyle = hpFrac > 0.5 ? '#22d3ee' : hpFrac > 0.25 ? '#fbbf24' : '#fb7185';
  ctx.fillRect(22, 20, 150 * hpFrac, 14);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(22, 20, 150, 14);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`HULL ${Math.ceil(p.hp)}`, 180, 32);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`WAVE ${state.wave}/${TOTAL_WAVES}`, 22, 48);

  // Wave and hostiles, top centre.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`WAVE ${state.wave}`, ARENA.width / 2, 28);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`HOSTILES ${enemiesRemaining(state)}`, ARENA.width / 2, 48);

  // Score and best, top right.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`SCORE ${state.score}`, ARENA.width - 22, 28);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`BEST ${Math.max(state.best, state.score)}`, ARENA.width - 22, 48);

  // Gems and combo, bottom left.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#bef264';
  ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`◆ ${state.gemsCollected}`, 22, ARENA.height - 20);
  if (state.combo >= 4) {
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`COMBO x${comboMultiplier(state)}`, 78, ARENA.height - 20);
  }

  // Wave banner, centre, fading.
  if (state.banner) {
    const alpha = Math.min(1, state.banner.t);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#67e8f9';
    ctx.font = 'bold 44px "Segoe UI", system-ui, sans-serif';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 24;
    ctx.fillText(state.banner.text, ARENA.width / 2, ARENA.height / 2 - 40);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(state.banner.sub, ARENA.width / 2, ARENA.height / 2 - 8);
    ctx.restore();
  }
}
