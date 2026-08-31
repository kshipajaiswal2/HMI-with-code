/** Goto Display Button property dialog — FactoryTalk View parity */
(function () {
  let gbPreviewTimer = null;
  let gbDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#gotoButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.gbTab === tabId);
    });
    document.querySelectorAll('#gotoButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.gbTabPanel === tabId);
    });
  }

  function gbGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function gbSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextGotoButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'GotoButton').length + 1;
    return `GotoDisplayButton${n}`;
  }

  function defaultGotoButtonComponent(overrides = {}) {
    return {
      type: 'GotoButton',
      name: 'GotoDisplayButton1',
      target: '',
      displayNameTag: '',
      displayTopTag: '',
      displayLeftTag: '',
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
      useVariableDisplay: false,
      parameterType: 'file',
      parameterFile: '',
      parameterList: '',
      displayPosition: false,
      displayTop: 0,
      displayLeft: 0,
      useVariableDisplayPosition: false,
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

  function scheduleGotoLivePreview() {
    if (window.state?.propsFormFill) return;
    if (gbPreviewTimer) clearTimeout(gbPreviewTimer);
    gbPreviewTimer = setTimeout(() => {
      gbPreviewTimer = null;
      if (!document.getElementById('gotoButtonDialog')?.open) return;
      const comp = readGotoButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readGotoButtonForm, 'applyGotoButton');
    }, 80);
  }

  function syncGotoLabelFields() {
    const capColor = document.getElementById('gbCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('gbUseCaptionColor')?.checked;
    const capBack = document.getElementById('gbCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('gbUseCaptionBackColor')?.checked
      || document.getElementById('gbCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('gbImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('gbUseImageColor')?.checked;
    const imgBack = document.getElementById('gbImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('gbUseImageBackColor')?.checked
      || document.getElementById('gbImageBackStyle')?.value !== 'solid';
  }

  function syncGotoGeneralFields() {
    const useVarDisplay = document.getElementById('gbUseVariableDisplay')?.checked;
    const displayPos = document.getElementById('gbDisplayPosition')?.checked;
    const paramType = document.querySelector('#gotoButtonForm input[name="gbParameterType"]:checked')?.value || 'file';
    const fileMode = paramType === 'file';
    document.getElementById('gbTarget').disabled = Boolean(useVarDisplay);
    document.getElementById('gbBrowseDisplay').disabled = Boolean(useVarDisplay);
    document.getElementById('gbDisplayTop').disabled = !displayPos;
    document.getElementById('gbDisplayLeft').disabled = !displayPos;
    document.getElementById('gbParameterFile').disabled = !fileMode;
    document.getElementById('gbBrowseParameterFile').disabled = !fileMode;
    document.getElementById('gbParameterList').disabled = fileMode;
    document.getElementById('gbBrowseParameterList').disabled = fileMode;
    syncGotoLabelFields();
  }

  function wireGotoButtonTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('gotoButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('gbPatternStyle', 'gbFilled');
    document.querySelectorAll('#gotoButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.gbPreviewWired === '1') return;
      input.dataset.gbPreviewWired = '1';
      input.addEventListener('input', scheduleGotoLivePreview);
      input.addEventListener('change', scheduleGotoLivePreview);
    });
    syncGotoGeneralFields();
  }

  function presentGotoButtonDialog() {
    const dialog = document.getElementById('gotoButtonDialog');
    if (!dialog) {
      window.setStatus('Goto Display Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    gbDialogCommitted = false;
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
        window.setStatus(`Opened Goto Display Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillGotoButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('gbPatternStyle', 'gbFilled');
      document.getElementById('gbBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('gbBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('gbBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('gbPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('gbShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('gbBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      gbSetColor('gbBackColor', comp.backColor || '#001C38');
      gbSetColor('gbBorderColor', comp.borderColor || '#001C38');
      gbSetColor('gbPatternColor', comp.patternColor || '#ffffff');
      gbSetColor('gbHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('gbBlink').checked = Boolean(comp.blink);
      document.getElementById('gbTarget').value = comp.target || '';
      document.getElementById('gbUseVariableDisplay').checked = Boolean(comp.useVariableDisplay);
      document.getElementById('gbParameterFileRadio').checked = (comp.parameterType || 'file') !== 'list';
      document.getElementById('gbParameterListRadio').checked = comp.parameterType === 'list';
      document.getElementById('gbParameterFile').value = comp.parameterFile || '';
      document.getElementById('gbParameterList').value = comp.parameterList || '';
      document.getElementById('gbDisplayPosition').checked = Boolean(comp.displayPosition);
      document.getElementById('gbDisplayTop').value = comp.displayTop ?? 0;
      document.getElementById('gbDisplayLeft').value = comp.displayLeft ?? 0;
      document.getElementById('gbUseVariableDisplayPosition').checked = Boolean(comp.useVariableDisplayPosition);
      document.getElementById('gbHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('gbVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('gbAudio').checked = comp.audio !== false;
      document.getElementById('gbCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('gbFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('gbFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('gbBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('gbItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('gbUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('gbUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      gbSetColor('gbCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('gbUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      gbSetColor('gbCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('gbCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('gbWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('gbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#gotoButtonForm input[name="gbAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('gbImage').value = comp.image || '';
      document.getElementById('gbImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('gbUseImageColor').checked = Boolean(comp.useImageColor);
      gbSetColor('gbImageColor', comp.imageColor || '#ffffff');
      document.getElementById('gbUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      gbSetColor('gbImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('gbImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('gbImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#gotoButtonForm input[name="gbImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('gbDisplayNameTag').value = comp.displayNameTag || '';
      document.getElementById('gbDisplayTopTag').value = comp.displayTopTag || '';
      document.getElementById('gbDisplayLeftTag').value = comp.displayLeftTag || '';
      document.getElementById('gbHeight').value = comp.height ?? 80;
      document.getElementById('gbWidth').value = comp.width ?? 80;
      document.getElementById('gbTop').value = comp.top ?? 16;
      document.getElementById('gbLeft').value = comp.left ?? 16;
      document.getElementById('gbName').value = comp.name || 'GotoDisplayButton1';
      document.getElementById('gbVisible').checked = comp.visible !== false;
      syncGotoGeneralFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readGotoButtonForm() {
    const caption = document.getElementById('gbCaption')?.value || '';
    const captionColor = gbGetColor('gbCaptionColor');
    return {
      type: 'GotoButton',
      name: document.getElementById('gbName')?.value.trim() || 'GotoDisplayButton1',
      target: document.getElementById('gbTarget')?.value.trim() || '',
      caption,
      label: caption,
      left: Number(document.getElementById('gbLeft')?.value) || 0,
      top: Number(document.getElementById('gbTop')?.value) || 0,
      width: Number(document.getElementById('gbWidth')?.value) || 80,
      height: Number(document.getElementById('gbHeight')?.value) || 80,
      visible: document.getElementById('gbVisible')?.checked !== false,
      borderStyle: document.getElementById('gbBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('gbBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('gbBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('gbBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('gbPatternStyle')?.value || 'none',
      shape: document.getElementById('gbShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: gbGetColor('gbBackColor'),
      useBorderColor: true,
      borderColor: gbGetColor('gbBorderColor'),
      usePatternColor: true,
      patternColor: gbGetColor('gbPatternColor'),
      useHighlightColor: true,
      highlightColor: gbGetColor('gbHighlightColor'),
      blink: Boolean(document.getElementById('gbBlink')?.checked),
      useVariableDisplay: Boolean(document.getElementById('gbUseVariableDisplay')?.checked),
      displayNameTag: document.getElementById('gbDisplayNameTag')?.value.trim() || '',
      displayTopTag: document.getElementById('gbDisplayTopTag')?.value.trim() || '',
      displayLeftTag: document.getElementById('gbDisplayLeftTag')?.value.trim() || '',
      parameterType: document.querySelector('#gotoButtonForm input[name="gbParameterType"]:checked')?.value || 'file',
      parameterFile: document.getElementById('gbParameterFile')?.value.trim() || '',
      parameterList: document.getElementById('gbParameterList')?.value.trim() || '',
      displayPosition: Boolean(document.getElementById('gbDisplayPosition')?.checked),
      displayTop: Number(document.getElementById('gbDisplayTop')?.value) || 0,
      displayLeft: Number(document.getElementById('gbDisplayLeft')?.value) || 0,
      useVariableDisplayPosition: Boolean(document.getElementById('gbUseVariableDisplayPosition')?.checked),
      horizontalMargin: Number(document.getElementById('gbHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('gbVerticalMargin')?.value) || 0,
      audio: document.getElementById('gbAudio')?.checked !== false,
      fontFamily: document.getElementById('gbFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('gbFontSize')?.value) || 10,
      bold: document.getElementById('gbBold')?.classList.contains('active'),
      italic: document.getElementById('gbItalic')?.classList.contains('active'),
      underline: document.getElementById('gbUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('gbUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('gbUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('gbUseCaptionBackColor')?.checked),
      captionBackColor: gbGetColor('gbCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('gbCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('gbCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('gbWordWrap')?.checked !== false,
      alignment: document.querySelector('#gotoButtonForm input[name="gbAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('gbImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('gbImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#gotoButtonForm input[name="gbImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('gbUseImageColor')?.checked),
      imageColor: gbGetColor('gbImageColor'),
      useImageBackColor: Boolean(document.getElementById('gbUseImageBackColor')?.checked),
      imageBackColor: gbGetColor('gbImageBackColor'),
      imageBlink: Boolean(document.getElementById('gbImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('gbImageScaled')?.checked)
    };
  }

  async function showGotoButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Goto Display Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initGotoButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultGotoButtonComponent({
        name: nextGotoButtonName(canvas?.components),
        ...overrides
      });
      fillGotoButtonForm(comp);
      window.resetPropsDialogState('goto', readGotoButtonForm, 'applyGotoButton');
      switchTab('general');
      wireGotoButtonTools();
      presentGotoButtonDialog();
      const previewComp = readGotoButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readGotoButtonForm, 'applyGotoButton');
    } catch (err) {
      window.setStatus(`Goto Display Button properties error: ${err.message}`);
    }
  }

  async function applyGotoButton() {
    const comp = readGotoButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readGotoButtonForm, 'applyGotoButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveGotoButton(e) {
    e.preventDefault();
    const comp = readGotoButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    gbDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('gotoButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertGbCaptionText(text) {
    const area = document.getElementById('gbCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleGotoLivePreview();
  }

  function insertGbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertGbCaptionText(tag);
    });
  }

  function hideGbInsertVariableMenu() {
    document.getElementById('gbInsertVariableMenu')?.classList.add('hidden');
  }

  function initGotoButtonDialog() {
    const form = document.getElementById('gotoButtonForm');
    if (!form || form.dataset.gbWired === '1') return;
    form.dataset.gbWired = '1';
    window.StudioPropsShared?.fillPatternSelect('gbPatternStyle', 'gbFilled');
    form.addEventListener('submit', (e) => saveGotoButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyGotoButton')?.addEventListener('click', () => {
      applyGotoButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleGotoLivePreview();
      window.flushPropsApplyButton?.(readGotoButtonForm, 'applyGotoButton');
    });
    form.addEventListener('change', () => {
      syncGotoGeneralFields();
      scheduleGotoLivePreview();
      window.flushPropsApplyButton?.(readGotoButtonForm, 'applyGotoButton');
    });
    document.getElementById('cancelGotoButton')?.addEventListener('click', () => {
      document.getElementById('gotoButtonDialog')?.close();
    });
    document.getElementById('gotoButtonDialog')?.addEventListener('close', () => {
      if (gbPreviewTimer) {
        clearTimeout(gbPreviewTimer);
        gbPreviewTimer = null;
      }
      hideGbInsertVariableMenu();
      if (!gbDialogCommitted) window.revertPropsDialogPreview?.();
      gbDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpGotoButton')?.addEventListener('click', () => {
      alert('Goto Display Button opens another display when pressed. A target display is optional until runtime.');
    });
    document.querySelectorAll('#gotoButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideGbInsertVariableMenu();
        switchTab(tab.dataset.gbTab);
      });
    });
    document.getElementById('gbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('gbImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('gbImage').value = fileName;
          scheduleGotoLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('gbBrowseDisplay')?.addEventListener('click', () => {
      window.showDisplayPickerDialog?.(document.getElementById('gbTarget')?.value || '', { kind: 'displays' })
        .then((screenId) => {
          if (!screenId) return;
          document.getElementById('gbTarget').value = screenId;
          scheduleGotoLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('gbBrowseParameterFile')?.addEventListener('click', () => {
      window.showDisplayPickerDialog?.(document.getElementById('gbParameterFile')?.value || '', { kind: 'parameter-files' })
        .then((name) => {
          if (!name) return;
          document.getElementById('gbParameterFile').value = name;
          scheduleGotoLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('gbBrowseParameterList')?.addEventListener('click', () => {
      window.showDisplayPickerDialog?.(document.getElementById('gbParameterList')?.value || '', { kind: 'parameter-files' })
        .then((name) => {
          if (!name) return;
          document.getElementById('gbParameterList').value = name;
          scheduleGotoLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('gbInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('gbInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('gbInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.gbVar;
      if (!kind) return;
      hideGbInsertVariableMenu();
      if (kind === 'timedate') insertGbCaptionText('{#dt}');
      else insertGbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#gotoButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideGbInsertVariableMenu();
    });
    document.getElementById('gbShape')?.addEventListener('change', () => {
      if (document.getElementById('gbShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('gbWidth')?.value) || 0;
      const h = Number(document.getElementById('gbHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('gbWidth').value = String(size);
      document.getElementById('gbHeight').value = String(size);
    });
    for (const id of ['gbBold', 'gbItalic', 'gbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleGotoLivePreview();
      });
    }
  }

  window.StudioGotoButton = {
    initGotoButtonDialog,
    presentGotoButtonDialog,
    scheduleGotoLivePreview,
    showGotoButtonDialog,
    fillGotoButtonForm,
    readGotoButtonForm,
    switchGotoButtonTab: switchTab,
    wireGotoButtonTools,
    nextGotoButtonName,
    defaultGotoButtonComponent,
    applyGotoButton
  };
})();
