// One fixed step of the whole game: the order the systems run in, shared by the
// live loop and by the screenshot staging, so a staged frame is a real frame.
import { updatePlayer, updateBullets } from './player.js';
import { updateEnemies, updateEnemyBullets } from './enemies.js';
import { updateGems } from './gems.js';
import { updateParticles } from './particles.js';
import { updateWaves } from './waves.js';

export function stepWorld(state, move, aim, firing, dt) {
  state.time += dt;
  if (state.player) updatePlayer(state, move, aim, firing, dt);
  updateBullets(state, dt);
  updateEnemies(state, dt);
  updateEnemyBullets(state, dt);
  updateGems(state, dt);
  updateWaves(state, dt);
  updateParticles(state, dt);
}
