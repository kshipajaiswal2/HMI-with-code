/** Write default .par files into the template Parameters folder. */
const fs = require('fs');
const path = require('path');
const Builder = require('../shared/parameter-file-builder');

const files = Builder.buildAllDefaultParameterFiles();
const parDir = path.join(__dirname, '../projects/_template/Parameters');
fs.mkdirSync(parDir, { recursive: true });
for (const [name, def] of Object.entries(files)) {
  const safeName = name.replace(/[<>:"/\\|?*]/g, '_');
  const parPath = path.join(parDir, `${safeName}.par`);
  fs.writeFileSync(parPath, Builder.formatParameterFileText(name, def));
}
console.log('Wrote', Object.keys(files).length, '.par files to', parDir);
