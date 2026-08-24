/** Ellipse property dialog — FactoryTalk View style (General / Common tabs). */
(function () {
  let ellipsePreviewTimer = null;

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

  function scheduleEllipseLivePreview() {
    if (window.state?.propsFormFill) return;
    if (ellipsePreviewTimer) clearTimeout(ellipsePreviewTimer);
    ellipsePreviewTimer = setTimeout(() => {
      ellipsePreviewTimer = null;
      const comp = readEllipsePropertiesForm();
      if (comp.name && window.previewPatchByName) {
        window.previewPatchByName(comp.name, comp);
      }
      window.updatePropsApplyButton?.(readEllipsePropertiesForm, 'applyEllipseProperties');
    }, 100);
  }

  function notifyEllipseFormChange() {
    scheduleEllipseLivePreview();
    window.flushPropsApplyButton?.(readEllipsePropertiesForm, 'applyEllipseProperties');
  }

  function wireColorInputs() {
    document.querySelectorAll('#ellipsePropertiesForm .ft-color-input').forEach((input) => {
      if (input.dataset.epColorWired === '1') return;
      input.dataset.epColorWired = '1';
      input.addEventListener('input', notifyEllipseFormChange);
      input.addEventListener('change', notifyEllipseFormChange);
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll('#ellipsePropertiesDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.epTab === tabId);
    });
    document.querySelectorAll('#ellipsePropertiesDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.epTabPanel === tabId);
    });
  }

  function syncGradientFields() {
    const isGradient = document.getElementById('epBackStyle')?.value === 'gradient';
    document.getElementById('epGradientExtras')?.classList.toggle('hidden', !isGradient);
  }

  function syncPatternFields() {
    const pattern = document.getElementById('epPatternStyle')?.value || 'none';
    if (pattern !== 'none') {
      document.getElementById('epUsePatternColor').checked = true;
    }
    syncColorFields();
  }

  function syncColorFields() {
    const pattern = document.getElementById('epPatternStyle')?.value || 'none';
    document.getElementById('epPatternColor').disabled = pattern === 'none';
    document.getElementById('epEndColor').disabled = document.getElementById('epBackStyle')?.value !== 'gradient';
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
    const dialog = document.getElementById('ellipsePropertiesDialog');
    if (window.FtColorPicker) {
      window.FtColorPicker.initAllSync(dialog);
      window.FtColorPicker.refreshAll(dialog);
    }
    wireColorInputs();
    syncColorFields();
    if (window.FtColorPicker) window.FtColorPicker.refreshAll(dialog);
  }

  function fillEllipsePropertiesForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    const c = {
      lineStyle: 'solid',
      backStyle: 'solid',
      patternStyle: 'none',
      foreColor: '#808080',
      backColor: '#808080',
      patternColor: '#ffffff',
      useForeColor: true,
      useBackColor: true,
      usePatternColor: false,
      lineWidth: 1,
      width: 121,
      height: 116,
      left: 0,
      top: 0,
      visible: true,
      ...comp
    };
    try {
      document.getElementById('epLineStyle').value = c.lineStyle || 'solid';
      document.getElementById('epBackStyle').value = c.backStyle || 'solid';
      document.getElementById('epPatternStyle').value = c.patternStyle || 'none';
      setColorFieldValue('epForeColor', c.foreColor || '#808080');
      setColorFieldValue('epBackColor', c.backColor || '#808080');
      setColorFieldValue('epPatternColor', c.patternColor || '#ffffff');
      document.getElementById('epUsePatternColor').checked = Boolean(c.usePatternColor) || (c.patternStyle && c.patternStyle !== 'none');
      setColorFieldValue('epEndColor', c.endColor || '#e8e8e8');
      document.getElementById('epGradientStop').value = c.gradientStop ?? 95;
      document.getElementById('epGradientDir').value = c.gradientShadingStyle || c.gradientDirection || 'gradientHorizontalFromRight';
      document.getElementById('epLineWidth').value = c.lineWidth ?? 1;
      document.getElementById('epHeight').value = c.height ?? 116;
      document.getElementById('epWidth').value = c.width ?? 121;
      document.getElementById('epTop').value = c.top ?? 0;
      document.getElementById('epLeft').value = c.left ?? 0;
      document.getElementById('epName').value = c.name || 'Ellipse1';
      document.getElementById('epVisible').checked = c.visible !== false;
      syncPatternFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readEllipsePropertiesForm() {
    const backStyle = document.getElementById('epBackStyle').value;
    const patternStyle = document.getElementById('epPatternStyle').value;
    const norm = window.FtColorPicker?.normalizeColor || ((v) => v);
    const comp = {
      type: 'Ellipse',
      name: document.getElementById('epName').value.trim() || 'Ellipse1',
      left: Number(document.getElementById('epLeft').value) || 0,
      top: Number(document.getElementById('epTop').value) || 0,
      width: Number(document.getElementById('epWidth').value) || 64,
      height: Number(document.getElementById('epHeight').value) || 64,
      visible: document.getElementById('epVisible').checked,
      lineStyle: document.getElementById('epLineStyle').value,
      backStyle,
      patternStyle,
      useForeColor: true,
      foreColor: norm(getColorFieldValue('epForeColor')),
      useBackColor: backStyle !== 'transparent',
      backColor: norm(getColorFieldValue('epBackColor')),
      usePatternColor: patternStyle !== 'none' && document.getElementById('epUsePatternColor').checked,
      patternColor: norm(getColorFieldValue('epPatternColor')),
      lineWidth: Number(document.getElementById('epLineWidth').value) || 0
    };
    if (backStyle === 'gradient') {
      comp.endColor = norm(getColorFieldValue('epEndColor'));
      comp.gradientStop = Number(document.getElementById('epGradientStop').value) || 95;
      comp.gradientShadingStyle = document.getElementById('epGradientDir').value;
    }
    return comp;
  }

  async function applyEllipseProperties() {
    const comp = readEllipsePropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readEllipsePropertiesForm, 'applyEllipseProperties');
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveEllipseProperties(e) {
    e.preventDefault();
    const comp = readEllipsePropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    document.getElementById('ellipsePropertiesDialog').close();
    window.clearPropsDialogState();
    window.setStatus(`Saved ${comp.name}`);
  }

  function initEllipsePropertiesDialog() {
    const form = document.getElementById('ellipsePropertiesForm');
    if (!form) return;
    const patternSelect = document.getElementById('epPatternStyle');
    if (patternSelect && !patternSelect.dataset.epFilled) {
      patternSelect.dataset.epFilled = '1';
      patternSelect.innerHTML = PATTERN_OPTIONS.map(([value, label]) =>
        `<option value="${value}">${label}</option>`
      ).join('');
    }
    form.addEventListener('submit', (e) => saveEllipseProperties(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyEllipseProperties')?.addEventListener('click', () => {
      applyEllipseProperties().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleEllipseLivePreview();
      window.flushPropsApplyButton?.(readEllipsePropertiesForm, 'applyEllipseProperties');
    });
    form.addEventListener('change', () => {
      syncPatternFields();
      scheduleEllipseLivePreview();
      window.flushPropsApplyButton?.(readEllipsePropertiesForm, 'applyEllipseProperties');
    });
    document.getElementById('cancelEllipseProperties')?.addEventListener('click', () => {
      window.revertPropsDialogPreview?.();
      document.getElementById('ellipsePropertiesDialog')?.close();
      window.clearPropsDialogState();
    });
    document.getElementById('helpEllipseProperties')?.addEventListener('click', () => {
      alert('Ellipse Properties define line style, fill, pattern, and line width — matching FactoryTalk View ellipse objects.');
    });
    document.querySelectorAll('#ellipsePropertiesDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.epTab));
    });
  }

  function openEllipsePropertiesDialog(comp, ref, editIndex) {
    window.flushDeferredDialogInits?.();
    fillEllipsePropertiesForm(comp);
    wireTools();
    window.resetPropsDialogState('ellipse', readEllipsePropertiesForm, 'applyEllipseProperties', editIndex, ref);
    switchTab('general');
    window.setTemplateEditStatus?.(comp.name, ref);
    document.getElementById('ellipsePropertiesDialog')?.showModal();
    window.flushPropsApplyButton?.(readEllipsePropertiesForm, 'applyEllipseProperties');
  }

  window.StudioEllipseProperties = {
    fillEllipsePropertiesForm,
    readEllipsePropertiesForm,
    openEllipsePropertiesDialog,
    initEllipsePropertiesDialog
  };
})();
