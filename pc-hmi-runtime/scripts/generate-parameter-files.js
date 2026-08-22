/** Regenerate config/parameter-files.json from FactoryTalk IO list patterns. */
const fs = require('fs');
const path = require('path');
const Builder = require('../shared/parameter-file-builder');

const outPath = path.join(__dirname, '../config/parameter-files.json');
const files = Builder.buildAllDefaultParameterFiles();

fs.writeFileSync(outPath, JSON.stringify(files, null, 2) + '\n');
console.log('Wrote', outPath, '-', Object.keys(files).length, 'parameter files');

const parDir = path.join(__dirname, '../projects/_template/Parameters');
fs.mkdirSync(parDir, { recursive: true });
for (const [name, def] of Object.entries(files)) {
  const safeName = name.replace(/[<>:"/\\|?*]/g, '_');
  const parPath = path.join(parDir, `${safeName}.par`);
  fs.writeFileSync(parPath, Builder.formatParameterFileText(name, def));
}
console.log('Wrote', Object.keys(files).length, '.par files to', parDir);
