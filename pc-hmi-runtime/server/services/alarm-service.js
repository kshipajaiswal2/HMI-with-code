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

  loadDefinitions(definitions) {
    this.definitions = definitions.map((def, index) => ({
      id: `alarm-${index}`,
      tag: def.tag,
      message: def.message,
      priority: def.priority || 5
    }));
  }

  evaluate() {
    const previouslyActive = new Set(this.active.map((a) => a.id));
    const nowActive = [];

    for (const def of this.definitions) {
      const tag = this.tagService.get(def.tag);
      const isActive = tag && (tag.value === true || tag.value === 1);
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
