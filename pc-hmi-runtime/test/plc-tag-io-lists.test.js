const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

require('../public/rslogix-tags');
const IoListTags = require('../shared/io-list-tags');
const Builder = require('../shared/parameter-file-builder');
const ParameterFileService = require('../server/services/parameter-file-service');

const CSV = path.join(__dirname, '..', '..', 'hmi', 'import_templates', 'VAPR069_V51_08_05_2026_V1_Tags.CSV');

// Tags as Studio stores them after an import: "<folder>.<tag>" with the PLC tag in plcAddress.
function importedTags(filter = () => true) {
  const { tags } = globalThis.RsLogixTags.parseTagImportFile(fs.readFileSync(CSV, 'utf8'), 'tags.csv', {});
  return tags.filter(filter).map((t) => ({
    ...t,
    name: `PLC uploded Tags.${t.name}`,
    folder: 'PLC uploded Tags',
    dataSource: 'device',
    plcAddress: t.name,
    connection: t.name
  }));
}

const sizes = (kinds) => Object.fromEntries(Object.entries(kinds).map(([k, m]) => [k, m.size]));

test('RSLogix import keeps array-element IO points such as RIO01_SDI[1]', () => {
  const { tags } = globalThis.RsLogixTags.parseTagImportFile(fs.readFileSync(CSV, 'utf8'), 'tags.csv', {});
  const sdi = tags.find((t) => t.name === 'RIO01_SDI[1]');
  assert.equal(sdi?.description, 'SDI1_Chopper HMI E-Stop 1/1');
  assert.ok(tags.some((t) => t.name === 'RIO03_Z3:10:I.0'), 'bit points are still imported');
});

test('IO points are grouped per zone and kind, ignoring logic tags like DI41_ONS', () => {
  const zones = IoListTags.classifyPlcIoPoints(importedTags());
  assert.deepEqual([...zones.keys()].sort(), ['RIO01', 'RIO02', 'RIO03']);
  assert.deepEqual(sizes(zones.get('RIO01')), { di: 55, do: 42, safetyDi: 8, safetyDo: 8 });
  assert.deepEqual(sizes(zones.get('RIO02')), { di: 56, do: 32, safetyDi: 16, safetyDo: 8 });
  assert.deepEqual(sizes(zones.get('RIO03')), { di: 96, do: 40, safetyDi: 8, safetyDo: 8 });
  const sdi = zones.get('RIO01').safetyDi.get(1);
  assert.equal(sdi.label, 'SDI01 Chopper HMI E-Stop 1/1');
  assert.equal(sdi.connection, 'RIO01_SDI[1]');
});

test('a single-zone export fills the standard lists', () => {
  const tags = importedTags((t) => /^RIO03/.test(t.name));
  const zones = IoListTags.classifyPlcIoPoints(tags);
  assert.deepEqual([...zones.keys()], ['']);

  const result = ParameterFileService.syncIoListsFromPlcTags({ tags, parameterFiles: null });
  const names = Object.keys(result.parameterFiles);
  assert.equal(names.filter((n) => /^PLC DI List \d+$/.test(n)).length, 12);
  assert.equal(names.filter((n) => /^PLC DO List \d+$/.test(n)).length, 5);
  assert.ok(!names.some((n) => n.startsWith('RIO')), 'no zone prefix with one zone');

  const byName = Object.fromEntries(result.tags.map((t) => [t.name, t]));
  assert.equal(byName['PLC_DI_Discr.Data_56'].initialValue, 'DI57 Tilting Station Bag Entry Sensor');
  assert.equal(byName['PLC_DI_Tags.Data_56'].connection, 'RIO03_DI[57]');
  assert.equal(byName['Safety_DI_Tags.Data_00'].connection, 'RIO03_SDI[1]');
  assert.ok(result.tags.every((t) => !('fromPlc' in t)), 'internal marker is not saved');
});

test('a multi-zone export gets one set of parameter files per zone', () => {
  const result = ParameterFileService.syncIoListsFromPlcTags({ tags: importedTags(), parameterFiles: null });
  const files = result.parameterFiles;
  assert.equal(files['RIO02 Safety DI List 02']?.zone, 'RIO02');
  assert.equal(Builder.maxListNum(files, 'di', 'RIO03'), 12);
  assert.equal(files['RIO01 PLC DI List 01'].replacements['#101'], 'RIO01_PLC_DI_Discr.Data_00');
  const values = IoListTags.buildAllListRuntimeValues(files, result.tags);
  assert.equal(values['RIO02 PLC DO List 01']['RIO02_PLC_DO_Discr.Data_00'], 'DO01 Dryer Tower Lamp Red');
});

test('user memory tags whose description starts with a code are not PLC points', () => {
  const userTag = { name: 'Line.Speed', type: 'float', folder: 'Line', dataSource: 'memory', description: 'DI99 belt speed' };
  assert.equal(IoListTags.classifyPlcIoPoints([userTag]).size, 0);
  const zones = IoListTags.classifyPlcIoPoints([...importedTags(), userTag]);
  assert.deepEqual([...zones.keys()].sort(), ['RIO01', 'RIO02', 'RIO03']);
});

test('projects without PLC IO points keep their existing lists unchanged', () => {
  const files = Builder.mergeProjectParameterFiles(null);
  const before = IoListTags.buildAllIoListTagDefs([], files);
  assert.equal(before.find((t) => t.name === 'PLC_DI_Discr.Data_00').initialValue, 'DI01 System Start PB');
  assert.deepEqual(IoListTags.planIoListsFromPlcTags([], files).summary, []);
});
