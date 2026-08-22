/** Tag browser + FactoryTalk-style expression editor for Studio property dialogs. */
(function () {
  let tagCache = [];
  let tagPickTarget = null;
  let exprPickTarget = null;
  let tagBrowserOnSelect = null;

  function $(id) {
    return document.getElementById(id);
  }

  function formatFtTagRef(tagName) {
    const s = String(tagName || '').trim();
    if (!s) return '';
    if (s.startsWith('PLC uploded Tags.')) return `{[PLC]${s.slice('PLC uploded Tags.'.length)}}`;
    return s;
  }

  function parseFtTagRef(ref) {
    const s = String(ref || '').trim();
    const m = s.match(/^\{\[PLC\](.+)\}$/);
    if (!m) return { tag: s };
    const inner = m[1];
    const bitMatch = inner.match(/^(.+)\.(\d+)$/);
    if (bitMatch) {
      return { tag: `PLC uploded Tags.${bitMatch[1]}`, bit: Number(bitMatch[2]) };
    }
    return { tag: `PLC uploded Tags.${inner}` };
  }

  async function loadProjectTags() {
    const project = window.StudioState?.activeProject;
    if (!project) return [];
    try {
      const res = await fetch(`/api/runtime/tags?project=${encodeURIComponent(project)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Object.entries(data).map(([name, t]) => ({
        name,
        type: t.type || '',
        description: t.description || '',
        value: t.value
      })).sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }

  function renderTagBrowserList(filter = '') {
    const list = $('tagBrowserList');
    if (!list) return;
    const q = filter.trim().toLowerCase();
    const rows = tagCache.filter((t) => !q || t.name.toLowerCase().includes(q)
      || (t.description || '').toLowerCase().includes(q));
    if (!rows.length) {
      list.innerHTML = '<tr><td colspan="3" class="tag-browser-empty">No tags match.</td></tr>';
      return;
    }
    list.innerHTML = rows.map((t) => (
      `<tr class="tag-browser-row" data-tag-name="${escapeAttr(t.name)}" tabindex="0">`
      + `<td>${escapeHtml(t.name)}</td>`
      + `<td>${escapeHtml(t.type)}</td>`
      + `<td>${escapeHtml(t.description || '')}</td>`
      + '</tr>'
    )).join('');
    list.querySelectorAll('.tag-browser-row').forEach((row) => {
      row.addEventListener('dblclick', () => selectTag(row.dataset.tagName));
      row.addEventListener('click', () => {
        list.querySelectorAll('.tag-browser-row').forEach((r) => r.classList.remove('selected'));
        row.classList.add('selected');
        $('tagBrowserSelected').textContent = row.dataset.tagName;
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  async function openTagBrowser(targetInput, onSelect) {
    tagPickTarget = targetInput;
    tagBrowserOnSelect = onSelect || null;
    tagCache = await loadProjectTags();
    $('tagBrowserFilter').value = '';
    $('tagBrowserSelected').textContent = targetInput?.value?.trim() || '';
    renderTagBrowserList('');
    $('tagBrowserDialog')?.showModal();
    $('tagBrowserFilter')?.focus();
  }

  function confirmTagBrowser() {
    const sel = $('tagBrowserSelected')?.textContent?.trim();
    if (!sel) return;
    if (tagBrowserOnSelect) {
      tagBrowserOnSelect(sel);
      tagBrowserOnSelect = null;
      $('tagBrowserDialog')?.close();
      return;
    }
    selectTag(sel);
  }

  function selectTag(name) {
    if (!tagPickTarget || !name) return;
    tagPickTarget.value = name;
    tagPickTarget.dispatchEvent(new Event('input', { bubbles: true }));
    tagPickTarget.dispatchEvent(new Event('change', { bubbles: true }));
    $('tagBrowserDialog')?.close();
    tagPickTarget = null;
  }

  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? start;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    textarea.value = before + text + after;
    const pos = start + text.length;
    textarea.selectionStart = textarea.selectionEnd = pos;
    textarea.focus();
    updateExprCursorPos(textarea);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function updateExprCursorPos(textarea) {
    const val = textarea.value.slice(0, textarea.selectionStart ?? 0);
    const lines = val.split('\n');
    $('exprEditorLine').textContent = String(lines.length);
    $('exprEditorColumn').textContent = String(lines[lines.length - 1].length + 1);
  }

  function openExpressionEditor(targetInput, initial) {
    exprPickTarget = targetInput;
    const ta = $('exprEditorText');
    if (!ta) return;
    let val = initial ?? targetInput?.value ?? '';
    if (val && !String(val).startsWith('=') && window.ExpressionEval?.isExpression(val)) {
      val = `=${val}`;
    }
    ta.value = val;
    $('exprEditorStatus').textContent = '';
    $('exprEditorStatus').className = 'expr-editor-status';
    updateExprCursorPos(ta);
    $('expressionEditorDialog')?.showModal();
    ta.focus();
  }

  function applyExpression() {
    const ta = $('exprEditorText');
    if (!exprPickTarget || !ta) return;
    let val = ta.value.trim();
    if (val && window.ExpressionEval) {
      const check = ExpressionEval.checkSyntax(val);
      if (!check.ok) {
        $('exprEditorStatus').textContent = check.message;
        $('exprEditorStatus').className = 'expr-editor-status error';
        return;
      }
    }
    exprPickTarget.value = val;
    exprPickTarget.dispatchEvent(new Event('input', { bubbles: true }));
    exprPickTarget.dispatchEvent(new Event('change', { bubbles: true }));
    $('expressionEditorDialog')?.close();
    exprPickTarget = null;
  }

  function wirePickButtons() {
    document.querySelectorAll('[data-tag-pick]').forEach((btn) => {
      if (btn.dataset.tagPickWired === '1') return;
      btn.dataset.tagPickWired = '1';
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-tag-pick');
        const input = $(id);
        if (input) openTagBrowser(input);
      });
    });
    document.querySelectorAll('[data-expr-pick]').forEach((btn) => {
      if (btn.dataset.exprPickWired === '1') return;
      btn.dataset.exprPickWired = '1';
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-expr-pick');
        const input = $(id);
        if (input) openExpressionEditor(input, input.value);
      });
    });
  }

  function init() {
    $('tagBrowserOk')?.addEventListener('click', confirmTagBrowser);
    $('tagBrowserCancel')?.addEventListener('click', () => {
      tagPickTarget = null;
      tagBrowserOnSelect = null;
      $('tagBrowserDialog')?.close();
    });
    $('tagBrowserFilter')?.addEventListener('input', (e) => {
      renderTagBrowserList(e.target.value);
    });

    $('exprEditorOk')?.addEventListener('click', applyExpression);
    $('exprEditorCancel')?.addEventListener('click', () => {
      exprPickTarget = null;
      $('expressionEditorDialog')?.close();
    });
    $('exprEditorCheck')?.addEventListener('click', () => {
      const ta = $('exprEditorText');
      if (!ta || !window.ExpressionEval) return;
      const check = ExpressionEval.checkSyntax(ta.value);
      $('exprEditorStatus').textContent = check.message;
      $('exprEditorStatus').className = `expr-editor-status ${check.ok ? 'ok' : 'error'}`;
    });
    $('exprEditorTags')?.addEventListener('click', async () => {
      const ta = $('exprEditorText');
      await openTagBrowser(null, (sel) => {
        if (ta) insertAtCursor(ta, `tags.get('${sel}', False)`);
      });
    });

    const inserts = {
      exprEditorIf: "1 if tags.get('TagName', False) else 0",
      exprEditorLogicalAnd: ' and ',
      exprEditorLogicalOr: ' or ',
      exprEditorLogicalNot: 'not ',
      exprEditorRelEq: ' == ',
      exprEditorRelNe: ' != ',
      exprEditorRelLt: ' < ',
      exprEditorRelGt: ' > ',
      exprEditorArithAdd: ' + ',
      exprEditorArithSub: ' - ',
      exprEditorArithMul: ' * ',
      exprEditorArithDiv: ' / '
    };
    Object.entries(inserts).forEach(([id, text]) => {
      $(id)?.addEventListener('click', () => {
        const ta = $('exprEditorText');
        if (ta) insertAtCursor(ta, text);
      });
    });
    $('exprEditorFunctions')?.addEventListener('click', () => {
      const ta = $('exprEditorText');
      if (ta) insertAtCursor(ta, "tags.get('TagName', False)");
    });

    const ta = $('exprEditorText');
    ta?.addEventListener('keyup', () => updateExprCursorPos(ta));
    ta?.addEventListener('click', () => updateExprCursorPos(ta));

    wirePickButtons();
  }

  window.StudioTagTools = {
    init,
    openTagBrowser,
    openExpressionEditor,
    wirePickButtons,
    formatFtTagRef,
    parseFtTagRef
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
