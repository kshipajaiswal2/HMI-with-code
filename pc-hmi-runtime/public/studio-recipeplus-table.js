/** RecipePlus Table property dialog — FactoryTalk View parity */
(function () {
  let rptPreviewTimer = null;
  let rptDialogCommitted = false;
  let rptColumnsDraft = null;
  let rptActiveColumnId = 'ingredientName';

  function cloneColumns(columns) {
    return (columns || []).map((c) => ({ ...c }));
  }

  function defaultRecipePlusTableColumns() {
    return [
      { id: 'ingredientName', label: 'Ingredient name', headerText: 'Ingredient', width: 100, display: true },
      { id: 'currentValue', label: 'Current value', headerText: 'Current', width: 55, display: true },
      { id: 'recipeValue', label: 'Recipe value', headerText: 'Recipe', width: 55, display: true },
      { id: 'compareStatus', label: 'Compare status', headerText: 'Compare', width: 55, display: true },
      { id: 'tagName', label: 'Tag name', headerText: 'Tag Name', width: 100, display: true }
    ];
  }

  function switchTab(tabId) {
    document.querySelectorAll('#recipePlusTableDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.rptTab === tabId);
    });
    document.querySelectorAll('#recipePlusTableDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.rptTabPanel === tabId);
    });
  }

  function rptGetColor(id, fallback) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || fallback
      || '#001C38';
  }

  function rptSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextRecipePlusTableName(components) {
    const n = (components || []).filter((c) => c.type === 'RecipePlusTable').length + 1;
    return `RecipePlusTable${n}`;
  }

  function defaultRecipePlusTableComponent(overrides = {}) {
    return {
      type: 'RecipePlusTable',
      name: 'RecipePlusTable1',
      left: 16,
      top: 16,
      width: 82,
      height: 98,
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
      useFooterBackColor: true,
      footerBackColor: '#001C38',
      useFooterForeColor: true,
      footerForeColor: '#ffffff',
      useGridColor: true,
      gridColor: '#A0A8B0',
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      keyNavigation: true,
      wrapAround: false,
      displayHeader: true,
      displayFooter: true,
      viewOnly: false,
      activeColumnId: 'ingredientName',
      columns: defaultRecipePlusTableColumns(),
      linesPerItem: 1,
      wordWrap: true,
      selectedIndex: 0,
      ...overrides
    };
  }

  function scheduleRecipePlusTableLivePreview() {
    if (window.state?.propsFormFill) return;
    if (rptPreviewTimer) clearTimeout(rptPreviewTimer);
    rptPreviewTimer = setTimeout(() => {
      rptPreviewTimer = null;
      if (!document.getElementById('recipePlusTableDialog')?.open) return;
      const comp = readRecipePlusTableForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readRecipePlusTableForm, 'applyRecipePlusTable');
    }, 80);
  }

  function rebuildRptColumnSelect() {
    const sel = document.getElementById('rptColumnSelect');
    if (!sel || !rptColumnsDraft) return;
    const prev = rptActiveColumnId;
    sel.innerHTML = rptColumnsDraft.map((c) => `<option value="${c.id}">${c.label || c.id}</option>`).join('');
    const next = rptColumnsDraft.some((c) => c.id === prev) ? prev : rptColumnsDraft[0]?.id || 'ingredientName';
    sel.value = next;
    loadRptColumnFromDraft(next);
  }

  function loadRptColumnFromDraft(columnId) {
    rptActiveColumnId = columnId;
    const col = rptColumnsDraft?.find((c) => c.id === columnId);
    if (!col) return;
    document.getElementById('rptDisplayColumn').checked = col.display !== false;
    document.getElementById('rptColumnWidth').value = col.width ?? 100;
    document.getElementById('rptColumnHeaderText').value = col.headerText || col.label || '';
  }

  function saveRptColumnToDraft() {
    const col = rptColumnsDraft?.find((c) => c.id === rptActiveColumnId);
    if (!col) return;
    col.display = document.getElementById('rptDisplayColumn')?.checked !== false;
    col.width = Number(document.getElementById('rptColumnWidth')?.value) || 100;
    col.headerText = document.getElementById('rptColumnHeaderText')?.value || col.label || '';
  }

  function wireRecipePlusTableTools() {
    const dlg = document.getElementById('recipePlusTableDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    document.querySelectorAll('#recipePlusTableForm .ft-color-input').forEach((input) => {
      if (input.dataset.rptPreviewWired === '1') return;
      input.dataset.rptPreviewWired = '1';
      input.addEventListener('input', scheduleRecipePlusTableLivePreview);
      input.addEventListener('change', scheduleRecipePlusTableLivePreview);
    });
  }

  function presentRecipePlusTableDialog() {
    const dialog = document.getElementById('recipePlusTableDialog');
    if (!dialog) {
      window.setStatus('RecipePlus Table Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    rptDialogCommitted = false;
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
        window.setStatus(`Opened RecipePlus Table properties without modal: ${err2.message}`);
      }
    }
  }

  function fillRecipePlusTableForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      rptColumnsDraft = cloneColumns(comp.columns?.length ? comp.columns : defaultRecipePlusTableColumns());
      rptActiveColumnId = comp.activeColumnId || rptColumnsDraft[0]?.id || 'ingredientName';
      document.getElementById('rptBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('rptBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('rptBackStyle').value = comp.backStyle || 'solid';
      document.getElementById('rptBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      rptSetColor('rptBackColor', comp.backColor || '#001C38');
      rptSetColor('rptBorderColor', comp.borderColor || '#001C38');
      rptSetColor('rptForeColor', comp.foreColor || '#ffffff');
      rptSetColor('rptHeaderBackColor', comp.headerBackColor || '#001C38');
      rptSetColor('rptHeaderForeColor', comp.headerForeColor || '#ffffff');
      rptSetColor('rptSelectionBackColor', comp.selectionBackColor || '#99CCFF');
      rptSetColor('rptSelectionForeColor', comp.selectionForeColor || '#000000');
      rptSetColor('rptFooterBackColor', comp.footerBackColor || '#001C38');
      rptSetColor('rptFooterForeColor', comp.footerForeColor || '#ffffff');
      rptSetColor('rptGridColor', comp.gridColor || '#A0A8B0');
      document.getElementById('rptFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('rptFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('rptBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('rptItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('rptUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('rptKeyNavigation').checked = comp.keyNavigation !== false;
      document.getElementById('rptWrapAround').checked = Boolean(comp.wrapAround);
      document.getElementById('rptDisplayHeader').checked = comp.displayHeader !== false;
      document.getElementById('rptDisplayFooter').checked = comp.displayFooter !== false;
      document.getElementById('rptViewOnly').checked = Boolean(comp.viewOnly);
      document.getElementById('rptLinesPerItem').value = String(comp.linesPerItem ?? 1);
      document.getElementById('rptWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('rptHeight').value = comp.height ?? 98;
      document.getElementById('rptWidth').value = comp.width ?? 82;
      document.getElementById('rptTop').value = comp.top ?? 16;
      document.getElementById('rptLeft').value = comp.left ?? 16;
      document.getElementById('rptName').value = comp.name || 'RecipePlusTable1';
      document.getElementById('rptVisible').checked = comp.visible !== false;
      rebuildRptColumnSelect();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readRecipePlusTableForm() {
    saveRptColumnToDraft();
    const activeColumnId = document.getElementById('rptColumnSelect')?.value || rptActiveColumnId;
    return {
      type: 'RecipePlusTable',
      name: document.getElementById('rptName')?.value.trim() || 'RecipePlusTable1',
      left: Number(document.getElementById('rptLeft')?.value) || 0,
      top: Number(document.getElementById('rptTop')?.value) || 0,
      width: Number(document.getElementById('rptWidth')?.value) || 82,
      height: Number(document.getElementById('rptHeight')?.value) || 98,
      visible: document.getElementById('rptVisible')?.checked !== false,
      borderStyle: document.getElementById('rptBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('rptBorderWidth')?.value) || 1,
      borderUsesBackColor: document.getElementById('rptBorderUsesBackColor')?.checked !== false,
      backStyle: document.getElementById('rptBackStyle')?.value || 'solid',
      backColor: rptGetColor('rptBackColor', '#001C38'),
      useBackColor: true,
      useBorderColor: true,
      borderColor: rptGetColor('rptBorderColor', '#001C38'),
      useForeColor: true,
      foreColor: rptGetColor('rptForeColor', '#ffffff'),
      useHeaderBackColor: true,
      headerBackColor: rptGetColor('rptHeaderBackColor', '#001C38'),
      useHeaderForeColor: true,
      headerForeColor: rptGetColor('rptHeaderForeColor', '#ffffff'),
      useSelectionBackColor: true,
      selectionBackColor: rptGetColor('rptSelectionBackColor', '#99CCFF'),
      useSelectionForeColor: true,
      selectionForeColor: rptGetColor('rptSelectionForeColor', '#000000'),
      useFooterBackColor: true,
      footerBackColor: rptGetColor('rptFooterBackColor', '#001C38'),
      useFooterForeColor: true,
      footerForeColor: rptGetColor('rptFooterForeColor', '#ffffff'),
      useGridColor: true,
      gridColor: rptGetColor('rptGridColor', '#A0A8B0'),
      fontFamily: document.getElementById('rptFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('rptFontSize')?.value) || 10,
      bold: document.getElementById('rptBold')?.classList.contains('active'),
      italic: document.getElementById('rptItalic')?.classList.contains('active'),
      underline: document.getElementById('rptUnderline')?.classList.contains('active'),
      keyNavigation: document.getElementById('rptKeyNavigation')?.checked !== false,
      wrapAround: Boolean(document.getElementById('rptWrapAround')?.checked),
      displayHeader: document.getElementById('rptDisplayHeader')?.checked !== false,
      displayFooter: document.getElementById('rptDisplayFooter')?.checked !== false,
      viewOnly: Boolean(document.getElementById('rptViewOnly')?.checked),
      activeColumnId,
      columns: cloneColumns(rptColumnsDraft),
      linesPerItem: Number(document.getElementById('rptLinesPerItem')?.value) || 1,
      wordWrap: document.getElementById('rptWordWrap')?.checked !== false,
      selectedIndex: 0
    };
  }

  async function showRecipePlusTableDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the RecipePlus Table');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initRecipePlusTableDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultRecipePlusTableComponent({
        name: nextRecipePlusTableName(canvas?.components),
        ...overrides
      });
      fillRecipePlusTableForm(comp);
      window.resetPropsDialogState('recipeplus-table', readRecipePlusTableForm, 'applyRecipePlusTable');
      switchTab('general');
      wireRecipePlusTableTools();
      presentRecipePlusTableDialog();
      const previewComp = readRecipePlusTableForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readRecipePlusTableForm, 'applyRecipePlusTable');
    } catch (err) {
      window.setStatus(`RecipePlus Table properties error: ${err.message}`);
    }
  }

  async function applyRecipePlusTable() {
    const comp = readRecipePlusTableForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readRecipePlusTableForm, 'applyRecipePlusTable');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveRecipePlusTable(e) {
    e.preventDefault();
    const comp = readRecipePlusTableForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    rptDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('recipePlusTableDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function initRecipePlusTableDialog() {
    const form = document.getElementById('recipePlusTableForm');
    if (!form || form.dataset.rptWired === '1') return;
    form.addEventListener('submit', (e) => saveRecipePlusTable(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyRecipePlusTable')?.addEventListener('click', () => {
      applyRecipePlusTable().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      saveRptColumnToDraft();
      scheduleRecipePlusTableLivePreview();
      window.flushPropsApplyButton?.(readRecipePlusTableForm, 'applyRecipePlusTable');
    });
    form.addEventListener('change', () => {
      saveRptColumnToDraft();
      scheduleRecipePlusTableLivePreview();
      window.flushPropsApplyButton?.(readRecipePlusTableForm, 'applyRecipePlusTable');
    });
    document.getElementById('cancelRecipePlusTable')?.addEventListener('click', () => {
      if (!rptDialogCommitted) window.revertPropsDialogPreview?.();
      rptDialogCommitted = true;
      document.getElementById('recipePlusTableDialog')?.close();
    });
    document.getElementById('recipePlusTableDialog')?.addEventListener('close', () => {
      if (rptPreviewTimer) {
        clearTimeout(rptPreviewTimer);
        rptPreviewTimer = null;
      }
      if (!rptDialogCommitted) window.revertPropsDialogPreview?.();
      rptDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpRecipePlusTable')?.addEventListener('click', () => {
      alert('RecipePlus Table shows recipe ingredients. Configure appearance on General and columns on the Recipe tab.');
    });
    document.querySelectorAll('#recipePlusTableDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.rptTab));
    });
    document.getElementById('rptColumnSelect')?.addEventListener('change', (e) => {
      saveRptColumnToDraft();
      loadRptColumnFromDraft(e.target.value);
      scheduleRecipePlusTableLivePreview();
      window.flushPropsApplyButton?.(readRecipePlusTableForm, 'applyRecipePlusTable');
    });
    for (const id of ['rptBold', 'rptItalic', 'rptUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleRecipePlusTableLivePreview();
      });
    }
    form.dataset.rptWired = '1';
  }

  window.StudioRecipePlusTable = {
    initRecipePlusTableDialog,
    presentRecipePlusTableDialog,
    scheduleRecipePlusTableLivePreview,
    showRecipePlusTableDialog,
    fillRecipePlusTableForm,
    readRecipePlusTableForm,
    switchRecipePlusTableTab: switchTab,
    wireRecipePlusTableTools,
    nextRecipePlusTableName,
    defaultRecipePlusTableComponent,
    defaultRecipePlusTableColumns,
    applyRecipePlusTable
  };
})();
