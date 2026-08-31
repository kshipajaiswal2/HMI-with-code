/** RecipePlus Selector property dialog — FactoryTalk View parity */
(function () {
  let rpsPreviewTimer = null;
  let rpsDialogCommitted = false;
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

  function rpsGetColor(id, fallback) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || fallback
      || '#001C38';
  }

  function rpsSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
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
      width: 190,
      height: 185,
      visible: true,
      borderStyle: 'line',
      borderWidth: 1,
      borderUsesBackColor: true,
      backStyle: 'solid',
      backColor: '#001C38',
      useBackColor: true,
      useBorderColor: true,
      borderColor: '#001C38',
      useForeColor: true,
      foreColor: '#ffffff',
      useHeaderBackColor: true,
      headerBackColor: '#001C38',
      useHeaderForeColor: true,
      headerForeColor: '#ffffff',
      useSelectionBackColor: true,
      selectionBackColor: '#99CCFF',
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
      selectedIndex: 0,
      ...overrides
    };
  }

  function scheduleRecipePlusSelectorLivePreview() {
    if (window.state?.propsFormFill) return;
    if (rpsPreviewTimer) clearTimeout(rpsPreviewTimer);
    rpsPreviewTimer = setTimeout(() => {
      rpsPreviewTimer = null;
      if (!document.getElementById('recipePlusSelectorDialog')?.open) return;
      const comp = readRecipePlusSelectorForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readRecipePlusSelectorForm, 'applyRecipePlusSelector');
    }, 80);
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
    col.width = Number(document.getElementById('rpsColumnWidth')?.value) || 150;
    col.headerText = document.getElementById('rpsColumnHeaderText')?.value || col.label || '';
  }

  function wireRecipePlusSelectorTools() {
    const dlg = document.getElementById('recipePlusSelectorDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    document.querySelectorAll('#recipePlusSelectorForm .ft-color-input').forEach((input) => {
      if (input.dataset.rpsPreviewWired === '1') return;
      input.dataset.rpsPreviewWired = '1';
      input.addEventListener('input', scheduleRecipePlusSelectorLivePreview);
      input.addEventListener('change', scheduleRecipePlusSelectorLivePreview);
    });
  }

  function presentRecipePlusSelectorDialog() {
    const dialog = document.getElementById('recipePlusSelectorDialog');
    if (!dialog) {
      window.setStatus('RecipePlus Selector Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    rpsDialogCommitted = false;
    dialog.classList.add('is-positioned');
    dialog.style.position = 'fixed';
    dialog.style.margin = '0';
    dialog.style.left = '24px';
    dialog.style.top = '36px';
    dialog.style.right = 'auto';
    dialog.style.bottom = 'auto';
    dialog.style.transform = 'none';
    dialog.style.zIndex = '30000';
    dialog.style.maxHeight = 'calc(100vh - 48px)';
    dialog.style.overflow = 'auto';
    try {
      dialog.showModal();
    } catch (err) {
      document.querySelectorAll('dialog[open]').forEach((other) => {
        if (other !== dialog) {
          try { other.close(); } catch (_) { /* ignore */ }
        }
      });
      try {
        dialog.showModal();
      } catch (err2) {
        dialog.setAttribute('open', '');
        dialog.style.display = 'block';
        window.setStatus(`Opened RecipePlus Selector properties without modal: ${err2.message}`);
      }
    }
  }

  function fillRecipePlusSelectorForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      rpsColumnsDraft = cloneColumns(comp.columns?.length ? comp.columns : defaultRecipePlusColumns());
      rpsActiveColumnId = comp.activeColumnId || rpsColumnsDraft[0]?.id || 'recipe';
      document.getElementById('rpsBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('rpsBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('rpsBackStyle').value = comp.backStyle || 'solid';
      document.getElementById('rpsBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      rpsSetColor('rpsBackColor', comp.backColor || '#001C38');
      rpsSetColor('rpsBorderColor', comp.borderColor || '#001C38');
      rpsSetColor('rpsForeColor', comp.foreColor || '#ffffff');
      rpsSetColor('rpsHeaderBackColor', comp.headerBackColor || '#001C38');
      rpsSetColor('rpsHeaderForeColor', comp.headerForeColor || '#ffffff');
      rpsSetColor('rpsSelectionBackColor', comp.selectionBackColor || '#99CCFF');
      rpsSetColor('rpsSelectionForeColor', comp.selectionForeColor || '#000000');
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
      document.getElementById('rpsHeight').value = comp.height ?? 185;
      document.getElementById('rpsWidth').value = comp.width ?? 190;
      document.getElementById('rpsTop').value = comp.top ?? 16;
      document.getElementById('rpsLeft').value = comp.left ?? 16;
      document.getElementById('rpsName').value = comp.name || 'RecipePlusSelector1';
      document.getElementById('rpsVisible').checked = comp.visible !== false;
      rebuildRpsColumnSelect();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readRecipePlusSelectorForm() {
    saveRpsColumnToDraft();
    const activeColumnId = document.getElementById('rpsColumnSelect')?.value || rpsActiveColumnId;
    return {
      type: 'RecipePlusSelector',
      name: document.getElementById('rpsName')?.value.trim() || 'RecipePlusSelector1',
      left: Number(document.getElementById('rpsLeft')?.value) || 0,
      top: Number(document.getElementById('rpsTop')?.value) || 0,
      width: Number(document.getElementById('rpsWidth')?.value) || 190,
      height: Number(document.getElementById('rpsHeight')?.value) || 185,
      visible: document.getElementById('rpsVisible')?.checked !== false,
      borderStyle: document.getElementById('rpsBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('rpsBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('rpsBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('rpsBackStyle')?.value || 'solid',
      backColor: rpsGetColor('rpsBackColor', '#001C38'),
      useBackColor: true,
      useBorderColor: true,
      borderColor: rpsGetColor('rpsBorderColor', '#001C38'),
      useForeColor: true,
      foreColor: rpsGetColor('rpsForeColor', '#ffffff'),
      useHeaderBackColor: true,
      headerBackColor: rpsGetColor('rpsHeaderBackColor', '#001C38'),
      useHeaderForeColor: true,
      headerForeColor: rpsGetColor('rpsHeaderForeColor', '#ffffff'),
      useSelectionBackColor: true,
      selectionBackColor: rpsGetColor('rpsSelectionBackColor', '#99CCFF'),
      useSelectionForeColor: true,
      selectionForeColor: rpsGetColor('rpsSelectionForeColor', '#000000'),
      fontFamily: document.getElementById('rpsFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('rpsFontSize')?.value) || 10,
      bold: document.getElementById('rpsBold')?.classList.contains('active'),
      italic: document.getElementById('rpsItalic')?.classList.contains('active'),
      underline: document.getElementById('rpsUnderline')?.classList.contains('active'),
      keyNavigation: document.getElementById('rpsKeyNavigation')?.checked !== false,
      wrapAround: Boolean(document.getElementById('rpsWrapAround')?.checked),
      displayHeader: document.getElementById('rpsDisplayHeader')?.checked !== false,
      activeColumnId,
      columns: cloneColumns(rpsColumnsDraft),
      linesPerItem: Number(document.getElementById('rpsLinesPerItem')?.value) || 1,
      wordWrap: document.getElementById('rpsWordWrap')?.checked !== false,
      selectedIndex: 0
    };
  }

  async function showRecipePlusSelectorDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the RecipePlus Selector');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initRecipePlusSelectorDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultRecipePlusSelectorComponent({
        name: nextRecipePlusSelectorName(canvas?.components),
        ...overrides
      });
      fillRecipePlusSelectorForm(comp);
      window.resetPropsDialogState('recipeplus-selector', readRecipePlusSelectorForm, 'applyRecipePlusSelector');
      switchTab('general');
      wireRecipePlusSelectorTools();
      presentRecipePlusSelectorDialog();
      const previewComp = readRecipePlusSelectorForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readRecipePlusSelectorForm, 'applyRecipePlusSelector');
    } catch (err) {
      window.setStatus(`RecipePlus Selector properties error: ${err.message}`);
    }
  }

  async function applyRecipePlusSelector() {
    const comp = readRecipePlusSelectorForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readRecipePlusSelectorForm, 'applyRecipePlusSelector');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveRecipePlusSelector(e) {
    e.preventDefault();
    const comp = readRecipePlusSelectorForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    rpsDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('recipePlusSelectorDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function initRecipePlusSelectorDialog() {
    const form = document.getElementById('recipePlusSelectorForm');
    if (!form || form.dataset.rpsWired === '1') return;
    form.addEventListener('submit', (e) => saveRecipePlusSelector(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyRecipePlusSelector')?.addEventListener('click', () => {
      applyRecipePlusSelector().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      saveRpsColumnToDraft();
      scheduleRecipePlusSelectorLivePreview();
      window.flushPropsApplyButton?.(readRecipePlusSelectorForm, 'applyRecipePlusSelector');
    });
    form.addEventListener('change', () => {
      saveRpsColumnToDraft();
      scheduleRecipePlusSelectorLivePreview();
      window.flushPropsApplyButton?.(readRecipePlusSelectorForm, 'applyRecipePlusSelector');
    });
    document.getElementById('cancelRecipePlusSelector')?.addEventListener('click', () => {
      if (!rpsDialogCommitted) window.revertPropsDialogPreview?.();
      rpsDialogCommitted = true;
      document.getElementById('recipePlusSelectorDialog')?.close();
    });
    document.getElementById('recipePlusSelectorDialog')?.addEventListener('close', () => {
      if (rpsPreviewTimer) {
        clearTimeout(rpsPreviewTimer);
        rpsPreviewTimer = null;
      }
      if (!rpsDialogCommitted) window.revertPropsDialogPreview?.();
      rpsDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpRecipePlusSelector')?.addEventListener('click', () => {
      alert('RecipePlus Selector lists recipes and units. Configure appearance on General and columns on the Recipe tab.');
    });
    document.querySelectorAll('#recipePlusSelectorDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.rpsTab));
    });
    document.getElementById('rpsColumnSelect')?.addEventListener('change', (e) => {
      saveRpsColumnToDraft();
      loadRpsColumnFromDraft(e.target.value);
      scheduleRecipePlusSelectorLivePreview();
      window.flushPropsApplyButton?.(readRecipePlusSelectorForm, 'applyRecipePlusSelector');
    });
    for (const id of ['rpsBold', 'rpsItalic', 'rpsUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleRecipePlusSelectorLivePreview();
      });
    }
    form.dataset.rpsWired = '1';
  }

  window.StudioRecipePlusSelector = {
    initRecipePlusSelectorDialog,
    presentRecipePlusSelectorDialog,
    scheduleRecipePlusSelectorLivePreview,
    showRecipePlusSelectorDialog,
    fillRecipePlusSelectorForm,
    readRecipePlusSelectorForm,
    switchRecipePlusSelectorTab: switchTab,
    wireRecipePlusSelectorTools,
    nextRecipePlusSelectorName,
    defaultRecipePlusSelectorComponent,
    defaultRecipePlusColumns,
    applyRecipePlusSelector
  };
})();
