/** Parameter file CRUD and project sync for IO list infrastructure. */
const fs = require('fs');
const path = require('path');
const Builder = require('../../shared/parameter-file-builder');
const IoListTags = require('../../shared/io-list-tags');

function mergeIoTags(existingTags, ioTags) {
  const existingByName = Object.fromEntries((existingTags || []).map((t) => [t.name, t]));
  const ioNames = new Set(ioTags.map((t) => t.name));
  const kept = (existingTags || []).filter((t) => !ioNames.has(t.name));
  const mergedIo = ioTags.map((tag) => {
    const prev = existingByName[tag.name];
    if (!prev) return tag;
    return {
      ...tag,
      description: prev.description || tag.description,
      initialValue: prev.initialValue !== undefined && prev.initialValue !== '' ? prev.initialValue : tag.initialValue,
      connection: prev.connection || tag.connection
    };
  });
  return [...kept, ...mergedIo];
}

function writeProjectParameterParFiles(projectRoot, projectId, parameterFiles) {
  const parDir = path.join(projectRoot, 'projects', projectId, 'Parameters');
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
  addProjectParameterFile,
  removeProjectParameterFile
};
