/** RecipePlus Selector property dialog */
(function () {
  let rpsColumnsDraft = null;
  let rpsActiveColumnId = 'recipe';

  function cloneColumns(columns) {
    return (columns || []).map((c) => ({ ...c }));
  }

  function defaultRecipePlusColumns() {
    return [
      { id: 'recipe', label: 'Recipe', headerText: 'Recipe', width: 150 },
      { id: 'unit', label: 'Unit', headerText: 'Unit', width: 100 }
    ];
  }

  function switchTab(tabId) {
    document.querySelectorAll('#recipePlusSelectorDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.rpsTab === tabId);
    });
    document.querySelectorAll('#recipePlusSelectorDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.rpsTabPanel === tabId);
    });
  }

  function nextRecipePlusSelectorName(components) {
    const n = (components || []).filter((c) => c.type === 'RecipePlusSelector').length + 1;
    return `RecipePlusSelector${n}`;
  }

  function defaultRecipePlusSelectorComponent(overrides = {}) {
    return {
      type: 'RecipePlusSelector',
      name: 'RecipePlusSelector1',
      left: 16,
      top: 16,
      width: 150,
      height: 150,
      visible: true,
      borderStyle: 'line',
      borderWidth: 1,
      borderUsesBackColor: true,
      backStyle: 'solid',
      backColor: '#001C38',
      useBackColor: true,
      useBorderColor: true,
      borderColor: '#000000',
      useForeColor: true,
      foreColor: '#ffffff',
      useHeaderBackColor: true,
      headerBackColor: '#001C38',
      useHeaderForeColor: true,
      headerForeColor: '#ffffff',
      useSelectionBackColor: true,
      selectionBackColor: '#0066cc',
      useSelectionForeColor: true,
      selectionForeColor: '#000000',
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      keyNavigation: true,
      wrapAround: false,
      displayHeader: true,
      activeColumnId: 'recipe',
      columns: defaultRecipePlusColumns(),
      linesPerItem: 1,
      wordWrap: true,
      ...overrides
    };
  }

  function rebuildRpsColumnSelect() {
    const sel = document.getElementById('rpsColumnSelect');
    if (!sel || !rpsColumnsDraft) return;
    const prev = rpsActiveColumnId;
    sel.innerHTML = rpsColumnsDraft.map((c) => `<option value="${c.id}">${c.label || c.id}</option>`).join('');
    const next = rpsColumnsDraft.some((c) => c.id === prev) ? prev : rpsColumnsDraft[0]?.id || 'recipe';
    sel.value = next;
    loadRpsColumnFromDraft(next);
  }

  function loadRpsColumnFromDraft(columnId) {
    rpsActiveColumnId = columnId;
    const col = rpsColumnsDraft?.find((c) => c.id === columnId);
    if (!col) return;
    document.getElementById('rpsColumnWidth').value = col.width ?? 150;
    document.getElementById('rpsColumnHeaderText').value = col.headerText || col.label || '';
  }

  function saveRpsColumnToDraft() {
    const col = rpsColumnsDraft?.find((c) => c.id === rpsActiveColumnId);
    if (!col) return;
    col.width = Number(document.getElementById('rpsColumnWidth').value) || 150;
    col.headerText = document.getElementById('rpsColumnHeaderText').value;
  }

  function syncRecipePlusSelectorFields() {
    const ids = [
      'rpsBackColor', 'rpsBorderColor', 'rpsForeColor',
      'rpsHeaderBackColor', 'rpsHeaderForeColor',
      'rpsSelectionBackColor', 'rpsSelectionForeColor'
    ];
    const checks = [
      'rpsUseBackColor', 'rpsUseBorderColor', 'rpsUseForeColor',
      'rpsUseHeaderBackColor', 'rpsUseHeaderForeColor',
      'rpsUseSelectionBackColor', 'rpsUseSelectionForeColor'
    ];
    checks.forEach((checkId, i) => {
      const el = document.getElementById(ids[i]);
      if (el) el.disabled = !document.getElementById(checkId)?.checked;
    });
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    if (window.FtColorPicker) window.FtColorPicker.initAll(document.getElementById('recipePlusSelectorDialog'));
    syncRecipePlusSelectorFields();
  }

  function fillRecipePlusSelectorForm(comp) {
    rpsColumnsDraft = cloneColumns(comp.columns?.length ? comp.columns : defaultRecipePlusColumns());
    rpsActiveColumnId = comp.activeColumnId || rpsColumnsDraft[0]?.id || 'recipe';

    document.getElementById('rpsBorderStyle').value = comp.borderStyle || 'line';
    document.getElementById('rpsBorderWidth').value = comp.borderWidth ?? 1;
    document.getElementById('rpsBackStyle').value = comp.backStyle || 'solid';
    document.getElementById('rpsBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
    document.getElementById('rpsUseBackColor').checked = comp.useBackColor !== false;
    document.getElementById('rpsBackColor').value = comp.backColor || '#001C38';
    document.getElementById('rpsUseBorderColor').checked = comp.useBorderColor !== false;
    document.getElementById('rpsBorderColor').value = comp.borderColor || '#000000';
    document.getElementById('rpsUseForeColor').checked = comp.useForeColor !== false;
    document.getElementById('rpsForeColor').value = comp.foreColor || '#ffffff';
    document.getElementById('rpsUseHeaderBackColor').checked = comp.useHeaderBackColor !== false;
    document.getElementById('rpsHeaderBackColor').value = comp.headerBackColor || '#001C38';
    document.getElementById('rpsUseHeaderForeColor').checked = comp.useHeaderForeColor !== false;
    document.getElementById('rpsHeaderForeColor').value = comp.headerForeColor || '#ffffff';
    document.getElementById('rpsUseSelectionBackColor').checked = comp.useSelectionBackColor !== false;
    document.getElementById('rpsSelectionBackColor').value = comp.selectionBackColor || '#0066cc';
    document.getElementById('rpsUseSelectionForeColor').checked = comp.useSelectionForeColor !== false;
    document.getElementById('rpsSelectionForeColor').value = comp.selectionForeColor || '#000000';
    document.getElementById('rpsFont').value = comp.fontFamily || 'Arial Unicode MS';
    document.getElementById('rpsFontSize').value = String(comp.fontSize ?? 10);
    document.getElementById('rpsBold').classList.toggle('active', Boolean(comp.bold));
    document.getElementById('rpsItalic').classList.toggle('active', Boolean(comp.italic));
    document.getElementById('rpsUnderline').classList.toggle('active', Boolean(comp.underline));
    document.getElementById('rpsKeyNavigation').checked = comp.keyNavigation !== false;
    document.getElementById('rpsWrapAround').checked = Boolean(comp.wrapAround);
    document.getElementById('rpsDisplayHeader').checked = comp.displayHeader !== false;
    document.getElementById('rpsLinesPerItem').value = String(comp.linesPerItem ?? 1);
    document.getElementById('rpsWordWrap').checked = comp.wordWrap !== false;
    document.getElementById('rpsHeight').value = comp.height ?? 150;
    document.getElementById('rpsWidth').value = comp.width ?? 150;
    document.getElementById('rpsTop').value = comp.top ?? 16;
    document.getElementById('rpsLeft').value = comp.left ?? 16;
    document.getElementById('rpsName').value = comp.name || 'RecipePlusSelector1';
    document.getElementById('rpsVisible').checked = comp.visible !== false;
    rebuildRpsColumnSelect();
    syncRecipePlusSelectorFields();
  }

  function readRecipePlusSelectorForm() {
    saveRpsColumnToDraft();
    const activeColumnId = document.getElementById('rpsColumnSelect')?.value || rpsActiveColumnId;
    return {
      type: 'RecipePlusSelector',
      name: document.getElementById('rpsName').value.trim() || 'RecipePlusSelector1',
      left: Number(document.getElementById('rpsLeft').value) || 0,
      top: Number(document.getElementById('rpsTop').value) || 0,
      width: Number(document.getElementById('rpsWidth').value) || 150,
      height: Number(document.getElementById('rpsHeight').value) || 150,
      visible: document.getElementById('rpsVisible').checked,
      borderStyle: document.getElementById('rpsBorderStyle').value,
      borderWidth: Number(document.getElementById('rpsBorderWidth').value) || 1,
      borderUsesBackColor: document.getElementById('rpsBorderUsesBackColor').checked,
      backStyle: document.getElementById('rpsBackStyle').value,
      backColor: document.getElementById('rpsBackColor').value,
      useBackColor: document.getElementById('rpsUseBackColor').checked,
      useBorderColor: document.getElementById('rpsUseBorderColor').checked,
      borderColor: document.getElementById('rpsBorderColor').value,
      useForeColor: document.getElementById('rpsUseForeColor').checked,
      foreColor: document.getElementById('rpsForeColor').value,
      useHeaderBackColor: document.getElementById('rpsUseHeaderBackColor').checked,
      headerBackColor: document.getElementById('rpsHeaderBackColor').value,
      useHeaderForeColor: document.getElementById('rpsUseHeaderForeColor').checked,
      headerForeColor: document.getElementById('rpsHeaderForeColor').value,
      useSelectionBackColor: document.getElementById('rpsUseSelectionBackColor').checked,
      selectionBackColor: document.getElementById('rpsSelectionBackColor').value,
      useSelectionForeColor: document.getElementById('rpsUseSelectionForeColor').checked,
      selectionForeColor: document.getElementById('rpsSelectionForeColor').value,
      fontFamily: document.getElementById('rpsFont').value,
      fontSize: Number(document.getElementById('rpsFontSize').value) || 10,
      bold: document.getElementById('rpsBold').classList.contains('active'),
      italic: document.getElementById('rpsItalic').classList.contains('active'),
      underline: document.getElementById('rpsUnderline').classList.contains('active'),
      keyNavigation: document.getElementById('rpsKeyNavigation').checked,
      wrapAround: document.getElementById('rpsWrapAround').checked,
      displayHeader: document.getElementById('rpsDisplayHeader').checked,
      activeColumnId,
      columns: cloneColumns(rpsColumnsDraft),
      linesPerItem: Number(document.getElementById('rpsLinesPerItem').value) || 1,
      wordWrap: document.getElementById('rpsWordWrap').checked
    };
  }

  async function showRecipePlusSelectorDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then choose RecipePlus Selector from RecipePlus menu');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const comp = defaultRecipePlusSelectorComponent({
      name: nextRecipePlusSelectorName(canvas?.components),
      ...overrides
    });
    fillRecipePlusSelectorForm(comp);
    window.resetPropsDialogState('recipeplus-selector', readRecipePlusSelectorForm, 'applyRecipePlusSelector');
    switchTab('general');
    wireTools();
    document.getElementById('recipePlusSelectorDialog')?.showModal();
  }

  async function applyRecipePlusSelector() {
    const comp = readRecipePlusSelectorForm();
    await window.upsertCanvasComponent(comp);
    window.commitPropsSnapshot(readRecipePlusSelectorForm, 'applyRecipePlusSelector');
    window.state.canvasSelection.index = window.state.propsDialog.editIndex;
    window.setStatus(`Applied ${comp.name} on ${window.state.selectedScreenId}`);
  }

  async function saveRecipePlusSelector(e) {
    e.preventDefault();
    const comp = readRecipePlusSelectorForm();
    await window.upsertCanvasComponent(comp);
    document.getElementById('recipePlusSelectorDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool(`Added ${comp.name} to ${window.state.selectedScreenId}`);
  }

  function initRecipePlusSelectorDialog() {
    const form = document.getElementById('recipePlusSelectorForm');
    if (!form) return;
    form.addEventListener('submit', (e) => saveRecipePlusSelector(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyRecipePlusSelector')?.addEventListener('click', () => {
      applyRecipePlusSelector().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => window.updatePropsApplyButton(readRecipePlusSelectorForm, 'applyRecipePlusSelector'));
    form.addEventListener('change', () => window.updatePropsApplyButton(readRecipePlusSelectorForm, 'applyRecipePlusSelector'));
    document.getElementById('cancelRecipePlusSelector')?.addEventListener('click', () => {
      document.getElementById('recipePlusSelectorDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool('Placement cancelled');
    });
    document.getElementById('recipePlusSelectorDialog')?.addEventListener('close', () => {
      if (window.state.placement) window.activateSelectTool();
    });
    document.getElementById('helpRecipePlusSelector')?.addEventListener('click', () => {
      alert('RecipePlus Selector lists recipes from the project RecipePlus model. Configure columns on the Recipe tab.');
    });
    document.querySelectorAll('#recipePlusSelectorDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.rpsTab));
    });
    document.getElementById('rpsColumnSelect')?.addEventListener('change', (e) => {
      saveRpsColumnToDraft();
      loadRpsColumnFromDraft(e.target.value);
      window.updatePropsApplyButton(readRecipePlusSelectorForm, 'applyRecipePlusSelector');
    });
    for (const id of [
      'rpsBorderUsesBackColor', 'rpsUseBackColor', 'rpsUseBorderColor', 'rpsUseForeColor',
      'rpsUseHeaderBackColor', 'rpsUseHeaderForeColor', 'rpsUseSelectionBackColor', 'rpsUseSelectionForeColor'
    ]) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncRecipePlusSelectorFields();
        window.updatePropsApplyButton(readRecipePlusSelectorForm, 'applyRecipePlusSelector');
      });
    }
    for (const id of ['rpsBold', 'rpsItalic', 'rpsUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        window.updatePropsApplyButton(readRecipePlusSelectorForm, 'applyRecipePlusSelector');
      });
    }
  }

  window.StudioRecipePlusSelector = {
    initRecipePlusSelectorDialog,
    showRecipePlusSelectorDialog,
    fillRecipePlusSelectorForm,
    readRecipePlusSelectorForm,
    switchRecipePlusSelectorTab: switchTab,
    wireRecipePlusSelectorTools: wireTools,
    defaultRecipePlusColumns
  };
})();
