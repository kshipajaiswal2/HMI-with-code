const { Tag } = require('st-ethernet-ip');

const SYSTEM_TAGS = new Set(['Comm.PLCConnected', 'Comm.ScanRate']);

function isSystemTag(name) {
  return SYSTEM_TAGS.has(name);
}

function isPollableTag(name, tagService, tagLogicService) {
  if (!name || isSystemTag(name)) return false;
  if (tagLogicService?.isComputed?.(name)) return false;
  return Boolean(tagService.get(name));
}

function collectPollTagNames(tagService, alarmService, tagLogicService) {
  const names = new Set();
  for (const name of tagService.subscriptions || []) {
    if (isPollableTag(name, tagService, tagLogicService)) names.add(name);
  }
  for (const def of alarmService?.definitions || []) {
    if (def.tag && isPollableTag(def.tag, tagService, tagLogicService)) names.add(def.tag);
  }
  return [...names];
}

function resolvePlcAddress(tagService, hmiTagName) {
  const tag = tagService?.get?.(hmiTagName);
  const address = tag?.plcAddress || tag?.alias || hmiTagName;
  return String(address || '').trim();
}

function createPlcTag(tagService, hmiTagName) {
  const address = resolvePlcAddress(tagService, hmiTagName);
  if (!address) throw new Error(`Empty PLC address for tag: ${hmiTagName}`);
  return new Tag(address);
}

function parseBool(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'on') return true;
    if (s === 'false' || s === '0' || s === 'off' || s === '') return false;
  }
  return Boolean(value);
}

function coercePlcValue(value, hmiType) {
  if (value == null) return value;
  switch (hmiType) {
    case 'bool':
      return parseBool(value);
    case 'int':
      return Number(value) | 0;
    case 'float':
      return Number(value);
    case 'string':
      return String(value);
    default:
      return value;
  }
}

function coerceWriteValue(value, hmiType) {
  switch (hmiType) {
    case 'bool':
      return parseBool(value);
    case 'int':
      return Number(value) | 0;
    case 'float':
      return Number(value);
    case 'string':
      return String(value ?? '');
    default:
      return value;
  }
}

module.exports = {
  SYSTEM_TAGS,
  isSystemTag,
  isPollableTag,
  collectPollTagNames,
  resolvePlcAddress,
  createPlcTag,
  parseBool,
  coercePlcValue,
  coerceWriteValue
};
