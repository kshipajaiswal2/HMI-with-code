/** Bar Graph property dialog */
(function () {
  function switchTab(tabId) {
    document.querySelectorAll('#barGraphDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.bgrTab === tabId);
    });
    document.querySelectorAll('#barGraphDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.bgrTabPanel === tabId);
    });
  }

  function nextBarGraphName(components) {
    const n = (components || []).filter((c) => c.type === 'BarGraph').length + 1;
    return `BarGraph${n}`;
  }

  function defaultThresholds() {
    return [
      { value: 50, useFillColor: false, fillColor: '#ffff00', blink: false },
      { value: 75, useFillColor: false, fillColor: '#ffb6c1', blink: false }
    ];
  }

  function defaultBarGraphComponent(overrides = {}) {
    return {
      type: 'BarGraph',
      name: 'BarGraph1',
      tag: '',
      left: 16,
      top: 16,
      width: 80,
      height: 120,
      visible: true,
      borderStyle: 'line',
      borderWidth: 4,
      borderUsesBackColor: true,
      backStyle: 'solid',
      fillStyle: 'solid',
      backColor: '#001C38',
      useBackColor: true,
      useBorderColor: true,
      borderColor: '#001C38',
      fillColor: '#0066cc',
      useFillColor: true,
      minValue: 0,
      maxValue: 100,
      fillDirection: 'bottomToTop',
      numberOfThresholds: 0,
      thresholdType: 'value',
      thresholds: defaultThresholds(),
      ...overrides
    };
  }

  function syncBarGraphFields() {
    document.getElementById('bgrBackColor').disabled = !document.getElementById('bgrUseBackColor')?.checked;
    document.getElementById('bgrBorderColor').disabled = !document.getElementById('bgrUseBorderColor')?.checked;
    document.getElementById('bgrFillColor').disabled = !document.getElementById('bgrUseFillColor')?.checked;
    const count = Number(document.getElementById('bgrNumberOfThresholds')?.value) || 0;
    document.getElementById('bgrThreshold1Value').disabled = count < 1;
    document.getElementById('bgrThreshold1UseFillColor').disabled = count < 1;
    document.getElementById('bgrThreshold1FillColor').disabled = count < 1 || !document.getElementById('bgrThreshold1UseFillColor')?.checked;
    document.getElementById('bgrThreshold1Blink').disabled = count < 1;
    document.getElementById('bgrThreshold2Value').disabled = count < 2;
    document.getElementById('bgrThreshold2UseFillColor').disabled = count < 2;
    document.getElementById('bgrThreshold2FillColor').disabled = count < 2 || !document.getElementById('bgrThreshold2UseFillColor')?.checked;
    document.getElementById('bgrThreshold2Blink').disabled = count < 2;
    document.getElementById('bgrThresholdType').disabled = count < 1;
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('barGraphDialog'));
    syncBarGraphFields();
  }

  function fillBarGraphForm(comp) {
    document.getElementById('bgrBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('bgrBorderWidth').value = comp.borderWidth ?? 4;
    document.getElementById('bgrBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('bgrBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('bgrFillStyle').value = comp.fillStyle || 'solid';
    document.getElementById('bgrUseBackColor').checked = comp.useBackColor !== false;
    document.getElementById('bgrBackColor').value = comp.backColor || '#001C38';
    document.getElementById('bgrUseBorderColor').checked = comp.useBorderColor !== false;
    document.getElementById('bgrBorderColor').value = comp.borderColor || '#001C38';
    document.getElementById('bgrUseFillColor').checked = comp.useFillColor !== false;
    document.getElementById('bgrFillColor').value = comp.fillColor || '#0066cc';
    document.getElementById('bgrMinValue').value = comp.minValue ?? 0;
    document.getElementById('bgrMaxValue').value = comp.maxValue ?? 100;
    document.getElementById('bgrFillDirection').value = comp.fillDirection || 'bottomToTop';
    document.getElementById('bgrNumberOfThresholds').value = String(comp.numberOfThresholds ?? 0);
    document.getElementById('bgrThresholdType').value = comp.thresholdType || 'value';
    const thresholds = comp.thresholds?.length ? comp.thresholds : defaultThresholds();
    document.getElementById('bgrThreshold1Value').value = thresholds[0]?.value ?? 50;
    document.getElementById('bgrThreshold1UseFillColor').checked = Boolean(thresholds[0]?.useFillColor);
    document.getElementById('bgrThreshold1FillColor').value = thresholds[0]?.fillColor || '#ffff00';
    document.getElementById('bgrThreshold1Blink').checked = Boolean(thresholds[0]?.blink);
    document.getElementById('bgrThreshold2Value').value = thresholds[1]?.value ?? 75;
    document.getElementById('bgrThreshold2UseFillColor').checked = Boolean(thresholds[1]?.useFillColor);
    document.getElementById('bgrThreshold2FillColor').value = thresholds[1]?.fillColor || '#ffb6c1';
    document.getElementById('bgrThreshold2Blink').checked = Boolean(thresholds[1]?.blink);
    document.getElementById('bgrTag').value = comp.tag || '';
    document.getElementById('bgrHeight').value = comp.height ?? 120;
    document.getElementById('bgrWidth').value = comp.width ?? 80;
    document.getElementById('bgrTop').value = comp.top ?? 16;
    document.getElementById('bgrLeft').value = comp.left ?? 16;
    document.getElementById('bgrName').value = comp.name || 'BarGraph1';
    document.getElementById('bgrVisible').checked = comp.visible !== false;
    syncBarGraphFields();
  }

  function readBarGraphForm() {
    return {
      type: 'BarGraph',
      name: document.getElementById('bgrName').value.trim() || 'BarGraph1',
      tag: document.getElementById('bgrTag').value.trim(),
      left: Number(document.getElementById('bgrLeft').value) || 0,
      top: Number(document.getElementById('bgrTop').value) || 0,
      width: Number(document.getElementById('bgrWidth').value) || 80,
      height: Number(document.getElementById('bgrHeight').value) || 120,
      visible: document.getElementById('bgrVisible').checked,
      borderStyle: document.getElementById('bgrBorderStyle').value,
      borderWidth: Number(document.getElementById('bgrBorderWidth').value) || 4,
      borderUsesBackColor: document.getElementById('bgrBorderUsesBackColor').checked,
      backStyle: document.getElementById('bgrBackStyle').value,
      fillStyle: document.getElementById('bgrFillStyle').value,
      backColor: document.getElementById('bgrBackColor').value,
      useBackColor: document.getElementById('bgrUseBackColor').checked,
      useBorderColor: document.getElementById('bgrUseBorderColor').checked,
      borderColor: document.getElementById('bgrBorderColor').value,
      fillColor: document.getElementById('bgrFillColor').value,
      useFillColor: document.getElementById('bgrUseFillColor').checked,
      minValue: Number(document.getElementById('bgrMinValue').value) || 0,
      maxValue: Number(document.getElementById('bgrMaxValue').value) || 100,
      fillDirection: document.getElementById('bgrFillDirection').value,
      numberOfThresholds: Number(document.getElementById('bgrNumberOfThresholds').value) || 0,
      thresholdType: document.getElementById('bgrThresholdType').value,
      thresholds: [
        {
          value: Number(document.getElementById('bgrThreshold1Value').value) || 50,
          useFillColor: document.getElementById('bgrThreshold1UseFillColor').checked,
          fillColor: document.getElementById('bgrThreshold1FillColor').value,
          blink: document.getElementById('bgrThreshold1Blink').checked
        },
        {
          value: Number(document.getElementById('bgrThreshold2Value').value) || 75,
          useFillColor: document.getElementById('bgrThreshold2UseFillColor').checked,
          fillColor: document.getElementById('bgrThreshold2FillColor').value,
          blink: document.getElementById('bgrThreshold2Blink').checked
        }
      ]
    };
  }

  function validateBarGraph(comp) {
    if (!comp.tag) {
      window.setStatus('Connect a Value tag on the Connections tab');
      switchTab('connections');
      return false;
    }
    if (comp.maxValue <= comp.minValue) {
      window.setStatus('Maximum value must be greater than minimum value');
      switchTab('general');
      return false;
    }
    return true;
  }

  async function showBarGraphDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then choose Bar Graph');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultBarGraphComponent({
      name: nextBarGraphName(canvas?.components),
      ...overrides
    });
    fillBarGraphForm(comp);
    window.resetPropsDialogState('bar-graph', readBarGraphForm, 'applyBarGraph');
    switchTab('general');
    wireTools();
    document.getElementById('barGraphDialog')?.showModal();
  }

  async function applyBarGraph() {
    const comp = readBarGraphForm();
    if (!validateBarGraph(comp)) return;
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readBarGraphForm, 'applyBarGraph');
    window.state.canvasSelection.index = window.state.propsDialog.editIndex;
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveBarGraph(e) {
    e.preventDefault();
    const comp = readBarGraphForm();
    if (!validateBarGraph(comp)) return;
    await window.upsertCanvasComponent(comp);
    document.getElementById('barGraphDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initBarGraphDialog() {
    const form = document.getElementById('barGraphForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveBarGraph(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyBarGraph')?.addEventListener('click', () => {
      applyBarGraph().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readBarGraphForm, 'applyBarGraph'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readBarGraphForm, 'applyBarGraph'));
    document.getElementById('cancelBarGraph')?.addEventListener('click', () => {
      document.getElementById('barGraphDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('barGraphDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpBarGraph')?.addEventListener('click', () => {
      alert('Bar Graph displays a tag value as a filled bar between minimum and maximum values.');
    });
    document.querySelectorAll('#barGraphDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.bgrTab));
    });
    for (const id of [
      'bgrUseBackColor', 'bgrUseBorderColor', 'bgrUseFillColor',
      'bgrThreshold1UseFillColor', 'bgrThreshold2UseFillColor', 'bgrNumberOfThresholds'
    ]) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncBarGraphFields();
        window.updatePropsApplyButton(readBarGraphForm, 'applyBarGraph');
      });
    }
  }

  window.StudioBarGraph = {
    initBarGraphDialog,
    showBarGraphDialog,
    fillBarGraphForm,
    readBarGraphForm,
    switchBarGraphTab: switchTab,
    wireBarGraphTools: wireTools
  };
})();
