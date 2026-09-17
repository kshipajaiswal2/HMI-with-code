/** FactoryTalk View ME-style Macro editor (Logic and Control → Macros). */
(function () {
  let macros = {};
  let editingName = '';
  let dirty = false;
  let saveTimer = null;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function normalizeSteps(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => ({
      tag: String(row?.tag || row?.destination || '').trim(),
      expression: String(row?.expression || row?.value || row?.expr || '')
    }));
  }

  function normalizeMacros(raw) {
    const out = {};
    if (!raw) return out;
    if (Array.isArray(raw)) {
      for (const item of raw) {
        const name = String(item?.name || '').trim();
        if (name) out[name] = normalizeSteps(item.steps || item.rows || []);
      }
      return out;
    }
    if (typeof raw === 'object') {
      for (const [name, steps] of Object.entries(raw)) {
        out[String(name)] = normalizeSteps(steps);
      }
    }
    return out;
  }

  function compactSteps(rows) {
    return (rows || []).filter((row) => String(row?.tag || '').trim() !== '' || String(row?.expression || '').trim() !== '');
  }

  function loadFromProject() {
    macros = normalizeMacros(window.state?.projectConfig?.macros);
  }

  function captionText() {
    const name = editingName && editingName !== 'Untitled' ? editingName : 'Untitled';
    const project = window.state?.activeProject || '';
    return `${name} - /${project}/ (Macro)`;
  }

  function sheetRowCount() {
    const data = macros[editingName] || [];
    let lastFilled = 0;
    data.forEach((row, i) => {
      if (String(row?.tag || '').trim() || String(row?.expression || '').trim()) lastFilled = i + 1;
    });
    return Math.max(lastFilled + 1, 1);
  }

  function ensureRow(index) {
    if (!editingName) editingName = 'Untitled';
    if (!macros[editingName]) macros[editingName] = [];
    const rows = macros[editingName];
    while (rows.length <= index) rows.push({ tag: '', expression: '' });
    return rows[index];
  }

  function renderSheet() {
    const body = $('macroSheetBody');
    const caption = $('macroCaption');
    if (caption) caption.textContent = captionText();
    if (!body) return;
    const data = macros[editingName] || [];
    const count = sheetRowCount();
    body.innerHTML = Array.from({ length: count }, (_, index) => {
      const row = data[index] || { tag: '', expression: '' };
      return `<tr data-macro-row="${index}">
        <td class="info-msg-num">${index + 1}</td>
        <td class="macro-tag"><input type="text" data-macro-field="tag" value="${escapeHtml(row.tag)}" /></td>
        <td class="macro-expr"><input type="text" data-macro-field="expression" value="${escapeHtml(row.expression)}" /></td>
      </tr>`;
    }).join('');
  }

  function focusCell(rowIndex, field) {
    const input = document.querySelector(`#macroSheetBody tr[data-macro-row="${rowIndex}"] input[data-macro-field="${field}"]`);
    input?.focus();
    input?.select();
  }

  function restoreCaret(index, field, start, end) {
    const input = document.querySelector(`#macroSheetBody tr[data-macro-row="${index}"] input[data-macro-field="${field}"]`);
    if (!input) return;
    input.focus();
    try { input.setSelectionRange(start, end); } catch { /* ignore */ }
  }

  function onSheetInput(e) {
    const field = e.target.getAttribute('data-macro-field');
    const rowEl = e.target.closest('tr[data-macro-row]');
    if (!field || !rowEl) return;
    const index = Number(rowEl.dataset.macroRow);
    const row = ensureRow(index);
    row[field] = e.target.value;
    dirty = true;
    const needed = sheetRowCount();
    const current = document.querySelectorAll('#macroSheetBody tr').length;
    if (needed !== current) {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      renderSheet();
      restoreCaret(index, field, start, end);
    }
    scheduleSave();
  }

  function onSheetKeydown(e) {
    const field = e.target.getAttribute('data-macro-field');
    const rowEl = e.target.closest('tr[data-macro-row]');
    if (!field || !rowEl) return;
    const index = Number(rowEl.dataset.macroRow);
    if (e.key === 'Enter') {
      e.preventDefault();
      ensureRow(index + 1);
      renderSheet();
      focusCell(index + 1, field);
    } else if (e.key === 'Tab' && !e.shiftKey && field === 'expression') {
      e.preventDefault();
      ensureRow(index + 1);
      renderSheet();
      focusCell(index + 1, 'tag');
    } else if (e.key === 'Tab' && e.shiftKey && field === 'tag' && index > 0) {
      e.preventDefault();
      focusCell(index - 1, 'expression');
    } else if (e.key === 'F2' || (e.altKey && e.key === 't')) {
      e.preventDefault();
      pickTag(e.target);
    }
  }

  function onSheetDblClick(e) {
    const field = e.target.getAttribute('data-macro-field');
    if (field === 'tag') pickTag(e.target);
    else if (field === 'expression') pickExpr(e.target);
  }

  function pickTag(input) {
    if (!input || !window.StudioTagTools) return;
    window.StudioTagTools.openTagBrowser(null, (sel) => {
      const formatted = window.StudioTagTools.formatFtTagRef?.(sel) || sel;
      input.value = formatted;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  function pickExpr(input) {
    if (!input || !window.StudioTagTools) return;
    window.StudioTagTools.openExpressionEditor(input, input.value);
    input.addEventListener('input', () => {
      dirty = true;
      scheduleSave();
    }, { once: true });
  }

  function uniqueMacroName(base) {
    let name = base;
    let n = 1;
    while (macros[name]) {
      n += 1;
      name = `${base.replace(/\d+$/, '')}${n}`;
    }
    return name;
  }

  function payload() {
    const out = {};
    for (const [name, steps] of Object.entries(macros)) {
      const compact = compactSteps(steps);
      if (name === 'Untitled' && !compact.length) continue;
      out[name] = compact;
    }
    return out;
  }

  async function persist({ refreshTree } = {}) {
    const project = window.state?.activeProject;
    if (!project) return false;
    await window.fetchJson(`/api/projects/${encodeURIComponent(project)}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ macros: payload() })
    });
    await window.refreshProjectConfig?.();
    dirty = false;
    if (refreshTree && typeof window.loadExplorer === 'function') {
      await window.loadExplorer(project);
    }
    return true;
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persist().then(() => window.setStatus?.(captionText())).catch((err) => window.setStatus?.(`Error: ${err.message}`));
    }, 700);
  }

  async function saveOpenEditor() {
    const panel = $('panelView');
    if (!panel || panel.classList.contains('hidden') || !panel.querySelector('.macro-editor')) return false;
    clearTimeout(saveTimer);
    if (editingName === 'Untitled' && compactSteps(macros.Untitled || []).length) {
      const name = uniqueMacroName('Macro1');
      macros[name] = macros.Untitled;
      delete macros.Untitled;
      editingName = name;
    }
    if (editingName && macros[editingName]) macros[editingName] = compactSteps(macros[editingName]);
    await persist({ refreshTree: true });
    renderSheet();
    window.setStatus?.(`Saved ${captionText()}`);
    return true;
  }

  async function showMacroEditor(options = {}) {
    if (!window.state?.activeProject) {
      window.setStatus?.('Open an application first');
      return;
    }
    await window.refreshProjectConfig?.();
    loadFromProject();
    let name = String(options.name || '').trim();
    if (options.untitled || !name) name = 'Untitled';
    editingName = name;
    if (!macros[editingName]) macros[editingName] = [{ tag: '', expression: '' }];
    if (!macros[editingName].length) macros[editingName].push({ tag: '', expression: '' });

    window.hidePreviewStage?.();
    const panelView = $('panelView');
    if (!panelView) return;
    panelView.classList.remove('hidden');
    panelView.innerHTML = `
      <div class="panel-content info-msg-editor macro-editor">
        <div class="info-msg-caption" id="macroCaption">${escapeHtml(captionText())}</div>
        <div class="info-msg-sheet-wrap">
          <table class="info-msg-sheet" id="macroSheet">
            <colgroup>
              <col class="info-msg-col-num" />
              <col class="macro-col-tag" />
              <col class="macro-col-expr" />
            </colgroup>
            <thead>
              <tr>
                <th class="info-msg-num"></th>
                <th>Tag</th>
                <th>Expression</th>
              </tr>
            </thead>
            <tbody id="macroSheetBody"></tbody>
          </table>
        </div>
      </div>`;
    renderSheet();
    const body = $('macroSheetBody');
    body?.addEventListener('input', onSheetInput);
    body?.addEventListener('keydown', onSheetKeydown);
    body?.addEventListener('dblclick', onSheetDblClick);
    window.setStatus?.(captionText() + ' — double-click Tag or Expression to browse');
    requestAnimationFrame(() => focusCell(0, 'tag'));
  }

  async function deleteMacro(name) {
    const key = String(name || '').trim();
    if (!key || key === 'Untitled') return false;
    if (!window.confirm(`Delete macro "${key}"?`)) return false;
    await window.refreshProjectConfig?.();
    loadFromProject();
    delete macros[key];
    if (editingName === key) editingName = '';
    await persist({ refreshTree: true });
    const panel = $('panelView');
    if (panel?.querySelector('.macro-editor')) {
      panel.innerHTML = '';
      panel.classList.add('hidden');
    }
    window.setStatus?.(`Deleted macro: ${key}`);
    return true;
  }

  window.StudioMacros = {
    showMacroEditor,
    saveOpenEditor,
    deleteMacro
  };
})();
