/** Ellipse property dialog — FactoryTalk View style (General / Common tabs). */
(function () {
  const S = window.StudioPropsShared;
  let ellipsePreviewTimer = null;

  function scheduleEllipseLivePreview() {
    if (window.state?.propsFormFill) return;
    if (ellipsePreviewTimer) clearTimeout(ellipsePreviewTimer);
    ellipsePreviewTimer = setTimeout(() => {
      ellipsePreviewTimer = null;
      S.previewShape(readEllipsePropertiesForm(), readEllipsePropertiesForm, 'applyEllipseProperties');
    }, 100);
  }

  function notifyEllipseFormChange() {
    scheduleEllipseLivePreview();
    window.flushPropsApplyButton?.(readEllipsePropertiesForm, 'applyEllipseProperties');
  }

  function wireColorInputs() {
    S.wireColorInputs('#ellipsePropertiesForm', 'epColorWired', notifyEllipseFormChange);
  }

  function switchTab(tabId) {
    S.switchDialogTab('ellipsePropertiesDialog', 'epTab', 'epTabPanel', tabId);
  }

  function syncGradientFields() {
    S.syncGradientExtras('epBackStyle', 'epGradientExtras');
  }

  function syncPatternFields() {
    const pattern = document.getElementById('epPatternStyle')?.value || 'none';
    if (pattern !== 'none') {
      document.getElementById('epUsePatternColor').checked = true;
    }
    syncColorFields();
  }

  function syncColorFields() {
    const pattern = document.getElementById('epPatternStyle')?.value || 'none';
    document.getElementById('epPatternColor').disabled = pattern === 'none';
    document.getElementById('epEndColor').disabled = document.getElementById('epBackStyle')?.value !== 'gradient';
    syncGradientFields();
  }

  function wireTools() {
    const dialog = document.getElementById('ellipsePropertiesDialog');
    S.wireColorPicker(dialog);
    wireColorInputs();
    syncColorFields();
    S.wireColorPicker(dialog);
  }

  function fillEllipsePropertiesForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    const c = {
      lineStyle: 'solid',
      backStyle: 'solid',
      patternStyle: 'none',
      foreColor: '#808080',
      backColor: '#808080',
      patternColor: '#ffffff',
      useForeColor: true,
      useBackColor: true,
      usePatternColor: false,
      lineWidth: 1,
      width: 121,
      height: 116,
      left: 0,
      top: 0,
      visible: true,
      ...comp
    };
    try {
      const title = document.getElementById('ellipsePropertiesTitle');
      if (title) title.textContent = 'Ellipse Properties';
      document.getElementById('epLineStyle').value = c.lineStyle || 'solid';
      document.getElementById('epBackStyle').value = c.backStyle || 'solid';
      document.getElementById('epPatternStyle').value = c.patternStyle || 'none';
      S.setColorFieldValue('epForeColor', c.foreColor || '#808080');
      S.setColorFieldValue('epBackColor', c.backColor || '#808080');
      S.setColorFieldValue('epPatternColor', c.patternColor || '#ffffff');
      document.getElementById('epUsePatternColor').checked = Boolean(c.usePatternColor) || (c.patternStyle && c.patternStyle !== 'none');
      S.setColorFieldValue('epEndColor', c.endColor || '#e8e8e8');
      document.getElementById('epGradientStop').value = c.gradientStop ?? 95;
      document.getElementById('epGradientDir').value = c.gradientShadingStyle || c.gradientDirection || 'gradientHorizontalFromRight';
      document.getElementById('epLineWidth').value = c.lineWidth ?? 1;
      document.getElementById('epHeight').value = c.height ?? 116;
      document.getElementById('epWidth').value = c.width ?? 121;
      document.getElementById('epTop').value = c.top ?? 0;
      document.getElementById('epLeft').value = c.left ?? 0;
      document.getElementById('epName').value = c.name || 'Ellipse1';
      document.getElementById('epVisible').checked = c.visible !== false;
      syncPatternFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readEllipsePropertiesForm() {
    const backStyle = document.getElementById('epBackStyle').value;
    const patternStyle = document.getElementById('epPatternStyle').value;
    const norm = window.FtColorPicker?.normalizeColor || ((v) => v);
    const comp = {
      type: 'Ellipse',
      name: document.getElementById('epName').value.trim() || 'Ellipse1',
      left: Number(document.getElementById('epLeft').value) || 0,
      top: Number(document.getElementById('epTop').value) || 0,
      width: Number(document.getElementById('epWidth').value) || 64,
      height: Number(document.getElementById('epHeight').value) || 64,
      visible: document.getElementById('epVisible').checked,
      lineStyle: document.getElementById('epLineStyle').value,
      backStyle,
      patternStyle,
      useForeColor: true,
      foreColor: norm(S.getColorFieldValue('epForeColor')),
      useBackColor: backStyle !== 'transparent',
      backColor: norm(S.getColorFieldValue('epBackColor')),
      usePatternColor: patternStyle !== 'none' && document.getElementById('epUsePatternColor').checked,
      patternColor: norm(S.getColorFieldValue('epPatternColor')),
      lineWidth: Number(document.getElementById('epLineWidth').value) || 0
    };
    if (backStyle === 'gradient') {
      comp.endColor = norm(S.getColorFieldValue('epEndColor'));
      comp.gradientStop = Number(document.getElementById('epGradientStop').value) || 95;
      comp.gradientShadingStyle = document.getElementById('epGradientDir').value;
    }
    return comp;
  }

  async function applyEllipseProperties() {
    const comp = readEllipsePropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readEllipsePropertiesForm, 'applyEllipseProperties');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveEllipseProperties(e) {
    e.preventDefault();
    const comp = readEllipsePropertiesForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    document.getElementById('ellipsePropertiesDialog').close();
    window.clearPropsDialogState();
    window.activateSelectTool?.(`Saved ${comp.name}`);
  }

  function initEllipsePropertiesDialog() {
    const form = document.getElementById('ellipsePropertiesForm');
    if (!form || form.dataset.epWired === '1') return;
    form.dataset.epWired = '1';
    S.fillPatternSelect('epPatternStyle', 'epFilled');
    form.addEventListener('submit', (e) => saveEllipseProperties(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyEllipseProperties')?.addEventListener('click', () => {
      applyEllipseProperties().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleEllipseLivePreview();
      window.flushPropsApplyButton?.(readEllipsePropertiesForm, 'applyEllipseProperties');
    });
    form.addEventListener('change', () => {
      syncPatternFields();
      scheduleEllipseLivePreview();
      window.flushPropsApplyButton?.(readEllipsePropertiesForm, 'applyEllipseProperties');
    });
    document.getElementById('cancelEllipseProperties')?.addEventListener('click', () => {
      window.revertPropsDialogPreview?.();
      document.getElementById('ellipsePropertiesDialog')?.close();
      window.clearPropsDialogState();
      window.activateSelectTool?.();
    });
    document.getElementById('ellipsePropertiesDialog')?.addEventListener('close', () => {
      window.activateSelectTool?.();
    });
    document.getElementById('helpEllipseProperties')?.addEventListener('click', () => {
      alert('Ellipse Properties define line style, fill, pattern, and line width.');
    });
    document.querySelectorAll('#ellipsePropertiesDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.epTab));
    });
  }

  function openEllipsePropertiesDialog(comp, ref, editIndex) {
    window.flushDeferredDialogInits?.();
    initEllipsePropertiesDialog();
    fillEllipsePropertiesForm(comp);
    wireTools();
    const idx = S.resolvedEditIndex(comp, ref, editIndex);
    window.resetPropsDialogState('ellipse', readEllipsePropertiesForm, 'applyEllipseProperties', idx, ref);
    switchTab('general');
    window.setTemplateEditStatus?.(comp.name, ref);
    window.showCanvasPropsDialog?.(document.getElementById('ellipsePropertiesDialog'));
    window.flushPropsApplyButton?.(readEllipsePropertiesForm, 'applyEllipseProperties');
    if (idx == null) scheduleEllipseLivePreview();
  }

  window.StudioEllipseProperties = {
    fillEllipsePropertiesForm,
    readEllipsePropertiesForm,
    openEllipsePropertiesDialog,
    initEllipsePropertiesDialog
  };
})();
