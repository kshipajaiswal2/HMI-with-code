/** Delete User/Group Button property dialog — FactoryTalk View parity */
(function () {
  let dugPreviewTimer = null;
  let dugDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#deleteUserGroupButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.dugTab === tabId);
    });
    document.querySelectorAll('#deleteUserGroupButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.dugTabPanel === tabId);
    });
  }

  function dugGetColor(id, fallback) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || fallback
      || '#001C38';
  }

  function dugSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextDeleteUserGroupButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'DeleteUserGroupButton').length + 1;
    return `DeleteUserGroupButton${n}`;
  }


  function defaultDeleteUserGroupButtonComponent(overrides = {}) {
    return {
      type: 'DeleteUserGroupButton',
      name: 'DeleteUserGroupButton1',
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

  function scheduleDeleteUserGroupLivePreview() {
    if (window.state?.propsFormFill) return;
    if (dugPreviewTimer) clearTimeout(dugPreviewTimer);
    dugPreviewTimer = setTimeout(() => {
      dugPreviewTimer = null;
      if (!document.getElementById('deleteUserGroupButtonDialog')?.open) return;
      const comp = readDeleteUserGroupButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readDeleteUserGroupButtonForm, 'applyDeleteUserGroupButton');
    }, 80);
  }

  function syncDeleteUserGroupESignatureFields() {
    const on = Boolean(document.getElementById('dugRequireESignature')?.checked);
    for (const id of ['dugAllowBlankComment', 'dugRequireReauth', 'dugRequireCounterSig']) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
    const counter = on && Boolean(document.getElementById('dugRequireCounterSig')?.checked);
    for (const id of [
      'dugAuthorizedGroup', 'dugDomainVisible', 'dugDomainNameMode', 'dugDomainVariableMode',
      'dugDomainName', 'dugDomainVariable', 'dugDomainBrowse', 'dugDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !counter;
    }
  }

  function syncDeleteUserGroupButtonFields() {
    const capColor = document.getElementById('dugCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('dugUseCaptionColor')?.checked;
    const capBack = document.getElementById('dugCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('dugUseCaptionBackColor')?.checked;
    const imgColor = document.getElementById('dugImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('dugUseImageColor')?.checked;
    const imgBack = document.getElementById('dugImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('dugUseImageBackColor')?.checked;
    syncDeleteUserGroupESignatureFields();
  }

  function wireDeleteUserGroupButtonTools() {
    const dlg = document.getElementById('deleteUserGroupButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('dugPatternStyle', 'dugFilled');
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    document.querySelectorAll('#deleteUserGroupButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.dugPreviewWired === '1') return;
      input.dataset.dugPreviewWired = '1';
      input.addEventListener('input', scheduleDeleteUserGroupLivePreview);
      input.addEventListener('change', scheduleDeleteUserGroupLivePreview);
    });
    syncDeleteUserGroupButtonFields();
  }

  function presentDeleteUserGroupButtonDialog() {
    const dialog = document.getElementById('deleteUserGroupButtonDialog');
    if (!dialog) {
      window.setStatus('Delete User/Group Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    dugDialogCommitted = false;
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
        window.setStatus(`Opened Delete User/Group Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillDeleteUserGroupButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('dugPatternStyle', 'dugFilled');
      document.getElementById('dugBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('dugBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('dugBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('dugPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('dugShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('dugBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      dugSetColor('dugBackColor', comp.backColor || '#001C38');
      dugSetColor('dugBorderColor', comp.borderColor || '#001C38');
      dugSetColor('dugPatternColor', comp.patternColor || '#ffffff');
      dugSetColor('dugHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('dugBlink').checked = Boolean(comp.blink);
      document.getElementById('dugHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('dugVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('dugAudio').checked = comp.audio !== false;
      document.getElementById('dugCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('dugFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('dugFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('dugBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('dugItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('dugUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('dugUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      dugSetColor('dugCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('dugUseCaptionBackColor').checked = comp.useCaptionBackColor !== undefined
        ? Boolean(comp.useCaptionBackColor)
        : true;
      dugSetColor('dugCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('dugCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('dugWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('dugCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#deleteUserGroupButtonForm input[name="dugAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('dugImage').value = comp.image || '';
      document.getElementById('dugImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('dugUseImageColor').checked = Boolean(comp.useImageColor);
      dugSetColor('dugImageColor', comp.imageColor || '#ffffff');
      document.getElementById('dugUseImageBackColor').checked = comp.useImageBackColor !== undefined
        ? Boolean(comp.useImageBackColor)
        : true;
      dugSetColor('dugImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('dugImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('dugImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#deleteUserGroupButtonForm input[name="dugImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('dugRequireESignature').checked = Boolean(comp.requireESignature);
      document.getElementById('dugAllowBlankComment').checked = Boolean(comp.allowBlankComment);
      document.getElementById('dugRequireReauth').checked = Boolean(comp.requireReauth);
      document.getElementById('dugRequireCounterSig').checked = Boolean(comp.requireCounterSig);
      document.getElementById('dugAuthorizedGroup').value = comp.authorizedGroup || 'Administrators';
      document.getElementById('dugDomainVisible').checked = Boolean(comp.domainVisible);
      const domainMode = comp.domainMode === 'variable' ? 'variable' : 'name';
      document.querySelectorAll('#deleteUserGroupButtonForm input[name="dugDomainMode"]').forEach((el) => {
        el.checked = el.value === domainMode;
      });
      document.getElementById('dugDomainName').value = comp.domainName || '';
      document.getElementById('dugDomainVariable').value = comp.domainVariable || '';
      document.getElementById('dugDomainDisable').checked = Boolean(comp.domainDisable);
      document.getElementById('dugHeight').value = comp.height ?? 80;
      document.getElementById('dugWidth').value = comp.width ?? 80;
      document.getElementById('dugTop').value = comp.top ?? 16;
      document.getElementById('dugLeft').value = comp.left ?? 16;
      document.getElementById('dugName').value = comp.name || 'DeleteUserGroupButton1';
      document.getElementById('dugVisible').checked = comp.visible !== false;
      syncDeleteUserGroupButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readDeleteUserGroupButtonForm() {
    const caption = document.getElementById('dugCaption')?.value || '';
    const captionColor = dugGetColor('dugCaptionColor', '#ffffff');
    return {
      type: 'DeleteUserGroupButton',
      name: document.getElementById('dugName')?.value.trim() || 'DeleteUserGroupButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('dugLeft')?.value) || 0,
      top: Number(document.getElementById('dugTop')?.value) || 0,
      width: Number(document.getElementById('dugWidth')?.value) || 80,
      height: Number(document.getElementById('dugHeight')?.value) || 80,
      visible: document.getElementById('dugVisible')?.checked !== false,
      borderStyle: document.getElementById('dugBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('dugBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('dugBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('dugBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('dugPatternStyle')?.value || 'none',
      shape: document.getElementById('dugShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: dugGetColor('dugBackColor', '#001C38'),
      useBorderColor: true,
      borderColor: dugGetColor('dugBorderColor', '#001C38'),
      usePatternColor: true,
      patternColor: dugGetColor('dugPatternColor', '#ffffff'),
      useHighlightColor: true,
      highlightColor: dugGetColor('dugHighlightColor', '#0066cc'),
      blink: Boolean(document.getElementById('dugBlink')?.checked),
      horizontalMargin: Number(document.getElementById('dugHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('dugVerticalMargin')?.value) || 0,
      audio: document.getElementById('dugAudio')?.checked !== false,
      fontFamily: document.getElementById('dugFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('dugFontSize')?.value) || 10,
      bold: document.getElementById('dugBold')?.classList.contains('active'),
      italic: document.getElementById('dugItalic')?.classList.contains('active'),
      underline: document.getElementById('dugUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('dugUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('dugUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('dugUseCaptionBackColor')?.checked),
      captionBackColor: dugGetColor('dugCaptionBackColor', '#001C38'),
      captionBlink: Boolean(document.getElementById('dugCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('dugCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('dugWordWrap')?.checked !== false,
      alignment: document.querySelector('#deleteUserGroupButtonForm input[name="dugAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('dugImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('dugImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#deleteUserGroupButtonForm input[name="dugImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('dugUseImageColor')?.checked),
      imageColor: dugGetColor('dugImageColor', '#ffffff'),
      useImageBackColor: Boolean(document.getElementById('dugUseImageBackColor')?.checked),
      imageBackColor: dugGetColor('dugImageBackColor', '#001C38'),
      imageBlink: Boolean(document.getElementById('dugImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('dugImageScaled')?.checked),
      requireESignature: Boolean(document.getElementById('dugRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('dugAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('dugRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('dugRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('dugAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('dugDomainVisible')?.checked),
      domainMode: document.querySelector('#deleteUserGroupButtonForm input[name="dugDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('dugDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('dugDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('dugDomainDisable')?.checked)
    };
  }

  async function showDeleteUserGroupButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Delete User/Group Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initDeleteUserGroupButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultDeleteUserGroupButtonComponent({
        name: nextDeleteUserGroupButtonName(canvas?.components),
        ...overrides
      });
      fillDeleteUserGroupButtonForm(comp);
      window.resetPropsDialogState('delete-user-group', readDeleteUserGroupButtonForm, 'applyDeleteUserGroupButton');
      switchTab('general');
      wireDeleteUserGroupButtonTools();
      presentDeleteUserGroupButtonDialog();
      const previewComp = readDeleteUserGroupButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readDeleteUserGroupButtonForm, 'applyDeleteUserGroupButton');
    } catch (err) {
      window.setStatus(`Delete User/Group Button properties error: ${err.message}`);
    }
  }

  async function applyDeleteUserGroupButton() {
    const comp = readDeleteUserGroupButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readDeleteUserGroupButtonForm, 'applyDeleteUserGroupButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveDeleteUserGroupButton(e) {
    e.preventDefault();
    const comp = readDeleteUserGroupButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    dugDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('deleteUserGroupButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertDugCaptionText(text) {
    const area = document.getElementById('dugCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleDeleteUserGroupLivePreview();
  }

  function insertDugCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertDugCaptionText(tag);
    });
  }

  function hideDugInsertVariableMenu() {
    document.getElementById('dugInsertVariableMenu')?.classList.add('hidden');
  }

  function initDeleteUserGroupButtonDialog() {
    const form = document.getElementById('deleteUserGroupButtonForm');
    if (!form || form.dataset.dugWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('dugPatternStyle', 'dugFilled');
    form.addEventListener('submit', (e) => saveDeleteUserGroupButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyDeleteUserGroupButton')?.addEventListener('click', () => {
      applyDeleteUserGroupButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleDeleteUserGroupLivePreview();
      window.flushPropsApplyButton?.(readDeleteUserGroupButtonForm, 'applyDeleteUserGroupButton');
    });
    form.addEventListener('change', () => {
      syncDeleteUserGroupButtonFields();
      scheduleDeleteUserGroupLivePreview();
      window.flushPropsApplyButton?.(readDeleteUserGroupButtonForm, 'applyDeleteUserGroupButton');
    });
    document.getElementById('cancelDeleteUserGroupButton')?.addEventListener('click', () => {
      if (!dugDialogCommitted) window.revertPropsDialogPreview?.();
      dugDialogCommitted = true;
      document.getElementById('deleteUserGroupButtonDialog')?.close();
    });
    document.getElementById('deleteUserGroupButtonDialog')?.addEventListener('close', () => {
      if (dugPreviewTimer) {
        clearTimeout(dugPreviewTimer);
        dugPreviewTimer = null;
      }
      hideDugInsertVariableMenu();
      if (!dugDialogCommitted) window.revertPropsDialogPreview?.();
      dugDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpDeleteUserGroupButton')?.addEventListener('click', () => {
      alert('Delete User/Group Button opens a runtime prompt asking for a username, verifies that user exists, and removes it.');
    });
    document.querySelectorAll('#deleteUserGroupButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideDugInsertVariableMenu();
        switchTab(tab.dataset.dugTab);
      });
    });
    document.getElementById('dugBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('dugImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('dugImage').value = fileName;
          scheduleDeleteUserGroupLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('dugInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('dugInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('dugInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.dugVar;
      if (!kind) return;
      hideDugInsertVariableMenu();
      if (kind === 'timedate') insertDugCaptionText('{#dt}');
      else insertDugCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#deleteUserGroupButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideDugInsertVariableMenu();
    });
    document.getElementById('dugShape')?.addEventListener('change', () => {
      if (document.getElementById('dugShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('dugWidth')?.value) || 0;
      const h = Number(document.getElementById('dugHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('dugWidth').value = String(size);
      document.getElementById('dugHeight').value = String(size);
    });
    document.getElementById('dugDomainBrowse')?.addEventListener('click', () => {
      if (document.getElementById('dugDomainBrowse')?.disabled) return;
      window.StudioTagTools?.openTagBrowser(null, (sel) => {
        const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
        if (!tag) return;
        document.getElementById('dugDomainVariable').value = tag;
        scheduleDeleteUserGroupLivePreview();
      });
    });
    for (const id of ['dugBold', 'dugItalic', 'dugUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleDeleteUserGroupLivePreview();
      });
    }
    form.dataset.dugWired = '1';
  }

  window.StudioDeleteUserGroupButton = {
    initDeleteUserGroupButtonDialog,
    presentDeleteUserGroupButtonDialog,
    scheduleDeleteUserGroupLivePreview,
    showDeleteUserGroupButtonDialog,
    fillDeleteUserGroupButtonForm,
    readDeleteUserGroupButtonForm,
    switchDeleteUserGroupButtonTab: switchTab,
    wireDeleteUserGroupButtonTools,
    nextDeleteUserGroupButtonName,
    defaultDeleteUserGroupButtonComponent,
    applyDeleteUserGroupButton
  };
})();
