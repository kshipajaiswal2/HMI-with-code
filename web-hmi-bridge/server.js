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
const FACTORYTALK_HMI_DIR = process.env.FT_HMI_DIR || path.join(ROOT, '..', 'hmi');
const FACTORYTALK_PROJECT_ARCHIVE_PATH = process.env.FT_PROJECT_ARCHIVE || '';
const REIMPORT_DIR = path.join(FTIO_DIR, 'reimport');
const PACKAGE_DIR = path.join(REIMPORT_DIR, 'packages');
const DEFAULT_PAGES_DIR = path.join(FTIO_DIR, 'default-pages');
const DISPLAY_FOLDERS_PATH = path.join(FTIO_DIR, 'display-folders.json');
const DELETED_DISPLAYS_PATH = path.join(FTIO_DIR, 'deleted-displays.json');

function createZipArchive() {
  const options = { zlib: { level: 9 } };

  if (typeof archiver === 'function') {
    return archiver('zip', options);
  }

  if (archiver && typeof archiver.default === 'function') {
    return archiver.default('zip', options);
  }

  if (archiver && typeof archiver.create === 'function') {
    return archiver.create('zip', options);
  }

  if (archiver && typeof archiver.ZipArchive === 'function') {
    return new archiver.ZipArchive(options);
  }

  throw new Error('Unsupported archiver export format');
}

for (const dir of [FTIO_DIR, FACTORYTALK_EXPORT_DIR, REIMPORT_DIR, PACKAGE_DIR, DEFAULT_PAGES_DIR]) {
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

function sanitizeFolderName(name) {
  return String(name || '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isDisplayXml(name) {
  return name.toLowerCase().endsWith('.xml') && !name.toLowerCase().startsWith('batchimport_');
}

function parseDisplayNumber(name) {
  const base = path.basename(String(name || ''), path.extname(String(name || '')));
  const match = base.match(/^(\d{3})/);
  return match ? Number(match[1]) : null;
}

function buildFolderMap(fileNames) {
  const grouped = new Map();
  for (const name of fileNames) {
    const number = parseDisplayNumber(name);
    if (!Number.isFinite(number)) {
      continue;
    }

    const bucket = Math.floor(number / 100) * 100;
    if (!grouped.has(bucket)) {
      grouped.set(bucket, []);
    }
    grouped.get(bucket).push(name);
  }

  const folderMap = new Map();
  for (const [bucket, names] of grouped.entries()) {
    const bucketPrefix = String(bucket).padStart(3, '0');
    const exact = names.find((name) => path.basename(name, path.extname(name)).toLowerCase().startsWith(`${bucketPrefix}_`));
    const folderName = path.basename(exact || names[0], path.extname(exact || names[0]));
    folderMap.set(bucket, folderName);
  }

  return folderMap;
}

function readDisplayFolderConfig() {
  if (!fs.existsSync(DISPLAY_FOLDERS_PATH)) {
    return { folders: [], assignments: {} };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(DISPLAY_FOLDERS_PATH, 'utf8'));
    const folders = Array.isArray(parsed?.folders)
      ? parsed.folders
        .map((name) => sanitizeFolderName(name))
        .filter(Boolean)
      : [];
    const assignmentsRaw = parsed?.assignments && typeof parsed.assignments === 'object'
      ? parsed.assignments
      : {};
    const assignments = {};
    for (const [name, folder] of Object.entries(assignmentsRaw)) {
      const key = safeDisplayFileName(name).toLowerCase();
      const normalizedFolder = sanitizeFolderName(folder);
      if (key && normalizedFolder) {
        assignments[key] = normalizedFolder;
      }
    }

    return {
      folders: [...new Set(folders)],
      assignments
    };
  } catch (_err) {
    return { folders: [], assignments: {} };
  }
}

function writeDisplayFolderConfig(config) {
  const folderNames = Array.isArray(config?.folders)
    ? config.folders
      .map((name) => sanitizeFolderName(name))
      .filter(Boolean)
    : [];
  const assignments = {};
  const assignmentsRaw = config?.assignments && typeof config.assignments === 'object'
    ? config.assignments
    : {};

  for (const [name, folder] of Object.entries(assignmentsRaw)) {
    const key = safeDisplayFileName(name).toLowerCase();
    const normalizedFolder = sanitizeFolderName(folder);
    if (key && normalizedFolder) {
      assignments[key] = normalizedFolder;
    }
  }

  const nextConfig = {
    folders: [...new Set(folderNames)],
    assignments
  };

  fs.writeFileSync(DISPLAY_FOLDERS_PATH, JSON.stringify(nextConfig, null, 2), 'utf8');
  return nextConfig;
}

function resolveFolderedImportPath(name, folderMap, assignments = {}) {
  const assigned = sanitizeFolderName(assignments[String(name || '').toLowerCase()] || '');
  if (assigned) {
    return `${assigned}/${name}`;
  }

  const number = parseDisplayNumber(name);
  if (!Number.isFinite(number)) {
    return name;
  }

  const bucket = Math.floor(number / 100) * 100;
  const folderName = folderMap.get(bucket);
  if (!folderName) {
    return name;
  }

  return `${folderName}/${name}`;
}

function readDeletedDisplays() {
  if (!fs.existsSync(DELETED_DISPLAYS_PATH)) {
    return new Set();
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(DELETED_DISPLAYS_PATH, 'utf8'));
    const names = Array.isArray(parsed?.files) ? parsed.files : [];
    return new Set(names.map((name) => safeDisplayFileName(name).toLowerCase()).filter(Boolean));
  } catch (_err) {
    return new Set();
  }
}

function writeDeletedDisplays(setOrNames) {
  const names = Array.isArray(setOrNames)
    ? setOrNames
    : setOrNames instanceof Set
      ? [...setOrNames]
      : [];

  const normalized = [...new Set(names
    .map((name) => safeDisplayFileName(name).toLowerCase())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  fs.writeFileSync(DELETED_DISPLAYS_PATH, JSON.stringify({ files: normalized }, null, 2), 'utf8');
}

function markDisplayDeleted(name) {
  const safeName = safeDisplayFileName(name).toLowerCase();
  if (!safeName) {
    return;
  }

  const deleted = readDeletedDisplays();
  deleted.add(safeName);
  writeDeletedDisplays(deleted);
}

function clearDeletedDisplay(name) {
  const safeName = safeDisplayFileName(name).toLowerCase();
  if (!safeName) {
    return;
  }

  const deleted = readDeletedDisplays();
  if (!deleted.has(safeName)) {
    return;
  }

  deleted.delete(safeName);
  writeDeletedDisplays(deleted);
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

  const normalizeImageKey = (value) => String(value || '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '');

  const directoryFiles = fs.readdirSync(IMAGE_LIBRARY_DIR)
    .filter((file) => fs.statSync(path.join(IMAGE_LIBRARY_DIR, file)).isFile());
  const byLower = new Map(directoryFiles.map((file) => [file.toLowerCase(), file]));
  const normalizedEntries = directoryFiles
    .map((file) => ({
      file,
      key: normalizeImageKey(path.basename(file, path.extname(file)))
    }))
    .filter((entry) => entry.key);

  function pickSingleNormalizedMatch(key) {
    const matches = normalizedEntries.filter((entry) => entry.key === key);
    return matches.length === 1 ? path.join(IMAGE_LIBRARY_DIR, matches[0].file) : null;
  }

  function pickSinglePredicateMatch(predicate) {
    const matches = normalizedEntries.filter((entry) => predicate(entry.key));
    return matches.length === 1 ? path.join(IMAGE_LIBRARY_DIR, matches[0].file) : null;
  }

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
    ['machinesequence2', 'machinesequence1'],
    ['double arrow up', 'arrow up'],
    ['double arrow down', 'arrow down'],
    ['mute2_1-photoroom', 'mute1-photoroom'],
    ['recipe2 - copy', 'recipe1 1'],
    ['microsoftteams-image (12)', 'microsoftteams-image (11)']
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

  // Final fallback for inconsistent names in exported XML (spaces, suffixes, numbering).
  const normalizedBase = normalizeImageKey(safeBase);
  if (normalizedBase) {
    const exactNormalized = pickSingleNormalizedMatch(normalizedBase);
    if (exactNormalized) {
      return exactNormalized;
    }

    const noTrailingDigits = normalizedBase.replace(/\d+$/, '');
    if (noTrailingDigits && noTrailingDigits !== normalizedBase) {
      const exactNoDigits = pickSingleNormalizedMatch(noTrailingDigits);
      if (exactNoDigits) {
        return exactNoDigits;
      }
    }

    const prefixMatch = pickSinglePredicateMatch((key) => key.startsWith(normalizedBase));
    if (prefixMatch) {
      return prefixMatch;
    }

    if (noTrailingDigits && noTrailingDigits !== normalizedBase) {
      const noDigitsPrefixMatch = pickSinglePredicateMatch((key) => key.startsWith(noTrailingDigits));
      if (noDigitsPrefixMatch) {
        return noDigitsPrefixMatch;
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

function getGlobalBatchImportFileNames() {
  if (!fs.existsSync(FACTORYTALK_EXPORT_DIR)) {
    return new Set();
  }

  const names = new Set();
  const batchFiles = fs.readdirSync(FACTORYTALK_EXPORT_DIR)
    .filter((file) => /^batchimport_global.*\.xml$/i.test(file));

  for (const batchFile of batchFiles) {
    const batchPath = path.join(FACTORYTALK_EXPORT_DIR, batchFile);
    if (!fs.existsSync(batchPath)) {
      continue;
    }

    let text = '';
    try {
      text = readTextAuto(batchPath);
    } catch (_err) {
      continue;
    }

    const importPattern = /importFile\s*=\s*"([^"]+)"/gi;
    let match;
    while ((match = importPattern.exec(text)) !== null) {
      const importedName = safeDisplayFileName(match[1]);
      if (importedName) {
        names.add(importedName.toLowerCase());
      }
    }
  }

  return names;
}

function classifyXmlKind(name, xml) {
  const globalBatchNames = getGlobalBatchImportFileNames();
  if (globalBatchNames.has(String(name || '').toLowerCase())) {
    return 'global-object';
  }

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
  const deleted = readDeletedDisplays();
  return merged.filter((file) => !deleted.has(String(file.name || '').toLowerCase()));
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

function getDefaultPageFiles() {
  return getFiles(DEFAULT_PAGES_DIR, isDisplayXml).map((file) => {
    const xml = readTextAuto(path.join(DEFAULT_PAGES_DIR, file.name));
    const meta = parseDisplayMeta(xml);
    return {
      ...file,
      source: 'default-template',
      kind: classifyXmlKind(file.name, xml),
      width: meta.width,
      height: meta.height
    };
  });
}

function resolveDefaultPagePath(name) {
  const safeName = safeDisplayFileName(name);
  const templatePath = path.join(DEFAULT_PAGES_DIR, safeName);
  if (!fs.existsSync(templatePath)) {
    return null;
  }

  return { filePath: templatePath, source: 'default-template', name: safeName };
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

function toArchiveInfo(filePath) {
  const ext = path.extname(String(filePath || '')).toLowerCase();
  if (ext === '.apa') {
    return {
      archivePath: filePath,
      archiveType: 'apa',
      restoreMenuLabel: 'Restore Application'
    };
  }

  if (ext === '.mer') {
    return {
      archivePath: filePath,
      archiveType: 'mer',
      restoreMenuLabel: 'Restore Runtime Application'
    };
  }

  return null;
}

function findProjectArchiveInfo() {
  const configured = String(FACTORYTALK_PROJECT_ARCHIVE_PATH || '').trim();
  if (configured && fs.existsSync(configured)) {
    const configuredInfo = toArchiveInfo(configured);
    if (configuredInfo) {
      return configuredInfo;
    }
  }

  if (!fs.existsSync(FACTORYTALK_HMI_DIR)) {
    return null;
  }

  const archiveFiles = fs.readdirSync(FACTORYTALK_HMI_DIR)
    .filter((name) => /\.(apa|mer)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  if (!archiveFiles.length) {
    return null;
  }

  const preferredApa = archiveFiles.find((name) => /\.apa$/i.test(name));
  const fallbackMer = archiveFiles.find((name) => /\.mer$/i.test(name));
  const chosen = preferredApa || fallbackMer;
  if (!chosen) {
    return null;
  }

  return toArchiveInfo(path.join(FACTORYTALK_HMI_DIR, chosen));
}

function buildDisplayBatchFiles(targetDir, copied, notesIntroLines = []) {
  const folderConfig = readDisplayFolderConfig();
  const folderMap = buildFolderMap(copied);
  const folderedImports = copied.map((name) => resolveFolderedImportPath(name, folderMap, folderConfig.assignments));
  const hasFolderedPaths = folderedImports.some((entry) => entry.includes('/'));

  // Copy files into foldered paths so FactoryTalk can resolve importFile="Folder/File.xml" entries.
  for (let index = 0; index < copied.length; index += 1) {
    const sourceName = copied[index];
    const folderedRelPath = folderedImports[index];
    if (!folderedRelPath || folderedRelPath === sourceName) {
      continue;
    }

    const sourcePath = path.join(targetDir, sourceName);
    const destinationPath = path.join(targetDir, ...folderedRelPath.split('/'));
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
  }

  const batchFolderedLines = ['<gfxImport>'];
  for (const relPath of folderedImports) {
    batchFolderedLines.push(`    <import importFile="${relPath}"/>`);
  }
  batchFolderedLines.push('</gfxImport>');
  const batchXmlFoldered = `${batchFolderedLines.join('\r\n')}\r\n`;

  const batchFlatLines = ['<gfxImport>'];
  for (const name of copied) {
    batchFlatLines.push(`    <import importFile="${name}"/>`);
  }
  batchFlatLines.push('</gfxImport>');
  const batchXmlFlat = `${batchFlatLines.join('\r\n')}\r\n`;

  const batchName = 'BatchImport.xml';
  const batchFolderedName = 'BatchImport_Foldered.xml';
  const batchFlatName = 'BatchImport_Flat.xml';
  const batchPath = path.join(targetDir, batchName);
  const batchFolderedPath = path.join(targetDir, batchFolderedName);
  const batchFlatPath = path.join(targetDir, batchFlatName);

  // Primary batch file uses foldered paths when available.
  writeUtf16LeWithBom(batchPath, hasFolderedPaths ? batchXmlFoldered : batchXmlFlat);
  writeUtf16LeWithBom(batchFolderedPath, batchXmlFoldered);
  writeUtf16LeWithBom(batchFlatPath, batchXmlFlat);

  const notesName = 'DisplaysImport_WebBridge.txt';
  const notesCompatName = 'DisplaysImport.txt';
  const deleteListName = 'DeleteTargets.txt';
  const notesLines = [
    ...notesIntroLines,
    'FactoryTalk Web Bridge package generated successfully.',
    '',
    `Display files: ${copied.length}`,
    ...copied,
    '',
    `Primary batch file: ${batchName}${hasFolderedPaths ? ' (foldered paths)' : ''}`,
    `Explicit foldered batch: ${batchFolderedName}`,
    `Alternate flat batch: ${batchFlatName}`,
    '',
    'Import steps (important):',
    '1. Close all target displays before import.',
    '2. In FactoryTalk Batch Import, choose BatchImport.xml from this extracted folder.',
    '3. Set conflict handling to REPLACE/OVERWRITE existing displays (do not merge/update).',
    '4. If REPLACE is not available in your dialog, delete the target displays first using DeleteTargets.txt, then import.',
    '',
    hasFolderedPaths
      ? 'NOTE: This package includes foldered import paths. Use BatchImport.xml to recreate display grouping in FactoryTalk.'
      : 'NOTE: No folder assignments were found, so imports are flat. Use BatchImport_Foldered.xml only if you edit folder paths manually.',
    '',
    'If you import in merge mode, messages like "element already exists and will be ignored" are expected.',
    'This means the display already existed - delete it first, then reimport.'
  ];
  const notesText = `${notesLines.join('\r\n')}\r\n`;
  fs.writeFileSync(path.join(targetDir, notesName), notesText, 'utf8');
  fs.writeFileSync(path.join(targetDir, notesCompatName), notesText, 'utf8');

  const displayNames = copied.map((name) => name.replace(/\.xml$/i, ''));
  const deleteText = [
    'Delete these displays first if FactoryTalk import is merging instead of replacing:',
    ...displayNames.map((name) => `- ${name}`),
    '',
    'After deleting, run Batch Import with BatchImport.xml from this folder.'
  ].join('\r\n') + '\r\n';
  fs.writeFileSync(path.join(targetDir, deleteListName), deleteText, 'utf8');

  return {
    batchPath,
    batchFolderedPath,
    batchFlatPath,
    notesPath: path.join(targetDir, notesName),
    deleteListPath: path.join(targetDir, deleteListName)
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

app.get('/api/display-folders', (_req, res) => {
  const config = readDisplayFolderConfig();
  return res.json(config);
});

app.post('/api/display-folders/save', (req, res) => {
  const folders = Array.isArray(req.body?.folders) ? req.body.folders : [];
  const assignments = req.body?.assignments && typeof req.body.assignments === 'object'
    ? req.body.assignments
    : {};
  const saved = writeDisplayFolderConfig({ folders, assignments });
  return res.json({ ok: true, ...saved });
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
  clearDeletedDisplay(safeName);
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

  markDisplayDeleted(safeName);

  return res.json({ ok: true, removed: safeName, paths: removed });
});

app.get('/api/default-pages', (_req, res) => {
  const files = getDefaultPageFiles();
  res.json({ files });
});

app.post('/api/default-pages/seed', (req, res) => {
  const requested = Array.isArray(req.body?.files) ? req.body.files : [];
  const available = new Set(getFiles(DEFAULT_PAGES_DIR, isDisplayXml).map((f) => f.name.toLowerCase()));
  const selected = requested.length
    ? requested
        .map((name) => safeDisplayFileName(name))
        .filter((name) => isDisplayXml(name) && available.has(name.toLowerCase()))
    : getFiles(DEFAULT_PAGES_DIR, isDisplayXml).map((file) => file.name);

  const uniqueSelected = [...new Set(selected)];
  if (!uniqueSelected.length) {
    return res.status(400).json({ error: 'No default template files selected' });
  }

  const copied = [];
  for (const name of uniqueSelected) {
    const fromPath = path.join(DEFAULT_PAGES_DIR, name);
    if (!fs.existsSync(fromPath)) {
      continue;
    }

    const toPath = path.join(REIMPORT_DIR, name);
    fs.copyFileSync(fromPath, toPath);
    clearDeletedDisplay(name);
    copied.push(name);
  }

  if (!copied.length) {
    return res.status(400).json({ error: 'No template files were copied' });
  }

  return res.json({ ok: true, copied, targetFolder: REIMPORT_DIR });
});

app.get('/api/default-pages/:name', (req, res) => {
  const resolved = resolveDefaultPagePath(req.params.name);
  if (!resolved) {
    return res.status(404).json({ error: 'Default template file not found' });
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

app.post('/api/default-pages/:name/save', (req, res) => {
  const safeName = safeDisplayFileName(req.params.name);
  if (!isDisplayXml(safeName)) {
    return res.status(400).json({ error: 'Only XML files are supported' });
  }

  const xml = String(req.body?.xml || '');
  if (!xml.trim()) {
    return res.status(400).json({ error: 'xml content is required' });
  }

  const savePath = path.join(DEFAULT_PAGES_DIR, safeName);
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

app.delete('/api/default-pages/:name', (req, res) => {
  const safeName = safeDisplayFileName(req.params.name);
  if (!isDisplayXml(safeName)) {
    return res.status(400).json({ error: 'Only XML files are supported' });
  }

  const filePath = path.join(DEFAULT_PAGES_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Default template file not found' });
  }

  fs.unlinkSync(filePath);
  return res.json({ ok: true, removed: safeName, path: filePath });
});

app.post('/api/displays/package', (req, res) => {
  const requested = Array.isArray(req.body?.files) ? req.body.files : [];
  const packageMode = String(req.body?.packageMode || 'xml').toLowerCase() === 'restore'
    ? 'restore'
    : 'xml';
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

  const importPackageDir = packageMode === 'restore'
    ? path.join(packagePath, 'Edited_Display_Import')
    : packagePath;
  fs.mkdirSync(importPackageDir, { recursive: true });

  const copied = [];
  for (const name of uniqueSelected) {
    const resolved = resolveDisplayPath(name);
    if (!resolved) {
      continue;
    }

    fs.copyFileSync(resolved.filePath, path.join(importPackageDir, name));
    copied.push(name);
  }

  if (!copied.length) {
    return res.status(400).json({ error: 'No valid files found to package' });
  }

  const packageFiles = buildDisplayBatchFiles(
    importPackageDir,
    copied,
    packageMode === 'restore'
      ? [
          'This restore bundle contains a base FactoryTalk archive (.apa/.mer) plus the edited XML import package.',
          'Restore the included archive first, then import the edited displays from the Edited_Display_Import folder.',
          ''
        ]
      : []
  );

  let packageType = 'xml-batch';
  let archivePath = null;
  let archiveType = null;
  let restoreMenuLabel = null;
  if (packageMode === 'restore') {
    const archiveInfo = findProjectArchiveInfo();
    if (!archiveInfo) {
      return res.status(500).json({ error: 'FactoryTalk archive (.apa or .mer) was not found for restore bundle packaging' });
    }

    archivePath = archiveInfo.archivePath;
    archiveType = archiveInfo.archiveType;
    restoreMenuLabel = archiveInfo.restoreMenuLabel;

    const archiveName = path.basename(archivePath);
    fs.copyFileSync(archivePath, path.join(packagePath, archiveName));
    const restoreGuide = [
      'FactoryTalk Restore Bundle',
      '',
      `1. Restore the base project archive: ${archiveName}`,
      `   Use Application Manager -> ${restoreMenuLabel}.`,
      '2. Open the restored project in FactoryTalk View Studio.',
      '3. Go to the Edited_Display_Import folder inside this ZIP extraction.',
      '4. Run Batch Import using Edited_Display_Import\\BatchImport.xml.',
      '5. If needed, delete existing target displays first using Edited_Display_Import\\DeleteTargets.txt.',
      '',
      'Important:',
      '- The included archive is the base project restore source.',
      '- The edited XML files are still imported as a second step after restore.',
      '- If the archive is .mer, runtime restore/editability depends on how that MER was created and your FactoryTalk version.',
      '- FactoryTalk ME batch import does not recreate display folders automatically.'
    ].join('\r\n') + '\r\n';
    fs.writeFileSync(path.join(packagePath, 'Restore_Project_First.txt'), restoreGuide, 'utf8');
    packageType = 'restore-bundle';
  }

  return res.json({
    ok: true,
    packagePath,
    files: copied,
    batchFile: packageFiles.batchPath,
    batchFileFoldered: packageFiles.batchFolderedPath,
    batchFileFlat: packageFiles.batchFlatPath,
    archivePath,
    archiveType,
    restoreMenuLabel,
    packageType,
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

  let archive;
  try {
    archive = createZipArchive();
  } catch (err) {
    return res.status(500).json({ error: `Failed to initialize zip archiver: ${err.message}` });
  }

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

const watcher = chokidar.watch([FACTORYTALK_EXPORT_DIR, REIMPORT_DIR, PACKAGE_DIR, DEFAULT_PAGES_DIR], {
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
