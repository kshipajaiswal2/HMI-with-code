/** Multistate Indicator property dialog */
(function () {
  let miStatesDraft = null;
  let miActiveStateId = 'State0';
  let miStateClipboard = null;

  function cloneStates(states) {
    return (states || []).map((s) => ({ ...s }));
  }

  function defaultMultistateIndicatorState(i, overrides = {}) {
    return {
      id: `State${i}`,
      value: i,
      useBackColor: true,
      backColor: '#001C38',
      useBorderColor: true,
      borderColor: '#001C38',
      blink: false,
      patternStyle: 'none',
      usePatternColor: false,
      patternColor: '#ffffff',
      caption: '',
      useCaptionColor: true,
      captionColor: '#ffffff',
      useCaptionBackColor: false,
      captionBackColor: '#001C38',
      captionBlink: false,
      wordWrap: true,
      alignment: 'middleCenter',
      captionBackStyle: 'transparent',
      image: '',
      useImageColor: false,
      imageColor: '#ffffff',
      useImageBackColor: false,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: false,
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      ...overrides
    };
  }

  function defaultErrorState() {
    return {
      id: 'Error',
      useBackColor: true,
      backColor: '#001C38',
      useBorderColor: true,
      borderColor: '#001C38',
      blink: false,
      patternStyle: 'none',
      usePatternColor: false,
      patternColor: '#ffffff',
      caption: 'Error',
      useCaptionColor: true,
      captionColor: '#ffffff',
      useCaptionBackColor: false,
      captionBackColor: '#001C38',
      captionBlink: false,
      wordWrap: true,
      alignment: 'middleCenter',
      captionBackStyle: 'transparent',
      image: '',
      useImageColor: false,
      imageColor: '#ffffff',
      useImageBackColor: false,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: false,
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter'
    };
  }

  function defaultMultistateIndicatorStates(count = 4) {
    const states = [];
    for (let i = 0; i < count; i++) states.push(defaultMultistateIndicatorState(i));
    states.push(defaultErrorState());
    return states;
  }

  function countUserStates(states) {
    return (states || []).filter((s) => s.id !== 'Error').length;
  }

  function ensureErrorState(states) {
    const draft = cloneStates(states || []);
    if (!draft.some((s) => s.id === 'Error')) draft.push(defaultErrorState());
    return draft;
  }

  function switchTab(tabId) {
    document.querySelectorAll('#multistateIndicatorDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.miTab === tabId);
    });
    document.querySelectorAll('#multistateIndicatorDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.miTabPanel === tabId);
    });
  }

  function nextMultistateIndicatorName(components) {
    const n = (components || []).filter((c) => c.type === 'MultistateIndicator').length + 1;
    return `MultistateIndicator${n}`;
  }

  function defaultMultistateIndicatorComponent(overrides = {}) {
    const count = overrides.numberOfStates ?? 4;
    return {
      type: 'MultistateIndicator',
      name: 'MultistateIndicator1',
      tag: '',
      numberOfStates: count,
      triggerType: 'value',
      left: 16,
      top: 16,
      width: 71,
      height: 33,
      visible: true,
      borderStyle: 'raisedInset',
      borderWidth: 1,
      borderUsesBackColor: true,
      backStyle: 'solid',
      shape: 'rectangle',
      fontFamily: 'Tahoma',
      fontSize: 13,
      bold: false,
      italic: false,
      underline: false,
      states: defaultMultistateIndicatorStates(count),
      ...overrides
    };
  }

  function rebuildMiStateSelect() {
    const sel = document.getElementById('miStateSelect');
    if (!sel || !miStatesDraft) return;
    const prev = miActiveStateId;
    sel.innerHTML = miStatesDraft.map((s) => `<option value="${s.id}">${s.id}</option>`).join('');
    const next = miStatesDraft.some((s) => s.id === prev) ? prev : miStatesDraft[0]?.id || 'State0';
    sel.value = next;
    loadMiStateFromDraft(next);
  }

  function syncMiStateCount(count) {
    if (!miStatesDraft) miStatesDraft = defaultMultistateIndicatorStates(count);
    const error = miStatesDraft.find((s) => s.id === 'Error') || defaultErrorState();
    let userStates = miStatesDraft.filter((s) => s.id !== 'Error');
    while (userStates.length < count) {
      const i = userStates.length;
      userStates.push(defaultMultistateIndicatorState(i));
    }
    if (userStates.length > count) userStates = userStates.slice(0, count);
    userStates = userStates.map((s, i) => ({ ...s, id: `State${i}`, value: i }));
    miStatesDraft = [...userStates, error];
    rebuildMiStateSelect();
  }

  function syncMiFields() {
    const isError = miActiveStateId === 'Error';
    document.getElementById('miStateValueRow')?.classList.toggle('hidden', isError);
    document.getElementById('miStateBackColor').disabled = !document.getElementById('miStateUseBackColor')?.checked;
    document.getElementById('miStateBorderColor').disabled = !document.getElementById('miStateUseBorderColor')?.checked;
    document.getElementById('miStatePatternColor').disabled = !document.getElementById('miStateUsePatternColor')?.checked;
    document.getElementById('miStateCaptionColor').disabled = !document.getElementById('miStateUseCaptionColor')?.checked;
    document.getElementById('miStateCaptionBackColor').disabled = !document.getElementById('miStateUseCaptionBackColor')?.checked;
    document.getElementById('miStateImageColor').disabled = !document.getElementById('miStateUseImageColor')?.checked;
    document.getElementById('miStateImageBackColor').disabled = !document.getElementById('miStateUseImageBackColor')?.checked;
    const userCount = countUserStates(miStatesDraft);
    document.getElementById('miDeleteState').disabled = userCount <= 2;
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('multistateIndicatorDialog'));
    syncMiFields();
  }

  function saveMiStateToDraft() {
    if (!miStatesDraft) return;
    const id = miActiveStateId;
    const idx = miStatesDraft.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const next = {
      ...miStatesDraft[idx],
      useBackColor: document.getElementById('miStateUseBackColor').checked,
      backColor: document.getElementById('miStateBackColor').value,
      useBorderColor: document.getElementById('miStateUseBorderColor').checked,
      borderColor: document.getElementById('miStateBorderColor').value,
      blink: document.getElementById('miStateBlink').checked,
      patternStyle: document.getElementById('miStatePatternStyle').value,
      usePatternColor: document.getElementById('miStateUsePatternColor').checked,
      patternColor: document.getElementById('miStatePatternColor').value,
      caption: document.getElementById('miStateCaption').value,
      useCaptionColor: document.getElementById('miStateUseCaptionColor').checked,
      captionColor: document.getElementById('miStateCaptionColor').value,
      useCaptionBackColor: document.getElementById('miStateUseCaptionBackColor').checked,
      captionBackColor: document.getElementById('miStateCaptionBackColor').value,
      captionBlink: document.getElementById('miStateCaptionBlink').checked,
      wordWrap: document.getElementById('miStateWordWrap').checked,
      alignment: document.querySelector('#multistateIndicatorForm input[name="miStateAlign"]:checked')?.value || 'middleCenter',
      captionBackStyle: document.getElementById('miStateCaptionBackStyle').value,
      image: document.getElementById('miStateImage').value.trim(),
      useImageColor: document.getElementById('miStateUseImageColor').checked,
      imageColor: document.getElementById('miStateImageColor').value,
      useImageBackColor: document.getElementById('miStateUseImageBackColor').checked,
      imageBackColor: document.getElementById('miStateImageBackColor').value,
      imageBlink: document.getElementById('miStateImageBlink').checked,
      imageScaled: document.getElementById('miStateImageScaled').checked,
      imageBackStyle: document.getElementById('miStateImageBackStyle').value,
      imageAlignment: document.querySelector('#multistateIndicatorForm input[name="miStateImageAlign"]:checked')?.value || 'middleCenter'
    };
    if (id !== 'Error') next.value = Number(document.getElementById('miStateValue').value);
    miStatesDraft[idx] = next;
  }

  function loadMiStateFromDraft(stateId) {
    miActiveStateId = stateId;
    const state = miStatesDraft?.find((s) => s.id === stateId) || {};
    document.getElementById('miStateSelect').value = stateId;
    document.getElementById('miStateUseBackColor').checked = state.useBackColor !== false;
    document.getElementById('miStateBackColor').value = state.backColor || '#001C38';
    document.getElementById('miStateUseBorderColor').checked = state.useBorderColor !== false;
    document.getElementById('miStateBorderColor').value = state.borderColor || '#001C38';
    document.getElementById('miStateBlink').checked = Boolean(state.blink);
    document.getElementById('miStatePatternStyle').value = state.patternStyle || 'none';
    document.getElementById('miStateUsePatternColor').checked = Boolean(state.usePatternColor);
    document.getElementById('miStatePatternColor').value = state.patternColor || '#ffffff';
    document.getElementById('miStateCaption').value = state.caption ?? '';
    document.getElementById('miStateUseCaptionColor').checked = state.useCaptionColor !== false;
    document.getElementById('miStateCaptionColor').value = state.captionColor || '#ffffff';
    document.getElementById('miStateUseCaptionBackColor').checked = Boolean(state.useCaptionBackColor);
    document.getElementById('miStateCaptionBackColor').value = state.captionBackColor || '#001C38';
    document.getElementById('miStateCaptionBlink').checked = Boolean(state.captionBlink);
    document.getElementById('miStateWordWrap').checked = state.wordWrap !== false;
    document.getElementById('miStateCaptionBackStyle').value = state.captionBackStyle || 'transparent';
    document.getElementById('miStateImage').value = state.image || '';
    document.getElementById('miStateUseImageColor').checked = Boolean(state.useImageColor);
    document.getElementById('miStateImageColor').value = state.imageColor || '#ffffff';
    document.getElementById('miStateUseImageBackColor').checked = Boolean(state.useImageBackColor);
    document.getElementById('miStateImageBackColor').value = state.imageBackColor || '#001C38';
    document.getElementById('miStateImageBlink').checked = Boolean(state.imageBlink);
    document.getElementById('miStateImageScaled').checked = Boolean(state.imageScaled);
    document.getElementById('miStateImageBackStyle').value = state.imageBackStyle || 'transparent';
    document.getElementById('miStateValue').value = state.value ?? 0;
    document.querySelector(`#multistateIndicatorForm input[name="miStateAlign"][value="${state.alignment || 'middleCenter'}"]`)?.click();
    document.querySelector(`#multistateIndicatorForm input[name="miStateImageAlign"][value="${state.imageAlignment || 'middleCenter'}"]`)?.click();
    syncMiFields();
  }

  function switchMiState(stateId) {
    saveMiStateToDraft();
    loadMiStateFromDraft(stateId);
  }

  function normalizeLoadedStates(states, count) {
    let draft = ensureErrorState(states);
    const error = draft.find((s) => s.id === 'Error');
    let userStates = draft.filter((s) => s.id !== 'Error').map((s, i) => ({
      ...defaultMultistateIndicatorState(i, s),
      id: `State${i}`,
      value: s.value ?? i
    }));
    while (userStates.length < count) userStates.push(defaultMultistateIndicatorState(userStates.length));
    if (userStates.length > count) userStates = userStates.slice(0, count);
    userStates = userStates.map((s, i) => ({ ...s, id: `State${i}`, value: s.value ?? i }));
    return [...userStates, { ...defaultErrorState(), ...error, id: 'Error' }];
  }

  function fillMultistateIndicatorForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    const count = comp.numberOfStates ?? countUserStates(comp.states) ?? 4;
    miStatesDraft = normalizeLoadedStates(comp.states, count);
    miActiveStateId = 'State0';
    miStateClipboard = null;
    document.getElementById('miStatePaste').disabled = true;

    document.getElementById('miBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('miBorderWidth').value = comp.borderWidth ?? 4;
    document.getElementById('miBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('miBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('miShape').value = comp.shape || 'rectangle';
    document.getElementById('miNumberOfStates').value = String(count);
    document.getElementById('miTriggerType').value = comp.triggerType || 'value';
    document.getElementById('miTag').value = comp.tag || '';
    document.getElementById('miFont').value = comp.fontFamily || 'Tahoma';
    document.getElementById('miFontSize').value = String(comp.fontSize ?? 13);
    document.getElementById('miBold').classList.toggle('active', Boolean(comp.bold));
    document.getElementById('miItalic').classList.toggle('active', Boolean(comp.italic));
    document.getElementById('miUnderline').classList.toggle('active', Boolean(comp.underline));
    document.getElementById('miHeight').value = comp.height ?? 33;
    document.getElementById('miWidth').value = comp.width ?? 71;
    document.getElementById('miTop').value = comp.top ?? 16;
    document.getElementById('miLeft').value = comp.left ?? 16;
    document.getElementById('miName').value = comp.name || 'MultistateIndicator1';
    document.getElementById('miVisible').checked = comp.visible !== false;
    rebuildMiStateSelect();
    if (window.state) window.state.propsFormFill = false;
  }

  function readMultistateIndicatorForm() {
    saveMiStateToDraft();
    return {
      type: 'MultistateIndicator',
      name: document.getElementById('miName').value.trim() || 'MultistateIndicator1',
      tag: document.getElementById('miTag').value.trim(),
      numberOfStates: countUserStates(miStatesDraft),
      triggerType: document.getElementById('miTriggerType').value,
      left: Number(document.getElementById('miLeft').value) || 0,
      top: Number(document.getElementById('miTop').value) || 0,
      width: Number(document.getElementById('miWidth').value) || 71,
      height: Number(document.getElementById('miHeight').value) || 33,
      visible: document.getElementById('miVisible').checked,
      borderStyle: document.getElementById('miBorderStyle').value,
      borderWidth: Number(document.getElementById('miBorderWidth').value) || 4,
      borderUsesBackColor: document.getElementById('miBorderUsesBackColor').checked,
      backStyle: document.getElementById('miBackStyle').value,
      shape: document.getElementById('miShape').value,
      fontFamily: document.getElementById('miFont').value,
      fontSize: Number(document.getElementById('miFontSize').value) || 10,
      bold: document.getElementById('miBold').classList.contains('active'),
      italic: document.getElementById('miItalic').classList.contains('active'),
      underline: document.getElementById('miUnderline').classList.contains('active'),
      states: cloneStates(miStatesDraft)
    };
  }

  function validateMultistateIndicator(comp) {
    if (!comp.tag) {
      window.setStatus('Connect an Indicator tag on the Connections tab');
      switchTab('connections');
      return false;
    }
    return true;
  }

  async function showMultistateIndicatorDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then choose Multistate Indicator');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultMultistateIndicatorComponent({
      name: nextMultistateIndicatorName(canvas?.components),
      ...overrides
    });
    fillMultistateIndicatorForm(comp);
    window.resetPropsDialogState('multistate-indicator', readMultistateIndicatorForm, 'applyMultistateIndicator');
    switchTab('general');
    wireTools();
    document.getElementById('multistateIndicatorDialog')?.showModal();
  }

  async function applyMultistateIndicator() {
    const comp = readMultistateIndicatorForm();
    if (!validateMultistateIndicator(comp)) return;
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readMultistateIndicatorForm, 'applyMultistateIndicator');
    window.state.canvasSelection.index = window.state.propsDialog.editIndex;
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveMultistateIndicator(e) {
    e.preventDefault();
    const comp = readMultistateIndicatorForm();
    if (!validateMultistateIndicator(comp)) return;
    await window.upsertCanvasComponent(comp);
    document.getElementById('multistateIndicatorDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initMultistateIndicatorDialog() {
    const form = document.getElementById('multistateIndicatorForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveMultistateIndicator(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyMultistateIndicator')?.addEventListener('click', () => {
      applyMultistateIndicator().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readMultistateIndicatorForm, 'applyMultistateIndicator'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readMultistateIndicatorForm, 'applyMultistateIndicator'));
    document.getElementById('cancelMultistateIndicator')?.addEventListener('click', () => {
      document.getElementById('multistateIndicatorDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('multistateIndicatorDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpMultistateIndicator')?.addEventListener('click', () => {
      alert('Multistate Indicator displays different appearances based on a tag value. Configure states and connect the Indicator tag on the Connections tab.');
    });
    document.querySelectorAll('#multistateIndicatorDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.miTab));
    });
    document.getElementById('miStateSelect')?.addEventListener('change', (e) => switchMiState(e.target.value));
    document.getElementById('miNumberOfStates')?.addEventListener('change', (e) => {
      syncMiStateCount(Number(e.target.value) || 4);
      window.updatePropsApplyButton(readMultistateIndicatorForm, 'applyMultistateIndicator');
    });
    document.getElementById('miInsertState')?.addEventListener('click', () => {
      saveMiStateToDraft();
      const count = Math.min(8, countUserStates(miStatesDraft) + 1);
      document.getElementById('miNumberOfStates').value = String(count);
      syncMiStateCount(count);
      switchMiState(`State${count - 1}`);
      window.updatePropsApplyButton(readMultistateIndicatorForm, 'applyMultistateIndicator');
    });
    document.getElementById('miDeleteState')?.addEventListener('click', () => {
      if (countUserStates(miStatesDraft) <= 2) return;
      saveMiStateToDraft();
      const idx = miStatesDraft.findIndex((s) => s.id === miActiveStateId);
      if (idx >= 0 && miActiveStateId !== 'Error') miStatesDraft.splice(idx, 1);
      const count = countUserStates(miStatesDraft);
      document.getElementById('miNumberOfStates').value = String(count);
      syncMiStateCount(count);
      window.updatePropsApplyButton(readMultistateIndicatorForm, 'applyMultistateIndicator');
    });
    document.getElementById('miStateCopy')?.addEventListener('click', () => {
      saveMiStateToDraft();
      const state = miStatesDraft?.find((s) => s.id === miActiveStateId);
      if (state) {
        miStateClipboard = { ...state };
        document.getElementById('miStatePaste').disabled = false;
      }
    });
    document.getElementById('miStatePaste')?.addEventListener('click', () => {
      if (!miStateClipboard) return;
      saveMiStateToDraft();
      const idx = miStatesDraft.findIndex((s) => s.id === miActiveStateId);
      if (idx >= 0) {
        miStatesDraft[idx] = { ...miStateClipboard, id: miStatesDraft[idx].id, value: miStatesDraft[idx].value };
        loadMiStateFromDraft(miActiveStateId);
        window.updatePropsApplyButton(readMultistateIndicatorForm, 'applyMultistateIndicator');
      }
    });
    document.getElementById('miBrowseStateImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('miStateImage').value || null })
        .then((fileName) => {
          if (fileName) {
            document.getElementById('miStateImage').value = fileName;
            window.updatePropsApplyButton(readMultistateIndicatorForm, 'applyMultistateIndicator');
          }
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    for (const id of [
      'miStateUseBackColor', 'miStateUseBorderColor', 'miStateUsePatternColor',
      'miStateUseCaptionColor', 'miStateUseCaptionBackColor', 'miStateUseImageColor', 'miStateUseImageBackColor'
    ]) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncMiFields();
        window.updatePropsApplyButton(readMultistateIndicatorForm, 'applyMultistateIndicator');
      });
    }
    for (const id of ['miBold', 'miItalic', 'miUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readMultistateIndicatorForm, 'applyMultistateIndicator');
      });
    }
  }

  window.StudioMultistateIndicator = {
    initMultistateIndicatorDialog,
    showMultistateIndicatorDialog,
    fillMultistateIndicatorForm,
    readMultistateIndicatorForm,
    switchMultistateIndicatorTab: switchTab,
    wireMultistateIndicatorTools: wireTools
  };
})();
