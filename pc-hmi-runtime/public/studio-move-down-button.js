/** Move Down Button property dialog — FactoryTalk View parity */
(function () {
  let mvdPreviewTimer = null;
  let mvdDialogCommitted = false;

  const KEY_BUTTON_TYPES = new Set([
    'BackspaceButton', 'EndButton', 'EnterButton', 'HomeButton',
    'MoveLeftButton', 'MoveRightButton', 'MoveDownButton', 'MoveUpButton',
    'PageDownButton', 'PageUpButton'
  ]);
  const INPUT_TYPES = new Set([
    'StringInputEnable', 'NumericInputEnable', 'NumericInputCursorPoint'
  ]);

  function switchTab(tabId) {
    document.querySelectorAll('#moveDownButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.mvdTab === tabId);
    });
    document.querySelectorAll('#moveDownButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.mvdTabPanel === tabId);
    });
  }

  function mvdGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function mvdSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function fillMvdAutoRepeatRateSelect() {
    const el = document.getElementById('mvdAutoRepeatRate');
    if (!el || el.dataset.mvdRateFilled === '1') return;
    el.dataset.mvdRateFilled = '1';
    const opts = [];
    for (let n = 0; n <= 20; n++) {
      opts.push(`<option value="${n}"${n === 0 ? ' selected' : ''}>${n}</option>`);
    }
    el.innerHTML = opts.join('');
  }

  function nextMoveDownButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'MoveDownButton').length + 1;
    return `MoveDownButton${n}`;
  }

  function defaultMoveDownButtonComponent(overrides = {}) {
    return {
      type: 'MoveDownButton',
      name: 'MoveDownButton1',
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
      image: 'Arrow Down',
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

  function scheduleMoveDownButtonLivePreview() {
    if (window.state?.propsFormFill) return;
    if (mvdPreviewTimer) clearTimeout(mvdPreviewTimer);
    mvdPreviewTimer = setTimeout(() => {
      mvdPreviewTimer = null;
      if (!document.getElementById('moveDownButtonDialog')?.open) return;
      const comp = readMoveDownButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readMoveDownButtonForm, 'applyMoveDownButton');
    }, 80);
  }

  function syncMoveDownButtonFields() {
    const capColor = document.getElementById('mvdCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('mvdUseCaptionColor')?.checked;
    const capBack = document.getElementById('mvdCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('mvdUseCaptionBackColor')?.checked
      || document.getElementById('mvdCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('mvdImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('mvdUseImageColor')?.checked;
    const imgBack = document.getElementById('mvdImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('mvdUseImageBackColor')?.checked
      || document.getElementById('mvdImageBackStyle')?.value !== 'solid';
    const linked = document.getElementById('mvdSendPressTo')?.value === 'linkedObject';
    const linkedInput = document.getElementById('mvdLinkedObject');
    const browse = document.getElementById('mvdBrowseLinkedObject');
    if (linkedInput) linkedInput.disabled = !linked;
    if (browse) browse.disabled = !linked;
  }

  function wireMoveDownButtonTools() {
    fillMvdAutoRepeatRateSelect();
    const dlg = document.getElementById('moveDownButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('mvdPatternStyle', 'mvdFilled');
    document.querySelectorAll('#moveDownButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.mvdPreviewWired === '1') return;
      input.dataset.mvdPreviewWired = '1';
      input.addEventListener('input', scheduleMoveDownButtonLivePreview);
      input.addEventListener('change', scheduleMoveDownButtonLivePreview);
    });
    syncMoveDownButtonFields();
  }

  function presentMoveDownButtonDialog() {
    const dialog = document.getElementById('moveDownButtonDialog');
    if (!dialog) {
      window.setStatus('Move Down Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    mvdDialogCommitted = false;
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
        window.setStatus(`Opened Move Down Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillMoveDownButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillMvdAutoRepeatRateSelect();
      window.StudioPropsShared?.fillPatternSelect('mvdPatternStyle', 'mvdFilled');
      document.getElementById('mvdBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('mvdBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('mvdBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('mvdPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('mvdShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('mvdBorderUsesBackColor').checked = Boolean(comp.borderUsesBackColor);
      mvdSetColor('mvdBackColor', comp.backColor || '#001C38');
      mvdSetColor('mvdBorderColor', comp.borderColor || '#001C38');
      mvdSetColor('mvdPatternColor', comp.patternColor || '#ffffff');
      mvdSetColor('mvdHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('mvdBlink').checked = Boolean(comp.blink);
      document.getElementById('mvdHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('mvdVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('mvdAudio').checked = comp.audio !== false;
      const sendTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
      document.getElementById('mvdSendPressTo').value = sendTo;
      document.getElementById('mvdLinkedObject').value = comp.linkedObject || '';
      document.getElementById('mvdCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('mvdFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('mvdFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('mvdBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('mvdItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('mvdUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('mvdUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      mvdSetColor('mvdCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('mvdUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      mvdSetColor('mvdCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('mvdCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('mvdWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('mvdCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#moveDownButtonForm input[name="mvdAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('mvdImage').value = comp.image || 'Arrow Down';
      document.getElementById('mvdAutoRepeatRate').value = String(Math.min(20, Math.max(0, Number(comp.autoRepeatRate) || 0)));
      document.getElementById('mvdAutoRepeatDelay').value = String(comp.autoRepeatDelay ?? 400);
      document.getElementById('mvdImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('mvdUseImageColor').checked = Boolean(comp.useImageColor);
      mvdSetColor('mvdImageColor', comp.imageColor || '#ffffff');
      document.getElementById('mvdUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      mvdSetColor('mvdImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('mvdImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('mvdImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#moveDownButtonForm input[name="mvdImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('mvdHeight').value = comp.height ?? 80;
      document.getElementById('mvdWidth').value = comp.width ?? 80;
      document.getElementById('mvdTop').value = comp.top ?? 16;
      document.getElementById('mvdLeft').value = comp.left ?? 16;
      document.getElementById('mvdName').value = comp.name || 'MoveDownButton1';
      document.getElementById('mvdVisible').checked = comp.visible !== false;
      syncMoveDownButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readMoveDownButtonForm() {
    const caption = document.getElementById('mvdCaption')?.value || '';
    const captionColor = mvdGetColor('mvdCaptionColor');
    const sendPressTo = document.getElementById('mvdSendPressTo')?.value || 'objectWithFocus';
    return {
      type: 'MoveDownButton',
      name: document.getElementById('mvdName')?.value.trim() || 'MoveDownButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('mvdLeft')?.value) || 0,
      top: Number(document.getElementById('mvdTop')?.value) || 0,
      width: Number(document.getElementById('mvdWidth')?.value) || 80,
      height: Number(document.getElementById('mvdHeight')?.value) || 80,
      visible: document.getElementById('mvdVisible')?.checked !== false,
      borderStyle: document.getElementById('mvdBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('mvdBorderWidth')?.value) || 1,
      borderUsesBackColor: Boolean(document.getElementById('mvdBorderUsesBackColor')?.checked),
      backStyle: document.getElementById('mvdBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('mvdPatternStyle')?.value || 'none',
      shape: document.getElementById('mvdShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: mvdGetColor('mvdBackColor'),
      useBorderColor: true,
      borderColor: mvdGetColor('mvdBorderColor'),
      usePatternColor: true,
      patternColor: mvdGetColor('mvdPatternColor'),
      useHighlightColor: true,
      highlightColor: mvdGetColor('mvdHighlightColor'),
      blink: Boolean(document.getElementById('mvdBlink')?.checked),
      horizontalMargin: Number(document.getElementById('mvdHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('mvdVerticalMargin')?.value) || 0,
      audio: document.getElementById('mvdAudio')?.checked !== false,
      sendPressTo,
      linkedObject: document.getElementById('mvdLinkedObject')?.value.trim() || '',
      fontFamily: document.getElementById('mvdFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('mvdFontSize')?.value) || 10,
      bold: document.getElementById('mvdBold')?.classList.contains('active'),
      italic: document.getElementById('mvdItalic')?.classList.contains('active'),
      underline: document.getElementById('mvdUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('mvdUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('mvdUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('mvdUseCaptionBackColor')?.checked),
      captionBackColor: mvdGetColor('mvdCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('mvdCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('mvdCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('mvdWordWrap')?.checked !== false,
      alignment: document.querySelector('#moveDownButtonForm input[name="mvdAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('mvdImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('mvdImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#moveDownButtonForm input[name="mvdImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('mvdUseImageColor')?.checked),
      imageColor: mvdGetColor('mvdImageColor'),
      useImageBackColor: Boolean(document.getElementById('mvdUseImageBackColor')?.checked),
      imageBackColor: mvdGetColor('mvdImageBackColor'),
      imageBlink: Boolean(document.getElementById('mvdImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('mvdImageScaled')?.checked),
      autoRepeatRate: Number(document.getElementById('mvdAutoRepeatRate')?.value) || 0,
      autoRepeatDelay: Number(document.getElementById('mvdAutoRepeatDelay')?.value) || 400
    };
  }

  async function showMoveDownButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Move Down Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initMoveDownButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultMoveDownButtonComponent({
        name: nextMoveDownButtonName(canvas?.components),
        ...overrides
      });
      fillMoveDownButtonForm(comp);
      window.resetPropsDialogState('move-down', readMoveDownButtonForm, 'applyMoveDownButton');
      switchTab('general');
      wireMoveDownButtonTools();
      presentMoveDownButtonDialog();
      const previewComp = readMoveDownButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readMoveDownButtonForm, 'applyMoveDownButton');
    } catch (err) {
      window.setStatus(`Move Down Button properties error: ${err.message}`);
    }
  }

  async function applyMoveDownButton() {
    const comp = readMoveDownButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readMoveDownButtonForm, 'applyMoveDownButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveMoveDownButton(e) {
    e.preventDefault();
    const comp = readMoveDownButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    mvdDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('moveDownButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertHmbCaptionText(text) {
    const area = document.getElementById('mvdCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleMoveDownButtonLivePreview();
  }

  function insertHmbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertHmbCaptionText(tag);
    });
  }

  function hideHmbInsertVariableMenu() {
    document.getElementById('mvdInsertVariableMenu')?.classList.add('hidden');
  }

  function listBrowsableObjects() {
    const selfName = document.getElementById('mvdName')?.value.trim();
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
    const dlg = document.getElementById('mvdObjectBrowserDialog');
    if (!dlg) return;
    try { dlg.close(); } catch (_) {
      dlg.removeAttribute('open');
      dlg.style.display = 'none';
    }
  }

  function openObjectBrowser() {
    const dlg = document.getElementById('mvdObjectBrowserDialog');
    const list = document.getElementById('mvdObjectBrowserList');
    if (!dlg || !list) return;
    const items = listBrowsableObjects();
    const current = document.getElementById('mvdLinkedObject')?.value.trim() || '';
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
    const list = document.getElementById('mvdObjectBrowserList');
    const name = list?.value?.trim();
    if (name) {
      document.getElementById('mvdLinkedObject').value = name;
      scheduleMoveDownButtonLivePreview();
      window.flushPropsApplyButton?.(readMoveDownButtonForm, 'applyMoveDownButton');
    }
    closeObjectBrowser();
  }

  function initMoveDownButtonDialog() {
    const form = document.getElementById('moveDownButtonForm');
    if (!form || form.dataset.mvdWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('mvdPatternStyle', 'mvdFilled');
    form.addEventListener('submit', (e) => saveMoveDownButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyMoveDownButton')?.addEventListener('click', () => {
      applyMoveDownButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleMoveDownButtonLivePreview();
      window.flushPropsApplyButton?.(readMoveDownButtonForm, 'applyMoveDownButton');
    });
    form.addEventListener('change', () => {
      syncMoveDownButtonFields();
      scheduleMoveDownButtonLivePreview();
      window.flushPropsApplyButton?.(readMoveDownButtonForm, 'applyMoveDownButton');
    });
    document.getElementById('cancelMoveDownButton')?.addEventListener('click', () => {
      if (!mvdDialogCommitted) window.revertPropsDialogPreview?.();
      mvdDialogCommitted = true;
      document.getElementById('moveDownButtonDialog')?.close();
    });
    document.getElementById('moveDownButtonDialog')?.addEventListener('close', () => {
      if (mvdPreviewTimer) {
        clearTimeout(mvdPreviewTimer);
        mvdPreviewTimer = null;
      }
      hideHmbInsertVariableMenu();
      closeObjectBrowser();
      if (!mvdDialogCommitted) window.revertPropsDialogPreview?.();
      mvdDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpMoveDownButton')?.addEventListener('click', () => {
      alert('Move Down Button sends ArrowDown repeatedly while held (per the Timing settings) to the object with focus, or to a linked input object.');
    });
    document.querySelectorAll('#moveDownButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideHmbInsertVariableMenu();
        switchTab(tab.dataset.mvdTab);
      });
    });
    document.getElementById('mvdBrowseLinkedObject')?.addEventListener('click', () => {
      if (document.getElementById('mvdBrowseLinkedObject')?.disabled) return;
      openObjectBrowser();
    });
    document.getElementById('mvdObjectBrowserOk')?.addEventListener('click', acceptObjectBrowser);
    document.getElementById('mvdObjectBrowserList')?.addEventListener('dblclick', acceptObjectBrowser);
    document.getElementById('mvdObjectBrowserCancel')?.addEventListener('click', closeObjectBrowser);
    document.getElementById('mvdObjectBrowserHelp')?.addEventListener('click', () => {
      alert('Select a display object to receive the Home press. Input objects are listed first when present.');
    });
    document.getElementById('mvdBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('mvdImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('mvdImage').value = fileName;
          scheduleMoveDownButtonLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('mvdInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('mvdInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('mvdInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.mvdVar;
      if (!kind) return;
      hideHmbInsertVariableMenu();
      if (kind === 'timedate') insertHmbCaptionText('{#dt}');
      else insertHmbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#moveDownButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideHmbInsertVariableMenu();
    });
    document.getElementById('mvdShape')?.addEventListener('change', () => {
      if (document.getElementById('mvdShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('mvdWidth')?.value) || 0;
      const h = Number(document.getElementById('mvdHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('mvdWidth').value = String(size);
      document.getElementById('mvdHeight').value = String(size);
    });
    for (const id of ['mvdBold', 'mvdItalic', 'mvdUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleMoveDownButtonLivePreview();
      });
    }
    form.dataset.mvdWired = '1';
  }

  window.StudioMoveDownButton = {
    initMoveDownButtonDialog,
    presentMoveDownButtonDialog,
    scheduleMoveDownButtonLivePreview,
    showMoveDownButtonDialog,
    fillMoveDownButtonForm,
    readMoveDownButtonForm,
    switchMoveDownButtonTab: switchTab,
    wireMoveDownButtonTools,
    nextMoveDownButtonName,
    defaultMoveDownButtonComponent,
    applyMoveDownButton
  };
})();
