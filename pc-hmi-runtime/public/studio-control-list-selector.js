/** Control List Selector property dialog — a FactoryTalk-style multi-state list selector.
 * The operator cycles through a list of named states (click, or Up/Down/PageUp/PageDown when
 * Key navigation is on) and, when Write on enter is checked, must press-and-hold Enter to
 * commit the highlighted state — writing it to the Value tag, pulsing the Enter tag, and (if
 * an Enter Handshake tag is connected) waiting for PLC confirmation before treating the change
 * as final. See ComponentRegistry.ControlListSelector in components/registry.js for the actual
 * runtime state machine — this file is Studio's properties dialog only.
 */
(function () {
  let clsPreviewTimer = null;
  let clsDialogCommitted = false;

  // Per-state editing scratch state (save-on-switch pattern, mirrors studio-latched-multistate.js).
  let clsStatesDraft = null;
  let clsActiveStateId = 'State0';
  let clsStateClipboard = null;

  const CLS_MIN_STATES = 2;
  const CLS_MAX_STATES = 64;

  // Same timing option lists as Numeric Input Enable — kept identical for consistency across
  // every component in this codebase that has an Enter-key/handshake Timing tab.
  const CLS_CONTROL_DELAY = [
    [0, '0 msec'], [200, '200 msec'], [400, '400 msec'], [600, '600 msec'], [800, '800 msec'],
    [1000, '1 second'], [2000, '2 seconds'], [3000, '3 seconds'], [4000, '4 seconds'], [5000, '5 seconds']
  ];
  const CLS_HOLD_TIME = [
    [50, '50 msec'], [250, '250 msec'], [500, '500 msec'], [750, '750 msec'],
    [1000, '1 second'], [2000, '2 seconds'], [3000, '3 seconds'], [4000, '4 seconds'], [5000, '5 seconds']
  ];
  const CLS_HANDSHAKE_TIME = [
    [1000, '1 second'], [2000, '2 seconds'], [3000, '3 seconds'], [4000, '4 seconds'], [5000, '5 seconds'],
    [6000, '6 seconds'], [7000, '7 seconds'], [8000, '8 seconds'], [9000, '9 seconds'], [10000, '10 seconds'],
    [15000, '15 seconds'], [20000, '20 seconds'], [25000, '25 seconds'], [30000, '30 seconds'],
    [35000, '35 seconds'], [40000, '40 seconds'], [45000, '45 seconds'], [50000, '50 seconds'],
    [55000, '55 seconds'], [60000, '60 seconds']
  ];

  function switchTab(tabId) {
    document.querySelectorAll('#controlListSelectorDialog .dialog-tab').forEach((el) => {
      el.classList.toggle('active', el.dataset.clsTab === tabId);
    });
    document.querySelectorAll('#controlListSelectorDialog .dialog-tab-panel').forEach((el) => {
      el.classList.toggle('active', el.dataset.clsTabPanel === tabId);
    });
  }

  function clsGetColor(id) {
    return window.StudioPropsShared?.getColorFieldValue?.(id)
      || window.FtColorPicker?.getInputColor?.(document.getElementById(id))
      || document.getElementById(id)?.value
      || '#001C38';
  }

  function clsSetColor(id, raw) {
    if (window.StudioPropsShared?.setColorFieldValue) window.StudioPropsShared.setColorFieldValue(id, raw);
    else if (window.FtColorPicker?.setValueSilent) window.FtColorPicker.setValueSilent(document.getElementById(id), raw);
    else if (document.getElementById(id)) document.getElementById(id).value = raw;
  }

  function fillSelectOnce(id, filledKey, options, selected) {
    const el = document.getElementById(id);
    if (!el || el.dataset[filledKey] === '1') return;
    el.dataset[filledKey] = '1';
    el.innerHTML = options.map(([value, label]) => (
      `<option value="${value}"${String(value) === String(selected) ? ' selected' : ''}>${label}</option>`
    )).join('');
  }

  function fillClsStaticSelects() {
    fillSelectOnce('clsEnterKeyControlDelay', 'clsFilled', CLS_CONTROL_DELAY, 400);
    fillSelectOnce('clsEnterKeyHoldTime', 'clsHoldFilled', CLS_HOLD_TIME, 250);
    fillSelectOnce('clsEnterKeyHandshakeTime', 'clsHsFilled', CLS_HANDSHAKE_TIME, 4000);
  }

  function mapHandshakeReset(raw) {
    const v = String(raw || 'nonZeroValue');
    if (v === 'zeroValue' || v === 'zeroToNonZero') return 'zeroToNonZero';
    return 'nonZeroValue';
  }

  function nextControlListSelectorName(components) {
    const n = (components || []).filter((c) => c.type === 'ControlListSelector').length + 1;
    return `ControlListSelector${n}`;
  }

  // Groups came from PlantHMI's 2026-09-03 GroupService rebuild — populate the Authorized Group
  // dropdown from the project's real groups (state.projectConfig.groups, same source Studio's
  // Runtime Security panel uses) rather than hardcoding the old, since-renamed
  // "Administrators/Operators/Supervisors" list every other E-Signature tab in this codebase
  // still carries. This is enforcement-inert either way (button-level authorizedGroup is not
  // enforced anywhere yet — see project notes), but there is no reason for a BRAND NEW dialog to
  // copy forward options that don't match any real group.
  function refreshClsAuthorizedGroupOptions(selectedValue) {
    const el = document.getElementById('clsAuthorizedGroup');
    if (!el) return;
    const groups = window.state?.projectConfig?.groups;
    const names = Array.isArray(groups) && groups.length
      ? groups.map((g) => g.name)
      : ['Administrators', 'Operators', 'Supervisors'];
    const want = selectedValue || el.value || names[0];
    el.innerHTML = names.map((n) => `<option${n === want ? ' selected' : ''}>${n}</option>`).join('');
    if (!names.includes(want) && want) {
      // Keep a saved value that no longer matches a real group visible/selectable rather than
      // silently swapping it out from under the user.
      el.insertAdjacentHTML('afterbegin', `<option selected>${want}</option>`);
    }
  }

  function defaultClsState(index) {
    return {
      id: `State${index}`,
      value: index,
      caption: `State${index}`,
      useCaptionColor: false,
      captionColor: '#ffffff',
      useCaptionBackColor: true,
      captionBackColor: '#001C38',
      captionBlink: false,
      captionBackStyle: 'transparent',
      alignment: 'center'
    };
  }

  function defaultControlListSelectorStates(count) {
    const states = [];
    for (let i = 0; i < count; i++) states.push(defaultClsState(i));
    return states;
  }

  function defaultControlListSelectorComponent(overrides = {}) {
    return {
      type: 'ControlListSelector',
      name: 'ControlListSelector1',
      tag: '',
      enterTag: '',
      enterHandshakeTag: '',
      numberOfStates: 5,
      states: defaultControlListSelectorStates(5),
      writeOnEnter: true,
      keyNavigation: true,
      wrapAround: true,
      enterKeyControlDelay: 400,
      enterKeyHoldTime: 250,
      enterKeyHandshakeTime: 4000,
      handshakeResetType: 'nonZeroValue',
      left: 192,
      top: 407,
      width: 87,
      height: 69,
      visible: true,
      borderStyle: 'line',
      borderWidth: 4,
      borderUsesBackColor: false,
      backStyle: 'solid',
      patternStyle: 'none',
      useBackColor: true,
      backColor: '#001C38',
      useBorderColor: true,
      borderColor: '#001C38',
      usePatternColor: false,
      patternColor: '#ffffff',
      useSelectionBackColor: true,
      selectionBackColor: '#bcd9ff',
      useSelectionForeColor: false,
      selectionForeColor: '#000000',
      blink: false,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      captionTruncate: 'word',
      requireESignature: false,
      allowBlankComment: false,
      requireReauth: false,
      requireCounterSig: false,
      authorizedGroup: 'Administrators',
      domainVisible: false,
      domainMode: 'name',
      domainName: '',
      domainVariable: '',
      domainDisable: false,
      ...overrides
    };
  }

  // ─── Per-state editor (States tab) ─────────────────────────────────────────

  function saveClsStateToDraft() {
    if (!clsStatesDraft) return;
    const idx = clsStatesDraft.findIndex((s) => s.id === clsActiveStateId);
    if (idx < 0) return;
    clsStatesDraft[idx] = {
      ...clsStatesDraft[idx],
      value: Number(document.getElementById('clsStateValue')?.value) || 0,
      caption: document.getElementById('clsStateCaption')?.value ?? '',
      useCaptionColor: Boolean(document.getElementById('clsStateUseCaptionColor')?.checked),
      captionColor: clsGetColor('clsStateCaptionColor'),
      useCaptionBackColor: Boolean(document.getElementById('clsStateUseCaptionBackColor')?.checked),
      captionBackColor: clsGetColor('clsStateCaptionBackColor'),
      captionBlink: Boolean(document.getElementById('clsStateCaptionBlink')?.checked),
      captionBackStyle: document.getElementById('clsStateCaptionBackStyle')?.value || 'transparent',
      alignment: document.querySelector('#controlListSelectorForm input[name="clsStateAlign"]:checked')?.value || 'center'
    };
  }

  function loadClsStateFromDraft(stateId) {
    const fallback = defaultClsState(Number(String(stateId).replace('State', '')) || 0);
    const state = clsStatesDraft?.find((s) => s.id === stateId) || fallback;
    clsActiveStateId = stateId;
    const valueEl = document.getElementById('clsStateValue');
    if (valueEl) valueEl.value = state.value ?? 0;
    const capEl = document.getElementById('clsStateCaption');
    if (capEl) capEl.value = state.caption ?? '';
    const useCapColor = document.getElementById('clsStateUseCaptionColor');
    if (useCapColor) useCapColor.checked = Boolean(state.useCaptionColor);
    clsSetColor('clsStateCaptionColor', state.captionColor || '#ffffff');
    const useCapBack = document.getElementById('clsStateUseCaptionBackColor');
    if (useCapBack) useCapBack.checked = state.useCaptionBackColor !== false;
    clsSetColor('clsStateCaptionBackColor', state.captionBackColor || '#001C38');
    const capBlink = document.getElementById('clsStateCaptionBlink');
    if (capBlink) capBlink.checked = Boolean(state.captionBlink);
    const capBackStyle = document.getElementById('clsStateCaptionBackStyle');
    if (capBackStyle) capBackStyle.value = state.captionBackStyle || 'transparent';
    document.querySelectorAll('#controlListSelectorForm input[name="clsStateAlign"]').forEach((el) => {
      el.checked = el.value === (state.alignment || 'center');
    });
    syncClsStateFieldDisables();
  }

  function switchClsState(stateId) {
    saveClsStateToDraft();
    loadClsStateFromDraft(stateId);
  }

  function rebuildClsStateSelect() {
    const sel = document.getElementById('clsStateSelect');
    if (!sel) return;
    sel.innerHTML = (clsStatesDraft || []).map((s) => `<option value="${s.id}">${s.id}</option>`).join('');
    const has = clsStatesDraft?.some((s) => s.id === clsActiveStateId);
    const target = has ? clsActiveStateId : (clsStatesDraft?.[0]?.id || 'State0');
    sel.value = target;
    loadClsStateFromDraft(target);
  }

  function syncClsStateCount(count) {
    const n = Math.max(CLS_MIN_STATES, Math.min(CLS_MAX_STATES, Math.round(count) || CLS_MIN_STATES));
    const draft = clsStatesDraft || [];
    const next = [];
    for (let i = 0; i < n; i++) {
      next.push(draft[i] ? { ...draft[i], id: `State${i}` } : defaultClsState(i));
    }
    clsStatesDraft = next;
    const numEl = document.getElementById('clsNumberOfStates');
    if (numEl) numEl.value = String(n);
    rebuildClsStateSelect();
  }

  function syncClsStateFieldDisables() {
    const capColor = document.getElementById('clsStateCaptionColor');
    if (capColor) capColor.disabled = !document.getElementById('clsStateUseCaptionColor')?.checked;
    const capBack = document.getElementById('clsStateCaptionBackColor');
    if (capBack) {
      capBack.disabled = !document.getElementById('clsStateUseCaptionBackColor')?.checked
        || document.getElementById('clsStateCaptionBackStyle')?.value === 'transparent';
    }
  }

  // ─── General-tab field disables / E-Signature ──────────────────────────────

  function syncClsESignatureFields() {
    const on = Boolean(document.getElementById('clsRequireESignature')?.checked);
    for (const id of [
      'clsAllowBlankComment', 'clsRequireReauth', 'clsRequireCounterSig', 'clsAuthorizedGroup',
      'clsDomainVisible', 'clsDomainNameMode', 'clsDomainVariableMode', 'clsDomainName',
      'clsDomainVariable', 'clsDomainBrowse', 'clsDomainDisable'
    ]) {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    }
  }

  function syncControlListSelectorFields() {
    const patColor = document.getElementById('clsPatternColor');
    if (patColor) patColor.disabled = !document.getElementById('clsUsePatternColor')?.checked;
    const selBack = document.getElementById('clsSelectionBackColor');
    if (selBack) selBack.disabled = !document.getElementById('clsUseSelectionBackColor')?.checked;
    const selFore = document.getElementById('clsSelectionForeColor');
    if (selFore) selFore.disabled = !document.getElementById('clsUseSelectionForeColor')?.checked;
    syncClsStateFieldDisables();
    syncClsESignatureFields();
  }

  // ─── Preview / present / wire ───────────────────────────────────────────────

  function scheduleControlListSelectorLivePreview() {
    if (window.state?.propsFormFill) return;
    if (clsPreviewTimer) clearTimeout(clsPreviewTimer);
    clsPreviewTimer = setTimeout(() => {
      clsPreviewTimer = null;
      if (!document.getElementById('controlListSelectorDialog')?.open) return;
      saveClsStateToDraft();
      const comp = readControlListSelectorForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
      else if (comp?.name) window.previewPatchByName?.(comp.name, comp);
      window.updatePropsApplyButton?.(readControlListSelectorForm, 'applyControlListSelector');
    }, 80);
  }

  function wireTools() {
    if (window.StudioTagTools) StudioTagTools.wirePickButtons();
    const dlg = document.getElementById('controlListSelectorDialog');
    if (window.FtColorPicker && dlg) {
      if (window.FtColorPicker.initAllSync) window.FtColorPicker.initAllSync(dlg);
      else window.FtColorPicker.initAll(dlg);
      window.FtColorPicker.refreshAll?.(dlg);
    }
    document.querySelectorAll('#controlListSelectorForm .ft-color-input').forEach((input) => {
      if (input.dataset.clsPreviewWired === '1') return;
      input.dataset.clsPreviewWired = '1';
      input.addEventListener('input', scheduleControlListSelectorLivePreview);
      input.addEventListener('change', scheduleControlListSelectorLivePreview);
    });
    syncControlListSelectorFields();
  }

  function presentControlListSelectorDialog() {
    const dialog = document.getElementById('controlListSelectorDialog');
    if (!dialog) {
      window.setStatus('Control List Selector Properties dialog is missing from Studio');
      return;
    }
    if (dialog.open) return;
    clsDialogCommitted = false;
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
        window.setStatus(`Opened Control List Selector properties without modal: ${err2.message}`);
      }
    }
  }

  function fillControlListSelectorForm(comp) {
    if (window.state) window.state.propsFormFill = true;
    try {
      fillClsStaticSelects();
      window.StudioPropsShared?.fillPatternSelect('clsPatternStyle', 'clsFilled');
      document.getElementById('clsBorderStyle').value = comp.borderStyle || 'line';
      document.getElementById('clsBorderWidth').value = comp.borderWidth ?? 4;
      document.getElementById('clsBackStyle').value = comp.backStyle || 'solid';
      const pat = document.getElementById('clsPatternStyle');
      if (pat) pat.value = comp.patternStyle || 'none';
      document.getElementById('clsBorderUsesBackColor').checked = Boolean(comp.borderUsesBackColor);
      clsSetColor('clsBackColor', comp.backColor || '#001C38');
      clsSetColor('clsBorderColor', comp.borderColor || '#001C38');
      const usePat = document.getElementById('clsUsePatternColor');
      if (usePat) usePat.checked = Boolean(comp.usePatternColor);
      clsSetColor('clsPatternColor', comp.patternColor || '#ffffff');
      const useSelBack = document.getElementById('clsUseSelectionBackColor');
      if (useSelBack) useSelBack.checked = comp.useSelectionBackColor !== false;
      clsSetColor('clsSelectionBackColor', comp.selectionBackColor || '#bcd9ff');
      const useSelFore = document.getElementById('clsUseSelectionForeColor');
      if (useSelFore) useSelFore.checked = Boolean(comp.useSelectionForeColor);
      clsSetColor('clsSelectionForeColor', comp.selectionForeColor || '#000000');
      const blink = document.getElementById('clsBlink');
      if (blink) blink.checked = Boolean(comp.blink);
      document.getElementById('clsFont').value = comp.fontFamily || 'Arial Unicode MS';
      document.getElementById('clsFontSize').value = String(comp.fontSize ?? 10);
      document.getElementById('clsBold').classList.toggle('active', Boolean(comp.bold));
      document.getElementById('clsItalic').classList.toggle('active', Boolean(comp.italic));
      document.getElementById('clsUnderline').classList.toggle('active', Boolean(comp.underline));
      document.querySelectorAll('#controlListSelectorForm input[name="clsCaptionTruncate"]').forEach((el) => {
        el.checked = el.value === (comp.captionTruncate || 'word');
      });
      document.getElementById('clsWriteOnEnter').checked = comp.writeOnEnter !== false;
      document.getElementById('clsKeyNavigation').checked = comp.keyNavigation !== false;
      document.getElementById('clsWrapAround').checked = comp.wrapAround !== false;

      const count = Math.max(CLS_MIN_STATES, Math.min(CLS_MAX_STATES, Number(comp.numberOfStates) || (comp.states || []).length || 5));
      document.getElementById('clsNumberOfStates').value = String(count);
      clsStatesDraft = [];
      for (let i = 0; i < count; i++) {
        const existing = (comp.states || [])[i];
        clsStatesDraft.push(existing ? { ...defaultClsState(i), ...existing, id: `State${i}` } : defaultClsState(i));
      }
      clsActiveStateId = clsStatesDraft[0]?.id || 'State0';
      rebuildClsStateSelect();
      const pasteBtn = document.getElementById('clsStatePaste');
      if (pasteBtn) pasteBtn.disabled = !clsStateClipboard;

      document.getElementById('clsEnterKeyControlDelay').value = String(comp.enterKeyControlDelay ?? 400);
      document.getElementById('clsEnterKeyHoldTime').value = String(comp.enterKeyHoldTime ?? 250);
      document.getElementById('clsEnterKeyHandshakeTime').value = String(comp.enterKeyHandshakeTime ?? 4000);
      document.getElementById('clsHandshakeResetType').value = mapHandshakeReset(comp.handshakeResetType);

      const reqSig = document.getElementById('clsRequireESignature');
      if (reqSig) reqSig.checked = Boolean(comp.requireESignature);
      const allowBlank = document.getElementById('clsAllowBlankComment');
      if (allowBlank) allowBlank.checked = Boolean(comp.allowBlankComment);
      const reauth = document.getElementById('clsRequireReauth');
      if (reauth) reauth.checked = Boolean(comp.requireReauth);
      const counter = document.getElementById('clsRequireCounterSig');
      if (counter) counter.checked = Boolean(comp.requireCounterSig);
      refreshClsAuthorizedGroupOptions(comp.authorizedGroup || 'Administrators');
      const domainVisible = document.getElementById('clsDomainVisible');
      if (domainVisible) domainVisible.checked = Boolean(comp.domainVisible);
      const domainNameMode = document.getElementById('clsDomainNameMode');
      const domainVarMode = document.getElementById('clsDomainVariableMode');
      if (domainNameMode) domainNameMode.checked = (comp.domainMode || 'name') !== 'variable';
      if (domainVarMode) domainVarMode.checked = (comp.domainMode || 'name') === 'variable';
      const domainName = document.getElementById('clsDomainName');
      if (domainName) domainName.value = comp.domainName || '';
      const domainVar = document.getElementById('clsDomainVariable');
      if (domainVar) domainVar.value = comp.domainVariable || '';
      const domainDisable = document.getElementById('clsDomainDisable');
      if (domainDisable) domainDisable.checked = Boolean(comp.domainDisable);

      document.getElementById('clsHeight').value = comp.height ?? 69;
      document.getElementById('clsWidth').value = comp.width ?? 87;
      document.getElementById('clsTop').value = comp.top ?? 407;
      document.getElementById('clsLeft').value = comp.left ?? 192;
      document.getElementById('clsName').value = comp.name || 'ControlListSelector1';
      document.getElementById('clsVisible').checked = comp.visible !== false;

      document.getElementById('clsTag').value = comp.tag || '';
      document.getElementById('clsEnterTag').value = comp.enterTag || '';
      document.getElementById('clsEnterHandshakeTag').value = comp.enterHandshakeTag || '';

      syncControlListSelectorFields();
    } finally {
      if (window.state) window.state.propsFormFill = false;
    }
  }

  function readControlListSelectorForm() {
    saveClsStateToDraft();
    return {
      type: 'ControlListSelector',
      name: document.getElementById('clsName')?.value.trim() || 'ControlListSelector1',
      tag: document.getElementById('clsTag')?.value.trim() || '',
      enterTag: document.getElementById('clsEnterTag')?.value.trim() || '',
      enterHandshakeTag: document.getElementById('clsEnterHandshakeTag')?.value.trim() || '',
      numberOfStates: (clsStatesDraft || []).length || 5,
      states: (clsStatesDraft || defaultControlListSelectorStates(5)).map((s) => ({ ...s })),
      writeOnEnter: document.getElementById('clsWriteOnEnter')?.checked !== false,
      keyNavigation: document.getElementById('clsKeyNavigation')?.checked !== false,
      wrapAround: document.getElementById('clsWrapAround')?.checked !== false,
      enterKeyControlDelay: Number(document.getElementById('clsEnterKeyControlDelay')?.value) || 400,
      enterKeyHoldTime: Number(document.getElementById('clsEnterKeyHoldTime')?.value) || 250,
      enterKeyHandshakeTime: Number(document.getElementById('clsEnterKeyHandshakeTime')?.value) || 4000,
      handshakeResetType: document.getElementById('clsHandshakeResetType')?.value || 'nonZeroValue',
      left: Number(document.getElementById('clsLeft')?.value) || 0,
      top: Number(document.getElementById('clsTop')?.value) || 0,
      width: Number(document.getElementById('clsWidth')?.value) || 87,
      height: Number(document.getElementById('clsHeight')?.value) || 69,
      visible: document.getElementById('clsVisible')?.checked !== false,
      borderStyle: document.getElementById('clsBorderStyle')?.value || 'line',
      borderWidth: Number(document.getElementById('clsBorderWidth')?.value) || 4,
      borderUsesBackColor: Boolean(document.getElementById('clsBorderUsesBackColor')?.checked),
      backStyle: document.getElementById('clsBackStyle')?.value || 'solid',
      patternStyle: document.getElementById('clsPatternStyle')?.value || 'none',
      useBackColor: true,
      backColor: clsGetColor('clsBackColor'),
      useBorderColor: true,
      borderColor: clsGetColor('clsBorderColor'),
      usePatternColor: Boolean(document.getElementById('clsUsePatternColor')?.checked),
      patternColor: clsGetColor('clsPatternColor'),
      useSelectionBackColor: Boolean(document.getElementById('clsUseSelectionBackColor')?.checked),
      selectionBackColor: clsGetColor('clsSelectionBackColor'),
      useSelectionForeColor: Boolean(document.getElementById('clsUseSelectionForeColor')?.checked),
      selectionForeColor: clsGetColor('clsSelectionForeColor'),
      blink: Boolean(document.getElementById('clsBlink')?.checked),
      fontFamily: document.getElementById('clsFont')?.value || 'Arial Unicode MS',
      fontSize: Number(document.getElementById('clsFontSize')?.value) || 10,
      bold: document.getElementById('clsBold')?.classList.contains('active'),
      italic: document.getElementById('clsItalic')?.classList.contains('active'),
      underline: document.getElementById('clsUnderline')?.classList.contains('active'),
      captionTruncate: document.querySelector('#controlListSelectorForm input[name="clsCaptionTruncate"]:checked')?.value || 'word',
      requireESignature: Boolean(document.getElementById('clsRequireESignature')?.checked),
      allowBlankComment: Boolean(document.getElementById('clsAllowBlankComment')?.checked),
      requireReauth: Boolean(document.getElementById('clsRequireReauth')?.checked),
      requireCounterSig: Boolean(document.getElementById('clsRequireCounterSig')?.checked),
      authorizedGroup: document.getElementById('clsAuthorizedGroup')?.value || 'Administrators',
      domainVisible: Boolean(document.getElementById('clsDomainVisible')?.checked),
      domainMode: document.querySelector('#controlListSelectorForm input[name="clsDomainMode"]:checked')?.value || 'name',
      domainName: document.getElementById('clsDomainName')?.value.trim() || '',
      domainVariable: document.getElementById('clsDomainVariable')?.value.trim() || '',
      domainDisable: Boolean(document.getElementById('clsDomainDisable')?.checked)
    };
  }

  async function showControlListSelectorDialog(overrides = {}) {
    if (!window.displayIsOpen?.()) {
      window.setStatus('Open a display first, then drag on the canvas to place the Control List Selector');
      return;
    }
    try {
      window.flushDeferredDialogInits?.();
      initControlListSelectorDialog();
      const canvas = await window.fetchOpenCanvas();
      const comp = defaultControlListSelectorComponent({
        name: nextControlListSelectorName(canvas?.components),
        ...overrides
      });
      fillControlListSelectorForm(comp);
      window.resetPropsDialogState('control-list', readControlListSelectorForm, 'applyControlListSelector');
      switchTab('general');
      wireTools();
      presentControlListSelectorDialog();
      const previewComp = readControlListSelectorForm();
      if (window.patchShapeLivePreview) window.patchShapeLivePreview(previewComp);
      else if (previewComp?.name) window.previewPatchByName?.(previewComp.name, previewComp);
      window.flushPropsApplyButton?.(readControlListSelectorForm, 'applyControlListSelector');
    } catch (err) {
      window.setStatus(`Control List Selector properties error: ${err.message}`);
    }
  }

  async function applyControlListSelector() {
    const comp = readControlListSelectorForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not apply — open a display or global object first');
      return;
    }
    window.commitPropsSnapshot(readControlListSelectorForm, 'applyControlListSelector');
    window.afterCanvasComponentSaved?.(comp);
    window.setStatus(`Applied ${comp.name}`);
  }

  async function saveControlListSelector(e) {
    e.preventDefault();
    const comp = readControlListSelectorForm();
    const ok = await window.upsertCanvasComponent(comp);
    if (!ok) {
      window.setStatus('Could not save — open a display or global object first');
      return;
    }
    clsDialogCommitted = true;
    const editIdx = window.state?.propsDialog?.editIndex;
    document.getElementById('controlListSelectorDialog').close();
    if (editIdx != null) window.state.canvasSelection.indices = [editIdx];
    window.setStatus(`Saved ${comp.name}`);
  }

  function insertClsCaptionText(text) {
    const area = document.getElementById('clsStateCaption');
    if (!area || !text) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    area.focus();
    const pos = start + text.length;
    area.setSelectionRange(pos, pos);
    scheduleControlListSelectorLivePreview();
  }

  function insertClsCaptionTag() {
    window.StudioTagTools?.openTagBrowser(null, (sel) => {
      const tag = typeof sel === 'string' ? sel : (sel?.name || sel?.tag || '');
      insertClsCaptionText(tag);
    });
  }

  function initControlListSelectorDialog() {
    const form = document.getElementById('controlListSelectorForm');
    if (!form || form.dataset.clsWired === '1') return;
    fillClsStaticSelects();
    window.StudioPropsShared?.fillPatternSelect('clsPatternStyle', 'clsFilled');
    form.addEventListener('submit', (e) => saveControlListSelector(e).catch((err) => window.setStatus(`Error: ${err.message}`)));
    document.getElementById('applyControlListSelector')?.addEventListener('click', () => {
      applyControlListSelector().catch((err) => window.setStatus(`Error: ${err.message}`));
    });
    form.addEventListener('input', () => {
      scheduleControlListSelectorLivePreview();
      window.flushPropsApplyButton?.(readControlListSelectorForm, 'applyControlListSelector');
    });
    form.addEventListener('change', () => {
      syncControlListSelectorFields();
      scheduleControlListSelectorLivePreview();
      window.flushPropsApplyButton?.(readControlListSelectorForm, 'applyControlListSelector');
    });
    document.getElementById('cancelControlListSelector')?.addEventListener('click', () => {
      document.getElementById('controlListSelectorDialog')?.close();
    });
    document.getElementById('controlListSelectorDialog')?.addEventListener('close', () => {
      if (clsPreviewTimer) {
        clearTimeout(clsPreviewTimer);
        clsPreviewTimer = null;
      }
      if (!clsDialogCommitted) window.revertPropsDialogPreview?.();
      clsDialogCommitted = false;
      window.clearPropsDialogState?.();
      window.activateSelectTool?.();
    });
    document.getElementById('helpControlListSelector')?.addEventListener('click', () => {
      alert('Control List Selector cycles through a named list of states. Click, or Up/Down/PageUp/PageDown when Key navigation is on, to highlight a state; when Write on enter is checked, press and hold Enter to commit it. Configure states, timing/handshake, and connections.');
    });
    document.querySelectorAll('#controlListSelectorDialog .dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.clsTab));
    });
    document.getElementById('clsStateSelect')?.addEventListener('change', (e) => {
      switchClsState(e.target.value);
      scheduleControlListSelectorLivePreview();
    });
    document.getElementById('clsNumberOfStates')?.addEventListener('change', (e) => {
      saveClsStateToDraft();
      syncClsStateCount(Number(e.target.value) || CLS_MIN_STATES);
      scheduleControlListSelectorLivePreview();
    });
    document.getElementById('clsInsertVariable')?.addEventListener('click', () => insertClsCaptionTag());
    document.getElementById('clsInsertState')?.addEventListener('click', () => {
      saveClsStateToDraft();
      const count = (clsStatesDraft || []).length;
      if (count >= CLS_MAX_STATES) return;
      syncClsStateCount(count + 1);
      switchClsState(`State${count}`);
      scheduleControlListSelectorLivePreview();
    });
    document.getElementById('clsDeleteState')?.addEventListener('click', () => {
      saveClsStateToDraft();
      const count = (clsStatesDraft || []).length;
      if (count <= CLS_MIN_STATES) return;
      clsStatesDraft = clsStatesDraft.filter((s) => s.id !== clsActiveStateId);
      syncClsStateCount(count - 1);
      scheduleControlListSelectorLivePreview();
    });
    document.getElementById('clsStateCopy')?.addEventListener('click', () => {
      saveClsStateToDraft();
      const state = clsStatesDraft?.find((s) => s.id === clsActiveStateId);
      if (state) {
        clsStateClipboard = { ...state };
        const pasteBtn = document.getElementById('clsStatePaste');
        if (pasteBtn) pasteBtn.disabled = false;
      }
    });
    document.getElementById('clsStatePaste')?.addEventListener('click', () => {
      if (!clsStateClipboard || !clsStatesDraft) return;
      saveClsStateToDraft();
      const idx = clsStatesDraft.findIndex((s) => s.id === clsActiveStateId);
      if (idx < 0) return;
      const keep = { id: clsStatesDraft[idx].id, value: clsStatesDraft[idx].value };
      clsStatesDraft[idx] = { ...clsStateClipboard, ...keep };
      loadClsStateFromDraft(clsActiveStateId);
      scheduleControlListSelectorLivePreview();
    });
    document.getElementById('clsRequireESignature')?.addEventListener('change', syncClsESignatureFields);
    for (const id of ['clsUsePatternColor', 'clsUseSelectionBackColor', 'clsUseSelectionForeColor']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncControlListSelectorFields();
        scheduleControlListSelectorLivePreview();
      });
    }
    for (const id of ['clsStateUseCaptionColor', 'clsStateUseCaptionBackColor', 'clsStateCaptionBackStyle']) {
      document.getElementById(id)?.addEventListener('change', () => {
        syncClsStateFieldDisables();
        scheduleControlListSelectorLivePreview();
      });
    }
    for (const id of ['clsBold', 'clsItalic', 'clsUnderline']) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.classList.toggle('active');
        scheduleControlListSelectorLivePreview();
      });
    }
    form.dataset.clsWired = '1';
  }

  window.StudioControlListSelector = {
    initControlListSelectorDialog,
    presentControlListSelectorDialog,
    scheduleControlListSelectorLivePreview,
    showControlListSelectorDialog,
    fillControlListSelectorForm,
    readControlListSelectorForm,
    switchControlListSelectorTab: switchTab,
    wireControlListSelectorTools: wireTools
  };
})();
