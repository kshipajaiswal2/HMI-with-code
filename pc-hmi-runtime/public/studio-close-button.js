/** Close Display Button property dialog — FactoryTalk View parity */
(function () {
  let cdbPreviewTimer = null;
  let cdbDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#closeDisplayButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.cdbTab === tabId);
    });
    document.querySelectorAll('#closeDisplayButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.cdbTabPanel === tabId);
    });
  }

  function cdbGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function cdbSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextCloseDisplayButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'CloseDisplayButton').length + 1;
    return `CloseDisplayButton${n}`;
  }

  function defaultCloseDisplayButtonComponent(overrides = {}) {
    return {
      type: 'CloseDisplayButton',
      name: 'CloseDisplayButton1',
      tag: '',
      caption: '',
      label: '',
      writeOnClose: false,
      closeValue: 0,
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

  function scheduleCloseDisplayLivePreview() {
    if (window.state?.propsFormFill) return;
    if (cdbPreviewTimer) clearTimeout(cdbPreviewTimer);
    cdbPreviewTimer = setTimeout(() => {
      cdbPreviewTimer = null;
      if (!document.getElementById('closeDisplayButtonDialog')?.open) return;
      const comp = readCloseDisplayButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readCloseDisplayButtonForm, 'applyCloseDisplayButton');
    }, 80);
  }

  function syncCloseDisplayFields() {
    const capColor = document.getElementById('cdbCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('cdbUseCaptionColor')?.checked;
    const capBack = document.getElementById('cdbCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('cdbUseCaptionBackColor')?.checked
      || document.getElementById('cdbCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('cdbImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('cdbUseImageColor')?.checked;
    const imgBack = document.getElementById('cdbImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('cdbUseImageBackColor')?.checked
      || document.getElementById('cdbImageBackStyle')?.value !== 'solid';
    const writeOnClose = document.getElementById('cdbWriteOnClose')?.checked;
    const closeValue = document.getElementById('cdbCloseValue');
    if (closeValue) closeValue.disabled = !writeOnClose;
  }

  function wireCloseDisplayButtonTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('closeDisplayButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('cdbPatternStyle', 'cdbFilled');
    document.querySelectorAll('#closeDisplayButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.cdbPreviewWired === '1') return;
      input.dataset.cdbPreviewWired = '1';
      input.addEventListener('input', scheduleCloseDisplayLivePreview);
      input.addEventListener('change', scheduleCloseDisplayLivePreview);
    });
    syncCloseDisplayFields();
  }

  function presentCloseDisplayButtonDialog() {
    const dialog = document.getElementById('closeDisplayButtonDialog');
    if (!dialog) {
      window.setStatus('Close Display Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    cdbDialogCommitted = false;
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
        window.setStatus(`Opened Close Display Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillCloseDisplayButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('cdbPatternStyle', 'cdbFilled');
      document.getElementById('cdbBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('cdbBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('cdbBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('cdbPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('cdbShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('cdbBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      cdbSetColor('cdbBackColor', comp.backColor || '#001C38');
      cdbSetColor('cdbBorderColor', comp.borderColor || '#001C38');
      cdbSetColor('cdbPatternColor', comp.patternColor || '#ffffff');
      cdbSetColor('cdbHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('cdbBlink').checked = Boolean(comp.blink);
      document.getElementById('cdbWriteOnClose').checked = Boolean(comp.writeOnClose);
      document.getElementById('cdbCloseValue').value = comp.closeValue ?? 0;
      document.getElementById('cdbHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('cdbVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('cdbAudio').checked = comp.audio !== false;
      document.getElementById('cdbCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('cdbFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('cdbFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('cdbBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('cdbItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('cdbUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('cdbUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      cdbSetColor('cdbCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('cdbUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      cdbSetColor('cdbCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('cdbCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('cdbWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('cdbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#closeDisplayButtonForm input[name="cdbAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('cdbImage').value = comp.image || '';
      document.getElementById('cdbImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('cdbUseImageColor').checked = Boolean(comp.useImageColor);
      cdbSetColor('cdbImageColor', comp.imageColor || '#ffffff');
      document.getElementById('cdbUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      cdbSetColor('cdbImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('cdbImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('cdbImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#closeDisplayButtonForm input[name="cdbImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('cdbTag').value = comp.tag || '';
      document.getElementById('cdbHeight').value = comp.height ?? 80;
      document.getElementById('cdbWidth').value = comp.width ?? 80;
      document.getElementById('cdbTop').value = comp.top ?? 16;
      document.getElementById('cdbLeft').value = comp.left ?? 16;
      document.getElementById('cdbName').value = comp.name || 'CloseDisplayButton1';
      document.getElementById('cdbVisible').checked = comp.visible !== false;
      syncCloseDisplayFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readCloseDisplayButtonForm() {
    const caption = document.getElementById('cdbCaption')?.value || '';
    const captionColor = cdbGetColor('cdbCaptionColor');
    return {
      type: 'CloseDisplayButton',
      name: document.getElementById('cdbName')?.value.trim() || 'CloseDisplayButton1',
      tag: document.getElementById('cdbTag')?.value.trim() || '',
      caption,
      label: caption,
      writeOnClose: Boolean(document.getElementById('cdbWriteOnClose')?.checked),
      closeValue: Number(document.getElementById('cdbCloseValue')?.value) || 0,
      left: Number(document.getElementById('cdbLeft')?.value) || 0,
      top: Number(document.getElementById('cdbTop')?.value) || 0,
      width: Number(document.getElementById('cdbWidth')?.value) || 80,
      height: Number(document.getElementById('cdbHeight')?.value) || 80,
      visible: document.getElementById('cdbVisible')?.checked !== false,
      borderStyle: document.getElementById('cdbBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('cdbBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('cdbBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('cdbBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('cdbPatternStyle')?.value || 'none',
      shape: document.getElementById('cdbShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: cdbGetColor('cdbBackColor'),
      useBorderColor: true,
      borderColor: cdbGetColor('cdbBorderColor'),
      usePatternColor: true,
      patternColor: cdbGetColor('cdbPatternColor'),
      useHighlightColor: true,
      highlightColor: cdbGetColor('cdbHighlightColor'),
      blink: Boolean(document.getElementById('cdbBlink')?.checked),
      horizontalMargin: Number(document.getElementById('cdbHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('cdbVerticalMargin')?.value) || 0,
      audio: document.getElementById('cdbAudio')?.checked !== false,
      fontFamily: document.getElementById('cdbFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('cdbFontSize')?.value) || 10,
      bold: document.getElementById('cdbBold')?.classList.contains('active'),
      italic: document.getElementById('cdbItalic')?.classList.contains('active'),
      underline: document.getElementById('cdbUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('cdbUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('cdbUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('cdbUseCaptionBackColor')?.checked),
      captionBackColor: cdbGetColor('cdbCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('cdbCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('cdbCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('cdbWordWrap')?.checked !== false,
      alignment: document.querySelector('#closeDisplayButtonForm input[name="cdbAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('cdbImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('cdbImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#closeDisplayButtonForm input[name="cdbImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('cdbUseImageColor')?.checked),
      imageColor: cdbGetColor('cdbImageColor'),
      useImageBackColor: Boolean(document.getElementById('cdbUseImageBackColor')?.checked),
      imageBackColor: cdbGetColor('cdbImageBackColor'),
      imageBlink: Boolean(document.getElementById('cdbImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('cdbImageScaled')?.checked)
    };
  }

  async function showCloseDisplayButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Close Display Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initCloseDisplayButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultCloseDisplayButtonComponent({
        name: nextCloseDisplayButtonName(canvas?.components),
        ...overrides
      });
      fillCloseDisplayButtonForm(comp);
      window.resetPropsDialogState('close-display', readCloseDisplayButtonForm, 'applyCloseDisplayButton');
      switchTab('general');
      wireCloseDisplayButtonTools();
      presentCloseDisplayButtonDialog();
      const previewComp = readCloseDisplayButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readCloseDisplayButtonForm, 'applyCloseDisplayButton');
    } catch (err) {
      window.setStatus(`Close Display Button properties error: ${err.message}`);
    }
  }

  async function applyCloseDisplayButton() {
    const comp = readCloseDisplayButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readCloseDisplayButtonForm, 'applyCloseDisplayButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveCloseDisplayButton(e) {
    e.preventDefault();
    const comp = readCloseDisplayButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    cdbDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('closeDisplayButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertCdbCaptionText(text) {
    const area = document.getElementById('cdbCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleCloseDisplayLivePreview();
  }

  function insertCdbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertCdbCaptionText(tag);
    });
  }

  function hideCdbInsertVariableMenu() {
    document.getElementById('cdbInsertVariableMenu')?.classList.add('hidden');
  }

  function initCloseDisplayButtonDialog() {
    const form = document.getElementById('closeDisplayButtonForm');
    if (!form || form.dataset.cdbWired === '1') return;
    form.dataset.cdbWired = '1';
    window.StudioPropsShared?.fillPatternSelect('cdbPatternStyle', 'cdbFilled');
    form.addEventListener('submit', (e) => saveCloseDisplayButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyCloseDisplayButton')?.addEventListener('click', () => {
      applyCloseDisplayButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleCloseDisplayLivePreview();
      window.flushPropsApplyButton?.(readCloseDisplayButtonForm, 'applyCloseDisplayButton');
    });
    form.addEventListener('change', () => {
      syncCloseDisplayFields();
      scheduleCloseDisplayLivePreview();
      window.flushPropsApplyButton?.(readCloseDisplayButtonForm, 'applyCloseDisplayButton');
    });
    document.getElementById('cancelCloseDisplayButton')?.addEventListener('click', () => {
      document.getElementById('closeDisplayButtonDialog')?.close();
    });
    document.getElementById('closeDisplayButtonDialog')?.addEventListener('close', () => {
      if (cdbPreviewTimer) {
        clearTimeout(cdbPreviewTimer);
        cdbPreviewTimer = null;
      }
      hideCdbInsertVariableMenu();
      if (!cdbDialogCommitted) window.revertPropsDialogPreview?.();
      cdbDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpCloseDisplayButton')?.addEventListener('click', () => {
      alert('Close Display Button closes the current display. Optionally writes a close value to a tag when Write on close is enabled. A Value tag is optional until runtime.');
    });
    document.querySelectorAll('#closeDisplayButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideCdbInsertVariableMenu();
        switchTab(tab.dataset.cdbTab);
      });
    });
    document.getElementById('cdbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('cdbImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('cdbImage').value = fileName;
          scheduleCloseDisplayLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('cdbInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('cdbInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('cdbInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.cdbVar;
      if (!kind) return;
      hideCdbInsertVariableMenu();
      if (kind === 'timedate') insertCdbCaptionText('{#dt}');
      else insertCdbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#closeDisplayButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideCdbInsertVariableMenu();
    });
    document.getElementById('cdbShape')?.addEventListener('change', () => {
      if (document.getElementById('cdbShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('cdbWidth')?.value) || 0;
      const h = Number(document.getElementById('cdbHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('cdbWidth').value = String(size);
      document.getElementById('cdbHeight').value = String(size);
    });
    for (const id of ['cdbBold', 'cdbItalic', 'cdbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleCloseDisplayLivePreview();
      });
    }
  }

  window.StudioCloseDisplayButton = {
    initCloseDisplayButtonDialog,
    presentCloseDisplayButtonDialog,
    scheduleCloseDisplayLivePreview,
    showCloseDisplayButtonDialog,
    fillCloseDisplayButtonForm,
    readCloseDisplayButtonForm,
    switchCloseDisplayButtonTab: switchTab,
    wireCloseDisplayButtonTools,
    nextCloseDisplayButtonName,
    defaultCloseDisplayButtonComponent,
    applyCloseDisplayButton
  };
})();
