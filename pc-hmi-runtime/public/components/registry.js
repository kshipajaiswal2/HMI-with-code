const ComponentRegistry = {
  Text(comp, ctx) {
    const el = document.createElement('p');
    el.className = 'panel-text';
    el.textContent = comp.label || '';
    return el;
  },

  NavButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-btn';
    btn.textContent = comp.label;
    btn.addEventListener('click', () => ctx.navigate(comp.target));
    return btn;
  },

  NumericDisplay(comp, ctx) {
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.dataset.tag = comp.tag;

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
      const state = comp.states?.[key] || comp.states?.[val] || { text: String(val), color: '#888' };
      value.textContent = state.text;
      value.style.backgroundColor = state.color;
      el.style.borderColor = state.color;
    });
    return el;
  },

  Panel(comp, ctx) {
    const panel = document.createElement('div');
    panel.className = comp.style?.className || 'panel';
    panel.id = comp.id || '';
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

  AlarmList(comp, ctx) {
    const wrapper = document.createElement('div');
    wrapper.id = comp.id || 'alarm-list';

    const table = document.createElement('table');
    table.className = 'alarm-table';
    table.innerHTML = `
      <thead><tr>
        <th>Time</th><th>Priority</th><th>Message</th><th>Status</th><th></th>
      </tr></thead>
      <tbody></tbody>
    `;
    wrapper.appendChild(table);

    ctx.onAlarmUpdate((alarms) => {
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = '';
      if (!alarms.active.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:#888;">No active alarms</td></tr>';
        return;
      }
      for (const alarm of alarms.active) {
        const tr = document.createElement('tr');
        tr.className = alarm.acknowledged ? 'acked' : 'unacked';
        tr.innerHTML = `
          <td>${formatTime(alarm.activatedAt)}</td>
          <td class="priority-${alarm.priority}">P${alarm.priority}</td>
          <td>${escapeHtml(alarm.message)}</td>
          <td>${alarm.acknowledged ? 'Acknowledged' : 'Active'}</td>
          <td class="ack-cell">${alarm.acknowledged ? '' : '<button type="button">Ack</button>'}</td>
        `;
        const ackBtn = tr.querySelector('button');
        if (ackBtn) {
          ackBtn.addEventListener('click', () => ctx.acknowledgeAlarm(alarm.id));
        }
        tbody.appendChild(tr);
      }
    });
    return wrapper;
  },

  formatValue(val, comp) {
    if (val === null || val === undefined) return '—';
    switch (comp.format) {
      case 'integer': return Math.round(Number(val)).toLocaleString();
      case 'float': return Number(val).toFixed(comp.decimals ?? 1);
      case 'percent': return Number(val).toFixed(comp.decimals ?? 1) + '%';
      case 'string': return String(val);
      case 'boolean': return val ? 'ON' : 'OFF';
      default: return String(val);
    }
  },

  render(comp, ctx) {
    const renderer = ComponentRegistry[comp.type];
    if (!renderer) {
      const fallback = document.createElement('div');
      fallback.textContent = `Unknown component: ${comp.type}`;
      fallback.style.color = 'red';
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
