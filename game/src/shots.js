// Rush Hour Kitchen — shots.js
// Deterministic demo scenes for the screenshots. ?shot=1, 2 or 3 freezes
// the game in one exact, hand-placed moment — same orders, same timers,
// same chef spot every time — so a screenshot is a reproducible render of
// the game's own code, never a staged picture.

import { RECIPES, STATIONS } from './config.js';
import { makeIngredient, spawnOrder } from './state.js';

function placeOrder(state, recipeId, left, total) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  spawnOrder(state, recipe, total);
  const order = state.orders[state.orders.length - 1];
  order.left = left;
  order.total = total;
  order.flash = 0;
  return order;
}

function setChef(state, x, y, hands) {
  state.chef.x = x;
  state.chef.y = y;
  state.chef.tx = x;
  state.chef.ty = y;
  state.chef.moving = false;
  state.chef.hands = hands;
}

// Shot 1 — the cover: a full kitchen mid-rush. Three orders on the board,
// ingredients out on the counters, a plate half built, timers running.
export function shotCover(state) {
  state.phase = 'playing';
  state.time = 42;
  state.shiftLeft = 108;
  state.score = 86;
  state.coins = 86;
  state.served = 4;
  state.streak = 2;
  placeOrder(state, 'sunset-noodles', 52, 78);
  placeOrder(state, 'ember-tacos', 34, 66);
  placeOrder(state, 'garden-bowl', 61, 78);
  setChef(state, 300, 300, [makeIngredient('tomato'), null]);
  // A noodle cooks on burner one, a chopped pepper waits on the board side.
  state.burners[0].item = makeIngredient('noodle');
  state.burners[0].t = 2.6;
  // Half-built plate: Sunset Noodles with its cooked noodle already on.
  state.counterPlate = { items: ['noodle', 'egg'] };
  state.message = 'Sunset Noodles almost ready — chop the tomato!';
  state.messageT = 99;
  state.spawnIn = 8;
}

// Shot 2 — mid-assembly: the chef chops at the board while a plate with
// two ingredients waits on the plating counter and orders tick down.
export function shotAssembly(state) {
  state.phase = 'playing';
  state.time = 68;
  state.shiftLeft = 82;
  state.score = 124;
  state.coins = 124;
  state.served = 6;
  state.streak = 3;
  placeOrder(state, 'ember-tacos', 41, 66);
  placeOrder(state, 'sizzle-stirfry', 28, 60);
  setChef(state, STATIONS.board.pad.x, STATIONS.board.pad.y, [null, null]);
  const pepper = makeIngredient('pepper');
  state.chef.chop = { item: pepper, t: 0.9, total: 1.4 };
  // Beef finishes on the stove while the tacos plate waits with cheese.
  state.burners[1].item = makeIngredient('beef');
  state.burners[1].item.done = true;
  state.burners[1].t = 5.0;
  state.burners[1].done = true;
  state.counterPlate = { items: ['cheese'] };
  state.message = 'Chopping the pepper for the Ember Tacos…';
  state.messageT = 99;
  state.spawnIn = 6;
}

// Shot 3 — the rush moment: a plate ready to serve, the chef at the
// window, one order down to its last seconds, the stove still cooking.
export function shotServe(state) {
  state.phase = 'playing';
  state.time = 121;
  state.shiftLeft = 29;
  state.score = 212;
  state.coins = 212;
  state.served = 10;
  state.streak = 4;
  placeOrder(state, 'sunset-noodles', 9, 78);
  placeOrder(state, 'golden-omelette', 22, 60);
  placeOrder(state, 'sizzle-stirfry', 47, 60);
  setChef(state, STATIONS.serve.pad.x, STATIONS.serve.pad.y, [
    { kind: 'plate', items: ['noodle', 'tomato', 'egg'] },
    null,
  ]);
  state.burners[0].item = makeIngredient('beef');
  state.burners[0].t = 4.2;
  state.burners[0].done = true;
  state.burners[0].item.done = true;
  state.message = 'Sunset Noodles ready — serve it before the timer dies!';
  state.messageT = 99;
  state.spawnIn = 4;
}

export function setupShot(state, n) {
  state.frozen = true;
  if (n === 1) shotCover(state);
  else if (n === 2) shotAssembly(state);
  else if (n === 3) shotServe(state);
}
