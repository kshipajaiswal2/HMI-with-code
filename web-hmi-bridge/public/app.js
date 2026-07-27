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
const projectPlcLogicTagsInput = document.getElementById('projectPlcLogicTagsInput');
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
const addObjectBtn = document.getElementById('addObjectBtn');
const addImageBtn = document.getElementById('addImageBtn');
const addLineBtn = document.getElementById('addLineBtn');
const imageLibraryUploadInput = document.getElementById('imageLibraryUploadInput');
const browseImageBtn = document.getElementById('browseImageBtn');
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
const objImageName = document.getElementById('objImageName');
const objImageNameRow = document.getElementById('objImageNameRow');
const objCaptionRow = document.getElementById('objCaptionRow');
const objBorderColorRow = document.getElementById('objBorderColorRow');
const objLinePropsRow = document.getElementById('objLinePropsRow');
const objLineWidth = document.getElementById('objLineWidth');
const objLineStyle = document.getElementById('objLineStyle');
const objLineBackStyle = document.getElementById('objLineBackStyle');
const objGotoPropsRow = document.getElementById('objGotoPropsRow');
const objGotoDisplay = document.getElementById('objGotoDisplay');
const objIndicatorPropsRow = document.getElementById('objIndicatorPropsRow');
const objIndicatorShape = document.getElementById('objIndicatorShape');
const objIndicatorBorderStyle = document.getElementById('objIndicatorBorderStyle');
const objIndicatorBorderWidth = document.getElementById('objIndicatorBorderWidth');
const objPolygonPropsRow = document.getElementById('objPolygonPropsRow');
const objPolygonPoints = document.getElementById('objPolygonPoints');
const objTextPropsRow = document.getElementById('objTextPropsRow');
const objTextAlignment = document.getElementById('objTextAlignment');
const objTextWordWrap = document.getElementById('objTextWordWrap');
const addGotoDisplayBtn = document.getElementById('addGotoDisplayBtn');
const addTextBtn = document.getElementById('addTextBtn');
const addMsiRectBtn = document.getElementById('addMsiRectBtn');
const addMsiCircleBtn = document.getElementById('addMsiCircleBtn');
const addPolygonBtn = document.getElementById('addPolygonBtn');
const objFontRow = document.getElementById('objFontRow');
const objTextColorLabel = document.getElementById('objTextColorLabel');
const objLeftLabel = document.querySelector('label[for="objLeft"]');
const objTopLabel = document.querySelector('label[for="objTop"]');
const objWidthLabel = document.querySelector('label[for="objWidth"]');
const objHeightLabel = document.querySelector('label[for="objHeight"]');
const imageLibraryOptions = document.getElementById('imageLibraryOptions');
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
let previewZoomLevel = 1;
let previewRefitFrame = null;
let persistXmlDebounceTimer = null;
let serverProjectSaveTimer = null;
let lineDrawState = null;
let suppressPreviewCanvasClick = false;

let selectedDisplay = '';
let selectedFiles = [];
let selectedObjectIndex = null;
let selectedObjectName = null;
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
const HISTORY_LIMIT = 100;
let historyPast = [];
let historyFuture = [];
let applyingHistory = false;
let bridgeDisplayFileNames = [];
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
// Object defaults taken from hmi/import_templates/1Home.xml
const HOME_OBJECT_TEMPLATE_XML = `<gfx>
<text name="Text40" height="16" width="45" left="867" top="357" visible="true" wallpaper="false" isReferenceObject="false" backStyle="transparent" backColor="white" foreColor="black" wordWrap="true" sizeToFit="true" alignment="middleCenter" fontFamily="Arial" charHeight="16" charWidth="7" bold="true" italic="false" underline="false" strikethrough="false" caption="Text Label"/>
<gotoButton name="GotoDisplayButton2" height="45" width="85" left="10" top="85" visible="true" wallpaper="false" isReferenceObject="false" audio="true" backColor="#E0E0E0" backStyle="solid" borderStyle="raised" borderUsesBackColor="false" borderWidth="4" description="" highlightColor="lime" borderColor="silver" patternColor="white" patternStyle="none" horizontalMargin="0" verticalMargin="0" shape="rectangle" touch="true" blink="false" displayPosition="false" displayLeftPosition="0" displayTopPosition="0" UseVariableDisplay="false" UseVariableDisplayPosition="false" display="101 Production" parameterFile="" parameterList="" parameterType="parameterFile" captionOnBorder="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight"><caption fontFamily="Arial" fontSize="10" bold="true" italic="false" underline="false" strikethrough="false" caption="Production" color="black" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="false" blink="false"/><imageSettings imageName="" alignment="middleCenter" backStyle="transparent" color="white" backColor="navy" scaled="false" blink="false"/></gotoButton>
<multistateIndicator name="MultistateIndicator2" height="36" width="80" left="836" top="32" visible="true" wallpaper="false" isReferenceObject="false" backStyle="solid" borderStyle="raised" borderUsesBackColor="true" borderWidth="1" description="" shape="rectangle" triggerType="value" currentStateId="1" captionOnBorder="false" setLastStateId="2"><states><state stateId="0" value="0" backColor="#F83D3D" borderColor="#F83D3D" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight"><caption fontFamily="Arial" fontSize="9" bold="true" italic="false" underline="false" strikethrough="false" caption="Fault" color="black" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="false" blink="false"/></state><state stateId="1" value="1" backColor="lime" borderColor="lime" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight"><caption fontFamily="Arial" fontSize="9" bold="true" italic="false" underline="false" strikethrough="false" caption="Healthy" color="black" backColor="navy" backStyle="transparent" alignment="middleCenter" wordWrap="false" blink="false"/></state></states></multistateIndicator>
<multistateIndicator name="MultistateIndicator12" height="22" width="22" left="385" top="415" visible="true" wallpaper="false" isReferenceObject="false" backStyle="solid" borderStyle="line" borderUsesBackColor="true" borderWidth="1" description="" shape="circle" triggerType="value" currentStateId="0" captionOnBorder="false" setLastStateId="3"><states><state stateId="0" value="0" backColor="#C6C6C6" borderColor="#C6C6C6" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight"/><state stateId="1" value="1" backColor="#10EB10" borderColor="#10EB10" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight"/><state stateId="2" value="2" backColor="#F83D3D" borderColor="#F83D3D" patternColor="white" patternStyle="none" blink="false" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight"/></states></multistateIndicator>
<rectangle name="Polygon1" height="73" width="160" left="0" top="0" visible="true" wallpaper="false" isReferenceObject="false" backStyle="solid" backColor="white" foreColor="black" lineStyle="solid" lineWidth="1" patternStyle="none" patternColor="#E0E0E0" endColor="white" gradientStop="50" gradientDirection="gradientDirectionHorizontal" gradientShadingStyle="gradientHorizontalFromRight"/>
</gfx>`;
let homeTemplateRoot = null;
const SIDEBAR_STORAGE_KEY = 'displayXmlBridge.sidebarCollapsed';
const DOCK_STORAGE_KEY = 'displayXmlBridge.toolsDockCollapsed';
const SIDEBAR_MODE_STORAGE_KEY = 'displayXmlBridge.sidebarMode';
const PROJECT_NAME_STORAGE_KEY = 'displayXmlBridge.projectName';
const PROJECTS_STORAGE_KEY = 'displayXmlBridge.projects';
const ACTIVE_PROJECT_STORAGE_KEY = 'displayXmlBridge.activeProjectId';
const ACTIVE_PROJECT_SCREEN_STORAGE_KEY = 'displayXmlBridge.activeProjectScreenKey';
const SIDEBAR_MODE_DISPLAYS = 'displays';
const SIDEBAR_MODE_DEFAULTS = 'defaults';
const UNGROUPED_FOLDER_NAME = 'Ungrouped';
const PREVIEW_ZOOM_STORAGE_KEY = 'displayXmlBridge.previewZoom';
const PREVIEW_ZOOM_MIN = 0.5;
const PREVIEW_ZOOM_MAX = 4;
const PREVIEW_ZOOM_STEP = 0.1;
const POPUP_GROUP_PREFIX = 'WB_POPUP';
const SCREEN_SIZE_PRESETS = {
  '800x600': { width: 800, height: 600 },
  '1280x800': { width: 1280, height: 800 },
  '1024x768': { width: 1024, height: 768 }
};
let sidebarMode = SIDEBAR_MODE_DISPLAYS;
let currentProjectName = normalizeProjectName(localStorage.getItem(PROJECT_NAME_STORAGE_KEY) || 'Untitled Project');
let projectList = [];
let activeProjectId = localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY) || '';
let activeProjectFolder = '';
let activeProjectScreen = '';
let activeProjectCsvKey = '';
let activeIoListFileKey = '';
let pendingCsvUpload = null;
let pendingIoListUpload = null;
let pendingPlcLogicTagsUpload = null;
let activeProjectKey = '';
let currentPreviewIoProject = null;

previewZoomLevel = loadPreviewZoomLevel();

function displayKey(name) {
  return String(name || '').toLowerCase();
}

const IO_LIST_SCREEN_FILE = '303_IO_List.xml';
const IO_DO_LIST_SCREEN_FILE = '410_PLC IO List.xml';
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

function parseProjectKey(key) {
  const parts = String(key || '').split('::');
  if (parts.length < 3) {
    return null;
  }

  const screenName = parts.pop();
  const projectId = parts.shift();
  const folderName = parts.join('::');
  if (!projectId || !folderName || !screenName) {
    return null;
  }

  return { projectId, folderName, screenName };
}

function persistActiveProjectScreenKey() {
  if (activeProjectKey) {
    localStorage.setItem(ACTIVE_PROJECT_SCREEN_STORAGE_KEY, activeProjectKey);
    return;
  }

  localStorage.removeItem(ACTIVE_PROJECT_SCREEN_STORAGE_KEY);
}

function clearActiveProjectScreenKey() {
  localStorage.removeItem(ACTIVE_PROJECT_SCREEN_STORAGE_KEY);
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
  project.plcLogicTagsFiles = Array.isArray(project.plcLogicTagsFiles) ? project.plcLogicTagsFiles : [];
  project.tagsCollapsed = Boolean(project.tagsCollapsed);
  project.parametersCollapsed = Boolean(project.parametersCollapsed);
  project.ioListCollapsed = Boolean(project.ioListCollapsed);
  project.ioListPreviewPage = Math.max(1, Number(project.ioListPreviewPage) || 1);
  if (project.ioListPreviewZone === undefined) {
    project.ioListPreviewZone = String(project.ioListPreviewZone || '');
  }
  project.ioListPreviewZone = String(project.ioListPreviewZone || '');
  if (project.tagsExportZone === undefined) {
    project.tagsExportZone = '';
  }
  project.tagsExportZone = String(project.tagsExportZone || '');
  if (project.ioListEditorFilter === undefined) {
    project.ioListEditorFilter = 'IO';
  }
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

  migrateGeneratedTagsFromSidebar(project);
  clearInvalidGeneratedTagsExport(project);

  for (const list of [project.tagsFiles, project.parametersFiles, project.ioListFiles, project.plcLogicTagsFiles]) {
    for (const file of list) {
      file.id = String(file.id || `csv-${Date.now()}-${Math.random().toString(16).slice(2)}`);
      file.name = String(file.name || 'data.csv');
      file.content = String(file.content || '');
      file.lastModified = String(file.lastModified || new Date().toISOString());
      file.sizeBytes = Number.isFinite(Number(file.sizeBytes))
        ? Number(file.sizeBytes)
        : new Blob([file.content]).size;
      if (list === project.ioListFiles && !Array.isArray(file.sheetData)) {
        file.sheetData = [];
      }
    }
  }

  if (project.ioListMeta?.sourceSheets?.length && !(project.ioListSheets || []).length) {
    project.ioListSheets = project.ioListMeta.sourceSheets;
  }

  for (const file of project.ioListFiles || []) {
    if (!file.sheetData?.length && project.ioListMeta?.sourceSheets?.length) {
      file.sheetData = project.ioListMeta.sourceSheets;
    }
  }
}

function normalizeIoListEditorFilter(value) {
  const key = String(value || 'IO').toUpperCase();
  if (key === 'DO' || key === 'SDO') {
    return 'DO';
  }
  if (key === 'IO' || key === 'SDI' || key === 'DI' || key === 'ALL') {
    return 'IO';
  }
  return 'IO';
}

function shouldShowIoListEditorKind(project, kind) {
  const filter = normalizeIoListEditorFilter(project?.ioListEditorFilter);
  const kindKey = String(kind || '').toUpperCase();
  if (filter === 'IO') {
    return kindKey === 'SDI' || kindKey === 'DI' || kindKey === 'OTHER';
  }
  if (filter === 'DO') {
    return kindKey === 'SDO' || kindKey === 'DO';
  }
  return true;
}

function isGenericIoListZoneName(zone) {
  const key = displayKey(String(zone || '').trim());
  return !key || key === 'io' || key === 'do' || key === 'iolist';
}

function normalizeIoListZoneNames(zones) {
  const list = Array.isArray(zones)
    ? zones.map((zone) => String(zone || '').trim()).filter(Boolean)
    : [];
  const meaningful = list.filter((zone) => !isGenericIoListZoneName(zone));
  return meaningful.length ? meaningful : [];
}

function isIoGeneratedTagsFileName(name) {
  return /-Tags\.CSV$/i.test(String(name || ''));
}

function isValidFactoryTalkZoneTagsCsv(content) {
  if (!globalThis.IoTags?.validateFactoryTalkZoneTagsCsv) {
    return String(content || '').includes('"F","PLC_DI_Discr"');
  }
  return globalThis.IoTags.validateFactoryTalkZoneTagsCsv(String(content || '').replace(/^\uFEFF/, '')).ok;
}

function clearInvalidGeneratedTagsExport(project) {
  if (!project?.generatedTagsExport) {
    return;
  }
  const stats = project.generatedTagsExport.stats;
  if (stats && stats.ok === false) {
    project.generatedTagsExport = null;
  }
  if (project.generatedTagsExport?.content && !isValidFactoryTalkZoneTagsCsv(project.generatedTagsExport.content)) {
    project.generatedTagsExport = null;
  }
  if (project.generatedTagsExport?.content) {
    delete project.generatedTagsExport.content;
  }
}

function migrateGeneratedTagsFromSidebar(project) {
  if (!project?.tagsFiles?.length) {
    return;
  }
  if (!project.ioListFiles?.length && !project.ioListMeta) {
    return;
  }

  const generated = project.tagsFiles.filter(
    (file) => isIoGeneratedTagsFileName(file.name) && String(file.content || '').trim()
  );
  if (!generated.length) {
    return;
  }

  if (!project.generatedTagsExport) {
    const latest = generated.sort(
      (a, b) => String(b.lastModified || '').localeCompare(String(a.lastModified || ''))
    )[0];
    if (isValidFactoryTalkZoneTagsCsv(latest.content)) {
      project.generatedTagsExport = {
        zone: String(project.tagsExportZone || project.ioListPreviewZone || '').trim(),
        name: latest.name,
        lastModified: latest.lastModified,
        stats: globalThis.IoTags?.validateFactoryTalkZoneTagsCsv?.(latest.content) || null
      };
    }
  }

  project.tagsFiles = project.tagsFiles.filter((file) => !isIoGeneratedTagsFileName(file.name));
}

function getProjectManualTagsFiles(project) {
  ensureProjectCsvData(project);
  return (project.tagsFiles || []).filter((file) => !isIoGeneratedTagsFileName(file.name));
}

function resolveTagsExportZone(project, zones = []) {
  return resolveIoListEditorZone(project, normalizeIoListZoneNames(zones));
}

function getProjectZoneTagsParsed(project, zone = '') {
  if (!project || !globalThis.IoTags?.buildParsedForZoneExport) {
    return getProjectIoTagsParsed(project);
  }

  const sheets = getProjectIoListSheets(project);
  const zones = project?.ioListMeta?.zones || sheets.map((sheet) => sheet.zone).filter(Boolean);
  const targetZone = String(zone || resolveIoListEditorZone(project, zones)).trim();
  if (!targetZone || !sheets.length) {
    return getProjectIoTagsParsed(project);
  }

  try {
    return globalThis.IoTags.buildParsedForZoneExport(sheets, targetZone, {
      zoneRioModules: getProjectZoneRioModules(project),
      manualZoneRioModules: getProjectManualZoneRioModules(project),
      projectName: project?.name || ''
    });
  } catch (_err) {
    return getProjectIoTagsParsed(project);
  }
}

function syncProjectZoneOutputs(project, zone = '', options = {}) {
  if (!project || !globalThis.IoTags) {
    return null;
  }

  const sheets = getProjectIoListSheets(project);
  const zones = project?.ioListMeta?.zones || sheets.map((sheet) => sheet.zone).filter(Boolean);
  const activeZone = String(zone || resolveIoListEditorZone(project, zones)).trim();
  if (!activeZone || !sheets.length) {
    return null;
  }

  project.ioListPreviewZone = activeZone;
  project.tagsExportZone = activeZone;

  const zoneParsed = getProjectZoneTagsParsed(project, activeZone);
  regenerateProjectTagsCsvForZone(project, activeZone, { save: false });
  upsertGeneratedParameterFiles(project, zoneParsed, activeZone);

  if (options.save !== false) {
    saveProjectList();
  }

  return activeZone;
}

function buildTagsCsvExportName(project, zone) {
  const projectName = String(project?.name || 'Project').trim() || 'Project';
  const projectSlug = projectName.replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'Project';
  const zoneSlug = String(zone || 'General').trim().replace(/[^\w.-]+/g, '_').replace(/_+/g, '_') || 'General';
  return `${projectSlug}-${zoneSlug}-Tags`;
}

function buildProjectTagsCsvForZone(project, zone) {
  if (!project || !globalThis.IoTags?.buildZoneTagsCsv) {
    throw new Error('Tags export is not available.');
  }

  mergeVisibleIoListSheetEdits(project);

  const sheets = getProjectIoListSheets(project);
  if (!sheets.length) {
    throw new Error('Upload the Master Sheet under IO List first.');
  }

  const exportZone = resolveTagsExportZone(project, project.ioListMeta?.zones || sheets.map((sheet) => sheet.zone));
  const targetZone = String(zone || exportZone || '').trim();
  if (!targetZone) {
    throw new Error('Choose an export zone first.');
  }

  return globalThis.IoTags.buildZoneTagsCsv(sheets, targetZone, {
    zoneRioModules: getProjectZoneRioModules(project),
    manualZoneRioModules: getProjectManualZoneRioModules(project),
    projectName: project?.name || ''
  });
}

function regenerateProjectTagsCsvForZone(project, zone, options = {}) {
  const zones = project?.ioListMeta?.zones
    || getProjectIoListSheets(project).map((sheet) => sheet.zone).filter(Boolean);
  const exportZone = String(zone || resolveTagsExportZone(project, zones)).trim();
  if (!exportZone) {
    throw new Error('Choose an export zone first.');
  }

  const csvContent = buildProjectTagsCsvForZone(project, exportZone);
  const sourceName = buildTagsCsvExportName(project, exportZone);
  project.tagsExportZone = exportZone;
  upsertGeneratedTagsCsv(project, csvContent, sourceName);

  if (options.save !== false) {
    saveProjectList();
  }

  return { zone: exportZone, fileName: `${sourceName}.CSV`, csvContent };
}

function getProjectManualZoneRioModules(project) {
  return project?.ioListMeta?.manualZoneRioModules || {};
}

function getProjectZoneRioModules(project) {
  const base = project?.ioListMeta?.zoneRioModules
    || project?.ioTagsParsed?.meta?.zoneRioModules
    || {};
  const manual = getProjectManualZoneRioModules(project);
  if (!Object.keys(manual).length) {
    return Object.keys(base).length ? base : null;
  }
  return { ...base, ...manual };
}

function getPlcRioModuleOptions(project) {
  const plcLogicFile = getProjectPlcLogicTagsFile(project);
  const rsLogixText = String(plcLogicFile?.content || '').trim();
  if (rsLogixText && globalThis.IoTags?.parseRsLogixTagsCsv && globalThis.IoTags?.listRioModulesFromPlcEntries) {
    const parsed = globalThis.IoTags.parseRsLogixTagsCsv(rsLogixText);
    return globalThis.IoTags.listRioModulesFromPlcEntries(parsed.entries);
  }
  return globalThis.IoTags?.listRioModulesFromPlcEntries?.([], 6) || [1, 2, 3, 4, 5, 6];
}

function collectIoListZoneSetupRows(panel) {
  const rows = [];
  for (const tr of panel.querySelectorAll('[data-zone-setup-row]')) {
    rows.push({
      sheetName: String(tr.dataset.sheetName || '').trim(),
      zone: String(tr.querySelector('[data-zone-setup-name]')?.value || '').trim(),
      rioModule: Number.parseInt(tr.querySelector('[data-zone-setup-rio]')?.value || '', 10)
    });
  }
  return rows;
}

function applyIoListZoneSetup(project, file, setupRows, options = {}) {
  if (!project || !globalThis.IoTags?.applyZoneSetupToSheets) {
    throw new Error('Zone setup is not available.');
  }

  const sheets = getProjectIoListSheets(project, file);
  if (!sheets.length) {
    throw new Error('Upload a Master Sheet Excel file first.');
  }

  const { sheets: nextSheets, zoneRioModules, zones } = globalThis.IoTags.applyZoneSetupToSheets(
    sheets.map((sheet) => ({ ...sheet })),
    setupRows
  );

  project.ioListMeta = {
    ...(project.ioListMeta || {}),
    zones,
    manualZoneRioModules: zoneRioModules,
    zoneRioModules
  };
  syncIoListSheetDataToFile(project, file, nextSheets);

  let parsed = globalThis.IoTags.rebuildParsedFromMasterSheets(nextSheets, {
    zoneRioModules
  });
  parsed.meta = {
    ...(parsed.meta || {}),
    ...(project.ioListMeta || {}),
    sourceSheets: nextSheets,
    manualZoneRioModules: zoneRioModules,
    zoneRioModules
  };

  if (getProjectPlcLogicTagsFile(project)) {
    const rematched = globalThis.IoTags.applyPlcTagsToParsed(parsed, getProjectPlcLogicTagsFile(project).content);
    parsed = rematched.parsed;
    project.ioListMeta = {
      ...(parsed.meta || {}),
      manualZoneRioModules: zoneRioModules
    };
    syncIoListSheetDataToFile(project, file, parsed.meta?.sourceSheets || nextSheets);
  }

  project.ioTagsParsed = parsed;
  if (file) {
    file.content = globalThis.IoTags.formatMasterSheetSummary(parsed, file.name);
    file.sizeBytes = new Blob([file.content]).size;
    file.lastModified = new Date().toISOString();
  }

  syncProjectZoneOutputs(project, project.ioListPreviewZone, { save: false });

  const currentZone = String(project.ioListPreviewZone || '').trim();
  if (currentZone && !zones.some((zone) => displayKey(zone) === displayKey(currentZone))) {
    project.ioListPreviewZone = zones[0] || '';
  }

  if (options.save !== false) {
    saveProjectList();
  }

  return { zones, zoneRioModules };
}

function appendIoListZoneSetupPanel(parent, project, file, sheets, zoneRioModules, rerenderIoListEditor) {
  if (!sheets.length || !globalThis.IoTags?.buildZoneSetupRows) {
    return;
  }

  const manualMap = getProjectManualZoneRioModules(project);
  const setupRows = globalThis.IoTags.buildZoneSetupRows(sheets, { ...zoneRioModules, ...manualMap });
  const rioOptions = getPlcRioModuleOptions(project);
  const panelOpen = project.ioListZoneSetupOpen === true;

  const panel = document.createElement('section');
  panel.className = 'io-list-zone-setup';

  const header = document.createElement('div');
  header.className = 'io-list-zone-setup-header';

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'io-list-zone-setup-toggle';
  toggleBtn.textContent = panelOpen ? 'Hide Zone Setup' : 'Zone Setup';
  toggleBtn.title = 'Assign each Excel sheet to a zone name and RIO module (RIO01, RIO02, …)';

  const hint = document.createElement('span');
  hint.className = 'io-list-zone-setup-hint';
  hint.textContent = 'Pick zone names and RIO modules for each IO List sheet.';

  header.appendChild(toggleBtn);
  header.appendChild(hint);
  panel.appendChild(header);

  const body = document.createElement('div');
  body.className = 'io-list-zone-setup-body';
  body.hidden = !panelOpen;

  const table = document.createElement('table');
  table.className = 'io-list-zone-setup-table';
  table.innerHTML = '<thead><tr><th>Excel Sheet</th><th>Zone Name</th><th>RIO Module</th></tr></thead>';
  const tbody = document.createElement('tbody');

  for (const row of setupRows) {
    const tr = document.createElement('tr');
    tr.dataset.zoneSetupRow = '1';
    tr.dataset.sheetName = row.sheetName;

    const sheetCell = document.createElement('td');
    sheetCell.textContent = row.sheetName;
    sheetCell.title = row.sheetName;

    const zoneCell = document.createElement('td');
    const zoneInput = document.createElement('input');
    zoneInput.type = 'text';
    zoneInput.className = 'io-list-zone-setup-name';
    zoneInput.dataset.zoneSetupName = '1';
    zoneInput.value = row.zone;
    zoneInput.placeholder = 'Zone name';
    zoneCell.appendChild(zoneInput);

    const rioCell = document.createElement('td');
    const rioSelect = document.createElement('select');
    rioSelect.className = 'io-list-zone-setup-rio';
    rioSelect.dataset.zoneSetupRio = '1';
    const selectedRio = Number.parseInt(row.rioModule, 10) || 1;
    for (const rioModule of rioOptions) {
      const option = document.createElement('option');
      option.value = String(rioModule);
      option.textContent = globalThis.IoTags.formatRioModuleLabel(rioModule);
      option.selected = rioModule === selectedRio;
      rioSelect.appendChild(option);
    }
    if (!rioOptions.includes(selectedRio)) {
      const customOption = document.createElement('option');
      customOption.value = String(selectedRio);
      customOption.textContent = globalThis.IoTags.formatRioModuleLabel(selectedRio);
      customOption.selected = true;
      rioSelect.appendChild(customOption);
    }
    rioCell.appendChild(rioSelect);

    tr.appendChild(sheetCell);
    tr.appendChild(zoneCell);
    tr.appendChild(rioCell);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  body.appendChild(table);

  const actions = document.createElement('div');
  actions.className = 'io-list-zone-setup-actions';

  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.className = 'io-list-editor-apply-btn';
  applyBtn.textContent = 'Apply Zone Setup';
  applyBtn.addEventListener('click', () => {
    try {
      mergeVisibleIoListSheetEdits(project);
      applyIoListZoneSetup(project, file, collectIoListZoneSetupRows(panel));
      rerenderIoListEditor();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not apply zone setup.');
    }
  });
  actions.appendChild(applyBtn);
  body.appendChild(actions);
  panel.appendChild(body);

  toggleBtn.addEventListener('click', () => {
    body.hidden = !body.hidden;
    project.ioListZoneSetupOpen = !body.hidden;
    toggleBtn.textContent = body.hidden ? 'Zone Setup' : 'Hide Zone Setup';
    saveProjectList();
  });

  parent.appendChild(panel);
}

function formatIoListZoneLabel(zone, rioModule) {
  const zoneName = String(zone || '').trim();
  const rioLabel = globalThis.IoTags?.formatRioModuleLabel?.(rioModule);
  if (zoneName && rioLabel && !isGenericIoListZoneName(zoneName)) {
    return `${zoneName} (${rioLabel})`;
  }
  if (rioLabel && !zoneName) {
    return rioLabel;
  }
  return zoneName || 'General';
}

function buildIoListZoneOptions(zones, zoneRioModules) {
  const list = normalizeIoListZoneNames(zones);
  if (!list.length) {
    return [{ value: '', zone: '', rioModule: 1, label: 'General' }];
  }
  return list.map((zone) => ({
    value: zone,
    zone,
    rioModule: zoneRioModules?.[zone] || null,
    label: formatIoListZoneLabel(zone, zoneRioModules?.[zone])
  }));
}

function buildIoListViewOptions() {
  return [
    { value: 'IO', side: 'IO', label: 'Inputs (SDI + DI)' },
    { value: 'DO', side: 'DO', label: 'Outputs (SDO + DO)' }
  ];
}

function formatIoListZoneSideLabel(zone, side, zoneRioModules) {
  const zoneName = String(zone || '').trim();
  const sideLabel = side === 'DO' ? 'Outputs' : 'Inputs';
  if (!zoneName || isGenericIoListZoneName(zoneName)) {
    return sideLabel;
  }
  return `${formatIoListZoneLabel(zoneName, zoneRioModules?.[zoneName])} — ${sideLabel}`;
}

function formatIoListSectionTitle(zone, side, zoneRioModules) {
  return `${formatIoListZoneSideLabel(zone, side, zoneRioModules)} List`;
}

function buildIoListZoneSideOptions(zones, zoneRioModules) {
  const zoneOptions = buildIoListZoneOptions(zones, zoneRioModules);
  const viewOptions = buildIoListViewOptions();
  const options = [];
  for (const zoneOption of zoneOptions) {
    for (const viewOption of viewOptions) {
      options.push({
        value: zoneOption.zone ? `${zoneOption.zone}::${viewOption.side}` : viewOption.side,
        zone: zoneOption.zone,
        side: viewOption.side,
        rioModule: zoneOption.rioModule,
        label: formatIoListZoneSideLabel(zoneOption.zone, viewOption.side, zoneRioModules)
      });
    }
  }
  return options;
}

function getIoListEditorSelection(project, zones, zoneRioModules) {
  const list = normalizeIoListZoneNames(zones);
  const options = buildIoListZoneSideOptions(zones, zoneRioModules);
  const side = normalizeIoListEditorFilter(project?.ioListEditorFilter);
  const zone = resolveIoListEditorZone(project, list);
  const preferredValue = list.length ? `${zone}::${side}` : side;
  return options.find((option) => displayKey(option.value) === displayKey(preferredValue))
    || options.find((option) => displayKey(option.zone) === displayKey(zone) && option.side === side)
    || options.find((option) => displayKey(option.zone) === displayKey(zone))
    || options[0];
}

function applyIoListEditorSelection(project, selection) {
  if (!project || !selection) {
    return;
  }
  const zone = String(selection.zone || '').trim();
  project.ioListPreviewZone = isGenericIoListZoneName(zone) ? '' : zone;
  project.ioListEditorFilter = selection.side || 'IO';
}

function appendIoListEditorZoneControls(toolbar, project, zones, zoneRioModules, rerenderIoListEditor) {
  const zoneOptions = buildIoListZoneOptions(zones, zoneRioModules);
  const viewOptions = buildIoListViewOptions();
  const current = getIoListEditorSelection(project, zones, zoneRioModules);
  applyIoListEditorSelection(project, current);

  const zoneLabel = document.createElement('label');
  zoneLabel.className = 'io-list-editor-zone-label';
  zoneLabel.textContent = 'Zone:';
  const zoneSelect = document.createElement('select');
  zoneSelect.className = 'io-list-editor-zone-select';
  for (const option of zoneOptions) {
    const el = document.createElement('option');
    el.value = option.value;
    el.textContent = option.label;
    el.selected = displayKey(option.zone) === displayKey(current.zone);
    zoneSelect.appendChild(el);
  }

  const viewLabel = document.createElement('label');
  viewLabel.className = 'io-list-editor-zone-label';
  viewLabel.textContent = 'View:';
  const viewSelect = document.createElement('select');
  viewSelect.className = 'io-list-editor-view-select';
  for (const option of viewOptions) {
    const el = document.createElement('option');
    el.value = option.value;
    el.textContent = option.label;
    el.selected = option.side === current.side;
    viewSelect.appendChild(el);
  }

  const applySelection = () => {
    mergeVisibleIoListSheetEdits(project);
    const pickedZone = zoneOptions.find((option) => option.value === zoneSelect.value) || zoneOptions[0];
    const pickedView = viewOptions.find((option) => option.value === viewSelect.value) || viewOptions[0];
    applyIoListEditorSelection(project, {
      zone: pickedZone?.zone || '',
      side: pickedView?.side || 'IO'
    });
    if (getProjectIoListSheets(project).length) {
      syncProjectZoneOutputs(project, pickedZone?.zone || '', { save: false });
    }
    saveProjectList();
    rerenderIoListEditor();
    if (isIoListPreviewScreenActive()) {
      renderPreview();
    }
  };

  zoneSelect.addEventListener('change', applySelection);
  viewSelect.addEventListener('change', applySelection);

  zoneLabel.appendChild(zoneSelect);
  viewLabel.appendChild(viewSelect);
  toolbar.appendChild(zoneLabel);
  toolbar.appendChild(viewLabel);
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
  const tagsParsed = getProjectZoneTagsParsed(project);
  const rows = globalThis.IoTags.formatParameterPreviewNotes(parsed.bindings, tagsParsed);

  const frame = document.createElement('div');
  frame.className = 'preview-frame parameter-preview-frame';

  const heading = document.createElement('h4');
  heading.className = 'parameter-preview-title';
  heading.textContent = `Parameter preview: ${file.name}`;
  frame.appendChild(heading);

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
  exportAllBtn.textContent = 'Download PAR Folder';
  exportAllBtn.title = 'Download all .par files for the active zone as a ZIP (PLC DI/DO + Safety DI/DO)';
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
  table.innerHTML = '<thead><tr><th>Slot</th><th>HMI tag binding</th><th>PLC address / preview</th></tr></thead>';
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
  const exportZone = resolveTagsExportZone(project, project.ioListMeta?.zones || []);
  intro.textContent = tagCount
    ? `${folderCount} folders, ${tagCount} tags — FactoryTalk import format${exportZone ? ` for zone "${exportZone}"` : ''}. Download and import in FactoryTalk Tag Browser.`
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
  const blob = content instanceof Blob ? content : new Blob([String(content || '')], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadFactoryTalkTagsCsv(content, fileName) {
  const text = String(content || '').replace(/^\uFEFF/, '');
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const body = new TextEncoder().encode(text);
  const bytes = new Uint8Array(bom.length + body.length);
  bytes.set(bom, 0);
  bytes.set(body, bom.length);
  const blob = new Blob([bytes], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = String(fileName || 'Tags.CSV');
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function encodeFactoryTalkParameterBytes(text) {
  const normalized = String(text || '').replace(/^\uFEFF/, '').replace(/\r?\n/g, '\r\n');
  const bytes = new Uint8Array(normalized.length * 2);
  for (let index = 0; index < normalized.length; index += 1) {
    const code = normalized.charCodeAt(index);
    bytes[index * 2] = code & 0xff;
    bytes[index * 2 + 1] = code >> 8;
  }
  return bytes;
}

function downloadFactoryTalkParameterFile(content, fileName) {
  const bytes = encodeFactoryTalkParameterBytes(content);
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = String(fileName || 'Parameters.par');
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const GENERATED_PARAMETER_FILE_PATTERN = /^(PLC (DI|DO) List|Safety (DI|DO) List) \d+\.par$/i;

function isGeneratedParameterFileName(name) {
  return GENERATED_PARAMETER_FILE_PATTERN.test(String(name || ''));
}

function pruneGeneratedParameterFiles(project, keepNames = []) {
  if (!project) {
    return;
  }
  const keep = new Set((keepNames || []).map((name) => displayKey(name)));
  project.parametersFiles = (project.parametersFiles || []).filter((file) => {
    if (!isGeneratedParameterFileName(file.name)) {
      return true;
    }
    return keep.has(displayKey(file.name));
  });
}

function buildProjectParameterParFiles(project, zone = '') {
  if (!project || !globalThis.IoTags?.buildAllIoListParameterFiles) {
    return [];
  }

  const sheets = getProjectIoListSheets(project);
  const zones = project?.ioListMeta?.zones || sheets.map((sheet) => sheet.zone).filter(Boolean);
  const activeZone = String(zone || resolveIoListEditorZone(project, zones)).trim();
  if (!activeZone || !sheets.length) {
    return [];
  }

  const zoneParsed = getProjectZoneTagsParsed(project, activeZone);
  return globalThis.IoTags.buildAllIoListParameterFiles(zoneParsed, {
    zone: activeZone,
    zoneLocal: true,
    maxPages: 12
  });
}

function buildProjectParameterParFolderName(project, zone = '') {
  const projectName = String(project?.name || 'Project').trim() || 'Project';
  const sheets = getProjectIoListSheets(project);
  const zones = project?.ioListMeta?.zones || sheets.map((sheet) => sheet.zone).filter(Boolean);
  const activeZone = String(zone || resolveIoListEditorZone(project, zones)).trim() || 'General';
  const zoneSlug = activeZone.replace(/[^\w.-]+/g, '_').replace(/_+/g, '_') || 'General';
  return `${projectName}-${zoneSlug}-PAR`;
}

function crc32Bytes(data) {
  let crc = 0xffffffff;
  for (let index = 0; index < data.length; index += 1) {
    crc ^= data[index];
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZipBlobFromTextFiles(fileEntries) {
  const encoder = new TextEncoder();
  const parts = [];
  const centralRecords = [];
  let offset = 0;

  for (const entry of fileEntries || []) {
    const name = String(entry.name || '').replace(/\\/g, '/');
    const nameBytes = encoder.encode(name);
    const dataBytes = /\.par$/i.test(name)
      ? encodeFactoryTalkParameterBytes(entry.content)
      : encoder.encode(String(entry.content || ''));
    const crc = crc32Bytes(dataBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, dataBytes.length, true);
    localView.setUint32(22, dataBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);
    parts.push(localHeader, dataBytes);
    centralRecords.push({
      nameBytes,
      crc,
      size: dataBytes.length,
      offset
    });
    offset += localHeader.length + dataBytes.length;
  }

  const centralStart = offset;
  for (const record of centralRecords) {
    const centralHeader = new Uint8Array(46 + record.nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, record.crc, true);
    centralView.setUint32(20, record.size, true);
    centralView.setUint32(24, record.size, true);
    centralView.setUint16(28, record.nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, record.offset, true);
    centralHeader.set(record.nameBytes, 46);
    parts.push(centralHeader);
    offset += centralHeader.length;
  }

  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, centralRecords.length, true);
  endView.setUint16(10, centralRecords.length, true);
  endView.setUint32(12, offset - centralStart, true);
  endView.setUint32(16, centralStart, true);
  parts.push(endRecord);

  return new Blob(parts, { type: 'application/zip' });
}

function exportProjectParameterParFolder(project, zone = '') {
  if (!project) {
    throw new Error('No project selected.');
  }

  const builtFiles = buildProjectParameterParFiles(project, zone);
  if (!builtFiles.length) {
    throw new Error('No parameter files to export. Pick a zone in the IO List editor first.');
  }

  const folderName = buildProjectParameterParFolderName(project, zone);
  const zipBlob = createZipBlobFromTextFiles(builtFiles.map((file) => ({
    name: file.name,
    content: file.content
  })));
  downloadTextFile(zipBlob, `${folderName}.zip`, 'application/zip');
  return { folderName, fileCount: builtFiles.length, files: builtFiles.map((file) => file.name) };
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

  downloadFactoryTalkParameterFile(file.content, fileName);
}

function exportProjectTagsCsvFile(project, file) {
  if (!project || !file) {
    return;
  }

  if (file.id === 'generated-tags-export' || isIoGeneratedTagsFileName(file.name)) {
    exportProjectTagsCsvForZone(project, project.tagsExportZone || project.ioListPreviewZone);
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

  downloadFactoryTalkTagsCsv(file.content, fileName);
}

function exportProjectTagsCsvForZone(project, zone = '') {
  if (!project) {
    throw new Error('No project selected.');
  }

  if (activeIoListFileKey) {
    saveActiveProjectIoListFromEditor();
  }

  mergeVisibleIoListSheetEdits(project);

  const sheets = getProjectIoListSheets(project);
  const zones = project?.ioListMeta?.zones || sheets.map((sheet) => sheet.zone).filter(Boolean);
  const exportZone = String(zone || resolveTagsExportZone(project, zones)).trim();
  if (!exportZone) {
    throw new Error('Pick a zone in the IO List editor first.');
  }

  const csvContent = buildProjectTagsCsvForZone(project, exportZone);
  const fileName = `${buildTagsCsvExportName(project, exportZone)}.CSV`;
  const validation = globalThis.IoTags?.validateFactoryTalkZoneTagsCsv?.(csvContent) || { ok: true };

  if (!validation.ok) {
    throw new Error(
      `Tags CSV export is incomplete (${validation.folderCount || 0} folders, `
      + `${validation.digitalTagCount || 0} PLC tags). Re-open the IO List editor and pick a zone first.`
    );
  }

  regenerateProjectTagsCsvForZone(project, exportZone, { save: true });
  downloadFactoryTalkTagsCsv(csvContent, fileName);

  return { zone: exportZone, fileName, validation };
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

  try {
    exportProjectParameterParFolder(project);
  } catch (err) {
    const files = (project.parametersFiles || []).filter((file) => String(file.content || '').trim());
    if (!files.length) {
      throw err;
    }

    for (let index = 0; index < files.length; index += 1) {
      exportProjectParameterFile(project, files[index]);
      if (index < files.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  }
}

async function fetchDefaultParameterTemplate(page = 1) {
  const pageSuffix = String(Math.max(1, Number(page) || 1)).padStart(2, '0');
  const response = await fetch(`/templates/PLC%20DI%20List%20${pageSuffix}.par`);
  if (!response.ok) {
    throw new Error(`Could not load the PLC DI List ${pageSuffix}.par reference template.`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  return decodeTextBytes(bytes);
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

function upsertGeneratedParameterFiles(project, parsed, zone = '') {
  if (!project || !globalThis.IoTags) {
    return [];
  }

  ensureProjectCsvData(project);
  const zones = parsed?.meta?.zones || project.ioListMeta?.zones || [];
  const activeZone = zone
    || project.ioListPreviewZone
    || resolveIoListEditorZone(project, zones);
  const zoneParsed = parsed?.meta?.exportZone
    ? parsed
    : getProjectZoneTagsParsed(project, activeZone);
  const builtFiles = globalThis.IoTags.buildAllIoListParameterFiles(zoneParsed, {
    zone: activeZone,
    zoneLocal: true,
    maxPages: 12
  });
  pruneGeneratedParameterFiles(project, builtFiles.map((file) => file.name));
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
  migrateGeneratedTagsFromSidebar(project);
  clearInvalidGeneratedTagsExport(project);

  const stored = project.generatedTagsExport;
  if (stored?.zone) {
    project.tagsExportZone = stored.zone;
    project.ioListPreviewZone = stored.zone;
  }

  const zones = project.ioListMeta?.zones
    || getProjectIoListSheets(project).map((sheet) => sheet.zone).filter(Boolean);
  const exportZone = resolveTagsExportZone(project, zones);
  if (!exportZone || !getProjectIoListSheets(project).length) {
    return null;
  }

  try {
    const csvContent = buildProjectTagsCsvForZone(project, exportZone);
    const sourceName = buildTagsCsvExportName(project, exportZone);
    return {
      id: 'generated-tags-export',
      name: `${sourceName}.CSV`,
      content: csvContent,
      sizeBytes: new Blob([csvContent]).size,
      lastModified: stored?.lastModified || new Date().toISOString()
    };
  } catch (_err) {
    return null;
  }
}

function getProjectPrimaryTagsFile(project) {
  if (!project) {
    return null;
  }

  ensureProjectCsvData(project);
  if (project.ioListMeta || project.ioListFiles?.length) {
    const generated = getProjectGeneratedTagsFile(project);
    if (generated?.content?.trim()) {
      return generated;
    }
  }

  const manualTags = getProjectManualTagsFiles(project);
  const populated = manualTags.filter((file) => String(file.content || '').trim());
  if (populated.length) {
    return populated.sort((a, b) => (Number(b.sizeBytes) || 0) - (Number(a.sizeBytes) || 0))[0];
  }

  return manualTags[0] || project.tagsFiles[0] || null;
}

function getProjectPlcLogicTagsFile(project) {
  if (!project) {
    return null;
  }

  ensureProjectCsvData(project);
  const files = (project.plcLogicTagsFiles || []).filter((file) => String(file.content || '').trim());
  if (!files.length) {
    return null;
  }

  return files.sort((a, b) => String(b.lastModified || '').localeCompare(String(a.lastModified || '')))[0];
}

function applyPlcLogicTagMatchingToProject(project, options = {}) {
  if (!project || !globalThis.IoTags?.applyPlcTagsToParsed) {
    return null;
  }

  const plcLogicFile = getProjectPlcLogicTagsFile(project);
  const rsLogixText = String(plcLogicFile?.content || '').trim();
  if (!rsLogixText) {
    return null;
  }

  const sheets = getProjectIoListSheets(project);
  if (!sheets.length) {
    return null;
  }

  const baseParsed = project.ioTagsParsed
    || globalThis.IoTags.rebuildParsedFromMasterSheets(sheets, {
      zoneRioModules: getProjectZoneRioModules(project)
    });
  const { parsed, stats } = globalThis.IoTags.applyPlcTagsToParsed({
    ...baseParsed,
    meta: {
      ...(baseParsed?.meta || {}),
      ...(project.ioListMeta || {}),
      sourceSheets: sheets,
      manualZoneRioModules: getProjectManualZoneRioModules(project)
    }
  }, rsLogixText);

  project.ioListMeta = parsed.meta || project.ioListMeta;
  project.ioListSheets = parsed.meta?.sourceSheets || sheets;
  const ioFile = (project.ioListFiles || [])[0];
  if (ioFile && parsed.meta?.sourceSheets?.length) {
    syncIoListSheetDataToFile(project, ioFile, parsed.meta.sourceSheets);
    ioFile.content = globalThis.IoTags.formatMasterSheetSummary(parsed, ioFile.name);
    ioFile.sizeBytes = new Blob([ioFile.content]).size;
    ioFile.lastModified = new Date().toISOString();
  }

  project.ioTagsParsed = parsed;
  syncProjectZoneOutputs(project, undefined, { save: false });

  if (options.save !== false) {
    saveProjectList();
  }

  return stats;
}

async function importProjectPlcLogicTagsFiles(projectId, fileList) {
  const project = getProjectById(projectId);
  if (!project || !fileList?.length) {
    throw new Error('Choose a project and an RSLogix Tags CSV file.');
  }
  if (!globalThis.IoTags) {
    throw new Error('IO list support failed to load. Refresh the page and try again.');
  }

  ensureProjectCsvData(project);
  const sourceFile = fileList[0];
  const content = await readUploadedText(sourceFile);
  if (!globalThis.IoTags.isRsLogixTagsCsv(content)) {
    throw new Error('This does not look like an RSLogix 5000 Tags CSV export. Export tags from Studio 5000 using CSV format.');
  }

  let name = baseFileName(sourceFile.name) || 'PLC_Logic_Tags';
  if (!/\.csv$/i.test(name)) {
    name = `${name}.CSV`;
  }

  const entry = {
    id: `plc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    content,
    sizeBytes: new Blob([content]).size,
    lastModified: new Date().toISOString()
  };

  const existingIndex = project.plcLogicTagsFiles.findIndex((item) => displayKey(item.name) === displayKey(name));
  if (existingIndex >= 0) {
    project.plcLogicTagsFiles[existingIndex] = {
      ...project.plcLogicTagsFiles[existingIndex],
      ...entry,
      id: project.plcLogicTagsFiles[existingIndex].id
    };
  } else {
    project.plcLogicTagsFiles.push(entry);
  }

  const stats = applyPlcLogicTagMatchingToProject(project, { save: false });
  saveProjectList();
  renderProjectSidebar();

  if (activeIoListFileKey) {
    const ioRecord = getProjectIoListFileByKey(activeIoListFileKey);
    if (ioRecord?.file) {
      renderIoListEditorPreview(project, ioRecord.file);
    }
  }

  if (isIoListPreviewScreenActive()) {
    renderPreview();
  }

  return { entry, stats };
}

function queuePlcLogicTagsUpload(projectId) {
  pendingPlcLogicTagsUpload = { projectId };
  if (!projectPlcLogicTagsInput) {
    return;
  }
  projectPlcLogicTagsInput.value = '';
  projectPlcLogicTagsInput.click();
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

async function ensureProjectIoDoListScreen(project) {
  const existing = findProjectScreenByFileName(project, IO_DO_LIST_SCREEN_FILE);
  if (existing) {
    return existing;
  }

  const template = await loadDefaultTemplateXml(IO_DO_LIST_SCREEN_FILE);
  const folder = findOrCreateManualOperationFolder(project);
  const screen = screenMetaFromXml(IO_DO_LIST_SCREEN_FILE, adaptIoListTemplateXml(template.xml));
  folder.screens = Array.isArray(folder.screens) ? folder.screens : [];
  folder.screens.push(screen);
  saveProjectList();
  renderProjectSidebar();
  return { folder, screen };
}

async function openProjectIoDoListPreviewScreen(project) {
  let match = findProjectScreenByFileName(project, IO_DO_LIST_SCREEN_FILE);
  if (!match) {
    match = await ensureProjectIoDoListScreen(project);
  }
  if (!match) {
    return false;
  }

  await openProjectScreen(project.id, match.folder.name, match.screen.name, { skipSave: true });
  return true;
}

async function openIoListEditorScreenPreview(project, selection) {
  const side = normalizeIoListEditorFilter(selection?.side || project?.ioListEditorFilter);
  if (side === 'DO') {
    project.ioListPreviewParameterFile = 'PLC DO List 01';
    return openProjectIoDoListPreviewScreen(project);
  }

  project.ioListPreviewParameterFile = 'PLC DI List 01';
  return openProjectIoListPreviewScreen(project);
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

function getProjectIoListSheets(project, file = null) {
  ensureProjectCsvData(project);

  if (file?.sheetData?.length) {
    project.ioListSheets = file.sheetData;
    return file.sheetData;
  }

  if (!file && activeIoListFileKey) {
    const record = getProjectIoListFileByKey(activeIoListFileKey);
    if (record?.file?.sheetData?.length) {
      project.ioListSheets = record.file.sheetData;
      return record.file.sheetData;
    }
  }

  if (project.ioListSheets?.length) {
    return project.ioListSheets;
  }
  if (project.ioListMeta?.sourceSheets?.length) {
    project.ioListSheets = project.ioListMeta.sourceSheets;
    return project.ioListSheets;
  }

  const files = project?.ioListFiles || [];
  const preferred = file || files.find((item) => Array.isArray(item.sheetData) && item.sheetData.length)
    || files[files.length - 1];
  if (preferred?.sheetData?.length) {
    project.ioListSheets = preferred.sheetData;
    return project.ioListSheets;
  }

  return [];
}

function syncIoListSheetDataToFile(project, file, sheets) {
  if (!project || !file || !Array.isArray(sheets) || !sheets.length) {
    return;
  }
  file.sheetData = sheets;
  project.ioListSheets = sheets;
  if (project.ioListMeta && typeof project.ioListMeta === 'object') {
    project.ioListMeta.sourceSheets = sheets;
  }
}

function isIoDoPreviewContext(project) {
  if (!project) {
    return false;
  }

  const paramName = String(project.ioListPreviewParameterFile || getActiveParameterFile(project)?.name || '');
  if (/plc\s*do\s*list/i.test(paramName)) {
    return true;
  }

  if (isIoListPreviewScreenActive()) {
    const screenName = String(displayName.value || '').split('/').pop()?.trim() || '';
    if (/410_PLC IO List/i.test(screenName)) {
      return true;
    }
  }

  return false;
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
  return (sheet?.diInputs || []).filter((item) => item.ioKind === 'DI' || (!item.ioKind && !item.isSafety));
}

function getIoListSheetItemsByKind(sheet, kind) {
  const key = String(kind || '').toUpperCase();
  if (key === 'SDI' || key === 'DI') {
    return (sheet?.diInputs || []).filter((item) => (
      item.ioKind === key || (!item.ioKind && ((key === 'SDI' && item.isSafety) || (key === 'DI' && !item.isSafety)))
    ));
  }
  if (key === 'SDO' || key === 'DO') {
    return (sheet?.doOutputs || []).filter((item) => (
      item.ioKind === key || (!item.ioKind && ((key === 'SDO' && item.isSafety) || (key === 'DO' && !item.isSafety)))
    ));
  }
  return [];
}

function formatIoListTypeCell(item) {
  const ioKind = String(item?.ioKind || '').toUpperCase();
  const labels = globalThis.IoTags?.IO_TYPE_LABELS || {};
  const label = item?.ioKindLabel || labels[ioKind] || ioKind;
  const code = escapeHtmlText(item?.type || ioKind);
  if (!label || label === ioKind) {
    return code;
  }
  return `<span class="io-type-code">${code}</span><span class="io-type-label">${escapeHtmlText(label)}</span>`;
}

function appendIoListEditorRowsTable(section, config) {
  const {
    title,
    items,
    rowKind,
    getIndex,
    zone
  } = config;

  if (!items.length) {
    return;
  }

  const blockTitle = document.createElement('h5');
  blockTitle.className = 'io-list-subsection-title';
  blockTitle.textContent = title;
  section.appendChild(blockTitle);

  const table = document.createElement('table');
  table.className = `io-list-editor-table${rowKind === 'di' && items[0]?.ioKind === 'SDI' ? ' io-list-editor-subtable' : ''}`;
  table.innerHTML = '<thead><tr><th>IO Type</th><th>Point</th><th>Address</th><th>Description</th><th>PLC Tag</th></tr></thead>';
  const tbody = document.createElement('tbody');

  for (const item of items) {
    const index = getIndex(item);
    const tr = document.createElement('tr');
    tr.dataset[`io${rowKind === 'di' ? 'Di' : 'Do'}Index`] = String(index);
    if (item.isSafety) {
      tr.dataset.ioSafety = '1';
    }
    if (item.ioKind) {
      tr.dataset.ioKind = item.ioKind;
    }
    tr.innerHTML = `<td class="io-type-cell">${formatIoListTypeCell(item)}</td>`
      + `<td data-io-field="type">${escapeHtmlText(item.type || '')}</td>`
      + `<td><input data-io-field="address" type="text" value="${escapeHtmlAttr(item.address || '')}"></td>`
      + `<td><input data-io-field="description" type="text" value="${escapeHtmlAttr(item.description || '')}"></td>`
      + `<td><input data-io-field="plcTag" type="text" value="${escapeHtmlAttr(item.plcTag || '')}"></td>`;
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  section.appendChild(table);
}

function getIoListSheetPageCount(sheet) {
  return Math.max(1, Math.ceil(getIoListSheetPlcDiItems(sheet).length / 8));
}

function resolveIoListEditorZone(project, zones, fallbackZone = '') {
  const list = normalizeIoListZoneNames(zones);
  let zone = String(project?.ioListPreviewZone || fallbackZone || '').trim();
  if (zone && !isGenericIoListZoneName(zone) && list.some((item) => displayKey(item) === displayKey(zone))) {
    return zone;
  }
  return list[0] || '';
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

  const sheets = getProjectIoListSheets(project, file);
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
    parsed = globalThis.IoTags.rebuildParsedFromMasterSheets(getProjectIoListSheets(project), {
      zoneRioModules: getProjectZoneRioModules(project)
    });
  } else {
    const rows = collectIoListEditorRows();
    if (!rows.length) {
      throw new Error('No IO list rows to save.');
    }
    parsed = globalThis.IoTags.applyIoListSummaryEdits(getProjectIoTagsParsed(project), rows);
  }

  project.ioListMeta = parsed.meta || null;
  if (parsed.meta?.sourceSheets?.length) {
    syncIoListSheetDataToFile(project, file, parsed.meta.sourceSheets);
  }
  project.ioTagsParsed = parsed;

  syncProjectZoneOutputs(project, undefined, { save: false });

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

  const toolbar = document.createElement('div');
  toolbar.className = 'io-list-editor-toolbar';

  const zones = project.ioListMeta?.zones || editorState.sheets.map((sheet) => sheet.zone).filter(Boolean);
  const zoneRioModules = getProjectZoneRioModules(project)
    || globalThis.IoTags?.buildZoneRioModuleMap?.(zones)
    || {};
  const selection = getIoListEditorSelection(project, zones, zoneRioModules);
  applyIoListEditorSelection(project, selection);
  const activeZone = selection.zone || resolveIoListEditorZone(project, zones);

  const plcLogicFile = getProjectPlcLogicTagsFile(project);

  const rerenderIoListEditor = () => {
    saveProjectList();
    renderIoListEditorPreview(project, file);
    if (isIoListPreviewScreenActive()) {
      renderPreview();
    }
  };

  appendIoListEditorZoneControls(toolbar, project, zones, zoneRioModules, rerenderIoListEditor);

  const plcTagsBtn = document.createElement('button');
  plcTagsBtn.type = 'button';
  plcTagsBtn.className = 'io-list-editor-preview-btn';
  plcTagsBtn.textContent = plcLogicFile ? 'Re-match PLC Tags' : 'Upload PLC Tags';
  plcTagsBtn.title = 'Upload RSLogix Tags CSV — matches IO descriptions to SPECIFIER tag addresses';
  plcTagsBtn.addEventListener('click', () => {
    queuePlcLogicTagsUpload(project.id);
  });
  toolbar.appendChild(plcTagsBtn);

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
  previewBtn.textContent = 'Open Screen Preview';
  previewBtn.addEventListener('click', async () => {
    const current = getIoListEditorSelection(project, zones, zoneRioModules);
    applyIoListEditorSelection(project, current);
    saveProjectList();
    const opened = await openIoListEditorScreenPreview(project, current);
    if (!opened) {
      const side = normalizeIoListEditorFilter(current.side);
      alert(side === 'DO'
        ? 'Could not open 410_PLC IO List.xml.'
        : 'Could not open 303_IO_List.xml.');
    } else {
      renderPreview();
    }
  });
  toolbar.appendChild(previewBtn);

  const tagsCsvBtn = document.createElement('button');
  tagsCsvBtn.type = 'button';
  tagsCsvBtn.className = 'io-list-editor-preview-btn';
  tagsCsvBtn.textContent = 'Download Tags CSV';
  tagsCsvBtn.title = 'Download FactoryTalk Tags CSV for the selected zone';
  tagsCsvBtn.addEventListener('click', () => {
    try {
      exportProjectTagsCsvForZone(project, selection.zone || activeZone);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not export Tags CSV.');
    }
  });
  toolbar.appendChild(tagsCsvBtn);
  frame.appendChild(toolbar);

  if (editorState.mode === 'sheets' && editorState.sheets.length) {
    appendIoListZoneSetupPanel(
      frame,
      project,
      file,
      editorState.sheets,
      zoneRioModules,
      rerenderIoListEditor
    );
  }

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
    const sdiItems = getIoListSheetItemsByKind(activeSheet, 'SDI');
    const diItems = getIoListSheetItemsByKind(activeSheet, 'DI');
    const sdoItems = getIoListSheetItemsByKind(activeSheet, 'SDO');
    const doItems = getIoListSheetItemsByKind(activeSheet, 'DO');

    const section = document.createElement('section');
    section.className = 'io-list-sheet-section';
    section.dataset.ioSheetZone = activeSheet?.zone || activeZone;

    const ioFilter = normalizeIoListEditorFilter(project.ioListEditorFilter);
    const activeRioModule = zoneRioModules[activeZone] || activeSheet?.rioModule || null;
    const sectionTitle = document.createElement('h5');
    sectionTitle.textContent = formatIoListSectionTitle(selection.zone, selection.side, zoneRioModules);
    section.appendChild(sectionTitle);

    const meta = document.createElement('p');
    meta.className = 'io-list-page-meta';
    const rioLabel = globalThis.IoTags?.formatRioModuleLabel?.(activeRioModule);
    const countText = ioFilter === 'DO'
      ? `SDO ${sdoItems.length}, DO ${doItems.length}`
      : `SDI ${sdiItems.length}, DI ${diItems.length}`;
    meta.textContent = rioLabel
      ? `${rioLabel} tags only · ${countText}`
      : countText;
    section.appendChild(meta);

    if (ioFilter === 'DO' && !doItems.length && !sdoItems.length) {
      const doHint = document.createElement('p');
      doHint.className = 'io-list-page-meta io-list-empty-hint';
      doHint.textContent = 'No DO rows found for this zone. Re-upload the Excel Master Sheet, or check the Output Type column (DO01, DO02, …).';
      section.appendChild(doHint);
    }

    if (shouldShowIoListEditorKind(project, 'SDI')) {
      appendIoListEditorRowsTable(section, {
        title: `SDI — Safety Digital Input (${sdiItems.length})`,
        items: sdiItems,
        rowKind: 'di',
        zone: activeSheet?.zone || activeZone,
        getIndex: (item) => activeSheet.diInputs.indexOf(item)
      });
    }
    if (shouldShowIoListEditorKind(project, 'DI')) {
      appendIoListEditorRowsTable(section, {
        title: `DI — Digital Input (${diItems.length})`,
        items: diItems,
        rowKind: 'di',
        zone: activeSheet?.zone || activeZone,
        getIndex: (item) => activeSheet.diInputs.indexOf(item)
      });
    }
    if (shouldShowIoListEditorKind(project, 'SDO')) {
      appendIoListEditorRowsTable(section, {
        title: `SDO — Safety Digital Output (${sdoItems.length})`,
        items: sdoItems,
        rowKind: 'do',
        zone: activeSheet?.zone || activeZone,
        getIndex: (item) => activeSheet.doOutputs.indexOf(item)
      });
    }
    if (shouldShowIoListEditorKind(project, 'DO')) {
      appendIoListEditorRowsTable(section, {
        title: `DO — Digital Output (${doItems.length})`,
        items: doItems,
        rowKind: 'do',
        zone: activeSheet?.zone || activeZone,
        getIndex: (item) => activeSheet.doOutputs.indexOf(item)
      });
    }

    frame.appendChild(section);
  } else {
    const grouped = { SDI: [], DI: [], SDO: [], DO: [], other: [] };
    for (const row of editorState.rows) {
      const kind = String(row.ioType || '').toUpperCase();
      if (kind === 'SDI' || kind === 'DI' || kind === 'SDO' || kind === 'DO') {
        grouped[kind].push(row);
      } else if (/^Safety_DI_/i.test(row.folder || '')) {
        grouped.SDI.push(row);
      } else if (/^PLC_DI_/i.test(row.folder || '')) {
        grouped.DI.push(row);
      } else if (/^Safety_DO_/i.test(row.folder || '')) {
        grouped.SDO.push(row);
      } else if (/^PLC_DO_/i.test(row.folder || '')) {
        grouped.DO.push(row);
      } else {
        grouped.other.push(row);
      }
    }

    const summaryFilter = normalizeIoListEditorFilter(project.ioListEditorFilter);
    const summaryMeta = document.createElement('p');
    summaryMeta.className = 'io-list-page-meta';
    summaryMeta.textContent = summaryFilter === 'DO'
      ? `SDO ${grouped.SDO.length}, DO ${grouped.DO.length}`
      : `SDI ${grouped.SDI.length}, DI ${grouped.DI.length}`;
    frame.appendChild(summaryMeta);

    if (summaryFilter === 'DO' && !grouped.DO.length && !grouped.SDO.length) {
      const doHint = document.createElement('p');
      doHint.className = 'io-list-page-meta io-list-empty-hint';
      doHint.textContent = 'No DO rows in this summary. Re-upload the Excel Master Sheet to refresh SDI/DI/SDO/DO rows.';
      frame.appendChild(doHint);
    }

    const renderSummaryGroup = (title, rows, kind) => {
      if (!rows.length || !shouldShowIoListEditorKind(project, kind)) {
        return;
      }
      const groupTitle = document.createElement('h5');
      groupTitle.className = 'io-list-subsection-title';
      groupTitle.textContent = title;
      frame.appendChild(groupTitle);

      const table = document.createElement('table');
      table.className = 'io-list-editor-table';
      table.innerHTML = '<thead><tr><th>IO Type</th><th>Folder</th><th>Tag</th><th>Description</th><th>Address</th></tr></thead>';
      const tbody = document.createElement('tbody');
      for (const row of rows) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtmlText(row.ioType || kind || '')}</td>`
          + `<td>${escapeHtmlText(row.folder || '')}</td>`
          + `<td><code>${escapeHtmlText(row.tagName || '')}</code></td>`
          + `<td><input data-io-tag-name="${escapeHtmlAttr(row.tagName || '')}" data-io-field="description" type="text" value="${escapeHtmlAttr(row.description || '')}"></td>`
          + `<td><input data-io-tag-name="${escapeHtmlAttr(row.tagName || '')}" data-io-field="address" type="text" value="${escapeHtmlAttr(row.address || '')}"></td>`;
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      frame.appendChild(table);
    };

    renderSummaryGroup(`DO — Digital Output (${grouped.DO.length})`, grouped.DO.filter((row) => /\\Data_\d+$/i.test(String(row.tagName || ''))), 'DO');
    renderSummaryGroup(`SDO — Safety Digital Output (${grouped.SDO.length})`, grouped.SDO.filter((row) => /\\Data_\d+$/i.test(String(row.tagName || ''))), 'SDO');
    renderSummaryGroup(`DI — Digital Input (${grouped.DI.length})`, grouped.DI.filter((row) => /\\Data_\d+$/i.test(String(row.tagName || ''))), 'DI');
    renderSummaryGroup(`SDI — Safety Digital Input (${grouped.SDI.length})`, grouped.SDI.filter((row) => /\\Data_\d+$/i.test(String(row.tagName || ''))), 'SDI');

    if (grouped.other.length && shouldShowIoListEditorKind(project, 'OTHER')) {
      const table = document.createElement('table');
      table.className = 'io-list-editor-table';
      table.innerHTML = '<thead><tr><th>Folder</th><th>Tag</th><th>Description</th><th>Address</th></tr></thead>';
      const tbody = document.createElement('tbody');
      for (const row of grouped.other) {
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
    mergeVisibleIoListSheetEdits(record.project);
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

  const zones = project?.ioListMeta?.zones || getProjectIoListSheets(project).map((sheet) => sheet.zone).filter(Boolean);
  let zone = resolveIoListEditorZone(project, zones);
  const zoneParsed = zone ? getProjectZoneTagsParsed(project, zone) : getProjectIoTagsParsed(project);

  if (zone) {
    const buildMap = isIoDoPreviewContext(project)
      ? globalThis.IoTags.buildIoDoListPreviewMap
      : globalThis.IoTags.buildIoListPreviewMap;
    const zoneMap = buildMap(zoneParsed, {
      page: project.ioListPreviewPage || 1,
      zone,
      zoneLocal: true
    });
    if (zoneMap.size && [...zoneMap.values()].some((value) => String(value || '').trim())) {
      return zoneMap;
    }
  }

  if (isIoListPreviewScreenActive() && zone) {
    const buildMap = isIoDoPreviewContext(project)
      ? globalThis.IoTags.buildIoDoListPreviewMap
      : globalThis.IoTags.buildIoListPreviewMap;
    return buildMap(zoneParsed, {
      page: project.ioListPreviewPage || 1,
      zone,
      zoneLocal: true
    });
  }

  const bindings = getActiveParameterBindings(project);
  if (bindings?.size) {
    const fromParameters = globalThis.IoTags.buildPreviewMapFromParameterFile(zoneParsed, bindings, zoneParsed);
    if (fromParameters.size) {
      return fromParameters;
    }
  }

  const buildMap = isIoDoPreviewContext(project)
    ? globalThis.IoTags.buildIoDoListPreviewMap
    : globalThis.IoTags.buildIoListPreviewMap;
  return buildMap(zoneParsed, {
    page: project.ioListPreviewPage || 1,
    zone,
    zoneLocal: Boolean(zone)
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
      const tagsParsed = getProjectZoneTagsParsed(project);
      const resolved = globalThis.IoTags.resolveTagPreviewValue(tagsParsed, bindings.get(key), { showPlcAddress: true });
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
  const exportZone = String(project.tagsExportZone || project.ioListPreviewZone || '').trim();
  const validation = globalThis.IoTags?.validateFactoryTalkZoneTagsCsv?.(csvContent) || null;

  project.generatedTagsExport = {
    zone: exportZone,
    name: fileName,
    lastModified: new Date().toISOString(),
    stats: validation
  };

  project.tagsFiles = (project.tagsFiles || []).filter((file) => !isIoGeneratedTagsFileName(file.name));
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
      sourceType: isExcel ? 'xlsx' : 'text',
      sheetData: isExcel && combinedParsed?.meta?.sourceSheets ? combinedParsed.meta.sourceSheets : []
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
  if (!project.tagsExportZone && zones.includes('Packing')) {
    project.tagsExportZone = 'Packing';
  } else if (!project.tagsExportZone && zones.length === 1) {
    project.tagsExportZone = zones[0];
  }

  project.ioListMeta = combinedParsed?.meta || null;
  project.ioListSheets = combinedParsed?.meta?.sourceSheets
    || getProjectIoListSheets(project)
    || [];
  const importedIoFile = (project.ioListFiles || []).find((item) => displayKey(item.name) === displayKey(fileList[fileList.length - 1]?.name || ''))
    || (project.ioListFiles || [])[project.ioListFiles.length - 1];
  if (importedIoFile && combinedParsed?.meta?.sourceSheets?.length) {
    syncIoListSheetDataToFile(project, importedIoFile, combinedParsed.meta.sourceSheets);
  }
  project.ioTagsParsed = combinedParsed;
  let plcTagMatchStats = null;
  if (getProjectPlcLogicTagsFile(project)) {
    plcTagMatchStats = applyPlcLogicTagMatchingToProject(project, { save: false });
    if (plcTagMatchStats) {
      combinedParsed = project.ioTagsParsed;
    }
  } else {
    syncProjectZoneOutputs(project, undefined, { save: false });
  }
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
    parsed: combinedParsed,
    plcTagMatchStats
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

  if (file?.sheetData?.length) {
    project.ioListSheets = file.sheetData;
  } else if (project.ioListMeta?.sourceSheets?.length) {
    project.ioListSheets = project.ioListMeta.sourceSheets;
    syncIoListSheetDataToFile(project, file, project.ioListSheets);
  } else {
    project.ioListSheets = [];
  }

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

  scheduleServerProjectSave(payload);
}

function scheduleServerProjectSave(projects = projectList) {
  clearTimeout(serverProjectSaveTimer);
  const payload = (Array.isArray(projects) ? projects : projectList).map((project) => {
    const { ioTagsParsed, ...rest } = project;
    return rest;
  });

  serverProjectSaveTimer = setTimeout(async () => {
    serverProjectSaveTimer = null;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: payload })
      });
      if (!res.ok) {
        const data = await readApiJson(res);
        console.error(data.error || 'Failed to save projects to server');
      }
    } catch (err) {
      console.error('Failed to save projects to server', err);
    }
  }, 800);
}

async function loadProjectsOnStartup() {
  let serverProjects = null;

  try {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.projects)) {
        serverProjects = data.projects;
      }
    }
  } catch (_err) {
    // Server project store is optional during startup.
  }

  const localProjects = loadProjectList();

  if (serverProjects?.length) {
    projectList = serverProjects;
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(serverProjects));
    } catch (_err) {
      // Browser cache is best-effort when server data is available.
    }
    return;
  }

  projectList = localProjects;
  if (projectList.length) {
    scheduleServerProjectSave();
  }
}

function syncCurrentXmlToActiveProjectScreen() {
  if (!activeProjectKey || !xmlEditor.value.trim()) {
    return false;
  }

  const record = getProjectScreenByKey(activeProjectKey);
  if (!record?.screen) {
    return false;
  }

  const sanitizedXml = sanitizeXmlForFactoryTalk(xmlEditor.value);
  if (sanitizedXml !== xmlEditor.value) {
    xmlEditor.value = sanitizedXml;
  }

  const meta = screenMetaFromXml(record.screen.name, sanitizedXml);
  record.screen.xml = sanitizedXml;
  record.screen.width = meta.width;
  record.screen.height = meta.height;
  record.screen.sizeBytes = meta.sizeBytes;
  record.screen.lastModified = meta.lastModified;
  return true;
}

function flushProjectPersistence() {
  clearTimeout(persistXmlDebounceTimer);
  persistXmlDebounceTimer = null;
  clearTimeout(serverProjectSaveTimer);
  serverProjectSaveTimer = null;

  syncCurrentXmlToActiveProjectScreen();
  const payload = projectList.map((project) => {
    const { ioTagsParsed, ...rest } = project;
    return rest;
  });

  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error(err);
  }

  try {
    const body = JSON.stringify({ projects: payload });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/projects', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      }).catch(() => {});
    }
  } catch (_err) {
    // Best-effort flush during page unload.
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
        if (isOverviewScreenName(screen?.name)) {
          const cleanedOverviewXml = stripOverviewEditorArtifacts(screen.xml);
          if (cleanedOverviewXml !== String(screen.xml || '')) {
            screen.xml = cleanedOverviewXml;
            removedLegacyScreens = true;
          }
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
        const repairedScreenXml = repairGotoButtonsInXml(String(screen.xml || ''));
        if (repairedScreenXml !== String(screen.xml || '')) {
          screen.xml = repairedScreenXml;
          removedLegacyScreens = true;
        } else {
          screen.xml = String(screen.xml || '');
        }
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

  const activeRecord = activeProjectKey ? getProjectScreenByKey(activeProjectKey) : null;
  if (activeRecord && isOverviewScreenName(activeRecord.screen?.name)) {
    const cleanedOverviewXml = stripOverviewEditorArtifacts(activeRecord.screen.xml);
    if (cleanedOverviewXml !== String(activeRecord.screen.xml || '')) {
      activeRecord.screen.xml = cleanedOverviewXml;
      persistProjectList();
    }
    if (String(xmlEditor.value || '').includes('MSI_Rect_')) {
      xmlEditor.value = cleanedOverviewXml;
      recordHistory(cleanedOverviewXml);
      selectedObjectIndex = null;
      selectedObjectName = null;
      clearObjectPanel();
      renderPreview();
      if (cleanedOverviewXml.trim()) {
        persistCurrentXmlState();
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
    clearActiveProjectScreenKey();
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
  persistActiveProjectScreenKey();
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
      tagsExportZone: '',
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

function loadPreviewZoomLevel() {
  const stored = Number(localStorage.getItem(PREVIEW_ZOOM_STORAGE_KEY));
  if (!Number.isFinite(stored)) {
    return 1;
  }
  if (stored < PREVIEW_ZOOM_MIN) {
    return 1;
  }
  return Math.min(PREVIEW_ZOOM_MAX, Math.max(PREVIEW_ZOOM_MIN, stored));
}

function clampPreviewZoom(value) {
  const level = Number(value);
  if (!Number.isFinite(level)) {
    return 1;
  }
  return Math.min(PREVIEW_ZOOM_MAX, Math.max(PREVIEW_ZOOM_MIN, level));
}

function setPreviewZoomLevel(value, options = {}) {
  previewZoomLevel = clampPreviewZoom(value);
  localStorage.setItem(PREVIEW_ZOOM_STORAGE_KEY, String(previewZoomLevel));
  updatePreviewZoomLabel();
  if (options.render !== false) {
    refitActivePreviewCanvas();
  }
}

function adjustPreviewZoom(delta) {
  setPreviewZoomLevel(previewZoomLevel + delta);
}

function updatePreviewZoomLabel() {
  const label = document.getElementById('previewZoomLabel');
  if (!label) {
    return;
  }
  label.textContent = `${Math.round(previewZoomLevel * 100)}%`;
}

function getActivePreviewDisplayCanvas() {
  const canvas = previewPane?.querySelector('.preview-display-canvas');
  if (!canvas) {
    return null;
  }

  const frame = canvas.closest('.preview-frame');
  if (!frame || frame.classList.contains('parameter-preview-frame') || frame.classList.contains('io-list-editor-frame')) {
    return null;
  }

  const width = Number(canvas.dataset.previewWidth);
  const height = Number(canvas.dataset.previewHeight);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return { frame, canvas, width, height };
}

function refitActivePreviewCanvas() {
  const active = getActivePreviewDisplayCanvas();
  if (!active) {
    updatePreviewZoomLabel();
    return;
  }

  fitCanvasToFrame(active.frame, active.canvas, active.width, active.height);
  updatePreviewZoomLabel();
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
  const fitScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const finalScale = fitScale * previewZoomLevel;

  frame.classList.toggle('preview-frame-zoomed', previewZoomLevel > 1.01);

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

function getNodeFontSize(node, captionNode = null) {
  const fontSize = Number(captionNode?.getAttribute('fontSize') || node?.getAttribute('fontSize'));
  if (Number.isFinite(fontSize) && fontSize > 0) {
    return fontSize;
  }

  const charHeight = Number(node?.getAttribute('charHeight'));
  if (Number.isFinite(charHeight) && charHeight > 0) {
    return charHeight;
  }

  return 10;
}

function setNodeFontSize(node, captionNode, size) {
  const value = String(Math.max(1, Number(size) || 10));
  const tag = String(node?.tagName || '').toLowerCase();

  if (nodeUsesDirectFontSize(node)) {
    if (tag === 'text' && node.hasAttribute('charHeight')) {
      node.setAttribute('charHeight', value);
      node.removeAttribute('fontSize');
    } else {
      node.setAttribute('fontSize', value);
    }
  }

  if (captionNode) {
    captionNode.setAttribute('fontSize', value);
  }
}

function applyCaptionStyles(box, node, captionNode, captionEl) {
  const fontSize = getNodeFontSize(node, captionNode);
  if (fontSize > 0) {
    const sizePx = `${fontSize}px`;
    box.style.fontSize = sizePx;
    if (captionEl) {
      captionEl.style.fontSize = sizePx;
    }
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
  const tag = String(node?.tagName || '').toLowerCase();
  const imageSettings = Array.from(node.children).find((child) => child.tagName === 'imageSettings');
  const alignmentRaw = imageSettings?.getAttribute('alignment') || 'middleCenter';
  const scaledRaw = String(imageSettings?.getAttribute('scaled') || '').toLowerCase();
  const scaled = tag === 'image' ? true : (scaledRaw ? scaledRaw === 'true' : true);
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

function updateLineCoordinates(node) {
  if (String(node?.tagName || '').toLowerCase() !== 'line') {
    return;
  }

  const left = Number(node.getAttribute('left') || 0);
  const top = Number(node.getAttribute('top') || 0);
  const width = Math.max(1, Number(node.getAttribute('width') || 1));
  const height = Math.max(1, Number(node.getAttribute('height') || 1));
  const isHorizontal = width >= height;

  if (isHorizontal) {
    setLineEndpoints(node, left + 1, top + 1, left + width, top + 1);
  } else {
    setLineEndpoints(node, left + 1, top + 1, left + 1, top + height);
  }
}

function syncLineBoundingBox(node) {
  const points = parseLinePoints(node);
  const minX = Math.min(points.x1, points.x2);
  const minY = Math.min(points.y1, points.y2);
  const maxX = Math.max(points.x1, points.x2);
  const maxY = Math.max(points.y1, points.y2);
  node.setAttribute('left', String(Math.round(minX)));
  node.setAttribute('top', String(Math.round(minY)));
  node.setAttribute('width', String(Math.max(1, Math.round(maxX - minX))));
  node.setAttribute('height', String(Math.max(1, Math.round(maxY - minY))));
}

function setLineEndpoints(node, x1, y1, x2, y2) {
  if (String(node?.tagName || '').toLowerCase() !== 'line') {
    return;
  }

  node.setAttribute(
    'line',
    `${Math.round(x1)} ${Math.round(y1)} ${Math.round(x2)} ${Math.round(y2)} `
  );
  syncLineBoundingBox(node);
}

function moveLineByDelta(node, deltaX, deltaY) {
  const points = parseLinePoints(node);
  setLineEndpoints(
    node,
    points.x1 + deltaX,
    points.y1 + deltaY,
    points.x2 + deltaX,
    points.y2 + deltaY
  );
}

function scaleLinePoints(points, scaleX, scaleY) {
  return {
    x1: points.x1 * scaleX,
    y1: points.y1 * scaleY,
    x2: points.x2 * scaleX,
    y2: points.y2 * scaleY
  };
}

function unscaleLinePoints(points, scaleX, scaleY) {
  const sx = Math.max(Number.EPSILON, scaleX);
  const sy = Math.max(Number.EPSILON, scaleY);
  return {
    x1: points.x1 / sx,
    y1: points.y1 / sy,
    x2: points.x2 / sx,
    y2: points.y2 / sy
  };
}

function displayRectToXml(left, top, width, height, scaleX, scaleY) {
  const sx = Math.max(Number.EPSILON, scaleX);
  const sy = Math.max(Number.EPSILON, scaleY);
  return {
    left: Math.round(left / sx),
    top: Math.round(top / sy),
    width: Math.max(1, Math.round(width / sx)),
    height: Math.max(1, Math.round(height / sy))
  };
}

function displayDeltaToXml(deltaLeft, deltaTop, scaleX, scaleY) {
  const sx = Math.max(Number.EPSILON, scaleX);
  const sy = Math.max(Number.EPSILON, scaleY);
  return {
    deltaLeft: deltaLeft / sx,
    deltaTop: deltaTop / sy
  };
}

const LINE_HIT_PADDING = 12;

function getLineBounds(points, padding = LINE_HIT_PADDING) {
  const minX = Math.min(points.x1, points.x2);
  const minY = Math.min(points.y1, points.y2);
  const maxX = Math.max(points.x1, points.x2);
  const maxY = Math.max(points.y1, points.y2);
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
    width: Math.max(1, maxX - minX + padding * 2),
    height: Math.max(1, maxY - minY + padding * 2),
    padding
  };
}

function resolveLineStrokeColor(node) {
  const raw = node.getAttribute('foreColor') || node.getAttribute('backColor') || '#000000';
  return normalizeColor(raw) || raw || '#000000';
}

function parsePolygonPoints(node) {
  const fromPolygon = String(node.getAttribute('polygon') || '')
    .trim()
    .split(/\s+/)
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));

  if (fromPolygon.length >= 6 && fromPolygon.length % 2 === 0) {
    const points = [];
    for (let i = 0; i < fromPolygon.length; i += 2) {
      points.push({ x: fromPolygon[i], y: fromPolygon[i + 1] });
    }
    return points;
  }

  const left = Number(node.getAttribute('left') || 0);
  const top = Number(node.getAttribute('top') || 0);
  const width = Math.max(1, Number(node.getAttribute('width') || 1));
  const height = Math.max(1, Number(node.getAttribute('height') || 1));
  return [
    { x: left, y: top },
    { x: left + width, y: top },
    { x: left + width, y: top + height },
    { x: left, y: top + height }
  ];
}

function formatPolygonPoints(points) {
  return `${points.map((point) => `${Math.round(point.x)} ${Math.round(point.y)}`).join(' ')} `;
}

function syncPolygonBoundingBox(node) {
  const points = parsePolygonPoints(node);
  if (!points.length) {
    return;
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  node.setAttribute('left', String(Math.round(minX)));
  node.setAttribute('top', String(Math.round(minY)));
  node.setAttribute('width', String(Math.max(1, Math.round(maxX - minX))));
  node.setAttribute('height', String(Math.max(1, Math.round(maxY - minY))));
}

function setPolygonPoints(node, points) {
  if (String(node?.tagName || '').toLowerCase() !== 'polygon') {
    return;
  }

  node.setAttribute('polygon', formatPolygonPoints(points));
  syncPolygonBoundingBox(node);
}

function scalePolygonToRect(node, prevLeft, prevTop, prevWidth, prevHeight, nextLeft, nextTop, nextWidth, nextHeight) {
  const points = parsePolygonPoints(node);
  if (!points.length) {
    return;
  }

  const sx = nextWidth / Math.max(1, prevWidth);
  const sy = nextHeight / Math.max(1, prevHeight);
  const scaled = points.map((point) => ({
    x: nextLeft + ((point.x - prevLeft) * sx),
    y: nextTop + ((point.y - prevTop) * sy)
  }));
  setPolygonPoints(node, scaled);
}

function createPolygonPreviewSvg(points, bounds, fillColor, strokeColor, strokeWidth) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.display = 'block';
  svg.style.overflow = 'visible';
  svg.style.pointerEvents = 'none';

  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute(
    'points',
    points.map((point) => `${point.x - bounds.minX},${point.y - bounds.minY}`).join(' ')
  );
  polygon.setAttribute('fill', fillColor || 'transparent');
  polygon.setAttribute('stroke', strokeColor || '#000000');
  polygon.setAttribute('stroke-width', String(Math.max(1, strokeWidth || 1)));
  svg.appendChild(polygon);
  return svg;
}

function createLinePreviewSvg(points, bounds, color, strokeWidth) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.display = 'block';
  svg.style.overflow = 'visible';
  svg.style.pointerEvents = 'none';

  const x1 = points.x1 - bounds.minX;
  const y1 = points.y1 - bounds.minY;
  const x2 = points.x2 - bounds.minX;
  const y2 = points.y2 - bounds.minY;
  const stroke = Math.max(1, strokeWidth);
  const visible = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  visible.setAttribute('x1', String(x1));
  visible.setAttribute('y1', String(y1));
  visible.setAttribute('x2', String(x2));
  visible.setAttribute('y2', String(y2));
  visible.setAttribute('stroke', color);
  visible.setAttribute('stroke-width', String(stroke));
  visible.setAttribute('stroke-linecap', 'round');
  visible.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.style.position = 'absolute';
  svg.style.inset = '0';
  svg.appendChild(visible);
  return svg;
}

function clientToDisplayPoint(canvas, displayWidth, displayHeight, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / Math.max(1, rect.width)) * displayWidth;
  const y = ((clientY - rect.top) / Math.max(1, rect.height)) * displayHeight;
  return {
    x: clamp(x, 0, displayWidth),
    y: clamp(y, 0, displayHeight)
  };
}

function createRubberBandSvg(displayWidth, displayHeight, x1, y1, x2, y2) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'line-draw-rubberband');
  svg.style.position = 'absolute';
  svg.style.inset = '0';
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.pointerEvents = 'none';
  svg.style.overflow = 'visible';
  svg.setAttribute('viewBox', `0 0 ${displayWidth} ${displayHeight}`);

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', String(x1));
  line.setAttribute('y1', String(y1));
  line.setAttribute('x2', String(x2));
  line.setAttribute('y2', String(y2));
  line.setAttribute('stroke', '#0d6470');
  line.setAttribute('stroke-width', '2');
  line.setAttribute('stroke-dasharray', '6 4');
  line.setAttribute('stroke-linecap', 'round');
  svg.appendChild(line);
  return svg;
}

function cancelLineDrawMode() {
  lineDrawState = null;
  if (packageResult) {
    packageResult.textContent = '';
  }
  renderPreview();
}

function insertLineIntoXml(x1, y1, x2, y2, scaleX = 1, scaleY = 1) {
  const xml = xmlEditor.value.trim();
  if (!xml) {
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) {
    alert('XML parse error. Fix XML before adding a line.');
    return null;
  }

  const root = doc.querySelector('gfx');
  if (!root) {
    alert('Could not find gfx root in XML.');
    return null;
  }

  let endX = x2;
  let endY = y2;
  if (Math.hypot(endX - x1, endY - y1) < 4) {
    endX = x1 + 120;
    endY = y1;
  }

  const line = doc.createElement('line');
  const lineName = uniqueObjectName(doc, 'Line');
  line.setAttribute('name', lineName);
  line.setAttribute('visible', 'true');
  line.setAttribute('wallpaper', 'false');
  line.setAttribute('isReferenceObject', 'false');
  line.setAttribute('backStyle', 'solid');
  line.setAttribute('lineStyle', 'solid');
  line.setAttribute('lineWidth', '2');
  line.setAttribute('backColor', '#C6C6C6');
  line.setAttribute('foreColor', '#000000');
  const xmlPoints = unscaleLinePoints({ x1, y1, x2: endX, y2: endY }, scaleX, scaleY);
  setLineEndpoints(line, xmlPoints.x1, xmlPoints.y1, xmlPoints.x2, xmlPoints.y2);
  root.appendChild(line);

  xmlEditor.value = serializeXmlDoc(doc);
  recordHistory(xmlEditor.value);

  const nodes = getObjectNodes(doc);
  selectedObjectIndex = nodes.findIndex((node) => String(node.getAttribute('name') || '') === lineName);
  if (selectedObjectIndex >= 0) {
    populateObjectPanel(doc, selectedObjectIndex);
  }

  return lineName;
}

function attachLineDrawInteraction(canvas, displayWidth, displayHeight, scaleX = 1, scaleY = 1) {
  canvas.classList.add('line-draw-mode');
  let startPoint = null;
  let rubberBand = null;

  const clearRubberBand = () => {
    rubberBand?.remove();
    rubberBand = null;
  };

  const onMouseMove = (event) => {
    if (!startPoint || !rubberBand) {
      return;
    }

    const endPoint = clientToDisplayPoint(canvas, displayWidth, displayHeight, event.clientX, event.clientY);
    const line = rubberBand.querySelector('line');
    if (line) {
      line.setAttribute('x2', String(endPoint.x));
      line.setAttribute('y2', String(endPoint.y));
    }
  };

  const onMouseUp = (event) => {
    document.removeEventListener('mousemove', onMouseMove);
    if (!startPoint) {
      return;
    }

    const endPoint = clientToDisplayPoint(canvas, displayWidth, displayHeight, event.clientX, event.clientY);
    clearRubberBand();
    lineDrawState = null;
    canvas.classList.remove('line-draw-mode');
    suppressPreviewCanvasClick = true;
    insertLineIntoXml(startPoint.x, startPoint.y, endPoint.x, endPoint.y, scaleX, scaleY);
    renderPreview();
    persistCurrentXmlState();
    startPoint = null;
    setTimeout(() => {
      suppressPreviewCanvasClick = false;
    }, 0);
  };

  const onMouseDown = (event) => {
    if (event.button !== 0 || event.target.closest('.xml-object, .xml-line-handle')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    startPoint = clientToDisplayPoint(canvas, displayWidth, displayHeight, event.clientX, event.clientY);
    clearRubberBand();
    rubberBand = createRubberBandSvg(displayWidth, displayHeight, startPoint.x, startPoint.y, startPoint.x, startPoint.y);
    canvas.appendChild(rubberBand);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp, { once: true });
  };

  canvas.addEventListener('mousedown', onMouseDown);

  if (packageResult) {
    packageResult.textContent = 'Draw a line: click the start point, drag to the end point, then release. Press Esc to cancel.';
  }
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

  if (selectedObjectIndex !== null) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(snapshot, 'text/xml');
    const parseError = doc.querySelector('parsererror');
    const nodes = parseError ? [] : getObjectNodes(doc);
    if (selectedObjectIndex < 0 || selectedObjectIndex >= nodes.length) {
      selectedObjectIndex = null;
      clearObjectPanel();
    } else {
      populateObjectPanel(doc, selectedObjectIndex);
    }
  }

  renderPreview();
  applyingHistory = false;

  const targetDisplayName = getTargetDisplayName();
  if (targetDisplayName) {
    saveDisplayXml(targetDisplayName, xmlEditor.value)
      .then(() => {
        updateCurrentDisplayRow(targetDisplayName, xmlEditor.value);
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

function blocksObjectKeyboardShortcuts(el) {
  if (!el) {
    return false;
  }

  if (el === xmlEditor || el === screenWidth || el === screenHeight) {
    return true;
  }

  if (el.closest?.('.sidebar-rename-input, #sidebarNameInput, #sidebarPageNoInput, #sidebarScreenNameInput, #projectNameInput')) {
    return true;
  }

  if (el.isContentEditable) {
    return true;
  }

  const tag = String(el.tagName || '').toLowerCase();
  if (el.closest?.('.object-panel')) {
    if (tag === 'textarea') {
      return true;
    }
    if (tag === 'input') {
      const type = String(el.type || 'text').toLowerCase();
      return type === 'text' || type === 'search' || type === 'password';
    }
    return false;
  }

  return tag === 'input' || tag === 'textarea' || tag === 'select';
}

function focusPreviewCanvas(canvas) {
  if (!canvas || typeof canvas.focus !== 'function') {
    return;
  }

  const applyFocus = () => {
    try {
      canvas.focus({ preventScroll: true });
    } catch (_err) {
      canvas.focus();
    }
  };

  applyFocus();
  requestAnimationFrame(applyFocus);
  setTimeout(applyFocus, 0);
}

function isDeleteObjectShortcut(event) {
  const key = String(event.key || '');
  const code = String(event.code || '');
  return key === 'Delete' || code === 'Delete' || key === 'Backspace' || code === 'Backspace';
}

function canDeleteSelectedObjectFromKeyboard(active, event) {
  if (selectedObjectIndex === null && !selectedObjectName) {
    return false;
  }

  if (active === xmlEditor) {
    return false;
  }

  if (active?.closest?.('.planner-table')) {
    return false;
  }

  if (active?.closest?.('#sidebarNameInput, #sidebarPageNoInput, #sidebarScreenNameInput, #projectNameInput')) {
    return false;
  }

  if (active?.isContentEditable) {
    return false;
  }

  const key = String(event.key || '');
  const code = String(event.code || '');
  const isBackspace = key === 'Backspace' || code === 'Backspace';
  if (isBackspace && active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
    return false;
  }

  return true;
}

function tryDeleteSelectedObjectFromKeyboard(event) {
  if (!isDeleteObjectShortcut(event)) {
    return false;
  }

  if (!canDeleteSelectedObjectFromKeyboard(document.activeElement, event)) {
    return false;
  }

  event.preventDefault();
  event.stopPropagation();
  deleteSelectedObject();
  return true;
}

function setSelectedObject(doc, index, node = null) {
  const nodes = doc ? getObjectNodes(doc) : [];
  const resolvedNode = node || (index !== null && index >= 0 ? nodes[index] : null);
  selectedObjectIndex = index;
  selectedObjectName = resolvedNode ? String(resolvedNode.getAttribute('name') || '') || null : null;
}

function isDisplayHistoryInput(el) {
  if (!el) {
    return false;
  }
  if (el === xmlEditor || el === screenWidth || el === screenHeight) {
    return true;
  }
  return Boolean(el.closest?.('.object-panel'));
}

function canUseDisplayHistoryUndo() {
  return Boolean(xmlEditor?.value?.trim()) && (historyPast.length > 1 || historyFuture.length > 0);
}

function handleDisplayHistoryShortcut(event) {
  const key = String(event.key || '').toLowerCase();
  const ctrlOrCmd = event.ctrlKey || event.metaKey;
  if (!ctrlOrCmd || (key !== 'z' && key !== 'y')) {
    return false;
  }
  if (!canUseDisplayHistoryUndo()) {
    return false;
  }

  const active = document.activeElement;
  if (isEditableTarget(active) && !isDisplayHistoryInput(active)) {
    return false;
  }

  event.preventDefault();
  if (key === 'y' || (key === 'z' && event.shiftKey)) {
    redoHistory();
  } else {
    undoHistory();
  }
  return true;
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
  if (String(newNode.tagName || '').toLowerCase() === 'line') {
    moveLineByDelta(newNode, Math.round(nextLeft) - left, Math.round(nextTop) - top);
  }

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
  if (!xmlEditor.value.trim()) {
    return;
  }

  if (selectedObjectIndex === null && !selectedObjectName) {
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlEditor.value, 'text/xml');
  if (doc.querySelector('parsererror')) {
    return;
  }

  const nodes = getObjectNodes(doc);
  let index = selectedObjectIndex;
  if (index === null || index < 0 || index >= nodes.length || !nodes[index]) {
    if (selectedObjectName) {
      index = nodes.findIndex((candidate) => String(candidate.getAttribute('name') || '') === selectedObjectName);
    }
  }

  const node = index !== null && index >= 0 ? nodes[index] : null;
  if (!node || !node.parentNode) {
    selectedObjectIndex = null;
    selectedObjectName = null;
    clearObjectPanel();
    return;
  }

  selectedObjectIndex = index;

  const removedIndex = index;
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
    selectedObjectName = null;
    clearObjectPanel();
  } else {
    selectedObjectIndex = Math.max(0, Math.min(removedIndex, remaining.length - 1));
    selectedObjectName = String(remaining[selectedObjectIndex]?.getAttribute('name') || '') || null;
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

function schedulePreviewRefit(refitFn) {
  if (previewRefitFrame) {
    cancelAnimationFrame(previewRefitFrame);
  }
  previewRefitFrame = requestAnimationFrame(() => {
    previewRefitFrame = null;
    refitFn();
  });
}

function updatePreviewSelectionInPlace(canvas, priorIndex, nextIndex) {
  if (!canvas) {
    return;
  }

  canvas.querySelectorAll('.xml-object.selected').forEach((box) => {
    box.classList.remove('selected');
  });

  if (nextIndex !== null && nextIndex >= 0) {
    const nextBox = canvas.querySelector(`.xml-object[data-object-index="${nextIndex}"]`);
    nextBox?.classList.add('selected');
  }
}

function selectionChangeNeedsFullPreview(doc, priorIndex, nextIndex) {
  if (priorIndex === nextIndex) {
    return false;
  }

  const nodes = getObjectNodes(doc);
  const priorTag = priorIndex !== null && priorIndex >= 0
    ? String(nodes[priorIndex]?.tagName || '').toLowerCase()
    : '';
  const nextTag = nextIndex !== null && nextIndex >= 0
    ? String(nodes[nextIndex]?.tagName || '').toLowerCase()
    : '';
  return priorTag === 'line' || nextTag === 'line';
}

function refreshPreviewAfterSelection(doc, canvas, priorIndex, nextIndex) {
  if (selectionChangeNeedsFullPreview(doc, priorIndex, nextIndex)) {
    renderPreview();
    return;
  }

  if (priorIndex !== nextIndex) {
    updatePreviewSelectionInPlace(canvas, priorIndex, nextIndex);
  }
}

function schedulePersistCurrentXmlState(delayMs = 700) {
  clearTimeout(persistXmlDebounceTimer);
  persistXmlDebounceTimer = setTimeout(() => {
    persistXmlDebounceTimer = null;
    persistCurrentXmlState();
  }, delayMs);
}

function applyEditorDocChange(workingDoc, options = {}) {
  const {
    history = true,
    render = true,
    persist = true,
    panelIndex = selectedObjectIndex
  } = options;

  xmlEditor.value = serializeXmlDoc(workingDoc);
  if (history) {
    recordHistory(xmlEditor.value);
  }
  if (panelIndex !== null && panelIndex >= 0) {
    selectedObjectIndex = panelIndex;
    populateObjectPanel(workingDoc, panelIndex);
  }
  if (render) {
    renderPreview();
  }
  if (persist) {
    schedulePersistCurrentXmlState();
  }
}

function persistCurrentXmlState() {
  const targetDisplayName = getTargetDisplayName();
  if (!targetDisplayName || !xmlEditor.value.trim()) {
    return;
  }

  if (syncCurrentXmlToActiveProjectScreen()) {
    try {
      saveProjectList();
    } catch (err) {
      console.error(err);
    }
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

  const templateButton = Array.from(root.querySelectorAll('momentaryButton, momentarybutton, multistatepushbutton'))
    .find((node) => String(node.tagName || '').toLowerCase() === 'momentarybutton')
    || Array.from(root.querySelectorAll('multistatepushbutton'))
      .find((node) => String(node.tagName || '').toLowerCase() === 'multistatepushbutton');

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

function addLineObject() {
  if (!xmlEditor.value.trim()) {
    alert('Load a display XML first.');
    return;
  }

  lineDrawState = { active: true };
  renderPreview();
}

function requireGfxDoc() {
  const xml = xmlEditor.value.trim();
  if (!xml) {
    alert('Load a display XML first.');
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) {
    alert('XML parse error. Fix XML before adding objects.');
    return null;
  }

  const root = doc.querySelector('gfx');
  if (!root) {
    alert('Could not find gfx root in XML.');
    return null;
  }

  const displaySettings = doc.querySelector('displaySettings');
  const width = Number(displaySettings?.getAttribute('width')) || Number(screenWidth.value) || DEFAULT_PREVIEW_WIDTH;
  const height = Number(displaySettings?.getAttribute('height')) || Number(screenHeight.value) || DEFAULT_PREVIEW_HEIGHT;
  return { doc, root, width, height };
}

function normalizeInsertedNode(node) {
  node.setAttribute('visible', 'true');
  node.setAttribute('isReferenceObject', 'false');
  node.removeAttribute('linkBaseObject');
  node.removeAttribute('linkSize');
  node.removeAttribute('linkConnections');
  node.removeAttribute('linkAnimations');
  if (node.hasAttribute('wallpaper')) {
    node.setAttribute('wallpaper', 'false');
  }

  Array.from(node.children).forEach((child) => {
    const tag = String(child.tagName || '').toLowerCase();
    if (tag === 'connections' || tag === 'animations') {
      node.removeChild(child);
    }
  });
}

function centerObjectRect(objWidth, objHeight, displayWidth, displayHeight) {
  return {
    left: Math.round((displayWidth - objWidth) / 2),
    top: Math.round((displayHeight - objHeight) / 2),
    width: objWidth,
    height: objHeight
  };
}

function findGfxTemplate(root, tagName, predicate = null, options = {}) {
  const tag = String(tagName || '').toLowerCase();
  const preferHome = Boolean(options.preferHome);

  const findInHome = () => {
    if (!homeTemplateRoot) {
      const parsed = new DOMParser().parseFromString(HOME_OBJECT_TEMPLATE_XML, 'text/xml');
      homeTemplateRoot = parsed.querySelector('gfx');
    }
    if (!homeTemplateRoot) {
      return null;
    }

    return Array.from(homeTemplateRoot.children).find((node) => {
      if (String(node.tagName || '').toLowerCase() !== tag) {
        return false;
      }
      return predicate ? predicate(node) : true;
    }) || null;
  };

  const findInDisplay = () => Array.from(root.querySelectorAll('*')).find((node) => {
    if (String(node.tagName || '').toLowerCase() !== tag) {
      return false;
    }
    return predicate ? predicate(node) : true;
  }) || null;

  if (preferHome) {
    return findInHome() || findInDisplay();
  }

  return findInDisplay() || findInHome();
}

function displayNameFromScreenFile(fileName) {
  return String(fileName || '').replace(/\.xml$/i, '');
}

function getKnownGotoDisplayNames() {
  const names = new Set();
  const project = getActiveProject();
  if (project) {
    for (const fileName of getAllActiveProjectScreenFiles(project)) {
      const displayName = displayNameFromScreenFile(fileName);
      if (displayName) {
        names.add(displayName);
      }
    }
  }

  for (const row of currentDisplayRows || []) {
    const displayName = displayNameFromScreenFile(row.name);
    if (displayName) {
      names.add(displayName);
    }
  }

  for (const fileName of bridgeDisplayFileNames || []) {
    const displayName = displayNameFromScreenFile(fileName);
    if (displayName) {
      names.add(displayName);
    }
  }

  const xml = String(xmlEditor?.value || '');
  if (xml.trim()) {
    const displayMatches = xml.match(/\bdisplay="([^"]+)"/gi) || [];
    for (const match of displayMatches) {
      const value = match.replace(/^display="/i, '').replace(/"$/, '').trim();
      if (value) {
        names.add(value);
      }
    }
  }

  return [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function isGotoButtonNode(node) {
  const tag = String(node?.tagName || '').toLowerCase();
  return tag === 'gotobutton';
}

function lookupGotoDisplayInXml(objectName) {
  const name = String(objectName || '').trim();
  if (!name || !xmlEditor?.value) {
    return null;
  }

  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<gotoButton\\b[^>]*\\bname="${escaped}"[^>]*\\bdisplay="([^"]*)"`, 'i'),
    new RegExp(`<gotoButton\\b[^>]*\\bdisplay="([^"]*)"[^>]*\\bname="${escaped}"`, 'i')
  ];

  for (const pattern of patterns) {
    const match = String(xmlEditor.value).match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function getGotoDisplayTarget(node) {
  if (!node) {
    return '';
  }

  if (node.attributes) {
    for (let i = 0; i < node.attributes.length; i += 1) {
      const attr = node.attributes[i];
      if (String(attr.name || '').toLowerCase() === 'display') {
        return String(attr.value ?? '');
      }
    }
  }

  const fromXml = lookupGotoDisplayInXml(node.getAttribute('name'));
  if (fromXml !== null) {
    return fromXml;
  }

  return String(node.getAttribute('display') || '');
}

function resolveGotoDisplayTarget(node, captionValue = '') {
  const stored = getGotoDisplayTarget(node).trim();
  if (stored) {
    return suggestGotoDisplayTarget(stored) || stored;
  }

  return suggestGotoDisplayTarget(captionValue)
    || suggestGotoDisplayTarget(node?.getAttribute('name') || '')
    || '';
}

function normalizeGotoLabel(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s_]+/g, '');
}

function suggestGotoDisplayTarget(label) {
  const needle = normalizeGotoLabel(label);
  if (!needle) {
    return '';
  }

  const known = getKnownGotoDisplayNames();
  const exact = known.find((name) => normalizeGotoLabel(name) === needle);
  if (exact) {
    return exact;
  }

  return known.find((name) => {
    const norm = normalizeGotoLabel(name);
    return norm.includes(needle) || needle.includes(norm);
  }) || '';
}

function syncGotoDisplayOptions(selectedValue = '') {
  if (!objGotoDisplay) {
    return;
  }

  const names = getKnownGotoDisplayNames();
  const current = String(selectedValue || objGotoDisplay.value || '').trim();
  const options = ['<option value="">Select target screen…</option>'];
  for (const name of names) {
    const safe = name.replace(/"/g, '&quot;');
    options.push(`<option value="${safe}">${safe}</option>`);
  }

  if (current && !names.includes(current)) {
    const safe = current.replace(/"/g, '&quot;');
    options.push(`<option value="${safe}">${safe}</option>`);
  }

  objGotoDisplay.innerHTML = options.join('');
  objGotoDisplay.value = current;
}

function repairGotoButtonsInXml(xml) {
  const source = String(xml || '').trim();
  if (!source || !/<gotoButton\b/i.test(source)) {
    return source;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(source, 'text/xml');
  if (doc.querySelector('parsererror')) {
    return source;
  }

  let changed = false;
  doc.querySelectorAll('gotoButton').forEach((node) => {
    const current = getGotoDisplayTarget(node).trim();
    if (current && current !== '100 Home') {
      return;
    }

    const caption = getObjectCaptionNode(node)?.getAttribute('caption') || '';
    const target = suggestGotoDisplayTarget(caption)
      || suggestGotoDisplayTarget(node.getAttribute('name') || '');
    if (target && target !== current) {
      node.setAttribute('display', target);
      changed = true;
    }
  });

  return changed ? serializeXmlDoc(doc) : source;
}

function placeInsertedObject(node, objectName, displayWidth, displayHeight) {
  const objWidth = Math.max(1, Number(node.getAttribute('width')) || 1);
  const objHeight = Math.max(1, Number(node.getAttribute('height')) || 1);
  normalizeInsertedNode(node);
  node.setAttribute('name', objectName);
  node.setAttribute('left', String(Math.round((displayWidth - objWidth) / 2)));
  node.setAttribute('top', String(Math.round((displayHeight - objHeight) / 2)));
  node.setAttribute('width', String(objWidth));
  node.setAttribute('height', String(objHeight));
}

function finalizeGfxInsert(doc, objectName) {
  xmlEditor.value = serializeXmlDoc(doc);
  recordHistory(xmlEditor.value);
  const nodes = getObjectNodes(doc);
  selectedObjectIndex = nodes.findIndex((node) => String(node.getAttribute('name') || '') === objectName);
  if (selectedObjectIndex >= 0) {
    populateObjectPanel(doc, selectedObjectIndex);
  }
  renderPreview();
  persistCurrentXmlState();
}

function ensureCaptionNode(doc, node, captionText) {
  let captionNode = Array.from(node.children).find((child) => child.tagName === 'caption');
  if (!captionNode) {
    captionNode = doc.createElement('caption');
    node.appendChild(captionNode);
  }
  captionNode.setAttribute('caption', captionText);
  if (!captionNode.getAttribute('color')) {
    captionNode.setAttribute('color', 'black');
  }
  if (!captionNode.getAttribute('fontFamily')) {
    captionNode.setAttribute('fontFamily', 'Arial');
  }
  if (!captionNode.getAttribute('fontSize')) {
    captionNode.setAttribute('fontSize', '10');
  }
  if (!captionNode.getAttribute('alignment')) {
    captionNode.setAttribute('alignment', 'middleCenter');
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
  if (!captionNode.getAttribute('wordWrap')) {
    captionNode.setAttribute('wordWrap', 'false');
  }
  if (!captionNode.getAttribute('blink')) {
    captionNode.setAttribute('blink', 'false');
  }
}

function createDefaultMultistateIndicator(doc, root, width, height, shape) {
  const templateOptions = { preferHome: true };
  const template = findGfxTemplate(root, 'multistateIndicator', (node) => {
    return String(node.getAttribute('shape') || '').toLowerCase() === shape;
  }, templateOptions) || findGfxTemplate(root, 'multistateIndicator', null, templateOptions);
  const indicator = template ? template.cloneNode(true) : doc.createElement('multistateIndicator');
  const objectName = uniqueObjectName(doc, shape === 'circle' ? 'MSI_Circle' : 'MSI_Rect');

  if (template) {
    placeInsertedObject(indicator, objectName, width, height);
    indicator.setAttribute('shape', shape);
    root.appendChild(indicator);
    return objectName;
  }

  const isCircle = shape === 'circle';
  const rect = centerObjectRect(isCircle ? 22 : 80, isCircle ? 22 : 36, width, height);

  normalizeInsertedNode(indicator);
  indicator.setAttribute('name', objectName);
  indicator.setAttribute('left', String(rect.left));
  indicator.setAttribute('top', String(rect.top));
  indicator.setAttribute('width', String(rect.width));
  indicator.setAttribute('height', String(rect.height));
  indicator.setAttribute('shape', shape);
  indicator.setAttribute('backStyle', 'solid');
  indicator.setAttribute('borderStyle', isCircle ? 'line' : 'raised');
  indicator.setAttribute('borderUsesBackColor', 'true');
  indicator.setAttribute('borderWidth', '1');
  indicator.setAttribute('triggerType', 'value');
  indicator.setAttribute('currentStateId', '0');
  indicator.setAttribute('captionOnBorder', 'false');
  indicator.setAttribute('setLastStateId', isCircle ? '3' : '2');

  const states = doc.createElement('states');
  [
    { stateId: '0', value: '0', backColor: isCircle ? '#C6C6C6' : '#F83D3D', caption: isCircle ? '0' : 'Fault' },
    { stateId: '1', value: '1', backColor: isCircle ? '#10EB10' : 'lime', caption: isCircle ? '1' : 'Healthy' },
    { stateId: '2', value: '2', backColor: '#F83D3D', caption: 'Fault' }
  ].forEach((entry) => {
    const state = doc.createElement('state');
    state.setAttribute('stateId', entry.stateId);
    if (entry.value !== undefined) {
      state.setAttribute('value', entry.value);
    }
    state.setAttribute('backColor', entry.backColor);
    state.setAttribute('borderColor', entry.backColor);
    state.setAttribute('patternColor', 'white');
    state.setAttribute('patternStyle', 'none');
    state.setAttribute('blink', 'false');
    state.setAttribute('endColor', 'white');
    state.setAttribute('gradientStop', '50');
    state.setAttribute('gradientDirection', 'gradientDirectionHorizontal');
    state.setAttribute('gradientShadingStyle', 'gradientHorizontalFromRight');
    if (!isCircle || entry.stateId !== '2') {
      ensureCaptionNode(doc, state, entry.caption);
    }
    states.appendChild(state);
  });
  indicator.appendChild(states);

  root.appendChild(indicator);
  return objectName;
}

function addGotoDisplayObject() {
  const ctx = requireGfxDoc();
  if (!ctx) {
    return;
  }

  const { doc, root, width, height } = ctx;
  const template = findGfxTemplate(root, 'gotoButton', null, { preferHome: true });
  const button = template ? template.cloneNode(true) : doc.createElement('gotoButton');
  const objectName = uniqueObjectName(doc, 'GotoDisplay');

  if (template) {
    placeInsertedObject(button, objectName, width, height);
    ensureCaptionNode(doc, button, getObjectCaptionNode(button)?.getAttribute('caption') || 'Production');
  } else {
    const rect = centerObjectRect(85, 45, width, height);
    normalizeInsertedNode(button);
    button.setAttribute('name', objectName);
    button.setAttribute('left', String(rect.left));
    button.setAttribute('top', String(rect.top));
    button.setAttribute('width', '85');
    button.setAttribute('height', '45');
    button.setAttribute('backColor', '#E0E0E0');
    button.setAttribute('backStyle', 'solid');
    button.setAttribute('borderStyle', 'raised');
    button.setAttribute('borderUsesBackColor', 'false');
    button.setAttribute('borderWidth', '4');
    button.setAttribute('borderColor', 'silver');
    button.setAttribute('display', '101 Production');
    ensureCaptionNode(doc, button, 'Production');
  }

  const caption = getObjectCaptionNode(button)?.getAttribute('caption') || '';
  const storedTarget = getGotoDisplayTarget(button).trim();
  let target = suggestGotoDisplayTarget(storedTarget)
    || suggestGotoDisplayTarget(caption)
    || suggestGotoDisplayTarget(objectName)
    || getKnownGotoDisplayNames()[0]
    || storedTarget
    || '';
  button.setAttribute('display', target);

  root.appendChild(button);
  finalizeGfxInsert(doc, objectName);
}

function addTextObject() {
  const ctx = requireGfxDoc();
  if (!ctx) {
    return;
  }

  const { doc, root, width, height } = ctx;
  const template = findGfxTemplate(root, 'text', null, { preferHome: true });
  const textNode = template ? template.cloneNode(true) : doc.createElement('text');
  const objectName = uniqueObjectName(doc, 'Text');

  if (template) {
    placeInsertedObject(textNode, objectName, width, height);
    if (!textNode.getAttribute('caption')) {
      textNode.setAttribute('caption', 'Text Label');
    }
  } else {
    const rect = centerObjectRect(45, 16, width, height);
    normalizeInsertedNode(textNode);
    textNode.setAttribute('name', objectName);
    textNode.setAttribute('left', String(rect.left));
    textNode.setAttribute('top', String(rect.top));
    textNode.setAttribute('width', '45');
    textNode.setAttribute('height', '16');
    textNode.setAttribute('backStyle', 'transparent');
    textNode.setAttribute('backColor', 'white');
    textNode.setAttribute('foreColor', 'black');
    textNode.setAttribute('wordWrap', 'true');
    textNode.setAttribute('sizeToFit', 'true');
    textNode.setAttribute('alignment', 'middleCenter');
    textNode.setAttribute('fontFamily', 'Arial');
    textNode.setAttribute('charHeight', '16');
    textNode.setAttribute('charWidth', '7');
    textNode.setAttribute('bold', 'true');
    textNode.setAttribute('italic', 'false');
    textNode.setAttribute('underline', 'false');
    textNode.setAttribute('strikethrough', 'false');
    textNode.setAttribute('caption', 'Text Label');
  }

  root.appendChild(textNode);
  finalizeGfxInsert(doc, objectName);
}

function addMultistateIndicatorObject(shape) {
  const ctx = requireGfxDoc();
  if (!ctx) {
    return;
  }

  const objectName = createDefaultMultistateIndicator(ctx.doc, ctx.root, ctx.width, ctx.height, shape);
  finalizeGfxInsert(ctx.doc, objectName);
}

function addPolygonObject() {
  const ctx = requireGfxDoc();
  if (!ctx) {
    return;
  }

  const { doc, root, width, height } = ctx;
  const template = findGfxTemplate(root, 'rectangle', (node) => /polygon/i.test(String(node.getAttribute('name') || '')))
    || findGfxTemplate(root, 'rectangle');
  const objectName = uniqueObjectName(doc, 'Polygon');
  const polyWidth = Math.max(80, Number(template?.getAttribute('width')) || 160);
  const polyHeight = Math.max(40, Number(template?.getAttribute('height')) || 73);
  const left = Math.round((width - polyWidth) / 2);
  const top = Math.round((height - polyHeight) / 2);
  const polygon = doc.createElement('polygon');

  normalizeInsertedNode(polygon);
  polygon.setAttribute('name', objectName);
  if (template) {
    for (const attr of ['backStyle', 'backColor', 'foreColor', 'lineStyle', 'lineWidth', 'patternStyle', 'patternColor', 'endColor', 'gradientStop', 'gradientDirection', 'gradientShadingStyle']) {
      if (template.hasAttribute(attr)) {
        polygon.setAttribute(attr, template.getAttribute(attr));
      }
    }
  } else {
    polygon.setAttribute('backStyle', 'solid');
    polygon.setAttribute('backColor', 'white');
    polygon.setAttribute('foreColor', 'black');
    polygon.setAttribute('lineStyle', 'solid');
    polygon.setAttribute('lineWidth', '1');
  }
  setPolygonPoints(polygon, [
    { x: left, y: top },
    { x: left + polyWidth, y: top },
    { x: left + polyWidth, y: top + polyHeight },
    { x: left, y: top + polyHeight }
  ]);

  root.appendChild(polygon);
  finalizeGfxInsert(doc, objectName);
}

async function refreshImageLibraryOptions() {
  if (!imageLibraryOptions) {
    return [];
  }

  try {
    const res = await fetch('/api/images');
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    const files = Array.isArray(data.files) ? data.files : [];
    imageLibraryOptions.innerHTML = files
      .map((name) => `<option value="${String(name).replace(/"/g, '&quot;')}"></option>`)
      .join('');
    return files;
  } catch (_err) {
    return [];
  }
}

function readImageFileDimensions(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = Math.max(1, Number(img.naturalWidth) || 1);
      const height = Math.max(1, Number(img.naturalHeight) || 1);
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

async function uploadImageLibraryFile(file) {
  if (!file) {
    throw new Error('No image file selected.');
  }

  const buffer = await file.arrayBuffer();
  const response = await fetch(`/api/images/upload?name=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-Image-Filename': file.name
    },
    body: buffer
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Could not upload image.');
  }

  await refreshImageLibraryOptions();
  previewImageNonce = Date.now();
  return data;
}

function fitImageObjectSize(naturalWidth, naturalHeight, displayWidth, displayHeight) {
  const maxWidth = Math.max(40, Math.round(displayWidth * 0.45));
  const maxHeight = Math.max(40, Math.round(displayHeight * 0.45));
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);
  return {
    width: Math.max(24, Math.round(naturalWidth * scale)),
    height: Math.max(24, Math.round(naturalHeight * scale))
  };
}

function insertImageObject(imageName, sizeHint = null) {
  const xml = xmlEditor.value.trim();
  if (!xml) {
    throw new Error('Load a display XML first.');
  }
  if (!String(imageName || '').trim()) {
    throw new Error('Image name is required.');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('XML parse error. Fix XML before adding an image.');
  }

  const root = doc.querySelector('gfx');
  if (!root) {
    throw new Error('Could not find gfx root in XML.');
  }

  const displaySettings = doc.querySelector('displaySettings');
  const displayWidth = Number(displaySettings?.getAttribute('width')) || Number(screenWidth.value) || DEFAULT_PREVIEW_WIDTH;
  const displayHeight = Number(displaySettings?.getAttribute('height')) || Number(screenHeight.value) || DEFAULT_PREVIEW_HEIGHT;

  const templateImage = Array.from(root.querySelectorAll('image'))
    .find((node) => String(node.getAttribute('imageName') || '').trim());

  const image = templateImage ? templateImage.cloneNode(true) : doc.createElement('image');
  const objectName = uniqueObjectName(doc, 'Image');
  const fitted = sizeHint
    ? fitImageObjectSize(sizeHint.width, sizeHint.height, displayWidth, displayHeight)
    : {
      width: Math.max(40, Math.round(displayWidth * 0.18)),
      height: Math.max(40, Math.round(displayHeight * 0.12))
    };
  const objWidth = fitted.width;
  const objHeight = fitted.height;
  const objLeft = Math.round((displayWidth - objWidth) / 2);
  const objTop = Math.round((displayHeight - objHeight) / 2);

  image.setAttribute('name', objectName);
  image.setAttribute('left', String(objLeft));
  image.setAttribute('top', String(objTop));
  image.setAttribute('width', String(objWidth));
  image.setAttribute('height', String(objHeight));
  image.setAttribute('visible', 'true');
  image.setAttribute('isReferenceObject', 'false');
  image.setAttribute('imageBackStyle', 'transparent');
  image.setAttribute('imageBackColor', '#6A6A6A');
  image.setAttribute('imageColor', '#001C38');
  image.setAttribute('imageBlink', 'false');
  image.setAttribute('description', '');
  image.setAttribute('imageName', String(imageName).trim());
  image.removeAttribute('linkBaseObject');
  image.removeAttribute('linkSize');
  image.removeAttribute('linkConnections');
  image.removeAttribute('linkAnimations');

  root.appendChild(image);

  xmlEditor.value = serializeXmlDoc(doc);
  recordHistory(xmlEditor.value);

  const nodes = getObjectNodes(doc);
  selectedObjectIndex = nodes.findIndex((node) => String(node.getAttribute('name') || '') === objectName);
  if (selectedObjectIndex >= 0) {
    populateObjectPanel(doc, selectedObjectIndex);
  }

  renderPreview();
  persistCurrentXmlState();
}

async function addImageObjectFromFile(file) {
  const dimensions = await readImageFileDimensions(file);
  const uploaded = await uploadImageLibraryFile(file);
  insertImageObject(uploaded.name, dimensions);
}

function queueImageLibraryUpload(mode = 'insert') {
  if (!imageLibraryUploadInput) {
    alert('Image upload is not available in this browser view.');
    return;
  }

  imageLibraryUploadInput.dataset.uploadMode = mode;
  imageLibraryUploadInput.value = '';
  imageLibraryUploadInput.click();
}

async function addImageObject() {
  if (!xmlEditor.value.trim()) {
    alert('Load a display XML first.');
    return;
  }

  queueImageLibraryUpload('insert');
}

async function replaceSelectedObjectImageFromFile(file) {
  const uploaded = await uploadImageLibraryFile(file);
  if (objImageName) {
    objImageName.value = uploaded.name;
  }
  if (selectedObjectIndex === null) {
    return uploaded;
  }

  if (applyObjectChangesToXml()) {
    renderPreview();
  }
  return uploaded;
}

function syncObjectImageNameField(node) {
  if (!objImageNameRow) {
    return;
  }

  const tag = String(node?.tagName || '').toLowerCase();
  const show = tag === 'image' || Boolean(getNodeImageName(node));
  objImageNameRow.hidden = !show;
}

function syncLinePropsField(node) {
  const tag = String(node?.tagName || '').toLowerCase();
  const isLine = tag === 'line';
  const isGoto = isGotoButtonNode(node);
  const isIndicator = tag === 'multistateindicator';
  const isPolygon = tag === 'polygon';
  const isText = tag === 'text';

  if (objLinePropsRow) {
    objLinePropsRow.hidden = !isLine;
  }
  if (objGotoPropsRow) {
    objGotoPropsRow.hidden = !isGoto;
  }
  if (objIndicatorPropsRow) {
    objIndicatorPropsRow.hidden = !isIndicator;
  }
  if (objPolygonPropsRow) {
    objPolygonPropsRow.hidden = !isPolygon;
  }
  if (objTextPropsRow) {
    objTextPropsRow.hidden = !isText;
  }
  if (objCaptionRow) {
    objCaptionRow.hidden = isLine || isIndicator || isPolygon;
  }
  if (objBorderColorRow) {
    objBorderColorRow.hidden = isLine || isText;
  }
  if (objFontRow) {
    objFontRow.hidden = isLine || isIndicator;
  }
  if (objTextColorLabel) {
    objTextColorLabel.textContent = isLine ? 'Fore Color' : 'Text Color';
  }
  if (objLeftLabel) {
    objLeftLabel.textContent = isLine ? 'From X' : 'Left';
  }
  if (objTopLabel) {
    objTopLabel.textContent = isLine ? 'From Y' : 'Top';
  }
  if (objWidthLabel) {
    objWidthLabel.textContent = isLine ? 'To X' : 'Width';
  }
  if (objHeightLabel) {
    objHeightLabel.textContent = isLine ? 'To Y' : 'Height';
  }
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
  clearActiveProjectScreenKey();
  selectedDisplay = name;
  selectedDefaultTemplate = '';
  displayName.value = name;
  let safeXml = isOverviewScreenName(name) ? stripOverviewEditorArtifacts(xml) : xml;
  safeXml = repairGotoButtonsInXml(safeXml);
  xmlEditor.value = safeXml;
  resetHistory(safeXml);
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

function decodeTextBytes(bytes) {
  const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(buffer.slice(2));
  }

  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(buffer.slice(2));
  }

  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(buffer.slice(3));
  }

  // Heuristic fallback for BOM-less UTF-16 exports.
  if (buffer.length >= 8) {
    let evenZeroCount = 0;
    let oddZeroCount = 0;
    const sample = Math.min(buffer.length, 512);
    for (let index = 0; index < sample; index += 1) {
      if (buffer[index] === 0) {
        if (index % 2 === 0) {
          evenZeroCount += 1;
        } else {
          oddZeroCount += 1;
        }
      }
    }

    if (oddZeroCount > evenZeroCount * 2) {
      return new TextDecoder('utf-16le').decode(buffer);
    }

    if (evenZeroCount > oddZeroCount * 2) {
      return new TextDecoder('utf-16be').decode(buffer);
    }
  }

  return new TextDecoder('utf-8').decode(buffer);
}

async function readUploadedText(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return decodeTextBytes(bytes);
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
    const files = kind === 'tags'
      ? getProjectManualTagsFiles(project)
      : getProjectCsvFiles(project, kind);
    if (kind === 'tags' && !files.length) {
      return;
    }
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
      exportAllBtn.title = 'Download PAR folder (.zip) for the selected zone';
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
    const zones = project.ioListMeta?.zones || getProjectIoListSheets(project).map((sheet) => sheet.zone).filter(Boolean);

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

    const plcTagsBtn = document.createElement('button');
    plcTagsBtn.type = 'button';
    plcTagsBtn.className = 'tree-action-btn';
    plcTagsBtn.textContent = 'PLC';
    plcTagsBtn.title = 'Upload RSLogix Tags CSV — matches IO descriptions to SPECIFIER tag addresses';
    plcTagsBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      queuePlcLogicTagsUpload(project.id);
    });

    const downloadTagsBtn = document.createElement('button');
    downloadTagsBtn.type = 'button';
    downloadTagsBtn.className = 'tree-action-btn';
    downloadTagsBtn.textContent = '↓';
    downloadTagsBtn.title = 'Download Tags CSV for the selected zone';
    downloadTagsBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      try {
        const zone = resolveTagsExportZone(project, zones);
        exportProjectTagsCsvForZone(project, zone);
      } catch (err) {
        console.error(err);
        alert(err.message || 'Could not export Tags CSV.');
      }
    });

    sectionActions.appendChild(addIoBtn);
    sectionActions.appendChild(plcTagsBtn);
    if (files.length || project.ioListMeta) {
      sectionActions.appendChild(downloadTagsBtn);
    }
    sectionRow.appendChild(toggle);
    sectionRow.appendChild(sectionLabel);
    sectionRow.appendChild(sectionCount);
    sectionRow.appendChild(sectionActions);
    sectionLi.appendChild(sectionRow);

    const children = document.createElement('ul');
    children.className = 'folder-children';

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
  bridgeDisplayFileNames = Array.isArray(data.files)
    ? data.files.map((file) => String(file?.name || '').trim()).filter(Boolean)
    : [];
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
  const previewSize = resolvePreviewDisplaySize(displaySettings);
  const {
    width,
    height,
    scaleX,
    scaleY,
    isPending,
    xmlWidth,
    xmlHeight
  } = previewSize;

  previewPane.innerHTML = '';
  disconnectPreviewResizeObserver();

  const frame = document.createElement('div');
  frame.className = 'preview-frame';

  const canvas = document.createElement('div');
  canvas.className = 'xml-canvas preview-display-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'application');
  canvas.setAttribute('aria-label', 'Display preview canvas');
  canvas.dataset.previewWidth = String(width);
  canvas.dataset.previewHeight = String(height);
  applyPreviewDisplayBackground(frame, canvas, displaySettings);

  canvas.addEventListener('keydown', (event) => {
    if (tryDeleteSelectedObjectFromKeyboard(event)) {
      return;
    }

    if (selectedObjectIndex === null) {
      return;
    }

    const step = event.shiftKey ? 10 : 1;
    const key = String(event.key || '');
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
    selectedObjectName = null;
    clearObjectPanel();
  }

  if (gfxRoot) {
    objectNodes.forEach((el, index) => {
      const tag = String(el.tagName || '').toLowerCase();
      const isLineTag = tag === 'line';
      const isPolygonTag = tag === 'polygon';
      const activeStateNode = getVisualStateNode(el);
      const visualSource = activeStateNode || el;
      const absolutePosition = getNodeAbsolutePosition(el);
      const rawLeft = absolutePosition.left;
      const rawTop = absolutePosition.top;
      const rawW = Number(el.getAttribute('width'));
      const rawH = Number(el.getAttribute('height'));
      const left = rawLeft * scaleX;
      const top = rawTop * scaleY;
      const w = rawW * scaleX;
      const h = rawH * scaleY;
      if (!isLineTag && (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(w) || !Number.isFinite(h))) {
        return;
      }
      if (isLineTag && !String(el.getAttribute('line') || '').trim() && (!Number.isFinite(w) || !Number.isFinite(h))) {
        return;
      }
      if (isPolygonTag && !String(el.getAttribute('polygon') || '').trim()) {
        return;
      }

      const box = document.createElement('div');
      box.className = 'xml-object';
      box.dataset.objectIndex = String(index);
      if (selectedObjectIndex === index) {
        box.classList.add('selected');
      }
      box.style.left = `${(left / width) * 100}%`;
      box.style.top = `${(top / height) * 100}%`;
      box.style.width = `${(w / width) * 100}%`;
      box.style.height = `${(h / height) * 100}%`;

      if (isLineTag) {
        const points = scaleLinePoints(parseLinePoints(el), scaleX, scaleY);
        const bounds = getLineBounds(points);
        const strokeWidth = Math.max(1, Number(el.getAttribute('lineWidth')) || 1);

        box.classList.add('xml-line-object');
        box.style.left = `${(bounds.minX / width) * 100}%`;
        box.style.top = `${(bounds.minY / height) * 100}%`;
        box.style.width = `${(bounds.width / width) * 100}%`;
        box.style.height = `${(bounds.height / height) * 100}%`;
        box.style.background = 'rgba(0, 0, 0, 0.001)';
        box.style.overflow = 'visible';
        box.style.zIndex = selectedObjectIndex === index ? '35' : '20';
        box.style.display = 'block';
        box.style.touchAction = 'none';
        box.appendChild(createLinePreviewSvg(points, bounds, resolveLineStrokeColor(el), strokeWidth));
      }

      if (isPolygonTag) {
        const rawPoints = parsePolygonPoints(el);
        const points = rawPoints.map((point) => ({
          x: point.x * scaleX,
          y: point.y * scaleY
        }));
        const xs = points.map((point) => point.x);
        const ys = points.map((point) => point.y);
        const padding = 8;
        const bounds = {
          minX: Math.min(...xs) - padding,
          minY: Math.min(...ys) - padding,
          width: Math.max(1, Math.max(...xs) - Math.min(...xs) + padding * 2),
          height: Math.max(1, Math.max(...ys) - Math.min(...ys) + padding * 2)
        };

        box.classList.add('xml-polygon-object');
        box.style.left = `${(bounds.minX / width) * 100}%`;
        box.style.top = `${(bounds.minY / height) * 100}%`;
        box.style.width = `${(bounds.width / width) * 100}%`;
        box.style.height = `${(bounds.height / height) * 100}%`;
        box.style.background = 'rgba(0, 0, 0, 0.001)';
        box.style.overflow = 'visible';
        box.style.zIndex = selectedObjectIndex === index ? '35' : '12';
        box.style.display = 'block';
        box.appendChild(createPolygonPreviewSvg(
          points,
          bounds,
          el.getAttribute('backColor') || '#C6C6C6',
          el.getAttribute('foreColor') || '#000000',
          Number(el.getAttribute('lineWidth')) || 1
        ));
      }

      if (!isLineTag && !isPolygonTag) {
        applyFillStyles(box, visualSource);
      }

      if (tag === 'image') {
        box.classList.add('xml-image-object');
        box.style.background = 'transparent';
        box.style.border = 'none';
      }

      if (!isLineTag && !isPolygonTag) {
        applyBorderStyles(box, el, visualSource);
      }

      if (tag === 'multistateindicator' && String(el.getAttribute('shape') || '').toLowerCase() === 'circle') {
        box.classList.add('xml-indicator-circle');
        box.style.borderRadius = '50%';
      }

      if (tag === 'group') {
        box.classList.add('xml-group-object');
        appendGroupPreviewChildren(el, box, w, h);
      }

      const captionNode = Array.from(visualSource.children).find((child) => child.tagName === 'caption')
        || Array.from(el.children).find((child) => child.tagName === 'caption');
      const imageName = getNodeImageName(visualSource) || getNodeImageName(el);
      if (imageName && !isLineTag && !isPolygonTag) {
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
      let captionEl = null;
      if (caption && tag !== 'group' && !isLineTag && !isPolygonTag) {
        captionEl = document.createElement('span');
        captionEl.className = 'xml-object-caption';
        captionEl.textContent = caption;
        box.appendChild(captionEl);
      }

      applyCaptionStyles(box, el, captionNode, captionEl);
      if (isLineTag) {
        const linePoints = parseLinePoints(el);
        box.title = `${el.tagName} (${Math.round(linePoints.x1)},${Math.round(linePoints.y1)}) → (${Math.round(linePoints.x2)},${Math.round(linePoints.y2)})`;
      } else {
        box.title = `${el.tagName} (${left},${top}) ${w}x${h}`;
      }

      const persistLineOrRectChange = (workingDoc, options = {}) => {
        applyEditorDocChange(workingDoc, { ...options, panelIndex: index });
      };

      const commitLineEndpointsChange = (x1, y1, x2, y2, errorMessage) => {
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

        setLineEndpoints(node, x1, y1, x2, y2);
        persistLineOrRectChange(workingDoc);
      };

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
        const xmlRect = displayRectToXml(nextLeft, nextTop, nextWidth, nextHeight, scaleX, scaleY);
        const movedOnly = xmlRect.width === Math.round(previousWidth)
          && xmlRect.height === Math.round(previousHeight);

        const popupGroup = getPopupGroupAncestor(node);
        if (movedOnly && popupGroup) {
          const groupWidth = Math.max(1, Number(popupGroup.getAttribute('width') || 1));
          const groupHeight = Math.max(1, Number(popupGroup.getAttribute('height') || 1));
          const currentGroupLeft = Number(popupGroup.getAttribute('left') || 0);
          const currentGroupTop = Number(popupGroup.getAttribute('top') || 0);
          const prevDisplayLeft = previousLeft * scaleX;
          const prevDisplayTop = previousTop * scaleY;
          const delta = displayDeltaToXml(
            Math.round(nextLeft) - Math.round(prevDisplayLeft),
            Math.round(nextTop) - Math.round(prevDisplayTop),
            scaleX,
            scaleY
          );
          const nextGroupLeft = clamp(currentGroupLeft + delta.deltaLeft, 0, Math.max(0, width / scaleX - groupWidth));
          const nextGroupTop = clamp(currentGroupTop + delta.deltaTop, 0, Math.max(0, height / scaleY - groupHeight));
          popupGroup.setAttribute('left', String(Math.round(nextGroupLeft)));
          popupGroup.setAttribute('top', String(Math.round(nextGroupTop)));
        } else {
          const nodeTagLower = String(node.tagName || '').toLowerCase();
          if (nodeTagLower === 'polygon') {
            const prevDisplayLeft = previousLeft * scaleX;
            const prevDisplayTop = previousTop * scaleY;
            const delta = displayDeltaToXml(
              Math.round(nextLeft) - Math.round(prevDisplayLeft),
              Math.round(nextTop) - Math.round(prevDisplayTop),
              scaleX,
              scaleY
            );
            if (movedOnly) {
              const points = parsePolygonPoints(node).map((point) => ({
                x: point.x + delta.deltaLeft,
                y: point.y + delta.deltaTop
              }));
              setPolygonPoints(node, points);
            } else {
              scalePolygonToRect(
                node,
                previousLeft,
                previousTop,
                previousWidth,
                previousHeight,
                xmlRect.left,
                xmlRect.top,
                xmlRect.width,
                xmlRect.height
              );
            }
          } else {
            node.setAttribute('left', String(xmlRect.left));
            node.setAttribute('top', String(xmlRect.top));
            node.setAttribute('width', String(xmlRect.width));
            node.setAttribute('height', String(xmlRect.height));

            if (nodeTagLower === 'line') {
              updateLineCoordinates(node);
            }
          }

          if (movedOnly) {
            const groupId = getPopupGroupNameForNode(node);
            movePopupGroupByDelta(
              workingDoc,
              groupId,
              node,
              xmlRect.left - Math.round(previousLeft),
              xmlRect.top - Math.round(previousTop),
              width / scaleX,
              height / scaleY
            );
          }
        }

        persistLineOrRectChange(workingDoc);
      };

      const resizeHandle = document.createElement('span');
      resizeHandle.className = 'xml-resize-handle';
      if (!isLineTag) {
        box.appendChild(resizeHandle);
      }

      let suppressClick = false;
      box.addEventListener('pointerdown', (downEvent) => {
        if (downEvent.button !== 0) {
          return;
        }

        if (isLineTag) {
          downEvent.preventDefault();
          downEvent.stopPropagation();
          const priorSelection = selectedObjectIndex;
          setSelectedObject(doc, index, el);
          populateObjectPanel(doc, index);
          focusPreviewCanvas(canvas);
          box.setPointerCapture(downEvent.pointerId);

          const startPoints = scaleLinePoints(parseLinePoints(el), scaleX, scaleY);
          const startX = downEvent.clientX;
          const startY = downEvent.clientY;
          let moved = false;
          let previewPoints = { ...startPoints };

          const renderLinePreview = (points) => {
            const bounds = getLineBounds(points);
            box.style.left = `${(bounds.minX / width) * 100}%`;
            box.style.top = `${(bounds.minY / height) * 100}%`;
            box.style.width = `${(bounds.width / width) * 100}%`;
            box.style.height = `${(bounds.height / height) * 100}%`;
            box.querySelector('svg')?.remove();
            box.appendChild(createLinePreviewSvg(
              points,
              bounds,
              resolveLineStrokeColor(el),
              Math.max(1, Number(el.getAttribute('lineWidth')) || 1)
            ));
          };

          const onMove = (moveEvent) => {
            if (moveEvent.pointerId !== downEvent.pointerId) {
              return;
            }

            const { scaleX: dragScaleX, scaleY: dragScaleY } = getCanvasScale(canvas, width, height);
            if (!Number.isFinite(dragScaleX) || !Number.isFinite(dragScaleY) || dragScaleX <= 0 || dragScaleY <= 0) {
              return;
            }

            const deltaX = (moveEvent.clientX - startX) / dragScaleX;
            const deltaY = (moveEvent.clientY - startY) / dragScaleY;
            const dragDistance = Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY);
            if (dragDistance > 2) {
              moved = true;
              suppressClick = true;
            }

            if (!moved) {
              return;
            }

            previewPoints = {
              x1: startPoints.x1 + deltaX,
              y1: startPoints.y1 + deltaY,
              x2: startPoints.x2 + deltaX,
              y2: startPoints.y2 + deltaY
            };
            box.classList.add('dragging');
            renderLinePreview(previewPoints);
          };

          const onUp = (upEvent) => {
            if (upEvent.pointerId !== downEvent.pointerId) {
              return;
            }

            box.releasePointerCapture(upEvent.pointerId);
            box.removeEventListener('pointermove', onMove);
            box.classList.remove('dragging');

            if (moved) {
              const xmlPoints = unscaleLinePoints(previewPoints, scaleX, scaleY);
              commitLineEndpointsChange(
                xmlPoints.x1,
                xmlPoints.y1,
                xmlPoints.x2,
                xmlPoints.y2,
                'XML parse error. Could not save moved line.'
              );
            } else {
              refreshPreviewAfterSelection(doc, canvas, priorSelection, index);
              focusPreviewCanvas(canvas);
            }

            setTimeout(() => {
              suppressClick = false;
            }, 0);
          };

          box.addEventListener('pointermove', onMove);
          box.addEventListener('pointerup', onUp, { once: true });
          box.addEventListener('pointercancel', onUp, { once: true });
          return;
        }

        downEvent.preventDefault();
        downEvent.stopPropagation();
        const priorSelection = selectedObjectIndex;
        setSelectedObject(doc, index, el);
        populateObjectPanel(doc, index);
        focusPreviewCanvas(canvas);
        box.setPointerCapture(downEvent.pointerId);

        const { scaleX: canvasScaleX, scaleY: canvasScaleY } = getCanvasScale(canvas, width, height);
        if (!Number.isFinite(canvasScaleX) || !Number.isFinite(canvasScaleY) || canvasScaleX <= 0 || canvasScaleY <= 0) {
          return;
        }

        const startX = downEvent.clientX;
        const startY = downEvent.clientY;
        let nextLeft = left;
        let nextTop = top;
        let nextWidth = w;
        let nextHeight = h;
        let moved = false;
        let resized = false;
        const isResize = downEvent.target.closest('.xml-resize-handle');

        const onMove = (moveEvent) => {
          if (moveEvent.pointerId !== downEvent.pointerId) {
            return;
          }

          const deltaX = (moveEvent.clientX - startX) / canvasScaleX;
          const deltaY = (moveEvent.clientY - startY) / canvasScaleY;
          const dragDistance = Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY);
          if (dragDistance > 2) {
            moved = true;
            suppressClick = true;
          }

          if (!moved) {
            return;
          }

          if (isResize) {
            resized = true;
            nextWidth = clamp(w + deltaX, 1, Math.max(1, width - left));
            nextHeight = clamp(h + deltaY, 1, Math.max(1, height - top));
            box.classList.add('resizing');
            box.style.width = `${(nextWidth / width) * 100}%`;
            box.style.height = `${(nextHeight / height) * 100}%`;
          } else {
            nextLeft = clamp(left + deltaX, 0, Math.max(0, width - w));
            nextTop = clamp(top + deltaY, 0, Math.max(0, height - h));
            box.classList.add('dragging');
            box.style.left = `${(nextLeft / width) * 100}%`;
            box.style.top = `${(nextTop / height) * 100}%`;
          }
        };

        const onUp = (upEvent) => {
          if (upEvent.pointerId !== downEvent.pointerId) {
            return;
          }

          box.releasePointerCapture(upEvent.pointerId);
          box.removeEventListener('pointermove', onMove);
          box.classList.remove('dragging', 'resizing');

          if (moved) {
            commitRectChange(nextLeft, nextTop, nextWidth, nextHeight, 'XML parse error. Could not save object change.');
          } else {
            refreshPreviewAfterSelection(doc, canvas, priorSelection, index);
            focusPreviewCanvas(canvas);
          }

          setTimeout(() => {
            suppressClick = false;
          }, 0);
        };

        box.addEventListener('pointermove', onMove);
        box.addEventListener('pointerup', onUp, { once: true });
        box.addEventListener('pointercancel', onUp, { once: true });
      });

      box.addEventListener('click', (event) => {
        if (suppressClick) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        event.stopPropagation();
      });
      canvas.appendChild(box);

      if (selectedObjectIndex === index && isLineTag) {
        const linePoints = scaleLinePoints(parseLinePoints(el), scaleX, scaleY);
        [
          { key: 'start', x: linePoints.x1, y: linePoints.y1, fixedX: linePoints.x2, fixedY: linePoints.y2 },
          { key: 'end', x: linePoints.x2, y: linePoints.y2, fixedX: linePoints.x1, fixedY: linePoints.y1 }
        ].forEach((handlePoint) => {
          const handle = document.createElement('div');
          handle.className = 'xml-line-handle';
          handle.title = handlePoint.key === 'start' ? 'Line start' : 'Line end';
          handle.style.left = `${(handlePoint.x / width) * 100}%`;
          handle.style.top = `${(handlePoint.y / height) * 100}%`;
          handle.style.zIndex = '40';
          handle.style.touchAction = 'none';
          handle.addEventListener('pointerdown', (downEvent) => {
            if (downEvent.button !== 0) {
              return;
            }

            downEvent.preventDefault();
            downEvent.stopPropagation();
            handle.setPointerCapture(downEvent.pointerId);
            setSelectedObject(doc, index, el);
            populateObjectPanel(doc, index);
            focusPreviewCanvas(canvas);

            const onMove = (moveEvent) => {
              if (moveEvent.pointerId !== downEvent.pointerId) {
                return;
              }

              const point = clientToDisplayPoint(canvas, width, height, moveEvent.clientX, moveEvent.clientY);
              handle.style.left = `${(point.x / width) * 100}%`;
              handle.style.top = `${(point.y / height) * 100}%`;

              const nextPoints = handlePoint.key === 'start'
                ? { x1: point.x, y1: point.y, x2: handlePoint.fixedX, y2: handlePoint.fixedY }
                : { x1: handlePoint.fixedX, y1: handlePoint.fixedY, x2: point.x, y2: point.y };
              const bounds = getLineBounds(nextPoints);
              box.style.left = `${(bounds.minX / width) * 100}%`;
              box.style.top = `${(bounds.minY / height) * 100}%`;
              box.style.width = `${(bounds.width / width) * 100}%`;
              box.style.height = `${(bounds.height / height) * 100}%`;
              box.querySelector('svg')?.remove();
              box.appendChild(createLinePreviewSvg(
                nextPoints,
                bounds,
                resolveLineStrokeColor(el),
                Math.max(1, Number(el.getAttribute('lineWidth')) || 1)
              ));
            };

            const onUp = (upEvent) => {
              if (upEvent.pointerId !== downEvent.pointerId) {
                return;
              }

              handle.releasePointerCapture(upEvent.pointerId);
              handle.removeEventListener('pointermove', onMove);
              const point = clientToDisplayPoint(canvas, width, height, upEvent.clientX, upEvent.clientY);
              const displayPoints = handlePoint.key === 'start'
                ? { x1: point.x, y1: point.y, x2: handlePoint.fixedX, y2: handlePoint.fixedY }
                : { x1: handlePoint.fixedX, y1: handlePoint.fixedY, x2: point.x, y2: point.y };
              const xmlPoints = unscaleLinePoints(displayPoints, scaleX, scaleY);
              commitLineEndpointsChange(
                xmlPoints.x1,
                xmlPoints.y1,
                xmlPoints.x2,
                xmlPoints.y2,
                'XML parse error. Could not save line.'
              );
            };

            handle.addEventListener('pointermove', onMove);
            handle.addEventListener('pointerup', onUp, { once: true });
            handle.addEventListener('pointercancel', onUp, { once: true });
          });
          handle.addEventListener('click', (event) => {
            event.stopPropagation();
          });
          canvas.appendChild(handle);
        });
      }
    });
  }

  if (lineDrawState?.active) {
    attachLineDrawInteraction(canvas, width, height, scaleX, scaleY);
  }

  canvas.addEventListener('click', (event) => {
    if (lineDrawState?.active || suppressPreviewCanvasClick) {
      return;
    }
    if (event.target.closest('.xml-object, .xml-line-handle')) {
      return;
    }
    const priorSelection = selectedObjectIndex;
    clearObjectPanel();
    refreshPreviewAfterSelection(doc, canvas, priorSelection, null);
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

  if (isPending) {
    const sizeBanner = document.createElement('div');
    sizeBanner.className = 'preview-io-banner';
    sizeBanner.textContent = `Preview ${width}×${height} — size applies to all screens when you finish editing (XML is still ${xmlWidth}×${xmlHeight}).`;
    frame.insertBefore(sizeBanner, frame.firstChild);
  }

  previewPane.appendChild(frame);

  const refitPreview = () => fitCanvasToFrame(frame, canvas, width, height);
  schedulePreviewRefit(refitPreview);
  setTimeout(() => schedulePreviewRefit(refitPreview), 60);

  if (typeof ResizeObserver !== 'undefined') {
    previewResizeObserver = new ResizeObserver(() => schedulePreviewRefit(refitPreview));
    previewResizeObserver.observe(frame);
  }

  updatePreviewZoomLabel();
}

function isOverviewScreenName(name) {
  return displayKey(name) === displayKey('100_Overview.xml');
}

function stripOverviewEditorArtifacts(xml) {
  const source = String(xml || '').trim();
  if (!source || !/MSI_Rect_\d+/i.test(source)) {
    return source;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(source, 'text/xml');
  if (doc.querySelector('parsererror')) {
    return source;
  }

  const root = doc.querySelector('gfx');
  if (!root) {
    return source;
  }

  let changed = false;
  Array.from(root.children).forEach((child) => {
    const name = String(child.getAttribute('name') || '');
    if (/^MSI_Rect_\d+$/i.test(name)) {
      root.removeChild(child);
      changed = true;
    }
  });

  return changed ? serializeXmlDoc(doc) : source;
}

function readSizeFromXml(xml) {
  const widthMatch = xml.match(/\bwidth\s*=\s*"(\d+)"/i);
  const heightMatch = xml.match(/\bheight\s*=\s*"(\d+)"/i);
  return {
    width: widthMatch ? Number(widthMatch[1]) : null,
    height: heightMatch ? Number(heightMatch[1]) : null
  };
}

function resolvePreviewDisplaySize(displaySettings) {
  const xmlWidth = Number(displaySettings?.getAttribute('width'))
    || Number(screenWidth?.value)
    || DEFAULT_PREVIEW_WIDTH;
  const xmlHeight = Number(displaySettings?.getAttribute('height'))
    || Number(screenHeight?.value)
    || DEFAULT_PREVIEW_HEIGHT;

  let width = Number(screenWidth?.value);
  let height = Number(screenHeight?.value);
  if (!Number.isFinite(width) || width <= 0) {
    width = xmlWidth;
  }
  if (!Number.isFinite(height) || height <= 0) {
    height = xmlHeight;
  }

  return {
    width,
    height,
    xmlWidth,
    xmlHeight,
    scaleX: width / Math.max(1, xmlWidth),
    scaleY: height / Math.max(1, xmlHeight),
    isPending: width !== xmlWidth || height !== xmlHeight
  };
}

function applyRequestedSizeToEditor(options = {}) {
  const width = Number(screenWidth?.value);
  const height = Number(screenHeight?.value);
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return false;
  }
  if (!xmlEditor.value.trim()) {
    return false;
  }

  const current = readSizeFromXml(xmlEditor.value);
  if (current.width === width && current.height === height) {
    if (options.render !== false && xmlEditor.value.trim()) {
      renderPreview();
    }
    return false;
  }

  xmlEditor.value = resizeDisplayXml(xmlEditor.value, width, height);
  recordHistory(xmlEditor.value);
  if (options.render !== false) {
    renderPreview();
  }
  return true;
}

function countProjectScreens(project) {
  let total = 0;
  for (const folder of project?.folders || []) {
    total += (folder.screens || []).filter((screen) => String(screen?.xml || '').trim()).length;
  }
  return total;
}

async function saveProjectScreenXmlToServer(screen, xml) {
  const safeXml = sanitizeXmlForFactoryTalk(xml);
  const res = await fetch(`/api/displays/${encodeURIComponent(screen.name)}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ xml: safeXml })
  });
  const data = await readApiJson(res);
  if (!res.ok) {
    throw new Error(data.error || `Failed to save ${screen.name}`);
  }
  return safeXml;
}

async function applySizeToAllProjectScreens(project, width, height) {
  if (!project) {
    return { total: 0, changed: 0, failures: [] };
  }

  if (activeProjectKey && xmlEditor.value.trim()) {
    const record = getProjectScreenByKey(activeProjectKey);
    if (record?.screen) {
      record.screen.xml = xmlEditor.value;
    }
  }

  let total = 0;
  let changed = 0;
  const failures = [];

  for (const folder of project.folders || []) {
    for (const screen of folder.screens || []) {
      if (!String(screen?.xml || '').trim()) {
        continue;
      }

      total += 1;
      const current = readSizeFromXml(screen.xml);
      let nextXml = screen.xml;
      if (current.width !== width || current.height !== height) {
        nextXml = resizeDisplayXml(screen.xml, width, height);
        changed += 1;
      }

      try {
        const safeXml = await saveProjectScreenXmlToServer(screen, nextXml);
        const meta = screenMetaFromXml(screen.name, safeXml);
        screen.xml = safeXml;
        screen.width = meta.width;
        screen.height = meta.height;
        screen.sizeBytes = meta.sizeBytes;
        screen.lastModified = meta.lastModified;

        upsertCurrentDisplayRow({
          name: screen.name,
          source: 'edited',
          sizeBytes: meta.sizeBytes,
          lastModified: meta.lastModified,
          width: meta.width,
          height: meta.height
        });
      } catch (err) {
        failures.push(`${screen.name}: ${err?.message || 'Save failed'}`);
      }
    }
  }

  saveProjectList();
  renderProjectSidebar();

  if (activeProjectKey) {
    const record = getProjectScreenByKey(activeProjectKey);
    if (record?.screen?.xml) {
      xmlEditor.value = record.screen.xml;
      resetHistory(record.screen.xml);
      syncScreenPresetFromInputs();
      renderPreview();
    }
  }

  return { total, changed, failures };
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
      applyCaptionStyles(childBox, node, captionNode, captionEl);
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
        tag === 'polygon'
        && String(child.getAttribute('polygon') || '').trim()
      ) {
        nodes.push(child);
        return;
      }

      if (
        tag === 'line'
        && String(child.getAttribute('line') || '').trim()
      ) {
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
  selectedObjectIndex = null;
  selectedObjectName = null;
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
  if (objImageName) {
    objImageName.value = '';
  }
  if (objImageNameRow) {
    objImageNameRow.hidden = true;
  }
  if (objLineWidth) {
    objLineWidth.value = 1;
  }
  if (objLineStyle) {
    objLineStyle.value = 'solid';
  }
  if (objLineBackStyle) {
    objLineBackStyle.value = 'solid';
  }
  if (objGotoDisplay) {
    objGotoDisplay.value = '';
  }
  if (objIndicatorShape) {
    objIndicatorShape.value = 'rectangle';
  }
  if (objIndicatorBorderStyle) {
    objIndicatorBorderStyle.value = 'line';
  }
  if (objIndicatorBorderWidth) {
    objIndicatorBorderWidth.value = 1;
  }
  if (objPolygonPoints) {
    objPolygonPoints.value = '';
  }
  if (objTextAlignment) {
    objTextAlignment.value = 'middleCenter';
  }
  if (objTextWordWrap) {
    objTextWordWrap.value = 'false';
  }
  syncLinePropsField(null);
  syncColorControl(objBackColor, objBackColorPicker, objBackColorSwatch);
  syncColorControl(objBorderColor, objBorderColorPicker, objBorderColorSwatch);
  syncColorControl(objTextColor, objTextColorPicker, objTextColorSwatch);
}

function getObjectCaptionNode(node) {
  if (!node) {
    return null;
  }

  const visualSource = getVisualStateNode(node) || node;
  return Array.from(visualSource.children).find((child) => child.tagName === 'caption')
    || Array.from(node.children).find((child) => child.tagName === 'caption')
    || null;
}

function nodeUsesDirectFontSize(node) {
  const tag = String(node?.tagName || '').toLowerCase();
  return [
    'text',
    'stringdisplay',
    'numericdisplay',
    'alarmlist',
    'trend',
    'timeanddatedisplay',
    'listbox',
    'datagrid'
  ].includes(tag) || node?.hasAttribute('fontSize');
}

function populateObjectPanel(_doc, index) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlEditor.value, 'text/xml');
  if (doc.querySelector('parsererror')) {
    clearObjectPanel();
    return;
  }

  const nodes = getObjectNodes(doc);
  const node = nodes[index];
  if (!node) {
    clearObjectPanel();
    return;
  }

  selectedObjectIndex = index;
  selectedObjectName = String(node.getAttribute('name') || '') || null;

  const captionNode = getObjectCaptionNode(node);
  const captionValue = captionNode?.getAttribute('caption') || node.getAttribute('caption') || '';
  objType.value = node.tagName;
  objName.value = node.getAttribute('name') || '';
  objCaption.value = captionValue;
  const nodeTag = String(node.tagName || '').toLowerCase();
  if (nodeTag === 'line') {
    const points = parseLinePoints(node);
    objLeft.value = Math.round(points.x1);
    objTop.value = Math.round(points.y1);
    objWidth.value = Math.round(points.x2);
    objHeight.value = Math.round(points.y2);
  } else {
    objLeft.value = Number(node.getAttribute('left') || 0);
    objTop.value = Number(node.getAttribute('top') || 0);
    objWidth.value = Number(node.getAttribute('width') || 1);
    objHeight.value = Number(node.getAttribute('height') || 1);
  }
  objBackColor.value = node.getAttribute('backColor') || '';
  objBorderColor.value = node.getAttribute('borderColor') || '';
  if (nodeTag === 'line') {
    objTextColor.value = node.getAttribute('foreColor') || '';
    if (objLineWidth) {
      objLineWidth.value = Number(node.getAttribute('lineWidth') || 1);
    }
    if (objLineStyle) {
      objLineStyle.value = node.getAttribute('lineStyle') || 'solid';
    }
    if (objLineBackStyle) {
      objLineBackStyle.value = node.getAttribute('backStyle') || 'solid';
    }
  } else if (isGotoButtonNode(node)) {
    objTextColor.value = captionNode?.getAttribute('color') || node.getAttribute('foreColor') || '';
    if (objGotoDisplay) {
      syncGotoDisplayOptions(resolveGotoDisplayTarget(node, captionValue));
    }
  } else if (nodeTag === 'multistateindicator') {
    const activeState = getVisualStateNode(node);
    objTextColor.value = activeState?.querySelector('caption')?.getAttribute('color') || '';
    objBackColor.value = activeState?.getAttribute('backColor') || node.getAttribute('backColor') || '';
    objBorderColor.value = activeState?.getAttribute('borderColor') || node.getAttribute('borderColor') || '';
    if (objIndicatorShape) {
      objIndicatorShape.value = node.getAttribute('shape') || 'rectangle';
    }
    if (objIndicatorBorderStyle) {
      objIndicatorBorderStyle.value = node.getAttribute('borderStyle') || 'line';
    }
    if (objIndicatorBorderWidth) {
      objIndicatorBorderWidth.value = Number(node.getAttribute('borderWidth') || 1);
    }
  } else if (nodeTag === 'polygon') {
    objTextColor.value = node.getAttribute('foreColor') || '';
    if (objPolygonPoints) {
      objPolygonPoints.value = String(node.getAttribute('polygon') || '').trim();
    }
  } else if (nodeTag === 'text') {
    objTextColor.value = node.getAttribute('foreColor') || '';
    if (objTextAlignment) {
      objTextAlignment.value = node.getAttribute('alignment') || 'middleCenter';
    }
    if (objTextWordWrap) {
      objTextWordWrap.value = String(node.getAttribute('wordWrap') || 'false').toLowerCase() === 'true' ? 'true' : 'false';
    }
  } else {
    objTextColor.value = captionNode?.getAttribute('color') || node.getAttribute('foreColor') || '';
  }
  objFontSize.value = getNodeFontSize(node, captionNode);
  if (objImageName) {
    objImageName.value = getNodeImageName(node);
  }
  syncObjectImageNameField(node);
  syncLinePropsField(node);
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

function applyObjectChangesToXml(options = {}) {
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

  const nodeTag = String(node.tagName || '').toLowerCase();
  if (nodeTag === 'line') {
    setLineEndpoints(
      node,
      Number(objLeft.value) || 0,
      Number(objTop.value) || 0,
      Number(objWidth.value) || 0,
      Number(objHeight.value) || 0
    );

    if (objTextColor.value.trim()) {
      node.setAttribute('foreColor', objTextColor.value.trim());
    }
    if (objBackColor.value.trim()) {
      node.setAttribute('backColor', objBackColor.value.trim());
    }
    if (objLineWidth) {
      node.setAttribute('lineWidth', String(Math.max(1, Number(objLineWidth.value) || 1)));
    }
    if (objLineStyle) {
      node.setAttribute('lineStyle', objLineStyle.value || 'solid');
    }
    if (objLineBackStyle) {
      node.setAttribute('backStyle', objLineBackStyle.value || 'solid');
    }

    xmlEditor.value = serializeXmlDoc(doc);
    if (!options.skipHistory) {
      recordHistory(xmlEditor.value);
    }
    return true;
  }

  if (nodeTag === 'polygon') {
    if (objPolygonPoints?.value.trim()) {
      const coords = objPolygonPoints.value.trim().split(/\s+/).map(Number).filter(Number.isFinite);
      if (coords.length >= 6 && coords.length % 2 === 0) {
        const points = [];
        for (let i = 0; i < coords.length; i += 2) {
          points.push({ x: coords[i], y: coords[i + 1] });
        }
        setPolygonPoints(node, points);
      }
    } else {
      const nextLeft = Number(objLeft.value) || 0;
      const nextTop = Number(objTop.value) || 0;
      const nextWidth = Math.max(1, Number(objWidth.value) || 1);
      const nextHeight = Math.max(1, Number(objHeight.value) || 1);
      setPolygonPoints(node, [
        { x: nextLeft, y: nextTop },
        { x: nextLeft + nextWidth, y: nextTop },
        { x: nextLeft + nextWidth, y: nextTop + nextHeight },
        { x: nextLeft, y: nextTop + nextHeight }
      ]);
    }

    if (objTextColor.value.trim()) {
      node.setAttribute('foreColor', objTextColor.value.trim());
    }
    if (objBackColor.value.trim()) {
      node.setAttribute('backColor', objBackColor.value.trim());
    }

    xmlEditor.value = serializeXmlDoc(doc);
    if (!options.skipHistory) {
      recordHistory(xmlEditor.value);
    }
    return true;
  }

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

  if (isGotoButtonNode(node) && objGotoDisplay) {
    node.setAttribute('display', objGotoDisplay.value.trim());
  }

  if (nodeTag === 'multistateindicator') {
    if (objIndicatorBorderStyle) {
      node.setAttribute('borderStyle', objIndicatorBorderStyle.value || 'line');
    }
    if (objIndicatorBorderWidth) {
      node.setAttribute('borderWidth', String(Math.max(0, Number(objIndicatorBorderWidth.value) || 0)));
    }
    const activeState = getVisualStateNode(node);
    if (activeState) {
      if (objBackColor.value.trim()) {
        activeState.setAttribute('backColor', objBackColor.value.trim());
      }
      if (objBorderColor.value.trim()) {
        activeState.setAttribute('borderColor', objBorderColor.value.trim());
      }
    }
  }

  if (nodeTag === 'text') {
    if (objTextAlignment) {
      node.setAttribute('alignment', objTextAlignment.value || 'middleCenter');
    }
    if (objTextWordWrap) {
      node.setAttribute('wordWrap', objTextWordWrap.value || 'false');
    }
  }

  let captionNode = getObjectCaptionNode(node);
  const hasNodeCaption = node.hasAttribute('caption');
  const supportsCaptionChild = [
    'gotobutton',
    'momentarybutton',
    'pushbutton',
    'button',
    'multistatepushbutton'
  ].includes(nodeTag);
  const nextCaption = objCaption.value || node.getAttribute('name') || node.tagName;
  const needsCaption = hasNodeCaption || Boolean(captionNode) || objCaption.value.trim() || objTextColor.value.trim();
  const fontSizeValue = String(Math.max(1, Number(objFontSize.value) || 10));

  if (hasNodeCaption) {
    node.setAttribute('caption', nextCaption);
  }

  if (nodeTag === 'text') {
    node.setAttribute('caption', nextCaption);
    if (objTextColor.value.trim()) {
      node.setAttribute('foreColor', objTextColor.value.trim());
    }
  }

  if (!captionNode && supportsCaptionChild && needsCaption && !hasNodeCaption) {
    captionNode = doc.createElement('caption');
    const visualParent = getVisualStateNode(node) || node;
    visualParent.appendChild(captionNode);
  }

  setNodeFontSize(node, captionNode, fontSizeValue);

  if (captionNode) {
    captionNode.setAttribute('caption', nextCaption);
    if (objTextColor.value.trim()) {
      captionNode.setAttribute('color', objTextColor.value.trim());
    }
  } else if (nodeUsesDirectFontSize(node) && objTextColor.value.trim()) {
    node.setAttribute('foreColor', objTextColor.value.trim());
  }

  const nextImageName = String(objImageName?.value || '').trim();
  if (nodeTag === 'image') {
    if (nextImageName) {
      node.setAttribute('imageName', nextImageName);
    } else {
      node.removeAttribute('imageName');
    }
  } else if (nextImageName) {
    let imageSettingsNode = Array.from(node.children).find((child) => child.tagName === 'imageSettings');
    if (!imageSettingsNode) {
      imageSettingsNode = doc.createElement('imageSettings');
      node.appendChild(imageSettingsNode);
    }
    imageSettingsNode.setAttribute('imageName', nextImageName);
    if (!imageSettingsNode.getAttribute('alignment')) {
      imageSettingsNode.setAttribute('alignment', 'middleCenter');
    }
    if (!imageSettingsNode.getAttribute('backStyle')) {
      imageSettingsNode.setAttribute('backStyle', 'transparent');
    }
    if (!imageSettingsNode.getAttribute('scaled')) {
      imageSettingsNode.setAttribute('scaled', 'false');
    }
  }

  xmlEditor.value = serializeXmlDoc(doc);
  if (!options.skipHistory) {
    recordHistory(xmlEditor.value);
  }
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
  let screenXml = isOverviewScreenName(screen.name)
    ? stripOverviewEditorArtifacts(xml)
    : xml;
  screenXml = repairGotoButtonsInXml(screenXml);
  xmlEditor.value = screenXml;
  resetHistory(screenXml);
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
    tagsExportZone: '',
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
      const paramFile = getProjectParameterFile(project, 'PLC DI List 01')
        || (project.parametersFiles || []).find((file) => /\.par$/i.test(file.name));
      const ioFile = (project.ioListFiles || [])[project.ioListFiles.length - 1];
      const tagCount = converted?.parsed?.tags?.length || 0;
      const zones = (converted?.parsed?.meta?.zones || []).join(', ') || 'IO List';
      const counts = converted?.parsed?.meta?.counts || {};
      const sdi = counts.sdi ?? counts.safetyDi ?? 0;
      const di = counts.di ?? counts.plcDi ?? 0;
      const sdo = counts.sdo ?? counts.safetyDo ?? 0;
      const doCount = counts.do ?? counts.plcDo ?? 0;
      if (ioFile) {
        openProjectIoListFile(project, ioFile);
      } else {
        await openProjectIoListPreviewScreen(project);
      }
      alert(
        `IO list imported successfully.\n`
        + `${tagCount} tags ready — use Download Tags CSV in the IO List editor (or IO List → ↓ in the sidebar).\n`
        + `IO types: SDI ${sdi}, DI ${di}, SDO ${sdo}, DO ${doCount}\n`
        + `${(project.parametersFiles || []).filter((file) => /\.par$/i.test(file.name)).length} parameter file(s) generated (PLC DI/DO + Safety DI/DO).\n`
        + `Zones: ${zones}\n`
        + (converted?.plcTagMatchStats?.total
          ? `PLC tag matching: ${converted.plcTagMatchStats.matched}/${converted.plcTagMatchStats.total} IO points matched from RSLogix CSV.\n`
          : getProjectPlcLogicTagsFile(project)
            ? ''
            : 'Tip: upload RSLogix Tags CSV (IO List → PLC) to replace inferred tag addresses with PLC logic tags.\n')
        + '\nTags are grouped by IO type from Excel Input/Output Type (SDI, DI, SDO, DO).\n'
        + 'The editable IO list table is open in Preview. Click Apply Changes after edits, then use Open Screen Preview (IO or DO from the Zone dropdown).'
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

if (projectPlcLogicTagsInput) {
  projectPlcLogicTagsInput.addEventListener('change', async () => {
    const pending = pendingPlcLogicTagsUpload;
    pendingPlcLogicTagsUpload = null;
    const files = Array.from(projectPlcLogicTagsInput.files || []);
    projectPlcLogicTagsInput.value = '';

    if (!pending?.projectId || !files.length) {
      return;
    }

    try {
      const result = await importProjectPlcLogicTagsFiles(pending.projectId, files);
      const stats = result?.stats;
      alert(
        stats?.total
          ? `PLC logic tags imported.\nTYPE column filtered: ALIAS rows skipped.\nMatched ${stats.matched}/${stats.total} IO points from ${stats.rslogixEntries} RSLogix entries (${(stats.rslogixRowTypes || []).join(', ') || 'TAG'} rows).`
          : 'PLC logic tags imported. Upload the IO list Master Sheet first, then re-upload the RSLogix Tags CSV to match tag addresses.'
      );
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not import PLC logic tags.');
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

const previewZoomOutBtn = document.getElementById('previewZoomOutBtn');
const previewZoomInBtn = document.getElementById('previewZoomInBtn');
const previewZoomResetBtn = document.getElementById('previewZoomResetBtn');

if (previewZoomOutBtn) {
  previewZoomOutBtn.addEventListener('click', () => {
    adjustPreviewZoom(-PREVIEW_ZOOM_STEP);
  });
}

if (previewZoomInBtn) {
  previewZoomInBtn.addEventListener('click', () => {
    adjustPreviewZoom(PREVIEW_ZOOM_STEP);
  });
}

if (previewZoomResetBtn) {
  previewZoomResetBtn.addEventListener('click', () => {
    setPreviewZoomLevel(1);
    refitActivePreviewCanvas();
  });
}

if (previewPane) {
  previewPane.addEventListener('wheel', (event) => {
    if (!event.ctrlKey || !getActivePreviewDisplayCanvas()) {
      return;
    }
    event.preventDefault();
    adjustPreviewZoom(event.deltaY > 0 ? -PREVIEW_ZOOM_STEP : PREVIEW_ZOOM_STEP);
  }, { passive: false });
}

updatePreviewZoomLabel();

let xmlEditorHistoryTimer = null;
if (xmlEditor) {
  xmlEditor.addEventListener('input', () => {
    if (applyingHistory) {
      return;
    }
    clearTimeout(xmlEditorHistoryTimer);
    xmlEditorHistoryTimer = setTimeout(() => {
      recordHistory(xmlEditor.value);
      renderPreview();
    }, 400);
  });
}

let previewSizeInputTimer = null;
let applyAllSizeTimer = null;
let applyingSizeToAll = false;

function schedulePreviewForScreenSizeChange() {
  syncScreenPresetFromInputs();
  clearTimeout(previewSizeInputTimer);
  previewSizeInputTimer = setTimeout(() => {
    if (xmlEditor.value.trim()) {
      renderPreview();
    }
  }, 120);
}

async function applyRequestedSizeToAllScreens(options = {}) {
  const width = Number(screenWidth?.value);
  const height = Number(screenHeight?.value);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return;
  }
  if (applyingSizeToAll) {
    return;
  }

  applyingSizeToAll = true;
  try {
    const project = getActiveProject();
    const projectScreenCount = countProjectScreens(project);

    if (project && projectScreenCount > 0) {
      const result = await applySizeToAllProjectScreens(project, width, height);
      if (usingUploadedList) {
        renderDisplays(currentDisplayRows);
      } else {
        await refreshDisplays();
      }

      if (result.failures.length && options.alertOnFailure !== false) {
        alert(
          `Updated ${result.changed} of ${result.total} screen(s) to ${width}×${height}.\n\n`
          + `Some saves failed:\n${result.failures.slice(0, 5).join('\n')}`
          + (result.failures.length > 5 ? `\n...and ${result.failures.length - 5} more` : '')
        );
      }
      return;
    }

    if (!applyRequestedSizeToEditor({ render: true })) {
      return;
    }

    const targetDisplayName = getTargetDisplayName();
    if (!targetDisplayName) {
      return;
    }

    await saveDisplayXml(targetDisplayName, xmlEditor.value);
    updateCurrentDisplayRow(targetDisplayName, xmlEditor.value);
    if (usingUploadedList) {
      renderDisplays(currentDisplayRows);
    } else {
      await refreshDisplays();
    }
  } catch (err) {
    if (options.alertOnFailure !== false) {
      alert(err.message || 'Could not apply size to screens.');
    }
  } finally {
    applyingSizeToAll = false;
  }
}

function scheduleApplySizeToAllScreens() {
  syncScreenPresetFromInputs();
  clearTimeout(applyAllSizeTimer);
  applyAllSizeTimer = setTimeout(() => {
    applyRequestedSizeToAllScreens({ alertOnFailure: true }).catch((err) => {
      console.error(err);
    });
  }, 350);
}

if (screenSizePreset) {
  screenSizePreset.addEventListener('change', () => {
    applyScreenPreset(screenSizePreset.value);
    scheduleApplySizeToAllScreens();
  });
}

if (screenWidth) {
  screenWidth.addEventListener('input', schedulePreviewForScreenSizeChange);
  screenWidth.addEventListener('change', scheduleApplySizeToAllScreens);
}

if (screenHeight) {
  screenHeight.addEventListener('input', schedulePreviewForScreenSizeChange);
  screenHeight.addEventListener('change', scheduleApplySizeToAllScreens);
}

if (addObjectBtn) {
  addObjectBtn.addEventListener('click', addButtonObject);
}
if (addImageBtn) {
  addImageBtn.addEventListener('click', () => {
    addImageObject().catch((err) => {
      console.error(err);
      alert(err?.message || 'Could not add image.');
    });
  });
}
if (addLineBtn) {
  addLineBtn.addEventListener('click', addLineObject);
}
if (addGotoDisplayBtn) {
  addGotoDisplayBtn.addEventListener('click', addGotoDisplayObject);
}
if (addTextBtn) {
  addTextBtn.addEventListener('click', addTextObject);
}
if (addMsiRectBtn) {
  addMsiRectBtn.addEventListener('click', () => addMultistateIndicatorObject('rectangle'));
}
if (addMsiCircleBtn) {
  addMsiCircleBtn.addEventListener('click', () => addMultistateIndicatorObject('circle'));
}
if (addPolygonBtn) {
  addPolygonBtn.addEventListener('click', addPolygonObject);
}

if (browseImageBtn) {
  browseImageBtn.addEventListener('click', () => {
    if (selectedObjectIndex === null) {
      queueImageLibraryUpload('insert');
      return;
    }
    queueImageLibraryUpload('replace');
  });
}

if (imageLibraryUploadInput) {
  imageLibraryUploadInput.addEventListener('change', async () => {
    const file = imageLibraryUploadInput.files?.[0];
    const mode = String(imageLibraryUploadInput.dataset.uploadMode || 'insert');
    imageLibraryUploadInput.value = '';
    if (!file) {
      return;
    }

    try {
      if (mode === 'replace') {
        await replaceSelectedObjectImageFromFile(file);
      } else {
        await addImageObjectFromFile(file);
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || 'Could not upload image.');
    }
  });
}

refreshImageLibraryOptions().catch(() => {});
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

function closeWorkspaceMenus() {
  for (const group of document.querySelectorAll('[data-menu-group].open')) {
    group.classList.remove('open');
    const trigger = group.querySelector('.menu-label');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  }
}

function initWorkspaceMenuBar() {
  const menuBar = document.querySelector('.app-menu-bar');
  if (!menuBar) {
    return;
  }

  for (const group of menuBar.querySelectorAll('[data-menu-group]')) {
    const trigger = group.querySelector('.menu-label');
    const popup = group.querySelector('.menu-popup');
    if (!trigger || !popup) {
      continue;
    }

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = !group.classList.contains('open');
      closeWorkspaceMenus();
      if (willOpen) {
        group.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    for (const item of popup.querySelectorAll('[role="menuitem"]')) {
      item.addEventListener('click', () => {
        closeWorkspaceMenus();
      });
    }
  }

  document.addEventListener('click', closeWorkspaceMenus);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeWorkspaceMenus();
    }
  });
}

initWorkspaceMenuBar();

applyObjectBtn.addEventListener('click', () => {
  const changed = applyObjectChangesToXml();
  if (!changed) {
    return;
  }
  renderPreview();
});

if (objGotoDisplay) {
  objGotoDisplay.addEventListener('change', () => {
    if (selectedObjectIndex === null) {
      return;
    }
    if (applyObjectChangesToXml()) {
      renderPreview();
    }
  });
}

let objectFontSizePreviewTimer = null;
function scheduleObjectPropertyPreview() {
  if (selectedObjectIndex === null) {
    return;
  }
  clearTimeout(objectFontSizePreviewTimer);
  objectFontSizePreviewTimer = setTimeout(() => {
    if (applyObjectChangesToXml({ skipHistory: true })) {
      recordHistory(xmlEditor.value);
      renderPreview();
    }
  }, 250);
}

if (objFontSize) {
  objFontSize.addEventListener('input', scheduleObjectPropertyPreview);
  objFontSize.addEventListener('change', () => {
    if (applyObjectChangesToXml()) {
      renderPreview();
    }
  });
}

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
  await loadProjectsOnStartup();
  normalizeProjectList();

  const restoredProject = getProjectById(activeProjectId) || projectList[0] || null;
  if (restoredProject) {
    setActiveProject(restoredProject);
  } else {
    setProjectName(currentProjectName);
  }

  let restoredScreen = false;
  const savedScreenKey = localStorage.getItem(ACTIVE_PROJECT_SCREEN_STORAGE_KEY) || '';
  if (savedScreenKey) {
    const parsed = parseProjectKey(savedScreenKey);
    if (parsed && getProjectById(parsed.projectId)) {
      try {
        await openProjectScreen(parsed.projectId, parsed.folderName, parsed.screenName, { skipSave: true });
        restoredScreen = true;
      } catch (_err) {
        restoredScreen = false;
      }
    }
  }

  if (!restoredScreen && restoredProject) {
    const firstFolder = restoredProject.folders?.[0];
    const firstScreen = firstFolder?.screens?.[0];
    if (firstFolder && firstScreen) {
      setEditorProjectScreen(restoredProject, firstFolder.name, firstScreen, firstScreen.xml);
      updateProjectSidebarSelection();
    }
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
  clearObjectPanel();
  try {
    await refreshDisplays();
  } catch (_err) {
    // Display list is optional during startup.
  }
  renderPreview();
}

window.addEventListener('pagehide', flushProjectPersistence);
window.addEventListener('beforeunload', flushProjectPersistence);

window.addEventListener('resize', () => {
  enforceProjectSidebarLayout();
  if (xmlEditor.value.trim()) {
    renderPreview();
  }
});

document.addEventListener('keydown', (event) => {
  if (tryDeleteSelectedObjectFromKeyboard(event)) {
    return;
  }
}, true);

document.addEventListener('keydown', (event) => {
  if (handleDisplayHistoryShortcut(event)) {
    return;
  }

  const active = document.activeElement;
  if (blocksObjectKeyboardShortcuts(active)) {
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

  if (key === 'Escape' && lineDrawState?.active) {
    event.preventDefault();
    cancelLineDrawMode();
    return;
  }

  if (ctrlOrCmd && key.toLowerCase() === 'v') {
    if (copiedObjectXml) {
      event.preventDefault();
      pasteCopiedObject();
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


