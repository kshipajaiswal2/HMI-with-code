const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 5050;
const ROOT = __dirname;
const FTIO_DIR = path.join(ROOT, 'ftio');
const EXPORTS_DIR = path.join(FTIO_DIR, 'inbound');
const SPECS_DIR = path.join(FTIO_DIR, 'specs');

for (const dir of [FTIO_DIR, EXPORTS_DIR, SPECS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(ROOT, 'public')));

function fileRow(bucketDir, name) {
  const full = path.join(bucketDir, name);
  const stat = fs.statSync(full);
  return {
    name,
    sizeBytes: stat.size,
    lastModified: stat.mtime.toISOString()
  };
}

function getFiles(dirPath) {
  const files = fs.readdirSync(dirPath)
    .filter((name) => fs.statSync(path.join(dirPath, name)).isFile())
    .map((name) => fileRow(dirPath, name))
    .sort((a, b) => b.lastModified.localeCompare(a.lastModified));

  return files;
}

function bridgeSnapshot() {
  return {
    connected: true,
    exportsCount: getFiles(EXPORTS_DIR).length,
    screensCount: getFiles(SPECS_DIR).length,
    updatedAt: new Date().toISOString()
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'web-hmi-bridge', now: new Date().toISOString() });
});

app.get('/api/bridge/status', (_req, res) => {
  res.json(bridgeSnapshot());
});

app.get('/api/exports', (_req, res) => {
  const files = getFiles(EXPORTS_DIR);
  res.json({ files });
});

app.get('/api/exports/download/:name', (req, res) => {
  const filePath = path.join(EXPORTS_DIR, req.params.name);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  return res.download(filePath);
});

app.post('/api/screens', (req, res) => {
  const { pageName, width, height } = req.body || {};
  if (!pageName || !String(pageName).trim()) {
    return res.status(400).json({ error: 'pageName is required' });
  }

  const parsedWidth = Number(width);
  const parsedHeight = Number(height);
  if (!Number.isFinite(parsedWidth) || !Number.isFinite(parsedHeight) || parsedWidth <= 0 || parsedHeight <= 0) {
    return res.status(400).json({ error: 'Valid width and height are required' });
  }

  const safePageName = String(pageName).trim().replace(/[^a-zA-Z0-9._-]/g, '_');
  const payload = {
    pageName: safePageName,
    width: parsedWidth,
    height: parsedHeight,
    controls: ['Run', 'Stop', 'Error'],
    createdAt: new Date().toISOString()
  };

  const outPath = path.join(SPECS_DIR, `${Date.now()}_${safePageName}.json`);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');

  return res.json({ ok: true, saved: path.basename(outPath) });
});

app.get('/api/screens/latest', (_req, res) => {
  const files = getFiles(SPECS_DIR);
  if (!files.length) {
    return res.status(404).json({ error: 'No screens yet' });
  }

  const latest = files[0].name;
  const full = path.join(SPECS_DIR, latest);
  const json = JSON.parse(fs.readFileSync(full, 'utf8'));
  return res.json({ file: latest, spec: json });
});

io.on('connection', (socket) => {
  socket.emit('bridge-status', bridgeSnapshot());
});

function notifyBridge() {
  io.emit('bridge-status', bridgeSnapshot());
}

const watcher = chokidar.watch([EXPORTS_DIR, SPECS_DIR], {
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 150,
    pollInterval: 25
  }
});

watcher.on('all', (_event, _pathName) => {
  notifyBridge();
});

setInterval(notifyBridge, 5000);

server.listen(PORT, () => {
  console.log(`web-hmi-bridge running on http://localhost:${PORT}`);
  console.log('Use ftio/inbound for FactoryTalk exported files and ftio/specs for created screen specs.');
});
