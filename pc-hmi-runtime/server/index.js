const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

const { TagService } = require('./services/tag-service');
const { AlarmService } = require('./services/alarm-service');
const { UserService } = require('./services/user-service');
const { SimulatorDriver } = require('./services/communication/simulator');
const { TagLogicService } = require('./services/tag-logic-service');
const { ProjectService } = require('./services/project-service');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 8080;

const projectService = new ProjectService(ROOT);
const tagService = new TagService();
const alarmService = new AlarmService(tagService);
const tagLogicService = new TagLogicService(tagService);
let userService = new UserService([]);
let navigationConfig = {};
let projectConfig = {};
let driver = null;
let loadedRuntimeProjectId = null;

function loadProjectRuntime(projectId) {
  const id = projectId || projectService.getActiveId();
  if (!id) return;
  projectConfig = projectService.readProjectConfig(id);
  navigationConfig = projectService.readNavigation(id);
  userService = new UserService(projectConfig.users || []);

  const runtimeTags = TagLogicService.mergeBuiltinSafetyTags(projectConfig.tags || []);
  tagService.tags.clear();
  tagService.loadDefinitions(runtimeTags);
  tagLogicService.loadRules(runtimeTags);
  alarmService.definitions = [];
  alarmService.active = [];
  alarmService.loadDefinitions(projectConfig.alarms || []);

  if (driver) driver.disconnect();
  driver = new SimulatorDriver(tagService, alarmService, tagLogicService);
  driver.connect();
  tagLogicService.evaluate();
  loadedRuntimeProjectId = id;
}

function ensureRuntimeLoaded() {
  const activeId = projectService.getActiveId();
  if (activeId && activeId !== loadedRuntimeProjectId) {
    loadProjectRuntime(activeId);
  }
}

function resolveProjectId(req) {
  return req.query.project || req.body?.projectId || projectService.getActiveId();
}

loadProjectRuntime();

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
    const config = projectService.updateProjectConfig(req.params.id, req.body || {});
    if (req.params.id === projectService.getActiveId()) loadProjectRuntime(req.params.id);
    res.json({ success: true, config });
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

app.use('/api/runtime', (_req, _res, next) => {
  ensureRuntimeLoaded();
  next();
});

app.get('/api/runtime/navigation', (req, res) => {
  const pid = resolveProjectId(req);
  res.json(projectService.readNavigation(pid));
});

app.get('/api/runtime/status', (req, res) => {
  const pid = resolveProjectId(req);
  const config = projectService.readProjectConfig(pid);
  res.json({
    platform: 'Plant HMI Studio',
    version: '0.2.0',
    projectId: pid,
    communication: driver.getStatus(),
    currentUser: userService.getCurrentUser(),
    startupScreen: config.startupScreen || '100_Overview',
    projectName: config.name || pid,
    projectSubtitle: config.subtitle || '',
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
  const screen = projectService.getScreen(resolveProjectId(req), req.params.id, { raw });
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

app.post('/api/runtime/tags/write', (req, res) => {
  const { tag, value } = req.body || {};
  if (!tag) return res.status(400).json({ error: 'tag required' });
  if (tagLogicService.isComputed(tag)) {
    return res.status(400).json({ error: `${tag} is computed by Python logic and cannot be written directly` });
  }
  const ok = tagService.set(tag, value);
  tagLogicService.evaluate();
  alarmService.evaluate();
  res.json({ success: ok });
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
  socket.emit('init', {
    tags: tagService.getAll(),
    alarms: alarmService.getState(),
    user: userService.getCurrentUser(),
    communication: driver.getStatus(),
    project: projectService.getActiveProject()
  });

  socket.on('subscribe', (tagNames) => {
    tagService.subscribe(tagNames);
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
