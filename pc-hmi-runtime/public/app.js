const socket = io();

const state = {
  tags: {},
  alarms: { active: [], unacknowledgedCount: 0 },
  currentScreen: null,
  currentUser: null,
  tagBindings: new Map(),
  alarmCallbacks: []
};

const screenContent = document.getElementById('screenContent');
const screenTitle = document.getElementById('screenTitle');
const projectName = document.getElementById('projectName');
const commStatus = document.getElementById('commStatus');
const alarmBanner = document.getElementById('alarmBanner');
const alarmBannerText = document.getElementById('alarmBannerText');
const navUser = document.getElementById('navUser');
const headerIndicators = document.getElementById('headerIndicators');
const navBar = document.getElementById('navBar');

function createContext() {
  const bindings = new Map();

  return {
    navigate: (screenId) => loadScreen(screenId),

    bindTag(tagName, callback) {
      bindings.set(tagName, callback);
      if (state.tags[tagName]) {
        callback(state.tags[tagName].value);
      }
    },

    onAlarmUpdate(callback) {
      state.alarmCallbacks.push(callback);
      callback(state.alarms);
    },

    async acknowledgeAlarm(alarmId) {
      await fetch('/api/runtime/alarms/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alarmId })
      });
    },

    _bindings: bindings
  };
}

async function loadScreen(screenId) {
  state.tagBindings.clear();
  state.alarmCallbacks = [];

  try {
    const res = await fetch(`/api/runtime/screens/${screenId}`);
    if (!res.ok) throw new Error('not found');
    const screen = await res.json();
    renderScreen(screen);
    state.currentScreen = screenId;
    updateNav(screen.navGroup);
    screenTitle.textContent = screen.title;

    const tagNames = collectTags(screen.components);
    if (tagNames.length) {
      socket.emit('subscribe', tagNames);
    }
  } catch {
    renderPlaceholder(screenId);
    state.currentScreen = screenId;
    updateNav(null);
    screenTitle.textContent = screenId.replace(/^\d+_/, '').replace(/_/g, ' ');
  }
}

function collectTags(components) {
  const tags = [];
  for (const comp of components || []) {
    if (comp.tag) tags.push(comp.tag);
    if (comp.children) tags.push(...collectTags(comp.children));
  }
  return tags;
}

function renderScreen(screen) {
  screenContent.innerHTML = '';
  const ctx = createContext();
  state.activeContext = ctx;

  for (const comp of screen.components) {
    screenContent.appendChild(ComponentRegistry.render(comp, ctx));
  }
}

function renderPlaceholder(screenId) {
  const name = screenId.replace(/^\d+_/, '').replace(/_/g, ' ');
  screenContent.innerHTML = `
    <div class="placeholder-screen">
      <h2>${name}</h2>
      <p>This screen is not yet configured.</p>
      <p>Add a JSON definition in <code>screens/${screenId}.json</code></p>
    </div>
  `;
}

function updateNav(activeGroup) {
  navBar.querySelectorAll('button[data-group]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.group === activeGroup);
  });
}

function updateTagBindings(tagName, value) {
  if (state.activeContext?._bindings?.has(tagName)) {
    state.activeContext._bindings.get(tagName)(value);
  }
  updateHeaderIndicators();
}

function updateHeaderIndicators() {
  headerIndicators.innerHTML = '';
  const mode = state.tags['System.AutoMode'];
  const health = state.tags['System.Healthy'];

  if (mode) {
    const el = document.createElement('div');
    el.className = 'header-indicator';
    const isAuto = mode.value === true || mode.value === 1;
    el.textContent = isAuto ? 'Auto' : 'Manual';
    el.style.backgroundColor = isAuto ? '#00c000' : '#0066cc';
    headerIndicators.appendChild(el);
  }

  if (health) {
    const el = document.createElement('div');
    el.className = 'header-indicator';
    const isOk = health.value === true || health.value === 1;
    el.textContent = isOk ? 'Healthy' : 'Fault';
    el.style.backgroundColor = isOk ? '#00c000' : '#cc0000';
    headerIndicators.appendChild(el);
  }
}

function updateAlarmBanner() {
  const unacked = state.alarms.active?.filter((a) => !a.acknowledged) || [];
  if (unacked.length) {
    const top = unacked.sort((a, b) => a.priority - b.priority)[0];
    alarmBannerText.textContent = top.message;
    alarmBanner.classList.remove('hidden');
  } else {
    alarmBanner.classList.add('hidden');
  }
}

function updateAlarmUI() {
  updateAlarmBanner();
  for (const cb of state.alarmCallbacks) {
    cb(state.alarms);
  }
}

function updateClock() {
  document.getElementById('clock').textContent = new Date().toLocaleString();
}

navBar.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-screen]');
  if (btn) loadScreen(btn.dataset.screen);
});

document.getElementById('ackBannerBtn').addEventListener('click', async () => {
  await fetch('/api/runtime/alarms/acknowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true })
  });
});

socket.on('init', (data) => {
  state.tags = data.tags || {};
  state.alarms = data.alarms || { active: [] };
  state.currentUser = data.user;

  if (data.communication?.connected) {
    commStatus.classList.add('connected');
    commStatus.querySelector('span:last-child').textContent = 'Simulator';
  }

  navUser.textContent = state.currentUser?.username || 'Guest';
  updateHeaderIndicators();
  updateAlarmBanner();
});

socket.on('tag-update', (update) => {
  if (!state.tags[update.name]) {
    state.tags[update.name] = {};
  }
  state.tags[update.name].value = update.value;
  updateTagBindings(update.name, update.value);
});

socket.on('alarm-update', (alarms) => {
  state.alarms = alarms;
  updateAlarmUI();
});

socket.on('user-changed', (user) => {
  state.currentUser = user;
  navUser.textContent = user?.username || 'Guest';
});

async function init() {
  updateClock();
  setInterval(updateClock, 1000);

  try {
    const res = await fetch('/api/runtime/status');
    const status = await res.json();
    projectName.textContent = status.projectName || 'Plant HMI';
    await loadScreen(status.startupScreen || '100_Overview');
  } catch {
    screenTitle.textContent = 'Connection error';
  }
}

init();
