// Rush Hour Kitchen — config.js
// Every tunable number, recipe, station and colour of the game lives here
// and nowhere else, so balancing the rush means editing one file.

export const VIEW_W = 1280;
export const VIEW_H = 720;

// The shift lasts two and a half minutes of real play.
export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 4;
export const CHEF_SPEED = 300;
export const CHEF_RADIUS = 22;
export const HAND_SLOTS = 2;

// The kitchen floor the chef can walk on. The top strip is the order board.
export const FLOOR = { x: 16, y: 132, w: 1248, h: 572 };

// One ingredient: its display name, its colour, the single step that makes
// it plate-ready (chop or cook), and how long that step takes.
export const INGREDIENTS = {
  tomato: { name: 'Tomato', color: '#e5484d', step: 'chop', stepSeconds: 1.6, label: 'CHOP' },
  noodle: { name: 'Noodle', color: '#f5c542', step: 'cook', stepSeconds: 4.0, label: 'COOK' },
  egg: { name: 'Egg', color: '#fff3c4', step: 'cook', stepSeconds: 3.5, label: 'COOK' },
  beef: { name: 'Beef', color: '#8a5a3b', step: 'cook', stepSeconds: 5.0, label: 'COOK' },
  pepper: { name: 'Pepper', color: '#3fae5a', step: 'chop', stepSeconds: 1.4, label: 'CHOP' },
  cheese: { name: 'Cheese', color: '#ffc53d', step: 'none', stepSeconds: 0, label: 'READY' },
};

// Pantry crates, in the order the number keys 1..6 grab them.
export const PANTRY_ORDER = ['tomato', 'noodle', 'egg', 'beef', 'pepper', 'cheese'];

// Every recipe is a dish name plus the processed ingredients it needs.
// needs entries are ingredient ids; each one must arrive chopped or cooked
// as its definition says before it counts toward the plate.
export const RECIPES = [
  {
    id: 'sunset-noodles',
    name: 'Sunset Noodles',
    price: 22,
    needs: ['noodle', 'tomato', 'egg'],
  },
  {
    id: 'ember-tacos',
    name: 'Ember Tacos',
    price: 20,
    needs: ['beef', 'pepper', 'cheese'],
  },
  {
    id: 'garden-bowl',
    name: 'Garden Bowl',
    price: 16,
    needs: ['tomato', 'pepper', 'cheese'],
  },
  {
    id: 'golden-omelette',
    name: 'Golden Omelette',
    price: 18,
    needs: ['egg', 'cheese', 'tomato'],
  },
  {
    id: 'sizzle-stirfry',
    name: 'Sizzle Stir-Fry',
    price: 24,
    needs: ['noodle', 'beef', 'pepper'],
  },
];

// Stations on the floor. Each rect is where the chef must stand next to;
// the pad is the spot the chef walks to when the station is clicked.
export const STATIONS = {
  pantry: { x: 28, y: 168, w: 196, h: 240, label: 'PANTRY', pad: { x: 268, y: 288 } },
  board: { x: 330, y: 300, w: 210, h: 110, label: 'CHOPPING BOARD', pad: { x: 435, y: 452 } },
  stove: { x: 640, y: 290, w: 240, h: 120, label: 'STOVE', pad: { x: 760, y: 452 } },
  plating: { x: 960, y: 300, w: 210, h: 110, label: 'PLATING', pad: { x: 1065, y: 452 } },
  serve: { x: 1000, y: 148, w: 236, h: 92, label: 'SERVING WINDOW', pad: { x: 960, y: 200 } },
  trash: { x: 1180, y: 620, w: 72, h: 72, label: 'TRASH', pad: { x: 1160, y: 580 } },
};

// A burnt item may sit on a burner for this long after it is done.
export const BURN_SECONDS = 6;

// How the rush grows: spawn gap and order patience shrink as the shift runs.
export function rushLevel(elapsedSeconds) {
  const t = Math.min(1, elapsedSeconds / SHIFT_SECONDS);
  return {
    t,
    spawnGap: 15 - 7 * t,
    orderSeconds: 78 - 30 * t,
    maxOrders: t < 0.35 ? 3 : MAX_ORDERS,
  };
}

export const PALETTE = {
  wall: '#3d2b1f',
  wallTrim: '#2c1e14',
  floor: '#c98f4e',
  floorDark: '#b57a3e',
  tileLine: '#a86f36',
  boardBg: '#241a12',
  cardBg: '#fff8ec',
  cardEdge: '#d9b380',
  ink: '#2b1a10',
  cream: '#fff6e5',
  accent: '#ff9f1c',
  danger: '#e5484d',
  good: '#3fae5a',
  gold: '#ffc53d',
};
