/** Page Down Button property dialog — FactoryTalk View parity */
(function () {
  let pgdPreviewTimer = null;
  let pgdDialogCommitted = false;

  const KEY_BUTTON_TYPES = new Set([
    'BackspaceButton', 'EndButton', 'EnterButton', 'HomeButton',
    'MoveLeftButton', 'MoveRightButton', 'MoveDownButton', 'MoveUpButton',
    'PageDownButton', 'PageUpButton'
  ]);
  const INPUT_TYPES = new Set([
    'StringInputEnable', 'NumericInputEnable', 'NumericInputCursorPoint'
  ]);

  function switchTab(tabId) {
    document.querySelectorAll('#pageDownButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.pgdTab === tabId);
    });
    document.querySelectorAll('#pageDownButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.pgdTabPanel === tabId);
    });
  }

  function pgdGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function pgdSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function fillMvlAutoRepeatRateSelect() {
    const el = document.getElementById('pgdAutoRepeatRate');
    if (!el || el.dataset.pgdRateFilled === '1') return;
    el.dataset.pgdRateFilled = '1';
    const opts = [];
    for (let n = 0; n <= 20; n++) {
      opts.push(`<option value="${n}"${n === 0 ? ' selected' : ''}>${n}</option>`);
    }
    el.innerHTML = opts.join('');
  }

  function nextPageDownButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'PageDownButton').length + 1;
    return `PageDownButton${n}`;
  }

  function defaultPageDownButtonComponent(overrides = {}) {
    return {
      type: 'PageDownButton',
      name: 'PageDownButton1',
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
      image: 'Page Down',
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

  function schedulePageDownButtonLivePreview() {
    if (window.state?.propsFormFill) return;
    if (pgdPreviewTimer) clearTimeout(pgdPreviewTimer);
    pgdPreviewTimer = setTimeout(() => {
      pgdPreviewTimer = null;
      if (!document.getElementById('pageDownButtonDialog')?.open) return;
      const comp = readPageDownButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readPageDownButtonForm, 'applyPageDownButton');
    }, 80);
  }

  function syncPageDownButtonFields() {
    const capColor = document.getElementById('pgdCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('pgdUseCaptionColor')?.checked;
    const capBack = document.getElementById('pgdCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('pgdUseCaptionBackColor')?.checked
      || document.getElementById('pgdCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('pgdImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('pgdUseImageColor')?.checked;
    const imgBack = document.getElementById('pgdImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('pgdUseImageBackColor')?.checked
      || document.getElementById('pgdImageBackStyle')?.value !== 'solid';
    const linked = document.getElementById('pgdSendPressTo')?.value === 'linkedObject';
    const linkedInput = document.getElementById('pgdLinkedObject');
    const browse = document.getElementById('pgdBrowseLinkedObject');
    if (linkedInput) linkedInput.disabled = !linked;
    if (browse) browse.disabled = !linked;
  }

  function wirePageDownButtonTools() {
    fillMvlAutoRepeatRateSelect();
    const dlg = document.getElementById('pageDownButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('pgdPatternStyle', 'pgdFilled');
    document.querySelectorAll('#pageDownButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.pgdPreviewWired === '1') return;
      input.dataset.pgdPreviewWired = '1';
      input.addEventListener('input', schedulePageDownButtonLivePreview);
      input.addEventListener('change', schedulePageDownButtonLivePreview);
    });
    syncPageDownButtonFields();
  }

  function presentPageDownButtonDialog() {
    const dialog = document.getElementById('pageDownButtonDialog');
    if (!dialog) {
      window.setStatus('Page Down Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    pgdDialogCommitted = false;
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
        window.setStatus(`Opened Page Down Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillPageDownButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillMvlAutoRepeatRateSelect();
      window.StudioPropsShared?.fillPatternSelect('pgdPatternStyle', 'pgdFilled');
      document.getElementById('pgdBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('pgdBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('pgdBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('pgdPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('pgdShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('pgdBorderUsesBackColor').checked = Boolean(comp.borderUsesBackColor);
      pgdSetColor('pgdBackColor', comp.backColor || '#001C38');
      pgdSetColor('pgdBorderColor', comp.borderColor || '#001C38');
      pgdSetColor('pgdPatternColor', comp.patternColor || '#ffffff');
      pgdSetColor('pgdHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('pgdBlink').checked = Boolean(comp.blink);
      document.getElementById('pgdHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('pgdVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('pgdAudio').checked = comp.audio !== false;
      const sendTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
      document.getElementById('pgdSendPressTo').value = sendTo;
      document.getElementById('pgdLinkedObject').value = comp.linkedObject || '';
      document.getElementById('pgdCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('pgdFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('pgdFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('pgdBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('pgdItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('pgdUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('pgdUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      pgdSetColor('pgdCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('pgdUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      pgdSetColor('pgdCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('pgdCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('pgdWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('pgdCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#pageDownButtonForm input[name="pgdAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('pgdImage').value = comp.image || 'Page Down';
      document.getElementById('pgdAutoRepeatRate').value = String(Math.min(20, Math.max(0, Number(comp.autoRepeatRate) || 0)));
      document.getElementById('pgdAutoRepeatDelay').value = String(comp.autoRepeatDelay ?? 400);
      document.getElementById('pgdImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('pgdUseImageColor').checked = Boolean(comp.useImageColor);
      pgdSetColor('pgdImageColor', comp.imageColor || '#ffffff');
      document.getElementById('pgdUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      pgdSetColor('pgdImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('pgdImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('pgdImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#pageDownButtonForm input[name="pgdImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('pgdHeight').value = comp.height ?? 80;
      document.getElementById('pgdWidth').value = comp.width ?? 80;
      document.getElementById('pgdTop').value = comp.top ?? 16;
      document.getElementById('pgdLeft').value = comp.left ?? 16;
      document.getElementById('pgdName').value = comp.name || 'PageDownButton1';
      document.getElementById('pgdVisible').checked = comp.visible !== false;
      syncPageDownButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readPageDownButtonForm() {
    const caption = document.getElementById('pgdCaption')?.value || '';
    const captionColor = pgdGetColor('pgdCaptionColor');
    const sendPressTo = document.getElementById('pgdSendPressTo')?.value || 'objectWithFocus';
    return {
      type: 'PageDownButton',
      name: document.getElementById('pgdName')?.value.trim() || 'PageDownButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('pgdLeft')?.value) || 0,
      top: Number(document.getElementById('pgdTop')?.value) || 0,
      width: Number(document.getElementById('pgdWidth')?.value) || 80,
      height: Number(document.getElementById('pgdHeight')?.value) || 80,
      visible: document.getElementById('pgdVisible')?.checked !== false,
      borderStyle: document.getElementById('pgdBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('pgdBorderWidth')?.value) || 1,
      borderUsesBackColor: Boolean(document.getElementById('pgdBorderUsesBackColor')?.checked),
      backStyle: document.getElementById('pgdBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('pgdPatternStyle')?.value || 'none',
      shape: document.getElementById('pgdShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: pgdGetColor('pgdBackColor'),
      useBorderColor: true,
      borderColor: pgdGetColor('pgdBorderColor'),
      usePatternColor: true,
      patternColor: pgdGetColor('pgdPatternColor'),
      useHighlightColor: true,
      highlightColor: pgdGetColor('pgdHighlightColor'),
      blink: Boolean(document.getElementById('pgdBlink')?.checked),
      horizontalMargin: Number(document.getElementById('pgdHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('pgdVerticalMargin')?.value) || 0,
      audio: document.getElementById('pgdAudio')?.checked !== false,
      sendPressTo,
      linkedObject: document.getElementById('pgdLinkedObject')?.value.trim() || '',
      fontFamily: document.getElementById('pgdFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('pgdFontSize')?.value) || 10,
      bold: document.getElementById('pgdBold')?.classList.contains('active'),
      italic: document.getElementById('pgdItalic')?.classList.contains('active'),
      underline: document.getElementById('pgdUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('pgdUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('pgdUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('pgdUseCaptionBackColor')?.checked),
      captionBackColor: pgdGetColor('pgdCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('pgdCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('pgdCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('pgdWordWrap')?.checked !== false,
      alignment: document.querySelector('#pageDownButtonForm input[name="pgdAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('pgdImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('pgdImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#pageDownButtonForm input[name="pgdImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('pgdUseImageColor')?.checked),
      imageColor: pgdGetColor('pgdImageColor'),
      useImageBackColor: Boolean(document.getElementById('pgdUseImageBackColor')?.checked),
      imageBackColor: pgdGetColor('pgdImageBackColor'),
      imageBlink: Boolean(document.getElementById('pgdImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('pgdImageScaled')?.checked),
      autoRepeatRate: Number(document.getElementById('pgdAutoRepeatRate')?.value) || 0,
      autoRepeatDelay: Number(document.getElementById('pgdAutoRepeatDelay')?.value) || 400
    };
  }

  async function showPageDownButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Page Down Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initPageDownButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultPageDownButtonComponent({
        name: nextPageDownButtonName(canvas?.components),
        ...overrides
      });
      fillPageDownButtonForm(comp);
      window.resetPropsDialogState('page-down', readPageDownButtonForm, 'applyPageDownButton');
      switchTab('general');
      wirePageDownButtonTools();
      presentPageDownButtonDialog();
      const previewComp = readPageDownButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readPageDownButtonForm, 'applyPageDownButton');
    } catch (err) {
      window.setStatus(`Page Down Button properties error: ${err.message}`);
    }
  }

  async function applyPageDownButton() {
    const comp = readPageDownButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readPageDownButtonForm, 'applyPageDownButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function savePageDownButton(e) {
    e.preventDefault();
    const comp = readPageDownButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    pgdDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('pageDownButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertHmbCaptionText(text) {
    const area = document.getElementById('pgdCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    schedulePageDownButtonLivePreview();
  }

  function insertHmbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertHmbCaptionText(tag);
    });
  }

  function hideHmbInsertVariableMenu() {
    document.getElementById('pgdInsertVariableMenu')?.classList.add('hidden');
  }

  function listBrowsableObjects() {
    const selfName = document.getElementById('pgdName')?.value.trim();
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
    const dlg = document.getElementById('pgdObjectBrowserDialog');
    if (!dlg) return;
    try { dlg.close(); } catch (_) {
      dlg.removeAttribute('open');
      dlg.style.display = 'none';
    }
  }

  function openObjectBrowser() {
    const dlg = document.getElementById('pgdObjectBrowserDialog');
    const list = document.getElementById('pgdObjectBrowserList');
    if (!dlg || !list) return;
    const items = listBrowsableObjects();
    const current = document.getElementById('pgdLinkedObject')?.value.trim() || '';
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
    const list = document.getElementById('pgdObjectBrowserList');
    const name = list?.value?.trim();
    if (name) {
      document.getElementById('pgdLinkedObject').value = name;
      schedulePageDownButtonLivePreview();
      window.flushPropsApplyButton?.(readPageDownButtonForm, 'applyPageDownButton');
    }
    closeObjectBrowser();
  }

  function initPageDownButtonDialog() {
    const form = document.getElementById('pageDownButtonForm');
    if (!form || form.dataset.pgdWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('pgdPatternStyle', 'pgdFilled');
    form.addEventListener('submit', (e) => savePageDownButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyPageDownButton')?.addEventListener('click', () => {
      applyPageDownButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      schedulePageDownButtonLivePreview();
      window.flushPropsApplyButton?.(readPageDownButtonForm, 'applyPageDownButton');
    });
    form.addEventListener('change', () => {
      syncPageDownButtonFields();
      schedulePageDownButtonLivePreview();
      window.flushPropsApplyButton?.(readPageDownButtonForm, 'applyPageDownButton');
    });
    document.getElementById('cancelPageDownButton')?.addEventListener('click', () => {
      if (!pgdDialogCommitted) window.revertPropsDialogPreview?.();
      pgdDialogCommitted = true;
      document.getElementById('pageDownButtonDialog')?.close();
    });
    document.getElementById('pageDownButtonDialog')?.addEventListener('close', () => {
      if (pgdPreviewTimer) {
        clearTimeout(pgdPreviewTimer);
        pgdPreviewTimer = null;
      }
      hideHmbInsertVariableMenu();
      closeObjectBrowser();
      if (!pgdDialogCommitted) window.revertPropsDialogPreview?.();
      pgdDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpPageDownButton')?.addEventListener('click', () => {
      alert('Page Down Button sends PageDown repeatedly while held (per the Timing settings) to the object with focus, or to a linked input object.');
    });
    document.querySelectorAll('#pageDownButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideHmbInsertVariableMenu();
        switchTab(tab.dataset.pgdTab);
      });
    });
    document.getElementById('pgdBrowseLinkedObject')?.addEventListener('click', () => {
      if (document.getElementById('pgdBrowseLinkedObject')?.disabled) return;
      openObjectBrowser();
    });
    document.getElementById('pgdObjectBrowserOk')?.addEventListener('click', acceptObjectBrowser);
    document.getElementById('pgdObjectBrowserList')?.addEventListener('dblclick', acceptObjectBrowser);
    document.getElementById('pgdObjectBrowserCancel')?.addEventListener('click', closeObjectBrowser);
    document.getElementById('pgdObjectBrowserHelp')?.addEventListener('click', () => {
      alert('Select a display object to receive the Home press. Input objects are listed first when present.');
    });
    document.getElementById('pgdBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('pgdImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('pgdImage').value = fileName;
          schedulePageDownButtonLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('pgdInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('pgdInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('pgdInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.pgdVar;
      if (!kind) return;
      hideHmbInsertVariableMenu();
      if (kind === 'timedate') insertHmbCaptionText('{#dt}');
      else insertHmbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#pageDownButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideHmbInsertVariableMenu();
    });
    document.getElementById('pgdShape')?.addEventListener('change', () => {
      if (document.getElementById('pgdShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('pgdWidth')?.value) || 0;
      const h = Number(document.getElementById('pgdHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('pgdWidth').value = String(size);
      document.getElementById('pgdHeight').value = String(size);
    });
    for (const id of ['pgdBold', 'pgdItalic', 'pgdUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        schedulePageDownButtonLivePreview();
      });
    }
    form.dataset.pgdWired = '1';
  }

  window.StudioPageDownButton = {
    initPageDownButtonDialog,
    presentPageDownButtonDialog,
    schedulePageDownButtonLivePreview,
    showPageDownButtonDialog,
    fillPageDownButtonForm,
    readPageDownButtonForm,
    switchPageDownButtonTab: switchTab,
    wirePageDownButtonTools,
    nextPageDownButtonName,
    defaultPageDownButtonComponent,
    applyPageDownButton
  };
})();
