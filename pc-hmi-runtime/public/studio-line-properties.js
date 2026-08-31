/** Line property dialog — FactoryTalk View style (General / Common tabs). */
(function () {
  const S = window.StudioPropsShared;
  let linePreviewTimer = null;

  function isNewLineEdit() {
    return window.state?.propsDialog?.editIndex == null;
  }

  function scheduleLineLivePreview() {
    if (window.state?.propsFormFill) return;
    if (linePreviewTimer) clearTimeout(linePreviewTimer);
    linePreviewTimer = setTimeout(() => {
      linePreviewTimer = null;
      const comp = readLinePropertiesForm();
      if (isNewLineEdit()) {
        window.updateLineStudioPreview?.(comp);
      } else {
        window.hideFreehandStudioPreview?.();
        S.previewShape(comp, readLinePropertiesForm, 'applyLineProperties');
      }
      window.flushPropsApplyButton?.(readLinePropertiesForm, 'applyLineProperties');
    }, 100);
  }

  function notifyLineFormChange() {
    scheduleLineLivePreview();
    window.flushPropsApplyButton?.(readLinePropertiesForm, 'applyLineProperties');
  }

  function wireColorInputs() {
    S.wireColorInputs('#linePropertiesForm', 'lnColorWired', notifyLineFormChange);
  }

  function switchTab(tabId) {
    S.switchDialogTab('linePropertiesDialog', 'lnTab', 'lnTabPanel', tabId);
  }

  function syncColorFields() {
    const fore = document.getElementById('lnForeColor');
    const back = document.getElementById('lnBackColor');
    const useFore = document.getElementById('lnUseForeColor');
    const useBack = document.getElementById('lnUseBackColor');
    const solid = document.getElementById('lnBackStyle')?.value === 'solid';
    if (fore) fore.disabled = !useFore?.checked;
    if (useBack) useBack.disabled = !solid;
    if (!solid && useBack) useBack.checked = false;
    if (back) back.disabled = !useBack?.checked || !solid;
  }

  function wireTools() {
    const dialog = document.getElementById('linePropertiesDialog');
    S.wireColorPicker(dialog);
    wireColorInputs();
    syncColorFields();
    S.wireColorPicker(dialog);
  }

  function fillLinePropertiesForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    const w = Number(comp.width) || 156;
    const h = Number(comp.height) || 12;
    const x1 = comp.x1 != null ? Number(comp.x1) : 0;
    const y1 = comp.y1 != null ? Number(comp.y1) : 0;
    const x2 = comp.x2 != null ? Number(comp.x2) : w;
    const y2 = comp.y2 != null ? Number(comp.y2) : h;
    try {
      document.getElementById('lnLineStyle').value = comp.lineStyle || 'solid';
      document.getElementById('lnBackStyle').value = comp.backStyle === 'transparent' ? 'transparent' : 'solid';
      document.getElementById('lnUseForeColor').checked = comp.useForeColor !== false;
      S.setColorFieldValue('lnForeColor', comp.foreColor || '#808080');
      document.getElementById('lnUseBackColor').checked = comp.useBackColor === true && comp.backStyle !== 'transparent';
      S.setColorFieldValue('lnBackColor', comp.backColor || '#c0c0c0');
      document.getElementById('lnLineWidth').value = comp.lineWidth ?? 1;
      document.getElementById('lnHeight').value = h;
      document.getElementById('lnWidth').value = w;
      document.getElementById('lnTop').value = comp.top ?? 0;
      document.getElementById('lnLeft').value = comp.left ?? 0;
      document.getElementById('lnName').value = comp.name || 'Line1';
      document.getElementById('lnVisible').checked = comp.visible !== false;
      document.getElementById('lnX1').value = String(x1);
      document.getElementById('lnY1').value = String(y1);
      document.getElementById('lnX2').value = String(x2);
      document.getElementById('lnY2').value = String(y2);
      document.getElementById('lnOrigWidth').value = String(w);
      document.getElementById('lnOrigHeight').value = String(h);
      syncColorFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readLinePropertiesForm() {
    const backStyle = document.getElementById('lnBackStyle').value;
    const norm = window.FtColorPicker?.normalizeColor || ((v) => v);
    const width = Number(document.getElementById('lnWidth').value) || 1;
    const height = Number(document.getElementById('lnHeight').value) || 1;
    const origW = Number(document.getElementById('lnOrigWidth').value) || width;
    const origH = Number(document.getElementById('lnOrigHeight').value) || height;
    let x1 = Number(document.getElementById('lnX1').value);
    let y1 = Number(document.getElementById('lnY1').value);
    let x2 = Number(document.getElementById('lnX2').value);
    let y2 = Number(document.getElementById('lnY2').value);
    if (!Number.isFinite(x1)) x1 = 0;
    if (!Number.isFinite(y1)) y1 = 0;
    if (!Number.isFinite(x2)) x2 = width;
    if (!Number.isFinite(y2)) y2 = height;
    if (origW > 0 && origH > 0 && (width !== origW || height !== origH)) {
      x1 *= width / origW;
      y1 *= height / origH;
      x2 *= width / origW;
      y2 *= height / origH;
    }
    return {
      type: 'Line',
      name: document.getElementById('lnName').value.trim() || 'Line1',
      left: Number(document.getElementById('lnLeft').value) || 0,
      top: Number(document.getElementById('lnTop').value) || 0,
      width,
      height,
      visible: document.getElementById('lnVisible').checked,
      lineStyle: document.getElementById('lnLineStyle').value,
      backStyle,
      useForeColor: document.getElementById('lnUseForeColor').checked,
      foreColor: norm(S.getColorFieldValue('lnForeColor')),
      useBackColor: backStyle === 'solid' && document.getElementById('lnUseBackColor').checked,
      backColor: norm(S.getColorFieldValue('lnBackColor')),
      lineWidth: Number(document.getElementById('lnLineWidth').value) || 0,
      x1,
      y1,
      x2,
      y2
    };
  }

  function rememberLineEndpoints(comp) {
    document.getElementById('lnOrigWidth').value = String(comp.width);
    document.getElementById('lnOrigHeight').value = String(comp.height);
    document.getElementById('lnX1').value = String(comp.x1);
    document.getElementById('lnY1').value = String(comp.y1);
    document.getElementById('lnX2').value = String(comp.x2);
    document.getElementById('lnY2').value = String(comp.y2);
  }

  async function applyLineProperties() {
    const comp = readLinePropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    rememberLineEndpoints(comp);
    window.hideFreehandStudioPreview?.();
    window.commitPropsSnapshot(readLinePropertiesForm, 'applyLineProperties');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveLineProperties() {
    const comp = readLinePropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    window.hideFreehandStudioPreview?.();
    document.getElementById('linePropertiesDialog')?.close();
    window.clearPropsDialogState();
    window.scheduleRefreshCanvasEditOverlay?.();
    window.setStatus(`Saved ${comp.name}`);
  }

  function initLinePropertiesDialog() {
    const form = document.getElementById('linePropertiesForm');
    if (!form || form.dataset.lnWired === '1') return;
    form.dataset.lnWired = '1';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      saveLineProperties().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('applyLineProperties')?.addEventListener('click', () => {
      applyLineProperties().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', notifyLineFormChange);
    form.addEventListener('change', () => {
      syncColorFields();
      notifyLineFormChange();
    });
    document.getElementById('cancelLineProperties')?.addEventListener('click', () => {
      window.revertPropsDialogPreview?.();
      window.hideFreehandStudioPreview?.();
      document.getElementById('linePropertiesDialog')?.close();
      window.clearPropsDialogState();
    });
    document.getElementById('helpLineProperties')?.addEventListener('click', () => {
      alert('Line Properties define line style, back style, colors, and line width — matching FactoryTalk View line objects.');
    });
    document.querySelectorAll('#linePropertiesDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.lnTab));
    });
  }

  function openLinePropertiesDialog(comp, ref, editIndex) {
    window.flushDeferredDialogInits?.();
    initLinePropertiesDialog();
    fillLinePropertiesForm(comp);
    wireTools();
    const idx = S.resolvedEditIndex(comp, ref, editIndex);
    window.resetPropsDialogState('line', readLinePropertiesForm, 'applyLineProperties', idx, ref);
    switchTab('general');
    window.setTemplateEditStatus?.(comp.name, ref);
    window.showCanvasPropsDialog?.(document.getElementById('linePropertiesDialog'));
    const previewComp = readLinePropertiesForm();
    if (idx == null) {
      window.updateLineStudioPreview?.(previewComp);
    } else {
      window.hideFreehandStudioPreview?.();
      S.previewShape(previewComp, readLinePropertiesForm, 'applyLineProperties');
    }
    window.flushPropsApplyButton?.(readLinePropertiesForm, 'applyLineProperties');
  }

  window.StudioLineProperties = {
    fillLinePropertiesForm,
    readLinePropertiesForm,
    openLinePropertiesDialog,
    initLinePropertiesDialog
  };
})();
