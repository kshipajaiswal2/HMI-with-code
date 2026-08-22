const test = require('node:test');
const assert = require('node:assert/strict');
const Builder = require('../shared/parameter-file-builder');
const IoListTags = require('../shared/io-list-tags');
const ParameterFileService = require('../server/services/parameter-file-service');

test('List 02 maps #101 to Data_08 not Data_00', () => {
  const reps = Builder.buildReplacements('do', 2);
  assert.equal(reps['#101'], 'PLC_DO_Discr.Data_08');
  assert.equal(reps['#301'], 'PLC_DO_Tags.Data_08');
});

test('List 01 maps #101 to Data_00', () => {
  const reps = Builder.buildReplacements('di', 1);
  assert.equal(reps['#101'], 'PLC_DI_Discr.Data_00');
});

test('buildAllListRuntimeValues uses project parameter files', () => {
  const defaults = IoListTags.buildAllListRuntimeValues();
  assert.equal(Object.keys(defaults).length, 4);

  const projectFiles = Builder.buildAllDefaultParameterFiles();
  const projectValues = IoListTags.buildAllListRuntimeValues(projectFiles);
  assert.equal(Object.keys(projectValues).length, 27);
  assert.ok(projectValues['PLC DO List 06']);
  assert.equal(projectValues['PLC DO List 06']['PLC_DO_Discr.Data_40'], 'DO41 Run Lamp @ Main Panel');
});

test('mergeIoTags preserves user-edited descriptions', () => {
  const files = Builder.buildStarterParameterFiles();
  const ioTags = IoListTags.buildAllIoListTagDefs([], files);
  const customized = ioTags.map((t) =>
    t.name === 'PLC_DI_Discr.Data_00'
      ? { ...t, description: 'Custom label', initialValue: 'Custom label' }
      : t
  );
  const existing = [...customized, { name: 'My.Custom.Tag', type: 'bool', description: 'keep me' }];
  const merged = ParameterFileService.mergeIoTags(existing, ioTags);
  const discr = merged.find((t) => t.name === 'PLC_DI_Discr.Data_00');
  assert.equal(discr.description, 'Custom label');
  assert.equal(discr.initialValue, 'Custom label');
  assert.ok(merged.some((t) => t.name === 'My.Custom.Tag'));
});

test('data slot count grows with list count', () => {
  const files = Builder.buildAllDefaultParameterFiles();
  assert.equal(Builder.dataSlotCount(files, 'do'), 48);
  assert.equal(Builder.maxListNum(files, 'di'), 7);
});

test('buildListRuntimeValues uses customized tag initialValue', () => {
  const files = Builder.buildStarterParameterFiles();
  const tags = [{
    name: 'PLC_DI_Discr.Data_00',
    type: 'string',
    folder: 'PLC_DI_Discr',
    initialValue: 'My custom DI label',
    description: 'My custom DI label'
  }];
  const values = IoListTags.buildAllListRuntimeValues(files, tags);
  assert.equal(values['PLC DI List 01']['PLC_DI_Discr.Data_00'], 'My custom DI label');
});
