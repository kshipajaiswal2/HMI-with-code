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

  function quoteCell(value) {
    const text = String(value ?? '');
    if (!text) {
      return '""';
    }
    return `"${text.replace(/"/g, '""')}"`;
  }

  function serializeTagRow(record) {
    const cells = padCells([
      record.tagType,
      record.tagName,
      record.tagDescription,
      record.readOnly || 'F',
      record.dataSource || (record.tagType === 'D' ? 'D' : 'M'),
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
      record.retentive || '0',
      record.address,
      record.systemSourceName,
      record.systemSourceIndex,
      record.rioAddress,
      record.elementSizeBlock,
      record.numberElementsBlock,
      record.initialBlock
    ]);

    return cells.map((cell) => quoteCell(cell)).join(',');
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
      lines.push(serializeTagRow(folder));
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

  function formatIoPointLabel(type, description) {
    const ioType = cellStr(type);
    const desc = cellStr(description);
    return desc ? `${ioType} ${desc}` : ioType;
  }

  function inferPlcTag(ioType, existingTag) {
    const tag = cellStr(existingTag);
    if (tag) {
      return tag;
    }

    const match = cellStr(ioType).match(/^(SDI|DI|SDO|DO)(\d+)/i);
    if (!match) {
      return '';
    }

    const kind = match[1].toUpperCase();
    const num = match[2].padStart(2, '0');
    if (kind === 'SDI') {
      return `[PLC]RIO01_SDI[${num}]`;
    }
    if (kind === 'DI') {
      return `[PLC]RIO01_DI[${num}]`;
    }
    if (kind === 'SDO') {
      return `[PLC]RIO01_SDO[${num}]`;
    }
    if (kind === 'DO') {
      return `[PLC]RIO01_DO[${num}]`;
    }
    return '';
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

  function parseMasterIoListSheetRows(sheetName, rows) {
    const zone = cellStr(sheetName).replace(/\s*IO\s*List\s*$/i, '').trim();
    const parsed = {
      zone,
      diInputs: [],
      doOutputs: []
    };

    let headerFound = false;
    for (const rawRow of rows || []) {
      const cells = (Array.isArray(rawRow) ? rawRow : []).map(cellStr);
      if (!headerFound) {
        if (cells[0] === 'Sl No' && cells[1] === 'Input Type') {
          headerFound = true;
        }
        continue;
      }

      if (cells[5] === 'DIGITAL INPUT' || cells[13] === 'DIGITAL OUTPUT') {
        continue;
      }

      const inputType = cells[1];
      if (/^SDI\d+/i.test(inputType) || /^DI\d+/i.test(inputType)) {
        parsed.diInputs.push({
          type: inputType.toUpperCase(),
          isSafety: /^SDI/i.test(inputType),
          address: cells[3],
          description: cells[5],
          plcTag: inferPlcTag(inputType, cells[8])
        });
      }

      const outputType = cells[10];
      if (/^SDO\d+/i.test(outputType) || /^DO\d+/i.test(outputType)) {
        parsed.doOutputs.push({
          type: outputType.toUpperCase(),
          isSafety: /^SDO/i.test(outputType),
          address: cells[12],
          description: cells[13],
          plcTag: inferPlcTag(outputType, cells[16])
        });
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

  function buildParsedFromMasterSheets(sheets) {
    const merged = {
      plcDi: [],
      safetyDi: [],
      plcDo: [],
      safetyDo: [],
      zones: []
    };
    const zoneOffsets = {};
    const tags = [];

    for (const sheet of sheets || []) {
      const zone = sheet.zone || 'IO';
      zoneOffsets[zone] = {
        plcDi: merged.plcDi.length,
        safetyDi: merged.safetyDi.length,
        plcDo: merged.plcDo.length,
        safetyDo: merged.safetyDo.length
      };

      if (zone && !merged.zones.includes(zone)) {
        merged.zones.push(zone);
      }

      const safetyDi = (sheet.diInputs || []).filter((item) => item.isSafety);
      const plcDi = (sheet.diInputs || []).filter((item) => !item.isSafety);
      const safetyDo = (sheet.doOutputs || []).filter((item) => item.isSafety);
      const plcDo = (sheet.doOutputs || []).filter((item) => !item.isSafety);
      const inputListTitle = zone ? `${zone} Input List` : 'PLC Input List';
      const outputListTitle = zone ? `${zone} Output List` : 'PLC Output List';

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
        counts: {
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

    const sheetPattern = options.sheetPattern || / IO List$/i;
    const requestedSheet = cellStr(options.sheetName);
    let sheetNames = (workbook.SheetNames || []).filter((name) => sheetPattern.test(name));
    if (requestedSheet) {
      sheetNames = sheetNames.filter((name) => cellStr(name) === requestedSheet);
      if (!sheetNames.length && workbook.Sheets?.[requestedSheet]) {
        sheetNames = [requestedSheet];
      }
    }

    if (!sheetNames.length) {
      throw new Error('No IO List sheet found. Expected a worksheet named like "Packing IO List".');
    }

    const sheets = sheetNames.map((name) => {
      const worksheet = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        raw: false
      });
      return parseMasterIoListSheetRows(name, rows);
    });

    const parsed = buildParsedFromMasterSheets(sheets);
    parsed.meta = {
      ...(parsed.meta || {}),
      sourceSheets: sheets
    };
    return parsed;
  }

  function rebuildParsedFromMasterSheets(sheets) {
    const parsed = buildParsedFromMasterSheets(Array.isArray(sheets) ? sheets : []);
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
      if (!trimmed || trimmed.startsWith('#') || /^Folder\tTag Name\tDescription\tAddress$/i.test(trimmed)) {
        continue;
      }
      const cells = trimmed.includes('\t') ? trimmed.split('\t') : trimmed.split(',');
      if (cells.length < 3) {
        continue;
      }
      rows.push({
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
      `# Safety DI: ${counts.safetyDi || 0}, PLC DI: ${counts.plcDi || 0}, Safety DO: ${counts.safetyDo || 0}, PLC DO: ${counts.plcDo || 0}`,
      '',
      'Folder\tTag Name\tDescription\tAddress'
    ];

    for (const tag of parsed?.tags || []) {
      if (tag.tagType !== 'S' && tag.tagType !== 'D') {
        continue;
      }
      if (!/\\Data_\d+$/i.test(String(tag.tagName || ''))) {
        continue;
      }
      const folder = String(tag.tagName || '').split('\\')[0];
      const address = tag.tagType === 'D' ? tag.address : '';
      lines.push(`${folder}\t${tag.tagName}\t${tag.tagDescription || tag.initialString || ''}\t${address}`);
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
    const zoneOffset = zone && parsed?.meta?.zoneOffsets?.[zone]
      ? parsed.meta.zoneOffsets[zone].plcDi
      : 0;
    const map = new Map();
    const pageSuffix = String(page).padStart(2, '0');
    const zoneListTitle = `${zone ? `${zone} Input List` : 'PLC Input List'} ${pageSuffix}`;
    const listTag = tags.find((tag) => tag.tagType === 'S'
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
      map.set(301 + i, digital?.initialDigital || '0');
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

  const PARAMETER_FILE_HEADER = [
    '!============ Parameter File Created 2025/12/16 ============',
    '! Parameter files are used with graphic displays to specify the tags a display ',
    '! uses at run time. You assign parameter files in certain application components ',
    '! and object properties dialog boxes. Please see the Help for details.',
    '! Syntax:',
    '!     #replacement=tagname',
    '! Example:',
    '!     #23=A_COLOR',
    '! #23 in any expression in a graphic would be replaced by the tag  A_COLOR.',
    '!================================================',
    '',
    ''
  ].join('\n');

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

    return `${PARAMETER_FILE_HEADER}${body.join('\n')}\n`;
  }

  function getZonePlcDiCount(parsed, zone) {
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
    const bindings = buildDefaultParameterBindings(page);
    const pageSuffix = String(page).padStart(2, '0');
    const listTag = findTag(tags, `PLC_DI_Discr\\List_${pageSuffix}`);

    if (listTag?.tagName) {
      bindings.set(100, listTag.tagName);
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
    const bindings = buildIoListParameterBindings(parsed, options);
    return buildDefaultParameterFile({ page, bindings });
  }

  function buildIoListParameterFiles(parsed, options = {}) {
    const totalDi = Number(parsed?.meta?.counts?.plcDi) || 0;
    const pageCount = Math.max(1, Math.ceil(totalDi / 8));
    const maxPages = Math.max(1, Number(options.maxPages) || pageCount);
    const files = [];

    for (let page = 1; page <= Math.min(pageCount, maxPages, 6); page += 1) {
      files.push(buildIoListParameterFile(parsed, { page }));
    }

    return files;
  }

  function resolveTagPreviewValue(tagsParsed, tagPath) {
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

  function formatParameterPreviewNotes(bindings, tagsParsed) {
    const rows = Array.from(bindings instanceof Map ? bindings.entries() : [])
      .sort((a, b) => a[0] - b[0])
      .map(([key, tagPath]) => ({
        slot: `#${key}`,
        tag: `{${normalizeParameterTagPath(tagPath)}}`,
        value: resolveTagPreviewValue(tagsParsed, tagPath) || '—'
      }));
    return rows;
  }

  global.IoTags = {
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
    resolveParameterExpression,
    parseParameterFile,
    serializeParameterFile,
    buildIoListParameterBindings,
    buildDefaultParameterBindings,
    buildDefaultParameterFile,
    buildIoListParameterFile,
    buildIoListParameterFiles,
    resolveTagPreviewValue,
    buildPreviewMapFromParameterFile,
    formatParameterPreviewNotes
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
