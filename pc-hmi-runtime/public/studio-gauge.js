/** Gauge property dialog — FactoryTalk View parity */
(function () {
  const GG_FONTS = [
    'Arial', 'Arial Unicode MS', 'Bahnschrift', 'Calibri', 'Cambria', 'Candara',
    'Comic Sans MS', 'Consolas', 'Constantia', 'Corbel', 'Courier New', 'Ebrima',
    'Franklin Gothic Medium', 'Gabriola', 'Georgia', 'Impact', 'Lucida Console',
    'Lucida Sans Unicode', 'Malgun Gothic', 'Microsoft Sans Serif', 'Palatino Linotype',
    'Segoe UI', 'Segoe UI Symbol', 'Tahoma', 'Times New Roman', 'Trebuchet MS',
    'Verdana', 'Yu Gothic'
  ];
  let ggPreviewTimer = null;
  let ggDialogCommitted = false;

  function ggSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) {
      window.StudioPropsShared.setColorFieldValue(id, raw);
    } else {
      const el = document.getElementById(id);
      if (el) el.value = raw;
    }
  }

  function ggGetColor(id, fallback) {
    if (window.StudioPropsShared?.getColorFieldValue) {
      return window.StudioPropsShared.getColorFieldValue(id) || fallback;
    }
    return document.getElementById(id)?.value || fallback;
  }

  function switchTab(tabId) {
    document.querySelectorAll('#gaugeDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.ggTab === tabId);
    });
    document.querySelectorAll('#gaugeDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.ggTabPanel === tabId);
    });
  }

  function nextGaugeName(components) {
    const n = (components || []).filter((c) => c.type === 'Gauge').length + 1;
    return `Gauge${n}`;
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

  function fillFontSelect() {
    const el = document.getElementById('ggFont');
    if (!el || el.dataset.ggFonts === '1') return;
    el.dataset.ggFonts = '1';
    const names = new Set(GG_FONTS);
    try {
      document.fonts?.forEach((f) => {
        if (f.family) names.add(f.family);
      });
    } catch (_) { /* ignore */ }
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    el.innerHTML = sorted.map((name) => {
      const sel = name === 'Arial Unicode MS' ? ' selected' : '';
      return `<option value="${name}"${sel}>${name}</option>`;
    }).join('');
  }

  function defaultGaugeComponent(overrides = {}) {
    return {
      type: 'Gauge',
      name: 'Gauge1',
      tag: '',
      left: 16,
      top: 16,
      width: 191,
      height: 140,
      visible: true,
      backStyle: 'solid',
      lineStyle: 'solid',
      lineWidth: 1,
      sweepStyle: 'solidFill',
      needleWidth: 2,
      majorTicks: 5,
      minorTicks: 2,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      backColor: '#001C38',
      useBackColor: true,
      fillColor: '#99CCFF',
      needleColor: '#FFFFFF',
      foreColor: '#FFFFFF',
      useForeColor: true,
      minValue: 0,
      maxValue: 100,
      showLegend: true,
      decimalDigits: 0,
      legendColor: '#FFFFFF',
      numberOfThresholds: 0,
      thresholdType: 'value',
      thresholds: defaultThresholds(),
      ...overrides
    };
  }

  function scheduleGaugeLivePreview() {
    if (window.state?.propsFormFill) return;
    if (ggPreviewTimer) clearTimeout(ggPreviewTimer);
    ggPreviewTimer = setTimeout(() => {
      ggPreviewTimer = null;
      if (!document.getElementById('gaugeDialog')?.open) return;
      const comp = readGaugeForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readGaugeForm, 'applyGauge');
    }, 80);
  }

  function syncGaugeFields() {
    const count = Number(document.getElementById('ggNumberOfThresholds')?.value) || 0;
    const t1On = count >= 1;
    const t2On = count >= 2;
    const t1Val = document.getElementById('ggThreshold1Value');
    const t1Blink = document.getElementById('ggThreshold1Blink');
    const t1Color = document.getElementById('ggThreshold1FillColor');
    const t2Val = document.getElementById('ggThreshold2Value');
    const t2Blink = document.getElementById('ggThreshold2Blink');
    const t2Color = document.getElementById('ggThreshold2FillColor');
    if (t1Val) t1Val.disabled = !t1On;
    if (t1Blink) t1Blink.disabled = !t1On;
    if (t1Color) t1Color.disabled = !t1On;
    if (t2Val) t2Val.disabled = !t2On;
    if (t2Blink) t2Blink.disabled = !t2On;
    if (t2Color) t2Color.disabled = !t2On;
    document.querySelectorAll('.gg-threshold-row').forEach((row, i) => {
      row.classList.toggle('is-disabled', i === 0 ? !t1On : !t2On);
    });
  }

  function wireGgTagPick() {
    const btn = document.querySelector('[data-tag-pick="ggTag"]');
    const input = document.getElementById('ggTag');
    if (!btn || !input || btn.dataset.tagPickWired === '1') return;
    btn.dataset.tagPickWired = '1';
    btn.addEventListener('click', () => {
      window.StudioTagTools?.openTagBrowser(input, (sel) => {
        input.value = formatTagForDisplay(sel);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        scheduleGaugeLivePreview();
      });
    });
  }

  function wireTools() {
    fillFontSelect();
    wireGgTagPick();
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('gaugeDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    document.querySelectorAll('#gaugeForm .ft-color-input').forEach((input) => {
      if (input.dataset.ggPreviewWired === '1') return;
      input.dataset.ggPreviewWired = '1';
      input.addEventListener('input', scheduleGaugeLivePreview);
      input.addEventListener('change', scheduleGaugeLivePreview);
    });
    syncGaugeFields();
  }

  function presentGaugeDialog() {
    const dialog = document.getElementById('gaugeDialog');
    if (!dialog) {
      window.setStatus('Gauge Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    ggDialogCommitted = false;
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
        window.setStatus(`Opened Gauge properties without modal: ${err2.message}`);
      }
    }
  }

  function fillGaugeForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillFontSelect();
      const backStyle = ['solid', 'transparent', 'gradient'].includes(comp.backStyle) ? comp.backStyle : 'solid';
      document.getElementById('ggBackStyle').value = backStyle;
      const lineStyle = ['none', 'solid', 'dash', 'dot', 'dashDot', 'dashDotDot'].includes(comp.lineStyle)
        ? comp.lineStyle : 'solid';
      document.getElementById('ggLineStyle').value = lineStyle;
      document.getElementById('ggLineWidth').value = comp.lineWidth ?? 1;
      const sweep = comp.sweepStyle === 'point' || comp.sweepStyle === 'gradientFill' ? comp.sweepStyle : 'solidFill';
      document.getElementById('ggSweepStyle').value = sweep;
      document.getElementById('ggNeedleWidth').value = comp.needleWidth ?? 2;
      document.getElementById('ggMajorTicks').value = String(comp.majorTicks ?? 5);
      document.getElementById('ggMinorTicks').value = String(comp.minorTicks ?? 2);
      const fontEl = document.getElementById('ggFont');
      const fontName = comp.fontFamily || 'Arial Unicode MS';
      if (fontEl && ![...fontEl.options].some((o) => o.value === fontName)) {
        const opt = document.createElement('option');
        opt.value = fontName;
        opt.textContent = fontName;
        fontEl.appendChild(opt);
      }
      if (fontEl) fontEl.value = fontName;
      document.getElementById('ggFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('ggBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('ggItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('ggUnderline').classList.toggle('active', Boolean(comp.underline));
      ggSetColor('ggBackColor', comp.backColor || '#001C38');
      ggSetColor('ggFillColor', comp.fillColor || '#99CCFF');
      ggSetColor('ggNeedleColor', comp.needleColor || '#FFFFFF');
      ggSetColor('ggForeColor', comp.foreColor || '#FFFFFF');
      document.getElementById('ggMinValue').value = comp.minValue ?? 0;
      document.getElementById('ggMaxValue').value = comp.maxValue ?? 100;
      document.getElementById('ggShowLegend').checked = comp.showLegend !== false;
      document.getElementById('ggDecimalDigits').value = String(comp.decimalDigits ?? 0);
      ggSetColor('ggLegendColor', comp.legendColor || '#FFFFFF');
      document.getElementById('ggNumberOfThresholds').value = String(comp.numberOfThresholds ?? 0);
      document.getElementById('ggThresholdType').value = (comp.thresholdType || 'value').toLowerCase() === 'percentage' ? 'percentage' : 'value';
      const thresholds = comp.thresholds?.length ? comp.thresholds : defaultThresholds();
      document.getElementById('ggThreshold1Value').value = thresholds[0]?.value ?? 50;
      ggSetColor('ggThreshold1FillColor', thresholds[0]?.fillColor || '#ffff00');
      document.getElementById('ggThreshold1Blink').checked = Boolean(thresholds[0]?.blink);
      document.getElementById('ggThreshold2Value').value = thresholds[1]?.value ?? 75;
      ggSetColor('ggThreshold2FillColor', thresholds[1]?.fillColor || '#ff0000');
      document.getElementById('ggThreshold2Blink').checked = Boolean(thresholds[1]?.blink);
      document.getElementById('ggTag').value = formatTagForDisplay(comp.tag || '');
      document.getElementById('ggHeight').value = comp.height ?? 140;
      document.getElementById('ggWidth').value = comp.width ?? 191;
      document.getElementById('ggTop').value = comp.top ?? 16;
      document.getElementById('ggLeft').value = comp.left ?? 16;
      document.getElementById('ggName').value = comp.name || 'Gauge1';
      document.getElementById('ggVisible').checked = comp.visible !== false;
      syncGaugeFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readGaugeForm() {
    return {
      type: 'Gauge',
      name: document.getElementById('ggName').value.trim() || 'Gauge1',
      tag: document.getElementById('ggTag').value.trim(),
      left: Number(document.getElementById('ggLeft').value) || 0,
      top: Number(document.getElementById('ggTop').value) || 0,
      width: Number(document.getElementById('ggWidth').value) || 191,
      height: Number(document.getElementById('ggHeight').value) || 140,
      visible: document.getElementById('ggVisible').checked,
      backStyle: document.getElementById('ggBackStyle').value,
      lineStyle: document.getElementById('ggLineStyle').value,
      lineWidth: Number(document.getElementById('ggLineWidth').value ?? 1),
      sweepStyle: document.getElementById('ggSweepStyle').value,
      needleWidth: Number(document.getElementById('ggNeedleWidth').value ?? 2),
      majorTicks: Number(document.getElementById('ggMajorTicks').value) || 5,
      minorTicks: Number(document.getElementById('ggMinorTicks').value) || 0,
      fontFamily: document.getElementById('ggFont').value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('ggFontSize').value) || 10,
      bold: document.getElementById('ggBold').classList.contains('active'),
      italic: document.getElementById('ggItalic').classList.contains('active'),
      underline: document.getElementById('ggUnderline').classList.contains('active'),
      backColor: ggGetColor('ggBackColor', '#001C38'),
      useBackColor: true,
      fillColor: ggGetColor('ggFillColor', '#99CCFF'),
      needleColor: ggGetColor('ggNeedleColor', '#FFFFFF'),
      foreColor: ggGetColor('ggForeColor', '#FFFFFF'),
      useForeColor: true,
      minValue: Number(document.getElementById('ggMinValue').value) || 0,
      maxValue: Number(document.getElementById('ggMaxValue').value) || 100,
      showLegend: document.getElementById('ggShowLegend').checked,
      decimalDigits: Number(document.getElementById('ggDecimalDigits').value) || 0,
      legendColor: ggGetColor('ggLegendColor', '#FFFFFF'),
      numberOfThresholds: Number(document.getElementById('ggNumberOfThresholds').value) || 0,
      thresholdType: document.getElementById('ggThresholdType').value,
      thresholds: [
        {
          value: Number(document.getElementById('ggThreshold1Value').value) || 50,
          fillColor: ggGetColor('ggThreshold1FillColor', '#ffff00'),
          blink: document.getElementById('ggThreshold1Blink').checked
        },
        {
          value: Number(document.getElementById('ggThreshold2Value').value) || 75,
          fillColor: ggGetColor('ggThreshold2FillColor', '#ff0000'),
          blink: document.getElementById('ggThreshold2Blink').checked
        }
      ]
    };
  }

  async function showGaugeDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Gauge');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initGaugeDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultGaugeComponent({
        name: nextGaugeName(canvas?.components),
        ...overrides
      });
      fillGaugeForm(comp);
      window.resetPropsDialogState('gauge', readGaugeForm, 'applyGauge');
      switchTab('general');
      wireTools();
      presentGaugeDialog();
      const previewComp = readGaugeForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readGaugeForm, 'applyGauge');
    } catch (err) {
      window.setStatus(`Gauge properties error: ${err.message}`);
    }
  }

  async function applyGauge() {
    const comp = readGaugeForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readGaugeForm, 'applyGauge');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveGauge(e) {
    e.preventDefault();
    const comp = readGaugeForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    ggDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('gaugeDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function initGaugeDialog() {
    const form = document.getElementById('gaugeForm');
    if (!form || form.dataset.ggWired === '1') return;
    fillFontSelect();
    form.addEventListener('submit', (e) => saveGauge(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyGauge')?.addEventListener('click', () => {
      applyGauge().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleGaugeLivePreview();
      window.flushPropsApplyButton?.(readGaugeForm, 'applyGauge');
    });
    form.addEventListener('change', () => {
      syncGaugeFields();
      scheduleGaugeLivePreview();
      window.flushPropsApplyButton?.(readGaugeForm, 'applyGauge');
    });
    document.getElementById('cancelGauge')?.addEventListener('click', () => {
      if (!ggDialogCommitted) window.revertPropsDialogPreview?.();
      ggDialogCommitted = true;
      document.getElementById('gaugeDialog')?.close();
    });
    document.getElementById('gaugeDialog')?.addEventListener('close', () => {
      if (ggPreviewTimer) {
        clearTimeout(ggPreviewTimer);
        ggPreviewTimer = null;
      }
      if (!ggDialogCommitted) window.revertPropsDialogPreview?.();
      ggDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpGauge')?.addEventListener('click', () => {
      alert('Gauge displays a Value tag as a needle on a 180° scale between minimum and maximum values. A Value tag is optional until runtime.');
    });
    document.querySelectorAll('#gaugeDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.ggTab));
    });
    for (const id of ['ggBold', 'ggItalic', 'ggUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('active');
        scheduleGaugeLivePreview();
        window.flushPropsApplyButton?.(readGaugeForm, 'applyGauge');
      });
    }
    document.getElementById('ggNumberOfThresholds')?.addEventListener('change', () => {
      syncGaugeFields();
      scheduleGaugeLivePreview();
    });
    form.dataset.ggWired = '1';
  }

  window.StudioGauge = {
    initGaugeDialog,
    presentGaugeDialog,
    scheduleGaugeLivePreview,
    showGaugeDialog,
    fillGaugeForm,
    readGaugeForm,
    switchGaugeTab: switchTab,
    wireGaugeTools: wireTools,
    nextGaugeName,
    defaultGaugeComponent,
    applyGauge
  };
})();
