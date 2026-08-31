/** Enter Button property dialog — FactoryTalk View parity */
(function () {
  let etbPreviewTimer = null;
  let etbDialogCommitted = false;

  const KEY_BUTTON_TYPES = new Set([
    'BackspaceButton', 'EndButton', 'EnterButton', 'HomeButton',
    'MoveLeftButton', 'MoveRightButton', 'MoveDownButton', 'MoveUpButton',
    'PageDownButton', 'PageUpButton'
  ]);
  const INPUT_TYPES = new Set([
    'StringInputEnable', 'NumericInputEnable', 'NumericInputCursorPoint'
  ]);

  function switchTab(tabId) {
    document.querySelectorAll('#enterButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.etbTab === tabId);
    });
    document.querySelectorAll('#enterButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.etbTabPanel === tabId);
    });
  }

  function etbGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function etbSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextEnterButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'EnterButton').length + 1;
    return `EnterButton${n}`;
  }

  function defaultEnterButtonComponent(overrides = {}) {
    return {
      type: 'EnterButton',
      name: 'EnterButton1',
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
      image: 'Enter',
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

  function scheduleEnterLivePreview() {
    if (window.state?.propsFormFill) return;
    if (etbPreviewTimer) clearTimeout(etbPreviewTimer);
    etbPreviewTimer = setTimeout(() => {
      etbPreviewTimer = null;
      if (!document.getElementById('enterButtonDialog')?.open) return;
      const comp = readEnterButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readEnterButtonForm, 'applyEnterButton');
    }, 80);
  }

  function syncEnterFields() {
    const capColor = document.getElementById('etbCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('etbUseCaptionColor')?.checked;
    const capBack = document.getElementById('etbCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('etbUseCaptionBackColor')?.checked
      || document.getElementById('etbCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('etbImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('etbUseImageColor')?.checked;
    const imgBack = document.getElementById('etbImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('etbUseImageBackColor')?.checked
      || document.getElementById('etbImageBackStyle')?.value !== 'solid';
    const linked = document.getElementById('etbSendPressTo')?.value === 'linkedObject';
    const linkedInput = document.getElementById('etbLinkedObject');
    const browse = document.getElementById('etbBrowseLinkedObject');
    if (linkedInput) linkedInput.disabled = !linked;
    if (browse) browse.disabled = !linked;
  }

  function wireEnterButtonTools() {
    const dlg = document.getElementById('enterButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('etbPatternStyle', 'etbFilled');
    document.querySelectorAll('#enterButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.etbPreviewWired === '1') return;
      input.dataset.etbPreviewWired = '1';
      input.addEventListener('input', scheduleEnterLivePreview);
      input.addEventListener('change', scheduleEnterLivePreview);
    });
    syncEnterFields();
  }

  function presentEnterButtonDialog() {
    const dialog = document.getElementById('enterButtonDialog');
    if (!dialog) {
      window.setStatus('Enter Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    etbDialogCommitted = false;
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
        window.setStatus(`Opened Enter Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillEnterButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('etbPatternStyle', 'etbFilled');
      document.getElementById('etbBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('etbBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('etbBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('etbPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('etbShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('etbBorderUsesBackColor').checked = Boolean(comp.borderUsesBackColor);
      etbSetColor('etbBackColor', comp.backColor || '#001C38');
      etbSetColor('etbBorderColor', comp.borderColor || '#001C38');
      etbSetColor('etbPatternColor', comp.patternColor || '#ffffff');
      etbSetColor('etbHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('etbBlink').checked = Boolean(comp.blink);
      document.getElementById('etbHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('etbVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('etbAudio').checked = comp.audio !== false;
      const sendTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
      document.getElementById('etbSendPressTo').value = sendTo;
      document.getElementById('etbLinkedObject').value = comp.linkedObject || '';
      document.getElementById('etbCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('etbFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('etbFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('etbBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('etbItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('etbUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('etbUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      etbSetColor('etbCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('etbUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      etbSetColor('etbCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('etbCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('etbWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('etbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#enterButtonForm input[name="etbAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('etbImage').value = comp.image || 'Enter';
      document.getElementById('etbImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('etbUseImageColor').checked = Boolean(comp.useImageColor);
      etbSetColor('etbImageColor', comp.imageColor || '#ffffff');
      document.getElementById('etbUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      etbSetColor('etbImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('etbImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('etbImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#enterButtonForm input[name="etbImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('etbHeight').value = comp.height ?? 80;
      document.getElementById('etbWidth').value = comp.width ?? 80;
      document.getElementById('etbTop').value = comp.top ?? 16;
      document.getElementById('etbLeft').value = comp.left ?? 16;
      document.getElementById('etbName').value = comp.name || 'EnterButton1';
      document.getElementById('etbVisible').checked = comp.visible !== false;
      syncEnterFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readEnterButtonForm() {
    const caption = document.getElementById('etbCaption')?.value || '';
    const captionColor = etbGetColor('etbCaptionColor');
    const sendPressTo = document.getElementById('etbSendPressTo')?.value || 'objectWithFocus';
    return {
      type: 'EnterButton',
      name: document.getElementById('etbName')?.value.trim() || 'EnterButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('etbLeft')?.value) || 0,
      top: Number(document.getElementById('etbTop')?.value) || 0,
      width: Number(document.getElementById('etbWidth')?.value) || 80,
      height: Number(document.getElementById('etbHeight')?.value) || 80,
      visible: document.getElementById('etbVisible')?.checked !== false,
      borderStyle: document.getElementById('etbBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('etbBorderWidth')?.value) || 1,
      borderUsesBackColor: Boolean(document.getElementById('etbBorderUsesBackColor')?.checked),
      backStyle: document.getElementById('etbBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('etbPatternStyle')?.value || 'none',
      shape: document.getElementById('etbShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: etbGetColor('etbBackColor'),
      useBorderColor: true,
      borderColor: etbGetColor('etbBorderColor'),
      usePatternColor: true,
      patternColor: etbGetColor('etbPatternColor'),
      useHighlightColor: true,
      highlightColor: etbGetColor('etbHighlightColor'),
      blink: Boolean(document.getElementById('etbBlink')?.checked),
      horizontalMargin: Number(document.getElementById('etbHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('etbVerticalMargin')?.value) || 0,
      audio: document.getElementById('etbAudio')?.checked !== false,
      sendPressTo,
      linkedObject: document.getElementById('etbLinkedObject')?.value.trim() || '',
      fontFamily: document.getElementById('etbFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('etbFontSize')?.value) || 10,
      bold: document.getElementById('etbBold')?.classList.contains('active'),
      italic: document.getElementById('etbItalic')?.classList.contains('active'),
      underline: document.getElementById('etbUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('etbUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('etbUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('etbUseCaptionBackColor')?.checked),
      captionBackColor: etbGetColor('etbCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('etbCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('etbCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('etbWordWrap')?.checked !== false,
      alignment: document.querySelector('#enterButtonForm input[name="etbAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('etbImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('etbImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#enterButtonForm input[name="etbImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('etbUseImageColor')?.checked),
      imageColor: etbGetColor('etbImageColor'),
      useImageBackColor: Boolean(document.getElementById('etbUseImageBackColor')?.checked),
      imageBackColor: etbGetColor('etbImageBackColor'),
      imageBlink: Boolean(document.getElementById('etbImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('etbImageScaled')?.checked)
    };
  }

  async function showEnterButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Enter Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initEnterButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultEnterButtonComponent({
        name: nextEnterButtonName(canvas?.components),
        ...overrides
      });
      fillEnterButtonForm(comp);
      window.resetPropsDialogState('enter', readEnterButtonForm, 'applyEnterButton');
      switchTab('general');
      wireEnterButtonTools();
      presentEnterButtonDialog();
      const previewComp = readEnterButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readEnterButtonForm, 'applyEnterButton');
    } catch (err) {
      window.setStatus(`Enter Button properties error: ${err.message}`);
    }
  }

  async function applyEnterButton() {
    const comp = readEnterButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readEnterButtonForm, 'applyEnterButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveEnterButton(e) {
    e.preventDefault();
    const comp = readEnterButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    etbDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('enterButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertEtbCaptionText(text) {
    const area = document.getElementById('etbCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleEnterLivePreview();
  }

  function insertEtbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertEtbCaptionText(tag);
    });
  }

  function hideEtbInsertVariableMenu() {
    document.getElementById('etbInsertVariableMenu')?.classList.add('hidden');
  }

  function listBrowsableObjects() {
    const selfName = document.getElementById('etbName')?.value.trim();
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
    const dlg = document.getElementById('etbObjectBrowserDialog');
    if (!dlg) return;
    try { dlg.close(); } catch (_) {
      dlg.removeAttribute('open');
      dlg.style.display = 'none';
    }
  }

  function openObjectBrowser() {
    const dlg = document.getElementById('etbObjectBrowserDialog');
    const list = document.getElementById('etbObjectBrowserList');
    if (!dlg || !list) return;
    const items = listBrowsableObjects();
    const current = document.getElementById('etbLinkedObject')?.value.trim() || '';
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
    const list = document.getElementById('etbObjectBrowserList');
    const name = list?.value?.trim();
    if (name) {
      document.getElementById('etbLinkedObject').value = name;
      scheduleEnterLivePreview();
      window.flushPropsApplyButton?.(readEnterButtonForm, 'applyEnterButton');
    }
    closeObjectBrowser();
  }

  function initEnterButtonDialog() {
    const form = document.getElementById('enterButtonForm');
    if (!form || form.dataset.etbWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('etbPatternStyle', 'etbFilled');
    form.addEventListener('submit', (e) => saveEnterButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyEnterButton')?.addEventListener('click', () => {
      applyEnterButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleEnterLivePreview();
      window.flushPropsApplyButton?.(readEnterButtonForm, 'applyEnterButton');
    });
    form.addEventListener('change', () => {
      syncEnterFields();
      scheduleEnterLivePreview();
      window.flushPropsApplyButton?.(readEnterButtonForm, 'applyEnterButton');
    });
    document.getElementById('cancelEnterButton')?.addEventListener('click', () => {
      if (!etbDialogCommitted) window.revertPropsDialogPreview?.();
      etbDialogCommitted = true;
      document.getElementById('enterButtonDialog')?.close();
    });
    document.getElementById('enterButtonDialog')?.addEventListener('close', () => {
      if (etbPreviewTimer) {
        clearTimeout(etbPreviewTimer);
        etbPreviewTimer = null;
      }
      hideEtbInsertVariableMenu();
      closeObjectBrowser();
      if (!etbDialogCommitted) window.revertPropsDialogPreview?.();
      etbDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpEnterButton')?.addEventListener('click', () => {
      alert('Enter Button sends Enter to the object with focus, or to a linked input object.');
    });
    document.querySelectorAll('#enterButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideEtbInsertVariableMenu();
        switchTab(tab.dataset.etbTab);
      });
    });
    document.getElementById('etbBrowseLinkedObject')?.addEventListener('click', () => {
      if (document.getElementById('etbBrowseLinkedObject')?.disabled) return;
      openObjectBrowser();
    });
    document.getElementById('etbObjectBrowserOk')?.addEventListener('click', acceptObjectBrowser);
    document.getElementById('etbObjectBrowserList')?.addEventListener('dblclick', acceptObjectBrowser);
    document.getElementById('etbObjectBrowserCancel')?.addEventListener('click', closeObjectBrowser);
    document.getElementById('etbObjectBrowserHelp')?.addEventListener('click', () => {
      alert('Select a display object to receive the Enter press. Input objects are listed first when present.');
    });
    document.getElementById('etbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('etbImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('etbImage').value = fileName;
          scheduleEnterLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('etbInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('etbInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('etbInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.etbVar;
      if (!kind) return;
      hideEtbInsertVariableMenu();
      if (kind === 'timedate') insertEtbCaptionText('{#dt}');
      else insertEtbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#enterButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideEtbInsertVariableMenu();
    });
    document.getElementById('etbShape')?.addEventListener('change', () => {
      if (document.getElementById('etbShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('etbWidth')?.value) || 0;
      const h = Number(document.getElementById('etbHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('etbWidth').value = String(size);
      document.getElementById('etbHeight').value = String(size);
    });
    for (const id of ['etbBold', 'etbItalic', 'etbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleEnterLivePreview();
      });
    }
    form.dataset.etbWired = '1';
  }

  window.StudioEnterButton = {
    initEnterButtonDialog,
    presentEnterButtonDialog,
    scheduleEnterLivePreview,
    showEnterButtonDialog,
    fillEnterButtonForm,
    readEnterButtonForm,
    switchEnterButtonTab: switchTab,
    wireEnterButtonTools,
    nextEnterButtonName,
    defaultEnterButtonComponent,
    applyEnterButton
  };
})();
