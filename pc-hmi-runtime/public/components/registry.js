const NAV_ICONS = {
  home: '⌂', settings: '⚙', manual: '☞', alarms: '🔔',
  recipe: '📋', legends: 'ℹ', user: '👤'
};

const ComponentRegistry = {
  SectionHeader(comp) {
    const el = document.createElement('h2');
    el.className = 'section-header';
    el.textContent = comp.label || '';
    return el;
  },

  SubNav(comp, ctx) {
    const nav = document.createElement('nav');
    nav.className = 'sub-nav';
    const items = ctx.navigation?.subNav?.[comp.navKey] || [];
    for (const item of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sub-nav-btn';
      btn.textContent = item.label;
      if (ctx.currentScreen === item.screen) btn.classList.add('active');
      btn.addEventListener('click', () => ctx.navigate(item.screen));
      nav.appendChild(btn);
    }
    return nav;
  },

  NavButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-btn';
    btn.textContent = comp.label;
    btn.addEventListener('click', () => ctx.navigate(comp.target));
    return btn;
  },

  ActionButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'action-btn';
    btn.textContent = comp.label;
    btn.addEventListener('click', () => {
      if (comp.action === 'ackAllAlarms') ctx.acknowledgeAllAlarms();
    });
    return btn;
  },

  ToggleButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toggle-btn';
    btn.textContent = comp.label;
    const update = (val) => {
      btn.classList.toggle('on', val === true || val === 1);
      btn.classList.toggle('off', !(val === true || val === 1));
    };
    ctx.bindTag(comp.tag, update);
    btn.addEventListener('click', async () => {
      const current = ctx.getTagValue(comp.tag);
      await ctx.writeTag(comp.tag, !(current === true || current === 1));
    });
    return btn;
  },

  MomentaryButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'momentary-btn';
    btn.textContent = comp.label;
    btn.addEventListener('mousedown', () => ctx.writeTag(comp.tag, comp.value));
    btn.addEventListener('mouseup', () => {
      if (comp.releaseValue !== undefined) ctx.writeTag(comp.tag, comp.releaseValue);
    });
    btn.addEventListener('mouseleave', () => {
      if (comp.releaseValue !== undefined) ctx.writeTag(comp.tag, comp.releaseValue);
    });
    return btn;
  },

  NumericDisplay(comp, ctx) {
    const card = document.createElement('div');
    card.className = 'metric-card';
    const label = document.createElement('div');
    label.className = 'metric-label';
    label.textContent = comp.label || comp.tag;
    const valueRow = document.createElement('div');
    const valueEl = document.createElement('span');
    valueEl.className = 'metric-value';
    valueEl.textContent = '—';
    valueRow.appendChild(valueEl);
    if (comp.unit) {
      const unit = document.createElement('span');
      unit.className = 'metric-unit';
      unit.textContent = comp.unit;
      valueRow.appendChild(unit);
    }
    card.appendChild(label);
    card.appendChild(valueRow);
    ctx.bindTag(comp.tag, (val) => {
      valueEl.textContent = ComponentRegistry.formatValue(val, comp);
    });
    return card;
  },

  StateIndicator(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'state-indicator';
    const label = document.createElement('div');
    label.className = 'state-label';
    label.textContent = comp.label || '';
    const value = document.createElement('div');
    value.className = 'state-value';
    value.textContent = '—';
    el.appendChild(label);
    el.appendChild(value);
    ctx.bindTag(comp.tag, (val) => {
      const key = String(val);
      const state = comp.states?.[key] || { text: String(val), color: '#888' };
      value.textContent = state.text;
      value.style.backgroundColor = state.color;
      el.style.borderColor = state.color;
    });
    return el;
  },

  DataTable(comp, ctx) {
    const table = document.createElement('table');
    table.className = 'data-table';
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr>${comp.columns.map((c) => `<th>${c}</th>`).join('')}</tr>`;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (const row of comp.rows || []) {
      const tr = document.createElement('tr');
      const valueCell = document.createElement('td');
      valueCell.className = 'mono';
      valueCell.textContent = '—';
      tr.innerHTML = `<td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.description || '')}</td>`;
      tr.appendChild(valueCell);
      tbody.appendChild(tr);
      if (row.tag) {
        ctx.bindTag(row.tag, (val) => {
          let text = ComponentRegistry.formatValue(val, row);
          if (row.unit) text += ' ' + row.unit;
          valueCell.textContent = text;
          if (row.format === 'boolean') {
            valueCell.style.color = (val === true || val === 1) ? '#00c000' : '#888';
            valueCell.style.fontWeight = '700';
          }
        });
      }
    }
    table.appendChild(tbody);
    return table;
  },

  LegendTable(comp) {
    const table = document.createElement('table');
    table.className = 'legend-table';
    table.innerHTML = '<thead><tr><th>Color</th><th>Meaning</th></tr></thead>';
    const tbody = document.createElement('tbody');
    for (const item of comp.items || []) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><span class="legend-swatch" style="background:${item.color}"></span></td><td>${escapeHtml(item.label)}</td>`;
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
  },

  AlarmList(comp, ctx) {
    const wrapper = document.createElement('div');
    const table = document.createElement('table');
    table.className = 'alarm-table';
    table.innerHTML = '<thead><tr><th>Time</th><th>Pri</th><th>Message</th><th>Status</th><th></th></tr></thead><tbody></tbody>';
    wrapper.appendChild(table);
    ctx.onAlarmUpdate((alarms) => {
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = '';
      if (!alarms.active.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No active alarms</td></tr>';
        return;
      }
      for (const alarm of alarms.active) {
        const tr = document.createElement('tr');
        tr.className = alarm.acknowledged ? 'acked' : 'unacked';
        tr.innerHTML = `<td>${formatTime(alarm.activatedAt)}</td><td>P${alarm.priority}</td><td>${escapeHtml(alarm.message)}</td><td>${alarm.acknowledged ? 'Ack' : 'Active'}</td><td class="ack-cell">${alarm.acknowledged ? '' : '<button type="button">Ack</button>'}</td>`;
        tr.querySelector('button')?.addEventListener('click', () => ctx.acknowledgeAlarm(alarm.id));
        tbody.appendChild(tr);
      }
    });
    return wrapper;
  },

  AlarmHistory(comp, ctx) {
    const wrapper = document.createElement('div');
    const table = document.createElement('table');
    table.className = 'alarm-table history';
    table.innerHTML = '<thead><tr><th>Time</th><th>Event</th><th>Priority</th><th>Message</th></tr></thead><tbody></tbody>';
    wrapper.appendChild(table);
    ctx.onAlarmUpdate((alarms) => {
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = '';
      const history = alarms.history || [];
      if (!history.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No alarm history</td></tr>';
        return;
      }
      for (const entry of history.slice(0, 30)) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${formatTime(entry.activatedAt || entry.acknowledgedAt || Date.now())}</td><td>${escapeHtml(entry.event || '—')}</td><td>P${entry.priority}</td><td>${escapeHtml(entry.message)}</td>`;
        tbody.appendChild(tr);
      }
    });
    return wrapper;
  },

  LoginPanel(comp, ctx) {
    const panel = document.createElement('div');
    panel.className = 'login-panel';
    const status = document.createElement('div');
    status.className = 'login-status';
    const form = document.createElement('form');
    form.className = 'login-form';
    form.innerHTML = `
      <label>Username<input type="text" name="username" autocomplete="username" /></label>
      <label>Password<input type="password" name="password" autocomplete="current-password" /></label>
      <div class="login-actions">
        <button type="submit" class="action-btn primary">Login</button>
        <button type="button" class="action-btn" data-action="logout">Logout</button>
      </div>
      <p class="login-hint">operator/operator · engineer/engineer · admin/admin</p>
    `;
    const refresh = () => {
      const user = ctx.getCurrentUser();
      status.innerHTML = user
        ? `<strong>Logged in:</strong> ${escapeHtml(user.username)} (${escapeHtml(user.role)}, level ${user.level})`
        : '<strong>Not logged in</strong> — Guest access only';
    };
    refresh();
    ctx.onUserChange(refresh);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      await ctx.login(fd.get('username'), fd.get('password'));
    });
    form.querySelector('[data-action="logout"]').addEventListener('click', () => ctx.logout());
    panel.appendChild(status);
    panel.appendChild(form);
    return panel;
  },

  Panel(comp, ctx) {
    const panel = document.createElement('div');
    panel.className = comp.style?.className || 'panel';
    for (const child of comp.children || []) {
      panel.appendChild(ComponentRegistry.render(child, ctx));
    }
    return panel;
  },

  Grid(comp, ctx) {
    const grid = document.createElement('div');
    grid.className = comp.style?.className || 'grid';
    for (const child of comp.children || []) {
      grid.appendChild(ComponentRegistry.render(child, ctx));
    }
    return grid;
  },

  Text(comp) {
    const el = document.createElement('p');
    el.className = 'panel-text';
    el.textContent = comp.label || '';
    return el;
  },

  formatValue(val, comp) {
    if (val === null || val === undefined) return '—';
    switch (comp.format) {
      case 'integer': return Math.round(Number(val)).toLocaleString();
      case 'float': return Number(val).toFixed(comp.decimals ?? 1);
      case 'percent': return Number(val).toFixed(comp.decimals ?? 1) + '%';
      case 'string': return String(val);
      case 'boolean': return (val === true || val === 1) ? 'ON' : 'OFF';
      default: return String(val);
    }
  },

  render(comp, ctx) {
    const renderer = ComponentRegistry[comp.type];
    if (!renderer) {
      const fallback = document.createElement('div');
      fallback.className = 'unknown-component';
      fallback.textContent = `Unknown: ${comp.type}`;
      return fallback;
    }
    return renderer(comp, ctx);
  }
};

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
