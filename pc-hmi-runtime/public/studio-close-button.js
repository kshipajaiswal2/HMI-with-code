/** Close Display Button property dialog */
(function () {
  function switchTab(tabId) {
    document.querySelectorAll('#closeDisplayButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.cdbTab === tabId);
    });
    document.querySelectorAll('#closeDisplayButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.cdbTabPanel === tabId);
    });
  }

  function nextCloseDisplayButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'CloseDisplayButton').length + 1;
    return `CloseDisplayButton${n}`;
  }

  function defaultCloseDisplayButtonComponent(overrides = {}) {
    return {
      type: 'CloseDisplayButton',
      name: 'CloseDisplayButton1',
      tag: '',
      label: '',
      caption: '',
      writeOnClose: false,
      closeValue: 0,
      left: 16,
      top: 16,
      width: 80,
      height: 80,
      visible: true,
      borderStyle: 'line',
      borderWidth: 1,
      borderUsesBackColor: true,
      useBackColor: true,
      useBorderColor: true,
      usePatternColor: false,
      useHighlightColor: false,
      backStyle: 'solid',
      backColor: '#001C38',
      borderColor: '#001C38',
      patternColor: '#ffffff',
      highlightColor: '#0066cc',
      patternStyle: 'none',
      shape: 'rectangle',
      blink: false,
      audio: true,
      horizontalMargin: 0,
      verticalMargin: 0,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      foreColor: '#ffffff',
      useForeColor: false,
      useCaptionColor: false,
      captionBackStyle: 'transparent',
      wordWrap: true,
      alignment: 'middleCenter',
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      ...overrides
    };
  }

  function syncCloseDisplayButtonFields() {
    document.getElementById('cdbBackColor').disabled = !document.getElementById('cdbUseBackColor')?.checked;
    document.getElementById('cdbBorderColor').disabled = !document.getElementById('cdbUseBorderColor')?.checked;
    document.getElementById('cdbPatternColor').disabled = !document.getElementById('cdbUsePatternColor')?.checked;
    document.getElementById('cdbHighlightColor').disabled = !document.getElementById('cdbUseHighlightColor')?.checked;
    document.getElementById('cdbCaptionColor').disabled = !document.getElementById('cdbUseCaptionColor')?.checked;
    document.getElementById('cdbCaptionBackColor').disabled = !document.getElementById('cdbUseCaptionBackColor')?.checked;
    document.getElementById('cdbImageColor').disabled = !document.getElementById('cdbUseImageColor')?.checked;
    document.getElementById('cdbImageBackColor').disabled = !document.getElementById('cdbUseImageBackColor')?.checked;
    const writeOnClose = document.getElementById('cdbWriteOnClose')?.checked;
    document.getElementById('cdbCloseValue').disabled = !writeOnClose;
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('closeDisplayButtonDialog'));
    syncCloseDisplayButtonFields();
  }

  function fillCloseDisplayButtonForm(comp) {
    document.getElementById('cdbBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('cdbBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('cdbShape').value = comp.shape || 'rectangle';
    document.getElementById('cdbBorderWidth').value = comp.borderWidth ?? 1;
    document.getElementById('cdbPatternStyle').value = comp.patternStyle || 'none';
    document.getElementById('cdbBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('cdbUseBackColor').checked = comp.useBackColor !== false;
    document.getElementById('cdbBackColor').value = comp.backColor || '#001C38';
    document.getElementById('cdbUseBorderColor').checked = Boolean(comp.useBorderColor);
    document.getElementById('cdbBorderColor').value = comp.borderColor || '#001C38';
    document.getElementById('cdbUsePatternColor').checked = Boolean(comp.usePatternColor);
    document.getElementById('cdbPatternColor').value = comp.patternColor || '#ffffff';
    document.getElementById('cdbUseHighlightColor').checked = Boolean(comp.useHighlightColor);
    document.getElementById('cdbHighlightColor').value = comp.highlightColor || '#0066cc';
    document.getElementById('cdbBlink').checked = Boolean(comp.blink);
    document.getElementById('cdbWriteOnClose').checked = Boolean(comp.writeOnClose);
    document.getElementById('cdbCloseValue').value = comp.closeValue ?? 0;
    document.getElementById('cdbHorizontalMargin').value = comp.horizontalMargin ?? 0;
    document.getElementById('cdbVerticalMargin').value = comp.verticalMargin ?? 0;
    document.getElementById('cdbAudio').checked = comp.audio !== false;
    document.getElementById('cdbCaption').value = comp.caption ?? comp.label ?? '';
    document.getElementById('cdbFont').value = comp.fontFamily || 'Arial Unicode MS';
    document.getElementById('cdbFontSize').value = String(comp.fontSize ?? 10);
    document.getElementById('cdbBold').classList.toggle('active', Boolean(comp.bold));
    document.getElementById('cdbItalic').classList.toggle('active', Boolean(comp.italic));
    document.getElementById('cdbUnderline').classList.toggle('active', Boolean(comp.underline));
    document.getElementById('cdbUseCaptionColor').checked = comp.useCaptionColor !== undefined
      ? Boolean(comp.useCaptionColor)
      : comp.useForeColor !== false;
    document.getElementById('cdbCaptionColor').value = comp.foreColor || '#ffffff';
    document.getElementById('cdbUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
    document.getElementById('cdbCaptionBackColor').value = comp.captionBackColor || '#001C38';
    document.getElementById('cdbCaptionBlink').checked = Boolean(comp.captionBlink);
    document.getElementById('cdbWordWrap').checked = comp.wordWrap !== false;
    document.querySelector(`#closeDisplayButtonForm input[name="cdbAlign"][value="${comp.alignment || 'middleCenter'}"]`)?.click();
    document.getElementById('cdbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
    document.getElementById('cdbImage').value = comp.image || '';
    document.getElementById('cdbImageBackStyle').value = comp.imageBackStyle || 'transparent';
    document.getElementById('cdbUseImageColor').checked = Boolean(comp.useImageColor);
    document.getElementById('cdbImageColor').value = comp.imageColor || '#ffffff';
    document.getElementById('cdbUseImageBackColor').checked = Boolean(comp.useImageBackColor);
    document.getElementById('cdbImageBackColor').value = comp.imageBackColor || '#001C38';
    document.getElementById('cdbImageBlink').checked = Boolean(comp.imageBlink);
    document.getElementById('cdbImageScaled').checked = Boolean(comp.imageScaled);
    document.querySelector(`#closeDisplayButtonForm input[name="cdbImageAlign"][value="${comp.imageAlignment || 'middleCenter'}"]`)?.click();
    document.getElementById('cdbTag').value = comp.tag || '';
    document.getElementById('cdbHeight').value = comp.height ?? 80;
    document.getElementById('cdbWidth').value = comp.width ?? 80;
    document.getElementById('cdbTop').value = comp.top ?? 16;
    document.getElementById('cdbLeft').value = comp.left ?? 16;
    document.getElementById('cdbName').value = comp.name || 'CloseDisplayButton1';
    document.getElementById('cdbVisible').checked = comp.visible !== false;
    syncCloseDisplayButtonFields();
  }

  function readCloseDisplayButtonForm() {
    const alignment = document.querySelector('#closeDisplayButtonForm input[name="cdbAlign"]:checked')?.value || 'middleCenter';
    const caption = document.getElementById('cdbCaption').value;
    return {
      type: 'CloseDisplayButton',
      name: document.getElementById('cdbName').value.trim() || 'CloseDisplayButton1',
      tag: document.getElementById('cdbTag').value.trim(),
      label: caption,
      caption,
      writeOnClose: document.getElementById('cdbWriteOnClose').checked,
      closeValue: Number(document.getElementById('cdbCloseValue').value) || 0,
      left: Number(document.getElementById('cdbLeft').value) || 0,
      top: Number(document.getElementById('cdbTop').value) || 0,
      width: Number(document.getElementById('cdbWidth').value) || 80,
      height: Number(document.getElementById('cdbHeight').value) || 80,
      visible: document.getElementById('cdbVisible').checked,
      borderStyle: document.getElementById('cdbBorderStyle').value,
      borderWidth: Number(document.getElementById('cdbBorderWidth').value) || 1,
      borderUsesBackColor: document.getElementById('cdbBorderUsesBackColor').checked,
      useBackColor: document.getElementById('cdbUseBackColor').checked,
      backColor: document.getElementById('cdbBackColor').value,
      useBorderColor: document.getElementById('cdbUseBorderColor').checked,
      borderColor: document.getElementById('cdbBorderColor').value,
      usePatternColor: document.getElementById('cdbUsePatternColor').checked,
      patternColor: document.getElementById('cdbPatternColor').value,
      useHighlightColor: document.getElementById('cdbUseHighlightColor').checked,
      highlightColor: document.getElementById('cdbHighlightColor').value,
      backStyle: document.getElementById('cdbBackStyle').value,
      patternStyle: document.getElementById('cdbPatternStyle').value,
      shape: document.getElementById('cdbShape').value,
      blink: document.getElementById('cdbBlink').checked,
      horizontalMargin: Number(document.getElementById('cdbHorizontalMargin').value) || 0,
      verticalMargin: Number(document.getElementById('cdbVerticalMargin').value) || 0,
      audio: document.getElementById('cdbAudio').checked,
      fontFamily: document.getElementById('cdbFont').value,
      fontSize: Number(document.getElementById('cdbFontSize').value) || 10,
      bold: document.getElementById('cdbBold').classList.contains('active'),
      italic: document.getElementById('cdbItalic').classList.contains('active'),
      underline: document.getElementById('cdbUnderline').classList.contains('active'),
      foreColor: document.getElementById('cdbCaptionColor').value,
      useForeColor: document.getElementById('cdbUseCaptionColor').checked,
      useCaptionColor: document.getElementById('cdbUseCaptionColor').checked,
      useCaptionBackColor: document.getElementById('cdbUseCaptionBackColor').checked,
      captionBackColor: document.getElementById('cdbCaptionBackColor').value,
      captionBlink: document.getElementById('cdbCaptionBlink').checked,
      captionBackStyle: document.getElementById('cdbCaptionBackStyle').value,
      wordWrap: document.getElementById('cdbWordWrap').checked,
      alignment,
      image: document.getElementById('cdbImage').value.trim() || undefined,
      imageBackStyle: document.getElementById('cdbImageBackStyle').value,
      useImageColor: document.getElementById('cdbUseImageColor').checked,
      imageColor: document.getElementById('cdbImageColor').value,
      useImageBackColor: document.getElementById('cdbUseImageBackColor').checked,
      imageBackColor: document.getElementById('cdbImageBackColor').value,
      imageBlink: document.getElementById('cdbImageBlink').checked,
      imageScaled: document.getElementById('cdbImageScaled').checked,
      imageAlignment: document.querySelector('#closeDisplayButtonForm input[name="cdbImageAlign"]:checked')?.value || 'middleCenter'
    };
  }

  function validateCloseDisplayButton(comp) {
    if (comp.writeOnClose && !comp.tag) {
      window.setStatus('Enter a Value tag on the Connections tab when Write on close is enabled');
      switchTab('connections');
      return false;
    }
    return true;
  }

  async function showCloseDisplayButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then choose Close from Display Navigation');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultCloseDisplayButtonComponent({
      name: nextCloseDisplayButtonName(canvas?.components),
      ...overrides
    });
    fillCloseDisplayButtonForm(comp);
    window.resetPropsDialogState('close-display', readCloseDisplayButtonForm, 'applyCloseDisplayButton');
    switchTab('general');
    wireTools();
    document.getElementById('closeDisplayButtonDialog')?.showModal();
  }

  async function applyCloseDisplayButton() {
    const comp = readCloseDisplayButtonForm();
    if (!validateCloseDisplayButton(comp)) return;
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readCloseDisplayButtonForm, 'applyCloseDisplayButton');
    window.state.canvasSelection.index = window.state.propsDialog.editIndex;
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveCloseDisplayButton(e) {
    e.preventDefault();
    const comp = readCloseDisplayButtonForm();
    if (!validateCloseDisplayButton(comp)) return;
    await window.upsertCanvasComponent(comp);
    document.getElementById('closeDisplayButtonDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initCloseDisplayButtonDialog() {
    const form = document.getElementById('closeDisplayButtonForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveCloseDisplayButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyCloseDisplayButton')?.addEventListener('click', () => {
      applyCloseDisplayButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readCloseDisplayButtonForm, 'applyCloseDisplayButton'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readCloseDisplayButtonForm, 'applyCloseDisplayButton'));
    document.getElementById('cancelCloseDisplayButton')?.addEventListener('click', () => {
      document.getElementById('closeDisplayButtonDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('closeDisplayButtonDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpCloseDisplayButton')?.addEventListener('click', () => {
      alert('Close Display Button closes the current display. Optionally writes a close value to a tag when Write on close is enabled.');
    });
    document.querySelectorAll('#closeDisplayButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.cdbTab));
    });
    for (const id of [
      'cdbBorderUsesBackColor', 'cdbUseBackColor', 'cdbUseBorderColor', 'cdbUsePatternColor',
      'cdbUseHighlightColor', 'cdbUseCaptionColor', 'cdbUseCaptionBackColor', 'cdbUseImageColor',
      'cdbUseImageBackColor', 'cdbWriteOnClose'
    ]) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncCloseDisplayButtonFields();
        window.updatePropsApplyButton(readCloseDisplayButtonForm, 'applyCloseDisplayButton');
      });
    }
    for (const id of ['cdbBold', 'cdbItalic', 'cdbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readCloseDisplayButtonForm, 'applyCloseDisplayButton');
      });
    }
    document.getElementById('cdbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('cdbImage').value || null })
        .then((fileName) => {
          if (fileName) {
            document.getElementById('cdbImage').value = fileName;
            window.updatePropsApplyButton(readCloseDisplayButtonForm, 'applyCloseDisplayButton');
          }
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
  }

  window.StudioCloseDisplayButton = {
    initCloseDisplayButtonDialog,
    showCloseDisplayButtonDialog,
    fillCloseDisplayButtonForm,
    readCloseDisplayButtonForm,
    switchCloseDisplayButtonTab: switchTab,
    wireCloseDisplayButtonTools: wireTools
  };
})();
