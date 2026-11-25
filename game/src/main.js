// Rush Hour Kitchen — main.js
// Boot and the game loop: create the canvas state, wire input and sound,
// run update + render every animation frame, and freeze on ?shot=N so the
// screenshot scenes render one exact moment.

import { VIEW_H, VIEW_W } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { renderGame } from './render.js';
import { setupShot } from './shots.js';
import { constrainChef, createState, updateState } from './state.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const state = createState();
const audio = createAudio();
const input = createInput(canvas, state, audio);

function frame(now) {
  const dt = Math.min(0.05, (now - frame.last) / 1000 || 0);
  frame.last = now;
  input.poll(dt);
  constrainChef(state);
  const before = { served: state.served, lost: state.lost };
  updateState(state, dt);
  // Sounds for the things that changed this frame.
  if (state.served > before.served) audio.serve();
  if (state.lost > before.lost) audio.fail();
  const burnerDone = state.burners.some((b) => b.item && b.done && !b.item.burnt);
  if (burnerDone && !frame.dinged) {
    audio.ding();
    frame.dinged = true;
  } else if (!burnerDone) {
    frame.dinged = false;
  }
  if (state.phase === 'over' && !frame.overPlayed) {
    audio.fanfare();
    frame.overPlayed = true;
  }
  renderGame(ctx, state);
  requestAnimationFrame(frame);
}
frame.last = 0;
frame.dinged = false;
frame.overPlayed = false;

// A ?shot=1..3 query freezes the game in a demo scene for screenshots.
const shot = Number(new URLSearchParams(window.location.search).get('shot'));
if (shot >= 1 && shot <= 3) {
  setupShot(state, shot);
}

// Handle for automated play-tests: window.__game exposes the live state.
window.__game = { state, VIEW_W, VIEW_H };

requestAnimationFrame(frame);
