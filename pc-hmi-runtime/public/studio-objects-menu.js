/** FactoryTalk-style Objects menu definition for Plant HMI Studio */
window.OBJECTS_MENU = [
  { id: 'select', label: 'Select', tool: true },
  { id: 'rotate', label: 'Rotate', tool: true, disabled: true },
  { sep: true },
  {
    id: 'drawing', label: 'Drawing', children: [
      { id: 'draw-text', label: 'Text', action: 'text-properties' },
      { id: 'draw-image', label: 'Image', action: 'image-properties' },
      { id: 'draw-panel', label: 'Panel', action: 'panel-properties' },
      { sep: true },
      { id: 'draw-arc', label: 'Arc', action: 'arc-properties' },
      { id: 'draw-ellipse', label: 'Ellipse', action: 'ellipse-properties' },
      { id: 'draw-freehand', label: 'Freehand', action: 'freehand-properties' },
      { id: 'draw-line', label: 'Line', action: 'line-properties' },
      { id: 'draw-polygon', label: 'Polygon', action: 'polygon-properties' },
      { id: 'draw-polyline', label: 'Polyline', action: 'polyline-properties' },
      { id: 'draw-rectangle', label: 'Rectangle', action: 'rectangle-properties' },
      { id: 'draw-rounded-rect', label: 'Rounded Rectangle', action: 'rounded-rectangle-properties' },
      { id: 'draw-wedge', label: 'Wedge', action: 'wedge-properties' },
      { id: 'draw-scale', label: 'Scale', action: 'scale-properties' }
    ]
  },
  {
    id: 'push-button', label: 'Push Button', children: [
      { id: 'btn-momentary', label: 'Momentary', action: 'momentary-button-properties' },
      { id: 'btn-maintained', label: 'Maintained', action: 'maintained-button-properties' },
      { id: 'btn-latched', label: 'Latched', action: 'latched-button-properties' },
      { id: 'btn-multistate', label: 'Multistate', action: 'multistate-button-properties' },
      { id: 'btn-interlocked', label: 'Interlocked', action: 'interlocked-button-properties' },
      { id: 'btn-ramp', label: 'Ramp', action: 'ramp-button-properties' }
    ]
  },
  {
    id: 'numeric-string', label: 'Numeric and String', children: [
      { id: 'num-display', label: 'Numeric Display', action: 'numeric-display-properties' },
      { id: 'num-input-enable', label: 'Numeric Input Enable', action: 'numeric-input-properties' },
      { id: 'num-input-cursor', label: 'Numeric Input Cursor Point', action: 'numeric-input-cursor-properties' },
      { sep: true },
      { id: 'str-display', label: 'String Display', action: 'string-display-properties' },
      { id: 'str-input-enable', label: 'String Input Enable', action: 'string-input-properties' }
    ]
  },
  {
    id: 'display-nav', label: 'Display Navigation', children: [
      { id: 'nav-goto', label: 'Goto', action: 'goto-button-properties' },
      { id: 'nav-return', label: 'Return To', action: 'return-to-button-properties' },
      { id: 'nav-close', label: 'Close', action: 'close-display-button-properties' },
      { id: 'nav-list', label: 'Display List Selector', action: 'display-list-selector-properties' }
    ]
  },
  {
    id: 'indicator', label: 'Indicator', children: [
      { id: 'ind-multistate', label: 'Multistate', action: 'multistate-indicator-properties' },
      { id: 'ind-symbol', label: 'Symbol', action: 'symbol-indicator-properties' },
      { id: 'ind-list', label: 'List', action: 'list-indicator-properties' }
    ]
  },
  {
    id: 'gauge-graph', label: 'Gauge and Graph', children: [
      { id: 'gauge-analog', label: 'Analog Gauge', action: 'gauge-properties' },
      { id: 'gauge-bar', label: 'Bar Graph', action: 'bar-graph-properties' },
      { id: 'gauge-histogram', label: 'Histogram', planned: true }
    ]
  },
  {
    id: 'trending', label: 'Trending', children: [
      { id: 'trend-pause', label: 'Pause', action: 'pause-pen-button-properties' },
      { id: 'trend-next-pen', label: 'Next Pen', action: 'next-pen-button-properties' },
      { sep: true },
      { id: 'trend', label: 'Trend', action: 'trend-properties' }
    ]
  },
  {
    id: 'recipe-plus', label: 'RecipePlus', children: [
      { id: 'recipe-btn', label: 'RecipePlus Button', action: 'recipeplus-button-properties' },
      { id: 'recipe-selector', label: 'RecipePlus Selector', action: 'recipeplus-selector-properties' },
      { id: 'recipe-table', label: 'RecipePlus Table', action: 'recipeplus-table-properties' }
    ]
  },
  {
    id: 'key', label: 'Key', children: [
      { id: 'key-backspace', label: 'Backspace', action: 'backspace-button-properties' },
      { id: 'key-end', label: 'End', action: 'end-button-properties' },
      { id: 'key-enter', label: 'Enter', planned: true },
      { id: 'key-home', label: 'Home', planned: true },
      { id: 'key-left', label: 'Move Left', planned: true },
      { id: 'key-right', label: 'Move Right', planned: true },
      { id: 'key-down', label: 'Move Down', planned: true },
      { id: 'key-up', label: 'Move Up', planned: true },
      { id: 'key-pagedown', label: 'Page Down', planned: true },
      { id: 'key-pageup', label: 'Page Up', planned: true }
    ]
  },
  {
    id: 'user-mgmt', label: 'User Management', children: [
      { id: 'user-add', label: 'Add User/Group', planned: true },
      { id: 'user-delete', label: 'Delete User/Group', planned: true },
      { id: 'user-modify-group', label: 'Modify Group Membership', planned: true },
      { id: 'user-unlock', label: 'Unlock User', planned: true },
      { id: 'user-enable', label: 'Enable User', planned: true },
      { id: 'user-disable', label: 'Disable User', planned: true },
      { id: 'user-login', label: 'Login', component: { type: 'LoginPanel' } },
      { id: 'user-logout', label: 'Logout', planned: true },
      { id: 'user-password', label: 'Password', planned: true },
      { id: 'user-change-props', label: 'Change User Properties', planned: true }
    ]
  },
  {
    id: 'advanced', label: 'Advanced', children: [
      { id: 'adv-control-list', label: 'Control List Selector', planned: true },
      { id: 'adv-piloted-list', label: 'Piloted Control List Selector', planned: true },
      { id: 'adv-print', label: 'Display Print', planned: true },
      { id: 'adv-language', label: 'Language Switch Button', planned: true },
      { id: 'adv-local-msg', label: 'Local Message Display', component: { type: 'AlarmList' } },
      { id: 'adv-macro', label: 'Macro', planned: true },
      { id: 'adv-shutdown', label: 'Shutdown', planned: true },
      { id: 'adv-config-mode', label: 'Goto Configure Mode', planned: true },
      { id: 'adv-time-date', label: 'Time and Date', action: 'time-date-properties' },
      {
        id: 'adv-alarm', label: 'Alarm', children: [
          { id: 'alarm-ack', label: 'Acknowledge', planned: true },
          { id: 'alarm-ack-all', label: 'Acknowledge All', component: { type: 'ActionButton', label: 'Acknowledge All', action: 'ackAllAlarms' } },
          { id: 'alarm-status-mode', label: 'Alarm Status Mode', planned: true },
          { id: 'alarm-clear-banner', label: 'Clear Alarm Banner', planned: true },
          { id: 'alarm-clear-history', label: 'Clear Alarm History', planned: true },
          { id: 'alarm-print-history', label: 'Print Alarm History', planned: true },
          { id: 'alarm-print-status', label: 'Print Alarm Status', planned: true },
          { id: 'alarm-reset-status', label: 'Reset Alarm Status', planned: true },
          { id: 'alarm-silence', label: 'Silence', planned: true },
          { id: 'alarm-sort', label: 'Sort Alarms', planned: true },
          { sep: true },
          { id: 'alarm-list', label: 'Alarm List', component: { type: 'AlarmList' } },
          { id: 'alarm-banner', label: 'Alarm Banner', planned: true },
          { id: 'alarm-status-list', label: 'Alarm Status List', planned: true }
        ]
      },
      {
        id: 'adv-diagnostics', label: 'Diagnostics', children: [
          { id: 'diag-clear', label: 'Clear', planned: true },
          { id: 'diag-clear-all', label: 'Clear All', planned: true },
          { id: 'diag-list', label: 'Diagnostics List', planned: true }
        ]
      },
      {
        id: 'adv-audit', label: 'Audit', children: [
          { id: 'audit-clear', label: 'Clear Audit Trail', planned: true },
          { id: 'audit-list', label: 'Audit Trail List', planned: true },
          { id: 'audit-detail', label: 'Audit Trail Detail', planned: true }
        ]
      },
      {
        id: 'adv-information', label: 'Information', children: [
          { id: 'info-ack', label: 'Acknowledge', planned: true },
          { id: 'info-message', label: 'Message Display', planned: true }
        ]
      }
    ]
  },
  { sep: true },
  { id: 'activex', label: 'ActiveX Control...', planned: true },
  { id: 'import', label: 'Import...', planned: true },
  { sep: true },
  { id: 'symbol-factory', label: 'Symbol Factory', planned: true }
];

window.OBJECTS_MENU_LOOKUP = {};

function indexObjectsMenu(items) {
  for (const item of items) {
    if (item.id) window.OBJECTS_MENU_LOOKUP[item.id] = item;
    if (item.children) indexObjectsMenu(item.children);
  }
}
indexObjectsMenu(window.OBJECTS_MENU);

window.renderObjectsMenu = function renderObjectsMenu(container) {
  container.innerHTML = renderMenuItems(window.OBJECTS_MENU);
};

function renderMenuItems(items) {
  return items.map((item) => {
    if (item.sep) return '<div class="menu-sep"></div>';
    if (item.children) {
      return `<div class="menu-entry has-submenu${item.disabled ? ' disabled' : ''}">
        <span>${escapeMenuLabel(item.label)}</span><span class="sub-arrow">▶</span>
        <div class="menu-submenu">${renderMenuItems(item.children)}</div>
      </div>`;
    }
    const classes = ['menu-entry'];
    if (item.tool || item.component || item.planned || item.action) classes.push('checkable');
    if (item.disabled) classes.push('disabled');
    if (item.id === 'select') classes.push('checked');
    return `<button type="button" class="${classes.join(' ')}" data-object-id="${item.id}">
      <span class="check"></span><span>${escapeMenuLabel(item.label)}</span>
    </button>`;
  }).join('');
}

function escapeMenuLabel(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}
