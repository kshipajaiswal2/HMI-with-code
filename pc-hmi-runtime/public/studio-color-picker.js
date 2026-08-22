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
  let activeInputOpenColor = null;
  let sharedPopover = null;
  let themeGrid = null;
  let recentGrid = null;
  let otherBtn = null;
  let hexInput = null;
  let nativeInput = null;
  let svPanel = null;
  let svCursor = null;
  let svBg = null;
  let hueTrack = null;
  let hueCursor = null;
  let rgbInputs = { r: null, g: null, b: null };
  let customHue = 0;
  let customSat = 1;
  let customVal = 1;
  let spectrumDragging = null;

  function hexToRgb(hex) {
    const normalized = normalizeColor(hex);
    const match = normalized.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!match) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(match[1], 16),
      g: parseInt(match[2], 16),
      b: parseInt(match[3], 16)
    };
  }

  function rgbToHsv(r, g, b) {
    const rn = Math.min(255, Math.max(0, r)) / 255;
    const gn = Math.min(255, Math.max(0, g)) / 255;
    const bn = Math.min(255, Math.max(0, b)) / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    let h = 0;
    if (delta !== 0) {
      if (max === rn) h = ((gn - bn) / delta) % 6;
      else if (max === gn) h = (bn - rn) / delta + 2;
      else h = (rn - gn) / delta + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : delta / max;
    const v = max;
    return { h, s, v };
  }

  function hsvToRgb(h, s, v) {
    const hue = ((h % 360) + 360) % 360;
    const sat = Math.min(1, Math.max(0, s));
    const val = Math.min(1, Math.max(0, v));
    const c = val * sat;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = val - c;
    let rp = 0; let gp = 0; let bp = 0;
    if (hue < 60) { rp = c; gp = x; }
    else if (hue < 120) { rp = x; gp = c; }
    else if (hue < 180) { gp = c; bp = x; }
    else if (hue < 240) { gp = x; bp = c; }
    else if (hue < 300) { rp = x; bp = c; }
    else { rp = c; bp = x; }
    return {
      r: Math.round((rp + m) * 255),
      g: Math.round((gp + m) * 255),
      b: Math.round((bp + m) * 255)
    };
  }

  function hsvToHex(h, s, v) {
    const { r, g, b } = hsvToRgb(h, s, v);
    return rgbToHex(r, g, b);
  }

  function setCustomHsv(h, s, v) {
    customHue = ((h % 360) + 360) % 360;
    customSat = Math.min(1, Math.max(0, s));
    customVal = Math.min(1, Math.max(0, v));
  }

  function customHsvToHex() {
    return hsvToHex(customHue, customSat, customVal);
  }

  function isAchromatic(sat) {
    return sat < 0.001;
  }

  function updateSpectrumVisuals() {
    if (!svBg || !svCursor || !hueCursor || !svPanel) return;
    const achromatic = isAchromatic(customSat);
    svPanel.classList.toggle('ft-color-sv-achromatic', achromatic);
    svBg.style.backgroundColor = achromatic ? '#ffffff' : `hsl(${customHue}, 100%, 50%)`;
    svCursor.style.left = `${customSat * 100}%`;
    svCursor.style.top = `${(1 - customVal) * 100}%`;
    hueCursor.style.left = `${(customHue / 360) * 100}%`;
  }

  function syncRgbInputsFromColor(color) {
    const { r, g, b } = hexToRgb(color);
    if (rgbInputs.r) rgbInputs.r.value = String(r);
    if (rgbInputs.g) rgbInputs.g.value = String(g);
    if (rgbInputs.b) rgbInputs.b.value = String(b);
  }

  function syncCustomControlsFromColor(color) {
    const hex = normalizeColor(color);
    syncHexInputDisplay(hex);
    syncRgbInputsFromColor(hex);
    const { r, g, b } = hexToRgb(hex);
    const { h, s, v } = rgbToHsv(r, g, b);
    if (isAchromatic(s)) {
      setCustomHsv(customHue, s, v);
    } else {
      setCustomHsv(h, s, v);
    }
    updateSpectrumVisuals();
    if (otherBtn) otherBtn.style.backgroundColor = hex;
    if (nativeInput) nativeInput.value = hex;
  }

  function previewCustomColor(hex, { silent = true } = {}) {
    if (!activeInput || !hex) return;
    const normalized = normalizeColor(hex);
    syncCustomControlsFromColor(normalized);
    setInputColor(activeInput, normalized, { addRecentColor: false, silent });
  }

  function commitCustomColor(closeOnSuccess = false) {
    if (!activeInput) return false;
    const hex = customHsvToHex();
    setInputColor(activeInput, hex);
    syncCustomControlsFromColor(hex);
    if (closeOnSuccess) closeSharedPopover();
    return true;
  }

  function clampChannel(value) {
    const n = Number.parseInt(String(value), 10);
    if (Number.isNaN(n)) return null;
    return Math.min(255, Math.max(0, n));
  }

  function applyRgbInputs() {
    if (!rgbInputs.r || !rgbInputs.g || !rgbInputs.b) return false;
    const r = clampChannel(rgbInputs.r.value);
    const g = clampChannel(rgbInputs.g.value);
    const b = clampChannel(rgbInputs.b.value);
    if (r == null || g == null || b == null) return false;
    const hex = rgbToHex(r, g, b);
    const { h, s, v } = rgbToHsv(r, g, b);
    setCustomHsv(h, s, v);
    previewCustomColor(hex);
    return true;
  }

  function bindSpectrumDrag(panel, mode) {
    panel.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      spectrumDragging = mode;
      if (mode === 'sv') updateSvFromEvent(e);
      else updateHueFromEvent(e);
    });
  }

  function updateSvFromEvent(e) {
    if (!svPanel) return;
    const rect = svPanel.getBoundingClientRect();
    const sat = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const val = Math.min(1, Math.max(0, 1 - ((e.clientY - rect.top) / rect.height)));
    setCustomHsv(customHue, sat, val);
    previewCustomColor(customHsvToHex());
  }

  function updateHueFromEvent(e) {
    if (!hueTrack) return;
    const rect = hueTrack.getBoundingClientRect();
    const hue = Math.min(360, Math.max(0, ((e.clientX - rect.left) / rect.width) * 360));
    let sat = customSat;
    let val = customVal;
    if (isAchromatic(sat)) {
      sat = 1;
      val = Math.max(val, 0.85);
    }
    setCustomHsv(hue, sat, val);
    updateSpectrumVisuals();
    previewCustomColor(customHsvToHex(), { silent: false });
  }

  document.addEventListener('mousemove', (e) => {
    if (!spectrumDragging) return;
    if (spectrumDragging === 'sv') updateSvFromEvent(e);
    else if (spectrumDragging === 'hue') updateHueFromEvent(e);
  });

  document.addEventListener('mouseup', () => {
    if (!spectrumDragging) return;
    spectrumDragging = null;
    commitCustomColor(false);
  });

  function rgbToHex(r, g, b) {
    const hex = (n) => Math.min(255, Math.max(0, Number(n))).toString(16).padStart(2, '0');
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  }

  function parseColor(raw) {
    if (raw == null || raw === '') return null;
    let str = String(raw).trim();
    if (!str) return null;
    const cacheKey = str.toLowerCase();
    if (normalizedColorCache.has(cacheKey)) return normalizedColorCache.get(cacheKey);

    let result = null;
    if (str.startsWith('#')) {
      str = str.toLowerCase();
      if (str.length === 4 && /^#[0-9a-f]{3}$/.test(str)) {
        result = `#${str[1]}${str[1]}${str[2]}${str[2]}${str[3]}${str[3]}`;
      } else if (/^#[0-9a-f]{6}$/.test(str)) {
        result = str;
      }
    } else if (/^[0-9a-f]{6}$/i.test(str)) {
      result = `#${str.toLowerCase()}`;
    } else {
      const rgbMatch = str.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
      if (rgbMatch) {
        result = rgbToHex(rgbMatch[1], rgbMatch[2], rgbMatch[3]);
      } else {
        const named = NAMED_COLORS[cacheKey];
        if (named) {
          result = named;
        } else {
          const probe = document.createElement('div');
          probe.style.color = str;
          document.documentElement.appendChild(probe);
          const computed = getComputedStyle(probe).color;
          probe.remove();
          const match = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
          if (match) result = rgbToHex(match[1], match[2], match[3]);
        }
      }
    }
    if (result) normalizedColorCache.set(cacheKey, result);
    return result;
  }

  function normalizeColor(raw) {
    return parseColor(raw) || '#000000';
  }

  function colorsMatch(a, b) {
    return normalizeColor(a).toLowerCase() === normalizeColor(b).toLowerCase();
  }

  function syncHexInputDisplay(color) {
    if (!hexInput) return;
    hexInput.value = normalizeColor(color);
    hexInput.classList.remove('is-invalid');
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
    sharedPopover.setAttribute('role', 'dialog');
    sharedPopover.setAttribute('aria-label', 'Color picker');
    sharedPopover.innerHTML = `
      <div class="ft-color-section">
        <div class="ft-color-section-title">Theme Colors</div>
        <div class="ft-color-theme-grid"></div>
      </div>
      <div class="ft-color-other-row">
        <span class="ft-color-other-label">Other...</span>
        <div class="ft-color-other-controls">
          <input type="text" class="ft-color-hex-input" spellcheck="false" autocomplete="off" placeholder="#000000" title="Type hex color" />
          <button type="button" class="ft-color-swatch ft-color-other-preview" title="Open system color picker" tabindex="-1"></button>
          <input type="color" class="ft-color-native-input" tabindex="-1" />
        </div>
      </div>
      <div class="ft-color-custom-section">
        <div class="ft-color-section-title">Spectrum</div>
        <p class="ft-color-spectrum-hint">Pick hue on the bar below, then saturation and brightness in the box.</p>
        <div class="ft-color-spectrum-wrap">
          <div class="ft-color-sv-panel" title="Drag to adjust saturation and brightness">
            <div class="ft-color-sv-bg"></div>
            <div class="ft-color-sv-cursor"></div>
          </div>
          <div class="ft-color-hue-track" title="Drag to adjust hue">
            <div class="ft-color-hue-cursor"></div>
          </div>
        </div>
        <div class="ft-color-rgb-row">
          <label class="ft-color-rgb-field"><span>R</span><input type="number" class="ft-color-rgb-input" data-channel="r" min="0" max="255" step="1" /></label>
          <label class="ft-color-rgb-field"><span>G</span><input type="number" class="ft-color-rgb-input" data-channel="g" min="0" max="255" step="1" /></label>
          <label class="ft-color-rgb-field"><span>B</span><input type="number" class="ft-color-rgb-input" data-channel="b" min="0" max="255" step="1" /></label>
        </div>
      </div>
      <div class="ft-color-section">
        <div class="ft-color-section-title">Recent Colors</div>
        <div class="ft-color-recent-grid"></div>
      </div>`;
    document.body.appendChild(sharedPopover);

    themeGrid = sharedPopover.querySelector('.ft-color-theme-grid');
    recentGrid = sharedPopover.querySelector('.ft-color-recent-grid');
    otherBtn = sharedPopover.querySelector('.ft-color-other-preview');
    hexInput = sharedPopover.querySelector('.ft-color-hex-input');
    nativeInput = sharedPopover.querySelector('.ft-color-native-input');
    svPanel = sharedPopover.querySelector('.ft-color-sv-panel');
    svCursor = sharedPopover.querySelector('.ft-color-sv-cursor');
    svBg = sharedPopover.querySelector('.ft-color-sv-bg');
    hueTrack = sharedPopover.querySelector('.ft-color-hue-track');
    hueCursor = sharedPopover.querySelector('.ft-color-hue-cursor');
    rgbInputs.r = sharedPopover.querySelector('.ft-color-rgb-input[data-channel="r"]');
    rgbInputs.g = sharedPopover.querySelector('.ft-color-rgb-input[data-channel="g"]');
    rgbInputs.b = sharedPopover.querySelector('.ft-color-rgb-input[data-channel="b"]');

    THEME_COLORS.forEach((color) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ft-color-swatch';
      btn.dataset.color = color;
      btn.style.backgroundColor = color;
      btn.title = color;
      themeGrid.appendChild(btn);
    });

    function openNativeColorPicker() {
      if (!activeInput || !nativeInput) return;
      nativeInput.value = getInputColor(activeInput);
      if (typeof nativeInput.showPicker === 'function') {
        try {
          nativeInput.showPicker();
          return;
        } catch { /* fall through to click() */ }
      }
      try {
        nativeInput.click();
      } catch { /* ignore */ }
    }

    function previewHexInput(raw) {
      if (!hexInput || !otherBtn) return;
      const parsed = parseColor(raw);
      if (parsed) {
        previewCustomColor(parsed);
        hexInput.classList.remove('is-invalid');
      }
    }

    function applyHexInput(closeOnSuccess = true) {
      if (!activeInput || !hexInput) return false;
      const raw = hexInput.value.trim();
      if (!raw) {
        syncCustomControlsFromColor(getInputColor(activeInput));
        return false;
      }
      const parsed = parseColor(raw);
      if (!parsed) {
        hexInput.classList.add('is-invalid');
        syncCustomControlsFromColor(getInputColor(activeInput));
        return false;
      }
      hexInput.classList.remove('is-invalid');
      setInputColor(activeInput, parsed);
      syncCustomControlsFromColor(parsed);
      if (closeOnSuccess) closeSharedPopover();
      return true;
    }

    function applyNativeColor() {
      if (!activeInput || !nativeInput) return;
      setInputColor(activeInput, nativeInput.value);
      syncCustomControlsFromColor(nativeInput.value);
      closeSharedPopover();
    }

    sharedPopover.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    themeGrid?.addEventListener('pointerdown', handleThemeSwatchActivate);
    recentGrid?.addEventListener('pointerdown', handleThemeSwatchActivate);

    sharedPopover.addEventListener('click', (e) => {
      e.stopPropagation();
      const swatch = e.target.closest('.ft-color-swatch');
      if (!swatch || swatch === otherBtn || swatch.classList.contains('is-empty') || !activeInput) return;
      e.preventDefault();
      pickThemeColor(swatch.dataset.color || swatch.style.backgroundColor);
    });

    otherBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openNativeColorPicker();
    });

    hexInput.addEventListener('mousedown', (e) => e.stopPropagation());
    hexInput.addEventListener('click', (e) => e.stopPropagation());
    hexInput.addEventListener('input', () => previewHexInput(hexInput.value));
    hexInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        applyHexInput(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeSharedPopover();
      }
    });
    hexInput.addEventListener('blur', () => {
      if (!activeInput) return;
      window.setTimeout(() => {
        if (!activeInput || !sharedPopover) return;
        if (sharedPopover.contains(document.activeElement)) return;
        applyHexInput(true);
      }, 0);
    });

    bindSpectrumDrag(svPanel, 'sv');
    bindSpectrumDrag(hueTrack, 'hue');

    Object.values(rgbInputs).forEach((input) => {
      if (!input) return;
      input.addEventListener('mousedown', (e) => e.stopPropagation());
      input.addEventListener('click', (e) => e.stopPropagation());
      input.addEventListener('input', () => {
        const r = clampChannel(rgbInputs.r?.value);
        const g = clampChannel(rgbInputs.g?.value);
        const b = clampChannel(rgbInputs.b?.value);
        if (r == null || g == null || b == null) return;
        previewCustomColor(rgbToHex(r, g, b));
      });
      input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          if (applyRgbInputs()) commitCustomColor(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeSharedPopover();
        }
      });
      input.addEventListener('blur', () => {
        if (!activeInput) return;
        window.setTimeout(() => {
          if (!activeInput || !sharedPopover) return;
          if (sharedPopover.contains(document.activeElement)) return;
          if (applyRgbInputs()) commitCustomColor(true);
        }, 0);
      });
    });

    nativeInput.addEventListener('input', applyNativeColor);
    nativeInput.addEventListener('change', applyNativeColor);
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

  function pickThemeColor(raw) {
    if (!activeInput || raw == null || raw === '') return;
    setInputColor(activeInput, raw);
    closeSharedPopover();
  }

  function handleThemeSwatchActivate(e) {
    e.preventDefault();
    e.stopPropagation();
    const swatch = e.target.closest('.ft-color-swatch');
    if (!swatch || swatch === otherBtn || swatch.classList.contains('is-empty') || !activeInput) return;
    pickThemeColor(swatch.dataset.color || swatch.style.backgroundColor);
  }

  /** Modal dialogs mark the rest of the page inert — mount inside the open dialog so clicks work. */
  function getPopoverHost(trigger) {
    return trigger?.closest?.('dialog[open]')
      || activeInput?.closest?.('dialog[open]')
      || document.querySelector('dialog.dialog[open]')
      || document.body;
  }

  function mountPopoverForTrigger(trigger) {
    if (!sharedPopover) return;
    const host = getPopoverHost(trigger);
    if (sharedPopover.parentNode !== host) {
      host.appendChild(sharedPopover);
    }
  }

  function closeSharedPopover() {
    if (!sharedPopover) return;
    spectrumDragging = null;
    if (activeInput && activeInputOpenColor != null) {
      const current = getInputColor(activeInput);
      if (!colorsMatch(current, activeInputOpenColor)) {
        setInputColor(activeInput, current);
      }
    }
    sharedPopover.classList.add('hidden');
    sharedPopover.style.position = '';
    sharedPopover.style.left = '';
    sharedPopover.style.top = '';
    sharedPopover.style.zIndex = '';
    if (sharedPopover.parentNode !== document.body) {
      document.body.appendChild(sharedPopover);
    }
    activeInput = null;
    activeTrigger = null;
    activeInputOpenColor = null;
  }

  function openSharedPopover(input, trigger) {
    ensureSharedPopover();
    mountPopoverForTrigger(trigger);
    activeInput = input;
    activeTrigger = trigger;
    activeInputOpenColor = getInputColor(input);
    const current = activeInputOpenColor;
    renderRecentGrid();
    highlightSelected(current);
    otherBtn.style.backgroundColor = current;
    nativeInput.value = current;
    syncCustomControlsFromColor(current);
    sharedPopover.classList.remove('hidden');

    const rect = trigger.getBoundingClientRect();
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
    sharedPopover.style.zIndex = '100000';
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
    const preview = input._ftColorPicker?.trigger?.querySelector?.('.ft-color-trigger-preview')
      || input.parentNode?.querySelector?.('.ft-color-trigger-preview');
    if (preview) preview.style.backgroundColor = hex;
    if (addRecentColor) addRecent(hex);
    if (!silent) {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const form = input.closest('form');
      if (form) {
        form.dispatchEvent(new Event('input', { bubbles: true }));
        form.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  function setValueSilent(input, raw) {
    setInputColor(input, raw, { addRecentColor: false, silent: true });
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
      set(v) {
        if (window.state?.propsFormFill) {
          setValueSilent(input, v);
        } else {
          setInputColor(input, v, { addRecentColor: false });
        }
      }
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

  /** Bind every color input under root immediately (for open property dialogs). */
  function initAllSync(root = document) {
    if (!root?.querySelectorAll) return;
    root.querySelectorAll('input[type="color"], input.ft-color-input:not([data-ft-color-picker="1"])').forEach(bindColorInput);
  }

  function refreshInput(input) {
    if (!input) return;
    const bound = boundInputs.get(input);
    const hex = normalizeColor(bound?.value ?? input.getAttribute('value') ?? input.value ?? '#000000');
    if (bound) bound.value = hex;
    input.setAttribute('value', hex);
    const preview = input.parentNode?.querySelector?.('.ft-color-trigger-preview')
      || input._ftColorPicker?.trigger?.querySelector?.('.ft-color-trigger-preview');
    if (preview) preview.style.backgroundColor = hex;
  }

  function refreshAll(root = document) {
    if (!root?.querySelectorAll) return;
    root.querySelectorAll('input.ft-color-input[data-ft-color-picker="1"]').forEach(refreshInput);
  }

  function shouldIgnoreOutsidePopoverEvent(e) {
    const target = e.target;
    if (target?.closest?.('.ft-color-dropdown')) return true;
    if (target?.closest?.('.ft-color-picker')) return true;
    if (target?.closest?.('.ft-color-swatch')) return true;
    if (!activeInput) return true;
    if (sharedPopover?.contains(target)) return true;
    if (activeTrigger?.contains(target)) return true;
    return false;
  }

  document.addEventListener('click', (e) => {
    if (shouldIgnoreOutsidePopoverEvent(e)) return;
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
    initAllSync,
    refreshInput,
    refreshAll,
    getInputColor,
    setValueSilent,
    normalizeColor,
    THEME_COLORS,
    closeAll: closeSharedPopover
  };
})();

