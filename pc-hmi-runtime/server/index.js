const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

const { TagService } = require('./services/tag-service');
const { AlarmService } = require('./services/alarm-service');
const { UserService } = require('./services/user-service');
const { createCommunicationDriver } = require('./services/communication/driver-factory');
const { seedDemoTagValues } = require('./services/communication/demo-tag-seeds');
const { TagLogicService } = require('./services/tag-logic-service');
const { ProjectService } = require('./services/project-service');
const { DeployService } = require('./services/deploy-service');
const { isValidIpv4 } = require('./services/communication/ethernet-ip');
const ParameterFiles = require('../public/parameter-files');
const IoListTags = require('../shared/io-list-tags');
const ParameterFileService = require('./services/parameter-file-service');
const ParameterFileBuilder = require('../shared/parameter-file-builder');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 8080;

const projectService = new ProjectService(ROOT);
const deployService = new DeployService(ROOT);
const tagService = new TagService();
const alarmService = new AlarmService(tagService);
const tagLogicService = new TagLogicService(tagService);
let userService = new UserService([]);
let navigationConfig = {};
let projectConfig = {};
let driver = null;
let loadedRuntimeProjectId = null;
let runtimeCommunicationOverride = null;

function getEffectiveCommunication() {
  return {
    ...(projectConfig.communication || {}),
    ...(runtimeCommunicationOverride || {})
  };
}

function shouldSeedDemoTags(communication) {
  return (communication?.driver || 'simulator') === 'simulator';
}

function seedDemoTagsIfNeeded(communication) {
  if (shouldSeedDemoTags(communication)) {
    seedDemoTagValues(tagService);
    tagService.syncConnections();
  }
}

function emitCommunicationChanged() {
  const status = driver?.getStatus?.() ?? { connected: false, driver: 'none', quality: 'bad' };
  io.emit('communication-changed', {
    ...status,
    effectiveDriver: getEffectiveCommunication().driver || 'simulator',
    plcIpAddress: getEffectiveCommunication().plcIpAddress || null
  });
}

async function reloadCommunicationDriver(communicationOverride, options = {}) {
  if (options.persistToProject) {
    runtimeCommunicationOverride = null;
  } else if (communicationOverride) {
    runtimeCommunicationOverride = { ...communicationOverride };
  }
  const communication = getEffectiveCommunication();
  if (driver) driver.disconnect();
  driver = createCommunicationDriver(communication, tagService, alarmService, tagLogicService);
  try {
    await driver.connect();
  } catch (err) {
    console.error('Communication driver connect failed:', err.message);
  }
  seedDemoTagsIfNeeded(communication);
  tagLogicService.evaluate();
  alarmService.evaluate();
  emitCommunicationChanged();
  return driver.getStatus?.();
}

let runtimeLoadChain = Promise.resolve();

function loadProjectRuntime(projectId) {
  runtimeLoadChain = runtimeLoadChain.then(() => loadProjectRuntimeInner(projectId)).catch((err) => {
    console.error('Runtime load failed:', err.message);
  });
  return runtimeLoadChain;
}

function loadProjectRuntimeInner(projectId) {
  const id = projectId || projectService.getActiveId();
  if (!id) return Promise.resolve();
  projectConfig = projectService.readProjectConfig(id);
  navigationConfig = projectService.readNavigation(id);
  runtimeCommunicationOverride = null;
  userService = new UserService(projectConfig.users || []);

  const runtimeTags = TagLogicService.mergeBuiltinRuntimeTags(
    TagLogicService.mergeBuiltinSafetyTags(projectConfig.tags || [])
  );
  tagService.clearSubscriptions();
  tagService.tags.clear();
  tagService.loadDefinitions(runtimeTags);
  tagService.loadConnections(runtimeTags);
  tagLogicService.loadRules(runtimeTags);
  alarmService.definitions = [];
  alarmService.active = [];
  alarmService.loadDefinitions(projectConfig.alarms || []);

  const communication = getEffectiveCommunication();
  if (driver) driver.disconnect();
  driver = createCommunicationDriver(communication, tagService, alarmService, tagLogicService);

  return Promise.resolve(driver.connect())
    .then(() => {
      seedDemoTagsIfNeeded(communication);
      tagLogicService.evaluate();
      alarmService.evaluate();
      loadedRuntimeProjectId = id;
      emitCommunicationChanged();
    })
    .catch((err) => {
      console.error('Communication driver connect failed:', err.message);
      seedDemoTagsIfNeeded(communication);
      tagLogicService.evaluate();
      alarmService.evaluate();
      loadedRuntimeProjectId = id;
      emitCommunicationChanged();
    });
}

async function ensureRuntimeLoaded(req) {
  const pid = req ? resolveProjectId(req) : projectService.getActiveId();
  if (pid && pid !== loadedRuntimeProjectId) {
    await loadProjectRuntime(pid);
  }
}

function resolveProjectId(req) {
  return req.query.project || req.body?.projectId || projectService.getActiveId();
}

loadProjectRuntime().catch((err) => console.error('Initial runtime load failed:', err.message));

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

projectService.migrateAllProjects();

app.use(express.json({ limit: '30mb' }));
app.use((req, res, next) => {
  if (/\.(html|js|css)$/.test(req.path) && !req.path.includes('node_modules')) {
    res.set('Cache-Control', 'no-store');
  }
  next();
});
app.use(express.static(path.join(ROOT, 'public')));
app.use('/shared', express.static(path.join(ROOT, 'shared')));
app.use('/config', express.static(path.join(ROOT, 'config')));
app.use('/projects', express.static(path.join(ROOT, 'projects')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(ROOT, 'public', 'studio.html'));
});

app.get('/api/projects/:id/graphics/export-targets', (req, res) => {
  try {
    res.json({
      defaultFolder: projectService.defaultGraphicsTransferFolder(),
      targets: projectService.listGraphicExportTargets(req.params.id)
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/projects/:id/graphics/export', (req, res) => {
  try {
    const { folder, items } = req.body || {};
    const result = projectService.exportGraphicsToFolder(req.params.id, folder, items);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/projects/:id/graphics/import', (req, res) => {
  try {
    const { folder } = req.body || {};
    const result = projectService.importGraphicsFromFolder(req.params.id, folder);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/projects/:id/screens', (req, res) => {
  try {
    const screen = projectService.addScreen(req.params.id, req.body || {});
    res.json({ success: true, screen });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/projects/:id/screens/:screenId', (req, res) => {
  try {
    const result = projectService.deleteScreen(req.params.id, req.params.screenId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/projects/:id/config', (req, res) => {
  try {
    const patch = req.body || {};
    if (patch.communication?.driver === 'ethernet-ip') {
      const ip = String(patch.communication.plcIpAddress || '').trim();
      if (!ip || !isValidIpv4(ip)) {
        return res.status(400).json({ error: 'Valid PLC IP address is required for EtherNet/IP driver' });
      }
    }
    const config = projectService.updateProjectConfig(req.params.id, patch);
    if (patch.parameterFiles) {
      ParameterFileService.writeProjectParameterParFiles(ROOT, req.params.id, config.parameterFiles);
    }
    if (req.params.id === projectService.getActiveId() || req.params.id === loadedRuntimeProjectId) {
      loadProjectRuntime(req.params.id);
    }
    res.json({ success: true, config });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/projects/:id/parameter-files', (req, res) => {
  try {
    const config = projectService.readProjectConfig(req.params.id);
    const parameterFiles = ParameterFileBuilder.mergeProjectParameterFiles(config.parameterFiles);
    res.json({ parameterFiles });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/projects/:id/parameter-files', (req, res) => {
  try {
    const kind = String(req.body?.kind || '').trim();
    if (!ParameterFileBuilder.IO_LIST_KINDS[kind]) {
      return res.status(400).json({ error: 'Invalid kind — use di, do, safetyDi, or safetyDo' });
    }
    const config = projectService.readProjectConfig(req.params.id);
    const result = ParameterFileService.addProjectParameterFile(config, kind);
    const next = projectService.updateProjectConfig(req.params.id, {
      parameterFiles: result.parameterFiles,
      tags: result.tags
    });
    ParameterFileService.writeProjectParameterParFiles(ROOT, req.params.id, result.parameterFiles);
    fs.writeFileSync(
      path.join(ROOT, 'config', 'io-list-tag-values.json'),
      `${JSON.stringify(result.listValues, null, 2)}\n`
    );
    if (req.params.id === projectService.getActiveId() || req.params.id === loadedRuntimeProjectId) {
      loadProjectRuntime(req.params.id);
    }
    res.json({
      success: true,
      added: result.addedName,
      listNum: result.listNum,
      parameterFiles: next.parameterFiles
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/projects/:id/parameter-files/:name', (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const config = projectService.readProjectConfig(req.params.id);
    const files = { ...ParameterFileBuilder.mergeProjectParameterFiles(config.parameterFiles) };
    if (!files[name]) return res.status(404).json({ error: 'Parameter file not found' });
    const replacements = req.body?.replacements;
    if (!replacements || typeof replacements !== 'object') {
      return res.status(400).json({ error: 'replacements object required' });
    }
    files[name] = { ...files[name], replacements };
    const next = projectService.updateProjectConfig(req.params.id, { parameterFiles: files });
    ParameterFileService.writeProjectParameterParFiles(ROOT, req.params.id, files);
    if (req.params.id === projectService.getActiveId() || req.params.id === loadedRuntimeProjectId) {
      loadProjectRuntime(req.params.id);
    }
    res.json({ success: true, parameterFiles: next.parameterFiles });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/projects/:id/parameter-files/:name', (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const config = projectService.readProjectConfig(req.params.id);
    const result = ParameterFileService.removeProjectParameterFile(config, name);
    if (!result) return res.status(404).json({ error: 'Parameter file not found' });
    const next = projectService.updateProjectConfig(req.params.id, {
      parameterFiles: result.parameterFiles,
      tags: result.tags
    });
    ParameterFileService.writeProjectParameterParFiles(ROOT, req.params.id, result.parameterFiles);
    fs.writeFileSync(
      path.join(ROOT, 'config', 'io-list-tag-values.json'),
      `${JSON.stringify(result.listValues, null, 2)}\n`
    );
    if (req.params.id === projectService.getActiveId() || req.params.id === loadedRuntimeProjectId) {
      loadProjectRuntime(req.params.id);
    }
    res.json({ success: true, removed: result.removedName, parameterFiles: next.parameterFiles });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/projects/:id/screens/:screenId', (req, res) => {
  try {
    const screen = projectService.updateScreen(req.params.id, req.params.screenId, req.body || {});
    res.json({ success: true, screen });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/projects/:id/global-objects/:objectId', (req, res) => {
  try {
    const object = projectService.updateGlobalObject(req.params.id, req.params.objectId, req.body || {});
    res.json({ success: true, object });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/projects/:id/images', (req, res) => {
  try {
    if (!projectService.projectExists(req.params.id)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(projectService.listImages(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/projects/:id/images', (req, res) => {
  try {
    let fileName;
    let buffer;
    if (req.body?.dataBase64) {
      fileName = req.body.fileName || req.body.name || 'upload.png';
      buffer = Buffer.from(req.body.dataBase64, 'base64');
    } else if (Buffer.isBuffer(req.body) && req.body.length) {
      fileName = req.headers['x-image-filename'] || req.query.name || 'upload.png';
      buffer = req.body;
    } else {
      return res.status(400).json({ error: 'No image data supplied' });
    }
    if (!buffer?.length) return res.status(400).json({ error: 'Empty image upload' });
    const saved = projectService.saveImage(req.params.id, fileName, buffer);
    res.json({ success: true, image: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/projects/:id/images/:fileName/info', (req, res) => {
  try {
    res.json(projectService.getImageInfo(req.params.id, req.params.fileName));
  } catch (err) {
    res.status(err.message === 'Image not found' ? 404 : 400).json({ error: err.message });
  }
});

app.delete('/api/projects/:id/images/:fileName', (req, res) => {
  try {
    const result = projectService.deleteImage(req.params.id, req.params.fileName);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/projects', (_req, res) => {
  res.json({
    activeId: projectService.getActiveId(),
    projects: projectService.listProjects()
  });
});

app.get('/api/projects/active', (_req, res) => {
  try {
    res.json(projectService.getActiveProject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id/explorer', (req, res) => {
  if (!projectService.projectExists(req.params.id)) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.set('Cache-Control', 'no-store');
  res.json(projectService.buildExplorerTree(req.params.id));
});

app.post('/api/projects', (req, res) => {
  const { name, subtitle, language, windowProfile } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Project name required' });
  try {
    const created = projectService.createProject(name.trim(), { subtitle, language, windowProfile });
    loadProjectRuntime(created.id);
    io.emit('project-changed', projectService.getActiveProject());
    res.json({ success: true, project: created, active: projectService.getActiveProject() });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    const result = projectService.deleteProject(req.params.id);
    if (result.activeId) loadProjectRuntime(result.activeId);
    io.emit('project-changed', projectService.getActiveProject());
    res.json({ success: true, ...result, active: projectService.getActiveProject() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/projects/:id/open', (req, res) => {
  try {
    const active = projectService.openProject(req.params.id);
    loadProjectRuntime(active.id);
    io.emit('project-changed', projectService.getActiveProject());
    res.json({ success: true, active });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.post('/api/projects/:id/deploy/package', (req, res) => {
  try {
    const result = deployService.buildPanelPackage(req.params.id, projectService);
    res.json({
      success: true,
      packageName: result.packageName,
      packageDir: result.packageDir,
      zipPath: result.zipPath,
      zipError: result.zipError,
      downloadUrl: result.zipPath
        ? `/api/projects/${encodeURIComponent(req.params.id)}/deploy/download/${encodeURIComponent(path.basename(result.zipPath))}`
        : null
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/projects/:id/deploy/copy', (req, res) => {
  try {
    const { targetPath } = req.body || {};
    const result = deployService.deployToTarget(req.params.id, targetPath, projectService);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/projects/:id/deploy/download/:fileName', (req, res) => {
  try {
    const fileName = path.basename(req.params.fileName);
    if (fileName !== req.params.fileName) {
      return res.status(400).json({ error: 'Invalid package file name' });
    }
    const zipPath = path.join(deployService.outputRoot, fileName);
    if (!fs.existsSync(zipPath)) return res.status(404).json({ error: 'Package not found' });
    res.download(zipPath);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/projects/:id/deploy/packages', (req, res) => {
  try {
    res.json({ packages: deployService.listPackages() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.use('/api/runtime', async (req, res, next) => {
  try {
    await ensureRuntimeLoaded(req);
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/runtime/navigation', (req, res) => {
  const pid = resolveProjectId(req);
  res.json(projectService.readNavigation(pid));
});

app.get('/api/runtime/status', (req, res) => {
  const pid = resolveProjectId(req);
  const config = projectService.readProjectConfig(pid);
  const communication = getEffectiveCommunication();
  res.json({
    platform: 'Plant HMI Studio',
    version: '0.2.0',
    projectId: pid,
    communication: {
      ...(driver?.getStatus?.() ?? { connected: false, driver: 'none', quality: 'bad' }),
      effectiveDriver: communication.driver || 'simulator',
      plcIpAddress: communication.plcIpAddress || null,
      path: communication.path || '0',
      pollIntervalMs: communication.pollIntervalMs || 200
    },
    currentUser: userService.getCurrentUser(),
    startupScreen: config.startupScreen || '100_Overview',
    projectName: config.name || pid,
    projectSubtitle: config.subtitle || '',
    parameterFiles: ParameterFileBuilder.mergeProjectParameterFiles(config.parameterFiles),
    runtime: {
      width: config.runtime?.width ?? 800,
      height: config.runtime?.height ?? 600,
      windowProfile: config.runtime?.windowProfile ?? '800x600',
      fullscreen: Boolean(config.runtime?.fullscreen)
    }
  });
});

app.get('/api/runtime/screens', (req, res) => {
  res.json(projectService.listScreens(resolveProjectId(req)));
});

app.get('/api/runtime/screens/:id', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const raw = req.query.raw === '1' || req.query.raw === 'true';
  const rawFile = req.query.file === '1' || req.query.file === 'true';
  const screen = projectService.getScreen(resolveProjectId(req), req.params.id, { raw, rawFile });
  if (!screen) return res.status(404).json({ error: 'Screen not found' });
  res.json(screen);
});

app.get('/api/runtime/overview-shell', (req, res) => {
  res.set('Cache-Control', 'no-store');
  // Per-screen overviewShell overrides live on each display JSON; merged project-wide shell is deprecated.
  res.json({});
});

app.get('/api/runtime/global-objects/:id', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const obj = projectService.getGlobalObject(resolveProjectId(req), req.params.id);
  if (!obj) return res.status(404).json({ error: 'Global object not found' });
  res.json(obj);
});

app.get('/api/runtime/tags', (_req, res) => {
  res.json(tagService.getAll());
});

app.get('/api/runtime/alarms', (_req, res) => {
  res.json(alarmService.getState());
});

app.post('/api/runtime/alarms/acknowledge', (req, res) => {
  const { alarmId, all } = req.body || {};
  if (all) {
    const count = alarmService.acknowledgeAll(userService.getCurrentUser()?.username);
    return res.json({ success: true, count });
  }
  if (!alarmId) return res.status(400).json({ error: 'alarmId required' });
  const ok = alarmService.acknowledge(alarmId, userService.getCurrentUser()?.username);
  res.json({ success: ok });
});

app.post('/api/runtime/alarms/clear-history', (_req, res) => {
  alarmService.clearHistory();
  res.json({ success: true });
});

app.post('/api/runtime/parameter-file/apply', async (req, res) => {
  await ensureRuntimeLoaded(req);
  const { parameterFile } = req.body || {};
  if (!parameterFile) return res.status(400).json({ error: 'parameterFile required' });
  const pid = resolveProjectId(req);
  const config = projectService.readProjectConfig(pid);
  const values = IoListTags.buildAllListRuntimeValues(config.parameterFiles, config.tags)[parameterFile];
  if (!values) return res.status(404).json({ error: `Unknown parameter file: ${parameterFile}` });
  const updated = [];
  for (const [tag, value] of Object.entries(values)) {
    if (tagService.set(tag, value)) updated.push(tag);
  }
  tagService.syncConnections();
  tagLogicService.evaluate();
  alarmService.evaluate();
  io.emit('tags', tagService.getSubscribedSnapshot());
  res.json({ success: true, parameterFile, updated: updated.length });
});

app.post('/api/runtime/tags/write', async (req, res) => {
  const { tag, value } = req.body || {};
  if (!tag) return res.status(400).json({ error: 'tag required' });
  if (tagLogicService.isComputed(tag)) {
    return res.status(400).json({ error: `${tag} is computed by Python logic and cannot be written directly` });
  }
  try {
    if (typeof driver?.writeTag === 'function') {
      await driver.writeTag(tag, value);
    } else {
      const ok = tagService.set(tag, value);
      if (!ok) return res.status(404).json({ error: `Unknown tag: ${tag}` });
      tagLogicService.evaluate();
      alarmService.evaluate();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(502).json({ error: err.message || 'Tag write failed' });
  }
});

app.get('/api/runtime/tags/logic', (_req, res) => {
  res.json({
    engine: tagLogicService.lastEngine,
    rules: tagLogicService.getRules()
  });
});

app.post('/api/runtime/tags/logic/evaluate', (_req, res) => {
  const result = tagLogicService.evaluate();
  res.json({ success: true, ...result, tags: tagService.getAll() });
});

app.get('/api/runtime/communication', (_req, res) => {
  const communication = getEffectiveCommunication();
  res.json({
    ...communication,
    status: driver?.getStatus?.() ?? { connected: false, driver: 'none', quality: 'bad' }
  });
});

app.post('/api/runtime/communication/mode', async (req, res) => {
  ensureRuntimeLoaded();
  const { driver: driverName, persist, plcIpAddress, path, pollIntervalMs } = req.body || {};
  if (!driverName || !['simulator', 'ethernet-ip'].includes(driverName)) {
    return res.status(400).json({ error: 'driver must be simulator or ethernet-ip' });
  }
  const next = {
    ...getEffectiveCommunication(),
    driver: driverName
  };
  if (plcIpAddress != null) next.plcIpAddress = String(plcIpAddress).trim();
  if (path != null) next.path = String(path).trim() || '0';
  if (pollIntervalMs != null) next.pollIntervalMs = Number(pollIntervalMs) || 200;

  if (driverName === 'ethernet-ip') {
    const { isValidIpv4 } = require('./services/communication/ethernet-ip');
    if (!next.plcIpAddress || !isValidIpv4(next.plcIpAddress)) {
      return res.status(400).json({ error: 'Valid PLC IP address is required for live mode' });
    }
  }

  try {
    if (persist) {
      const pid = projectService.getActiveId();
      projectConfig = projectService.updateProjectConfig(pid, { communication: next });
    }
    const status = await reloadCommunicationDriver(next, { persistToProject: Boolean(persist) });
    res.json({
      success: true,
      communication: getEffectiveCommunication(),
      status
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to switch communication mode' });
  }
});

app.post('/api/runtime/communication/test', async (req, res) => {
  ensureRuntimeLoaded();
  const { driver: driverName, plcIpAddress, path } = req.body || {};
  if (driverName === 'simulator') {
    return res.json({ ok: true, message: 'Simulator does not require a live PLC' });
  }
  const { EthernetIpDriver, probePlc, isValidIpv4 } = require('./services/communication/ethernet-ip');
  if (!plcIpAddress || !isValidIpv4(plcIpAddress)) {
    return res.status(400).json({ ok: false, error: 'Valid PLC IP address is required' });
  }
  if (driverName === 'opcua') {
    const port = req.body?.opcuaPort || 4840;
    const result = await probePlc(plcIpAddress, port);
    return res.json({
      ok: result.ok,
      error: result.error,
      plcIpAddress,
      path: path || '0',
      port
    });
  }
  const slot = Number(path ?? '0');
  const result = await EthernetIpDriver.testConnection(plcIpAddress, 44818, Number.isFinite(slot) ? slot : 0);
  res.json({
    ok: result.ok,
    error: result.error,
    controller: result.controller,
    version: result.version,
    plcIpAddress,
    path: path || '0'
  });
});

app.post('/api/runtime/login', (req, res) => {
  const { username, password } = req.body || {};
  const result = userService.login(username, password);
  if (result.success) io.emit('user-changed', result.user);
  res.json(result);
});

app.post('/api/runtime/logout', (_req, res) => {
  userService.logout();
  io.emit('user-changed', null);
  res.json({ success: true });
});

io.on('connection', (socket) => {
  const communication = getEffectiveCommunication();
  socket.emit('init', {
    tags: tagService.getAll(),
    alarms: alarmService.getState(),
    user: userService.getCurrentUser(),
    communication: {
      ...(driver?.getStatus?.() ?? { connected: false, driver: 'none', quality: 'bad' }),
      effectiveDriver: communication.driver || 'simulator',
      plcIpAddress: communication.plcIpAddress || null,
      path: communication.path || '0'
    },
    project: projectService.getActiveProject()
  });

  socket.on('subscribe', (tagNames) => {
    tagService.subscribe(tagNames);
    if (driver?.onSubscriptionsChanged) driver.onSubscriptionsChanged();
    socket.emit('tags', tagService.getSubscribedSnapshot());
  });
});

tagService.on('change', (update) => {
  io.emit('tag-update', update);
  alarmService.evaluate();
});

alarmService.on('change', (state) => {
  io.emit('alarm-update', state);
});

server.listen(PORT, '0.0.0.0', () => {
  try {
    const active = projectService.getActiveProject();
    console.log(`Plant HMI Studio listening on http://localhost:${PORT}`);
    console.log(`Active project: ${active?.name || 'none'} | Screens: ${active?.screens?.length || 0}`);
  } catch (err) {
    console.log(`Plant HMI Studio listening on http://localhost:${PORT}`);
    console.warn(`Startup project summary unavailable: ${err.message}`);
  }
});
