const urlParams = new URLSearchParams(window.location.search);
const EMBED_MODE = urlParams.get('embed') === '1';
const STUDIO_EDIT = urlParams.get('studioEdit') === '1';
const PROJECT_ID = urlParams.get('project') || '';
const START_SCREEN = urlParams.get('screen') || '';
const GLOBAL_OBJECT = urlParams.get('globalObject') || '';
const EMBED_WIDTH = Number(urlParams.get('w')) || null;
const EMBED_HEIGHT = Number(urlParams.get('h')) || null;

const screenContent = document.getElementById('screenContent');
const screenTitle = document.getElementById('screenTitle');
const projectName = document.getElementById('projectName');
const commStatus = document.getElementById('commStatus');
const alarmBanner = document.getElementById('alarmBanner');
const alarmBannerText = document.getElementById('alarmBannerText');
const navUser = document.getElementById('navUser');
const headerIndicators = document.getElementById('headerIndicators');
const navBar = document.getElementById('navBar');

let socket = null;
try {
  if (typeof io === 'function') socket = io({ transports: ['websocket', 'polling'] });
} catch (err) {
  console.warn('Socket.IO unavailable:', err);
}

const state = {
  tags: {},
  alarms: { active: [], unacknowledgedCount: 0, history: [] },
  currentScreen: null,
  screenHistory: [],
  loadedScreen: null,
  activeParameterFile: null,
  parameterFiles: typeof ParameterFiles !== 'undefined'
    ? ParameterFiles.mergeParameterFiles()
    : {},
  currentUser: null,
  navigation: null,
  userCallbacks: [],
  projectId: PROJECT_ID,
  projectRuntime: { width: 800, height: 600 },
  projectSubtitle: '',
  displaySize: { width: 800, height: 600 },
  communication: { driver: 'simulator', connected: false }
};

function apiUrl(path) {
  const pid = state.projectId || PROJECT_ID;
  if (!pid) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}project=${encodeURIComponent(pid)}`;
}

function apiPost(path, body = {}) {
  return fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function hydrateTagsFromServer() {
  try {
    const res = await fetchWithTimeout(apiUrl('/api/runtime/tags'));
    if (!res.ok) return;
    applyTagsSnapshot(await res.json());
  } catch {
    /* offline / starting up */
  }
}

function fetchWithTimeout(url, ms = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

function updateCommStatusUI(communication) {
  if (!commStatus) return;
  state.communication = communication || state.communication;
  const label = commStatus.querySelector('span:last-child');
  const effectiveDriver = communication?.effectiveDriver || communication?.driver || 'simulator';
  const isSimulator = effectiveDriver === 'simulator';
  if (communication?.connected) {
    commStatus.classList.add('connected');
    if (label) {
      if (isSimulator) {
        label.textContent = 'Simulator';
      } else {
        const ip = communication.plcIpAddress ? ` @ ${communication.plcIpAddress}` : '';
        label.textContent = `Live PLC${ip}`;
      }
    }
  } else {
    commStatus.classList.remove('connected');
    if (label) {
      if (isSimulator) {
        label.textContent = 'Simulator';
      } else {
        label.textContent = communication?.quality === 'bad' ? 'PLC Offline' : 'Connecting...';
      }
    }
  }
  syncCommModeDialogFields();
}

function isValidIpv4(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

function syncCommModeDialogFields() {
  const driverEl = document.getElementById('runtimeCommDriver');
  const ipRow = document.getElementById('runtimeCommIpRow');
  const pathRow = document.getElementById('runtimeCommPathRow');
  const ipEl = document.getElementById('runtimeCommIp');
  const pathEl = document.getElementById('runtimeCommPath');
  const statusEl = document.getElementById('runtimeCommStatus');
  if (!driverEl) return;
  const comm = state.communication || {};
  const effectiveDriver = comm.effectiveDriver || comm.driver || 'simulator';
  driverEl.value = effectiveDriver;
  if (ipEl && comm.plcIpAddress) ipEl.value = comm.plcIpAddress;
  if (pathEl && comm.path != null) pathEl.value = comm.path;
  const isLive = driverEl.value === 'ethernet-ip';
  ipRow?.classList.toggle('hidden', !isLive);
  pathRow?.classList.toggle('hidden', !isLive);
  if (statusEl) {
    statusEl.textContent = comm.connected
      ? (isLive ? 'Connected to PLC' : 'Simulator active')
      : (isLive ? (comm.error || 'PLC not connected') : 'Simulator active');
    statusEl.className = `runtime-comm-status ${comm.connected || isLive === false ? 'ok' : 'error'}`;
  }
}

function openCommModeDialog() {
  if (EMBED_MODE || STUDIO_EDIT) return;
  syncCommModeDialogFields();
  document.getElementById('runtimeCommDialog')?.showModal();
}

async function applyCommMode(persist = false) {
  const driverEl = document.getElementById('runtimeCommDriver');
  const ipEl = document.getElementById('runtimeCommIp');
  const pathEl = document.getElementById('runtimeCommPath');
  const persistEl = document.getElementById('runtimeCommPersist');
  const statusEl = document.getElementById('runtimeCommStatus');
  const driver = driverEl?.value || 'simulator';
  const plcIpAddress = ipEl?.value.trim() || '';
  const path = pathEl?.value.trim() || '0';
  if (driver === 'ethernet-ip' && !isValidIpv4(plcIpAddress)) {
    if (statusEl) {
      statusEl.textContent = 'Enter a valid PLC IP address';
      statusEl.className = 'runtime-comm-status error';
    }
    return;
  }
  if (statusEl) {
    statusEl.textContent = 'Switching...';
    statusEl.className = 'runtime-comm-status';
  }
  try {
    const res = await apiPost('/api/runtime/communication/mode', {
      driver,
      plcIpAddress,
      path,
      persist: persist || Boolean(persistEl?.checked)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Switch failed');
    updateCommStatusUI({
      ...data.status,
      effectiveDriver: data.communication?.driver,
      plcIpAddress: data.communication?.plcIpAddress,
      path: data.communication?.path
    });
    await hydrateTagsFromServer();
    if (statusEl) {
      const liveOk = driver === 'ethernet-ip' && data.status?.connected;
      statusEl.textContent = driver === 'simulator'
        ? 'Simulator active'
        : (liveOk ? 'Connected to PLC' : (data.status?.error || 'PLC not connected'));
      statusEl.className = `runtime-comm-status ${driver === 'simulator' || liveOk ? 'ok' : 'error'}`;
    }
    document.getElementById('runtimeCommDialog')?.close();
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = err.message || 'Switch failed';
      statusEl.className = 'runtime-comm-status error';
    }
  }
}

async function testCommConnection() {
  const driverEl = document.getElementById('runtimeCommDriver');
  const ipEl = document.getElementById('runtimeCommIp');
  const pathEl = document.getElementById('runtimeCommPath');
  const statusEl = document.getElementById('runtimeCommStatus');
  const driver = driverEl?.value || 'simulator';
  if (driver === 'simulator') {
    if (statusEl) {
      statusEl.textContent = 'Simulator does not require a PLC connection';
      statusEl.className = 'runtime-comm-status ok';
    }
    return;
  }
  const plcIpAddress = ipEl?.value.trim() || '';
  if (!isValidIpv4(plcIpAddress)) {
    if (statusEl) {
      statusEl.textContent = 'Enter a valid PLC IP address';
      statusEl.className = 'runtime-comm-status error';
    }
    return;
  }
  if (statusEl) {
    statusEl.textContent = 'Testing connection...';
    statusEl.className = 'runtime-comm-status';
  }
  try {
    const res = await apiPost('/api/runtime/communication/test', {
      driver,
      plcIpAddress,
      path: pathEl?.value.trim() || '0'
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Connection failed');
    if (statusEl) {
      statusEl.textContent = data.controller
        ? `Connected — ${data.controller}${data.version ? ` v${data.version}` : ''}`
        : 'PLC reachable';
      statusEl.className = 'runtime-comm-status ok';
    }
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = err.message || 'Connection failed';
      statusEl.className = 'runtime-comm-status error';
    }
  }
}

function initCommModeDialog() {
  if (EMBED_MODE) return;
  commStatus?.addEventListener('click', openCommModeDialog);
  commStatus?.setAttribute('title', 'Click to switch Simulator / Live PLC');
  commStatus?.classList.add('comm-status-clickable');
  document.getElementById('runtimeCommDriver')?.addEventListener('change', syncCommModeDialogFields);
  document.getElementById('runtimeCommApply')?.addEventListener('click', () => applyCommMode(false));
  document.getElementById('runtimeCommTest')?.addEventListener('click', testCommConnection);
  document.getElementById('runtimeCommCancel')?.addEventListener('click', () => {
    document.getElementById('runtimeCommDialog')?.close();
  });
}

function applyDisplayCanvasSize(width, height, backgroundColor) {
  const bg = backgroundColor || '#EBEBEB';

  if (EMBED_MODE) {
    document.documentElement.classList.add('embed-root');
    document.body.classList.add('embed-body');
    const app = document.getElementById('app');
    if (app) {
      app.style.width = '100%';
      app.style.height = '100%';
    }
    screenContent.style.background = bg;
    screenContent.style.padding = '0';
    screenContent.style.overflow = 'hidden';
    screenContent.style.width = '100%';
    screenContent.style.height = '100%';
    if (width && height) state.displaySize = { width, height };
    return;
  }

  const w = width || state.displaySize.width || 800;
  const h = height || state.displaySize.height || 600;
  state.displaySize = { width: w, height: h };

  const app = document.getElementById('app');
  if (app) {
    app.style.width = `${w}px`;
    app.style.height = `${h}px`;
  }

  screenContent.style.background = bg;
}

function resolveScreenSize(screen) {
  const rt = state.projectRuntime || {};
  const ds = screen?.displaySettings || {};
  const useProject = ds.useProjectSize || (!ds.width && !ds.height);
  return {
    width: useProject ? (rt.width || 800) : (ds.width || rt.width || 800),
    height: useProject ? (rt.height || 600) : (ds.height || rt.height || 600),
    backgroundColor: ds.backgroundColor || rt.displayBackground || '#EBEBEB'
  };
}

function createContext() {
  const bindings = new Map();

  return {
    currentScreen: state.currentScreen,
    navigation: state.navigation,

    projectId: state.projectId,
    projectSubtitle: state.projectSubtitle,

    navigate: (screenId, opts = {}) => {
      if (STUDIO_EDIT) return;
      loadScreen(screenId, opts);
    },

    getActiveParameterFile() {
      return state.activeParameterFile;
    },

    resolveTag(ref) {
      if (typeof ParameterFiles === 'undefined') return ref;
      return ParameterFiles.resolveTag(ref, state.activeParameterFile, state.parameterFiles);
    },
    navigateBack: () => {
      if (STUDIO_EDIT) return;
      const prev = state.screenHistory?.pop();
      if (prev) loadScreen(prev, { skipHistory: true });
    },
    closeDisplay: () => {
      if (STUDIO_EDIT) return;
      const prev = state.screenHistory?.pop();
      if (prev) loadScreen(prev, { skipHistory: true });
    },
    studioEdit: STUDIO_EDIT,

    getTagValue(tagName) {
      return state.tags[tagName]?.value;
    },

    getCurrentUser() {
      return state.currentUser;
    },

    bindTag(tagName, callback) {
      bindings.set(tagName, callback);
      if (state.tags[tagName]) callback(state.tags[tagName].value);
    },

    onAlarmUpdate(callback) {
      callback(state.alarms);
      state.alarmCallbacks = state.alarmCallbacks || [];
      state.alarmCallbacks.push(callback);
    },

    onUserChange(callback) {
      state.userCallbacks.push(callback);
      callback(state.currentUser);
    },

    async writeTag(tag, value) {
      const res = await apiPost('/api/runtime/tags/write', { tag, value });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Tag write failed');
      }
    },

    async acknowledgeAlarm(alarmId) {
      await apiPost('/api/runtime/alarms/acknowledge', { alarmId });
    },

    async acknowledgeAllAlarms() {
      await apiPost('/api/runtime/alarms/acknowledge', { all: true });
    },

    async clearAlarmHistory() {
      await apiPost('/api/runtime/alarms/clear-history', {});
    },

    async login(username, password) {
      const res = await apiPost('/api/runtime/login', { username, password });
      return res.json();
    },

    async logout() {
      await apiPost('/api/runtime/logout', {});
    },

    _bindings: bindings
  };
}

function buildNavBar() {
  if (!state.navigation?.mainNav) return;
  navBar.innerHTML = '';
  for (const item of state.navigation.mainNav) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.screen = item.screen;
    btn.dataset.group = item.group;
    const icons = { home: '⌂', settings: '⚙', manual: '☞', alarms: '🔔', recipe: '📋', legends: 'ℹ', user: '👤' };
    btn.innerHTML = `<span class="nav-icon">${icons[item.icon] || '•'}</span><span>${item.label}</span>`;
    navBar.appendChild(btn);
  }
  const spacer = document.createElement('div');
  spacer.className = 'nav-spacer';
  navBar.appendChild(spacer);
  const userEl = document.createElement('div');
  userEl.className = 'nav-user';
  userEl.id = 'navUser';
  userEl.textContent = state.currentUser?.username || 'Guest';
  navBar.appendChild(userEl);
}

function composedSideShellMissing(screen) {
  if (!screen?._composed || !screen?.navGroup) return false;
  const components = screen.components || [];
  if (screen.navGroup === 'manual') {
    return !components.some((c) => c.name?.startsWith('ManualNav_'));
  }
  if (screen.navGroup === 'overview') {
    return !components.some((c) => c.name?.startsWith('OverviewNav_'));
  }
  if (screen.navGroup === 'alarms') {
    return !components.some((c) => c.name?.startsWith('AlarmNav_'));
  }
  if (screen.navGroup === 'settings') {
    return !components.some((c) => c.name === 'ScreenSubtitle' && c._source === 'shell');
  }
  return false;
}

async function composeWithTemplate(screen) {
  if (!screen || screen.kind === 'global-object') return screen;
  if (screen._composed && !composedSideShellMissing(screen)) return screen;
  const compose = typeof TemplateCompose !== 'undefined' ? TemplateCompose : null;
  if (!compose) return screen;
  const cfg = compose.resolveTemplateConfig(screen);
  if (!cfg.enabled) return screen;
  try {
    const tplRes = await fetch(apiUrl(`/api/runtime/global-objects/${encodeURIComponent(cfg.globalObjectId)}`));
    if (!tplRes.ok) return screen;
    const template = await tplRes.json();
    if (!template?.components?.length) return screen;
    return compose.composeScreen(screen, template, state.projectRuntime);
  } catch {
    return screen;
  }
}

async function fetchRawScreen(screenId) {
  const res = await fetchWithTimeout(apiUrl(`/api/runtime/screens/${encodeURIComponent(screenId)}?raw=1&_=${Date.now()}`));
  if (!res.ok) return null;
  return res.json();
}

function resolveScreenParameterFile(screenId, screen, options = {}) {
  if (options.parameterFile) return options.parameterFile;
  if (options.clearParameter) return null;
  if (screen?.defaultParameterFile) return screen.defaultParameterFile;
  if (screenId === '301_PLC_IO_List') return 'PLC DO List 01';
  return null;
}

function applyActiveParameterFile(screen, parameterFile) {
  if (!parameterFile || typeof ParameterFiles === 'undefined') return screen;
  return ParameterFiles.applyParameterFile(screen, parameterFile, state.parameterFiles);
}

async function syncParameterFileTagValues(parameterFile) {
  if (!parameterFile) return;
  try {
    await apiPost('/api/runtime/parameter-file/apply', { parameterFile });
    await hydrateTagsFromServer();
  } catch (err) {
    console.warn('Parameter file tag sync failed:', err);
  }
}

async function loadScreen(screenId, options = {}) {
  const sameScreen = state.currentScreen === screenId;
  if (!options.skipHistory && state.currentScreen && !sameScreen) {
    state.screenHistory.push(state.currentScreen);
  }
  state.tagBindings = [];
  state.alarmCallbacks = [];
  state.userCallbacks = [];

  try {
    const res = await fetchWithTimeout(apiUrl(`/api/runtime/screens/${encodeURIComponent(screenId)}?_=${Date.now()}`));
    if (!res.ok) throw new Error('not found');
    let screen = await res.json();
    if (!screen._composed || composedSideShellMissing(screen)) {
      const raw = await fetchRawScreen(screenId);
      screen = await composeWithTemplate(raw ? { ...raw, _composed: false } : screen);
    } else if (!screen._composed) {
      screen = await composeWithTemplate(screen);
    }

    const parameterFile = resolveScreenParameterFile(screenId, screen, options);
    if (parameterFile) state.activeParameterFile = parameterFile;
    else if (!sameScreen) state.activeParameterFile = null;

    screen = applyActiveParameterFile(screen, state.activeParameterFile);
    await syncParameterFileTagValues(state.activeParameterFile);
    await renderLoadedScreen(screen, screenId);
  } catch {
    renderPlaceholder(screenId);
    state.currentScreen = screenId;
    state.activeParameterFile = null;
    updateNav(null);
    screenTitle.textContent = screenId.replace(/^\d+_/, '').replace(/_/g, ' ');
  }
}

async function loadGlobalObject(objectId) {
  state.tagBindings = [];
  state.alarmCallbacks = [];
  state.userCallbacks = [];

  try {
    const res = await fetchWithTimeout(apiUrl(`/api/runtime/global-objects/${objectId}`));
    if (!res.ok) throw new Error('not found');
    const screen = await res.json();
    await renderLoadedScreen(screen, objectId);
  } catch {
    renderPlaceholder(objectId);
    state.currentScreen = objectId;
    updateNav(null);
    screenTitle.textContent = objectId.replace(/_/g, ' ');
  }
}

async function renderLoadedScreen(screen, screenId) {
  applyTemplateChrome(screen);

  state.currentScreen = screenId;
  state.loadedScreen = screen;
  await hydrateTagsFromServer();
  renderScreen(screen);
  updateNav(screen.navGroup);
  screenTitle.textContent = screen.title;

  syncTagBindings();
  const tagNames = collectTags(screen.components);
  if (tagNames.length) socket?.emit('subscribe', tagNames);
}

function collectTags(components) {
  const tags = [];
  for (const comp of components || []) {
    if (comp.tag) tags.push(comp.tag);
    if (comp.rows) {
      if (Array.isArray(comp.rows[0])) {
        for (const row of comp.rows) {
          for (const entry of row) {
            if (entry.tag) tags.push(entry.tag);
          }
        }
      } else {
        comp.rows.forEach((r) => {
          if (r.tag) tags.push(r.tag);
          if (r.actTag) tags.push(r.actTag);
          if (r.reqTag) tags.push(r.reqTag);
        });
      }
    }
    if (comp.coil?.tag) tags.push(comp.coil.tag);
    if (comp.children) tags.push(...collectTags(comp.children));
  }
  return [...new Set(tags)];
}

function applyTemplateChrome(screen) {
  const app = document.getElementById('app');
  if (!app) return;
  if (EMBED_MODE) {
    app.classList.remove('template-mode');
    return;
  }
  app.classList.toggle('template-mode', Boolean(screen?._composed));
}

function renderScreen(screen) {
  const size = resolveScreenSize(screen);
  applyDisplayCanvasSize(size.width, size.height, size.backgroundColor);
  screenContent.innerHTML = '';
  ComponentRegistry._alarmListControllers?.clear?.();
  screenContent.style.position = 'relative';
  if (EMBED_MODE) {
    screenContent.style.width = '100%';
    screenContent.style.height = '100%';
  }
  const ctx = createContext();
  state.activeContext = ctx;
  (screen.components || []).forEach((comp, index) => {
    try {
      const el = ComponentRegistry.render(comp, ctx);
      el.dataset.componentIndex = String(index);
      if (comp._displayIndex != null) el.dataset.displayIndex = String(comp._displayIndex);
      if (comp._source) el.dataset.source = comp._source;
      if (comp.type) el.dataset.componentType = comp.type;
      screenContent.appendChild(el);
    } catch (err) {
      console.error(`Render failed for ${comp?.type || 'component'} ${comp?.name || index}:`, err);
      const fallback = document.createElement('div');
      fallback.className = 'unknown-component ft-graphic';
      fallback.textContent = `Render error: ${comp?.type || 'unknown'}`;
      if (comp?.left != null) fallback.style.left = `${comp.left}px`;
      if (comp?.top != null) fallback.style.top = `${comp.top}px`;
      screenContent.appendChild(fallback);
    }
  });
}

function attachStudioEditHandlers() {
  const canvas = document.getElementById('screenContent');
  if (!canvas || canvas.dataset.studioEditBound === '1') return;
  canvas.dataset.studioEditBound = '1';

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const graphic = e.target.closest('.ft-graphic[data-name]');
    if (graphic) return;
    window.parent.postMessage({ type: 'planthmi-embed-canvas-background-click' }, '*');
  });

  canvas.addEventListener('click', (e) => {
    const graphic = e.target.closest('.ft-graphic[data-name]');
    if (!graphic) return;
    window.parent.postMessage({
      type: 'planthmi-embed-graphic-click',
      name: graphic.dataset.name,
      componentType: graphic.dataset.componentType || '',
      source: graphic.dataset.source || '',
      componentIndex: graphic.dataset.componentIndex || null
    }, '*');
  });

  canvas.addEventListener('dblclick', (e) => {
    const graphic = e.target.closest('.ft-graphic[data-name]');
    if (!graphic) return;
    e.preventDefault();
    e.stopPropagation();
    window.parent.postMessage({
      type: 'planthmi-embed-graphic-dblclick',
      name: graphic.dataset.name,
      componentType: graphic.dataset.componentType || '',
      source: graphic.dataset.source || '',
      componentIndex: graphic.dataset.componentIndex || null
    }, '*');
  });
}

function patchPreviewComponent(index, comp) {
  if (!state.loadedScreen?.components?.[index]) return false;
  const ctx = state.activeContext || createContext();
  const existing = screenContent.querySelector(`[data-component-index="${index}"]`);
  const el = ComponentRegistry.render(comp, ctx);
  el.dataset.componentIndex = String(index);
  if (comp.type) el.dataset.componentType = comp.type;
  if (comp._source) el.dataset.source = comp._source;
  if (existing) existing.replaceWith(el);
  else screenContent.appendChild(el);
  state.loadedScreen.components[index] = comp;
  return true;
}

function appendPreviewComponent(index, comp) {
  if (!state.loadedScreen) return false;
  const ctx = state.activeContext || createContext();
  const el = ComponentRegistry.render(comp, ctx);
  el.dataset.componentIndex = String(index);
  if (comp.type) el.dataset.componentType = comp.type;
  if (comp._source) el.dataset.source = comp._source;
  screenContent.appendChild(el);
  if (!state.loadedScreen.components) state.loadedScreen.components = [];
  state.loadedScreen.components[index] = comp;
  return true;
}

function removePreviewComponent(index) {
  if (!state.loadedScreen?.components?.[index]) return false;
  screenContent.querySelector(`[data-component-index="${index}"]`)?.remove();
  state.loadedScreen.components.splice(index, 1);
  screenContent.querySelectorAll('[data-component-index]').forEach((node) => {
    const i = Number(node.dataset.componentIndex);
    if (i > index) node.dataset.componentIndex = String(i - 1);
  });
  return true;
}

function updatePreviewComponentBounds(index, bounds) {
  const comp = state.loadedScreen?.components?.[index];
  const el = screenContent.querySelector(`[data-component-index="${index}"]`);
  if (!comp || !el) return false;
  Object.assign(comp, bounds);
  if (comp.type === 'Arc' || comp.type === 'Ellipse' || comp.type === 'Wedge') {
    ComponentRegistry.applyArcAppearance(el, comp);
  } else if (comp.type === 'Freehand') {
    ComponentRegistry.applyFreehandAppearance(el, comp);
  } else if (comp.type === 'Line') {
    ComponentRegistry.applyLineAppearance(el, comp);
  } else if (comp.type === 'Polygon' || comp.type === 'Polyline') {
    ComponentRegistry.applyPolygonAppearance(el, comp);
  } else if (comp.type === 'RoundedRectangle') {
    ComponentRegistry.applyRoundedRectangleAppearance(el, comp);
  } else {
    ComponentRegistry.applyGraphicsObject(el, comp);
  }
  return true;
}

function findPreviewGraphicByName(name) {
  if (!name) return null;
  const el = screenContent?.querySelector(`.ft-graphic[data-name="${CSS.escape(name)}"]`);
  if (!el) return null;
  const index = Number(el.dataset.componentIndex);
  const comp = Number.isFinite(index) ? state.loadedScreen?.components?.[index] : null;
  return { el, index, comp };
}

function updatePreviewComponentBoundsByName(name, bounds) {
  const hit = findPreviewGraphicByName(name);
  if (!hit?.comp || !hit.el) return false;
  let patch = { ...bounds };
  if (hit.comp.type === 'Freehand' && hit.comp.points?.length) {
    const oldW = hit.comp.width || 1;
    const oldH = hit.comp.height || 1;
    const newW = bounds.width ?? hit.comp.width ?? oldW;
    const newH = bounds.height ?? hit.comp.height ?? oldH;
    if (bounds.width != null || bounds.height != null) {
      const sx = newW / oldW;
      const sy = newH / oldH;
      if (Math.abs(sx - 1) > 0.0001 || Math.abs(sy - 1) > 0.0001) {
        patch.points = hit.comp.points.map((p) => ({ x: p.x * sx, y: p.y * sy }));
      }
    }
  } else if ((hit.comp.type === 'Polygon' || hit.comp.type === 'Polyline') && hit.comp.points?.length) {
    const oldW = hit.comp.width || 1;
    const oldH = hit.comp.height || 1;
    const newW = bounds.width ?? hit.comp.width ?? oldW;
    const newH = bounds.height ?? hit.comp.height ?? oldH;
    if (bounds.width != null || bounds.height != null) {
      const sx = newW / oldW;
      const sy = newH / oldH;
      if (Math.abs(sx - 1) > 0.0001 || Math.abs(sy - 1) > 0.0001) {
        patch.points = hit.comp.points.map((p) => ({ x: p.x * sx, y: p.y * sy }));
      }
    }
  } else if (hit.comp.type === 'Line') {
    const oldW = hit.comp.width || 1;
    const oldH = hit.comp.height || 1;
    const newW = bounds.width ?? hit.comp.width ?? oldW;
    const newH = bounds.height ?? hit.comp.height ?? oldH;
    if (bounds.width != null || bounds.height != null) {
      const sx = newW / oldW;
      const sy = newH / oldH;
      if (Math.abs(sx - 1) > 0.0001 || Math.abs(sy - 1) > 0.0001) {
        patch.x1 = (Number(hit.comp.x1) || 0) * sx;
        patch.y1 = (Number(hit.comp.y1) || 0) * sy;
        patch.x2 = (hit.comp.x2 != null ? Number(hit.comp.x2) : oldW) * sx;
        patch.y2 = (hit.comp.y2 != null ? Number(hit.comp.y2) : oldH) * sy;
      }
    }
  }
  Object.assign(hit.comp, patch);
  if (hit.comp.type === 'Arc' || hit.comp.type === 'Ellipse' || hit.comp.type === 'Wedge') {
    ComponentRegistry.applyArcAppearance(hit.el, hit.comp);
  } else if (hit.comp.type === 'Freehand') {
    ComponentRegistry.applyFreehandAppearance(hit.el, hit.comp);
  } else if (hit.comp.type === 'Line') {
    ComponentRegistry.applyLineAppearance(hit.el, hit.comp);
  } else if (hit.comp.type === 'Polygon' || hit.comp.type === 'Polyline') {
    ComponentRegistry.applyPolygonAppearance(hit.el, hit.comp);
  } else if (hit.comp.type === 'RoundedRectangle') {
    ComponentRegistry.applyRoundedRectangleAppearance(hit.el, hit.comp);
  } else {
    ComponentRegistry.applyGraphicsObject(hit.el, hit.comp);
  }
  return true;
}

function patchPreviewComponentByName(name, comp) {
  if (!state.loadedScreen || !name) return false;
  const ctx = state.activeContext || createContext();
  const hit = findPreviewGraphicByName(name);

  if (hit?.el && hit.index != null) {
    const merged = { ...(hit.comp || {}), ...comp, name: hit.comp?.name || name };
    const el = ComponentRegistry.render(merged, ctx);
    el.dataset.componentIndex = String(hit.index);
    if (merged.type) el.dataset.componentType = merged.type;
    if (merged._source) el.dataset.source = merged._source;
    hit.el.replaceWith(el);
    if (!state.loadedScreen.components) state.loadedScreen.components = [];
    state.loadedScreen.components[hit.index] = merged;
    return true;
  }

  if (!state.loadedScreen.components) state.loadedScreen.components = [];
  const index = state.loadedScreen.components.length;
  const merged = { ...comp, name: comp.name || name };
  const el = ComponentRegistry.render(merged, ctx);
  el.dataset.componentIndex = String(index);
  if (merged.type) el.dataset.componentType = merged.type;
  if (merged._source) el.dataset.source = merged._source;
  screenContent.appendChild(el);
  state.loadedScreen.components.push(merged);
  return true;
}

function removePreviewComponentByName(name) {
  const hit = findPreviewGraphicByName(name);
  if (!hit?.el || hit.index == null) return false;
  hit.el.remove();
  state.loadedScreen.components.splice(hit.index, 1);
  screenContent.querySelectorAll('[data-component-index]').forEach((node) => {
    const i = Number(node.dataset.componentIndex);
    if (i > hit.index) node.dataset.componentIndex = String(i - 1);
  });
  return true;
}

function syncPreviewComponents(components) {
  if (!state.loadedScreen) return false;
  state.loadedScreen = { ...state.loadedScreen, components: [...components] };
  renderScreen(state.loadedScreen);
  return true;
}

function applyStudioSelection(name) {
  screenContent?.querySelectorAll('.ft-graphic.studio-selected').forEach((el) => {
    el.classList.remove('studio-selected');
  });
  if (name) {
    screenContent?.querySelector(`.ft-graphic[data-name="${CSS.escape(name)}"]`)
      ?.classList.add('studio-selected');
  }
  return true;
}

function handleStudioPreviewMessage(data) {
  switch (data.action) {
    case 'patch':
      return patchPreviewComponent(data.index, data.component);
    case 'append':
      return appendPreviewComponent(data.index, data.component);
    case 'remove':
      return removePreviewComponent(data.index);
    case 'bounds':
      return updatePreviewComponentBounds(data.index, data.bounds);
    case 'bounds-by-name':
      return updatePreviewComponentBoundsByName(data.name, data.bounds);
    case 'patch-by-name':
      return patchPreviewComponentByName(data.name, data.component);
    case 'remove-by-name':
      return removePreviewComponentByName(data.name);
    case 'sync-components':
      return syncPreviewComponents(data.components);
    case 'selection':
      return applyStudioSelection(data.name || null);
    default:
      return false;
  }
}

function renderAccessDenied(screen) {
  screenContent.innerHTML = `
    <div class="access-denied">
      <h2>Access Denied</h2>
      <p><strong>${screen.title}</strong> requires security level ${screen.securityLevel}.</p>
      <p>Current level: ${state.currentUser?.level ?? 0} (${state.currentUser?.username || 'Guest'})</p>
      <button type="button" class="action-btn primary" onclick="loadScreen('700_User_Management')">Login</button>
    </div>`;
}

function renderPlaceholder(screenId) {
  screenContent.innerHTML = `<div class="placeholder-screen"><h2>${screenId.replace(/^\d+_/, '').replace(/_/g, ' ')}</h2><p>Screen not configured.</p></div>`;
}

function updateNav(activeGroup) {
  navBar.querySelectorAll('button[data-group]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.group === activeGroup);
  });
}

function updateTagBindings(tagName, value) {
  state.activeContext?._bindings?.get(tagName)?.(value);
}

function syncTagBindings() {
  if (!state.activeContext?._bindings) return;
  for (const [name, tag] of Object.entries(state.tags)) {
    if (tag?.value !== undefined) updateTagBindings(name, tag.value);
  }
}

function applyTagsSnapshot(tags) {
  for (const [name, tag] of Object.entries(tags || {})) {
    if (!state.tags[name]) state.tags[name] = {};
    if (tag?.value !== undefined) {
      state.tags[name].value = tag.value;
      updateTagBindings(name, tag.value);
    }
  }
}

function updateAlarmBanner() {
  if (EMBED_MODE) {
    alarmBanner?.classList.add('hidden');
    return;
  }
  const unacked = state.alarms.active?.filter((a) => !a.acknowledged) || [];
  if (unacked.length) {
    alarmBannerText.textContent = unacked.sort((a, b) => a.priority - b.priority)[0].message;
    alarmBanner.classList.remove('hidden');
  } else {
    alarmBanner.classList.add('hidden');
  }
}

function updateAlarmUI() {
  updateAlarmBanner();
  for (const cb of state.alarmCallbacks || []) cb(state.alarms);
}

function updateUserUI() {
  const userEl = document.getElementById('navUser');
  if (userEl) userEl.textContent = state.currentUser?.username || 'Guest';
  for (const cb of state.userCallbacks || []) cb(state.currentUser);
}

navBar.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-screen]');
  if (btn) loadScreen(btn.dataset.screen);
});

document.getElementById('ackBannerBtn').addEventListener('click', () => {
  apiPost('/api/runtime/alarms/acknowledge', { all: true });
});

if (socket) {
  socket.on('init', (data) => {
    state.tags = data.tags || {};
    state.alarms = data.alarms || { active: [], history: [] };
    state.currentUser = data.user;
    updateCommStatusUI(data.communication);
    updateUserUI();
    updateAlarmBanner();
    syncTagBindings();
  });

  socket.on('tags', (tags) => {
    applyTagsSnapshot(tags);
  });

  socket.on('tag-update', (update) => {
    if (!state.tags[update.name]) state.tags[update.name] = {};
    state.tags[update.name].value = update.value;
    updateTagBindings(update.name, update.value);
  });

  socket.on('alarm-update', (alarms) => {
    state.alarms = alarms;
    updateAlarmUI();
  });

  socket.on('user-changed', (user) => {
    state.currentUser = user;
    updateUserUI();
  });

  socket.on('communication-changed', (communication) => {
    updateCommStatusUI(communication);
  });
}

async function hydrateEmbedRuntimeMeta() {
  try {
    const statusRes = await fetchWithTimeout(apiUrl('/api/runtime/status'));
    if (!statusRes.ok) return;
    const status = await statusRes.json();
    state.projectId = status.projectId || state.projectId || PROJECT_ID;
    state.projectSubtitle = status.projectSubtitle || '';
    state.projectRuntime = status.runtime || state.projectRuntime;
    if (status.parameterFiles && typeof ParameterFiles !== 'undefined') {
      state.parameterFiles = ParameterFiles.mergeParameterFiles(status.parameterFiles);
    }
    updateCommStatusUI(status.communication);
    if (EMBED_WIDTH && EMBED_HEIGHT) {
      state.projectRuntime = { ...state.projectRuntime, width: EMBED_WIDTH, height: EMBED_HEIGHT };
    }
    projectName.textContent = status.projectName || 'Plant HMI';
    updateUserUI();
    if (!state.navigation) {
      try {
        const navRes = await fetchWithTimeout(apiUrl('/api/runtime/navigation'));
        if (navRes.ok) state.navigation = await navRes.json();
      } catch { /* optional for embed preview */ }
    }
  } catch (err) {
    console.warn('Embed runtime meta load failed:', err);
  }
}

async function init() {
  if (EMBED_MODE) {
    document.documentElement.classList.add('embed-root');
    document.getElementById('runtimeHeader')?.classList.add('hidden');
    document.getElementById('navBar')?.classList.add('hidden');
    document.getElementById('alarmBanner')?.classList.add('hidden');
    document.getElementById('app')?.classList.add('embed-mode');
    if (STUDIO_EDIT) {
      document.body.classList.add('studio-edit-mode');
    }
    applyDisplayCanvasSize(EMBED_WIDTH, EMBED_HEIGHT);
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      window.parent.postMessage({ type: 'planthmi-embed-contextmenu', x: e.clientX, y: e.clientY }, '*');
    });
    window.addEventListener('message', (e) => {
      if (e.data?.type !== 'planthmi-preview') return;
      handleStudioPreviewMessage(e.data);
    });
    if (PROJECT_ID) state.projectId = PROJECT_ID;

    try {
      if (GLOBAL_OBJECT) {
        await loadGlobalObject(GLOBAL_OBJECT);
      } else if (START_SCREEN) {
        await loadScreen(START_SCREEN);
      } else {
        const statusRes = await fetchWithTimeout(apiUrl('/api/runtime/status'));
        if (statusRes.ok) {
          const status = await statusRes.json();
          await loadScreen(status.startupScreen || '100_Overview');
        }
      }
    } catch (err) {
      console.error('Embed preview load failed:', err);
      renderPlaceholder(GLOBAL_OBJECT || START_SCREEN || 'Preview');
      if (screenTitle) screenTitle.textContent = 'Preview error';
    }

    if (STUDIO_EDIT) {
      try {
        attachStudioEditHandlers();
      } catch (err) {
        console.error('Studio edit handlers failed:', err);
      }
    }

    hydrateEmbedRuntimeMeta().catch(() => {});
    return;
  }

  const clockEl = document.getElementById('clock');
  if (clockEl) clockEl.textContent = new Date().toLocaleString();
  setInterval(() => {
    const el = document.getElementById('clock');
    if (el) el.textContent = new Date().toLocaleString();
  }, 1000);

  try {
    const [statusRes, navRes] = await Promise.all([
      fetchWithTimeout(apiUrl('/api/runtime/status')),
      fetchWithTimeout(apiUrl('/api/runtime/navigation'))
    ]);
    if (!statusRes.ok || !navRes.ok) {
      throw new Error(`Server returned ${statusRes.status}/${navRes.status}`);
    }
    const status = await statusRes.json();
    state.projectId = status.projectId || state.projectId || PROJECT_ID;
    state.projectSubtitle = status.projectSubtitle || '';
    state.projectRuntime = status.runtime || { width: 800, height: 600 };
    if (status.parameterFiles && typeof ParameterFiles !== 'undefined') {
      state.parameterFiles = ParameterFiles.mergeParameterFiles(status.parameterFiles);
    }
    updateCommStatusUI(status.communication);
    state.navigation = await navRes.json();
    projectName.textContent = status.projectName || 'Plant HMI';
    buildNavBar();
    updateUserUI();
    applyDisplayCanvasSize(state.projectRuntime.width, state.projectRuntime.height);
    if (GLOBAL_OBJECT) {
      await loadGlobalObject(GLOBAL_OBJECT);
    } else {
      const screen = START_SCREEN || status.startupScreen || '100_Overview';
      await loadScreen(screen);
    }
  } catch (err) {
    console.error('Runtime init failed:', err);
    screenTitle.textContent = 'Connection error';
    updateCommStatusUI({ connected: false, quality: 'bad' });
  }
}

window.loadScreen = loadScreen;
initCommModeDialog();
init().catch((err) => console.error('Runtime init failed:', err));
