/** Page Up Button property dialog — FactoryTalk View parity */
(function () {
  let pguPreviewTimer = null;
  let pguDialogCommitted = false;

  const KEY_BUTTON_TYPES = new Set([
    'BackspaceButton', 'EndButton', 'EnterButton', 'HomeButton',
    'MoveLeftButton', 'MoveRightButton', 'MoveDownButton', 'MoveUpButton',
    'PageDownButton', 'PageUpButton'
  ]);
  const INPUT_TYPES = new Set([
    'StringInputEnable', 'NumericInputEnable', 'NumericInputCursorPoint'
  ]);

  function switchTab(tabId) {
    document.querySelectorAll('#pageUpButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.pguTab === tabId);
    });
    document.querySelectorAll('#pageUpButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.pguTabPanel === tabId);
    });
  }

  function pguGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function pguSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function fillMvlAutoRepeatRateSelect() {
    const el = document.getElementById('pguAutoRepeatRate');
    if (!el || el.dataset.pguRateFilled === '1') return;
    el.dataset.pguRateFilled = '1';
    const opts = [];
    for (let n = 0; n <= 20; n++) {
      opts.push(`<option value="${n}"${n === 0 ? ' selected' : ''}>${n}</option>`);
    }
    el.innerHTML = opts.join('');
  }

  function nextPageUpButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'PageUpButton').length + 1;
    return `PageUpButton${n}`;
  }

  function defaultPageUpButtonComponent(overrides = {}) {
    return {
      type: 'PageUpButton',
      name: 'PageUpButton1',
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
      image: 'Page Up',
      autoRepeatRate: 0,
      autoRepeatDelay: 400,
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

  function schedulePageUpButtonLivePreview() {
    if (window.state?.propsFormFill) return;
    if (pguPreviewTimer) clearTimeout(pguPreviewTimer);
    pguPreviewTimer = setTimeout(() => {
      pguPreviewTimer = null;
      if (!document.getElementById('pageUpButtonDialog')?.open) return;
      const comp = readPageUpButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readPageUpButtonForm, 'applyPageUpButton');
    }, 80);
  }

  function syncPageUpButtonFields() {
    const capColor = document.getElementById('pguCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('pguUseCaptionColor')?.checked;
    const capBack = document.getElementById('pguCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('pguUseCaptionBackColor')?.checked
      || document.getElementById('pguCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('pguImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('pguUseImageColor')?.checked;
    const imgBack = document.getElementById('pguImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('pguUseImageBackColor')?.checked
      || document.getElementById('pguImageBackStyle')?.value !== 'solid';
    const linked = document.getElementById('pguSendPressTo')?.value === 'linkedObject';
    const linkedInput = document.getElementById('pguLinkedObject');
    const browse = document.getElementById('pguBrowseLinkedObject');
    if (linkedInput) linkedInput.disabled = !linked;
    if (browse) browse.disabled = !linked;
  }

  function wirePageUpButtonTools() {
    fillMvlAutoRepeatRateSelect();
    const dlg = document.getElementById('pageUpButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('pguPatternStyle', 'pguFilled');
    document.querySelectorAll('#pageUpButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.pguPreviewWired === '1') return;
      input.dataset.pguPreviewWired = '1';
      input.addEventListener('input', schedulePageUpButtonLivePreview);
      input.addEventListener('change', schedulePageUpButtonLivePreview);
    });
    syncPageUpButtonFields();
  }

  function presentPageUpButtonDialog() {
    const dialog = document.getElementById('pageUpButtonDialog');
    if (!dialog) {
      window.setStatus('Page Up Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    pguDialogCommitted = false;
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
        window.setStatus(`Opened Page Up Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillPageUpButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillMvlAutoRepeatRateSelect();
      window.StudioPropsShared?.fillPatternSelect('pguPatternStyle', 'pguFilled');
      document.getElementById('pguBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('pguBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('pguBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('pguPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('pguShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('pguBorderUsesBackColor').checked = Boolean(comp.borderUsesBackColor);
      pguSetColor('pguBackColor', comp.backColor || '#001C38');
      pguSetColor('pguBorderColor', comp.borderColor || '#001C38');
      pguSetColor('pguPatternColor', comp.patternColor || '#ffffff');
      pguSetColor('pguHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('pguBlink').checked = Boolean(comp.blink);
      document.getElementById('pguHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('pguVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('pguAudio').checked = comp.audio !== false;
      const sendTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
      document.getElementById('pguSendPressTo').value = sendTo;
      document.getElementById('pguLinkedObject').value = comp.linkedObject || '';
      document.getElementById('pguCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('pguFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('pguFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('pguBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('pguItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('pguUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('pguUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      pguSetColor('pguCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('pguUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      pguSetColor('pguCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('pguCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('pguWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('pguCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#pageUpButtonForm input[name="pguAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('pguImage').value = comp.image || 'Page Up';
      document.getElementById('pguAutoRepeatRate').value = String(Math.min(20, Math.max(0, Number(comp.autoRepeatRate) || 0)));
      document.getElementById('pguAutoRepeatDelay').value = String(comp.autoRepeatDelay ?? 400);
      document.getElementById('pguImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('pguUseImageColor').checked = Boolean(comp.useImageColor);
      pguSetColor('pguImageColor', comp.imageColor || '#ffffff');
      document.getElementById('pguUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      pguSetColor('pguImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('pguImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('pguImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#pageUpButtonForm input[name="pguImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('pguHeight').value = comp.height ?? 80;
      document.getElementById('pguWidth').value = comp.width ?? 80;
      document.getElementById('pguTop').value = comp.top ?? 16;
      document.getElementById('pguLeft').value = comp.left ?? 16;
      document.getElementById('pguName').value = comp.name || 'PageUpButton1';
      document.getElementById('pguVisible').checked = comp.visible !== false;
      syncPageUpButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readPageUpButtonForm() {
    const caption = document.getElementById('pguCaption')?.value || '';
    const captionColor = pguGetColor('pguCaptionColor');
    const sendPressTo = document.getElementById('pguSendPressTo')?.value || 'objectWithFocus';
    return {
      type: 'PageUpButton',
      name: document.getElementById('pguName')?.value.trim() || 'PageUpButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('pguLeft')?.value) || 0,
      top: Number(document.getElementById('pguTop')?.value) || 0,
      width: Number(document.getElementById('pguWidth')?.value) || 80,
      height: Number(document.getElementById('pguHeight')?.value) || 80,
      visible: document.getElementById('pguVisible')?.checked !== false,
      borderStyle: document.getElementById('pguBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('pguBorderWidth')?.value) || 1,
      borderUsesBackColor: Boolean(document.getElementById('pguBorderUsesBackColor')?.checked),
      backStyle: document.getElementById('pguBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('pguPatternStyle')?.value || 'none',
      shape: document.getElementById('pguShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: pguGetColor('pguBackColor'),
      useBorderColor: true,
      borderColor: pguGetColor('pguBorderColor'),
      usePatternColor: true,
      patternColor: pguGetColor('pguPatternColor'),
      useHighlightColor: true,
      highlightColor: pguGetColor('pguHighlightColor'),
      blink: Boolean(document.getElementById('pguBlink')?.checked),
      horizontalMargin: Number(document.getElementById('pguHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('pguVerticalMargin')?.value) || 0,
      audio: document.getElementById('pguAudio')?.checked !== false,
      sendPressTo,
      linkedObject: document.getElementById('pguLinkedObject')?.value.trim() || '',
      fontFamily: document.getElementById('pguFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('pguFontSize')?.value) || 10,
      bold: document.getElementById('pguBold')?.classList.contains('active'),
      italic: document.getElementById('pguItalic')?.classList.contains('active'),
      underline: document.getElementById('pguUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('pguUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('pguUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('pguUseCaptionBackColor')?.checked),
      captionBackColor: pguGetColor('pguCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('pguCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('pguCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('pguWordWrap')?.checked !== false,
      alignment: document.querySelector('#pageUpButtonForm input[name="pguAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('pguImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('pguImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#pageUpButtonForm input[name="pguImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('pguUseImageColor')?.checked),
      imageColor: pguGetColor('pguImageColor'),
      useImageBackColor: Boolean(document.getElementById('pguUseImageBackColor')?.checked),
      imageBackColor: pguGetColor('pguImageBackColor'),
      imageBlink: Boolean(document.getElementById('pguImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('pguImageScaled')?.checked),
      autoRepeatRate: Number(document.getElementById('pguAutoRepeatRate')?.value) || 0,
      autoRepeatDelay: Number(document.getElementById('pguAutoRepeatDelay')?.value) || 400
    };
  }

  async function showPageUpButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Page Up Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initPageUpButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultPageUpButtonComponent({
        name: nextPageUpButtonName(canvas?.components),
        ...overrides
      });
      fillPageUpButtonForm(comp);
      window.resetPropsDialogState('page-up', readPageUpButtonForm, 'applyPageUpButton');
      switchTab('general');
      wirePageUpButtonTools();
      presentPageUpButtonDialog();
      const previewComp = readPageUpButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readPageUpButtonForm, 'applyPageUpButton');
    } catch (err) {
      window.setStatus(`Page Up Button properties error: ${err.message}`);
    }
  }

  async function applyPageUpButton() {
    const comp = readPageUpButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readPageUpButtonForm, 'applyPageUpButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function savePageUpButton(e) {
    e.preventDefault();
    const comp = readPageUpButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    pguDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('pageUpButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertHmbCaptionText(text) {
    const area = document.getElementById('pguCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    schedulePageUpButtonLivePreview();
  }

  function insertHmbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertHmbCaptionText(tag);
    });
  }

  function hideHmbInsertVariableMenu() {
    document.getElementById('pguInsertVariableMenu')?.classList.add('hidden');
  }

  function listBrowsableObjects() {
    const selfName = document.getElementById('pguName')?.value.trim();
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
    const dlg = document.getElementById('pguObjectBrowserDialog');
    if (!dlg) return;
    try { dlg.close(); } catch (_) {
      dlg.removeAttribute('open');
      dlg.style.display = 'none';
    }
  }

  function openObjectBrowser() {
    const dlg = document.getElementById('pguObjectBrowserDialog');
    const list = document.getElementById('pguObjectBrowserList');
    if (!dlg || !list) return;
    const items = listBrowsableObjects();
    const current = document.getElementById('pguLinkedObject')?.value.trim() || '';
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
    const list = document.getElementById('pguObjectBrowserList');
    const name = list?.value?.trim();
    if (name) {
      document.getElementById('pguLinkedObject').value = name;
      schedulePageUpButtonLivePreview();
      window.flushPropsApplyButton?.(readPageUpButtonForm, 'applyPageUpButton');
    }
    closeObjectBrowser();
  }

  function initPageUpButtonDialog() {
    const form = document.getElementById('pageUpButtonForm');
    if (!form || form.dataset.pguWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('pguPatternStyle', 'pguFilled');
    form.addEventListener('submit', (e) => savePageUpButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyPageUpButton')?.addEventListener('click', () => {
      applyPageUpButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      schedulePageUpButtonLivePreview();
      window.flushPropsApplyButton?.(readPageUpButtonForm, 'applyPageUpButton');
    });
    form.addEventListener('change', () => {
      syncPageUpButtonFields();
      schedulePageUpButtonLivePreview();
      window.flushPropsApplyButton?.(readPageUpButtonForm, 'applyPageUpButton');
    });
    document.getElementById('cancelPageUpButton')?.addEventListener('click', () => {
      if (!pguDialogCommitted) window.revertPropsDialogPreview?.();
      pguDialogCommitted = true;
      document.getElementById('pageUpButtonDialog')?.close();
    });
    document.getElementById('pageUpButtonDialog')?.addEventListener('close', () => {
      if (pguPreviewTimer) {
        clearTimeout(pguPreviewTimer);
        pguPreviewTimer = null;
      }
      hideHmbInsertVariableMenu();
      closeObjectBrowser();
      if (!pguDialogCommitted) window.revertPropsDialogPreview?.();
      pguDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpPageUpButton')?.addEventListener('click', () => {
      alert('Page Up Button sends PageUp repeatedly while held (per the Timing settings) to the object with focus, or to a linked input object.');
    });
    document.querySelectorAll('#pageUpButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideHmbInsertVariableMenu();
        switchTab(tab.dataset.pguTab);
      });
    });
    document.getElementById('pguBrowseLinkedObject')?.addEventListener('click', () => {
      if (document.getElementById('pguBrowseLinkedObject')?.disabled) return;
      openObjectBrowser();
    });
    document.getElementById('pguObjectBrowserOk')?.addEventListener('click', acceptObjectBrowser);
    document.getElementById('pguObjectBrowserList')?.addEventListener('dblclick', acceptObjectBrowser);
    document.getElementById('pguObjectBrowserCancel')?.addEventListener('click', closeObjectBrowser);
    document.getElementById('pguObjectBrowserHelp')?.addEventListener('click', () => {
      alert('Select a display object to receive the Home press. Input objects are listed first when present.');
    });
    document.getElementById('pguBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('pguImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('pguImage').value = fileName;
          schedulePageUpButtonLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('pguInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('pguInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('pguInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.pguVar;
      if (!kind) return;
      hideHmbInsertVariableMenu();
      if (kind === 'timedate') insertHmbCaptionText('{#dt}');
      else insertHmbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#pageUpButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideHmbInsertVariableMenu();
    });
    document.getElementById('pguShape')?.addEventListener('change', () => {
      if (document.getElementById('pguShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('pguWidth')?.value) || 0;
      const h = Number(document.getElementById('pguHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('pguWidth').value = String(size);
      document.getElementById('pguHeight').value = String(size);
    });
    for (const id of ['pguBold', 'pguItalic', 'pguUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        schedulePageUpButtonLivePreview();
      });
    }
    form.dataset.pguWired = '1';
  }

  window.StudioPageUpButton = {
    initPageUpButtonDialog,
    presentPageUpButtonDialog,
    schedulePageUpButtonLivePreview,
    showPageUpButtonDialog,
    fillPageUpButtonForm,
    readPageUpButtonForm,
    switchPageUpButtonTab: switchTab,
    wirePageUpButtonTools,
    nextPageUpButtonName,
    defaultPageUpButtonComponent,
    applyPageUpButton
  };
})();
