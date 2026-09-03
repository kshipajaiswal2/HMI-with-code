/** Password Button property dialog — FactoryTalk View parity */
(function () {
  let pwbPreviewTimer = null;
  let pwbDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#passwordButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.pwbTab === tabId);
    });
    document.querySelectorAll('#passwordButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.pwbTabPanel === tabId);
    });
  }

  function pwbGetColor(id, fallback) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || fallback
      || '#001C38';
  }

  function pwbSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextPasswordButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'PasswordButton').length + 1;
    return `PasswordButton${n}`;
  }


  function defaultPasswordButtonComponent(overrides = {}) {
    return {
      type: 'PasswordButton',
      name: 'PasswordButton1',
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

  function schedulePasswordLivePreview() {
    if (window.state?.propsFormFill) return;
    if (pwbPreviewTimer) clearTimeout(pwbPreviewTimer);
    pwbPreviewTimer = setTimeout(() => {
      pwbPreviewTimer = null;
      if (!document.getElementById('passwordButtonDialog')?.open) return;
      const comp = readPasswordButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readPasswordButtonForm, 'applyPasswordButton');
    }, 80);
  }

  function syncPasswordESignatureFields() {
    const on = Boolean(document.getElementById('pwbRequireESignature')?.checked);
    for (const id of ['pwbAllowBlankComment', 'pwbRequireReauth', 'pwbRequireCounterSig']) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
    const counter = on && Boolean(document.getElementById('pwbRequireCounterSig')?.checked);
    for (const id of [
      'pwbAuthorizedGroup', 'pwbDomainVisible', 'pwbDomainNameMode', 'pwbDomainVariableMode',
      'pwbDomainName', 'pwbDomainVariable', 'pwbDomainBrowse', 'pwbDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !counter;
    }
  }

  function syncPasswordButtonFields() {
    const capColor = document.getElementById('pwbCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('pwbUseCaptionColor')?.checked;
    const capBack = document.getElementById('pwbCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('pwbUseCaptionBackColor')?.checked;
    const imgColor = document.getElementById('pwbImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('pwbUseImageColor')?.checked;
    const imgBack = document.getElementById('pwbImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('pwbUseImageBackColor')?.checked;
    syncPasswordESignatureFields();
  }

  function wirePasswordButtonTools() {
    const dlg = document.getElementById('passwordButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('pwbPatternStyle', 'pwbFilled');
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    document.querySelectorAll('#passwordButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.pwbPreviewWired === '1') return;
      input.dataset.pwbPreviewWired = '1';
      input.addEventListener('input', schedulePasswordLivePreview);
      input.addEventListener('change', schedulePasswordLivePreview);
    });
    syncPasswordButtonFields();
  }

  function presentPasswordButtonDialog() {
    const dialog = document.getElementById('passwordButtonDialog');
    if (!dialog) {
      window.setStatus('Password Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    pwbDialogCommitted = false;
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
        window.setStatus(`Opened Password Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillPasswordButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('pwbPatternStyle', 'pwbFilled');
      document.getElementById('pwbBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('pwbBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('pwbBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('pwbPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('pwbShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('pwbBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      pwbSetColor('pwbBackColor', comp.backColor || '#001C38');
      pwbSetColor('pwbBorderColor', comp.borderColor || '#001C38');
      pwbSetColor('pwbPatternColor', comp.patternColor || '#ffffff');
      pwbSetColor('pwbHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('pwbBlink').checked = Boolean(comp.blink);
      document.getElementById('pwbHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('pwbVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('pwbAudio').checked = comp.audio !== false;
      document.getElementById('pwbCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('pwbFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('pwbFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('pwbBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('pwbItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('pwbUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('pwbUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      pwbSetColor('pwbCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('pwbUseCaptionBackColor').checked = comp.useCaptionBackColor !== undefined
        ? Boolean(comp.useCaptionBackColor)
        : true;
      pwbSetColor('pwbCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('pwbCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('pwbWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('pwbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#passwordButtonForm input[name="pwbAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('pwbImage').value = comp.image || '';
      document.getElementById('pwbImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('pwbUseImageColor').checked = Boolean(comp.useImageColor);
      pwbSetColor('pwbImageColor', comp.imageColor || '#ffffff');
      document.getElementById('pwbUseImageBackColor').checked = comp.useImageBackColor !== undefined
        ? Boolean(comp.useImageBackColor)
        : true;
      pwbSetColor('pwbImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('pwbImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('pwbImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#passwordButtonForm input[name="pwbImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('pwbRequireESignature').checked = Boolean(comp.requireESignature);
      document.getElementById('pwbAllowBlankComment').checked = Boolean(comp.allowBlankComment);
      document.getElementById('pwbRequireReauth').checked = Boolean(comp.requireReauth);
      document.getElementById('pwbRequireCounterSig').checked = Boolean(comp.requireCounterSig);
      document.getElementById('pwbAuthorizedGroup').value = comp.authorizedGroup || 'Administrators';
      document.getElementById('pwbDomainVisible').checked = Boolean(comp.domainVisible);
      const domainMode = comp.domainMode === 'variable' ? 'variable' : 'name';
      document.querySelectorAll('#passwordButtonForm input[name="pwbDomainMode"]').forEach((el) => {
        el.checked = el.value === domainMode;
      });
      document.getElementById('pwbDomainName').value = comp.domainName || '';
      document.getElementById('pwbDomainVariable').value = comp.domainVariable || '';
      document.getElementById('pwbDomainDisable').checked = Boolean(comp.domainDisable);
      document.getElementById('pwbHeight').value = comp.height ?? 80;
      document.getElementById('pwbWidth').value = comp.width ?? 80;
      document.getElementById('pwbTop').value = comp.top ?? 16;
      document.getElementById('pwbLeft').value = comp.left ?? 16;
      document.getElementById('pwbName').value = comp.name || 'PasswordButton1';
      document.getElementById('pwbVisible').checked = comp.visible !== false;
      syncPasswordButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readPasswordButtonForm() {
    const caption = document.getElementById('pwbCaption')?.value || '';
    const captionColor = pwbGetColor('pwbCaptionColor', '#ffffff');
    return {
      type: 'PasswordButton',
      name: document.getElementById('pwbName')?.value.trim() || 'PasswordButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('pwbLeft')?.value) || 0,
      top: Number(document.getElementById('pwbTop')?.value) || 0,
      width: Number(document.getElementById('pwbWidth')?.value) || 80,
      height: Number(document.getElementById('pwbHeight')?.value) || 80,
      visible: document.getElementById('pwbVisible')?.checked !== false,
      borderStyle: document.getElementById('pwbBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('pwbBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('pwbBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('pwbBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('pwbPatternStyle')?.value || 'none',
      shape: document.getElementById('pwbShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: pwbGetColor('pwbBackColor', '#001C38'),
      useBorderColor: true,
      borderColor: pwbGetColor('pwbBorderColor', '#001C38'),
      usePatternColor: true,
      patternColor: pwbGetColor('pwbPatternColor', '#ffffff'),
      useHighlightColor: true,
      highlightColor: pwbGetColor('pwbHighlightColor', '#0066cc'),
      blink: Boolean(document.getElementById('pwbBlink')?.checked),
      horizontalMargin: Number(document.getElementById('pwbHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('pwbVerticalMargin')?.value) || 0,
      audio: document.getElementById('pwbAudio')?.checked !== false,
      fontFamily: document.getElementById('pwbFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('pwbFontSize')?.value) || 10,
      bold: document.getElementById('pwbBold')?.classList.contains('active'),
      italic: document.getElementById('pwbItalic')?.classList.contains('active'),
      underline: document.getElementById('pwbUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('pwbUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('pwbUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('pwbUseCaptionBackColor')?.checked),
      captionBackColor: pwbGetColor('pwbCaptionBackColor', '#001C38'),
      captionBlink: Boolean(document.getElementById('pwbCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('pwbCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('pwbWordWrap')?.checked !== false,
      alignment: document.querySelector('#passwordButtonForm input[name="pwbAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('pwbImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('pwbImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#passwordButtonForm input[name="pwbImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('pwbUseImageColor')?.checked),
      imageColor: pwbGetColor('pwbImageColor', '#ffffff'),
      useImageBackColor: Boolean(document.getElementById('pwbUseImageBackColor')?.checked),
      imageBackColor: pwbGetColor('pwbImageBackColor', '#001C38'),
      imageBlink: Boolean(document.getElementById('pwbImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('pwbImageScaled')?.checked),
      requireESignature: Boolean(document.getElementById('pwbRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('pwbAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('pwbRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('pwbRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('pwbAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('pwbDomainVisible')?.checked),
      domainMode: document.querySelector('#passwordButtonForm input[name="pwbDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('pwbDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('pwbDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('pwbDomainDisable')?.checked)
    };
  }

  async function showPasswordButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Password Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initPasswordButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultPasswordButtonComponent({
        name: nextPasswordButtonName(canvas?.components),
        ...overrides
      });
      fillPasswordButtonForm(comp);
      window.resetPropsDialogState('change-password', readPasswordButtonForm, 'applyPasswordButton');
      switchTab('general');
      wirePasswordButtonTools();
      presentPasswordButtonDialog();
      const previewComp = readPasswordButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readPasswordButtonForm, 'applyPasswordButton');
    } catch (err) {
      window.setStatus(`Password Button properties error: ${err.message}`);
    }
  }

  async function applyPasswordButton() {
    const comp = readPasswordButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readPasswordButtonForm, 'applyPasswordButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function savePasswordButton(e) {
    e.preventDefault();
    const comp = readPasswordButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    pwbDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('passwordButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertPwbCaptionText(text) {
    const area = document.getElementById('pwbCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    schedulePasswordLivePreview();
  }

  function insertPwbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertPwbCaptionText(tag);
    });
  }

  function hidePwbInsertVariableMenu() {
    document.getElementById('pwbInsertVariableMenu')?.classList.add('hidden');
  }

  function initPasswordButtonDialog() {
    const form = document.getElementById('passwordButtonForm');
    if (!form || form.dataset.pwbWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('pwbPatternStyle', 'pwbFilled');
    form.addEventListener('submit', (e) => savePasswordButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyPasswordButton')?.addEventListener('click', () => {
      applyPasswordButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      schedulePasswordLivePreview();
      window.flushPropsApplyButton?.(readPasswordButtonForm, 'applyPasswordButton');
    });
    form.addEventListener('change', () => {
      syncPasswordButtonFields();
      schedulePasswordLivePreview();
      window.flushPropsApplyButton?.(readPasswordButtonForm, 'applyPasswordButton');
    });
    document.getElementById('cancelPasswordButton')?.addEventListener('click', () => {
      if (!pwbDialogCommitted) window.revertPropsDialogPreview?.();
      pwbDialogCommitted = true;
      document.getElementById('passwordButtonDialog')?.close();
    });
    document.getElementById('passwordButtonDialog')?.addEventListener('close', () => {
      if (pwbPreviewTimer) {
        clearTimeout(pwbPreviewTimer);
        pwbPreviewTimer = null;
      }
      hidePwbInsertVariableMenu();
      if (!pwbDialogCommitted) window.revertPropsDialogPreview?.();
      pwbDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpPasswordButton')?.addEventListener('click', () => {
      alert('Password Button opens a runtime prompt asking for a username and new password, verifies that user exists, and changes its password.');
    });
    document.querySelectorAll('#passwordButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hidePwbInsertVariableMenu();
        switchTab(tab.dataset.pwbTab);
      });
    });
    document.getElementById('pwbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('pwbImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('pwbImage').value = fileName;
          schedulePasswordLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('pwbInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('pwbInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('pwbInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.pwbVar;
      if (!kind) return;
      hidePwbInsertVariableMenu();
      if (kind === 'timedate') insertPwbCaptionText('{#dt}');
      else insertPwbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#passwordButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hidePwbInsertVariableMenu();
    });
    document.getElementById('pwbShape')?.addEventListener('change', () => {
      if (document.getElementById('pwbShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('pwbWidth')?.value) || 0;
      const h = Number(document.getElementById('pwbHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('pwbWidth').value = String(size);
      document.getElementById('pwbHeight').value = String(size);
    });
    document.getElementById('pwbDomainBrowse')?.addEventListener('click', () => {
      if (document.getElementById('pwbDomainBrowse')?.disabled) return;
      window.StudioTagTools?.openTagBrowser(null, (sel) => {
        const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
        if (!tag) return;
        document.getElementById('pwbDomainVariable').value = tag;
        schedulePasswordLivePreview();
      });
    });
    for (const id of ['pwbBold', 'pwbItalic', 'pwbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        schedulePasswordLivePreview();
      });
    }
    form.dataset.pwbWired = '1';
  }

  window.StudioPasswordButton = {
    initPasswordButtonDialog,
    presentPasswordButtonDialog,
    schedulePasswordLivePreview,
    showPasswordButtonDialog,
    fillPasswordButtonForm,
    readPasswordButtonForm,
    switchPasswordButtonTab: switchTab,
    wirePasswordButtonTools,
    nextPasswordButtonName,
    defaultPasswordButtonComponent,
    applyPasswordButton
  };
})();
