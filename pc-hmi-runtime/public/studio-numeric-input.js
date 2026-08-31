/** Numeric Input Enable / Numeric Input Cursor Point property dialogs */
(function () {
  let niePreviewTimer = null;
  let nieDialogCommitted = false;

  const NIE_CONTROL_DELAY = [
    [0, '0 msec'], [200, '200 msec'], [400, '400 msec'], [600, '600 msec'], [800, '800 msec'],
    [1000, '1 second'], [2000, '2 seconds'], [3000, '3 seconds'], [4000, '4 seconds'], [5000, '5 seconds']
  ];
  const NIE_HOLD_TIME = [
    [50, '50 msec'], [250, '250 msec'], [500, '500 msec'], [750, '750 msec'],
    [1000, '1 second'], [2000, '2 seconds'], [3000, '3 seconds'], [4000, '4 seconds'], [5000, '5 seconds']
  ];
  const NIE_HANDSHAKE_TIME = [
    [1000, '1 second'], [2000, '2 seconds'], [3000, '3 seconds'], [4000, '4 seconds'], [5000, '5 seconds'],
    [6000, '6 seconds'], [7000, '7 seconds'], [8000, '8 seconds'], [9000, '9 seconds'], [10000, '10 seconds'],
    [15000, '15 seconds'], [20000, '20 seconds'], [25000, '25 seconds'], [30000, '30 seconds'],
    [35000, '35 seconds'], [40000, '40 seconds'], [45000, '45 seconds'], [50000, '50 seconds'],
    [55000, '55 seconds'], [60000, '60 seconds']
  ];

  function switchTab(tabId) {
    document.querySelectorAll('#numericInputDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.nieTab === tabId);
    });
    document.querySelectorAll('#numericInputDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.nieTabPanel === tabId);
    });
  }

  function nieGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function nieSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function fillSelectOnce(id, filledKey, options, selected) {
    const el = document.getElementById(id);
    if (!el || el.dataset[filledKey] === '1') return;
    el.dataset[filledKey] = '1';
    el.innerHTML = options.map(([value, label]) => (
      `<option value="${value}"${String(value) === String(selected) ? ' selected' : ''}>${label}</option>`
    )).join('');
  }

  function fillNieStaticSelects() {
    fillSelectOnce('nieEnterKeyControlDelay', 'nieFilled', NIE_CONTROL_DELAY, 400);
    fillSelectOnce('nieEnterKeyHoldTime', 'nieHoldFilled', NIE_HOLD_TIME, 250);
    fillSelectOnce('nieEnterKeyHandshakeTime', 'nieHsFilled', NIE_HANDSHAKE_TIME, 4000);
    const digits = [];
    for (let n = 0; n <= 15; n++) digits.push([n, String(n)]);
    fillSelectOnce('nieDigitsAfterDecimal', 'nieDecFilled', digits, 0);
  }

  function mapNieDecimalPoint(raw) {
    const v = String(raw || 'implicit');
    if (v === 'fixed' || v === 'fixedPosition') return 'fixedPosition';
    return 'implicit';
  }

  function mapNieHandshakeReset(raw) {
    const v = String(raw || 'nonZeroValue');
    if (v === 'zeroValue' || v === 'zeroToNonZero') return 'zeroToNonZero';
    return 'nonZeroValue';
  }

  function nextNumericInputName(components) {
    const n = (components || []).filter((c) => c.type === 'NumericInputEnable').length + 1;
    return `NumericInputEnable${n}`;
  }

  function defaultNumericInputComponent(overrides = {}) {
    return {
      type: 'NumericInputEnable',
      name: 'NumericInputEnable1',
      tag: '',
      optionalExpTag: '',
      enterTag: '',
      enterHandshakeTag: '',
      minimumTag: '',
      maximumTag: '',
      numericPopup: 'keypad',
      minValue: 0,
      maxValue: 2147483647,
      rampValue: 0,
      useVariableMinMax: false,
      decimalPoint: 'implicit',
      fixedPositionOutput: 'strippedValue',
      digitsAfterDecimal: 0,
      enterKeyControlDelay: 400,
      enterKeyHoldTime: 250,
      enterKeyHandshakeTime: 4000,
      handshakeResetType: 'nonZeroValue',
      caption: '',
      label: '',
      left: 16,
      top: 16,
      width: 80,
      height: 28,
      visible: true,
      borderStyle: 'line',
      borderWidth: 4,
      borderUsesBackColor: true,
      backStyle: 'solid',
      patternStyle: 'none',
      shape: 'rectangle',
      useBackColor: true,
      backColor: '#001C38',
      useBorderColor: true,
      borderColor: '#001C38',
      usePatternColor: false,
      patternColor: '#ffffff',
      useHighlightColor: true,
      highlightColor: '#0066cc',
      blink: false,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      useCaptionColor: false,
      captionColor: '#ffffff',
      useCaptionBackColor: false,
      captionBackColor: '#001C38',
      captionBlink: false,
      captionBackStyle: 'transparent',
      wordWrap: true,
      alignment: 'middleCenter',
      image: '',
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      useImageColor: false,
      imageColor: '#ffffff',
      useImageBackColor: false,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: false,
      horizontalMargin: 0,
      verticalMargin: 0,
      audio: true,
      keyNavigation: true,
      takeFocusOnPress: false,
      numberOfDigits: 5,
      decimalPlaces: 0,
      format: 'integer',
      requireESignature: false,
      allowBlankComment: false,
      requireReauth: false,
      requireCounterSig: false,
      authorizedGroup: 'Administrators',
      domainVisible: false,
      domainMode: 'name',
      domainName: '',
      domainVariable: '',
      domainDisable: false,
      ...overrides
    };
  }

  function scheduleNumericInputLivePreview() {
    if (window.state?.propsFormFill) return;
    if (niePreviewTimer) clearTimeout(niePreviewTimer);
    niePreviewTimer = setTimeout(() => {
      niePreviewTimer = null;
      if (!document.getElementById('numericInputDialog')?.open) return;
      const comp = readNumericInputForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readNumericInputForm, 'applyNumericInput');
    }, 80);
  }

  function syncNieESignatureFields() {
    const on = Boolean(document.getElementById('nieRequireESignature')?.checked);
    for (const id of [
      'nieAllowBlankComment', 'nieRequireReauth', 'nieRequireCounterSig', 'nieAuthorizedGroup',
      'nieDomainVisible', 'nieDomainNameMode', 'nieDomainVariableMode', 'nieDomainName',
      'nieDomainVariable', 'nieDomainBrowse', 'nieDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
  }

  function syncNumericInputFields() {
    const pat = document.getElementById('niePatternColor');
    if (pat) pat.disabled = !document.getElementById('nieUsePatternColor')?.checked;
    const capColor = document.getElementById('nieCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('nieUseCaptionColor')?.checked;
    const capBack = document.getElementById('nieCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('nieUseCaptionBackColor')?.checked
      || document.getElementById('nieCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('nieImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('nieUseImageColor')?.checked;
    const imgBack = document.getElementById('nieImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('nieUseImageBackColor')?.checked
      || document.getElementById('nieImageBackStyle')?.value !== 'solid';
    const varMinMax = Boolean(document.getElementById('nieUseVariableMinMax')?.checked);
    const minEl = document.getElementById('nieMinValue');
    const maxEl = document.getElementById('nieMaxValue');
    if (minEl) minEl.disabled = varMinMax;
    if (maxEl) maxEl.disabled = varMinMax;
    const implicit = document.getElementById('nieDecimalPoint')?.value === 'implicit';
    const fixedOut = document.getElementById('nieFixedPositionOutput');
    const digits = document.getElementById('nieDigitsAfterDecimal');
    if (fixedOut) fixedOut.disabled = implicit;
    if (digits) digits.disabled = implicit;
    syncNieESignatureFields();
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('numericInputDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    document.querySelectorAll('#numericInputForm .ft-color-input').forEach((input) => {
      if (input.dataset.niePreviewWired === '1') return;
      input.dataset.niePreviewWired = '1';
      input.addEventListener('input', scheduleNumericInputLivePreview);
      input.addEventListener('change', scheduleNumericInputLivePreview);
    });
    syncNumericInputFields();
  }

  function presentNumericInputDialog() {
    const dialog = document.getElementById('numericInputDialog');
    if (!dialog) {
      window.setStatus('Numeric Input Enable Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    nieDialogCommitted = false;
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
        window.setStatus(`Opened Numeric Input Enable properties without modal: ${err2.message}`);
      }
    }
  }

  function fillNumericInputForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillNieStaticSelects();
      window.StudioPropsShared?.fillPatternSelect('niePatternStyle', 'nieFilled');
      document.getElementById('nieBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('nieBorderWidth').value = comp.borderWidth ?? 4;
      document.getElementById('nieBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('niePatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('nieShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('nieBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      nieSetColor('nieBackColor', comp.backColor || '#001C38');
      nieSetColor('nieBorderColor', comp.borderColor || '#001C38');
      const usePat = document.getElementById('nieUsePatternColor');
      if (usePat) usePat.checked = Boolean(comp.usePatternColor);
      nieSetColor('niePatternColor', comp.patternColor || '#ffffff');
      nieSetColor('nieHighlightColor', comp.highlightColor || '#0066cc');
      const blink = document.getElementById('nieBlink');
      if (blink) blink.checked = Boolean(comp.blink);
      document.getElementById('nieHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('nieVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('nieAudio').checked = comp.audio !== false;
      document.getElementById('nieKeyNavigation').checked = comp.keyNavigation !== false;
      document.getElementById('nieTakeFocusOnPress').checked = Boolean(comp.takeFocusOnPress);
      document.getElementById('nieCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('nieFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('nieFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('nieBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('nieItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('nieUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('nieUseCaptionColor').checked = Boolean(comp.useCaptionColor);
      nieSetColor('nieCaptionColor', comp.captionColor || '#ffffff');
      const useCapBack = document.getElementById('nieUseCaptionBackColor');
      if (useCapBack) useCapBack.checked = Boolean(comp.useCaptionBackColor);
      nieSetColor('nieCaptionBackColor', comp.captionBackColor || '#001C38');
      const capBlink = document.getElementById('nieCaptionBlink');
      if (capBlink) capBlink.checked = Boolean(comp.captionBlink);
      document.getElementById('nieWordWrap').checked = comp.wordWrap !== false;
      const capBackStyle = document.getElementById('nieCaptionBackStyle');
      if (capBackStyle) capBackStyle.value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#numericInputForm input[name="nieAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      const img = document.getElementById('nieImage');
      if (img) img.value = comp.image || '';
      const imgBackStyle = document.getElementById('nieImageBackStyle');
      if (imgBackStyle) imgBackStyle.value = comp.imageBackStyle || 'transparent';
      const useImgColor = document.getElementById('nieUseImageColor');
      if (useImgColor) useImgColor.checked = Boolean(comp.useImageColor);
      nieSetColor('nieImageColor', comp.imageColor || '#ffffff');
      const useImgBack = document.getElementById('nieUseImageBackColor');
      if (useImgBack) useImgBack.checked = Boolean(comp.useImageBackColor);
      nieSetColor('nieImageBackColor', comp.imageBackColor || '#001C38');
      const imgBlink = document.getElementById('nieImageBlink');
      if (imgBlink) imgBlink.checked = Boolean(comp.imageBlink);
      const imgScaled = document.getElementById('nieImageScaled');
      if (imgScaled) imgScaled.checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#numericInputForm input[name="nieImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('nieNumericPopup').value = comp.numericPopup || 'keypad';
      document.getElementById('nieMinValue').value = comp.minValue ?? 0;
      document.getElementById('nieMaxValue').value = comp.maxValue ?? 2147483647;
      document.getElementById('nieRampValue').value = comp.rampValue ?? 0;
      document.getElementById('nieUseVariableMinMax').checked = Boolean(comp.useVariableMinMax);
      document.getElementById('nieDecimalPoint').value = mapNieDecimalPoint(comp.decimalPoint);
      document.getElementById('nieFixedPositionOutput').value = comp.fixedPositionOutput || 'strippedValue';
      document.getElementById('nieDigitsAfterDecimal').value = String(comp.digitsAfterDecimal ?? comp.decimalPlaces ?? 0);
      document.getElementById('nieEnterKeyControlDelay').value = String(comp.enterKeyControlDelay ?? 400);
      document.getElementById('nieEnterKeyHoldTime').value = String(comp.enterKeyHoldTime ?? 250);
      document.getElementById('nieEnterKeyHandshakeTime').value = String(comp.enterKeyHandshakeTime ?? 4000);
      document.getElementById('nieHandshakeResetType').value = mapNieHandshakeReset(comp.handshakeResetType);
      document.getElementById('nieHeight').value = comp.height ?? 28;
      document.getElementById('nieWidth').value = comp.width ?? 80;
      document.getElementById('nieTop').value = comp.top ?? 16;
      document.getElementById('nieLeft').value = comp.left ?? 16;
      document.getElementById('nieName').value = comp.name || 'NumericInputEnable1';
      document.getElementById('nieVisible').checked = comp.visible !== false;
      document.getElementById('nieTag').value = comp.tag || '';
      document.getElementById('nieOptionalExpTag').value = comp.optionalExpTag || '';
      document.getElementById('nieEnterTag').value = comp.enterTag || '';
      document.getElementById('nieEnterHandshakeTag').value = comp.enterHandshakeTag || '';
      document.getElementById('nieMinimumTag').value = comp.minimumTag || '';
      document.getElementById('nieMaximumTag').value = comp.maximumTag || '';
      const reqSig = document.getElementById('nieRequireESignature');
      if (reqSig) reqSig.checked = Boolean(comp.requireESignature);
      const allowBlank = document.getElementById('nieAllowBlankComment');
      if (allowBlank) allowBlank.checked = Boolean(comp.allowBlankComment);
      const reauth = document.getElementById('nieRequireReauth');
      if (reauth) reauth.checked = Boolean(comp.requireReauth);
      const counter = document.getElementById('nieRequireCounterSig');
      if (counter) counter.checked = Boolean(comp.requireCounterSig);
      const group = document.getElementById('nieAuthorizedGroup');
      if (group) group.value = comp.authorizedGroup || 'Administrators';
      const domainVisible = document.getElementById('nieDomainVisible');
      if (domainVisible) domainVisible.checked = Boolean(comp.domainVisible);
      const domainNameMode = document.getElementById('nieDomainNameMode');
      const domainVarMode = document.getElementById('nieDomainVariableMode');
      if (domainNameMode) domainNameMode.checked = (comp.domainMode || 'name') !== 'variable';
      if (domainVarMode) domainVarMode.checked = (comp.domainMode || 'name') === 'variable';
      const domainName = document.getElementById('nieDomainName');
      if (domainName) domainName.value = comp.domainName || '';
      const domainVar = document.getElementById('nieDomainVariable');
      if (domainVar) domainVar.value = comp.domainVariable || '';
      const domainDisable = document.getElementById('nieDomainDisable');
      if (domainDisable) domainDisable.checked = Boolean(comp.domainDisable);
      syncNumericInputFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readNumericInputForm() {
    const decimalPlaces = Number(document.getElementById('nieDigitsAfterDecimal')?.value);
    const dec = Number.isFinite(decimalPlaces) ? decimalPlaces : 0;
    const caption = document.getElementById('nieCaption')?.value ?? '';
    return {
      type: 'NumericInputEnable',
      name: document.getElementById('nieName')?.value.trim() || 'NumericInputEnable1',
      tag: document.getElementById('nieTag')?.value.trim() || '',
      optionalExpTag: document.getElementById('nieOptionalExpTag')?.value.trim() || '',
      enterTag: document.getElementById('nieEnterTag')?.value.trim() || '',
      enterHandshakeTag: document.getElementById('nieEnterHandshakeTag')?.value.trim() || '',
      minimumTag: document.getElementById('nieMinimumTag')?.value.trim() || '',
      maximumTag: document.getElementById('nieMaximumTag')?.value.trim() || '',
      numericPopup: document.getElementById('nieNumericPopup')?.value || 'keypad',
      minValue: Number(document.getElementById('nieMinValue')?.value) || 0,
      maxValue: Number(document.getElementById('nieMaxValue')?.value) || 2147483647,
      rampValue: Number(document.getElementById('nieRampValue')?.value) || 0,
      useVariableMinMax: Boolean(document.getElementById('nieUseVariableMinMax')?.checked),
      decimalPoint: document.getElementById('nieDecimalPoint')?.value || 'implicit',
      fixedPositionOutput: document.getElementById('nieFixedPositionOutput')?.value || 'strippedValue',
      digitsAfterDecimal: dec,
      decimalPlaces: dec,
      enterKeyControlDelay: Number(document.getElementById('nieEnterKeyControlDelay')?.value) || 400,
      enterKeyHoldTime: Number(document.getElementById('nieEnterKeyHoldTime')?.value) || 250,
      enterKeyHandshakeTime: Number(document.getElementById('nieEnterKeyHandshakeTime')?.value) || 4000,
      handshakeResetType: document.getElementById('nieHandshakeResetType')?.value || 'nonZeroValue',
      caption,
      label: caption,
      left: Number(document.getElementById('nieLeft')?.value) || 0,
      top: Number(document.getElementById('nieTop')?.value) || 0,
      width: Number(document.getElementById('nieWidth')?.value) || 80,
      height: Number(document.getElementById('nieHeight')?.value) || 28,
      visible: document.getElementById('nieVisible')?.checked !== false,
      borderStyle: document.getElementById('nieBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('nieBorderWidth')?.value) || 4,
      borderUsesBackColor: document.getElementById('nieBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('nieBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('niePatternStyle')?.value || 'none',
      shape: document.getElementById('nieShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: nieGetColor('nieBackColor'),
      useBorderColor: true,
      borderColor: nieGetColor('nieBorderColor'),
      usePatternColor: Boolean(document.getElementById('nieUsePatternColor')?.checked),
      patternColor: nieGetColor('niePatternColor'),
      useHighlightColor: true,
      highlightColor: nieGetColor('nieHighlightColor'),
      blink: Boolean(document.getElementById('nieBlink')?.checked),
      fontFamily: document.getElementById('nieFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('nieFontSize')?.value) || 10,
      bold: document.getElementById('nieBold')?.classList.contains('active'),
      italic: document.getElementById('nieItalic')?.classList.contains('active'),
      underline: document.getElementById('nieUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('nieUseCaptionColor')?.checked),
      captionColor: nieGetColor('nieCaptionColor'),
      useCaptionBackColor: Boolean(document.getElementById('nieUseCaptionBackColor')?.checked),
      captionBackColor: nieGetColor('nieCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('nieCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('nieCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('nieWordWrap')?.checked !== false,
      alignment: document.querySelector('#numericInputForm input[name="nieAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('nieImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('nieImageBackStyle')?.value || 'transparent',
      useImageColor: Boolean(document.getElementById('nieUseImageColor')?.checked),
      imageColor: nieGetColor('nieImageColor'),
      useImageBackColor: Boolean(document.getElementById('nieUseImageBackColor')?.checked),
      imageBackColor: nieGetColor('nieImageBackColor'),
      imageBlink: Boolean(document.getElementById('nieImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('nieImageScaled')?.checked),
      imageAlignment: document.querySelector('#numericInputForm input[name="nieImageAlign"]:checked')?.value || 'middleCenter',
      horizontalMargin: Number(document.getElementById('nieHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('nieVerticalMargin')?.value) || 0,
      audio: document.getElementById('nieAudio')?.checked !== false,
      keyNavigation: document.getElementById('nieKeyNavigation')?.checked !== false,
      takeFocusOnPress: Boolean(document.getElementById('nieTakeFocusOnPress')?.checked),
      numberOfDigits: 5,
      format: dec > 0 ? 'float' : 'integer',
      requireESignature: Boolean(document.getElementById('nieRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('nieAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('nieRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('nieRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('nieAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('nieDomainVisible')?.checked),
      domainMode: document.querySelector('#numericInputForm input[name="nieDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('nieDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('nieDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('nieDomainDisable')?.checked)
    };
  }

  async function showNumericInputDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Numeric Input Enable');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initNumericInputDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultNumericInputComponent({
        name: nextNumericInputName(canvas?.components),
        ...overrides
      });
      fillNumericInputForm(comp);
      window.resetPropsDialogState('numeric-input', readNumericInputForm, 'applyNumericInput');
      switchTab('general');
      wireTools();
      presentNumericInputDialog();
      const previewComp = readNumericInputForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readNumericInputForm, 'applyNumericInput');
    } catch (err) {
      window.setStatus(`Numeric Input Enable properties error: ${err.message}`);
    }
  }

  async function applyNumericInput() {
    const comp = readNumericInputForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readNumericInputForm, 'applyNumericInput');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveNumericInput(e) {
    e.preventDefault();
    const comp = readNumericInputForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    nieDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('numericInputDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertNieCaptionText(text) {
    const area = document.getElementById('nieCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleNumericInputLivePreview();
  }

  function insertNieCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertNieCaptionText(tag);
    });
  }

  function hideNieInsertVariableMenu() {
    document.getElementById('nieInsertVariableMenu')?.classList.add('hidden');
  }

  function initNumericInputDialog() {
    const form = document.getElementById('numericInputForm');
    if (!form || form.dataset.nieWired === '1') return;
    form.dataset.nieWired = '1';
    fillNieStaticSelects();
    window.StudioPropsShared?.fillPatternSelect('niePatternStyle', 'nieFilled');
    form.addEventListener('submit', (e) => saveNumericInput(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyNumericInput')?.addEventListener('click', () => {
      applyNumericInput().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleNumericInputLivePreview();
      window.flushPropsApplyButton?.(readNumericInputForm, 'applyNumericInput');
    });
    form.addEventListener('change', () => {
      syncNumericInputFields();
      scheduleNumericInputLivePreview();
      window.flushPropsApplyButton?.(readNumericInputForm, 'applyNumericInput');
    });
    document.getElementById('cancelNumericInput')?.addEventListener('click', () => {
      document.getElementById('numericInputDialog')?.close();
    });
    document.getElementById('numericInputDialog')?.addEventListener('close', () => {
      if (niePreviewTimer) {
        clearTimeout(niePreviewTimer);
        niePreviewTimer = null;
      }
      hideNieInsertVariableMenu();
      if (!nieDialogCommitted) window.revertPropsDialogPreview?.();
      nieDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpNumericInput')?.addEventListener('click', () => {
      alert('Numeric Input Enable writes a value tag when the operator enters a number. Configure min/max, timing, handshake, and connections. A Value tag is optional until runtime.');
    });
    document.querySelectorAll('#numericInputDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideNieInsertVariableMenu();
        switchTab(tab.dataset.nieTab);
      });
    });
    document.getElementById('nieBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('nieImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('nieImage').value = fileName;
          scheduleNumericInputLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('nieInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('nieInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('nieInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.nieVar;
      if (!kind) return;
      hideNieInsertVariableMenu();
      if (kind === 'timedate') insertNieCaptionText('{#dt}');
      else insertNieCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#numericInputDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideNieInsertVariableMenu();
    });
    document.getElementById('nieRequireESignature')?.addEventListener('change', syncNieESignatureFields);
    document.getElementById('nieShape')?.addEventListener('change', () => {
      if (document.getElementById('nieShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('nieWidth')?.value) || 0;
      const h = Number(document.getElementById('nieHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('nieWidth').value = String(size);
      document.getElementById('nieHeight').value = String(size);
    });
    for (const id of [
      'nieUsePatternColor', 'nieUseCaptionColor', 'nieUseCaptionBackColor',
      'nieUseImageColor', 'nieUseImageBackColor', 'nieCaptionBackStyle', 'nieImageBackStyle',
      'nieUseVariableMinMax', 'nieDecimalPoint'
    ]) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncNumericInputFields();
        scheduleNumericInputLivePreview();
      });
    }
    for (const id of ['nieBold', 'nieItalic', 'nieUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleNumericInputLivePreview();
      });
    }
  }

  window.StudioNumericInput = {
    initNumericInputDialog,
    presentNumericInputDialog,
    scheduleNumericInputLivePreview,
    showNumericInputDialog,
    fillNumericInputForm,
    readNumericInputForm,
    switchNumericInputTab: switchTab,
    wireNumericInputTools: wireTools,
    initNumericInputCursorDialog,
    presentNumericInputCursorDialog,
    scheduleNumericInputCursorLivePreview,
    showNumericInputCursorDialog,
    fillNumericInputCursorForm,
    readNumericInputCursorForm,
    switchNumericInputCursorTab: switchCursorTab,
    wireNumericInputCursorTools: wireCursorTools
  };

  // ─── Numeric Input Cursor Point ────────────────────────────────────────────

  let nicPreviewTimer = null;
  let nicDialogCommitted = false;

  function switchCursorTab(tabId) {
    document.querySelectorAll('#numericInputCursorDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.nicTab === tabId);
    });
    document.querySelectorAll('#numericInputCursorDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.nicTabPanel === tabId);
    });
  }

  function fillNicStaticSelects() {
    fillSelectOnce('nicEnterKeyControlDelay', 'nicDelayFilled', NIE_CONTROL_DELAY, 400);
    fillSelectOnce('nicEnterKeyHoldTime', 'nicHoldFilled', NIE_HOLD_TIME, 250);
    fillSelectOnce('nicEnterKeyHandshakeTime', 'nicHsFilled', NIE_HANDSHAKE_TIME, 4000);
    const afterDec = [];
    for (let n = 0; n <= 15; n++) afterDec.push([n, String(n)]);
    fillSelectOnce('nicDigitsAfterDecimal', 'nicAfterDecFilled', afterDec, 0);
    const digits = [];
    for (let n = 1; n <= 17; n++) digits.push([n, String(n)]);
    fillSelectOnce('nicNumberOfDigits', 'nicDigitsFilled', digits, 5);
    fillSelectOnce('nicDecimalPlaces', 'nicDecFilled', afterDec, 0);
  }

  function mapNicFillLeftWith(raw) {
    const v = String(raw || 'none').toLowerCase();
    if (v === 'zero' || v === 'zeroes') return 'zeroes';
    if (v === 'space' || v === 'spaces') return 'spaces';
    return 'none';
  }

  function nextNumericInputCursorName(components) {
    const n = (components || []).filter((c) => c.type === 'NumericInputCursorPoint').length + 1;
    return `NumericInputCursorPoint${n}`;
  }

  function defaultNumericInputCursorComponent(overrides = {}) {
    return {
      type: 'NumericInputCursorPoint',
      name: 'NumericInputCursorPoint1',
      tag: '',
      optionalExpTag: '',
      indicatorTag: '',
      enterTag: '',
      enterHandshakeTag: '',
      minimumTag: '',
      maximumTag: '',
      numericPopup: 'keypad',
      keypadCaption: '',
      minValue: 0,
      maxValue: 2147483647,
      rampValue: 0,
      useVariableMinMax: false,
      decimalPoint: 'implicit',
      fixedPositionOutput: 'strippedValue',
      digitsAfterDecimal: 0,
      numberOfDigits: 5,
      fillLeftWith: 'none',
      decimalPlaces: 0,
      enterKeyControlDelay: 400,
      enterKeyHoldTime: 250,
      enterKeyHandshakeTime: 4000,
      handshakeResetType: 'nonZeroValue',
      left: 16,
      top: 16,
      width: 80,
      height: 28,
      visible: true,
      borderStyle: 'line',
      borderWidth: 4,
      borderUsesBackColor: true,
      backStyle: 'solid',
      patternStyle: 'none',
      useBackColor: true,
      backColor: '#001C38',
      useBorderColor: true,
      borderColor: '#001C38',
      usePatternColor: true,
      patternColor: '#ffffff',
      useForeColor: true,
      foreColor: '#ffffff',
      useHighlightColor: true,
      highlightColor: '#0066cc',
      blink: false,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      alignment: 'middleCenter',
      horizontalMargin: 0,
      verticalMargin: 0,
      audio: true,
      keyNavigation: true,
      format: 'integer',
      requireESignature: false,
      allowBlankComment: false,
      requireReauth: false,
      requireCounterSig: false,
      authorizedGroup: 'Administrators',
      domainVisible: false,
      domainMode: 'name',
      domainName: '',
      domainVariable: '',
      domainDisable: false,
      ...overrides
    };
  }

  function scheduleNumericInputCursorLivePreview() {
    if (window.state?.propsFormFill) return;
    if (nicPreviewTimer) clearTimeout(nicPreviewTimer);
    nicPreviewTimer = setTimeout(() => {
      nicPreviewTimer = null;
      if (!document.getElementById('numericInputCursorDialog')?.open) return;
      const comp = readNumericInputCursorForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readNumericInputCursorForm, 'applyNumericInputCursor');
    }, 80);
  }

  function syncNicESignatureFields() {
    const on = Boolean(document.getElementById('nicRequireESignature')?.checked);
    for (const id of [
      'nicAllowBlankComment', 'nicRequireReauth', 'nicRequireCounterSig', 'nicAuthorizedGroup',
      'nicDomainVisible', 'nicDomainNameMode', 'nicDomainVariableMode', 'nicDomainName',
      'nicDomainVariable', 'nicDomainBrowse', 'nicDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
  }

  function syncNumericInputCursorFields() {
    const varMinMax = Boolean(document.getElementById('nicUseVariableMinMax')?.checked);
    const minEl = document.getElementById('nicMinValue');
    const maxEl = document.getElementById('nicMaxValue');
    if (minEl) minEl.disabled = varMinMax;
    if (maxEl) maxEl.disabled = varMinMax;
    const implicit = document.getElementById('nicDecimalPoint')?.value === 'implicit';
    const fixedOut = document.getElementById('nicFixedPositionOutput');
    const digits = document.getElementById('nicDigitsAfterDecimal');
    if (fixedOut) fixedOut.disabled = implicit;
    if (digits) digits.disabled = implicit;
    syncNicESignatureFields();
  }

  function wireCursorTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('numericInputCursorDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    document.querySelectorAll('#numericInputCursorForm .ft-color-input').forEach((input) => {
      if (input.dataset.nicPreviewWired === '1') return;
      input.dataset.nicPreviewWired = '1';
      input.addEventListener('input', scheduleNumericInputCursorLivePreview);
      input.addEventListener('change', scheduleNumericInputCursorLivePreview);
    });
    syncNumericInputCursorFields();
  }

  function presentNumericInputCursorDialog() {
    const dialog = document.getElementById('numericInputCursorDialog');
    if (!dialog) {
      window.setStatus('Numeric Input Cursor Point Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    nicDialogCommitted = false;
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
        window.setStatus(`Opened Numeric Input Cursor Point properties without modal: ${err2.message}`);
      }
    }
  }

  function fillNumericInputCursorForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillNicStaticSelects();
      window.StudioPropsShared?.fillPatternSelect('nicPatternStyle', 'nicFilled');
      document.getElementById('nicBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('nicBorderWidth').value = comp.borderWidth ?? 4;
      document.getElementById('nicBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('nicPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      document.getElementById('nicBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      nieSetColor('nicBackColor', comp.backColor || '#001C38');
      nieSetColor('nicBorderColor', comp.borderColor || '#001C38');
      nieSetColor('nicPatternColor', comp.patternColor || '#ffffff');
      nieSetColor('nicForeColor', comp.foreColor || '#ffffff');
      nieSetColor('nicHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('nicBlink').checked = Boolean(comp.blink);
      document.getElementById('nicFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('nicFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('nicBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('nicItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('nicUnderline').classList.toggle('active', Boolean(comp.underline));
      document.querySelectorAll('#numericInputCursorForm input[name="nicAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('nicHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('nicVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('nicAudio').checked = comp.audio !== false;
      document.getElementById('nicKeyNavigation').checked = comp.keyNavigation !== false;
      document.getElementById('nicNumericPopup').value = comp.numericPopup || 'keypad';
      document.getElementById('nicKeypadCaption').value = comp.keypadCaption || '';
      document.getElementById('nicMinValue').value = comp.minValue ?? 0;
      document.getElementById('nicMaxValue').value = comp.maxValue ?? 2147483647;
      document.getElementById('nicRampValue').value = comp.rampValue ?? 0;
      document.getElementById('nicUseVariableMinMax').checked = Boolean(comp.useVariableMinMax);
      document.getElementById('nicDecimalPoint').value = mapNieDecimalPoint(comp.decimalPoint);
      document.getElementById('nicFixedPositionOutput').value = comp.fixedPositionOutput || 'strippedValue';
      document.getElementById('nicDigitsAfterDecimal').value = String(comp.digitsAfterDecimal ?? 0);
      document.getElementById('nicNumberOfDigits').value = String(comp.numberOfDigits ?? 5);
      document.getElementById('nicFillLeftWith').value = mapNicFillLeftWith(comp.fillLeftWith);
      document.getElementById('nicDecimalPlaces').value = String(comp.decimalPlaces ?? 0);
      document.getElementById('nicEnterKeyControlDelay').value = String(comp.enterKeyControlDelay ?? 400);
      document.getElementById('nicEnterKeyHoldTime').value = String(comp.enterKeyHoldTime ?? 250);
      document.getElementById('nicEnterKeyHandshakeTime').value = String(comp.enterKeyHandshakeTime ?? 4000);
      document.getElementById('nicHandshakeResetType').value = mapNieHandshakeReset(comp.handshakeResetType);
      document.getElementById('nicHeight').value = comp.height ?? 28;
      document.getElementById('nicWidth').value = comp.width ?? 80;
      document.getElementById('nicTop').value = comp.top ?? 16;
      document.getElementById('nicLeft').value = comp.left ?? 16;
      document.getElementById('nicName').value = comp.name || 'NumericInputCursorPoint1';
      document.getElementById('nicVisible').checked = comp.visible !== false;
      document.getElementById('nicTag').value = comp.tag || '';
      document.getElementById('nicOptionalExpTag').value = comp.optionalExpTag || '';
      document.getElementById('nicIndicatorTag').value = comp.indicatorTag || '';
      document.getElementById('nicEnterTag').value = comp.enterTag || '';
      document.getElementById('nicEnterHandshakeTag').value = comp.enterHandshakeTag || '';
      document.getElementById('nicMinimumTag').value = comp.minimumTag || '';
      document.getElementById('nicMaximumTag').value = comp.maximumTag || '';
      const reqSig = document.getElementById('nicRequireESignature');
      if (reqSig) reqSig.checked = Boolean(comp.requireESignature);
      const allowBlank = document.getElementById('nicAllowBlankComment');
      if (allowBlank) allowBlank.checked = Boolean(comp.allowBlankComment);
      const reauth = document.getElementById('nicRequireReauth');
      if (reauth) reauth.checked = Boolean(comp.requireReauth);
      const counter = document.getElementById('nicRequireCounterSig');
      if (counter) counter.checked = Boolean(comp.requireCounterSig);
      const group = document.getElementById('nicAuthorizedGroup');
      if (group) group.value = comp.authorizedGroup || 'Administrators';
      const domainVisible = document.getElementById('nicDomainVisible');
      if (domainVisible) domainVisible.checked = Boolean(comp.domainVisible);
      const domainNameMode = document.getElementById('nicDomainNameMode');
      const domainVarMode = document.getElementById('nicDomainVariableMode');
      if (domainNameMode) domainNameMode.checked = (comp.domainMode || 'name') !== 'variable';
      if (domainVarMode) domainVarMode.checked = (comp.domainMode || 'name') === 'variable';
      const domainName = document.getElementById('nicDomainName');
      if (domainName) domainName.value = comp.domainName || '';
      const domainVar = document.getElementById('nicDomainVariable');
      if (domainVar) domainVar.value = comp.domainVariable || '';
      const domainDisable = document.getElementById('nicDomainDisable');
      if (domainDisable) domainDisable.checked = Boolean(comp.domainDisable);
      syncNumericInputCursorFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readNumericInputCursorForm() {
    const decimalPlaces = Number(document.getElementById('nicDecimalPlaces')?.value);
    const dec = Number.isFinite(decimalPlaces) ? decimalPlaces : 0;
    return {
      type: 'NumericInputCursorPoint',
      name: document.getElementById('nicName')?.value.trim() || 'NumericInputCursorPoint1',
      tag: document.getElementById('nicTag')?.value.trim() || '',
      optionalExpTag: document.getElementById('nicOptionalExpTag')?.value.trim() || '',
      indicatorTag: document.getElementById('nicIndicatorTag')?.value.trim() || '',
      enterTag: document.getElementById('nicEnterTag')?.value.trim() || '',
      enterHandshakeTag: document.getElementById('nicEnterHandshakeTag')?.value.trim() || '',
      minimumTag: document.getElementById('nicMinimumTag')?.value.trim() || '',
      maximumTag: document.getElementById('nicMaximumTag')?.value.trim() || '',
      numericPopup: document.getElementById('nicNumericPopup')?.value || 'keypad',
      keypadCaption: document.getElementById('nicKeypadCaption')?.value || '',
      minValue: Number(document.getElementById('nicMinValue')?.value) || 0,
      maxValue: Number(document.getElementById('nicMaxValue')?.value) || 2147483647,
      rampValue: Number(document.getElementById('nicRampValue')?.value) || 0,
      useVariableMinMax: Boolean(document.getElementById('nicUseVariableMinMax')?.checked),
      decimalPoint: document.getElementById('nicDecimalPoint')?.value || 'implicit',
      fixedPositionOutput: document.getElementById('nicFixedPositionOutput')?.value || 'strippedValue',
      digitsAfterDecimal: Number(document.getElementById('nicDigitsAfterDecimal')?.value) || 0,
      numberOfDigits: Number(document.getElementById('nicNumberOfDigits')?.value) || 5,
      fillLeftWith: document.getElementById('nicFillLeftWith')?.value || 'none',
      decimalPlaces: dec,
      enterKeyControlDelay: Number(document.getElementById('nicEnterKeyControlDelay')?.value) || 400,
      enterKeyHoldTime: Number(document.getElementById('nicEnterKeyHoldTime')?.value) || 250,
      enterKeyHandshakeTime: Number(document.getElementById('nicEnterKeyHandshakeTime')?.value) || 4000,
      handshakeResetType: document.getElementById('nicHandshakeResetType')?.value || 'nonZeroValue',
      left: Number(document.getElementById('nicLeft')?.value) || 0,
      top: Number(document.getElementById('nicTop')?.value) || 0,
      width: Number(document.getElementById('nicWidth')?.value) || 80,
      height: Number(document.getElementById('nicHeight')?.value) || 28,
      visible: document.getElementById('nicVisible')?.checked !== false,
      borderStyle: document.getElementById('nicBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('nicBorderWidth')?.value) || 4,
      borderUsesBackColor: document.getElementById('nicBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('nicBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('nicPatternStyle')?.value || 'none',
      useBackColor: true,
      backColor: nieGetColor('nicBackColor'),
      useBorderColor: true,
      borderColor: nieGetColor('nicBorderColor'),
      usePatternColor: true,
      patternColor: nieGetColor('nicPatternColor'),
      useForeColor: true,
      foreColor: nieGetColor('nicForeColor'),
      useHighlightColor: true,
      highlightColor: nieGetColor('nicHighlightColor'),
      blink: Boolean(document.getElementById('nicBlink')?.checked),
      fontFamily: document.getElementById('nicFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('nicFontSize')?.value) || 10,
      bold: document.getElementById('nicBold')?.classList.contains('active'),
      italic: document.getElementById('nicItalic')?.classList.contains('active'),
      underline: document.getElementById('nicUnderline')?.classList.contains('active'),
      alignment: document.querySelector('#numericInputCursorForm input[name="nicAlign"]:checked')?.value || 'middleCenter',
      horizontalMargin: Number(document.getElementById('nicHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('nicVerticalMargin')?.value) || 0,
      audio: document.getElementById('nicAudio')?.checked !== false,
      keyNavigation: document.getElementById('nicKeyNavigation')?.checked !== false,
      format: dec > 0 ? 'float' : 'integer',
      requireESignature: Boolean(document.getElementById('nicRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('nicAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('nicRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('nicRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('nicAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('nicDomainVisible')?.checked),
      domainMode: document.querySelector('#numericInputCursorForm input[name="nicDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('nicDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('nicDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('nicDomainDisable')?.checked)
    };
  }

  async function showNumericInputCursorDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Numeric Input Cursor Point');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initNumericInputCursorDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultNumericInputCursorComponent({
        name: nextNumericInputCursorName(canvas?.components),
        ...overrides
      });
      fillNumericInputCursorForm(comp);
      window.resetPropsDialogState('numeric-input-cursor', readNumericInputCursorForm, 'applyNumericInputCursor');
      switchCursorTab('general');
      wireCursorTools();
      presentNumericInputCursorDialog();
      const previewComp = readNumericInputCursorForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readNumericInputCursorForm, 'applyNumericInputCursor');
    } catch (err) {
      window.setStatus(`Numeric Input Cursor Point properties error: ${err.message}`);
    }
  }

  async function applyNumericInputCursor() {
    const comp = readNumericInputCursorForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readNumericInputCursorForm, 'applyNumericInputCursor');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveNumericInputCursor(e) {
    e.preventDefault();
    const comp = readNumericInputCursorForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    nicDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('numericInputCursorDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertNicCaptionText(text) {
    const area = document.getElementById('nicKeypadCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleNumericInputCursorLivePreview();
  }

  function insertNicCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertNicCaptionText(tag);
    });
  }

  function hideNicInsertVariableMenu() {
    document.getElementById('nicInsertVariableMenu')?.classList.add('hidden');
  }

  function initNumericInputCursorDialog() {
    const form = document.getElementById('numericInputCursorForm');
    if (!form || form.dataset.nicWired === '1') return;
    form.dataset.nicWired = '1';
    fillNicStaticSelects();
    window.StudioPropsShared?.fillPatternSelect('nicPatternStyle', 'nicFilled');
    form.addEventListener('submit', (e) => saveNumericInputCursor(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyNumericInputCursor')?.addEventListener('click', () => {
      applyNumericInputCursor().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleNumericInputCursorLivePreview();
      window.flushPropsApplyButton?.(readNumericInputCursorForm, 'applyNumericInputCursor');
    });
    form.addEventListener('change', () => {
      syncNumericInputCursorFields();
      scheduleNumericInputCursorLivePreview();
      window.flushPropsApplyButton?.(readNumericInputCursorForm, 'applyNumericInputCursor');
    });
    document.getElementById('cancelNumericInputCursor')?.addEventListener('click', () => {
      document.getElementById('numericInputCursorDialog')?.close();
    });
    document.getElementById('numericInputCursorDialog')?.addEventListener('close', () => {
      if (nicPreviewTimer) {
        clearTimeout(nicPreviewTimer);
        nicPreviewTimer = null;
      }
      hideNicInsertVariableMenu();
      if (!nicDialogCommitted) window.revertPropsDialogPreview?.();
      nicDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpNumericInputCursor')?.addEventListener('click', () => {
      alert('Numeric Input Cursor Point writes Value on entry and displays Indicator. Configure keypad caption, digits, fill, decimal places, timing, and handshake.');
    });
    document.querySelectorAll('#numericInputCursorDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideNicInsertVariableMenu();
        switchCursorTab(tab.dataset.nicTab);
      });
    });
    document.getElementById('nicInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('nicInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('nicInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.nicVar;
      if (!kind) return;
      hideNicInsertVariableMenu();
      if (kind === 'timedate') insertNicCaptionText('{#dt}');
      else insertNicCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#numericInputCursorDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideNicInsertVariableMenu();
    });
    document.getElementById('nicRequireESignature')?.addEventListener('change', syncNicESignatureFields);
    for (const id of ['nicUseVariableMinMax', 'nicDecimalPoint']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncNumericInputCursorFields();
        scheduleNumericInputCursorLivePreview();
      });
    }
    for (const id of ['nicBold', 'nicItalic', 'nicUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleNumericInputCursorLivePreview();
      });
    }
  }
})();
