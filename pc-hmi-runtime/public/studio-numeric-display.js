/** Numeric Display property dialog — FactoryTalk View parity */
(function () {
  let ndPreviewTimer = null;
  let ndDialogCommitted = false;

  function switchTab(tabId) {
    document.querySelectorAll('#numericDisplayDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.ndTab === tabId);
    });
    document.querySelectorAll('#numericDisplayDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.ndTabPanel === tabId);
    });
  }

  function ndGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function ndSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function fillNdRangeSelect(id, from, to, selected, filledKey) {
    const el = document.getElementById(id);
    if (!el || el.dataset[filledKey] === '1') return;
    el.dataset[filledKey] = '1';
    const opts = [];
    for (let n = from; n <= to; n++) {
      opts.push(`<option value="${n}"${n === selected ? ' selected' : ''}>${n}</option>`);
    }
    el.innerHTML = opts.join('');
  }

  function nextNumericDisplayName(components) {
    const n = (components || []).filter((c) => c.type === 'NumericDisplay').length + 1;
    return `NumericDisplay${n}`;
  }

  function defaultNumericDisplayComponent(overrides = {}) {
    return {
      type: 'NumericDisplay',
      name: 'NumericDisplay1',
      tag: '',
      polarityTag: '',
      left: 16,
      top: 16,
      width: 80,
      height: 28,
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
      usePatternColor: false,
      patternColor: '#ffffff',
      useForeColor: false,
      foreColor: '#ffffff',
      blink: false,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      alignment: 'middleCenter',
      numberOfDigits: 5,
      fillLeftWith: 'none',
      decimalPlaces: 0,
      format: 'integer',
      ...overrides
    };
  }

  function scheduleNumericLivePreview() {
    if (window.state?.propsFormFill) return;
    if (ndPreviewTimer) clearTimeout(ndPreviewTimer);
    ndPreviewTimer = setTimeout(() => {
      ndPreviewTimer = null;
      const comp = readNumericDisplayForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readNumericDisplayForm, 'applyNumericDisplay');
    }, 80);
  }

  function syncNumericDisplayFields() {
    const pat = document.getElementById('ndPatternColor');
    if (pat) pat.disabled = !document.getElementById('ndUsePatternColor')?.checked;
    const fore = document.getElementById('ndForeColor');
    if (fore) fore.disabled = !document.getElementById('ndUseForeColor')?.checked;
  }

  function wireNumericDisplayTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('numericDisplayDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    document.querySelectorAll('#numericDisplayForm .ft-color-input').forEach((input) => {
      if (input.dataset.ndPreviewWired === '1') return;
      input.dataset.ndPreviewWired = '1';
      input.addEventListener('input', scheduleNumericLivePreview);
      input.addEventListener('change', scheduleNumericLivePreview);
    });
    syncNumericDisplayFields();
  }

  function presentNumericDisplayDialog() {
    const dialog = document.getElementById('numericDisplayDialog');
    if (!dialog) {
      window.setStatus('Numeric Display Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    ndDialogCommitted = false;
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
        window.setStatus(`Opened Numeric Display properties without modal: ${err2.message}`);
      }
    }
  }

  function mapFillLeftWith(raw) {
    const v = String(raw || 'none').toLowerCase();
    if (v === 'zero' || v === 'zeroes') return 'zeroes';
    if (v === 'space' || v === 'spaces') return 'spaces';
    return 'none';
  }

  function fillNumericDisplayForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillNdRangeSelect('ndNumberOfDigits', 1, 17, 5, 'ndDigitsFilled');
      fillNdRangeSelect('ndDecimalPlaces', 0, 15, 0, 'ndDecFilled');
      window.StudioPropsShared?.fillPatternSelect('ndPatternStyle', 'ndFilled');
      document.getElementById('ndBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('ndBorderWidth').value = comp.borderWidth ?? 4;
      document.getElementById('ndBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('ndPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      document.getElementById('ndBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      ndSetColor('ndBackColor', comp.backColor || '#001C38');
      ndSetColor('ndBorderColor', comp.borderColor || '#001C38');
      const usePat = document.getElementById('ndUsePatternColor');
      if (usePat) usePat.checked = Boolean(comp.usePatternColor);
      ndSetColor('ndPatternColor', comp.patternColor || '#ffffff');
      const useFore = document.getElementById('ndUseForeColor');
      if (useFore) useFore.checked = Boolean(comp.useForeColor);
      ndSetColor('ndForeColor', comp.foreColor || '#ffffff');
      document.getElementById('ndBlink').checked = Boolean(comp.blink);
      document.getElementById('ndFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('ndFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('ndBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('ndItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('ndUnderline').classList.toggle('active', Boolean(comp.underline));
      document.querySelectorAll('#numericDisplayForm input[name="ndAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('ndNumberOfDigits').value = String(comp.numberOfDigits ?? 5);
      document.getElementById('ndFillLeftWith').value = mapFillLeftWith(comp.fillLeftWith);
      document.getElementById('ndDecimalPlaces').value = String(comp.decimalPlaces ?? comp.decimals ?? 0);
      document.getElementById('ndHeight').value = comp.height ?? 28;
      document.getElementById('ndWidth').value = comp.width ?? 80;
      document.getElementById('ndTop').value = comp.top ?? 16;
      document.getElementById('ndLeft').value = comp.left ?? 16;
      document.getElementById('ndName').value = comp.name || 'NumericDisplay1';
      document.getElementById('ndVisible').checked = comp.visible !== false;
      document.getElementById('ndTag').value = comp.tag || '';
      document.getElementById('ndPolarityTag').value = comp.polarityTag || '';
      syncNumericDisplayFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readNumericDisplayForm() {
    const decimalPlaces = Number(document.getElementById('ndDecimalPlaces')?.value);
    const dec = Number.isFinite(decimalPlaces) ? decimalPlaces : 0;
    return {
      type: 'NumericDisplay',
      name: document.getElementById('ndName')?.value.trim() || 'NumericDisplay1',
      tag: document.getElementById('ndTag')?.value.trim() || '',
      polarityTag: document.getElementById('ndPolarityTag')?.value.trim() || '',
      left: Number(document.getElementById('ndLeft')?.value) || 0,
      top: Number(document.getElementById('ndTop')?.value) || 0,
      width: Number(document.getElementById('ndWidth')?.value) || 80,
      height: Number(document.getElementById('ndHeight')?.value) || 28,
      visible: document.getElementById('ndVisible')?.checked !== false,
      borderStyle: document.getElementById('ndBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('ndBorderWidth')?.value) || 4,
      borderUsesBackColor: document.getElementById('ndBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('ndBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('ndPatternStyle')?.value || 'none',
      useBackColor: true,
      backColor: ndGetColor('ndBackColor'),
      useBorderColor: true,
      borderColor: ndGetColor('ndBorderColor'),
      usePatternColor: Boolean(document.getElementById('ndUsePatternColor')?.checked),
      patternColor: ndGetColor('ndPatternColor'),
      useForeColor: Boolean(document.getElementById('ndUseForeColor')?.checked),
      foreColor: ndGetColor('ndForeColor'),
      blink: Boolean(document.getElementById('ndBlink')?.checked),
      fontFamily: document.getElementById('ndFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('ndFontSize')?.value) || 10,
      bold: document.getElementById('ndBold')?.classList.contains('active'),
      italic: document.getElementById('ndItalic')?.classList.contains('active'),
      underline: document.getElementById('ndUnderline')?.classList.contains('active'),
      alignment: document.querySelector('#numericDisplayForm input[name="ndAlign"]:checked')?.value || 'middleCenter',
      numberOfDigits: Number(document.getElementById('ndNumberOfDigits')?.value) || 5,
      fillLeftWith: document.getElementById('ndFillLeftWith')?.value || 'none',
      decimalPlaces: dec,
      format: dec > 0 ? 'float' : 'integer',
      decimals: dec
    };
  }

  async function showNumericDisplayDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Numeric Display');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initNumericDisplayDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultNumericDisplayComponent({
        name: nextNumericDisplayName(canvas?.components),
        ...overrides
      });
      fillNumericDisplayForm(comp);
      window.resetPropsDialogState('numeric', readNumericDisplayForm, 'applyNumericDisplay');
      switchTab('general');
      wireNumericDisplayTools();
      presentNumericDisplayDialog();
      const previewComp = readNumericDisplayForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readNumericDisplayForm, 'applyNumericDisplay');
    } catch (err) {
      window.setStatus(`Numeric Display properties error: ${err.message}`);
    }
  }

  async function applyNumericDisplay() {
    const comp = readNumericDisplayForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readNumericDisplayForm, 'applyNumericDisplay');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveNumericDisplay(e) {
    e.preventDefault();
    const comp = readNumericDisplayForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    ndDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('numericDisplayDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function initNumericDisplayDialog() {
    const form = document.getElementById('numericDisplayForm');
    if (!form || form.dataset.ndWired === '1') return;
    form.dataset.ndWired = '1';
    fillNdRangeSelect('ndNumberOfDigits', 1, 17, 5, 'ndDigitsFilled');
    fillNdRangeSelect('ndDecimalPlaces', 0, 15, 0, 'ndDecFilled');
    window.StudioPropsShared?.fillPatternSelect('ndPatternStyle', 'ndFilled');
    form.addEventListener('submit', (e) => saveNumericDisplay(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyNumericDisplay')?.addEventListener('click', () => {
      applyNumericDisplay().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleNumericLivePreview();
      window.flushPropsApplyButton?.(readNumericDisplayForm, 'applyNumericDisplay');
    });
    form.addEventListener('change', () => {
      syncNumericDisplayFields();
      scheduleNumericLivePreview();
      window.flushPropsApplyButton?.(readNumericDisplayForm, 'applyNumericDisplay');
    });
    document.getElementById('cancelNumericDisplay')?.addEventListener('click', () => {
      document.getElementById('numericDisplayDialog')?.close();
    });
    document.getElementById('numericDisplayDialog')?.addEventListener('close', () => {
      if (!ndDialogCommitted) window.revertPropsDialogPreview?.();
      ndDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpNumericDisplay')?.addEventListener('click', () => {
      alert('Numeric Display shows a tag value with configurable digits, fill, decimal places, and appearance. Polarity inverts the sign when the Polarity connection is on.');
    });
    document.querySelectorAll('#numericDisplayDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.ndTab));
    });
    for (const id of ['ndUsePatternColor', 'ndUseForeColor']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncNumericDisplayFields();
        scheduleNumericLivePreview();
      });
    }
    for (const id of ['ndBold', 'ndItalic', 'ndUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleNumericLivePreview();
      });
    }
  }

  window.StudioNumericDisplay = {
    initNumericDisplayDialog,
    presentNumericDisplayDialog,
    scheduleNumericLivePreview,
    showNumericDisplayDialog,
    fillNumericDisplayForm,
    readNumericDisplayForm,
    switchNumericDisplayTab: switchTab,
    wireNumericDisplayTools
  };
})();
