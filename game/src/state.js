// Rush Hour Kitchen — state.js
// The whole game state: the chef, the orders, the stove, the plate, the
// score. Pure data plus the small rules that move it; drawing lives in
// render.js and input lives in input.js.

import {
  CHEF_RADIUS,
  FLOOR,
  HAND_SLOTS,
  INGREDIENTS,
  PANTRY_ORDER,
  RECIPES,
  SHIFT_SECONDS,
  STATIONS,
  BURN_SECONDS,
  rushLevel,
} from './config.js';

// A carried thing: a raw or finished ingredient, a burnt one, or a plate.
// { kind: 'ingredient', ing: 'tomato', done: false }
// { kind: 'ingredient', ing: 'tomato', done: true }
// { kind: 'ingredient', ing: 'tomato', done: false, burnt: true }
// { kind: 'plate', items: ['tomato', 'egg'] }  (items are finished ids)
export function makeIngredient(ing) {
  return { kind: 'ingredient', ing, done: INGREDIENTS[ing].step === 'none', burnt: false };
}

export function isPlate(item) {
  return !!item && item.kind === 'plate';
}

export function createState() {
  return {
    phase: 'title', // 'title' | 'playing' | 'over'
    time: 0, // seconds since the shift started
    shiftLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    served: 0,
    lost: 0,
    streak: 0,
    bestStreak: 0,
    orders: [], // { id, recipe, left, total, flash }
    nextOrderId: 1,
    spawnIn: 2.5,
    chef: {
      x: 640, y: 560, r: CHEF_RADIUS,
      tx: 640, ty: 560, // click-to-move target
      moving: false,
      facing: 1,
      hands: [null, null],
      chop: null, // { item, t, total } while chopping
    },
    burners: [
      { item: null, t: 0, done: false },
      { item: null, t: 0, done: false },
    ],
    counterPlate: null, // { items: [...] } resting on the plating counter
    message: '',
    messageT: 0,
    shakeT: 0,
    frozen: false, // screenshots: render a fixed moment, never advance
    overReason: '',
    seed: 12345,
  };
}

export function rand(state) {
  // Tiny deterministic generator so demo shots always deal the same orders.
  state.seed = (state.seed * 1103515245 + 12345) & 0x7fffffff;
  return state.seed / 0x7fffffff;
}

export function pickRecipe(state, avoidId) {
  let r = RECIPES[Math.floor(rand(state) * RECIPES.length)];
  if (RECIPES.length > 1 && r.id === avoidId) {
    r = RECIPES[(RECIPES.indexOf(r) + 1) % RECIPES.length];
  }
  return r;
}

export function spawnOrder(state, recipe, seconds) {
  const rush = rushLevel(state.time);
  const total = seconds || rush.orderSeconds;
  const last = state.orders[state.orders.length - 1];
  const chosen = recipe || pickRecipe(state, last ? last.recipe.id : null);
  state.orders.push({
    id: state.nextOrderId++,
    recipe: chosen,
    left: total,
    total,
    flash: 0,
  });
}

export function freeHand(state) {
  for (let i = 0; i < HAND_SLOTS; i++) if (!state.chef.hands[i]) return i;
  return -1;
}

export function firstHandWith(state, test) {
  for (let i = 0; i < HAND_SLOTS; i++) {
    const h = state.chef.hands[i];
    if (h && test(h, i)) return i;
  }
  return -1;
}

export function say(state, text) {
  state.message = text;
  state.messageT = 2.2;
}

export function grabFromPantry(state, ing) {
  const slot = freeHand(state);
  if (slot < 0) { say(state, 'Hands full!'); return false; }
  state.chef.hands[slot] = makeIngredient(ing);
  return true;
}

export function startChop(state) {
  const chef = state.chef;
  if (chef.chop) return false;
  const idx = firstHandWith(state, (h) => h.kind === 'ingredient' && !h.done && !h.burnt && INGREDIENTS[h.ing].step === 'chop');
  if (idx < 0) { say(state, 'Need something to chop!'); return false; }
  const item = chef.hands[idx];
  chef.hands[idx] = null;
  chef.chop = { item, t: 0, total: INGREDIENTS[item.ing].stepSeconds };
  return true;
}

export function placeOnStove(state) {
  const idx = firstHandWith(state, (h) => h.kind === 'ingredient' && !h.done && !h.burnt && INGREDIENTS[h.ing].step === 'cook');
  if (idx < 0) { say(state, 'Need something to cook!'); return false; }
  const burner = state.burners.find((b) => !b.item);
  if (!burner) { say(state, 'Both burners busy!'); return false; }
  burner.item = state.chef.hands[idx];
  burner.t = 0;
  burner.done = false;
  state.chef.hands[idx] = null;
  return true;
}

export function takeFromStove(state) {
  const burner = state.burners.find((b) => b.item && (b.done || b.item.burnt));
  if (!burner) { say(state, 'Nothing ready on the stove!'); return false; }
  const slot = freeHand(state);
  if (slot < 0) { say(state, 'Hands full!'); return false; }
  state.chef.hands[slot] = burner.item;
  burner.item = null;
  burner.t = 0;
  burner.done = false;
  return true;
}

// Add a finished ingredient to the plate on the counter, or pick the plate
// up when the hands are empty of ingredients. Returns what happened.
export function usePlating(state) {
  const chef = state.chef;
  const ingIdx = firstHandWith(state, (h) => h.kind === 'ingredient' && h.done && !h.burnt);
  if (ingIdx >= 0) {
    const item = chef.hands[ingIdx];
    if (!state.counterPlate) state.counterPlate = { items: [] };
    if (state.counterPlate.items.includes(item.ing)) {
      say(state, 'Already on the plate!');
      return 'dup';
    }
    state.counterPlate.items.push(item.ing);
    chef.hands[ingIdx] = null;
    return 'added';
  }
  const plateIdx = firstHandWith(state, (h) => isPlate(h));
  if (plateIdx >= 0 && !state.counterPlate) {
    state.counterPlate = { items: state.chef.hands[plateIdx].items };
    state.chef.hands[plateIdx] = null;
    return 'put-down';
  }
  if (plateIdx < 0 && state.counterPlate) {
    const slot = freeHand(state);
    if (slot < 0) { say(state, 'Hands full!'); return 'full'; }
    state.chef.hands[slot] = { kind: 'plate', items: state.counterPlate.items };
    state.counterPlate = null;
    return 'picked-up';
  }
  if (plateIdx >= 0 && state.counterPlate) {
    say(state, 'One plate at a time!');
    return 'busy';
  }
  say(state, 'Bring a finished ingredient!');
  return 'empty';
}

export function plateMatchesOrder(plateItems, recipe) {
  if (plateItems.length !== recipe.needs.length) return false;
  const sorted = [...plateItems].sort();
  const wanted = [...recipe.needs].sort();
  return sorted.every((v, i) => v === wanted[i]);
}

export function orderForPlate(state, plateItems) {
  return state.orders.find((o) => plateMatchesOrder(plateItems, o.recipe));
}

export function servePlate(state) {
  const idx = firstHandWith(state, (h) => isPlate(h));
  if (idx < 0) { say(state, 'Carry a plate to serve!'); return false; }
  const plate = state.chef.hands[idx];
  const order = orderForPlate(state, plate.items);
  if (!order) {
    state.shakeT = 0.35;
    say(state, 'No order wants this plate!');
    return false;
  }
  const tip = 4 + Math.floor(order.left / 12);
  const pay = order.recipe.price + tip;
  state.score += pay;
  state.coins += pay;
  state.served += 1;
  state.streak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.chef.hands[idx] = null;
  say(state, `Served ${order.recipe.name}! +$${pay} (tip $${tip})`);
  return true;
}

export function trashHand(state) {
  const idx = firstHandWith(state, (h) => !!h);
  if (idx < 0) { say(state, 'Nothing to throw away!'); return false; }
  state.chef.hands[idx] = null;
  return true;
}

export function nearStation(state, name) {
  const s = STATIONS[name];
  const c = state.chef;
  const cx = Math.max(s.x, Math.min(c.x, s.x + s.w));
  const cy = Math.max(s.y, Math.min(c.y, s.y + s.h));
  const dx = c.x - cx;
  const dy = c.y - cy;
  return Math.hypot(dx, dy) < 78;
}

function stationDistance(state, name) {
  const s = STATIONS[name];
  const c = state.chef;
  const cx = Math.max(s.x, Math.min(c.x, s.x + s.w));
  const cy = Math.max(s.y, Math.min(c.y, s.y + s.h));
  return Math.hypot(c.x - cx, c.y - cy);
}

// The closest station in reach. The serving window's pad sits close to
// the plating counter, so a fixed check order would use the wrong one.
export function nearestStation(state) {
  let best = null;
  let bestD = Infinity;
  for (const name of Object.keys(STATIONS)) {
    const d = stationDistance(state, name);
    if (d < bestD) { bestD = d; best = name; }
  }
  return bestD < 78 ? best : null;
}

export function interact(state, preferred) {
  if (state.phase !== 'playing' || state.chef.chop) return;
  const station = (preferred && nearStation(state, preferred)) ? preferred : nearestStation(state);
  if (!station) return;
  if (station === 'pantry') {
    say(state, 'Pantry: press 1-6 or click a crate');
    return;
  }
  if (station === 'board') { startChop(state); return; }
  if (station === 'stove') {
    const ready = state.burners.some((b) => b.item && (b.done || b.item.burnt));
    if (ready) takeFromStove(state);
    else placeOnStove(state);
    return;
  }
  if (station === 'plating') { usePlating(state); return; }
  if (station === 'serve') { servePlate(state); return; }
  if (station === 'trash') { trashHand(state); return; }
}

export function startShift(state) {
  const fresh = createState();
  Object.assign(state, fresh, { phase: 'playing' });
  spawnOrder(state);
  spawnOrder(state);
  state.spawnIn = 9;
}

export function updateState(state, dt) {
  if (state.phase !== 'playing' || state.frozen) return;
  state.time += dt;
  state.shiftLeft = Math.max(0, SHIFT_SECONDS - state.time);
  if (state.messageT > 0) state.messageT -= dt;
  if (state.shakeT > 0) state.shakeT -= dt;

  // Chopping finishes on its own; the finished piece lands in a free hand.
  const chef = state.chef;
  if (chef.chop) {
    chef.chop.t += dt;
    if (chef.chop.t >= chef.chop.total) {
      const item = chef.chop.item;
      item.done = true;
      chef.chop = null;
      const slot = freeHand(state);
      if (slot >= 0) chef.hands[slot] = item;
      else say(state, 'Chopped — but no free hand!');
    }
  }

  // Burners cook, then overcook into burnt food.
  for (const b of state.burners) {
    if (!b.item || b.item.burnt) continue;
    b.t += dt;
    const total = INGREDIENTS[b.item.ing].stepSeconds;
    if (!b.done && b.t >= total) {
      b.done = true;
      b.item.done = true;
    } else if (b.done && b.t >= total + BURN_SECONDS) {
      b.item.burnt = true;
      b.item.done = false;
      b.done = false;
      say(state, 'Something burnt on the stove!');
    }
  }

  // Orders count down; an expired order breaks the streak.
  for (const o of state.orders) {
    o.left -= dt;
    if (o.left < 10) o.flash += dt;
  }
  const expired = state.orders.filter((o) => o.left <= 0);
  if (expired.length) {
    state.orders = state.orders.filter((o) => o.left > 0);
    state.lost += expired.length;
    state.streak = 0;
    say(state, `Order expired! ${expired.map((o) => o.recipe.name).join(', ')}`);
  }

  // New orders arrive faster as the rush grows.
  const rush = rushLevel(state.time);
  state.spawnIn -= dt;
  if (state.spawnIn <= 0 && state.orders.length < rush.maxOrders) {
    spawnOrder(state);
    state.spawnIn = rush.spawnGap * (0.85 + rand(state) * 0.3);
  }

  if (state.shiftLeft <= 0) {
    state.phase = 'over';
    state.overReason = state.served >= 12 ? 'Rush survived — the kitchen is yours!' : 'Shift over — the dinner rush won this time.';
  }
}

export function constrainChef(state) {
  const c = state.chef;
  c.x = Math.max(FLOOR.x + c.r, Math.min(c.x, FLOOR.x + FLOOR.w - c.r));
  c.y = Math.max(FLOOR.y + c.r, Math.min(c.y, FLOOR.y + FLOOR.h - c.r));
  for (const s of Object.values(STATIONS)) {
    if (s === STATIONS.trash) continue;
    // The station rect grown by the chef's radius: push out along the
    // shallowest side so the chef slides along counters instead of
    // teleporting through them.
    const ex = s.x - c.r;
    const ey = s.y - c.r;
    const ew = s.w + c.r * 2;
    const eh = s.h + c.r * 2;
    if (c.x > ex && c.x < ex + ew && c.y > ey && c.y < ey + eh) {
      const pl = c.x - ex;
      const pr = ex + ew - c.x;
      const pt = c.y - ey;
      const pb = ey + eh - c.y;
      const m = Math.min(pl, pr, pt, pb);
      if (m === pl) c.x = ex;
      else if (m === pr) c.x = ex + ew;
      else if (m === pt) c.y = ey;
      else c.y = ey + eh;
    }
  }
}

export { PANTRY_ORDER, INGREDIENTS };
