/** Enable User Button property dialog — FactoryTalk View parity */
(function () {
  let enuPreviewTimer = null;
  let enuDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#enableUserButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.enuTab === tabId);
    });
    document.querySelectorAll('#enableUserButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.enuTabPanel === tabId);
    });
  }

  function enuGetColor(id, fallback) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || fallback
      || '#001C38';
  }

  function enuSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextEnableUserButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'EnableUserButton').length + 1;
    return `EnableUserButton${n}`;
  }


  function defaultEnableUserButtonComponent(overrides = {}) {
    return {
      type: 'EnableUserButton',
      name: 'EnableUserButton1',
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

  function scheduleEnableUserLivePreview() {
    if (window.state?.propsFormFill) return;
    if (enuPreviewTimer) clearTimeout(enuPreviewTimer);
    enuPreviewTimer = setTimeout(() => {
      enuPreviewTimer = null;
      if (!document.getElementById('enableUserButtonDialog')?.open) return;
      const comp = readEnableUserButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readEnableUserButtonForm, 'applyEnableUserButton');
    }, 80);
  }

  function syncEnableUserESignatureFields() {
    const on = Boolean(document.getElementById('enuRequireESignature')?.checked);
    for (const id of ['enuAllowBlankComment', 'enuRequireReauth', 'enuRequireCounterSig']) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
    const counter = on && Boolean(document.getElementById('enuRequireCounterSig')?.checked);
    for (const id of [
      'enuAuthorizedGroup', 'enuDomainVisible', 'enuDomainNameMode', 'enuDomainVariableMode',
      'enuDomainName', 'enuDomainVariable', 'enuDomainBrowse', 'enuDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !counter;
    }
  }

  function syncEnableUserButtonFields() {
    const capColor = document.getElementById('enuCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('enuUseCaptionColor')?.checked;
    const capBack = document.getElementById('enuCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('enuUseCaptionBackColor')?.checked;
    const imgColor = document.getElementById('enuImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('enuUseImageColor')?.checked;
    const imgBack = document.getElementById('enuImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('enuUseImageBackColor')?.checked;
    syncEnableUserESignatureFields();
  }

  function wireEnableUserButtonTools() {
    const dlg = document.getElementById('enableUserButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('enuPatternStyle', 'enuFilled');
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    document.querySelectorAll('#enableUserButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.enuPreviewWired === '1') return;
      input.dataset.enuPreviewWired = '1';
      input.addEventListener('input', scheduleEnableUserLivePreview);
      input.addEventListener('change', scheduleEnableUserLivePreview);
    });
    syncEnableUserButtonFields();
  }

  function presentEnableUserButtonDialog() {
    const dialog = document.getElementById('enableUserButtonDialog');
    if (!dialog) {
      window.setStatus('Enable User Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    enuDialogCommitted = false;
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
        window.setStatus(`Opened Enable User Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillEnableUserButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('enuPatternStyle', 'enuFilled');
      document.getElementById('enuBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('enuBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('enuBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('enuPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('enuShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('enuBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      enuSetColor('enuBackColor', comp.backColor || '#001C38');
      enuSetColor('enuBorderColor', comp.borderColor || '#001C38');
      enuSetColor('enuPatternColor', comp.patternColor || '#ffffff');
      enuSetColor('enuHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('enuBlink').checked = Boolean(comp.blink);
      document.getElementById('enuHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('enuVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('enuAudio').checked = comp.audio !== false;
      document.getElementById('enuCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('enuFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('enuFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('enuBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('enuItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('enuUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('enuUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      enuSetColor('enuCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('enuUseCaptionBackColor').checked = comp.useCaptionBackColor !== undefined
        ? Boolean(comp.useCaptionBackColor)
        : true;
      enuSetColor('enuCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('enuCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('enuWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('enuCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#enableUserButtonForm input[name="enuAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('enuImage').value = comp.image || '';
      document.getElementById('enuImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('enuUseImageColor').checked = Boolean(comp.useImageColor);
      enuSetColor('enuImageColor', comp.imageColor || '#ffffff');
      document.getElementById('enuUseImageBackColor').checked = comp.useImageBackColor !== undefined
        ? Boolean(comp.useImageBackColor)
        : true;
      enuSetColor('enuImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('enuImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('enuImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#enableUserButtonForm input[name="enuImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('enuRequireESignature').checked = Boolean(comp.requireESignature);
      document.getElementById('enuAllowBlankComment').checked = Boolean(comp.allowBlankComment);
      document.getElementById('enuRequireReauth').checked = Boolean(comp.requireReauth);
      document.getElementById('enuRequireCounterSig').checked = Boolean(comp.requireCounterSig);
      document.getElementById('enuAuthorizedGroup').value = comp.authorizedGroup || 'Administrators';
      document.getElementById('enuDomainVisible').checked = Boolean(comp.domainVisible);
      const domainMode = comp.domainMode === 'variable' ? 'variable' : 'name';
      document.querySelectorAll('#enableUserButtonForm input[name="enuDomainMode"]').forEach((el) => {
        el.checked = el.value === domainMode;
      });
      document.getElementById('enuDomainName').value = comp.domainName || '';
      document.getElementById('enuDomainVariable').value = comp.domainVariable || '';
      document.getElementById('enuDomainDisable').checked = Boolean(comp.domainDisable);
      document.getElementById('enuHeight').value = comp.height ?? 80;
      document.getElementById('enuWidth').value = comp.width ?? 80;
      document.getElementById('enuTop').value = comp.top ?? 16;
      document.getElementById('enuLeft').value = comp.left ?? 16;
      document.getElementById('enuName').value = comp.name || 'EnableUserButton1';
      document.getElementById('enuVisible').checked = comp.visible !== false;
      syncEnableUserButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readEnableUserButtonForm() {
    const caption = document.getElementById('enuCaption')?.value || '';
    const captionColor = enuGetColor('enuCaptionColor', '#ffffff');
    return {
      type: 'EnableUserButton',
      name: document.getElementById('enuName')?.value.trim() || 'EnableUserButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('enuLeft')?.value) || 0,
      top: Number(document.getElementById('enuTop')?.value) || 0,
      width: Number(document.getElementById('enuWidth')?.value) || 80,
      height: Number(document.getElementById('enuHeight')?.value) || 80,
      visible: document.getElementById('enuVisible')?.checked !== false,
      borderStyle: document.getElementById('enuBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('enuBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('enuBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('enuBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('enuPatternStyle')?.value || 'none',
      shape: document.getElementById('enuShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: enuGetColor('enuBackColor', '#001C38'),
      useBorderColor: true,
      borderColor: enuGetColor('enuBorderColor', '#001C38'),
      usePatternColor: true,
      patternColor: enuGetColor('enuPatternColor', '#ffffff'),
      useHighlightColor: true,
      highlightColor: enuGetColor('enuHighlightColor', '#0066cc'),
      blink: Boolean(document.getElementById('enuBlink')?.checked),
      horizontalMargin: Number(document.getElementById('enuHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('enuVerticalMargin')?.value) || 0,
      audio: document.getElementById('enuAudio')?.checked !== false,
      fontFamily: document.getElementById('enuFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('enuFontSize')?.value) || 10,
      bold: document.getElementById('enuBold')?.classList.contains('active'),
      italic: document.getElementById('enuItalic')?.classList.contains('active'),
      underline: document.getElementById('enuUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('enuUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('enuUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('enuUseCaptionBackColor')?.checked),
      captionBackColor: enuGetColor('enuCaptionBackColor', '#001C38'),
      captionBlink: Boolean(document.getElementById('enuCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('enuCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('enuWordWrap')?.checked !== false,
      alignment: document.querySelector('#enableUserButtonForm input[name="enuAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('enuImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('enuImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#enableUserButtonForm input[name="enuImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('enuUseImageColor')?.checked),
      imageColor: enuGetColor('enuImageColor', '#ffffff'),
      useImageBackColor: Boolean(document.getElementById('enuUseImageBackColor')?.checked),
      imageBackColor: enuGetColor('enuImageBackColor', '#001C38'),
      imageBlink: Boolean(document.getElementById('enuImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('enuImageScaled')?.checked),
      requireESignature: Boolean(document.getElementById('enuRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('enuAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('enuRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('enuRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('enuAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('enuDomainVisible')?.checked),
      domainMode: document.querySelector('#enableUserButtonForm input[name="enuDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('enuDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('enuDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('enuDomainDisable')?.checked)
    };
  }

  async function showEnableUserButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Enable User Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initEnableUserButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultEnableUserButtonComponent({
        name: nextEnableUserButtonName(canvas?.components),
        ...overrides
      });
      fillEnableUserButtonForm(comp);
      window.resetPropsDialogState('enable-user', readEnableUserButtonForm, 'applyEnableUserButton');
      switchTab('general');
      wireEnableUserButtonTools();
      presentEnableUserButtonDialog();
      const previewComp = readEnableUserButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readEnableUserButtonForm, 'applyEnableUserButton');
    } catch (err) {
      window.setStatus(`Enable User Button properties error: ${err.message}`);
    }
  }

  async function applyEnableUserButton() {
    const comp = readEnableUserButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readEnableUserButtonForm, 'applyEnableUserButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveEnableUserButton(e) {
    e.preventDefault();
    const comp = readEnableUserButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    enuDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('enableUserButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertEnuCaptionText(text) {
    const area = document.getElementById('enuCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleEnableUserLivePreview();
  }

  function insertEnuCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertEnuCaptionText(tag);
    });
  }

  function hideEnuInsertVariableMenu() {
    document.getElementById('enuInsertVariableMenu')?.classList.add('hidden');
  }

  function initEnableUserButtonDialog() {
    const form = document.getElementById('enableUserButtonForm');
    if (!form || form.dataset.enuWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('enuPatternStyle', 'enuFilled');
    form.addEventListener('submit', (e) => saveEnableUserButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyEnableUserButton')?.addEventListener('click', () => {
      applyEnableUserButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleEnableUserLivePreview();
      window.flushPropsApplyButton?.(readEnableUserButtonForm, 'applyEnableUserButton');
    });
    form.addEventListener('change', () => {
      syncEnableUserButtonFields();
      scheduleEnableUserLivePreview();
      window.flushPropsApplyButton?.(readEnableUserButtonForm, 'applyEnableUserButton');
    });
    document.getElementById('cancelEnableUserButton')?.addEventListener('click', () => {
      if (!enuDialogCommitted) window.revertPropsDialogPreview?.();
      enuDialogCommitted = true;
      document.getElementById('enableUserButtonDialog')?.close();
    });
    document.getElementById('enableUserButtonDialog')?.addEventListener('close', () => {
      if (enuPreviewTimer) {
        clearTimeout(enuPreviewTimer);
        enuPreviewTimer = null;
      }
      hideEnuInsertVariableMenu();
      if (!enuDialogCommitted) window.revertPropsDialogPreview?.();
      enuDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpEnableUserButton')?.addEventListener('click', () => {
      alert('Enable User Button opens a runtime prompt asking for a username, verifies that user exists, and enables it.');
    });
    document.querySelectorAll('#enableUserButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideEnuInsertVariableMenu();
        switchTab(tab.dataset.enuTab);
      });
    });
    document.getElementById('enuBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('enuImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('enuImage').value = fileName;
          scheduleEnableUserLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('enuInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('enuInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('enuInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.enuVar;
      if (!kind) return;
      hideEnuInsertVariableMenu();
      if (kind === 'timedate') insertEnuCaptionText('{#dt}');
      else insertEnuCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#enableUserButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideEnuInsertVariableMenu();
    });
    document.getElementById('enuShape')?.addEventListener('change', () => {
      if (document.getElementById('enuShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('enuWidth')?.value) || 0;
      const h = Number(document.getElementById('enuHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('enuWidth').value = String(size);
      document.getElementById('enuHeight').value = String(size);
    });
    document.getElementById('enuDomainBrowse')?.addEventListener('click', () => {
      if (document.getElementById('enuDomainBrowse')?.disabled) return;
      window.StudioTagTools?.openTagBrowser(null, (sel) => {
        const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
        if (!tag) return;
        document.getElementById('enuDomainVariable').value = tag;
        scheduleEnableUserLivePreview();
      });
    });
    for (const id of ['enuBold', 'enuItalic', 'enuUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleEnableUserLivePreview();
      });
    }
    form.dataset.enuWired = '1';
  }

  window.StudioEnableUserButton = {
    initEnableUserButtonDialog,
    presentEnableUserButtonDialog,
    scheduleEnableUserLivePreview,
    showEnableUserButtonDialog,
    fillEnableUserButtonForm,
    readEnableUserButtonForm,
    switchEnableUserButtonTab: switchTab,
    wireEnableUserButtonTools,
    nextEnableUserButtonName,
    defaultEnableUserButtonComponent,
    applyEnableUserButton
  };
})();
