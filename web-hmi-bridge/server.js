const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const chokidar = require('chokidar');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 5050;
const ROOT = __dirname;
const FTIO_DIR = path.join(ROOT, 'ftio');
const FACTORYTALK_EXPORT_DIR = process.env.FT_EXPORT_DIR || path.join(ROOT, '..', 'Export import');
const REIMPORT_DIR = path.join(FTIO_DIR, 'reimport');
const PACKAGE_DIR = path.join(REIMPORT_DIR, 'packages');

for (const dir of [FTIO_DIR, FACTORYTALK_EXPORT_DIR, REIMPORT_DIR, PACKAGE_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(ROOT, 'public')));

function fileRow(dirPath, name) {
  const full = path.join(dirPath, name);
  const stat = fs.statSync(full);
  return {
    name,
    sizeBytes: stat.size,
    lastModified: stat.mtime.toISOString()
  };
}

function getFiles(dirPath, predicate) {
  const files = fs.readdirSync(dirPath)
    .filter((name) => fs.statSync(path.join(dirPath, name)).isFile())
    .filter((name) => !predicate || predicate(name))
    .map((name) => fileRow(dirPath, name))
    .sort((a, b) => b.lastModified.localeCompare(a.lastModified));

  return files;
}

function safeDisplayFileName(name) {
  return path.basename(String(name || ''));
}

function isDisplayXml(name) {
  return name.toLowerCase().endsWith('.xml') && !name.toLowerCase().startsWith('batchimport_');
}

function readTextAuto(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return bytes.slice(2).toString('utf16le');
  }

  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return bytes.slice(3).toString('utf8');
  }

  return bytes.toString('utf8');
}

function writeUtf16LeWithBom(filePath, text) {
  const bom = Buffer.from([0xff, 0xfe]);
  const body = Buffer.from(text, 'utf16le');
  fs.writeFileSync(filePath, Buffer.concat([bom, body]));
}

function parseDisplayMeta(xml) {
  const widthMatch = xml.match(/\bwidth\s*=\s*"(\d+)"/i);
  const heightMatch = xml.match(/\bheight\s*=\s*"(\d+)"/i);

  return {
    width: widthMatch ? Number(widthMatch[1]) : null,
    height: heightMatch ? Number(heightMatch[1]) : null
  };
}

function getDisplayFiles() {
  const exported = getFiles(FACTORYTALK_EXPORT_DIR, isDisplayXml).map((file) => ({
    ...file,
    source: 'factorytalk-export'
  }));
  const edited = getFiles(REIMPORT_DIR, isDisplayXml).map((file) => ({
    ...file,
    source: 'edited'
  }));

  const map = new Map();
  for (const file of exported) {
    map.set(file.name.toLowerCase(), file);
  }
  for (const file of edited) {
    map.set(file.name.toLowerCase(), file);
  }

  const merged = [...map.values()].sort((a, b) => b.lastModified.localeCompare(a.lastModified));
  return merged;
}

function resolveDisplayPath(name) {
  const safeName = safeDisplayFileName(name);
  const editedPath = path.join(REIMPORT_DIR, safeName);
  const exportPath = path.join(FACTORYTALK_EXPORT_DIR, safeName);

  if (fs.existsSync(editedPath)) {
    return { filePath: editedPath, source: 'edited', name: safeName };
  }

  if (fs.existsSync(exportPath)) {
    return { filePath: exportPath, source: 'factorytalk-export', name: safeName };
  }

  return null;
}

function bridgeSnapshot() {
  return {
    connected: true,
    exportFolder: FACTORYTALK_EXPORT_DIR,
    displaysCount: getFiles(FACTORYTALK_EXPORT_DIR, isDisplayXml).length,
    editedCount: getFiles(REIMPORT_DIR, isDisplayXml).length,
    updatedAt: new Date().toISOString()
  };
}

function getLatestPackageFolder() {
  const folders = fs.readdirSync(PACKAGE_DIR)
    .filter((name) => fs.statSync(path.join(PACKAGE_DIR, name)).isDirectory())
    .sort((a, b) => b.localeCompare(a));

  if (!folders.length) {
    return null;
  }

  const folderName = folders[0];
  return {
    folderName,
    folderPath: path.join(PACKAGE_DIR, folderName)
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'web-hmi-bridge', now: new Date().toISOString() });
});

app.get('/api/bridge/status', (_req, res) => {
  res.json(bridgeSnapshot());
});

app.get('/api/displays', (_req, res) => {
  const files = getDisplayFiles().map((file) => {
    const sourcePath = file.source === 'edited'
      ? path.join(REIMPORT_DIR, file.name)
      : path.join(FACTORYTALK_EXPORT_DIR, file.name);
    const xml = readTextAuto(sourcePath);
    const meta = parseDisplayMeta(xml);

    return {
      ...file,
      width: meta.width,
      height: meta.height
    };
  });

  res.json({ files });
});

app.get('/api/displays/:name', (req, res) => {
  const resolved = resolveDisplayPath(req.params.name);
  if (!resolved) {
    return res.status(404).json({ error: 'File not found' });
  }

  const xml = readTextAuto(resolved.filePath);
  const meta = parseDisplayMeta(xml);
  return res.json({
    name: resolved.name,
    source: resolved.source,
    xml,
    width: meta.width,
    height: meta.height
  });
});

app.post('/api/displays/:name/save', (req, res) => {
  const safeName = safeDisplayFileName(req.params.name);
  if (!isDisplayXml(safeName)) {
    return res.status(400).json({ error: 'Only display XML files are supported' });
  }

  const xml = String(req.body?.xml || '');
  if (!xml.trim()) {
    return res.status(400).json({ error: 'xml content is required' });
  }

  const savePath = path.join(REIMPORT_DIR, safeName);
  fs.writeFileSync(savePath, xml, 'utf8');
  const meta = parseDisplayMeta(xml);

  return res.json({
    ok: true,
    saved: safeName,
    path: savePath,
    width: meta.width,
    height: meta.height
  });
});

app.post('/api/displays/package', (req, res) => {
  const requested = Array.isArray(req.body?.files) ? req.body.files : [];
  const defaults = getDisplayFiles().map((f) => f.name);
  const selected = (requested.length ? requested : defaults)
    .map((name) => safeDisplayFileName(name))
    .filter((name) => isDisplayXml(name));

  const uniqueSelected = [...new Set(selected)];
  if (!uniqueSelected.length) {
    return res.status(400).json({ error: 'No display XML files selected' });
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const packagePath = path.join(PACKAGE_DIR, `package_${stamp}`);
  fs.mkdirSync(packagePath, { recursive: true });

  const copied = [];
  for (const name of uniqueSelected) {
    const resolved = resolveDisplayPath(name);
    if (!resolved) {
      continue;
    }

    fs.copyFileSync(resolved.filePath, path.join(packagePath, name));
    copied.push(name);
  }

  if (!copied.length) {
    return res.status(400).json({ error: 'No valid files found to package' });
  }

  const batchLines = ['<gfxImport>'];
  for (const name of copied) {
    batchLines.push(`    <import importFile="${name}"/>`);
  }
  batchLines.push('</gfxImport>');
  const batchXml = `${batchLines.join('\r\n')}\r\n`;

  const batchName = 'BatchImport_WebBridge.xml';
  const batchCompatName = 'BatchImport.xml';
  const batchPath = path.join(packagePath, batchName);
  const batchCompatPath = path.join(packagePath, batchCompatName);
  writeUtf16LeWithBom(batchPath, batchXml);
  writeUtf16LeWithBom(batchCompatPath, batchXml);

  return res.json({
    ok: true,
    packagePath,
    files: copied,
    batchFile: batchPath,
    batchFileCompat: batchCompatPath,
    downloadUrl: '/api/packages/download/latest.zip'
  });
});

app.get('/api/packages/download/latest.zip', (_req, res) => {
  const latest = getLatestPackageFolder();
  if (!latest) {
    return res.status(404).json({ error: 'No packages yet' });
  }

  const zipName = `${latest.folderName}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

  const archive = new archiver.ZipArchive({ zlib: { level: 9 } });
  archive.on('error', (err) => {
    if (!res.headersSent) {
      res.status(500).json({ error: `Failed to build zip: ${err.message}` });
    } else {
      res.end();
    }
  });

  archive.pipe(res);
  archive.directory(latest.folderPath, false);
  archive.finalize();
});

io.on('connection', (socket) => {
  socket.emit('bridge-status', bridgeSnapshot());
});

function notifyBridge() {
  io.emit('bridge-status', bridgeSnapshot());
}

const watcher = chokidar.watch([FACTORYTALK_EXPORT_DIR, REIMPORT_DIR, PACKAGE_DIR], {
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
  console.log(`Reading FactoryTalk display exports from: ${FACTORYTALK_EXPORT_DIR}`);
  console.log(`Writing edited files and import packages to: ${REIMPORT_DIR}`);
});
