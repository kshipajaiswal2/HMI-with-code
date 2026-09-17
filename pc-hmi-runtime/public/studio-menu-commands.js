/** File / Edit / View / Tools commands that were stubbed or miswired. */
(function () {
  const LOCALIZED_KEYS = /^(caption|label|text|message|title|captionText|caption1|caption2)$/i;
  const TAG_KEYS = /tag|expression|connection|plcAddress|indicator|handshake|valueExpr|remoteAck/i;
  const ANIMATION_TYPES = [
    ['visibility', 'Visibility'],
    ['color', 'Color'],
    ['fill', 'Fill'],
    ['horizontalPosition', 'Horizontal Position'],
    ['verticalPosition', 'Vertical Position'],
    ['width', 'Width'],
    ['height', 'Height']
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function selectedEntries() {
    const indices = window.getSelectedCanvasIndices?.() || window.state?.canvasSelection?.indices || [];
    return indices
      .map((idx) => window.state?.canvasEditCache?.editComponents?.[idx])
      .filter(Boolean);
  }

  function primaryEntry() {
    const idx = window.getPrimaryCanvasSelectionIndex?.();
    if (idx == null) return selectedEntries()[0] || null;
    return window.state?.canvasEditCache?.editComponents?.[idx] || null;
  }

  function requireProject() {
    if (!window.state?.activeProject) {
      window.setStatus?.('Open an application first');
      return false;
    }
    return true;
  }

  function requireDisplay() {
    if (!window.displayIsOpen?.()) {
      window.setStatus?.('Open a display first');
      return false;
    }
    return true;
  }

  function collectTagFields(value, path, out) {
    if (Array.isArray(value)) {
      value.forEach((item, i) => collectTagFields(item, `${path}[${i}]`, out));
      return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      const next = path ? `${path}.${key}` : key;
      if (typeof child === 'string' && TAG_KEYS.test(key)) {
        out.push({ path: next, key, value: child });
      } else if (child && typeof child === 'object') {
        collectTagFields(child, next, out);
      }
    }
  }

  function setPath(obj, path, value) {
    const parts = [];
    String(path).replace(/([^[.\]]+)|\[(\d+)\]/g, (_, name, index) => {
      parts.push(index != null ? Number(index) : name);
    });
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const key = parts[i];
      if (cur[key] == null) cur[key] = typeof parts[i + 1] === 'number' ? [] : {};
      cur = cur[key];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function replaceInValue(value, find, replace, exact) {
    if (typeof value === 'string') {
      if (exact) return value === find ? replace : value;
      return value.split(find).join(replace);
    }
    if (Array.isArray(value)) return value.map((item) => replaceInValue(item, find, replace, exact));
    if (value && typeof value === 'object') {
      const out = Array.isArray(value) ? [] : { ...value };
      for (const [key, child] of Object.entries(value)) {
        out[key] = replaceInValue(child, find, replace, exact);
      }
      return out;
    }
    return value;
  }

  function stripLocalized(value) {
    if (Array.isArray(value)) return value.map(stripLocalized);
    if (value && typeof value === 'object') {
      const out = {};
      for (const [key, child] of Object.entries(value)) {
        if (typeof child === 'string' && LOCALIZED_KEYS.test(key)) out[key] = '';
        else out[key] = stripLocalized(child);
      }
      return out;
    }
    return value;
  }

  function collectPlaceholders(value, found) {
    if (typeof value === 'string') {
      const matches = value.match(/#\d+/g) || [];
      matches.forEach((m) => found.add(m));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => collectPlaceholders(item, found));
      return;
    }
    if (value && typeof value === 'object') {
      Object.values(value).forEach((child) => collectPlaceholders(child, found));
    }
  }

  async function saveSelectedComponents(mutator) {
    const entries = selectedEntries().filter((entry) => entry.ref?.type === 'display' && entry.comp);
    if (!entries.length) {
      window.setStatus?.('Select a display object first');
      return false;
    }
    await window.pushUndoBefore?.({ screenKeys: ['components'] });
    const canvas = await window.fetchOpenCanvas();
    const components = [...(canvas.components || [])];
    for (const entry of entries) {
      const idx = entry.ref.index;
      if (idx == null || !components[idx]) continue;
      components[idx] = mutator(JSON.parse(JSON.stringify(components[idx])));
    }
    await window.patchOpenCanvas({ components });
    window.state.canvasEditCache.raw = { ...canvas, components };
    await window.updateCanvasPreview?.({ forceReload: true });
    window.refreshObjectExplorer?.();
    window.refreshPropertyPanel?.();
    window.scheduleRefreshCanvasEditOverlay?.();
    return true;
  }

  async function showLibraryBrowser() {
    if (!requireProject()) return;
    const project = window.state.activeProject;
    const [explorer, images] = await Promise.all([
      window.fetchJson(`/api/projects/${encodeURIComponent(project)}/explorer?_=${Date.now()}`),
      window.fetchProjectImages?.() || Promise.resolve([])
    ]);
    const gos = [];
    const walk = (nodes) => {
      for (const node of nodes || []) {
        if (node.type === 'global-object') gos.push(node);
        if (node.children) walk(node.children);
      }
    };
    walk(explorer.tree);
    const imageList = Array.isArray(images) ? images : [];

    window.hidePreviewStage?.();
    const panel = document.getElementById('panelView');
    panel.classList.remove('hidden');
    panel.innerHTML = `
      <div class="panel-content library-browser">
        <h2>Libraries</h2>
        <p class="hint">Graphic libraries for <strong>${escapeHtml(project)}</strong>. Open a global object to edit it, or insert an image onto the current display.</p>
        <div class="library-columns">
          <section>
            <h3>Global Objects</h3>
            <ul class="library-list" id="libraryGoList">
              ${gos.length ? gos.map((g) => `<li><button type="button" class="btn-link" data-lib-go="${escapeHtml(g.id)}">${escapeHtml(g.label || g.id)}</button></li>`).join('') : '<li class="empty">No global objects</li>'}
            </ul>
          </section>
          <section>
            <h3>Images</h3>
            <ul class="library-list" id="libraryImageList">
              ${imageList.length ? imageList.map((img) => `<li><button type="button" class="btn-link" data-lib-image="${escapeHtml(img.fileName)}">${escapeHtml(img.label || img.fileName)}</button></li>`).join('') : '<li class="empty">No images</li>'}
            </ul>
          </section>
        </div>
      </div>`;
    panel.querySelectorAll('[data-lib-go]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.openGlobalObjectPreview?.(btn.dataset.libGo, btn.textContent);
      });
    });
    panel.querySelectorAll('[data-lib-image]').forEach((btn) => {
      btn.addEventListener('click', () => insertLibraryImage(btn.dataset.libImage).catch((err) => window.setStatus?.(`Error: ${err.message}`)));
    });
    window.setStatus?.('Libraries');
  }

  async function insertLibraryImage(fileName) {
    if (!requireDisplay()) return;
    await window.pushUndoBefore?.({ screenKeys: ['components'] });
    const canvas = await window.fetchOpenCanvas();
    const components = [...(canvas.components || [])];
    const name = window.nextImageObjectName?.(components) || `Image${components.length + 1}`;
    const image = window.defaultImageComponent?.({ name, image: fileName, left: 40, top: 40 }) || {
      type: 'Image', name, image: fileName, left: 40, top: 40, width: 64, height: 64
    };
    components.push(image);
    await window.patchOpenCanvas({ components });
    window.state.canvasEditCache.raw = { ...canvas, components };
    await window.updateCanvasPreview?.({ forceReload: true });
    window.refreshObjectExplorer?.();
    window.scheduleRefreshCanvasEditOverlay?.();
    window.setStatus?.(`Inserted image ${fileName}`);
  }

  function animationMap(comp) {
    const list = Array.isArray(comp?.animations) ? comp.animations : [];
    const map = {};
    for (const item of list) {
      if (item?.type) map[item.type] = item;
    }
    if (comp?.visibleWhen && !map.visibility) {
      map.visibility = {
        type: 'visibility',
        expression: comp.visibleWhen.expression || (comp.visibleWhen.tag ? `{${comp.visibleWhen.tag}}` : ''),
        expressionTrueState: 'visible'
      };
    }
    return map;
  }

  function fillAnimationForm(comp) {
    const map = animationMap(comp);
    for (const [type] of ANIMATION_TYPES) {
      const enabled = $(`animEnable_${type}`);
      const expr = $(`animExpr_${type}`);
      const item = map[type];
      if (enabled) enabled.checked = Boolean(item && (item.expression || item.tag));
      if (expr) expr.value = item?.expression || (item?.tag ? `{${item.tag}}` : '');
    }
  }

  function readAnimationForm() {
    const animations = [];
    for (const [type] of ANIMATION_TYPES) {
      if (!$(`animEnable_${type}`)?.checked) continue;
      const expression = $(`animExpr_${type}`)?.value.trim() || '';
      if (!expression) continue;
      animations.push({ type, expression, expressionTrueState: type === 'visibility' ? 'visible' : undefined });
    }
    return animations;
  }

  async function showAnimationDialog() {
    if (!requireDisplay()) return;
    const entry = primaryEntry();
    if (!entry?.comp) {
      window.setStatus?.('Select an object to animate');
      return;
    }
    fillAnimationForm(entry.comp);
    $('animationObjectName').textContent = entry.comp.name || entry.comp.type || 'Object';
    $('animationDialog')?.showModal();
  }

  async function applyAnimation(closeAfter) {
    const animations = readAnimationForm();
    const ok = await saveSelectedComponents((comp) => {
      comp.animations = animations;
      const vis = animations.find((a) => a.type === 'visibility');
      if (vis) comp.visibleWhen = { expression: vis.expression };
      else delete comp.visibleWhen;
      return comp;
    });
    if (ok) window.setStatus?.('Animation saved');
    if (closeAfter) $('animationDialog')?.close();
  }

  function copyAnimation() {
    const entry = primaryEntry();
    if (!entry?.comp) {
      window.setStatus?.('Select an object to copy animation from');
      return;
    }
    window.state.animationClipboard = JSON.parse(JSON.stringify(animationMap(entry.comp)));
    window.updateEditClipboardUI?.();
    window.setStatus?.(`Copied animation from ${entry.comp.name || entry.comp.type}`);
  }

  async function pasteAnimation() {
    const clip = window.state?.animationClipboard;
    if (!clip || !Object.keys(clip).length) {
      window.setStatus?.('Animation clipboard empty');
      return;
    }
    const animations = Object.values(clip).filter(Boolean);
    const ok = await saveSelectedComponents((comp) => {
      comp.animations = JSON.parse(JSON.stringify(animations));
      const vis = animations.find((a) => a.type === 'visibility');
      if (vis) comp.visibleWhen = { expression: vis.expression || (vis.tag ? `{${vis.tag}}` : vis.expression) };
      return comp;
    });
    if (ok) window.setStatus?.('Animation pasted');
  }

  async function pasteWithoutLocalizedStrings() {
    const clip = window.state?.clipboard?.components;
    if (!clip?.length) {
      window.setStatus?.('Clipboard empty');
      return;
    }
    const original = window.state.clipboard;
    window.state.clipboard = { components: clip.map((comp) => stripLocalized(window.cloneComponentForClipboard?.(comp) || JSON.parse(JSON.stringify(comp)))) };
    try {
      await window.pasteClipboardComponents?.();
    } finally {
      window.state.clipboard = original;
    }
  }

  async function showConnectionsDialog() {
    if (!requireDisplay()) return;
    const entry = primaryEntry();
    if (!entry?.comp) {
      window.setStatus?.('Select an object to edit connections');
      return;
    }
    const fields = [];
    collectTagFields(entry.comp, '', fields);
    const body = $('objectConnectionsBody');
    $('objectConnectionsName').textContent = entry.comp.name || entry.comp.type || 'Object';
    if (!fields.length) {
      body.innerHTML = '<tr><td colspan="3">This object has no tag or expression connections.</td></tr>';
    } else {
      body.innerHTML = fields.map((field, i) => `
        <tr>
          <td>${escapeHtml(field.key)}</td>
          <td><input type="text" data-conn-path="${escapeHtml(field.path)}" value="${escapeHtml(field.value)}" /></td>
          <td><button type="button" class="ft-mini-btn" data-conn-browse="${i}">...</button></td>
        </tr>`).join('');
      body.querySelectorAll('[data-conn-browse]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const input = btn.closest('tr')?.querySelector('input');
          window.StudioTagTools?.openTagBrowser?.(input);
        });
      });
    }
    $('objectConnectionsDialog')?.showModal();
  }

  async function applyConnections(closeAfter) {
    const updates = [...document.querySelectorAll('#objectConnectionsBody input[data-conn-path]')].map((input) => ({
      path: input.dataset.connPath,
      value: input.value.trim()
    }));
    const ok = await saveSelectedComponents((comp) => {
      for (const update of updates) setPath(comp, update.path, update.value);
      return comp;
    });
    if (ok) window.setStatus?.('Connections saved');
    if (closeAfter) $('objectConnectionsDialog')?.close();
  }

  async function showTagSubstitutionDialog() {
    if (!requireProject()) return;
    $('tagSubFind').value = '';
    $('tagSubReplace').value = '';
    const selected = document.querySelector('input[name="tagSubScope"][value="selected"]');
    const display = document.querySelector('input[name="tagSubScope"][value="display"]');
    if (selected) selected.checked = Boolean(selectedEntries().length);
    if (display && !selected?.checked) display.checked = true;
    $('tagSubstitutionDialog')?.showModal();
  }

  async function runTagSubstitution() {
    const find = $('tagSubFind')?.value.trim();
    const replace = $('tagSubReplace')?.value.trim();
    if (!find) {
      window.setStatus?.('Enter the tag to find');
      return;
    }
    const scope = document.querySelector('input[name="tagSubScope"]:checked')?.value || 'display';
    const exact = Boolean($('tagSubExact')?.checked);
    const project = window.state.activeProject;
    let count = 0;

    if (scope === 'selected') {
      const ok = await saveSelectedComponents((comp) => {
        count += 1;
        return replaceInValue(comp, find, replace, exact);
      });
      if (ok) window.setStatus?.(`Tag substitution applied to ${count} object(s)`);
    } else if (scope === 'display') {
      if (!requireDisplay()) return;
      await window.pushUndoBefore?.({ screenKeys: ['components'] });
      const canvas = await window.fetchOpenCanvas();
      const next = replaceInValue(canvas, find, replace, exact);
      await window.patchOpenCanvas(next);
      await window.updateCanvasPreview?.({ forceReload: true });
      window.setStatus?.('Tag substitution applied to the current display');
    } else {
      const screens = await window.fetchJson(`/api/runtime/screens?project=${encodeURIComponent(project)}`);
      for (const screen of screens) {
        const raw = await window.fetchJson(`/api/runtime/screens/${encodeURIComponent(screen.id)}?project=${encodeURIComponent(project)}&raw=1`);
        const before = JSON.stringify(raw);
        const next = replaceInValue(raw, find, replace, exact);
        if (JSON.stringify(next) === before) continue;
        await window.fetchJson(`/api/projects/${encodeURIComponent(project)}/screens/${encodeURIComponent(screen.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next)
        });
        count += 1;
      }
      if (window.displayIsOpen?.()) await window.updateCanvasPreview?.({ forceReload: true });
      window.setStatus?.(`Tag substitution applied to ${count} display(s)`);
    }
    $('tagSubstitutionDialog')?.close();
  }

  async function showGlobalParamValues() {
    const entry = primaryEntry();
    if (!entry?.comp) {
      window.setStatus?.('Select a global-reference object first');
      return;
    }
    const found = new Set();
    collectPlaceholders(entry.comp, found);
    const values = { ...(entry.comp.parameterValues || {}) };
    if (entry.comp.parameterFile) values.parameterFile = entry.comp.parameterFile;
    const body = $('goParamValuesBody');
    $('goParamValuesName').textContent = entry.comp.name || entry.comp.type;
    const placeholders = [...found].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    if (!placeholders.length) {
      body.innerHTML = '<tr><td colspan="2">No #placeholders on this object. Assign a parameter file if needed.</td></tr>';
    } else {
      body.innerHTML = placeholders.map((ph) => `
        <tr>
          <td>${escapeHtml(ph)}</td>
          <td><input type="text" data-go-ph="${escapeHtml(ph)}" value="${escapeHtml(values[ph] || '')}" /></td>
        </tr>`).join('');
    }
    $('goParamFile').value = entry.comp.parameterFile || '';
    $('globalParamValuesDialog')?.showModal();
  }

  async function applyGlobalParamValues(closeAfter) {
    const parameterFile = $('goParamFile')?.value.trim() || '';
    const parameterValues = {};
    document.querySelectorAll('#goParamValuesBody input[data-go-ph]').forEach((input) => {
      parameterValues[input.dataset.goPh] = input.value.trim();
    });
    const ok = await saveSelectedComponents((comp) => {
      comp.parameterFile = parameterFile;
      comp.parameterValues = parameterValues;
      return comp;
    });
    if (ok) window.setStatus?.('Parameter values saved');
    if (closeAfter) $('globalParamValuesDialog')?.close();
  }

  async function showGlobalParamDefinitions() {
    if (!window.isEditingGlobalObject?.()) {
      window.setStatus?.('Open a global object to edit parameter definitions');
      return;
    }
    const canvas = await window.fetchOpenCanvas();
    const found = new Set();
    collectPlaceholders(canvas, found);
    const defs = Array.isArray(canvas.parameterDefinitions) ? canvas.parameterDefinitions : [];
    const byPh = new Map(defs.map((d) => [d.placeholder, d.description || '']));
    const placeholders = [...found].sort((a, b) => Number(String(a).slice(1)) - Number(String(b).slice(1)));
    const body = $('goParamDefsBody');
    if (!placeholders.length) {
      body.innerHTML = '<tr><td colspan="2">This global object does not use #placeholders yet.</td></tr>';
    } else {
      body.innerHTML = placeholders.map((ph) => `
        <tr>
          <td>${escapeHtml(ph)}</td>
          <td><input type="text" data-go-def="${escapeHtml(ph)}" value="${escapeHtml(byPh.get(ph) || '')}" placeholder="Description" /></td>
        </tr>`).join('');
    }
    $('globalParamDefsDialog')?.showModal();
  }

  async function applyGlobalParamDefinitions(closeAfter) {
    const parameterDefinitions = [...document.querySelectorAll('#goParamDefsBody input[data-go-def]')].map((input) => ({
      placeholder: input.dataset.goDef,
      description: input.value.trim()
    }));
    await window.pushUndoBefore?.({ screenKeys: ['components'] });
    await window.patchOpenCanvas({ parameterDefinitions });
    window.setStatus?.('Parameter definitions saved');
    if (closeAfter) $('globalParamDefsDialog')?.close();
  }

  function editBaseObject() {
    if (!requireDisplay()) return;
    const canvas = window.state?.canvasEditCache?.raw;
    const id = canvas?.template?.globalObjectId || 'Template';
    window.openGlobalObjectPreview?.(id, id);
  }

  async function breakLink() {
    if (!requireDisplay()) return;
    const entries = selectedEntries().filter((entry) => entry.ref?.type === 'template-override' && entry.comp);
    if (!entries.length) {
      window.setStatus?.('Select a template / global-object graphic to break its link');
      return;
    }
    await window.pushUndoBefore?.({ screenKeys: ['components'] });
    const canvas = await window.fetchOpenCanvas();
    const components = [...(canvas.components || [])];
    for (const entry of entries) {
      const copy = JSON.parse(JSON.stringify(entry.comp));
      delete copy._source;
      copy.name = window.uniquePastedName?.(components, copy.name || 'Object1') || `${copy.name || 'Object'}_local`;
      components.push(copy);
    }
    await window.patchOpenCanvas({ components });
    for (const entry of entries) {
      await window.removeTemplateOverride?.(entry.ref.name);
    }
    await window.updateCanvasPreview?.({ forceReload: true });
    window.refreshObjectExplorer?.();
    window.scheduleRefreshCanvasEditOverlay?.();
    window.setStatus?.(`Broke link on ${entries.length} object(s)`);
  }

  async function showFirmwareWizard() {
    if (!requireProject()) return;
    let version = '0.2.0';
    try {
      const status = await window.fetchJson(`/api/runtime/status?project=${encodeURIComponent(window.state.activeProject)}`);
      version = status.version || version;
      $('fwProduct').textContent = status.platform || 'Plant HMI';
      $('fwProject').textContent = status.projectName || window.state.activeProject;
    } catch {
      $('fwProduct').textContent = 'Plant HMI';
      $('fwProject').textContent = window.state.activeProject;
    }
    $('fwVersion').textContent = version;
    $('firmwareWizardDialog')?.showModal();
  }

  async function showDomainCertificateDialog() {
    if (!requireProject()) return;
    await window.refreshProjectConfig?.();
    const tls = window.state.projectConfig?.runtime?.tls || {};
    $('tlsEnabled').checked = Boolean(tls.enabled);
    $('tlsCertPath').value = tls.certPath || '';
    $('tlsKeyPath').value = tls.keyPath || '';
    $('domainCertificateDialog')?.showModal();
  }

  async function saveDomainCertificate() {
    const tls = {
      enabled: Boolean($('tlsEnabled')?.checked),
      certPath: $('tlsCertPath')?.value.trim() || '',
      keyPath: $('tlsKeyPath')?.value.trim() || ''
    };
    const runtime = { ...(window.state.projectConfig?.runtime || {}), tls };
    await window.fetchJson(`/api/projects/${encodeURIComponent(window.state.activeProject)}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runtime })
    });
    await window.refreshProjectConfig?.();
    $('domainCertificateDialog')?.close();
    window.setStatus?.(tls.enabled ? `HTTPS certificate saved (${tls.certPath || 'path pending'})` : 'HTTPS disabled');
  }

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function showTamperDialog() {
    if (!requireProject()) return;
    await window.refreshProjectConfig?.();
    const models = window.state.projectConfig?.dataLogModels || {};
    const seals = window.state.projectConfig?.dataLogTamper?.seals || {};
    const names = Object.keys(models).filter((n) => n && n !== 'Untitled').sort();
    const body = $('tamperTableBody');
    if (!names.length) {
      body.innerHTML = '<tr><td colspan="3">No data log models in this project.</td></tr>';
    } else {
      body.innerHTML = names.map((name) => `
        <tr>
          <td>${escapeHtml(name)}</td>
          <td class="mono">${escapeHtml((seals[name] || '').slice(0, 16) || '—')}</td>
          <td data-tamper-status="${escapeHtml(name)}">—</td>
        </tr>`).join('');
    }
    $('tamperDetectDialog')?.showModal();
  }

  async function sealDataLogs() {
    const models = Object.keys(window.state.projectConfig?.dataLogModels || {}).filter((n) => n && n !== 'Untitled');
    const seals = { ...(window.state.projectConfig?.dataLogTamper?.seals || {}) };
    for (const name of models) {
      const data = await window.fetchJson(`/api/runtime/data-log/${encodeURIComponent(name)}?project=${encodeURIComponent(window.state.activeProject)}`);
      seals[name] = await sha256(JSON.stringify(data));
    }
    await window.fetchJson(`/api/projects/${encodeURIComponent(window.state.activeProject)}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataLogTamper: { seals, sealedAt: new Date().toISOString() } })
    });
    await window.refreshProjectConfig?.();
    await showTamperDialog();
    window.setStatus?.(`Sealed ${models.length} data log model(s)`);
  }

  async function verifyDataLogs() {
    const seals = window.state.projectConfig?.dataLogTamper?.seals || {};
    const names = Object.keys(window.state.projectConfig?.dataLogModels || {}).filter((n) => n && n !== 'Untitled');
    for (const name of names) {
      const cell = document.querySelector(`[data-tamper-status="${CSS.escape(name)}"]`);
      if (!seals[name]) {
        if (cell) cell.textContent = 'Not sealed';
        continue;
      }
      const data = await window.fetchJson(`/api/runtime/data-log/${encodeURIComponent(name)}?project=${encodeURIComponent(window.state.activeProject)}`);
      const hash = await sha256(JSON.stringify(data));
      if (cell) cell.textContent = hash === seals[name] ? 'OK' : 'TAMPERED';
    }
    window.setStatus?.('Data log tamper check complete');
  }

  let bound = false;
  function initDialogs() {
    if (bound) return;
    if (!$('animationForm')) return;
    bound = true;
    $('animationForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      applyAnimation(true).catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('animationApply')?.addEventListener('click', () => {
      applyAnimation(false).catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('animationCancel')?.addEventListener('click', () => $('animationDialog')?.close());
    $('animationHelp')?.addEventListener('click', () => {
      alert('Animation attaches expressions to the selected object.\n\nVisibility hides the object when the expression is false. Color, fill, position, and size expressions are stored with the object for runtime.');
    });
    document.querySelectorAll('[data-anim-tag]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = $(`animExpr_${btn.dataset.animTag}`);
        window.StudioTagTools?.openTagBrowser?.(input);
      });
    });
    document.querySelectorAll('[data-anim-expr]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = $(`animExpr_${btn.dataset.animExpr}`);
        window.StudioTagTools?.openExpressionEditor?.(input, input?.value);
      });
    });

    $('objectConnectionsForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      applyConnections(true).catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('objectConnectionsApply')?.addEventListener('click', () => {
      applyConnections(false).catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('objectConnectionsCancel')?.addEventListener('click', () => $('objectConnectionsDialog')?.close());

    $('tagSubstitutionForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      runTagSubstitution().catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('tagSubCancel')?.addEventListener('click', () => $('tagSubstitutionDialog')?.close());
    $('tagSubFindBrowse')?.addEventListener('click', () => window.StudioTagTools?.openTagBrowser?.($('tagSubFind')));
    $('tagSubReplaceBrowse')?.addEventListener('click', () => window.StudioTagTools?.openTagBrowser?.($('tagSubReplace')));

    $('globalParamValuesForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      applyGlobalParamValues(true).catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('goParamValuesCancel')?.addEventListener('click', () => $('globalParamValuesDialog')?.close());
    $('globalParamDefsForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      applyGlobalParamDefinitions(true).catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('goParamDefsCancel')?.addEventListener('click', () => $('globalParamDefsDialog')?.close());

    $('fwCreateRuntime')?.addEventListener('click', () => {
      $('firmwareWizardDialog')?.close();
      window.showCreateRuntimeDialog?.();
    });
    $('fwTransfer')?.addEventListener('click', () => {
      $('firmwareWizardDialog')?.close();
      $('transferDialog')?.showModal();
    });
    $('fwClose')?.addEventListener('click', () => $('firmwareWizardDialog')?.close());

    $('domainCertificateForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveDomainCertificate().catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('tlsCancel')?.addEventListener('click', () => $('domainCertificateDialog')?.close());

    $('tamperSealBtn')?.addEventListener('click', () => {
      sealDataLogs().catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('tamperVerifyBtn')?.addEventListener('click', () => {
      verifyDataLogs().catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('tamperClose')?.addEventListener('click', () => $('tamperDetectDialog')?.close());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDialogs);
  } else {
    initDialogs();
  }

  window.StudioMenuCommands = {
    initDialogs,
    showLibraryBrowser,
    showAnimationDialog,
    copyAnimation,
    pasteAnimation,
    pasteWithoutLocalizedStrings,
    showConnectionsDialog,
    showTagSubstitutionDialog,
    showGlobalParamValues,
    showGlobalParamDefinitions,
    editBaseObject,
    breakLink,
    showFirmwareWizard,
    showDomainCertificateDialog,
    showTamperDialog
  };
})();
