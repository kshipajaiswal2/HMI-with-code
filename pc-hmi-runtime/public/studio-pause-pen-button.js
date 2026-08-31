/** Pause Pen Button property dialog — FactoryTalk View parity */
(function () {
  let ppbPreviewTimer = null;
  let ppbDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#pausePenButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.ppbTab === tabId);
    });
    document.querySelectorAll('#pausePenButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.ppbTabPanel === tabId);
    });
  }

  function ppbGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function ppbSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextPausePenButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'PausePenButton').length + 1;
    return `PausePenButton${n}`;
  }

  function defaultPausePenButtonComponent(overrides = {}) {
    return {
      type: 'PausePenButton',
      name: 'PausePenButton1',
      caption: '',
      label: '',
      left: 16,
      top: 16,
      width: 80,
      height: 80,
      visible: true,
      borderStyle: 'line',
      borderWidth: 1,
      borderUsesBackColor: true,
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
      image: '',
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

  function schedulePausePenLivePreview() {
    if (window.state?.propsFormFill) return;
    if (ppbPreviewTimer) clearTimeout(ppbPreviewTimer);
    ppbPreviewTimer = setTimeout(() => {
      ppbPreviewTimer = null;
      if (!document.getElementById('pausePenButtonDialog')?.open) return;
      const comp = readPausePenButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readPausePenButtonForm, 'applyPausePenButton');
    }, 80);
  }

  function syncPausePenFields() {
    const capColor = document.getElementById('ppbCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('ppbUseCaptionColor')?.checked;
    const capBack = document.getElementById('ppbCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('ppbUseCaptionBackColor')?.checked
      || document.getElementById('ppbCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('ppbImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('ppbUseImageColor')?.checked;
    const imgBack = document.getElementById('ppbImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('ppbUseImageBackColor')?.checked
      || document.getElementById('ppbImageBackStyle')?.value !== 'solid';
    const linked = document.getElementById('ppbSendPressTo')?.value === 'linkedObject';
    const linkedInput = document.getElementById('ppbLinkedObject');
    const browse = document.getElementById('ppbBrowseLinkedObject');
    if (linkedInput) linkedInput.disabled = !linked;
    if (browse) browse.disabled = !linked;
  }

  function wirePausePenButtonTools() {
    const dlg = document.getElementById('pausePenButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('ppbPatternStyle', 'ppbFilled');
    document.querySelectorAll('#pausePenButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.ppbPreviewWired === '1') return;
      input.dataset.ppbPreviewWired = '1';
      input.addEventListener('input', schedulePausePenLivePreview);
      input.addEventListener('change', schedulePausePenLivePreview);
    });
    syncPausePenFields();
  }

  function presentPausePenButtonDialog() {
    const dialog = document.getElementById('pausePenButtonDialog');
    if (!dialog) {
      window.setStatus('Pause Pen Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    ppbDialogCommitted = false;
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
        window.setStatus(`Opened Pause Pen Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillPausePenButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('ppbPatternStyle', 'ppbFilled');
      document.getElementById('ppbBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('ppbBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('ppbBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('ppbPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('ppbShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('ppbBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      ppbSetColor('ppbBackColor', comp.backColor || '#001C38');
      ppbSetColor('ppbBorderColor', comp.borderColor || '#001C38');
      ppbSetColor('ppbPatternColor', comp.patternColor || '#ffffff');
      ppbSetColor('ppbHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('ppbBlink').checked = Boolean(comp.blink);
      document.getElementById('ppbHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('ppbVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('ppbAudio').checked = comp.audio !== false;
      const sendTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
      document.getElementById('ppbSendPressTo').value = sendTo;
      document.getElementById('ppbLinkedObject').value = comp.linkedObject || '';
      document.getElementById('ppbCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('ppbFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('ppbFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('ppbBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('ppbItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('ppbUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('ppbUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      ppbSetColor('ppbCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('ppbUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      ppbSetColor('ppbCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('ppbCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('ppbWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('ppbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#pausePenButtonForm input[name="ppbAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('ppbImage').value = comp.image || '';
      document.getElementById('ppbImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('ppbUseImageColor').checked = Boolean(comp.useImageColor);
      ppbSetColor('ppbImageColor', comp.imageColor || '#ffffff');
      document.getElementById('ppbUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      ppbSetColor('ppbImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('ppbImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('ppbImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#pausePenButtonForm input[name="ppbImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('ppbHeight').value = comp.height ?? 80;
      document.getElementById('ppbWidth').value = comp.width ?? 80;
      document.getElementById('ppbTop').value = comp.top ?? 16;
      document.getElementById('ppbLeft').value = comp.left ?? 16;
      document.getElementById('ppbName').value = comp.name || 'PausePenButton1';
      document.getElementById('ppbVisible').checked = comp.visible !== false;
      syncPausePenFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readPausePenButtonForm() {
    const caption = document.getElementById('ppbCaption')?.value || '';
    const captionColor = ppbGetColor('ppbCaptionColor');
    const sendPressTo = document.getElementById('ppbSendPressTo')?.value || 'objectWithFocus';
    return {
      type: 'PausePenButton',
      name: document.getElementById('ppbName')?.value.trim() || 'PausePenButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('ppbLeft')?.value) || 0,
      top: Number(document.getElementById('ppbTop')?.value) || 0,
      width: Number(document.getElementById('ppbWidth')?.value) || 80,
      height: Number(document.getElementById('ppbHeight')?.value) || 80,
      visible: document.getElementById('ppbVisible')?.checked !== false,
      borderStyle: document.getElementById('ppbBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('ppbBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('ppbBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('ppbBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('ppbPatternStyle')?.value || 'none',
      shape: document.getElementById('ppbShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: ppbGetColor('ppbBackColor'),
      useBorderColor: true,
      borderColor: ppbGetColor('ppbBorderColor'),
      usePatternColor: true,
      patternColor: ppbGetColor('ppbPatternColor'),
      useHighlightColor: true,
      highlightColor: ppbGetColor('ppbHighlightColor'),
      blink: Boolean(document.getElementById('ppbBlink')?.checked),
      horizontalMargin: Number(document.getElementById('ppbHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('ppbVerticalMargin')?.value) || 0,
      audio: document.getElementById('ppbAudio')?.checked !== false,
      sendPressTo,
      linkedObject: document.getElementById('ppbLinkedObject')?.value.trim() || '',
      fontFamily: document.getElementById('ppbFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('ppbFontSize')?.value) || 10,
      bold: document.getElementById('ppbBold')?.classList.contains('active'),
      italic: document.getElementById('ppbItalic')?.classList.contains('active'),
      underline: document.getElementById('ppbUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('ppbUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('ppbUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('ppbUseCaptionBackColor')?.checked),
      captionBackColor: ppbGetColor('ppbCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('ppbCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('ppbCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('ppbWordWrap')?.checked !== false,
      alignment: document.querySelector('#pausePenButtonForm input[name="ppbAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('ppbImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('ppbImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#pausePenButtonForm input[name="ppbImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('ppbUseImageColor')?.checked),
      imageColor: ppbGetColor('ppbImageColor'),
      useImageBackColor: Boolean(document.getElementById('ppbUseImageBackColor')?.checked),
      imageBackColor: ppbGetColor('ppbImageBackColor'),
      imageBlink: Boolean(document.getElementById('ppbImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('ppbImageScaled')?.checked)
    };
  }

  async function showPausePenButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Pause Pen Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initPausePenButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultPausePenButtonComponent({
        name: nextPausePenButtonName(canvas?.components),
        ...overrides
      });
      fillPausePenButtonForm(comp);
      window.resetPropsDialogState('pause-pen', readPausePenButtonForm, 'applyPausePenButton');
      switchTab('general');
      wirePausePenButtonTools();
      presentPausePenButtonDialog();
      const previewComp = readPausePenButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readPausePenButtonForm, 'applyPausePenButton');
    } catch (err) {
      window.setStatus(`Pause Pen Button properties error: ${err.message}`);
    }
  }

  async function applyPausePenButton() {
    const comp = readPausePenButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readPausePenButtonForm, 'applyPausePenButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function savePausePenButton(e) {
    e.preventDefault();
    const comp = readPausePenButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    ppbDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('pausePenButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertPpbCaptionText(text) {
    const area = document.getElementById('ppbCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    schedulePausePenLivePreview();
  }

  function insertPpbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertPpbCaptionText(tag);
    });
  }

  function hidePpbInsertVariableMenu() {
    document.getElementById('ppbInsertVariableMenu')?.classList.add('hidden');
  }

  function isTrendType(type) {
    const t = String(type || '').toLowerCase();
    return t.includes('trend') || t === 'xyplot' || t === 'histogram';
  }

  function listBrowsableObjects() {
    const selfName = document.getElementById('ppbName')?.value.trim();
    const seen = new Set();
    const items = [];
    const add = (comp) => {
      const name = comp?.name;
      if (!name || name === selfName || seen.has(name)) return;
      if (comp.type === 'PausePenButton' || comp.type === 'NextPenButton') return;
      seen.add(name);
      items.push({ name, type: comp.type || '' });
    };
    const entries = window.state?.canvasEditCache?.editComponents || [];
    for (const entry of entries) add(entry?.comp || entry);
    const raw = window.state?.canvasEditCache?.raw?.components || [];
    for (const comp of raw) add(comp);
    items.sort((a, b) => {
      const at = isTrendType(a.type) ? 0 : 1;
      const bt = isTrendType(b.type) ? 0 : 1;
      if (at !== bt) return at - bt;
      return a.name.localeCompare(b.name);
    });
    return items;
  }

  function closeObjectBrowser() {
    const dlg = document.getElementById('ppbObjectBrowserDialog');
    if (!dlg) return;
    try { dlg.close(); } catch (_) {
      dlg.removeAttribute('open');
      dlg.style.display = 'none';
    }
  }

  function openObjectBrowser() {
    const dlg = document.getElementById('ppbObjectBrowserDialog');
    const list = document.getElementById('ppbObjectBrowserList');
    if (!dlg || !list) return;
    const items = listBrowsableObjects();
    const current = document.getElementById('ppbLinkedObject')?.value.trim() || '';
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
    const list = document.getElementById('ppbObjectBrowserList');
    const name = list?.value?.trim();
    if (name) {
      document.getElementById('ppbLinkedObject').value = name;
      schedulePausePenLivePreview();
      window.flushPropsApplyButton?.(readPausePenButtonForm, 'applyPausePenButton');
    }
    closeObjectBrowser();
  }

  function initPausePenButtonDialog() {
    const form = document.getElementById('pausePenButtonForm');
    if (!form || form.dataset.ppbWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('ppbPatternStyle', 'ppbFilled');
    form.addEventListener('submit', (e) => savePausePenButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyPausePenButton')?.addEventListener('click', () => {
      applyPausePenButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      schedulePausePenLivePreview();
      window.flushPropsApplyButton?.(readPausePenButtonForm, 'applyPausePenButton');
    });
    form.addEventListener('change', () => {
      syncPausePenFields();
      schedulePausePenLivePreview();
      window.flushPropsApplyButton?.(readPausePenButtonForm, 'applyPausePenButton');
    });
    document.getElementById('cancelPausePenButton')?.addEventListener('click', () => {
      if (!ppbDialogCommitted) window.revertPropsDialogPreview?.();
      ppbDialogCommitted = true;
      document.getElementById('pausePenButtonDialog')?.close();
    });
    document.getElementById('pausePenButtonDialog')?.addEventListener('close', () => {
      if (ppbPreviewTimer) {
        clearTimeout(ppbPreviewTimer);
        ppbPreviewTimer = null;
      }
      hidePpbInsertVariableMenu();
      closeObjectBrowser();
      if (!ppbDialogCommitted) window.revertPropsDialogPreview?.();
      ppbDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpPausePenButton')?.addEventListener('click', () => {
      alert('Pause Pen Button pauses trending on the linked Trend object, or on the object that currently has focus.');
    });
    document.querySelectorAll('#pausePenButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hidePpbInsertVariableMenu();
        switchTab(tab.dataset.ppbTab);
      });
    });
    document.getElementById('ppbBrowseLinkedObject')?.addEventListener('click', () => {
      if (document.getElementById('ppbBrowseLinkedObject')?.disabled) return;
      openObjectBrowser();
    });
    document.getElementById('ppbObjectBrowserOk')?.addEventListener('click', acceptObjectBrowser);
    document.getElementById('ppbObjectBrowserList')?.addEventListener('dblclick', acceptObjectBrowser);
    document.getElementById('ppbObjectBrowserCancel')?.addEventListener('click', closeObjectBrowser);
    document.getElementById('ppbObjectBrowserHelp')?.addEventListener('click', () => {
      alert('Select a display object to receive the Pause Pen press. Trend objects are listed first when present.');
    });
    document.getElementById('ppbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('ppbImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('ppbImage').value = fileName;
          schedulePausePenLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('ppbInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('ppbInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('ppbInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.ppbVar;
      if (!kind) return;
      hidePpbInsertVariableMenu();
      if (kind === 'timedate') insertPpbCaptionText('{#dt}');
      else insertPpbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#pausePenButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hidePpbInsertVariableMenu();
    });
    document.getElementById('ppbShape')?.addEventListener('change', () => {
      if (document.getElementById('ppbShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('ppbWidth')?.value) || 0;
      const h = Number(document.getElementById('ppbHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('ppbWidth').value = String(size);
      document.getElementById('ppbHeight').value = String(size);
    });
    for (const id of ['ppbBold', 'ppbItalic', 'ppbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        schedulePausePenLivePreview();
      });
    }
    form.dataset.ppbWired = '1';
  }

  window.StudioPausePenButton = {
    initPausePenButtonDialog,
    presentPausePenButtonDialog,
    schedulePausePenLivePreview,
    showPausePenButtonDialog,
    fillPausePenButtonForm,
    readPausePenButtonForm,
    switchPausePenButtonTab: switchTab,
    wirePausePenButtonTools,
    nextPausePenButtonName,
    defaultPausePenButtonComponent,
    applyPausePenButton
  };
})();
