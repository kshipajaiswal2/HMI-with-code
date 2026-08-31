/** Rectangle / Rounded Rectangle / Wedge property dialog — FactoryTalk-style */
(function () {
  const S = window.StudioPropsShared;
  let shapePreviewTimer = null;
  let activeShapeType = 'Rectangle';
  let lastAngleFields = { startAngle: 0, sweepAngle: 360 };

  function resolveShapeType(type) {
    if (type === 'RoundedRectangle') return 'RoundedRectangle';
    if (type === 'Wedge') return 'Wedge';
    return 'Rectangle';
  }

  function isRoundedType(type) {
    return resolveShapeType(type) === 'RoundedRectangle';
  }

  function isWedgeType(type) {
    return resolveShapeType(type) === 'Wedge';
  }

  function defaultNameForType() {
    if (isWedgeType(activeShapeType)) return 'Wedge1';
    if (isRoundedType(activeShapeType)) return 'RoundedRectangle1';
    return 'Rectangle1';
  }

  function titleForType() {
    if (isWedgeType(activeShapeType)) return 'Wedge Properties';
    if (isRoundedType(activeShapeType)) return 'Rounded Rectangle Properties';
    return 'Rectangle Properties';
  }

  function defaultForeColor() {
    return isWedgeType(activeShapeType) ? '#808080' : '#000000';
  }

  function defaultBackColor() {
    return isRoundedType(activeShapeType) ? '#ffffff' : '#c0c0c0';
  }

  function scheduleShapeLivePreview() {
    if (window.state?.propsFormFill) return;
    if (shapePreviewTimer) clearTimeout(shapePreviewTimer);
    shapePreviewTimer = setTimeout(() => {
      shapePreviewTimer = null;
      S.previewShape(readShapePropertiesForm(), readShapePropertiesForm, 'applyShapeProperties');
    }, 100);
  }

  function notifyShapeFormChange() {
    scheduleShapeLivePreview();
    window.flushPropsApplyButton?.(readShapePropertiesForm, 'applyShapeProperties');
    window.updatePropsApplyButton?.(readShapePropertiesForm, 'applyShapeProperties');
  }

  function wireColorInputs() {
    S.wireColorInputs('#shapePropertiesForm', 'spColorWired', notifyShapeFormChange);
  }

  function normalizeRectPatternStyle(value) {
    const map = {
      horizontal: 'horizontalLines',
      vertical: 'verticalLines',
      cross: 'hatch',
      '50Percent': 'checks',
      percent50: 'checks'
    };
    return map[value] || value || 'none';
  }

  function syncForeColorHint() {
    const lineW = Number(document.getElementById('spLineWidth')?.value) || 0;
    const hint = document.getElementById('spForeColorHint');
    if (hint) {
      hint.classList.toggle('hidden', isWedgeType(activeShapeType) || lineW > 0);
    }
  }

  function switchTab(tabId) {
    S.switchDialogTab('shapePropertiesDialog', 'spTab', 'spTabPanel', tabId);
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

  function syncPatternFields() {
    const pattern = document.getElementById('spPatternStyle')?.value || 'none';
    if (pattern !== 'none') {
      const usePat = document.getElementById('spUsePatternColor');
      if (usePat) usePat.checked = true;
    }
    syncColorFields();
  }

  function syncColorFields() {
    document.getElementById('spForeColor').disabled = !document.getElementById('spUseForeColor')?.checked;
    document.getElementById('spBackColor').disabled = !document.getElementById('spUseBackColor')?.checked;
    document.getElementById('spPatternColor').disabled = !document.getElementById('spUsePatternColor')?.checked;
    const isGradient = document.getElementById('spBackStyle')?.value === 'gradient';
    document.getElementById('spEndColor').disabled = !document.getElementById('spUseBackColor')?.checked || !isGradient;
    syncGradientFields();
  }

  function wireTools() {
    const dialog = document.getElementById('shapePropertiesDialog');
    S.wireColorPicker(dialog);
    wireColorInputs();
    syncColorFields();
    syncForeColorHint();
    S.wireColorPicker(dialog);
  }

  function fillShapePropertiesForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      if (comp?.type) activeShapeType = resolveShapeType(comp.type);
      lastAngleFields = {
        startAngle: comp?.startAngle ?? 0,
        sweepAngle: comp?.sweepAngle ?? 360
      };
      S.fillPatternSelect('spPatternStyle', 'spFilled');
      document.getElementById('shapePropertiesTitle').textContent = titleForType();
      document.getElementById('spLineStyle').value = comp.lineStyle || 'solid';
      document.getElementById('spBackStyle').value = comp.backStyle || 'solid';
      document.getElementById('spPatternStyle').value = normalizeRectPatternStyle(comp.patternStyle);
      document.getElementById('spUseForeColor').checked = comp.useForeColor !== false;
      S.setColorFieldValue('spForeColor', comp.foreColor || comp.borderColor || defaultForeColor());
      document.getElementById('spUseBackColor').checked = comp.useBackColor !== false;
      S.setColorFieldValue('spBackColor', comp.backColor || defaultBackColor());
      S.setColorFieldValue('spEndColor', comp.endColor || '#e8e8e8');
      document.getElementById('spGradientStop').value = comp.gradientStop ?? 95;
      document.getElementById('spGradientDir').value = comp.gradientShadingStyle || comp.gradientDirection || 'gradientHorizontalFromRight';
      document.getElementById('spUsePatternColor').checked = Boolean(comp.usePatternColor);
      S.setColorFieldValue('spPatternColor', comp.patternColor || '#ffffff');
      document.getElementById('spLineWidth').value = comp.lineWidth ?? comp.borderWidth ?? 1;
      document.getElementById('spHeight').value = comp.height ?? (isWedgeType(activeShapeType) ? 131 : 34);
      document.getElementById('spWidth').value = comp.width ?? (isWedgeType(activeShapeType) ? 208 : 262);
      document.getElementById('spTop').value = comp.top ?? 0;
      document.getElementById('spLeft').value = comp.left ?? 0;
      document.getElementById('spName').value = comp.name || defaultNameForType();
      document.getElementById('spVisible').checked = comp.visible !== false;
      syncShapeTypeFields();
      syncPatternFields();
      syncForeColorHint();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readShapePropertiesForm() {
    const backStyle = document.getElementById('spBackStyle').value;
    const norm = window.FtColorPicker?.normalizeColor || ((v) => v);
    const type = resolveShapeType(activeShapeType);
    const comp = {
      type,
      name: document.getElementById('spName').value.trim() || defaultNameForType(),
      left: Number(document.getElementById('spLeft').value) || 0,
      top: Number(document.getElementById('spTop').value) || 0,
      width: Number(document.getElementById('spWidth').value) || 64,
      height: Number(document.getElementById('spHeight').value) || 64,
      visible: document.getElementById('spVisible').checked,
      lineStyle: document.getElementById('spLineStyle').value,
      backStyle,
      patternStyle: document.getElementById('spPatternStyle').value,
      useForeColor: document.getElementById('spUseForeColor').checked,
      foreColor: norm(S.getColorFieldValue('spForeColor')),
      useBackColor: document.getElementById('spUseBackColor').checked,
      backColor: norm(S.getColorFieldValue('spBackColor')),
      usePatternColor: document.getElementById('spUsePatternColor').checked,
      patternColor: norm(S.getColorFieldValue('spPatternColor')),
      lineWidth: Number(document.getElementById('spLineWidth').value) || 0
    };
    if (type === 'Wedge') {
      comp.startAngle = lastAngleFields.startAngle ?? 0;
      comp.sweepAngle = lastAngleFields.sweepAngle ?? 360;
    }
    if (backStyle === 'gradient') {
      comp.endColor = norm(S.getColorFieldValue('spEndColor'));
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
    window.afterCanvasComponentSaved?.(comp);
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
    window.activateSelectTool?.(`Saved ${comp.name}`);
  }

  function initShapePropertiesDialog() {
    const form = document.getElementById('shapePropertiesForm');
    if (!form || form.dataset.spWired === '1') return;
    form.dataset.spWired = '1';
    S.fillPatternSelect('spPatternStyle', 'spFilled');
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
      syncPatternFields();
      syncForeColorHint();
      scheduleShapeLivePreview();
      window.flushPropsApplyButton?.(readShapePropertiesForm, 'applyShapeProperties');
    });
    document.getElementById('spBackStyle')?.addEventListener('change', syncShapeTypeFields);
    document.getElementById('cancelShapeProperties')?.addEventListener('click', () => {
      window.revertPropsDialogPreview?.();
      document.getElementById('shapePropertiesDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool?.();
    });
    document.getElementById('shapePropertiesDialog')?.addEventListener('close', () => {
      window.activateSelectTool?.();
    });
    document.getElementById('helpShapeProperties')?.addEventListener('click', () => {
      alert(`${titleForType()} define line style, fill, pattern, and line width.`);
    });
    document.querySelectorAll('#shapePropertiesDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.spTab));
    });
  }

  function openShapePropertiesDialog(comp, ref, editIndex) {
    window.flushDeferredDialogInits?.();
    initShapePropertiesDialog();
    activeShapeType = resolveShapeType(comp?.type);
    fillShapePropertiesForm(comp);
    wireTools();
    const idx = S.resolvedEditIndex(comp, ref, editIndex);
    window.resetPropsDialogState('shape', readShapePropertiesForm, 'applyShapeProperties', idx, ref);
    switchTab('general');
    window.setTemplateEditStatus?.(comp.name, ref);
    window.showCanvasPropsDialog?.(document.getElementById('shapePropertiesDialog'));
    window.flushPropsApplyButton?.(readShapePropertiesForm, 'applyShapeProperties');
    if (idx == null) scheduleShapeLivePreview();
  }

  window.StudioShapeProperties = {
    readShapePropertiesForm,
    openShapePropertiesDialog,
    initShapePropertiesDialog
  };
})();
