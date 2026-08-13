/**
 * FactoryTalk-style theme color picker for Plant HMI Studio.
 * Uses one shared popover for all inputs (avoids 100+ duplicate dropdown DOM trees).
 */
(function () {
  const RECENT_KEY = 'plantHmiStudio.recentColors';
  const MAX_RECENT = 20;
  const SELECTED_BORDER = '#F99746';

  const THEME_COLORS = [
    '#FFFFFF', '#000000', '#EEECE1', '#1F497D', '#4F81BD', '#C0504D', '#9BBB59', '#8064A2', '#4BACC6', '#F79646',
    '#F2F2F2', '#7F7F7F', '#DDD9C3', '#C6D9F0', '#DCE6F1', '#F2DCDB', '#EBF1DD', '#E5E0EC', '#DBEEF3', '#FDEADA',
    '#D9D9D9', '#595959', '#C4BD97', '#8DB4E2', '#B8CCE4', '#E5B9B7', '#D7E3BC', '#CCC1D9', '#B7DDE8', '#FBD5B5',
    '#BFBFBF', '#3F3F3F', '#938953', '#548DD4', '#95B3D7', '#D99694', '#C3D69B', '#B2A2C7', '#92CDDC', '#FAC08F',
    '#000000', '#000000', '#494429', '#17365D', '#366092', '#953734', '#76923C', '#5F497A', '#31859B', '#E36C09'
  ];

  const NAMED_COLORS = {
    black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', blue: '#0000ff',
    navy: '#000080', gray: '#808080', grey: '#808080', yellow: '#ffff00', lime: '#00ff00',
    aqua: '#00ffff', cyan: '#00ffff', magenta: '#ff00ff', orange: '#ffa500', purple: '#800080',
    silver: '#c0c0c0', teal: '#008080', maroon: '#800000'
  };

  const normalizedColorCache = new Map();
  const boundInputs = new WeakMap();
  let activeInput = null;
  let activeTrigger = null;
  let sharedPopover = null;
  let themeGrid = null;
  let recentGrid = null;
  let otherBtn = null;
  let nativeInput = null;

  function normalizeColor(raw) {
    if (raw == null || raw === '') return '#000000';
    let str = String(raw).trim();
    if (!str) return '#000000';
    const cacheKey = str.toLowerCase();
    if (normalizedColorCache.has(cacheKey)) return normalizedColorCache.get(cacheKey);

    let result = '#000000';
    if (str.startsWith('#')) {
      str = str.toLowerCase();
      if (str.length === 4) {
        result = `#${str[1]}${str[1]}${str[2]}${str[2]}${str[3]}${str[3]}`;
      } else if (/^#[0-9a-f]{6}$/.test(str)) {
        result = str;
      }
    } else {
      const named = NAMED_COLORS[cacheKey];
      if (named) result = named;
      else {
        const probe = document.createElement('div');
        probe.style.color = str;
        document.documentElement.appendChild(probe);
        const computed = getComputedStyle(probe).color;
        probe.remove();
        const match = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (match) {
          const hex = (n) => Number(n).toString(16).padStart(2, '0');
          result = `#${hex(match[1])}${hex(match[2])}${hex(match[3])}`;
        }
      }
    }
    normalizedColorCache.set(cacheKey, result);
    return result;
  }

  function colorsMatch(a, b) {
    return normalizeColor(a).toLowerCase() === normalizeColor(b).toLowerCase();
  }

  function loadRecent() {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeColor).filter(Boolean).slice(0, MAX_RECENT);
    } catch {
      return [];
    }
  }

  function saveRecent(colors) {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(colors.slice(0, MAX_RECENT)));
    } catch { /* ignore */ }
  }

  function addRecent(color) {
    const hex = normalizeColor(color);
    const next = [hex, ...loadRecent().filter((c) => !colorsMatch(c, hex))];
    saveRecent(next);
    return next;
  }

  function ensureSharedPopover() {
    if (sharedPopover) return;

    sharedPopover = document.createElement('div');
    sharedPopover.className = 'ft-color-dropdown hidden';
    sharedPopover.innerHTML = `
      <div class="ft-color-section">
        <div class="ft-color-section-title">Theme Colors</div>
        <div class="ft-color-theme-grid"></div>
      </div>
      <div class="ft-color-other-row">
        <span class="ft-color-other-label">Other...</span>
        <button type="button" class="ft-color-swatch ft-color-other-preview" title="Custom color"></button>
      </div>
      <div class="ft-color-section">
        <div class="ft-color-section-title">Recent Colors</div>
        <div class="ft-color-recent-grid"></div>
      </div>`;
    document.body.appendChild(sharedPopover);

    themeGrid = sharedPopover.querySelector('.ft-color-theme-grid');
    recentGrid = sharedPopover.querySelector('.ft-color-recent-grid');
    otherBtn = sharedPopover.querySelector('.ft-color-other-preview');

    THEME_COLORS.forEach((color) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ft-color-swatch';
      btn.dataset.color = color;
      btn.style.backgroundColor = color;
      btn.title = color;
      themeGrid.appendChild(btn);
    });

    nativeInput = document.createElement('input');
    nativeInput.type = 'color';
    nativeInput.className = 'ft-color-native-input';
    nativeInput.tabIndex = -1;
    sharedPopover.appendChild(nativeInput);

    sharedPopover.addEventListener('click', (e) => {
      const swatch = e.target.closest('.ft-color-swatch');
      if (!swatch || swatch === otherBtn || !activeInput) return;
      e.preventDefault();
      e.stopPropagation();
      setInputColor(activeInput, swatch.dataset.color || swatch.style.backgroundColor);
      closeSharedPopover();
    });

    otherBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!activeInput) return;
      nativeInput.value = getInputColor(activeInput);
      nativeInput.click();
    });

    nativeInput.addEventListener('input', () => {
      if (!activeInput) return;
      setInputColor(activeInput, nativeInput.value);
      closeSharedPopover();
    });
  }

  function renderRecentGrid() {
    if (!recentGrid) return;
    recentGrid.innerHTML = '';
    const recent = loadRecent();
    for (let i = 0; i < MAX_RECENT; i += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ft-color-swatch';
      const color = recent[i];
      if (color) {
        btn.dataset.color = color;
        btn.style.backgroundColor = color;
        btn.title = color;
      } else {
        btn.classList.add('is-empty');
        btn.disabled = true;
      }
      recentGrid.appendChild(btn);
    }
  }

  function highlightSelected(current) {
    if (!sharedPopover) return;
    sharedPopover.querySelectorAll('.ft-color-swatch').forEach((btn) => {
      if (btn.classList.contains('is-empty')) return;
      const match = btn.dataset.color && colorsMatch(btn.dataset.color, current);
      btn.classList.toggle('is-selected', Boolean(match));
      btn.style.borderColor = match ? SELECTED_BORDER : '';
    });
    const inTheme = THEME_COLORS.some((c) => colorsMatch(c, current));
    otherBtn.classList.toggle('is-selected', !inTheme);
    otherBtn.style.borderColor = !inTheme ? SELECTED_BORDER : '';
    otherBtn.style.backgroundColor = current;
  }

  function closeSharedPopover() {
    if (!sharedPopover) return;
    sharedPopover.classList.add('hidden');
    sharedPopover.style.position = '';
    sharedPopover.style.left = '';
    sharedPopover.style.top = '';
    sharedPopover.style.zIndex = '';
    activeInput = null;
    activeTrigger = null;
  }

  function openSharedPopover(input, trigger) {
    ensureSharedPopover();
    activeInput = input;
    activeTrigger = trigger;
    const current = getInputColor(input);
    renderRecentGrid();
    highlightSelected(current);
    otherBtn.style.backgroundColor = current;
    nativeInput.value = current;
    sharedPopover.classList.remove('hidden');

    const rect = trigger.getBoundingClientRect();
    requestAnimationFrame(() => {
      const dropRect = sharedPopover.getBoundingClientRect();
      let left = rect.left;
      let top = rect.bottom + 2;
      if (left + dropRect.width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - dropRect.width - 8);
      }
      if (top + dropRect.height > window.innerHeight - 8) {
        top = Math.max(8, rect.top - dropRect.height - 2);
      }
      sharedPopover.style.position = 'fixed';
      sharedPopover.style.left = `${left}px`;
      sharedPopover.style.top = `${top}px`;
      sharedPopover.style.zIndex = '10000';
    });
  }

  function getInputColor(input) {
    const bound = boundInputs.get(input);
    return bound ? bound.value : normalizeColor(input.getAttribute('value') || input.value || '#000000');
  }

  function setInputColor(input, raw, opts = {}) {
    const { addRecentColor = true, silent = false } = opts;
    const hex = normalizeColor(raw);
    const bound = boundInputs.get(input);
    if (bound) bound.value = hex;
    input.setAttribute('value', hex);
    const preview = input.parentNode?.querySelector?.('.ft-color-trigger-preview');
    if (preview) preview.style.backgroundColor = hex;
    if (addRecentColor) addRecent(hex);
    if (!silent) {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function bindColorInput(input) {
    if (!input || input.dataset.ftColorPicker === '1') return;
    input.dataset.ftColorPicker = '1';
    if (input.type === 'color') {
      input.type = 'hidden';
      input.classList.add('ft-color-input');
    }

    const state = {
      value: normalizeColor(input.value || input.getAttribute('value') || '#000000'),
      disabled: input.disabled || input.hasAttribute('disabled')
    };
    boundInputs.set(input, state);

    const root = document.createElement('span');
    root.className = 'ft-color-picker';
    input.parentNode.insertBefore(root, input);
    root.appendChild(input);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'ft-color-trigger';
    trigger.title = 'Choose color';
    const preview = document.createElement('span');
    preview.className = 'ft-color-trigger-preview';
    preview.style.backgroundColor = state.value;
    trigger.appendChild(preview);
    root.insertBefore(trigger, input);

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (state.disabled) return;
      if (activeInput === input) {
        closeSharedPopover();
      } else {
        openSharedPopover(input, trigger);
      }
    });

    Object.defineProperty(input, 'value', {
      configurable: true,
      enumerable: true,
      get() { return state.value; },
      set(v) { setInputColor(input, v, { addRecentColor: false }); }
    });

    Object.defineProperty(input, 'disabled', {
      configurable: true,
      enumerable: true,
      get() { return state.disabled; },
      set(v) {
        state.disabled = Boolean(v);
        root.classList.toggle('is-disabled', state.disabled);
        trigger.disabled = state.disabled;
        if (state.disabled && activeInput === input) closeSharedPopover();
      }
    });

    input.setAttribute('value', state.value);
    input._ftColorPicker = { root, trigger, state };
  }

  function initAll(root = document) {
    if (!root || !root.querySelectorAll) return;
    const pending = [...root.querySelectorAll('input[type="color"], input.ft-color-input:not([data-ft-color-picker="1"])')];
    if (!pending.length) return;

    let index = 0;
    const batchSize = 8;
    const runBatch = () => {
      const end = Math.min(index + batchSize, pending.length);
      for (; index < end; index += 1) {
        bindColorInput(pending[index]);
      }
      if (index < pending.length) {
        const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 0));
        idle(runBatch);
      }
    };
    runBatch();
  }

  document.addEventListener('click', (e) => {
    if (!activeInput) return;
    if (sharedPopover?.contains(e.target)) return;
    if (activeTrigger?.contains(e.target)) return;
    closeSharedPopover();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSharedPopover();
  });

  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('close', closeSharedPopover);
  });

  window.FtColorPicker = {
    initAll,
    normalizeColor,
    THEME_COLORS,
    closeAll: closeSharedPopover
  };
})();
