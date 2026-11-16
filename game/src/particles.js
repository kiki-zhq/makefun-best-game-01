// Particles, floating score text, and screen shake — the juice on every action.
export function burst(state, x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = state.rng.range(0, Math.PI * 2);
    const speed = state.rng.range(60, 260);
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: state.rng.range(0.25, 0.6),
      maxLife: 0.6,
      size: state.rng.range(3, 7),
      color,
      drag: 0.9,
    });
  }
}

export function addText(state, x, y, text, color) {
  state.texts.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
}

export function updateParticles(state, dt) {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.life -= dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.texts.length - 1; i >= 0; i -= 1) {
    const t = state.texts[i];
    t.y -= 34 * dt;
    t.life -= dt;
    if (t.life <= 0) state.texts.splice(i, 1);
  }
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 26);
}

// Where the camera sits this frame, including the shake offset.
export function shakeOffset(state) {
  if (state.shake <= 0) return { x: 0, y: 0 };
  const s = state.shake;
  return {
    x: (state.rng.next() - 0.5) * s,
    y: (state.rng.next() - 0.5) * s,
  };
}
