/** Unlock User Button property dialog — FactoryTalk View parity */
(function () {
  let unlPreviewTimer = null;
  let unlDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#unlockUserButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.unlTab === tabId);
    });
    document.querySelectorAll('#unlockUserButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.unlTabPanel === tabId);
    });
  }

  function unlGetColor(id, fallback) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || fallback
      || '#001C38';
  }

  function unlSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextUnlockUserButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'UnlockUserButton').length + 1;
    return `UnlockUserButton${n}`;
  }


  function defaultUnlockUserButtonComponent(overrides = {}) {
    return {
      type: 'UnlockUserButton',
      name: 'UnlockUserButton1',
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

  function scheduleUnlockUserLivePreview() {
    if (window.state?.propsFormFill) return;
    if (unlPreviewTimer) clearTimeout(unlPreviewTimer);
    unlPreviewTimer = setTimeout(() => {
      unlPreviewTimer = null;
      if (!document.getElementById('unlockUserButtonDialog')?.open) return;
      const comp = readUnlockUserButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readUnlockUserButtonForm, 'applyUnlockUserButton');
    }, 80);
  }

  function syncUnlockUserESignatureFields() {
    const on = Boolean(document.getElementById('unlRequireESignature')?.checked);
    for (const id of ['unlAllowBlankComment', 'unlRequireReauth', 'unlRequireCounterSig']) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
    const counter = on && Boolean(document.getElementById('unlRequireCounterSig')?.checked);
    for (const id of [
      'unlAuthorizedGroup', 'unlDomainVisible', 'unlDomainNameMode', 'unlDomainVariableMode',
      'unlDomainName', 'unlDomainVariable', 'unlDomainBrowse', 'unlDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !counter;
    }
  }

  function syncUnlockUserButtonFields() {
    const capColor = document.getElementById('unlCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('unlUseCaptionColor')?.checked;
    const capBack = document.getElementById('unlCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('unlUseCaptionBackColor')?.checked;
    const imgColor = document.getElementById('unlImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('unlUseImageColor')?.checked;
    const imgBack = document.getElementById('unlImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('unlUseImageBackColor')?.checked;
    syncUnlockUserESignatureFields();
  }

  function wireUnlockUserButtonTools() {
    const dlg = document.getElementById('unlockUserButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('unlPatternStyle', 'unlFilled');
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    document.querySelectorAll('#unlockUserButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.unlPreviewWired === '1') return;
      input.dataset.unlPreviewWired = '1';
      input.addEventListener('input', scheduleUnlockUserLivePreview);
      input.addEventListener('change', scheduleUnlockUserLivePreview);
    });
    syncUnlockUserButtonFields();
  }

  function presentUnlockUserButtonDialog() {
    const dialog = document.getElementById('unlockUserButtonDialog');
    if (!dialog) {
      window.setStatus('Unlock User Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    unlDialogCommitted = false;
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
        window.setStatus(`Opened Unlock User Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillUnlockUserButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('unlPatternStyle', 'unlFilled');
      document.getElementById('unlBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('unlBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('unlBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('unlPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('unlShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('unlBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      unlSetColor('unlBackColor', comp.backColor || '#001C38');
      unlSetColor('unlBorderColor', comp.borderColor || '#001C38');
      unlSetColor('unlPatternColor', comp.patternColor || '#ffffff');
      unlSetColor('unlHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('unlBlink').checked = Boolean(comp.blink);
      document.getElementById('unlHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('unlVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('unlAudio').checked = comp.audio !== false;
      document.getElementById('unlCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('unlFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('unlFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('unlBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('unlItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('unlUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('unlUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      unlSetColor('unlCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('unlUseCaptionBackColor').checked = comp.useCaptionBackColor !== undefined
        ? Boolean(comp.useCaptionBackColor)
        : true;
      unlSetColor('unlCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('unlCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('unlWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('unlCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#unlockUserButtonForm input[name="unlAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('unlImage').value = comp.image || '';
      document.getElementById('unlImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('unlUseImageColor').checked = Boolean(comp.useImageColor);
      unlSetColor('unlImageColor', comp.imageColor || '#ffffff');
      document.getElementById('unlUseImageBackColor').checked = comp.useImageBackColor !== undefined
        ? Boolean(comp.useImageBackColor)
        : true;
      unlSetColor('unlImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('unlImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('unlImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#unlockUserButtonForm input[name="unlImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('unlRequireESignature').checked = Boolean(comp.requireESignature);
      document.getElementById('unlAllowBlankComment').checked = Boolean(comp.allowBlankComment);
      document.getElementById('unlRequireReauth').checked = Boolean(comp.requireReauth);
      document.getElementById('unlRequireCounterSig').checked = Boolean(comp.requireCounterSig);
      document.getElementById('unlAuthorizedGroup').value = comp.authorizedGroup || 'Administrators';
      document.getElementById('unlDomainVisible').checked = Boolean(comp.domainVisible);
      const domainMode = comp.domainMode === 'variable' ? 'variable' : 'name';
      document.querySelectorAll('#unlockUserButtonForm input[name="unlDomainMode"]').forEach((el) => {
        el.checked = el.value === domainMode;
      });
      document.getElementById('unlDomainName').value = comp.domainName || '';
      document.getElementById('unlDomainVariable').value = comp.domainVariable || '';
      document.getElementById('unlDomainDisable').checked = Boolean(comp.domainDisable);
      document.getElementById('unlHeight').value = comp.height ?? 80;
      document.getElementById('unlWidth').value = comp.width ?? 80;
      document.getElementById('unlTop').value = comp.top ?? 16;
      document.getElementById('unlLeft').value = comp.left ?? 16;
      document.getElementById('unlName').value = comp.name || 'UnlockUserButton1';
      document.getElementById('unlVisible').checked = comp.visible !== false;
      syncUnlockUserButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readUnlockUserButtonForm() {
    const caption = document.getElementById('unlCaption')?.value || '';
    const captionColor = unlGetColor('unlCaptionColor', '#ffffff');
    return {
      type: 'UnlockUserButton',
      name: document.getElementById('unlName')?.value.trim() || 'UnlockUserButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('unlLeft')?.value) || 0,
      top: Number(document.getElementById('unlTop')?.value) || 0,
      width: Number(document.getElementById('unlWidth')?.value) || 80,
      height: Number(document.getElementById('unlHeight')?.value) || 80,
      visible: document.getElementById('unlVisible')?.checked !== false,
      borderStyle: document.getElementById('unlBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('unlBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('unlBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('unlBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('unlPatternStyle')?.value || 'none',
      shape: document.getElementById('unlShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: unlGetColor('unlBackColor', '#001C38'),
      useBorderColor: true,
      borderColor: unlGetColor('unlBorderColor', '#001C38'),
      usePatternColor: true,
      patternColor: unlGetColor('unlPatternColor', '#ffffff'),
      useHighlightColor: true,
      highlightColor: unlGetColor('unlHighlightColor', '#0066cc'),
      blink: Boolean(document.getElementById('unlBlink')?.checked),
      horizontalMargin: Number(document.getElementById('unlHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('unlVerticalMargin')?.value) || 0,
      audio: document.getElementById('unlAudio')?.checked !== false,
      fontFamily: document.getElementById('unlFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('unlFontSize')?.value) || 10,
      bold: document.getElementById('unlBold')?.classList.contains('active'),
      italic: document.getElementById('unlItalic')?.classList.contains('active'),
      underline: document.getElementById('unlUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('unlUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('unlUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('unlUseCaptionBackColor')?.checked),
      captionBackColor: unlGetColor('unlCaptionBackColor', '#001C38'),
      captionBlink: Boolean(document.getElementById('unlCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('unlCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('unlWordWrap')?.checked !== false,
      alignment: document.querySelector('#unlockUserButtonForm input[name="unlAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('unlImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('unlImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#unlockUserButtonForm input[name="unlImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('unlUseImageColor')?.checked),
      imageColor: unlGetColor('unlImageColor', '#ffffff'),
      useImageBackColor: Boolean(document.getElementById('unlUseImageBackColor')?.checked),
      imageBackColor: unlGetColor('unlImageBackColor', '#001C38'),
      imageBlink: Boolean(document.getElementById('unlImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('unlImageScaled')?.checked),
      requireESignature: Boolean(document.getElementById('unlRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('unlAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('unlRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('unlRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('unlAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('unlDomainVisible')?.checked),
      domainMode: document.querySelector('#unlockUserButtonForm input[name="unlDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('unlDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('unlDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('unlDomainDisable')?.checked)
    };
  }

  async function showUnlockUserButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Unlock User Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initUnlockUserButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultUnlockUserButtonComponent({
        name: nextUnlockUserButtonName(canvas?.components),
        ...overrides
      });
      fillUnlockUserButtonForm(comp);
      window.resetPropsDialogState('unlock-user', readUnlockUserButtonForm, 'applyUnlockUserButton');
      switchTab('general');
      wireUnlockUserButtonTools();
      presentUnlockUserButtonDialog();
      const previewComp = readUnlockUserButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readUnlockUserButtonForm, 'applyUnlockUserButton');
    } catch (err) {
      window.setStatus(`Unlock User Button properties error: ${err.message}`);
    }
  }

  async function applyUnlockUserButton() {
    const comp = readUnlockUserButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readUnlockUserButtonForm, 'applyUnlockUserButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveUnlockUserButton(e) {
    e.preventDefault();
    const comp = readUnlockUserButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    unlDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('unlockUserButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertUnlCaptionText(text) {
    const area = document.getElementById('unlCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleUnlockUserLivePreview();
  }

  function insertUnlCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertUnlCaptionText(tag);
    });
  }

  function hideUnlInsertVariableMenu() {
    document.getElementById('unlInsertVariableMenu')?.classList.add('hidden');
  }

  function initUnlockUserButtonDialog() {
    const form = document.getElementById('unlockUserButtonForm');
    if (!form || form.dataset.unlWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('unlPatternStyle', 'unlFilled');
    form.addEventListener('submit', (e) => saveUnlockUserButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyUnlockUserButton')?.addEventListener('click', () => {
      applyUnlockUserButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleUnlockUserLivePreview();
      window.flushPropsApplyButton?.(readUnlockUserButtonForm, 'applyUnlockUserButton');
    });
    form.addEventListener('change', () => {
      syncUnlockUserButtonFields();
      scheduleUnlockUserLivePreview();
      window.flushPropsApplyButton?.(readUnlockUserButtonForm, 'applyUnlockUserButton');
    });
    document.getElementById('cancelUnlockUserButton')?.addEventListener('click', () => {
      if (!unlDialogCommitted) window.revertPropsDialogPreview?.();
      unlDialogCommitted = true;
      document.getElementById('unlockUserButtonDialog')?.close();
    });
    document.getElementById('unlockUserButtonDialog')?.addEventListener('close', () => {
      if (unlPreviewTimer) {
        clearTimeout(unlPreviewTimer);
        unlPreviewTimer = null;
      }
      hideUnlInsertVariableMenu();
      if (!unlDialogCommitted) window.revertPropsDialogPreview?.();
      unlDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpUnlockUserButton')?.addEventListener('click', () => {
      alert('Unlock User Button opens a runtime prompt asking for a username, verifies that user exists and is locked, and unlocks it.');
    });
    document.querySelectorAll('#unlockUserButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideUnlInsertVariableMenu();
        switchTab(tab.dataset.unlTab);
      });
    });
    document.getElementById('unlBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('unlImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('unlImage').value = fileName;
          scheduleUnlockUserLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('unlInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('unlInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('unlInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.unlVar;
      if (!kind) return;
      hideUnlInsertVariableMenu();
      if (kind === 'timedate') insertUnlCaptionText('{#dt}');
      else insertUnlCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#unlockUserButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideUnlInsertVariableMenu();
    });
    document.getElementById('unlShape')?.addEventListener('change', () => {
      if (document.getElementById('unlShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('unlWidth')?.value) || 0;
      const h = Number(document.getElementById('unlHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('unlWidth').value = String(size);
      document.getElementById('unlHeight').value = String(size);
    });
    document.getElementById('unlDomainBrowse')?.addEventListener('click', () => {
      if (document.getElementById('unlDomainBrowse')?.disabled) return;
      window.StudioTagTools?.openTagBrowser(null, (sel) => {
        const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
        if (!tag) return;
        document.getElementById('unlDomainVariable').value = tag;
        scheduleUnlockUserLivePreview();
      });
    });
    for (const id of ['unlBold', 'unlItalic', 'unlUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleUnlockUserLivePreview();
      });
    }
    form.dataset.unlWired = '1';
  }

  window.StudioUnlockUserButton = {
    initUnlockUserButtonDialog,
    presentUnlockUserButtonDialog,
    scheduleUnlockUserLivePreview,
    showUnlockUserButtonDialog,
    fillUnlockUserButtonForm,
    readUnlockUserButtonForm,
    switchUnlockUserButtonTab: switchTab,
    wireUnlockUserButtonTools,
    nextUnlockUserButtonName,
    defaultUnlockUserButtonComponent,
    applyUnlockUserButton
  };
})();
