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

  function defaultLatchedButtonStates(caption = '') {
    return [
      {
        id: 'State0', value: 0, backColor: '#001C38', borderColor: '#001C38',
        useBackColor: true, useBorderColor: true, caption,
        captionColor: '#ffffff', useCaptionColor: true,
        wordWrap: true, alignment: 'middleCenter', blink: false
      },
      {
        id: 'State1', value: 1, backColor: '#001C38', borderColor: '#001C38',
        useBackColor: true, useBorderColor: true, caption,
        captionColor: '#ffffff', useCaptionColor: true,
        wordWrap: true, alignment: 'middleCenter', blink: false
      },
      {
        id: 'Error', backColor: '#001C38', borderColor: '#001C38',
        useBackColor: true, useBorderColor: true, caption: 'Error',
        captionColor: '#ffffff', useCaptionColor: true,
        wordWrap: true, alignment: 'middleCenter', blink: false
      }
    ];
  }

  function defaultMultistateButtonStates(count = 2, caption = '') {
    const states = [];
    for (let i = 0; i < count; i++) {
      states.push({
        id: `State${i}`, value: i, backColor: '#001C38', borderColor: '#001C38',
        useBackColor: true, useBorderColor: true, caption: i === 0 ? caption : '',
        captionColor: '#ffffff', useCaptionColor: true,
        wordWrap: true, alignment: 'middleCenter', blink: false
      });
    }
    states.push({
      id: 'Error', backColor: '#001C38', borderColor: '#001C38',
      useBackColor: true, useBorderColor: true, caption: 'Error',
      captionColor: '#ffffff', useCaptionColor: true,
      wordWrap: true, alignment: 'middleCenter', blink: false
    });
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

  function nextLatchedButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'LatchedButton').length + 1;
    return `LatchedButton${n}`;
  }

  function defaultLatchedButtonComponent(overrides = {}) {
    const caption = overrides.caption || overrides.label || '';
    return {
      type: 'LatchedButton',
      name: 'LatchedButton1',
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
      useHighlightColor: false,
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
      states: defaultLatchedButtonStates(caption),
      ...overrides
    };
  }

  function syncLatchedGeneralFields() {
    document.getElementById('latHighlightColor').disabled = !document.getElementById('latUseHighlightColor')?.checked;
    document.getElementById('latStateBackColor').disabled = !document.getElementById('latStateUseBackColor')?.checked;
    document.getElementById('latStateBorderColor').disabled = !document.getElementById('latStateUseBorderColor')?.checked;
    document.getElementById('latStateCaptionColor').disabled = !document.getElementById('latStateUseCaptionColor')?.checked;
    const showValue = latActiveStateId === 'State0' || latActiveStateId === 'State1';
    document.getElementById('latStateValueRow')?.classList.toggle('hidden', !showValue);
  }

  function saveLatStateToDraft() {
    if (!latStatesDraft) return;
    const id = latActiveStateId;
    const idx = latStatesDraft.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const alignment = document.querySelector('#latchedButtonForm input[name="latStateAlign"]:checked')?.value || 'middleCenter';
    const next = {
      ...latStatesDraft[idx],
      backColor: document.getElementById('latStateBackColor').value,
      borderColor: document.getElementById('latStateBorderColor').value,
      useBackColor: document.getElementById('latStateUseBackColor').checked,
      useBorderColor: document.getElementById('latStateUseBorderColor').checked,
      blink: document.getElementById('latStateBlink').checked,
      caption: document.getElementById('latStateCaption').value,
      captionColor: document.getElementById('latStateCaptionColor').value,
      useCaptionColor: document.getElementById('latStateUseCaptionColor').checked,
      wordWrap: document.getElementById('latStateWordWrap').checked,
      alignment
    };
    if (id === 'State0' || id === 'State1') {
      next.value = Number(document.getElementById('latStateValue').value);
    }
    latStatesDraft[idx] = next;
  }

  function loadLatStateFromDraft(stateId) {
    latActiveStateId = stateId;
    const state = latStatesDraft?.find((s) => s.id === stateId) || {};
    document.getElementById('latStateSelect').value = stateId;
    document.getElementById('latStateUseBackColor').checked = state.useBackColor !== false;
    document.getElementById('latStateBackColor').value = state.backColor || '#001C38';
    document.getElementById('latStateUseBorderColor').checked = Boolean(state.useBorderColor);
    document.getElementById('latStateBorderColor').value = state.borderColor || '#001C38';
    document.getElementById('latStateBlink').checked = Boolean(state.blink);
    document.getElementById('latStateCaption').value = state.caption ?? '';
    document.getElementById('latStateUseCaptionColor').checked = state.useCaptionColor !== false;
    document.getElementById('latStateCaptionColor').value = state.captionColor || '#ffffff';
    document.getElementById('latStateWordWrap').checked = state.wordWrap !== false;
    document.getElementById('latStateValue').value = state.value ?? (stateId === 'State1' ? 1 : 0);
    document.querySelector(`#latchedButtonForm input[name="latStateAlign"][value="${state.alignment || 'middleCenter'}"]`)?.click();
    syncLatchedGeneralFields();
  }

  function switchLatState(stateId) {
    saveLatStateToDraft();
    loadLatStateFromDraft(stateId);
  }

  function fillLatchedButtonForm(comp) {
    latStatesDraft = cloneStates(comp.states?.length ? comp.states : defaultLatchedButtonStates(comp.caption ?? comp.label));
    latActiveStateId = 'State0';
    latStateClipboard = null;
    const pasteBtn = document.getElementById('latStatePaste');
    if (pasteBtn) pasteBtn.disabled = true;

    document.getElementById('latBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('latBorderWidth').value = comp.borderWidth ?? 1;
    document.getElementById('latBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('latBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('latShape').value = comp.shape || 'rectangle';
    document.getElementById('latUseHighlightColor').checked = Boolean(comp.useHighlightColor);
    document.getElementById('latHighlightColor').value = comp.highlightColor || '#0066cc';
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
    document.getElementById('latName').value = comp.name || 'LatchedButton1';
    document.getElementById('latVisible').checked = comp.visible !== false;
    document.getElementById('latTouch').checked = comp.touch !== false;
    document.getElementById('latKeyAssignment').value = comp.keyAssignment || 'None';
    document.getElementById('latTag').value = comp.tag || '';
    document.getElementById('latIndicatorTag').value = comp.indicatorTag || '';
    document.getElementById('latHandshakeTag').value = comp.handshakeTag || '';
    loadLatStateFromDraft('State0');
  }

  function readLatchedButtonForm() {
    saveLatStateToDraft();
    const state0 = latStatesDraft?.find((s) => s.id === 'State0');
    const state1 = latStatesDraft?.find((s) => s.id === 'State1');
    const caption = state0?.caption ?? '';
    return {
      type: 'LatchedButton',
      name: document.getElementById('latName').value.trim() || 'LatchedButton1',
      tag: document.getElementById('latTag').value.trim(),
      indicatorTag: document.getElementById('latIndicatorTag').value.trim(),
      handshakeTag: document.getElementById('latHandshakeTag').value.trim(),
      latchResetType: document.getElementById('latLatchResetType').value || 'nonZeroValue',
      latchValue: state1?.value ?? 1,
      caption,
      label: caption,
      left: Number(document.getElementById('latLeft').value) || 0,
      top: Number(document.getElementById('latTop').value) || 0,
      width: Number(document.getElementById('latWidth').value) || 147,
      height: Number(document.getElementById('latHeight').value) || 38,
      visible: document.getElementById('latVisible').checked,
      borderStyle: document.getElementById('latBorderStyle').value,
      borderWidth: Number(document.getElementById('latBorderWidth').value) || 1,
      borderUsesBackColor: document.getElementById('latBorderUsesBackColor').checked,
      backStyle: document.getElementById('latBackStyle').value,
      shape: document.getElementById('latShape').value,
      useHighlightColor: document.getElementById('latUseHighlightColor').checked,
      highlightColor: document.getElementById('latHighlightColor').value,
      buttonType: 'latched',
      touch: document.getElementById('latTouch').checked,
      audio: document.getElementById('latAudio').checked,
      horizontalMargin: Number(document.getElementById('latHorizontalMargin').value) || 0,
      verticalMargin: Number(document.getElementById('latVerticalMargin').value) || 0,
      fontFamily: document.getElementById('latFont').value,
      fontSize: Number(document.getElementById('latFontSize').value) || 10,
      bold: document.getElementById('latBold').classList.contains('active'),
      italic: document.getElementById('latItalic').classList.contains('active'),
      underline: document.getElementById('latUnderline').classList.contains('active'),
      keyAssignment: document.getElementById('latKeyAssignment').value,
      states: cloneStates(latStatesDraft)
    };
  }

  async function showLatchedButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display or global object first, then choose Latched from Push Button');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultLatchedButtonComponent({
      name: nextLatchedButtonName(canvas?.components),
      ...overrides
    });
    fillLatchedButtonForm(comp);
    window.resetPropsDialogState('latched', readLatchedButtonForm, 'applyLatchedButton');
    switchTab('latchedButtonDialog', 'latTab', 'latTabPanel', 'general');
    wirePushButtonTools('latchedButtonDialog', syncLatchedGeneralFields);
    document.getElementById('latchedButtonDialog')?.showModal();
  }

  async function applyLatchedButton() {
    const comp = readLatchedButtonForm();
    if (!comp.tag) {
      window.setStatus('Enter a tag on the Connections tab');
      switchTab('latchedButtonDialog', 'latTab', 'latTabPanel', 'connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readLatchedButtonForm, 'applyLatchedButton');
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveLatchedButton(e) {
    e.preventDefault();
    const comp = readLatchedButtonForm();
    if (!comp.tag) {
      window.setStatus('Enter a tag on the Connections tab');
      switchTab('latchedButtonDialog', 'latTab', 'latTabPanel', 'connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    document.getElementById('latchedButtonDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initLatchedButtonDialog() {
    const form = document.getElementById('latchedButtonForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveLatchedButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyLatchedButton')?.addEventListener('click', () => {
      applyLatchedButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readLatchedButtonForm, 'applyLatchedButton'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readLatchedButtonForm, 'applyLatchedButton'));
    document.getElementById('cancelLatchedButton')?.addEventListener('click', () => {
      document.getElementById('latchedButtonDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('latchedButtonDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpLatchedButton')?.addEventListener('click', () => {
      alert('Latched Push Button writes a non-zero value on click and stays latched until the tag resets to zero (Non-zero Value reset). Handshake is an optional read-only tag.');
    });
    document.querySelectorAll('#latchedButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab('latchedButtonDialog', 'latTab', 'latTabPanel', tab.dataset.latTab));
    });
    document.getElementById('latStateSelect')?.addEventListener('change', (e) => {
      switchLatState(e.target.value);
      window.updatePropsApplyButton(readLatchedButtonForm, 'applyLatchedButton');
    });
    document.getElementById('latStateCopy')?.addEventListener('click', () => {
      saveLatStateToDraft();
      const state = latStatesDraft?.find((s) => s.id === latActiveStateId);
      if (state) {
        latStateClipboard = { ...state };
        document.getElementById('latStatePaste').disabled = false;
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
      window.updatePropsApplyButton(readLatchedButtonForm, 'applyLatchedButton');
    });
    for (const id of ['latUseHighlightColor', 'latStateUseBackColor', 'latStateUseBorderColor', 'latStateUseCaptionColor']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncLatchedGeneralFields();
        window.updatePropsApplyButton(readLatchedButtonForm, 'applyLatchedButton');
      });
    }
    for (const id of ['latBold', 'latItalic', 'latUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readLatchedButtonForm, 'applyLatchedButton');
      });
    }
  }

  // ─── Multistate ────────────────────────────────────────────────────────────

  function nextMultistateButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'MultistateButton').length + 1;
    return `MultistateButton${n}`;
  }

  function defaultMultistateButtonComponent(overrides = {}) {
    const caption = overrides.caption || overrides.label || '';
    const count = overrides.numberOfStates ?? 2;
    return {
      type: 'MultistateButton',
      name: 'MultistateButton1',
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
      useHighlightColor: false,
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
      states: defaultMultistateButtonStates(count, caption),
      ...overrides
    };
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
    if (!msStatesDraft) msStatesDraft = defaultMultistateButtonStates(count);
    const error = msStatesDraft.find((s) => s.id === 'Error') || defaultMultistateButtonStates(2)[2];
    let userStates = msStatesDraft.filter((s) => s.id !== 'Error');
    while (userStates.length < count) {
      const i = userStates.length;
      userStates.push({
        id: `State${i}`, value: i, backColor: '#001C38', borderColor: '#001C38',
        useBackColor: true, useBorderColor: true, caption: '',
        captionColor: '#ffffff', useCaptionColor: true,
        wordWrap: true, alignment: 'middleCenter', blink: false
      });
    }
    if (userStates.length > count) userStates = userStates.slice(0, count);
    userStates = userStates.map((s, i) => ({ ...s, id: `State${i}`, value: i }));
    msStatesDraft = [...userStates, error];
    rebuildMsStateSelect();
  }

  function syncMultistateGeneralFields() {
    document.getElementById('msHighlightColor').disabled = !document.getElementById('msUseHighlightColor')?.checked;
    document.getElementById('msStateBackColor').disabled = !document.getElementById('msStateUseBackColor')?.checked;
    document.getElementById('msStateBorderColor').disabled = !document.getElementById('msStateUseBorderColor')?.checked;
    document.getElementById('msStateCaptionColor').disabled = !document.getElementById('msStateUseCaptionColor')?.checked;
    const showValue = msActiveStateId !== 'Error';
    document.getElementById('msStateValueRow')?.classList.toggle('hidden', !showValue);
    const userCount = countUserStates(msStatesDraft);
    document.getElementById('msDeleteState').disabled = msActiveStateId === 'Error' || userCount <= 2;
  }

  function saveMsStateToDraft() {
    if (!msStatesDraft) return;
    const id = msActiveStateId;
    const idx = msStatesDraft.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const alignment = document.querySelector('#multistateButtonForm input[name="msStateAlign"]:checked')?.value || 'middleCenter';
    const next = {
      ...msStatesDraft[idx],
      backColor: document.getElementById('msStateBackColor').value,
      borderColor: document.getElementById('msStateBorderColor').value,
      useBackColor: document.getElementById('msStateUseBackColor').checked,
      useBorderColor: document.getElementById('msStateUseBorderColor').checked,
      blink: document.getElementById('msStateBlink').checked,
      caption: document.getElementById('msStateCaption').value,
      captionColor: document.getElementById('msStateCaptionColor').value,
      useCaptionColor: document.getElementById('msStateUseCaptionColor').checked,
      wordWrap: document.getElementById('msStateWordWrap').checked,
      alignment
    };
    if (id !== 'Error') next.value = Number(document.getElementById('msStateValue').value);
    msStatesDraft[idx] = next;
  }

  function loadMsStateFromDraft(stateId) {
    msActiveStateId = stateId;
    const state = msStatesDraft?.find((s) => s.id === stateId) || {};
    document.getElementById('msStateSelect').value = stateId;
    document.getElementById('msStateUseBackColor').checked = state.useBackColor !== false;
    document.getElementById('msStateBackColor').value = state.backColor || '#001C38';
    document.getElementById('msStateUseBorderColor').checked = Boolean(state.useBorderColor);
    document.getElementById('msStateBorderColor').value = state.borderColor || '#001C38';
    document.getElementById('msStateBlink').checked = Boolean(state.blink);
    document.getElementById('msStateCaption').value = state.caption ?? '';
    document.getElementById('msStateUseCaptionColor').checked = state.useCaptionColor !== false;
    document.getElementById('msStateCaptionColor').value = state.captionColor || '#ffffff';
    document.getElementById('msStateWordWrap').checked = state.wordWrap !== false;
    if (stateId !== 'Error') document.getElementById('msStateValue').value = state.value ?? 0;
    document.querySelector(`#multistateButtonForm input[name="msStateAlign"][value="${state.alignment || 'middleCenter'}"]`)?.click();
    syncMultistateGeneralFields();
  }

  function switchMsState(stateId) {
    saveMsStateToDraft();
    loadMsStateFromDraft(stateId);
  }

  function fillMultistateButtonForm(comp) {
    const count = comp.numberOfStates ?? (countUserStates(comp.states) || 2);
    msStatesDraft = cloneStates(comp.states?.length ? comp.states : defaultMultistateButtonStates(count, comp.caption ?? comp.label));
    msActiveStateId = 'State0';
    msStateClipboard = null;
    document.getElementById('msStatePaste').disabled = true;

    document.getElementById('msBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('msBorderWidth').value = comp.borderWidth ?? 1;
    document.getElementById('msBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('msBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('msShape').value = comp.shape || 'rectangle';
    document.getElementById('msUseHighlightColor').checked = Boolean(comp.useHighlightColor);
    document.getElementById('msHighlightColor').value = comp.highlightColor || '#0066cc';
    document.getElementById('msNumberOfStates').value = String(count);
    document.getElementById('msNextStateBasedOn').value = comp.nextStateBasedOn || 'currentState';
    document.getElementById('msAutoRepeatRate').value = String(comp.autoRepeatRate ?? 0);
    document.getElementById('msAutoRepeatDelay').value = String(comp.autoRepeatDelay ?? 400);
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
    document.getElementById('msName').value = comp.name || 'MultistateButton1';
    document.getElementById('msVisible').checked = comp.visible !== false;
    document.getElementById('msTouch').checked = comp.touch !== false;
    document.getElementById('msKeyAssignment').value = comp.keyAssignment || 'None';
    document.getElementById('msTag').value = comp.tag || '';
    document.getElementById('msIndicatorTag').value = comp.indicatorTag || '';
    rebuildMsStateSelect();
  }

  function readMultistateButtonForm() {
    saveMsStateToDraft();
    const state0 = msStatesDraft?.find((s) => s.id === 'State0');
    const caption = state0?.caption ?? '';
    return {
      type: 'MultistateButton',
      name: document.getElementById('msName').value.trim() || 'MultistateButton1',
      tag: document.getElementById('msTag').value.trim(),
      indicatorTag: document.getElementById('msIndicatorTag').value.trim(),
      numberOfStates: countUserStates(msStatesDraft),
      nextStateBasedOn: document.getElementById('msNextStateBasedOn').value || 'currentState',
      autoRepeatRate: Number(document.getElementById('msAutoRepeatRate').value) || 0,
      autoRepeatDelay: Number(document.getElementById('msAutoRepeatDelay').value) || 400,
      caption,
      label: caption,
      left: Number(document.getElementById('msLeft').value) || 0,
      top: Number(document.getElementById('msTop').value) || 0,
      width: Number(document.getElementById('msWidth').value) || 147,
      height: Number(document.getElementById('msHeight').value) || 38,
      visible: document.getElementById('msVisible').checked,
      borderStyle: document.getElementById('msBorderStyle').value,
      borderWidth: Number(document.getElementById('msBorderWidth').value) || 1,
      borderUsesBackColor: document.getElementById('msBorderUsesBackColor').checked,
      backStyle: document.getElementById('msBackStyle').value,
      shape: document.getElementById('msShape').value,
      useHighlightColor: document.getElementById('msUseHighlightColor').checked,
      highlightColor: document.getElementById('msHighlightColor').value,
      buttonType: 'multistate',
      touch: document.getElementById('msTouch').checked,
      audio: document.getElementById('msAudio').checked,
      horizontalMargin: Number(document.getElementById('msHorizontalMargin').value) || 0,
      verticalMargin: Number(document.getElementById('msVerticalMargin').value) || 0,
      fontFamily: document.getElementById('msFont').value,
      fontSize: Number(document.getElementById('msFontSize').value) || 10,
      bold: document.getElementById('msBold').classList.contains('active'),
      italic: document.getElementById('msItalic').classList.contains('active'),
      underline: document.getElementById('msUnderline').classList.contains('active'),
      keyAssignment: document.getElementById('msKeyAssignment').value,
      states: cloneStates(msStatesDraft)
    };
  }

  async function showMultistateButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display or global object first, then choose Multistate from Push Button');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultMultistateButtonComponent({
      name: nextMultistateButtonName(canvas?.components),
      ...overrides
    });
    fillMultistateButtonForm(comp);
    window.resetPropsDialogState('multistate', readMultistateButtonForm, 'applyMultistateButton');
    switchTab('multistateButtonDialog', 'msTab', 'msTabPanel', 'general');
    wirePushButtonTools('multistateButtonDialog', syncMultistateGeneralFields);
    document.getElementById('multistateButtonDialog')?.showModal();
  }

  async function applyMultistateButton() {
    const comp = readMultistateButtonForm();
    if (!comp.tag) {
      window.setStatus('Enter a tag on the Connections tab');
      switchTab('multistateButtonDialog', 'msTab', 'msTabPanel', 'connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readMultistateButtonForm, 'applyMultistateButton');
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveMultistateButton(e) {
    e.preventDefault();
    const comp = readMultistateButtonForm();
    if (!comp.tag) {
      window.setStatus('Enter a tag on the Connections tab');
      switchTab('multistateButtonDialog', 'msTab', 'msTabPanel', 'connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    document.getElementById('multistateButtonDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initMultistateButtonDialog() {
    const form = document.getElementById('multistateButtonForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveMultistateButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyMultistateButton')?.addEventListener('click', () => {
      applyMultistateButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readMultistateButtonForm, 'applyMultistateButton'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readMultistateButtonForm, 'applyMultistateButton'));
    document.getElementById('cancelMultistateButton')?.addEventListener('click', () => {
      document.getElementById('multistateButtonDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('multistateButtonDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpMultistateButton')?.addEventListener('click', () => {
      alert('Multistate Push Button cycles through configured states on each click. Hold for auto-repeat using Timing settings. Indicator supports expressions.');
    });
    document.querySelectorAll('#multistateButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab('multistateButtonDialog', 'msTab', 'msTabPanel', tab.dataset.msTab));
    });
    document.getElementById('msStateSelect')?.addEventListener('change', (e) => {
      switchMsState(e.target.value);
      window.updatePropsApplyButton(readMultistateButtonForm, 'applyMultistateButton');
    });
    document.getElementById('msNumberOfStates')?.addEventListener('change', (e) => {
      saveMsStateToDraft();
      syncMsStateCount(Number(e.target.value) || 2);
      window.updatePropsApplyButton(readMultistateButtonForm, 'applyMultistateButton');
    });
    document.getElementById('msInsertState')?.addEventListener('click', () => {
      saveMsStateToDraft();
      const count = countUserStates(msStatesDraft);
      document.getElementById('msNumberOfStates').value = String(Math.min(count + 1, 8));
      syncMsStateCount(count + 1);
      switchMsState(`State${count}`);
      window.updatePropsApplyButton(readMultistateButtonForm, 'applyMultistateButton');
    });
    document.getElementById('msDeleteState')?.addEventListener('click', () => {
      if (msActiveStateId === 'Error') return;
      saveMsStateToDraft();
      const count = countUserStates(msStatesDraft);
      if (count <= 2) return;
      msStatesDraft = msStatesDraft.filter((s) => s.id !== msActiveStateId);
      syncMsStateCount(count - 1);
      window.updatePropsApplyButton(readMultistateButtonForm, 'applyMultistateButton');
    });
    document.getElementById('msStateCopy')?.addEventListener('click', () => {
      saveMsStateToDraft();
      const state = msStatesDraft?.find((s) => s.id === msActiveStateId);
      if (state) {
        msStateClipboard = { ...state };
        document.getElementById('msStatePaste').disabled = false;
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
      window.updatePropsApplyButton(readMultistateButtonForm, 'applyMultistateButton');
    });
    for (const id of ['msUseHighlightColor', 'msStateUseBackColor', 'msStateUseBorderColor', 'msStateUseCaptionColor']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncMultistateGeneralFields();
        window.updatePropsApplyButton(readMultistateButtonForm, 'applyMultistateButton');
      });
    }
    for (const id of ['msBold', 'msItalic', 'msUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readMultistateButtonForm, 'applyMultistateButton');
      });
    }
  }

  // ─── Interlocked ───────────────────────────────────────────────────────────

  function defaultInterlockedButtonStates(caption = '') {
    return [
      {
        id: 'State0', value: 0, backColor: '#001C38', borderColor: '#001C38',
        useBackColor: true, useBorderColor: true, caption,
        captionColor: '#ffffff', useCaptionColor: true,
        wordWrap: true, alignment: 'middleLeft', blink: false
      },
      {
        id: 'State1', value: 1, backColor: '#001C38', borderColor: '#001C38',
        useBackColor: true, useBorderColor: true, caption,
        captionColor: '#ffffff', useCaptionColor: true,
        wordWrap: true, alignment: 'middleLeft', blink: false
      }
    ];
  }

  function nextInterlockedButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'InterlockedButton').length + 1;
    return `InterlockedButton${n}`;
  }

  function defaultInterlockedButtonComponent(overrides = {}) {
    const caption = overrides.caption || overrides.label || '';
    return {
      type: 'InterlockedButton',
      name: 'InterlockedButton1',
      tag: '',
      buttonValue: 1,
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
      useHighlightColor: false,
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
      states: defaultInterlockedButtonStates(caption),
      ...overrides
    };
  }

  function syncInterlockedGeneralFields() {
    document.getElementById('ilkHighlightColor').disabled = !document.getElementById('ilkUseHighlightColor')?.checked;
    document.getElementById('ilkStateBackColor').disabled = !document.getElementById('ilkStateUseBackColor')?.checked;
    document.getElementById('ilkStateBorderColor').disabled = !document.getElementById('ilkStateUseBorderColor')?.checked;
    document.getElementById('ilkStateCaptionColor').disabled = !document.getElementById('ilkStateUseCaptionColor')?.checked;
  }

  function saveIlkStateToDraft() {
    if (!ilkStatesDraft) return;
    const id = ilkActiveStateId;
    const idx = ilkStatesDraft.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const alignment = document.querySelector('#interlockedButtonForm input[name="ilkStateAlign"]:checked')?.value || 'middleLeft';
    ilkStatesDraft[idx] = {
      ...ilkStatesDraft[idx],
      backColor: document.getElementById('ilkStateBackColor').value,
      borderColor: document.getElementById('ilkStateBorderColor').value,
      useBackColor: document.getElementById('ilkStateUseBackColor').checked,
      useBorderColor: document.getElementById('ilkStateUseBorderColor').checked,
      blink: document.getElementById('ilkStateBlink').checked,
      caption: document.getElementById('ilkStateCaption').value,
      captionColor: document.getElementById('ilkStateCaptionColor').value,
      useCaptionColor: document.getElementById('ilkStateUseCaptionColor').checked,
      wordWrap: document.getElementById('ilkStateWordWrap').checked,
      alignment
    };
  }

  function loadIlkStateFromDraft(stateId) {
    ilkActiveStateId = stateId;
    const state = ilkStatesDraft?.find((s) => s.id === stateId) || {};
    document.getElementById('ilkStateSelect').value = stateId;
    document.getElementById('ilkStateUseBackColor').checked = state.useBackColor !== false;
    document.getElementById('ilkStateBackColor').value = state.backColor || '#001C38';
    document.getElementById('ilkStateUseBorderColor').checked = Boolean(state.useBorderColor);
    document.getElementById('ilkStateBorderColor').value = state.borderColor || '#001C38';
    document.getElementById('ilkStateBlink').checked = Boolean(state.blink);
    document.getElementById('ilkStateCaption').value = state.caption ?? '';
    document.getElementById('ilkStateUseCaptionColor').checked = state.useCaptionColor !== false;
    document.getElementById('ilkStateCaptionColor').value = state.captionColor || '#ffffff';
    document.getElementById('ilkStateWordWrap').checked = state.wordWrap !== false;
    document.querySelector(`#interlockedButtonForm input[name="ilkStateAlign"][value="${state.alignment || 'middleLeft'}"]`)?.click();
    syncInterlockedGeneralFields();
  }

  function switchIlkState(stateId) {
    saveIlkStateToDraft();
    loadIlkStateFromDraft(stateId);
  }

  function fillInterlockedButtonForm(comp) {
    ilkStatesDraft = cloneStates(comp.states?.length ? comp.states : defaultInterlockedButtonStates(comp.caption ?? comp.label));
    ilkActiveStateId = 'State0';
    ilkStateClipboard = null;
    const pasteBtn = document.getElementById('ilkStatePaste');
    if (pasteBtn) pasteBtn.disabled = true;

    document.getElementById('ilkBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('ilkBorderWidth').value = comp.borderWidth ?? 1;
    document.getElementById('ilkBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('ilkBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('ilkShape').value = comp.shape || 'rectangle';
    document.getElementById('ilkUseHighlightColor').checked = Boolean(comp.useHighlightColor);
    document.getElementById('ilkHighlightColor').value = comp.highlightColor || '#0066cc';
    document.getElementById('ilkButtonValue').value = comp.buttonValue ?? 1;
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
    document.getElementById('ilkName').value = comp.name || 'InterlockedButton1';
    document.getElementById('ilkVisible').checked = comp.visible !== false;
    document.getElementById('ilkTouch').checked = comp.touch !== false;
    document.getElementById('ilkKeyAssignment').value = comp.keyAssignment || 'None';
    document.getElementById('ilkTag').value = comp.tag || '';
    loadIlkStateFromDraft('State0');
  }

  function readInterlockedButtonForm() {
    saveIlkStateToDraft();
    const state0 = ilkStatesDraft?.find((s) => s.id === 'State0');
    const caption = state0?.caption ?? '';
    return {
      type: 'InterlockedButton',
      name: document.getElementById('ilkName').value.trim() || 'InterlockedButton1',
      tag: document.getElementById('ilkTag').value.trim(),
      buttonValue: Number(document.getElementById('ilkButtonValue').value) || 0,
      caption,
      label: caption,
      left: Number(document.getElementById('ilkLeft').value) || 0,
      top: Number(document.getElementById('ilkTop').value) || 0,
      width: Number(document.getElementById('ilkWidth').value) || 147,
      height: Number(document.getElementById('ilkHeight').value) || 38,
      visible: document.getElementById('ilkVisible').checked,
      borderStyle: document.getElementById('ilkBorderStyle').value,
      borderWidth: Number(document.getElementById('ilkBorderWidth').value) || 1,
      borderUsesBackColor: document.getElementById('ilkBorderUsesBackColor').checked,
      backStyle: document.getElementById('ilkBackStyle').value,
      shape: document.getElementById('ilkShape').value,
      useHighlightColor: document.getElementById('ilkUseHighlightColor').checked,
      highlightColor: document.getElementById('ilkHighlightColor').value,
      buttonType: 'interlocked',
      touch: document.getElementById('ilkTouch').checked,
      audio: document.getElementById('ilkAudio').checked,
      horizontalMargin: Number(document.getElementById('ilkHorizontalMargin').value) || 0,
      verticalMargin: Number(document.getElementById('ilkVerticalMargin').value) || 0,
      fontFamily: document.getElementById('ilkFont').value,
      fontSize: Number(document.getElementById('ilkFontSize').value) || 10,
      bold: document.getElementById('ilkBold').classList.contains('active'),
      italic: document.getElementById('ilkItalic').classList.contains('active'),
      underline: document.getElementById('ilkUnderline').classList.contains('active'),
      keyAssignment: document.getElementById('ilkKeyAssignment').value,
      states: cloneStates(ilkStatesDraft)
    };
  }

  async function showInterlockedButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display or global object first, then choose Interlocked from Push Button');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultInterlockedButtonComponent({
      name: nextInterlockedButtonName(canvas?.components),
      ...overrides
    });
    fillInterlockedButtonForm(comp);
    window.resetPropsDialogState('interlocked', readInterlockedButtonForm, 'applyInterlockedButton');
    switchTab('interlockedButtonDialog', 'ilkTab', 'ilkTabPanel', 'general');
    wirePushButtonTools('interlockedButtonDialog', syncInterlockedGeneralFields);
    document.getElementById('interlockedButtonDialog')?.showModal();
  }

  async function applyInterlockedButton() {
    const comp = readInterlockedButtonForm();
    if (!comp.tag) {
      window.setStatus('Enter a tag on the Connections tab');
      switchTab('interlockedButtonDialog', 'ilkTab', 'ilkTabPanel', 'connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readInterlockedButtonForm, 'applyInterlockedButton');
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveInterlockedButton(e) {
    e.preventDefault();
    const comp = readInterlockedButtonForm();
    if (!comp.tag) {
      window.setStatus('Enter a tag on the Connections tab');
      switchTab('interlockedButtonDialog', 'ilkTab', 'ilkTabPanel', 'connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    document.getElementById('interlockedButtonDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initInterlockedButtonDialog() {
    const form = document.getElementById('interlockedButtonForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveInterlockedButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyInterlockedButton')?.addEventListener('click', () => {
      applyInterlockedButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readInterlockedButtonForm, 'applyInterlockedButton'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readInterlockedButtonForm, 'applyInterlockedButton'));
    document.getElementById('cancelInterlockedButton')?.addEventListener('click', () => {
      document.getElementById('interlockedButtonDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('interlockedButtonDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpInterlockedButton')?.addEventListener('click', () => {
      alert('Interlocked Push Button writes the Button Value while pressed and returns to 0 on release. Appearance follows the Value tag (State0 / State1).');
    });
    document.querySelectorAll('#interlockedButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab('interlockedButtonDialog', 'ilkTab', 'ilkTabPanel', tab.dataset.ilkTab));
    });
    document.getElementById('ilkStateSelect')?.addEventListener('change', (e) => {
      switchIlkState(e.target.value);
      window.updatePropsApplyButton(readInterlockedButtonForm, 'applyInterlockedButton');
    });
    document.getElementById('ilkStateCopy')?.addEventListener('click', () => {
      saveIlkStateToDraft();
      const state = ilkStatesDraft?.find((s) => s.id === ilkActiveStateId);
      if (state) {
        ilkStateClipboard = { ...state };
        document.getElementById('ilkStatePaste').disabled = false;
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
      window.updatePropsApplyButton(readInterlockedButtonForm, 'applyInterlockedButton');
    });
    for (const id of ['ilkUseHighlightColor', 'ilkStateUseBackColor', 'ilkStateUseBorderColor', 'ilkStateUseCaptionColor']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncInterlockedGeneralFields();
        window.updatePropsApplyButton(readInterlockedButtonForm, 'applyInterlockedButton');
      });
    }
    for (const id of ['ilkBold', 'ilkItalic', 'ilkUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readInterlockedButtonForm, 'applyInterlockedButton');
      });
    }
  }

  // ─── Ramp ──────────────────────────────────────────────────────────────────

  function nextRampButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'RampButton').length + 1;
    return `RampButton${n}`;
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
      width: 182,
      height: 160,
      visible: true,
      borderStyle: 'line',
      borderWidth: 1,
      borderUsesBackColor: true,
      backStyle: 'solid',
      patternStyle: 'none',
      shape: 'rectangle',
      useBackColor: true,
      backColor: '#001C38',
      useBorderColor: true,
      borderColor: '#001C38',
      useHighlightColor: false,
      highlightColor: '#0066cc',
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
      wordWrap: true,
      alignment: 'middleCenter',
      keyAssignment: 'None',
      ...overrides
    };
  }

  function syncRampGeneralFields() {
    document.getElementById('rmpHighlightColor').disabled = !document.getElementById('rmpUseHighlightColor')?.checked;
    document.getElementById('rmpBackColor').disabled = !document.getElementById('rmpUseBackColor')?.checked;
    document.getElementById('rmpBorderColor').disabled = !document.getElementById('rmpUseBorderColor')?.checked;
    document.getElementById('rmpCaptionColor').disabled = !document.getElementById('rmpUseCaptionColor')?.checked;
    const varLimit = document.getElementById('rmpUseVariableLimit')?.checked;
    const varRamp = document.getElementById('rmpUseVariableRamp')?.checked;
    document.getElementById('rmpUpperLimit').disabled = varLimit;
    document.getElementById('rmpLowerLimit').disabled = varLimit;
    document.getElementById('rmpRampValue').disabled = varRamp;
  }

  function fillRampButtonForm(comp) {
    document.getElementById('rmpBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('rmpBorderWidth').value = comp.borderWidth ?? 1;
    document.getElementById('rmpBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('rmpBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('rmpPatternStyle').value = comp.patternStyle || 'none';
    document.getElementById('rmpShape').value = comp.shape || 'rectangle';
    document.getElementById('rmpUseBackColor').checked = comp.useBackColor !== false;
    document.getElementById('rmpBackColor').value = comp.backColor || '#001C38';
    document.getElementById('rmpUseBorderColor').checked = Boolean(comp.useBorderColor);
    document.getElementById('rmpBorderColor').value = comp.borderColor || '#001C38';
    document.getElementById('rmpUseHighlightColor').checked = Boolean(comp.useHighlightColor);
    document.getElementById('rmpHighlightColor').value = comp.highlightColor || '#0066cc';
    document.getElementById('rmpUseVariableLimit').checked = Boolean(comp.useVariableLimit);
    document.getElementById('rmpUseVariableRamp').checked = Boolean(comp.useVariableRamp);
    document.querySelector(`#rampButtonForm input[name="rmpDirection"][value="${comp.operationDirection || 'rampUp'}"]`)?.click();
    document.getElementById('rmpUpperLimit').value = comp.upperLimit ?? 100;
    document.getElementById('rmpLowerLimit').value = comp.lowerLimit ?? 0;
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
    document.getElementById('rmpUseCaptionColor').checked = comp.useCaptionColor !== false;
    document.getElementById('rmpCaptionColor').value = comp.captionColor || '#ffffff';
    document.getElementById('rmpWordWrap').checked = comp.wordWrap !== false;
    document.querySelector(`#rampButtonForm input[name="rmpAlign"][value="${comp.alignment || 'middleCenter'}"]`)?.click();
    document.getElementById('rmpAutoRepeatRate').value = String(comp.autoRepeatRate ?? 0);
    document.getElementById('rmpAutoRepeatDelay').value = String(comp.autoRepeatDelay ?? 400);
    document.getElementById('rmpHeight').value = comp.height ?? 160;
    document.getElementById('rmpWidth').value = comp.width ?? 182;
    document.getElementById('rmpTop').value = comp.top ?? 79;
    document.getElementById('rmpLeft').value = comp.left ?? 16;
    document.getElementById('rmpName').value = comp.name || 'RampButton1';
    document.getElementById('rmpVisible').checked = comp.visible !== false;
    document.getElementById('rmpTouch').checked = comp.touch !== false;
    document.getElementById('rmpKeyAssignment').value = comp.keyAssignment || 'None';
    document.getElementById('rmpTag').value = comp.tag || '';
    document.getElementById('rmpRampTagConn').value = comp.rampTag || '';
    document.getElementById('rmpLimitTag').value = comp.limitTag || '';
    syncRampGeneralFields();
  }

  function readRampButtonForm() {
    const caption = document.getElementById('rmpCaption').value;
    return {
      type: 'RampButton',
      name: document.getElementById('rmpName').value.trim() || 'RampButton1',
      tag: document.getElementById('rmpTag').value.trim(),
      rampTag: document.getElementById('rmpRampTagConn').value.trim(),
      limitTag: document.getElementById('rmpLimitTag').value.trim(),
      operationDirection: document.querySelector('#rampButtonForm input[name="rmpDirection"]:checked')?.value || 'rampUp',
      upperLimit: Number(document.getElementById('rmpUpperLimit').value) || 100,
      lowerLimit: Number(document.getElementById('rmpLowerLimit').value) || 0,
      rampValue: Number(document.getElementById('rmpRampValue').value) || 1,
      useVariableLimit: document.getElementById('rmpUseVariableLimit').checked,
      useVariableRamp: document.getElementById('rmpUseVariableRamp').checked,
      autoRepeatRate: Number(document.getElementById('rmpAutoRepeatRate').value) || 0,
      autoRepeatDelay: Number(document.getElementById('rmpAutoRepeatDelay').value) || 400,
      caption,
      label: caption,
      left: Number(document.getElementById('rmpLeft').value) || 0,
      top: Number(document.getElementById('rmpTop').value) || 0,
      width: Number(document.getElementById('rmpWidth').value) || 182,
      height: Number(document.getElementById('rmpHeight').value) || 160,
      visible: document.getElementById('rmpVisible').checked,
      borderStyle: document.getElementById('rmpBorderStyle').value,
      borderWidth: Number(document.getElementById('rmpBorderWidth').value) || 1,
      borderUsesBackColor: document.getElementById('rmpBorderUsesBackColor').checked,
      backStyle: document.getElementById('rmpBackStyle').value,
      patternStyle: document.getElementById('rmpPatternStyle').value,
      shape: document.getElementById('rmpShape').value,
      useBackColor: document.getElementById('rmpUseBackColor').checked,
      backColor: document.getElementById('rmpBackColor').value,
      useBorderColor: document.getElementById('rmpUseBorderColor').checked,
      borderColor: document.getElementById('rmpBorderColor').value,
      useHighlightColor: document.getElementById('rmpUseHighlightColor').checked,
      highlightColor: document.getElementById('rmpHighlightColor').value,
      buttonType: 'ramp',
      touch: document.getElementById('rmpTouch').checked,
      audio: document.getElementById('rmpAudio').checked,
      horizontalMargin: Number(document.getElementById('rmpHorizontalMargin').value) || 0,
      verticalMargin: Number(document.getElementById('rmpVerticalMargin').value) || 0,
      fontFamily: document.getElementById('rmpFont').value,
      fontSize: Number(document.getElementById('rmpFontSize').value) || 10,
      bold: document.getElementById('rmpBold').classList.contains('active'),
      italic: document.getElementById('rmpItalic').classList.contains('active'),
      underline: document.getElementById('rmpUnderline').classList.contains('active'),
      useCaptionColor: document.getElementById('rmpUseCaptionColor').checked,
      captionColor: document.getElementById('rmpCaptionColor').value,
      wordWrap: document.getElementById('rmpWordWrap').checked,
      alignment: document.querySelector('#rampButtonForm input[name="rmpAlign"]:checked')?.value || 'middleCenter',
      keyAssignment: document.getElementById('rmpKeyAssignment').value
    };
  }

  async function showRampButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display or global object first, then choose Ramp from Push Button');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultRampButtonComponent({
      name: nextRampButtonName(canvas?.components),
      ...overrides
    });
    fillRampButtonForm(comp);
    window.resetPropsDialogState('ramp', readRampButtonForm, 'applyRampButton');
    switchTab('rampButtonDialog', 'rmpTab', 'rmpTabPanel', 'general');
    wirePushButtonTools('rampButtonDialog', syncRampGeneralFields);
    document.getElementById('rampButtonDialog')?.showModal();
  }

  async function applyRampButton() {
    const comp = readRampButtonForm();
    if (!comp.tag) {
      window.setStatus('Enter a Value tag on the Connections tab');
      switchTab('rampButtonDialog', 'rmpTab', 'rmpTabPanel', 'connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readRampButtonForm, 'applyRampButton');
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveRampButton(e) {
    e.preventDefault();
    const comp = readRampButtonForm();
    if (!comp.tag) {
      window.setStatus('Enter a Value tag on the Connections tab');
      switchTab('rampButtonDialog', 'rmpTab', 'rmpTabPanel', 'connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    document.getElementById('rampButtonDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initRampButtonDialog() {
    const form = document.getElementById('rampButtonForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveRampButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyRampButton')?.addEventListener('click', () => {
      applyRampButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readRampButtonForm, 'applyRampButton'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readRampButtonForm, 'applyRampButton'));
    document.getElementById('cancelRampButton')?.addEventListener('click', () => {
      document.getElementById('rampButtonDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('rampButtonDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpRampButton')?.addEventListener('click', () => {
      alert('Ramp Push Button increments or decrements the Value tag while held. Configure ramp step, limits, and auto-repeat on Timing.');
    });
    document.querySelectorAll('#rampButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab('rampButtonDialog', 'rmpTab', 'rmpTabPanel', tab.dataset.rmpTab));
    });
    for (const id of ['rmpUseHighlightColor', 'rmpUseBackColor', 'rmpUseBorderColor', 'rmpUseCaptionColor', 'rmpUseVariableLimit', 'rmpUseVariableRamp']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncRampGeneralFields();
        window.updatePropsApplyButton(readRampButtonForm, 'applyRampButton');
      });
    }
    for (const id of ['rmpBold', 'rmpItalic', 'rmpUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readRampButtonForm, 'applyRampButton');
      });
    }
  }

  window.StudioLatchedMultistate = {
    initLatchedButtonDialog,
    initMultistateButtonDialog,
    initInterlockedButtonDialog,
    initRampButtonDialog,
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
    wireLatchedButtonDialogTools: () => wirePushButtonTools('latchedButtonDialog', syncLatchedGeneralFields),
    wireMultistateButtonDialogTools: () => wirePushButtonTools('multistateButtonDialog', syncMultistateGeneralFields),
    wireInterlockedButtonDialogTools: () => wirePushButtonTools('interlockedButtonDialog', syncInterlockedGeneralFields),
    wireRampButtonDialogTools: () => wirePushButtonTools('rampButtonDialog', syncRampGeneralFields)
  };
})();
