const EventEmitter = require('events');

class TagService extends EventEmitter {
  constructor() {
    super();
    this.tags = new Map();
    this.subscriptions = new Set();
  }

  loadDefinitions(definitions) {
    for (const def of definitions) {
      this.tags.set(def.name, {
        name: def.name,
        type: def.type,
        description: def.description || '',
        value: this.defaultValue(def.type),
        quality: 'good',
        timestamp: Date.now()
      });
    }
  }

  defaultValue(type) {
    switch (type) {
      case 'bool': return false;
      case 'int': return 0;
      case 'float': return 0.0;
      case 'string': return '';
      default: return null;
    }
  }

  get(name) {
    return this.tags.get(name) || null;
  }

  getAll() {
    return Object.fromEntries(
      [...this.tags.entries()].map(([name, tag]) => [name, {
        value: tag.value,
        quality: tag.quality,
        type: tag.type,
        timestamp: tag.timestamp
      }])
    );
  }

  set(name, value, quality = 'good') {
    const tag = this.tags.get(name);
    if (!tag) return false;
    tag.value = value;
    tag.quality = quality;
    tag.timestamp = Date.now();
    this.emit('change', { name, value, quality, timestamp: tag.timestamp });
    return true;
  }

  subscribe(names) {
    if (Array.isArray(names)) {
      names.forEach((n) => this.subscriptions.add(n));
    }
  }

  getSubscribedSnapshot() {
    const result = {};
    for (const name of this.subscriptions) {
      const tag = this.tags.get(name);
      if (tag) {
        result[name] = { value: tag.value, quality: tag.quality, timestamp: tag.timestamp };
      }
    }
    return result;
  }
}

module.exports = { TagService };
