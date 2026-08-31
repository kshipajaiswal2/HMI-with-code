/** Arc property dialog — FactoryTalk View style (General / Common tabs). */
(function () {
  const S = window.StudioPropsShared;
  let arcPreviewTimer = null;

  function scheduleArcLivePreview() {
    if (window.state?.propsFormFill) return;
    if (arcPreviewTimer) clearTimeout(arcPreviewTimer);
    arcPreviewTimer = setTimeout(() => {
      arcPreviewTimer = null;
      S.previewShape(readArcPropertiesForm(), readArcPropertiesForm, 'applyArcProperties');
    }, 100);
  }

  function notifyArcFormChange() {
    scheduleArcLivePreview();
    window.flushPropsApplyButton?.(readArcPropertiesForm, 'applyArcProperties');
  }

  function wireColorInputs() {
    S.wireColorInputs('#arcPropertiesForm', 'apColorWired', notifyArcFormChange);
  }

  function switchTab(tabId) {
    S.switchDialogTab('arcPropertiesDialog', 'apTab', 'apTabPanel', tabId);
  }

  function syncGradientFields() {
    S.syncGradientExtras('apBackStyle', 'apGradientExtras');
  }

  function syncPatternFields() {
    const pattern = document.getElementById('apPatternStyle')?.value || 'none';
    if (pattern !== 'none') {
      document.getElementById('apUsePatternColor').checked = true;
    }
    syncColorFields();
  }

  function syncColorFields() {
    const pattern = document.getElementById('apPatternStyle')?.value || 'none';
    document.getElementById('apPatternColor').disabled = pattern === 'none';
    document.getElementById('apEndColor').disabled = document.getElementById('apBackStyle')?.value !== 'gradient';
    syncGradientFields();
  }

  function wireTools() {
    const dialog = document.getElementById('arcPropertiesDialog');
    S.wireColorPicker(dialog);
    wireColorInputs();
    syncColorFields();
    S.wireColorPicker(dialog);
  }

  function fillArcPropertiesForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    const c = {
      lineStyle: 'solid',
      backStyle: 'transparent',
      patternStyle: 'none',
      foreColor: '#808080',
      backColor: '#c0c0c0',
      patternColor: '#ffffff',
      useForeColor: true,
      useBackColor: false,
      usePatternColor: false,
      lineWidth: 1,
      width: 202,
      height: 194,
      left: 0,
      top: 0,
      visible: true,
      sweepAngle: 360,
      startAngle: 0,
      ...comp
    };
    try {
      document.getElementById('apLineStyle').value = c.lineStyle || 'solid';
      document.getElementById('apBackStyle').value = c.backStyle || 'solid';
      document.getElementById('apPatternStyle').value = c.patternStyle || 'none';
      S.setColorFieldValue('apForeColor', c.foreColor || '#808080');
      S.setColorFieldValue('apBackColor', c.backColor || '#c0c0c0');
      S.setColorFieldValue('apPatternColor', c.patternColor || '#ffffff');
      document.getElementById('apUsePatternColor').checked = Boolean(c.usePatternColor) || (c.patternStyle && c.patternStyle !== 'none');
      S.setColorFieldValue('apEndColor', c.endColor || '#e8e8e8');
      document.getElementById('apGradientStop').value = c.gradientStop ?? 95;
      document.getElementById('apGradientDir').value = c.gradientShadingStyle || c.gradientDirection || 'gradientHorizontalFromRight';
      document.getElementById('apLineWidth').value = c.lineWidth ?? 1;
      document.getElementById('apHeight').value = c.height ?? 194;
      document.getElementById('apWidth').value = c.width ?? 202;
      document.getElementById('apTop').value = c.top ?? 0;
      document.getElementById('apLeft').value = c.left ?? 0;
      document.getElementById('apName').value = c.name || 'Arc1';
      document.getElementById('apVisible').checked = c.visible !== false;
      document.getElementById('apStartAngle').value = c.startAngle ?? 0;
      document.getElementById('apSweepAngle').value = c.sweepAngle ?? 360;
      syncPatternFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readArcPropertiesForm() {
    const backStyle = document.getElementById('apBackStyle').value;
    const patternStyle = document.getElementById('apPatternStyle').value;
    const norm = window.FtColorPicker?.normalizeColor || ((v) => v);
    const comp = {
      type: 'Arc',
      name: document.getElementById('apName').value.trim() || 'Arc1',
      left: Number(document.getElementById('apLeft').value) || 0,
      top: Number(document.getElementById('apTop').value) || 0,
      width: Number(document.getElementById('apWidth').value) || 64,
      height: Number(document.getElementById('apHeight').value) || 64,
      visible: document.getElementById('apVisible').checked,
      lineStyle: document.getElementById('apLineStyle').value,
      backStyle,
      patternStyle,
      useForeColor: true,
      foreColor: norm(S.getColorFieldValue('apForeColor')),
      useBackColor: backStyle !== 'transparent',
      backColor: norm(S.getColorFieldValue('apBackColor')),
      usePatternColor: patternStyle !== 'none' && document.getElementById('apUsePatternColor').checked,
      patternColor: norm(S.getColorFieldValue('apPatternColor')),
      lineWidth: Number(document.getElementById('apLineWidth').value) || 0,
      startAngle: Number.isFinite(Number(document.getElementById('apStartAngle')?.value))
        ? Number(document.getElementById('apStartAngle').value)
        : 0,
      sweepAngle: Number.isFinite(Number(document.getElementById('apSweepAngle')?.value))
        ? Number(document.getElementById('apSweepAngle').value)
        : 360
    };
    if (backStyle === 'gradient') {
      comp.endColor = norm(S.getColorFieldValue('apEndColor'));
      comp.gradientStop = Number(document.getElementById('apGradientStop').value) || 95;
      comp.gradientShadingStyle = document.getElementById('apGradientDir').value;
    }
    return comp;
  }

  async function applyArcProperties() {
    const comp = readArcPropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readArcPropertiesForm, 'applyArcProperties');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveArcProperties(e) {
    e.preventDefault();
    const comp = readArcPropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    document.getElementById('arcPropertiesDialog').close();
    window.clearPropsDialogState();
    window.scheduleRefreshCanvasEditOverlay?.();
    window.setStatus(`Saved ${comp.name}`);
  }

  function initArcPropertiesDialog() {
    const form = document.getElementById('arcPropertiesForm');
    if (!form || form.dataset.apWired === '1') return;
    form.dataset.apWired = '1';
    S.fillPatternSelect('apPatternStyle', 'apFilled');
    form.addEventListener('submit', (e) => saveArcProperties(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyArcProperties')?.addEventListener('click', () => {
      applyArcProperties().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleArcLivePreview();
      window.flushPropsApplyButton?.(readArcPropertiesForm, 'applyArcProperties');
    });
    form.addEventListener('change', () => {
      syncPatternFields();
      scheduleArcLivePreview();
      window.flushPropsApplyButton?.(readArcPropertiesForm, 'applyArcProperties');
    });
    document.getElementById('cancelArcProperties')?.addEventListener('click', () => {
      window.revertPropsDialogPreview?.();
      document.getElementById('arcPropertiesDialog')?.close();
      window.clearPropsDialogState();
    });
    document.getElementById('helpArcProperties')?.addEventListener('click', () => {
      alert('Arc Properties define line style, fill, pattern, and line width — matching FactoryTalk View arc objects.');
    });
    document.querySelectorAll('#arcPropertiesDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.apTab));
    });
  }

  function openArcPropertiesDialog(comp, ref, editIndex) {
    window.flushDeferredDialogInits?.();
    initArcPropertiesDialog();
    fillArcPropertiesForm(comp);
    wireTools();
    const idx = S.resolvedEditIndex(comp, ref, editIndex);
    window.resetPropsDialogState('arc', readArcPropertiesForm, 'applyArcProperties', idx, ref);
    switchTab('general');
    window.setTemplateEditStatus?.(comp.name, ref);
    window.showCanvasPropsDialog?.(document.getElementById('arcPropertiesDialog'));
    window.flushPropsApplyButton?.(readArcPropertiesForm, 'applyArcProperties');
    scheduleArcLivePreview();
  }

  window.StudioArcProperties = {
    fillArcPropertiesForm,
    readArcPropertiesForm,
    openArcPropertiesDialog,
    initArcPropertiesDialog
  };
})();
