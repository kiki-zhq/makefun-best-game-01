// Synthesized sound effects with plain WebAudio — no audio files, no network.
// The context is created on the first user gesture; every call is safe before that.
export function createAudio() {
  let ctx = null;
  let master = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.16;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freqFrom, freqTo, seconds, type, volume, when = 0) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, freqFrom), t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), t0 + seconds);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  function noise(seconds, volume, freq) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime;
    const len = Math.max(1, Math.floor(c.sampleRate * seconds));
    const buffer = c.createBuffer(1, len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0);
  }

  const players = {
    shoot() { tone(720, 190, 0.09, 'square', 0.5); },
    hit() { noise(0.06, 0.5, 2600); },
    enemyDie() { tone(320, 52, 0.22, 'sawtooth', 0.6); noise(0.12, 0.35, 1200); },
    pickup(combo) { const base = 520 + Math.min(combo, 12) * 32; tone(base, base * 1.6, 0.1, 'sine', 0.55); },
    hurt() { tone(150, 60, 0.25, 'sawtooth', 0.8); noise(0.15, 0.4, 700); },
    waveClear() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.16, 'triangle', 0.55, i * 0.09)); },
    upgrade() { tone(440, 880, 0.14, 'triangle', 0.6); tone(660, 1320, 0.14, 'triangle', 0.5, 0.08); },
    gameOver() { [392, 311, 233, 155].forEach((f, i) => tone(f, f * 0.94, 0.3, 'triangle', 0.6, i * 0.17)); },
    victory() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f, 0.22, 'triangle', 0.6, i * 0.11)); },
    waveStart() { tone(262, 523, 0.18, 'triangle', 0.5); },
  };

  return {
    // Call from a click or keypress so the browser allows sound.
    unlock() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); },
    play(name, arg) {
      const fn = players[name];
      if (fn) fn(arg);
    },
  };
}
