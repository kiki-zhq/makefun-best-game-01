// The menu screens: title, the between-wave upgrade draft, game over, victory
// and pause. Each one says what happened, what to do next, and how to restart.
import { ARENA, TOTAL_WAVES } from './config.js';

const CARD_W = 260;
const CARD_H = 150;
const CARD_GAP = 20;
const CARD_Y = 250;

export function upgradeCardRects() {
  const total = CARD_W * 3 + CARD_GAP * 2;
  const x0 = (ARENA.width - total) / 2;
  return [0, 1, 2].map((i) => ({
    x: x0 + i * (CARD_W + CARD_GAP),
    y: CARD_Y,
    w: CARD_W,
    h: CARD_H,
  }));
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
}

function centerText(ctx, text, y, font, color, glow) {
  ctx.textAlign = 'center';
  ctx.font = font;
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 22;
  }
  ctx.fillStyle = color;
  ctx.fillText(text, ARENA.width / 2, y);
  ctx.shadowBlur = 0;
}

export function drawTitle(ctx, best) {
  dim(ctx);
  centerText(ctx, 'NEON SURGE', 168, 'bold 72px "Segoe UI", system-ui, sans-serif', '#67e8f9', '#22d3ee');
  centerText(ctx, 'Survive 10 waves. Collect energy. Upgrade. Win.', 208, '20px "Segoe UI", system-ui, sans-serif', '#e2e8f0');
  centerText(ctx, 'WASD / arrows — move      Mouse — aim      Hold click — fire', 268, '16px "Segoe UI", system-ui, sans-serif', '#94a3b8');
  centerText(ctx, 'P — pause      1 / 2 / 3 — pick an upgrade between waves', 296, '16px "Segoe UI", system-ui, sans-serif', '#94a3b8');
  centerText(ctx, 'A complete game: 10 waves · upgrades · win or lose', 330, '14px "Segoe UI", system-ui, sans-serif', '#64748b');
  ctx.save();
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin(Date.now() / 350);
  centerText(ctx, 'CLICK OR PRESS SPACE TO START', 420, 'bold 24px "Segoe UI", system-ui, sans-serif', '#bef264');
  ctx.restore();
  if (best > 0) centerText(ctx, `BEST SCORE ${best}`, 468, '16px "Segoe UI", system-ui, sans-serif', '#fbbf24');
}

export function drawUpgrade(ctx, state) {
  dim(ctx);
  centerText(ctx, `WAVE ${state.wave} CLEARED!`, 150, 'bold 44px "Segoe UI", system-ui, sans-serif', '#bef264', '#a3e635');
  centerText(ctx, `Score ${state.score}   ·   Hull ${Math.ceil(state.player.hp)}/${state.player.maxHp}   ·   Choose one upgrade`, 196, '17px "Segoe UI", system-ui, sans-serif', '#e2e8f0');
  const rects = upgradeCardRects();
  state.upgradeChoices.forEach((choice, i) => {
    const r = rects[i];
    ctx.fillStyle = 'rgba(8, 47, 73, 0.9)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`[${i + 1}]`, r.x + r.w / 2, r.y + 30);
    ctx.fillStyle = '#ecfeff';
    ctx.font = 'bold 19px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(choice.name, r.x + r.w / 2, r.y + 62);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(choice.desc, r.x + r.w / 2, r.y + 96);
    ctx.fillStyle = '#64748b';
    ctx.font = '13px "Segoe UI", system-ui, sans-serif';
    const owned = state.upgradeCounts[choice.id] || 0;
    ctx.fillText(owned > 0 ? `Owned x${owned}` : 'Click or press ' + (i + 1), r.x + r.w / 2, r.y + 124);
  });
  centerText(ctx, `Next: WAVE ${state.wave + 1} of ${TOTAL_WAVES}`, 460, '16px "Segoe UI", system-ui, sans-serif', '#94a3b8');
}

function endScreen(ctx, title, titleColor, glow, lines, best) {
  dim(ctx);
  centerText(ctx, title, 180, 'bold 64px "Segoe UI", system-ui, sans-serif', titleColor, glow);
  lines.forEach((line, i) => {
    centerText(ctx, line, 248 + i * 34, i === 0 ? 'bold 24px "Segoe UI", system-ui, sans-serif' : '18px "Segoe UI", system-ui, sans-serif', i === 0 ? '#e2e8f0' : '#94a3b8');
  });
  ctx.save();
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin(Date.now() / 350);
  centerText(ctx, 'PRESS R OR CLICK TO PLAY AGAIN', 420, 'bold 22px "Segoe UI", system-ui, sans-serif', '#bef264');
  ctx.restore();
  if (best > 0) centerText(ctx, `BEST SCORE ${best}`, 468, '16px "Segoe UI", system-ui, sans-serif', '#fbbf24');
}

export function drawGameOver(ctx, state, best) {
  endScreen(ctx, 'GAME OVER', '#fb7185', '#f43f5e', [
    `Final score ${state.score}`,
    `You fell on wave ${state.wave} of ${TOTAL_WAVES}  ·  ${state.kills} enemies destroyed  ·  ${state.gemsCollected} gems collected`,
  ], best);
}

export function drawVictory(ctx, state, best) {
  endScreen(ctx, 'VICTORY!', '#bef264', '#a3e635', [
    `You cleared all ${TOTAL_WAVES} waves!`,
    `Final score ${state.score}  ·  ${state.kills} enemies destroyed  ·  ${state.gemsCollected} gems collected`,
  ], best);
}

export function drawPaused(ctx) {
  dim(ctx);
  centerText(ctx, 'PAUSED', 260, 'bold 56px "Segoe UI", system-ui, sans-serif', '#e2e8f0', '#64748b');
  centerText(ctx, 'Press P or click to resume', 320, '18px "Segoe UI", system-ui, sans-serif', '#94a3b8');
}
