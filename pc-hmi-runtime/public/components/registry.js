const NAV_ICONS = {
  home: '⌂', settings: '⚙', manual: '☞', alarms: '🔔',
  recipe: '📋', legends: 'ℹ', user: '👤'
};

const NAV_IMAGES = {
  home: 'button2_home.bmp',
  settings: 'button2_settings.bmp',
  manual: 'manual1.bmp',
  alarms: 'button2_alarm.bmp',
  recipe: 'recipe1 1.bmp',
  legends: 'legend1.bmp',
  user: 'userorange_2.bmp'
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
    btn.className = 'ft-momentary-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }

    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const states = comp.states?.length
      ? comp.states
      : ComponentRegistry.defaultMomentaryButtonStates(comp.caption ?? comp.label);
    const caption = document.createElement('span');
    caption.className = 'ft-btn-caption';
    caption.style.pointerEvents = 'none';
    btn.style.display = 'flex';
    btn.style.padding = '0 4px';
    btn.style.overflow = 'hidden';
    btn.appendChild(caption);

    let pressed = false;
    let releaseTimer = null;
    const holdTime = comp.holdTime ?? 250;
    const indicatorTag = comp.indicatorTag || comp.tag;

    const renderState = (stateDef) => {
      if (!stateDef) return;
      const merged = ComponentRegistry.mergeMomentaryState(comp, stateDef);
      ComponentRegistry.applyButtonAppearance(btn, { ...merged, studioEdit });
      caption.textContent = stateDef.caption ?? comp.caption ?? comp.label ?? '';
      const alignId = stateDef.alignment || comp.alignment || 'middleCenter';
      const align = ComponentRegistry.textAlignment(alignId);
      btn.style.justifyContent = align.justify;
      btn.style.alignItems = align.align;
      ComponentRegistry.applyCaptionStyle(caption, {
        fontFamily: comp.fontFamily,
        fontSize: comp.fontSize,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: stateDef.captionColor || stateDef.foreColor || comp.foreColor,
        useForeColor: stateDef.useCaptionColor !== false && comp.useForeColor !== false,
        wordWrap: stateDef.wordWrap !== undefined ? stateDef.wordWrap : comp.wordWrap,
        alignment: alignId
      });
      btn.classList.toggle('ft-blink', Boolean(stateDef.blink));
    };

    const showTagState = (val) => {
      if (pressed) return;
      renderState(ComponentRegistry.resolveMultistateState(states, val));
    };

    const defaultState = ComponentRegistry.resolveMultistateState(states, comp.releaseValue ?? 0);

    if (indicatorTag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(indicatorTag, showTagState, ctx);
    } else {
      renderState(defaultState);
    }

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'MomentaryButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'MomentaryButton',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const pressValue = comp.value ?? 1;
    const releaseValue = comp.releaseValue ?? 0;
    const state1 = states.find((s) => s.id === 'State1' || s.value === 1) || states[1];

    const press = () => {
      if (releaseTimer) {
        clearTimeout(releaseTimer);
        releaseTimer = null;
      }
      pressed = true;
      if (state1) renderState(state1);
      if (comp.tag) {
        const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
        if (writeTag) ctx.writeTag(writeTag, pressValue);
      }
    };

    const release = () => {
      if (!pressed) return;
      const finish = () => {
        pressed = false;
        releaseTimer = null;
        if (comp.tag) {
          const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
          if (writeTag) ctx.writeTag(writeTag, releaseValue);
        }
        const val = indicatorTag
          ? ComponentRegistry.readIndicatorRef(indicatorTag, ctx)
          : releaseValue;
        showTagState(val !== undefined ? val : releaseValue);
      };
      if (releaseTimer) clearTimeout(releaseTimer);
      if (holdTime > 0) releaseTimer = setTimeout(finish, holdTime);
      else finish();
    };

    btn.addEventListener('mousedown', (e) => { e.preventDefault(); press(); });
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
    if (comp.touch !== false) {
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); press(); }, { passive: false });
      btn.addEventListener('touchend', release);
      btn.addEventListener('touchcancel', release);
    }

    return btn;
  },

  MaintainedButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-maintained-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }

    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const states = comp.states?.length
      ? comp.states
      : ComponentRegistry.defaultMaintainedButtonStates(comp.caption ?? comp.label);
    const caption = document.createElement('span');
    caption.className = 'ft-btn-caption';
    caption.style.pointerEvents = 'none';
    btn.style.display = 'flex';
    btn.style.padding = '0 4px';
    btn.style.overflow = 'hidden';
    btn.appendChild(caption);

    const indicatorTag = comp.indicatorTag || comp.tag;
    const state0 = states.find((s) => s.id === 'State0') || states[0];
    const state1 = states.find((s) => s.id === 'State1') || states[1];
    const state0Val = state0?.value ?? 0;
    const state1Val = state1?.value ?? 1;

    const renderState = (stateDef) => {
      if (!stateDef) return;
      const merged = ComponentRegistry.mergeMomentaryState(comp, stateDef);
      ComponentRegistry.applyButtonAppearance(btn, { ...merged, studioEdit });
      caption.textContent = stateDef.caption ?? comp.caption ?? comp.label ?? '';
      const alignId = stateDef.alignment || comp.alignment || 'middleCenter';
      const align = ComponentRegistry.textAlignment(alignId);
      btn.style.justifyContent = align.justify;
      btn.style.alignItems = align.align;
      ComponentRegistry.applyCaptionStyle(caption, {
        fontFamily: comp.fontFamily,
        fontSize: comp.fontSize,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: stateDef.captionColor || stateDef.foreColor || comp.foreColor,
        useForeColor: stateDef.useCaptionColor !== false && comp.useForeColor !== false,
        wordWrap: stateDef.wordWrap !== undefined ? stateDef.wordWrap : comp.wordWrap,
        alignment: alignId
      });
      btn.classList.toggle('ft-blink', Boolean(stateDef.blink));
    };

    const showTagState = (val) => {
      renderState(ComponentRegistry.resolveMultistateState(states, val));
    };

    const defaultState = ComponentRegistry.resolveMultistateState(states, state0Val);

    if (indicatorTag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(indicatorTag, showTagState, ctx);
    } else {
      renderState(defaultState);
    }

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'MaintainedButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'MaintainedButton',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const isState1 = (val) => {
      const resolved = ComponentRegistry.resolveMultistateState(states, val);
      return resolved?.id === 'State1' || resolved?.value === state1Val;
    };

    const toggle = () => {
      const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
      if (!writeTag) return;
      const current = indicatorTag
        ? ComponentRegistry.readIndicatorRef(indicatorTag, ctx)
        : ctx.getTagValue(comp.tag);
      const nextVal = isState1(current) ? state0Val : state1Val;
      ctx.writeTag(writeTag, nextVal);
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggle();
    });

    return btn;
  },

  defaultMaintainedButtonStates(caption = 'Pump Run') {
    return ComponentRegistry.defaultMomentaryButtonStates(caption);
  },

  defaultMomentaryButtonStates(caption = 'Conveyor Run') {
    return [
      {
        id: 'State0', value: 0, backColor: '#dcdcdc', borderColor: '#c0c0c0',
        useBackColor: true, useBorderColor: false, caption,
        captionColor: '#000000', useCaptionColor: true,
        wordWrap: true, alignment: 'middleCenter', blink: false
      },
      {
        id: 'State1', value: 1, backColor: '#00c000', borderColor: '#40ff10',
        useBackColor: true, useBorderColor: true, caption,
        captionColor: '#ffffff', useCaptionColor: true,
        wordWrap: true, alignment: 'middleCenter', blink: false
      },
      {
        id: 'Error', backColor: 'navy', borderColor: 'navy',
        useBackColor: true, useBorderColor: true, caption: 'Error',
        captionColor: '#ffffff', useCaptionColor: true,
        wordWrap: true, alignment: 'middleCenter', blink: true
      }
    ];
  },

  mergeMomentaryState(comp, stateDef) {
    return {
      ...comp,
      useBackColor: stateDef.useBackColor !== false,
      backColor: stateDef.backColor || comp.backColor,
      useBorderColor: Boolean(stateDef.useBorderColor),
      borderColor: stateDef.borderColor || comp.borderColor,
      backStyle: stateDef.backStyle || comp.backStyle || 'solid',
      blink: stateDef.blink
    };
  },

  applyButtonAppearance(el, comp) {
    const borderWidth = comp.borderWidth ?? 1;
    const borderStyle = comp.borderStyle || 'raisedInset';
    const defaultFace = '#dcdcdc';
    const faceColor = comp.useBackColor ? (comp.backColor || defaultFace) : defaultFace;

    let borderColor = comp.borderColor || '#c0c0c0';
    if (comp.borderUsesBackColor) {
      borderColor = faceColor;
    } else if (comp.useBorderColor && comp.borderColor) {
      borderColor = comp.borderColor;
    }

    if (borderStyle === 'raisedInset') {
      el.style.borderStyle = 'solid';
      el.style.borderWidth = `${borderWidth}px`;
      el.style.borderColor = '#808080 #ffffff #ffffff #808080';
    } else if (borderStyle === 'raised') {
      el.style.borderStyle = 'solid';
      el.style.borderWidth = `${borderWidth}px`;
      if (comp.useBorderColor && comp.borderColor && !comp.borderUsesBackColor) {
        el.style.borderColor = comp.borderColor;
      } else {
        el.style.borderColor = '#ffffff #808080 #808080 #ffffff';
      }
    } else if (borderStyle === 'none') {
      el.style.border = 'none';
    } else {
      el.style.border = `${borderWidth}px solid ${borderColor}`;
    }

    if (comp.backStyle === 'solid') {
      el.style.backgroundColor = faceColor;
    } else {
      el.style.backgroundColor = 'transparent';
    }

    if (comp.useHighlightColor && comp.highlightColor) {
      el.style.boxShadow = `inset 0 0 0 2px ${comp.highlightColor}`;
    } else {
      el.style.boxShadow = '';
    }

    el.classList.toggle('ft-blink', Boolean(comp.blink));
    el.style.borderRadius = comp.shape === 'roundedRectangle' ? '4px' : '0';
    el.style.cursor = comp.studioEdit ? 'default' : 'pointer';
    el.style.padding = '0 4px';
    el.style.overflow = 'hidden';
    el.style.margin = '0';
    el.style.outline = 'none';
    el.style.boxSizing = 'border-box';
  },

  applyCaptionStyle(el, comp) {
    el.style.fontFamily = comp.fontFamily || 'Arial Unicode MS';
    el.style.fontSize = `${comp.fontSize ?? 10}px`;
    el.style.fontWeight = comp.bold ? '700' : '400';
    el.style.fontStyle = comp.italic ? 'italic' : 'normal';
    el.style.textDecoration = comp.underline ? 'underline' : 'none';
    if (comp.useForeColor !== false) el.style.color = comp.foreColor || '#000000';
    const textAlignMap = {
      topLeft: 'left', topCenter: 'center', topRight: 'right',
      middleLeft: 'left', middleCenter: 'center', middleRight: 'right',
      bottomLeft: 'left', bottomCenter: 'center', bottomRight: 'right'
    };
    el.style.textAlign = textAlignMap[comp.alignment] || 'center';
    if (comp.wordWrap !== false) {
      el.style.whiteSpace = 'pre-wrap';
      el.style.overflowWrap = 'break-word';
      el.style.lineHeight = '1.2';
    } else {
      el.style.whiteSpace = 'nowrap';
    }
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

  MultistateIndicator(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-multistate ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);

    if (comp.shape === 'circle') {
      el.classList.add('ft-multistate-circle', 'ft-status-led');
      el.style.borderRadius = '50%';
      el.style.border = 'none';
    }

    const caption = document.createElement('span');
    caption.className = 'ft-multistate-caption';
    el.appendChild(caption);

    const applyLedClass = (stateDef) => {
      if (comp.shape !== 'circle' || !stateDef) return;
      el.classList.remove('ft-status-led--green', 'ft-status-led--red', 'ft-status-led--error');
      const fill = (stateDef.backColor || stateDef.color || '').toLowerCase();
      if (stateDef.id === 'Error' || fill === 'navy') {
        el.classList.add('ft-status-led--error');
      } else if (fill === '#10eb10' || stateDef.value === 1) {
        el.classList.add('ft-status-led--green');
      } else {
        el.classList.add('ft-status-led--red');
      }
    };

    const applyState = (stateDef) => {
      if (!stateDef) return;
      const label = stateDef.caption || stateDef.text || '';
      caption.textContent = label;
      caption.style.display = label ? '' : 'none';
      const fill = stateDef.backColor || stateDef.color || '#888';
      applyLedClass(stateDef);
      if (comp.shape !== 'circle') {
        el.style.backgroundColor = fill;
        const borderColor = stateDef.borderColor || stateDef.backColor || '#666';
        el.style.border = `2px solid ${borderColor}`;
      }
      caption.style.color = stateDef.captionColor || stateDef.textColor || '#fff';
    };

    const boxH = comp.height || 33;
    caption.style.fontSize = `${Math.min(12, Math.max(8, Math.round(boxH * 0.38)))}px`;

    const states = comp.states || [];
    const studioEdit = Boolean(ctx.studioEdit);
    if (comp.tag && !studioEdit) {
      ctx.bindTag(comp.tag, (val) => {
        applyState(ComponentRegistry.resolveMultistateState(states, val));
      });
      const current = ctx.getTagValue(comp.tag);
      if (current !== undefined) {
        applyState(ComponentRegistry.resolveMultistateState(states, current));
      }
    } else {
      const previewValue = studioEdit ? 1 : (comp.defaultValue ?? 0);
      applyState(ComponentRegistry.resolveMultistateState(states, previewValue));
    }

    return el;
  },

  resolveMultistateState(states, value) {
    const errorState = states.find((s) => s.id === 'Error' || s.stateId === 'Error');
    if (value === null || value === undefined) return errorState || states[0];

    let num = value;
    if (value === true) num = 1;
    if (value === false) num = 0;
    if (typeof num === 'string' && num.trim() !== '' && !Number.isNaN(Number(num))) {
      num = Number(num);
    }

    const match = states.find((s) => s.value !== undefined && s.value === num);
    return match || errorState || states.find((s) => s.value === 0) || states[0];
  },

  defaultModeIndicator() {
    return {
      type: 'MultistateIndicator',
      tag: 'System.AutoMode',
      width: 71,
      height: 33,
      states: [
        { id: 'Error', caption: 'Error', backColor: 'navy', borderColor: 'navy', captionColor: '#fff' },
        { id: '0', value: 0, caption: 'Manual', backColor: 'blue', borderColor: '#ff8000', captionColor: '#fff' },
        { id: '1', value: 1, caption: 'Auto', backColor: '#00c000', borderColor: '#40ff10', captionColor: '#fff' }
      ]
    };
  },

  defaultHealthIndicator() {
    return {
      type: 'MultistateIndicator',
      tag: 'System.Healthy',
      width: 71,
      height: 33,
      states: [
        { id: 'Error', caption: 'Error', backColor: '#001C38', borderColor: '#001C38', captionColor: '#fff' },
        { id: '0', value: 0, caption: 'Fault', backColor: 'red', borderColor: '#ff8000', captionColor: '#fff' },
        { id: '1', value: 1, caption: 'Healthy', backColor: '#00c000', borderColor: '#40ff10', captionColor: '#fff' }
      ]
    };
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

  ContentArea(comp, ctx) {
    const area = document.createElement('div');
    area.className = 'ft-content-area ft-graphic';
    if (comp.name) area.dataset.name = comp.name;
    ComponentRegistry.applyGraphicsObject(area, comp);
    area.style.overflow = 'auto';
    area.style.padding = '8px';
    area.style.boxSizing = 'border-box';
    area.style.background = 'transparent';
    area.style.zIndex = '1';
    for (const child of comp.children || []) {
      area.appendChild(ComponentRegistry.render(child, ctx));
    }
    return area;
  },

  Grid(comp, ctx) {
    const grid = document.createElement('div');
    grid.className = comp.style?.className || 'grid';
    for (const child of comp.children || []) {
      grid.appendChild(ComponentRegistry.render(child, ctx));
    }
    return grid;
  },

  ChecklistTable(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-checklist-table ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);

    const body = document.createElement('div');
    body.className = 'ft-checklist-table__body';

    const headerRow = document.createElement('div');
    headerRow.className = 'ft-checklist-table__row ft-checklist-table__row--header';
    ['Device', 'Req.', 'Act.'].forEach((label, index) => {
      const cell = document.createElement('div');
      cell.className = 'ft-checklist-table__cell'
        + (index > 0 ? ' ft-checklist-table__cell--center' : '');
      cell.textContent = label;
      headerRow.appendChild(cell);
    });
    body.appendChild(headerRow);

    for (const row of comp.rows || []) {
      const rowEl = document.createElement('div');
      rowEl.className = 'ft-checklist-table__row';

      const labelCell = document.createElement('div');
      labelCell.className = 'ft-checklist-table__cell';
      labelCell.textContent = row.label || '';
      rowEl.appendChild(labelCell);

      const reqCell = document.createElement('div');
      reqCell.className = 'ft-checklist-table__cell ft-checklist-table__cell--center';
      const reqLed = document.createElement('span');
      reqLed.className = 'ft-checklist-table__led ft-checklist-table__led--green';
      reqCell.appendChild(reqLed);
      rowEl.appendChild(reqCell);

      const actCell = document.createElement('div');
      actCell.className = 'ft-checklist-table__cell ft-checklist-table__cell--center';
      const actLed = document.createElement('span');
      actLed.className = 'ft-checklist-table__led ft-checklist-table__led--red';
      actCell.appendChild(actLed);

      const applyActState = (val) => {
        const on = val === true || val === 1 || val === '1';
        actLed.classList.toggle('ft-checklist-table__led--green', on);
        actLed.classList.toggle('ft-checklist-table__led--red', !on);
      };

      if (row.actTag) {
        ctx.bindTag(row.actTag, applyActState);
        const current = ctx.getTagValue(row.actTag);
        if (current !== undefined) applyActState(current);
      }

      rowEl.appendChild(actCell);
      body.appendChild(rowEl);
    }

    el.appendChild(body);

    for (const dividerClass of ['ft-checklist-table__divider--req', 'ft-checklist-table__divider--act']) {
      const divider = document.createElement('div');
      divider.className = 'ft-checklist-table__divider ' + dividerClass;
      divider.setAttribute('aria-hidden', 'true');
      el.appendChild(divider);
    }

    return el;
  },

  Rectangle(comp) {
    const el = document.createElement('div');
    el.className = 'ft-rectangle ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);
    const borderW = comp.lineWidth ?? comp.borderWidth ?? 1;
    const borderColor = comp.foreColor || comp.borderColor || '#c6c6c6';
    if (comp.backStyle === 'gradient') {
      const start = comp.backColor || '#c6c6c6';
      const end = comp.endColor || '#e8e8e8';
      const stop = comp.gradientStop ?? 95;
      const shading = comp.gradientShadingStyle || comp.gradientDirection || '';
      if (shading === 'gradientHorizontalFromRight') {
        el.style.background = `linear-gradient(to left, ${start} 0%, ${end} ${stop}%)`;
      } else if (shading === 'gradientHorizontalFromLeft') {
        el.style.background = `linear-gradient(to right, ${start} 0%, ${end} ${stop}%)`;
      } else {
        el.style.background = `linear-gradient(to bottom, ${start} 0%, ${end} ${stop}%)`;
      }
    } else if (comp.backStyle === 'transparent') {
      el.style.backgroundColor = 'transparent';
    } else {
      el.style.backgroundColor = comp.backColor || '#ffffff';
    }
    if (comp.borderMode === 'tableRow') {
      el.style.border = 'none';
      el.style.borderBottom = `${borderW}px solid ${borderColor}`;
    } else if (comp.borderMode === 'tableHeader') {
      el.style.border = `${borderW}px solid ${borderColor}`;
      el.style.borderBottom = `${borderW}px solid ${borderColor}`;
    } else if (comp.borderMode === 'tableFrame') {
      el.style.backgroundColor = 'transparent';
      el.style.border = `${borderW}px solid ${borderColor}`;
    } else if (borderW <= 0) {
      el.style.border = 'none';
    } else {
      el.style.border = `${borderW}px solid ${borderColor}`;
    }
    el.style.boxSizing = 'border-box';
    return el;
  },

  Ellipse(comp) {
    const el = document.createElement('div');
    el.className = 'ft-ellipse ft-status-led ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);
    const fill = (comp.backColor || '#10EB10').toLowerCase();
    if (fill === '#f83d3d') el.classList.add('ft-status-led--red');
    else el.classList.add('ft-status-led--green');
    return el;
  },

  SafetyLadderDiagram(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-safety-ladder ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);

    const applyIndicator = (indicator, val, fallback = 0) => {
      const on = val === true || val === 1 || val === '1';
      const useOn = val === undefined ? Boolean(fallback) : on;
      indicator.classList.toggle('ft-safety-ladder__indicator--green', useOn);
      indicator.classList.toggle('ft-safety-ladder__indicator--red', !useOn);
    };

    const bindIndicator = (indicator, contact) => {
      if (contact.tag) {
        ctx.bindTag(contact.tag, (val) => applyIndicator(indicator, val, contact.defaultValue));
        applyIndicator(indicator, ctx.getTagValue(contact.tag), contact.defaultValue);
      } else {
        applyIndicator(indicator, contact.defaultValue, contact.defaultValue);
      }
    };

    const createContact = (contact) => {
      const cell = document.createElement('div');
      cell.className = 'ft-safety-ladder__cell';

      const label = document.createElement('div');
      label.className = 'ft-safety-ladder__label';
      label.textContent = (contact.label || '').replace(/\\n/g, '\n');

      const symbol = document.createElement('div');
      symbol.className = 'ft-safety-ladder__symbol';
      const barL = document.createElement('span');
      barL.className = 'ft-safety-ladder__bar';
      const indicator = document.createElement('span');
      indicator.className = 'ft-safety-ladder__indicator';
      const barR = document.createElement('span');
      barR.className = 'ft-safety-ladder__bar';
      bindIndicator(indicator, contact);
      symbol.append(barL, indicator, barR);

      cell.append(label, symbol);
      return cell;
    };

    const createCoil = (coil) => {
      const cell = document.createElement('div');
      cell.className = 'ft-safety-ladder__cell ft-safety-ladder__cell--coil';

      const label = document.createElement('div');
      label.className = 'ft-safety-ladder__label';
      label.textContent = (coil.label || '').replace(/\\n/g, '\n');

      const symbol = document.createElement('div');
      symbol.className = 'ft-safety-ladder__coil';
      const parenL = document.createElement('span');
      parenL.className = 'ft-safety-ladder__coil-paren';
      parenL.textContent = '(';
      const indicator = document.createElement('span');
      indicator.className = 'ft-safety-ladder__indicator';
      const parenR = document.createElement('span');
      parenR.className = 'ft-safety-ladder__coil-paren';
      parenR.textContent = ')';
      bindIndicator(indicator, coil);
      symbol.append(parenL, indicator, parenR);

      cell.append(label, symbol);
      return cell;
    };

    const body = document.createElement('div');
    body.className = 'ft-safety-ladder__body';

    const rail = document.createElement('div');
    rail.className = 'ft-safety-ladder__rail';
    rail.setAttribute('aria-hidden', 'true');
    body.appendChild(rail);

    const rungs = document.createElement('div');
    rungs.className = 'ft-safety-ladder__rungs';

    const rowCount = (comp.rows || []).length;
    (comp.rows || []).forEach((row, rowIndex) => {
      const rung = document.createElement('div');
      rung.className = 'ft-safety-ladder__rung';
      const isFirst = rowIndex === 0;
      const isLast = rowIndex === rowCount - 1;
      if (isFirst) rung.classList.add('ft-safety-ladder__rung--first');
      if (isLast) rung.classList.add('ft-safety-ladder__rung--last');
      if (!isLast) rung.classList.add('ft-safety-ladder__rung--bus-end');

      const rungLine = document.createElement('div');
      rungLine.className = 'ft-safety-ladder__rung-line';
      rungLine.setAttribute('aria-hidden', 'true');
      rung.appendChild(rungLine);

      const slotCount = comp.columns ?? 6;
      for (let col = 0; col < slotCount; col++) {
        const contact = row[col];
        if (contact) {
          rung.appendChild(createContact(contact));
        } else {
          const wire = document.createElement('div');
          wire.className = 'ft-safety-ladder__cell ft-safety-ladder__cell--wire';
          rung.appendChild(wire);
        }
      }

      if (isLast && comp.coil) {
        rung.appendChild(createCoil(comp.coil));
      } else {
        const tail = document.createElement('div');
        tail.className = 'ft-safety-ladder__cell ft-safety-ladder__cell--wire';
        rung.appendChild(tail);
      }

      rungs.appendChild(rung);

      if (!isLast) {
        const bus = document.createElement('div');
        bus.className = 'ft-safety-ladder__serpentine-bus';
        bus.setAttribute('aria-hidden', 'true');
        bus.innerHTML = [
          '<span class="ft-safety-ladder__serpentine-drop"></span>',
          '<span class="ft-safety-ladder__serpentine-line"></span>',
          '<span class="ft-safety-ladder__serpentine-rise"></span>'
        ].join('');
        rungs.appendChild(bus);
      }
    });

    body.appendChild(rungs);
    el.appendChild(body);
    return el;
  },

  GotoButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'raised',
      borderWidth: comp.borderWidth ?? 3,
      borderUsesBackColor: comp.borderUsesBackColor ?? !comp.useBorderColor,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#dcdcdc',
      studioEdit
    });
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    btn.style.justifyContent = comp.alignment === 'middleCenter' ? 'center' : 'flex-end';
    btn.style.alignItems = 'center';
    btn.style.padding = '3px 2px 2px';
    btn.style.gap = '1px';
    if (comp.image) {
      const img = document.createElement('img');
      img.className = 'ft-goto-btn-icon';
      img.src = ComponentRegistry.imageUrl(comp.image, ctx);
      img.alt = '';
      img.draggable = false;
      btn.appendChild(img);
    }
    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    cap.textContent = comp.label || comp.caption || '';
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? true,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.foreColor || '#000000',
      useForeColor: comp.useForeColor !== false,
      wordWrap: comp.wordWrap === true,
      alignment: comp.alignment || 'middleCenter'
    });
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';
    btn.appendChild(cap);

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'GotoButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'GotoButton',
          source: comp._source || ''
        }, '*');
      });
    } else if (comp.target) {
      btn.addEventListener('click', () => ctx.navigate(comp.target));
    }
    return btn;
  },

  TimeDateDisplay(comp) {
    const el = document.createElement('div');
    el.className = 'ft-time-date ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);
    el.style.fontFamily = comp.fontFamily || 'Arial';
    el.style.fontSize = `${comp.fontSize || 12}px`;
    el.style.fontWeight = comp.bold ? '700' : '400';
    el.style.color = comp.foreColor || '#000';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.overflow = 'hidden';
    const tick = () => { el.textContent = new Date().toLocaleString(); };
    tick();
    setInterval(tick, 1000);
    return el;
  },

  StringDisplay(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-string-display ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);
    el.style.fontFamily = comp.fontFamily || 'Arial';
    el.style.fontSize = `${comp.fontSize || 12}px`;
    el.style.fontWeight = comp.bold ? '700' : '400';
    el.style.color = comp.foreColor || '#fff';
    el.style.backgroundColor = comp.backStyle === 'solid' ? (comp.backColor || '#808080') : 'transparent';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.overflow = 'hidden';
    el.style.padding = '0 4px';
    const render = (val) => {
      el.textContent = val != null && val !== '' ? String(val) : (comp.caption || 'Guest');
    };
    if (comp.tag) ctx.bindTag(comp.tag, render);
    else render(comp.caption);
    if (comp.useCurrentUser) {
      ctx.onUserChange((user) => render(user?.username || comp.caption || 'Guest'));
    }
    return el;
  },

  formatFtShortDateTime(date = new Date()) {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).replace(',', '');
  },

  AlarmTicker(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-alarm-ticker ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.gap = '6px';
    el.style.overflow = 'hidden';
    el.style.backgroundColor = comp.backStyle === 'solid' ? (comp.backColor || '#ffffff') : '#ffffff';
    el.style.fontFamily = comp.fontFamily || 'Arial';
    el.style.fontSize = `${comp.fontSize || 10}px`;
    el.style.fontWeight = comp.bold !== false ? '700' : '400';
    el.style.color = comp.foreColor || '#cc0000';
    el.style.padding = '0 2px';
    const timeEl = document.createElement('span');
    timeEl.className = 'ft-alarm-ticker-time';
    const textEl = document.createElement('span');
    textEl.className = 'ft-alarm-ticker-text';
    el.appendChild(timeEl);
    el.appendChild(textEl);
    const fallback = (comp.caption != null && comp.caption !== '')
      ? comp.caption
      : 'ABCDE FGHIJK LMNOPQ RSTUV WXYZ ABCDE FGHIJK LMNOPQ RSTUV WXYZ';
    const tickTime = () => {
      timeEl.textContent = ComponentRegistry.formatFtShortDateTime();
    };
    tickTime();
    const timerId = setInterval(tickTime, 1000);
    el.dataset.tickerTimer = String(timerId);
    const render = (alarms) => {
      const active = alarms?.active?.filter((a) => !a.acknowledged) || [];
      textEl.textContent = active.length
        ? active.map((a) => a.message).join('   ')
        : fallback;
    };
    render({ active: [] });
    ctx.onAlarmUpdate(render);
    return el;
  },

  Image(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-image ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);

    if (comp.backStyle === 'solid' && comp.useBackColor) {
      el.style.backgroundColor = comp.backColor || '#c0c0c0';
    } else {
      el.style.backgroundColor = 'transparent';
    }

    if (comp.image) {
      const img = document.createElement('img');
      img.className = 'ft-image-picture';
      img.src = ComponentRegistry.imageUrl(comp.image, ctx);
      img.alt = comp.name || comp.image;
      img.draggable = false;
      if (comp.useImageColor) {
        img.style.opacity = '0.85';
      }
      el.appendChild(img);
    } else {
      el.classList.add('ft-image-placeholder');
    }

    return el;
  },

  Text(comp) {
    const el = document.createElement('div');
    el.className = 'ft-text';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);

    const caption = comp.caption ?? comp.label ?? '';
    el.textContent = caption;

    const fontFamily = comp.fontFamily || 'Arial Unicode MS';
    const fontSize = comp.fontSize ?? 10;
    el.style.fontFamily = fontFamily;
    el.style.fontSize = `${fontSize}px`;
    el.style.fontWeight = comp.bold ? '700' : '400';
    el.style.fontStyle = comp.italic ? 'italic' : 'normal';
    el.style.textDecoration = comp.underline ? 'underline' : 'none';

    if (comp.useForeColor !== false) {
      el.style.color = comp.foreColor || '#000000';
    }
    if (comp.useBackColor && comp.backStyle === 'solid') {
      el.style.backgroundColor = comp.backColor || '#ffffff';
    } else {
      el.style.backgroundColor = 'transparent';
    }

    if (comp.wordWrap !== false) {
      el.style.whiteSpace = 'pre-wrap';
      el.style.overflowWrap = 'break-word';
    } else {
      el.style.whiteSpace = 'nowrap';
      el.style.overflow = 'hidden';
    }

    const align = ComponentRegistry.textAlignment(comp.alignment || 'middleCenter');
    el.style.display = 'flex';
    el.style.justifyContent = align.justify;
    el.style.alignItems = align.align;

    return el;
  },

  resolveWriteTagName(ref) {
    const s = String(ref || '').trim();
    if (!s) return null;
    if (typeof ExpressionEval !== 'undefined' && ExpressionEval.isExpression(s)) return null;
    return s;
  },

  readIndicatorRef(ref, ctx) {
    const s = String(ref || '').trim();
    if (!s) return undefined;
    if (typeof ExpressionEval !== 'undefined' && ExpressionEval.isExpression(s)) {
      const refs = ExpressionEval.extractTagRefs(s);
      const snap = {};
      refs.forEach((name) => { snap[name] = ctx.getTagValue(name); });
      try {
        return ExpressionEval.evaluate(s, snap);
      } catch {
        return undefined;
      }
    }
    return ctx.getTagValue(s);
  },

  bindIndicatorRef(ref, callback, ctx) {
    const s = String(ref || '').trim();
    if (!s) return;
    if (typeof ExpressionEval !== 'undefined' && ExpressionEval.isExpression(s)) {
      ExpressionEval.bindExpression(s, callback, ctx);
    } else {
      ctx.bindTag(s, callback);
    }
  },

  applyGraphicsObject(el, comp) {
    if (comp.left != null) el.style.left = `${comp.left}px`;
    if (comp.top != null) el.style.top = `${comp.top}px`;
    if (comp.width != null) el.style.width = `${comp.width}px`;
    if (comp.height != null) el.style.height = `${comp.height}px`;
    if (comp.left != null || comp.top != null || comp.width != null || comp.height != null) {
      el.classList.add('ft-graphic');
    }
  },

  textAlignment(id) {
    const map = {
      topLeft: { justify: 'flex-start', align: 'flex-start' },
      topCenter: { justify: 'center', align: 'flex-start' },
      topRight: { justify: 'flex-end', align: 'flex-start' },
      middleLeft: { justify: 'flex-start', align: 'center' },
      middleCenter: { justify: 'center', align: 'center' },
      middleRight: { justify: 'flex-end', align: 'center' },
      bottomLeft: { justify: 'flex-start', align: 'flex-end' },
      bottomCenter: { justify: 'center', align: 'flex-end' },
      bottomRight: { justify: 'flex-end', align: 'flex-end' }
    };
    return map[id] || map.middleCenter;
  },

  defaultTextComponent(overrides = {}) {
    return {
      type: 'Text',
      name: 'Text1',
      caption: '',
      left: 215,
      top: 179,
      width: 352,
      height: 213,
      visible: true,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      foreColor: '#000000',
      useForeColor: true,
      backColor: '#ffffff',
      useBackColor: false,
      backStyle: 'transparent',
      wordWrap: true,
      sizeToFit: true,
      alignment: 'middleCenter',
      ...overrides
    };
  },

  DisplayShell(comp, ctx) {
    const shell = document.createElement('div');
    shell.className = 'ft-display-shell';

    const header = document.createElement('header');
    header.className = 'ft-shell-header';
    const logo = document.createElement('img');
    logo.className = 'ft-shell-logo';
    logo.alt = 'Logo';
    logo.src = ComponentRegistry.imageUrl(comp.logo || 'Cybernetik-Logo_1-removebg-preview.bmp', ctx);
    header.appendChild(logo);

    const title = document.createElement('div');
    title.className = 'ft-shell-title';
    title.textContent = comp.title || ctx.projectSubtitle || 'Processing System';
    header.appendChild(title);

    const headerRight = document.createElement('div');
    headerRight.className = 'ft-shell-header-right';
    const clock = document.createElement('div');
    clock.className = 'ft-shell-clock';
    const tickClock = () => { clock.textContent = new Date().toLocaleString(); };
    tickClock();
    setInterval(tickClock, 1000);
    headerRight.appendChild(clock);

    const indicators = comp.headerIndicators || [
      ComponentRegistry.defaultModeIndicator(),
      ComponentRegistry.defaultHealthIndicator()
    ];
    for (const ind of indicators) {
      headerRight.appendChild(ComponentRegistry.render(ind, ctx));
    }
    header.appendChild(headerRight);
    shell.appendChild(header);

    const body = document.createElement('div');
    body.className = 'ft-shell-body';

    if (comp.showSubNav && comp.navKey) {
      body.appendChild(ComponentRegistry.SubNav({ navKey: comp.navKey }, ctx));
    }

    const content = document.createElement('main');
    content.className = 'ft-shell-content';
    for (const child of comp.children || []) {
      content.appendChild(ComponentRegistry.render(child, ctx));
    }
    body.appendChild(content);
    shell.appendChild(body);

    const footer = document.createElement('nav');
    footer.className = 'ft-shell-footer';
    const mainNav = ctx.navigation?.mainNav || [];
    for (const item of mainNav) {
      if (item.screen === '700_User_Management') continue;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ft-shell-nav-btn';
      const imgFile = item.image || NAV_IMAGES[item.icon] || '';
      if (imgFile) {
        const img = document.createElement('img');
        img.src = ComponentRegistry.imageUrl(imgFile, ctx);
        img.alt = '';
        btn.appendChild(img);
      }
      const cap = document.createElement('span');
      cap.textContent = item.label;
      btn.appendChild(cap);
      btn.addEventListener('click', () => ctx.navigate(item.screen));
      footer.appendChild(btn);
    }

    const userBox = document.createElement('div');
    userBox.className = 'ft-shell-user';
    userBox.textContent = 'Guest';
    ctx.onUserChange((user) => {
      userBox.textContent = user?.username || 'Guest';
    });
    footer.appendChild(userBox);

    const loginBtn = document.createElement('button');
    loginBtn.type = 'button';
    loginBtn.className = 'ft-shell-nav-btn login';
    const loginImg = document.createElement('img');
    loginImg.src = ComponentRegistry.imageUrl(NAV_IMAGES.user, ctx);
    loginImg.alt = '';
    loginBtn.appendChild(loginImg);
    const loginCap = document.createElement('span');
    loginCap.textContent = 'User Login';
    loginBtn.appendChild(loginCap);
    loginBtn.addEventListener('click', () => ctx.navigate('700_User_Management'));
    footer.appendChild(loginBtn);
    shell.appendChild(footer);

    const ticker = document.createElement('div');
    ticker.className = 'ft-shell-ticker';
    const tickerTime = document.createElement('span');
    tickerTime.className = 'ft-shell-ticker-time';
    ticker.appendChild(tickerTime);
    const tickerText = document.createElement('span');
    tickerText.className = 'ft-shell-ticker-text';
    tickerText.textContent = '';
    ticker.appendChild(tickerText);
    const tickTicker = () => { tickerTime.textContent = new Date().toLocaleString(); };
    ctx.onAlarmUpdate((alarms) => {
      const active = alarms.active?.filter((a) => !a.acknowledged) || [];
      if (active.length) {
        tickTicker();
        tickerText.textContent = active.map((a) => a.message).join('   ');
        ticker.style.display = 'flex';
        ticker.classList.add('alarm');
      } else {
        ticker.style.display = 'none';
        tickerText.textContent = '';
        tickerTime.textContent = '';
        ticker.classList.remove('alarm');
      }
    });
    shell.appendChild(ticker);

    return shell;
  },

  imageUrl(fileName, ctx) {
    const pid = ctx.projectId || '';
    if (!pid || !fileName) return '';
    return `/projects/${encodeURIComponent(pid)}/Images/${encodeURIComponent(fileName)}`;
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
    let type = comp.type;
    if (type === 'ChecklistGrid') type = 'ChecklistTable';
    const renderer = ComponentRegistry[type];
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
