// Keyboard + mouse input, read once per frame.
// The game converts mouse pixels to arena coordinates through setView().
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_PICK1 = 8;
export const ACTION_PICK2 = 16;
export const ACTION_PICK3 = 32;

export function createInput(canvas) {
  const keys = new Set();
  let mouseX = 0;
  let mouseY = 0;
  let mouseDown = false;
  let actions = 0;
  let clicks = [];
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function keyName(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  window.addEventListener('keydown', (event) => {
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault();
    const key = keyName(event);
    if (!event.repeat) {
      if (key === ' ' || key === 'Enter') actions |= ACTION_CONFIRM;
      if (key === 'p' || key === 'Escape') actions |= ACTION_PAUSE;
      if (key === 'r') actions |= ACTION_RESTART;
      if (key === '1' || key === '2' || key === '3') actions |= 8 << (Number(key) - 1);
    }
    keys.add(key);
  });
  window.addEventListener('keyup', (event) => keys.delete(keyName(event)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  });
  canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
      mouseDown = true;
      const rect = canvas.getBoundingClientRect();
      clicks.push({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    }
  });
  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) mouseDown = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    setView(viewScale, viewOffsetX, viewOffsetY) {
      scale = viewScale;
      offsetX = viewOffsetX;
      offsetY = viewOffsetY;
    },
    // Movement vector from WASD or the arrow keys, normalized.
    move() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('d') || keys.has('ArrowRight')) x += 1;
      if (keys.has('w') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('s') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) {
        const len = Math.hypot(x, y);
        x /= len;
        y /= len;
      }
      return { x, y };
    },
    // Aim point in arena coordinates.
    aim() {
      return { x: (mouseX - offsetX) / scale, y: (mouseY - offsetY) / scale };
    },
    firing() {
      return mouseDown;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeClicks() {
      const taken = clicks;
      clicks = [];
      // Convert canvas pixels to arena coordinates with the current view.
      return taken.map((c) => ({ x: (c.x - offsetX) / scale, y: (c.y - offsetY) / scale }));
    },
  };
}
