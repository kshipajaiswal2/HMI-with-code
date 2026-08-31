/** Bar Graph property dialog — FactoryTalk View parity */
(function () {
  let bgrPreviewTimer = null;
  let bgrDialogCommitted = false;

  function bgrSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) {
      window.StudioPropsShared.setColorFieldValue(id, raw);
    } else {
      const el = document.getElementById(id);
      if (el) el.value = raw;
    }
  }

  function bgrGetColor(id, fallback) {
    if (window.StudioPropsShared?.getColorFieldValue) {
      return window.StudioPropsShared.getColorFieldValue(id) || fallback;
    }
    return document.getElementById(id)?.value || fallback;
  }

  function switchTab(tabId) {
    document.querySelectorAll('#barGraphDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.bgrTab === tabId);
    });
    document.querySelectorAll('#barGraphDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.bgrTabPanel === tabId);
    });
  }

  function nextBarGraphName(components) {
    const n = (components || []).filter((c) => c.type === 'BarGraph').length + 1;
    return `BarGraph${n}`;
  }

  function formatTagForDisplay(tag) {
    if (window.StudioTagTools?.formatFtTagRef) return window.StudioTagTools.formatFtTagRef(tag);
    const s = String(tag || '').trim();
    if (s.startsWith('PLC uploded Tags.')) return `{[PLC]${s.slice('PLC uploded Tags.'.length)}}`;
    return s;
  }

  function defaultThresholds() {
    return [
      { value: 50, fillColor: '#ffff00', blink: false },
      { value: 75, fillColor: '#ff0000', blink: false }
    ];
  }

  function defaultBarGraphComponent(overrides = {}) {
    return {
      type: 'BarGraph',
      name: 'BarGraph1',
      tag: '',
      left: 16,
      top: 16,
      width: 80,
      height: 120,
      visible: true,
      borderStyle: 'line',
      borderWidth: 4,
      borderUsesBackColor: true,
      backStyle: 'solid',
      fillStyle: 'solid',
      backColor: '#001C38',
      useBackColor: true,
      useBorderColor: true,
      borderColor: '#001C38',
      fillColor: '#99CCFF',
      useFillColor: true,
      minValue: 0,
      maxValue: 100,
      fillDirection: 'bottomToTop',
      numberOfThresholds: 0,
      thresholdType: 'value',
      thresholds: defaultThresholds(),
      ...overrides
    };
  }

  function scheduleBarGraphLivePreview() {
    if (window.state?.propsFormFill) return;
    if (bgrPreviewTimer) clearTimeout(bgrPreviewTimer);
    bgrPreviewTimer = setTimeout(() => {
      bgrPreviewTimer = null;
      if (!document.getElementById('barGraphDialog')?.open) return;
      const comp = readBarGraphForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readBarGraphForm, 'applyBarGraph');
    }, 80);
  }

  function syncBarGraphFields() {
    const count = Number(document.getElementById('bgrNumberOfThresholds')?.value) || 0;
    const t1On = count >= 1;
    const t2On = count >= 2;
    const t1Val = document.getElementById('bgrThreshold1Value');
    const t1Blink = document.getElementById('bgrThreshold1Blink');
    const t1Color = document.getElementById('bgrThreshold1FillColor');
    const t2Val = document.getElementById('bgrThreshold2Value');
    const t2Blink = document.getElementById('bgrThreshold2Blink');
    const t2Color = document.getElementById('bgrThreshold2FillColor');
    if (t1Val) t1Val.disabled = !t1On;
    if (t1Blink) t1Blink.disabled = !t1On;
    if (t1Color) t1Color.disabled = !t1On;
    if (t2Val) t2Val.disabled = !t2On;
    if (t2Blink) t2Blink.disabled = !t2On;
    if (t2Color) t2Color.disabled = !t2On;
    document.querySelectorAll('.bgr-threshold-row').forEach((row, i) => {
      row.classList.toggle('is-disabled', i === 0 ? !t1On : !t2On);
    });
  }

  function wireBgrTagPick() {
    const btn = document.querySelector('[data-tag-pick="bgrTag"]');
    const input = document.getElementById('bgrTag');
    if (!btn || !input || btn.dataset.tagPickWired === '1') return;
    btn.dataset.tagPickWired = '1';
    btn.addEventListener('click', () => {
      window.StudioTagTools?.openTagBrowser(input, (sel) => {
        input.value = formatTagForDisplay(sel);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        scheduleBarGraphLivePreview();
      });
    });
  }

  function wireTools() {
    wireBgrTagPick();
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('barGraphDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    document.querySelectorAll('#barGraphForm .ft-color-input').forEach((input) => {
      if (input.dataset.bgrPreviewWired === '1') return;
      input.dataset.bgrPreviewWired = '1';
      input.addEventListener('input', scheduleBarGraphLivePreview);
      input.addEventListener('change', scheduleBarGraphLivePreview);
    });
    syncBarGraphFields();
  }

  function presentBarGraphDialog() {
    const dialog = document.getElementById('barGraphDialog');
    if (!dialog) {
      window.setStatus('Bar Graph Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    bgrDialogCommitted = false;
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
        window.setStatus(`Opened Bar Graph properties without modal: ${err2.message}`);
      }
    }
  }

  function fillBarGraphForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      document.getElementById('bgrBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('bgrBorderWidth').value = comp.borderWidth ?? 4;
      document.getElementById('bgrBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      const backStyle = ['solid', 'transparent', 'gradient'].includes(comp.backStyle) ? comp.backStyle : 'solid';
      document.getElementById('bgrBackStyle').value = backStyle;
      document.getElementById('bgrFillStyle').value = comp.fillStyle === 'gradient' ? 'gradient' : 'solid';
      bgrSetColor('bgrBackColor', comp.backColor || '#001C38');
      bgrSetColor('bgrBorderColor', comp.borderColor || '#001C38');
      bgrSetColor('bgrFillColor', comp.fillColor || '#99CCFF');
      document.getElementById('bgrMinValue').value = comp.minValue ?? 0;
      document.getElementById('bgrMaxValue').value = comp.maxValue ?? 100;
      document.getElementById('bgrFillDirection').value = comp.fillDirection || 'bottomToTop';
      document.getElementById('bgrNumberOfThresholds').value = String(comp.numberOfThresholds ?? 0);
      document.getElementById('bgrThresholdType').value = (comp.thresholdType || 'value').toLowerCase() === 'percentage' ? 'percentage' : 'value';
      const thresholds = comp.thresholds?.length ? comp.thresholds : defaultThresholds();
      document.getElementById('bgrThreshold1Value').value = thresholds[0]?.value ?? 50;
      bgrSetColor('bgrThreshold1FillColor', thresholds[0]?.fillColor || '#ffff00');
      document.getElementById('bgrThreshold1Blink').checked = Boolean(thresholds[0]?.blink);
      document.getElementById('bgrThreshold2Value').value = thresholds[1]?.value ?? 75;
      bgrSetColor('bgrThreshold2FillColor', thresholds[1]?.fillColor || '#ff0000');
      document.getElementById('bgrThreshold2Blink').checked = Boolean(thresholds[1]?.blink);
      document.getElementById('bgrTag').value = formatTagForDisplay(comp.tag || '');
      document.getElementById('bgrHeight').value = comp.height ?? 120;
      document.getElementById('bgrWidth').value = comp.width ?? 80;
      document.getElementById('bgrTop').value = comp.top ?? 16;
      document.getElementById('bgrLeft').value = comp.left ?? 16;
      document.getElementById('bgrName').value = comp.name || 'BarGraph1';
      document.getElementById('bgrVisible').checked = comp.visible !== false;
      syncBarGraphFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readBarGraphForm() {
    return {
      type: 'BarGraph',
      name: document.getElementById('bgrName').value.trim() || 'BarGraph1',
      tag: document.getElementById('bgrTag').value.trim(),
      left: Number(document.getElementById('bgrLeft').value) || 0,
      top: Number(document.getElementById('bgrTop').value) || 0,
      width: Number(document.getElementById('bgrWidth').value) || 80,
      height: Number(document.getElementById('bgrHeight').value) || 120,
      visible: document.getElementById('bgrVisible').checked,
      borderStyle: document.getElementById('bgrBorderStyle').value,
      borderWidth: Number(document.getElementById('bgrBorderWidth').value ?? 4),
      borderUsesBackColor: document.getElementById('bgrBorderUsesBackColor').checked,
      backStyle: document.getElementById('bgrBackStyle').value,
      fillStyle: document.getElementById('bgrFillStyle').value,
      backColor: bgrGetColor('bgrBackColor', '#001C38'),
      useBackColor: true,
      useBorderColor: true,
      borderColor: bgrGetColor('bgrBorderColor', '#001C38'),
      fillColor: bgrGetColor('bgrFillColor', '#99CCFF'),
      useFillColor: true,
      minValue: Number(document.getElementById('bgrMinValue').value) || 0,
      maxValue: Number(document.getElementById('bgrMaxValue').value) || 100,
      fillDirection: document.getElementById('bgrFillDirection').value,
      numberOfThresholds: Number(document.getElementById('bgrNumberOfThresholds').value) || 0,
      thresholdType: document.getElementById('bgrThresholdType').value,
      thresholds: [
        {
          value: Number(document.getElementById('bgrThreshold1Value').value) || 50,
          fillColor: bgrGetColor('bgrThreshold1FillColor', '#ffff00'),
          blink: document.getElementById('bgrThreshold1Blink').checked
        },
        {
          value: Number(document.getElementById('bgrThreshold2Value').value) || 75,
          fillColor: bgrGetColor('bgrThreshold2FillColor', '#ff0000'),
          blink: document.getElementById('bgrThreshold2Blink').checked
        }
      ]
    };
  }

  async function showBarGraphDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Bar Graph');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initBarGraphDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultBarGraphComponent({
        name: nextBarGraphName(canvas?.components),
        ...overrides
      });
      fillBarGraphForm(comp);
      window.resetPropsDialogState('bar-graph', readBarGraphForm, 'applyBarGraph');
      switchTab('general');
      wireTools();
      presentBarGraphDialog();
      const previewComp = readBarGraphForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readBarGraphForm, 'applyBarGraph');
    } catch (err) {
      window.setStatus(`Bar Graph properties error: ${err.message}`);
    }
  }

  async function applyBarGraph() {
    const comp = readBarGraphForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readBarGraphForm, 'applyBarGraph');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveBarGraph(e) {
    e.preventDefault();
    const comp = readBarGraphForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    bgrDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('barGraphDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function initBarGraphDialog() {
    const form = document.getElementById('barGraphForm');
    if (!form || form.dataset.bgrWired === '1') return;
    form.addEventListener('submit', (e) => saveBarGraph(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyBarGraph')?.addEventListener('click', () => {
      applyBarGraph().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleBarGraphLivePreview();
      window.flushPropsApplyButton?.(readBarGraphForm, 'applyBarGraph');
    });
    form.addEventListener('change', () => {
      syncBarGraphFields();
      scheduleBarGraphLivePreview();
      window.flushPropsApplyButton?.(readBarGraphForm, 'applyBarGraph');
    });
    document.getElementById('cancelBarGraph')?.addEventListener('click', () => {
      if (!bgrDialogCommitted) window.revertPropsDialogPreview?.();
      bgrDialogCommitted = true;
      document.getElementById('barGraphDialog')?.close();
    });
    document.getElementById('barGraphDialog')?.addEventListener('close', () => {
      if (bgrPreviewTimer) {
        clearTimeout(bgrPreviewTimer);
        bgrPreviewTimer = null;
      }
      if (!bgrDialogCommitted) window.revertPropsDialogPreview?.();
      bgrDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpBarGraph')?.addEventListener('click', () => {
      alert('Bar Graph displays a Value tag as a filled bar between minimum and maximum values. A Value tag is optional until runtime.');
    });
    document.querySelectorAll('#barGraphDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.bgrTab));
    });
    document.getElementById('bgrNumberOfThresholds')?.addEventListener('change', () => {
      syncBarGraphFields();
      scheduleBarGraphLivePreview();
    });
    form.dataset.bgrWired = '1';
  }

  window.StudioBarGraph = {
    initBarGraphDialog,
    presentBarGraphDialog,
    scheduleBarGraphLivePreview,
    showBarGraphDialog,
    fillBarGraphForm,
    readBarGraphForm,
    switchBarGraphTab: switchTab,
    wireBarGraphTools: wireTools,
    nextBarGraphName,
    defaultBarGraphComponent,
    applyBarGraph
  };
})();
