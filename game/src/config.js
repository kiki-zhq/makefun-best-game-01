// NEON SURGE — tuning and content tables.
// Every number the game balances on lives here, so tuning never hides in the logic.
export const ARENA = { width: 960, height: 600 };
export const STEP = 1 / 60;
export const BEST_KEY = 'neon-surge-best';
export const TOTAL_WAVES = 10;

export const COLORS = {
  bg: '#05070f',
  grid: 'rgba(56, 189, 248, 0.07)',
  border: '#164e63',
  player: '#22d3ee',
  playerCore: '#ecfeff',
  bullet: '#a5f3fc',
  enemyBullet: '#f0abfc',
  gem: '#bef264',
  text: '#e2e8f0',
  dim: '#94a3b8',
  danger: '#fb7185',
};

export const PLAYER_BASE = {
  radius: 14,
  speed: 265,
  maxHp: 100,
  fireRate: 4.2, // shots per second
  damage: 12,
  bulletSpeed: 580,
  shots: 1,
  pierce: 0,
  magnet: 95,
  spread: 0.13, // radians between outer projectiles
};

// kind: hp, speed, radius, contact damage, score, gems dropped, color, shape
export const ENEMY_KINDS = {
  stinger: { hp: 20, speed: 98, radius: 13, damage: 10, score: 50, gems: 1, color: '#e879f9', shape: 'diamond' },
  spitter: { hp: 26, speed: 62, radius: 14, damage: 8, score: 80, gems: 2, color: '#fb923c', shape: 'square' },
  lancer: { hp: 34, speed: 72, radius: 13, damage: 14, score: 120, gems: 2, color: '#22d3ee', shape: 'triangle' },
  hex: { hp: 48, speed: 55, radius: 18, damage: 12, score: 150, gems: 3, color: '#4ade80', shape: 'hexagon' },
  shard: { hp: 10, speed: 155, radius: 8, damage: 6, score: 25, gems: 0, color: '#a3e635', shape: 'diamond' },
};

// How many of each kind each wave fields: [stinger, spitter, lancer, hex]
export const WAVE_TABLE = [
  [6, 0, 0, 0],
  [9, 2, 0, 0],
  [10, 3, 2, 0],
  [12, 4, 3, 1],
  [14, 5, 4, 2],
  [16, 6, 5, 2],
  [18, 7, 6, 3],
  [20, 8, 7, 3],
  [22, 9, 8, 4],
  [24, 10, 9, 5],
];

// Enemy health grows a little every wave so later waves stay threatening.
export function waveHpScale(wave) {
  return 1 + 0.12 * (wave - 1);
}

// Between-wave upgrade choices. apply() mutates the player's stats.
export const UPGRADES = [
  { id: 'rapid', name: 'Rapid Cycler', desc: '+25% fire rate', max: 5, apply: (p) => { p.fireRate *= 1.25; } },
  { id: 'heavy', name: 'Heavy Rounds', desc: '+30% bullet damage', max: 5, apply: (p) => { p.damage *= 1.3; } },
  { id: 'thrusters', name: 'Ion Thrusters', desc: '+12% move speed', max: 4, apply: (p) => { p.speed *= 1.12; } },
  { id: 'plating', name: 'Ablative Plating', desc: '+25 max hull, repair 25', max: 4, apply: (p) => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
  { id: 'split', name: 'Split Shot', desc: '+1 projectile per shot', max: 3, apply: (p) => { p.shots += 1; } },
  { id: 'pierce', name: 'Piercing Rounds', desc: 'Bullets pierce +1 enemy', max: 3, apply: (p) => { p.pierce += 1; } },
  { id: 'magnet', name: 'Magnet Core', desc: '+60% gem pickup radius', max: 3, apply: (p) => { p.magnet *= 1.6; } },
  { id: 'barrel', name: 'Overclocked Barrel', desc: '+20% bullet speed, +10% damage', max: 4, apply: (p) => { p.bulletSpeed *= 1.2; p.damage *= 1.1; } },
  { id: 'nanobots', name: 'Repair Nanobots', desc: 'Restore 40 hull now', max: 99, apply: (p) => { p.hp = Math.min(p.maxHp, p.hp + 40); } },
  { id: 'adrenal', name: 'Adrenal Surge', desc: '+15% fire rate, +10% move speed', max: 4, apply: (p) => { p.fireRate *= 1.15; p.speed *= 1.1; } },
];
