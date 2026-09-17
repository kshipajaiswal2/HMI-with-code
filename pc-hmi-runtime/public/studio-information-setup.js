/** FactoryTalk View ME-style Information Setup. */
(function () {
  const HOLD_TIMES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const UPDATE_RATES = [1, 2, 5, 10, 60, 120];
  const CONNECTIONS = [
    ['value', 'Value'],
    ['ack', 'Ack']
  ];

  let working = defaultSetup();
  let dirty = false;
  let editingMessageFile = '';

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function defaultSetup() {
    return {
      displayFile: '[INFORMATION]',
      messageFile: '',
      ackHoldTimeSec: 3,
      maxUpdateRateSec: 1,
      connections: { value: '', ack: '' },
      messageFiles: {}
    };
  }

  function normalizeSetup(raw) {
    const base = defaultSetup();
    if (!raw || typeof raw !== 'object') return base;
    const connections = { ...base.connections, ...(raw.connections || {}) };
    const messageFiles = {};
    const srcFiles = raw.messageFiles && typeof raw.messageFiles === 'object' ? raw.messageFiles : {};
    for (const [name, rows] of Object.entries(srcFiles)) {
      messageFiles[name] = normalizeMessages(rows);
    }
    if (Array.isArray(raw.messages) && raw.messages.length && raw.messageFile) {
      const key = String(raw.messageFile);
      if (!messageFiles[key]) messageFiles[key] = normalizeMessages(raw.messages);
    }
    return {
      displayFile: String(raw.displayFile ?? base.displayFile),
      messageFile: String(raw.messageFile ?? ''),
      ackHoldTimeSec: HOLD_TIMES.includes(Number(raw.ackHoldTimeSec)) ? Number(raw.ackHoldTimeSec) : 3,
      maxUpdateRateSec: UPDATE_RATES.includes(Number(raw.maxUpdateRateSec)) ? Number(raw.maxUpdateRateSec) : 1,
      connections,
      messageFiles
    };
  }

  function normalizeMessages(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((row, index) => ({
      value: row?.value == null || row.value === '' ? index + 1 : row.value,
      message: String(row?.message || row?.text || '')
    }));
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function markDirty() {
    dirty = true;
    const apply = $('infoSetupApply');
    if (apply) apply.disabled = false;
  }

  function fillHoldSelect(el, selected) {
    if (!el) return;
    el.innerHTML = HOLD_TIMES.map((n) => {
      const label = n === 1 ? '1 second' : `${n} seconds`;
      const sel = Number(selected) === n ? ' selected' : '';
      return `<option value="${n}"${sel}>${label}</option>`;
    }).join('');
  }

  function fillRateSelect(el, selected) {
    if (!el) return;
    el.innerHTML = UPDATE_RATES.map((n) => {
      const sel = Number(selected) === n ? ' selected' : '';
      return `<option value="${n}"${sel}>${n}</option>`;
    }).join('');
  }

  function renderConnections() {
    const body = $('infoConnBody');
    if (!body) return;
    body.innerHTML = CONNECTIONS.map(([key, name]) => `
      <tr>
        <td class="as-conn-name">${escapeHtml(name)}</td>
        <td><input type="text" data-info-conn="${escapeHtml(key)}" value="${escapeHtml(working.connections[key] || '')}" /></td>
        <td class="as-conn-btn"><button type="button" class="ft-mini-btn" data-info-tag="1" title="Browse tags">...</button></td>
        <td class="as-conn-btn"><button type="button" class="ft-mini-btn" data-info-expr="1" title="Expression editor">...</button></td>
      </tr>
    `).join('');
  }

  function harvest() {
    if ($('informationSetupDialog')?.open) {
      working.displayFile = $('infoDisplayFile')?.value.trim() || '[INFORMATION]';
      working.messageFile = $('infoMessageFile')?.value.trim() || '';
      working.ackHoldTimeSec = Number($('infoHoldTime')?.value) || 3;
      working.maxUpdateRateSec = Number($('infoUpdateRate')?.value) || 1;
      working.connections = working.connections || { value: '', ack: '' };
      for (const [key] of CONNECTIONS) {
        const input = document.querySelector(`#infoConnTable input[data-info-conn="${key}"]`);
        if (input) working.connections[key] = input.value.trim();
      }
    }
    return clone(working);
  }

  function writeForm() {
    if ($('infoDisplayFile')) $('infoDisplayFile').value = working.displayFile || '[INFORMATION]';
    if ($('infoMessageFile')) $('infoMessageFile').value = working.messageFile || '';
    fillHoldSelect($('infoHoldTime'), working.ackHoldTimeSec);
    fillRateSelect($('infoUpdateRate'), working.maxUpdateRateSec);
    renderConnections();
    const apply = $('infoSetupApply');
    if (apply) apply.disabled = !dirty;
  }

  async function persist(setup, { close } = {}) {
    const project = window.state?.activeProject;
    if (!project) {
      window.setStatus?.('Open an application first');
      return false;
    }
    const normalized = normalizeSetup(setup);
    for (const [name, rows] of Object.entries(normalized.messageFiles || {})) {
      normalized.messageFiles[name] = compactMessages(rows);
    }
    if (normalized.messageFile === 'Untitled' && !normalized.messageFiles.Untitled?.length) {
      delete normalized.messageFiles.Untitled;
      normalized.messageFile = '';
    }
    await window.fetchJson(`/api/projects/${encodeURIComponent(project)}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ informationSetup: normalized })
    });
    await window.refreshProjectConfig?.();
    dirty = false;
    const apply = $('infoSetupApply');
    if (apply) apply.disabled = true;
    window.setStatus?.(document.querySelector('.info-msg-editor') ? messageFileTitle() : 'Information Setup saved');
    if (close) {
      $('informationSetupDialog')?.close();
    }
    return true;
  }

  function loadWorking() {
    working = normalizeSetup(window.state?.projectConfig?.informationSetup);
    dirty = false;
  }

  async function showInformationSetupDialog() {
    initInformationSetupDialog();
    if (!window.state?.activeProject) {
      window.setStatus?.('Open an application first');
      return;
    }
    await window.refreshProjectConfig?.();
    loadWorking();
    const title = $('informationSetupTitle');
    if (title) title.textContent = `Information Setup - /${window.state.activeProject}/`;
    writeForm();
    $('informationSetupDialog')?.showModal();
  }

  function pickInto(input) {
    if (!input || !window.StudioTagTools) return;
    window.StudioTagTools.openTagBrowser(input);
  }

  function exprInto(input) {
    if (!input || !window.StudioTagTools) return;
    window.StudioTagTools.openExpressionEditor(input, input.value);
  }

  async function pickDisplayFile() {
    const current = $('infoDisplayFile')?.value.trim() || '';
    const picked = await window.showDisplayPickerDialog?.(current.startsWith('[') ? '' : current);
    if (picked) {
      $('infoDisplayFile').value = picked;
      markDirty();
    }
  }

  async function pickMessageFile() {
    const names = Object.keys(working.messageFiles || {}).sort((a, b) => a.localeCompare(b));
    const picked = await window.showDisplayPickerDialog?.($('infoMessageFile')?.value.trim() || '', {
      kind: 'information-messages',
      items: names.map((id) => ({ id, title: id }))
    });
    if (picked) {
      $('infoMessageFile').value = picked;
      if (!working.messageFiles[picked]) working.messageFiles[picked] = [];
      markDirty();
    }
  }

  function editDisplayFile() {
    const id = $('infoDisplayFile')?.value.trim();
    if (!id || id.startsWith('[')) {
      window.setStatus?.('Built-in information display — create a graphic named Information to edit it');
      return;
    }
    if (typeof window.loadScreenInWorkspace === 'function') {
      window.loadScreenInWorkspace(id);
    } else {
      window.setStatus?.(`Display: ${id}`);
    }
  }

  function currentMessageFileName() {
    return $('infoMessageFile')?.value.trim() || working.messageFile || '';
  }

  function ensureMessageFile(name, { makeCurrent } = {}) {
    const key = String(name || '').trim();
    if (!key) return '';
    if (!working.messageFiles[key]) working.messageFiles[key] = [];
    if (makeCurrent !== false) {
      working.messageFile = key;
      if ($('infoMessageFile')) $('infoMessageFile').value = key;
    }
    return key;
  }

  function compactMessages(rows) {
    return (rows || []).filter((row) => String(row?.value ?? '').trim() !== '' || String(row?.message ?? '').trim() !== '');
  }

  function messageFileTitle() {
    const name = editingMessageFile && editingMessageFile !== 'Untitled' ? editingMessageFile : 'Untitled';
    const project = window.state?.activeProject || '';
    return `${name} - /${project}/ (Information messages)`;
  }

  function sheetRowCount() {
    const data = working.messageFiles[editingMessageFile] || [];
    let lastFilled = 0;
    data.forEach((row, i) => {
      if (String(row?.value ?? '').trim() || String(row?.message ?? '').trim()) lastFilled = i + 1;
    });
    return Math.max(lastFilled + 1, 1);
  }

  function ensureSheetRow(index) {
    if (!editingMessageFile) editingMessageFile = 'Untitled';
    if (!working.messageFiles[editingMessageFile]) working.messageFiles[editingMessageFile] = [];
    const rows = working.messageFiles[editingMessageFile];
    while (rows.length <= index) rows.push({ value: '', message: '' });
    return rows[index];
  }

  function renderInfoMessagesSheet() {
    const body = document.getElementById('infoMsgSheetBody');
    const caption = document.getElementById('infoMsgCaption');
    if (caption) caption.textContent = messageFileTitle();
    if (!body) return;
    const data = working.messageFiles[editingMessageFile] || [];
    const count = sheetRowCount();
    body.innerHTML = Array.from({ length: count }, (_, index) => {
      const row = data[index] || { value: '', message: '' };
      return `<tr data-info-msg="${index}">
        <td class="info-msg-num">${index + 1}</td>
        <td class="info-msg-value"><input type="text" data-info-msg-field="value" value="${escapeHtml(row.value)}" /></td>
        <td class="info-msg-text"><input type="text" data-info-msg-field="message" value="${escapeHtml(row.message)}" /></td>
      </tr>`;
    }).join('');
  }

  function focusSheetCell(rowIndex, field) {
    const input = document.querySelector(`#infoMsgSheetBody tr[data-info-msg="${rowIndex}"] input[data-info-msg-field="${field}"]`);
    input?.focus();
    input?.select();
  }

  function onSheetInput(e) {
    const field = e.target.getAttribute('data-info-msg-field');
    const rowEl = e.target.closest('tr[data-info-msg]');
    if (!field || !rowEl) return;
    const index = Number(rowEl.dataset.infoMsg);
    const row = ensureSheetRow(index);
    row[field] = e.target.value;
    markDirty();
    const needed = sheetRowCount();
    const current = document.querySelectorAll('#infoMsgSheetBody tr').length;
    if (needed !== current) {
      const activeField = field;
      const activeIndex = index;
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      renderInfoMessagesSheet();
      const input = document.querySelector(`#infoMsgSheetBody tr[data-info-msg="${activeIndex}"] input[data-info-msg-field="${activeField}"]`);
      if (input) {
        input.focus();
        try { input.setSelectionRange(start, end); } catch { /* ignore */ }
      }
    }
    scheduleMessageSave();
  }

  function onSheetKeydown(e) {
    const field = e.target.getAttribute('data-info-msg-field');
    const rowEl = e.target.closest('tr[data-info-msg]');
    if (!field || !rowEl) return;
    const index = Number(rowEl.dataset.infoMsg);
    if (e.key === 'Enter') {
      e.preventDefault();
      ensureSheetRow(index + 1);
      renderInfoMessagesSheet();
      focusSheetCell(index + 1, field);
    } else if (e.key === 'Tab' && !e.shiftKey && field === 'message') {
      e.preventDefault();
      ensureSheetRow(index + 1);
      renderInfoMessagesSheet();
      focusSheetCell(index + 1, 'value');
    } else if (e.key === 'Tab' && e.shiftKey && field === 'value' && index > 0) {
      e.preventDefault();
      focusSheetCell(index - 1, 'message');
    }
  }

  let saveTimer = null;
  function scheduleMessageSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persist(harvest(), { close: false }).catch((err) => window.setStatus?.(`Error: ${err.message}`));
    }, 700);
  }

  async function saveOpenEditor() {
    const panel = document.getElementById('panelView');
    if (!panel || panel.classList.contains('hidden') || !panel.querySelector('.info-msg-editor')) return false;
    clearTimeout(saveTimer);
    if (editingMessageFile && working.messageFiles[editingMessageFile]) {
      working.messageFiles[editingMessageFile] = compactMessages(working.messageFiles[editingMessageFile]);
    }
    await persist(harvest(), { close: false });
    renderInfoMessagesSheet();
    window.setStatus?.(`Saved ${messageFileTitle()}`);
    return true;
  }

  async function showInformationMessagesEditor(options = {}) {
    initInformationSetupDialog();
    if (!window.state?.activeProject) {
      window.setStatus?.('Open an application first');
      return;
    }
    const setupOpen = Boolean($('informationSetupDialog')?.open);
    if (setupOpen) {
      harvest();
      $('informationSetupDialog')?.close();
    } else {
      await window.refreshProjectConfig?.();
      loadWorking();
    }

    let name = String(options.fileName || currentMessageFileName() || '').trim();
    if (options.untitled || !name) name = 'Untitled';
    editingMessageFile = ensureMessageFile(name, { makeCurrent: !options.untitled });
    if (!working.messageFiles[editingMessageFile]?.length) {
      working.messageFiles[editingMessageFile] = [{ value: '', message: '' }];
    }

    window.hidePreviewStage?.();
    const panelView = document.getElementById('panelView');
    if (!panelView) return;
    panelView.classList.remove('hidden');
    panelView.innerHTML = `
      <div class="panel-content info-msg-editor">
        <div class="info-msg-caption" id="infoMsgCaption">${escapeHtml(messageFileTitle())}</div>
        <div class="info-msg-sheet-wrap">
          <table class="info-msg-sheet" id="infoMsgSheet">
            <colgroup>
              <col class="info-msg-col-num" />
              <col class="info-msg-col-value" />
              <col class="info-msg-col-text" />
            </colgroup>
            <thead>
              <tr>
                <th class="info-msg-num"></th>
                <th>Trigger Value</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody id="infoMsgSheetBody"></tbody>
          </table>
        </div>
      </div>`;
    renderInfoMessagesSheet();
    panelView.querySelector('#infoMsgSheetBody')?.addEventListener('input', onSheetInput);
    panelView.querySelector('#infoMsgSheetBody')?.addEventListener('keydown', onSheetKeydown);
    window.setStatus?.(messageFileTitle());
    requestAnimationFrame(() => focusSheetCell(0, 'value'));
  }

  async function showInformationMessagesDialog(fileName, options = {}) {
    return showInformationMessagesEditor({ fileName, untitled: options.newRow });
  }

  function initInformationSetupDialog() {
    const dlg = $('informationSetupDialog');
    if (!dlg || dlg.dataset.infoWired === '1') return;
    dlg.dataset.infoWired = '1';

    $('informationSetupForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      persist(harvest(), { close: true }).catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('informationSetupForm')?.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      if (e.target?.closest?.('.dialog-actions')) return;
      e.preventDefault();
    });
    $('infoSetupCancel')?.addEventListener('click', () => dlg.close());
    $('infoSetupApply')?.addEventListener('click', () => {
      persist(harvest(), { close: false }).catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('infoSetupHelp')?.addEventListener('click', () => {
      alert(
        'Information Setup\n\n'
        + 'Display file name: graphic shown for information messages ([INFORMATION] is the built-in display).\n'
        + 'Message file name: the information message list evaluated from the Value connection.\n'
        + 'Acknowledge hold time and Maximum Update Rate control how the display refreshes.\n'
        + 'Value is the trigger; Ack acknowledges the current information message.'
      );
    });

    $('infoDisplayFile')?.addEventListener('input', markDirty);
    $('infoMessageFile')?.addEventListener('input', markDirty);
    $('infoHoldTime')?.addEventListener('change', markDirty);
    $('infoUpdateRate')?.addEventListener('change', markDirty);
    $('infoDisplayBrowse')?.addEventListener('click', () => {
      pickDisplayFile().catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('infoDisplayEdit')?.addEventListener('click', editDisplayFile);
    $('infoMessageBrowse')?.addEventListener('click', () => {
      pickMessageFile().catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('infoMessageEdit')?.addEventListener('click', () => {
      const name = currentMessageFileName();
      showInformationMessagesEditor({ fileName: name || undefined, untitled: !name });
    });

    dlg.addEventListener('click', (e) => {
      const tagBtn = e.target.closest('[data-info-tag]');
      const exprBtn = e.target.closest('[data-info-expr]');
      if (!tagBtn && !exprBtn) return;
      const input = e.target.closest('tr')?.querySelector('input[data-info-conn]');
      if (!input) return;
      if (tagBtn) pickInto(input);
      else exprInto(input);
      markDirty();
    });
    dlg.addEventListener('input', (e) => {
      if (e.target.matches?.('input[data-info-conn]')) markDirty();
    });
  }

  window.StudioInformationSetup = {
    initInformationSetupDialog,
    showInformationSetupDialog,
    showInformationMessagesDialog,
    showInformationMessagesEditor,
    saveOpenEditor
  };
})();
