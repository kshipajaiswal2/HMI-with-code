/** Display List Selector property dialog */
(function () {
  let dlsStatesDraft = null;
  let dlsActiveStateId = 'State0';
  let dlsStateClipboard = null;

  function cloneStates(states) {
    return (states || []).map((s) => ({ ...s }));
  }

  function defaultDisplayListStates(count = 5) {
    const states = [];
    for (let i = 0; i < count; i++) {
      states.push({
        id: `State${i}`,
        value: i,
        target: '',
        parameterType: 'file',
        parameterFile: '',
        parameterList: '',
        displayPosition: false,
        displayTop: 0,
        displayLeft: 0,
        useDisplayName: false,
        caption: '',
        useCaptionColor: false,
        captionColor: '#ffffff',
        useCaptionBackColor: false,
        captionBackColor: '#001C38',
        captionBlink: false,
        captionBackStyle: 'transparent',
        alignment: 'middleLeft'
      });
    }
    return states;
  }

  function countUserStates(states) {
    return (states || []).length;
  }

  function switchTab(tabId) {
    document.querySelectorAll('#displayListSelectorDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.dlsTab === tabId);
    });
    document.querySelectorAll('#displayListSelectorDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.dlsTabPanel === tabId);
    });
  }

  function nextDisplayListSelectorName(components) {
    const n = (components || []).filter((c) => c.type === 'DisplayListSelector').length + 1;
    return `DisplayListSelector${n}`;
  }

  function defaultDisplayListSelectorComponent(overrides = {}) {
    const count = overrides.numberOfStates ?? 5;
    return {
      type: 'DisplayListSelector',
      name: 'DisplayListSelector1',
      tag: '',
      numberOfStates: count,
      left: 16,
      top: 16,
      width: 120,
      height: 80,
      visible: true,
      borderStyle: 'line',
      borderWidth: 1,
      borderUsesBackColor: true,
      backStyle: 'solid',
      backColor: '#001C38',
      useBackColor: true,
      shape: 'rectangle',
      useHighlightColor: false,
      highlightColor: '#0066cc',
      audio: true,
      horizontalMargin: 0,
      verticalMargin: 0,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      states: defaultDisplayListStates(count),
      ...overrides
    };
  }

  function rebuildDlsStateSelect() {
    const sel = document.getElementById('dlsStateSelect');
    if (!sel || !dlsStatesDraft) return;
    const prev = dlsActiveStateId;
    sel.innerHTML = dlsStatesDraft.map((s) => `<option value="${s.id}">${s.id}</option>`).join('');
    const next = dlsStatesDraft.some((s) => s.id === prev) ? prev : dlsStatesDraft[0]?.id || 'State0';
    sel.value = next;
    loadDlsStateFromDraft(next);
  }

  function syncDlsStateCount(count) {
    if (!dlsStatesDraft) dlsStatesDraft = defaultDisplayListStates(count);
    while (dlsStatesDraft.length < count) {
      const i = dlsStatesDraft.length;
      dlsStatesDraft.push(defaultDisplayListStates(1)[0]);
    }
    if (dlsStatesDraft.length > count) dlsStatesDraft = dlsStatesDraft.slice(0, count);
    dlsStatesDraft = dlsStatesDraft.map((s, i) => ({ ...s, id: `State${i}`, value: i }));
    rebuildDlsStateSelect();
  }

  function syncDlsFields() {
    document.getElementById('dlsHighlightColor').disabled = !document.getElementById('dlsUseHighlightColor')?.checked;
    document.getElementById('dlsStateCaptionColor').disabled = !document.getElementById('dlsStateUseCaptionColor')?.checked;
    document.getElementById('dlsStateCaptionBackColor').disabled = !document.getElementById('dlsStateUseCaptionBackColor')?.checked;
    const displayPos = document.getElementById('dlsStateDisplayPosition')?.checked;
    document.getElementById('dlsStateDisplayTop').disabled = !displayPos;
    document.getElementById('dlsStateDisplayLeft').disabled = !displayPos;
    const paramType = document.querySelector('#displayListSelectorForm input[name="dlsStateParameterType"]:checked')?.value || 'file';
    document.getElementById('dlsStateParameterFile').disabled = paramType !== 'file';
    document.getElementById('dlsStateParameterList').disabled = paramType !== 'list';
    document.getElementById('dlsStateCaption').disabled = document.getElementById('dlsStateUseDisplayName')?.checked;
    const userCount = countUserStates(dlsStatesDraft);
    document.getElementById('dlsDeleteState').disabled = userCount <= 2;
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('displayListSelectorDialog'));
    syncDlsFields();
  }

  function saveDlsStateToDraft() {
    if (!dlsStatesDraft) return;
    const id = dlsActiveStateId;
    const idx = dlsStatesDraft.findIndex((s) => s.id === id);
    if (idx < 0) return;
    dlsStatesDraft[idx] = {
      ...dlsStatesDraft[idx],
      target: document.getElementById('dlsStateTarget').value.trim(),
      parameterType: document.querySelector('#displayListSelectorForm input[name="dlsStateParameterType"]:checked')?.value || 'file',
      parameterFile: document.getElementById('dlsStateParameterFile').value.trim(),
      parameterList: document.getElementById('dlsStateParameterList').value.trim(),
      displayPosition: document.getElementById('dlsStateDisplayPosition').checked,
      displayTop: Number(document.getElementById('dlsStateDisplayTop').value) || 0,
      displayLeft: Number(document.getElementById('dlsStateDisplayLeft').value) || 0,
      useDisplayName: document.getElementById('dlsStateUseDisplayName').checked,
      caption: document.getElementById('dlsStateCaption').value,
      useCaptionColor: document.getElementById('dlsStateUseCaptionColor').checked,
      captionColor: document.getElementById('dlsStateCaptionColor').value,
      useCaptionBackColor: document.getElementById('dlsStateUseCaptionBackColor').checked,
      captionBackColor: document.getElementById('dlsStateCaptionBackColor').value,
      captionBlink: document.getElementById('dlsStateCaptionBlink').checked,
      captionBackStyle: document.getElementById('dlsStateCaptionBackStyle').value,
      alignment: document.querySelector('#displayListSelectorForm input[name="dlsStateAlign"]:checked')?.value || 'middleLeft'
    };
  }

  function loadDlsStateFromDraft(stateId) {
    dlsActiveStateId = stateId;
    const state = dlsStatesDraft?.find((s) => s.id === stateId) || {};
    document.getElementById('dlsStateSelect').value = stateId;
    document.getElementById('dlsStateTarget').value = state.target || '';
    document.getElementById('dlsStateParameterFileRadio').checked = (state.parameterType || 'file') === 'file';
    document.getElementById('dlsStateParameterListRadio').checked = state.parameterType === 'list';
    document.getElementById('dlsStateParameterFile').value = state.parameterFile || '';
    document.getElementById('dlsStateParameterList').value = state.parameterList || '';
    document.getElementById('dlsStateDisplayPosition').checked = Boolean(state.displayPosition);
    document.getElementById('dlsStateDisplayTop').value = state.displayTop ?? 0;
    document.getElementById('dlsStateDisplayLeft').value = state.displayLeft ?? 0;
    document.getElementById('dlsStateUseDisplayName').checked = Boolean(state.useDisplayName);
    document.getElementById('dlsStateCaption').value = state.caption ?? '';
    document.getElementById('dlsStateUseCaptionColor').checked = Boolean(state.useCaptionColor);
    document.getElementById('dlsStateCaptionColor').value = state.captionColor || '#ffffff';
    document.getElementById('dlsStateUseCaptionBackColor').checked = Boolean(state.useCaptionBackColor);
    document.getElementById('dlsStateCaptionBackColor').value = state.captionBackColor || '#001C38';
    document.getElementById('dlsStateCaptionBlink').checked = Boolean(state.captionBlink);
    document.getElementById('dlsStateCaptionBackStyle').value = state.captionBackStyle || 'transparent';
    document.querySelector(`#displayListSelectorForm input[name="dlsStateAlign"][value="${state.alignment || 'middleLeft'}"]`)?.click();
    syncDlsFields();
  }

  function switchDlsState(stateId) {
    saveDlsStateToDraft();
    loadDlsStateFromDraft(stateId);
  }

  function fillDisplayListSelectorForm(comp) {
    const count = comp.numberOfStates ?? (comp.states?.length || 5);
    dlsStatesDraft = cloneStates(comp.states?.length ? comp.states : defaultDisplayListStates(count));
    dlsActiveStateId = 'State0';
    dlsStateClipboard = null;
    document.getElementById('dlsStatePaste').disabled = true;

    document.getElementById('dlsBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('dlsBorderWidth').value = comp.borderWidth ?? 1;
    document.getElementById('dlsBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('dlsBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('dlsShape').value = comp.shape || 'rectangle';
    document.getElementById('dlsUseHighlightColor').checked = Boolean(comp.useHighlightColor);
    document.getElementById('dlsHighlightColor').value = comp.highlightColor || '#0066cc';
    document.getElementById('dlsNumberOfStates').value = String(count);
    document.getElementById('dlsTag').value = comp.tag || '';
    document.getElementById('dlsHorizontalMargin').value = comp.horizontalMargin ?? 0;
    document.getElementById('dlsVerticalMargin').value = comp.verticalMargin ?? 0;
    document.getElementById('dlsAudio').checked = comp.audio !== false;
    document.getElementById('dlsFont').value = comp.fontFamily || 'Arial Unicode MS';
    document.getElementById('dlsFontSize').value = String(comp.fontSize ?? 10);
    document.getElementById('dlsBold').classList.toggle('active', Boolean(comp.bold));
    document.getElementById('dlsItalic').classList.toggle('active', Boolean(comp.italic));
    document.getElementById('dlsUnderline').classList.toggle('active', Boolean(comp.underline));
    document.getElementById('dlsHeight').value = comp.height ?? 80;
    document.getElementById('dlsWidth').value = comp.width ?? 120;
    document.getElementById('dlsTop').value = comp.top ?? 16;
    document.getElementById('dlsLeft').value = comp.left ?? 16;
    document.getElementById('dlsName').value = comp.name || 'DisplayListSelector1';
    document.getElementById('dlsVisible').checked = comp.visible !== false;
    rebuildDlsStateSelect();
  }

  function readDisplayListSelectorForm() {
    saveDlsStateToDraft();
    return {
      type: 'DisplayListSelector',
      name: document.getElementById('dlsName').value.trim() || 'DisplayListSelector1',
      tag: document.getElementById('dlsTag').value.trim(),
      numberOfStates: countUserStates(dlsStatesDraft),
      left: Number(document.getElementById('dlsLeft').value) || 0,
      top: Number(document.getElementById('dlsTop').value) || 0,
      width: Number(document.getElementById('dlsWidth').value) || 120,
      height: Number(document.getElementById('dlsHeight').value) || 80,
      visible: document.getElementById('dlsVisible').checked,
      borderStyle: document.getElementById('dlsBorderStyle').value,
      borderWidth: Number(document.getElementById('dlsBorderWidth').value) || 1,
      borderUsesBackColor: document.getElementById('dlsBorderUsesBackColor').checked,
      backStyle: document.getElementById('dlsBackStyle').value,
      backColor: '#001C38',
      useBackColor: true,
      useBorderColor: true,
      borderColor: '#001C38',
      shape: document.getElementById('dlsShape').value,
      useHighlightColor: document.getElementById('dlsUseHighlightColor').checked,
      highlightColor: document.getElementById('dlsHighlightColor').value,
      audio: document.getElementById('dlsAudio').checked,
      horizontalMargin: Number(document.getElementById('dlsHorizontalMargin').value) || 0,
      verticalMargin: Number(document.getElementById('dlsVerticalMargin').value) || 0,
      fontFamily: document.getElementById('dlsFont').value,
      fontSize: Number(document.getElementById('dlsFontSize').value) || 10,
      bold: document.getElementById('dlsBold').classList.contains('active'),
      italic: document.getElementById('dlsItalic').classList.contains('active'),
      underline: document.getElementById('dlsUnderline').classList.contains('active'),
      states: cloneStates(dlsStatesDraft)
    };
  }

  function validateDisplayListSelector(comp) {
    if (!comp.tag) {
      window.setStatus('Enter a list index tag on the General tab');
      switchTab('general');
      return false;
    }
    return true;
  }

  async function showDisplayListSelectorDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then choose Display List Selector');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultDisplayListSelectorComponent({
      name: nextDisplayListSelectorName(canvas?.components),
      ...overrides
    });
    fillDisplayListSelectorForm(comp);
    window.resetPropsDialogState('display-list', readDisplayListSelectorForm, 'applyDisplayListSelector');
    switchTab('general');
    wireTools();
    document.getElementById('displayListSelectorDialog')?.showModal();
  }

  async function applyDisplayListSelector() {
    const comp = readDisplayListSelectorForm();
    if (!validateDisplayListSelector(comp)) return;
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readDisplayListSelectorForm, 'applyDisplayListSelector');
    window.state.canvasSelection.index = window.state.propsDialog.editIndex;
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveDisplayListSelector(e) {
    e.preventDefault();
    const comp = readDisplayListSelectorForm();
    if (!validateDisplayListSelector(comp)) return;
    await window.upsertCanvasComponent(comp);
    document.getElementById('displayListSelectorDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initDisplayListSelectorDialog() {
    const form = document.getElementById('displayListSelectorForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveDisplayListSelector(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyDisplayListSelector')?.addEventListener('click', () => {
      applyDisplayListSelector().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readDisplayListSelectorForm, 'applyDisplayListSelector'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readDisplayListSelectorForm, 'applyDisplayListSelector'));
    document.getElementById('cancelDisplayListSelector')?.addEventListener('click', () => {
      document.getElementById('displayListSelectorDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('displayListSelectorDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpDisplayListSelector')?.addEventListener('click', () => {
      alert('Display List Selector cycles through displays bound to each state. Configure a display per state and connect a list index tag.');
    });
    document.querySelectorAll('#displayListSelectorDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.dlsTab));
    });
    document.getElementById('dlsStateSelect')?.addEventListener('change', (e) => switchDlsState(e.target.value));
    document.getElementById('dlsNumberOfStates')?.addEventListener('change', (e) => {
      syncDlsStateCount(Number(e.target.value) || 5);
      window.updatePropsApplyButton(readDisplayListSelectorForm, 'applyDisplayListSelector');
    });
    document.getElementById('dlsInsertState')?.addEventListener('click', () => {
      saveDlsStateToDraft();
      const count = (dlsStatesDraft?.length || 0) + 1;
      document.getElementById('dlsNumberOfStates').value = String(Math.min(8, count));
      syncDlsStateCount(Math.min(8, count));
      switchDlsState(`State${count - 1}`);
      window.updatePropsApplyButton(readDisplayListSelectorForm, 'applyDisplayListSelector');
    });
    document.getElementById('dlsDeleteState')?.addEventListener('click', () => {
      if ((dlsStatesDraft?.length || 0) <= 2) return;
      saveDlsStateToDraft();
      const idx = dlsStatesDraft.findIndex((s) => s.id === dlsActiveStateId);
      if (idx >= 0) dlsStatesDraft.splice(idx, 1);
      const count = dlsStatesDraft.length;
      document.getElementById('dlsNumberOfStates').value = String(count);
      syncDlsStateCount(count);
      window.updatePropsApplyButton(readDisplayListSelectorForm, 'applyDisplayListSelector');
    });
    document.getElementById('dlsStateCopy')?.addEventListener('click', () => {
      saveDlsStateToDraft();
      const state = dlsStatesDraft?.find((s) => s.id === dlsActiveStateId);
      if (state) {
        dlsStateClipboard = { ...state };
        document.getElementById('dlsStatePaste').disabled = false;
      }
    });
    document.getElementById('dlsStatePaste')?.addEventListener('click', () => {
      if (!dlsStateClipboard) return;
      saveDlsStateToDraft();
      const idx = dlsStatesDraft.findIndex((s) => s.id === dlsActiveStateId);
      if (idx >= 0) {
        dlsStatesDraft[idx] = { ...dlsStateClipboard, id: dlsStatesDraft[idx].id, value: dlsStatesDraft[idx].value };
        loadDlsStateFromDraft(dlsActiveStateId);
        window.updatePropsApplyButton(readDisplayListSelectorForm, 'applyDisplayListSelector');
      }
    });
    document.getElementById('dlsBrowseStateDisplay')?.addEventListener('click', () => {
      window.showDisplayPickerDialog?.(document.getElementById('dlsStateTarget').value || '')
        .then((screenId) => {
          if (screenId) {
            document.getElementById('dlsStateTarget').value = screenId;
            window.updatePropsApplyButton(readDisplayListSelectorForm, 'applyDisplayListSelector');
          }
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    for (const id of ['dlsUseHighlightColor', 'dlsStateUseCaptionColor', 'dlsStateUseCaptionBackColor', 'dlsStateDisplayPosition', 'dlsStateUseDisplayName']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncDlsFields();
        window.updatePropsApplyButton(readDisplayListSelectorForm, 'applyDisplayListSelector');
      });
    }
    document.querySelectorAll('#displayListSelectorForm input[name="dlsStateParameterType"]').forEach((el) => {
      el.addEventListener('change', () => {
        syncDlsFields();
        window.updatePropsApplyButton(readDisplayListSelectorForm, 'applyDisplayListSelector');
      });
    });
    for (const id of ['dlsBold', 'dlsItalic', 'dlsUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readDisplayListSelectorForm, 'applyDisplayListSelector');
      });
    }
  }

  window.StudioDisplayListSelector = {
    initDisplayListSelectorDialog,
    showDisplayListSelectorDialog,
    fillDisplayListSelectorForm,
    readDisplayListSelectorForm,
    switchDisplayListSelectorTab: switchTab,
    wireDisplayListSelectorTools: wireTools
  };
})();
