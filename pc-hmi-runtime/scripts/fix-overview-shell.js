#!/usr/bin/env node
/** Reset overviewShell overrides to canonical geometry-only layout. */
const fs = require('fs');
const path = require('path');

const SCALE = 800 / 1024;
const s = (n) => Math.round(Number(n) * SCALE);

const CANONICAL_OVERVIEW_SHELL = {
  OverviewNav_101_Production_Data: { left: 8, top: s(96), width: 66, height: 35 },
  OverviewNav_102_Prestart: { left: 8, top: s(168), width: 66, height: 35 },
  OverviewNav_103_Safety: { left: 8, top: s(240), width: 66, height: 35 },
  OverviewNav_104_Mimic_Screen: { left: 8, top: s(312), width: 66, height: 35 }
};

const OVERVIEW_SCREEN_IDS = [
  '100_Overview',
  '101_Production_Data',
  '102_Prestart',
  '103_Safety',
  '104_Mimic_Screen'
];

const root = path.join(__dirname, '..');

function fixScreenFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const screen = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (screen.navGroup !== 'overview') return false;
  screen.overviewShell = JSON.parse(JSON.stringify(CANONICAL_OVERVIEW_SHELL));
  fs.writeFileSync(filePath, `${JSON.stringify(screen, null, 2)}\n`, 'utf8');
  return true;
}

function fixProject(projectId) {
  let count = 0;
  for (const id of OVERVIEW_SCREEN_IDS) {
    const file = path.join(root, 'projects', projectId, 'Gfx', `${id}.json`);
    if (fixScreenFile(file)) {
      console.log(`Fixed ${projectId}/Gfx/${id}.json`);
      count += 1;
    }
  }
  return count;
}

function fixScreensDir() {
  let count = 0;
  for (const id of OVERVIEW_SCREEN_IDS) {
    const file = path.join(root, 'screens', `${id}.json`);
    if (fixScreenFile(file)) {
      console.log(`Fixed screens/${id}.json`);
      count += 1;
    }
  }
  return count;
}

const projectId = process.argv[2];
let total = 0;
if (projectId) {
  total += fixProject(projectId);
} else {
  for (const entry of fs.readdirSync(path.join(root, 'projects'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    total += fixProject(entry.name);
  }
  total += fixScreensDir();
}
console.log(`Done — reset overviewShell on ${total} file(s).`);
