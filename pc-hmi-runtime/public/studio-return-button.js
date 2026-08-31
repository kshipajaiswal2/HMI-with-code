/** Return to Display Button property dialog — FactoryTalk View parity */
(function () {
  let rtbPreviewTimer = null;
  let rtbDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#returnToButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.rtbTab === tabId);
    });
    document.querySelectorAll('#returnToButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.rtbTabPanel === tabId);
    });
  }

  function rtbGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function rtbSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextReturnToButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'ReturnToButton').length + 1;
    return `ReturntoDisplayButton${n}`;
  }

  function defaultReturnToButtonComponent(overrides = {}) {
    return {
      type: 'ReturnToButton',
      name: 'ReturntoDisplayButton1',
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

  function scheduleReturnToLivePreview() {
    if (window.state?.propsFormFill) return;
    if (rtbPreviewTimer) clearTimeout(rtbPreviewTimer);
    rtbPreviewTimer = setTimeout(() => {
      rtbPreviewTimer = null;
      if (!document.getElementById('returnToButtonDialog')?.open) return;
      const comp = readReturnToButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readReturnToButtonForm, 'applyReturnToButton');
    }, 80);
  }

  function syncReturnToLabelFields() {
    const capColor = document.getElementById('rtbCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('rtbUseCaptionColor')?.checked;
    const capBack = document.getElementById('rtbCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('rtbUseCaptionBackColor')?.checked
      || document.getElementById('rtbCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('rtbImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('rtbUseImageColor')?.checked;
    const imgBack = document.getElementById('rtbImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('rtbUseImageBackColor')?.checked
      || document.getElementById('rtbImageBackStyle')?.value !== 'solid';
  }

  function wireReturnToButtonTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('returnToButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('rtbPatternStyle', 'rtbFilled');
    document.querySelectorAll('#returnToButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.rtbPreviewWired === '1') return;
      input.dataset.rtbPreviewWired = '1';
      input.addEventListener('input', scheduleReturnToLivePreview);
      input.addEventListener('change', scheduleReturnToLivePreview);
    });
    syncReturnToLabelFields();
  }

  function presentReturnToButtonDialog() {
    const dialog = document.getElementById('returnToButtonDialog');
    if (!dialog) {
      window.setStatus('Return to Display Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    rtbDialogCommitted = false;
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
        window.setStatus(`Opened Return to Display Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillReturnToButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('rtbPatternStyle', 'rtbFilled');
      document.getElementById('rtbBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('rtbBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('rtbBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('rtbPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('rtbShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('rtbBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      rtbSetColor('rtbBackColor', comp.backColor || '#001C38');
      rtbSetColor('rtbBorderColor', comp.borderColor || '#001C38');
      rtbSetColor('rtbPatternColor', comp.patternColor || '#ffffff');
      rtbSetColor('rtbHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('rtbBlink').checked = Boolean(comp.blink);
      document.getElementById('rtbHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('rtbVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('rtbAudio').checked = comp.audio !== false;
      document.getElementById('rtbCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('rtbFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('rtbFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('rtbBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('rtbItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('rtbUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('rtbUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      rtbSetColor('rtbCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('rtbUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      rtbSetColor('rtbCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('rtbCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('rtbWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('rtbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#returnToButtonForm input[name="rtbAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('rtbImage').value = comp.image || '';
      document.getElementById('rtbImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('rtbUseImageColor').checked = Boolean(comp.useImageColor);
      rtbSetColor('rtbImageColor', comp.imageColor || '#ffffff');
      document.getElementById('rtbUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      rtbSetColor('rtbImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('rtbImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('rtbImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#returnToButtonForm input[name="rtbImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('rtbHeight').value = comp.height ?? 80;
      document.getElementById('rtbWidth').value = comp.width ?? 80;
      document.getElementById('rtbTop').value = comp.top ?? 16;
      document.getElementById('rtbLeft').value = comp.left ?? 16;
      document.getElementById('rtbName').value = comp.name || 'ReturntoDisplayButton1';
      document.getElementById('rtbVisible').checked = comp.visible !== false;
      syncReturnToLabelFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readReturnToButtonForm() {
    const caption = document.getElementById('rtbCaption')?.value || '';
    const captionColor = rtbGetColor('rtbCaptionColor');
    return {
      type: 'ReturnToButton',
      name: document.getElementById('rtbName')?.value.trim() || 'ReturntoDisplayButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('rtbLeft')?.value) || 0,
      top: Number(document.getElementById('rtbTop')?.value) || 0,
      width: Number(document.getElementById('rtbWidth')?.value) || 80,
      height: Number(document.getElementById('rtbHeight')?.value) || 80,
      visible: document.getElementById('rtbVisible')?.checked !== false,
      borderStyle: document.getElementById('rtbBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('rtbBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('rtbBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('rtbBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('rtbPatternStyle')?.value || 'none',
      shape: document.getElementById('rtbShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: rtbGetColor('rtbBackColor'),
      useBorderColor: true,
      borderColor: rtbGetColor('rtbBorderColor'),
      usePatternColor: true,
      patternColor: rtbGetColor('rtbPatternColor'),
      useHighlightColor: true,
      highlightColor: rtbGetColor('rtbHighlightColor'),
      blink: Boolean(document.getElementById('rtbBlink')?.checked),
      horizontalMargin: Number(document.getElementById('rtbHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('rtbVerticalMargin')?.value) || 0,
      audio: document.getElementById('rtbAudio')?.checked !== false,
      fontFamily: document.getElementById('rtbFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('rtbFontSize')?.value) || 10,
      bold: document.getElementById('rtbBold')?.classList.contains('active'),
      italic: document.getElementById('rtbItalic')?.classList.contains('active'),
      underline: document.getElementById('rtbUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('rtbUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('rtbUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('rtbUseCaptionBackColor')?.checked),
      captionBackColor: rtbGetColor('rtbCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('rtbCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('rtbCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('rtbWordWrap')?.checked !== false,
      alignment: document.querySelector('#returnToButtonForm input[name="rtbAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('rtbImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('rtbImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#returnToButtonForm input[name="rtbImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('rtbUseImageColor')?.checked),
      imageColor: rtbGetColor('rtbImageColor'),
      useImageBackColor: Boolean(document.getElementById('rtbUseImageBackColor')?.checked),
      imageBackColor: rtbGetColor('rtbImageBackColor'),
      imageBlink: Boolean(document.getElementById('rtbImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('rtbImageScaled')?.checked)
    };
  }

  async function showReturnToButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Return to Display Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initReturnToButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultReturnToButtonComponent({
        name: nextReturnToButtonName(canvas?.components),
        ...overrides
      });
      fillReturnToButtonForm(comp);
      window.resetPropsDialogState('return-to', readReturnToButtonForm, 'applyReturnToButton');
      switchTab('general');
      wireReturnToButtonTools();
      presentReturnToButtonDialog();
      const previewComp = readReturnToButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readReturnToButtonForm, 'applyReturnToButton');
    } catch (err) {
      window.setStatus(`Return to Display Button properties error: ${err.message}`);
    }
  }

  async function applyReturnToButton() {
    const comp = readReturnToButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readReturnToButtonForm, 'applyReturnToButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveReturnToButton(e) {
    e.preventDefault();
    const comp = readReturnToButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    rtbDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('returnToButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertRtbCaptionText(text) {
    const area = document.getElementById('rtbCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleReturnToLivePreview();
  }

  function insertRtbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertRtbCaptionText(tag);
    });
  }

  function hideRtbInsertVariableMenu() {
    document.getElementById('rtbInsertVariableMenu')?.classList.add('hidden');
  }

  function initReturnToButtonDialog() {
    const form = document.getElementById('returnToButtonForm');
    if (!form || form.dataset.rtbWired === '1') return;
    form.dataset.rtbWired = '1';
    window.StudioPropsShared?.fillPatternSelect('rtbPatternStyle', 'rtbFilled');
    form.addEventListener('submit', (e) => saveReturnToButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyReturnToButton')?.addEventListener('click', () => {
      applyReturnToButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleReturnToLivePreview();
      window.flushPropsApplyButton?.(readReturnToButtonForm, 'applyReturnToButton');
    });
    form.addEventListener('change', () => {
      syncReturnToLabelFields();
      scheduleReturnToLivePreview();
      window.flushPropsApplyButton?.(readReturnToButtonForm, 'applyReturnToButton');
    });
    document.getElementById('cancelReturnToButton')?.addEventListener('click', () => {
      document.getElementById('returnToButtonDialog')?.close();
    });
    document.getElementById('returnToButtonDialog')?.addEventListener('close', () => {
      if (rtbPreviewTimer) {
        clearTimeout(rtbPreviewTimer);
        rtbPreviewTimer = null;
      }
      hideRtbInsertVariableMenu();
      if (!rtbDialogCommitted) window.revertPropsDialogPreview?.();
      rtbDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpReturnToButton')?.addEventListener('click', () => {
      alert('Return to Display Button goes back to the previously viewed display when pressed.');
    });
    document.querySelectorAll('#returnToButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideRtbInsertVariableMenu();
        switchTab(tab.dataset.rtbTab);
      });
    });
    document.getElementById('rtbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('rtbImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('rtbImage').value = fileName;
          scheduleReturnToLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('rtbInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('rtbInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('rtbInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.rtbVar;
      if (!kind) return;
      hideRtbInsertVariableMenu();
      if (kind === 'timedate') insertRtbCaptionText('{#dt}');
      else insertRtbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#returnToButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideRtbInsertVariableMenu();
    });
    document.getElementById('rtbShape')?.addEventListener('change', () => {
      if (document.getElementById('rtbShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('rtbWidth')?.value) || 0;
      const h = Number(document.getElementById('rtbHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('rtbWidth').value = String(size);
      document.getElementById('rtbHeight').value = String(size);
    });
    for (const id of ['rtbBold', 'rtbItalic', 'rtbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleReturnToLivePreview();
      });
    }
  }

  window.StudioReturnToButton = {
    initReturnToButtonDialog,
    presentReturnToButtonDialog,
    scheduleReturnToLivePreview,
    showReturnToButtonDialog,
    fillReturnToButtonForm,
    readReturnToButtonForm,
    switchReturnToButtonTab: switchTab,
    wireReturnToButtonTools,
    nextReturnToButtonName,
    defaultReturnToButtonComponent,
    applyReturnToButton
  };
})();
