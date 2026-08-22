/** Return to Display Button property dialog */
(function () {
  function switchTab(tabId) {
    document.querySelectorAll('#returnToButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.rtbTab === tabId);
    });
    document.querySelectorAll('#returnToButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.rtbTabPanel === tabId);
    });
  }

  function nextReturnToButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'ReturnToButton').length + 1;
    return `ReturnToDisplayButton${n}`;
  }

  function defaultReturnToButtonComponent(overrides = {}) {
    return {
      type: 'ReturnToButton',
      name: 'ReturnToDisplayButton1',
      label: '',
      caption: '',
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

  function syncReturnToButtonFields() {
    document.getElementById('rtbBackColor').disabled = !document.getElementById('rtbUseBackColor')?.checked;
    document.getElementById('rtbBorderColor').disabled = !document.getElementById('rtbUseBorderColor')?.checked;
    document.getElementById('rtbPatternColor').disabled = !document.getElementById('rtbUsePatternColor')?.checked;
    document.getElementById('rtbHighlightColor').disabled = !document.getElementById('rtbUseHighlightColor')?.checked;
    document.getElementById('rtbCaptionColor').disabled = !document.getElementById('rtbUseCaptionColor')?.checked;
    document.getElementById('rtbCaptionBackColor').disabled = !document.getElementById('rtbUseCaptionBackColor')?.checked;
    document.getElementById('rtbImageColor').disabled = !document.getElementById('rtbUseImageColor')?.checked;
    document.getElementById('rtbImageBackColor').disabled = !document.getElementById('rtbUseImageBackColor')?.checked;
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('returnToButtonDialog'));
    syncReturnToButtonFields();
  }

  function fillReturnToButtonForm(comp) {
    document.getElementById('rtbBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('rtbBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('rtbShape').value = comp.shape || 'rectangle';
    document.getElementById('rtbBorderWidth').value = comp.borderWidth ?? 1;
    document.getElementById('rtbPatternStyle').value = comp.patternStyle || 'none';
    document.getElementById('rtbBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('rtbUseBackColor').checked = comp.useBackColor !== false;
    document.getElementById('rtbBackColor').value = comp.backColor || '#001C38';
    document.getElementById('rtbUseBorderColor').checked = Boolean(comp.useBorderColor);
    document.getElementById('rtbBorderColor').value = comp.borderColor || '#001C38';
    document.getElementById('rtbUsePatternColor').checked = Boolean(comp.usePatternColor);
    document.getElementById('rtbPatternColor').value = comp.patternColor || '#ffffff';
    document.getElementById('rtbUseHighlightColor').checked = Boolean(comp.useHighlightColor);
    document.getElementById('rtbHighlightColor').value = comp.highlightColor || '#0066cc';
    document.getElementById('rtbBlink').checked = Boolean(comp.blink);
    document.getElementById('rtbHorizontalMargin').value = comp.horizontalMargin ?? 0;
    document.getElementById('rtbVerticalMargin').value = comp.verticalMargin ?? 0;
    document.getElementById('rtbAudio').checked = comp.audio !== false;
    document.getElementById('rtbCaption').value = comp.caption ?? comp.label ?? '';
    document.getElementById('rtbFont').value = comp.fontFamily || 'Arial Unicode MS';
    document.getElementById('rtbFontSize').value = String(comp.fontSize ?? 10);
    document.getElementById('rtbBold').classList.toggle('active', Boolean(comp.bold));
    document.getElementById('rtbItalic').classList.toggle('active', Boolean(comp.italic));
    document.getElementById('rtbUnderline').classList.toggle('active', Boolean(comp.underline));
    document.getElementById('rtbUseCaptionColor').checked = comp.useCaptionColor !== undefined
      ? Boolean(comp.useCaptionColor)
      : comp.useForeColor !== false;
    document.getElementById('rtbCaptionColor').value = comp.foreColor || '#ffffff';
    document.getElementById('rtbUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
    document.getElementById('rtbCaptionBackColor').value = comp.captionBackColor || '#001C38';
    document.getElementById('rtbCaptionBlink').checked = Boolean(comp.captionBlink);
    document.getElementById('rtbWordWrap').checked = comp.wordWrap !== false;
    document.querySelector(`#returnToButtonForm input[name="rtbAlign"][value="${comp.alignment || 'middleCenter'}"]`)?.click();
    document.getElementById('rtbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
    document.getElementById('rtbImage').value = comp.image || '';
    document.getElementById('rtbImageBackStyle').value = comp.imageBackStyle || 'transparent';
    document.getElementById('rtbUseImageColor').checked = Boolean(comp.useImageColor);
    document.getElementById('rtbImageColor').value = comp.imageColor || '#ffffff';
    document.getElementById('rtbUseImageBackColor').checked = Boolean(comp.useImageBackColor);
    document.getElementById('rtbImageBackColor').value = comp.imageBackColor || '#001C38';
    document.getElementById('rtbImageBlink').checked = Boolean(comp.imageBlink);
    document.getElementById('rtbImageScaled').checked = Boolean(comp.imageScaled);
    document.querySelector(`#returnToButtonForm input[name="rtbImageAlign"][value="${comp.imageAlignment || 'middleCenter'}"]`)?.click();
    document.getElementById('rtbHeight').value = comp.height ?? 80;
    document.getElementById('rtbWidth').value = comp.width ?? 80;
    document.getElementById('rtbTop').value = comp.top ?? 16;
    document.getElementById('rtbLeft').value = comp.left ?? 16;
    document.getElementById('rtbName').value = comp.name || 'ReturnToDisplayButton1';
    document.getElementById('rtbVisible').checked = comp.visible !== false;
    syncReturnToButtonFields();
  }

  function readReturnToButtonForm() {
    const alignment = document.querySelector('#returnToButtonForm input[name="rtbAlign"]:checked')?.value || 'middleCenter';
    const caption = document.getElementById('rtbCaption').value;
    return {
      type: 'ReturnToButton',
      name: document.getElementById('rtbName').value.trim() || 'ReturnToDisplayButton1',
      label: caption,
      caption,
      left: Number(document.getElementById('rtbLeft').value) || 0,
      top: Number(document.getElementById('rtbTop').value) || 0,
      width: Number(document.getElementById('rtbWidth').value) || 80,
      height: Number(document.getElementById('rtbHeight').value) || 80,
      visible: document.getElementById('rtbVisible').checked,
      borderStyle: document.getElementById('rtbBorderStyle').value,
      borderWidth: Number(document.getElementById('rtbBorderWidth').value) || 1,
      borderUsesBackColor: document.getElementById('rtbBorderUsesBackColor').checked,
      useBackColor: document.getElementById('rtbUseBackColor').checked,
      backColor: document.getElementById('rtbBackColor').value,
      useBorderColor: document.getElementById('rtbUseBorderColor').checked,
      borderColor: document.getElementById('rtbBorderColor').value,
      usePatternColor: document.getElementById('rtbUsePatternColor').checked,
      patternColor: document.getElementById('rtbPatternColor').value,
      useHighlightColor: document.getElementById('rtbUseHighlightColor').checked,
      highlightColor: document.getElementById('rtbHighlightColor').value,
      backStyle: document.getElementById('rtbBackStyle').value,
      patternStyle: document.getElementById('rtbPatternStyle').value,
      shape: document.getElementById('rtbShape').value,
      blink: document.getElementById('rtbBlink').checked,
      horizontalMargin: Number(document.getElementById('rtbHorizontalMargin').value) || 0,
      verticalMargin: Number(document.getElementById('rtbVerticalMargin').value) || 0,
      audio: document.getElementById('rtbAudio').checked,
      fontFamily: document.getElementById('rtbFont').value,
      fontSize: Number(document.getElementById('rtbFontSize').value) || 10,
      bold: document.getElementById('rtbBold').classList.contains('active'),
      italic: document.getElementById('rtbItalic').classList.contains('active'),
      underline: document.getElementById('rtbUnderline').classList.contains('active'),
      foreColor: document.getElementById('rtbCaptionColor').value,
      useForeColor: document.getElementById('rtbUseCaptionColor').checked,
      useCaptionColor: document.getElementById('rtbUseCaptionColor').checked,
      useCaptionBackColor: document.getElementById('rtbUseCaptionBackColor').checked,
      captionBackColor: document.getElementById('rtbCaptionBackColor').value,
      captionBlink: document.getElementById('rtbCaptionBlink').checked,
      captionBackStyle: document.getElementById('rtbCaptionBackStyle').value,
      wordWrap: document.getElementById('rtbWordWrap').checked,
      alignment,
      image: document.getElementById('rtbImage').value.trim() || undefined,
      imageBackStyle: document.getElementById('rtbImageBackStyle').value,
      useImageColor: document.getElementById('rtbUseImageColor').checked,
      imageColor: document.getElementById('rtbImageColor').value,
      useImageBackColor: document.getElementById('rtbUseImageBackColor').checked,
      imageBackColor: document.getElementById('rtbImageBackColor').value,
      imageBlink: document.getElementById('rtbImageBlink').checked,
      imageScaled: document.getElementById('rtbImageScaled').checked,
      imageAlignment: document.querySelector('#returnToButtonForm input[name="rtbImageAlign"]:checked')?.value || 'middleCenter'
    };
  }

  async function showReturnToButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then choose Return To from Display Navigation');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultReturnToButtonComponent({
      name: nextReturnToButtonName(canvas?.components),
      ...overrides
    });
    fillReturnToButtonForm(comp);
    window.resetPropsDialogState('return-to', readReturnToButtonForm, 'applyReturnToButton');
    switchTab('general');
    wireTools();
    document.getElementById('returnToButtonDialog')?.showModal();
  }

  async function applyReturnToButton() {
    const comp = readReturnToButtonForm();
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readReturnToButtonForm, 'applyReturnToButton');
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveReturnToButton(e) {
    e.preventDefault();
    const comp = readReturnToButtonForm();
    await window.upsertCanvasComponent(comp);
    document.getElementById('returnToButtonDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initReturnToButtonDialog() {
    const form = document.getElementById('returnToButtonForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveReturnToButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyReturnToButton')?.addEventListener('click', () => {
      applyReturnToButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readReturnToButtonForm, 'applyReturnToButton'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readReturnToButtonForm, 'applyReturnToButton'));
    document.getElementById('cancelReturnToButton')?.addEventListener('click', () => {
      document.getElementById('returnToButtonDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('returnToButtonDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpReturnToButton')?.addEventListener('click', () => {
      alert('Return to Display Button navigates back to the previously viewed display when pressed.');
    });
    document.querySelectorAll('#returnToButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.rtbTab));
    });
    for (const id of [
      'rtbBorderUsesBackColor', 'rtbUseBackColor', 'rtbUseBorderColor', 'rtbUsePatternColor',
      'rtbUseHighlightColor', 'rtbUseCaptionColor', 'rtbUseCaptionBackColor', 'rtbUseImageColor', 'rtbUseImageBackColor'
    ]) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncReturnToButtonFields();
        window.updatePropsApplyButton(readReturnToButtonForm, 'applyReturnToButton');
      });
    }
    for (const id of ['rtbBold', 'rtbItalic', 'rtbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readReturnToButtonForm, 'applyReturnToButton');
      });
    }
    document.getElementById('rtbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('rtbImage').value || null })
        .then((fileName) => {
          if (fileName) {
            document.getElementById('rtbImage').value = fileName;
            window.updatePropsApplyButton(readReturnToButtonForm, 'applyReturnToButton');
          }
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
  }

  window.StudioReturnToButton = {
    initReturnToButtonDialog,
    showReturnToButtonDialog,
    fillReturnToButtonForm,
    readReturnToButtonForm,
    switchReturnToButtonTab: switchTab,
    wireReturnToButtonTools: wireTools
  };
})();
