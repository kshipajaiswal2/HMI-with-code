/** Latched and Multistate push button property dialogs + helpers */
(function () {
  let latStatesDraft = null;
  let latActiveStateId = 'State0';
  let latStateClipboard = null;

  let msStatesDraft = null;
  let msActiveStateId = 'State0';
  let msStateClipboard = null;

  let ilkStatesDraft = null;
  let ilkActiveStateId = 'State0';
  let ilkStateClipboard = null;

  function cloneStates(states) {
    return (states || []).map((s) => ({ ...s }));
  }

  function defaultMultistateButtonStates(count = 2, caption = '') {
    const n = Math.max(2, Number(count) || 2);
    const states = [];
    for (let i = 0; i < n; i++) {
      states.push(defaultMsState(`State${i}`, { value: i, caption: i === 0 ? caption : '' }));
    }
    states.push(defaultMsState('Error', { caption: 'Error' }));
    return states;
  }

  function countUserStates(states) {
    return (states || []).filter((s) => s.id !== 'Error').length;
  }

  function wirePushButtonTools(dialogId, syncFn) {
    const dialog = document.getElementById(dialogId);
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(dialog);
    syncFn?.();
  }

  function switchTab(dialogId, tabAttr, panelAttr, tabId) {
    document.querySelectorAll(`#${dialogId} .dialog-tab`).forEach((el) => {
      el.classList.toggle('active', el.dataset[tabAttr] === tabId);
    });
    document.querySelectorAll(`#${dialogId} .dialog-tab-panel`).forEach((el) => {
      el.classList.toggle('active', el.dataset[panelAttr] === tabId);
    });
  }

  // ─── Latched ───────────────────────────────────────────────────────────────

  let latPreviewTimer = null;
  let latDialogCommitted = false;

  function latGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function latSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextLatchedButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'LatchedButton').length + 1;
    return `LatchedPushButton${n}`;
  }

  function defaultLatchedState(id, extras = {}) {
    const isError = id === 'Error';
    return {
      id,
      backColor: isError ? 'navy' : '#001C38',
      borderColor: isError ? 'navy' : '#001C38',
      useBackColor: true,
      useBorderColor: true,
      blink: isError,
      patternStyle: 'none',
      usePatternColor: false,
      patternColor: '#ffffff',
      caption: isError ? 'Error' : '',
      captionColor: '#ffffff',
      useCaptionColor: isError,
      captionBackColor: '#001C38',
      useCaptionBackColor: true,
      captionBlink: false,
      captionBackStyle: 'transparent',
      wordWrap: true,
      alignment: 'middleCenter',
      image: '',
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      useImageColor: false,
      imageColor: '#001C38',
      useImageBackColor: true,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: false,
      ...extras
    };
  }

  function defaultLatchedButtonStates(caption = '') {
    return [
      defaultLatchedState('State0', { value: 0, caption }),
      defaultLatchedState('State1', { value: 1, caption }),
      defaultLatchedState('Error', { caption: 'Error' })
    ];
  }

  function defaultLatchedButtonComponent(overrides = {}) {
    const caption = overrides.caption || overrides.label || '';
    return {
      type: 'LatchedButton',
      name: 'LatchedPushButton1',
      tag: '',
      indicatorTag: '',
      handshakeTag: '',
      latchResetType: 'nonZeroValue',
      latchValue: 1,
      caption,
      label: caption,
      left: 16,
      top: 79,
      width: 147,
      height: 38,
      visible: true,
      borderStyle: 'line',
      borderWidth: 1,
      borderUsesBackColor: true,
      backStyle: 'solid',
      shape: 'rectangle',
      useHighlightColor: true,
      highlightColor: '#0066cc',
      buttonType: 'latched',
      touch: true,
      audio: true,
      horizontalMargin: 0,
      verticalMargin: 0,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      keyAssignment: 'None',
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
      states: defaultLatchedButtonStates(caption),
      ...overrides
    };
  }

  function scheduleLatchedLivePreview() {
    if (window.state?.propsFormFill) return;
    if (latPreviewTimer) clearTimeout(latPreviewTimer);
    latPreviewTimer = setTimeout(() => {
      latPreviewTimer = null;
      const comp = readLatchedButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readLatchedButtonForm, 'applyLatchedButton');
    }, 80);
  }

  function wireLatchedButtonDialogTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('latchedButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    document.querySelectorAll('#latchedButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.latPreviewWired === '1') return;
      input.dataset.latPreviewWired = '1';
      input.addEventListener('input', scheduleLatchedLivePreview);
      input.addEventListener('change', scheduleLatchedLivePreview);
    });
    syncLatchedGeneralFields();
  }

  function presentLatchedButtonDialog() {
    const dialog = document.getElementById('latchedButtonDialog');
    if (!dialog) {
      window.setStatus('Latched Push Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    latDialogCommitted = false;
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
        window.setStatus(`Opened Latched properties without modal: ${err2.message}`);
      }
    }
  }

  function syncLatchedESignatureFields() {
    const on = Boolean(document.getElementById('latRequireESignature')?.checked);
    for (const id of [
      'latAllowBlankComment', 'latRequireReauth', 'latRequireCounterSig', 'latAuthorizedGroup',
      'latDomainVisible', 'latDomainNameMode', 'latDomainVariableMode', 'latDomainName',
      'latDomainVariable', 'latDomainBrowse', 'latDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
  }

  function syncLatchedGeneralFields() {
    const capColor = document.getElementById('latStateCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('latStateUseCaptionColor')?.checked;
    const capBack = document.getElementById('latStateCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('latStateUseCaptionBackColor')?.checked
      || document.getElementById('latCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('latStateImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('latStateUseImageColor')?.checked;
    const imgBack = document.getElementById('latStateImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('latStateUseImageBackColor')?.checked
      || document.getElementById('latImageBackStyle')?.value !== 'solid';
    const pat = document.getElementById('latStatePatternColor');
    if (pat) pat.disabled = !document.getElementById('latStateUsePatternColor')?.checked;
    const showValue = latActiveStateId === 'State0' || latActiveStateId === 'State1';
    document.getElementById('latStateValueRow')?.classList.toggle('hidden', !showValue);
    syncLatchedESignatureFields();
  }

  function saveLatStateToDraft() {
    if (!latStatesDraft) return;
    const id = latActiveStateId;
    const idx = latStatesDraft.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const alignment = document.querySelector('#latchedButtonForm input[name="latStateAlign"]:checked')?.value || 'middleCenter';
    const imageAlignment = document.querySelector('#latchedButtonForm input[name="latImageAlign"]:checked')?.value || 'middleCenter';
    const next = {
      ...latStatesDraft[idx],
      backColor: latGetColor('latStateBackColor'),
      borderColor: latGetColor('latStateBorderColor'),
      useBackColor: true,
      useBorderColor: true,
      blink: Boolean(document.getElementById('latStateBlink')?.checked),
      patternStyle: document.getElementById('latStatePatternStyle')?.value || 'none',
      usePatternColor: Boolean(document.getElementById('latStateUsePatternColor')?.checked),
      patternColor: latGetColor('latStatePatternColor'),
      caption: document.getElementById('latStateCaption')?.value ?? '',
      captionColor: latGetColor('latStateCaptionColor'),
      useCaptionColor: Boolean(document.getElementById('latStateUseCaptionColor')?.checked),
      captionBackColor: latGetColor('latStateCaptionBackColor'),
      useCaptionBackColor: Boolean(document.getElementById('latStateUseCaptionBackColor')?.checked),
      captionBlink: Boolean(document.getElementById('latStateCaptionBlink')?.checked),
      wordWrap: document.getElementById('latStateWordWrap')?.checked !== false,
      alignment,
      captionBackStyle: document.getElementById('latCaptionBackStyle')?.value || 'transparent',
      image: document.getElementById('latStateImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('latImageBackStyle')?.value || 'transparent',
      useImageColor: Boolean(document.getElementById('latStateUseImageColor')?.checked),
      imageColor: latGetColor('latStateImageColor'),
      useImageBackColor: Boolean(document.getElementById('latStateUseImageBackColor')?.checked),
      imageBackColor: latGetColor('latStateImageBackColor'),
      imageBlink: Boolean(document.getElementById('latStateImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('latStateImageScaled')?.checked),
      imageAlignment
    };
    if (id === 'State0' || id === 'State1') {
      next.value = Number(document.getElementById('latStateValue')?.value);
    }
    latStatesDraft[idx] = next;
  }

  function loadLatStateFromDraft(stateId) {
    latActiveStateId = stateId;
    const fallback = defaultLatchedState(stateId);
    const state = { ...fallback, ...(latStatesDraft?.find((s) => s.id === stateId) || {}) };
    const select = document.getElementById('latStateSelect');
    if (select) select.value = stateId;
    const valueEl = document.getElementById('latStateValue');
    if (valueEl) valueEl.value = String(state.value ?? (stateId === 'State1' ? 1 : 0));
    latSetColor('latStateBackColor', state.backColor || '#001C38');
    latSetColor('latStateBorderColor', state.borderColor || '#001C38');
    const blink = document.getElementById('latStateBlink');
    if (blink) blink.checked = Boolean(state.blink);
    window.StudioPropsShared?.fillPatternSelect('latStatePatternStyle', 'latFilled');
    const pat = document.getElementById('latStatePatternStyle');
    if (pat) pat.value = state.patternStyle || 'none';
    const usePat = document.getElementById('latStateUsePatternColor');
    if (usePat) usePat.checked = Boolean(state.usePatternColor);
    latSetColor('latStatePatternColor', state.patternColor || '#ffffff');
    const caption = document.getElementById('latStateCaption');
    if (caption) caption.value = state.caption ?? '';
    const useCap = document.getElementById('latStateUseCaptionColor');
    if (useCap) useCap.checked = Boolean(state.useCaptionColor);
    latSetColor('latStateCaptionColor', state.captionColor || '#ffffff');
    const useCapBack = document.getElementById('latStateUseCaptionBackColor');
    if (useCapBack) useCapBack.checked = state.useCaptionBackColor !== false;
    latSetColor('latStateCaptionBackColor', state.captionBackColor || '#001C38');
    const capBlink = document.getElementById('latStateCaptionBlink');
    if (capBlink) capBlink.checked = Boolean(state.captionBlink);
    const wrap = document.getElementById('latStateWordWrap');
    if (wrap) wrap.checked = state.wordWrap !== false;
    const capBackStyle = document.getElementById('latCaptionBackStyle');
    if (capBackStyle) capBackStyle.value = state.captionBackStyle || 'transparent';
    document.querySelectorAll('#latchedButtonForm input[name="latStateAlign"]').forEach((el) => {
      el.checked = el.value === (state.alignment || 'middleCenter');
    });
    const img = document.getElementById('latStateImage');
    if (img) img.value = state.image || '';
    const imgBackStyle = document.getElementById('latImageBackStyle');
    if (imgBackStyle) imgBackStyle.value = state.imageBackStyle || 'transparent';
    const useImgColor = document.getElementById('latStateUseImageColor');
    if (useImgColor) useImgColor.checked = Boolean(state.useImageColor);
    latSetColor('latStateImageColor', state.imageColor || '#001C38');
    const useImgBack = document.getElementById('latStateUseImageBackColor');
    if (useImgBack) useImgBack.checked = state.useImageBackColor !== false;
    latSetColor('latStateImageBackColor', state.imageBackColor || '#001C38');
    const imgBlink = document.getElementById('latStateImageBlink');
    if (imgBlink) imgBlink.checked = Boolean(state.imageBlink);
    const imgScaled = document.getElementById('latStateImageScaled');
    if (imgScaled) imgScaled.checked = Boolean(state.imageScaled);
    document.querySelectorAll('#latchedButtonForm input[name="latImageAlign"]').forEach((el) => {
      el.checked = el.value === (state.imageAlignment || 'middleCenter');
    });
    syncLatchedGeneralFields();
  }

  function switchLatState(stateId) {
    saveLatStateToDraft();
    loadLatStateFromDraft(stateId);
  }

  function fillLatchedButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      latStatesDraft = cloneStates(comp.states?.length ? comp.states : defaultLatchedButtonStates(comp.caption ?? comp.label));
      latActiveStateId = 'State0';
      latStateClipboard = null;
      const pasteBtn = document.getElementById('latStatePaste');
      if (pasteBtn) pasteBtn.disabled = true;

      document.getElementById('latBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('latBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('latBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      document.getElementById('latBackStyle').value = comp.backStyle || 'solid';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      document.getElementById('latShape').value = shape;
      latSetColor('latHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('latLatchResetType').value = comp.latchResetType || 'nonZeroValue';
      document.getElementById('latHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('latVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('latAudio').checked = comp.audio !== false;
      document.getElementById('latFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('latFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('latBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('latItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('latUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('latHeight').value = comp.height ?? 38;
      document.getElementById('latWidth').value = comp.width ?? 147;
      document.getElementById('latTop').value = comp.top ?? 79;
      document.getElementById('latLeft').value = comp.left ?? 16;
      document.getElementById('latName').value = comp.name || 'LatchedPushButton1';
      document.getElementById('latVisible').checked = comp.visible !== false;
      document.getElementById('latTag').value = comp.tag || '';
      document.getElementById('latIndicatorTag').value = comp.indicatorTag || '';
      document.getElementById('latHandshakeTag').value = comp.handshakeTag || '';
      const reqSig = document.getElementById('latRequireESignature');
      if (reqSig) reqSig.checked = Boolean(comp.requireESignature);
      const allowBlank = document.getElementById('latAllowBlankComment');
      if (allowBlank) allowBlank.checked = Boolean(comp.allowBlankComment);
      const reauth = document.getElementById('latRequireReauth');
      if (reauth) reauth.checked = Boolean(comp.requireReauth);
      const counter = document.getElementById('latRequireCounterSig');
      if (counter) counter.checked = Boolean(comp.requireCounterSig);
      const group = document.getElementById('latAuthorizedGroup');
      if (group) group.value = comp.authorizedGroup || 'Administrators';
      const domainVisible = document.getElementById('latDomainVisible');
      if (domainVisible) domainVisible.checked = Boolean(comp.domainVisible);
      const domainNameMode = document.getElementById('latDomainNameMode');
      const domainVarMode = document.getElementById('latDomainVariableMode');
      if (domainNameMode) domainNameMode.checked = (comp.domainMode || 'name') !== 'variable';
      if (domainVarMode) domainVarMode.checked = (comp.domainMode || 'name') === 'variable';
      const domainName = document.getElementById('latDomainName');
      if (domainName) domainName.value = comp.domainName || '';
      const domainVar = document.getElementById('latDomainVariable');
      if (domainVar) domainVar.value = comp.domainVariable || '';
      const domainDisable = document.getElementById('latDomainDisable');
      if (domainDisable) domainDisable.checked = Boolean(comp.domainDisable);
      window.StudioPropsShared?.fillPatternSelect('latStatePatternStyle', 'latFilled');
      loadLatStateFromDraft('State0');
      syncLatchedGeneralFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readLatchedButtonForm() {
    saveLatStateToDraft();
    const state0 = latStatesDraft?.find((s) => s.id === 'State0');
    const state1 = latStatesDraft?.find((s) => s.id === 'State1');
    const caption = state0?.caption ?? '';
    return {
      type: 'LatchedButton',
      name: document.getElementById('latName')?.value.trim() || 'LatchedPushButton1',
      tag: document.getElementById('latTag')?.value.trim() || '',
      indicatorTag: document.getElementById('latIndicatorTag')?.value.trim() || '',
      handshakeTag: document.getElementById('latHandshakeTag')?.value.trim() || '',
      latchResetType: document.getElementById('latLatchResetType')?.value || 'nonZeroValue',
      latchValue: state1?.value ?? 1,
      caption,
      label: caption,
      left: Number(document.getElementById('latLeft')?.value) || 0,
      top: Number(document.getElementById('latTop')?.value) || 0,
      width: Number(document.getElementById('latWidth')?.value) || 147,
      height: Number(document.getElementById('latHeight')?.value) || 38,
      visible: document.getElementById('latVisible')?.checked !== false,
      borderStyle: document.getElementById('latBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('latBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('latBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('latBackStyle')?.value || 'solid',
      shape: document.getElementById('latShape')?.value || 'rectangle',
      useHighlightColor: true,
      highlightColor: latGetColor('latHighlightColor'),
      buttonType: 'latched',
      touch: true,
      audio: document.getElementById('latAudio')?.checked !== false,
      horizontalMargin: Number(document.getElementById('latHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('latVerticalMargin')?.value) || 0,
      fontFamily: document.getElementById('latFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('latFontSize')?.value) || 10,
      bold: document.getElementById('latBold')?.classList.contains('active'),
      italic: document.getElementById('latItalic')?.classList.contains('active'),
      underline: document.getElementById('latUnderline')?.classList.contains('active'),
      keyAssignment: 'None',
      requireESignature: Boolean(document.getElementById('latRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('latAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('latRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('latRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('latAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('latDomainVisible')?.checked),
      domainMode: document.querySelector('#latchedButtonForm input[name="latDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('latDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('latDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('latDomainDisable')?.checked),
      previewStateId: latActiveStateId,
      states: cloneStates(latStatesDraft)
    };
  }

  async function showLatchedButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Latched button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initLatchedButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultLatchedButtonComponent({
        name: nextLatchedButtonName(canvas?.components),
        ...overrides
      });
      fillLatchedButtonForm(comp);
      window.resetPropsDialogState('latched', readLatchedButtonForm, 'applyLatchedButton');
      switchTab('latchedButtonDialog', 'latTab', 'latTabPanel', 'general');
      wireLatchedButtonDialogTools();
      presentLatchedButtonDialog();
      const previewComp = readLatchedButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readLatchedButtonForm, 'applyLatchedButton');
    } catch (err) {
      window.setStatus(`Latched properties error: ${err.message}`);
    }
  }

  async function applyLatchedButton() {
    const comp = readLatchedButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readLatchedButtonForm, 'applyLatchedButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveLatchedButton(e) {
    e.preventDefault();
    const comp = readLatchedButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    latDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('latchedButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function initLatchedButtonDialog() {
    const form = document.getElementById('latchedButtonForm');
    if (!form || form.dataset.latWired === '1') return;
    form.dataset.latWired = '1';
    window.StudioPropsShared?.fillPatternSelect('latStatePatternStyle', 'latFilled');
    form.addEventListener('submit', (e) => saveLatchedButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyLatchedButton')?.addEventListener('click', () => {
      applyLatchedButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleLatchedLivePreview();
      window.flushPropsApplyButton?.(readLatchedButtonForm, 'applyLatchedButton');
    });
    form.addEventListener('change', () => {
      syncLatchedGeneralFields();
      scheduleLatchedLivePreview();
      window.flushPropsApplyButton?.(readLatchedButtonForm, 'applyLatchedButton');
    });
    document.getElementById('cancelLatchedButton')?.addEventListener('click', () => {
      document.getElementById('latchedButtonDialog')?.close();
    });
    document.getElementById('latchedButtonDialog')?.addEventListener('close', () => {
      if (!latDialogCommitted) window.revertPropsDialogPreview?.();
      latDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpLatchedButton')?.addEventListener('click', () => {
      alert('Latched Push Button writes the State1 value on click and stays latched until Handshake or Indicator resets according to Latch reset type (Non-zero Value or Zero Value).');
    });
    document.querySelectorAll('#latchedButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab('latchedButtonDialog', 'latTab', 'latTabPanel', tab.dataset.latTab));
    });
    document.getElementById('latStateSelect')?.addEventListener('change', (e) => {
      switchLatState(e.target.value);
      scheduleLatchedLivePreview();
    });
    document.getElementById('latStateCopy')?.addEventListener('click', () => {
      saveLatStateToDraft();
      const state = latStatesDraft?.find((s) => s.id === latActiveStateId);
      if (state) {
        latStateClipboard = { ...state };
        const pasteBtn = document.getElementById('latStatePaste');
        if (pasteBtn) pasteBtn.disabled = false;
      }
    });
    document.getElementById('latStatePaste')?.addEventListener('click', () => {
      if (!latStateClipboard || !latStatesDraft) return;
      saveLatStateToDraft();
      const idx = latStatesDraft.findIndex((s) => s.id === latActiveStateId);
      if (idx < 0) return;
      const keep = { id: latStatesDraft[idx].id, value: latStatesDraft[idx].value };
      latStatesDraft[idx] = { ...latStateClipboard, ...keep };
      loadLatStateFromDraft(latActiveStateId);
      scheduleLatchedLivePreview();
    });
    document.getElementById('latBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('latStateImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('latStateImage').value = fileName;
          scheduleLatchedLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('latInsertVariable')?.addEventListener('click', () => {
      window.StudioTagTools?.openTagBrowser(null, (sel) => {
        const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
        const area = document.getElementById('latStateCaption');
        if (!area || !tag) return;
        const start = area.selectionStart ?? area.value.length;
        const end = area.selectionEnd ?? start;
        area.value = area.value.slice(0, start) + tag + area.value.slice(end);
        area.focus();
        scheduleLatchedLivePreview();
      });
    });
    document.getElementById('latRequireESignature')?.addEventListener('change', syncLatchedESignatureFields);
    document.getElementById('latShape')?.addEventListener('change', () => {
      if (document.getElementById('latShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('latWidth')?.value) || 0;
      const h = Number(document.getElementById('latHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('latWidth').value = String(size);
      document.getElementById('latHeight').value = String(size);
    });
    for (const id of [
      'latStateUsePatternColor', 'latStateUseCaptionColor', 'latStateUseCaptionBackColor',
      'latStateUseImageColor', 'latStateUseImageBackColor', 'latCaptionBackStyle', 'latImageBackStyle'
    ]) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncLatchedGeneralFields();
        scheduleLatchedLivePreview();
      });
    }
    for (const id of ['latBold', 'latItalic', 'latUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleLatchedLivePreview();
      });
    }
  }

  // ─── Multistate ────────────────────────────────────────────────────────────

  const MS_MAX_STATES = 255;
  let msPreviewTimer = null;
  let msDialogCommitted = false;

  function msGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function msSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextMultistateButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'MultistateButton').length + 1;
    return `MultistatePushButton${n}`;
  }

  function defaultMsState(id, extras = {}) {
    const isError = id === 'Error';
    return {
      id,
      backColor: isError ? 'navy' : '#001C38',
      borderColor: isError ? 'navy' : '#001C38',
      useBackColor: true,
      useBorderColor: true,
      blink: isError,
      patternStyle: 'none',
      usePatternColor: false,
      patternColor: '#ffffff',
      caption: isError ? 'Error' : '',
      captionColor: '#ffffff',
      useCaptionColor: isError,
      captionBackColor: '#001C38',
      useCaptionBackColor: true,
      captionBlink: false,
      captionBackStyle: 'transparent',
      wordWrap: true,
      alignment: 'middleCenter',
      image: '',
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      useImageColor: false,
      imageColor: '#001C38',
      useImageBackColor: false,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: false,
      ...extras
    };
  }

  function defaultMultistateButtonComponent(overrides = {}) {
    const caption = overrides.caption || overrides.label || '';
    const count = overrides.numberOfStates ?? 2;
    return {
      type: 'MultistateButton',
      name: 'MultistatePushButton1',
      tag: '',
      indicatorTag: '',
      numberOfStates: count,
      nextStateBasedOn: 'currentState',
      autoRepeatRate: 0,
      autoRepeatDelay: 400,
      caption,
      label: caption,
      left: 16,
      top: 79,
      width: 147,
      height: 38,
      visible: true,
      borderStyle: 'line',
      borderWidth: 1,
      borderUsesBackColor: true,
      backStyle: 'solid',
      shape: 'rectangle',
      useHighlightColor: true,
      highlightColor: '#0066cc',
      buttonType: 'multistate',
      touch: true,
      audio: true,
      horizontalMargin: 0,
      verticalMargin: 0,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      keyAssignment: 'None',
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
      states: defaultMultistateButtonStates(count, caption),
      ...overrides
    };
  }

  function fillMsNumberOfStatesSelect() {
    const el = document.getElementById('msNumberOfStates');
    if (!el || el.dataset.msFilled === '1') return;
    el.dataset.msFilled = '1';
    const opts = [];
    for (let n = 2; n <= MS_MAX_STATES; n++) {
      opts.push(`<option value="${n}"${n === 2 ? ' selected' : ''}>${n}</option>`);
    }
    el.innerHTML = opts.join('');
  }

  function fillMsAutoRepeatRateSelect() {
    const el = document.getElementById('msAutoRepeatRate');
    if (!el || el.dataset.msFilled === '1') return;
    el.dataset.msFilled = '1';
    const opts = [];
    for (let n = 0; n <= 20; n++) {
      opts.push(`<option value="${n}"${n === 0 ? ' selected' : ''}>${n}</option>`);
    }
    el.innerHTML = opts.join('');
  }

  function scheduleMultistateLivePreview() {
    if (window.state?.propsFormFill) return;
    if (msPreviewTimer) clearTimeout(msPreviewTimer);
    msPreviewTimer = setTimeout(() => {
      msPreviewTimer = null;
      const comp = readMultistateButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readMultistateButtonForm, 'applyMultistateButton');
    }, 80);
  }

  function wireMultistateButtonDialogTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('multistateButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    document.querySelectorAll('#multistateButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.msPreviewWired === '1') return;
      input.dataset.msPreviewWired = '1';
      input.addEventListener('input', scheduleMultistateLivePreview);
      input.addEventListener('change', scheduleMultistateLivePreview);
    });
    syncMultistateGeneralFields();
  }

  function presentMultistateButtonDialog() {
    const dialog = document.getElementById('multistateButtonDialog');
    if (!dialog) {
      window.setStatus('Multistate Push Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    msDialogCommitted = false;
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
        window.setStatus(`Opened Multistate properties without modal: ${err2.message}`);
      }
    }
  }

  function syncMultistateESignatureFields() {
    const on = Boolean(document.getElementById('msRequireESignature')?.checked);
    for (const id of [
      'msAllowBlankComment', 'msRequireReauth', 'msRequireCounterSig', 'msAuthorizedGroup',
      'msDomainVisible', 'msDomainNameMode', 'msDomainVariableMode', 'msDomainName',
      'msDomainVariable', 'msDomainBrowse', 'msDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
  }

  function syncMultistateGeneralFields() {
    const capColor = document.getElementById('msStateCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('msStateUseCaptionColor')?.checked;
    const capBack = document.getElementById('msStateCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('msStateUseCaptionBackColor')?.checked
      || document.getElementById('msCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('msStateImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('msStateUseImageColor')?.checked;
    const imgBack = document.getElementById('msStateImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('msStateUseImageBackColor')?.checked
      || document.getElementById('msImageBackStyle')?.value !== 'solid';
    const pat = document.getElementById('msStatePatternColor');
    if (pat) pat.disabled = !document.getElementById('msStateUsePatternColor')?.checked;
    const showValue = msActiveStateId !== 'Error';
    document.getElementById('msStateValueRow')?.classList.toggle('hidden', !showValue);
    const userCount = countUserStates(msStatesDraft);
    const del = document.getElementById('msDeleteState');
    if (del) del.disabled = msActiveStateId === 'Error' || userCount <= 2;
    const ins = document.getElementById('msInsertState');
    if (ins) ins.disabled = userCount >= MS_MAX_STATES;
    syncMultistateESignatureFields();
  }

  function saveMsStateToDraft() {
    if (!msStatesDraft) return;
    const id = msActiveStateId;
    const idx = msStatesDraft.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const alignment = document.querySelector('#multistateButtonForm input[name="msStateAlign"]:checked')?.value || 'middleCenter';
    const imageAlignment = document.querySelector('#multistateButtonForm input[name="msImageAlign"]:checked')?.value || 'middleCenter';
    const next = {
      ...msStatesDraft[idx],
      backColor: msGetColor('msStateBackColor'),
      borderColor: msGetColor('msStateBorderColor'),
      useBackColor: true,
      useBorderColor: true,
      blink: Boolean(document.getElementById('msStateBlink')?.checked),
      patternStyle: document.getElementById('msStatePatternStyle')?.value || 'none',
      usePatternColor: Boolean(document.getElementById('msStateUsePatternColor')?.checked),
      patternColor: msGetColor('msStatePatternColor'),
      caption: document.getElementById('msStateCaption')?.value ?? '',
      captionColor: msGetColor('msStateCaptionColor'),
      useCaptionColor: Boolean(document.getElementById('msStateUseCaptionColor')?.checked),
      captionBackColor: msGetColor('msStateCaptionBackColor'),
      useCaptionBackColor: Boolean(document.getElementById('msStateUseCaptionBackColor')?.checked),
      captionBlink: Boolean(document.getElementById('msStateCaptionBlink')?.checked),
      wordWrap: document.getElementById('msStateWordWrap')?.checked !== false,
      alignment,
      captionBackStyle: document.getElementById('msCaptionBackStyle')?.value || 'transparent',
      image: document.getElementById('msStateImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('msImageBackStyle')?.value || 'transparent',
      useImageColor: Boolean(document.getElementById('msStateUseImageColor')?.checked),
      imageColor: msGetColor('msStateImageColor'),
      useImageBackColor: Boolean(document.getElementById('msStateUseImageBackColor')?.checked),
      imageBackColor: msGetColor('msStateImageBackColor'),
      imageBlink: Boolean(document.getElementById('msStateImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('msStateImageScaled')?.checked),
      imageAlignment
    };
    if (id !== 'Error') next.value = Number(document.getElementById('msStateValue')?.value);
    msStatesDraft[idx] = next;
  }

  function loadMsStateFromDraft(stateId) {
    msActiveStateId = stateId;
    const fallback = defaultMsState(stateId);
    const state = { ...fallback, ...(msStatesDraft?.find((s) => s.id === stateId) || {}) };
    const select = document.getElementById('msStateSelect');
    if (select) select.value = stateId;
    const valueEl = document.getElementById('msStateValue');
    if (valueEl) {
      const idx = Math.max(0, (msStatesDraft || []).findIndex((s) => s.id === stateId));
      valueEl.value = String(state.value ?? (stateId === 'Error' ? 0 : idx));
    }
    msSetColor('msStateBackColor', state.backColor || '#001C38');
    msSetColor('msStateBorderColor', state.borderColor || '#001C38');
    const blink = document.getElementById('msStateBlink');
    if (blink) blink.checked = Boolean(state.blink);
    window.StudioPropsShared?.fillPatternSelect('msStatePatternStyle', 'msFilled');
    const pat = document.getElementById('msStatePatternStyle');
    if (pat) pat.value = state.patternStyle || 'none';
    const usePat = document.getElementById('msStateUsePatternColor');
    if (usePat) usePat.checked = Boolean(state.usePatternColor);
    msSetColor('msStatePatternColor', state.patternColor || '#ffffff');
    const caption = document.getElementById('msStateCaption');
    if (caption) caption.value = state.caption ?? '';
    const useCap = document.getElementById('msStateUseCaptionColor');
    if (useCap) useCap.checked = Boolean(state.useCaptionColor);
    msSetColor('msStateCaptionColor', state.captionColor || '#ffffff');
    const useCapBack = document.getElementById('msStateUseCaptionBackColor');
    if (useCapBack) useCapBack.checked = state.useCaptionBackColor !== false;
    msSetColor('msStateCaptionBackColor', state.captionBackColor || '#001C38');
    const capBlink = document.getElementById('msStateCaptionBlink');
    if (capBlink) capBlink.checked = Boolean(state.captionBlink);
    const wrap = document.getElementById('msStateWordWrap');
    if (wrap) wrap.checked = state.wordWrap !== false;
    const capBackStyle = document.getElementById('msCaptionBackStyle');
    if (capBackStyle) capBackStyle.value = state.captionBackStyle || 'transparent';
    document.querySelectorAll('#multistateButtonForm input[name="msStateAlign"]').forEach((el) => {
      el.checked = el.value === (state.alignment || 'middleCenter');
    });
    const img = document.getElementById('msStateImage');
    if (img) img.value = state.image || '';
    const imgBackStyle = document.getElementById('msImageBackStyle');
    if (imgBackStyle) imgBackStyle.value = state.imageBackStyle || 'transparent';
    const useImgColor = document.getElementById('msStateUseImageColor');
    if (useImgColor) useImgColor.checked = Boolean(state.useImageColor);
    msSetColor('msStateImageColor', state.imageColor || '#001C38');
    const useImgBack = document.getElementById('msStateUseImageBackColor');
    if (useImgBack) useImgBack.checked = Boolean(state.useImageBackColor);
    msSetColor('msStateImageBackColor', state.imageBackColor || '#001C38');
    const imgBlink = document.getElementById('msStateImageBlink');
    if (imgBlink) imgBlink.checked = Boolean(state.imageBlink);
    const imgScaled = document.getElementById('msStateImageScaled');
    if (imgScaled) imgScaled.checked = Boolean(state.imageScaled);
    document.querySelectorAll('#multistateButtonForm input[name="msImageAlign"]').forEach((el) => {
      el.checked = el.value === (state.imageAlignment || 'middleCenter');
    });
    syncMultistateGeneralFields();
  }

  function switchMsState(stateId) {
    saveMsStateToDraft();
    loadMsStateFromDraft(stateId);
  }

  function rebuildMsStateSelect() {
    const sel = document.getElementById('msStateSelect');
    if (!sel || !msStatesDraft) return;
    const prev = msActiveStateId;
    sel.innerHTML = msStatesDraft.map((s) => `<option value="${s.id}">${s.id}</option>`).join('');
    const next = msStatesDraft.some((s) => s.id === prev) ? prev : msStatesDraft[0]?.id || 'State0';
    sel.value = next;
    loadMsStateFromDraft(next);
  }

  function syncMsStateCount(count) {
    const n = Math.max(2, Math.min(MS_MAX_STATES, Number(count) || 2));
    if (!msStatesDraft) msStatesDraft = defaultMultistateButtonStates(n);
    const error = msStatesDraft.find((s) => s.id === 'Error') || defaultMsState('Error');
    let userStates = msStatesDraft.filter((s) => s.id !== 'Error');
    while (userStates.length < n) {
      const i = userStates.length;
      userStates.push(defaultMsState(`State${i}`, { value: i }));
    }
    if (userStates.length > n) userStates = userStates.slice(0, n);
    userStates = userStates.map((s, i) => ({ ...s, id: `State${i}`, value: s.value ?? i }));
    msStatesDraft = [...userStates, { ...error, id: 'Error' }];
    const countEl = document.getElementById('msNumberOfStates');
    if (countEl) countEl.value = String(n);
    rebuildMsStateSelect();
  }

  function fillMultistateButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillMsNumberOfStatesSelect();
      fillMsAutoRepeatRateSelect();
      const count = comp.numberOfStates ?? (countUserStates(comp.states) || 2);
      msStatesDraft = cloneStates(comp.states?.length ? comp.states : defaultMultistateButtonStates(count, comp.caption ?? comp.label));
      msActiveStateId = 'State0';
      msStateClipboard = null;
      const pasteBtn = document.getElementById('msStatePaste');
      if (pasteBtn) pasteBtn.disabled = true;

      document.getElementById('msBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('msBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('msBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      document.getElementById('msBackStyle').value = comp.backStyle || 'solid';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      document.getElementById('msShape').value = shape;
      msSetColor('msHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('msNumberOfStates').value = String(Math.max(2, Math.min(MS_MAX_STATES, count)));
      document.getElementById('msNextStateBasedOn').value = comp.nextStateBasedOn || 'currentState';
      const rate = Number(comp.autoRepeatRate ?? 0);
      document.getElementById('msAutoRepeatRate').value = String(rate > 20 ? 0 : rate);
      const delay = String(comp.autoRepeatDelay ?? 400);
      const delayEl = document.getElementById('msAutoRepeatDelay');
      if (delayEl) {
        if (![...delayEl.options].some((o) => o.value === delay)) {
          delayEl.insertAdjacentHTML('beforeend', `<option value="${delay}">${delay} msec</option>`);
        }
        delayEl.value = delay;
      }
      document.getElementById('msHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('msVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('msAudio').checked = comp.audio !== false;
      document.getElementById('msFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('msFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('msBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('msItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('msUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('msHeight').value = comp.height ?? 38;
      document.getElementById('msWidth').value = comp.width ?? 147;
      document.getElementById('msTop').value = comp.top ?? 79;
      document.getElementById('msLeft').value = comp.left ?? 16;
      document.getElementById('msName').value = comp.name || 'MultistatePushButton1';
      document.getElementById('msVisible').checked = comp.visible !== false;
      document.getElementById('msTag').value = comp.tag || '';
      document.getElementById('msIndicatorTag').value = comp.indicatorTag || '';
      const reqSig = document.getElementById('msRequireESignature');
      if (reqSig) reqSig.checked = Boolean(comp.requireESignature);
      const allowBlank = document.getElementById('msAllowBlankComment');
      if (allowBlank) allowBlank.checked = Boolean(comp.allowBlankComment);
      const reauth = document.getElementById('msRequireReauth');
      if (reauth) reauth.checked = Boolean(comp.requireReauth);
      const counter = document.getElementById('msRequireCounterSig');
      if (counter) counter.checked = Boolean(comp.requireCounterSig);
      const group = document.getElementById('msAuthorizedGroup');
      if (group) group.value = comp.authorizedGroup || 'Administrators';
      const domainVisible = document.getElementById('msDomainVisible');
      if (domainVisible) domainVisible.checked = Boolean(comp.domainVisible);
      const domainNameMode = document.getElementById('msDomainNameMode');
      const domainVarMode = document.getElementById('msDomainVariableMode');
      if (domainNameMode) domainNameMode.checked = (comp.domainMode || 'name') !== 'variable';
      if (domainVarMode) domainVarMode.checked = (comp.domainMode || 'name') === 'variable';
      const domainName = document.getElementById('msDomainName');
      if (domainName) domainName.value = comp.domainName || '';
      const domainVar = document.getElementById('msDomainVariable');
      if (domainVar) domainVar.value = comp.domainVariable || '';
      const domainDisable = document.getElementById('msDomainDisable');
      if (domainDisable) domainDisable.checked = Boolean(comp.domainDisable);
      window.StudioPropsShared?.fillPatternSelect('msStatePatternStyle', 'msFilled');
      rebuildMsStateSelect();
      syncMultistateGeneralFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readMultistateButtonForm() {
    saveMsStateToDraft();
    const state0 = msStatesDraft?.find((s) => s.id === 'State0');
    const caption = state0?.caption ?? '';
    return {
      type: 'MultistateButton',
      name: document.getElementById('msName')?.value.trim() || 'MultistatePushButton1',
      tag: document.getElementById('msTag')?.value.trim() || '',
      indicatorTag: document.getElementById('msIndicatorTag')?.value.trim() || '',
      numberOfStates: countUserStates(msStatesDraft),
      nextStateBasedOn: document.getElementById('msNextStateBasedOn')?.value || 'currentState',
      autoRepeatRate: Number(document.getElementById('msAutoRepeatRate')?.value) || 0,
      autoRepeatDelay: Number(document.getElementById('msAutoRepeatDelay')?.value) || 400,
      caption,
      label: caption,
      left: Number(document.getElementById('msLeft')?.value) || 0,
      top: Number(document.getElementById('msTop')?.value) || 0,
      width: Number(document.getElementById('msWidth')?.value) || 147,
      height: Number(document.getElementById('msHeight')?.value) || 38,
      visible: document.getElementById('msVisible')?.checked !== false,
      borderStyle: document.getElementById('msBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('msBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('msBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('msBackStyle')?.value || 'solid',
      shape: document.getElementById('msShape')?.value || 'rectangle',
      useHighlightColor: true,
      highlightColor: msGetColor('msHighlightColor'),
      buttonType: 'multistate',
      touch: true,
      audio: document.getElementById('msAudio')?.checked !== false,
      horizontalMargin: Number(document.getElementById('msHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('msVerticalMargin')?.value) || 0,
      fontFamily: document.getElementById('msFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('msFontSize')?.value) || 10,
      bold: document.getElementById('msBold')?.classList.contains('active'),
      italic: document.getElementById('msItalic')?.classList.contains('active'),
      underline: document.getElementById('msUnderline')?.classList.contains('active'),
      keyAssignment: 'None',
      requireESignature: Boolean(document.getElementById('msRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('msAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('msRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('msRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('msAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('msDomainVisible')?.checked),
      domainMode: document.querySelector('#multistateButtonForm input[name="msDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('msDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('msDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('msDomainDisable')?.checked),
      previewStateId: msActiveStateId,
      states: cloneStates(msStatesDraft)
    };
  }

  async function showMultistateButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Multistate button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initMultistateButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultMultistateButtonComponent({
        name: nextMultistateButtonName(canvas?.components),
        ...overrides
      });
      fillMultistateButtonForm(comp);
      window.resetPropsDialogState('multistate', readMultistateButtonForm, 'applyMultistateButton');
      switchTab('multistateButtonDialog', 'msTab', 'msTabPanel', 'general');
      wireMultistateButtonDialogTools();
      presentMultistateButtonDialog();
      const previewComp = readMultistateButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readMultistateButtonForm, 'applyMultistateButton');
    } catch (err) {
      window.setStatus(`Multistate properties error: ${err.message}`);
    }
  }

  async function applyMultistateButton() {
    const comp = readMultistateButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readMultistateButtonForm, 'applyMultistateButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveMultistateButton(e) {
    e.preventDefault();
    const comp = readMultistateButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    msDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('multistateButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function initMultistateButtonDialog() {
    const form = document.getElementById('multistateButtonForm');
    if (!form || form.dataset.msWired === '1') return;
    form.dataset.msWired = '1';
    fillMsNumberOfStatesSelect();
    fillMsAutoRepeatRateSelect();
    window.StudioPropsShared?.fillPatternSelect('msStatePatternStyle', 'msFilled');
    form.addEventListener('submit', (e) => saveMultistateButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyMultistateButton')?.addEventListener('click', () => {
      applyMultistateButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleMultistateLivePreview();
      window.flushPropsApplyButton?.(readMultistateButtonForm, 'applyMultistateButton');
    });
    form.addEventListener('change', () => {
      syncMultistateGeneralFields();
      scheduleMultistateLivePreview();
      window.flushPropsApplyButton?.(readMultistateButtonForm, 'applyMultistateButton');
    });
    document.getElementById('cancelMultistateButton')?.addEventListener('click', () => {
      document.getElementById('multistateButtonDialog')?.close();
    });
    document.getElementById('multistateButtonDialog')?.addEventListener('close', () => {
      if (!msDialogCommitted) window.revertPropsDialogPreview?.();
      msDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpMultistateButton')?.addEventListener('click', () => {
      alert('Multistate Push Button cycles through configured states on each click. Next state can follow Current State or Value Control. Hold for auto-repeat using Timing. Appearance follows the Indicator tag when set.');
    });
    document.querySelectorAll('#multistateButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab('multistateButtonDialog', 'msTab', 'msTabPanel', tab.dataset.msTab));
    });
    document.getElementById('msStateSelect')?.addEventListener('change', (e) => {
      switchMsState(e.target.value);
      scheduleMultistateLivePreview();
    });
    document.getElementById('msNumberOfStates')?.addEventListener('change', (e) => {
      saveMsStateToDraft();
      syncMsStateCount(Number(e.target.value) || 2);
      scheduleMultistateLivePreview();
    });
    document.getElementById('msInsertState')?.addEventListener('click', () => {
      saveMsStateToDraft();
      const count = countUserStates(msStatesDraft);
      if (count >= MS_MAX_STATES) return;
      syncMsStateCount(count + 1);
      switchMsState(`State${count}`);
      scheduleMultistateLivePreview();
    });
    document.getElementById('msDeleteState')?.addEventListener('click', () => {
      if (msActiveStateId === 'Error') return;
      saveMsStateToDraft();
      const count = countUserStates(msStatesDraft);
      if (count <= 2) return;
      msStatesDraft = msStatesDraft.filter((s) => s.id !== msActiveStateId);
      syncMsStateCount(count - 1);
      scheduleMultistateLivePreview();
    });
    document.getElementById('msStateCopy')?.addEventListener('click', () => {
      saveMsStateToDraft();
      const state = msStatesDraft?.find((s) => s.id === msActiveStateId);
      if (state) {
        msStateClipboard = { ...state };
        const pasteBtn = document.getElementById('msStatePaste');
        if (pasteBtn) pasteBtn.disabled = false;
      }
    });
    document.getElementById('msStatePaste')?.addEventListener('click', () => {
      if (!msStateClipboard || !msStatesDraft) return;
      saveMsStateToDraft();
      const idx = msStatesDraft.findIndex((s) => s.id === msActiveStateId);
      if (idx < 0) return;
      const keep = { id: msStatesDraft[idx].id, value: msStatesDraft[idx].value };
      msStatesDraft[idx] = { ...msStateClipboard, ...keep };
      loadMsStateFromDraft(msActiveStateId);
      scheduleMultistateLivePreview();
    });
    document.getElementById('msBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('msStateImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('msStateImage').value = fileName;
          scheduleMultistateLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('msInsertVariable')?.addEventListener('click', () => {
      window.StudioTagTools?.openTagBrowser(null, (sel) => {
        const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
        const area = document.getElementById('msStateCaption');
        if (!area || !tag) return;
        const start = area.selectionStart ?? area.value.length;
        const end = area.selectionEnd ?? start;
        area.value = area.value.slice(0, start) + tag + area.value.slice(end);
        area.focus();
        scheduleMultistateLivePreview();
      });
    });
    document.getElementById('msRequireESignature')?.addEventListener('change', syncMultistateESignatureFields);
    document.getElementById('msShape')?.addEventListener('change', () => {
      if (document.getElementById('msShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('msWidth')?.value) || 0;
      const h = Number(document.getElementById('msHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('msWidth').value = String(size);
      document.getElementById('msHeight').value = String(size);
    });
    for (const id of [
      'msStateUsePatternColor', 'msStateUseCaptionColor', 'msStateUseCaptionBackColor',
      'msStateUseImageColor', 'msStateUseImageBackColor', 'msCaptionBackStyle', 'msImageBackStyle'
    ]) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncMultistateGeneralFields();
        scheduleMultistateLivePreview();
      });
    }
    for (const id of ['msBold', 'msItalic', 'msUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleMultistateLivePreview();
      });
    }
  }

  // ─── Interlocked ───────────────────────────────────────────────────────────

  let ilkPreviewTimer = null;
  let ilkDialogCommitted = false;

  function ilkGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function ilkSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextInterlockedButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'InterlockedButton').length + 1;
    return `InterlockedPushButton${n}`;
  }

  function defaultIlkState(id, extras = {}) {
    return {
      id,
      backColor: '#001C38',
      borderColor: '#001C38',
      useBackColor: true,
      useBorderColor: true,
      blink: false,
      patternStyle: 'none',
      usePatternColor: false,
      patternColor: '#ffffff',
      caption: '',
      captionColor: '#ffffff',
      useCaptionColor: false,
      captionBackColor: '#001C38',
      useCaptionBackColor: false,
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
      ...extras
    };
  }

  function defaultInterlockedButtonStates(caption = '') {
    return [
      defaultIlkState('State0', { caption }),
      defaultIlkState('State1', { caption })
    ];
  }

  function defaultInterlockedButtonComponent(overrides = {}) {
    const caption = overrides.caption || overrides.label || '';
    return {
      type: 'InterlockedButton',
      name: 'InterlockedPushButton1',
      tag: '',
      buttonValue: 0,
      caption,
      label: caption,
      left: 16,
      top: 79,
      width: 147,
      height: 38,
      visible: true,
      borderStyle: 'line',
      borderWidth: 1,
      borderUsesBackColor: true,
      backStyle: 'solid',
      shape: 'rectangle',
      useHighlightColor: true,
      highlightColor: '#0066cc',
      buttonType: 'interlocked',
      touch: true,
      audio: true,
      horizontalMargin: 0,
      verticalMargin: 0,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      keyAssignment: 'None',
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
      states: defaultInterlockedButtonStates(caption),
      ...overrides
    };
  }

  function scheduleInterlockedLivePreview() {
    if (window.state?.propsFormFill) return;
    if (ilkPreviewTimer) clearTimeout(ilkPreviewTimer);
    ilkPreviewTimer = setTimeout(() => {
      ilkPreviewTimer = null;
      const comp = readInterlockedButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readInterlockedButtonForm, 'applyInterlockedButton');
    }, 80);
  }

  function wireInterlockedButtonDialogTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('interlockedButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    document.querySelectorAll('#interlockedButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.ilkPreviewWired === '1') return;
      input.dataset.ilkPreviewWired = '1';
      input.addEventListener('input', scheduleInterlockedLivePreview);
      input.addEventListener('change', scheduleInterlockedLivePreview);
    });
    syncInterlockedGeneralFields();
  }

  function presentInterlockedButtonDialog() {
    const dialog = document.getElementById('interlockedButtonDialog');
    if (!dialog) {
      window.setStatus('Interlocked Push Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    ilkDialogCommitted = false;
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
        window.setStatus(`Opened Interlocked properties without modal: ${err2.message}`);
      }
    }
  }

  function syncInterlockedESignatureFields() {
    const on = Boolean(document.getElementById('ilkRequireESignature')?.checked);
    for (const id of [
      'ilkAllowBlankComment', 'ilkRequireReauth', 'ilkRequireCounterSig', 'ilkAuthorizedGroup',
      'ilkDomainVisible', 'ilkDomainNameMode', 'ilkDomainVariableMode', 'ilkDomainName',
      'ilkDomainVariable', 'ilkDomainBrowse', 'ilkDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
  }

  function syncInterlockedGeneralFields() {
    const capColor = document.getElementById('ilkStateCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('ilkStateUseCaptionColor')?.checked;
    const capBack = document.getElementById('ilkStateCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('ilkStateUseCaptionBackColor')?.checked
      || document.getElementById('ilkCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('ilkStateImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('ilkStateUseImageColor')?.checked;
    const imgBack = document.getElementById('ilkStateImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('ilkStateUseImageBackColor')?.checked
      || document.getElementById('ilkImageBackStyle')?.value !== 'solid';
    const pat = document.getElementById('ilkStatePatternColor');
    if (pat) pat.disabled = !document.getElementById('ilkStateUsePatternColor')?.checked;
    syncInterlockedESignatureFields();
  }

  function saveIlkStateToDraft() {
    if (!ilkStatesDraft) return;
    const id = ilkActiveStateId;
    const idx = ilkStatesDraft.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const alignment = document.querySelector('#interlockedButtonForm input[name="ilkStateAlign"]:checked')?.value || 'middleCenter';
    const imageAlignment = document.querySelector('#interlockedButtonForm input[name="ilkImageAlign"]:checked')?.value || 'middleCenter';
    ilkStatesDraft[idx] = {
      ...ilkStatesDraft[idx],
      backColor: ilkGetColor('ilkStateBackColor'),
      borderColor: ilkGetColor('ilkStateBorderColor'),
      useBackColor: true,
      useBorderColor: true,
      blink: Boolean(document.getElementById('ilkStateBlink')?.checked),
      patternStyle: document.getElementById('ilkStatePatternStyle')?.value || 'none',
      usePatternColor: Boolean(document.getElementById('ilkStateUsePatternColor')?.checked),
      patternColor: ilkGetColor('ilkStatePatternColor'),
      caption: document.getElementById('ilkStateCaption')?.value ?? '',
      captionColor: ilkGetColor('ilkStateCaptionColor'),
      useCaptionColor: Boolean(document.getElementById('ilkStateUseCaptionColor')?.checked),
      captionBackColor: ilkGetColor('ilkStateCaptionBackColor'),
      useCaptionBackColor: Boolean(document.getElementById('ilkStateUseCaptionBackColor')?.checked),
      captionBlink: Boolean(document.getElementById('ilkStateCaptionBlink')?.checked),
      wordWrap: document.getElementById('ilkStateWordWrap')?.checked !== false,
      alignment,
      captionBackStyle: document.getElementById('ilkCaptionBackStyle')?.value || 'transparent',
      image: document.getElementById('ilkStateImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('ilkImageBackStyle')?.value || 'transparent',
      useImageColor: Boolean(document.getElementById('ilkStateUseImageColor')?.checked),
      imageColor: ilkGetColor('ilkStateImageColor'),
      useImageBackColor: Boolean(document.getElementById('ilkStateUseImageBackColor')?.checked),
      imageBackColor: ilkGetColor('ilkStateImageBackColor'),
      imageBlink: Boolean(document.getElementById('ilkStateImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('ilkStateImageScaled')?.checked),
      imageAlignment
    };
  }

  function loadIlkStateFromDraft(stateId) {
    ilkActiveStateId = stateId;
    const fallback = defaultIlkState(stateId);
    const state = { ...fallback, ...(ilkStatesDraft?.find((s) => s.id === stateId) || {}) };
    const select = document.getElementById('ilkStateSelect');
    if (select) select.value = stateId;
    ilkSetColor('ilkStateBackColor', state.backColor || '#001C38');
    ilkSetColor('ilkStateBorderColor', state.borderColor || '#001C38');
    const blink = document.getElementById('ilkStateBlink');
    if (blink) blink.checked = Boolean(state.blink);
    window.StudioPropsShared?.fillPatternSelect('ilkStatePatternStyle', 'ilkFilled');
    const pat = document.getElementById('ilkStatePatternStyle');
    if (pat) pat.value = state.patternStyle || 'none';
    const usePat = document.getElementById('ilkStateUsePatternColor');
    if (usePat) usePat.checked = Boolean(state.usePatternColor);
    ilkSetColor('ilkStatePatternColor', state.patternColor || '#ffffff');
    const caption = document.getElementById('ilkStateCaption');
    if (caption) caption.value = state.caption ?? '';
    const useCap = document.getElementById('ilkStateUseCaptionColor');
    if (useCap) useCap.checked = Boolean(state.useCaptionColor);
    ilkSetColor('ilkStateCaptionColor', state.captionColor || '#ffffff');
    const useCapBack = document.getElementById('ilkStateUseCaptionBackColor');
    if (useCapBack) useCapBack.checked = Boolean(state.useCaptionBackColor);
    ilkSetColor('ilkStateCaptionBackColor', state.captionBackColor || '#001C38');
    const capBlink = document.getElementById('ilkStateCaptionBlink');
    if (capBlink) capBlink.checked = Boolean(state.captionBlink);
    const wrap = document.getElementById('ilkStateWordWrap');
    if (wrap) wrap.checked = state.wordWrap !== false;
    const capBackStyle = document.getElementById('ilkCaptionBackStyle');
    if (capBackStyle) capBackStyle.value = state.captionBackStyle || 'transparent';
    document.querySelectorAll('#interlockedButtonForm input[name="ilkStateAlign"]').forEach((el) => {
      el.checked = el.value === (state.alignment || 'middleCenter');
    });
    const img = document.getElementById('ilkStateImage');
    if (img) img.value = state.image || '';
    const imgBackStyle = document.getElementById('ilkImageBackStyle');
    if (imgBackStyle) imgBackStyle.value = state.imageBackStyle || 'transparent';
    const useImgColor = document.getElementById('ilkStateUseImageColor');
    if (useImgColor) useImgColor.checked = Boolean(state.useImageColor);
    ilkSetColor('ilkStateImageColor', state.imageColor || '#ffffff');
    const useImgBack = document.getElementById('ilkStateUseImageBackColor');
    if (useImgBack) useImgBack.checked = Boolean(state.useImageBackColor);
    ilkSetColor('ilkStateImageBackColor', state.imageBackColor || '#001C38');
    const imgBlink = document.getElementById('ilkStateImageBlink');
    if (imgBlink) imgBlink.checked = Boolean(state.imageBlink);
    const imgScaled = document.getElementById('ilkStateImageScaled');
    if (imgScaled) imgScaled.checked = Boolean(state.imageScaled);
    document.querySelectorAll('#interlockedButtonForm input[name="ilkImageAlign"]').forEach((el) => {
      el.checked = el.value === (state.imageAlignment || 'middleCenter');
    });
    syncInterlockedGeneralFields();
  }

  function switchIlkState(stateId) {
    saveIlkStateToDraft();
    loadIlkStateFromDraft(stateId);
  }

  function fillInterlockedButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      const src = comp.states?.length ? comp.states : defaultInterlockedButtonStates(comp.caption ?? comp.label);
      const s0 = src.find((s) => s.id === 'State0') || src[0] || defaultIlkState('State0');
      const s1 = src.find((s) => s.id === 'State1') || src[1] || defaultIlkState('State1');
      ilkStatesDraft = cloneStates([
        { ...defaultIlkState('State0'), ...s0, id: 'State0' },
        { ...defaultIlkState('State1'), ...s1, id: 'State1' }
      ]);
      ilkActiveStateId = 'State0';
      ilkStateClipboard = null;
      const pasteBtn = document.getElementById('ilkStatePaste');
      if (pasteBtn) pasteBtn.disabled = true;

      document.getElementById('ilkBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('ilkBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('ilkBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      document.getElementById('ilkBackStyle').value = comp.backStyle || 'solid';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      document.getElementById('ilkShape').value = shape;
      ilkSetColor('ilkHighlightColor', comp.highlightColor || '#0066cc');
      const bv = Number(comp.buttonValue);
      document.getElementById('ilkButtonValue').value = String(Number.isFinite(bv) ? bv : 0);
      document.getElementById('ilkHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('ilkVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('ilkAudio').checked = comp.audio !== false;
      document.getElementById('ilkFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('ilkFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('ilkBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('ilkItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('ilkUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('ilkHeight').value = comp.height ?? 38;
      document.getElementById('ilkWidth').value = comp.width ?? 147;
      document.getElementById('ilkTop').value = comp.top ?? 79;
      document.getElementById('ilkLeft').value = comp.left ?? 16;
      document.getElementById('ilkName').value = comp.name || 'InterlockedPushButton1';
      document.getElementById('ilkVisible').checked = comp.visible !== false;
      document.getElementById('ilkTag').value = comp.tag || '';
      const reqSig = document.getElementById('ilkRequireESignature');
      if (reqSig) reqSig.checked = Boolean(comp.requireESignature);
      const allowBlank = document.getElementById('ilkAllowBlankComment');
      if (allowBlank) allowBlank.checked = Boolean(comp.allowBlankComment);
      const reauth = document.getElementById('ilkRequireReauth');
      if (reauth) reauth.checked = Boolean(comp.requireReauth);
      const counter = document.getElementById('ilkRequireCounterSig');
      if (counter) counter.checked = Boolean(comp.requireCounterSig);
      const group = document.getElementById('ilkAuthorizedGroup');
      if (group) group.value = comp.authorizedGroup || 'Administrators';
      const domainVisible = document.getElementById('ilkDomainVisible');
      if (domainVisible) domainVisible.checked = Boolean(comp.domainVisible);
      const domainNameMode = document.getElementById('ilkDomainNameMode');
      const domainVarMode = document.getElementById('ilkDomainVariableMode');
      if (domainNameMode) domainNameMode.checked = (comp.domainMode || 'name') !== 'variable';
      if (domainVarMode) domainVarMode.checked = (comp.domainMode || 'name') === 'variable';
      const domainName = document.getElementById('ilkDomainName');
      if (domainName) domainName.value = comp.domainName || '';
      const domainVar = document.getElementById('ilkDomainVariable');
      if (domainVar) domainVar.value = comp.domainVariable || '';
      const domainDisable = document.getElementById('ilkDomainDisable');
      if (domainDisable) domainDisable.checked = Boolean(comp.domainDisable);
      window.StudioPropsShared?.fillPatternSelect('ilkStatePatternStyle', 'ilkFilled');
      loadIlkStateFromDraft('State0');
      syncInterlockedGeneralFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readInterlockedButtonForm() {
    saveIlkStateToDraft();
    const state0 = ilkStatesDraft?.find((s) => s.id === 'State0');
    const caption = state0?.caption ?? '';
    const rawBv = Number(document.getElementById('ilkButtonValue')?.value);
    return {
      type: 'InterlockedButton',
      name: document.getElementById('ilkName')?.value.trim() || 'InterlockedPushButton1',
      tag: document.getElementById('ilkTag')?.value.trim() || '',
      buttonValue: Number.isFinite(rawBv) ? rawBv : 0,
      caption,
      label: caption,
      left: Number(document.getElementById('ilkLeft')?.value) || 0,
      top: Number(document.getElementById('ilkTop')?.value) || 0,
      width: Number(document.getElementById('ilkWidth')?.value) || 147,
      height: Number(document.getElementById('ilkHeight')?.value) || 38,
      visible: document.getElementById('ilkVisible')?.checked !== false,
      borderStyle: document.getElementById('ilkBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('ilkBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('ilkBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('ilkBackStyle')?.value || 'solid',
      shape: document.getElementById('ilkShape')?.value || 'rectangle',
      useHighlightColor: true,
      highlightColor: ilkGetColor('ilkHighlightColor'),
      buttonType: 'interlocked',
      touch: true,
      audio: document.getElementById('ilkAudio')?.checked !== false,
      horizontalMargin: Number(document.getElementById('ilkHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('ilkVerticalMargin')?.value) || 0,
      fontFamily: document.getElementById('ilkFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('ilkFontSize')?.value) || 10,
      bold: document.getElementById('ilkBold')?.classList.contains('active'),
      italic: document.getElementById('ilkItalic')?.classList.contains('active'),
      underline: document.getElementById('ilkUnderline')?.classList.contains('active'),
      keyAssignment: 'None',
      requireESignature: Boolean(document.getElementById('ilkRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('ilkAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('ilkRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('ilkRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('ilkAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('ilkDomainVisible')?.checked),
      domainMode: document.querySelector('#interlockedButtonForm input[name="ilkDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('ilkDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('ilkDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('ilkDomainDisable')?.checked),
      previewStateId: ilkActiveStateId,
      states: cloneStates(ilkStatesDraft)
    };
  }

  async function showInterlockedButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Interlocked button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initInterlockedButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultInterlockedButtonComponent({
        name: nextInterlockedButtonName(canvas?.components),
        ...overrides
      });
      fillInterlockedButtonForm(comp);
      window.resetPropsDialogState('interlocked', readInterlockedButtonForm, 'applyInterlockedButton');
      switchTab('interlockedButtonDialog', 'ilkTab', 'ilkTabPanel', 'general');
      wireInterlockedButtonDialogTools();
      presentInterlockedButtonDialog();
      const previewComp = readInterlockedButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readInterlockedButtonForm, 'applyInterlockedButton');
    } catch (err) {
      window.setStatus(`Interlocked properties error: ${err.message}`);
    }
  }

  async function applyInterlockedButton() {
    const comp = readInterlockedButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readInterlockedButtonForm, 'applyInterlockedButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveInterlockedButton(e) {
    e.preventDefault();
    const comp = readInterlockedButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    ilkDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('interlockedButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertIlkCaptionText(text) {
    const area = document.getElementById('ilkStateCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleInterlockedLivePreview();
  }

  function insertIlkCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertIlkCaptionText(tag);
    });
  }

  function hideIlkInsertVariableMenu() {
    document.getElementById('ilkInsertVariableMenu')?.classList.add('hidden');
  }

  function initInterlockedButtonDialog() {
    const form = document.getElementById('interlockedButtonForm');
    if (!form || form.dataset.ilkWired === '1') return;
    form.dataset.ilkWired = '1';
    window.StudioPropsShared?.fillPatternSelect('ilkStatePatternStyle', 'ilkFilled');
    form.addEventListener('submit', (e) => saveInterlockedButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyInterlockedButton')?.addEventListener('click', () => {
      applyInterlockedButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleInterlockedLivePreview();
      window.flushPropsApplyButton?.(readInterlockedButtonForm, 'applyInterlockedButton');
    });
    form.addEventListener('change', () => {
      syncInterlockedGeneralFields();
      scheduleInterlockedLivePreview();
      window.flushPropsApplyButton?.(readInterlockedButtonForm, 'applyInterlockedButton');
    });
    document.getElementById('cancelInterlockedButton')?.addEventListener('click', () => {
      document.getElementById('interlockedButtonDialog')?.close();
    });
    document.getElementById('interlockedButtonDialog')?.addEventListener('close', () => {
      hideIlkInsertVariableMenu();
      if (!ilkDialogCommitted) window.revertPropsDialogPreview?.();
      ilkDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpInterlockedButton')?.addEventListener('click', () => {
      alert('Interlocked Push Button writes its Button Value to the Value connection when pressed. The button shows State1 while the Value tag equals the Button Value, and State0 otherwise.');
    });
    document.querySelectorAll('#interlockedButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideIlkInsertVariableMenu();
        switchTab('interlockedButtonDialog', 'ilkTab', 'ilkTabPanel', tab.dataset.ilkTab);
      });
    });
    document.getElementById('ilkStateSelect')?.addEventListener('change', (e) => {
      switchIlkState(e.target.value);
      scheduleInterlockedLivePreview();
    });
    document.getElementById('ilkStateCopy')?.addEventListener('click', () => {
      saveIlkStateToDraft();
      const state = ilkStatesDraft?.find((s) => s.id === ilkActiveStateId);
      if (state) {
        ilkStateClipboard = { ...state };
        const pasteBtn = document.getElementById('ilkStatePaste');
        if (pasteBtn) pasteBtn.disabled = false;
      }
    });
    document.getElementById('ilkStatePaste')?.addEventListener('click', () => {
      if (!ilkStateClipboard || !ilkStatesDraft) return;
      saveIlkStateToDraft();
      const idx = ilkStatesDraft.findIndex((s) => s.id === ilkActiveStateId);
      if (idx < 0) return;
      const keep = { id: ilkStatesDraft[idx].id };
      ilkStatesDraft[idx] = { ...ilkStateClipboard, ...keep };
      loadIlkStateFromDraft(ilkActiveStateId);
      scheduleInterlockedLivePreview();
    });
    document.getElementById('ilkBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('ilkStateImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('ilkStateImage').value = fileName;
          scheduleInterlockedLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('ilkInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('ilkInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('ilkInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.ilkVar;
      if (!kind) return;
      hideIlkInsertVariableMenu();
      if (kind === 'timedate') insertIlkCaptionText('{#dt}');
      else insertIlkCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#interlockedButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideIlkInsertVariableMenu();
    });
    document.getElementById('ilkRequireESignature')?.addEventListener('change', syncInterlockedESignatureFields);
    document.getElementById('ilkShape')?.addEventListener('change', () => {
      if (document.getElementById('ilkShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('ilkWidth')?.value) || 0;
      const h = Number(document.getElementById('ilkHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('ilkWidth').value = String(size);
      document.getElementById('ilkHeight').value = String(size);
    });
    for (const id of [
      'ilkStateUsePatternColor', 'ilkStateUseCaptionColor', 'ilkStateUseCaptionBackColor',
      'ilkStateUseImageColor', 'ilkStateUseImageBackColor', 'ilkCaptionBackStyle', 'ilkImageBackStyle'
    ]) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncInterlockedGeneralFields();
        scheduleInterlockedLivePreview();
      });
    }
    for (const id of ['ilkBold', 'ilkItalic', 'ilkUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleInterlockedLivePreview();
      });
    }
  }

  // ─── Ramp ──────────────────────────────────────────────────────────────────

  let rmpPreviewTimer = null;
  let rmpDialogCommitted = false;
  let rmpStoredUpper = 100;
  let rmpStoredLower = 0;

  function rmpGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function rmpSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextRampButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'RampButton').length + 1;
    return `RampButton${n}`;
  }

  function fillRampAutoRepeatRateSelect() {
    const el = document.getElementById('rmpAutoRepeatRate');
    if (!el || el.dataset.rmpRateFilled === '1') return;
    el.dataset.rmpRateFilled = '1';
    const opts = [];
    for (let n = 0; n <= 20; n++) {
      opts.push(`<option value="${n}"${n === 0 ? ' selected' : ''}>${n}</option>`);
    }
    el.innerHTML = opts.join('');
  }

  function defaultRampButtonComponent(overrides = {}) {
    const caption = overrides.caption || overrides.label || '';
    return {
      type: 'RampButton',
      name: 'RampButton1',
      tag: '',
      rampTag: '',
      limitTag: '',
      operationDirection: 'rampUp',
      upperLimit: 100,
      lowerLimit: 0,
      rampValue: 1,
      useVariableLimit: false,
      useVariableRamp: false,
      autoRepeatRate: 0,
      autoRepeatDelay: 400,
      caption,
      label: caption,
      left: 16,
      top: 79,
      width: 147,
      height: 38,
      visible: true,
      borderStyle: 'line',
      borderWidth: 1,
      borderUsesBackColor: true,
      backStyle: 'solid',
      patternStyle: 'none',
      usePatternColor: false,
      patternColor: '#ffffff',
      shape: 'rectangle',
      useBackColor: true,
      backColor: '#001C38',
      useBorderColor: true,
      borderColor: '#001C38',
      useHighlightColor: true,
      highlightColor: '#0066cc',
      blink: false,
      buttonType: 'ramp',
      touch: true,
      audio: true,
      horizontalMargin: 0,
      verticalMargin: 0,
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
      keyAssignment: 'None',
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

  function scheduleRampLivePreview() {
    if (window.state?.propsFormFill) return;
    if (rmpPreviewTimer) clearTimeout(rmpPreviewTimer);
    rmpPreviewTimer = setTimeout(() => {
      rmpPreviewTimer = null;
      const comp = readRampButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readRampButtonForm, 'applyRampButton');
    }, 80);
  }

  function wireRampButtonDialogTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('rampButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    document.querySelectorAll('#rampButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.rmpPreviewWired === '1') return;
      input.dataset.rmpPreviewWired = '1';
      input.addEventListener('input', scheduleRampLivePreview);
      input.addEventListener('change', scheduleRampLivePreview);
    });
    syncRampGeneralFields();
  }

  function presentRampButtonDialog() {
    const dialog = document.getElementById('rampButtonDialog');
    if (!dialog) {
      window.setStatus('Ramp Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    rmpDialogCommitted = false;
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
        window.setStatus(`Opened Ramp properties without modal: ${err2.message}`);
      }
    }
  }

  function rmpDirection() {
    return document.querySelector('#rampButtonForm input[name="rmpDirection"]:checked')?.value || 'rampUp';
  }

  function syncRampLimitLabel() {
    const label = document.getElementById('rmpLimitLabel');
    if (!label) return;
    const up = rmpDirection() === 'rampUp';
    const first = label.childNodes[0];
    if (first && first.nodeType === Node.TEXT_NODE) {
      first.textContent = up ? 'Upper limit:' : 'Lower limit:';
    } else {
      label.insertBefore(document.createTextNode(up ? 'Upper limit:' : 'Lower limit:'), label.firstChild);
    }
  }

  function syncRampESignatureFields() {
    const on = Boolean(document.getElementById('rmpRequireESignature')?.checked);
    for (const id of [
      'rmpAllowBlankComment', 'rmpRequireReauth', 'rmpRequireCounterSig', 'rmpAuthorizedGroup',
      'rmpDomainVisible', 'rmpDomainNameMode', 'rmpDomainVariableMode', 'rmpDomainName',
      'rmpDomainVariable', 'rmpDomainBrowse', 'rmpDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
  }

  function syncRampGeneralFields() {
    const pat = document.getElementById('rmpPatternColor');
    if (pat) pat.disabled = !document.getElementById('rmpUsePatternColor')?.checked;
    const capColor = document.getElementById('rmpCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('rmpUseCaptionColor')?.checked;
    const capBack = document.getElementById('rmpCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('rmpUseCaptionBackColor')?.checked
      || document.getElementById('rmpCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('rmpImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('rmpUseImageColor')?.checked;
    const imgBack = document.getElementById('rmpImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('rmpUseImageBackColor')?.checked
      || document.getElementById('rmpImageBackStyle')?.value !== 'solid';
    const varLimit = Boolean(document.getElementById('rmpUseVariableLimit')?.checked);
    const varRamp = Boolean(document.getElementById('rmpUseVariableRamp')?.checked);
    const limitEl = document.getElementById('rmpLimit');
    const rampVal = document.getElementById('rmpRampValue');
    if (limitEl) limitEl.disabled = varLimit;
    if (rampVal) rampVal.disabled = varRamp;
    syncRampLimitLabel();
    syncRampESignatureFields();
  }

  function fillRampButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillRampAutoRepeatRateSelect();
      window.StudioPropsShared?.fillPatternSelect('rmpPatternStyle', 'rmpFilled');
      document.getElementById('rmpBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('rmpBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('rmpBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      document.getElementById('rmpBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('rmpPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      document.getElementById('rmpShape').value = shape;
      rmpSetColor('rmpBackColor', comp.backColor || '#001C38');
      rmpSetColor('rmpBorderColor', comp.borderColor || '#001C38');
      const usePat = document.getElementById('rmpUsePatternColor');
      if (usePat) usePat.checked = Boolean(comp.usePatternColor);
      rmpSetColor('rmpPatternColor', comp.patternColor || '#ffffff');
      rmpSetColor('rmpHighlightColor', comp.highlightColor || '#0066cc');
      const blink = document.getElementById('rmpBlink');
      if (blink) blink.checked = Boolean(comp.blink);
      document.getElementById('rmpUseVariableLimit').checked = Boolean(comp.useVariableLimit);
      document.getElementById('rmpUseVariableRamp').checked = Boolean(comp.useVariableRamp);
      const dir = comp.operationDirection || 'rampUp';
      document.querySelectorAll('#rampButtonForm input[name="rmpDirection"]').forEach((el) => {
        el.checked = el.value === dir;
      });
      rmpStoredUpper = Number(comp.upperLimit);
      if (!Number.isFinite(rmpStoredUpper)) rmpStoredUpper = 100;
      rmpStoredLower = Number(comp.lowerLimit);
      if (!Number.isFinite(rmpStoredLower)) rmpStoredLower = 0;
      document.getElementById('rmpLimit').value = String(dir === 'rampDown' ? rmpStoredLower : rmpStoredUpper);
      document.getElementById('rmpRampValue').value = comp.rampValue ?? 1;
      document.getElementById('rmpHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('rmpVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('rmpAudio').checked = comp.audio !== false;
      document.getElementById('rmpCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('rmpFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('rmpFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('rmpBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('rmpItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('rmpUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('rmpUseCaptionColor').checked = Boolean(comp.useCaptionColor);
      rmpSetColor('rmpCaptionColor', comp.captionColor || '#ffffff');
      const useCapBack = document.getElementById('rmpUseCaptionBackColor');
      if (useCapBack) useCapBack.checked = Boolean(comp.useCaptionBackColor);
      rmpSetColor('rmpCaptionBackColor', comp.captionBackColor || '#001C38');
      const capBlink = document.getElementById('rmpCaptionBlink');
      if (capBlink) capBlink.checked = Boolean(comp.captionBlink);
      document.getElementById('rmpWordWrap').checked = comp.wordWrap !== false;
      const capBackStyle = document.getElementById('rmpCaptionBackStyle');
      if (capBackStyle) capBackStyle.value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#rampButtonForm input[name="rmpAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      const img = document.getElementById('rmpImage');
      if (img) img.value = comp.image || '';
      const imgBackStyle = document.getElementById('rmpImageBackStyle');
      if (imgBackStyle) imgBackStyle.value = comp.imageBackStyle || 'transparent';
      const useImgColor = document.getElementById('rmpUseImageColor');
      if (useImgColor) useImgColor.checked = Boolean(comp.useImageColor);
      rmpSetColor('rmpImageColor', comp.imageColor || '#ffffff');
      const useImgBack = document.getElementById('rmpUseImageBackColor');
      if (useImgBack) useImgBack.checked = Boolean(comp.useImageBackColor);
      rmpSetColor('rmpImageBackColor', comp.imageBackColor || '#001C38');
      const imgBlink = document.getElementById('rmpImageBlink');
      if (imgBlink) imgBlink.checked = Boolean(comp.imageBlink);
      const imgScaled = document.getElementById('rmpImageScaled');
      if (imgScaled) imgScaled.checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#rampButtonForm input[name="rmpImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      const rate = Number(comp.autoRepeatRate ?? 0);
      document.getElementById('rmpAutoRepeatRate').value = String(rate > 20 ? 0 : rate);
      document.getElementById('rmpAutoRepeatDelay').value = String(comp.autoRepeatDelay ?? 400);
      document.getElementById('rmpHeight').value = comp.height ?? 38;
      document.getElementById('rmpWidth').value = comp.width ?? 147;
      document.getElementById('rmpTop').value = comp.top ?? 79;
      document.getElementById('rmpLeft').value = comp.left ?? 16;
      document.getElementById('rmpName').value = comp.name || 'RampButton1';
      document.getElementById('rmpVisible').checked = comp.visible !== false;
      document.getElementById('rmpTag').value = comp.tag || '';
      document.getElementById('rmpRampTagConn').value = comp.rampTag || '';
      document.getElementById('rmpLimitTag').value = comp.limitTag || '';
      const reqSig = document.getElementById('rmpRequireESignature');
      if (reqSig) reqSig.checked = Boolean(comp.requireESignature);
      const allowBlank = document.getElementById('rmpAllowBlankComment');
      if (allowBlank) allowBlank.checked = Boolean(comp.allowBlankComment);
      const reauth = document.getElementById('rmpRequireReauth');
      if (reauth) reauth.checked = Boolean(comp.requireReauth);
      const counter = document.getElementById('rmpRequireCounterSig');
      if (counter) counter.checked = Boolean(comp.requireCounterSig);
      const group = document.getElementById('rmpAuthorizedGroup');
      if (group) group.value = comp.authorizedGroup || 'Administrators';
      const domainVisible = document.getElementById('rmpDomainVisible');
      if (domainVisible) domainVisible.checked = Boolean(comp.domainVisible);
      const domainNameMode = document.getElementById('rmpDomainNameMode');
      const domainVarMode = document.getElementById('rmpDomainVariableMode');
      if (domainNameMode) domainNameMode.checked = (comp.domainMode || 'name') !== 'variable';
      if (domainVarMode) domainVarMode.checked = (comp.domainMode || 'name') === 'variable';
      const domainName = document.getElementById('rmpDomainName');
      if (domainName) domainName.value = comp.domainName || '';
      const domainVar = document.getElementById('rmpDomainVariable');
      if (domainVar) domainVar.value = comp.domainVariable || '';
      const domainDisable = document.getElementById('rmpDomainDisable');
      if (domainDisable) domainDisable.checked = Boolean(comp.domainDisable);
      syncRampGeneralFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readRampButtonForm() {
    const caption = document.getElementById('rmpCaption')?.value ?? '';
    const dir = rmpDirection();
    const limitRaw = Number(document.getElementById('rmpLimit')?.value);
    const limitVal = Number.isFinite(limitRaw) ? limitRaw : (dir === 'rampDown' ? 0 : 100);
    if (dir === 'rampDown') rmpStoredLower = limitVal;
    else rmpStoredUpper = limitVal;
    const rateRaw = Number(document.getElementById('rmpAutoRepeatRate')?.value);
    return {
      type: 'RampButton',
      name: document.getElementById('rmpName')?.value.trim() || 'RampButton1',
      tag: document.getElementById('rmpTag')?.value.trim() || '',
      rampTag: document.getElementById('rmpRampTagConn')?.value.trim() || '',
      limitTag: document.getElementById('rmpLimitTag')?.value.trim() || '',
      operationDirection: dir,
      upperLimit: dir === 'rampUp' ? limitVal : rmpStoredUpper,
      lowerLimit: dir === 'rampDown' ? limitVal : rmpStoredLower,
      rampValue: Number(document.getElementById('rmpRampValue')?.value) || 1,
      useVariableLimit: Boolean(document.getElementById('rmpUseVariableLimit')?.checked),
      useVariableRamp: Boolean(document.getElementById('rmpUseVariableRamp')?.checked),
      autoRepeatRate: Number.isFinite(rateRaw) ? rateRaw : 0,
      autoRepeatDelay: Number(document.getElementById('rmpAutoRepeatDelay')?.value) || 400,
      caption,
      label: caption,
      left: Number(document.getElementById('rmpLeft')?.value) || 0,
      top: Number(document.getElementById('rmpTop')?.value) || 0,
      width: Number(document.getElementById('rmpWidth')?.value) || 147,
      height: Number(document.getElementById('rmpHeight')?.value) || 38,
      visible: document.getElementById('rmpVisible')?.checked !== false,
      borderStyle: document.getElementById('rmpBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('rmpBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('rmpBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('rmpBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('rmpPatternStyle')?.value || 'none',
      usePatternColor: Boolean(document.getElementById('rmpUsePatternColor')?.checked),
      patternColor: rmpGetColor('rmpPatternColor'),
      shape: document.getElementById('rmpShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: rmpGetColor('rmpBackColor'),
      useBorderColor: true,
      borderColor: rmpGetColor('rmpBorderColor'),
      useHighlightColor: true,
      highlightColor: rmpGetColor('rmpHighlightColor'),
      blink: Boolean(document.getElementById('rmpBlink')?.checked),
      buttonType: 'ramp',
      touch: true,
      audio: document.getElementById('rmpAudio')?.checked !== false,
      horizontalMargin: Number(document.getElementById('rmpHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('rmpVerticalMargin')?.value) || 0,
      fontFamily: document.getElementById('rmpFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('rmpFontSize')?.value) || 10,
      bold: document.getElementById('rmpBold')?.classList.contains('active'),
      italic: document.getElementById('rmpItalic')?.classList.contains('active'),
      underline: document.getElementById('rmpUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('rmpUseCaptionColor')?.checked),
      captionColor: rmpGetColor('rmpCaptionColor'),
      useCaptionBackColor: Boolean(document.getElementById('rmpUseCaptionBackColor')?.checked),
      captionBackColor: rmpGetColor('rmpCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('rmpCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('rmpCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('rmpWordWrap')?.checked !== false,
      alignment: document.querySelector('#rampButtonForm input[name="rmpAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('rmpImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('rmpImageBackStyle')?.value || 'transparent',
      useImageColor: Boolean(document.getElementById('rmpUseImageColor')?.checked),
      imageColor: rmpGetColor('rmpImageColor'),
      useImageBackColor: Boolean(document.getElementById('rmpUseImageBackColor')?.checked),
      imageBackColor: rmpGetColor('rmpImageBackColor'),
      imageBlink: Boolean(document.getElementById('rmpImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('rmpImageScaled')?.checked),
      imageAlignment: document.querySelector('#rampButtonForm input[name="rmpImageAlign"]:checked')?.value || 'middleCenter',
      keyAssignment: 'None',
      requireESignature: Boolean(document.getElementById('rmpRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('rmpAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('rmpRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('rmpRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('rmpAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('rmpDomainVisible')?.checked),
      domainMode: document.querySelector('#rampButtonForm input[name="rmpDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('rmpDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('rmpDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('rmpDomainDisable')?.checked)
    };
  }

  async function showRampButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Ramp button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initRampButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultRampButtonComponent({
        name: nextRampButtonName(canvas?.components),
        ...overrides
      });
      fillRampButtonForm(comp);
      window.resetPropsDialogState('ramp', readRampButtonForm, 'applyRampButton');
      switchTab('rampButtonDialog', 'rmpTab', 'rmpTabPanel', 'general');
      wireRampButtonDialogTools();
      presentRampButtonDialog();
      const previewComp = readRampButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readRampButtonForm, 'applyRampButton');
    } catch (err) {
      window.setStatus(`Ramp properties error: ${err.message}`);
    }
  }

  async function applyRampButton() {
    const comp = readRampButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readRampButtonForm, 'applyRampButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveRampButton(e) {
    e.preventDefault();
    const comp = readRampButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    rmpDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('rampButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertRmpCaptionText(text) {
    const area = document.getElementById('rmpCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleRampLivePreview();
  }

  function insertRmpCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertRmpCaptionText(tag);
    });
  }

  function hideRmpInsertVariableMenu() {
    document.getElementById('rmpInsertVariableMenu')?.classList.add('hidden');
  }

  function initRampButtonDialog() {
    const form = document.getElementById('rampButtonForm');
    if (!form || form.dataset.rmpWired === '1') return;
    form.dataset.rmpWired = '1';
    fillRampAutoRepeatRateSelect();
    window.StudioPropsShared?.fillPatternSelect('rmpPatternStyle', 'rmpFilled');
    form.addEventListener('submit', (e) => saveRampButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyRampButton')?.addEventListener('click', () => {
      applyRampButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleRampLivePreview();
      window.flushPropsApplyButton?.(readRampButtonForm, 'applyRampButton');
    });
    form.addEventListener('change', () => {
      syncRampGeneralFields();
      scheduleRampLivePreview();
      window.flushPropsApplyButton?.(readRampButtonForm, 'applyRampButton');
    });
    document.getElementById('cancelRampButton')?.addEventListener('click', () => {
      document.getElementById('rampButtonDialog')?.close();
    });
    document.getElementById('rampButtonDialog')?.addEventListener('close', () => {
      hideRmpInsertVariableMenu();
      if (!rmpDialogCommitted) window.revertPropsDialogPreview?.();
      rmpDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpRampButton')?.addEventListener('click', () => {
      alert('Ramp Button adds or subtracts the Ramp value from the Value tag while held, stopping at the Upper or Lower limit. Auto repeat rate 0–20 is repeats per second.');
    });
    document.querySelectorAll('#rampButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideRmpInsertVariableMenu();
        switchTab('rampButtonDialog', 'rmpTab', 'rmpTabPanel', tab.dataset.rmpTab);
      });
    });
    document.querySelectorAll('#rampButtonForm input[name="rmpDirection"]').forEach((el) => {
      el.addEventListener('change', () => {
        syncRampLimitLabel();
        scheduleRampLivePreview();
      });
    });
    document.getElementById('rmpBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('rmpImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('rmpImage').value = fileName;
          scheduleRampLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('rmpInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('rmpInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('rmpInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.rmpVar;
      if (!kind) return;
      hideRmpInsertVariableMenu();
      if (kind === 'timedate') insertRmpCaptionText('{#dt}');
      else insertRmpCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#rampButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideRmpInsertVariableMenu();
    });
    document.getElementById('rmpRequireESignature')?.addEventListener('change', syncRampESignatureFields);
    document.getElementById('rmpShape')?.addEventListener('change', () => {
      if (document.getElementById('rmpShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('rmpWidth')?.value) || 0;
      const h = Number(document.getElementById('rmpHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('rmpWidth').value = String(size);
      document.getElementById('rmpHeight').value = String(size);
    });
    for (const id of [
      'rmpUsePatternColor', 'rmpUseCaptionColor', 'rmpUseCaptionBackColor',
      'rmpUseImageColor', 'rmpUseImageBackColor', 'rmpCaptionBackStyle', 'rmpImageBackStyle',
      'rmpUseVariableLimit', 'rmpUseVariableRamp'
    ]) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncRampGeneralFields();
        scheduleRampLivePreview();
      });
    }
    for (const id of ['rmpBold', 'rmpItalic', 'rmpUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleRampLivePreview();
      });
    }
  }

  window.StudioLatchedMultistate = {
    initLatchedButtonDialog,
    presentLatchedButtonDialog,
    scheduleLatchedLivePreview,
    initMultistateButtonDialog,
    presentMultistateButtonDialog,
    scheduleMultistateLivePreview,
    initInterlockedButtonDialog,
    presentInterlockedButtonDialog,
    scheduleInterlockedLivePreview,
    initRampButtonDialog,
    presentRampButtonDialog,
    scheduleRampLivePreview,
    showLatchedButtonDialog,
    showMultistateButtonDialog,
    showInterlockedButtonDialog,
    showRampButtonDialog,
    fillLatchedButtonForm,
    fillMultistateButtonForm,
    fillInterlockedButtonForm,
    fillRampButtonForm,
    readLatchedButtonForm,
    readMultistateButtonForm,
    readInterlockedButtonForm,
    readRampButtonForm,
    switchLatchedButtonTab: (tabId) => switchTab('latchedButtonDialog', 'latTab', 'latTabPanel', tabId),
    switchMultistateButtonTab: (tabId) => switchTab('multistateButtonDialog', 'msTab', 'msTabPanel', tabId),
    switchInterlockedButtonTab: (tabId) => switchTab('interlockedButtonDialog', 'ilkTab', 'ilkTabPanel', tabId),
    switchRampButtonTab: (tabId) => switchTab('rampButtonDialog', 'rmpTab', 'rmpTabPanel', tabId),
    wireLatchedButtonDialogTools,
    wireMultistateButtonDialogTools,
    wireInterlockedButtonDialogTools,
    wireRampButtonDialogTools
  };
})();
