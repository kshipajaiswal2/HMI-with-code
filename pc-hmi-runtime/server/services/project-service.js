const fs = require('fs');
const path = require('path');
const { defaultTemplateComponents } = require('../../config/template-components');
const { composeScreen } = require('../../config/template-compose');
const IoListTags = require('../../shared/io-list-tags');

const DISPLAY_FOLDERS = [
  { id: '100_Overview', label: '100 Overview', navGroup: 'overview' },
  { id: '200_Settings', label: '200 Settings', navGroup: 'settings' },
  { id: '300_Manual_Operation', label: '300 Manual Operation', navGroup: 'manual' },
  { id: '400_Active_Alarms', label: '400 Active Alarms', navGroup: 'alarms' },
  { id: '500_Recipe', label: '500 Recipe', navGroup: 'recipe' },
  { id: '600_Legends', label: '600 Legends', navGroup: 'legends' },
  { id: '700_User_Management', label: '700 User Management', navGroup: 'users' }
];

const WINDOW_SIZE_PRESETS = [
  { id: '640x480', label: "PVPlus 7 Standard/Performance 6''/7'' (640x480)", width: 640, height: 480 },
  { id: '800x480', label: "PVPlus 7 Standard/Performance 9'' Wide (800x480)", width: 800, height: 480 },
  { id: '800x600', label: "PVPlus 7 Standard/Performance 10'' (800x600)", width: 800, height: 600 },
  { id: '1280x800', label: "PVPlus 7 Standard/Performance 12'' Wide (1280x800)", width: 1280, height: 800 },
  { id: '1024x768', label: "PVPlus 7 Standard/Performance 15'' (1024x768)", width: 1024, height: 768 },
  { id: '1280x1024', label: "PVPlus 7 Performance 19'' (1280x1024)", width: 1280, height: 1024 }
];

const STUDIO_VERSION = 'Plant HMI Studio 1.0';

/** Canonical FT-style starter project — Gfx, Template.json, tags, and navigation are synced from here */
const STARTER_REFERENCE_PROJECT = 'a';

const DEFAULT_DISPLAY_BACKGROUND = '#EBEBEB';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg']);

const IMAGE_FORMAT_LABELS = {
  '.png': 'PNG',
  '.jpg': 'JPEG',
  '.jpeg': 'JPEG',
  '.gif': 'GIF',
  '.bmp': 'BMP',
  '.ico': 'ICO',
  '.webp': 'WEBP',
  '.svg': 'SVG'
};

function detectImageFormat(buf, ext) {
  if (buf.length >= 8 && buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return 'png';
  if (buf.length >= 2 && buf.readUInt16LE(0) === 0x4D42) return 'bmp';
  if (buf.length >= 6 && buf.toString('ascii', 0, 3) === 'GIF') return 'gif';
  if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xD8) return 'jpeg';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buf.length >= 6 && buf.readUInt16LE(0) === 0 && buf.readUInt16LE(2) === 1) return 'ico';
  const head = buf.slice(0, Math.min(buf.length, 256)).toString('utf8').trimStart();
  if (head.startsWith('<svg') || (ext === '.svg' && head.includes('<svg'))) return 'svg';
  return ext.replace(/^\./, '').toLowerCase() || 'unknown';
}

function readPngDimensions(buf) {
  if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') return null;
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bitDepth: buf[24],
    colorType: buf[25]
  };
}

function readBmpDimensions(buf) {
  if (buf.length < 28 || buf.readUInt16LE(0) !== 0x4D42) return null;
  const headerSize = buf.readUInt32LE(14);
  if (headerSize < 12) return null;
  const width = buf.readInt32LE(18);
  const height = Math.abs(buf.readInt32LE(22));
  const bitDepth = headerSize >= 16 ? buf.readUInt16LE(28) : null;
  return {
    width,
    height,
    bitDepth,
    colorType: bitDepth != null && bitDepth <= 8 ? 3 : 2
  };
}

function readGifDimensions(buf) {
  if (buf.length < 10 || buf.toString('ascii', 0, 3) !== 'GIF') return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8), bitDepth: 8, colorType: 3 };
}

function readJpegDimensions(buf) {
  if (buf.length < 4 || buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
  let offset = 2;
  while (offset < buf.length - 8) {
    if (buf[offset] !== 0xFF) break;
    const marker = buf[offset + 1];
    const len = buf.readUInt16BE(offset + 2);
    if (len < 2 || offset + 2 + len > buf.length) break;
    if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
      return {
        width: buf.readUInt16BE(offset + 7),
        height: buf.readUInt16BE(offset + 5),
        bitDepth: buf[offset + 4] * (marker === 0xC2 || marker === 0xC6 || marker === 0xCA || marker === 0xCE ? 3 : 1),
        colorType: 2
      };
    }
    offset += 2 + len;
  }
  return null;
}

function readWebpDimensions(buf) {
  if (buf.length < 30 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8X' && buf.length >= 30) {
    return {
      width: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
      height: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
      bitDepth: 8,
      colorType: 2
    };
  }
  if (chunk === 'VP8 ' && buf.length >= 30) {
    return {
      width: buf.readUInt16LE(26) & 0x3fff,
      height: buf.readUInt16LE(28) & 0x3fff,
      bitDepth: 8,
      colorType: 2
    };
  }
  return null;
}

function readIcoDimensions(buf) {
  if (buf.length < 22 || buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) return null;
  const width = buf[6] === 0 ? 256 : buf[6];
  const height = buf[7] === 0 ? 256 : buf[7];
  return { width, height, bitDepth: buf[8], colorType: buf[8] <= 8 ? 3 : 2 };
}

function readSvgDimensions(buf) {
  const text = buf.toString('utf8');
  const tagMatch = text.match(/<svg\b[^>]*>/i);
  if (!tagMatch) return null;
  const tag = tagMatch[0];
  const widthMatch = tag.match(/\bwidth=["']([\d.]+)/i);
  const heightMatch = tag.match(/\bheight=["']([\d.]+)/i);
  const viewMatch = tag.match(/\bviewBox=["'][\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/i);
  const width = widthMatch ? Math.round(Number(widthMatch[1])) : (viewMatch ? Math.round(Number(viewMatch[1])) : 0);
  const height = heightMatch ? Math.round(Number(heightMatch[1])) : (viewMatch ? Math.round(Number(viewMatch[2])) : 0);
  if (!width || !height) return null;
  return { width, height, bitDepth: 8, colorType: 2 };
}

function readImageFileMeta(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const buf = fs.readFileSync(filePath);
  const kind = detectImageFormat(buf, ext);

  let parsed = null;
  switch (kind) {
    case 'png': parsed = readPngDimensions(buf); break;
    case 'bmp': parsed = readBmpDimensions(buf); break;
    case 'gif': parsed = readGifDimensions(buf); break;
    case 'jpeg': parsed = readJpegDimensions(buf); break;
    case 'webp': parsed = readWebpDimensions(buf); break;
    case 'ico': parsed = readIcoDimensions(buf); break;
    case 'svg': parsed = readSvgDimensions(buf); break;
    default: break;
  }

  const width = parsed?.width || 0;
  const height = parsed?.height || 0;
  const bitDepth = parsed?.bitDepth ?? null;
  const colorType = parsed?.colorType ?? null;

  const formatKey = kind === 'jpeg' ? '.jpg' : `.${kind}`;
  const format = IMAGE_FORMAT_LABELS[formatKey] || kind.toUpperCase() || ext.replace(/^\./, '').toUpperCase() || 'Unknown';
  let typeLabel = 'True color';
  if (bitDepth === 1) typeLabel = 'Monochrome';
  else if (colorType === 3) typeLabel = '256 color';
  else if (colorType === 0 || colorType === 4) typeLabel = 'Grayscale';

  return {
    width,
    height,
    bitDepth,
    colorType,
    format,
    typeLabel
  };
}

/** FactoryTalk-style on-disk project layout (one folder per project under projects/) */
const PROJECT_FOLDERS = [
  'Accounts',
  'ActivityLog',
  'AuditTrail',
  'Cache',
  'Comprf',
  'CSVExport',
  'DLG',
  'Gfx',
  'Global Objects',
  'GlobalConn',
  'Images',
  'Information',
  'KepServer',
  'Local',
  'M_Alarms',
  'Macros',
  'PAR',
  'PrivateDirectory',
  'ProjectSettings',
  'RecipePlus',
  'Startup',
  'Tag',
  IoListTags.PLC_UPLOADED_TAGS_FOLDER
];

function pauseMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { /* spin */ }
}

function readFileWithRetry(filePath, attempts = 5) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      lastErr = err;
      const retryable = ['EBUSY', 'EPERM', 'EACCES', 'UNKNOWN'].includes(err.code)
        || /unknown error/i.test(String(err.message));
      if (i + 1 < attempts && retryable) pauseMs(30 * (i + 1));
    }
  }
  throw lastErr;
}

function writeJsonFileSafe(filePath, data, attempts = 6) {
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  const dir = path.dirname(filePath);
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    const tmp = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.${i}.tmp`);
    try {
      fs.writeFileSync(tmp, payload, 'utf8');
      fs.copyFileSync(tmp, filePath);
      try { fs.unlinkSync(tmp); } catch { /* ignore */ }
      return;
    } catch (err) {
      lastErr = err;
      try { fs.unlinkSync(tmp); } catch { /* ignore */ }
      const retryable = ['EBUSY', 'EPERM', 'EACCES', 'UNKNOWN'].includes(err.code)
        || /unknown error/i.test(String(err.message));
      if (i + 1 < attempts && retryable) pauseMs(50 * (i + 1));
    }
  }
  throw lastErr;
}

function isPlcUploadedTag(tag) {
  const folder = String(tag?.folder || '').trim();
  return folder === IoListTags.PLC_UPLOADED_TAGS_FOLDER
    || folder === 'PLC uploaded Tags';
}

function splitProjectTags(tags) {
  const hmiTags = [];
  const plcTags = [];
  for (const tag of tags || []) {
    if (isPlcUploadedTag(tag)) plcTags.push(tag);
    else hmiTags.push(tag);
  }
  return { hmiTags, plcTags };
}

function tagCsvLines(tags) {
  const csvLines = ['Tag Name,Type,Description,PLC Address'];
  for (const t of tags || []) {
    const desc = String(t.description || '').replace(/"/g, '""');
    const plc = String(t.plcAddress || t.connection || t.alias || '').replace(/"/g, '""');
    csvLines.push(`"${t.name}","${t.type}","${desc}","${plc}"`);
  }
  return csvLines.join('\r\n') + '\r\n';
}

class ProjectService {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.projectsDir = path.join(rootDir, 'projects');
    this.templateDir = path.join(this.projectsDir, '_template');
    this.standardScreensPath = path.join(rootDir, 'config', 'standard-screens.json');
    this.activeFile = path.join(this.projectsDir, '.active.json');
    this._displaySyncLocks = new Set();
    this._layoutEnsured = new Set();
    if (!fs.existsSync(this.projectsDir)) {
      fs.mkdirSync(this.projectsDir, { recursive: true });
    }
    this.ensureTemplate();
  }

  readStandardLibrary() {
    if (!fs.existsSync(this.standardScreensPath)) return { screens: [] };
    return JSON.parse(fs.readFileSync(this.standardScreensPath, 'utf8'));
  }

  ensureTemplate() {
    this.ensureProjectLayout('_template');
    this.syncStarterLibraryFromReference();
    this.syncProjectArtifacts('_template');
    this.copyImageSeedDir(this.sharedImageLibraryDir(), path.join(this.templateDir, 'Images'));
  }

  /** Keep screens/, _template/Gfx/, Template.json, and project defaults aligned with the reference starter project */
  syncStarterLibraryFromReference() {
    const lib = this.readStandardLibrary();
    const screensDir = path.join(this.rootDir, 'screens');
    const templateGfxDir = path.join(this.templateDir, 'Gfx');
    fs.mkdirSync(screensDir, { recursive: true });
    fs.mkdirSync(templateGfxDir, { recursive: true });

    const refGfxDir = this.gfxDir(STARTER_REFERENCE_PROJECT);
    const useReference = fs.existsSync(refGfxDir);

    for (const entry of lib.screens || []) {
      const fileName = `${entry.id}.json`;
      const refFile = useReference ? path.join(refGfxDir, fileName) : null;
      const legacySource = path.join(screensDir, fileName);
      const source = (refFile && fs.existsSync(refFile)) ? refFile : legacySource;
      if (!fs.existsSync(source)) continue;

      const srcMtime = fs.statSync(source).mtimeMs;
      for (const destDir of [screensDir, templateGfxDir]) {
        const dest = path.join(destDir, fileName);
        if (!fs.existsSync(dest) || srcMtime > fs.statSync(dest).mtimeMs) {
          fs.copyFileSync(source, dest);
        }
      }
    }

    if (useReference) {
      const refTemplate = path.join(this.globalObjectsDir(STARTER_REFERENCE_PROJECT), 'Template.json');
      const destTemplate = path.join(this.templateDir, 'Global Objects', 'Template.json');
      if (fs.existsSync(refTemplate)) {
        fs.mkdirSync(path.dirname(destTemplate), { recursive: true });
        if (!fs.existsSync(destTemplate)
          || fs.statSync(refTemplate).mtimeMs > fs.statSync(destTemplate).mtimeMs) {
          fs.copyFileSync(refTemplate, destTemplate);
        }
      }

      const refNav = path.join(this.projectPath(STARTER_REFERENCE_PROJECT), 'navigation.json');
      const destNav = path.join(this.templateDir, 'navigation.json');
      if (fs.existsSync(refNav)) {
        if (!fs.existsSync(destNav) || fs.statSync(refNav).mtimeMs > fs.statSync(destNav).mtimeMs) {
          fs.copyFileSync(refNav, destNav);
        }
      }

      this.copyImageSeedDir(
        path.join(this.projectPath(STARTER_REFERENCE_PROJECT), 'Images'),
        path.join(this.templateDir, 'Images')
      );
      this.syncTemplateProjectDefaultsFromReference();
    }
  }

  syncTemplateProjectDefaultsFromReference() {
    if (!this.projectExists(STARTER_REFERENCE_PROJECT)) return;
    const refCfg = this.readProjectConfig(STARTER_REFERENCE_PROJECT);
    const tplPath = path.join(this.templateDir, 'project.json');
    if (!fs.existsSync(tplPath)) return;

    let tplCfg;
    try {
      tplCfg = JSON.parse(readFileWithRetry(tplPath));
    } catch {
      return;
    }

    const next = {
      ...tplCfg,
      startupScreen: refCfg.startupScreen || tplCfg.startupScreen || '100_Overview',
      tags: refCfg.tags || tplCfg.tags,
      alarms: refCfg.alarms || tplCfg.alarms,
      studio: {
        ...(tplCfg.studio || {}),
        globalObjectDefaults: refCfg.studio?.globalObjectDefaults || tplCfg.studio?.globalObjectDefaults,
        keyAssignments: refCfg.studio?.keyAssignments || tplCfg.studio?.keyAssignments
      }
    };

    if (JSON.stringify(tplCfg) !== JSON.stringify(next)) {
      this.writeProjectConfigFile('_template', next);
    }
  }

  /** Copy any missing standard-library display JSON into a project's Gfx folder */
  ensureStandardScreens(projectId) {
    if (!this.projectExists(projectId) || projectId === '_template') return;
    const lib = this.readStandardLibrary();
    const projectGfx = this.gfxDir(projectId);
    const templateGfx = path.join(this.templateDir, 'Gfx');
    const refGfx = this.gfxDir(STARTER_REFERENCE_PROJECT);
    const screensDir = path.join(this.rootDir, 'screens');

    for (const entry of lib.screens || []) {
      const fileName = `${entry.id}.json`;
      const dest = path.join(projectGfx, fileName);
      if (fs.existsSync(dest)) continue;
      const from = [refGfx, templateGfx, screensDir]
        .map((dir) => path.join(dir, fileName))
        .find((candidate) => fs.existsSync(candidate));
      if (from) fs.copyFileSync(from, dest);
    }
  }

  /** Create FactoryTalk-style folder tree; migrate legacy screens/ → Gfx/ */
  ensureProjectLayout(projectId, { force = false } = {}) {
    if (!force && this._layoutEnsured.has(projectId)) return;
    const base = this.projectPath(projectId);
    if (!fs.existsSync(base)) return;
    for (const folder of PROJECT_FOLDERS) {
      fs.mkdirSync(path.join(base, folder), { recursive: true });
    }
    this.migrateLegacyScreens(projectId);
    this.ensureDefaultGlobalObjects(projectId);
    this.ensureStandardScreens(projectId);
    this.seedDefaultImages(projectId);
    this.ensurePlcUploadedTagsFile(projectId);
    this._layoutEnsured.add(projectId);
  }

  applyProjectDisplayDefaults(projectId) {
    this.syncAllDisplaySizesToProject(projectId);
  }

  syncAllDisplaySizesToProject(projectId) {
    if (this._displaySyncLocks.has(projectId)) return;
    this._displaySyncLocks.add(projectId);
    try {
      this._syncAllDisplaySizesToProjectImpl(projectId);
    } finally {
      this._displaySyncLocks.delete(projectId);
    }
  }

  _syncAllDisplaySizesToProjectImpl(projectId) {
    const base = this.projectPath(projectId);
    if (!fs.existsSync(base)) return;
    const config = this.readProjectConfig(projectId);
    config.runtime = config.runtime || {};
    const defaultBg = config.runtime.displayBackground || DEFAULT_DISPLAY_BACKGROUND;
    if (!config.runtime.displayBackground) {
      config.runtime.displayBackground = defaultBg;
      this.writeProjectConfigFile(projectId, config);
    }

    const normalizeDisplayFile = (file) => {
      try {
        const data = JSON.parse(readFileWithRetry(file));
        const next = {
          ...data,
          displaySettings: { ...(data.displaySettings || {}) }
        };
        next.displaySettings.useProjectSize = true;
        delete next.displaySettings.width;
        delete next.displaySettings.height;
        const bg = next.displaySettings.backgroundColor;
        if (!bg || bg === '#808080' || bg.toLowerCase() === '#efefef') {
          next.displaySettings.backgroundColor = defaultBg;
        }
        if (JSON.stringify(data) !== JSON.stringify(next)) {
          writeJsonFileSafe(file, next);
        }
      } catch (err) {
        console.warn(`Display sync skipped ${path.basename(file)}: ${err.message}`);
      }
    };

    const gfxDir = path.join(base, 'Gfx');
    if (fs.existsSync(gfxDir)) {
      for (const f of fs.readdirSync(gfxDir)) {
        if (f.endsWith('.json')) normalizeDisplayFile(path.join(gfxDir, f));
      }
    }

    const goDir = path.join(base, 'Global Objects');
    if (fs.existsSync(goDir)) {
      for (const f of fs.readdirSync(goDir)) {
        if (f.endsWith('.json')) normalizeDisplayFile(path.join(goDir, f));
      }
    }

    this.ensureTemplateShell(projectId);
  }

  scalePx(value, factor, min = 0) {
    const n = Number(value);
    if (!Number.isFinite(n)) return value;
    return Math.max(min, Math.round(n * factor));
  }

  scaleGraphicComponent(comp, sx, sy) {
    if (!comp || typeof comp !== 'object' || Array.isArray(comp)) return;
    const avg = (sx + sy) / 2;
    const posX = ['left', 'x', 'x1', 'x2', 'startX', 'endX', 'displayLeft', 'cx'];
    const posY = ['top', 'y', 'y1', 'y2', 'startY', 'endY', 'displayTop', 'cy'];
    const sizeX = ['width', 'radiusX', 'rx'];
    const sizeY = ['height', 'radiusY', 'ry'];
    for (const key of posX) {
      if (comp[key] != null && comp[key] !== '') comp[key] = this.scalePx(comp[key], sx, 0);
    }
    for (const key of posY) {
      if (comp[key] != null && comp[key] !== '') comp[key] = this.scalePx(comp[key], sy, 0);
    }
    for (const key of sizeX) {
      if (comp[key] != null && comp[key] !== '') comp[key] = this.scalePx(comp[key], sx, 1);
    }
    for (const key of sizeY) {
      if (comp[key] != null && comp[key] !== '') comp[key] = this.scalePx(comp[key], sy, 1);
    }
    if (comp.fontSize != null && comp.fontSize !== '') {
      comp.fontSize = this.scalePx(comp.fontSize, avg, 6);
    }
    for (const key of ['lineWidth', 'borderWidth', 'radius', 'innerRadius', 'horizontalMargin', 'verticalMargin']) {
      if (comp[key] != null && comp[key] !== '') {
        const min = (key === 'lineWidth' || key === 'borderWidth') ? 0 : 0;
        comp[key] = this.scalePx(comp[key], avg, min);
      }
    }
    if (Array.isArray(comp.points)) {
      comp.points = comp.points.map((pt) => {
        if (!pt || typeof pt !== 'object') return pt;
        const next = { ...pt };
        if (next.x != null) next.x = this.scalePx(next.x, sx, 0);
        if (next.y != null) next.y = this.scalePx(next.y, sy, 0);
        return next;
      });
    }
    if (Array.isArray(comp.components)) {
      for (const child of comp.components) this.scaleGraphicComponent(child, sx, sy);
    }
    if (Array.isArray(comp.children)) {
      for (const child of comp.children) this.scaleGraphicComponent(child, sx, sy);
    }
    if (Array.isArray(comp.states)) {
      for (const st of comp.states) this.scaleGraphicComponent(st, sx, sy);
    }
  }

  scaleGraphicDocument(data, sx, sy) {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data.components)) {
      for (const comp of data.components) this.scaleGraphicComponent(comp, sx, sy);
    }
    if (data.overviewShell && typeof data.overviewShell === 'object') {
      for (const key of Object.keys(data.overviewShell)) {
        this.scaleGraphicComponent(data.overviewShell[key], sx, sy);
      }
    }
    if (data.template?.replace && typeof data.template.replace === 'object') {
      for (const key of Object.keys(data.template.replace)) {
        const patch = data.template.replace[key];
        if (!patch || typeof patch !== 'object') continue;
        if (patch.displayLeft != null) patch.displayLeft = this.scalePx(patch.displayLeft, sx, 0);
        if (patch.displayTop != null) patch.displayTop = this.scalePx(patch.displayTop, sy, 0);
      }
    }
    const ds = data.displaySettings;
    if (ds && !ds.useProjectSize) {
      if (ds.width != null) ds.width = this.scalePx(ds.width, sx, 1);
      if (ds.height != null) ds.height = this.scalePx(ds.height, sy, 1);
    }
    return data;
  }

  inferGraphicLayoutSize(projectId) {
    const config = this.readProjectConfig(projectId) || {};
    const rt = config.runtime || {};
    if (Number(rt.layoutWidth) > 0 && Number(rt.layoutHeight) > 0) {
      return { width: Number(rt.layoutWidth), height: Number(rt.layoutHeight) };
    }
    const template = this.getGlobalObject(projectId, 'Template');
    const comps = template?.components || [];
    const header = comps.find((c) => c?.name === 'HeaderBar');
    const ticker = comps.find((c) => c?.type === 'AlarmTicker');
    const footer = comps.find((c) => c?.name === 'FooterBar');
    const width = Number(header?.width) || Number(rt.width) || 800;
    let height = Number(rt.height) || 600;
    if (ticker) height = Math.max(Number(ticker.top) || 0, 0) + Math.max(Number(ticker.height) || 0, 0);
    else if (footer) height = Math.max(Number(footer.top) || 0, 0) + Math.max(Number(footer.height) || 0, 0);
    if (height < 240) height = Number(rt.height) || 600;
    const preset = WINDOW_SIZE_PRESETS.find((p) => (
      Math.abs(p.width - width) <= 8 && Math.abs(p.height - height) <= 16
    ));
    if (preset) return { width: preset.width, height: preset.height };
    return { width, height };
  }

  scaleProjectGraphics(projectId, fromWidth, fromHeight, toWidth, toHeight) {
    if (!this.projectExists(projectId) || projectId === '_template') return { scaled: false };
    const fromW = Number(fromWidth);
    const fromH = Number(fromHeight);
    const toW = Number(toWidth);
    const toH = Number(toHeight);
    if (!(fromW > 0 && fromH > 0 && toW > 0 && toH > 0)) return { scaled: false };
    if (fromW === toW && fromH === toH) return { scaled: false, fromWidth: fromW, fromHeight: fromH, toWidth: toW, toHeight: toH };
    const sx = toW / fromW;
    const sy = toH / fromH;
    const scaleDir = (dir) => {
      if (!fs.existsSync(dir)) return 0;
      let count = 0;
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.json')) continue;
        const file = path.join(dir, f);
        try {
          const data = JSON.parse(readFileWithRetry(file));
          this.scaleGraphicDocument(data, sx, sy);
          writeJsonFileSafe(file, data);
          count += 1;
        } catch (err) {
          console.warn(`Graphic scale skipped ${path.basename(file)}: ${err.message}`);
        }
      }
      return count;
    };
    const displays = scaleDir(this.gfxDir(projectId));
    const globalObjects = scaleDir(this.globalObjectsDir(projectId));
    const config = this.readProjectConfig(projectId);
    config.runtime = {
      ...(config.runtime || {}),
      layoutWidth: toW,
      layoutHeight: toH
    };
    this.writeProjectConfigFile(projectId, config);
    return {
      scaled: true,
      fromWidth: fromW,
      fromHeight: fromH,
      toWidth: toW,
      toHeight: toH,
      displays,
      globalObjects
    };
  }

  ensureTemplateShell(projectId) {
    this.migrateTemplateIfNeeded(projectId);
  }

  isImageFile(name) {
    return IMAGE_EXTENSIONS.has(path.extname(String(name || '')).toLowerCase());
  }

  sanitizeImageFileName(name) {
    let base = path.basename(String(name || '').trim());
    if (!base || base.includes('..')) {
      throw new Error('Invalid image file name');
    }
    if (!this.isImageFile(base)) {
      base = `${base.replace(/\.[^.]+$/, '')}.png`;
    }
    if (!this.isImageFile(base)) {
      throw new Error('Unsupported image type. Use png, jpg, gif, bmp, ico, webp, or svg.');
    }
    return base;
  }

  migrateAllProjects() {
    if (!fs.existsSync(this.projectsDir)) return;
    for (const entry of fs.readdirSync(this.projectsDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      this.ensureProjectLayout(entry.name, { force: true });
      this.migrateTemplateIfNeeded(entry.name);
    }
  }

  imagesDir(projectId) {
    const dir = path.join(this.projectPath(projectId), 'Images');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  sharedImageLibraryDir() {
    return path.join(this.rootDir, '..', 'hmi', 'MyPlantHMI', 'Images');
  }

  copyImageSeedDir(sourceDir, destDir) {
    if (!fs.existsSync(sourceDir)) return;
    fs.mkdirSync(destDir, { recursive: true });
    for (const f of fs.readdirSync(sourceDir)) {
      const src = path.join(sourceDir, f);
      if (!fs.statSync(src).isFile() || !this.isImageFile(f)) continue;
      const dest = path.join(destDir, f);
      if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
    }
  }

  seedDefaultImages(projectId) {
    const base = this.projectPath(projectId);
    if (!fs.existsSync(base)) return;
    const dir = path.join(base, 'Images');
    fs.mkdirSync(dir, { recursive: true });
    this.copyImageSeedDir(path.join(this.templateDir, 'Images'), dir);
    if (!fs.readdirSync(dir).some((f) => this.isImageFile(f))) {
      this.copyImageSeedDir(this.sharedImageLibraryDir(), dir);
    }
  }

  listImages(projectId) {
    this.seedDefaultImages(projectId);
    const dir = path.join(this.projectPath(projectId), 'Images');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter((f) => {
        const full = path.join(dir, f);
        return fs.statSync(full).isFile() && this.isImageFile(f);
      })
      .map((f) => ({
        fileName: f,
        label: path.basename(f, path.extname(f)),
        id: f
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  saveImage(projectId, fileName, buffer) {
    if (!this.projectExists(projectId)) throw new Error('Project not found');
    const safeName = this.sanitizeImageFileName(fileName);
    const dir = path.join(this.projectPath(projectId), 'Images');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, safeName), buffer);
    return { fileName: safeName, label: path.basename(safeName, path.extname(safeName)) };
  }

  deleteImage(projectId, fileName) {
    if (!this.projectExists(projectId)) throw new Error('Project not found');
    const safeName = this.sanitizeImageFileName(fileName);
    const file = path.join(this.projectPath(projectId), 'Images', safeName);
    if (!fs.existsSync(file)) throw new Error('Image not found');
    fs.unlinkSync(file);
    return { deleted: safeName };
  }

  getImageInfo(projectId, fileName) {
    if (!this.projectExists(projectId)) throw new Error('Project not found');
    const safeName = this.sanitizeImageFileName(fileName);
    const file = path.join(this.projectPath(projectId), 'Images', safeName);
    if (!fs.existsSync(file)) throw new Error('Image not found');
    const config = this.readProjectConfig(projectId);
    const meta = readImageFileMeta(file);
    return {
      fileName: safeName,
      label: path.basename(safeName, path.extname(safeName)),
      projectName: config.name || projectId,
      url: `/projects/${encodeURIComponent(projectId)}/Images/${encodeURIComponent(safeName)}`,
      ...meta
    };
  }

  globalObjectsDir(projectId) {
    return path.join(this.projectPath(projectId), 'Global Objects');
  }

  globalObjectFilePath(projectId, objectId) {
    return path.join(this.globalObjectsDir(projectId), `${objectId}.json`);
  }

  ensureDefaultGlobalObjects(projectId) {
    const base = this.projectPath(projectId);
    if (!fs.existsSync(base)) return;
    const dir = path.join(base, 'Global Objects');
    fs.mkdirSync(dir, { recursive: true });
    const templateFile = path.join(this.templateDir, 'Global Objects', 'Template.json');
    const destFile = path.join(dir, 'Template.json');
    if (!fs.existsSync(destFile)) {
      if (fs.existsSync(templateFile)) {
        fs.copyFileSync(templateFile, destFile);
      } else {
        writeJsonFileSafe(destFile, {
          id: 'Template',
          title: 'Template',
          kind: 'global-object',
          layout: 'global',
          securityLevel: 0,
          displaySettings: {
            useProjectSize: true,
            backgroundColor: DEFAULT_DISPLAY_BACKGROUND
          },
          components: defaultTemplateComponents()
        });
      }
    }
    this.migrateTemplateIfNeeded(projectId);
  }

  migrateTemplateIfNeeded(projectId) {
    const templateFile = path.join(this.projectPath(projectId), 'Global Objects', 'Template.json');
    if (!fs.existsSync(templateFile)) return;

    let current;
    try {
      current = JSON.parse(readFileWithRetry(templateFile));
    } catch {
      return;
    }

    const hasShell = current?.components?.some((c) => c.type === 'DisplayShell');
    if (!hasShell) return;

    const userExtras = (current.components || []).filter((c) => {
      if (c.type === 'DisplayShell') return false;
      if (c.type === 'Panel' && (!c.children || c.children.length === 0)) return false;
      return true;
    });

    current.components = [...defaultTemplateComponents(), ...userExtras];
    writeJsonFileSafe(templateFile, current);
  }

  listGlobalObjects(projectId) {
    const dir = this.globalObjectsDir(projectId);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const obj = JSON.parse(readFileWithRetry(path.join(dir, f)));
        return { id: obj.id || f.replace(/\.json$/, ''), title: obj.title || obj.id, file: f };
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  getGlobalObject(projectId, objectId) {
    const file = this.globalObjectFilePath(projectId, objectId);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(readFileWithRetry(file));
  }

  updateGlobalObject(projectId, objectId, patch) {
    if (!this.projectExists(projectId)) throw new Error('Project not found');
    const file = this.globalObjectFilePath(projectId, objectId);
    if (!fs.existsSync(file)) throw new Error('Global object not found');
    const obj = JSON.parse(readFileWithRetry(file));
    if (patch.displaySettings) {
      const ds = { ...(obj.displaySettings || {}), ...patch.displaySettings };
      if (ds.useProjectSize) {
        delete ds.width;
        delete ds.height;
      }
      obj.displaySettings = ds;
      delete patch.displaySettings;
    }
    Object.assign(obj, patch);
    writeJsonFileSafe(file, obj);
    return obj;
  }

  migrateLegacyScreens(projectId) {
    const base = this.projectPath(projectId);
    const legacy = path.join(base, 'screens');
    const gfx = path.join(base, 'Gfx');
    if (!fs.existsSync(legacy)) return;
    fs.mkdirSync(gfx, { recursive: true });
    for (const f of fs.readdirSync(legacy)) {
      if (!f.endsWith('.json')) continue;
      const srcPath = path.join(legacy, f);
      const destPath = path.join(gfx, f);
      if (!fs.existsSync(destPath)
        || fs.statSync(srcPath).mtimeMs > fs.statSync(destPath).mtimeMs) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
    for (const f of fs.readdirSync(legacy)) {
      if (f.endsWith('.json') && fs.existsSync(path.join(gfx, f))) {
        fs.unlinkSync(path.join(legacy, f));
      }
    }
    try {
      if (fs.readdirSync(legacy).length === 0) fs.rmdirSync(legacy);
    } catch { /* not empty or already removed */ }
  }

  removeLegacyScreensDir(projectId) {
    const legacy = path.join(this.projectPath(projectId), 'screens');
    if (fs.existsSync(legacy)) {
      fs.rmSync(legacy, { recursive: true, force: true });
    }
  }

  gfxDir(projectId) {
    return path.join(this.projectPath(projectId), 'Gfx');
  }

  screenFilePath(projectId, screenId) {
    return path.join(this.gfxDir(projectId), `${screenId}.json`);
  }

  /** Export tag CSV + settings snapshot (like FactoryTalk *-Tags.CSV) */
  syncProjectArtifacts(projectId) {
    if (!fs.existsSync(this.projectPath(projectId))) return;
    let config;
    try {
      config = this.readProjectConfig(projectId);
    } catch {
      return;
    }

    const { hmiTags, plcTags } = splitProjectTags(config.tags);

    const tagDir = path.join(this.projectPath(projectId), 'Tag');
    fs.mkdirSync(tagDir, { recursive: true });
    fs.writeFileSync(
      path.join(tagDir, `${projectId}-Tags.CSV`),
      tagCsvLines(hmiTags),
      'utf8'
    );

    this.writePlcUploadedTags(projectId, plcTags);
    fs.writeFileSync(
      path.join(this.plcUploadedTagsDir(projectId), `${projectId}-PLC-uploaded-Tags.CSV`),
      tagCsvLines(plcTags),
      'utf8'
    );

    const settingsDir = path.join(this.projectPath(projectId), 'ProjectSettings');
    fs.mkdirSync(settingsDir, { recursive: true });
    writeJsonFileSafe(
      path.join(settingsDir, 'project.json'),
      { ...config, tags: hmiTags }
    );

    const alarmDir = path.join(this.projectPath(projectId), 'M_Alarms');
    fs.mkdirSync(alarmDir, { recursive: true });
    fs.writeFileSync(
      path.join(alarmDir, 'alarms.json'),
      JSON.stringify(config.alarms || [], null, 2),
      'utf8'
    );
  }

  seedProjectFromTemplate(projectId) {
    const lib = this.readStandardLibrary();
    const refGfxDir = this.gfxDir(STARTER_REFERENCE_PROJECT);
    const useReference = this.projectExists(STARTER_REFERENCE_PROJECT) && fs.existsSync(refGfxDir);
    const templateGfx = path.join(this.templateDir, 'Gfx');
    const projectGfx = this.gfxDir(projectId);

    for (const entry of lib.screens || []) {
      const fileName = `${entry.id}.json`;
      const refSrc = useReference ? path.join(refGfxDir, fileName) : null;
      const templateSrc = path.join(templateGfx, fileName);
      const from = (refSrc && fs.existsSync(refSrc))
        ? refSrc
        : templateSrc;
      if (fs.existsSync(from)) {
        fs.copyFileSync(from, path.join(projectGfx, fileName));
      }
    }

    const navFrom = useReference
      ? path.join(this.projectPath(STARTER_REFERENCE_PROJECT), 'navigation.json')
      : path.join(this.templateDir, 'navigation.json');
    const navDest = path.join(this.projectPath(projectId), 'navigation.json');
    if (fs.existsSync(navFrom)) fs.copyFileSync(navFrom, navDest);

    const globalFrom = useReference
      ? this.globalObjectsDir(STARTER_REFERENCE_PROJECT)
      : path.join(this.templateDir, 'Global Objects');
    const projectGlobalDir = this.globalObjectsDir(projectId);
    if (fs.existsSync(globalFrom)) {
      for (const f of fs.readdirSync(globalFrom)) {
        if (!f.endsWith('.json')) continue;
        fs.copyFileSync(path.join(globalFrom, f), path.join(projectGlobalDir, f));
      }
    }

    if (useReference) {
      this.copyImageSeedDir(
        path.join(this.projectPath(STARTER_REFERENCE_PROJECT), 'Images'),
        path.join(this.projectPath(projectId), 'Images')
      );
    }

    const cfgPath = path.join(this.projectPath(projectId), 'project.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    cfg.startupScreen = lib.startupScreen || '100_Overview';

    if (useReference) {
      const refCfg = this.readProjectConfig(STARTER_REFERENCE_PROJECT);
      cfg.startupScreen = refCfg.startupScreen || cfg.startupScreen;
      cfg.tags = refCfg.tags || cfg.tags;
      cfg.alarms = refCfg.alarms || cfg.alarms;
      cfg.studio = {
        ...(cfg.studio || {}),
        globalObjectDefaults: refCfg.studio?.globalObjectDefaults || cfg.studio?.globalObjectDefaults,
        keyAssignments: refCfg.studio?.keyAssignments || cfg.studio?.keyAssignments
      };
    }

    this.writeProjectConfigFile(projectId, cfg, { preservePlcIfEmpty: !useReference });
    this.syncProjectArtifacts(projectId);
  }

  sanitizeId(name) {
    return String(name || '')
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60) || 'project';
  }

  findProjectByName(name, excludeId = null) {
    const target = String(name || '').trim().toLowerCase();
    if (!target) return null;
    for (const project of this.listProjects()) {
      if (excludeId && project.id === excludeId) continue;
      if ((project.name || '').trim().toLowerCase() === target) return project;
    }
    return null;
  }

  assertUniqueProjectName(name, excludeId = null) {
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new Error('Project name required');
    const existing = this.findProjectByName(trimmed, excludeId);
    if (existing) {
      const err = new Error(`A project named "${trimmed}" already exists`);
      err.statusCode = 409;
      throw err;
    }
    return trimmed;
  }

  getActiveId() {
    try {
      const data = JSON.parse(fs.readFileSync(this.activeFile, 'utf8'));
      if (data.id && this.projectExists(data.id)) return data.id;
    } catch { /* fall through */ }
    const first = this.listProjects()[0]?.id;
    if (first) {
      this.setActiveId(first);
      return first;
    }
    return null;
  }

  setActiveId(id) {
    fs.writeFileSync(this.activeFile, JSON.stringify({ id }, null, 2));
  }

  projectPath(id) {
    return path.join(this.projectsDir, id);
  }

  plcUploadedTagsDir(projectId) {
    return path.join(this.projectPath(projectId), IoListTags.PLC_UPLOADED_TAGS_FOLDER);
  }

  plcUploadedTagsFile(projectId) {
    return path.join(this.plcUploadedTagsDir(projectId), 'tags.json');
  }

  ensurePlcUploadedTagsFile(projectId) {
    const dir = this.plcUploadedTagsDir(projectId);
    fs.mkdirSync(dir, { recursive: true });
    const file = this.plcUploadedTagsFile(projectId);
    if (!fs.existsSync(file)) {
      writeJsonFileSafe(file, {
        folder: IoListTags.PLC_UPLOADED_TAGS_FOLDER,
        tags: []
      });
    }
  }

  readPlcUploadedTags(projectId) {
    const file = this.plcUploadedTagsFile(projectId);
    if (!fs.existsSync(file)) return [];
    try {
      const data = JSON.parse(readFileWithRetry(file));
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.tags)) return data.tags;
      return [];
    } catch {
      return [];
    }
  }

  writePlcUploadedTags(projectId, tags) {
    this.ensurePlcUploadedTagsFile(projectId);
    const normalized = (tags || []).map((tag) => ({
      ...tag,
      folder: IoListTags.PLC_UPLOADED_TAGS_FOLDER
    }));
    writeJsonFileSafe(this.plcUploadedTagsFile(projectId), {
      folder: IoListTags.PLC_UPLOADED_TAGS_FOLDER,
      tags: normalized
    });
  }

  writeProjectConfigFile(projectId, config, options = {}) {
    const { hmiTags, plcTags } = splitProjectTags(config.tags);
    writeJsonFileSafe(
      path.join(this.projectPath(projectId), 'project.json'),
      { ...config, tags: hmiTags }
    );
    if (options.preservePlcIfEmpty && !plcTags.length) {
      this.ensurePlcUploadedTagsFile(projectId);
      return;
    }
    this.writePlcUploadedTags(projectId, plcTags);
  }

  getDefaultNewProjectSourceId() {
    return STARTER_REFERENCE_PROJECT;
  }

  projectExists(id) {
    return id && id !== '_template' && fs.existsSync(this.projectPath(id));
  }

  listProjects() {
    if (!fs.existsSync(this.projectsDir)) return [];
    return fs.readdirSync(this.projectsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== '_template')
      .map((d) => {
        this.ensureProjectLayout(d.name);
        const config = this.readProjectConfig(d.name);
        const screens = this.listScreens(d.name);
        return {
          id: d.name,
          name: config.name || d.name,
          subtitle: config.subtitle || '',
          screenCount: screens.length,
          updatedAt: fs.statSync(this.projectPath(d.name)).mtime.toISOString(),
          windowProfile: config.runtime?.windowProfile || '800x600',
          language: config.studio?.language || 'en',
          lastOpenedWith: config.studio?.lastOpenedWith || STUDIO_VERSION
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  readProjectConfig(projectId) {
    const file = path.join(this.projectPath(projectId), 'project.json');
    if (!fs.existsSync(file)) return {};
    const config = JSON.parse(readFileWithRetry(file));
    const { hmiTags, plcTags: leakedPlcTags } = splitProjectTags(config.tags);
    const plcByName = new Map();
    for (const tag of [...this.readPlcUploadedTags(projectId), ...leakedPlcTags]) {
      if (tag?.name) plcByName.set(tag.name, tag);
    }
    const plcTags = [...plcByName.values()];
    config.tags = [...hmiTags, ...plcTags];
    if (leakedPlcTags.length) {
      writeJsonFileSafe(file, { ...config, tags: hmiTags });
      this.writePlcUploadedTags(projectId, plcTags);
    }
    return config;
  }

  readNavigation(projectId) {
    const file = path.join(this.projectPath(projectId), 'navigation.json');
    if (!fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(path.join(this.rootDir, 'config', 'navigation.json'), 'utf8'));
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  listScreens(projectId) {
    const dir = this.gfxDir(projectId);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const screen = JSON.parse(readFileWithRetry(path.join(dir, f)));
        return { id: screen.id, title: screen.title, navGroup: screen.navGroup, file: f };
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  getScreen(projectId, screenId, options = {}) {
    this.ensureProjectLayout(projectId);
    this.ensureStandardScreens(projectId);
    const file = this.screenFilePath(projectId, screenId);
    if (!fs.existsSync(file)) return null;
    const raw = JSON.parse(readFileWithRetry(file));
    if (this.migrateMisplacedNavShell(raw)) {
      writeJsonFileSafe(file, raw);
    }
    if (options.raw) {
      if (options.rawFile) return raw;
      return this.mergeSharedNavShell(projectId, raw);
    }
    return this.composeScreenWithTemplate(projectId, raw);
  }

  /** Studio previously saved nav overrides under overviewShell; move them to the navGroup shell field. */
  migrateMisplacedNavShell(screen) {
    if (!screen?.overviewShell) return false;
    const targetKey = screen.navGroup === 'manual'
      ? 'manualShell'
      : screen.navGroup === 'alarms'
        ? 'alarmsShell'
        : screen.navGroup === 'settings'
          ? 'settingsShell'
          : null;
    if (!targetKey) return false;
    const misplaced = screen.overviewShell;
    if (!misplaced || !Object.keys(misplaced).length) {
      delete screen.overviewShell;
      return true;
    }
    screen[targetKey] = { ...(screen[targetKey] || {}), ...misplaced };
    delete screen.overviewShell;
    console.info(`[project-service] Migrated overviewShell → ${targetKey} on ${screen.id || 'screen'}`);
    return true;
  }

  shellKeyForNavGroup(navGroup) {
    if (navGroup === 'manual') return 'manualShell';
    if (navGroup === 'alarms') return 'alarmsShell';
    if (navGroup === 'overview') return 'overviewShell';
    if (navGroup === 'settings') return 'settingsShell';
    return null;
  }

  /** Layout/style fields merged across nav-group screens; active-state styling stays per-screen at compose time. */
  pickSharedNavShellFields(override) {
    const shared = new Set([
      'left', 'top', 'width', 'height',
      'fontFamily', 'fontSize', 'bold', 'italic', 'underline',
      'wordWrap', 'alignment', 'visible', 'backColor', 'backStyle',
      'borderStyle', 'borderWidth', 'audio',
      'image', 'imageScaled', 'imageAlignment'
    ]);
    const picked = {};
    for (const [key, value] of Object.entries(override || {})) {
      if (shared.has(key)) picked[key] = value;
    }
    return picked;
  }

  /** Drop junk overrides (border state, empty property blobs) — keep geometry/layout only. */
  sanitizeNavShellOverride(override) {
    const picked = this.pickSharedNavShellFields(override);
    const hasGeometry = ['left', 'top', 'width', 'height'].some((key) => picked[key] != null);
    return hasGeometry ? picked : {};
  }

  sanitizeNavShellMap(shellMap = {}) {
    const clean = {};
    for (const [name, override] of Object.entries(shellMap || {})) {
      const sanitized = this.sanitizeNavShellOverride(override);
      if (Object.keys(sanitized).length) clean[name] = sanitized;
    }
    return clean;
  }

  /** Nav sidebar overrides edited on one screen should apply across the whole nav group. */
  mergeSharedNavShell(projectId, rawScreen) {
    const shellKey = this.shellKeyForNavGroup(rawScreen?.navGroup);
    if (!shellKey) return rawScreen;

    const nav = this.readNavigation(projectId);
    const subNav = nav.subNav?.[rawScreen.navGroup] || [];
    const merged = {};
    const currentId = rawScreen?.id;

    for (const entry of subNav) {
      const screenId = entry?.screen;
      if (!screenId) continue;
      const file = this.screenFilePath(projectId, screenId);
      if (!fs.existsSync(file)) continue;
      try {
        const other = JSON.parse(readFileWithRetry(file));
        const otherShell = other?.[shellKey] || {};
        for (const [name, override] of Object.entries(otherShell)) {
          if (!override || typeof override !== 'object') continue;
          const patch = screenId === currentId
            ? this.sanitizeNavShellOverride(override)
            : this.sanitizeNavShellOverride(this.pickSharedNavShellFields(override));
          if (!Object.keys(patch).length) continue;
          merged[name] = { ...(merged[name] || {}), ...patch };
        }
      } catch {
        /* ignore unreadable screen */
      }
    }

    const currentShell = rawScreen[shellKey] || {};
    for (const [name, override] of Object.entries(currentShell)) {
      if (!override || typeof override !== 'object') continue;
      const patch = this.sanitizeNavShellOverride(override);
      if (!Object.keys(patch).length) continue;
      merged[name] = { ...(merged[name] || {}), ...patch };
    }

    if (!Object.keys(merged).length) return rawScreen;
    return { ...rawScreen, [shellKey]: merged };
  }

  composeScreenWithTemplate(projectId, rawScreen) {
    this.ensureDefaultGlobalObjects(projectId);
    const config = this.readProjectConfig(projectId);
    const runtime = config.runtime || { width: 800, height: 600 };
    const globalObjectId = rawScreen.template?.globalObjectId || 'Template';
    let templateObject = this.getGlobalObject(projectId, globalObjectId);
    if (!templateObject?.components?.length && projectId !== '_template') {
      templateObject = this.getGlobalObject('_template', globalObjectId);
    }
    const mergedScreen = this.mergeSharedNavShell(projectId, rawScreen);
    return composeScreen(mergedScreen, templateObject, runtime);
  }

  getFolderForScreen(screenId) {
    const lib = this.readStandardLibrary();
    const match = lib.screens?.find((s) => s.id === screenId);
    if (match) return match.folder;
    const page = parseInt(screenId.split('_')[0], 10);
    if (!Number.isNaN(page)) {
      const hundreds = Math.floor(page / 100) * 100;
      const byRange = DISPLAY_FOLDERS.find((f) => f.id.startsWith(`${hundreds}_`));
      if (byRange) return byRange.id;
    }
    const prefix = screenId.split('_')[0];
    const folder = DISPLAY_FOLDERS.find((f) => f.id.startsWith(`${prefix}_`));
    return folder?.id || '100_Overview';
  }

  navGroupForFolder(folderId) {
    return DISPLAY_FOLDERS.find((f) => f.id === folderId)?.navGroup || 'none';
  }

  addScreen(projectId, { pageNo, screenName, folder }) {
    if (!this.projectExists(projectId)) throw new Error('Project not found');
    const safeName = String(screenName || 'New_Screen').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const page = String(pageNo || '900').trim();
    const id = `${page}_${safeName}`;
    const file = path.join(this.gfxDir(projectId), `${id}.json`);
    if (fs.existsSync(file)) throw new Error(`Screen ${id} already exists`);

    const folderId = folder || this.getFolderForScreen(`${page}_x`);
    const navGroup = this.navGroupForFolder(folderId);
    const screen = {
      id,
      title: safeName.replace(/_/g, ' '),
      navGroup,
      layout: 'standard',
      securityLevel: 0,
      template: {
        enabled: true,
        globalObjectId: 'Template'
      },
      displaySettings: {
        useProjectSize: true,
        backgroundColor: this.readProjectConfig(projectId).runtime?.displayBackground || DEFAULT_DISPLAY_BACKGROUND
      },
      components: []
    };
    fs.writeFileSync(file, JSON.stringify(screen, null, 2));
    return screen;
  }

  updateProjectConfig(projectId, patch) {
    if (!this.projectExists(projectId)) throw new Error('Project not found');
    const config = this.readProjectConfig(projectId);
    const scaleGraphics = Boolean(patch.scaleGraphics);
    const scaleFromWidth = Number(patch.scaleFromWidth);
    const scaleFromHeight = Number(patch.scaleFromHeight);
    delete patch.scaleGraphics;
    delete patch.scaleFromWidth;
    delete patch.scaleFromHeight;
    if (patch.name !== undefined) {
      const trimmed = String(patch.name).trim();
      const current = String(config.name || '').trim();
      if (trimmed.toLowerCase() !== current.toLowerCase()) {
        patch.name = this.assertUniqueProjectName(trimmed, projectId);
      } else {
        patch.name = trimmed;
      }
    }
    if (patch.studio) {
      config.studio = { ...(config.studio || {}), ...patch.studio };
      if (patch.studio.globalObjectDefaults) {
        config.studio.globalObjectDefaults = {
          ...(config.studio.globalObjectDefaults || {}),
          ...patch.studio.globalObjectDefaults
        };
      }
      if (patch.studio.keyAssignments) {
        config.studio.keyAssignments = {
          ...(config.studio.keyAssignments || {}),
          ...patch.studio.keyAssignments
        };
      }
    }
    if (patch.communication) {
      config.communication = { ...(config.communication || {}), ...patch.communication };
    }
    if (patch.runtime) {
      config.runtime = { ...(config.runtime || {}), ...patch.runtime };
    }
    if (patch.inactivity) {
      config.inactivity = { ...(config.inactivity || {}), ...patch.inactivity };
    }
    if (patch.tags !== undefined) {
      config.tags = patch.tags;
    }
    if (patch.alarms !== undefined) {
      config.alarms = patch.alarms;
    }
    for (const key of Object.keys(patch)) {
      if (!['studio', 'communication', 'tags', 'alarms', 'runtime', 'inactivity'].includes(key)) {
        config[key] = patch[key];
      }
    }
    this.writeProjectConfigFile(projectId, config);
    if (scaleGraphics) {
      const from = (scaleFromWidth > 0 && scaleFromHeight > 0)
        ? { width: scaleFromWidth, height: scaleFromHeight }
        : this.inferGraphicLayoutSize(projectId);
      const toW = Number(config.runtime?.width) || from.width;
      const toH = Number(config.runtime?.height) || from.height;
      this.scaleProjectGraphics(projectId, from.width, from.height, toW, toH);
    }
    if (patch.runtime) {
      this.syncAllDisplaySizesToProject(projectId);
    }
    this.syncProjectArtifacts(projectId);
    return this.readProjectConfig(projectId);
  }

  updateScreen(projectId, screenId, patch) {
    if (!this.projectExists(projectId)) throw new Error('Project not found');
    const file = this.screenFilePath(projectId, screenId);
    if (!fs.existsSync(file)) throw new Error('Screen not found');
    const screen = JSON.parse(readFileWithRetry(file));
    if (patch.displaySettings) {
      const ds = { ...(screen.displaySettings || {}), ...patch.displaySettings };
      if (ds.useProjectSize) {
        delete ds.width;
        delete ds.height;
      }
      screen.displaySettings = ds;
      delete patch.displaySettings;
    }
    if (patch.components && Array.isArray(patch.components)) {
      patch.components = patch.components.map((comp) => {
        if (!comp || typeof comp !== 'object') return comp;
        const clean = { ...comp };
        delete clean._source;
        delete clean._displayIndex;
        delete clean._templateIndex;
        delete clean._replacesTemplate;
        return clean;
      });
    }
    if (patch.template?.replace && typeof patch.template.replace === 'object') {
      const replace = {};
      for (const [key, value] of Object.entries(patch.template.replace)) {
        if (!value || typeof value !== 'object') continue;
        const clean = { ...value };
        delete clean._source;
        delete clean._displayIndex;
        delete clean._templateIndex;
        delete clean._replacesTemplate;
        replace[key] = clean;
      }
      patch.template = { ...patch.template, replace };
    }
    if (patch._replaceNavShell) {
      for (const shellKey of ['manualShell', 'overviewShell', 'alarmsShell', 'settingsShell']) {
        if (patch[shellKey] && typeof patch[shellKey] === 'object') {
          screen[shellKey] = patch[shellKey];
          delete patch[shellKey];
        }
      }
      delete patch._replaceNavShell;
    }
    for (const shellKey of ['manualShell', 'overviewShell', 'alarmsShell', 'settingsShell']) {
      if (!patch[shellKey] || typeof patch[shellKey] !== 'object') continue;
      const mergedShell = { ...(screen[shellKey] || {}) };
      for (const [name, override] of Object.entries(patch[shellKey])) {
        if (!override || typeof override !== 'object') {
          delete mergedShell[name];
          continue;
        }
        const sanitized = this.sanitizeNavShellOverride(override);
        if (!Object.keys(sanitized).length) delete mergedShell[name];
        else mergedShell[name] = { ...(mergedShell[name] || {}), ...sanitized };
      }
      screen[shellKey] = mergedShell;
      delete patch[shellKey];
    }
    Object.assign(screen, patch);
    delete screen._composed;
    writeJsonFileSafe(file, screen);
    return screen;
  }

  deleteScreen(projectId, screenId) {
    if (!this.projectExists(projectId)) throw new Error('Project not found');
    const file = this.screenFilePath(projectId, screenId);
    if (!fs.existsSync(file)) throw new Error('Screen not found');

    const config = this.readProjectConfig(projectId);
    if (config.startupScreen === screenId) {
      throw new Error('Cannot delete the startup screen. Change startup screen first.');
    }

    fs.unlinkSync(file);
    return { deleted: screenId };
  }

  buildExplorerTree(projectId) {
    const config = this.readProjectConfig(projectId);
    const screens = this.listScreens(projectId);
    const byFolder = {};
    for (const folder of DISPLAY_FOLDERS) {
      byFolder[folder.id] = [];
    }
    for (const screen of screens) {
      const folder = this.getFolderForScreen(screen.id);
      if (!byFolder[folder]) byFolder[folder] = [];
      byFolder[folder].push({
        type: 'display',
        id: screen.id,
        label: `${screen.id.replace(/_/g, ' ')}`,
        title: screen.title
      });
    }

    const displayFolders = DISPLAY_FOLDERS.map((folder) => ({
      type: 'folder',
      id: folder.id,
      label: folder.label,
      icon: 'folder',
      children: (byFolder[folder.id] || []).sort((a, b) => a.id.localeCompare(b.id))
    }));

    const globalObjectNodes = this.listGlobalObjects(projectId).map((obj) => ({
      type: 'global-object',
      id: obj.id,
      label: obj.title || obj.id,
      title: obj.title,
      icon: 'global-object'
    }));

    const imageNodes = this.listImages(projectId).map((img) => ({
      type: 'image',
      id: img.id,
      label: img.label,
      fileName: img.fileName,
      icon: 'image-file'
    }));

    const tagFolders = new Set(config.tagFolders || []);
    for (const tag of config.tags || []) {
      const folder = String(tag.folder || '').trim();
      if (folder) tagFolders.add(folder);
    }

    const IoListTags = require('../../shared/io-list-tags');
    const orderedFolders = [...IoListTags.getDefaultHmiTagFolderOrder()];
    for (const preferred of ['Temp_Tags']) {
      if (tagFolders.has(preferred) && !orderedFolders.includes(preferred)) {
        orderedFolders.push(preferred);
      }
    }
    for (const folderName of [...tagFolders].sort((a, b) => a.localeCompare(b))) {
      if (!orderedFolders.includes(folderName)) orderedFolders.push(folderName);
    }

    const groupedNames = new Set();
    for (const group of IoListTags.getHmiTagExplorerGroups()) {
      for (const folder of group.folders) groupedNames.add(folder.name);
    }

    const plcUploadedName = IoListTags.PLC_UPLOADED_TAGS_FOLDER;
    const extraFolderNodes = orderedFolders
      .filter((folderName) => !groupedNames.has(folderName) && folderName !== plcUploadedName)
      .map((folderName) => ({
        type: 'folder',
        id: `tag-folder-${folderName}`,
        label: folderName,
        icon: 'folder',
        tagFolder: folderName
      }));

    const hmiTagChildren = [
      {
        type: 'folder',
        id: 'hmi-tags-list',
        label: 'HMI Tags',
        icon: 'folder',
        children: extraFolderNodes
      }
    ];

    const { isPlcDeviceTag } = require('../../shared/tag-connections');
    const plcDeviceTags = (config.tags || []).filter(isPlcDeviceTag);
    const plcTagNodes = plcDeviceTags.slice(0, 200).map((tag) => ({
      type: 'item',
      id: `plc-tag-${String(tag.name).replace(/[^a-zA-Z0-9._:-]/g, '_')}`,
      label: tag.name,
      tagName: tag.name,
      icon: 'tag',
      action: 'plc-tag-item'
    }));
    const linxChildren = [
      { type: 'item', id: 'linx-communications', label: 'Communications Setup', icon: 'comm', action: 'communications' },
      {
        type: 'folder',
        id: 'linx-plc-tags',
        label: 'PLC Tags',
        icon: 'folder',
        children: plcTagNodes.length
          ? plcTagNodes
          : [{ type: 'item', id: 'linx-no-plc-tags', label: '(No PLC tags defined)', icon: 'tag' }]
      }
    ];

    const projectChildren = [
      {
        type: 'folder',
        id: 'system',
        label: 'System',
        icon: 'system',
        children: [
          { type: 'item', id: 'project-settings', label: 'Project Settings', icon: 'settings' },
          { type: 'item', id: 'runtime-security', label: 'Runtime Security', icon: 'lock' },
          { type: 'item', id: 'diagnostics-setup', label: 'Diagnostics List Setup', icon: 'diag' },
          { type: 'item', id: 'audit-trail-setup', label: 'Audit Trail Setup', icon: 'audit' },
          { type: 'item', id: 'csv-export-setup', label: 'CSV Export Setup', icon: 'csv' },
          { type: 'item', id: 'global-connections', label: 'Global Connections', icon: 'global-conn' },
          { type: 'item', id: 'startup', label: 'Startup', icon: 'play' }
        ]
      },
      {
        type: 'folder',
        id: 'hmi-tags',
        label: 'Tags',
        icon: 'tags',
        children: hmiTagChildren
      },
      {
        type: 'folder',
        id: `tag-folder-${plcUploadedName}`,
        label: 'PLC uploaded Tags',
        icon: 'folder',
        tagFolder: plcUploadedName
      },
      {
        type: 'folder',
        id: 'graphics',
        label: 'Graphics',
        icon: 'graphics',
        children: [
          {
            type: 'folder',
            id: 'displays',
            label: 'Displays',
            icon: 'displays',
            children: displayFolders
          },
          {
            type: 'folder',
            id: 'global-objects',
            label: 'Global Objects',
            icon: 'global-objects',
            children: globalObjectNodes
          },
          { type: 'item', id: 'symbol-factory', label: 'Symbol Factory', icon: 'symbol-factory', action: 'symbol-factory' },
          { type: 'item', id: 'libraries', label: 'Libraries', icon: 'libraries', action: 'libraries' },
          {
            type: 'folder',
            id: 'images',
            label: 'Images',
            icon: 'images',
            children: imageNodes
          },
          (() => {
            const ParameterFileBuilder = require('../../shared/parameter-file-builder');
            const parameterFiles = ParameterFileBuilder.mergeProjectParameterFiles(config.parameterFiles);
            const fileNodes = Object.keys(parameterFiles).sort((a, b) => a.localeCompare(b)).map((name) => ({
              type: 'item',
              id: `parameter-file-${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
              label: name,
              parameterFile: name,
              icon: 'parameters',
              action: 'parameter-file'
            }));
            return {
              type: 'folder',
              id: 'parameters',
              label: 'Parameters',
              icon: 'parameters',
              children: [
                ...fileNodes,
                { type: 'item', id: 'parameters-add', label: 'Add Parameter File…', icon: 'parameters', action: 'parameters-add' }
              ]
            };
          })(),
          { type: 'item', id: 'local-messages', label: 'Local Messages', icon: 'local-messages', action: 'local-messages' }
        ]
      },
      {
        type: 'folder',
        id: 'alarms',
        label: 'Alarms',
        icon: 'alarm',
        children: [
          { type: 'item', id: 'alarm-setup', label: 'Alarm Setup', icon: 'alarm-setup', action: 'alarms' }
        ]
      },
      {
        type: 'folder',
        id: 'information',
        label: 'Information',
        icon: 'information',
        children: [
          { type: 'item', id: 'information-setup', label: 'Information Setup', icon: 'information-setup', action: 'information-setup' },
          { type: 'item', id: 'information-messages', label: 'Information Messages', icon: 'information-messages', action: 'information-messages' }
        ]
      },
      {
        type: 'folder',
        id: 'logic-control',
        label: 'Logic and Control',
        icon: 'logic',
        children: [
          { type: 'item', id: 'macros', label: 'Macros', icon: 'macros', action: 'macros' }
        ]
      },
      {
        type: 'folder',
        id: 'data-log',
        label: 'Data Log',
        icon: 'data-log',
        children: [
          { type: 'item', id: 'data-log-models', label: 'Data Log Models', icon: 'data-log-models', action: 'data-log' }
        ]
      },
      {
        type: 'folder',
        id: 'recipeplus',
        label: 'RecipePlus',
        icon: 'recipeplus',
        children: [
          { type: 'item', id: 'recipeplus-setup', label: 'RecipePlus Setup', icon: 'recipeplus-setup', action: 'recipeplus-setup' },
          { type: 'item', id: 'recipeplus-editor', label: 'RecipePlus Editor', icon: 'recipeplus-editor', action: 'recipeplus-editor' }
        ]
      },
      {
        type: 'folder',
        id: 'factorytalk-linx',
        label: 'FactoryTalk Linx',
        icon: 'linx',
        children: linxChildren
      }
    ];

    const host = require('os').hostname();
    const projectLabel = config.name || projectId;

    const tree = [
      {
        type: 'folder',
        id: 'project-root',
        label: `${projectLabel} (${host})`,
        icon: 'project',
        children: [
          {
            type: 'folder',
            id: 'application',
            label: projectLabel,
            icon: 'application',
            children: projectChildren
          }
        ]
      }
    ];

    return {
      projectId,
      projectName: config.name || projectId,
      host,
      tree
    };
  }

  copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const s = path.join(src, entry.name);
      const d = path.join(dest, entry.name);
      if (entry.isDirectory()) this.copyDir(s, d);
      else fs.copyFileSync(s, d);
    }
  }

  createProject(name, options = {}) {
    const trimmed = this.assertUniqueProjectName(name);
    const baseId = this.sanitizeId(trimmed);
    let id = baseId;
    let n = 1;
    while (this.projectExists(id)) {
      id = `${baseId}_${n++}`;
    }

    const templateDir = path.join(this.projectsDir, '_template');
    if (!fs.existsSync(templateDir)) {
      throw new Error('Project template not found');
    }

    this.ensureTemplate();

    const dest = this.projectPath(id);
    this.copyDir(templateDir, dest);

    const configPath = path.join(dest, 'project.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.name = trimmed;
    if (options.subtitle?.trim()) config.subtitle = options.subtitle.trim();
    config.createdAt = new Date().toISOString();
    config.studio = {
      ...(config.studio || {}),
      lastOpenedWith: STUDIO_VERSION,
      language: options.language || config.studio?.language || 'en'
    };
    if (options.windowProfile) {
      const preset = WINDOW_SIZE_PRESETS.find((p) => p.id === options.windowProfile)
        || WINDOW_SIZE_PRESETS.find((p) => p.id === '800x600');
      config.runtime = {
        ...(config.runtime || {}),
        windowProfile: preset.id,
        width: preset.width,
        height: preset.height
      };
    }
    this.writeProjectConfigFile(id, config, { preservePlcIfEmpty: true });

    this.seedProjectFromTemplate(id);
    this.ensureProjectLayout(id);
    this.removeLegacyScreensDir(id);
    this.syncAllDisplaySizesToProject(id);
    const layout = this.inferGraphicLayoutSize(id);
    const toW = Number(config.runtime?.width) || layout.width;
    const toH = Number(config.runtime?.height) || layout.height;
    if (layout.width !== toW || layout.height !== toH) {
      this.scaleProjectGraphics(id, layout.width, layout.height, toW, toH);
    }
    this.syncProjectArtifacts(id);

    this.setActiveId(id);
    return { id, name: config.name, screenCount: this.listScreens(id).length };
  }

  deleteProject(projectId) {
    if (!projectId || projectId === '_template') {
      throw new Error('Cannot delete this project');
    }
    if (!this.projectExists(projectId)) throw new Error('Project not found');

    fs.rmSync(this.projectPath(projectId), { recursive: true, force: true });

    let activeId = this.getActiveId();
    if (activeId === projectId || !this.projectExists(activeId)) {
      const remaining = this.listProjects();
      if (remaining.length) {
        activeId = remaining[0].id;
        this.setActiveId(activeId);
      } else {
        activeId = null;
        try { fs.unlinkSync(this.activeFile); } catch { /* no active project */ }
      }
    }

    return { deleted: projectId, activeId };
  }

  openProject(id) {
    if (!this.projectExists(id)) throw new Error('Project not found');
    const configPath = path.join(this.projectPath(id), 'project.json');
    const config = JSON.parse(readFileWithRetry(configPath));
    config.studio = {
      ...(config.studio || {}),
      lastOpenedWith: STUDIO_VERSION,
      lastOpenedAt: new Date().toISOString()
    };
    writeJsonFileSafe(configPath, config);
    this.ensureProjectLayout(id, { force: true });
    this.migrateTemplateIfNeeded(id);
    this.syncProjectArtifacts(id);
    this.setActiveId(id);
    return this.getActiveProject();
  }

  getActiveProject() {
    const id = this.getActiveId();
    if (!id) return null;
    const config = this.readProjectConfig(id);
    let explorer = null;
    try {
      explorer = this.buildExplorerTree(id);
    } catch (err) {
      console.warn(`Explorer tree unavailable for ${id}: ${err.message}`);
    }
    return {
      id,
      name: config.name || id,
      subtitle: config.subtitle || '',
      startupScreen: config.startupScreen || '100_Overview',
      config,
      navigation: this.readNavigation(id),
      screens: this.listScreens(id),
      explorer
    };
  }

  defaultGraphicsTransferFolder() {
    return path.join(this.rootDir, '..', 'hmi', 'import_templates');
  }

  listGraphicExportTargets(projectId) {
    const displays = this.listScreens(projectId).map((s) => ({
      id: s.id,
      label: s.title || s.id,
      kind: 'display'
    }));
    const globalObjects = this.listGlobalObjects(projectId).map((g) => ({
      id: g.id,
      label: g.title || g.id,
      kind: 'global-object'
    }));
    return [...globalObjects, ...displays];
  }

  exportGraphicsToFolder(projectId, folder, items) {
    if (!this.projectExists(projectId)) throw new Error('Project not found');
    if (!folder?.trim()) throw new Error('Export folder required');
    const dest = path.resolve(folder.trim());
    fs.mkdirSync(dest, { recursive: true });

    const exported = [];
    for (const item of items || []) {
      let src;
      let fileName;
      if (item.kind === 'global-object') {
        src = this.globalObjectFilePath(projectId, item.id);
        fileName = `${item.id}.json`;
      } else {
        src = this.screenFilePath(projectId, item.id);
        fileName = `${item.id}.json`;
      }
      if (!fs.existsSync(src)) continue;
      fs.copyFileSync(src, path.join(dest, fileName));
      exported.push({ id: item.id, kind: item.kind, fileName });
    }
    return { folder: dest, exported };
  }

  importGraphicsFromFolder(projectId, folder) {
    if (!this.projectExists(projectId)) throw new Error('Project not found');
    if (!folder?.trim()) throw new Error('Import folder required');
    const srcDir = path.resolve(folder.trim());
    if (!fs.existsSync(srcDir)) throw new Error('Import folder not found');

    const gfxDir = this.gfxDir(projectId);
    const goDir = path.join(this.projectPath(projectId), 'Global Objects');
    fs.mkdirSync(goDir, { recursive: true });

    const imported = [];
    for (const f of fs.readdirSync(srcDir)) {
      if (!f.endsWith('.json')) continue;
      const full = path.join(srcDir, f);
      if (!fs.statSync(full).isFile()) continue;
      const data = JSON.parse(fs.readFileSync(full, 'utf8'));
      const dest = (data.kind === 'global-object')
        ? path.join(goDir, f)
        : path.join(gfxDir, f);
      fs.copyFileSync(full, dest);
      imported.push({ fileName: f, kind: data.kind === 'global-object' ? 'global-object' : 'display' });
    }
    return { folder: srcDir, imported };
  }
}

module.exports = { ProjectService };
