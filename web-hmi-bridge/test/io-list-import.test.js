const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const XLSX = require('xlsx');

const REPO = path.join(__dirname, '..', '..');

function loadIoTags() {
  const ctx = vm.createContext({ XLSX });
  ctx.globalThis = ctx;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'public', 'io-tags.js'), 'utf8'), ctx);
  return ctx.IoTags;
}

function convert(relPath) {
  return loadIoTags().convertIoListUpload(fs.readFileSync(path.join(REPO, relPath)), {});
}

const counts = (out) => {
  const c = out.parsed.meta.counts;
  return { sdi: c.sdi, di: c.di, sdo: c.sdo, do: c.do };
};

test('labelled master sheets keep their IO counts', () => {
  assert.deepEqual(counts(convert('hmi/import_templates/VAPR069_Master Sheet_V05.xlsx')), { sdi: 24, di: 176, sdo: 24, do: 104 });
  assert.deepEqual(counts(convert('hmi/import_templates/VAPR241_Master Sheet_V06 2.xlsx')), { sdi: 40, di: 40, sdo: 40, do: 48 });
});

test('"Frame-1 IO" sheets with an unlabelled type column are imported per table', () => {
  const out = convert('hmi/VAPR067_Master Sheet_V08 2 1.xlsx');
  assert.deepEqual([...out.parsed.meta.zones], ['Frame-1', 'Frame-2']);
  // 64 rack DI + 132 field-module DI; rack-only SDI/SDO/DO; no "Spare DO SOV" text matches.
  assert.deepEqual(counts(out), { sdi: 40, di: 196, sdo: 32, do: 32 });

  const labels = out.parsed.tags.map((t) => t.initialString);
  assert.ok(labels.includes('SDI1 Emergency Stop  @ HMI Panel 1/1'), 'rack description read from the right column');
  assert.ok(labels.includes('DI02 RM01 Plate Infeed Conveyor Exit Sensor'), 'field-module points keep their module');
});

test('parameter files are generated for every zone of the unlabelled sheet', () => {
  const IoTags = loadIoTags();
  const out = IoTags.convertIoListUpload(fs.readFileSync(path.join(REPO, 'hmi/VAPR067_Master Sheet_V08 2 1.xlsx')), {});
  const sheets = out.parsed.meta.sourceSheets;
  const names = (zone) => {
    const parsed = IoTags.buildParsedForZoneExport(sheets, zone, { zoneRioModules: null, manualZoneRioModules: {} });
    return IoTags.buildAllIoListParameterFiles(parsed, { zone, zoneLocal: true }).map((f) => f.name);
  };
  const frame1 = names('Frame-1');
  assert.equal(frame1.filter((n) => n.startsWith('PLC DI List')).length, 18);
  assert.equal(frame1.filter((n) => n.startsWith('PLC DO List')).length, 3);
  assert.equal(frame1.filter((n) => n.startsWith('Safety DI List')).length, 2);
  assert.equal(frame1.filter((n) => n.startsWith('Safety DO List')).length, 2);
  assert.ok(names('Frame-2').length > 0);
});
