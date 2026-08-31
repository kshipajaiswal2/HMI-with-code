/** Add User/Group Button property dialog — FactoryTalk View parity */
(function () {
  let augPreviewTimer = null;
  let augDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#addUserGroupButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.augTab === tabId);
    });
    document.querySelectorAll('#addUserGroupButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.augTabPanel === tabId);
    });
  }

  function augGetColor(id, fallback) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || fallback
      || '#001C38';
  }

  function augSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextAddUserGroupButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'AddUserGroupButton').length + 1;
    return `AddUserGroupButton${n}`;
  }


  function defaultAddUserGroupButtonComponent(overrides = {}) {
    return {
      type: 'AddUserGroupButton',
      name: 'AddUserGroupButton1',
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

  function scheduleAddUserGroupLivePreview() {
    if (window.state?.propsFormFill) return;
    if (augPreviewTimer) clearTimeout(augPreviewTimer);
    augPreviewTimer = setTimeout(() => {
      augPreviewTimer = null;
      if (!document.getElementById('addUserGroupButtonDialog')?.open) return;
      const comp = readAddUserGroupButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readAddUserGroupButtonForm, 'applyAddUserGroupButton');
    }, 80);
  }

  function syncAddUserGroupESignatureFields() {
    const on = Boolean(document.getElementById('augRequireESignature')?.checked);
    for (const id of ['augAllowBlankComment', 'augRequireReauth', 'augRequireCounterSig']) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
    const counter = on && Boolean(document.getElementById('augRequireCounterSig')?.checked);
    for (const id of [
      'augAuthorizedGroup', 'augDomainVisible', 'augDomainNameMode', 'augDomainVariableMode',
      'augDomainName', 'augDomainVariable', 'augDomainBrowse', 'augDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !counter;
    }
  }

  function syncAddUserGroupButtonFields() {
    const capColor = document.getElementById('augCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('augUseCaptionColor')?.checked;
    const capBack = document.getElementById('augCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('augUseCaptionBackColor')?.checked;
    const imgColor = document.getElementById('augImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('augUseImageColor')?.checked;
    const imgBack = document.getElementById('augImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('augUseImageBackColor')?.checked;
    syncAddUserGroupESignatureFields();
  }

  function wireAddUserGroupButtonTools() {
    const dlg = document.getElementById('addUserGroupButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('augPatternStyle', 'augFilled');
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    document.querySelectorAll('#addUserGroupButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.augPreviewWired === '1') return;
      input.dataset.augPreviewWired = '1';
      input.addEventListener('input', scheduleAddUserGroupLivePreview);
      input.addEventListener('change', scheduleAddUserGroupLivePreview);
    });
    syncAddUserGroupButtonFields();
  }

  function presentAddUserGroupButtonDialog() {
    const dialog = document.getElementById('addUserGroupButtonDialog');
    if (!dialog) {
      window.setStatus('Add User/Group Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    augDialogCommitted = false;
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
        window.setStatus(`Opened Add User/Group Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillAddUserGroupButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('augPatternStyle', 'augFilled');
      document.getElementById('augBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('augBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('augBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('augPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('augShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('augBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      augSetColor('augBackColor', comp.backColor || '#001C38');
      augSetColor('augBorderColor', comp.borderColor || '#001C38');
      augSetColor('augPatternColor', comp.patternColor || '#ffffff');
      augSetColor('augHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('augBlink').checked = Boolean(comp.blink);
      document.getElementById('augHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('augVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('augAudio').checked = comp.audio !== false;
      document.getElementById('augCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('augFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('augFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('augBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('augItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('augUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('augUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      augSetColor('augCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('augUseCaptionBackColor').checked = comp.useCaptionBackColor !== undefined
        ? Boolean(comp.useCaptionBackColor)
        : true;
      augSetColor('augCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('augCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('augWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('augCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#addUserGroupButtonForm input[name="augAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('augImage').value = comp.image || '';
      document.getElementById('augImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('augUseImageColor').checked = Boolean(comp.useImageColor);
      augSetColor('augImageColor', comp.imageColor || '#ffffff');
      document.getElementById('augUseImageBackColor').checked = comp.useImageBackColor !== undefined
        ? Boolean(comp.useImageBackColor)
        : true;
      augSetColor('augImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('augImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('augImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#addUserGroupButtonForm input[name="augImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('augRequireESignature').checked = Boolean(comp.requireESignature);
      document.getElementById('augAllowBlankComment').checked = Boolean(comp.allowBlankComment);
      document.getElementById('augRequireReauth').checked = Boolean(comp.requireReauth);
      document.getElementById('augRequireCounterSig').checked = Boolean(comp.requireCounterSig);
      document.getElementById('augAuthorizedGroup').value = comp.authorizedGroup || 'Administrators';
      document.getElementById('augDomainVisible').checked = Boolean(comp.domainVisible);
      const domainMode = comp.domainMode === 'variable' ? 'variable' : 'name';
      document.querySelectorAll('#addUserGroupButtonForm input[name="augDomainMode"]').forEach((el) => {
        el.checked = el.value === domainMode;
      });
      document.getElementById('augDomainName').value = comp.domainName || '';
      document.getElementById('augDomainVariable').value = comp.domainVariable || '';
      document.getElementById('augDomainDisable').checked = Boolean(comp.domainDisable);
      document.getElementById('augHeight').value = comp.height ?? 80;
      document.getElementById('augWidth').value = comp.width ?? 80;
      document.getElementById('augTop').value = comp.top ?? 16;
      document.getElementById('augLeft').value = comp.left ?? 16;
      document.getElementById('augName').value = comp.name || 'AddUserGroupButton1';
      document.getElementById('augVisible').checked = comp.visible !== false;
      syncAddUserGroupButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readAddUserGroupButtonForm() {
    const caption = document.getElementById('augCaption')?.value || '';
    const captionColor = augGetColor('augCaptionColor', '#ffffff');
    return {
      type: 'AddUserGroupButton',
      name: document.getElementById('augName')?.value.trim() || 'AddUserGroupButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('augLeft')?.value) || 0,
      top: Number(document.getElementById('augTop')?.value) || 0,
      width: Number(document.getElementById('augWidth')?.value) || 80,
      height: Number(document.getElementById('augHeight')?.value) || 80,
      visible: document.getElementById('augVisible')?.checked !== false,
      borderStyle: document.getElementById('augBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('augBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('augBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('augBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('augPatternStyle')?.value || 'none',
      shape: document.getElementById('augShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: augGetColor('augBackColor', '#001C38'),
      useBorderColor: true,
      borderColor: augGetColor('augBorderColor', '#001C38'),
      usePatternColor: true,
      patternColor: augGetColor('augPatternColor', '#ffffff'),
      useHighlightColor: true,
      highlightColor: augGetColor('augHighlightColor', '#0066cc'),
      blink: Boolean(document.getElementById('augBlink')?.checked),
      horizontalMargin: Number(document.getElementById('augHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('augVerticalMargin')?.value) || 0,
      audio: document.getElementById('augAudio')?.checked !== false,
      fontFamily: document.getElementById('augFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('augFontSize')?.value) || 10,
      bold: document.getElementById('augBold')?.classList.contains('active'),
      italic: document.getElementById('augItalic')?.classList.contains('active'),
      underline: document.getElementById('augUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('augUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('augUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('augUseCaptionBackColor')?.checked),
      captionBackColor: augGetColor('augCaptionBackColor', '#001C38'),
      captionBlink: Boolean(document.getElementById('augCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('augCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('augWordWrap')?.checked !== false,
      alignment: document.querySelector('#addUserGroupButtonForm input[name="augAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('augImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('augImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#addUserGroupButtonForm input[name="augImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('augUseImageColor')?.checked),
      imageColor: augGetColor('augImageColor', '#ffffff'),
      useImageBackColor: Boolean(document.getElementById('augUseImageBackColor')?.checked),
      imageBackColor: augGetColor('augImageBackColor', '#001C38'),
      imageBlink: Boolean(document.getElementById('augImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('augImageScaled')?.checked),
      requireESignature: Boolean(document.getElementById('augRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('augAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('augRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('augRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('augAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('augDomainVisible')?.checked),
      domainMode: document.querySelector('#addUserGroupButtonForm input[name="augDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('augDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('augDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('augDomainDisable')?.checked)
    };
  }

  async function showAddUserGroupButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Add User/Group Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initAddUserGroupButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultAddUserGroupButtonComponent({
        name: nextAddUserGroupButtonName(canvas?.components),
        ...overrides
      });
      fillAddUserGroupButtonForm(comp);
      window.resetPropsDialogState('add-user-group', readAddUserGroupButtonForm, 'applyAddUserGroupButton');
      switchTab('general');
      wireAddUserGroupButtonTools();
      presentAddUserGroupButtonDialog();
      const previewComp = readAddUserGroupButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readAddUserGroupButtonForm, 'applyAddUserGroupButton');
    } catch (err) {
      window.setStatus(`Add User/Group Button properties error: ${err.message}`);
    }
  }

  async function applyAddUserGroupButton() {
    const comp = readAddUserGroupButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readAddUserGroupButtonForm, 'applyAddUserGroupButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveAddUserGroupButton(e) {
    e.preventDefault();
    const comp = readAddUserGroupButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    augDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('addUserGroupButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertAugCaptionText(text) {
    const area = document.getElementById('augCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleAddUserGroupLivePreview();
  }

  function insertAugCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertAugCaptionText(tag);
    });
  }

  function hideAugInsertVariableMenu() {
    document.getElementById('augInsertVariableMenu')?.classList.add('hidden');
  }

  function initAddUserGroupButtonDialog() {
    const form = document.getElementById('addUserGroupButtonForm');
    if (!form || form.dataset.augWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('augPatternStyle', 'augFilled');
    form.addEventListener('submit', (e) => saveAddUserGroupButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyAddUserGroupButton')?.addEventListener('click', () => {
      applyAddUserGroupButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleAddUserGroupLivePreview();
      window.flushPropsApplyButton?.(readAddUserGroupButtonForm, 'applyAddUserGroupButton');
    });
    form.addEventListener('change', () => {
      syncAddUserGroupButtonFields();
      scheduleAddUserGroupLivePreview();
      window.flushPropsApplyButton?.(readAddUserGroupButtonForm, 'applyAddUserGroupButton');
    });
    document.getElementById('cancelAddUserGroupButton')?.addEventListener('click', () => {
      if (!augDialogCommitted) window.revertPropsDialogPreview?.();
      augDialogCommitted = true;
      document.getElementById('addUserGroupButtonDialog')?.close();
    });
    document.getElementById('addUserGroupButtonDialog')?.addEventListener('close', () => {
      if (augPreviewTimer) {
        clearTimeout(augPreviewTimer);
        augPreviewTimer = null;
      }
      hideAugInsertVariableMenu();
      if (!augDialogCommitted) window.revertPropsDialogPreview?.();
      augDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpAddUserGroupButton')?.addEventListener('click', () => {
      alert('Add User/Group Button opens a runtime prompt to create a new operator user and assign it to a role/group.');
    });
    document.querySelectorAll('#addUserGroupButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideAugInsertVariableMenu();
        switchTab(tab.dataset.augTab);
      });
    });
    document.getElementById('augBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('augImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('augImage').value = fileName;
          scheduleAddUserGroupLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('augInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('augInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('augInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.augVar;
      if (!kind) return;
      hideAugInsertVariableMenu();
      if (kind === 'timedate') insertAugCaptionText('{#dt}');
      else insertAugCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#addUserGroupButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideAugInsertVariableMenu();
    });
    document.getElementById('augShape')?.addEventListener('change', () => {
      if (document.getElementById('augShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('augWidth')?.value) || 0;
      const h = Number(document.getElementById('augHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('augWidth').value = String(size);
      document.getElementById('augHeight').value = String(size);
    });
    document.getElementById('augDomainBrowse')?.addEventListener('click', () => {
      if (document.getElementById('augDomainBrowse')?.disabled) return;
      window.StudioTagTools?.openTagBrowser(null, (sel) => {
        const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
        if (!tag) return;
        document.getElementById('augDomainVariable').value = tag;
        scheduleAddUserGroupLivePreview();
      });
    });
    for (const id of ['augBold', 'augItalic', 'augUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleAddUserGroupLivePreview();
      });
    }
    form.dataset.augWired = '1';
  }

  window.StudioAddUserGroupButton = {
    initAddUserGroupButtonDialog,
    presentAddUserGroupButtonDialog,
    scheduleAddUserGroupLivePreview,
    showAddUserGroupButtonDialog,
    fillAddUserGroupButtonForm,
    readAddUserGroupButtonForm,
    switchAddUserGroupButtonTab: switchTab,
    wireAddUserGroupButtonTools,
    nextAddUserGroupButtonName,
    defaultAddUserGroupButtonComponent,
    applyAddUserGroupButton
  };
})();
