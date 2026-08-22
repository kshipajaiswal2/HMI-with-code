#!/usr/bin/env node
/** Swap manual screens: 304 = Network, 305 = Cycle Time */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function swapScreenPair(dir) {
  const oldCycle = path.join(dir, '305_Cycle_Time.json');
  const oldNetwork = path.join(dir, '304_Network.json');
  if (!fs.existsSync(oldCycle) && !fs.existsSync(oldNetwork)) return 0;

  let cycle = null;
  let network = null;
  if (fs.existsSync(oldCycle)) {
    cycle = JSON.parse(fs.readFileSync(oldCycle, 'utf8'));
    cycle.id = '305_Cycle_Time';
    cycle.title = 'Cycle Time';
    cycle.subtitle = 'Cycle Time';
  }
  if (fs.existsSync(oldNetwork)) {
    network = JSON.parse(fs.readFileSync(oldNetwork, 'utf8'));
    network.id = '304_Network';
    network.title = 'Network';
    network.subtitle = 'Network';
  }

  if (network) {
    fs.writeFileSync(path.join(dir, '304_Network.json'), `${JSON.stringify(network, null, 2)}\n`, 'utf8');
  }
  if (cycle) {
    fs.writeFileSync(path.join(dir, '305_Cycle_Time.json'), `${JSON.stringify(cycle, null, 2)}\n`, 'utf8');
  }
  if (fs.existsSync(oldCycle)) fs.unlinkSync(oldCycle);
  if (fs.existsSync(oldNetwork)) fs.unlinkSync(oldNetwork);
  return (network ? 1 : 0) + (cycle ? 1 : 0);
}

function walkSwap(dir) {
  let count = 0;
  if (!fs.existsSync(dir)) return count;
  count += swapScreenPair(dir);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count += walkSwap(path.join(dir, entry.name));
  }
  return count;
}

function replaceInTree(dir, exts = new Set(['.json', '.js'])) {
  let files = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      files += replaceInTree(full, exts);
      continue;
    }
    const ext = path.extname(entry.name);
    if (!exts.has(ext)) continue;
    let text = fs.readFileSync(full, 'utf8');
    const before = text;
    text = text
      .replace(/ManualNav_304_Network/g, 'ManualNav_304_Network')
      .replace(/ManualNav_305_Cycle_Time/g, 'ManualNav_305_Cycle_Time')
      .replace(/ManualNav_304_Network/g, 'ManualNav_304_Network')
      .replace(/304_Network/g, '304_Network')
      .replace(/305_Cycle_Time/g, '305_Cycle_Time')
      .replace(/304_Network/g, '304_Network');
    if (text !== before) {
      fs.writeFileSync(full, text, 'utf8');
      files += 1;
    }
  }
  return files;
}

let swapped = 0;
swapped += swapScreenPair(path.join(root, 'screens'));
for (const entry of fs.readdirSync(path.join(root, 'projects'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  swapped += swapScreenPair(path.join(root, 'projects', entry.name, 'Gfx'));
}

const updated = replaceInTree(root);
console.log(`Swapped ${swapped} screen file pair(s); updated ${updated} source file(s).`);
