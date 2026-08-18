/** FactoryTalk IO list HMI memory tag definitions and per-list runtime values. */
const Builder = require('./parameter-file-builder');

const DI_LIST_01_DESCR = [
  'DI01 System Start PB',
  'DI02 System Stop PB',
  'DI03 System Reset PB',
  'DI04 Safety Reset PB',
  'DI05 Spare DI',
  'DI06 Spare DI',
  'DI07 Spare DI',
  'DI08 Chopper Air Pressure Switch'
];

const DO_LIST_01_DESCR = [
  'DO01 Run Lamp @ Main Panel',
  'DO02 Fault Lamp @ Main Panel',
  'DO03 Horn @ Main Panel',
  'DO04 Stack Light Green',
  'DO05 Stack Light Amber',
  'DO06 Stack Light Red',
  'DO07 Conveyor Forward',
  'DO08 Conveyor Reverse'
];

const SAFETY_DI_LIST_01_DESCR = [
  'SDI01 E-Stop Channel 1',
  'SDI02 E-Stop Channel 2',
  'SDI03 Safety Door 1',
  'SDI04 Safety Door 2',
  'SDI05 Light Curtain',
  'SDI06 Spare Safety DI',
  'SDI07 Spare Safety DI',
  'SDI08 Reset PB'
];

const SAFETY_DO_LIST_01_DESCR = [
  'SDO01 Safety Relay K1',
  'SDO02 Safety Relay K2',
  'SDO03 Door Lock 1',
  'SDO04 Door Lock 2',
  'SDO05 Stack Light Red',
  'SDO06 Spare Safety DO',
  'SDO07 Spare Safety DO',
  'SDO08 Spare Safety DO'
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function offsetDescriptions(base, listNum, prefix) {
  const start = (listNum - 1) * Builder.ROWS_PER_LIST;
  return base.map((text, i) => {
    const point = start + i + 1;
    if (text.includes('Spare')) {
      return `${prefix}${pad2(point)} Spare ${prefix.startsWith('S') ? 'Safety ' : ''}${prefix.includes('DI') ? 'DI' : 'DO'}`;
    }
    const core = text.replace(/^(DI|DO|SDI|SDO)\d+\s*/, '');
    return `${prefix}${pad2(point)} ${core}`;
  });
}

function buildDiscrValues(kind, listNum) {
  switch (kind) {
    case 'di':
      return offsetDescriptions(DI_LIST_01_DESCR, listNum, 'DI');
    case 'do':
      return offsetDescriptions(DO_LIST_01_DESCR, listNum, 'DO');
    case 'safetyDi':
      return offsetDescriptions(SAFETY_DI_LIST_01_DESCR, listNum, 'SDI');
    case 'safetyDo':
      return offsetDescriptions(SAFETY_DO_LIST_01_DESCR, listNum, 'SDO');
    default:
      return DI_LIST_01_DESCR;
  }
}

function buildTagDef(name, type, folder, description, initialValue, options = {}) {
  const def = {
    name,
    type,
    folder,
    dataSource: options.dataSource || 'memory',
    description,
    initialValue
  };
  if (options.connection) def.connection = options.connection;
  return def;
}

function pickPlcSourceTags(existingTags, kind) {
  const isInput = kind === 'di' || kind === 'safetyDi';
  const filtered = (existingTags || []).filter((tag) => {
    if (tag.folder || tag.dataSource === 'memory') return false;
    if (tag.type !== 'bool') return false;
    const text = `${tag.name} ${tag.description || ''}`;
    if (isInput) return /DI\d|:I\.|\.I\./i.test(text);
    return /DO\d|:O\.|\.O\./i.test(text);
  });
  return filtered.map((tag) => tag.name);
}

function buildFolderTagDefs(kind, parameterFiles, plcSources = []) {
  const cfg = Builder.IO_LIST_KINDS[kind];
  const maxList = Builder.maxListNum(parameterFiles, kind) || 1;
  const slotCount = Builder.dataSlotCount(parameterFiles, kind) || Builder.ROWS_PER_LIST;
  const defs = [];

  for (let listNum = 1; listNum <= maxList; listNum++) {
    const listName = cfg.listName(listNum);
    defs.push(buildTagDef(
      `${cfg.discrPrefix}.${listName}`,
      'string',
      cfg.discrPrefix,
      `${cfg.label} list ${pad2(listNum)} title`,
      `${cfg.label} List ${pad2(listNum)}`
    ));
  }

  for (let slot = 0; slot < slotCount; slot++) {
    const dataIdx = pad2(slot);
    const listNum = Math.floor(slot / Builder.ROWS_PER_LIST) + 1;
    const rowInList = slot % Builder.ROWS_PER_LIST;
    const text = buildDiscrValues(kind, listNum)[rowInList];
    defs.push(buildTagDef(
      `${cfg.discrPrefix}.Data_${dataIdx}`,
      'string',
      cfg.discrPrefix,
      text,
      text
    ));
  }

  for (let slot = 0; slot < slotCount; slot++) {
    const dataIdx = pad2(slot);
    const listNum = Math.floor(slot / Builder.ROWS_PER_LIST) + 1;
    const rowInList = slot % Builder.ROWS_PER_LIST;
    const ioNum = (listNum - 1) * Builder.ROWS_PER_LIST + rowInList + 1;
    defs.push(buildTagDef(
      `${cfg.noPrefix}.Data_${dataIdx}`,
      'int',
      cfg.noPrefix,
      String(ioNum),
      ioNum
    ));
  }

  for (let slot = 0; slot < slotCount; slot++) {
    const dataIdx = pad2(slot);
    const connection = plcSources[slot] || '';
    const listNum = Math.floor(slot / Builder.ROWS_PER_LIST) + 1;
    const rowInList = slot % Builder.ROWS_PER_LIST;
    const ioNum = (listNum - 1) * Builder.ROWS_PER_LIST + rowInList + 1;
    const prefix = kind === 'di' ? 'DI' : kind === 'do' ? 'DO' : kind === 'safetyDi' ? 'SDI' : 'SDO';
    defs.push(buildTagDef(
      `${cfg.tagsPrefix}.Data_${dataIdx}`,
      'bool',
      cfg.tagsPrefix,
      connection || `${prefix}${pad2(ioNum)} value`,
      false,
      { connection }
    ));
  }

  return defs;
}

function buildTempTagDefs() {
  return [
    buildTagDef('Temp_Tags.IO_LIST', 'int', 'Temp_Tags', 'Active IO list tab (1=input, 2=output)', 2)
  ];
}

function buildAllIoListTagDefs(existingTags = [], parameterFiles = null) {
  const files = Builder.mergeProjectParameterFiles(parameterFiles);
  const defs = [...buildTempTagDefs()];
  for (const kind of ['di', 'do', 'safetyDi', 'safetyDo']) {
    const plcSources = pickPlcSourceTags(existingTags, kind);
    defs.push(...buildFolderTagDefs(kind, files, plcSources));
  }
  return defs;
}

function buildListRuntimeValues(kind, listNum, tagByName = {}) {
  const cfg = Builder.IO_LIST_KINDS[kind];
  const listName = cfg.listName(listNum);
  const descriptions = buildDiscrValues(kind, listNum);
  const values = {};
  const listTitleTag = tagByName[`${cfg.discrPrefix}.${listName}`];
  values[`${cfg.discrPrefix}.${listName}`] = listTitleTag?.initialValue
    ?? listTitleTag?.description
    ?? `${cfg.label} List ${pad2(listNum)}`;
  for (let i = 0; i < Builder.ROWS_PER_LIST; i++) {
    const dataIdx = Builder.dataIndexForListRow(listNum, i);
    const discrName = `${cfg.discrPrefix}.Data_${dataIdx}`;
    const noName = `${cfg.noPrefix}.Data_${dataIdx}`;
    const discrTag = tagByName[discrName];
    const noTag = tagByName[noName];
    values[discrName] = discrTag?.initialValue ?? discrTag?.description ?? descriptions[i];
    values[noName] = noTag?.initialValue ?? (listNum - 1) * Builder.ROWS_PER_LIST + i + 1;
  }
  return values;
}

function buildAllListRuntimeValues(parameterFiles = null, existingTags = null) {
  const files = Builder.mergeProjectParameterFiles(parameterFiles);
  const tagByName = Object.fromEntries((existingTags || []).map((t) => [t.name, t]));
  const byParameterFile = {};
  for (const [name, def] of Object.entries(files)) {
    if (!def?.kind || !def?.listNum) continue;
    byParameterFile[name] = buildListRuntimeValues(def.kind, def.listNum, tagByName);
  }
  return byParameterFile;
}

function getIoListTagFolders() {
  const order = ['di', 'do', 'safetyDi', 'safetyDo'];
  return [
    ...order.flatMap((kind) => {
      const cfg = Builder.IO_LIST_KINDS[kind];
      return [cfg.discrPrefix, cfg.noPrefix, cfg.tagsPrefix];
    }),
    'Temp_Tags'
  ];
}

module.exports = {
  buildAllIoListTagDefs,
  buildAllListRuntimeValues,
  buildListRuntimeValues,
  getIoListTagFolders,
  pickPlcSourceTags
};
