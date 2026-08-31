/** Multistate Indicator property dialog — FactoryTalk View parity */
(function () {
  const MI_MAX_STATES = 255;
  let miPreviewTimer = null;
  let miDialogCommitted = false;
  let miStatesDraft = null;
  let miActiveStateId = 'State0';
  let miStateClipboard = null;

  function cloneStates(states) {
    return (states || []).map((s) => ({ ...s }));
  }

  function miSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) {
      window.StudioPropsShared.setColorFieldValue(id, raw);
    } else {
      const el = document.getElementById(id);
      if (el) el.value = raw;
    }
  }

  function miGetColor(id, fallback) {
    if (window.StudioPropsShared?.getColorFieldValue) {
      return window.StudioPropsShared.getColorFieldValue(id) || fallback;
    }
    return document.getElementById(id)?.value || fallback;
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
      useCaptionColor: false,
      captionColor: '#ffffff',
      useCaptionBackColor: false,
      captionBackColor: '#001C38',
      captionBlink: false,
      wordWrap: true,
      alignment: 'middleCenter',
      captionBackStyle: 'transparent',
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
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
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
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
    const n = Math.max(1, Math.min(MI_MAX_STATES, Number(count) || 4));
    const states = [];
    for (let i = 0; i < n; i++) states.push(defaultMultistateIndicatorState(i));
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

  function fillNumberOfStatesSelect() {
    const el = document.getElementById('miNumberOfStates');
    if (!el || el.dataset.miFilled === '1') return;
    el.dataset.miFilled = '1';
    const opts = [];
    for (let i = 1; i <= MI_MAX_STATES; i++) opts.push(`<option value="${i}">${i}</option>`);
    el.innerHTML = opts.join('');
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

  function formatTagForDisplay(tag) {
    if (window.StudioTagTools?.formatFtTagRef) return window.StudioTagTools.formatFtTagRef(tag);
    const s = String(tag || '').trim();
    if (s.startsWith('PLC uploded Tags.')) return `{[PLC]${s.slice('PLC uploded Tags.'.length)}}`;
    return s;
  }

  function equalizeCircleSize() {
    if (document.getElementById('miShape')?.value !== 'circle') return;
    const w = Number(document.getElementById('miWidth')?.value) || 0;
    const h = Number(document.getElementById('miHeight')?.value) || 0;
    const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
    document.getElementById('miWidth').value = String(size);
    document.getElementById('miHeight').value = String(size);
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
      width: 90,
      height: 88,
      visible: true,
      borderStyle: 'line',
      borderWidth: 4,
      borderUsesBackColor: true,
      backStyle: 'solid',
      shape: 'rectangle',
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      states: defaultMultistateIndicatorStates(count),
      ...overrides
    };
  }

  function scheduleMultistateLivePreview() {
    if (window.state?.propsFormFill) return;
    if (miPreviewTimer) clearTimeout(miPreviewTimer);
    miPreviewTimer = setTimeout(() => {
      miPreviewTimer = null;
      if (!document.getElementById('multistateIndicatorDialog')?.open) return;
      const comp = readMultistateIndicatorPreview();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readMultistateIndicatorForm, 'applyMultistateIndicator');
    }, 80);
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
    const n = Math.max(1, Math.min(MI_MAX_STATES, Number(count) || 4));
    if (!miStatesDraft) miStatesDraft = defaultMultistateIndicatorStates(n);
    const error = miStatesDraft.find((s) => s.id === 'Error') || defaultErrorState();
    let userStates = miStatesDraft.filter((s) => s.id !== 'Error');
    while (userStates.length < n) {
      const i = userStates.length;
      userStates.push(defaultMultistateIndicatorState(i));
    }
    if (userStates.length > n) userStates = userStates.slice(0, n);
    userStates = userStates.map((s, i) => ({ ...s, id: `State${i}`, value: s.value ?? i }));
    miStatesDraft = [...userStates, { ...error, id: 'Error' }];
    const countEl = document.getElementById('miNumberOfStates');
    if (countEl) countEl.value = String(n);
    rebuildMiStateSelect();
  }

  function syncMiFields() {
    const isError = miActiveStateId === 'Error';
    document.getElementById('miStateValueRow')?.classList.toggle('hidden', isError);
    const patColor = document.getElementById('miStatePatternColor');
    if (patColor) patColor.disabled = !document.getElementById('miStateUsePatternColor')?.checked;
    const capColor = document.getElementById('miStateCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('miStateUseCaptionColor')?.checked;
    const capBack = document.getElementById('miStateCaptionBackColor');
    if (capBack) {
      capBack.disabled = !document.getElementById('miStateUseCaptionBackColor')?.checked
        || document.getElementById('miStateCaptionBackStyle')?.value !== 'solid';
    }
    const imgColor = document.getElementById('miStateImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('miStateUseImageColor')?.checked;
    const imgBack = document.getElementById('miStateImageBackColor');
    if (imgBack) {
      imgBack.disabled = !document.getElementById('miStateUseImageBackColor')?.checked
        || document.getElementById('miStateImageBackStyle')?.value !== 'solid';
    }
    const userCount = countUserStates(miStatesDraft);
    const delBtn = document.getElementById('miDeleteState');
    if (delBtn) delBtn.disabled = isError || userCount <= 1;
    const insBtn = document.getElementById('miInsertState');
    if (insBtn) insBtn.disabled = userCount >= MI_MAX_STATES;
    const pasteBtn = document.getElementById('miStatePaste');
    if (pasteBtn) pasteBtn.disabled = !miStateClipboard;
  }

  function insertAtCaptionCursor(text) {
    const ta = document.getElementById('miStateCaption');
    if (!ta || !text) return;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    ta.value = ta.value.slice(0, start) + text + ta.value.slice(end);
    const pos = start + text.length;
    ta.selectionStart = ta.selectionEnd = pos;
    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    scheduleMultistateLivePreview();
  }

  function insertMiCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertAtCaptionCursor(formatTagForDisplay(tag));
    });
  }

  function hideMiInsertVariableMenu() {
    document.getElementById('miInsertVariableMenu')?.classList.add('hidden');
  }

  function wireMiTagPick() {
    const btn = document.querySelector('[data-tag-pick="miTag"]');
    const input = document.getElementById('miTag');
    if (!btn || !input || btn.dataset.tagPickWired === '1') return;
    btn.dataset.tagPickWired = '1';
    btn.addEventListener('click', () => {
      window.StudioTagTools?.openTagBrowser(input, (sel) => {
        input.value = formatTagForDisplay(sel);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        scheduleMultistateLivePreview();
      });
    });
  }

  function wireTools() {
    wireMiTagPick();
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('multistateIndicatorDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    fillNumberOfStatesSelect();
    window.StudioPropsShared?.fillPatternSelect('miStatePatternStyle', 'miFilled');
    document.querySelectorAll('#multistateIndicatorForm .ft-color-input').forEach((input) => {
      if (input.dataset.miPreviewWired === '1') return;
      input.dataset.miPreviewWired = '1';
      input.addEventListener('input', scheduleMultistateLivePreview);
      input.addEventListener('change', scheduleMultistateLivePreview);
    });
    syncMiFields();
  }

  function presentMultistateIndicatorDialog() {
    const dialog = document.getElementById('multistateIndicatorDialog');
    if (!dialog) {
      window.setStatus('Multistate Indicator Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    miDialogCommitted = false;
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
        window.setStatus(`Opened Multistate Indicator properties without modal: ${err2.message}`);
      }
    }
  }

  function saveMiStateToDraft() {
    if (!miStatesDraft) return;
    const id = miActiveStateId;
    const idx = miStatesDraft.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const next = {
      ...miStatesDraft[idx],
      useBackColor: true,
      backColor: miGetColor('miStateBackColor', '#001C38'),
      useBorderColor: true,
      borderColor: miGetColor('miStateBorderColor', '#001C38'),
      blink: document.getElementById('miStateBlink').checked,
      patternStyle: document.getElementById('miStatePatternStyle').value,
      usePatternColor: document.getElementById('miStateUsePatternColor').checked,
      patternColor: miGetColor('miStatePatternColor', '#ffffff'),
      caption: document.getElementById('miStateCaption').value,
      useCaptionColor: document.getElementById('miStateUseCaptionColor').checked,
      captionColor: miGetColor('miStateCaptionColor', '#ffffff'),
      useCaptionBackColor: document.getElementById('miStateUseCaptionBackColor').checked,
      captionBackColor: miGetColor('miStateCaptionBackColor', '#001C38'),
      captionBlink: document.getElementById('miStateCaptionBlink').checked,
      wordWrap: document.getElementById('miStateWordWrap').checked,
      alignment: document.querySelector('#multistateIndicatorForm input[name="miStateAlign"]:checked')?.value || 'middleCenter',
      captionBackStyle: document.getElementById('miStateCaptionBackStyle').value,
      fontFamily: document.getElementById('miFont').value,
      fontSize: Number(document.getElementById('miFontSize').value) || 10,
      bold: document.getElementById('miBold').classList.contains('active'),
      italic: document.getElementById('miItalic').classList.contains('active'),
      underline: document.getElementById('miUnderline').classList.contains('active'),
      image: document.getElementById('miStateImage').value.trim(),
      useImageColor: document.getElementById('miStateUseImageColor').checked,
      imageColor: miGetColor('miStateImageColor', '#ffffff'),
      useImageBackColor: document.getElementById('miStateUseImageBackColor').checked,
      imageBackColor: miGetColor('miStateImageBackColor', '#001C38'),
      imageBlink: document.getElementById('miStateImageBlink').checked,
      imageScaled: document.getElementById('miStateImageScaled').checked,
      imageBackStyle: document.getElementById('miStateImageBackStyle').value,
      imageAlignment: document.querySelector('#multistateIndicatorForm input[name="miStateImageAlign"]:checked')?.value || 'middleCenter'
    };
    if (id !== 'Error') next.value = Number(document.getElementById('miStateValue').value);
    miStatesDraft[idx] = next;
  }

  function loadMiStateFromDraft(stateId) {
    if (window.state) window.state.propsFormFill = true;
    try {
      miActiveStateId = stateId;
      const state = miStatesDraft?.find((s) => s.id === stateId) || {};
      document.getElementById('miStateSelect').value = stateId;
      miSetColor('miStateBackColor', state.backColor || '#001C38');
      miSetColor('miStateBorderColor', state.borderColor || '#001C38');
      document.getElementById('miStateBlink').checked = Boolean(state.blink);
      const pat = document.getElementById('miStatePatternStyle');
      if (pat) pat.value = state.patternStyle || 'none';
      document.getElementById('miStateUsePatternColor').checked = Boolean(state.usePatternColor);
      miSetColor('miStatePatternColor', state.patternColor || '#ffffff');
      document.getElementById('miStateCaption').value = state.caption ?? '';
      document.getElementById('miStateUseCaptionColor').checked = state.useCaptionColor === true;
      miSetColor('miStateCaptionColor', state.captionColor || '#ffffff');
      document.getElementById('miStateUseCaptionBackColor').checked = Boolean(state.useCaptionBackColor);
      miSetColor('miStateCaptionBackColor', state.captionBackColor || '#001C38');
      document.getElementById('miStateCaptionBlink').checked = Boolean(state.captionBlink);
      document.getElementById('miStateWordWrap').checked = state.wordWrap !== false;
      document.getElementById('miStateCaptionBackStyle').value = state.captionBackStyle || 'transparent';
      if (state.fontFamily) document.getElementById('miFont').value = state.fontFamily;
      if (state.fontSize != null) document.getElementById('miFontSize').value = String(state.fontSize);
      if (state.bold != null) document.getElementById('miBold').classList.toggle('active', Boolean(state.bold));
      if (state.italic != null) document.getElementById('miItalic').classList.toggle('active', Boolean(state.italic));
      if (state.underline != null) document.getElementById('miUnderline').classList.toggle('active', Boolean(state.underline));
      document.getElementById('miStateImage').value = state.image || '';
      document.getElementById('miStateUseImageColor').checked = Boolean(state.useImageColor);
      miSetColor('miStateImageColor', state.imageColor || '#ffffff');
      document.getElementById('miStateUseImageBackColor').checked = Boolean(state.useImageBackColor);
      miSetColor('miStateImageBackColor', state.imageBackColor || '#001C38');
      document.getElementById('miStateImageBlink').checked = Boolean(state.imageBlink);
      document.getElementById('miStateImageScaled').checked = Boolean(state.imageScaled);
      document.getElementById('miStateImageBackStyle').value = state.imageBackStyle || 'transparent';
      document.getElementById('miStateValue').value = state.value ?? 0;
      const align = state.alignment || 'middleCenter';
      const imgAlign = state.imageAlignment || 'middleCenter';
      document.querySelectorAll('#multistateIndicatorForm input[name="miStateAlign"]').forEach((el) => {
        el.checked = el.value === align;
      });
      document.querySelectorAll('#multistateIndicatorForm input[name="miStateImageAlign"]').forEach((el) => {
        el.checked = el.value === imgAlign;
      });
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
    syncMiFields();
  }

  function switchMiState(stateId) {
    saveMiStateToDraft();
    loadMiStateFromDraft(stateId);
    scheduleMultistateLivePreview();
  }

  function normalizeLoadedStates(states, count) {
    let draft = ensureErrorState(states);
    const error = draft.find((s) => s.id === 'Error');
    let userStates = draft.filter((s) => s.id !== 'Error').map((s, i) => ({
      ...defaultMultistateIndicatorState(i, {
        useCaptionColor: s.useCaptionColor !== undefined ? Boolean(s.useCaptionColor) : Boolean(s.caption || s.captionColor)
      }),
      ...s,
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
    try {
      fillNumberOfStatesSelect();
      window.StudioPropsShared?.fillPatternSelect('miStatePatternStyle', 'miFilled');
      const count = comp.numberOfStates ?? countUserStates(comp.states) ?? 4;
      miStatesDraft = normalizeLoadedStates(comp.states, count);
      miActiveStateId = 'State0';
      miStateClipboard = null;
      document.getElementById('miStatePaste').disabled = true;

      document.getElementById('miBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('miBorderWidth').value = comp.borderWidth ?? 4;
      document.getElementById('miBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      document.getElementById('miBackStyle').value = comp.backStyle || 'solid';
      const shape = comp.shape === 'circle' || comp.shape === 'ellipse' ? comp.shape : 'rectangle';
      document.getElementById('miShape').value = shape;
      document.getElementById('miNumberOfStates').value = String(count);
      document.getElementById('miTriggerType').value = (comp.triggerType || 'value').toLowerCase() === 'lsb' ? 'lsb' : 'value';
      document.getElementById('miTag').value = formatTagForDisplay(comp.tag || comp.indicatorTag || '');
      document.getElementById('miFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('miFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('miBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('miItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('miUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('miHeight').value = comp.height ?? 88;
      document.getElementById('miWidth').value = comp.width ?? 90;
      document.getElementById('miTop').value = comp.top ?? 16;
      document.getElementById('miLeft').value = comp.left ?? 16;
      document.getElementById('miName').value = comp.name || 'MultistateIndicator1';
      document.getElementById('miVisible').checked = comp.visible !== false;
      rebuildMiStateSelect();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readMultistateIndicatorForm() {
    saveMiStateToDraft();
    equalizeCircleSize();
    const state0 = miStatesDraft?.find((s) => s.id === 'State0') || {};
    return {
      type: 'MultistateIndicator',
      name: document.getElementById('miName').value.trim() || 'MultistateIndicator1',
      tag: document.getElementById('miTag').value.trim(),
      numberOfStates: countUserStates(miStatesDraft),
      triggerType: document.getElementById('miTriggerType').value,
      left: Number(document.getElementById('miLeft').value) || 0,
      top: Number(document.getElementById('miTop').value) || 0,
      width: Number(document.getElementById('miWidth').value) || 90,
      height: Number(document.getElementById('miHeight').value) || 88,
      visible: document.getElementById('miVisible').checked,
      borderStyle: document.getElementById('miBorderStyle').value,
      borderWidth: Number(document.getElementById('miBorderWidth').value ?? 4),
      borderUsesBackColor: document.getElementById('miBorderUsesBackColor').checked,
      backStyle: document.getElementById('miBackStyle').value,
      shape: document.getElementById('miShape').value,
      fontFamily: document.getElementById('miFont').value || state0.fontFamily || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('miFontSize').value || state0.fontSize) || 10,
      bold: document.getElementById('miBold').classList.contains('active'),
      italic: document.getElementById('miItalic').classList.contains('active'),
      underline: document.getElementById('miUnderline').classList.contains('active'),
      states: cloneStates(miStatesDraft)
    };
  }

  function readMultistateIndicatorPreview() {
    return { ...readMultistateIndicatorForm(), previewStateId: miActiveStateId };
  }

  async function showMultistateIndicatorDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Multistate Indicator');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initMultistateIndicatorDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultMultistateIndicatorComponent({
        name: nextMultistateIndicatorName(canvas?.components),
        ...overrides
      });
      fillMultistateIndicatorForm(comp);
      window.resetPropsDialogState('multistate-indicator', readMultistateIndicatorForm, 'applyMultistateIndicator');
      switchTab('general');
      wireTools();
      presentMultistateIndicatorDialog();
      const previewComp = readMultistateIndicatorPreview();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readMultistateIndicatorForm, 'applyMultistateIndicator');
    } catch (err) {
      window.setStatus(`Multistate Indicator properties error: ${err.message}`);
    }
  }

  async function applyMultistateIndicator() {
    const comp = readMultistateIndicatorForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readMultistateIndicatorForm, 'applyMultistateIndicator');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveMultistateIndicator(e) {
    e.preventDefault();
    const comp = readMultistateIndicatorForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    miDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('multistateIndicatorDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function initMultistateIndicatorDialog() {
    const form = document.getElementById('multistateIndicatorForm');
    if (!form || form.dataset.miWired === '1') return;
    fillNumberOfStatesSelect();
    window.StudioPropsShared?.fillPatternSelect('miStatePatternStyle', 'miFilled');
    form.addEventListener('submit', (e) => saveMultistateIndicator(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyMultistateIndicator')?.addEventListener('click', () => {
      applyMultistateIndicator().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleMultistateLivePreview();
      window.flushPropsApplyButton?.(readMultistateIndicatorForm, 'applyMultistateIndicator');
    });
    form.addEventListener('change', () => {
      syncMiFields();
      scheduleMultistateLivePreview();
      window.flushPropsApplyButton?.(readMultistateIndicatorForm, 'applyMultistateIndicator');
    });
    document.getElementById('cancelMultistateIndicator')?.addEventListener('click', () => {
      if (!miDialogCommitted) window.revertPropsDialogPreview?.();
      miDialogCommitted = true;
      document.getElementById('multistateIndicatorDialog')?.close();
    });
    document.getElementById('multistateIndicatorDialog')?.addEventListener('close', () => {
      if (miPreviewTimer) {
        clearTimeout(miPreviewTimer);
        miPreviewTimer = null;
      }
      hideMiInsertVariableMenu();
      if (!miDialogCommitted) window.revertPropsDialogPreview?.();
      miDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpMultistateIndicator')?.addEventListener('click', () => {
      alert('Multistate Indicator shows a different appearance for each state of an Indicator tag. An Indicator tag is optional until runtime.');
    });
    document.querySelectorAll('#multistateIndicatorDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideMiInsertVariableMenu();
        switchTab(tab.dataset.miTab);
      });
    });
    document.getElementById('miStateSelect')?.addEventListener('change', (e) => switchMiState(e.target.value));
    document.getElementById('miNumberOfStates')?.addEventListener('change', (e) => {
      saveMiStateToDraft();
      syncMiStateCount(Number(e.target.value) || 4);
      scheduleMultistateLivePreview();
    });
    document.getElementById('miInsertState')?.addEventListener('click', () => {
      saveMiStateToDraft();
      const count = Math.min(MI_MAX_STATES, countUserStates(miStatesDraft) + 1);
      syncMiStateCount(count);
      switchMiState(`State${count - 1}`);
      scheduleMultistateLivePreview();
    });
    document.getElementById('miDeleteState')?.addEventListener('click', () => {
      if (countUserStates(miStatesDraft) <= 1 || miActiveStateId === 'Error') return;
      saveMiStateToDraft();
      const idx = miStatesDraft.findIndex((s) => s.id === miActiveStateId);
      if (idx >= 0 && miActiveStateId !== 'Error') miStatesDraft.splice(idx, 1);
      const count = countUserStates(miStatesDraft);
      syncMiStateCount(count);
      scheduleMultistateLivePreview();
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
        miStatesDraft[idx] = {
          ...miStateClipboard,
          id: miStatesDraft[idx].id,
          value: miStatesDraft[idx].value
        };
        loadMiStateFromDraft(miActiveStateId);
        scheduleMultistateLivePreview();
      }
    });
    document.getElementById('miBrowseStateImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('miStateImage').value || null })
        .then((fileName) => {
          if (fileName) {
            document.getElementById('miStateImage').value = fileName;
            scheduleMultistateLivePreview();
          }
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('miInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('miInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('miInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.miVar;
      if (!kind) return;
      hideMiInsertVariableMenu();
      if (kind === 'timedate') insertAtCaptionCursor('{#dt}');
      else insertMiCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#multistateIndicatorDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideMiInsertVariableMenu();
    });
    document.getElementById('miShape')?.addEventListener('change', () => {
      equalizeCircleSize();
      scheduleMultistateLivePreview();
    });
    for (const id of ['miBold', 'miItalic', 'miUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleMultistateLivePreview();
      });
    }
    form.dataset.miWired = '1';
  }

  window.StudioMultistateIndicator = {
    initMultistateIndicatorDialog,
    presentMultistateIndicatorDialog,
    scheduleMultistateLivePreview,
    showMultistateIndicatorDialog,
    fillMultistateIndicatorForm,
    readMultistateIndicatorForm,
    switchMultistateIndicatorTab: switchTab,
    wireMultistateIndicatorTools: wireTools,
    nextMultistateIndicatorName,
    defaultMultistateIndicatorComponent,
    applyMultistateIndicator
  };
})();
