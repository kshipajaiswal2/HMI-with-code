/** String Input Enable property dialog */
(function () {
  function switchTab(tabId) {
    document.querySelectorAll('#stringInputDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.sieTab === tabId);
    });
    document.querySelectorAll('#stringInputDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.sieTabPanel === tabId);
    });
  }

  function nextStringInputName(components) {
    const n = (components || []).filter((c) => c.type === 'StringInputEnable').length + 1;
    return `StringInputEnable${n}`;
  }

  function defaultStringInputComponent(overrides = {}) {
    return {
      type: 'StringInputEnable',
      name: 'StringInputEnable1',
      tag: '',
      enterTag: '',
      enterHandshakeTag: '',
      stringPopup: 'keyboard',
      numberOfInputCharacters: 8,
      fillCharacter: 'null',
      maskScratchpad: false,
      enterKeyControlDelay: 400,
      enterKeyHoldTime: 250,
      enterKeyHandshakeTime: 4000,
      handshakeResetType: 'nonZeroValue',
      caption: '',
      label: '',
      left: 16,
      top: 16,
      width: 80,
      height: 80,
      visible: true,
      borderStyle: 'line',
      borderWidth: 4,
      borderUsesBackColor: true,
      backStyle: 'solid',
      patternStyle: 'none',
      shape: 'rectangle',
      useBackColor: true,
      backColor: '#001C38',
      useBorderColor: true,
      borderColor: '#001C38',
      useHighlightColor: false,
      highlightColor: '#0066cc',
      blink: false,
      horizontalMargin: 0,
      verticalMargin: 0,
      audio: true,
      keyNavigation: false,
      takeFocusOnPress: false,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      alignment: 'middleCenter',
      wordWrap: true,
      useCaptionColor: false,
      captionColor: '#ffffff',
      captionBackStyle: 'transparent',
      useCaptionBackColor: false,
      captionBackColor: '#001C38',
      captionBlink: false,
      ...overrides
    };
  }

  function syncStringInputFields() {
    document.getElementById('sieBackColor').disabled = !document.getElementById('sieUseBackColor')?.checked;
    document.getElementById('sieBorderColor').disabled = !document.getElementById('sieUseBorderColor')?.checked;
    document.getElementById('sieHighlightColor').disabled = !document.getElementById('sieUseHighlightColor')?.checked;
    document.getElementById('sieCaptionColor').disabled = !document.getElementById('sieUseCaptionColor')?.checked;
    document.getElementById('sieCaptionBackColor').disabled = !document.getElementById('sieUseCaptionBackColor')?.checked;
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('stringInputDialog'));
    syncStringInputFields();
  }

  function fillStringInputForm(comp) {
    document.getElementById('sieBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('sieBorderWidth').value = comp.borderWidth ?? 4;
    document.getElementById('sieBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('siePatternStyle').value = comp.patternStyle || 'none';
    document.getElementById('sieShape').value = comp.shape || 'rectangle';
    document.getElementById('sieBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('sieUseBackColor').checked = comp.useBackColor !== false;
    document.getElementById('sieBackColor').value = comp.backColor || '#001C38';
    document.getElementById('sieUseBorderColor').checked = Boolean(comp.useBorderColor);
    document.getElementById('sieBorderColor').value = comp.borderColor || '#001C38';
    document.getElementById('sieUseHighlightColor').checked = Boolean(comp.useHighlightColor);
    document.getElementById('sieHighlightColor').value = comp.highlightColor || '#0066cc';
    document.getElementById('sieBlink').checked = Boolean(comp.blink);
    document.getElementById('sieHorizontalMargin').value = comp.horizontalMargin ?? 0;
    document.getElementById('sieVerticalMargin').value = comp.verticalMargin ?? 0;
    document.getElementById('sieAudio').checked = comp.audio !== false;
    document.getElementById('sieKeyNavigation').checked = Boolean(comp.keyNavigation);
    document.getElementById('sieTakeFocusOnPress').checked = Boolean(comp.takeFocusOnPress);
    document.getElementById('sieCaption').value = comp.caption ?? comp.label ?? '';
    document.getElementById('sieFont').value = comp.fontFamily || 'Arial Unicode MS';
    document.getElementById('sieFontSize').value = String(comp.fontSize ?? 10);
    document.getElementById('sieBold').classList.toggle('active', Boolean(comp.bold));
    document.getElementById('sieItalic').classList.toggle('active', Boolean(comp.italic));
    document.getElementById('sieUnderline').classList.toggle('active', Boolean(comp.underline));
    document.getElementById('sieUseCaptionColor').checked = Boolean(comp.useCaptionColor);
    document.getElementById('sieCaptionColor').value = comp.captionColor || '#ffffff';
    document.getElementById('sieUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
    document.getElementById('sieCaptionBackColor').value = comp.captionBackColor || '#001C38';
    document.getElementById('sieCaptionBlink').checked = Boolean(comp.captionBlink);
    document.getElementById('sieWordWrap').checked = comp.wordWrap !== false;
    document.getElementById('sieCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
    document.querySelector(`#stringInputForm input[name="sieAlign"][value="${comp.alignment || 'middleCenter'}"]`)?.click();
    document.getElementById('sieStringPopup').value = comp.stringPopup || 'keyboard';
    document.getElementById('sieNumberOfInputCharacters').value = String(comp.numberOfInputCharacters ?? 8);
    document.getElementById('sieFillCharacter').value = comp.fillCharacter || 'null';
    document.getElementById('sieMaskScratchpad').checked = Boolean(comp.maskScratchpad);
    document.getElementById('sieEnterKeyControlDelay').value = String(comp.enterKeyControlDelay ?? 400);
    document.getElementById('sieEnterKeyHoldTime').value = String(comp.enterKeyHoldTime ?? 250);
    document.getElementById('sieEnterKeyHandshakeTime').value = String(comp.enterKeyHandshakeTime ?? 4000);
    document.getElementById('sieHandshakeResetType').value = comp.handshakeResetType || 'nonZeroValue';
    document.getElementById('sieHeight').value = comp.height ?? 80;
    document.getElementById('sieWidth').value = comp.width ?? 80;
    document.getElementById('sieTop').value = comp.top ?? 16;
    document.getElementById('sieLeft').value = comp.left ?? 16;
    document.getElementById('sieName').value = comp.name || 'StringInputEnable1';
    document.getElementById('sieVisible').checked = comp.visible !== false;
    document.getElementById('sieTag').value = comp.tag || '';
    document.getElementById('sieEnterTag').value = comp.enterTag || '';
    document.getElementById('sieEnterHandshakeTag').value = comp.enterHandshakeTag || '';
    syncStringInputFields();
  }

  function readStringInputForm() {
    const caption = document.getElementById('sieCaption').value;
    return {
      type: 'StringInputEnable',
      name: document.getElementById('sieName').value.trim() || 'StringInputEnable1',
      tag: document.getElementById('sieTag').value.trim(),
      enterTag: document.getElementById('sieEnterTag').value.trim(),
      enterHandshakeTag: document.getElementById('sieEnterHandshakeTag').value.trim(),
      stringPopup: document.getElementById('sieStringPopup').value || 'keyboard',
      numberOfInputCharacters: Number(document.getElementById('sieNumberOfInputCharacters').value) || 8,
      fillCharacter: document.getElementById('sieFillCharacter').value || 'null',
      maskScratchpad: document.getElementById('sieMaskScratchpad').checked,
      enterKeyControlDelay: Number(document.getElementById('sieEnterKeyControlDelay').value) || 400,
      enterKeyHoldTime: Number(document.getElementById('sieEnterKeyHoldTime').value) || 250,
      enterKeyHandshakeTime: Number(document.getElementById('sieEnterKeyHandshakeTime').value) || 4000,
      handshakeResetType: document.getElementById('sieHandshakeResetType').value || 'nonZeroValue',
      caption,
      label: caption,
      left: Number(document.getElementById('sieLeft').value) || 0,
      top: Number(document.getElementById('sieTop').value) || 0,
      width: Number(document.getElementById('sieWidth').value) || 80,
      height: Number(document.getElementById('sieHeight').value) || 80,
      visible: document.getElementById('sieVisible').checked,
      borderStyle: document.getElementById('sieBorderStyle').value,
      borderWidth: Number(document.getElementById('sieBorderWidth').value) || 4,
      borderUsesBackColor: document.getElementById('sieBorderUsesBackColor').checked,
      backStyle: document.getElementById('sieBackStyle').value,
      patternStyle: document.getElementById('siePatternStyle').value,
      shape: document.getElementById('sieShape').value || 'rectangle',
      useBackColor: document.getElementById('sieUseBackColor').checked,
      backColor: document.getElementById('sieBackColor').value,
      useBorderColor: document.getElementById('sieUseBorderColor').checked,
      borderColor: document.getElementById('sieBorderColor').value,
      useHighlightColor: document.getElementById('sieUseHighlightColor').checked,
      highlightColor: document.getElementById('sieHighlightColor').value,
      blink: document.getElementById('sieBlink').checked,
      horizontalMargin: Number(document.getElementById('sieHorizontalMargin').value) || 0,
      verticalMargin: Number(document.getElementById('sieVerticalMargin').value) || 0,
      audio: document.getElementById('sieAudio').checked,
      keyNavigation: document.getElementById('sieKeyNavigation').checked,
      takeFocusOnPress: document.getElementById('sieTakeFocusOnPress').checked,
      fontFamily: document.getElementById('sieFont').value,
      fontSize: Number(document.getElementById('sieFontSize').value) || 10,
      bold: document.getElementById('sieBold').classList.contains('active'),
      italic: document.getElementById('sieItalic').classList.contains('active'),
      underline: document.getElementById('sieUnderline').classList.contains('active'),
      useCaptionColor: document.getElementById('sieUseCaptionColor').checked,
      captionColor: document.getElementById('sieCaptionColor').value,
      useCaptionBackColor: document.getElementById('sieUseCaptionBackColor').checked,
      captionBackColor: document.getElementById('sieCaptionBackColor').value,
      captionBlink: document.getElementById('sieCaptionBlink').checked,
      captionBackStyle: document.getElementById('sieCaptionBackStyle').value,
      wordWrap: document.getElementById('sieWordWrap').checked,
      alignment: document.querySelector('#stringInputForm input[name="sieAlign"]:checked')?.value || 'middleCenter'
    };
  }

  async function showStringInputDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then choose String Input Enable');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultStringInputComponent({
      name: nextStringInputName(canvas?.components),
      ...overrides
    });
    fillStringInputForm(comp);
    window.resetPropsDialogState('string-input', readStringInputForm, 'applyStringInput');
    switchTab('general');
    wireTools();
    document.getElementById('stringInputDialog')?.showModal();
  }

  async function applyStringInput() {
    const comp = readStringInputForm();
    if (!comp.tag) {
      window.setStatus('Enter a Value tag on the Connections tab');
      switchTab('connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readStringInputForm, 'applyStringInput');
    window.state.canvasSelection.index = window.state.propsDialog.editIndex;
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveStringInput(e) {
    e.preventDefault();
    const comp = readStringInputForm();
    if (!comp.tag) {
      window.setStatus('Enter a Value tag on the Connections tab');
      switchTab('connections');
      return;
    }
    await window.upsertCanvasComponent(comp);
    document.getElementById('stringInputDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initStringInputDialog() {
    const form = document.getElementById('stringInputForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveStringInput(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyStringInput')?.addEventListener('click', () => {
      applyStringInput().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readStringInputForm, 'applyStringInput'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readStringInputForm, 'applyStringInput'));
    document.getElementById('cancelStringInput')?.addEventListener('click', () => {
      document.getElementById('stringInputDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('stringInputDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpStringInput')?.addEventListener('click', () => {
      alert('String Input Enable writes a string value tag when the operator enters text. Configure character limits, timing, and enter handshake on the Connections tab.');
    });
    document.querySelectorAll('#stringInputDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.sieTab));
    });
    for (const id of ['sieUseBackColor', 'sieUseBorderColor', 'sieUseHighlightColor', 'sieUseCaptionColor', 'sieUseCaptionBackColor']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncStringInputFields();
        window.updatePropsApplyButton(readStringInputForm, 'applyStringInput');
      });
    }
    for (const id of ['sieBold', 'sieItalic', 'sieUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readStringInputForm, 'applyStringInput');
      });
    }
  }

  window.StudioStringInput = {
    initStringInputDialog,
    showStringInputDialog,
    fillStringInputForm,
    readStringInputForm,
    switchStringInputTab: switchTab,
    wireStringInputTools: wireTools
  };
})();
