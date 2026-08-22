/** Merge IO list HMI tags and parameter files into project.json. */
const fs = require('fs');
const path = require('path');
const Builder = require('../shared/parameter-file-builder');
const ParameterFileService = require('../server/services/parameter-file-service');

const PROJECTS = ['_template', 'a'];

function tagsToCsv(tags) {
  const lines = ['Tag Name,Type,Description,PLC Address'];
  for (const tag of tags) {
    const name = `"${String(tag.name).replace(/"/g, '""')}"`;
    const type = `"${tag.type || 'string'}"`;
    const desc = `"${String(tag.description || '').replace(/"/g, '""')}"`;
    const addr = `"${String(tag.plcAddress || tag.connection || '').replace(/"/g, '""')}"`;
    lines.push(`${name},${type},${desc},${addr}`);
  }
  return `${lines.join('\n')}\n`;
}

const root = path.join(__dirname, '..');

for (const projectId of PROJECTS) {
  const projectPath = path.join(root, 'projects', projectId, 'project.json');
  if (!fs.existsSync(projectPath)) continue;
  const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
  if (!project.parameterFiles || !Object.keys(project.parameterFiles).length) {
    project.parameterFiles = Builder.buildAllDefaultParameterFiles();
  } else {
    project.parameterFiles = Object.fromEntries(
      Object.entries(project.parameterFiles).map(([name, def]) => {
        if (def?.kind && def?.listNum) {
          return [name, { ...def, replacements: Builder.buildReplacements(def.kind, def.listNum) }];
        }
        return [name, def];
      })
    );
  }
  const synced = ParameterFileService.syncParameterInfrastructure(project);
  project.parameterFiles = synced.parameterFiles;
  project.tags = synced.tags;
  fs.writeFileSync(projectPath, `${JSON.stringify(project, null, 2)}\n`);
  ParameterFileService.writeProjectParameterParFiles(root, projectId, synced.parameterFiles);

  const tagDir = path.join(root, 'projects', projectId, 'Tag');
  fs.mkdirSync(tagDir, { recursive: true });
  const csvName = projectId === '_template' ? '_template-Tags.CSV' : `${projectId}-Tags.CSV`;
  fs.writeFileSync(path.join(tagDir, csvName), tagsToCsv(project.tags));
  console.log(
    `Updated ${projectPath} — ${Object.keys(synced.parameterFiles).length} parameter files,`,
    `${synced.tags.filter((t) => t.folder).length} internal IO tags`
  );
}

const valuesPath = path.join(root, 'config', 'io-list-tag-values.json');
const sampleFiles = Builder.buildAllDefaultParameterFiles();
fs.writeFileSync(valuesPath, `${JSON.stringify(require('../shared/io-list-tags').buildAllListRuntimeValues(sampleFiles), null, 2)}\n`);
console.log('Wrote', valuesPath);
