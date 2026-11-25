# Rush Hour Kitchen

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Nghyuu/best-cooking-game-20261125-0137-entry/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Nghyuu/best-cooking-game-20261125-0137-entry/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A 2D canvas cooking game, built for the make.fun best cooking game bounty.
You are the whole kitchen on a Friday-night dinner rush: orders land on the
board with countdown timers, and you run the chef between the pantry, the
chopping board, the stove, the plating counter and the serving window.

## How to play

- **Move** — WASD / arrow keys, or click anywhere on the floor (click a
  station to walk there and use it).
- **Grab** — stand at the pantry and press **1–6** or click a crate.
- **Chop** — press **E** at the chopping board with something choppable.
- **Cook** — press **E** at the stove to put food on a burner; pick it up
  when it dings, before it burns.
- **Plate** — press **E** at the plating counter to build the dish, then
  pick the plate up.
- **Serve** — press **E** at the serving window with a finished plate.
  Fast plates earn bigger tips; expired orders break your streak.

Recipes are original inventions — Sunset Noodles, Ember Tacos, Garden Bowl,
Golden Omelette, Sizzle Stir-Fry — and the rush grows as the shift runs:
orders arrive faster, timers shrink, and recipes combine more ingredients.

## The game

- `game/index.html` — the page; a 1280×720 canvas, no external references.
- `game/src/config.js` — recipes, ingredients, stations, tuning.
- `game/src/state.js` — game state: orders, stove, plate, score.
- `game/src/input.js` — keyboard and mouse.
- `game/src/render.js` — all canvas drawing (procedural art, no images).
- `game/src/audio.js` — WebAudio oscillator sounds, no audio files.
- `game/src/shots.js` — deterministic demo scenes for the screenshots.
- `game/src/main.js` — boot and the game loop.

Everything runs offline from static files — no network, no libraries, no
build step. Play it locally with `node serve.ts`, then open
http://localhost:8080. Screenshots are reproducible renders of the game's
own code: open `game/index.html?shot=1`, `?shot=2` or `?shot=3`.

## Hand-in

`main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to
`/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json` with the
vendored `vendor/makefun-game.ts`, chmodding every output file to 0644.

MIT licensed.
