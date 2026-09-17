/** FactoryTalk View ME-style RecipePlus Setup. */
(function () {
  const FOLDER_ICONS = {
    documents: '📁',
    gallery: '🖼',
    onedrive: '☁',
    desktop: '🖥',
    downloads: '⬇',
    music: '🎵',
    pictures: '🖼',
    videos: '🎬',
    thispc: '💻',
    drive: '💿',
    folder: '📁'
  };

  let working = defaultSetup();
  let original = defaultSetup();
  let bound = false;
  let folderPickResolve = null;
  let selectedFolder = '';
  let expanded = new Set();
  let childrenCache = {};
  let roots = [];

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function defaultSetup() {
    return {
      filesInProject: true,
      runtimeFolder: ''
    };
  }

  function normalizeSetup(raw) {
    const base = defaultSetup();
    if (!raw || typeof raw !== 'object') return base;
    return {
      filesInProject: raw.filesInProject !== false && raw.location !== 'external',
      runtimeFolder: String(raw.runtimeFolder || raw.folder || '')
    };
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function harvest() {
    working.filesInProject = Boolean($('rpFilesInProject')?.checked);
    working.runtimeFolder = String($('rpRuntimeFolder')?.value || '').trim();
    return clone(working);
  }

  function syncEnabled() {
    const inProject = Boolean($('rpFilesInProject')?.checked);
    const input = $('rpRuntimeFolder');
    const browse = $('rpFolderBrowse');
    if (input) input.disabled = inProject;
    if (browse) browse.disabled = inProject;
  }

  function writeForm() {
    if ($('rpFilesInProject')) $('rpFilesInProject').checked = working.filesInProject !== false;
    if ($('rpFilesExternal')) $('rpFilesExternal').checked = working.filesInProject === false;
    if ($('rpRuntimeFolder')) $('rpRuntimeFolder').value = working.runtimeFolder || '';
    syncEnabled();
  }

  async function defaultDocumentsPath() {
    try {
      const data = await window.fetchJson('/api/studio/fs/roots');
      return data?.documents || '';
    } catch {
      return '';
    }
  }

  async function persistAndClose() {
    const project = window.state?.activeProject;
    if (!project) {
      window.setStatus?.('Open an application first');
      return false;
    }
    harvest();
    const payload = normalizeSetup(working);
    await window.fetchJson(`/api/projects/${encodeURIComponent(project)}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipePlusSetup: payload })
    });
    await window.refreshProjectConfig?.();
    working = payload;
    original = clone(payload);
    $('recipePlusSetupDialog')?.close();
    window.setStatus?.(`RecipePlus Setup saved — ${payload.filesInProject ? 'files in project' : payload.runtimeFolder}`);
    return true;
  }

  function cancelDialog() {
    working = clone(original);
    $('recipePlusSetupDialog')?.close();
  }

  async function showDialog() {
    if (!window.state?.activeProject) {
      window.setStatus?.('Open an application first');
      return;
    }
    bindOnce();
    await window.refreshProjectConfig?.();
    working = normalizeSetup(window.state?.projectConfig?.recipePlusSetup);
    if (!working.runtimeFolder) working.runtimeFolder = await defaultDocumentsPath();
    original = clone(working);
    const title = $('recipePlusSetupTitle');
    if (title) title.textContent = `RecipePlus Setup - /${window.state.activeProject}/`;
    writeForm();
    $('recipePlusSetupDialog')?.showModal();
    window.setStatus?.(title?.textContent || 'RecipePlus Setup');
  }

  async function loadRoots() {
    const data = await window.fetchJson('/api/studio/fs/roots');
    roots = Array.isArray(data?.folders) ? data.folders : [];
    return roots;
  }

  async function loadChildren(folderPath, virtual) {
    const key = virtual || folderPath;
    if (childrenCache[key]) return childrenCache[key];
    const query = virtual === 'thispc'
      ? '/api/studio/fs/list?drives=1'
      : `/api/studio/fs/list?path=${encodeURIComponent(folderPath)}`;
    const data = await window.fetchJson(query);
    childrenCache[key] = Array.isArray(data?.folders) ? data.folders : [];
    return childrenCache[key];
  }

  function folderRowHtml(item, depth) {
    const id = item.virtual || item.path;
    const isOpen = expanded.has(id);
    const icon = FOLDER_ICONS[item.icon] || FOLDER_ICONS.folder;
    return `
      <div class="rp-folder-row" data-folder-id="${escapeHtml(id)}" data-folder-path="${escapeHtml(item.path || '')}" data-virtual="${escapeHtml(item.virtual || '')}" data-depth="${depth}" style="padding-left:${8 + depth * 16}px">
        <button type="button" class="rp-folder-toggle" data-folder-toggle="1">${isOpen ? '▾' : '▸'}</button>
        <span class="rp-folder-icon">${icon}</span>
        <span class="rp-folder-label">${escapeHtml(item.label || item.name || '')}</span>
      </div>
      <div class="rp-folder-children" data-folder-children="${escapeHtml(id)}"></div>
    `;
  }

  async function renderFolderTree() {
    const tree = $('rpFolderTree');
    if (!tree) return;
    if (!roots.length) await loadRoots();
    tree.innerHTML = roots.map((item) => folderRowHtml(item, 0)).join('');
    for (const item of roots) {
      const id = item.virtual || item.path;
      if (expanded.has(id)) await fillChildren(item, 1);
    }
    highlightSelected();
  }

  function childWrap(id) {
    return [...document.querySelectorAll('[data-folder-children]')].find((el) => el.getAttribute('data-folder-children') === id);
  }

  async function fillChildren(item, depth) {
    const id = item.virtual || item.path;
    const wrap = childWrap(id);
    if (!wrap) return;
    try {
      const kids = await loadChildren(item.path, item.virtual);
      wrap.innerHTML = kids.map((child) => folderRowHtml({
        ...child,
        label: child.name || child.label
      }, depth)).join('');
      for (const child of kids) {
        const childId = child.virtual || child.path;
        if (expanded.has(childId)) await fillChildren(child, depth + 1);
      }
    } catch (err) {
      wrap.innerHTML = `<div class="rp-folder-error">${escapeHtml(err.message)}</div>`;
    }
  }

  function highlightSelected() {
    document.querySelectorAll('#rpFolderTree .rp-folder-row').forEach((row) => {
      const pathValue = row.getAttribute('data-folder-path') || '';
      row.classList.toggle('is-selected', Boolean(selectedFolder) && pathValue === selectedFolder);
    });
  }

  async function toggleFolder(row) {
    const id = row.getAttribute('data-folder-id') || '';
    const folderPath = row.getAttribute('data-folder-path') || '';
    const virtual = row.getAttribute('data-virtual') || '';
    if (expanded.has(id)) expanded.delete(id);
    else expanded.add(id);
    const toggle = row.querySelector('.rp-folder-toggle');
    if (toggle) toggle.textContent = expanded.has(id) ? '▾' : '▸';
    if (expanded.has(id)) {
      const depth = Number(row.getAttribute('data-depth') || 0);
      await fillChildren({ path: folderPath, virtual, icon: 'folder' }, depth + 1);
    } else {
      const wrap = childWrap(id);
      if (wrap) wrap.innerHTML = '';
    }
    highlightSelected();
  }

  function selectFolderRow(row) {
    selectedFolder = row.getAttribute('data-folder-path') || '';
    highlightSelected();
    const make = $('rpMakeFolder');
    if (make) make.disabled = !selectedFolder;
  }

  async function openFolderBrowser() {
    if ($('rpFilesInProject')?.checked) return;
    selectedFolder = String($('rpRuntimeFolder')?.value || '').trim();
    expanded = new Set();
    childrenCache = {};
    roots = [];
    $('rpNewFolderRow')?.classList.add('hidden');
    if ($('rpNewFolderName')) $('rpNewFolderName').value = '';
    await renderFolderTree();
    if (selectedFolder) {
      const make = $('rpMakeFolder');
      if (make) make.disabled = false;
    }
    return new Promise((resolve) => {
      folderPickResolve = resolve;
      $('recipeFolderBrowserDialog')?.showModal();
    });
  }

  function finishFolderBrowse(pathValue) {
    const resolve = folderPickResolve;
    folderPickResolve = null;
    $('recipeFolderBrowserDialog')?.close();
    if (resolve) resolve(pathValue || '');
  }

  async function createFolder() {
    if (!selectedFolder) {
      window.setStatus?.('Select a parent folder first');
      return;
    }
    const row = $('rpNewFolderRow');
    if (row?.classList.contains('hidden')) {
      row.classList.remove('hidden');
      $('rpNewFolderName')?.focus();
      return;
    }
    const name = String($('rpNewFolderName')?.value || '').trim();
    if (!name) return;
    const created = await window.fetchJson('/api/studio/fs/mkdir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: selectedFolder, name })
    });
    childrenCache = {};
    const parent = selectedFolder;
    selectedFolder = created?.path || pathJoin(selectedFolder, name);
    if (parent) expanded.add(parent);
    await renderFolderTree();
    row.classList.add('hidden');
    if ($('rpNewFolderName')) $('rpNewFolderName').value = '';
  }

  function pathJoin(parent, name) {
    if (!parent) return name;
    return /[\\/]$/.test(parent) ? `${parent}${name}` : `${parent}\\${name}`;
  }

  function bindOnce() {
    if (bound) return;
    bound = true;
    const dlg = $('recipePlusSetupDialog');
    dlg?.addEventListener('change', () => {
      harvest();
      syncEnabled();
    });
    $('rpFolderBrowse')?.addEventListener('click', () => {
      openFolderBrowser()
        .then((picked) => {
          if (!picked) return;
          if ($('rpRuntimeFolder')) $('rpRuntimeFolder').value = picked;
          harvest();
        })
        .catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('rpSetupOk')?.addEventListener('click', () => {
      persistAndClose().catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('rpSetupCancel')?.addEventListener('click', cancelDialog);
    $('rpSetupHelp')?.addEventListener('click', () => {
      alert(
        'RecipePlus Setup\n\n'
        + 'Choose whether recipe files are stored with the HMI project or in a runtime folder.\n'
        + 'When files are not part of the project, set the folder used at runtime and browse for it.\n'
        + 'Examples: C:\\Recipes, \\\\Server\\Recipes, or a terminal storage-card path.'
      );
    });

    const tree = $('rpFolderTree');
    tree?.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-folder-toggle]');
      const row = e.target.closest('.rp-folder-row');
      if (!row) return;
      if (toggle) {
        e.preventDefault();
        toggleFolder(row).catch((err) => window.setStatus?.(`Error: ${err.message}`));
        return;
      }
      selectFolderRow(row);
    });
    tree?.addEventListener('dblclick', (e) => {
      const row = e.target.closest('.rp-folder-row');
      if (!row) return;
      selectFolderRow(row);
      const folderPath = row.getAttribute('data-folder-path') || '';
      if (folderPath) finishFolderBrowse(folderPath);
    });
    $('rpFolderOk')?.addEventListener('click', () => finishFolderBrowse(selectedFolder));
    $('rpFolderCancel')?.addEventListener('click', () => finishFolderBrowse(''));
    $('rpMakeFolder')?.addEventListener('click', () => {
      createFolder().catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('rpNewFolderCreate')?.addEventListener('click', () => {
      createFolder().catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('rpNewFolderCancel')?.addEventListener('click', () => {
      $('rpNewFolderRow')?.classList.add('hidden');
    });
    $('rpNewFolderName')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        createFolder().catch((err) => window.setStatus?.(`Error: ${err.message}`));
      }
    });
    $('recipeFolderBrowserDialog')?.addEventListener('close', () => {
      if (folderPickResolve) {
        const resolve = folderPickResolve;
        folderPickResolve = null;
        resolve('');
      }
    });
  }

  window.StudioRecipePlusSetup = {
    showDialog
  };
})();
