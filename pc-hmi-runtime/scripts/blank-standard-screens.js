const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'standard-screens.json'), 'utf8'));
const metaById = Object.fromEntries(lib.screens.map((s) => [s.id, s]));

function blankFromFile(filePath) {
  const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const meta = metaById[existing.id] || {};
  return {
    id: existing.id,
    title: existing.title || meta.title || existing.id,
    navGroup: existing.navGroup || meta.navGroup || 'none',
    layout: existing.layout || (String(existing.id).includes('Popup') ? 'popup' : 'standard'),
    securityLevel: existing.securityLevel ?? 0,
    components: []
  };
}

function processDir(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const filePath = path.join(dir, file);
    fs.writeFileSync(filePath, `${JSON.stringify(blankFromFile(filePath), null, 2)}\n`);
    count += 1;
  }
  return count;
}

let total = 0;
total += processDir(path.join(ROOT, 'screens'));
total += processDir(path.join(ROOT, 'projects', '_template', 'Gfx'));

for (const entry of fs.readdirSync(path.join(ROOT, 'projects'), { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === '_template') continue;
  total += processDir(path.join(ROOT, 'projects', entry.name, 'Gfx'));
}

console.log(`Blanked ${total} display files.`);
