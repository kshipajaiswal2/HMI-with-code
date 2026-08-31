/** List Indicator property dialog — FactoryTalk View parity */
(function () {
  const LI_MAX_STATES = 255;
  const LI_FONTS = [
    'Arial', 'Arial Unicode MS', 'Bahnschrift', 'Calibri', 'Cambria', 'Candara',
    'Comic Sans MS', 'Consolas', 'Constantia', 'Corbel', 'Courier New', 'Ebrima',
    'Franklin Gothic Medium', 'Gabriola', 'Georgia', 'Impact', 'Lucida Console',
    'Lucida Sans Unicode', 'Malgun Gothic', 'Microsoft Sans Serif', 'Palatino Linotype',
    'Segoe UI', 'Segoe UI Symbol', 'Tahoma', 'Times New Roman', 'Trebuchet MS',
    'Verdana', 'Yu Gothic'
  ];
  let liPreviewTimer = null;
  let liDialogCommitted = false;
  let liStatesDraft = null;
  let liActiveStateId = 'State0';
  let liStateClipboard = null;

  function cloneStates(states) {
    return (states || []).map((s) => ({ ...s }));
  }

  function liSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) {
      window.StudioPropsShared.setColorFieldValue(id, raw);
    } else {
      const el = document.getElementById(id);
      if (el) el.value = raw;
    }
  }

  function liGetColor(id, fallback) {
    if (window.StudioPropsShared?.getColorFieldValue) {
      return window.StudioPropsShared.getColorFieldValue(id) || fallback;
    }
    return document.getElementById(id)?.value || fallback;
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
    const n = Math.max(1, Math.min(LI_MAX_STATES, Number(count) || 5));
    const states = [];
    for (let i = 0; i < n; i++) states.push(defaultListIndicatorState(i));
    return states;
  }

  function fillNumberOfStatesSelect() {
    const el = document.getElementById('liNumberOfStates');
    if (!el || el.dataset.liFilled === '1') return;
    el.dataset.liFilled = '1';
    const opts = [];
    for (let i = 1; i <= LI_MAX_STATES; i++) opts.push(`<option value="${i}">${i}</option>`);
    el.innerHTML = opts.join('');
  }

  function fillFontSelect() {
    const el = document.getElementById('liFont');
    if (!el || el.dataset.liFonts === '1') return;
    el.dataset.liFonts = '1';
    const names = new Set(LI_FONTS);
    try {
      document.fonts?.forEach((f) => {
        if (f.family) names.add(f.family);
      });
    } catch (_) { /* ignore */ }
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    el.innerHTML = sorted.map((n) =>
      `<option${n === 'Arial Unicode MS' ? ' selected' : ''}>${n}</option>`
    ).join('');
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

  function formatTagForDisplay(tag) {
    if (window.StudioTagTools?.formatFtTagRef) return window.StudioTagTools.formatFtTagRef(tag);
    const s = String(tag || '').trim();
    if (s.startsWith('PLC uploded Tags.')) return `{[PLC]${s.slice('PLC uploded Tags.'.length)}}`;
    return s;
  }

  function defaultListIndicatorComponent(overrides = {}) {
    const count = overrides.numberOfStates ?? 5;
    const patternStyle = overrides.patternStyle || 'none';
    return {
      type: 'ListIndicator',
      name: 'ListIndicator1',
      tag: '',
      numberOfStates: count,
      triggerType: 'value',
      left: 16,
      top: 16,
      width: 155,
      height: 105,
      visible: true,
      borderStyle: 'line',
      borderWidth: 4,
      borderUsesBackColor: false,
      backStyle: 'solid',
      backColor: '#001C38',
      useBackColor: true,
      useBorderColor: true,
      borderColor: '#001C38',
      patternStyle,
      usePatternColor: patternStyle !== 'none',
      patternColor: '#ffffff',
      useSelectionForeColor: true,
      selectionForeColor: '#000000',
      useSelectionBackColor: true,
      selectionBackColor: '#99CCFF',
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

  function scheduleListLivePreview() {
    if (window.state?.propsFormFill) return;
    if (liPreviewTimer) clearTimeout(liPreviewTimer);
    liPreviewTimer = setTimeout(() => {
      liPreviewTimer = null;
      if (!document.getElementById('listIndicatorDialog')?.open) return;
      const comp = readListIndicatorPreview();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readListIndicatorForm, 'applyListIndicator');
    }, 80);
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
    const n = Math.max(1, Math.min(LI_MAX_STATES, Number(count) || 5));
    if (!liStatesDraft) liStatesDraft = defaultListIndicatorStates(n);
    while (liStatesDraft.length < n) {
      liStatesDraft.push(defaultListIndicatorState(liStatesDraft.length));
    }
    if (liStatesDraft.length > n) liStatesDraft = liStatesDraft.slice(0, n);
    liStatesDraft = liStatesDraft.map((s, i) => ({ ...s, id: `State${i}`, value: s.value ?? i }));
    const countEl = document.getElementById('liNumberOfStates');
    if (countEl) countEl.value = String(n);
    rebuildLiStateSelect();
  }

  function syncLiFields() {
    const userCount = liStatesDraft?.length || 0;
    const delBtn = document.getElementById('liDeleteState');
    if (delBtn) delBtn.disabled = userCount <= 1;
    const insBtn = document.getElementById('liInsertState');
    if (insBtn) insBtn.disabled = userCount >= LI_MAX_STATES;
    const pasteBtn = document.getElementById('liStatePaste');
    if (pasteBtn) pasteBtn.disabled = !liStateClipboard;
    const capColor = document.getElementById('liStateCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('liStateUseCaptionColor')?.checked;
    const capBack = document.getElementById('liStateCaptionBackColor');
    if (capBack) {
      capBack.disabled = !document.getElementById('liStateUseCaptionBackColor')?.checked
        || document.getElementById('liStateCaptionBackStyle')?.value !== 'solid';
    }
  }

  function insertAtCaptionCursor(text) {
    const ta = document.getElementById('liStateCaption');
    if (!ta || !text) return;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    ta.value = ta.value.slice(0, start) + text + ta.value.slice(end);
    const pos = start + text.length;
    ta.selectionStart = ta.selectionEnd = pos;
    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    scheduleListLivePreview();
  }

  function insertLiCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertAtCaptionCursor(formatTagForDisplay(tag));
    });
  }

  function hideLiInsertVariableMenu() {
    document.getElementById('liInsertVariableMenu')?.classList.add('hidden');
  }

  function wireLiTagPick() {
    const btn = document.querySelector('[data-tag-pick="liTag"]');
    const input = document.getElementById('liTag');
    if (!btn || !input || btn.dataset.tagPickWired === '1') return;
    btn.dataset.tagPickWired = '1';
    btn.addEventListener('click', () => {
      window.StudioTagTools?.openTagBrowser(input, (sel) => {
        input.value = formatTagForDisplay(sel);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        scheduleListLivePreview();
      });
    });
  }

  function wireTools() {
    wireLiTagPick();
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('listIndicatorDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    fillNumberOfStatesSelect();
    fillFontSelect();
    window.StudioPropsShared?.fillPatternSelect('liPatternStyle', 'liPatFilled');
    document.querySelectorAll('#listIndicatorForm .ft-color-input').forEach((input) => {
      if (input.dataset.liPreviewWired === '1') return;
      input.dataset.liPreviewWired = '1';
      input.addEventListener('input', scheduleListLivePreview);
      input.addEventListener('change', scheduleListLivePreview);
    });
    syncLiFields();
  }

  function presentListIndicatorDialog() {
    const dialog = document.getElementById('listIndicatorDialog');
    if (!dialog) {
      window.setStatus('List Indicator Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    liDialogCommitted = false;
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
        window.setStatus(`Opened List Indicator properties without modal: ${err2.message}`);
      }
    }
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
      captionColor: liGetColor('liStateCaptionColor', '#ffffff'),
      useCaptionBackColor: document.getElementById('liStateUseCaptionBackColor').checked,
      captionBackColor: liGetColor('liStateCaptionBackColor', '#001C38'),
      captionBlink: document.getElementById('liStateCaptionBlink').checked,
      captionBackStyle: document.getElementById('liStateCaptionBackStyle').value,
      alignment: document.querySelector('#listIndicatorForm input[name="liStateAlign"]:checked')?.value || 'middleLeft'
    };
  }

  function loadLiStateFromDraft(stateId) {
    if (window.state) window.state.propsFormFill = true;
    try {
      liActiveStateId = stateId;
      const state = liStatesDraft?.find((s) => s.id === stateId) || {};
      document.getElementById('liStateSelect').value = stateId;
      document.getElementById('liStateValue').value = state.value ?? 0;
      document.getElementById('liStateCaption').value = state.caption ?? '';
      document.getElementById('liStateUseCaptionColor').checked = Boolean(state.useCaptionColor);
      liSetColor('liStateCaptionColor', state.captionColor || '#ffffff');
      document.getElementById('liStateUseCaptionBackColor').checked = Boolean(state.useCaptionBackColor);
      liSetColor('liStateCaptionBackColor', state.captionBackColor || '#001C38');
      document.getElementById('liStateCaptionBlink').checked = Boolean(state.captionBlink);
      document.getElementById('liStateCaptionBackStyle').value = state.captionBackStyle || 'transparent';
      const align = state.alignment || 'middleLeft';
      document.querySelectorAll('#listIndicatorForm input[name="liStateAlign"]').forEach((el) => {
        el.checked = el.value === align;
      });
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
    syncLiFields();
  }

  function switchLiState(stateId) {
    saveLiStateToDraft();
    loadLiStateFromDraft(stateId);
    scheduleListLivePreview();
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
    if (window.state) window.state.propsFormFill = true;
    try {
      fillNumberOfStatesSelect();
      fillFontSelect();
      window.StudioPropsShared?.fillPatternSelect('liPatternStyle', 'liPatFilled');
      const count = comp.numberOfStates ?? (comp.states?.filter((s) => s.id !== 'Error').length) ?? 5;
      liStatesDraft = normalizeLoadedStates(comp.states, count);
      liActiveStateId = 'State0';
      liStateClipboard = null;
      document.getElementById('liStatePaste').disabled = true;

      document.getElementById('liBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('liBorderWidth').value = comp.borderWidth ?? 4;
      document.getElementById('liBorderUsesBackColor').checked = Boolean(comp.borderUsesBackColor);
      const backStyle = comp.backStyle === 'gradient' ? 'gradient' : 'solid';
      document.getElementById('liBackStyle').value = backStyle;
      const pat = document.getElementById('liPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      liSetColor('liBackColor', comp.backColor || '#001C38');
      liSetColor('liBorderColor', comp.borderColor || '#001C38');
      liSetColor('liPatternColor', comp.patternColor || '#ffffff');
      liSetColor('liSelectionForeColor', comp.selectionForeColor || '#000000');
      liSetColor('liSelectionBackColor', comp.selectionBackColor || '#99CCFF');
      document.getElementById('liBlink').checked = Boolean(comp.blink);
      const fontEl = document.getElementById('liFont');
      const fontName = comp.fontFamily || 'Arial Unicode MS';
      if (fontEl && ![...fontEl.options].some((o) => o.value === fontName)) {
        fontEl.insertAdjacentHTML('afterbegin', `<option>${fontName}</option>`);
      }
      fontEl.value = fontName;
      document.getElementById('liFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('liBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('liItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('liUnderline').classList.toggle('active', Boolean(comp.underline));
      const trunc = comp.captionTruncate === 'character' ? 'character' : 'word';
      document.querySelectorAll('#listIndicatorForm input[name="liCaptionTruncate"]').forEach((el) => {
        el.checked = el.value === trunc;
      });
      document.getElementById('liNumberOfStates').value = String(count);
      document.getElementById('liTriggerType').value = (comp.triggerType || 'value').toLowerCase() === 'lsb' ? 'lsb' : 'value';
      document.getElementById('liTag').value = formatTagForDisplay(comp.tag || comp.indicatorTag || '');
      document.getElementById('liHeight').value = comp.height ?? 105;
      document.getElementById('liWidth').value = comp.width ?? 155;
      document.getElementById('liTop').value = comp.top ?? 16;
      document.getElementById('liLeft').value = comp.left ?? 16;
      document.getElementById('liName').value = comp.name || 'ListIndicator1';
      document.getElementById('liVisible').checked = comp.visible !== false;
      rebuildLiStateSelect();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readListIndicatorForm() {
    saveLiStateToDraft();
    const patternStyle = document.getElementById('liPatternStyle')?.value || 'none';
    return {
      type: 'ListIndicator',
      name: document.getElementById('liName').value.trim() || 'ListIndicator1',
      tag: document.getElementById('liTag').value.trim(),
      numberOfStates: liStatesDraft?.length || 5,
      triggerType: document.getElementById('liTriggerType').value,
      left: Number(document.getElementById('liLeft').value) || 0,
      top: Number(document.getElementById('liTop').value) || 0,
      width: Number(document.getElementById('liWidth').value) || 155,
      height: Number(document.getElementById('liHeight').value) || 105,
      visible: document.getElementById('liVisible').checked,
      borderStyle: document.getElementById('liBorderStyle').value,
      borderWidth: Number(document.getElementById('liBorderWidth').value ?? 4),
      borderUsesBackColor: document.getElementById('liBorderUsesBackColor').checked,
      backStyle: document.getElementById('liBackStyle').value,
      backColor: liGetColor('liBackColor', '#001C38'),
      useBackColor: true,
      useBorderColor: true,
      borderColor: liGetColor('liBorderColor', '#001C38'),
      patternStyle,
      usePatternColor: patternStyle !== 'none',
      patternColor: liGetColor('liPatternColor', '#ffffff'),
      useSelectionForeColor: true,
      selectionForeColor: liGetColor('liSelectionForeColor', '#000000'),
      useSelectionBackColor: true,
      selectionBackColor: liGetColor('liSelectionBackColor', '#99CCFF'),
      blink: document.getElementById('liBlink').checked,
      fontFamily: document.getElementById('liFont').value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('liFontSize').value) || 10,
      bold: document.getElementById('liBold').classList.contains('active'),
      italic: document.getElementById('liItalic').classList.contains('active'),
      underline: document.getElementById('liUnderline').classList.contains('active'),
      captionTruncate: document.querySelector('#listIndicatorForm input[name="liCaptionTruncate"]:checked')?.value || 'word',
      states: cloneStates(liStatesDraft)
    };
  }

  function readListIndicatorPreview() {
    return { ...readListIndicatorForm(), previewStateId: liActiveStateId };
  }

  async function showListIndicatorDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the List Indicator');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initListIndicatorDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultListIndicatorComponent({
        name: nextListIndicatorName(canvas?.components),
        ...overrides
      });
      fillListIndicatorForm(comp);
      window.resetPropsDialogState('list-indicator', readListIndicatorForm, 'applyListIndicator');
      switchTab('general');
      wireTools();
      presentListIndicatorDialog();
      const previewComp = readListIndicatorPreview();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readListIndicatorForm, 'applyListIndicator');
    } catch (err) {
      window.setStatus(`List Indicator properties error: ${err.message}`);
    }
  }

  async function applyListIndicator() {
    const comp = readListIndicatorForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readListIndicatorForm, 'applyListIndicator');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveListIndicator(e) {
    e.preventDefault();
    const comp = readListIndicatorForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    liDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('listIndicatorDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function initListIndicatorDialog() {
    const form = document.getElementById('listIndicatorForm');
    if (!form || form.dataset.liWired === '1') return;
    fillNumberOfStatesSelect();
    fillFontSelect();
    window.StudioPropsShared?.fillPatternSelect('liPatternStyle', 'liPatFilled');
    form.addEventListener('submit', (e) => saveListIndicator(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyListIndicator')?.addEventListener('click', () => {
      applyListIndicator().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleListLivePreview();
      window.flushPropsApplyButton?.(readListIndicatorForm, 'applyListIndicator');
    });
    form.addEventListener('change', () => {
      syncLiFields();
      scheduleListLivePreview();
      window.flushPropsApplyButton?.(readListIndicatorForm, 'applyListIndicator');
    });
    document.getElementById('cancelListIndicator')?.addEventListener('click', () => {
      if (!liDialogCommitted) window.revertPropsDialogPreview?.();
      liDialogCommitted = true;
      document.getElementById('listIndicatorDialog')?.close();
    });
    document.getElementById('listIndicatorDialog')?.addEventListener('close', () => {
      if (liPreviewTimer) {
        clearTimeout(liPreviewTimer);
        liPreviewTimer = null;
      }
      hideLiInsertVariableMenu();
      if (!liDialogCommitted) window.revertPropsDialogPreview?.();
      liDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpListIndicator')?.addEventListener('click', () => {
      alert('List Indicator shows all state captions in a vertical list and highlights the row matching the Indicator tag. An Indicator tag is optional until runtime.');
    });
    document.querySelectorAll('#listIndicatorDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideLiInsertVariableMenu();
        switchTab(tab.dataset.liTab);
      });
    });
    document.getElementById('liStateSelect')?.addEventListener('change', (e) => switchLiState(e.target.value));
    document.getElementById('liNumberOfStates')?.addEventListener('change', (e) => {
      saveLiStateToDraft();
      syncLiStateCount(Number(e.target.value) || 5);
      scheduleListLivePreview();
    });
    document.getElementById('liInsertState')?.addEventListener('click', () => {
      saveLiStateToDraft();
      const count = Math.min(LI_MAX_STATES, (liStatesDraft?.length || 0) + 1);
      syncLiStateCount(count);
      switchLiState(`State${count - 1}`);
      scheduleListLivePreview();
    });
    document.getElementById('liDeleteState')?.addEventListener('click', () => {
      if ((liStatesDraft?.length || 0) <= 1) return;
      saveLiStateToDraft();
      const idx = liStatesDraft.findIndex((s) => s.id === liActiveStateId);
      if (idx >= 0) liStatesDraft.splice(idx, 1);
      syncLiStateCount(liStatesDraft.length);
      scheduleListLivePreview();
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
        scheduleListLivePreview();
      }
    });
    document.getElementById('liInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('liInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('liInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.liVar;
      if (!kind) return;
      hideLiInsertVariableMenu();
      if (kind === 'timedate') insertAtCaptionCursor('{#dt}');
      else insertLiCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#listIndicatorDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideLiInsertVariableMenu();
    });
    for (const id of ['liBold', 'liItalic', 'liUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleListLivePreview();
      });
    }
    form.dataset.liWired = '1';
  }

  window.StudioListIndicator = {
    initListIndicatorDialog,
    presentListIndicatorDialog,
    scheduleListLivePreview,
    showListIndicatorDialog,
    fillListIndicatorForm,
    readListIndicatorForm,
    switchListIndicatorTab: switchTab,
    wireListIndicatorTools: wireTools,
    nextListIndicatorName,
    defaultListIndicatorComponent,
    defaultListIndicatorStates,
    applyListIndicator
  };
})();
