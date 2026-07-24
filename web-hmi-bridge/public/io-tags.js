(function initIoTags(global) {
  const FT_HEADER = ';Tag Type, Tag Name, Tag Description, Read Only, Data Source, Security Code, Alarmed, Native Type, Value Type, Min Analog, Max Analog, Initial Analog, Scale, Offset, DeadBand, Units, Off Label Digital, On Label Digital, Initial Digital, Length String, Initial String, Retentive, Address, System Source Name, System Source Index, RIO Address, Element Size Block, Number Elements Block, Initial Block';
  const FT_VERSION = ';###002 - THIS LINE CONTAINS VERSION INFORMATION. DO NOT REMOVE!!!';
  const COLUMN_COUNT = 29;

  function splitDelimitedLine(line) {
    const raw = String(line || '').trim();
    if (!raw || raw.startsWith(';')) {
      return null;
    }

    if (raw.startsWith('"')) {
      const cells = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < raw.length; i += 1) {
        const ch = raw[i];
        if (ch === '"') {
          if (inQuotes && raw[i + 1] === '"') {
            current += '"';
            i += 1;
          } else {
            inQuotes = !inQuotes;
          }
          continue;
        }
        if (ch === ',' && !inQuotes) {
          cells.push(current);
          current = '';
          continue;
        }
        current += ch;
      }
      cells.push(current);
      return cells;
    }

    if (raw.includes('\t')) {
      return raw.split('\t');
    }

    return raw.split(',');
  }

  function normalizeTagType(value) {
    return String(value || '').trim().toUpperCase().slice(0, 1);
  }

  function padCells(cells) {
    const next = [...cells];
    while (next.length < COLUMN_COUNT) {
      next.push('');
    }
    return next.slice(0, COLUMN_COUNT);
  }

  function parseIoListText(text) {
    const folders = [];
    const tags = [];
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);

    for (const line of lines) {
      const trimmed = String(line || '').trim();
      if (!trimmed || trimmed.startsWith(';Tag Type')) {
        continue;
      }

      const cells = splitDelimitedLine(line);
      if (!cells || !cells.length) {
        continue;
      }

      const padded = padCells(cells.map((cell) => String(cell ?? '').trim()));
      const tagType = normalizeTagType(padded[0]);
      if (!tagType) {
        continue;
      }

      const record = {
        tagType,
        tagName: padded[1],
        tagDescription: padded[2],
        readOnly: padded[3] || 'F',
        dataSource: padded[4] || (tagType === 'D' ? 'D' : 'M'),
        securityCode: padded[5] || '*',
        alarmed: padded[6] || 'F',
        nativeType: padded[7],
        valueType: padded[8],
        minAnalog: padded[9],
        maxAnalog: padded[10],
        initialAnalog: padded[11],
        scale: padded[12],
        offset: padded[13],
        deadBand: padded[14],
        units: padded[15],
        offLabelDigital: padded[16],
        onLabelDigital: padded[17],
        initialDigital: padded[18],
        lengthString: padded[19],
        initialString: padded[20],
        retentive: padded[21] || '0',
        address: padded[22],
        systemSourceName: padded[23],
        systemSourceIndex: padded[24],
        rioAddress: padded[25],
        elementSizeBlock: padded[26],
        numberElementsBlock: padded[27],
        initialBlock: padded[28]
      };

      if (tagType === 'F') {
        folders.push(record);
      } else {
        if (tagType === 'S') {
          record.lengthString = record.lengthString || '82';
          record.initialString = record.initialString || record.tagDescription || '';
        }
        if (tagType === 'D') {
          record.offLabelDigital = record.offLabelDigital || '0';
          record.onLabelDigital = record.onLabelDigital || '1';
          record.initialDigital = record.initialDigital || '0';
        }
        if (tagType === 'A') {
          record.nativeType = record.nativeType || 'D';
          record.valueType = record.valueType || 'L';
          record.minAnalog = record.minAnalog || '0';
          record.maxAnalog = record.maxAnalog || '100';
          record.initialAnalog = record.initialAnalog || '0';
          record.scale = record.scale || '1';
          record.offset = record.offset || '0';
          record.deadBand = record.deadBand || '0';
          record.retentive = record.retentive || '0';
        }
        tags.push(record);
      }
    }

    return { folders, tags };
  }

  function parseSimpleIoListCsv(text) {
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
    if (!lines.length) {
      return { folders: [], tags: [] };
    }

    const headerCells = splitDelimitedLine(lines[0]) || [];
    const headerKey = headerCells.map((cell) => String(cell || '').trim().toLowerCase());
    const isSimple = headerKey.includes('tagtype') || headerKey.includes('tag type');
    if (!isSimple) {
      return parseIoListText(text);
    }

    const indexOf = (names) => headerKey.findIndex((cell) => names.includes(cell));
    const typeIdx = indexOf(['tagtype', 'tag type', 'type']);
    const nameIdx = indexOf(['tagname', 'tag name', 'name']);
    const descIdx = indexOf(['tagdescription', 'tag description', 'description']);
    const addrIdx = indexOf(['address', 'plc address']);
    const initIdx = indexOf(['initialstring', 'initial string', 'initial']);
    const folderIdx = indexOf(['folder']);

    const folders = [];
    const tags = [];
    const folderSet = new Set();

    for (const line of lines.slice(1)) {
      const cells = splitDelimitedLine(line);
      if (!cells) {
        continue;
      }
      const tagType = normalizeTagType(cells[typeIdx >= 0 ? typeIdx : 0]);
      const tagName = String(cells[nameIdx >= 0 ? nameIdx : 1] || '').trim();
      if (!tagType || !tagName) {
        continue;
      }

      const tagDescription = String(cells[descIdx >= 0 ? descIdx : 2] || '').trim();
      const address = String(cells[addrIdx >= 0 ? addrIdx : 3] || '').trim();
      const initialString = String(cells[initIdx >= 0 ? initIdx : 4] || tagDescription).trim();
      const folderName = String(cells[folderIdx >= 0 ? folderIdx : 5] || tagName.split('\\')[0] || '').trim();

      if (tagType === 'F') {
        if (!folderSet.has(folderName || tagName)) {
          folderSet.add(folderName || tagName);
          folders.push({
            tagType: 'F',
            tagName: folderName || tagName,
            tagDescription: tagDescription,
            readOnly: 'F'
          });
        }
        continue;
      }

      if (folderName && !folderSet.has(folderName)) {
        folderSet.add(folderName);
        folders.push({ tagType: 'F', tagName: folderName, tagDescription: '', readOnly: 'F' });
      }

      tags.push({
        tagType,
        tagName,
        tagDescription,
        readOnly: 'F',
        dataSource: tagType === 'D' ? 'D' : 'M',
        securityCode: '*',
        alarmed: 'F',
        nativeType: tagType === 'A' ? 'D' : '',
        valueType: tagType === 'A' ? 'L' : '',
        minAnalog: tagType === 'A' ? '0' : '',
        maxAnalog: tagType === 'A' ? '100' : '',
        initialAnalog: tagType === 'A' ? '0' : '',
        scale: tagType === 'A' ? '1' : '',
        offset: tagType === 'A' ? '0' : '',
        deadBand: tagType === 'A' ? '0' : '',
        units: '',
        offLabelDigital: tagType === 'D' ? '0' : '',
        onLabelDigital: tagType === 'D' ? '1' : '',
        initialDigital: tagType === 'D' ? '0' : '',
        lengthString: tagType === 'S' ? '82' : '',
        initialString: tagType === 'S' ? initialString : '',
        retentive: '0',
        address,
        systemSourceName: '',
        systemSourceIndex: '',
        rioAddress: '',
        elementSizeBlock: '',
        numberElementsBlock: '',
        initialBlock: ''
      });
    }

    return { folders, tags };
  }

  function formatFactoryTalkQuoted(value) {
    const text = String(value ?? '');
    if (!text) {
      return '';
    }
    return `"${text.replace(/"/g, '""')}"`;
  }

  function formatFactoryTalkNumber(value) {
    const text = String(value ?? '');
    return text;
  }

  function serializeFolderRow(record) {
    return [
      formatFactoryTalkQuoted(record.tagType),
      formatFactoryTalkQuoted(record.tagName),
      formatFactoryTalkQuoted(record.tagDescription),
      formatFactoryTalkQuoted(record.readOnly || 'F')
    ].join(',');
  }

  function formatFactoryTalkCell(value, columnIndex, record) {
    const tagType = String(record?.tagType || '').toUpperCase();
    if (value === null || value === undefined || value === '') {
      if (columnIndex === 2 && tagType === 'A') {
        return '""';
      }
      return '';
    }
    const numericColumns = new Set([9, 10, 11, 12, 13, 14, 19, 21]);
    if (numericColumns.has(columnIndex)) {
      return formatFactoryTalkNumber(value);
    }
    return formatFactoryTalkQuoted(value);
  }

  function serializeTagRow(record) {
    const tagType = record.tagType;
    const cells = [
      record.tagType,
      record.tagName,
      record.tagDescription,
      record.readOnly || 'F',
      record.dataSource || (tagType === 'D' ? 'D' : 'M'),
      record.securityCode || '*',
      record.alarmed || 'F',
      record.nativeType,
      record.valueType,
      record.minAnalog,
      record.maxAnalog,
      record.initialAnalog,
      record.scale,
      record.offset,
      record.deadBand,
      record.units,
      record.offLabelDigital,
      record.onLabelDigital,
      record.initialDigital,
      record.lengthString,
      record.initialString,
      tagType === 'D' ? '' : (record.retentive || '0'),
      record.address
    ];

    return cells.map((value, index) => formatFactoryTalkCell(value, index, record)).join(',');
  }

  function serializeFactoryTalkTagsCsv(parsed) {
    const folders = Array.isArray(parsed?.folders) ? parsed.folders : [];
    const tags = Array.isArray(parsed?.tags) ? parsed.tags : [];
    const lines = [
      FT_HEADER,
      FT_VERSION,
      '',
      ';Folders Section (Must define folders before tags)'
    ];

    for (const folder of folders) {
      lines.push(serializeFolderRow(folder));
    }

    lines.push('', ';Tag Section');
    for (const tag of tags) {
      lines.push(serializeTagRow(tag));
    }

    return `${lines.join('\r\n')}\r\n`;
  }

  function ensureStandardFoldersAndIoListTag(parsed) {
    const folderNames = new Set(parsed.folders.map((folder) => folder.tagName));
    for (const tag of parsed.tags) {
      const folderName = String(tag.tagName || '').split('\\')[0];
      if (folderName && !folderNames.has(folderName)) {
        folderNames.add(folderName);
        parsed.folders.push({ tagType: 'F', tagName: folderName, tagDescription: '', readOnly: 'F' });
      }
    }

    if (!parsed.folders.some((folder) => folder.tagName === 'Temp_Tags')) {
      parsed.folders.push({ tagType: 'F', tagName: 'Temp_Tags', tagDescription: '', readOnly: 'F' });
    }

    if (!parsed.tags.some((tag) => tag.tagName === 'Temp_Tags\\IO_LIST')) {
      parsed.tags.push({
        tagType: 'A',
        tagName: 'Temp_Tags\\IO_LIST',
        tagDescription: '',
        readOnly: 'F',
        dataSource: 'M',
        securityCode: '*',
        alarmed: 'F',
        nativeType: 'D',
        valueType: 'L',
        minAnalog: '0',
        maxAnalog: '100',
        initialAnalog: '1',
        scale: '1',
        offset: '0',
        deadBand: '0',
        retentive: '0'
      });
    }

    return parsed;
  }

  const MASTER_SHEET_FOLDERS = [
    'PLC_DI_Discr',
    'PLC_DI_NO',
    'PLC_DI_Tags',
    'PLC_DO_Discr',
    'PLC_DO_No',
    'PLC_DO_Tags',
    'Safety_DI_Discr',
    'Safety_DI_No',
    'Safety_DI_Tags',
    'Safety_DO_Discr',
    'Safety_DO_No',
    'Safety_DO_Tags',
    'Temp_Tags'
  ];

  function cellStr(value) {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  }

  function isIoListSheetName(name) {
    return /io\s*list/i.test(cellStr(name));
  }

  function ioListZoneFromSheetName(sheetName) {
    const name = cellStr(sheetName);
    const suffixMatch = name.match(/^(.*?)\s*IO\s*List\s*$/i);
    if (suffixMatch) {
      const zone = cellStr(suffixMatch[1]);
      if (zone) {
        return zone;
      }
    }

    const ioListOnlyMatch = name.match(/^IO\s*list(?:\s+(.*))?$/i);
    if (ioListOnlyMatch) {
      const tail = cellStr(ioListOnlyMatch[1]);
      if (tail && !/^v?\d+(\.\d+)?$/i.test(tail)) {
        return tail;
      }
      return 'General';
    }

    const prefixMatch = name.match(/^(.*?)\s*IO\s*List\b/i);
    if (prefixMatch) {
      const zone = cellStr(prefixMatch[1]);
      if (zone) {
        return zone;
      }
    }

    if (isIoListSheetName(name)) {
      const zone = cellStr(name.replace(/\s*IO\s*List.*/i, ''));
      if (zone) {
        return zone;
      }
      return 'General';
    }

    return name || 'General';
  }

  const IO_TYPE_LABELS = {
    SDI: 'Safety Digital Input',
    SDO: 'Safety Digital Output',
    DI: 'Digital Input',
    DO: 'Digital Output'
  };

  function normalizeHeaderLabel(value) {
    return cellStr(value).toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
  }

  function parseIoPointType(value) {
    const raw = cellStr(value);
    if (!raw || isIoListSectionLabel(raw) || isIoListSectionMarker(raw)) {
      return null;
    }

    const codeMatch = raw.match(/^(SDI|SDO|DI|DO)(\d{1,3})$/i);
    if (codeMatch) {
      const kind = codeMatch[1].toUpperCase();
      const rawNum = codeMatch[2];
      const isSafetyKind = kind === 'SDI' || kind === 'SDO';
      return {
        kind,
        ioKind: kind,
        code: isSafetyKind ? `${kind}${Number.parseInt(rawNum, 10)}` : `${kind}${rawNum}`,
        num: rawNum.padStart(2, '0'),
        isSafety: isSafetyKind,
        direction: kind === 'SDI' || kind === 'DI' ? 'input' : 'output',
        label: IO_TYPE_LABELS[kind]
      };
    }

    const lower = raw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (/\bsafety\b.*\binput\b|\bsdi\b/.test(lower)) {
      return {
        kind: 'SDI',
        ioKind: 'SDI',
        code: raw,
        num: '',
        isSafety: true,
        direction: 'input',
        label: IO_TYPE_LABELS.SDI
      };
    }
    if (/\bsafety\b.*\boutput\b|\bsdo\b/.test(lower)) {
      return {
        kind: 'SDO',
        ioKind: 'SDO',
        code: raw,
        num: '',
        isSafety: true,
        direction: 'output',
        label: IO_TYPE_LABELS.SDO
      };
    }
    if (/\bdigital\b.*\binput\b|\bdi\b/.test(lower) && !/\bsafety\b/.test(lower)) {
      return {
        kind: 'DI',
        ioKind: 'DI',
        code: raw,
        num: '',
        isSafety: false,
        direction: 'input',
        label: IO_TYPE_LABELS.DI
      };
    }
    if (/\bdigital\b.*\boutput\b|\bdo\b/.test(lower) && !/\bsafety\b/.test(lower)) {
      return {
        kind: 'DO',
        ioKind: 'DO',
        code: raw,
        num: '',
        isSafety: false,
        direction: 'output',
        label: IO_TYPE_LABELS.DO
      };
    }

    return null;
  }

  function formatIoPointLabel(type, description) {
    const parsed = parseIoPointType(type);
    const ioType = parsed?.code || cellStr(type);
    const desc = cellStr(description);
    return desc ? `${ioType} ${desc}` : ioType;
  }

  function formatRioModule(rioModule) {
    const value = Math.max(1, Number.parseInt(String(rioModule || '1'), 10) || 1);
    return String(value).padStart(2, '0');
  }

  function formatRioModuleLabel(rioModule) {
    return `RIO${formatRioModule(rioModule)}`;
  }

  function formatPlcAddressIndex(kind, num) {
    const value = Number.parseInt(String(num).replace(/^0+/, '') || '0', 10);
    if (!Number.isFinite(value)) {
      return String(num);
    }
    if (kind === 'DI') {
      return String(value).padStart(3, '0');
    }
    return String(value).padStart(2, '0');
  }

  function formatFactoryTalkPlcAddress(processorName, rioModule, kind, num) {
    const processor = cellStr(processorName) || 'PLC';
    const index = formatPlcAddressIndex(kind, num);
    return `[${processor}]${formatRioModuleLabel(rioModule)}_${kind}[${index}]`;
  }

  function formatProjectProcessorBase(projectName) {
    const raw = cellStr(projectName).replace(/[^a-zA-Z0-9]/g, '');
    if (!raw) {
      return '';
    }
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }

  function inferProcessorNameForZone(options = {}, zoneName = '', allZones = []) {
    if (cellStr(options.processorName)) {
      return cellStr(options.processorName);
    }

    const fromSheets = findProcessorNameFromSheets(options.sheets || []);
    if (fromSheets && fromSheets !== 'PLC') {
      return fromSheets;
    }

    const projectBase = formatProjectProcessorBase(options.projectName);
    if (projectBase && allZones.length) {
      const zoneIndex = allZones.findIndex((zone) => zoneNamesMatch(zone, zoneName));
      if (zoneIndex >= 0) {
        return `${projectBase}_Z${zoneIndex + 1}`;
      }
    }

    return fromSheets || 'PLC';
  }

  function parseRioModuleFromPlcTag(tag) {
    const match = cellStr(tag).match(/RIO(\d{2})_/i);
    if (!match) {
      return null;
    }
    const value = Number.parseInt(match[1], 10);
    return Number.isFinite(value) ? value : null;
  }

  function parseRioModuleFromZoneName(zone) {
    const name = cellStr(zone);
    const rioMatch = name.match(/\bRIO\s*0*(\d+)\b/i);
    if (rioMatch) {
      return Number.parseInt(rioMatch[1], 10);
    }
    const zoneMatch = name.match(/\bzone\s*0*(\d+)\b/i);
    if (zoneMatch) {
      return Number.parseInt(zoneMatch[1], 10);
    }
    return null;
  }

  function buildZoneRioModuleMap(zones, options = {}) {
    const map = {};
    const list = (zones || []).map((zone) => cellStr(zone)).filter(Boolean);
    const sheets = options.sheets || [];
    const entries = options.entries || [];

    for (const zone of list) {
      const fromName = parseRioModuleFromZoneName(zone);
      if (fromName) {
        map[zone] = fromName;
      }
    }

    const inferred = inferZoneRioModulesFromPlcEntries(sheets, entries);
    for (const [zone, rioModule] of Object.entries(inferred)) {
      if (!map[zone]) {
        map[zone] = rioModule;
      }
    }

    for (const sheet of sheets) {
      const zone = cellStr(sheet.zone);
      if (!zone || map[zone]) {
        continue;
      }
      const modules = new Set();
      for (const item of [...(sheet.diInputs || []), ...(sheet.doOutputs || [])]) {
        const module = parseRioModuleFromPlcTag(item.plcTag);
        if (module) {
          modules.add(module);
        }
      }
      if (modules.size === 1) {
        map[zone] = [...modules][0];
      }
    }

    list.forEach((zone, index) => {
      if (!map[zone]) {
        map[zone] = index + 1;
      }
    });

    const manualMap = options.manualMap || options.manualZoneRioModules || {};
    for (const [zone, rioModule] of Object.entries(manualMap)) {
      const value = Number.parseInt(rioModule, 10);
      if (cellStr(zone) && Number.isFinite(value) && value > 0) {
        map[zone] = value;
      }
    }

    return map;
  }

  function listRioModulesFromPlcEntries(entries, fallbackMax = 6) {
    const modules = new Set();
    for (const entry of entries || []) {
      const rioModule = entry.rioModule
        || parseRioModuleFromPlcTag(entry.plcTag || entry.specifier)
        || parseRioModuleFromPlcTag(entry.parentTag);
      if (rioModule) {
        modules.add(rioModule);
      }
    }
    if (modules.size) {
      return [...modules].sort((a, b) => a - b);
    }
    return Array.from({ length: fallbackMax }, (_, index) => index + 1);
  }

  function buildZoneSetupRows(sheets, zoneRioModules = {}) {
    return (sheets || []).map((sheet, index) => {
      const zone = cellStr(sheet.zone) || 'General';
      return {
        sheetName: cellStr(sheet.sheetName) || zone || `Sheet ${index + 1}`,
        zone,
        rioModule: zoneRioModules[zone] || sheet.rioModule || index + 1
      };
    });
  }

  function applyZoneSetupToSheets(sheets, setupRows) {
    const nextSheets = Array.isArray(sheets) ? sheets : [];
    const rowBySheet = new Map();
    for (const row of setupRows || []) {
      const sheetKey = cellStr(row.sheetName);
      const zoneKey = cellStr(row.zone);
      if (sheetKey) {
        rowBySheet.set(sheetKey, row);
      }
      if (zoneKey && !rowBySheet.has(zoneKey)) {
        rowBySheet.set(zoneKey, row);
      }
    }

    const zoneRioModules = {};
    const zones = [];
    for (const sheet of nextSheets) {
      const row = rowBySheet.get(cellStr(sheet.sheetName))
        || rowBySheet.get(cellStr(sheet.zone));
      if (!row) {
        const zone = cellStr(sheet.zone) || 'General';
        if (zone && !zones.includes(zone)) {
          zones.push(zone);
        }
        continue;
      }

      const zone = cellStr(row.zone) || cellStr(sheet.zone) || 'General';
      const rioModule = Number.parseInt(row.rioModule, 10);
      sheet.zone = zone;
      if (Number.isFinite(rioModule) && rioModule > 0) {
        sheet.rioModule = rioModule;
        zoneRioModules[zone] = rioModule;
      }
      if (zone && !zones.includes(zone)) {
        zones.push(zone);
      }
    }

    return { sheets: nextSheets, zoneRioModules, zones };
  }

  function inferZoneRioModulesFromPlcEntries(sheets, entries) {
    const map = {};
    if (!Array.isArray(entries) || !entries.length) {
      return map;
    }

    for (const sheet of sheets || []) {
      const zone = cellStr(sheet.zone);
      if (!zone) {
        continue;
      }

      const items = [...(sheet.diInputs || []), ...(sheet.doOutputs || [])];
      const scores = new Map();

      for (const item of items) {
        const parsed = parseIoPointType(item.type);
        if (!parsed?.ioKind) {
          continue;
        }

        const ioNum = Number.parseInt(parsed.num, 10);
        const normalizedDescription = normalizeDescriptionForMatch(item.description);
        const normalizedFullLabel = normalizeDescriptionForMatch(formatIoPointLabel(item.type, item.description));

        for (const entry of entries) {
          if (entry.ioKind !== parsed.ioKind) {
            continue;
          }

          const rioModule = entry.rioModule
            || parseRioModuleFromPlcTag(entry.plcTag || entry.specifier)
            || parseRioModuleFromPlcTag(entry.parentTag);
          if (!rioModule) {
            continue;
          }

          let matched = false;
          if (Number.isFinite(ioNum) && entry.ioNum === ioNum) {
            matched = entry.normalizedDescription === normalizedDescription
              || entry.normalizedFullLabel === normalizedFullLabel
              || descriptionsRoughlyMatch(entry.description, item.description);
          } else if (entry.normalizedDescription === normalizedDescription
            || descriptionsRoughlyMatch(entry.description, item.description)) {
            matched = true;
          }

          if (matched) {
            const weight = entry.preferred ? 3 : 1;
            scores.set(rioModule, (scores.get(rioModule) || 0) + weight);
          }
        }
      }

      let bestRio = null;
      let bestScore = 0;
      for (const [rioModule, score] of scores) {
        if (score > bestScore) {
          bestScore = score;
          bestRio = rioModule;
        }
      }

      if (bestRio) {
        map[zone] = bestRio;
      }
    }

    return map;
  }

  function applyRioModulesToSheets(sheets, zoneRioModules, options = {}) {
    const preserveMatchedTags = options.preserveMatchedTags !== false;
    for (const sheet of sheets || []) {
      const zone = cellStr(sheet.zone) || 'General';
      const rioModule = zoneRioModules?.[zone] || sheet.rioModule || 1;
      sheet.rioModule = rioModule;
      for (const item of [...(sheet.diInputs || []), ...(sheet.doOutputs || [])]) {
        const existingRio = parseRioModuleFromPlcTag(item.plcTag);
        item.rioModule = existingRio || item.rioModule || rioModule;
        if (preserveMatchedTags && existingRio) {
          continue;
        }
        item.plcTag = inferPlcTag(item.type, item.plcTag, item.rioModule);
      }
    }
  }

  function findProcessorNameFromSheets(sheets) {
    for (const sheet of sheets || []) {
      for (const item of [...(sheet?.diInputs || []), ...(sheet?.doOutputs || [])]) {
        const match = cellStr(item?.plcTag).match(/^\[([^\]]+)\]/);
        if (match) {
          return match[1];
        }
      }
    }
    return 'PLC';
  }

  function inferPlcTag(ioType, existingTag, rioModule = 1, processorName = 'PLC') {
    const parsed = parseIoPointType(ioType);
    if (!parsed?.num) {
      return cellStr(existingTag);
    }

    return formatFactoryTalkPlcAddress(processorName, rioModule, parsed.kind, parsed.num);
  }

  function findMasterIoListHeader(rows) {
    for (let rowIndex = 0; rowIndex < (rows || []).length; rowIndex += 1) {
      const cells = (Array.isArray(rows[rowIndex]) ? rows[rowIndex] : []).map(cellStr);
      const labels = cells.map(normalizeHeaderLabel);
      const inputTypeIdx = labels.findIndex((label) => (
        label === 'input type' || label === 'io type' || label.includes('input type')
      ));
      const outputTypeIdx = labels.findIndex((label, idx) => (
        (inputTypeIdx < 0 || idx > inputTypeIdx)
        && (label === 'output type' || label.includes('output type') || (label === 'io type' && idx !== inputTypeIdx))
      ));
      const slNoIdx = labels.findIndex((label) => (
        label === 'sl no' || label === 'sno' || label === 'slno' || label.startsWith('sl no')
        || label === 'sr no' || label.startsWith('sr no') || label === 'srno'
      ));
      const hasStructuredHeader = labels.some((label) => (
        label.includes('input type') || label.includes('output type') || label === 'io type'
      ));
      const addressIndices = labels
        .map((label, idx) => (label === 'address' ? idx : -1))
        .filter((idx) => idx >= 0);
      const tagIndices = labels
        .map((label, idx) => (label === 'tag' || label === 'full description' ? idx : -1))
        .filter((idx) => idx >= 0);
      const descIndices = labels
        .map((label, idx) => (label.includes('description') ? idx : -1))
        .filter((idx) => idx >= 0);

      if (inputTypeIdx >= 0 && hasStructuredHeader && (slNoIdx >= 0 || inputTypeIdx > 0)) {
        const splitAt = outputTypeIdx >= 0 ? outputTypeIdx : cells.length;

        return {
          rowIndex,
          inputType: inputTypeIdx,
          inputAddress: addressIndices.find((idx) => idx < splitAt) ?? inputTypeIdx + 2,
          inputDescription: descIndices.find((idx) => idx < splitAt) ?? inputTypeIdx + 4,
          inputTag: tagIndices.find((idx) => idx < splitAt) ?? inputTypeIdx + 7,
          outputType: outputTypeIdx,
          outputAddress: outputTypeIdx >= 0
            ? (addressIndices.find((idx) => idx > outputTypeIdx) ?? outputTypeIdx + 2)
            : -1,
          outputDescription: outputTypeIdx >= 0
            ? (descIndices.find((idx) => idx > outputTypeIdx) ?? outputTypeIdx + 3)
            : -1,
          outputTag: outputTypeIdx >= 0
            ? (tagIndices.find((idx) => idx > outputTypeIdx) ?? outputTypeIdx + 6)
            : -1
        };
      }

      if (outputTypeIdx >= 0 && hasStructuredHeader && inputTypeIdx < 0 && (slNoIdx >= 0 || outputTypeIdx > 0)) {
        return {
          rowIndex,
          inputType: -1,
          inputAddress: -1,
          inputDescription: -1,
          inputTag: -1,
          outputType: outputTypeIdx,
          outputAddress: addressIndices.find((idx) => idx > outputTypeIdx) ?? outputTypeIdx + 2,
          outputDescription: descIndices.find((idx) => idx > outputTypeIdx) ?? outputTypeIdx + 3,
          outputTag: tagIndices.find((idx) => idx > outputTypeIdx) ?? outputTypeIdx + 6
        };
      }

      if (cells[0] === 'Sl No' && cells[1] === 'Input Type') {
        return {
          rowIndex,
          inputType: 1,
          inputAddress: 3,
          inputDescription: 5,
          inputTag: 8,
          outputType: 10,
          outputAddress: 12,
          outputDescription: 13,
          outputTag: 16
        };
      }
    }

    return null;
  }

  function isIoListSectionLabel(value) {
    const label = normalizeHeaderLabel(value);
    return label === 'digital input'
      || label === 'digital output'
      || label === 'safety digital input'
      || label === 'safety digital output';
  }

  function isIoListSectionMarker(value) {
    const label = normalizeHeaderLabel(value);
    return label === 'di' || label === 'do' || label === 'sdi' || label === 'sdo'
      || isIoListSectionLabel(value);
  }

  function findIoPointCell(cells, startIndex, endIndex, direction) {
    const start = Math.max(0, Number(startIndex) || 0);
    const end = Math.max(start, Number(endIndex) || cells.length);
    for (let index = start; index < end; index += 1) {
      const parsed = parseIoPointType(cells[index]);
      if (parsed?.direction === direction) {
        return { parsed, index };
      }
    }
    return null;
  }

  function resolveIoSideCell(cells, header, side, direction) {
    const baseIndex = side === 'output' ? header.outputType : header.inputType;
    if (baseIndex < 0) {
      return findIoPointCell(cells, 0, cells.length, direction);
    }

    const searchEnd = side === 'output'
      ? cells.length
      : (header.outputType >= 0 && header.outputType !== header.inputType
        ? header.outputType
        : cells.length);
    const candidates = [0, 1, -1].map((shift) => baseIndex + shift);
    for (const index of candidates) {
      if (index < 0 || index >= searchEnd) {
        continue;
      }
      const parsed = parseIoPointType(cells[index]);
      if (parsed?.direction === direction) {
        return { parsed, index };
      }
    }

    return findIoPointCell(cells, baseIndex, searchEnd, direction);
  }

  function pickIoSideValues(cells, header, side, typeIndex) {
    const baseTypeIndex = side === 'output' ? header.outputType : header.inputType;
    const offset = typeIndex - baseTypeIndex;
    const addressIndex = (side === 'output' ? header.outputAddress : header.inputAddress) + offset;
    const descriptionIndex = (side === 'output' ? header.outputDescription : header.inputDescription) + offset;
    const tagIndex = (side === 'output' ? header.outputTag : header.inputTag) + offset;
    return {
      address: cells[addressIndex],
      description: cells[descriptionIndex],
      plcTag: cells[tagIndex],
      typeValue: cells[typeIndex]
    };
  }

  function pushIoPointRecord(target, side, cells, header, match) {
    if (!match?.parsed) {
      return;
    }

    const values = pickIoSideValues(cells, header, side, match.index);
    const record = {
      type: match.parsed.code || cellStr(values.typeValue).toUpperCase(),
      ioKind: match.parsed.ioKind,
      ioKindLabel: match.parsed.label,
      isSafety: match.parsed.isSafety,
      address: values.address,
      description: values.description,
      plcTag: inferPlcTag(values.typeValue, values.plcTag)
    };

    if (match.parsed.direction === 'input') {
      target.diInputs.push(record);
    } else if (match.parsed.direction === 'output') {
      target.doOutputs.push(record);
    }
  }

  function makeStringTag(tagName, label) {
    const text = cellStr(label);
    return {
      tagType: 'S',
      tagName,
      tagDescription: text,
      readOnly: 'F',
      dataSource: 'M',
      securityCode: '*',
      alarmed: 'F',
      lengthString: '82',
      initialString: text,
      retentive: '0'
    };
  }

  function makeDigitalTag(tagName, label, address) {
    const text = cellStr(label);
    return {
      tagType: 'D',
      tagName,
      tagDescription: text,
      readOnly: 'F',
      dataSource: 'D',
      securityCode: '*',
      alarmed: 'F',
      offLabelDigital: '0',
      onLabelDigital: '1',
      initialDigital: '0',
      address: cellStr(address),
      retentive: '0'
    };
  }

  function makeAnalogTag(tagName, tagDescription, options = {}) {
    return {
      tagType: 'A',
      tagName,
      tagDescription: cellStr(tagDescription),
      readOnly: 'F',
      dataSource: 'M',
      securityCode: '*',
      alarmed: 'F',
      nativeType: options.nativeType || 'D',
      valueType: options.valueType || 'L',
      minAnalog: String(options.min ?? 0),
      maxAnalog: String(options.max ?? 100),
      initialAnalog: String(options.initial ?? 0),
      scale: '1',
      offset: '0',
      deadBand: '0',
      retentive: '0'
    };
  }

  const ZONE_EXPORT_FOLDERS = [
    ...MASTER_SHEET_FOLDERS,
    'Values'
  ];

  function zoneNamesMatch(left, right) {
    return cellStr(left).toLowerCase() === cellStr(right).toLowerCase();
  }

  function findSheetForZone(sheets, zone) {
    const target = cellStr(zone);
    if (!target) {
      return null;
    }
    return (sheets || []).find((sheet) => zoneNamesMatch(sheet.zone, target)) || null;
  }

  function buildGroupedChannelTags(items, config, startIndex = 0) {
    const tags = [];
    const {
      discrFolder,
      noFolder,
      tagsFolder,
      listTitleBase,
      isSafety
    } = config;
    const pageCount = Math.max(1, Math.ceil((items || []).length / 8));

    for (const [index, item] of (items || []).entries()) {
      const dataIndex = String(startIndex + index).padStart(2, '0');
      const label = formatIoPointLabel(item.type, item.description);
      tags.push(makeStringTag(`${discrFolder}\\Data_${dataIndex}`, label));
    }

    for (let page = 1; page <= pageCount; page += 1) {
      const pageStr = String(page).padStart(2, '0');
      const title = `${listTitleBase} ${pageStr}`;
      if (isSafety) {
        tags.push(makeStringTag(`${discrFolder}\\Safety_List_${pageStr}`, title));
      } else {
        tags.push(makeStringTag(`${discrFolder}\\List_${pageStr}`, title));
      }
    }

    for (const [index, item] of (items || []).entries()) {
      const dataIndex = String(startIndex + index).padStart(2, '0');
      tags.push(makeStringTag(`${noFolder}\\Data_${dataIndex}`, item.address));
    }

    for (let page = 1; page <= pageCount; page += 1) {
      const pageStr = String(page).padStart(2, '0');
      const title = `${listTitleBase} ${pageStr}`;
      if (isSafety) {
        tags.push(makeStringTag(`${noFolder}\\Safety_List_${pageStr}`, title));
      } else {
        tags.push(makeStringTag(`${noFolder}\\List_${pageStr}`, title));
      }
    }

    for (const [index, item] of (items || []).entries()) {
      const dataIndex = String(startIndex + index).padStart(2, '0');
      const label = formatIoPointLabel(item.type, item.description);
      tags.push(makeDigitalTag(`${tagsFolder}\\Data_${dataIndex}`, label, item.plcTag));
    }

    return tags;
  }

  function buildFactoryTalkZoneAuxTags() {
    return [
      makeAnalogTag('Temp_Tags\\Alarms'),
      makeAnalogTag('Temp_Tags\\IO_LIST'),
      makeAnalogTag('Temp_Tags\\Manual_Screen'),
      makeAnalogTag('Temp_Tags\\Mimic_System'),
      makeAnalogTag('Temp_Tags\\Robot_IO_LIST'),
      makeAnalogTag('Temp_Tags\\Safety_IO_LIST'),
      makeAnalogTag('Temp_Tags\\Setting'),
      makeAnalogTag('Values\\Col1', 'Column 1', { nativeType: 'I', initial: 1 }),
      makeAnalogTag('Values\\Col16', 'Column 16', { nativeType: 'I', initial: 16 }),
      makeAnalogTag('Values\\Col2', 'Column 2', { nativeType: 'I', initial: 2 }),
      makeAnalogTag('Values\\Col4', 'Column 4', { nativeType: 'I', initial: 4 }),
      makeAnalogTag('Values\\Col8', 'Column 8', { nativeType: 'I', initial: 8 }),
      makeAnalogTag('Values\\Int0', '', { nativeType: 'I', initial: 0 }),
      makeAnalogTag('Values\\Int1', '', { nativeType: 'I', initial: 1 }),
      makeAnalogTag('Values\\Int2', '', { nativeType: 'I', initial: 2 }),
      makeAnalogTag('Values\\Int3', '', { nativeType: 'I', initial: 3 }),
      makeAnalogTag('Values\\Int4', '', { nativeType: 'I', initial: 4 }),
      makeAnalogTag('Values\\Int5', '', { nativeType: 'I', initial: 5 }),
      makeAnalogTag('Values\\Int8', '', { nativeType: 'I', initial: 8 })
    ];
  }

  function buildParsedForZoneExport(sheets, zone, options = {}) {
    const sheetList = Array.isArray(sheets) ? sheets : [];
    const zoneName = cellStr(zone) || 'General';
    const targetSheet = findSheetForZone(sheetList, zoneName);
    if (!targetSheet) {
      throw new Error(`No IO List sheet found for zone "${zoneName}".`);
    }

    const allZones = [];
    for (const sheet of sheetList) {
      const zone = cellStr(sheet.zone);
      if (zone && !allZones.includes(zone)) {
        allZones.push(zone);
      }
    }
    const inferredMap = buildZoneRioModuleMap(allZones.length ? allZones : [zoneName], {
      sheets: sheetList,
      entries: options.entries || [],
      manualMap: options.manualZoneRioModules || {}
    });
    const zoneRioModules = {
      ...inferredMap,
      ...(options.zoneRioModules || {}),
      ...(options.manualZoneRioModules || {})
    };
    applyRioModulesToSheets([targetSheet], zoneRioModules, { preserveMatchedTags: true });
    const processorName = inferProcessorNameForZone({ ...options, sheets: sheetList }, zoneName, allZones);

    const safetyDi = (targetSheet.diInputs || []).filter((item) => item.isSafety);
    const plcDi = (targetSheet.diInputs || []).filter((item) => !item.isSafety);
    const safetyDo = (targetSheet.doOutputs || []).filter((item) => item.isSafety);
    const plcDo = (targetSheet.doOutputs || []).filter((item) => !item.isSafety);
    const inputListTitle = 'PLC Input List';
    const outputListTitle = 'PLC Output List';
    const tags = [];

    for (const item of [...safetyDi, ...plcDi, ...safetyDo, ...plcDo]) {
      item.plcTag = inferPlcTag(item.type, item.plcTag, item.rioModule || targetSheet.rioModule, processorName);
    }

    tags.push(...buildGroupedChannelTags(plcDi, {
      discrFolder: 'PLC_DI_Discr',
      noFolder: 'PLC_DI_NO',
      tagsFolder: 'PLC_DI_Tags',
      listTitleBase: inputListTitle,
      isSafety: false
    }, 0));
    tags.push(...buildGroupedChannelTags(plcDo, {
      discrFolder: 'PLC_DO_Discr',
      noFolder: 'PLC_DO_No',
      tagsFolder: 'PLC_DO_Tags',
      listTitleBase: outputListTitle,
      isSafety: false
    }, 0));
    tags.push(...buildGroupedChannelTags(safetyDi, {
      discrFolder: 'Safety_DI_Discr',
      noFolder: 'Safety_DI_No',
      tagsFolder: 'Safety_DI_Tags',
      listTitleBase: 'Safety Input List',
      isSafety: true
    }, 0));
    tags.push(...buildGroupedChannelTags(safetyDo, {
      discrFolder: 'Safety_DO_Discr',
      noFolder: 'Safety_DO_No',
      tagsFolder: 'Safety_DO_Tags',
      listTitleBase: 'Safety Output List',
      isSafety: true
    }, 0));
    tags.push(...buildFactoryTalkZoneAuxTags());

    if (!tags.length) {
      throw new Error(`No IO rows found for zone "${zoneName}".`);
    }

    return {
      folders: ZONE_EXPORT_FOLDERS.map((tagName) => ({
        tagType: 'F',
        tagName,
        tagDescription: '',
        readOnly: 'F'
      })),
      tags,
      meta: {
        zones: [zoneName],
        zoneRioModules,
        exportZone: zoneName,
        counts: {
          sdi: safetyDi.length,
          di: plcDi.length,
          sdo: safetyDo.length,
          do: plcDo.length,
          safetyDi: safetyDi.length,
          plcDi: plcDi.length,
          safetyDo: safetyDo.length,
          plcDo: plcDo.length
        }
      }
    };
  }

  function validateFactoryTalkZoneTagsCsv(csvText) {
    const lines = String(csvText || '').replace(/^\uFEFF/, '').split(/\r?\n/);
    const folderCount = lines.filter((line) => line.startsWith('"F"')).length;
    const digitalTagCount = lines.filter((line) => line.startsWith('"D"')).length;
    const stringTagCount = lines.filter((line) => line.startsWith('"S"')).length;
    return {
      ok: folderCount >= 14 && digitalTagCount > 0 && stringTagCount > 0,
      folderCount,
      digitalTagCount,
      stringTagCount,
      lineCount: lines.filter(Boolean).length
    };
  }

  function buildZoneTagsCsv(sheets, zone, options = {}) {
    const parsed = buildParsedForZoneExport(sheets, zone, options);
    const csv = serializeFactoryTalkTagsCsv(parsed);
    const validation = validateFactoryTalkZoneTagsCsv(csv);
    if (!validation.ok) {
      throw new Error(
        `Tags CSV export for zone "${cellStr(zone)}" is incomplete `
        + `(${validation.folderCount} folders, ${validation.digitalTagCount} PLC tags). `
        + 'Open the IO List editor, pick the zone, and confirm the Master Sheet rows loaded.'
      );
    }
    return csv;
  }

  function parseMasterIoListSheetRows(sheetName, rows) {
    const zone = ioListZoneFromSheetName(sheetName);
    const parsed = {
      sheetName: cellStr(sheetName),
      zone,
      diInputs: [],
      doOutputs: []
    };

    const header = findMasterIoListHeader(rows);
    if (!header) {
      return parsed;
    }

    for (const rawRow of (rows || []).slice(header.rowIndex + 1)) {
      const cells = (Array.isArray(rawRow) ? rawRow : []).map(cellStr);
      if (!cells.some(Boolean)) {
        continue;
      }

      const inputType = cells[header.inputType];
      const outputType = header.outputType >= 0 ? cells[header.outputType] : '';
      if (isIoListSectionLabel(inputType) || isIoListSectionLabel(outputType)) {
        continue;
      }
      if (isIoListSectionMarker(inputType) || isIoListSectionMarker(outputType)) {
        continue;
      }
      if (normalizeHeaderLabel(inputType) === 'input type' || normalizeHeaderLabel(outputType) === 'output type') {
        continue;
      }
      if (normalizeHeaderLabel(inputType) === 'io type' || normalizeHeaderLabel(outputType) === 'io type') {
        continue;
      }
      if (['_', '+', '-'].includes(cellStr(inputType)) && !parseIoPointType(outputType)) {
        continue;
      }

      const inputMatch = header.inputType >= 0
        ? resolveIoSideCell(cells, header, 'input', 'input')
        : null;
      if (inputMatch) {
        pushIoPointRecord(parsed, 'input', cells, header, inputMatch);
      }

      let outputMatch = null;
      if (header.outputType >= 0 && header.outputType !== header.inputType) {
        outputMatch = resolveIoSideCell(cells, header, 'output', 'output');
      } else {
        outputMatch = findIoPointCell(cells, header.inputType, cells.length, 'output');
      }

      if (outputMatch && outputMatch.index !== inputMatch?.index) {
        const side = header.outputType >= 0 && outputMatch.index >= header.outputType
          ? 'output'
          : 'input';
        pushIoPointRecord(parsed, side, cells, header, outputMatch);
      }
    }

    return parsed;
  }

  function buildChannelTags(items, config, startIndex = 0) {
    const tags = [];
    const {
      discrFolder,
      noFolder,
      tagsFolder,
      listTitleBase,
      isSafety
    } = config;

    items.forEach((item, index) => {
      const dataIndex = String(startIndex + index).padStart(2, '0');
      const label = formatIoPointLabel(item.type, item.description);
      tags.push(makeStringTag(`${discrFolder}\\Data_${dataIndex}`, label));
      tags.push(makeStringTag(`${noFolder}\\Data_${dataIndex}`, item.address));
      tags.push(makeDigitalTag(`${tagsFolder}\\Data_${dataIndex}`, label, item.plcTag));
    });

    const pageCount = Math.max(1, Math.ceil(items.length / 8));
    for (let page = 1; page <= pageCount; page += 1) {
      const pageStr = String(page).padStart(2, '0');
      const title = `${listTitleBase} ${pageStr}`;
      const globalListPage = Math.floor(startIndex / 8) + page;
      const listTagSuffix = String(globalListPage).padStart(2, '0');
      if (isSafety) {
        tags.push(makeStringTag(`${discrFolder}\\Safety_List_${pageStr}`, title));
        tags.push(makeStringTag(`${noFolder}\\Safety_List_${pageStr}`, title));
      } else {
        tags.push(makeStringTag(`${discrFolder}\\List_${listTagSuffix}`, title));
        tags.push(makeStringTag(`${noFolder}\\List_${listTagSuffix}`, title));
      }
    }

    return tags;
  }

  function buildParsedFromMasterSheets(sheets, options = {}) {
    const sheetList = Array.isArray(sheets) ? sheets : [];
    const zones = [];
    for (const sheet of sheetList) {
      const zone = cellStr(sheet.zone) || 'General';
      if (!zones.includes(zone)) {
        zones.push(zone);
      }
    }
    const zoneRioModules = options.zoneRioModules || buildZoneRioModuleMap(zones, {
      sheets: sheetList,
      entries: options.entries || []
    });
    applyRioModulesToSheets(sheetList, zoneRioModules, { preserveMatchedTags: true });

    const merged = {
      plcDi: [],
      safetyDi: [],
      plcDo: [],
      safetyDo: [],
      zones: []
    };
    const zoneOffsets = {};
    const tags = [];

    for (const sheet of sheetList) {
      const zone = cellStr(sheet.zone) || 'General';
      zoneOffsets[zone] = {
        plcDi: merged.plcDi.length,
        safetyDi: merged.safetyDi.length,
        plcDo: merged.plcDo.length,
        safetyDo: merged.safetyDo.length
      };

      if (!merged.zones.includes(zone)) {
        merged.zones.push(zone);
      }

      const safetyDi = (sheet.diInputs || []).filter((item) => item.isSafety);
      const plcDi = (sheet.diInputs || []).filter((item) => !item.isSafety);
      const safetyDo = (sheet.doOutputs || []).filter((item) => item.isSafety);
      const plcDo = (sheet.doOutputs || []).filter((item) => !item.isSafety);
      const inputListTitle = zone && zone !== 'General' ? `${zone} Input List` : 'PLC Input List';
      const outputListTitle = zone && zone !== 'General' ? `${zone} Output List` : 'PLC Output List';

      tags.push(...buildChannelTags(safetyDi, {
        discrFolder: 'Safety_DI_Discr',
        noFolder: 'Safety_DI_No',
        tagsFolder: 'Safety_DI_Tags',
        listTitleBase: 'Safety Input List',
        isSafety: true
      }, zoneOffsets[zone].safetyDi));
      tags.push(...buildChannelTags(plcDi, {
        discrFolder: 'PLC_DI_Discr',
        noFolder: 'PLC_DI_NO',
        tagsFolder: 'PLC_DI_Tags',
        listTitleBase: inputListTitle,
        isSafety: false
      }, zoneOffsets[zone].plcDi));
      tags.push(...buildChannelTags(safetyDo, {
        discrFolder: 'Safety_DO_Discr',
        noFolder: 'Safety_DO_No',
        tagsFolder: 'Safety_DO_Tags',
        listTitleBase: 'Safety Output List',
        isSafety: true
      }, zoneOffsets[zone].safetyDo));
      tags.push(...buildChannelTags(plcDo, {
        discrFolder: 'PLC_DO_Discr',
        noFolder: 'PLC_DO_No',
        tagsFolder: 'PLC_DO_Tags',
        listTitleBase: outputListTitle,
        isSafety: false
      }, zoneOffsets[zone].plcDo));

      merged.safetyDi.push(...safetyDi);
      merged.plcDi.push(...plcDi);
      merged.safetyDo.push(...safetyDo);
      merged.plcDo.push(...plcDo);
    }

    if (!tags.length) {
      throw new Error('No IO rows found in the Master Sheet IO List worksheet.');
    }

    return {
      folders: MASTER_SHEET_FOLDERS.map((tagName) => ({
        tagType: 'F',
        tagName,
        tagDescription: '',
        readOnly: 'F'
      })),
      tags,
      meta: {
        zones: merged.zones,
        zoneOffsets,
        zoneRioModules,
        counts: {
          sdi: merged.safetyDi.length,
          di: merged.plcDi.length,
          sdo: merged.safetyDo.length,
          do: merged.plcDo.length,
          safetyDi: merged.safetyDi.length,
          plcDi: merged.plcDi.length,
          safetyDo: merged.safetyDo.length,
          plcDo: merged.plcDo.length
        }
      }
    };
  }

  function getXlsxLib() {
    if (typeof XLSX !== 'undefined') {
      return XLSX;
    }
    const root = typeof globalThis !== 'undefined' ? globalThis : global;
    return root?.XLSX || null;
  }

  function parseMasterSheetWorkbook(workbook, options = {}) {
    const XLSX = getXlsxLib();
    if (!XLSX || !workbook) {
      throw new Error('Excel support is not loaded.');
    }

    const sheetPattern = options.sheetPattern || null;
    const requestedSheet = cellStr(options.sheetName);
    let sheetNames = (workbook.SheetNames || []).filter((name) => {
      if (sheetPattern) {
        return sheetPattern.test(name);
      }
      return isIoListSheetName(name);
    });
    if (requestedSheet) {
      sheetNames = sheetNames.filter((name) => cellStr(name) === requestedSheet);
      if (!sheetNames.length && workbook.Sheets?.[requestedSheet]) {
        sheetNames = [requestedSheet];
      }
    }

    if (!sheetNames.length) {
      throw new Error('No IO List sheet found. Name worksheets with "IO List" anywhere in the title (e.g. "Packing IO List", "Chopping IO List", "IO List").');
    }

    const sheets = sheetNames.map((name) => {
      const worksheet = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        raw: false
      });
      return parseMasterIoListSheetRows(name, rows);
    }).filter((sheet) => sheet.diInputs.length || sheet.doOutputs.length);

    if (!sheets.length) {
      throw new Error('IO List worksheets were found but none contained DI/DO rows. Check the Master Sheet layout (Sl No / Input Type header).');
    }

    const parsed = buildParsedFromMasterSheets(sheets);
    parsed.meta = {
      ...(parsed.meta || {}),
      sourceSheets: sheets
    };
    return parsed;
  }

  function rebuildParsedFromMasterSheets(sheets, options = {}) {
    const parsed = buildParsedFromMasterSheets(Array.isArray(sheets) ? sheets : [], options);
    ensureStandardFoldersAndIoListTag(parsed);
    parsed.meta = {
      ...(parsed.meta || {}),
      sourceSheets: sheets
    };
    return parsed;
  }

  function parseIoListSummaryText(text) {
    const rows = [];
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = String(line || '').trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      if (/^IO Type\tFolder\tTag Name/i.test(trimmed) || /^Folder\tTag Name\tDescription\tAddress$/i.test(trimmed)) {
        continue;
      }
      const cells = trimmed.includes('\t') ? trimmed.split('\t') : trimmed.split(',');
      if (cells.length < 3) {
        continue;
      }
      if (cells.length >= 5 && /^(SDI|SDO|DI|DO)$/i.test(cellStr(cells[0]))) {
        rows.push({
          ioType: cellStr(cells[0]).toUpperCase(),
          folder: cellStr(cells[1]),
          tagName: cellStr(cells[2]),
          description: cellStr(cells[3]),
          address: cellStr(cells[4])
        });
        continue;
      }
      rows.push({
        ioType: '',
        folder: cellStr(cells[0]),
        tagName: cellStr(cells[1]),
        description: cellStr(cells[2]),
        address: cellStr(cells[3])
      });
    }
    return rows;
  }

  function applyIoListSummaryEdits(parsed, rows) {
    const next = parsed && typeof parsed === 'object'
      ? parsed
      : { folders: [], tags: [], meta: {} };
    const tags = Array.isArray(next.tags) ? [...next.tags] : [];

    for (const row of rows || []) {
      const tagName = cellStr(row.tagName);
      if (!tagName) {
        continue;
      }
      const index = tags.findIndex((tag) => String(tag.tagName || '') === tagName);
      if (index < 0) {
        continue;
      }
      const description = cellStr(row.description);
      const address = cellStr(row.address);
      const tag = { ...tags[index] };
      if (description) {
        tag.tagDescription = description;
        if (tag.tagType === 'S') {
          tag.initialString = description;
        }
      }
      if (address && tag.tagType === 'D') {
        tag.address = address;
      }
      tags[index] = tag;
    }

    next.tags = tags;
    ensureStandardFoldersAndIoListTag(next);
    return next;
  }

  function parseMasterSheetXlsx(arrayBuffer, options = {}) {
    const XLSX = getXlsxLib();
    if (!XLSX) {
      throw new Error('Excel support is not loaded. Refresh the page and try again.');
    }

    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    return parseMasterSheetWorkbook(workbook, options);
  }

  function formatMasterSheetSummary(parsed, sourceName = '') {
    const counts = parsed?.meta?.counts || {};
    const zones = (parsed?.meta?.zones || []).join(', ') || 'IO List';
    const lines = [
      `# Master Sheet IO List${sourceName ? `: ${sourceName}` : ''}`,
      `# Zones: ${zones}`,
      `# SDI (Safety Digital Input): ${counts.sdi || counts.safetyDi || 0}`,
      `# DI (Digital Input): ${counts.di || counts.plcDi || 0}`,
      `# SDO (Safety Digital Output): ${counts.sdo || counts.safetyDo || 0}`,
      `# DO (Digital Output): ${counts.do || counts.plcDo || 0}`,
      '',
      'IO Type\tFolder\tTag Name\tDescription\tAddress'
    ];

    for (const tag of parsed?.tags || []) {
      if (tag.tagType !== 'S' && tag.tagType !== 'D') {
        continue;
      }
      if (!/\\Data_\d+$/i.test(String(tag.tagName || ''))) {
        continue;
      }
      const folder = String(tag.tagName || '').split('\\')[0];
      let ioType = '';
      if (/^Safety_DI_/i.test(folder)) {
        ioType = 'SDI';
      } else if (/^PLC_DI_/i.test(folder)) {
        ioType = 'DI';
      } else if (/^Safety_DO_/i.test(folder)) {
        ioType = 'SDO';
      } else if (/^PLC_DO_/i.test(folder)) {
        ioType = 'DO';
      }
      const address = tag.tagType === 'D' ? tag.address : '';
      lines.push(`${ioType}\t${folder}\t${tag.tagName}\t${tag.tagDescription || tag.initialString || ''}\t${address}`);
    }

    return lines.join('\n');
  }

  function convertIoListUploadToTagsCsv(text) {
    const source = String(text || '').replace(/^\uFEFF/, '');
    let parsed;
    if (/^;Tag Type/i.test(source.trim())) {
      parsed = parseIoListText(source);
    } else {
      parsed = parseSimpleIoListCsv(source);
    }

    if (!parsed.tags.length && !parsed.folders.length) {
      throw new Error('No IO list rows found. Use FactoryTalk tag rows or TagType,TagName,Description columns.');
    }

    ensureStandardFoldersAndIoListTag(parsed);

    return {
      parsed,
      csv: serializeFactoryTalkTagsCsv(parsed)
    };
  }

  function convertIoListUpload(input, options = {}) {
    if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
      const parsed = parseMasterSheetXlsx(input, options);
      ensureStandardFoldersAndIoListTag(parsed);
      return {
        parsed,
        csv: serializeFactoryTalkTagsCsv(parsed),
        summary: formatMasterSheetSummary(parsed, options.sourceName || '')
      };
    }

    const converted = convertIoListUploadToTagsCsv(input);
    return {
      ...converted,
      summary: String(input || '')
    };
  }

  function findTag(tags, tagName) {
    const key = String(tagName || '');
    const direct = tags.find((tag) => String(tag.tagName || '') === key);
    if (direct) {
      return direct;
    }

    const aliases = [
      key.replace(/PLC_DI_No\\/gi, 'PLC_DI_NO\\'),
      key.replace(/PLC_DI_NO\\/gi, 'PLC_DI_No\\'),
      key.replace(/PLC_DO_No\\/gi, 'PLC_DO_NO\\'),
      key.replace(/PLC_DO_NO\\/gi, 'PLC_DO_No\\')
    ].filter((alias, index, list) => alias !== key && list.indexOf(alias) === index);

    for (const alias of aliases) {
      const match = tags.find((tag) => String(tag.tagName || '') === alias);
      if (match) {
        return match;
      }
    }

    return null;
  }

  function buildIoListPreviewMap(parsed, options = {}) {
    const tags = Array.isArray(parsed?.tags) ? parsed.tags : [];
    const page = Math.max(1, Number(options.page) || 1);
    const zone = cellStr(options.zone);
    const zoneLocal = Boolean(options.zoneLocal || parsed?.meta?.exportZone);
    const zoneOffset = zoneLocal
      ? 0
      : (zone && parsed?.meta?.zoneOffsets?.[zone]
        ? parsed.meta.zoneOffsets[zone].plcDi
        : 0);
    const map = new Map();
    const pageSuffix = String(page).padStart(2, '0');
    const zoneListTitle = `${zone ? `${zone} Input List` : 'PLC Input List'} ${pageSuffix}`;
    const listTag = zoneLocal
      ? findTag(tags, `PLC_DI_Discr\\List_${pageSuffix}`)
      : tags.find((tag) => tag.tagType === 'S'
        && /\\List_\d+$/i.test(String(tag.tagName || ''))
        && String(tag.initialString || tag.tagDescription || '') === zoneListTitle);

    map.set(100, listTag?.tagDescription || listTag?.initialString || zoneListTitle);

    const base = zoneOffset + ((page - 1) * 8);
    for (let i = 0; i < 8; i += 1) {
      const dataIdx = String(base + i).padStart(2, '0');
      const discr = findTag(tags, `PLC_DI_Discr\\Data_${dataIdx}`);
      const number = findTag(tags, `PLC_DI_NO\\Data_${dataIdx}`);
      const digital = findTag(tags, `PLC_DI_Tags\\Data_${dataIdx}`);

      map.set(101 + i, discr?.tagDescription || discr?.initialString || '');
      map.set(201 + i, number?.tagDescription || number?.initialString || '');
      map.set(301 + i, digital?.address || digital?.tagDescription || digital?.initialDigital || '0');
    }

    return map;
  }

  function getZonePlcDoCount(parsed, zone) {
    if (parsed?.meta?.exportZone) {
      return Number(parsed?.meta?.counts?.plcDo) || 8;
    }

    const zones = parsed?.meta?.zones || [];
    const offsets = parsed?.meta?.zoneOffsets || {};
    const zoneIndex = zones.indexOf(zone);
    if (zoneIndex < 0) {
      return 8;
    }

    const start = Number(offsets[zone]?.plcDo) || 0;
    const nextZone = zones[zoneIndex + 1];
    const end = nextZone
      ? Number(offsets[nextZone]?.plcDo)
      : Number(parsed?.meta?.counts?.plcDo);
    if (!Number.isFinite(end) || end <= start) {
      return 8;
    }
    return end - start;
  }

  function buildIoDoListPreviewMap(parsed, options = {}) {
    const tags = Array.isArray(parsed?.tags) ? parsed.tags : [];
    const page = Math.max(1, Number(options.page) || 1);
    const zone = cellStr(options.zone);
    const zoneLocal = Boolean(options.zoneLocal || parsed?.meta?.exportZone);
    const zoneOffset = zoneLocal
      ? 0
      : (zone && parsed?.meta?.zoneOffsets?.[zone]
        ? parsed.meta.zoneOffsets[zone].plcDo
        : 0);
    const map = new Map();
    const pageSuffix = String(page).padStart(2, '0');
    const zoneListTitle = `${zone ? `${zone} Output List` : 'PLC Output List'} ${pageSuffix}`;
    const listTag = zoneLocal
      ? findTag(tags, `PLC_DO_Discr\\List_${pageSuffix}`)
      : tags.find((tag) => tag.tagType === 'S'
        && /\\List_\d+$/i.test(String(tag.tagName || ''))
        && String(tag.initialString || tag.tagDescription || tag.tagDescription || '') === zoneListTitle);

    map.set(100, listTag?.tagDescription || listTag?.initialString || zoneListTitle);

    const base = zoneOffset + ((page - 1) * 8);
    for (let i = 0; i < 8; i += 1) {
      const dataIdx = String(base + i).padStart(2, '0');
      const discr = findTag(tags, `PLC_DO_Discr\\Data_${dataIdx}`);
      const number = findTag(tags, `PLC_DO_No\\Data_${dataIdx}`);
      const digital = findTag(tags, `PLC_DO_Tags\\Data_${dataIdx}`);

      map.set(101 + i, discr?.tagDescription || discr?.initialString || '');
      map.set(201 + i, number?.tagDescription || number?.initialString || '');
      map.set(301 + i, digital?.address || digital?.tagDescription || digital?.initialDigital || '0');
    }

    return map;
  }

  function resolveParameterExpression(expression, previewMap) {
    const match = String(expression || '').match(/\{#\s*(\d+)\s*\}/i);
    if (!match || !previewMap) {
      return null;
    }
    const key = Number(match[1]);
    if (!Number.isFinite(key) || !previewMap.has(key)) {
      return null;
    }
    return previewMap.get(key);
  }

  const PARAMETER_FILE_HEADER_LINES = [
    '! Parameter files are used with graphic displays to specify the tags a display ',
    '! uses at run time. You assign parameter files in certain application components ',
    '! and object properties dialog boxes. Please see the Help for details.',
    '! Syntax:',
    '!     #replacement=tagname',
    '! Example:',
    '!     #23=A_COLOR',
    '! #23 in any expression in a graphic would be replaced by the tag  A_COLOR.',
    '!================================================'
  ];

  function buildParameterFileHeader() {
    const now = new Date();
    const date = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    return [
      `!============ Parameter File Created ${date} ============`,
      ...PARAMETER_FILE_HEADER_LINES,
      '',
      '',
      '',
      ''
    ].join('\n');
  }

  function resolveParameterPageCount(totalPoints, maxPages) {
    const pages = Math.max(1, Math.ceil(Math.max(Number(totalPoints) || 0, 1) / 8));
    if (!maxPages) {
      return pages;
    }
    return Math.min(pages, Math.max(1, Number(maxPages) || pages));
  }

  function normalizeParameterTagPath(value) {
    let raw = String(value || '').trim();
    if (!raw) {
      return '';
    }
    if (raw.startsWith('{') && raw.endsWith('}')) {
      raw = raw.slice(1, -1);
    }
    return raw.replace(/\//g, '\\');
  }

  function parseParameterFile(text) {
    const bindings = new Map();
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = String(line || '').trim();
      if (!trimmed || trimmed.startsWith('!')) {
        continue;
      }
      const match = trimmed.match(/^#(\d+)\s*=\s*(.+)$/i);
      if (!match) {
        continue;
      }
      const key = Number(match[1]);
      if (!Number.isFinite(key)) {
        continue;
      }
      bindings.set(key, normalizeParameterTagPath(match[2]));
    }
    return { bindings };
  }

  function serializeParameterFile(bindings, titleLine = '') {
    const rows = Array.from(bindings instanceof Map ? bindings.entries() : Object.entries(bindings || {}))
      .map(([key, value]) => [Number(key), normalizeParameterTagPath(value)])
      .filter(([key, value]) => Number.isFinite(key) && value)
      .sort((a, b) => a[0] - b[0]);

    const body = [];
    if (titleLine) {
      body.push(`! ${titleLine}`, '');
    }

    const listRow = rows.find(([key]) => key === 100);
    if (listRow) {
      body.push(`#100={${listRow[1]}}`, '');
    }

    const groups = [1, 2, 3];
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      const group = groups[groupIndex];
      const groupRows = rows.filter(([key]) => key > 100 && Math.floor(key / 100) === group);
      if (!groupRows.length) {
        continue;
      }

      for (const [key, value] of groupRows) {
        body.push(`#${key}={${value}}`);
      }

      const hasLaterGroup = groups.slice(groupIndex + 1).some((nextGroup) => (
        rows.some(([key]) => key > 100 && Math.floor(key / 100) === nextGroup)
      ));
      if (hasLaterGroup) {
        body.push('');
      }
    }

    return `${buildParameterFileHeader()}${body.join('\n')}\n`;
  }

  function getZoneSafetyDiCount(parsed, zone) {
    if (parsed?.meta?.exportZone) {
      return Number(parsed?.meta?.counts?.safetyDi) || 0;
    }

    const zones = parsed?.meta?.zones || [];
    const offsets = parsed?.meta?.zoneOffsets || {};
    const zoneIndex = zones.indexOf(zone);
    if (zoneIndex < 0) {
      return 0;
    }

    const start = Number(offsets[zone]?.safetyDi) || 0;
    const nextZone = zones[zoneIndex + 1];
    const end = nextZone
      ? Number(offsets[nextZone]?.safetyDi)
      : Number(parsed?.meta?.counts?.safetyDi);
    if (!Number.isFinite(end) || end <= start) {
      return 0;
    }
    return end - start;
  }

  function getZoneSafetyDoCount(parsed, zone) {
    if (parsed?.meta?.exportZone) {
      return Number(parsed?.meta?.counts?.safetyDo) || 0;
    }

    const zones = parsed?.meta?.zones || [];
    const offsets = parsed?.meta?.zoneOffsets || {};
    const zoneIndex = zones.indexOf(zone);
    if (zoneIndex < 0) {
      return 0;
    }

    const start = Number(offsets[zone]?.safetyDo) || 0;
    const nextZone = zones[zoneIndex + 1];
    const end = nextZone
      ? Number(offsets[nextZone]?.safetyDo)
      : Number(parsed?.meta?.counts?.safetyDo);
    if (!Number.isFinite(end) || end <= start) {
      return 0;
    }
    return end - start;
  }

  function getZonePlcDiCount(parsed, zone) {
    if (parsed?.meta?.exportZone) {
      return Number(parsed?.meta?.counts?.plcDi) || 8;
    }

    const zones = parsed?.meta?.zones || [];
    const offsets = parsed?.meta?.zoneOffsets || {};
    const zoneIndex = zones.indexOf(zone);
    if (zoneIndex < 0) {
      return 8;
    }

    const start = Number(offsets[zone]?.plcDi) || 0;
    const nextZone = zones[zoneIndex + 1];
    const end = nextZone
      ? Number(offsets[nextZone]?.plcDi)
      : Number(parsed?.meta?.counts?.plcDi);
    if (!Number.isFinite(end) || end <= start) {
      return 8;
    }
    return end - start;
  }

  function buildIoListParameterBindings(parsed, options = {}) {
    const tags = Array.isArray(parsed?.tags) ? parsed.tags : [];
    const page = Math.max(1, Number(options.page) || 1);
    const zone = cellStr(options.zone);
    const zoneLocal = Boolean(options.zoneLocal || parsed?.meta?.exportZone);
    const zoneOffset = zoneLocal
      ? 0
      : (zone && parsed?.meta?.zoneOffsets?.[zone]
        ? parsed.meta.zoneOffsets[zone].plcDi
        : 0);
    const bindings = new Map();
    const pageSuffix = String(page).padStart(2, '0');
    const zoneListTitle = `${zone ? `${zone} Input List` : 'PLC Input List'} ${pageSuffix}`;
    const listTag = zoneLocal
      ? findTag(tags, `PLC_DI_Discr\\List_${pageSuffix}`)
      : tags.find((tag) => tag.tagType === 'S'
        && /\\List_\d+$/i.test(String(tag.tagName || ''))
        && String(tag.initialString || tag.tagDescription || '') === zoneListTitle);

    bindings.set(100, listTag?.tagName || `PLC_DI_Discr\\List_${pageSuffix}`);

    const base = zoneOffset + ((page - 1) * 8);
    for (let i = 0; i < 8; i += 1) {
      const dataIdx = String(base + i).padStart(2, '0');
      bindings.set(101 + i, `PLC_DI_Discr\\Data_${dataIdx}`);
      bindings.set(201 + i, `PLC_DI_No\\Data_${dataIdx}`);
      bindings.set(301 + i, `PLC_DI_Tags\\Data_${dataIdx}`);
    }

    return bindings;
  }

  function buildDefaultParameterBindings(page = 1) {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSuffix = String(pageNum).padStart(2, '0');
    const bindings = new Map();
    bindings.set(100, `PLC_DI_Discr\\List_${pageSuffix}`);

    const base = (pageNum - 1) * 8;
    for (let i = 0; i < 8; i += 1) {
      const dataIdx = String(base + i).padStart(2, '0');
      bindings.set(101 + i, `PLC_DI_Discr\\Data_${dataIdx}`);
      bindings.set(201 + i, `PLC_DI_No\\Data_${dataIdx}`);
      bindings.set(301 + i, `PLC_DI_Tags\\Data_${dataIdx}`);
    }

    return bindings;
  }

  function buildDoParameterBindings(page = 1) {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSuffix = String(pageNum).padStart(2, '0');
    const bindings = new Map();
    bindings.set(100, `PLC_DO_Discr\\List_${pageSuffix}`);

    const base = (pageNum - 1) * 8;
    for (let i = 0; i < 8; i += 1) {
      const dataIdx = String(base + i).padStart(2, '0');
      bindings.set(101 + i, `PLC_DO_Discr\\Data_${dataIdx}`);
      bindings.set(201 + i, `PLC_DO_No\\Data_${dataIdx}`);
      bindings.set(301 + i, `PLC_DO_Tags\\Data_${dataIdx}`);
    }

    return bindings;
  }

  function buildDefaultParameterFile(options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const pageSuffix = String(page).padStart(2, '0');
    const bindings = options.bindings instanceof Map
      ? options.bindings
      : buildDefaultParameterBindings(page);
    return {
      name: `PLC DI List ${pageSuffix}.par`,
      content: serializeParameterFile(bindings),
      bindings
    };
  }

  function buildIoListParameterFile(parsed, options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const pageSuffix = String(page).padStart(2, '0');
    const bindings = buildIoListParameterBindings(parsed, options);
    return {
      name: `PLC DI List ${pageSuffix}.par`,
      content: serializeParameterFile(bindings),
      bindings
    };
  }

  function buildIoDoListParameterBindings(parsed, options = {}) {
    const tags = Array.isArray(parsed?.tags) ? parsed.tags : [];
    const page = Math.max(1, Number(options.page) || 1);
    const zone = cellStr(options.zone);
    const zoneLocal = Boolean(options.zoneLocal || parsed?.meta?.exportZone);
    const zoneOffset = zoneLocal
      ? 0
      : (zone && parsed?.meta?.zoneOffsets?.[zone]
        ? parsed.meta.zoneOffsets[zone].plcDo
        : 0);
    const bindings = new Map();
    const pageSuffix = String(page).padStart(2, '0');
    const zoneListTitle = `${zone ? `${zone} Output List` : 'PLC Output List'} ${pageSuffix}`;
    const listTag = zoneLocal
      ? findTag(tags, `PLC_DO_Discr\\List_${pageSuffix}`)
      : tags.find((tag) => tag.tagType === 'S'
        && /\\List_\d+$/i.test(String(tag.tagName || ''))
        && String(tag.initialString || tag.tagDescription || '') === zoneListTitle);

    bindings.set(100, listTag?.tagName || `PLC_DO_Discr\\List_${pageSuffix}`);

    const base = zoneOffset + ((page - 1) * 8);
    for (let i = 0; i < 8; i += 1) {
      const dataIdx = String(base + i).padStart(2, '0');
      bindings.set(101 + i, `PLC_DO_Discr\\Data_${dataIdx}`);
      bindings.set(201 + i, `PLC_DO_No\\Data_${dataIdx}`);
      bindings.set(301 + i, `PLC_DO_Tags\\Data_${dataIdx}`);
    }

    return bindings;
  }

  function buildIoDoListParameterFile(parsed, options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const pageSuffix = String(page).padStart(2, '0');
    const bindings = buildIoDoListParameterBindings(parsed, options);
    return {
      name: `PLC DO List ${pageSuffix}.par`,
      content: serializeParameterFile(bindings),
      bindings
    };
  }

  function buildSafetyDiListParameterBindings(parsed, options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const zone = cellStr(options.zone);
    const zoneLocal = Boolean(options.zoneLocal || parsed?.meta?.exportZone);
    const zoneOffset = zoneLocal
      ? 0
      : (zone && parsed?.meta?.zoneOffsets?.[zone]
        ? parsed.meta.zoneOffsets[zone].safetyDi
        : 0);
    const bindings = new Map();
    const pageSuffix = String(page).padStart(2, '0');
    bindings.set(100, `Safety_DI_Discr\\Safety_List_${pageSuffix}`);

    const base = zoneOffset + ((page - 1) * 8);
    for (let i = 0; i < 8; i += 1) {
      const dataIdx = String(base + i).padStart(2, '0');
      bindings.set(101 + i, `Safety_DI_Discr\\Data_${dataIdx}`);
      bindings.set(201 + i, `Safety_DI_No\\Data_${dataIdx}`);
      bindings.set(301 + i, `Safety_DI_Tags\\Data_${dataIdx}`);
    }

    return bindings;
  }

  function buildSafetyDoListParameterBindings(parsed, options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const zone = cellStr(options.zone);
    const zoneLocal = Boolean(options.zoneLocal || parsed?.meta?.exportZone);
    const zoneOffset = zoneLocal
      ? 0
      : (zone && parsed?.meta?.zoneOffsets?.[zone]
        ? parsed.meta.zoneOffsets[zone].safetyDo
        : 0);
    const bindings = new Map();
    const pageSuffix = String(page).padStart(2, '0');
    bindings.set(100, `Safety_DO_Discr\\Safety_List_${pageSuffix}`);

    const base = zoneOffset + ((page - 1) * 8);
    for (let i = 0; i < 8; i += 1) {
      const dataIdx = String(base + i).padStart(2, '0');
      bindings.set(101 + i, `Safety_DO_Discr\\Data_${dataIdx}`);
      bindings.set(201 + i, `Safety_DO_No\\Data_${dataIdx}`);
      bindings.set(301 + i, `Safety_DO_Tags\\Data_${dataIdx}`);
    }

    return bindings;
  }

  function buildSafetyDiListParameterFile(parsed, options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const pageSuffix = String(page).padStart(2, '0');
    const bindings = buildSafetyDiListParameterBindings(parsed, options);
    return {
      name: `Safety DI List ${pageSuffix}.par`,
      content: serializeParameterFile(bindings),
      bindings
    };
  }

  function buildSafetyDoListParameterFile(parsed, options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const pageSuffix = String(page).padStart(2, '0');
    const bindings = buildSafetyDoListParameterBindings(parsed, options);
    return {
      name: `Safety DO List ${pageSuffix}.par`,
      content: serializeParameterFile(bindings),
      bindings
    };
  }

  function buildSafetyDiListParameterFiles(parsed, options = {}) {
    const zone = cellStr(options.zone);
    const totalDi = zone
      ? getZoneSafetyDiCount(parsed, zone)
      : Number(parsed?.meta?.counts?.safetyDi) || 0;
    const pageCount = resolveParameterPageCount(totalDi, options.maxPages);
    const files = [];

    for (let page = 1; page <= pageCount; page += 1) {
      files.push(buildSafetyDiListParameterFile(parsed, { ...options, page }));
    }

    return files;
  }

  function buildSafetyDoListParameterFiles(parsed, options = {}) {
    const zone = cellStr(options.zone);
    const totalDo = zone
      ? getZoneSafetyDoCount(parsed, zone)
      : Number(parsed?.meta?.counts?.safetyDo) || 0;
    const pageCount = resolveParameterPageCount(totalDo, options.maxPages);
    const files = [];

    for (let page = 1; page <= pageCount; page += 1) {
      files.push(buildSafetyDoListParameterFile(parsed, { ...options, page }));
    }

    return files;
  }

  function buildIoListParameterFiles(parsed, options = {}) {
    const zone = cellStr(options.zone);
    const totalDi = zone
      ? getZonePlcDiCount(parsed, zone)
      : Number(parsed?.meta?.counts?.plcDi) || 0;
    const pageCount = resolveParameterPageCount(totalDi, options.maxPages);
    const files = [];

    for (let page = 1; page <= pageCount; page += 1) {
      files.push(buildIoListParameterFile(parsed, { ...options, page }));
    }

    return files;
  }

  function buildIoDoListParameterFiles(parsed, options = {}) {
    const zone = cellStr(options.zone);
    const totalDo = zone
      ? getZonePlcDoCount(parsed, zone)
      : Number(parsed?.meta?.counts?.plcDo) || 0;
    const pageCount = resolveParameterPageCount(totalDo, options.maxPages);
    const files = [];

    for (let page = 1; page <= pageCount; page += 1) {
      files.push(buildIoDoListParameterFile(parsed, { ...options, page }));
    }

    return files;
  }

  function buildAllIoListParameterFiles(parsed, options = {}) {
    return [
      ...buildIoListParameterFiles(parsed, options),
      ...buildIoDoListParameterFiles(parsed, options),
      ...buildSafetyDiListParameterFiles(parsed, options),
      ...buildSafetyDoListParameterFiles(parsed, options)
    ];
  }

  function resolveTagPreviewValue(tagsParsed, tagPath, options = {}) {
    const tags = Array.isArray(tagsParsed?.tags) ? tagsParsed.tags : [];
    const key = normalizeParameterTagPath(tagPath);
    if (!key) {
      return '';
    }

    const tag = findTag(tags, key);
    if (!tag) {
      return '';
    }

    if (tag.tagType === 'D') {
      if (options.showPlcAddress || isPlcIoTagsParameterPath(key)) {
        return tag.address || tag.tagDescription || tag.initialDigital || '0';
      }
      return tag.tagDescription || tag.initialString || tag.initialDigital || '0';
    }

    return tag.tagDescription || tag.initialString || '';
  }

  function buildPreviewMapFromParameterFile(parsed, parameterBindings, tagsParsed) {
    const map = new Map();
    const bindings = parameterBindings instanceof Map
      ? parameterBindings
      : parseParameterFile(String(parameterBindings || '')).bindings;

    for (const [key, tagPath] of bindings.entries()) {
      map.set(key, resolveTagPreviewValue(tagsParsed, tagPath) || '');
    }

    if (![...map.values()].some((value) => String(value || '').trim()) && parsed) {
      return buildIoListPreviewMap(parsed, {});
    }

    return map;
  }

  function isPlcIoTagsParameterPath(tagPath) {
    return /PLC_(DI|DO|SDI|SDO)_Tags\\/i.test(String(tagPath || ''))
      || /Safety_(DI|DO)_Tags\\/i.test(String(tagPath || ''));
  }

  function formatParameterPreviewNotes(bindings, tagsParsed) {
    const rows = Array.from(bindings instanceof Map ? bindings.entries() : [])
      .sort((a, b) => a[0] - b[0])
      .map(([key, tagPath]) => {
        const normalizedPath = normalizeParameterTagPath(tagPath);
        const showPlcAddress = isPlcIoTagsParameterPath(normalizedPath);
        return {
          slot: `#${key}`,
          tag: `{${normalizedPath}}`,
          value: resolveTagPreviewValue(tagsParsed, tagPath, { showPlcAddress }) || '—'
        };
      });
    return rows;
  }

  const RSLOGIX_HMI_SPECIFIER = /^RIO\d{2}_(DI|DO|SDI|SDO)\[\d+\]$/i;

  function parseRsLogixCsvLine(line) {
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const ch = line[index];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === ',' && !inQuotes) {
        cells.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    cells.push(current);
    return cells.map((cell) => cellStr(cell));
  }

  function normalizeDescriptionForMatch(value) {
    return cellStr(value)
      .toLowerCase()
      .replace(/\$n/gi, ' ')
      .replace(/&/g, ' and ')
      .replace(/[_\-/\\.,:;]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isPreferredHmiPlcSpecifier(specifier) {
    return RSLOGIX_HMI_SPECIFIER.test(cellStr(specifier));
  }

  function parseRsLogixDescription(rawDescription) {
    const text = cellStr(rawDescription);
    if (!text) {
      return null;
    }

    const label = parseIoCommentLabel(text);
    if (label) {
      return {
        ioKind: label.ioKind,
        ioNum: label.ioNum,
        description: label.description,
        normalizedDescription: normalizeDescriptionForMatch(label.description),
        normalizedFullLabel: normalizeDescriptionForMatch(text)
      };
    }

    const codeMatch = text.match(/^(SDI|SDO|DI|DO)(\d+)\b/i);
    return {
      ioKind: codeMatch ? codeMatch[1].toUpperCase() : '',
      ioNum: codeMatch ? Number.parseInt(codeMatch[2], 10) : null,
      description: text,
      normalizedDescription: normalizeDescriptionForMatch(text),
      normalizedFullLabel: normalizeDescriptionForMatch(text)
    };
  }

  function mergeRsLogixEntry(existing, incoming) {
    if (!existing) {
      return incoming;
    }
    if (incoming.preferred && !existing.preferred) {
      return incoming;
    }
    if (existing.preferred && !incoming.preferred) {
      return existing;
    }
    return existing;
  }

  function parseIoCommentLabel(value) {
    const match = cellStr(value).match(/^(SDI|SDO|DI|DO)(\d+)_(.+)$/i);
    if (!match) {
      return null;
    }

    return {
      ioKind: match[1].toUpperCase(),
      ioNum: Number.parseInt(match[2], 10),
      description: cellStr(match[3])
    };
  }

  function formatPlcTagAddress(specifier) {
    const address = cellStr(specifier);
    if (!address) {
      return '';
    }
    if (/^\[PLC\]/i.test(address)) {
      return address;
    }
    return `[PLC]${address}`;
  }

  function isRsLogixTagsCsv(text) {
    const sample = String(text || '').slice(0, 4000);
    return /RSLogix 5000/i.test(sample)
      && /TYPE,SCOPE,NAME,DESCRIPTION/i.test(sample);
  }

  function normalizeRsLogixRowType(value) {
    return cellStr(value).toUpperCase();
  }

  function isBlockedRsLogixRowType(rowType) {
    const type = normalizeRsLogixRowType(rowType);
    return type === 'ALIAS'
      || type === 'RCOMMENT'
      || type === 'REMARK';
  }

  function isIoLikeRsLogixDescription(rawDescription) {
    return /^(SDI|SDO|DI|DO)\d+_/i.test(cellStr(rawDescription));
  }

  function shouldParseRsLogixRow(cells, allowedTypes) {
    const rowType = normalizeRsLogixRowType(cells[0]);
    if (isBlockedRsLogixRowType(rowType) || !allowedTypes.has(rowType)) {
      return false;
    }

    const name = cellStr(cells[2]);
    const rawDescription = cellStr(cells[3]);
    const specifier = cellStr(cells[5]);
    const tagAddress = specifier || (isPreferredHmiPlcSpecifier(name) ? name : '');

    if (rowType === 'TAG') {
      const descriptionSource = rawDescription || name;
      return Boolean(tagAddress) && (
        isIoLikeRsLogixDescription(descriptionSource)
        || isIoLikeRsLogixDescription(rawDescription)
      );
    }

    if (rowType === 'COMMENT') {
      return isIoLikeRsLogixDescription(rawDescription) && Boolean(specifier);
    }

    return false;
  }

  function buildRsLogixIoEntry(cells, rowType) {
    const name = cellStr(cells[2]);
    const rawDescription = cellStr(cells[3]);
    const specifier = cellStr(cells[5]);
    const descriptionSource = rawDescription || name;
    const tagAddress = specifier || (isPreferredHmiPlcSpecifier(name) ? name : '');

    if (!descriptionSource || !tagAddress) {
      return null;
    }

    const parsedDescription = parseRsLogixDescription(descriptionSource);
    if (!parsedDescription?.ioKind || !Number.isFinite(parsedDescription.ioNum)) {
      return null;
    }

    return {
      rowType: normalizeRsLogixRowType(rowType),
      parentTag: name.toUpperCase(),
      ioKind: parsedDescription.ioKind,
      ioNum: parsedDescription.ioNum,
      description: parsedDescription.description,
      rawDescription: rawDescription || descriptionSource,
      normalizedDescription: parsedDescription.normalizedDescription,
      normalizedFullLabel: parsedDescription.normalizedFullLabel,
      specifier: tagAddress,
      preferred: isPreferredHmiPlcSpecifier(tagAddress),
      plcTag: formatPlcTagAddress(tagAddress),
      rioModule: parseRioModuleFromPlcTag(tagAddress)
        || parseRioModuleFromPlcTag(name)
    };
  }

  function rsLogixEntryDedupeKey(entry) {
    const rioModule = entry.rioModule
      || parseRioModuleFromPlcTag(entry.plcTag || entry.specifier)
      || parseRioModuleFromPlcTag(entry.parentTag)
      || 0;
    return `${rioModule}:${entry.ioKind}:${entry.ioNum}:${entry.normalizedDescription}`;
  }

  function collectRsLogixIoEntries(lines, allowedTypes) {
    const entryMap = new Map();

    for (const line of lines) {
      if (!line.trim() || line.startsWith('remark,') || line.startsWith('0.')) {
        continue;
      }

      const cells = parseRsLogixCsvLine(line);
      if (!shouldParseRsLogixRow(cells, allowedTypes)) {
        continue;
      }

      const entry = buildRsLogixIoEntry(cells, cells[0]);
      if (!entry) {
        continue;
      }

      const dedupeKey = rsLogixEntryDedupeKey(entry);
      entryMap.set(dedupeKey, mergeRsLogixEntry(entryMap.get(dedupeKey), entry));
    }

    return Array.from(entryMap.values());
  }

  function parseRsLogixTagsCsv(text) {
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
    const tagEntries = collectRsLogixIoEntries(lines, new Set(['TAG']));

    if (tagEntries.length) {
      return {
        entries: tagEntries,
        meta: { rowTypesUsed: ['TAG'], aliasRowsSkipped: true }
      };
    }

    // Standard RSLogix CSV exports IO descriptions on COMMENT rows attached to TAG arrays.
    const commentEntries = collectRsLogixIoEntries(lines, new Set(['COMMENT']));
    return {
      entries: commentEntries,
      meta: {
        rowTypesUsed: ['COMMENT'],
        aliasRowsSkipped: true,
        tagRowsEmpty: true
      }
    };
  }

  function buildPlcTagLookupIndex(entries) {
    const byRioKindNumDesc = new Map();
    const byRioKindDesc = new Map();
    const byRioKindFullLabel = new Map();
    const byRioKindNum = new Map();

    for (const entry of entries || []) {
      const rioModule = entry.rioModule
        || parseRioModuleFromPlcTag(entry.plcTag || entry.specifier)
        || parseRioModuleFromPlcTag(entry.parentTag);
      if (!rioModule || !entry.ioKind) {
        continue;
      }

      entry.rioModule = rioModule;

      if (Number.isFinite(entry.ioNum)) {
        const kindNumDescKey = `${rioModule}:${entry.ioKind}:${entry.ioNum}:${entry.normalizedDescription}`;
        byRioKindNumDesc.set(kindNumDescKey, mergeRsLogixEntry(byRioKindNumDesc.get(kindNumDescKey), entry));
      }

      const kindDescKey = `${rioModule}:${entry.ioKind}:${entry.normalizedDescription}`;
      const kindDescMatches = byRioKindDesc.get(kindDescKey) || [];
      kindDescMatches.push(entry);
      byRioKindDesc.set(kindDescKey, kindDescMatches);

      const kindFullLabelKey = `${rioModule}:${entry.ioKind}:${entry.normalizedFullLabel}`;
      const kindFullLabelMatches = byRioKindFullLabel.get(kindFullLabelKey) || [];
      kindFullLabelMatches.push(entry);
      byRioKindFullLabel.set(kindFullLabelKey, kindFullLabelMatches);

      if (Number.isFinite(entry.ioNum)) {
        const kindNumKey = `${rioModule}:${entry.ioKind}:${entry.ioNum}`;
        const kindNumMatches = byRioKindNum.get(kindNumKey) || [];
        kindNumMatches.push(entry);
        byRioKindNum.set(kindNumKey, kindNumMatches);
      }
    }

    return { byRioKindNumDesc, byRioKindDesc, byRioKindFullLabel, byRioKindNum, entries };
  }

  function entriesForRioModule(entries, rioModule) {
    if (!rioModule || !entries?.length) {
      return [];
    }
    return entries.filter((entry) => {
      const module = entry.rioModule
        || parseRioModuleFromPlcTag(entry.plcTag || entry.specifier)
        || parseRioModuleFromPlcTag(entry.parentTag);
      return module === rioModule;
    });
  }

  function pickPreferredPlcEntry(matches, rioModule) {
    const list = entriesForRioModule((matches || []).filter((entry) => entry?.plcTag), rioModule);
    if (!list.length) {
      return null;
    }
    const preferred = list.filter((entry) => entry.preferred);
    const pool = preferred.length ? preferred : list;
    return pool.length === 1 ? pool[0] : (preferred[0] || null);
  }

  function descriptionsRoughlyMatch(left, right) {
    const a = normalizeDescriptionForMatch(left);
    const b = normalizeDescriptionForMatch(right);
    if (!a || !b) {
      return false;
    }
    if (a === b) {
      return true;
    }
    return a.includes(b) || b.includes(a);
  }

  function resolveIoItemPlcTag(item, lookup, options = {}) {
    const parsed = parseIoPointType(item?.type);
    const rioModule = options.rioModule || item?.rioModule || null;
    if (!parsed?.ioKind || !lookup || !rioModule) {
      return {
        plcTag: inferPlcTag(item?.type, item?.plcTag, rioModule || 1),
        matched: false
      };
    }

    const ioNum = Number.parseInt(parsed.num, 10)
      || Number.parseInt(String(item?.type || '').match(/(\d+)/)?.[1] || '', 10);
    const normalizedDescription = normalizeDescriptionForMatch(item?.description);
    const normalizedFullLabel = normalizeDescriptionForMatch(formatIoPointLabel(item.type, item.description));

    if (Number.isFinite(ioNum)) {
      const exact = lookup.byRioKindNumDesc.get(`${rioModule}:${parsed.ioKind}:${ioNum}:${normalizedDescription}`);
      if (exact?.plcTag) {
        return { plcTag: exact.plcTag, matched: true };
      }
    }

    const kindDescMatches = lookup.byRioKindDesc.get(`${rioModule}:${parsed.ioKind}:${normalizedDescription}`) || [];
    const kindDescPick = pickPreferredPlcEntry(kindDescMatches, rioModule);
    if (kindDescPick?.plcTag) {
      return { plcTag: kindDescPick.plcTag, matched: true };
    }

    const kindFullLabelMatches = lookup.byRioKindFullLabel.get(`${rioModule}:${parsed.ioKind}:${normalizedFullLabel}`) || [];
    const kindFullLabelPick = pickPreferredPlcEntry(kindFullLabelMatches, rioModule);
    if (kindFullLabelPick?.plcTag) {
      return { plcTag: kindFullLabelPick.plcTag, matched: true };
    }

    if (Number.isFinite(ioNum)) {
      const kindNumMatches = (lookup.byRioKindNum.get(`${rioModule}:${parsed.ioKind}:${ioNum}`) || [])
        .filter((entry) => descriptionsRoughlyMatch(entry.description, item?.description)
          || descriptionsRoughlyMatch(entry.rawDescription, item?.description)
          || descriptionsRoughlyMatch(entry.normalizedFullLabel, normalizedFullLabel));
      const kindNumPick = pickPreferredPlcEntry(kindNumMatches, rioModule);
      if (kindNumPick?.plcTag) {
        return { plcTag: kindNumPick.plcTag, matched: true };
      }
    }

    const fuzzyKindDescMatches = kindDescMatches
      .filter((entry) => descriptionsRoughlyMatch(entry.description, item?.description));
    const fuzzyPick = pickPreferredPlcEntry(fuzzyKindDescMatches, rioModule);
    if (fuzzyPick?.plcTag) {
      return { plcTag: fuzzyPick.plcTag, matched: true };
    }

    return {
      plcTag: inferPlcTag(item?.type, item?.plcTag, rioModule),
      matched: false
    };
  }

  function applyPlcTagsToIoSheets(sheets, rsLogixText, options = {}) {
    const rsLogixParsed = parseRsLogixTagsCsv(rsLogixText);
    const lookup = buildPlcTagLookupIndex(rsLogixParsed.entries);
    const sheetList = Array.isArray(sheets) ? sheets : [];
    const zones = options.zones
      || sheetList.map((sheet) => cellStr(sheet.zone)).filter(Boolean);
    const zoneRioModules = buildZoneRioModuleMap(zones, {
      sheets: sheetList,
      entries: rsLogixParsed.entries,
      manualMap: options.manualZoneRioModules || options.zoneRioModules || {}
    });
    const stats = {
      total: 0,
      matched: 0,
      unmatched: 0,
      rslogixEntries: rsLogixParsed.entries.length,
      rslogixRowTypes: rsLogixParsed.meta?.rowTypesUsed || [],
      aliasRowsSkipped: Boolean(rsLogixParsed.meta?.aliasRowsSkipped),
      zoneRioModules
    };

    const nextSheets = sheetList.map((sheet) => {
      const zone = cellStr(sheet.zone) || 'General';
      const rioModule = zoneRioModules[zone] || sheet.rioModule || 1;
      const diInputs = (sheet?.diInputs || []).map((item) => {
        stats.total += 1;
        const resolved = resolveIoItemPlcTag(item, lookup, { rioModule });
        if (resolved.matched) {
          stats.matched += 1;
        } else {
          stats.unmatched += 1;
        }
        return { ...item, plcTag: resolved.plcTag, rioModule };
      });

      const doOutputs = (sheet?.doOutputs || []).map((item) => {
        stats.total += 1;
        const resolved = resolveIoItemPlcTag(item, lookup, { rioModule });
        if (resolved.matched) {
          stats.matched += 1;
        } else {
          stats.unmatched += 1;
        }
        return { ...item, plcTag: resolved.plcTag, rioModule };
      });

      return { ...sheet, rioModule, diInputs, doOutputs };
    });

    return { sheets: nextSheets, stats, lookup };
  }

  function applyPlcTagsToParsed(parsed, rsLogixText) {
    const sourceSheets = parsed?.meta?.sourceSheets || [];
    if (!sourceSheets.length || !cellStr(rsLogixText)) {
      return { parsed, stats: { total: 0, matched: 0, unmatched: 0, rslogixEntries: 0 } };
    }

    const { sheets, stats } = applyPlcTagsToIoSheets(sourceSheets, rsLogixText, {
      zones: parsed?.meta?.zones,
      manualZoneRioModules: parsed?.meta?.manualZoneRioModules || {}
    });
    const rebuilt = rebuildParsedFromMasterSheets(sheets, {
      zoneRioModules: stats.zoneRioModules
    });
    rebuilt.meta = {
      ...(parsed.meta || {}),
      ...(rebuilt.meta || {}),
      sourceSheets: sheets,
      plcTagMatch: stats,
      zoneRioModules: stats.zoneRioModules || rebuilt.meta?.zoneRioModules,
      manualZoneRioModules: parsed?.meta?.manualZoneRioModules || {}
    };
    return { parsed: rebuilt, stats };
  }

  global.IoTags = {
    IO_TYPE_LABELS,
    parseIoPointType,
    parseRioModuleFromPlcTag,
    formatRioModuleLabel,
    buildZoneRioModuleMap,
    inferZoneRioModulesFromPlcEntries,
    listRioModulesFromPlcEntries,
    buildZoneSetupRows,
    applyZoneSetupToSheets,
    buildParsedForZoneExport,
    buildZoneTagsCsv,
    validateFactoryTalkZoneTagsCsv,
    parseIoListText,
    parseSimpleIoListCsv,
    serializeFactoryTalkTagsCsv,
    convertIoListUploadToTagsCsv,
    convertIoListUpload,
    parseMasterSheetXlsx,
    rebuildParsedFromMasterSheets,
    parseIoListSummaryText,
    applyIoListSummaryEdits,
    formatMasterSheetSummary,
    buildIoListPreviewMap,
    buildIoDoListPreviewMap,
    resolveParameterExpression,
    parseParameterFile,
    serializeParameterFile,
    buildIoListParameterBindings,
    buildDefaultParameterBindings,
    buildDefaultParameterFile,
    buildIoListParameterFile,
    buildIoListParameterFiles,
    buildIoDoListParameterFile,
    buildIoDoListParameterFiles,
    buildAllIoListParameterFiles,
    buildSafetyDiListParameterFiles,
    buildSafetyDoListParameterFiles,
    resolveTagPreviewValue,
    buildPreviewMapFromParameterFile,
    formatParameterPreviewNotes,
    isRsLogixTagsCsv,
    parseRsLogixTagsCsv,
    applyPlcTagsToIoSheets,
    applyPlcTagsToParsed
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
