const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const archiver = require('archiver');
const chokidar = require('chokidar');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = Number(process.env.PORT) || 5050;
const HOST = process.env.HOST || '0.0.0.0';

function getNetworkAddresses() {
  const addresses = new Set();
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const item of interfaces || []) {
      const family = item?.family;
      const isIPv4 = family === 'IPv4' || family === 4;
      if (isIPv4 && !item.internal && item.address) {
        addresses.add(item.address);
      }
    }
  }
  return [...addresses];
}
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
const PROJECTS_STORE_PATH = path.join(FTIO_DIR, 'projects-store.json');

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

for (const dir of [FTIO_DIR, FACTORYTALK_EXPORT_DIR, REIMPORT_DIR, PACKAGE_DIR, DEFAULT_PAGES_DIR, IMAGE_LIBRARY_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

app.use(express.json({ limit: '50mb' }));
app.get('/vendor/xlsx.full.min.js', (_req, res) => {
  res.sendFile(path.join(ROOT, 'node_modules', 'xlsx', 'dist', 'xlsx.full.min.js'));
});
app.use(express.static(path.join(ROOT, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    const ext = path.extname(String(filePath || '')).toLowerCase();
    if (ext === '.js' || ext === '.css' || ext === '.html') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
  }
}));

function getNodeIoTags() {
  if (getNodeIoTags.cache) {
    return getNodeIoTags.cache;
  }

  const XLSX = require('xlsx');
  const code = fs.readFileSync(path.join(ROOT, 'public', 'io-tags.js'), 'utf8');
  const ctx = vm.createContext({ XLSX });
  ctx.globalThis = ctx;
  vm.runInContext(code, ctx);
  getNodeIoTags.cache = ctx.IoTags;
  return getNodeIoTags.cache;
}

app.post('/api/convert-io-list-xlsx', express.raw({ type: '*/*', limit: '30mb' }), (req, res) => {
  try {
    if (!req.body?.length) {
      return res.status(400).json({ error: 'Empty Excel upload.' });
    }

    const IoTags = getNodeIoTags();
    const result = IoTags.convertIoListUpload(Buffer.from(req.body), {
      sourceName: 'upload.xlsx'
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Could not convert Excel IO list.' });
  }
});

app.post('/api/export-zone-tags-csv', express.json({ limit: '50mb' }), (req, res) => {
  try {
    const zone = String(req.body?.zone || '').trim();
    const sheets = Array.isArray(req.body?.sheets) ? req.body.sheets : [];
    if (!zone) {
      return res.status(400).json({ error: 'Export zone is required.' });
    }
    if (!sheets.length) {
      return res.status(400).json({ error: 'IO List sheet data is required.' });
    }

    const IoTags = getNodeIoTags();
    const csv = IoTags.buildZoneTagsCsv(sheets, zone, {
      zoneRioModules: req.body?.zoneRioModules || null,
      manualZoneRioModules: req.body?.manualZoneRioModules || {}
    });
    const validation = IoTags.validateFactoryTalkZoneTagsCsv(csv);
    if (!validation.ok) {
      return res.status(400).json({
        error: `Tags CSV export is incomplete (${validation.folderCount} folders, ${validation.digitalTagCount} PLC tags).`,
        validation
      });
    }

    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const body = Buffer.from(csv, 'utf8');
    const safeZone = zone.replace(/[^\w.-]+/g, '_').replace(/_+/g, '_') || 'Zone';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeZone}-Tags.CSV"`);
    return res.send(Buffer.concat([bom, body]));
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Could not export zone Tags CSV.' });
  }
});

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

function sanitizeXmlForFactoryTalk(xml) {
  const source = String(xml || '');
  if (!source) {
    return source;
  }

  const stripTagAttrs = (input, tagName, attrs) => {
    const attrPattern = attrs.join('|');
    const openTagPattern = new RegExp(`<\\s*${tagName}\\b[^>]*>`, 'gi');
    const attrStripPattern = new RegExp(`\\s+(${attrPattern})\\s*=\\s*("[^"]*"|'[^']*')`, 'gi');
    return String(input || '').replace(openTagPattern, (tag) => tag.replace(attrStripPattern, ''));
  };

  const stripParametersFromNonReferenceGroups = (input) => {
    const text = String(input || '');
    const tagPattern = /<\/?([A-Za-z_][\w:.-]*)([^>]*)>/g;
    const stack = [];
    const removalRanges = [];
    let match = tagPattern.exec(text);

    while (match) {
      const fullTag = match[0];
      const tagName = String(match[1] || '').toLowerCase();
      const attrs = String(match[2] || '');
      const isClosing = fullTag.startsWith('</');
      const isSelfClosing = /\/\s*>$/.test(fullTag);
      const tagStart = match.index;
      const tagEnd = tagPattern.lastIndex;

      if (isClosing) {
        if (tagName === 'parameters') {
          const top = stack[stack.length - 1];
          if (top && top.tagName === 'parameters') {
            stack.pop();
            if (top.remove) {
              removalRanges.push([top.startIndex, tagEnd]);
            }
          }
        } else if (tagName === 'group') {
          while (stack.length) {
            const top = stack.pop();
            if (top.tagName === 'group') {
              break;
            }
          }
        }

        match = tagPattern.exec(text);
        continue;
      }

      if (tagName === 'group' && !isSelfClosing) {
        const isReferenceObject = /\bisReferenceObject\s*=\s*("true"|'true')/i.test(attrs);
        stack.push({ tagName: 'group', isNonReference: !isReferenceObject });
        match = tagPattern.exec(text);
        continue;
      }

      if (tagName === 'parameters') {
        const parent = stack[stack.length - 1];
        const remove = Boolean(parent && parent.tagName === 'group' && parent.isNonReference);
        if (isSelfClosing) {
          if (remove) {
            removalRanges.push([tagStart, tagEnd]);
          }
        } else {
          stack.push({ tagName: 'parameters', startIndex: tagStart, remove });
        }
      }

      match = tagPattern.exec(text);
    }

    if (!removalRanges.length) {
      return text;
    }

    let output = text;
    removalRanges.sort((a, b) => b[0] - a[0]);
    for (const [start, end] of removalRanges) {
      output = output.slice(0, start) + output.slice(end);
    }
    return output;
  };

  let sanitized = source
    .replace(/\s+popupGroupId="[^"]*"/gi, '')
    .replace(/\s+popupGroupId='[^']*'/gi, '');

  const stripConnectionGeometry = /(<\s*connections?\b[^>]*?)\s+(left|top|width|height)=("[^"]*"|'[^']*')/gi;
  let previous = null;
  while (sanitized !== previous) {
    previous = sanitized;
    sanitized = sanitized.replace(stripConnectionGeometry, '$1');
  }

  const normalizePopupGroupBlock = (block) => {
    const openTagMatch = block.match(/^<group\b[^>]*>/i);
    const closeTag = '</group>';
    if (!openTagMatch || !block.endsWith(closeTag)) {
      return block;
    }

    let openTag = openTagMatch[0];
    let inner = block.slice(openTag.length, block.length - closeTag.length);
    const groupNameMatch = openTag.match(/\bname="([^"]+)"/i);
    const groupName = String(groupNameMatch?.[1] || '');
    const suffixMatch = groupName.match(/(\d+)$/);
    const suffix = suffixMatch ? suffixMatch[1] : '1';
    const widthMatch = openTag.match(/\bwidth="(-?\d+)"/i);
    const heightMatch = openTag.match(/\bheight="(-?\d+)"/i);
    const groupWidth = Number(widthMatch?.[1] || 1);
    const groupHeight = Number(heightMatch?.[1] || 1);

    const childPoints = [];
    const pointPattern = /\bleft="(-?\d+)"[^>]*\btop="(-?\d+)"|\btop="(-?\d+)"[^>]*\bleft="(-?\d+)"/gi;
    let pointMatch = pointPattern.exec(inner);
    while (pointMatch) {
      const left = Number(pointMatch[1] || pointMatch[4]);
      const top = Number(pointMatch[2] || pointMatch[3]);
      if (Number.isFinite(left) && Number.isFinite(top)) {
        childPoints.push({ left, top });
      }
      pointMatch = pointPattern.exec(inner);
    }

    if (!childPoints.length) {
      return block;
    }

    const minLeft = Math.min(...childPoints.map((entry) => entry.left));
    const minTop = Math.min(...childPoints.map((entry) => entry.top));
    const appearsAbsolute = minLeft > Math.max(1, groupWidth) || minTop > Math.max(1, groupHeight);
    if (!appearsAbsolute) {
      inner = inner.replace(/<\s*([A-Za-z_][\w\-]*)\b([^>]*?)\bname="([^"]+)"([^>]*)>/g, (full, tag, leftAttrs, nameValue, rightAttrs) => {
        const lowerTag = String(tag || '').toLowerCase();
        const attrsText = `${leftAttrs || ''}${rightAttrs || ''}`;
        const isVisual = /\b(left|top|width|height)=/i.test(attrsText);
        if (!isVisual || ['connection', 'connections', 'parameter', 'parameters'].includes(lowerTag)) {
          return full;
        }

        const nextName = String(nameValue || '').endsWith(`_${suffix}`)
          ? String(nameValue || '')
          : `${String(nameValue || '')}_${suffix}`;
        return full.replace(/\bname="[^"]+"/i, `name="${nextName}"`);
      });
      return `${openTag}${inner}${closeTag}`;
    }

    inner = inner
      .replace(/\bleft="(-?\d+)"/gi, (_m, value) => `left="${Math.round(Number(value) - minLeft)}"`)
      .replace(/\btop="(-?\d+)"/gi, (_m, value) => `top="${Math.round(Number(value) - minTop)}"`);

    if (/\bleft="-?\d+"/i.test(openTag)) {
      openTag = openTag.replace(/\bleft="-?\d+"/i, `left="${Math.round(minLeft)}"`);
    } else {
      openTag = openTag.replace(/<group\b/i, `<group left="${Math.round(minLeft)}"`);
    }

    if (/\btop="-?\d+"/i.test(openTag)) {
      openTag = openTag.replace(/\btop="-?\d+"/i, `top="${Math.round(minTop)}"`);
    } else {
      openTag = openTag.replace(/<group\b/i, `<group top="${Math.round(minTop)}"`);
    }

    inner = inner.replace(/<\s*([A-Za-z_][\w\-]*)\b([^>]*?)\bname="([^"]+)"([^>]*)>/g, (full, tag, leftAttrs, nameValue, rightAttrs) => {
      const lowerTag = String(tag || '').toLowerCase();
      const attrsText = `${leftAttrs || ''}${rightAttrs || ''}`;
      const isVisual = /\b(left|top|width|height)=/i.test(attrsText);
      if (!isVisual || ['connection', 'connections', 'parameter', 'parameters'].includes(lowerTag)) {
        return full;
      }

      const nextName = String(nameValue || '').endsWith(`_${suffix}`)
        ? String(nameValue || '')
        : `${String(nameValue || '')}_${suffix}`;
      return full.replace(/\bname="[^"]+"/i, `name="${nextName}"`);
    });

    return `${openTag}${inner}${closeTag}`;
  };

  sanitized = sanitized.replace(
    /<group\b[^>]*name="[^"]*popup[^"]*"[^>]*>[\s\S]*?<\/group>/gi,
    (block) => normalizePopupGroupBlock(block)
  );

  sanitized = sanitized.replace(/<rectangle\b[^>]*>/gi, (tag) => {
    let next = tag;

    const borderWidthMatch = next.match(/\bborderWidth=("[^"]*"|'[^']*')/i);
    if (borderWidthMatch && !/\blineWidth=("[^"]*"|'[^']*')/i.test(next)) {
      next = next.replace(/<rectangle\b/i, `<rectangle lineWidth=${borderWidthMatch[1]}`);
    }

    const borderColorMatch = next.match(/\bborderColor=("[^"]*"|'[^']*')/i);
    if (borderColorMatch && !/\bforeColor=("[^"]*"|'[^']*')/i.test(next)) {
      next = next.replace(/<rectangle\b/i, `<rectangle foreColor=${borderColorMatch[1]}`);
    }

    const borderStyleMatch = next.match(/\bborderStyle=("[^"]*"|'[^']*')/i);
    if (borderStyleMatch && !/\blineStyle=("[^"]*"|'[^']*')/i.test(next)) {
      const raw = String(borderStyleMatch[1]).slice(1, -1).trim().toLowerCase();
      const mapped = raw === 'line' ? 'solid' : raw;
      if (mapped) {
        next = next.replace(/<rectangle\b/i, `<rectangle lineStyle="${mapped}"`);
      }
    }

    next = next
      .replace(/\s+borderWidth=("[^"]*"|'[^']*')/gi, '')
      .replace(/\s+borderColor=("[^"]*"|'[^']*')/gi, '')
      .replace(/\s+borderStyle=("[^"]*"|'[^']*')/gi, '')
      .replace(/\s+borderUsesBackColor=("[^"]*"|'[^']*')/gi, '')
      .replace(/\s+(fontFamily|fontSize|bold|italic|underline|strikethrough|charHeight|charWidth|alignment|wordWrap|sizeToFit|caption)=("[^"]*"|'[^']*')/gi, '');

    return next;
  });

  sanitized = sanitized.replace(/<multistateIndicator\b[^>]*>/gi, (tag) => tag
    .replace(/\s+(fontSize|lineWidth)=("[^"]*"|'[^']*')/gi, ''));

  sanitized = sanitized.replace(/<(states|state|imageSettings|connections|connection)\b[^>]*>/gi, (tag) => tag
    .replace(/\s+(left|top|width|height|fontSize|borderWidth|lineWidth)=("[^"]*"|'[^']*')/gi, ''));

  sanitized = sanitized.replace(/<caption\b[^>]*>/gi, (tag) => tag
    .replace(/\s+(left|top|width|height|borderWidth|lineWidth)=("[^"]*"|'[^']*')/gi, ''));

  // Explicit pass for connection tags to avoid schema-invalid carryover from legacy exports.
  sanitized = stripTagAttrs(sanitized, 'connections?', ['left', 'top', 'width', 'height', 'fontSize', 'borderWidth', 'lineWidth']);

  sanitized = sanitized
    .replace(/(<\s*numericInputCursorPoint\b[^>]*?)\s+caption=("[^"]*"|'[^']*')/gi, '$1')
    .replace(/<\s*numericInputCursorPoint\b([^>]*)>([\s\S]*?)<\s*caption\b[^>]*\/?>(?:<\s*\/\s*caption\s*>)?/gi, '<numericInputCursorPoint$1>$2');

  sanitized = stripParametersFromNonReferenceGroups(sanitized);

  return sanitized;
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

function resolveDisplayGroupName(name, folderMap, assignments = {}) {
  const assigned = sanitizeFolderName(assignments[String(name || '').toLowerCase()] || '');
  if (assigned) {
    return assigned;
  }

  const number = parseDisplayNumber(name);
  if (Number.isFinite(number)) {
    const bucket = Math.floor(number / 100) * 100;
    const folderName = folderMap.get(bucket);
    if (folderName) {
      return folderName;
    }
  }

  return path.basename(String(name || ''), path.extname(String(name || '')));
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

function syncDeletedDisplayState(name) {
  const safeName = safeDisplayFileName(name);
  if (!safeName) {
    return;
  }

  const editedPath = path.join(REIMPORT_DIR, safeName);
  const exportPath = path.join(FACTORYTALK_EXPORT_DIR, safeName);
  if (fs.existsSync(editedPath) || fs.existsSync(exportPath)) {
    clearDeletedDisplay(safeName);
    return;
  }

  markDisplayDeleted(safeName);
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
  return getFiles(DEFAULT_PAGES_DIR, isDisplayXml)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }))
    .map((file) => {
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
  if (fs.existsSync(templatePath)) {
    return { filePath: templatePath, source: 'default-template', name: safeName };
  }

  const reimportPath = path.join(REIMPORT_DIR, safeName);
  if (fs.existsSync(reimportPath)) {
    return { filePath: reimportPath, source: 'reimport', name: safeName };
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
  const { assignments } = readDisplayFolderConfig();
  const folderMap = buildFolderMap(copied);
  const batchFlatLines = ['<gfxImport>'];
  for (const name of copied) {
    const displayGroup = resolveDisplayGroupName(name, folderMap, assignments);
    batchFlatLines.push(`    <import importFile="${name}" displayGroup="${displayGroup}"/>`);
  }
  batchFlatLines.push('</gfxImport>');
  const batchXmlFlat = `${batchFlatLines.join('\r\n')}\r\n`;

  const batchName = 'BatchImport.xml';
  const batchPath = path.join(targetDir, batchName);

  writeUtf16LeWithBom(batchPath, batchXmlFlat);

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
    `Batch file: ${batchName}`,
    '',
    'Import steps (important):',
    '1. Close all target displays before import.',
    '2. In FactoryTalk Batch Import, choose BatchImport.xml from this extracted folder.',
    '3. Set conflict handling to REPLACE/OVERWRITE existing displays (do not merge/update).',
    '4. If REPLACE is not available in your dialog, delete the target displays first using DeleteTargets.txt, then import.',
    '5. If status says "display does not exist", your import is in update mode; switch to replace/create mode or create that display once and retry.',
    '',
    'If you import in merge mode, messages like "element already exists and will be ignored" are expected.',
    'This means the display already existed - delete it first, then reimport.'
  ];
  const notesText = `${notesLines.join('\r\n')}\r\n`;
  writeUtf16LeWithBom(path.join(targetDir, notesName), notesText);
  writeUtf16LeWithBom(path.join(targetDir, notesCompatName), notesText);

  const displayNames = copied.map((name) => name.replace(/\.xml$/i, ''));
  const deleteText = [
    'Delete these displays first if FactoryTalk import is merging instead of replacing:',
    ...displayNames.map((name) => `- ${name}`),
    '',
    'After deleting, run Batch Import with BatchImport.xml from this folder.'
  ].join('\r\n') + '\r\n';
  writeUtf16LeWithBom(path.join(targetDir, deleteListName), deleteText);

  return {
    batchPath,
    batchFolderedPath: null,
    batchFlatPath: batchPath,
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

function readProjectsStore() {
  try {
    if (!fs.existsSync(PROJECTS_STORE_PATH)) {
      return [];
    }

    const parsed = JSON.parse(fs.readFileSync(PROJECTS_STORE_PATH, 'utf8'));
    return Array.isArray(parsed?.projects) ? parsed.projects : [];
  } catch (_err) {
    return [];
  }
}

function writeProjectsStore(projects) {
  const payload = {
    projects: Array.isArray(projects) ? projects : [],
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(PROJECTS_STORE_PATH, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

app.get('/api/projects', (_req, res) => {
  return res.json({ projects: readProjectsStore() });
});

app.post('/api/projects', (req, res) => {
  const projects = req.body?.projects;
  if (!Array.isArray(projects)) {
    return res.status(400).json({ error: 'projects array required' });
  }

  const saved = writeProjectsStore(projects);
  return res.json({ ok: true, count: saved.projects.length, updatedAt: saved.updatedAt });
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

function listImageLibraryFiles() {
  if (!fs.existsSync(IMAGE_LIBRARY_DIR)) {
    return [];
  }

  const allowed = new Set(['.bmp', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp']);
  return fs.readdirSync(IMAGE_LIBRARY_DIR)
    .filter((file) => {
      const fullPath = path.join(IMAGE_LIBRARY_DIR, file);
      if (!fs.statSync(fullPath).isFile()) {
        return false;
      }
      return allowed.has(path.extname(file).toLowerCase());
    })
    .map((file) => ({
      file,
      name: path.basename(file, path.extname(file))
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
}

function sanitizeImageUploadFileName(name) {
  const base = path.basename(String(name || '').trim());
  if (!base) {
    return null;
  }

  const ext = path.extname(base).toLowerCase();
  const allowed = new Set(['.bmp', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp']);
  if (!allowed.has(ext)) {
    return null;
  }

  const stem = path.basename(base, ext).replace(/[^a-zA-Z0-9._ \-()]+/g, '_').trim();
  if (!stem) {
    return null;
  }

  return `${stem}${ext}`;
}

app.get('/api/images', (_req, res) => {
  const files = listImageLibraryFiles();
  return res.json({
    folder: IMAGE_LIBRARY_DIR,
    files: files.map((entry) => entry.name),
    entries: files
  });
});

app.post('/api/images/upload', express.raw({ type: '*/*', limit: '25mb' }), (req, res) => {
  try {
    if (!req.body?.length) {
      return res.status(400).json({ error: 'Empty image upload.' });
    }

    const rawName = String(req.query.name || req.headers['x-image-filename'] || 'upload.png').trim();
    const safeName = sanitizeImageUploadFileName(rawName);
    if (!safeName) {
      return res.status(400).json({ error: 'Unsupported image type. Use bmp, png, jpg, gif, svg, ico, or webp.' });
    }

    if (!fs.existsSync(IMAGE_LIBRARY_DIR)) {
      fs.mkdirSync(IMAGE_LIBRARY_DIR, { recursive: true });
    }

    const savePath = path.join(IMAGE_LIBRARY_DIR, safeName);
    fs.writeFileSync(savePath, Buffer.from(req.body));

    const imageName = path.basename(safeName, path.extname(safeName));
    return res.json({
      ok: true,
      file: safeName,
      name: imageName,
      folder: IMAGE_LIBRARY_DIR,
      sizeBytes: req.body.length
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not save image.' });
  }
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

  const xml = sanitizeXmlForFactoryTalk(String(req.body?.xml || ''));
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

  syncDeletedDisplayState(safeName);

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
    const sourceXml = readTextAuto(fromPath);
    const safeXml = sanitizeXmlForFactoryTalk(sourceXml);
    fs.writeFileSync(toPath, safeXml, 'utf8');
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

  const xml = sanitizeXmlForFactoryTalk(String(req.body?.xml || ''));
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
  const packageMode = 'xml';
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

  const importPackageDir = packagePath;
  fs.mkdirSync(importPackageDir, { recursive: true });

  const copied = [];
  for (const name of uniqueSelected) {
    const resolved = resolveDisplayPath(name);
    if (!resolved) {
      continue;
    }

    const sourceXml = readTextAuto(resolved.filePath);
    const safeXml = sanitizeXmlForFactoryTalk(sourceXml);
    fs.writeFileSync(path.join(importPackageDir, name), safeXml, 'utf8');
    copied.push(name);
  }

  if (!copied.length) {
    return res.status(400).json({ error: 'No valid files found to package' });
  }

  const packageFiles = buildDisplayBatchFiles(
    importPackageDir,
    copied,
    []
  );

  let packageType = 'xml-batch';
  let archivePath = null;
  let archiveType = null;
  let restoreMenuLabel = null;

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

server.listen(PORT, HOST, () => {
  console.log(`web-hmi-bridge listening on port ${PORT}`);
  console.log(`  Local:   http://localhost:${PORT}`);
  for (const address of getNetworkAddresses()) {
    console.log(`  Network: http://${address}:${PORT}`);
  }
  if (HOST === '0.0.0.0') {
    console.log('  Share a Network URL above with others on the same LAN.');
  }
  console.log(`Reading FactoryTalk display exports from: ${FACTORYTALK_EXPORT_DIR}`);
  console.log(`Writing edited files and import packages to: ${REIMPORT_DIR}`);
});
