/** Parameter file CRUD and project sync for IO list infrastructure. */
const fs = require('fs');
const path = require('path');
const Builder = require('../../shared/parameter-file-builder');
const IoListTags = require('../../shared/io-list-tags');

function mergeIoTags(existingTags, ioTags) {
  const existingByName = Object.fromEntries((existingTags || []).map((t) => [t.name, t]));
  const ioNames = new Set(ioTags.map((t) => t.name));
  const kept = (existingTags || []).filter((t) => !ioNames.has(t.name));
  const mergedIo = ioTags.map(({ fromPlc, ...tag }) => {
    const prev = existingByName[tag.name];
    // Values read from the PLC tag export replace whatever placeholder text was there before.
    if (!prev || fromPlc) return tag;
    return {
      ...tag,
      description: prev.description || tag.description,
      initialValue: prev.initialValue !== undefined && prev.initialValue !== '' ? prev.initialValue : tag.initialValue,
      connection: prev.connection || tag.connection
    };
  });
  return [...kept, ...mergedIo];
}

// projectDir is the project's own folder (projects/<id>, or %APPDATA%\Plant HMI\projects\<id> in
// the installed app); the program folder itself is read-only there.
function writeProjectParameterParFiles(projectDir, parameterFiles) {
  const parDir = path.join(projectDir, 'Parameters');
  fs.mkdirSync(parDir, { recursive: true });
  for (const [name, def] of Object.entries(parameterFiles || {})) {
    const safeName = name.replace(/[<>:"/\\|?*]/g, '_');
    fs.writeFileSync(path.join(parDir, `${safeName}.par`), Builder.formatParameterFileText(name, def));
  }
}

function syncParameterInfrastructure(projectConfig, options = {}) {
  const parameterFiles = Builder.mergeProjectParameterFiles(projectConfig.parameterFiles);
  const ioTags = IoListTags.buildAllIoListTagDefs(projectConfig.tags, parameterFiles);
  const tags = mergeIoTags(projectConfig.tags, ioTags);
  const listValues = IoListTags.buildAllListRuntimeValues(parameterFiles, projectConfig.tags);
  return {
    parameterFiles,
    tags,
    listValues,
    writeParFiles: options.writeParFiles !== false
  };
}

/**
 * Build the IO lists from uploaded PLC tags: classify their IO points (SDI/DI/SDO/DO, per zone),
 * add the parameter files needed to hold them, and fill the list tags with their descriptions
 * and PLC connections. Existing parameter files are kept.
 */
function syncIoListsFromPlcTags(projectConfig) {
  const current = Builder.mergeProjectParameterFiles(projectConfig.parameterFiles);
  const { parameterFiles, summary } = IoListTags.planIoListsFromPlcTags(projectConfig.tags, current);
  const synced = syncParameterInfrastructure({ ...projectConfig, parameterFiles });
  return { ...synced, summary };
}

function addProjectParameterFile(projectConfig, kind) {
  const current = Builder.mergeProjectParameterFiles(projectConfig.parameterFiles);
  const { files, name, listNum } = Builder.addParameterFile(current, kind);
  const synced = syncParameterInfrastructure({ ...projectConfig, parameterFiles: files });
  return { ...synced, addedName: name, listNum };
}

function removeProjectParameterFile(projectConfig, name) {
  const current = Builder.mergeProjectParameterFiles(projectConfig.parameterFiles);
  if (!current[name]) return null;
  const files = Builder.removeParameterFile(current, name);
  const synced = syncParameterInfrastructure({ ...projectConfig, parameterFiles: files });
  return { ...synced, removedName: name };
}

module.exports = {
  mergeIoTags,
  writeProjectParameterParFiles,
  syncParameterInfrastructure,
  syncIoListsFromPlcTags,
  addProjectParameterFile,
  removeProjectParameterFile
};
