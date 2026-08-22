const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadRsLogixTags() {
  const code = fs.readFileSync(path.join(__dirname, '../public/rslogix-tags.js'), 'utf8');
  const sandbox = { globalThis: {} };
  vm.runInNewContext(code, sandbox);
  return sandbox.globalThis.RsLogixTags;
}

test('project Tags.CSV assigns folder from dotted tag names', () => {
  const RsLogixTags = loadRsLogixTags();
  const csv = 'Tag Name,Type,Description\nPLC_DI_Discr.Data_00,string,Test point';
  const parsed = RsLogixTags.parseTagImportFile(csv, 'a-Tags.CSV');
  assert.ok(parsed.tags.length > 0);
  const sample = parsed.tags.find((t) => t.name === 'PLC_DI_Discr.Data_00');
  assert.ok(sample);
  assert.equal(sample.folder, 'PLC_DI_Discr');
  assert.equal(sample.type, 'string');
});

test('FactoryTalk TagName,PLCReference CSV is recognized', () => {
  const RsLogixTags = loadRsLogixTags();
  const csv = fs.readFileSync(path.join(__dirname, '../../hmi/import_templates/hmi_tags_template.csv'), 'utf8');
  const parsed = RsLogixTags.parseTagImportFile(csv, 'hmi_tags_template.csv');
  assert.equal(parsed.format, 'factorytalk-csv');
  assert.equal(parsed.tags.length, 1);
  assert.equal(parsed.tags[0].name, 'SAMPLE_TAG');
  assert.equal(parsed.tags[0].type, 'int');
  assert.equal(parsed.tags[0].plcAddress, '[PLC01]Sample.Tag');
});

test('backslash tag names split into folder', () => {
  const RsLogixTags = loadRsLogixTags();
  const csv = 'Tag Name,Type,Description\n"PLC_DI_Discr\\Data_99",string,Test point';
  const parsed = RsLogixTags.parseTagImportFile(csv, 'backslash.csv');
  assert.equal(parsed.tags.length, 1);
  assert.equal(parsed.tags[0].folder, 'PLC_DI_Discr');
  assert.equal(parsed.tags[0].name, 'PLC_DI_Discr.Data_99');
});
