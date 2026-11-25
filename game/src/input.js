// Rush Hour Kitchen — input.js
// Keyboard (WASD / arrows to walk, E or Space to use a station, 1-6 to grab
// from the pantry, Enter to start, R to restart) and mouse (click to walk,
// click a station to walk there and use it, click a pantry crate to grab).

import { FLOOR, PANTRY_ORDER, STATIONS } from './config.js';
import {
  constrainChef,
  grabFromPantry,
  interact,
  nearStation,
  startShift,
} from './state.js';

// --- pathfinding ---------------------------------------------------------
// The kitchen floor is a coarse grid; a station counter blocks the cells
// its rect (grown by the chef's radius) covers. A* over that grid routes
// the chef around counters, so a click on the far side of the stove walks
// around it instead of pushing forever against its wall.

const CELL = 40;
const COLS = Math.ceil(FLOOR.w / CELL);
const ROWS = Math.ceil(FLOOR.h / CELL);

function cellCenter(col, row) {
  return { x: FLOOR.x + col * CELL + CELL / 2, y: FLOOR.y + row * CELL + CELL / 2 };
}

function cellBlocked(col, row) {
  const c = cellCenter(col, row);
  if (c.x < FLOOR.x || c.x > FLOOR.x + FLOOR.w || c.y < FLOOR.y || c.y > FLOOR.y + FLOOR.h) return true;
  for (const [name, s] of Object.entries(STATIONS)) {
    if (name === 'trash') continue;
    if (c.x > s.x - 22 && c.x < s.x + s.w + 22 && c.y > s.y - 22 && c.y < s.y + s.h + 22) return true;
  }
  return false;
}

function nearestFreeCell(col, row) {
  if (!cellBlocked(col, row)) return { col, row };
  for (let r = 1; r < Math.max(COLS, ROWS); r++) {
    for (let dc = -r; dc <= r; dc++) {
      for (let dr = -r; dr <= r; dr++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== r) continue;
        const nc = col + dc;
        const nr = row + dr;
        if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && !cellBlocked(nc, nr)) {
          return { col: nc, row: nr };
        }
      }
    }
  }
  return { col, row };
}

function findPath(fromX, fromY, toX, toY) {
  const startCol = Math.max(0, Math.min(COLS - 1, Math.floor((fromX - FLOOR.x) / CELL)));
  const startRow = Math.max(0, Math.min(ROWS - 1, Math.floor((fromY - FLOOR.y) / CELL)));
  const goalCell = nearestFreeCell(
    Math.max(0, Math.min(COLS - 1, Math.floor((toX - FLOOR.x) / CELL))),
    Math.max(0, Math.min(ROWS - 1, Math.floor((toY - FLOOR.y) / CELL))),
  );
  const start = nearestFreeCell(startCol, startRow);
  const key = (c, r) => r * COLS + c;
  const open = [{ col: start.col, row: start.row, g: 0, f: 0, parent: null }];
  const best = new Map([[key(start.col, start.row), 0]]);
  const closed = new Set();
  const heur = (c, r) => Math.abs(c - goalCell.col) + Math.abs(r - goalCell.row);
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    const ck = key(cur.col, cur.row);
    if (closed.has(ck)) continue;
    closed.add(ck);
    if (cur.col === goalCell.col && cur.row === goalCell.row) {
      const cells = [];
      let n = cur;
      while (n) { cells.unshift(cellCenter(n.col, n.row)); n = n.parent; }
      return cells;
    }
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = cur.col + dc;
      const nr = cur.row + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS || cellBlocked(nc, nr)) continue;
      const nk = key(nc, nr);
      if (closed.has(nk)) continue;
      const g = cur.g + 1;
      if (best.has(nk) && best.get(nk) <= g) continue;
      best.set(nk, g);
      open.push({ col: nc, row: nr, g, f: g + heur(nc, nr), parent: cur });
    }
  }
  return null;
}

export function createInput(canvas, state, audio) {
  const keys = new Set();
  let clickTarget = null; // { x, y, station } — walk here, then use station
  let path = null; // A* waypoints from findPath, or null for a straight walk
  let pathIndex = 0;

  function setWalkTarget(x, y, station) {
    clickTarget = { x, y, station };
    state.chef.tx = x;
    state.chef.ty = y;
    state.chef.moving = true;
    path = findPath(state.chef.x, state.chef.y, x, y);
    pathIndex = 0;
  }

  function canvasPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - rect.left) * (canvas.width / rect.width),
      y: (ev.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function stationAt(x, y) {
    for (const [name, s] of Object.entries(STATIONS)) {
      if (x >= s.x - 8 && x <= s.x + s.w + 8 && y >= s.y - 8 && y <= s.y + s.h + 8) return name;
    }
    // Clicking the floor spot in front of a station counts too: the pad is
    // where the chef stands to use it.
    for (const [name, s] of Object.entries(STATIONS)) {
      if (Math.hypot(x - s.pad.x, y - s.pad.y) < 70) return name;
    }
    return null;
  }

  function pantryCrateAt(x, y) {
    // Crates sit in two rows of three inside the pantry rect.
    const s = STATIONS.pantry;
    const cw = s.w / 3;
    const ch = s.h / 2;
    for (let i = 0; i < PANTRY_ORDER.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = s.x + col * cw;
      const cy = s.y + 14 + row * ch;
      if (x >= cx + 6 && x <= cx + cw - 6 && y >= cy && y <= cy + ch - 30) {
        return PANTRY_ORDER[i];
      }
    }
    return null;
  }

  function onKeyDown(ev) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(ev.key)) {
      ev.preventDefault();
    }
    if (ev.repeat) return;
    keys.add(ev.key.toLowerCase());
    audio.unlock();

    if (state.phase === 'title' && (ev.key === 'Enter' || ev.key === ' ')) {
      audio.unlock();
      startShift(state);
      return;
    }
    if (state.phase === 'over' && (ev.key === 'r' || ev.key === 'R' || ev.key === 'Enter')) {
      startShift(state);
      return;
    }
    if (state.phase !== 'playing') return;

    if (ev.key === 'e' || ev.key === 'E' || ev.key === ' ') {
      interact(state);
      audio.tap();
    }
    const num = parseInt(ev.key, 10);
    if (num >= 1 && num <= PANTRY_ORDER.length && nearStation(state, 'pantry')) {
      if (grabFromPantry(state, PANTRY_ORDER[num - 1])) audio.pickup();
    }
  }

  function onKeyUp(ev) {
    keys.delete(ev.key.toLowerCase());
  }

  function onMouseDown(ev) {
    audio.unlock();
    if (state.phase !== 'playing') return;
    const p = canvasPoint(ev);
    const crate = pantryCrateAt(p.x, p.y);
    if (crate && nearStation(state, 'pantry')) {
      if (grabFromPantry(state, crate)) audio.pickup();
      return;
    }
    const station = stationAt(p.x, p.y);
    if (station) {
      const pad = STATIONS[station].pad;
      setWalkTarget(pad.x, pad.y, station);
    } else {
      setWalkTarget(p.x, p.y, null);
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    // Called every frame: turn held keys into chef velocity, and fire a
    // queued station use once the chef arrives at its pad.
    poll(dt) {
      if (state.phase !== 'playing') return;
      const chef = state.chef;
      if (chef.chop) return; // chopping roots the chef in place
      let dx = 0;
      let dy = 0;
      if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;
      if (keys.has('w') || keys.has('arrowup')) dy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) dy += 1;
      if (dx !== 0 || dy !== 0) {
        clickTarget = null;
        path = null;
        chef.moving = false;
        const len = Math.hypot(dx, dy);
        // One axis at a time, constraining after each: the chef slides
        // along a counter instead of getting pinned against its corner.
        chef.x += (dx / len) * 300 * dt;
        constrainChef(state);
        chef.y += (dy / len) * 300 * dt;
        constrainChef(state);
        chef.facing = dx !== 0 ? Math.sign(dx) : chef.facing;
      } else if (chef.moving) {
        // Follow the A* waypoints when there is a path, else walk straight.
        const wp = path && pathIndex < path.length
          ? path[pathIndex]
          : { x: chef.tx, y: chef.ty };
        const mdx = wp.x - chef.x;
        const mdy = wp.y - chef.y;
        const dist = Math.hypot(mdx, mdy);
        const step = 300 * dt;
        if (dist <= step) {
          chef.x = wp.x;
          chef.y = wp.y;
          constrainChef(state);
          if (path) pathIndex += 1;
          const arrived = !path || pathIndex >= path.length;
          if (arrived) {
            chef.moving = false;
            if (clickTarget && clickTarget.station) {
              // The click names the station: the serving window's pad is
              // close to the plating counter, so the click wins the tie.
              interact(state, clickTarget.station);
              audio.tap();
            }
            clickTarget = null;
            path = null;
          }
        } else {
          chef.x += (mdx / dist) * step;
          constrainChef(state);
          chef.y += (mdy / dist) * step;
          constrainChef(state);
          chef.facing = mdx !== 0 ? Math.sign(mdx) : chef.facing;
        }
      }
    },
  };
}
