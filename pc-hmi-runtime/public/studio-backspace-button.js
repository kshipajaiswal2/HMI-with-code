/** Backspace Button property dialog — FactoryTalk View parity */
(function () {
  let bsbPreviewTimer = null;
  let bsbDialogCommitted = false;

  const KEY_BUTTON_TYPES = new Set([
    'BackspaceButton', 'EndButton', 'EnterButton', 'HomeButton',
    'MoveLeftButton', 'MoveRightButton', 'MoveDownButton', 'MoveUpButton',
    'PageDownButton', 'PageUpButton'
  ]);
  const INPUT_TYPES = new Set([
    'StringInputEnable', 'NumericInputEnable', 'NumericInputCursorPoint'
  ]);

  function switchTab(tabId) {
    document.querySelectorAll('#backspaceButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.bsbTab === tabId);
    });
    document.querySelectorAll('#backspaceButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.bsbTabPanel === tabId);
    });
  }

  function bsbGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function bsbSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextBackspaceButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'BackspaceButton').length + 1;
    return `BackspaceButton${n}`;
  }

  function defaultBackspaceButtonComponent(overrides = {}) {
    return {
      type: 'BackspaceButton',
      name: 'BackspaceButton1',
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
      image: 'Backspace',
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

  function scheduleBackspaceLivePreview() {
    if (window.state?.propsFormFill) return;
    if (bsbPreviewTimer) clearTimeout(bsbPreviewTimer);
    bsbPreviewTimer = setTimeout(() => {
      bsbPreviewTimer = null;
      if (!document.getElementById('backspaceButtonDialog')?.open) return;
      const comp = readBackspaceButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readBackspaceButtonForm, 'applyBackspaceButton');
    }, 80);
  }

  function syncBackspaceFields() {
    const capColor = document.getElementById('bsbCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('bsbUseCaptionColor')?.checked;
    const capBack = document.getElementById('bsbCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('bsbUseCaptionBackColor')?.checked
      || document.getElementById('bsbCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('bsbImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('bsbUseImageColor')?.checked;
    const imgBack = document.getElementById('bsbImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('bsbUseImageBackColor')?.checked
      || document.getElementById('bsbImageBackStyle')?.value !== 'solid';
    const linked = document.getElementById('bsbSendPressTo')?.value === 'linkedObject';
    const linkedInput = document.getElementById('bsbLinkedObject');
    const browse = document.getElementById('bsbBrowseLinkedObject');
    if (linkedInput) linkedInput.disabled = !linked;
    if (browse) browse.disabled = !linked;
  }

  function wireBackspaceButtonTools() {
    const dlg = document.getElementById('backspaceButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('bsbPatternStyle', 'bsbFilled');
    document.querySelectorAll('#backspaceButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.bsbPreviewWired === '1') return;
      input.dataset.bsbPreviewWired = '1';
      input.addEventListener('input', scheduleBackspaceLivePreview);
      input.addEventListener('change', scheduleBackspaceLivePreview);
    });
    syncBackspaceFields();
  }

  function presentBackspaceButtonDialog() {
    const dialog = document.getElementById('backspaceButtonDialog');
    if (!dialog) {
      window.setStatus('Backspace Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    bsbDialogCommitted = false;
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
        window.setStatus(`Opened Backspace Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillBackspaceButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('bsbPatternStyle', 'bsbFilled');
      document.getElementById('bsbBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('bsbBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('bsbBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('bsbPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('bsbShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('bsbBorderUsesBackColor').checked = Boolean(comp.borderUsesBackColor);
      bsbSetColor('bsbBackColor', comp.backColor || '#001C38');
      bsbSetColor('bsbBorderColor', comp.borderColor || '#001C38');
      bsbSetColor('bsbPatternColor', comp.patternColor || '#ffffff');
      bsbSetColor('bsbHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('bsbBlink').checked = Boolean(comp.blink);
      document.getElementById('bsbHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('bsbVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('bsbAudio').checked = comp.audio !== false;
      const sendTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
      document.getElementById('bsbSendPressTo').value = sendTo;
      document.getElementById('bsbLinkedObject').value = comp.linkedObject || '';
      document.getElementById('bsbCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('bsbFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('bsbFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('bsbBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('bsbItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('bsbUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('bsbUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      bsbSetColor('bsbCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('bsbUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      bsbSetColor('bsbCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('bsbCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('bsbWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('bsbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#backspaceButtonForm input[name="bsbAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('bsbImage').value = comp.image || 'Backspace';
      document.getElementById('bsbImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('bsbUseImageColor').checked = Boolean(comp.useImageColor);
      bsbSetColor('bsbImageColor', comp.imageColor || '#ffffff');
      document.getElementById('bsbUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      bsbSetColor('bsbImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('bsbImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('bsbImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#backspaceButtonForm input[name="bsbImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('bsbHeight').value = comp.height ?? 80;
      document.getElementById('bsbWidth').value = comp.width ?? 80;
      document.getElementById('bsbTop').value = comp.top ?? 16;
      document.getElementById('bsbLeft').value = comp.left ?? 16;
      document.getElementById('bsbName').value = comp.name || 'BackspaceButton1';
      document.getElementById('bsbVisible').checked = comp.visible !== false;
      syncBackspaceFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readBackspaceButtonForm() {
    const caption = document.getElementById('bsbCaption')?.value || '';
    const captionColor = bsbGetColor('bsbCaptionColor');
    const sendPressTo = document.getElementById('bsbSendPressTo')?.value || 'objectWithFocus';
    return {
      type: 'BackspaceButton',
      name: document.getElementById('bsbName')?.value.trim() || 'BackspaceButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('bsbLeft')?.value) || 0,
      top: Number(document.getElementById('bsbTop')?.value) || 0,
      width: Number(document.getElementById('bsbWidth')?.value) || 80,
      height: Number(document.getElementById('bsbHeight')?.value) || 80,
      visible: document.getElementById('bsbVisible')?.checked !== false,
      borderStyle: document.getElementById('bsbBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('bsbBorderWidth')?.value) || 1,
      borderUsesBackColor: Boolean(document.getElementById('bsbBorderUsesBackColor')?.checked),
      backStyle: document.getElementById('bsbBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('bsbPatternStyle')?.value || 'none',
      shape: document.getElementById('bsbShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: bsbGetColor('bsbBackColor'),
      useBorderColor: true,
      borderColor: bsbGetColor('bsbBorderColor'),
      usePatternColor: true,
      patternColor: bsbGetColor('bsbPatternColor'),
      useHighlightColor: true,
      highlightColor: bsbGetColor('bsbHighlightColor'),
      blink: Boolean(document.getElementById('bsbBlink')?.checked),
      horizontalMargin: Number(document.getElementById('bsbHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('bsbVerticalMargin')?.value) || 0,
      audio: document.getElementById('bsbAudio')?.checked !== false,
      sendPressTo,
      linkedObject: document.getElementById('bsbLinkedObject')?.value.trim() || '',
      fontFamily: document.getElementById('bsbFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('bsbFontSize')?.value) || 10,
      bold: document.getElementById('bsbBold')?.classList.contains('active'),
      italic: document.getElementById('bsbItalic')?.classList.contains('active'),
      underline: document.getElementById('bsbUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('bsbUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('bsbUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('bsbUseCaptionBackColor')?.checked),
      captionBackColor: bsbGetColor('bsbCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('bsbCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('bsbCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('bsbWordWrap')?.checked !== false,
      alignment: document.querySelector('#backspaceButtonForm input[name="bsbAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('bsbImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('bsbImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#backspaceButtonForm input[name="bsbImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('bsbUseImageColor')?.checked),
      imageColor: bsbGetColor('bsbImageColor'),
      useImageBackColor: Boolean(document.getElementById('bsbUseImageBackColor')?.checked),
      imageBackColor: bsbGetColor('bsbImageBackColor'),
      imageBlink: Boolean(document.getElementById('bsbImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('bsbImageScaled')?.checked)
    };
  }

  async function showBackspaceButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Backspace Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initBackspaceButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultBackspaceButtonComponent({
        name: nextBackspaceButtonName(canvas?.components),
        ...overrides
      });
      fillBackspaceButtonForm(comp);
      window.resetPropsDialogState('backspace', readBackspaceButtonForm, 'applyBackspaceButton');
      switchTab('general');
      wireBackspaceButtonTools();
      presentBackspaceButtonDialog();
      const previewComp = readBackspaceButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readBackspaceButtonForm, 'applyBackspaceButton');
    } catch (err) {
      window.setStatus(`Backspace Button properties error: ${err.message}`);
    }
  }

  async function applyBackspaceButton() {
    const comp = readBackspaceButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readBackspaceButtonForm, 'applyBackspaceButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveBackspaceButton(e) {
    e.preventDefault();
    const comp = readBackspaceButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    bsbDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('backspaceButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertBsbCaptionText(text) {
    const area = document.getElementById('bsbCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleBackspaceLivePreview();
  }

  function insertBsbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertBsbCaptionText(tag);
    });
  }

  function hideBsbInsertVariableMenu() {
    document.getElementById('bsbInsertVariableMenu')?.classList.add('hidden');
  }

  function listBrowsableObjects() {
    const selfName = document.getElementById('bsbName')?.value.trim();
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
    const dlg = document.getElementById('bsbObjectBrowserDialog');
    if (!dlg) return;
    try { dlg.close(); } catch (_) {
      dlg.removeAttribute('open');
      dlg.style.display = 'none';
    }
  }

  function openObjectBrowser() {
    const dlg = document.getElementById('bsbObjectBrowserDialog');
    const list = document.getElementById('bsbObjectBrowserList');
    if (!dlg || !list) return;
    const items = listBrowsableObjects();
    const current = document.getElementById('bsbLinkedObject')?.value.trim() || '';
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
    const list = document.getElementById('bsbObjectBrowserList');
    const name = list?.value?.trim();
    if (name) {
      document.getElementById('bsbLinkedObject').value = name;
      scheduleBackspaceLivePreview();
      window.flushPropsApplyButton?.(readBackspaceButtonForm, 'applyBackspaceButton');
    }
    closeObjectBrowser();
  }

  function initBackspaceButtonDialog() {
    const form = document.getElementById('backspaceButtonForm');
    if (!form || form.dataset.bsbWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('bsbPatternStyle', 'bsbFilled');
    form.addEventListener('submit', (e) => saveBackspaceButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyBackspaceButton')?.addEventListener('click', () => {
      applyBackspaceButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleBackspaceLivePreview();
      window.flushPropsApplyButton?.(readBackspaceButtonForm, 'applyBackspaceButton');
    });
    form.addEventListener('change', () => {
      syncBackspaceFields();
      scheduleBackspaceLivePreview();
      window.flushPropsApplyButton?.(readBackspaceButtonForm, 'applyBackspaceButton');
    });
    document.getElementById('cancelBackspaceButton')?.addEventListener('click', () => {
      if (!bsbDialogCommitted) window.revertPropsDialogPreview?.();
      bsbDialogCommitted = true;
      document.getElementById('backspaceButtonDialog')?.close();
    });
    document.getElementById('backspaceButtonDialog')?.addEventListener('close', () => {
      if (bsbPreviewTimer) {
        clearTimeout(bsbPreviewTimer);
        bsbPreviewTimer = null;
      }
      hideBsbInsertVariableMenu();
      closeObjectBrowser();
      if (!bsbDialogCommitted) window.revertPropsDialogPreview?.();
      bsbDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpBackspaceButton')?.addEventListener('click', () => {
      alert('Backspace Button sends Backspace to the object with focus, or to a linked input object.');
    });
    document.querySelectorAll('#backspaceButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideBsbInsertVariableMenu();
        switchTab(tab.dataset.bsbTab);
      });
    });
    document.getElementById('bsbBrowseLinkedObject')?.addEventListener('click', () => {
      if (document.getElementById('bsbBrowseLinkedObject')?.disabled) return;
      openObjectBrowser();
    });
    document.getElementById('bsbObjectBrowserOk')?.addEventListener('click', acceptObjectBrowser);
    document.getElementById('bsbObjectBrowserList')?.addEventListener('dblclick', acceptObjectBrowser);
    document.getElementById('bsbObjectBrowserCancel')?.addEventListener('click', closeObjectBrowser);
    document.getElementById('bsbObjectBrowserHelp')?.addEventListener('click', () => {
      alert('Select a display object to receive the Backspace press. Input objects are listed first when present.');
    });
    document.getElementById('bsbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('bsbImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('bsbImage').value = fileName;
          scheduleBackspaceLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('bsbInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('bsbInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('bsbInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.bsbVar;
      if (!kind) return;
      hideBsbInsertVariableMenu();
      if (kind === 'timedate') insertBsbCaptionText('{#dt}');
      else insertBsbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#backspaceButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideBsbInsertVariableMenu();
    });
    document.getElementById('bsbShape')?.addEventListener('change', () => {
      if (document.getElementById('bsbShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('bsbWidth')?.value) || 0;
      const h = Number(document.getElementById('bsbHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('bsbWidth').value = String(size);
      document.getElementById('bsbHeight').value = String(size);
    });
    for (const id of ['bsbBold', 'bsbItalic', 'bsbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleBackspaceLivePreview();
      });
    }
    form.dataset.bsbWired = '1';
  }

  window.StudioBackspaceButton = {
    initBackspaceButtonDialog,
    presentBackspaceButtonDialog,
    scheduleBackspaceLivePreview,
    showBackspaceButtonDialog,
    fillBackspaceButtonForm,
    readBackspaceButtonForm,
    switchBackspaceButtonTab: switchTab,
    wireBackspaceButtonTools,
    nextBackspaceButtonName,
    defaultBackspaceButtonComponent,
    applyBackspaceButton
  };
})();
