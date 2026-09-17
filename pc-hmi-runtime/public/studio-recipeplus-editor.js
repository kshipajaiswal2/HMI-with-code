/** FactoryTalk View ME-style RecipePlus Editor. */
(function () {
  let files = {};
  let editingName = '';
  let dirty = false;
  let saveTimer = null;
  let activeTab = 'general';
  let selectedUnit = 0;
  let unitDialogMode = 'insert';

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function defaultRecipe() {
    return {
      runtimeName: '',
      statusTag: '',
      percentCompleteTag: '',
      nameAfterDownloadTag: '',
      dataSets: ['Data Set 1'],
      tagSets: ['Tag Set 1'],
      ingredients: [emptyIngredient(['Data Set 1'], ['Tag Set 1'])],
      units: [{ name: 'Unit 1', dataSet: 'Data Set 1', tagSet: 'Tag Set 1' }]
    };
  }

  function emptyIngredient(dataSets, tagSets) {
    const values = {};
    const tags = {};
    (dataSets || []).forEach((name) => { values[name] = ''; });
    (tagSets || []).forEach((name) => { tags[name] = ''; });
    return { name: '', type: 'Number', min: '', max: '', decimals: '', values, tags };
  }

  function normalizeIngredient(raw, dataSets, tagSets) {
    const row = emptyIngredient(dataSets, tagSets);
    if (!raw || typeof raw !== 'object') return row;
    row.name = String(raw.name || '');
    row.type = raw.type === 'String' ? 'String' : 'Number';
    row.min = raw.min == null ? '' : String(raw.min);
    row.max = raw.max == null ? '' : String(raw.max);
    row.decimals = raw.decimals == null ? '' : String(raw.decimals);
    const values = raw.values && typeof raw.values === 'object' ? raw.values : {};
    const tags = raw.tags && typeof raw.tags === 'object' ? raw.tags : {};
    dataSets.forEach((name) => { row.values[name] = String(values[name] ?? raw.value ?? ''); });
    tagSets.forEach((name) => { row.tags[name] = String(tags[name] ?? raw.tag ?? ''); });
    return row;
  }

  function normalizeRecipe(raw) {
    const base = defaultRecipe();
    if (!raw || typeof raw !== 'object') return base;
    const dataSets = Array.isArray(raw.dataSets) && raw.dataSets.length
      ? raw.dataSets.map((n) => String(n || '').trim()).filter(Boolean)
      : base.dataSets;
    const tagSets = Array.isArray(raw.tagSets) && raw.tagSets.length
      ? raw.tagSets.map((n) => String(n || '').trim()).filter(Boolean)
      : base.tagSets;
    const ingredients = Array.isArray(raw.ingredients)
      ? raw.ingredients.map((row) => normalizeIngredient(row, dataSets, tagSets))
      : [emptyIngredient(dataSets, tagSets)];
    const units = Array.isArray(raw.units) && raw.units.length
      ? raw.units.map((u, i) => ({
        name: String(u?.name || `Unit ${i + 1}`),
        dataSet: dataSets.includes(u?.dataSet) ? u.dataSet : dataSets[0],
        tagSet: tagSets.includes(u?.tagSet) ? u.tagSet : tagSets[0]
      }))
      : [{ name: 'Unit 1', dataSet: dataSets[0], tagSet: tagSets[0] }];
    return {
      runtimeName: String(raw.runtimeName || raw.name || ''),
      statusTag: String(raw.statusTag || ''),
      percentCompleteTag: String(raw.percentCompleteTag || ''),
      nameAfterDownloadTag: String(raw.nameAfterDownloadTag || ''),
      dataSets,
      tagSets,
      ingredients: ingredients.length ? ingredients : [emptyIngredient(dataSets, tagSets)],
      units
    };
  }

  function normalizeFiles(raw) {
    const out = {};
    if (!raw) return out;
    if (Array.isArray(raw)) {
      for (const item of raw) {
        const name = String(item?.name || '').trim();
        if (name) out[name] = normalizeRecipe(item);
      }
      return out;
    }
    if (typeof raw === 'object') {
      for (const [name, recipe] of Object.entries(raw)) out[String(name)] = normalizeRecipe(recipe);
    }
    return out;
  }

  function current() {
    if (!editingName) editingName = 'Untitled';
    if (!files[editingName]) files[editingName] = defaultRecipe();
    return files[editingName];
  }

  function ingredientFilled(row) {
    if (!row) return false;
    if (String(row.name || '').trim()) return true;
    if (String(row.min || '').trim() || String(row.max || '').trim() || String(row.decimals || '').trim()) return true;
    return Object.values(row.values || {}).some((v) => String(v || '').trim())
      || Object.values(row.tags || {}).some((v) => String(v || '').trim());
  }

  function compactIngredients(recipe) {
    const filled = (recipe.ingredients || []).filter(ingredientFilled);
    return filled.length ? filled : [emptyIngredient(recipe.dataSets, recipe.tagSets)];
  }

  function isPristine(recipe) {
    const d = defaultRecipe();
    const r = recipe || {};
    if (String(r.runtimeName || '').trim()) return false;
    if (String(r.statusTag || '').trim() || String(r.percentCompleteTag || '').trim() || String(r.nameAfterDownloadTag || '').trim()) return false;
    if ((r.dataSets || []).join('|') !== d.dataSets.join('|')) return false;
    if ((r.tagSets || []).join('|') !== d.tagSets.join('|')) return false;
    if ((r.ingredients || []).some(ingredientFilled)) return false;
    if ((r.units || []).length !== 1) return false;
    const unit = (r.units || [])[0] || {};
    return unit.name === 'Unit 1' && unit.dataSet === 'Data Set 1' && unit.tagSet === 'Tag Set 1';
  }

  function uniqueName(base = 'Recipe1') {
    if (!files[base]) return base;
    const stem = String(base).replace(/\d+$/, '') || 'Recipe';
    let n = Number(String(base).match(/(\d+)$/)?.[1] || 1);
    let name = base;
    while (files[name]) {
      n += 1;
      name = `${stem}${n}`;
    }
    return name;
  }

  function uniqueSetName(list, prefix) {
    let n = 1;
    let name = `${prefix} ${n}`;
    while (list.includes(name)) {
      n += 1;
      name = `${prefix} ${n}`;
    }
    return name;
  }

  function captionText() {
    const name = editingName && editingName !== 'Untitled' ? editingName : 'Untitled';
    return `${name} - /${window.state?.activeProject || ''}/ (RecipePlus Editor)`;
  }

  function editorOpen() {
    const panel = document.getElementById('panelView');
    return Boolean(panel && !panel.classList.contains('hidden') && panel.querySelector('.recipeplus-editor'));
  }

  function loadFromProject() {
    files = normalizeFiles(window.state?.projectConfig?.recipePlusFiles);
  }

  function payload() {
    const out = {};
    for (const [name, recipe] of Object.entries(files)) {
      const normalized = normalizeRecipe(recipe);
      normalized.ingredients = compactIngredients(normalized).filter(ingredientFilled);
      if (name === 'Untitled' && isPristine(normalized)) continue;
      out[name] = normalized;
    }
    return out;
  }

  function harvestGeneral() {
    const recipe = current();
    recipe.runtimeName = $('rpRuntimeName')?.value || '';
    recipe.statusTag = $('rpStatusTag')?.value || '';
    recipe.percentCompleteTag = $('rpPercentTag')?.value || '';
    recipe.nameAfterDownloadTag = $('rpNameTag')?.value || '';
  }

  function markDirty() {
    dirty = true;
    scheduleSave();
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persist({ refreshTree: false }).catch((err) => window.setStatus?.(`Error: ${err.message}`));
    }, 400);
  }

  async function persist({ refreshTree } = {}) {
    const project = window.state?.activeProject;
    if (!project) return false;
    harvestGeneral();
    if (editingName === 'Untitled' && !isPristine(files.Untitled)) {
      const name = uniqueName('Recipe1');
      files[name] = files.Untitled;
      delete files.Untitled;
      editingName = name;
      const caption = $('rpEditorCaption');
      if (caption) caption.textContent = captionText();
    }
    await window.fetchJson(`/api/projects/${encodeURIComponent(project)}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipePlusFiles: payload() })
    });
    await window.refreshProjectConfig?.();
    loadFromProject();
    dirty = false;
    if (refreshTree && typeof window.loadExplorer === 'function') {
      await window.loadExplorer(project);
    }
    return true;
  }

  function switchTab(name) {
    harvestGeneral();
    activeTab = name;
    document.querySelectorAll('.rp-editor-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.getAttribute('data-rp-tab') === name);
    });
    document.querySelectorAll('.rp-editor-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.getAttribute('data-rp-panel') === name);
    });
    if (name === 'ingredients') renderIngredients();
    if (name === 'units') renderUnits();
  }

  function sheetRowCount(recipe) {
    let last = 0;
    (recipe.ingredients || []).forEach((row, i) => {
      if (ingredientFilled(row)) last = i + 1;
    });
    return Math.max(last + 1, 1);
  }

  function ensureIngredient(index) {
    const recipe = current();
    while (recipe.ingredients.length <= index) {
      recipe.ingredients.push(emptyIngredient(recipe.dataSets, recipe.tagSets));
    }
    return recipe.ingredients[index];
  }

  function renderIngredients() {
    const head = $('rpIngHead');
    const body = $('rpIngBody');
    if (!head || !body) return;
    const recipe = current();
    const extra = [
      ...recipe.dataSets.map((name) => `<th>${escapeHtml(name)}</th>`),
      ...recipe.tagSets.map((name) => `<th>${escapeHtml(name)}</th>`)
    ].join('');
    head.innerHTML = `<tr>
      <th class="info-msg-num"></th>
      <th>Ingredient</th>
      <th>Type</th>
      <th>Min</th>
      <th>Max</th>
      <th>Decimal Places</th>
      ${extra}
    </tr>`;
    const count = sheetRowCount(recipe);
    body.innerHTML = Array.from({ length: count }, (_, index) => {
      const row = recipe.ingredients[index] || emptyIngredient(recipe.dataSets, recipe.tagSets);
      const numeric = row.type !== 'String';
      const dataCells = recipe.dataSets.map((name) => (
        `<td><input type="text" data-rp-ing="value" data-rp-set="${escapeHtml(name)}" value="${escapeHtml(row.values?.[name] || '')}" /></td>`
      )).join('');
      const tagCells = recipe.tagSets.map((name) => (
        `<td><input type="text" data-rp-ing="tag" data-rp-set="${escapeHtml(name)}" value="${escapeHtml(row.tags?.[name] || '')}" /></td>`
      )).join('');
      return `<tr data-rp-ing-row="${index}">
        <td class="info-msg-num">${index + 1}</td>
        <td><input type="text" data-rp-ing="name" value="${escapeHtml(row.name)}" /></td>
        <td>
          <select data-rp-ing="type">
            <option value="Number"${numeric ? ' selected' : ''}>Number</option>
            <option value="String"${numeric ? '' : ' selected'}>String</option>
          </select>
        </td>
        <td><input type="text" data-rp-ing="min" value="${escapeHtml(row.min)}" ${numeric ? '' : 'disabled'} /></td>
        <td><input type="text" data-rp-ing="max" value="${escapeHtml(row.max)}" ${numeric ? '' : 'disabled'} /></td>
        <td>
          <select data-rp-ing="decimals" ${numeric ? '' : 'disabled'}>
            <option value=""></option>
            ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option value="${n}"${String(row.decimals) === String(n) ? ' selected' : ''}>${n}</option>`).join('')}
          </select>
        </td>
        ${dataCells}${tagCells}
      </tr>`;
    }).join('');
  }

  function renderUnits() {
    const body = $('rpUnitBody');
    if (!body) return;
    const recipe = current();
    if (selectedUnit >= recipe.units.length) selectedUnit = 0;
    body.innerHTML = recipe.units.map((unit, index) => `
      <tr data-rp-unit-row="${index}" class="${index === selectedUnit ? 'is-selected' : ''}">
        <td>${escapeHtml(unit.name)}</td>
        <td>${escapeHtml(unit.dataSet)}</td>
        <td>${escapeHtml(unit.tagSet)}</td>
      </tr>
    `).join('');
  }

  function fillGeneral() {
    const recipe = current();
    if ($('rpRuntimeName')) $('rpRuntimeName').value = recipe.runtimeName || '';
    if ($('rpStatusTag')) $('rpStatusTag').value = recipe.statusTag || '';
    if ($('rpPercentTag')) $('rpPercentTag').value = recipe.percentCompleteTag || '';
    if ($('rpNameTag')) $('rpNameTag').value = recipe.nameAfterDownloadTag || '';
  }

  function pickTag(input) {
    if (!input || !window.StudioTagTools) return;
    window.StudioTagTools.openTagBrowser(input, (sel) => {
      input.value = sel;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  function onIngredientEvent(e) {
    const field = e.target.getAttribute('data-rp-ing');
    const rowEl = e.target.closest('tr[data-rp-ing-row]');
    if (!field || !rowEl) return;
    const recipe = current();
    const index = Number(rowEl.dataset.rpIngRow);
    const row = ensureIngredient(index);
    if (field === 'value') row.values[e.target.getAttribute('data-rp-set')] = e.target.value;
    else if (field === 'tag') row.tags[e.target.getAttribute('data-rp-set')] = e.target.value;
    else row[field] = e.target.value;
    dirty = true;
    if (field === 'type') renderIngredients();
    const needed = sheetRowCount(recipe);
    const currentRows = document.querySelectorAll('#rpIngBody tr').length;
    if (needed !== currentRows && field !== 'type') renderIngredients();
    scheduleSave();
  }

  function onIngredientKey(e) {
    if (e.key === 't' && e.ctrlKey && e.target.getAttribute('data-rp-ing') === 'tag') {
      e.preventDefault();
      pickTag(e.target);
    }
  }

  function promptText(title, initial) {
    return new Promise((resolve) => {
      $('recipePromptTitle').textContent = title;
      $('recipePromptValue').value = initial || '';
      const dlg = $('recipePromptDialog');
      const ok = () => {
        cleanup();
        dlg.close();
        resolve(String($('recipePromptValue').value || '').trim());
      };
      const cancel = () => {
        cleanup();
        dlg.close();
        resolve('');
      };
      function cleanup() {
        $('recipePromptOk')?.removeEventListener('click', ok);
        $('recipePromptCancel')?.removeEventListener('click', cancel);
      }
      $('recipePromptOk')?.addEventListener('click', ok);
      $('recipePromptCancel')?.addEventListener('click', cancel);
      dlg.showModal();
      requestAnimationFrame(() => $('recipePromptValue')?.focus());
    });
  }

  function addNamed(list, prefix, apply) {
    promptText(`Insert ${prefix}`, uniqueSetName(list, prefix)).then((name) => {
      if (!name) return;
      if (list.includes(name)) {
        window.setStatus?.(`${prefix} "${name}" already exists`);
        return;
      }
      apply(name);
      markDirty();
      renderIngredients();
      renderUnits();
    });
  }

  function renameNamed(list, prefix, apply) {
    const currentName = list[0];
    promptText(`Rename ${prefix}`, currentName).then((name) => {
      if (!name || name === currentName) return;
      if (list.includes(name)) {
        window.setStatus?.(`${prefix} "${name}" already exists`);
        return;
      }
      apply(currentName, name);
      markDirty();
      renderIngredients();
      renderUnits();
    });
  }

  function runMenuAction(action) {
    if (!editorOpen()) {
      window.setStatus?.('Open RecipePlus Editor first');
      return;
    }
    const recipe = current();
    if (action === 'insert-dataset') {
      addNamed(recipe.dataSets, 'Data Set', (name) => {
        recipe.dataSets.push(name);
        recipe.ingredients.forEach((row) => { row.values[name] = ''; });
      });
    } else if (action === 'insert-tagset') {
      addNamed(recipe.tagSets, 'Tag Set', (name) => {
        recipe.tagSets.push(name);
        recipe.ingredients.forEach((row) => { row.tags[name] = ''; });
      });
    } else if (action === 'rename-dataset') {
      renameNamed(recipe.dataSets, 'Data Set', (from, to) => {
        recipe.dataSets = recipe.dataSets.map((n) => (n === from ? to : n));
        recipe.ingredients.forEach((row) => {
          row.values[to] = row.values[from] || '';
          delete row.values[from];
        });
        recipe.units.forEach((unit) => { if (unit.dataSet === from) unit.dataSet = to; });
      });
    } else if (action === 'rename-tagset') {
      renameNamed(recipe.tagSets, 'Tag Set', (from, to) => {
        recipe.tagSets = recipe.tagSets.map((n) => (n === from ? to : n));
        recipe.ingredients.forEach((row) => {
          row.tags[to] = row.tags[from] || '';
          delete row.tags[from];
        });
        recipe.units.forEach((unit) => { if (unit.tagSet === from) unit.tagSet = to; });
      });
    }
  }

  function fillUnitDialog(unit) {
    const recipe = current();
    $('rpUnitName').value = unit?.name || uniqueSetName(recipe.units.map((u) => u.name), 'Unit');
    $('rpUnitDataSet').innerHTML = recipe.dataSets.map((name) => (
      `<option value="${escapeHtml(name)}"${name === (unit?.dataSet || recipe.dataSets[0]) ? ' selected' : ''}>${escapeHtml(name)}</option>`
    )).join('');
    $('rpUnitTagSet').innerHTML = recipe.tagSets.map((name) => (
      `<option value="${escapeHtml(name)}"${name === (unit?.tagSet || recipe.tagSets[0]) ? ' selected' : ''}>${escapeHtml(name)}</option>`
    )).join('');
  }

  function openUnitDialog(mode) {
    const recipe = current();
    unitDialogMode = mode;
    const unit = mode === 'edit' ? recipe.units[selectedUnit] : {
      name: uniqueSetName(recipe.units.map((u) => u.name), 'Unit'),
      dataSet: recipe.dataSets[0],
      tagSet: recipe.tagSets[0]
    };
    if (mode === 'edit' && !unit) return;
    $('recipeUnitTitle').textContent = mode === 'edit' ? 'Edit Unit' : 'Insert Unit';
    fillUnitDialog(unit);
    $('recipeUnitDialog')?.showModal();
  }

  function commitUnitDialog() {
    const recipe = current();
    const name = String($('rpUnitName')?.value || '').trim();
    if (!name) return;
    const next = {
      name,
      dataSet: $('rpUnitDataSet')?.value || recipe.dataSets[0],
      tagSet: $('rpUnitTagSet')?.value || recipe.tagSets[0]
    };
    const clash = recipe.units.findIndex((unit, i) => unit.name === name && !(unitDialogMode === 'edit' && i === selectedUnit));
    if (clash >= 0) {
      window.setStatus?.(`Unit "${name}" already exists`);
      return;
    }
    if (unitDialogMode === 'edit') recipe.units[selectedUnit] = next;
    else {
      recipe.units.push(next);
      selectedUnit = recipe.units.length - 1;
    }
    $('recipeUnitDialog')?.close();
    markDirty();
    renderUnits();
  }

  function deleteSelectedUnit() {
    const recipe = current();
    if (recipe.units.length <= 1) {
      window.setStatus?.('A recipe must have at least one unit');
      return;
    }
    recipe.units.splice(selectedUnit, 1);
    selectedUnit = Math.max(0, selectedUnit - 1);
    markDirty();
    renderUnits();
  }

  async function saveOpenEditor() {
    if (!editorOpen()) return false;
    clearTimeout(saveTimer);
    harvestGeneral();
    await persist({ refreshTree: true });
    window.setStatus?.(`Saved ${captionText()}`);
    return true;
  }

  async function deleteRecipe(name) {
    const key = String(name || '').trim();
    if (!key || key === 'Untitled') return false;
    if (!window.confirm(`Delete recipe "${key}"?`)) return false;
    await window.refreshProjectConfig?.();
    loadFromProject();
    delete files[key];
    if (editingName === key) editingName = '';
    dirty = true;
    await persist({ refreshTree: true });
    window.setStatus?.(`Deleted recipe: ${key}`);
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
    if (!files[editingName]) files[editingName] = defaultRecipe();
    dirty = false;
    activeTab = options.tab || 'general';
    selectedUnit = 0;
    window.hidePreviewStage?.();
    const panelView = document.getElementById('panelView');
    if (!panelView) return;
    panelView.classList.remove('hidden');
    panelView.innerHTML = `
      <div class="panel-content recipeplus-editor">
        <div class="info-msg-caption" id="rpEditorCaption">${escapeHtml(captionText())}</div>
        <div class="rp-editor-tabs">
          <button type="button" class="rp-editor-tab${activeTab === 'general' ? ' active' : ''}" data-rp-tab="general">General</button>
          <button type="button" class="rp-editor-tab${activeTab === 'ingredients' ? ' active' : ''}" data-rp-tab="ingredients">Ingredients</button>
          <button type="button" class="rp-editor-tab${activeTab === 'units' ? ' active' : ''}" data-rp-tab="units">Units</button>
        </div>
        <div class="rp-editor-panel${activeTab === 'general' ? ' active' : ''}" data-rp-panel="general">
          <label class="rp-gen-label" for="rpRuntimeName">Runtime recipe name</label>
          <input type="text" id="rpRuntimeName" placeholder="Please enter a unique recipe name here" />
          <label class="rp-gen-label" for="rpStatusTag">Status tag</label>
          <div class="rp-tag-row">
            <input type="text" id="rpStatusTag" spellcheck="false" />
            <button type="button" class="ft-mini-btn" data-rp-tag="rpStatusTag">...</button>
          </div>
          <label class="rp-gen-label" for="rpPercentTag">Percent complete tag</label>
          <div class="rp-tag-row">
            <input type="text" id="rpPercentTag" spellcheck="false" />
            <button type="button" class="ft-mini-btn" data-rp-tag="rpPercentTag">...</button>
          </div>
          <label class="rp-gen-label" for="rpNameTag">Write the runtime recipe name to a tag after download:</label>
          <div class="rp-tag-row">
            <input type="text" id="rpNameTag" spellcheck="false" />
            <button type="button" class="ft-mini-btn" data-rp-tag="rpNameTag">...</button>
          </div>
        </div>
        <div class="rp-editor-panel${activeTab === 'ingredients' ? ' active' : ''}" data-rp-panel="ingredients">
          <div class="rp-ing-wrap">
            <table class="info-msg-sheet rp-ing-sheet" id="rpIngSheet">
              <thead id="rpIngHead"></thead>
              <tbody id="rpIngBody"></tbody>
            </table>
          </div>
        </div>
        <div class="rp-editor-panel${activeTab === 'units' ? ' active' : ''}" data-rp-panel="units">
          <div class="rp-units-layout">
            <div class="rp-units-table-wrap">
              <table class="info-msg-sheet rp-units-sheet">
                <thead><tr><th>Unit name</th><th>Data Set</th><th>Tag Set</th></tr></thead>
                <tbody id="rpUnitBody"></tbody>
              </table>
            </div>
            <div class="rp-units-btns">
              <button type="button" class="dialog-btn" id="rpUnitInsert">Insert</button>
              <button type="button" class="dialog-btn" id="rpUnitEdit">Edit</button>
              <button type="button" class="dialog-btn" id="rpUnitDelete">Delete</button>
            </div>
          </div>
        </div>
      </div>`;
    fillGeneral();
    renderIngredients();
    renderUnits();
    panelView.querySelector('.rp-editor-tabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-rp-tab]');
      if (tab) switchTab(tab.getAttribute('data-rp-tab'));
    });
    panelView.querySelector('[data-rp-panel="general"]')?.addEventListener('input', () => {
      harvestGeneral();
      markDirty();
    });
    panelView.querySelectorAll('[data-rp-tag]').forEach((btn) => {
      btn.addEventListener('click', () => pickTag($(btn.getAttribute('data-rp-tag'))));
    });
    panelView.querySelector('#rpIngBody')?.addEventListener('input', onIngredientEvent);
    panelView.querySelector('#rpIngBody')?.addEventListener('change', onIngredientEvent);
    panelView.querySelector('#rpIngBody')?.addEventListener('keydown', onIngredientKey);
    panelView.querySelector('#rpIngBody')?.addEventListener('dblclick', (e) => {
      if (e.target.getAttribute('data-rp-ing') === 'tag') pickTag(e.target);
    });
    panelView.querySelector('#rpUnitBody')?.addEventListener('click', (e) => {
      const row = e.target.closest('tr[data-rp-unit-row]');
      if (!row) return;
      selectedUnit = Number(row.dataset.rpUnitRow);
      renderUnits();
    });
    panelView.querySelector('#rpUnitBody')?.addEventListener('dblclick', () => openUnitDialog('edit'));
    panelView.querySelector('#rpUnitInsert')?.addEventListener('click', () => openUnitDialog('insert'));
    panelView.querySelector('#rpUnitEdit')?.addEventListener('click', () => openUnitDialog('edit'));
    panelView.querySelector('#rpUnitDelete')?.addEventListener('click', deleteSelectedUnit);
    window.setStatus?.(captionText());
    requestAnimationFrame(() => $('rpRuntimeName')?.focus());
    bindDialogsOnce();
  }

  let dialogsBound = false;
  function bindDialogsOnce() {
    if (dialogsBound) return;
    dialogsBound = true;
    $('recipeUnitOk')?.addEventListener('click', commitUnitDialog);
    $('recipeUnitCancel')?.addEventListener('click', () => $('recipeUnitDialog')?.close());
    $('recipePromptValue')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        $('recipePromptOk')?.click();
      }
    });
  }

  window.StudioRecipePlusEditor = {
    showEditor,
    saveOpenEditor,
    deleteRecipe,
    runMenuAction,
    isOpen: editorOpen
  };
})();
