/** Move Right Button property dialog — FactoryTalk View parity */
(function () {
  let mvrPreviewTimer = null;
  let mvrDialogCommitted = false;

  const KEY_BUTTON_TYPES = new Set([
    'BackspaceButton', 'EndButton', 'EnterButton', 'HomeButton',
    'MoveLeftButton', 'MoveRightButton', 'MoveDownButton', 'MoveUpButton',
    'PageDownButton', 'PageUpButton'
  ]);
  const INPUT_TYPES = new Set([
    'StringInputEnable', 'NumericInputEnable', 'NumericInputCursorPoint'
  ]);

  function switchTab(tabId) {
    document.querySelectorAll('#moveRightButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.mvrTab === tabId);
    });
    document.querySelectorAll('#moveRightButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.mvrTabPanel === tabId);
    });
  }

  function mvrGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function mvrSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function fillMvrAutoRepeatRateSelect() {
    const el = document.getElementById('mvrAutoRepeatRate');
    if (!el || el.dataset.mvrRateFilled === '1') return;
    el.dataset.mvrRateFilled = '1';
    const opts = [];
    for (let n = 0; n <= 20; n++) {
      opts.push(`<option value="${n}"${n === 0 ? ' selected' : ''}>${n}</option>`);
    }
    el.innerHTML = opts.join('');
  }

  function nextMoveRightButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'MoveRightButton').length + 1;
    return `MoveRightButton${n}`;
  }

  function defaultMoveRightButtonComponent(overrides = {}) {
    return {
      type: 'MoveRightButton',
      name: 'MoveRightButton1',
      caption: '',
      label: '',
      left: 16,
      top: 16,
      width: 80,
      height: 80,
      visible: true,
      borderStyle: 'line',
      borderWidth: 1,
      borderUsesBackColor: false,
      backStyle: 'solid',
      patternStyle: 'none',
      shape: 'rectangle',
      useBackColor: true,
      backColor: '#001C38',
      useBorderColor: true,
      borderColor: '#001C38',
      usePatternColor: true,
      patternColor: '#ffffff',
      useHighlightColor: true,
      highlightColor: '#0066cc',
      blink: false,
      horizontalMargin: 0,
      verticalMargin: 0,
      audio: true,
      sendPressTo: 'objectWithFocus',
      linkedObject: '',
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      alignment: 'middleCenter',
      wordWrap: true,
      useCaptionColor: false,
      captionColor: '#ffffff',
      foreColor: '#ffffff',
      useForeColor: false,
      captionBackStyle: 'transparent',
      useCaptionBackColor: false,
      captionBackColor: '#001C38',
      captionBlink: false,
      image: 'Arrow Right',
      autoRepeatRate: 0,
      autoRepeatDelay: 400,
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      useImageColor: false,
      imageColor: '#ffffff',
      useImageBackColor: false,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: false,
      ...overrides
    };
  }

  function scheduleMoveRightButtonLivePreview() {
    if (window.state?.propsFormFill) return;
    if (mvrPreviewTimer) clearTimeout(mvrPreviewTimer);
    mvrPreviewTimer = setTimeout(() => {
      mvrPreviewTimer = null;
      if (!document.getElementById('moveRightButtonDialog')?.open) return;
      const comp = readMoveRightButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readMoveRightButtonForm, 'applyMoveRightButton');
    }, 80);
  }

  function syncMoveRightButtonFields() {
    const capColor = document.getElementById('mvrCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('mvrUseCaptionColor')?.checked;
    const capBack = document.getElementById('mvrCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('mvrUseCaptionBackColor')?.checked
      || document.getElementById('mvrCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('mvrImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('mvrUseImageColor')?.checked;
    const imgBack = document.getElementById('mvrImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('mvrUseImageBackColor')?.checked
      || document.getElementById('mvrImageBackStyle')?.value !== 'solid';
    const linked = document.getElementById('mvrSendPressTo')?.value === 'linkedObject';
    const linkedInput = document.getElementById('mvrLinkedObject');
    const browse = document.getElementById('mvrBrowseLinkedObject');
    if (linkedInput) linkedInput.disabled = !linked;
    if (browse) browse.disabled = !linked;
  }

  function wireMoveRightButtonTools() {
    fillMvrAutoRepeatRateSelect();
    const dlg = document.getElementById('moveRightButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('mvrPatternStyle', 'mvrFilled');
    document.querySelectorAll('#moveRightButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.mvrPreviewWired === '1') return;
      input.dataset.mvrPreviewWired = '1';
      input.addEventListener('input', scheduleMoveRightButtonLivePreview);
      input.addEventListener('change', scheduleMoveRightButtonLivePreview);
    });
    syncMoveRightButtonFields();
  }

  function presentMoveRightButtonDialog() {
    const dialog = document.getElementById('moveRightButtonDialog');
    if (!dialog) {
      window.setStatus('Move Right Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    mvrDialogCommitted = false;
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
        window.setStatus(`Opened Move Right Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillMoveRightButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillMvrAutoRepeatRateSelect();
      window.StudioPropsShared?.fillPatternSelect('mvrPatternStyle', 'mvrFilled');
      document.getElementById('mvrBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('mvrBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('mvrBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('mvrPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('mvrShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('mvrBorderUsesBackColor').checked = Boolean(comp.borderUsesBackColor);
      mvrSetColor('mvrBackColor', comp.backColor || '#001C38');
      mvrSetColor('mvrBorderColor', comp.borderColor || '#001C38');
      mvrSetColor('mvrPatternColor', comp.patternColor || '#ffffff');
      mvrSetColor('mvrHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('mvrBlink').checked = Boolean(comp.blink);
      document.getElementById('mvrHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('mvrVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('mvrAudio').checked = comp.audio !== false;
      const sendTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
      document.getElementById('mvrSendPressTo').value = sendTo;
      document.getElementById('mvrLinkedObject').value = comp.linkedObject || '';
      document.getElementById('mvrCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('mvrFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('mvrFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('mvrBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('mvrItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('mvrUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('mvrUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      mvrSetColor('mvrCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('mvrUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      mvrSetColor('mvrCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('mvrCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('mvrWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('mvrCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#moveRightButtonForm input[name="mvrAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('mvrImage').value = comp.image || 'Arrow Right';
      document.getElementById('mvrAutoRepeatRate').value = String(Math.min(20, Math.max(0, Number(comp.autoRepeatRate) || 0)));
      document.getElementById('mvrAutoRepeatDelay').value = String(comp.autoRepeatDelay ?? 400);
      document.getElementById('mvrImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('mvrUseImageColor').checked = Boolean(comp.useImageColor);
      mvrSetColor('mvrImageColor', comp.imageColor || '#ffffff');
      document.getElementById('mvrUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      mvrSetColor('mvrImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('mvrImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('mvrImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#moveRightButtonForm input[name="mvrImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('mvrHeight').value = comp.height ?? 80;
      document.getElementById('mvrWidth').value = comp.width ?? 80;
      document.getElementById('mvrTop').value = comp.top ?? 16;
      document.getElementById('mvrLeft').value = comp.left ?? 16;
      document.getElementById('mvrName').value = comp.name || 'MoveRightButton1';
      document.getElementById('mvrVisible').checked = comp.visible !== false;
      syncMoveRightButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readMoveRightButtonForm() {
    const caption = document.getElementById('mvrCaption')?.value || '';
    const captionColor = mvrGetColor('mvrCaptionColor');
    const sendPressTo = document.getElementById('mvrSendPressTo')?.value || 'objectWithFocus';
    return {
      type: 'MoveRightButton',
      name: document.getElementById('mvrName')?.value.trim() || 'MoveRightButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('mvrLeft')?.value) || 0,
      top: Number(document.getElementById('mvrTop')?.value) || 0,
      width: Number(document.getElementById('mvrWidth')?.value) || 80,
      height: Number(document.getElementById('mvrHeight')?.value) || 80,
      visible: document.getElementById('mvrVisible')?.checked !== false,
      borderStyle: document.getElementById('mvrBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('mvrBorderWidth')?.value) || 1,
      borderUsesBackColor: Boolean(document.getElementById('mvrBorderUsesBackColor')?.checked),
      backStyle: document.getElementById('mvrBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('mvrPatternStyle')?.value || 'none',
      shape: document.getElementById('mvrShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: mvrGetColor('mvrBackColor'),
      useBorderColor: true,
      borderColor: mvrGetColor('mvrBorderColor'),
      usePatternColor: true,
      patternColor: mvrGetColor('mvrPatternColor'),
      useHighlightColor: true,
      highlightColor: mvrGetColor('mvrHighlightColor'),
      blink: Boolean(document.getElementById('mvrBlink')?.checked),
      horizontalMargin: Number(document.getElementById('mvrHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('mvrVerticalMargin')?.value) || 0,
      audio: document.getElementById('mvrAudio')?.checked !== false,
      sendPressTo,
      linkedObject: document.getElementById('mvrLinkedObject')?.value.trim() || '',
      fontFamily: document.getElementById('mvrFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('mvrFontSize')?.value) || 10,
      bold: document.getElementById('mvrBold')?.classList.contains('active'),
      italic: document.getElementById('mvrItalic')?.classList.contains('active'),
      underline: document.getElementById('mvrUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('mvrUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('mvrUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('mvrUseCaptionBackColor')?.checked),
      captionBackColor: mvrGetColor('mvrCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('mvrCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('mvrCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('mvrWordWrap')?.checked !== false,
      alignment: document.querySelector('#moveRightButtonForm input[name="mvrAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('mvrImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('mvrImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#moveRightButtonForm input[name="mvrImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('mvrUseImageColor')?.checked),
      imageColor: mvrGetColor('mvrImageColor'),
      useImageBackColor: Boolean(document.getElementById('mvrUseImageBackColor')?.checked),
      imageBackColor: mvrGetColor('mvrImageBackColor'),
      imageBlink: Boolean(document.getElementById('mvrImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('mvrImageScaled')?.checked),
      autoRepeatRate: Number(document.getElementById('mvrAutoRepeatRate')?.value) || 0,
      autoRepeatDelay: Number(document.getElementById('mvrAutoRepeatDelay')?.value) || 400
    };
  }

  async function showMoveRightButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Move Right Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initMoveRightButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultMoveRightButtonComponent({
        name: nextMoveRightButtonName(canvas?.components),
        ...overrides
      });
      fillMoveRightButtonForm(comp);
      window.resetPropsDialogState('move-right', readMoveRightButtonForm, 'applyMoveRightButton');
      switchTab('general');
      wireMoveRightButtonTools();
      presentMoveRightButtonDialog();
      const previewComp = readMoveRightButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readMoveRightButtonForm, 'applyMoveRightButton');
    } catch (err) {
      window.setStatus(`Move Right Button properties error: ${err.message}`);
    }
  }

  async function applyMoveRightButton() {
    const comp = readMoveRightButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readMoveRightButtonForm, 'applyMoveRightButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveMoveRightButton(e) {
    e.preventDefault();
    const comp = readMoveRightButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    mvrDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('moveRightButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertHmbCaptionText(text) {
    const area = document.getElementById('mvrCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleMoveRightButtonLivePreview();
  }

  function insertHmbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertHmbCaptionText(tag);
    });
  }

  function hideHmbInsertVariableMenu() {
    document.getElementById('mvrInsertVariableMenu')?.classList.add('hidden');
  }

  function listBrowsableObjects() {
    const selfName = document.getElementById('mvrName')?.value.trim();
    const seen = new Set();
    const items = [];
    const add = (comp) => {
      const name = comp?.name;
      if (!name || name === selfName || seen.has(name)) return;
      if (KEY_BUTTON_TYPES.has(comp.type)) return;
      seen.add(name);
      items.push({ name, type: comp.type || '' });
    };
    const entries = window.state?.canvasEditCache?.editComponents || [];
    for (const entry of entries) add(entry?.comp || entry);
    const raw = window.state?.canvasEditCache?.raw?.components || [];
    for (const comp of raw) add(comp);
    items.sort((a, b) => {
      const at = INPUT_TYPES.has(a.type) ? 0 : 1;
      const bt = INPUT_TYPES.has(b.type) ? 0 : 1;
      if (at !== bt) return at - bt;
      return a.name.localeCompare(b.name);
    });
    return items;
  }

  function closeObjectBrowser() {
    const dlg = document.getElementById('mvrObjectBrowserDialog');
    if (!dlg) return;
    try { dlg.close(); } catch (_) {
      dlg.removeAttribute('open');
      dlg.style.display = 'none';
    }
  }

  function openObjectBrowser() {
    const dlg = document.getElementById('mvrObjectBrowserDialog');
    const list = document.getElementById('mvrObjectBrowserList');
    if (!dlg || !list) return;
    const items = listBrowsableObjects();
    const current = document.getElementById('mvrLinkedObject')?.value.trim() || '';
    list.innerHTML = items.length
      ? items.map((item) => `<option value="${String(item.name).replace(/"/g, '&quot;')}">${item.name}</option>`).join('')
      : '<option value="" disabled>No objects on this display</option>';
    if (current) list.value = current;
    else if (items.length) list.selectedIndex = 0;
    dlg.classList.add('is-positioned');
    dlg.style.position = 'fixed';
    dlg.style.margin = '0';
    dlg.style.left = '120px';
    dlg.style.top = '120px';
    dlg.style.zIndex = '40000';
    try {
      if (!dlg.open) dlg.showModal();
    } catch (_) {
      dlg.setAttribute('open', '');
      dlg.style.display = 'block';
    }
  }

  function acceptObjectBrowser() {
    const list = document.getElementById('mvrObjectBrowserList');
    const name = list?.value?.trim();
    if (name) {
      document.getElementById('mvrLinkedObject').value = name;
      scheduleMoveRightButtonLivePreview();
      window.flushPropsApplyButton?.(readMoveRightButtonForm, 'applyMoveRightButton');
    }
    closeObjectBrowser();
  }

  function initMoveRightButtonDialog() {
    const form = document.getElementById('moveRightButtonForm');
    if (!form || form.dataset.mvrWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('mvrPatternStyle', 'mvrFilled');
    form.addEventListener('submit', (e) => saveMoveRightButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyMoveRightButton')?.addEventListener('click', () => {
      applyMoveRightButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleMoveRightButtonLivePreview();
      window.flushPropsApplyButton?.(readMoveRightButtonForm, 'applyMoveRightButton');
    });
    form.addEventListener('change', () => {
      syncMoveRightButtonFields();
      scheduleMoveRightButtonLivePreview();
      window.flushPropsApplyButton?.(readMoveRightButtonForm, 'applyMoveRightButton');
    });
    document.getElementById('cancelMoveRightButton')?.addEventListener('click', () => {
      if (!mvrDialogCommitted) window.revertPropsDialogPreview?.();
      mvrDialogCommitted = true;
      document.getElementById('moveRightButtonDialog')?.close();
    });
    document.getElementById('moveRightButtonDialog')?.addEventListener('close', () => {
      if (mvrPreviewTimer) {
        clearTimeout(mvrPreviewTimer);
        mvrPreviewTimer = null;
      }
      hideHmbInsertVariableMenu();
      closeObjectBrowser();
      if (!mvrDialogCommitted) window.revertPropsDialogPreview?.();
      mvrDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpMoveRightButton')?.addEventListener('click', () => {
      alert('Move Right Button sends ArrowRight repeatedly while held (per the Timing settings) to the object with focus, or to a linked input object.');
    });
    document.querySelectorAll('#moveRightButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideHmbInsertVariableMenu();
        switchTab(tab.dataset.mvrTab);
      });
    });
    document.getElementById('mvrBrowseLinkedObject')?.addEventListener('click', () => {
      if (document.getElementById('mvrBrowseLinkedObject')?.disabled) return;
      openObjectBrowser();
    });
    document.getElementById('mvrObjectBrowserOk')?.addEventListener('click', acceptObjectBrowser);
    document.getElementById('mvrObjectBrowserList')?.addEventListener('dblclick', acceptObjectBrowser);
    document.getElementById('mvrObjectBrowserCancel')?.addEventListener('click', closeObjectBrowser);
    document.getElementById('mvrObjectBrowserHelp')?.addEventListener('click', () => {
      alert('Select a display object to receive the Home press. Input objects are listed first when present.');
    });
    document.getElementById('mvrBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('mvrImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('mvrImage').value = fileName;
          scheduleMoveRightButtonLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('mvrInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('mvrInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('mvrInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.mvrVar;
      if (!kind) return;
      hideHmbInsertVariableMenu();
      if (kind === 'timedate') insertHmbCaptionText('{#dt}');
      else insertHmbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#moveRightButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideHmbInsertVariableMenu();
    });
    document.getElementById('mvrShape')?.addEventListener('change', () => {
      if (document.getElementById('mvrShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('mvrWidth')?.value) || 0;
      const h = Number(document.getElementById('mvrHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('mvrWidth').value = String(size);
      document.getElementById('mvrHeight').value = String(size);
    });
    for (const id of ['mvrBold', 'mvrItalic', 'mvrUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleMoveRightButtonLivePreview();
      });
    }
    form.dataset.mvrWired = '1';
  }

  window.StudioMoveRightButton = {
    initMoveRightButtonDialog,
    presentMoveRightButtonDialog,
    scheduleMoveRightButtonLivePreview,
    showMoveRightButtonDialog,
    fillMoveRightButtonForm,
    readMoveRightButtonForm,
    switchMoveRightButtonTab: switchTab,
    wireMoveRightButtonTools,
    nextMoveRightButtonName,
    defaultMoveRightButtonComponent,
    applyMoveRightButton
  };
})();
