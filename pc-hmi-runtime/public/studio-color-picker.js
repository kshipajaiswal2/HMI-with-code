/**
 * FactoryTalk-style theme color picker for Plant HMI Studio.
 * Upgrades hidden .ft-color-input elements (or legacy input[type=color]).
 */
(function () {
  const RECENT_KEY = 'plantHmiStudio.recentColors';
  const MAX_RECENT = 16;
  const SELECTED_BORDER = '#F99746';

  // Standard Office / FactoryTalk View theme palette (10 columns × 5 rows).
  const THEME_COLORS = [
    '#FFFFFF', '#000000', '#EEECE1', '#1F497D', '#4F81BD', '#C0504D', '#9BBB59', '#8064A2', '#4BACC6', '#F79646',
    '#F2F2F2', '#7F7F7F', '#DDD9C3', '#C6D9F0', '#DCE6F1', '#F2DCDB', '#EBF1DD', '#E5E0EC', '#DBEEF3', '#FDEADA',
    '#D9D9D9', '#595959', '#C4BD97', '#8DB4E2', '#B8CCE4', '#E5B9B7', '#D7E3BC', '#CCC1D9', '#B7DDE8', '#FBD5B5',
    '#BFBFBF', '#3F3F3F', '#938953', '#548DD4', '#95B3D7', '#D99694', '#C3D69B', '#B2A2C7', '#92CDDC', '#FAC08F',
    '#000000', '#000000', '#494429', '#17365D', '#366092', '#953734', '#76923C', '#5F497A', '#31859B', '#E36C09'
  ];

  const NAMED_COLORS = {
    aliceblue: '#f0f8ff', antiquewhite: '#faebd7', aqua: '#00ffff', aquamarine: '#7fffd4', azure: '#f0ffff',
    beige: '#f5f5dc', bisque: '#ffe4c4', black: '#000000', blanchedalmond: '#ffebcd', blue: '#0000ff',
    blueviolet: '#8a2be2', brown: '#a52a2a', burlywood: '#deb887', cadetblue: '#5f9ea0', chartreuse: '#7fff00',
    chocolate: '#d2691e', coral: '#ff7f50', cornflowerblue: '#6495ed', cornsilk: '#fff8dc', crimson: '#dc143c',
    cyan: '#00ffff', darkblue: '#00008b', darkcyan: '#008b8b', darkgoldenrod: '#b8860b', darkgray: '#a9a9a9',
    darkgreen: '#006400', darkgrey: '#a9a9a9', darkkhaki: '#bdb76b', darkmagenta: '#8b008b', darkolivegreen: '#556b2f',
    darkorange: '#ff8c00', darkorchid: '#9932cc', darkred: '#8b0000', darksalmon: '#e9967a', darkseagreen: '#8fbc8f',
    darkslateblue: '#483d8b', darkslategray: '#2f4f4f', darkslategrey: '#2f4f4f', darkturquoise: '#00ced1',
    darkviolet: '#9400d3', deeppink: '#ff1493', deepskyblue: '#00bfff', dimgray: '#696969', dimgrey: '#696969',
    dodgerblue: '#1e90ff', firebrick: '#b22222', floralwhite: '#fffaf0', forestgreen: '#228b22', fuchsia: '#ff00ff',
    gainsboro: '#dcdcdc', ghostwhite: '#f8f8ff', gold: '#ffd700', goldenrod: '#daa520', gray: '#808080', green: '#008000',
    greenyellow: '#adff2f', grey: '#808080', honeydew: '#f0fff0', hotpink: '#ff69b4', indianred: '#cd5c5c',
    indigo: '#4b0082', ivory: '#fffff0', khaki: '#f0e68c', lavender: '#e6e6fa', lavenderblush: '#fff0f5',
    lawngreen: '#7cfc00', lemonchiffon: '#fffacd', lightblue: '#add8e6', lightcoral: '#f08080', lightcyan: '#e0ffff',
    lightgoldenrodyellow: '#fafad2', lightgray: '#d3d3d3', lightgreen: '#90ee90', lightgrey: '#d3d3d3',
    lightpink: '#ffb6c1', lightsalmon: '#ffa07a', lightseagreen: '#20b2aa', lightskyblue: '#87cefa',
    lightslategray: '#778899', lightslategrey: '#778899', lightsteelblue: '#b0c4de', lightyellow: '#ffffe0',
    lime: '#00ff00', limegreen: '#32cd32', linen: '#faf0e6', magenta: '#ff00ff', maroon: '#800000',
    mediumaquamarine: '#66cdaa', mediumblue: '#0000cd', mediumorchid: '#ba55d3', mediumpurple: '#9370db',
    mediumseagreen: '#3cb371', mediumslateblue: '#7b68ee', mediumspringgreen: '#00fa9a', mediumturquoise: '#48d1cc',
    mediumvioletred: '#c71585', midnightblue: '#191970', mintcream: '#f5fffa', mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5', navy: '#000080', oldlace: '#fdf5e6', olive: '#808000', olivedrab: '#6b8e23',
    orange: '#ffa500', orangered: '#ff4500', orchid: '#da70d6', palegoldenrod: '#eee8aa', palegreen: '#98fb98',
    paleturquoise: '#afeeee', palevioletred: '#db7093', papayawhip: '#ffefd5', peachpuff: '#ffdab9', peru: '#cd853f',
    pink: '#ffc0cb', plum: '#dda0dd', powderblue: '#b0e0e6', purple: '#800080', rebeccapurple: '#663399',
    red: '#ff0000', rosybrown: '#bc8f8f', royalblue: '#4169e1', saddlebrown: '#8b4513', salmon: '#fa8072',
    sandybrown: '#f4a460', seagreen: '#2e8b57', seashell: '#fff5ee', sienna: '#a0522d', silver: '#c0c0c0',
    skyblue: '#87ceeb', slateblue: '#6a5acd', slategray: '#708090', slategrey: '#708090', snow: '#fffafa',
    springgreen: '#00ff7f', steelblue: '#4682b4', tan: '#d2b48c', teal: '#008080', thistle: '#d8bfd8',
    tomato: '#ff6347', turquoise: '#40e0d0', violet: '#ee82ee', wheat: '#f5deb3', white: '#ffffff',
    whitesmoke: '#f5f5f5', yellow: '#ffff00', yellowgreen: '#9acd32'
  };

  let openPicker = null;

  function normalizeColor(raw) {
    if (raw == null || raw === '') return '#000000';
    let str = String(raw).trim();
    if (!str) return '#000000';

    if (str.startsWith('#')) {
      str = str.toLowerCase();
      if (str.length === 4) {
        return `#${str[1]}${str[1]}${str[2]}${str[2]}${str[3]}${str[3]}`;
      }
      if (/^#[0-9a-f]{6}$/.test(str)) return str;
      return '#000000';
    }

    const named = NAMED_COLORS[str.toLowerCase()];
    if (named) return named;

    const probe = document.createElement('div');
    probe.style.color = str;
    document.documentElement.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();

    const match = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return '#000000';
    const hex = (n) => Number(n).toString(16).padStart(2, '0');
    return `#${hex(match[1])}${hex(match[2])}${hex(match[3])}`;
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
    } catch { /* ignore quota */ }
  }

  function addRecent(color) {
    const hex = normalizeColor(color);
    const next = [hex, ...loadRecent().filter((c) => !colorsMatch(c, hex))];
    saveRecent(next);
    return next;
  }

  function closeOpenPicker() {
    if (openPicker) {
      openPicker.close();
      openPicker = null;
    }
  }

  class FtColorPicker {
    constructor(input) {
      if (input.dataset.ftColorPicker === '1') return;
      input.dataset.ftColorPicker = '1';

      this.input = input;
      if (input.type === 'color') {
        input.type = 'hidden';
        input.classList.add('ft-color-input');
      }

      this._value = normalizeColor(input.value || input.getAttribute('value') || '#000000');
      this._disabled = input.disabled || input.hasAttribute('disabled');

      this.root = document.createElement('span');
      this.root.className = 'ft-color-picker';
      input.parentNode.insertBefore(this.root, input);
      this.root.appendChild(input);

      this.trigger = document.createElement('button');
      this.trigger.type = 'button';
      this.trigger.className = 'ft-color-trigger';
      this.trigger.title = 'Choose color';
      this.preview = document.createElement('span');
      this.preview.className = 'ft-color-trigger-preview';
      this.trigger.appendChild(this.preview);
      this.root.insertBefore(this.trigger, input);

      this.dropdown = document.createElement('div');
      this.dropdown.className = 'ft-color-dropdown hidden';
      this.dropdown.innerHTML = `
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
      this.root.appendChild(this.dropdown);

      this.themeGrid = this.dropdown.querySelector('.ft-color-theme-grid');
      this.recentGrid = this.dropdown.querySelector('.ft-color-recent-grid');
      this.otherBtn = this.dropdown.querySelector('.ft-color-other-preview');
      this.nativeInput = document.createElement('input');
      this.nativeInput.type = 'color';
      this.nativeInput.className = 'ft-color-native-input';
      this.nativeInput.tabIndex = -1;
      this.root.appendChild(this.nativeInput);

      THEME_COLORS.forEach((color) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ft-color-swatch';
        btn.dataset.color = color;
        btn.style.backgroundColor = color;
        btn.title = color;
        this.themeGrid.appendChild(btn);
      });

      this.bindEvents();
      this.hookInputApi();
      this.setValue(this._value, { addRecent: false, silent: true });
      this.updateDisabled();
      input._ftColorPicker = this;
    }

    hookInputApi() {
      const picker = this;
      const input = this.input;

      Object.defineProperty(input, 'value', {
        configurable: true,
        enumerable: true,
        get() { return picker._value; },
        set(v) { picker.setValue(v, { addRecent: false }); }
      });

      Object.defineProperty(input, 'disabled', {
        configurable: true,
        enumerable: true,
        get() { return picker._disabled; },
        set(v) {
          picker._disabled = Boolean(v);
          picker.updateDisabled();
        }
      });

      input.setAttribute('value', this._value);
    }

    bindEvents() {
      this.trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this._disabled) return;
        if (openPicker === this) {
          this.close();
          openPicker = null;
        } else {
          closeOpenPicker();
          this.open();
          openPicker = this;
        }
      });

      this.dropdown.addEventListener('click', (e) => {
        const swatch = e.target.closest('.ft-color-swatch');
        if (!swatch || swatch === this.otherBtn) return;
        e.preventDefault();
        e.stopPropagation();
        this.setValue(swatch.dataset.color || swatch.style.backgroundColor);
        this.close();
        openPicker = null;
      });

      this.otherBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.nativeInput.value = this._value;
        this.nativeInput.click();
      });

      this.nativeInput.addEventListener('input', () => {
        this.setValue(this.nativeInput.value);
        this.close();
        openPicker = null;
      });

      this.input.addEventListener('change', () => {
        this.setValue(this.input.getAttribute('value') || this._value, { addRecent: false });
      });
    }

    open() {
      this.renderRecent();
      this.highlightSelected();
      this.dropdown.classList.remove('hidden');

      const rect = this.trigger.getBoundingClientRect();
      this.dropdown.style.left = '0';
      this.dropdown.style.top = '100%';

      requestAnimationFrame(() => {
        const dropRect = this.dropdown.getBoundingClientRect();
        let left = rect.left;
        let top = rect.bottom + 2;
        if (left + dropRect.width > window.innerWidth - 8) {
          left = Math.max(8, window.innerWidth - dropRect.width - 8);
        }
        if (top + dropRect.height > window.innerHeight - 8) {
          top = Math.max(8, rect.top - dropRect.height - 2);
        }
        this.dropdown.style.position = 'fixed';
        this.dropdown.style.left = `${left}px`;
        this.dropdown.style.top = `${top}px`;
        this.dropdown.style.zIndex = '10000';
      });
    }

    close() {
      this.dropdown.classList.add('hidden');
      this.dropdown.style.position = '';
      this.dropdown.style.left = '';
      this.dropdown.style.top = '';
      this.dropdown.style.zIndex = '';
    }

    setValue(raw, opts = {}) {
      const { addRecent = true, silent = false } = opts;
      const hex = normalizeColor(raw);
      this._value = hex;
      this.input.setAttribute('value', hex);
      this.preview.style.backgroundColor = hex;
      this.otherBtn.style.backgroundColor = hex;
      this.nativeInput.value = hex;
      this.highlightSelected();

      if (addRecent) addRecent(hex);

      if (!silent) {
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    updateDisabled() {
      this.root.classList.toggle('is-disabled', this._disabled);
      this.trigger.disabled = this._disabled;
      if (this._disabled) {
        this.close();
        if (openPicker === this) openPicker = null;
      }
    }

    renderRecent() {
      this.recentGrid.innerHTML = '';
      const recent = loadRecent();
      const slots = Math.max(MAX_RECENT, recent.length);
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
        this.recentGrid.appendChild(btn);
      }
    }

    highlightSelected() {
      const current = this._value;
      this.dropdown.querySelectorAll('.ft-color-swatch').forEach((btn) => {
        if (btn.classList.contains('is-empty')) return;
        const match = btn.dataset.color && colorsMatch(btn.dataset.color, current);
        btn.classList.toggle('is-selected', Boolean(match));
        btn.style.borderColor = match ? SELECTED_BORDER : '';
      });

      const inTheme = THEME_COLORS.some((c) => colorsMatch(c, current));
      this.otherBtn.classList.toggle('is-selected', !inTheme);
      this.otherBtn.style.borderColor = !inTheme ? SELECTED_BORDER : '';
    }
  }

  function initAll(root = document) {
    root.querySelectorAll('input[type="color"], input.ft-color-input').forEach((el) => {
      if (el.dataset.ftColorPicker !== '1') new FtColorPicker(el);
    });
  }

  document.addEventListener('click', (e) => {
    if (!openPicker) return;
    if (openPicker.root.contains(e.target)) return;
    closeOpenPicker();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOpenPicker();
  });

  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('close', closeOpenPicker);
  });

  window.FtColorPicker = {
    initAll,
    normalizeColor,
    THEME_COLORS,
    closeAll: closeOpenPicker
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll());
  } else {
    initAll();
  }
})();
