/** Rectangle (Polygon) property dialog — FactoryTalk-style */
(function () {
  let shapePreviewTimer = null;

  function scheduleShapeLivePreview() {
    if (window.state?.propsFormFill) return;
    if (shapePreviewTimer) clearTimeout(shapePreviewTimer);
    shapePreviewTimer = setTimeout(() => {
      shapePreviewTimer = null;
      const comp = readShapePropertiesForm();
      if (comp.name && window.previewPatchByName) {
        window.previewPatchByName(comp.name, comp);
      }
      window.updatePropsApplyButton?.(readShapePropertiesForm, 'applyShapeProperties');
    }, 100);
  }

  function notifyShapeFormChange() {
    scheduleShapeLivePreview();
    window.flushPropsApplyButton?.(readShapePropertiesForm, 'applyShapeProperties');
    window.updatePropsApplyButton?.(readShapePropertiesForm, 'applyShapeProperties');
  }

  function wireColorInputs() {
    document.querySelectorAll('#shapePropertiesForm .ft-color-input').forEach((input) => {
      if (input.dataset.spColorWired === '1') return;
      input.dataset.spColorWired = '1';
      input.addEventListener('input', notifyShapeFormChange);
      input.addEventListener('change', notifyShapeFormChange);
    });
  }

  function titleForType() {
    return 'Polygon Properties';
  }

  function syncForeColorHint() {
    const lineW = Number(document.getElementById('spLineWidth')?.value) || 0;
    const hint = document.getElementById('spForeColorHint');
    if (hint) {
      hint.classList.toggle('hidden', lineW > 0);
    }
  }

  function switchTab(tabId) {
    document.querySelectorAll('#shapePropertiesDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.spTab === tabId);
    });
    document.querySelectorAll('#shapePropertiesDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.spTabPanel === tabId);
    });
  }

  function syncGradientFields() {
    const isGradient = document.getElementById('spBackStyle')?.value === 'gradient';
    document.getElementById('spGradientExtras')?.classList.toggle('hidden', !isGradient);
    const solid = document.getElementById('spBackStyle')?.value === 'solid';
    const useBack = document.getElementById('spUseBackColor');
    if (useBack) useBack.disabled = !solid && !isGradient;
    if (!solid && !isGradient && useBack) useBack.checked = false;
  }

  function syncShapeTypeFields() {
    syncGradientFields();
  }

  function syncColorFields() {
    document.getElementById('spForeColor').disabled = !document.getElementById('spUseForeColor')?.checked;
    document.getElementById('spBackColor').disabled = !document.getElementById('spUseBackColor')?.checked;
    document.getElementById('spPatternColor').disabled = !document.getElementById('spUsePatternColor')?.checked;
    document.getElementById('spEndColor').disabled = !document.getElementById('spUseBackColor')?.checked;
    syncGradientFields();
  }

  function wireTools() {
    const dialog = document.getElementById('shapePropertiesDialog');
    if (window.FtColorPicker) {
      window.FtColorPicker.initAllSync(dialog);
      window.FtColorPicker.refreshAll(dialog);
    }
    wireColorInputs();
    syncColorFields();
    syncForeColorHint();
    if (window.FtColorPicker) window.FtColorPicker.refreshAll(dialog);
  }

  function fillShapePropertiesForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      document.getElementById('shapePropertiesTitle').textContent = titleForType();
      document.getElementById('spLineStyle').value = comp.lineStyle || 'solid';
      document.getElementById('spBackStyle').value = comp.backStyle || 'solid';
      document.getElementById('spPatternStyle').value = comp.patternStyle || 'none';
      document.getElementById('spUseForeColor').checked = comp.useForeColor !== false;
      setColorFieldValue('spForeColor', comp.foreColor || comp.borderColor || '#c6c6c6');
      document.getElementById('spUseBackColor').checked = comp.useBackColor !== false;
      setColorFieldValue('spBackColor', comp.backColor || '#ffffff');
      setColorFieldValue('spEndColor', comp.endColor || '#e8e8e8');
      document.getElementById('spGradientStop').value = comp.gradientStop ?? 95;
      document.getElementById('spGradientDir').value = comp.gradientShadingStyle || comp.gradientDirection || 'gradientHorizontalFromRight';
      document.getElementById('spUsePatternColor').checked = Boolean(comp.usePatternColor);
      setColorFieldValue('spPatternColor', comp.patternColor || '#ffffff');
      document.getElementById('spLineWidth').value = comp.lineWidth ?? comp.borderWidth ?? 1;
      document.getElementById('spHeight').value = comp.height ?? 34;
      document.getElementById('spWidth').value = comp.width ?? 262;
      document.getElementById('spTop').value = comp.top ?? 0;
      document.getElementById('spLeft').value = comp.left ?? 0;
      document.getElementById('spName').value = comp.name || 'Rectangle1';
      document.getElementById('spVisible').checked = comp.visible !== false;
      syncShapeTypeFields();
      syncColorFields();
      syncForeColorHint();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function setColorFieldValue(id, raw) {
    const input = document.getElementById(id);
    if (!input) return;
    if (window.FtColorPicker?.setValueSilent) {
      window.FtColorPicker.setValueSilent(input, raw);
    } else {
      input.value = raw;
    }
  }

  function getColorFieldValue(id) {
    const input = document.getElementById(id);
    if (!input) return '#000000';
    return window.FtColorPicker?.getInputColor?.(input) ?? input.value;
  }

  function readShapePropertiesForm() {
    const backStyle = document.getElementById('spBackStyle').value;
    const norm = window.FtColorPicker?.normalizeColor || ((v) => v);
    const comp = {
      type: 'Rectangle',
      name: document.getElementById('spName').value.trim() || 'Rectangle1',
      left: Number(document.getElementById('spLeft').value) || 0,
      top: Number(document.getElementById('spTop').value) || 0,
      width: Number(document.getElementById('spWidth').value) || 64,
      height: Number(document.getElementById('spHeight').value) || 64,
      visible: document.getElementById('spVisible').checked,
      lineStyle: document.getElementById('spLineStyle').value,
      backStyle,
      patternStyle: document.getElementById('spPatternStyle').value,
      useForeColor: document.getElementById('spUseForeColor').checked,
      foreColor: norm(getColorFieldValue('spForeColor')),
      useBackColor: document.getElementById('spUseBackColor').checked,
      backColor: norm(getColorFieldValue('spBackColor')),
      usePatternColor: document.getElementById('spUsePatternColor').checked,
      patternColor: norm(getColorFieldValue('spPatternColor')),
      lineWidth: Number(document.getElementById('spLineWidth').value) || 0
    };
    if (backStyle === 'gradient') {
      comp.endColor = norm(getColorFieldValue('spEndColor'));
      comp.gradientStop = Number(document.getElementById('spGradientStop').value) || 95;
      comp.gradientShadingStyle = document.getElementById('spGradientDir').value;
    }
    return comp;
  }

  async function applyShapeProperties() {
    const comp = readShapePropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readShapePropertiesForm, 'applyShapeProperties');
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveShapeProperties(e) {
    e.preventDefault();
    const comp = readShapePropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    document.getElementById('shapePropertiesDialog').close();
    window.clearPropsDialogState();
    window.setStatus(`Saved ${comp.name}`);
  }

  function initShapePropertiesDialog() {
    const form = document.getElementById('shapePropertiesForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveShapeProperties(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyShapeProperties')?.addEventListener('click', () => {
      applyShapeProperties().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      syncForeColorHint();
      scheduleShapeLivePreview();
      window.flushPropsApplyButton?.(readShapePropertiesForm, 'applyShapeProperties');
    });
    form.addEventListener('change', () => {
      syncShapeTypeFields();
      syncColorFields();
      syncForeColorHint();
      scheduleShapeLivePreview();
      window.flushPropsApplyButton?.(readShapePropertiesForm, 'applyShapeProperties');
    });
    document.getElementById('spBackStyle')?.addEventListener('change', syncShapeTypeFields);
    document.getElementById('cancelShapeProperties')?.addEventListener('click', () => {
      window.revertPropsDialogPreview?.();
      document.getElementById('shapePropertiesDialog')?.close();
      window.clearPropsDialogState();
    });
    document.getElementById('helpShapeProperties')?.addEventListener('click', () => {
      alert('Polygon Properties define line style, fill, pattern, and border width — matching FactoryTalk View rectangle objects.');
    });
    document.querySelectorAll('#shapePropertiesDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.spTab));
    });
  }

  function openShapePropertiesDialog(comp, ref, editIndex) {
    window.flushDeferredDialogInits?.();
    fillShapePropertiesForm(comp);
    wireTools();
    window.resetPropsDialogState('shape', readShapePropertiesForm, 'applyShapeProperties', editIndex, ref);
    switchTab('general');
    window.setTemplateEditStatus?.(comp.name, ref);
    document.getElementById('shapePropertiesDialog')?.showModal();
    window.flushPropsApplyButton?.(readShapePropertiesForm, 'applyShapeProperties');
  }

  window.StudioShapeProperties = {
    fillShapePropertiesForm,
    readShapePropertiesForm,
    switchShapePropertiesTab: switchTab,
    wireShapePropertiesTools: wireTools,
    openShapePropertiesDialog,
    initShapePropertiesDialog
  };
})();
