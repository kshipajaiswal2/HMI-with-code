const socket = io();

const urlParams = new URLSearchParams(window.location.search);
const EMBED_MODE = urlParams.get('embed') === '1';
const PROJECT_ID = urlParams.get('project') || '';
const START_SCREEN = urlParams.get('screen') || '';
const GLOBAL_OBJECT = urlParams.get('globalObject') || '';
const EMBED_WIDTH = Number(urlParams.get('w')) || null;
const EMBED_HEIGHT = Number(urlParams.get('h')) || null;

const state = {
  tags: {},
  alarms: { active: [], unacknowledgedCount: 0, history: [] },
  currentScreen: null,
  currentUser: null,
  navigation: null,
  userCallbacks: [],
  projectId: PROJECT_ID,
  projectRuntime: { width: 800, height: 600 },
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

    navigate: (screenId) => loadScreen(screenId),

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

async function loadScreen(screenId) {
  state.tagBindings = [];
  state.alarmCallbacks = [];
  state.userCallbacks = [];

  try {
    const res = await fetch(apiUrl(`/api/runtime/screens/${screenId}`));
    if (!res.ok) throw new Error('not found');
    const screen = await res.json();
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
  const userLevel = state.currentUser?.level ?? 0;
  if (screen.securityLevel && userLevel < screen.securityLevel) {
    const size = resolveScreenSize(screen);
    applyDisplayCanvasSize(size.width, size.height, size.backgroundColor);
    renderAccessDenied(screen);
    state.currentScreen = screenId;
    updateNav(screen.navGroup);
    screenTitle.textContent = screen.title;
    return;
  }

  state.currentScreen = screenId;
  renderScreen(screen);
  updateNav(screen.navGroup);
  screenTitle.textContent = screen.title;

  const tagNames = collectTags(screen.components);
  if (tagNames.length) socket.emit('subscribe', tagNames);
}

function collectTags(components) {
  const tags = [];
  for (const comp of components || []) {
    if (comp.tag) tags.push(comp.tag);
    if (comp.rows) comp.rows.forEach((r) => { if (r.tag) tags.push(r.tag); });
    if (comp.children) tags.push(...collectTags(comp.children));
  }
  return [...new Set(tags)];
}

function renderScreen(screen) {
  const size = resolveScreenSize(screen);
  applyDisplayCanvasSize(size.width, size.height, size.backgroundColor);
  screenContent.innerHTML = '';
  const ctx = createContext();
  state.activeContext = ctx;
  for (const comp of screen.components || []) {
    screenContent.appendChild(ComponentRegistry.render(comp, ctx));
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
    applyDisplayCanvasSize(EMBED_WIDTH, EMBED_HEIGHT);
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      window.parent.postMessage({ type: 'planthmi-embed-contextmenu', x: e.clientX, y: e.clientY }, '*');
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
