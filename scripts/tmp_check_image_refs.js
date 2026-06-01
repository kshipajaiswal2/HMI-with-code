const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const imageDir = path.join(root, 'hmi', 'MyPlantHMI', 'Images');
const xmlDirs = [
  path.join(root, 'Export import'),
  path.join(root, 'web-hmi-bridge', 'ftio', 'default-pages')
];

function collectXmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith('.xml'))
    .map((name) => path.join(dir, name));
}

function getReferencedNames(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const names = [];
  const regex = /imageName="([^"]+)"/gi;
  for (const match of text.matchAll(regex)) {
    const value = String(match[1] || '').trim();
    if (value) names.push(value);
  }
  return names;
}

function buildResolver(imageLibraryDir) {
  const directoryFiles = fs.readdirSync(imageLibraryDir)
    .filter((file) => fs.statSync(path.join(imageLibraryDir, file)).isFile());
  const byLower = new Map(directoryFiles.map((file) => [file.toLowerCase(), file]));

  return function resolve(name) {
    const safeName = path.basename(String(name || '')).trim();
    if (!safeName) return null;

    const ext = path.extname(safeName);
    const candidates = ext
      ? [safeName]
      : [
          `${safeName}.bmp`,
          `${safeName}.png`,
          `${safeName}.jpg`,
          `${safeName}.jpeg`,
          `${safeName}.gif`,
          `${safeName}.svg`,
          `${safeName}.ico`,
          `${safeName}.webp`
        ];

    for (const candidate of candidates) {
      const matched = byLower.get(candidate.toLowerCase());
      if (matched) return matched;
    }

    const safeBase = path.basename(safeName, path.extname(safeName));
    const aliases = new Map([
      ['manual2', 'manual1'],
      ['machinesequence2', 'machinesequence1']
    ]);
    const aliasBase = aliases.get(safeBase.toLowerCase());

    if (aliasBase) {
      const aliasCandidates = [
        `${aliasBase}.bmp`,
        `${aliasBase}.png`,
        `${aliasBase}.jpg`,
        `${aliasBase}.jpeg`,
        `${aliasBase}.gif`,
        `${aliasBase}.svg`,
        `${aliasBase}.ico`,
        `${aliasBase}.webp`
      ];

      for (const candidate of aliasCandidates) {
        const matched = byLower.get(candidate.toLowerCase());
        if (matched) return matched;
      }
    }

    const numericVariant = safeBase.match(/^(.*?)(\d+)$/);
    if (numericVariant && numericVariant[1]) {
      const baseStem = numericVariant[1];
      const variantCandidates = [
        `${baseStem}1.bmp`,
        `${baseStem}1.png`,
        `${baseStem}1.jpg`,
        `${baseStem}1.jpeg`,
        `${baseStem}1.gif`,
        `${baseStem}1.svg`,
        `${baseStem}1.ico`,
        `${baseStem}1.webp`
      ];

      for (const candidate of variantCandidates) {
        const matched = byLower.get(candidate.toLowerCase());
        if (matched) return matched;
      }
    }

    return null;
  };
}

if (!fs.existsSync(imageDir)) {
  console.error(`Image folder missing: ${imageDir}`);
  process.exit(1);
}

const xmlFiles = xmlDirs.flatMap(collectXmlFiles);
const nameSet = new Set();
for (const filePath of xmlFiles) {
  for (const name of getReferencedNames(filePath)) {
    nameSet.add(name);
  }
}

const resolve = buildResolver(imageDir);
const missing = [...nameSet].sort((a, b) => a.localeCompare(b)).filter((name) => !resolve(name));

console.log(`xml files scanned: ${xmlFiles.length}`);
console.log(`unique image names: ${nameSet.size}`);
console.log(`missing count: ${missing.length}`);
if (missing.length) {
  console.log('missing names:');
  for (const name of missing) console.log(name);
}
