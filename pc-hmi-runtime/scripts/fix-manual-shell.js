#!/usr/bin/env node
/**
 * Reset polluted manualShell overrides to canonical geometry-only layout.
 * Run: node scripts/fix-manual-shell.js [projectId]
 */
const fs = require('fs');
const path = require('path');

const CANONICAL_MANUAL_SHELL = {
  ManualNav_301_PLC_IO_List: { left: 8, top: 75, width: 66, height: 35 },
  ManualNav_302_PLC_Architecture: { left: 8, top: 131, width: 66, height: 35 },
  ManualNav_303_Run_Count: { left: 8, top: 188, width: 66, height: 35 },
  ManualNav_304_Network: { left: 8, top: 244, width: 66, height: 35 },
  ManualNav_305_Cycle_Time: { left: 8, top: 300, width: 66, height: 35 }
};

const MANUAL_SCREEN_IDS = [
  '300_Manual_Operation',
  '301_PLC_IO_List',
  '302_PLC_Architecture',
  '303_Run_Count',
  '304_Network',
  '305_Cycle_Time'
];

const root = path.join(__dirname, '..');

function fixScreenFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const raw = fs.readFileSync(filePath, 'utf8');
  const screen = JSON.parse(raw);
  if (!screen.manualShell && screen.navGroup !== 'manual') return false;
  screen.manualShell = JSON.parse(JSON.stringify(CANONICAL_MANUAL_SHELL));
  fs.writeFileSync(filePath, `${JSON.stringify(screen, null, 2)}\n`, 'utf8');
  return true;
}

function fixProject(projectId) {
  let count = 0;
  for (const id of MANUAL_SCREEN_IDS) {
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
  for (const id of MANUAL_SCREEN_IDS) {
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
  const projectsDir = path.join(root, 'projects');
  for (const entry of fs.readdirSync(projectsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    total += fixProject(entry.name);
  }
  total += fixScreensDir();
}
console.log(`Done — reset manualShell on ${total} file(s).`);
