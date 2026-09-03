/** Modify Group Membership Button property dialog — FactoryTalk View parity */
(function () {
  let mgbPreviewTimer = null;
  let mgbDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#modifyGroupMembershipButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.mgbTab === tabId);
    });
    document.querySelectorAll('#modifyGroupMembershipButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.mgbTabPanel === tabId);
    });
  }

  function mgbGetColor(id, fallback) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || fallback
      || '#001C38';
  }

  function mgbSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextModifyGroupMembershipButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'ModifyGroupMembershipButton').length + 1;
    return `ModifyGroupMembershipButton${n}`;
  }


  function defaultModifyGroupMembershipButtonComponent(overrides = {}) {
    return {
      type: 'ModifyGroupMembershipButton',
      name: 'ModifyGroupMembershipButton1',
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

  function scheduleModifyGroupMembershipLivePreview() {
    if (window.state?.propsFormFill) return;
    if (mgbPreviewTimer) clearTimeout(mgbPreviewTimer);
    mgbPreviewTimer = setTimeout(() => {
      mgbPreviewTimer = null;
      if (!document.getElementById('modifyGroupMembershipButtonDialog')?.open) return;
      const comp = readModifyGroupMembershipButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readModifyGroupMembershipButtonForm, 'applyModifyGroupMembershipButton');
    }, 80);
  }

  function syncModifyGroupMembershipESignatureFields() {
    const on = Boolean(document.getElementById('mgbRequireESignature')?.checked);
    for (const id of ['mgbAllowBlankComment', 'mgbRequireReauth', 'mgbRequireCounterSig']) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
    const counter = on && Boolean(document.getElementById('mgbRequireCounterSig')?.checked);
    for (const id of [
      'mgbAuthorizedGroup', 'mgbDomainVisible', 'mgbDomainNameMode', 'mgbDomainVariableMode',
      'mgbDomainName', 'mgbDomainVariable', 'mgbDomainBrowse', 'mgbDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !counter;
    }
  }

  function syncModifyGroupMembershipButtonFields() {
    const capColor = document.getElementById('mgbCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('mgbUseCaptionColor')?.checked;
    const capBack = document.getElementById('mgbCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('mgbUseCaptionBackColor')?.checked;
    const imgColor = document.getElementById('mgbImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('mgbUseImageColor')?.checked;
    const imgBack = document.getElementById('mgbImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('mgbUseImageBackColor')?.checked;
    syncModifyGroupMembershipESignatureFields();
  }

  function wireModifyGroupMembershipButtonTools() {
    const dlg = document.getElementById('modifyGroupMembershipButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('mgbPatternStyle', 'mgbFilled');
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    document.querySelectorAll('#modifyGroupMembershipButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.mgbPreviewWired === '1') return;
      input.dataset.mgbPreviewWired = '1';
      input.addEventListener('input', scheduleModifyGroupMembershipLivePreview);
      input.addEventListener('change', scheduleModifyGroupMembershipLivePreview);
    });
    syncModifyGroupMembershipButtonFields();
  }

  function presentModifyGroupMembershipButtonDialog() {
    const dialog = document.getElementById('modifyGroupMembershipButtonDialog');
    if (!dialog) {
      window.setStatus('Modify Group Membership Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    mgbDialogCommitted = false;
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
        window.setStatus(`Opened Modify Group Membership Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillModifyGroupMembershipButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('mgbPatternStyle', 'mgbFilled');
      document.getElementById('mgbBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('mgbBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('mgbBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('mgbPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('mgbShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('mgbBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      mgbSetColor('mgbBackColor', comp.backColor || '#001C38');
      mgbSetColor('mgbBorderColor', comp.borderColor || '#001C38');
      mgbSetColor('mgbPatternColor', comp.patternColor || '#ffffff');
      mgbSetColor('mgbHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('mgbBlink').checked = Boolean(comp.blink);
      document.getElementById('mgbHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('mgbVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('mgbAudio').checked = comp.audio !== false;
      document.getElementById('mgbCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('mgbFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('mgbFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('mgbBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('mgbItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('mgbUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('mgbUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      mgbSetColor('mgbCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('mgbUseCaptionBackColor').checked = comp.useCaptionBackColor !== undefined
        ? Boolean(comp.useCaptionBackColor)
        : true;
      mgbSetColor('mgbCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('mgbCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('mgbWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('mgbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#modifyGroupMembershipButtonForm input[name="mgbAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('mgbImage').value = comp.image || '';
      document.getElementById('mgbImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('mgbUseImageColor').checked = Boolean(comp.useImageColor);
      mgbSetColor('mgbImageColor', comp.imageColor || '#ffffff');
      document.getElementById('mgbUseImageBackColor').checked = comp.useImageBackColor !== undefined
        ? Boolean(comp.useImageBackColor)
        : true;
      mgbSetColor('mgbImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('mgbImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('mgbImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#modifyGroupMembershipButtonForm input[name="mgbImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('mgbRequireESignature').checked = Boolean(comp.requireESignature);
      document.getElementById('mgbAllowBlankComment').checked = Boolean(comp.allowBlankComment);
      document.getElementById('mgbRequireReauth').checked = Boolean(comp.requireReauth);
      document.getElementById('mgbRequireCounterSig').checked = Boolean(comp.requireCounterSig);
      document.getElementById('mgbAuthorizedGroup').value = comp.authorizedGroup || 'Administrators';
      document.getElementById('mgbDomainVisible').checked = Boolean(comp.domainVisible);
      const domainMode = comp.domainMode === 'variable' ? 'variable' : 'name';
      document.querySelectorAll('#modifyGroupMembershipButtonForm input[name="mgbDomainMode"]').forEach((el) => {
        el.checked = el.value === domainMode;
      });
      document.getElementById('mgbDomainName').value = comp.domainName || '';
      document.getElementById('mgbDomainVariable').value = comp.domainVariable || '';
      document.getElementById('mgbDomainDisable').checked = Boolean(comp.domainDisable);
      document.getElementById('mgbHeight').value = comp.height ?? 80;
      document.getElementById('mgbWidth').value = comp.width ?? 80;
      document.getElementById('mgbTop').value = comp.top ?? 16;
      document.getElementById('mgbLeft').value = comp.left ?? 16;
      document.getElementById('mgbName').value = comp.name || 'ModifyGroupMembershipButton1';
      document.getElementById('mgbVisible').checked = comp.visible !== false;
      syncModifyGroupMembershipButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readModifyGroupMembershipButtonForm() {
    const caption = document.getElementById('mgbCaption')?.value || '';
    const captionColor = mgbGetColor('mgbCaptionColor', '#ffffff');
    return {
      type: 'ModifyGroupMembershipButton',
      name: document.getElementById('mgbName')?.value.trim() || 'ModifyGroupMembershipButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('mgbLeft')?.value) || 0,
      top: Number(document.getElementById('mgbTop')?.value) || 0,
      width: Number(document.getElementById('mgbWidth')?.value) || 80,
      height: Number(document.getElementById('mgbHeight')?.value) || 80,
      visible: document.getElementById('mgbVisible')?.checked !== false,
      borderStyle: document.getElementById('mgbBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('mgbBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('mgbBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('mgbBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('mgbPatternStyle')?.value || 'none',
      shape: document.getElementById('mgbShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: mgbGetColor('mgbBackColor', '#001C38'),
      useBorderColor: true,
      borderColor: mgbGetColor('mgbBorderColor', '#001C38'),
      usePatternColor: true,
      patternColor: mgbGetColor('mgbPatternColor', '#ffffff'),
      useHighlightColor: true,
      highlightColor: mgbGetColor('mgbHighlightColor', '#0066cc'),
      blink: Boolean(document.getElementById('mgbBlink')?.checked),
      horizontalMargin: Number(document.getElementById('mgbHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('mgbVerticalMargin')?.value) || 0,
      audio: document.getElementById('mgbAudio')?.checked !== false,
      fontFamily: document.getElementById('mgbFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('mgbFontSize')?.value) || 10,
      bold: document.getElementById('mgbBold')?.classList.contains('active'),
      italic: document.getElementById('mgbItalic')?.classList.contains('active'),
      underline: document.getElementById('mgbUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('mgbUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('mgbUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('mgbUseCaptionBackColor')?.checked),
      captionBackColor: mgbGetColor('mgbCaptionBackColor', '#001C38'),
      captionBlink: Boolean(document.getElementById('mgbCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('mgbCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('mgbWordWrap')?.checked !== false,
      alignment: document.querySelector('#modifyGroupMembershipButtonForm input[name="mgbAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('mgbImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('mgbImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#modifyGroupMembershipButtonForm input[name="mgbImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('mgbUseImageColor')?.checked),
      imageColor: mgbGetColor('mgbImageColor', '#ffffff'),
      useImageBackColor: Boolean(document.getElementById('mgbUseImageBackColor')?.checked),
      imageBackColor: mgbGetColor('mgbImageBackColor', '#001C38'),
      imageBlink: Boolean(document.getElementById('mgbImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('mgbImageScaled')?.checked),
      requireESignature: Boolean(document.getElementById('mgbRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('mgbAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('mgbRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('mgbRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('mgbAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('mgbDomainVisible')?.checked),
      domainMode: document.querySelector('#modifyGroupMembershipButtonForm input[name="mgbDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('mgbDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('mgbDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('mgbDomainDisable')?.checked)
    };
  }

  async function showModifyGroupMembershipButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Modify Group Membership Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initModifyGroupMembershipButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultModifyGroupMembershipButtonComponent({
        name: nextModifyGroupMembershipButtonName(canvas?.components),
        ...overrides
      });
      fillModifyGroupMembershipButtonForm(comp);
      window.resetPropsDialogState('modify-group-membership', readModifyGroupMembershipButtonForm, 'applyModifyGroupMembershipButton');
      switchTab('general');
      wireModifyGroupMembershipButtonTools();
      presentModifyGroupMembershipButtonDialog();
      const previewComp = readModifyGroupMembershipButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readModifyGroupMembershipButtonForm, 'applyModifyGroupMembershipButton');
    } catch (err) {
      window.setStatus(`Modify Group Membership Button properties error: ${err.message}`);
    }
  }

  async function applyModifyGroupMembershipButton() {
    const comp = readModifyGroupMembershipButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readModifyGroupMembershipButtonForm, 'applyModifyGroupMembershipButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveModifyGroupMembershipButton(e) {
    e.preventDefault();
    const comp = readModifyGroupMembershipButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    mgbDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('modifyGroupMembershipButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertMgbCaptionText(text) {
    const area = document.getElementById('mgbCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleModifyGroupMembershipLivePreview();
  }

  function insertMgbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertMgbCaptionText(tag);
    });
  }

  function hideMgbInsertVariableMenu() {
    document.getElementById('mgbInsertVariableMenu')?.classList.add('hidden');
  }

  function initModifyGroupMembershipButtonDialog() {
    const form = document.getElementById('modifyGroupMembershipButtonForm');
    if (!form || form.dataset.mgbWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('mgbPatternStyle', 'mgbFilled');
    form.addEventListener('submit', (e) => saveModifyGroupMembershipButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyModifyGroupMembershipButton')?.addEventListener('click', () => {
      applyModifyGroupMembershipButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleModifyGroupMembershipLivePreview();
      window.flushPropsApplyButton?.(readModifyGroupMembershipButtonForm, 'applyModifyGroupMembershipButton');
    });
    form.addEventListener('change', () => {
      syncModifyGroupMembershipButtonFields();
      scheduleModifyGroupMembershipLivePreview();
      window.flushPropsApplyButton?.(readModifyGroupMembershipButtonForm, 'applyModifyGroupMembershipButton');
    });
    document.getElementById('cancelModifyGroupMembershipButton')?.addEventListener('click', () => {
      if (!mgbDialogCommitted) window.revertPropsDialogPreview?.();
      mgbDialogCommitted = true;
      document.getElementById('modifyGroupMembershipButtonDialog')?.close();
    });
    document.getElementById('modifyGroupMembershipButtonDialog')?.addEventListener('close', () => {
      if (mgbPreviewTimer) {
        clearTimeout(mgbPreviewTimer);
        mgbPreviewTimer = null;
      }
      hideMgbInsertVariableMenu();
      if (!mgbDialogCommitted) window.revertPropsDialogPreview?.();
      mgbDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpModifyGroupMembershipButton')?.addEventListener('click', () => {
      alert('Modify Group Membership Button opens a runtime prompt asking for a username, verifies that user exists, and changes its role/group.');
    });
    document.querySelectorAll('#modifyGroupMembershipButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideMgbInsertVariableMenu();
        switchTab(tab.dataset.mgbTab);
      });
    });
    document.getElementById('mgbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('mgbImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('mgbImage').value = fileName;
          scheduleModifyGroupMembershipLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('mgbInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('mgbInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('mgbInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.mgbVar;
      if (!kind) return;
      hideMgbInsertVariableMenu();
      if (kind === 'timedate') insertMgbCaptionText('{#dt}');
      else insertMgbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#modifyGroupMembershipButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideMgbInsertVariableMenu();
    });
    document.getElementById('mgbShape')?.addEventListener('change', () => {
      if (document.getElementById('mgbShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('mgbWidth')?.value) || 0;
      const h = Number(document.getElementById('mgbHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('mgbWidth').value = String(size);
      document.getElementById('mgbHeight').value = String(size);
    });
    document.getElementById('mgbDomainBrowse')?.addEventListener('click', () => {
      if (document.getElementById('mgbDomainBrowse')?.disabled) return;
      window.StudioTagTools?.openTagBrowser(null, (sel) => {
        const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
        if (!tag) return;
        document.getElementById('mgbDomainVariable').value = tag;
        scheduleModifyGroupMembershipLivePreview();
      });
    });
    for (const id of ['mgbBold', 'mgbItalic', 'mgbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleModifyGroupMembershipLivePreview();
      });
    }
    form.dataset.mgbWired = '1';
  }

  window.StudioModifyGroupMembershipButton = {
    initModifyGroupMembershipButtonDialog,
    presentModifyGroupMembershipButtonDialog,
    scheduleModifyGroupMembershipLivePreview,
    showModifyGroupMembershipButtonDialog,
    fillModifyGroupMembershipButtonForm,
    readModifyGroupMembershipButtonForm,
    switchModifyGroupMembershipButtonTab: switchTab,
    wireModifyGroupMembershipButtonTools,
    nextModifyGroupMembershipButtonName,
    defaultModifyGroupMembershipButtonComponent,
    applyModifyGroupMembershipButton
  };
})();
