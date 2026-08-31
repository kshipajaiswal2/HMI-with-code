/** Symbol property dialog — FactoryTalk View parity */
(function () {
  const SI_MAX_STATES = 255;
  let siPreviewTimer = null;
  let siDialogCommitted = false;
  let siStatesDraft = null;
  let siActiveStateId = 'State0';
  let siStateClipboard = null;

  function cloneStates(states) {
    return (states || []).map((s) => ({ ...s }));
  }

  function siSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) {
      window.StudioPropsShared.setColorFieldValue(id, raw);
    } else {
      const el = document.getElementById(id);
      if (el) el.value = raw;
    }
  }

  function siGetColor(id, fallback) {
    if (window.StudioPropsShared?.getColorFieldValue) {
      return window.StudioPropsShared.getColorFieldValue(id) || fallback;
    }
    return document.getElementById(id)?.value || fallback;
  }

  function defaultSymbolIndicatorState(i, overrides = {}) {
    return {
      id: `State${i}`,
      value: i,
      image: '',
      useBorderColor: false,
      borderColor: '#808080',
      imageColor: '#001C38',
      imageBackColor: '#808080',
      imageBlink: false,
      imageScaled: true,
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      ...overrides
    };
  }

  function defaultErrorState() {
    return {
      id: 'Error',
      image: '',
      useBorderColor: false,
      borderColor: '#808080',
      imageColor: '#001C38',
      imageBackColor: '#808080',
      imageBlink: false,
      imageScaled: true,
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter'
    };
  }

  function defaultSymbolIndicatorStates(count = 4, firstImage = '') {
    const n = Math.max(1, Math.min(SI_MAX_STATES, Number(count) || 4));
    const states = [];
    for (let i = 0; i < n; i++) {
      states.push(defaultSymbolIndicatorState(i, firstImage ? { image: firstImage } : {}));
    }
    states.push(defaultErrorState());
    return states;
  }

  function countUserStates(states) {
    return (states || []).filter((s) => s.id !== 'Error').length;
  }

  function fillNumberOfStatesSelect() {
    const el = document.getElementById('siNumberOfStates');
    if (!el || el.dataset.siFilled === '1') return;
    el.dataset.siFilled = '1';
    const opts = [];
    for (let i = 1; i <= SI_MAX_STATES; i++) opts.push(`<option value="${i}">${i}</option>`);
    el.innerHTML = opts.join('');
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
    return `Symbol${n}`;
  }

  function formatTagForDisplay(tag) {
    if (window.StudioTagTools?.formatFtTagRef) return window.StudioTagTools.formatFtTagRef(tag);
    return String(tag || '').trim();
  }

  function equalizeCircleSize() {
    if (document.getElementById('siShape')?.value !== 'circle') return;
    const w = Number(document.getElementById('siWidth')?.value) || 0;
    const h = Number(document.getElementById('siHeight')?.value) || 0;
    const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
    document.getElementById('siWidth').value = String(size);
    document.getElementById('siHeight').value = String(size);
  }

  function applyGeneralImage(fileName) {
    const image = String(fileName || '').trim();
    const input = document.getElementById('siImage');
    if (input) input.value = image;
    if (!siStatesDraft) return;
    siStatesDraft = siStatesDraft.map((s) => (s.id === 'Error' ? s : { ...s, image }));
  }

  function defaultSymbolIndicatorComponent(overrides = {}) {
    const count = overrides.numberOfStates ?? 4;
    const firstImage = overrides.initialImage || overrides.states?.[0]?.image || '';
    return {
      type: 'SymbolIndicator',
      name: 'Symbol1',
      tag: '',
      numberOfStates: count,
      triggerType: 'value',
      left: 16,
      top: 16,
      width: 80,
      height: 80,
      visible: true,
      borderStyle: 'none',
      borderWidth: 4,
      shape: 'rectangle',
      states: defaultSymbolIndicatorStates(count, firstImage),
      ...overrides
    };
  }

  function scheduleSymbolLivePreview() {
    if (window.state?.propsFormFill) return;
    if (siPreviewTimer) clearTimeout(siPreviewTimer);
    siPreviewTimer = setTimeout(() => {
      siPreviewTimer = null;
      if (!document.getElementById('symbolIndicatorDialog')?.open) return;
      const comp = readSymbolIndicatorPreview();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readSymbolIndicatorForm, 'applySymbolIndicator');
    }, 80);
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
    const n = Math.max(1, Math.min(SI_MAX_STATES, Number(count) || 4));
    const generalImage = document.getElementById('siImage')?.value.trim() || '';
    if (!siStatesDraft) siStatesDraft = defaultSymbolIndicatorStates(n, generalImage);
    const error = siStatesDraft.find((s) => s.id === 'Error') || defaultErrorState();
    let userStates = siStatesDraft.filter((s) => s.id !== 'Error');
    while (userStates.length < n) {
      const i = userStates.length;
      userStates.push(defaultSymbolIndicatorState(i, generalImage ? { image: generalImage } : {}));
    }
    if (userStates.length > n) userStates = userStates.slice(0, n);
    userStates = userStates.map((s, i) => ({ ...s, id: `State${i}`, value: s.value ?? i }));
    siStatesDraft = [...userStates, { ...error, id: 'Error' }];
    const countEl = document.getElementById('siNumberOfStates');
    if (countEl) countEl.value = String(n);
    rebuildSiStateSelect();
  }

  function syncSiFields() {
    const isError = siActiveStateId === 'Error';
    document.getElementById('siStateValueRow')?.classList.toggle('hidden', isError);
    const userCount = countUserStates(siStatesDraft);
    const delBtn = document.getElementById('siDeleteState');
    if (delBtn) delBtn.disabled = isError || userCount <= 1;
    const insBtn = document.getElementById('siInsertState');
    if (insBtn) insBtn.disabled = userCount >= SI_MAX_STATES;
    const pasteBtn = document.getElementById('siStatePaste');
    if (pasteBtn) pasteBtn.disabled = !siStateClipboard;
  }

  function wireSiTagPick() {
    const btn = document.querySelector('[data-tag-pick="siTag"]');
    const input = document.getElementById('siTag');
    if (!btn || !input || btn.dataset.tagPickWired === '1') return;
    btn.dataset.tagPickWired = '1';
    btn.addEventListener('click', () => {
      window.StudioTagTools?.openTagBrowser(input, (sel) => {
        input.value = formatTagForDisplay(sel);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        scheduleSymbolLivePreview();
      });
    });
  }

  function wireTools() {
    wireSiTagPick();
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('symbolIndicatorDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    fillNumberOfStatesSelect();
    document.querySelectorAll('#symbolIndicatorForm .ft-color-input').forEach((input) => {
      if (input.dataset.siPreviewWired === '1') return;
      input.dataset.siPreviewWired = '1';
      input.addEventListener('input', scheduleSymbolLivePreview);
      input.addEventListener('change', scheduleSymbolLivePreview);
    });
    syncSiFields();
  }

  function presentSymbolIndicatorDialog() {
    const dialog = document.getElementById('symbolIndicatorDialog');
    if (!dialog) {
      window.setStatus('Symbol Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    siDialogCommitted = false;
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
        window.setStatus(`Opened Symbol properties without modal: ${err2.message}`);
      }
    }
  }

  function saveSiStateToDraft() {
    if (!siStatesDraft) return;
    const id = siActiveStateId;
    const idx = siStatesDraft.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const next = {
      ...siStatesDraft[idx],
      useBorderColor: document.getElementById('siStateUseBorderColor').checked,
      borderColor: siGetColor('siStateBorderColor', '#808080'),
      imageColor: siGetColor('siStateImageColor', '#001C38'),
      imageBackColor: siGetColor('siStateImageBackColor', '#808080'),
      imageBlink: document.getElementById('siStateImageBlink').checked,
      imageBackStyle: document.getElementById('siStateImageBackStyle').value,
      imageScaled: true,
      imageAlignment: 'middleCenter'
    };
    if (id !== 'Error') next.value = Number(document.getElementById('siStateValue').value);
    const generalImage = document.getElementById('siImage')?.value.trim() || '';
    if (id !== 'Error' && generalImage) next.image = generalImage;
    siStatesDraft[idx] = next;
  }

  function loadSiStateFromDraft(stateId) {
    if (window.state) window.state.propsFormFill = true;
    try {
      siActiveStateId = stateId;
      const state = siStatesDraft?.find((s) => s.id === stateId) || {};
      document.getElementById('siStateSelect').value = stateId;
      document.getElementById('siStateUseBorderColor').checked = Boolean(state.useBorderColor);
      siSetColor('siStateBorderColor', state.borderColor || '#808080');
      siSetColor('siStateImageColor', state.imageColor || '#001C38');
      siSetColor('siStateImageBackColor', state.imageBackColor || '#808080');
      document.getElementById('siStateImageBlink').checked = Boolean(state.imageBlink);
      document.getElementById('siStateImageBackStyle').value = state.imageBackStyle || 'transparent';
      document.getElementById('siStateValue').value = state.value ?? 0;
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
    syncSiFields();
  }

  function switchSiState(stateId) {
    saveSiStateToDraft();
    loadSiStateFromDraft(stateId);
    scheduleSymbolLivePreview();
  }

  function normalizeLoadedStates(states, count) {
    let draft = cloneStates(states || []);
    if (!draft.some((s) => s.id === 'Error')) draft.push(defaultErrorState());
    const error = draft.find((s) => s.id === 'Error');
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
    if (window.state) window.state.propsFormFill = true;
    try {
      fillNumberOfStatesSelect();
      const count = comp.numberOfStates ?? countUserStates(comp.states) ?? 4;
      siStatesDraft = normalizeLoadedStates(comp.states, count);
      siActiveStateId = 'State0';
      siStateClipboard = null;
      document.getElementById('siStatePaste').disabled = true;
      document.getElementById('siBorderStyle').value = comp.borderStyle || 'none';
      document.getElementById('siBorderWidth').value = comp.borderWidth ?? 4;
      const shape = comp.shape === 'circle' || comp.shape === 'ellipse' ? comp.shape : 'rectangle';
      document.getElementById('siShape').value = shape;
      document.getElementById('siNumberOfStates').value = String(count);
      document.getElementById('siTriggerType').value = (comp.triggerType || 'value').toLowerCase() === 'lsb' ? 'lsb' : 'value';
      const firstImage = siStatesDraft.find((s) => s.id !== 'Error')?.image || comp.initialImage || '';
      document.getElementById('siImage').value = firstImage;
      document.getElementById('siTag').value = formatTagForDisplay(comp.tag || comp.indicatorTag || '');
      document.getElementById('siHeight').value = comp.height ?? 80;
      document.getElementById('siWidth').value = comp.width ?? 80;
      document.getElementById('siTop').value = comp.top ?? 16;
      document.getElementById('siLeft').value = comp.left ?? 16;
      document.getElementById('siName').value = comp.name || 'Symbol1';
      document.getElementById('siVisible').checked = comp.visible !== false;
      rebuildSiStateSelect();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readSymbolIndicatorForm() {
    saveSiStateToDraft();
    equalizeCircleSize();
    const generalImage = document.getElementById('siImage')?.value.trim() || '';
    if (generalImage && siStatesDraft) {
      siStatesDraft = siStatesDraft.map((s) => (s.id === 'Error' ? s : { ...s, image: generalImage }));
    }
    return {
      type: 'SymbolIndicator',
      name: document.getElementById('siName').value.trim() || 'Symbol1',
      tag: document.getElementById('siTag').value.trim(),
      numberOfStates: countUserStates(siStatesDraft),
      triggerType: document.getElementById('siTriggerType').value,
      left: Number(document.getElementById('siLeft').value) || 0,
      top: Number(document.getElementById('siTop').value) || 0,
      width: Number(document.getElementById('siWidth').value) || 80,
      height: Number(document.getElementById('siHeight').value) || 80,
      visible: document.getElementById('siVisible').checked,
      borderStyle: document.getElementById('siBorderStyle').value,
      borderWidth: Number(document.getElementById('siBorderWidth').value ?? 4),
      shape: document.getElementById('siShape').value,
      states: cloneStates(siStatesDraft)
    };
  }

  function readSymbolIndicatorPreview() {
    return { ...readSymbolIndicatorForm(), previewStateId: siActiveStateId };
  }

  async function showSymbolIndicatorDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Symbol');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initSymbolIndicatorDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultSymbolIndicatorComponent({
        name: nextSymbolIndicatorName(canvas?.components),
        ...overrides
      });
      fillSymbolIndicatorForm(comp);
      window.resetPropsDialogState('symbol-indicator', readSymbolIndicatorForm, 'applySymbolIndicator');
      switchTab('general');
      wireTools();
      presentSymbolIndicatorDialog();
      const previewComp = readSymbolIndicatorPreview();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readSymbolIndicatorForm, 'applySymbolIndicator');
    } catch (err) {
      window.setStatus(`Symbol properties error: ${err.message}`);
    }
  }

  async function applySymbolIndicator() {
    const comp = readSymbolIndicatorForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readSymbolIndicatorForm, 'applySymbolIndicator');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveSymbolIndicator(e) {
    e.preventDefault();
    const comp = readSymbolIndicatorForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    siDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('symbolIndicatorDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function initSymbolIndicatorDialog() {
    const form = document.getElementById('symbolIndicatorForm');
    if (!form || form.dataset.siWired === '1') return;
    fillNumberOfStatesSelect();
    form.addEventListener('submit', (e) => saveSymbolIndicator(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applySymbolIndicator')?.addEventListener('click', () => {
      applySymbolIndicator().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleSymbolLivePreview();
      window.flushPropsApplyButton?.(readSymbolIndicatorForm, 'applySymbolIndicator');
    });
    form.addEventListener('change', () => {
      syncSiFields();
      scheduleSymbolLivePreview();
      window.flushPropsApplyButton?.(readSymbolIndicatorForm, 'applySymbolIndicator');
    });
    document.getElementById('cancelSymbolIndicator')?.addEventListener('click', () => {
      if (!siDialogCommitted) window.revertPropsDialogPreview?.();
      siDialogCommitted = true;
      document.getElementById('symbolIndicatorDialog')?.close();
    });
    document.getElementById('symbolIndicatorDialog')?.addEventListener('close', () => {
      if (siPreviewTimer) {
        clearTimeout(siPreviewTimer);
        siPreviewTimer = null;
      }
      if (!siDialogCommitted) window.revertPropsDialogPreview?.();
      siDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpSymbolIndicator')?.addEventListener('click', () => {
      alert('Symbol displays an image for each state of an Indicator tag. An image and Indicator tag are optional until runtime.');
    });
    document.querySelectorAll('#symbolIndicatorDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.siTab));
    });
    document.getElementById('siStateSelect')?.addEventListener('change', (e) => switchSiState(e.target.value));
    document.getElementById('siNumberOfStates')?.addEventListener('change', (e) => {
      saveSiStateToDraft();
      syncSiStateCount(Number(e.target.value) || 4);
      scheduleSymbolLivePreview();
    });
    document.getElementById('siInsertState')?.addEventListener('click', () => {
      saveSiStateToDraft();
      const count = Math.min(SI_MAX_STATES, countUserStates(siStatesDraft) + 1);
      syncSiStateCount(count);
      switchSiState(`State${count - 1}`);
      scheduleSymbolLivePreview();
    });
    document.getElementById('siDeleteState')?.addEventListener('click', () => {
      if (countUserStates(siStatesDraft) <= 1 || siActiveStateId === 'Error') return;
      saveSiStateToDraft();
      const idx = siStatesDraft.findIndex((s) => s.id === siActiveStateId);
      if (idx >= 0 && siActiveStateId !== 'Error') siStatesDraft.splice(idx, 1);
      syncSiStateCount(countUserStates(siStatesDraft));
      scheduleSymbolLivePreview();
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
        scheduleSymbolLivePreview();
      }
    });
    document.getElementById('siBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('siImage').value || null })
        .then((fileName) => {
          if (!fileName) return;
          applyGeneralImage(fileName);
          scheduleSymbolLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('siImage')?.addEventListener('change', () => {
      applyGeneralImage(document.getElementById('siImage').value);
      scheduleSymbolLivePreview();
    });
    document.getElementById('siShape')?.addEventListener('change', () => {
      equalizeCircleSize();
      scheduleSymbolLivePreview();
    });
    form.dataset.siWired = '1';
  }

  window.StudioSymbolIndicator = {
    initSymbolIndicatorDialog,
    presentSymbolIndicatorDialog,
    scheduleSymbolLivePreview,
    showSymbolIndicatorDialog,
    fillSymbolIndicatorForm,
    readSymbolIndicatorForm,
    switchSymbolIndicatorTab: switchTab,
    wireSymbolIndicatorTools: wireTools,
    nextSymbolIndicatorName,
    defaultSymbolIndicatorComponent,
    defaultSymbolIndicatorStates,
    applySymbolIndicator
  };
})();
