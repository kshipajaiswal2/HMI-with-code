/** Display List Selector property dialog — FactoryTalk View parity */
(function () {
  const DLS_MAX_STATES = 255;
  let dlsPreviewTimer = null;
  let dlsDialogCommitted = false;
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

  function switchTab(tabId) {
    document.querySelectorAll('#displayListSelectorDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.dlsTab === tabId);
    });
    document.querySelectorAll('#displayListSelectorDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.dlsTabPanel === tabId);
    });
  }

  function dlsGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function dlsSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function fillNumberOfStatesSelect() {
    const el = document.getElementById('dlsNumberOfStates');
    if (!el || el.dataset.dlsFilled === '1') return;
    el.dataset.dlsFilled = '1';
    const opts = [];
    for (let i = 1; i <= DLS_MAX_STATES; i++) opts.push(`<option value="${i}">${i}</option>`);
    el.innerHTML = opts.join('');
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
      width: 172,
      height: 160,
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
      selectionBackColor: '#d0e7ff',
      selectionForeColor: '#000000',
      blink: false,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      captionTruncate: 'word',
      keyNavigation: true,
      wrapAround: true,
      states: defaultDisplayListStates(count),
      ...overrides
    };
  }

  function scheduleDisplayListLivePreview() {
    if (window.state?.propsFormFill) return;
    if (dlsPreviewTimer) clearTimeout(dlsPreviewTimer);
    dlsPreviewTimer = setTimeout(() => {
      dlsPreviewTimer = null;
      if (!document.getElementById('displayListSelectorDialog')?.open) return;
      const comp = readDisplayListSelectorForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readDisplayListSelectorForm, 'applyDisplayListSelector');
    }, 80);
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
    const n = Math.max(1, Math.min(DLS_MAX_STATES, Number(count) || 5));
    if (!dlsStatesDraft) dlsStatesDraft = defaultDisplayListStates(n);
    while (dlsStatesDraft.length < n) {
      const i = dlsStatesDraft.length;
      dlsStatesDraft.push({ ...defaultDisplayListStates(1)[0], id: `State${i}`, value: i });
    }
    if (dlsStatesDraft.length > n) dlsStatesDraft = dlsStatesDraft.slice(0, n);
    dlsStatesDraft = dlsStatesDraft.map((s, i) => ({ ...s, id: `State${i}`, value: i }));
    const countEl = document.getElementById('dlsNumberOfStates');
    if (countEl) countEl.value = String(n);
    rebuildDlsStateSelect();
  }

  function syncDlsFields() {
    const capColor = document.getElementById('dlsStateCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('dlsStateUseCaptionColor')?.checked;
    const capBack = document.getElementById('dlsStateCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('dlsStateUseCaptionBackColor')?.checked
      || document.getElementById('dlsStateCaptionBackStyle')?.value !== 'solid';
    const displayPos = document.getElementById('dlsStateDisplayPosition')?.checked;
    const topEl = document.getElementById('dlsStateDisplayTop');
    const leftEl = document.getElementById('dlsStateDisplayLeft');
    if (topEl) topEl.disabled = !displayPos;
    if (leftEl) leftEl.disabled = !displayPos;
    const paramType = document.querySelector('#displayListSelectorForm input[name="dlsStateParameterType"]:checked')?.value || 'file';
    const fileEl = document.getElementById('dlsStateParameterFile');
    const listEl = document.getElementById('dlsStateParameterList');
    const fileBtn = document.getElementById('dlsBrowseStateParameterFile');
    const listBtn = document.getElementById('dlsBrowseStateParameterList');
    if (fileEl) fileEl.disabled = paramType !== 'file';
    if (listEl) listEl.disabled = paramType !== 'list';
    if (fileBtn) fileBtn.disabled = paramType !== 'file';
    if (listBtn) listBtn.disabled = paramType !== 'list';
    const captionEl = document.getElementById('dlsStateCaption');
    if (captionEl) captionEl.disabled = Boolean(document.getElementById('dlsStateUseDisplayName')?.checked);
    const insertBtn = document.getElementById('dlsStateInsertVariable');
    if (insertBtn) insertBtn.disabled = Boolean(document.getElementById('dlsStateUseDisplayName')?.checked);
    const count = dlsStatesDraft?.length || 0;
    const delBtn = document.getElementById('dlsDeleteState');
    const insBtn = document.getElementById('dlsInsertState');
    if (delBtn) delBtn.disabled = count <= 1;
    if (insBtn) insBtn.disabled = count >= DLS_MAX_STATES;
    const pasteBtn = document.getElementById('dlsStatePaste');
    if (pasteBtn) pasteBtn.disabled = !dlsStateClipboard;
  }

  function wireDisplayListSelectorTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('displayListSelectorDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    fillNumberOfStatesSelect();
    window.StudioPropsShared?.fillPatternSelect('dlsPatternStyle', 'dlsFilled');
    document.querySelectorAll('#displayListSelectorForm .ft-color-input').forEach((input) => {
      if (input.dataset.dlsPreviewWired === '1') return;
      input.dataset.dlsPreviewWired = '1';
      input.addEventListener('input', scheduleDisplayListLivePreview);
      input.addEventListener('change', scheduleDisplayListLivePreview);
    });
    syncDlsFields();
  }

  function presentDisplayListSelectorDialog() {
    const dialog = document.getElementById('displayListSelectorDialog');
    if (!dialog) {
      window.setStatus('Display List Selector Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    dlsDialogCommitted = false;
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
        window.setStatus(`Opened Display List Selector properties without modal: ${err2.message}`);
      }
    }
  }

  function saveDlsStateToDraft() {
    if (!dlsStatesDraft) return;
    const idx = dlsStatesDraft.findIndex((s) => s.id === dlsActiveStateId);
    if (idx < 0) return;
    dlsStatesDraft[idx] = {
      ...dlsStatesDraft[idx],
      target: document.getElementById('dlsStateTarget')?.value.trim() || '',
      parameterType: document.querySelector('#displayListSelectorForm input[name="dlsStateParameterType"]:checked')?.value || 'file',
      parameterFile: document.getElementById('dlsStateParameterFile')?.value.trim() || '',
      parameterList: document.getElementById('dlsStateParameterList')?.value.trim() || '',
      displayPosition: Boolean(document.getElementById('dlsStateDisplayPosition')?.checked),
      displayTop: Number(document.getElementById('dlsStateDisplayTop')?.value) || 0,
      displayLeft: Number(document.getElementById('dlsStateDisplayLeft')?.value) || 0,
      useDisplayName: Boolean(document.getElementById('dlsStateUseDisplayName')?.checked),
      caption: document.getElementById('dlsStateCaption')?.value || '',
      useCaptionColor: Boolean(document.getElementById('dlsStateUseCaptionColor')?.checked),
      captionColor: dlsGetColor('dlsStateCaptionColor') || '#ffffff',
      useCaptionBackColor: Boolean(document.getElementById('dlsStateUseCaptionBackColor')?.checked),
      captionBackColor: dlsGetColor('dlsStateCaptionBackColor') || '#001C38',
      captionBlink: Boolean(document.getElementById('dlsStateCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('dlsStateCaptionBackStyle')?.value || 'transparent',
      alignment: document.querySelector('#displayListSelectorForm input[name="dlsStateAlign"]:checked')?.value || 'middleLeft'
    };
  }

  function loadDlsStateFromDraft(stateId) {
    dlsActiveStateId = stateId;
    const state = dlsStatesDraft?.find((s) => s.id === stateId) || {};
    const sel = document.getElementById('dlsStateSelect');
    if (sel) sel.value = stateId;
    document.getElementById('dlsStateTarget').value = state.target || '';
    document.getElementById('dlsStateParameterFileRadio').checked = (state.parameterType || 'file') !== 'list';
    document.getElementById('dlsStateParameterListRadio').checked = state.parameterType === 'list';
    document.getElementById('dlsStateParameterFile').value = state.parameterFile || '';
    document.getElementById('dlsStateParameterList').value = state.parameterList || '';
    document.getElementById('dlsStateDisplayPosition').checked = Boolean(state.displayPosition);
    document.getElementById('dlsStateDisplayTop').value = state.displayTop ?? 0;
    document.getElementById('dlsStateDisplayLeft').value = state.displayLeft ?? 0;
    document.getElementById('dlsStateUseDisplayName').checked = Boolean(state.useDisplayName);
    document.getElementById('dlsStateCaption').value = state.caption ?? '';
    document.getElementById('dlsStateUseCaptionColor').checked = Boolean(state.useCaptionColor);
    dlsSetColor('dlsStateCaptionColor', state.captionColor || '#ffffff');
    document.getElementById('dlsStateUseCaptionBackColor').checked = Boolean(state.useCaptionBackColor);
    dlsSetColor('dlsStateCaptionBackColor', state.captionBackColor || '#001C38');
    document.getElementById('dlsStateCaptionBlink').checked = Boolean(state.captionBlink);
    document.getElementById('dlsStateCaptionBackStyle').value = state.captionBackStyle || 'transparent';
    document.querySelectorAll('#displayListSelectorForm input[name="dlsStateAlign"]').forEach((el) => {
      el.checked = el.value === (state.alignment || 'middleLeft');
    });
    syncDlsFields();
  }

  function switchDlsState(stateId) {
    saveDlsStateToDraft();
    loadDlsStateFromDraft(stateId);
  }

  function fillDisplayListSelectorForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillNumberOfStatesSelect();
      window.StudioPropsShared?.fillPatternSelect('dlsPatternStyle', 'dlsFilled');
      const count = comp.numberOfStates ?? (comp.states?.length || 5);
      dlsStatesDraft = cloneStates(comp.states?.length ? comp.states : defaultDisplayListStates(count));
      dlsActiveStateId = 'State0';
      dlsStateClipboard = null;
      document.getElementById('dlsBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('dlsBorderWidth').value = comp.borderWidth ?? 4;
      document.getElementById('dlsBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      document.getElementById('dlsBackStyle').value = comp.backStyle === 'transparent' ? 'solid' : (comp.backStyle || 'solid');
      const pat = document.getElementById('dlsPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      dlsSetColor('dlsBackColor', comp.backColor || '#001C38');
      dlsSetColor('dlsBorderColor', comp.borderColor || '#001C38');
      dlsSetColor('dlsPatternColor', comp.patternColor || '#ffffff');
      dlsSetColor('dlsSelectionBackColor', comp.selectionBackColor || '#d0e7ff');
      dlsSetColor('dlsSelectionForeColor', comp.selectionForeColor || '#000000');
      document.getElementById('dlsBlink').checked = Boolean(comp.blink);
      document.getElementById('dlsNumberOfStates').value = String(count);
      document.getElementById('dlsFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('dlsFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('dlsBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('dlsItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('dlsUnderline').classList.toggle('active', Boolean(comp.underline));
      const truncate = comp.captionTruncate === 'character' ? 'character' : 'word';
      document.querySelectorAll('#displayListSelectorForm input[name="dlsCaptionTruncate"]').forEach((el) => {
        el.checked = el.value === truncate;
      });
      document.getElementById('dlsKeyNavigation').checked = comp.keyNavigation !== false;
      document.getElementById('dlsWrapAround').checked = comp.wrapAround !== false;
      document.getElementById('dlsHeight').value = comp.height ?? 160;
      document.getElementById('dlsWidth').value = comp.width ?? 172;
      document.getElementById('dlsTop').value = comp.top ?? 16;
      document.getElementById('dlsLeft').value = comp.left ?? 16;
      document.getElementById('dlsName').value = comp.name || 'DisplayListSelector1';
      document.getElementById('dlsVisible').checked = comp.visible !== false;
      rebuildDlsStateSelect();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readDisplayListSelectorForm() {
    saveDlsStateToDraft();
    return {
      type: 'DisplayListSelector',
      name: document.getElementById('dlsName')?.value.trim() || 'DisplayListSelector1',
      tag: '',
      numberOfStates: dlsStatesDraft?.length || Number(document.getElementById('dlsNumberOfStates')?.value) || 5,
      left: Number(document.getElementById('dlsLeft')?.value) || 0,
      top: Number(document.getElementById('dlsTop')?.value) || 0,
      width: Number(document.getElementById('dlsWidth')?.value) || 172,
      height: Number(document.getElementById('dlsHeight')?.value) || 160,
      visible: document.getElementById('dlsVisible')?.checked !== false,
      borderStyle: document.getElementById('dlsBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('dlsBorderWidth')?.value) || 4,
      borderUsesBackColor: document.getElementById('dlsBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('dlsBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('dlsPatternStyle')?.value || 'none',
      useBackColor: true,
      backColor: dlsGetColor('dlsBackColor'),
      useBorderColor: true,
      borderColor: dlsGetColor('dlsBorderColor'),
      usePatternColor: true,
      patternColor: dlsGetColor('dlsPatternColor'),
      selectionBackColor: dlsGetColor('dlsSelectionBackColor') || '#d0e7ff',
      selectionForeColor: dlsGetColor('dlsSelectionForeColor') || '#000000',
      blink: Boolean(document.getElementById('dlsBlink')?.checked),
      fontFamily: document.getElementById('dlsFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('dlsFontSize')?.value) || 10,
      bold: document.getElementById('dlsBold')?.classList.contains('active'),
      italic: document.getElementById('dlsItalic')?.classList.contains('active'),
      underline: document.getElementById('dlsUnderline')?.classList.contains('active'),
      captionTruncate: document.querySelector('#displayListSelectorForm input[name="dlsCaptionTruncate"]:checked')?.value || 'word',
      keyNavigation: document.getElementById('dlsKeyNavigation')?.checked !== false,
      wrapAround: document.getElementById('dlsWrapAround')?.checked !== false,
      states: cloneStates(dlsStatesDraft)
    };
  }

  async function showDisplayListSelectorDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Display List Selector');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initDisplayListSelectorDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultDisplayListSelectorComponent({
        name: nextDisplayListSelectorName(canvas?.components),
        ...overrides
      });
      fillDisplayListSelectorForm(comp);
      window.resetPropsDialogState('display-list', readDisplayListSelectorForm, 'applyDisplayListSelector');
      switchTab('general');
      wireDisplayListSelectorTools();
      presentDisplayListSelectorDialog();
      const previewComp = readDisplayListSelectorForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readDisplayListSelectorForm, 'applyDisplayListSelector');
    } catch (err) {
      window.setStatus(`Display List Selector properties error: ${err.message}`);
    }
  }

  async function applyDisplayListSelector() {
    const comp = readDisplayListSelectorForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readDisplayListSelectorForm, 'applyDisplayListSelector');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveDisplayListSelector(e) {
    e.preventDefault();
    const comp = readDisplayListSelectorForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    dlsDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('displayListSelectorDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertDlsCaptionText(text) {
    const area = document.getElementById('dlsStateCaption');
    if (!area || area.disabled || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleDisplayListLivePreview();
  }

  function insertDlsCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertDlsCaptionText(tag);
    });
  }

  function hideDlsInsertVariableMenu() {
    document.getElementById('dlsStateInsertVariableMenu')?.classList.add('hidden');
  }

  function initDisplayListSelectorDialog() {
    const form = document.getElementById('displayListSelectorForm');
    if (!form || form.dataset.dlsWired === '1') return;
    fillNumberOfStatesSelect();
    window.StudioPropsShared?.fillPatternSelect('dlsPatternStyle', 'dlsFilled');
    form.addEventListener('submit', (e) => saveDisplayListSelector(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyDisplayListSelector')?.addEventListener('click', () => {
      applyDisplayListSelector().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleDisplayListLivePreview();
      window.flushPropsApplyButton?.(readDisplayListSelectorForm, 'applyDisplayListSelector');
    });
    form.addEventListener('change', () => {
      syncDlsFields();
      scheduleDisplayListLivePreview();
      window.flushPropsApplyButton?.(readDisplayListSelectorForm, 'applyDisplayListSelector');
    });
    document.getElementById('cancelDisplayListSelector')?.addEventListener('click', () => {
      if (!dlsDialogCommitted) window.revertPropsDialogPreview?.();
      dlsDialogCommitted = true;
      document.getElementById('displayListSelectorDialog')?.close();
    });
    document.getElementById('displayListSelectorDialog')?.addEventListener('close', () => {
      if (dlsPreviewTimer) {
        clearTimeout(dlsPreviewTimer);
        dlsPreviewTimer = null;
      }
      hideDlsInsertVariableMenu();
      if (!dlsDialogCommitted) window.revertPropsDialogPreview?.();
      dlsDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpDisplayListSelector')?.addEventListener('click', () => {
      alert('Display List Selector lists displays bound to each state. A display per state is optional until runtime.');
    });
    document.querySelectorAll('#displayListSelectorDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideDlsInsertVariableMenu();
        switchTab(tab.dataset.dlsTab);
      });
    });
    document.getElementById('dlsStateSelect')?.addEventListener('change', (e) => switchDlsState(e.target.value));
    document.getElementById('dlsNumberOfStates')?.addEventListener('change', (e) => {
      saveDlsStateToDraft();
      syncDlsStateCount(Number(e.target.value) || 5);
      scheduleDisplayListLivePreview();
    });
    document.getElementById('dlsInsertState')?.addEventListener('click', () => {
      saveDlsStateToDraft();
      const count = Math.min(DLS_MAX_STATES, (dlsStatesDraft?.length || 0) + 1);
      syncDlsStateCount(count);
      switchDlsState(`State${count - 1}`);
      scheduleDisplayListLivePreview();
    });
    document.getElementById('dlsDeleteState')?.addEventListener('click', () => {
      if ((dlsStatesDraft?.length || 0) <= 1) return;
      saveDlsStateToDraft();
      const idx = dlsStatesDraft.findIndex((s) => s.id === dlsActiveStateId);
      if (idx >= 0) dlsStatesDraft.splice(idx, 1);
      syncDlsStateCount(dlsStatesDraft.length);
      scheduleDisplayListLivePreview();
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
        scheduleDisplayListLivePreview();
      }
    });
    document.getElementById('dlsBrowseStateDisplay')?.addEventListener('click', () => {
      window.showDisplayPickerDialog?.(document.getElementById('dlsStateTarget')?.value || '', { kind: 'displays' })
        .then((screenId) => {
          if (!screenId) return;
          document.getElementById('dlsStateTarget').value = screenId;
          scheduleDisplayListLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('dlsBrowseStateParameterFile')?.addEventListener('click', () => {
      window.showDisplayPickerDialog?.(document.getElementById('dlsStateParameterFile')?.value || '', { kind: 'parameter-files' })
        .then((id) => {
          if (!id) return;
          document.getElementById('dlsStateParameterFile').value = id;
          scheduleDisplayListLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('dlsBrowseStateParameterList')?.addEventListener('click', () => {
      window.showDisplayPickerDialog?.(document.getElementById('dlsStateParameterList')?.value || '', { kind: 'parameter-files' })
        .then((id) => {
          if (!id) return;
          document.getElementById('dlsStateParameterList').value = id;
          scheduleDisplayListLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('dlsStateInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (document.getElementById('dlsStateInsertVariable')?.disabled) return;
      document.getElementById('dlsStateInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('dlsStateInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.dlsVar;
      if (!kind) return;
      hideDlsInsertVariableMenu();
      if (kind === 'timedate') insertDlsCaptionText('{#dt}');
      else insertDlsCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#displayListSelectorDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideDlsInsertVariableMenu();
    });
    for (const id of ['dlsBold', 'dlsItalic', 'dlsUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleDisplayListLivePreview();
      });
    }
    form.dataset.dlsWired = '1';
  }

  window.StudioDisplayListSelector = {
    initDisplayListSelectorDialog,
    presentDisplayListSelectorDialog,
    scheduleDisplayListLivePreview,
    showDisplayListSelectorDialog,
    fillDisplayListSelectorForm,
    readDisplayListSelectorForm,
    switchDisplayListSelectorTab: switchTab,
    wireDisplayListSelectorTools,
    nextDisplayListSelectorName,
    defaultDisplayListSelectorComponent,
    applyDisplayListSelector
  };
})();
