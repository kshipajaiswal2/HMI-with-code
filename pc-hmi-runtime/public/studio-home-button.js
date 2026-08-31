/** Home Button property dialog — FactoryTalk View parity */
(function () {
  let hmbPreviewTimer = null;
  let hmbDialogCommitted = false;

  const KEY_BUTTON_TYPES = new Set([
    'BackspaceButton', 'EndButton', 'EnterButton', 'HomeButton',
    'MoveLeftButton', 'MoveRightButton', 'MoveDownButton', 'MoveUpButton',
    'PageDownButton', 'PageUpButton'
  ]);
  const INPUT_TYPES = new Set([
    'StringInputEnable', 'NumericInputEnable', 'NumericInputCursorPoint'
  ]);

  function switchTab(tabId) {
    document.querySelectorAll('#homeButtonDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.hmbTab === tabId);
    });
    document.querySelectorAll('#homeButtonDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.hmbTabPanel === tabId);
    });
  }

  function hmbGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function hmbSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function nextHomeButtonName(components) {
    const n = (components || []).filter((c) => c.type === 'HomeButton').length + 1;
    return `HomeButton${n}`;
  }

  function defaultHomeButtonComponent(overrides = {}) {
    return {
      type: 'HomeButton',
      name: 'HomeButton1',
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
      image: 'Home',
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

  function scheduleHomeLivePreview() {
    if (window.state?.propsFormFill) return;
    if (hmbPreviewTimer) clearTimeout(hmbPreviewTimer);
    hmbPreviewTimer = setTimeout(() => {
      hmbPreviewTimer = null;
      if (!document.getElementById('homeButtonDialog')?.open) return;
      const comp = readHomeButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readHomeButtonForm, 'applyHomeButton');
    }, 80);
  }

  function syncHomeFields() {
    const capColor = document.getElementById('hmbCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('hmbUseCaptionColor')?.checked;
    const capBack = document.getElementById('hmbCaptionBackColor');
    if (capBack) capBack.disabled = !document.getElementById('hmbUseCaptionBackColor')?.checked
      || document.getElementById('hmbCaptionBackStyle')?.value !== 'solid';
    const imgColor = document.getElementById('hmbImageColor');
    if (imgColor) imgColor.disabled = !document.getElementById('hmbUseImageColor')?.checked;
    const imgBack = document.getElementById('hmbImageBackColor');
    if (imgBack) imgBack.disabled = !document.getElementById('hmbUseImageBackColor')?.checked
      || document.getElementById('hmbImageBackStyle')?.value !== 'solid';
    const linked = document.getElementById('hmbSendPressTo')?.value === 'linkedObject';
    const linkedInput = document.getElementById('hmbLinkedObject');
    const browse = document.getElementById('hmbBrowseLinkedObject');
    if (linkedInput) linkedInput.disabled = !linked;
    if (browse) browse.disabled = !linked;
  }

  function wireHomeButtonTools() {
    const dlg = document.getElementById('homeButtonDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    window.StudioPropsShared?.fillPatternSelect('hmbPatternStyle', 'hmbFilled');
    document.querySelectorAll('#homeButtonForm .ft-color-input').forEach((input) => {
      if (input.dataset.hmbPreviewWired === '1') return;
      input.dataset.hmbPreviewWired = '1';
      input.addEventListener('input', scheduleHomeLivePreview);
      input.addEventListener('change', scheduleHomeLivePreview);
    });
    syncHomeFields();
  }

  function presentHomeButtonDialog() {
    const dialog = document.getElementById('homeButtonDialog');
    if (!dialog) {
      window.setStatus('Home Button Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    hmbDialogCommitted = false;
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
        window.setStatus(`Opened Home Button properties without modal: ${err2.message}`);
      }
    }
  }

  function fillHomeButtonForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      window.StudioPropsShared?.fillPatternSelect('hmbPatternStyle', 'hmbFilled');
      document.getElementById('hmbBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('hmbBorderWidth').value = comp.borderWidth ?? 1;
      document.getElementById('hmbBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('hmbPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      const shape = comp.shape === 'roundedRectangle' ? 'rectangle' : (comp.shape || 'rectangle');
      const shapeEl = document.getElementById('hmbShape');
      if (shapeEl) shapeEl.value = shape;
      document.getElementById('hmbBorderUsesBackColor').checked = Boolean(comp.borderUsesBackColor);
      hmbSetColor('hmbBackColor', comp.backColor || '#001C38');
      hmbSetColor('hmbBorderColor', comp.borderColor || '#001C38');
      hmbSetColor('hmbPatternColor', comp.patternColor || '#ffffff');
      hmbSetColor('hmbHighlightColor', comp.highlightColor || '#0066cc');
      document.getElementById('hmbBlink').checked = Boolean(comp.blink);
      document.getElementById('hmbHorizontalMargin').value = comp.horizontalMargin ?? 0;
      document.getElementById('hmbVerticalMargin').value = comp.verticalMargin ?? 0;
      document.getElementById('hmbAudio').checked = comp.audio !== false;
      const sendTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
      document.getElementById('hmbSendPressTo').value = sendTo;
      document.getElementById('hmbLinkedObject').value = comp.linkedObject || '';
      document.getElementById('hmbCaption').value = comp.caption ?? comp.label ?? '';
      document.getElementById('hmbFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('hmbFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('hmbBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('hmbItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('hmbUnderline').classList.toggle('active', Boolean(comp.underline));
      document.getElementById('hmbUseCaptionColor').checked = Boolean(comp.useCaptionColor ?? comp.useForeColor);
      hmbSetColor('hmbCaptionColor', comp.captionColor || comp.foreColor || '#ffffff');
      document.getElementById('hmbUseCaptionBackColor').checked = Boolean(comp.useCaptionBackColor);
      hmbSetColor('hmbCaptionBackColor', comp.captionBackColor || '#001C38');
      document.getElementById('hmbCaptionBlink').checked = Boolean(comp.captionBlink);
      document.getElementById('hmbWordWrap').checked = comp.wordWrap !== false;
      document.getElementById('hmbCaptionBackStyle').value = comp.captionBackStyle || 'transparent';
      document.querySelectorAll('#homeButtonForm input[name="hmbAlign"]').forEach((el) => {
        el.checked = el.value === (comp.alignment || 'middleCenter');
      });
      document.getElementById('hmbImage').value = comp.image || 'Home';
      document.getElementById('hmbImageBackStyle').value = comp.imageBackStyle || 'transparent';
      document.getElementById('hmbUseImageColor').checked = Boolean(comp.useImageColor);
      hmbSetColor('hmbImageColor', comp.imageColor || '#ffffff');
      document.getElementById('hmbUseImageBackColor').checked = Boolean(comp.useImageBackColor);
      hmbSetColor('hmbImageBackColor', comp.imageBackColor || '#001C38');
      document.getElementById('hmbImageBlink').checked = Boolean(comp.imageBlink);
      document.getElementById('hmbImageScaled').checked = Boolean(comp.imageScaled);
      document.querySelectorAll('#homeButtonForm input[name="hmbImageAlign"]').forEach((el) => {
        el.checked = el.value === (comp.imageAlignment || 'middleCenter');
      });
      document.getElementById('hmbHeight').value = comp.height ?? 80;
      document.getElementById('hmbWidth').value = comp.width ?? 80;
      document.getElementById('hmbTop').value = comp.top ?? 16;
      document.getElementById('hmbLeft').value = comp.left ?? 16;
      document.getElementById('hmbName').value = comp.name || 'HomeButton1';
      document.getElementById('hmbVisible').checked = comp.visible !== false;
      syncHomeFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readHomeButtonForm() {
    const caption = document.getElementById('hmbCaption')?.value || '';
    const captionColor = hmbGetColor('hmbCaptionColor');
    const sendPressTo = document.getElementById('hmbSendPressTo')?.value || 'objectWithFocus';
    return {
      type: 'HomeButton',
      name: document.getElementById('hmbName')?.value.trim() || 'HomeButton1',
      caption,
      label: caption,
      left: Number(document.getElementById('hmbLeft')?.value) || 0,
      top: Number(document.getElementById('hmbTop')?.value) || 0,
      width: Number(document.getElementById('hmbWidth')?.value) || 80,
      height: Number(document.getElementById('hmbHeight')?.value) || 80,
      visible: document.getElementById('hmbVisible')?.checked !== false,
      borderStyle: document.getElementById('hmbBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('hmbBorderWidth')?.value) || 1,
      borderUsesBackColor: Boolean(document.getElementById('hmbBorderUsesBackColor')?.checked),
      backStyle: document.getElementById('hmbBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('hmbPatternStyle')?.value || 'none',
      shape: document.getElementById('hmbShape')?.value || 'rectangle',
      useBackColor: true,
      backColor: hmbGetColor('hmbBackColor'),
      useBorderColor: true,
      borderColor: hmbGetColor('hmbBorderColor'),
      usePatternColor: true,
      patternColor: hmbGetColor('hmbPatternColor'),
      useHighlightColor: true,
      highlightColor: hmbGetColor('hmbHighlightColor'),
      blink: Boolean(document.getElementById('hmbBlink')?.checked),
      horizontalMargin: Number(document.getElementById('hmbHorizontalMargin')?.value) || 0,
      verticalMargin: Number(document.getElementById('hmbVerticalMargin')?.value) || 0,
      audio: document.getElementById('hmbAudio')?.checked !== false,
      sendPressTo,
      linkedObject: document.getElementById('hmbLinkedObject')?.value.trim() || '',
      fontFamily: document.getElementById('hmbFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('hmbFontSize')?.value) || 10,
      bold: document.getElementById('hmbBold')?.classList.contains('active'),
      italic: document.getElementById('hmbItalic')?.classList.contains('active'),
      underline: document.getElementById('hmbUnderline')?.classList.contains('active'),
      useCaptionColor: Boolean(document.getElementById('hmbUseCaptionColor')?.checked),
      captionColor,
      foreColor: captionColor,
      useForeColor: Boolean(document.getElementById('hmbUseCaptionColor')?.checked),
      useCaptionBackColor: Boolean(document.getElementById('hmbUseCaptionBackColor')?.checked),
      captionBackColor: hmbGetColor('hmbCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('hmbCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('hmbCaptionBackStyle')?.value || 'transparent',
      wordWrap: document.getElementById('hmbWordWrap')?.checked !== false,
      alignment: document.querySelector('#homeButtonForm input[name="hmbAlign"]:checked')?.value || 'middleCenter',
      image: document.getElementById('hmbImage')?.value.trim() || '',
      imageBackStyle: document.getElementById('hmbImageBackStyle')?.value || 'transparent',
      imageAlignment: document.querySelector('#homeButtonForm input[name="hmbImageAlign"]:checked')?.value || 'middleCenter',
      useImageColor: Boolean(document.getElementById('hmbUseImageColor')?.checked),
      imageColor: hmbGetColor('hmbImageColor'),
      useImageBackColor: Boolean(document.getElementById('hmbUseImageBackColor')?.checked),
      imageBackColor: hmbGetColor('hmbImageBackColor'),
      imageBlink: Boolean(document.getElementById('hmbImageBlink')?.checked),
      imageScaled: Boolean(document.getElementById('hmbImageScaled')?.checked)
    };
  }

  async function showHomeButtonDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Home Button');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initHomeButtonDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultHomeButtonComponent({
        name: nextHomeButtonName(canvas?.components),
        ...overrides
      });
      fillHomeButtonForm(comp);
      window.resetPropsDialogState('home', readHomeButtonForm, 'applyHomeButton');
      switchTab('general');
      wireHomeButtonTools();
      presentHomeButtonDialog();
      const previewComp = readHomeButtonForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readHomeButtonForm, 'applyHomeButton');
    } catch (err) {
      window.setStatus(`Home Button properties error: ${err.message}`);
    }
  }

  async function applyHomeButton() {
    const comp = readHomeButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readHomeButtonForm, 'applyHomeButton');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveHomeButton(e) {
    e.preventDefault();
    const comp = readHomeButtonForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    hmbDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('homeButtonDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertHmbCaptionText(text) {
    const area = document.getElementById('hmbCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleHomeLivePreview();
  }

  function insertHmbCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertHmbCaptionText(tag);
    });
  }

  function hideHmbInsertVariableMenu() {
    document.getElementById('hmbInsertVariableMenu')?.classList.add('hidden');
  }

  function listBrowsableObjects() {
    const selfName = document.getElementById('hmbName')?.value.trim();
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
    const dlg = document.getElementById('hmbObjectBrowserDialog');
    if (!dlg) return;
    try { dlg.close(); } catch (_) {
      dlg.removeAttribute('open');
      dlg.style.display = 'none';
    }
  }

  function openObjectBrowser() {
    const dlg = document.getElementById('hmbObjectBrowserDialog');
    const list = document.getElementById('hmbObjectBrowserList');
    if (!dlg || !list) return;
    const items = listBrowsableObjects();
    const current = document.getElementById('hmbLinkedObject')?.value.trim() || '';
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
    const list = document.getElementById('hmbObjectBrowserList');
    const name = list?.value?.trim();
    if (name) {
      document.getElementById('hmbLinkedObject').value = name;
      scheduleHomeLivePreview();
      window.flushPropsApplyButton?.(readHomeButtonForm, 'applyHomeButton');
    }
    closeObjectBrowser();
  }

  function initHomeButtonDialog() {
    const form = document.getElementById('homeButtonForm');
    if (!form || form.dataset.hmbWired === '1') return;
    window.StudioPropsShared?.fillPatternSelect('hmbPatternStyle', 'hmbFilled');
    form.addEventListener('submit', (e) => saveHomeButton(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyHomeButton')?.addEventListener('click', () => {
      applyHomeButton().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleHomeLivePreview();
      window.flushPropsApplyButton?.(readHomeButtonForm, 'applyHomeButton');
    });
    form.addEventListener('change', () => {
      syncHomeFields();
      scheduleHomeLivePreview();
      window.flushPropsApplyButton?.(readHomeButtonForm, 'applyHomeButton');
    });
    document.getElementById('cancelHomeButton')?.addEventListener('click', () => {
      if (!hmbDialogCommitted) window.revertPropsDialogPreview?.();
      hmbDialogCommitted = true;
      document.getElementById('homeButtonDialog')?.close();
    });
    document.getElementById('homeButtonDialog')?.addEventListener('close', () => {
      if (hmbPreviewTimer) {
        clearTimeout(hmbPreviewTimer);
        hmbPreviewTimer = null;
      }
      hideHmbInsertVariableMenu();
      closeObjectBrowser();
      if (!hmbDialogCommitted) window.revertPropsDialogPreview?.();
      hmbDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpHomeButton')?.addEventListener('click', () => {
      alert('Home Button sends Home to the object with focus, or to a linked input object.');
    });
    document.querySelectorAll('#homeButtonDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        hideHmbInsertVariableMenu();
        switchTab(tab.dataset.hmbTab);
      });
    });
    document.getElementById('hmbBrowseLinkedObject')?.addEventListener('click', () => {
      if (document.getElementById('hmbBrowseLinkedObject')?.disabled) return;
      openObjectBrowser();
    });
    document.getElementById('hmbObjectBrowserOk')?.addEventListener('click', acceptObjectBrowser);
    document.getElementById('hmbObjectBrowserList')?.addEventListener('dblclick', acceptObjectBrowser);
    document.getElementById('hmbObjectBrowserCancel')?.addEventListener('click', closeObjectBrowser);
    document.getElementById('hmbObjectBrowserHelp')?.addEventListener('click', () => {
      alert('Select a display object to receive the Home press. Input objects are listed first when present.');
    });
    document.getElementById('hmbBrowseImage')?.addEventListener('click', () => {
      window.showImageBrowserDialog?.({ selectedFileName: document.getElementById('hmbImage')?.value || null })
        .then((fileName) => {
          if (!fileName) return;
          document.getElementById('hmbImage').value = fileName;
          scheduleHomeLivePreview();
        })
        .catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    document.getElementById('hmbInsertVariable')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('hmbInsertVariableMenu')?.classList.toggle('hidden');
    });
    document.getElementById('hmbInsertVariableMenu')?.addEventListener('click', (e) => {
      const kind = e.target?.dataset?.hmbVar;
      if (!kind) return;
      hideHmbInsertVariableMenu();
      if (kind === 'timedate') insertHmbCaptionText('{#dt}');
      else insertHmbCaptionTag();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('#homeButtonDialog .ft-insert-var-wrap');
      if (wrap && !wrap.contains(e.target)) hideHmbInsertVariableMenu();
    });
    document.getElementById('hmbShape')?.addEventListener('change', () => {
      if (document.getElementById('hmbShape')?.value !== 'circle') return;
      const w = Number(document.getElementById('hmbWidth')?.value) || 0;
      const h = Number(document.getElementById('hmbHeight')?.value) || 0;
      const size = Math.max(1, Math.min(w, h) || Math.max(w, h));
      document.getElementById('hmbWidth').value = String(size);
      document.getElementById('hmbHeight').value = String(size);
    });
    for (const id of ['hmbBold', 'hmbItalic', 'hmbUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleHomeLivePreview();
      });
    }
    form.dataset.hmbWired = '1';
  }

  window.StudioHomeButton = {
    initHomeButtonDialog,
    presentHomeButtonDialog,
    scheduleHomeLivePreview,
    showHomeButtonDialog,
    fillHomeButtonForm,
    readHomeButtonForm,
    switchHomeButtonTab: switchTab,
    wireHomeButtonTools,
    nextHomeButtonName,
    defaultHomeButtonComponent,
    applyHomeButton
  };
})();
