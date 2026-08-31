/** Move Up Button property dialog — FactoryTalk View parity */
(function () {
  let mvuPreviewTimer = null;
  let mvuDialogCommitted = false;

  const KEY_BUTTON_TYPES = new Set([
    'BackspaceButton', 'EndButton', 'EnterButton', 'HomeButton',
    'MoveLeftButton', 'MoveRightButton', 'MoveDownButton', 'MoveUpButton',
    'PageDownButton', 'PageUpButton'
  ]);
  const INPUT_TYPES = new Set([
    'StringInputEnable', 'NumericInputEnable', 'NumericInputCursorPoint'
  ]);

  function switchTab(tabId) {
    document.querySelectorAll('#moveUpButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.mvuTab === tabId);
    });
    document.querySelectorAll('#moveUpButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.mvuTabPanel === tabId);
    });
  }

  function mvuGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function mvuSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function fillMvuAutoRepeatRateSelect() {
    const el = document.getElementById('mvuAutoRepeatRate');
    if (!el || el.dataset.mvuRateFilled === '1') return;
    el.dataset.mvuRateFilled = '1';
    const opts = [];
    for (let n = 0; n <= 20; n++) {
      opts.push(`<option value="${n}"${n === 0 ? ' selected' : ''}>${n}</option>`);
    }
    el.innerHTML = opts.join('');
  }

  function nextMoveUpButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'MoveUpButton').length + 1;
    return `MoveUpButton${n}`;
  }

  function defaultMoveUpButtonComponent(overrides = {}) {
    return {
      type: 'MoveUpButton',
      name: 'MoveUpButton1',
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
      image: 'Arrow Up',
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

  function scheduleMoveUpButtonLivePreview() {
    if (window.state?.propsFormFill) return;
    if (mvuPreviewTimer) clearTimeout(mvuPreviewTimer);
    mvuPreviewTimer = setTimeout(() => {
      mvuPreviewTimer = null;
      if (!document.getElementById('moveUpButtonDialog')?.open) return;
      const comp = readMoveUpButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readMoveUpButtonForm, 'applyMoveUpButton');
    }, 80);
  }

  function syncMoveUpButtonFields() {
    const capColor = document.getElementById('mvuCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('mvuUseCaptionColor')?.checked;
    const capBack = document.getElementById('mvuCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('mvuUseCaptionBackColor')?.checked
      || document.getElementById('mvuCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('mvuImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('mvuUseImageColor')?.checked;
    const imgBack = document.getElementById('mvuImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('mvuUseImageBackColor')?.checked
      || document.getElementById('mvuImageBackStyle')?.value !== 'solid';
    const linked = document.getElementById('mvuSendPressTo')?.value === 'linkedObject';
    const linkedInput = document.getElementById('mvuLinkedObject');
    const browse = document.getElementById('mvuBrowseLinkedObject');
    if (linkedInput) linkedInput.disabled = !linked;
    if (browse) browse.disabled = !linked;
  }

  function wireMoveUpButtonTools() {
    fillMvuAutoRepeatRateSelect();
    const dlg = document.getElementById('moveUpButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('mvuPatternStyle', 'mvuFilled');
    document.querySelectorAll('#moveUpButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.mvuPreviewWired === '1') return;
      input.dataset.mvuPreviewWired = '1';
      input.addEventListener('input', scheduleMoveUpButtonLivePreview);
      input.addEventListener('change', scheduleMoveUpButtonLivePreview);
    });
    syncMoveUpButtonFields();
  }

  function presentMoveUpButtonDialog() {
    const dialog = document.getElementById('moveUpButtonDialog');
    if (!dialog) {
      window.setStatus('Move Up Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    mvuDialogCommitted = false;
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
        window.setStatus(`Opened Move Up Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillMoveUpButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillMvuAutoRepeatRateSelect();
      window.StudioPropsShared?.fillPatternSelect('mvuPatternStyle', 'mvuFilled');
      document.getElementById('mvuBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('mvuBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('mvuBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('mvuPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('mvuShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('mvuBorderUsesBackColor').checked = Boolean(comp.borderUsesBackColor);
      mvuSetColor('mvuBackColor', comp.backColor || '#001C38');
      mvuSetColor('mvuBorderColor', comp.borderColor || '#001C38');
      mvuSetColor('mvuPatternColor', comp.patternColor || '#ffffff');
      mvuSetColor('mvuHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('mvuBlink').checked = Boolean(comp.blink);
      document.getElementById('mvuHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('mvuVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('mvuAudio').checked = comp.audio !== false;
      const sendTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
      document.getElementById('mvuSendPressTo').value = sendTo;
      document.getElementById('mvuLinkedObject').value = comp.linkedObject || '';
      document.getElementById('mvuCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('mvuFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('mvuFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('mvuBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('mvuItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('mvuUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('mvuUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      mvuSetColor('mvuCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('mvuUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      mvuSetColor('mvuCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('mvuCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('mvuWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('mvuCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#moveUpButtonForm input[name="mvuAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('mvuImage').value = comp.image || 'Arrow Up';
      document.getElementById('mvuAutoRepeatRate').value = String(Math.min(20, Math.max(0, Number(comp.autoRepeatRate) || 0)));
      document.getElementById('mvuAutoRepeatDelay').value = String(comp.autoRepeatDelay ?? 400);
      document.getElementById('mvuImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('mvuUseImageColor').checked = Boolean(comp.useImageColor);
      mvuSetColor('mvuImageColor', comp.imageColor || '#ffffff');
      document.getElementById('mvuUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      mvuSetColor('mvuImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('mvuImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('mvuImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#moveUpButtonForm input[name="mvuImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('mvuHeight').value = comp.height ?? 80;
      document.getElementById('mvuWidth').value = comp.width ?? 80;
      document.getElementById('mvuTop').value = comp.top ?? 16;
      document.getElementById('mvuLeft').value = comp.left ?? 16;
      document.getElementById('mvuName').value = comp.name || 'MoveUpButton1';
      document.getElementById('mvuVisible').checked = comp.visible !== false;
      syncMoveUpButtonFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readMoveUpButtonForm() {
    const caption = document.getElementById('mvuCaption')?.value || '';
    const captionColor = mvuGetColor('mvuCaptionColor');
    const sendPressTo = document.getElementById('mvuSendPressTo')?.value || 'objectWithFocus';
    return {
      type: 'MoveUpButton',
      name: document.getElementById('mvuName')?.value.trim() || 'MoveUpButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('mvuLeft')?.value) || 0,
      top: Number(document.getElementById('mvuTop')?.value) || 0,
      width: Number(document.getElementById('mvuWidth')?.value) || 80,
      height: Number(document.getElementById('mvuHeight')?.value) || 80,
      visible: document.getElementById('mvuVisible')?.checked !== false,
      borderStyle: document.getElementById('mvuBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('mvuBorderWidth')?.value) || 1,
      borderUsesBackColor: Boolean(document.getElementById('mvuBorderUsesBackColor')?.checked),
      backStyle: document.getElementById('mvuBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('mvuPatternStyle')?.value || 'none',
      shape: document.getElementById('mvuShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: mvuGetColor('mvuBackColor'),
      useBorderColor: true,
      borderColor: mvuGetColor('mvuBorderColor'),
      usePatternColor: true,
      patternColor: mvuGetColor('mvuPatternColor'),
      useHighlightColor: true,
      highlightColor: mvuGetColor('mvuHighlightColor'),
      blink: Boolean(document.getElementById('mvuBlink')?.checked),
      horizontalMargin: Number(document.getElementById('mvuHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('mvuVerticalMargin')?.value) || 0,
      audio: document.getElementById('mvuAudio')?.checked !== false,
      sendPressTo,
      linkedObject: document.getElementById('mvuLinkedObject')?.value.trim() || '',
      fontFamily: document.getElementById('mvuFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('mvuFontSize')?.value) || 10,
      bold: document.getElementById('mvuBold')?.classList.contains('active'),
      italic: document.getElementById('mvuItalic')?.classList.contains('active'),
      underline: document.getElementById('mvuUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('mvuUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('mvuUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('mvuUseCaptionBackColor')?.checked),
      captionBackColor: mvuGetColor('mvuCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('mvuCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('mvuCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('mvuWordWrap')?.checked !== false,
      alignment: document.querySelector('#moveUpButtonForm input[name="mvuAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('mvuImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('mvuImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#moveUpButtonForm input[name="mvuImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('mvuUseImageColor')?.checked),
      imageColor: mvuGetColor('mvuImageColor'),
      useImageBackColor: Boolean(document.getElementById('mvuUseImageBackColor')?.checked),
      imageBackColor: mvuGetColor('mvuImageBackColor'),
      imageBlink: Boolean(document.getElementById('mvuImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('mvuImageScaled')?.checked),
      autoRepeatRate: Number(document.getElementById('mvuAutoRepeatRate')?.value) || 0,
      autoRepeatDelay: Number(document.getElementById('mvuAutoRepeatDelay')?.value) || 400
    };
  }

  async function showMoveUpButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Move Up Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initMoveUpButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultMoveUpButtonComponent({
        name: nextMoveUpButtonName(canvas?.components),
        ...overrides
      });
      fillMoveUpButtonForm(comp);
      window.resetPropsDialogState('move-up', readMoveUpButtonForm, 'applyMoveUpButton');
      switchTab('general');
      wireMoveUpButtonTools();
      presentMoveUpButtonDialog();
      const previewComp = readMoveUpButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readMoveUpButtonForm, 'applyMoveUpButton');
    } catch (err) {
      window.setStatus(`Move Up Button properties error: ${err.message}`);
    }
  }

  async function applyMoveUpButton() {
    const comp = readMoveUpButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readMoveUpButtonForm, 'applyMoveUpButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveMoveUpButton(e) {
    e.preventDefault();
    const comp = readMoveUpButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    mvuDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('moveUpButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertHmbCaptionText(text) {
    const area = document.getElementById('mvuCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleMoveUpButtonLivePreview();
  }

  function insertHmbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertHmbCaptionText(tag);
    });
  }

  function hideHmbInsertVariableMenu() {
    document.getElementById('mvuInsertVariableMenu')?.classList.add('hidden');
  }

  function listBrowsableObjects() {
    const selfName = document.getElementById('mvuName')?.value.trim();
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
    const dlg = document.getElementById('mvuObjectBrowserDialog');
    if (!dlg) return;
    try { dlg.close(); } catch (_) {
      dlg.removeAttribute('open');
      dlg.style.display = 'none';
    }
  }

  function openObjectBrowser() {
    const dlg = document.getElementById('mvuObjectBrowserDialog');
    const list = document.getElementById('mvuObjectBrowserList');
    if (!dlg || !list) return;
    const items = listBrowsableObjects();
    const current = document.getElementById('mvuLinkedObject')?.value.trim() || '';
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
    const list = document.getElementById('mvuObjectBrowserList');
    const name = list?.value?.trim();
    if (name) {
      document.getElementById('mvuLinkedObject').value = name;
      scheduleMoveUpButtonLivePreview();
      window.flushPropsApplyButton?.(readMoveUpButtonForm, 'applyMoveUpButton');
    }
    closeObjectBrowser();
  }

  function initMoveUpButtonDialog() {
    const form = document.getElementById('moveUpButtonForm');
    if (!form || form.dataset.mvuWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('mvuPatternStyle', 'mvuFilled');
    form.addEventListener('submit', (e) => saveMoveUpButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyMoveUpButton')?.addEventListener('click', () => {
      applyMoveUpButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleMoveUpButtonLivePreview();
      window.flushPropsApplyButton?.(readMoveUpButtonForm, 'applyMoveUpButton');
    });
    form.addEventListener('change', () => {
      syncMoveUpButtonFields();
      scheduleMoveUpButtonLivePreview();
      window.flushPropsApplyButton?.(readMoveUpButtonForm, 'applyMoveUpButton');
    });
    document.getElementById('cancelMoveUpButton')?.addEventListener('click', () => {
      if (!mvuDialogCommitted) window.revertPropsDialogPreview?.();
      mvuDialogCommitted = true;
      document.getElementById('moveUpButtonDialog')?.close();
    });
    document.getElementById('moveUpButtonDialog')?.addEventListener('close', () => {
      if (mvuPreviewTimer) {
        clearTimeout(mvuPreviewTimer);
        mvuPreviewTimer = null;
      }
      hideHmbInsertVariableMenu();
      closeObjectBrowser();
      if (!mvuDialogCommitted) window.revertPropsDialogPreview?.();
      mvuDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpMoveUpButton')?.addEventListener('click', () => {
      alert('Move Up Button sends ArrowUp repeatedly while held (per the Timing settings) to the object with focus, or to a linked input object.');
    });
    document.querySelectorAll('#moveUpButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideHmbInsertVariableMenu();
        switchTab(tab.dataset.mvuTab);
      });
    });
    document.getElementById('mvuBrowseLinkedObject')?.addEventListener('click', () => {
      if (document.getElementById('mvuBrowseLinkedObject')?.disabled) return;
      openObjectBrowser();
    });
    document.getElementById('mvuObjectBrowserOk')?.addEventListener('click', acceptObjectBrowser);
    document.getElementById('mvuObjectBrowserList')?.addEventListener('dblclick', acceptObjectBrowser);
    document.getElementById('mvuObjectBrowserCancel')?.addEventListener('click', closeObjectBrowser);
    document.getElementById('mvuObjectBrowserHelp')?.addEventListener('click', () => {
      alert('Select a display object to receive the Home press. Input objects are listed first when present.');
    });
    document.getElementById('mvuBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('mvuImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('mvuImage').value = fileName;
          scheduleMoveUpButtonLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('mvuInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('mvuInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('mvuInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.mvuVar;
      if (!kind) return;
      hideHmbInsertVariableMenu();
      if (kind === 'timedate') insertHmbCaptionText('{#dt}');
      else insertHmbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#moveUpButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideHmbInsertVariableMenu();
    });
    document.getElementById('mvuShape')?.addEventListener('change', () => {
      if (document.getElementById('mvuShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('mvuWidth')?.value) || 0;
      const h = Number(document.getElementById('mvuHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('mvuWidth').value = String(size);
      document.getElementById('mvuHeight').value = String(size);
    });
    for (const id of ['mvuBold', 'mvuItalic', 'mvuUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleMoveUpButtonLivePreview();
      });
    }
    form.dataset.mvuWired = '1';
  }

  window.StudioMoveUpButton = {
    initMoveUpButtonDialog,
    presentMoveUpButtonDialog,
    scheduleMoveUpButtonLivePreview,
    showMoveUpButtonDialog,
    fillMoveUpButtonForm,
    readMoveUpButtonForm,
    switchMoveUpButtonTab: switchTab,
    wireMoveUpButtonTools,
    nextMoveUpButtonName,
    defaultMoveUpButtonComponent,
    applyMoveUpButton
  };
})();
