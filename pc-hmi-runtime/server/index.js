const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

const { TagService } = require('./services/tag-service');
const { AlarmService } = require('./services/alarm-service');
const { UserService } = require('./services/user-service');
const { SimulatorDriver } = require('./services/communication/simulator');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 5060;

const projectConfig = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'config', 'project.json'), 'utf8')
);

const tagService = new TagService();
const alarmService = new AlarmService(tagService);
const userService = new UserService(projectConfig.users);

tagService.loadDefinitions(projectConfig.tags);
alarmService.loadDefinitions(projectConfig.alarms);

const driver = new SimulatorDriver(tagService, alarmService);
driver.connect();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(express.static(path.join(ROOT, 'public')));
app.use('/screens', express.static(path.join(ROOT, 'screens')));
app.use('/faceplates', express.static(path.join(ROOT, 'faceplates')));

function loadScreens() {
  const dir = path.join(ROOT, 'screens');
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const screen = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      return { id: screen.id, title: screen.title, navGroup: screen.navGroup, file: f };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

app.get('/api/runtime/status', (_req, res) => {
  res.json({
    platform: 'Plant HMI Runtime',
    version: '0.1.0',
    communication: driver.getStatus(),
    currentUser: userService.getCurrentUser(),
    startupScreen: projectConfig.startupScreen,
    projectName: projectConfig.name
  });
});

app.get('/api/runtime/screens', (_req, res) => {
  res.json(loadScreens());
});

app.get('/api/runtime/screens/:id', (req, res) => {
  const file = path.join(ROOT, 'screens', `${req.params.id}.json`);
  if (!fs.existsSync(file)) {
    return res.status(404).json({ error: 'Screen not found' });
  }
  res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
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
  const ok = tagService.set(tag, value);
  alarmService.evaluate();
  res.json({ success: ok });
});

app.post('/api/runtime/login', (req, res) => {
  const { username, password } = req.body || {};
  const result = userService.login(username, password);
  if (result.success) {
    io.emit('user-changed', result.user);
  }
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
    communication: driver.getStatus()
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
  console.log(`Plant HMI Runtime listening on http://localhost:${PORT}`);
  console.log(`Driver: simulator | Screens: ${loadScreens().length}`);
});
