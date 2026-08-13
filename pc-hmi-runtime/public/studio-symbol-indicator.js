/** Symbol Indicator property dialog */
(function () {
  let siStatesDraft = null;
  let siActiveStateId = 'State0';
  let siStateClipboard = null;

  function cloneStates(states) {
    return (states || []).map((s) => ({ ...s }));
  }

  function defaultSymbolIndicatorState(i, overrides = {}) {
    return {
      id: `State${i}`,
      value: i,
      image: '',
      useImageColor: false,
      imageColor: '#ffffff',
      useImageBackColor: false,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: true,
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      ...overrides
    };
  }

  function defaultErrorState(overrides = {}) {
    return {
      id: 'Error',
      image: '',
      useImageColor: false,
      imageColor: '#ffffff',
      useImageBackColor: false,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: true,
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      ...overrides
    };
  }

  function defaultSymbolIndicatorStates(count = 2, firstImage = '') {
    const states = [];
    for (let i = 0; i < count; i++) {
      states.push(defaultSymbolIndicatorState(i, i === 0 && firstImage ? { image: firstImage } : {}));
    }
    states.push(defaultErrorState());
    return states;
  }

  function countUserStates(states) {
    return (states || []).filter((s) => s.id !== 'Error').length;
  }

  function switchTab(tabId) {
    document.querySelectorAll('#symbolIndicatorDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.siTab === tabId);
    });
    document.querySelectorAll('#symbolIndicatorDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.siTabPanel === tabId);
    });
  }

  function nextSymbolIndicatorName(components) {
    const n = (components || []).filter((c) => c.type === 'SymbolIndicator').length + 1;
    return `SymbolIndicator${n}`;
  }

  function defaultSymbolIndicatorComponent(overrides = {}) {
    const count = overrides.numberOfStates ?? 2;
    const firstImage = overrides.initialImage || overrides.states?.[0]?.image || '';
    return {
      type: 'SymbolIndicator',
      name: 'SymbolIndicator1',
      tag: '',
      numberOfStates: count,
      triggerType: 'value',
      left: 16,
      top: 16,
      width: 64,
      height: 64,
      visible: true,
      states: defaultSymbolIndicatorStates(count, firstImage),
      ...overrides
    };
  }

  function rebuildSiStateSelect() {
    const sel = document.getElementById('siStateSelect');
    if (!sel || !siStatesDraft) return;
    const prev = siActiveStateId;
    sel.innerHTML = siStatesDraft.map((s) => `<option value="${s.id}">${s.id}</option>`).join('');
    const next = siStatesDraft.some((s) => s.id === prev) ? prev : siStatesDraft[0]?.id || 'State0';
    sel.value = next;
    loadSiStateFromDraft(next);
  }

  function syncSiStateCount(count) {
    if (!siStatesDraft) siStatesDraft = defaultSymbolIndicatorStates(count);
    const error = siStatesDraft.find((s) => s.id === 'Error') || defaultErrorState();
    let userStates = siStatesDraft.filter((s) => s.id !== 'Error');
    while (userStates.length < count) userStates.push(defaultSymbolIndicatorState(userStates.length));
    if (userStates.length > count) userStates = userStates.slice(0, count);
    userStates = userStates.map((s, i) => ({ ...s, id: `State${i}`, value: i }));
    siStatesDraft = [...userStates, error];
    rebuildSiStateSelect();
  }

  function syncSiFields() {
    const isError = siActiveStateId === 'Error';
    document.getElementById('siStateValueRow')?.classList.toggle('hidden', isError);
    document.getElementById('siStateImageColor').disabled = !document.getElementById('siStateUseImageColor')?.checked;
    document.getElementById('siStateImageBackColor').disabled = !document.getElementById('siStateUseImageBackColor')?.checked;
    document.getElementById('siDeleteState').disabled = countUserStates(siStatesDraft) <= 2;
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('symbolIndicatorDialog'));
    syncSiFields();
  }

  function saveSiStateToDraft() {
    if (!siStatesDraft) return;
    const id = siActiveStateId;
    const idx = siStatesDraft.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const next = {
      ...siStatesDraft[idx],
      image: document.getElementById('siStateImage').value.trim(),
      useImageColor: document.getElementById('siStateUseImageColor').checked,
      imageColor: document.getElementById('siStateImageColor').value,
      useImageBackColor: document.getElementById('siStateUseImageBackColor').checked,
      imageBackColor: document.getElementById('siStateImageBackColor').value,
      imageBlink: document.getElementById('siStateImageBlink').checked,
      imageScaled: document.getElementById('siStateImageScaled').checked,
      imageBackStyle: document.getElementById('siStateImageBackStyle').value,
      imageAlignment: document.querySelector('#symbolIndicatorForm input[name="siStateImageAlign"]:checked')?.value || 'middleCenter'
    };
    if (id !== 'Error') next.value = Number(document.getElementById('siStateValue').value);
    siStatesDraft[idx] = next;
  }

  function loadSiStateFromDraft(stateId) {
    siActiveStateId = stateId;
    const state = siStatesDraft?.find((s) => s.id === stateId) || {};
    document.getElementById('siStateSelect').value = stateId;
    document.getElementById('siStateImage').value = state.image || '';
    document.getElementById('siStateUseImageColor').checked = Boolean(state.useImageColor);
    document.getElementById('siStateImageColor').value = state.imageColor || '#ffffff';
    document.getElementById('siStateUseImageBackColor').checked = Boolean(state.useImageBackColor);
    document.getElementById('siStateImageBackColor').value = state.imageBackColor || '#001C38';
    document.getElementById('siStateImageBlink').checked = Boolean(state.imageBlink);
    document.getElementById('siStateImageScaled').checked = state.imageScaled !== false;
    document.getElementById('siStateImageBackStyle').value = state.imageBackStyle || 'transparent';
    document.getElementById('siStateValue').value = state.value ?? 0;
    document.querySelector(`#symbolIndicatorForm input[name="siStateImageAlign"][value="${state.imageAlignment || 'middleCenter'}"]`)?.click();
    syncSiFields();
  }

  function switchSiState(stateId) {
    saveSiStateToDraft();
    loadSiStateFromDraft(stateId);
  }

  function normalizeLoadedStates(states, count) {
    let draft = cloneStates(states || []);
    const error = draft.find((s) => s.id === 'Error') || defaultErrorState();
    let userStates = draft.filter((s) => s.id !== 'Error').map((s, i) => ({
      ...defaultSymbolIndicatorState(i, s),
      id: `State${i}`,
      value: s.value ?? i
    }));
    while (userStates.length < count) userStates.push(defaultSymbolIndicatorState(userStates.length));
    if (userStates.length > count) userStates = userStates.slice(0, count);
    userStates = userStates.map((s, i) => ({ ...s, id: `State${i}`, value: s.value ?? i }));
    return [...userStates, { ...defaultErrorState(), ...error, id: 'Error' }];
  }

  function fillSymbolIndicatorForm(comp) {
    const count = comp.numberOfStates ?? countUserStates(comp.states) ?? 2;
    siStatesDraft = normalizeLoadedStates(comp.states, count);
    siActiveStateId = 'State0';
    siStateClipboard = null;
    document.getElementById('siStatePaste').disabled = true;

    document.getElementById('siNumberOfStates').value = String(count);
    document.getElementById('siTriggerType').value = comp.triggerType || 'value';
    document.getElementById('siTag').value = comp.tag || '';
    document.getElementById('siHeight').value = comp.height ?? 64;
    document.getElementById('siWidth').value = comp.width ?? 64;
    document.getElementById('siTop').value = comp.top ?? 16;
    document.getElementById('siLeft').value = comp.left ?? 16;
    document.getElementById('siName').value = comp.name || 'SymbolIndicator1';
    document.getElementById('siVisible').checked = comp.visible !== false;
    rebuildSiStateSelect();
  }

  function readSymbolIndicatorForm() {
    saveSiStateToDraft();
    return {
      type: 'SymbolIndicator',
      name: document.getElementById('siName').value.trim() || 'SymbolIndicator1',
      tag: document.getElementById('siTag').value.trim(),
      numberOfStates: countUserStates(siStatesDraft),
      triggerType: document.getElementById('siTriggerType').value,
      left: Number(document.getElementById('siLeft').value) || 0,
      top: Number(document.getElementById('siTop').value) || 0,
      width: Number(document.getElementById('siWidth').value) || 64,
      height: Number(document.getElementById('siHeight').value) || 64,
      visible: document.getElementById('siVisible').checked,
      states: cloneStates(siStatesDraft)
    };
  }

  function validateSymbolIndicator(comp) {
    if (!comp.tag) {
      window.setStatus('Connect an Indicator tag on the Connections tab');
      switchTab('connections');
      return false;
    }
    const hasImage = (comp.states || []).some((s) => s.image);
    if (!hasImage) {
      window.setStatus('Assign a symbol image for at least one state');
      switchTab('states');
      return false;
    }
    return true;
  }

  async function showSymbolIndicatorDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then choose Symbol Indicator');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultSymbolIndicatorComponent({
      name: nextSymbolIndicatorName(canvas?.components),
      ...overrides
    });
    fillSymbolIndicatorForm(comp);
    window.resetPropsDialogState('symbol-indicator', readSymbolIndicatorForm, 'applySymbolIndicator');
    switchTab('general');
    wireTools();
    document.getElementById('symbolIndicatorDialog')?.showModal();
  }

  async function applySymbolIndicator() {
    const comp = readSymbolIndicatorForm();
    if (!validateSymbolIndicator(comp)) return;
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readSymbolIndicatorForm, 'applySymbolIndicator');
    window.state.canvasSelection.index = window.state.propsDialog.editIndex;
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveSymbolIndicator(e) {
    e.preventDefault();
    const comp = readSymbolIndicatorForm();
    if (!validateSymbolIndicator(comp)) return;
    await window.upsertCanvasComponent(comp);
    document.getElementById('symbolIndicatorDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initSymbolIndicatorDialog() {
    const form = document.getElementById('symbolIndicatorForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveSymbolIndicator(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applySymbolIndicator')?.addEventListener('click', () => {
      applySymbolIndicator().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readSymbolIndicatorForm, 'applySymbolIndicator'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readSymbolIndicatorForm, 'applySymbolIndicator'));
    document.getElementById('cancelSymbolIndicator')?.addEventListener('click', () => {
      document.getElementById('symbolIndicatorDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('symbolIndicatorDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpSymbolIndicator')?.addEventListener('click', () => {
      alert('Symbol Indicator displays a different image for each tag value. Pick symbols per state and connect the Indicator tag on the Connections tab.');
    });
    document.querySelectorAll('#symbolIndicatorDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.siTab));
    });
    document.getElementById('siStateSelect')?.addEventListener('change', (e) => switchSiState(e.target.value));
    document.getElementById('siNumberOfStates')?.addEventListener('change', (e) => {
      syncSiStateCount(Number(e.target.value) || 2);
      window.updatePropsApplyButton(readSymbolIndicatorForm, 'applySymbolIndicator');
    });
    document.getElementById('siInsertState')?.addEventListener('click', () => {
      saveSiStateToDraft();
      const count = Math.min(8, countUserStates(siStatesDraft) + 1);
      document.getElementById('siNumberOfStates').value = String(count);
      syncSiStateCount(count);
      switchSiState(`State${count - 1}`);
      window.updatePropsApplyButton(readSymbolIndicatorForm, 'applySymbolIndicator');
    });
    document.getElementById('siDeleteState')?.addEventListener('click', () => {
      if (countUserStates(siStatesDraft) <= 2) return;
      saveSiStateToDraft();
      const idx = siStatesDraft.findIndex((s) => s.id === siActiveStateId);
      if (idx >= 0 && siActiveStateId !== 'Error') siStatesDraft.splice(idx, 1);
      const count = countUserStates(siStatesDraft);
      document.getElementById('siNumberOfStates').value = String(count);
      syncSiStateCount(count);
      window.updatePropsApplyButton(readSymbolIndicatorForm, 'applySymbolIndicator');
    });
    document.getElementById('siStateCopy')?.addEventListener('click', () => {
      saveSiStateToDraft();
      const state = siStatesDraft?.find((s) => s.id === siActiveStateId);
      if (state) {
        siStateClipboard = { ...state };
        document.getElementById('siStatePaste').disabled = false;
      }
    });
    document.getElementById('siStatePaste')?.addEventListener('click', () => {
      if (!siStateClipboard) return;
      saveSiStateToDraft();
      const idx = siStatesDraft.findIndex((s) => s.id === siActiveStateId);
      if (idx >= 0) {
        siStatesDraft[idx] = { ...siStateClipboard, id: siStatesDraft[idx].id, value: siStatesDraft[idx].value };
        loadSiStateFromDraft(siActiveStateId);
        window.updatePropsApplyButton(readSymbolIndicatorForm, 'applySymbolIndicator');
      }
    });
    document.getElementById('siBrowseStateImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('siStateImage').value || null })
        .then((fileName) => {
          if (fileName) {
            document.getElementById('siStateImage').value = fileName;
            window.updatePropsApplyButton(readSymbolIndicatorForm, 'applySymbolIndicator');
          }
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    for (const id of ['siStateUseImageColor', 'siStateUseImageBackColor']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncSiFields();
        window.updatePropsApplyButton(readSymbolIndicatorForm, 'applySymbolIndicator');
      });
    }
  }

  window.StudioSymbolIndicator = {
    initSymbolIndicatorDialog,
    showSymbolIndicatorDialog,
    fillSymbolIndicatorForm,
    readSymbolIndicatorForm,
    switchSymbolIndicatorTab: switchTab,
    wireSymbolIndicatorTools: wireTools,
    defaultSymbolIndicatorStates
  };
})();
