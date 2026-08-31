/** RecipePlus Button property dialog — FactoryTalk View parity */
(function () {
  let rpbPreviewTimer = null;
  let rpbDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#recipePlusButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.rpbTab === tabId);
    });
    document.querySelectorAll('#recipePlusButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.rpbTabPanel === tabId);
    });
  }

  function rpbGetColor(id, fallback) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || fallback
      || '#001C38';
  }

  function rpbSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextRecipePlusButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'RecipePlusButton').length + 1;
    return `RecipePlusButton${n}`;
  }

  function normalizeAction(action) {
    if (action === 'create') return 'uploadAndCreate';
    if (action === 'select') return 'download';
    return action || 'download';
  }

  function defaultRecipePlusButtonComponent(overrides = {}) {
    return {
      type: 'RecipePlusButton',
      name: 'RecipePlusButton1',
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
      action: 'download',
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

  function scheduleRecipePlusLivePreview() {
    if (window.state?.propsFormFill) return;
    if (rpbPreviewTimer) clearTimeout(rpbPreviewTimer);
    rpbPreviewTimer = setTimeout(() => {
      rpbPreviewTimer = null;
      if (!document.getElementById('recipePlusButtonDialog')?.open) return;
      const comp = readRecipePlusButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readRecipePlusButtonForm, 'applyRecipePlusButton');
    }, 80);
  }

  function syncRecipePlusESignatureFields() {
    const on = Boolean(document.getElementById('rpbRequireESignature')?.checked);
    for (const id of ['rpbAllowBlankComment', 'rpbRequireReauth', 'rpbRequireCounterSig']) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
    const counter = on && Boolean(document.getElementById('rpbRequireCounterSig')?.checked);
    for (const id of [
      'rpbAuthorizedGroup', 'rpbDomainVisible', 'rpbDomainNameMode', 'rpbDomainVariableMode',
      'rpbDomainName', 'rpbDomainVariable', 'rpbDomainBrowse', 'rpbDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !counter;
    }
  }

  function syncRecipePlusButtonFields() {
    const capColor = document.getElementById('rpbCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('rpbUseCaptionColor')?.checked;
    const capBack = document.getElementById('rpbCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('rpbUseCaptionBackColor')?.checked;
    const imgColor = document.getElementById('rpbImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('rpbUseImageColor')?.checked;
    const imgBack = document.getElementById('rpbImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('rpbUseImageBackColor')?.checked;
    syncRecipePlusESignatureFields();
  }

  function wireRecipePlusButtonTools() {
    const dlg = document.getElementById('recipePlusButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('rpbPatternStyle', 'rpbFilled');
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    document.querySelectorAll('#recipePlusButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.rpbPreviewWired === '1') return;
      input.dataset.rpbPreviewWired = '1';
      input.addEventListener('input', scheduleRecipePlusLivePreview);
      input.addEventListener('change', scheduleRecipePlusLivePreview);
    });
    syncRecipePlusButtonFields();
  }

  function presentRecipePlusButtonDialog() {
    const dialog = document.getElementById('recipePlusButtonDialog');
    if (!dialog) {
      window.setStatus('RecipePlus Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    rpbDialogCommitted = false;
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
        window.setStatus(`Opened RecipePlus Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillRecipePlusButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('rpbPatternStyle', 'rpbFilled');
      document.getElementById('rpbBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('rpbBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('rpbBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('rpbPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('rpbShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('rpbBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      rpbSetColor('rpbBackColor', comp.backColor || '#001C38');
      rpbSetColor('rpbBorderColor', comp.borderColor || '#001C38');
      rpbSetColor('rpbPatternColor', comp.patternColor || '#ffffff');
      rpbSetColor('rpbHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('rpbBlink').checked = Boolean(comp.blink);
      document.getElementById('rpbAction').value = normalizeAction(comp.action);
      document.getElementById('rpbHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('rpbVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('rpbAudio').checked = comp.audio !== false;
      document.getElementById('rpbCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('rpbFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('rpbFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('rpbBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('rpbItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('rpbUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('rpbUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      rpbSetColor('rpbCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('rpbUseCaptionBackColor').checked = comp.useCaptionBackColor !== undefined
        ? Boolean(comp.useCaptionBackColor)
        : true;
      rpbSetColor('rpbCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('rpbCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('rpbWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('rpbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#recipePlusButtonForm input[name="rpbAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('rpbImage').value = comp.image || '';
      document.getElementById('rpbImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('rpbUseImageColor').checked = Boolean(comp.useImageColor);
      rpbSetColor('rpbImageColor', comp.imageColor || '#ffffff');
      document.getElementById('rpbUseImageBackColor').checked = comp.useImageBackColor !== undefined
        ? Boolean(comp.useImageBackColor)
        : true;
      rpbSetColor('rpbImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('rpbImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('rpbImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#recipePlusButtonForm input[name="rpbImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('rpbRequireESignature').checked = Boolean(comp.requireESignature);
      document.getElementById('rpbAllowBlankComment').checked = Boolean(comp.allowBlankComment);
      document.getElementById('rpbRequireReauth').checked = Boolean(comp.requireReauth);
      document.getElementById('rpbRequireCounterSig').checked = Boolean(comp.requireCounterSig);
      document.getElementById('rpbAuthorizedGroup').value = comp.authorizedGroup || 'Administrators';
      document.getElementById('rpbDomainVisible').checked = Boolean(comp.domainVisible);
      const domainMode = comp.domainMode === 'variable' ? 'variable' : 'name';
      document.querySelectorAll('#recipePlusButtonForm input[name="rpbDomainMode"]').forEach((el) => {
        el.checked = el.value === domainMode;
      });
      document.getElementById('rpbDomainName').value = comp.domainName || '';
      document.getElementById('rpbDomainVariable').value = comp.domainVariable || '';
      document.getElementById('rpbDomainDisable').checked = Boolean(comp.domainDisable);
      document.getElementById('rpbHeight').value = comp.height ?? 80;
      document.getElementById('rpbWidth').value = comp.width ?? 80;
      document.getElementById('rpbTop').value = comp.top ?? 16;
      document.getElementById('rpbLeft').value = comp.left ?? 16;
      document.getElementById('rpbName').value = comp.name || 'RecipePlusButton1';
      document.getElementById('rpbVisible').checked = comp.visible !== false;
      syncRecipePlusButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readRecipePlusButtonForm() {
    const caption = document.getElementById('rpbCaption')?.value || '';
    const captionColor = rpbGetColor('rpbCaptionColor', '#ffffff');
    return {
      type: 'RecipePlusButton',
      name: document.getElementById('rpbName')?.value.trim() || 'RecipePlusButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('rpbLeft')?.value) || 0,
      top: Number(document.getElementById('rpbTop')?.value) || 0,
      width: Number(document.getElementById('rpbWidth')?.value) || 80,
      height: Number(document.getElementById('rpbHeight')?.value) || 80,
      visible: document.getElementById('rpbVisible')?.checked !== false,
      borderStyle: document.getElementById('rpbBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('rpbBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('rpbBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('rpbBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('rpbPatternStyle')?.value || 'none',
      shape: document.getElementById('rpbShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: rpbGetColor('rpbBackColor', '#001C38'),
      useBorderColor: true,
      borderColor: rpbGetColor('rpbBorderColor', '#001C38'),
      usePatternColor: true,
      patternColor: rpbGetColor('rpbPatternColor', '#ffffff'),
      useHighlightColor: true,
      highlightColor: rpbGetColor('rpbHighlightColor', '#0066cc'),
      blink: Boolean(document.getElementById('rpbBlink')?.checked),
      action: document.getElementById('rpbAction')?.value || 'download',
      horizontalMargin: Number(document.getElementById('rpbHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('rpbVerticalMargin')?.value) || 0,
      audio: document.getElementById('rpbAudio')?.checked !== false,
      fontFamily: document.getElementById('rpbFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('rpbFontSize')?.value) || 10,
      bold: document.getElementById('rpbBold')?.classList.contains('active'),
      italic: document.getElementById('rpbItalic')?.classList.contains('active'),
      underline: document.getElementById('rpbUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('rpbUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('rpbUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('rpbUseCaptionBackColor')?.checked),
      captionBackColor: rpbGetColor('rpbCaptionBackColor', '#001C38'),
      captionBlink: Boolean(document.getElementById('rpbCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('rpbCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('rpbWordWrap')?.checked !== false,
      alignment: document.querySelector('#recipePlusButtonForm input[name="rpbAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('rpbImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('rpbImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#recipePlusButtonForm input[name="rpbImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('rpbUseImageColor')?.checked),
      imageColor: rpbGetColor('rpbImageColor', '#ffffff'),
      useImageBackColor: Boolean(document.getElementById('rpbUseImageBackColor')?.checked),
      imageBackColor: rpbGetColor('rpbImageBackColor', '#001C38'),
      imageBlink: Boolean(document.getElementById('rpbImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('rpbImageScaled')?.checked),
      requireESignature: Boolean(document.getElementById('rpbRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('rpbAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('rpbRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('rpbRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('rpbAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('rpbDomainVisible')?.checked),
      domainMode: document.querySelector('#recipePlusButtonForm input[name="rpbDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('rpbDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('rpbDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('rpbDomainDisable')?.checked)
    };
  }

  async function showRecipePlusButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the RecipePlus Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initRecipePlusButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultRecipePlusButtonComponent({
        name: nextRecipePlusButtonName(canvas?.components),
        ...overrides
      });
      fillRecipePlusButtonForm(comp);
      window.resetPropsDialogState('recipeplus-button', readRecipePlusButtonForm, 'applyRecipePlusButton');
      switchTab('general');
      wireRecipePlusButtonTools();
      presentRecipePlusButtonDialog();
      const previewComp = readRecipePlusButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readRecipePlusButtonForm, 'applyRecipePlusButton');
    } catch (err) {
      window.setStatus(`RecipePlus Button properties error: ${err.message}`);
    }
  }

  async function applyRecipePlusButton() {
    const comp = readRecipePlusButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readRecipePlusButtonForm, 'applyRecipePlusButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveRecipePlusButton(e) {
    e.preventDefault();
    const comp = readRecipePlusButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    rpbDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('recipePlusButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertRpbCaptionText(text) {
    const area = document.getElementById('rpbCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleRecipePlusLivePreview();
  }

  function insertRpbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertRpbCaptionText(tag);
    });
  }

  function hideRpbInsertVariableMenu() {
    document.getElementById('rpbInsertVariableMenu')?.classList.add('hidden');
  }

  function initRecipePlusButtonDialog() {
    const form = document.getElementById('recipePlusButtonForm');
    if (!form || form.dataset.rpbWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('rpbPatternStyle', 'rpbFilled');
    form.addEventListener('submit', (e) => saveRecipePlusButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyRecipePlusButton')?.addEventListener('click', () => {
      applyRecipePlusButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleRecipePlusLivePreview();
      window.flushPropsApplyButton?.(readRecipePlusButtonForm, 'applyRecipePlusButton');
    });
    form.addEventListener('change', () => {
      syncRecipePlusButtonFields();
      scheduleRecipePlusLivePreview();
      window.flushPropsApplyButton?.(readRecipePlusButtonForm, 'applyRecipePlusButton');
    });
    document.getElementById('cancelRecipePlusButton')?.addEventListener('click', () => {
      if (!rpbDialogCommitted) window.revertPropsDialogPreview?.();
      rpbDialogCommitted = true;
      document.getElementById('recipePlusButtonDialog')?.close();
    });
    document.getElementById('recipePlusButtonDialog')?.addEventListener('close', () => {
      if (rpbPreviewTimer) {
        clearTimeout(rpbPreviewTimer);
        rpbPreviewTimer = null;
      }
      hideRpbInsertVariableMenu();
      if (!rpbDialogCommitted) window.revertPropsDialogPreview?.();
      rpbDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpRecipePlusButton')?.addEventListener('click', () => {
      alert('RecipePlus Button runs a RecipePlus action such as Download, Upload, Save, or Delete.');
    });
    document.querySelectorAll('#recipePlusButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideRpbInsertVariableMenu();
        switchTab(tab.dataset.rpbTab);
      });
    });
    document.getElementById('rpbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('rpbImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('rpbImage').value = fileName;
          scheduleRecipePlusLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('rpbInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('rpbInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('rpbInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.rpbVar;
      if (!kind) return;
      hideRpbInsertVariableMenu();
      if (kind === 'timedate') insertRpbCaptionText('{#dt}');
      else insertRpbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#recipePlusButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideRpbInsertVariableMenu();
    });
    document.getElementById('rpbShape')?.addEventListener('change', () => {
      if (document.getElementById('rpbShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('rpbWidth')?.value) || 0;
      const h = Number(document.getElementById('rpbHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('rpbWidth').value = String(size);
      document.getElementById('rpbHeight').value = String(size);
    });
    document.getElementById('rpbDomainBrowse')?.addEventListener('click', () => {
      if (document.getElementById('rpbDomainBrowse')?.disabled) return;
      window.StudioTagTools?.openTagBrowser(null, (sel) => {
        const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
        if (!tag) return;
        document.getElementById('rpbDomainVariable').value = tag;
        scheduleRecipePlusLivePreview();
      });
    });
    for (const id of ['rpbBold', 'rpbItalic', 'rpbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleRecipePlusLivePreview();
      });
    }
    form.dataset.rpbWired = '1';
  }

  window.StudioRecipePlusButton = {
    initRecipePlusButtonDialog,
    presentRecipePlusButtonDialog,
    scheduleRecipePlusLivePreview,
    showRecipePlusButtonDialog,
    fillRecipePlusButtonForm,
    readRecipePlusButtonForm,
    switchRecipePlusButtonTab: switchTab,
    wireRecipePlusButtonTools,
    nextRecipePlusButtonName,
    defaultRecipePlusButtonComponent,
    applyRecipePlusButton
  };
})();
