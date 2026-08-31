/** Polygon property dialog — FactoryTalk View style (General / Common tabs). */
(function () {
  const S = window.StudioPropsShared;
  let polygonPreviewTimer = null;

  function parsePoints() {
    try {
      const points = JSON.parse(document.getElementById('pgPointsData')?.value || '[]');
      return Array.isArray(points) ? points : [];
    } catch {
      return [];
    }
  }

  function schedulePolygonLivePreview() {
    if (window.state?.propsFormFill) return;
    if (polygonPreviewTimer) clearTimeout(polygonPreviewTimer);
    polygonPreviewTimer = setTimeout(() => {
      polygonPreviewTimer = null;
      const comp = readPolygonPropertiesForm();
      window.hideFreehandStudioPreview?.();
      S.previewShape(comp, readPolygonPropertiesForm, 'applyPolygonProperties');
      window.flushPropsApplyButton?.(readPolygonPropertiesForm, 'applyPolygonProperties');
    }, 100);
  }

  function notifyPolygonFormChange() {
    schedulePolygonLivePreview();
    window.flushPropsApplyButton?.(readPolygonPropertiesForm, 'applyPolygonProperties');
  }

  function wireColorInputs() {
    S.wireColorInputs('#polygonPropertiesForm', 'pgColorWired', notifyPolygonFormChange);
  }

  function switchTab(tabId) {
    S.switchDialogTab('polygonPropertiesDialog', 'pgTab', 'pgTabPanel', tabId);
  }

  function syncGradientFields() {
    S.syncGradientExtras('pgBackStyle', 'pgGradientExtras');
  }

  function syncPatternFields() {
    const pattern = document.getElementById('pgPatternStyle')?.value || 'none';
    if (pattern !== 'none') {
      const usePat = document.getElementById('pgUsePatternColor');
      if (usePat) usePat.checked = true;
    }
    syncColorFields();
  }

  function syncColorFields() {
    const pattern = document.getElementById('pgPatternStyle')?.value || 'none';
    const patternColor = document.getElementById('pgPatternColor');
    if (patternColor) patternColor.disabled = pattern === 'none';
    const endColor = document.getElementById('pgEndColor');
    if (endColor) endColor.disabled = document.getElementById('pgBackStyle')?.value !== 'gradient';
    syncGradientFields();
  }

  function wireTools() {
    const dialog = document.getElementById('polygonPropertiesDialog');
    S.wireColorPicker(dialog);
    wireColorInputs();
    syncColorFields();
    S.wireColorPicker(dialog);
  }

  function fillPolygonPropertiesForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    const c = {
      lineStyle: 'solid',
      backStyle: 'transparent',
      patternStyle: 'none',
      foreColor: '#000000',
      backColor: '#c0c0c0',
      patternColor: '#000000',
      useForeColor: true,
      useBackColor: false,
      usePatternColor: false,
      lineWidth: 1,
      width: 100,
      height: 80,
      left: 0,
      top: 0,
      visible: true,
      points: [],
      ...comp
    };
    try {
      document.getElementById('pgLineStyle').value = c.lineStyle || 'solid';
      document.getElementById('pgBackStyle').value = c.backStyle || 'transparent';
      document.getElementById('pgPatternStyle').value = c.patternStyle || 'none';
      S.setColorFieldValue('pgForeColor', c.foreColor || '#000000');
      S.setColorFieldValue('pgBackColor', c.backColor || '#c0c0c0');
      S.setColorFieldValue('pgPatternColor', c.patternColor || '#000000');
      document.getElementById('pgUsePatternColor').checked = Boolean(c.usePatternColor) || (c.patternStyle && c.patternStyle !== 'none');
      S.setColorFieldValue('pgEndColor', c.endColor || '#e8e8e8');
      document.getElementById('pgGradientStop').value = c.gradientStop ?? 95;
      document.getElementById('pgGradientDir').value = c.gradientShadingStyle || c.gradientDirection || 'gradientHorizontalFromRight';
      document.getElementById('pgLineWidth').value = c.lineWidth ?? 1;
      document.getElementById('pgHeight').value = c.height ?? 80;
      document.getElementById('pgWidth').value = c.width ?? 100;
      document.getElementById('pgTop').value = c.top ?? 0;
      document.getElementById('pgLeft').value = c.left ?? 0;
      document.getElementById('pgName').value = c.name || 'Polygon1';
      document.getElementById('pgVisible').checked = c.visible !== false;
      document.getElementById('pgOrigWidth').value = String(c.width ?? 100);
      document.getElementById('pgOrigHeight').value = String(c.height ?? 80);
      if (Array.isArray(c.points)) {
        document.getElementById('pgPointsData').value = JSON.stringify(c.points);
      }
      syncPatternFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readPolygonPropertiesForm() {
    const backStyle = document.getElementById('pgBackStyle').value;
    const patternStyle = document.getElementById('pgPatternStyle').value;
    const norm = window.FtColorPicker?.normalizeColor || ((v) => v);
    const width = Number(document.getElementById('pgWidth').value) || 1;
    const height = Number(document.getElementById('pgHeight').value) || 1;
    const origW = Number(document.getElementById('pgOrigWidth').value) || width;
    const origH = Number(document.getElementById('pgOrigHeight').value) || height;
    let points = parsePoints();
    if (origW > 0 && origH > 0 && (width !== origW || height !== origH) && points.length) {
      const sx = width / origW;
      const sy = height / origH;
      points = points.map((p) => ({ x: Number(p.x) * sx, y: Number(p.y) * sy }));
    }
    const comp = {
      type: 'Polygon',
      name: document.getElementById('pgName').value.trim() || 'Polygon1',
      left: Number(document.getElementById('pgLeft').value) || 0,
      top: Number(document.getElementById('pgTop').value) || 0,
      width,
      height,
      visible: document.getElementById('pgVisible').checked,
      lineStyle: document.getElementById('pgLineStyle').value,
      backStyle,
      patternStyle,
      useForeColor: true,
      foreColor: norm(S.getColorFieldValue('pgForeColor')),
      useBackColor: backStyle !== 'transparent',
      backColor: norm(S.getColorFieldValue('pgBackColor')),
      usePatternColor: patternStyle !== 'none' && document.getElementById('pgUsePatternColor').checked,
      patternColor: norm(S.getColorFieldValue('pgPatternColor')),
      lineWidth: Number(document.getElementById('pgLineWidth').value) || 0,
      points
    };
    if (backStyle === 'gradient') {
      comp.endColor = norm(S.getColorFieldValue('pgEndColor'));
      comp.gradientStop = Number(document.getElementById('pgGradientStop').value) || 95;
      comp.gradientShadingStyle = document.getElementById('pgGradientDir').value;
    }
    return comp;
  }

  function rememberPolygonPoints(comp) {
    document.getElementById('pgOrigWidth').value = String(comp.width);
    document.getElementById('pgOrigHeight').value = String(comp.height);
    if (Array.isArray(comp.points)) {
      document.getElementById('pgPointsData').value = JSON.stringify(comp.points);
    }
  }

  async function applyPolygonProperties() {
    const comp = readPolygonPropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    rememberPolygonPoints(comp);
    window.hideFreehandStudioPreview?.();
    window.commitPropsSnapshot(readPolygonPropertiesForm, 'applyPolygonProperties');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function savePolygonProperties() {
    const comp = readPolygonPropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    window.hideFreehandStudioPreview?.();
    document.getElementById('polygonPropertiesDialog')?.close();
    window.clearPropsDialogState();
    window.scheduleRefreshCanvasEditOverlay?.();
    window.setStatus(`Saved ${comp.name}`);
  }

  function initPolygonPropertiesDialog() {
    const form = document.getElementById('polygonPropertiesForm');
    if (!form || form.dataset.pgWired === '1') return;
    form.dataset.pgWired = '1';
    S.fillPatternSelect('pgPatternStyle', 'pgFilled');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      savePolygonProperties().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('applyPolygonProperties')?.addEventListener('click', () => {
      applyPolygonProperties().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', notifyPolygonFormChange);
    form.addEventListener('change', () => {
      syncPatternFields();
      notifyPolygonFormChange();
    });
    document.getElementById('cancelPolygonProperties')?.addEventListener('click', () => {
      window.revertPropsDialogPreview?.();
      window.hideFreehandStudioPreview?.();
      document.getElementById('polygonPropertiesDialog')?.close();
      window.clearPropsDialogState();
    });
    document.getElementById('helpPolygonProperties')?.addEventListener('click', () => {
      alert('Polygon Properties define line style, fill, pattern, and line width. Drag vertices on the display to change the shape and angle.');
    });
    document.querySelectorAll('#polygonPropertiesDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.pgTab));
    });
  }

  function openPolygonPropertiesDialog(comp, ref, editIndex) {
    window.flushDeferredDialogInits?.();
    initPolygonPropertiesDialog();
    fillPolygonPropertiesForm(comp);
    wireTools();
    const idx = S.resolvedEditIndex(comp, ref, editIndex);
    window.resetPropsDialogState('polygon', readPolygonPropertiesForm, 'applyPolygonProperties', idx, ref);
    switchTab('general');
    window.setTemplateEditStatus?.(comp.name, ref);
    window.showCanvasPropsDialog?.(document.getElementById('polygonPropertiesDialog'));
    const previewComp = readPolygonPropertiesForm();
    if (idx == null) window.updatePolygonStudioPreview?.(previewComp);
    else window.hideFreehandStudioPreview?.();
    S.previewShape(previewComp, readPolygonPropertiesForm, 'applyPolygonProperties');
    window.flushPropsApplyButton?.(readPolygonPropertiesForm, 'applyPolygonProperties');
  }

  window.StudioPolygonProperties = {
    fillPolygonPropertiesForm,
    readPolygonPropertiesForm,
    openPolygonPropertiesDialog,
    initPolygonPropertiesDialog
  };
})();
