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
  const isSafety = kind === 'safetyDi' || kind === 'safetyDo';
  const filtered = (existingTags || []).filter((tag) => {
    if (tag.folder || tag.dataSource === 'memory') return false;
    if (tag.type !== 'bool') return false;
    const text = `${tag.name} ${tag.description || ''}`;
    // Safety points (SDI/SDO) must not land in the standard lists, nor the other way round.
    if (/S(DI|DO)\d/i.test(text) !== isSafety) return false;
    if (isInput) return /DI\d|:I\.|\.I\./i.test(text);
    return /DO\d|:O\.|\.O\./i.test(text);
  });
  return filtered.map((tag) => tag.name);
}

const IO_KIND_BY_CODE = { DI: 'di', DO: 'do', SDI: 'safetyDi', SDO: 'safetyDo' };
const IO_FOLDER_RE = /^(?:[A-Za-z0-9]+_)?(PLC_(DI|DO)|Safety_(DI|DO))_(Discr|No|Tags)$/;

function isIoListFolder(folder) {
  const f = String(folder || '').trim();
  return IO_FOLDER_RE.test(f) || f === 'Temp_Tags';
}

/** Zone key from a PLC tag name: RIO01_SDI[3] -> RIO01, RIO03_Z3:10:I.0 -> RIO03, Start_PB -> ''. */
function zoneKeyFromTagName(name) {
  const text = String(name || '');
  const arrayMatch = text.match(/^([A-Za-z0-9]+?)_S?D[IO]\[\d+\]$/i);
  if (arrayMatch) return arrayMatch[1].toUpperCase();
  const moduleMatch = text.match(/^([A-Za-z]+\d+)[_:]/);
  if (!moduleMatch || /^S?D[IO]\d+$/i.test(moduleMatch[1])) return '';
  return moduleMatch[1].toUpperCase();
}

/**
 * IO points described in uploaded PLC tags ("SDI1_Chopper HMI E-Stop 1/1", "DI57_Tilting ..."),
 * grouped by zone and kind: Map(zone -> { di|do|safetyDi|safetyDo: Map(pointNo -> point) }).
 * Array elements (RIO01_DI[5]) win over raw module bits (RIO03_Z3:10:I.0) for the same point.
 * With a single zone the key is '' so the standard (unprefixed) lists are used.
 */
function classifyPlcIoPoints(tags) {
  const zones = new Map();
  for (const tag of tags || []) {
    if (isIoListFolder(tag?.folder)) continue;
    // Imported tags are saved as "<folder>.<tag>"; the PLC's own tag name is in plcAddress.
    const plcTag = String(tag?.plcAddress || tag?.connection || tag?.name || '').trim();
    const description = String(tag?.description || '').trim();
    // Logic tags such as DI41_ONS have no real description (importers fill in the tag name).
    if (!plcTag || description === plcTag || description === String(tag?.name || '').trim()) continue;
    const match = description.match(/^(SDI|SDO|DI|DO)0*(\d{1,4})(?:[\s_:-]+(.*))?$/i);
    if (!match) continue;
    const code = match[1].toUpperCase();
    const num = Number(match[2]);
    if (!num) continue;
    const zone = zoneKeyFromTagName(plcTag);
    if (!zones.has(zone)) zones.set(zone, { di: new Map(), do: new Map(), safetyDi: new Map(), safetyDo: new Map() });
    const byNum = zones.get(zone)[IO_KIND_BY_CODE[code]];
    const prev = byNum.get(num);
    if (prev && prev.connection.includes('[') && !plcTag.includes('[')) continue;
    const text = String(match[3] || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    byNum.set(num, {
      connection: plcTag,
      label: `${code}${pad2(num)}${text ? ` ${text}` : ''}`
    });
  }
  if (zones.size === 1) {
    const [only] = zones.values();
    return new Map([['', only]]);
  }
  return zones;
}

/** Make sure every zone/kind that has PLC points has enough parameter files (8 points each). */
function planIoListsFromPlcTags(tags, parameterFiles) {
  const files = { ...(parameterFiles || {}) };
  const zones = classifyPlcIoPoints(tags);
  const summary = [];
  for (const [zone, kinds] of zones) {
    for (const kind of ['di', 'do', 'safetyDi', 'safetyDo']) {
      const points = kinds[kind];
      if (!points.size) continue;
      const needed = Math.ceil(Math.max(...points.keys()) / Builder.ROWS_PER_LIST);
      for (let listNum = 1; listNum <= needed; listNum++) {
        const name = Builder.parameterFileName(kind, listNum, zone);
        if (!files[name]) Object.assign(files, Builder.buildParameterFile(kind, listNum, zone));
      }
      summary.push({ zone, kind, points: points.size, lists: needed });
    }
  }
  return { parameterFiles: files, summary };
}

function buildFolderTagDefs(kind, parameterFiles, plcSources = [], zone = '', points = null) {
  const cfg = Builder.kindConfig(kind, zone);
  const maxList = Builder.maxListNum(parameterFiles, kind, zone) || 1;
  const slotCount = Builder.dataSlotCount(parameterFiles, kind, zone) || Builder.ROWS_PER_LIST;
  const codePrefix = kind === 'di' ? 'DI' : kind === 'do' ? 'DO' : kind === 'safetyDi' ? 'SDI' : 'SDO';
  const pointAt = (slot) => points?.get(slot + 1) || null;
  const spareText = (slot) => `${codePrefix}${pad2(slot + 1)} Spare ${codePrefix.startsWith('S') ? 'Safety ' : ''}${codePrefix.includes('DI') ? 'DI' : 'DO'}`;
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
    const text = points
      ? (pointAt(slot)?.label || spareText(slot))
      : buildDiscrValues(kind, listNum)[rowInList];
    const def = buildTagDef(
      `${cfg.discrPrefix}.Data_${dataIdx}`,
      'string',
      cfg.discrPrefix,
      text,
      text
    );
    if (points) def.fromPlc = true;
    defs.push(def);
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
    const connection = points ? (pointAt(slot)?.connection || '') : (plcSources[slot] || '');
    const listNum = Math.floor(slot / Builder.ROWS_PER_LIST) + 1;
    const rowInList = slot % Builder.ROWS_PER_LIST;
    const ioNum = (listNum - 1) * Builder.ROWS_PER_LIST + rowInList + 1;
    const def = buildTagDef(
      `${cfg.tagsPrefix}.Data_${dataIdx}`,
      'bool',
      cfg.tagsPrefix,
      connection || `${codePrefix}${pad2(ioNum)} value`,
      false,
      { connection }
    );
    if (points) def.fromPlc = true;
    defs.push(def);
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
  const zonePoints = classifyPlcIoPoints(existingTags);
  const defs = [...buildTempTagDefs()];
  for (const zone of Builder.listZones(files)) {
    const kinds = zonePoints.get(zone);
    for (const kind of ['di', 'do', 'safetyDi', 'safetyDo']) {
      if (zone && !Builder.maxListNum(files, kind, zone)) continue;
      // Points read from the PLC tag export are the source of truth; projects without them
      // keep the older behaviour (template text + unclassified PLC tags in order).
      const points = kinds && kinds[kind].size ? kinds[kind] : null;
      const plcSources = points ? [] : pickPlcSourceTags(existingTags, kind);
      defs.push(...buildFolderTagDefs(kind, files, plcSources, zone, points));
    }
  }
  return defs;
}

function buildListRuntimeValues(kind, listNum, tagByName = {}, zone = '') {
  const cfg = Builder.kindConfig(kind, zone);
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
    byParameterFile[name] = buildListRuntimeValues(def.kind, def.listNum, tagByName, def.zone || '');
  }
  return byParameterFile;
}

const PLC_UPLOADED_TAGS_FOLDER = 'PLC uploded Tags';

function getStandardHmiTagFolders() {
  const order = ['di', 'do', 'safetyDi', 'safetyDo'];
  return order.flatMap((kind) => {
    const cfg = Builder.IO_LIST_KINDS[kind];
    return [cfg.discrPrefix, cfg.noPrefix, cfg.tagsPrefix];
  });
}

function getIoListTagFolders() {
  return [...getStandardHmiTagFolders(), 'Temp_Tags'];
}

function getHmiTagExplorerGroups() {
  const order = [
    { id: 'PLC_DI', kind: 'di' },
    { id: 'PLC_DO', kind: 'do' },
    { id: 'Safety_DI', kind: 'safetyDi' },
    { id: 'Safety_DO', kind: 'safetyDo' }
  ];
  return order.map((g) => {
    const cfg = Builder.IO_LIST_KINDS[g.kind];
    return {
      id: g.id,
      label: g.id,
      folders: [
        { name: cfg.discrPrefix, label: 'Discr' },
        { name: cfg.noPrefix, label: 'No' },
        { name: cfg.tagsPrefix, label: 'Tags' }
      ]
    };
  });
}

function getDefaultHmiTagFolderOrder() {
  return [...getStandardHmiTagFolders(), PLC_UPLOADED_TAGS_FOLDER];
}

module.exports = {
  PLC_UPLOADED_TAGS_FOLDER,
  buildAllIoListTagDefs,
  buildAllListRuntimeValues,
  buildListRuntimeValues,
  getStandardHmiTagFolders,
  getHmiTagExplorerGroups,
  getDefaultHmiTagFolderOrder,
  getIoListTagFolders,
  pickPlcSourceTags,
  classifyPlcIoPoints,
  planIoListsFromPlcTags,
  isIoListFolder
};
