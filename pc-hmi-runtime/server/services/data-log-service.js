function stripBraces(ref) {
  return String(ref || '').trim().replace(/^\{|\}$/g, '').replace(/^\[PLC\]/i, '');
}

function tagCandidates(name) {
  const raw = String(name || '').trim();
  const inner = stripBraces(raw);
  const names = [raw, inner];
  if (inner && inner !== raw) names.push(`{${inner}}`);
  if (inner) {
    names.push(inner.replace(/^\[PLC\]/i, ''));
    names.push(`PLC uploaded Tags.${inner}`);
    names.push(`PLC uploded Tags.${inner}`);
  }
  return [...new Set(names.filter(Boolean))];
}

function intervalMs(interval, unit) {
  const n = Number(interval);
  const value = Number.isFinite(n) && n > 0 ? n : 10;
  switch (String(unit || 'seconds').toLowerCase()) {
    case 'hundredths': return Math.max(50, value * 10);
    case 'tenths': return Math.max(50, value * 100);
    case 'minutes': return value * 60 * 1000;
    case 'hours': return value * 3600 * 1000;
    case 'days': return value * 86400 * 1000;
    default: return Math.max(50, value * 1000);
  }
}

function normalizeModel(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const tags = Array.isArray(src.tags)
    ? src.tags.map((t) => String(t || '').trim()).filter(Boolean)
    : [];
  const maxPts = Number(src.maxDataPoints);
  return {
    description: String(src.description || ''),
    maxDataPoints: Number.isFinite(maxPts) && maxPts > 0 ? Math.round(maxPts) : 1000,
    pathMode: src.pathMode === 'custom' ? 'custom' : 'system',
    customPath: String(src.customPath || ''),
    triggerType: src.triggerType === 'onchange' ? 'onchange' : 'periodic',
    interval: Number(src.interval) > 0 ? Number(src.interval) : 10,
    intervalUnit: String(src.intervalUnit || 'seconds'),
    tags: [...new Set(tags)]
  };
}

class DataLogService {
  constructor(tagService) {
    this.tagService = tagService;
    this.models = {};
    this.buffers = {};
    this.timers = {};
    this.onChange = (evt) => this.handleChange(evt);
    this.listening = false;
  }

  load(definitions) {
    this.stop();
    const src = definitions && typeof definitions === 'object' ? definitions : {};
    const out = {};
    if (Array.isArray(src)) {
      for (const item of src) {
        const name = String(item?.name || '').trim();
        if (name && name !== 'Untitled') out[name] = normalizeModel(item);
      }
    } else {
      for (const [name, model] of Object.entries(src)) {
        if (name && name !== 'Untitled') out[name] = normalizeModel(model);
      }
    }
    this.models = out;
    for (const name of Object.keys(out)) {
      if (!this.buffers[name]) this.buffers[name] = [];
      const max = out[name].maxDataPoints;
      if (this.buffers[name].length > max) this.buffers[name] = this.buffers[name].slice(-max);
    }
    this.start();
  }

  stop() {
    for (const timer of Object.values(this.timers)) clearInterval(timer);
    this.timers = {};
    if (this.listening) {
      this.tagService.off('change', this.onChange);
      this.listening = false;
    }
  }

  start() {
    for (const [name, model] of Object.entries(this.models)) {
      if (model.triggerType === 'periodic') {
        this.timers[name] = setInterval(() => this.sample(name), intervalMs(model.interval, model.intervalUnit));
        this.sample(name);
      }
    }
    const needsChange = Object.values(this.models).some((m) => m.triggerType === 'onchange');
    if (needsChange && !this.listening) {
      this.tagService.on('change', this.onChange);
      this.listening = true;
    }
  }

  resolveTag(name) {
    for (const candidate of tagCandidates(name)) {
      const tag = this.tagService.get(candidate);
      if (tag) return tag;
    }
    return null;
  }

  sample(name) {
    const model = this.models[name];
    if (!model) return null;
    const values = {};
    for (const tagName of model.tags) {
      const tag = this.resolveTag(tagName);
      values[tagName] = tag ? tag.value : null;
    }
    const point = { t: Date.now(), values };
    const buf = this.buffers[name] || [];
    buf.push(point);
    while (buf.length > model.maxDataPoints) buf.shift();
    this.buffers[name] = buf;
    return point;
  }

  handleChange(evt) {
    const changed = String(evt?.name || '');
    if (!changed) return;
    for (const [name, model] of Object.entries(this.models)) {
      if (model.triggerType !== 'onchange') continue;
      const hit = (model.tags || []).some((tagName) => tagCandidates(tagName).includes(changed));
      if (hit) this.sample(name);
    }
  }

  list() {
    return Object.keys(this.models).sort((a, b) => a.localeCompare(b)).map((name) => ({
      name,
      ...this.models[name],
      samples: (this.buffers[name] || []).length
    }));
  }

  getSamples(name, { since, limit } = {}) {
    const key = String(name || '').trim();
    if (!this.models[key]) return null;
    let rows = this.buffers[key] || [];
    if (since) rows = rows.filter((row) => row.t >= Number(since));
    const cap = Number(limit);
    if (Number.isFinite(cap) && cap > 0) rows = rows.slice(-cap);
    return { name: key, model: this.models[key], samples: rows };
  }
}

module.exports = { DataLogService };
