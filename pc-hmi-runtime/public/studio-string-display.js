/** String Display property dialog */
(function () {
  function switchTab(tabId) {
    document.querySelectorAll('#stringDisplayDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.sdTab === tabId);
    });
    document.querySelectorAll('#stringDisplayDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.sdTabPanel === tabId);
    });
  }

  function nextStringDisplayName(components) {
    const n = (components || []).filter((c) => c.type === 'StringDisplay').length + 1;
    return `StringDisplay${n}`;
  }

  function defaultStringDisplayComponent(overrides = {}) {
    return {
      type: 'StringDisplay',
      name: 'StringDisplay1',
      tag: '',
      left: 16,
      top: 16,
      width: 120,
      height: 80,
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
      alignment: 'middleLeft',
      wordWrap: true,
      ...overrides
    };
  }

  function syncStringDisplayFields() {
    document.getElementById('sdBackColor').disabled = !document.getElementById('sdUseBackColor')?.checked;
    document.getElementById('sdBorderColor').disabled = !document.getElementById('sdUseBorderColor')?.checked;
    document.getElementById('sdPatternColor').disabled = !document.getElementById('sdUsePatternColor')?.checked;
    document.getElementById('sdForeColor').disabled = !document.getElementById('sdUseForeColor')?.checked;
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('stringDisplayDialog'));
    syncStringDisplayFields();
  }

  function mergeExistingStringDisplay(read) {
    const ref = window.state?.propsDialog?.ref;
    const idx = window.state?.propsDialog?.editIndex;
    let existing = null;
    if (ref?.type === 'display' && ref.index != null) {
      existing = window.state.canvasEditCache?.raw?.components?.[ref.index];
    }
    if (!existing && idx != null) {
      existing = window.state.canvasEditCache?.editComponents?.[idx]?.comp;
    }
    const merged = { ...read };
    if (existing?.useCurrentUser && !merged.tag) {
      merged.useCurrentUser = true;
      merged.caption = existing.caption ?? 'Guest';
    }
    return merged;
  }

  function fillStringDisplayForm(comp) {
    document.getElementById('sdBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('sdBorderWidth').value = comp.borderWidth ?? 4;
    document.getElementById('sdBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('sdPatternStyle').value = comp.patternStyle || 'none';
    document.getElementById('sdBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('sdUseBackColor').checked = comp.useBackColor !== false;
    document.getElementById('sdBackColor').value = comp.backColor || '#001C38';
    document.getElementById('sdUseBorderColor').checked = Boolean(comp.useBorderColor);
    document.getElementById('sdBorderColor').value = comp.borderColor || '#001C38';
    document.getElementById('sdUsePatternColor').checked = Boolean(comp.usePatternColor);
    document.getElementById('sdPatternColor').value = comp.patternColor || '#ffffff';
    document.getElementById('sdUseForeColor').checked = comp.useForeColor !== false;
    document.getElementById('sdForeColor').value = comp.foreColor || '#ffffff';
    document.getElementById('sdBlink').checked = Boolean(comp.blink);
    document.getElementById('sdFont').value = comp.fontFamily || 'Arial Unicode MS';
    document.getElementById('sdFontSize').value = String(comp.fontSize ?? 10);
    document.getElementById('sdBold').classList.toggle('active', Boolean(comp.bold));
    document.getElementById('sdItalic').classList.toggle('active', Boolean(comp.italic));
    document.getElementById('sdUnderline').classList.toggle('active', Boolean(comp.underline));
    document.querySelector(`#stringDisplayForm input[name="sdAlign"][value="${comp.alignment || 'middleLeft'}"]`)?.click();
    document.getElementById('sdWordWrap').checked = comp.wordWrap !== false;
    document.getElementById('sdHeight').value = comp.height ?? 80;
    document.getElementById('sdWidth').value = comp.width ?? 120;
    document.getElementById('sdTop').value = comp.top ?? 16;
    document.getElementById('sdLeft').value = comp.left ?? 16;
    document.getElementById('sdName').value = comp.name || 'StringDisplay1';
    document.getElementById('sdVisible').checked = comp.visible !== false;
    document.getElementById('sdTag').value = comp.useCurrentUser ? '' : (comp.tag || '');
    syncStringDisplayFields();
  }

  function readStringDisplayForm() {
    return {
      type: 'StringDisplay',
      name: document.getElementById('sdName').value.trim() || 'StringDisplay1',
      tag: document.getElementById('sdTag').value.trim(),
      left: Number(document.getElementById('sdLeft').value) || 0,
      top: Number(document.getElementById('sdTop').value) || 0,
      width: Number(document.getElementById('sdWidth').value) || 120,
      height: Number(document.getElementById('sdHeight').value) || 80,
      visible: document.getElementById('sdVisible').checked,
      borderStyle: document.getElementById('sdBorderStyle').value,
      borderWidth: Number(document.getElementById('sdBorderWidth').value) || 4,
      borderUsesBackColor: document.getElementById('sdBorderUsesBackColor').checked,
      backStyle: document.getElementById('sdBackStyle').value,
      patternStyle: document.getElementById('sdPatternStyle').value,
      useBackColor: document.getElementById('sdUseBackColor').checked,
      backColor: document.getElementById('sdBackColor').value,
      useBorderColor: document.getElementById('sdUseBorderColor').checked,
      borderColor: document.getElementById('sdBorderColor').value,
      usePatternColor: document.getElementById('sdUsePatternColor').checked,
      patternColor: document.getElementById('sdPatternColor').value,
      useForeColor: document.getElementById('sdUseForeColor').checked,
      foreColor: document.getElementById('sdForeColor').value,
      blink: document.getElementById('sdBlink').checked,
      fontFamily: document.getElementById('sdFont').value,
      fontSize: Number(document.getElementById('sdFontSize').value) || 10,
      bold: document.getElementById('sdBold').classList.contains('active'),
      italic: document.getElementById('sdItalic').classList.contains('active'),
      underline: document.getElementById('sdUnderline').classList.contains('active'),
      alignment: document.querySelector('#stringDisplayForm input[name="sdAlign"]:checked')?.value || 'middleLeft',
      wordWrap: document.getElementById('sdWordWrap').checked
    };
  }

  function validateStringDisplay(comp) {
    if (!comp.tag && !comp.useCurrentUser) {
      window.setStatus('Enter a Value tag on the Connections tab');
      switchTab('connections');
      return false;
    }
    return true;
  }

  async function showStringDisplayDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display or global object first, then choose String Display');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultStringDisplayComponent({
      name: nextStringDisplayName(canvas?.components),
      ...overrides
    });
    fillStringDisplayForm(comp);
    window.resetPropsDialogState('string-display', readStringDisplayForm, 'applyStringDisplay');
    switchTab('general');
    wireTools();
    document.getElementById('stringDisplayDialog')?.showModal();
  }

  async function applyStringDisplay() {
    const comp = mergeExistingStringDisplay(readStringDisplayForm());
    if (!validateStringDisplay(comp)) return;
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readStringDisplayForm, 'applyStringDisplay');
    window.state.canvasSelection.index = window.state.propsDialog.editIndex;
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveStringDisplay(e) {
    e.preventDefault();
    const comp = mergeExistingStringDisplay(readStringDisplayForm());
    if (!validateStringDisplay(comp)) return;
    await window.upsertCanvasComponent(comp);
    document.getElementById('stringDisplayDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initStringDisplayDialog() {
    const form = document.getElementById('stringDisplayForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveStringDisplay(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyStringDisplay')?.addEventListener('click', () => {
      applyStringDisplay().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readStringDisplayForm, 'applyStringDisplay'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readStringDisplayForm, 'applyStringDisplay'));
    document.getElementById('cancelStringDisplay')?.addEventListener('click', () => {
      document.getElementById('stringDisplayDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('stringDisplayDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpStringDisplay')?.addEventListener('click', () => {
      alert('String Display shows a tag value as text with configurable font, alignment, and word wrap.');
    });
    document.querySelectorAll('#stringDisplayDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.sdTab));
    });
    for (const id of ['sdUseBackColor', 'sdUseBorderColor', 'sdUsePatternColor', 'sdUseForeColor']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncStringDisplayFields();
        window.updatePropsApplyButton(readStringDisplayForm, 'applyStringDisplay');
      });
    }
    for (const id of ['sdBold', 'sdItalic', 'sdUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readStringDisplayForm, 'applyStringDisplay');
      });
    }
  }

  window.StudioStringDisplay = {
    initStringDisplayDialog,
    showStringDisplayDialog,
    fillStringDisplayForm,
    readStringDisplayForm,
    switchStringDisplayTab: switchTab,
    wireStringDisplayTools: wireTools
  };
})();
