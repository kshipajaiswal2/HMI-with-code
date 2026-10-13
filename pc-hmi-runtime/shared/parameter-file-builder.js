/** Build FactoryTalk-style IO list parameter file definitions (#100–#308). */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.ParameterFileBuilder = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function parameterFileBuilderFactory() {
  const ROWS_PER_LIST = 8;

  const IO_LIST_KINDS = {
    do: {
      label: 'PLC DO',
      discrPrefix: 'PLC_DO_Discr',
      listName: (n) => `List_${String(n).padStart(2, '0')}`,
      noPrefix: 'PLC_DO_No',
      tagsPrefix: 'PLC_DO_Tags'
    },
    di: {
      label: 'PLC DI',
      discrPrefix: 'PLC_DI_Discr',
      listName: (n) => `List_${String(n).padStart(2, '0')}`,
      noPrefix: 'PLC_DI_No',
      tagsPrefix: 'PLC_DI_Tags'
    },
    safetyDi: {
      label: 'Safety DI',
      discrPrefix: 'Safety_DI_Discr',
      listName: (n) => `Safety_List_${String(n).padStart(2, '0')}`,
      noPrefix: 'Safety_DI_No',
      tagsPrefix: 'Safety_DI_Tags'
    },
    safetyDo: {
      label: 'Safety DO',
      discrPrefix: 'Safety_DO_Discr',
      listName: (n) => `Safety_List_${String(n).padStart(2, '0')}`,
      noPrefix: 'Safety_DO_No',
      tagsPrefix: 'Safety_DO_Tags'
    }
  };

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  /**
   * Folder/label names for an IO list kind. Projects with one zone use the plain names
   * (PLC_DI_Discr, "PLC DI List 01"); with several zones each zone gets its own prefixed set
   * (RIO01_PLC_DI_Discr, "RIO01 PLC DI List 01").
   */
  function kindConfig(kind, zone = '') {
    const base = IO_LIST_KINDS[kind];
    if (!base || !zone) return base;
    return {
      ...base,
      label: `${zone} ${base.label}`,
      discrPrefix: `${zone}_${base.discrPrefix}`,
      noPrefix: `${zone}_${base.noPrefix}`,
      tagsPrefix: `${zone}_${base.tagsPrefix}`
    };
  }

  function parameterFileName(kind, listNum, zone = '') {
    const cfg = kindConfig(kind, zone);
    return `${cfg.label} List ${pad2(listNum)}`;
  }

  /** List 1 → Data_00–07, List 2 → Data_08–15, List 3 → Data_16–23, … */
  function dataIndexForListRow(listNum, rowIndex) {
    const absolute = (Math.max(1, listNum) - 1) * ROWS_PER_LIST + rowIndex;
    return pad2(absolute);
  }

  function normalizeFtTag(tag) {
    return String(tag || '').trim().replace(/\\/g, '.');
  }

  function buildReplacements(kind, listNum, zone = '') {
    const cfg = kindConfig(kind, zone);
    if (!cfg) return {};
    const listName = cfg.listName(listNum);
    const replacements = {
      '#100': `${cfg.discrPrefix}.${listName}`
    };
    for (let i = 0; i < ROWS_PER_LIST; i++) {
      const dataIdx = dataIndexForListRow(listNum, i);
      const row = i + 1;
      replacements[`#${100 + row}`] = `${cfg.discrPrefix}.Data_${dataIdx}`;
      replacements[`#${200 + row}`] = `${cfg.noPrefix}.Data_${dataIdx}`;
      replacements[`#${300 + row}`] = `${cfg.tagsPrefix}.Data_${dataIdx}`;
    }
    return replacements;
  }

  function buildParameterFile(kind, listNum, zone = '') {
    const name = parameterFileName(kind, listNum, zone);
    const def = {
      description: `${kindConfig(kind, zone).label} list ${pad2(listNum)}`,
      kind,
      listNum,
      replacements: buildReplacements(kind, listNum, zone)
    };
    if (zone) def.zone = zone;
    return { [name]: def };
  }

  function listParameterFiles(parameterFiles, kind, zone = '') {
    return Object.entries(parameterFiles || {})
      .filter(([, def]) => def?.kind === kind && (def.zone || '') === zone)
      .map(([, def]) => def.listNum)
      .sort((a, b) => a - b);
  }

  function listZones(parameterFiles) {
    const zones = new Set(['']);
    for (const def of Object.values(parameterFiles || {})) {
      if (def?.kind && def.zone) zones.add(def.zone);
    }
    return [...zones];
  }

  function nextListNum(parameterFiles, kind, zone = '') {
    const nums = listParameterFiles(parameterFiles, kind, zone);
    if (!nums.length) return 1;
    return Math.max(...nums) + 1;
  }

  function maxListNum(parameterFiles, kind, zone = '') {
    const nums = listParameterFiles(parameterFiles, kind, zone);
    return nums.length ? Math.max(...nums) : 0;
  }

  function dataSlotCount(parameterFiles, kind, zone = '') {
    const max = maxListNum(parameterFiles, kind, zone);
    return max > 0 ? max * ROWS_PER_LIST : 0;
  }

  function addParameterFile(parameterFiles, kind) {
    const listNum = nextListNum(parameterFiles, kind);
    const next = { ...(parameterFiles || {}) };
    Object.assign(next, buildParameterFile(kind, listNum));
    return { files: next, name: parameterFileName(kind, listNum), listNum };
  }

  function removeParameterFile(parameterFiles, name) {
    const next = { ...(parameterFiles || {}) };
    delete next[name];
    return next;
  }

  function buildStarterParameterFiles() {
    const files = {};
    Object.assign(files, buildParameterFile('di', 1));
    Object.assign(files, buildParameterFile('do', 1));
    Object.assign(files, buildParameterFile('safetyDi', 1));
    Object.assign(files, buildParameterFile('safetyDo', 1));
    return files;
  }

  function buildAllDefaultParameterFiles() {
    const files = {};
    const defaults = { do: 6, di: 7, safetyDi: 7, safetyDo: 7 };
    for (const [kind, count] of Object.entries(defaults)) {
      for (let n = 1; n <= count; n++) {
        Object.assign(files, buildParameterFile(kind, n));
      }
    }
    return files;
  }

  function mergeProjectParameterFiles(projectFiles) {
    if (projectFiles && Object.keys(projectFiles).length) return { ...projectFiles };
    return buildStarterParameterFiles();
  }

  function formatParameterFileText(name, def) {
    const lines = [
      '!================================================',
      '! Parameter File',
      `! Name: ${name}`,
      '! Syntax: #replacement=tagname',
      `! List ${def?.listNum || '?'} — Data_${dataIndexForListRow(def?.listNum || 1, 0)}…Data_${dataIndexForListRow(def?.listNum || 1, 7)}`,
      '!================================================',
      ''
    ];
    const keys = Object.keys(def.replacements || {}).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    for (const key of keys) {
      const tag = String(def.replacements[key]).replace(/\./g, '\\');
      lines.push(`${key}={${tag}}`);
    }
    lines.push('');
    return lines.join('\n');
  }

  return {
    ROWS_PER_LIST,
    IO_LIST_KINDS,
    kindConfig,
    listZones,
    normalizeFtTag,
    dataIndexForListRow,
    parameterFileName,
    buildReplacements,
    buildParameterFile,
    listParameterFiles,
    nextListNum,
    maxListNum,
    dataSlotCount,
    addParameterFile,
    removeParameterFile,
    buildStarterParameterFiles,
    buildAllDefaultParameterFiles,
    mergeProjectParameterFiles,
    formatParameterFileText
  };
});
