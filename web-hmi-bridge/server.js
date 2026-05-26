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
const IMAGE_LIBRARY_DIR = process.env.FT_IMAGE_DIR || path.join(ROOT, '..', 'hmi', 'MyPlantHMI', 'Images');
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
    .filter((name) => {
      try {
        return fs.statSync(path.join(dirPath, name)).isFile();
      } catch (err) {
        if (err && err.code === 'ENOENT') {
          return false;
        }
        throw err;
      }
    })
    .filter((name) => !predicate || predicate(name))
    .map((name) => {
      try {
        return fileRow(dirPath, name);
      } catch (err) {
        if (err && err.code === 'ENOENT') {
          return null;
        }
        throw err;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.lastModified.localeCompare(b.lastModified));

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

function findImagePath(name) {
  const safeName = path.basename(String(name || '')).trim();
  if (!safeName || !fs.existsSync(IMAGE_LIBRARY_DIR)) {
    return null;
  }

  const directoryFiles = fs.readdirSync(IMAGE_LIBRARY_DIR)
    .filter((file) => fs.statSync(path.join(IMAGE_LIBRARY_DIR, file)).isFile());
  const byLower = new Map(directoryFiles.map((file) => [file.toLowerCase(), file]));

  const ext = path.extname(safeName);
  const candidates = ext
    ? [safeName]
    : [
        `${safeName}.bmp`,
        `${safeName}.png`,
        `${safeName}.jpg`,
        `${safeName}.jpeg`,
        `${safeName}.gif`,
        `${safeName}.svg`,
        `${safeName}.ico`,
        `${safeName}.webp`
      ];

  for (const candidate of candidates) {
    const matched = byLower.get(candidate.toLowerCase());
    if (matched) {
      return path.join(IMAGE_LIBRARY_DIR, matched);
    }
  }

  const safeBase = path.basename(safeName, path.extname(safeName));
  const aliases = new Map([
    ['manual2', 'manual1'],
    ['machinesequence2', 'machinesequence1']
  ]);
  const aliasBase = aliases.get(safeBase.toLowerCase());
  if (aliasBase) {
    const aliasCandidates = [
      `${aliasBase}.bmp`,
      `${aliasBase}.png`,
      `${aliasBase}.jpg`,
      `${aliasBase}.jpeg`,
      `${aliasBase}.gif`,
      `${aliasBase}.svg`,
      `${aliasBase}.ico`,
      `${aliasBase}.webp`
    ];

    for (const candidate of aliasCandidates) {
      const matched = byLower.get(candidate.toLowerCase());
      if (matched) {
        return path.join(IMAGE_LIBRARY_DIR, matched);
      }
    }
  }

  // Generic fallback: if a numeric variant is missing (icon2/icon3), try icon1.
  const numericVariant = safeBase.match(/^(.*?)(\d+)$/);
  if (numericVariant && numericVariant[1]) {
    const baseStem = numericVariant[1];
    const variantCandidates = [
      `${baseStem}1.bmp`,
      `${baseStem}1.png`,
      `${baseStem}1.jpg`,
      `${baseStem}1.jpeg`,
      `${baseStem}1.gif`,
      `${baseStem}1.svg`,
      `${baseStem}1.ico`,
      `${baseStem}1.webp`
    ];

    for (const candidate of variantCandidates) {
      const matched = byLower.get(candidate.toLowerCase());
      if (matched) {
        return path.join(IMAGE_LIBRARY_DIR, matched);
      }
    }
  }

  return null;
}

function parseDisplayMeta(xml) {
  const widthMatch = xml.match(/\bwidth\s*=\s*"(\d+)"/i);
  const heightMatch = xml.match(/\bheight\s*=\s*"(\d+)"/i);

  return {
    width: widthMatch ? Number(widthMatch[1]) : null,
    height: heightMatch ? Number(heightMatch[1]) : null
  };
}

function classifyXmlKind(name, xml) {
  if (/_addons\.xml$/i.test(String(name || ''))) {
    return 'global-object';
  }

  if (/<\s*displaySettings\b/i.test(String(xml || ''))) {
    return 'display';
  }

  return 'global-object';
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

  const merged = [...map.values()].sort((a, b) => a.lastModified.localeCompare(b.lastModified));
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
      kind: classifyXmlKind(file.name, xml),
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
    kind: classifyXmlKind(resolved.name, xml),
    xml,
    width: meta.width,
    height: meta.height
  });
});

app.get('/api/images/:name', (req, res) => {
  const imagePath = findImagePath(req.params.name);
  if (!imagePath) {
    return res.status(404).json({ error: 'Image not found' });
  }

  return res.sendFile(imagePath);
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

app.delete('/api/displays/:name', (req, res) => {
  const safeName = safeDisplayFileName(req.params.name);
  if (!isDisplayXml(safeName)) {
    return res.status(400).json({ error: 'Only display XML files are supported' });
  }

  const source = String(req.query?.source || '').toLowerCase();
  const editedPath = path.join(REIMPORT_DIR, safeName);
  const exportPath = path.join(FACTORYTALK_EXPORT_DIR, safeName);

  const deleteCandidates = source === 'factorytalk-export'
    ? [exportPath]
    : source === 'edited' || source === 'uploaded'
      ? [editedPath]
      : [editedPath, exportPath];

  const removed = [];
  for (const filePath of deleteCandidates) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      removed.push(filePath);
    }
  }

  if (!removed.length) {
    return res.status(404).json({ error: 'XML file not found' });
  }

  return res.json({ ok: true, removed: safeName, paths: removed });
});

app.post('/api/displays/package', (req, res) => {
  const requested = Array.isArray(req.body?.files) ? req.body.files : [];
  if (!requested.length) {
    return res.status(400).json({ error: 'No files selected for package' });
  }

  const selected = requested
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

  const notesName = 'DisplaysImport_WebBridge.txt';
  const notesCompatName = 'DisplaysImport.txt';
  const deleteListName = 'DeleteTargets.txt';
  const notesLines = [
    'FactoryTalk Web Bridge package generated successfully.',
    '',
    `Display files: ${copied.length}`,
    ...copied,
    '',
    `Batch file: ${batchName}`,
    '',
    'Import steps (important):',
    '1. Close all target displays before import.',
    '2. In FactoryTalk Batch Import, choose BatchImport.xml from this extracted folder.',
    '3. Set conflict handling to REPLACE/OVERWRITE existing displays (do not merge/update).',
    '4. If REPLACE is not available in your dialog, delete the target displays first, then import.',
    '5. If status says "element does not exist in the Display and cannot be updated", your import is in update/merge mode.',
    '   Switch to REPLACE, or delete targets first using DeleteTargets.txt, then re-import.',
    '',
    'If you import in merge mode, messages like "element already exists and will be ignored" are expected.'
  ];
  const notesText = `${notesLines.join('\r\n')}\r\n`;
  const notesPath = path.join(packagePath, notesName);
  const notesCompatPath = path.join(packagePath, notesCompatName);
  fs.writeFileSync(notesPath, notesText, 'utf8');
  fs.writeFileSync(notesCompatPath, notesText, 'utf8');

  const displayNames = copied.map((name) => name.replace(/\.xml$/i, ''));
  const deleteText = [
    'Delete these displays first if FactoryTalk import is merging instead of replacing:',
    ...displayNames.map((name) => `- ${name}`),
    '',
    'After deleting, run Batch Import with BatchImport.xml from this folder.'
  ].join('\r\n') + '\r\n';
  fs.writeFileSync(path.join(packagePath, deleteListName), deleteText, 'utf8');

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
