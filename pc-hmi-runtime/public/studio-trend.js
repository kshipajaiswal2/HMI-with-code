/** Trend Object property dialog — FactoryTalk View parity */
(function () {
  const PEN_COLORS = ['#0000ff', '#00ff00', '#ff0000', '#ff00ff', '#ffffff', '#00ffff', '#ffff00', '#008000'];
  const TIME_UNITS = [
    ['ms', 'Millisecond(s)'],
    ['s', 'Second(s)'],
    ['min', 'Minute(s)'],
    ['h', 'Hour(s)']
  ];
  const TREND_FONTS = [
    'Arial', 'Arial Unicode MS', 'Bahnschrift', 'Calibri', 'Cambria', 'Consolas',
    'Courier New', 'Georgia', 'Malgun Gothic', 'Microsoft Sans Serif', 'Segoe UI',
    'Tahoma', 'Times New Roman', 'Verdana'
  ];
  let trPreviewTimer = null;
  let trDialogCommitted = false;
  let trSelectedPens = new Set();
  let trFontState = { family: 'Arial Unicode MS', style: 'regular', size: 8, strikeout: false, underline: false };

  function trSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }
  function trGetColor(id, fallback) {
    return window.StudioPropsShared?.getColorFieldValue?.(id) || document.getElementById(id)?.value || fallback;
  }

  function switchTab(tabId) {
    document.querySelectorAll('#trendDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.trTab === tabId);
    });
    document.querySelectorAll('#trendDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.trTabPanel === tabId);
    });
  }

  function nextTrendName(components) {
    const n = (components || []).filter((c) => c.type === 'Trend').length + 1;
    return `Trend${n}`;
  }

  function defaultPens() {
    return PEN_COLORS.map((color, i) => ({
      index: i + 1,
      tag: '',
      color,
      visible: false,
      width: 1,
      type: 'analog',
      style: 'solid',
      marker: 'none',
      min: 0,
      max: 100,
      linkData: false
    }));
  }

  function defaultTrendComponent(overrides = {}) {
    return {
      type: 'Trend',
      name: 'Trend1',
      left: 16,
      top: 16,
      width: 240,
      height: 180,
      visible: true,
      focusHighlight: true,
      keyNavigation: true,
      chartStyle: 'standard',
      xAxisPen: 1,
      updateMode: 'automatic',
      refreshRate: 1,
      refreshUnit: 's',
      heartbeat: 1,
      heartbeatUnit: 'min',
      deadband: 0,
      timeFormat: 'system',
      chartRadix: 'decimal',
      dataPointConnection: 'connect',
      displayMilliseconds: false,
      displayPenIcons: true,
      backColor: '#000000',
      useGradientStyle: false,
      textColor: '#000000',
      fontFamily: 'Arial Unicode MS',
      fontSize: 8,
      fontStyle: 'regular',
      strikeout: false,
      underline: false,
      allowScrolling: true,
      scrollMode: 'continuous',
      bufferRecords: 200,
      startDate: '',
      startTime: '',
      timeSpan: 2,
      timeSpanUnit: 'min',
      xDisplayScale: true,
      xDisplayGrid: true,
      xGridLines: 4,
      xMinorGridLines: 0,
      xGridColor: '#808080',
      yMode: 'automatic',
      yMinMode: 'actual',
      yMinValue: 0,
      yMinTag: '',
      yMaxMode: 'actual',
      yMaxValue: 100,
      yMaxTag: '',
      isolatedGraphing: false,
      isolationPct: 0,
      yDisplayScale: true,
      yDecimalPlaces: 0,
      yDisplayGrid: true,
      yGridLines: 4,
      yMinorGridLines: 0,
      yGridColor: '#808080',
      scaleMode: 'independent',
      scalePen: 1,
      scaleAsPercent: false,
      dataLogModel: '',
      pens: defaultPens(),
      minTag: '',
      maxTag: '',
      ...overrides
    };
  }

  function fillUnitSelect(id, selected) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.dataset.filled) {
      el.innerHTML = TIME_UNITS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
      el.dataset.filled = '1';
    }
    el.value = selected || el.value;
  }

  function scheduleTrendLivePreview() {
    if (window.state?.propsFormFill) return;
    if (trPreviewTimer) clearTimeout(trPreviewTimer);
    trPreviewTimer = setTimeout(() => {
      trPreviewTimer = null;
      if (!document.getElementById('trendDialog')?.open) return;
      const comp = readTrendForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readTrendForm, 'applyTrend');
    }, 80);
  }

  function syncTrendFields() {
    const xy = document.querySelector('input[name="trChartStyle"]:checked')?.value === 'xy';
    const xPen = document.getElementById('trXAxisPen');
    if (xPen) xPen.disabled = !xy;
    const onChange = document.querySelector('input[name="trUpdateMode"]:checked')?.value === 'onChange';
    ['trRefreshRate', 'trRefreshUnit'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = onChange;
    });
    ['trHeartbeat', 'trHeartbeatUnit', 'trDeadband'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = !onChange;
    });
    const allow = document.getElementById('trAllowScrolling')?.checked;
    const scrollMode = document.getElementById('trScrollMode');
    if (scrollMode) scrollMode.disabled = !allow;
    ['trStartDate', 'trStartTime'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = Boolean(allow);
    });
    const yMode = document.querySelector('input[name="trYMode"]:checked')?.value || 'automatic';
    const custom = yMode === 'custom';
    document.querySelectorAll('#trendDialog [data-tr-y-custom]').forEach((el) => {
      el.disabled = !custom;
    });
    const isolated = document.getElementById('trIsolated')?.checked;
    const isoPct = document.getElementById('trIsolationPct');
    if (isoPct) isoPct.disabled = !isolated;
    const scalePen = document.querySelector('input[name="trScaleMode"]:checked')?.value === 'pen';
    const scalePenSel = document.getElementById('trScalePen');
    if (scalePenSel) scalePenSel.disabled = !scalePen;
    const yScale = document.getElementById('trYDisplayScale')?.checked;
    const dec = document.getElementById('trYDecimalPlaces');
    if (dec) dec.disabled = !yScale;
    const yGrid = document.getElementById('trYDisplayGrid')?.checked;
    ['trYGridLines', 'trYMinorGrid', 'trYGridColor'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = !yGrid;
    });
    const xGrid = document.getElementById('trXDisplayGrid')?.checked;
    ['trXGridLines', 'trXMinorGrid', 'trXGridColor'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = !xGrid;
    });
  }

  function penRowHtml(pen) {
    const visClass = pen.visible ? 'tr-vis-on' : 'tr-vis-off';
    const visLabel = pen.visible ? 'On' : 'Off';
    return `<tr data-pen-index="${pen.index}" class="${trSelectedPens.has(pen.index) ? 'tr-pen-selected' : ''}">
      <td class="tr-pen-idx">${pen.index}</td>
      <td><input type="text" class="tr-pen-tag" data-pen="${pen.index}" value="${String(pen.tag || '').replace(/"/g, '&quot;')}" /></td>
      <td><input type="hidden" class="ft-color-input tr-pen-color" id="trPenColor${pen.index}" data-pen="${pen.index}" value="${pen.color}" /></td>
      <td><button type="button" class="tr-vis-btn ${visClass}" data-pen="${pen.index}">${visLabel}</button></td>
      <td><input type="number" class="tr-pen-width" data-pen="${pen.index}" min="1" max="20" value="${pen.width}" /></td>
      <td><select class="tr-pen-type" data-pen="${pen.index}">
        <option value="analog"${pen.type === 'analog' ? ' selected' : ''}>Analog</option>
        <option value="digital"${pen.type === 'digital' ? ' selected' : ''}>Digital</option>
      </select></td>
      <td><select class="tr-pen-style" data-pen="${pen.index}">
        <option value="solid"${pen.style === 'solid' ? ' selected' : ''}>Solid</option>
        <option value="dash"${pen.style === 'dash' ? ' selected' : ''}>Dash</option>
        <option value="dot"${pen.style === 'dot' ? ' selected' : ''}>Dot</option>
        <option value="dashDot"${pen.style === 'dashDot' ? ' selected' : ''}>DashDot</option>
        <option value="dashDotDot"${pen.style === 'dashDotDot' ? ' selected' : ''}>DashDotDot</option>
      </select></td>
      <td><select class="tr-pen-marker" data-pen="${pen.index}">
        <option value="none"${pen.marker === 'none' ? ' selected' : ''}>None</option>
        <option value="square"${pen.marker === 'square' ? ' selected' : ''}>Square</option>
        <option value="circle"${pen.marker === 'circle' ? ' selected' : ''}>Circle</option>
        <option value="diamond"${pen.marker === 'diamond' ? ' selected' : ''}>Diamond</option>
        <option value="triangle"${pen.marker === 'triangle' ? ' selected' : ''}>Triangle</option>
      </select></td>
      <td><input type="number" class="tr-pen-min" data-pen="${pen.index}" step="any" value="${pen.min}" /></td>
      <td><input type="number" class="tr-pen-max" data-pen="${pen.index}" step="any" value="${pen.max}" /></td>
      <td><input type="checkbox" class="tr-pen-link" data-pen="${pen.index}" ${pen.linkData ? 'checked' : ''} ${pen.tag ? '' : 'disabled'} /></td>
    </tr>`;
  }

  function readPensFromTable() {
    const rows = [...document.querySelectorAll('#trPenBody tr')];
    if (!rows.length) return defaultPens();
    return rows.map((row) => {
      const i = Number(row.dataset.penIndex);
      const tag = row.querySelector('.tr-pen-tag')?.value.trim() || '';
      return {
        index: i,
        tag,
        color: trGetColor(`trPenColor${i}`, PEN_COLORS[i - 1]),
        visible: row.querySelector('.tr-vis-btn')?.classList.contains('tr-vis-on'),
        width: Number(row.querySelector('.tr-pen-width')?.value) || 1,
        type: row.querySelector('.tr-pen-type')?.value || 'analog',
        style: row.querySelector('.tr-pen-style')?.value || 'solid',
        marker: row.querySelector('.tr-pen-marker')?.value || 'none',
        min: Number(row.querySelector('.tr-pen-min')?.value) || 0,
        max: Number(row.querySelector('.tr-pen-max')?.value) || 100,
        linkData: Boolean(row.querySelector('.tr-pen-link')?.checked)
      };
    });
  }

  function renderPenTable(pens) {
    const body = document.getElementById('trPenBody');
    if (!body) return;
    body.innerHTML = (pens?.length ? pens : defaultPens()).map(penRowHtml).join('');
    const dlg = document.getElementById('trendDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll?.(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    syncPenConnectionsFromTable();
  }

  function syncPenConnectionsFromTable() {
    const pens = readPensFromTable();
    pens.forEach((pen) => {
      const el = document.getElementById(`trPen${pen.index}Tag`);
      if (el && el !== document.activeElement) el.value = pen.tag || '';
      const link = document.querySelector(`.tr-pen-link[data-pen="${pen.index}"]`);
      if (link) link.disabled = !pen.tag;
    });
  }

  function syncTableFromConnections() {
    for (let i = 1; i <= 8; i++) {
      const tag = document.getElementById(`trPen${i}Tag`)?.value || '';
      const input = document.querySelector(`.tr-pen-tag[data-pen="${i}"]`);
      if (input && input !== document.activeElement) input.value = tag;
      const link = document.querySelector(`.tr-pen-link[data-pen="${i}"]`);
      if (link) link.disabled = !tag;
    }
  }

  function wirePenTable() {
    const body = document.getElementById('trPenBody');
    if (!body || body.dataset.wired === '1') return;
    body.dataset.wired = '1';
    body.addEventListener('click', (e) => {
      const vis = e.target.closest('.tr-vis-btn');
      if (vis) {
        vis.classList.toggle('tr-vis-on');
        vis.classList.toggle('tr-vis-off');
        vis.textContent = vis.classList.contains('tr-vis-on') ? 'On' : 'Off';
        scheduleTrendLivePreview();
        return;
      }
      const row = e.target.closest('tr');
      if (!row) return;
      const idx = Number(row.dataset.penIndex);
      if (e.ctrlKey || e.metaKey) {
        if (trSelectedPens.has(idx)) trSelectedPens.delete(idx);
        else trSelectedPens.add(idx);
      } else {
        trSelectedPens = new Set([idx]);
      }
      body.querySelectorAll('tr').forEach((r) => r.classList.toggle('tr-pen-selected', trSelectedPens.has(Number(r.dataset.penIndex))));
    });
    body.addEventListener('input', () => {
      syncPenConnectionsFromTable();
      scheduleTrendLivePreview();
    });
    body.addEventListener('change', () => {
      syncPenConnectionsFromTable();
      scheduleTrendLivePreview();
    });
  }

  function applyMultiEdit() {
    const vis = document.getElementById('trMultiVisible')?.value;
    const width = document.getElementById('trMultiWidth')?.value;
    const type = document.getElementById('trMultiType')?.value;
    const style = document.getElementById('trMultiStyle')?.value;
    const marker = document.getElementById('trMultiMarker')?.value;
    const min = document.getElementById('trMultiMin')?.value;
    const max = document.getElementById('trMultiMax')?.value;
    document.querySelectorAll('#trPenBody tr').forEach((row) => {
      const idx = Number(row.dataset.penIndex);
      if (!trSelectedPens.has(idx)) return;
      if (vis) {
        const btn = row.querySelector('.tr-vis-btn');
        const on = vis === 'on';
        btn.classList.toggle('tr-vis-on', on);
        btn.classList.toggle('tr-vis-off', !on);
        btn.textContent = on ? 'On' : 'Off';
      }
      if (width) row.querySelector('.tr-pen-width').value = width;
      if (type) row.querySelector('.tr-pen-type').value = type;
      if (style) row.querySelector('.tr-pen-style').value = style;
      if (marker) row.querySelector('.tr-pen-marker').value = marker;
      if (min !== '') row.querySelector('.tr-pen-min').value = min;
      if (max !== '') row.querySelector('.tr-pen-max').value = max;
    });
    scheduleTrendLivePreview();
  }

  function wireTools() {
    const dlg = document.getElementById('trendDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll?.(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    fillUnitSelect('trRefreshUnit', document.getElementById('trRefreshUnit')?.value);
    fillUnitSelect('trHeartbeatUnit', document.getElementById('trHeartbeatUnit')?.value);
    fillUnitSelect('trTimeSpanUnit', document.getElementById('trTimeSpanUnit')?.value);
    wirePenTable();
    document.querySelectorAll('#trendForm .ft-color-input').forEach((input) => {
      if (input.dataset.trPreviewWired === '1') return;
      input.dataset.trPreviewWired = '1';
      input.addEventListener('input', scheduleTrendLivePreview);
      input.addEventListener('change', scheduleTrendLivePreview);
    });
    syncTrendFields();
  }

  function presentTrendDialog() {
    const dialog = document.getElementById('trendDialog');
    if (!dialog) {
      window.setStatus('Trend Object Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    trDialogCommitted = false;
    dialog.classList.add('is-positioned');
    dialog.style.position = 'fixed';
    dialog.style.margin = '0';
    dialog.style.left = '24px';
    dialog.style.top = '28px';
    dialog.style.right = 'auto';
    dialog.style.bottom = 'auto';
    dialog.style.transform = 'none';
    dialog.style.zIndex = '30000';
    dialog.style.maxHeight = 'calc(100vh - 40px)';
    dialog.style.overflow = 'auto';
    try {
      dialog.showModal();
    } catch (err) {
      document.querySelectorAll('dialog[open]').forEach((other) => {
        if (other !== dialog) {
          try { other.close(); } catch (_) { /* ignore */ }
        }
      });
      try { dialog.showModal(); } catch (err2) {
        dialog.setAttribute('open', '');
        dialog.style.display = 'block';
        window.setStatus(`Opened Trend properties without modal: ${err2.message}`);
      }
    }
  }

  function fillFontDialog() {
    const fontList = document.getElementById('trFontList');
    const sizeList = document.getElementById('trFontSizeList');
    if (fontList && !fontList.dataset.filled) {
      const names = new Set(TREND_FONTS);
      try { document.fonts?.forEach((f) => { if (f.family) names.add(f.family); }); } catch (_) { /* ignore */ }
      fontList.innerHTML = [...names].sort((a, b) => a.localeCompare(b))
        .map((n) => `<option value="${n}">${n}</option>`).join('');
      fontList.dataset.filled = '1';
    }
    if (sizeList && !sizeList.dataset.filled) {
      sizeList.innerHTML = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72]
        .map((n) => `<option value="${n}">${n}</option>`).join('');
      sizeList.dataset.filled = '1';
    }
    if (fontList) fontList.value = trFontState.family;
    if (sizeList) sizeList.value = String(trFontState.size);
    document.querySelectorAll('input[name="trFontStyle"]').forEach((el) => {
      el.checked = el.value === trFontState.style;
    });
    const strike = document.getElementById('trFontStrike');
    const under = document.getElementById('trFontUnderline');
    if (strike) strike.checked = Boolean(trFontState.strikeout);
    if (under) under.checked = Boolean(trFontState.underline);
  }

  function openFontDialog() {
    fillFontDialog();
    const dlg = document.getElementById('trFontDialog');
    if (!dlg) return;
    dlg.style.zIndex = '40000';
    try { if (!dlg.open) dlg.showModal(); } catch (_) {
      dlg.setAttribute('open', '');
      dlg.style.display = 'block';
    }
  }

  function acceptFontDialog() {
    trFontState = {
      family: document.getElementById('trFontList')?.value || 'Arial Unicode MS',
      style: document.querySelector('input[name="trFontStyle"]:checked')?.value || 'regular',
      size: Number(document.getElementById('trFontSizeList')?.value) || 8,
      strikeout: Boolean(document.getElementById('trFontStrike')?.checked),
      underline: Boolean(document.getElementById('trFontUnderline')?.checked)
    };
    try { document.getElementById('trFontDialog')?.close(); } catch (_) { /* ignore */ }
    scheduleTrendLivePreview();
  }

  function fillTrendForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillUnitSelect('trRefreshUnit');
      fillUnitSelect('trHeartbeatUnit');
      fillUnitSelect('trTimeSpanUnit');
      document.querySelectorAll('input[name="trChartStyle"]').forEach((el) => {
        el.checked = el.value === (comp.chartStyle || 'standard');
      });
      document.getElementById('trXAxisPen').value = String(comp.xAxisPen || 1);
      document.querySelectorAll('input[name="trUpdateMode"]').forEach((el) => {
        el.checked = el.value === (comp.updateMode || 'automatic');
      });
      document.getElementById('trRefreshRate').value = comp.refreshRate ?? 1;
      document.getElementById('trRefreshUnit').value = comp.refreshUnit || 's';
      document.getElementById('trHeartbeat').value = comp.heartbeat ?? 1;
      document.getElementById('trHeartbeatUnit').value = comp.heartbeatUnit || 'min';
      document.getElementById('trDeadband').value = comp.deadband ?? 0;
      document.getElementById('trTimeFormat').value = comp.timeFormat || 'system';
      document.getElementById('trChartRadix').value = comp.chartRadix || 'decimal';
      document.getElementById('trDataPointConnection').value = comp.dataPointConnection || 'connect';
      document.getElementById('trDisplayMs').checked = Boolean(comp.displayMilliseconds);
      document.getElementById('trDisplayPenIcons').checked = comp.displayPenIcons !== false;
      trSetColor('trBackColor', comp.backColor || '#000000');
      document.getElementById('trUseGradient').checked = Boolean(comp.useGradientStyle);
      trSetColor('trTextColor', comp.textColor || '#000000');
      trFontState = {
        family: comp.fontFamily || 'Arial Unicode MS',
        style: comp.fontStyle || 'regular',
        size: comp.fontSize ?? 8,
        strikeout: Boolean(comp.strikeout),
        underline: Boolean(comp.underline)
      };
      document.getElementById('trAllowScrolling').checked = comp.allowScrolling !== false;
      document.getElementById('trScrollMode').value = comp.scrollMode || 'continuous';
      document.getElementById('trBuffer').value = comp.bufferRecords ?? 200;
      document.getElementById('trStartDate').value = comp.startDate || '';
      document.getElementById('trStartTime').value = comp.startTime || '';
      document.getElementById('trTimeSpan').value = comp.timeSpan ?? 2;
      document.getElementById('trTimeSpanUnit').value = comp.timeSpanUnit || 'min';
      document.getElementById('trXDisplayScale').checked = comp.xDisplayScale !== false;
      document.getElementById('trXDisplayGrid').checked = comp.xDisplayGrid !== false;
      document.getElementById('trXGridLines').value = comp.xGridLines ?? 4;
      document.getElementById('trXMinorGrid').value = comp.xMinorGridLines ?? 0;
      trSetColor('trXGridColor', comp.xGridColor || '#808080');
      document.querySelectorAll('input[name="trYMode"]').forEach((el) => {
        el.checked = el.value === (comp.yMode || 'automatic');
      });
      document.querySelectorAll('input[name="trYMinMode"]').forEach((el) => {
        el.checked = el.value === (comp.yMinMode || 'actual');
      });
      document.getElementById('trYMinValue').value = comp.yMinValue ?? 0;
      document.getElementById('trYMinTag').value = comp.yMinTag || '';
      document.querySelectorAll('input[name="trYMaxMode"]').forEach((el) => {
        el.checked = el.value === (comp.yMaxMode || 'actual');
      });
      document.getElementById('trYMaxValue').value = comp.yMaxValue ?? 100;
      document.getElementById('trYMaxTag').value = comp.yMaxTag || '';
      document.getElementById('trIsolated').checked = Boolean(comp.isolatedGraphing);
      document.getElementById('trIsolationPct').value = comp.isolationPct ?? 0;
      document.getElementById('trYDisplayScale').checked = comp.yDisplayScale !== false;
      document.getElementById('trYDecimalPlaces').value = comp.yDecimalPlaces ?? 0;
      document.getElementById('trYDisplayGrid').checked = comp.yDisplayGrid !== false;
      document.getElementById('trYGridLines').value = comp.yGridLines ?? 4;
      document.getElementById('trYMinorGrid').value = comp.yMinorGridLines ?? 0;
      trSetColor('trYGridColor', comp.yGridColor || '#808080');
      document.querySelectorAll('input[name="trScaleMode"]').forEach((el) => {
        el.checked = el.value === (comp.scaleMode || 'independent');
      });
      document.getElementById('trScalePen').value = String(comp.scalePen || 1);
      document.getElementById('trScalePercent').checked = Boolean(comp.scaleAsPercent);
      document.getElementById('trDataLogModel').value = comp.dataLogModel || '';
      document.getElementById('trHeight').value = comp.height ?? 180;
      document.getElementById('trWidth').value = comp.width ?? 240;
      document.getElementById('trTop').value = comp.top ?? 16;
      document.getElementById('trLeft').value = comp.left ?? 16;
      document.getElementById('trName').value = comp.name || 'Trend1';
      document.getElementById('trVisible').checked = comp.visible !== false;
      document.getElementById('trFocusHighlight').checked = comp.focusHighlight !== false;
      document.getElementById('trKeyNavigation').checked = comp.keyNavigation !== false;
      const pens = (comp.pens?.length ? comp.pens : defaultPens()).map((p, i) => ({
        ...defaultPens()[i],
        ...p,
        index: i + 1
      }));
      trSelectedPens = new Set();
      renderPenTable(pens);
      for (let i = 1; i <= 8; i++) {
        const el = document.getElementById(`trPen${i}Tag`);
        if (el) el.value = pens[i - 1]?.tag || '';
      }
      document.getElementById('trMinTag').value = comp.minTag || comp.yMinTag || '';
      document.getElementById('trMaxTag').value = comp.maxTag || comp.yMaxTag || '';
      syncTrendFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readTrendForm() {
    const pens = readPensFromTable();
    const minTag = document.getElementById('trMinTag')?.value.trim() || '';
    const maxTag = document.getElementById('trMaxTag')?.value.trim() || '';
    return {
      type: 'Trend',
      name: document.getElementById('trName')?.value.trim() || 'Trend1',
      left: Number(document.getElementById('trLeft')?.value) || 0,
      top: Number(document.getElementById('trTop')?.value) || 0,
      width: Number(document.getElementById('trWidth')?.value) || 240,
      height: Number(document.getElementById('trHeight')?.value) || 180,
      visible: document.getElementById('trVisible')?.checked !== false,
      focusHighlight: document.getElementById('trFocusHighlight')?.checked !== false,
      keyNavigation: document.getElementById('trKeyNavigation')?.checked !== false,
      chartStyle: document.querySelector('input[name="trChartStyle"]:checked')?.value || 'standard',
      xAxisPen: Number(document.getElementById('trXAxisPen')?.value) || 1,
      updateMode: document.querySelector('input[name="trUpdateMode"]:checked')?.value || 'automatic',
      refreshRate: Number(document.getElementById('trRefreshRate')?.value) || 1,
      refreshUnit: document.getElementById('trRefreshUnit')?.value || 's',
      heartbeat: Number(document.getElementById('trHeartbeat')?.value) || 1,
      heartbeatUnit: document.getElementById('trHeartbeatUnit')?.value || 'min',
      deadband: Number(document.getElementById('trDeadband')?.value) || 0,
      timeFormat: document.getElementById('trTimeFormat')?.value || 'system',
      chartRadix: document.getElementById('trChartRadix')?.value || 'decimal',
      dataPointConnection: document.getElementById('trDataPointConnection')?.value || 'connect',
      displayMilliseconds: Boolean(document.getElementById('trDisplayMs')?.checked),
      displayPenIcons: document.getElementById('trDisplayPenIcons')?.checked !== false,
      backColor: trGetColor('trBackColor', '#000000'),
      useGradientStyle: Boolean(document.getElementById('trUseGradient')?.checked),
      textColor: trGetColor('trTextColor', '#000000'),
      fontFamily: trFontState.family,
      fontSize: trFontState.size,
      fontStyle: trFontState.style,
      strikeout: trFontState.strikeout,
      underline: trFontState.underline,
      allowScrolling: document.getElementById('trAllowScrolling')?.checked !== false,
      scrollMode: document.getElementById('trScrollMode')?.value || 'continuous',
      bufferRecords: Number(document.getElementById('trBuffer')?.value) || 200,
      startDate: document.getElementById('trStartDate')?.value || '',
      startTime: document.getElementById('trStartTime')?.value || '',
      timeSpan: Number(document.getElementById('trTimeSpan')?.value) || 2,
      timeSpanUnit: document.getElementById('trTimeSpanUnit')?.value || 'min',
      xDisplayScale: document.getElementById('trXDisplayScale')?.checked !== false,
      xDisplayGrid: document.getElementById('trXDisplayGrid')?.checked !== false,
      xGridLines: Number(document.getElementById('trXGridLines')?.value) || 0,
      xMinorGridLines: Number(document.getElementById('trXMinorGrid')?.value) || 0,
      xGridColor: trGetColor('trXGridColor', '#808080'),
      yMode: document.querySelector('input[name="trYMode"]:checked')?.value || 'automatic',
      yMinMode: document.querySelector('input[name="trYMinMode"]:checked')?.value || 'actual',
      yMinValue: Number(document.getElementById('trYMinValue')?.value) || 0,
      yMinTag: document.getElementById('trYMinTag')?.value.trim() || minTag,
      yMaxMode: document.querySelector('input[name="trYMaxMode"]:checked')?.value || 'actual',
      yMaxValue: Number(document.getElementById('trYMaxValue')?.value) || 100,
      yMaxTag: document.getElementById('trYMaxTag')?.value.trim() || maxTag,
      isolatedGraphing: Boolean(document.getElementById('trIsolated')?.checked),
      isolationPct: Number(document.getElementById('trIsolationPct')?.value) || 0,
      yDisplayScale: document.getElementById('trYDisplayScale')?.checked !== false,
      yDecimalPlaces: Number(document.getElementById('trYDecimalPlaces')?.value) || 0,
      yDisplayGrid: document.getElementById('trYDisplayGrid')?.checked !== false,
      yGridLines: Number(document.getElementById('trYGridLines')?.value) || 0,
      yMinorGridLines: Number(document.getElementById('trYMinorGrid')?.value) || 0,
      yGridColor: trGetColor('trYGridColor', '#808080'),
      scaleMode: document.querySelector('input[name="trScaleMode"]:checked')?.value || 'independent',
      scalePen: Number(document.getElementById('trScalePen')?.value) || 1,
      scaleAsPercent: Boolean(document.getElementById('trScalePercent')?.checked),
      dataLogModel: document.getElementById('trDataLogModel')?.value || '',
      pens,
      minTag,
      maxTag
    };
  }

  async function showTrendDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Trend');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initTrendDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultTrendComponent({
        name: nextTrendName(canvas?.components),
        ...overrides
      });
      fillTrendForm(comp);
      window.resetPropsDialogState('trend', readTrendForm, 'applyTrend');
      switchTab('general');
      wireTools();
      presentTrendDialog();
      const previewComp = readTrendForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readTrendForm, 'applyTrend');
    } catch (err) {
      window.setStatus(`Trend properties error: ${err.message}`);
    }
  }

  async function applyTrend() {
    const comp = readTrendForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readTrendForm, 'applyTrend');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveTrend(e) {
    e.preventDefault();
    const comp = readTrendForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    trDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('trendDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function initTrendDialog() {
    const form = document.getElementById('trendForm');
    if (!form || form.dataset.trWired === '1') return;
    fillUnitSelect('trRefreshUnit', 's');
    fillUnitSelect('trHeartbeatUnit', 'min');
    fillUnitSelect('trTimeSpanUnit', 'min');
    form.addEventListener('submit', (e) => saveTrend(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyTrend')?.addEventListener('click', () => {
      applyTrend().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleTrendLivePreview();
      window.flushPropsApplyButton?.(readTrendForm, 'applyTrend');
    });
    form.addEventListener('change', () => {
      syncTrendFields();
      scheduleTrendLivePreview();
      window.flushPropsApplyButton?.(readTrendForm, 'applyTrend');
    });
    document.getElementById('cancelTrend')?.addEventListener('click', () => {
      if (!trDialogCommitted) window.revertPropsDialogPreview?.();
      trDialogCommitted = true;
      document.getElementById('trendDialog')?.close();
    });
    document.getElementById('trendDialog')?.addEventListener('close', () => {
      if (trPreviewTimer) {
        clearTimeout(trPreviewTimer);
        trPreviewTimer = null;
      }
      try { document.getElementById('trFontDialog')?.close(); } catch (_) { /* ignore */ }
      if (!trDialogCommitted) window.revertPropsDialogPreview?.();
      trDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpTrend')?.addEventListener('click', () => {
      alert('Trend plots tag values over time. Configure pens, axes, and display options. Pen tags are optional until runtime.');
    });
    document.querySelectorAll('#trendDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.trTab));
    });
    document.getElementById('trFontBtn')?.addEventListener('click', openFontDialog);
    document.getElementById('trFontOk')?.addEventListener('click', acceptFontDialog);
    document.getElementById('trFontCancel')?.addEventListener('click', () => {
      try { document.getElementById('trFontDialog')?.close(); } catch (_) { /* ignore */ }
    });
    document.getElementById('trClearPenSel')?.addEventListener('click', () => {
      trSelectedPens = new Set();
      document.querySelectorAll('#trPenBody tr').forEach((r) => r.classList.remove('tr-pen-selected'));
    });
    document.getElementById('trApplyPens')?.addEventListener('click', applyMultiEdit);
    document.querySelectorAll('#trendForm [id^="trPen"][id$="Tag"]').forEach((el) => {
      el.addEventListener('input', syncTableFromConnections);
      el.addEventListener('change', syncTableFromConnections);
    });
    form.dataset.trWired = '1';
  }

  window.StudioTrend = {
    initTrendDialog,
    presentTrendDialog,
    scheduleTrendLivePreview,
    showTrendDialog,
    fillTrendForm,
    readTrendForm,
    switchTrendTab: switchTab,
    wireTrendTools: wireTools,
    nextTrendName,
    defaultTrendComponent,
    applyTrend
  };
})();
