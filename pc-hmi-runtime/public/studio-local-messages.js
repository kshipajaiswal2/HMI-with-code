/** FactoryTalk View ME-style Local Messages spreadsheet. */
(function () {
  let files = {};
  let editingName = '';
  let saveTimer = null;

  function escapeHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function normalizeRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((row, index) => ({
      value: row?.value == null || row.value === '' ? '' : row.value,
      message: String(row?.message || row?.text || '')
    }));
  }

  function normalizeFiles(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    for (const [name, rows] of Object.entries(raw)) {
      if (!name) continue;
      out[String(name)] = normalizeRows(rows);
    }
    return out;
  }

  function compactRows(rows) {
    return (rows || []).filter((row) => String(row?.value ?? '').trim() !== '' || String(row?.message ?? '').trim() !== '');
  }

  function uniqueName(base) {
    const names = new Set(Object.keys(files).map((n) => n.toLowerCase()));
    if (!names.has(String(base).toLowerCase())) return base;
    let i = 1;
    while (names.has(`${base}${i}`.toLowerCase())) i += 1;
    return `${base}${i}`;
  }

  function loadFiles() {
    files = normalizeFiles(window.state?.projectConfig?.localMessages);
  }

  function caption() {
    const name = editingName && editingName !== 'Untitled' ? editingName : 'Untitled';
    const project = window.state?.activeProject || '';
    return `${name} - /${project}/ (Local messages)`;
  }

  function sheetRowCount() {
    const data = files[editingName] || [];
    let lastFilled = 0;
    data.forEach((row, i) => {
      if (String(row?.value ?? '').trim() || String(row?.message ?? '').trim()) lastFilled = i + 1;
    });
    return Math.max(lastFilled + 1, 1);
  }

  function ensureRow(index) {
    if (!editingName) editingName = 'Untitled';
    if (!files[editingName]) files[editingName] = [];
    const rows = files[editingName];
    while (rows.length <= index) rows.push({ value: '', message: '' });
    return rows[index];
  }

  function payload() {
    const out = {};
    for (const [name, rows] of Object.entries(files)) {
      const compact = compactRows(rows);
      if (name === 'Untitled' && !compact.length) continue;
      out[name] = compact;
    }
    return out;
  }

  async function persist({ refreshTree } = {}) {
    const project = window.state?.activeProject;
    if (!project) return false;
    if (editingName === 'Untitled' && compactRows(files.Untitled || []).length) {
      const name = uniqueName('LocalMsg1');
      files[name] = files.Untitled;
      delete files.Untitled;
      editingName = name;
    }
    await window.fetchJson(`/api/projects/${encodeURIComponent(project)}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localMessages: payload() })
    });
    await window.refreshProjectConfig?.();
    if (refreshTree && typeof window.loadExplorer === 'function') {
      await window.loadExplorer(project);
    }
    const cap = document.getElementById('localMsgCaption');
    if (cap) cap.textContent = caption();
    return true;
  }

  function renderSheet() {
    const body = document.getElementById('localMsgSheetBody');
    const cap = document.getElementById('localMsgCaption');
    if (cap) cap.textContent = caption();
    if (!body) return;
    const count = sheetRowCount();
    const rows = [];
    for (let i = 0; i < count; i += 1) {
      const row = ensureRow(i);
      rows.push(`
        <tr>
          <td class="info-msg-num">${i + 1}</td>
          <td><input type="text" data-lm-row="${i}" data-lm-field="value" value="${escapeHtml(row.value)}" /></td>
          <td><input type="text" data-lm-row="${i}" data-lm-field="message" value="${escapeHtml(row.message)}" /></td>
        </tr>`);
    }
    body.innerHTML = rows.join('');
  }

  function onSheetInput(e) {
    const input = e.target.closest('input[data-lm-row]');
    if (!input) return;
    const index = Number(input.dataset.lmRow);
    const field = input.dataset.lmField;
    const row = ensureRow(index);
    row[field] = input.value;
    if (index === sheetRowCount() - 1 && (row.value || row.message)) {
      ensureRow(index + 1);
      renderSheet();
      const next = document.querySelector(`#localMsgSheetBody input[data-lm-row="${index}"][data-lm-field="${field}"]`);
      next?.focus();
      if (next) {
        const end = next.value.length;
        next.setSelectionRange(end, end);
      }
    }
    scheduleSave();
  }

  function onSheetKeydown(e) {
    if (e.key !== 'Enter' && e.key !== 'Tab') return;
    const input = e.target.closest('input[data-lm-row]');
    if (!input) return;
    const index = Number(input.dataset.lmRow);
    const field = input.dataset.lmField;
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextField = field === 'value' ? 'message' : 'value';
      const nextIndex = field === 'message' ? index + 1 : index;
      ensureRow(nextIndex);
      renderSheet();
      document.querySelector(`#localMsgSheetBody input[data-lm-row="${nextIndex}"][data-lm-field="${nextField}"]`)?.focus();
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persist().catch((err) => window.setStatus?.(`Error: ${err.message}`));
    }, 700);
  }

  async function saveOpenEditor() {
    const panel = document.getElementById('panelView');
    if (!panel || panel.classList.contains('hidden') || !panel.querySelector('.local-msg-editor')) return false;
    clearTimeout(saveTimer);
    await persist({ refreshTree: true });
    renderSheet();
    window.setStatus?.(`Saved ${caption()}`);
    return true;
  }

  async function showEditor(options = {}) {
    if (!window.state?.activeProject) {
      window.setStatus?.('Open an application first');
      return;
    }
    await window.refreshProjectConfig?.();
    loadFiles();
    let name = String(options.name || '').trim();
    if (options.untitled || !name) name = 'Untitled';
    if (!files[name]) files[name] = [{ value: '', message: '' }];
    editingName = name;

    window.hidePreviewStage?.();
    const panelView = document.getElementById('panelView');
    if (!panelView) return;
    panelView.classList.remove('hidden');
    panelView.innerHTML = `
      <div class="panel-content info-msg-editor local-msg-editor">
        <div class="info-msg-caption" id="localMsgCaption">${escapeHtml(caption())}</div>
        <div class="info-msg-sheet-wrap">
          <table class="info-msg-sheet" id="localMsgSheet">
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
            <tbody id="localMsgSheetBody"></tbody>
          </table>
        </div>
      </div>`;
    renderSheet();
    panelView.querySelector('#localMsgSheetBody')?.addEventListener('input', onSheetInput);
    panelView.querySelector('#localMsgSheetBody')?.addEventListener('keydown', onSheetKeydown);
    window.setStatus?.(caption());
    requestAnimationFrame(() => {
      document.querySelector('#localMsgSheetBody input[data-lm-field="value"]')?.focus();
    });
  }

  async function deleteFile(name) {
    const key = String(name || '').trim();
    if (!key) return;
    if (!confirm(`Delete local message file "${key}"?`)) return;
    await window.refreshProjectConfig?.();
    loadFiles();
    delete files[key];
    if (editingName === key) editingName = '';
    await persist({ refreshTree: true });
    window.setStatus?.(`Deleted local message ${key}`);
  }

  window.StudioLocalMessages = {
    showEditor,
    saveOpenEditor,
    deleteFile
  };
})();
