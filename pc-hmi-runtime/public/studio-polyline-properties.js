/** Polyline property dialog — FactoryTalk View style (General / Common tabs). */
(function () {
  const S = window.StudioPropsShared;
  let polylinePreviewTimer = null;

  function parsePoints() {
    try {
      const points = JSON.parse(document.getElementById('plPointsData')?.value || '[]');
      return Array.isArray(points) ? points : [];
    } catch {
      return [];
    }
  }

  function schedulePolylineLivePreview() {
    if (window.state?.propsFormFill) return;
    if (polylinePreviewTimer) clearTimeout(polylinePreviewTimer);
    polylinePreviewTimer = setTimeout(() => {
      polylinePreviewTimer = null;
      const comp = readPolylinePropertiesForm();
      window.hideFreehandStudioPreview?.();
      S.previewShape(comp, readPolylinePropertiesForm, 'applyPolylineProperties');
      window.flushPropsApplyButton?.(readPolylinePropertiesForm, 'applyPolylineProperties');
    }, 100);
  }

  function notifyPolylineFormChange() {
    schedulePolylineLivePreview();
    window.flushPropsApplyButton?.(readPolylinePropertiesForm, 'applyPolylineProperties');
  }

  function wireColorInputs() {
    S.wireColorInputs('#polylinePropertiesForm', 'plColorWired', notifyPolylineFormChange);
  }

  function switchTab(tabId) {
    S.switchDialogTab('polylinePropertiesDialog', 'plTab', 'plTabPanel', tabId);
  }

  function syncGradientFields() {
    S.syncGradientExtras('plBackStyle', 'plGradientExtras');
  }

  function syncPatternFields() {
    const pattern = document.getElementById('plPatternStyle')?.value || 'none';
    if (pattern !== 'none') {
      const usePat = document.getElementById('plUsePatternColor');
      if (usePat) usePat.checked = true;
    }
    syncColorFields();
  }

  function syncColorFields() {
    const pattern = document.getElementById('plPatternStyle')?.value || 'none';
    const patternColor = document.getElementById('plPatternColor');
    if (patternColor) patternColor.disabled = pattern === 'none';
    const endColor = document.getElementById('plEndColor');
    if (endColor) endColor.disabled = document.getElementById('plBackStyle')?.value !== 'gradient';
    syncGradientFields();
  }

  function wireTools() {
    const dialog = document.getElementById('polylinePropertiesDialog');
    S.wireColorPicker(dialog);
    wireColorInputs();
    syncColorFields();
    S.wireColorPicker(dialog);
  }

  function fillPolylinePropertiesForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    const c = {
      lineStyle: 'solid',
      backStyle: 'solid',
      patternStyle: 'none',
      foreColor: '#808080',
      backColor: '#c0c0c0',
      patternColor: '#ffffff',
      useForeColor: true,
      useBackColor: true,
      usePatternColor: false,
      lineWidth: 1,
      width: 231,
      height: 116,
      left: 0,
      top: 0,
      visible: true,
      points: [],
      ...comp
    };
    try {
      document.getElementById('plLineStyle').value = c.lineStyle || 'solid';
      document.getElementById('plBackStyle').value = c.backStyle || 'solid';
      document.getElementById('plPatternStyle').value = c.patternStyle || 'none';
      S.setColorFieldValue('plForeColor', c.foreColor || '#808080');
      S.setColorFieldValue('plBackColor', c.backColor || '#c0c0c0');
      S.setColorFieldValue('plPatternColor', c.patternColor || '#ffffff');
      document.getElementById('plUsePatternColor').checked = Boolean(c.usePatternColor) || (c.patternStyle && c.patternStyle !== 'none');
      S.setColorFieldValue('plEndColor', c.endColor || '#e8e8e8');
      document.getElementById('plGradientStop').value = c.gradientStop ?? 95;
      document.getElementById('plGradientDir').value = c.gradientShadingStyle || c.gradientDirection || 'gradientHorizontalFromRight';
      document.getElementById('plLineWidth').value = c.lineWidth ?? 1;
      document.getElementById('plHeight').value = c.height ?? 116;
      document.getElementById('plWidth').value = c.width ?? 231;
      document.getElementById('plTop').value = c.top ?? 0;
      document.getElementById('plLeft').value = c.left ?? 0;
      document.getElementById('plName').value = c.name || 'Polyline1';
      document.getElementById('plVisible').checked = c.visible !== false;
      document.getElementById('plOrigWidth').value = String(c.width ?? 231);
      document.getElementById('plOrigHeight').value = String(c.height ?? 116);
      if (Array.isArray(c.points)) {
        document.getElementById('plPointsData').value = JSON.stringify(c.points);
      }
      syncPatternFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readPolylinePropertiesForm() {
    const backStyle = document.getElementById('plBackStyle').value;
    const patternStyle = document.getElementById('plPatternStyle').value;
    const norm = window.FtColorPicker?.normalizeColor || ((v) => v);
    const width = Number(document.getElementById('plWidth').value) || 1;
    const height = Number(document.getElementById('plHeight').value) || 1;
    const origW = Number(document.getElementById('plOrigWidth').value) || width;
    const origH = Number(document.getElementById('plOrigHeight').value) || height;
    let points = parsePoints();
    if (origW > 0 && origH > 0 && (width !== origW || height !== origH) && points.length) {
      const sx = width / origW;
      const sy = height / origH;
      points = points.map((p) => ({ x: Number(p.x) * sx, y: Number(p.y) * sy }));
    }
    const comp = {
      type: 'Polyline',
      name: document.getElementById('plName').value.trim() || 'Polyline1',
      left: Number(document.getElementById('plLeft').value) || 0,
      top: Number(document.getElementById('plTop').value) || 0,
      width,
      height,
      visible: document.getElementById('plVisible').checked,
      lineStyle: document.getElementById('plLineStyle').value,
      backStyle,
      patternStyle,
      useForeColor: true,
      foreColor: norm(S.getColorFieldValue('plForeColor')),
      useBackColor: backStyle !== 'transparent',
      backColor: norm(S.getColorFieldValue('plBackColor')),
      usePatternColor: patternStyle !== 'none' && document.getElementById('plUsePatternColor').checked,
      patternColor: norm(S.getColorFieldValue('plPatternColor')),
      lineWidth: Number(document.getElementById('plLineWidth').value) || 0,
      points
    };
    if (backStyle === 'gradient') {
      comp.endColor = norm(S.getColorFieldValue('plEndColor'));
      comp.gradientStop = Number(document.getElementById('plGradientStop').value) || 95;
      comp.gradientShadingStyle = document.getElementById('plGradientDir').value;
    }
    return comp;
  }

  function rememberPolylinePoints(comp) {
    document.getElementById('plOrigWidth').value = String(comp.width);
    document.getElementById('plOrigHeight').value = String(comp.height);
    if (Array.isArray(comp.points)) {
      document.getElementById('plPointsData').value = JSON.stringify(comp.points);
    }
  }

  async function applyPolylineProperties() {
    const comp = readPolylinePropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    rememberPolylinePoints(comp);
    window.hideFreehandStudioPreview?.();
    window.commitPropsSnapshot(readPolylinePropertiesForm, 'applyPolylineProperties');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function savePolylineProperties() {
    const comp = readPolylinePropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    window.hideFreehandStudioPreview?.();
    document.getElementById('polylinePropertiesDialog')?.close();
    window.clearPropsDialogState();
    window.scheduleRefreshCanvasEditOverlay?.();
    window.setStatus(`Saved ${comp.name}`);
  }

  function initPolylinePropertiesDialog() {
    const form = document.getElementById('polylinePropertiesForm');
    if (!form || form.dataset.plWired === '1') return;
    form.dataset.plWired = '1';
    S.fillPatternSelect('plPatternStyle', 'plFilled');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      savePolylineProperties().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('applyPolylineProperties')?.addEventListener('click', () => {
      applyPolylineProperties().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', notifyPolylineFormChange);
    form.addEventListener('change', () => {
      syncPatternFields();
      notifyPolylineFormChange();
    });
    document.getElementById('cancelPolylineProperties')?.addEventListener('click', () => {
      window.revertPropsDialogPreview?.();
      window.hideFreehandStudioPreview?.();
      document.getElementById('polylinePropertiesDialog')?.close();
      window.clearPropsDialogState();
    });
    document.getElementById('helpPolylineProperties')?.addEventListener('click', () => {
      alert('Polyline Properties define line style, fill, pattern, and line width. Drag vertices on the display to change the shape.');
    });
    document.querySelectorAll('#polylinePropertiesDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.plTab));
    });
  }

  function openPolylinePropertiesDialog(comp, ref, editIndex) {
    window.flushDeferredDialogInits?.();
    initPolylinePropertiesDialog();
    fillPolylinePropertiesForm(comp);
    wireTools();
    const idx = S.resolvedEditIndex(comp, ref, editIndex);
    window.resetPropsDialogState('polyline', readPolylinePropertiesForm, 'applyPolylineProperties', idx, ref);
    switchTab('general');
    window.setTemplateEditStatus?.(comp.name, ref);
    window.showCanvasPropsDialog?.(document.getElementById('polylinePropertiesDialog'));
    const previewComp = readPolylinePropertiesForm();
    if (idx == null) window.updatePolygonStudioPreview?.(previewComp);
    else window.hideFreehandStudioPreview?.();
    S.previewShape(previewComp, readPolylinePropertiesForm, 'applyPolylineProperties');
    window.flushPropsApplyButton?.(readPolylinePropertiesForm, 'applyPolylineProperties');
  }

  window.StudioPolylineProperties = {
    fillPolylinePropertiesForm,
    readPolylinePropertiesForm,
    openPolylinePropertiesDialog,
    initPolylinePropertiesDialog
  };
})();
