/** Numeric Display property dialog */
(function () {
  function switchTab(tabId) {
    document.querySelectorAll('#numericDisplayDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.ndTab === tabId);
    });
    document.querySelectorAll('#numericDisplayDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.ndTabPanel === tabId);
    });
  }

  function nextNumericDisplayName(components) {
    const n = (components || []).filter((c) => c.type === 'NumericDisplay').length + 1;
    return `NumericDisplay${n}`;
  }

  function defaultNumericDisplayComponent(overrides = {}) {
    return {
      type: 'NumericDisplay',
      name: 'NumericDisplay1',
      tag: 'Production.Count',
      polarityTag: '',
      left: 16,
      top: 16,
      width: 80,
      height: 28,
      visible: true,
      borderStyle: 'line',
      borderWidth: 4,
      borderUsesBackColor: true,
      backStyle: 'solid',
      patternStyle: 'none',
      useBackColor: true,
      backColor: '#001C38',
      useBorderColor: true,
      borderColor: '#001C38',
      usePatternColor: false,
      patternColor: '#ffffff',
      useForeColor: true,
      foreColor: '#ffffff',
      blink: false,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      alignment: 'middleCenter',
      numberOfDigits: 5,
      fillLeftWith: 'none',
      decimalPlaces: 0,
      format: 'integer',
      ...overrides
    };
  }

  function syncNumericDisplayFields() {
    document.getElementById('ndBackColor').disabled = !document.getElementById('ndUseBackColor')?.checked;
    document.getElementById('ndBorderColor').disabled = !document.getElementById('ndUseBorderColor')?.checked;
    document.getElementById('ndPatternColor').disabled = !document.getElementById('ndUsePatternColor')?.checked;
    document.getElementById('ndForeColor').disabled = !document.getElementById('ndUseForeColor')?.checked;
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('numericDisplayDialog'));
    syncNumericDisplayFields();
  }

  function fillNumericDisplayForm(comp) {
    document.getElementById('ndBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('ndBorderWidth').value = comp.borderWidth ?? 4;
    document.getElementById('ndBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('ndPatternStyle').value = comp.patternStyle || 'none';
    document.getElementById('ndBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('ndUseBackColor').checked = comp.useBackColor !== false;
    document.getElementById('ndBackColor').value = comp.backColor || '#001C38';
    document.getElementById('ndUseBorderColor').checked = Boolean(comp.useBorderColor);
    document.getElementById('ndBorderColor').value = comp.borderColor || '#001C38';
    document.getElementById('ndUsePatternColor').checked = Boolean(comp.usePatternColor);
    document.getElementById('ndPatternColor').value = comp.patternColor || '#ffffff';
    document.getElementById('ndUseForeColor').checked = comp.useForeColor !== false;
    document.getElementById('ndForeColor').value = comp.foreColor || '#ffffff';
    document.getElementById('ndBlink').checked = Boolean(comp.blink);
    document.getElementById('ndFont').value = comp.fontFamily || 'Arial Unicode MS';
    document.getElementById('ndFontSize').value = String(comp.fontSize ?? 10);
    document.getElementById('ndBold').classList.toggle('active', Boolean(comp.bold));
    document.getElementById('ndItalic').classList.toggle('active', Boolean(comp.italic));
    document.getElementById('ndUnderline').classList.toggle('active', Boolean(comp.underline));
    document.querySelector(`#numericDisplayForm input[name="ndAlign"][value="${comp.alignment || 'middleCenter'}"]`)?.click();
    document.getElementById('ndNumberOfDigits').value = String(comp.numberOfDigits ?? 5);
    document.getElementById('ndFillLeftWith').value = comp.fillLeftWith || 'none';
    document.getElementById('ndDecimalPlaces').value = String(comp.decimalPlaces ?? 0);
    document.getElementById('ndHeight').value = comp.height ?? 28;
    document.getElementById('ndWidth').value = comp.width ?? 80;
    document.getElementById('ndTop').value = comp.top ?? 16;
    document.getElementById('ndLeft').value = comp.left ?? 16;
    document.getElementById('ndName').value = comp.name || 'NumericDisplay1';
    document.getElementById('ndVisible').checked = comp.visible !== false;
    document.getElementById('ndTag').value = comp.tag || '';
    document.getElementById('ndPolarityTag').value = comp.polarityTag || '';
    syncNumericDisplayFields();
  }

  function readNumericDisplayForm() {
    const decimalPlaces = Number(document.getElementById('ndDecimalPlaces').value) || 0;
    return {
      type: 'NumericDisplay',
      name: document.getElementById('ndName').value.trim() || 'NumericDisplay1',
      tag: document.getElementById('ndTag').value.trim(),
      polarityTag: document.getElementById('ndPolarityTag').value.trim(),
      left: Number(document.getElementById('ndLeft').value) || 0,
      top: Number(document.getElementById('ndTop').value) || 0,
      width: Number(document.getElementById('ndWidth').value) || 80,
      height: Number(document.getElementById('ndHeight').value) || 28,
      visible: document.getElementById('ndVisible').checked,
      borderStyle: document.getElementById('ndBorderStyle').value,
      borderWidth: Number(document.getElementById('ndBorderWidth').value) || 4,
      borderUsesBackColor: document.getElementById('ndBorderUsesBackColor').checked,
      backStyle: document.getElementById('ndBackStyle').value,
      patternStyle: document.getElementById('ndPatternStyle').value,
      useBackColor: document.getElementById('ndUseBackColor').checked,
      backColor: document.getElementById('ndBackColor').value,
      useBorderColor: document.getElementById('ndUseBorderColor').checked,
      borderColor: document.getElementById('ndBorderColor').value,
      usePatternColor: document.getElementById('ndUsePatternColor').checked,
      patternColor: document.getElementById('ndPatternColor').value,
      useForeColor: document.getElementById('ndUseForeColor').checked,
      foreColor: document.getElementById('ndForeColor').value,
      blink: document.getElementById('ndBlink').checked,
      fontFamily: document.getElementById('ndFont').value,
      fontSize: Number(document.getElementById('ndFontSize').value) || 10,
      bold: document.getElementById('ndBold').classList.contains('active'),
      italic: document.getElementById('ndItalic').classList.contains('active'),
      underline: document.getElementById('ndUnderline').classList.contains('active'),
      alignment: document.querySelector('#numericDisplayForm input[name="ndAlign"]:checked')?.value || 'middleCenter',
      numberOfDigits: Number(document.getElementById('ndNumberOfDigits').value) || 5,
      fillLeftWith: document.getElementById('ndFillLeftWith').value || 'none',
      decimalPlaces,
      format: decimalPlaces > 0 ? 'float' : 'integer',
      decimals: decimalPlaces
    };
  }

  async function showNumericDisplayDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display or global object first, then choose Numeric Display');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultNumericDisplayComponent({
      name: nextNumericDisplayName(canvas?.components),
      ...overrides
    });
    fillNumericDisplayForm(comp);
    window.resetPropsDialogState('numeric', readNumericDisplayForm, 'applyNumericDisplay');
    switchTab('general');
    wireTools();
    document.getElementById('numericDisplayDialog')?.showModal();
  }

  async function applyNumericDisplay() {
    const comp = readNumericDisplayForm();
    if (!comp.tag) {
      window.setStatus('Enter a Value tag on the Connections tab');
      switchTab('connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readNumericDisplayForm, 'applyNumericDisplay');
    window.state.canvasSelection.index = window.state.propsDialog.editIndex;
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveNumericDisplay(e) {
    e.preventDefault();
    const comp = readNumericDisplayForm();
    if (!comp.tag) {
      window.setStatus('Enter a Value tag on the Connections tab');
      switchTab('connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    document.getElementById('numericDisplayDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initNumericDisplayDialog() {
    const form = document.getElementById('numericDisplayForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveNumericDisplay(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyNumericDisplay')?.addEventListener('click', () => {
      applyNumericDisplay().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readNumericDisplayForm, 'applyNumericDisplay'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readNumericDisplayForm, 'applyNumericDisplay'));
    document.getElementById('cancelNumericDisplay')?.addEventListener('click', () => {
      document.getElementById('numericDisplayDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('numericDisplayDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpNumericDisplay')?.addEventListener('click', () => {
      alert('Numeric Display shows a tag value with configurable digits, decimals, and appearance.');
    });
    document.querySelectorAll('#numericDisplayDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.ndTab));
    });
    for (const id of ['ndUseBackColor', 'ndUseBorderColor', 'ndUsePatternColor', 'ndUseForeColor']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncNumericDisplayFields();
        window.updatePropsApplyButton(readNumericDisplayForm, 'applyNumericDisplay');
      });
    }
    for (const id of ['ndBold', 'ndItalic', 'ndUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readNumericDisplayForm, 'applyNumericDisplay');
      });
    }
  }

  window.StudioNumericDisplay = {
    initNumericDisplayDialog,
    showNumericDisplayDialog,
    fillNumericDisplayForm,
    readNumericDisplayForm,
    switchNumericDisplayTab: switchTab,
    wireNumericDisplayTools: wireTools
  };
})();
