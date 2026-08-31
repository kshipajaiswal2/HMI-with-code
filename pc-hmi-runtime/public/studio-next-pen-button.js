/** Next Pen Button property dialog — FactoryTalk View parity */
(function () {
  let npbPreviewTimer = null;
  let npbDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#nextPenButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.npbTab === tabId);
    });
    document.querySelectorAll('#nextPenButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.npbTabPanel === tabId);
    });
  }

  function npbGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function npbSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextNextPenButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'NextPenButton').length + 1;
    return `NextPenButton${n}`;
  }

  function defaultNextPenButtonComponent(overrides = {}) {
    return {
      type: 'NextPenButton',
      name: 'NextPenButton1',
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

  function scheduleNextPenLivePreview() {
    if (window.state?.propsFormFill) return;
    if (npbPreviewTimer) clearTimeout(npbPreviewTimer);
    npbPreviewTimer = setTimeout(() => {
      npbPreviewTimer = null;
      if (!document.getElementById('nextPenButtonDialog')?.open) return;
      const comp = readNextPenButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readNextPenButtonForm, 'applyNextPenButton');
    }, 80);
  }

  function syncNextPenFields() {
    const capColor = document.getElementById('npbCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('npbUseCaptionColor')?.checked;
    const capBack = document.getElementById('npbCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('npbUseCaptionBackColor')?.checked
      || document.getElementById('npbCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('npbImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('npbUseImageColor')?.checked;
    const imgBack = document.getElementById('npbImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('npbUseImageBackColor')?.checked
      || document.getElementById('npbImageBackStyle')?.value !== 'solid';
    const linked = document.getElementById('npbSendPressTo')?.value === 'linkedObject';
    const linkedInput = document.getElementById('npbLinkedObject');
    const browse = document.getElementById('npbBrowseLinkedObject');
    if (linkedInput) linkedInput.disabled = !linked;
    if (browse) browse.disabled = !linked;
  }

  function wireNextPenButtonTools() {
    const dlg = document.getElementById('nextPenButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('npbPatternStyle', 'npbFilled');
    document.querySelectorAll('#nextPenButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.npbPreviewWired === '1') return;
      input.dataset.npbPreviewWired = '1';
      input.addEventListener('input', scheduleNextPenLivePreview);
      input.addEventListener('change', scheduleNextPenLivePreview);
    });
    syncNextPenFields();
  }

  function presentNextPenButtonDialog() {
    const dialog = document.getElementById('nextPenButtonDialog');
    if (!dialog) {
      window.setStatus('Next Pen Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    npbDialogCommitted = false;
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
        window.setStatus(`Opened Next Pen Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillNextPenButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('npbPatternStyle', 'npbFilled');
      document.getElementById('npbBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('npbBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('npbBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('npbPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('npbShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('npbBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      npbSetColor('npbBackColor', comp.backColor || '#001C38');
      npbSetColor('npbBorderColor', comp.borderColor || '#001C38');
      npbSetColor('npbPatternColor', comp.patternColor || '#ffffff');
      npbSetColor('npbHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('npbBlink').checked = Boolean(comp.blink);
      document.getElementById('npbHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('npbVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('npbAudio').checked = comp.audio !== false;
      const sendTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
      document.getElementById('npbSendPressTo').value = sendTo;
      document.getElementById('npbLinkedObject').value = comp.linkedObject || '';
      document.getElementById('npbCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('npbFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('npbFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('npbBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('npbItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('npbUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('npbUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      npbSetColor('npbCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('npbUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      npbSetColor('npbCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('npbCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('npbWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('npbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#nextPenButtonForm input[name="npbAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('npbImage').value = comp.image || '';
      document.getElementById('npbImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('npbUseImageColor').checked = Boolean(comp.useImageColor);
      npbSetColor('npbImageColor', comp.imageColor || '#ffffff');
      document.getElementById('npbUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      npbSetColor('npbImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('npbImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('npbImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#nextPenButtonForm input[name="npbImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('npbHeight').value = comp.height ?? 80;
      document.getElementById('npbWidth').value = comp.width ?? 80;
      document.getElementById('npbTop').value = comp.top ?? 16;
      document.getElementById('npbLeft').value = comp.left ?? 16;
      document.getElementById('npbName').value = comp.name || 'NextPenButton1';
      document.getElementById('npbVisible').checked = comp.visible !== false;
      syncNextPenFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readNextPenButtonForm() {
    const caption = document.getElementById('npbCaption')?.value || '';
    const captionColor = npbGetColor('npbCaptionColor');
    const sendPressTo = document.getElementById('npbSendPressTo')?.value || 'objectWithFocus';
    return {
      type: 'NextPenButton',
      name: document.getElementById('npbName')?.value.trim() || 'NextPenButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('npbLeft')?.value) || 0,
      top: Number(document.getElementById('npbTop')?.value) || 0,
      width: Number(document.getElementById('npbWidth')?.value) || 80,
      height: Number(document.getElementById('npbHeight')?.value) || 80,
      visible: document.getElementById('npbVisible')?.checked !== false,
      borderStyle: document.getElementById('npbBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('npbBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('npbBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('npbBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('npbPatternStyle')?.value || 'none',
      shape: document.getElementById('npbShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: npbGetColor('npbBackColor'),
      useBorderColor: true,
      borderColor: npbGetColor('npbBorderColor'),
      usePatternColor: true,
      patternColor: npbGetColor('npbPatternColor'),
      useHighlightColor: true,
      highlightColor: npbGetColor('npbHighlightColor'),
      blink: Boolean(document.getElementById('npbBlink')?.checked),
      horizontalMargin: Number(document.getElementById('npbHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('npbVerticalMargin')?.value) || 0,
      audio: document.getElementById('npbAudio')?.checked !== false,
      sendPressTo,
      linkedObject: document.getElementById('npbLinkedObject')?.value.trim() || '',
      fontFamily: document.getElementById('npbFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('npbFontSize')?.value) || 10,
      bold: document.getElementById('npbBold')?.classList.contains('active'),
      italic: document.getElementById('npbItalic')?.classList.contains('active'),
      underline: document.getElementById('npbUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('npbUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('npbUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('npbUseCaptionBackColor')?.checked),
      captionBackColor: npbGetColor('npbCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('npbCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('npbCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('npbWordWrap')?.checked !== false,
      alignment: document.querySelector('#nextPenButtonForm input[name="npbAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('npbImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('npbImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#nextPenButtonForm input[name="npbImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('npbUseImageColor')?.checked),
      imageColor: npbGetColor('npbImageColor'),
      useImageBackColor: Boolean(document.getElementById('npbUseImageBackColor')?.checked),
      imageBackColor: npbGetColor('npbImageBackColor'),
      imageBlink: Boolean(document.getElementById('npbImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('npbImageScaled')?.checked)
    };
  }

  async function showNextPenButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Next Pen Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initNextPenButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultNextPenButtonComponent({
        name: nextNextPenButtonName(canvas?.components),
        ...overrides
      });
      fillNextPenButtonForm(comp);
      window.resetPropsDialogState('next-pen', readNextPenButtonForm, 'applyNextPenButton');
      switchTab('general');
      wireNextPenButtonTools();
      presentNextPenButtonDialog();
      const previewComp = readNextPenButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readNextPenButtonForm, 'applyNextPenButton');
    } catch (err) {
      window.setStatus(`Next Pen Button properties error: ${err.message}`);
    }
  }

  async function applyNextPenButton() {
    const comp = readNextPenButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readNextPenButtonForm, 'applyNextPenButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveNextPenButton(e) {
    e.preventDefault();
    const comp = readNextPenButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    npbDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('nextPenButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertNpbCaptionText(text) {
    const area = document.getElementById('npbCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleNextPenLivePreview();
  }

  function insertNpbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertNpbCaptionText(tag);
    });
  }

  function hideNpbInsertVariableMenu() {
    document.getElementById('npbInsertVariableMenu')?.classList.add('hidden');
  }

  function isTrendType(type) {
    const t = String(type || '').toLowerCase();
    return t.includes('trend') || t === 'xyplot' || t === 'histogram';
  }

  function listBrowsableObjects() {
    const selfName = document.getElementById('npbName')?.value.trim();
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
    const dlg = document.getElementById('npbObjectBrowserDialog');
    if (!dlg) return;
    try { dlg.close(); } catch (_) {
      dlg.removeAttribute('open');
      dlg.style.display = 'none';
    }
  }

  function openObjectBrowser() {
    const dlg = document.getElementById('npbObjectBrowserDialog');
    const list = document.getElementById('npbObjectBrowserList');
    if (!dlg || !list) return;
    const items = listBrowsableObjects();
    const current = document.getElementById('npbLinkedObject')?.value.trim() || '';
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
    const list = document.getElementById('npbObjectBrowserList');
    const name = list?.value?.trim();
    if (name) {
      document.getElementById('npbLinkedObject').value = name;
      scheduleNextPenLivePreview();
      window.flushPropsApplyButton?.(readNextPenButtonForm, 'applyNextPenButton');
    }
    closeObjectBrowser();
  }

  function initNextPenButtonDialog() {
    const form = document.getElementById('nextPenButtonForm');
    if (!form || form.dataset.npbWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('npbPatternStyle', 'npbFilled');
    form.addEventListener('submit', (e) => saveNextPenButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyNextPenButton')?.addEventListener('click', () => {
      applyNextPenButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleNextPenLivePreview();
      window.flushPropsApplyButton?.(readNextPenButtonForm, 'applyNextPenButton');
    });
    form.addEventListener('change', () => {
      syncNextPenFields();
      scheduleNextPenLivePreview();
      window.flushPropsApplyButton?.(readNextPenButtonForm, 'applyNextPenButton');
    });
    document.getElementById('cancelNextPenButton')?.addEventListener('click', () => {
      if (!npbDialogCommitted) window.revertPropsDialogPreview?.();
      npbDialogCommitted = true;
      document.getElementById('nextPenButtonDialog')?.close();
    });
    document.getElementById('nextPenButtonDialog')?.addEventListener('close', () => {
      if (npbPreviewTimer) {
        clearTimeout(npbPreviewTimer);
        npbPreviewTimer = null;
      }
      hideNpbInsertVariableMenu();
      closeObjectBrowser();
      if (!npbDialogCommitted) window.revertPropsDialogPreview?.();
      npbDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpNextPenButton')?.addEventListener('click', () => {
      alert('Next Pen Button advances to the next pen on the linked Trend object, or on the object that currently has focus.');
    });
    document.querySelectorAll('#nextPenButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideNpbInsertVariableMenu();
        switchTab(tab.dataset.npbTab);
      });
    });
    document.getElementById('npbBrowseLinkedObject')?.addEventListener('click', () => {
      if (document.getElementById('npbBrowseLinkedObject')?.disabled) return;
      openObjectBrowser();
    });
    document.getElementById('npbObjectBrowserOk')?.addEventListener('click', acceptObjectBrowser);
    document.getElementById('npbObjectBrowserList')?.addEventListener('dblclick', acceptObjectBrowser);
    document.getElementById('npbObjectBrowserCancel')?.addEventListener('click', closeObjectBrowser);
    document.getElementById('npbObjectBrowserHelp')?.addEventListener('click', () => {
      alert('Select a display object to receive the Next Pen press. Trend objects are listed first when present.');
    });
    document.getElementById('npbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('npbImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('npbImage').value = fileName;
          scheduleNextPenLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('npbInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('npbInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('npbInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.npbVar;
      if (!kind) return;
      hideNpbInsertVariableMenu();
      if (kind === 'timedate') insertNpbCaptionText('{#dt}');
      else insertNpbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#nextPenButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideNpbInsertVariableMenu();
    });
    document.getElementById('npbShape')?.addEventListener('change', () => {
      if (document.getElementById('npbShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('npbWidth')?.value) || 0;
      const h = Number(document.getElementById('npbHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('npbWidth').value = String(size);
      document.getElementById('npbHeight').value = String(size);
    });
    for (const id of ['npbBold', 'npbItalic', 'npbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleNextPenLivePreview();
      });
    }
    form.dataset.npbWired = '1';
  }

  window.StudioNextPenButton = {
    initNextPenButtonDialog,
    presentNextPenButtonDialog,
    scheduleNextPenLivePreview,
    showNextPenButtonDialog,
    fillNextPenButtonForm,
    readNextPenButtonForm,
    switchNextPenButtonTab: switchTab,
    wireNextPenButtonTools,
    nextNextPenButtonName,
    defaultNextPenButtonComponent,
    applyNextPenButton
  };
})();
