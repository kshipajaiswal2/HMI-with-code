const fs = require('fs');
const path = require('path');

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

function readImageFileMeta(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const buf = fs.readFileSync(filePath);
  let width = null;
  let height = null;
  let bitDepth = null;
  let colorType = null;

  if (ext === '.png' && buf.length >= 26 && buf.toString('ascii', 1, 4) === 'PNG') {
    width = buf.readUInt32BE(16);
    height = buf.readUInt32BE(20);
    bitDepth = buf[24];
    colorType = buf[25];
  } else if (ext === '.bmp' && buf.length >= 28 && buf.readUInt16LE(0) === 0x4D42) {
    width = buf.readInt32LE(18);
    height = Math.abs(buf.readInt32LE(22));
    bitDepth = buf.readUInt16LE(28);
    colorType = bitDepth <= 8 ? 3 : 2;
  } else if (ext === '.gif' && buf.length >= 10 && buf.toString('ascii', 0, 3) === 'GIF') {
    width = buf.readUInt16LE(6);
    height = buf.readUInt16LE(8);
    bitDepth = 8;
    colorType = 3;
  } else if ((ext === '.jpg' || ext === '.jpeg') && buf.length > 4) {
    let offset = 2;
    while (offset < buf.length - 8) {
      if (buf[offset] !== 0xFF) break;
      const marker = buf[offset + 1];
      const len = buf.readUInt16BE(offset + 2);
      if (marker === 0xC0 || marker === 0xC2) {
        height = buf.readUInt16BE(offset + 5);
        width = buf.readUInt16BE(offset + 7);
        bitDepth = buf[offset + 4] * (marker === 0xC2 ? 3 : 1);
        colorType = 2;
        break;
      }
      offset += 2 + len;
    }
  }

  const format = IMAGE_FORMAT_LABELS[ext] || ext.replace(/^\./, '').toUpperCase() || 'Unknown';
  let typeLabel = 'True color';
  if (bitDepth === 1) typeLabel = 'Monochrome';
  else if (colorType === 3 || bitDepth === 8) typeLabel = '256 color';
  else if (colorType === 0) typeLabel = 'Grayscale';

  return {
    width: width || 0,
    height: height || 0,
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
  'Tag'
];

class ProjectService {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.projectsDir = path.join(rootDir, 'projects');
    this.templateDir = path.join(this.projectsDir, '_template');
    this.standardScreensPath = path.join(rootDir, 'config', 'standard-screens.json');
    this.activeFile = path.join(this.projectsDir, '.active.json');
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
    const lib = this.readStandardLibrary();
    const gfxDir = path.join(this.templateDir, 'Gfx');
    if (!fs.existsSync(gfxDir)) fs.mkdirSync(gfxDir, { recursive: true });

    for (const entry of lib.screens || []) {
      const dest = path.join(gfxDir, `${entry.id}.json`);
      const source = path.join(this.rootDir, 'screens', `${entry.id}.json`);
      if (fs.existsSync(source)) {
        fs.copyFileSync(source, dest);
      }
    }
    this.syncProjectArtifacts('_template');
    this.copyImageSeedDir(this.sharedImageLibraryDir(), path.join(this.templateDir, 'Images'));
  }

  /** Create FactoryTalk-style folder tree; migrate legacy screens/ → Gfx/ */
  ensureProjectLayout(projectId) {
    const base = this.projectPath(projectId);
    if (!fs.existsSync(base)) return;
    for (const folder of PROJECT_FOLDERS) {
      fs.mkdirSync(path.join(base, folder), { recursive: true });
    }
    this.migrateLegacyScreens(projectId);
    this.ensureDefaultGlobalObjects(projectId);
    this.seedDefaultImages(projectId);
    this.applyProjectDisplayDefaults(projectId);
  }

  applyProjectDisplayDefaults(projectId) {
    const base = this.projectPath(projectId);
    if (!fs.existsSync(base)) return;
    const configPath = path.join(base, 'project.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.runtime = config.runtime || {};
    const defaultBg = config.runtime.displayBackground || DEFAULT_DISPLAY_BACKGROUND;
    if (!config.runtime.displayBackground) {
      config.runtime.displayBackground = defaultBg;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }

    const gfxDir = path.join(base, 'Gfx');
    if (!fs.existsSync(gfxDir)) return;
    for (const f of fs.readdirSync(gfxDir)) {
      if (!f.endsWith('.json')) continue;
      const file = path.join(gfxDir, f);
      const screen = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!screen.displaySettings) screen.displaySettings = {};
      const bg = screen.displaySettings.backgroundColor;
      if (!bg || bg === '#808080' || bg.toLowerCase() === '#efefef') {
        screen.displaySettings.backgroundColor = defaultBg;
        screen.displaySettings.useProjectSize = screen.displaySettings.useProjectSize ?? true;
        fs.writeFileSync(file, JSON.stringify(screen, null, 2));
      }
    }

    const templateGo = path.join(base, 'Global Objects', 'Template.json');
    if (fs.existsSync(templateGo)) {
      const go = JSON.parse(fs.readFileSync(templateGo, 'utf8'));
      go.displaySettings = go.displaySettings || {};
      if (!go.displaySettings.backgroundColor || go.displaySettings.backgroundColor === '#808080'
        || go.displaySettings.backgroundColor === '#EFEFEF') {
        go.displaySettings.backgroundColor = defaultBg;
        fs.writeFileSync(templateGo, JSON.stringify(go, null, 2));
      }
    }
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
      this.ensureProjectLayout(entry.name);
    }
  }

  imagesDir(projectId) {
    this.ensureProjectLayout(projectId);
    return path.join(this.projectPath(projectId), 'Images');
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
    this.ensureProjectLayout(projectId);
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
        fs.writeFileSync(destFile, JSON.stringify({
          id: 'Template',
          title: 'Template',
          kind: 'global-object',
          layout: 'global',
          securityLevel: 0,
          displaySettings: {
            useProjectSize: false,
            width: 1024,
            height: 768,
            backgroundColor: '#EFEFEF'
          },
          components: []
        }, null, 2));
      }
    }
  }

  listGlobalObjects(projectId) {
    const dir = this.globalObjectsDir(projectId);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const obj = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        return { id: obj.id || f.replace(/\.json$/, ''), title: obj.title || obj.id, file: f };
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  getGlobalObject(projectId, objectId) {
    const file = this.globalObjectFilePath(projectId, objectId);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
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
    this.ensureProjectLayout(projectId);
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

    const tagDir = path.join(this.projectPath(projectId), 'Tag');
    fs.mkdirSync(tagDir, { recursive: true });
    const csvLines = ['Tag Name,Type,Description'];
    for (const t of config.tags || []) {
      const desc = String(t.description || '').replace(/"/g, '""');
      csvLines.push(`"${t.name}","${t.type}","${desc}"`);
    }
    fs.writeFileSync(
      path.join(tagDir, `${projectId}-Tags.CSV`),
      csvLines.join('\r\n') + '\r\n',
      'utf8'
    );

    const settingsDir = path.join(this.projectPath(projectId), 'ProjectSettings');
    fs.mkdirSync(settingsDir, { recursive: true });
    fs.writeFileSync(
      path.join(settingsDir, 'project.json'),
      JSON.stringify(config, null, 2),
      'utf8'
    );

    if (config.alarms?.length) {
      const alarmDir = path.join(this.projectPath(projectId), 'M_Alarms');
      fs.mkdirSync(alarmDir, { recursive: true });
      fs.writeFileSync(
        path.join(alarmDir, 'alarms.json'),
        JSON.stringify(config.alarms, null, 2),
        'utf8'
      );
    }
  }

  seedProjectFromTemplate(projectId) {
    const lib = this.readStandardLibrary();
    const templateGfx = path.join(this.templateDir, 'Gfx');
    const projectGfx = this.gfxDir(projectId);

    for (const entry of lib.screens || []) {
      const src = path.join(templateGfx, `${entry.id}.json`);
      const legacySrc = path.join(this.templateDir, 'screens', `${entry.id}.json`);
      const dest = path.join(projectGfx, `${entry.id}.json`);
      const from = fs.existsSync(src) ? src : legacySrc;
      if (fs.existsSync(from)) {
        fs.copyFileSync(from, dest);
      }
    }

    const navSrc = path.join(this.templateDir, 'navigation.json');
    const navDest = path.join(this.projectPath(projectId), 'navigation.json');
    if (fs.existsSync(navSrc)) fs.copyFileSync(navSrc, navDest);

    const templateGlobalDir = path.join(this.templateDir, 'Global Objects');
    const projectGlobalDir = this.globalObjectsDir(projectId);
    if (fs.existsSync(templateGlobalDir)) {
      for (const f of fs.readdirSync(templateGlobalDir)) {
        if (!f.endsWith('.json')) continue;
        const dest = path.join(projectGlobalDir, f);
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(path.join(templateGlobalDir, f), dest);
        }
      }
    }

    const cfgPath = path.join(this.projectPath(projectId), 'project.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    cfg.startupScreen = lib.startupScreen || '100_Overview';
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
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
    return JSON.parse(fs.readFileSync(file, 'utf8'));
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
        const screen = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        return { id: screen.id, title: screen.title, navGroup: screen.navGroup, file: f };
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  getScreen(projectId, screenId) {
    const file = this.screenFilePath(projectId, screenId);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
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
    const file = path.join(this.projectPath(projectId), 'project.json');
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
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
    if (patch.tags) {
      config.tags = patch.tags;
    }
    for (const key of Object.keys(patch)) {
      if (!['studio', 'communication', 'tags', 'runtime', 'inactivity'].includes(key)) {
        config[key] = patch[key];
      }
    }
    fs.writeFileSync(file, JSON.stringify(config, null, 2));
    this.syncProjectArtifacts(projectId);
    return config;
  }

  updateScreen(projectId, screenId, patch) {
    if (!this.projectExists(projectId)) throw new Error('Project not found');
    const file = this.screenFilePath(projectId, screenId);
    if (!fs.existsSync(file)) throw new Error('Screen not found');
    const screen = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (patch.displaySettings) {
      const ds = { ...(screen.displaySettings || {}), ...patch.displaySettings };
      if (ds.useProjectSize) {
        delete ds.width;
        delete ds.height;
      }
      screen.displaySettings = ds;
      delete patch.displaySettings;
    }
    Object.assign(screen, patch);
    fs.writeFileSync(file, JSON.stringify(screen, null, 2));
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
    this.ensureProjectLayout(projectId);
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

    const host = require('os').hostname();
    const projectLabel = config.name || projectId;

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
        label: 'HMI Tags',
        icon: 'tags',
        children: [
          { type: 'item', id: 'hmi-tags-list', label: 'Tags', icon: 'tags', action: 'tags' }
        ]
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
          { type: 'item', id: 'parameters', label: 'Parameters', icon: 'parameters', action: 'parameters' },
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
        children: [
          { type: 'item', id: 'linx-communications', label: 'Communications Setup', icon: 'comm', action: 'communications' }
        ]
      }
    ];

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
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    this.seedProjectFromTemplate(id);
    this.ensureProjectLayout(id);
    this.removeLegacyScreensDir(id);
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
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.studio = {
      ...(config.studio || {}),
      lastOpenedWith: STUDIO_VERSION,
      lastOpenedAt: new Date().toISOString()
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    this.ensureProjectLayout(id);
    this.syncProjectArtifacts(id);
    this.setActiveId(id);
    return this.getActiveProject();
  }

  getActiveProject() {
    const id = this.getActiveId();
    if (!id) return null;
    const config = this.readProjectConfig(id);
    return {
      id,
      name: config.name || id,
      subtitle: config.subtitle || '',
      startupScreen: config.startupScreen || '100_Overview',
      config,
      navigation: this.readNavigation(id),
      screens: this.listScreens(id),
      explorer: this.buildExplorerTree(id)
    };
  }
}

module.exports = { ProjectService };
