/** Change User Properties Button property dialog — FactoryTalk View parity */
(function () {
  let cupPreviewTimer = null;
  let cupDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#changeUserPropertiesButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.cupTab === tabId);
    });
    document.querySelectorAll('#changeUserPropertiesButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.cupTabPanel === tabId);
    });
  }

  function cupGetColor(id, fallback) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || fallback
      || '#001C38';
  }

  function cupSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextChangeUserPropertiesButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'ChangeUserPropertiesButton').length + 1;
    return `ChangeUserPropertiesButton${n}`;
  }


  function defaultChangeUserPropertiesButtonComponent(overrides = {}) {
    return {
      type: 'ChangeUserPropertiesButton',
      name: 'ChangeUserPropertiesButton1',
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
      useCaptionBackColor: true,
      captionBackColor: '#001C38',
      captionBlink: false,
      image: '',
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      useImageColor: false,
      imageColor: '#ffffff',
      useImageBackColor: true,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: false,
      requireESignature: false,
      allowBlankComment: false,
      requireReauth: false,
      requireCounterSig: false,
      authorizedGroup: 'Administrators',
      domainVisible: false,
      domainMode: 'name',
      domainName: '',
      domainVariable: '',
      domainDisable: false,
      ...overrides
    };
  }

  function scheduleChangeUserPropertiesLivePreview() {
    if (window.state?.propsFormFill) return;
    if (cupPreviewTimer) clearTimeout(cupPreviewTimer);
    cupPreviewTimer = setTimeout(() => {
      cupPreviewTimer = null;
      if (!document.getElementById('changeUserPropertiesButtonDialog')?.open) return;
      const comp = readChangeUserPropertiesButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readChangeUserPropertiesButtonForm, 'applyChangeUserPropertiesButton');
    }, 80);
  }

  function syncChangeUserPropertiesESignatureFields() {
    const on = Boolean(document.getElementById('cupRequireESignature')?.checked);
    for (const id of ['cupAllowBlankComment', 'cupRequireReauth', 'cupRequireCounterSig']) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
    const counter = on && Boolean(document.getElementById('cupRequireCounterSig')?.checked);
    for (const id of [
      'cupAuthorizedGroup', 'cupDomainVisible', 'cupDomainNameMode', 'cupDomainVariableMode',
      'cupDomainName', 'cupDomainVariable', 'cupDomainBrowse', 'cupDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !counter;
    }
  }

  function syncChangeUserPropertiesButtonFields() {
    const capColor = document.getElementById('cupCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('cupUseCaptionColor')?.checked;
    const capBack = document.getElementById('cupCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('cupUseCaptionBackColor')?.checked;
    const imgColor = document.getElementById('cupImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('cupUseImageColor')?.checked;
    const imgBack = document.getElementById('cupImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('cupUseImageBackColor')?.checked;
    syncChangeUserPropertiesESignatureFields();
  }

  function wireChangeUserPropertiesButtonTools() {
    const dlg = document.getElementById('changeUserPropertiesButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('cupPatternStyle', 'cupFilled');
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    document.querySelectorAll('#changeUserPropertiesButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.cupPreviewWired === '1') return;
      input.dataset.cupPreviewWired = '1';
      input.addEventListener('input', scheduleChangeUserPropertiesLivePreview);
      input.addEventListener('change', scheduleChangeUserPropertiesLivePreview);
    });
    syncChangeUserPropertiesButtonFields();
  }

  function presentChangeUserPropertiesButtonDialog() {
    const dialog = document.getElementById('changeUserPropertiesButtonDialog');
    if (!dialog) {
      window.setStatus('Change User Properties Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    cupDialogCommitted = false;
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
        window.setStatus(`Opened Change User Properties Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillChangeUserPropertiesButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('cupPatternStyle', 'cupFilled');
      document.getElementById('cupBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('cupBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('cupBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('cupPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('cupShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('cupBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      cupSetColor('cupBackColor', comp.backColor || '#001C38');
      cupSetColor('cupBorderColor', comp.borderColor || '#001C38');
      cupSetColor('cupPatternColor', comp.patternColor || '#ffffff');
      cupSetColor('cupHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('cupBlink').checked = Boolean(comp.blink);
      document.getElementById('cupHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('cupVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('cupAudio').checked = comp.audio !== false;
      document.getElementById('cupCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('cupFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('cupFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('cupBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('cupItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('cupUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('cupUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      cupSetColor('cupCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('cupUseCaptionBackColor').checked = comp.useCaptionBackColor !== undefined
        ? Boolean(comp.useCaptionBackColor)
        : true;
      cupSetColor('cupCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('cupCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('cupWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('cupCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#changeUserPropertiesButtonForm input[name="cupAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('cupImage').value = comp.image || '';
      document.getElementById('cupImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('cupUseImageColor').checked = Boolean(comp.useImageColor);
      cupSetColor('cupImageColor', comp.imageColor || '#ffffff');
      document.getElementById('cupUseImageBackColor').checked = comp.useImageBackColor !== undefined
        ? Boolean(comp.useImageBackColor)
        : true;
      cupSetColor('cupImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('cupImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('cupImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#changeUserPropertiesButtonForm input[name="cupImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('cupRequireESignature').checked = Boolean(comp.requireESignature);
      document.getElementById('cupAllowBlankComment').checked = Boolean(comp.allowBlankComment);
      document.getElementById('cupRequireReauth').checked = Boolean(comp.requireReauth);
      document.getElementById('cupRequireCounterSig').checked = Boolean(comp.requireCounterSig);
      document.getElementById('cupAuthorizedGroup').value = comp.authorizedGroup || 'Administrators';
      document.getElementById('cupDomainVisible').checked = Boolean(comp.domainVisible);
      const domainMode = comp.domainMode === 'variable' ? 'variable' : 'name';
      document.querySelectorAll('#changeUserPropertiesButtonForm input[name="cupDomainMode"]').forEach((el) => {
        el.checked = el.value === domainMode;
      });
      document.getElementById('cupDomainName').value = comp.domainName || '';
      document.getElementById('cupDomainVariable').value = comp.domainVariable || '';
      document.getElementById('cupDomainDisable').checked = Boolean(comp.domainDisable);
      document.getElementById('cupHeight').value = comp.height ?? 80;
      document.getElementById('cupWidth').value = comp.width ?? 80;
      document.getElementById('cupTop').value = comp.top ?? 16;
      document.getElementById('cupLeft').value = comp.left ?? 16;
      document.getElementById('cupName').value = comp.name || 'ChangeUserPropertiesButton1';
      document.getElementById('cupVisible').checked = comp.visible !== false;
      syncChangeUserPropertiesButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readChangeUserPropertiesButtonForm() {
    const caption = document.getElementById('cupCaption')?.value || '';
    const captionColor = cupGetColor('cupCaptionColor', '#ffffff');
    return {
      type: 'ChangeUserPropertiesButton',
      name: document.getElementById('cupName')?.value.trim() || 'ChangeUserPropertiesButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('cupLeft')?.value) || 0,
      top: Number(document.getElementById('cupTop')?.value) || 0,
      width: Number(document.getElementById('cupWidth')?.value) || 80,
      height: Number(document.getElementById('cupHeight')?.value) || 80,
      visible: document.getElementById('cupVisible')?.checked !== false,
      borderStyle: document.getElementById('cupBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('cupBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('cupBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('cupBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('cupPatternStyle')?.value || 'none',
      shape: document.getElementById('cupShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: cupGetColor('cupBackColor', '#001C38'),
      useBorderColor: true,
      borderColor: cupGetColor('cupBorderColor', '#001C38'),
      usePatternColor: true,
      patternColor: cupGetColor('cupPatternColor', '#ffffff'),
      useHighlightColor: true,
      highlightColor: cupGetColor('cupHighlightColor', '#0066cc'),
      blink: Boolean(document.getElementById('cupBlink')?.checked),
      horizontalMargin: Number(document.getElementById('cupHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('cupVerticalMargin')?.value) || 0,
      audio: document.getElementById('cupAudio')?.checked !== false,
      fontFamily: document.getElementById('cupFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('cupFontSize')?.value) || 10,
      bold: document.getElementById('cupBold')?.classList.contains('active'),
      italic: document.getElementById('cupItalic')?.classList.contains('active'),
      underline: document.getElementById('cupUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('cupUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('cupUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('cupUseCaptionBackColor')?.checked),
      captionBackColor: cupGetColor('cupCaptionBackColor', '#001C38'),
      captionBlink: Boolean(document.getElementById('cupCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('cupCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('cupWordWrap')?.checked !== false,
      alignment: document.querySelector('#changeUserPropertiesButtonForm input[name="cupAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('cupImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('cupImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#changeUserPropertiesButtonForm input[name="cupImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('cupUseImageColor')?.checked),
      imageColor: cupGetColor('cupImageColor', '#ffffff'),
      useImageBackColor: Boolean(document.getElementById('cupUseImageBackColor')?.checked),
      imageBackColor: cupGetColor('cupImageBackColor', '#001C38'),
      imageBlink: Boolean(document.getElementById('cupImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('cupImageScaled')?.checked),
      requireESignature: Boolean(document.getElementById('cupRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('cupAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('cupRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('cupRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('cupAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('cupDomainVisible')?.checked),
      domainMode: document.querySelector('#changeUserPropertiesButtonForm input[name="cupDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('cupDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('cupDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('cupDomainDisable')?.checked)
    };
  }

  async function showChangeUserPropertiesButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Change User Properties Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initChangeUserPropertiesButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultChangeUserPropertiesButtonComponent({
        name: nextChangeUserPropertiesButtonName(canvas?.components),
        ...overrides
      });
      fillChangeUserPropertiesButtonForm(comp);
      window.resetPropsDialogState('change-user-properties', readChangeUserPropertiesButtonForm, 'applyChangeUserPropertiesButton');
      switchTab('general');
      wireChangeUserPropertiesButtonTools();
      presentChangeUserPropertiesButtonDialog();
      const previewComp = readChangeUserPropertiesButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readChangeUserPropertiesButtonForm, 'applyChangeUserPropertiesButton');
    } catch (err) {
      window.setStatus(`Change User Properties Button properties error: ${err.message}`);
    }
  }

  async function applyChangeUserPropertiesButton() {
    const comp = readChangeUserPropertiesButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readChangeUserPropertiesButtonForm, 'applyChangeUserPropertiesButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveChangeUserPropertiesButton(e) {
    e.preventDefault();
    const comp = readChangeUserPropertiesButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    cupDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('changeUserPropertiesButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertCupCaptionText(text) {
    const area = document.getElementById('cupCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleChangeUserPropertiesLivePreview();
  }

  function insertCupCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertCupCaptionText(tag);
    });
  }

  function hideCupInsertVariableMenu() {
    document.getElementById('cupInsertVariableMenu')?.classList.add('hidden');
  }

  function initChangeUserPropertiesButtonDialog() {
    const form = document.getElementById('changeUserPropertiesButtonForm');
    if (!form || form.dataset.cupWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('cupPatternStyle', 'cupFilled');
    form.addEventListener('submit', (e) => saveChangeUserPropertiesButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyChangeUserPropertiesButton')?.addEventListener('click', () => {
      applyChangeUserPropertiesButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleChangeUserPropertiesLivePreview();
      window.flushPropsApplyButton?.(readChangeUserPropertiesButtonForm, 'applyChangeUserPropertiesButton');
    });
    form.addEventListener('change', () => {
      syncChangeUserPropertiesButtonFields();
      scheduleChangeUserPropertiesLivePreview();
      window.flushPropsApplyButton?.(readChangeUserPropertiesButtonForm, 'applyChangeUserPropertiesButton');
    });
    document.getElementById('cancelChangeUserPropertiesButton')?.addEventListener('click', () => {
      if (!cupDialogCommitted) window.revertPropsDialogPreview?.();
      cupDialogCommitted = true;
      document.getElementById('changeUserPropertiesButtonDialog')?.close();
    });
    document.getElementById('changeUserPropertiesButtonDialog')?.addEventListener('close', () => {
      if (cupPreviewTimer) {
        clearTimeout(cupPreviewTimer);
        cupPreviewTimer = null;
      }
      hideCupInsertVariableMenu();
      if (!cupDialogCommitted) window.revertPropsDialogPreview?.();
      cupDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpChangeUserPropertiesButton')?.addEventListener('click', () => {
      alert('Change User Properties Button opens a runtime prompt asking for a username, verifies that user exists, and lets you update its role/group and enabled state.');
    });
    document.querySelectorAll('#changeUserPropertiesButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideCupInsertVariableMenu();
        switchTab(tab.dataset.cupTab);
      });
    });
    document.getElementById('cupBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('cupImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('cupImage').value = fileName;
          scheduleChangeUserPropertiesLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('cupInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('cupInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('cupInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.cupVar;
      if (!kind) return;
      hideCupInsertVariableMenu();
      if (kind === 'timedate') insertCupCaptionText('{#dt}');
      else insertCupCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#changeUserPropertiesButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideCupInsertVariableMenu();
    });
    document.getElementById('cupShape')?.addEventListener('change', () => {
      if (document.getElementById('cupShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('cupWidth')?.value) || 0;
      const h = Number(document.getElementById('cupHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('cupWidth').value = String(size);
      document.getElementById('cupHeight').value = String(size);
    });
    document.getElementById('cupDomainBrowse')?.addEventListener('click', () => {
      if (document.getElementById('cupDomainBrowse')?.disabled) return;
      window.StudioTagTools?.openTagBrowser(null, (sel) => {
        const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
        if (!tag) return;
        document.getElementById('cupDomainVariable').value = tag;
        scheduleChangeUserPropertiesLivePreview();
      });
    });
    for (const id of ['cupBold', 'cupItalic', 'cupUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleChangeUserPropertiesLivePreview();
      });
    }
    form.dataset.cupWired = '1';
  }

  window.StudioChangeUserPropertiesButton = {
    initChangeUserPropertiesButtonDialog,
    presentChangeUserPropertiesButtonDialog,
    scheduleChangeUserPropertiesLivePreview,
    showChangeUserPropertiesButtonDialog,
    fillChangeUserPropertiesButtonForm,
    readChangeUserPropertiesButtonForm,
    switchChangeUserPropertiesButtonTab: switchTab,
    wireChangeUserPropertiesButtonTools,
    nextChangeUserPropertiesButtonName,
    defaultChangeUserPropertiesButtonComponent,
    applyChangeUserPropertiesButton
  };
})();
