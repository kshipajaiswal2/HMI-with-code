/** List Indicator property dialog */
(function () {
  let liStatesDraft = null;
  let liActiveStateId = 'State0';
  let liStateClipboard = null;

  function cloneStates(states) {
    return (states || []).map((s) => ({ ...s }));
  }

  function defaultListIndicatorState(i, overrides = {}) {
    return {
      id: `State${i}`,
      value: i,
      caption: '',
      useCaptionColor: false,
      captionColor: '#ffffff',
      useCaptionBackColor: false,
      captionBackColor: '#001C38',
      captionBlink: false,
      captionBackStyle: 'transparent',
      alignment: 'middleLeft',
      ...overrides
    };
  }

  function defaultListIndicatorStates(count = 5) {
    const states = [];
    for (let i = 0; i < count; i++) states.push(defaultListIndicatorState(i));
    return states;
  }

  function switchTab(tabId) {
    document.querySelectorAll('#listIndicatorDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.liTab === tabId);
    });
    document.querySelectorAll('#listIndicatorDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.liTabPanel === tabId);
    });
  }

  function nextListIndicatorName(components) {
    const n = (components || []).filter((c) => c.type === 'ListIndicator').length + 1;
    return `ListIndicator${n}`;
  }

  function defaultListIndicatorComponent(overrides = {}) {
    const count = overrides.numberOfStates ?? 5;
    return {
      type: 'ListIndicator',
      name: 'ListIndicator1',
      tag: '',
      numberOfStates: count,
      triggerType: 'value',
      left: 16,
      top: 16,
      width: 80,
      height: 120,
      visible: true,
      borderStyle: 'line',
      borderWidth: 4,
      borderUsesBackColor: false,
      backStyle: 'solid',
      backColor: '#001C38',
      useBackColor: true,
      useBorderColor: true,
      borderColor: '#001C38',
      patternStyle: 'none',
      usePatternColor: false,
      patternColor: '#ffffff',
      useSelectionForeColor: true,
      selectionForeColor: '#000000',
      useSelectionBackColor: true,
      selectionBackColor: '#0066cc',
      blink: false,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      captionTruncate: 'word',
      states: defaultListIndicatorStates(count),
      ...overrides
    };
  }

  function rebuildLiStateSelect() {
    const sel = document.getElementById('liStateSelect');
    if (!sel || !liStatesDraft) return;
    const prev = liActiveStateId;
    sel.innerHTML = liStatesDraft.map((s) => `<option value="${s.id}">${s.id}</option>`).join('');
    const next = liStatesDraft.some((s) => s.id === prev) ? prev : liStatesDraft[0]?.id || 'State0';
    sel.value = next;
    loadLiStateFromDraft(next);
  }

  function syncLiStateCount(count) {
    if (!liStatesDraft) liStatesDraft = defaultListIndicatorStates(count);
    while (liStatesDraft.length < count) {
      liStatesDraft.push(defaultListIndicatorState(liStatesDraft.length));
    }
    if (liStatesDraft.length > count) liStatesDraft = liStatesDraft.slice(0, count);
    liStatesDraft = liStatesDraft.map((s, i) => ({ ...s, id: `State${i}`, value: i }));
    rebuildLiStateSelect();
  }

  function syncLiFields() {
    document.getElementById('liBackColor').disabled = !document.getElementById('liUseBackColor')?.checked;
    document.getElementById('liBorderColor').disabled = !document.getElementById('liUseBorderColor')?.checked;
    document.getElementById('liPatternColor').disabled = !document.getElementById('liUsePatternColor')?.checked;
    document.getElementById('liSelectionForeColor').disabled = !document.getElementById('liUseSelectionForeColor')?.checked;
    document.getElementById('liSelectionBackColor').disabled = !document.getElementById('liUseSelectionBackColor')?.checked;
    document.getElementById('liStateCaptionColor').disabled = !document.getElementById('liStateUseCaptionColor')?.checked;
    document.getElementById('liStateCaptionBackColor').disabled = !document.getElementById('liStateUseCaptionBackColor')?.checked;
    document.getElementById('liDeleteState').disabled = (liStatesDraft?.length || 0) <= 2;
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('listIndicatorDialog'));
    syncLiFields();
  }

  function saveLiStateToDraft() {
    if (!liStatesDraft) return;
    const id = liActiveStateId;
    const idx = liStatesDraft.findIndex((s) => s.id === id);
    if (idx < 0) return;
    liStatesDraft[idx] = {
      ...liStatesDraft[idx],
      value: Number(document.getElementById('liStateValue').value),
      caption: document.getElementById('liStateCaption').value,
      useCaptionColor: document.getElementById('liStateUseCaptionColor').checked,
      captionColor: document.getElementById('liStateCaptionColor').value,
      useCaptionBackColor: document.getElementById('liStateUseCaptionBackColor').checked,
      captionBackColor: document.getElementById('liStateCaptionBackColor').value,
      captionBlink: document.getElementById('liStateCaptionBlink').checked,
      captionBackStyle: document.getElementById('liStateCaptionBackStyle').value,
      alignment: document.querySelector('#listIndicatorForm input[name="liStateAlign"]:checked')?.value || 'middleLeft'
    };
  }

  function loadLiStateFromDraft(stateId) {
    liActiveStateId = stateId;
    const state = liStatesDraft?.find((s) => s.id === stateId) || {};
    document.getElementById('liStateSelect').value = stateId;
    document.getElementById('liStateValue').value = state.value ?? 0;
    document.getElementById('liStateCaption').value = state.caption ?? '';
    document.getElementById('liStateUseCaptionColor').checked = Boolean(state.useCaptionColor);
    document.getElementById('liStateCaptionColor').value = state.captionColor || '#ffffff';
    document.getElementById('liStateUseCaptionBackColor').checked = Boolean(state.useCaptionBackColor);
    document.getElementById('liStateCaptionBackColor').value = state.captionBackColor || '#001C38';
    document.getElementById('liStateCaptionBlink').checked = Boolean(state.captionBlink);
    document.getElementById('liStateCaptionBackStyle').value = state.captionBackStyle || 'transparent';
    document.querySelector(`#listIndicatorForm input[name="liStateAlign"][value="${state.alignment || 'middleLeft'}"]`)?.click();
    syncLiFields();
  }

  function switchLiState(stateId) {
    saveLiStateToDraft();
    loadLiStateFromDraft(stateId);
  }

  function normalizeLoadedStates(states, count) {
    let userStates = (states || []).filter((s) => s.id !== 'Error').map((s, i) => ({
      ...defaultListIndicatorState(i, s),
      id: `State${i}`,
      value: s.value ?? i
    }));
    while (userStates.length < count) userStates.push(defaultListIndicatorState(userStates.length));
    if (userStates.length > count) userStates = userStates.slice(0, count);
    return userStates.map((s, i) => ({ ...s, id: `State${i}`, value: s.value ?? i }));
  }

  function fillListIndicatorForm(comp) {
    const count = comp.numberOfStates ?? (comp.states?.length || 5);
    liStatesDraft = normalizeLoadedStates(comp.states, count);
    liActiveStateId = 'State0';
    liStateClipboard = null;
    document.getElementById('liStatePaste').disabled = true;

    document.getElementById('liBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('liBorderWidth').value = comp.borderWidth ?? 4;
    document.getElementById('liBorderUsesBackColor').checked = Boolean(comp.borderUsesBackColor);
    document.getElementById('liBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('liPatternStyle').value = comp.patternStyle || 'none';
    document.getElementById('liUseBackColor').checked = comp.useBackColor !== false;
    document.getElementById('liBackColor').value = comp.backColor || '#001C38';
    document.getElementById('liUseBorderColor').checked = comp.useBorderColor !== false;
    document.getElementById('liBorderColor').value = comp.borderColor || '#001C38';
    document.getElementById('liUsePatternColor').checked = Boolean(comp.usePatternColor);
    document.getElementById('liPatternColor').value = comp.patternColor || '#ffffff';
    document.getElementById('liUseSelectionForeColor').checked = comp.useSelectionForeColor !== false;
    document.getElementById('liSelectionForeColor').value = comp.selectionForeColor || '#000000';
    document.getElementById('liUseSelectionBackColor').checked = comp.useSelectionBackColor !== false;
    document.getElementById('liSelectionBackColor').value = comp.selectionBackColor || '#0066cc';
    document.getElementById('liBlink').checked = Boolean(comp.blink);
    document.getElementById('liFont').value = comp.fontFamily || 'Arial Unicode MS';
    document.getElementById('liFontSize').value = String(comp.fontSize ?? 10);
    document.getElementById('liBold').classList.toggle('active', Boolean(comp.bold));
    document.getElementById('liItalic').classList.toggle('active', Boolean(comp.italic));
    document.getElementById('liUnderline').classList.toggle('active', Boolean(comp.underline));
    document.querySelector(`#listIndicatorForm input[name="liCaptionTruncate"][value="${comp.captionTruncate || 'word'}"]`)?.click();
    document.getElementById('liNumberOfStates').value = String(count);
    document.getElementById('liTriggerType').value = comp.triggerType || 'value';
    document.getElementById('liTag').value = comp.tag || '';
    document.getElementById('liHeight').value = comp.height ?? 120;
    document.getElementById('liWidth').value = comp.width ?? 80;
    document.getElementById('liTop').value = comp.top ?? 16;
    document.getElementById('liLeft').value = comp.left ?? 16;
    document.getElementById('liName').value = comp.name || 'ListIndicator1';
    document.getElementById('liVisible').checked = comp.visible !== false;
    rebuildLiStateSelect();
  }

  function readListIndicatorForm() {
    saveLiStateToDraft();
    return {
      type: 'ListIndicator',
      name: document.getElementById('liName').value.trim() || 'ListIndicator1',
      tag: document.getElementById('liTag').value.trim(),
      numberOfStates: liStatesDraft?.length || 5,
      triggerType: document.getElementById('liTriggerType').value,
      left: Number(document.getElementById('liLeft').value) || 0,
      top: Number(document.getElementById('liTop').value) || 0,
      width: Number(document.getElementById('liWidth').value) || 80,
      height: Number(document.getElementById('liHeight').value) || 120,
      visible: document.getElementById('liVisible').checked,
      borderStyle: document.getElementById('liBorderStyle').value,
      borderWidth: Number(document.getElementById('liBorderWidth').value) || 4,
      borderUsesBackColor: document.getElementById('liBorderUsesBackColor').checked,
      backStyle: document.getElementById('liBackStyle').value,
      backColor: document.getElementById('liBackColor').value,
      useBackColor: document.getElementById('liUseBackColor').checked,
      useBorderColor: document.getElementById('liUseBorderColor').checked,
      borderColor: document.getElementById('liBorderColor').value,
      patternStyle: document.getElementById('liPatternStyle').value,
      usePatternColor: document.getElementById('liUsePatternColor').checked,
      patternColor: document.getElementById('liPatternColor').value,
      useSelectionForeColor: document.getElementById('liUseSelectionForeColor').checked,
      selectionForeColor: document.getElementById('liSelectionForeColor').value,
      useSelectionBackColor: document.getElementById('liUseSelectionBackColor').checked,
      selectionBackColor: document.getElementById('liSelectionBackColor').value,
      blink: document.getElementById('liBlink').checked,
      fontFamily: document.getElementById('liFont').value,
      fontSize: Number(document.getElementById('liFontSize').value) || 10,
      bold: document.getElementById('liBold').classList.contains('active'),
      italic: document.getElementById('liItalic').classList.contains('active'),
      underline: document.getElementById('liUnderline').classList.contains('active'),
      captionTruncate: document.querySelector('#listIndicatorForm input[name="liCaptionTruncate"]:checked')?.value || 'word',
      states: cloneStates(liStatesDraft)
    };
  }

  function validateListIndicator(comp) {
    if (!comp.tag) {
      window.setStatus('Connect an Indicator tag on the Connections tab');
      switchTab('connections');
      return false;
    }
    return true;
  }

  async function showListIndicatorDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then choose List Indicator');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultListIndicatorComponent({
      name: nextListIndicatorName(canvas?.components),
      ...overrides
    });
    fillListIndicatorForm(comp);
    window.resetPropsDialogState('list-indicator', readListIndicatorForm, 'applyListIndicator');
    switchTab('general');
    wireTools();
    document.getElementById('listIndicatorDialog')?.showModal();
  }

  async function applyListIndicator() {
    const comp = readListIndicatorForm();
    if (!validateListIndicator(comp)) return;
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readListIndicatorForm, 'applyListIndicator');
    window.state.canvasSelection.index = window.state.propsDialog.editIndex;
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveListIndicator(e) {
    e.preventDefault();
    const comp = readListIndicatorForm();
    if (!validateListIndicator(comp)) return;
    await window.upsertCanvasComponent(comp);
    document.getElementById('listIndicatorDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initListIndicatorDialog() {
    const form = document.getElementById('listIndicatorForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveListIndicator(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyListIndicator')?.addEventListener('click', () => {
      applyListIndicator().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readListIndicatorForm, 'applyListIndicator'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readListIndicatorForm, 'applyListIndicator'));
    document.getElementById('cancelListIndicator')?.addEventListener('click', () => {
      document.getElementById('listIndicatorDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('listIndicatorDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpListIndicator')?.addEventListener('click', () => {
      alert('List Indicator shows all state captions in a vertical list and highlights the row matching the tag value.');
    });
    document.querySelectorAll('#listIndicatorDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.liTab));
    });
    document.getElementById('liStateSelect')?.addEventListener('change', (e) => switchLiState(e.target.value));
    document.getElementById('liNumberOfStates')?.addEventListener('change', (e) => {
      syncLiStateCount(Number(e.target.value) || 5);
      window.updatePropsApplyButton(readListIndicatorForm, 'applyListIndicator');
    });
    document.getElementById('liInsertState')?.addEventListener('click', () => {
      saveLiStateToDraft();
      const count = Math.min(8, (liStatesDraft?.length || 0) + 1);
      document.getElementById('liNumberOfStates').value = String(count);
      syncLiStateCount(count);
      switchLiState(`State${count - 1}`);
      window.updatePropsApplyButton(readListIndicatorForm, 'applyListIndicator');
    });
    document.getElementById('liDeleteState')?.addEventListener('click', () => {
      if ((liStatesDraft?.length || 0) <= 2) return;
      saveLiStateToDraft();
      const idx = liStatesDraft.findIndex((s) => s.id === liActiveStateId);
      if (idx >= 0) liStatesDraft.splice(idx, 1);
      const count = liStatesDraft.length;
      document.getElementById('liNumberOfStates').value = String(count);
      syncLiStateCount(count);
      window.updatePropsApplyButton(readListIndicatorForm, 'applyListIndicator');
    });
    document.getElementById('liStateCopy')?.addEventListener('click', () => {
      saveLiStateToDraft();
      const state = liStatesDraft?.find((s) => s.id === liActiveStateId);
      if (state) {
        liStateClipboard = { ...state };
        document.getElementById('liStatePaste').disabled = false;
      }
    });
    document.getElementById('liStatePaste')?.addEventListener('click', () => {
      if (!liStateClipboard) return;
      saveLiStateToDraft();
      const idx = liStatesDraft.findIndex((s) => s.id === liActiveStateId);
      if (idx >= 0) {
        liStatesDraft[idx] = { ...liStateClipboard, id: liStatesDraft[idx].id, value: liStatesDraft[idx].value };
        loadLiStateFromDraft(liActiveStateId);
        window.updatePropsApplyButton(readListIndicatorForm, 'applyListIndicator');
      }
    });
    for (const id of [
      'liUseBackColor', 'liUseBorderColor', 'liUsePatternColor',
      'liUseSelectionForeColor', 'liUseSelectionBackColor',
      'liStateUseCaptionColor', 'liStateUseCaptionBackColor'
    ]) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncLiFields();
        window.updatePropsApplyButton(readListIndicatorForm, 'applyListIndicator');
      });
    }
    for (const id of ['liBold', 'liItalic', 'liUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readListIndicatorForm, 'applyListIndicator');
      });
    }
  }

  window.StudioListIndicator = {
    initListIndicatorDialog,
    showListIndicatorDialog,
    fillListIndicatorForm,
    readListIndicatorForm,
    switchListIndicatorTab: switchTab,
    wireListIndicatorTools: wireTools
  };
})();
