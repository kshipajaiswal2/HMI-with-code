/** String Input Enable property dialog — FactoryTalk View parity */
(function () {
  let siePreviewTimer = null;
  let sieDialogCommitted = false;

  const SIE_CONTROL_DELAY = [
    [0, '0 msec'], [200, '200 msec'], [400, '400 msec'], [600, '600 msec'], [800, '800 msec'],
    [1000, '1 second'], [2000, '2 seconds'], [3000, '3 seconds'], [4000, '4 seconds'], [5000, '5 seconds']
  ];
  const SIE_HOLD_TIME = [
    [50, '50 msec'], [250, '250 msec'], [500, '500 msec'], [750, '750 msec'],
    [1000, '1 second'], [2000, '2 seconds'], [3000, '3 seconds'], [4000, '4 seconds'], [5000, '5 seconds']
  ];
  const SIE_HANDSHAKE_TIME = [
    [1000, '1 second'], [2000, '2 seconds'], [3000, '3 seconds'], [4000, '4 seconds'], [5000, '5 seconds'],
    [6000, '6 seconds'], [7000, '7 seconds'], [8000, '8 seconds'], [9000, '9 seconds'], [10000, '10 seconds'],
    [15000, '15 seconds'], [20000, '20 seconds'], [25000, '25 seconds'], [30000, '30 seconds'],
    [35000, '35 seconds'], [40000, '40 seconds'], [45000, '45 seconds'], [50000, '50 seconds'],
    [55000, '55 seconds'], [60000, '60 seconds']
  ];

  function switchTab(tabId) {
    document.querySelectorAll('#stringInputDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.sieTab === tabId);
    });
    document.querySelectorAll('#stringInputDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.sieTabPanel === tabId);
    });
  }

  function sieGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function sieSetColor(id, raw) {
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

  function fillSieStaticSelects() {
    const chars = [];
    for (let n = 1; n <= 82; n++) chars.push([n, String(n)]);
    fillSelectOnce('sieNumberOfInputCharacters', 'sieCharsFilled', chars, 8);
    fillSelectOnce('sieEnterKeyControlDelay', 'sieFilled', SIE_CONTROL_DELAY, 400);
    fillSelectOnce('sieEnterKeyHoldTime', 'sieHoldFilled', SIE_HOLD_TIME, 250);
    fillSelectOnce('sieEnterKeyHandshakeTime', 'sieHsFilled', SIE_HANDSHAKE_TIME, 4000);
  }

  function mapSieFillCharacter(raw) {
    const v = String(raw || 'null').toLowerCase();
    if (v === 'space' || v === 'spaces') return 'spaces';
    if (v === 'zero' || v === 'zeros') return 'zeros';
    if (v === 'ff') return 'ff';
    return 'null';
  }

  function mapSieHandshakeReset(raw) {
    const v = String(raw || 'nonZeroValue');
    if (v === 'zeroValue' || v === 'zeroToNonZero') return 'zeroToNonZero';
    return 'nonZeroValue';
  }

  function nextStringInputName(components) {
    const n = (components || []).filter((c) => c.type === 'StringInputEnable').length + 1;
    return `StringInputEnable${n}`;
  }

  function defaultStringInputComponent(overrides = {}) {
    return {
      type: 'StringInputEnable',
      name: 'StringInputEnable1',
      tag: '',
      enterTag: '',
      enterHandshakeTag: '',
      stringPopup: 'keyboard',
      numberOfInputCharacters: 8,
      fillCharacter: 'null',
      maskScratchpad: false,
      enterKeyControlDelay: 400,
      enterKeyHoldTime: 250,
      enterKeyHandshakeTime: 4000,
      handshakeResetType: 'nonZeroValue',
      caption: '',
      label: '',
      left: 16,
      top: 16,
      width: 160,
      height: 120,
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
      usePatternColor: true,
      patternColor: '#ffffff',
      useHighlightColor: true,
      highlightColor: '#0066cc',
      blink: false,
      horizontalMargin: 0,
      verticalMargin: 0,
      audio: true,
      keyNavigation: false,
      takeFocusOnPress: false,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      alignment: 'middleLeft',
      wordWrap: true,
      useCaptionColor: false,
      captionColor: '#ffffff',
      captionBackStyle: 'transparent',
      useCaptionBackColor: false,
      captionBackColor: '#001C38',
      captionBlink: false,
      image: '',
      imageBackStyle: 'transparent',
      imageAlignment: 'middleLeft',
      useImageColor: false,
      imageColor: '#ffffff',
      useImageBackColor: false,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: false,
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

  function scheduleStringInputLivePreview() {
    if (window.state?.propsFormFill) return;
    if (siePreviewTimer) clearTimeout(siePreviewTimer);
    siePreviewTimer = setTimeout(() => {
      siePreviewTimer = null;
      if (!document.getElementById('stringInputDialog')?.open) return;
      const comp = readStringInputForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readStringInputForm, 'applyStringInput');
    }, 80);
  }

  function syncSieESignatureFields() {
    const on = Boolean(document.getElementById('sieRequireESignature')?.checked);
    for (const id of [
      'sieAllowBlankComment', 'sieRequireReauth', 'sieRequireCounterSig', 'sieAuthorizedGroup',
      'sieDomainVisible', 'sieDomainNameMode', 'sieDomainVariableMode', 'sieDomainName',
      'sieDomainVariable', 'sieDomainBrowse', 'sieDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
  }

  function syncStringInputFields() {
    const capColor = document.getElementById('sieCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('sieUseCaptionColor')?.checked;
    const capBack = document.getElementById('sieCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('sieUseCaptionBackColor')?.checked
      || document.getElementById('sieCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('sieImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('sieUseImageColor')?.checked;
    const imgBack = document.getElementById('sieImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('sieUseImageBackColor')?.checked
      || document.getElementById('sieImageBackStyle')?.value !== 'solid';
    syncSieESignatureFields();
  }

  function wireStringInputTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('stringInputDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('siePatternStyle', 'sieFilled');
    document.querySelectorAll('#stringInputForm .ft-color-input').forEach((input) => {
      if (input.dataset.siePreviewWired === '1') return;
      input.dataset.siePreviewWired = '1';
      input.addEventListener('input', scheduleStringInputLivePreview);
      input.addEventListener('change', scheduleStringInputLivePreview);
    });
    syncStringInputFields();
  }

  function presentStringInputDialog() {
    const dialog = document.getElementById('stringInputDialog');
    if (!dialog) {
      window.setStatus('String Input Enable Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    sieDialogCommitted = false;
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
        window.setStatus(`Opened String Input Enable properties without modal: ${err2.message}`);
      }
    }
  }

  function fillStringInputForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillSieStaticSelects();
      window.StudioPropsShared?.fillPatternSelect('siePatternStyle', 'sieFilled');
      document.getElementById('sieBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('sieBorderWidth').value = comp.borderWidth ?? 4;
      document.getElementById('sieBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('siePatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('sieShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('sieBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      sieSetColor('sieBackColor', comp.backColor || '#001C38');
      sieSetColor('sieBorderColor', comp.borderColor || '#001C38');
      sieSetColor('siePatternColor', comp.patternColor || '#ffffff');
      sieSetColor('sieHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('sieBlink').checked = Boolean(comp.blink);
      document.getElementById('sieHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('sieVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('sieAudio').checked = comp.audio !== false;
      document.getElementById('sieKeyNavigation').checked = Boolean(comp.keyNavigation);
      document.getElementById('sieTakeFocusOnPress').checked = Boolean(comp.takeFocusOnPress);
      document.getElementById('sieCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('sieFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('sieFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('sieBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('sieItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('sieUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('sieUseCaptionColor').checked = Boolean(comp.useCaptionColor);
      sieSetColor('sieCaptionColor', comp.captionColor || '#ffffff');
      document.getElementById('sieUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      sieSetColor('sieCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('sieCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('sieWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('sieCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#stringInputForm input[name="sieAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleLeft');
      });
      const img = document.getElementById('sieImage');
      if (img) img.value = comp.image || '';
      const imgBackStyle = document.getElementById('sieImageBackStyle');
      if (imgBackStyle) imgBackStyle.value = comp.imageBackStyle || 'transparent';
      document.getElementById('sieUseImageColor').checked = Boolean(comp.useImageColor);
      sieSetColor('sieImageColor', comp.imageColor || '#ffffff');
      document.getElementById('sieUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      sieSetColor('sieImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('sieImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('sieImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#stringInputForm input[name="sieImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleLeft');
      });
      document.getElementById('sieStringPopup').value = comp.stringPopup || 'keyboard';
      document.getElementById('sieNumberOfInputCharacters').value = String(comp.numberOfInputCharacters ?? 8);
      document.getElementById('sieFillCharacter').value = mapSieFillCharacter(comp.fillCharacter);
      document.getElementById('sieMaskScratchpad').checked = Boolean(comp.maskScratchpad);
      document.getElementById('sieEnterKeyControlDelay').value = String(comp.enterKeyControlDelay ?? 400);
      document.getElementById('sieEnterKeyHoldTime').value = String(comp.enterKeyHoldTime ?? 250);
      document.getElementById('sieEnterKeyHandshakeTime').value = String(comp.enterKeyHandshakeTime ?? 4000);
      document.getElementById('sieHandshakeResetType').value = mapSieHandshakeReset(comp.handshakeResetType);
      document.getElementById('sieRequireESignature').checked = Boolean(comp.requireESignature);
      document.getElementById('sieAllowBlankComment').checked = Boolean(comp.allowBlankComment);
      document.getElementById('sieRequireReauth').checked = Boolean(comp.requireReauth);
      document.getElementById('sieRequireCounterSig').checked = Boolean(comp.requireCounterSig);
      document.getElementById('sieAuthorizedGroup').value = comp.authorizedGroup || 'Administrators';
      document.getElementById('sieDomainVisible').checked = Boolean(comp.domainVisible);
      const domainMode = comp.domainMode === 'variable' ? 'variable' : 'name';
      document.getElementById('sieDomainNameMode').checked = domainMode === 'name';
      document.getElementById('sieDomainVariableMode').checked = domainMode === 'variable';
      document.getElementById('sieDomainName').value = comp.domainName || '';
      document.getElementById('sieDomainVariable').value = comp.domainVariable || '';
      document.getElementById('sieDomainDisable').checked = Boolean(comp.domainDisable);
      document.getElementById('sieHeight').value = comp.height ?? 120;
      document.getElementById('sieWidth').value = comp.width ?? 160;
      document.getElementById('sieTop').value = comp.top ?? 16;
      document.getElementById('sieLeft').value = comp.left ?? 16;
      document.getElementById('sieName').value = comp.name || 'StringInputEnable1';
      document.getElementById('sieVisible').checked = comp.visible !== false;
      document.getElementById('sieTag').value = comp.tag || '';
      document.getElementById('sieEnterTag').value = comp.enterTag || '';
      document.getElementById('sieEnterHandshakeTag').value = comp.enterHandshakeTag || '';
      syncStringInputFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readStringInputForm() {
    const caption = document.getElementById('sieCaption')?.value || '';
    return {
      type: 'StringInputEnable',
      name: document.getElementById('sieName')?.value.trim() || 'StringInputEnable1',
      tag: document.getElementById('sieTag')?.value.trim() || '',
      enterTag: document.getElementById('sieEnterTag')?.value.trim() || '',
      enterHandshakeTag: document.getElementById('sieEnterHandshakeTag')?.value.trim() || '',
      stringPopup: document.getElementById('sieStringPopup')?.value || 'keyboard',
      numberOfInputCharacters: Number(document.getElementById('sieNumberOfInputCharacters')?.value) || 8,
      fillCharacter: mapSieFillCharacter(document.getElementById('sieFillCharacter')?.value),
      maskScratchpad: Boolean(document.getElementById('sieMaskScratchpad')?.checked),
      enterKeyControlDelay: Number(document.getElementById('sieEnterKeyControlDelay')?.value) || 400,
      enterKeyHoldTime: Number(document.getElementById('sieEnterKeyHoldTime')?.value) || 250,
      enterKeyHandshakeTime: Number(document.getElementById('sieEnterKeyHandshakeTime')?.value) || 4000,
      handshakeResetType: mapSieHandshakeReset(document.getElementById('sieHandshakeResetType')?.value),
      caption,
      label: caption,
      left: Number(document.getElementById('sieLeft')?.value) || 0,
      top: Number(document.getElementById('sieTop')?.value) || 0,
      width: Number(document.getElementById('sieWidth')?.value) || 160,
      height: Number(document.getElementById('sieHeight')?.value) || 120,
      visible: document.getElementById('sieVisible')?.checked !== false,
      borderStyle: document.getElementById('sieBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('sieBorderWidth')?.value) || 4,
      borderUsesBackColor: document.getElementById('sieBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('sieBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('siePatternStyle')?.value || 'none',
      shape: document.getElementById('sieShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: sieGetColor('sieBackColor'),
      useBorderColor: true,
      borderColor: sieGetColor('sieBorderColor'),
      usePatternColor: true,
      patternColor: sieGetColor('siePatternColor'),
      useHighlightColor: true,
      highlightColor: sieGetColor('sieHighlightColor'),
      blink: Boolean(document.getElementById('sieBlink')?.checked),
      horizontalMargin: Number(document.getElementById('sieHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('sieVerticalMargin')?.value) || 0,
      audio: document.getElementById('sieAudio')?.checked !== false,
      keyNavigation: Boolean(document.getElementById('sieKeyNavigation')?.checked),
      takeFocusOnPress: Boolean(document.getElementById('sieTakeFocusOnPress')?.checked),
      fontFamily: document.getElementById('sieFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('sieFontSize')?.value) || 10,
      bold: document.getElementById('sieBold')?.classList.contains('active'),
      italic: document.getElementById('sieItalic')?.classList.contains('active'),
      underline: document.getElementById('sieUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('sieUseCaptionColor')?.checked),
      captionColor: sieGetColor('sieCaptionColor'),
      useCaptionBackColor: Boolean(document.getElementById('sieUseCaptionBackColor')?.checked),
      captionBackColor: sieGetColor('sieCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('sieCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('sieCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('sieWordWrap')?.checked !== false,
      alignment: document.querySelector('#stringInputForm input[name="sieAlign"]:checked')?.value || 'middleLeft',
      image: document.getElementById('sieImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('sieImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#stringInputForm input[name="sieImageAlign"]:checked')?.value || 'middleLeft',
      useImageColor: Boolean(document.getElementById('sieUseImageColor')?.checked),
      imageColor: sieGetColor('sieImageColor'),
      useImageBackColor: Boolean(document.getElementById('sieUseImageBackColor')?.checked),
      imageBackColor: sieGetColor('sieImageBackColor'),
      imageBlink: Boolean(document.getElementById('sieImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('sieImageScaled')?.checked),
      requireESignature: Boolean(document.getElementById('sieRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('sieAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('sieRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('sieRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('sieAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('sieDomainVisible')?.checked),
      domainMode: document.getElementById('sieDomainVariableMode')?.checked ? 'variable' : 'name',
      domainName: document.getElementById('sieDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('sieDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('sieDomainDisable')?.checked)
    };
  }

  async function showStringInputDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the String Input Enable');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initStringInputDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultStringInputComponent({
        name: nextStringInputName(canvas?.components),
        ...overrides
      });
      fillStringInputForm(comp);
      window.resetPropsDialogState('string-input', readStringInputForm, 'applyStringInput');
      switchTab('general');
      wireStringInputTools();
      presentStringInputDialog();
      const previewComp = readStringInputForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readStringInputForm, 'applyStringInput');
    } catch (err) {
      window.setStatus(`String Input Enable properties error: ${err.message}`);
    }
  }

  async function applyStringInput() {
    const comp = readStringInputForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readStringInputForm, 'applyStringInput');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveStringInput(e) {
    e.preventDefault();
    const comp = readStringInputForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    sieDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('stringInputDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertSieCaptionText(text) {
    const area = document.getElementById('sieCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleStringInputLivePreview();
  }

  function insertSieCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertSieCaptionText(tag);
    });
  }

  function hideSieInsertVariableMenu() {
    document.getElementById('sieInsertVariableMenu')?.classList.add('hidden');
  }

  function initStringInputDialog() {
    const form = document.getElementById('stringInputForm');
    if (!form || form.dataset.sieWired === '1') return;
    form.dataset.sieWired = '1';
    fillSieStaticSelects();
    window.StudioPropsShared?.fillPatternSelect('siePatternStyle', 'sieFilled');
    form.addEventListener('submit', (e) => saveStringInput(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyStringInput')?.addEventListener('click', () => {
      applyStringInput().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleStringInputLivePreview();
      window.flushPropsApplyButton?.(readStringInputForm, 'applyStringInput');
    });
    form.addEventListener('change', () => {
      syncStringInputFields();
      scheduleStringInputLivePreview();
      window.flushPropsApplyButton?.(readStringInputForm, 'applyStringInput');
    });
    document.getElementById('cancelStringInput')?.addEventListener('click', () => {
      document.getElementById('stringInputDialog')?.close();
    });
    document.getElementById('stringInputDialog')?.addEventListener('close', () => {
      if (siePreviewTimer) {
        clearTimeout(siePreviewTimer);
        siePreviewTimer = null;
      }
      hideSieInsertVariableMenu();
      if (!sieDialogCommitted) window.revertPropsDialogPreview?.();
      sieDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpStringInput')?.addEventListener('click', () => {
      alert('String Input Enable writes a string value tag when the operator enters text. Configure character limits, timing, handshake, and connections. A Value tag is optional until runtime.');
    });
    document.querySelectorAll('#stringInputDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideSieInsertVariableMenu();
        switchTab(tab.dataset.sieTab);
      });
    });
    document.getElementById('sieBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('sieImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('sieImage').value = fileName;
          scheduleStringInputLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('sieInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('sieInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('sieInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.sieVar;
      if (!kind) return;
      hideSieInsertVariableMenu();
      if (kind === 'timedate') insertSieCaptionText('{#dt}');
      else insertSieCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#stringInputDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideSieInsertVariableMenu();
    });
    document.getElementById('sieRequireESignature')?.addEventListener('change', syncSieESignatureFields);
    document.getElementById('sieDomainBrowse')?.addEventListener('click', () => {
      window.StudioTagTools?.openTagBrowser(null, (sel) => {
        const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
        if (!tag) return;
        document.getElementById('sieDomainVariable').value = tag;
        document.getElementById('sieDomainVariableMode').checked = true;
        document.getElementById('sieDomainNameMode').checked = false;
        scheduleStringInputLivePreview();
      });
    });
    document.getElementById('sieShape')?.addEventListener('change', () => {
      if (document.getElementById('sieShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('sieWidth')?.value) || 0;
      const h = Number(document.getElementById('sieHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('sieWidth').value = String(size);
      document.getElementById('sieHeight').value = String(size);
    });
    for (const id of [
      'sieUseCaptionColor', 'sieUseCaptionBackColor', 'sieUseImageColor', 'sieUseImageBackColor',
      'sieCaptionBackStyle', 'sieImageBackStyle'
    ]) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncStringInputFields();
        scheduleStringInputLivePreview();
      });
    }
    for (const id of ['sieBold', 'sieItalic', 'sieUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleStringInputLivePreview();
      });
    }
  }

  window.StudioStringInput = {
    initStringInputDialog,
    presentStringInputDialog,
    scheduleStringInputLivePreview,
    showStringInputDialog,
    fillStringInputForm,
    readStringInputForm,
    switchStringInputTab: switchTab,
    wireStringInputTools
  };
})();
