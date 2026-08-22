/** Numeric Input Enable property dialog */
(function () {
  function switchTab(tabId) {
    document.querySelectorAll('#numericInputDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.nieTab === tabId);
    });
    document.querySelectorAll('#numericInputDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.nieTabPanel === tabId);
    });
  }

  function nextNumericInputName(components) {
    const n = (components || []).filter((c) => c.type === 'NumericInputEnable').length + 1;
    return `NumericInputEnable${n}`;
  }

  function defaultNumericInputComponent(overrides = {}) {
    return {
      type: 'NumericInputEnable',
      name: 'NumericInputEnable1',
      tag: '',
      optionalExpTag: '',
      enterTag: '',
      enterHandshakeTag: '',
      minimumTag: '',
      maximumTag: '',
      numericPopup: 'keypad',
      minValue: 0,
      maxValue: 2147483647,
      rampValue: 0,
      useVariableMinMax: false,
      decimalPoint: 'implicit',
      fixedPositionOutput: 'strippedValue',
      digitsAfterDecimal: 0,
      enterKeyControlDelay: 400,
      enterKeyHoldTime: 250,
      enterKeyHandshakeTime: 4000,
      handshakeResetType: 'nonZeroValue',
      caption: '',
      label: '',
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
      useForeColor: true,
      foreColor: '#ffffff',
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      alignment: 'middleCenter',
      wordWrap: true,
      numberOfDigits: 5,
      decimalPlaces: 0,
      format: 'integer',
      ...overrides
    };
  }

  function syncNumericInputFields() {
    document.getElementById('nieBackColor').disabled = !document.getElementById('nieUseBackColor')?.checked;
    document.getElementById('nieBorderColor').disabled = !document.getElementById('nieUseBorderColor')?.checked;
    document.getElementById('nieForeColor').disabled = !document.getElementById('nieUseForeColor')?.checked;
    document.getElementById('nieCaptionColor').disabled = !document.getElementById('nieUseCaptionColor')?.checked;
    const varMinMax = document.getElementById('nieUseVariableMinMax')?.checked;
    document.getElementById('nieMinValue').disabled = varMinMax;
    document.getElementById('nieMaxValue').disabled = varMinMax;
    const implicit = document.getElementById('nieDecimalPoint')?.value === 'implicit';
    document.getElementById('nieFixedPositionOutput').disabled = implicit;
    document.getElementById('nieDigitsAfterDecimal').disabled = implicit;
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('numericInputDialog'));
    syncNumericInputFields();
  }

  function fillNumericInputForm(comp) {
    document.getElementById('nieBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('nieBorderWidth').value = comp.borderWidth ?? 4;
    document.getElementById('nieBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('niePatternStyle').value = comp.patternStyle || 'none';
    document.getElementById('nieBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('nieUseBackColor').checked = comp.useBackColor !== false;
    document.getElementById('nieBackColor').value = comp.backColor || '#001C38';
    document.getElementById('nieUseBorderColor').checked = Boolean(comp.useBorderColor);
    document.getElementById('nieBorderColor').value = comp.borderColor || '#001C38';
    document.getElementById('nieUseForeColor').checked = comp.useForeColor !== false;
    document.getElementById('nieForeColor').value = comp.foreColor || '#ffffff';
    document.getElementById('nieCaption').value = comp.caption ?? comp.label ?? '';
    document.getElementById('nieFont').value = comp.fontFamily || 'Arial Unicode MS';
    document.getElementById('nieFontSize').value = String(comp.fontSize ?? 10);
    document.getElementById('nieBold').classList.toggle('active', Boolean(comp.bold));
    document.getElementById('nieItalic').classList.toggle('active', Boolean(comp.italic));
    document.getElementById('nieUnderline').classList.toggle('active', Boolean(comp.underline));
    document.getElementById('nieUseCaptionColor').checked = comp.useCaptionColor !== false;
    document.getElementById('nieCaptionColor').value = comp.captionColor || '#ffffff';
    document.getElementById('nieWordWrap').checked = comp.wordWrap !== false;
    document.querySelector(`#numericInputForm input[name="nieAlign"][value="${comp.alignment || 'middleCenter'}"]`)?.click();
    document.getElementById('nieNumericPopup').value = comp.numericPopup || 'keypad';
    document.getElementById('nieMinValue').value = comp.minValue ?? 0;
    document.getElementById('nieMaxValue').value = comp.maxValue ?? 2147483647;
    document.getElementById('nieRampValue').value = comp.rampValue ?? 0;
    document.getElementById('nieUseVariableMinMax').checked = Boolean(comp.useVariableMinMax);
    document.getElementById('nieDecimalPoint').value = comp.decimalPoint || 'implicit';
    document.getElementById('nieFixedPositionOutput').value = comp.fixedPositionOutput || 'strippedValue';
    document.getElementById('nieDigitsAfterDecimal').value = String(comp.digitsAfterDecimal ?? comp.decimalPlaces ?? 0);
    document.getElementById('nieEnterKeyControlDelay').value = String(comp.enterKeyControlDelay ?? 400);
    document.getElementById('nieEnterKeyHoldTime').value = String(comp.enterKeyHoldTime ?? 250);
    document.getElementById('nieEnterKeyHandshakeTime').value = String(comp.enterKeyHandshakeTime ?? 4000);
    document.getElementById('nieHandshakeResetType').value = comp.handshakeResetType || 'nonZeroValue';
    document.getElementById('nieHeight').value = comp.height ?? 28;
    document.getElementById('nieWidth').value = comp.width ?? 80;
    document.getElementById('nieTop').value = comp.top ?? 16;
    document.getElementById('nieLeft').value = comp.left ?? 16;
    document.getElementById('nieName').value = comp.name || 'NumericInputEnable1';
    document.getElementById('nieVisible').checked = comp.visible !== false;
    document.getElementById('nieTag').value = comp.tag || '';
    document.getElementById('nieOptionalExpTag').value = comp.optionalExpTag || '';
    document.getElementById('nieEnterTag').value = comp.enterTag || '';
    document.getElementById('nieEnterHandshakeTag').value = comp.enterHandshakeTag || '';
    document.getElementById('nieMinimumTag').value = comp.minimumTag || '';
    document.getElementById('nieMaximumTag').value = comp.maximumTag || '';
    syncNumericInputFields();
  }

  function readNumericInputForm() {
    const decimalPlaces = Number(document.getElementById('nieDigitsAfterDecimal').value) || 0;
    const caption = document.getElementById('nieCaption').value;
    return {
      type: 'NumericInputEnable',
      name: document.getElementById('nieName').value.trim() || 'NumericInputEnable1',
      tag: document.getElementById('nieTag').value.trim(),
      optionalExpTag: document.getElementById('nieOptionalExpTag').value.trim(),
      enterTag: document.getElementById('nieEnterTag').value.trim(),
      enterHandshakeTag: document.getElementById('nieEnterHandshakeTag').value.trim(),
      minimumTag: document.getElementById('nieMinimumTag').value.trim(),
      maximumTag: document.getElementById('nieMaximumTag').value.trim(),
      numericPopup: document.getElementById('nieNumericPopup').value || 'keypad',
      minValue: Number(document.getElementById('nieMinValue').value) || 0,
      maxValue: Number(document.getElementById('nieMaxValue').value) || 2147483647,
      rampValue: Number(document.getElementById('nieRampValue').value) || 0,
      useVariableMinMax: document.getElementById('nieUseVariableMinMax').checked,
      decimalPoint: document.getElementById('nieDecimalPoint').value || 'implicit',
      fixedPositionOutput: document.getElementById('nieFixedPositionOutput').value || 'strippedValue',
      digitsAfterDecimal: decimalPlaces,
      decimalPlaces,
      enterKeyControlDelay: Number(document.getElementById('nieEnterKeyControlDelay').value) || 400,
      enterKeyHoldTime: Number(document.getElementById('nieEnterKeyHoldTime').value) || 250,
      enterKeyHandshakeTime: Number(document.getElementById('nieEnterKeyHandshakeTime').value) || 4000,
      handshakeResetType: document.getElementById('nieHandshakeResetType').value || 'nonZeroValue',
      caption,
      label: caption,
      left: Number(document.getElementById('nieLeft').value) || 0,
      top: Number(document.getElementById('nieTop').value) || 0,
      width: Number(document.getElementById('nieWidth').value) || 80,
      height: Number(document.getElementById('nieHeight').value) || 28,
      visible: document.getElementById('nieVisible').checked,
      borderStyle: document.getElementById('nieBorderStyle').value,
      borderWidth: Number(document.getElementById('nieBorderWidth').value) || 4,
      borderUsesBackColor: document.getElementById('nieBorderUsesBackColor').checked,
      backStyle: document.getElementById('nieBackStyle').value,
      patternStyle: document.getElementById('niePatternStyle').value,
      useBackColor: document.getElementById('nieUseBackColor').checked,
      backColor: document.getElementById('nieBackColor').value,
      useBorderColor: document.getElementById('nieUseBorderColor').checked,
      borderColor: document.getElementById('nieBorderColor').value,
      useForeColor: document.getElementById('nieUseForeColor').checked,
      foreColor: document.getElementById('nieForeColor').value,
      fontFamily: document.getElementById('nieFont').value,
      fontSize: Number(document.getElementById('nieFontSize').value) || 10,
      bold: document.getElementById('nieBold').classList.contains('active'),
      italic: document.getElementById('nieItalic').classList.contains('active'),
      underline: document.getElementById('nieUnderline').classList.contains('active'),
      useCaptionColor: document.getElementById('nieUseCaptionColor').checked,
      captionColor: document.getElementById('nieCaptionColor').value,
      wordWrap: document.getElementById('nieWordWrap').checked,
      alignment: document.querySelector('#numericInputForm input[name="nieAlign"]:checked')?.value || 'middleCenter',
      numberOfDigits: 5,
      format: decimalPlaces > 0 ? 'float' : 'integer'
    };
  }

  async function showNumericInputDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then choose Numeric Input Enable');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultNumericInputComponent({
      name: nextNumericInputName(canvas?.components),
      ...overrides
    });
    fillNumericInputForm(comp);
    window.resetPropsDialogState('numeric-input', readNumericInputForm, 'applyNumericInput');
    switchTab('general');
    wireTools();
    document.getElementById('numericInputDialog')?.showModal();
  }

  async function applyNumericInput() {
    const comp = readNumericInputForm();
    if (!comp.tag) {
      window.setStatus('Enter a Value tag on the Connections tab');
      switchTab('connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readNumericInputForm, 'applyNumericInput');
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveNumericInput(e) {
    e.preventDefault();
    const comp = readNumericInputForm();
    if (!comp.tag) {
      window.setStatus('Enter a Value tag on the Connections tab');
      switchTab('connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    document.getElementById('numericInputDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initNumericInputDialog() {
    const form = document.getElementById('numericInputForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveNumericInput(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyNumericInput')?.addEventListener('click', () => {
      applyNumericInput().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readNumericInputForm, 'applyNumericInput'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readNumericInputForm, 'applyNumericInput'));
    document.getElementById('cancelNumericInput')?.addEventListener('click', () => {
      document.getElementById('numericInputDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('numericInputDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpNumericInput')?.addEventListener('click', () => {
      alert('Numeric Input Enable writes a value tag when the operator enters a number. Configure min/max, timing, and connections for handshake.');
    });
    document.querySelectorAll('#numericInputDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.nieTab));
    });
    for (const id of ['nieUseBackColor', 'nieUseBorderColor', 'nieUseForeColor', 'nieUseCaptionColor', 'nieUseVariableMinMax', 'nieDecimalPoint']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncNumericInputFields();
        window.updatePropsApplyButton(readNumericInputForm, 'applyNumericInput');
      });
    }
    for (const id of ['nieBold', 'nieItalic', 'nieUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readNumericInputForm, 'applyNumericInput');
      });
    }
  }

  window.StudioNumericInput = {
    initNumericInputDialog,
    showNumericInputDialog,
    fillNumericInputForm,
    readNumericInputForm,
    switchNumericInputTab: switchTab,
    wireNumericInputTools: wireTools,
    initNumericInputCursorDialog,
    showNumericInputCursorDialog,
    fillNumericInputCursorForm,
    readNumericInputCursorForm,
    switchNumericInputCursorTab: switchCursorTab,
    wireNumericInputCursorTools: wireCursorTools
  };

  // ─── Numeric Input Cursor Point ────────────────────────────────────────────

  function switchCursorTab(tabId) {
    document.querySelectorAll('#numericInputCursorDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.nicTab === tabId);
    });
    document.querySelectorAll('#numericInputCursorDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.nicTabPanel === tabId);
    });
  }

  function nextNumericInputCursorName(components) {
    const n = (components || []).filter((c) => c.type === 'NumericInputCursorPoint').length + 1;
    return `NumericInputCursorPoint${n}`;
  }

  function defaultNumericInputCursorComponent(overrides = {}) {
    return {
      type: 'NumericInputCursorPoint',
      name: 'NumericInputCursorPoint1',
      tag: '',
      optionalExpTag: '',
      indicatorTag: '',
      enterTag: '',
      enterHandshakeTag: '',
      minimumTag: '',
      maximumTag: '',
      numericPopup: 'keypad',
      keypadCaption: '',
      minValue: 0,
      maxValue: 2147483647,
      rampValue: 0,
      useVariableMinMax: false,
      decimalPoint: 'implicit',
      fixedPositionOutput: 'strippedValue',
      digitsAfterDecimal: 0,
      numberOfDigits: 5,
      fillLeftWith: 'none',
      decimalPlaces: 0,
      enterKeyControlDelay: 400,
      enterKeyHoldTime: 250,
      enterKeyHandshakeTime: 4000,
      handshakeResetType: 'nonZeroValue',
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
      useHighlightColor: false,
      highlightColor: '#0066cc',
      blink: false,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      alignment: 'middleCenter',
      horizontalMargin: 0,
      verticalMargin: 0,
      audio: true,
      keyNavigation: true,
      format: 'integer',
      ...overrides
    };
  }

  function syncNumericInputCursorFields() {
    document.getElementById('nicBackColor').disabled = !document.getElementById('nicUseBackColor')?.checked;
    document.getElementById('nicBorderColor').disabled = !document.getElementById('nicUseBorderColor')?.checked;
    document.getElementById('nicPatternColor').disabled = !document.getElementById('nicUsePatternColor')?.checked;
    document.getElementById('nicForeColor').disabled = !document.getElementById('nicUseForeColor')?.checked;
    document.getElementById('nicHighlightColor').disabled = !document.getElementById('nicUseHighlightColor')?.checked;
    const varMinMax = document.getElementById('nicUseVariableMinMax')?.checked;
    document.getElementById('nicMinValue').disabled = varMinMax;
    document.getElementById('nicMaxValue').disabled = varMinMax;
    const implicit = document.getElementById('nicDecimalPoint')?.value === 'implicit';
    document.getElementById('nicFixedPositionOutput').disabled = implicit;
    document.getElementById('nicDigitsAfterDecimal').disabled = implicit;
  }

  function wireCursorTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('numericInputCursorDialog'));
    syncNumericInputCursorFields();
  }

  function fillNumericInputCursorForm(comp) {
    document.getElementById('nicBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('nicBorderWidth').value = comp.borderWidth ?? 4;
    document.getElementById('nicBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('nicPatternStyle').value = comp.patternStyle || 'none';
    document.getElementById('nicBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('nicUseBackColor').checked = comp.useBackColor !== false;
    document.getElementById('nicBackColor').value = comp.backColor || '#001C38';
    document.getElementById('nicUseBorderColor').checked = Boolean(comp.useBorderColor);
    document.getElementById('nicBorderColor').value = comp.borderColor || '#001C38';
    document.getElementById('nicUsePatternColor').checked = Boolean(comp.usePatternColor);
    document.getElementById('nicPatternColor').value = comp.patternColor || '#ffffff';
    document.getElementById('nicUseForeColor').checked = comp.useForeColor !== false;
    document.getElementById('nicForeColor').value = comp.foreColor || '#ffffff';
    document.getElementById('nicUseHighlightColor').checked = Boolean(comp.useHighlightColor);
    document.getElementById('nicHighlightColor').value = comp.highlightColor || '#0066cc';
    document.getElementById('nicBlink').checked = Boolean(comp.blink);
    document.getElementById('nicFont').value = comp.fontFamily || 'Arial Unicode MS';
    document.getElementById('nicFontSize').value = String(comp.fontSize ?? 10);
    document.getElementById('nicBold').classList.toggle('active', Boolean(comp.bold));
    document.getElementById('nicItalic').classList.toggle('active', Boolean(comp.italic));
    document.getElementById('nicUnderline').classList.toggle('active', Boolean(comp.underline));
    document.querySelector(`#numericInputCursorForm input[name="nicAlign"][value="${comp.alignment || 'middleCenter'}"]`)?.click();
    document.getElementById('nicHorizontalMargin').value = comp.horizontalMargin ?? 0;
    document.getElementById('nicVerticalMargin').value = comp.verticalMargin ?? 0;
    document.getElementById('nicAudio').checked = comp.audio !== false;
    document.getElementById('nicKeyNavigation').checked = comp.keyNavigation !== false;
    document.getElementById('nicNumericPopup').value = comp.numericPopup || 'keypad';
    document.getElementById('nicKeypadCaption').value = comp.keypadCaption || '';
    document.getElementById('nicMinValue').value = comp.minValue ?? 0;
    document.getElementById('nicMaxValue').value = comp.maxValue ?? 2147483647;
    document.getElementById('nicRampValue').value = comp.rampValue ?? 0;
    document.getElementById('nicUseVariableMinMax').checked = Boolean(comp.useVariableMinMax);
    document.getElementById('nicDecimalPoint').value = comp.decimalPoint || 'implicit';
    document.getElementById('nicFixedPositionOutput').value = comp.fixedPositionOutput || 'strippedValue';
    document.getElementById('nicDigitsAfterDecimal').value = String(comp.digitsAfterDecimal ?? 0);
    document.getElementById('nicNumberOfDigits').value = String(comp.numberOfDigits ?? 5);
    document.getElementById('nicFillLeftWith').value = comp.fillLeftWith || 'none';
    document.getElementById('nicDecimalPlaces').value = String(comp.decimalPlaces ?? 0);
    document.getElementById('nicEnterKeyControlDelay').value = String(comp.enterKeyControlDelay ?? 400);
    document.getElementById('nicEnterKeyHoldTime').value = String(comp.enterKeyHoldTime ?? 250);
    document.getElementById('nicEnterKeyHandshakeTime').value = String(comp.enterKeyHandshakeTime ?? 4000);
    document.getElementById('nicHandshakeResetType').value = comp.handshakeResetType || 'nonZeroValue';
    document.getElementById('nicHeight').value = comp.height ?? 28;
    document.getElementById('nicWidth').value = comp.width ?? 80;
    document.getElementById('nicTop').value = comp.top ?? 16;
    document.getElementById('nicLeft').value = comp.left ?? 16;
    document.getElementById('nicName').value = comp.name || 'NumericInputCursorPoint1';
    document.getElementById('nicVisible').checked = comp.visible !== false;
    document.getElementById('nicTag').value = comp.tag || '';
    document.getElementById('nicOptionalExpTag').value = comp.optionalExpTag || '';
    document.getElementById('nicIndicatorTag').value = comp.indicatorTag || '';
    document.getElementById('nicEnterTag').value = comp.enterTag || '';
    document.getElementById('nicEnterHandshakeTag').value = comp.enterHandshakeTag || '';
    document.getElementById('nicMinimumTag').value = comp.minimumTag || '';
    document.getElementById('nicMaximumTag').value = comp.maximumTag || '';
    syncNumericInputCursorFields();
  }

  function readNumericInputCursorForm() {
    const decimalPlaces = Number(document.getElementById('nicDecimalPlaces').value) || 0;
    return {
      type: 'NumericInputCursorPoint',
      name: document.getElementById('nicName').value.trim() || 'NumericInputCursorPoint1',
      tag: document.getElementById('nicTag').value.trim(),
      optionalExpTag: document.getElementById('nicOptionalExpTag').value.trim(),
      indicatorTag: document.getElementById('nicIndicatorTag').value.trim(),
      enterTag: document.getElementById('nicEnterTag').value.trim(),
      enterHandshakeTag: document.getElementById('nicEnterHandshakeTag').value.trim(),
      minimumTag: document.getElementById('nicMinimumTag').value.trim(),
      maximumTag: document.getElementById('nicMaximumTag').value.trim(),
      numericPopup: document.getElementById('nicNumericPopup').value || 'keypad',
      keypadCaption: document.getElementById('nicKeypadCaption').value,
      minValue: Number(document.getElementById('nicMinValue').value) || 0,
      maxValue: Number(document.getElementById('nicMaxValue').value) || 2147483647,
      rampValue: Number(document.getElementById('nicRampValue').value) || 0,
      useVariableMinMax: document.getElementById('nicUseVariableMinMax').checked,
      decimalPoint: document.getElementById('nicDecimalPoint').value || 'implicit',
      fixedPositionOutput: document.getElementById('nicFixedPositionOutput').value || 'strippedValue',
      digitsAfterDecimal: Number(document.getElementById('nicDigitsAfterDecimal').value) || 0,
      numberOfDigits: Number(document.getElementById('nicNumberOfDigits').value) || 5,
      fillLeftWith: document.getElementById('nicFillLeftWith').value || 'none',
      decimalPlaces,
      enterKeyControlDelay: Number(document.getElementById('nicEnterKeyControlDelay').value) || 400,
      enterKeyHoldTime: Number(document.getElementById('nicEnterKeyHoldTime').value) || 250,
      enterKeyHandshakeTime: Number(document.getElementById('nicEnterKeyHandshakeTime').value) || 4000,
      handshakeResetType: document.getElementById('nicHandshakeResetType').value || 'nonZeroValue',
      left: Number(document.getElementById('nicLeft').value) || 0,
      top: Number(document.getElementById('nicTop').value) || 0,
      width: Number(document.getElementById('nicWidth').value) || 80,
      height: Number(document.getElementById('nicHeight').value) || 28,
      visible: document.getElementById('nicVisible').checked,
      borderStyle: document.getElementById('nicBorderStyle').value,
      borderWidth: Number(document.getElementById('nicBorderWidth').value) || 4,
      borderUsesBackColor: document.getElementById('nicBorderUsesBackColor').checked,
      backStyle: document.getElementById('nicBackStyle').value,
      patternStyle: document.getElementById('nicPatternStyle').value,
      useBackColor: document.getElementById('nicUseBackColor').checked,
      backColor: document.getElementById('nicBackColor').value,
      useBorderColor: document.getElementById('nicUseBorderColor').checked,
      borderColor: document.getElementById('nicBorderColor').value,
      usePatternColor: document.getElementById('nicUsePatternColor').checked,
      patternColor: document.getElementById('nicPatternColor').value,
      useForeColor: document.getElementById('nicUseForeColor').checked,
      foreColor: document.getElementById('nicForeColor').value,
      useHighlightColor: document.getElementById('nicUseHighlightColor').checked,
      highlightColor: document.getElementById('nicHighlightColor').value,
      blink: document.getElementById('nicBlink').checked,
      fontFamily: document.getElementById('nicFont').value,
      fontSize: Number(document.getElementById('nicFontSize').value) || 10,
      bold: document.getElementById('nicBold').classList.contains('active'),
      italic: document.getElementById('nicItalic').classList.contains('active'),
      underline: document.getElementById('nicUnderline').classList.contains('active'),
      alignment: document.querySelector('#numericInputCursorForm input[name="nicAlign"]:checked')?.value || 'middleCenter',
      horizontalMargin: Number(document.getElementById('nicHorizontalMargin').value) || 0,
      verticalMargin: Number(document.getElementById('nicVerticalMargin').value) || 0,
      audio: document.getElementById('nicAudio').checked,
      keyNavigation: document.getElementById('nicKeyNavigation').checked,
      format: decimalPlaces > 0 ? 'float' : 'integer'
    };
  }

  async function showNumericInputCursorDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then choose Numeric Input Cursor Point');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultNumericInputCursorComponent({
      name: nextNumericInputCursorName(canvas?.components),
      ...overrides
    });
    fillNumericInputCursorForm(comp);
    window.resetPropsDialogState('numeric-input-cursor', readNumericInputCursorForm, 'applyNumericInputCursor');
    switchCursorTab('general');
    wireCursorTools();
    document.getElementById('numericInputCursorDialog')?.showModal();
  }

  async function applyNumericInputCursor() {
    const comp = readNumericInputCursorForm();
    if (!comp.tag) {
      window.setStatus('Enter a Value tag on the Connections tab');
      switchCursorTab('connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readNumericInputCursorForm, 'applyNumericInputCursor');
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveNumericInputCursor(e) {
    e.preventDefault();
    const comp = readNumericInputCursorForm();
    if (!comp.tag) {
      window.setStatus('Enter a Value tag on the Connections tab');
      switchCursorTab('connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    document.getElementById('numericInputCursorDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initNumericInputCursorDialog() {
    const form = document.getElementById('numericInputCursorForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveNumericInputCursor(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyNumericInputCursor')?.addEventListener('click', () => {
      applyNumericInputCursor().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readNumericInputCursorForm, 'applyNumericInputCursor'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readNumericInputCursorForm, 'applyNumericInputCursor'));
    document.getElementById('cancelNumericInputCursor')?.addEventListener('click', () => {
      document.getElementById('numericInputCursorDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('numericInputCursorDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpNumericInputCursor')?.addEventListener('click', () => {
      alert('Numeric Input Cursor Point writes Value on entry and displays Indicator. Supports keypad caption, display formatting, and handshake timing.');
    });
    document.querySelectorAll('#numericInputCursorDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchCursorTab(tab.dataset.nicTab));
    });
    for (const id of ['nicUseBackColor', 'nicUseBorderColor', 'nicUsePatternColor', 'nicUseForeColor', 'nicUseHighlightColor', 'nicUseVariableMinMax', 'nicDecimalPoint']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncNumericInputCursorFields();
        window.updatePropsApplyButton(readNumericInputCursorForm, 'applyNumericInputCursor');
      });
    }
    for (const id of ['nicBold', 'nicItalic', 'nicUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readNumericInputCursorForm, 'applyNumericInputCursor');
      });
    }
  }
})();
