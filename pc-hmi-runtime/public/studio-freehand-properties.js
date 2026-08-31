/** Freehand property dialog — FactoryTalk View style (General / Common tabs). */
(function () {
  const S = window.StudioPropsShared;
  let freehandPreviewTimer = null;
  let lastFreehandSize = { width: 166, height: 71 };

  function scheduleFreehandLivePreview() {
    if (window.state?.propsFormFill) return;
    if (freehandPreviewTimer) clearTimeout(freehandPreviewTimer);
    freehandPreviewTimer = setTimeout(() => {
      freehandPreviewTimer = null;
      const comp = readFreehandPropertiesForm();
      if (window.state?.propsDialog?.editIndex == null) {
        window.updateFreehandStudioPreview?.(comp);
      } else {
        window.hideFreehandStudioPreview?.();
      }
      S.previewShape(comp, readFreehandPropertiesForm, 'applyFreehandProperties');
    }, 100);
  }

  function notifyFreehandFormChange() {
    scheduleFreehandLivePreview();
    window.flushPropsApplyButton?.(readFreehandPropertiesForm, 'applyFreehandProperties');
  }

  function wireColorInputs() {
    S.wireColorInputs('#freehandPropertiesForm', 'fhColorWired', notifyFreehandFormChange);
  }

  function switchTab(tabId) {
    S.switchDialogTab('freehandPropertiesDialog', 'fhTab', 'fhTabPanel', tabId);
  }

  function syncGradientFields() {
    S.syncGradientExtras('fhBackStyle', 'fhGradientExtras');
  }

  function syncPatternFields() {
    const pattern = document.getElementById('fhPatternStyle')?.value || 'none';
    if (pattern !== 'none') {
      document.getElementById('fhUsePatternColor').checked = true;
    }
    syncColorFields();
  }

  function syncColorFields() {
    const pattern = document.getElementById('fhPatternStyle')?.value || 'none';
    document.getElementById('fhPatternColor').disabled = pattern === 'none';
    document.getElementById('fhEndColor').disabled = document.getElementById('fhBackStyle')?.value !== 'gradient';
    syncGradientFields();
  }

  function wireTools() {
    const dialog = document.getElementById('freehandPropertiesDialog');
    S.wireColorPicker(dialog);
    wireColorInputs();
    syncColorFields();
    S.wireColorPicker(dialog);
  }

  function fillFreehandPropertiesForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    const c = {
      lineStyle: 'solid',
      backStyle: 'transparent',
      patternStyle: 'none',
      foreColor: '#000000',
      backColor: '#808080',
      patternColor: '#808080',
      useForeColor: true,
      useBackColor: true,
      usePatternColor: false,
      lineWidth: 1,
      width: 166,
      height: 71,
      left: 0,
      top: 0,
      visible: true,
      points: [],
      ...comp
    };
    try {
      document.getElementById('fhLineStyle').value = c.lineStyle || 'solid';
      document.getElementById('fhBackStyle').value = c.backStyle || 'solid';
      document.getElementById('fhPatternStyle').value = c.patternStyle || 'none';
      S.setColorFieldValue('fhForeColor', c.foreColor || '#000000');
      S.setColorFieldValue('fhBackColor', c.backColor || '#808080');
      S.setColorFieldValue('fhPatternColor', c.patternColor || '#808080');
      document.getElementById('fhUsePatternColor').checked = Boolean(c.usePatternColor) || (c.patternStyle && c.patternStyle !== 'none');
      S.setColorFieldValue('fhEndColor', c.endColor || '#e8e8e8');
      document.getElementById('fhGradientStop').value = c.gradientStop ?? 95;
      document.getElementById('fhGradientDir').value = c.gradientShadingStyle || c.gradientDirection || 'gradientHorizontalFromRight';
      document.getElementById('fhLineWidth').value = c.lineWidth ?? 1;
      document.getElementById('fhHeight').value = c.height ?? 71;
      document.getElementById('fhWidth').value = c.width ?? 166;
      document.getElementById('fhTop').value = c.top ?? 0;
      document.getElementById('fhLeft').value = c.left ?? 0;
      document.getElementById('fhName').value = c.name || 'Freehand1';
      document.getElementById('fhVisible').checked = c.visible !== false;
      if (Array.isArray(c.points)) {
        document.getElementById('freehandPointsData').value = JSON.stringify(c.points);
      }
      lastFreehandSize = {
        width: Number(c.width) || 166,
        height: Number(c.height) || 71
      };
      syncPatternFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readFreehandPropertiesForm() {
    const backStyle = document.getElementById('fhBackStyle').value;
    const patternStyle = document.getElementById('fhPatternStyle').value;
    const norm = window.FtColorPicker?.normalizeColor || ((v) => v);
    let points = [];
    try {
      points = JSON.parse(document.getElementById('freehandPointsData')?.value || '[]');
    } catch {
      points = [];
    }
    const width = Number(document.getElementById('fhWidth').value) || 64;
    const height = Number(document.getElementById('fhHeight').value) || 64;
    const oldW = lastFreehandSize.width || width;
    const oldH = lastFreehandSize.height || height;
    if (points.length && (Math.abs(width / oldW - 1) > 0.0001 || Math.abs(height / oldH - 1) > 0.0001)) {
      const sx = width / oldW;
      const sy = height / oldH;
      points = points.map((p) => ({ x: p.x * sx, y: p.y * sy }));
    }
    const comp = {
      type: 'Freehand',
      name: document.getElementById('fhName').value.trim() || 'Freehand1',
      left: Number(document.getElementById('fhLeft').value) || 0,
      top: Number(document.getElementById('fhTop').value) || 0,
      width,
      height,
      visible: document.getElementById('fhVisible').checked,
      lineStyle: document.getElementById('fhLineStyle').value,
      backStyle,
      patternStyle,
      useForeColor: true,
      foreColor: norm(S.getColorFieldValue('fhForeColor')),
      useBackColor: backStyle !== 'transparent',
      backColor: norm(S.getColorFieldValue('fhBackColor')),
      usePatternColor: patternStyle !== 'none' && document.getElementById('fhUsePatternColor').checked,
      patternColor: norm(S.getColorFieldValue('fhPatternColor')),
      lineWidth: Number(document.getElementById('fhLineWidth').value) || 0,
      points
    };
    if (backStyle === 'gradient') {
      comp.endColor = norm(S.getColorFieldValue('fhEndColor'));
      comp.gradientStop = Number(document.getElementById('fhGradientStop').value) || 95;
      comp.gradientShadingStyle = document.getElementById('fhGradientDir').value;
    }
    return comp;
  }

  async function applyFreehandProperties() {
    const comp = readFreehandPropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readFreehandPropertiesForm, 'applyFreehandProperties');
    window.hideFreehandStudioPreview?.();
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveFreehandProperties(e) {
    e.preventDefault();
    const comp = readFreehandPropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    document.getElementById('freehandPropertiesDialog')?.close();
    window.hideFreehandStudioPreview?.();
    window.clearPropsDialogState();
    window.scheduleRefreshCanvasEditOverlay?.();
    window.setStatus(`Saved ${comp.name}`);
  }

  function initFreehandPropertiesDialog() {
    const form = document.getElementById('freehandPropertiesForm');
    if (!form || form.dataset.fhWired === '1') return;
    form.dataset.fhWired = '1';
    S.fillPatternSelect('fhPatternStyle', 'fhFilled');
    form.addEventListener('submit', (e) => saveFreehandProperties(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyFreehandProperties')?.addEventListener('click', () => {
      applyFreehandProperties().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleFreehandLivePreview();
      window.flushPropsApplyButton?.(readFreehandPropertiesForm, 'applyFreehandProperties');
    });
    form.addEventListener('change', () => {
      syncPatternFields();
      scheduleFreehandLivePreview();
      window.flushPropsApplyButton?.(readFreehandPropertiesForm, 'applyFreehandProperties');
    });
    document.getElementById('cancelFreehandProperties')?.addEventListener('click', () => {
      window.revertPropsDialogPreview?.();
      window.hideFreehandStudioPreview?.();
      document.getElementById('freehandPropertiesDialog')?.close();
      window.clearPropsDialogState();
    });
    document.getElementById('helpFreehandProperties')?.addEventListener('click', () => {
      alert('Freehand Properties define line style, fill, pattern, and line width — matching FactoryTalk View freehand objects.');
    });
    document.querySelectorAll('#freehandPropertiesDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.fhTab));
    });
  }

  function openFreehandPropertiesDialog(comp, ref, editIndex) {
    window.flushDeferredDialogInits?.();
    initFreehandPropertiesDialog();
    fillFreehandPropertiesForm(comp);
    wireTools();
    const idx = S.resolvedEditIndex(comp, ref, editIndex);
    window.resetPropsDialogState('freehand', readFreehandPropertiesForm, 'applyFreehandProperties', idx, ref);
    switchTab('general');
    window.setTemplateEditStatus?.(comp.name, ref);
    window.showCanvasPropsDialog?.(document.getElementById('freehandPropertiesDialog'));
    const previewComp = readFreehandPropertiesForm();
    if (idx == null) {
      window.updateFreehandStudioPreview?.(previewComp);
    } else {
      window.hideFreehandStudioPreview?.();
    }
    S.previewShape(previewComp, readFreehandPropertiesForm, 'applyFreehandProperties');
  }

  window.StudioFreehandProperties = {
    fillFreehandPropertiesForm,
    readFreehandPropertiesForm,
    openFreehandPropertiesDialog,
    initFreehandPropertiesDialog
  };
})();
