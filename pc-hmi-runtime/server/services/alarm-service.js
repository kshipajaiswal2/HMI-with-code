const EventEmitter = require('events');

class AlarmService extends EventEmitter {
  constructor(tagService) {
    super();
    this.tagService = tagService;
    this.definitions = [];
    this.active = [];
    this.history = [];
    this.maxHistory = 500;
  }

  loadDefinitions(definitions, options = {}) {
    const maxHistory = Number(options.maxHistory);
    if (Number.isFinite(maxHistory) && maxHistory > 0) {
      this.maxHistory = Math.round(maxHistory);
    }
    this.definitions = (definitions || []).map((def, index) => ({
      id: `alarm-${index}`,
      tag: def.tag,
      expression: def.expression || '',
      triggerType: String(def.triggerType || 'value').toLowerCase(),
      triggerValue: def.triggerValue,
      message: def.message,
      priority: def.priority || 5,
      display: def.display !== false,
      background: def.background,
      foreground: def.foreground
    }));
  }

  resolveTag(def) {
    const raw = String(def.tag || def.expression || '').trim();
    if (!raw) return null;
    const unbraced = raw.replace(/^\{|\}$/g, '');
    const names = [raw, unbraced];
    const plc = unbraced.match(/^\[PLC\](.+)$/i);
    if (plc) {
      names.push(plc[1]);
      names.push(`PLC uploded Tags.${plc[1]}`);
      names.push(`PLC uploaded Tags.${plc[1]}`);
    }
    for (const name of names) {
      const tag = this.tagService.get(name);
      if (tag) return tag;
    }
    return null;
  }

  isTriggerActive(def, tag) {
    if (!tag) return false;
    const type = def.triggerType || 'value';
    const tv = def.triggerValue;
    if (type === 'bit') {
      const bit = Number(tv);
      if (!Number.isFinite(bit) || bit < 0) return tag.value === true || tag.value === 1;
      return ((Number(tag.value) >>> 0) & (1 << bit)) !== 0;
    }
    if (type === 'lsbit') {
      const expected = tv === undefined || tv === null || tv === '' ? 1 : Number(tv);
      return (Number(tag.value) & 1) === expected;
    }
    if (tv === undefined || tv === null || tv === '') {
      return tag.value === true || tag.value === 1;
    }
    if (tag.value === true) return Number(tv) === 1;
    if (tag.value === false) return Number(tv) === 0;
    return Number(tag.value) === Number(tv);
  }

  evaluate() {
    const previouslyActive = new Set(this.active.map((a) => a.id));
    const nowActive = [];

    for (const def of this.definitions) {
      if (def.display === false) continue;
      const tag = this.resolveTag(def);
      const isActive = this.isTriggerActive(def, tag);
      if (isActive) {
        const existing = this.active.find((a) => a.id === def.id);
        if (existing) {
          nowActive.push(existing);
        } else {
          const alarm = {
            ...def,
            activatedAt: Date.now(),
            acknowledged: false,
            acknowledgedAt: null,
            acknowledgedBy: null
          };
          nowActive.push(alarm);
          this.history.unshift({ ...alarm, event: 'activated' });
        }
      } else if (previouslyActive.has(def.id)) {
        const cleared = this.active.find((a) => a.id === def.id);
        if (cleared) {
          this.history.unshift({ ...cleared, event: 'cleared', clearedAt: Date.now() });
        }
      }
    }

    if (this.history.length > this.maxHistory) {
      this.history.length = this.maxHistory;
    }

    const changed = nowActive.length !== this.active.length ||
      nowActive.some((a, i) => a.id !== this.active[i]?.id);
    this.active = nowActive;

    if (changed) {
      this.emit('change', this.getState());
    }
  }

  acknowledge(alarmId, username) {
    const alarm = this.active.find((a) => a.id === alarmId);
    if (!alarm || alarm.acknowledged) return false;
    alarm.acknowledged = true;
    alarm.acknowledgedAt = Date.now();
    alarm.acknowledgedBy = username || 'operator';
    this.history.unshift({ ...alarm, event: 'acknowledged' });
    this.emit('change', this.getState());
    return true;
  }

  acknowledgeAll(username) {
    let count = 0;
    for (const alarm of this.active) {
      if (!alarm.acknowledged) {
        this.acknowledge(alarm.id, username);
        count++;
      }
    }
    return count;
  }

  clearHistory() {
    this.history = [];
    this.emit('change', this.getState());
    return true;
  }

  getState() {
    return {
      active: this.active,
      unacknowledgedCount: this.active.filter((a) => !a.acknowledged).length,
      history: this.history.slice(0, 50)
    };
  }

  getBannerMessage() {
    const unacked = this.active.filter((a) => !a.acknowledged);
    if (!unacked.length) return null;
    const top = unacked.sort((a, b) => a.priority - b.priority)[0];
    return top.message;
  }
}

module.exports = { AlarmService };
