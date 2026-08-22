const EventEmitter = require('events');
const { extractConnections, syncTagConnections } = require('../../shared/tag-connections');

class TagService extends EventEmitter {
  constructor() {
    super();
    this.tags = new Map();
    this.subscriptions = new Set();
    this.connections = [];
  }

  loadConnections(definitions) {
    this.connections = extractConnections(definitions);
  }

  syncConnections() {
    return syncTagConnections(this, this.connections);
  }

  loadDefinitions(definitions) {
    for (const def of definitions) {
      const defaultVal = def.initialValue !== undefined
        ? def.initialValue
        : this.defaultValue(def.type);
      this.tags.set(def.name, {
        name: def.name,
        type: def.type,
        description: def.description || '',
        folder: def.folder || '',
        dataSource: def.dataSource || '',
        logic: def.logic || '',
        computed: def.computed === true,
        plcAddress: def.plcAddress || def.alias || null,
        connection: def.connection || '',
        value: defaultVal,
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
        description: tag.description || '',
        folder: tag.folder || '',
        dataSource: tag.dataSource || '',
        connection: tag.connection || '',
        timestamp: tag.timestamp,
        logic: tag.logic || undefined,
        computed: tag.computed || undefined,
        plcAddress: tag.plcAddress || undefined
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

  clearSubscriptions() {
    this.subscriptions.clear();
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
