/** String Display property dialog — FactoryTalk View parity */
(function () {
  let sdPreviewTimer = null;
  let sdDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#stringDisplayDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.sdTab === tabId);
    });
    document.querySelectorAll('#stringDisplayDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.sdTabPanel === tabId);
    });
  }

  function sdGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function sdSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextStringDisplayName(components) {
    const n = (components || []).filter((c) => c.type === 'StringDisplay').length + 1;
    return `StringDisplay${n}`;
  }

  function defaultStringDisplayComponent(overrides = {}) {
    return {
      type: 'StringDisplay',
      name: 'StringDisplay1',
      tag: '',
      left: 16,
      top: 16,
      width: 168,
      height: 91,
      visible: true,
      borderStyle: 'line',
      borderWidth: 4,
      borderUsesBackColor: true,
      backStyle: 'solid',
      patternStyle: 'none',
      useBackColor: true,
      backColor: '#001C38',
      useBorderColor: true,
      borderColor: '#001C38',
      usePatternColor: true,
      patternColor: '#ffffff',
      useForeColor: true,
      foreColor: '#ffffff',
      blink: false,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      alignment: 'middleCenter',
      wordWrap: true,
      ...overrides
    };
  }

  function scheduleStringDisplayLivePreview() {
    if (window.state?.propsFormFill) return;
    if (sdPreviewTimer) clearTimeout(sdPreviewTimer);
    sdPreviewTimer = setTimeout(() => {
      sdPreviewTimer = null;
      if (!document.getElementById('stringDisplayDialog')?.open) return;
      const comp = readStringDisplayForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readStringDisplayForm, 'applyStringDisplay');
    }, 80);
  }

  function wireStringDisplayTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('stringDisplayDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('sdPatternStyle', 'sdFilled');
    document.querySelectorAll('#stringDisplayForm .ft-color-input').forEach((input) => {
      if (input.dataset.sdPreviewWired === '1') return;
      input.dataset.sdPreviewWired = '1';
      input.addEventListener('input', scheduleStringDisplayLivePreview);
      input.addEventListener('change', scheduleStringDisplayLivePreview);
    });
  }

  function presentStringDisplayDialog() {
    const dialog = document.getElementById('stringDisplayDialog');
    if (!dialog) {
      window.setStatus('String Display Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    sdDialogCommitted = false;
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
        window.setStatus(`Opened String Display properties without modal: ${err2.message}`);
      }
    }
  }

  function mergeExistingStringDisplay(read) {
    const ref = window.state?.propsDialog?.ref;
    const idx = window.state?.propsDialog?.editIndex;
    let existing = null;
    if (ref?.type === 'display' && ref.index != null) {
      existing = window.state.canvasEditCache?.raw?.components?.[ref.index];
    }
    if (!existing && idx != null) {
      existing = window.state.canvasEditCache?.editComponents?.[idx]?.comp;
    }
    const merged = { ...read };
    if (existing?.useCurrentUser && !merged.tag) {
      merged.useCurrentUser = true;
      merged.caption = existing.caption ?? 'Guest';
    }
    return merged;
  }

  function fillStringDisplayForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('sdPatternStyle', 'sdFilled');
      document.getElementById('sdBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('sdBorderWidth').value = comp.borderWidth ?? 4;
      document.getElementById('sdBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('sdPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      document.getElementById('sdBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      sdSetColor('sdBackColor', comp.backColor || '#001C38');
      sdSetColor('sdBorderColor', comp.borderColor || '#001C38');
      sdSetColor('sdPatternColor', comp.patternColor || '#ffffff');
      sdSetColor('sdForeColor', comp.foreColor || '#ffffff');
      document.getElementById('sdBlink').checked = Boolean(comp.blink);
      document.getElementById('sdFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('sdFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('sdBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('sdItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('sdUnderline').classList.toggle('active', Boolean(comp.underline));
      document.querySelectorAll('#stringDisplayForm input[name="sdAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('sdWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('sdHeight').value = comp.height ?? 91;
      document.getElementById('sdWidth').value = comp.width ?? 168;
      document.getElementById('sdTop').value = comp.top ?? 16;
      document.getElementById('sdLeft').value = comp.left ?? 16;
      document.getElementById('sdName').value = comp.name || 'StringDisplay1';
      document.getElementById('sdVisible').checked = comp.visible !== false;
      document.getElementById('sdTag').value = comp.useCurrentUser ? '' : (comp.tag || '');
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readStringDisplayForm() {
    return {
      type: 'StringDisplay',
      name: document.getElementById('sdName')?.value.trim() || 'StringDisplay1',
      tag: document.getElementById('sdTag')?.value.trim() || '',
      left: Number(document.getElementById('sdLeft')?.value) || 0,
      top: Number(document.getElementById('sdTop')?.value) || 0,
      width: Number(document.getElementById('sdWidth')?.value) || 168,
      height: Number(document.getElementById('sdHeight')?.value) || 91,
      visible: document.getElementById('sdVisible')?.checked !== false,
      borderStyle: document.getElementById('sdBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('sdBorderWidth')?.value) || 4,
      borderUsesBackColor: document.getElementById('sdBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('sdBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('sdPatternStyle')?.value || 'none',
      useBackColor: true,
      backColor: sdGetColor('sdBackColor'),
      useBorderColor: true,
      borderColor: sdGetColor('sdBorderColor'),
      usePatternColor: true,
      patternColor: sdGetColor('sdPatternColor'),
      useForeColor: true,
      foreColor: sdGetColor('sdForeColor'),
      blink: Boolean(document.getElementById('sdBlink')?.checked),
      fontFamily: document.getElementById('sdFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('sdFontSize')?.value) || 10,
      bold: document.getElementById('sdBold')?.classList.contains('active'),
      italic: document.getElementById('sdItalic')?.classList.contains('active'),
      underline: document.getElementById('sdUnderline')?.classList.contains('active'),
      alignment: document.querySelector('#stringDisplayForm input[name="sdAlign"]:checked')?.value || 'middleCenter',
      wordWrap: document.getElementById('sdWordWrap')?.checked !== false
    };
  }

  async function showStringDisplayDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the String Display');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initStringDisplayDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultStringDisplayComponent({
        name: nextStringDisplayName(canvas?.components),
        ...overrides
      });
      fillStringDisplayForm(comp);
      window.resetPropsDialogState('string-display', readStringDisplayForm, 'applyStringDisplay');
      switchTab('general');
      wireStringDisplayTools();
      presentStringDisplayDialog();
      const previewComp = readStringDisplayForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readStringDisplayForm, 'applyStringDisplay');
    } catch (err) {
      window.setStatus(`String Display properties error: ${err.message}`);
    }
  }

  async function applyStringDisplay() {
    const comp = mergeExistingStringDisplay(readStringDisplayForm());
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readStringDisplayForm, 'applyStringDisplay');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveStringDisplay(e) {
    e.preventDefault();
    const comp = mergeExistingStringDisplay(readStringDisplayForm());
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    sdDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('stringDisplayDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function initStringDisplayDialog() {
    const form = document.getElementById('stringDisplayForm');
    if (!form || form.dataset.sdWired === '1') return;
    form.dataset.sdWired = '1';
    window.StudioPropsShared?.fillPatternSelect('sdPatternStyle', 'sdFilled');
    form.addEventListener('submit', (e) => saveStringDisplay(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyStringDisplay')?.addEventListener('click', () => {
      applyStringDisplay().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleStringDisplayLivePreview();
      window.flushPropsApplyButton?.(readStringDisplayForm, 'applyStringDisplay');
    });
    form.addEventListener('change', () => {
      scheduleStringDisplayLivePreview();
      window.flushPropsApplyButton?.(readStringDisplayForm, 'applyStringDisplay');
    });
    document.getElementById('cancelStringDisplay')?.addEventListener('click', () => {
      document.getElementById('stringDisplayDialog')?.close();
    });
    document.getElementById('stringDisplayDialog')?.addEventListener('close', () => {
      if (sdPreviewTimer) {
        clearTimeout(sdPreviewTimer);
        sdPreviewTimer = null;
      }
      if (!sdDialogCommitted) window.revertPropsDialogPreview?.();
      sdDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpStringDisplay')?.addEventListener('click', () => {
      alert('String Display shows a tag or expression as text. Configure appearance, font, word wrap, and the Value connection. A Value tag is optional until runtime.');
    });
    document.querySelectorAll('#stringDisplayDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.sdTab));
    });
    for (const id of ['sdBold', 'sdItalic', 'sdUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleStringDisplayLivePreview();
      });
    }
  }

  window.StudioStringDisplay = {
    initStringDisplayDialog,
    presentStringDisplayDialog,
    scheduleStringDisplayLivePreview,
    showStringDisplayDialog,
    fillStringDisplayForm,
    readStringDisplayForm,
    switchStringDisplayTab: switchTab,
    wireStringDisplayTools
  };
})();
