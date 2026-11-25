// Rush Hour Kitchen — the hand-in program.
//
// Node 22, standard library only. It takes this repository's game/ folder
// (plain static files: index.html plus its ES modules, no build step, no
// network) and screenshots/ and lays them out in the output directory,
// then writes /output/dossier.json with the vendored make.fun library so
// the judge can read the entry.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program runs twice and both runs must write identical bytes. Nothing
// here depends on the current working directory or the clock: every path
// is resolved from this file's own location, and every output file is
// chmodded to 0644 before exit (the VM's umask would otherwise leave the
// first run's files at 0660, which the grader collects as another user).

import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Walk a directory tree and set every regular file inside it to mode 0644.
function chmodTree(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) chmodTree(path);
    else if (info.isFile()) chmodSync(path, 0o644);
  }
}

// Copy the game in, then the screenshots, then write the dossier from the
// finished output tree so it describes exactly what was handed in.
mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps mirror the gate's own limits: the dossier text stays under
// 160 KiB, at most 4 screenshots of at most 256 KiB each, game/ under
// 993 entries and 48 MiB with no path over 1000 bytes.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Every output file, including the dossier just written, gets mode 0644.
chmodTree(outDir);
