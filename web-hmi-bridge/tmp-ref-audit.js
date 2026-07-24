const fs = require('fs');
const vm = require('vm');
const XLSX = require('xlsx');

function loadIoTags() {
  const code = fs.readFileSync('public/io-tags.js', 'utf8');
  const ctx = vm.createContext({ XLSX });
  ctx.globalThis = ctx;
  vm.runInContext(code, ctx);
  return ctx.globalThis.IoTags;
}

function splitCsvLine(line) {
  const raw = String(line || '').trim();
  if (!raw || raw.startsWith(';')) return null;
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch === '"') {
      if (inQuotes && raw[i + 1] === '"') { current += '"'; i += 1; }
      else inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) { cells.push(current); current = ''; continue; }
    current += ch;
  }
  cells.push(current);
  return cells;
}

function analyzeCsv(text, label) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const dataLines = lines.filter((l) => l.startsWith('"'));
  const folders = dataLines.filter((l) => l.startsWith('"F"'));
  const tags = dataLines.filter((l) => !l.startsWith('"F"'));
  const tagOrder = tags.map((l) => {
    const cells = splitCsvLine(l) || [];
    return `${cells[0]}:${cells[1]}`;
  });

  const sections = [];
  let current = null;
  for (const item of tagOrder) {
    const [type, name] = item.split(':');
    const folder = name.split('\\')[0];
    const key = `${type}|${folder}`;
    if (!current || current.key !== key) {
      current = { key, type, folder, count: 0, first: name, last: name };
      sections.push(current);
    }
    current.count += 1;
    current.last = name;
  }

  return {
    label,
    lineCount: lines.length,
    folderCount: folders.length,
    tagCount: tags.length,
    folders: folders.map((l) => (splitCsvLine(l) || [])[1]),
    sections,
    lines
  };
}

const IoTags = loadIoTags();
const refText = fs.readFileSync('../hmi/import_templates/69zone3.csv', 'utf8');
const ref = analyzeCsv(refText, 'reference');

const buf = fs.readFileSync('../hmi/import_templates/VAPR069_Master Sheet_V05.xlsx');
const parsed = IoTags.parseMasterSheetXlsx(buf, { sourceName: 'test.xlsx' });
const packingSheet = parsed.meta.sourceSheets.find((s) => /pack/i.test(s.zone));
console.log('Packing sheet IO counts:', {
  sdi: packingSheet.diInputs.filter((i) => i.isSafety).length,
  di: packingSheet.diInputs.filter((i) => !i.isSafety).length,
  sdo: packingSheet.doOutputs.filter((i) => i.isSafety).length,
  do: packingSheet.doOutputs.filter((i) => !i.isSafety).length
});

const genCsv = IoTags.buildZoneTagsCsv(parsed.meta.sourceSheets, 'Packing', {
  zoneRioModules: parsed.meta.zoneRioModules
});
const gen = analyzeCsv(genCsv, 'generated');

console.log('\n=== SUMMARY ===');
console.log('REF', { lines: ref.lineCount, folders: ref.folderCount, tags: ref.tagCount });
console.log('GEN', { lines: gen.lineCount, folders: gen.folderCount, tags: gen.tagCount });
console.log('\nREF folders:', ref.folders.join(', '));
console.log('GEN folders:', gen.folders.join(', '));
console.log('\nREF section order:');
ref.sections.forEach((s, i) => console.log(`${i + 1}. ${s.type} ${s.folder} x${s.count} (${s.first} .. ${s.last})`));
console.log('\nGEN section order:');
gen.sections.forEach((s, i) => console.log(`${i + 1}. ${s.type} ${s.folder} x${s.count} (${s.first} .. ${s.last})`));

function compareLines(n) {
  const r = ref.lines[n - 1] || '';
  const g = gen.lines[n - 1] || '';
  console.log(`\nLine ${n} match:`, r === g);
  if (r !== g) {
    console.log(' REF:', r.slice(0, 140));
    console.log(' GEN:', g.slice(0, 140));
  }
}

[1, 2, 4, 5, 18, 20, 21, 117, 129, 237, 515].forEach(compareLines);

// Compare row format pattern for first S, D, A
for (const [label, pred] of [
  ['REF first S', (l) => l.startsWith('"S","PLC_DI_Discr\\Data_00"')],
  ['GEN first S', (l) => l.startsWith('"S","PLC_DI_Discr\\Data_00"')],
  ['REF first D', (l) => l.startsWith('"D","PLC_DI_Tags\\Data_00"')],
  ['GEN first D', (l) => l.startsWith('"D","PLC_DI_Tags\\Data_00"')],
  ['REF first A', (l) => l.startsWith('"A","Temp_Tags\\Alarms"')],
  ['GEN first A', (l) => l.startsWith('"A","Temp_Tags\\Alarms"')]
]) {
  const rLine = ref.lines.find(pred) || '';
  const gLine = gen.lines.find(pred) || '';
  console.log(`\n${label} format match:`, rLine === gLine);
  if (rLine !== gLine) {
    console.log(' REF:', rLine);
    console.log(' GEN:', gLine);
  }
}
