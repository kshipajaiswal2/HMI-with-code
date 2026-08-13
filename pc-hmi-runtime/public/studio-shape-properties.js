/** Rectangle / Ellipse (Polygon) property dialogs — FactoryTalk-style */
(function () {
  let editingType = 'Rectangle';

  function titleForType(type) {
    if (type === 'Ellipse') return 'Ellipse Properties';
    return 'Polygon Properties';
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
    const isEllipse = editingType === 'Ellipse';
    const backStyle = document.getElementById('spBackStyle');
    const gradientOpt = backStyle?.querySelector('option[value="gradient"]');
    if (gradientOpt) gradientOpt.hidden = isEllipse;
    if (isEllipse && backStyle?.value === 'gradient') backStyle.value = 'solid';
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
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('shapePropertiesDialog'));
    syncColorFields();
  }

  function fillShapePropertiesForm(comp) {
    editingType = comp.type === 'Ellipse' ? 'Ellipse' : 'Rectangle';
    document.getElementById('shapePropertiesTitle').textContent = titleForType(editingType);
    const isEllipse = editingType === 'Ellipse';
    document.getElementById('spLineStyle').value = comp.lineStyle || 'solid';
    document.getElementById('spBackStyle').value = comp.backStyle || (isEllipse ? 'solid' : 'gradient');
    document.getElementById('spPatternStyle').value = comp.patternStyle || 'none';
    document.getElementById('spUseForeColor').checked = comp.useForeColor !== false;
    document.getElementById('spForeColor').value = comp.foreColor || comp.borderColor || (isEllipse ? '#10EB10' : '#c6c6c6');
    document.getElementById('spUseBackColor').checked = comp.useBackColor !== false;
    document.getElementById('spBackColor').value = comp.backColor || (isEllipse ? '#10EB10' : '#c6c6c6');
    document.getElementById('spEndColor').value = comp.endColor || '#e8e8e8';
    document.getElementById('spGradientStop').value = comp.gradientStop ?? 95;
    document.getElementById('spGradientDir').value = comp.gradientShadingStyle || comp.gradientDirection || 'gradientHorizontalFromRight';
    document.getElementById('spUsePatternColor').checked = Boolean(comp.usePatternColor);
    document.getElementById('spPatternColor').value = comp.patternColor || '#ffffff';
    document.getElementById('spLineWidth').value = comp.lineWidth ?? comp.borderWidth ?? (isEllipse ? 1 : 2);
    document.getElementById('spHeight').value = comp.height ?? 34;
    document.getElementById('spWidth').value = comp.width ?? 262;
    document.getElementById('spTop').value = comp.top ?? 0;
    document.getElementById('spLeft').value = comp.left ?? 0;
    document.getElementById('spName').value = comp.name || (editingType === 'Ellipse' ? 'Ellipse1' : 'Rectangle1');
    document.getElementById('spVisible').checked = comp.visible !== false;
    syncShapeTypeFields();
    syncColorFields();
  }

  function readShapePropertiesForm() {
    const backStyle = document.getElementById('spBackStyle').value;
    const comp = {
      type: editingType,
      name: document.getElementById('spName').value.trim() || (editingType === 'Ellipse' ? 'Ellipse1' : 'Rectangle1'),
      left: Number(document.getElementById('spLeft').value) || 0,
      top: Number(document.getElementById('spTop').value) || 0,
      width: Number(document.getElementById('spWidth').value) || 64,
      height: Number(document.getElementById('spHeight').value) || 64,
      visible: document.getElementById('spVisible').checked,
      lineStyle: document.getElementById('spLineStyle').value,
      backStyle,
      patternStyle: document.getElementById('spPatternStyle').value,
      useForeColor: document.getElementById('spUseForeColor').checked,
      foreColor: document.getElementById('spForeColor').value,
      useBackColor: document.getElementById('spUseBackColor').checked,
      backColor: document.getElementById('spBackColor').value,
      usePatternColor: document.getElementById('spUsePatternColor').checked,
      patternColor: document.getElementById('spPatternColor').value,
      lineWidth: Number(document.getElementById('spLineWidth').value) || 0
    };
    if (backStyle === 'gradient') {
      comp.endColor = document.getElementById('spEndColor').value;
      comp.gradientStop = Number(document.getElementById('spGradientStop').value) || 95;
      comp.gradientShadingStyle = document.getElementById('spGradientDir').value;
    }
    return comp;
  }

  async function applyShapeProperties() {
    const comp = readShapePropertiesForm();
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readShapePropertiesForm, 'applyShapeProperties');
    window.state.canvasSelection.index = window.state.propsDialog.editIndex;
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveShapeProperties(e) {
    e.preventDefault();
    const comp = readShapePropertiesForm();
    await window.upsertCanvasComponent(comp);
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
    form.addEventListener('input', () => window.updatePropsApplyButton(readShapePropertiesForm, 'applyShapeProperties'));
    form.addEventListener('change', () => {
      syncShapeTypeFields();
      syncColorFields();
      window.updatePropsApplyButton(readShapePropertiesForm, 'applyShapeProperties');
    });
    document.getElementById('spBackStyle')?.addEventListener('change', syncShapeTypeFields);
    document.getElementById('cancelShapeProperties')?.addEventListener('click', () => {
      document.getElementById('shapePropertiesDialog')?.close();
      window.clearPropsDialogState();
    });
    document.getElementById('helpShapeProperties')?.addEventListener('click', () => {
      alert('Polygon / Ellipse Properties define line style, fill, pattern, and border width — matching FactoryTalk View graphic objects.');
    });
    document.querySelectorAll('#shapePropertiesDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.spTab));
    });
  }

  function openShapePropertiesDialog(comp, ref, editIndex) {
    fillShapePropertiesForm(comp);
    window.resetPropsDialogState('shape', readShapePropertiesForm, 'applyShapeProperties', editIndex, ref);
    switchTab('general');
    wireTools();
    document.getElementById('shapePropertiesDialog')?.showModal();
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
