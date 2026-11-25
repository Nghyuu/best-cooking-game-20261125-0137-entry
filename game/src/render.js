// Rush Hour Kitchen — render.js
// Every pixel of the game: the kitchen, the stations, the chef, the food,
// the order board and the timers. All art is drawn procedurally on the
// canvas — there are no image files anywhere in the game.

import {
  FLOOR,
  INGREDIENTS,
  PALETTE,
  PANTRY_ORDER,
  STATIONS,
  VIEW_H,
  VIEW_W,
} from './config.js';
import { isPlate, orderForPlate } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || '700'} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---------------------------------------------------------------- food ---

// One ingredient icon, drawn from shapes. done adds a green tick;
// burnt turns it black with a wisp of smoke.
export function drawIngredient(ctx, ing, x, y, r, done, burnt) {
  const def = INGREDIENTS[ing];
  ctx.save();
  ctx.translate(x, y);
  if (burnt) {
    ctx.fillStyle = '#1c1410';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,120,120,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -r - 2);
    ctx.quadraticCurveTo(-8, -r - 10, -2, -r - 16);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (ing === 'tomato') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, 1, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.3, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2f7d32';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.lineTo(-r * 0.45, -r * 1.15);
    ctx.lineTo(0, -r * 0.9);
    ctx.lineTo(r * 0.45, -r * 1.15);
    ctx.closePath();
    ctx.fill();
  } else if (ing === 'noodle') {
    ctx.strokeStyle = def.color;
    ctx.lineWidth = r * 0.28;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, i * r * 0.45);
      ctx.quadraticCurveTo(-r * 0.3, i * r * 0.45 - r * 0.4, r * 0.3, i * r * 0.45);
      ctx.quadraticCurveTo(r * 0.7, i * r * 0.45 + r * 0.4, r * 0.9, i * r * 0.45);
      ctx.stroke();
    }
  } else if (ing === 'egg') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.05, r * 0.85, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff9f1c';
    ctx.beginPath();
    ctx.arc(r * 0.15, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(r * 0.05, -r * 0.15, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (ing === 'beef') {
    ctx.fillStyle = def.color;
    rr(ctx, -r, -r * 0.7, r * 2, r * 1.4, r * 0.5);
    ctx.fill();
    ctx.strokeStyle = '#5d3a22';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.5 - r * 0.2, -r * 0.5);
      ctx.lineTo(i * r * 0.5 + r * 0.2, r * 0.5);
      ctx.stroke();
    }
  } else if (ing === 'pepper') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r * 0.9, -r * 0.8, r * 0.8, r * 0.6, r * 0.3, r * 0.9);
    ctx.bezierCurveTo(0, r * 1.05, -r * 0.3, r * 0.9, -r * 0.8, r * 0.6);
    ctx.bezierCurveTo(-r * 0.9, -r * 0.8, -r * 0.5, -r, 0, -r);
    ctx.fill();
    ctx.fillStyle = '#2f7d32';
    ctx.fillRect(-r * 0.12, -r * 1.25, r * 0.24, r * 0.4);
  } else if (ing === 'cheese') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.7);
    ctx.lineTo(r, r * 0.7);
    ctx.lineTo(r, -r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8a91c';
    ctx.beginPath();
    ctx.arc(-r * 0.3, r * 0.3, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.35, r * 0.45, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  if (done) {
    ctx.strokeStyle = '#2f9e44';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.55, r * 0.75);
    ctx.lineTo(r * 0.95, r * 1.15);
    ctx.lineTo(r * 1.5, r * 0.45);
    ctx.stroke();
  }
  ctx.restore();
}

// A white plate with its finished ingredients arranged on it.
export function drawPlate(ctx, items, x, y, r) {
  ctx.fillStyle = '#f4f1ea';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9c2b2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.72, r * 0.58, 0, 0, Math.PI * 2);
  ctx.stroke();
  const spots = [[-0.35, -0.1], [0.35, -0.15], [0, 0.3], [-0.05, -0.35]];
  items.forEach((ing, i) => {
    const s = spots[i % spots.length];
    drawIngredient(ctx, ing, x + s[0] * r, y + s[1] * r, r * 0.34, true, false);
  });
}

// ------------------------------------------------------------- kitchen ---

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);
  ctx.strokeStyle = PALETTE.tileLine;
  ctx.lineWidth = 2;
  for (let x = FLOOR.x; x <= FLOOR.x + FLOOR.w; x += 78) {
    ctx.beginPath();
    ctx.moveTo(x, FLOOR.y);
    ctx.lineTo(x, FLOOR.y + FLOOR.h);
    ctx.stroke();
  }
  for (let y = FLOOR.y; y <= FLOOR.y + FLOOR.h; y += 78) {
    ctx.beginPath();
    ctx.moveTo(FLOOR.x, y);
    ctx.lineTo(FLOOR.x + FLOOR.w, y);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let i = 0; i < 40; i++) {
    const x = FLOOR.x + ((i * 173) % FLOOR.w);
    const y = FLOOR.y + ((i * 97) % FLOOR.h);
    ctx.fillRect(x, y, 26, 10);
  }
  // A worn rug where the chef paces, a potted herb by the pantry and a
  // sack of flour by the door: the kitchen's lower half is walked, not bare.
  ctx.fillStyle = '#a86f36';
  rr(ctx, 470, 560, 340, 110, 12);
  ctx.fill();
  ctx.strokeStyle = '#7a4a22';
  ctx.lineWidth = 3;
  rr(ctx, 482, 572, 316, 86, 8);
  ctx.stroke();
  ctx.fillStyle = '#8a5a33';
  ctx.beginPath();
  ctx.arc(96, 636, 26, 0, Math.PI * 2);
  ctx.arc(150, 652, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9a06a';
  ctx.beginPath();
  ctx.arc(96, 630, 20, 0, Math.PI * 2);
  ctx.arc(150, 646, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b56a3a';
  rr(ctx, 62, 560, 34, 26, 4);
  ctx.fill();
  ctx.fillStyle = '#3fae5a';
  ctx.beginPath();
  ctx.arc(79, 548, 16, 0, Math.PI * 2);
  ctx.arc(68, 556, 11, 0, Math.PI * 2);
  ctx.arc(90, 556, 11, 0, Math.PI * 2);
  ctx.fill();
}

function drawWall(ctx, state) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW_W, 132);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, 126, VIEW_W, 6);
  text(ctx, 'RUSH HOUR KITCHEN', 640, 22, 15, '#d9b380', '700', 'center');
  const mins = Math.floor(state.shiftLeft / 60);
  const secs = Math.floor(state.shiftLeft % 60);
  const urgent = state.shiftLeft <= 30 && state.phase === 'playing';
  text(ctx, `SHIFT ${mins}:${String(secs).padStart(2, '0')}`, 640, 48, 22, urgent ? '#ff6b6b' : '#fff6e5', '800', 'center');
  text(ctx, `SCORE $${state.score}`, 1180, 34, 20, PALETTE.gold, '800', 'right');
  text(ctx, `SERVED ${state.served}   LOST ${state.lost}   STREAK x${state.streak}`, 1180, 60, 13, '#d9b380', '700', 'right');
}

function drawPantry(ctx) {
  const s = STATIONS.pantry;
  ctx.fillStyle = '#6b4423';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(s.x + 8, s.y + 8, s.w - 16, 6);
  ctx.fillRect(s.x + 8, s.y + s.h / 2, s.w - 16, 6);
  text(ctx, s.label, s.x + s.w / 2, s.y + s.h - 14, 13, '#ffd9a0', '800', 'center');
  const cw = s.w / 3;
  const ch = s.h / 2;
  PANTRY_ORDER.forEach((ing, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = s.x + col * cw + cw / 2;
    const cy = s.y + 14 + row * ch + ch / 2 - 12;
    ctx.fillStyle = '#a4713f';
    rr(ctx, s.x + col * cw + 6, s.y + 14 + row * ch, cw - 12, ch - 34, 6);
    ctx.fill();
    drawIngredient(ctx, ing, cx, cy, 20, false, false);
    text(ctx, String(i + 1), s.x + col * cw + 12, s.y + 14 + row * ch + 14, 11, '#fff6e5', '800');
    text(ctx, INGREDIENTS[ing].name, cx, s.y + 14 + row * ch + ch - 40, 10, '#fff6e5', '700', 'center');
  });
}

function drawBoard(ctx, state) {
  const s = STATIONS.board;
  ctx.fillStyle = '#7a5230';
  rr(ctx, s.x - 6, s.y - 6, s.w + 12, s.h + 12, 10);
  ctx.fill();
  ctx.fillStyle = '#e8c491';
  rr(ctx, s.x, s.y, s.w, s.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#c9a06a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x + 20, s.y + s.h / 2);
  ctx.lineTo(s.x + s.w - 20, s.y + s.h / 2);
  ctx.stroke();
  // Knife resting on the board.
  ctx.save();
  ctx.translate(s.x + s.w - 46, s.y + 22);
  ctx.rotate(0.5);
  ctx.fillStyle = '#cfd6dd';
  ctx.fillRect(0, 0, 52, 10);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(52, 0, 22, 10);
  ctx.restore();
  const chop = state.chef.chop;
  if (chop) {
    const p = chop.t / chop.total;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2, s.y + s.h / 2, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2, s.y + s.h / 2, 34, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    ctx.stroke();
    drawIngredient(ctx, chop.item.ing, s.x + s.w / 2, s.y + s.h / 2, 18, false, false);
    text(ctx, 'CHOPPING…', s.x + s.w / 2, s.y - 14, 13, PALETTE.accent, '800', 'center');
  } else {
    text(ctx, s.label, s.x + s.w / 2, s.y - 14, 13, '#fff6e5', '800', 'center');
  }
}

function drawStove(ctx, state) {
  const s = STATIONS.stove;
  ctx.fillStyle = '#3a3f46';
  rr(ctx, s.x - 6, s.y - 6, s.w + 12, s.h + 12, 10);
  ctx.fill();
  ctx.fillStyle = '#23262b';
  rr(ctx, s.x, s.y, s.w, s.h, 8);
  ctx.fill();
  state.burners.forEach((b, i) => {
    const bx = s.x + 60 + i * 120;
    const by = s.y + s.h / 2;
    ctx.fillStyle = b.item && b.done ? '#ff9f1c' : '#4a4f57';
    ctx.beginPath();
    ctx.arc(bx, by, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#15171a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(bx, by, 40, 0, Math.PI * 2);
    ctx.stroke();
    if (b.item) {
      drawIngredient(ctx, b.item.ing, bx, by, 24, b.item.done, b.item.burnt);
      const total = INGREDIENTS[b.item.ing].stepSeconds;
      if (!b.done && !b.item.burnt) {
        const p = Math.min(1, b.t / total);
        ctx.strokeStyle = PALETTE.accent;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(bx, by, 48, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
        ctx.stroke();
      } else if (b.done) {
        text(ctx, 'READY!', bx, by - 56, 13, PALETTE.gold, '800', 'center');
      } else if (b.item.burnt) {
        text(ctx, 'BURNT!', bx, by - 56, 13, PALETTE.danger, '800', 'center');
      }
    }
  });
  text(ctx, s.label, s.x + s.w / 2, s.y - 14, 13, '#fff6e5', '800', 'center');
}

function drawPlating(ctx, state) {
  const s = STATIONS.plating;
  ctx.fillStyle = '#9aa3ab';
  rr(ctx, s.x - 6, s.y - 6, s.w + 12, s.h + 12, 10);
  ctx.fill();
  ctx.fillStyle = '#d7dde2';
  rr(ctx, s.x, s.y, s.w, s.h, 8);
  ctx.fill();
  const ready = state.counterPlate ? orderForPlate(state, state.counterPlate.items) : null;
  if (ready) {
    text(ctx, `READY — ${ready.recipe.name}!`, s.x + s.w / 2, s.y - 14, 13, PALETTE.good, '800', 'center');
  } else {
    text(ctx, s.label, s.x + s.w / 2, s.y - 14, 13, '#fff6e5', '800', 'center');
  }
  if (state.counterPlate) {
    if (ready) {
      ctx.strokeStyle = PALETTE.good;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, 66, 50, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawPlate(ctx, state.counterPlate.items, s.x + s.w / 2, s.y + s.h / 2, 52);
  } else {
    ctx.strokeStyle = '#8a939c';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, 52, 42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'plate goes here', s.x + s.w / 2, s.y + s.h / 2, 12, '#6b7680', '700', 'center');
  }
}

function drawServe(ctx, state) {
  const s = STATIONS.serve;
  const shake = state.shakeT > 0 ? Math.sin(state.shakeT * 60) * 4 : 0;
  ctx.save();
  ctx.translate(shake, 0);
  ctx.fillStyle = '#8a2f2f';
  rr(ctx, s.x - 6, s.y - 6, s.w + 12, s.h + 12, 10);
  ctx.fill();
  ctx.fillStyle = '#2b1a10';
  rr(ctx, s.x, s.y, s.w, s.h, 8);
  ctx.fill();
  // Red-and-white awning stripes above the window.
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#e5484d' : '#fff6e5';
    ctx.fillRect(s.x + i * (s.w / 8), s.y - 2, s.w / 8, 14);
  }
  // Service bell.
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(s.x + s.w - 34, s.y + s.h / 2, 14, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(s.x + s.w - 48, s.y + s.h / 2, 28, 4);
  text(ctx, 'SERVE', s.x + 18, s.y + s.h / 2, 20, '#fff6e5', '800');
  text(ctx, s.label, s.x + s.w / 2, s.y + s.h + 18, 13, '#fff6e5', '800', 'center');
  ctx.restore();
}

function drawTrash(ctx) {
  const s = STATIONS.trash;
  ctx.fillStyle = '#4a4f57';
  rr(ctx, s.x, s.y, s.w, s.h, 8);
  ctx.fill();
  ctx.fillStyle = '#2f3339';
  ctx.fillRect(s.x + 8, s.y - 6, s.w - 16, 10);
  text(ctx, 'TRASH', s.x + s.w / 2, s.y + s.h + 16, 11, '#fff6e5', '800', 'center');
}

// ---------------------------------------------------------------- chef ---

function drawChef(ctx, state) {
  const c = state.chef;
  ctx.save();
  ctx.translate(c.x, c.y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 26, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white shirt, red apron.
  ctx.fillStyle = '#f4f1ea';
  ctx.beginPath();
  ctx.arc(0, 2, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e5484d';
  ctx.beginPath();
  ctx.moveTo(-14, -6);
  ctx.lineTo(14, -6);
  ctx.lineTo(10, 18);
  ctx.lineTo(-10, 18);
  ctx.closePath();
  ctx.fill();
  // Head and toque.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -24, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-7, -36, 8, 0, Math.PI * 2);
  ctx.arc(0, -40, 9, 0, Math.PI * 2);
  ctx.arc(7, -36, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-13, -38, 26, 6);
  // Eyes look the way the chef faces.
  ctx.fillStyle = '#2b1a10';
  ctx.beginPath();
  ctx.arc(c.facing * 4 - 4, -24, 1.8, 0, Math.PI * 2);
  ctx.arc(c.facing * 4 + 4, -24, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Carried items float at the chef's sides.
  c.hands.forEach((item, i) => {
    if (!item) return;
    const hx = (i === 0 ? -34 : 34);
    if (isPlate(item)) {
      drawPlate(ctx, item.items, hx, -6, 20);
    } else {
      drawIngredient(ctx, item.ing, hx, -6, 13, item.done, item.burnt);
    }
  });
  ctx.restore();
}

// ---------------------------------------------------------- order board ---

function drawOrderCard(ctx, order, x, y, w, h, plated) {
  const urgent = order.left < 12;
  const flash = urgent && Math.floor(order.flash * 3) % 2 === 0;
  ctx.fillStyle = flash ? '#ffe3e3' : PALETTE.cardBg;
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = urgent ? PALETTE.danger : PALETTE.cardEdge;
  ctx.lineWidth = urgent ? 3 : 2;
  rr(ctx, x, y, w, h, 8);
  ctx.stroke();
  text(ctx, order.recipe.name.toUpperCase(), x + 12, y + 16, 14, PALETTE.ink, '800');
  const mins = Math.ceil(order.left);
  text(ctx, `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`, x + w - 10, y + 16, 15, urgent ? PALETTE.danger : PALETTE.ink, '800', 'right');
  // Recipe chips: ingredient icon + what it still needs. The green tick
  // appears only once that ingredient is actually on a plate.
  order.recipe.needs.forEach((ing, i) => {
    const cx = x + 26 + i * 52;
    const cy = y + 48;
    drawIngredient(ctx, ing, cx, cy, 15, plated.has(ing), false);
    const step = INGREDIENTS[ing].label;
    text(ctx, step, cx, y + 72, 8, '#8a6a45', '800', 'center');
  });
  // Countdown bar.
  const p = Math.max(0, order.left / order.total);
  ctx.fillStyle = '#e8dcc8';
  rr(ctx, x + 10, y + h - 12, w - 20, 6, 3);
  ctx.fill();
  ctx.fillStyle = p > 0.5 ? PALETTE.good : p > 0.25 ? PALETTE.accent : PALETTE.danger;
  if (p > 0) {
    rr(ctx, x + 10, y + h - 12, (w - 20) * p, 6, 3);
    ctx.fill();
  }
}

function drawOrders(ctx, state) {
  // Everything already on a plate, on the counter or carried: those chips
  // get their tick on the order board.
  const plated = new Set(state.counterPlate ? state.counterPlate.items : []);
  for (const h of state.chef.hands) {
    if (isPlate(h)) for (const ing of h.items) plated.add(ing);
  }
  state.orders.forEach((order, i) => {
    drawOrderCard(ctx, order, 16 + i * 262, 66, 250, 92, plated);
  });
  if (state.orders.length === 0 && state.phase === 'playing') {
    text(ctx, 'No orders — breathe…', 280, 112, 16, '#d9b380', '700');
  }
}

// -------------------------------------------------------------- screens ---

function drawTitle(ctx) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'RUSH HOUR KITCHEN', 640, 210, 64, PALETTE.gold, '800', 'center');
  text(ctx, 'The dinner rush is coming. You are the whole kitchen.', 640, 268, 22, '#fff6e5', '700', 'center');
  const lines = [
    'WASD / arrows or click — move the chef',
    '1–6 at the pantry — grab an ingredient   •   E — chop, cook, plate, serve',
    'Chop at the board, cook on the stove, build the plate, ring the bell',
    'Serve before the order timer runs out — fast plates earn bigger tips',
  ];
  lines.forEach((l, i) => text(ctx, l, 640, 330 + i * 34, 18, '#ffd9a0', '700', 'center'));
  const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 350);
  ctx.globalAlpha = pulse;
  text(ctx, 'PRESS ENTER TO START THE SHIFT', 640, 510, 26, '#ffffff', '800', 'center');
  ctx.globalAlpha = 1;
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'SHIFT OVER', 640, 200, 56, PALETTE.gold, '800', 'center');
  text(ctx, state.overReason, 640, 252, 20, '#fff6e5', '700', 'center');
  text(ctx, `FINAL SCORE  $${state.score}`, 640, 320, 30, '#ffffff', '800', 'center');
  text(ctx, `Served ${state.served}   •   Lost ${state.lost}   •   Best streak x${state.bestStreak}`, 640, 368, 19, '#ffd9a0', '700', 'center');
  const stars = state.served >= 18 ? '★★★' : state.served >= 12 ? '★★☆' : state.served >= 6 ? '★☆☆' : '☆☆☆';
  text(ctx, stars, 640, 420, 40, PALETTE.gold, '800', 'center');
  text(ctx, 'PRESS R TO WORK ANOTHER SHIFT', 640, 490, 22, '#ffffff', '800', 'center');
}

function drawToast(ctx, state) {
  if (state.messageT > 0 && state.message) {
    ctx.globalAlpha = Math.min(1, state.messageT);
    ctx.fillStyle = 'rgba(20,12,6,0.8)';
    const w = ctx.measureText(state.message).width + 36;
    rr(ctx, 640 - w / 2, 668, w, 34, 17);
    ctx.fill();
    text(ctx, state.message, 640, 686, 15, '#fff6e5', '700', 'center');
    ctx.globalAlpha = 1;
  }
  if (state.phase === 'playing') {
    text(ctx, 'E — use station    1–6 — pantry    click — walk there', 640, 640, 12, 'rgba(255,246,229,0.75)', '700', 'center');
  }
}

// ------------------------------------------------------------------ main ---

export function renderGame(ctx, state) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx);
  drawWall(ctx, state);
  drawPantry(ctx);
  drawBoard(ctx, state);
  drawStove(ctx, state);
  drawPlating(ctx, state);
  drawServe(ctx, state);
  drawTrash(ctx);
  drawOrders(ctx, state);
  if (state.phase !== 'title') drawChef(ctx, state);
  drawToast(ctx, state);
  if (state.phase === 'title') drawTitle(ctx);
  if (state.phase === 'over') drawGameOver(ctx, state);
}
