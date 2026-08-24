/** Panel property dialog — FactoryTalk View style (General / Common tabs). */
(function () {
  let panelPreviewTimer = null;
  let editingChildren = [];

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

  function schedulePanelLivePreview() {
    if (window.state?.propsFormFill) return;
    if (panelPreviewTimer) clearTimeout(panelPreviewTimer);
    panelPreviewTimer = setTimeout(() => {
      panelPreviewTimer = null;
      const comp = readPanelPropertiesForm();
      if (comp.name && window.previewPatchByName) {
        window.previewPatchByName(comp.name, comp);
      }
      window.updatePropsApplyButton?.(readPanelPropertiesForm, 'applyPanelProperties');
    }, 100);
  }

  function notifyPanelFormChange() {
    schedulePanelLivePreview();
    window.flushPropsApplyButton?.(readPanelPropertiesForm, 'applyPanelProperties');
    window.updatePropsApplyButton?.(readPanelPropertiesForm, 'applyPanelProperties');
  }

  function wireColorInputs() {
    document.querySelectorAll('#panelPropertiesForm .ft-color-input').forEach((input) => {
      if (input.dataset.ppColorWired === '1') return;
      input.dataset.ppColorWired = '1';
      input.addEventListener('input', notifyPanelFormChange);
      input.addEventListener('change', notifyPanelFormChange);
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll('#panelPropertiesDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.ppTab === tabId);
    });
    document.querySelectorAll('#panelPropertiesDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.ppTabPanel === tabId);
    });
  }

  function syncGradientFields() {
    const isGradient = document.getElementById('ppBackStyle')?.value === 'gradient';
    document.getElementById('ppGradientExtras')?.classList.toggle('hidden', !isGradient);
  }

  function syncPatternFields() {
    const pattern = document.getElementById('ppPatternStyle')?.value || 'none';
    const usePattern = document.getElementById('ppUsePatternColor');
    if (pattern !== 'none' && usePattern && !usePattern.checked) {
      usePattern.checked = true;
    }
    syncColorFields();
  }

  function syncBorderColorField() {
    const usesBack = document.getElementById('ppBorderUsesBackColor')?.checked;
    const borderColorInput = document.getElementById('ppBorderColor');
    if (borderColorInput) {
      borderColorInput.disabled = Boolean(usesBack);
    }
  }

  function syncColorFields() {
    const pattern = document.getElementById('ppPatternStyle')?.value || 'none';
    const usePattern = document.getElementById('ppUsePatternColor');
    if (usePattern && pattern !== 'none' && !usePattern.checked) {
      usePattern.checked = true;
    }
    document.getElementById('ppPatternColor').disabled = !usePattern?.checked || pattern === 'none';
    document.getElementById('ppEndColor').disabled = document.getElementById('ppBackStyle')?.value !== 'gradient';
    syncBorderColorField();
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
    const dialog = document.getElementById('panelPropertiesDialog');
    if (window.FtColorPicker) {
      window.FtColorPicker.initAllSync(dialog);
      window.FtColorPicker.refreshAll(dialog);
    }
    wireColorInputs();
    syncColorFields();
    if (window.FtColorPicker) window.FtColorPicker.refreshAll(dialog);
  }

  function fillPanelPropertiesForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    editingChildren = Array.isArray(comp.children) ? [...comp.children] : [];
    const c = {
      borderStyle: 'line',
      backStyle: 'solid',
      borderWidth: 1,
      patternStyle: 'none',
      borderUsesBackColor: true,
      usePatternColor: false,
      patternColor: '#ffffff',
      backColor: '#001C38',
      borderColor: '#001C38',
      blink: false,
      width: 228,
      height: 103,
      left: 0,
      top: 0,
      visible: true,
      ...comp
    };
    try {
      document.getElementById('ppBorderStyle').value = c.borderStyle || 'line';
      document.getElementById('ppBackStyle').value = c.backStyle || 'solid';
      document.getElementById('ppBorderWidth').value = c.borderWidth ?? 1;
      document.getElementById('ppPatternStyle').value = c.patternStyle || 'none';
      document.getElementById('ppBorderUsesBackColor').checked = c.borderUsesBackColor !== false;
      document.getElementById('ppUsePatternColor').checked = Boolean(c.usePatternColor) || (c.patternStyle && c.patternStyle !== 'none');
      setColorFieldValue('ppPatternColor', c.patternColor || '#ffffff');
      setColorFieldValue('ppBackColor', c.backColor || '#001C38');
      setColorFieldValue('ppBorderColor', c.borderColor || c.backColor || '#001C38');
      document.getElementById('ppBlink').checked = Boolean(c.blink);
      setColorFieldValue('ppEndColor', c.endColor || '#e8e8e8');
      document.getElementById('ppGradientStop').value = c.gradientStop ?? 95;
      document.getElementById('ppGradientDir').value = c.gradientShadingStyle || c.gradientDirection || 'gradientHorizontalFromRight';
      document.getElementById('ppHeight').value = c.height ?? 103;
      document.getElementById('ppWidth').value = c.width ?? 228;
      document.getElementById('ppTop').value = c.top ?? 0;
      document.getElementById('ppLeft').value = c.left ?? 0;
      document.getElementById('ppName').value = c.name || 'Panel1';
      document.getElementById('ppVisible').checked = c.visible !== false;
      syncPatternFields();
      syncColorFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readPanelPropertiesForm() {
    const backStyle = document.getElementById('ppBackStyle').value;
    const patternStyle = document.getElementById('ppPatternStyle').value;
    const norm = window.FtColorPicker?.normalizeColor || ((v) => v);
    const usePatternColor = patternStyle !== 'none' && document.getElementById('ppUsePatternColor').checked;
    const comp = {
      type: 'Panel',
      name: document.getElementById('ppName').value.trim() || 'Panel1',
      left: Number(document.getElementById('ppLeft').value) || 0,
      top: Number(document.getElementById('ppTop').value) || 0,
      width: Number(document.getElementById('ppWidth').value) || 64,
      height: Number(document.getElementById('ppHeight').value) || 64,
      visible: document.getElementById('ppVisible').checked,
      borderStyle: document.getElementById('ppBorderStyle').value,
      backStyle,
      borderWidth: Number(document.getElementById('ppBorderWidth').value) || 0,
      patternStyle,
      borderUsesBackColor: document.getElementById('ppBorderUsesBackColor').checked,
      usePatternColor,
      patternColor: norm(getColorFieldValue('ppPatternColor')),
      backColor: norm(getColorFieldValue('ppBackColor')),
      borderColor: norm(getColorFieldValue('ppBorderColor')),
      useBackColor: true,
      blink: document.getElementById('ppBlink').checked,
      children: editingChildren
    };
    if (backStyle === 'gradient') {
      comp.endColor = norm(getColorFieldValue('ppEndColor'));
      comp.gradientStop = Number(document.getElementById('ppGradientStop').value) || 95;
      comp.gradientShadingStyle = document.getElementById('ppGradientDir').value;
    }
    return comp;
  }

  async function applyPanelProperties() {
    const comp = readPanelPropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readPanelPropertiesForm, 'applyPanelProperties');
    window.setStatus(`Applied ${comp.name}`);
  }

  async function savePanelProperties(e) {
    e.preventDefault();
    const comp = readPanelPropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    document.getElementById('panelPropertiesDialog').close();
    window.clearPropsDialogState();
    window.setStatus(`Saved ${comp.name}`);
  }

  function initPanelPropertiesDialog() {
    const form = document.getElementById('panelPropertiesForm');
    if (!form) return;
    const patternSelect = document.getElementById('ppPatternStyle');
    if (patternSelect && !patternSelect.dataset.ppFilled) {
      patternSelect.dataset.ppFilled = '1';
      patternSelect.innerHTML = PATTERN_OPTIONS.map(([value, label]) =>
        `<option value="${value}">${label}</option>`
      ).join('');
    }
    form.addEventListener('submit', (e) => savePanelProperties(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyPanelProperties')?.addEventListener('click', () => {
      applyPanelProperties().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      schedulePanelLivePreview();
      window.flushPropsApplyButton?.(readPanelPropertiesForm, 'applyPanelProperties');
    });
    form.addEventListener('change', () => {
      syncPatternFields();
      syncColorFields();
      schedulePanelLivePreview();
      window.flushPropsApplyButton?.(readPanelPropertiesForm, 'applyPanelProperties');
    });
    document.getElementById('ppPatternStyle')?.addEventListener('change', syncPatternFields);
    document.getElementById('ppBorderUsesBackColor')?.addEventListener('change', syncBorderColorField);
    document.getElementById('cancelPanelProperties')?.addEventListener('click', () => {
      window.revertPropsDialogPreview?.();
      document.getElementById('panelPropertiesDialog')?.close();
      window.clearPropsDialogState();
    });
    document.getElementById('helpPanelProperties')?.addEventListener('click', () => {
      alert('Panel Properties define border style, fill, pattern, and blink — matching FactoryTalk View panel objects.');
    });
    document.querySelectorAll('#panelPropertiesDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.ppTab));
    });
  }

  function openPanelPropertiesDialog(comp, ref, editIndex) {
    window.flushDeferredDialogInits?.();
    fillPanelPropertiesForm(comp);
    wireTools();
    window.resetPropsDialogState('panel', readPanelPropertiesForm, 'applyPanelProperties', editIndex, ref);
    switchTab('general');
    window.setTemplateEditStatus?.(comp.name, ref);
    document.getElementById('panelPropertiesDialog')?.showModal();
    window.flushPropsApplyButton?.(readPanelPropertiesForm, 'applyPanelProperties');
  }

  window.StudioPanelProperties = {
    fillPanelPropertiesForm,
    readPanelPropertiesForm,
    openPanelPropertiesDialog,
    initPanelPropertiesDialog
  };
})();
