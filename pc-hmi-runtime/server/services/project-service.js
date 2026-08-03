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
    const lib = this.readStandardLibrary();
    const screensDir = path.join(this.templateDir, 'screens');
    if (!fs.existsSync(screensDir)) fs.mkdirSync(screensDir, { recursive: true });

    for (const entry of lib.screens || []) {
      const dest = path.join(screensDir, `${entry.id}.json`);
      if (!fs.existsSync(dest)) {
        const fallback = path.join(this.rootDir, 'screens', `${entry.id}.json`);
        if (fs.existsSync(fallback)) {
          fs.copyFileSync(fallback, dest);
        }
      }
    }
  }

  seedProjectFromTemplate(projectId) {
    const lib = this.readStandardLibrary();
    const templateScreens = path.join(this.templateDir, 'screens');
    const projectScreens = path.join(this.projectPath(projectId), 'screens');
    fs.mkdirSync(projectScreens, { recursive: true });

    for (const entry of lib.screens || []) {
      const src = path.join(templateScreens, `${entry.id}.json`);
      const dest = path.join(projectScreens, `${entry.id}.json`);
      if (fs.existsSync(src) && !fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
      }
    }

    const navSrc = path.join(this.templateDir, 'navigation.json');
    const navDest = path.join(this.projectPath(projectId), 'navigation.json');
    if (fs.existsSync(navSrc)) fs.copyFileSync(navSrc, navDest);

    const cfgPath = path.join(this.projectPath(projectId), 'project.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    cfg.startupScreen = lib.startupScreen || '100_Overview';
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
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
        const config = this.readProjectConfig(d.name);
        const screens = this.listScreens(d.name);
        return {
          id: d.name,
          name: config.name || d.name,
          subtitle: config.subtitle || '',
          screenCount: screens.length,
          updatedAt: fs.statSync(this.projectPath(d.name)).mtime.toISOString()
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
    const dir = path.join(this.projectPath(projectId), 'screens');
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
    const file = path.join(this.projectPath(projectId), 'screens', `${screenId}.json`);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  getFolderForScreen(screenId) {
    const lib = this.readStandardLibrary();
    const match = lib.screens?.find((s) => s.id === screenId);
    if (match) return match.folder;
    const prefix = screenId.split('_')[0];
    const folder = DISPLAY_FOLDERS.find((f) => f.id.startsWith(prefix + '_'));
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
    const file = path.join(this.projectPath(projectId), 'screens', `${id}.json`);
    if (fs.existsSync(file)) throw new Error(`Screen ${id} already exists`);

    const folderId = folder || this.getFolderForScreen(`${page}_x`);
    const navGroup = this.navGroupForFolder(folderId);
    const screen = {
      id,
      title: safeName.replace(/_/g, ' '),
      navGroup,
      layout: 'standard',
      securityLevel: 0,
      components: [
        ...(navGroup !== 'none' && ['overview', 'manual', 'alarms', 'recipe'].includes(navGroup)
          ? [{ type: 'SubNav', navKey: navGroup }]
          : []),
        { type: 'SectionHeader', label: safeName.replace(/_/g, ' ') },
        { type: 'Text', label: 'New display — add components in the screen JSON file.' }
      ]
    };
    fs.writeFileSync(file, JSON.stringify(screen, null, 2));
    return screen;
  }

  updateProjectConfig(projectId, patch) {
    if (!this.projectExists(projectId)) throw new Error('Project not found');
    const file = path.join(this.projectPath(projectId), 'project.json');
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (patch.name !== undefined) {
      patch.name = this.assertUniqueProjectName(patch.name, projectId);
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
    return config;
  }

  updateScreen(projectId, screenId, patch) {
    if (!this.projectExists(projectId)) throw new Error('Project not found');
    const file = path.join(this.projectPath(projectId), 'screens', `${screenId}.json`);
    if (!fs.existsSync(file)) throw new Error('Screen not found');
    const screen = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (patch.displaySettings) {
      screen.displaySettings = { ...(screen.displaySettings || {}), ...patch.displaySettings };
      delete patch.displaySettings;
    }
    Object.assign(screen, patch);
    fs.writeFileSync(file, JSON.stringify(screen, null, 2));
    return screen;
  }

  deleteScreen(projectId, screenId) {
    if (!this.projectExists(projectId)) throw new Error('Project not found');
    const file = path.join(this.projectPath(projectId), 'screens', `${screenId}.json`);
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

    return {
      projectId,
      projectName: config.name || projectId,
      host: require('os').hostname(),
      tree: [
        {
          type: 'folder',
          id: 'system',
          label: 'System',
          icon: 'system',
          children: [
            { type: 'item', id: 'project-settings', label: 'Project Settings', icon: 'settings' },
            { type: 'item', id: 'runtime-security', label: 'Runtime Security', icon: 'lock' },
            { type: 'item', id: 'diagnostics-setup', label: 'Diagnostics List Setup', icon: 'diag' },
            { type: 'item', id: 'communications', label: 'Communications Setup', icon: 'comm' },
            { type: 'item', id: 'startup', label: 'Startup', icon: 'play' }
          ]
        },
        {
          type: 'folder',
          id: 'hmi-tags',
          label: 'HMI Tags',
          icon: 'tags',
          action: 'tags'
        },
        {
          type: 'folder',
          id: 'alarms',
          label: 'Alarms',
          icon: 'alarm',
          action: 'alarms'
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
            }
          ]
        }
      ]
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

  createProject(name) {
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
    config.createdAt = new Date().toISOString();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    this.seedProjectFromTemplate(id);

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
