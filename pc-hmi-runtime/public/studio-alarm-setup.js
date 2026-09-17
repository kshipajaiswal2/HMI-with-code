/** FactoryTalk View ME-style Alarm Setup (Triggers / Messages / Advanced). */
(function () {
  const HOLD_TIMES = [50, 250, 500, 750, 1000, 2000, 3000, 4000, 5000];
  const UPDATE_RATES = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 60, 120];
  const TRIGGER_TYPES = [
    { value: 'value', label: 'Value' },
    { value: 'bit', label: 'Bit' },
    { value: 'lsbit', label: 'LSBit' }
  ];
  const TRIGGER_CONNECTIONS = [
    ['handshake', 'Handshake'],
    ['ack', 'Ack'],
    ['remoteAck', 'Remote Ack'],
    ['remoteAckHandshake', 'Remote Ack Handshake'],
    ['message', 'Message'],
    ['messageNotification', 'Message Notification'],
    ['handshakeHold', 'Handshake Hold']
  ];
  const ADVANCED_CONNECTIONS = [
    ['silence', 'Silence'],
    ['remoteSilence', 'Remote Silence'],
    ['remoteAckAll', 'Remote Ack All'],
    ['statusReset', 'Status Reset'],
    ['closeDisplay', 'Close Display'],
    ['remoteCloseDisplay', 'Remote Close Display'],
    ['remoteClearHistory', 'Remote Clear History']
  ];
  const MSG_SORTS = [
    ['', '<none>'],
    ['trigger', 'Trigger'],
    ['triggerValue', 'Trigger value'],
    ['message', 'Message'],
    ['alarmIdentifier', 'Alarm Identifier']
  ];

  let working = emptySetup();
  let selectedTriggerId = '';
  let selectedMessageIndex = -1;
  let dirty = false;
  let triggerPickerMode = 'add';
  let pendingNewMessage = false;
  let warnResolve = null;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function uid(prefix) {
    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function emptyConnections(rows) {
    const out = {};
    for (const [key] of rows) out[key] = '';
    return out;
  }

  function defaultTrigger(expression = '') {
    return {
      id: uid('t'),
      expression,
      type: 'value',
      label: 'Label1',
      useAckAll: false,
      ackAllValue: 0,
      connections: emptyConnections(TRIGGER_CONNECTIONS)
    };
  }

  function defaultMessage(triggerId = '') {
    return {
      triggerId,
      triggerValue: 1,
      message: '',
      alarmIdentifier: '',
      display: true,
      audio: false,
      print: false,
      messageToTag: false,
      background: '#800000',
      foreground: '#ffffff'
    };
  }

  function defaultAdvanced() {
    return {
      currentAlarmsDisplay: '[ALARM]',
      holdTimeMs: 250,
      maxUpdateRateSec: 1,
      embeddedServerUpdateRate: 'match',
      maxHistory: 128,
      capacityHighPct: 90,
      capacityHighTag: '',
      capacityHighHighPct: 99,
      capacityHighHighTag: '',
      capacityOverrun: '',
      connections: emptyConnections(ADVANCED_CONNECTIONS)
    };
  }

  function emptySetup() {
    return { triggers: [], messages: [], advanced: defaultAdvanced() };
  }

  function normalizeTrigger(raw, index = 0) {
    const base = defaultTrigger();
    if (!raw || typeof raw !== 'object') {
      base.label = `Label${index + 1}`;
      return base;
    }
    const connections = { ...base.connections, ...(raw.connections || {}) };
    return {
      id: String(raw.id || base.id),
      expression: String(raw.expression || raw.tag || '').trim(),
      type: TRIGGER_TYPES.some((t) => t.value === raw.type) ? raw.type : 'value',
      label: String(raw.label || `Label${index + 1}`),
      useAckAll: Boolean(raw.useAckAll),
      ackAllValue: Number(raw.ackAllValue) || 0,
      connections
    };
  }

  function normalizeMessage(raw) {
    const base = defaultMessage();
    if (!raw || typeof raw !== 'object') return base;
    const ident = raw.alarmIdentifier ?? raw.priority ?? '';
    return {
      triggerId: String(raw.triggerId || ''),
      triggerValue: raw.triggerValue === '' || raw.triggerValue == null ? 1 : raw.triggerValue,
      message: String(raw.message || ''),
      alarmIdentifier: ident === '' || ident == null ? '' : ident,
      display: raw.display !== false,
      audio: Boolean(raw.audio),
      print: Boolean(raw.print),
      messageToTag: Boolean(raw.messageToTag),
      background: String(raw.background || '#800000'),
      foreground: String(raw.foreground || '#ffffff')
    };
  }

  function normalizeSetup(raw) {
    const setup = emptySetup();
    if (!raw || typeof raw !== 'object') return setup;
    setup.triggers = Array.isArray(raw.triggers) ? raw.triggers.map((t, i) => normalizeTrigger(t, i)) : [];
    setup.messages = Array.isArray(raw.messages) ? raw.messages.map(normalizeMessage) : [];
    setup.advanced = { ...defaultAdvanced(), ...(raw.advanced || {}) };
    setup.advanced.connections = { ...defaultAdvanced().connections, ...(raw.advanced?.connections || {}) };
    return setup;
  }

  function stripBraces(expr) {
    return String(expr || '').trim().replace(/^\{|\}$/g, '');
  }

  function runtimeTagFromExpression(expr) {
    const inner = stripBraces(expr);
    if (!inner) return '';
    const plc = inner.match(/^\[PLC\](.+)$/i);
    if (plc) return `PLC uploded Tags.${plc[1]}`;
    return inner;
  }

  function fromLegacyAlarms(alarms, existingSetup) {
    const setup = normalizeSetup(existingSetup);
    const list = Array.isArray(alarms) ? alarms : [];
    if (!list.length) return setup;
    if (setup.triggers.length || setup.messages.length) return setup;
    const byExpr = new Map();
    for (const alarm of list) {
      const expr = String(alarm.expression || alarm.tag || '').trim();
      if (!expr) continue;
      let trig = byExpr.get(expr);
      if (!trig) {
        trig = defaultTrigger(expr);
        trig.label = `Label${setup.triggers.length + 1}`;
        byExpr.set(expr, trig);
        setup.triggers.push(trig);
      }
      const msg = normalizeMessage({
        ...alarm,
        triggerId: trig.id,
        triggerValue: alarm.triggerValue ?? 1,
        alarmIdentifier: alarm.alarmIdentifier ?? alarm.priority ?? setup.messages.length + 1
      });
      setup.messages.push(msg);
    }
    return setup;
  }

  function deriveAlarms(setup) {
    const src = normalizeSetup(setup);
    const byId = new Map(src.triggers.map((t) => [t.id, t]));
    return src.messages.map((msg, index) => {
      const trig = byId.get(msg.triggerId);
      const expression = trig?.expression || '';
      const ident = msg.alarmIdentifier === '' || msg.alarmIdentifier == null
        ? index + 1
        : Number(msg.alarmIdentifier) || index + 1;
      return {
        tag: runtimeTagFromExpression(expression) || stripBraces(expression),
        expression,
        triggerType: trig?.type || 'value',
        triggerValue: msg.triggerValue,
        message: msg.message,
        priority: Math.min(15, Math.max(1, Math.round(Number(ident) || 5))),
        alarmIdentifier: msg.alarmIdentifier,
        display: msg.display !== false,
        audio: Boolean(msg.audio),
        print: Boolean(msg.print),
        messageToTag: Boolean(msg.messageToTag),
        background: msg.background,
        foreground: msg.foreground
      };
    }).filter((a) => a.message && (a.tag || a.expression));
  }

  function markDirty() {
    dirty = true;
    const apply = $('alarmSetupApply');
    if (apply) apply.disabled = false;
  }

  function setTab(name) {
    const dlg = $('alarmSetupDialog');
    if (!dlg) return;
    dlg.querySelectorAll('.dialog-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === name);
    });
    dlg.querySelectorAll('[data-tab-panel]').forEach((panel) => {
      panel.classList.toggle('active', panel.getAttribute('data-tab-panel') === name);
    });
  }

  function fillSelect(el, values, selected, formatter) {
    if (!el) return;
    el.innerHTML = values.map((v) => {
      const label = formatter ? formatter(v) : String(v);
      const sel = String(v) === String(selected) ? ' selected' : '';
      return `<option value="${escapeHtml(v)}"${sel}>${escapeHtml(label)}</option>`;
    }).join('');
  }

  function fillRateSelect(el, selected, includeMatch) {
    if (!el) return;
    const opts = [];
    if (includeMatch) opts.push(`<option value="match"${selected === 'match' ? ' selected' : ''}>Match Alarm Update Rate</option>`);
    for (const v of UPDATE_RATES) {
      opts.push(`<option value="${v}"${String(v) === String(selected) ? ' selected' : ''}>${v}</option>`);
    }
    el.innerHTML = opts.join('');
  }

  function selectedTrigger() {
    return working.triggers.find((t) => t.id === selectedTriggerId) || null;
  }

  function triggerLabel(trig) {
    return trig?.expression || '(unnamed)';
  }

  function readTriggerSettingsInto(trig) {
    if (!trig) return;
    trig.type = $('asTriggerType')?.value || 'value';
    trig.label = $('asTriggerLabel')?.value || 'Label1';
    trig.useAckAll = Boolean($('asUseAckAll')?.checked);
    trig.ackAllValue = Number($('asAckAllValue')?.value) || 0;
    trig.connections = trig.connections || emptyConnections(TRIGGER_CONNECTIONS);
    for (const [key] of TRIGGER_CONNECTIONS) {
      const input = document.querySelector(`#asTriggerConnTable input[data-as-conn="${key}"]`);
      if (input) trig.connections[key] = input.value.trim();
    }
  }

  function writeTriggerSettings(trig) {
    const enabled = Boolean(trig);
    ['asTriggerType', 'asTriggerLabel', 'asUseAckAll', 'asAckAllValue'].forEach((id) => {
      const el = $(id);
      if (el) el.disabled = !enabled;
    });
    if (!trig) {
      if ($('asTriggerType')) $('asTriggerType').value = 'value';
      if ($('asTriggerLabel')) $('asTriggerLabel').value = '';
      if ($('asUseAckAll')) $('asUseAckAll').checked = false;
      if ($('asAckAllValue')) $('asAckAllValue').value = '0';
      renderConnectionTable('asTriggerConnTable', TRIGGER_CONNECTIONS, {});
      document.querySelectorAll('#asTriggerConnTable input, #asTriggerConnTable button').forEach((el) => {
        el.disabled = true;
      });
      return;
    }
    $('asTriggerType').value = trig.type || 'value';
    $('asTriggerLabel').value = trig.label || 'Label1';
    $('asUseAckAll').checked = Boolean(trig.useAckAll);
    $('asAckAllValue').value = String(trig.ackAllValue ?? 0);
    $('asAckAllValue').disabled = !trig.useAckAll;
    renderConnectionTable('asTriggerConnTable', TRIGGER_CONNECTIONS, trig.connections || {});
    document.querySelectorAll('#asTriggerConnTable input, #asTriggerConnTable button').forEach((el) => {
      el.disabled = false;
    });
  }

  function renderConnectionTable(tableId, rows, values) {
    const table = $(tableId);
    if (!table) return;
    const body = table.querySelector('tbody');
    if (!body) return;
    body.innerHTML = rows.map(([key, name]) => `
      <tr>
        <td class="as-conn-name">${escapeHtml(name)}</td>
        <td><input type="text" data-as-conn="${escapeHtml(key)}" value="${escapeHtml(values?.[key] || '')}" /></td>
        <td class="as-conn-btn"><button type="button" class="ft-mini-btn" data-as-tag="1" title="Browse tags">...</button></td>
        <td class="as-conn-btn"><button type="button" class="ft-mini-btn" data-as-expr="1" title="Expression editor">...</button></td>
      </tr>
    `).join('');
  }

  function renderTriggerList() {
    const list = $('asTriggerList');
    if (!list) return;
    if (!working.triggers.some((t) => t.id === selectedTriggerId)) {
      selectedTriggerId = working.triggers[0]?.id || '';
    }
    list.innerHTML = working.triggers.map((t) => {
      const sel = t.id === selectedTriggerId ? ' selected' : '';
      return `<option value="${escapeHtml(t.id)}"${sel}>${escapeHtml(triggerLabel(t))}</option>`;
    }).join('');
    const has = working.triggers.length > 0;
    const edit = $('asTriggerEdit');
    const remove = $('asTriggerRemove');
    if (edit) edit.disabled = !has;
    if (remove) remove.disabled = !has;
    writeTriggerSettings(selectedTrigger());
    refreshMessageTriggerFilters();
  }

  function refreshMessageTriggerFilters() {
    const filter = $('asMsgTriggerFilter');
    const current = filter?.value || '';
    if (filter) {
      filter.innerHTML = `<option value="">&lt;none&gt;</option>`
        + working.triggers.map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(triggerLabel(t))}</option>`).join('');
      if ([...filter.options].some((o) => o.value === current)) filter.value = current;
    }
    renderMessages();
  }

  function visibleMessages() {
    const filterId = $('asMsgTriggerFilter')?.value || '';
    const sortBy = $('asMsgSortBy')?.value || '';
    let rows = working.messages.map((msg, index) => ({ msg, index }));
    if (filterId) rows = rows.filter((r) => r.msg.triggerId === filterId);
    if (sortBy === 'trigger') {
      rows.sort((a, b) => triggerExpr(a.msg).localeCompare(triggerExpr(b.msg)));
    } else if (sortBy === 'triggerValue') {
      rows.sort((a, b) => Number(a.msg.triggerValue) - Number(b.msg.triggerValue));
    } else if (sortBy === 'message') {
      rows.sort((a, b) => String(a.msg.message).localeCompare(String(b.msg.message)));
    } else if (sortBy === 'alarmIdentifier') {
      rows.sort((a, b) => String(a.msg.alarmIdentifier).localeCompare(String(b.msg.alarmIdentifier), undefined, { numeric: true }));
    }
    return rows;
  }

  function triggerExpr(msg) {
    const trig = working.triggers.find((t) => t.id === msg.triggerId);
    return trig ? triggerLabel(trig) : '';
  }

  function triggerOptionsHtml(selectedId) {
    return `<option value="">&lt;unassigned&gt;</option>`
      + working.triggers.map((t) => {
        const sel = t.id === selectedId ? ' selected' : '';
        return `<option value="${escapeHtml(t.id)}"${sel}>${escapeHtml(triggerLabel(t))}</option>`;
      }).join('');
  }

  function renderMessages() {
    const body = $('asMessageBody');
    if (!body) return;
    const useIdent = Boolean($('asUseAlarmIdentifier')?.checked);
    const rows = visibleMessages();
    if (!rows.some((r) => r.index === selectedMessageIndex) && rows.length) {
      selectedMessageIndex = rows[0].index;
    }
    if (!rows.length) selectedMessageIndex = -1;
    body.innerHTML = rows.length
      ? rows.map(({ msg, index }, vis) => `
        <tr data-msg-index="${index}" class="${index === selectedMessageIndex ? 'is-selected' : ''}">
          <td class="as-num">${vis + 1}</td>
          <td><select data-msg-field="triggerId">${triggerOptionsHtml(msg.triggerId)}</select></td>
          <td><input type="text" data-msg-field="triggerValue" value="${escapeHtml(msg.triggerValue)}" /></td>
          <td><input type="text" data-msg-field="message" value="${escapeHtml(msg.message)}" /></td>
          <td><input type="text" data-msg-field="alarmIdentifier" value="${escapeHtml(msg.alarmIdentifier)}" ${useIdent ? '' : 'disabled'} /></td>
          <td class="as-check"><input type="checkbox" data-msg-field="display" ${msg.display ? 'checked' : ''} /></td>
          <td class="as-check"><input type="checkbox" data-msg-field="audio" ${msg.audio ? 'checked' : ''} /></td>
          <td class="as-check"><input type="checkbox" data-msg-field="print" ${msg.print ? 'checked' : ''} /></td>
          <td class="as-check"><input type="checkbox" data-msg-field="messageToTag" ${msg.messageToTag ? 'checked' : ''} /></td>
          <td class="as-color"><input type="color" data-msg-field="background" value="${escapeHtml(msg.background || '#800000')}" /></td>
          <td class="as-color"><input type="color" data-msg-field="foreground" value="${escapeHtml(msg.foreground || '#ffffff')}" /></td>
        </tr>
      `).join('')
      : `<tr class="as-empty"><td colspan="11">No alarm messages — click New… to add one</td></tr>`;
    const del = $('asMsgDelete');
    if (del) del.disabled = selectedMessageIndex < 0;
  }

  function collectAdvanced() {
    const adv = working.advanced;
    adv.currentAlarmsDisplay = $('asCurrentAlarms')?.value.trim() || '[ALARM]';
    adv.holdTimeMs = Number($('asHoldTime')?.value) || 250;
    adv.maxUpdateRateSec = Number($('asMaxUpdateRate')?.value) || 1;
    adv.embeddedServerUpdateRate = $('asEmbeddedRate')?.value || 'match';
    adv.maxHistory = Number($('asMaxHistory')?.value) || 128;
    adv.capacityHighPct = Number($('asCapHigh')?.value) || 90;
    adv.capacityHighHighPct = Number($('asCapHighHigh')?.value) || 99;
    adv.capacityHighTag = $('asCapHighTag')?.value.trim() || '';
    adv.capacityHighHighTag = $('asCapHighHighTag')?.value.trim() || '';
    adv.capacityOverrun = $('asCapOverrun')?.value.trim() || '';
    adv.connections = adv.connections || emptyConnections(ADVANCED_CONNECTIONS);
    for (const [key] of ADVANCED_CONNECTIONS) {
      const input = document.querySelector(`#asAdvancedConnTable input[data-as-conn="${key}"]`);
      if (input) adv.connections[key] = input.value.trim();
    }
  }

  function writeAdvanced() {
    const adv = working.advanced;
    if ($('asCurrentAlarms')) $('asCurrentAlarms').value = adv.currentAlarmsDisplay || '[ALARM]';
    fillSelect($('asHoldTime'), HOLD_TIMES, adv.holdTimeMs);
    fillRateSelect($('asMaxUpdateRate'), adv.maxUpdateRateSec, false);
    fillRateSelect($('asEmbeddedRate'), adv.embeddedServerUpdateRate, true);
    if ($('asMaxHistory')) $('asMaxHistory').value = adv.maxHistory ?? 128;
    if ($('asCapHigh')) $('asCapHigh').value = adv.capacityHighPct ?? 90;
    if ($('asCapHighHigh')) $('asCapHighHigh').value = adv.capacityHighHighPct ?? 99;
    if ($('asCapHighTag')) $('asCapHighTag').value = adv.capacityHighTag || '';
    if ($('asCapHighHighTag')) $('asCapHighHighTag').value = adv.capacityHighHighTag || '';
    if ($('asCapOverrun')) $('asCapOverrun').value = adv.capacityOverrun || '';
    renderConnectionTable('asAdvancedConnTable', ADVANCED_CONNECTIONS, adv.connections || {});
  }

  function harvest() {
    readTriggerSettingsInto(selectedTrigger());
    collectAdvanced();
    return clone(working);
  }

  async function persist(setup, { close } = {}) {
    const project = window.state?.activeProject;
    if (!project) {
      window.setStatus?.('Open an application first');
      return false;
    }
    const normalized = normalizeSetup(setup);
    const alarms = deriveAlarms(normalized);
    await window.fetchJson(`/api/projects/${encodeURIComponent(project)}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alarmSetup: normalized, alarms })
    });
    await window.refreshProjectConfig?.();
    dirty = false;
    const apply = $('alarmSetupApply');
    if (apply) apply.disabled = true;
    window.setStatus?.(`Alarm Setup saved (${normalized.triggers.length} trigger(s), ${normalized.messages.length} message(s))`);
    if (close) $('alarmSetupDialog')?.close();
    return true;
  }

  function loadWorkingFromProject() {
    const cfg = window.state?.projectConfig || {};
    working = fromLegacyAlarms(cfg.alarms || [], cfg.alarmSetup);
    working = normalizeSetup(working);
    selectedTriggerId = working.triggers[0]?.id || '';
    selectedMessageIndex = working.messages.length ? 0 : -1;
    dirty = false;
  }

  function renderAll() {
    renderTriggerList();
    writeAdvanced();
    const apply = $('alarmSetupApply');
    if (apply) apply.disabled = !dirty;
  }

  async function showAlarmSetupDialog(options = {}) {
    initAlarmSetupDialog();
    if (!window.state?.activeProject) {
      window.setStatus?.('Open an application first');
      return;
    }
    await window.refreshProjectConfig?.();
    loadWorkingFromProject();
    const title = $('alarmSetupTitle');
    if (title) title.textContent = `Alarm Setup - /${window.state.activeProject}/`;
    setTab(options.tab || 'triggers');
    renderAll();
    $('alarmSetupDialog')?.showModal();
    if (options.newTrigger) openTriggerPicker('add');
    else if (options.newMessage) addMessage();
  }

  function openTriggerPicker(mode) {
    triggerPickerMode = mode;
    const trig = mode === 'edit' ? selectedTrigger() : null;
    if (mode === 'edit' && !trig) return;
    const input = $('asTriggerExpr');
    if (input) input.value = trig?.expression || '';
    $('alarmTriggerDialog')?.showModal();
    input?.focus();
  }

  function applyTriggerPicker() {
    const expr = $('asTriggerExpr')?.value.trim() || '';
    if (!expr) {
      alert('Enter a tag or expression for the trigger.');
      return;
    }
    if (triggerPickerMode === 'edit') {
      const trig = selectedTrigger();
      if (trig) trig.expression = expr;
    } else {
      const trig = defaultTrigger(expr);
      trig.label = `Label${working.triggers.length + 1}`;
      working.triggers.push(trig);
      selectedTriggerId = trig.id;
    }
    markDirty();
    renderTriggerList();
    renderMessages();
    $('alarmTriggerDialog')?.close();
    if (pendingNewMessage) {
      pendingNewMessage = false;
      addMessage();
    }
  }

  function confirmWarn(message) {
    return new Promise((resolve) => {
      warnResolve = resolve;
      const text = $('asWarnText');
      if (text) text.textContent = message;
      $('alarmSetupWarnDialog')?.showModal();
    });
  }

  async function removeSelectedTrigger() {
    const trig = selectedTrigger();
    if (!trig) return;
    pendingRemoveId = trig.id;
    const ok = await confirmWarn(`Messages assigned to trigger ${triggerLabel(trig)} will be left unassigned`);
    if (!ok) return;
    working.messages.forEach((msg) => {
      if (msg.triggerId === pendingRemoveId) msg.triggerId = '';
    });
    working.triggers = working.triggers.filter((t) => t.id !== pendingRemoveId);
    selectedTriggerId = working.triggers[0]?.id || '';
    markDirty();
    renderTriggerList();
    renderMessages();
  }

  function addMessage() {
    if (!working.triggers.length) {
      pendingNewMessage = true;
      openTriggerPicker('add');
      return;
    }
    const msg = defaultMessage(selectedTriggerId || working.triggers[0].id);
    const used = working.messages
      .map((m) => Number(m.alarmIdentifier))
      .filter((n) => Number.isFinite(n) && n > 0);
    msg.alarmIdentifier = (used.length ? Math.max(...used) : 0) + 1;
    working.messages.push(msg);
    selectedMessageIndex = working.messages.length - 1;
    markDirty();
    setTab('messages');
    renderMessages();
  }

  function deleteSelectedMessage() {
    if (selectedMessageIndex < 0) return;
    working.messages.splice(selectedMessageIndex, 1);
    selectedMessageIndex = Math.min(selectedMessageIndex, working.messages.length - 1);
    markDirty();
    renderMessages();
  }

  function pickInto(input, { ftRef } = {}) {
    if (!input || !window.StudioTagTools) return;
    window.StudioTagTools.openTagBrowser(null, (sel) => {
      input.value = ftRef ? (window.StudioTagTools.formatFtTagRef(sel) || sel) : sel;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  function exprInto(input) {
    if (!input || !window.StudioTagTools) return;
    window.StudioTagTools.openExpressionEditor(input, input.value);
  }

  async function pickDisplayInto(input) {
    if (!input || !window.showDisplayPickerDialog) return;
    const picked = await window.showDisplayPickerDialog(input.value);
    if (picked) {
      input.value = picked;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  async function mergeImportedAlarms(alarms) {
    await window.refreshProjectConfig?.();
    const cfg = window.state?.projectConfig || {};
    const setup = fromLegacyAlarms(cfg.alarms || [], cfg.alarmSetup);
    const imported = fromLegacyAlarms(alarms, emptySetup());
    const byExpr = new Map(setup.triggers.map((t) => [t.expression, t]));
    for (const trig of imported.triggers) {
      const existing = byExpr.get(trig.expression);
      if (existing) {
        imported.messages.forEach((m) => {
          if (m.triggerId === trig.id) m.triggerId = existing.id;
        });
      } else {
        setup.triggers.push(trig);
        byExpr.set(trig.expression, trig);
      }
    }
    for (const msg of imported.messages) {
      const dup = setup.messages.findIndex((m) => m.triggerId === msg.triggerId && String(m.triggerValue) === String(msg.triggerValue) && m.message === msg.message);
      if (dup >= 0) setup.messages[dup] = msg;
      else setup.messages.push(msg);
    }
    await persist(setup);
  }

  async function adoptLegacyAlarms(alarms) {
    await window.refreshProjectConfig?.();
    const advanced = normalizeSetup(window.state?.projectConfig?.alarmSetup).advanced;
    const setup = fromLegacyAlarms(alarms, emptySetup());
    setup.advanced = advanced;
    await persist(setup);
  }

  async function clearSetup() {
    await persist(emptySetup());
  }

  function initSelects() {
    const type = $('asTriggerType');
    if (type && !type.options.length) {
      type.innerHTML = TRIGGER_TYPES.map((t) => `<option value="${t.value}">${t.label}</option>`).join('');
    }
    const sort = $('asMsgSortBy');
    if (sort && !sort.options.length) {
      sort.innerHTML = MSG_SORTS.map(([v, l]) => `<option value="${escapeHtml(v)}">${escapeHtml(l)}</option>`).join('');
    }
    fillSelect($('asHoldTime'), HOLD_TIMES, 250);
    fillRateSelect($('asMaxUpdateRate'), 1, false);
    fillRateSelect($('asEmbeddedRate'), 'match', true);
  }

  function initAlarmSetupDialog() {
    const dlg = $('alarmSetupDialog');
    if (!dlg || dlg.dataset.asWired === '1') return;
    dlg.dataset.asWired = '1';
    initSelects();

    dlg.querySelectorAll('.dialog-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        readTriggerSettingsInto(selectedTrigger());
        collectAdvanced();
        setTab(btn.dataset.tab);
      });
    });

    $('alarmSetupForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      persist(harvest(), { close: true }).catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('alarmSetupForm')?.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      if (e.target?.tagName === 'TEXTAREA') return;
      if (e.target?.closest?.('.dialog-actions')) return;
      e.preventDefault();
    });
    $('alarmSetupCancel')?.addEventListener('click', () => dlg.close());
    $('alarmSetupApply')?.addEventListener('click', () => {
      persist(harvest(), { close: false }).catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('alarmSetupHelp')?.addEventListener('click', () => {
      alert(
        'Alarm Setup\n\n'
        + 'Triggers: tags or expressions that fire alarm messages (Value, Bit, or LSBit).\n'
        + 'Messages: text, identifier, display/audio/print flags, and colors for each trigger value.\n'
        + 'Advanced: hold time, update rates, history capacity, and optional silence/ack connections.\n\n'
        + 'Alarms are stored in project.json (alarmSetup) and evaluated at runtime when the trigger matches.'
      );
    });

    $('asTriggerList')?.addEventListener('change', () => {
      readTriggerSettingsInto(selectedTrigger());
      selectedTriggerId = $('asTriggerList').value;
      writeTriggerSettings(selectedTrigger());
    });
    $('asTriggerList')?.addEventListener('dblclick', () => openTriggerPicker('edit'));
    $('asTriggerAdd')?.addEventListener('click', () => openTriggerPicker('add'));
    $('asTriggerEdit')?.addEventListener('click', () => openTriggerPicker('edit'));
    $('asTriggerRemove')?.addEventListener('click', () => {
      removeSelectedTrigger().catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('asTriggerType')?.addEventListener('change', () => { readTriggerSettingsInto(selectedTrigger()); markDirty(); });
    $('asTriggerLabel')?.addEventListener('input', () => { readTriggerSettingsInto(selectedTrigger()); markDirty(); });
    $('asUseAckAll')?.addEventListener('change', () => {
      if ($('asAckAllValue')) $('asAckAllValue').disabled = !$('asUseAckAll').checked;
      readTriggerSettingsInto(selectedTrigger());
      markDirty();
    });
    $('asAckAllValue')?.addEventListener('input', () => { readTriggerSettingsInto(selectedTrigger()); markDirty(); });

    $('asMsgTriggerFilter')?.addEventListener('change', renderMessages);
    $('asMsgSortBy')?.addEventListener('change', renderMessages);
    $('asUseAlarmIdentifier')?.addEventListener('change', renderMessages);
    $('asClearIdentifiers')?.addEventListener('click', () => {
      working.messages.forEach((m) => { m.alarmIdentifier = ''; });
      markDirty();
      renderMessages();
    });
    $('asMsgNew')?.addEventListener('click', addMessage);
    $('asMsgDelete')?.addEventListener('click', deleteSelectedMessage);

    $('asMessageBody')?.addEventListener('click', (e) => {
      const row = e.target.closest('tr[data-msg-index]');
      if (!row) return;
      selectedMessageIndex = Number(row.dataset.msgIndex);
      $('asMessageBody').querySelectorAll('tr').forEach((r) => r.classList.toggle('is-selected', r === row));
      const del = $('asMsgDelete');
      if (del) del.disabled = false;
    });
    $('asMessageBody')?.addEventListener('input', (e) => {
      const field = e.target.getAttribute('data-msg-field');
      const row = e.target.closest('tr[data-msg-index]');
      if (!field || !row) return;
      const msg = working.messages[Number(row.dataset.msgIndex)];
      if (!msg) return;
      if (e.target.type === 'checkbox') msg[field] = e.target.checked;
      else msg[field] = e.target.value;
      markDirty();
    });
    $('asMessageBody')?.addEventListener('change', (e) => {
      const field = e.target.getAttribute('data-msg-field');
      const row = e.target.closest('tr[data-msg-index]');
      if (!field || !row) return;
      const msg = working.messages[Number(row.dataset.msgIndex)];
      if (!msg) return;
      if (e.target.type === 'checkbox') msg[field] = e.target.checked;
      else msg[field] = e.target.value;
      markDirty();
    });

    $('asCurrentAlarmsBrowse')?.addEventListener('click', () => {
      pickDisplayInto($('asCurrentAlarms')).catch((err) => window.setStatus?.(`Error: ${err.message}`));
    });
    $('asCurrentAlarmsEdit')?.addEventListener('click', () => {
      const id = $('asCurrentAlarms')?.value.trim();
      if (!id || id.startsWith('[')) {
        window.setStatus?.('Select a graphic display to edit');
        return;
      }
      window.setStatus?.(`Current alarms display: ${id}`);
    });
    ['asHoldTime', 'asMaxUpdateRate', 'asEmbeddedRate', 'asMaxHistory', 'asCapHigh', 'asCapHighHigh', 'asCapHighTag', 'asCapHighHighTag', 'asCapOverrun'].forEach((id) => {
      $(id)?.addEventListener('input', markDirty);
      $(id)?.addEventListener('change', markDirty);
    });
    $('asCapHighBrowse')?.addEventListener('click', () => pickInto($('asCapHighTag')));
    $('asCapHighHighBrowse')?.addEventListener('click', () => pickInto($('asCapHighHighTag')));
    $('asCapOverrunBrowse')?.addEventListener('click', () => pickInto($('asCapOverrun')));

    dlg.addEventListener('click', (e) => {
      const tagBtn = e.target.closest('[data-as-tag]');
      const exprBtn = e.target.closest('[data-as-expr]');
      if (!tagBtn && !exprBtn) return;
      const input = e.target.closest('tr')?.querySelector('input[data-as-conn]');
      if (!input) return;
      if (tagBtn) pickInto(input);
      else exprInto(input);
      markDirty();
    });
    dlg.addEventListener('input', (e) => {
      if (e.target.matches?.('input[data-as-conn]')) markDirty();
    });

    $('asTriggerPickerOk')?.addEventListener('click', applyTriggerPicker);
    $('asTriggerPickerCancel')?.addEventListener('click', () => {
      pendingNewMessage = false;
      $('alarmTriggerDialog')?.close();
    });
    $('asTriggerPickerHelp')?.addEventListener('click', () => {
      alert('Select the tag or expression that this trigger evaluates at runtime.');
    });
    $('asTriggerExprTag')?.addEventListener('click', () => pickInto($('asTriggerExpr'), { ftRef: true }));
    $('asTriggerExprExprn')?.addEventListener('click', () => exprInto($('asTriggerExpr')));
    $('asTriggerExpr')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyTriggerPicker();
      }
    });

    $('asWarnOk')?.addEventListener('click', () => {
      $('alarmSetupWarnDialog')?.close();
      const resolve = warnResolve;
      warnResolve = null;
      if (resolve) resolve(true);
    });
    $('asWarnCancel')?.addEventListener('click', () => {
      $('alarmSetupWarnDialog')?.close();
      const resolve = warnResolve;
      warnResolve = null;
      if (resolve) resolve(false);
    });
    $('alarmSetupWarnDialog')?.addEventListener('close', () => {
      if (warnResolve) {
        const resolve = warnResolve;
        warnResolve = null;
        resolve(false);
      }
    });
  }

  window.StudioAlarmSetup = {
    initAlarmSetupDialog,
    showAlarmSetupDialog,
    fromLegacyAlarms,
    deriveAlarms,
    mergeImportedAlarms,
    adoptLegacyAlarms,
    clearSetup,
    addMessage
  };
})();
