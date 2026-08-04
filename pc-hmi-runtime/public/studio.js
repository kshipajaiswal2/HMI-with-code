const DEFAULT_DISPLAY_SIZE = { width: 800, height: 600, backgroundColor: '#EBEBEB' };

const state = {
  activeProject: null,
  projects: [],
  selectedNode: null,
  selectedScreenId: null,
  runtimeWindow: null,
  projectConfig: null,
  globalDefaultsSnapshot: null,
  viewPrefs: null,
  openDisplays: [],
  activeObjectTool: 'select',
  explorerFilter: '',
  contextMenuNode: null,
  previewCanvas: { width: 800, height: 600 },
  previewLoadToken: 0,
  previewKind: 'display',
  startupSelectedProjectId: null
};

const MENU_IDS = ['fileMenu', 'editMenu', 'viewMenu', 'objectsMenu', 'applicationMenu', 'toolsMenu'];

const DEFAULT_VIEW_PREFS = {
  statusBar: true,
  workbookMode: true,
  explorerWindow: true,
  toolbars: {
    standard: true,
    arrange: true,
    graphics: true,
    alignment: true,
    states: false,
    patternStyles: false,
    backStyles: false,
    foregroundColors: false,
    backgroundColors: false
  },
  propertyPanel: false,
  objectExplorer: false,
  toolbox: false,
  diagnosticsList: false,
  editDisplay: false,
  showGrayscale: false,
  showGrid: false,
  snapOn: false,
  gridSize: 10,
  snapDistance: 5,
  zoom: 100,
  explorerWidth: 300
};

const TOOLBAR_GROUPS = {
  standard: 'toolbars.standard',
  arrange: 'toolbars.arrange',
  graphics: 'toolbars.graphics',
  alignment: 'toolbars.alignment',
  states: 'toolbars.states',
  patternStyles: 'toolbars.patternStyles',
  backStyles: 'toolbars.backStyles',
  foregroundColors: 'toolbars.foregroundColors',
  backgroundColors: 'toolbars.backgroundColors'
};

const WINDOW_SIZE_PRESETS = [
  { id: '640x480', label: "PVPlus 7 Standard/Performance 6''/7'' (640x480)", width: 640, height: 480 },
  { id: '800x480', label: "PVPlus 7 Standard/Performance 9'' Wide (800x480)", width: 800, height: 480 },
  { id: '800x600', label: "PVPlus 7 Standard/Performance 10'' (800x600)", width: 800, height: 600 },
  { id: '1280x800', label: "PVPlus 7 Standard/Performance 12'' Wide (1280x800)", width: 1280, height: 800 },
  { id: '1024x768', label: "PVPlus 7 Standard/Performance 15'' (1024x768)", width: 1024, height: 768 },
  { id: '1280x1024', label: "PVPlus 7 Performance 19'' (1280x1024)", width: 1280, height: 1024 },
  { id: 'mobileview', label: 'MobileView (1280x800)', width: 1280, height: 800 },
  { id: '640x240', label: '640x240', width: 640, height: 240 },
  { id: '1152x854', label: '1152x854', width: 1152, height: 854 },
  { id: 'custom', label: 'Custom size', width: null, height: null }
];

const LANGUAGE_OPTIONS = [
  { id: 'en', label: 'English (United States), en-US' },
  { id: 'de', label: 'German, de-DE' },
  { id: 'fr', label: 'French, fr-FR' },
  { id: 'es', label: 'Spanish, es-ES' },
  { id: 'hi', label: 'Hindi, hi-IN' }
];

const STUDIO_PRODUCT_NAME = 'Plant HMI Studio 1.0';

const DISPLAY_FOLDER_IDS = [
  '100_Overview', '200_Settings', '300_Manual_Operation',
  '400_Active_Alarms', '500_Recipe', '600_Legends', '700_User_Management'
];

const studioApp = document.querySelector('.studio-app');
const studioBody = document.getElementById('studioBody');
const explorerPanel = document.getElementById('explorerPanel');
const statusBar = document.getElementById('statusBar');
const workbookTabs = document.getElementById('workbookTabs');
const workspaceGrid = document.getElementById('workspaceGrid');

const explorerTree = document.getElementById('explorerTree');
const explorerProject = document.getElementById('explorerProject');
const projectSelect = document.getElementById('projectSelect');
const workspaceWelcome = document.getElementById('workspaceWelcome');
const workspace = document.getElementById('workspace');
const previewFrame = document.getElementById('previewFrame');
const previewStage = document.getElementById('previewStage');
const panelView = document.getElementById('panelView');
const statusMsg = document.getElementById('statusMsg');
const newProjectDialog = document.getElementById('newProjectDialog');
const openProjectDialog = document.getElementById('openProjectDialog');

function setStatus(msg) {
  statusMsg.textContent = msg;
}

function closeAllMenus() {
  MENU_IDS.forEach((id) => document.getElementById(id)?.classList.add('hidden'));
}

function toggleMenu(menuId, beforeOpen) {
  const menu = document.getElementById(menuId);
  if (!menu) return;
  const isOpen = !menu.classList.contains('hidden');
  closeAllMenus();
  if (!isOpen) {
    beforeOpen?.();
    menu.classList.remove('hidden');
  }
}

function toggleFileMenu() {
  toggleMenu('fileMenu', renderRecentProjectsMenu);
}

function toggleEditMenu() {
  toggleMenu('editMenu', updateEditMenuState);
}

function toggleViewMenu() {
  toggleMenu('viewMenu', updateViewMenuState);
}

function toggleObjectsMenu() {
  toggleMenu('objectsMenu', updateObjectsMenuChecks);
}

function toggleApplicationMenu() {
  toggleMenu('applicationMenu');
}

function toggleToolsMenu() {
  toggleMenu('toolsMenu');
}

function updateObjectsMenuChecks() {
  document.querySelectorAll('#objectsMenu [data-object-id].checkable').forEach((el) => {
    el.classList.toggle('checked', el.dataset.objectId === state.activeObjectTool);
  });
}

async function addObjectToDisplay(component) {
  if (!displayIsOpen()) {
    setStatus('Open a display first, then choose an object to add');
    return false;
  }
  const screen = await fetchJson(`/api/runtime/screens/${encodeURIComponent(state.selectedScreenId)}?project=${state.activeProject}`);
  const components = [...(screen.components || []), component];
  await fetchJson(`/api/projects/${state.activeProject}/screens/${encodeURIComponent(state.selectedScreenId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ components })
  });
  openDisplayPreview(state.selectedScreenId, screen.title || state.selectedScreenId);
  refreshObjectExplorer();
  refreshPropertyPanel();
  return true;
}

function handleObjectAction(id) {
  closeAllMenus();
  const item = window.OBJECTS_MENU_LOOKUP?.[id];
  if (!item || item.disabled) return;

  state.activeObjectTool = id;
  updateObjectsMenuChecks();

  if (id === 'select') {
    setStatus('Select tool active');
    return;
  }
  if (item.planned) {
    setStatus(`${item.label} — planned for visual editor`);
    return;
  }
  if (item.component) {
    const comp = JSON.parse(JSON.stringify(item.component));
    addObjectToDisplay(comp)
      .then((ok) => { if (ok) setStatus(`Added ${comp.type} to ${state.selectedScreenId}`); })
      .catch((err) => setStatus(`Error: ${err.message}`));
    return;
  }
  setStatus(`${item.label} — planned`);
}

function loadViewPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem('planthmi-studio-view') || '{}');
    state.viewPrefs = {
      ...DEFAULT_VIEW_PREFS,
      ...saved,
      toolbars: { ...DEFAULT_VIEW_PREFS.toolbars, ...(saved.toolbars || {}) }
    };
  } catch {
    state.viewPrefs = { ...DEFAULT_VIEW_PREFS, toolbars: { ...DEFAULT_VIEW_PREFS.toolbars } };
  }
}

function saveViewPrefs() {
  localStorage.setItem('planthmi-studio-view', JSON.stringify(state.viewPrefs));
}

function getViewPref(path) {
  const parts = path.split('.');
  let val = state.viewPrefs;
  for (const p of parts) val = val?.[p];
  return val;
}

function setViewPref(path, value) {
  const parts = path.split('.');
  let obj = state.viewPrefs;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!obj[parts[i]]) obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
  saveViewPrefs();
  applyViewPrefs();
}

function toggleViewPref(path) {
  setViewPref(path, !getViewPref(path));
}

function applyViewPrefs() {
  const v = state.viewPrefs;

  statusBar.classList.toggle('hidden', !v.statusBar);
  studioApp.classList.toggle('no-status-bar', !v.statusBar);

  explorerPanel.classList.toggle('hidden', !v.explorerWindow);
  studioBody.classList.toggle('no-explorer', !v.explorerWindow);

  renderWorkbookTabs();

  document.querySelectorAll('[data-toolbar-group]').forEach((el) => {
    const pref = TOOLBAR_GROUPS[el.dataset.toolbarGroup];
    if (pref) el.classList.toggle('hidden', !getViewPref(pref));
  });

  document.getElementById('toolboxPanel')?.classList.toggle('hidden', !v.toolbox);

  const rightPanel = v.propertyPanel ? 'propertyPanel'
    : v.objectExplorer ? 'objectExplorerPanel'
    : v.diagnosticsList ? 'diagnosticsPanel' : null;

  ['propertyPanel', 'objectExplorerPanel', 'diagnosticsPanel'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', id !== rightPanel);
  });

  workspaceGrid.classList.toggle('hidden', !v.showGrid);
  workspaceGrid.style.setProperty('--grid-size', `${v.gridSize}px`);

  applyExplorerWidth(v.explorerWidth || DEFAULT_VIEW_PREFS.explorerWidth);

  previewFrame.classList.toggle('grayscale', v.showGrayscale);
  applyPreviewZoom();

  document.querySelectorAll('#viewMenu [data-view-toggle]').forEach((el) => {
    const val = getViewPref(el.dataset.viewToggle);
    el.classList.toggle('checked', Boolean(val));
  });

  updateViewMenuState();
  refreshPropertyPanel();
  refreshObjectExplorer();
}

function updateViewMenuState() {
  const displayOpen = displayIsOpen();
  const zoomDefault = state.viewPrefs.zoom === 100;

  const editDisplayBtn = document.querySelector('#viewMenu [data-view-action="edit-display"]');
  if (editDisplayBtn) {
    editDisplayBtn.classList.toggle('disabled', !displayOpen);
    editDisplayBtn.classList.toggle('checked', displayOpen && state.viewPrefs.editDisplay);
  }

  const cancelZoomBtn = document.querySelector('#viewMenu [data-view-action="cancel-zoom"]');
  if (cancelZoomBtn) cancelZoomBtn.classList.toggle('disabled', zoomDefault);

  const testDisplayBtn = document.querySelector('#viewMenu [data-view-action="test-display"]');
  if (testDisplayBtn) testDisplayBtn.classList.toggle('disabled', !displayOpen);
}

function renderWorkbookTabs() {
  const show = state.viewPrefs.workbookMode && state.openDisplays.length > 0;
  workbookTabs.classList.toggle('hidden', !show);
  studioApp.classList.toggle('no-workbook-tabs', !show);
  if (!show) {
    workbookTabs.innerHTML = '';
    return;
  }
  workbookTabs.innerHTML = state.openDisplays.map((id) =>
    `<div class="workbook-tab ${id === state.selectedScreenId ? 'active' : ''}" data-workbook-id="${escapeHtml(id)}">
      <button type="button" class="workbook-tab-label">${escapeHtml(id.replace(/_/g, ' '))}</button>
      <button type="button" class="workbook-tab-close" data-close-id="${escapeHtml(id)}" title="Close">×</button>
    </div>`
  ).join('');
  workbookTabs.querySelectorAll('.workbook-tab-label').forEach((btn) => {
    const tab = btn.closest('.workbook-tab');
    btn.addEventListener('click', () => openDisplayPreview(tab.dataset.workbookId, tab.dataset.workbookId));
  });
  workbookTabs.querySelectorAll('.workbook-tab-close').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeWorkbookTab(btn.dataset.closeId);
    });
  });
}

function closeWorkbookTab(screenId) {
  if (!screenId) return;
  const idx = state.openDisplays.indexOf(screenId);
  if (idx !== -1) state.openDisplays.splice(idx, 1);

  if (state.selectedScreenId === screenId) {
    const next = state.openDisplays[idx] || state.openDisplays[idx - 1] || null;
    if (next) {
      openDisplayPreview(next, next);
    } else {
      closeDisplayWorkspace();
      setStatus('Display closed');
    }
  }
  renderWorkbookTabs();
}

function trackOpenDisplay(screenId) {
  if (!screenId) return;
  if (!state.openDisplays.includes(screenId)) state.openDisplays.push(screenId);
  renderWorkbookTabs();
}

function resolveDisplaySize(screen, projectRuntime) {
  const rt = projectRuntime || {};
  const ds = screen?.displaySettings || {};
  const useProject = ds.useProjectSize || (!ds.width && !ds.height);
  return {
    width: useProject ? (rt.width || DEFAULT_DISPLAY_SIZE.width) : (ds.width || rt.width || DEFAULT_DISPLAY_SIZE.width),
    height: useProject ? (rt.height || DEFAULT_DISPLAY_SIZE.height) : (ds.height || rt.height || DEFAULT_DISPLAY_SIZE.height),
    backgroundColor: ds.backgroundColor || rt.displayBackground || DEFAULT_DISPLAY_SIZE.backgroundColor,
    useProjectSize: useProject
  };
}

async function refreshPropertyPanel() {
  const body = document.getElementById('propertyPanelBody');
  if (!body || document.getElementById('propertyPanel').classList.contains('hidden')) return;
  if (!state.selectedScreenId || !state.activeProject) {
    body.innerHTML = '<p class="side-hint">Select a display to view properties.</p>';
    return;
  }
  try {
    const screen = await fetchJson(`/api/runtime/screens/${encodeURIComponent(state.selectedScreenId)}?project=${state.activeProject}`);
    const rt = state.projectConfig?.runtime || {};
    const size = resolveDisplaySize(screen, rt);
    const sizeText = size.useProjectSize
      ? `${size.width} × ${size.height} (project)`
      : `${size.width} × ${size.height}`;
    body.innerHTML = `
      <p><strong>ID:</strong> ${escapeHtml(screen.id)}</p>
      <p><strong>Title:</strong> ${escapeHtml(screen.title || '')}</p>
      <p><strong>Layout:</strong> ${escapeHtml(screen.layout || 'standard')}</p>
      <p><strong>Security:</strong> ${screen.securityLevel ?? 0}</p>
      <p><strong>Size:</strong> ${sizeText}</p>
      <p><strong>Components:</strong> ${(screen.components || []).length}</p>
      <p class="side-hint">Full property editor planned.</p>`;
  } catch {
    body.innerHTML = '<p class="side-hint">Could not load display properties.</p>';
  }
}

async function refreshObjectExplorer() {
  const body = document.getElementById('objectExplorerBody');
  if (!body || document.getElementById('objectExplorerPanel').classList.contains('hidden')) return;
  if (!state.selectedScreenId || !state.activeProject) {
    body.innerHTML = '<p class="side-hint">Open a display to list objects.</p>';
    return;
  }
  try {
    const screen = await fetchJson(`/api/runtime/screens/${encodeURIComponent(state.selectedScreenId)}?project=${state.activeProject}`);
    body.innerHTML = renderComponentTree(screen.components || [], 0);
  } catch {
    body.innerHTML = '<p class="side-hint">Could not load objects.</p>';
  }
}

function renderComponentTree(components, depth) {
  if (!components.length) return '<p class="side-hint">No objects on this display.</p>';
  return components.map((c, i) => {
    const label = c.label || c.tag || c.type || 'Object';
    const pad = depth * 12;
    let html = `<div class="object-tree-row" style="padding-left:${pad}px">📦 ${escapeHtml(c.type)} — ${escapeHtml(String(label))}</div>`;
    if (c.children?.length) html += renderComponentTree(c.children, depth + 1);
    return html;
  }).join('');
}

function testDisplay() {
  if (!displayIsOpen()) {
    setStatus('Open a display first');
    return;
  }
  const url = `/runtime.html?project=${encodeURIComponent(state.activeProject)}&screen=${encodeURIComponent(state.selectedScreenId)}`;
  window.open(url, 'planthmi-test-display', 'width=1024,height=768');
  setStatus(`Testing display: ${state.selectedScreenId}`);
}

function handleViewAction(action, togglePath) {
  closeAllMenus();
  if (togglePath) {
    toggleViewPref(togglePath);
    if (togglePath === 'editDisplay' && displayIsOpen()) {
      setStatus(`Edit Display: ${state.selectedScreenId}`);
    }
    return;
  }
  switch (action) {
    case 'test-display': testDisplay(); break;
    case 'grid-settings':
      document.getElementById('gridSizeInput').value = state.viewPrefs.gridSize;
      document.getElementById('snapDistanceInput').value = state.viewPrefs.snapDistance;
      document.getElementById('gridSettingsDialog').showModal();
      break;
    case 'zoom-in':
      setViewPref('zoom', Math.min(400, state.viewPrefs.zoom + 25));
      setStatus(`Zoom: ${state.viewPrefs.zoom}%`);
      break;
    case 'zoom-out':
      setViewPref('zoom', Math.max(25, state.viewPrefs.zoom - 25));
      setStatus(`Zoom: ${state.viewPrefs.zoom}%`);
      break;
    case 'cancel-zoom':
      setViewPref('zoom', 100);
      setStatus('Zoom reset to 100%');
      break;
    case 'animation':
      setStatus('Animation editor — planned for visual editor phase');
      break;
    default: break;
  }
}

function hidePreviewStage() {
  previewStage?.classList.add('hidden');
  previewFrame?.classList.add('hidden');
}

function clearPreviewFrame() {
  if (previewFrame) {
    previewFrame.src = 'about:blank';
    previewFrame.removeAttribute('src');
    previewFrame.style.width = '';
    previewFrame.style.height = '';
    previewFrame.style.transform = '';
  }
}

function closeDisplayWorkspace() {
  hideWorkspaceContextMenu();
  state.previewLoadToken += 1;
  state.selectedScreenId = null;
  state.selectedNode = null;
  workspaceWelcome.classList.remove('hidden');
  hidePreviewStage();
  clearPreviewFrame();
  panelView.classList.add('hidden');
  explorerTree.querySelectorAll('.tree-row').forEach((r) => r.classList.remove('selected'));
  updateEditMenuState();
  updateViewMenuState();
  refreshPropertyPanel();
  refreshObjectExplorer();
}

function showPreviewStage() {
  previewStage?.classList.remove('hidden');
  previewFrame?.classList.remove('hidden');
}

function displayIsOpen() {
  return Boolean(state.selectedScreenId && !previewStage?.classList.contains('hidden'));
}

function updateEditMenuState() {
  const displayOpen = displayIsOpen();
  const projectOpen = Boolean(state.activeProject);
  const map = {
    'display-settings': displayOpen,
    'key-assignments': projectOpen,
    'select-all': displayOpen,
    'clear-all': displayOpen,
    'wallpaper-none': displayOpen,
    'wallpaper-color': displayOpen,
    'wallpaper-image': displayOpen,
    'global-object-defaults': projectOpen
  };
  document.querySelectorAll('#editMenu [data-edit-action]').forEach((el) => {
    const action = el.dataset.editAction;
    if (map[action] !== undefined) {
      el.classList.toggle('disabled', !map[action]);
    }
  });
  const wallpaperSub = document.querySelector('#editMenu [data-edit-submenu="wallpaper"]');
  if (wallpaperSub) wallpaperSub.classList.toggle('disabled', !displayOpen);
}

function renderRecentProjectsMenu() {
  const el = document.getElementById('recentProjectsMenu');
  if (!el) return;
  if (!state.projects.length) {
    el.innerHTML = '<span class="menu-entry disabled" style="padding:4px 8px">No recent projects</span>';
    return;
  }
  el.innerHTML = state.projects.slice(0, 8).map((p) =>
    `<button type="button" class="menu-entry" data-recent-id="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button>`
  ).join('');
  el.querySelectorAll('[data-recent-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeAllMenus();
      openProject(btn.dataset.recentId);
    });
  });
}

function handleMenuAction(action) {
  closeAllMenus();
  switch (action) {
    case 'new-project': showNewProjectDialog(); break;
    case 'open-project': showOpenProjectDialog(); break;
    case 'delete-project': deleteActiveProject(); break;
    case 'new-display': showAddDisplayDialog(); break;
    case 'new-parameter': openTagsPanel(); setStatus('Parameters — HMI Tags'); break;
    case 'new-local-message': openAlarmsPanel(); setStatus('Local Messages — Alarm definitions'); break;
    case 'new-data-log': setStatus('Data Log — configure in project.json (historian planned)'); openSystemPanelById('diagnostics-setup'); break;
    case 'new-macro': setStatus('Macros — planned for Phase 3'); break;
    case 'new-library': setStatus('Library — faceplate library planned'); break;
    case 'new-info-message': setStatus('Information Messages — planned'); break;
    case 'new-recipe': loadScreenInWorkspace('500_Recipe'); setStatus('RecipePlus — Recipe management'); break;
    case 'save': setStatus('Saved — project files auto-saved to disk'); break;
    case 'save-as':
      if (state.activeProject) showNewProjectDialog();
      else setStatus('No application open');
      break;
    case 'close-display':
      if (state.selectedScreenId) {
        closeWorkbookTab(state.selectedScreenId);
      } else if (!previewStage?.classList.contains('hidden')) {
        closeDisplayWorkspace();
        setStatus('Display closed');
      } else {
        setStatus('No display open');
      }
      break;
    case 'close-app':
      state.activeProject = null;
      state.projectConfig = null;
      state.openDisplays = [];
      explorerTree.innerHTML = '';
      explorerProject.textContent = '—';
      closeDisplayWorkspace();
      setStatus('Application closed');
      updateEditMenuState();
      break;
    case 'select-app-type': setStatus('Application type: Plant HMI View Machine Edition'); break;
    case 'exit':
      if (confirm('Exit Plant HMI Studio?')) window.close();
      break;
    default: break;
  }
}

function openSystemPanelById(id) {
  openSystemPanel({ label: id.replace(/-/g, ' '), id });
}

async function loadScreenInWorkspace(screenId) {
  if (!state.activeProject) { setStatus('Open an application first'); return; }
  openDisplayPreview(screenId, screenId);
}

const DEFAULT_GLOBAL_OBJECT_DEFAULTS = {
  linkAnimation: 'linkWithExpressions',
  linkConnections: true,
  linkSize: true
};

async function refreshProjectConfig() {
  if (!state.activeProject) {
    state.projectConfig = null;
    return;
  }
  const active = await fetchJson('/api/projects/active');
  state.projectConfig = active.config || {};
}

function getGlobalObjectDefaults() {
  return {
    ...DEFAULT_GLOBAL_OBJECT_DEFAULTS,
    ...(state.projectConfig?.studio?.globalObjectDefaults || {})
  };
}

function fillGlobalDefaultsForm(defaults) {
  const form = document.getElementById('globalObjectDefaultsForm');
  form.linkAnimation.value = defaults.linkAnimation;
  form.linkConnections.value = String(defaults.linkConnections);
  form.linkSize.value = String(defaults.linkSize);
  state.globalDefaultsSnapshot = JSON.stringify(readGlobalDefaultsForm());
  document.getElementById('applyGlobalDefaults').disabled = true;
}

function readGlobalDefaultsForm() {
  const form = document.getElementById('globalObjectDefaultsForm');
  return {
    linkAnimation: form.linkAnimation.value,
    linkConnections: form.linkConnections.value === 'true',
    linkSize: form.linkSize.value === 'true'
  };
}

async function saveGlobalObjectDefaults(closeAfter) {
  if (!state.activeProject) return;
  const defaults = readGlobalDefaultsForm();
  const result = await fetchJson(`/api/projects/${state.activeProject}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studio: { globalObjectDefaults: defaults } })
  });
  state.projectConfig = result.config;
  state.globalDefaultsSnapshot = JSON.stringify(defaults);
  document.getElementById('applyGlobalDefaults').disabled = true;
  setStatus('Global object defaults saved');
  if (closeAfter) document.getElementById('globalObjectDefaultsDialog').close();
}

function showGlobalObjectDefaultsDialog() {
  if (!state.activeProject) {
    setStatus('Open an application first');
    return;
  }
  fillGlobalDefaultsForm(getGlobalObjectDefaults());
  document.getElementById('globalObjectDefaultsDialog').showModal();
}

async function showDisplaySettingsDialog() {
  if (!displayIsOpen()) {
    setStatus('Open a display first');
    return;
  }
  await refreshProjectConfig();
  const screen = await fetchJson(`/api/runtime/screens/${encodeURIComponent(state.selectedScreenId)}?project=${state.activeProject}`);
  const ds = screen.displaySettings || {};
  const rt = state.projectConfig?.runtime || {};
  const size = resolveDisplaySize(screen, rt);

  document.querySelector(`#displaySettingsForm input[name="displayType"][value="${ds.displayType || 'replace'}"]`)?.click()
    || document.querySelector('#displaySettingsForm input[name="displayType"][value="replace"]')?.click();
  document.querySelector(`#displaySettingsForm input[name="sizeMode"][value="${size.useProjectSize ? 'project' : 'custom'}"]`)?.click();
  document.getElementById('displaySettingsWidth').value = size.useProjectSize ? size.width : (ds.width || size.width);
  document.getElementById('displaySettingsHeight').value = size.useProjectSize ? size.height : (ds.height || size.height);
  document.getElementById('displaySettingsX').value = ds.positionX ?? 0;
  document.getElementById('displaySettingsY').value = ds.positionY ?? 0;
  document.getElementById('displaySettingsBg').value = ds.backgroundColor || rt.displayBackground || DEFAULT_DISPLAY_SIZE.backgroundColor;
  document.getElementById('displaySettingsNumber').value = ds.displayNumber ?? 1;
  document.getElementById('displaySettingsSecurity').value = screen.securityLevel ?? 0;
  document.getElementById('displaySettingsTitleBar').checked = Boolean(ds.showTitleBar);
  document.getElementById('displaySettingsTitle').value = screen.title || '';
  document.getElementById('displaySettingsDisableFocus').checked = Boolean(ds.disableInitialFocus);
  document.getElementById('displaySettingsTagRate').value = ds.maxTagUpdateRate ?? 1;
  syncDisplaySettingsSizeFields();
  switchDisplaySettingsTab('general');
  document.getElementById('displaySettingsDialog').showModal();
}

function switchDisplaySettingsTab(tabId) {
  document.querySelectorAll('#displaySettingsDialog .dialog-tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.dsTab === tabId);
  });
  document.querySelectorAll('#displaySettingsDialog .dialog-tab-panel').forEach((el) => {
    el.classList.toggle('active', el.dataset.dsTabPanel === tabId);
  });
}

function syncDisplaySettingsSizeFields() {
  const useProject = document.querySelector('#displaySettingsForm input[name="sizeMode"]:checked')?.value === 'project';
  document.getElementById('displaySettingsWidth').disabled = useProject;
  document.getElementById('displaySettingsHeight').disabled = useProject;
}

async function saveDisplaySettings(e) {
  e.preventDefault();
  if (!state.activeProject || !state.selectedScreenId) return;
  const useProjectSize = document.querySelector('#displaySettingsForm input[name="sizeMode"]:checked')?.value === 'project';
  const displayType = document.querySelector('#displaySettingsForm input[name="displayType"]:checked')?.value || 'replace';
  const displaySettings = {
    useProjectSize,
    displayType,
    positionX: Number(document.getElementById('displaySettingsX').value) || 0,
    positionY: Number(document.getElementById('displaySettingsY').value) || 0,
    backgroundColor: document.getElementById('displaySettingsBg').value,
    displayNumber: Number(document.getElementById('displaySettingsNumber').value) || 1,
    showTitleBar: document.getElementById('displaySettingsTitleBar').checked,
    disableInitialFocus: document.getElementById('displaySettingsDisableFocus').checked,
    maxTagUpdateRate: Number(document.getElementById('displaySettingsTagRate').value) || 1
  };
  if (!useProjectSize) {
    displaySettings.width = Number(document.getElementById('displaySettingsWidth').value) || 800;
    displaySettings.height = Number(document.getElementById('displaySettingsHeight').value) || 600;
  }
  const patch = {
    title: document.getElementById('displaySettingsTitle').value.trim(),
    securityLevel: Number(document.getElementById('displaySettingsSecurity').value) || 0,
    displaySettings
  };
  await fetchJson(`/api/projects/${state.activeProject}/screens/${encodeURIComponent(state.selectedScreenId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  });
  document.getElementById('displaySettingsDialog').close();
  await loadExplorer(state.activeProject);
  await reloadDisplayPreview();
  setStatus(`Display settings saved: ${state.selectedScreenId}`);
}

async function showKeyAssignmentsDialog() {
  if (!state.activeProject) {
    setStatus('Open an application first');
    return;
  }
  await refreshProjectConfig();
  const screens = await fetchJson(`/api/runtime/screens?project=${state.activeProject}`);
  const assignments = state.projectConfig?.studio?.keyAssignments || {};
  const grid = document.getElementById('keyAssignmentsGrid');
  grid.innerHTML = Array.from({ length: 12 }, (_, i) => {
    const key = `F${i + 1}`;
    const options = ['<option value="">— None —</option>']
      .concat(screens.map((s) => {
        const selected = assignments[key] === s.id ? ' selected' : '';
        return `<option value="${escapeHtml(s.id)}"${selected}>${escapeHtml(s.id)}</option>`;
      }))
      .join('');
    return `<label>${key}</label><select name="${key}">${options}</select>`;
  }).join('');
  document.getElementById('keyAssignmentsDialog').showModal();
}

async function saveKeyAssignments(e) {
  e.preventDefault();
  if (!state.activeProject) return;
  const form = document.getElementById('keyAssignmentsForm');
  const keyAssignments = {};
  for (let i = 1; i <= 12; i++) {
    const key = `F${i}`;
    const value = form.elements[key]?.value;
    if (value) keyAssignments[key] = value;
  }
  const result = await fetchJson(`/api/projects/${state.activeProject}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studio: { keyAssignments } })
  });
  state.projectConfig = result.config;
  document.getElementById('keyAssignmentsDialog').close();
  setStatus('Key assignments saved');
}

async function setWallpaper(mode, value) {
  if (!displayIsOpen()) {
    setStatus('Open a display first');
    return;
  }
  const displaySettings = { wallpaper: mode };
  if (mode === 'color') displaySettings.backgroundColor = value;
  if (mode === 'image') displaySettings.wallpaperImage = value;
  await fetchJson(`/api/projects/${state.activeProject}/screens/${encodeURIComponent(state.selectedScreenId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displaySettings })
  });
  await reloadDisplayPreview();
  setStatus(`Wallpaper set to ${mode}`);
}

function handleEditAction(action) {
  closeAllMenus();
  switch (action) {
    case 'display-settings':
      showDisplaySettingsDialog().catch((err) => setStatus(`Error: ${err.message}`));
      break;
    case 'key-assignments': showKeyAssignmentsDialog(); break;
    case 'global-object-defaults': showGlobalObjectDefaultsDialog(); break;
    case 'wallpaper-none': setWallpaper('none'); break;
    case 'wallpaper-color': document.getElementById('wallpaperColorDialog').showModal(); break;
    case 'wallpaper-image': {
      const url = prompt('Enter wallpaper image URL or path:');
      if (url) setWallpaper('image', url);
      break;
    }
    case 'select-all': setStatus('Select All — visual editor planned'); break;
    case 'clear-all':
      if (state.selectedScreenId && confirm(`Clear all components on "${state.selectedScreenId}"?`)) {
        fetchJson(`/api/projects/${state.activeProject}/screens/${encodeURIComponent(state.selectedScreenId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ components: [] })
        }).then(() => reloadDisplayPreview())
          .then(() => setStatus('Display cleared'))
          .catch((err) => setStatus(`Error: ${err.message}`));
      }
      break;
    default: setStatus(`${action.replace(/-/g, ' ')} — available when visual editor is added`); break;
  }
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

async function loadProjects() {
  const data = await fetchJson('/api/projects');
  state.projects = data.projects || [];
  state.activeProject = data.activeId;
  renderProjectSelect();
  await refreshProjectConfig();
}

function projectDisplayLabel(project) {
  const dupes = state.projects.filter((p) => p.name === project.name).length > 1;
  const name = dupes ? `${project.name} [${project.id}]` : project.name;
  return `${name} (${project.screenCount} screens)`;
}

function renderProjectSelect() {
  projectSelect.innerHTML = state.projects.map((p) =>
    `<option value="${escapeHtml(p.id)}" ${p.id === state.activeProject ? 'selected' : ''}>${escapeHtml(projectDisplayLabel(p))}</option>`
  ).join('');
  const deleteBtn = document.getElementById('deleteProjectBtn');
  if (deleteBtn) deleteBtn.disabled = !state.activeProject;
}

async function loadExplorer(projectId) {
  const id = projectId || state.activeProject;
  if (!id) return;
  const data = await fetchJson(`/api/projects/${id}/explorer?_=${Date.now()}`);
  explorerProject.textContent = `: ${data.projectName}`;
  explorerTree.innerHTML = '';
  for (const node of data.tree) {
    explorerTree.appendChild(renderTreeNode(node, 0));
  }
  applyExplorerFilter();
  setStatus(`Project loaded: ${data.projectName}`);
}

function expandExplorerNode(nodeId) {
  const row = explorerTree.querySelector(`.tree-row[data-node-id="${CSS.escape(nodeId)}"]`);
  if (!row) return;
  const nodeEl = row.closest('.tree-node');
  const children = nodeEl?.querySelector(':scope > .tree-children');
  const toggle = row.querySelector('.tree-toggle');
  if (children?.classList.contains('collapsed')) {
    children.classList.remove('collapsed');
    if (toggle?.textContent === '+') toggle.textContent = '−';
  }
}

function expandDefaultExplorerFolders() {
  for (const id of ['project-root', 'application', 'graphics', 'displays', 'global-objects', 'images']) {
    expandExplorerNode(id);
  }
}

async function bootstrapOpenedProject(id) {
  state.activeProject = id;
  state.openDisplays = [];
  closeDisplayWorkspace();
  renderWorkbookTabs();
  await loadProjects();
  await loadExplorer(id);
  expandDefaultExplorerFolders();
  workspaceWelcome.classList.add('hidden');
  hideStartupDialog();
  updateEditMenuState();
  updateViewMenuState();
  await refreshProjectConfig();
}

function renderTreeNode(node, depth) {
  const el = document.createElement('div');
  el.className = 'tree-node';
  el.dataset.depth = String(depth);

  const row = document.createElement('div');
  row.className = 'tree-row';
  if (node.type === 'folder') row.classList.add('tree-row-folder');
  if (node.id === 'project-root' || node.id === 'application') row.classList.add('tree-row-root');
  row.dataset.nodeId = node.id || '';
  row.dataset.nodeType = node.type;

  const hasChildren = Boolean(node.children?.length);
  const startCollapsed = hasChildren && isDisplayCategoryFolder(node);

  const toggle = document.createElement('span');
  toggle.className = hasChildren ? 'tree-toggle' : 'tree-toggle tree-toggle-leaf';
  toggle.textContent = hasChildren ? (startCollapsed ? '+' : '−') : '';
  row.appendChild(toggle);

  const icon = document.createElement('span');
  icon.className = 'tree-icon';
  icon.textContent = iconFor(node);
  row.appendChild(icon);

  const label = document.createElement('span');
  label.className = 'tree-label';
  label.textContent = node.label;
  label.title = node.label;
  row.appendChild(label);

  if (node.type === 'display') {
    row.dataset.screenId = node.id;
    row.classList.add('display-node');
  }
  if (node.type === 'global-object') {
    row.dataset.globalObjectId = node.id;
    row.classList.add('global-object-node');
  }
  if (node.type === 'image') {
    row.dataset.imageFile = node.fileName || node.id;
    row.classList.add('image-node');
  }
  if (node.action) row.dataset.action = node.action;

  row.addEventListener('click', (e) => {
    e.stopPropagation();
    selectNode(row, node);
  });

  row.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectNode(row, node);
    showExplorerContextMenu(e, node);
  });

  el.appendChild(row);

  if (hasChildren) {
    const children = document.createElement('div');
    children.className = 'tree-children';
    if (startCollapsed) children.classList.add('collapsed');
    for (const child of node.children) {
      children.appendChild(renderTreeNode(child, depth + 1));
    }
    el.appendChild(children);

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      children.classList.toggle('collapsed');
      toggle.textContent = children.classList.contains('collapsed') ? '+' : '−';
    });
  }

  return el;
}

function applyExplorerWidth(width) {
  if (!explorerPanel) return;
  const w = Math.min(520, Math.max(200, Number(width) || DEFAULT_VIEW_PREFS.explorerWidth));
  explorerPanel.style.width = `${w}px`;
  document.documentElement.style.setProperty('--explorer-width', `${w}px`);
}

function initExplorerResizer() {
  const resizer = document.getElementById('explorerResizer');
  if (!resizer || !explorerPanel) return;

  applyExplorerWidth(state.viewPrefs?.explorerWidth);

  resizer.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startW = explorerPanel.offsetWidth;
    resizer.classList.add('dragging');
    document.body.classList.add('explorer-resize-active');

    const onMove = (ev) => {
      applyExplorerWidth(startW + ev.clientX - startX);
    };
    const onUp = () => {
      resizer.classList.remove('dragging');
      document.body.classList.remove('explorer-resize-active');
      state.viewPrefs.explorerWidth = explorerPanel.offsetWidth;
      saveViewPrefs();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

function iconFor(node) {
  const icons = {
    system: '⚙',
    tags: '🏷',
    alarm: '🔔',
    'alarm-setup': '🔧',
    graphics: '🖼',
    displays: '📺',
    folder: '📁',
    display: '📄',
    settings: '🔧',
    lock: '🔒',
    diag: '📊',
    comm: '📡',
    play: '▶',
    'global-objects': '🌐',
    'global-object': '📄',
    'symbol-factory': '⚗',
    libraries: '📚',
    images: '🖼',
    'image-file': '📄',
    parameters: '#',
    'local-messages': '💬',
    information: 'ℹ',
    'information-setup': '🔧',
    'information-messages': '📝',
    logic: '⚡',
    macros: '📜',
    'data-log': '📊',
    'data-log-models': '🗄',
    recipeplus: '📋',
    'recipeplus-setup': '🔧',
    'recipeplus-editor': '✎',
    linx: '🔗',
    project: '📦',
    application: '📁',
    audit: '📋',
    csv: '📄',
    'global-conn': '🔗'
  };
  return icons[node.icon] || icons[node.type] || '•';
}

function handleExplorerAction(node) {
  if (!node) return;
  const action = node.action || node.id;
  switch (action) {
    case 'tags':
      openTagsPanel();
      break;
    case 'alarms':
    case 'local-messages':
      openAlarmsPanel();
      break;
    case 'global-object-defaults':
      showGlobalObjectDefaultsDialog();
      break;
    case 'communications':
      showProjectSettingsDialog('runtime');
      break;
    case 'recipeplus-setup':
    case 'recipeplus-editor':
      openRecipePanel(action);
      break;
    case 'data-log':
      openDataLogPanel();
      break;
    case 'parameters':
    case 'symbol-factory':
    case 'libraries':
    case 'images':
    case 'information-setup':
    case 'information-messages':
    case 'macros':
      openSystemPanel(node);
      break;
    default:
      break;
  }
}

function openRecipePanel(mode) {
  workspaceWelcome.classList.add('hidden');
  hidePreviewStage();
  panelView.classList.remove('hidden');
  const title = mode === 'recipeplus-editor' ? 'RecipePlus Editor' : 'RecipePlus Setup';
  panelView.innerHTML = `
    <div class="panel-content">
      <h2>${escapeHtml(title)}</h2>
      <p>Configure recipes for project <strong>${escapeHtml(state.activeProject)}</strong>.</p>
      <p class="hint">Recipe screens are under <strong>Graphics → Displays → 500 Recipe</strong>.</p>
    </div>`;
  setStatus(title);
}

function openDataLogPanel() {
  openSystemPanel({ label: 'Data Log Models', id: 'data-log-models' });
}

function selectNode(row, node) {
  explorerTree.querySelectorAll('.tree-row').forEach((r) => r.classList.remove('selected'));
  row.classList.add('selected');
  state.selectedNode = node;

  if (node.type === 'display') {
    state.selectedScreenId = node.id;
    state.previewKind = 'display';
    openDisplayPreview(node.id, node.title);
  } else if (node.type === 'global-object') {
    state.selectedScreenId = node.id;
    state.previewKind = 'global-object';
    openGlobalObjectPreview(node.id, node.title);
  } else if (node.type === 'image') {
    openImagePanel(node);
  } else if (node.action) {
    handleExplorerAction(node);
  } else if (node.type === 'item') {
    if (node.id === 'project-settings') showProjectSettingsDialog('general');
    else if (node.id === 'startup') showProjectSettingsDialog('runtime');
    else if (node.id === 'communications' || node.id === 'linx-communications') showProjectSettingsDialog('runtime');
    else openSystemPanel(node);
  } else if (node.type === 'folder' && !node.children?.length) {
    setStatus(`${node.label} — expand folder or select an item`);
  }
}

function getProjectSettingsWindowSize() {
  const profileId = document.getElementById('psWindowProfile').value;
  if (profileId === 'custom') {
    return {
      windowProfile: profileId,
      width: Number(document.getElementById('psWidth').value) || 800,
      height: Number(document.getElementById('psHeight').value) || 600
    };
  }
  const preset = WINDOW_SIZE_PRESETS.find((p) => p.id === profileId) || WINDOW_SIZE_PRESETS[2];
  return { windowProfile: profileId, width: preset.width, height: preset.height };
}

async function reloadDisplayPreview() {
  if (!state.selectedScreenId || !state.activeProject || previewStage?.classList.contains('hidden')) return;
  const loadToken = ++state.previewLoadToken;
  const screenId = state.selectedScreenId;
  await applyPreviewCanvasSize(screenId);
  if (loadToken !== state.previewLoadToken || state.selectedScreenId !== screenId) return;
  const { width, height } = state.previewCanvas;
  const objectParam = state.previewKind === 'global-object'
    ? `globalObject=${encodeURIComponent(screenId)}`
    : `screen=${encodeURIComponent(screenId)}`;
  previewFrame.src =
    `/runtime.html?embed=1&${objectParam}` +
    `&project=${encodeURIComponent(state.activeProject)}` +
    `&w=${width}&h=${height}&_=${Date.now()}`;
}

function applyPreviewZoom() {
  if (!previewFrame || previewStage?.classList.contains('hidden')) return;
  const scale = (state.viewPrefs?.zoom || 100) / 100;
  const { width, height } = state.previewCanvas;
  previewFrame.style.width = `${width}px`;
  previewFrame.style.height = `${height}px`;
  previewFrame.style.transform = scale === 1 ? '' : `scale(${scale})`;
}

async function applyPreviewCanvasSize(screenId) {
  await refreshProjectConfig();
  const rt = state.projectConfig?.runtime || {};
  let size = { ...DEFAULT_DISPLAY_SIZE, useProjectSize: true };
  if (screenId && state.activeProject) {
    try {
      const endpoint = state.previewKind === 'global-object'
        ? `/api/runtime/global-objects/${encodeURIComponent(screenId)}`
        : `/api/runtime/screens/${encodeURIComponent(screenId)}`;
      const screen = await fetchJson(`${endpoint}?project=${state.activeProject}`);
      size = resolveDisplaySize(screen, rt);
    } catch { /* use project default */ }
  } else {
    size.width = rt.width || DEFAULT_DISPLAY_SIZE.width;
    size.height = rt.height || DEFAULT_DISPLAY_SIZE.height;
  }
  state.previewCanvas = size;
  if (previewFrame) previewFrame.style.background = size.backgroundColor;
  applyPreviewZoom();
}

function openDisplayPreview(screenId, title) {
  state.previewKind = 'display';
  workspaceWelcome.classList.add('hidden');
  panelView.classList.add('hidden');
  showPreviewStage();
  const loadToken = ++state.previewLoadToken;
  applyPreviewCanvasSize(screenId).then(() => {
    if (loadToken !== state.previewLoadToken) return;
    if (state.selectedScreenId !== screenId) return;
    const { width, height } = state.previewCanvas;
    previewFrame.src =
      `/runtime.html?embed=1&screen=${encodeURIComponent(screenId)}` +
      `&project=${encodeURIComponent(state.activeProject)}` +
      `&w=${width}&h=${height}`;
  });
  state.selectedScreenId = screenId;
  trackOpenDisplay(screenId);
  setStatus(`Editing display: ${title || screenId}`);
  updateEditMenuState();
  updateViewMenuState();
  refreshPropertyPanel();
  refreshObjectExplorer();
}

function openGlobalObjectPreview(objectId, title) {
  state.previewKind = 'global-object';
  workspaceWelcome.classList.add('hidden');
  panelView.classList.add('hidden');
  showPreviewStage();
  const loadToken = ++state.previewLoadToken;
  applyPreviewCanvasSize(objectId).then(() => {
    if (loadToken !== state.previewLoadToken) return;
    if (state.selectedScreenId !== objectId) return;
    const { width, height } = state.previewCanvas;
    previewFrame.src =
      `/runtime.html?embed=1&globalObject=${encodeURIComponent(objectId)}` +
      `&project=${encodeURIComponent(state.activeProject)}` +
      `&w=${width}&h=${height}`;
  });
  state.selectedScreenId = objectId;
  setStatus(`Editing global object: ${title || objectId}`);
  updateEditMenuState();
  updateViewMenuState();
  refreshPropertyPanel();
  refreshObjectExplorer();
}

async function showImagePropertiesDialog(node) {
  if (!state.activeProject || !node) return;
  const fileName = node.fileName || node.id;
  const dialog = document.getElementById('imagePropertiesDialog');
  if (!dialog) return;

  try {
    const info = await fetchJson(
      `/api/projects/${encodeURIComponent(state.activeProject)}/images/${encodeURIComponent(fileName)}/info`
    );
    document.getElementById('imagePropsTitle').textContent =
      `${info.label} - /${info.projectName}/ (Images)`;
    document.getElementById('imagePropsType').textContent = info.typeLabel || 'True color';
    document.getElementById('imagePropsSize').textContent =
      `${info.width || 0} x ${info.height || 0}`;
    document.getElementById('imagePropsFormat').textContent = info.format || 'Unknown';
    const thumb = document.getElementById('imagePropsThumb');
    thumb.src = `${info.url}?_=${Date.now()}`;
    thumb.alt = info.label;
    dialog.showModal();
    setStatus(`Image: ${info.label}`);
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
}

function openImagePanel(node) {
  showImagePropertiesDialog(node);
}

async function importProjectImage() {
  if (!state.activeProject) {
    setStatus('Open a project first');
    return;
  }
  const input = document.getElementById('imageImportInput');
  if (!input) {
    alert('Image import is unavailable. Hard refresh the page (Ctrl+F5) and try again.');
    return;
  }
  input.value = '';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      setStatus(`Uploading ${file.name}…`);
      const dataBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          const comma = result.indexOf(',');
          resolve(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.onerror = () => reject(new Error('Could not read image file'));
        reader.readAsDataURL(file);
      });
      const data = await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, dataBase64 })
      });
      await loadExplorer(state.activeProject);
      setStatus(`Added image: ${data.image?.fileName || file.name}`);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
      alert(`Image upload failed: ${err.message}`);
    } finally {
      input.value = '';
    }
  };
  input.click();
}

async function deleteSelectedImage(node) {
  if (!state.activeProject || !node?.fileName) return;
  const label = node.label || node.fileName;
  if (!confirm(`Delete image "${label}" from this project?`)) return;
  await fetchJson(
    `/api/projects/${encodeURIComponent(state.activeProject)}/images/${encodeURIComponent(node.fileName)}`,
    { method: 'DELETE' }
  );
  panelView.classList.add('hidden');
  await loadExplorer(state.activeProject);
  setStatus(`Deleted image: ${label}`);
}

async function openTagsPanel() {
  workspaceWelcome.classList.add('hidden');
  hidePreviewStage();
  panelView.classList.remove('hidden');
  const tags = await fetchJson(`/api/runtime/tags?project=${state.activeProject}`);
  const rows = Object.entries(tags).map(([name, t]) =>
    `<tr><td>${escapeHtml(name)}</td><td>${escapeHtml(t.type || '')}</td><td class="mono">${escapeHtml(String(t.value))}</td><td>${escapeHtml(t.quality || '')}</td></tr>`
  ).join('');
  panelView.innerHTML = `
    <div class="panel-content">
      <h2>HMI Tags</h2>
      <table class="data-table"><thead><tr><th>Tag Name</th><th>Type</th><th>Value</th><th>Quality</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4">No tags</td></tr>'}</tbody></table>
    </div>`;
  setStatus('HMI Tags');
}

async function openAlarmsPanel() {
  workspaceWelcome.classList.add('hidden');
  hidePreviewStage();
  panelView.classList.remove('hidden');
  const active = await fetchJson('/api/projects/active');
  const alarms = active.config?.alarms || [];
  panelView.innerHTML = `
    <div class="panel-content">
      <h2>Alarm Definitions</h2>
      <table class="data-table"><thead><tr><th>Tag</th><th>Message</th><th>Priority</th></tr></thead>
      <tbody>${alarms.map((a) => `<tr><td>${escapeHtml(a.tag)}</td><td>${escapeHtml(a.message)}</td><td>P${a.priority}</td></tr>`).join('')}</tbody></table>
    </div>`;
  setStatus('Alarms');
}

function openSystemPanel(node) {
  workspaceWelcome.classList.add('hidden');
  hidePreviewStage();
  panelView.classList.remove('hidden');
  panelView.innerHTML = `
    <div class="panel-content">
      <h2>${escapeHtml(node.label)}</h2>
      <p>Configure ${escapeHtml(node.label.toLowerCase())} for project <strong>${escapeHtml(state.activeProject)}</strong>.</p>
      <p class="hint">Edit <code>projects/${escapeHtml(state.activeProject)}/project.json</code> to change these settings.</p>
    </div>`;
  setStatus(node.label);
}

function runRuntime() {
  if (!state.activeProject) {
    setStatus('Open an application first');
    return;
  }
  const url = `/runtime.html?project=${encodeURIComponent(state.activeProject)}`;
  const rt = state.projectConfig?.runtime || {};
  const w = rt.width || 800;
  const h = rt.height || 600;
  const features = `width=${w},height=${h}`;
  if (state.runtimeWindow && !state.runtimeWindow.closed) {
    state.runtimeWindow.location.href = url;
    state.runtimeWindow.focus();
  } else {
    state.runtimeWindow = window.open(url, 'planthmi-runtime', features);
  }
  setStatus('Runtime started — Test Application');
}

async function showProjectSettingsDialog(activeTab = 'general') {
  if (!state.activeProject) {
    setStatus('Open an application first');
    return;
  }
  await refreshProjectConfig();
  const cfg = state.projectConfig || {};
  const rt = cfg.runtime || {};
  const inact = cfg.inactivity || {};
  const screens = await fetchJson(`/api/runtime/screens?project=${state.activeProject}`);

  document.getElementById('projectSettingsTitle').textContent =
    `Project Settings - /${state.activeProject}/`;

  const profileSelect = document.getElementById('psWindowProfile');
  profileSelect.innerHTML = WINDOW_SIZE_PRESETS.map((p) =>
    `<option value="${p.id}">${escapeHtml(p.label)}</option>`
  ).join('');
  profileSelect.value = resolveWindowProfile(rt);
  applyWindowProfile(profileSelect.value, rt.width, rt.height);

  const target = rt.executionTarget || 'panel-performance';
  document.querySelectorAll('#projectSettingsForm input[name="executionTarget"]').forEach((el) => {
    el.checked = el.value === target;
  });

  document.getElementById('psAppName').value = cfg.name || state.activeProject;
  document.getElementById('psSubtitle').value = cfg.subtitle || '';
  document.getElementById('psDriver').value = cfg.communication?.driver || 'simulator';
  document.getElementById('psPoll').value = cfg.communication?.pollIntervalMs || 200;
  document.getElementById('psFullscreen').checked = Boolean(rt.fullscreen);
  const startupSelect = document.getElementById('psStartup');
  startupSelect.innerHTML = screens.map((s) =>
    `<option value="${escapeHtml(s.id)}"${s.id === (cfg.startupScreen || '100_Overview') ? ' selected' : ''}>${escapeHtml(s.id)}</option>`
  ).join('');

  document.getElementById('psInactivityEnabled').checked = inact.enabled !== false;
  document.getElementById('psTimeoutMin').value = inact.timeoutMinutes ?? 15;
  document.getElementById('psInactivityAction').value = inact.action || 'logout';

  switchProjectSettingsTab(activeTab);
  document.getElementById('projectSettingsDialog').showModal();
}

function resolveWindowProfile(runtime) {
  const saved = runtime?.windowProfile;
  if (saved && WINDOW_SIZE_PRESETS.some((p) => p.id === saved)) return saved;
  const width = runtime?.width;
  const height = runtime?.height;
  const match = WINDOW_SIZE_PRESETS.find((p) => p.id !== 'custom' && p.width === width && p.height === height);
  if (match) return match.id;
  if (width && height) return 'custom';
  return '800x600';
}

function applyWindowProfile(profileId, customW, customH) {
  const preset = WINDOW_SIZE_PRESETS.find((p) => p.id === profileId) || WINDOW_SIZE_PRESETS[2];
  const wEl = document.getElementById('psWidth');
  const hEl = document.getElementById('psHeight');
  const customRow = document.getElementById('psCustomSizeRow');
  const isCustom = profileId === 'custom';
  if (customRow) customRow.classList.toggle('hidden', !isCustom);
  wEl.readOnly = !isCustom;
  hEl.readOnly = !isCustom;
  wEl.value = isCustom ? (customW || 1024) : preset.width;
  hEl.value = isCustom ? (customH || 768) : preset.height;
}

function switchProjectSettingsTab(tabId) {
  document.querySelectorAll('#projectSettingsDialog .dialog-tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.tab === tabId);
  });
  document.querySelectorAll('#projectSettingsDialog .dialog-tab-panel').forEach((el) => {
    el.classList.toggle('active', el.dataset.tabPanel === tabId);
  });
}

function previewProjectWindowSize() {
  const { width, height } = getProjectSettingsWindowSize();
  state.previewCanvas = { width, height };
  applyPreviewZoom();
}

async function saveProjectSettings(e) {
  e.preventDefault();
  if (!state.activeProject) return;
  const appName = document.getElementById('psAppName').value.trim();
  const currentName = (state.projectConfig?.name || '').trim();
  if (appName.toLowerCase() !== currentName.toLowerCase() && isProjectNameTaken(appName, state.activeProject)) {
    alert(`A project named "${appName}" already exists. Choose a different application name.`);
    setStatus(`Error: A project named "${appName}" already exists`);
    return;
  }
  const { width, height, windowProfile } = getProjectSettingsWindowSize();
  const executionTarget = document.querySelector('#projectSettingsForm input[name="executionTarget"]:checked')?.value || 'panel-performance';

  const patch = {
    name: appName,
    subtitle: document.getElementById('psSubtitle').value.trim(),
    startupScreen: document.getElementById('psStartup').value,
    communication: {
      ...(state.projectConfig?.communication || {}),
      driver: document.getElementById('psDriver').value,
      pollIntervalMs: Number(document.getElementById('psPoll').value) || 200
    },
    runtime: {
      windowProfile,
      width,
      height,
      executionTarget,
      fullscreen: document.getElementById('psFullscreen').checked
    },
    inactivity: {
      enabled: document.getElementById('psInactivityEnabled').checked,
      timeoutMinutes: Number(document.getElementById('psTimeoutMin').value) || 15,
      action: document.getElementById('psInactivityAction').value
    }
  };

  try {
    const result = await fetchJson(`/api/projects/${state.activeProject}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    state.projectConfig = result.config;
    document.getElementById('projectSettingsDialog').close();
    await loadProjects();
    await loadExplorer(state.activeProject);
    if (state.selectedScreenId) {
      await reloadDisplayPreview();
      setStatus(`Project settings saved — display ${state.previewCanvas.width}×${state.previewCanvas.height}`);
    } else {
      setStatus(`Project settings saved — window size ${width}×${height}`);
    }
  } catch (err) {
    alert(`Could not save project settings: ${err.message}`);
    setStatus(`Error: ${err.message}`);
  }
}

function showApplicationPropertiesDialog() {
  showProjectSettingsDialog('runtime');
}

async function showApplicationLanguageDialog() {
  if (!state.activeProject) {
    setStatus('Open an application first');
    return;
  }
  await refreshProjectConfig();
  document.getElementById('appLanguageSelect').value =
    state.projectConfig?.studio?.language || 'en';
  document.getElementById('applicationLanguageDialog').showModal();
}

async function saveApplicationLanguage(e) {
  e.preventDefault();
  if (!state.activeProject) return;
  const language = document.getElementById('appLanguageSelect').value;
  const result = await fetchJson(`/api/projects/${state.activeProject}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studio: { language } })
  });
  state.projectConfig = result.config;
  document.getElementById('applicationLanguageDialog').close();
  setStatus(`Application language set to ${language}`);
}

function showCreateRuntimeDialog() {
  if (!state.activeProject) {
    setStatus('Open an application first');
    return;
  }
  document.getElementById('createRuntimeProject').textContent = state.activeProject;
  document.getElementById('createRuntimeDialog').showModal();
}

function handleToolbarAction(action) {
  const plannedAlign = ['align-left', 'align-right', 'align-hcenter', 'align-top', 'align-bottom', 'align-vcenter', 'distribute', 'create-group', 'group', 'same-size', 'fit-window'];
  switch (action) {
    case 'run': runRuntime(); setToolbarActive('run'); break;
    case 'stop':
      state.runtimeWindow?.close();
      setStatus('Runtime stopped');
      setToolbarActive('stop');
      break;
    case 'cut': handleEditAction('cut'); break;
    case 'copy': handleEditAction('copy'); break;
    case 'paste': handleEditAction('paste'); break;
    case 'undo': handleEditAction('undo'); break;
    case 'redo': handleEditAction('redo'); break;
    case 'zoom-in': handleViewAction('zoom-in'); break;
    case 'zoom-out': handleViewAction('zoom-out'); break;
    case 'fit-window':
      setViewPref('zoom', 100);
      setStatus('Zoom fit — 100%');
      break;
    default:
      if (plannedAlign.includes(action)) setStatus(`${action.replace(/-/g, ' ')} — visual editor planned`);
      break;
  }
}

function setToolbarActive(name) {
  document.querySelectorAll('#toolbarMain [data-tb="run"], #toolbarMain [data-tb="stop"]').forEach((el) => {
    el.classList.toggle('tb-active', el.dataset.tb === name);
  });
}

function handleApplicationAction(action) {
  closeAllMenus();
  switch (action) {
    case 'test-application': runRuntime(); break;
    case 'create-runtime': showCreateRuntimeDialog(); break;
    case 'change-language': showApplicationLanguageDialog(); break;
    case 'app-properties': showApplicationPropertiesDialog(); break;
    default: break;
  }
}

async function openDiagnosticsViewer() {
  if (!state.activeProject) {
    setStatus('Open an application first');
    return;
  }
  workspaceWelcome.classList.add('hidden');
  hidePreviewStage();
  panelView.classList.remove('hidden');
  const [status, tags] = await Promise.all([
    fetchJson(`/api/runtime/status?project=${state.activeProject}`),
    fetchJson(`/api/runtime/tags?project=${state.activeProject}`)
  ]);
  const tagRows = Object.entries(tags).slice(0, 50).map(([name, t]) =>
    `<tr><td>${escapeHtml(name)}</td><td class="mono">${escapeHtml(String(t.value))}</td><td>${escapeHtml(t.quality || '')}</td></tr>`
  ).join('');
  panelView.innerHTML = `
    <div class="panel-content">
      <h2>Diagnostics Viewer</h2>
      <p><strong>Project:</strong> ${escapeHtml(status.projectName)} (${escapeHtml(status.projectId)})</p>
      <p><strong>Communication:</strong> ${escapeHtml(status.communication?.driver || '—')} — ${escapeHtml(status.communication?.connected ? 'Connected' : 'Disconnected')}</p>
      <p><strong>Startup screen:</strong> ${escapeHtml(status.startupScreen || '—')}</p>
      <h3 style="margin-top:12px;font-size:12px">Live tags (first 50)</h3>
      <table class="data-table"><thead><tr><th>Tag</th><th>Value</th><th>Quality</th></tr></thead>
      <tbody>${tagRows || '<tr><td colspan="3">No tags</td></tr>'}</tbody></table>
    </div>`;
  setStatus('Diagnostics Viewer');
}

function showFindDialog() {
  document.getElementById('findText').value = '';
  document.getElementById('findResults').innerHTML = '';
  document.getElementById('findDialog').showModal();
}

async function runFind(e) {
  e.preventDefault();
  if (!state.activeProject) {
    setStatus('Open an application first');
    return;
  }
  const query = document.getElementById('findText').value.trim().toLowerCase();
  if (!query) return;
  const results = [];
  if (document.getElementById('findInDisplays').checked) {
    const screens = await fetchJson(`/api/runtime/screens?project=${state.activeProject}`);
    for (const s of screens) {
      if (s.id.toLowerCase().includes(query) || (s.title || '').toLowerCase().includes(query)) {
        results.push({ type: 'display', id: s.id, label: s.id });
      }
    }
  }
  if (document.getElementById('findInTags').checked) {
    await refreshProjectConfig();
    for (const t of state.projectConfig?.tags || []) {
      if (t.name.toLowerCase().includes(query) || (t.description || '').toLowerCase().includes(query)) {
        results.push({ type: 'tag', id: t.name, label: t.name });
      }
    }
  }
  const el = document.getElementById('findResults');
  if (!results.length) {
    el.innerHTML = '<div class="empty">No matches found.</div>';
    return;
  }
  el.innerHTML = results.map((r) =>
    `<div class="result-row" data-find-type="${r.type}" data-find-id="${escapeHtml(r.id)}">${escapeHtml(r.type)}: ${escapeHtml(r.label)}</div>`
  ).join('');
  el.querySelectorAll('.result-row').forEach((row) => {
    row.addEventListener('click', () => {
      document.getElementById('findDialog').close();
      if (row.dataset.findType === 'display') openDisplayPreview(row.dataset.findId, row.dataset.findId);
      else openTagsPanel();
    });
  });
  setStatus(`Find: ${results.length} match(es)`);
}

function showReplaceDialog() {
  document.getElementById('replaceFindText').value = '';
  document.getElementById('replaceWithText').value = '';
  document.getElementById('replacePreview').innerHTML = '';
  document.getElementById('replaceDialog').showModal();
}

async function runReplaceAll(e) {
  e.preventDefault();
  if (!state.activeProject) {
    setStatus('Open an application first');
    return;
  }
  const find = document.getElementById('replaceFindText').value.trim();
  const replace = document.getElementById('replaceWithText').value.trim();
  if (!find) return;
  const screens = await fetchJson(`/api/runtime/screens?project=${state.activeProject}`);
  let count = 0;
  for (const s of screens) {
    const screen = await fetchJson(`/api/runtime/screens/${encodeURIComponent(s.id)}?project=${state.activeProject}`);
    const raw = JSON.stringify(screen);
    if (!raw.includes(find)) continue;
    const updated = JSON.parse(raw.split(find).join(replace));
    await fetchJson(`/api/projects/${state.activeProject}/screens/${encodeURIComponent(s.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    count++;
  }
  document.getElementById('replacePreview').innerHTML = `<div class="empty">Replaced in ${count} display(s).</div>`;
  if (state.selectedScreenId) openDisplayPreview(state.selectedScreenId, state.selectedScreenId);
  setStatus(`Replace complete: ${count} display(s) updated`);
}

function showCrossRefDialog() {
  document.getElementById('crossRefText').value = '';
  document.getElementById('crossRefResults').innerHTML = '';
  document.getElementById('crossRefDialog').showModal();
}

async function runCrossReference(e) {
  e.preventDefault();
  if (!state.activeProject) {
    setStatus('Open an application first');
    return;
  }
  const query = document.getElementById('crossRefText').value.trim();
  if (!query) return;
  const screens = await fetchJson(`/api/runtime/screens?project=${state.activeProject}`);
  const hits = [];
  for (const s of screens) {
    const screen = await fetchJson(`/api/runtime/screens/${encodeURIComponent(s.id)}?project=${state.activeProject}`);
    if (JSON.stringify(screen).includes(query)) hits.push(s.id);
  }
  const el = document.getElementById('crossRefResults');
  if (!hits.length) {
    el.innerHTML = '<div class="empty">No references found.</div>';
    setStatus(`Cross reference: no matches for "${query}"`);
    return;
  }
  el.innerHTML = hits.map((id) =>
    `<div class="result-row" data-screen-id="${escapeHtml(id)}">Display: ${escapeHtml(id)}</div>`
  ).join('');
  el.querySelectorAll('.result-row').forEach((row) => {
    row.addEventListener('click', () => {
      document.getElementById('crossRefDialog').close();
      openDisplayPreview(row.dataset.screenId, row.dataset.screenId);
    });
  });
  setStatus(`Cross reference: ${hits.length} display(s) reference "${query}"`);
}

function showTagWizardDialog() {
  if (!state.activeProject) {
    setStatus('Open an application first');
    return;
  }
  document.getElementById('tagWizardProject').textContent = state.activeProject;
  document.getElementById('tagImportJson').value = '';
  document.getElementById('tagWizardDialog').showModal();
}

async function exportProjectTags() {
  await refreshProjectConfig();
  const tags = state.projectConfig?.tags || [];
  const blob = new Blob([JSON.stringify(tags, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${state.activeProject}_tags.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus(`Exported ${tags.length} tags`);
}

async function importProjectTags() {
  const raw = document.getElementById('tagImportJson').value.trim();
  if (!raw) return;
  let imported;
  try {
    imported = JSON.parse(raw);
  } catch {
    alert('Invalid JSON. Expected an array of tag definitions.');
    return;
  }
  if (!Array.isArray(imported)) {
    alert('Expected a JSON array of tag definitions.');
    return;
  }
  await refreshProjectConfig();
  const existing = state.projectConfig?.tags || [];
  const byName = new Map(existing.map((t) => [t.name, t]));
  for (const t of imported) {
    if (t?.name) byName.set(t.name, { ...byName.get(t.name), ...t });
  }
  await fetchJson(`/api/projects/${state.activeProject}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: [...byName.values()] })
  });
  await refreshProjectConfig();
  setStatus(`Imported tags — ${byName.size} total in project`);
}

function showOptionsDialog() {
  document.getElementById('optStatusBar').checked = state.viewPrefs.statusBar;
  document.getElementById('optExplorer').checked = state.viewPrefs.explorerWindow;
  document.getElementById('optWorkbook').checked = state.viewPrefs.workbookMode;
  document.getElementById('optGridSize').value = state.viewPrefs.gridSize;
  document.getElementById('optionsDialog').showModal();
}

function saveOptions(e) {
  e.preventDefault();
  state.viewPrefs.statusBar = document.getElementById('optStatusBar').checked;
  state.viewPrefs.explorerWindow = document.getElementById('optExplorer').checked;
  state.viewPrefs.workbookMode = document.getElementById('optWorkbook').checked;
  state.viewPrefs.gridSize = Number(document.getElementById('optGridSize').value) || 10;
  saveViewPrefs();
  applyViewPrefs();
  document.getElementById('optionsDialog').close();
  setStatus('Options saved');
}

function handleToolsAction(action) {
  closeAllMenus();
  switch (action) {
    case 'diag-setup': openSystemPanelById('diagnostics-setup'); break;
    case 'diag-viewer': openDiagnosticsViewer(); break;
    case 'transfer': document.getElementById('transferDialog').showModal(); break;
    case 'tag-wizard': showTagWizardDialog(); break;
    case 'app-manager': showOpenProjectDialog(); break;
    case 'languages': showApplicationLanguageDialog(); break;
    case 'find': showFindDialog(); break;
    case 'replace': showReplaceDialog(); break;
    case 'cross-ref': showCrossRefDialog(); break;
    case 'options': showOptionsDialog(); break;
    default: setStatus(`${action} — planned`); break;
  }
}

function showNewProjectDialog() {
  showStartupDialog('new');
}

function getWindowProfileLabel(profileId) {
  const preset = WINDOW_SIZE_PRESETS.find((p) => p.id === profileId);
  return preset?.label || profileId;
}

function fillStartupSelects() {
  const langSel = document.getElementById('startupLanguage');
  const resSel = document.getElementById('startupResolution');
  const metaLang = document.getElementById('startupMetaLanguage');
  if (langSel && !langSel.options.length) {
    langSel.innerHTML = LANGUAGE_OPTIONS.map((l) =>
      `<option value="${escapeHtml(l.id)}">${escapeHtml(l.label)}</option>`
    ).join('');
  }
  if (metaLang && !metaLang.options.length) {
    metaLang.innerHTML = LANGUAGE_OPTIONS.map((l) =>
      `<option value="${escapeHtml(l.id)}">${escapeHtml(l.label)}</option>`
    ).join('');
  }
  if (resSel && !resSel.options.length) {
    resSel.innerHTML = WINDOW_SIZE_PRESETS.filter((p) => p.id !== 'custom').map((p) =>
      `<option value="${escapeHtml(p.id)}">${escapeHtml(p.label)}</option>`
    ).join('');
  }
}

function switchStartupTab(tabId) {
  document.querySelectorAll('.startup-tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.startupTab === tabId);
  });
  document.querySelectorAll('.startup-tab-panel').forEach((el) => {
    el.classList.toggle('active', el.dataset.startupPanel === tabId);
  });
  document.getElementById('startupFooterNew')?.classList.toggle('hidden', tabId !== 'new');
  document.getElementById('startupFooterExisting')?.classList.toggle('hidden', tabId !== 'existing');
}

function validateStartupNewForm(showError = true) {
  const name = document.getElementById('startupAppName')?.value.trim() || '';
  const err = document.getElementById('startupNameError');
  const btn = document.getElementById('startupCreateBtn');
  if (!name) {
    if (err) {
      err.textContent = '';
      err.classList.add('hidden');
    }
    if (btn) btn.disabled = true;
    return false;
  }
  if (isProjectNameTaken(name)) {
    if (showError && err) {
      err.textContent = `A project named "${name}" already exists. Choose a different name.`;
      err.classList.remove('hidden');
    }
    if (btn) btn.disabled = true;
    return false;
  }
  if (err) err.classList.add('hidden');
  if (btn) btn.disabled = false;
  return true;
}

function renderStartupProjectList() {
  const list = document.getElementById('startupProjectList');
  if (!list) return;

  if (!state.projects.length) {
    list.innerHTML = '<li class="startup-list-empty">No applications found. Switch to the New tab to create one.</li>';
    state.startupSelectedProjectId = null;
    updateStartupExistingMeta();
    return;
  }

  if (!state.startupSelectedProjectId || !state.projects.some((p) => p.id === state.startupSelectedProjectId)) {
    state.startupSelectedProjectId = state.activeProject || state.projects[0].id;
  }

  list.innerHTML = state.projects.map((p) => {
    const dupes = state.projects.filter((x) => x.name === p.name).length > 1;
    const label = dupes ? `${p.name} [${p.id}]` : p.name;
    const selected = p.id === state.startupSelectedProjectId ? ' selected' : '';
    return `<li data-project-id="${escapeHtml(p.id)}" class="${selected.trim()}">${escapeHtml(label)}</li>`;
  }).join('');

  list.querySelectorAll('li[data-project-id]').forEach((li) => {
    li.addEventListener('click', () => {
      list.querySelectorAll('li.selected').forEach((el) => el.classList.remove('selected'));
      li.classList.add('selected');
      state.startupSelectedProjectId = li.dataset.projectId;
      updateStartupExistingMeta();
    });
    li.addEventListener('dblclick', () => {
      state.startupSelectedProjectId = li.dataset.projectId;
      startupOpenSelectedProject();
    });
  });
  updateStartupExistingMeta();
}

function updateStartupExistingMeta() {
  const project = state.projects.find((p) => p.id === state.startupSelectedProjectId);
  const openedWith = document.getElementById('startupMetaOpenedWith');
  const resolution = document.getElementById('startupMetaResolution');
  const metaLang = document.getElementById('startupMetaLanguage');
  const openBtn = document.getElementById('startupOpenBtn');
  if (openedWith) openedWith.value = project?.lastOpenedWith || STUDIO_PRODUCT_NAME;
  if (resolution) resolution.value = project ? getWindowProfileLabel(project.windowProfile) : '';
  if (metaLang) metaLang.value = project?.language || 'en';
  if (openBtn) openBtn.disabled = !project;
}

function resetStartupNewForm() {
  const nameEl = document.getElementById('startupAppName');
  const descEl = document.getElementById('startupDescription');
  const langEl = document.getElementById('startupLanguage');
  const resEl = document.getElementById('startupResolution');
  if (nameEl) nameEl.value = '';
  if (descEl) descEl.value = '';
  if (langEl) langEl.value = 'en';
  if (resEl) resEl.value = '640x480';
  document.getElementById('startupNameError')?.classList.add('hidden');
  validateStartupNewForm(false);
}

function showStartupDialog(tab = 'existing') {
  fillStartupSelects();
  resetStartupNewForm();
  state.startupSelectedProjectId = state.activeProject || state.projects[0]?.id || null;
  renderStartupProjectList();
  switchStartupTab(tab);
  document.getElementById('startupOverlay')?.classList.remove('hidden');
  if (tab === 'new') document.getElementById('startupAppName')?.focus();
}

function hideStartupDialog() {
  document.getElementById('startupOverlay')?.classList.add('hidden');
}

async function startupCreateProject() {
  if (!validateStartupNewForm(true)) return;
  const name = document.getElementById('startupAppName').value.trim();
  const subtitle = document.getElementById('startupDescription').value.trim();
  const language = document.getElementById('startupLanguage').value;
  const windowProfile = document.getElementById('startupResolution').value;
  try {
    await createProject(name, { subtitle, language, windowProfile });
    hideStartupDialog();
  } catch (err) {
    setStatus(`Error: ${err.message}`);
    const errEl = document.getElementById('startupNameError');
    if (errEl) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
  }
}

async function startupOpenSelectedProject() {
  if (!state.startupSelectedProjectId) return;
  try {
    await openProject(state.startupSelectedProjectId);
  } catch (err) {
    setStatus(`Error: ${err.message}`);
    alert(`Could not open application: ${err.message}`);
  }
}

function initStartupDialog() {
  document.querySelectorAll('.startup-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchStartupTab(tab.dataset.startupTab));
  });
  document.getElementById('startupAppName')?.addEventListener('input', () => validateStartupNewForm(false));
  document.getElementById('startupCreateBtn')?.addEventListener('click', () => {
    startupCreateProject().catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('startupOpenBtn')?.addEventListener('click', () => {
    startupOpenSelectedProject().catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('startupCancelNewBtn')?.addEventListener('click', hideStartupDialog);
  document.getElementById('startupCancelExistingBtn')?.addEventListener('click', async () => {
    hideStartupDialog();
    if (state.startupSelectedProjectId) {
      try {
        await openProject(state.startupSelectedProjectId);
      } catch (err) {
        setStatus(`Error: ${err.message}`);
      }
    }
  });
  document.getElementById('startupHelpNewBtn')?.addEventListener('click', () => {
    alert('Create a new Plant HMI application with 18 standard displays. Choose resolution to match your target panel size.');
  });
  document.getElementById('startupHelpExistingBtn')?.addEventListener('click', () => {
    alert('Select an application from the list and click Open, or double-click a name to open it.');
  });
}

function isProjectNameTaken(name, excludeId = null) {
  const target = String(name || '').trim().toLowerCase();
  if (!target) return false;
  return state.projects.some((p) =>
    p.id !== excludeId && (p.name || '').trim().toLowerCase() === target
  );
}

function clearNewProjectNameError() {
  const err = document.getElementById('newProjectNameError');
  if (!err) return;
  err.textContent = '';
  err.classList.add('hidden');
}

function validateNewProjectName(showError = true) {
  const name = document.getElementById('newProjectName').value.trim();
  const err = document.getElementById('newProjectNameError');
  const submitBtn = document.querySelector('#newProjectForm button[type="submit"]');
  const taken = isProjectNameTaken(name);
  if (!name) {
    if (showError) clearNewProjectNameError();
    if (submitBtn) submitBtn.disabled = true;
    return false;
  }
  if (taken) {
    if (showError && err) {
      err.textContent = `A project named "${name}" already exists. Choose a different name.`;
      err.classList.remove('hidden');
    }
    if (submitBtn) submitBtn.disabled = true;
    return false;
  }
  clearNewProjectNameError();
  if (submitBtn) submitBtn.disabled = false;
  return true;
}

async function deleteProjectById(id) {
  const project = state.projects.find((p) => p.id === id);
  const dupes = project && state.projects.filter((p) => p.name === project.name).length > 1;
  const label = project
    ? (dupes ? `${project.name} (${project.id})` : project.name)
    : id;
  if (!confirm(`Delete project "${label}"?\n\nThis permanently removes the project folder and cannot be undone.`)) {
    return false;
  }

  try {
    const result = await fetchJson(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
    state.activeProject = result.activeId || null;
    state.openDisplays = [];
    closeDisplayWorkspace();

    if (!state.activeProject) {
      explorerTree.innerHTML = '';
      explorerProject.textContent = '—';
      state.projectConfig = null;
    } else {
      workspaceWelcome.classList.add('hidden');
      await loadExplorer(state.activeProject);
    }

    await loadProjects();
    renderWorkbookTabs();
    updateEditMenuState();
    updateViewMenuState();
    setStatus(`Deleted project: ${label}`);
    return true;
  } catch (err) {
    setStatus(`Error: ${err.message}`);
    alert(`Could not delete project: ${err.message}\n\nRestart the server (npm start) if delete was recently added.`);
    return false;
  }
}

async function deleteActiveProject() {
  if (!state.activeProject) {
    setStatus('No application open to delete');
    return;
  }
  closeAllMenus();
  const deleted = await deleteProjectById(state.activeProject);
  if (deleted && !state.activeProject) {
    openProjectDialog.close();
  }
}

async function createProject(name, options = {}) {
  const result = await fetchJson('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, ...options })
  });
  await openProject(result.project.id);
  setStatus(`Created project: ${result.project.name} (${result.project.screenCount || 18} standard displays)`);
}

function showAddDisplayDialog(defaultFolder) {
  if (!state.activeProject) {
    setStatus('Open or create a project first');
    return;
  }
  document.getElementById('addPageNo').value = '';
  document.getElementById('addScreenName').value = '';
  if (defaultFolder) {
    document.getElementById('addFolder').value = defaultFolder;
  }
  document.getElementById('addDisplayDialog').showModal();
}

function folderForScreenId(screenId) {
  const prefix = String(screenId || '').split('_')[0];
  return DISPLAY_FOLDER_IDS.find((id) => id.startsWith(`${prefix}_`)) || '100_Overview';
}

function isDisplayCategoryFolder(node) {
  return node?.type === 'folder' && DISPLAY_FOLDER_IDS.includes(node.id);
}

function isGraphicsTreeNode(node) {
  const graphicsIds = [
    'displays', 'graphics', 'global-objects', 'symbol-factory', 'libraries',
    'images', 'parameters', 'local-messages', 'image-library'
  ];
  return graphicsIds.includes(node?.id)
    || isDisplayCategoryFolder(node)
    || node?.type === 'display';
}

function getExplorerContextMenuItems(node) {
  if (!node) return [];

  if (node.id === 'displays' || node.id === 'graphics' || node.id === 'global-objects' || isDisplayCategoryFolder(node)) {
    return [
      { action: 'new-display', label: 'New' },
      { action: 'add-component', label: 'Add Component into Project...' },
      { action: 'new-folder', label: 'New Folder', disabled: true },
      { separator: true },
      { action: 'delete', label: 'Delete', disabled: true },
      { action: 'remove', label: 'Remove', disabled: true },
      { separator: true },
      { action: 'import-export', label: 'Import and Export...' },
      { action: 'filter', label: 'Filter...' }
    ];
  }

  if (node.type === 'display') {
    return [
      { action: 'new-display', label: 'New' },
      { action: 'add-component', label: 'Add Component into Project...', disabled: true },
      { action: 'new-folder', label: 'New Folder', disabled: true },
      { separator: true },
      { action: 'delete', label: 'Delete' },
      { action: 'remove', label: 'Remove' },
      { separator: true },
      { action: 'import-export', label: 'Import and Export...', disabled: true },
      { action: 'filter', label: 'Filter...', disabled: true }
    ];
  }

  if (node.id === 'images' || node.type === 'image') {
    return [
      { action: 'add-image', label: 'Add Component into Project...' },
      { action: 'delete', label: 'Delete', disabled: node.id === 'images' },
      { action: 'remove', label: 'Remove', disabled: node.id === 'images' }
    ];
  }

  if (node.id === 'hmi-tags' || node.id === 'hmi-tags-list') {
    return [
      { action: 'new-tag', label: 'New' },
      { action: 'add-component', label: 'Add Component into Project...', disabled: true },
      { action: 'new-folder', label: 'New Folder', disabled: true },
      { separator: true },
      { action: 'delete', label: 'Delete', disabled: true },
      { action: 'remove', label: 'Remove', disabled: true },
      { separator: true },
      { action: 'import-export', label: 'Import and Export...' },
      { action: 'filter', label: 'Filter...' }
    ];
  }

  if (node.id === 'alarms' || node.id === 'alarm-setup') {
    return [
      { action: 'new-alarm', label: 'New' },
      { action: 'add-component', label: 'Add Component into Project...', disabled: true },
      { action: 'new-folder', label: 'New Folder', disabled: true },
      { separator: true },
      { action: 'delete', label: 'Delete', disabled: true },
      { action: 'remove', label: 'Remove', disabled: true },
      { separator: true },
      { action: 'import-export', label: 'Import and Export...', disabled: true },
      { action: 'filter', label: 'Filter...' }
    ];
  }

  if (node.id === 'information' || node.id === 'information-setup' || node.id === 'information-messages') {
    return [
      { action: 'new', label: 'New', disabled: true },
      { action: 'add-component', label: 'Add Component into Project...', disabled: true },
      { action: 'new-folder', label: 'New Folder', disabled: true },
      { separator: true },
      { action: 'delete', label: 'Delete', disabled: true },
      { action: 'remove', label: 'Remove', disabled: true },
      { separator: true },
      { action: 'import-export', label: 'Import and Export...', disabled: true },
      { action: 'filter', label: 'Filter...' }
    ];
  }

  if (node.id === 'recipeplus' || node.id === 'recipeplus-setup' || node.id === 'recipeplus-editor') {
    return [
      { action: 'new', label: 'New', disabled: true },
      { action: 'add-component', label: 'Add Component into Project...', disabled: true },
      { action: 'new-folder', label: 'New Folder', disabled: true },
      { separator: true },
      { action: 'delete', label: 'Delete', disabled: true },
      { action: 'remove', label: 'Remove', disabled: true },
      { separator: true },
      { action: 'import-export', label: 'Import and Export...', disabled: true },
      { action: 'filter', label: 'Filter...' }
    ];
  }

  if (node.type === 'folder' && node.id === 'system') {
    return [
      { action: 'new', label: 'New', disabled: true },
      { action: 'add-component', label: 'Add Component into Project...', disabled: true },
      { action: 'new-folder', label: 'New Folder', disabled: true },
      { separator: true },
      { action: 'delete', label: 'Delete', disabled: true },
      { action: 'remove', label: 'Remove', disabled: true },
      { separator: true },
      { action: 'import-export', label: 'Import and Export...', disabled: true },
      { action: 'filter', label: 'Filter...' }
    ];
  }

  if (node.type === 'item') {
    return [
      { action: 'open', label: 'Open' },
      { separator: true },
      { action: 'delete', label: 'Delete', disabled: true },
      { action: 'remove', label: 'Remove', disabled: true }
    ];
  }

  return [
    { action: 'new', label: 'New', disabled: true },
    { action: 'add-component', label: 'Add Component into Project...', disabled: true },
    { action: 'new-folder', label: 'New Folder', disabled: true },
    { separator: true },
    { action: 'delete', label: 'Delete', disabled: true },
    { action: 'remove', label: 'Remove', disabled: true },
    { separator: true },
    { action: 'import-export', label: 'Import and Export...', disabled: true },
    { action: 'filter', label: 'Filter...' }
  ];
}

function showExplorerContextMenu(event, node) {
  const menu = document.getElementById('explorerContextMenu');
  if (!menu) return;

  const items = getExplorerContextMenuItems(node);
  if (!items.length) return;

  state.contextMenuNode = node;
  menu.innerHTML = items.map((item) => {
    if (item.separator) return '<div class="menu-sep"></div>';
    const cls = item.disabled ? 'menu-entry disabled' : 'menu-entry';
    return `<button type="button" class="${cls}" data-ctx-action="${escapeHtml(item.action)}">${escapeHtml(item.label)}</button>`;
  }).join('');

  menu.querySelectorAll('[data-ctx-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      runExplorerContextAction(btn.dataset.ctxAction, state.contextMenuNode);
      hideExplorerContextMenu();
    });
  });

  positionContextMenu(menu, event.clientX, event.clientY);
  hideWorkspaceContextMenu();
}

function hideExplorerContextMenu() {
  const menu = document.getElementById('explorerContextMenu');
  if (menu) menu.classList.add('hidden');
  state.contextMenuNode = null;
}

function getWorkspaceContextMenuItems() {
  if (!displayIsOpen()) return [];
  const zoomDefault = state.viewPrefs.zoom === 100;
  return [
    { action: 'display-settings', label: 'Display Settings...' },
    { action: 'key-assignments', label: 'Key Assignments' },
    { separator: true },
    { action: 'paste', label: 'Paste', disabled: true },
    { action: 'paste-no-strings', label: 'Paste without localized strings', disabled: true },
    { separator: true },
    { action: 'show-grid', label: 'Show Grid', checkable: true, checked: state.viewPrefs.showGrid },
    { action: 'snap-on', label: 'Snap On', checkable: true, checked: state.viewPrefs.snapOn },
    { action: 'grid-settings', label: 'Grid Settings...' },
    { separator: true },
    { action: 'zoom-in', label: 'Zoom In' },
    { action: 'zoom-out', label: 'Zoom Out' },
    { action: 'cancel-zoom', label: 'Cancel Zoom', disabled: zoomDefault },
    { separator: true },
    { action: 'unlock-wallpaper', label: 'Unlock All Wallpaper', disabled: true }
  ];
}

function renderContextMenuButton(item) {
  if (item.separator) return '<div class="menu-sep"></div>';
  let cls = 'menu-entry';
  if (item.disabled) cls += ' disabled';
  if (item.checkable) {
    cls += ' checkable';
    if (item.checked) cls += ' checked';
    return `<button type="button" class="${cls}" data-ctx-action="${escapeHtml(item.action)}"><span class="check"></span><span>${escapeHtml(item.label)}</span></button>`;
  }
  return `<button type="button" class="${cls}" data-ctx-action="${escapeHtml(item.action)}">${escapeHtml(item.label)}</button>`;
}

function positionContextMenu(menu, clientX, clientY) {
  const pad = 4;
  let left = clientX;
  let top = clientY;
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.classList.remove('hidden');

  const rect = menu.getBoundingClientRect();
  if (left + rect.width > window.innerWidth - pad) {
    left = Math.max(pad, window.innerWidth - rect.width - pad);
  }
  if (top + rect.height > window.innerHeight - pad) {
    top = Math.max(pad, window.innerHeight - rect.height - pad);
  }
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function showWorkspaceContextMenu(event) {
  if (!displayIsOpen()) return;
  event.preventDefault();
  hideExplorerContextMenu();

  const menu = document.getElementById('workspaceContextMenu');
  if (!menu) return;

  const items = getWorkspaceContextMenuItems();
  menu.innerHTML = items.map(renderContextMenuButton).join('');
  menu.querySelectorAll('[data-ctx-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      runWorkspaceContextAction(btn.dataset.ctxAction);
      hideWorkspaceContextMenu();
    });
  });
  positionContextMenu(menu, event.clientX, event.clientY);
}

function showWorkspaceContextMenuFromFrame(clientX, clientY) {
  if (!displayIsOpen() || !previewFrame) return;
  const rect = previewFrame.getBoundingClientRect();
  const scale = (state.viewPrefs?.zoom || 100) / 100;
  showWorkspaceContextMenu({
    preventDefault() {},
    clientX: rect.left + clientX * scale,
    clientY: rect.top + clientY * scale
  });
}

function hideWorkspaceContextMenu() {
  document.getElementById('workspaceContextMenu')?.classList.add('hidden');
}

function runWorkspaceContextAction(action) {
  switch (action) {
    case 'display-settings':
      showDisplaySettingsDialog().catch((err) => setStatus(`Error: ${err.message}`));
      break;
    case 'key-assignments':
      showKeyAssignmentsDialog();
      break;
    case 'show-grid':
      handleViewAction('show-grid', 'showGrid');
      break;
    case 'snap-on':
      handleViewAction('snap-on', 'snapOn');
      break;
    case 'grid-settings':
      handleViewAction('grid-settings');
      break;
    case 'zoom-in':
      handleViewAction('zoom-in');
      break;
    case 'zoom-out':
      handleViewAction('zoom-out');
      break;
    case 'cancel-zoom':
      handleViewAction('cancel-zoom');
      break;
    default:
      break;
  }
}

function initWorkspaceContextMenu() {
  // Menu only from right-clicks inside the display canvas (embed iframe posts message).
  window.addEventListener('message', (e) => {
    if (e.origin !== window.location.origin) return;
    if (e.data?.type === 'planthmi-embed-contextmenu') {
      showWorkspaceContextMenuFromFrame(e.data.x, e.data.y);
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#workspaceContextMenu')) hideWorkspaceContextMenu();
  });
  document.addEventListener('contextmenu', () => {
    hideWorkspaceContextMenu();
  });
  window.addEventListener('scroll', hideWorkspaceContextMenu, true);
  window.addEventListener('resize', hideWorkspaceContextMenu);
}

function runExplorerContextAction(action, node) {
  if (!node) return;

  switch (action) {
    case 'new-display': {
      const folder = isDisplayCategoryFolder(node)
        ? node.id
        : node.type === 'display'
          ? folderForScreenId(node.id)
          : undefined;
      showAddDisplayDialog(folder);
      break;
    }
    case 'add-image':
      importProjectImage();
      break;
    case 'add-component':
      if (node.id === 'images') importProjectImage();
      else if (isGraphicsTreeNode(node)) showAddDisplayDialog(isDisplayCategoryFolder(node) ? node.id : undefined);
      else setStatus('Add Component — select a display folder or display');
      break;
    case 'new-tag':
      showTagWizardDialog();
      break;
    case 'new-alarm':
      openAlarmsPanel();
      setStatus('New alarm message — edit in Alarms panel');
      break;
    case 'new':
      break;
    case 'delete':
    case 'remove':
      if (node.type === 'display') deleteSelectedDisplay();
      else if (node.type === 'image') deleteSelectedImage(node);
      break;
    case 'import-export':
      if (node.id === 'hmi-tags' || node.id === 'hmi-tags-list') showTagWizardDialog();
      else document.getElementById('transferDialog').showModal();
      break;
    case 'filter':
      showExplorerFilterDialog();
      break;
    case 'open': {
      const row = explorerTree.querySelector(`.tree-row[data-node-id="${CSS.escape(node.id)}"]`);
      if (row) selectNode(row, node);
      break;
    }
    default:
      break;
  }
}

function showExplorerFilterDialog() {
  document.getElementById('explorerFilterText').value = state.explorerFilter || '';
  document.getElementById('explorerFilterDialog').showModal();
}

function applyExplorerFilter() {
  const filter = (state.explorerFilter || '').trim().toLowerCase();

  function visit(nodeEl) {
    const row = nodeEl.querySelector(':scope > .tree-row');
    const label = (row?.querySelector('.tree-label')?.textContent || '').toLowerCase();
    const childrenEl = nodeEl.querySelector(':scope > .tree-children');
    let childVisible = false;

    if (childrenEl) {
      for (const child of childrenEl.children) {
        if (visit(child)) childVisible = true;
      }
    }

    const show = !filter || childVisible || label.includes(filter);
    nodeEl.style.display = show ? '' : 'none';
    return show;
  }

  for (const nodeEl of explorerTree.children) {
    visit(nodeEl);
  }
}

function initExplorerContextMenu() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#explorerContextMenu')) hideExplorerContextMenu();
  });
  document.addEventListener('contextmenu', (e) => {
    if (!e.target.closest('#explorerTree')) hideExplorerContextMenu();
    else hideWorkspaceContextMenu();
  });
  window.addEventListener('scroll', hideExplorerContextMenu, true);
  window.addEventListener('resize', hideExplorerContextMenu);

  document.getElementById('explorerFilterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.explorerFilter = document.getElementById('explorerFilterText').value.trim();
    document.getElementById('explorerFilterDialog').close();
    applyExplorerFilter();
    setStatus(state.explorerFilter ? `Explorer filter: "${state.explorerFilter}"` : 'Explorer filter cleared');
  });

  document.getElementById('clearExplorerFilter')?.addEventListener('click', () => {
    state.explorerFilter = '';
    document.getElementById('explorerFilterText').value = '';
    document.getElementById('explorerFilterDialog').close();
    applyExplorerFilter();
    setStatus('Explorer filter cleared');
  });

  document.getElementById('cancelExplorerFilter')?.addEventListener('click', () => {
    document.getElementById('explorerFilterDialog').close();
  });
}

async function addDisplay(pageNo, screenName, folder) {
  const result = await fetchJson(`/api/projects/${state.activeProject}/screens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageNo, screenName, folder })
  });
  await loadExplorer(state.activeProject);
  await loadProjects();
  openDisplayPreview(result.screen.id, result.screen.title);
  setStatus(`Added display: ${result.screen.id}`);
}

async function deleteSelectedDisplay() {
  if (!state.activeProject || !state.selectedScreenId) {
    setStatus('Select a display to delete');
    return;
  }
  const id = state.selectedScreenId;
  if (!confirm(`Delete display "${id}" from this project?`)) return;

  await fetchJson(`/api/projects/${state.activeProject}/screens/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  state.openDisplays = state.openDisplays.filter((d) => d !== id);
  closeDisplayWorkspace();
  renderWorkbookTabs();
  await loadExplorer(state.activeProject);
  await loadProjects();
  setStatus(`Deleted display: ${id}`);
}

async function openProject(id) {
  await fetchJson(`/api/projects/${id}/open`, { method: 'POST' });
  await bootstrapOpenedProject(id);
  openProjectDialog.close();
  setStatus(`Opened application: ${id}`);
}

function renderOpenProjectList() {
  const list = document.getElementById('projectList');
  if (!state.projects.length) {
    list.innerHTML = '<li class="project-list-empty">No projects yet. Use File → New Application to create one.</li>';
    return;
  }
  list.innerHTML = state.projects.map((p) =>
    `<li>
      <button type="button" class="project-open-btn" data-id="${escapeHtml(p.id)}">
        <strong>${escapeHtml(p.name)}${state.projects.filter((x) => x.name === p.name).length > 1 ? ` [${escapeHtml(p.id)}]` : ''}</strong>
        <span>${p.screenCount} screens · ${escapeHtml(p.id)}${p.id === state.activeProject ? ' · active' : ''}</span>
      </button>
      <button type="button" class="project-delete-btn" data-delete-id="${escapeHtml(p.id)}" title="Delete project">Delete</button>
    </li>`
  ).join('');
  list.querySelectorAll('.project-open-btn').forEach((btn) => {
    btn.addEventListener('click', () => openProject(btn.dataset.id));
  });
  list.querySelectorAll('.project-delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await deleteProjectById(btn.dataset.deleteId);
        renderOpenProjectList();
        if (!state.projects.length) openProjectDialog.close();
      } catch (err) {
        setStatus(`Error: ${err.message}`);
        alert(`Could not delete project: ${err.message}`);
      }
    });
  });
}

function showOpenProjectDialog() {
  showStartupDialog('existing');
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

document.querySelectorAll('[data-action="new-project"]').forEach((el) => {
  el.addEventListener('click', () => { closeAllMenus(); showNewProjectDialog(); });
});

document.getElementById('fileMenuBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleFileMenu();
});

document.getElementById('editMenuBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleEditMenu();
});

document.getElementById('viewMenuBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleViewMenu();
});

document.getElementById('objectsMenuBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleObjectsMenu();
});

document.getElementById('applicationMenuBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleApplicationMenu();
});

document.getElementById('toolsMenuBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleToolsMenu();
});

document.getElementById('fileMenu')?.addEventListener('click', (e) => e.stopPropagation());
document.getElementById('editMenu')?.addEventListener('click', (e) => e.stopPropagation());
document.getElementById('viewMenu')?.addEventListener('click', (e) => e.stopPropagation());
document.getElementById('applicationMenu')?.addEventListener('click', (e) => e.stopPropagation());
document.getElementById('toolsMenu')?.addEventListener('click', (e) => e.stopPropagation());
document.getElementById('objectsMenu')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const btn = e.target.closest('[data-object-id]');
  if (!btn || btn.classList.contains('disabled')) return;
  handleObjectAction(btn.dataset.objectId);
});

document.getElementById('applicationMenu')?.querySelectorAll('[data-app-action]').forEach((el) => {
  el.addEventListener('click', () => handleApplicationAction(el.dataset.appAction));
});

document.getElementById('toolsMenu')?.querySelectorAll('[data-tools-action]').forEach((el) => {
  el.addEventListener('click', () => {
    if (el.classList.contains('disabled')) return;
    handleToolsAction(el.dataset.toolsAction);
  });
});

document.getElementById('fileMenu')?.querySelectorAll('[data-action]').forEach((el) => {
  el.addEventListener('click', () => handleMenuAction(el.dataset.action));
});

document.getElementById('editMenu')?.querySelectorAll('[data-edit-action]').forEach((el) => {
  el.addEventListener('click', () => handleEditAction(el.dataset.editAction));
});

document.getElementById('viewMenu')?.querySelectorAll('[data-view-action]').forEach((el) => {
  el.addEventListener('click', () => {
    if (el.classList.contains('disabled')) return;
    handleViewAction(el.dataset.viewAction, el.dataset.viewToggle || null);
  });
});

document.addEventListener('click', () => closeAllMenus());

document.querySelector('[data-action="open-project"]')?.addEventListener('click', () => {
  closeAllMenus();
  showOpenProjectDialog();
});
document.querySelector('[data-action="add-display"]')?.addEventListener('click', showAddDisplayDialog);
document.querySelector('[data-action="delete-display"]')?.addEventListener('click', deleteSelectedDisplay);

document.querySelectorAll('[data-tb]').forEach((el) => {
  el.addEventListener('click', () => {
    if (el.classList.contains('disabled')) return;
    handleToolbarAction(el.dataset.tb);
  });
});

document.querySelector('.toolbar [data-action="save"]')?.addEventListener('click', () => handleMenuAction('save'));

projectSelect.addEventListener('change', () => openProject(projectSelect.value));
document.getElementById('deleteProjectBtn')?.addEventListener('click', () => deleteActiveProject());

document.getElementById('newProjectForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('newProjectName').value.trim();
  if (!name || !validateNewProjectName()) return;
  const btn = e.target.querySelector('button[type="submit"]');
  try {
    if (btn) { btn.disabled = true; btn.textContent = 'Creating...'; }
    await createProject(name);
    newProjectDialog.close();
  } catch (err) {
    setStatus(`Error: ${err.message}`);
    const errEl = document.getElementById('newProjectNameError');
    if (errEl) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
  } finally {
    if (btn) {
      btn.disabled = !validateNewProjectName(false);
      btn.textContent = 'Create';
    }
  }
});

document.getElementById('newProjectName')?.addEventListener('input', () => validateNewProjectName());
document.getElementById('newProjectName')?.addEventListener('blur', () => validateNewProjectName());

document.getElementById('cancelNewProject').addEventListener('click', () => newProjectDialog.close());
document.getElementById('closeOpenProject').addEventListener('click', () => openProjectDialog.close());

document.getElementById('addDisplayForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pageNo = document.getElementById('addPageNo').value.trim();
  const screenName = document.getElementById('addScreenName').value.trim();
  const folder = document.getElementById('addFolder').value;
  if (!pageNo || !screenName) return;
  document.getElementById('addDisplayDialog').close();
  await addDisplay(pageNo, screenName, folder);
});

document.getElementById('cancelAddDisplay').addEventListener('click', () => {
  document.getElementById('addDisplayDialog').close();
});

document.getElementById('globalObjectDefaultsForm').addEventListener('input', () => {
  const dirty = JSON.stringify(readGlobalDefaultsForm()) !== state.globalDefaultsSnapshot;
  document.getElementById('applyGlobalDefaults').disabled = !dirty;
});

document.getElementById('globalObjectDefaultsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await saveGlobalObjectDefaults(true);
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
});

document.getElementById('applyGlobalDefaults').addEventListener('click', async () => {
  try {
    await saveGlobalObjectDefaults(false);
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
});

document.getElementById('cancelGlobalDefaults').addEventListener('click', () => {
  document.getElementById('globalObjectDefaultsDialog').close();
});

document.getElementById('helpGlobalDefaults').addEventListener('click', () => {
  alert('Global Object Defaults control how faceplate references inherit animation, connections, and size when placed on a display.');
});

document.getElementById('displaySettingsForm').addEventListener('submit', (e) => {
  saveDisplaySettings(e).catch((err) => setStatus(`Error: ${err.message}`));
});

document.querySelectorAll('#displaySettingsForm input[name="sizeMode"]').forEach((el) => {
  el.addEventListener('change', syncDisplaySettingsSizeFields);
});

document.querySelectorAll('#displaySettingsDialog .dialog-tab').forEach((tab) => {
  tab.addEventListener('click', () => switchDisplaySettingsTab(tab.dataset.dsTab));
});

document.getElementById('cancelDisplaySettings').addEventListener('click', () => {
  document.getElementById('displaySettingsDialog').close();
});

document.getElementById('keyAssignmentsForm').addEventListener('submit', (e) => {
  saveKeyAssignments(e).catch((err) => setStatus(`Error: ${err.message}`));
});

document.getElementById('cancelKeyAssignments').addEventListener('click', () => {
  document.getElementById('keyAssignmentsDialog').close();
});

document.getElementById('wallpaperColorForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const color = document.getElementById('wallpaperColorPicker').value;
  document.getElementById('wallpaperColorDialog').close();
  try {
    await setWallpaper('color', color);
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
});

document.getElementById('cancelWallpaperColor').addEventListener('click', () => {
  document.getElementById('wallpaperColorDialog').close();
});

document.getElementById('gridSettingsForm').addEventListener('submit', (e) => {
  e.preventDefault();
  state.viewPrefs.gridSize = Number(document.getElementById('gridSizeInput').value) || 10;
  state.viewPrefs.snapDistance = Number(document.getElementById('snapDistanceInput').value) || 5;
  saveViewPrefs();
  applyViewPrefs();
  document.getElementById('gridSettingsDialog').close();
  setStatus(`Grid: ${state.viewPrefs.gridSize}px, snap ${state.viewPrefs.snapDistance}px`);
});

document.getElementById('cancelGridSettings').addEventListener('click', () => {
  document.getElementById('gridSettingsDialog').close();
});

document.getElementById('projectSettingsForm').addEventListener('submit', (e) => {
  saveProjectSettings(e).catch((err) => setStatus(`Error: ${err.message}`));
});
document.getElementById('cancelProjectSettings').addEventListener('click', () => {
  document.getElementById('projectSettingsDialog').close();
});
document.getElementById('helpProjectSettings').addEventListener('click', () => {
  alert('Project Settings define window size, runtime target, communication, and inactivity behavior for the active Plant HMI application.');
});
document.getElementById('psWindowProfile').addEventListener('change', (e) => {
  applyWindowProfile(e.target.value);
  previewProjectWindowSize();
});
document.getElementById('psWidth')?.addEventListener('input', () => {
  if (document.getElementById('psWindowProfile').value === 'custom') previewProjectWindowSize();
});
document.getElementById('psHeight')?.addEventListener('input', () => {
  if (document.getElementById('psWindowProfile').value === 'custom') previewProjectWindowSize();
});
document.querySelectorAll('#projectSettingsDialog .dialog-tab').forEach((tab) => {
  tab.addEventListener('click', () => switchProjectSettingsTab(tab.dataset.tab));
});

document.getElementById('applicationLanguageForm').addEventListener('submit', (e) => {
  saveApplicationLanguage(e).catch((err) => setStatus(`Error: ${err.message}`));
});
document.getElementById('cancelAppLanguage').addEventListener('click', () => {
  document.getElementById('applicationLanguageDialog').close();
});

document.getElementById('launchRuntimeFromDialog').addEventListener('click', () => {
  document.getElementById('createRuntimeDialog').close();
  runRuntime();
});
document.getElementById('closeCreateRuntime').addEventListener('click', () => {
  document.getElementById('createRuntimeDialog').close();
});

document.getElementById('findForm').addEventListener('submit', (e) => {
  runFind(e).catch((err) => setStatus(`Error: ${err.message}`));
});
document.getElementById('cancelFind').addEventListener('click', () => document.getElementById('findDialog').close());

document.getElementById('replaceForm').addEventListener('submit', (e) => {
  runReplaceAll(e).catch((err) => setStatus(`Error: ${err.message}`));
});
document.getElementById('cancelReplace').addEventListener('click', () => document.getElementById('replaceDialog').close());

document.getElementById('crossRefForm').addEventListener('submit', (e) => {
  runCrossReference(e).catch((err) => setStatus(`Error: ${err.message}`));
});
document.getElementById('cancelCrossRef').addEventListener('click', () => document.getElementById('crossRefDialog').close());

document.getElementById('exportTagsBtn').addEventListener('click', () => {
  exportProjectTags().catch((err) => setStatus(`Error: ${err.message}`));
});
document.getElementById('importTagsBtn').addEventListener('click', () => {
  importProjectTags().catch((err) => setStatus(`Error: ${err.message}`));
});
document.getElementById('closeTagWizard').addEventListener('click', () => document.getElementById('tagWizardDialog').close());

document.getElementById('optionsForm').addEventListener('submit', saveOptions);
document.getElementById('cancelOptions').addEventListener('click', () => document.getElementById('optionsDialog').close());

document.getElementById('closeTransfer').addEventListener('click', () => document.getElementById('transferDialog').close());

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    showKeyAssignmentsDialog();
  }
  if (e.ctrlKey && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    showFindDialog();
  }
  if (e.ctrlKey && e.key.toLowerCase() === 'h') {
    e.preventDefault();
    showReplaceDialog();
  }
  if (e.ctrlKey && e.key.toLowerCase() === 'e') {
    e.preventDefault();
    showCrossRefDialog();
  }
});

async function init() {
  try {
    loadViewPrefs();
    initDraggableDialogs();
    initExplorerContextMenu();
    initExplorerResizer();
    initWorkspaceContextMenu();
    initStartupDialog();
    initImagePropertiesDialog();
    if (typeof renderObjectsMenu === 'function') {
      renderObjectsMenu(document.getElementById('objectsMenu'));
    }
    applyViewPrefs();
    await loadProjects();
    showStartupDialog('existing');
  } catch (err) {
    setStatus(`Startup error: ${err.message}`);
  }
}

init();

function initImagePropertiesDialog() {
  document.getElementById('closeImageProps')?.addEventListener('click', () => {
    document.getElementById('imagePropertiesDialog')?.close();
  });
  document.getElementById('helpImageProps')?.addEventListener('click', () => {
    alert('Image properties show the bitmap type, pixel size, and file format stored under Graphics → Images.');
  });
}

function initDraggableDialogs() {
  document.querySelectorAll('dialog.dialog').forEach((dialog) => {
    const handle = dialog.querySelector('h3');
    if (!handle || handle.dataset.dragHandle) return;
    handle.dataset.dragHandle = '1';
    handle.classList.add('dialog-drag-handle');

    handle.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();

      const rect = dialog.getBoundingClientRect();
      if (!dialog.classList.contains('is-positioned')) {
        dialog.classList.add('is-positioned');
        dialog.style.margin = '0';
        dialog.style.position = 'fixed';
        dialog.style.left = `${rect.left}px`;
        dialog.style.top = `${rect.top}px`;
      }

      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = parseFloat(dialog.style.left) || rect.left;
      const startTop = parseFloat(dialog.style.top) || rect.top;
      dialog.classList.add('is-dragging');

      const onMove = (ev) => {
        const nextLeft = startLeft + ev.clientX - startX;
        const nextTop = startTop + ev.clientY - startY;
        const bounds = clampDialogPosition(dialog, nextLeft, nextTop);
        dialog.style.left = `${bounds.left}px`;
        dialog.style.top = `${bounds.top}px`;
      };

      const onUp = () => {
        dialog.classList.remove('is-dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
}

function clampDialogPosition(dialog, left, top) {
  const width = dialog.offsetWidth || 360;
  const height = dialog.offsetHeight || 200;
  const maxLeft = Math.max(0, window.innerWidth - width);
  const maxTop = Math.max(0, window.innerHeight - Math.min(height, 48));
  return {
    left: Math.min(Math.max(0, left), maxLeft),
    top: Math.min(Math.max(0, top), maxTop)
  };
}
