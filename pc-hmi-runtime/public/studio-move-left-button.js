/** Move Left Button property dialog — FactoryTalk View parity */
(function () {
  let mvlPreviewTimer = null;
  let mvlDialogCommitted = false;

  const KEY_BUTTON_TYPES = new Set([
    'BackspaceButton', 'EndButton', 'EnterButton', 'HomeButton',
    'MoveLeftButton', 'MoveRightButton', 'MoveDownButton', 'MoveUpButton',
    'PageDownButton', 'PageUpButton'
  ]);
  const INPUT_TYPES = new Set([
    'StringInputEnable', 'NumericInputEnable', 'NumericInputCursorPoint'
  ]);

  function switchTab(tabId) {
    document.querySelectorAll('#moveLeftButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.mvlTab === tabId);
    });
    document.querySelectorAll('#moveLeftButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.mvlTabPanel === tabId);
    });
  }

  function mvlGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function mvlSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function fillMvlAutoRepeatRateSelect() {
    const el = document.getElementById('mvlAutoRepeatRate');
    if (!el || el.dataset.mvlRateFilled === '1') return;
    el.dataset.mvlRateFilled = '1';
    const opts = [];
    for (let n = 0; n <= 20; n++) {
      opts.push(`<option value="${n}"${n === 0 ? ' selected' : ''}>${n}</option>`);
    }
    el.innerHTML = opts.join('');
  }

  function nextMoveLeftButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'MoveLeftButton').length + 1;
    return `MoveLeftButton${n}`;
  }

  function defaultMoveLeftButtonComponent(overrides = {}) {
    return {
      type: 'MoveLeftButton',
      name: 'MoveLeftButton1',
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
      image: 'Arrow Left',
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

  function scheduleMoveLeftButtonLivePreview() {
    if (window.state?.propsFormFill) return;
    if (mvlPreviewTimer) clearTimeout(mvlPreviewTimer);
    mvlPreviewTimer = setTimeout(() => {
      mvlPreviewTimer = null;
      if (!document.getElementById('moveLeftButtonDialog')?.open) return;
      const comp = readMoveLeftButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readMoveLeftButtonForm, 'applyMoveLeftButton');
    }, 80);
  }

  function syncMoveLeftButtonFields() {
    const capColor = document.getElementById('mvlCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('mvlUseCaptionColor')?.checked;
    const capBack = document.getElementById('mvlCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('mvlUseCaptionBackColor')?.checked
      || document.getElementById('mvlCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('mvlImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('mvlUseImageColor')?.checked;
    const imgBack = document.getElementById('mvlImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('mvlUseImageBackColor')?.checked
      || document.getElementById('mvlImageBackStyle')?.value !== 'solid';
    const linked = document.getElementById('mvlSendPressTo')?.value === 'linkedObject';
    const linkedInput = document.getElementById('mvlLinkedObject');
    const browse = document.getElementById('mvlBrowseLinkedObject');
    if (linkedInput) linkedInput.disabled = !linked;
    if (browse) browse.disabled = !linked;
  }

  function wireMoveLeftButtonTools() {
    fillMvlAutoRepeatRateSelect();
    const dlg = document.getElementById('moveLeftButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('mvlPatternStyle', 'mvlFilled');
    document.querySelectorAll('#moveLeftButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.mvlPreviewWired === '1') return;
      input.dataset.mvlPreviewWired = '1';
      input.addEventListener('input', scheduleMoveLeftButtonLivePreview);
      input.addEventListener('change', scheduleMoveLeftButtonLivePreview);
    });
    syncMoveLeftButtonFields();
  }

  function presentMoveLeftButtonDialog() {
    const dialog = document.getElementById('moveLeftButtonDialog');
    if (!dialog) {
      window.setStatus('Move Left Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    mvlDialogCommitted = false;
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
        window.setStatus(`Opened Move Left Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillMoveLeftButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillMvlAutoRepeatRateSelect();
      window.StudioPropsShared?.fillPatternSelect('mvlPatternStyle', 'mvlFilled');
      document.getElementById('mvlBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('mvlBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('mvlBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('mvlPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('mvlShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('mvlBorderUsesBackColor').checked = Boolean(comp.borderUsesBackColor);
      mvlSetColor('mvlBackColor', comp.backColor || '#001C38');
      mvlSetColor('mvlBorderColor', comp.borderColor || '#001C38');
      mvlSetColor('mvlPatternColor', comp.patternColor || '#ffffff');
      mvlSetColor('mvlHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('mvlBlink').checked = Boolean(comp.blink);
      document.getElementById('mvlHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('mvlVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('mvlAudio').checked = comp.audio !== false;
      const sendTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
      document.getElementById('mvlSendPressTo').value = sendTo;
      document.getElementById('mvlLinkedObject').value = comp.linkedObject || '';
      document.getElementById('mvlCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('mvlFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('mvlFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('mvlBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('mvlItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('mvlUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('mvlUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      mvlSetColor('mvlCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('mvlUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      mvlSetColor('mvlCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('mvlCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('mvlWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('mvlCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#moveLeftButtonForm input[name="mvlAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('mvlImage').value = comp.image || 'Arrow Left';
      document.getElementById('mvlAutoRepeatRate').value = String(Math.min(20, Math.max(0, Number(comp.autoRepeatRate) || 0)));
      document.getElementById('mvlAutoRepeatDelay').value = String(comp.autoRepeatDelay ?? 400);
      document.getElementById('mvlImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('mvlUseImageColor').checked = Boolean(comp.useImageColor);
      mvlSetColor('mvlImageColor', comp.imageColor || '#ffffff');
      document.getElementById('mvlUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      mvlSetColor('mvlImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('mvlImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('mvlImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#moveLeftButtonForm input[name="mvlImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('mvlHeight').value = comp.height ?? 80;
      document.getElementById('mvlWidth').value = comp.width ?? 80;
      document.getElementById('mvlTop').value = comp.top ?? 16;
      document.getElementById('mvlLeft').value = comp.left ?? 16;
      document.getElementById('mvlName').value = comp.name || 'MoveLeftButton1';
      document.getElementById('mvlVisible').checked = comp.visible !== false;
      syncMoveLeftButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readMoveLeftButtonForm() {
    const caption = document.getElementById('mvlCaption')?.value || '';
    const captionColor = mvlGetColor('mvlCaptionColor');
    const sendPressTo = document.getElementById('mvlSendPressTo')?.value || 'objectWithFocus';
    return {
      type: 'MoveLeftButton',
      name: document.getElementById('mvlName')?.value.trim() || 'MoveLeftButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('mvlLeft')?.value) || 0,
      top: Number(document.getElementById('mvlTop')?.value) || 0,
      width: Number(document.getElementById('mvlWidth')?.value) || 80,
      height: Number(document.getElementById('mvlHeight')?.value) || 80,
      visible: document.getElementById('mvlVisible')?.checked !== false,
      borderStyle: document.getElementById('mvlBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('mvlBorderWidth')?.value) || 1,
      borderUsesBackColor: Boolean(document.getElementById('mvlBorderUsesBackColor')?.checked),
      backStyle: document.getElementById('mvlBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('mvlPatternStyle')?.value || 'none',
      shape: document.getElementById('mvlShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: mvlGetColor('mvlBackColor'),
      useBorderColor: true,
      borderColor: mvlGetColor('mvlBorderColor'),
      usePatternColor: true,
      patternColor: mvlGetColor('mvlPatternColor'),
      useHighlightColor: true,
      highlightColor: mvlGetColor('mvlHighlightColor'),
      blink: Boolean(document.getElementById('mvlBlink')?.checked),
      horizontalMargin: Number(document.getElementById('mvlHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('mvlVerticalMargin')?.value) || 0,
      audio: document.getElementById('mvlAudio')?.checked !== false,
      sendPressTo,
      linkedObject: document.getElementById('mvlLinkedObject')?.value.trim() || '',
      fontFamily: document.getElementById('mvlFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('mvlFontSize')?.value) || 10,
      bold: document.getElementById('mvlBold')?.classList.contains('active'),
      italic: document.getElementById('mvlItalic')?.classList.contains('active'),
      underline: document.getElementById('mvlUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('mvlUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('mvlUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('mvlUseCaptionBackColor')?.checked),
      captionBackColor: mvlGetColor('mvlCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('mvlCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('mvlCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('mvlWordWrap')?.checked !== false,
      alignment: document.querySelector('#moveLeftButtonForm input[name="mvlAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('mvlImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('mvlImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#moveLeftButtonForm input[name="mvlImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('mvlUseImageColor')?.checked),
      imageColor: mvlGetColor('mvlImageColor'),
      useImageBackColor: Boolean(document.getElementById('mvlUseImageBackColor')?.checked),
      imageBackColor: mvlGetColor('mvlImageBackColor'),
      imageBlink: Boolean(document.getElementById('mvlImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('mvlImageScaled')?.checked),
      autoRepeatRate: Number(document.getElementById('mvlAutoRepeatRate')?.value) || 0,
      autoRepeatDelay: Number(document.getElementById('mvlAutoRepeatDelay')?.value) || 400
    };
  }

  async function showMoveLeftButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Move Left Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initMoveLeftButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultMoveLeftButtonComponent({
        name: nextMoveLeftButtonName(canvas?.components),
        ...overrides
      });
      fillMoveLeftButtonForm(comp);
      window.resetPropsDialogState('move-left', readMoveLeftButtonForm, 'applyMoveLeftButton');
      switchTab('general');
      wireMoveLeftButtonTools();
      presentMoveLeftButtonDialog();
      const previewComp = readMoveLeftButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readMoveLeftButtonForm, 'applyMoveLeftButton');
    } catch (err) {
      window.setStatus(`Move Left Button properties error: ${err.message}`);
    }
  }

  async function applyMoveLeftButton() {
    const comp = readMoveLeftButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readMoveLeftButtonForm, 'applyMoveLeftButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveMoveLeftButton(e) {
    e.preventDefault();
    const comp = readMoveLeftButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    mvlDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('moveLeftButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertHmbCaptionText(text) {
    const area = document.getElementById('mvlCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleMoveLeftButtonLivePreview();
  }

  function insertHmbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertHmbCaptionText(tag);
    });
  }

  function hideHmbInsertVariableMenu() {
    document.getElementById('mvlInsertVariableMenu')?.classList.add('hidden');
  }

  function listBrowsableObjects() {
    const selfName = document.getElementById('mvlName')?.value.trim();
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
    const dlg = document.getElementById('mvlObjectBrowserDialog');
    if (!dlg) return;
    try { dlg.close(); } catch (_) {
      dlg.removeAttribute('open');
      dlg.style.display = 'none';
    }
  }

  function openObjectBrowser() {
    const dlg = document.getElementById('mvlObjectBrowserDialog');
    const list = document.getElementById('mvlObjectBrowserList');
    if (!dlg || !list) return;
    const items = listBrowsableObjects();
    const current = document.getElementById('mvlLinkedObject')?.value.trim() || '';
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
    const list = document.getElementById('mvlObjectBrowserList');
    const name = list?.value?.trim();
    if (name) {
      document.getElementById('mvlLinkedObject').value = name;
      scheduleMoveLeftButtonLivePreview();
      window.flushPropsApplyButton?.(readMoveLeftButtonForm, 'applyMoveLeftButton');
    }
    closeObjectBrowser();
  }

  function initMoveLeftButtonDialog() {
    const form = document.getElementById('moveLeftButtonForm');
    if (!form || form.dataset.mvlWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('mvlPatternStyle', 'mvlFilled');
    form.addEventListener('submit', (e) => saveMoveLeftButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyMoveLeftButton')?.addEventListener('click', () => {
      applyMoveLeftButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleMoveLeftButtonLivePreview();
      window.flushPropsApplyButton?.(readMoveLeftButtonForm, 'applyMoveLeftButton');
    });
    form.addEventListener('change', () => {
      syncMoveLeftButtonFields();
      scheduleMoveLeftButtonLivePreview();
      window.flushPropsApplyButton?.(readMoveLeftButtonForm, 'applyMoveLeftButton');
    });
    document.getElementById('cancelMoveLeftButton')?.addEventListener('click', () => {
      if (!mvlDialogCommitted) window.revertPropsDialogPreview?.();
      mvlDialogCommitted = true;
      document.getElementById('moveLeftButtonDialog')?.close();
    });
    document.getElementById('moveLeftButtonDialog')?.addEventListener('close', () => {
      if (mvlPreviewTimer) {
        clearTimeout(mvlPreviewTimer);
        mvlPreviewTimer = null;
      }
      hideHmbInsertVariableMenu();
      closeObjectBrowser();
      if (!mvlDialogCommitted) window.revertPropsDialogPreview?.();
      mvlDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpMoveLeftButton')?.addEventListener('click', () => {
      alert('Move Left Button sends ArrowLeft repeatedly while held (per the Timing settings) to the object with focus, or to a linked input object.');
    });
    document.querySelectorAll('#moveLeftButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideHmbInsertVariableMenu();
        switchTab(tab.dataset.mvlTab);
      });
    });
    document.getElementById('mvlBrowseLinkedObject')?.addEventListener('click', () => {
      if (document.getElementById('mvlBrowseLinkedObject')?.disabled) return;
      openObjectBrowser();
    });
    document.getElementById('mvlObjectBrowserOk')?.addEventListener('click', acceptObjectBrowser);
    document.getElementById('mvlObjectBrowserList')?.addEventListener('dblclick', acceptObjectBrowser);
    document.getElementById('mvlObjectBrowserCancel')?.addEventListener('click', closeObjectBrowser);
    document.getElementById('mvlObjectBrowserHelp')?.addEventListener('click', () => {
      alert('Select a display object to receive the Home press. Input objects are listed first when present.');
    });
    document.getElementById('mvlBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('mvlImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('mvlImage').value = fileName;
          scheduleMoveLeftButtonLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('mvlInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('mvlInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('mvlInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.mvlVar;
      if (!kind) return;
      hideHmbInsertVariableMenu();
      if (kind === 'timedate') insertHmbCaptionText('{#dt}');
      else insertHmbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#moveLeftButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideHmbInsertVariableMenu();
    });
    document.getElementById('mvlShape')?.addEventListener('change', () => {
      if (document.getElementById('mvlShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('mvlWidth')?.value) || 0;
      const h = Number(document.getElementById('mvlHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('mvlWidth').value = String(size);
      document.getElementById('mvlHeight').value = String(size);
    });
    for (const id of ['mvlBold', 'mvlItalic', 'mvlUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleMoveLeftButtonLivePreview();
      });
    }
    form.dataset.mvlWired = '1';
  }

  window.StudioMoveLeftButton = {
    initMoveLeftButtonDialog,
    presentMoveLeftButtonDialog,
    scheduleMoveLeftButtonLivePreview,
    showMoveLeftButtonDialog,
    fillMoveLeftButtonForm,
    readMoveLeftButtonForm,
    switchMoveLeftButtonTab: switchTab,
    wireMoveLeftButtonTools,
    nextMoveLeftButtonName,
    defaultMoveLeftButtonComponent,
    applyMoveLeftButton
  };
})();
