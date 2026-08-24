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
  startupSelectedProjectId: null,
  placement: null,
  propsDialog: { kind: null, snapshot: '', editIndex: null, ref: null },
  canvasSelection: { indices: [] },
  clipboard: null,
  canvasHitClick: { index: null, time: 0 },
  canvasEditDrag: null,
  canvasEditOverlayRefresh: null,
  pendingGraphicSelection: null,
  pendingPreviewReload: null,
  pendingPreviewReloadRequest: false,
  previewFrameReady: false,
  propsFormFill: false,
  deferredStudioInitsDone: false,
  deferredStudioInitsStarted: false,
  canvasEditOverlayStale: true,
  undoStack: [],
  redoStack: [],
  undoSuspended: false
};

window.StudioState = state;

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
  gridSizeX: 10,
  gridSizeY: 10,
  gridColor: '#000000',
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
const previewCanvasWrap = document.getElementById('previewCanvasWrap');
const objectPlacementOverlay = document.getElementById('objectPlacementOverlay');
const placementRubberband = document.getElementById('placementRubberband');
const canvasEditOverlay = document.getElementById('canvasEditOverlay');
const freehandStrokePreview = document.getElementById('freehandStrokePreview');

const CANVAS_GRAPHIC_TYPES = new Set([
  'Text', 'Image', 'NumericDisplay', 'NumericInputEnable', 'NumericInputCursorPoint', 'StringDisplay', 'StringInputEnable', 'MomentaryButton', 'MaintainedButton', 'LatchedButton', 'MultistateButton', 'InterlockedButton', 'RampButton',
  'MultistateIndicator', 'SymbolIndicator', 'ListIndicator', 'BarGraph', 'RecipePlusButton', 'RecipePlusSelector',
  'GotoButton', 'ReturnToButton', 'CloseDisplayButton', 'DisplayListSelector', 'TimeDateDisplay', 'StringDisplay', 'AlarmTicker', 'Rectangle', 'Ellipse', 'Arc', 'Freehand', 'Panel',
  'SafetyLadderDiagram'
]);
const displayGrid = document.getElementById('displayGrid');
const explorerTree = document.getElementById('explorerTree');
const explorerProject = document.getElementById('explorerProject');
const projectSelect = document.getElementById('projectSelect');
const workspace = document.getElementById('workspace');
const previewFrame = document.getElementById('previewFrame');
const previewStage = document.getElementById('previewStage');
const panelView = document.getElementById('panelView');
const statusMsg = document.getElementById('statusMsg');

function setStatus(msg) {
  statusMsg.textContent = msg;
}

function exposeStudioGlobals() {
  window.state = state;
  window.setStatus = setStatus;
  window.displayIsOpen = displayIsOpen;
  window.fetchOpenCanvas = fetchOpenCanvas;
  window.resetPropsDialogState = resetPropsDialogState;
  window.updatePropsApplyButton = updatePropsApplyButton;
  window.flushPropsApplyButton = flushPropsApplyButton;
  window.upsertCanvasComponent = upsertCanvasComponent;
  window.commitPropsSnapshot = commitPropsSnapshot;
  window.revertPropsDialogPreview = revertPropsDialogPreview;
  window.scheduleRefreshCanvasEditOverlay = scheduleRefreshCanvasEditOverlay;
  window.refreshCanvasEditOverlay = refreshCanvasEditOverlay;
  window.clearPropsDialogState = clearPropsDialogState;
  window.previewPatchByName = previewPatchByName;
  window.updateFreehandStudioPreview = updateFreehandStudioPreview;
  window.hideFreehandStudioPreview = hideFreehandStrokePreview;
  window.showCanvasPropsDialog = showCanvasPropsDialog;
  window.resolveEditComponentIndex = resolveEditComponentIndex;
  window.refreshCanvasEditOverlaySelection = refreshCanvasEditOverlaySelection;
  window.activateSelectTool = activateSelectTool;
  window.setTemplateEditStatus = setTemplateEditStatus;
  window.isEditingGlobalObject = isEditingGlobalObject;
  window.showImageBrowserDialog = showImageBrowserDialog;
  window.showDisplayPickerDialog = showDisplayPickerDialog;
  window.fetchJson = fetchJson;
  window.refreshProjectConfig = refreshProjectConfig;
}

function closeAllMenus() {
  MENU_IDS.forEach((id) => document.getElementById(id)?.classList.add('hidden'));
  document.querySelectorAll('#objectsMenu .has-submenu.submenu-open').forEach((el) => {
    el.classList.remove('submenu-open');
  });
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

function isEditingGlobalObject() {
  return state.previewKind === 'global-object';
}

function studioPreviewUrl(params) {
  const q = new URLSearchParams({ embed: '1', studioEdit: '1', ...params });
  return `/runtime.html?${q.toString()}`;
}

async function openPropertiesByGraphicName(name, componentType = '', source = '') {
  if (!name || !displayIsOpen()) return;
  flushDeferredDialogInits();
  ensureDeferredStudioInits();

  let editIndex = state.canvasEditCache?.editComponents?.findIndex(
    (entry) => entry.comp?.name === name
  );
  if (editIndex == null || editIndex < 0) {
    scheduleRefreshCanvasEditOverlay();
    editIndex = state.canvasEditCache?.editComponents?.findIndex(
      (entry) => entry.comp?.name === name
    );
  }
  if (editIndex >= 0) {
    setCanvasSelection(editIndex);
    await openPropertiesForComponent(editIndex);
    return;
  }

  try {
    const composed = isEditingGlobalObject()
      ? await fetchOpenCanvas()
      : await fetchComposedCanvas();
    let comp = composed.components?.find((c) => c.name === name);
    if (!comp) {
      setStatus(`No editable object named ${name}`);
      return;
    }
    const raw = state.canvasEditCache?.raw || await fetchOpenCanvas();
    let ref = resolveComponentEditRef(comp, raw, source);
    ({ comp, ref } = await mergeTemplateOverrideComponent(comp, ref));

    if (comp.type === 'GotoButton') {
      fillGotoButtonForm(comp);
      resetPropsDialogState('goto', readGotoButtonForm, 'applyGotoButton', null, ref);
      switchGotoButtonTab('general');
      wireGotoButtonDialogTools();
      document.getElementById('gotoButtonDialog')?.showModal();
      setTemplateEditStatus(name, ref);
    } else if (comp.type === 'ReturnToButton') {
      window.StudioReturnToButton?.fillReturnToButtonForm(comp);
      resetPropsDialogState('return-to', window.StudioReturnToButton.readReturnToButtonForm, 'applyReturnToButton', null, ref);
      window.StudioReturnToButton?.switchReturnToButtonTab('general');
      window.StudioReturnToButton?.wireReturnToButtonTools();
      document.getElementById('returnToButtonDialog')?.showModal();
    } else if (comp.type === 'CloseDisplayButton') {
      window.StudioCloseDisplayButton?.fillCloseDisplayButtonForm(comp);
      resetPropsDialogState('close-display', window.StudioCloseDisplayButton.readCloseDisplayButtonForm, 'applyCloseDisplayButton', null, ref);
      window.StudioCloseDisplayButton?.switchCloseDisplayButtonTab('general');
      window.StudioCloseDisplayButton?.wireCloseDisplayButtonTools();
      document.getElementById('closeDisplayButtonDialog')?.showModal();
      if (ref.type === 'template-override') {
        setStatus(`Editing ${name} — screen override (change Global Objects/Template to affect all displays)`);
      } else if (ref.type === 'shell') {
        setStatus(`Editing ${name} — ${navShellStatusLabel(state.canvasEditCache?.raw)} override for this display`);
      } else {
        setStatus(`Editing ${name}`);
      }
    } else if (comp.type === 'DisplayListSelector') {
      window.StudioDisplayListSelector?.fillDisplayListSelectorForm(comp);
      resetPropsDialogState('display-list', window.StudioDisplayListSelector.readDisplayListSelectorForm, 'applyDisplayListSelector', null, ref);
      window.StudioDisplayListSelector?.switchDisplayListSelectorTab('general');
      window.StudioDisplayListSelector?.wireDisplayListSelectorTools();
      document.getElementById('displayListSelectorDialog')?.showModal();
    } else if (comp.type === 'MultistateIndicator') {
      window.StudioMultistateIndicator?.fillMultistateIndicatorForm(comp);
      resetPropsDialogState('multistate-indicator', window.StudioMultistateIndicator.readMultistateIndicatorForm, 'applyMultistateIndicator', null, ref);
      window.StudioMultistateIndicator?.switchMultistateIndicatorTab('general');
      window.StudioMultistateIndicator?.wireMultistateIndicatorTools();
      document.getElementById('multistateIndicatorDialog')?.showModal();
      if (ref.type === 'template-global') {
        setStatus(`Editing Template → ${comp.name} (applies to all displays)`);
      }
    } else if (comp.type === 'TimeDateDisplay') {
      window.StudioTimeDateDisplay?.fillTimeDateDisplayForm(comp);
      resetPropsDialogState('time-date', window.StudioTimeDateDisplay.readTimeDateDisplayForm, 'applyTimeDateDisplay', null, ref);
      window.StudioTimeDateDisplay?.switchTimeDateDisplayTab('general');
      window.StudioTimeDateDisplay?.wireTimeDateDisplayTools();
      document.getElementById('timeDateDisplayDialog')?.showModal();
      if (ref.type === 'template-global') {
        setStatus(`Editing Template → ${comp.name} (applies to all displays)`);
      }
    } else if (comp.type === 'SymbolIndicator') {
      window.StudioSymbolIndicator?.fillSymbolIndicatorForm(comp);
      resetPropsDialogState('symbol-indicator', window.StudioSymbolIndicator.readSymbolIndicatorForm, 'applySymbolIndicator', null, ref);
      window.StudioSymbolIndicator?.switchSymbolIndicatorTab('general');
      window.StudioSymbolIndicator?.wireSymbolIndicatorTools();
      document.getElementById('symbolIndicatorDialog')?.showModal();
    } else if (comp.type === 'ListIndicator') {
      window.StudioListIndicator?.fillListIndicatorForm(comp);
      resetPropsDialogState('list-indicator', window.StudioListIndicator.readListIndicatorForm, 'applyListIndicator', null, ref);
      window.StudioListIndicator?.switchListIndicatorTab('general');
      window.StudioListIndicator?.wireListIndicatorTools();
      document.getElementById('listIndicatorDialog')?.showModal();
    } else if (comp.type === 'BarGraph') {
      window.StudioBarGraph?.fillBarGraphForm(comp);
      resetPropsDialogState('bar-graph', window.StudioBarGraph.readBarGraphForm, 'applyBarGraph', null, ref);
      window.StudioBarGraph?.switchBarGraphTab('general');
      window.StudioBarGraph?.wireBarGraphTools();
      document.getElementById('barGraphDialog')?.showModal();
    } else if (comp.type === 'RecipePlusButton') {
      window.StudioRecipePlusButton?.fillRecipePlusButtonForm(comp);
      resetPropsDialogState('recipeplus-button', window.StudioRecipePlusButton.readRecipePlusButtonForm, 'applyRecipePlusButton', null, ref);
      window.StudioRecipePlusButton?.switchRecipePlusButtonTab('general');
      window.StudioRecipePlusButton?.wireRecipePlusButtonTools();
      document.getElementById('recipePlusButtonDialog')?.showModal();
    } else if (comp.type === 'RecipePlusSelector') {
      window.StudioRecipePlusSelector?.fillRecipePlusSelectorForm(comp);
      resetPropsDialogState('recipeplus-selector', window.StudioRecipePlusSelector.readRecipePlusSelectorForm, 'applyRecipePlusSelector', null, ref);
      window.StudioRecipePlusSelector?.switchRecipePlusSelectorTab('general');
      window.StudioRecipePlusSelector?.wireRecipePlusSelectorTools();
      document.getElementById('recipePlusSelectorDialog')?.showModal();
    } else if (comp.type === 'Text') {
      fillTextPropertiesForm(comp);
      resetPropsDialogState('text', readTextPropertiesForm, 'applyTextProperties', null, ref);
      switchTextPropertiesTab('general');
      document.getElementById('textPropertiesDialog')?.showModal();
      if (ref.type === 'template-override') {
        setStatus(`Editing ${name} — screen override (change Global Objects/Template to affect all displays)`);
      } else if (ref.type === 'shell') {
        setStatus(`Editing ${name} — ${navShellStatusLabel(state.canvasEditCache?.raw)} override for this display`);
      } else {
        setStatus(`Editing ${name}`);
      }
    } else if (comp.type === 'NumericDisplay') {
      window.StudioNumericDisplay?.fillNumericDisplayForm(comp);
      resetPropsDialogState('numeric', window.StudioNumericDisplay.readNumericDisplayForm, 'applyNumericDisplay', null, ref);
      window.StudioNumericDisplay?.switchNumericDisplayTab('general');
      window.StudioNumericDisplay?.wireNumericDisplayTools();
      document.getElementById('numericDisplayDialog')?.showModal();
    } else if (comp.type === 'StringDisplay') {
      window.StudioStringDisplay?.fillStringDisplayForm(comp);
      resetPropsDialogState('string-display', window.StudioStringDisplay.readStringDisplayForm, 'applyStringDisplay', null, ref);
      window.StudioStringDisplay?.switchStringDisplayTab('general');
      window.StudioStringDisplay?.wireStringDisplayTools();
      document.getElementById('stringDisplayDialog')?.showModal();
    } else if (comp.type === 'StringInputEnable') {
      window.StudioStringInput?.fillStringInputForm(comp);
      resetPropsDialogState('string-input', window.StudioStringInput.readStringInputForm, 'applyStringInput', null, ref);
      window.StudioStringInput?.switchStringInputTab('general');
      window.StudioStringInput?.wireStringInputTools();
      document.getElementById('stringInputDialog')?.showModal();
    } else if (comp.type === 'NumericInputEnable') {
      window.StudioNumericInput?.fillNumericInputForm(comp);
      resetPropsDialogState('numeric-input', window.StudioNumericInput.readNumericInputForm, 'applyNumericInput', null, ref);
      window.StudioNumericInput?.switchNumericInputTab('general');
      window.StudioNumericInput?.wireNumericInputTools();
      document.getElementById('numericInputDialog')?.showModal();
    } else if (comp.type === 'NumericInputCursorPoint') {
      window.StudioNumericInput?.fillNumericInputCursorForm(comp);
      resetPropsDialogState('numeric-input-cursor', window.StudioNumericInput.readNumericInputCursorForm, 'applyNumericInputCursor', null, ref);
      window.StudioNumericInput?.switchNumericInputCursorTab('general');
      window.StudioNumericInput?.wireNumericInputCursorTools();
      document.getElementById('numericInputCursorDialog')?.showModal();
    } else if (comp.type === 'MomentaryButton') {
      fillMomentaryButtonForm(comp);
      resetPropsDialogState('momentary', readMomentaryButtonForm, 'applyMomentaryButton', null, ref);
      switchMomentaryButtonTab('general');
      document.getElementById('momentaryButtonDialog')?.showModal();
    } else if (comp.type === 'MaintainedButton') {
      fillMaintainedButtonForm(comp);
      resetPropsDialogState('maintained', readMaintainedButtonForm, 'applyMaintainedButton', null, ref);
      switchMaintainedButtonTab('general');
      wireMaintainedButtonDialogTools();
      document.getElementById('maintainedButtonDialog')?.showModal();
    } else if (comp.type === 'LatchedButton') {
      window.StudioLatchedMultistate?.fillLatchedButtonForm(comp);
      resetPropsDialogState('latched', window.StudioLatchedMultistate.readLatchedButtonForm, 'applyLatchedButton', null, ref);
      window.StudioLatchedMultistate?.switchLatchedButtonTab('general');
      window.StudioLatchedMultistate?.wireLatchedButtonDialogTools();
      document.getElementById('latchedButtonDialog')?.showModal();
    } else if (comp.type === 'MultistateButton') {
      window.StudioLatchedMultistate?.fillMultistateButtonForm(comp);
      resetPropsDialogState('multistate', window.StudioLatchedMultistate.readMultistateButtonForm, 'applyMultistateButton', null, ref);
      window.StudioLatchedMultistate?.switchMultistateButtonTab('general');
      window.StudioLatchedMultistate?.wireMultistateButtonDialogTools();
      document.getElementById('multistateButtonDialog')?.showModal();
    } else if (comp.type === 'InterlockedButton') {
      window.StudioLatchedMultistate?.fillInterlockedButtonForm(comp);
      resetPropsDialogState('interlocked', window.StudioLatchedMultistate.readInterlockedButtonForm, 'applyInterlockedButton', null, ref);
      window.StudioLatchedMultistate?.switchInterlockedButtonTab('general');
      window.StudioLatchedMultistate?.wireInterlockedButtonDialogTools();
      document.getElementById('interlockedButtonDialog')?.showModal();
    } else if (comp.type === 'RampButton') {
      window.StudioLatchedMultistate?.fillRampButtonForm(comp);
      resetPropsDialogState('ramp', window.StudioLatchedMultistate.readRampButtonForm, 'applyRampButton', null, ref);
      window.StudioLatchedMultistate?.switchRampButtonTab('general');
      window.StudioLatchedMultistate?.wireRampButtonDialogTools();
      document.getElementById('rampButtonDialog')?.showModal();
    } else if (comp.type === 'Image') {
      fillCanvasImagePropertiesForm(comp);
      resetPropsDialogState('image', readCanvasImagePropertiesForm, 'applyCanvasImageProperties', null, ref);
      switchCanvasImagePropertiesTab('general');
      document.getElementById('canvasImagePropertiesDialog')?.showModal();
      setTemplateEditStatus(name, ref);
    } else if (comp.type === 'Rectangle') {
      window.StudioShapeProperties?.openShapePropertiesDialog(comp, ref, null);
      setTemplateEditStatus(name, ref);
    } else if (comp.type === 'Ellipse') {
      window.StudioEllipseProperties?.openEllipsePropertiesDialog(comp, ref, null);
      setTemplateEditStatus(name, ref);
    } else if (comp.type === 'Arc') {
      window.StudioArcProperties?.openArcPropertiesDialog(comp, ref, null);
      setTemplateEditStatus(name, ref);
    } else if (comp.type === 'Freehand') {
      window.StudioFreehandProperties?.openFreehandPropertiesDialog(comp, ref, null);
      setTemplateEditStatus(name, ref);
    } else if (comp.type === 'Panel') {
      window.StudioPanelProperties?.openPanelPropertiesDialog(comp, ref, null);
      setTemplateEditStatus(name, ref);
    } else {
      setStatus(`${comp.type} properties not available yet`);
    }
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
}

function shouldIgnoreCanvasBackgroundClick() {
  return Boolean(
    state.placement ||
    !objectPlacementOverlay?.classList.contains('hidden') ||
    state.canvasEditDrag
  );
}

function initStudioEmbedBridge() {
  window.addEventListener('message', (e) => {
    if (e.origin !== window.location.origin) return;
    if (e.data?.type === 'planthmi-embed-canvas-background-click') {
      if (shouldIgnoreCanvasBackgroundClick()) return;
      clearCanvasSelection();
      return;
    }
    if (e.data?.type === 'planthmi-embed-graphic-click') {
      const name = e.data.name;
      if (!name) return;
      const editIndex = state.canvasEditCache?.editComponents?.findIndex(
        (entry) => entry.comp?.name === name
      );
      if (editIndex >= 0) {
        setCanvasSelection(editIndex);
        return;
      }
      state.pendingGraphicSelection = name;
      scheduleRefreshCanvasEditOverlay();
      return;
    }
    if (e.data?.type === 'planthmi-embed-graphic-dblclick') {
      openPropertiesByGraphicName(e.data.name, e.data.componentType, e.data.source)
        .catch((err) => setStatus(`Error: ${err.message}`));
    }
  });
}

async function fetchOpenCanvas(options = {}) {
  const { force = false } = options;
  const project = state.activeProject;
  const id = state.selectedScreenId;
  const key = `${project || ''}:${id || ''}:${state.previewKind || 'display'}:raw`;
  if (!force && openCanvasCache.key === key && openCanvasCache.data) {
    return openCanvasCache.data;
  }
  let data;
  if (isEditingGlobalObject()) {
    data = await fetchJson(`/api/runtime/global-objects/${encodeURIComponent(id)}?project=${encodeURIComponent(project)}`);
  } else {
    data = await fetchJson(`/api/runtime/screens/${encodeURIComponent(id)}?project=${encodeURIComponent(project)}&raw=1`);
    data = normalizeNavShellFields(data);
  }
  openCanvasCache = { key, data };
  return data;
}

function invalidateOpenCanvasCache() {
  openCanvasCache = { key: '', data: null };
}

async function fetchComposedCanvas() {
  const project = state.activeProject;
  const id = state.selectedScreenId;
  if (isEditingGlobalObject()) {
    return fetchOpenCanvas();
  }
  return fetchJson(`/api/runtime/screens/${encodeURIComponent(id)}?project=${encodeURIComponent(project)}`);
}

const COMPOSED_CACHE_MS = 8000;
let composedCanvasCache = { key: '', data: null, ts: 0 };
let openCanvasCache = { key: '', data: null };

function invalidateComposedCanvasCache() {
  composedCanvasCache = { key: '', data: null, ts: 0 };
}

function invalidateCanvasCaches() {
  invalidateOpenCanvasCache();
  invalidateComposedCanvasCache();
}

async function fetchComposedCanvasCached() {
  const key = `${state.activeProject || ''}:${state.selectedScreenId || ''}:${state.previewKind || 'display'}`;
  const now = Date.now();
  if (composedCanvasCache.key === key && composedCanvasCache.data && now - composedCanvasCache.ts < COMPOSED_CACHE_MS) {
    return composedCanvasCache.data;
  }
  const data = await fetchComposedCanvas();
  composedCanvasCache = { key, data, ts: now };
  return data;
}

function stripComponentMeta(comp) {
  if (!comp || typeof comp !== 'object') return comp;
  const {
    _source, _templateIndex, _displayIndex, _replacesTemplate, _composed, ...clean
  } = comp;
  return clean;
}

const UNDO_MAX = 40;

function cloneUndoData(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function getUndoContext() {
  return {
    project: state.activeProject,
    screenId: state.selectedScreenId,
    previewKind: state.previewKind || 'display'
  };
}

function clearUndoHistory() {
  state.undoStack = [];
  state.redoStack = [];
  updateUndoRedoUI();
}

async function captureScreenUndoPatch(keys) {
  const canvas = state.canvasEditCache?.raw || await fetchOpenCanvas();
  const patch = {};
  for (const key of keys) {
    if (key === 'components') patch.components = cloneUndoData(canvas.components || []);
    if (key === 'template') patch.template = cloneUndoData(canvas.template);
    if (key === 'overviewShell') patch.overviewShell = cloneUndoData(canvas.overviewShell);
    if (key === 'manualShell') patch.manualShell = cloneUndoData(canvas.manualShell);
    if (key === 'alarmsShell') patch.alarmsShell = cloneUndoData(canvas.alarmsShell);
    if (key === 'settingsShell') patch.settingsShell = cloneUndoData(canvas.settingsShell);
    if (key === 'navShell') Object.assign(patch, captureNavShellUndo(canvas));
  }
  return patch;
}

async function captureGlobalObjectUndo(objectId) {
  const tpl = await fetchJson(
    `/api/runtime/global-objects/${encodeURIComponent(objectId)}?project=${encodeURIComponent(state.activeProject)}`
  );
  return {
    objectId,
    components: cloneUndoData(tpl.components || [])
  };
}

async function buildUndoEntry(options = {}) {
  const ctx = getUndoContext();
  const entry = { context: ctx, patch: {}, globalPatch: null };
  const screenKeys = options.screenKeys ?? ['components', 'template', 'overviewShell'];
  if (screenKeys.length) {
    entry.patch = await captureScreenUndoPatch(screenKeys);
  }
  if (options.globalObjectId) {
    entry.globalPatch = await captureGlobalObjectUndo(options.globalObjectId);
  }
  return entry;
}

function pushUndoEntry(entry) {
  if (state.undoSuspended || !entry?.context?.project || !entry.context.screenId) return;
  state.undoStack.push(entry);
  while (state.undoStack.length > UNDO_MAX) state.undoStack.shift();
  state.redoStack = [];
  updateUndoRedoUI();
}

async function pushUndoBefore(options = {}) {
  const entry = await buildUndoEntry(options);
  pushUndoEntry(entry);
}

function captureDragUndoEntry(entry) {
  const canvas = state.canvasEditCache?.raw;
  if (!canvas || !state.activeProject || !state.selectedScreenId || !entry) return null;
  const undoEntry = {
    context: getUndoContext(),
    patch: {},
    globalPatch: null
  };
  if (entry.ref?.type === 'shell') {
    Object.assign(undoEntry.patch, captureNavShellUndo(canvas));
  } else if (entry.ref?.type === 'template-override') {
    undoEntry.patch.template = cloneUndoData(canvas.template);
  } else {
    undoEntry.patch.components = cloneUndoData(canvas.components);
  }
  return undoEntry;
}

async function pushUndoForEditRef(ref) {
  if (ref?.type === 'template-global') {
    const canvas = state.canvasEditCache?.raw || await fetchOpenCanvas();
    const globalObjectId = defaultTemplateConfig(canvas).globalObjectId || 'Template';
    await pushUndoBefore({ screenKeys: [], globalObjectId });
  } else if (ref?.type === 'template-override') {
    await pushUndoBefore({ screenKeys: ['template'] });
  } else if (ref?.type === 'shell') {
    await pushUndoBefore({ screenKeys: ['navShell'] });
  } else {
    await pushUndoBefore({ screenKeys: ['components'] });
  }
}

function isEditableKeyboardTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function updateUndoRedoUI() {
  const canEdit = displayIsOpen();
  const canUndo = canEdit && state.undoStack.length > 0;
  const canRedo = canEdit && state.redoStack.length > 0;
  document.querySelectorAll('[data-edit-action="undo"], [data-tb="undo"]').forEach((el) => {
    el.classList.toggle('disabled', !canUndo);
  });
  document.querySelectorAll('[data-edit-action="redo"], [data-tb="redo"]').forEach((el) => {
    el.classList.toggle('disabled', !canRedo);
  });
}

async function ensureUndoContext(ctx) {
  if (!ctx?.project || !ctx.screenId) return false;
  if (state.activeProject !== ctx.project) {
    await openProject(ctx.project);
  }
  if (state.selectedScreenId !== ctx.screenId) {
    if (ctx.previewKind === 'global-object') {
      openGlobalObjectPreview(ctx.screenId, ctx.screenId);
    } else {
      openDisplayPreview(ctx.screenId, ctx.screenId);
    }
    scheduleRefreshCanvasEditOverlay();
  }
  return true;
}

async function applyUndoEntry(entry) {
  state.undoSuspended = true;
  try {
    await ensureUndoContext(entry.context);
    const screenPatch = {};
    if (entry.patch?.components !== undefined) screenPatch.components = entry.patch.components;
    if (entry.patch?.template !== undefined) screenPatch.template = entry.patch.template;
    if (entry.patch?.overviewShell !== undefined) screenPatch.overviewShell = entry.patch.overviewShell;
    if (entry.patch?.manualShell !== undefined) screenPatch.manualShell = entry.patch.manualShell;
    if (entry.patch?.alarmsShell !== undefined) screenPatch.alarmsShell = entry.patch.alarmsShell;
    if (entry.patch?.settingsShell !== undefined) screenPatch.settingsShell = entry.patch.settingsShell;
    if (Object.keys(screenPatch).length) {
      await patchOpenCanvas(screenPatch);
      const canvas = await fetchOpenCanvas();
      state.canvasEditCache.raw = { ...canvas, ...screenPatch };
    }
    if (entry.globalPatch) {
      await fetchJson(
        `/api/projects/${encodeURIComponent(entry.context.project)}/global-objects/${encodeURIComponent(entry.globalPatch.objectId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ components: entry.globalPatch.components })
        }
      );
    }
    await updateCanvasPreview({ forceReload: true });
    refreshObjectExplorer();
    refreshPropertyPanel();
    scheduleRefreshCanvasEditOverlay();
    clearCanvasSelection();
  } finally {
    state.undoSuspended = false;
  }
}

async function undoEdit() {
  if (!displayIsOpen()) {
    setStatus('Open a display to undo edits');
    return;
  }
  if (!state.undoStack.length) {
    setStatus('Nothing to undo');
    return;
  }
  const entry = state.undoStack.pop();
  const restoreKeys = Object.keys(entry.patch || {}).filter((k) => entry.patch[k] !== undefined);
  const current = await buildUndoEntry({
    screenKeys: restoreKeys,
    globalObjectId: entry.globalPatch?.objectId
  });
  state.redoStack.push(current);
  await applyUndoEntry(entry);
  updateUndoRedoUI();
  setStatus('Undo');
}

async function redoEdit() {
  if (!displayIsOpen()) {
    setStatus('Open a display to redo edits');
    return;
  }
  if (!state.redoStack.length) {
    setStatus('Nothing to redo');
    return;
  }
  const entry = state.redoStack.pop();
  const restoreKeys = Object.keys(entry.patch || {}).filter((k) => entry.patch[k] !== undefined);
  const current = await buildUndoEntry({
    screenKeys: restoreKeys,
    globalObjectId: entry.globalPatch?.objectId
  });
  state.undoStack.push(current);
  await applyUndoEntry(entry);
  updateUndoRedoUI();
  setStatus('Redo');
}

function defaultTemplateConfig(canvas) {
  return {
    enabled: true,
    globalObjectId: 'Template',
    ...(canvas.template || {})
  };
}

function stripNavShellPersistFields(patch) {
  if (!patch || typeof patch !== 'object') return patch;
  const next = { ...patch };
  delete next.borderColor;
  delete next.useBorderColor;
  delete next.borderUsesBackColor;
  delete next.navSideAccent;
  delete next.label;
  delete next.caption;
  delete next.target;
  return next;
}

function getSelectedCanvasIndices() {
  return Array.isArray(state.canvasSelection.indices) ? state.canvasSelection.indices : [];
}

function getPrimaryCanvasSelectionIndex() {
  const indices = getSelectedCanvasIndices();
  return indices.length ? indices[indices.length - 1] : null;
}

function canvasSelectionIncludes(index) {
  return getSelectedCanvasIndices().includes(index);
}

function isGeometryPatch(patch) {
  const keys = Object.keys(patch || {});
  return keys.length > 0 && keys.every((key) => ['left', 'top', 'width', 'height'].includes(key));
}

function setOverrideIfDiff(patch, key, value, base) {
  if (value === undefined) return;
  if (value !== base?.[key]) patch[key] = value;
}

function buildGotoOverrideStore(comp, base = {}) {
  const patch = {};
  const baseComp = base || {};

  [
    'left', 'top', 'width', 'height', 'visible', 'target', 'label', 'caption', 'image', 'imageScaled',
    'fontFamily', 'fontSize', 'bold', 'italic', 'underline', 'foreColor', 'useForeColor', 'wordWrap',
    'alignment', 'captionBackStyle', 'useCaptionBackColor', 'captionBackColor', 'captionBlink', 'audio',
    'borderStyle', 'backStyle', 'shape', 'borderWidth', 'lineWidth', 'lineStyle', 'patternStyle',
    'endColor', 'gradientStop', 'gradientShadingStyle', 'gradientDirection',
    'useVariableDisplay', 'parameterType', 'parameterFile', 'parameterList',
    'displayPosition', 'displayTop', 'displayLeft', 'useVariableDisplayPosition',
    'horizontalMargin', 'verticalMargin', 'numberOfStates', 'triggerType', 'tag', 'states'
  ].forEach((key) => setOverrideIfDiff(patch, key, comp[key], baseComp));

  if (Boolean(comp.borderUsesBackColor) !== Boolean(baseComp.borderUsesBackColor !== false)) {
    patch.borderUsesBackColor = comp.borderUsesBackColor;
  }

  if (comp.useBackColor) {
    patch.useBackColor = true;
    setOverrideIfDiff(patch, 'backColor', comp.backColor, baseComp);
  } else if (baseComp.useBackColor) {
    patch.useBackColor = false;
  }

  if (!comp.borderUsesBackColor) {
    if (comp.useBorderColor) {
      patch.useBorderColor = true;
      setOverrideIfDiff(patch, 'borderColor', comp.borderColor, baseComp);
    } else if (baseComp.useBorderColor) {
      patch.useBorderColor = false;
    }
  }

  if (comp.usePatternColor) {
    patch.usePatternColor = true;
    setOverrideIfDiff(patch, 'patternColor', comp.patternColor, baseComp);
  } else if (baseComp.usePatternColor) {
    patch.usePatternColor = false;
  }

  if (comp.useHighlightColor) {
    patch.useHighlightColor = true;
    setOverrideIfDiff(patch, 'highlightColor', comp.highlightColor, baseComp);
  } else if (baseComp.useHighlightColor) {
    patch.useHighlightColor = false;
  }

  if (Boolean(comp.blink) !== Boolean(baseComp.blink)) {
    patch.blink = comp.blink;
  }

  return patch;
}

async function fetchTemplateComponent(name) {
  const project = state.activeProject;
  const canvas = await fetchOpenCanvas();
  const globalObjectId = defaultTemplateConfig(canvas).globalObjectId || 'Template';
  try {
    const template = await fetchJson(
      `/api/runtime/global-objects/${encodeURIComponent(globalObjectId)}?project=${encodeURIComponent(project)}`
    );
    return template.components?.find((c) => c.name === name) || null;
  } catch {
    return null;
  }
}

async function mergeTemplateOverrideComponent(comp, ref) {
  if (ref?.type !== 'template-override' || !comp?.name) return { comp, ref };
  const base = await fetchTemplateComponent(comp.name);
  if (!base) return { comp, ref };
  const canvas = state.canvasEditCache?.raw || await fetchOpenCanvas();
  const replace = canvas?.template?.replace?.[comp.name] || {};
  return {
    comp: { ...base, ...replace, ...comp, name: comp.name },
    ref: { type: 'template-override', name: comp.name }
  };
}

async function resolveTemplatePropertiesEntry(entry) {
  if (!entry?.comp?.name || entry.ref?.type !== 'template-override') return entry;
  const merged = await mergeTemplateOverrideComponent(entry.comp, entry.ref);
  return { comp: merged.comp, ref: merged.ref };
}

function setTemplateEditStatus(compName, ref) {
  if (ref?.type === 'template-override') {
    setStatus(`Editing ${compName} — screen override (edit Global Objects/Template to change all displays)`);
  } else if (ref?.type === 'shell') {
    setStatus(`Editing ${compName} — ${navShellStatusLabel(state.canvasEditCache?.raw)} override for this display`);
  } else if (isEditingGlobalObject()) {
    setStatus(`Editing Template → ${compName} (applies to all displays)`);
  }
}

function getNavShellKey(rawScreen) {
  if (rawScreen?.navGroup === 'manual') return 'manualShell';
  if (rawScreen?.navGroup === 'overview') return 'overviewShell';
  if (rawScreen?.navGroup === 'alarms') return 'alarmsShell';
  if (rawScreen?.navGroup === 'settings') return 'settingsShell';
  return null;
}

function normalizeNavShellFields(rawScreen) {
  if (!rawScreen?.overviewShell) return rawScreen;
  const targetKey = getNavShellKey(rawScreen);
  if (!targetKey || targetKey === 'overviewShell') return rawScreen;
  const misplaced = rawScreen.overviewShell;
  if (!misplaced || !Object.keys(misplaced).length) {
    const next = { ...rawScreen };
    delete next.overviewShell;
    return next;
  }
  const next = { ...rawScreen, [targetKey]: { ...(rawScreen[targetKey] || {}), ...misplaced } };
  delete next.overviewShell;
  return next;
}

function getNavShellBase(rawScreen, name) {
  if (typeof TemplateCompose === 'undefined' || !rawScreen?.navGroup) return null;
  if (rawScreen.navGroup === 'manual') {
    const shell = TemplateCompose.buildManualShell({ ...rawScreen, manualShell: {} });
    return shell.find((c) => c.name === name) || null;
  }
  if (rawScreen.navGroup === 'overview') {
    const shell = TemplateCompose.buildOverviewShell({ ...rawScreen, overviewShell: {} });
    return shell.find((c) => c.name === name) || null;
  }
  if (rawScreen.navGroup === 'alarms') {
    const shell = TemplateCompose.buildAlarmsShell({ ...rawScreen, alarmsShell: {} });
    return shell.find((c) => c.name === name) || null;
  }
  if (rawScreen.navGroup === 'settings') {
    const shell = TemplateCompose.buildSettingsShell({ ...rawScreen, settingsShell: {} });
    return shell.find((c) => c.name === name) || null;
  }
  return null;
}

function captureNavShellUndo(canvas) {
  const key = getNavShellKey(canvas);
  if (!key) return {};
  return { [key]: cloneUndoData(canvas[key]) };
}

function navShellStatusLabel(rawScreen) {
  const key = getNavShellKey(rawScreen);
  if (key === 'manualShell') return 'manual nav';
  if (key === 'alarmsShell') return 'alarms nav';
  if (key === 'settingsShell') return 'settings nav';
  return 'overview nav';
}

function resolveComponentEditRef(comp, raw, source = '') {
  if (!comp?.name) {
    return { type: 'display', index: comp?._displayIndex ?? null };
  }
  if (source === 'shell' || comp._source === 'shell') {
    return { type: 'shell', name: comp.name };
  }
  if (isEditingGlobalObject()) {
    const index = raw?.components?.findIndex((c) => c.name === comp.name);
    return { type: 'display', index: index >= 0 ? index : comp._displayIndex ?? null };
  }
  const rawIndex = raw?.components?.findIndex((c) => c.name === comp.name);
  if (rawIndex >= 0) return { type: 'display', index: rawIndex };
  if (comp._source === 'template') return { type: 'template-override', name: comp.name };
  return { type: 'display', index: comp._displayIndex ?? null };
}

async function patchTemplateOverride(name, patch, options = {}) {
  const canvas = await fetchOpenCanvas();
  const template = defaultTemplateConfig(canvas);
  const replace = { ...(template.replace || {}) };
  let stored;

  if (options.mergeOnly || isGeometryPatch(patch)) {
    stored = { ...(replace[name] || {}), ...patch };
  } else {
    const base = await fetchTemplateComponent(name);
    stored = buildGotoOverrideStore(patch, base || {});
  }

  if (!stored || Object.keys(stored).length === 0) delete replace[name];
  else replace[name] = stored;

  template.replace = replace;
  await patchOpenCanvas({ template });
  state.canvasEditCache.raw = { ...canvas, template };
  invalidateComposedCanvasCache();

  if (options.mergeOnly || isGeometryPatch(patch)) {
    if (isGeometryPatch(patch) && previewUpdateBoundsByName(name, patch)) {
      updateCanvasEditHitBounds(name, patch);
      refreshObjectExplorer();
      refreshPropertyPanel();
      return;
    }
    if (options.mergeOnly && !isGeometryPatch(patch)) {
      try {
        const composed = await fetchComposedCanvasCached();
        const merged = composed.components?.find((c) => c.name === name);
        if (merged && previewPatchByName(name, merged)) {
          refreshObjectExplorer();
          refreshPropertyPanel();
          return;
        }
      } catch { /* fall back to full reload */ }
    }
  } else {
    try {
      const composed = await fetchComposedCanvasCached();
      const merged = composed.components?.find((c) => c.name === name);
      if (merged && previewPatchByName(name, merged)) {
        refreshObjectExplorer();
        refreshPropertyPanel();
        return;
      }
    } catch { /* fall back to full reload */ }
  }

  await updateCanvasPreview({ forceReload: true });
  refreshObjectExplorer();
  refreshPropertyPanel();
  scheduleRefreshCanvasEditOverlay();
}

async function removeTemplateOverride(name) {
  const canvas = await fetchOpenCanvas();
  const template = defaultTemplateConfig(canvas);
  const replace = { ...(template.replace || {}) };
  delete replace[name];
  template.replace = replace;
  await patchOpenCanvas({ template });
  state.canvasEditCache.raw = { ...canvas, template };
  await updateCanvasPreview({ forceReload: true });
  refreshObjectExplorer();
  refreshPropertyPanel();
  scheduleRefreshCanvasEditOverlay();
}

async function buildCanvasEditComponents(rawCanvas) {
  const list = [];
  (rawCanvas.components || []).forEach((comp, index) => {
    if (isCanvasGraphicComponent(comp)) {
      list.push({ comp, ref: { type: 'display', index } });
    }
  });

  let composed = null;
  const loadComposed = async () => {
    if (composed) return composed;
    composed = await fetchComposedCanvasCached();
    return composed;
  };

  if (!isEditingGlobalObject() && (rawCanvas.navGroup === 'overview' || rawCanvas.navGroup === 'manual')) {
    try {
      const data = await loadComposed();
      for (const comp of data.components || []) {
        if (comp._source === 'shell' && isCanvasGraphicComponent(comp)) {
          list.push({ comp, ref: { type: 'shell', name: comp.name } });
        }
      }
    } catch { /* composed preview unavailable */ }
  }

  if (!isEditingGlobalObject()) {
    try {
      const data = await loadComposed();
      const seen = new Set(list.map((entry) => entry.comp?.name).filter(Boolean));
      for (const comp of data.components || []) {
        if (comp._source !== 'template' || !isCanvasGraphicComponent(comp)) continue;
        if (seen.has(comp.name)) continue;
        list.push({ comp, ref: { type: 'template-override', name: comp.name } });
        seen.add(comp.name);
      }
    } catch { /* composed preview unavailable */ }
  }

  return list;
}

function extractPatchedCanvas(result, fallback) {
  if (!result || typeof result !== 'object') return fallback;
  if (result.object && typeof result.object === 'object') return result.object;
  if (result.screen && typeof result.screen === 'object') return result.screen;
  if (result.id || Array.isArray(result.components)) return result;
  return fallback;
}

async function patchOpenCanvas(patch) {
  const project = state.activeProject;
  const id = state.selectedScreenId;
  let result;
  if (isEditingGlobalObject()) {
    result = await fetchJson(`/api/projects/${encodeURIComponent(project)}/global-objects/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
  } else {
    result = await fetchJson(`/api/projects/${encodeURIComponent(project)}/screens/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
  }
  invalidateCanvasCaches();
  markCanvasEditOverlayStale();
  return extractPatchedCanvas(result, null);
}

function resolveEditComponentIndex(comp, ref = null) {
  const cache = state.canvasEditCache?.editComponents;
  const name = comp?.name;
  if (!cache?.length || !name) return -1;
  const hinted = state.propsDialog?.editIndex;
  if (hinted != null && cache[hinted]?.comp?.name === name) return hinted;
  const useRef = ref || state.propsDialog?.ref;
  if (useRef?.type === 'display' && useRef.index != null) {
    const byRef = cache.findIndex((e) => e.ref?.type === 'display' && e.ref.index === useRef.index);
    if (byRef >= 0) return byRef;
  }
  if (useRef?.type === 'template-override' && useRef.name) {
    const byTpl = cache.findIndex((e) => e.ref?.type === 'template-override' && e.ref.name === useRef.name);
    if (byTpl >= 0) return byTpl;
  }
  if (useRef?.type === 'shell' && useRef.name) {
    const byShell = cache.findIndex((e) => e.ref?.type === 'shell' && e.ref.name === useRef.name);
    if (byShell >= 0) return byShell;
  }
  return cache.findIndex((e) => e.comp?.name === name);
}

function showCanvasPropsDialog(dialogEl) {
  if (!dialogEl || dialogEl.open) return;
  dialogEl.show();
  if (!dialogEl.classList.contains('is-positioned')) {
    dialogEl.classList.add('is-positioned');
    dialogEl.style.margin = '0';
    dialogEl.style.position = 'fixed';
    const w = dialogEl.offsetWidth || 420;
    const h = dialogEl.offsetHeight || 320;
    dialogEl.style.left = `${Math.max(8, (window.innerWidth - w) / 2)}px`;
    dialogEl.style.top = `${Math.max(8, (window.innerHeight - h) / 2)}px`;
  }
}

async function syncEditComponentAfterSave(savedComp, ref) {
  const editIdx = resolveEditComponentIndex(savedComp, ref);
  if (!savedComp?.name) return;

  if (ref?.type === 'template-override') {
    const merged = await mergeTemplateOverrideComponent(savedComp, ref);
    if (editIdx >= 0) {
      state.canvasEditCache.editComponents[editIdx] = merged;
      state.propsDialog.editIndex = editIdx;
    } else {
      const idx = state.canvasEditCache?.editComponents?.findIndex((e) => e.comp?.name === savedComp.name);
      if (idx >= 0) state.canvasEditCache.editComponents[idx] = merged;
    }
    return;
  }

  const patchComp = { ...savedComp };
  if (editIdx >= 0 && state.canvasEditCache?.editComponents?.[editIdx]) {
    state.canvasEditCache.editComponents[editIdx].comp = {
      ...state.canvasEditCache.editComponents[editIdx].comp,
      ...patchComp
    };
    if (ref) state.canvasEditCache.editComponents[editIdx].ref = ref;
    state.propsDialog.editIndex = editIdx;
    return;
  }

  const idx = state.canvasEditCache?.editComponents?.findIndex((e) => e.comp?.name === savedComp.name);
  if (idx >= 0) {
    state.canvasEditCache.editComponents[idx].comp = {
      ...state.canvasEditCache.editComponents[idx].comp,
      ...patchComp
    };
    state.propsDialog.editIndex = idx;
  }
}

async function upsertCanvasComponent(component) {
  if (!displayIsOpen()) return false;
  let ref = state.propsDialog.ref;
  const clean = stripComponentMeta(component);
  if (!state.undoSuspended) await pushUndoForEditRef(ref);

  const canvasForRef = await fetchOpenCanvas();
  if ((!ref || (ref.type === 'display' && ref.index == null)) && clean?.name) {
    ref = resolveComponentEditRef(clean, canvasForRef, clean._source);
    state.propsDialog.ref = ref;
  }

  if (ref?.type === 'template-override') {
    const useFullMerge = clean.type === 'Rectangle' || clean.type === 'Ellipse' || clean.type === 'Arc' || clean.type === 'Freehand' || clean.type === 'Panel'
      || clean.type === 'MultistateIndicator' || clean.type === 'Text';
    await patchTemplateOverride(ref.name, clean, useFullMerge ? { mergeOnly: true } : undefined);
    await syncEditComponentAfterSave(clean, ref);
    setStatus(`Saved ${clean.name}`);
    return true;
  }

  if (ref?.type === 'shell') {
    const canvas = await fetchOpenCanvas();
    const shellKey = getNavShellKey(canvas);
    if (!shellKey) return false;
    const base = getNavShellBase(canvas, ref.name) || {};
    const stored = stripNavShellPersistFields(buildGotoOverrideStore(clean, base));
    const shellOverrides = { ...(canvas[shellKey] || {}) };
    if (!stored || Object.keys(stored).length === 0) delete shellOverrides[ref.name];
    else shellOverrides[ref.name] = stored;
    await patchOpenCanvas({ [shellKey]: shellOverrides });
    state.canvasEditCache.raw = { ...canvas, [shellKey]: shellOverrides };
    invalidateCanvasCaches();
    try {
      const composed = await fetchComposedCanvasCached();
      const merged = composed.components?.find((c) => c.name === ref.name);
      if (merged && previewPatchByName(ref.name, merged)) {
        refreshObjectExplorer();
        refreshPropertyPanel();
        return true;
      }
    } catch { /* fall back to full reload */ }
    await updateCanvasPreview({ forceReload: true });
    refreshObjectExplorer();
    refreshPropertyPanel();
    scheduleRefreshCanvasEditOverlay();
    return true;
  }

  if (ref?.type === 'template-global') {
    const canvas = await fetchOpenCanvas();
    const globalObjectId = defaultTemplateConfig(canvas).globalObjectId || 'Template';
    const tpl = await fetchJson(
      `/api/runtime/global-objects/${encodeURIComponent(globalObjectId)}?project=${encodeURIComponent(state.activeProject)}`
    );
    const components = [...(tpl.components || [])];
    const idx = components.findIndex((c) => c.name === ref.name);
    if (idx < 0) return false;
    components[idx] = { ...components[idx], ...clean };
    await fetchJson(
      `/api/projects/${encodeURIComponent(state.activeProject)}/global-objects/${encodeURIComponent(globalObjectId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components })
      }
    );
    invalidateCanvasCaches();
    try {
      const composed = await fetchComposedCanvasCached();
      const merged = composed.components?.find((c) => c.name === ref.name);
      if (merged && previewPatchByName(ref.name, merged)) {
        refreshObjectExplorer();
        refreshPropertyPanel();
        setStatus(`Updated Template → ${ref.name}`);
        return true;
      }
    } catch { /* fall back to full reload */ }
    await updateCanvasPreview({ forceReload: true });
    refreshObjectExplorer();
    refreshPropertyPanel();
    scheduleRefreshCanvasEditOverlay();
    setStatus(`Updated Template → ${ref.name}`);
    return true;
  }

  const canvas = canvasForRef;
  const components = [...(canvas.components || [])];
  let resolvedIndex = ref?.type === 'display' ? ref.index : null;
  if ((resolvedIndex == null || !canvas.components?.[resolvedIndex]) && clean.name) {
    const byName = canvas.components?.findIndex((c) => c.name === clean.name);
    if (byName >= 0) {
      resolvedIndex = byName;
      ref = { type: 'display', index: byName };
      state.propsDialog.ref = ref;
    }
  }
  const isNew = resolvedIndex == null || !canvas.components?.[resolvedIndex];
  let index;
  if (!isNew) {
    index = resolvedIndex;
    components[index] = { ...components[index], ...clean };
  } else {
    index = components.length;
    state.propsDialog.editIndex = index;
    state.propsDialog.ref = { type: 'display', index };
    components.push(clean);
  }
  await patchOpenCanvas({ components });
  const savedRaw = (await fetchOpenCanvas({ force: true })) || { ...canvas, components };
  state.canvasEditCache.raw = savedRaw;
  const savedComp = savedRaw.components?.[index] || components[index];
  await syncEditComponentAfterSave(savedComp, state.propsDialog.ref);
  invalidateComposedCanvasCache();
  if (isNew || isEditingGlobalObject()) {
    await updateCanvasPreview({ forceReload: true });
  } else {
    await updateCanvasPreview({ name: clean.name, component: savedComp || clean, mode: 'patch-by-name' });
  }
  refreshObjectExplorer();
  refreshPropertyPanel();
  if (isNew || isEditingGlobalObject()) {
    scheduleRefreshCanvasEditOverlay();
    if (isNew) {
      await refreshCanvasEditOverlay().catch(() => {});
      state.propsDialog.ref = { type: 'display', index };
      const editIdx = resolveEditComponentIndex(savedComp || clean, state.propsDialog.ref);
      if (editIdx >= 0) {
        state.propsDialog.editIndex = editIdx;
        state.canvasSelection.indices = [editIdx];
        refreshCanvasEditOverlaySelection();
      }
    }
  }
  if (isEditingGlobalObject()) {
    setStatus(`Saved ${clean.name} on Template (applies to all displays)`);
  }
  return true;
}

function markCanvasEditOverlayStale() {
  state.canvasEditOverlayStale = true;
}

function isUiWorkSuspended() {
  return Boolean(
    state.propsFormFill ||
    state.canvasEditDrag ||
    document.querySelector('dialog.dialog[open]')
  );
}

function isCanvasOverlayRefreshBlocked() {
  if (state.propsFormFill || state.canvasEditDrag) return true;
  const dlg = document.querySelector('dialog.dialog[open]');
  if (!dlg) return false;
  return !dlg.classList.contains('dialog-maintained-props');
}

function syncOpenPropsDialogBounds(comp) {
  const { kind, editIndex } = state.propsDialog || {};
  if (editIndex == null || !comp?.name) return;
  const entry = state.canvasEditCache?.editComponents?.[editIndex];
  if (!entry || entry.comp?.name !== comp.name) return;

  state.propsFormFill = true;
  try {
    if (kind === 'arc') {
      const apHeight = document.getElementById('apHeight');
      const apWidth = document.getElementById('apWidth');
      const apTop = document.getElementById('apTop');
      const apLeft = document.getElementById('apLeft');
      if (!apHeight) return;
      apHeight.value = comp.height ?? apHeight.value;
      apWidth.value = comp.width ?? apWidth.value;
      apTop.value = comp.top ?? apTop.value;
      apLeft.value = comp.left ?? apLeft.value;
      window.flushPropsApplyButton?.(window.StudioArcProperties.readArcPropertiesForm, 'applyArcProperties');
    } else if (kind === 'ellipse') {
      const epHeight = document.getElementById('epHeight');
      const epWidth = document.getElementById('epWidth');
      const epTop = document.getElementById('epTop');
      const epLeft = document.getElementById('epLeft');
      if (!epHeight) return;
      epHeight.value = comp.height ?? epHeight.value;
      epWidth.value = comp.width ?? epWidth.value;
      epTop.value = comp.top ?? epTop.value;
      epLeft.value = comp.left ?? epLeft.value;
      window.flushPropsApplyButton?.(window.StudioEllipseProperties.readEllipsePropertiesForm, 'applyEllipseProperties');
    } else if (kind === 'shape') {
      const spHeight = document.getElementById('spHeight');
      const spWidth = document.getElementById('spWidth');
      const spTop = document.getElementById('spTop');
      const spLeft = document.getElementById('spLeft');
      if (!spHeight) return;
      spHeight.value = comp.height ?? spHeight.value;
      spWidth.value = comp.width ?? spWidth.value;
      spTop.value = comp.top ?? spTop.value;
      spLeft.value = comp.left ?? spLeft.value;
      window.flushPropsApplyButton?.(window.StudioShapeProperties.readShapePropertiesForm, 'applyShapeProperties');
    } else if (kind === 'freehand') {
      const fhHeight = document.getElementById('fhHeight');
      const fhWidth = document.getElementById('fhWidth');
      const fhTop = document.getElementById('fhTop');
      const fhLeft = document.getElementById('fhLeft');
      if (!fhHeight) return;
      fhHeight.value = comp.height ?? fhHeight.value;
      fhWidth.value = comp.width ?? fhWidth.value;
      fhTop.value = comp.top ?? fhTop.value;
      fhLeft.value = comp.left ?? fhLeft.value;
      if (Array.isArray(comp.points)) {
        document.getElementById('freehandPointsData').value = JSON.stringify(comp.points);
      }
      window.updateFreehandStudioPreview?.(window.StudioFreehandProperties.readFreehandPropertiesForm());
      window.flushPropsApplyButton?.(window.StudioFreehandProperties.readFreehandPropertiesForm, 'applyFreehandProperties');
    } else if (kind === 'panel') {
      const ppHeight = document.getElementById('ppHeight');
      const ppWidth = document.getElementById('ppWidth');
      const ppTop = document.getElementById('ppTop');
      const ppLeft = document.getElementById('ppLeft');
      if (!ppHeight) return;
      ppHeight.value = comp.height ?? ppHeight.value;
      ppWidth.value = comp.width ?? ppWidth.value;
      ppTop.value = comp.top ?? ppTop.value;
      ppLeft.value = comp.left ?? ppLeft.value;
      window.flushPropsApplyButton?.(window.StudioPanelProperties.readPanelPropertiesForm, 'applyPanelProperties');
    }
  } finally {
    state.propsFormFill = false;
  }
}

function resetPropsDialogState(kind, readFn, applyBtnId, editIndex = null, ref = null) {
  const entry = editIndex != null ? state.canvasEditCache?.editComponents?.[editIndex] : null;
  state.propsFormFill = true;
  let snapshot = '';
  try {
    snapshot = JSON.stringify(readFn());
  } finally {
    state.propsFormFill = false;
  }
  state.propsDialog = {
    kind,
    snapshot,
    editIndex: editIndex ?? null,
    ref: ref ?? entry?.ref ?? null
  };
  const applyBtn = document.getElementById(applyBtnId);
  if (applyBtn) applyBtn.disabled = true;
}

let propsApplyCheckTimer = null;
let propsApplyCheckPending = null;

function updatePropsApplyButton(readFn, applyBtnId) {
  if (state.propsFormFill) return;
  propsApplyCheckPending = { readFn, applyBtnId };
  if (propsApplyCheckTimer) return;
  propsApplyCheckTimer = setTimeout(() => {
    propsApplyCheckTimer = null;
    const pending = propsApplyCheckPending;
    propsApplyCheckPending = null;
    if (pending) flushPropsApplyButton(pending.readFn, pending.applyBtnId);
  }, 50);
}

function flushPropsApplyButton(readFn, applyBtnId) {
  if (state.propsFormFill) return;
  const applyBtn = document.getElementById(applyBtnId);
  if (!applyBtn || state.propsDialog.kind == null) return;
  if (!state.propsDialog.snapshot) {
    applyBtn.disabled = true;
    return;
  }
  applyBtn.disabled = JSON.stringify(readFn()) === state.propsDialog.snapshot;
}

function commitPropsSnapshot(readFn, applyBtnId) {
  state.propsDialog.snapshot = JSON.stringify(readFn());
  const applyBtn = document.getElementById(applyBtnId);
  if (applyBtn) applyBtn.disabled = true;
  const idx = state.propsDialog.editIndex;
  if (idx != null) state.canvasSelection.indices = [idx];
}

function revertPropsDialogPreview() {
  if (!state.propsDialog.snapshot) return;
  try {
    const comp = JSON.parse(state.propsDialog.snapshot);
    if (!comp?.name) return;
    if (state.propsDialog.editIndex == null) {
      previewRemoveComponentByName(comp.name);
    } else {
      previewPatchByName(comp.name, comp);
    }
  } catch { /* ignore invalid snapshot */ }
}

function clearPropsDialogState() {
  state.propsDialog = { kind: null, snapshot: '', editIndex: null, ref: null };
}

async function addObjectToDisplay(component) {
  if (!displayIsOpen()) {
    setStatus('Open a display or global object first, then choose an object to add');
    return false;
  }
  if (!state.undoSuspended) await pushUndoBefore({ screenKeys: ['components'] });
  const canvas = await fetchOpenCanvas();
  const components = [...(canvas.components || []), component];
  await patchOpenCanvas({ components });
  state.canvasEditCache = { ...canvas, components };
  await updateCanvasPreview({
    index: components.length - 1,
    component: components[components.length - 1],
    mode: 'append',
    components
  });
  refreshObjectExplorer();
  refreshPropertyPanel();
  scheduleRefreshCanvasEditOverlay();
  return true;
}

function countComponentsByType(components, type) {
  let n = 0;
  for (const c of components || []) {
    if (c.type === type) n += 1;
    if (c.children?.length) n += countComponentsByType(c.children, type);
  }
  return n;
}

function nextTextObjectName(components) {
  const n = countComponentsByType(components, 'Text') + 1;
  return `Text${n}`;
}

function defaultTextComponent(overrides = {}) {
  return {
    type: 'Text',
    name: 'Text1',
    caption: '',
    left: 215,
    top: 179,
    width: 352,
    height: 213,
    visible: true,
    fontFamily: 'Arial Unicode MS',
    fontSize: 10,
    bold: false,
    italic: false,
    underline: false,
    foreColor: '#000000',
    useForeColor: true,
    backColor: '#ffffff',
    useBackColor: false,
    backStyle: 'transparent',
    wordWrap: true,
    sizeToFit: true,
    alignment: 'middleCenter',
    ...overrides
  };
}

function nextShapeObjectName(components, type, prefix) {
  const n = countComponentsByType(components, type) + 1;
  return `${prefix}${n}`;
}

function defaultRectangleComponent(overrides = {}) {
  return {
    type: 'Rectangle',
    name: 'Polygon1',
    left: 0,
    top: 0,
    width: 100,
    height: 50,
    visible: true,
    lineStyle: 'solid',
    backStyle: 'solid',
    patternStyle: 'none',
    useForeColor: true,
    foreColor: '#c6c6c6',
    useBackColor: true,
    backColor: '#ffffff',
    usePatternColor: false,
    patternColor: '#ffffff',
    lineWidth: 1,
    ...overrides
  };
}

function defaultEllipseComponent(overrides = {}) {
  return {
    type: 'Ellipse',
    name: 'Ellipse1',
    left: 0,
    top: 0,
    width: 121,
    height: 116,
    visible: true,
    lineStyle: 'solid',
    backStyle: 'solid',
    patternStyle: 'none',
    useForeColor: true,
    foreColor: '#808080',
    useBackColor: true,
    backColor: '#808080',
    usePatternColor: false,
    patternColor: '#ffffff',
    lineWidth: 1,
    ...overrides
  };
}

function defaultFreehandComponent(overrides = {}) {
  return {
    type: 'Freehand',
    name: 'Freehand1',
    left: 0,
    top: 0,
    width: 166,
    height: 71,
    visible: true,
    lineStyle: 'solid',
    backStyle: 'transparent',
    patternStyle: 'none',
    useForeColor: true,
    foreColor: '#000000',
    useBackColor: false,
    backColor: '#808080',
    usePatternColor: false,
    patternColor: '#808080',
    lineWidth: 1,
    points: [],
    ...overrides
  };
}

function defaultArcComponent(overrides = {}) {
  return {
    type: 'Arc',
    name: 'Arc1',
    left: 0,
    top: 0,
    width: 202,
    height: 194,
    visible: true,
    lineStyle: 'solid',
    backStyle: 'transparent',
    patternStyle: 'none',
    useForeColor: true,
    foreColor: '#000000',
    useBackColor: false,
    backColor: '#c0c0c0',
    usePatternColor: false,
    patternColor: '#ffffff',
    lineWidth: 1,
    startAngle: 0,
    sweepAngle: 360,
    ...overrides
  };
}

function defaultPanelComponent(overrides = {}) {
  return {
    type: 'Panel',
    name: 'Panel1',
    left: 0,
    top: 0,
    width: 228,
    height: 103,
    visible: true,
    borderStyle: 'line',
    backStyle: 'solid',
    borderWidth: 1,
    patternStyle: 'none',
    borderUsesBackColor: true,
    usePatternColor: false,
    patternColor: '#ffffff',
    backColor: '#001C38',
    borderColor: '#001C38',
    useBackColor: true,
    blink: false,
    children: [],
    ...overrides
  };
}

async function showTextPropertiesDialog(textDefaults = {}) {
  if (!displayIsOpen()) {
    setStatus('Open a display or global object first, then choose Text from Objects');
    return;
  }
  const canvas = await fetchOpenCanvas();
  const comp = defaultTextComponent({
    name: nextTextObjectName(canvas.components || []),
    ...textDefaults
  });
  fillTextPropertiesForm(comp);
  resetPropsDialogState('text', readTextPropertiesForm, 'applyTextProperties');
  switchTextPropertiesTab('general');
  document.getElementById('textPropertiesDialog')?.showModal();
}

function switchTextPropertiesTab(tabId) {
  document.querySelectorAll('#textPropertiesDialog .dialog-tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.tpTab === tabId);
  });
  document.querySelectorAll('#textPropertiesDialog .dialog-tab-panel').forEach((el) => {
    el.classList.toggle('active', el.dataset.tpTabPanel === tabId);
  });
}

function fillTextPropertiesForm(comp) {
  document.getElementById('textPropsCaption').value = comp.caption ?? comp.label ?? '';
  document.getElementById('textPropsFont').value = comp.fontFamily || 'Arial Unicode MS';
  document.getElementById('textPropsSize').value = String(comp.fontSize ?? 10);
  document.getElementById('textPropsBold').classList.toggle('active', Boolean(comp.bold));
  document.getElementById('textPropsItalic').classList.toggle('active', Boolean(comp.italic));
  document.getElementById('textPropsUnderline').classList.toggle('active', Boolean(comp.underline));
  document.getElementById('textPropsUseBackColor').checked = Boolean(comp.useBackColor);
  document.getElementById('textPropsBackColor').value = comp.backColor || '#ffffff';
  document.getElementById('textPropsUseForeColor').checked = comp.useForeColor !== false;
  document.getElementById('textPropsForeColor').value = comp.foreColor || '#000000';
  document.getElementById('textPropsSizeToFit').checked = comp.sizeToFit !== false;
  document.getElementById('textPropsWordWrap').checked = comp.wordWrap !== false;
  document.querySelector(`#textPropertiesForm input[name="textAlign"][value="${comp.alignment || 'middleCenter'}"]`)?.click();
  document.getElementById('textPropsBackStyle').value = comp.backStyle || 'transparent';
  document.getElementById('textPropsHeight').value = comp.height ?? 213;
  document.getElementById('textPropsWidth').value = comp.width ?? 352;
  document.getElementById('textPropsTop').value = comp.top ?? 179;
  document.getElementById('textPropsLeft').value = comp.left ?? 215;
  document.getElementById('textPropsName').value = comp.name || 'Text1';
  document.getElementById('textPropsVisible').checked = comp.visible !== false;
  syncTextPropertiesColorFields();
}

function syncTextPropertiesColorFields() {
  document.getElementById('textPropsBackColor').disabled = !document.getElementById('textPropsUseBackColor').checked;
  document.getElementById('textPropsForeColor').disabled = !document.getElementById('textPropsUseForeColor').checked;
  const solid = document.getElementById('textPropsBackStyle').value === 'solid';
  document.getElementById('textPropsUseBackColor').disabled = !solid;
  if (!solid) document.getElementById('textPropsUseBackColor').checked = false;
}

function readTextPropertiesForm() {
  const alignment = document.querySelector('#textPropertiesForm input[name="textAlign"]:checked')?.value || 'middleCenter';
  return {
    type: 'Text',
    name: document.getElementById('textPropsName').value.trim() || 'Text1',
    caption: document.getElementById('textPropsCaption').value,
    left: Number(document.getElementById('textPropsLeft').value) || 0,
    top: Number(document.getElementById('textPropsTop').value) || 0,
    width: Number(document.getElementById('textPropsWidth').value) || 352,
    height: Number(document.getElementById('textPropsHeight').value) || 213,
    visible: document.getElementById('textPropsVisible').checked,
    fontFamily: document.getElementById('textPropsFont').value,
    fontSize: Number(document.getElementById('textPropsSize').value) || 10,
    bold: document.getElementById('textPropsBold').classList.contains('active'),
    italic: document.getElementById('textPropsItalic').classList.contains('active'),
    underline: document.getElementById('textPropsUnderline').classList.contains('active'),
    foreColor: document.getElementById('textPropsForeColor').value,
    useForeColor: document.getElementById('textPropsUseForeColor').checked,
    backColor: document.getElementById('textPropsBackColor').value,
    useBackColor: document.getElementById('textPropsUseBackColor').checked,
    backStyle: document.getElementById('textPropsBackStyle').value,
    wordWrap: document.getElementById('textPropsWordWrap').checked,
    sizeToFit: document.getElementById('textPropsSizeToFit').checked,
    alignment
  };
}

async function applyTextProperties() {
  const comp = readTextPropertiesForm();
  await upsertCanvasComponent(comp);
  commitPropsSnapshot(readTextPropertiesForm, 'applyTextProperties');
  state.canvasSelection.indices = [state.propsDialog.editIndex];
  setStatus(`Applied ${comp.name} on ${state.selectedScreenId}`);
}

async function saveTextProperties(e) {
  e.preventDefault();
  const comp = readTextPropertiesForm();
  await upsertCanvasComponent(comp);
  document.getElementById('textPropertiesDialog').close();
  state.canvasSelection.indices = [state.propsDialog.editIndex];
  clearPropsDialogState();
  activateSelectTool(`Added ${comp.name} to ${state.selectedScreenId}`);
}

function initTextPropertiesDialog() {
  document.getElementById('textPropertiesForm')?.addEventListener('submit', (e) => {
    saveTextProperties(e).catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('applyTextProperties')?.addEventListener('click', () => {
    applyTextProperties().catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('textPropertiesForm')?.addEventListener('input', () => {
    updatePropsApplyButton(readTextPropertiesForm, 'applyTextProperties');
  });
  document.getElementById('textPropertiesForm')?.addEventListener('change', () => {
    updatePropsApplyButton(readTextPropertiesForm, 'applyTextProperties');
  });
  document.getElementById('cancelTextProperties')?.addEventListener('click', () => {
    document.getElementById('textPropertiesDialog')?.close();
    clearPropsDialogState();
    activateSelectTool('Placement cancelled');
  });
  document.getElementById('textPropertiesDialog')?.addEventListener('close', () => {
    if (state.placement) activateSelectTool();
  });
  document.getElementById('helpTextProperties')?.addEventListener('click', () => {
    alert('Text Properties define caption, font, colors, alignment, size, and position — matching FactoryTalk View text objects.');
  });
  document.querySelectorAll('#textPropertiesDialog .dialog-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTextPropertiesTab(tab.dataset.tpTab));
  });
  ['textPropsUseBackColor', 'textPropsUseForeColor'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => {
      syncTextPropertiesColorFields();
      updatePropsApplyButton(readTextPropertiesForm, 'applyTextProperties');
    });
  });
  document.getElementById('textPropsBackStyle')?.addEventListener('change', () => {
    syncTextPropertiesColorFields();
    updatePropsApplyButton(readTextPropertiesForm, 'applyTextProperties');
  });
  for (const id of ['textPropsBold', 'textPropsItalic', 'textPropsUnderline']) {
    document.getElementById(id)?.addEventListener('click', (e) => {
      e.preventDefault();
      e.currentTarget.classList.toggle('active');
      updatePropsApplyButton(readTextPropertiesForm, 'applyTextProperties');
    });
  }
}

function nextMomentaryButtonName(components) {
  const n = countComponentsByType(components, 'MomentaryButton') + 1;
  return `MomentaryButton${n}`;
}

function defaultMomentaryButtonStates(caption = 'Conveyor Run') {
  return [
    {
      id: 'State0', value: 0, backColor: '#dcdcdc', borderColor: '#c0c0c0',
      useBackColor: true, useBorderColor: false, caption,
      captionColor: '#000000', useCaptionColor: true,
      wordWrap: true, alignment: 'middleCenter', blink: false
    },
    {
      id: 'State1', value: 1, backColor: '#00c000', borderColor: '#40ff10',
      useBackColor: true, useBorderColor: true, caption,
      captionColor: '#ffffff', useCaptionColor: true,
      wordWrap: true, alignment: 'middleCenter', blink: false
    },
    {
      id: 'Error', backColor: 'navy', borderColor: 'navy',
      useBackColor: true, useBorderColor: true, caption: 'Error',
      captionColor: '#ffffff', useCaptionColor: true,
      wordWrap: true, alignment: 'middleCenter', blink: true
    }
  ];
}

let mbStatesDraft = null;
let mbActiveStateId = 'State0';

function cloneMomentaryStates(states) {
  return (states || []).map((s) => ({ ...s }));
}

function inferMomentaryButtonMode(comp) {
  if (comp.buttonMode) return comp.buttonMode;
  const value = comp.value ?? 1;
  const release = comp.releaseValue ?? 0;
  if (value === 1 && release === 0) return 'normallyOpen';
  if (value === 0 && release === 1) return 'normallyClosed';
  return 'value';
}

function defaultMomentaryButtonComponent(overrides = {}) {
  const caption = overrides.caption || overrides.label || 'Conveyor Run';
  return {
    type: 'MomentaryButton',
    name: 'MomentaryButton1',
    tag: 'Manual.ConveyorRun',
    indicatorTag: '',
    value: 1,
    releaseValue: 0,
    buttonMode: 'normallyOpen',
    holdTime: 250,
    caption,
    label: caption,
    left: 16,
    top: 79,
    width: 147,
    height: 38,
    visible: true,
    borderStyle: 'raisedInset',
    borderWidth: 1,
    borderUsesBackColor: true,
    backStyle: 'solid',
    shape: 'rectangle',
    useHighlightColor: false,
    highlightColor: '#00ff00',
    buttonType: 'momentary',
    touch: true,
    audio: true,
    horizontalMargin: 0,
    verticalMargin: 0,
    fontFamily: 'Arial Unicode MS',
    fontSize: 10,
    bold: false,
    italic: false,
    underline: false,
    keyAssignment: 'None',
    states: defaultMomentaryButtonStates(caption),
    ...overrides
  };
}

async function showMomentaryButtonDialog(overrides = {}) {
  if (!displayIsOpen()) {
    setStatus('Open a display or global object first, then choose Momentary from Push Button');
    return;
  }
  const canvas = await fetchOpenCanvas();
  const comp = defaultMomentaryButtonComponent({
    name: nextMomentaryButtonName(canvas.components || []),
    label: overrides.caption || 'Conveyor Run',
    ...overrides
  });
  fillMomentaryButtonForm(comp);
  resetPropsDialogState('momentary', readMomentaryButtonForm, 'applyMomentaryButton');
  switchMomentaryButtonTab('general');
  document.getElementById('momentaryButtonDialog')?.showModal();
}

function switchMomentaryButtonTab(tabId) {
  document.querySelectorAll('#momentaryButtonDialog .dialog-tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.mbTab === tabId);
  });
  document.querySelectorAll('#momentaryButtonDialog .dialog-tab-panel').forEach((el) => {
    el.classList.toggle('active', el.dataset.mbTabPanel === tabId);
  });
}

function syncMomentaryButtonGeneralFields() {
  const useHighlight = document.getElementById('mbUseHighlightColor')?.checked;
  document.getElementById('mbHighlightColor').disabled = !useHighlight;
  const mode = document.querySelector('#momentaryButtonForm input[name="mbButtonMode"]:checked')?.value || 'normallyOpen';
  const valueLocked = mode !== 'value';
  document.getElementById('mbValue').disabled = valueLocked;
  document.getElementById('mbReleaseValue').disabled = valueLocked;
  document.getElementById('mbStateBackColor').disabled = !document.getElementById('mbStateUseBackColor')?.checked;
  document.getElementById('mbStateBorderColor').disabled = !document.getElementById('mbStateUseBorderColor')?.checked;
  document.getElementById('mbStateCaptionColor').disabled = !document.getElementById('mbStateUseCaptionColor')?.checked;
}

function applyMomentaryButtonModeToFields(mode) {
  if (mode === 'normallyOpen') {
    document.getElementById('mbValue').value = '1';
    document.getElementById('mbReleaseValue').value = '0';
  } else if (mode === 'normallyClosed') {
    document.getElementById('mbValue').value = '0';
    document.getElementById('mbReleaseValue').value = '1';
  }
}

function saveMbStateFieldsToDraft() {
  if (!mbStatesDraft) return;
  const id = mbActiveStateId;
  const idx = mbStatesDraft.findIndex((s) => s.id === id);
  if (idx < 0) return;
  const alignment = document.querySelector('#momentaryButtonForm input[name="mbStateAlign"]:checked')?.value || 'middleCenter';
  mbStatesDraft[idx] = {
    ...mbStatesDraft[idx],
    backColor: document.getElementById('mbStateBackColor').value,
    borderColor: document.getElementById('mbStateBorderColor').value,
    useBackColor: document.getElementById('mbStateUseBackColor').checked,
    useBorderColor: document.getElementById('mbStateUseBorderColor').checked,
    blink: document.getElementById('mbStateBlink').checked,
    caption: document.getElementById('mbStateCaption').value,
    captionColor: document.getElementById('mbStateCaptionColor').value,
    useCaptionColor: document.getElementById('mbStateUseCaptionColor').checked,
    wordWrap: document.getElementById('mbStateWordWrap').checked,
    alignment
  };
}

function loadMbStateFieldsFromDraft(stateId) {
  mbActiveStateId = stateId;
  const state = mbStatesDraft?.find((s) => s.id === stateId) || {};
  document.getElementById('mbStateSelect').value = stateId;
  document.getElementById('mbStateUseBackColor').checked = state.useBackColor !== false;
  document.getElementById('mbStateBackColor').value = state.backColor || '#dcdcdc';
  document.getElementById('mbStateUseBorderColor').checked = Boolean(state.useBorderColor);
  document.getElementById('mbStateBorderColor').value = state.borderColor || '#c0c0c0';
  document.getElementById('mbStateBlink').checked = Boolean(state.blink);
  document.getElementById('mbStateCaption').value = state.caption ?? '';
  document.getElementById('mbStateUseCaptionColor').checked = state.useCaptionColor !== false;
  document.getElementById('mbStateCaptionColor').value = state.captionColor || '#000000';
  document.getElementById('mbStateWordWrap').checked = state.wordWrap !== false;
  document.querySelector(`#momentaryButtonForm input[name="mbStateAlign"][value="${state.alignment || 'middleCenter'}"]`)?.click();
  syncMomentaryButtonGeneralFields();
}

function switchMbState(stateId) {
  saveMbStateFieldsToDraft();
  loadMbStateFieldsFromDraft(stateId);
}

function fillMomentaryButtonForm(comp) {
  const mode = inferMomentaryButtonMode(comp);
  mbStatesDraft = cloneMomentaryStates(comp.states?.length ? comp.states : defaultMomentaryButtonStates(comp.caption ?? comp.label));
  mbActiveStateId = 'State0';

  document.getElementById('mbBorderStyle').value = comp.borderStyle || 'raisedInset';
  document.getElementById('mbBorderWidth').value = comp.borderWidth ?? 1;
  document.getElementById('mbBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
  document.getElementById('mbBackStyle').value = comp.backStyle || 'solid';
  document.getElementById('mbShape').value = comp.shape || 'rectangle';
  document.getElementById('mbUseHighlightColor').checked = Boolean(comp.useHighlightColor);
  document.getElementById('mbHighlightColor').value = comp.highlightColor || '#00ff00';
  document.getElementById('mbHoldTime').value = comp.holdTime ?? 250;
  document.getElementById('mbHorizontalMargin').value = comp.horizontalMargin ?? 0;
  document.getElementById('mbVerticalMargin').value = comp.verticalMargin ?? 0;
  document.getElementById('mbTouch').checked = comp.touch !== false;
  document.getElementById('mbAudio').checked = comp.audio !== false;
  document.getElementById('mbFont').value = comp.fontFamily || 'Arial Unicode MS';
  document.getElementById('mbFontSize').value = String(comp.fontSize ?? 10);
  document.getElementById('mbBold').classList.toggle('active', Boolean(comp.bold));
  document.getElementById('mbItalic').classList.toggle('active', Boolean(comp.italic));
  document.getElementById('mbUnderline').classList.toggle('active', Boolean(comp.underline));
  document.getElementById('mbKeyAssignment').value = comp.keyAssignment || 'None';
  document.getElementById('mbHeight').value = comp.height ?? 38;
  document.getElementById('mbWidth').value = comp.width ?? 147;
  document.getElementById('mbTop').value = comp.top ?? 79;
  document.getElementById('mbLeft').value = comp.left ?? 16;
  document.getElementById('mbName').value = comp.name || 'MomentaryButton1';
  document.getElementById('mbVisible').checked = comp.visible !== false;
  document.getElementById('mbTag').value = comp.tag || '';
  document.getElementById('mbIndicatorTag').value = comp.indicatorTag || '';
  document.getElementById('mbValue').value = comp.value ?? 1;
  document.getElementById('mbReleaseValue').value = comp.releaseValue ?? 0;
  document.querySelector(`#momentaryButtonForm input[name="mbButtonMode"][value="${mode}"]`)?.click();
  applyMomentaryButtonModeToFields(mode);
  loadMbStateFieldsFromDraft('State0');
  syncMomentaryButtonGeneralFields();
}

function readMomentaryButtonForm() {
  saveMbStateFieldsToDraft();
  const mode = document.querySelector('#momentaryButtonForm input[name="mbButtonMode"]:checked')?.value || 'normallyOpen';
  const state0 = mbStatesDraft?.find((s) => s.id === 'State0');
  const caption = state0?.caption ?? '';
  return {
    type: 'MomentaryButton',
    name: document.getElementById('mbName').value.trim() || 'MomentaryButton1',
    tag: document.getElementById('mbTag').value.trim(),
    indicatorTag: document.getElementById('mbIndicatorTag').value.trim(),
    value: Number(document.getElementById('mbValue').value),
    releaseValue: Number(document.getElementById('mbReleaseValue').value),
    buttonMode: mode,
    holdTime: Number(document.getElementById('mbHoldTime').value) || 0,
    caption,
    label: caption,
    left: Number(document.getElementById('mbLeft').value) || 0,
    top: Number(document.getElementById('mbTop').value) || 0,
    width: Number(document.getElementById('mbWidth').value) || 147,
    height: Number(document.getElementById('mbHeight').value) || 38,
    visible: document.getElementById('mbVisible').checked,
    borderStyle: document.getElementById('mbBorderStyle').value,
    borderWidth: Number(document.getElementById('mbBorderWidth').value) || 1,
    borderUsesBackColor: document.getElementById('mbBorderUsesBackColor').checked,
    backStyle: document.getElementById('mbBackStyle').value,
    shape: document.getElementById('mbShape').value,
    useHighlightColor: document.getElementById('mbUseHighlightColor').checked,
    highlightColor: document.getElementById('mbHighlightColor').value,
    buttonType: 'momentary',
    touch: document.getElementById('mbTouch').checked,
    audio: document.getElementById('mbAudio').checked,
    horizontalMargin: Number(document.getElementById('mbHorizontalMargin').value) || 0,
    verticalMargin: Number(document.getElementById('mbVerticalMargin').value) || 0,
    fontFamily: document.getElementById('mbFont').value,
    fontSize: Number(document.getElementById('mbFontSize').value) || 10,
    bold: document.getElementById('mbBold').classList.contains('active'),
    italic: document.getElementById('mbItalic').classList.contains('active'),
    underline: document.getElementById('mbUnderline').classList.contains('active'),
    keyAssignment: document.getElementById('mbKeyAssignment').value,
    states: cloneMomentaryStates(mbStatesDraft)
  };
}

async function applyMomentaryButton() {
  const comp = readMomentaryButtonForm();
  if (!comp.tag) {
    setStatus('Enter a tag on the Connections tab');
    switchMomentaryButtonTab('connections');
    return;
  }
  await upsertCanvasComponent(comp);
  commitPropsSnapshot(readMomentaryButtonForm, 'applyMomentaryButton');
  state.canvasSelection.indices = [state.propsDialog.editIndex];
  setStatus(`Applied ${comp.name} on ${state.selectedScreenId}`);
}

async function saveMomentaryButton(e) {
  e.preventDefault();
  const comp = readMomentaryButtonForm();
  if (!comp.tag) {
    setStatus('Enter a tag on the Connections tab');
    switchMomentaryButtonTab('connections');
    return;
  }
  await upsertCanvasComponent(comp);
  document.getElementById('momentaryButtonDialog').close();
  state.canvasSelection.indices = [state.propsDialog.editIndex];
  clearPropsDialogState();
  activateSelectTool(`Added ${comp.name} to ${state.selectedScreenId}`);
}

function initMomentaryButtonDialog() {
  document.getElementById('momentaryButtonForm')?.addEventListener('submit', (e) => {
    saveMomentaryButton(e).catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('applyMomentaryButton')?.addEventListener('click', () => {
    applyMomentaryButton().catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('momentaryButtonForm')?.addEventListener('input', () => {
    updatePropsApplyButton(readMomentaryButtonForm, 'applyMomentaryButton');
  });
  document.getElementById('momentaryButtonForm')?.addEventListener('change', () => {
    updatePropsApplyButton(readMomentaryButtonForm, 'applyMomentaryButton');
  });
  document.getElementById('cancelMomentaryButton')?.addEventListener('click', () => {
    document.getElementById('momentaryButtonDialog')?.close();
    clearPropsDialogState();
    activateSelectTool('Placement cancelled');
  });
  document.getElementById('momentaryButtonDialog')?.addEventListener('close', () => {
    if (state.placement) activateSelectTool();
  });
  document.getElementById('helpMomentaryButton')?.addEventListener('click', () => {
    alert('Momentary Push Button writes Value while pressed and Release Value after Hold time when released. State0/State1/Error control appearance from the indicator tag.');
  });
  document.querySelectorAll('#momentaryButtonDialog .dialog-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchMomentaryButtonTab(tab.dataset.mbTab));
  });
  document.getElementById('mbStateSelect')?.addEventListener('change', (e) => {
    switchMbState(e.target.value);
    updatePropsApplyButton(readMomentaryButtonForm, 'applyMomentaryButton');
  });
  for (const id of ['mbUseHighlightColor', 'mbStateUseBackColor', 'mbStateUseBorderColor', 'mbStateUseCaptionColor']) {
    document.getElementById(id)?.addEventListener('change', () => {
      syncMomentaryButtonGeneralFields();
      updatePropsApplyButton(readMomentaryButtonForm, 'applyMomentaryButton');
    });
  }
  document.querySelectorAll('#momentaryButtonForm input[name="mbButtonMode"]').forEach((el) => {
    el.addEventListener('change', () => {
      applyMomentaryButtonModeToFields(el.value);
      syncMomentaryButtonGeneralFields();
      updatePropsApplyButton(readMomentaryButtonForm, 'applyMomentaryButton');
    });
  });
  for (const id of ['mbBold', 'mbItalic', 'mbUnderline']) {
    document.getElementById(id)?.addEventListener('click', (e) => {
      e.preventDefault();
      e.currentTarget.classList.toggle('active');
      updatePropsApplyButton(readMomentaryButtonForm, 'applyMomentaryButton');
    });
  }
}

function nextMaintainedButtonName(components) {
  const n = countComponentsByType(components, 'MaintainedButton') + 1;
  return `MaintainedButton${n}`;
}

function defaultMaintainedButtonStates(caption = 'Pump Run') {
  return [
    {
      id: 'State0', value: 0, backColor: '#dcdcdc', borderColor: '#c0c0c0',
      useBackColor: true, useBorderColor: false, caption,
      captionColor: '#000000', useCaptionColor: true,
      wordWrap: true, alignment: 'middleCenter', blink: false
    },
    {
      id: 'State1', value: 1, backColor: '#00c000', borderColor: '#40ff10',
      useBackColor: true, useBorderColor: true, caption,
      captionColor: '#ffffff', useCaptionColor: true,
      wordWrap: true, alignment: 'middleCenter', blink: false
    },
    {
      id: 'Error', backColor: 'navy', borderColor: 'navy',
      useBackColor: true, useBorderColor: true, caption: 'Error',
      captionColor: '#ffffff', useCaptionColor: true,
      wordWrap: true, alignment: 'middleCenter', blink: true
    }
  ];
}

let mtnStatesDraft = null;
let mtnActiveStateId = 'State0';
let mtnStateClipboard = null;

function wireMaintainedButtonDialogTools() {
  if (window.StudioTagTools) StudioTagTools.wirePickButtons();
  if (window.FtColorPicker) {
    window.FtColorPicker.initAll(document.getElementById('maintainedButtonDialog'));
  }
  syncMaintainedButtonGeneralFields();
}

function cloneMaintainedStates(states) {
  return (states || []).map((s) => ({ ...s }));
}

function defaultMaintainedButtonComponent(overrides = {}) {
  const caption = overrides.caption || overrides.label || 'Pump Run';
  return {
    type: 'MaintainedButton',
    name: 'MaintainedButton1',
    tag: 'Manual.PumpRun',
    indicatorTag: '',
    nextStateBasedOn: 'currentState',
    caption,
    label: caption,
    left: 16,
    top: 79,
    width: 147,
    height: 38,
    visible: true,
    borderStyle: 'line',
    borderWidth: 1,
    borderUsesBackColor: true,
    backStyle: 'solid',
    shape: 'rectangle',
    useHighlightColor: false,
    highlightColor: '#00ff00',
    buttonType: 'maintained',
    touch: true,
    audio: true,
    horizontalMargin: 0,
    verticalMargin: 0,
    fontFamily: 'Arial Unicode MS',
    fontSize: 10,
    bold: false,
    italic: false,
    underline: false,
    keyAssignment: 'None',
    states: defaultMaintainedButtonStates(caption),
    ...overrides
  };
}

async function showMaintainedButtonDialog(overrides = {}) {
  if (!displayIsOpen()) {
    setStatus('Open a display or global object first, then choose Maintained from Push Button');
    return;
  }
  const canvas = await fetchOpenCanvas();
  const comp = defaultMaintainedButtonComponent({
    name: nextMaintainedButtonName(canvas.components || []),
    label: overrides.caption || 'Pump Run',
    ...overrides
  });
  fillMaintainedButtonForm(comp);
  resetPropsDialogState('maintained', readMaintainedButtonForm, 'applyMaintainedButton');
  switchMaintainedButtonTab('general');
  wireMaintainedButtonDialogTools();
  document.getElementById('maintainedButtonDialog')?.showModal();
}

function switchMaintainedButtonTab(tabId) {
  document.querySelectorAll('#maintainedButtonDialog .dialog-tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.mtnTab === tabId);
  });
  document.querySelectorAll('#maintainedButtonDialog .dialog-tab-panel').forEach((el) => {
    el.classList.toggle('active', el.dataset.mtnTabPanel === tabId);
  });
}

function syncMaintainedButtonGeneralFields() {
  const useHighlight = document.getElementById('mtnUseHighlightColor')?.checked;
  document.getElementById('mtnHighlightColor').disabled = !useHighlight;
  document.getElementById('mtnStateBackColor').disabled = !document.getElementById('mtnStateUseBackColor')?.checked;
  document.getElementById('mtnStateBorderColor').disabled = !document.getElementById('mtnStateUseBorderColor')?.checked;
  document.getElementById('mtnStateCaptionColor').disabled = !document.getElementById('mtnStateUseCaptionColor')?.checked;
  const showValue = mtnActiveStateId === 'State0' || mtnActiveStateId === 'State1';
  document.getElementById('mtnStateValueRow')?.classList.toggle('hidden', !showValue);
}

function saveMtnStateFieldsToDraft() {
  if (!mtnStatesDraft) return;
  const id = mtnActiveStateId;
  const idx = mtnStatesDraft.findIndex((s) => s.id === id);
  if (idx < 0) return;
  const alignment = document.querySelector('#maintainedButtonForm input[name="mtnStateAlign"]:checked')?.value || 'middleCenter';
  const next = {
    ...mtnStatesDraft[idx],
    backColor: document.getElementById('mtnStateBackColor').value,
    borderColor: document.getElementById('mtnStateBorderColor').value,
    useBackColor: document.getElementById('mtnStateUseBackColor').checked,
    useBorderColor: document.getElementById('mtnStateUseBorderColor').checked,
    blink: document.getElementById('mtnStateBlink').checked,
    caption: document.getElementById('mtnStateCaption').value,
    captionColor: document.getElementById('mtnStateCaptionColor').value,
    useCaptionColor: document.getElementById('mtnStateUseCaptionColor').checked,
    wordWrap: document.getElementById('mtnStateWordWrap').checked,
    alignment
  };
  if (id === 'State0' || id === 'State1') {
    next.value = Number(document.getElementById('mtnStateValue').value);
  }
  mtnStatesDraft[idx] = next;
}

function loadMtnStateFieldsFromDraft(stateId) {
  mtnActiveStateId = stateId;
  const state = mtnStatesDraft?.find((s) => s.id === stateId) || {};
  document.getElementById('mtnStateSelect').value = stateId;
  document.getElementById('mtnStateUseBackColor').checked = state.useBackColor !== false;
  document.getElementById('mtnStateBackColor').value = state.backColor || '#dcdcdc';
  document.getElementById('mtnStateUseBorderColor').checked = Boolean(state.useBorderColor);
  document.getElementById('mtnStateBorderColor').value = state.borderColor || '#c0c0c0';
  document.getElementById('mtnStateBlink').checked = Boolean(state.blink);
  document.getElementById('mtnStateCaption').value = state.caption ?? '';
  document.getElementById('mtnStateUseCaptionColor').checked = state.useCaptionColor !== false;
  document.getElementById('mtnStateCaptionColor').value = state.captionColor || '#000000';
  document.getElementById('mtnStateWordWrap').checked = state.wordWrap !== false;
  document.getElementById('mtnStateValue').value = state.value ?? (stateId === 'State1' ? 1 : 0);
  document.querySelector(`#maintainedButtonForm input[name="mtnStateAlign"][value="${state.alignment || 'middleCenter'}"]`)?.click();
  syncMaintainedButtonGeneralFields();
}

function switchMtnState(stateId) {
  saveMtnStateFieldsToDraft();
  loadMtnStateFieldsFromDraft(stateId);
}

function fillMaintainedButtonForm(comp) {
  mtnStatesDraft = cloneMaintainedStates(comp.states?.length ? comp.states : defaultMaintainedButtonStates(comp.caption ?? comp.label));
  mtnActiveStateId = 'State0';
  mtnStateClipboard = null;
  const pasteBtn = document.getElementById('mtnStatePaste');
  if (pasteBtn) pasteBtn.disabled = true;

  document.getElementById('mtnBorderStyle').value = comp.borderStyle || 'line';
  document.getElementById('mtnBorderWidth').value = comp.borderWidth ?? 1;
  document.getElementById('mtnBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
  document.getElementById('mtnBackStyle').value = comp.backStyle || 'solid';
  document.getElementById('mtnShape').value = comp.shape || 'rectangle';
  document.getElementById('mtnUseHighlightColor').checked = Boolean(comp.useHighlightColor);
  document.getElementById('mtnHighlightColor').value = comp.highlightColor || '#00ff00';
  document.getElementById('mtnNextStateBasedOn').value = comp.nextStateBasedOn || 'currentState';
  document.getElementById('mtnHorizontalMargin').value = comp.horizontalMargin ?? 0;
  document.getElementById('mtnVerticalMargin').value = comp.verticalMargin ?? 0;
  document.getElementById('mtnTouch').checked = comp.touch !== false;
  document.getElementById('mtnAudio').checked = comp.audio !== false;
  document.getElementById('mtnFont').value = comp.fontFamily || 'Arial Unicode MS';
  document.getElementById('mtnFontSize').value = String(comp.fontSize ?? 10);
  document.getElementById('mtnBold').classList.toggle('active', Boolean(comp.bold));
  document.getElementById('mtnItalic').classList.toggle('active', Boolean(comp.italic));
  document.getElementById('mtnUnderline').classList.toggle('active', Boolean(comp.underline));
  document.getElementById('mtnKeyAssignment').value = comp.keyAssignment || 'None';
  document.getElementById('mtnHeight').value = comp.height ?? 38;
  document.getElementById('mtnWidth').value = comp.width ?? 147;
  document.getElementById('mtnTop').value = comp.top ?? 79;
  document.getElementById('mtnLeft').value = comp.left ?? 16;
  document.getElementById('mtnName').value = comp.name || 'MaintainedButton1';
  document.getElementById('mtnVisible').checked = comp.visible !== false;
  document.getElementById('mtnTag').value = comp.tag || '';
  document.getElementById('mtnIndicatorTag').value = comp.indicatorTag || '';
  loadMtnStateFieldsFromDraft('State0');
  syncMaintainedButtonGeneralFields();
}

function readMaintainedButtonForm() {
  saveMtnStateFieldsToDraft();
  const state0 = mtnStatesDraft?.find((s) => s.id === 'State0');
  const caption = state0?.caption ?? '';
  return {
    type: 'MaintainedButton',
    name: document.getElementById('mtnName').value.trim() || 'MaintainedButton1',
    tag: document.getElementById('mtnTag').value.trim(),
    indicatorTag: document.getElementById('mtnIndicatorTag').value.trim(),
    nextStateBasedOn: document.getElementById('mtnNextStateBasedOn').value || 'currentState',
    caption,
    label: caption,
    left: Number(document.getElementById('mtnLeft').value) || 0,
    top: Number(document.getElementById('mtnTop').value) || 0,
    width: Number(document.getElementById('mtnWidth').value) || 147,
    height: Number(document.getElementById('mtnHeight').value) || 38,
    visible: document.getElementById('mtnVisible').checked,
    borderStyle: document.getElementById('mtnBorderStyle').value,
    borderWidth: Number(document.getElementById('mtnBorderWidth').value) || 1,
    borderUsesBackColor: document.getElementById('mtnBorderUsesBackColor').checked,
    backStyle: document.getElementById('mtnBackStyle').value,
    shape: document.getElementById('mtnShape').value,
    useHighlightColor: document.getElementById('mtnUseHighlightColor').checked,
    highlightColor: document.getElementById('mtnHighlightColor').value,
    buttonType: 'maintained',
    touch: document.getElementById('mtnTouch').checked,
    audio: document.getElementById('mtnAudio').checked,
    horizontalMargin: Number(document.getElementById('mtnHorizontalMargin').value) || 0,
    verticalMargin: Number(document.getElementById('mtnVerticalMargin').value) || 0,
    fontFamily: document.getElementById('mtnFont').value,
    fontSize: Number(document.getElementById('mtnFontSize').value) || 10,
    bold: document.getElementById('mtnBold').classList.contains('active'),
    italic: document.getElementById('mtnItalic').classList.contains('active'),
    underline: document.getElementById('mtnUnderline').classList.contains('active'),
    keyAssignment: document.getElementById('mtnKeyAssignment').value,
    states: cloneMaintainedStates(mtnStatesDraft)
  };
}

async function applyMaintainedButton() {
  const comp = readMaintainedButtonForm();
  if (!comp.tag) {
    setStatus('Enter a tag on the Connections tab');
    switchMaintainedButtonTab('connections');
    return;
  }
  await upsertCanvasComponent(comp);
  commitPropsSnapshot(readMaintainedButtonForm, 'applyMaintainedButton');
  state.canvasSelection.indices = [state.propsDialog.editIndex];
  setStatus(`Applied ${comp.name} on ${state.selectedScreenId}`);
}

async function saveMaintainedButton(e) {
  e.preventDefault();
  const comp = readMaintainedButtonForm();
  if (!comp.tag) {
    setStatus('Enter a tag on the Connections tab');
    switchMaintainedButtonTab('connections');
    return;
  }
  await upsertCanvasComponent(comp);
  document.getElementById('maintainedButtonDialog').close();
  state.canvasSelection.indices = [state.propsDialog.editIndex];
  clearPropsDialogState();
  activateSelectTool(`Added ${comp.name} to ${state.selectedScreenId}`);
}

function initMaintainedButtonDialog() {
  document.getElementById('maintainedButtonForm')?.addEventListener('submit', (e) => {
    saveMaintainedButton(e).catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('applyMaintainedButton')?.addEventListener('click', () => {
    applyMaintainedButton().catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('maintainedButtonForm')?.addEventListener('input', () => {
    updatePropsApplyButton(readMaintainedButtonForm, 'applyMaintainedButton');
  });
  document.getElementById('maintainedButtonForm')?.addEventListener('change', () => {
    updatePropsApplyButton(readMaintainedButtonForm, 'applyMaintainedButton');
  });
  document.getElementById('cancelMaintainedButton')?.addEventListener('click', () => {
    document.getElementById('maintainedButtonDialog')?.close();
    clearPropsDialogState();
    activateSelectTool('Placement cancelled');
  });
  document.getElementById('maintainedButtonDialog')?.addEventListener('close', () => {
    if (state.placement) activateSelectTool();
  });
  document.getElementById('helpMaintainedButton')?.addEventListener('click', () => {
    alert('Maintained Push Button toggles the value tag between State0 and State1 on each click. Appearance follows the indicator tag (or value tag if no indicator).');
  });
  document.querySelectorAll('#maintainedButtonDialog .dialog-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchMaintainedButtonTab(tab.dataset.mtnTab));
  });
  document.getElementById('mtnStateSelect')?.addEventListener('change', (e) => {
    switchMtnState(e.target.value);
    updatePropsApplyButton(readMaintainedButtonForm, 'applyMaintainedButton');
  });
  document.getElementById('mtnStateCopy')?.addEventListener('click', () => {
    saveMtnStateFieldsToDraft();
    const state = mtnStatesDraft?.find((s) => s.id === mtnActiveStateId);
    if (state) {
      mtnStateClipboard = { ...state };
      const pasteBtn = document.getElementById('mtnStatePaste');
      if (pasteBtn) pasteBtn.disabled = false;
    }
  });
  document.getElementById('mtnStatePaste')?.addEventListener('click', () => {
    if (!mtnStateClipboard || !mtnStatesDraft) return;
    saveMtnStateFieldsToDraft();
    const idx = mtnStatesDraft.findIndex((s) => s.id === mtnActiveStateId);
    if (idx < 0) return;
    const keep = { id: mtnStatesDraft[idx].id, value: mtnStatesDraft[idx].value };
    mtnStatesDraft[idx] = { ...mtnStateClipboard, ...keep };
    loadMtnStateFieldsFromDraft(mtnActiveStateId);
    updatePropsApplyButton(readMaintainedButtonForm, 'applyMaintainedButton');
  });
  for (const id of ['mtnUseHighlightColor', 'mtnStateUseBackColor', 'mtnStateUseBorderColor', 'mtnStateUseCaptionColor']) {
    document.getElementById(id)?.addEventListener('change', () => {
      syncMaintainedButtonGeneralFields();
      updatePropsApplyButton(readMaintainedButtonForm, 'applyMaintainedButton');
    });
  }
  for (const id of ['mtnBold', 'mtnItalic', 'mtnUnderline']) {
    document.getElementById(id)?.addEventListener('click', (e) => {
      e.preventDefault();
      e.currentTarget.classList.toggle('active');
      updatePropsApplyButton(readMaintainedButtonForm, 'applyMaintainedButton');
    });
  }
}

function nextGotoButtonName(components) {
  const n = countComponentsByType(components, 'GotoButton') + 1;
  return `GotoDisplayButton${n}`;
}

function defaultGotoButtonComponent(overrides = {}) {
  return {
    type: 'GotoButton',
    name: 'GotoDisplayButton1',
    label: '',
    caption: '',
    target: '',
    displayNameTag: '',
    displayTopTag: '',
    displayLeftTag: '',
    left: 8,
    top: 75,
    width: 66,
    height: 35,
    visible: true,
    borderStyle: 'line',
    borderWidth: 1,
    borderUsesBackColor: true,
    useBackColor: true,
    useBorderColor: true,
    usePatternColor: false,
    useHighlightColor: false,
    backStyle: 'solid',
    backColor: '#001C38',
    borderColor: '#000000',
    patternColor: '#ffffff',
    highlightColor: '#0066cc',
    patternStyle: 'none',
    shape: 'rectangle',
    blink: false,
    useVariableDisplay: false,
    parameterType: 'file',
    parameterFile: '',
    parameterList: '',
    displayPosition: false,
    displayTop: 0,
    displayLeft: 0,
    useVariableDisplayPosition: false,
    audio: true,
    horizontalMargin: 0,
    verticalMargin: 0,
    fontFamily: 'Arial Unicode MS',
    fontSize: 10,
    bold: false,
    italic: false,
    underline: false,
    foreColor: '#ffffff',
    useForeColor: false,
    useCaptionColor: false,
    captionBackStyle: 'transparent',
    wordWrap: true,
    alignment: 'middleCenter',
    imageBackStyle: 'transparent',
    imageAlignment: 'middleCenter',
    ...overrides
  };
}

function wireGotoButtonDialogTools() {
  if (window.StudioTagTools) StudioTagTools.wirePickButtons();
  if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('gotoButtonDialog'));
  syncGotoButtonGeneralFields();
  syncGotoButtonLabelFields();
}

function syncGotoButtonLabelFields() {
  document.getElementById('gbCaptionColor').disabled = !document.getElementById('gbUseCaptionColor')?.checked;
  document.getElementById('gbCaptionBackColor').disabled = !document.getElementById('gbUseCaptionBackColor')?.checked;
  document.getElementById('gbImageColor').disabled = !document.getElementById('gbUseImageColor')?.checked;
  document.getElementById('gbImageBackColor').disabled = !document.getElementById('gbUseImageBackColor')?.checked;
}

async function showGotoButtonDialog(overrides = {}) {
  if (!displayIsOpen()) {
    setStatus('Open a display or global object first, then choose Goto from Display Navigation');
    return;
  }
  const canvas = await fetchOpenCanvas();
  const comp = defaultGotoButtonComponent({
    name: nextGotoButtonName(canvas.components || []),
    ...overrides
  });
  fillGotoButtonForm(comp);
  resetPropsDialogState('goto', readGotoButtonForm, 'applyGotoButton');
  switchGotoButtonTab('general');
  wireGotoButtonDialogTools();
  document.getElementById('gotoButtonDialog')?.showModal();
}

function switchGotoButtonTab(tabId) {
  document.querySelectorAll('#gotoButtonDialog .dialog-tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.gbTab === tabId);
  });
  document.querySelectorAll('#gotoButtonDialog .dialog-tab-panel').forEach((el) => {
    el.classList.toggle('active', el.dataset.gbTabPanel === tabId);
  });
}

function normalizeGotoCaptionColor(useBorderColor, foreColor) {
  const normalized = String(foreColor || '').trim().toLowerCase();
  if (useBorderColor) return foreColor || '#000000';
  if (!normalized || normalized === '#ffffff' || normalized === '#fff') return '#000000';
  return foreColor || '#000000';
}

function syncGotoButtonGeneralFields() {
  const borderUsesBack = document.getElementById('gbBorderUsesBackColor')?.checked;
  const useBack = document.getElementById('gbUseBackColor')?.checked;
  const useBorder = document.getElementById('gbUseBorderColor')?.checked;
  const usePattern = document.getElementById('gbUsePatternColor')?.checked;
  const useHighlight = document.getElementById('gbUseHighlightColor')?.checked;
  const useVarDisplay = document.getElementById('gbUseVariableDisplay')?.checked;
  const displayPos = document.getElementById('gbDisplayPosition')?.checked;
  const paramType = document.querySelector('#gotoButtonForm input[name="gbParameterType"]:checked')?.value || 'file';

  if (!useBorder) {
    const captionEl = document.getElementById('gbCaptionColor');
    if (captionEl) {
      captionEl.value = normalizeGotoCaptionColor(false, captionEl.value);
    }
  }

  document.getElementById('gbBackColor').disabled = !useBack;
  document.getElementById('gbBorderColor').disabled = !useBorder || Boolean(borderUsesBack);
  document.getElementById('gbUseBorderColor').disabled = Boolean(borderUsesBack);
  document.getElementById('gbPatternColor').disabled = !usePattern;
  document.getElementById('gbHighlightColor').disabled = !useHighlight;
  document.getElementById('gbTarget').disabled = Boolean(useVarDisplay);
  document.getElementById('gbBrowseDisplay').disabled = Boolean(useVarDisplay);
  document.getElementById('gbDisplayTop').disabled = !displayPos;
  document.getElementById('gbDisplayLeft').disabled = !displayPos;

  const fileMode = paramType === 'file';
  document.getElementById('gbParameterFile').disabled = !fileMode;
  document.getElementById('gbBrowseParameterFile').disabled = !fileMode;
  document.getElementById('gbParameterList').disabled = fileMode;
  document.getElementById('gbBrowseParameterList').disabled = fileMode;
}

let displayPickerResolve = null;

async function showDisplayPickerDialog(selectedId = '') {
  if (!state.activeProject) {
    setStatus('Open a project first');
    return null;
  }
  const screens = await fetchJson(`/api/runtime/screens?project=${encodeURIComponent(state.activeProject)}`);
  const list = document.getElementById('displayPickerList');
  if (!list) return null;
  list.innerHTML = screens.map((s) =>
    `<option value="${escapeHtml(s.id)}"${s.id === selectedId ? ' selected' : ''}>${escapeHtml(s.title || s.id)} (${escapeHtml(s.id)})</option>`
  ).join('');
  return new Promise((resolve) => {
    displayPickerResolve = resolve;
    document.getElementById('displayPickerDialog')?.showModal();
  });
}

function resolveDisplayPicker(value) {
  document.getElementById('displayPickerDialog')?.close();
  if (displayPickerResolve) {
    displayPickerResolve(value);
    displayPickerResolve = null;
  }
}

function initDisplayPickerDialog() {
  document.getElementById('displayPickerOk')?.addEventListener('click', () => {
    const list = document.getElementById('displayPickerList');
    resolveDisplayPicker(list?.value || null);
  });
  document.getElementById('displayPickerCancel')?.addEventListener('click', () => {
    resolveDisplayPicker(null);
  });
  document.getElementById('displayPickerDialog')?.addEventListener('close', () => {
    if (displayPickerResolve) resolveDisplayPicker(null);
  });
  document.getElementById('displayPickerList')?.addEventListener('dblclick', () => {
    const list = document.getElementById('displayPickerList');
    resolveDisplayPicker(list?.value || null);
  });
}

function fillGotoButtonForm(comp) {
  document.getElementById('gbBorderStyle').value = comp.borderStyle || 'raised';
  document.getElementById('gbBackStyle').value = comp.backStyle || 'solid';
  document.getElementById('gbShape').value = comp.shape || 'rectangle';
  document.getElementById('gbBorderWidth').value = comp.borderWidth ?? 3;
  document.getElementById('gbPatternStyle').value = comp.patternStyle || 'none';
  document.getElementById('gbBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
  document.getElementById('gbUseBackColor').checked = Boolean(comp.useBackColor);
  document.getElementById('gbBackColor').value = comp.backColor || '#dcdcdc';
  document.getElementById('gbUseBorderColor').checked = Boolean(comp.useBorderColor);
  document.getElementById('gbBorderColor').value = comp.borderColor || '#e0e0e0';
  document.getElementById('gbUsePatternColor').checked = Boolean(comp.usePatternColor);
  document.getElementById('gbPatternColor').value = comp.patternColor || '#ffffff';
  document.getElementById('gbUseHighlightColor').checked = Boolean(comp.useHighlightColor);
  document.getElementById('gbHighlightColor').value = comp.highlightColor || '#00ff00';
  document.getElementById('gbBlink').checked = Boolean(comp.blink);
  document.getElementById('gbTarget').value = comp.target || '';
  document.getElementById('gbUseVariableDisplay').checked = Boolean(comp.useVariableDisplay);
  document.getElementById('gbParameterFileRadio').checked = (comp.parameterType || 'file') === 'file';
  document.getElementById('gbParameterListRadio').checked = comp.parameterType === 'list';
  document.getElementById('gbParameterFile').value = comp.parameterFile || '';
  document.getElementById('gbParameterList').value = comp.parameterList || '';
  document.getElementById('gbDisplayPosition').checked = Boolean(comp.displayPosition);
  document.getElementById('gbDisplayTop').value = comp.displayTop ?? 0;
  document.getElementById('gbDisplayLeft').value = comp.displayLeft ?? 0;
  document.getElementById('gbUseVariableDisplayPosition').checked = Boolean(comp.useVariableDisplayPosition);
  document.getElementById('gbHorizontalMargin').value = comp.horizontalMargin ?? 0;
  document.getElementById('gbVerticalMargin').value = comp.verticalMargin ?? 0;
  document.getElementById('gbAudio').checked = comp.audio !== false;
  document.getElementById('gbCaption').value = comp.caption ?? comp.label ?? '';
  document.getElementById('gbFont').value = comp.fontFamily || 'Arial';
  document.getElementById('gbFontSize').value = String(comp.fontSize ?? 10);
  document.getElementById('gbBold').classList.toggle('active', Boolean(comp.bold));
  document.getElementById('gbItalic').classList.toggle('active', Boolean(comp.italic));
  document.getElementById('gbUnderline').classList.toggle('active', Boolean(comp.underline));
  document.getElementById('gbUseCaptionColor').checked = comp.useCaptionColor !== undefined
    ? Boolean(comp.useCaptionColor)
    : comp.useForeColor !== false;
  document.getElementById('gbCaptionColor').value = comp.foreColor || '#000000';
  document.getElementById('gbUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
  document.getElementById('gbCaptionBackColor').value = comp.captionBackColor || '#001C38';
  document.getElementById('gbCaptionBlink').checked = Boolean(comp.captionBlink);
  document.getElementById('gbWordWrap').checked = comp.wordWrap !== false;
  document.querySelector(`#gotoButtonForm input[name="gbAlign"][value="${comp.alignment || 'middleCenter'}"]`)?.click();
  document.getElementById('gbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
  document.getElementById('gbImage').value = comp.image || '';
  document.getElementById('gbImageBackStyle').value = comp.imageBackStyle || 'transparent';
  document.getElementById('gbUseImageColor').checked = Boolean(comp.useImageColor);
  document.getElementById('gbImageColor').value = comp.imageColor || '#ffffff';
  document.getElementById('gbUseImageBackColor').checked = Boolean(comp.useImageBackColor);
  document.getElementById('gbImageBackColor').value = comp.imageBackColor || '#001C38';
  document.getElementById('gbImageBlink').checked = Boolean(comp.imageBlink);
  document.getElementById('gbImageScaled').checked = Boolean(comp.imageScaled);
  document.querySelector(`#gotoButtonForm input[name="gbImageAlign"][value="${comp.imageAlignment || 'middleCenter'}"]`)?.click();
  document.getElementById('gbDisplayNameTag').value = comp.displayNameTag || '';
  document.getElementById('gbDisplayTopTag').value = comp.displayTopTag || '';
  document.getElementById('gbDisplayLeftTag').value = comp.displayLeftTag || '';
  document.getElementById('gbHeight').value = comp.height ?? 35;
  document.getElementById('gbWidth').value = comp.width ?? 66;
  document.getElementById('gbTop').value = comp.top ?? 75;
  document.getElementById('gbLeft').value = comp.left ?? 8;
  document.getElementById('gbName').value = comp.name || 'GotoDisplayButton1';
  document.getElementById('gbVisible').checked = comp.visible !== false;
  syncGotoButtonLabelFields();
  syncGotoButtonGeneralFields();
}

function validateGotoButton(comp) {
  if (comp.useVariableDisplay) {
    if (!comp.displayNameTag) {
      setStatus('Enter a Display Name tag on the Connections tab');
      switchGotoButtonTab('connections');
      return false;
    }
    return true;
  }
  if (!comp.target) {
    setStatus('Enter a display name on the General tab');
    switchGotoButtonTab('general');
    return false;
  }
  return true;
}

function readGotoButtonForm() {
  const alignment = document.querySelector('#gotoButtonForm input[name="gbAlign"]:checked')?.value || 'middleCenter';
  const caption = document.getElementById('gbCaption').value;
  const useBorderColor = document.getElementById('gbUseBorderColor').checked;
  const foreColor = normalizeGotoCaptionColor(useBorderColor, document.getElementById('gbCaptionColor').value);
  return {
    type: 'GotoButton',
    name: document.getElementById('gbName').value.trim() || 'GotoDisplayButton1',
    target: document.getElementById('gbTarget').value.trim(),
    label: caption,
    caption,
    left: Number(document.getElementById('gbLeft').value) || 0,
    top: Number(document.getElementById('gbTop').value) || 0,
    width: Number(document.getElementById('gbWidth').value) || 66,
    height: Number(document.getElementById('gbHeight').value) || 35,
    visible: document.getElementById('gbVisible').checked,
    borderStyle: document.getElementById('gbBorderStyle').value,
    borderWidth: Number(document.getElementById('gbBorderWidth').value) || 3,
    borderUsesBackColor: document.getElementById('gbBorderUsesBackColor').checked,
    useBackColor: document.getElementById('gbUseBackColor').checked,
    backColor: document.getElementById('gbBackColor').value,
    useBorderColor,
    borderColor: document.getElementById('gbBorderColor').value,
    usePatternColor: document.getElementById('gbUsePatternColor').checked,
    patternColor: document.getElementById('gbPatternColor').value,
    useHighlightColor: document.getElementById('gbUseHighlightColor').checked,
    highlightColor: document.getElementById('gbHighlightColor').value,
    backStyle: document.getElementById('gbBackStyle').value,
    patternStyle: document.getElementById('gbPatternStyle').value,
    shape: document.getElementById('gbShape').value,
    blink: document.getElementById('gbBlink').checked,
    useVariableDisplay: document.getElementById('gbUseVariableDisplay').checked,
    displayNameTag: document.getElementById('gbDisplayNameTag').value.trim(),
    displayTopTag: document.getElementById('gbDisplayTopTag').value.trim(),
    displayLeftTag: document.getElementById('gbDisplayLeftTag').value.trim(),
    parameterType: document.querySelector('#gotoButtonForm input[name="gbParameterType"]:checked')?.value || 'file',
    parameterFile: document.getElementById('gbParameterFile').value.trim(),
    parameterList: document.getElementById('gbParameterList').value.trim(),
    displayPosition: document.getElementById('gbDisplayPosition').checked,
    displayTop: Number(document.getElementById('gbDisplayTop').value) || 0,
    displayLeft: Number(document.getElementById('gbDisplayLeft').value) || 0,
    useVariableDisplayPosition: document.getElementById('gbUseVariableDisplayPosition').checked,
    horizontalMargin: Number(document.getElementById('gbHorizontalMargin').value) || 0,
    verticalMargin: Number(document.getElementById('gbVerticalMargin').value) || 0,
    audio: document.getElementById('gbAudio').checked,
    fontFamily: document.getElementById('gbFont').value,
    fontSize: Number(document.getElementById('gbFontSize').value) || 10,
    bold: document.getElementById('gbBold').classList.contains('active'),
    italic: document.getElementById('gbItalic').classList.contains('active'),
    underline: document.getElementById('gbUnderline').classList.contains('active'),
    foreColor,
    useForeColor: document.getElementById('gbUseCaptionColor').checked,
    useCaptionColor: document.getElementById('gbUseCaptionColor').checked,
    useCaptionBackColor: document.getElementById('gbUseCaptionBackColor').checked,
    captionBackColor: document.getElementById('gbCaptionBackColor').value,
    captionBlink: document.getElementById('gbCaptionBlink').checked,
    captionBackStyle: document.getElementById('gbCaptionBackStyle').value,
    wordWrap: document.getElementById('gbWordWrap').checked,
    alignment,
    image: document.getElementById('gbImage').value.trim() || undefined,
    imageBackStyle: document.getElementById('gbImageBackStyle').value,
    useImageColor: document.getElementById('gbUseImageColor').checked,
    imageColor: document.getElementById('gbImageColor').value,
    useImageBackColor: document.getElementById('gbUseImageBackColor').checked,
    imageBackColor: document.getElementById('gbImageBackColor').value,
    imageBlink: document.getElementById('gbImageBlink').checked,
    imageScaled: document.getElementById('gbImageScaled').checked,
    imageAlignment: document.querySelector('#gotoButtonForm input[name="gbImageAlign"]:checked')?.value || 'middleCenter'
  };
}

async function applyGotoButton() {
  const comp = readGotoButtonForm();
  if (!validateGotoButton(comp)) return;
  await upsertCanvasComponent(comp);
  commitPropsSnapshot(readGotoButtonForm, 'applyGotoButton');
  state.canvasSelection.indices = [state.propsDialog.editIndex];
  setStatus(`Applied ${comp.name} on ${state.selectedScreenId}`);
}

async function saveGotoButton(e) {
  e.preventDefault();
  const comp = readGotoButtonForm();
  if (!validateGotoButton(comp)) return;
  await upsertCanvasComponent(comp);
  document.getElementById('gotoButtonDialog').close();
  state.canvasSelection.indices = [state.propsDialog.editIndex];
  clearPropsDialogState();
  activateSelectTool(`Added ${comp.name} to ${state.selectedScreenId}`);
}

function initGotoButtonDialog() {
  document.getElementById('gotoButtonForm')?.addEventListener('submit', (e) => {
    saveGotoButton(e).catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('applyGotoButton')?.addEventListener('click', () => {
    applyGotoButton().catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('gotoButtonForm')?.addEventListener('input', () => {
    updatePropsApplyButton(readGotoButtonForm, 'applyGotoButton');
  });
  document.getElementById('gotoButtonForm')?.addEventListener('change', () => {
    updatePropsApplyButton(readGotoButtonForm, 'applyGotoButton');
  });
  document.getElementById('cancelGotoButton')?.addEventListener('click', () => {
    document.getElementById('gotoButtonDialog')?.close();
  });
  document.getElementById('gotoButtonDialog')?.addEventListener('close', () => {
    if (state.propsDialog.kind === 'goto') clearPropsDialogState();
  });
  document.getElementById('helpGotoButton')?.addEventListener('click', () => {
    alert('Goto Display Button navigates to another display when pressed — matching FactoryTalk View goto buttons.');
  });
  document.querySelectorAll('#gotoButtonDialog .dialog-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchGotoButtonTab(tab.dataset.gbTab));
  });
  document.getElementById('gbUseCaptionColor')?.addEventListener('change', () => {
    syncGotoButtonLabelFields();
    updatePropsApplyButton(readGotoButtonForm, 'applyGotoButton');
  });
  document.getElementById('gbUseCaptionBackColor')?.addEventListener('change', () => {
    syncGotoButtonLabelFields();
    updatePropsApplyButton(readGotoButtonForm, 'applyGotoButton');
  });
  for (const id of ['gbUseImageColor', 'gbUseImageBackColor']) {
    document.getElementById(id)?.addEventListener('change', () => {
      syncGotoButtonLabelFields();
      updatePropsApplyButton(readGotoButtonForm, 'applyGotoButton');
    });
  }
  for (const id of ['gbBold', 'gbItalic', 'gbUnderline']) {
    document.getElementById(id)?.addEventListener('click', (e) => {
      e.preventDefault();
      e.currentTarget.classList.toggle('active');
      updatePropsApplyButton(readGotoButtonForm, 'applyGotoButton');
    });
  }
  document.getElementById('gbBrowseImage')?.addEventListener('click', () => {
    showImageBrowserDialog({ selectedFileName: document.getElementById('gbImage').value || null })
      .then((fileName) => {
        if (fileName) {
          document.getElementById('gbImage').value = fileName;
          updatePropsApplyButton(readGotoButtonForm, 'applyGotoButton');
        }
      })
      .catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('gbBrowseDisplay')?.addEventListener('click', () => {
    showDisplayPickerDialog(document.getElementById('gbTarget').value || '')
      .then((screenId) => {
        if (screenId) {
          document.getElementById('gbTarget').value = screenId;
          updatePropsApplyButton(readGotoButtonForm, 'applyGotoButton');
        }
      })
      .catch((err) => setStatus(`Error: ${err.message}`));
  });
  for (const id of [
    'gbBorderUsesBackColor', 'gbUseBackColor', 'gbUseBorderColor', 'gbUsePatternColor',
    'gbUseHighlightColor', 'gbUseVariableDisplay', 'gbDisplayPosition'
  ]) {
    document.getElementById(id)?.addEventListener('change', () => {
      syncGotoButtonGeneralFields();
      updatePropsApplyButton(readGotoButtonForm, 'applyGotoButton');
    });
  }
  document.querySelectorAll('#gotoButtonForm input[name="gbParameterType"]').forEach((el) => {
    el.addEventListener('change', () => {
      syncGotoButtonGeneralFields();
      updatePropsApplyButton(readGotoButtonForm, 'applyGotoButton');
    });
  });
}

function nextImageObjectName(components) {
  const n = countComponentsByType(components, 'Image') + 1;
  return `Image${n}`;
}

function defaultImageComponent(overrides = {}) {
  return {
    type: 'Image',
    name: 'Image1',
    image: '',
    left: 100,
    top: 100,
    width: 64,
    height: 64,
    visible: true,
    backStyle: 'transparent',
    useImageColor: false,
    imageColor: '#000080',
    useBackColor: false,
    backColor: '#c0c0c0',
    ...overrides
  };
}

async function fetchProjectImages() {
  if (!state.activeProject) return [];
  return fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/images`);
}

function projectImageUrl(fileName) {
  return `/projects/${encodeURIComponent(state.activeProject)}/Images/${encodeURIComponent(fileName)}`;
}

let imageBrowserResolve = null;

function renderImageBrowserList(filterText = '') {
  const list = document.getElementById('imageBrowserList');
  if (!list) return;
  const needle = filterText.trim().toLowerCase();
  const images = (state.imageBrowserCache || []).filter((img) =>
    !needle || img.label.toLowerCase().includes(needle) || img.fileName.toLowerCase().includes(needle)
  );
  list.innerHTML = images.map((img) =>
    `<option value="${escapeHtml(img.fileName)}">${escapeHtml(img.label || img.fileName)}</option>`
  ).join('');
  if (state.imageBrowserSelected && images.some((img) => img.fileName === state.imageBrowserSelected)) {
    list.value = state.imageBrowserSelected;
  } else if (images.length) {
    list.selectedIndex = 0;
    state.imageBrowserSelected = list.value;
  } else {
    state.imageBrowserSelected = null;
  }
  updateImageBrowserSelection();
}

async function updateImageBrowserSelection() {
  const list = document.getElementById('imageBrowserList');
  const okBtn = document.getElementById('imageBrowserOk');
  const deleteBtn = document.getElementById('imageBrowserDelete');
  const preview = document.getElementById('imageBrowserPreview');
  const fileName = list?.value || null;
  state.imageBrowserSelected = fileName;
  okBtn.disabled = !fileName;
  deleteBtn.disabled = !fileName;

  if (!fileName || !state.activeProject) {
    preview?.removeAttribute('src');
    document.getElementById('imageBrowserType').textContent = '—';
    document.getElementById('imageBrowserSize').textContent = '—';
    document.getElementById('imageBrowserFormat').textContent = '—';
    return;
  }

  preview.src = projectImageUrl(fileName);
  try {
    const info = await fetchJson(
      `/api/projects/${encodeURIComponent(state.activeProject)}/images/${encodeURIComponent(fileName)}/info`
    );
    document.getElementById('imageBrowserType').textContent = info.kind || info.type || 'True color';
    document.getElementById('imageBrowserSize').textContent = `${info.width || 0} x ${info.height || 0}`;
    document.getElementById('imageBrowserFormat').textContent = info.format || '—';
  } catch {
    document.getElementById('imageBrowserType').textContent = '—';
    document.getElementById('imageBrowserSize').textContent = '—';
    document.getElementById('imageBrowserFormat').textContent = '—';
  }
}

function closeImageBrowser(result) {
  document.getElementById('imageBrowserDialog')?.close();
  if (imageBrowserResolve) {
    imageBrowserResolve(result);
    imageBrowserResolve = null;
  }
}

async function showImageBrowserDialog(options = {}) {
  if (!state.activeProject) {
    setStatus('Open a project first');
    return null;
  }
  state.imageBrowserCache = await fetchProjectImages();
  state.imageBrowserSelected = options.selectedFileName || null;
  document.getElementById('imageBrowserFilter').value = '';
  renderImageBrowserList('');
  return new Promise((resolve) => {
    imageBrowserResolve = resolve;
    document.getElementById('imageBrowserDialog')?.showModal();
  });
}

function switchCanvasImagePropertiesTab(tabId) {
  document.querySelectorAll('#canvasImagePropertiesDialog .dialog-tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.ciTab === tabId);
  });
  document.querySelectorAll('#canvasImagePropertiesDialog .dialog-tab-panel').forEach((el) => {
    el.classList.toggle('active', el.dataset.ciTabPanel === tabId);
  });
}

function syncCanvasImageColorFields() {
  document.getElementById('canvasImageColor').disabled = !document.getElementById('canvasImageUseColor').checked;
  const solid = document.getElementById('canvasImageBackStyle').value === 'solid';
  document.getElementById('canvasImageUseBackColor').disabled = !solid;
  document.getElementById('canvasImageBackColor').disabled = !solid || !document.getElementById('canvasImageUseBackColor').checked;
}

function fillCanvasImagePropertiesForm(comp) {
  document.getElementById('canvasImageFile').value = comp.image || '';
  document.getElementById('canvasImageBackStyle').value = comp.backStyle || 'transparent';
  document.getElementById('canvasImageUseColor').checked = Boolean(comp.useImageColor);
  document.getElementById('canvasImageColor').value = comp.imageColor || '#000080';
  document.getElementById('canvasImageUseBackColor').checked = Boolean(comp.useBackColor);
  document.getElementById('canvasImageBackColor').value = comp.backColor || '#c0c0c0';
  document.getElementById('canvasImageHeight').value = comp.height ?? 64;
  document.getElementById('canvasImageWidth').value = comp.width ?? 64;
  document.getElementById('canvasImageTop').value = comp.top ?? 0;
  document.getElementById('canvasImageLeft').value = comp.left ?? 0;
  document.getElementById('canvasImageName').value = comp.name || 'Image1';
  document.getElementById('canvasImageVisible').checked = comp.visible !== false;
  syncCanvasImageColorFields();
}

function readCanvasImagePropertiesForm() {
  return {
    type: 'Image',
    name: document.getElementById('canvasImageName').value.trim() || 'Image1',
    image: document.getElementById('canvasImageFile').value.trim(),
    left: Number(document.getElementById('canvasImageLeft').value) || 0,
    top: Number(document.getElementById('canvasImageTop').value) || 0,
    width: Number(document.getElementById('canvasImageWidth').value) || 64,
    height: Number(document.getElementById('canvasImageHeight').value) || 64,
    visible: document.getElementById('canvasImageVisible').checked,
    backStyle: document.getElementById('canvasImageBackStyle').value,
    useImageColor: document.getElementById('canvasImageUseColor').checked,
    imageColor: document.getElementById('canvasImageColor').value,
    useBackColor: document.getElementById('canvasImageUseBackColor').checked,
    backColor: document.getElementById('canvasImageBackColor').value
  };
}

async function showCanvasImagePropertiesDialog(imageDefaults = {}) {
  if (!displayIsOpen()) {
    setStatus('Open a display or global object first, then choose Image from Objects');
    return;
  }
  const canvas = await fetchOpenCanvas();
  const comp = defaultImageComponent({
    name: nextImageObjectName(canvas.components || []),
    ...imageDefaults
  });
  fillCanvasImagePropertiesForm(comp);
  resetPropsDialogState('image', readCanvasImagePropertiesForm, 'applyCanvasImageProperties');
  switchCanvasImagePropertiesTab('general');
  document.getElementById('canvasImagePropertiesDialog')?.showModal();
}

async function applyCanvasImageProperties() {
  const comp = readCanvasImagePropertiesForm();
  if (!comp.image) {
    setStatus('Select an image on the General tab');
    switchCanvasImagePropertiesTab('general');
    return;
  }
  await upsertCanvasComponent(comp);
  commitPropsSnapshot(readCanvasImagePropertiesForm, 'applyCanvasImageProperties');
  state.canvasSelection.indices = [state.propsDialog.editIndex];
  setStatus(`Applied ${comp.name} on ${state.selectedScreenId}`);
}

async function saveCanvasImageProperties(e) {
  e.preventDefault();
  const comp = readCanvasImagePropertiesForm();
  if (!comp.image) {
    setStatus('Select an image on the General tab');
    switchCanvasImagePropertiesTab('general');
    return;
  }
  await upsertCanvasComponent(comp);
  document.getElementById('canvasImagePropertiesDialog').close();
  state.canvasSelection.indices = [state.propsDialog.editIndex];
  clearPropsDialogState();
  activateSelectTool(`Added ${comp.name} to ${state.selectedScreenId}`);
}

function initImageBrowserDialog() {
  document.getElementById('imageBrowserFilter')?.addEventListener('input', (e) => {
    renderImageBrowserList(e.target.value);
  });
  document.getElementById('imageBrowserList')?.addEventListener('change', () => {
    updateImageBrowserSelection();
  });
  document.getElementById('imageBrowserList')?.addEventListener('dblclick', () => {
    if (state.imageBrowserSelected) closeImageBrowser(state.imageBrowserSelected);
  });
  document.getElementById('imageBrowserOk')?.addEventListener('click', () => {
    closeImageBrowser(state.imageBrowserSelected || null);
  });
  document.getElementById('imageBrowserCancel')?.addEventListener('click', () => {
    closeImageBrowser(null);
  });
  document.getElementById('imageBrowserHelp')?.addEventListener('click', () => {
    alert('Image Browser lists images stored under Graphics → Images. Select an image and click OK.');
  });
  document.getElementById('imageBrowserAddFile')?.addEventListener('click', async () => {
    const uploaded = await importProjectImage();
    state.imageBrowserCache = await fetchProjectImages();
    renderImageBrowserList(document.getElementById('imageBrowserFilter')?.value || '');
    if (uploaded) {
      document.getElementById('imageBrowserList').value = uploaded;
      state.imageBrowserSelected = uploaded;
    }
    updateImageBrowserSelection();
  });
  document.getElementById('imageBrowserDelete')?.addEventListener('click', async () => {
    const fileName = state.imageBrowserSelected;
    if (!fileName || !confirm(`Delete image "${fileName}" from this project?`)) return;
    try {
      await fetchJson(
        `/api/projects/${encodeURIComponent(state.activeProject)}/images/${encodeURIComponent(fileName)}`,
        { method: 'DELETE' }
      );
      state.imageBrowserCache = await fetchProjectImages();
      state.imageBrowserSelected = null;
      renderImageBrowserList(document.getElementById('imageBrowserFilter')?.value || '');
      await loadExplorer(state.activeProject);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  });
  document.getElementById('imageBrowserDialog')?.addEventListener('close', () => {
    if (imageBrowserResolve) closeImageBrowser(null);
  });
}

function initCanvasImagePropertiesDialog() {
  document.getElementById('canvasImagePropertiesForm')?.addEventListener('submit', (e) => {
    saveCanvasImageProperties(e).catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('applyCanvasImageProperties')?.addEventListener('click', () => {
    applyCanvasImageProperties().catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('canvasImagePropertiesForm')?.addEventListener('input', () => {
    updatePropsApplyButton(readCanvasImagePropertiesForm, 'applyCanvasImageProperties');
  });
  document.getElementById('canvasImagePropertiesForm')?.addEventListener('change', () => {
    updatePropsApplyButton(readCanvasImagePropertiesForm, 'applyCanvasImageProperties');
  });
  document.getElementById('cancelCanvasImageProperties')?.addEventListener('click', () => {
    document.getElementById('canvasImagePropertiesDialog')?.close();
    clearPropsDialogState();
    activateSelectTool('Placement cancelled');
  });
  document.getElementById('canvasImagePropertiesDialog')?.addEventListener('close', () => {
    if (state.placement) activateSelectTool();
  });
  document.getElementById('helpCanvasImageProperties')?.addEventListener('click', () => {
    alert('Image Properties define the bitmap, back style, colors, size, and position — matching FactoryTalk View image objects.');
  });
  document.querySelectorAll('#canvasImagePropertiesDialog .dialog-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchCanvasImagePropertiesTab(tab.dataset.ciTab));
  });
  ['canvasImageUseColor', 'canvasImageUseBackColor'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => {
      syncCanvasImageColorFields();
      updatePropsApplyButton(readCanvasImagePropertiesForm, 'applyCanvasImageProperties');
    });
  });
  document.getElementById('canvasImageBackStyle')?.addEventListener('change', () => {
    syncCanvasImageColorFields();
    updatePropsApplyButton(readCanvasImagePropertiesForm, 'applyCanvasImageProperties');
  });
  document.getElementById('canvasImageBrowse')?.addEventListener('click', async () => {
    const current = document.getElementById('canvasImageFile').value.trim();
    const picked = await showImageBrowserDialog({ selectedFileName: current || null });
    if (!picked) return;
    document.getElementById('canvasImageFile').value = picked;
    updatePropsApplyButton(readCanvasImagePropertiesForm, 'applyCanvasImageProperties');
  });
}

function getCanvasPoint(clientX, clientY) {
  const wrap = previewCanvasWrap;
  if (!wrap) return { x: 0, y: 0 };
  const rect = wrap.getBoundingClientRect();
  const logicalW = state.previewCanvas.width || rect.width;
  const logicalH = state.previewCanvas.height || rect.height;
  const x = ((clientX - rect.left) / Math.max(rect.width, 1)) * logicalW;
  const y = ((clientY - rect.top) / Math.max(rect.height, 1)) * logicalH;
  return { x, y };
}

function snapCanvasValue(value, axis) {
  if (!state.viewPrefs?.snapOn) return Math.round(value);
  const grid = axis === 'x'
    ? (state.viewPrefs.gridSizeX || state.viewPrefs.gridSize || 10)
    : (state.viewPrefs.gridSizeY || state.viewPrefs.gridSize || 10);
  return Math.round(value / grid) * grid;
}

function normalizePlacementRect(x1, y1, x2, y2, minWidth = 24, minHeight = 16) {
  const canvasW = state.previewCanvas.width || 800;
  const canvasH = state.previewCanvas.height || 600;
  let left = snapCanvasValue(Math.min(x1, x2), 'x');
  let top = snapCanvasValue(Math.min(y1, y2), 'y');
  let right = snapCanvasValue(Math.max(x1, x2), 'x');
  let bottom = snapCanvasValue(Math.max(y1, y2), 'y');
  let width = right - left;
  let height = bottom - top;
  if (width < minWidth) width = minWidth;
  if (height < minHeight) height = minHeight;
  left = Math.max(0, Math.min(left, canvasW - width));
  top = Math.max(0, Math.min(top, canvasH - height));
  return { left, top, width, height };
}

function updatePlacementRubberband(rect) {
  if (!placementRubberband || !rect) return;
  placementRubberband.classList.remove('hidden');
  placementRubberband.classList.toggle('image-preview', state.placement?.kind === 'image');
  placementRubberband.style.left = `${rect.left}px`;
  placementRubberband.style.top = `${rect.top}px`;
  placementRubberband.style.width = `${rect.width}px`;
  placementRubberband.style.height = `${rect.height}px`;
}

function hideFreehandStrokePreview() {
  if (!freehandStrokePreview) return;
  freehandStrokePreview.classList.add('hidden');
  freehandStrokePreview.setAttribute('aria-hidden', 'true');
  freehandStrokePreview.innerHTML = '';
}

function freehandPreviewDashAttr(lineStyle, lineWidth) {
  const w = Math.max(1, Number(lineWidth) || 1);
  if (lineStyle === 'dash') return ` stroke-dasharray="${w * 8},${w * 4}"`;
  if (lineStyle === 'dot') return ` stroke-dasharray="${w},${w * 3}"`;
  if (lineStyle === 'dashDot') return ` stroke-dasharray="${w * 8},${w * 4},${w},${w * 4}"`;
  if (lineStyle === 'dashDotDot') return ` stroke-dasharray="${w * 8},${w * 4},${w},${w * 4},${w},${w * 4}"`;
  return '';
}

function freehandPreviewPathAbsolute(comp) {
  const points = comp?.points || [];
  if (points.length < 2) return '';
  const left = comp.left || 0;
  const top = comp.top || 0;
  const close = comp.backStyle === 'solid' || comp.backStyle === 'gradient';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${left + p.x} ${top + p.y}`).join(' ')
    + (close && points.length > 2 ? ' Z' : '');
}

function patchFreehandBounds(comp, bounds) {
  if (!comp?.points?.length) return { ...bounds };
  const oldW = comp.width || 1;
  const oldH = comp.height || 1;
  const newW = bounds.width ?? comp.width ?? oldW;
  const newH = bounds.height ?? comp.height ?? oldH;
  const patch = { ...bounds };
  if (bounds.width != null || bounds.height != null) {
    const sx = newW / oldW;
    const sy = newH / oldH;
    if (Math.abs(sx - 1) > 0.0001 || Math.abs(sy - 1) > 0.0001) {
      patch.points = comp.points.map((p) => ({ x: p.x * sx, y: p.y * sy }));
    }
  }
  return patch;
}

function updateFreehandStudioPreview(comp) {
  if (!freehandStrokePreview || !comp?.points?.length || comp.points.length < 2 || comp.visible === false) {
    hideFreehandStrokePreview();
    return;
  }
  const w = state.previewCanvas.width || 800;
  const h = state.previewCanvas.height || 600;
  const d = freehandPreviewPathAbsolute(comp);
  if (!d) {
    hideFreehandStrokePreview();
    return;
  }
  freehandStrokePreview.classList.remove('hidden');
  freehandStrokePreview.setAttribute('aria-hidden', 'false');
  freehandStrokePreview.setAttribute('viewBox', `0 0 ${w} ${h}`);
  freehandStrokePreview.setAttribute('width', '100%');
  freehandStrokePreview.setAttribute('height', '100%');
  const useBack = comp.useBackColor !== false && comp.backStyle !== 'transparent';
  const fill = useBack && (comp.backStyle === 'solid' || comp.backStyle === 'gradient')
    ? (comp.backColor || '#808080')
    : 'none';
  const lineStyle = comp.lineStyle || 'solid';
  const lineW = comp.lineWidth ?? 1;
  const useFore = comp.useForeColor !== false && lineStyle !== 'none' && lineW > 0;
  const stroke = useFore ? (comp.foreColor || '#000000') : 'none';
  const dash = useFore ? freehandPreviewDashAttr(lineStyle, lineW) : '';
  freehandStrokePreview.innerHTML =
    `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${lineW}"` +
    ` stroke-linecap="round" stroke-linejoin="round" fill-rule="evenodd"${dash}/>`;
}

function updateFreehandStrokePreview(points) {
  if (!freehandStrokePreview || !points?.length) return;
  const w = state.previewCanvas.width || 800;
  const h = state.previewCanvas.height || 600;
  freehandStrokePreview.classList.remove('hidden');
  freehandStrokePreview.setAttribute('aria-hidden', 'false');
  freehandStrokePreview.setAttribute('viewBox', `0 0 ${w} ${h}`);
  freehandStrokePreview.setAttribute('width', '100%');
  freehandStrokePreview.setAttribute('height', '100%');
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  freehandStrokePreview.innerHTML = `<path d="${d}" fill="none" stroke="#000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function boundsFromFreehandPoints(points, pad = 2) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const width = Math.max(8, maxX - minX + pad * 2);
  const height = Math.max(8, maxY - minY + pad * 2);
  const normalized = points.map((p) => ({ x: p.x - left, y: p.y - top }));
  return { left, top, width, height, points: normalized };
}

async function completeFreehandDrawing(canvasPoints) {
  const placement = state.placement;
  if (!placement || placement.kind !== 'freehand') return;
  hideFreehandStrokePreview();
  objectPlacementOverlay?.classList.add('hidden');
  previewCanvasWrap?.classList.remove('placement-active');
  state.placement = null;

  if (!canvasPoints || canvasPoints.length < 2) {
    activateSelectTool('Freehand cancelled — draw at least two points');
    return;
  }

  try {
    const bounds = boundsFromFreehandPoints(canvasPoints, 2);
    const canvas = await fetchOpenCanvas();
    const comp = defaultFreehandComponent({
      ...placement.defaults,
      ...bounds,
      name: nextShapeObjectName(canvas.components, 'Freehand', 'Freehand')
    });
    window.StudioFreehandProperties?.openFreehandPropertiesDialog(comp, null, null);
  } catch (err) {
    activateSelectTool(`Error: ${err.message}`);
  }
}

function hidePlacementRubberband() {
  placementRubberband?.classList.add('hidden');
  placementRubberband?.classList.remove('image-preview');
}

function startObjectPlacement(kind, defaults = {}) {
  if (!displayIsOpen()) {
    setStatus('Open a display or global object first, then choose an object to add');
    return;
  }
  state.placement = { kind, defaults, dragging: false, start: null };
  objectPlacementOverlay?.classList.remove('hidden', 'tool-text', 'tool-momentary', 'tool-image', 'tool-freehand');
  if (kind === 'text') objectPlacementOverlay?.classList.add('tool-text');
  else if (kind === 'image') objectPlacementOverlay?.classList.add('tool-image');
  else if (kind === 'string-display') objectPlacementOverlay?.classList.add('tool-text');
  else if (kind === 'freehand') objectPlacementOverlay?.classList.add('tool-freehand');
  else objectPlacementOverlay?.classList.add('tool-momentary');
  objectPlacementOverlay?.setAttribute('aria-hidden', 'false');
  previewCanvasWrap?.classList.add('placement-active');
  hidePlacementRubberband();
  if (kind === 'text') {
    setStatus('Drag on the display to draw a text box (Esc to cancel)');
  } else if (kind === 'image') {
    setStatus('Drag on the display to draw an image box (Esc to cancel)');
  } else if (kind === 'string-display') {
    setStatus('Drag on the display to draw a string display box (Esc to cancel)');
  } else if (kind === 'rectangle') {
    setStatus('Drag on the display to draw a rectangle (Esc to cancel)');
  } else if (kind === 'ellipse') {
    setStatus('Drag on the display to draw an ellipse (Esc to cancel)');
  } else if (kind === 'panel') {
    setStatus('Drag on the display to draw a panel (Esc to cancel)');
  } else if (kind === 'arc') {
    setStatus('Drag on the display to draw an arc (Esc to cancel)');
  } else if (kind === 'freehand') {
    setStatus('Draw on the display with the mouse (Esc to cancel)');
  } else {
    setStatus('Drag on the display to draw a button (Esc to cancel)');
  }
}

function cancelObjectPlacement() {
  state.placement = null;
  objectPlacementOverlay?.classList.add('hidden');
  objectPlacementOverlay?.classList.remove('tool-text', 'tool-momentary', 'tool-image', 'tool-freehand');
  objectPlacementOverlay?.setAttribute('aria-hidden', 'true');
  previewCanvasWrap?.classList.remove('placement-active');
  hidePlacementRubberband();
  hideFreehandStrokePreview();
}

function activateSelectTool(statusMessage) {
  state.activeObjectTool = 'select';
  updateObjectsMenuChecks();
  cancelObjectPlacement();
  previewCanvasWrap?.classList.add('studio-edit-mode');
  scheduleRefreshCanvasEditOverlay();
  if (statusMessage) setStatus(statusMessage);
}

async function completeObjectPlacement(rect) {
  const placement = state.placement;
  if (!placement) return;
  const bounds = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  const defaults = { ...placement.defaults, ...bounds };
  const kind = placement.kind;
  hidePlacementRubberband();
  objectPlacementOverlay?.classList.add('hidden');
  previewCanvasWrap?.classList.remove('placement-active');

  try {
    if (kind === 'text') {
      await showTextPropertiesDialog(defaults);
    } else if (kind === 'numeric') {
      await window.StudioNumericDisplay?.showNumericDisplayDialog(defaults);
    } else if (kind === 'string-display') {
      await window.StudioStringDisplay?.showStringDisplayDialog(defaults);
    } else if (kind === 'string-input') {
      await window.StudioStringInput?.showStringInputDialog(defaults);
    } else if (kind === 'numeric-input') {
      await window.StudioNumericInput?.showNumericInputDialog(defaults);
    } else if (kind === 'numeric-input-cursor') {
      await window.StudioNumericInput?.showNumericInputCursorDialog(defaults);
    } else if (kind === 'momentary') {
      await showMomentaryButtonDialog(defaults);
    } else if (kind === 'maintained') {
      await showMaintainedButtonDialog(defaults);
    } else if (kind === 'latched') {
      if (!displayIsOpen()) {
        setStatus('Open a display or global object first');
        return;
      }
      await window.StudioLatchedMultistate?.showLatchedButtonDialog(defaults);
    } else if (kind === 'multistate') {
      if (!displayIsOpen()) {
        setStatus('Open a display or global object first');
        return;
      }
      await window.StudioLatchedMultistate?.showMultistateButtonDialog(defaults);
    } else if (kind === 'interlocked') {
      await window.StudioLatchedMultistate?.showInterlockedButtonDialog(defaults);
    } else if (kind === 'ramp') {
      await window.StudioLatchedMultistate?.showRampButtonDialog(defaults);
    } else if (kind === 'display-list') {
      await window.StudioDisplayListSelector?.showDisplayListSelectorDialog(defaults);
    } else if (kind === 'multistate-indicator') {
      await window.StudioMultistateIndicator?.showMultistateIndicatorDialog(defaults);
    } else if (kind === 'time-date') {
      await window.StudioTimeDateDisplay?.showTimeDateDisplayDialog(defaults);
    } else if (kind === 'symbol-indicator') {
      const fileName = await showImageBrowserDialog();
      if (!fileName) {
        activateSelectTool('Symbol placement cancelled');
        return;
      }
      const states = window.StudioSymbolIndicator?.defaultSymbolIndicatorStates(defaults.numberOfStates ?? 2, fileName);
      await window.StudioSymbolIndicator?.showSymbolIndicatorDialog({ ...defaults, states, initialImage: fileName });
    } else if (kind === 'list-indicator') {
      await window.StudioListIndicator?.showListIndicatorDialog(defaults);
    } else if (kind === 'bar-graph') {
      await window.StudioBarGraph?.showBarGraphDialog(defaults);
    } else if (kind === 'recipeplus-button') {
      await window.StudioRecipePlusButton?.showRecipePlusButtonDialog(defaults);
    } else if (kind === 'recipeplus-selector') {
      await window.StudioRecipePlusSelector?.showRecipePlusSelectorDialog(defaults);
    } else if (kind === 'image') {
      const fileName = await showImageBrowserDialog();
      if (!fileName) {
        activateSelectTool('Image placement cancelled');
        return;
      }
      await showCanvasImagePropertiesDialog({ ...defaults, image: fileName });
    } else if (kind === 'rectangle') {
      const canvas = await fetchOpenCanvas();
      const comp = defaultRectangleComponent({
        ...defaults,
        name: nextShapeObjectName(canvas.components, 'Rectangle', 'Polygon')
      });
      window.StudioShapeProperties?.openShapePropertiesDialog(comp, null, null);
    } else if (kind === 'ellipse') {
      const canvas = await fetchOpenCanvas();
      const comp = defaultEllipseComponent({
        ...defaults,
        name: nextShapeObjectName(canvas.components, 'Ellipse', 'Ellipse')
      });
      window.StudioEllipseProperties?.openEllipsePropertiesDialog(comp, null, null);
    } else if (kind === 'panel') {
      const canvas = await fetchOpenCanvas();
      const comp = defaultPanelComponent({
        ...defaults,
        name: nextShapeObjectName(canvas.components, 'Panel', 'Panel')
      });
      window.StudioPanelProperties?.openPanelPropertiesDialog(comp, null, null);
    } else if (kind === 'arc') {
      const canvas = await fetchOpenCanvas();
      const comp = defaultArcComponent({
        ...defaults,
        name: nextShapeObjectName(canvas.components, 'Arc', 'Arc')
      });
      window.StudioArcProperties?.openArcPropertiesDialog(comp, null, null);
    }
  } catch (err) {
    cancelObjectPlacement();
    setStatus(`Error: ${err.message}`);
  }
}

function initObjectPlacement() {
  if (!objectPlacementOverlay) return;

  objectPlacementOverlay.addEventListener('mousedown', (e) => {
    if (!state.placement || e.button !== 0) return;
    e.preventDefault();
    if (state.placement.kind === 'freehand') {
      const pt = getCanvasPoint(e.clientX, e.clientY);
      state.placement.drawing = true;
      state.placement.points = [pt];
      updateFreehandStrokePreview([pt]);
      return;
    }
    const start = getCanvasPoint(e.clientX, e.clientY);
    state.placement.dragging = true;
    state.placement.start = start;
    updatePlacementRubberband(normalizePlacementRect(start.x, start.y, start.x, start.y));
  });

  document.addEventListener('mousemove', (e) => {
    if (state.placement?.kind === 'freehand' && state.placement.drawing) {
      const pt = getCanvasPoint(e.clientX, e.clientY);
      const points = state.placement.points || [];
      const last = points[points.length - 1];
      if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) >= 3) {
        points.push(pt);
        state.placement.points = points;
        updateFreehandStrokePreview(points);
      }
      return;
    }
    if (!state.placement?.dragging || !state.placement.start) return;
    const current = getCanvasPoint(e.clientX, e.clientY);
    const start = state.placement.start;
    const minW = state.placement.kind === 'momentary' ? 40 : state.placement.kind === 'image' ? 32 : 24;
    const minH = state.placement.kind === 'momentary' ? 24 : state.placement.kind === 'image' ? 32 : 16;
    updatePlacementRubberband(normalizePlacementRect(start.x, start.y, current.x, current.y, minW, minH));
  });

  document.addEventListener('mouseup', (e) => {
    if (state.placement?.kind === 'freehand' && state.placement.drawing) {
      state.placement.drawing = false;
      const points = [...(state.placement.points || [])];
      completeFreehandDrawing(points).catch((err) => setStatus(`Error: ${err.message}`));
      return;
    }
    if (!state.placement?.dragging || !state.placement.start) return;
    const current = getCanvasPoint(e.clientX, e.clientY);
    const start = state.placement.start;
    state.placement.dragging = false;
    state.placement.start = null;
    const minW = state.placement.kind === 'momentary' ? 40 : state.placement.kind === 'image' ? 32 : 24;
    const minH = state.placement.kind === 'momentary' ? 24 : state.placement.kind === 'image' ? 32 : 16;
    const rect = normalizePlacementRect(start.x, start.y, current.x, current.y, minW, minH);
    completeObjectPlacement(rect).catch((err) => setStatus(`Error: ${err.message}`));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.placement && !objectPlacementOverlay?.classList.contains('hidden')) {
      activateSelectTool('Placement cancelled');
    }
  });
}

function isCanvasGraphicComponent(comp) {
  return CANVAS_GRAPHIC_TYPES.has(comp?.type) && comp.left != null && comp.top != null;
}

function listCanvasGraphicIndices(components) {
  const indices = [];
  (components || []).forEach((comp, index) => {
    if (isCanvasGraphicComponent(comp)) indices.push(index);
  });
  return indices;
}

function previewSetSelection(name) {
  return previewPost('selection', { name: name || null });
}

function clearCanvasSelection() {
  if (!getSelectedCanvasIndices().length) {
    previewSetSelection(null);
    return;
  }
  state.canvasSelection.indices = [];
  state.canvasEditDrag = null;
  state.canvasHitClick = { index: null, time: 0 };
  refreshCanvasEditOverlaySelection();
  previewSetSelection(null);
  updateEditClipboardUI();
}

function setCanvasSelection(index, options = {}) {
  if (index == null) {
    clearCanvasSelection();
    return;
  }
  const { additive = false, range = false } = options;
  let indices = getSelectedCanvasIndices();
  if (additive) {
    indices = indices.includes(index)
      ? indices.filter((i) => i !== index)
      : [...indices, index];
  } else if (range && indices.length) {
    const anchor = indices[indices.length - 1];
    const lo = Math.min(anchor, index);
    const hi = Math.max(anchor, index);
    indices = [];
    for (let i = lo; i <= hi; i += 1) indices.push(i);
  } else {
    indices = [index];
  }
  state.canvasSelection.indices = indices;
  refreshCanvasEditOverlaySelection();
  const entry = state.canvasEditCache?.editComponents?.[index];
  const comp = entry?.comp;
  previewSetSelection(comp?.name || null);
  const count = indices.length;
  setStatus(count > 1 ? `Selected ${count} objects` : `Selected ${comp?.name || comp?.type || 'object'}`);
  updateEditClipboardUI();
}

function refreshCanvasEditOverlaySelection() {
  if (!canvasEditOverlay) return;
  const selected = new Set(getSelectedCanvasIndices());
  canvasEditOverlay.querySelectorAll('.canvas-graphic-hit').forEach((el) => {
    el.classList.toggle('selected', selected.has(Number(el.dataset.index)));
  });
}

function applyGraphicBoundsStyle(el, comp) {
  el.style.left = `${comp.left ?? 0}px`;
  el.style.top = `${comp.top ?? 0}px`;
  el.style.width = `${comp.width ?? 120}px`;
  el.style.height = `${comp.height ?? 32}px`;
}

function updateCanvasEditHitBounds(name, bounds) {
  const editComponents = state.canvasEditCache?.editComponents;
  if (!editComponents?.length || !name || !bounds) return;
  const index = editComponents.findIndex((entry) => entry.comp?.name === name);
  if (index < 0) return;
  Object.assign(editComponents[index].comp, bounds);
  const hit = canvasEditOverlay?.querySelector(`.canvas-graphic-hit[data-index="${index}"]`);
  if (hit) applyGraphicBoundsStyle(hit, editComponents[index].comp);
}

function attachPreviewLoadHandler() {
  if (!previewFrame) return;
  state.previewFrameReady = false;
  previewFrame.onload = () => {
    state.previewFrameReady = true;
    if (state.pendingPreviewReloadRequest) {
      state.pendingPreviewReloadRequest = false;
      reloadDisplayPreview().catch(() => {});
      return;
    }
    scheduleRefreshCanvasEditOverlay();
  };
  previewFrame.onerror = () => {
    setStatus('Preview failed to load — check server is running (npm start)');
  };
}

let canvasOverlayRefreshTimer = null;
let canvasOverlayRefreshPending = false;

function scheduleRefreshCanvasEditOverlay() {
  if (isCanvasOverlayRefreshBlocked()) {
    canvasOverlayRefreshPending = true;
    return;
  }
  canvasOverlayRefreshPending = false;
  if (canvasOverlayRefreshTimer) clearTimeout(canvasOverlayRefreshTimer);
  canvasOverlayRefreshTimer = setTimeout(() => {
    canvasOverlayRefreshTimer = null;
    refreshCanvasEditOverlay().catch(() => {});
  }, 150);
}

function scheduleRefreshAfterDialogClose() {
  if (!canvasOverlayRefreshPending || isCanvasOverlayRefreshBlocked()) return;
  scheduleRefreshCanvasEditOverlay();
}

document.addEventListener('close', (e) => {
  if (e.target instanceof HTMLDialogElement) {
    scheduleRefreshAfterDialogClose();
  }
}, true);

async function renderCanvasEditHits(editComponents) {
  canvasEditOverlay.innerHTML = '';
  canvasEditOverlay.classList.remove('hidden');
  canvasEditOverlay.setAttribute('aria-hidden', 'false');
  previewCanvasWrap?.classList.add('select-active');

  const batchSize = 12;
  for (let start = 0; start < editComponents.length; start += batchSize) {
    const end = Math.min(start + batchSize, editComponents.length);
    for (let index = start; index < end; index += 1) {
      const { comp } = editComponents[index];
      const hit = document.createElement('div');
      hit.className = 'canvas-graphic-hit';
      hit.dataset.index = String(index);
      applyGraphicBoundsStyle(hit, comp);
      if (canvasSelectionIncludes(index)) hit.classList.add('selected');

      for (const corner of ['nw', 'ne', 'sw', 'se']) {
        const handle = document.createElement('span');
        handle.className = `resize-handle ${corner}`;
        handle.dataset.handle = corner;
        hit.appendChild(handle);
      }
      canvasEditOverlay.appendChild(hit);
    }
    if (end < editComponents.length) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }
}

async function refreshCanvasEditOverlay() {
  const placementActive = Boolean(state.placement) ||
    !objectPlacementOverlay?.classList.contains('hidden');
  if (!canvasEditOverlay || !displayIsOpen() || placementActive) {
    canvasEditOverlay?.classList.add('hidden');
    canvasEditOverlay?.setAttribute('aria-hidden', 'true');
    previewCanvasWrap?.classList.remove('select-active');
    return;
  }

  if (!state.previewFrameReady) {
    return;
  }

  if (!state.canvasEditOverlayStale &&
      state.canvasEditCache?.editComponents?.length &&
      canvasEditOverlay.querySelector('.canvas-graphic-hit')) {
    refreshCanvasEditOverlaySelection();
    return;
  }

  if (state.canvasEditOverlayRefresh) {
    return state.canvasEditOverlayRefresh;
  }

  state.canvasEditOverlayRefresh = (async () => {
    try {
      const raw = await fetchOpenCanvas();
      const editComponents = await buildCanvasEditComponents(raw);
      state.canvasEditCache = { raw, editComponents };
    } catch {
      canvasEditOverlay.classList.add('hidden');
      return;
    }

    const editComponents = state.canvasEditCache.editComponents || [];
    await renderCanvasEditHits(editComponents);
    state.canvasEditOverlayStale = false;

    const primaryIndex = getPrimaryCanvasSelectionIndex();
    if (primaryIndex != null) {
      const selectedName = editComponents[primaryIndex]?.comp?.name || null;
      previewSetSelection(selectedName);
    } else if (state.pendingGraphicSelection) {
      const pendingName = state.pendingGraphicSelection;
      state.pendingGraphicSelection = null;
      const pendingIndex = editComponents.findIndex((entry) => entry.comp?.name === pendingName);
      if (pendingIndex >= 0) setCanvasSelection(pendingIndex);
    }
  })();

  try {
    await state.canvasEditOverlayRefresh;
  } finally {
    state.canvasEditOverlayRefresh = null;
  }
}

async function updateCanvasComponentBounds(index, bounds) {
  const entry = state.canvasEditCache?.editComponents?.[index];
  if (!entry) return;

  if (entry.ref?.type === 'shell') {
    const canvas = await fetchOpenCanvas();
    const shellKey = getNavShellKey(canvas);
    if (!shellKey) return;
    let patch = { ...bounds };
    if (entry.comp?.type === 'Freehand') patch = patchFreehandBounds(entry.comp, bounds);
    const shellOverrides = {
      ...(canvas[shellKey] || {}),
      [entry.ref.name]: stripNavShellPersistFields({
        ...(canvas[shellKey]?.[entry.ref.name] || {}),
        ...patch
      })
    };
    await patchOpenCanvas({ [shellKey]: shellOverrides });
    state.canvasEditCache.raw = { ...canvas, [shellKey]: shellOverrides };
    if (entry.comp) Object.assign(entry.comp, patch);
    updateCanvasEditHitBounds(entry.comp?.name, patch);
    if (entry.comp?.type === 'Freehand') {
      await updateCanvasPreview({ name: entry.comp.name, component: { ...entry.comp }, mode: 'patch-by-name' });
    } else {
      await updateCanvasPreview({ name: entry.comp?.name, bounds: patch });
    }
    syncOpenPropsDialogBounds(entry.comp);
    scheduleRefreshCanvasEditOverlay();
    setCanvasSelection(index);
    return;
  }

  if (entry.ref?.type === 'template-override') {
    let patch = { ...bounds };
    if (entry.comp?.type === 'Freehand') patch = patchFreehandBounds(entry.comp, bounds);
    await patchTemplateOverride(entry.ref.name, patch, { mergeOnly: true });
    if (entry.comp) Object.assign(entry.comp, patch);
    updateCanvasEditHitBounds(entry.comp?.name, patch);
    if (entry.comp?.type === 'Freehand') {
      await updateCanvasPreview({ name: entry.comp.name, component: { ...entry.comp }, mode: 'patch-by-name' });
    } else {
      await updateCanvasPreview({ name: entry.comp?.name, bounds: patch });
    }
    syncOpenPropsDialogBounds(entry.comp);
    setCanvasSelection(index);
    return;
  }

  const canvas = await fetchOpenCanvas();
  const components = [...(canvas.components || [])];
  const compIndex = entry.ref?.index;
  if (compIndex == null || !components[compIndex]) return;
  let patch = { ...bounds };
  if (entry.comp?.type === 'Freehand') {
    patch = patchFreehandBounds(entry.comp, bounds);
  }
  components[compIndex] = { ...components[compIndex], ...patch };
  await patchOpenCanvas({ components });
  state.canvasEditCache.raw = { ...canvas, components };
  if (entry.comp) Object.assign(entry.comp, patch);
  updateCanvasEditHitBounds(entry.comp?.name, patch);
  if (entry.comp?.type === 'Freehand') {
    await updateCanvasPreview({ name: entry.comp.name, component: { ...entry.comp }, mode: 'patch-by-name' });
  } else {
    await updateCanvasPreview({ name: entry.comp?.name, bounds: patch });
  }
  syncOpenPropsDialogBounds(entry.comp);
  setCanvasSelection(index);
  return;
}

async function openPropertiesForComponent(index) {
  flushDeferredDialogInits();
  ensureDeferredStudioInits();
  let entry = state.canvasEditCache?.editComponents?.[index];
  if (!entry?.comp) return;
  entry = await resolveTemplatePropertiesEntry(entry);
  const comp = entry.comp;
  const ref = entry.ref;
  try {
    if (comp.type === 'Text') {
      fillTextPropertiesForm(comp);
      resetPropsDialogState('text', readTextPropertiesForm, 'applyTextProperties', index, entry.ref);
      switchTextPropertiesTab('general');
      document.getElementById('textPropertiesDialog')?.showModal();
    } else if (comp.type === 'NumericDisplay') {
      window.StudioNumericDisplay?.fillNumericDisplayForm(comp);
      resetPropsDialogState('numeric', window.StudioNumericDisplay.readNumericDisplayForm, 'applyNumericDisplay', index, entry.ref);
      window.StudioNumericDisplay?.switchNumericDisplayTab('general');
      window.StudioNumericDisplay?.wireNumericDisplayTools();
      document.getElementById('numericDisplayDialog')?.showModal();
    } else if (comp.type === 'StringDisplay') {
      window.StudioStringDisplay?.fillStringDisplayForm(comp);
      resetPropsDialogState('string-display', window.StudioStringDisplay.readStringDisplayForm, 'applyStringDisplay', index, entry.ref);
      window.StudioStringDisplay?.switchStringDisplayTab('general');
      window.StudioStringDisplay?.wireStringDisplayTools();
      document.getElementById('stringDisplayDialog')?.showModal();
    } else if (comp.type === 'StringInputEnable') {
      window.StudioStringInput?.fillStringInputForm(comp);
      resetPropsDialogState('string-input', window.StudioStringInput.readStringInputForm, 'applyStringInput', index, entry.ref);
      window.StudioStringInput?.switchStringInputTab('general');
      window.StudioStringInput?.wireStringInputTools();
      document.getElementById('stringInputDialog')?.showModal();
    } else if (comp.type === 'NumericInputEnable') {
      window.StudioNumericInput?.fillNumericInputForm(comp);
      resetPropsDialogState('numeric-input', window.StudioNumericInput.readNumericInputForm, 'applyNumericInput', index, entry.ref);
      window.StudioNumericInput?.switchNumericInputTab('general');
      window.StudioNumericInput?.wireNumericInputTools();
      document.getElementById('numericInputDialog')?.showModal();
    } else if (comp.type === 'NumericInputCursorPoint') {
      window.StudioNumericInput?.fillNumericInputCursorForm(comp);
      resetPropsDialogState('numeric-input-cursor', window.StudioNumericInput.readNumericInputCursorForm, 'applyNumericInputCursor', index, entry.ref);
      window.StudioNumericInput?.switchNumericInputCursorTab('general');
      window.StudioNumericInput?.wireNumericInputCursorTools();
      document.getElementById('numericInputCursorDialog')?.showModal();
    } else if (comp.type === 'MomentaryButton') {
      fillMomentaryButtonForm(comp);
      resetPropsDialogState('momentary', readMomentaryButtonForm, 'applyMomentaryButton', index, entry.ref);
      switchMomentaryButtonTab('general');
      document.getElementById('momentaryButtonDialog')?.showModal();
    } else if (comp.type === 'MaintainedButton') {
      fillMaintainedButtonForm(comp);
      resetPropsDialogState('maintained', readMaintainedButtonForm, 'applyMaintainedButton', index, entry.ref);
      switchMaintainedButtonTab('general');
      wireMaintainedButtonDialogTools();
      document.getElementById('maintainedButtonDialog')?.showModal();
    } else if (comp.type === 'LatchedButton') {
      window.StudioLatchedMultistate?.fillLatchedButtonForm(comp);
      resetPropsDialogState('latched', window.StudioLatchedMultistate.readLatchedButtonForm, 'applyLatchedButton', index, entry.ref);
      window.StudioLatchedMultistate?.switchLatchedButtonTab('general');
      window.StudioLatchedMultistate?.wireLatchedButtonDialogTools();
      document.getElementById('latchedButtonDialog')?.showModal();
    } else if (comp.type === 'MultistateButton') {
      window.StudioLatchedMultistate?.fillMultistateButtonForm(comp);
      resetPropsDialogState('multistate', window.StudioLatchedMultistate.readMultistateButtonForm, 'applyMultistateButton', index, entry.ref);
      window.StudioLatchedMultistate?.switchMultistateButtonTab('general');
      window.StudioLatchedMultistate?.wireMultistateButtonDialogTools();
      document.getElementById('multistateButtonDialog')?.showModal();
    } else if (comp.type === 'InterlockedButton') {
      window.StudioLatchedMultistate?.fillInterlockedButtonForm(comp);
      resetPropsDialogState('interlocked', window.StudioLatchedMultistate.readInterlockedButtonForm, 'applyInterlockedButton', index, entry.ref);
      window.StudioLatchedMultistate?.switchInterlockedButtonTab('general');
      window.StudioLatchedMultistate?.wireInterlockedButtonDialogTools();
      document.getElementById('interlockedButtonDialog')?.showModal();
    } else if (comp.type === 'RampButton') {
      window.StudioLatchedMultistate?.fillRampButtonForm(comp);
      resetPropsDialogState('ramp', window.StudioLatchedMultistate.readRampButtonForm, 'applyRampButton', index, entry.ref);
      window.StudioLatchedMultistate?.switchRampButtonTab('general');
      window.StudioLatchedMultistate?.wireRampButtonDialogTools();
      document.getElementById('rampButtonDialog')?.showModal();
    } else if (comp.type === 'GotoButton') {
      fillGotoButtonForm(comp);
      resetPropsDialogState('goto', readGotoButtonForm, 'applyGotoButton', index, entry.ref);
      switchGotoButtonTab('general');
      wireGotoButtonDialogTools();
      document.getElementById('gotoButtonDialog')?.showModal();
      setTemplateEditStatus(comp.name, ref);
    } else if (comp.type === 'ReturnToButton') {
      window.StudioReturnToButton?.fillReturnToButtonForm(comp);
      resetPropsDialogState('return-to', window.StudioReturnToButton.readReturnToButtonForm, 'applyReturnToButton', index, entry.ref);
      window.StudioReturnToButton?.switchReturnToButtonTab('general');
      window.StudioReturnToButton?.wireReturnToButtonTools();
      document.getElementById('returnToButtonDialog')?.showModal();
    } else if (comp.type === 'CloseDisplayButton') {
      window.StudioCloseDisplayButton?.fillCloseDisplayButtonForm(comp);
      resetPropsDialogState('close-display', window.StudioCloseDisplayButton.readCloseDisplayButtonForm, 'applyCloseDisplayButton', index, entry.ref);
      window.StudioCloseDisplayButton?.switchCloseDisplayButtonTab('general');
      window.StudioCloseDisplayButton?.wireCloseDisplayButtonTools();
      document.getElementById('closeDisplayButtonDialog')?.showModal();
    } else if (comp.type === 'DisplayListSelector') {
      window.StudioDisplayListSelector?.fillDisplayListSelectorForm(comp);
      resetPropsDialogState('display-list', window.StudioDisplayListSelector.readDisplayListSelectorForm, 'applyDisplayListSelector', index, entry.ref);
      window.StudioDisplayListSelector?.switchDisplayListSelectorTab('general');
      window.StudioDisplayListSelector?.wireDisplayListSelectorTools();
      document.getElementById('displayListSelectorDialog')?.showModal();
    } else if (comp.type === 'MultistateIndicator') {
      window.StudioMultistateIndicator?.fillMultistateIndicatorForm(comp);
      resetPropsDialogState('multistate-indicator', window.StudioMultistateIndicator.readMultistateIndicatorForm, 'applyMultistateIndicator', index, ref);
      window.StudioMultistateIndicator?.switchMultistateIndicatorTab('general');
      window.StudioMultistateIndicator?.wireMultistateIndicatorTools();
      document.getElementById('multistateIndicatorDialog')?.showModal();
      if (ref?.type === 'template-global') {
        setStatus(`Editing Template → ${comp.name} (applies to all displays)`);
      }
    } else if (comp.type === 'TimeDateDisplay') {
      window.StudioTimeDateDisplay?.fillTimeDateDisplayForm(comp);
      resetPropsDialogState('time-date', window.StudioTimeDateDisplay.readTimeDateDisplayForm, 'applyTimeDateDisplay', index, ref);
      window.StudioTimeDateDisplay?.switchTimeDateDisplayTab('general');
      window.StudioTimeDateDisplay?.wireTimeDateDisplayTools();
      document.getElementById('timeDateDisplayDialog')?.showModal();
      if (ref?.type === 'template-global') {
        setStatus(`Editing Template → ${comp.name} (applies to all displays)`);
      }
    } else if (comp.type === 'SymbolIndicator') {
      window.StudioSymbolIndicator?.fillSymbolIndicatorForm(comp);
      resetPropsDialogState('symbol-indicator', window.StudioSymbolIndicator.readSymbolIndicatorForm, 'applySymbolIndicator', index, entry.ref);
      window.StudioSymbolIndicator?.switchSymbolIndicatorTab('general');
      window.StudioSymbolIndicator?.wireSymbolIndicatorTools();
      document.getElementById('symbolIndicatorDialog')?.showModal();
    } else if (comp.type === 'ListIndicator') {
      window.StudioListIndicator?.fillListIndicatorForm(comp);
      resetPropsDialogState('list-indicator', window.StudioListIndicator.readListIndicatorForm, 'applyListIndicator', index, entry.ref);
      window.StudioListIndicator?.switchListIndicatorTab('general');
      window.StudioListIndicator?.wireListIndicatorTools();
      document.getElementById('listIndicatorDialog')?.showModal();
    } else if (comp.type === 'BarGraph') {
      window.StudioBarGraph?.fillBarGraphForm(comp);
      resetPropsDialogState('bar-graph', window.StudioBarGraph.readBarGraphForm, 'applyBarGraph', index, entry.ref);
      window.StudioBarGraph?.switchBarGraphTab('general');
      window.StudioBarGraph?.wireBarGraphTools();
      document.getElementById('barGraphDialog')?.showModal();
    } else if (comp.type === 'RecipePlusButton') {
      window.StudioRecipePlusButton?.fillRecipePlusButtonForm(comp);
      resetPropsDialogState('recipeplus-button', window.StudioRecipePlusButton.readRecipePlusButtonForm, 'applyRecipePlusButton', index, entry.ref);
      window.StudioRecipePlusButton?.switchRecipePlusButtonTab('general');
      window.StudioRecipePlusButton?.wireRecipePlusButtonTools();
      document.getElementById('recipePlusButtonDialog')?.showModal();
    } else if (comp.type === 'RecipePlusSelector') {
      window.StudioRecipePlusSelector?.fillRecipePlusSelectorForm(comp);
      resetPropsDialogState('recipeplus-selector', window.StudioRecipePlusSelector.readRecipePlusSelectorForm, 'applyRecipePlusSelector', index, entry.ref);
      window.StudioRecipePlusSelector?.switchRecipePlusSelectorTab('general');
      window.StudioRecipePlusSelector?.wireRecipePlusSelectorTools();
      document.getElementById('recipePlusSelectorDialog')?.showModal();
    } else if (comp.type === 'Image') {
      fillCanvasImagePropertiesForm(comp);
      resetPropsDialogState('image', readCanvasImagePropertiesForm, 'applyCanvasImageProperties', index, ref);
      switchCanvasImagePropertiesTab('general');
      document.getElementById('canvasImagePropertiesDialog')?.showModal();
      setTemplateEditStatus(comp.name, ref);
    } else if (comp.type === 'Rectangle') {
      window.StudioShapeProperties?.openShapePropertiesDialog(comp, ref, index);
    } else if (comp.type === 'Ellipse') {
      window.StudioEllipseProperties?.openEllipsePropertiesDialog(comp, ref, index);
    } else if (comp.type === 'Arc') {
      window.StudioArcProperties?.openArcPropertiesDialog(comp, ref, index);
    } else if (comp.type === 'Freehand') {
      window.StudioFreehandProperties?.openFreehandPropertiesDialog(comp, ref, index);
    } else if (comp.type === 'Panel') {
      window.StudioPanelProperties?.openPanelPropertiesDialog(comp, ref, index);
    } else {
      setStatus(`${comp.type} properties — double-click supported types: Text, shapes, buttons, indicators, Clock`);
    }
  } catch (err) {
    setStatus(`Properties error: ${err.message}`);
  }
}

function handleStudioCanvasKeydown(e) {
  if (isEditableKeyboardTarget(e.target)) return;
  const key = e.key.toLowerCase();
  const hasSelection = getSelectedCanvasIndices().length > 0;

  if (e.ctrlKey && !e.shiftKey && key === 'z') {
    e.preventDefault();
    undoEdit().catch((err) => setStatus(`Undo error: ${err.message}`));
    return;
  }
  if (e.ctrlKey && (key === 'y' || (e.shiftKey && key === 'z'))) {
    e.preventDefault();
    redoEdit().catch((err) => setStatus(`Redo error: ${err.message}`));
    return;
  }
  if (e.ctrlKey && key === 'c' && hasSelection) {
    e.preventDefault();
    copySelectedCanvasComponent().catch((err) => setStatus(`Error: ${err.message}`));
    return;
  }
  if (e.ctrlKey && key === 'x' && hasSelection) {
    e.preventDefault();
    cutSelectedCanvasComponent().catch((err) => setStatus(`Error: ${err.message}`));
    return;
  }
  if (e.ctrlKey && key === 'v') {
    e.preventDefault();
    pasteClipboardComponents().catch((err) => setStatus(`Error: ${err.message}`));
    return;
  }
  if (e.ctrlKey && key === 'd' && hasSelection) {
    e.preventDefault();
    duplicateSelectedCanvasComponent().catch((err) => setStatus(`Error: ${err.message}`));
    return;
  }
  if ((key === 'delete' || key === 'backspace') && hasSelection && !state.placement) {
    e.preventDefault();
    deleteSelectedCanvasComponent().catch((err) => setStatus(`Error: ${err.message}`));
  }
}

function initCanvasEditOverlay() {
  if (!canvasEditOverlay) return;

  canvasEditOverlay.addEventListener('mousedown', (e) => {
    if (state.placement || !objectPlacementOverlay?.classList.contains('hidden')) return;
    if (e.button !== 0) return;

    const handle = e.target.closest('.resize-handle');
    const hit = e.target.closest('.canvas-graphic-hit');

    if (!hit) {
      clearCanvasSelection();
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    const index = Number(hit.dataset.index);
    if (e.ctrlKey || e.metaKey) {
      setCanvasSelection(index, { additive: true });
    } else if (e.shiftKey) {
      setCanvasSelection(index, { range: true });
    } else if (!canvasSelectionIncludes(index)) {
      setCanvasSelection(index);
    }

    const comp = state.canvasEditCache?.editComponents?.[index]?.comp;
    const entry = state.canvasEditCache?.editComponents?.[index];
    if (!comp) return;

    const now = Date.now();
    const isDoubleClick = !handle &&
      state.canvasHitClick.index === index &&
      now - state.canvasHitClick.time < 450;
    state.canvasHitClick = { index, time: now };

    if (isDoubleClick) {
      state.canvasEditDrag = null;
      openPropertiesForComponent(index)
        .catch((err) => setStatus(`Error: ${err.message}`));
      return;
    }

    const dragIndices = handle
      ? [index]
      : (canvasSelectionIncludes(index) ? getSelectedCanvasIndices() : [index]);
    const origins = {};
    for (const idx of dragIndices) {
      const c = state.canvasEditCache?.editComponents?.[idx]?.comp;
      if (!c) continue;
      origins[idx] = {
        left: c.left ?? 0,
        top: c.top ?? 0,
        width: c.width ?? 120,
        height: c.height ?? 32
      };
    }

    const start = getCanvasPoint(e.clientX, e.clientY);
    if (handle) {
      state.canvasEditDrag = {
        mode: `resize-${handle.dataset.handle}`,
        index,
        indices: dragIndices,
        origins,
        start,
        startedAt: now,
        moved: false,
        undoEntry: captureDragUndoEntry(entry),
        orig: origins[index]
      };
    } else {
      state.canvasEditDrag = {
        mode: 'move',
        index,
        indices: dragIndices,
        origins,
        start,
        startedAt: now,
        moved: false,
        undoEntry: captureDragUndoEntry(entry),
        orig: origins[index]
      };
    }
  });

  canvasEditOverlay.addEventListener('contextmenu', (e) => {
    if (state.placement || !objectPlacementOverlay?.classList.contains('hidden')) return;
    if (!displayIsOpen()) return;
    e.preventDefault();
    e.stopPropagation();
    const hit = e.target.closest('.canvas-graphic-hit');
    if (hit) setCanvasSelection(Number(hit.dataset.index));
    showWorkspaceContextMenu(e);
  });

  document.addEventListener('mousemove', (e) => {
    const drag = state.canvasEditDrag;
    if (!drag) return;
    const comp = state.canvasEditCache?.editComponents?.[drag.index]?.comp;
    const hit = canvasEditOverlay?.querySelector(`.canvas-graphic-hit[data-index="${drag.index}"]`);
    if (!comp || !hit) return;

    const current = getCanvasPoint(e.clientX, e.clientY);
    const dx = current.x - drag.start.x;
    const dy = current.y - drag.start.y;
    if (!drag.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
    let left = drag.orig.left;
    let top = drag.orig.top;
    let width = drag.orig.width;
    let height = drag.orig.height;

    if (drag.mode === 'move' && drag.indices?.length > 1) {
      drag.pendingByIndex = drag.pendingByIndex || {};
      const canvasW = state.previewCanvas.width || 800;
      const canvasH = state.previewCanvas.height || 600;
      for (const idx of drag.indices) {
        const orig = drag.origins?.[idx];
        if (!orig) continue;
        let left = snapCanvasValue(orig.left + dx, 'x');
        let top = snapCanvasValue(orig.top + dy, 'y');
        left = Math.max(0, Math.min(left, canvasW - orig.width));
        top = Math.max(0, Math.min(top, canvasH - orig.height));
        const hitEl = canvasEditOverlay?.querySelector(`.canvas-graphic-hit[data-index="${idx}"]`);
        if (hitEl) applyGraphicBoundsStyle(hitEl, { left, top, width: orig.width, height: orig.height });
        drag.pendingByIndex[idx] = { left, top, width: orig.width, height: orig.height };
      }
      drag.moved = true;
      return;
    }

    if (drag.mode === 'move') {
      left = snapCanvasValue(drag.orig.left + dx, 'x');
      top = snapCanvasValue(drag.orig.top + dy, 'y');
    } else if (drag.mode === 'resize-se') {
      width = Math.max(16, snapCanvasValue(drag.orig.width + dx, 'x'));
      height = Math.max(16, snapCanvasValue(drag.orig.height + dy, 'y'));
    } else if (drag.mode === 'resize-nw') {
      const right = drag.orig.left + drag.orig.width;
      const bottom = drag.orig.top + drag.orig.height;
      left = snapCanvasValue(drag.orig.left + dx, 'x');
      top = snapCanvasValue(drag.orig.top + dy, 'y');
      width = Math.max(16, right - left);
      height = Math.max(16, bottom - top);
      left = right - width;
      top = bottom - height;
    } else if (drag.mode === 'resize-ne') {
      const bottom = drag.orig.top + drag.orig.height;
      top = snapCanvasValue(drag.orig.top + dy, 'y');
      width = Math.max(16, snapCanvasValue(drag.orig.width + dx, 'x'));
      height = Math.max(16, bottom - top);
      top = bottom - height;
    } else if (drag.mode === 'resize-sw') {
      const right = drag.orig.left + drag.orig.width;
      left = snapCanvasValue(drag.orig.left + dx, 'x');
      width = Math.max(16, right - left);
      height = Math.max(16, snapCanvasValue(drag.orig.height + dy, 'y'));
      left = right - width;
    }

    const canvasW = state.previewCanvas.width || 800;
    const canvasH = state.previewCanvas.height || 600;
    left = Math.max(0, Math.min(left, canvasW - width));
    top = Math.max(0, Math.min(top, canvasH - height));

    applyGraphicBoundsStyle(hit, { left, top, width, height });
    drag.moved = true;
    drag.pending = { left, top, width, height };
    if (comp.type === 'Freehand' && state.propsDialog?.kind === 'freehand') {
      let previewComp = { ...comp, ...drag.pending };
      if (drag.mode !== 'move' && (drag.mode.startsWith('resize-'))) {
        previewComp = { ...previewComp, ...patchFreehandBounds(comp, drag.pending) };
      }
      updateFreehandStudioPreview(previewComp);
    }
  });

  document.addEventListener('mouseup', () => {
    const drag = state.canvasEditDrag;
    const pendingByIndex = drag?.pendingByIndex || (drag?.pending ? { [drag.index]: drag.pending } : null);
    if (!pendingByIndex) {
      state.canvasEditDrag = null;
      return;
    }
    const elapsed = Date.now() - (drag.startedAt || 0);
    if (!drag.moved && elapsed < 450) {
      state.canvasEditDrag = null;
      return;
    }
    const undoEntry = drag.undoEntry;
    state.canvasEditDrag = null;
    if (undoEntry) pushUndoEntry(undoEntry);
    Promise.all(
      Object.entries(pendingByIndex).map(([idx, bounds]) =>
        updateCanvasComponentBounds(Number(idx), bounds)
      )
    ).catch((err) => setStatus(`Error: ${err.message}`));
  });

  previewCanvasWrap?.addEventListener('mousedown', (e) => {
    if (shouldIgnoreCanvasBackgroundClick()) return;
    if (e.button !== 0) return;
    if (e.target.closest('.canvas-graphic-hit')) return;
    if (e.target === previewFrame || previewFrame?.contains(e.target)) return;
    if (e.target.closest('.object-placement-overlay')) return;
    if (e.target === previewCanvasWrap || e.target === canvasEditOverlay) {
      clearCanvasSelection();
    }
  });
}

async function deleteSelectedCanvasComponent() {
  const indices = [...getSelectedCanvasIndices()];
  if (!indices.length) return;

  const entries = indices
    .map((idx) => state.canvasEditCache?.editComponents?.[idx])
    .filter(Boolean);
  if (!entries.length) return;

  if (!state.undoSuspended) {
    if (entries.some((entry) => entry.ref?.type === 'display')) {
      await pushUndoBefore({ screenKeys: ['components'] });
    } else if (entries.some((entry) => entry.ref?.type === 'shell')) {
      await pushUndoBefore({ screenKeys: ['navShell'] });
    } else if (entries.some((entry) => entry.ref?.type === 'template-override')) {
      await pushUndoBefore({ screenKeys: ['template'] });
    }
  }

  let canvas = await fetchOpenCanvas();
  const shellKey = getNavShellKey(canvas);
  if (shellKey) {
    const shellOverrides = { ...(canvas[shellKey] || {}) };
    let shellChanged = false;
    for (const entry of entries.filter((e) => e.ref?.type === 'shell')) {
      delete shellOverrides[entry.ref.name];
      shellChanged = true;
    }
    if (shellChanged) {
      await patchOpenCanvas({ [shellKey]: shellOverrides });
      canvas = { ...canvas, [shellKey]: shellOverrides };
    }
  }

  for (const entry of entries.filter((e) => e.ref?.type === 'template-override')) {
    await removeTemplateOverride(entry.ref.name);
  }

  const compIndices = entries
    .filter((entry) => entry.ref?.type === 'display' && entry.ref.index != null)
    .map((entry) => entry.ref.index)
    .sort((a, b) => b - a);
  if (compIndices.length) {
    const components = [...(canvas.components || [])];
    for (const compIndex of compIndices) {
      components.splice(compIndex, 1);
    }
    await patchOpenCanvas({ components });
  }

  state.canvasSelection.indices = [];
  await updateCanvasPreview({ forceReload: true });
  refreshObjectExplorer();
  refreshPropertyPanel();
  scheduleRefreshCanvasEditOverlay();
  setStatus(entries.length > 1 ? `Deleted ${entries.length} objects` : 'Object deleted');
}

function handleObjectAction(id) {
  closeAllMenus();
  const item = window.OBJECTS_MENU_LOOKUP?.[id];
  if (!item || item.disabled) return;

  state.activeObjectTool = id;
  updateObjectsMenuChecks();

  if (id === 'select') {
    activateSelectTool('Select tool — click an object to select, drag to move, corners to resize, double-click for properties');
    return;
  }
  if (item.planned) {
    setStatus(`${item.label} — planned for visual editor`);
    return;
  }
  if (item.action === 'text-properties') {
    startObjectPlacement('text', item.textDefaults || {});
    return;
  }
  if (item.action === 'numeric-display-properties') {
    startObjectPlacement('numeric', item.numericDefaults || {});
    return;
  }
  if (item.action === 'string-display-properties') {
    startObjectPlacement('string-display', item.stringDisplayDefaults || {});
    return;
  }
  if (item.action === 'string-input-properties') {
    startObjectPlacement('string-input', item.stringInputDefaults || {});
    return;
  }
  if (item.action === 'numeric-input-properties') {
    startObjectPlacement('numeric-input', item.numericInputDefaults || {});
    return;
  }
  if (item.action === 'numeric-input-cursor-properties') {
    startObjectPlacement('numeric-input-cursor', item.numericInputCursorDefaults || {});
    return;
  }
  if (item.action === 'momentary-button-properties') {
    startObjectPlacement('momentary', item.buttonDefaults || {});
    return;
  }
  if (item.action === 'maintained-button-properties') {
    startObjectPlacement('maintained', item.buttonDefaults || {});
    return;
  }
  if (item.action === 'latched-button-properties') {
    startObjectPlacement('latched', item.buttonDefaults || {});
    return;
  }
  if (item.action === 'multistate-button-properties') {
    startObjectPlacement('multistate', item.buttonDefaults || {});
    return;
  }
  if (item.action === 'interlocked-button-properties') {
    startObjectPlacement('interlocked', item.buttonDefaults || {});
    return;
  }
  if (item.action === 'ramp-button-properties') {
    startObjectPlacement('ramp', item.buttonDefaults || {});
    return;
  }
  if (item.action === 'goto-button-properties') {
    showGotoButtonDialog(item.buttonDefaults || {}).catch((err) => setStatus(`Error: ${err.message}`));
    return;
  }
  if (item.action === 'return-to-button-properties') {
    window.StudioReturnToButton?.showReturnToButtonDialog(item.buttonDefaults || {}).catch((err) => setStatus(`Error: ${err.message}`));
    return;
  }
  if (item.action === 'close-display-button-properties') {
    window.StudioCloseDisplayButton?.showCloseDisplayButtonDialog(item.buttonDefaults || {}).catch((err) => setStatus(`Error: ${err.message}`));
    return;
  }
  if (item.action === 'display-list-selector-properties') {
    startObjectPlacement('display-list', item.buttonDefaults || {});
    return;
  }
  if (item.action === 'multistate-indicator-properties') {
    startObjectPlacement('multistate-indicator', item.indicatorDefaults || {});
    return;
  }
  if (item.action === 'time-date-properties') {
    startObjectPlacement('time-date', item.displayDefaults || {});
    return;
  }
  if (item.action === 'symbol-indicator-properties') {
    startObjectPlacement('symbol-indicator', item.indicatorDefaults || {});
    return;
  }
  if (item.action === 'list-indicator-properties') {
    startObjectPlacement('list-indicator', item.indicatorDefaults || {});
    return;
  }
  if (item.action === 'bar-graph-properties') {
    startObjectPlacement('bar-graph', item.graphDefaults || {});
    return;
  }
  if (item.action === 'recipeplus-button-properties') {
    startObjectPlacement('recipeplus-button', item.buttonDefaults || {});
    return;
  }
  if (item.action === 'recipeplus-selector-properties') {
    startObjectPlacement('recipeplus-selector', item.selectorDefaults || {});
    return;
  }
  if (item.action === 'image-properties') {
    startObjectPlacement('image', item.imageDefaults || {});
    return;
  }
  if (item.action === 'rectangle-properties') {
    startObjectPlacement('rectangle', item.shapeDefaults || {});
    return;
  }
  if (item.action === 'ellipse-properties') {
    startObjectPlacement('ellipse', item.shapeDefaults || {});
    return;
  }
  if (item.action === 'panel-properties') {
    startObjectPlacement('panel', item.panelDefaults || {});
    return;
  }
  if (item.action === 'arc-properties') {
    startObjectPlacement('arc', item.arcDefaults || {});
    return;
  }
  if (item.action === 'freehand-properties') {
    startObjectPlacement('freehand', item.freehandDefaults || {});
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
    if (saved.gridSize != null && saved.gridSizeX == null) {
      state.viewPrefs.gridSizeX = saved.gridSize;
      state.viewPrefs.gridSizeY = saved.gridSize;
    }
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

  if (displayGrid) {
    displayGrid.classList.toggle('hidden', !v.showGrid || !displayIsOpen());
    const gridX = v.gridSizeX || v.gridSize || 10;
    const gridY = v.gridSizeY || v.gridSize || 10;
    displayGrid.style.setProperty('--grid-size-x', `${gridX}px`);
    displayGrid.style.setProperty('--grid-size-y', `${gridY}px`);
    displayGrid.style.setProperty('--grid-color', v.gridColor || '#000000');
  }

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
    const canvas = await fetchOpenCanvas();
    const rt = state.projectConfig?.runtime || {};
    const size = resolveDisplaySize(canvas, rt);
    const kind = isEditingGlobalObject() ? 'Global Object' : 'Display';
    const sizeText = size.useProjectSize
      ? `${size.width} × ${size.height} (project)`
      : `${size.width} × ${size.height}`;
    body.innerHTML = `
      <p><strong>Kind:</strong> ${kind}</p>
      <p><strong>ID:</strong> ${escapeHtml(canvas.id)}</p>
      <p><strong>Title:</strong> ${escapeHtml(canvas.title || '')}</p>
      <p><strong>Layout:</strong> ${escapeHtml(canvas.layout || 'standard')}</p>
      <p><strong>Security:</strong> ${canvas.securityLevel ?? 0}</p>
      <p><strong>Size:</strong> ${sizeText}</p>
      <p><strong>Components:</strong> ${(canvas.components || []).length}</p>
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
    const canvas = await fetchOpenCanvas();
    body.innerHTML = renderComponentTree(canvas.components || [], 0);
  } catch {
    body.innerHTML = '<p class="side-hint">Could not load objects.</p>';
  }
}

function renderComponentTree(components, depth) {
  if (!components.length) return '<p class="side-hint">No objects on this display.</p>';
  return components.map((c, i) => {
    const label = c.caption || c.name || c.label || c.tag || c.type || 'Object';
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
  const url = `/runtime.html?project=${encodeURIComponent(state.activeProject)}&screen=${encodeURIComponent(state.selectedScreenId)}&_=${Date.now()}`;
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
      document.getElementById('gridShowGrid').checked = Boolean(state.viewPrefs.showGrid);
      document.getElementById('gridSnapToGrid').checked = Boolean(state.viewPrefs.snapOn);
      document.getElementById('gridColorPicker').value = state.viewPrefs.gridColor || '#000000';
      document.getElementById('gridSizeXInput').value = state.viewPrefs.gridSizeX || state.viewPrefs.gridSize || 10;
      document.getElementById('gridSizeYInput').value = state.viewPrefs.gridSizeY || state.viewPrefs.gridSize || 10;
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
  document.querySelector('.studio-body')?.classList.remove('preview-active');
}

function clearPreviewFrame() {
  if (previewCanvasWrap) {
    previewCanvasWrap.style.width = '';
    previewCanvasWrap.style.height = '';
    previewCanvasWrap.style.transform = '';
  }
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
  cancelObjectPlacement();
  clearUndoHistory();
  state.previewLoadToken += 1;
  state.selectedScreenId = null;
  state.selectedNode = null;
  hidePreviewStage();
  clearPreviewFrame();
  panelView.classList.add('hidden');
  explorerTree.querySelectorAll('.tree-row').forEach((r) => r.classList.remove('selected'));
  updateEditMenuState();
  updateViewMenuState();
  refreshPropertyPanel();
  refreshObjectExplorer();
}

function applyDisplayWorkspaceBackground(color) {
  const bg = color || '#EBEBEB';
  document.documentElement.style.setProperty('--display-bg', bg);
  const workspace = document.getElementById('workspace');
  if (workspace) workspace.style.background = bg;
  if (previewStage) previewStage.style.background = bg;
}

function showPreviewStage() {
  previewStage?.classList.remove('hidden');
  previewFrame?.classList.remove('hidden');
  document.querySelector('.studio-body')?.classList.add('preview-active');
  applyViewPrefs();
}

function displayIsOpen() {
  return Boolean(state.selectedScreenId && !previewStage?.classList.contains('hidden'));
}

function previewReady() {
  return Boolean(displayIsOpen() && previewFrame?.contentWindow);
}

function previewPost(action, payload = {}) {
  if (!previewReady()) return false;
  previewFrame.contentWindow.postMessage({ type: 'planthmi-preview', action, ...payload }, '*');
  return true;
}

function previewPatchComponent(index, component) {
  return previewPost('patch', { index, component });
}

function previewAppendComponent(index, component) {
  return previewPost('append', { index, component });
}

function previewRemoveComponent(index) {
  return previewPost('remove', { index });
}

function previewUpdateBounds(index, bounds) {
  return previewPost('bounds', { index, bounds });
}

function previewUpdateBoundsByName(name, bounds) {
  return previewPost('bounds-by-name', { name, bounds });
}

function previewPatchByName(name, component) {
  return previewPost('patch-by-name', { name, component });
}

function previewRemoveComponentByName(name) {
  return previewPost('remove-by-name', { name });
}

function previewSyncComponents(components) {
  return previewPost('sync-components', { components });
}

async function updateCanvasPreview(options = {}) {
  const {
    components, index, component, bounds, removedIndex, mode,
    forceReload = false, name
  } = options;
  if (forceReload) {
    if (!state.previewFrameReady) {
      state.pendingPreviewReloadRequest = true;
      return;
    }
    await reloadDisplayPreview();
    return;
  }
  let updated = false;
  if (bounds != null && name) {
    updated = previewUpdateBoundsByName(name, bounds);
  } else if (bounds != null && index != null) {
    updated = previewUpdateBounds(index, bounds);
  } else if (mode === 'patch-by-name' && name && component) {
    updated = previewPatchByName(name, component);
  } else if (mode === 'append' && index != null && component) {
    updated = previewAppendComponent(index, component);
  } else if (mode === 'patch' && index != null && component) {
    updated = previewPatchComponent(index, component);
  } else if (removedIndex != null) {
    updated = previewRemoveComponent(removedIndex);
  } else if (components) {
    updated = previewSyncComponents(components);
  }
  if (!updated) await reloadDisplayPreview();
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
  updateUndoRedoUI();
  updateEditClipboardUI();
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
    case 'new-parameter': openParametersPanel().catch((err) => setStatus(`Error: ${err.message}`)); break;
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
  const screen = await fetchJson(`/api/runtime/screens/${encodeURIComponent(state.selectedScreenId)}?project=${state.activeProject}&raw=1`);
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

function updateEditClipboardUI() {
  const indices = getSelectedCanvasIndices();
  const canCopy = indices.some((idx) => state.canvasEditCache?.editComponents?.[idx]?.ref?.type === 'display');
  const canPaste = Boolean(state.clipboard?.components?.length);
  document.querySelectorAll('[data-edit-action="cut"], [data-edit-action="copy"], [data-tb="cut"], [data-tb="copy"]').forEach((el) => {
    el.classList.toggle('disabled', !canCopy);
  });
  document.querySelectorAll('[data-edit-action="paste"], [data-edit-action="duplicate"], [data-tb="paste"]').forEach((el) => {
    el.classList.toggle('disabled', !canPaste);
  });
  document.querySelectorAll('[data-edit-action="duplicate"]').forEach((el) => {
    el.classList.toggle('disabled', !canCopy);
  });
}

function cloneComponentForClipboard(comp) {
  return JSON.parse(JSON.stringify(stripComponentMeta(comp)));
}

function uniquePastedName(components, baseName) {
  const names = new Set((components || []).map((c) => c.name));
  if (!names.has(baseName)) return baseName;
  let i = 2;
  while (names.has(`${baseName}_${i}`)) i += 1;
  return `${baseName}_${i}`;
}

async function copySelectedCanvasComponent() {
  const indices = getSelectedCanvasIndices();
  const components = [];
  for (const idx of indices) {
    const entry = state.canvasEditCache?.editComponents?.[idx];
    if (entry?.comp && entry.ref?.type === 'display') {
      components.push(cloneComponentForClipboard(entry.comp));
    }
  }
  if (!components.length) {
    setStatus('Select display object(s) to copy');
    return;
  }
  state.clipboard = { components };
  updateEditClipboardUI();
  setStatus(`Copied ${components.map((c) => c.name).join(', ')}`);
}

async function cutSelectedCanvasComponent() {
  await copySelectedCanvasComponent();
  if (state.clipboard?.components?.length) {
    await deleteSelectedCanvasComponent();
  }
}

async function pasteClipboardComponents() {
  if (!state.clipboard?.components?.length) {
    setStatus('Clipboard empty');
    return;
  }
  if (!displayIsOpen()) return;
  await pushUndoBefore({ screenKeys: ['components'] });
  const canvas = await fetchOpenCanvas();
  const components = [...(canvas.components || [])];
  const pasted = [];
  for (const src of state.clipboard.components) {
    const comp = cloneComponentForClipboard(src);
    comp.name = uniquePastedName(components, comp.name || 'Object1');
    comp.left = (Number(comp.left) || 0) + 12;
    comp.top = (Number(comp.top) || 0) + 12;
    components.push(comp);
    pasted.push(comp.name);
  }
  await patchOpenCanvas({ components });
  state.canvasEditCache.raw = { ...canvas, components };
  await updateCanvasPreview({ forceReload: true });
  refreshObjectExplorer();
  refreshPropertyPanel();
  scheduleRefreshCanvasEditOverlay();
  setStatus(`Pasted ${pasted.join(', ')}`);
}

async function duplicateSelectedCanvasComponent() {
  await copySelectedCanvasComponent();
  await pasteClipboardComponents();
}

function selectAllCanvasComponents() {
  const editComponents = state.canvasEditCache?.editComponents || [];
  const displayIndexes = editComponents
    .map((entry, index) => (entry.ref?.type === 'display' ? index : -1))
    .filter((index) => index >= 0);
  if (!displayIndexes.length) {
    setStatus('No display objects on this screen');
    return;
  }
  state.canvasSelection.indices = displayIndexes;
  refreshCanvasEditOverlaySelection();
  updateEditClipboardUI();
  setStatus(`Selected ${displayIndexes.length} display object(s)`);
}

function handleEditAction(action) {
  closeAllMenus();
  switch (action) {
    case 'undo':
      undoEdit().catch((err) => setStatus(`Undo error: ${err.message}`));
      break;
    case 'redo':
      redoEdit().catch((err) => setStatus(`Redo error: ${err.message}`));
      break;
    case 'cut':
      cutSelectedCanvasComponent().catch((err) => setStatus(`Error: ${err.message}`));
      break;
    case 'copy':
      copySelectedCanvasComponent().catch((err) => setStatus(`Error: ${err.message}`));
      break;
    case 'paste':
      pasteClipboardComponents().catch((err) => setStatus(`Error: ${err.message}`));
      break;
    case 'duplicate':
      duplicateSelectedCanvasComponent().catch((err) => setStatus(`Error: ${err.message}`));
      break;
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
    case 'select-all':
      selectAllCanvasComponents();
      break;
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

function sanitizeExplorerTree(nodes) {
  for (const node of nodes || []) {
    if (node.tagFolder || node.action === 'tag-item') {
      delete node.children;
    }
    if (node.children?.length) sanitizeExplorerTree(node.children);
  }
}

async function loadExplorer(projectId) {
  const id = projectId || state.activeProject;
  if (!id) return;
  const data = await fetchJson(`/api/projects/${id}/explorer?_=${Date.now()}`);
  sanitizeExplorerTree(data.tree);
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

/** Highlight the matching HMI Tags folder in the explorer sidebar (visual only). */
function highlightExplorerTagFolder(folderName) {
  if (!folderName || !explorerTree) return;
  for (const id of ['project-root', 'application', 'hmi-tags']) {
    expandExplorerNode(id);
  }
  const nodeId = `tag-folder-${folderName}`;
  const row = explorerTree.querySelector(`.tree-row[data-node-id="${CSS.escape(nodeId)}"]`);
  if (!row) return;
  explorerTree.querySelectorAll('.tree-row').forEach((r) => r.classList.remove('selected'));
  row.classList.add('selected');
  state.selectedNode = {
    type: 'folder',
    id: nodeId,
    label: folderName,
    tagFolder: folderName
  };
  row.scrollIntoView({ block: 'nearest' });
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
    case 'tag-item':
      refreshProjectConfig().then(() => {
        openTagsPanel(
          (state.projectConfig?.tags || []).find((t) => t.name === node.tagName)?.folder || '',
          node.tagName
        );
      });
      break;
    case 'plc-tag-item':
      refreshProjectConfig().then(() => {
        const tag = (state.projectConfig?.tags || []).find((t) => t.name === node.tagName);
        openTagsPanel(tag?.folder || '', node.tagName);
      });
      break;
    case 'tag-folder':
      openTagsPanel(node.tagFolder || node.label);
      break;
    case 'alarms':
    case 'local-messages':
      openAlarmsPanel();
      break;
    case 'global-object-defaults':
      showGlobalObjectDefaultsDialog();
      break;
    case 'communications':
      window.StudioCommunicationsSetup?.showCommunicationsSetupDialog();
      break;
    case 'recipeplus-setup':
    case 'recipeplus-editor':
      openRecipePanel(action);
      break;
    case 'data-log':
      openDataLogPanel();
      break;
    case 'parameters':
    case 'parameters-add':
      openParametersPanel();
      break;
    case 'parameter-file':
      openParametersPanel(node.parameterFile);
      break;
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
    showImagePropertiesDialog(node);
  } else if (node.tagFolder) {
    openTagsPanel(node.tagFolder);
  } else if (node.action) {
    handleExplorerAction(node);
  } else if (node.type === 'item') {
    if (node.id === 'project-settings') showProjectSettingsDialog('general');
    else if (node.id === 'startup') showProjectSettingsDialog('runtime');
    else if (node.id === 'communications' || node.id === 'linx-communications') {
      window.StudioCommunicationsSetup?.showCommunicationsSetupDialog();
    }
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
  if (state.pendingPreviewReload) return state.pendingPreviewReload;

  state.previewFrameReady = false;
  markCanvasEditOverlayStale();
  state.pendingPreviewReload = (async () => {
    try {
      invalidateCanvasCaches();
      const loadToken = ++state.previewLoadToken;
      const screenId = state.selectedScreenId;
      await applyPreviewCanvasSize(screenId);
      if (loadToken !== state.previewLoadToken || state.selectedScreenId !== screenId) return;
      previewFrame.src =
        studioPreviewUrl({
          [state.previewKind === 'global-object' ? 'globalObject' : 'screen']: screenId,
          project: state.activeProject,
          w: state.previewCanvas.width,
          h: state.previewCanvas.height,
          _: Date.now()
        });
      attachPreviewLoadHandler();
    } finally {
      state.pendingPreviewReload = null;
    }
  })();

  return state.pendingPreviewReload;
}

function applyPreviewZoom() {
  if (!previewFrame || !previewCanvasWrap || previewStage?.classList.contains('hidden')) return;
  const scale = (state.viewPrefs?.zoom || 100) / 100;
  const { width, height } = state.previewCanvas;
  previewCanvasWrap.style.width = `${width}px`;
  previewCanvasWrap.style.height = `${height}px`;
  previewCanvasWrap.style.transform = scale === 1 ? '' : `scale(${scale})`;
  previewFrame.style.width = '100%';
  previewFrame.style.height = '100%';
  previewFrame.style.transform = '';
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
  applyDisplayWorkspaceBackground(size.backgroundColor);
  if (previewFrame) previewFrame.style.background = size.backgroundColor;
  applyPreviewZoom();
}

function ensureDeferredStudioInits() {
  if (!state.deferredStudioInitsStarted) runDeferredStudioInits();
}

function openDisplayPreview(screenId, title) {
  ensureDeferredStudioInits();
  markCanvasEditOverlayStale();
  state.previewKind = 'display';
  panelView.classList.add('hidden');
  showPreviewStage();
  const loadToken = ++state.previewLoadToken;
  applyPreviewCanvasSize(screenId).then(() => {
    if (loadToken !== state.previewLoadToken) return;
    if (state.selectedScreenId !== screenId) return;
    const { width, height } = state.previewCanvas;
    attachPreviewLoadHandler();
    previewFrame.src = studioPreviewUrl({
      screen: screenId,
      project: state.activeProject,
      w: width,
      h: height
    });
  });
  state.selectedScreenId = screenId;
  state.canvasSelection.indices = [];
  activateSelectTool();
  trackOpenDisplay(screenId);
  setStatus(`Editing display: ${title || screenId}`);
  updateEditMenuState();
  updateViewMenuState();
  refreshPropertyPanel();
  refreshObjectExplorer();
}

function openGlobalObjectPreview(objectId, title) {
  ensureDeferredStudioInits();
  markCanvasEditOverlayStale();
  state.previewKind = 'global-object';
  panelView.classList.add('hidden');
  showPreviewStage();
  const loadToken = ++state.previewLoadToken;
  applyPreviewCanvasSize(objectId).then(() => {
    if (loadToken !== state.previewLoadToken) return;
    if (state.selectedScreenId !== objectId) return;
    const { width, height } = state.previewCanvas;
    attachPreviewLoadHandler();
    previewFrame.src = studioPreviewUrl({
      globalObject: objectId,
      project: state.activeProject,
      w: width,
      h: height
    });
  });
  state.selectedScreenId = objectId;
  state.canvasSelection.indices = [];
  activateSelectTool();
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
    thumb.onload = () => {
      if (!info.width || !info.height) {
        document.getElementById('imagePropsSize').textContent =
          `${thumb.naturalWidth} x ${thumb.naturalHeight}`;
      }
    };
    thumb.src = `${info.url}?_=${Date.now()}`;
    thumb.alt = info.label;
    dialog.showModal();
    setStatus(`Image: ${info.label}`);
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
}

async function importProjectImage() {
  if (!state.activeProject) {
    setStatus('Open a project first');
    return null;
  }
  const input = document.getElementById('imageImportInput');
  if (!input) {
    alert('Image import is unavailable. Hard refresh the page (Ctrl+F5) and try again.');
    return null;
  }
  return new Promise((resolve) => {
    input.value = '';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        setStatus(`Uploading ${file.name}…`);
        const dataBase64 = await new Promise((res, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = String(reader.result || '');
            const comma = result.indexOf(',');
            res(comma >= 0 ? result.slice(comma + 1) : result);
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
        const savedName = data.image?.fileName || file.name;
        setStatus(`Added image: ${savedName}`);
        resolve(savedName);
      } catch (err) {
        setStatus(`Error: ${err.message}`);
        alert(`Image upload failed: ${err.message}`);
        resolve(null);
      } finally {
        input.value = '';
      }
    };
    input.click();
  });
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

async function deleteTagFromProject(tagName) {
  if (!state.activeProject || !tagName) return;
  if (!confirm(`Remove tag "${tagName}" from this project?\n\nTag definitions live in project.json. The Tag/*.CSV export file is regenerated automatically and cannot be deleted from the explorer.`)) {
    return;
  }
  await refreshProjectConfig();
  const nextTags = (state.projectConfig?.tags || []).filter((t) => t.name !== tagName);
  if (nextTags.length === (state.projectConfig?.tags || []).length) {
    setStatus(`Tag not found in project: ${tagName}`);
    return;
  }
  await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: nextTags })
  });
  await refreshProjectConfig();
  await openTagsPanel();
  setStatus(`Removed tag: ${tagName}`);
}

async function clearAllTagsFromProject() {
  if (!state.activeProject) return;
  await refreshProjectConfig();
  const tagCount = (state.projectConfig?.tags || []).length;
  if (tagCount === 0) {
    setStatus('No tags to clear');
    return;
  }
  if (!confirm(`Clear all ${tagCount} tag(s) from this project?\n\nTag definitions are removed from project.json. The Tag/*-Tags.CSV export file is regenerated automatically (header only).`)) {
    return;
  }
  await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: [] })
  });
  await refreshProjectConfig();
  if (panelView.querySelector('.tag-editor-panel')) {
    await openTagsPanel();
  }
  setStatus(`Cleared ${tagCount} tag(s) from project`);
}

let tagEditOriginalName = null;

const TAG_FOLDER_ORDER = [
  'PLC_DI_Discr', 'PLC_DI_No', 'PLC_DI_Tags',
  'PLC_DO_Discr', 'PLC_DO_No', 'PLC_DO_Tags',
  'Safety_DI_Discr', 'Safety_DI_No', 'Safety_DI_Tags',
  'Safety_DO_Discr', 'Safety_DO_No', 'Safety_DO_Tags',
  'PLC uploded Tags',
  'Temp_Tags'
];

/** Folder for tags imported/transferred from the PLC (RSLogix, device CSV, etc.). */
const PLC_UPLOADED_TAGS_FOLDER = 'PLC uploded Tags';

function isPlcImportFormat(format) {
  return format === 'rslogix' || format === 'factorytalk-csv';
}

function shouldAssignPlcUploadedFolder(raw, folder, format) {
  if (isIoSystemFolder(folder)) return false;
  if (folder === 'Temp_Tags' || folder === PLC_UPLOADED_TAGS_FOLDER) return false;
  if (isPlcImportFormat(format)) return true;
  if (format === 'simple-csv' && folder) return false;
  if (format === 'json' && folder) return false;
  const plc = String(raw.plcAddress || raw.PLCReference || raw.connection || '').trim();
  return Boolean(plc || raw.dataSource === 'device') && !folder;
}

const IO_SYSTEM_FOLDER_RE = /^(PLC_(DI|DO)|Safety_(DI|DO))_(Discr|No|Tags)$/;

const tagsPanelState = { folder: '', selected: '', mode: 'edit', detailAbort: null, ctx: null };

function tagToolbarBtnClass(action, ctx = tagsPanelState.ctx) {
  const folder = ctx?.activeFolder || '';
  const def = ctx?.activeDef;
  const io = isIoSystemFolder(folder);
  const internal = isInternalTagFolder(folder);
  switch (action) {
    case 'delete':
      return def && !isIoSystemFolder(def.folder) ? '' : ' tag-tb-muted';
    case 'duplicate':
      return def && isInternalTagFolder(def.folder) ? '' : ' tag-tb-muted';
    case 'insert':
    case 'new-folder':
      return io ? ' tag-tb-muted' : '';
    case 'delete-folder':
    case 'dup-folder':
      return internal && folder ? '' : ' tag-tb-muted';
    default:
      return '';
  }
}

function buildTagEditorToolbar(ctx) {
  const actions = [
    ['delete', 'Delete selection', '✕'],
    ['duplicate', 'Duplicate tag (Ctrl+D)', '⎘'],
    ['insert', 'New tag / Insert row', '＋'],
    ['refresh', 'Refresh tag list', '↻'],
    ['sep'],
    ['delete-folder', 'Delete tag folder', '✕📁'],
    ['dup-folder', 'Duplicate tag folder', '⎘📁'],
    ['new-folder', 'Create tag folder', '＋📁'],
    ['sep'],
    ['import', 'Import / Export tags', '⬇'],
    ['stats', 'Tag statistics', 'Σ']
  ];
  return actions.map((item) => {
    if (item[0] === 'sep') return '<span class="tag-tb-sep"></span>';
    const [action, title, label] = item;
    return `<button type="button" class="tag-tb-btn${tagToolbarBtnClass(action, ctx)}" data-tag-action="${action}" title="${escapeHtml(title)}">${label}</button>`;
  }).join('');
}

async function handleTagToolbarAction(action) {
  const ctx = tagsPanelState.ctx;
  if (!ctx) {
    setStatus('Tag Editor not ready — reopen HMI Tags or wait for load to finish');
    return;
  }
  const { allDefs, folderDefs, activeFolder, activeDef } = ctx;
  const io = isIoSystemFolder(activeFolder);

  switch (action) {
    case 'delete':
      if (!activeDef || isIoSystemFolder(activeDef.folder)) {
        setStatus(io ? 'IO list tags — edit values above and click Apply (tags are managed by Parameters)' : 'Select a deletable tag first');
        return;
      }
      await deleteSelectedTagFromEditor(allDefs, folderDefs);
      break;
    case 'duplicate':
      if (!activeDef || !isInternalTagFolder(activeDef.folder)) {
        setStatus('Duplicate is available for Temp_Tags and custom internal folders only');
        return;
      }
      await duplicateSelectedTagInEditor(folderDefs);
      break;
    case 'insert':
      if (io) {
        await openTagsPanel('Temp_Tags', '', { createNew: true });
        setStatus('New internal tags belong in Temp_Tags — opened Temp_Tags for new tag');
        return;
      }
      startNewInternalTagInPanel(activeFolder || 'Temp_Tags');
      break;
    case 'refresh':
      if (tagDetailFormIsDirty() && !confirm('You have unsaved tag changes. Refresh anyway?')) return;
      await openTagsPanel(tagsPanelState.folder, tagsPanelState.selected);
      setStatus(`Refreshed: ${activeFolder || 'Tag Editor'}`);
      break;
    case 'delete-folder':
      if (!isInternalTagFolder(activeFolder)) {
        setStatus('IO list folders cannot be deleted — use Parameters → Remove List');
        return;
      }
      await deleteTagFolderFromEditor(allDefs);
      break;
    case 'dup-folder':
      if (!isInternalTagFolder(activeFolder)) {
        setStatus('Duplicate folder is for Temp_Tags and custom folders only');
        return;
      }
      await duplicateTagFolderFromEditor(allDefs);
      break;
    case 'new-folder':
      createTagFolderFromEditor(io ? 'Temp_Tags' : undefined);
      if (io) {
        setStatus('IO list folders are fixed — enter a custom folder name (e.g. Temp_Tags)');
      }
      break;
    case 'import':
      showTagWizardDialog();
      break;
    case 'stats': {
      const byFolder = {};
      for (const t of allDefs) {
        const f = t.folder || '(none)';
        byFolder[f] = (byFolder[f] || 0) + 1;
      }
      const lines = Object.entries(byFolder).sort(([a], [b]) => a.localeCompare(b)).map(([f, n]) => `${f}: ${n}`);
      alert(`Tag statistics — ${allDefs.length} total\n\n${lines.join('\n')}`);
      break;
    }
    default:
      break;
  }
}

function updateTagEditorToolbar() {
  const bar = document.querySelector('.tag-editor-toolbar');
  if (!bar || !tagsPanelState.ctx) return;
  bar.querySelectorAll('[data-tag-action]').forEach((btn) => {
    btn.classList.toggle('tag-tb-muted', tagToolbarBtnClass(btn.dataset.tagAction).includes('muted'));
  });
}

let tagEditorToolbarGlobalWired = false;
function tagEditorToolbarClickTarget(e) {
  const t = e.target;
  if (t instanceof Element) return t;
  if (t?.parentElement instanceof Element) return t.parentElement;
  return null;
}

function ensureTagEditorToolbarGlobalWired() {
  if (tagEditorToolbarGlobalWired) return;
  tagEditorToolbarGlobalWired = true;
  document.addEventListener('click', (e) => {
    if (!panelView || panelView.classList.contains('hidden')) return;
    if (!panelView.querySelector('.tag-editor-toolbar')) return;
    const el = tagEditorToolbarClickTarget(e);
    if (!el) return;
    const btn = el.closest('[data-tag-action]');
    if (!btn?.closest('.tag-editor-toolbar')) return;
    e.preventDefault();
    handleTagToolbarAction(btn.dataset.tagAction).catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.addEventListener('keydown', (e) => {
    if (!panelView?.querySelector('.tag-editor-panel') || panelView.classList.contains('hidden')) return;
    if (e.ctrlKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      handleTagToolbarAction('duplicate').catch((err) => setStatus(`Error: ${err.message}`));
    }
    if (e.key === 'F5' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      handleTagToolbarAction('refresh').catch((err) => setStatus(`Error: ${err.message}`));
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditableKeyboardTarget(e.target)) {
      if (!panelView?.querySelector('.tag-editor-panel') || panelView.classList.contains('hidden')) return;
      e.preventDefault();
      handleTagToolbarAction('delete').catch((err) => setStatus(`Error: ${err.message}`));
    }
  });
}

function isIoSystemFolder(folder) {
  return IO_SYSTEM_FOLDER_RE.test(String(folder || '').trim());
}

function isInternalTagFolder(folder) {
  const f = String(folder || '').trim();
  return Boolean(f) && !isIoSystemFolder(f);
}

function parseFtTagNameInput(input, defaultFolder = '') {
  const raw = String(input || '').trim().replace(/\//g, '\\');
  if (!raw) return null;
  if (raw.includes('\\')) {
    const idx = raw.lastIndexOf('\\');
    const folder = raw.slice(0, idx).trim();
    const shortName = raw.slice(idx + 1).trim();
    if (!folder || !shortName) return null;
    return { folder, shortName, name: `${folder}.${shortName}` };
  }
  const folder = String(defaultFolder || '').trim();
  if (!folder) return null;
  return { folder, shortName: raw, name: `${folder}.${raw}` };
}

function coerceInternalEditorType(type) {
  if (type === 'int') return 'float';
  if (type === 'float' || type === 'string' || type === 'bool') return type;
  return 'bool';
}

function internalTypeLabel(type) {
  switch (coerceInternalEditorType(type)) {
    case 'float': return 'Analog';
    case 'bool': return 'Digital';
    case 'string': return 'String';
    default: return type || '';
  }
}

function buildInternalTypeOptions(selectedType = 'bool') {
  const type = coerceInternalEditorType(selectedType);
  const types = [
    ['bool', 'Digital'],
    ['float', 'Analog'],
    ['string', 'String']
  ];
  return types.map(([value, label]) =>
    `<option value="${value}"${type === value ? ' selected' : ''}>${label}</option>`
  ).join('');
}

function buildFtDataTypeOptions(selected = '') {
  const value = normalizeFtDataTypeValue(selected);
  const options = [
    ['', '(Default)'],
    ['UINT', 'Unsigned Integer'],
    ['INT', 'Integer'],
    ['DINT', 'Long Integer'],
    ['REAL', 'Floating Point'],
    ['BYTE', 'Byte'],
    ['BCD3', '3-Digit BCD'],
    ['BCD4', '4-Digit BCD']
  ];
  return options.map(([v, label]) =>
    `<option value="${v}"${value === v ? ' selected' : ''}>${label}</option>`
  ).join('');
}

function normalizeFtDataTypeValue(value) {
  const v = String(value || '').trim();
  const aliases = {
    Real: 'REAL',
    real: 'REAL',
    Float: 'REAL',
    float: 'REAL',
    'Floating Point': 'REAL',
    'Unsigned Integer': 'UINT',
    'Long Integer': 'DINT',
    Integer: 'INT',
    Byte: 'BYTE',
    '3-Digit BCD': 'BCD3',
    '4-Digit BCD': 'BCD4'
  };
  return aliases[v] || v;
}

function updateInternalTagTypePanels(type) {
  const t = coerceInternalEditorType(type);
  document.getElementById('tagDetailLengthWrap')?.classList.toggle('hidden', t !== 'string');
  document.getElementById('tagDetailAnalogWrap')?.classList.toggle('hidden', t !== 'float');
}

function getTagFolderList(allDefs) {
  const folders = new Set();
  for (const name of state.projectConfig?.tagFolders || []) {
    if (name) folders.add(String(name));
  }
  for (const def of allDefs) {
    if (def.folder) folders.add(def.folder);
  }
  const ordered = TAG_FOLDER_ORDER.filter((f) => folders.has(f));
  const rest = [...folders].filter((f) => !TAG_FOLDER_ORDER.includes(f)).sort((a, b) => a.localeCompare(b));
  return [...ordered, ...rest];
}

async function persistTagFolders(folderNames) {
  if (!state.activeProject) return;
  const tagFolders = [...new Set(folderNames.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tagFolders })
  });
  await refreshProjectConfig();
}

async function addTagFolderToProject(folder) {
  const existing = getTagFolderList(state.projectConfig?.tags || []);
  if (existing.includes(folder)) return;
  await persistTagFolders([...existing, folder]);
}

async function removeTagFolderFromProject(folder) {
  const existing = getTagFolderList(state.projectConfig?.tags || []);
  await persistTagFolders(existing.filter((f) => f !== folder));
}

function sortFolderTags(defs) {
  return [...defs].sort((a, b) => {
    const shortA = a.name.includes('.') ? a.name.split('.').pop() : a.name;
    const shortB = b.name.includes('.') ? b.name.split('.').pop() : b.name;
    const listA = shortA.startsWith('List_') || shortA.startsWith('Safety_List_');
    const listB = shortB.startsWith('List_') || shortB.startsWith('Safety_List_');
    if (listA && !listB) return -1;
    if (!listA && listB) return 1;
    if (shortA.startsWith('Data_') && shortB.startsWith('Data_')) {
      return Number(shortA.slice(5)) - Number(shortB.slice(5));
    }
    return shortA.localeCompare(shortB);
  });
}

function formatFtTagName(def) {
  const short = def.name.includes('.') ? def.name.split('.').pop() : def.name;
  return def.folder ? `${def.folder}\\${short}` : def.name;
}

function tagShortName(def) {
  return def.name.includes('.') ? def.name.split('.').pop() : def.name;
}

function tagGridDescription(def, liveValue) {
  if (def.type === 'string') {
    const live = liveValue !== undefined && liveValue !== '' ? String(liveValue) : '';
    if (live) return live;
    if (def.initialValue !== undefined && def.initialValue !== '') return String(def.initialValue);
    return def.description || '';
  }
  if (def.connection) return def.connection;
  return def.description || '';
}

function isIoDiscrTag(def) {
  return def?.type === 'string' && /_Discr$/i.test(def.folder || '');
}

function isIoNoTag(def) {
  return def?.type === 'int' && /_No$/i.test(def.folder || '');
}

function isIoDeviceTag(def) {
  return /_Tags$/i.test(def?.folder || '');
}

/** Values written when saving from the Tag Editor detail form. */
function resolveTagEditorSaveValues(def, type, description, initialRaw, connection) {
  const folder = def.folder || '';
  if (type === 'string' && /_Discr$/i.test(folder)) {
    const text = String(description || '').trim();
    return { description: text, initialValue: text, connection: '' };
  }
  if (/_Tags$/i.test(folder)) {
    const conn = String(connection || description || '').trim();
    return {
      description: conn || String(def.description || '').trim(),
      connection: conn,
      initialValue: def.initialValue
    };
  }
  if (type === 'int' && /_No$/i.test(folder)) {
    const fromInitial = initialRaw !== undefined && initialRaw !== ''
      ? Number.parseInt(String(initialRaw), 10)
      : NaN;
    const fromDesc = Number.parseInt(String(description || '').trim(), 10);
    const initialValue = Number.isFinite(fromInitial)
      ? fromInitial
      : Number.isFinite(fromDesc)
        ? fromDesc
        : def.initialValue;
    return { description: String(initialValue), initialValue, connection: '' };
  }
  const resolved = { description: String(description || '').trim(), connection: String(connection || '').trim() };
  if (initialRaw !== undefined && initialRaw !== '') {
    resolved.initialValue = initialRaw;
  } else if (type === 'string' && resolved.description) {
    resolved.initialValue = resolved.description;
  }
  return resolved;
}

function tagDetailFormIsDirty() {
  const form = document.getElementById('tagEditorDetail');
  if (!form || form.dataset.dirty !== '1') return false;
  return true;
}

function markTagDetailFormDirty() {
  const form = document.getElementById('tagEditorDetail');
  if (form) form.dataset.dirty = '1';
}

function clearTagDetailFormDirty() {
  const form = document.getElementById('tagEditorDetail');
  if (form) form.dataset.dirty = '0';
}

function wireTagDetailFormInputs() {
  document.getElementById('tagEditorDetail')?.querySelectorAll(
    'input:not([readonly]):not([disabled]), select:not([disabled]), textarea:not([readonly]):not([disabled])'
  ).forEach((el) => {
    el.addEventListener('input', markTagDetailFormDirty);
    el.addEventListener('change', markTagDetailFormDirty);
  });
}

function buildIoTagDetailForm(def, runtimeTags) {
  const live = runtimeTags[def.name] || {};
  const liveValue = live.value !== undefined ? live.value : def.initialValue;
  const discr = isIoDiscrTag(def);
  const ioNo = isIoNoTag(def);
  const device = isIoDeviceTag(def);
  const desc = tagGridDescription(def, liveValue);
  const typeLabel = def.type === 'string' ? 'String' : def.type === 'bool' ? 'Digital' : def.type === 'int' ? 'Integer' : (def.type || '');
  const length = def.type === 'string'
    ? stringTagLength({ ...def, initialValue: liveValue ?? def.initialValue })
    : '';

  let tagFields = `
    <label class="tag-field-name">Name<input type="text" id="tagDetailName" value="${escapeHtml(formatFtTagName(def))}" readonly /></label>
    <label>Type<input type="text" id="tagDetailType" value="${escapeHtml(typeLabel)}" readonly data-type="${escapeHtml(def.type)}" /></label>`;

  if (discr) {
    tagFields += `
    <label class="tag-field-wide">Description<input type="text" id="tagDetailDescription" value="${escapeHtml(desc)}" maxlength="200" /></label>
    <label>Length<input type="text" id="tagDetailLength" value="${length}" readonly tabindex="-1" /></label>`;
  } else if (ioNo) {
    tagFields += `
    <label>IO number<input type="text" id="tagDetailInitial" value="${escapeHtml(liveValue !== undefined && liveValue !== null ? String(liveValue) : '')}" inputmode="numeric" /></label>`;
  } else if (device) {
    tagFields += `
    <label class="tag-field-wide">Description<input type="text" id="tagDetailDescription" value="${escapeHtml(def.description || '')}" readonly tabindex="-1" /></label>`;
  }

  const dataSourceBlock = device
    ? `<fieldset class="tag-editor-fieldset">
        <legend>Data Source</legend>
        <div class="tag-editor-source-row">
          <span>Type:</span>
          <label class="radio-row"><input type="radio" name="tagDetailSource" value="device" checked disabled /> Device</label>
          <label class="radio-row"><input type="radio" name="tagDetailSource" value="memory" disabled /> Memory</label>
        </div>
        <label class="tag-editor-address-row">Address
          <span class="tag-editor-address-input">
            <input type="text" id="tagDetailConnection" value="${escapeHtml(def.connection || desc)}" placeholder="PLC tag path" />
            <button type="button" class="ft-mini-btn" id="tagDetailBrowse" title="Tag browser">…</button>
          </span>
        </label>
      </fieldset>`
    : `<fieldset class="tag-editor-fieldset">
        <legend>Data Source</legend>
        <div class="tag-editor-source-row">
          <span>Type:</span>
          <label class="radio-row"><input type="radio" name="tagDetailSource" value="memory" checked disabled /> Memory</label>
          <label class="radio-row"><input type="radio" name="tagDetailSource" value="device" disabled /> Device</label>
          <label class="radio-row"><input type="checkbox" id="tagDetailRetentive" disabled /> Retentive</label>
        </div>
      </fieldset>`;

  return `<div class="tag-editor-detail-form">
    <fieldset class="tag-editor-fieldset">
      <legend>Tag</legend>
      <div class="tag-editor-detail-grid tag-editor-detail-grid-io">${tagFields}</div>
    </fieldset>
    ${dataSourceBlock}
  </div>`;
}

function wrapTagDetailBody(formHtml, actionsHtml) {
  return `<div class="tag-editor-detail-body">${formHtml}${actionsHtml}</div>`;
}

function buildInternalTagDetailForm(def, runtimeTags, { isNew = false, defaultFolder = '' } = {}) {
  const live = def ? (runtimeTags[def.name] || {}) : {};
  const liveValue = def && live.value !== undefined ? live.value : def?.initialValue;
  const dataSource = def?.dataSource || 'memory';
  const type = coerceInternalEditorType(def?.type || 'bool');
  const nameValue = isNew
    ? (defaultFolder ? `${defaultFolder}\\` : '')
    : formatFtTagName(def);
  const desc = def ? (def.description || '') : '';
  const stringLen = type === 'string'
    ? (def ? stringTagLength({ ...def, initialValue: liveValue ?? def.initialValue }) : 82)
    : '';
  const address = def?.dataSource === 'device' ? (def.plcAddress || def.connection || '') : (def?.connection || '0');
  const min = def?.min ?? 0;
  const max = def?.max ?? 100;
  const scale = def?.scale ?? 1;
  const offset = def?.offset ?? 0;
  const dataType = def?.dataType ?? '';
  return `<div class="tag-editor-detail-form">
    <fieldset class="tag-editor-fieldset">
      <legend>Tag</legend>
      <div class="tag-editor-detail-grid tag-editor-detail-grid-internal">
        <label class="tag-field-name">Name<input type="text" id="tagDetailName" value="${escapeHtml(nameValue)}" placeholder="Folder\\TagName" maxlength="120" /></label>
        <label>Type<select id="tagDetailType">${buildInternalTypeOptions(type)}</select></label>
        <label class="tag-field-wide">Description<input type="text" id="tagDetailDescription" value="${escapeHtml(desc)}" maxlength="200" /></label>
        <label id="tagDetailLengthWrap"${type === 'string' ? '' : ' class="hidden"'}>Length<input type="text" id="tagDetailLength" value="${stringLen}" inputmode="numeric" /></label>
        <div id="tagDetailAnalogWrap" class="tag-editor-analog-grid${type === 'float' ? '' : ' hidden'}">
          <label>Minimum<input type="text" id="tagDetailMin" value="${escapeHtml(String(min))}" inputmode="decimal" /></label>
          <label>Maximum<input type="text" id="tagDetailMax" value="${escapeHtml(String(max))}" inputmode="decimal" /></label>
          <label>Scale<input type="text" id="tagDetailScale" value="${escapeHtml(String(scale))}" inputmode="decimal" /></label>
          <label>Offset<input type="text" id="tagDetailOffset" value="${escapeHtml(String(offset))}" inputmode="decimal" /></label>
          <label class="tag-field-wide">Data Type<select id="tagDetailDataType">${buildFtDataTypeOptions(dataType)}</select></label>
        </div>
      </div>
    </fieldset>
    <fieldset class="tag-editor-fieldset">
      <legend>Data Source</legend>
      <div class="tag-editor-source-row">
        <span>Type:</span>
        <label class="radio-row"><input type="radio" name="tagDetailSource" value="device"${dataSource === 'device' ? ' checked' : ''} /> Device</label>
        <label class="radio-row"><input type="radio" name="tagDetailSource" value="memory"${dataSource !== 'device' ? ' checked' : ''} /> Memory</label>
      </div>
      <label class="tag-editor-address-row">Address
        <span class="tag-editor-address-input">
          <input type="text" id="tagDetailAddress" value="${escapeHtml(address)}" placeholder="0" />
          <button type="button" class="ft-mini-btn" id="tagDetailBrowse" title="Tag browser">…</button>
        </span>
      </label>
    </fieldset>
  </div>`;
}

function buildInternalTagDetailActionsHtml() {
  return `<div class="tag-editor-detail-actions-col" id="tagDetailActions">
    <button type="button" class="dialog-btn" id="tagDetailClose">Close</button>
    <button type="button" class="dialog-btn primary" id="tagDetailApply">Accept</button>
    <button type="button" class="dialog-btn" id="tagDetailDiscard">Discard</button>
    <button type="button" class="dialog-btn" id="tagDetailNew">New</button>
    <button type="button" class="dialog-btn" id="tagDetailHelp">Help</button>
  </div>`;
}

function wireInternalTagTypeFields() {
  const typeEl = document.getElementById('tagDetailType');
  const applyPanels = () => updateInternalTagTypePanels(typeEl?.value || 'bool');
  typeEl?.addEventListener('change', applyPanels);
  applyPanels();
  document.getElementById('tagDetailBrowse')?.addEventListener('click', () => {
    if (window.StudioTagTools?.openTagBrowser) {
      StudioTagTools.openTagBrowser(document.getElementById('tagDetailAddress'));
    }
  });
}

function readInternalTagDetailForm(defaultFolder = '') {
  const nameInput = document.getElementById('tagDetailName')?.value;
  const parsed = parseFtTagNameInput(nameInput, defaultFolder);
  if (!parsed) return { error: 'Enter tag name as Folder\\TagName (e.g. Temp_Tags\\Alarm).' };
  if (isIoSystemFolder(parsed.folder)) {
    return { error: 'IO list folders (PLC_* / Safety_*) are managed by Parameters — use Temp_Tags or a custom folder for internal tags.' };
  }
  const type = coerceInternalEditorType(document.getElementById('tagDetailType')?.value || 'bool');
  const description = document.getElementById('tagDetailDescription')?.value || '';
  const dataSource = document.querySelector('input[name="tagDetailSource"]:checked')?.value || 'memory';
  const address = document.getElementById('tagDetailAddress')?.value?.trim() || '0';
  const lengthRaw = document.getElementById('tagDetailLength')?.value;
  const entry = normalizeTagEntry({
    name: parsed.name,
    type,
    description,
    folder: parsed.folder,
    dataSource,
    connection: dataSource === 'memory' ? address : '',
    plcAddress: dataSource === 'device' ? address : '',
    initialValue: type === 'string' ? description : undefined,
    min: type === 'float' ? document.getElementById('tagDetailMin')?.value : undefined,
    max: type === 'float' ? document.getElementById('tagDetailMax')?.value : undefined,
    scale: type === 'float' ? document.getElementById('tagDetailScale')?.value : undefined,
    offset: type === 'float' ? document.getElementById('tagDetailOffset')?.value : undefined,
    dataType: type === 'float' ? document.getElementById('tagDetailDataType')?.value : undefined,
    stringLength: type === 'string' ? lengthRaw : undefined
  });
  if (!entry) return { error: 'Could not build tag definition.' };
  if (type === 'string' && lengthRaw) {
    const len = Number.parseInt(lengthRaw, 10);
    if (Number.isFinite(len) && len > 0) {
      entry.stringLength = len;
      const text = String(entry.initialValue || entry.description || '');
      entry.initialValue = text.padEnd(len, ' ').slice(0, len);
    }
  }
  return { entry, parsed };
}

async function saveInternalTagFromDetail(originalName = null) {
  const result = readInternalTagDetailForm(tagsPanelState.folder);
  if (result.error) {
    alert(result.error);
    return false;
  }
  const { entry, parsed } = result;
  await refreshProjectConfig();
  const exists = (state.projectConfig?.tags || []).some((t) => t.name === entry.name);
  if (!originalName && exists) {
    if (!confirm(`Tag "${entry.name}" already exists. Replace it?`)) return false;
  } else if (originalName && originalName !== entry.name && exists) {
    if (!confirm(`Tag "${entry.name}" already exists. Replace it?`)) return false;
  }
  const saved = await saveTagToProject(entry, originalName);
  if (!saved) return false;
  await addTagFolderToProject(parsed.folder);
  clearTagDetailFormDirty();
  tagsPanelState.mode = 'edit';
  setStatus(`Saved tag: ${formatFtTagName(entry)}`);
  await loadExplorer(state.activeProject);
  await openTagsPanel(parsed.folder, entry.name);
  return true;
}

function startNewInternalTagInPanel(folder) {
  if (isIoSystemFolder(folder)) {
    setStatus('Create internal tags in Temp_Tags or a custom folder — IO list folders are auto-generated');
    folder = 'Temp_Tags';
  }
  tagsPanelState.mode = 'new';
  tagsPanelState.selected = '';
  tagsPanelState.folder = folder || 'Temp_Tags';
  const detail = document.getElementById('tagEditorDetail');
  if (!detail) {
    openTagsPanel(tagsPanelState.folder, '', { createNew: true }).catch((err) => setStatus(`Error: ${err.message}`));
    return;
  }
  detail.innerHTML = wrapTagDetailBody(
    buildInternalTagDetailForm(null, {}, { isNew: true, defaultFolder: tagsPanelState.folder }),
    buildInternalTagDetailActionsHtml()
  );
  wireTagDetailFormInputs();
  wireInternalTagTypeFields();
  clearTagDetailFormDirty();
  document.getElementById('tagDetailName')?.focus();
  setStatus(`New internal tag — ${tagsPanelState.folder}\\…`);
}

async function deleteSelectedTagFromEditor(allDefs, folderDefs) {
  const name = tagsPanelState.selected;
  if (!name) {
    setStatus('Select a tag to delete');
    return;
  }
  const def = folderDefs.find((d) => d.name === name);
  if (def && isIoSystemFolder(def.folder)) {
    alert('IO list tags are managed by Parameters — delete the parameter list instead.');
    return;
  }
  await deleteTagFromProject(name);
}

async function duplicateSelectedTagInEditor(folderDefs) {
  const def = folderDefs.find((d) => d.name === tagsPanelState.selected);
  if (!def) {
    setStatus('Select a tag to duplicate');
    return;
  }
  if (isIoSystemFolder(def.folder)) {
    alert('IO list tags cannot be duplicated here.');
    return;
  }
  const short = tagShortName(def);
  let copyShort = `${short}_Copy`;
  let copyName = `${def.folder}.${copyShort}`;
  const all = state.projectConfig?.tags || [];
  let n = 2;
  while (all.some((t) => t.name === copyName)) {
    copyShort = `${short}_Copy${n++}`;
    copyName = `${def.folder}.${copyShort}`;
  }
  const entry = normalizeTagEntry({ ...def, name: copyName, folder: def.folder, description: def.description || '' });
  await saveTagToProject(entry, null);
  setStatus(`Duplicated tag: ${formatFtTagName(entry)}`);
  await loadExplorer(state.activeProject);
  await openTagsPanel(def.folder, copyName);
}

async function createTagFolderFromEditor(defaultName) {
  const seed = defaultName
    ?? (tagsPanelState.folder && isInternalTagFolder(tagsPanelState.folder)
      ? tagsPanelState.folder
      : 'Temp_Tags');
  showTagFolderDialog(seed);
}

function sanitizeTagFolderName(raw) {
  let name = String(raw || '').trim();
  name = name.replace(/\\/g, '').replace(/\//g, '').trim();
  name = name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '');
  return name.slice(0, 60);
}

function validateTagFolderName(folder) {
  if (!folder) return 'Folder name is required.';
  if (/\\|\//.test(String(folder))) return 'Folder name cannot contain \\ or /.';
  if (isIoSystemFolder(folder)) {
    return `"${folder}" is an IO list folder — it is created automatically when you add Parameter lists. Use Temp_Tags or a custom name for internal tags.`;
  }
  const knownIo = ['PLC_DI_NO', 'PLC_DO_NO', 'PLC_DI_DISCR', 'PLC_DO_DISCR'];
  if (knownIo.includes(folder.toUpperCase())) {
    return `"${folder}" matches a reserved IO folder name. Use Temp_Tags for custom internal tags.`;
  }
  return '';
}

function showTagFolderDialog(defaultName = 'Temp_Tags') {
  const dlg = document.getElementById('tagFolderDialog');
  const input = document.getElementById('tagFolderName');
  const err = document.getElementById('tagFolderError');
  if (!dlg || !input) return;
  const seed = sanitizeTagFolderName(defaultName) || 'Temp_Tags';
  input.value = seed;
  if (err) {
    err.textContent = '';
    err.classList.add('hidden');
  }
  dlg.showModal();
  input.focus();
  input.select();
}

async function submitTagFolderDialog(e) {
  e.preventDefault();
  const errEl = document.getElementById('tagFolderError');
  const raw = document.getElementById('tagFolderName')?.value || '';
  const folder = sanitizeTagFolderName(raw);
  const error = validateTagFolderName(folder);
  if (error) {
    if (errEl) {
      errEl.textContent = error;
      errEl.classList.remove('hidden');
    }
    return;
  }
  document.getElementById('tagFolderDialog')?.close();
  await addTagFolderToProject(folder);
  await loadExplorer(state.activeProject);
  await openTagsPanel(folder, '', { createNew: true });
  setStatus(`Created folder: ${folder} — enter first tag name and click Accept`);
}

let tagFolderDialogInited = false;
function initTagFolderDialog() {
  if (tagFolderDialogInited) return;
  tagFolderDialogInited = true;
  document.getElementById('tagFolderForm')?.addEventListener('submit', (e) => {
    submitTagFolderDialog(e).catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('tagFolderCancel')?.addEventListener('click', () => {
    document.getElementById('tagFolderDialog')?.close();
  });
  document.getElementById('tagFolderHelp')?.addEventListener('click', () => {
    alert(
      'New HMI Tag Folder\n\n'
      + 'Enter a folder name for internal (memory) tags.\n\n'
      + '• Do not include \\ or tag names — folder only (e.g. Temp_Tags)\n'
      + '• PLC_DI_*, PLC_DO_*, Safety_* folders are created by Parameters\n'
      + '• After OK, add your first tag as Folder\\TagName'
    );
  });
  document.getElementById('tagFolderName')?.addEventListener('input', () => {
    document.getElementById('tagFolderError')?.classList.add('hidden');
  });
}

async function deleteTagFolderFromEditor(allDefs) {
  const folder = tagsPanelState.folder;
  if (!folder) return;
  if (isIoSystemFolder(folder)) {
    alert('IO list folders cannot be deleted here — use Parameters → Remove List.');
    return;
  }
  const tags = allDefs.filter((t) => t.folder === folder);
  const label = tags.length
    ? `Delete folder "${folder}" and all ${tags.length} tag(s)?`
    : `Remove empty folder "${folder}"?`;
  if (!confirm(label)) return;
  const nextTags = allDefs.filter((t) => t.folder !== folder);
  await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: nextTags })
  });
  await removeTagFolderFromProject(folder);
  await refreshProjectConfig();
  await loadExplorer(state.activeProject);
  await openTagsPanel(getTagFolderList(nextTags)[0] || '');
  setStatus(`Deleted folder: ${folder}`);
}

async function duplicateTagFolderFromEditor(allDefs) {
  const folder = tagsPanelState.folder;
  if (!folder || isIoSystemFolder(folder)) {
    alert('Select a custom internal tag folder to duplicate.');
    return;
  }
  const newName = prompt('Duplicate folder as:', `${folder}_Copy`);
  if (!newName?.trim()) return;
  const target = newName.trim().replace(/[^a-zA-Z0-9_]/g, '_');
  const sourceTags = allDefs.filter((t) => t.folder === folder);
  if (!sourceTags.length) {
    setStatus(`Folder "${folder}" is empty`);
    return;
  }
  const newTags = sourceTags.map((t) => {
    const short = tagShortName(t);
    return normalizeTagEntry({ ...t, name: `${target}.${short}`, folder: target });
  }).filter(Boolean);
  let tags = [...allDefs];
  for (const entry of newTags) {
    tags = tags.filter((t) => t.name !== entry.name);
    tags.push(entry);
  }
  tags.sort((a, b) => a.name.localeCompare(b.name));
  await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags })
  });
  await refreshProjectConfig();
  await loadExplorer(state.activeProject);
  await openTagsPanel(target);
  setStatus(`Duplicated folder: ${folder} → ${target}`);
}

function stringTagLength(def) {
  if (def?.stringLength && Number.isFinite(def.stringLength)) {
    return Math.max(Number(def.stringLength), 1);
  }
  const text = def.initialValue !== undefined && def.initialValue !== ''
    ? String(def.initialValue)
    : (def.description || '');
  return Math.max(text.length, 1);
}

async function saveTagToProject(entry, originalName) {
  if (!state.activeProject) throw new Error('No active project');
  await refreshProjectConfig();
  let tags = [...(state.projectConfig?.tags || [])];
  if (originalName) {
    const idx = tags.findIndex((t) => t.name === originalName);
    if (idx >= 0) tags[idx] = entry;
    else tags.push(entry);
  } else {
    if (tags.some((t) => t.name === entry.name)) {
      if (!confirm(`Tag "${entry.name}" already exists. Replace it?`)) return false;
      tags = tags.filter((t) => t.name !== entry.name);
    }
    tags.push(entry);
  }
  tags.sort((a, b) => a.name.localeCompare(b.name));
  await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags })
  });
  await refreshProjectConfig();
  if (entry.initialValue !== undefined) {
    try {
      await fetchJson('/api/runtime/tags/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: entry.name, value: entry.initialValue })
      });
    } catch {
      /* runtime may not be loaded */
    }
  }
  return true;
}

function normalizeTagEntry(raw) {
  const name = String(raw.name || '').trim();
  if (!name) return null;
  const type = ['bool', 'int', 'float', 'string'].includes(raw.type) ? raw.type : 'bool';
  const description = String(raw.description || '').trim();
  const entry = { name, type, description };
  const folder = String(raw.folder || '').trim();
  if (folder) entry.folder = folder;
  const dataSource = String(raw.dataSource || '').trim();
  if (dataSource) entry.dataSource = dataSource;
  const connection = String(raw.connection || '').trim();
  if (connection) entry.connection = connection;
  const plcAddress = String(raw.plcAddress || '').trim();
  if (plcAddress) entry.plcAddress = plcAddress;
  if (raw.initialValue !== undefined && raw.initialValue !== '') {
    const rawVal = raw.initialValue;
    if (type === 'int') entry.initialValue = Number.parseInt(rawVal, 10);
    else if (type === 'float') entry.initialValue = Number.parseFloat(rawVal);
    else if (type === 'bool') entry.initialValue = rawVal === true || rawVal === 'true' || rawVal === '1';
    else entry.initialValue = rawVal;
  }
  if (raw.computed) {
    entry.computed = true;
    entry.logic = String(raw.logic || '').trim();
    if (!entry.logic) return null;
  }
  if (raw.min !== undefined && raw.min !== '') {
    const n = Number.parseFloat(raw.min);
    if (Number.isFinite(n)) entry.min = n;
  }
  if (raw.max !== undefined && raw.max !== '') {
    const n = Number.parseFloat(raw.max);
    if (Number.isFinite(n)) entry.max = n;
  }
  if (raw.scale !== undefined && raw.scale !== '') {
    const n = Number.parseFloat(raw.scale);
    if (Number.isFinite(n)) entry.scale = n;
  }
  if (raw.offset !== undefined && raw.offset !== '') {
    const n = Number.parseFloat(raw.offset);
    if (Number.isFinite(n)) entry.offset = n;
  }
  const dataType = String(raw.dataType || '').trim();
  if (dataType) entry.dataType = normalizeFtDataTypeValue(dataType);
  if (raw.stringLength !== undefined && raw.stringLength !== '') {
    const len = Number.parseInt(raw.stringLength, 10);
    if (Number.isFinite(len) && len > 0) entry.stringLength = len;
  }
  return entry;
}

function showTagEditDialog(existingName, defaultFolder = '') {
  if (!state.activeProject) {
    setStatus('Open an application first');
    return;
  }
  refreshProjectConfig().then(() => {
    const tags = state.projectConfig?.tags || [];
    const existing = existingName ? tags.find((t) => t.name === existingName) : null;
    tagEditOriginalName = existing?.name || null;
    document.getElementById('tagEditTitle').textContent = existing ? 'Edit HMI Tag' : 'New HMI Tag';
    const nameEl = document.getElementById('tagEditName');
    const folder = existing?.folder || defaultFolder || 'Temp_Tags';
    nameEl.value = existing ? formatFtTagName(existing) : (folder ? `${folder}\\` : '');
    nameEl.readOnly = Boolean(existing && isIoSystemFolder(existing.folder));
    document.getElementById('tagEditType').value = coerceInternalEditorType(existing?.type || 'bool');
    document.getElementById('tagEditDescription').value = existing?.description || '';
    document.getElementById('tagEditFolder').value = folder;
    const dataSource = existing?.dataSource || 'memory';
    document.querySelectorAll('input[name="tagEditSourceKind"]').forEach((el) => {
      el.checked = el.value === dataSource;
    });
    const address = dataSource === 'device'
      ? (existing?.plcAddress || existing?.connection || '')
      : (existing?.connection || '');
    document.getElementById('tagEditConnection').value = address;
    document.getElementById('tagEditDataSource').value = dataSource;
    document.getElementById('tagEditPlcAddress').value = existing?.plcAddress || '';
    const computed = Boolean(existing?.computed);
    document.getElementById('tagEditComputed').checked = computed;
    document.getElementById('tagEditLogic').value = existing?.logic || '';
    document.getElementById('tagEditLogicWrap').classList.toggle('hidden', !computed);
    document.getElementById('tagEditDialog').showModal();
    nameEl.focus();
  });
}

async function saveTagEdit(e) {
  e.preventDefault();
  const parsed = parseFtTagNameInput(
    document.getElementById('tagEditName').value,
    document.getElementById('tagEditFolder').value
  );
  if (!parsed) {
    alert('Enter tag name as Folder\\TagName (e.g. Temp_Tags\\Alarm).');
    return;
  }
  const dataSource = document.querySelector('input[name="tagEditSourceKind"]:checked')?.value || 'memory';
  const address = document.getElementById('tagEditConnection').value?.trim() || '';
  const entry = normalizeTagEntry({
    name: parsed.name,
    type: document.getElementById('tagEditType').value,
    description: document.getElementById('tagEditDescription').value,
    folder: parsed.folder,
    dataSource,
    connection: dataSource === 'memory' ? address : '',
    plcAddress: dataSource === 'device' ? address : '',
    computed: document.getElementById('tagEditComputed').checked,
    logic: document.getElementById('tagEditLogic').value
  });
  if (!entry) {
    alert('Tag name is required. Computed tags also need a logic expression.');
    return;
  }
  const saved = await saveTagToProject(entry, tagEditOriginalName);
  if (!saved) return;
  document.getElementById('tagEditDialog').close();
  await loadExplorer(state.activeProject);
  await openTagsPanel(entry.folder || tagsPanelState.folder, entry.name);
  setStatus(`Saved tag: ${formatFtTagName(entry)}`);
}

let tagEditDialogInited = false;
function initTagEditDialog() {
  if (tagEditDialogInited) return;
  tagEditDialogInited = true;
  document.getElementById('tagEditComputed')?.addEventListener('change', (e) => {
    document.getElementById('tagEditLogicWrap').classList.toggle('hidden', !e.target.checked);
  });
  document.getElementById('tagEditForm')?.addEventListener('submit', (e) => {
    saveTagEdit(e).catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('cancelTagEdit')?.addEventListener('click', () => {
    document.getElementById('tagEditDialog').close();
  });
  document.getElementById('tagEditLogicExpr')?.addEventListener('click', () => {
    const input = document.getElementById('tagEditLogic');
    if (window.StudioTagTools?.openExpressionEditor) {
      StudioTagTools.openExpressionEditor(input, input.value);
    }
  });
}

async function openTagsPanel(folderFilter = '', selectedTagName = '', options = {}) {
  hidePreviewStage();
  panelView.classList.remove('hidden');
  try {
  await refreshProjectConfig();
  const allDefs = state.projectConfig?.tags || [];
  const folders = getTagFolderList(allDefs);
  const activeFolder = folderFilter && (
    folders.includes(folderFilter) || allDefs.some((d) => d.folder === folderFilter)
  )
    ? folderFilter
    : (folders[0] || '');
  tagsPanelState.folder = activeFolder;

  const folderDefs = activeFolder
    ? sortFolderTags(allDefs.filter((def) => def.folder === activeFolder))
    : sortFolderTags(allDefs.filter((def) => !def.folder));

  if (options.createNew) {
    tagsPanelState.mode = 'new';
    tagsPanelState.selected = '';
  } else if (selectedTagName !== '__new__') {
    tagsPanelState.mode = 'edit';
  }

  const activeTagName = tagsPanelState.mode === 'new'
    ? ''
    : (selectedTagName && selectedTagName !== '__new__' && folderDefs.some((d) => d.name === selectedTagName)
      ? selectedTagName
      : (folderDefs[0]?.name || ''));
  tagsPanelState.selected = activeTagName;

  const [runtimeTags] = await Promise.all([
    fetchJson(`/api/runtime/tags?project=${state.activeProject}`).catch(() => ({}))
  ]);

  const canManageInternal = isInternalTagFolder(activeFolder) || !activeFolder;

  const buildDetailForm = (def) => {
    if (tagsPanelState.mode === 'new') {
      return buildInternalTagDetailForm(null, runtimeTags, { isNew: true, defaultFolder: activeFolder || 'Temp_Tags' });
    }
    if (!def) {
      return `<p class="hint">Select a tag in the grid, or click <strong>New Tag</strong> to create an internal memory tag (e.g. <code>Temp_Tags\\Alarm</code>).</p>`;
    }
    if (isInternalTagFolder(def.folder)) {
      return buildInternalTagDetailForm(def, runtimeTags);
    }
    return buildIoTagDetailForm(def, runtimeTags);
  };

  const activeDef = tagsPanelState.mode === 'new' ? null : (folderDefs.find((d) => d.name === activeTagName) || null);
  tagsPanelState.ctx = { allDefs, folderDefs, activeFolder, activeDef };
  ensureTagEditorToolbarGlobalWired();

  const buildGridRows = () => folderDefs.map((def, idx) => {
    const live = runtimeTags[def.name] || {};
    const desc = tagGridDescription(def, live.value);
    const selected = def.name === tagsPanelState.selected ? ' selected' : '';
    const typeLabel = def.type === 'string' ? 'String' : internalTypeLabel(def.type) || def.type || '';
    return `<tr class="tag-grid-row${selected}" data-tag-name="${escapeHtml(def.name)}">
      <td>${idx + 1}</td>
      <td class="tag-short-name">${escapeHtml(formatFtTagName(def))}</td>
      <td>${escapeHtml(typeLabel)}</td>
      <td>${escapeHtml(desc)}</td>
    </tr>`;
  }).join('');

  const folderHint = (() => {
    if (activeFolder === PLC_UPLOADED_TAGS_FOLDER) {
      return 'Tags transferred from the PLC (RSLogix / Studio 5000 import). Each tag shows as <code>PLC uploded Tags\\</code> + controller tag name. Your manual IO tags stay in <strong>PLC_DI_*</strong> / <strong>Temp_Tags</strong> folders.';
    }
    if (isInternalTagFolder(activeFolder)) {
      return 'Internal HMI tags (FactoryTalk-style). Use toolbar <strong>＋ New tag</strong> or <strong>＋📁 Create folder</strong>. Name: <code>Folder\\TagName</code>. Set <strong>Data Source → Memory</strong> for internal tags.';
    }
    if (/_No$/i.test(activeFolder)) {
      return 'This folder holds IO <strong>numbers</strong> (1, 2, 3…). Edit text descriptions in the matching <strong>_Discr</strong> folder, and PLC addresses in <strong>_Tags</strong>.';
    }
    if (/_Discr$/i.test(activeFolder)) {
      return 'Edit IO <strong>descriptions</strong> here (e.g. “DO01 Run Lamp”). Change the IO number in the matching <strong>_No</strong> folder.';
    }
    if (/_Tags$/i.test(activeFolder)) {
      return 'Edit <strong>PLC tag addresses</strong> here (device tags). Descriptions live in <strong>_Discr</strong>.';
    }
    return 'Select a tag, edit fields above the grid, then click <strong>Accept</strong>. Use the toolbar for New Tag, folders, and delete.';
  })();

  const buildDetailActionsHtml = (def) => {
    if (tagsPanelState.mode === 'new' || (def && isInternalTagFolder(def.folder))) {
      return buildInternalTagDetailActionsHtml();
    }
    return `<div class="tag-editor-detail-actions-col" id="tagDetailActions">
      <button type="button" class="dialog-btn" id="tagDetailPrev"${folderDefs.length < 2 ? ' disabled' : ''}>Prev</button>
      <button type="button" class="dialog-btn" id="tagDetailNext"${folderDefs.length < 2 ? ' disabled' : ''}>Next</button>
      <button type="button" class="dialog-btn" id="tagDetailNew"${canManageInternal ? '' : ' disabled'}>New</button>
      <button type="button" class="dialog-btn primary" id="tagDetailApply"${def ? '' : ' disabled'}>Apply</button>
      <button type="button" class="dialog-btn" id="tagPanelImportExport">Import/Export…</button>
      <button type="button" class="dialog-btn" id="tagPanelClear"${allDefs.length ? '' : ' disabled'}>Clear All…</button>
    </div>`;
  };

  const ioFolder = isIoSystemFolder(activeFolder);

  panelView.innerHTML = `
    <div class="panel-content tag-editor-panel">
      <div class="tag-editor-toolbar" role="toolbar" aria-label="Tag editor">
        ${buildTagEditorToolbar(tagsPanelState.ctx)}
      </div>
      <h2 class="tag-editor-title">${activeFolder ? escapeHtml(activeFolder) : 'Tag Editor'}</h2>
      ${folderHint && !ioFolder ? `<p class="hint tag-editor-hint">${folderHint}</p>` : ''}
      <div class="tag-editor-detail" id="tagEditorDetail">
        ${wrapTagDetailBody(buildDetailForm(activeDef), buildDetailActionsHtml(activeDef))}
      </div>
      <div class="tag-editor-split">
        <div class="tag-folder-tree" id="tagFolderTree">
          ${folders.map((folder) => {
            const count = allDefs.filter((d) => d.folder === folder).length;
            return `<button type="button" class="tag-folder-btn${folder === activeFolder ? ' active' : ''}" data-folder="${escapeHtml(folder)}">${escapeHtml(folder)} (${count})</button>`;
          }).join('') || '<p class="hint" style="padding:8px">No folders</p>'}
          ${allDefs.some((d) => !d.folder) ? `<button type="button" class="tag-folder-btn${!activeFolder ? ' active' : ''}" data-folder="">(No folder)</button>` : ''}
        </div>
        <div class="tag-grid-wrap">
          <table class="data-table tag-grid">
            <thead><tr><th>#</th><th>Tag Name</th><th>Type</th><th>Description</th></tr></thead>
            <tbody id="tagGridBody">${buildGridRows() || '<tr><td colspan="4">No tags in this folder</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    </div>`;

  const wireDetailFormExtras = (def) => {
    wireTagDetailFormInputs();
    if (tagsPanelState.mode === 'new' || (def && isInternalTagFolder(def.folder))) {
      wireInternalTagTypeFields();
    } else if (def && isIoDeviceTag(def)) {
      document.getElementById('tagDetailBrowse')?.addEventListener('click', () => {
        if (window.StudioTagTools?.openTagBrowser) {
          StudioTagTools.openTagBrowser(document.getElementById('tagDetailConnection'));
        }
      });
    }
  };

  const selectTag = (name, force = false) => {
    if (!force && name !== tagsPanelState.selected && tagDetailFormIsDirty()) {
      if (!confirm('You have unsaved tag changes. Switch tag anyway?')) return;
    }
    tagsPanelState.mode = 'edit';
    tagsPanelState.selected = name;
    const def = folderDefs.find((d) => d.name === name);
    const detail = document.getElementById('tagEditorDetail');
    if (detail) {
      detail.innerHTML = wrapTagDetailBody(buildDetailForm(def || null), buildDetailActionsHtml(def || null));
      wireDetailFormExtras(def || null);
      clearTagDetailFormDirty();
    }
    document.querySelectorAll('.tag-grid-row').forEach((row) => {
      row.classList.toggle('selected', row.dataset.tagName === name);
    });
    tagsPanelState.ctx = { ...tagsPanelState.ctx, activeDef: def || null, folderDefs };
    updateTagEditorToolbar();
  };

  if (tagsPanelState.detailAbort) tagsPanelState.detailAbort.abort();
  tagsPanelState.detailAbort = new AbortController();
  const detailSignal = tagsPanelState.detailAbort.signal;

  const wireDetailActions = () => {
    document.getElementById('tagEditorDetail')?.addEventListener('click', (e) => {
      const id = e.target.closest('button')?.id;
      if (!id) return;
      if (id === 'tagDetailApply') saveTagDetailPanel().catch((err) => setStatus(`Error: ${err.message}`));
      else if (id === 'tagDetailClose') {
        if (tagDetailFormIsDirty() && !confirm('You have unsaved tag changes. Close anyway?')) return;
        panelView.classList.add('hidden');
        setStatus('Tag Editor closed');
      } else if (id === 'tagDetailDiscard') {
        tagsPanelState.mode = 'edit';
        if (tagsPanelState.selected) selectTag(tagsPanelState.selected, true);
        else openTagsPanel(tagsPanelState.folder).catch((err) => setStatus(`Error: ${err.message}`));
      } else if (id === 'tagDetailNew') startNewInternalTagInPanel(activeFolder || 'Temp_Tags');
      else if (id === 'tagDetailHelp') {
        alert(
          'HMI Tag Editor\n\n'
          + 'Types: Digital, Analog, String (FactoryTalk-style).\n\n'
          + '• Digital — on/off memory or device tag\n'
          + '• Analog — Min/Max/Scale/Offset for numeric values\n'
          + '• String — fixed Length field (default 82)\n\n'
          + 'Name format: Folder\\TagName (e.g. Temp_Tags\\Alarm)\n'
          + 'Data Source → Memory for internal tags, Device for PLC addresses.'
        );
      } else if (id === 'tagDetailPrev') {
        const idx = folderDefs.findIndex((d) => d.name === tagsPanelState.selected);
        if (idx > 0) selectTag(folderDefs[idx - 1].name);
      } else if (id === 'tagDetailNext') {
        const idx = folderDefs.findIndex((d) => d.name === tagsPanelState.selected);
        if (idx >= 0 && idx < folderDefs.length - 1) selectTag(folderDefs[idx + 1].name);
      } else if (id === 'tagPanelImportExport') showTagWizardDialog();
      else if (id === 'tagPanelClear') clearAllTagsFromProject().catch((err) => setStatus(`Error: ${err.message}`));
    }, { signal: detailSignal });
  };

  async function saveTagDetailPanel() {
    if (tagsPanelState.mode === 'new') {
      await saveInternalTagFromDetail(null);
      return;
    }
    const def = folderDefs.find((d) => d.name === tagsPanelState.selected);
    if (!def) return;
    if (isInternalTagFolder(def.folder)) {
      await saveInternalTagFromDetail(def.name);
      return;
    }
    const typeEl = document.getElementById('tagDetailType');
    const type = typeEl?.dataset?.type || (typeEl?.tagName === 'SELECT' ? (typeEl.value || def.type) : def.type);
    const description = document.getElementById('tagDetailDescription')?.value ?? '';
    const initialRaw = document.getElementById('tagDetailInitial')?.value;
    const connection = document.getElementById('tagDetailConnection')?.value ?? '';
    const resolved = resolveTagEditorSaveValues(def, type, description, initialRaw, connection);
    const entry = normalizeTagEntry({
      name: def.name,
      type,
      description: resolved.description,
      folder: def.folder || '',
      dataSource: document.querySelector('input[name="tagDetailSource"]:checked')?.value || def.dataSource || 'memory',
      connection: resolved.connection ?? connection,
      plcAddress: isIoDeviceTag(def) ? (resolved.connection ?? connection) : undefined,
      initialValue: resolved.initialValue !== undefined ? resolved.initialValue : initialRaw
    });
    if (!entry) {
      alert('Could not save tag.');
      return;
    }
    const saved = await saveTagToProject(entry, def.name);
    if (!saved) return;
    clearTagDetailFormDirty();
    setStatus(`Saved tag: ${entry.name}`);
    await openTagsPanel(tagsPanelState.folder, entry.name);
  }

  document.querySelectorAll('.tag-folder-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (tagDetailFormIsDirty() && !confirm('You have unsaved tag changes. Switch folder anyway?')) return;
      openTagsPanel(btn.dataset.folder || '').catch((err) => setStatus(`Error: ${err.message}`));
    });
  });

  document.querySelectorAll('.tag-grid-row').forEach((row) => {
    row.addEventListener('click', () => selectTag(row.dataset.tagName));
  });

  wireDetailActions();
  wireDetailFormExtras(activeDef);
  clearTagDetailFormDirty();

  if (activeFolder) highlightExplorerTagFolder(activeFolder);

  setStatus(activeFolder
    ? `Tag Editor — ${activeFolder} (${folderDefs.length})`
    : (allDefs.length ? `Tag Editor (${allDefs.length} tags)` : 'Tag Editor — no tags'));
  } catch (err) {
    console.error('Tag Editor failed:', err);
    panelView.innerHTML = `<div class="panel-content tag-editor-panel">
      <h2>Tag Editor</h2>
      <p class="hint" style="color:#800">Could not open Tag Editor: ${escapeHtml(err.message)}</p>
      <p class="hint">Restart the server (<code>npm start</code>) and hard-refresh (Ctrl+F5).</p>
    </div>`;
    setStatus(`Tag Editor error: ${err.message}`);
  }
}

async function openAlarmsPanel() {
  hidePreviewStage();
  panelView.classList.remove('hidden');
  await refreshProjectConfig();
  const alarms = state.projectConfig?.alarms || [];
  const rows = alarms.map((a, i) =>
    `<tr><td>${escapeHtml(a.tag)}</td><td>${escapeHtml(a.message)}</td><td>P${a.priority ?? 5}</td>`
    + `<td><button type="button" class="btn-link alarm-edit-btn" data-alarm-index="${i}">Edit</button> `
    + `<button type="button" class="btn-link alarm-remove-btn" data-alarm-index="${i}">Remove</button></td></tr>`
  ).join('');
  panelView.innerHTML = `
    <div class="panel-content">
      <h2>Alarm Setup</h2>
      <p class="hint">Alarms are stored in <code>project.json</code> and synced to <code>M_Alarms/alarms.json</code>. Each alarm triggers when its tag is true (1).</p>
      <div class="alarm-panel-toolbar">
        <button type="button" class="dialog-btn" id="alarmPanelNew">New Alarm…</button>
        <button type="button" class="dialog-btn" id="alarmPanelImportExport">Import and Export…</button>
        <button type="button" class="dialog-btn" id="alarmPanelClear" ${alarms.length ? '' : 'disabled'}>Clear All Alarms…</button>
      </div>
      <table class="data-table"><thead><tr><th>Trigger Tag</th><th>Message</th><th>Priority</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4">No alarm definitions — use New Alarm or Import</td></tr>'}</tbody></table>
    </div>`;
  document.getElementById('alarmPanelNew')?.addEventListener('click', () => showAlarmEditDialog(-1));
  document.getElementById('alarmPanelImportExport')?.addEventListener('click', () => showAlarmWizardDialog());
  document.getElementById('alarmPanelClear')?.addEventListener('click', () => {
    clearAllAlarmsFromProject().catch((err) => setStatus(`Error: ${err.message}`));
  });
  panelView.querySelectorAll('.alarm-edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => showAlarmEditDialog(Number(btn.dataset.alarmIndex)));
  });
  panelView.querySelectorAll('.alarm-remove-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeAlarmAtIndex(Number(btn.dataset.alarmIndex)).catch((err) => setStatus(`Error: ${err.message}`));
    });
  });
  if (window.StudioTagTools) StudioTagTools.wirePickButtons();
  setStatus(alarms.length ? `Alarm Setup (${alarms.length})` : 'Alarm Setup — none defined');
}

const alarmWizardState = { step: 1, parsedAlarms: [], fileName: '' };
let alarmEditIndex = -1;

function setAlarmWizardStatus(msg, kind = '') {
  const el = document.getElementById('alarmWizardStatus');
  if (!el) return;
  el.textContent = msg || '';
  el.className = `tag-wizard-status${kind ? ` ${kind}` : ''}`;
}

function getAlarmWizardOp() {
  return document.querySelector('input[name="alarmWizardOp"]:checked')?.value || 'import';
}

function showAlarmWizardStep(step) {
  alarmWizardState.step = step;
  document.querySelectorAll('#alarmWizardDialog [data-alarm-step]').forEach((el) => {
    el.classList.add('hidden');
  });
  const op = getAlarmWizardOp();
  if (step === 1) {
    document.querySelector('#alarmWizardDialog [data-alarm-step="1"]')?.classList.remove('hidden');
    document.getElementById('alarmWizardTitle').textContent = 'Alarm Import Export Wizard — Select Operation';
  } else if (op === 'export') {
    document.querySelector('#alarmWizardDialog [data-alarm-step="2-export"]')?.classList.remove('hidden');
    document.getElementById('alarmWizardTitle').textContent = 'Alarm Import Export Wizard — Export';
    const count = (state.projectConfig?.alarms || []).length;
    document.getElementById('alarmExportCount').textContent = count
      ? `Ready to export ${count} alarm definition(s).`
      : 'No alarms defined in this project.';
  } else {
    document.querySelector('#alarmWizardDialog [data-alarm-step="2-import"]')?.classList.remove('hidden');
    document.getElementById('alarmWizardTitle').textContent = 'Alarm Import Export Wizard — Import';
    updateAlarmImportPreview();
  }
  document.getElementById('alarmWizardBack').disabled = step === 1;
  document.getElementById('alarmWizardNext').hidden = step !== 1;
  document.getElementById('alarmWizardFinish').hidden = step === 1;
  document.getElementById('alarmWizardFinish').textContent = op === 'export' ? 'Export' : 'Import';
}

function normalizeAlarmEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const tag = String(raw.tag || raw.Tag || '').trim();
  const message = String(raw.message || raw.Message || raw.text || '').trim();
  if (!tag || !message) return null;
  let priority = Number(raw.priority ?? raw.Priority ?? 5);
  if (!Number.isFinite(priority)) priority = 5;
  priority = Math.min(15, Math.max(1, Math.round(priority)));
  return { tag, message, priority };
}

function parseAlarmImportJson(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : (data.alarms || []);
  if (!Array.isArray(list)) throw new Error('Expected a JSON array of alarm objects');
  const alarms = [];
  for (const item of list) {
    const norm = normalizeAlarmEntry(item);
    if (norm) alarms.push(norm);
  }
  if (!alarms.length) throw new Error('No valid alarms found (each needs tag and message)');
  return alarms;
}

function updateAlarmImportPreview() {
  const el = document.getElementById('alarmImportPreview');
  if (!el) return;
  const pasted = document.getElementById('alarmImportJson')?.value?.trim();
  let alarms = alarmWizardState.parsedAlarms;
  if (pasted) {
    try {
      alarms = parseAlarmImportJson(pasted);
    } catch (err) {
      el.textContent = err.message;
      el.className = 'tag-wizard-preview error';
      return;
    }
  }
  if (!alarms.length) {
    el.textContent = 'Select a file or paste JSON to preview.';
    el.className = 'tag-wizard-preview';
    return;
  }
  el.textContent = `Found ${alarms.length} alarm(s)${alarmWizardState.fileName ? ` in ${alarmWizardState.fileName}` : ''} — click Import to merge.`;
  el.className = 'tag-wizard-preview ok';
}

function showAlarmWizardDialog() {
  if (!state.activeProject) {
    setStatus('Open an application first');
    return;
  }
  refreshProjectConfig().then(() => {
    document.getElementById('alarmWizardProject').textContent = state.activeProject;
    document.querySelector('input[name="alarmWizardOp"][value="import"]').checked = true;
    document.getElementById('alarmImportJson').value = '';
    document.getElementById('alarmImportFile').value = '';
    document.getElementById('alarmImportFileName').textContent = 'No file selected';
    alarmWizardState.parsedAlarms = [];
    alarmWizardState.fileName = '';
    setAlarmWizardStatus('');
    showAlarmWizardStep(1);
    document.getElementById('alarmWizardDialog').showModal();
  });
}

async function exportProjectAlarms() {
  if (!state.activeProject) return;
  await refreshProjectConfig();
  const alarms = state.projectConfig?.alarms || [];
  const blob = new Blob([JSON.stringify(alarms, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${state.activeProject}_alarms.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  setAlarmWizardStatus(`Exported ${alarms.length} alarm(s)`, 'ok');
  setStatus(`Exported ${alarms.length} alarms`);
}

async function importProjectAlarms(alarms) {
  if (!state.activeProject || !alarms?.length) return;
  await refreshProjectConfig();
  const byTag = new Map((state.projectConfig?.alarms || []).map((a) => [a.tag, { ...a }]));
  let added = 0;
  let updated = 0;
  for (const a of alarms) {
    if (byTag.has(a.tag)) updated += 1;
    else added += 1;
    byTag.set(a.tag, a);
  }
  const merged = [...byTag.values()].sort((x, y) => x.priority - y.priority || x.tag.localeCompare(y.tag));
  await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alarms: merged })
  });
  await refreshProjectConfig();
  setAlarmWizardStatus(`Imported ${alarms.length} alarm(s) — ${added} new, ${updated} updated`, 'ok');
  setStatus(`Imported ${alarms.length} alarms`);
  await openAlarmsPanel();
}

async function removeAlarmAtIndex(index) {
  await refreshProjectConfig();
  const alarms = [...(state.projectConfig?.alarms || [])];
  const alarm = alarms[index];
  if (!alarm) return;
  if (!confirm(`Remove alarm "${alarm.message}" (${alarm.tag})?`)) return;
  alarms.splice(index, 1);
  await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alarms })
  });
  await refreshProjectConfig();
  await openAlarmsPanel();
  setStatus(`Removed alarm: ${alarm.tag}`);
}

async function clearAllAlarmsFromProject() {
  if (!state.activeProject) return;
  await refreshProjectConfig();
  const count = (state.projectConfig?.alarms || []).length;
  if (!count) return;
  if (!confirm(`Clear all ${count} alarm definition(s) from this project?`)) return;
  await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alarms: [] })
  });
  await refreshProjectConfig();
  await openAlarmsPanel();
  setStatus(`Cleared ${count} alarm(s)`);
}

function showAlarmEditDialog(index) {
  alarmEditIndex = index;
  refreshProjectConfig().then(() => {
    const alarms = state.projectConfig?.alarms || [];
    const existing = index >= 0 ? alarms[index] : null;
    document.getElementById('alarmEditTitle').textContent = existing ? 'Edit Alarm Message' : 'New Alarm Message';
    document.getElementById('alarmEditTag').value = existing?.tag || '';
    document.getElementById('alarmEditMessage').value = existing?.message || '';
    document.getElementById('alarmEditPriority').value = existing?.priority ?? 5;
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    document.getElementById('alarmEditDialog').showModal();
  });
}

async function saveAlarmEdit(e) {
  e.preventDefault();
  const entry = normalizeAlarmEntry({
    tag: document.getElementById('alarmEditTag').value,
    message: document.getElementById('alarmEditMessage').value,
    priority: document.getElementById('alarmEditPriority').value
  });
  if (!entry) {
    alert('Tag and message are required.');
    return;
  }
  await refreshProjectConfig();
  const alarms = [...(state.projectConfig?.alarms || [])];
  if (alarmEditIndex >= 0) {
    alarms[alarmEditIndex] = entry;
  } else {
    const dup = alarms.findIndex((a) => a.tag === entry.tag);
    if (dup >= 0) {
      if (!confirm(`Alarm for tag "${entry.tag}" already exists. Replace it?`)) return;
      alarms[dup] = entry;
    } else {
      alarms.push(entry);
    }
  }
  alarms.sort((a, b) => a.priority - b.priority || a.tag.localeCompare(b.tag));
  await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alarms })
  });
  document.getElementById('alarmEditDialog').close();
  await refreshProjectConfig();
  await openAlarmsPanel();
  setStatus(`Saved alarm: ${entry.tag}`);
}

function initAlarmWizardDialog() {
  document.getElementById('alarmWizardNext')?.addEventListener('click', () => showAlarmWizardStep(2));
  document.getElementById('alarmWizardBack')?.addEventListener('click', () => showAlarmWizardStep(1));
  document.getElementById('alarmWizardCancel')?.addEventListener('click', () => {
    document.getElementById('alarmWizardDialog').close();
  });
  document.getElementById('alarmWizardHelp')?.addEventListener('click', () => {
    alert('Alarm Import Export Wizard\n\nExport: download all alarm definitions as JSON.\n\nImport: browse or paste JSON array with tag, message, and priority fields.\n\nAlarms trigger at runtime when the trigger tag value is true (1).');
  });
  document.getElementById('alarmWizardFinish')?.addEventListener('click', () => {
    const op = getAlarmWizardOp();
    if (op === 'export') {
      exportProjectAlarms().catch((err) => setAlarmWizardStatus(err.message, 'error'));
      return;
    }
    const pasted = document.getElementById('alarmImportJson')?.value?.trim();
    let alarms = alarmWizardState.parsedAlarms;
    if (pasted) {
      try {
        alarms = parseAlarmImportJson(pasted);
      } catch (err) {
        setAlarmWizardStatus(err.message, 'error');
        return;
      }
    }
    if (!alarms.length) {
      setAlarmWizardStatus('No alarms to import', 'error');
      return;
    }
    if (!confirm(`Import ${alarms.length} alarm(s) into project "${state.activeProject}"?`)) return;
    importProjectAlarms(alarms)
      .then(() => document.getElementById('alarmWizardDialog').close())
      .catch((err) => setAlarmWizardStatus(err.message, 'error'));
  });
  document.getElementById('alarmBrowseBtn')?.addEventListener('click', () => {
    document.getElementById('alarmImportFile')?.click();
  });
  document.getElementById('alarmImportFile')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      alarmWizardState.parsedAlarms = [];
      alarmWizardState.fileName = '';
      document.getElementById('alarmImportFileName').textContent = 'No file selected';
      updateAlarmImportPreview();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        alarmWizardState.parsedAlarms = parseAlarmImportJson(reader.result);
        alarmWizardState.fileName = file.name;
        document.getElementById('alarmImportFileName').textContent = file.name;
        document.getElementById('alarmImportJson').value = '';
        updateAlarmImportPreview();
      } catch (err) {
        alarmWizardState.parsedAlarms = [];
        setAlarmWizardStatus(err.message, 'error');
      }
    };
    reader.readAsText(file);
  });
  document.getElementById('alarmImportJson')?.addEventListener('input', () => {
    alarmWizardState.parsedAlarms = [];
    alarmWizardState.fileName = '';
    updateAlarmImportPreview();
  });
  document.getElementById('alarmEditForm')?.addEventListener('submit', (e) => {
    saveAlarmEdit(e).catch((err) => setStatus(`Error: ${err.message}`));
  });
  document.getElementById('cancelAlarmEdit')?.addEventListener('click', () => {
    document.getElementById('alarmEditDialog').close();
  });
}

function openSystemPanel(node) {
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

async function openParametersPanel(selectedFile = '') {
  hidePreviewStage();
  panelView.classList.remove('hidden');
  if (!state.activeProject) {
    panelView.innerHTML = '<div class="panel-content"><p>Open an application first.</p></div>';
    return;
  }
  await refreshProjectConfig();
  let merged = {};
  try {
    const res = await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/parameter-files`);
    merged = res.parameterFiles || {};
  } catch {
    merged = state.projectConfig?.parameterFiles || {};
  }
  const names = Object.keys(merged).sort((a, b) => a.localeCompare(b));
  const activeName = selectedFile && merged[selectedFile] ? selectedFile : (names[0] || '');

  const kindLabels = { di: 'PLC DI', do: 'PLC DO', safetyDi: 'Safety DI', safetyDo: 'Safety DO' };
  const kindsInProject = [...new Set(names.map((n) => merged[n]?.kind).filter(Boolean))];

  const formatParamTag = (tag) => String(tag || '').replace(/\./g, '\\');

  const listRange = (name) => {
    const ln = merged[name]?.listNum || 1;
    const ds = (ln - 1) * 8;
    return { ds, de: ds + 7, ln };
  };

  const fileOptionLabel = (name) => {
    const { ds, de } = listRange(name);
    return `${name}  (Data_${String(ds).padStart(2, '0')}–${String(de).padStart(2, '0')})`;
  };

  const buildFileOptions = () => kindsInProject.map((kind) => {
    const groupNames = names.filter((n) => merged[n]?.kind === kind);
    if (!groupNames.length) return '';
    return `<optgroup label="${escapeHtml(kindLabels[kind] || kind)}">
      ${groupNames.map((name) => `<option value="${escapeHtml(name)}"${name === activeName ? ' selected' : ''}>${escapeHtml(fileOptionLabel(name))}</option>`).join('')}
    </optgroup>`;
  }).join('');

  const blockSectionLabel = (block) => {
    if (block === 1) return 'Descriptions — Discr tags (#101–#108)';
    if (block === 2) return 'IO numbers — No tags (#201–#208)';
    if (block === 3) return 'PLC connections — Tags (#301–#308)';
    return `Block #${block}00`;
  };

  const buildTableBody = (name) => {
    const def = merged[name] || {};
    const entries = Object.entries(def.replacements || {}).sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)));
    if (!entries.length) return '<tr><td colspan="2">No mappings</td></tr>';
    let lastBlock = 0;
    const rows = [];
    for (const [key, tag] of entries) {
      const num = Number(String(key).slice(1));
      const isListTitle = key === '#100';
      if (!isListTitle) {
        const block = num >= 300 ? 3 : num >= 200 ? 2 : 1;
        if (block !== lastBlock) {
          rows.push(`<tr class="param-section-row"><td colspan="2">${escapeHtml(blockSectionLabel(block))}</td></tr>`);
          lastBlock = block;
        }
      }
      rows.push(`<tr class="${isListTitle ? 'param-list-title-row' : ''}">
        <td><span class="param-placeholder">${escapeHtml(key)}</span></td>
        <td><input type="text" class="param-tag-input" data-placeholder="${escapeHtml(key)}" value="${escapeHtml(formatParamTag(tag))}" spellcheck="false"${isListTitle ? ' placeholder="List title tag"' : ''} /></td>
      </tr>`);
    }
    return rows.join('');
  };

  const collectReplacements = (fileName) => {
    const def = merged[fileName] || {};
    const replacements = { ...(def.replacements || {}) };
    document.querySelectorAll('.param-tag-input').forEach((input) => {
      const key = input.dataset.placeholder;
      if (!key) return;
      replacements[key] = String(input.value || '').trim().replace(/\\/g, '.');
    });
    return replacements;
  };

  panelView.innerHTML = `
    <div class="panel-content parameters-panel">
      <div class="parameters-header">
        <div>
          <h2>Parameters</h2>
          <p class="parameters-subtitle">Map display placeholders to internal HMI tags for the active IO list.</p>
        </div>
        <span class="parameters-count">${names.length} list${names.length === 1 ? '' : 's'}</span>
      </div>
      <div class="parameters-toolbar">
        <div class="parameters-toolbar-fields">
          <label class="parameters-field">
            <span>Parameter file</span>
            <select id="parametersFileSelect" class="studio-select parameters-file-select">
              ${buildFileOptions() || '<option value="">—</option>'}
            </select>
          </label>
          <label class="parameters-field parameters-field-add">
            <span>Add list</span>
            <select id="parametersAddKind" class="studio-select">
              <option value="di">PLC DI List</option>
              <option value="do">PLC DO List</option>
              <option value="safetyDi">Safety DI List</option>
              <option value="safetyDo">Safety DO List</option>
            </select>
          </label>
        </div>
        <div class="parameters-toolbar-actions">
          <button type="button" class="dialog-btn" id="parametersAddBtn">Add List…</button>
          <button type="button" class="dialog-btn parameters-btn-remove" id="parametersRemoveBtn"${activeName ? '' : ' disabled'}>Remove</button>
          <button type="button" class="dialog-btn primary" id="parametersSaveBtn"${activeName ? '' : ' disabled'}>Apply Mappings</button>
        </div>
      </div>
      <p class="parameters-edit-hint">Edit tag paths in the table, then click <strong>Apply Mappings</strong>. Change descriptions and values in <strong>Tag Editor</strong> (HMI Tags).</p>
      <div class="parameters-table-wrap">
        <table class="parameters-table" id="parametersReplacementTable">
          <thead><tr><th>Placeholder</th><th>Internal HMI Tag</th></tr></thead>
          <tbody>${buildTableBody(activeName)}</tbody>
        </table>
      </div>
    </div>`;

  const renderFile = (name) => {
    const tbody = document.querySelector('#parametersReplacementTable tbody');
    const select = document.getElementById('parametersFileSelect');
    const removeBtn = document.getElementById('parametersRemoveBtn');
    if (select && select.value !== name) select.value = name;
    if (tbody) tbody.innerHTML = buildTableBody(name);
    if (removeBtn) removeBtn.disabled = !name;
  };

  const currentParameterFile = () => document.getElementById('parametersFileSelect')?.value || activeName;
  const parametersSnapshot = () => JSON.stringify(collectReplacements(currentParameterFile()));
  let parametersCurrentFile = activeName;
  let parametersSavedSnapshot = parametersSnapshot();

  document.getElementById('parametersFileSelect')?.addEventListener('change', (e) => {
    if (parametersSnapshot() !== parametersSavedSnapshot) {
      if (!confirm('You have unsaved parameter mappings. Switch file anyway?')) {
        e.target.value = parametersCurrentFile;
        return;
      }
    }
    renderFile(e.target.value);
    parametersCurrentFile = e.target.value;
    parametersSavedSnapshot = parametersSnapshot();
  });

  document.getElementById('parametersSaveBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('parametersFileSelect')?.value;
    if (!name) return;
    try {
      const replacements = collectReplacements(name);
      await fetchJson(
        `/api/projects/${encodeURIComponent(state.activeProject)}/parameter-files/${encodeURIComponent(name)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ replacements })
        }
      );
      setStatus(`Saved mappings: ${name}`);
      parametersSavedSnapshot = JSON.stringify(replacements);
      await refreshProjectConfig();
      await openParametersPanel(name);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  });

  document.getElementById('parametersAddBtn')?.addEventListener('click', async () => {
    const kind = document.getElementById('parametersAddKind')?.value || 'di';
    try {
      const res = await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/parameter-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind })
      });
      setStatus(`Added ${res.added}`);
      await refreshProjectConfig();
      await loadExplorer(state.activeProject);
      await openParametersPanel(res.added);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  });

  document.getElementById('parametersRemoveBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('parametersFileSelect')?.value;
    if (!name || !confirm(`Remove parameter file "${name}"?`)) return;
    try {
      await fetchJson(
        `/api/projects/${encodeURIComponent(state.activeProject)}/parameter-files/${encodeURIComponent(name)}`,
        { method: 'DELETE' }
      );
      setStatus(`Removed ${name}`);
      await refreshProjectConfig();
      await loadExplorer(state.activeProject);
      await openParametersPanel();
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  });

  setStatus(names.length ? `Parameters (${names.length} files)` : 'Parameters — add a list');
}

function runRuntime() {
  if (!state.activeProject) {
    setStatus('Open an application first');
    return;
  }
  const url = `/runtime.html?project=${encodeURIComponent(state.activeProject)}&_=${Date.now()}`;
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
      <p><strong>Communication:</strong> ${escapeHtml(status.communication?.driver || '—')} — ${escapeHtml(status.communication?.connected ? 'Connected' : 'Disconnected')}${status.communication?.plcIpAddress ? ` @ ${escapeHtml(status.communication.plcIpAddress)}` : ''}</p>
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
    const screen = await fetchJson(`/api/runtime/screens/${encodeURIComponent(s.id)}?project=${state.activeProject}&raw=1`);
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
    const screen = await fetchJson(`/api/runtime/screens/${encodeURIComponent(s.id)}?project=${state.activeProject}&raw=1`);
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
  resetTagWizardFileState();
  setTagWizardStatus('');
  switchTagWizardTab('file');
  document.getElementById('tagWizardDialog').showModal();
}

const tagWizardState = {
  parsedTags: [],
  fileName: '',
  format: ''
};

function setTagWizardStatus(message, kind = '') {
  const el = document.getElementById('tagWizardStatus');
  if (!el) return;
  el.textContent = message || '';
  el.className = `tag-wizard-status${kind ? ` ${kind}` : ''}`;
}

function setTagImportPreview(message, kind = '') {
  const el = document.getElementById('tagImportPreview');
  if (!el) return;
  el.textContent = message || '';
  el.className = `tag-wizard-preview${kind ? ` ${kind}` : ''}`;
}

function tagWizardFilterOptions() {
  return {
    controllerOnly: document.getElementById('tagFilterController')?.checked !== false,
    skipProgramTags: document.getElementById('tagFilterController')?.checked !== false,
    boolOnly: document.getElementById('tagFilterBoolOnly')?.checked === true,
    includeIoComments: document.getElementById('tagFilterIoComments')?.checked !== false
  };
}

function resetTagWizardFileState() {
  tagWizardState.parsedTags = [];
  tagWizardState.fileName = '';
  tagWizardState.format = '';
  const fileInput = document.getElementById('tagImportFile');
  if (fileInput) fileInput.value = '';
  const nameEl = document.getElementById('tagImportFileName');
  if (nameEl) nameEl.textContent = 'No file selected';
  setTagImportPreview('Select a file to preview tags before import.');
  const importBtn = document.getElementById('importTagsFileBtn');
  if (importBtn) importBtn.disabled = true;
}

function switchTagWizardTab(tabId) {
  document.querySelectorAll('#tagWizardDialog .dialog-tab[data-tag-tab]').forEach((el) => {
    el.classList.toggle('active', el.dataset.tagTab === tabId);
  });
  document.querySelectorAll('#tagWizardDialog .dialog-tab-panel[data-tag-panel]').forEach((el) => {
    el.classList.toggle('active', el.dataset.tagPanel === tabId);
  });
}

function formatTagImportPreview(parsed) {
  const { tags, stats, format } = parsed;
  const count = tags?.length || 0;
  if (!count) {
    let hint = 'No importable tags found in this file.';
    if (format === 'rslogix' && stats) {
      const skipped = (stats.skippedProgram || 0) + (stats.skippedAlias || 0) + (stats.skippedDatatype || 0);
      if (skipped) {
        hint += ` ${skipped} RSLogix rows were skipped (program tags, aliases, or AB: module types). Try unchecking "Controller tags only" or export BOOL/DINT tags.`;
      }
    } else {
      hint += ' Check that the file matches RSLogix CSV, Tag Name/Type/Description CSV, or JSON tag array format.';
    }
    return { text: hint, kind: 'warn' };
  }

  const parts = [`Found ${count} tag${count === 1 ? '' : 's'}`];
  if (format === 'rslogix' && stats) {
    const detail = [];
    if (stats.controller) detail.push(`${stats.controller} controller`);
    if (stats.program) detail.push(`${stats.program} program`);
    if (stats.ioComments) detail.push(`${stats.ioComments} I/O bits`);
    if (detail.length) parts.push(`(${detail.join(', ')})`);
    const skipped = (stats.skippedProgram || 0) + (stats.skippedAlias || 0) + (stats.skippedDatatype || 0);
    if (skipped) parts.push(`— ${skipped} rows skipped`);
  }
  if (isPlcImportFormat(format)) {
    parts.push(`→ "${PLC_UPLOADED_TAGS_FOLDER}" folder`);
  }
  parts.push(`Import ${count}?`);
  return { text: parts.join(' '), kind: 'ok' };
}

function parseTagWizardFileText(text, fileName) {
  if (!globalThis.RsLogixTags?.parseTagImportFile) {
    throw new Error('RSLogix tag parser not loaded. Refresh the page.');
  }
  return globalThis.RsLogixTags.parseTagImportFile(text, fileName, tagWizardFilterOptions());
}

async function previewTagImportFile(file) {
  const text = await file.text();
  const parsed = parseTagWizardFileText(text, file.name);
  tagWizardState.parsedTags = parsed.tags || [];
  tagWizardState.fileName = file.name;
  tagWizardState.format = parsed.format || '';
  const preview = formatTagImportPreview(parsed);
  setTagImportPreview(preview.text, preview.kind);
  document.getElementById('importTagsFileBtn').disabled = !tagWizardState.parsedTags.length;
  document.getElementById('tagImportFileName').textContent = file.name;
}

function reparseTagWizardFileFromFilters() {
  const fileInput = document.getElementById('tagImportFile');
  const file = fileInput?.files?.[0];
  if (!file) return;
  previewTagImportFile(file).catch((err) => {
    setTagImportPreview(err.message, 'error');
    document.getElementById('importTagsFileBtn').disabled = true;
    tagWizardState.parsedTags = [];
  });
}

async function mergeTagsIntoProject(imported, sourceLabel, options = {}) {
  if (!imported?.length) {
    throw new Error('No tags to import.');
  }
  const importFormat = options.format || tagWizardState.format || '';
  const usesPlcFolder = isPlcImportFormat(importFormat)
    || imported.some((raw) => shouldAssignPlcUploadedFolder(raw, String(raw?.folder || '').trim(), importFormat));
  if (usesPlcFolder) {
    await addTagFolderToProject(PLC_UPLOADED_TAGS_FOLDER);
  }
  await refreshProjectConfig();
  const existing = state.projectConfig?.tags || [];
  const byName = new Map(existing.map((t) => [t.name, t]));
  let added = 0;
  let updated = 0;
  let skippedIo = 0;
  for (const raw of imported) {
    const t = normalizeImportedTag(raw, { format: importFormat });
    if (!t?.name) continue;
    const prev = byName.get(t.name);
    const ioFolder = isIoSystemFolder(t.folder) || isIoSystemFolder(prev?.folder);
    if (ioFolder) {
      skippedIo += 1;
      continue;
    }
    if (prev) updated += 1;
    else added += 1;
    byName.set(t.name, { ...prev, ...t });
  }
  const tags = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags })
  });
  await refreshProjectConfig();
  await loadExplorer(state.activeProject);
  const openFolder = usesPlcFolder ? PLC_UPLOADED_TAGS_FOLDER : tagsPanelState.folder;
  if (panelView?.querySelector('.tag-editor-panel') && !panelView.classList.contains('hidden')) {
    await openTagsPanel(openFolder, tagsPanelState.selected);
  } else if (usesPlcFolder && added + updated > 0) {
    await openTagsPanel(PLC_UPLOADED_TAGS_FOLDER);
  }
  let msg = `Imported ${added + updated} tag${added + updated === 1 ? '' : 's'} from ${sourceLabel} (${added} new, ${updated} updated) — ${tags.length} total`;
  if (usesPlcFolder) msg += ` → folder "${PLC_UPLOADED_TAGS_FOLDER}"`;
  if (skippedIo) msg += ` — ${skippedIo} IO list tag(s) skipped`;
  setTagWizardStatus(msg, 'ok');
  setStatus(msg);
  return { added, updated, total: tags.length, skippedIo };
}

function normalizeImportedTag(raw, options = {}) {
  if (!raw?.name) return null;
  let name = String(raw.name).trim();
  let folder = String(raw.folder || '').trim();
  const format = options.format || '';

  if (!folder && !isPlcImportFormat(format) && !name.includes(':')) {
    if (globalThis.RsLogixTags?.splitHmiTagName) {
      const split = RsLogixTags.splitHmiTagName(name);
      if (split.folder) {
        name = split.name;
        folder = split.folder;
      }
    } else if (name.includes('.')) {
      const idx = name.lastIndexOf('.');
      folder = name.slice(0, idx);
      name = `${folder}.${name.slice(idx + 1)}`;
    }
  }

  if (shouldAssignPlcUploadedFolder(raw, folder, format)) {
    const shortName = folder && name.startsWith(`${folder}.`)
      ? name.slice(folder.length + 1)
      : name;
    folder = PLC_UPLOADED_TAGS_FOLDER;
    name = `${folder}.${shortName}`;
  }

  const plc = String(raw.plcAddress || raw.PLCReference || raw.connection || '').trim();
  const shortName = name.includes('.') ? name.split('.').pop() : name;
  return normalizeTagEntry({
    ...raw,
    name,
    folder,
    connection: raw.connection || plc || shortName,
    plcAddress: raw.plcAddress || plc || shortName,
    dataSource: raw.dataSource || (plc || isPlcImportFormat(format) ? 'device' : undefined)
  });
}

async function importProjectTagsFromFile() {
  const tags = tagWizardState.parsedTags;
  if (!tags.length) return;
  const label = tagWizardState.fileName || 'file';
  const preview = formatTagImportPreview({ tags, format: tagWizardState.format });
  if (!confirm(`${preview.text}\n\nMerge into project "${state.activeProject}"?`)) return;
  await mergeTagsIntoProject(tags, label, { format: tagWizardState.format });
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
  const tags = imported.filter((t) => t?.name);
  if (!tags.length) {
    alert('No valid tag entries in JSON.');
    return;
  }
  if (!confirm(`Import ${tags.length} tag${tags.length === 1 ? '' : 's'} into project "${state.activeProject}"?`)) return;
  await mergeTagsIntoProject(tags, 'JSON paste', { format: 'json' });
}

const gfxWizardState = { step: 0, preselect: null, targets: [], scope: 'all' };

const GFX_WIZARD_TITLES = {
  operation: 'Graphics Import Export Wizard - Operation Type',
  targets: 'Graphics Import Export Wizard - Displays to Export',
  'folder-export': 'Graphics Import Export Wizard - Export Folder',
  'folder-import': 'Graphics Import Export Wizard - Import Folder'
};

function gfxWizardOperation() {
  return document.querySelector('#graphicsImportExportDialog input[name="gfxOperation"]:checked')?.value || 'export';
}

function gfxWizardStepIds() {
  return gfxWizardOperation() === 'import' ? ['operation', 'folder'] : ['operation', 'targets', 'folder'];
}

function gfxWizardVisibleTargets() {
  if (gfxWizardState.scope === 'global-object') {
    return gfxWizardState.targets.filter((t) => t.kind === 'global-object');
  }
  if (gfxWizardState.scope === 'display') {
    return gfxWizardState.targets.filter((t) => t.kind === 'display');
  }
  return gfxWizardState.targets;
}

function renderGfxExportTargetList() {
  const list = document.getElementById('gfxExportTargetList');
  if (!list) return;
  const visible = gfxWizardVisibleTargets();
  list.innerHTML = visible.map((t) => {
    const key = `${t.kind}:${t.id}`;
    const checked = gfxWizardState.preselect
      ? (gfxWizardState.preselect.kind === t.kind && gfxWizardState.preselect.id === t.id)
      : true;
    return `<li><label><input type="checkbox" data-gfx-target="${escapeHtml(key)}" ${checked ? 'checked' : ''} /><span>${escapeHtml(t.label)}</span></label></li>`;
  }).join('');
}

function updateGfxWizardUi() {
  const steps = gfxWizardStepIds();
  const stepId = steps[gfxWizardState.step];
  document.getElementById('gfxWizardTitle').textContent = stepId === 'folder'
    ? GFX_WIZARD_TITLES[gfxWizardOperation() === 'import' ? 'folder-import' : 'folder-export']
    : (GFX_WIZARD_TITLES[stepId] || GFX_WIZARD_TITLES.operation);

  document.querySelectorAll('#graphicsImportExportDialog .gfx-wizard-step').forEach((el) => {
    el.classList.toggle('hidden', el.dataset.gfxStep !== stepId);
  });

  const backBtn = document.getElementById('gfxWizardBack');
  const nextBtn = document.getElementById('gfxWizardNext');
  if (backBtn) backBtn.disabled = gfxWizardState.step === 0;
  if (nextBtn) nextBtn.textContent = gfxWizardState.step >= steps.length - 1 ? 'Finish' : 'Next >';

  const isImport = gfxWizardOperation() === 'import';
  const prompt = document.getElementById('gfxFolderPrompt');
  const naming = document.getElementById('gfxNamingHint');
  if (prompt) {
    prompt.textContent = isImport
      ? 'Select the folder to import graphic information from:'
      : 'Select the folder to export the graphic information to:';
  }
  if (naming) {
    naming.innerHTML = isImport
      ? 'Import reads <code>&lt;display name&gt;.json</code> files from the folder above into this project.'
      : 'The export files will be named according to the following naming convention: <code>&lt;display name&gt;.json</code>';
  }
}

async function showGraphicsImportExportWizard(contextNode = null) {
  if (!state.activeProject) {
    setStatus('Open a project first');
    return;
  }
  gfxWizardState.step = 0;
  gfxWizardState.preselect = null;
  gfxWizardState.scope = 'all';
  if (contextNode?.type === 'display') {
    gfxWizardState.scope = 'display';
    gfxWizardState.preselect = { id: contextNode.id, kind: 'display' };
  } else if (contextNode?.type === 'global-object') {
    gfxWizardState.scope = 'global-object';
    gfxWizardState.preselect = { id: contextNode.id, kind: 'global-object' };
  } else if (contextNode?.id === 'global-objects') {
    gfxWizardState.scope = 'global-object';
  } else if (contextNode?.id === 'displays' || contextNode?.id === 'graphics' || isDisplayCategoryFolder(contextNode)) {
    gfxWizardState.scope = 'display';
  }

  const data = await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/graphics/export-targets`);
  gfxWizardState.targets = data.targets || [];
  document.getElementById('gfxTransferFolder').value = data.defaultFolder || '';
  document.querySelector('#graphicsImportExportDialog input[name="gfxOperation"][value="export"]')?.click();
  renderGfxExportTargetList();
  updateGfxWizardUi();
  document.getElementById('graphicsImportExportDialog').showModal();
}

async function finishGraphicsImportExportWizard() {
  const folder = document.getElementById('gfxTransferFolder')?.value.trim();
  if (!folder) {
    alert('Enter a folder path.');
    return;
  }
  if (gfxWizardOperation() === 'import') {
    const result = await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/graphics/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder })
    });
    document.getElementById('graphicsImportExportDialog').close();
    await loadExplorer(state.activeProject);
    setStatus(`Imported ${result.imported?.length || 0} graphic file(s) from ${folder}`);
    return;
  }

  const items = [];
  document.querySelectorAll('#gfxExportTargetList input[data-gfx-target]:checked').forEach((el) => {
    const [kind, ...rest] = el.dataset.gfxTarget.split(':');
    items.push({ kind, id: rest.join(':') });
  });
  if (!items.length) {
    alert('Select at least one display or global object to export.');
    return;
  }
  const result = await fetchJson(`/api/projects/${encodeURIComponent(state.activeProject)}/graphics/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, items })
  });
  document.getElementById('graphicsImportExportDialog').close();
  setStatus(`Exported ${result.exported?.length || 0} file(s) to ${result.folder}`);
}

function initGraphicsImportExportWizard() {
  document.querySelectorAll('#graphicsImportExportDialog input[name="gfxOperation"]').forEach((el) => {
    el.addEventListener('change', () => {
      gfxWizardState.step = 0;
      updateGfxWizardUi();
    });
  });
  document.getElementById('gfxSelectAllBtn')?.addEventListener('click', () => {
    document.querySelectorAll('#gfxExportTargetList input[data-gfx-target]').forEach((el) => { el.checked = true; });
  });
  document.getElementById('gfxClearAllBtn')?.addEventListener('click', () => {
    document.querySelectorAll('#gfxExportTargetList input[data-gfx-target]').forEach((el) => { el.checked = false; });
  });
  document.getElementById('gfxWizardBack')?.addEventListener('click', () => {
    if (gfxWizardState.step > 0) {
      gfxWizardState.step -= 1;
      updateGfxWizardUi();
    }
  });
  document.getElementById('gfxWizardNext')?.addEventListener('click', () => {
    const steps = gfxWizardStepIds();
    if (gfxWizardState.step >= steps.length - 1) {
      finishGraphicsImportExportWizard().catch((err) => {
        setStatus(`Error: ${err.message}`);
        alert(err.message);
      });
      return;
    }
    gfxWizardState.step += 1;
    updateGfxWizardUi();
  });
  document.getElementById('gfxWizardCancel')?.addEventListener('click', () => {
    document.getElementById('graphicsImportExportDialog').close();
  });
  document.getElementById('gfxWizardHelp')?.addEventListener('click', () => {
    alert('Export copies display and global object JSON files to a folder. Import reads JSON files from a folder into the active project, replacing same-named files.');
  });
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
  const msg = `Exported ${tags.length} tags as JSON`;
  setTagWizardStatus(msg, 'ok');
  setStatus(msg);
}

async function exportProjectTagsCsv() {
  await refreshProjectConfig();
  const tags = [...(state.projectConfig?.tags || [])].sort((a, b) => a.name.localeCompare(b.name));
  const lines = ['Tag Name,Type,Description,PLC Address'];
  for (const t of tags) {
    const desc = String(t.description || '').replace(/"/g, '""');
    const plc = String(t.plcAddress || t.connection || t.alias || '').replace(/"/g, '""');
    lines.push(`"${t.name}","${t.type}","${desc}","${plc}"`);
  }
  const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${state.activeProject}-Tags.CSV`;
  a.click();
  URL.revokeObjectURL(a.href);
  const msg = `Exported ${tags.length} tags as CSV`;
  setTagWizardStatus(msg, 'ok');
  setStatus(msg);
}

function showOptionsDialog() {
  document.getElementById('optStatusBar').checked = state.viewPrefs.statusBar;
  document.getElementById('optExplorer').checked = state.viewPrefs.explorerWindow;
  document.getElementById('optWorkbook').checked = state.viewPrefs.workbookMode;
  document.getElementById('optGridSize').value = state.viewPrefs.gridSizeX || state.viewPrefs.gridSize || 10;
  document.getElementById('optionsDialog').showModal();
}

function saveOptions(e) {
  e.preventDefault();
  state.viewPrefs.statusBar = document.getElementById('optStatusBar').checked;
  state.viewPrefs.explorerWindow = document.getElementById('optExplorer').checked;
  state.viewPrefs.workbookMode = document.getElementById('optWorkbook').checked;
  const grid = Number(document.getElementById('optGridSize').value) || 10;
  state.viewPrefs.gridSize = grid;
  state.viewPrefs.gridSizeX = grid;
  state.viewPrefs.gridSizeY = grid;
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
    case 'alarm-wizard': showAlarmWizardDialog(); break;
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

function isProjectNameTaken(name, excludeId = null) {
  const target = String(name || '').trim().toLowerCase();
  if (!target) return false;
  return state.projects.some((p) =>
    p.id !== excludeId && (p.name || '').trim().toLowerCase() === target
  );
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
    showStartupDialog('existing');
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
      { action: 'import-export', label: 'Import and Export...' },
      { action: 'filter', label: 'Filter...', disabled: true }
    ];
  }

  if (node.type === 'global-object') {
    return [
      { action: 'import-export', label: 'Import and Export...' },
      { separator: true },
      { action: 'delete', label: 'Delete', disabled: true },
      { action: 'remove', label: 'Remove', disabled: true }
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
      { action: 'clear-all-tags', label: 'Clear All Tags...' },
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
      { action: 'import-export', label: 'Import and Export...' },
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
  const hasSelection = getSelectedCanvasIndices().length > 0;
  const items = [];
  if (hasSelection) {
    items.push({ action: 'object-properties', label: 'Properties...' });
    items.push({ separator: true });
  }
  items.push(
    { action: 'display-settings', label: 'Display Settings...' },
    { action: 'key-assignments', label: 'Key Assignments' },
    { separator: true },
    { action: 'paste', label: 'Paste', disabled: true },
    { action: 'paste-no-strings', label: 'Paste without localized strings', disabled: true },
    { separator: true },
    { action: 'show-grid', label: 'Show Grid', checkable: true, checked: state.viewPrefs.showGrid },
    { action: 'snap-on', label: 'Snap To Grid', checkable: true, checked: state.viewPrefs.snapOn },
    { action: 'grid-settings', label: 'Grid Settings...' },
    { separator: true },
    { action: 'zoom-in', label: 'Zoom In' },
    { action: 'zoom-out', label: 'Zoom Out' },
    { action: 'cancel-zoom', label: 'Cancel Zoom', disabled: zoomDefault },
    { separator: true },
    { action: 'unlock-wallpaper', label: 'Unlock All Wallpaper', disabled: true }
  );
  return items;
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
    case 'object-properties':
      const primaryIndex = getPrimaryCanvasSelectionIndex();
      if (primaryIndex != null) {
        openPropertiesForComponent(primaryIndex)
          .catch((err) => setStatus(`Error: ${err.message}`));
      }
      break;
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
      openTagsPanel('Temp_Tags', '', { createNew: true }).catch((err) => setStatus(`Error: ${err.message}`));
      break;
    case 'clear-all-tags':
      clearAllTagsFromProject().catch((err) => setStatus(`Error: ${err.message}`));
      break;
    case 'new-alarm':
      showAlarmEditDialog(-1);
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
      else if (node.id === 'alarms' || node.id === 'alarm-setup') showAlarmWizardDialog();
      else showGraphicsImportExportWizard(node).catch((err) => setStatus(`Error: ${err.message}`));
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
  setStatus(`Opened application: ${id}`);
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
document.getElementById('objectsMenu')?.addEventListener('mousedown', (e) => {
  e.stopPropagation();
});
document.getElementById('objectsMenu')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const btn = e.target.closest('[data-object-id]');
  if (btn && !btn.classList.contains('disabled')) {
    handleObjectAction(btn.dataset.objectId);
    return;
  }
  const submenu = e.target.closest('.has-submenu');
  if (submenu && !submenu.classList.contains('disabled')) {
    document.querySelectorAll('#objectsMenu .has-submenu.submenu-open').forEach((el) => {
      if (el !== submenu) el.classList.remove('submenu-open');
    });
    submenu.classList.toggle('submenu-open');
  }
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
  el.addEventListener('click', () => {
    if (el.classList.contains('disabled')) return;
    handleEditAction(el.dataset.editAction);
  });
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
  state.viewPrefs.showGrid = document.getElementById('gridShowGrid').checked;
  state.viewPrefs.snapOn = document.getElementById('gridSnapToGrid').checked;
  state.viewPrefs.gridColor = document.getElementById('gridColorPicker').value || '#000000';
  state.viewPrefs.gridSizeX = Number(document.getElementById('gridSizeXInput').value) || 10;
  state.viewPrefs.gridSizeY = Number(document.getElementById('gridSizeYInput').value) || 10;
  state.viewPrefs.gridSize = state.viewPrefs.gridSizeX;
  saveViewPrefs();
  applyViewPrefs();
  document.getElementById('gridSettingsDialog').close();
  setStatus(`Grid: ${state.viewPrefs.gridSizeX}×${state.viewPrefs.gridSizeY}px`);
});

document.getElementById('cancelGridSettings').addEventListener('click', () => {
  document.getElementById('gridSettingsDialog').close();
});

document.getElementById('helpGridSettings')?.addEventListener('click', () => {
  alert('Show Grid displays layout guides on the workspace. Snap To Grid aligns objects to grid intersections when placing or moving them.');
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
  exportProjectTags().catch((err) => {
    setTagWizardStatus(`Error: ${err.message}`, 'error');
    setStatus(`Error: ${err.message}`);
  });
});
document.getElementById('exportTagsCsvBtn')?.addEventListener('click', () => {
  exportProjectTagsCsv().catch((err) => {
    setTagWizardStatus(`Error: ${err.message}`, 'error');
    setStatus(`Error: ${err.message}`);
  });
});
document.getElementById('importTagsBtn').addEventListener('click', () => {
  importProjectTags().catch((err) => {
    setTagWizardStatus(`Error: ${err.message}`, 'error');
    setStatus(`Error: ${err.message}`);
    alert(err.message);
  });
});
document.getElementById('importTagsFileBtn').addEventListener('click', () => {
  importProjectTagsFromFile().catch((err) => {
    setTagWizardStatus(`Error: ${err.message}`, 'error');
    setStatus(`Error: ${err.message}`);
    alert(err.message);
  });
});
document.getElementById('tagBrowseBtn')?.addEventListener('click', () => {
  document.getElementById('tagImportFile')?.click();
});
document.getElementById('tagImportFile')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) {
    resetTagWizardFileState();
    return;
  }
  previewTagImportFile(file).catch((err) => {
    setTagImportPreview(err.message, 'error');
    document.getElementById('importTagsFileBtn').disabled = true;
    tagWizardState.parsedTags = [];
  });
});
['tagFilterController', 'tagFilterBoolOnly', 'tagFilterIoComments'].forEach((id) => {
  document.getElementById(id)?.addEventListener('change', () => reparseTagWizardFileFromFilters());
});
document.querySelectorAll('#tagWizardDialog .dialog-tab[data-tag-tab]').forEach((tab) => {
  tab.addEventListener('click', () => switchTagWizardTab(tab.dataset.tagTab));
});
document.getElementById('closeTagWizard').addEventListener('click', () => document.getElementById('tagWizardDialog').close());

document.getElementById('optionsForm').addEventListener('submit', saveOptions);
document.getElementById('cancelOptions').addEventListener('click', () => document.getElementById('optionsDialog').close());

document.getElementById('closeTransfer').addEventListener('click', () => document.getElementById('transferDialog').close());

document.addEventListener('keydown', (e) => {
  if (!isEditableKeyboardTarget(e.target)) {
    handleStudioCanvasKeydown(e);
    if (e.defaultPrevented) return;
  }
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

function runWhenIdle(fn, timeoutMs = 250) {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(fn, { timeout: timeoutMs });
  } else {
    setTimeout(fn, 0);
  }
}

function runDeferredStudioInits() {
  if (state.deferredStudioInitsStarted) return;
  state.deferredStudioInitsStarted = true;

  initDraggableDialogs();
  initExplorerContextMenu();
  initExplorerResizer();
  initWorkspaceContextMenu();
  initCanvasEditOverlay();
  initObjectPlacement();
  if (typeof renderObjectsMenu === 'function') {
    renderObjectsMenu(document.getElementById('objectsMenu'));
  }
  updateUndoRedoUI();

  const dialogInitBatches = [
    [
      initImagePropertiesDialog,
      initImageBrowserDialog,
      initCanvasImagePropertiesDialog,
      initTextPropertiesDialog,
      () => window.StudioNumericDisplay?.initNumericDisplayDialog(),
      () => window.StudioStringDisplay?.initStringDisplayDialog()
    ],
    [
      () => window.StudioStringInput?.initStringInputDialog(),
      () => window.StudioNumericInput?.initNumericInputDialog(),
      () => window.StudioNumericInput?.initNumericInputCursorDialog(),
      initMomentaryButtonDialog,
      initMaintainedButtonDialog,
      () => window.StudioLatchedMultistate?.initLatchedButtonDialog()
    ],
    [
      () => window.StudioLatchedMultistate?.initMultistateButtonDialog(),
      () => window.StudioLatchedMultistate?.initInterlockedButtonDialog(),
      () => window.StudioLatchedMultistate?.initRampButtonDialog(),
      initGotoButtonDialog,
      () => window.StudioReturnToButton?.initReturnToButtonDialog(),
      () => window.StudioCloseDisplayButton?.initCloseDisplayButtonDialog()
    ],
    [
      () => window.StudioDisplayListSelector?.initDisplayListSelectorDialog(),
      () => window.StudioMultistateIndicator?.initMultistateIndicatorDialog(),
      () => window.StudioTimeDateDisplay?.initTimeDateDisplayDialog(),
      () => window.StudioSymbolIndicator?.initSymbolIndicatorDialog(),
      () => window.StudioListIndicator?.initListIndicatorDialog()
    ],
    [
      () => window.StudioBarGraph?.initBarGraphDialog(),
      () => window.StudioRecipePlusButton?.initRecipePlusButtonDialog(),
      () => window.StudioRecipePlusSelector?.initRecipePlusSelectorDialog(),
      () => window.StudioCommunicationsSetup?.initCommunicationsSetupDialog(),
      () => window.StudioShapeProperties?.initShapePropertiesDialog(),
      () => window.StudioFreehandProperties?.initFreehandPropertiesDialog(),
      () => window.StudioEllipseProperties?.initEllipsePropertiesDialog(),
      () => window.StudioArcProperties?.initArcPropertiesDialog(),
      () => window.StudioPanelProperties?.initPanelPropertiesDialog(),
      initAlarmWizardDialog,
      initTagEditDialog,
      initTagFolderDialog,
      () => { if (window.StudioTagTools) StudioTagTools.wirePickButtons(); },
      initDisplayPickerDialog,
      initGraphicsImportExportWizard
    ]
  ];

  state.deferredDialogInitQueue = dialogInitBatches.slice();
  runNextDeferredDialogInitBatch();
}

function runNextDeferredDialogInitBatch() {
  const batch = state.deferredDialogInitQueue?.shift();
  if (!batch) {
    state.deferredStudioInitsDone = true;
    state.deferredDialogInitQueue = null;
    return;
  }
  for (const fn of batch) {
    try { fn(); } catch { /* dialog init optional */ }
  }
  if (!state.deferredDialogInitQueue?.length) {
    state.deferredStudioInitsDone = true;
    state.deferredDialogInitQueue = null;
    return;
  }
  runWhenIdle(runNextDeferredDialogInitBatch, 250);
}

function flushDeferredDialogInits() {
  if (state.deferredStudioInitsDone) return;
  while (state.deferredDialogInitQueue?.length) {
    const batch = state.deferredDialogInitQueue.shift();
    for (const fn of batch) {
      try { fn(); } catch { /* dialog init optional */ }
    }
  }
  state.deferredStudioInitsDone = true;
  state.deferredDialogInitQueue = null;
}

async function init() {
  try {
    exposeStudioGlobals();
    loadViewPrefs();
    initStartupDialog();
    initStudioEmbedBridge();
    initTagFolderDialog();
    initTagEditDialog();
    ensureTagEditorToolbarGlobalWired();
    applyViewPrefs();
    runWhenIdle(runDeferredStudioInits, 400);
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
