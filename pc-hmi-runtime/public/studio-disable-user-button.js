/** Disable User Button property dialog — FactoryTalk View parity */
(function () {
  let dsuPreviewTimer = null;
  let dsuDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#disableUserButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.dsuTab === tabId);
    });
    document.querySelectorAll('#disableUserButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.dsuTabPanel === tabId);
    });
  }

  function dsuGetColor(id, fallback) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || fallback
      || '#001C38';
  }

  function dsuSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextDisableUserButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'DisableUserButton').length + 1;
    return `DisableUserButton${n}`;
  }


  function defaultDisableUserButtonComponent(overrides = {}) {
    return {
      type: 'DisableUserButton',
      name: 'DisableUserButton1',
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

  function scheduleDisableUserLivePreview() {
    if (window.state?.propsFormFill) return;
    if (dsuPreviewTimer) clearTimeout(dsuPreviewTimer);
    dsuPreviewTimer = setTimeout(() => {
      dsuPreviewTimer = null;
      if (!document.getElementById('disableUserButtonDialog')?.open) return;
      const comp = readDisableUserButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readDisableUserButtonForm, 'applyDisableUserButton');
    }, 80);
  }

  function syncDisableUserESignatureFields() {
    const on = Boolean(document.getElementById('dsuRequireESignature')?.checked);
    for (const id of ['dsuAllowBlankComment', 'dsuRequireReauth', 'dsuRequireCounterSig']) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
    const counter = on && Boolean(document.getElementById('dsuRequireCounterSig')?.checked);
    for (const id of [
      'dsuAuthorizedGroup', 'dsuDomainVisible', 'dsuDomainNameMode', 'dsuDomainVariableMode',
      'dsuDomainName', 'dsuDomainVariable', 'dsuDomainBrowse', 'dsuDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !counter;
    }
  }

  function syncDisableUserButtonFields() {
    const capColor = document.getElementById('dsuCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('dsuUseCaptionColor')?.checked;
    const capBack = document.getElementById('dsuCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('dsuUseCaptionBackColor')?.checked;
    const imgColor = document.getElementById('dsuImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('dsuUseImageColor')?.checked;
    const imgBack = document.getElementById('dsuImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('dsuUseImageBackColor')?.checked;
    syncDisableUserESignatureFields();
  }

  function wireDisableUserButtonTools() {
    const dlg = document.getElementById('disableUserButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('dsuPatternStyle', 'dsuFilled');
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    document.querySelectorAll('#disableUserButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.dsuPreviewWired === '1') return;
      input.dataset.dsuPreviewWired = '1';
      input.addEventListener('input', scheduleDisableUserLivePreview);
      input.addEventListener('change', scheduleDisableUserLivePreview);
    });
    syncDisableUserButtonFields();
  }

  function presentDisableUserButtonDialog() {
    const dialog = document.getElementById('disableUserButtonDialog');
    if (!dialog) {
      window.setStatus('Disable User Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    dsuDialogCommitted = false;
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
        window.setStatus(`Opened Disable User Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillDisableUserButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('dsuPatternStyle', 'dsuFilled');
      document.getElementById('dsuBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('dsuBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('dsuBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('dsuPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('dsuShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('dsuBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      dsuSetColor('dsuBackColor', comp.backColor || '#001C38');
      dsuSetColor('dsuBorderColor', comp.borderColor || '#001C38');
      dsuSetColor('dsuPatternColor', comp.patternColor || '#ffffff');
      dsuSetColor('dsuHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('dsuBlink').checked = Boolean(comp.blink);
      document.getElementById('dsuHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('dsuVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('dsuAudio').checked = comp.audio !== false;
      document.getElementById('dsuCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('dsuFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('dsuFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('dsuBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('dsuItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('dsuUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('dsuUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      dsuSetColor('dsuCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('dsuUseCaptionBackColor').checked = comp.useCaptionBackColor !== undefined
        ? Boolean(comp.useCaptionBackColor)
        : true;
      dsuSetColor('dsuCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('dsuCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('dsuWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('dsuCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#disableUserButtonForm input[name="dsuAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('dsuImage').value = comp.image || '';
      document.getElementById('dsuImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('dsuUseImageColor').checked = Boolean(comp.useImageColor);
      dsuSetColor('dsuImageColor', comp.imageColor || '#ffffff');
      document.getElementById('dsuUseImageBackColor').checked = comp.useImageBackColor !== undefined
        ? Boolean(comp.useImageBackColor)
        : true;
      dsuSetColor('dsuImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('dsuImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('dsuImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#disableUserButtonForm input[name="dsuImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('dsuRequireESignature').checked = Boolean(comp.requireESignature);
      document.getElementById('dsuAllowBlankComment').checked = Boolean(comp.allowBlankComment);
      document.getElementById('dsuRequireReauth').checked = Boolean(comp.requireReauth);
      document.getElementById('dsuRequireCounterSig').checked = Boolean(comp.requireCounterSig);
      document.getElementById('dsuAuthorizedGroup').value = comp.authorizedGroup || 'Administrators';
      document.getElementById('dsuDomainVisible').checked = Boolean(comp.domainVisible);
      const domainMode = comp.domainMode === 'variable' ? 'variable' : 'name';
      document.querySelectorAll('#disableUserButtonForm input[name="dsuDomainMode"]').forEach((el) => {
        el.checked = el.value === domainMode;
      });
      document.getElementById('dsuDomainName').value = comp.domainName || '';
      document.getElementById('dsuDomainVariable').value = comp.domainVariable || '';
      document.getElementById('dsuDomainDisable').checked = Boolean(comp.domainDisable);
      document.getElementById('dsuHeight').value = comp.height ?? 80;
      document.getElementById('dsuWidth').value = comp.width ?? 80;
      document.getElementById('dsuTop').value = comp.top ?? 16;
      document.getElementById('dsuLeft').value = comp.left ?? 16;
      document.getElementById('dsuName').value = comp.name || 'DisableUserButton1';
      document.getElementById('dsuVisible').checked = comp.visible !== false;
      syncDisableUserButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readDisableUserButtonForm() {
    const caption = document.getElementById('dsuCaption')?.value || '';
    const captionColor = dsuGetColor('dsuCaptionColor', '#ffffff');
    return {
      type: 'DisableUserButton',
      name: document.getElementById('dsuName')?.value.trim() || 'DisableUserButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('dsuLeft')?.value) || 0,
      top: Number(document.getElementById('dsuTop')?.value) || 0,
      width: Number(document.getElementById('dsuWidth')?.value) || 80,
      height: Number(document.getElementById('dsuHeight')?.value) || 80,
      visible: document.getElementById('dsuVisible')?.checked !== false,
      borderStyle: document.getElementById('dsuBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('dsuBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('dsuBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('dsuBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('dsuPatternStyle')?.value || 'none',
      shape: document.getElementById('dsuShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: dsuGetColor('dsuBackColor', '#001C38'),
      useBorderColor: true,
      borderColor: dsuGetColor('dsuBorderColor', '#001C38'),
      usePatternColor: true,
      patternColor: dsuGetColor('dsuPatternColor', '#ffffff'),
      useHighlightColor: true,
      highlightColor: dsuGetColor('dsuHighlightColor', '#0066cc'),
      blink: Boolean(document.getElementById('dsuBlink')?.checked),
      horizontalMargin: Number(document.getElementById('dsuHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('dsuVerticalMargin')?.value) || 0,
      audio: document.getElementById('dsuAudio')?.checked !== false,
      fontFamily: document.getElementById('dsuFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('dsuFontSize')?.value) || 10,
      bold: document.getElementById('dsuBold')?.classList.contains('active'),
      italic: document.getElementById('dsuItalic')?.classList.contains('active'),
      underline: document.getElementById('dsuUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('dsuUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('dsuUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('dsuUseCaptionBackColor')?.checked),
      captionBackColor: dsuGetColor('dsuCaptionBackColor', '#001C38'),
      captionBlink: Boolean(document.getElementById('dsuCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('dsuCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('dsuWordWrap')?.checked !== false,
      alignment: document.querySelector('#disableUserButtonForm input[name="dsuAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('dsuImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('dsuImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#disableUserButtonForm input[name="dsuImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('dsuUseImageColor')?.checked),
      imageColor: dsuGetColor('dsuImageColor', '#ffffff'),
      useImageBackColor: Boolean(document.getElementById('dsuUseImageBackColor')?.checked),
      imageBackColor: dsuGetColor('dsuImageBackColor', '#001C38'),
      imageBlink: Boolean(document.getElementById('dsuImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('dsuImageScaled')?.checked),
      requireESignature: Boolean(document.getElementById('dsuRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('dsuAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('dsuRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('dsuRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('dsuAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('dsuDomainVisible')?.checked),
      domainMode: document.querySelector('#disableUserButtonForm input[name="dsuDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('dsuDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('dsuDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('dsuDomainDisable')?.checked)
    };
  }

  async function showDisableUserButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Disable User Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initDisableUserButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultDisableUserButtonComponent({
        name: nextDisableUserButtonName(canvas?.components),
        ...overrides
      });
      fillDisableUserButtonForm(comp);
      window.resetPropsDialogState('disable-user', readDisableUserButtonForm, 'applyDisableUserButton');
      switchTab('general');
      wireDisableUserButtonTools();
      presentDisableUserButtonDialog();
      const previewComp = readDisableUserButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readDisableUserButtonForm, 'applyDisableUserButton');
    } catch (err) {
      window.setStatus(`Disable User Button properties error: ${err.message}`);
    }
  }

  async function applyDisableUserButton() {
    const comp = readDisableUserButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readDisableUserButtonForm, 'applyDisableUserButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveDisableUserButton(e) {
    e.preventDefault();
    const comp = readDisableUserButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    dsuDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('disableUserButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertDsuCaptionText(text) {
    const area = document.getElementById('dsuCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleDisableUserLivePreview();
  }

  function insertDsuCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertDsuCaptionText(tag);
    });
  }

  function hideDsuInsertVariableMenu() {
    document.getElementById('dsuInsertVariableMenu')?.classList.add('hidden');
  }

  function initDisableUserButtonDialog() {
    const form = document.getElementById('disableUserButtonForm');
    if (!form || form.dataset.dsuWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('dsuPatternStyle', 'dsuFilled');
    form.addEventListener('submit', (e) => saveDisableUserButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyDisableUserButton')?.addEventListener('click', () => {
      applyDisableUserButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleDisableUserLivePreview();
      window.flushPropsApplyButton?.(readDisableUserButtonForm, 'applyDisableUserButton');
    });
    form.addEventListener('change', () => {
      syncDisableUserButtonFields();
      scheduleDisableUserLivePreview();
      window.flushPropsApplyButton?.(readDisableUserButtonForm, 'applyDisableUserButton');
    });
    document.getElementById('cancelDisableUserButton')?.addEventListener('click', () => {
      if (!dsuDialogCommitted) window.revertPropsDialogPreview?.();
      dsuDialogCommitted = true;
      document.getElementById('disableUserButtonDialog')?.close();
    });
    document.getElementById('disableUserButtonDialog')?.addEventListener('close', () => {
      if (dsuPreviewTimer) {
        clearTimeout(dsuPreviewTimer);
        dsuPreviewTimer = null;
      }
      hideDsuInsertVariableMenu();
      if (!dsuDialogCommitted) window.revertPropsDialogPreview?.();
      dsuDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpDisableUserButton')?.addEventListener('click', () => {
      alert('Disable User Button opens a runtime prompt asking for a username, verifies that user exists, and disables it.');
    });
    document.querySelectorAll('#disableUserButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideDsuInsertVariableMenu();
        switchTab(tab.dataset.dsuTab);
      });
    });
    document.getElementById('dsuBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('dsuImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('dsuImage').value = fileName;
          scheduleDisableUserLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('dsuInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('dsuInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('dsuInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.dsuVar;
      if (!kind) return;
      hideDsuInsertVariableMenu();
      if (kind === 'timedate') insertDsuCaptionText('{#dt}');
      else insertDsuCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#disableUserButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideDsuInsertVariableMenu();
    });
    document.getElementById('dsuShape')?.addEventListener('change', () => {
      if (document.getElementById('dsuShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('dsuWidth')?.value) || 0;
      const h = Number(document.getElementById('dsuHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('dsuWidth').value = String(size);
      document.getElementById('dsuHeight').value = String(size);
    });
    document.getElementById('dsuDomainBrowse')?.addEventListener('click', () => {
      if (document.getElementById('dsuDomainBrowse')?.disabled) return;
      window.StudioTagTools?.openTagBrowser(null, (sel) => {
        const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
        if (!tag) return;
        document.getElementById('dsuDomainVariable').value = tag;
        scheduleDisableUserLivePreview();
      });
    });
    for (const id of ['dsuBold', 'dsuItalic', 'dsuUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleDisableUserLivePreview();
      });
    }
    form.dataset.dsuWired = '1';
  }

  window.StudioDisableUserButton = {
    initDisableUserButtonDialog,
    presentDisableUserButtonDialog,
    scheduleDisableUserLivePreview,
    showDisableUserButtonDialog,
    fillDisableUserButtonForm,
    readDisableUserButtonForm,
    switchDisableUserButtonTab: switchTab,
    wireDisableUserButtonTools,
    nextDisableUserButtonName,
    defaultDisableUserButtonComponent,
    applyDisableUserButton
  };
})();
