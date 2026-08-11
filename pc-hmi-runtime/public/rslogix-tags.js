/**
 * RSLogix 5000 / Studio 5000 tag CSV → Plant HMI tag definitions.
 * Adapted from web-hmi-bridge/public/io-tags.js (parseRsLogixCsvLine, isRsLogixTagsCsv).
 */
(function initRsLogixTags(global) {
  function cellStr(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

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

  function isRsLogixTagsCsv(text) {
    const sample = String(text || '').slice(0, 4000);
    return /RSLogix 5000/i.test(sample)
      && /TYPE,SCOPE,NAME,DESCRIPTION/i.test(sample);
  }

  function mapRsLogixDatatype(raw) {
    const dt = cellStr(raw).toUpperCase();
    if (!dt) return null;
    const base = dt.replace(/\[.*\]/, '').trim();
    if (base === 'BOOL') return 'bool';
    if (['DINT', 'SINT', 'INT', 'UINT', 'UDINT', 'LINT', 'USINT'].includes(base)) return 'int';
    if (base === 'REAL' || base === 'FLOAT') return 'float';
    if (base.startsWith('STRING')) return 'string';
    if (dt.startsWith('AB:')) return null;
    return null;
  }

  function buildTagName(scope, name) {
    const tagName = cellStr(name);
    if (!tagName) return '';
    const program = cellStr(scope);
    return program ? `${program}:${tagName}` : tagName;
  }

  function isBlockedRowType(rowType) {
    const type = cellStr(rowType).toUpperCase();
    return type === 'ALIAS' || type === 'RCOMMENT' || type === 'REMARK';
  }

  function isBitSpecifier(specifier) {
    return /\.(\d+)$/.test(cellStr(specifier));
  }

  function normalizeDescription(raw) {
    return cellStr(raw).replace(/\$N/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * @param {string} text - RSLogix CSV export text
   * @param {{ controllerOnly?: boolean, skipProgramTags?: boolean, boolOnly?: boolean, includeIoComments?: boolean }} [options]
   * @returns {{ tags: Array<{name:string,type:string,description:string}>, stats: object }}
   */
  function parseRsLogixTagsForImport(text, options = {}) {
    const controllerOnly = options.controllerOnly !== false;
    const skipProgramTags = Boolean(options.skipProgramTags);
    const boolOnly = Boolean(options.boolOnly);
    const includeIoComments = options.includeIoComments !== false;
    const skipProgram = controllerOnly || skipProgramTags;

    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
    const tags = [];
    const seen = new Set();
    const stats = {
      total: 0,
      controller: 0,
      program: 0,
      skippedAlias: 0,
      skippedProgram: 0,
      skippedDatatype: 0,
      skippedBoolFilter: 0,
      ioComments: 0
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('0.') || trimmed.startsWith('remark,')) continue;

      const cells = parseRsLogixCsvLine(line);
      const rowType = cellStr(cells[0]).toUpperCase();
      if (!rowType || rowType === 'TYPE') continue;

      if (isBlockedRowType(rowType)) {
        stats.skippedAlias += 1;
        continue;
      }

      const scope = cells[1];
      const name = cells[2];
      const description = normalizeDescription(cells[3]);
      const datatype = cells[4];
      const specifier = cells[5];

      if (skipProgram && cellStr(scope)) {
        stats.skippedProgram += 1;
        continue;
      }

      if (rowType === 'TAG') {
        const hmiType = mapRsLogixDatatype(datatype);
        if (!hmiType) {
          stats.skippedDatatype += 1;
          continue;
        }
        if (boolOnly && hmiType !== 'bool') {
          stats.skippedBoolFilter += 1;
          continue;
        }

        const tagName = buildTagName(scope, name);
        if (!tagName || seen.has(tagName)) continue;
        seen.add(tagName);
        tags.push({
          name: tagName,
          type: hmiType,
          description: description || tagName
        });
        if (cellStr(scope)) stats.program += 1;
        else stats.controller += 1;
        continue;
      }

      if (rowType === 'COMMENT' && includeIoComments && isBitSpecifier(specifier)) {
        const tagName = cellStr(specifier);
        if (!tagName || seen.has(tagName)) continue;
        if (boolOnly || !boolOnly) {
          seen.add(tagName);
          tags.push({
            name: tagName,
            type: 'bool',
            description: description || tagName
          });
          stats.ioComments += 1;
          stats.controller += 1;
        }
      }
    }

    stats.total = tags.length;
    return { tags, stats };
  }

  /**
   * Parse a simple HMI tag CSV (Tag Name, Type, Description).
   */
  function parseSimpleTagCsv(text) {
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
    if (!lines.length) return { tags: [], stats: { total: 0 } };

    const header = parseRsLogixCsvLine(lines[0]).map((c) => c.toLowerCase());
    const nameIdx = header.findIndex((h) => h.includes('tag name') || h === 'name');
    const typeIdx = header.findIndex((h) => h === 'type');
    const descIdx = header.findIndex((h) => h.includes('description'));
    if (nameIdx < 0 || typeIdx < 0) return { tags: [], stats: { total: 0 } };

    const tags = [];
    const seen = new Set();
    for (const line of lines.slice(1)) {
      const cells = parseRsLogixCsvLine(line);
      const name = cellStr(cells[nameIdx]);
      const type = cellStr(cells[typeIdx]).toLowerCase();
      if (!name || !type || seen.has(name)) continue;
      seen.add(name);
      tags.push({
        name,
        type,
        description: descIdx >= 0 ? cellStr(cells[descIdx]) : name
      });
    }
    return { tags, stats: { total: tags.length } };
  }

  /**
   * Detect format and parse tag file content.
   */
  function parseTagImportFile(text, filename = '', options = {}) {
    const ext = String(filename || '').toLowerCase();
    const trimmed = String(text || '').trim();

    if (ext.endsWith('.json') || trimmed.startsWith('[') || trimmed.startsWith('{')) {
      let parsed;
      try {
        parsed = JSON.parse(trimmed);
      } catch (err) {
        throw new Error(`Invalid JSON: ${err.message}`);
      }
      const arr = Array.isArray(parsed) ? parsed : (parsed.tags || []);
      if (!Array.isArray(arr)) throw new Error('Expected a JSON array of tag definitions.');
      const tags = arr.filter((t) => t?.name).map((t) => ({
        name: String(t.name),
        type: String(t.type || 'bool').toLowerCase(),
        description: String(t.description || t.name)
      }));
      return { tags, format: 'json', stats: { total: tags.length } };
    }

    if (isRsLogixTagsCsv(text)) {
      const result = parseRsLogixTagsForImport(text, options);
      return { ...result, format: 'rslogix' };
    }

    const simple = parseSimpleTagCsv(text);
    if (simple.tags.length) {
      return { ...simple, format: 'simple-csv' };
    }

    throw new Error(
      'Unrecognized tag file. Use RSLogix 5000 CSV (Studio 5000 export), HMI JSON array, or Tag Name/Type/Description CSV.'
    );
  }

  function applyTagImportFilters(tags, options = {}) {
    const controllerOnly = options.controllerOnly !== false;
    const skipProgramTags = Boolean(options.skipProgramTags);
    const boolOnly = Boolean(options.boolOnly);
    const skipProgram = controllerOnly || skipProgramTags;

    return tags.filter((tag) => {
      const name = cellStr(tag.name);
      if (skipProgram && name.includes(':') && !/^[A-Z]+\d+_/.test(name)) {
        // Program-scoped tags use Program:Tag; IO tags like RIO03_Z3:3:I.0 also contain ':' — keep those.
        const isIoBit = /\.(\d+)$/.test(name) || /^RIO\d+/i.test(name);
        if (!isIoBit && /^[^:]+:[^:]+$/.test(name) && !name.includes('.')) {
          return false;
        }
      }
      if (boolOnly && tag.type !== 'bool') return false;
      return true;
    });
  }

  global.RsLogixTags = {
    isRsLogixTagsCsv,
    mapRsLogixDatatype,
    parseRsLogixTagsForImport,
    parseSimpleTagCsv,
    parseTagImportFile,
    applyTagImportFilters
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
