const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const XLSX = require('xlsx');
const code = fs.readFileSync(path.join(ROOT, 'public/io-tags.js'), 'utf8');
const ctx = vm.createContext({ XLSX });
ctx.globalThis = ctx;
vm.runInContext(code, ctx);

const buf = fs.readFileSync('D:/Kshipa/PlantHMI/hmi/import_templates/VAPR069_Master Sheet_V05.xlsx');
const converted = ctx.IoTags.convertIoListUpload(buf);
const xml = fs.readFileSync(path.join(ROOT, 'ftio/default-pages/303_IO_List.xml'), 'utf8');
const dom = new JSDOM(xml, { contentType: 'text/xml' });
const doc = dom.window.document;
const displays = doc.querySelectorAll('stringDisplay');
const map = ctx.IoTags.buildIoListPreviewMap(converted.parsed, { page: 1, zone: 'Packing' });

console.log('stringDisplays:', displays.length);
console.log('map 101:', map.get(101));
for (const node of [...displays].slice(0, 5)) {
  const expr = node.querySelector('connection[name="Value"]')?.getAttribute('expression');
  console.log(expr, '->', ctx.IoTags.resolveParameterExpression(expr, map));
}
