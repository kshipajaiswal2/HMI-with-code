/** FactoryTalk View ME-style Data Log Models editor. */
(function () {
  const INTERVAL_UNITS = [
    ['hundredths', 'Hundredths'],
    ['tenths', 'Tenths'],
    ['seconds', 'Seconds'],
    ['minutes', 'Minutes'],
    ['hours', 'Hours'],
    ['days', 'Days']
  ];

  let models = {};
  let editingName = '';
  let dirty = false;
  let bound = false;
  let persistOnClose = true;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function defaultModel() {
    return {
      description: 'Untitled data log model',
      maxDataPoints: 1000,
      pathMode: 'system',
      customPath: '',
      triggerType: 'periodic',
      interval: 10,
      intervalUnit: 'seconds',
      tags: []
    };
  }

  function normalizeModel(raw) {
    const base = defaultModel();
    if (!raw || typeof raw !== 'object') return base;
    const unit = String(raw.intervalUnit || raw.unit || base.intervalUnit).toLowerCase();
    const known = INTERVAL_UNITS.some(([id]) => id === unit);
    const tags = Array.isArray(raw.tags)
      ? raw.tags.map((t) => String(t || '').trim()).filter(Boolean)
      : String(raw.tags || '').split(/\s+/).map((t) => t.trim()).filter(Boolean);
    const maxPts = Number(raw.maxDataPoints ?? raw.maximumDataPoints ?? base.maxDataPoints);
    return {
      description: String(raw.description ?? base.description),
      maxDataPoints: Number.isFinite(maxPts) && maxPts > 0 ? Math.round(maxPts) : 1000,
      pathMode: raw.pathMode === 'custom' || raw.loggingPath === 'custom' ? 'custom' : 'system',
      customPath: String(raw.customPath || raw.path || ''),
      triggerType: raw.triggerType === 'onchange' || raw.trigger === 'onchange' ? 'onchange' : 'periodic',
      interval: Number.isFinite(Number(raw.interval)) && Number(raw.interval) > 0 ? Number(raw.interval) : 10,
      intervalUnit: known ? unit : 'seconds',
      tags: [...new Set(tags)]
    };
  }

  function normalizeModels(raw) {
    const out = {};
    if (!raw) return out;
    if (Array.isArray(raw)) {
      for (const item of raw) {
        const name = String(item?.name || '').trim();
        if (name) out[name] = normalizeModel(item);
      }
      return out;
    }
    if (typeof raw === 'object') {
      for (const [name, model] of Object.entries(raw)) {
        out[String(name)] = normalizeModel(model);
      }
    }
    return out;
  }

  function loadFromProject() {
    models = normalizeModels(window.state?.projectConfig?.dataLogModels);
  }

  function listNames() {
    loadFromProject();
    return Object.keys(models).filter((n) => n && n !== 'Untitled').sort((a, b) => a.localeCompare(b));
  }

  function captionText() {
    const name = editingName && editingName !== 'Untitled' ? editingName : 'Untitled';
    const project = window.state?.activeProject || '';
    return `${name} - /${project}/ (Data Log Models)`;
  }

  function currentModel() {
    if (!editingName) editingName = 'Untitled';
    if (!models[editingName]) models[editingName] = defaultModel();
    return models[editingName];
  }

  function isPristine(model) {
    const d = defaultModel();
    const m = model || {};
    return m.description === d.description
      && Number(m.maxDataPoints) === d.maxDataPoints
      && (m.pathMode || 'system') === 'system'
      && !String(m.customPath || '').trim()
      && (m.triggerType || 'periodic') === 'periodic'
      && Number(m.interval) === d.interval
      && (m.intervalUnit || 'seconds') === 'seconds'
      && !(m.tags || []).length;
  }

  function uniqueModelName(base = 'DataLog1') {
    if (!models[base]) return base;
    const stem = String(base).replace(/\d+$/, '') || 'DataLog';
    let n = Number(String(base).match(/(\d+)$/)?.[1] || 1);
    let name = base;
    while (models[name]) {
      n += 1;
      name = `${stem}${n}`;
    }
    return name;
  }

  function payload() {
    const out = {};
    for (const [name, model] of Object.entries(models)) {
      if (name === 'Untitled' && isPristine(model)) continue;
      out[name] = normalizeModel(model);
    }
    return out;
  }

  function switchTab(name) {
    const dlg = $('dataLogModelDialog');
    if (!dlg) return;
    dlg.querySelectorAll('.dialog-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === name);
    });
    dlg.querySelectorAll('[data-tab-panel]').forEach((panel) => {
      panel.classList.toggle('active', panel.getAttribute('data-tab-panel') === name);
    });
  }

  function harvest() {
    const model = currentModel();
    model.description = $('dlDescription')?.value ?? model.description;
    model.maxDataPoints = Number($('dlMaxPoints')?.value) || 1000;
    model.pathMode = $('dlPathCustom')?.checked ? 'custom' : 'system';
    model.customPath = $('dlCustomPath')?.value || '';
    model.triggerType = $('dlTriggerOnChange')?.checked ? 'onchange' : 'periodic';
    model.interval = Number($('dlInterval')?.value) || 10;
    model.intervalUnit = $('dlIntervalUnit')?.value || 'seconds';
    const list = $('dlTagList');
    if (list) {
      model.tags = [...list.options].map((opt) => opt.value).filter(Boolean);
    }
    return model;
  }

  function fillUnits() {
    const sel = $('dlIntervalUnit');
    if (!sel) return;
    const current = sel.value || currentModel().intervalUnit || 'seconds';
    sel.innerHTML = INTERVAL_UNITS.map(([id, label]) => (
      `<option value="${id}"${id === current ? ' selected' : ''}>${label}</option>`
    )).join('');
  }

  function renderTags() {
    const list = $('dlTagList');
    const count = $('dlTagCount');
    if (!list) return;
    const tags = currentModel().tags || [];
    const selected = new Set([...list.selectedOptions].map((opt) => opt.value));
    list.innerHTML = tags.map((tag) => (
      `<option value="${escapeHtml(tag)}"${selected.has(tag) ? ' selected' : ''}>${escapeHtml(tag)}</option>`
    )).join('');
    if (count) count.textContent = `${tags.length} Tag(s) in the model`;
  }

  function writeForm() {
    const model = currentModel();
    const title = $('dataLogModelTitle');
    if (title) title.textContent = captionText();
    if ($('dlModelName')) $('dlModelName').textContent = editingName && editingName !== 'Untitled' ? editingName : 'Untitled';
    if ($('dlDescription')) $('dlDescription').value = model.description || '';
    if ($('dlMaxPoints')) $('dlMaxPoints').value = model.maxDataPoints || 1000;
    if ($('dlPathSystem')) $('dlPathSystem').checked = model.pathMode !== 'custom';
    if ($('dlPathCustom')) $('dlPathCustom').checked = model.pathMode === 'custom';
    if ($('dlCustomPath')) {
      $('dlCustomPath').value = model.customPath || '';
      $('dlCustomPath').disabled = model.pathMode !== 'custom';
    }
    if ($('dlTriggerPeriodic')) $('dlTriggerPeriodic').checked = model.triggerType !== 'onchange';
    if ($('dlTriggerOnChange')) $('dlTriggerOnChange').checked = model.triggerType === 'onchange';
    fillUnits();
    if ($('dlInterval')) $('dlInterval').value = model.interval || 10;
    syncTriggerEnabled();
    if ($('dlTagsToAdd')) $('dlTagsToAdd').value = '';
    renderTags();
  }

  function syncTriggerEnabled() {
    const onChange = $('dlTriggerOnChange')?.checked;
    const interval = $('dlInterval');
    const unit = $('dlIntervalUnit');
    const box = $('dlPeriodicBox');
    if (interval) interval.disabled = Boolean(onChange);
    if (unit) unit.disabled = Boolean(onChange);
    if (box) box.classList.toggle('is-disabled', Boolean(onChange));
  }

  function markDirty() {
    dirty = true;
  }

  async function persist({ refreshTree } = {}) {
    const project = window.state?.activeProject;
    if (!project) return false;
    harvest();
    if (editingName === 'Untitled' && !isPristine(models.Untitled)) {
      const name = uniqueModelName('DataLog1');
      models[name] = models.Untitled;
      delete models.Untitled;
      editingName = name;
    }
    await window.fetchJson(`/api/projects/${encodeURIComponent(project)}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataLogModels: payload() })
    });
    await window.refreshProjectConfig?.();
    loadFromProject();
    dirty = false;
    writeForm();
    if (refreshTree && typeof window.loadExplorer === 'function') {
      await window.loadExplorer(project);
    }
    return true;
  }

  function parseTagsToAdd() {
    return String($('dlTagsToAdd')?.value || '')
      .split(/[\s,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function addTags(extra) {
    const model = currentModel();
    const incoming = [...parseTagsToAdd(), ...(extra || [])];
    if (!incoming.length) return;
    const set = new Set(model.tags || []);
    incoming.forEach((tag) => set.add(tag));
    model.tags = [...set];
    if ($('dlTagsToAdd')) $('dlTagsToAdd').value = '';
    markDirty();
    renderTags();
  }

  function removeSelectedTags() {
    const list = $('dlTagList');
    if (!list) return;
    const selected = new Set([...list.selectedOptions].map((opt) => opt.value));
    if (!selected.size) return;
    const model = currentModel();
    model.tags = (model.tags || []).filter((tag) => !selected.has(tag));
    markDirty();
    renderTags();
  }

  function removeAllTags() {
    const model = currentModel();
    if (!(model.tags || []).length) return;
    model.tags = [];
    markDirty();
    renderTags();
  }

  function browseAddTags() {
    if (!window.StudioTagTools) return;
    window.StudioTagTools.openTagBrowser($('dlTagsToAdd'), (sel) => {
      const input = $('dlTagsToAdd');
      if (input) {
        const cur = input.value.trim();
        input.value = cur ? `${cur} ${sel}` : sel;
      }
    });
  }

  async function closeEditor() {
    persistOnClose = true;
    try {
      if (dirty || (editingName === 'Untitled' && !isPristine(currentModel()))) {
        await persist({ refreshTree: true });
      }
    } catch (err) {
      window.setStatus?.(`Error: ${err.message}`);
      return;
    }
    persistOnClose = false;
    $('dataLogModelDialog')?.close();
    persistOnClose = true;
  }

  async function saveOpenEditor() {
    const dlg = $('dataLogModelDialog');
    if (!dlg?.open) return false;
    await persist({ refreshTree: true });
    window.setStatus?.(`Saved ${captionText()}`);
    return true;
  }

  async function showEditor(options = {}) {
    if (!window.state?.activeProject) {
      window.setStatus?.('Open an application first');
      return;
    }
    await window.refreshProjectConfig?.();
    loadFromProject();
    let name = String(options.name || '').trim();
    if (options.untitled || !name) name = 'Untitled';
    editingName = name;
    if (!models[editingName]) models[editingName] = defaultModel();
    dirty = false;
    persistOnClose = true;
    bindOnce();
    writeForm();
    switchTab(options.tab || 'setup');
    $('dataLogModelDialog')?.showModal();
    window.setStatus?.(captionText());
    requestAnimationFrame(() => $('dlDescription')?.focus());
  }

  async function deleteModel(name) {
    const key = String(name || '').trim();
    if (!key || key === 'Untitled') return false;
    if (!window.confirm(`Delete data log model "${key}"?`)) return false;
    await window.refreshProjectConfig?.();
    loadFromProject();
    delete models[key];
    if (editingName === key) editingName = '';
    dirty = true;
    await persist({ refreshTree: true });
    if ($('dataLogModelDialog')?.open) $('dataLogModelDialog').close();
    window.setStatus?.(`Deleted data log model: ${key}`);
    return true;
  }

  function bindOnce() {
    if (bound) return;
    bound = true;
    const dlg = $('dataLogModelDialog');
    dlg?.querySelectorAll('.dialog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        harvest();
        switchTab(tab.getAttribute('data-tab'));
      });
    });
    dlg?.addEventListener('input', () => {
      harvest();
      markDirty();
      syncTriggerEnabled();
      if ($('dlCustomPath')) $('dlCustomPath').disabled = !$('dlPathCustom')?.checked;
    });
    dlg?.addEventListener('change', () => {
      harvest();
      markDirty();
      syncTriggerEnabled();
      if ($('dlCustomPath')) $('dlCustomPath').disabled = !$('dlPathCustom')?.checked;
    });
    $('dlAddTags')?.addEventListener('click', () => addTags());
    $('dlRemoveTags')?.addEventListener('click', removeSelectedTags);
    $('dlRemoveAllTags')?.addEventListener('click', removeAllTags);
    $('dlTagsBrowse')?.addEventListener('click', browseAddTags);
    $('dlTagsToAdd')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTags();
      }
    });
    $('dataLogModelClose')?.addEventListener('click', () => {
      closeEditor().catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('dataLogModelHelp')?.addEventListener('click', () => {
      alert(
        'Data Log Models\n\n'
        + 'Setup: model name, description, and maximum stored data points.\n'
        + 'Paths: system default or a custom folder for log files.\n'
        + 'Log Triggers: sample periodically or when a tag in the model changes.\n'
        + 'Tags in Model: tags recorded by this model (space-separated, then Add).\n\n'
        + 'Models are stored in project.json (dataLogModels) and sampled at runtime.'
      );
    });
    dlg?.addEventListener('close', () => {
      if (!persistOnClose) return;
      if (dirty || (editingName === 'Untitled' && models.Untitled && !isPristine(models.Untitled))) {
        persist({ refreshTree: true }).catch((err) => window.setStatus?.(`Error: ${err.message}`));
      }
    });
  }

  window.StudioDataLog = {
    showEditor,
    saveOpenEditor,
    deleteModel,
    listNames
  };
})();
