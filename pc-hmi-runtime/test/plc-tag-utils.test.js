const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolvePlcAddress,
  createPlcTag,
  parseBool,
  coerceWriteValue
} = require('../server/services/communication/plc-tag-utils');

test('resolvePlcAddress uses plcAddress alias when set', () => {
  const tagService = {
    get(name) {
      if (name === 'Production.Count') {
        return { name, type: 'int', plcAddress: 'Program:MainProgram.ProductionCount' };
      }
      return null;
    }
  };
  assert.equal(resolvePlcAddress(tagService, 'Production.Count'), 'Program:MainProgram.ProductionCount');
});

test('resolvePlcAddress falls back to HMI tag name', () => {
  const tagService = {
    get(name) {
      return { name, type: 'bool' };
    }
  };
  assert.equal(resolvePlcAddress(tagService, 'System.Running'), 'System.Running');
});

test('parseBool handles string false values', () => {
  assert.equal(parseBool('false'), false);
  assert.equal(parseBool('0'), false);
  assert.equal(parseBool('off'), false);
  assert.equal(parseBool('true'), true);
  assert.equal(parseBool('1'), true);
});

test('coerceWriteValue bool from strings', () => {
  assert.equal(coerceWriteValue('false', 'bool'), false);
  assert.equal(coerceWriteValue('true', 'bool'), true);
});

test('createPlcTag uses resolved PLC address', () => {
  const tagService = {
    get() {
      return { plcAddress: 'MyPlcTag' };
    }
  };
  const tag = createPlcTag(tagService, 'HmiAlias');
  assert.equal(tag.name, 'MyPlcTag');
});
