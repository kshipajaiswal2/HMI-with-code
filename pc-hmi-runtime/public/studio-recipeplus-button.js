/** RecipePlus Button property dialog */
(function () {
  function switchTab(tabId) {
    document.querySelectorAll('#recipePlusButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.rpbTab === tabId);
    });
    document.querySelectorAll('#recipePlusButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.rpbTabPanel === tabId);
    });
  }

  function nextRecipePlusButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'RecipePlusButton').length + 1;
    return `RecipePlusButton${n}`;
  }

  function defaultRecipePlusButtonComponent(overrides = {}) {
    return {
      type: 'RecipePlusButton',
      name: 'RecipePlusButton1',
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
      action: 'download',
      ...overrides
    };
  }

  function syncRecipePlusButtonFields() {
    document.getElementById('rpbBackColor').disabled = !document.getElementById('rpbUseBackColor')?.checked;
    document.getElementById('rpbBorderColor').disabled = !document.getElementById('rpbUseBorderColor')?.checked;
    document.getElementById('rpbPatternColor').disabled = !document.getElementById('rpbUsePatternColor')?.checked;
    document.getElementById('rpbHighlightColor').disabled = !document.getElementById('rpbUseHighlightColor')?.checked;
    document.getElementById('rpbCaptionColor').disabled = !document.getElementById('rpbUseCaptionColor')?.checked;
    document.getElementById('rpbCaptionBackColor').disabled = !document.getElementById('rpbUseCaptionBackColor')?.checked;
    document.getElementById('rpbImageColor').disabled = !document.getElementById('rpbUseImageColor')?.checked;
    document.getElementById('rpbImageBackColor').disabled = !document.getElementById('rpbUseImageBackColor')?.checked;
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('recipePlusButtonDialog'));
    syncRecipePlusButtonFields();
  }

  function fillRecipePlusButtonForm(comp) {
    document.getElementById('rpbBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('rpbBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('rpbShape').value = comp.shape || 'rectangle';
    document.getElementById('rpbBorderWidth').value = comp.borderWidth ?? 1;
    document.getElementById('rpbPatternStyle').value = comp.patternStyle || 'none';
    document.getElementById('rpbBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('rpbUseBackColor').checked = comp.useBackColor !== false;
    document.getElementById('rpbBackColor').value = comp.backColor || '#001C38';
    document.getElementById('rpbUseBorderColor').checked = Boolean(comp.useBorderColor);
    document.getElementById('rpbBorderColor').value = comp.borderColor || '#001C38';
    document.getElementById('rpbUsePatternColor').checked = Boolean(comp.usePatternColor);
    document.getElementById('rpbPatternColor').value = comp.patternColor || '#ffffff';
    document.getElementById('rpbUseHighlightColor').checked = Boolean(comp.useHighlightColor);
    document.getElementById('rpbHighlightColor').value = comp.highlightColor || '#0066cc';
    document.getElementById('rpbBlink').checked = Boolean(comp.blink);
    document.getElementById('rpbAction').value = comp.action || 'download';
    document.getElementById('rpbHorizontalMargin').value = comp.horizontalMargin ?? 0;
    document.getElementById('rpbVerticalMargin').value = comp.verticalMargin ?? 0;
    document.getElementById('rpbAudio').checked = comp.audio !== false;
    document.getElementById('rpbCaption').value = comp.caption ?? comp.label ?? '';
    document.getElementById('rpbFont').value = comp.fontFamily || 'Arial Unicode MS';
    document.getElementById('rpbFontSize').value = String(comp.fontSize ?? 10);
    document.getElementById('rpbBold').classList.toggle('active', Boolean(comp.bold));
    document.getElementById('rpbItalic').classList.toggle('active', Boolean(comp.italic));
    document.getElementById('rpbUnderline').classList.toggle('active', Boolean(comp.underline));
    document.getElementById('rpbUseCaptionColor').checked = comp.useCaptionColor !== undefined
      ? Boolean(comp.useCaptionColor)
      : comp.useForeColor !== false;
    document.getElementById('rpbCaptionColor').value = comp.foreColor || '#ffffff';
    document.getElementById('rpbUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
    document.getElementById('rpbCaptionBackColor').value = comp.captionBackColor || '#001C38';
    document.getElementById('rpbCaptionBlink').checked = Boolean(comp.captionBlink);
    document.getElementById('rpbWordWrap').checked = comp.wordWrap !== false;
    document.querySelector(`#recipePlusButtonForm input[name="rpbAlign"][value="${comp.alignment || 'middleCenter'}"]`)?.click();
    document.getElementById('rpbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
    document.getElementById('rpbImage').value = comp.image || '';
    document.getElementById('rpbImageBackStyle').value = comp.imageBackStyle || 'transparent';
    document.getElementById('rpbUseImageColor').checked = Boolean(comp.useImageColor);
    document.getElementById('rpbImageColor').value = comp.imageColor || '#ffffff';
    document.getElementById('rpbUseImageBackColor').checked = Boolean(comp.useImageBackColor);
    document.getElementById('rpbImageBackColor').value = comp.imageBackColor || '#001C38';
    document.getElementById('rpbImageBlink').checked = Boolean(comp.imageBlink);
    document.getElementById('rpbImageScaled').checked = Boolean(comp.imageScaled);
    document.querySelector(`#recipePlusButtonForm input[name="rpbImageAlign"][value="${comp.imageAlignment || 'middleCenter'}"]`)?.click();
    document.getElementById('rpbHeight').value = comp.height ?? 80;
    document.getElementById('rpbWidth').value = comp.width ?? 80;
    document.getElementById('rpbTop').value = comp.top ?? 16;
    document.getElementById('rpbLeft').value = comp.left ?? 16;
    document.getElementById('rpbName').value = comp.name || 'RecipePlusButton1';
    document.getElementById('rpbVisible').checked = comp.visible !== false;
    syncRecipePlusButtonFields();
  }

  function readRecipePlusButtonForm() {
    const alignment = document.querySelector('#recipePlusButtonForm input[name="rpbAlign"]:checked')?.value || 'middleCenter';
    const caption = document.getElementById('rpbCaption').value;
    return {
      type: 'RecipePlusButton',
      name: document.getElementById('rpbName').value.trim() || 'RecipePlusButton1',
      label: caption,
      caption,
      left: Number(document.getElementById('rpbLeft').value) || 0,
      top: Number(document.getElementById('rpbTop').value) || 0,
      width: Number(document.getElementById('rpbWidth').value) || 80,
      height: Number(document.getElementById('rpbHeight').value) || 80,
      visible: document.getElementById('rpbVisible').checked,
      borderStyle: document.getElementById('rpbBorderStyle').value,
      borderWidth: Number(document.getElementById('rpbBorderWidth').value) || 1,
      borderUsesBackColor: document.getElementById('rpbBorderUsesBackColor').checked,
      useBackColor: document.getElementById('rpbUseBackColor').checked,
      backColor: document.getElementById('rpbBackColor').value,
      useBorderColor: document.getElementById('rpbUseBorderColor').checked,
      borderColor: document.getElementById('rpbBorderColor').value,
      usePatternColor: document.getElementById('rpbUsePatternColor').checked,
      patternColor: document.getElementById('rpbPatternColor').value,
      useHighlightColor: document.getElementById('rpbUseHighlightColor').checked,
      highlightColor: document.getElementById('rpbHighlightColor').value,
      backStyle: document.getElementById('rpbBackStyle').value,
      patternStyle: document.getElementById('rpbPatternStyle').value,
      shape: document.getElementById('rpbShape').value,
      blink: document.getElementById('rpbBlink').checked,
      action: document.getElementById('rpbAction').value,
      horizontalMargin: Number(document.getElementById('rpbHorizontalMargin').value) || 0,
      verticalMargin: Number(document.getElementById('rpbVerticalMargin').value) || 0,
      audio: document.getElementById('rpbAudio').checked,
      fontFamily: document.getElementById('rpbFont').value,
      fontSize: Number(document.getElementById('rpbFontSize').value) || 10,
      bold: document.getElementById('rpbBold').classList.contains('active'),
      italic: document.getElementById('rpbItalic').classList.contains('active'),
      underline: document.getElementById('rpbUnderline').classList.contains('active'),
      foreColor: document.getElementById('rpbCaptionColor').value,
      useForeColor: document.getElementById('rpbUseCaptionColor').checked,
      useCaptionColor: document.getElementById('rpbUseCaptionColor').checked,
      useCaptionBackColor: document.getElementById('rpbUseCaptionBackColor').checked,
      captionBackColor: document.getElementById('rpbCaptionBackColor').value,
      captionBlink: document.getElementById('rpbCaptionBlink').checked,
      captionBackStyle: document.getElementById('rpbCaptionBackStyle').value,
      wordWrap: document.getElementById('rpbWordWrap').checked,
      alignment,
      image: document.getElementById('rpbImage').value.trim() || undefined,
      imageBackStyle: document.getElementById('rpbImageBackStyle').value,
      useImageColor: document.getElementById('rpbUseImageColor').checked,
      imageColor: document.getElementById('rpbImageColor').value,
      useImageBackColor: document.getElementById('rpbUseImageBackColor').checked,
      imageBackColor: document.getElementById('rpbImageBackColor').value,
      imageBlink: document.getElementById('rpbImageBlink').checked,
      imageScaled: document.getElementById('rpbImageScaled').checked,
      imageAlignment: document.querySelector('#recipePlusButtonForm input[name="rpbImageAlign"]:checked')?.value || 'middleCenter'
    };
  }

  async function showRecipePlusButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then choose RecipePlus Button from RecipePlus menu');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultRecipePlusButtonComponent({
      name: nextRecipePlusButtonName(canvas?.components),
      ...overrides
    });
    fillRecipePlusButtonForm(comp);
    window.resetPropsDialogState('recipeplus-button', readRecipePlusButtonForm, 'applyRecipePlusButton');
    switchTab('general');
    wireTools();
    document.getElementById('recipePlusButtonDialog')?.showModal();
  }

  async function applyRecipePlusButton() {
    const comp = readRecipePlusButtonForm();
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readRecipePlusButtonForm, 'applyRecipePlusButton');
    window.state.canvasSelection.index = window.state.propsDialog.editIndex;
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveRecipePlusButton(e) {
    e.preventDefault();
    const comp = readRecipePlusButtonForm();
    await window.upsertCanvasComponent(comp);
    document.getElementById('recipePlusButtonDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initRecipePlusButtonDialog() {
    const form = document.getElementById('recipePlusButtonForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveRecipePlusButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyRecipePlusButton')?.addEventListener('click', () => {
      applyRecipePlusButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readRecipePlusButtonForm, 'applyRecipePlusButton'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readRecipePlusButtonForm, 'applyRecipePlusButton'));
    document.getElementById('cancelRecipePlusButton')?.addEventListener('click', () => {
      document.getElementById('recipePlusButtonDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('recipePlusButtonDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpRecipePlusButton')?.addEventListener('click', () => {
      alert('RecipePlus Button triggers a RecipePlus action such as Download when pressed.');
    });
    document.querySelectorAll('#recipePlusButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.rpbTab));
    });
    for (const id of [
      'rpbBorderUsesBackColor', 'rpbUseBackColor', 'rpbUseBorderColor', 'rpbUsePatternColor',
      'rpbUseHighlightColor', 'rpbUseCaptionColor', 'rpbUseCaptionBackColor', 'rpbUseImageColor', 'rpbUseImageBackColor'
    ]) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncRecipePlusButtonFields();
        window.updatePropsApplyButton(readRecipePlusButtonForm, 'applyRecipePlusButton');
      });
    }
    for (const id of ['rpbBold', 'rpbItalic', 'rpbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readRecipePlusButtonForm, 'applyRecipePlusButton');
      });
    }
    document.getElementById('rpbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('rpbImage').value || null })
        .then((fileName) => {
          if (fileName) {
            document.getElementById('rpbImage').value = fileName;
            window.updatePropsApplyButton(readRecipePlusButtonForm, 'applyRecipePlusButton');
          }
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
  }

  window.StudioRecipePlusButton = {
    initRecipePlusButtonDialog,
    showRecipePlusButtonDialog,
    fillRecipePlusButtonForm,
    readRecipePlusButtonForm,
    switchRecipePlusButtonTab: switchTab,
    wireRecipePlusButtonTools: wireTools
  };
})();

