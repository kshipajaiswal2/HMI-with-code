/** Parameter file definitions and tag remapping for FactoryTalk-style display parameters. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.ParameterFiles = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function parameterFilesFactory() {
  const Builder = typeof require !== 'undefined'
    ? require('../shared/parameter-file-builder')
    : (typeof ParameterFileBuilder !== 'undefined' ? ParameterFileBuilder : null);
  const IoListTags = typeof require !== 'undefined'
    ? require('../shared/io-list-tags')
    : null;

  const DEFAULT_PARAMETER_FILES = Builder
    ? Builder.buildAllDefaultParameterFiles()
    : {};

  const LIST_RUNTIME_VALUES = IoListTags
    ? IoListTags.buildAllListRuntimeValues()
    : {};

  const PLACEHOLDER_RE = /^#\d+$/;
  const BASE_IO_NAMESPACE = 'PLC_IO';

  function mergeParameterFiles(projectFiles) {
    if (!Builder) {
      return projectFiles && typeof projectFiles === 'object'
        ? { ...DEFAULT_PARAMETER_FILES, ...projectFiles }
        : { ...DEFAULT_PARAMETER_FILES };
    }
    return Builder.mergeProjectParameterFiles(projectFiles);
  }

  function normalizeFtTag(tag) {
    if (Builder) return Builder.normalizeFtTag(tag);
    return String(tag || '').trim().replace(/\\/g, '.');
  }

  function resolveTag(baseTag, parameterFile, filesMap) {
    const tag = String(baseTag || '').trim();
    if (!tag || !parameterFile) return tag;
    const def = filesMap?.[parameterFile];
    if (!def) return tag;

    if (PLACEHOLDER_RE.test(tag) && def.replacements?.[tag]) {
      return normalizeFtTag(def.replacements[tag]);
    }

    const prefix = def.tagPrefix;
    if (prefix) {
      const basePrefix = `${BASE_IO_NAMESPACE}.`;
      if (tag.startsWith(basePrefix) && tag.includes('Out')) {
        return `${prefix}.${tag.slice(basePrefix.length)}`;
      }
    }

    return tag;
  }

  function remapTagFields(obj, parameterFile, filesMap) {
    if (!obj || typeof obj !== 'object') return;
    for (const key of ['tag', 'actTag', 'reqTag', 'enterTag', 'minimumTag', 'maximumTag', 'rampTag', 'limitTag', 'displayNameTag']) {
      if (obj[key]) obj[key] = resolveTag(obj[key], parameterFile, filesMap);
    }
    if (obj.coil?.tag) obj.coil.tag = resolveTag(obj.coil.tag, parameterFile, filesMap);
    if (Array.isArray(obj.rows)) {
      if (Array.isArray(obj.rows[0])) {
        obj.rows.forEach((row) => row.forEach((entry) => remapTagFields(entry, parameterFile, filesMap)));
      } else {
        obj.rows.forEach((row) => remapTagFields(row, parameterFile, filesMap));
      }
    }
    if (Array.isArray(obj.children)) {
      obj.children.forEach((child) => remapTagFields(child, parameterFile, filesMap));
    }
  }

  function applySubNavHighlight(comp, parameterFile) {
    if (comp.type !== 'GotoButton' || !comp.name?.startsWith('PlcIoSubNav_')) return;
    const pf = String(comp.parameterFile || '').trim();
    const active = pf && pf === parameterFile;
    comp.useBorderColor = true;
    comp.borderColor = active ? '#F99746' : 'silver';
  }

  function applyListRuntimeValues(parameterFile, setTagValue, filesMap) {
    if (!parameterFile || !setTagValue) return;
    const map = filesMap || {};
    const values = IoListTags
      ? IoListTags.buildAllListRuntimeValues(Object.keys(map).length ? map : null)[parameterFile]
      : LIST_RUNTIME_VALUES[parameterFile];
    if (!values) return;
    for (const [tagName, value] of Object.entries(values)) {
      setTagValue(tagName, value);
    }
  }

  function applyParameterFile(screen, parameterFile, filesMap, options = {}) {
    if (!screen || !parameterFile) return screen;
    const cloned = JSON.parse(JSON.stringify(screen));
    cloned.components = (cloned.components || []).map((comp) => {
      const next = { ...comp };
      remapTagFields(next, parameterFile, filesMap);
      applySubNavHighlight(next, parameterFile);
      return next;
    });
    cloned._parameterFile = parameterFile;
    if (options.setTagValue) applyListRuntimeValues(parameterFile, options.setTagValue, filesMap);
    return cloned;
  }

  function usesParameterFile(comp) {
    const pf = String(comp?.parameterFile || '').trim();
    if (!pf) return false;
    const pt = String(comp?.parameterType || '').trim().toLowerCase();
    return pt === 'file' || pt === 'parameterfile' || pt === 'parameter file' || Boolean(pf);
  }

  function formatParameterFileText(name, def) {
    if (Builder) return Builder.formatParameterFileText(name, def);
    const lines = [`! ${name}`, ''];
    for (const [key, tag] of Object.entries(def?.replacements || {})) {
      lines.push(`${key}={${String(tag).replace(/\./g, '\\')}}`);
    }
    return lines.join('\n');
  }

  return {
    DEFAULT_PARAMETER_FILES,
    BASE_IO_NAMESPACE,
    mergeParameterFiles,
    normalizeFtTag,
    resolveTag,
    remapTagFields,
    applyParameterFile,
    applyListRuntimeValues,
    usesParameterFile,
    formatParameterFileText
  };
});
