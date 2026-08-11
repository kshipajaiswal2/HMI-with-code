const socket = io();

const urlParams = new URLSearchParams(window.location.search);
const EMBED_MODE = urlParams.get('embed') === '1';
const STUDIO_EDIT = urlParams.get('studioEdit') === '1';
const PROJECT_ID = urlParams.get('project') || '';
const START_SCREEN = urlParams.get('screen') || '';
const GLOBAL_OBJECT = urlParams.get('globalObject') || '';
const EMBED_WIDTH = Number(urlParams.get('w')) || null;
const EMBED_HEIGHT = Number(urlParams.get('h')) || null;

const state = {
  tags: {},
  alarms: { active: [], unacknowledgedCount: 0, history: [] },
  currentScreen: null,
  loadedScreen: null,
  currentUser: null,
  navigation: null,
  userCallbacks: [],
  projectId: PROJECT_ID,
  projectRuntime: { width: 800, height: 600 },
  projectSubtitle: '',
  displaySize: { width: 800, height: 600 }
};

function apiUrl(path) {
  if (!state.projectId) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}project=${encodeURIComponent(state.projectId)}`;
}

const screenContent = document.getElementById('screenContent');
const screenTitle = document.getElementById('screenTitle');
const projectName = document.getElementById('projectName');
const commStatus = document.getElementById('commStatus');
const alarmBanner = document.getElementById('alarmBanner');
const alarmBannerText = document.getElementById('alarmBannerText');
const navUser = document.getElementById('navUser');
const headerIndicators = document.getElementById('headerIndicators');
const navBar = document.getElementById('navBar');

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

    navigate: (screenId) => {
      if (STUDIO_EDIT) return;
      loadScreen(screenId);
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
      await fetch('/api/runtime/tags/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag, value })
      });
    },

    async acknowledgeAlarm(alarmId) {
      await fetch('/api/runtime/alarms/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alarmId })
      });
    },

    async acknowledgeAllAlarms() {
      await fetch('/api/runtime/alarms/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
    },

    async login(username, password) {
      const res = await fetch('/api/runtime/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return res.json();
    },

    async logout() {
      await fetch('/api/runtime/logout', { method: 'POST' });
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

async function composeWithTemplate(screen) {
  if (!screen || screen._composed || screen.kind === 'global-object') return screen;
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

async function loadScreen(screenId) {
  state.tagBindings = [];
  state.alarmCallbacks = [];
  state.userCallbacks = [];

  try {
    const res = await fetch(apiUrl(`/api/runtime/screens/${screenId}?raw=1&_=${Date.now()}`));
    if (!res.ok) throw new Error('not found');
    const raw = await res.json();
    const screen = await composeWithTemplate(raw);
    await renderLoadedScreen(screen, screenId);
  } catch {
    renderPlaceholder(screenId);
    state.currentScreen = screenId;
    updateNav(null);
    screenTitle.textContent = screenId.replace(/^\d+_/, '').replace(/_/g, ' ');
  }
}

async function loadGlobalObject(objectId) {
  state.tagBindings = [];
  state.alarmCallbacks = [];
  state.userCallbacks = [];

  try {
    const res = await fetch(apiUrl(`/api/runtime/global-objects/${objectId}`));
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
  renderScreen(screen);
  updateNav(screen.navGroup);
  screenTitle.textContent = screen.title;

  syncTagBindings();
  const tagNames = collectTags(screen.components);
  if (tagNames.length) socket.emit('subscribe', tagNames);
  await hydrateTagsFromServer();
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
  screenContent.style.position = 'relative';
  if (EMBED_MODE) {
    screenContent.style.width = '100%';
    screenContent.style.height = '100%';
  }
  const ctx = createContext();
  state.activeContext = ctx;
  (screen.components || []).forEach((comp, index) => {
    const el = ComponentRegistry.render(comp, ctx);
    el.dataset.componentIndex = String(index);
    if (comp._displayIndex != null) el.dataset.displayIndex = String(comp._displayIndex);
    if (comp._source) el.dataset.source = comp._source;
    if (comp.type) el.dataset.componentType = comp.type;
    screenContent.appendChild(el);
  });
}

function attachStudioEditHandlers() {
  if (!screenContent || screenContent.dataset.studioEditBound === '1') return;
  screenContent.dataset.studioEditBound = '1';

  screenContent.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const graphic = e.target.closest('.ft-graphic[data-name]');
    if (graphic) return;
    window.parent.postMessage({ type: 'planthmi-embed-canvas-background-click' }, '*');
  });

  screenContent.addEventListener('click', (e) => {
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

  screenContent.addEventListener('dblclick', (e) => {
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
  ComponentRegistry.applyGraphicsObject(el, comp);
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

async function hydrateTagsFromServer() {
  try {
    const res = await fetch(apiUrl('/api/runtime/tags'));
    if (!res.ok) return;
    applyTagsSnapshot(await res.json());
  } catch {
    /* offline / starting up */
  }
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
  fetch('/api/runtime/alarms/acknowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true })
  });
});

socket.on('init', (data) => {
  state.tags = data.tags || {};
  state.alarms = data.alarms || { active: [], history: [] };
  state.currentUser = data.user;
  if (data.communication?.connected) {
    commStatus.classList.add('connected');
    commStatus.querySelector('span:last-child').textContent = 'Simulator';
  }
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

async function init() {
  if (EMBED_MODE) {
    document.documentElement.classList.add('embed-root');
    document.getElementById('runtimeHeader')?.classList.add('hidden');
    document.getElementById('navBar')?.classList.add('hidden');
    document.getElementById('alarmBanner')?.classList.add('hidden');
    document.getElementById('app')?.classList.add('embed-mode');
    if (STUDIO_EDIT) {
      document.body.classList.add('studio-edit-mode');
      attachStudioEditHandlers();
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
  }

  document.getElementById('clock').textContent = new Date().toLocaleString();
  setInterval(() => { document.getElementById('clock').textContent = new Date().toLocaleString(); }, 1000);

  try {
    const [statusRes, navRes] = await Promise.all([
      fetch(apiUrl('/api/runtime/status')),
      fetch(apiUrl('/api/runtime/navigation'))
    ]);
    const status = await statusRes.json();
    state.projectId = status.projectId || state.projectId;
    state.projectSubtitle = status.projectSubtitle || '';
    state.projectRuntime = status.runtime || { width: 800, height: 600 };
    if (EMBED_MODE && EMBED_WIDTH && EMBED_HEIGHT) {
      state.projectRuntime = { ...state.projectRuntime, width: EMBED_WIDTH, height: EMBED_HEIGHT };
    }
    state.navigation = await navRes.json();
    projectName.textContent = status.projectName || 'Plant HMI';
    if (!EMBED_MODE) buildNavBar();
    updateUserUI();
    if (!EMBED_MODE) {
      applyDisplayCanvasSize(state.projectRuntime.width, state.projectRuntime.height);
    }
    if (GLOBAL_OBJECT) {
      await loadGlobalObject(GLOBAL_OBJECT);
    } else {
      const screen = START_SCREEN || status.startupScreen || '100_Overview';
      await loadScreen(screen);
    }
  } catch {
    screenTitle.textContent = 'Connection error';
  }
}

window.loadScreen = loadScreen;
init();
