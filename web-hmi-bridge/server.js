const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const chokidar = require('chokidar');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 5050;
const ROOT = __dirname;
const FTIO_DIR = path.join(ROOT, 'ftio');
const INBOUND_DIR = path.join(FTIO_DIR, 'inbound');
const OUTBOUND_DIR = path.join(FTIO_DIR, 'outbound');
const SPECS_DIR = path.join(FTIO_DIR, 'specs');
const MAX_UPLOAD_MB = 20;

for (const dir of [FTIO_DIR, INBOUND_DIR, OUTBOUND_DIR, SPECS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(ROOT, 'public')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const target = req.body.target === 'inbound' ? INBOUND_DIR : OUTBOUND_DIR;
    cb(null, target);
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 }
});

function fileRow(bucketDir, name) {
  const full = path.join(bucketDir, name);
  const stat = fs.statSync(full);
  return {
    name,
    sizeBytes: stat.size,
    lastModified: stat.mtime.toISOString()
  };
}

function getBucketFiles(bucket) {
  const map = {
    inbound: INBOUND_DIR,
    outbound: OUTBOUND_DIR,
    specs: SPECS_DIR
  };

  const bucketDir = map[bucket];
  if (!bucketDir) {
    throw new Error('Invalid bucket');
  }

  const files = fs.readdirSync(bucketDir)
    .filter((name) => fs.statSync(path.join(bucketDir, name)).isFile())
    .map((name) => fileRow(bucketDir, name))
    .sort((a, b) => b.lastModified.localeCompare(a.lastModified));

  return files;
}

function bridgeSnapshot() {
  return {
    connected: true,
    inboundCount: getBucketFiles('inbound').length,
    outboundCount: getBucketFiles('outbound').length,
    specsCount: getBucketFiles('specs').length,
    updatedAt: new Date().toISOString()
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'web-hmi-bridge', now: new Date().toISOString() });
});

app.get('/api/bridge/status', (_req, res) => {
  res.json(bridgeSnapshot());
});

app.get('/api/files/:bucket', (req, res) => {
  try {
    const files = getBucketFiles(req.params.bucket);
    res.json({ bucket: req.params.bucket, files });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/files/download/:bucket/:name', (req, res) => {
  const map = {
    inbound: INBOUND_DIR,
    outbound: OUTBOUND_DIR,
    specs: SPECS_DIR
  };
  const bucketDir = map[req.params.bucket];
  if (!bucketDir) {
    return res.status(400).json({ error: 'Invalid bucket' });
  }

  const filePath = path.join(bucketDir, req.params.name);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  return res.download(filePath);
});

app.post('/api/files/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Missing file' });
  }

  const target = req.body.target === 'inbound' ? 'inbound' : 'outbound';
  return res.json({
    ok: true,
    target,
    filename: req.file.filename,
    sizeBytes: req.file.size
  });
});

app.post('/api/specs', (req, res) => {
  const { pageName, prompt, controls } = req.body || {};
  if (!pageName || !String(pageName).trim()) {
    return res.status(400).json({ error: 'pageName is required' });
  }

  const safePageName = String(pageName).trim().replace(/[^a-zA-Z0-9._-]/g, '_');
  const payload = {
    pageName: safePageName,
    prompt: String(prompt || ''),
    controls: Array.isArray(controls) ? controls : [],
    createdAt: new Date().toISOString()
  };

  const outPath = path.join(SPECS_DIR, `${Date.now()}_${safePageName}.json`);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');

  return res.json({ ok: true, saved: path.basename(outPath) });
});

app.get('/api/specs/latest', (_req, res) => {
  const files = getBucketFiles('specs');
  if (!files.length) {
    return res.status(404).json({ error: 'No specs yet' });
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

const watcher = chokidar.watch([INBOUND_DIR, OUTBOUND_DIR, SPECS_DIR], {
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
  console.log('Use ftio/inbound and ftio/outbound as shared folders with FactoryTalk tools.');
});
