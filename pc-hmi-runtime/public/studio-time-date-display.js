/** Time Date Display property dialog */
(function () {
  function switchTab(tabId) {
    document.querySelectorAll('#timeDateDisplayDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.tddTab === tabId);
    });
    document.querySelectorAll('#timeDateDisplayDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.tddTabPanel === tabId);
    });
  }

  function syncFields() {
    document.getElementById('tddBackColor').disabled = !document.getElementById('tddUseBackColor')?.checked;
    document.getElementById('tddBorderColor').disabled = !document.getElementById('tddUseBorderColor')?.checked;
    document.getElementById('tddForeColor').disabled = !document.getElementById('tddUseForeColor')?.checked;
    document.getElementById('tddPatternColor').disabled = !document.getElementById('tddUsePatternColor')?.checked;
  }

  function wireTools() {
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('timeDateDisplayDialog'));
    syncFields();
  }

  function fillTimeDateDisplayForm(comp) {
    document.getElementById('tddBorderStyle').value = comp.borderStyle || 'none';
    document.getElementById('tddBorderWidth').value = comp.borderWidth ?? 1;
    document.getElementById('tddBackStyle').value = comp.backStyle || 'transparent';
    document.getElementById('tddPatternStyle').value = comp.patternStyle || 'none';
    document.getElementById('tddBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('tddUseBackColor').checked = Boolean(comp.useBackColor);
    document.getElementById('tddBackColor').value = comp.backColor || '#ffffff';
    document.getElementById('tddUseBorderColor').checked = Boolean(comp.useBorderColor);
    document.getElementById('tddBorderColor').value = comp.borderColor || '#c0c0c0';
    document.getElementById('tddUsePatternColor').checked = Boolean(comp.usePatternColor);
    document.getElementById('tddPatternColor').value = comp.patternColor || '#000000';
    document.getElementById('tddUseForeColor').checked = comp.useForeColor !== false;
    document.getElementById('tddForeColor').value = comp.foreColor || '#000000';
    document.getElementById('tddBlink').checked = Boolean(comp.blink);
    document.getElementById('tddFont').value = comp.fontFamily || 'Arial';
    document.getElementById('tddFontSize').value = String(comp.fontSize ?? 12);
    document.getElementById('tddBold').classList.toggle('active', Boolean(comp.bold));
    document.getElementById('tddItalic').classList.toggle('active', Boolean(comp.italic));
    document.getElementById('tddUnderline').classList.toggle('active', Boolean(comp.underline));
    document.getElementById('tddWordWrap').checked = comp.wordWrap !== false;
    document.querySelector(`#timeDateDisplayForm input[name="tddAlign"][value="${comp.alignment || 'middleCenter'}"]`)?.click();
    document.getElementById('tddDateFormat').value = comp.dateFormat || 'locale';
    document.getElementById('tddHeight').value = comp.height ?? 16;
    document.getElementById('tddWidth').value = comp.width ?? 138;
    document.getElementById('tddTop').value = comp.top ?? 9;
    document.getElementById('tddLeft').value = comp.left ?? 660;
    document.getElementById('tddName').value = comp.name || 'Clock';
    document.getElementById('tddVisible').checked = comp.visible !== false;
    syncFields();
  }

  function readTimeDateDisplayForm() {
    return {
      type: 'TimeDateDisplay',
      name: document.getElementById('tddName').value.trim() || 'Clock',
      left: Number(document.getElementById('tddLeft').value) || 0,
      top: Number(document.getElementById('tddTop').value) || 0,
      width: Number(document.getElementById('tddWidth').value) || 138,
      height: Number(document.getElementById('tddHeight').value) || 16,
      visible: document.getElementById('tddVisible').checked,
      borderStyle: document.getElementById('tddBorderStyle').value,
      borderWidth: Number(document.getElementById('tddBorderWidth').value) || 1,
      borderUsesBackColor: document.getElementById('tddBorderUsesBackColor').checked,
      backStyle: document.getElementById('tddBackStyle').value,
      patternStyle: document.getElementById('tddPatternStyle').value,
      useBackColor: document.getElementById('tddUseBackColor').checked,
      backColor: document.getElementById('tddBackColor').value,
      useBorderColor: document.getElementById('tddUseBorderColor').checked,
      borderColor: document.getElementById('tddBorderColor').value,
      usePatternColor: document.getElementById('tddUsePatternColor').checked,
      patternColor: document.getElementById('tddPatternColor').value,
      useForeColor: document.getElementById('tddUseForeColor').checked,
      foreColor: document.getElementById('tddForeColor').value,
      blink: document.getElementById('tddBlink').checked,
      fontFamily: document.getElementById('tddFont').value,
      fontSize: Number(document.getElementById('tddFontSize').value) || 12,
      bold: document.getElementById('tddBold').classList.contains('active'),
      italic: document.getElementById('tddItalic').classList.contains('active'),
      underline: document.getElementById('tddUnderline').classList.contains('active'),
      wordWrap: document.getElementById('tddWordWrap').checked,
      alignment: document.querySelector('#timeDateDisplayForm input[name="tddAlign"]:checked')?.value || 'middleCenter',
      dateFormat: document.getElementById('tddDateFormat').value
    };
  }

  async function applyTimeDateDisplay() {
    const comp = readTimeDateDisplayForm();
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readTimeDateDisplayForm, 'applyTimeDateDisplay');
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveTimeDateDisplay(e) {
    e.preventDefault();
    const comp = readTimeDateDisplayForm();
    await window.upsertCanvasComponent(comp);
    document.getElementById('timeDateDisplayDialog').close();
    window.clearPropsDialogState();
    window.setStatus(`Saved ${comp.name}`);
  }

  function initTimeDateDisplayDialog() {
    const form = document.getElementById('timeDateDisplayForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveTimeDateDisplay(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyTimeDateDisplay')?.addEventListener('click', () => {
      applyTimeDateDisplay().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readTimeDateDisplayForm, 'applyTimeDateDisplay'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readTimeDateDisplayForm, 'applyTimeDateDisplay'));
    document.getElementById('cancelTimeDateDisplay')?.addEventListener('click', () => {
      document.getElementById('timeDateDisplayDialog')?.close();
      window.clearPropsDialogState();
    });
    document.querySelectorAll('#timeDateDisplayDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tddTab));
    });
    ['tddUseBackColor', 'tddUseBorderColor', 'tddUsePatternColor', 'tddUseForeColor'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', syncFields);
    });
    document.getElementById('helpTimeDateDisplay')?.addEventListener('click', () => {
      alert('Time Date Display shows a live clock. Set font, alignment, and format on the General tab; size and position on Common.');
    });
    ['tddBold', 'tddItalic', 'tddUnderline'].forEach((id) => {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readTimeDateDisplayForm, 'applyTimeDateDisplay');
      });
    });
  }

  async function showTimeDateDisplayDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then choose Time and Date');
      return;
    }
    const comp = {
      type: 'TimeDateDisplay',
      name: 'Clock',
      left: 660,
      top: 9,
      width: 138,
      height: 16,
      visible: true,
      borderStyle: 'none',
      borderWidth: 1,
      borderUsesBackColor: true,
      backStyle: 'transparent',
      patternStyle: 'none',
      fontFamily: 'Arial',
      fontSize: 12,
      bold: true,
      foreColor: '#000000',
      useForeColor: true,
      wordWrap: true,
      alignment: 'middleCenter',
      dateFormat: 'locale',
      ...overrides
    };
    fillTimeDateDisplayForm(comp);
    window.resetPropsDialogState('time-date', readTimeDateDisplayForm, 'applyTimeDateDisplay');
    switchTab('general');
    wireTools();
    document.getElementById('timeDateDisplayDialog')?.showModal();
  }

  window.StudioTimeDateDisplay = {
    initTimeDateDisplayDialog,
    showTimeDateDisplayDialog,
    fillTimeDateDisplayForm,
    readTimeDateDisplayForm,
    switchTimeDateDisplayTab: switchTab,
    wireTimeDateDisplayTools: wireTools
  };
})();
