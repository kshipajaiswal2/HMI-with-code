const socket = io();

const bridgeStatus = document.getElementById('bridgeStatus');
const displaysList = document.getElementById('displaysList');
const sidebarTitle = document.querySelector('.displays-header h2');
const exportsCard = document.querySelector('.exports-card');
const uploadInput = document.getElementById('uploadInput');
const defaultUploadInput = document.getElementById('defaultUploadInput');
const uploadFolderInput = document.getElementById('uploadFolderInput');
const projectTagsCsvInput = document.getElementById('projectTagsCsvInput');
const projectParametersCsvInput = document.getElementById('projectParametersCsvInput');
const projectIoListInput = document.getElementById('projectIoListInput');
const importFolderBtn = document.getElementById('importFolderBtn');
const newProjectBtn = document.getElementById('newProjectBtn');
const projectCreatePanel = document.getElementById('projectCreatePanel');
const projectNameInput = document.getElementById('projectNameInput');
const createProjectBtn = document.getElementById('createProjectBtn');
const cancelProjectBtn = document.getElementById('cancelProjectBtn');
const sidebarNamePanel = document.getElementById('sidebarNamePanel');
const sidebarNameLabel = document.getElementById('sidebarNameLabel');
const sidebarNameInput = document.getElementById('sidebarNameInput');
const sidebarScreenFields = document.getElementById('sidebarScreenFields');
const sidebarPageNoInput = document.getElementById('sidebarPageNoInput');
const sidebarScreenNameInput = document.getElementById('sidebarScreenNameInput');
const sidebarScreenPreview = document.getElementById('sidebarScreenPreview');
const sidebarNameConfirmBtn = document.getElementById('sidebarNameConfirmBtn');
const sidebarNameCancelBtn = document.getElementById('sidebarNameCancelBtn');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const mainGrid = document.getElementById('mainGrid');
const editorLayout = document.getElementById('editorLayout');
const toggleDockBtn = document.getElementById('toggleDockBtn');

const displayName = document.getElementById('displayName');
const screenSizePreset = document.getElementById('screenSizePreset');
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
const workspaceDockTabs = document.getElementById('workspaceDockTabs');
const workspaceDockTabButtons = Array.from(document.querySelectorAll('[data-dock-tab]'));
const workspaceDockPanels = Array.from(document.querySelectorAll('[data-dock-panel]'));

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
const popupPlannerDetails = document.getElementById('popupPlannerDetails');
const addPopupPlanRowBtn = document.getElementById('addPopupPlanRowBtn');
const popupPlanBody = document.getElementById('popupPlanBody');
const generatePopupsBtn = document.getElementById('generatePopupsBtn');
const popupGenerateActions = document.getElementById('popupGenerateActions');

let previewResizeObserver = null;

let selectedDisplay = '';
let selectedFiles = [];
let selectedObjectIndex = null;
let activeDockTab = 'properties';
let usingUploadedList = false;
let currentDisplayRows = [];
let currentDefaultRows = [];
let selectedDefaultTemplate = '';
let selectedFolderName = '';
let selectedFolderIsCustom = false;
let hiddenDisplayNames = new Set();
let draggedDisplayKey = '';
let sidebarNameSubmit = null;
let sidebarNameMode = 'single';
let folderNames = [];
let folderAssignments = {};
let folderCollapsedNames = new Set();
let previewImageNonce = Date.now();
let historyPast = [];
let historyFuture = [];
let applyingHistory = false;
let copiedObjectXml = '';
let copiedObjectName = '';
let copiedObjectGroupId = '';
let copiedPasteCount = 0;
let plannerSelectedTemplateId = '';
let plannerTargetScreenKey = '';
let generatedPopupDrafts = [];

const TEMPLATE_DISPLAY_NAME = 'Template.xml';
const DEFAULT_PREVIEW_WIDTH = 1024;
const DEFAULT_PREVIEW_HEIGHT = 768;
const SIDEBAR_STORAGE_KEY = 'displayXmlBridge.sidebarCollapsed';
const DOCK_STORAGE_KEY = 'displayXmlBridge.toolsDockCollapsed';
const SIDEBAR_MODE_STORAGE_KEY = 'displayXmlBridge.sidebarMode';
const PROJECT_NAME_STORAGE_KEY = 'displayXmlBridge.projectName';
const PROJECTS_STORAGE_KEY = 'displayXmlBridge.projects';
const ACTIVE_PROJECT_STORAGE_KEY = 'displayXmlBridge.activeProjectId';
const SIDEBAR_MODE_DISPLAYS = 'displays';
const SIDEBAR_MODE_DEFAULTS = 'defaults';
const UNGROUPED_FOLDER_NAME = 'Ungrouped';
const HISTORY_LIMIT = 120;
const POPUP_GROUP_PREFIX = 'WB_POPUP';
const SCREEN_SIZE_PRESETS = {
  '800x600': { width: 800, height: 600 },
  '1280x800': { width: 1280, height: 800 },
  '1024x768': { width: 1024, height: 768 }
};
let sidebarMode = SIDEBAR_MODE_DISPLAYS;
let currentProjectName = normalizeProjectName(localStorage.getItem(PROJECT_NAME_STORAGE_KEY) || 'Untitled Project');
let projectList = loadProjectList();
let activeProjectId = localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY) || '';
let activeProjectFolder = '';
let activeProjectScreen = '';
let activeProjectCsvKey = '';
let activeIoListFileKey = '';
let pendingCsvUpload = null;
let pendingIoListUpload = null;
let activeProjectKey = '';
let currentPreviewIoProject = null;

function displayKey(name) {
  return String(name || '').toLowerCase();
}

const IO_LIST_SCREEN_FILE = '303_IO_List.xml';
const CYCLE_TIME_SCREEN_FILE = '304_Cycle_Time.xml';

const EXCLUDED_PROJECT_SCREENS = new Set([
  displayKey('IO_List.xml'),
  displayKey('303_IO_Card.xml'),
  displayKey('301_PLC_IO_List.xml'),
  displayKey('402_IO_List.xml'),
  displayKey('105_Cycle_Time.xml'),
  displayKey('402_Cycletime.xml')
]);

function isExcludedProjectScreen(name) {
  return EXCLUDED_PROJECT_SCREENS.has(displayKey(name));
}

function getScreenNumberPrefix(screenName) {
  const match = String(screenName || '').match(/^(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function getFolderNumberPrefix(folderName) {
  const match = String(folderName || '').match(/^(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function sortFolderScreens(screens) {
  const list = Array.isArray(screens) ? [...screens] : [];
  list.sort((a, b) => {
    const numDiff = getScreenNumberPrefix(a?.name) - getScreenNumberPrefix(b?.name);
    if (numDiff !== 0) {
      return numDiff;
    }
    return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, { numeric: true, sensitivity: 'base' });
  });
  return list;
}

function sortProjectFolders(folders) {
  const list = Array.isArray(folders) ? [...folders] : [];
  list.sort((a, b) => {
    const numDiff = getFolderNumberPrefix(a?.name) - getFolderNumberPrefix(b?.name);
    if (numDiff !== 0) {
      return numDiff;
    }
    return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, { numeric: true, sensitivity: 'base' });
  });
  for (const folder of list) {
    folder.screens = sortFolderScreens(folder.screens);
  }
  return list;
}

function folderScreensOrderKey(folder) {
  return `${folder?.name || ''}::${(folder?.screens || []).map((screen) => screen?.name || '').join('|')}`;
}

function projectFoldersOrderKey(folders) {
  return (folders || []).map((folder) => folderScreensOrderKey(folder)).join('||');
}

function findOrCreateManualOperationFolder(project) {
  let folder = (project.folders || []).find((item) => (item.screens || []).some((screen) => {
    const page = String(screen.name || '').match(/^(\d{3})/);
    return page && Number(page[1]) >= 300 && Number(page[1]) < 400;
  }));

  if (!folder) {
    folder = (project.folders || []).find((item) => displayKey(item.name).includes('manual'));
  }

  if (!folder) {
    folder = {
      name: '300_Manual_Operation',
      collapsed: false,
      screens: []
    };
    project.folders = Array.isArray(project.folders) ? project.folders : [];
    project.folders.push(folder);
  }

  return folder;
}

function findScreenSizePreset(width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h)) {
    return '';
  }

  for (const [key, preset] of Object.entries(SCREEN_SIZE_PRESETS)) {
    if (preset.width === w && preset.height === h) {
      return key;
    }
  }

  return '';
}

function syncScreenPresetFromInputs() {
  if (!screenSizePreset) {
    return;
  }

  screenSizePreset.value = findScreenSizePreset(screenWidth?.value, screenHeight?.value);
}

function applyScreenPreset(presetKey) {
  const preset = SCREEN_SIZE_PRESETS[String(presetKey || '')];
  if (!preset) {
    return;
  }

  screenWidth.value = String(preset.width);
  screenHeight.value = String(preset.height);
  syncScreenPresetFromInputs();
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

function createProjectCsvKey(projectId, kind, fileId) {
  return [projectId, kind, fileId].map((part) => String(part || '')).join('::');
}

function parseProjectCsvKey(key) {
  const parts = String(key || '').split('::');
  if (parts.length !== 3) {
    return null;
  }

  return {
    projectId: parts[0],
    kind: parts[1],
    fileId: parts[2]
  };
}

function getProjectCsvFiles(project, kind) {
  if (!project) {
    return [];
  }

  ensureProjectCsvData(project);
  return kind === 'parameters' ? project.parametersFiles : project.tagsFiles;
}

function getProjectCsvByKey(key) {
  const parsed = parseProjectCsvKey(key);
  if (!parsed) {
    return null;
  }

  const project = getProjectById(parsed.projectId);
  if (!project) {
    return null;
  }

  const files = getProjectCsvFiles(project, parsed.kind);
  const file = files.find((item) => String(item.id) === String(parsed.fileId));
  if (!file) {
    return null;
  }

  return { project, kind: parsed.kind, file };
}

function ensureProjectCsvData(project) {
  if (!project || typeof project !== 'object') {
    return;
  }

  project.tagsFiles = Array.isArray(project.tagsFiles) ? project.tagsFiles : [];
  project.parametersFiles = Array.isArray(project.parametersFiles) ? project.parametersFiles : [];
  project.ioListFiles = Array.isArray(project.ioListFiles) ? project.ioListFiles : [];
  project.tagsCollapsed = Boolean(project.tagsCollapsed);
  project.parametersCollapsed = Boolean(project.parametersCollapsed);
  project.ioListCollapsed = Boolean(project.ioListCollapsed);
  project.ioListPreviewPage = Math.max(1, Number(project.ioListPreviewPage) || 1);
  project.ioListPreviewZone = String(project.ioListPreviewZone || '');
  if (project.ioTagsParsed === undefined) {
    project.ioTagsParsed = null;
  }
  if (project.ioListMeta === undefined) {
    project.ioListMeta = null;
  }
  if (project.ioListPreviewParameterFile === undefined) {
    project.ioListPreviewParameterFile = '';
  }
  if (project.ioListSheets === undefined) {
    project.ioListSheets = Array.isArray(project.ioListMeta?.sourceSheets)
      ? project.ioListMeta.sourceSheets
      : [];
  }

  for (const list of [project.tagsFiles, project.parametersFiles, project.ioListFiles]) {
    for (const file of list) {
      file.id = String(file.id || `csv-${Date.now()}-${Math.random().toString(16).slice(2)}`);
      file.name = String(file.name || 'data.csv');
      file.content = String(file.content || '');
      file.lastModified = String(file.lastModified || new Date().toISOString());
      file.sizeBytes = Number.isFinite(Number(file.sizeBytes))
        ? Number(file.sizeBytes)
        : new Blob([file.content]).size;
    }
  }
}

function saveActiveProjectCsvFromEditor() {
  if (!activeProjectCsvKey) {
    return true;
  }

  const record = getProjectCsvByKey(activeProjectCsvKey);
  if (!record) {
    activeProjectCsvKey = '';
    return true;
  }

  record.file.content = xmlEditor.value;
  record.file.sizeBytes = new Blob([record.file.content]).size;
  record.file.lastModified = new Date().toISOString();
  if (record.kind === 'tags') {
    record.project.ioTagsParsed = null;
  }
  saveProjectList();
  renderProjectSidebar();
  return true;
}

async function importProjectCsvFiles(projectId, kind, fileList) {
  const project = getProjectById(projectId);
  if (!project || !fileList?.length) {
    return;
  }

  ensureProjectCsvData(project);
  const target = getProjectCsvFiles(project, kind);

  for (const sourceFile of fileList) {
    const content = await readUploadedText(sourceFile);
    let name = baseFileName(sourceFile.name) || (kind === 'parameters' ? 'Parameters.par' : 'data.csv');
    const lowerName = name.toLowerCase();
    if (kind === 'parameters') {
      if (!lowerName.endsWith('.par') && !lowerName.endsWith('.csv')) {
        name = `${name}.par`;
      }
    } else if (!lowerName.endsWith('.csv')) {
      name = `${name}.csv`;
    }

    const existingIndex = target.findIndex((item) => displayKey(item.name) === displayKey(name));
    const entry = {
      id: `csv-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      content,
      sizeBytes: new Blob([content]).size,
      lastModified: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      target[existingIndex] = {
        ...target[existingIndex],
        ...entry,
        id: target[existingIndex].id
      };
    } else {
      target.push(entry);
    }
  }

  if (kind === 'tags') {
    project.ioTagsParsed = null;
  }

  saveProjectList();
  renderProjectSidebar();
}

function removeProjectCsvFile(projectId, kind, fileId) {
  const project = getProjectById(projectId);
  if (!project) {
    return;
  }

  const target = getProjectCsvFiles(project, kind);
  const nextFiles = target.filter((item) => String(item.id) !== String(fileId));
  if (kind === 'parameters') {
    project.parametersFiles = nextFiles;
  } else {
    project.tagsFiles = nextFiles;
    project.ioTagsParsed = null;
  }

  if (activeProjectCsvKey === createProjectCsvKey(projectId, kind, fileId)) {
    activeProjectCsvKey = '';
    displayName.value = 'None';
    xmlEditor.value = '';
    resetHistory('');
    previewPane.innerHTML = '';
  }

  saveProjectList();
  renderProjectSidebar();
}

function openProjectCsvFile(project, kind, file) {
  if (!project || !file) {
    return;
  }

  const nextKey = createProjectCsvKey(project.id, kind, file.id);
  if (activeProjectCsvKey === nextKey) {
    updateProjectSidebarSelection();
    return;
  }

  saveActiveProjectCsvFromEditor();
  saveActiveProjectIoListFromEditor();

  activeProjectKey = '';
  activeProjectFolder = '';
  activeProjectScreen = '';
  selectedDisplay = '';
  selectedDefaultTemplate = '';
  selectedFiles = [];
  activeProjectCsvKey = nextKey;
  activeIoListFileKey = '';

  setActiveProject(project);
  const sectionLabel = kind === 'parameters' ? 'Parameters' : 'Tags';
  displayName.value = `${project.name} / ${sectionLabel} / ${file.name}`;
  xmlEditor.value = file.content;
  resetHistory(file.content);
  selectedObjectIndex = null;
  clearObjectPanel();
  previewPane.innerHTML = '';
  setWorkspaceDockTab('xml');
  updateProjectSidebarSelection();

  if (kind === 'parameters' && /\.par$/i.test(String(file.name || ''))) {
    project.ioListPreviewParameterFile = String(file.name || '').replace(/\.par$/i, '');
    renderParameterFilePreview(project, file);
  } else if (kind === 'tags') {
    renderTagsCsvPreview(project, file);
  }
}

function getProjectParameterFile(project, fileName) {
  if (!project) {
    return null;
  }
  ensureProjectCsvData(project);
  const targetKey = displayKey(String(fileName || '').replace(/\.par$/i, ''));
  return (project.parametersFiles || []).find((file) => {
    const base = displayKey(String(file.name || '').replace(/\.par$/i, ''));
    return base === targetKey;
  }) || null;
}

function getActiveParameterFile(project) {
  if (!project) {
    return null;
  }

  const preferredName = String(project.ioListPreviewParameterFile || 'PLC DI List 01').trim();
  const preferred = getProjectParameterFile(project, preferredName);
  if (preferred?.content?.trim()) {
    return preferred;
  }

  return (project.parametersFiles || []).find((file) => /\.par$/i.test(file.name) && String(file.content || '').trim())
    || null;
}

function getActiveParameterBindings(project) {
  if (!project || !globalThis.IoTags) {
    return null;
  }

  const file = getActiveParameterFile(project);
  if (!file?.content) {
    return null;
  }

  return globalThis.IoTags.parseParameterFile(file.content).bindings;
}

function renderParameterFilePreview(project, file) {
  if (!previewPane || !project || !file || !globalThis.IoTags) {
    return;
  }

  const parsed = globalThis.IoTags.parseParameterFile(file.content);
  const tagsParsed = getProjectIoTagsParsed(project);
  const rows = globalThis.IoTags.formatParameterPreviewNotes(parsed.bindings, tagsParsed);

  const frame = document.createElement('div');
  frame.className = 'preview-frame parameter-preview-frame';

  const heading = document.createElement('h4');
  heading.className = 'parameter-preview-title';
  heading.textContent = `Parameter preview: ${file.name}`;
  frame.appendChild(heading);

  const intro = document.createElement('p');
  intro.className = 'parameter-preview-intro';
  intro.textContent = 'FactoryTalk parameter bindings (#slot → tag) with live preview values from your Tags CSV / IO list.';
  frame.appendChild(intro);

  const toolbar = document.createElement('div');
  toolbar.className = 'parameter-preview-toolbar';

  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className = 'parameter-export-btn';
  exportBtn.textContent = 'Export .par';
  exportBtn.title = `Download ${file.name} for FactoryTalk import`;
  exportBtn.addEventListener('click', () => {
    try {
      exportProjectParameterFile(project, file);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not export parameter file.');
    }
  });
  toolbar.appendChild(exportBtn);

  const exportAllBtn = document.createElement('button');
  exportAllBtn.type = 'button';
  exportAllBtn.className = 'parameter-export-btn secondary';
  exportAllBtn.textContent = 'Export All';
  exportAllBtn.title = 'Download all parameter files in this project';
  exportAllBtn.addEventListener('click', async () => {
    try {
      await exportAllProjectParameterFiles(project);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not export parameter files.');
    }
  });
  toolbar.appendChild(exportAllBtn);
  frame.appendChild(toolbar);

  const table = document.createElement('table');
  table.className = 'parameter-preview-table';
  table.innerHTML = '<thead><tr><th>Slot</th><th>Tag binding</th><th>Preview value</th></tr></thead>';
  const tbody = document.createElement('tbody');

  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><code>${row.slot}</code></td><td><code>${row.tag}</code></td><td>${row.value}</td>`;
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  frame.appendChild(table);
  previewPane.innerHTML = '';
  previewPane.appendChild(frame);
}

function renderTagsCsvPreview(project, file) {
  if (!previewPane || !project || !file) {
    return;
  }

  const parsed = globalThis.IoTags?.parseIoListText?.(file.content) || { folders: [], tags: [] };
  const tagCount = parsed.tags?.length ?? 0;
  const folderCount = parsed.folders?.length ?? 0;

  const frame = document.createElement('div');
  frame.className = 'preview-frame parameter-preview-frame';

  const heading = document.createElement('h4');
  heading.className = 'parameter-preview-title';
  heading.textContent = `Tags CSV: ${file.name}`;
  frame.appendChild(heading);

  const intro = document.createElement('p');
  intro.className = 'parameter-preview-intro';
  intro.textContent = tagCount
    ? `${folderCount} folders, ${tagCount} tags — FactoryTalk import format. Download and import in FactoryTalk Tag Browser.`
    : 'FactoryTalk Tags CSV file. Download and import in FactoryTalk Tag Browser.';
  frame.appendChild(intro);

  const toolbar = document.createElement('div');
  toolbar.className = 'parameter-preview-toolbar';

  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className = 'parameter-export-btn';
  exportBtn.textContent = 'Download Tags.CSV';
  exportBtn.title = `Download ${file.name} for FactoryTalk tag import`;
  exportBtn.addEventListener('click', () => {
    try {
      exportProjectTagsCsvFile(project, file);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not export Tags CSV.');
    }
  });
  toolbar.appendChild(exportBtn);
  frame.appendChild(toolbar);

  previewPane.innerHTML = '';
  previewPane.appendChild(frame);
}

function downloadTextFile(content, fileName, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([String(content || '')], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportProjectParameterFile(project, file) {
  if (!project || !file) {
    return;
  }

  if (activeProjectCsvKey === createProjectCsvKey(project.id, 'parameters', file.id)) {
    saveActiveProjectCsvFromEditor();
    file = (project.parametersFiles || []).find((item) => String(item.id) === String(file.id)) || file;
  }

  const fileName = /\.par$/i.test(String(file.name || ''))
    ? String(file.name)
    : `${String(file.name || 'Parameters')}.par`;

  if (!String(file.content || '').trim()) {
    throw new Error(`${fileName} is empty.`);
  }

  downloadTextFile(file.content, fileName);
}

function exportProjectTagsCsvFile(project, file) {
  if (!project || !file) {
    return;
  }

  if (activeProjectCsvKey === createProjectCsvKey(project.id, 'tags', file.id)) {
    saveActiveProjectCsvFromEditor();
    file = (project.tagsFiles || []).find((item) => String(item.id) === String(file.id)) || file;
  }

  let fileName = String(file.name || `${project.name}-Tags.CSV`).trim();
  if (!/\.csv$/i.test(fileName)) {
    fileName = `${fileName}.CSV`;
  } else if (!fileName.endsWith('.CSV')) {
    fileName = fileName.replace(/\.csv$/i, '.CSV');
  }

  if (!String(file.content || '').trim()) {
    throw new Error(`${fileName} is empty. Upload the Master Sheet under IO List first.`);
  }

  downloadTextFile(file.content, fileName);
}

async function exportAllProjectTagsCsvFiles(project) {
  if (!project) {
    return;
  }

  ensureProjectCsvData(project);
  if (activeProjectCsvKey?.includes('::tags::')) {
    saveActiveProjectCsvFromEditor();
  }

  const files = (project.tagsFiles || []).filter((file) => String(file.content || '').trim());
  if (!files.length) {
    throw new Error('No Tags CSV to export. Upload the Master Sheet under IO List → + first.');
  }

  for (let index = 0; index < files.length; index += 1) {
    exportProjectTagsCsvFile(project, files[index]);
    if (index < files.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}

async function exportAllProjectParameterFiles(project) {
  if (!project) {
    return;
  }

  ensureProjectCsvData(project);
  if (activeProjectCsvKey?.includes('::parameters::')) {
    saveActiveProjectCsvFromEditor();
  }

  const files = (project.parametersFiles || []).filter((file) => String(file.content || '').trim());
  if (!files.length) {
    throw new Error('No parameter files to export. Add files under Parameters first.');
  }

  for (let index = 0; index < files.length; index += 1) {
    exportProjectParameterFile(project, files[index]);
    if (index < files.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}

async function fetchDefaultParameterTemplate(page = 1) {
  const pageSuffix = String(Math.max(1, Number(page) || 1)).padStart(2, '0');
  const response = await fetch(`/templates/PLC%20DI%20List%20${pageSuffix}.par`);
  if (!response.ok) {
    throw new Error(`Could not load the PLC DI List ${pageSuffix}.par reference template.`);
  }
  return response.text();
}

function nextProjectParameterFileName(project, prefix = 'PLC DI List') {
  ensureProjectCsvData(project);
  const existing = new Set((project.parametersFiles || []).map((file) => displayKey(file.name)));
  for (let page = 1; page <= 99; page += 1) {
    const suffix = String(page).padStart(2, '0');
    const candidate = `${prefix} ${suffix}.par`;
    if (!existing.has(displayKey(candidate))) {
      return candidate;
    }
  }
  return `${prefix} ${Date.now()}.par`;
}

async function addProjectParameterFile(projectId) {
  const project = getProjectById(projectId);
  if (!project) {
    throw new Error('Project not found.');
  }

  ensureProjectCsvData(project);
  let fileName = nextProjectParameterFileName(project);
  let content = '';

  const pageMatch = fileName.match(/(\d{2})\.par$/i);
  const page = pageMatch ? Math.max(1, Number(pageMatch[1]) || 1) : 1;

  try {
    content = await fetchDefaultParameterTemplate(page);
    const pageSuffix = String(page).padStart(2, '0');
    fileName = `PLC DI List ${pageSuffix}.par`;
  } catch (templateErr) {
    if (globalThis.IoTags?.buildDefaultParameterFile) {
      const built = globalThis.IoTags.buildDefaultParameterFile({ page });
      fileName = built.name;
      content = built.content;
    } else {
      throw templateErr;
    }
  }

  const existingIndex = project.parametersFiles.findIndex((item) => displayKey(item.name) === displayKey(fileName));
  const entry = {
    id: `csv-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: fileName,
    content,
    sizeBytes: new Blob([content]).size,
    lastModified: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    project.parametersFiles[existingIndex] = {
      ...project.parametersFiles[existingIndex],
      ...entry,
      id: project.parametersFiles[existingIndex].id
    };
  } else {
    project.parametersFiles.push(entry);
  }

  if (!project.ioListPreviewParameterFile) {
    project.ioListPreviewParameterFile = fileName.replace(/\.par$/i, '');
  }

  project.parametersCollapsed = false;
  saveProjectList();
  renderProjectSidebar();
  openProjectCsvFile(project, 'parameters', entry);
  return entry;
}

function upsertGeneratedParameterFiles(project, parsed, zone = 'Packing') {
  if (!project || !parsed || !globalThis.IoTags) {
    return [];
  }

  ensureProjectCsvData(project);
  const builtFiles = globalThis.IoTags.buildIoListParameterFiles(parsed, { zone, maxPages: 6 });
  const upserted = [];

  for (const built of builtFiles) {
    const existingIndex = project.parametersFiles.findIndex((item) => displayKey(item.name) === displayKey(built.name));
    const entry = {
      id: `csv-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: built.name,
      content: built.content,
      sizeBytes: new Blob([built.content]).size,
      lastModified: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      project.parametersFiles[existingIndex] = {
        ...project.parametersFiles[existingIndex],
        ...entry,
        id: project.parametersFiles[existingIndex].id
      };
      upserted.push(project.parametersFiles[existingIndex]);
    } else {
      project.parametersFiles.push(entry);
      upserted.push(entry);
    }
  }

  if (!project.ioListPreviewParameterFile && upserted[0]) {
    project.ioListPreviewParameterFile = String(upserted[0].name || '').replace(/\.par$/i, '');
  }

  return upserted;
}

function queueProjectCsvUpload(projectId, kind) {
  pendingCsvUpload = { projectId, kind };
  const input = kind === 'parameters' ? projectParametersCsvInput : projectTagsCsvInput;
  if (!input) {
    return;
  }

  input.value = '';
  input.click();
}

function getProjectGeneratedTagsFile(project) {
  if (!project) {
    return null;
  }

  ensureProjectCsvData(project);
  const generatedName = `${project.name}-Tags.CSV`;
  return project.tagsFiles.find((file) => displayKey(file.name) === displayKey(generatedName)) || null;
}

function getProjectPrimaryTagsFile(project) {
  if (!project) {
    return null;
  }

  ensureProjectCsvData(project);
  const generated = getProjectGeneratedTagsFile(project);
  if (generated?.content?.trim()) {
    return generated;
  }

  const tagsCandidates = project.tagsFiles.filter((file) => /tags\.csv$/i.test(file.name));
  if (project.ioListMeta || project.ioListFiles?.length) {
    const populated = tagsCandidates.filter((file) => String(file.content || '').trim());
    if (populated.length) {
      return populated.sort((a, b) => (Number(b.sizeBytes) || 0) - (Number(a.sizeBytes) || 0))[0];
    }
  }

  return tagsCandidates[0] || project.tagsFiles[0] || null;
}

function findProjectScreenByFileName(project, screenFileName) {
  const targetKey = displayKey(screenFileName);
  for (const folder of project?.folders || []) {
    const screen = (folder.screens || []).find((item) => displayKey(item.name) === targetKey);
    if (screen) {
      return { folder, screen };
    }
  }

  return null;
}

function isIoListPreviewScreenName(screenName) {
  const key = displayKey(screenName);
  return key === displayKey(IO_LIST_SCREEN_FILE) || key === displayKey('410_PLC IO List.xml');
}

function isIoListPreviewScreenActive() {
  if (activeProjectKey) {
    const record = getProjectScreenByKey(activeProjectKey);
    if (record?.screen?.name) {
      return isIoListPreviewScreenName(record.screen.name);
    }
  }

  return isIoListPreviewScreenName(displayName.value.split('/').pop()?.trim() || '');
}

function getIoPreviewStatus(project) {
  if (!project) {
    return { ready: false, reason: 'Select the project that received the IO list upload.' };
  }
  if (!globalThis.IoTags) {
    return { ready: false, reason: 'IO preview support failed to load. Hard refresh the page (Ctrl+Shift+R).' };
  }

  const tagsFile = getProjectPrimaryTagsFile(project);
  if (!tagsFile?.content?.trim()) {
    return { ready: false, reason: 'No Tags CSV found. Upload the Master Sheet under IO List → +.' };
  }

  const previewMap = getProjectIoPreviewMap(project);
  const sample = previewMap.get(101);
  if (!sample) {
    return {
      ready: false,
      reason: 'Tags CSV is loaded but IO preview mapping is empty. Re-upload the Master Sheet Excel file.'
    };
  }

  return { ready: true, sample, tagsFile };
}

function adaptIoListTemplateXml(xml) {
  return String(xml || '')
    .replace(/display="402_IO_List"/g, 'display="303_IO_List"')
    .replace(/display="102_Cycletime"/g, 'display="304_Cycle_Time"')
    .replace(/display="402_Cycletime"/g, 'display="304_Cycle_Time"');
}

function adaptCycleTimeTemplateXml(xml) {
  return String(xml || '')
    .replace(/display="402_IO_List"/g, 'display="303_IO_List"')
    .replace(/display="102_Cycletime"/g, 'display="304_Cycle_Time"')
    .replace(/display="402_Cycletime"/g, 'display="304_Cycle_Time"');
}

function isCycleTimeScreenName(screenName) {
  const key = displayKey(screenName);
  return key === displayKey(CYCLE_TIME_SCREEN_FILE)
    || key === displayKey('105_Cycle_Time.xml')
    || key === displayKey('402_Cycletime.xml');
}

function ioListScreenUsesCurrentTemplate(xml) {
  return String(xml || '').includes('name="Group17"');
}

function cycleTimeScreenUsesCurrentTemplate(xml) {
  return String(xml || '').includes('name="Group18"');
}

async function syncProjectCycleTimeScreenFromTemplate(project, match) {
  if (!match?.screen) {
    return false;
  }

  try {
    const template = await loadDefaultTemplateXml(CYCLE_TIME_SCREEN_FILE);
    const adapted = adaptCycleTimeTemplateXml(template.xml);
    match.screen.xml = adapted;
    match.screen.sizeBytes = new Blob([adapted]).size;
    match.screen.lastModified = new Date().toISOString();
    const meta = readSizeFromXml(adapted);
    match.screen.width = meta.width;
    match.screen.height = meta.height;
    saveProjectList();
    return true;
  } catch (err) {
    console.warn('Could not refresh cycle time template', err);
    return false;
  }
}

async function syncProjectIoListScreenFromTemplate(project, match) {
  if (!match?.screen) {
    return false;
  }

  try {
    const template = await loadDefaultTemplateXml(IO_LIST_SCREEN_FILE);
    const adapted = adaptIoListTemplateXml(template.xml);
    match.screen.xml = adapted;
    match.screen.sizeBytes = new Blob([adapted]).size;
    match.screen.lastModified = new Date().toISOString();
    const meta = readSizeFromXml(adapted);
    match.screen.width = meta.width;
    match.screen.height = meta.height;
    saveProjectList();
    return true;
  } catch (err) {
    console.warn('Could not refresh IO list template', err);
    return false;
  }
}

async function ensureProjectIoListScreen(project) {
  const existing = findProjectScreenByFileName(project, IO_LIST_SCREEN_FILE);
  if (existing) {
    return existing;
  }

  const legacy = findProjectScreenByFileName(project, '402_IO_List.xml');
  if (legacy) {
    legacy.screen.name = IO_LIST_SCREEN_FILE;
    legacy.screen.xml = String(legacy.screen.xml || '').replace(/display="402_IO_List"/g, 'display="303_IO_List"');
    saveProjectList();
    renderProjectSidebar();
    return legacy;
  }

  const template = await loadDefaultTemplateXml(IO_LIST_SCREEN_FILE);
  const folder = findOrCreateManualOperationFolder(project);

  const screen = screenMetaFromXml(IO_LIST_SCREEN_FILE, adaptIoListTemplateXml(template.xml));
  folder.screens = Array.isArray(folder.screens) ? folder.screens : [];
  folder.screens.push(screen);
  saveProjectList();
  renderProjectSidebar();
  return { folder, screen };
}

async function openProjectIoListPreviewScreen(project) {
  let match = findProjectScreenByFileName(project, IO_LIST_SCREEN_FILE);
  if (!match) {
    match = await ensureProjectIoListScreen(project);
  }
  if (!match) {
    return false;
  }

  if (!ioListScreenUsesCurrentTemplate(match.screen.xml)) {
    await syncProjectIoListScreenFromTemplate(project, match);
  }

  await openProjectScreen(project.id, match.folder.name, match.screen.name, { skipSave: true });
  return true;
}

function attachIoListMeta(parsed, project) {
  const next = parsed && typeof parsed === 'object'
    ? parsed
    : { folders: [], tags: [] };
  if (project?.ioListMeta && !next.meta) {
    next.meta = project.ioListMeta;
  }
  return next;
}

function getProjectIoTagsParsed(project) {
  if (!project) {
    return { folders: [], tags: [] };
  }

  ensureProjectCsvData(project);
  if (project.ioTagsParsed?.tags?.length || project.ioTagsParsed?.folders?.length) {
    return attachIoListMeta(project.ioTagsParsed, project);
  }

  const tagsFile = getProjectPrimaryTagsFile(project);
  if (!tagsFile?.content || !globalThis.IoTags) {
    return attachIoListMeta({ folders: [], tags: [] }, project);
  }

  try {
    project.ioTagsParsed = globalThis.IoTags.parseIoListText(tagsFile.content);
  } catch (_err) {
    project.ioTagsParsed = { folders: [], tags: [] };
  }

  return attachIoListMeta(project.ioTagsParsed, project);
}

function projectHasIoTagsContent(project) {
  const tagsFile = getProjectPrimaryTagsFile(project);
  return Boolean(tagsFile?.content?.trim());
}

function getPreviewIoProject() {
  const candidates = [];
  const seen = new Set();

  const pushCandidate = (project) => {
    if (!project || seen.has(project.id)) {
      return;
    }
    seen.add(project.id);
    candidates.push(project);
  };

  pushCandidate(getActiveProject());

  if (activeProjectCsvKey) {
    const parsed = parseProjectCsvKey(activeProjectCsvKey);
    pushCandidate(getProjectById(parsed?.projectId));
  }

  if (activeProjectKey) {
    const record = getProjectScreenByKey(activeProjectKey);
    pushCandidate(record?.project);
  }

  for (const project of candidates) {
    if (projectHasIoTagsContent(project)) {
      return project;
    }
  }

  return candidates[0] || null;
}

function createProjectIoListKey(projectId, fileId) {
  return `${projectId}::io-list::${fileId}`;
}

function parseProjectIoListKey(key) {
  const parts = String(key || '').split('::io-list::');
  if (parts.length !== 2) {
    return null;
  }
  return { projectId: parts[0], fileId: parts[1] };
}

function getProjectIoListFileByKey(key) {
  const parsed = parseProjectIoListKey(key);
  if (!parsed) {
    return null;
  }
  const project = getProjectById(parsed.projectId);
  if (!project) {
    return null;
  }
  const file = (project.ioListFiles || []).find((item) => String(item.id) === String(parsed.fileId));
  if (!file) {
    return null;
  }
  return { project, file };
}

function getProjectIoListSheets(project) {
  ensureProjectCsvData(project);
  if (project.ioListSheets?.length) {
    return project.ioListSheets;
  }
  if (project.ioListMeta?.sourceSheets?.length) {
    project.ioListSheets = project.ioListMeta.sourceSheets;
    return project.ioListSheets;
  }
  return [];
}

function collectIoListEditorRows() {
  if (!previewPane) {
    return [];
  }

  const byTag = new Map();
  for (const input of previewPane.querySelectorAll('[data-io-tag-name]')) {
    const tagName = String(input.dataset.ioTagName || '').trim();
    if (!tagName) {
      continue;
    }
    const field = String(input.dataset.ioField || 'description');
    const row = byTag.get(tagName) || { tagName, description: '', address: '' };
    row[field] = String(input.value || '');
    byTag.set(tagName, row);
  }

  return [...byTag.values()];
}

function getIoListZoneSheet(project, zone) {
  const sheets = getProjectIoListSheets(project);
  const target = String(zone || '').trim();
  if (!target) {
    return sheets[0] || null;
  }
  return sheets.find((sheet) => displayKey(sheet.zone) === displayKey(target)) || sheets[0] || null;
}

function getIoListSheetPlcDiItems(sheet) {
  return (sheet?.diInputs || []).filter((item) => !item.isSafety);
}

function getIoListSheetPageCount(sheet) {
  return Math.max(1, Math.ceil(getIoListSheetPlcDiItems(sheet).length / 8));
}

function resolveIoListEditorZone(project, zones, fallbackZone = '') {
  const list = Array.isArray(zones) ? zones.filter(Boolean) : [];
  let zone = String(project?.ioListPreviewZone || fallbackZone || '').trim();
  if (zone && list.some((item) => displayKey(item) === displayKey(zone))) {
    return zone;
  }
  if (list.includes('Packing')) {
    return 'Packing';
  }
  return list[0] || zone || 'IO';
}

function mergeVisibleIoListSheetEdits(project) {
  if (!previewPane || !project?.ioListSheets?.length) {
    return;
  }

  for (const rowEl of previewPane.querySelectorAll('[data-io-di-index]')) {
    const diIndex = Number(rowEl.dataset.ioDiIndex);
    const zone = String(rowEl.closest('[data-io-sheet-zone]')?.dataset.ioSheetZone || '').trim();
    const sheet = getIoListZoneSheet(project, zone);
    if (!sheet || !Number.isFinite(diIndex) || !sheet.diInputs[diIndex]) {
      continue;
    }
    sheet.diInputs[diIndex].address = String(rowEl.querySelector('[data-io-field="address"]')?.value || '').trim();
    sheet.diInputs[diIndex].description = String(rowEl.querySelector('[data-io-field="description"]')?.value || '').trim();
    sheet.diInputs[diIndex].plcTag = String(rowEl.querySelector('[data-io-field="plcTag"]')?.value || '').trim();
  }

  for (const rowEl of previewPane.querySelectorAll('[data-io-do-index]')) {
    const doIndex = Number(rowEl.dataset.ioDoIndex);
    const zone = String(rowEl.closest('[data-io-sheet-zone]')?.dataset.ioSheetZone || '').trim();
    const sheet = getIoListZoneSheet(project, zone);
    if (!sheet || !Number.isFinite(doIndex) || !sheet.doOutputs[doIndex]) {
      continue;
    }
    sheet.doOutputs[doIndex].address = String(rowEl.querySelector('[data-io-field="address"]')?.value || '').trim();
    sheet.doOutputs[doIndex].description = String(rowEl.querySelector('[data-io-field="description"]')?.value || '').trim();
    sheet.doOutputs[doIndex].plcTag = String(rowEl.querySelector('[data-io-field="plcTag"]')?.value || '').trim();
  }
}

function collectIoListSheetEditsFromTable() {
  return null;
}

function getIoListEditableRows(project, file) {
  if (!project || !globalThis.IoTags) {
    return { mode: 'empty', rows: [], sheets: [] };
  }

  const sheets = getProjectIoListSheets(project);
  if (sheets.length) {
    return { mode: 'sheets', rows: [], sheets };
  }

  const summaryText = String(file?.content || '').trim();
  const rows = globalThis.IoTags.parseIoListSummaryText(summaryText);
  if (rows.length) {
    return { mode: 'summary', rows, sheets: [] };
  }

  const parsed = getProjectIoTagsParsed(project);
  if (parsed?.tags?.length) {
    return {
      mode: 'summary',
      rows: globalThis.IoTags.parseIoListSummaryText(
        globalThis.IoTags.formatMasterSheetSummary(parsed, file?.name || '')
      ),
      sheets: []
    };
  }

  return { mode: 'empty', rows: [], sheets: [] };
}

function applyIoListProjectChanges(project, file, editorState) {
  if (!project || !file || !globalThis.IoTags) {
    throw new Error('IO list data is not available.');
  }

  mergeVisibleIoListSheetEdits(project);

  let parsed;
  if (getProjectIoListSheets(project).length) {
    parsed = globalThis.IoTags.rebuildParsedFromMasterSheets(getProjectIoListSheets(project));
  } else {
    const rows = collectIoListEditorRows();
    if (!rows.length) {
      throw new Error('No IO list rows to save.');
    }
    parsed = globalThis.IoTags.applyIoListSummaryEdits(getProjectIoTagsParsed(project), rows);
  }

  project.ioListMeta = parsed.meta || null;
  if (parsed.meta?.sourceSheets?.length) {
    project.ioListSheets = parsed.meta.sourceSheets;
  }
  project.ioTagsParsed = parsed;

  upsertGeneratedTagsCsv(
    project,
    globalThis.IoTags.serializeFactoryTalkTagsCsv(parsed),
    `${project.name}-Tags`
  );
  upsertGeneratedParameterFiles(project, parsed, project.ioListPreviewZone || '');

  file.content = globalThis.IoTags.formatMasterSheetSummary(parsed, file.name);
  file.sizeBytes = new Blob([file.content]).size;
  file.lastModified = new Date().toISOString();
  xmlEditor.value = file.content;
  resetHistory(file.content);

  saveProjectList();
  renderProjectSidebar();
  renderIoListEditorPreview(project, file);
  if (isIoListPreviewScreenActive()) {
    renderPreview();
  }
}

function renderIoListEditorPreview(project, file) {
  if (!previewPane || !project || !file) {
    return;
  }

  mergeVisibleIoListSheetEdits(project);

  const editorState = getIoListEditableRows(project, file);
  const frame = document.createElement('div');
  frame.className = 'preview-frame io-list-editor-frame';

  const heading = document.createElement('h4');
  heading.className = 'io-list-editor-title';
  heading.textContent = `IO List: ${file.name}`;
  frame.appendChild(heading);

  const intro = document.createElement('p');
  intro.className = 'io-list-editor-intro';
  intro.textContent = 'Edit descriptions and addresses for the selected zone, then click Apply Changes to update Tags CSV and the IO screen preview.';
  frame.appendChild(intro);

  const toolbar = document.createElement('div');
  toolbar.className = 'io-list-editor-toolbar';

  const zones = project.ioListMeta?.zones || editorState.sheets.map((sheet) => sheet.zone).filter(Boolean);
  const activeZone = resolveIoListEditorZone(project, zones);
  project.ioListPreviewZone = activeZone;

  const rerenderIoListEditor = () => {
    saveProjectList();
    renderIoListEditorPreview(project, file);
    if (isIoListPreviewScreenActive()) {
      renderPreview();
    }
  };

  if (zones.length) {
    const zoneLabel = document.createElement('label');
    zoneLabel.className = 'io-list-editor-zone-label';
    zoneLabel.textContent = 'Zone:';
    const zoneSelect = document.createElement('select');
    zoneSelect.className = 'io-list-editor-zone-select';
    for (const zone of zones) {
      const option = document.createElement('option');
      option.value = zone;
      option.textContent = zone;
      option.selected = displayKey(zone) === displayKey(activeZone);
      zoneSelect.appendChild(option);
    }
    zoneSelect.addEventListener('change', () => {
      mergeVisibleIoListSheetEdits(project);
      project.ioListPreviewZone = zoneSelect.value;
      rerenderIoListEditor();
    });
    zoneLabel.appendChild(zoneSelect);
    toolbar.appendChild(zoneLabel);
  }

  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.className = 'io-list-editor-apply-btn';
  applyBtn.textContent = 'Apply Changes';
  applyBtn.addEventListener('click', () => {
    try {
      applyIoListProjectChanges(project, file, editorState);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not apply IO list changes.');
    }
  });
  toolbar.appendChild(applyBtn);

  const previewBtn = document.createElement('button');
  previewBtn.type = 'button';
  previewBtn.className = 'io-list-editor-preview-btn';
  previewBtn.textContent = 'Open IO Screen Preview';
  previewBtn.addEventListener('click', async () => {
    const opened = await openProjectIoListPreviewScreen(project);
    if (!opened) {
      alert('Could not open 303_IO_List.xml.');
    }
  });
  toolbar.appendChild(previewBtn);
  frame.appendChild(toolbar);

  if (editorState.mode === 'empty') {
    const empty = document.createElement('div');
    empty.className = 'preview-empty';
    empty.textContent = 'Upload the Master Sheet Excel file under IO List → + to load editable rows.';
    frame.appendChild(empty);
    previewPane.innerHTML = '';
    previewPane.appendChild(frame);
    return;
  }

  if (editorState.mode === 'sheets') {
    const activeSheet = getIoListZoneSheet(project, activeZone);
    const plcDiItems = getIoListSheetPlcDiItems(activeSheet);

    const section = document.createElement('section');
    section.className = 'io-list-sheet-section';
    section.dataset.ioSheetZone = activeSheet?.zone || activeZone;

    const sectionTitle = document.createElement('h5');
    sectionTitle.textContent = `${activeSheet?.zone || activeZone} IO List`;
    section.appendChild(sectionTitle);

    const meta = document.createElement('p');
    meta.className = 'io-list-page-meta';
    meta.textContent = `${plcDiItems.length} PLC digital inputs`;
    section.appendChild(meta);

    const table = document.createElement('table');
    table.className = 'io-list-editor-table';
    table.innerHTML = '<thead><tr><th>Type</th><th>Address</th><th>Description</th><th>PLC Tag</th></tr></thead>';
    const tbody = document.createElement('tbody');

    for (const item of plcDiItems) {
      const diIndex = activeSheet.diInputs.indexOf(item);
      const tr = document.createElement('tr');
      tr.dataset.ioRowKind = 'di';
      tr.dataset.ioDiIndex = String(diIndex);
      tr.dataset.ioSafety = item.isSafety ? '1' : '0';
      tr.innerHTML = `<td data-io-field="type">${escapeHtmlText(item.type || '')}</td>`
        + `<td><input data-io-field="address" type="text" value="${escapeHtmlAttr(item.address || '')}"></td>`
        + `<td><input data-io-field="description" type="text" value="${escapeHtmlAttr(item.description || '')}"></td>`
        + `<td><input data-io-field="plcTag" type="text" value="${escapeHtmlAttr(item.plcTag || '')}"></td>`;
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    section.appendChild(table);

    const safetyItems = (activeSheet?.diInputs || []).filter((item) => item.isSafety);
    if (safetyItems.length) {
      const safetyTitle = document.createElement('h5');
      safetyTitle.className = 'io-list-subsection-title';
      safetyTitle.textContent = `${activeSheet?.zone || activeZone} Safety Inputs (${safetyItems.length})`;
      section.appendChild(safetyTitle);

      const safetyTable = document.createElement('table');
      safetyTable.className = 'io-list-editor-table io-list-editor-subtable';
      safetyTable.innerHTML = '<thead><tr><th>Type</th><th>Address</th><th>Description</th><th>PLC Tag</th></tr></thead>';
      const safetyBody = document.createElement('tbody');
      for (const item of safetyItems) {
        const diIndex = activeSheet.diInputs.indexOf(item);
        const tr = document.createElement('tr');
        tr.dataset.ioRowKind = 'di';
        tr.dataset.ioDiIndex = String(diIndex);
        tr.dataset.ioSafety = '1';
        tr.innerHTML = `<td data-io-field="type">${escapeHtmlText(item.type || '')}</td>`
          + `<td><input data-io-field="address" type="text" value="${escapeHtmlAttr(item.address || '')}"></td>`
          + `<td><input data-io-field="description" type="text" value="${escapeHtmlAttr(item.description || '')}"></td>`
          + `<td><input data-io-field="plcTag" type="text" value="${escapeHtmlAttr(item.plcTag || '')}"></td>`;
        safetyBody.appendChild(tr);
      }
      safetyTable.appendChild(safetyBody);
      section.appendChild(safetyTable);
    }

    const doItems = activeSheet?.doOutputs || [];
    if (doItems.length) {
      const doTitle = document.createElement('h5');
      doTitle.className = 'io-list-subsection-title';
      doTitle.textContent = `${activeSheet?.zone || activeZone} Digital Outputs (${doItems.length})`;
      section.appendChild(doTitle);

      const doTable = document.createElement('table');
      doTable.className = 'io-list-editor-table io-list-editor-subtable';
      doTable.innerHTML = '<thead><tr><th>Type</th><th>Address</th><th>Description</th><th>PLC Tag</th></tr></thead>';
      const doBody = document.createElement('tbody');
      for (const item of doItems) {
        const doIndex = activeSheet.doOutputs.indexOf(item);
        const tr = document.createElement('tr');
        tr.dataset.ioRowKind = 'do';
        tr.dataset.ioDoIndex = String(doIndex);
        tr.innerHTML = `<td data-io-field="type">${escapeHtmlText(item.type || '')}</td>`
          + `<td><input data-io-field="address" type="text" value="${escapeHtmlAttr(item.address || '')}"></td>`
          + `<td><input data-io-field="description" type="text" value="${escapeHtmlAttr(item.description || '')}"></td>`
          + `<td><input data-io-field="plcTag" type="text" value="${escapeHtmlAttr(item.plcTag || '')}"></td>`;
        doBody.appendChild(tr);
      }
      doTable.appendChild(doBody);
      section.appendChild(doTable);
    }

    frame.appendChild(section);
  } else {
    const table = document.createElement('table');
    table.className = 'io-list-editor-table';
    table.innerHTML = '<thead><tr><th>Folder</th><th>Tag</th><th>Description</th><th>Address</th></tr></thead>';
    const tbody = document.createElement('tbody');

    for (const row of editorState.rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtmlText(row.folder || '')}</td>`
        + `<td><code>${escapeHtmlText(row.tagName || '')}</code></td>`
        + `<td><input data-io-tag-name="${escapeHtmlAttr(row.tagName || '')}" data-io-field="description" type="text" value="${escapeHtmlAttr(row.description || '')}"></td>`
        + `<td><input data-io-tag-name="${escapeHtmlAttr(row.tagName || '')}" data-io-field="address" type="text" value="${escapeHtmlAttr(row.address || '')}"></td>`;
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    frame.appendChild(table);
  }

  previewPane.innerHTML = '';
  previewPane.appendChild(frame);
}

function escapeHtmlAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeHtmlText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function saveActiveProjectIoListFromEditor() {
  if (!activeIoListFileKey) {
    return true;
  }

  const record = getProjectIoListFileByKey(activeIoListFileKey);
  if (!record) {
    activeIoListFileKey = '';
    return true;
  }

  try {
    mergeVisibleIoListSheetEdits(project);
    record.file.content = xmlEditor.value;
    record.file.sizeBytes = new Blob([record.file.content]).size;
    record.file.lastModified = new Date().toISOString();
    saveProjectList();
  } catch (err) {
    console.error(err);
  }
  return true;
}

function getProjectIoPreviewMap(project) {
  if (!project || !globalThis.IoTags) {
    return new Map();
  }

  const parsed = getProjectIoTagsParsed(project);
  let zone = String(project.ioListPreviewZone || '').trim();
  const zones = parsed?.meta?.zones || [];
  if (!zone && zones.includes('Packing')) {
    zone = 'Packing';
  } else if (!zone && zones.length === 1) {
    zone = zones[0];
  }

  if (isIoListPreviewScreenActive() && zone) {
    const zoneMap = globalThis.IoTags.buildIoListPreviewMap(parsed, {
      page: project.ioListPreviewPage || 1,
      zone
    });
    if (zoneMap.size) {
      return zoneMap;
    }
  }

  const bindings = getActiveParameterBindings(project);
  if (bindings?.size) {
    const fromParameters = globalThis.IoTags.buildPreviewMapFromParameterFile(parsed, bindings, parsed);
    if (fromParameters.size) {
      return fromParameters;
    }
  }

  return globalThis.IoTags.buildIoListPreviewMap(parsed, {
    page: project.ioListPreviewPage || 1,
    zone
  });
}

function resolvePreviewParameterExpression(expression) {
  const project = currentPreviewIoProject || getPreviewIoProject();
  if (!project || !globalThis.IoTags) {
    return null;
  }

  const match = String(expression || '').match(/\{#\s*(\d+)\s*\}/i);
  if (match) {
    const key = Number(match[1]);
    const bindings = getActiveParameterBindings(project);
    if (bindings?.has(key)) {
      const tagsParsed = getProjectIoTagsParsed(project);
      const resolved = globalThis.IoTags.resolveTagPreviewValue(tagsParsed, bindings.get(key));
      if (resolved) {
        return resolved;
      }
    }
  }

  const previewMap = getProjectIoPreviewMap(project);
  return globalThis.IoTags.resolveParameterExpression(expression, previewMap);
}

function upsertGeneratedTagsCsv(project, csvContent, sourceName = 'Tags.CSV') {
  ensureProjectCsvData(project);
  const name = String(sourceName || 'Tags.CSV').replace(/\.csv$/i, '');
  const fileName = `${name}.CSV`;
  const entry = {
    id: `csv-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: fileName,
    content: csvContent,
    sizeBytes: new Blob([csvContent]).size,
    lastModified: new Date().toISOString()
  };

  const existingIndex = project.tagsFiles.findIndex((file) => displayKey(file.name) === displayKey(fileName));
  if (existingIndex >= 0) {
    project.tagsFiles[existingIndex] = {
      ...project.tagsFiles[existingIndex],
      ...entry,
      id: project.tagsFiles[existingIndex].id
    };
  } else {
    project.tagsFiles.push(entry);
  }
}

async function convertIoListUploadExcel(sourceFile) {
  const buffer = await sourceFile.arrayBuffer();
  const options = { sourceName: sourceFile.name };

  try {
    if (typeof XLSX !== 'undefined' && globalThis.IoTags) {
      return globalThis.IoTags.convertIoListUpload(buffer, options);
    }
    throw new Error('Excel support is not loaded.');
  } catch (err) {
    if (!/Excel support is not loaded/i.test(String(err?.message || ''))) {
      throw err;
    }
  }

  const response = await fetch('/api/convert-io-list-xlsx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: buffer
  });
  const data = await readApiJson(response);
  if (!response.ok) {
    throw new Error(data.error || 'Could not convert Excel IO list on the server.');
  }
  return data;
}

async function importProjectIoListFiles(projectId, fileList) {
  const project = getProjectById(projectId);
  if (!project || !fileList?.length) {
    throw new Error('Choose a project and at least one IO list file.');
  }
  if (!globalThis.IoTags) {
    throw new Error('IO list support failed to load. Refresh the page and try again.');
  }

  ensureProjectCsvData(project);
  let mergedText = '';
  let combinedParsed = null;
  let lastConverted = null;

  for (const sourceFile of fileList) {
    const isExcel = /\.xlsx$/i.test(String(sourceFile?.name || ''));
    let converted;
    let storedContent;
    let name = baseFileName(sourceFile.name) || 'IO_List';

    if (isExcel) {
      if (combinedParsed) {
        throw new Error('Upload one Excel Master Sheet at a time.');
      }
      const buffer = await sourceFile.arrayBuffer();
      converted = await convertIoListUploadExcel(sourceFile);
      storedContent = converted.summary || `# Imported from ${sourceFile.name}`;
      name = sourceFile.name;
      combinedParsed = converted.parsed;
    } else {
      const content = await readUploadedText(sourceFile);
      mergedText += `${content}\n`;
      storedContent = content;
      if (!/\.(csv|txt)$/i.test(name)) {
        name = `${name}.txt`;
      }
    }

    lastConverted = converted;

    const existingIndex = project.ioListFiles.findIndex((item) => displayKey(item.name) === displayKey(name));
    const entry = {
      id: `io-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      content: storedContent,
      sizeBytes: new Blob([storedContent]).size,
      lastModified: new Date().toISOString(),
      sourceType: isExcel ? 'xlsx' : 'text'
    };

    if (existingIndex >= 0) {
      project.ioListFiles[existingIndex] = {
        ...project.ioListFiles[existingIndex],
        ...entry,
        id: project.ioListFiles[existingIndex].id
      };
    } else {
      project.ioListFiles.push(entry);
    }
  }

  if (!combinedParsed && mergedText.trim()) {
    lastConverted = globalThis.IoTags.convertIoListUpload(mergedText);
    combinedParsed = lastConverted.parsed;
  }

  if (!combinedParsed) {
    throw new Error('No IO list rows found in the uploaded file.');
  }

  const zones = combinedParsed?.meta?.zones || [];
  if (!project.ioListPreviewZone && zones.includes('Packing')) {
    project.ioListPreviewZone = 'Packing';
  } else if (!project.ioListPreviewZone && zones.length === 1) {
    project.ioListPreviewZone = zones[0];
  }

  project.ioListMeta = combinedParsed?.meta || null;
  project.ioListSheets = combinedParsed?.meta?.sourceSheets
    || getProjectIoListSheets(project)
    || [];
  project.ioTagsParsed = combinedParsed;
  upsertGeneratedTagsCsv(
    project,
    globalThis.IoTags.serializeFactoryTalkTagsCsv(combinedParsed),
    `${project.name}-Tags`
  );
  upsertGeneratedParameterFiles(project, combinedParsed, project.ioListPreviewZone || '');
  project.ioListPreviewParameterFile = project.ioListPreviewParameterFile || 'PLC DI List 01';
  project.ioListCollapsed = false;
  project.tagsCollapsed = false;
  activeProjectKey = '';
  activeProjectFolder = '';
  activeProjectScreen = '';
  activeProjectCsvKey = '';
  setActiveProject(project);
  saveProjectList();
  renderProjectSidebar();
  updateProjectSidebarSelection();

  if (!activeProjectCsvKey && xmlEditor.value.trim()) {
    renderPreview();
  }

  return {
    ...lastConverted,
    parsed: combinedParsed
  };
}

function removeProjectIoListFile(projectId, fileId) {
  const project = getProjectById(projectId);
  if (!project) {
    return;
  }

  project.ioListFiles = (project.ioListFiles || []).filter((item) => String(item.id) !== String(fileId));
  if (activeIoListFileKey === createProjectIoListKey(projectId, fileId)) {
    activeIoListFileKey = '';
    previewPane.innerHTML = '';
    xmlEditor.value = '';
    resetHistory('');
    displayName.value = 'None';
  }
  saveProjectList();
  renderProjectSidebar();
}

function openProjectIoListFile(project, file) {
  if (!project || !file) {
    return;
  }

  saveActiveProjectCsvFromEditor();
  saveActiveProjectIoListFromEditor();

  activeProjectKey = '';
  activeProjectFolder = '';
  activeProjectScreen = '';
  selectedDisplay = '';
  selectedDefaultTemplate = '';
  selectedFiles = [];
  activeProjectCsvKey = '';
  activeIoListFileKey = createProjectIoListKey(project.id, file.id);

  setActiveProject(project);
  displayName.value = `${project.name} / IO List / ${file.name}`;
  xmlEditor.value = file.content;
  resetHistory(file.content);
  selectedObjectIndex = null;
  clearObjectPanel();
  setWorkspaceDockTab('xml');
  updateProjectSidebarSelection();
  renderIoListEditorPreview(project, file);
}

function queueIoListUpload(projectId) {
  pendingIoListUpload = { projectId };
  if (!projectIoListInput) {
    return;
  }
  projectIoListInput.value = '';
  projectIoListInput.click();
}

const POPUP_TYPE_PROFILES = [
  { id: 'vfd', label: 'VFD', unit: 'Hz', token: 'VFD', min: '0', max: '50', decimalPlaces: '0', numberOfDigits: '4' },
  { id: 'forward_reverse', label: 'Forward and Reverse', unit: '', token: 'FORWARD_REVERSE', min: '0', max: '1', decimalPlaces: '0', numberOfDigits: '1' },
  { id: 'speed', label: 'Speed', unit: 'Hz', token: 'SPEED', min: '0', max: '100', decimalPlaces: '0', numberOfDigits: '3' },
  { id: 'updown', label: 'Up and Down', unit: '', token: 'UP_DOWN', min: '0', max: '1', decimalPlaces: '0', numberOfDigits: '1' }
];

const COMPONENT_TYPES = [
  { id: 'component:conveyor', label: 'Conveyor' },
  { id: 'component:pneumatic', label: 'Pneumatic' },
  { id: 'component:motor', label: 'Motor' },
  { id: 'component:servo', label: 'Servo' }
];

const CONVEYOR_VFD_TEMPLATE_XML = '<group name="MRTC03_Popup" visible="true" wallpaper="false" isReferenceObject="false" left="0" top="0" width="138" height="76"><rectangle name="Popup_Frame" height="45" width="138" left="0" top="31" visible="true" isReferenceObject="false" backStyle="gradient" backColor="#C6C6C6" foreColor="#C6C6C6" lineStyle="solid" lineWidth="2" patternStyle="none" patternColor="#E0E0E0" endColor="#E8E8E8" gradientStop="95" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight"/><rectangle name="Popup_Header" height="33" width="138" left="0" top="0" visible="true" isReferenceObject="false" backStyle="gradient" backColor="#C6C6C6" foreColor="#C6C6C6" lineStyle="solid" lineWidth="2" patternStyle="none" patternColor="#E0E0E0" endColor="#E8E8E8" gradientStop="95" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight"/><text name="Popup_Title" height="19" width="66" left="36" top="7" visible="true" isReferenceObject="false" backStyle="transparent" backColor="white" foreColor="black" wordWrap="true" sizeToFit="true" alignment="middleLeft" fontFamily="Arial" fontSize="13" bold="true" italic="false" underline="false" strikethrough="false" caption="MRTC03"/><numericInputCursorPoint name="Popup_NumericInput" height="28" width="70" left="18" top="39" visible="true" isReferenceObject="false" alignment="middleCenter" audio="true" backStyle="solid" backColor="white" foreColor="black" blink="false" borderStyle="line" borderUsesBackColor="false" borderWidth="1" description="" highlightColor="lime" borderColor="black" patternColor="white" patternStyle="none" touch="true" horizontalMargin="0" verticalMargin="0" enterKeyControlDelay="400" enterKeyHandshakeTime="4" enterKeyHoldTime="250" handshakeReset="nonZeroValue" keyNavigation="true" decimalPoint="implicit" digitsAfterDecimalPoint="0" numberOfDigits="4" decimalPlaces="0" fixedPosition="stripped" fillLeftWith="none" numericPopup="keypad" fontFamily="Arial" fontSize="11" bold="false" italic="false" underline="false" strikethrough="false" rampValue="0" useVariableMinMax="false" captionOnPad="" minValue="0" maxValue="50" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight" RequireElectronicSignature="false" AllowBlankComment="false" RequireReAuthentication="false" RequireCounterSignature="false" AuthorizedGroup="Administrators" ESDomainNameVisible="false" ESDomainNameType="ESDomainNameConstant" ESDomainName="" VariableDomainName="" ESDomainNameDisable="false"><connections><connection name="Value" expression="{[PLC]Z02_FB_MRTC_03.HMI_Manual_Drive_Speed_in_Hz}"/><connection name="Indicator" expression="{[PLC]Z02_FB_MRTC_03.HMI_Manual_Drive_Speed_in_Hz}"/><connection name="Minimum" expression="0"/><connection name="Maximum" expression="50"/></connections></numericInputCursorPoint><text name="Popup_Unit" height="16" width="17" left="104" top="45" visible="true" isReferenceObject="false" backStyle="transparent" backColor="white" foreColor="black" wordWrap="true" sizeToFit="true" alignment="middleCenter" fontFamily="Arial" charHeight="16" charWidth="6" bold="true" italic="false" underline="false" strikethrough="false" caption="Hz"/></group>';

const CONVEYOR_SPEED_TEMPLATE_XML = `<group name="Group4" visible="true" wallpaper="false" isReferenceObject="false">
    <rectangle name="Polygon4" height="259" width="250" left="762" top="105" visible="true" isReferenceObject="false" backStyle="gradient" backColor="#C6C6C6" foreColor="#C6C6C6" lineStyle="solid" lineWidth="2" patternStyle="none" patternColor="#E0E0E0" endColor="#E8E8E8" gradientStop="95" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight"/>
    <text name="Text40" height="19" width="73" left="850" top="114" visible="true" isReferenceObject="false" backStyle="transparent" backColor="white" foreColor="black" wordWrap="true" sizeToFit="true" alignment="middleCenter" fontFamily="Arial" fontSize="13" bold="true" italic="false" underline="false" strikethrough="false" caption="[a] BIC01"/>
    <text name="Text41" height="18" width="103" left="772" top="160" visible="true" isReferenceObject="false" backStyle="transparent" backColor="white" foreColor="black" wordWrap="true" sizeToFit="true" alignment="middleCenter" fontFamily="Arial" fontSize="12" bold="false" italic="false" underline="false" strikethrough="false" caption="MPCB Healthy"/>
    <multistateIndicator name="MultistateIndicator15" height="24" width="24" left="937" top="157" visible="true" isReferenceObject="false" backStyle="solid" borderStyle="none" borderUsesBackColor="true" borderWidth="8" description="" shape="circle" triggerType="value" currentStateId="0" captionOnBorder="false" setLastStateId="2">
        <states>
            <state stateId="Error" backColor="navy" borderColor="navy" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Arial Unicode MS" fontSize="10" bold="false" italic="false" underline="false" strikethrough="false" caption="Error" color="white" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="navy" scaled="false" blink="false"/>
            </state>
            <state stateId="0" value="1" backColor="#10EB10" borderColor="#10EB10" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Arial Unicode MS" fontSize="10" bold="false" italic="false" underline="false" strikethrough="false" caption="" color="white" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="navy" scaled="false" blink="false"/>
            </state>
            <state stateId="1" value="0" backColor="#F83D3D" borderColor="#F83D3D" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Arial Unicode MS" fontSize="10" bold="false" italic="false" underline="false" strikethrough="false" caption="" color="white" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="navy" scaled="false" blink="false"/>
            </state>
        </states>
        <connections>
            <connection name="Indicator" expression="{[PLC]RIO01_DI[020]}"/>
        </connections>
    </multistateIndicator>
    <multistateIndicator name="MultistateIndicator18" height="24" width="24" left="937" top="196" visible="true" isReferenceObject="false" backStyle="solid" borderStyle="none" borderUsesBackColor="true" borderWidth="8" description="" shape="circle" triggerType="value" currentStateId="0" captionOnBorder="false" setLastStateId="2">
        <states>
            <state stateId="Error" backColor="navy" borderColor="navy" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Arial Unicode MS" fontSize="10" bold="false" italic="false" underline="false" strikethrough="false" caption="Error" color="white" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="navy" scaled="false" blink="false"/>
            </state>
            <state stateId="0" value="1" backColor="#10EB10" borderColor="#10EB10" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Arial Unicode MS" fontSize="10" bold="false" italic="false" underline="false" strikethrough="false" caption="" color="white" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="navy" scaled="false" blink="false"/>
            </state>
            <state stateId="1" value="0" backColor="#F83D3D" borderColor="#F83D3D" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Arial Unicode MS" fontSize="10" bold="false" italic="false" underline="false" strikethrough="false" caption="" color="white" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="navy" scaled="false" blink="false"/>
            </state>
        </states>
        <connections>
            <connection name="Indicator" expression="{[PLC]Drive01_BIC01.In_Disconnector_FB}"/>
        </connections>
    </multistateIndicator>
    <text name="Text23" height="18" width="148" left="772" top="199" visible="true" isReferenceObject="false" backStyle="transparent" backColor="white" foreColor="black" wordWrap="true" sizeToFit="true" alignment="middleCenter" fontFamily="Arial" fontSize="12" bold="false" italic="false" underline="false" strikethrough="false" caption="Disconnector Healthy"/>
    <numericDisplay name="NumericDisplay9" height="28" width="70" left="883" top="272" visible="true" isReferenceObject="false" backColor="#C6C6C6" backStyle="solid" borderColor="navy" borderStyle="raisedInset" borderUsesBackColor="true" borderWidth="1" foreColor="black" alignment="middleCenter" blink="false" patternColor="white" patternStyle="none" description="" decimalPlaces="2" numberOfDigits="6" fillLeftWith="none" fontFamily="Arial" fontSize="12" bold="false" italic="false" underline="false" strikethrough="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
        <connections>
            <connection name="Value" expression="{[PLC]Drive01_BIC01.Out_Running_Frequency}"/>
        </connections>
    </numericDisplay>
    <text name="Text26" height="18" width="95" left="772" top="238" visible="true" isReferenceObject="false" backStyle="transparent" backColor="white" foreColor="black" wordWrap="true" sizeToFit="true" alignment="middleCenter" fontFamily="Arial" charHeight="18" charWidth="7" bold="false" italic="false" underline="false" strikethrough="false" caption="Actual Speed"/>
    <text name="Text27" height="18" width="19" left="960" top="238" visible="true" isReferenceObject="false" backStyle="transparent" backColor="white" foreColor="black" wordWrap="true" sizeToFit="true" alignment="middleCenter" fontFamily="Arial" charHeight="18" charWidth="7" bold="false" italic="false" underline="false" strikethrough="false" caption="Hz"/>
    <numericInputEnable name="NumericInputEnable6" height="28" width="70" left="883" top="233" visible="true" isReferenceObject="false" audio="true" backColor="white" backStyle="solid" borderStyle="raised" borderUsesBackColor="true" borderWidth="1" description="" highlightColor="lime" borderColor="black" patternColor="white" patternStyle="none" horizontalMargin="0" verticalMargin="0" shape="rectangle" touch="true" blink="false" enterKeyControlDelay="400" enterKeyHandshakeTime="4" enterKeyHoldTime="250" handshakeReset="nonZeroValue" keyNavigation="true" decimalPoint="implicit" numericPopup="keypad" rampValue="0" useVariableMinMax="false" takeFocusOnPress="false" minValue="0" maxValue="50" captionOnBorder="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight" RequireElectronicSignature="false" AllowBlankComment="false" RequireReAuthentication="false" RequireCounterSignature="false" AuthorizedGroup="Windows Administrators" ESDomainNameVisible="false" ESDomainNameType="ESDomainNameConstant" ESDomainName="" VariableDomainName="" ESDomainNameDisable="false">
        <caption fontFamily="Arial" fontSize="12" bold="false" italic="false" underline="false" strikethrough="false" caption="/*N:5 {[PLC]Drive01_BIC01.HMI_Manual_Drive_Speed_in_Hz} NOFILL DP:0*/" color="black" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
        <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="navy" scaled="false" blink="false"/>
        <connections>
            <connection name="Value" expression="{[PLC]Drive01_BIC01.HMI_Manual_Drive_Speed_in_Hz}"/>
            <connection name="Minimum" expression="0"/>
            <connection name="Maximum" expression="50"/>
        </connections>
    </numericInputEnable>
    <text name="Text33" height="18" width="102" left="772" top="277" visible="true" isReferenceObject="false" backStyle="transparent" backColor="white" foreColor="black" wordWrap="true" sizeToFit="true" alignment="middleCenter" fontFamily="Arial" charHeight="18" charWidth="7" bold="false" italic="false" underline="false" strikethrough="false" caption="Manual Speed"/>
    <text name="Text48" height="18" width="19" left="960" top="277" visible="true" isReferenceObject="false" backStyle="transparent" backColor="white" foreColor="black" wordWrap="true" sizeToFit="true" alignment="middleCenter" fontFamily="Arial" charHeight="18" charWidth="7" bold="false" italic="false" underline="false" strikethrough="false" caption="Hz"/>
    <multistateIndicator name="MultistateIndicator14" height="24" width="24" left="771" top="112" visible="true" isReferenceObject="false" backStyle="solid" borderStyle="none" borderUsesBackColor="true" borderWidth="8" description="" shape="circle" triggerType="value" currentStateId="0" captionOnBorder="false" setLastStateId="5">
        <states>
            <state stateId="Error" backColor="navy" borderColor="navy" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Arial" fontSize="10" bold="false" italic="false" underline="false" strikethrough="false" caption="Error" color="white" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="navy" scaled="false" blink="false"/>
            </state>
            <state stateId="0" value="0" backColor="red" borderColor="#F83D3D" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Tahoma" fontSize="13" bold="true" italic="false" underline="false" strikethrough="false" caption="" color="#3F3F3F" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="navy" scaled="false" blink="false"/>
            </state>
            <state stateId="1" value="1" backColor="#00F0FF" borderColor="blue" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Tahoma" fontSize="13" bold="true" italic="false" underline="false" strikethrough="false" caption="" color="#3F3F3F" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="navy" scaled="false" blink="false"/>
            </state>
            <state stateId="2" value="2" backColor="blue" borderColor="#00F0FF" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Tahoma" fontSize="13" bold="true" italic="false" underline="false" strikethrough="false" caption="" color="#3F3F3F" backColor="#001C38" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="#001C38" scaled="false" blink="false"/>
            </state>
            <state stateId="3" value="3" backColor="#71FF71" borderColor="green" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Tahoma" fontSize="13" bold="true" italic="false" underline="false" strikethrough="false" caption="" color="#3F3F3F" backColor="#001C38" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="#001C38" scaled="false" blink="false"/>
            </state>
            <state stateId="4" value="4" backColor="green" borderColor="#71FF71" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Tahoma" fontSize="13" bold="true" italic="false" underline="false" strikethrough="false" caption="" color="#3F3F3F" backColor="#001C38" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="#001C38" scaled="false" blink="false"/>
            </state>
        </states>
        <connections>
            <connection name="Indicator" expression="{[PLC]Drive01_BIC01.Out_Drive_Status}"/>
        </connections>
    </multistateIndicator>
    <maintainedButton name="MaintainedPushButton4" height="40" width="95" left="840" top="314" visible="true" isReferenceObject="false" audio="true" backStyle="solid" borderStyle="raised" borderUsesBackColor="true" borderWidth="2" description="" highlightColor="lime" horizontalMargin="0" verticalMargin="0" shape="rectangle" touch="true" nextStateBasedOn="currentState" currentStateId="1" captionOnBorder="false" RequireElectronicSignature="false" AllowBlankComment="false" RequireReAuthentication="false" RequireCounterSignature="false" AuthorizedGroup="Administrators" ESDomainNameVisible="false" ESDomainNameType="ESDomainNameConstant" ESDomainName="" VariableDomainName="" ESDomainNameDisable="false">
        <states>
            <state stateId="Error" backColor="navy" borderColor="navy" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Arial Unicode MS" fontSize="10" bold="false" italic="false" underline="false" strikethrough="false" caption="" color="white" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="navy" scaled="false" blink="false"/>
            </state>
            <state stateId="0" value="0" backColor="#EFEFEF" borderColor="#3F3F3F" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Arial" fontSize="12" bold="false" italic="false" underline="false" strikethrough="false" caption="Stop" color="black" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="navy" scaled="false" blink="false"/>
            </state>
            <state stateId="1" value="1" backColor="#10EB10" borderColor="#10EB10" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight">
                <caption fontFamily="Arial" fontSize="12" bold="false" italic="false" underline="false" strikethrough="false" caption="Start" color="black" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/>
                <imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="navy" scaled="false" blink="false"/>
            </state>
        </states>
        <connections>
            <connection name="Value" expression="{[PLC]Drive01_BIC01.HMI_Manual_FWD_Start}"/>
            <connection name="Indicator" expression="{[PLC]Drive01_BIC01.HMI_Manual_FWD_Start}"/>
        </connections>
    </maintainedButton>
</group>`;
const PNEUMATIC_FORWARD_REVERSE_TEMPLATE_XML = '<group name="PV18_Popup" visible="true" wallpaper="false" isReferenceObject="false" left="0" top="0" width="250" height="122"><rectangle name="Popup_Frame" height="122" width="250" left="0" top="0" visible="true" isReferenceObject="false" backStyle="gradient" backColor="#C6C6C6" foreColor="#C6C6C6" lineStyle="solid" lineWidth="2" patternStyle="none" patternColor="#E0E0E0" endColor="#E8E8E8" gradientStop="95" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight"/><text name="Popup_Title" height="38" width="236" left="8" top="4" visible="true" isReferenceObject="false" backStyle="transparent" backColor="white" foreColor="black" wordWrap="true" sizeToFit="true" alignment="middleCenter" fontFamily="Arial" fontSize="13" bold="true" italic="false" underline="false" strikethrough="false" caption="[d] PV18 Matrix Station&#xA;LH Side Cylinder"/><multistateIndicator name="Popup_D1" height="24" width="24" left="12" top="52" visible="true" isReferenceObject="false" backStyle="solid" borderStyle="line" borderUsesBackColor="true" borderWidth="1" shape="circle" triggerType="value" currentStateId="0" captionOnBorder="false" setLastStateId="2"><states><state stateId="0" value="0" backColor="#C6C6C6" borderColor="#E8E8E8" patternColor="white" patternStyle="none" blink="false"/><state stateId="1" value="1" backColor="#10EB10" borderColor="#10EB10" patternColor="white" patternStyle="none" blink="false"/></states><connections><connection name="Indicator" expression="{[PLC]PV18.Pos01PositionFB}"/></connections></multistateIndicator><text name="Popup_D1_Label" height="20" width="96" left="40" top="54" visible="true" isReferenceObject="false" backStyle="transparent" backColor="white" foreColor="black" wordWrap="true" sizeToFit="true" alignment="middleLeft" fontFamily="Arial" fontSize="12" bold="false" italic="false" underline="false" strikethrough="false" caption="d1   RIO:17:I.2"/><momentaryButton name="Popup_Forward" height="40" width="95" left="140" top="48" visible="true" isReferenceObject="false" audio="true" backStyle="solid" borderStyle="raised" borderUsesBackColor="true" borderWidth="2" buttonAction="normallyOpen" description="" holdTime="250" highlightColor="lime" horizontalMargin="0" verticalMargin="0" shape="rectangle" touch="true" currentStateId="0" captionOnBorder="false"><states><state stateId="0" backColor="#10EB10" borderColor="#10EB10" patternColor="white" patternStyle="none" blink="false"><caption fontFamily="Arial" fontSize="12" bold="false" italic="false" underline="false" strikethrough="false" caption="Forward" color="black" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/></state></states><connections><connection name="Value" expression="{[PLC]PV18.HMI_Pos01CMD}"/><connection name="Indicator" expression="{[PLC]PV18.HMI_Pos01CMD}"/></connections></momentaryButton><multistateIndicator name="Popup_D2" height="24" width="24" left="12" top="88" visible="true" isReferenceObject="false" backStyle="solid" borderStyle="line" borderUsesBackColor="true" borderWidth="1" shape="circle" triggerType="value" currentStateId="0" captionOnBorder="false" setLastStateId="2"><states><state stateId="0" value="0" backColor="#C6C6C6" borderColor="#E8E8E8" patternColor="white" patternStyle="none" blink="false"/><state stateId="1" value="1" backColor="#10EB10" borderColor="#10EB10" patternColor="white" patternStyle="none" blink="false"/></states><connections><connection name="Indicator" expression="{[PLC]PV18.Pos02PositionFB}"/></connections></multistateIndicator><text name="Popup_D2_Label" height="20" width="96" left="40" top="90" visible="true" isReferenceObject="false" backStyle="transparent" backColor="white" foreColor="black" wordWrap="true" sizeToFit="true" alignment="middleLeft" fontFamily="Arial" fontSize="12" bold="false" italic="false" underline="false" strikethrough="false" caption="d2   RIO:17:I.3"/><momentaryButton name="Popup_Reverse" height="40" width="95" left="140" top="84" visible="true" isReferenceObject="false" audio="true" backStyle="solid" borderStyle="raised" borderUsesBackColor="true" borderWidth="2" buttonAction="normallyOpen" description="" holdTime="250" highlightColor="lime" horizontalMargin="0" verticalMargin="0" shape="rectangle" touch="true" currentStateId="0" captionOnBorder="false"><states><state stateId="0" backColor="#10EB10" borderColor="#10EB10" patternColor="white" patternStyle="none" blink="false"><caption fontFamily="Arial" fontSize="12" bold="false" italic="false" underline="false" strikethrough="false" caption="Reverse" color="black" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="true" blink="false"/></state></states><connections><connection name="Value" expression="{[PLC]PV18.HMI_Pos02CMD}"/><connection name="Indicator" expression="{[PLC]PV18.HMI_Pos02CMD}"/></connections></momentaryButton></group>';

function getPopupTypeProfile(profileId) {
  const key = String(profileId || '').toLowerCase();
  return POPUP_TYPE_PROFILES.find((profile) => profile.id === key) || POPUP_TYPE_PROFILES[0];
}

function toCodeToken(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();
}

function suggestPopupCode(popupName, popupTypeId) {
  const profile = getPopupTypeProfile(popupTypeId);
  const popupToken = toCodeToken(popupName || 'POPUP');
  const measureToken = toCodeToken(profile?.token || profile?.label || profile?.unit || 'UNIT');
  return `{[PLC]${popupToken}_IN_${measureToken}}`;
}

function getComponentTypeLabel(componentTypeId, project = null) {
  const id = String(componentTypeId || 'component:conveyor');
  const component = COMPONENT_TYPES.find((item) => item.id === id);
  if (component) {
    return component.label;
  }

  if (id.startsWith('template:')) {
    const templateId = id.slice('template:'.length);
    const template = project?.popupTemplates?.find((item) => String(item.id) === templateId);
    if (template?.name) {
      return template.name;
    }
    return 'Custom Template';
  }

  return id;
}

function syncPopupPlanRowDerivedValues(row) {
  if (!row || typeof row !== 'object') {
    return row;
  }

  row.popupName = String(row.popupName || '').trim();
  row.componentTypeId = String(row.componentTypeId || 'component:conveyor');
  row.popupTypeId = String(row.popupTypeId || 'vfd').toLowerCase();
  row.count = Math.max(1, Math.min(200, Number(row.count) || 1));
  row.code = suggestPopupCode(row.popupName, row.popupTypeId);
  return row;
}

function ensureProjectPopupData(project) {
  if (!project || typeof project !== 'object') {
    return;
  }

  project.popupTemplates = Array.isArray(project.popupTemplates) ? project.popupTemplates : [];
  project.popupPlanRows = Array.isArray(project.popupPlanRows) ? project.popupPlanRows : [];
  project.popupGeneratedRows = Array.isArray(project.popupGeneratedRows) ? project.popupGeneratedRows : [];

  project.popupTemplates = project.popupTemplates
    .map((template) => ({
      id: String(template?.id || `popup-template-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      name: String(template?.name || 'Popup Template').trim() || 'Popup Template',
      xml: String(template?.xml || '').trim()
    }))
    .filter((template) => template.xml);

  project.popupPlanRows = project.popupPlanRows.map((row) => ({
    id: String(row?.id || `popup-row-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    popupName: String(row?.popupName || row?.equipment || '').trim(),
    componentTypeId: String(row?.componentTypeId || row?.popupTypeId || 'component:conveyor'),
    popupTypeId: String(row?.popupTypeId || row?.measurementTypeId || 'vfd').toLowerCase(),
    code: String(row?.code || '').trim(),
    count: Math.max(1, Math.min(200, Number(row?.count) || 1))
  })).map((row) => syncPopupPlanRowDerivedValues(row));

  project.popupGeneratedRows = project.popupGeneratedRows.map((entry) => ({
    id: String(entry?.id || `popup-generated-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    popupName: String(entry?.popupName || 'Popup').trim() || 'Popup',
    sequence: Math.max(1, Number(entry?.sequence) || 1),
    totalForName: Math.max(1, Number(entry?.totalForName) || 1),
    componentTypeId: String(entry?.componentTypeId || 'component:conveyor'),
    componentTypeLabel: String(entry?.componentTypeLabel || ''),
    templateId: String(entry?.templateId || ''),
    templateName: String(entry?.templateName || 'Popup Template').trim() || 'Popup Template',
    popupTypeId: String(entry?.popupTypeId || 'vfd').toLowerCase(),
    popupTypeLabel: String(entry?.popupTypeLabel || '').trim(),
    code: String(entry?.code || suggestPopupCode(entry?.popupName, entry?.popupTypeId)).trim(),
    generatedAt: String(entry?.generatedAt || new Date().toISOString())
  }));
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
  const payload = projectList.map((project) => {
    const { ioTagsParsed, ...rest } = project;
    return rest;
  });

  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    const message = String(err?.message || err || '');
    if (/quota/i.test(message)) {
      throw new Error('Browser storage is full. Remove old projects or large files and try again.');
    }
    throw err;
  }
}

function normalizeProjectList() {
  projectList = Array.isArray(projectList) ? projectList : [];
  let removedLegacyScreens = false;
  for (const project of projectList) {
    project.id = String(project.id || `project-${Date.now()}`);
    project.name = normalizeProjectName(project.name || 'Untitled Project');
    project.collapsed = Boolean(project.collapsed);
    ensureProjectPopupData(project);
    ensureProjectCsvData(project);
    project.folders = Array.isArray(project.folders) ? project.folders : [];
    const migratedCycleTimeScreens = [];
    for (const folder of project.folders) {
      folder.name = String(folder.name || 'Folder');
      folder.collapsed = Boolean(folder.collapsed);
      folder.screens = Array.isArray(folder.screens) ? folder.screens : [];
      for (const screen of folder.screens) {
        if (displayKey(screen?.name) === displayKey('402_IO_List.xml')) {
          screen.name = IO_LIST_SCREEN_FILE;
          screen.xml = String(screen.xml || '').replace(/display="402_IO_List"/g, 'display="303_IO_List"');
          removedLegacyScreens = true;
        }
        if (displayKey(screen?.name) === displayKey('105_Cycle_Time.xml') || displayKey(screen?.name) === displayKey('402_Cycletime.xml')) {
          screen.name = CYCLE_TIME_SCREEN_FILE;
          screen.xml = String(screen.xml || '')
            .replace(/display="105_Cycle_Time"/g, 'display="304_Cycle_Time"')
            .replace(/display="102_Cycletime"/g, 'display="304_Cycle_Time"')
            .replace(/display="402_Cycletime"/g, 'display="304_Cycle_Time"')
            .replace(/display="402_IO_List"/g, 'display="303_IO_List"');
          migratedCycleTimeScreens.push({ fromFolder: folder, screen });
          removedLegacyScreens = true;
        } else if (String(screen?.xml || '').includes('display="102_Cycletime"')
          || String(screen?.xml || '').includes('display="105_Cycle_Time"')
          || String(screen?.xml || '').includes('display="402_Cycletime"')) {
          screen.xml = String(screen.xml || '')
            .replace(/display="105_Cycle_Time"/g, 'display="304_Cycle_Time"')
            .replace(/display="102_Cycletime"/g, 'display="304_Cycle_Time"')
            .replace(/display="402_Cycletime"/g, 'display="304_Cycle_Time"')
            .replace(/display="402_IO_List"/g, 'display="303_IO_List"');
          removedLegacyScreens = true;
        }
      }
      const beforeCount = folder.screens.length;
      folder.screens = folder.screens.filter((screen) => !isExcludedProjectScreen(screen?.name));
      if (folder.screens.length !== beforeCount) {
        removedLegacyScreens = true;
      }
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

    if (migratedCycleTimeScreens.length) {
      const targetFolder = findOrCreateManualOperationFolder(project);
      for (const { fromFolder, screen } of migratedCycleTimeScreens) {
        const screenIndex = fromFolder.screens.indexOf(screen);
        if (screenIndex >= 0) {
          fromFolder.screens.splice(screenIndex, 1);
        }
        const alreadyPresent = targetFolder.screens.some((item) => displayKey(item.name) === displayKey(CYCLE_TIME_SCREEN_FILE));
        if (!alreadyPresent) {
          targetFolder.screens.push(screen);
        }
      }
      targetFolder.screens = sortFolderScreens(targetFolder.screens);
    }

    const foldersBefore = projectFoldersOrderKey(project.folders);
    project.folders = sortProjectFolders(project.folders);
    if (projectFoldersOrderKey(project.folders) !== foldersBefore) {
      removedLegacyScreens = true;
    }
  }

  if (removedLegacyScreens) {
    if (activeProjectKey && (
      isExcludedProjectScreen(getProjectScreenByKey(activeProjectKey)?.screen?.name || '')
      || displayKey(getProjectScreenByKey(activeProjectKey)?.screen?.name || '') === displayKey('402_IO_List.xml')
      || displayKey(getProjectScreenByKey(activeProjectKey)?.screen?.name || '') === displayKey('105_Cycle_Time.xml')
      || displayKey(getProjectScreenByKey(activeProjectKey)?.screen?.name || '') === displayKey('402_Cycletime.xml')
    )) {
      selectedDisplay = '';
      selectedFiles = [];
      displayName.value = 'None';
      xmlEditor.value = '';
      activeProjectKey = '';
      activeProjectScreen = '';
      activeProjectFolder = '';
      renderPreview();
    }
    persistProjectList();
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
    renderProjectPopupPlanner();
    return;
  }

  activeProjectId = project.id;
  localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, activeProjectId);
  setProjectName(project.name);
  renderProjectPopupPlanner();
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
    groupFiles.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }));
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

  if (sidebarTitle) {
    sidebarTitle.textContent = 'Projects';
  }

  if (importFolderBtn) {
    importFolderBtn.classList.toggle('hidden', isDefaultMode());
  }
}

async function createNewProject(rawName) {
  const projectName = normalizeProjectName(rawName);

  if (projectList.some((project) => displayKey(project.name) === displayKey(projectName))) {
    throw new Error(`Project ${projectName} already exists. Choose a different name.`);
  }

  if (activeProjectKey && xmlEditor.value.trim()) {
    const saved = await autoSaveCurrentDisplay();
    if (!saved) {
      return;
    }
  }

  try {
    const defaultsResponse = await fetch('/api/default-pages');
    if (!defaultsResponse.ok) {
      throw new Error('Failed to load default templates');
    }

    const defaultsData = await defaultsResponse.json();
    const templateFiles = (defaultsData.files || []).filter((file) => !isExcludedProjectScreen(file.name));
    const { folders, globalObjectFiles } = groupTemplateFiles(templateFiles);
    const project = {
      id: `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: projectName,
      collapsed: false,
      popupTemplates: [],
      popupPlanRows: [],
      tagsFiles: [],
      parametersFiles: [],
      ioListFiles: [],
      tagsCollapsed: false,
      parametersCollapsed: false,
      ioListCollapsed: false,
      ioListPreviewPage: 1,
      ioListPreviewZone: '',
      ioListSheets: [],
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

    projectList = [...projectList, project];
    saveProjectList();
    setActiveProject(project);
    setSidebarCollapsed(false);
    renderProjectSidebar();

    const firstFolder = project.folders[0];
    const firstScreen = firstFolder?.screens?.[0];
    if (firstFolder && firstScreen) {
      setEditorProjectScreen(project, firstFolder.name, firstScreen, firstScreen.xml);
    }

    hideProjectCreatePanel();
    if (packageResult) {
      packageResult.textContent = `Project ready: ${projectName}.`;
      setWorkspaceDockTab('xml');
    }
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
  sidebarNameMode = options.mode === 'screen' ? 'screen' : 'single';
  sidebarNameLabel.textContent = options.label || 'Name';
  sidebarNameInput.value = options.value || '';
  sidebarNameInput.placeholder = options.placeholder || 'New item';
  sidebarNameConfirmBtn.textContent = options.confirmText || 'Save';

  if (sidebarNameMode === 'screen' && sidebarScreenFields && sidebarPageNoInput && sidebarScreenNameInput) {
    const rawNumber = String(options.pageNo || '').replace(/\D+/g, '');
    const rawName = String(options.screenName || options.value || '').replace(/\.xml$/i, '');
    sidebarScreenFields.classList.remove('hidden');
    sidebarNameLabel.classList.add('hidden');
    sidebarNameInput.classList.add('hidden');
    sidebarNameInput.readOnly = true;
    sidebarPageNoInput.value = rawNumber;
    sidebarScreenNameInput.value = rawName;
    updateSidebarScreenFormattedName();
  } else {
    if (sidebarScreenFields) {
      sidebarScreenFields.classList.add('hidden');
    }
    sidebarNameLabel.classList.remove('hidden');
    sidebarNameInput.classList.remove('hidden');
    sidebarNameInput.readOnly = false;
  }

  sidebarNamePanel.classList.remove('hidden');
  if (sidebarNameMode === 'screen' && sidebarPageNoInput && sidebarScreenNameInput) {
    if (!sidebarPageNoInput.value.trim()) {
      sidebarPageNoInput.focus();
      sidebarPageNoInput.select();
    } else {
      sidebarScreenNameInput.focus();
      sidebarScreenNameInput.select();
    }
  } else {
    sidebarNameInput.focus();
    sidebarNameInput.select();
  }
}

function hideSidebarNamePanel() {
  if (!sidebarNamePanel) {
    return;
  }

  sidebarNameSubmit = null;
  sidebarNameMode = 'single';
  sidebarNamePanel.classList.add('hidden');
}

function setWorkspaceDockTab(tabId) {
  const nextTab = ['properties', 'xml'].includes(String(tabId))
    ? String(tabId)
    : 'properties';
  activeDockTab = nextTab;

  for (const button of workspaceDockTabButtons) {
    const isActive = String(button.dataset.dockTab || '') === nextTab;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  }

  for (const panel of workspaceDockPanels) {
    const isActive = String(panel.dataset.dockPanel || '') === nextTab;
    panel.classList.toggle('active', isActive);
  }
}

function initializeWorkspaceDockTabs() {
  if (!workspaceDockTabs || !workspaceDockTabButtons.length || !workspaceDockPanels.length) {
    return;
  }

  for (const button of workspaceDockTabButtons) {
    button.addEventListener('click', () => {
      setWorkspaceDockTab(button.dataset.dockTab || 'properties');
    });
  }

  setWorkspaceDockTab(activeDockTab);
}

function sanitizeScreenNamePart(value) {
  return String(value || '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function formatScreenNameFromParts(pageNo, screenName) {
  const numberPart = String(pageNo || '').replace(/\D+/g, '').replace(/^0+(?=\d)/, '');
  const namePart = sanitizeScreenNamePart(screenName);
  if (numberPart && namePart) {
    return `${numberPart}_${namePart}`;
  }

  return numberPart || namePart;
}

function updateSidebarScreenFormattedName() {
  if (!sidebarPageNoInput || !sidebarScreenNameInput || !sidebarNameInput) {
    return;
  }

  const formatted = formatScreenNameFromParts(sidebarPageNoInput.value, sidebarScreenNameInput.value) || 'New_Screen';
  sidebarNameInput.value = formatted;
  if (sidebarScreenPreview) {
    sidebarScreenPreview.textContent = formatted;
  }
}

function updatePackageSelection(files = currentDisplayRows) {
  if (activeProjectKey) {
    const record = getProjectScreenByKey(activeProjectKey);
    const projectScreenName = String(record?.screen?.name || '');
    if (projectScreenName) {
      const sourceFiles = Array.isArray(files) ? files : [];
      const base = baseFileName(projectScreenName).toLowerCase();
      const relatedGlobals = sourceFiles
        .filter((file) => isEditableSource(file) && isGlobalObjectFile(file))
        .filter((file) => {
          const fileBase = baseFileName(file.name).toLowerCase();
          return fileBase === `${base}_addons` || fileBase.startsWith(`${base}_addons_`);
        })
        .map((file) => file.name);

      selectedFiles = [...new Set([projectScreenName, ...relatedGlobals])];
      return;
    }
  }

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

function getAllActiveProjectScreenFiles(project) {
  if (!project || !Array.isArray(project.folders)) {
    return [];
  }

  const names = [];
  for (const folder of project.folders) {
    for (const screen of folder?.screens || []) {
      const name = String(screen?.name || '').trim();
      if (!name || !/\.xml$/i.test(name)) {
        continue;
      }
      names.push(name);
    }
  }

  return [...new Set(names)];
}

async function syncActiveProjectScreensToEditedFiles(project) {
  if (!project || !Array.isArray(project.folders)) {
    return [];
  }

  const syncedNames = [];
  for (const folder of project.folders) {
    for (const screen of folder?.screens || []) {
      const name = String(screen?.name || '').trim();
      const xml = String(screen?.xml || '');
      if (!name || !/\.xml$/i.test(name) || !xml.trim()) {
        continue;
      }

      const safeXml = sanitizeXmlForFactoryTalk(xml);
      const res = await fetch(`/api/displays/${encodeURIComponent(name)}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml: safeXml })
      });
      const data = await readApiJson(res);
      if (!res.ok) {
        throw new Error(data.error || `Failed to sync ${name} for package`);
      }

      const meta = readSizeFromXml(safeXml);
      upsertCurrentDisplayRow({
        name,
        source: 'edited',
        sizeBytes: new Blob([safeXml]).size,
        lastModified: new Date().toISOString(),
        width: meta.width,
        height: meta.height
      });
      syncedNames.push(name);
    }
  }

  return [...new Set(syncedNames)];
}

function getTargetDisplayName() {
  const activeProjectRecord = activeProjectKey ? getProjectScreenByKey(activeProjectKey) : null;
  return selectedDisplay || String(activeProjectRecord?.screen?.name || '');
}

async function autoSaveCurrentDisplay() {
  const targetDisplayName = getTargetDisplayName();
  if (!targetDisplayName || !xmlEditor.value.trim()) {
    return true;
  }

  let workingXml = xmlEditor.value;
  const requestedWidth = Number(screenWidth.value);
  const requestedHeight = Number(screenHeight.value);

  if (Number.isFinite(requestedWidth) && requestedWidth > 0 && Number.isFinite(requestedHeight) && requestedHeight > 0) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(workingXml, 'text/xml');
    const parseError = doc.querySelector('parsererror');
    const displaySettings = parseError ? null : doc.querySelector('displaySettings');
    const currentWidth = Number(displaySettings?.getAttribute('width'));
    const currentHeight = Number(displaySettings?.getAttribute('height'));

    if (displaySettings && (currentWidth !== requestedWidth || currentHeight !== requestedHeight)) {
      workingXml = resizeDisplayXml(workingXml, requestedWidth, requestedHeight);
      xmlEditor.value = workingXml;
      recordHistory(workingXml);
      renderPreview();
    }
  }

  const sanitizedXml = sanitizeXmlForFactoryTalk(workingXml);
  if (sanitizedXml !== workingXml) {
    xmlEditor.value = sanitizedXml;
  }

  try {
    await saveDisplayXml(targetDisplayName, sanitizedXml);
    updateCurrentDisplayRow(targetDisplayName, sanitizedXml);
    return true;
  } catch (_err) {
    alert('Could not auto-save the current display. Please try again.');
    return false;
  }
}

async function buildImportPackage(files, packageLabel) {
  const res = await fetch('/api/displays/package', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, packageMode: 'xml' })
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Failed to build package');
    return;
  }

  packageResult.innerHTML = '';
  const warn = document.createElement('div');
  warn.className = 'import-checklist';
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

function disconnectPreviewResizeObserver() {
  if (previewResizeObserver) {
    previewResizeObserver.disconnect();
    previewResizeObserver = null;
  }
}

function fitCanvasToFrame(frame, canvas, width, height) {
  const frameStyles = getComputedStyle(frame);
  const horizontalPadding = parseFloat(frameStyles.paddingLeft || '0') + parseFloat(frameStyles.paddingRight || '0');
  const verticalPadding = parseFloat(frameStyles.paddingTop || '0') + parseFloat(frameStyles.paddingBottom || '0');
  const previewSafeInset = 10;
  const availableWidth = Math.max(1, frame.clientWidth - horizontalPadding - (previewSafeInset * 2));
  const availableHeight = Math.max(1, frame.clientHeight - verticalPadding - (previewSafeInset * 2));

  const scale = Math.min(availableWidth / width, availableHeight / height);
  const finalScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

  let wrap = canvas.parentElement;
  if (!wrap || !wrap.classList.contains('preview-canvas-wrap')) {
    wrap = document.createElement('div');
    wrap.className = 'preview-canvas-wrap';
    if (canvas.parentElement) {
      canvas.parentElement.replaceChild(wrap, canvas);
    }
    wrap.appendChild(canvas);
  }

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.transform = `scale(${finalScale})`;
  canvas.style.transformOrigin = 'top left';
  wrap.style.width = `${Math.round(width * finalScale)}px`;
  wrap.style.height = `${Math.round(height * finalScale)}px`;
  canvas.dataset.previewScale = String(finalScale);
}

function getCanvasScale(canvas, width, height) {
  const uniform = Number(canvas.dataset.previewScale);
  if (Number.isFinite(uniform) && uniform > 0) {
    return { scaleX: uniform, scaleY: uniform };
  }

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
  const sizeToFit = (captionNode?.getAttribute('sizeToFit') || node.getAttribute('sizeToFit') || '').toLowerCase() === 'true';
  const captionText = String(box.textContent || '');
  const hasExplicitBreak = /[\r\n]/.test(captionText);
  const hasFixedSpacing = / {2,}|\t/.test(captionText);
  const useMultiline = wrap || hasExplicitBreak;
  box.style.whiteSpace = useMultiline ? 'pre-line' : (hasFixedSpacing ? 'pre' : 'nowrap');
  box.style.textOverflow = useMultiline ? 'clip' : 'ellipsis';
  box.style.lineHeight = useMultiline ? '1.08' : '1.12';

  if (sizeToFit) {
    box.classList.add('has-caption-overflow');
  } else {
    box.classList.remove('has-caption-overflow');
  }

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

function getPreviewIndicatorStateNode(node) {
  const expr = node.querySelector('connection[name="Indicator"]')?.getAttribute('expression')
    || node.querySelector('connection[name="Value"]')?.getAttribute('expression');
  const resolved = resolvePreviewParameterExpression(expr);
  if (resolved === null || String(resolved).trim() === '') {
    return getActiveStateNode(node);
  }

  const states = Array.from(node.querySelectorAll(':scope > states > state'));
  if (!states.length) {
    return null;
  }

  const match = states.find((state) => {
    const value = state.getAttribute('value');
    return value !== null && String(value) === String(resolved);
  });
  return match || getActiveStateNode(node);
}

function getVisualStateNode(node) {
  const tag = String(node.tagName || '').toLowerCase();
  if (tag === 'multistateindicator') {
    return getPreviewIndicatorStateNode(node);
  }
  return getActiveStateNode(node);
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
    const matched = getPreviewIndicatorStateNode(node);
    const matchedCaption = matched?.querySelector('caption')?.getAttribute('caption');
    return String(matchedCaption || '').trim();
  }

  if (tag === 'stringdisplay' || tag === 'numericdisplay') {
    const expr = node.querySelector('connection[name="Value"]')?.getAttribute('expression')
      || node.querySelector('connection[name="Indicator"]')?.getAttribute('expression');
    const resolved = resolvePreviewParameterExpression(expr);
    if (resolved !== null && String(resolved).trim() !== '') {
      return String(resolved);
    }
  }

  if (tag === 'stringdisplay') {
    const rawExpr = String(node.querySelector('connection[name="Value"]')?.getAttribute('expression') || '');
    if (/\{#\s*\d+\s*\}/i.test(rawExpr)) {
      return rawExpr.trim();
    }

    const expr = rawExpr.toLowerCase();
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
  syncScreenPresetFromInputs();

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

  const popupGroup = getPopupGroupAncestor(node);
  if (popupGroup) {
    copiedObjectXml = new XMLSerializer().serializeToString(popupGroup);
    copiedObjectName = String(popupGroup.getAttribute('name') || node.getAttribute('name') || node.tagName || 'Popup');
    copiedObjectGroupId = copiedObjectName;
    copiedPasteCount = 0;
    return;
  }

  copiedObjectXml = new XMLSerializer().serializeToString(node);
  copiedObjectName = String(node.getAttribute('name') || node.tagName || 'Object');
  copiedObjectGroupId = '';
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

  const sourceNodes = Array.from(wrapperDoc.querySelectorAll('wrapper > *')).filter((item) => item?.tagName);
  if (!sourceNodes.length) {
    return;
  }

  const displaySettings = doc.querySelector('displaySettings');
  const displayWidth = Number(displaySettings?.getAttribute('width')) || Number(screenWidth.value) || DEFAULT_PREVIEW_WIDTH;
  const displayHeight = Number(displaySettings?.getAttribute('height')) || Number(screenHeight.value) || DEFAULT_PREVIEW_HEIGHT;

  copiedPasteCount += 1;
  const shift = 12 * copiedPasteCount;

  const sourceNode = sourceNodes[0];
  const sourceTag = String(sourceNode.tagName || '').toLowerCase();
  if (sourceTag === 'group' && isPopupGroupName(sourceNode.getAttribute('name'))) {
    const newGroup = sourceNode.cloneNode(true);
    const nextGroupName = nextIncrementedName(doc, newGroup.getAttribute('name') || copiedObjectName, POPUP_GROUP_PREFIX);
    newGroup.setAttribute('name', nextGroupName);
    ensureUniquePopupObjectNames(doc, newGroup);
    const groupWidth = Math.max(1, Number(newGroup.getAttribute('width') || 1));
    const groupHeight = Math.max(1, Number(newGroup.getAttribute('height') || 1));
    const groupLeft = Number(newGroup.getAttribute('left') || 0);
    const groupTop = Number(newGroup.getAttribute('top') || 0);
    const nextGroupLeft = clamp(groupLeft + shift, 0, Math.max(0, displayWidth - groupWidth));
    const nextGroupTop = clamp(groupTop + shift, 0, Math.max(0, displayHeight - groupHeight));
    newGroup.setAttribute('left', String(Math.round(nextGroupLeft)));
    newGroup.setAttribute('top', String(Math.round(nextGroupTop)));
    root.appendChild(newGroup);

    xmlEditor.value = serializeXmlDoc(doc);
    recordHistory(xmlEditor.value);

    const nodes = getObjectNodes(doc);
    selectedObjectIndex = nodes.length - 1;
    populateObjectPanel(doc, selectedObjectIndex);
    renderPreview();
    persistCurrentXmlState();
    return;
  }

  const newNode = sourceNode.cloneNode(true);
  const nextName = nextIncrementedName(doc, copiedObjectName, 'Object');
  newNode.setAttribute('name', nextName);

  const nodeWidth = Math.max(1, Number(newNode.getAttribute('width') || 1));
  const nodeHeight = Math.max(1, Number(newNode.getAttribute('height') || 1));
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
  const popupGroup = getPopupGroupAncestor(node);
  if (popupGroup) {
    const groupWidth = Math.max(1, Number(popupGroup.getAttribute('width') || 1));
    const groupHeight = Math.max(1, Number(popupGroup.getAttribute('height') || 1));
    const groupLeft = Number(popupGroup.getAttribute('left') || 0);
    const groupTop = Number(popupGroup.getAttribute('top') || 0);
    const nextGroupLeft = clamp(groupLeft + deltaX, 0, Math.max(0, width - groupWidth));
    const nextGroupTop = clamp(groupTop + deltaY, 0, Math.max(0, height - groupHeight));
    if (nextGroupLeft === groupLeft && nextGroupTop === groupTop) {
      return;
    }

    popupGroup.setAttribute('left', String(Math.round(nextGroupLeft)));
    popupGroup.setAttribute('top', String(Math.round(nextGroupTop)));
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
    return;
  }

  const nextLeft = clamp(left + deltaX, 0, Math.max(0, width - w));
  const nextTop = clamp(top + deltaY, 0, Math.max(0, height - h));
  if (nextLeft === left && nextTop === top) {
    return;
  }

  node.setAttribute('left', String(Math.round(nextLeft)));
  node.setAttribute('top', String(Math.round(nextTop)));
  const groupName = getPopupGroupNameForNode(node);
  movePopupGroupByDelta(doc, groupName, node, nextLeft - left, nextTop - top, width, height);
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
  const popupGroupName = getPopupGroupNameForNode(node);
  if (popupGroupName) {
    let removedAny = false;
    for (const candidate of getPopupGroupNodes(doc, popupGroupName)) {
      if (!candidate || !candidate.parentNode) {
        continue;
      }

      candidate.parentNode.removeChild(candidate);
      removedAny = true;
    }

    if (!removedAny) {
      node.parentNode.removeChild(node);
    }
  } else {
    node.parentNode.removeChild(node);
  }

  xmlEditor.value = serializeXmlDoc(doc);
  recordHistory(xmlEditor.value);

  const activeProject = getActiveProjectForPopupPlanner();
  if (popupGroupName && activeProject) {
    let removedHistory = removeGeneratedPopupHistoryForGroup(activeProject, popupGroupName, activeProjectKey);
    if (!removedHistory) {
      const beforeCount = Array.isArray(activeProject.popupGeneratedRows) ? activeProject.popupGeneratedRows.length : 0;
      activeProject.popupGeneratedRows = (activeProject.popupGeneratedRows || [])
        .filter((entry) => String(entry?.popupGroupName || '') !== String(popupGroupName));
      removedHistory = activeProject.popupGeneratedRows.length !== beforeCount;
    }

    if (removedHistory) {
      saveProjectList();
      renderProjectPopupPlanner();
    }
  }

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

function setDockCollapsed(collapsed) {
  if (!editorLayout || !toggleDockBtn) {
    return;
  }

  const nextCollapsed = Boolean(collapsed);
  editorLayout.classList.toggle('dock-collapsed', nextCollapsed);
  toggleDockBtn.setAttribute('aria-pressed', nextCollapsed ? 'true' : 'false');
  const actionLabel = nextCollapsed ? 'Show tools sidebar' : 'Hide tools sidebar';
  toggleDockBtn.setAttribute('aria-label', actionLabel);
  toggleDockBtn.setAttribute('title', actionLabel);
  localStorage.setItem(DOCK_STORAGE_KEY, nextCollapsed ? '1' : '0');
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
  const targetDisplayName = getTargetDisplayName();
  if (!targetDisplayName || !xmlEditor.value.trim()) {
    return;
  }

  const sanitizedXml = sanitizeXmlForFactoryTalk(xmlEditor.value);
  if (sanitizedXml !== xmlEditor.value) {
    xmlEditor.value = sanitizedXml;
  }

  saveDisplayXml(targetDisplayName, sanitizedXml)
    .then(() => {
      updateCurrentDisplayRow(targetDisplayName, sanitizedXml);
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

function getActiveProjectForPopupPlanner() {
  const project = getActiveProject();
  if (!project) {
    return null;
  }

  ensureProjectPopupData(project);
  return project;
}

function parsePopupTemplateObject(rawXml) {
  const xml = String(rawXml || '').trim();
  if (!xml) {
    return null;
  }

  const parser = new DOMParser();
  const wrapper = parser.parseFromString(`<wrapper>${xml}</wrapper>`, 'text/xml');
  if (wrapper.querySelector('parsererror')) {
    return null;
  }

  return wrapper.querySelector('wrapper > *');
}

function normalizePopupTemplateXml(rawXml) {
  const node = parsePopupTemplateObject(rawXml);
  if (!node) {
    return '';
  }

  const clone = node.cloneNode(true);
  if (!clone.hasAttribute('left')) {
    clone.setAttribute('left', '0');
  }
  if (!clone.hasAttribute('top')) {
    clone.setAttribute('top', '0');
  }
  if (!clone.hasAttribute('width')) {
    clone.setAttribute('width', '220');
  }
  if (!clone.hasAttribute('height')) {
    clone.setAttribute('height', '160');
  }

  return new XMLSerializer().serializeToString(clone);
}

function getGeneratedPopupDraftById(draftId) {
  const key = String(draftId || '');
  return generatedPopupDrafts.find((draft) => draft.id === key) || null;
}

function resolvePopupTemplateForRow(project, row, templatesById) {
  const componentType = String(row?.componentTypeId || '');
  const popupType = String(row?.popupTypeId || '').toLowerCase();

  if (componentType === 'component:conveyor' && popupType === 'vfd') {
    return {
      id: 'preset:conveyor:vfd',
      name: '800_popup (Conveyor VFD)',
      xml: CONVEYOR_VFD_TEMPLATE_XML
    };
  }

  if (componentType === 'component:conveyor' && popupType === 'speed') {
    return {
      id: 'preset:conveyor:speed',
      name: 'Conveyor Speed Popup',
      xml: CONVEYOR_VFD_TEMPLATE_XML
    };
  }

  if (componentType === 'component:pneumatic' && popupType === 'forward_reverse') {
    return {
      id: 'preset:pneumatic:forward_reverse',
      name: 'Pneumatic Forward/Reverse Popup',
      xml: PNEUMATIC_FORWARD_REVERSE_TEMPLATE_XML
    };
  }

  if (componentType.startsWith('template:')) {
    const templateId = componentType.slice('template:'.length);
    const template = templatesById.get(templateId);
    if (template) {
      return template;
    }
  }

  if (
    componentType === 'component:conveyor'
    || componentType === 'component:pneumatic'
    || componentType === 'component:motor'
    || componentType === 'component:servo'
  ) {
    return {
      id: 'preset:conveyor:generic',
      name: 'Component Popup',
      xml: CONVEYOR_VFD_TEMPLATE_XML
    };
  }

  return null;
}

function buildGeneratedPopupDrafts(project) {
  const drafts = [];
  if (!project) {
    return drafts;
  }

  const templates = new Map(project.popupTemplates.map((template) => [template.id, template]));
  const totalByPopupName = new Map();
  for (const row of project.popupPlanRows) {
    syncPopupPlanRowDerivedValues(row);
    const template = resolvePopupTemplateForRow(project, row, templates);
    if (!template) {
      continue;
    }

    const popupName = String(row.popupName || '').trim() || 'Popup';
    const count = Math.max(1, Math.min(200, Number(row.count) || 1));
    totalByPopupName.set(popupName, (totalByPopupName.get(popupName) || 0) + count);
  }

  const sequenceByPopupName = new Map();
  for (const row of project.popupPlanRows) {
    syncPopupPlanRowDerivedValues(row);
    const template = resolvePopupTemplateForRow(project, row, templates);
    if (!template) {
      continue;
    }

    const count = Math.max(1, Math.min(200, Number(row.count) || 1));
    const popupName = String(row.popupName || '').trim() || 'Popup';
    const profile = getPopupTypeProfile(row.popupTypeId);
    const code = suggestPopupCode(popupName, profile.id);
    for (let i = 1; i <= count; i += 1) {
      const nextSequence = (sequenceByPopupName.get(popupName) || 0) + 1;
      sequenceByPopupName.set(popupName, nextSequence);
      drafts.push({
        id: `${project.id}::${row.id}::${template.id}::${i}`,
        projectId: project.id,
        rowId: row.id,
        templateId: template.id,
        templateName: template.name,
        popupName,
        popupTypeId: profile.id,
        popupTypeLabel: profile.label,
        unit: profile.unit,
        code,
        sequence: nextSequence,
        totalForName: totalByPopupName.get(popupName) || count,
        label: `${formatPopupLabel(popupName, nextSequence, totalByPopupName.get(popupName) || count)} - ${template.name} (${profile.label})`,
        xml: template.xml
      });
    }
  }

  return drafts;
}

function createSavedPopupEntry(draft, project, options = {}) {
  const sourceRow = project?.popupPlanRows?.find((row) => String(row.id) === String(draft?.rowId));
  const componentTypeId = String(sourceRow?.componentTypeId || 'component:conveyor');
  const screenRecord = getProjectScreenByKey(String(options.targetScreenKey || activeProjectKey || ''));
  const targetScreenLabel = String(
    options.targetScreenLabel
    || screenRecord?.screen?.name
    || activeProjectScreen
    || selectedDisplay
    || 'Unknown Screen'
  );
  return {
    id: `popup-generated-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    popupName: String(draft?.popupName || 'Popup').trim() || 'Popup',
    sequence: Math.max(1, Number(draft?.sequence) || 1),
    totalForName: Math.max(1, Number(draft?.totalForName) || 1),
    sourceRowId: String(draft?.rowId || ''),
    componentTypeId,
    componentTypeLabel: getComponentTypeLabel(componentTypeId, project),
    templateId: String(draft?.templateId || ''),
    templateName: String(draft?.templateName || 'Popup Template').trim() || 'Popup Template',
    popupTypeId: String(draft?.popupTypeId || 'vfd').toLowerCase(),
    popupTypeLabel: String(draft?.popupTypeLabel || ''),
    code: String(draft?.code || suggestPopupCode(draft?.popupName, draft?.popupTypeId)).trim(),
    popupGroupName: String(options.popupGroupName || ''),
    targetScreenKey: String(options.targetScreenKey || activeProjectKey || ''),
    targetScreenLabel,
    generatedAt: new Date().toISOString()
  };
}

function resolveHistoryTargetScreenLabel(entry) {
  const byKey = getProjectScreenByKey(String(entry?.targetScreenKey || ''));
  if (byKey?.screen?.name) {
    return String(byKey.screen.name);
  }

  const stored = String(entry?.targetScreenLabel || '').trim();
  if (stored && stored.toLowerCase() !== 'active screen') {
    return stored;
  }

  return activeProjectScreen || selectedDisplay || 'Unknown Screen';
}

function removeGeneratedPopupHistoryForGroup(project, popupGroupName, targetScreenKey = activeProjectKey) {
  if (!project || !popupGroupName) {
    return false;
  }

  const groupKey = String(popupGroupName || '');
  const screenKey = String(targetScreenKey || '');
  const beforeCount = Array.isArray(project.popupGeneratedRows) ? project.popupGeneratedRows.length : 0;
  project.popupGeneratedRows = (project.popupGeneratedRows || []).filter((entry) => {
    if (String(entry?.popupGroupName || '') !== groupKey) {
      return true;
    }

    if (!screenKey) {
      return false;
    }

    return String(entry?.targetScreenKey || '') !== screenKey;
  });

  return project.popupGeneratedRows.length !== beforeCount;
}

function resolvePopupTemplateById(project, templateId) {
  const key = String(templateId || '');
  if (!key) {
    return null;
  }

  if (key === 'preset:conveyor:vfd') {
    return {
      id: 'preset:conveyor:vfd',
      name: '800_popup (Conveyor VFD)',
      xml: CONVEYOR_VFD_TEMPLATE_XML
    };
  }

  if (key === 'preset:conveyor:generic') {
    return {
      id: 'preset:conveyor:generic',
      name: 'Conveyor Popup',
      xml: CONVEYOR_VFD_TEMPLATE_XML
    };
  }

  if (key === 'preset:conveyor:speed') {
    return {
      id: 'preset:conveyor:speed',
      name: 'Conveyor Speed Popup',
      xml: CONVEYOR_SPEED_TEMPLATE_XML
    };
  }

  if (key === 'preset:pneumatic:forward_reverse') {
    return {
      id: 'preset:pneumatic:forward_reverse',
      name: 'Pneumatic Forward/Reverse Popup',
      xml: PNEUMATIC_FORWARD_REVERSE_TEMPLATE_XML
    };
  }

  return project?.popupTemplates?.find((template) => String(template.id) === key) || null;
}

function clearGeneratedRowsFromPlannerTable() {
  if (!popupPlanBody) {
    return;
  }

  const staleRows = popupPlanBody.querySelectorAll('tr[data-generated-row="true"], tr[data-generated-header="true"]');
  staleRows.forEach((row) => row.remove());
}

function renderPopupTargetScreenOptions(project) {
  if (!project) {
    plannerTargetScreenKey = '';
    return;
  }

  plannerTargetScreenKey = activeProjectKey && String(activeProjectKey).startsWith(`${project.id}::`)
    ? activeProjectKey
    : '';
}

function copyPopupDraftToClipboardBuffer(draft) {
  if (!draft) {
    return;
  }

  copiedObjectXml = String(draft.xml || '');
  copiedObjectName = formatPopupLabel(draft.popupName || 'Popup', draft.sequence || 1, draft.totalForName || 1);
  copiedObjectGroupId = '';
  copiedPasteCount = 0;
  packageResult.textContent = `Copied popup template: ${draft.label}. Use Ctrl+V to paste into the active screen.`;
}

function formatPopupLabel(popupName, sequence, totalForName = 1) {
  const base = String(popupName || '').trim() || 'Popup';
  const seq = Math.max(1, Number(sequence) || 1);
  const total = Math.max(1, Number(totalForName) || 1);
  return total > 1 ? `${base}_${seq}` : base;
}

function applyPopupDraftAttributes(newNode, draft) {
  const profile = getPopupTypeProfile(draft.popupTypeId);
  const popupLabel = formatPopupLabel(draft.popupName, draft.sequence, draft.totalForName);
  const shouldOverrideTitle = profile.id === 'vfd' || profile.id === 'speed';

  const directCaption = String(newNode.getAttribute('caption') || '').trim();
  if (directCaption) {
    newNode.setAttribute('caption', popupLabel);
  }

  const allNodes = [newNode, ...Array.from(newNode.querySelectorAll('*'))];
  for (const node of allNodes) {
    const tag = String(node.tagName || '').toLowerCase();
    const nodeName = String(node.getAttribute('name') || '').toLowerCase();

    if (node.hasAttribute('caption')) {
      const currentCaption = String(node.getAttribute('caption') || '').trim();
      if ((shouldOverrideTitle && nodeName.includes('title')) || currentCaption.toLowerCase().startsWith('mrtc')) {
        node.setAttribute('caption', popupLabel);
      }

      if (
        nodeName.includes('unit')
        || ['hz', 'rpm', 'bar', '%', 'degc', 'deg c', 'c'].includes(currentCaption.toLowerCase())
      ) {
        node.setAttribute('caption', profile.unit);
      }
    }

    if (tag === 'numericinputcursorpoint') {
      node.setAttribute('minValue', profile.min);
      node.setAttribute('maxValue', profile.max);
      node.setAttribute('decimalPlaces', profile.decimalPlaces);
      node.setAttribute('digitsAfterDecimalPoint', profile.decimalPlaces);
      node.setAttribute('numberOfDigits', profile.numberOfDigits);

      const valueConnection = node.querySelector('connections > connection[name="Value"]');
      const indicatorConnection = node.querySelector('connections > connection[name="Indicator"]');
      if (valueConnection) {
        valueConnection.setAttribute('expression', draft.code);
      }
      if (indicatorConnection) {
        indicatorConnection.setAttribute('expression', draft.code);
      }
    }
  }
}

function popupNameSuffixFromGroup(groupName) {
  const raw = String(groupName || '').trim();
  if (!raw) {
    return '1';
  }

  const tailNumber = raw.match(/(\d+)$/);
  if (tailNumber) {
    return tailNumber[1];
  }

  const token = toCodeToken(raw) || '1';
  return token.slice(-8);
}

function ensureUniquePopupObjectNames(doc, popupGroup) {
  if (!doc || !popupGroup || String(popupGroup.tagName || '').toLowerCase() !== 'group') {
    return;
  }

  const suffix = popupNameSuffixFromGroup(popupGroup.getAttribute('name'));
  const allNodes = [popupGroup, ...Array.from(popupGroup.querySelectorAll('*'))];
  for (const node of allNodes) {
    if (node === popupGroup || !node?.hasAttribute || !node.hasAttribute('name')) {
      continue;
    }

    const tag = String(node.tagName || '').toLowerCase();
    const isVisual = node.hasAttribute('left') && node.hasAttribute('top');
    if (!isVisual || tag === 'connection' || tag === 'connections' || tag === 'parameters' || tag === 'parameter') {
      continue;
    }

    const currentName = String(node.getAttribute('name') || '').trim();
    if (!currentName) {
      continue;
    }

    const withSuffix = currentName.endsWith(`_${suffix}`) ? currentName : `${currentName}_${suffix}`;
    const nextName = nextIncrementedName(doc, withSuffix, 'PopupObject');
    node.setAttribute('name', nextName);
  }
}

function insertGeneratedPopupDraft(draft, options = {}) {
  if (!draft) {
    return null;
  }

  const xml = xmlEditor.value.trim();
  if (!xml) {
    alert('Open a project screen XML first.');
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) {
    alert('XML parse error. Fix XML before inserting generated popup.');
    return null;
  }

  const root = doc.querySelector('gfx');
  if (!root) {
    alert('Could not find gfx root in XML.');
    return null;
  }

  const templateNode = parsePopupTemplateObject(draft.xml);
  if (!templateNode) {
    alert(`Template XML for ${draft.templateName} is invalid.`);
    return null;
  }

  const newNode = templateNode.cloneNode(true);
  const popupLabel = formatPopupLabel(draft.popupName, draft.sequence, draft.totalForName);
  const popupLabelToken = toCodeToken(popupLabel) || 'POPUP';
  const sourceName = `${POPUP_GROUP_PREFIX}_${popupLabelToken}`;
  newNode.setAttribute('name', nextIncrementedName(doc, sourceName, POPUP_GROUP_PREFIX));
  ensureUniquePopupObjectNames(doc, newNode);

  const displaySettings = doc.querySelector('displaySettings');
  const displayWidth = Number(displaySettings?.getAttribute('width')) || Number(screenWidth.value) || DEFAULT_PREVIEW_WIDTH;
  const displayHeight = Number(displaySettings?.getAttribute('height')) || Number(screenHeight.value) || DEFAULT_PREVIEW_HEIGHT;

  const nodeWidth = Math.max(1, Number(newNode.getAttribute('width') || 220));
  const nodeHeight = Math.max(1, Number(newNode.getAttribute('height') || 160));

  const leftFromDrop = Number(options.left);
  const topFromDrop = Number(options.top);
  const nextLeft = Number.isFinite(leftFromDrop)
    ? clamp(leftFromDrop, 0, Math.max(0, displayWidth - nodeWidth))
    : Math.max(0, Math.round((displayWidth - nodeWidth) / 2));
  const nextTop = Number.isFinite(topFromDrop)
    ? clamp(topFromDrop, 0, Math.max(0, displayHeight - nodeHeight))
    : Math.max(0, Math.round((displayHeight - nodeHeight) / 2));

  newNode.setAttribute('left', String(Math.round(nextLeft)));
  newNode.setAttribute('top', String(Math.round(nextTop)));
  newNode.setAttribute('width', String(Math.round(nodeWidth)));
  newNode.setAttribute('height', String(Math.round(nodeHeight)));

  applyPopupDraftAttributes(newNode, draft);

  root.appendChild(newNode);
  xmlEditor.value = serializeXmlDoc(doc);
  recordHistory(xmlEditor.value);

  const nodes = getObjectNodes(doc);
  selectedObjectIndex = nodes.length - 1;
  populateObjectPanel(doc, selectedObjectIndex);
  renderPreview();
  persistCurrentXmlState();
  return {
    popupGroupName: String(newNode.getAttribute('name') || ''),
    targetScreenKey: String(activeProjectKey || ''),
    targetScreenLabel: String(activeProjectScreen || selectedDisplay || 'Active Screen')
  };
}

function renderPopupTemplateOptions(project) {
  if (!project) {
    plannerSelectedTemplateId = '';
    return;
  }

  if (plannerSelectedTemplateId && project.popupTemplates.some((template) => template.id === plannerSelectedTemplateId)) {
    return;
  }

  plannerSelectedTemplateId = project.popupTemplates[0]?.id || '';
}

function renderPopupPlanRows(project) {
  if (!popupPlanBody) {
    return;
  }

  popupPlanBody.innerHTML = '';
  if (!project) {
    return;
  }

  for (const row of project.popupPlanRows) {
    syncPopupPlanRowDerivedValues(row);
    const tr = document.createElement('tr');
    tr.dataset.rowId = row.id;

    const nameTd = document.createElement('td');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = row.popupName;
    nameInput.placeholder = 'MRTC03';
    nameInput.addEventListener('input', () => {
      row.popupName = String(nameInput.value || '').trim();
      syncPopupPlanRowDerivedValues(row);
      saveProjectList();
      refreshPopupPlannerDraftViews(project);
    });
    nameTd.appendChild(nameInput);

    const typeTd = document.createElement('td');
    const typeSelect = document.createElement('select');
    for (const component of COMPONENT_TYPES) {
      const option = document.createElement('option');
      option.value = component.id;
      option.textContent = component.label;
      typeSelect.appendChild(option);
    }

    if (project.popupTemplates.length) {
      const divider = document.createElement('option');
      divider.value = '';
      divider.textContent = '--- Custom Templates ---';
      divider.disabled = true;
      typeSelect.appendChild(divider);
    }

    for (const template of project.popupTemplates) {
      const option = document.createElement('option');
      option.value = `template:${template.id}`;
      option.textContent = template.name;
      typeSelect.appendChild(option);
    }

    typeSelect.value = row.componentTypeId || 'component:conveyor';
    typeSelect.addEventListener('change', () => {
      row.componentTypeId = String(typeSelect.value || 'component:conveyor');
      syncPopupPlanRowDerivedValues(row);
      saveProjectList();
      refreshPopupPlannerDraftViews(project);
    });
    typeTd.appendChild(typeSelect);

    const popupTypeTd = document.createElement('td');
    const popupTypeSelect = document.createElement('select');
    for (const profile of POPUP_TYPE_PROFILES) {
      const option = document.createElement('option');
      option.value = profile.id;
      option.textContent = profile.unit ? `${profile.label} (${profile.unit})` : profile.label;
      popupTypeSelect.appendChild(option);
    }
    popupTypeSelect.value = row.popupTypeId || 'vfd';
    popupTypeSelect.addEventListener('change', () => {
      row.popupTypeId = String(popupTypeSelect.value || 'vfd');
      syncPopupPlanRowDerivedValues(row);
      saveProjectList();
      refreshPopupPlannerDraftViews(project);
    });
    popupTypeTd.appendChild(popupTypeSelect);

    const countTd = document.createElement('td');
    const countInput = document.createElement('input');
    countInput.type = 'number';
    countInput.min = '1';
    countInput.max = '200';
    countInput.value = String(row.count || 1);
    countInput.addEventListener('input', () => {
      row.count = Math.max(1, Math.min(200, Number(countInput.value) || 1));
      syncPopupPlanRowDerivedValues(row);
      countInput.value = String(row.count);
      saveProjectList();
      refreshPopupPlannerDraftViews(project);
    });
    const countWrap = document.createElement('div');
    countWrap.className = 'planner-count-cell';
    countWrap.appendChild(countInput);
    countTd.appendChild(countWrap);

    const targetTd = document.createElement('td');
    const activeScreenLabel = document.createElement('span');
    activeScreenLabel.className = 'planner-target-placeholder';
    activeScreenLabel.textContent = activeProjectScreen || selectedDisplay || 'No screen selected';
    targetTd.appendChild(activeScreenLabel);

    const generatedTd = document.createElement('td');
    const rowDraftCount = generatedPopupDrafts.filter((draft) => draft.rowId === row.id).length;
    generatedTd.textContent = rowDraftCount ? String(rowDraftCount) : '-';
    generatedTd.title = rowDraftCount
      ? `${rowDraftCount} popup(s) ready — drag from palette or click Generate`
      : String(row.code || '');

    const actionTd = document.createElement('td');
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'tree-action-btn danger';
    removeBtn.textContent = 'X';
    removeBtn.title = 'Remove row';
    removeBtn.addEventListener('click', () => {
      project.popupPlanRows = project.popupPlanRows.filter((item) => item.id !== row.id);
      saveProjectList();
      renderProjectPopupPlanner();
    });
    actionTd.appendChild(removeBtn);

    tr.appendChild(nameTd);
    tr.appendChild(typeTd);
    tr.appendChild(popupTypeTd);
    tr.appendChild(countTd);
    tr.appendChild(targetTd);
    tr.appendChild(generatedTd);
    tr.appendChild(actionTd);
    popupPlanBody.appendChild(tr);
  }

}

function syncPopupPlanRowsFromTable(project) {
  if (!project || !popupPlanBody) {
    return;
  }

  const rowById = new Map(project.popupPlanRows.map((row) => [row.id, row]));
  for (const tr of popupPlanBody.querySelectorAll('tr')) {
    const rowId = String(tr.dataset.rowId || '');
    const row = rowById.get(rowId);
    if (!row) {
      continue;
    }

    const textInput = tr.querySelector('input[type="text"]');
    const selects = tr.querySelectorAll('select');
    const numberInput = tr.querySelector('input[type="number"]');

    row.popupName = String(textInput?.value || row.popupName || '').trim();
    row.componentTypeId = String(selects[0]?.value || row.componentTypeId || 'component:conveyor');
    row.popupTypeId = String(selects[1]?.value || row.popupTypeId || 'vfd');
    row.count = Math.max(1, Math.min(200, Number(numberInput?.value) || row.count || 1));
    syncPopupPlanRowDerivedValues(row);
  }
}

function refreshPopupPlannerDraftViews(project) {
  generatedPopupDrafts = buildGeneratedPopupDrafts(project);
  renderPopupPalette(project);
}

function renderPopupPalette(project) {
  if (!popupPlanBody) {
    return;
  }

  clearGeneratedRowsFromPlannerTable();

  const savedRows = Array.isArray(project?.popupGeneratedRows) ? project.popupGeneratedRows : [];
  if (!project || !savedRows.length) {
    return;
  }

  const titleTr = document.createElement('tr');
  titleTr.className = 'planner-generated-inline-title';
  titleTr.dataset.generatedHeader = 'true';
  const titleTd = document.createElement('td');
  titleTd.colSpan = 7;
  titleTd.textContent = 'Generated Popup History';
  titleTr.appendChild(titleTd);
  popupPlanBody.appendChild(titleTr);

  const rows = [...savedRows].reverse();
  for (const entry of rows) {
    const tr = document.createElement('tr');
    tr.className = 'planner-generated-row';
    tr.dataset.generatedRow = 'true';
    const profile = getPopupTypeProfile(entry.popupTypeId);
    const popupLabel = formatPopupLabel(entry.popupName, entry.sequence, entry.totalForName);

    const nameTd = document.createElement('td');
    nameTd.textContent = popupLabel;

    const templateTd = document.createElement('td');
    templateTd.textContent = entry.componentTypeLabel
      || getComponentTypeLabel(entry.componentTypeId, project)
      || 'Conveyor';

    const typeTd = document.createElement('td');
    typeTd.textContent = entry.popupTypeLabel || profile.label;

    const countTd = document.createElement('td');
    countTd.textContent = '1';

    const targetTd = document.createElement('td');
    targetTd.textContent = resolveHistoryTargetScreenLabel(entry);

    const generatedTd = document.createElement('td');
    generatedTd.textContent = new Date(entry.generatedAt).toLocaleString();

    const actionsTd = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'tree-action-btn danger';
    deleteBtn.textContent = 'X';
    deleteBtn.title = 'Delete generated entry';
    deleteBtn.addEventListener('click', () => {
      if (entry?.popupGroupName) {
        removePopupGroupFromCurrentXml(String(entry.popupGroupName));
      }

      project.popupGeneratedRows = project.popupGeneratedRows.filter((item) => String(item.id) !== String(entry.id));
      saveProjectList();
      renderProjectPopupPlanner();
    });
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(nameTd);
    tr.appendChild(templateTd);
    tr.appendChild(typeTd);
    tr.appendChild(countTd);
    tr.appendChild(targetTd);
    tr.appendChild(generatedTd);
    tr.appendChild(actionsTd);
    popupPlanBody.appendChild(tr);
  }
}

function applyPlannerTemplateSelection(project) {
  if (!project || !plannerSelectedTemplateId) {
    return;
  }
}

function renderProjectPopupPlanner() {
  const project = getActiveProjectForPopupPlanner();
  const disabled = !project;
  const controls = [
    addPopupPlanRowBtn,
    generatePopupsBtn
  ].filter(Boolean);

  controls.forEach((control) => {
    control.disabled = disabled;
  });

  if (popupPlannerDetails) {
    popupPlannerDetails.classList.toggle('is-disabled', disabled);
  }

  renderPopupTemplateOptions(project);
  applyPlannerTemplateSelection(project);
  renderPopupTargetScreenOptions(project);
  generatedPopupDrafts = buildGeneratedPopupDrafts(project);
  renderPopupPlanRows(project);
  renderPopupPalette(project);
}

function setEditorDisplay(name, xml) {
  activeProjectKey = '';
  activeProjectFolder = '';
  activeProjectScreen = '';
  activeProjectCsvKey = '';
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
  syncScreenPresetFromInputs();

  if (currentProjectName === 'Untitled Project') {
    setProjectName(baseFileName(name));
  }

  updatePackageSelection(currentDisplayRows);
  renderPreview();
  renderProjectPopupPlanner();
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
  syncScreenPresetFromInputs();

  if (currentProjectName === 'Untitled Project') {
    setProjectName(baseFileName(name));
  }

  updatePackageSelection(currentDisplayRows);
  renderPreview();
  renderProjectPopupPlanner();
}

async function readUploadedText(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes.slice(2));
  }

  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes.slice(2));
  }

  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes.slice(3));
  }

  // Heuristic fallback for BOM-less UTF-16 exports.
  if (bytes.length >= 8) {
    let evenZeroCount = 0;
    let oddZeroCount = 0;
    const sample = Math.min(bytes.length, 512);
    for (let i = 0; i < sample; i++) {
      if (bytes[i] === 0) {
        if (i % 2 === 0) {
          evenZeroCount += 1;
        } else {
          oddZeroCount += 1;
        }
      }
    }

    if (oddZeroCount > evenZeroCount * 2) {
      return new TextDecoder('utf-16le').decode(bytes);
    }

    if (evenZeroCount > oddZeroCount * 2) {
      return new TextDecoder('utf-16be').decode(bytes);
    }
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

async function saveDisplayXml(name, xml, options = {}) {
  const safeXml = sanitizeXmlForFactoryTalk(xml);
  const forceStandalone = Boolean(options?.forceStandalone);

  if (activeProjectKey && !forceStandalone) {
    const record = getProjectScreenByKey(activeProjectKey);
    if (record) {
      const meta = screenMetaFromXml(record.screen.name, safeXml);
      const res = await fetch(`/api/displays/${encodeURIComponent(record.screen.name)}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml: safeXml })
      });
      const data = await readApiJson(res);
      if (!res.ok) {
        throw new Error(data.error || `Failed to save ${record.screen.name}`);
      }

      record.screen.xml = safeXml;
      record.screen.width = meta.width;
      record.screen.height = meta.height;
      record.screen.sizeBytes = meta.sizeBytes;
      record.screen.lastModified = meta.lastModified;

      upsertCurrentDisplayRow({
        name: record.screen.name,
        source: 'edited',
        sizeBytes: meta.sizeBytes,
        lastModified: meta.lastModified,
        width: meta.width,
        height: meta.height
      });

      saveProjectList();
      renderProjectSidebar();
      return { ok: true, saved: record.screen.name, projectId: record.project.id, mirrored: true };
    }
  }

  const res = await fetch(`/api/displays/${encodeURIComponent(name)}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ xml: safeXml })
  });

  const data = await readApiJson(res);
  if (!res.ok) {
    throw new Error(data.error || `Failed to save ${name}`);
  }

  return data;
}

function sanitizeXmlForFactoryTalk(xml) {
  const source = String(xml || '');
  if (!source.trim()) {
    return source;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(source, 'text/xml');
    if (doc.querySelector('parsererror')) {
      return source;
    }

    let changed = false;

    const nodes = doc.querySelectorAll('[popupGroupId]');
    nodes.forEach((node) => {
      node.removeAttribute('popupGroupId');
      changed = true;
    });

    const nonVisualTags = ['connections', 'connection'];
    for (const tag of nonVisualTags) {
      const badNodes = doc.querySelectorAll(`${tag}[left], ${tag}[top], ${tag}[width], ${tag}[height]`);
      badNodes.forEach((node) => {
        node.removeAttribute('left');
        node.removeAttribute('top');
        node.removeAttribute('width');
        node.removeAttribute('height');
        changed = true;
      });
    }

    const numericInputs = doc.querySelectorAll('numericInputCursorPoint');
    numericInputs.forEach((node) => {
      if (node.hasAttribute('caption')) {
        node.removeAttribute('caption');
        changed = true;
      }

      const invalidCaptionChildren = Array.from(node.children).filter((child) => String(child.tagName || '').toLowerCase() === 'caption');
      invalidCaptionChildren.forEach((child) => {
        node.removeChild(child);
        changed = true;
      });
    });

    const rectangles = doc.querySelectorAll('rectangle');
    rectangles.forEach((node) => {
      const borderWidth = node.getAttribute('borderWidth');
      if (borderWidth) {
        if (!node.hasAttribute('lineWidth')) {
          node.setAttribute('lineWidth', borderWidth);
        }
        node.removeAttribute('borderWidth');
        changed = true;
      }

      const borderColor = node.getAttribute('borderColor');
      if (borderColor) {
        if (!node.hasAttribute('foreColor')) {
          node.setAttribute('foreColor', borderColor);
        }
        node.removeAttribute('borderColor');
        changed = true;
      }

      const borderStyle = node.getAttribute('borderStyle');
      if (borderStyle) {
        if (!node.hasAttribute('lineStyle')) {
          const mapped = String(borderStyle).trim().toLowerCase() === 'line' ? 'solid' : String(borderStyle).trim();
          if (mapped) {
            node.setAttribute('lineStyle', mapped);
          }
        }
        node.removeAttribute('borderStyle');
        changed = true;
      }

      if (node.hasAttribute('borderUsesBackColor')) {
        node.removeAttribute('borderUsesBackColor');
        changed = true;
      }

      const unsupportedRectangleAttrs = [
        'fontFamily',
        'fontSize',
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'charHeight',
        'charWidth',
        'alignment',
        'wordWrap',
        'sizeToFit',
        'caption'
      ];
      unsupportedRectangleAttrs.forEach((attr) => {
        if (node.hasAttribute(attr)) {
          node.removeAttribute(attr);
          changed = true;
        }
      });
    });

    const multistateIndicators = doc.querySelectorAll('multistateIndicator');
    multistateIndicators.forEach((node) => {
      ['fontSize', 'lineWidth'].forEach((attr) => {
        if (node.hasAttribute(attr)) {
          node.removeAttribute(attr);
          changed = true;
        }
      });
    });

    const nonVisualCleanup = [
      { tag: 'states', attrs: ['left', 'top', 'width', 'height', 'fontSize', 'borderWidth', 'lineWidth'] },
      { tag: 'state', attrs: ['left', 'top', 'width', 'height', 'fontSize', 'borderWidth', 'lineWidth'] },
      { tag: 'connections', attrs: ['left', 'top', 'width', 'height', 'fontSize', 'borderWidth', 'lineWidth'] },
      { tag: 'connection', attrs: ['left', 'top', 'width', 'height', 'fontSize', 'borderWidth', 'lineWidth'] },
      { tag: 'imageSettings', attrs: ['left', 'top', 'width', 'height', 'fontSize', 'borderWidth', 'lineWidth'] },
      { tag: 'caption', attrs: ['left', 'top', 'width', 'height', 'borderWidth', 'lineWidth'] }
    ];
    nonVisualCleanup.forEach(({ tag, attrs }) => {
      doc.querySelectorAll(tag).forEach((node) => {
        attrs.forEach((attr) => {
          if (node.hasAttribute(attr)) {
            node.removeAttribute(attr);
            changed = true;
          }
        });
      });
    });

    const parameterBlocks = doc.querySelectorAll('parameters');
    parameterBlocks.forEach((node) => {
      const parent = node.parentElement;
      if (!parent) {
        return;
      }

      const isReferenceObject = String(parent.getAttribute('isReferenceObject') || '').toLowerCase() === 'true';
      if (!isReferenceObject) {
        parent.removeChild(node);
        changed = true;
      }
    });

    const popupGroups = Array.from(doc.querySelectorAll('group')).filter((group) => isPopupGroupName(group.getAttribute('name')));
    popupGroups.forEach((group) => {
      const descendants = Array.from(group.querySelectorAll('*'))
        .filter((node) => node.hasAttribute('left') && node.hasAttribute('top'));
      if (!descendants.length) {
        return;
      }

      const points = descendants
        .map((node) => ({
          node,
          left: Number(node.getAttribute('left')),
          top: Number(node.getAttribute('top'))
        }))
        .filter((entry) => Number.isFinite(entry.left) && Number.isFinite(entry.top));
      if (!points.length) {
        return;
      }

      const minLeft = Math.min(...points.map((entry) => entry.left));
      const minTop = Math.min(...points.map((entry) => entry.top));
      const groupWidth = Math.max(1, Number(group.getAttribute('width') || 1));
      const groupHeight = Math.max(1, Number(group.getAttribute('height') || 1));

      // Normalize only when popup children are clearly stored as absolute display coordinates.
      const appearsAbsolute = minLeft > groupWidth || minTop > groupHeight;
      if (!appearsAbsolute) {
        return;
      }

      points.forEach((entry) => {
        entry.node.setAttribute('left', String(Math.round(entry.left - minLeft)));
        entry.node.setAttribute('top', String(Math.round(entry.top - minTop)));
      });
      group.setAttribute('left', String(Math.round(minLeft)));
      group.setAttribute('top', String(Math.round(minTop)));
      changed = true;
    });

    if (!changed) {
      return source;
    }

    return serializeXmlDoc(doc);
  } catch (_err) {
    return source;
  }
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
  currentDisplayRows = currentDisplayRows.map((file) => displayKey(file.name) === displayKey(name)
    ? {
        ...file,
        source: 'edited',
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
  saveActiveProjectCsvFromEditor();
  activeProjectCsvKey = '';
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

  const customFolderSet = new Set(folderNames.map((name) => name.toLowerCase()));

  const appendSectionHeader = (title) => {
    const section = document.createElement('li');
    section.className = 'list-section';
    section.textContent = title;
    displaysList.appendChild(section);
  };

  const appendFileRow = (file, options = {}) => {
    const isGlobalObject = Boolean(options.isGlobalObject);
    const namePrefix = isGlobalObject ? '* ' : '';
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
    const sourceLabel = isGlobalObject ? `${file.source} | global object` : file.source;
    meta.textContent = `${sourceLabel} | ${sizeLabel} | ${kb(file.sizeBytes)}\n${shortDateTime(file.lastModified)}`;

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
      toggle.textContent = '';

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
    toggle.textContent = '';

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
    });

    displaysList.appendChild(section);
    return children;
  };

  const appendDefaultFileRow = (file, options = {}) => {
    const isGlobalObject = Boolean(options.isGlobalObject);
    const appendTo = options.appendTo || displaysList;
    const namePrefix = isGlobalObject ? '* ' : '';

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
    toggle.textContent = ''; // direction via CSS .collapsed on folder-item

    const folderCount = document.createElement('span');
    folderCount.className = 'folder-count';
    folderCount.textContent = `${folderFiles.length}`;

    folderRow.appendChild(toggle);
    folderRow.appendChild(folderLabel);
    folderRow.appendChild(folderCount);

    folderRow.addEventListener('click', () => {
      const collapsed = folderLi.classList.toggle('collapsed');
      // direction handled by CSS .collapsed on parent
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
  enforceProjectSidebarLayout();

  normalizeProjectList();
  if (!projectList.length) {
    displaysList.innerHTML = '<li>No projects yet. Click New Project to create one.</li>';
    enforceProjectSidebarLayout();
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
    row.dataset.projectId = project.id;
    if (project.id === activeProjectId) {
      row.classList.add('selected');
    }

    const toggle = document.createElement('span');
    toggle.className = 'project-toggle';
    toggle.textContent = ''; // direction via CSS .collapsed on project-item

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
    removeProjectBtn.textContent = 'X';
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
    toggle.textContent = ''; // direction via CSS .collapsed on folder-item

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
        mode: 'screen',
        label: `Screen ID for ${folder.name}`,
        pageNo: '',
        screenName: 'New Screen',
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

    for (const screen of sortFolderScreens(folder.screens)) {
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
      meta.className = 'screen-meta';
      const sizeLabel = screen.width && screen.height ? `${screen.width}x${screen.height}` : 'size unknown';
      const metaMain = document.createElement('div');
      metaMain.className = 'screen-meta-main';
      metaMain.textContent = `project screen | ${sizeLabel} | ${kb(screen.sizeBytes)}`;

      const metaTime = document.createElement('div');
      metaTime.className = 'screen-meta-time';
      metaTime.textContent = shortDateTime(screen.lastModified);

      meta.appendChild(metaMain);
      meta.appendChild(metaTime);

      const actions = document.createElement('div');
      actions.className = 'tree-actions';

      const removeScreenBtn = document.createElement('button');
      removeScreenBtn.type = 'button';
      removeScreenBtn.className = 'tree-action-btn danger';
      removeScreenBtn.textContent = 'X';
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

  const appendCsvSection = (project, kind, label, appendTo) => {
    ensureProjectCsvData(project);
    const files = getProjectCsvFiles(project, kind);
    const collapsedKey = kind === 'parameters' ? 'parametersCollapsed' : 'tagsCollapsed';

    const sectionLi = document.createElement('li');
    sectionLi.className = 'folder-item csv-section-item';

    if (project[collapsedKey]) {
      sectionLi.classList.add('collapsed');
    }

    const sectionRow = document.createElement('div');
    sectionRow.className = 'folder-row csv-section-row';

    const toggle = document.createElement('span');
    toggle.className = 'folder-toggle';

    const sectionLabel = document.createElement('span');
    sectionLabel.className = 'folder-name';
    sectionLabel.textContent = label;

    const sectionCount = document.createElement('span');
    sectionCount.className = 'folder-count';
    sectionCount.textContent = `${files.length}`;

    const sectionActions = document.createElement('div');
    sectionActions.className = 'tree-actions';

    if (kind === 'parameters' && files.length) {
      const exportAllBtn = document.createElement('button');
      exportAllBtn.type = 'button';
      exportAllBtn.className = 'tree-action-btn';
      exportAllBtn.textContent = '↓';
      exportAllBtn.title = 'Export all parameter files (.par)';
      exportAllBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        try {
          await exportAllProjectParameterFiles(project);
        } catch (err) {
          console.error(err);
          alert(err.message || 'Could not export parameter files.');
        }
      });
      sectionActions.appendChild(exportAllBtn);
    }

    if (kind === 'tags' && files.length) {
      const exportAllTagsBtn = document.createElement('button');
      exportAllTagsBtn.type = 'button';
      exportAllTagsBtn.className = 'tree-action-btn';
      exportAllTagsBtn.textContent = '↓';
      exportAllTagsBtn.title = 'Download all Tags CSV files for FactoryTalk';
      exportAllTagsBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        try {
          await exportAllProjectTagsCsvFiles(project);
        } catch (err) {
          console.error(err);
          alert(err.message || 'Could not export Tags CSV files.');
        }
      });
      sectionActions.appendChild(exportAllTagsBtn);
    }

    const addCsvBtn = document.createElement('button');
    addCsvBtn.type = 'button';
    addCsvBtn.className = 'tree-action-btn';
    addCsvBtn.textContent = '+';
    addCsvBtn.title = kind === 'tags'
      ? 'Import FactoryTalk Tags CSV'
      : 'Add parameter file (.par) with preview notes';
    addCsvBtn.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (kind === 'parameters') {
        try {
          await addProjectParameterFile(project.id);
        } catch (err) {
          console.error(err);
          alert(err.message || 'Could not add parameter file.');
        }
        return;
      }
      queueProjectCsvUpload(project.id, kind);
    });

    sectionActions.appendChild(addCsvBtn);
    sectionRow.appendChild(toggle);
    sectionRow.appendChild(sectionLabel);
    sectionRow.appendChild(sectionCount);
    sectionRow.appendChild(sectionActions);
    sectionLi.appendChild(sectionRow);

    const children = document.createElement('ul');
    children.className = 'folder-children';

    for (const file of files) {
      const fileLi = document.createElement('li');
      fileLi.className = 'display-item csv-item';
      fileLi.dataset.projectId = project.id;
      fileLi.dataset.csvKind = kind;
      fileLi.dataset.csvId = file.id;

      const csvKey = createProjectCsvKey(project.id, kind, file.id);
      if (activeProjectCsvKey === csvKey) {
        fileLi.classList.add('active');
      }

      const row = document.createElement('div');
      row.className = 'list-row';

      const name = document.createElement('strong');
      name.textContent = file.name;
      row.appendChild(name);

      const meta = document.createElement('div');
      meta.className = 'screen-meta';
      const metaMain = document.createElement('div');
      metaMain.className = 'screen-meta-main';
      metaMain.textContent = kind === 'parameters' && /\.par$/i.test(file.name)
        ? `parameter file | ${kb(file.sizeBytes)}`
        : `${kind} csv | ${kb(file.sizeBytes)}`;
      const metaTime = document.createElement('div');
      metaTime.className = 'screen-meta-time';
      metaTime.textContent = shortDateTime(file.lastModified);
      meta.appendChild(metaMain);
      meta.appendChild(metaTime);

      const actions = document.createElement('div');
      actions.className = 'tree-actions';

      if (kind === 'parameters' && /\.par$/i.test(file.name)) {
        const exportBtn = document.createElement('button');
        exportBtn.type = 'button';
        exportBtn.className = 'tree-action-btn';
        exportBtn.textContent = '↓';
        exportBtn.title = `Export ${file.name}`;
        exportBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          try {
            exportProjectParameterFile(project, file);
          } catch (err) {
            console.error(err);
            alert(err.message || 'Could not export parameter file.');
          }
        });
        actions.appendChild(exportBtn);
      }

      if (kind === 'tags') {
        const exportTagsBtn = document.createElement('button');
        exportTagsBtn.type = 'button';
        exportTagsBtn.className = 'tree-action-btn';
        exportTagsBtn.textContent = '↓';
        exportTagsBtn.title = `Download ${file.name} for FactoryTalk`;
        exportTagsBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          try {
            exportProjectTagsCsvFile(project, file);
          } catch (err) {
            console.error(err);
            alert(err.message || 'Could not export Tags CSV.');
          }
        });
        actions.appendChild(exportTagsBtn);
      }

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'tree-action-btn danger';
      removeBtn.textContent = 'X';
      removeBtn.title = `Remove ${file.name}`;
      removeBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (!window.confirm(`Remove ${file.name}?`)) {
          return;
        }
        removeProjectCsvFile(project.id, kind, file.id);
      });
      actions.appendChild(removeBtn);

      fileLi.appendChild(row);
      fileLi.appendChild(meta);
      fileLi.appendChild(actions);
      fileLi.addEventListener('click', () => {
        openProjectCsvFile(project, kind, file);
      });
      children.appendChild(fileLi);
    }

    sectionRow.addEventListener('click', () => {
      project[collapsedKey] = !project[collapsedKey];
      saveProjectList();
      renderProjectSidebar();
    });

    sectionLi.appendChild(children);
    appendTo.appendChild(sectionLi);
  };

  const appendIoListSection = (project, appendTo) => {
    ensureProjectCsvData(project);
    const files = project.ioListFiles || [];
    const generatedTags = getProjectPrimaryTagsFile(project);

    const sectionLi = document.createElement('li');
    sectionLi.className = 'folder-item csv-section-item io-list-section-item';

    if (project.ioListCollapsed) {
      sectionLi.classList.add('collapsed');
    }

    const sectionRow = document.createElement('div');
    sectionRow.className = 'folder-row csv-section-row';

    const toggle = document.createElement('span');
    toggle.className = 'folder-toggle';

    const sectionLabel = document.createElement('span');
    sectionLabel.className = 'folder-name';
    sectionLabel.textContent = 'IO List';

    const sectionCount = document.createElement('span');
    sectionCount.className = 'folder-count';
    sectionCount.textContent = `${files.length}`;

    const sectionActions = document.createElement('div');
    sectionActions.className = 'tree-actions';

    const addIoBtn = document.createElement('button');
    addIoBtn.type = 'button';
    addIoBtn.className = 'tree-action-btn';
    addIoBtn.textContent = '+';
    addIoBtn.title = 'Upload IO list (.xlsx Master Sheet or FactoryTalk CSV/TXT) — builds Tags.CSV and preview data';
    addIoBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      queueIoListUpload(project.id);
    });

    sectionActions.appendChild(addIoBtn);
    sectionRow.appendChild(toggle);
    sectionRow.appendChild(sectionLabel);
    sectionRow.appendChild(sectionCount);
    sectionRow.appendChild(sectionActions);
    sectionLi.appendChild(sectionRow);

    const children = document.createElement('ul');
    children.className = 'folder-children';

    if (generatedTags && (files.length || project.ioListMeta)) {
      const tagsLi = document.createElement('li');
      tagsLi.className = 'display-item csv-item io-generated-tags-item';
      tagsLi.title = 'Auto-generated FactoryTalk Tags CSV from IO list upload';

      const row = document.createElement('div');
      row.className = 'list-row';

      const name = document.createElement('strong');
      name.textContent = generatedTags.name;
      row.appendChild(name);

      const meta = document.createElement('div');
      meta.className = 'screen-meta';
      const metaMain = document.createElement('div');
      metaMain.className = 'screen-meta-main';
      metaMain.textContent = 'generated tags | open in Tags';
      meta.appendChild(metaMain);

      tagsLi.appendChild(row);
      tagsLi.appendChild(meta);

      const tagsActions = document.createElement('div');
      tagsActions.className = 'tree-actions';
      const exportGeneratedTagsBtn = document.createElement('button');
      exportGeneratedTagsBtn.type = 'button';
      exportGeneratedTagsBtn.className = 'tree-action-btn';
      exportGeneratedTagsBtn.textContent = '↓';
      exportGeneratedTagsBtn.title = `Download ${generatedTags.name} for FactoryTalk`;
      exportGeneratedTagsBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        try {
          exportProjectTagsCsvFile(project, generatedTags);
        } catch (err) {
          console.error(err);
          alert(err.message || 'Could not export Tags CSV.');
        }
      });
      tagsActions.appendChild(exportGeneratedTagsBtn);
      tagsLi.appendChild(tagsActions);

      tagsLi.addEventListener('click', (event) => {
        event.stopPropagation();
        openProjectCsvFile(project, 'tags', generatedTags);
      });
      children.appendChild(tagsLi);
    }

    for (const file of files) {
      const fileLi = document.createElement('li');
      fileLi.className = 'display-item csv-item io-list-item';
      fileLi.dataset.projectId = project.id;
      fileLi.dataset.ioListId = file.id;

      const ioKey = createProjectIoListKey(project.id, file.id);
      if (activeIoListFileKey === ioKey) {
        fileLi.classList.add('active');
      }

      const row = document.createElement('div');
      row.className = 'list-row';

      const name = document.createElement('strong');
      name.textContent = file.name;
      row.appendChild(name);

      const meta = document.createElement('div');
      meta.className = 'screen-meta';
      const metaMain = document.createElement('div');
      metaMain.className = 'screen-meta-main';
      metaMain.textContent = `io source | ${kb(file.sizeBytes)}`;
      const metaTime = document.createElement('div');
      metaTime.className = 'screen-meta-time';
      metaTime.textContent = shortDateTime(file.lastModified);
      meta.appendChild(metaMain);
      meta.appendChild(metaTime);

      const actions = document.createElement('div');
      actions.className = 'tree-actions';
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'tree-action-btn danger';
      removeBtn.textContent = 'X';
      removeBtn.title = `Remove ${file.name}`;
      removeBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (!window.confirm(`Remove ${file.name}?`)) {
          return;
        }
        removeProjectIoListFile(project.id, file.id);
      });
      actions.appendChild(removeBtn);

      fileLi.appendChild(row);
      fileLi.appendChild(meta);
      fileLi.appendChild(actions);
      fileLi.addEventListener('click', () => {
        openProjectIoListFile(project, file);
      });
      children.appendChild(fileLi);
    }

    sectionRow.addEventListener('click', () => {
      project.ioListCollapsed = !project.ioListCollapsed;
      saveProjectList();
      renderProjectSidebar();
    });

    sectionLi.appendChild(children);
    appendTo.appendChild(sectionLi);
  };

  for (const project of projectList) {
    const { section, children } = appendProjectHeader(project);
    const sortedFolders = [...(project.folders || [])].sort((a, b) => {
      const numDiff = getFolderNumberPrefix(a?.name) - getFolderNumberPrefix(b?.name);
      if (numDiff !== 0) {
        return numDiff;
      }
      return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, { numeric: true, sensitivity: 'base' });
    });
    for (const folder of sortedFolders) {
      appendFolder(project, folder, children);
    }
    appendCsvSection(project, 'tags', 'Tags', children);
    appendCsvSection(project, 'parameters', 'Parameters', children);
    appendIoListSection(project, children);
    displaysList.appendChild(section);
  }

  if (sidebarTitle) {
    sidebarTitle.textContent = 'Projects';
  }

  enforceProjectSidebarLayout();
}

function updateProjectSidebarSelection() {
  if (!displaysList) {
    return;
  }

  const activeKey = activeProjectKey;
  const activeProject = activeProjectId;

  for (const projectRow of displaysList.querySelectorAll('.project-row')) {
    const rowProjectId = String(projectRow.dataset.projectId || '');
    projectRow.classList.toggle('selected', rowProjectId === activeProject);
  }

  for (const screenItem of displaysList.querySelectorAll('.display-item')) {
    const screenProjectId = String(screenItem.dataset.projectId || '');
    const folderName = String(screenItem.dataset.folderName || '');
    const screenName = String(screenItem.dataset.screenName || '');
    const csvKind = String(screenItem.dataset.csvKind || '');
    const csvId = String(screenItem.dataset.csvId || '');

    if (csvKind && csvId) {
      const csvKey = createProjectCsvKey(screenProjectId, csvKind, csvId);
      screenItem.classList.toggle('active', csvKey === activeProjectCsvKey);
      continue;
    }

    const ioListId = String(screenItem.dataset.ioListId || '');
    if (ioListId) {
      const ioKey = createProjectIoListKey(screenProjectId, ioListId);
      screenItem.classList.toggle('active', ioKey === activeIoListFileKey);
      continue;
    }

    const itemKey = createProjectKey(screenProjectId, folderName, screenName);
    screenItem.classList.toggle('active', itemKey === activeKey);
  }
}

function ensureProjectSidebarWheelScroll() {
  if (!displaysList) {
    return;
  }

  const onSidebarWheel = (event) => {
    if (!displaysList) {
      return;
    }

    const canScroll = displaysList.scrollHeight > displaysList.clientHeight;
    if (!canScroll) {
      return;
    }

    const delta = Number(event.deltaY) || 0;
    if (!delta) {
      return;
    }

    const maxScrollTop = Math.max(0, displaysList.scrollHeight - displaysList.clientHeight);
    const nextScrollTop = Math.min(maxScrollTop, Math.max(0, displaysList.scrollTop + delta));

    if (nextScrollTop !== displaysList.scrollTop) {
      event.preventDefault();
      displaysList.scrollTop = nextScrollTop;
    }
  };

  if (displaysList.dataset.wheelScrollBound !== '1') {
    displaysList.dataset.wheelScrollBound = '1';
    displaysList.addEventListener('wheel', onSidebarWheel, { passive: false });
  }

  if (exportsCard && exportsCard.dataset.wheelScrollBound !== '1') {
    exportsCard.dataset.wheelScrollBound = '1';
    exportsCard.addEventListener('wheel', onSidebarWheel, { passive: false });
  }
}

function enforceProjectSidebarLayout() {
  if (!exportsCard || !displaysList) {
    return;
  }

  // Force a stable scroll container even if older CSS rules conflict.
  exportsCard.style.setProperty('display', 'flex', 'important');
  exportsCard.style.setProperty('flex-direction', 'column', 'important');
  exportsCard.style.setProperty('min-height', '0', 'important');
  exportsCard.style.setProperty('height', '100%', 'important');
  exportsCard.style.setProperty('overflow', 'hidden', 'important');

  displaysList.style.setProperty('flex', '1 1 0', 'important');
  displaysList.style.setProperty('min-height', '0', 'important');
  displaysList.style.setProperty('height', '100%', 'important');
  displaysList.style.setProperty('max-height', 'none', 'important');
  displaysList.style.setProperty('overflow-y', 'auto', 'important');
  displaysList.style.setProperty('overflow-x', 'hidden', 'important');
  displaysList.style.setProperty('overscroll-behavior', 'contain', 'important');
  displaysList.style.setProperty('pointer-events', 'auto', 'important');

  // Keep project tree rows in normal document flow so scrollHeight reflects full content.
  const flowSelectors = [
    '#displaysList.single-list > li',
    '#displaysList .project-item',
    '#displaysList .project-children',
    '#displaysList .folder-item',
    '#displaysList .folder-children',
    '#displaysList .display-item'
  ];

  for (const selector of flowSelectors) {
    const nodes = document.querySelectorAll(selector);
    for (const node of nodes) {
      // Never force display:block on collapsed children - that breaks expand/collapse.
      const isCollapsedChild =
        (node.classList.contains('project-children') && node.closest('.project-item.collapsed')) ||
        (node.classList.contains('folder-children') && node.closest('.folder-item.collapsed'));
      node.style.setProperty('height', 'auto', 'important');
      node.style.setProperty('max-height', 'none', 'important');
      node.style.setProperty('min-height', '0', 'important');
      if (!isCollapsedChild) {
        node.style.setProperty('display', 'block', 'important');
      }
      node.style.setProperty('position', 'static', 'important');
      node.style.setProperty('overflow', 'visible', 'important');
      node.style.setProperty('transform', 'none', 'important');
      node.style.setProperty('flex', '0 0 auto', 'important');
    }
  }

  for (const node of document.querySelectorAll('#displaysList .display-item')) {
    node.style.setProperty('display', 'grid', 'important');
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
    return '#EFEFEF';
  }

  const normalized = color.toLowerCase();
  // FactoryTalk white screens are visually closer to an HMI neutral gray.
  if (normalized === 'white' || normalized === '#fff' || normalized === '#ffffff') {
    return '#EFEFEF';
  }

  return color;
}

function resolveDisplayBackgroundStyle(displaySettings) {
  if (!displaySettings) {
    return '#EFEFEF';
  }

  const backColor = resolveDisplayBackgroundColor(displaySettings.getAttribute('backColor'));
  const useGradient = String(displaySettings.getAttribute('useGradientStyle') || '').toLowerCase() === 'true';
  const endColor = String(displaySettings.getAttribute('endColor') || '').trim();
  if (useGradient && endColor) {
    return `linear-gradient(${gradientDirectionCss(displaySettings.getAttribute('gradientDirection'))}, ${backColor}, ${endColor})`;
  }

  return backColor;
}

function applyPreviewDisplayBackground(frame, canvas, displaySettings) {
  const backgroundStyle = resolveDisplayBackgroundStyle(displaySettings);
  if (frame) {
    frame.style.setProperty('background', backgroundStyle, 'important');
  }
  if (canvas) {
    canvas.style.setProperty('background', backgroundStyle, 'important');
  }
}

function renderPreview() {
  previewImageNonce = Date.now();
  currentPreviewIoProject = getPreviewIoProject();
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

  previewPane.innerHTML = '';
  disconnectPreviewResizeObserver();

  const frame = document.createElement('div');
  frame.className = 'preview-frame';

  const canvas = document.createElement('div');
  canvas.className = 'xml-canvas preview-display-canvas';
  applyPreviewDisplayBackground(frame, canvas, displaySettings);

  canvas.addEventListener('dragover', (event) => {
    if (!event.dataTransfer?.types?.includes('application/x-popup-draft-id')) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    canvas.classList.add('popup-drop-ready');
  });

  canvas.addEventListener('dragleave', () => {
    canvas.classList.remove('popup-drop-ready');
  });

  canvas.addEventListener('drop', async (event) => {
    const draftId = event.dataTransfer?.getData('application/x-popup-draft-id');
    if (!draftId) {
      return;
    }

    event.preventDefault();
    canvas.classList.remove('popup-drop-ready');
    const draft = getGeneratedPopupDraftById(draftId);
    if (!draft) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const left = (px / Math.max(1, rect.width)) * width;
    const top = (py / Math.max(1, rect.height)) * height;
    const inserted = insertGeneratedPopupDraft(draft, { left, top });
    if (inserted) {
      await autoSaveCurrentDisplay();
    }
  });

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
      const activeStateNode = getVisualStateNode(el);
      const visualSource = activeStateNode || el;
      const absolutePosition = getNodeAbsolutePosition(el);
      const left = absolutePosition.left;
      const top = absolutePosition.top;
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

      if (tag === 'group') {
        box.classList.add('xml-group-object');
        appendGroupPreviewChildren(el, box, w, h);
      }

      const captionNode = Array.from(visualSource.children).find((child) => child.tagName === 'caption')
        || Array.from(el.children).find((child) => child.tagName === 'caption');
      const imageName = getNodeImageName(visualSource) || getNodeImageName(el);
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
      if (caption && tag !== 'group') {
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

        const previousPosition = getNodeAbsolutePosition(node);
        const previousLeft = previousPosition.left;
        const previousTop = previousPosition.top;
        const previousWidth = Math.max(1, Number(node.getAttribute('width') || 1));
        const previousHeight = Math.max(1, Number(node.getAttribute('height') || 1));

        const popupGroup = getPopupGroupAncestor(node);
        const movedOnly = Math.round(nextWidth) === Math.round(previousWidth)
          && Math.round(nextHeight) === Math.round(previousHeight);
        if (movedOnly && popupGroup) {
          const groupWidth = Math.max(1, Number(popupGroup.getAttribute('width') || 1));
          const groupHeight = Math.max(1, Number(popupGroup.getAttribute('height') || 1));
          const currentGroupLeft = Number(popupGroup.getAttribute('left') || 0);
          const currentGroupTop = Number(popupGroup.getAttribute('top') || 0);
          const deltaLeft = Math.round(nextLeft) - Math.round(previousLeft);
          const deltaTop = Math.round(nextTop) - Math.round(previousTop);
          const nextGroupLeft = clamp(currentGroupLeft + deltaLeft, 0, Math.max(0, width - groupWidth));
          const nextGroupTop = clamp(currentGroupTop + deltaTop, 0, Math.max(0, height - groupHeight));
          popupGroup.setAttribute('left', String(Math.round(nextGroupLeft)));
          popupGroup.setAttribute('top', String(Math.round(nextGroupTop)));
        } else {
          node.setAttribute('left', String(Math.round(nextLeft)));
          node.setAttribute('top', String(Math.round(nextTop)));
          node.setAttribute('width', String(Math.max(1, Math.round(nextWidth))));
          node.setAttribute('height', String(Math.max(1, Math.round(nextHeight))));

          if (movedOnly) {
            const groupId = getPopupGroupNameForNode(node);
            movePopupGroupByDelta(
              workingDoc,
              groupId,
              node,
              Math.round(nextLeft) - Math.round(previousLeft),
              Math.round(nextTop) - Math.round(previousTop),
              width,
              height
            );
          }
        }

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

  const wrap = document.createElement('div');
  wrap.className = 'preview-canvas-wrap';
  wrap.appendChild(canvas);
  frame.appendChild(wrap);

  if (isIoListPreviewScreenActive()) {
    const ioStatus = getIoPreviewStatus(getPreviewIoProject());
    if (!ioStatus.ready) {
      const banner = document.createElement('div');
      banner.className = 'preview-io-banner';
      banner.textContent = ioStatus.reason;
      frame.insertBefore(banner, frame.firstChild);
    }
  }

  previewPane.appendChild(frame);

  const refitPreview = () => fitCanvasToFrame(frame, canvas, width, height);
  refitPreview();
  requestAnimationFrame(refitPreview);
  setTimeout(refitPreview, 60);

  if (typeof ResizeObserver !== 'undefined') {
    previewResizeObserver = new ResizeObserver(() => refitPreview());
    previewResizeObserver.observe(frame);
  }
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
  if (!node?.hasAttribute?.(attributeName)) {
    return;
  }

  const value = Number(node.getAttribute(attributeName));
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
  const nonVisualTags = new Set(['caption', 'imagesettings', 'states', 'state', 'connections', 'connection', 'animations', 'animation', 'parameters', 'parameter']);

  Array.from(doc.querySelectorAll('gfx *')).forEach((node) => {
    if (!node?.tagName || node.tagName === 'displaySettings') {
      return;
    }

    const tag = String(node.tagName || '').toLowerCase();
    if (nonVisualTags.has(tag)) {
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

      const childTag = String(child.tagName || '').toLowerCase();
      if (childTag === 'caption') {
        scaleNumericAttribute(child, 'fontSize', strokeScale, 1);
      }
    });
  });

  displaySettings.setAttribute('width', String(Math.round(nextWidth)));
  displaySettings.setAttribute('height', String(Math.round(nextHeight)));
  return serializeXmlDoc(doc);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function movePopupGroupByDelta(doc, groupName, excludeNode, deltaX, deltaY, displayWidth, displayHeight) {
  if (!groupName || (!deltaX && !deltaY)) {
    return;
  }

  const popupGroups = Array.from(doc.querySelectorAll('group')).filter(
    (group) => String(group.getAttribute('name') || '') === String(groupName)
  );
  if (popupGroups.length) {
    const group = popupGroups[0];
    const currentLeft = Number(group.getAttribute('left') || 0);
    const currentTop = Number(group.getAttribute('top') || 0);
    const groupWidth = Math.max(1, Number(group.getAttribute('width') || 1));
    const groupHeight = Math.max(1, Number(group.getAttribute('height') || 1));
    const nextLeft = clamp(currentLeft + deltaX, 0, Math.max(0, displayWidth - groupWidth));
    const nextTop = clamp(currentTop + deltaY, 0, Math.max(0, displayHeight - groupHeight));
    group.setAttribute('left', String(Math.round(nextLeft)));
    group.setAttribute('top', String(Math.round(nextTop)));
    return;
  }

  const nodes = getObjectNodes(doc);
  for (const item of nodes) {
    if (!item || item === excludeNode) {
      continue;
    }

    if (getPopupGroupNameForNode(item) !== String(groupName)) {
      continue;
    }

    if (!item.hasAttribute('left') || !item.hasAttribute('top')) {
      continue;
    }

    const currentLeft = Number(item.getAttribute('left'));
    const currentTop = Number(item.getAttribute('top'));
    const itemWidth = Math.max(1, Number(item.getAttribute('width') || 1));
    const itemHeight = Math.max(1, Number(item.getAttribute('height') || 1));
    if (!Number.isFinite(currentLeft) || !Number.isFinite(currentTop)) {
      continue;
    }

    const nextLeft = clamp(currentLeft + deltaX, 0, Math.max(0, displayWidth - itemWidth));
    const nextTop = clamp(currentTop + deltaY, 0, Math.max(0, displayHeight - itemHeight));
    item.setAttribute('left', String(Math.round(nextLeft)));
    item.setAttribute('top', String(Math.round(nextTop)));
  }
}

function getNodeAbsolutePosition(node) {
  let left = 0;
  let top = 0;
  let current = node;

  while (current && current.tagName) {
    if (current.hasAttribute('left')) {
      const value = Number(current.getAttribute('left'));
      if (Number.isFinite(value)) {
        left += value;
      }
    }
    if (current.hasAttribute('top')) {
      const value = Number(current.getAttribute('top'));
      if (Number.isFinite(value)) {
        top += value;
      }
    }

    const parent = current.parentNode;
    if (!parent || String(parent.tagName || '').toLowerCase() === 'gfx') {
      break;
    }
    current = parent;
  }

  return { left, top };
}

function isPopupGroupName(name) {
  const value = String(name || '').trim();
  if (!value) {
    return false;
  }

  if (value.toLowerCase().startsWith(POPUP_GROUP_PREFIX.toLowerCase())) {
    return true;
  }

  return /(?:^|_)popup(?:_|$)/i.test(value);
}

function getPopupGroupAncestor(node) {
  let current = node;
  while (current && current.tagName) {
    if (String(current.tagName || '').toLowerCase() === 'group' && isPopupGroupName(current.getAttribute('name'))) {
      return current;
    }

    const parent = current.parentNode;
    if (!parent || String(parent.tagName || '').toLowerCase() === 'gfx') {
      break;
    }
    current = parent;
  }

  return null;
}

function getPopupGroupNameForNode(node) {
  const group = getPopupGroupAncestor(node);
  return String(group?.getAttribute('name') || '');
}

function getPopupGroupNodes(doc, groupName) {
  const key = String(groupName || '');
  if (!key) {
    return [];
  }

  return getObjectNodes(doc).filter((item) => getPopupGroupNameForNode(item) === key);
}

function removePopupGroupFromCurrentXml(popupGroupName) {
  const groupKey = String(popupGroupName || '');
  if (!groupKey || !xmlEditor?.value?.trim()) {
    return false;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlEditor.value, 'text/xml');
  if (doc.querySelector('parsererror')) {
    return false;
  }

  let removedCount = 0;
  for (const candidate of getPopupGroupNodes(doc, groupKey)) {
    if (!candidate || !candidate.parentNode) {
      continue;
    }

    candidate.parentNode.removeChild(candidate);
    removedCount += 1;
  }

  // Some templates are inserted as a single object instead of a <group>,
  // so also remove nodes whose own name matches the saved popup group name.
  const namedNodes = Array.from(doc.querySelectorAll('[name]'))
    .filter((node) => String(node.getAttribute('name') || '') === groupKey);
  for (const node of namedNodes) {
    if (!node || !node.parentNode) {
      continue;
    }

    node.parentNode.removeChild(node);
    removedCount += 1;
  }

  if (!removedCount) {
    return false;
  }

  xmlEditor.value = serializeXmlDoc(doc);
  recordHistory(xmlEditor.value);

  const remaining = getObjectNodes(doc);
  if (!remaining.length) {
    selectedObjectIndex = null;
    clearObjectPanel();
  } else if (selectedObjectIndex !== null) {
    selectedObjectIndex = Math.max(0, Math.min(selectedObjectIndex, remaining.length - 1));
    populateObjectPanel(doc, selectedObjectIndex);
  }

  renderPreview();
  persistCurrentXmlState();
  return true;
}

function shiftPositionedNodesInTree(rootNode, deltaX, deltaY, displayWidth, displayHeight) {
  const allNodes = [rootNode, ...Array.from(rootNode.querySelectorAll('*'))];
  for (const node of allNodes) {
    if (!node || !node.hasAttribute || !node.hasAttribute('left') || !node.hasAttribute('top')) {
      continue;
    }

    const currentLeft = Number(node.getAttribute('left'));
    const currentTop = Number(node.getAttribute('top'));
    const nodeWidth = Math.max(1, Number(node.getAttribute('width') || 1));
    const nodeHeight = Math.max(1, Number(node.getAttribute('height') || 1));
    if (!Number.isFinite(currentLeft) || !Number.isFinite(currentTop)) {
      continue;
    }

    const nextLeft = clamp(currentLeft + deltaX, 0, Math.max(0, displayWidth - nodeWidth));
    const nextTop = clamp(currentTop + deltaY, 0, Math.max(0, displayHeight - nodeHeight));
    node.setAttribute('left', String(Math.round(nextLeft)));
    node.setAttribute('top', String(Math.round(nextTop)));
  }
}

function appendGroupPreviewChildren(groupNode, container, groupWidth, groupHeight) {
  const gw = Math.max(1, groupWidth);
  const gh = Math.max(1, groupHeight);

  const renderChild = (node, parentEl) => {
    if (!node?.tagName) {
      return;
    }

    const tag = String(node.tagName || '').toLowerCase();
    if (tag === 'displaysettings' || tag === 'caption' || tag === 'imagesettings' || tag === 'states'
      || tag === 'state' || tag === 'connections' || tag === 'connection' || tag === 'animations'
      || tag === 'animation' || tag === 'parameters' || tag === 'parameter') {
      return;
    }

    if (tag === 'group') {
      Array.from(node.children).forEach((child) => renderChild(child, parentEl));
      return;
    }

    const isLineTag = tag === 'line';
    const hasBox = node.hasAttribute('left') && node.hasAttribute('top')
      && node.hasAttribute('width') && node.hasAttribute('height');

    if (!hasBox && !isLineTag) {
      Array.from(node.children).forEach((child) => renderChild(child, parentEl));
      return;
    }

    const activeStateNode = getVisualStateNode(node);
    const visualSource = activeStateNode || node;
    const childBox = document.createElement('div');
    childBox.className = 'xml-group-child';

    if (isLineTag) {
      const points = parseLinePoints(node);
      const dx = points.x2 - points.x1;
      const dy = points.y2 - points.y1;
      const length = Math.max(1, Math.sqrt((dx * dx) + (dy * dy)));
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const thickness = Math.max(1, Number(node.getAttribute('lineWidth')) || 1);

      childBox.classList.add('xml-line-object');
      childBox.style.left = `${(points.x1 / gw) * 100}%`;
      childBox.style.top = `${(points.y1 / gh) * 100}%`;
      childBox.style.width = `${(length / gw) * 100}%`;
      childBox.style.height = `${(thickness / gh) * 100}%`;
      childBox.style.transform = `rotate(${angle}deg)`;
      childBox.style.transformOrigin = '0 50%';
      childBox.style.padding = '0';
      childBox.style.background = node.getAttribute('foreColor') || node.getAttribute('backColor') || '#000000';
    } else {
      const cl = Number(node.getAttribute('left') || 0);
      const ct = Number(node.getAttribute('top') || 0);
      const cw = Math.max(1, Number(node.getAttribute('width') || 1));
      const ch = Math.max(1, Number(node.getAttribute('height') || 1));
      childBox.style.left = `${(cl / gw) * 100}%`;
      childBox.style.top = `${(ct / gh) * 100}%`;
      childBox.style.width = `${(cw / gw) * 100}%`;
      childBox.style.height = `${(ch / gh) * 100}%`;
      applyFillStyles(childBox, visualSource);
      applyBorderStyles(childBox, node, visualSource);
    }

    const captionNode = Array.from(visualSource.children).find((child) => child.tagName === 'caption')
      || Array.from(node.children).find((child) => child.tagName === 'caption');
    const caption = previewTextForNode(node, captionNode);
    if (caption) {
      const captionEl = document.createElement('span');
      captionEl.className = 'xml-object-caption';
      captionEl.textContent = caption;
      childBox.appendChild(captionEl);
      applyCaptionStyles(childBox, node, captionNode);
    }

    if ((tag === 'stringdisplay' || tag === 'numericdisplay') && node.getAttribute('foreColor')) {
      childBox.style.color = node.getAttribute('foreColor');
    }

    parentEl.appendChild(childBox);
  };

  Array.from(groupNode.children).forEach((child) => renderChild(child, container));
}

function getObjectNodes(doc) {
  const root = doc.querySelector('gfx');
  if (!root) {
    return [];
  }

  const NON_VISUAL_TAGS = new Set([
    'caption',
    'imagesettings',
    'states',
    'state',
    'connections',
    'connection',
    'animations',
    'animation',
    'parameters',
    'parameter'
  ]);

  const nodes = [];
  const walk = (parent) => {
    Array.from(parent.children).forEach((child) => {
      if (!child?.tagName || child.tagName === 'displaySettings') {
        return;
      }

      const tag = String(child.tagName || '').toLowerCase();
      if (NON_VISUAL_TAGS.has(tag)) {
        return;
      }

      const isPositionedGroup = tag === 'group'
        && child.hasAttribute('left')
        && child.hasAttribute('top')
        && child.hasAttribute('width')
        && child.hasAttribute('height');

      if (isPositionedGroup) {
        nodes.push(child);
        return;
      }

      if (
        child.hasAttribute('left')
        && child.hasAttribute('top')
        && child.hasAttribute('width')
        && child.hasAttribute('height')
      ) {
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
  setWorkspaceDockTab('properties');
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
  // XMLSerializer adds xmlns="" to elements with no namespace - remove them
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
  const nodeTag = String(node.tagName || '').toLowerCase();
  const supportsCaptionChild = [
    'gotobutton',
    'momentarybutton',
    'pushbutton',
    'button',
    'multistatepushbutton'
  ].includes(nodeTag);
  const nextCaption = objCaption.value || node.getAttribute('name') || node.tagName;
  const needsCaption = hasNodeCaption || Boolean(captionNode) || objCaption.value.trim() || objTextColor.value.trim();

  if (hasNodeCaption) {
    node.setAttribute('caption', nextCaption);
  }

  if (!captionNode && supportsCaptionChild && needsCaption && !hasNodeCaption) {
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
  saveActiveProjectCsvFromEditor();
  saveActiveProjectIoListFromEditor();
  activeProjectCsvKey = '';
  activeIoListFileKey = '';
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
  syncScreenPresetFromInputs();

  renderPreview();
  renderProjectPopupPlanner();
}

async function openProjectScreen(projectId, folderName, screenName, options = {}) {
  const project = getProjectById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const screen = findProjectScreen(project, folderName, screenName);
  if (!screen) {
    throw new Error('Screen not found');
  }

  if (isIoListPreviewScreenName(screenName) && !ioListScreenUsesCurrentTemplate(screen.xml)) {
    const folder = findProjectFolder(project, folderName);
    await syncProjectIoListScreenFromTemplate(project, { folder, screen });
  }

  if (isCycleTimeScreenName(screenName) && !cycleTimeScreenUsesCurrentTemplate(screen.xml)) {
    const folder = findProjectFolder(project, folderName);
    await syncProjectCycleTimeScreenFromTemplate(project, { folder, screen });
  }

  const nextKey = createProjectKey(projectId, folderName, screenName);
  if (activeProjectKey === nextKey) {
    updateProjectSidebarSelection();
    renderPreview();
    return;
  }

  if (!options.skipSave) {
    if (activeProjectCsvKey) {
      saveActiveProjectCsvFromEditor();
    } else if (activeProjectKey && xmlEditor.value.trim()) {
      const saved = await autoSaveCurrentDisplay();
      if (!saved) {
        return;
      }
    }
  }

  setEditorProjectScreen(project, folderName, screen, screen.xml);
  updateProjectSidebarSelection();
}

function isImportableDisplayFileName(name) {
  const lower = String(name || '').toLowerCase();
  return lower.endsWith('.xml') && !lower.startsWith('batchimport_');
}

async function processStandaloneDisplayUploads(files, emptyMessage) {
  const importable = Array.from(files || [])
    .filter((file) => isImportableDisplayFileName(file?.name));

  if (!importable.length) {
    throw new Error(emptyMessage || 'No XML files selected.');
  }

  const uploadedRows = [];
  const failed = [];

  for (const file of importable) {
    try {
      const xml = await readUploadedText(file);
      const row = validateDisplayXml(file.name, xml);
      await saveDisplayXml(file.name, xml, { forceStandalone: true });
      hiddenDisplayNames.delete(displayKey(file.name));
      uploadedRows.push(row);
    } catch (err) {
      console.error(err);
      failed.push(`${file.name}: ${err?.message || 'Invalid XML'}`);
    }
  }

  if (!uploadedRows.length) {
    throw new Error(failed.length
      ? `No files uploaded. First error: ${failed[0]}`
      : 'No files uploaded.');
  }

  usingUploadedList = true;
  renderDisplays(uploadedRows.sort((a, b) => a.lastModified.localeCompare(b.lastModified)));
  await loadDisplay(uploadedRows[0].name);

  if (failed.length) {
    alert(`Uploaded ${uploadedRows.length} file(s). Skipped ${failed.length} file(s).\nFirst issue: ${failed[0]}`);
  }
}

function deriveFolderProjectName(files, fallbackName = '') {
  const preferred = normalizeProjectName(fallbackName || '');
  if (preferred && preferred !== 'Untitled Project') {
    return preferred;
  }

  for (const file of Array.from(files || [])) {
    const relativePath = String(file?.webkitRelativePath || file?.relativePath || '').trim();
    if (!relativePath) {
      continue;
    }

    const first = relativePath.split(/[\\/]+/).filter(Boolean)[0];
    if (first) {
      return normalizeProjectName(first);
    }
  }

  return normalizeProjectName('Imported Project');
}

function uniqueProjectName(baseName) {
  const cleanBase = normalizeProjectName(baseName || 'Imported Project');
  const existing = new Set((projectList || []).map((project) => displayKey(project?.name)));
  if (!existing.has(displayKey(cleanBase))) {
    return cleanBase;
  }

  let counter = 2;
  while (existing.has(displayKey(`${cleanBase} ${counter}`))) {
    counter += 1;
  }

  return `${cleanBase} ${counter}`;
}

function folderNameFromRelativePath(relativePath) {
  const parts = String(relativePath || '').split(/[\\/]+/).filter(Boolean);
  if (parts.length <= 2) {
    return 'Ungrouped';
  }

  const folderParts = parts.slice(1, -1).map((part) => normalizeFolderName(part)).filter(Boolean);
  if (!folderParts.length) {
    return 'Ungrouped';
  }

  return folderParts.join(' / ');
}

async function processProjectFolderImport(files, options = {}) {
  const fileList = Array.from(files || []).filter((file) => isImportableDisplayFileName(file?.name));
  if (!fileList.length) {
    throw new Error(options.emptyMessage || 'No XML display files found in the selected folder.');
  }

  const project = {
    id: `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: uniqueProjectName(deriveFolderProjectName(fileList, options.projectName || '')),
    collapsed: false,
    popupTemplates: [],
    popupPlanRows: [],
    tagsFiles: [],
    parametersFiles: [],
    ioListFiles: [],
    tagsCollapsed: false,
    parametersCollapsed: false,
    ioListCollapsed: false,
    ioListPreviewPage: 1,
    ioListPreviewZone: '',
    ioListSheets: [],
    folders: []
  };

  const importedScreens = [];
  const failed = [];
  const allFiles = Array.from(files || []);
  const csvFiles = allFiles.filter((file) => String(file?.name || '').toLowerCase().endsWith('.csv'));

  for (const file of fileList) {
    try {
      const xml = await readUploadedText(file);
      validateDisplayXml(file.name, xml);
      await saveDisplayXml(file.name, xml, { forceStandalone: true });

      const relativePath = String(file.webkitRelativePath || file.relativePath || file.name || '');
      const folderName = folderNameFromRelativePath(relativePath);
      const folder = ensureProjectFolder(project, folderName);
      const screenName = uniqueScreenName(folder, file.name);
      const screen = screenMetaFromXml(screenName, xml);
      folder.screens.push(screen);
      hiddenDisplayNames.delete(displayKey(screenName));
      importedScreens.push({ folderName: folder.name, screen });
    } catch (err) {
      console.error(err);
      failed.push(`${file.name}: ${err?.message || 'Invalid XML'}`);
    }
  }

  project.folders = project.folders
    .filter((folder) => Array.isArray(folder.screens) && folder.screens.length)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }));

  for (const file of csvFiles) {
    try {
      const relativePath = String(file.webkitRelativePath || file.relativePath || file.name || '');
      const pathParts = relativePath.split(/[\\/]/).filter(Boolean);
      const parentFolder = pathParts.length > 1 ? String(pathParts[pathParts.length - 2] || '').toLowerCase() : '';
      let kind = '';
      if (parentFolder === 'tags' || parentFolder.includes('tag')) {
        kind = 'tags';
      } else if (parentFolder === 'parameters' || parentFolder.includes('param')) {
        kind = 'parameters';
      }

      if (!kind) {
        continue;
      }

      const content = await readUploadedText(file);
      let name = baseFileName(file.name) || 'data.csv';
      if (!name.toLowerCase().endsWith('.csv')) {
        name = `${name}.csv`;
      }

      const target = getProjectCsvFiles(project, kind);
      const existingIndex = target.findIndex((item) => displayKey(item.name) === displayKey(name));
      const entry = {
        id: `csv-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        content,
        sizeBytes: new Blob([content]).size,
        lastModified: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        target[existingIndex] = { ...target[existingIndex], ...entry, id: target[existingIndex].id };
      } else {
        target.push(entry);
      }
    } catch (err) {
      console.error(err);
      failed.push(`${file.name}: ${err?.message || 'Invalid CSV'}`);
    }
  }

  if (!importedScreens.length || !project.folders.length) {
    throw new Error(failed.length
      ? `No files imported. First error: ${failed[0]}`
      : 'No files imported.');
  }

  projectList = [...projectList, project];
  saveProjectList();
  setActiveProject(project);
  setSidebarCollapsed(false);
  usingUploadedList = false;
  renderProjectSidebar();

  const firstFolder = project.folders[0];
  const firstScreen = firstFolder?.screens?.[0];
  if (firstFolder && firstScreen) {
    setEditorProjectScreen(project, firstFolder.name, firstScreen, firstScreen.xml);
  }

  packageResult.textContent = `Imported ${importedScreens.length} screen(s) into project ${project.name}${failed.length ? ` (${failed.length} skipped)` : ''}.`;

  if (failed.length) {
    alert(`Imported ${importedScreens.length} file(s) into project ${project.name}. Skipped ${failed.length} file(s).\nFirst issue: ${failed[0]}`);
  }
}

async function collectXmlFilesFromDirectoryHandle(directoryHandle) {
  const collected = [];

  const walk = async (dirHandle, parentPath = '') => {
    // DirectoryHandle is async iterable in Chromium-based browsers.
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        if (isImportableDisplayFileName(file.name)) {
          file.relativePath = parentPath ? `${parentPath}/${file.name}` : file.name;
          collected.push(file);
        }
      } else if (entry.kind === 'directory') {
        const nextPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
        await walk(entry, nextPath);
      }
    }
  };

  await walk(directoryHandle);
  return collected;
}

if (importFolderBtn) {
  importFolderBtn.addEventListener('click', async () => {
    // Prefer modern directory picker when available; fallback to hidden file input.
    if (typeof window.showDirectoryPicker === 'function') {
      try {
        const directoryHandle = await window.showDirectoryPicker();
        const files = await collectXmlFilesFromDirectoryHandle(directoryHandle);
        await processProjectFolderImport(files, {
          projectName: directoryHandle?.name || '',
          emptyMessage: 'No XML display files found in the selected folder.'
        });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') {
          return;
        }
        console.error(err);
      }
    }

    if (uploadFolderInput) {
      uploadFolderInput.value = '';
      uploadFolderInput.click();
    } else if (uploadInput) {
      uploadInput.value = '';
      uploadInput.click();
    }
  });
}

if (uploadFolderInput) {
  uploadFolderInput.addEventListener('change', async () => {
    try {
      await processProjectFolderImport(Array.from(uploadFolderInput.files || []), {
        emptyMessage: 'No XML display files found in the selected folder.'
      });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not import XML files from the selected folder.');
    } finally {
      uploadFolderInput.value = '';
    }
  });
}

function bindProjectCsvInput(input, kind) {
  if (!input) {
    return;
  }

  input.addEventListener('change', async () => {
    const pending = pendingCsvUpload;
    pendingCsvUpload = null;
    const files = Array.from(input.files || []);
    input.value = '';

    if (!pending?.projectId || !files.length) {
      return;
    }

    try {
      await importProjectCsvFiles(pending.projectId, kind, files);
      const project = getProjectById(pending.projectId);
      const imported = getProjectCsvFiles(project, kind);
      const latest = imported[imported.length - 1];
      if (latest) {
        openProjectCsvFile(project, kind, latest);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not import CSV file.');
    }
  });
}

bindProjectCsvInput(projectTagsCsvInput, 'tags');
bindProjectCsvInput(projectParametersCsvInput, 'parameters');

if (projectIoListInput) {
  projectIoListInput.addEventListener('change', async () => {
    const pending = pendingIoListUpload;
    pendingIoListUpload = null;
    const files = Array.from(projectIoListInput.files || []);
    projectIoListInput.value = '';

    if (!pending?.projectId || !files.length) {
      return;
    }

    try {
      const converted = await importProjectIoListFiles(pending.projectId, files);
      const project = getProjectById(pending.projectId);
      const tagsFile = getProjectPrimaryTagsFile(project);
      const paramFile = getProjectParameterFile(project, 'PLC DI List 01')
        || (project.parametersFiles || []).find((file) => /\.par$/i.test(file.name));
      const ioFile = (project.ioListFiles || [])[project.ioListFiles.length - 1];
      const tagCount = converted?.parsed?.tags?.length || 0;
      const zones = (converted?.parsed?.meta?.zones || []).join(', ') || 'IO List';
      if (ioFile) {
        openProjectIoListFile(project, ioFile);
      } else {
        await openProjectIoListPreviewScreen(project);
      }
      alert(
        `IO list imported successfully.\n`
        + `${tagCount} tags written to ${tagsFile?.name || 'Tags.CSV'}.\n`
        + `${(project.parametersFiles || []).filter((file) => /\.par$/i.test(file.name)).length} parameter file(s) generated (PLC DI List 01–06 format).\n`
        + `Zones: ${zones}\n\n`
        + 'The editable IO list table is open in Preview. Click Apply Changes after edits, then use Open IO Screen Preview for 303_IO_List.xml.'
        + (paramFile
          ? `\nParameter bindings: ${paramFile.name}`
          : '')
      );
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not import IO list.');
    }
  });
}

if (uploadInput) {
  uploadInput.addEventListener('change', async () => {
    try {
      await processStandaloneDisplayUploads(
        Array.from(uploadInput.files || []),
        'Choose one or more display XML files to upload.'
      );
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

previewBtn.addEventListener('click', renderPreview);

if (screenSizePreset) {
  screenSizePreset.addEventListener('change', () => {
    applyScreenPreset(screenSizePreset.value);
    if (xmlEditor.value.trim()) {
      renderPreview();
    }
  });
}

if (screenWidth) {
  screenWidth.addEventListener('input', syncScreenPresetFromInputs);
}

if (screenHeight) {
  screenHeight.addEventListener('input', syncScreenPresetFromInputs);
}

if (addObjectBtn) {
  addObjectBtn.addEventListener('click', addButtonObject);
}
if (toggleSidebarBtn && mainGrid) {
  toggleSidebarBtn.addEventListener('click', () => {
    const collapsed = !mainGrid.classList.contains('sidebar-collapsed');
    setSidebarCollapsed(collapsed);
    if (xmlEditor.value.trim()) {
      renderPreview();
    }
  });
}

if (toggleDockBtn && editorLayout) {
  toggleDockBtn.addEventListener('click', () => {
    const collapsed = !editorLayout.classList.contains('dock-collapsed');
    setDockCollapsed(collapsed);
    if (xmlEditor.value.trim()) {
      renderPreview();
    }
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

    const inputValue = sidebarNameMode === 'screen'
      ? (formatScreenNameFromParts(sidebarPageNoInput?.value, sidebarScreenNameInput?.value) || '').trim()
      : String(sidebarNameInput.value || '').trim();
    const shouldClose = await sidebarNameSubmit(inputValue);
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

if (sidebarPageNoInput) {
  sidebarPageNoInput.addEventListener('input', () => {
    sidebarPageNoInput.value = String(sidebarPageNoInput.value || '').replace(/\D+/g, '');
    updateSidebarScreenFormattedName();
  });

  sidebarPageNoInput.addEventListener('keydown', (event) => {
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

if (sidebarScreenNameInput) {
  sidebarScreenNameInput.addEventListener('input', () => {
    updateSidebarScreenFormattedName();
  });

  sidebarScreenNameInput.addEventListener('keydown', (event) => {
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

if (addPopupPlanRowBtn) {
  addPopupPlanRowBtn.addEventListener('click', () => {
    const project = getActiveProjectForPopupPlanner();
    if (!project) {
      alert('Create or open a project first.');
      return;
    }

    const defaultComponent = 'component:conveyor';
    const defaultPopupType = 'vfd';
    const popupName = `Popup_${project.popupPlanRows.length + 1}`;
    project.popupPlanRows.push({
      id: `popup-row-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      popupName,
      componentTypeId: defaultComponent,
      popupTypeId: defaultPopupType,
      code: suggestPopupCode(popupName, defaultPopupType),
      count: 1
    });
    saveProjectList();
    renderProjectPopupPlanner();
  });
}

if (generatePopupsBtn) {
  generatePopupsBtn.addEventListener('click', async () => {
    const project = getActiveProjectForPopupPlanner();
    syncPopupPlanRowsFromTable(project);
    generatedPopupDrafts = buildGeneratedPopupDrafts(project);

    let placedCount = 0;
    const historyRows = [];
    const targetScreenLabel = activeProjectScreen || selectedDisplay || 'current screen';

    if (generatedPopupDrafts.length && xmlEditor.value.trim()) {
      const columns = 4;
      const stepX = 170;
      const stepY = 95;
      const startX = 24;
      const startY = 24;
      generatedPopupDrafts.forEach((draft, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const left = startX + (col * stepX);
        const top = startY + (row * stepY);
        const inserted = insertGeneratedPopupDraft(draft, { left, top });
        if (inserted) {
          placedCount += 1;
          if (project) {
            historyRows.push(createSavedPopupEntry(draft, project, inserted));
          }
        }
      });
    }

    if (project && historyRows.length) {
      project.popupGeneratedRows = [...project.popupGeneratedRows, ...historyRows].slice(-1500);
    }

    if (placedCount > 0) {
      const saved = await autoSaveCurrentDisplay();
      if (!saved) {
        return;
      }
    }

    saveProjectList();
    refreshPopupPlannerDraftViews(project);

    if (packageResult) {
      packageResult.textContent = generatedPopupDrafts.length
        ? (placedCount
          ? `Generated ${generatedPopupDrafts.length} popup item(s) and placed ${placedCount} on ${targetScreenLabel}.`
          : 'Open a project screen first, then click Generate Popups again to place items in preview.')
        : 'No popup items generated yet. Add plan rows and choose popup types.';
      setWorkspaceDockTab('xml');
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

  const targetDisplayName = getTargetDisplayName();
  if (!targetDisplayName) {
    return;
  }

  try {
    await saveDisplayXml(targetDisplayName, xmlEditor.value);
    updateCurrentDisplayRow(targetDisplayName, xmlEditor.value);
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
    alert(err?.message || 'Could not build the package. Please try again.');
  }
});

if (buildAllPackageBtn) {
  buildAllPackageBtn.addEventListener('click', async () => {
    try {
      const saved = await autoSaveCurrentDisplay();
      if (!saved) {
        return;
      }

      const activeProject = getActiveProject();
      if (activeProject) {
        const projectFiles = getAllActiveProjectScreenFiles(activeProject);
        if (!projectFiles.length) {
          alert('No screens found in the active project.');
          return;
        }

        const syncedFiles = await syncActiveProjectScreensToEditedFiles(activeProject);
        if (!syncedFiles.length) {
          alert('No project screens were ready to package.');
          return;
        }

        await refreshDisplays();
        await buildImportPackage(syncedFiles, 'all project screens');
        return;
      }

      const allFiles = getAllEditedPackageFiles(currentDisplayRows);
      if (!allFiles.length) {
        alert('No edited files found for all-import package.');
        return;
      }

      await buildImportPackage(allFiles, 'all edited files');
    } catch (err) {
      console.error(err);
      alert(err?.message || 'Could not build the all-import package. Please try again.');
    }
  });
}

socket.on('bridge-status', (status) => {
  setBridgeCard(status);
  renderProjectSidebar();
});

async function init() {
  initializeWorkspaceDockTabs();

  if (!Number(screenWidth.value) || Number(screenWidth.value) <= 0) {
    screenWidth.value = DEFAULT_PREVIEW_WIDTH;
  }
  if (!Number(screenHeight.value) || Number(screenHeight.value) <= 0) {
    screenHeight.value = DEFAULT_PREVIEW_HEIGHT;
  }
  syncScreenPresetFromInputs();

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
  const dockCollapsed = localStorage.getItem(DOCK_STORAGE_KEY) === '1';
  setDockCollapsed(dockCollapsed);

  const res = await fetch('/api/bridge/status');
  const status = await res.json();
  setBridgeCard(status);
  enforceProjectSidebarLayout();
  ensureProjectSidebarWheelScroll();
  renderProjectSidebar();
  renderProjectPopupPlanner();
  renderPreview();
}

window.addEventListener('resize', () => {
  enforceProjectSidebarLayout();
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


