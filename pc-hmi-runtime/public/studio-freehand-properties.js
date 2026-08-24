/** Freehand property dialog — FactoryTalk View style (General / Common tabs). */
(function () {
  let freehandPreviewTimer = null;

  const PATTERN_OPTIONS = [
    ['none', 'None'],
    ['dots', 'Dots'],
    ['checks', 'Checks'],
    ['smallBoxes', 'Small Boxes'],
    ['mediumBoxes', 'Medium Boxes'],
    ['largeBoxes', 'Large Boxes'],
    ['verticalLines', 'Vertical Lines'],
    ['wideVerticalLines', 'Wide Vertical Lines'],
    ['horizontalLines', 'Horizontal Lines'],
    ['wideHorizontalLines', 'Wide Horizontal Lines'],
    ['rightDiagonal', 'Right Diagonal'],
    ['wideRightDiagonal', 'Wide Right Diagonal'],
    ['leftDiagonal', 'Left Diagonal'],
    ['wideLeftDiagonal', 'Wide Left Diagonal'],
    ['hatch', 'Hatch'],
    ['bricks', 'Bricks'],
    ['ovals', 'Ovals'],
    ['diamonds', 'Diamonds'],
    ['scales', 'Scales'],
    ['waves', 'Waves']
  ];

  function scheduleFreehandLivePreview() {
    if (window.state?.propsFormFill) return;
    if (freehandPreviewTimer) clearTimeout(freehandPreviewTimer);
    freehandPreviewTimer = setTimeout(() => {
      freehandPreviewTimer = null;
      const comp = readFreehandPropertiesForm();
      window.updateFreehandStudioPreview?.(comp);
      if (comp.name && window.previewPatchByName) {
        window.previewPatchByName(comp.name, comp);
      }
      window.updatePropsApplyButton?.(readFreehandPropertiesForm, 'applyFreehandProperties');
    }, 100);
  }

  function notifyFreehandFormChange() {
    scheduleFreehandLivePreview();
    window.flushPropsApplyButton?.(readFreehandPropertiesForm, 'applyFreehandProperties');
  }

  function wireColorInputs() {
    document.querySelectorAll('#freehandPropertiesForm .ft-color-input').forEach((input) => {
      if (input.dataset.fhColorWired === '1') return;
      input.dataset.fhColorWired = '1';
      input.addEventListener('input', notifyFreehandFormChange);
      input.addEventListener('change', notifyFreehandFormChange);
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll('#freehandPropertiesDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.fhTab === tabId);
    });
    document.querySelectorAll('#freehandPropertiesDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.fhTabPanel === tabId);
    });
  }

  function syncGradientFields() {
    const isGradient = document.getElementById('fhBackStyle')?.value === 'gradient';
    document.getElementById('fhGradientExtras')?.classList.toggle('hidden', !isGradient);
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

  function wireTools() {
    const dialog = document.getElementById('freehandPropertiesDialog');
    if (window.FtColorPicker) {
      window.FtColorPicker.initAllSync(dialog);
      window.FtColorPicker.refreshAll(dialog);
    }
    wireColorInputs();
    syncColorFields();
    if (window.FtColorPicker) window.FtColorPicker.refreshAll(dialog);
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
      setColorFieldValue('fhForeColor', c.foreColor || '#000000');
      setColorFieldValue('fhBackColor', c.backColor || '#808080');
      setColorFieldValue('fhPatternColor', c.patternColor || '#808080');
      document.getElementById('fhUsePatternColor').checked = Boolean(c.usePatternColor) || (c.patternStyle && c.patternStyle !== 'none');
      setColorFieldValue('fhEndColor', c.endColor || '#e8e8e8');
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
    const comp = {
      type: 'Freehand',
      name: document.getElementById('fhName').value.trim() || 'Freehand1',
      left: Number(document.getElementById('fhLeft').value) || 0,
      top: Number(document.getElementById('fhTop').value) || 0,
      width: Number(document.getElementById('fhWidth').value) || 64,
      height: Number(document.getElementById('fhHeight').value) || 64,
      visible: document.getElementById('fhVisible').checked,
      lineStyle: document.getElementById('fhLineStyle').value,
      backStyle,
      patternStyle,
      useForeColor: true,
      foreColor: norm(getColorFieldValue('fhForeColor')),
      useBackColor: backStyle !== 'transparent',
      backColor: norm(getColorFieldValue('fhBackColor')),
      usePatternColor: patternStyle !== 'none' && document.getElementById('fhUsePatternColor').checked,
      patternColor: norm(getColorFieldValue('fhPatternColor')),
      lineWidth: Number(document.getElementById('fhLineWidth').value) || 0,
      points
    };
    if (backStyle === 'gradient') {
      comp.endColor = norm(getColorFieldValue('fhEndColor'));
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
    const editIdx = window.resolveEditComponentIndex?.(comp);
    if (editIdx >= 0) {
      window.state.canvasSelection.indices = [editIdx];
      window.refreshCanvasEditOverlaySelection?.();
    }
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
    if (!form) return;
    const patternSelect = document.getElementById('fhPatternStyle');
    if (patternSelect && !patternSelect.dataset.fhFilled) {
      patternSelect.dataset.fhFilled = '1';
      patternSelect.innerHTML = PATTERN_OPTIONS.map(([value, label]) =>
        `<option value="${value}">${label}</option>`
      ).join('');
    }
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
    fillFreehandPropertiesForm(comp);
    wireTools();
    window.resetPropsDialogState('freehand', readFreehandPropertiesForm, 'applyFreehandProperties', editIndex, ref);
    switchTab('general');
    window.setTemplateEditStatus?.(comp.name, ref);
    window.showCanvasPropsDialog?.(document.getElementById('freehandPropertiesDialog'));
    const previewComp = readFreehandPropertiesForm();
    window.updateFreehandStudioPreview?.(previewComp);
    if (previewComp.name && window.previewPatchByName) {
      window.previewPatchByName(previewComp.name, previewComp);
    }
    window.flushPropsApplyButton?.(readFreehandPropertiesForm, 'applyFreehandProperties');
  }

  window.StudioFreehandProperties = {
    fillFreehandPropertiesForm,
    readFreehandPropertiesForm,
    openFreehandPropertiesDialog,
    initFreehandPropertiesDialog
  };
})();
