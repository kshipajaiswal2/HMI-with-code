const socket = io();

const bridgeStatus = document.getElementById('bridgeStatus');
const displaysList = document.getElementById('displaysList');
const sidebarTitle = document.querySelector('.displays-header h2');
const exportsCard = document.querySelector('.exports-card');
const uploadInput = document.getElementById('uploadInput');
const defaultUploadInput = document.getElementById('defaultUploadInput');
const addDisplayBtn = document.getElementById('addDisplayBtn');
const addFolderBtn = document.getElementById('addFolderBtn');
const removeFolderBtn = document.getElementById('removeFolderBtn');
const uploadDisplayBtn = document.getElementById('uploadDisplayBtn');
const removeDisplayBtn = document.getElementById('removeDisplayBtn');
const refreshBtn = document.getElementById('refreshBtn');
const showDisplaysBtn = document.getElementById('showDisplaysBtn');
const showDefaultsBtn = document.getElementById('showDefaultsBtn');
const seedDefaultsBtn = document.getElementById('seedDefaultsBtn');
const newProjectBtn = document.getElementById('newProjectBtn');
const projectCreatePanel = document.getElementById('projectCreatePanel');
const projectNameInput = document.getElementById('projectNameInput');
const createProjectBtn = document.getElementById('createProjectBtn');
const cancelProjectBtn = document.getElementById('cancelProjectBtn');
const sidebarNamePanel = document.getElementById('sidebarNamePanel');
const sidebarNameLabel = document.getElementById('sidebarNameLabel');
const sidebarNameInput = document.getElementById('sidebarNameInput');
const sidebarNameConfirmBtn = document.getElementById('sidebarNameConfirmBtn');
const sidebarNameCancelBtn = document.getElementById('sidebarNameCancelBtn');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const mainGrid = document.getElementById('mainGrid');

const displayName = document.getElementById('displayName');
const screenWidth = document.getElementById('screenWidth');
const screenHeight = document.getElementById('screenHeight');
const xmlEditor = document.getElementById('xmlEditor');
const previewBtn = document.getElementById('previewBtn');
const addObjectBtn = document.getElementById('addObjectBtn');
const applySizeBtn = document.getElementById('applySizeBtn');
const buildPackageBtn = document.getElementById('buildPackageBtn');
const buildAllPackageBtn = document.getElementById('buildAllPackageBtn');
const previewPane = document.getElementById('previewPane');
const packageResult = document.getElementById('packageResult');

const objType = document.getElementById('objType');
const objName = document.getElementById('objName');
const objCaption = document.getElementById('objCaption');
const objLeft = document.getElementById('objLeft');
const objTop = document.getElementById('objTop');
const objWidth = document.getElementById('objWidth');
const objHeight = document.getElementById('objHeight');
const objBackColor = document.getElementById('objBackColor');
const objBorderColor = document.getElementById('objBorderColor');
const objTextColor = document.getElementById('objTextColor');
const objFontSize = document.getElementById('objFontSize');
const applyObjectBtn = document.getElementById('applyObjectBtn');
const objBackColorPicker = document.getElementById('objBackColorPicker');
const objBorderColorPicker = document.getElementById('objBorderColorPicker');
const objTextColorPicker = document.getElementById('objTextColorPicker');
const objBackColorSwatch = document.getElementById('objBackColorSwatch');
const objBorderColorSwatch = document.getElementById('objBorderColorSwatch');
const objTextColorSwatch = document.getElementById('objTextColorSwatch');
const objectPanelDetails = document.getElementById('objectPanelDetails');

let selectedDisplay = '';
let selectedFiles = [];
let selectedObjectIndex = null;
let usingUploadedList = false;
let currentDisplayRows = [];
let currentDefaultRows = [];
let selectedDefaultTemplate = '';
let selectedFolderName = '';
let selectedFolderIsCustom = false;
let hiddenDisplayNames = new Set();
let draggedDisplayKey = '';
let sidebarNameSubmit = null;
let folderNames = [];
let folderAssignments = {};
let folderCollapsedNames = new Set();
let previewImageNonce = Date.now();
let historyPast = [];
let historyFuture = [];
let applyingHistory = false;
let copiedObjectXml = '';
let copiedObjectName = '';
let copiedPasteCount = 0;

const TEMPLATE_DISPLAY_NAME = 'Template.xml';
const DEFAULT_PREVIEW_WIDTH = 1024;
const DEFAULT_PREVIEW_HEIGHT = 768;
const SIDEBAR_STORAGE_KEY = 'displayXmlBridge.sidebarCollapsed';
const SIDEBAR_MODE_STORAGE_KEY = 'displayXmlBridge.sidebarMode';
const PROJECT_NAME_STORAGE_KEY = 'displayXmlBridge.projectName';
const PROJECTS_STORAGE_KEY = 'displayXmlBridge.projects';
const ACTIVE_PROJECT_STORAGE_KEY = 'displayXmlBridge.activeProjectId';
const SIDEBAR_MODE_DISPLAYS = 'displays';
const SIDEBAR_MODE_DEFAULTS = 'defaults';
const UNGROUPED_FOLDER_NAME = 'Ungrouped';
const HISTORY_LIMIT = 120;
let sidebarMode = SIDEBAR_MODE_DISPLAYS;
let currentProjectName = normalizeProjectName(localStorage.getItem(PROJECT_NAME_STORAGE_KEY) || 'Untitled Project');
let projectList = loadProjectList();
let activeProjectId = localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY) || '';
let activeProjectFolder = '';
let activeProjectScreen = '';
let activeProjectKey = '';

function displayKey(name) {
  return String(name || '').toLowerCase();
}

function isGlobalObjectFile(file) {
  if (!file) {
    return false;
  }

  const kind = String(file.kind || '').toLowerCase();
  if (kind === 'global-object') {
    return true;
  }

  return /_addons\.xml$/i.test(String(file.name || ''));
}

function baseFileName(name) {
  return String(name || '').replace(/\.xml$/i, '');
}

function isNumberedDisplayName(name) {
  return /^\d{3}_/.test(baseFileName(name));
}

function isEditableSource(file) {
  const source = String(file?.source || '').toLowerCase();
  return source === 'edited' || source === 'uploaded';
}

function isDefaultMode() {
  return sidebarMode === SIDEBAR_MODE_DEFAULTS;
}

function createProjectKey(projectId, folderName, screenName) {
  return [projectId, folderName, screenName].map((part) => String(part || '')).join('::');
}

function loadProjectList() {
  const text = localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function persistProjectList() {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectList));
}

function normalizeProjectList() {
  projectList = Array.isArray(projectList) ? projectList : [];
  for (const project of projectList) {
    project.id = String(project.id || `project-${Date.now()}`);
    project.name = normalizeProjectName(project.name || 'Untitled Project');
    project.collapsed = Boolean(project.collapsed);
    project.folders = Array.isArray(project.folders) ? project.folders : [];
    for (const folder of project.folders) {
      folder.name = String(folder.name || 'Folder');
      folder.collapsed = Boolean(folder.collapsed);
      folder.screens = Array.isArray(folder.screens) ? folder.screens : [];
      for (const screen of folder.screens) {
        screen.name = String(screen.name || 'Screen.xml');
        screen.xml = String(screen.xml || '');
        screen.lastModified = String(screen.lastModified || new Date().toISOString());
        screen.sizeBytes = Number.isFinite(Number(screen.sizeBytes)) ? Number(screen.sizeBytes) : new Blob([screen.xml]).size;
        const meta = readSizeFromXml(screen.xml);
        screen.width = Number.isFinite(Number(screen.width)) ? Number(screen.width) : meta.width;
        screen.height = Number.isFinite(Number(screen.height)) ? Number(screen.height) : meta.height;
      }
    }
  }
}

function saveProjectList() {
  normalizeProjectList();
  persistProjectList();
}

function getProjectById(projectId) {
  return projectList.find((project) => project.id === projectId) || null;
}

function getActiveProject() {
  return getProjectById(activeProjectId);
}

function setActiveProject(project) {
  if (!project) {
    activeProjectId = '';
    activeProjectFolder = '';
    activeProjectScreen = '';
    activeProjectKey = '';
    localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
    setProjectName('Untitled Project');
    return;
  }

  activeProjectId = project.id;
  localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, activeProjectId);
  setProjectName(project.name);
}

function setActiveProjectScreen(project, folderName, screenName) {
  setActiveProject(project);
  activeProjectFolder = String(folderName || '');
  activeProjectScreen = String(screenName || '');
  activeProjectKey = createProjectKey(project?.id, folderName, screenName);
}

function findProjectFolder(project, folderName) {
  if (!project || !Array.isArray(project.folders)) {
    return null;
  }

  const folderKey = String(folderName || '').toLowerCase();
  return project.folders.find((folder) => String(folder.name || '').toLowerCase() === folderKey) || null;
}

function findProjectScreen(project, folderName, screenName) {
  const folder = findProjectFolder(project, folderName);
  if (!folder || !Array.isArray(folder.screens)) {
    return null;
  }

  const screenKey = String(screenName || '').toLowerCase();
  return folder.screens.find((screen) => String(screen.name || '').toLowerCase() === screenKey) || null;
}

function ensureProjectFolder(project, folderName) {
  if (!project) {
    return null;
  }

  const normalizedName = String(folderName || '').trim() || 'Ungrouped';
  let folder = findProjectFolder(project, normalizedName);
  if (!folder) {
    folder = {
      name: normalizedName,
      collapsed: false,
      screens: []
    };
    project.folders.push(folder);
  }

  return folder;
}

function uniqueScreenName(folder, rawName) {
  const base = String(rawName || '').trim().replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  const candidateBase = base.endsWith('.xml') ? base : `${base || 'New_Screen'}.xml`;
  const existingNames = new Set((folder?.screens || []).map((screen) => displayKey(screen.name)));
  if (!existingNames.has(displayKey(candidateBase))) {
    return candidateBase;
  }

  const stem = candidateBase.replace(/\.xml$/i, '');
  let counter = 1;
  while (existingNames.has(displayKey(`${stem}_${counter}.xml`))) {
    counter += 1;
  }

  return `${stem}_${counter}.xml`;
}

function projectScreenFromTemplate(name, xml) {
  const meta = readSizeFromXml(xml);
  return {
    name,
    xml,
    width: meta.width,
    height: meta.height,
    sizeBytes: new Blob([xml]).size,
    lastModified: new Date().toISOString()
  };
}

function getProjectTemplateXml(project) {
  if (!project || !Array.isArray(project.folders)) {
    return '';
  }

  const templateKey = displayKey(TEMPLATE_DISPLAY_NAME);
  for (const folder of project.folders) {
    for (const screen of folder?.screens || []) {
      if (displayKey(screen?.name) === templateKey && typeof screen?.xml === 'string' && screen.xml.trim()) {
        return screen.xml;
      }
    }
  }

  return '';
}

async function loadDisplayXmlDirect(name) {
  const res = await fetch(`/api/displays/${encodeURIComponent(name)}`);
  const data = await readApiJson(res);
  if (!res.ok) {
    throw new Error(data.error || `Failed to load ${name}`);
  }

  return data;
}

async function resolveNewProjectScreenTemplateXml(project) {
  const projectTemplateXml = getProjectTemplateXml(project);
  if (projectTemplateXml) {
    return projectTemplateXml;
  }

  try {
    const template = await loadDefaultTemplateXml(TEMPLATE_DISPLAY_NAME);
    if (typeof template?.xml === 'string' && template.xml.trim()) {
      return template.xml;
    }
  } catch (_err) {
    // Fallback to edited/uploaded displays if default template isn't present.
  }

  const displayTemplate = await loadDisplayXmlDirect(TEMPLATE_DISPLAY_NAME);
  return String(displayTemplate?.xml || '');
}

async function createProjectScreen(projectId, folderName, rawName) {
  const project = getProjectById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const folder = ensureProjectFolder(project, folderName);
  if (!folder) {
    throw new Error('Folder not found');
  }

  const screenName = uniqueScreenName(folder, rawName);
  const templateXml = await resolveNewProjectScreenTemplateXml(project);
  const screen = projectScreenFromTemplate(screenName, templateXml);
  folder.screens.push(screen);
  saveProjectList();
  setActiveProjectScreen(project, folder.name, screen.name);
  setEditorProjectScreen(project, folder.name, screen, screen.xml);
  renderProjectSidebar();
  return screen;
}

function removeProjectById(projectId) {
  const projectIndex = projectList.findIndex((project) => project.id === projectId);
  if (projectIndex < 0) {
    return false;
  }

  projectList.splice(projectIndex, 1);
  if (activeProjectId === projectId) {
    const nextProject = projectList[projectIndex] || projectList[projectIndex - 1] || null;
    setActiveProject(nextProject);
  }
  saveProjectList();
  renderProjectSidebar();
  return true;
}

function removeProjectScreen(projectId, folderName, screenName) {
  const project = getProjectById(projectId);
  if (!project) {
    return false;
  }

  const folder = findProjectFolder(project, folderName);
  if (!folder) {
    return false;
  }

  const screenIndex = folder.screens.findIndex((screen) => displayKey(screen.name) === displayKey(screenName));
  if (screenIndex < 0) {
    return false;
  }

  const removed = folder.screens.splice(screenIndex, 1)[0];
  if (activeProjectKey === createProjectKey(projectId, folderName, screenName)) {
    const nextScreen = folder.screens[screenIndex] || folder.screens[screenIndex - 1] || null;
    if (nextScreen) {
      setEditorProjectScreen(project, folder.name, nextScreen, nextScreen.xml);
    } else {
      setActiveProject(project);
      selectedDisplay = '';
      selectedFiles = [];
      displayName.value = 'None';
      xmlEditor.value = '';
      renderPreview();
    }
  }

  saveProjectList();
  renderProjectSidebar();
  return removed;
}

function moveProjectScreen(fromProjectId, fromFolderName, screenName, toProjectId, toFolderName, insertBeforeScreenName = '') {
  const fromProject = getProjectById(fromProjectId);
  const toProject = getProjectById(toProjectId);
  if (!fromProject || !toProject) {
    return false;
  }

  const fromFolder = findProjectFolder(fromProject, fromFolderName);
  const toFolder = ensureProjectFolder(toProject, toFolderName);
  if (!fromFolder || !toFolder) {
    return false;
  }

  const screenIndex = fromFolder.screens.findIndex((screen) => displayKey(screen.name) === displayKey(screenName));
  if (screenIndex < 0) {
    return false;
  }

  const [screen] = fromFolder.screens.splice(screenIndex, 1);
  let targetIndex = toFolder.screens.length;
  if (insertBeforeScreenName) {
    const beforeIndex = toFolder.screens.findIndex((item) => displayKey(item.name) === displayKey(insertBeforeScreenName));
    if (beforeIndex >= 0) {
      targetIndex = beforeIndex;
    }
  }

  toFolder.screens.splice(targetIndex, 0, screen);
  saveProjectList();
  renderProjectSidebar();
  return true;
}

function findProjectScreenByLocation(projectId, folderName, screenName) {
  const project = getProjectById(projectId);
  const folder = findProjectFolder(project, folderName);
  const screen = folder ? findProjectScreen(project, folder.name, screenName) : null;
  return { project, folder, screen };
}

function getProjectScreenByKey(projectKey) {
  for (const project of projectList) {
    for (const folder of project.folders || []) {
      for (const screen of folder.screens || []) {
        if (createProjectKey(project.id, folder.name, screen.name) === projectKey) {
          return { project, folder, screen };
        }
      }
    }
  }

  return null;
}

function groupTemplateFiles(files) {
  const globalObjectFiles = files.filter((file) => isGlobalObjectFile(file) || !isNumberedDisplayName(file.name));
  const globalObjectKeySet = new Set(globalObjectFiles.map((file) => displayKey(file.name)));
  const templateFiles = files.filter((file) => !globalObjectKeySet.has(displayKey(file.name)));

  const grouped = new Map();
  for (const file of templateFiles) {
    const base = String(file.name || '').replace(/\.xml$/i, '');
    const match = base.match(/^(\d{3})/);
    const bucket = match ? Math.floor(Number(match[1]) / 100) * 100 : null;
    const groupKey = Number.isFinite(bucket) ? String(bucket).padStart(3, '0') : 'UNGROUPED';
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey).push(file);
  }

  const folders = [];
  for (const [groupKey, groupFiles] of grouped.entries()) {
    if (groupKey === 'UNGROUPED') {
      folders.push({ key: groupKey, name: 'Ungrouped', screens: groupFiles });
      continue;
    }

    const exact = groupFiles.find((file) => String(file.name || '').toLowerCase().startsWith(`${groupKey.toLowerCase()}_`));
    const folderName = String((exact || groupFiles[0]).name || '').replace(/\.xml$/i, '');
    folders.push({ key: groupKey, name: folderName, screens: groupFiles });
  }

  folders.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true, sensitivity: 'base' }));

  return { folders, globalObjectFiles };
}

function screenMetaFromXml(name, xml) {
  const meta = readSizeFromXml(xml);
  return {
    name,
    xml,
    width: meta.width,
    height: meta.height,
    sizeBytes: new Blob([xml]).size,
    lastModified: new Date().toISOString()
  };
}

function normalizeProjectName(name) {
  const next = String(name || '').trim().replace(/\s+/g, ' ');
  return next || 'Untitled Project';
}

function setProjectName(name) {
  currentProjectName = normalizeProjectName(name);
  localStorage.setItem(PROJECT_NAME_STORAGE_KEY, currentProjectName);
  if (sidebarTitle) {
    sidebarTitle.textContent = 'Projects';
  }
  document.title = `${currentProjectName} - Display XML Bridge`;
}

function normalizeFolderName(name) {
  return String(name || '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildAutoDisplayFolderMap(displayFiles) {
  const autoBuckets = new Map();
  for (const file of displayFiles) {
    const base = String(file.name || '').replace(/\.xml$/i, '');
    const match = base.match(/^(\d{3})/);
    if (!match) {
      continue;
    }

    const bucket = Math.floor(Number(match[1]) / 100) * 100;
    if (!autoBuckets.has(bucket)) {
      autoBuckets.set(bucket, []);
    }
    autoBuckets.get(bucket).push(file.name);
  }

  const autoFolderMap = new Map();
  for (const [bucket, names] of autoBuckets.entries()) {
    const prefix = String(bucket).padStart(3, '0');
    const exact = names.find((name) => String(name).toLowerCase().startsWith(`${prefix}_`));
    autoFolderMap.set(bucket, String(exact || names[0]).replace(/\.xml$/i, ''));
  }

  return autoFolderMap;
}

function resolveDisplayFolderName(fileName, autoFolderMap) {
  const key = displayKey(fileName);
  const assigned = normalizeFolderName(folderAssignments[key] || '');
  if (assigned) {
    return assigned;
  }

  const base = String(fileName || '').replace(/\.xml$/i, '');
  const match = base.match(/^(\d{3})/);
  if (!match) {
    return UNGROUPED_FOLDER_NAME;
  }

  const bucket = Math.floor(Number(match[1]) / 100) * 100;
  return autoFolderMap.get(bucket) || UNGROUPED_FOLDER_NAME;
}

async function loadDisplayFolders() {
  const res = await fetch('/api/display-folders');
  if (!res.ok) {
    throw new Error('Failed to load display folders');
  }

  const data = await res.json();
  const nextFolders = Array.isArray(data.folders)
    ? data.folders.map((name) => normalizeFolderName(name)).filter(Boolean)
    : [];
  const rawAssignments = data.assignments && typeof data.assignments === 'object'
    ? data.assignments
    : {};
  const nextAssignments = {};
  for (const [name, folder] of Object.entries(rawAssignments)) {
    const fileKey = displayKey(name);
    const folderName = normalizeFolderName(folder);
    if (fileKey && folderName) {
      nextAssignments[fileKey] = folderName;
    }
  }

  folderNames = [...new Set(nextFolders)];
  folderAssignments = nextAssignments;
}

async function saveDisplayFolders() {
  const res = await fetch('/api/display-folders/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folders: folderNames, assignments: folderAssignments })
  });

  const data = await readApiJson(res);
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save display folders');
  }
}

function setSidebarMode(mode) {
  sidebarMode = mode === SIDEBAR_MODE_DEFAULTS ? SIDEBAR_MODE_DEFAULTS : SIDEBAR_MODE_DISPLAYS;
  localStorage.setItem(SIDEBAR_MODE_STORAGE_KEY, sidebarMode);

  if (exportsCard) {
    exportsCard.classList.toggle('default-mode', isDefaultMode());
  }

  if (showDisplaysBtn) {
    showDisplaysBtn.classList.toggle('active', !isDefaultMode());
  }
  if (showDefaultsBtn) {
    showDefaultsBtn.classList.toggle('active', isDefaultMode());
  }

  if (sidebarTitle) {
    sidebarTitle.textContent = 'Projects';
  }

  if (addDisplayBtn) {
    addDisplayBtn.classList.toggle('hidden', isDefaultMode());
  }

  if (addFolderBtn) {
    addFolderBtn.classList.toggle('hidden', isDefaultMode());
  }

  if (removeFolderBtn) {
    removeFolderBtn.classList.toggle('hidden', isDefaultMode());
    removeFolderBtn.disabled = true;
  }

  if (seedDefaultsBtn) {
    seedDefaultsBtn.classList.toggle('hidden', !isDefaultMode());
  }

  if (uploadDisplayBtn) {
    uploadDisplayBtn.classList.toggle('hidden', isDefaultMode());
    uploadDisplayBtn.textContent = 'Upload XML';
  }

  if (refreshBtn) {
    refreshBtn.textContent = isDefaultMode() ? 'Refresh' : 'Saved List';
  }

  if (removeDisplayBtn) {
    removeDisplayBtn.title = isDefaultMode() ? 'Remove selected default template' : 'Remove selected screen';
  }

}

async function createNewProject(rawName) {
  const projectName = normalizeProjectName(rawName);

  try {
    const defaultsResponse = await fetch('/api/default-pages');
    if (!defaultsResponse.ok) {
      throw new Error('Failed to load default templates');
    }

    const defaultsData = await defaultsResponse.json();
    const { folders, globalObjectFiles } = groupTemplateFiles(defaultsData.files || []);
    const project = {
      id: `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: projectName,
      collapsed: false,
      folders: []
    };

    for (const folder of folders) {
      const screens = [];
      for (const file of folder.screens) {
        const xmlData = await loadDefaultTemplateXml(file.name);
        screens.push(screenMetaFromXml(xmlData.name, xmlData.xml));
      }

      project.folders.push({
        name: folder.name,
        collapsed: false,
        screens
      });
    }

    if (globalObjectFiles.length) {
      const screens = [];
      for (const file of globalObjectFiles) {
        const xmlData = await loadDefaultTemplateXml(file.name);
        screens.push(screenMetaFromXml(xmlData.name, xmlData.xml));
      }

      project.folders.push({
        name: 'Global Objects',
        collapsed: false,
        screens
      });
    }

    projectList = [...projectList.filter((item) => displayKey(item.name) !== displayKey(project.name)), project];
    saveProjectList();
    setActiveProject(project);
    setSidebarCollapsed(false);
    renderProjectSidebar();

    const firstFolder = project.folders[0];
    const firstScreen = firstFolder?.screens?.[0];
    if (firstFolder && firstScreen) {
      setEditorProjectScreen(project, firstFolder.name, firstScreen, firstScreen.xml);
    }

    packageResult.textContent = `Project ready: ${projectName}.`;
  } catch (err) {
    console.error(err);
    alert(err.message || 'Could not create new project.');
  }
}

function showProjectCreatePanel() {
  if (!projectCreatePanel) {
    return;
  }

  hideSidebarNamePanel();
  projectCreatePanel.classList.remove('hidden');
  if (projectNameInput) {
    projectNameInput.value = currentProjectName === 'Untitled Project' ? 'New Project' : currentProjectName;
    projectNameInput.focus();
    projectNameInput.select();
  }
}

function hideProjectCreatePanel() {
  if (!projectCreatePanel) {
    return;
  }

  projectCreatePanel.classList.add('hidden');
}

function showSidebarNamePanel(options = {}) {
  if (!sidebarNamePanel || !sidebarNameLabel || !sidebarNameInput || !sidebarNameConfirmBtn || !sidebarNameCancelBtn) {
    return;
  }

  sidebarNameSubmit = typeof options.onConfirm === 'function' ? options.onConfirm : null;
  sidebarNameLabel.textContent = options.label || 'Name';
  sidebarNameInput.value = options.value || '';
  sidebarNameInput.placeholder = options.placeholder || 'New item';
  sidebarNameConfirmBtn.textContent = options.confirmText || 'Save';
  sidebarNamePanel.classList.remove('hidden');
  sidebarNameInput.focus();
  sidebarNameInput.select();
}

function hideSidebarNamePanel() {
  if (!sidebarNamePanel) {
    return;
  }

  sidebarNameSubmit = null;
  sidebarNamePanel.classList.add('hidden');
}

function updatePackageSelection(files = currentDisplayRows) {
  if (!Array.isArray(files) || !files.length) {
    selectedFiles = [];
    return;
  }

  const selected = files.find((file) => displayKey(file.name) === displayKey(selectedDisplay));
  if (selected && isEditableSource(selected) && !isGlobalObjectFile(selected)) {
    const base = baseFileName(selected.name).toLowerCase();
    const relatedGlobals = files
      .filter((file) => isEditableSource(file) && isGlobalObjectFile(file))
      .filter((file) => {
        const fileBase = baseFileName(file.name).toLowerCase();
        return fileBase === `${base}_addons` || fileBase.startsWith(`${base}_addons_`);
      })
      .map((file) => file.name);

    selectedFiles = [...new Set([selected.name, ...relatedGlobals])];
    return;
  }

  selectedFiles = [];
}

function getAllEditedPackageFiles(files = currentDisplayRows) {
  if (!Array.isArray(files) || !files.length) {
    return [];
  }

  return [...new Set(files
    .filter((file) => isEditableSource(file))
    .map((file) => file.name))];
}

async function autoSaveCurrentDisplay() {
  if (!selectedDisplay || !xmlEditor.value.trim()) {
    return true;
  }

  try {
    await saveDisplayXml(selectedDisplay, xmlEditor.value);
    updateCurrentDisplayRow(selectedDisplay, xmlEditor.value);
    return true;
  } catch (_err) {
    alert('Could not auto-save the current display. Please try again.');
    return false;
  }
}

async function buildImportPackage(files, packageLabel, options = {}) {
  const packageMode = String(options.packageMode || 'xml').toLowerCase() === 'restore'
    ? 'restore'
    : 'xml';
  const res = await fetch('/api/displays/package', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, packageMode })
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Failed to build package');
    return;
  }

  packageResult.innerHTML = '';
  const warn = document.createElement('div');
  warn.className = 'import-checklist';
  if (data.packageType === 'restore-bundle') {
    const archiveExt = String(data.archiveType || '').toLowerCase();
    const restoreMenu = archiveExt === 'mer' ? 'Restore Runtime Application' : 'Restore Application';
    const archiveLabel = archiveExt === 'mer' ? '.mer' : '.apa';
    warn.innerHTML =
      `<strong>Before importing in FactoryTalk (${packageLabel}):</strong>` +
      '<ol>' +
      '<li>Extract the downloaded ZIP to a local folder.</li>' +
      `<li><b>Restore the included <code>${archiveLabel}</code> archive first</b> in FactoryTalk View Studio using <code>${restoreMenu}</code>.</li>` +
      '<li>Open the restored project.</li>' +
      '<li>Go into the extracted <code>Edited_Display_Import</code> folder.</li>' +
      '<li>Run <em>Batch Import</em> and select <code>Edited_Display_Import/BatchImport.xml</code>.</li>' +
      '<li><b>Set conflict handling to REPLACE/OVERWRITE existing displays</b> (do not merge/update).</li>' +
      '<li>If REPLACE is not available, use <code>Edited_Display_Import/DeleteTargets.txt</code> first, then import.</li>' +
      '<li>If the archive is <code>.mer</code>, restore/editability depends on how that MER was built and your FT version.</li>' +
      '</ol>' +
      `<small>Restore bundle files packaged: ${data.files.join(', ')}</small>`;
  } else {
    warn.innerHTML =
      `<strong>Before importing in FactoryTalk (${packageLabel}):</strong>` +
      '<ol>' +
      '<li><b>Close every display you are about to import</b> (e.g. close MAIN, Testscreen, etc.)</li>' +
      '<li>Extract the downloaded ZIP to a local folder.</li>' +
      '<li>In FactoryTalk, use <em>Batch Import</em> and select <code>BatchImport.xml</code>.</li>' +
      '<li><b>Set conflict handling to REPLACE/OVERWRITE existing displays</b> (do not merge/update).</li>' +
      '<li>If you see: <code>element does not exist in the Display and cannot be updated</code>, your import is in update/merge mode. Switch to REPLACE, or delete targets first (see <code>DeleteTargets.txt</code>) and then import.</li>' +
      '<li>Do <b>NOT</b> select the ZIP, the display XML, or any .txt file.</li>' +
      '</ol>' +
      `<small>Files packaged: ${data.files.join(', ')}</small>`;
  }
  packageResult.appendChild(warn);

  const downloadUrl = data.downloadUrl || '/api/packages/download/latest.zip';
  let saveOutcome;
  try {
    saveOutcome = await savePackageAs(downloadUrl);
  } catch (err) {
    if (err && err.name === 'AbortError') {
      alert('Save As was canceled. Package folder is still created on server.');
      return;
    }
    throw err;
  }

  alert(`Import package generated and saved as ${saveOutcome.fileName}.`);
}

function fitCanvasToFrame(frame, canvas, width, height) {
  const frameStyles = getComputedStyle(frame);
  const horizontalPadding = parseFloat(frameStyles.paddingLeft || '0') + parseFloat(frameStyles.paddingRight || '0');
  const verticalPadding = parseFloat(frameStyles.paddingTop || '0') + parseFloat(frameStyles.paddingBottom || '0');
  const availableWidth = Math.max(1, frame.clientWidth - horizontalPadding);
  const availableHeight = Math.max(1, frame.clientHeight - verticalPadding);

  // Keep the display fully visible, but avoid upscaling above 1:1 for closer FT parity.
  const scale = Math.min(1, availableWidth / width, availableHeight / height);
  const finalScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

  canvas.style.width = `${width * finalScale}px`;
  canvas.style.height = `${height * finalScale}px`;
}

function getCanvasScale(canvas, width, height) {
  const contentWidth = Math.max(1, canvas.clientWidth || 0);
  const contentHeight = Math.max(1, canvas.clientHeight || 0);
  return {
    scaleX: contentWidth / width,
    scaleY: contentHeight / height
  };
}

function parseCaptionAlignment(alignmentRaw) {
  const alignment = String(alignmentRaw || '').toLowerCase();

  const horizontal = alignment.includes('right')
    ? 'right'
    : alignment.includes('left')
      ? 'left'
      : 'center';

  const vertical = alignment.includes('top')
    ? 'top'
    : alignment.includes('bottom')
      ? 'bottom'
      : 'middle';

  return { horizontal, vertical };
}

function applyCaptionStyles(box, node, captionNode) {
  const fontSize = Number(captionNode?.getAttribute('fontSize') || node.getAttribute('fontSize'));
  if (Number.isFinite(fontSize) && fontSize > 0) {
    box.style.fontSize = `${fontSize}px`;
  }

  const fontFamily = captionNode?.getAttribute('fontFamily') || node.getAttribute('fontFamily');
  if (fontFamily) {
    box.style.fontFamily = fontFamily;
  }

  const tag = String(node.tagName || '').toLowerCase();
  const color = captionNode?.getAttribute('color')
    || node.getAttribute('foreColor')
    || (tag === 'alarmlist' ? (node.getAttribute('selectionForeColor') || '#cc0000') : '');
  if (color) {
    box.style.color = color;
  }

  const bold = String(captionNode?.getAttribute('bold') || node.getAttribute('bold') || '').toLowerCase() === 'true';
  const italic = String(captionNode?.getAttribute('italic') || node.getAttribute('italic') || '').toLowerCase() === 'true';
  const underline = String(captionNode?.getAttribute('underline') || node.getAttribute('underline') || '').toLowerCase() === 'true';
  const strike = String(captionNode?.getAttribute('strikethrough') || node.getAttribute('strikethrough') || '').toLowerCase() === 'true';

  box.style.fontWeight = bold ? '700' : '400';
  box.style.fontStyle = italic ? 'italic' : 'normal';
  box.style.textDecoration = [underline ? 'underline' : '', strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none';

  const wrap = (captionNode?.getAttribute('wordWrap') || '').toLowerCase() === 'true';
  const captionText = String(box.textContent || '');
  const hasExplicitBreak = /[\r\n]/.test(captionText);
  const hasFixedSpacing = / {2,}|\t/.test(captionText);
  const useMultiline = wrap || hasExplicitBreak;
  box.style.whiteSpace = useMultiline ? 'pre-line' : (hasFixedSpacing ? 'pre' : 'nowrap');
  box.style.textOverflow = useMultiline ? 'clip' : 'ellipsis';
  box.style.lineHeight = useMultiline ? '1.05' : '1';

  const { horizontal, vertical } = parseCaptionAlignment(captionNode?.getAttribute('alignment') || node.getAttribute('alignment'));
  box.style.textAlign = horizontal;
  box.style.justifyContent = horizontal === 'left' ? 'flex-start' : horizontal === 'right' ? 'flex-end' : 'center';
  box.style.alignItems = vertical === 'top' ? 'flex-start' : vertical === 'bottom' ? 'flex-end' : 'center';

  // FactoryTalk alarm list preview should hug the bottom-left in the footer strip.
  if (tag === 'alarmlist') {
    box.style.textAlign = 'left';
    box.style.justifyContent = 'flex-start';
    box.style.alignItems = 'flex-end';
    box.style.whiteSpace = 'nowrap';
    box.style.lineHeight = '1';
    box.style.padding = '0 3px 0 2px';
    box.style.fontWeight = (String(node.getAttribute('bold') || '').toLowerCase() === 'true') ? '700' : '400';
    const listFontSize = Number(node.getAttribute('fontSize'));
    if (Number.isFinite(listFontSize) && listFontSize > 0) {
      box.style.fontSize = `${listFontSize}px`;
    }
  }
}

function getActiveStateNode(node) {
  const stateId = String(node.getAttribute('currentStateId') || '').trim();
  const states = Array.from(node.querySelectorAll(':scope > states > state'));
  if (!states.length) {
    return null;
  }

  if (stateId) {
    const exact = states.find((state) => String(state.getAttribute('stateId') || '').trim() === stateId);
    if (exact) {
      return exact;
    }
  }

  return states[0] || null;
}

function gradientDirectionCss(directionRaw) {
  const dir = String(directionRaw || '').toLowerCase();
  if (dir.includes('vertical')) {
    return 'to bottom';
  }
  if (dir.includes('reverse') && dir.includes('horizontal')) {
    return 'to left';
  }
  return 'to right';
}

function applyFillStyles(box, sourceNode) {
  const backStyle = String(sourceNode?.getAttribute('backStyle') || '').toLowerCase();
  if (backStyle === 'transparent' || backStyle === 'none') {
    box.style.background = 'transparent';
    return;
  }

  const backColor = sourceNode?.getAttribute('backColor');
  const endColor = sourceNode?.getAttribute('endColor');
  const gradientDirection = sourceNode?.getAttribute('gradientDirection');
  const hasGradientStyle = backStyle.includes('gradient');
  const hasGradient = hasGradientStyle
    && Boolean(backColor
      && endColor
      && String(endColor).trim() !== ''
      && String(endColor).toLowerCase() !== String(backColor).toLowerCase());

  if (hasGradient) {
    const cssDirection = gradientDirectionCss(gradientDirection);
    box.style.background = `linear-gradient(${cssDirection}, ${backColor}, ${endColor})`;
    return;
  }

  if (backColor) {
    box.style.background = backColor;
  }
}

function applyBorderStyles(box, baseNode, sourceNode) {
  const borderStyleRaw = String(
    sourceNode?.getAttribute('borderStyle')
    || baseNode.getAttribute('borderStyle')
    || sourceNode?.getAttribute('lineStyle')
    || baseNode.getAttribute('lineStyle')
    || ''
  ).toLowerCase();
  const borderWidth = Number(
    sourceNode?.getAttribute('borderWidth')
    || baseNode.getAttribute('borderWidth')
    || sourceNode?.getAttribute('lineWidth')
    || baseNode.getAttribute('lineWidth')
  );
  const borderUsesBackColor = String(sourceNode?.getAttribute('borderUsesBackColor') || baseNode.getAttribute('borderUsesBackColor') || '').toLowerCase() === 'true';
  const borderColor = sourceNode?.getAttribute('borderColor')
    || baseNode.getAttribute('borderColor')
    || sourceNode?.getAttribute('lineColor')
    || baseNode.getAttribute('lineColor')
    || sourceNode?.getAttribute('foreColor')
    || baseNode.getAttribute('foreColor');
  const backColor = sourceNode?.getAttribute('backColor') || baseNode.getAttribute('backColor');
  const px = Number.isFinite(borderWidth) && borderWidth > 0 ? `${borderWidth}px` : '1px';
  const baseColor = borderUsesBackColor ? (backColor || '#8a8a8a') : (borderColor || '#1a1a1a');
  const normalizedBase = normalizeColor(baseColor) || '#8A8A8A';

  const offsetHexColor = (hexColor, delta) => {
    const match = String(hexColor || '').trim().match(/^#([0-9a-fA-F]{6})$/);
    if (!match) {
      return hexColor;
    }

    const clampByte = (n) => Math.max(0, Math.min(255, n));
    const toHex = (n) => clampByte(n).toString(16).padStart(2, '0').toUpperCase();
    const r = Number.parseInt(match[1].slice(0, 2), 16);
    const g = Number.parseInt(match[1].slice(2, 4), 16);
    const b = Number.parseInt(match[1].slice(4, 6), 16);
    return `#${toHex(r + delta)}${toHex(g + delta)}${toHex(b + delta)}`;
  };

  const lightEdge = offsetHexColor(normalizedBase, 58);
  const darkEdge = offsetHexColor(normalizedBase, -62);

  box.style.boxShadow = 'none';
  box.style.borderTopColor = '';
  box.style.borderRightColor = '';
  box.style.borderBottomColor = '';
  box.style.borderLeftColor = '';

  if (!borderStyleRaw || borderStyleRaw === 'none') {
    box.style.border = 'none';
    return;
  }

  if (borderStyleRaw.includes('raised') || borderStyleRaw.includes('outset')) {
    box.style.borderStyle = 'solid';
    box.style.borderWidth = px;
    box.style.borderTopColor = lightEdge;
    box.style.borderLeftColor = lightEdge;
    box.style.borderRightColor = darkEdge;
    box.style.borderBottomColor = darkEdge;
    box.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.18)';
    return;
  }

  if (borderStyleRaw.includes('sunken') || borderStyleRaw.includes('inset')) {
    box.style.borderStyle = 'solid';
    box.style.borderWidth = px;
    box.style.borderTopColor = darkEdge;
    box.style.borderLeftColor = darkEdge;
    box.style.borderRightColor = lightEdge;
    box.style.borderBottomColor = lightEdge;
    box.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,0.12)';
    return;
  }

  const cssBorderStyle = borderStyleRaw === 'line'
    ? 'solid'
    : borderStyleRaw === 'etched'
      ? 'groove'
      : borderStyleRaw;

  box.style.borderStyle = cssBorderStyle;
  box.style.borderWidth = px;
  box.style.borderColor = baseColor;
}

function getNodeImageName(node) {
  const direct = String(node.getAttribute('imageName') || '').trim();
  if (direct) {
    return direct;
  }

  const imageSettings = Array.from(node.children).find((child) => child.tagName === 'imageSettings');
  const fromSettings = String(imageSettings?.getAttribute('imageName') || '').trim();
  return fromSettings || '';
}

function getNodeImageRenderOptions(node) {
  const imageSettings = Array.from(node.children).find((child) => child.tagName === 'imageSettings');
  const alignmentRaw = imageSettings?.getAttribute('alignment') || 'middleCenter';
  const scaledRaw = String(imageSettings?.getAttribute('scaled') || '').toLowerCase();
  const scaled = scaledRaw ? scaledRaw === 'true' : true;
  const { horizontal, vertical } = parseCaptionAlignment(alignmentRaw);
  return { horizontal, vertical, scaled };
}

function createImageFallback(imageName) {
  const raw = String(imageName || '').trim();
  if (!raw) {
    return null;
  }

  const key = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  const mapping = [
    { test: ['cybernetik', 'logo'], label: 'Cybernetik', kind: 'logo', icon: 'logo' },
    { test: ['home'], label: 'Home', kind: 'nav', icon: 'home' },
    { test: ['mode'], label: 'Mode Selection', kind: 'nav', icon: 'mode' },
    { test: ['setting'], label: 'Setting', kind: 'nav', icon: 'setting' },
    { test: ['manual'], label: 'Manual Operation', kind: 'nav', icon: 'manual' },
    { test: ['sequence'], label: 'Machine Sequence', kind: 'nav', icon: 'sequence' },
    { test: ['alarm'], label: 'Active Alarms', kind: 'nav', icon: 'alarm' },
    { test: ['legend'], label: 'Legends', kind: 'nav', icon: 'legend' },
    { test: ['close'], label: 'Close', kind: 'nav', icon: 'close' },
    { test: ['plus', 'copy'], label: 'Add', kind: 'nav', icon: 'plus' },
    { test: ['mute'], label: 'Mute', kind: 'nav', icon: 'mute' },
    { test: ['select', 'alarm'], label: 'Select Alarm', kind: 'nav', icon: 'alarm' },
    { test: ['tmp', 'photo', 'image', 'z1', 'z2', 'z3'], label: 'Image', kind: 'nav', icon: 'image' }
  ];

  const matched = mapping.find((entry) => entry.test.some((token) => key.includes(token)));
  if (!matched) {
    return null;
  }

  const fallback = document.createElement('span');
  fallback.className = `xml-image-fallback ${matched.kind}`;
  if (matched.kind === 'logo') {
    fallback.innerHTML = '<span class="fallback-logo-mark" aria-hidden="true">C</span><span class="fallback-logo-word">Cybernetik.</span>';
  } else {
    fallback.innerHTML = `<span class="fallback-icon" data-icon="${matched.icon}" aria-hidden="true">${iconSvg(matched.icon)}</span>`;
  }
  fallback.title = raw;
  return fallback;
}

function iconSvg(icon) {
  switch (icon) {
    case 'home':
      return '<svg viewBox="0 0 24 24" role="img"><path d="M4 11.5L12 4l8 7.5v8a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/></svg>';
    case 'mode':
      return '<svg viewBox="0 0 24 24" role="img"><circle cx="7" cy="7" r="2.1"/><circle cx="17" cy="12" r="2.1"/><circle cx="10" cy="17" r="2.1"/><path d="M9 7h9M4.5 17h3M12 17h7M7 9.5v5"/></svg>';
    case 'setting':
      return '<svg viewBox="0 0 24 24" role="img"><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6zm9.2 3.8l-1.7-.6a7.6 7.6 0 0 0-.5-1.2l.9-1.5-1.9-1.9-1.5.9c-.4-.2-.8-.4-1.2-.5L13.9 3h-2.8l-.6 1.7c-.4.1-.8.3-1.2.5l-1.5-.9-1.9 1.9.9 1.5c-.2.4-.4.8-.5 1.2L2.8 12v2.8l1.7.6c.1.4.3.8.5 1.2l-.9 1.5 1.9 1.9 1.5-.9c.4.2.8.4 1.2.5l.6 1.7h2.8l.6-1.7c.4-.1.8-.3 1.2-.5l1.5.9 1.9-1.9-.9-1.5c.2-.4.4-.8.5-1.2l1.7-.6V12z"/></svg>';
    case 'manual':
      return '<svg viewBox="0 0 24 24" role="img"><path d="M8 11V7.5a1.5 1.5 0 1 1 3 0V10m0 0V6.8a1.4 1.4 0 1 1 2.8 0V10m0 0V7.8a1.3 1.3 0 1 1 2.6 0v3.9l1.3-1a1.8 1.8 0 0 1 2.7.6 1.8 1.8 0 0 1-.5 2.2l-2.8 2.2a4.6 4.6 0 0 1-2.8.9h-3a4.2 4.2 0 0 1-3.7-2.2L5.8 12a1.7 1.7 0 0 1 .9-2.3A1.7 1.7 0 0 1 8 11z"/></svg>';
    case 'sequence':
      return '<svg viewBox="0 0 24 24" role="img"><path d="M4 7h9M9 4l4 3-4 3M20 17h-9M15 14l-4 3 4 3"/><circle cx="4" cy="7" r="1.3"/><circle cx="20" cy="17" r="1.3"/></svg>';
    case 'alarm':
      return '<svg viewBox="0 0 24 24" role="img"><path d="M12 4a5.3 5.3 0 0 0-5.3 5.3v3.4L5 15.4v1.4h14v-1.4l-1.7-2.7V9.3A5.3 5.3 0 0 0 12 4zM9.7 18.2a2.3 2.3 0 0 0 4.6 0"/></svg>';
    case 'legend':
      return '<svg viewBox="0 0 24 24" role="img"><path d="M7 6h12M7 12h12M7 18h12"/><circle cx="4" cy="6" r="1.4"/><circle cx="4" cy="12" r="1.4"/><circle cx="4" cy="18" r="1.4"/></svg>';
    case 'close':
      return '<svg viewBox="0 0 24 24" role="img"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    case 'plus':
      return '<svg viewBox="0 0 24 24" role="img"><path d="M12 5v14M5 12h14"/></svg>';
    case 'mute':
      return '<svg viewBox="0 0 24 24" role="img"><path d="M4 14h4l5 4V6L8 10H4zM16 9l4 6M20 9l-4 6"/></svg>';
    case 'image':
      return '<svg viewBox="0 0 24 24" role="img"><rect x="4" y="5" width="16" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.5"/><path d="M6 17l4-4 3 3 3-3 2 4"/></svg>';
    default:
      return '<svg viewBox="0 0 24 24" role="img"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>';
  }
}

function normalizePreviewCaption(rawCaption, wrapEnabled) {
  let caption = String(rawCaption || '');
  if (!wrapEnabled && /\r?\n[ \t]{4,}/.test(caption)) {
    // Some sequence captions contain hard line-break continuations from export.
    // Flatten those when wordWrap is disabled so table rows stay single-line.
    caption = caption.replace(/\s*[\r\n]+[ \t]{2,}/g, ' ');
  }

  return caption;
}

function previewTextForNode(node, captionNode) {
  const tag = String(node.tagName || '').toLowerCase();
  const wrapEnabled = String(captionNode?.getAttribute('wordWrap') || node.getAttribute('wordWrap') || '').toLowerCase() === 'true';
  const captionFromChild = normalizePreviewCaption(captionNode?.getAttribute('caption') || '', wrapEnabled).trim();
  if (captionFromChild) {
    return captionFromChild;
  }

  const captionFromNode = normalizePreviewCaption(node.getAttribute('caption') || '', wrapEnabled).trim();
  if (captionFromNode) {
    return captionFromNode;
  }

  if (tag === 'numericdisplay') {
    const digits = Math.max(1, Math.min(12, Number(node.getAttribute('numberOfDigits')) || 5));
    const decimals = Math.max(0, Math.min(6, Number(node.getAttribute('decimalPlaces')) || 0));
    if (decimals > 0) {
      // FactoryTalk exports often include the decimal separator in numberOfDigits.
      const integerDigits = Math.max(1, Math.min(8, digits - decimals - 1));
      return `${'N'.repeat(integerDigits)}.${'N'.repeat(decimals)}`;
    }
    return 'N'.repeat(Math.min(8, digits));
  }

  if (tag === 'timeanddatedisplay') {
    return new Date().toLocaleString();
  }

  if (tag === 'multistateindicator') {
    const matched = getActiveStateNode(node);
    const matchedCaption = matched?.querySelector('caption')?.getAttribute('caption');
    return String(matchedCaption || '').trim();
  }

  if (tag === 'stringdisplay') {
    const expr = String(node.querySelector('connection[name="Value"]')?.getAttribute('expression') || '').toLowerCase();
    if (
      expr.includes('system\\user')
      || expr.includes('system/user')
      || expr.includes('currentusername')
      || expr.includes('current_user')
      || expr.includes('username')
    ) {
      return 'ssssssss';
    }
    return 'STRING';
  }

  if (tag === 'alarmlist') {
    const time = new Date().toLocaleString([], {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return `${time}  ABCDE FGHIJK LMNOPQ R STUV WXYZ`;
  }

  return '';
}

function parseLinePoints(node) {
  const fromLine = String(node.getAttribute('line') || '')
    .trim()
    .split(/\s+/)
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));

  if (fromLine.length >= 4) {
    return {
      x1: fromLine[0],
      y1: fromLine[1],
      x2: fromLine[2],
      y2: fromLine[3]
    };
  }

  const left = Number(node.getAttribute('left') || 0);
  const top = Number(node.getAttribute('top') || 0);
  const width = Number(node.getAttribute('width') || 0);
  const height = Number(node.getAttribute('height') || 0);
  return {
    x1: left,
    y1: top,
    x2: left + width,
    y2: top + height
  };
}

function kb(sizeBytes) {
  return `${(sizeBytes / 1024).toFixed(1)} KB`;
}

function resetHistory(xml) {
  const snapshot = String(xml || '');
  historyPast = snapshot ? [snapshot] : [];
  historyFuture = [];
}

function recordHistory(xml) {
  if (applyingHistory) {
    return;
  }

  const snapshot = String(xml || '');
  if (!snapshot.trim()) {
    return;
  }

  const last = historyPast[historyPast.length - 1];
  if (last === snapshot) {
    return;
  }

  historyPast.push(snapshot);
  if (historyPast.length > HISTORY_LIMIT) {
    historyPast.shift();
  }
  historyFuture = [];
}

function applyHistorySnapshot(snapshot) {
  if (!snapshot || !snapshot.trim()) {
    return;
  }

  applyingHistory = true;
  xmlEditor.value = snapshot;

  const size = readSizeFromXml(snapshot);
  if (size.width) screenWidth.value = size.width;
  if (size.height) screenHeight.value = size.height;

  renderPreview();
  applyingHistory = false;

  if (selectedDisplay) {
    saveDisplayXml(selectedDisplay, xmlEditor.value)
      .then(() => {
        updateCurrentDisplayRow(selectedDisplay, xmlEditor.value);
        if (usingUploadedList) {
          renderDisplays(currentDisplayRows);
        } else {
          refreshDisplays().catch(() => {});
        }
      })
      .catch(() => {});
  }
}

function undoHistory() {
  if (historyPast.length <= 1) {
    return;
  }

  const current = historyPast.pop();
  historyFuture.push(current);
  applyHistorySnapshot(historyPast[historyPast.length - 1]);
}

function redoHistory() {
  if (!historyFuture.length) {
    return;
  }

  const next = historyFuture.pop();
  historyPast.push(next);
  applyHistorySnapshot(next);
}

function isEditableTarget(el) {
  if (!el) {
    return false;
  }
  const tag = String(el.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

function nextIncrementedName(doc, originalName, fallbackPrefix = 'Object') {
  const names = new Set(Array.from(doc.querySelectorAll('[name]'))
    .map((node) => String(node.getAttribute('name') || '').toLowerCase())
    .filter(Boolean));

  const source = String(originalName || '').trim() || fallbackPrefix;
  const match = source.match(/^(.*?)([_\-\s]?)(\d+)$/);
  let stem = source;
  let separator = '_';
  let index = 1;

  if (match) {
    stem = match[1] || fallbackPrefix;
    separator = match[2] || '';
    index = Number(match[3]) + 1;
  }

  let candidate = `${stem}${separator}${index}`;
  while (names.has(candidate.toLowerCase())) {
    index += 1;
    candidate = `${stem}${separator}${index}`;
  }

  return candidate;
}

function copySelectedObject() {
  if (selectedObjectIndex === null || !xmlEditor.value.trim()) {
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlEditor.value, 'text/xml');
  if (doc.querySelector('parsererror')) {
    return;
  }

  const nodes = getObjectNodes(doc);
  const node = nodes[selectedObjectIndex];
  if (!node) {
    return;
  }

  copiedObjectXml = new XMLSerializer().serializeToString(node);
  copiedObjectName = String(node.getAttribute('name') || node.tagName || 'Object');
  copiedPasteCount = 0;
}

function pasteCopiedObject() {
  if (!copiedObjectXml || !xmlEditor.value.trim()) {
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlEditor.value, 'text/xml');
  if (doc.querySelector('parsererror')) {
    return;
  }

  const root = doc.querySelector('gfx');
  if (!root) {
    return;
  }

  const wrapperDoc = parser.parseFromString(`<wrapper>${copiedObjectXml}</wrapper>`, 'text/xml');
  if (wrapperDoc.querySelector('parsererror')) {
    return;
  }

  const sourceNode = wrapperDoc.querySelector('wrapper > *');
  if (!sourceNode) {
    return;
  }

  const newNode = sourceNode.cloneNode(true);
  const nextName = nextIncrementedName(doc, copiedObjectName, 'Object');
  newNode.setAttribute('name', nextName);

  const displaySettings = doc.querySelector('displaySettings');
  const displayWidth = Number(displaySettings?.getAttribute('width')) || Number(screenWidth.value) || DEFAULT_PREVIEW_WIDTH;
  const displayHeight = Number(displaySettings?.getAttribute('height')) || Number(screenHeight.value) || DEFAULT_PREVIEW_HEIGHT;
  const nodeWidth = Math.max(1, Number(newNode.getAttribute('width') || 1));
  const nodeHeight = Math.max(1, Number(newNode.getAttribute('height') || 1));

  copiedPasteCount += 1;
  const shift = 12 * copiedPasteCount;
  const left = Number(newNode.getAttribute('left') || 0);
  const top = Number(newNode.getAttribute('top') || 0);
  const nextLeft = clamp(left + shift, 0, Math.max(0, displayWidth - nodeWidth));
  const nextTop = clamp(top + shift, 0, Math.max(0, displayHeight - nodeHeight));

  newNode.setAttribute('left', String(Math.round(nextLeft)));
  newNode.setAttribute('top', String(Math.round(nextTop)));

  root.appendChild(newNode);
  xmlEditor.value = serializeXmlDoc(doc);
  recordHistory(xmlEditor.value);

  const nodes = getObjectNodes(doc);
  selectedObjectIndex = nodes.length - 1;
  populateObjectPanel(doc, selectedObjectIndex);
  renderPreview();
  persistCurrentXmlState();
}

function nudgeSelectedObject(deltaX, deltaY) {
  if (selectedObjectIndex === null || !xmlEditor.value.trim()) {
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlEditor.value, 'text/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    return;
  }

  const displaySettings = doc.querySelector('displaySettings');
  const width = Number(displaySettings?.getAttribute('width')) || Number(screenWidth.value) || 1;
  const height = Number(displaySettings?.getAttribute('height')) || Number(screenHeight.value) || 1;

  const nodes = getObjectNodes(doc);
  const node = nodes[selectedObjectIndex];
  if (!node) {
    return;
  }

  const left = Number(node.getAttribute('left') || 0);
  const top = Number(node.getAttribute('top') || 0);
  const w = Math.max(1, Number(node.getAttribute('width') || 1));
  const h = Math.max(1, Number(node.getAttribute('height') || 1));

  const nextLeft = clamp(left + deltaX, 0, Math.max(0, width - w));
  const nextTop = clamp(top + deltaY, 0, Math.max(0, height - h));
  if (nextLeft === left && nextTop === top) {
    return;
  }

  node.setAttribute('left', String(Math.round(nextLeft)));
  node.setAttribute('top', String(Math.round(nextTop)));
  xmlEditor.value = serializeXmlDoc(doc);
  recordHistory(xmlEditor.value);
  populateObjectPanel(doc, selectedObjectIndex);
  renderPreview();

  if (selectedDisplay) {
    saveDisplayXml(selectedDisplay, xmlEditor.value)
      .then(() => {
        updateCurrentDisplayRow(selectedDisplay, xmlEditor.value);
        if (usingUploadedList) {
          renderDisplays(currentDisplayRows);
        } else {
          refreshDisplays().catch(() => {});
        }
      })
      .catch(() => {});
  }
}

function deleteSelectedObject() {
  if (selectedObjectIndex === null || !xmlEditor.value.trim()) {
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlEditor.value, 'text/xml');
  if (doc.querySelector('parsererror')) {
    return;
  }

  const nodes = getObjectNodes(doc);
  const node = nodes[selectedObjectIndex];
  if (!node || !node.parentNode) {
    return;
  }

  const removedIndex = selectedObjectIndex;
  node.parentNode.removeChild(node);

  xmlEditor.value = serializeXmlDoc(doc);
  recordHistory(xmlEditor.value);

  const remaining = getObjectNodes(doc);
  if (!remaining.length) {
    selectedObjectIndex = null;
    clearObjectPanel();
  } else {
    selectedObjectIndex = Math.max(0, Math.min(removedIndex, remaining.length - 1));
    populateObjectPanel(doc, selectedObjectIndex);
  }

  renderPreview();
  persistCurrentXmlState();
}

function setSidebarCollapsed(collapsed) {
  if (!mainGrid || !toggleSidebarBtn) {
    return;
  }

  const nextCollapsed = Boolean(collapsed);
  mainGrid.classList.toggle('sidebar-collapsed', nextCollapsed);
  toggleSidebarBtn.setAttribute('aria-pressed', nextCollapsed ? 'true' : 'false');
  const actionLabel = nextCollapsed ? 'Show projects sidebar' : 'Hide projects sidebar';
  toggleSidebarBtn.setAttribute('aria-label', actionLabel);
  toggleSidebarBtn.setAttribute('title', actionLabel);
  localStorage.setItem(SIDEBAR_STORAGE_KEY, nextCollapsed ? '1' : '0');
}

function shortDateTime(iso) {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function uniqueObjectName(doc, prefix) {
  const names = new Set(Array.from(doc.querySelectorAll('[name]'))
    .map((node) => String(node.getAttribute('name') || '').toLowerCase())
    .filter(Boolean));

  let index = 1;
  while (names.has(`${prefix}_${index}`.toLowerCase())) {
    index += 1;
  }

  return `${prefix}_${index}`;
}

function persistCurrentXmlState() {
  if (!selectedDisplay) {
    return;
  }

  saveDisplayXml(selectedDisplay, xmlEditor.value)
    .then(() => {
      updateCurrentDisplayRow(selectedDisplay, xmlEditor.value);
      if (usingUploadedList) {
        renderDisplays(currentDisplayRows);
      } else {
        refreshDisplays().catch(() => {});
      }
    })
    .catch(() => {});
}

function addButtonObject() {
  const xml = xmlEditor.value.trim();
  if (!xml) {
    alert('Load a display XML first.');
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) {
    alert('XML parse error. Fix XML before adding a button.');
    return;
  }

  const root = doc.querySelector('gfx');
  if (!root) {
    alert('Could not find gfx root in XML.');
    return;
  }

  const displaySettings = doc.querySelector('displaySettings');
  const width = Number(displaySettings?.getAttribute('width')) || Number(screenWidth.value) || DEFAULT_PREVIEW_WIDTH;
  const height = Number(displaySettings?.getAttribute('height')) || Number(screenHeight.value) || DEFAULT_PREVIEW_HEIGHT;

  const templateButton = Array.from(root.querySelectorAll('*'))
    .find((node) => {
      const tag = String(node.tagName || '').toLowerCase();
      return tag === 'momentarybutton'
        || tag === 'gotobutton'
        || tag === 'pushbutton'
        || tag === 'button'
        || tag === 'multistatepushbutton';
    });

  const button = templateButton ? templateButton.cloneNode(true) : doc.createElement('momentaryButton');
  const buttonTag = String(button.tagName || '').toLowerCase();
  const isMomentaryButton = buttonTag === 'momentarybutton';
  const buttonName = uniqueObjectName(doc, 'Button');
  const buttonLabel = buttonName.replace('_', ' ');

  const objWidth = Math.max(80, Math.round(width * 0.12));
  const objHeight = Math.max(28, Math.round(height * 0.05));
  const objLeft = Math.round((width - objWidth) / 2);
  const objTop = Math.round((height - objHeight) / 2);

  button.setAttribute('name', buttonName);
  button.setAttribute('left', String(objLeft));
  button.setAttribute('top', String(objTop));
  button.setAttribute('width', String(objWidth));
  button.setAttribute('height', String(objHeight));

  if (!templateButton) {
    button.setAttribute('visible', 'true');
    button.setAttribute('isReferenceObject', 'false');
    button.setAttribute('audio', 'true');
    button.setAttribute('backStyle', 'solid');
    button.setAttribute('borderUsesBackColor', 'true');
    button.setAttribute('buttonAction', 'normallyOpen');
    button.setAttribute('description', '');
    button.setAttribute('holdTime', '250');
    button.setAttribute('highlightColor', 'lime');
    button.setAttribute('horizontalMargin', '0');
    button.setAttribute('verticalMargin', '0');
    button.setAttribute('shape', 'rectangle');
    button.setAttribute('touch', 'true');
    button.setAttribute('currentStateId', '0');
    button.setAttribute('captionOnBorder', 'false');

    const states = doc.createElement('states');
    const normalState = doc.createElement('state');
    normalState.setAttribute('stateId', '0');
    normalState.setAttribute('backColor', '#d9d9d9');
    normalState.setAttribute('borderColor', '#5f5f5f');
    normalState.setAttribute('patternColor', 'white');
    normalState.setAttribute('patternStyle', 'none');
    normalState.setAttribute('blink', 'false');
    normalState.setAttribute('endColor', 'white');
    normalState.setAttribute('gradientStop', '50');
    normalState.setAttribute('gradientDirection', 'gradientDirectionHorizontal');
    normalState.setAttribute('gradientShadingStyle', 'gradientHorizontalFromRight');

    const pressedState = doc.createElement('state');
    pressedState.setAttribute('stateId', '1');
    pressedState.setAttribute('backColor', '#b8efb8');
    pressedState.setAttribute('borderColor', '#5f5f5f');
    pressedState.setAttribute('patternColor', 'white');
    pressedState.setAttribute('patternStyle', 'none');
    pressedState.setAttribute('blink', 'false');
    pressedState.setAttribute('endColor', 'white');
    pressedState.setAttribute('gradientStop', '50');
    pressedState.setAttribute('gradientDirection', 'gradientDirectionHorizontal');
    pressedState.setAttribute('gradientShadingStyle', 'gradientHorizontalFromRight');

    states.appendChild(normalState);
    states.appendChild(pressedState);
    button.appendChild(states);
  }

  if (!isMomentaryButton && !button.hasAttribute('backColor')) {
    button.setAttribute('backColor', '#d9d9d9');
  }
  if (!button.hasAttribute('borderStyle')) {
    button.setAttribute('borderStyle', 'line');
  }
  if (!isMomentaryButton && !button.hasAttribute('borderColor')) {
    button.setAttribute('borderColor', '#5f5f5f');
  }
  if (!button.hasAttribute('borderWidth')) {
    button.setAttribute('borderWidth', '1');
  }

  if (isMomentaryButton) {
    button.removeAttribute('backColor');
    button.removeAttribute('borderColor');
    Array.from(button.children)
      .filter((child) => child.tagName === 'caption' || child.tagName === 'imageSettings')
      .forEach((child) => child.remove());
  }

  let captionNode = Array.from(button.children).find((child) => child.tagName === 'caption');
  if (!captionNode) {
    const stateNode = Array.from(button.querySelectorAll(':scope > states > state')).find((state) => state.getAttribute('stateId') === '0')
      || Array.from(button.querySelectorAll(':scope > states > state'))[0];
    captionNode = stateNode
      ? Array.from(stateNode.children).find((child) => child.tagName === 'caption') || doc.createElement('caption')
      : doc.createElement('caption');

    if (stateNode && !Array.from(stateNode.children).includes(captionNode)) {
      stateNode.appendChild(captionNode);
    }
  }

  captionNode.setAttribute('caption', buttonLabel);
  if (!captionNode.getAttribute('color')) {
    captionNode.setAttribute('color', '#1f1f1f');
  }
  if (!captionNode.getAttribute('fontSize')) {
    captionNode.setAttribute('fontSize', '10');
  }
  if (!captionNode.getAttribute('fontFamily')) {
    captionNode.setAttribute('fontFamily', 'Arial');
  }
  if (!captionNode.getAttribute('bold')) {
    captionNode.setAttribute('bold', 'true');
  }
  if (!captionNode.getAttribute('italic')) {
    captionNode.setAttribute('italic', 'false');
  }
  if (!captionNode.getAttribute('underline')) {
    captionNode.setAttribute('underline', 'false');
  }
  if (!captionNode.getAttribute('strikethrough')) {
    captionNode.setAttribute('strikethrough', 'false');
  }
  if (!captionNode.getAttribute('backStyle')) {
    captionNode.setAttribute('backStyle', 'transparent');
  }
  if (!captionNode.getAttribute('alignment')) {
    captionNode.setAttribute('alignment', 'middleCenter');
  }
  if (!captionNode.getAttribute('wordWrap')) {
    captionNode.setAttribute('wordWrap', 'false');
  }
  if (!captionNode.getAttribute('blink')) {
    captionNode.setAttribute('blink', 'false');
  }

  if (!isMomentaryButton && !Array.from(button.children).includes(captionNode) && captionNode.parentNode === button) {
    button.appendChild(captionNode);
  }

  if (button.hasAttribute('caption')) {
    button.setAttribute('caption', buttonLabel);
  }

  root.appendChild(button);

  xmlEditor.value = serializeXmlDoc(doc);
  recordHistory(xmlEditor.value);

  const nodes = getObjectNodes(doc);
  selectedObjectIndex = nodes.findIndex((node) => String(node.getAttribute('name') || '') === buttonName);
  if (selectedObjectIndex >= 0) {
    populateObjectPanel(doc, selectedObjectIndex);
  }

  renderPreview();
  persistCurrentXmlState();
}

function setEditorDisplay(name, xml) {
  selectedDisplay = name;
  selectedDefaultTemplate = '';
  displayName.value = name;
  xmlEditor.value = xml;
  resetHistory(xml);
  selectedObjectIndex = null;
  clearObjectPanel();

  const size = readSizeFromXml(xml);
  if (size.width) screenWidth.value = size.width;
  if (size.height) screenHeight.value = size.height;

  if (currentProjectName === 'Untitled Project') {
    setProjectName(baseFileName(name));
  }

  updatePackageSelection(currentDisplayRows);
  renderPreview();
}

function setEditorTemplate(name, xml) {
  selectedDisplay = '';
  selectedDefaultTemplate = name;
  displayName.value = `[Template] ${name}`;
  xmlEditor.value = xml;
  resetHistory(xml);
  selectedObjectIndex = null;
  clearObjectPanel();

  const size = readSizeFromXml(xml);
  if (size.width) screenWidth.value = size.width;
  if (size.height) screenHeight.value = size.height;

  if (currentProjectName === 'Untitled Project') {
    setProjectName(baseFileName(name));
  }

  updatePackageSelection(currentDisplayRows);
  renderPreview();
}

async function readUploadedText(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes.slice(2));
  }

  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes.slice(3));
  }

  return new TextDecoder('utf-8').decode(bytes);
}

function validateDisplayXml(name, xml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror') || !doc.querySelector('gfx')) {
    throw new Error(`${name} is not a valid FactoryTalk display XML file.`);
  }

  const meta = readSizeFromXml(xml);
  return {
    name,
    source: 'uploaded',
    sizeBytes: new Blob([xml]).size,
    lastModified: new Date().toISOString(),
    width: meta.width,
    height: meta.height
  };
}

async function readApiJson(res) {
  const text = await res.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (_err) {
    return { error: text };
  }
}

async function saveDisplayXml(name, xml) {
  if (activeProjectKey) {
    const record = getProjectScreenByKey(activeProjectKey);
    if (record) {
      record.screen.xml = xml;
      const meta = screenMetaFromXml(record.screen.name, xml);
      record.screen.width = meta.width;
      record.screen.height = meta.height;
      record.screen.sizeBytes = meta.sizeBytes;
      record.screen.lastModified = meta.lastModified;
      saveProjectList();
      renderProjectSidebar();
      return { ok: true, saved: record.screen.name, projectId: record.project.id };
    }
  }

  const res = await fetch(`/api/displays/${encodeURIComponent(name)}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ xml })
  });

  const data = await readApiJson(res);
  if (!res.ok) {
    throw new Error(data.error || `Failed to save ${name}`);
  }

  return data;
}

async function loadDisplayXml(name) {
  if (activeProjectKey) {
    const record = getProjectScreenByKey(activeProjectKey);
    if (record) {
      return {
        name: record.screen.name,
        xml: record.screen.xml,
        projectId: record.project.id,
        folderName: record.folder.name
      };
    }
  }

  const res = await fetch(`/api/displays/${encodeURIComponent(name)}`);
  const data = await readApiJson(res);
  if (!res.ok) {
    throw new Error(data.error || `Failed to load ${name}`);
  }

  return data;
}

async function deleteDisplayXml(name, source) {
  const normalizedSource = source === 'uploaded' ? 'edited' : source;
  const query = normalizedSource ? `?source=${encodeURIComponent(normalizedSource)}` : '';
  const res = await fetch(`/api/displays/${encodeURIComponent(name)}${query}`, {
    method: 'DELETE'
  });

  const data = await readApiJson(res);
  if (res.status === 404) {
    return { ok: true, removed: name, alreadyMissing: true };
  }
  if (!res.ok) {
    throw new Error(data.error || `Failed to remove ${name}`);
  }

  return data;
}

async function saveDefaultTemplateXml(name, xml) {
  const res = await fetch(`/api/default-pages/${encodeURIComponent(name)}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ xml })
  });

  const data = await readApiJson(res);
  if (!res.ok) {
    throw new Error(data.error || `Failed to save default template ${name}`);
  }

  return data;
}

async function loadDefaultTemplateXml(name) {
  const res = await fetch(`/api/default-pages/${encodeURIComponent(name)}`);
  const data = await readApiJson(res);
  if (!res.ok) {
    throw new Error(data.error || `Failed to load default template ${name}`);
  }

  return data;
}

async function deleteDefaultTemplateXml(name) {
  const res = await fetch(`/api/default-pages/${encodeURIComponent(name)}`, {
    method: 'DELETE'
  });

  const data = await readApiJson(res);
  if (res.status === 404) {
    return { ok: true, removed: name, alreadyMissing: true };
  }
  if (!res.ok) {
    throw new Error(data.error || `Failed to remove default template ${name}`);
  }

  return data;
}

async function seedDefaultTemplates(files) {
  const res = await fetch('/api/default-pages/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: Array.isArray(files) ? files : [] })
  });

  const data = await readApiJson(res);
  if (!res.ok) {
    throw new Error(data.error || 'Failed to copy default templates to project');
  }

  return data;
}

function updateCurrentDisplayRow(name, xml) {
  const meta = readSizeFromXml(xml);
  currentDisplayRows = currentDisplayRows.map((file) => file.name === name
    ? {
        ...file,
        sizeBytes: new Blob([xml]).size,
        lastModified: new Date().toISOString(),
        width: meta.width,
        height: meta.height
      }
    : file);
}

function upsertCurrentDisplayRow(row) {
  const key = displayKey(row.name);
  const existingIndex = currentDisplayRows.findIndex((file) => displayKey(file.name) === key);
  if (existingIndex >= 0) {
    currentDisplayRows = currentDisplayRows.map((file, index) => index === existingIndex ? { ...file, ...row } : file);
    return;
  }

  currentDisplayRows = [...currentDisplayRows, { ...row }];
}

function moveDisplayRow(sourceKey, targetKey) {
  if (!sourceKey || !targetKey || sourceKey === targetKey) {
    return;
  }

  const nextRows = [...currentDisplayRows];
  const sourceIndex = nextRows.findIndex((file) => displayKey(file.name) === sourceKey);
  const targetIndex = nextRows.findIndex((file) => displayKey(file.name) === targetKey);
  if (sourceIndex < 0 || targetIndex < 0) {
    return;
  }

  const [moved] = nextRows.splice(sourceIndex, 1);
  nextRows.splice(targetIndex, 0, moved);
  renderDisplays(nextRows);
}

async function createDisplayFromTemplate() {
  const rawName = window.prompt('New page name', 'New Page');
  if (rawName === null) {
    return;
  }

  const trimmed = rawName.trim();
  if (!trimmed) {
    alert('Enter a page name.');
    return;
  }

  const normalized = `${trimmed.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim()}.xml`;
  const pageName = normalized.replace(/\.xml\.xml$/i, '.xml');
  const existing = currentDisplayRows.find((file) => displayKey(file.name) === displayKey(pageName));
  if (existing && !window.confirm(`${pageName} already exists. Replace it?`)) {
    return;
  }

  const template = await loadDisplayXml(TEMPLATE_DISPLAY_NAME);
  await saveDisplayXml(pageName, template.xml);

  const meta = readSizeFromXml(template.xml);
  upsertCurrentDisplayRow({
    name: pageName,
    source: 'edited',
    sizeBytes: new Blob([template.xml]).size,
    lastModified: new Date().toISOString(),
    width: meta.width,
    height: meta.height
  });

  usingUploadedList = false;
  renderDisplays(currentDisplayRows);
  await loadDisplay(pageName);
}

function setBridgeCard(status) {
  const dot = bridgeStatus.querySelector('.dot');
  dot.style.background = status.connected ? '#27ae60' : '#e74c3c';
  bridgeStatus.querySelector('span:last-child').textContent =
    `Bridge live | displays ${status.displaysCount} | edited ${status.editedCount}`;
}

function clearSelectedDisplay() {
  selectedDisplay = '';
  selectedDefaultTemplate = '';
  selectedFolderName = '';
  selectedFolderIsCustom = false;
  selectedObjectIndex = null;
  displayName.value = 'None';
  xmlEditor.value = '';
  resetHistory('');
  clearObjectPanel();
  updatePackageSelection(currentDisplayRows);
  renderPreview();
}

async function removeDisplayByName(name) {
  const key = displayKey(name);
  const file = currentDisplayRows.find((rowFile) => displayKey(rowFile.name) === key);
  if (!file) {
    return;
  }

  const confirmed = confirm(`Remove ${file.name} from the list?`);
  if (!confirmed) {
    return;
  }

  await deleteDisplayXml(file.name, file.source);
  if (folderAssignments[key]) {
    delete folderAssignments[key];
    try {
      await saveDisplayFolders();
    } catch (_err) {
      // Ignore folder save failure during delete flow.
    }
  }

  if (displayKey(selectedDisplay) === key) {
    clearSelectedDisplay();
  }

  const nextFiles = currentDisplayRows.filter((rowFile) => displayKey(rowFile.name) !== key);
  renderDisplays(nextFiles);
}

async function removeDefaultTemplateByName(name) {
  const key = displayKey(name);
  const file = currentDefaultRows.find((rowFile) => displayKey(rowFile.name) === key);
  if (!file) {
    return;
  }

  const confirmed = confirm(`Remove default template ${file.name}?`);
  if (!confirmed) {
    return;
  }

  await deleteDefaultTemplateXml(file.name);

  if (displayKey(selectedDefaultTemplate) === key) {
    clearSelectedDisplay();
  }

  const nextFiles = currentDefaultRows.filter((rowFile) => displayKey(rowFile.name) !== key);
  renderDefaultTemplates(nextFiles);
}

function renderDisplays(files) {
  const visibleFiles = files.filter((file) => !hiddenDisplayNames.has(displayKey(file.name)));
  currentDisplayRows = visibleFiles.map((file) => ({ ...file }));
  displaysList.innerHTML = '';
  updatePackageSelection(currentDisplayRows);

  const hasSelectedVisible = visibleFiles.some((file) => displayKey(file.name) === displayKey(selectedDisplay));
  if (!hasSelectedVisible && selectedDisplay) {
    clearSelectedDisplay();
  }

  if (!visibleFiles.length) {
    displaysList.innerHTML = '<li>No display XML files loaded yet.</li>';
    removeDisplayBtn.disabled = true;
    return;
  }

  const displayFiles = visibleFiles.filter((file) => !isGlobalObjectFile(file));
  const globalObjectFiles = visibleFiles.filter((file) => isGlobalObjectFile(file));

  const autoFolderMap = buildAutoDisplayFolderMap(displayFiles);

  const filesByFolder = new Map();
  for (const file of displayFiles) {
    const folderName = resolveDisplayFolderName(file.name, autoFolderMap);
    if (!filesByFolder.has(folderName)) {
      filesByFolder.set(folderName, []);
    }
    filesByFolder.get(folderName).push(file);
  }

  const foldersInUse = [...new Set([...folderNames, ...filesByFolder.keys()])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const hasSelectedFolder = selectedFolderName
    && foldersInUse.some((name) => name.toLowerCase() === selectedFolderName.toLowerCase());
  if (!hasSelectedFolder) {
    selectedFolderName = '';
    selectedFolderIsCustom = false;
  }

  removeDisplayBtn.disabled = !selectedDisplay;
  if (removeFolderBtn) {
    removeFolderBtn.disabled = !selectedFolderName;
  }

  const customFolderSet = new Set(folderNames.map((name) => name.toLowerCase()));

  const appendSectionHeader = (title) => {
    const section = document.createElement('li');
    section.className = 'list-section';
    section.textContent = title;
    displaysList.appendChild(section);
  };

  const appendFileRow = (file, options = {}) => {
    const isGlobalObject = Boolean(options.isGlobalObject);
    const namePrefix = isGlobalObject ? '◆ ' : '';
    const appendTo = options.appendTo || displaysList;

    const li = document.createElement('li');
    li.className = `display-item${isGlobalObject ? ' global-object-item' : ''}`;
    li.draggable = !isGlobalObject;
    li.dataset.displayKey = displayKey(file.name);
    if (displayKey(selectedDisplay) === displayKey(file.name)) {
      li.classList.add('active');
    }

    const row = document.createElement('div');
    row.className = 'list-row';

    const name = document.createElement('strong');
    name.textContent = `${namePrefix}${file.name}`;
    row.appendChild(name);

    const meta = document.createElement('div');
    const sizeLabel = file.width && file.height ? `${file.width}x${file.height}` : 'size unknown';
    const sourceLabel = isGlobalObject ? `${file.source} · global object` : file.source;
    meta.textContent = `${sourceLabel} · ${sizeLabel} · ${kb(file.sizeBytes)}\n${shortDateTime(file.lastModified)}`;

    li.appendChild(row);
    li.appendChild(meta);

    if (!isGlobalObject) {
      li.addEventListener('dragstart', () => {
        draggedDisplayKey = displayKey(file.name);
        li.classList.add('dragging');
      });
      li.addEventListener('dragend', () => {
        draggedDisplayKey = '';
        li.classList.remove('dragging');
        Array.from(displaysList.querySelectorAll('.folder-row')).forEach((item) => item.classList.remove('drag-over'));
      });
    }

    li.addEventListener('click', () => {
      loadDisplay(file.name).catch((err) => {
        console.error(err);
        alert('Could not open display XML');
      });
    });

    appendTo.appendChild(li);
  };

  if (displayFiles.length || foldersInUse.length) {
    appendSectionHeader('Displays');

    for (const folderName of foldersInUse) {
      const folderFiles = filesByFolder.get(folderName) || [];
      const isCustomFolder = customFolderSet.has(String(folderName).toLowerCase());
      const folderLi = document.createElement('li');
      folderLi.className = 'folder-item';
      if (folderCollapsedNames.has(folderName)) {
        folderLi.classList.add('collapsed');
      }

      const folderRow = document.createElement('div');
      folderRow.className = 'folder-row';
      folderRow.dataset.folderName = folderName;
      if (selectedFolderName && String(selectedFolderName).toLowerCase() === String(folderName).toLowerCase()) {
        folderRow.classList.add('selected');
      }

      const toggle = document.createElement('span');
      toggle.className = 'folder-toggle';
      toggle.textContent = folderCollapsedNames.has(folderName) ? '▸' : '▾';

      const folderLabel = document.createElement('span');
      folderLabel.className = 'folder-name';
      folderLabel.textContent = folderName;

      const folderCount = document.createElement('span');
      folderCount.className = 'folder-count';
      folderCount.textContent = `${folderFiles.length}`;

      folderRow.appendChild(toggle);
      folderRow.appendChild(folderLabel);
      folderRow.appendChild(folderCount);

      folderRow.addEventListener('click', () => {
        selectedFolderName = folderName;
        selectedFolderIsCustom = isCustomFolder;
        if (folderCollapsedNames.has(folderName)) {
          folderCollapsedNames.delete(folderName);
        } else {
          folderCollapsedNames.add(folderName);
        }
        renderDisplays(currentDisplayRows);
      });

      folderRow.addEventListener('dragover', (event) => {
        event.preventDefault();
        if (!draggedDisplayKey) {
          return;
        }
        folderRow.classList.add('drag-over');
      });

      folderRow.addEventListener('dragleave', () => {
        folderRow.classList.remove('drag-over');
      });

      folderRow.addEventListener('drop', async (event) => {
        event.preventDefault();
        folderRow.classList.remove('drag-over');
        if (!draggedDisplayKey) {
          return;
        }

        folderAssignments[draggedDisplayKey] = folderName;
        try {
          await saveDisplayFolders();
          renderDisplays(currentDisplayRows);
        } catch (err) {
          console.error(err);
          alert('Could not save folder assignment.');
        }
      });

      folderLi.appendChild(folderRow);

      const children = document.createElement('ul');
      children.className = 'folder-children';
      for (const file of folderFiles) {
        appendFileRow(file, { appendTo: children });
      }
      folderLi.appendChild(children);
      displaysList.appendChild(folderLi);
    }
  }

  if (globalObjectFiles.length) {
    appendSectionHeader('Global Objects');
    for (const file of globalObjectFiles) {
      appendFileRow(file, { isGlobalObject: true });
    }
  }
}

function renderDefaultTemplates(files) {
  currentDefaultRows = [...files];
  displaysList.innerHTML = '';

  const hasSelectedVisible = files.some((file) => displayKey(file.name) === displayKey(selectedDefaultTemplate));
  if (!hasSelectedVisible && selectedDefaultTemplate) {
    selectedDefaultTemplate = '';
  }

  removeDisplayBtn.disabled = !selectedDefaultTemplate;
  if (!files.length) {
    displaysList.innerHTML = '<li>No default template XML files found in ftio/default-pages.</li>';
    return;
  }

  const appendSectionHeader = (title) => {
    const section = document.createElement('li');
    section.className = 'list-section';
    section.textContent = title;
    displaysList.appendChild(section);
  };

  const appendProjectHeader = (title) => {
    const section = document.createElement('li');
    section.className = 'project-item';

    const row = document.createElement('div');
    row.className = 'project-row';

    const toggle = document.createElement('span');
    toggle.className = 'project-toggle';
    toggle.textContent = '▾';

    const label = document.createElement('span');
    label.className = 'project-name';
    label.textContent = title;

    const count = document.createElement('span');
    count.className = 'project-count';
    count.textContent = `${files.length}`;

    row.appendChild(toggle);
    row.appendChild(label);
    row.appendChild(count);
    section.appendChild(row);

    const children = document.createElement('ul');
    children.className = 'project-children';
    section.appendChild(children);

    row.addEventListener('click', () => {
      const collapsed = section.classList.toggle('collapsed');
      toggle.textContent = collapsed ? '▸' : '▾';
    });

    displaysList.appendChild(section);
    return children;
  };

  const appendDefaultFileRow = (file, options = {}) => {
    const isGlobalObject = Boolean(options.isGlobalObject);
    const appendTo = options.appendTo || displaysList;
    const namePrefix = isGlobalObject ? '◆ ' : '';

    const li = document.createElement('li');
    li.className = `display-item${isGlobalObject ? ' global-object-item' : ''}`;
    if (displayKey(selectedDefaultTemplate) === displayKey(file.name)) {
      li.classList.add('active');
    }

    const row = document.createElement('div');
    row.className = 'list-row';
    const name = document.createElement('strong');
    name.textContent = `${namePrefix}${file.name}`;
    row.appendChild(name);

    const meta = document.createElement('div');
    const sizeLabel = file.width && file.height ? `${file.width}x${file.height}` : 'size unknown';
    const sourceLabel = isGlobalObject ? 'default global object' : 'default template';
    meta.textContent = `${sourceLabel} | ${sizeLabel} | ${kb(file.sizeBytes)} | ${shortDateTime(file.lastModified)}`;

    li.appendChild(row);
    li.appendChild(meta);
    li.addEventListener('click', () => {
      loadDefaultTemplate(file.name).catch((err) => {
        console.error(err);
        alert(err.message || 'Could not open default template XML');
      });
    });

    appendTo.appendChild(li);
  };

  const globalObjectFiles = files.filter((file) => isGlobalObjectFile(file) || !isNumberedDisplayName(file.name));
  const globalObjectKeySet = new Set(globalObjectFiles.map((file) => displayKey(file.name)));
  const templateFiles = files.filter((file) => !globalObjectKeySet.has(displayKey(file.name)));

  if (templateFiles.length) {
    appendSectionHeader('Default Templates');
  }

  const grouped = new Map();
  for (const file of templateFiles) {
    const base = String(file.name || '').replace(/\.xml$/i, '');
    const match = base.match(/^(\d{3})/);
    const bucket = match ? Math.floor(Number(match[1]) / 100) * 100 : null;
    const groupKey = Number.isFinite(bucket) ? String(bucket).padStart(3, '0') : 'UNGROUPED';
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey).push(file);
  }

  const projectChildren = appendProjectHeader(currentProjectName);

  const folderNames = [];
  for (const [groupKey, groupFiles] of grouped.entries()) {
    if (groupKey === 'UNGROUPED') {
      folderNames.push({ key: groupKey, name: 'Ungrouped' });
      continue;
    }

    const exact = groupFiles.find((file) => String(file.name || '').toLowerCase().startsWith(`${groupKey.toLowerCase()}_`));
    const folderName = String((exact || groupFiles[0]).name || '').replace(/\.xml$/i, '');
    folderNames.push({ key: groupKey, name: folderName });
  }

  folderNames.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true, sensitivity: 'base' }));

  for (const folder of folderNames) {
    const folderFiles = grouped.get(folder.key) || [];

    const folderLi = document.createElement('li');
    folderLi.className = 'folder-item';

    const folderRow = document.createElement('div');
    folderRow.className = 'folder-row';

    const toggle = document.createElement('span');
    toggle.className = 'folder-toggle';
    toggle.textContent = '▾';

    const folderLabel = document.createElement('span');
    folderLabel.className = 'folder-name';
    folderLabel.textContent = folder.name;

    const folderCount = document.createElement('span');
    folderCount.className = 'folder-count';
    folderCount.textContent = `${folderFiles.length}`;

    folderRow.appendChild(toggle);
    folderRow.appendChild(folderLabel);
    folderRow.appendChild(folderCount);

    folderRow.addEventListener('click', () => {
      const collapsed = folderLi.classList.toggle('collapsed');
      toggle.textContent = collapsed ? '▸' : '▾';
    });

    folderLi.appendChild(folderRow);

    const children = document.createElement('ul');
    children.className = 'folder-children';
    for (const file of folderFiles) {
      appendDefaultFileRow(file, { appendTo: children });
    }

    folderLi.appendChild(children);
    displaysList.appendChild(folderLi);
  }

  if (globalObjectFiles.length) {
    appendSectionHeader('Global Objects');
    for (const file of globalObjectFiles) {
      appendDefaultFileRow(file, { isGlobalObject: true });
    }
  }
}

function renderProjectSidebar() {
  displaysList.innerHTML = '';

  normalizeProjectList();
  if (!projectList.length) {
    displaysList.innerHTML = '<li>No projects yet. Click New Project to create one.</li>';
    if (sidebarTitle) {
      sidebarTitle.textContent = 'Projects';
    }
    return;
  }

  const appendProjectHeader = (project) => {
    const section = document.createElement('li');
    section.className = 'project-item';
    if (project.collapsed) {
      section.classList.add('collapsed');
    }

    const row = document.createElement('div');
    row.className = 'project-row';
    if (project.id === activeProjectId) {
      row.classList.add('selected');
    }

    const toggle = document.createElement('span');
    toggle.className = 'project-toggle';
    toggle.textContent = project.collapsed ? '▸' : '▾';

    const label = document.createElement('span');
    label.className = 'project-name';
    label.textContent = project.name;

    const count = document.createElement('span');
    count.className = 'project-count';
    count.textContent = `${project.folders.length}`;

    const actions = document.createElement('div');
    actions.className = 'tree-actions';

    const addFolderBtn = document.createElement('button');
    addFolderBtn.type = 'button';
    addFolderBtn.className = 'tree-action-btn';
    addFolderBtn.textContent = '+';
    addFolderBtn.title = 'Add folder';
    addFolderBtn.addEventListener('click', async (event) => {
      event.stopPropagation();
      showSidebarNamePanel({
        label: `Folder name for ${project.name}`,
        value: 'New_Folder',
        placeholder: 'New_Folder',
        confirmText: 'Add folder',
        onConfirm: (rawName) => {
          const trimmedName = String(rawName || '').trim();
          if (!trimmedName) {
            alert('Enter a valid folder name.');
            return false;
          }

          if (findProjectFolder(project, trimmedName)) {
            alert('That folder already exists.');
            return false;
          }

          project.folders.push({ name: trimmedName, collapsed: false, screens: [] });
          saveProjectList();
          renderProjectSidebar();
          return true;
        }
      });
    });

    const removeProjectBtn = document.createElement('button');
    removeProjectBtn.type = 'button';
    removeProjectBtn.className = 'tree-action-btn danger';
    removeProjectBtn.textContent = '×';
    removeProjectBtn.title = 'Remove project';
    removeProjectBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!window.confirm(`Remove project ${project.name}? This deletes its tree from the browser.`)) {
        return;
      }
      removeProjectById(project.id);
    });

    actions.appendChild(addFolderBtn);
    actions.appendChild(removeProjectBtn);

    row.appendChild(toggle);
    row.appendChild(label);
    row.appendChild(count);
    row.appendChild(actions);
    section.appendChild(row);

    const children = document.createElement('ul');
    children.className = 'project-children';
    section.appendChild(children);

    row.addEventListener('click', () => {
      project.collapsed = !project.collapsed;
      saveProjectList();
      renderProjectSidebar();
    });

    return { section, children };
  };

  const appendFolder = (project, folder, appendTo) => {
    const folderLi = document.createElement('li');
    folderLi.className = 'folder-item';
    if (folder.collapsed) {
      folderLi.classList.add('collapsed');
    }

    const folderRow = document.createElement('div');
    folderRow.className = 'folder-row';

    const toggle = document.createElement('span');
    toggle.className = 'folder-toggle';
    toggle.textContent = folder.collapsed ? '▸' : '▾';

    const folderLabel = document.createElement('span');
    folderLabel.className = 'folder-name';
    folderLabel.textContent = folder.name;

    const folderCount = document.createElement('span');
    folderCount.className = 'folder-count';
    folderCount.textContent = `${folder.screens.length}`;

    const folderActions = document.createElement('div');
    folderActions.className = 'tree-actions';

    const addScreenBtn = document.createElement('button');
    addScreenBtn.type = 'button';
    addScreenBtn.className = 'tree-action-btn';
    addScreenBtn.textContent = '+';
    addScreenBtn.title = 'Add screen';
    addScreenBtn.addEventListener('click', async (event) => {
      event.stopPropagation();
      showSidebarNamePanel({
        label: `Screen name for ${folder.name}`,
        value: 'New_Screen',
        placeholder: 'New_Screen',
        confirmText: 'Add screen',
        onConfirm: async (rawName) => {
          const screenName = String(rawName || '').trim();
          if (!screenName) {
            alert('Enter a screen name.');
            return false;
          }

          try {
            await createProjectScreen(project.id, folder.name, screenName);
            return true;
          } catch (err) {
            console.error(err);
            alert(err.message || 'Could not add screen.');
            return false;
          }
        }
      });
    });

    folderActions.appendChild(addScreenBtn);

    folderRow.appendChild(toggle);
    folderRow.appendChild(folderLabel);
    folderRow.appendChild(folderCount);
    folderRow.appendChild(folderActions);
    folderLi.appendChild(folderRow);

    const children = document.createElement('ul');
    children.className = 'folder-children';

    for (const screen of folder.screens) {
      const screenLi = document.createElement('li');
      screenLi.className = 'display-item';
      screenLi.draggable = true;
      if (activeProjectKey === createProjectKey(project.id, folder.name, screen.name)) {
        screenLi.classList.add('active');
      }

      const row = document.createElement('div');
      row.className = 'list-row';

      const name = document.createElement('strong');
      name.textContent = screen.name;
      row.appendChild(name);

      const meta = document.createElement('div');
      const sizeLabel = screen.width && screen.height ? `${screen.width}x${screen.height}` : 'size unknown';
      meta.textContent = `project screen · ${sizeLabel} · ${kb(screen.sizeBytes)}\n${shortDateTime(screen.lastModified)}`;

      const actions = document.createElement('div');
      actions.className = 'tree-actions';

      const removeScreenBtn = document.createElement('button');
      removeScreenBtn.type = 'button';
      removeScreenBtn.className = 'tree-action-btn danger';
      removeScreenBtn.textContent = '×';
      removeScreenBtn.title = 'Remove screen';
      removeScreenBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        if (!window.confirm(`Remove screen ${screen.name}?`)) {
          return;
        }

        removeProjectScreen(project.id, folder.name, screen.name);
      });

      actions.appendChild(removeScreenBtn);

      screenLi.appendChild(row);
      screenLi.appendChild(meta);
      screenLi.appendChild(actions);
      screenLi.dataset.projectId = project.id;
      screenLi.dataset.folderName = folder.name;
      screenLi.dataset.screenName = screen.name;

      screenLi.addEventListener('dragstart', (event) => {
        draggedDisplayKey = createProjectKey(project.id, folder.name, screen.name);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedDisplayKey);
      });

      screenLi.addEventListener('dragend', () => {
        draggedDisplayKey = '';
        Array.from(displaysList.querySelectorAll('.folder-row, .display-item')).forEach((item) => item.classList.remove('drag-over'));
      });

      screenLi.addEventListener('dragover', (event) => {
        event.preventDefault();
        if (!draggedDisplayKey) {
          return;
        }
        screenLi.classList.add('drag-over');
      });

      screenLi.addEventListener('dragleave', () => {
        screenLi.classList.remove('drag-over');
      });

      screenLi.addEventListener('drop', async (event) => {
        event.preventDefault();
        screenLi.classList.remove('drag-over');
        if (!draggedDisplayKey) {
          return;
        }

        const dragged = getProjectScreenByKey(draggedDisplayKey);
        if (!dragged) {
          return;
        }

        if (dragged.project.id === project.id && dragged.folder.name === folder.name && dragged.screen.name === screen.name) {
          return;
        }

        moveProjectScreen(dragged.project.id, dragged.folder.name, dragged.screen.name, project.id, folder.name, screen.name);
      });
      screenLi.addEventListener('click', async () => {
        try {
          await openProjectScreen(project.id, folder.name, screen.name);
        } catch (err) {
          console.error(err);
          alert(err.message || 'Could not open screen.');
        }
      });

      children.appendChild(screenLi);
    }

    folderRow.addEventListener('click', () => {
      folder.collapsed = !folder.collapsed;
      saveProjectList();
      renderProjectSidebar();
    });

    folderRow.addEventListener('dragover', (event) => {
      event.preventDefault();
      if (!draggedDisplayKey) {
        return;
      }
      folderRow.classList.add('drag-over');
    });

    folderRow.addEventListener('dragleave', () => {
      folderRow.classList.remove('drag-over');
    });

    folderRow.addEventListener('drop', async (event) => {
      event.preventDefault();
      folderRow.classList.remove('drag-over');
      if (!draggedDisplayKey) {
        return;
      }

      const dragged = getProjectScreenByKey(draggedDisplayKey);
      if (!dragged) {
        return;
      }

      if (dragged.project.id === project.id && dragged.folder.name === folder.name) {
        return;
      }

      moveProjectScreen(dragged.project.id, dragged.folder.name, dragged.screen.name, project.id, folder.name);
    });

    folderLi.appendChild(children);
    appendTo.appendChild(folderLi);
  };

  for (const project of projectList) {
    const { section, children } = appendProjectHeader(project);
    for (const folder of project.folders) {
      appendFolder(project, folder, children);
    }
    displaysList.appendChild(section);
  }

  if (sidebarTitle) {
    sidebarTitle.textContent = 'Projects';
  }
}

function keepCurrentDisplayOrder(nextFiles) {
  if (!Array.isArray(nextFiles) || !nextFiles.length) {
    return [];
  }

  const orderMap = new Map(currentDisplayRows.map((file, index) => [displayKey(file.name), index]));
  return [...nextFiles].sort((a, b) => {
    const aIndex = orderMap.has(displayKey(a.name)) ? orderMap.get(displayKey(a.name)) : Number.MAX_SAFE_INTEGER;
    const bIndex = orderMap.has(displayKey(b.name)) ? orderMap.get(displayKey(b.name)) : Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    // New files not seen before keep a stable deterministic order.
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

async function refreshDisplays() {
  previewImageNonce = Date.now();
  const [displayRes, folderRes] = await Promise.all([
    fetch('/api/displays'),
    fetch('/api/display-folders')
  ]);

  if (!displayRes.ok) {
    throw new Error('Failed to load displays');
  }

  if (folderRes.ok) {
    const folderData = await folderRes.json();
    folderNames = Array.isArray(folderData.folders)
      ? [...new Set(folderData.folders.map((name) => normalizeFolderName(name)).filter(Boolean))]
      : [];
    const rawAssignments = folderData.assignments && typeof folderData.assignments === 'object'
      ? folderData.assignments
      : {};
    const nextAssignments = {};
    for (const [name, folder] of Object.entries(rawAssignments)) {
      const key = displayKey(name);
      const folderName = normalizeFolderName(folder);
      if (key && folderName) {
        nextAssignments[key] = folderName;
      }
    }
    folderAssignments = nextAssignments;
  }

  const data = await displayRes.json();
  renderDisplays(keepCurrentDisplayOrder(data.files));
}

async function refreshDefaultTemplates() {
  previewImageNonce = Date.now();
  const res = await fetch('/api/default-pages');
  if (!res.ok) {
    throw new Error('Failed to load default templates');
  }

  const data = await res.json();
  renderDefaultTemplates(data.files || []);
}

function resolveDisplayBackgroundColor(rawColor) {
  const color = String(rawColor || '').trim();
  if (!color) {
    return '#d9d9d9';
  }

  const normalized = color.toLowerCase();
  // FactoryTalk white screens are visually closer to an HMI neutral gray.
  if (normalized === 'white' || normalized === '#fff' || normalized === '#ffffff') {
    return '#efefef';
  }

  return color;
}

function renderPreview() {
  previewImageNonce = Date.now();
  const name = displayName.value.trim() || 'Untitled Display';
  const xml = xmlEditor.value.trim();
  if (!xml) {
    previewPane.innerHTML = '<div class="preview-empty">Open a display XML to see preview.</div>';
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    previewPane.innerHTML = '<div class="preview-empty">XML parse error. Fix XML to render preview.</div>';
    return;
  }

  const displaySettings = doc.querySelector('displaySettings');
  const width = Number(displaySettings?.getAttribute('width'))
    || Number(screenWidth.value)
    || DEFAULT_PREVIEW_WIDTH;
  const height = Number(displaySettings?.getAttribute('height'))
    || Number(screenHeight.value)
    || DEFAULT_PREVIEW_HEIGHT;
  const backColor = resolveDisplayBackgroundColor(displaySettings?.getAttribute('backColor'));

  previewPane.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'preview-header';
  header.textContent = `${name} (${width} x ${height})`;
  previewPane.appendChild(header);

  const frame = document.createElement('div');
  frame.className = 'preview-frame';
  frame.style.background = backColor;

  const canvas = document.createElement('div');
  canvas.className = 'xml-canvas';
  canvas.style.background = backColor;

  const objectNodes = getObjectNodes(doc);
  const gfxRoot = doc.querySelector('gfx');
  if (selectedObjectIndex !== null && (selectedObjectIndex < 0 || selectedObjectIndex >= objectNodes.length)) {
    selectedObjectIndex = null;
    clearObjectPanel();
  }

  if (gfxRoot) {
    objectNodes.forEach((el, index) => {
      const tag = String(el.tagName || '').toLowerCase();
      const isLineTag = tag === 'line';
      const activeStateNode = getActiveStateNode(el);
      const visualSource = activeStateNode || el;
      const left = Number(el.getAttribute('left'));
      const top = Number(el.getAttribute('top'));
      const w = Number(el.getAttribute('width'));
      const h = Number(el.getAttribute('height'));
      if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(w) || !Number.isFinite(h)) {
        return;
      }

      const box = document.createElement('div');
      box.className = 'xml-object';
      if (selectedObjectIndex === index) {
        box.classList.add('selected');
      }
      box.style.left = `${(left / width) * 100}%`;
      box.style.top = `${(top / height) * 100}%`;
      box.style.width = `${(w / width) * 100}%`;
      box.style.height = `${(h / height) * 100}%`;

      if (isLineTag) {
        const points = parseLinePoints(el);
        const dx = points.x2 - points.x1;
        const dy = points.y2 - points.y1;
        const length = Math.max(1, Math.sqrt((dx * dx) + (dy * dy)));
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const thickness = Math.max(1, Number(el.getAttribute('lineWidth')) || 1);

        box.classList.add('xml-line-object');
        box.style.left = `${(points.x1 / width) * 100}%`;
        box.style.top = `${(points.y1 / height) * 100}%`;
        box.style.width = `${(length / width) * 100}%`;
        box.style.height = `${(thickness / height) * 100}%`;
        box.style.transform = `rotate(${angle}deg)`;
        box.style.transformOrigin = '0 50%';
        box.style.padding = '0';

        const lineColor = el.getAttribute('foreColor') || el.getAttribute('backColor') || '#000000';
        box.style.background = lineColor;
      }

      if (!isLineTag) {
        applyFillStyles(box, visualSource);
      }

      applyBorderStyles(box, el, visualSource);

      const captionNode = Array.from(visualSource.children).find((child) => child.tagName === 'caption')
        || Array.from(el.children).find((child) => child.tagName === 'caption');
      const imageName = getNodeImageName(el);
      if (imageName && !isLineTag) {
        const imageOpts = getNodeImageRenderOptions(el);
        const imageEl = document.createElement('img');
        imageEl.className = 'xml-object-image';
        imageEl.alt = imageName;
        imageEl.draggable = false;
        imageEl.src = `/api/images/${encodeURIComponent(imageName)}?v=${previewImageNonce}`;

        if (imageOpts.scaled) {
          const xPos = imageOpts.horizontal === 'left' ? 'left' : imageOpts.horizontal === 'right' ? 'right' : 'center';
          const yPos = imageOpts.vertical === 'top' ? 'top' : imageOpts.vertical === 'bottom' ? 'bottom' : 'center';
          imageEl.style.objectFit = 'contain';
          imageEl.style.objectPosition = `${xPos} ${yPos}`;
        } else {
          imageEl.classList.add('unscaled');
          imageEl.style.left = imageOpts.horizontal === 'left' ? '0' : imageOpts.horizontal === 'right' ? '100%' : '50%';
          imageEl.style.top = imageOpts.vertical === 'top' ? '0' : imageOpts.vertical === 'bottom' ? '100%' : '50%';
          imageEl.style.transform = `translate(${imageOpts.horizontal === 'left' ? '0' : '-50%'}, ${imageOpts.vertical === 'top' ? '0' : '-50%'})`;
        }

        imageEl.addEventListener('error', () => {
          imageEl.remove();
          const fallbackEl = createImageFallback(imageName);
          if (fallbackEl) {
            box.appendChild(fallbackEl);
            return;
          }

          box.classList.add('image-missing');
        });
        box.appendChild(imageEl);
      }

      const caption = previewTextForNode(el, captionNode);
      if (caption) {
        const captionEl = document.createElement('span');
        captionEl.className = 'xml-object-caption';
        captionEl.textContent = caption;
        box.appendChild(captionEl);
      }

      applyCaptionStyles(box, el, captionNode);
      box.title = `${el.tagName} (${left},${top}) ${w}x${h}`;

      const commitRectChange = (nextLeft, nextTop, nextWidth, nextHeight, errorMessage) => {
        const parser = new DOMParser();
        const workingDoc = parser.parseFromString(xmlEditor.value, 'text/xml');
        const parseError = workingDoc.querySelector('parsererror');
        if (parseError) {
          alert(errorMessage);
          renderPreview();
          return;
        }

        const nodes = getObjectNodes(workingDoc);
        const node = nodes[index];
        if (!node) {
          renderPreview();
          return;
        }

        node.setAttribute('left', String(Math.round(nextLeft)));
        node.setAttribute('top', String(Math.round(nextTop)));
        node.setAttribute('width', String(Math.max(1, Math.round(nextWidth))));
        node.setAttribute('height', String(Math.max(1, Math.round(nextHeight))));
        xmlEditor.value = serializeXmlDoc(workingDoc);
        recordHistory(xmlEditor.value);

        selectedObjectIndex = index;
        populateObjectPanel(workingDoc, index);
        renderPreview();

        if (selectedDisplay) {
          saveDisplayXml(selectedDisplay, xmlEditor.value)
            .then(() => {
              updateCurrentDisplayRow(selectedDisplay, xmlEditor.value);
              if (usingUploadedList) {
                renderDisplays(currentDisplayRows);
              } else {
                refreshDisplays().catch(() => {});
              }
            })
            .catch((err) => {
              console.error(err);
            });
        }
      };

      const resizeHandle = document.createElement('span');
      resizeHandle.className = 'xml-resize-handle';
      if (!isLineTag) {
        box.appendChild(resizeHandle);
      }

      let suppressClick = false;
      box.addEventListener('mousedown', (downEvent) => {
        if (downEvent.button !== 0) {
          return;
        }

        if (isLineTag) {
          return;
        }

        if (downEvent.target.closest('.xml-resize-handle')) {
          return;
        }

        downEvent.preventDefault();
        downEvent.stopPropagation();

        const { scaleX, scaleY } = getCanvasScale(canvas, width, height);
        if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
          return;
        }

        const startX = downEvent.clientX;
        const startY = downEvent.clientY;
        let nextLeft = left;
        let nextTop = top;
        let moved = false;

        const onMove = (moveEvent) => {
          const deltaX = (moveEvent.clientX - startX) / scaleX;
          const deltaY = (moveEvent.clientY - startY) / scaleY;
          const dragDistance = Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY);
          if (dragDistance > 2) {
            moved = true;
            suppressClick = true;
          }

          if (!moved) {
            return;
          }

          nextLeft = clamp(left + deltaX, 0, Math.max(0, width - w));
          nextTop = clamp(top + deltaY, 0, Math.max(0, height - h));

          box.classList.add('dragging');
          box.style.left = `${(nextLeft / width) * 100}%`;
          box.style.top = `${(nextTop / height) * 100}%`;
        };

        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          box.classList.remove('dragging');

          if (!moved) {
            suppressClick = false;
            return;
          }

          commitRectChange(nextLeft, nextTop, w, h, 'XML parse error. Could not save dragged position.');

          setTimeout(() => {
            suppressClick = false;
          }, 0);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp, { once: true });
      });

      if (!isLineTag) {
        resizeHandle.addEventListener('mousedown', (downEvent) => {
          if (downEvent.button !== 0) {
            return;
          }

          downEvent.preventDefault();
          downEvent.stopPropagation();

        const { scaleX, scaleY } = getCanvasScale(canvas, width, height);
        if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
          return;
        }

        selectedObjectIndex = index;
        populateObjectPanel(doc, index);

        const startX = downEvent.clientX;
        const startY = downEvent.clientY;
        let nextWidth = w;
        let nextHeight = h;
        let resized = false;
        suppressClick = true;

        const onMove = (moveEvent) => {
          const deltaX = (moveEvent.clientX - startX) / scaleX;
          const deltaY = (moveEvent.clientY - startY) / scaleY;
          const dragDistance = Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY);
          if (dragDistance > 2) {
            resized = true;
          }

          if (!resized) {
            return;
          }

          nextWidth = clamp(w + deltaX, 1, Math.max(1, width - left));
          nextHeight = clamp(h + deltaY, 1, Math.max(1, height - top));

          box.classList.add('resizing');
          box.style.width = `${(nextWidth / width) * 100}%`;
          box.style.height = `${(nextHeight / height) * 100}%`;
        };

        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          box.classList.remove('resizing');

          if (resized) {
            commitRectChange(left, top, nextWidth, nextHeight, 'XML parse error. Could not save resized dimensions.');
          }

          setTimeout(() => {
            suppressClick = false;
          }, 0);
        };

          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp, { once: true });
        });
      }

      box.addEventListener('click', (event) => {
        if (suppressClick) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        event.stopPropagation();
        selectedObjectIndex = index;
        populateObjectPanel(doc, index);
        renderPreview();
      });
      canvas.appendChild(box);
    });
  }

  canvas.addEventListener('click', () => {
    selectedObjectIndex = null;
    clearObjectPanel();
    renderPreview();
  });

  frame.appendChild(canvas);
  previewPane.appendChild(frame);

  // Refit when the viewport changes size so the full display remains visible.
  requestAnimationFrame(() => fitCanvasToFrame(frame, canvas, width, height));
}

function readSizeFromXml(xml) {
  const widthMatch = xml.match(/\bwidth\s*=\s*"(\d+)"/i);
  const heightMatch = xml.match(/\bheight\s*=\s*"(\d+)"/i);
  return {
    width: widthMatch ? Number(widthMatch[1]) : null,
    height: heightMatch ? Number(heightMatch[1]) : null
  };
}

function replaceDisplaySize(xml, width, height) {
  let updated = xml;
  updated = updated.replace(/(\bdisplaySettings[^>]*\bwidth\s*=\s*")(\d+)(")/i, `$1${width}$3`);
  updated = updated.replace(/(\bdisplaySettings[^>]*\bheight\s*=\s*")(\d+)(")/i, `$1${height}$3`);
  return updated;
}

function scaleNumericAttribute(node, attributeName, scale, minValue = 0) {
  const raw = node.getAttribute(attributeName);
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return;
  }

  node.setAttribute(attributeName, String(Math.max(minValue, Math.round(value * scale))));
}

function scaleLineAttribute(node, scaleX, scaleY) {
  const raw = String(node.getAttribute('line') || '').trim();
  if (!raw) {
    return;
  }

  const values = raw.split(/\s+/).map((part) => Number(part));
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    return;
  }

  const scaled = values.map((value, index) => Math.round(value * (index % 2 === 0 ? scaleX : scaleY)));
  node.setAttribute('line', `${scaled.join(' ')} `);
}

function resizeDisplayXml(xml, nextWidth, nextHeight) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    return xml;
  }

  const displaySettings = doc.querySelector('displaySettings');
  const currentWidth = Number(displaySettings?.getAttribute('width')) || null;
  const currentHeight = Number(displaySettings?.getAttribute('height')) || null;

  if (!displaySettings || !currentWidth || !currentHeight) {
    return replaceDisplaySize(xml, nextWidth, nextHeight);
  }

  const scaleX = nextWidth / currentWidth;
  const scaleY = nextHeight / currentHeight;
  const strokeScale = (scaleX + scaleY) / 2;

  Array.from(doc.querySelectorAll('gfx *')).forEach((node) => {
    if (!node?.tagName || node.tagName === 'displaySettings') {
      return;
    }

    scaleNumericAttribute(node, 'left', scaleX, 0);
    scaleNumericAttribute(node, 'top', scaleY, 0);
    scaleNumericAttribute(node, 'width', scaleX, 1);
    scaleNumericAttribute(node, 'height', scaleY, 1);
    scaleNumericAttribute(node, 'fontSize', strokeScale, 1);
    scaleNumericAttribute(node, 'borderWidth', strokeScale, 1);
    scaleNumericAttribute(node, 'lineWidth', strokeScale, 1);
    scaleLineAttribute(node, scaleX, scaleY);

    Array.from(node.children).forEach((child) => {
      if (!child?.tagName) {
        return;
      }

      scaleNumericAttribute(child, 'fontSize', strokeScale, 1);
      scaleNumericAttribute(child, 'borderWidth', strokeScale, 1);
      scaleNumericAttribute(child, 'lineWidth', strokeScale, 1);
    });
  });

  displaySettings.setAttribute('width', String(Math.round(nextWidth)));
  displaySettings.setAttribute('height', String(Math.round(nextHeight)));
  return serializeXmlDoc(doc);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getObjectNodes(doc) {
  const root = doc.querySelector('gfx');
  if (!root) {
    return [];
  }

  const nodes = [];
  const walk = (parent) => {
    Array.from(parent.children).forEach((child) => {
      if (!child?.tagName || child.tagName === 'displaySettings') {
        return;
      }

      if (child.tagName.toLowerCase() !== 'group') {
        nodes.push(child);
      }

      walk(child);
    });
  };

  walk(root);
  return nodes;
}

function clearObjectPanel() {
  objType.value = 'None';
  objName.value = '';
  objCaption.value = '';
  objLeft.value = 0;
  objTop.value = 0;
  objWidth.value = 1;
  objHeight.value = 1;
  objBackColor.value = '';
  objBorderColor.value = '';
  objTextColor.value = '';
  objFontSize.value = 10;
  syncColorControl(objBackColor, objBackColorPicker, objBackColorSwatch);
  syncColorControl(objBorderColor, objBorderColorPicker, objBorderColorSwatch);
  syncColorControl(objTextColor, objTextColorPicker, objTextColorSwatch);
}

function populateObjectPanel(doc, index) {
  const nodes = getObjectNodes(doc);
  const node = nodes[index];
  if (!node) {
    clearObjectPanel();
    return;
  }

  const captionNode = Array.from(node.children).find((child) => child.tagName === 'caption');
  const captionValue = captionNode?.getAttribute('caption') || node.getAttribute('caption') || '';
  objType.value = node.tagName;
  objName.value = node.getAttribute('name') || '';
  objCaption.value = captionValue;
  objLeft.value = Number(node.getAttribute('left') || 0);
  objTop.value = Number(node.getAttribute('top') || 0);
  objWidth.value = Number(node.getAttribute('width') || 1);
  objHeight.value = Number(node.getAttribute('height') || 1);
  objBackColor.value = node.getAttribute('backColor') || '';
  objBorderColor.value = node.getAttribute('borderColor') || '';
  objTextColor.value = captionNode?.getAttribute('color') || node.getAttribute('foreColor') || '';
  objFontSize.value = Number(captionNode?.getAttribute('fontSize') || node.getAttribute('fontSize') || 10);
  syncColorControl(objBackColor, objBackColorPicker, objBackColorSwatch);
  syncColorControl(objBorderColor, objBorderColorPicker, objBorderColorSwatch);
  syncColorControl(objTextColor, objTextColorPicker, objTextColorSwatch);
  if (objectPanelDetails) {
    objectPanelDetails.open = true;
  }
}

function normalizeColor(value) {
  const probe = document.createElement('span');
  probe.style.color = '';
  probe.style.color = String(value || '').trim();
  if (!probe.style.color) {
    return null;
  }

  const computed = probe.style.color;
  if (computed.startsWith('#')) {
    const hex = computed.toUpperCase();
    return hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  }

  const rgbMatch = computed.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
  if (!rgbMatch) {
    return null;
  }

  const toHex = (n) => Number(n).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`;
}

function syncColorControl(textEl, pickerEl, swatchEl) {
  const norm = normalizeColor(textEl.value);
  if (norm) {
    pickerEl.value = norm;
    swatchEl.style.background = norm;
    swatchEl.style.borderColor = '#1f2b30';
  } else {
    swatchEl.style.background = 'repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 5px, #d7d7d7 5px, #d7d7d7 10px)';
    swatchEl.style.borderColor = '#8a8a8a';
  }
}

function serializeXmlDoc(doc) {
  let xml = new XMLSerializer().serializeToString(doc);
  // XMLSerializer adds xmlns="" to elements with no namespace — remove them
  // or FactoryTalk's XML parser will reject the file.
  xml = xml.replace(/ xmlns=""/g, '');
  if (xml.startsWith('<?xml')) {
    return xml;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}

function readDownloadFileName(response, fallbackName) {
  const contentDisposition = response.headers.get('content-disposition') || '';
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch (_err) {
      return utf8Match[1];
    }
  }

  const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (basicMatch && basicMatch[1]) {
    return basicMatch[1];
  }

  return fallbackName;
}

async function savePackageAs(downloadUrl) {
  const fallbackName = `display-package-${Date.now()}.zip`;
  const triggerDirectDownload = (suggestedName = fallbackName) => {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = suggestedName;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return { mode: 'download', fileName: suggestedName };
  };

  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to download ZIP package');
      }

      const zipBlob = await response.blob();
      const fileName = readDownloadFileName(response, fallbackName);
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'ZIP package',
            accept: { 'application/zip': ['.zip'] }
          }
        ]
      });

      const writable = await handle.createWritable();
      await writable.write(zipBlob);
      await writable.close();
      return { mode: 'save-as', fileName };
    } catch (err) {
      if (err && err.name === 'AbortError') {
        throw err;
      }

      // Some browser/webview contexts block showSaveFilePicker after async work.
      // Fall back to direct download instead of failing the package flow.
      console.warn('Falling back to direct ZIP download:', err);
      return triggerDirectDownload();
    }
  }

  // Fallback for browsers/webviews that do not support showSaveFilePicker.
  return triggerDirectDownload();
}

function applyObjectChangesToXml() {
  if (selectedObjectIndex === null) {
    alert('Click an object in preview first.');
    return false;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlEditor.value, 'text/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    alert('XML parse error. Fix XML before applying object changes.');
    return false;
  }

  const nodes = getObjectNodes(doc);
  const node = nodes[selectedObjectIndex];
  if (!node) {
    alert('Selected object no longer exists.');
    selectedObjectIndex = null;
    clearObjectPanel();
    return false;
  }

  node.setAttribute('name', objName.value || node.getAttribute('name') || 'Object');
  node.setAttribute('left', String(Number(objLeft.value) || 0));
  node.setAttribute('top', String(Number(objTop.value) || 0));
  node.setAttribute('width', String(Math.max(1, Number(objWidth.value) || 1)));
  node.setAttribute('height', String(Math.max(1, Number(objHeight.value) || 1)));

  if (objBackColor.value.trim()) {
    node.setAttribute('backColor', objBackColor.value.trim());
  }
  if (objBorderColor.value.trim()) {
    node.setAttribute('borderColor', objBorderColor.value.trim());
  }

  let captionNode = Array.from(node.children).find((child) => child.tagName === 'caption');
  const hasNodeCaption = node.hasAttribute('caption');
  const nextCaption = objCaption.value || node.getAttribute('name') || node.tagName;
  const needsCaption = hasNodeCaption || objCaption.value.trim() || objTextColor.value.trim() || Number(objFontSize.value) > 0;

  if (hasNodeCaption) {
    node.setAttribute('caption', nextCaption);
  }

  if (!captionNode && needsCaption && !hasNodeCaption) {
    captionNode = doc.createElement('caption');
    node.appendChild(captionNode);
  }

  if (captionNode) {
    captionNode.setAttribute('caption', nextCaption);
    if (objTextColor.value.trim()) {
      captionNode.setAttribute('color', objTextColor.value.trim());
    }
    captionNode.setAttribute('fontSize', String(Math.max(1, Number(objFontSize.value) || 10)));
  }

  xmlEditor.value = serializeXmlDoc(doc);
  recordHistory(xmlEditor.value);
  return true;
}

async function loadDisplay(name) {
  const res = await fetch(`/api/displays/${encodeURIComponent(name)}`);
  if (!res.ok) {
    throw new Error('Failed to load selected display');
  }

  const data = await res.json();
  setEditorDisplay(data.name, data.xml);
  if (!usingUploadedList) {
    await refreshDisplays();
  } else {
    renderDisplays(currentDisplayRows);
  }
}

async function loadDefaultTemplate(name) {
  const data = await loadDefaultTemplateXml(name);
  setEditorTemplate(data.name, data.xml);
  await refreshDefaultTemplates();
}

function setEditorProjectScreen(project, folderName, screen, xml) {
  setActiveProjectScreen(project, folderName, screen.name);
  selectedDisplay = screen.name;
  selectedDefaultTemplate = '';
  selectedFiles = [screen.name];
  displayName.value = `${project.name} / ${folderName} / ${screen.name}`;
  xmlEditor.value = xml;
  resetHistory(xml);
  selectedObjectIndex = null;
  clearObjectPanel();

  const size = readSizeFromXml(xml);
  if (size.width) screenWidth.value = size.width;
  if (size.height) screenHeight.value = size.height;

  renderPreview();
}

async function openProjectScreen(projectId, folderName, screenName) {
  const project = getProjectById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const screen = findProjectScreen(project, folderName, screenName);
  if (!screen) {
    throw new Error('Screen not found');
  }

  setEditorProjectScreen(project, folderName, screen, screen.xml);
  renderProjectSidebar();
}

if (uploadInput) {
  uploadInput.addEventListener('change', async () => {
    const files = Array.from(uploadInput.files || [])
      .filter((file) => file.name.toLowerCase().endsWith('.xml'));

    if (!files.length) {
      alert('Choose one or more display XML files to upload.');
      return;
    }

    try {
      const uploadedRows = [];
      for (const file of files) {
        const xml = await readUploadedText(file);
        const row = validateDisplayXml(file.name, xml);
        await saveDisplayXml(file.name, xml);
        hiddenDisplayNames.delete(displayKey(file.name));
        uploadedRows.push(row);
      }

      usingUploadedList = true;
      renderDisplays(uploadedRows.sort((a, b) => a.lastModified.localeCompare(b.lastModified)));
      await loadDisplay(uploadedRows[0].name);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not upload the selected XML files.');
    } finally {
      uploadInput.value = '';
    }
  });
}

if (defaultUploadInput) {
  defaultUploadInput.addEventListener('change', async () => {
    const files = Array.from(defaultUploadInput.files || [])
      .filter((file) => file.name.toLowerCase().endsWith('.xml'));

    if (!files.length) {
      alert('Choose one or more default template XML files to upload.');
      return;
    }

    try {
      for (const file of files) {
        const xml = await readUploadedText(file);
        validateDisplayXml(file.name, xml);
        await saveDefaultTemplateXml(file.name, xml);
      }

      await refreshDefaultTemplates();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not upload default template XML files.');
    } finally {
      defaultUploadInput.value = '';
    }
  });
}

if (addDisplayBtn) {
  addDisplayBtn.addEventListener('click', () => {
    createDisplayFromTemplate().catch((err) => {
      console.error(err);
      alert(err.message || `Could not create a new page from ${TEMPLATE_DISPLAY_NAME}.`);
    });
  });
}

if (addFolderBtn) {
  addFolderBtn.addEventListener('click', async () => {
    const rawName = window.prompt('New folder name', 'New_Folder');
    if (rawName === null) {
      return;
    }

    const folderName = normalizeFolderName(rawName);
    if (!folderName) {
      alert('Enter a valid folder name.');
      return;
    }

    if (!folderNames.some((name) => name.toLowerCase() === folderName.toLowerCase())) {
      folderNames = [...folderNames, folderName];
    }

    selectedFolderName = folderName;
    selectedFolderIsCustom = true;

    try {
      await saveDisplayFolders();
      renderDisplays(currentDisplayRows);
    } catch (err) {
      console.error(err);
      alert('Could not save the folder.');
    }
  });
}

if (removeFolderBtn) {
  removeFolderBtn.addEventListener('click', async () => {
    if (!selectedFolderName) {
      alert('Select a folder first.');
      return;
    }

    const folderName = selectedFolderName;
    const displayFiles = currentDisplayRows.filter((file) => !isGlobalObjectFile(file));
    const autoFolderMap = buildAutoDisplayFolderMap(displayFiles);
    const filesInFolder = displayFiles.filter((file) =>
      String(resolveDisplayFolderName(file.name, autoFolderMap)).toLowerCase() === folderName.toLowerCase());

    const confirmed = confirm(
      `Delete folder ${folderName} and permanently delete ${filesInFolder.length} screen(s)? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    try {
      const failed = [];
      const deletedKeys = new Set();
      for (const file of filesInFolder) {
        try {
          await deleteDisplayXml(file.name, file.source);
          deletedKeys.add(displayKey(file.name));
        } catch (_err) {
          failed.push(file.name);
        }
      }

      // Remove the custom folder label itself if it was user-created.
      if (selectedFolderIsCustom) {
        folderNames = folderNames.filter((name) => name.toLowerCase() !== folderName.toLowerCase());
      }

      for (const key of Object.keys(folderAssignments)) {
        const assignedFolder = String(folderAssignments[key] || '').toLowerCase();
        if (assignedFolder === folderName.toLowerCase() || deletedKeys.has(key)) {
          delete folderAssignments[key];
        }
      }

      folderCollapsedNames.delete(folderName);
      if (selectedDisplay && deletedKeys.has(displayKey(selectedDisplay))) {
        clearSelectedDisplay();
      }

      selectedFolderName = '';
      selectedFolderIsCustom = false;
      await saveDisplayFolders();

      if (failed.length) {
        alert(`Folder deleted partially. Could not delete: ${failed.join(', ')}`);
      }

      usingUploadedList = false;
      await refreshDisplays();
    } catch (err) {
      console.error(err);
      alert('Could not remove folder.');
    }
  });
}

if (uploadDisplayBtn) {
  uploadDisplayBtn.addEventListener('click', () => {
    if (isDefaultMode()) {
      defaultUploadInput.click();
      return;
    }

    uploadInput.click();
  });
}

if (removeDisplayBtn) {
  removeDisplayBtn.addEventListener('click', async () => {
    const targetName = isDefaultMode() ? selectedDefaultTemplate : selectedDisplay;
    if (!targetName) {
      alert(isDefaultMode() ? 'Select a default template first.' : 'Select a display first.');
      return;
    }

    try {
      if (isDefaultMode()) {
        await removeDefaultTemplateByName(targetName);
      } else {
        await removeDisplayByName(targetName);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not remove XML file');
    }
  });
}

previewBtn.addEventListener('click', renderPreview);
if (addObjectBtn) {
  addObjectBtn.addEventListener('click', addButtonObject);
}
if (toggleSidebarBtn) {
  toggleSidebarBtn.addEventListener('click', () => {
    const collapsed = !mainGrid.classList.contains('sidebar-collapsed');
    setSidebarCollapsed(collapsed);
    if (xmlEditor.value.trim()) {
      renderPreview();
    }
  });
}

if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    const refreshPromise = isDefaultMode()
      ? refreshDefaultTemplates()
      : (usingUploadedList = false, refreshDisplays());

    refreshPromise.catch((err) => {
      console.error(err);
      alert(isDefaultMode() ? 'Could not refresh default templates' : 'Could not refresh display list');
    });
  });
}

if (showDisplaysBtn) {
  showDisplaysBtn.addEventListener('click', () => {
    setSidebarMode(SIDEBAR_MODE_DISPLAYS);
    refreshDisplays().catch(() => {});
  });
}

if (showDefaultsBtn) {
  showDefaultsBtn.addEventListener('click', () => {
    setSidebarMode(SIDEBAR_MODE_DEFAULTS);
    refreshDefaultTemplates().catch(() => {});
  });
}

if (newProjectBtn) {
  newProjectBtn.addEventListener('click', () => {
    showProjectCreatePanel();
  });
}

if (createProjectBtn) {
  createProjectBtn.addEventListener('click', () => {
    createNewProject(projectNameInput?.value || '').catch((err) => {
      console.error(err);
      alert(err.message || 'Could not create new project.');
    });
  });
}

if (cancelProjectBtn) {
  cancelProjectBtn.addEventListener('click', () => {
    hideProjectCreatePanel();
  });
}

if (sidebarNameConfirmBtn) {
  sidebarNameConfirmBtn.addEventListener('click', async () => {
    if (!sidebarNameInput || !sidebarNameSubmit) {
      hideSidebarNamePanel();
      return;
    }

    const shouldClose = await sidebarNameSubmit(sidebarNameInput.value);
    if (shouldClose !== false) {
      hideSidebarNamePanel();
    }
  });
}

if (sidebarNameCancelBtn) {
  sidebarNameCancelBtn.addEventListener('click', () => {
    hideSidebarNamePanel();
  });
}

if (sidebarNameInput) {
  sidebarNameInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sidebarNameConfirmBtn?.click();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      hideSidebarNamePanel();
    }
  });
}

if (projectNameInput) {
  projectNameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      createProjectBtn?.click();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      hideProjectCreatePanel();
    }
  });
}

if (seedDefaultsBtn) {
  seedDefaultsBtn.addEventListener('click', async () => {
    try {
      const files = currentDefaultRows.map((file) => file.name);
      if (!files.length) {
        alert('Upload default templates first.');
        return;
      }

      const data = await seedDefaultTemplates(files);
      alert(`Copied ${data.copied.length} default template page(s) into project edited pages.`);
      setSidebarMode(SIDEBAR_MODE_DISPLAYS);
      await refreshDisplays();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not copy defaults into project pages.');
    }
  });
}

applySizeBtn.addEventListener('click', async () => {
  const width = Number(screenWidth.value);
  const height = Number(screenHeight.value);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    alert('Enter valid width and height values');
    return;
  }

  if (!xmlEditor.value.trim()) {
    alert('Load XML first');
    return;
  }

  xmlEditor.value = resizeDisplayXml(xmlEditor.value, width, height);
  recordHistory(xmlEditor.value);
  renderPreview();

  if (!selectedDisplay) {
    return;
  }

  try {
    await saveDisplayXml(selectedDisplay, xmlEditor.value);
    updateCurrentDisplayRow(selectedDisplay, xmlEditor.value);
    if (usingUploadedList) {
      renderDisplays(currentDisplayRows);
    } else {
      await refreshDisplays();
    }
    alert('Size applied and saved.');
  } catch (err) {
    alert(err.message || 'Size applied, but save failed.');
  }
});

applyObjectBtn.addEventListener('click', () => {
  const changed = applyObjectChangesToXml();
  if (!changed) {
    return;
  }
  renderPreview();
});

objBackColorPicker.addEventListener('input', () => {
  objBackColor.value = objBackColorPicker.value;
  syncColorControl(objBackColor, objBackColorPicker, objBackColorSwatch);
});
objBorderColorPicker.addEventListener('input', () => {
  objBorderColor.value = objBorderColorPicker.value;
  syncColorControl(objBorderColor, objBorderColorPicker, objBorderColorSwatch);
});
objTextColorPicker.addEventListener('input', () => {
  objTextColor.value = objTextColorPicker.value;
  syncColorControl(objTextColor, objTextColorPicker, objTextColorSwatch);
});

objBackColor.addEventListener('input', () => syncColorControl(objBackColor, objBackColorPicker, objBackColorSwatch));
objBorderColor.addEventListener('input', () => syncColorControl(objBorderColor, objBorderColorPicker, objBorderColorSwatch));
objTextColor.addEventListener('input', () => syncColorControl(objTextColor, objTextColorPicker, objTextColorSwatch));

buildPackageBtn.addEventListener('click', async () => {
  try {
    const saved = await autoSaveCurrentDisplay();
    if (!saved) {
      return;
    }

    updatePackageSelection(currentDisplayRows);
    if (!selectedFiles.length) {
      alert('No edited page is selected for packaging. Open an edited page and try again.');
      return;
    }

    await buildImportPackage(selectedFiles, 'selected page');
  } catch (err) {
    console.error(err);
    alert('Could not save package ZIP. Please try again.');
  }
});

if (buildAllPackageBtn) {
  buildAllPackageBtn.addEventListener('click', async () => {
    try {
      const saved = await autoSaveCurrentDisplay();
      if (!saved) {
        return;
      }

      const allFiles = getAllEditedPackageFiles(currentDisplayRows);
      if (!allFiles.length) {
        alert('No edited files found for all-import package.');
        return;
      }

      await buildImportPackage(allFiles, 'all edited files', { packageMode: 'restore' });
    } catch (err) {
      console.error(err);
      alert('Could not save package ZIP. Please try again.');
    }
  });
}

socket.on('bridge-status', (status) => {
  setBridgeCard(status);
  renderProjectSidebar();
});

async function init() {
  if (!Number(screenWidth.value) || Number(screenWidth.value) <= 0) {
    screenWidth.value = DEFAULT_PREVIEW_WIDTH;
  }
  if (!Number(screenHeight.value) || Number(screenHeight.value) <= 0) {
    screenHeight.value = DEFAULT_PREVIEW_HEIGHT;
  }

  setProjectName(currentProjectName);
  normalizeProjectList();

  const restoredProject = getProjectById(activeProjectId) || projectList[0] || null;
  if (restoredProject) {
    setActiveProject(restoredProject);
  } else {
    setProjectName(currentProjectName);
  }

  const sidebarCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
  setSidebarCollapsed(sidebarCollapsed);

  const res = await fetch('/api/bridge/status');
  const status = await res.json();
  setBridgeCard(status);
  renderProjectSidebar();
  renderPreview();
}

window.addEventListener('resize', () => {
  if (xmlEditor.value.trim()) {
    renderPreview();
  }
});

document.addEventListener('keydown', (event) => {
  const active = document.activeElement;
  if (isEditableTarget(active)) {
    return;
  }

  const key = String(event.key || '');
  const ctrlOrCmd = event.ctrlKey || event.metaKey;
  if (ctrlOrCmd && key.toLowerCase() === 'z') {
    event.preventDefault();
    if (event.shiftKey) {
      redoHistory();
    } else {
      undoHistory();
    }
    return;
  }

  if (ctrlOrCmd && key.toLowerCase() === 'y') {
    event.preventDefault();
    redoHistory();
    return;
  }

  if (ctrlOrCmd && key.toLowerCase() === 'c') {
    if (selectedObjectIndex !== null) {
      event.preventDefault();
      copySelectedObject();
    }
    return;
  }

  if (ctrlOrCmd && key.toLowerCase() === 'v') {
    if (copiedObjectXml) {
      event.preventDefault();
      pasteCopiedObject();
    }
    return;
  }

  if (key === 'Delete' || key === 'Backspace') {
    if (selectedObjectIndex !== null) {
      event.preventDefault();
      deleteSelectedObject();
    }
    return;
  }

  if (selectedObjectIndex === null) {
    return;
  }

  const step = event.shiftKey ? 10 : 1;
  if (key === 'ArrowLeft') {
    event.preventDefault();
    nudgeSelectedObject(-step, 0);
  } else if (key === 'ArrowRight') {
    event.preventDefault();
    nudgeSelectedObject(step, 0);
  } else if (key === 'ArrowUp') {
    event.preventDefault();
    nudgeSelectedObject(0, -step);
  } else if (key === 'ArrowDown') {
    event.preventDefault();
    nudgeSelectedObject(0, step);
  }
});

init().catch((err) => {
  console.error(err);
  bridgeStatus.querySelector('span:last-child').textContent = 'Bridge unavailable';
});
