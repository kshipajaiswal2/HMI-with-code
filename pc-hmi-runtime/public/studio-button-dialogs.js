/**
 * Property dialogs for the FactoryTalk-style key, trend-pen and user-management buttons.
 *
 * All 20 of these dialogs share one layout, generated here at load time and inserted into
 * studio.html before the `before` element: every element id starts with the button's prefix
 * (e.g. `mvdCaption`), the dialog/form ids come from the component type (`moveDownButtonDialog`,
 * `moveDownButtonForm`, `applyMoveDownButton`, ...), and studio.js calls each one through
 * `window.Studio<Type>` with type-specific method names. This script must load before the other
 * Studio scripts so their load-time DOM queries see the generated dialogs. Optional parts:
 *   autoRepeat  — Auto repeat rate/delay fields (Move/Page buttons)
 *   linkTarget  — "Send press to" + object browser; 'input' lists input objects first,
 *                 'trend' lists Trend objects first (pen buttons)
 *   eSignature  — Electronic signature / domain fields (user-management buttons)
 */
(function () {
  const KEY_BUTTON_TYPES = new Set([
    'BackspaceButton', 'EndButton', 'EnterButton', 'HomeButton',
    'MoveLeftButton', 'MoveRightButton', 'MoveDownButton', 'MoveUpButton',
    'PageDownButton', 'PageUpButton'
  ]);
  const PEN_BUTTON_TYPES = new Set(['NextPenButton', 'PausePenButton']);
  const INPUT_TYPES = new Set([
    'StringInputEnable', 'NumericInputEnable', 'NumericInputCursorPoint'
  ]);

  function isTrendType(type) {
    const t = String(type || '').toLowerCase();
    return t.includes('trend') || t === 'xyplot' || t === 'histogram';
  }

  function setColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  const ALIGNMENTS = [
    'topLeft', 'topCenter', 'topRight', 'middleLeft', 'middleCenter', 'middleRight',
    'bottomLeft', 'bottomCenter', 'bottomRight'
  ];
  const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
  const REPEAT_DELAYS = [
    [200, '200 msec'], [400, '400 msec'], [600, '600 msec'], [800, '800 msec'],
    [1000, '1.0 second'], [1500, '1.5 seconds'], [2000, '2.0 seconds'], [2500, '2.5 seconds']
  ];

  const lines = (items, fn) => items.map((item) => `${fn(item)}\n`).join('');
  const attr = (on, name) => (on ? ` ${name}` : '');

  function alignRadios(name) {
    return lines(ALIGNMENTS, (v) => `                    <label><input type="radio" name="${name}" value="${v}"${attr(v === 'middleCenter', 'checked')} /><span></span></label>`);
  }

  // Markup for one Properties dialog, plus the object browser of buttons that can send their
  // press to a linked object. Key buttons share the Pause Pen dialog's `ppb-*` layout classes.
  function dialogMarkup(cfg) {
    const { type: T, prefix: p, label } = cfg;
    const lc = `${T[0].toLowerCase()}${T.slice(1)}`;
    const linked = Boolean(cfg.linkTarget);
    const esig = Boolean(cfg.eSignature);
    const grid = cfg.linkTarget === 'input' ? 'ppb' : p;
    const tab = (id, text) => `          <button type="button" class="dialog-tab" data-${p}-tab="${id}">${text}</button>\n`;
    let html = `<dialog id="${lc}Dialog" class="dialog dialog-ft dialog-maintained-props ${cfg.dialogClass}">
      <form id="${lc}Form">
        <h3>${label} Button Properties</h3>
        <div class="dialog-tabs" role="tablist">
          <button type="button" class="dialog-tab active" data-${p}-tab="general">General</button>
${tab('label', 'Label')}${cfg.autoRepeat ? tab('timing', 'Timing') : ''}${esig ? tab('esignature', 'E-Signature') : ''}${tab('common', 'Common')}        </div>
        <div class="dialog-tab-panel active" data-${p}-tab-panel="general">
          <fieldset class="ft-fieldset">
            <legend>Appearance</legend>
            <div class="mtn-appearance-row">
              <div class="goto-props-grid">
                <label>Border style:
                  <select id="${p}BorderStyle">
                    <option value="none">None</option>
                    <option value="raised">Raised</option>
                    <option value="inset">Inset</option>
                    <option value="raisedInset">RaisedInset</option>
                    <option value="line" selected>Line</option>
                  </select>
                </label>
                <label>Border width:<input type="number" id="${p}BorderWidth" min="0" max="20" value="1" /></label>
                <label>Back style:
                  <select id="${p}BackStyle">
                    <option value="solid" selected>Solid</option>
                    <option value="transparent">Transparent</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </label>
                <label>Pattern style:<select id="${p}PatternStyle"></select></label>
                <label>Shape:
                  <select id="${p}Shape">
                    <option value="rectangle" selected>Rectangle</option>
                    <option value="circle">Circle</option>
                    <option value="ellipse">Ellipse</option>
                  </select>
                </label>
              </div>
              <div class="goto-props-colors">
                <label class="color-check-row"><input type="checkbox" id="${p}BorderUsesBackColor"${attr(cfg.linkTarget !== 'input', 'checked')} /> Border uses back color</label>
                <div class="color-check-row"><span>Back color</span><input type="hidden" class="ft-color-input" id="${p}BackColor" value="#001C38" /></div>
                <div class="color-check-row"><span>Border color</span><input type="hidden" class="ft-color-input" id="${p}BorderColor" value="#001C38" /></div>
                <div class="color-check-row"><span>Pattern color</span><input type="hidden" class="ft-color-input" id="${p}PatternColor" value="#ffffff" /></div>
                <div class="color-check-row"><span>Highlight color</span><input type="hidden" class="ft-color-input" id="${p}HighlightColor" value="#0066cc" /></div>
                <label class="radio-row"><input type="checkbox" id="${p}Blink" /> Blink</label>
              </div>
            </div>
          </fieldset>
          <fieldset class="ft-fieldset">
            <legend>Touch margins</legend>
            <div class="ps-size-row">
              <label>Horizontal margin:<input type="number" id="${p}HorizontalMargin" min="0" max="100" value="0" /></label>
              <label>Vertical margin:<input type="number" id="${p}VerticalMargin" min="0" max="100" value="0" /></label>
            </div>
          </fieldset>
          <fieldset class="ft-fieldset">
            <legend>Other</legend>
${linked ? `            <div class="${grid}-other-row">
              <label class="radio-row"><input type="checkbox" id="${p}Audio" checked /> Audio</label>
              <label>Send press to:
                <select id="${p}SendPressTo">
                  <option value="objectWithFocus" selected>Object With Focus</option>
                  <option value="linkedObject">Linked Object</option>
                </select>
              </label>
              <label class="browse-row">Linked object:<input type="text" id="${p}LinkedObject" disabled /><button type="button" class="ft-mini-btn" id="${p}BrowseLinkedObject" disabled>...</button></label>
            </div>
` : `            <label class="radio-row"><input type="checkbox" id="${p}Audio" checked /> Audio</label>
`}          </fieldset>
        </div>
        <div class="dialog-tab-panel" data-${p}-tab-panel="label">
          <fieldset class="ft-fieldset">
            <legend>Caption</legend>
            <textarea id="${p}Caption" rows="3" class="text-props-caption"></textarea>
            <div class="ft-insert-var-wrap">
              <button type="button" class="dialog-btn ft-insert-var-btn" id="${p}InsertVariable">Insert Variable...</button>
              <div id="${p}InsertVariableMenu" class="ft-insert-var-menu hidden" role="menu">
                <button type="button" role="menuitem" data-${p}-var="numeric">Numeric...</button>
                <button type="button" role="menuitem" data-${p}-var="string">String...</button>
                <button type="button" role="menuitem" data-${p}-var="timedate">Time/Date...</button>
              </div>
            </div>
            <div class="text-props-font-row">
              <label>Font:
                <select id="${p}Font">
                  <option selected>Arial Unicode MS</option>
                  <option>Arial</option>
                  <option>Bahnschrift</option>
                  <option>Calibri</option>
                  <option>Segoe UI</option>
                  <option>Tahoma</option>
                  <option>Times New Roman</option>
                  <option>Verdana</option>
                </select>
              </label>
              <label>Size:
                <select id="${p}FontSize">
${lines(FONT_SIZES, (n) => `                  <option value="${n}"${attr(n === 10, 'selected')}>${n}</option>`)}                </select>
              </label>
              <div class="text-style-btns">
                <button type="button" class="text-style-btn" id="${p}Bold" title="Bold">B</button>
                <button type="button" class="text-style-btn" id="${p}Italic" title="Italic"><em>I</em></button>
                <button type="button" class="text-style-btn" id="${p}Underline" title="Underline"><u>U</u></button>
              </div>
            </div>
            <div class="text-props-options">
              <div class="text-props-left">
                <label class="color-check-row"><input type="checkbox" id="${p}UseCaptionColor" /> Caption color<input type="hidden" class="ft-color-input" id="${p}CaptionColor" value="#ffffff" /></label>
                <label class="color-check-row"><input type="checkbox" id="${p}UseCaptionBackColor"${attr(esig, 'checked')} /> Caption back color<input type="hidden" class="ft-color-input" id="${p}CaptionBackColor" value="#001C38" /></label>
                <label class="radio-row"><input type="checkbox" id="${p}CaptionBlink" /> Caption blink</label>
                <label class="radio-row"><input type="checkbox" id="${p}WordWrap" checked /> Word wrap</label>
              </div>
              <div class="text-props-right">
                <fieldset class="ft-fieldset text-align-fieldset">
                  <legend>Alignment</legend>
                  <div class="text-align-grid${esig ? '' : ` ${grid}-align-grid`}">
${alignRadios(`${p}Align`)}                  </div>
                </fieldset>
                <label>Caption back style:
                  <select id="${p}CaptionBackStyle">
                    <option value="solid">Solid</option>
                    <option value="transparent" selected>Transparent</option>
                  </select>
                </label>
              </div>
            </div>
          </fieldset>
          <fieldset class="ft-fieldset">
            <legend>Image settings</legend>
            <div class="text-props-options">
              <div class="text-props-left">
                <label class="browse-row">Image:<input type="text" id="${p}Image"${cfg.image ? ` value="${cfg.image}"` : ''} /><button type="button" class="ft-mini-btn" id="${p}BrowseImage">...</button></label>
                <label class="color-check-row"><input type="checkbox" id="${p}UseImageColor" /> Image color<input type="hidden" class="ft-color-input" id="${p}ImageColor" value="#ffffff" /></label>
                <label class="color-check-row"><input type="checkbox" id="${p}UseImageBackColor"${attr(esig, 'checked')} /> Image back color<input type="hidden" class="ft-color-input" id="${p}ImageBackColor" value="#001C38" /></label>
                <label class="radio-row"><input type="checkbox" id="${p}ImageBlink" /> Image blink</label>
                <label class="radio-row"><input type="checkbox" id="${p}ImageScaled" /> Image scaled</label>
              </div>
              <div class="text-props-right">
                <label>Image back style:
                  <select id="${p}ImageBackStyle">
                    <option value="solid">Solid</option>
                    <option value="transparent" selected>Transparent</option>
                  </select>
                </label>
                <fieldset class="ft-fieldset text-align-fieldset">
                  <legend>Alignment</legend>
                  <div class="text-align-grid ${grid}-image-align-grid">
${alignRadios(`${p}ImageAlign`)}                  </div>
                </fieldset>
              </div>
            </div>
          </fieldset>
        </div>
${cfg.autoRepeat ? `        <div class="dialog-tab-panel" data-${p}-tab-panel="timing">
          <fieldset class="ft-fieldset">
            <legend>Auto repeat settings</legend>
            <div class="ps-size-row">
              <label>Auto repeat rate:<select id="${p}AutoRepeatRate"></select></label>
              <label>Auto repeat delay:
                <select id="${p}AutoRepeatDelay">
${lines(REPEAT_DELAYS, ([ms, text]) => `                  <option value="${ms}"${attr(ms === 400, 'selected')}>${text}</option>`)}                </select>
              </label>
            </div>
          </fieldset>
        </div>
` : ''}${esig ? `        <div class="dialog-tab-panel" data-${p}-tab-panel="esignature">
          <label class="radio-row"><input type="checkbox" id="${p}RequireESignature" /> Require Electronic Signature</label>
          <label class="radio-row"><input type="checkbox" id="${p}AllowBlankComment" disabled /> Allow blank comment</label>
          <fieldset class="ft-fieldset">
            <legend>Single Signatory</legend>
            <label class="radio-row"><input type="checkbox" id="${p}RequireReauth" disabled /> Require re-authentication</label>
          </fieldset>
          <fieldset class="ft-fieldset">
            <legend>Counter Signatory</legend>
            <label class="radio-row"><input type="checkbox" id="${p}RequireCounterSig" disabled /> Require counter signature</label>
            <label>Authorized Group
              <select id="${p}AuthorizedGroup" disabled>
                <option>Administrators</option>
                <option>Operators</option>
                <option>Supervisors</option>
              </select>
            </label>
            <fieldset class="ft-fieldset">
              <legend>Domain Name</legend>
              <label class="radio-row"><input type="checkbox" id="${p}DomainVisible" disabled /> Visible</label>
              <label class="radio-row"><input type="radio" name="${p}DomainMode" id="${p}DomainNameMode" value="name" checked disabled /> Domain Name<input type="text" id="${p}DomainName" disabled /></label>
              <label class="radio-row"><input type="radio" name="${p}DomainMode" id="${p}DomainVariableMode" value="variable" disabled /> Variable Domain Name<input type="text" id="${p}DomainVariable" disabled /><button type="button" class="ft-mini-btn" id="${p}DomainBrowse" disabled>...</button></label>
              <label class="radio-row"><input type="checkbox" id="${p}DomainDisable" disabled /> Disable</label>
            </fieldset>
          </fieldset>
        </div>
` : ''}        <div class="dialog-tab-panel" data-${p}-tab-panel="common">
          <fieldset class="ft-fieldset">
            <legend>Size</legend>
            <div class="ps-size-row">
              <label>Height:<input type="number" id="${p}Height" min="1" max="4096" value="80" /></label>
              <label>Width:<input type="number" id="${p}Width" min="1" max="4096" value="80" /></label>
            </div>
          </fieldset>
          <fieldset class="ft-fieldset">
            <legend>Position</legend>
            <div class="ps-size-row">
              <label>Top:<input type="number" id="${p}Top" min="0" max="4096" value="16" /></label>
              <label>Left:<input type="number" id="${p}Left" min="0" max="4096" value="16" /></label>
            </div>
          </fieldset>
          <fieldset class="ft-fieldset">
            <legend>Other</legend>
            <label>Name:<input type="text" id="${p}Name" maxlength="40" value="${T}1" /></label>
            <label class="radio-row"><input type="checkbox" id="${p}Visible" checked /> Visible</label>
          </fieldset>
        </div>
        <div class="dialog-actions">
          <button type="submit" class="dialog-btn primary">OK</button>
          <button type="button" class="dialog-btn" id="cancel${T}">Cancel</button>
          <button type="button" class="dialog-btn" id="apply${T}" disabled>Apply</button>
          <button type="button" class="dialog-btn" id="help${T}">Help</button>
        </div>
      </form>
    </dialog>

    `;
    if (linked) {
      html += `<dialog id="${p}ObjectBrowserDialog" class="dialog dialog-ft dialog-object-browser">
      <h3>Object Browser</h3>
      <div class="ob-body">
        <select id="${p}ObjectBrowserList" class="ob-list" size="12"></select>
        <div class="ob-side-actions">
          <button type="button" class="dialog-btn primary" id="${p}ObjectBrowserOk">OK</button>
          <button type="button" class="dialog-btn" id="${p}ObjectBrowserCancel">Cancel</button>
          <button type="button" class="dialog-btn" id="${p}ObjectBrowserHelp">Help</button>
        </div>
      </div>
    </dialog>

    `;
    }
    return html;
  }

  function createButtonDialog(cfg) {
    const { type: T, prefix: p, label, propsKey } = cfg;
    const dialogId = `${T[0].toLowerCase()}${T.slice(1)}Dialog`;
    const formId = `${T[0].toLowerCase()}${T.slice(1)}Form`;
    const applyId = `apply${T}`;
    const linked = Boolean(cfg.linkTarget);
    // Key buttons default these colors off; pen and user-management buttons default them on.
    const onByDefault = cfg.linkTarget !== 'input';
    const userColorDefaults = Boolean(cfg.eSignature);
    const $ = (suffix) => document.getElementById(`${p}${suffix}`);

    let previewTimer = null;
    let dialogCommitted = false;

    function switchTab(tabId) {
      document.querySelectorAll(`#${dialogId} .dialog-tab`).forEach((el) => {
        el.classList.toggle('active', el.dataset[`${p}Tab`] === tabId);
      });
      document.querySelectorAll(`#${dialogId} .dialog-tab-panel`).forEach((el) => {
        el.classList.toggle('active', el.dataset[`${p}TabPanel`] === tabId);
      });
    }

    // User-management dialogs fall back to the field's own default color; the others to navy.
    function getColor(suffix, fallback) {
      const id = `${p}${suffix}`;
      return window.StudioPropsShared?.getColorFieldValue?.(id)
        || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
        || document.getElementById(id)?.value
        || (userColorDefaults ? fallback : null)
        || '#001C38';
    }

    function fillAutoRepeatRateSelect() {
      const el = $('AutoRepeatRate');
      if (!el || el.dataset[`${p}RateFilled`] === '1') return;
      el.dataset[`${p}RateFilled`] = '1';
      const opts = [];
      for (let n = 0; n <= 20; n++) {
        opts.push(`<option value="${n}"${n === 0 ? ' selected' : ''}>${n}</option>`);
      }
      el.innerHTML = opts.join('');
    }

    function nextName(components) {
      const n = (components || []).filter((c) => c.type === T).length + 1;
      return `${T}${n}`;
    }

    function defaultComponent(overrides = {}) {
      return {
        type: T,
        name: `${T}1`,
        caption: '',
        label: '',
        left: 16,
        top: 16,
        width: 80,
        height: 80,
        visible: true,
        borderStyle: 'line',
        borderWidth: 1,
        borderUsesBackColor: onByDefault,
        backStyle: 'solid',
        patternStyle: 'none',
        shape: 'rectangle',
        useBackColor: true,
        backColor: '#001C38',
        useBorderColor: true,
        borderColor: '#001C38',
        usePatternColor: true,
        patternColor: '#ffffff',
        useHighlightColor: true,
        highlightColor: '#0066cc',
        blink: false,
        horizontalMargin: 0,
        verticalMargin: 0,
        audio: true,
        ...(linked ? { sendPressTo: 'objectWithFocus', linkedObject: '' } : {}),
        fontFamily: 'Arial Unicode MS',
        fontSize: 10,
        bold: false,
        italic: false,
        underline: false,
        alignment: 'middleCenter',
        wordWrap: true,
        useCaptionColor: false,
        captionColor: '#ffffff',
        foreColor: '#ffffff',
        useForeColor: false,
        captionBackStyle: 'transparent',
        useCaptionBackColor: userColorDefaults,
        captionBackColor: '#001C38',
        captionBlink: false,
        image: cfg.image || '',
        ...(cfg.autoRepeat ? { autoRepeatRate: 0, autoRepeatDelay: 400 } : {}),
        imageBackStyle: 'transparent',
        imageAlignment: 'middleCenter',
        useImageColor: false,
        imageColor: '#ffffff',
        useImageBackColor: userColorDefaults,
        imageBackColor: '#001C38',
        imageBlink: false,
        imageScaled: false,
        ...(cfg.eSignature ? {
          requireESignature: false,
          allowBlankComment: false,
          requireReauth: false,
          requireCounterSig: false,
          authorizedGroup: 'Administrators',
          domainVisible: false,
          domainMode: 'name',
          domainName: '',
          domainVariable: '',
          domainDisable: false
        } : {}),
        ...overrides
      };
    }

    function schedulePreview() {
      if (window.state?.propsFormFill) return;
      if (previewTimer) clearTimeout(previewTimer);
      previewTimer = setTimeout(() => {
        previewTimer = null;
        if (!document.getElementById(dialogId)?.open) return;
        const comp = readForm();
        if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
        else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
        window.updatePropsApplyButton?.(readForm, applyId);
      }, 80);
    }

    function syncESignatureFields() {
      const on = Boolean($('RequireESignature')?.checked);
      for (const s of ['AllowBlankComment', 'RequireReauth', 'RequireCounterSig']) {
        const el = $(s);
        if (el) el.disabled = !on;
      }
      const counter = on && Boolean($('RequireCounterSig')?.checked);
      for (const s of [
        'AuthorizedGroup', 'DomainVisible', 'DomainNameMode', 'DomainVariableMode',
        'DomainName', 'DomainVariable', 'DomainBrowse', 'DomainDisable'
      ]) {
        const el = $(s);
        if (el) el.disabled = !counter;
      }
    }

    function syncFields() {
      // Key and pen buttons also grey out the back colors unless their back style is solid.
      const solidOnly = linked;
      const capColor = $('CaptionColor');
      if (capColor) capColor.disabled = !$('UseCaptionColor')?.checked;
      const capBack = $('CaptionBackColor');
      if (capBack) capBack.disabled = !$('UseCaptionBackColor')?.checked
        || (solidOnly && $('CaptionBackStyle')?.value !== 'solid');
      const imgColor = $('ImageColor');
      if (imgColor) imgColor.disabled = !$('UseImageColor')?.checked;
      const imgBack = $('ImageBackColor');
      if (imgBack) imgBack.disabled = !$('UseImageBackColor')?.checked
        || (solidOnly && $('ImageBackStyle')?.value !== 'solid');
      if (linked) {
        const toLinked = $('SendPressTo')?.value === 'linkedObject';
        const linkedInput = $('LinkedObject');
        const browse = $('BrowseLinkedObject');
        if (linkedInput) linkedInput.disabled = !toLinked;
        if (browse) browse.disabled = !toLinked;
      }
      if (cfg.eSignature) syncESignatureFields();
    }

    function wireTools() {
      if (cfg.autoRepeat) fillAutoRepeatRateSelect();
      const dlg = document.getElementById(dialogId);
      if (window.FtColorPicker && dlg) {
        if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
        else window.FtColorPicker.initAll(dlg);
        window.FtColorPicker.refreshAll?.(dlg);
      }
      window.StudioPropsShared?.fillPatternSelect(`${p}PatternStyle`, `${p}Filled`);
      if (cfg.eSignature && window.StudioTagTools) window.StudioTagTools.wirePickButtons();
      document.querySelectorAll(`#${formId} .ft-color-input`).forEach((input) => {
        if (input.dataset[`${p}PreviewWired`] === '1') return;
        input.dataset[`${p}PreviewWired`] = '1';
        input.addEventListener('input', schedulePreview);
        input.addEventListener('change', schedulePreview);
      });
      syncFields();
    }

    function presentDialog() {
      const dialog = document.getElementById(dialogId);
      if (!dialog) {
        window.setStatus(`${label} Button Properties dialog is missing from Studio`);
        return;
      }
      if (dialog.open) return;
      dialogCommitted = false;
      dialog.classList.add('is-positioned');
      dialog.style.position = 'fixed';
      dialog.style.margin = '0';
      dialog.style.left = '24px';
      dialog.style.top = '36px';
      dialog.style.right = 'auto';
      dialog.style.bottom = 'auto';
      dialog.style.transform = 'none';
      dialog.style.zIndex = '30000';
      dialog.style.maxHeight = 'calc(100vh - 48px)';
      dialog.style.overflow = 'auto';
      try {
        dialog.showModal();
      } catch (err) {
        document.querySelectorAll('dialog[open]').forEach((other) => {
          if (other !== dialog) {
            try { other.close(); } catch (_) { /* ignore */ }
          }
        });
        try {
          dialog.showModal();
        } catch (err2) {
          dialog.setAttribute('open', '');
          dialog.style.display = 'block';
          window.setStatus(`Opened ${label} Button properties without modal: ${err2.message}`);
        }
      }
    }

    function fillForm(comp) {
      if (window.state) window.state.propsFormFill = true;
      try {
        if (cfg.autoRepeat) fillAutoRepeatRateSelect();
        window.StudioPropsShared?.fillPatternSelect(`${p}PatternStyle`, `${p}Filled`);
        $('BorderStyle').value = comp.borderStyle || 'line';
        $('BorderWidth').value = comp.borderWidth ?? 1;
        $('BackStyle').value = comp.backStyle || 'solid';
        const pat = $('PatternStyle');
        if (pat) pat.value = comp.patternStyle || 'none';
        const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
        const shapeEl = $('Shape');
        if (shapeEl) shapeEl.value = shape;
        $('BorderUsesBackColor').checked = onByDefault
          ? comp.borderUsesBackColor !== false
          : Boolean(comp.borderUsesBackColor);
        setColor(`${p}BackColor`, comp.backColor || '#001C38');
        setColor(`${p}BorderColor`, comp.borderColor || '#001C38');
        setColor(`${p}PatternColor`, comp.patternColor || '#ffffff');
        setColor(`${p}HighlightColor`, comp.highlightColor || '#0066cc');
        $('Blink').checked = Boolean(comp.blink);
        $('HorizontalMargin').value = comp.horizontalMargin ?? 0;
        $('VerticalMargin').value = comp.verticalMargin ?? 0;
        $('Audio').checked = comp.audio !== false;
        if (linked) {
          $('SendPressTo').value = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
          $('LinkedObject').value = comp.linkedObject || '';
        }
        $('Caption').value = comp.caption ?? comp.label ?? '';
        $('Font').value = comp.fontFamily || 'Arial Unicode MS';
        $('FontSize').value = String(comp.fontSize ?? 10);
        $('Bold').classList.toggle('active', Boolean(comp.bold));
        $('Italic').classList.toggle('active', Boolean(comp.italic));
        $('Underline').classList.toggle('active', Boolean(comp.underline));
        $('UseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
        setColor(`${p}CaptionColor`, comp.captionColor || comp.foreColor || '#ffffff');
        $('UseCaptionBackColor').checked = comp.useCaptionBackColor !== undefined
          ? Boolean(comp.useCaptionBackColor)
          : userColorDefaults;
        setColor(`${p}CaptionBackColor`, comp.captionBackColor || '#001C38');
        $('CaptionBlink').checked = Boolean(comp.captionBlink);
        $('WordWrap').checked = comp.wordWrap !== false;
        $('CaptionBackStyle').value = comp.captionBackStyle || 'transparent';
        document.querySelectorAll(`#${formId} input[name="${p}Align"]`).forEach((el) => {
          el.checked = el.value === (comp.alignment || 'middleCenter');
        });
        $('Image').value = comp.image || cfg.image || '';
        if (cfg.autoRepeat) {
          $('AutoRepeatRate').value = String(Math.min(20, Math.max(0, Number(comp.autoRepeatRate) || 0)));
          $('AutoRepeatDelay').value = String(comp.autoRepeatDelay ?? 400);
        }
        $('ImageBackStyle').value = comp.imageBackStyle || 'transparent';
        $('UseImageColor').checked = Boolean(comp.useImageColor);
        setColor(`${p}ImageColor`, comp.imageColor || '#ffffff');
        $('UseImageBackColor').checked = comp.useImageBackColor !== undefined
          ? Boolean(comp.useImageBackColor)
          : userColorDefaults;
        setColor(`${p}ImageBackColor`, comp.imageBackColor || '#001C38');
        $('ImageBlink').checked = Boolean(comp.imageBlink);
        $('ImageScaled').checked = Boolean(comp.imageScaled);
        document.querySelectorAll(`#${formId} input[name="${p}ImageAlign"]`).forEach((el) => {
          el.checked = el.value === (comp.imageAlignment || 'middleCenter');
        });
        if (cfg.eSignature) {
          $('RequireESignature').checked = Boolean(comp.requireESignature);
          $('AllowBlankComment').checked = Boolean(comp.allowBlankComment);
          $('RequireReauth').checked = Boolean(comp.requireReauth);
          $('RequireCounterSig').checked = Boolean(comp.requireCounterSig);
          $('AuthorizedGroup').value = comp.authorizedGroup || 'Administrators';
          $('DomainVisible').checked = Boolean(comp.domainVisible);
          const domainMode = comp.domainMode === 'variable' ? 'variable' : 'name';
          document.querySelectorAll(`#${formId} input[name="${p}DomainMode"]`).forEach((el) => {
            el.checked = el.value === domainMode;
          });
          $('DomainName').value = comp.domainName || '';
          $('DomainVariable').value = comp.domainVariable || '';
          $('DomainDisable').checked = Boolean(comp.domainDisable);
        }
        $('Height').value = comp.height ?? 80;
        $('Width').value = comp.width ?? 80;
        $('Top').value = comp.top ?? 16;
        $('Left').value = comp.left ?? 16;
        $('Name').value = comp.name || `${T}1`;
        $('Visible').checked = comp.visible !== false;
        syncFields();
      } finally {
        if (window.state) window.state.propsFormFill = false;
      }
    }

    function readForm() {
      const caption = $('Caption')?.value || '';
      const captionColor = getColor('CaptionColor', '#ffffff');
      return {
        type: T,
        name: $('Name')?.value.trim() || `${T}1`,
        caption,
        label: caption,
        left: Number($('Left')?.value) || 0,
        top: Number($('Top')?.value) || 0,
        width: Number($('Width')?.value) || 80,
        height: Number($('Height')?.value) || 80,
        visible: $('Visible')?.checked !== false,
        borderStyle: $('BorderStyle')?.value || 'line',
        borderWidth: Number($('BorderWidth')?.value) || 1,
        borderUsesBackColor: onByDefault
          ? $('BorderUsesBackColor')?.checked !== false
          : Boolean($('BorderUsesBackColor')?.checked),
        backStyle: $('BackStyle')?.value || 'solid',
        patternStyle: $('PatternStyle')?.value || 'none',
        shape: $('Shape')?.value || 'rectangle',
        useBackColor: true,
        backColor: getColor('BackColor', '#001C38'),
        useBorderColor: true,
        borderColor: getColor('BorderColor', '#001C38'),
        usePatternColor: true,
        patternColor: getColor('PatternColor', '#ffffff'),
        useHighlightColor: true,
        highlightColor: getColor('HighlightColor', '#0066cc'),
        blink: Boolean($('Blink')?.checked),
        horizontalMargin: Number($('HorizontalMargin')?.value) || 0,
        verticalMargin: Number($('VerticalMargin')?.value) || 0,
        audio: $('Audio')?.checked !== false,
        ...(linked ? {
          sendPressTo: $('SendPressTo')?.value || 'objectWithFocus',
          linkedObject: $('LinkedObject')?.value.trim() || ''
        } : {}),
        fontFamily: $('Font')?.value || 'Arial Unicode MS',
        fontSize: Number($('FontSize')?.value) || 10,
        bold: $('Bold')?.classList.contains('active'),
        italic: $('Italic')?.classList.contains('active'),
        underline: $('Underline')?.classList.contains('active'),
        useCaptionColor: Boolean($('UseCaptionColor')?.checked),
        captionColor,
        foreColor: captionColor,
        useForeColor: Boolean($('UseCaptionColor')?.checked),
        useCaptionBackColor: Boolean($('UseCaptionBackColor')?.checked),
        captionBackColor: getColor('CaptionBackColor', '#001C38'),
        captionBlink: Boolean($('CaptionBlink')?.checked),
        captionBackStyle: $('CaptionBackStyle')?.value || 'transparent',
        wordWrap: $('WordWrap')?.checked !== false,
        alignment: document.querySelector(`#${formId} input[name="${p}Align"]:checked`)?.value || 'middleCenter',
        image: $('Image')?.value.trim() || '',
        imageBackStyle: $('ImageBackStyle')?.value || 'transparent',
        imageAlignment: document.querySelector(`#${formId} input[name="${p}ImageAlign"]:checked`)?.value || 'middleCenter',
        useImageColor: Boolean($('UseImageColor')?.checked),
        imageColor: getColor('ImageColor', '#ffffff'),
        useImageBackColor: Boolean($('UseImageBackColor')?.checked),
        imageBackColor: getColor('ImageBackColor', '#001C38'),
        imageBlink: Boolean($('ImageBlink')?.checked),
        imageScaled: Boolean($('ImageScaled')?.checked),
        ...(cfg.autoRepeat ? {
          autoRepeatRate: Number($('AutoRepeatRate')?.value) || 0,
          autoRepeatDelay: Number($('AutoRepeatDelay')?.value) || 400
        } : {}),
        ...(cfg.eSignature ? {
          requireESignature: Boolean($('RequireESignature')?.checked),
          allowBlankComment: Boolean($('AllowBlankComment')?.checked),
          requireReauth: Boolean($('RequireReauth')?.checked),
          requireCounterSig: Boolean($('RequireCounterSig')?.checked),
          authorizedGroup: $('AuthorizedGroup')?.value || 'Administrators',
          domainVisible: Boolean($('DomainVisible')?.checked),
          domainMode: document.querySelector(`#${formId} input[name="${p}DomainMode"]:checked`)?.value || 'name',
          domainName: $('DomainName')?.value.trim() || '',
          domainVariable: $('DomainVariable')?.value.trim() || '',
          domainDisable: Boolean($('DomainDisable')?.checked)
        } : {})
      };
    }

    async function showDialog(overrides = {}) {
      if (!window.displayIsOpen?.()) {
        window.setStatus(`Open a display first, then drag on the canvas to place the ${label} Button`);
        return;
      }
      try {
        window.flushDeferredDialogInits?.();
        initDialog();
        const canvas = await window.fetchOpenCanvas();
        const comp = defaultComponent({
          name: nextName(canvas?.components),
          ...overrides
        });
        fillForm(comp);
        window.resetPropsDialogState(propsKey, readForm, applyId);
        switchTab('general');
        wireTools();
        presentDialog();
        const previewComp = readForm();
        if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
        else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
        window.flushPropsApplyButton?.(readForm, applyId);
      } catch (err) {
        window.setStatus(`${label} Button properties error: ${err.message}`);
      }
    }

    async function apply() {
      const comp = readForm();
      const ok = await window.upsertCanvasComponent(comp);
      if (!ok) {
        window.setStatus('Could not apply — open a display or global object first');
        return;
      }
      window.commitPropsSnapshot(readForm, applyId);
      window.afterCanvasComponentSaved?.(comp);
      window.setStatus(`Applied ${comp.name}`);
    }

    async function save(e) {
      e.preventDefault();
      const comp = readForm();
      const ok = await window.upsertCanvasComponent(comp);
      if (!ok) {
        window.setStatus('Could not save — open a display or global object first');
        return;
      }
      dialogCommitted = true;
      const editIdx = window.state?.propsDialog?.editIndex;
      document.getElementById(dialogId).close();
      if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
      window.setStatus(`Saved ${comp.name}`);
    }

    function insertCaptionText(text) {
      const area = $('Caption');
      if (!area || !text) return;
      const start = area.selectionStart ?? area.value.length;
      const end = area.selectionEnd ?? start;
      area.value = area.value.slice(0, start) + text + area.value.slice(end);
      area.focus();
      const pos = start + text.length;
      area.setSelectionRange(pos, pos);
      schedulePreview();
    }

    function insertCaptionTag() {
      window.StudioTagTools?.openTagBrowser(null, (sel) => {
        const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
        insertCaptionText(tag);
      });
    }

    function hideInsertVariableMenu() {
      $('InsertVariableMenu')?.classList.add('hidden');
    }

    function listBrowsableObjects() {
      const selfName = $('Name')?.value.trim();
      const exclude = cfg.linkTarget === 'trend' ? PEN_BUTTON_TYPES : KEY_BUTTON_TYPES;
      const preferred = cfg.linkTarget === 'trend' ? isTrendType : (t) => INPUT_TYPES.has(t);
      const seen = new Set();
      const items = [];
      const add = (comp) => {
        const name = comp?.name;
        if (!name || name === selfName || seen.has(name)) return;
        if (exclude.has(comp.type)) return;
        seen.add(name);
        items.push({ name, type: comp.type || '' });
      };
      const entries = window.state?.canvasEditCache?.editComponents || [];
      for (const entry of entries) add(entry?.comp || entry);
      const raw = window.state?.canvasEditCache?.raw?.components || [];
      for (const comp of raw) add(comp);
      items.sort((a, b) => {
        const at = preferred(a.type) ? 0 : 1;
        const bt = preferred(b.type) ? 0 : 1;
        if (at !== bt) return at - bt;
        return a.name.localeCompare(b.name);
      });
      return items;
    }

    function closeObjectBrowser() {
      const dlg = $('ObjectBrowserDialog');
      if (!dlg) return;
      try { dlg.close(); } catch (_) {
        dlg.removeAttribute('open');
        dlg.style.display = 'none';
      }
    }

    function openObjectBrowser() {
      const dlg = $('ObjectBrowserDialog');
      const list = $('ObjectBrowserList');
      if (!dlg || !list) return;
      const items = listBrowsableObjects();
      const current = $('LinkedObject')?.value.trim() || '';
      list.innerHTML = items.length
        ? items.map((item) => `<option value="${String(item.name).replace(/"/g, '&quot;')}">${item.name}</option>`).join('')
        : '<option value="" disabled>No objects on this display</option>';
      if (current) list.value = current;
      else if (items.length) list.selectedIndex = 0;
      dlg.classList.add('is-positioned');
      dlg.style.position = 'fixed';
      dlg.style.margin = '0';
      dlg.style.left = '120px';
      dlg.style.top = '120px';
      dlg.style.zIndex = '40000';
      try {
        if (!dlg.open) dlg.showModal();
      } catch (_) {
        dlg.setAttribute('open', '');
        dlg.style.display = 'block';
      }
    }

    function acceptObjectBrowser() {
      const name = $('ObjectBrowserList')?.value?.trim();
      if (name) {
        $('LinkedObject').value = name;
        schedulePreview();
        window.flushPropsApplyButton?.(readForm, applyId);
      }
      closeObjectBrowser();
    }

    function initDialog() {
      const form = document.getElementById(formId);
      if (!form || form.dataset[`${p}Wired`] === '1') return;
      window.StudioPropsShared?.fillPatternSelect(`${p}PatternStyle`, `${p}Filled`);
      form.addEventListener('submit', (e) => save(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
      document.getElementById(applyId)?.addEventListener('click', () => {
        apply().catch((err) => window.setStatus(`Error: ${err.message}`));
      });
      form.addEventListener('input', () => {
        schedulePreview();
        window.flushPropsApplyButton?.(readForm, applyId);
      });
      form.addEventListener('change', () => {
        syncFields();
        schedulePreview();
        window.flushPropsApplyButton?.(readForm, applyId);
      });
      document.getElementById(`cancel${T}`)?.addEventListener('click', () => {
        if (!dialogCommitted) window.revertPropsDialogPreview?.();
        dialogCommitted = true;
        document.getElementById(dialogId)?.close();
      });
      document.getElementById(dialogId)?.addEventListener('close', () => {
        if (previewTimer) {
          clearTimeout(previewTimer);
          previewTimer = null;
        }
        hideInsertVariableMenu();
        if (linked) closeObjectBrowser();
        if (!dialogCommitted) window.revertPropsDialogPreview?.();
        dialogCommitted = false;
        window.clearPropsDialogState?.();
        window.activateSelectTool?.();
      });
      document.getElementById(`help${T}`)?.addEventListener('click', () => {
        alert(cfg.help);
      });
      document.querySelectorAll(`#${dialogId} .dialog-tab`).forEach((tab) => {
        tab.addEventListener('click', () => {
          hideInsertVariableMenu();
          switchTab(tab.dataset[`${p}Tab`]);
        });
      });
      if (linked) {
        $('BrowseLinkedObject')?.addEventListener('click', () => {
          if ($('BrowseLinkedObject')?.disabled) return;
          openObjectBrowser();
        });
        $('ObjectBrowserOk')?.addEventListener('click', acceptObjectBrowser);
        $('ObjectBrowserList')?.addEventListener('dblclick', acceptObjectBrowser);
        $('ObjectBrowserCancel')?.addEventListener('click', closeObjectBrowser);
        $('ObjectBrowserHelp')?.addEventListener('click', () => {
          const first = cfg.linkTarget === 'trend' ? 'Trend' : 'Input';
          alert(`Select a display object to receive the ${label} press. ${first} objects are listed first when present.`);
        });
      }
      $('BrowseImage')?.addEventListener('click', () => {
        window.showImageBrowserDialog?.({ selectedFileName: $('Image')?.value || null })
          .then((fileName) => {
            if (!fileName) return;
            $('Image').value = fileName;
            schedulePreview();
          })
          .catch((err) => window.setStatus(`Error: ${err.message}`));
      });
      $('InsertVariable')?.addEventListener('click', (e) => {
        e.stopPropagation();
        $('InsertVariableMenu')?.classList.toggle('hidden');
      });
      $('InsertVariableMenu')?.addEventListener('click', (e) => {
        const kind = e.target?.dataset?.[`${p}Var`];
        if (!kind) return;
        hideInsertVariableMenu();
        if (kind === 'timedate') insertCaptionText('{#dt}');
        else insertCaptionTag();
      });
      document.addEventListener('click', (e) => {
        const wrap = document.querySelector(`#${dialogId} .ft-insert-var-wrap`);
        if (wrap && !wrap.contains(e.target)) hideInsertVariableMenu();
      });
      $('Shape')?.addEventListener('change', () => {
        if ($('Shape')?.value !== 'circle') return;
        const w = Number($('Width')?.value) || 0;
        const h = Number($('Height')?.value) || 0;
        const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
        $('Width').value = String(size);
        $('Height').value = String(size);
      });
      if (cfg.eSignature) {
        $('DomainBrowse')?.addEventListener('click', () => {
          if ($('DomainBrowse')?.disabled) return;
          window.StudioTagTools?.openTagBrowser(null, (sel) => {
            const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
            if (!tag) return;
            $('DomainVariable').value = tag;
            schedulePreview();
          });
        });
      }
      for (const s of ['Bold', 'Italic', 'Underline']) {
        $(s)?.addEventListener('click', (e) => {
          e.preventDefault();
          e.currentTarget.classList.toggle('active');
          schedulePreview();
        });
      }
      form.dataset[`${p}Wired`] = '1';
    }

    // Keep the type-specific method names studio.js already calls.
    const short = T.replace(/Button$/, '');
    window[`Studio${T}`] = {
      [`init${T}Dialog`]: initDialog,
      [`present${T}Dialog`]: presentDialog,
      [cfg.scheduleName || `schedule${short}LivePreview`]: schedulePreview,
      [`show${T}Dialog`]: showDialog,
      [`fill${T}Form`]: fillForm,
      [`read${T}Form`]: readForm,
      [`switch${T}Tab`]: switchTab,
      [`wire${T}Tools`]: wireTools,
      [`next${T}Name`]: nextName,
      [`default${T}Component`]: defaultComponent,
      [`apply${T}`]: apply
    };
  }

  const repeatHelp = (label, key) => `${label} Button sends ${key} repeatedly while held (per the Timing settings) to the object with focus, or to a linked input object.`;
  const keyHelp = (label) => `${label} Button sends ${label} to the object with focus, or to a linked input object.`;
  const userHelp = (label, action) => `${label} Button opens a runtime prompt ${action}`;

  // Listed in studio.html DOM order; each group is inserted before the dialog that follows it.
  const KEY_DIALOG = { before: 'trendDialog', linkTarget: 'input', dialogClass: 'dialog-pause-pen dialog-end' };
  const keyButton = (type, prefix, label, extra) => ({
    ...KEY_DIALOG, type, prefix, label, image: label, propsKey: label.toLowerCase(), help: keyHelp(label), ...extra
  });
  // Move/Page buttons: auto-repeat, and their live-preview hook keeps the full type name.
  const repeatButton = (type, prefix, label, image, key) => ({
    ...KEY_DIALOG, type, prefix, label, image,
    propsKey: label.toLowerCase().replace(' ', '-'),
    autoRepeat: true,
    scheduleName: `schedule${type}LivePreview`,
    help: repeatHelp(label, key)
  });

  const configs = [
    {
      type: 'PausePenButton', prefix: 'ppb', label: 'Pause Pen', propsKey: 'pause-pen', linkTarget: 'trend',
      before: 'trendDialog', dialogClass: 'dialog-pause-pen',
      help: 'Pause Pen Button pauses trending on the linked Trend object, or on the object that currently has focus.'
    },
    {
      type: 'NextPenButton', prefix: 'npb', label: 'Next Pen', propsKey: 'next-pen', linkTarget: 'trend',
      before: 'trendDialog', dialogClass: 'dialog-next-pen',
      help: 'Next Pen Button advances to the next pen on the linked Trend object, or on the object that currently has focus.'
    },
    keyButton('BackspaceButton', 'bsb', 'Backspace', { dialogClass: 'dialog-pause-pen dialog-backspace' }),
    keyButton('EndButton', 'enb', 'End'),
    keyButton('EnterButton', 'etb', 'Enter'),
    keyButton('HomeButton', 'hmb', 'Home'),
    repeatButton('MoveLeftButton', 'mvl', 'Move Left', 'Arrow Left', 'ArrowLeft'),
    repeatButton('PageDownButton', 'pgd', 'Page Down', 'Page Down', 'PageDown'),
    repeatButton('PageUpButton', 'pgu', 'Page Up', 'Page Up', 'PageUp'),
    repeatButton('MoveRightButton', 'mvr', 'Move Right', 'Arrow Right', 'ArrowRight'),
    repeatButton('MoveUpButton', 'mvu', 'Move Up', 'Arrow Up', 'ArrowUp'),
    repeatButton('MoveDownButton', 'mvd', 'Move Down', 'Arrow Down', 'ArrowDown'),
    ...[
      ['AddUserGroupButton', 'aug', 'Add User/Group', 'add-user-group', 'to create a new operator user and assign it to a role/group.'],
      ['DeleteUserGroupButton', 'dug', 'Delete User/Group', 'delete-user-group', 'asking for a username, verifies that user exists, and removes it.'],
      ['ModifyGroupMembershipButton', 'mgb', 'Modify Group Membership', 'modify-group-membership', 'asking for a username, verifies that user exists, and changes its role/group.'],
      ['UnlockUserButton', 'unl', 'Unlock User', 'unlock-user', 'asking for a username, verifies that user exists and is locked, and unlocks it.'],
      ['EnableUserButton', 'enu', 'Enable User', 'enable-user', 'asking for a username, verifies that user exists, and enables it.'],
      ['DisableUserButton', 'dsu', 'Disable User', 'disable-user', 'asking for a username, verifies that user exists, and disables it.'],
      ['PasswordButton', 'pwb', 'Password', 'change-password', 'asking for a username and new password, verifies that user exists, and changes its password.'],
      ['ChangeUserPropertiesButton', 'cup', 'Change User Properties', 'change-user-properties', 'asking for a username, verifies that user exists, and lets you update its role/group and enabled state.']
    ].map(([type, prefix, label, propsKey, action]) => ({
      type, prefix, label, propsKey, eSignature: true,
      before: 'recipePlusSelectorDialog', dialogClass: 'dialog-goto-props',
      help: userHelp(label, action)
    }))
  ];

  for (const cfg of configs) {
    document.getElementById(cfg.before).insertAdjacentHTML('beforebegin', dialogMarkup(cfg));
  }
  configs.forEach(createButtonDialog);
})();
