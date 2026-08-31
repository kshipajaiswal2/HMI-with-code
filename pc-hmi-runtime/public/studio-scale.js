/** Scale property dialog — FactoryTalk View parity */
(function () {
  let scPreviewTimer = null;
  let scDialogCommitted = false;

  function scSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) {
      window.StudioPropsShared.setColorFieldValue(id, raw);
    } else {
      const el = document.getElementById(id);
      if (el) el.value = raw;
    }
  }

  function scGetColor(id, fallback) {
    if (window.StudioPropsShared?.getColorFieldValue) {
      return window.StudioPropsShared.getColorFieldValue(id) || fallback;
    }
    return document.getElementById(id)?.value || fallback;
  }

  function switchTab(tabId) {
    document.querySelectorAll('#scaleDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.scTab === tabId);
    });
    document.querySelectorAll('#scaleDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.scTabPanel === tabId);
    });
  }

  function nextScaleName(components) {
    const n = (components || []).filter((c) => c.type === 'Scale').length + 1;
    return `Scale${n}`;
  }

  function fillTickSelects() {
    const major = document.getElementById('scMajorTicks');
    const minor = document.getElementById('scMinorTicks');
    if (major && major.dataset.scFilled !== '1') {
      major.dataset.scFilled = '1';
      const opts = [];
      for (let i = 2; i <= 20; i++) opts.push(`<option value="${i}"${i === 3 ? ' selected' : ''}>${i}</option>`);
      major.innerHTML = opts.join('');
    }
    if (minor && minor.dataset.scFilled !== '1') {
      minor.dataset.scFilled = '1';
      const opts = [];
      for (let i = 0; i <= 20; i++) opts.push(`<option value="${i}"${i === 1 ? ' selected' : ''}>${i}</option>`);
      minor.innerHTML = opts.join('');
    }
  }

  function defaultScaleComponent(overrides = {}) {
    return {
      type: 'Scale',
      name: 'Scale1',
      left: 16,
      top: 16,
      width: 184,
      height: 101,
      visible: true,
      borderStyle: 'none',
      borderWidth: 1,
      borderUsesBackColor: true,
      lineStyle: 'solid',
      lineWidth: 1,
      backStyle: 'transparent',
      backColor: '#001C38',
      useBackColor: false,
      borderColor: '#001C38',
      useBorderColor: true,
      foreColor: '#001C38',
      useForeColor: true,
      blink: false,
      tickDirection: 'right',
      majorTicks: 3,
      minorTicks: 1,
      ...overrides
    };
  }

  function dashForLineStyle(lineStyle, lineWidth) {
    const w = Math.max(1, Number(lineWidth) || 1);
    if (lineStyle === 'dash') return `${w * 8},${w * 4}`;
    if (lineStyle === 'dot') return `${w},${w * 3}`;
    if (lineStyle === 'dashDot') return `${w * 8},${w * 4},${w},${w * 4}`;
    if (lineStyle === 'dashDotDot') return `${w * 8},${w * 4},${w},${w * 4},${w},${w * 4}`;
    return '';
  }

  function paintScaleTicks(svg, w, h, opts) {
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const lineStyle = opts.lineStyle || 'solid';
    const lineWidth = Number(opts.lineWidth) || 1;
    if (lineStyle === 'none' || lineWidth <= 0) return;
    const ns = 'http://www.w3.org/2000/svg';
    const color = opts.color || '#000000';
    const dash = dashForLineStyle(lineStyle, lineWidth);
    const addLine = (x1, y1, x2, y2) => {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', String(x1));
      line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', String(lineWidth));
      line.setAttribute('stroke-linecap', 'butt');
      if (dash) line.setAttribute('stroke-dasharray', dash);
      svg.appendChild(line);
    };
    const dir = opts.tickDirection || 'right';
    const majors = Math.max(2, Number(opts.majorTicks) || 3);
    const minors = Math.max(0, Number(opts.minorTicks) || 0);
    const pad = Math.max(1, lineWidth / 2);
    if (dir === 'right' || dir === 'left') {
      const xBase = dir === 'right' ? pad : w - pad;
      const sign = dir === 'right' ? 1 : -1;
      const inner = Math.max(1, h - 2 * pad);
      const majorLen = Math.max(4, (w - 2 * pad) * 0.5);
      const minorLen = majorLen * 0.45;
      addLine(xBase, pad, xBase, h - pad);
      for (let i = 0; i < majors; i++) {
        const y = pad + (i / (majors - 1)) * inner;
        addLine(xBase, y, xBase + sign * majorLen, y);
        if (i < majors - 1 && minors > 0) {
          for (let m = 1; m <= minors; m++) {
            const yt = pad + ((i + m / (minors + 1)) / (majors - 1)) * inner;
            addLine(xBase, yt, xBase + sign * minorLen, yt);
          }
        }
      }
    } else {
      const yBase = dir === 'down' ? pad : h - pad;
      const sign = dir === 'down' ? 1 : -1;
      const inner = Math.max(1, w - 2 * pad);
      const majorLen = Math.max(4, (h - 2 * pad) * 0.5);
      const minorLen = majorLen * 0.45;
      addLine(pad, yBase, w - pad, yBase);
      for (let i = 0; i < majors; i++) {
        const x = pad + (i / (majors - 1)) * inner;
        addLine(x, yBase, x, yBase + sign * majorLen);
        if (i < majors - 1 && minors > 0) {
          for (let m = 1; m <= minors; m++) {
            const xt = pad + ((i + m / (minors + 1)) / (majors - 1)) * inner;
            addLine(xt, yBase, xt, yBase + sign * minorLen);
          }
        }
      }
    }
  }

  function refreshTickPreview() {
    const svg = document.getElementById('scTickPreview');
    if (!svg) return;
    const dir = document.querySelector('input[name="scTickDirection"]:checked')?.value || 'right';
    paintScaleTicks(svg, 88, 88, {
      tickDirection: dir,
      majorTicks: Number(document.getElementById('scMajorTicks')?.value) || 3,
      minorTicks: Number(document.getElementById('scMinorTicks')?.value) || 1,
      lineStyle: document.getElementById('scLineStyle')?.value || 'solid',
      lineWidth: 1,
      color: '#000000'
    });
  }

  function scheduleScaleLivePreview() {
    if (window.state?.propsFormFill) return;
    if (scPreviewTimer) clearTimeout(scPreviewTimer);
    scPreviewTimer = setTimeout(() => {
      scPreviewTimer = null;
      if (!document.getElementById('scaleDialog')?.open) return;
      refreshTickPreview();
      const comp = readScaleForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readScaleForm, 'applyScale');
    }, 80);
  }

  function wireTools() {
    fillTickSelects();
    const dlg = document.getElementById('scaleDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    document.querySelectorAll('#scaleForm .ft-color-input').forEach((input) => {
      if (input.dataset.scPreviewWired === '1') return;
      input.dataset.scPreviewWired = '1';
      input.addEventListener('input', scheduleScaleLivePreview);
      input.addEventListener('change', scheduleScaleLivePreview);
    });
    refreshTickPreview();
  }

  function presentScaleDialog() {
    const dialog = document.getElementById('scaleDialog');
    if (!dialog) {
      window.setStatus('Scale Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    scDialogCommitted = false;
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
        window.setStatus(`Opened Scale properties without modal: ${err2.message}`);
      }
    }
  }

  function fillScaleForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillTickSelects();
      document.getElementById('scBorderStyle').value = comp.borderStyle || 'none';
      document.getElementById('scBorderWidth').value = comp.borderWidth ?? 1;
      const lineStyle = ['none', 'solid', 'dash', 'dot', 'dashDot', 'dashDotDot'].includes(comp.lineStyle)
        ? comp.lineStyle : 'solid';
      document.getElementById('scLineStyle').value = lineStyle;
      document.getElementById('scLineWidth').value = comp.lineWidth ?? 1;
      const backStyle = ['solid', 'transparent', 'gradient'].includes(comp.backStyle) ? comp.backStyle : 'transparent';
      document.getElementById('scBackStyle').value = backStyle;
      document.getElementById('scBorderUsesBackColor').checked = comp.borderUsesBackColor !== false;
      scSetColor('scBackColor', comp.backColor || '#001C38');
      scSetColor('scBorderColor', comp.borderColor || '#001C38');
      scSetColor('scForeColor', comp.foreColor || '#001C38');
      document.getElementById('scBlink').checked = Boolean(comp.blink);
      const dir = ['up', 'down', 'left', 'right'].includes(comp.tickDirection) ? comp.tickDirection : 'right';
      document.querySelectorAll('input[name="scTickDirection"]').forEach((el) => {
        el.checked = el.value === dir;
      });
      document.getElementById('scMajorTicks').value = String(comp.majorTicks ?? 3);
      document.getElementById('scMinorTicks').value = String(comp.minorTicks ?? 1);
      document.getElementById('scHeight').value = comp.height ?? 101;
      document.getElementById('scWidth').value = comp.width ?? 184;
      document.getElementById('scTop').value = comp.top ?? 16;
      document.getElementById('scLeft').value = comp.left ?? 16;
      document.getElementById('scName').value = comp.name || 'Scale1';
      document.getElementById('scVisible').checked = comp.visible !== false;
      refreshTickPreview();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readScaleForm() {
    const backStyle = document.getElementById('scBackStyle').value;
    return {
      type: 'Scale',
      name: document.getElementById('scName').value.trim() || 'Scale1',
      left: Number(document.getElementById('scLeft').value) || 0,
      top: Number(document.getElementById('scTop').value) || 0,
      width: Number(document.getElementById('scWidth').value) || 184,
      height: Number(document.getElementById('scHeight').value) || 101,
      visible: document.getElementById('scVisible').checked,
      borderStyle: document.getElementById('scBorderStyle').value,
      borderWidth: Number(document.getElementById('scBorderWidth').value ?? 1),
      borderUsesBackColor: document.getElementById('scBorderUsesBackColor').checked,
      lineStyle: document.getElementById('scLineStyle').value,
      lineWidth: Number(document.getElementById('scLineWidth').value ?? 1),
      backStyle,
      backColor: scGetColor('scBackColor', '#001C38'),
      useBackColor: backStyle !== 'transparent',
      borderColor: scGetColor('scBorderColor', '#001C38'),
      useBorderColor: true,
      foreColor: scGetColor('scForeColor', '#001C38'),
      useForeColor: true,
      blink: document.getElementById('scBlink').checked,
      tickDirection: document.querySelector('input[name="scTickDirection"]:checked')?.value || 'right',
      majorTicks: Number(document.getElementById('scMajorTicks').value) || 3,
      minorTicks: Number(document.getElementById('scMinorTicks').value) || 0
    };
  }

  async function showScaleDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Scale');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initScaleDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultScaleComponent({
        name: nextScaleName(canvas?.components),
        ...overrides
      });
      fillScaleForm(comp);
      window.resetPropsDialogState('scale', readScaleForm, 'applyScale');
      switchTab('general');
      wireTools();
      presentScaleDialog();
      const previewComp = readScaleForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readScaleForm, 'applyScale');
    } catch (err) {
      window.setStatus(`Scale properties error: ${err.message}`);
    }
  }

  async function applyScale() {
    const comp = readScaleForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readScaleForm, 'applyScale');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveScale(e) {
    e.preventDefault();
    const comp = readScaleForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    scDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('scaleDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function initScaleDialog() {
    const form = document.getElementById('scaleForm');
    if (!form || form.dataset.scWired === '1') return;
    fillTickSelects();
    form.addEventListener('submit', (e) => saveScale(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyScale')?.addEventListener('click', () => {
      applyScale().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleScaleLivePreview();
      window.flushPropsApplyButton?.(readScaleForm, 'applyScale');
    });
    form.addEventListener('change', () => {
      scheduleScaleLivePreview();
      window.flushPropsApplyButton?.(readScaleForm, 'applyScale');
    });
    document.getElementById('cancelScale')?.addEventListener('click', () => {
      if (!scDialogCommitted) window.revertPropsDialogPreview?.();
      scDialogCommitted = true;
      document.getElementById('scaleDialog')?.close();
    });
    document.getElementById('scaleDialog')?.addEventListener('close', () => {
      if (scPreviewTimer) {
        clearTimeout(scPreviewTimer);
        scPreviewTimer = null;
      }
      if (!scDialogCommitted) window.revertPropsDialogPreview?.();
      scDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpScale')?.addEventListener('click', () => {
      alert('Scale draws major and minor tick marks along one edge of the object. Use Tick direction to choose which way the ticks point.');
    });
    document.querySelectorAll('#scaleDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.scTab));
    });
    document.querySelectorAll('input[name="scTickDirection"]').forEach((el) => {
      el.addEventListener('change', () => {
        refreshTickPreview();
        scheduleScaleLivePreview();
      });
    });
    form.dataset.scWired = '1';
  }

  window.StudioScale = {
    initScaleDialog,
    presentScaleDialog,
    scheduleScaleLivePreview,
    showScaleDialog,
    fillScaleForm,
    readScaleForm,
    switchScaleTab: switchTab,
    wireScaleTools: wireTools,
    nextScaleName,
    defaultScaleComponent,
    applyScale
  };
})();
