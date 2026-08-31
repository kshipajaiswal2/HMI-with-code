/** End Button property dialog — FactoryTalk View parity */
(function () {
  let enbPreviewTimer = null;
  let enbDialogCommitted = false;

  const KEY_BUTTON_TYPES = new Set([
    'BackspaceButton', 'EndButton', 'EnterButton', 'HomeButton',
    'MoveLeftButton', 'MoveRightButton', 'MoveDownButton', 'MoveUpButton',
    'PageDownButton', 'PageUpButton'
  ]);
  const INPUT_TYPES = new Set([
    'StringInputEnable', 'NumericInputEnable', 'NumericInputCursorPoint'
  ]);

  function switchTab(tabId) {
    document.querySelectorAll('#endButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.enbTab === tabId);
    });
    document.querySelectorAll('#endButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.enbTabPanel === tabId);
    });
  }

  function enbGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function enbSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextEndButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'EndButton').length + 1;
    return `EndButton${n}`;
  }

  function defaultEndButtonComponent(overrides = {}) {
    return {
      type: 'EndButton',
      name: 'EndButton1',
      caption: '',
      label: '',
      left: 16,
      top: 16,
      width: 80,
      height: 80,
      visible: true,
      borderStyle: 'line',
      borderWidth: 1,
      borderUsesBackColor: false,
      backStyle: 'solid',
      patternStyle: 'none',
      shape: 'rectangle',
      useBackColor: true,
      backColor: '#001C38',
      useBorderColor: true,
      borderColor: '#001C38',
      usePatternColor: true,
      patternColor: '#ffffff',
      useHighlightColor: true,
      highlightColor: '#0066cc',
      blink: false,
      horizontalMargin: 0,
      verticalMargin: 0,
      audio: true,
      sendPressTo: 'objectWithFocus',
      linkedObject: '',
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      alignment: 'middleCenter',
      wordWrap: true,
      useCaptionColor: false,
      captionColor: '#ffffff',
      foreColor: '#ffffff',
      useForeColor: false,
      captionBackStyle: 'transparent',
      useCaptionBackColor: false,
      captionBackColor: '#001C38',
      captionBlink: false,
      image: 'End',
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      useImageColor: false,
      imageColor: '#ffffff',
      useImageBackColor: false,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: false,
      ...overrides
    };
  }

  function scheduleEndLivePreview() {
    if (window.state?.propsFormFill) return;
    if (enbPreviewTimer) clearTimeout(enbPreviewTimer);
    enbPreviewTimer = setTimeout(() => {
      enbPreviewTimer = null;
      if (!document.getElementById('endButtonDialog')?.open) return;
      const comp = readEndButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readEndButtonForm, 'applyEndButton');
    }, 80);
  }

  function syncEndFields() {
    const capColor = document.getElementById('enbCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('enbUseCaptionColor')?.checked;
    const capBack = document.getElementById('enbCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('enbUseCaptionBackColor')?.checked
      || document.getElementById('enbCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('enbImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('enbUseImageColor')?.checked;
    const imgBack = document.getElementById('enbImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('enbUseImageBackColor')?.checked
      || document.getElementById('enbImageBackStyle')?.value !== 'solid';
    const linked = document.getElementById('enbSendPressTo')?.value === 'linkedObject';
    const linkedInput = document.getElementById('enbLinkedObject');
    const browse = document.getElementById('enbBrowseLinkedObject');
    if (linkedInput) linkedInput.disabled = !linked;
    if (browse) browse.disabled = !linked;
  }

  function wireEndButtonTools() {
    const dlg = document.getElementById('endButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('enbPatternStyle', 'enbFilled');
    document.querySelectorAll('#endButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.enbPreviewWired === '1') return;
      input.dataset.enbPreviewWired = '1';
      input.addEventListener('input', scheduleEndLivePreview);
      input.addEventListener('change', scheduleEndLivePreview);
    });
    syncEndFields();
  }

  function presentEndButtonDialog() {
    const dialog = document.getElementById('endButtonDialog');
    if (!dialog) {
      window.setStatus('End Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    enbDialogCommitted = false;
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
        window.setStatus(`Opened End Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillEndButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('enbPatternStyle', 'enbFilled');
      document.getElementById('enbBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('enbBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('enbBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('enbPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('enbShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('enbBorderUsesBackColor').checked = Boolean(comp.borderUsesBackColor);
      enbSetColor('enbBackColor', comp.backColor || '#001C38');
      enbSetColor('enbBorderColor', comp.borderColor || '#001C38');
      enbSetColor('enbPatternColor', comp.patternColor || '#ffffff');
      enbSetColor('enbHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('enbBlink').checked = Boolean(comp.blink);
      document.getElementById('enbHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('enbVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('enbAudio').checked = comp.audio !== false;
      const sendTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
      document.getElementById('enbSendPressTo').value = sendTo;
      document.getElementById('enbLinkedObject').value = comp.linkedObject || '';
      document.getElementById('enbCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('enbFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('enbFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('enbBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('enbItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('enbUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('enbUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      enbSetColor('enbCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('enbUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      enbSetColor('enbCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('enbCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('enbWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('enbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#endButtonForm input[name="enbAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('enbImage').value = comp.image || 'End';
      document.getElementById('enbImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('enbUseImageColor').checked = Boolean(comp.useImageColor);
      enbSetColor('enbImageColor', comp.imageColor || '#ffffff');
      document.getElementById('enbUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      enbSetColor('enbImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('enbImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('enbImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#endButtonForm input[name="enbImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('enbHeight').value = comp.height ?? 80;
      document.getElementById('enbWidth').value = comp.width ?? 80;
      document.getElementById('enbTop').value = comp.top ?? 16;
      document.getElementById('enbLeft').value = comp.left ?? 16;
      document.getElementById('enbName').value = comp.name || 'EndButton1';
      document.getElementById('enbVisible').checked = comp.visible !== false;
      syncEndFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readEndButtonForm() {
    const caption = document.getElementById('enbCaption')?.value || '';
    const captionColor = enbGetColor('enbCaptionColor');
    const sendPressTo = document.getElementById('enbSendPressTo')?.value || 'objectWithFocus';
    return {
      type: 'EndButton',
      name: document.getElementById('enbName')?.value.trim() || 'EndButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('enbLeft')?.value) || 0,
      top: Number(document.getElementById('enbTop')?.value) || 0,
      width: Number(document.getElementById('enbWidth')?.value) || 80,
      height: Number(document.getElementById('enbHeight')?.value) || 80,
      visible: document.getElementById('enbVisible')?.checked !== false,
      borderStyle: document.getElementById('enbBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('enbBorderWidth')?.value) || 1,
      borderUsesBackColor: Boolean(document.getElementById('enbBorderUsesBackColor')?.checked),
      backStyle: document.getElementById('enbBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('enbPatternStyle')?.value || 'none',
      shape: document.getElementById('enbShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: enbGetColor('enbBackColor'),
      useBorderColor: true,
      borderColor: enbGetColor('enbBorderColor'),
      usePatternColor: true,
      patternColor: enbGetColor('enbPatternColor'),
      useHighlightColor: true,
      highlightColor: enbGetColor('enbHighlightColor'),
      blink: Boolean(document.getElementById('enbBlink')?.checked),
      horizontalMargin: Number(document.getElementById('enbHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('enbVerticalMargin')?.value) || 0,
      audio: document.getElementById('enbAudio')?.checked !== false,
      sendPressTo,
      linkedObject: document.getElementById('enbLinkedObject')?.value.trim() || '',
      fontFamily: document.getElementById('enbFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('enbFontSize')?.value) || 10,
      bold: document.getElementById('enbBold')?.classList.contains('active'),
      italic: document.getElementById('enbItalic')?.classList.contains('active'),
      underline: document.getElementById('enbUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('enbUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('enbUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('enbUseCaptionBackColor')?.checked),
      captionBackColor: enbGetColor('enbCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('enbCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('enbCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('enbWordWrap')?.checked !== false,
      alignment: document.querySelector('#endButtonForm input[name="enbAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('enbImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('enbImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#endButtonForm input[name="enbImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('enbUseImageColor')?.checked),
      imageColor: enbGetColor('enbImageColor'),
      useImageBackColor: Boolean(document.getElementById('enbUseImageBackColor')?.checked),
      imageBackColor: enbGetColor('enbImageBackColor'),
      imageBlink: Boolean(document.getElementById('enbImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('enbImageScaled')?.checked)
    };
  }

  async function showEndButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the End Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initEndButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultEndButtonComponent({
        name: nextEndButtonName(canvas?.components),
        ...overrides
      });
      fillEndButtonForm(comp);
      window.resetPropsDialogState('end', readEndButtonForm, 'applyEndButton');
      switchTab('general');
      wireEndButtonTools();
      presentEndButtonDialog();
      const previewComp = readEndButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readEndButtonForm, 'applyEndButton');
    } catch (err) {
      window.setStatus(`End Button properties error: ${err.message}`);
    }
  }

  async function applyEndButton() {
    const comp = readEndButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readEndButtonForm, 'applyEndButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveEndButton(e) {
    e.preventDefault();
    const comp = readEndButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    enbDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('endButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertEnbCaptionText(text) {
    const area = document.getElementById('enbCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleEndLivePreview();
  }

  function insertEnbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertEnbCaptionText(tag);
    });
  }

  function hideEnbInsertVariableMenu() {
    document.getElementById('enbInsertVariableMenu')?.classList.add('hidden');
  }

  function listBrowsableObjects() {
    const selfName = document.getElementById('enbName')?.value.trim();
    const seen = new Set();
    const items = [];
    const add = (comp) => {
      const name = comp?.name;
      if (!name || name === selfName || seen.has(name)) return;
      if (KEY_BUTTON_TYPES.has(comp.type)) return;
      seen.add(name);
      items.push({ name, type: comp.type || '' });
    };
    const entries = window.state?.canvasEditCache?.editComponents || [];
    for (const entry of entries) add(entry?.comp || entry);
    const raw = window.state?.canvasEditCache?.raw?.components || [];
    for (const comp of raw) add(comp);
    items.sort((a, b) => {
      const at = INPUT_TYPES.has(a.type) ? 0 : 1;
      const bt = INPUT_TYPES.has(b.type) ? 0 : 1;
      if (at !== bt) return at - bt;
      return a.name.localeCompare(b.name);
    });
    return items;
  }

  function closeObjectBrowser() {
    const dlg = document.getElementById('enbObjectBrowserDialog');
    if (!dlg) return;
    try { dlg.close(); } catch (_) {
      dlg.removeAttribute('open');
      dlg.style.display = 'none';
    }
  }

  function openObjectBrowser() {
    const dlg = document.getElementById('enbObjectBrowserDialog');
    const list = document.getElementById('enbObjectBrowserList');
    if (!dlg || !list) return;
    const items = listBrowsableObjects();
    const current = document.getElementById('enbLinkedObject')?.value.trim() || '';
    list.innerHTML = items.length
      ? items.map((item) => `<option value="${String(item.name).replace(/"/g, '&quot;')}">${item.name}</option>`).join('')
      : '<option value="" disabled>No objects on this display</option>';
    if (current) list.value = current;
    else if (items.length) list.selectedIndex = 0;
    dlg.classList.add('is-positioned');
    dlg.style.position = 'fixed';
    dlg.style.margin = '0';
    dlg.style.left = '120px';
    dlg.style.top = '120px';
    dlg.style.zIndex = '40000';
    try {
      if (!dlg.open) dlg.showModal();
    } catch (_) {
      dlg.setAttribute('open', '');
      dlg.style.display = 'block';
    }
  }

  function acceptObjectBrowser() {
    const list = document.getElementById('enbObjectBrowserList');
    const name = list?.value?.trim();
    if (name) {
      document.getElementById('enbLinkedObject').value = name;
      scheduleEndLivePreview();
      window.flushPropsApplyButton?.(readEndButtonForm, 'applyEndButton');
    }
    closeObjectBrowser();
  }

  function initEndButtonDialog() {
    const form = document.getElementById('endButtonForm');
    if (!form || form.dataset.enbWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('enbPatternStyle', 'enbFilled');
    form.addEventListener('submit', (e) => saveEndButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyEndButton')?.addEventListener('click', () => {
      applyEndButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleEndLivePreview();
      window.flushPropsApplyButton?.(readEndButtonForm, 'applyEndButton');
    });
    form.addEventListener('change', () => {
      syncEndFields();
      scheduleEndLivePreview();
      window.flushPropsApplyButton?.(readEndButtonForm, 'applyEndButton');
    });
    document.getElementById('cancelEndButton')?.addEventListener('click', () => {
      if (!enbDialogCommitted) window.revertPropsDialogPreview?.();
      enbDialogCommitted = true;
      document.getElementById('endButtonDialog')?.close();
    });
    document.getElementById('endButtonDialog')?.addEventListener('close', () => {
      if (enbPreviewTimer) {
        clearTimeout(enbPreviewTimer);
        enbPreviewTimer = null;
      }
      hideEnbInsertVariableMenu();
      closeObjectBrowser();
      if (!enbDialogCommitted) window.revertPropsDialogPreview?.();
      enbDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpEndButton')?.addEventListener('click', () => {
      alert('End Button sends End to the object with focus, or to a linked input object.');
    });
    document.querySelectorAll('#endButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideEnbInsertVariableMenu();
        switchTab(tab.dataset.enbTab);
      });
    });
    document.getElementById('enbBrowseLinkedObject')?.addEventListener('click', () => {
      if (document.getElementById('enbBrowseLinkedObject')?.disabled) return;
      openObjectBrowser();
    });
    document.getElementById('enbObjectBrowserOk')?.addEventListener('click', acceptObjectBrowser);
    document.getElementById('enbObjectBrowserList')?.addEventListener('dblclick', acceptObjectBrowser);
    document.getElementById('enbObjectBrowserCancel')?.addEventListener('click', closeObjectBrowser);
    document.getElementById('enbObjectBrowserHelp')?.addEventListener('click', () => {
      alert('Select a display object to receive the End press. Input objects are listed first when present.');
    });
    document.getElementById('enbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('enbImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('enbImage').value = fileName;
          scheduleEndLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('enbInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('enbInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('enbInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.enbVar;
      if (!kind) return;
      hideEnbInsertVariableMenu();
      if (kind === 'timedate') insertEnbCaptionText('{#dt}');
      else insertEnbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#endButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideEnbInsertVariableMenu();
    });
    document.getElementById('enbShape')?.addEventListener('change', () => {
      if (document.getElementById('enbShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('enbWidth')?.value) || 0;
      const h = Number(document.getElementById('enbHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('enbWidth').value = String(size);
      document.getElementById('enbHeight').value = String(size);
    });
    for (const id of ['enbBold', 'enbItalic', 'enbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleEndLivePreview();
      });
    }
    form.dataset.enbWired = '1';
  }

  window.StudioEndButton = {
    initEndButtonDialog,
    presentEndButtonDialog,
    scheduleEndLivePreview,
    showEndButtonDialog,
    fillEndButtonForm,
    readEndButtonForm,
    switchEndButtonTab: switchTab,
    wireEndButtonTools,
    nextEndButtonName,
    defaultEndButtonComponent,
    applyEndButton
  };
})();
