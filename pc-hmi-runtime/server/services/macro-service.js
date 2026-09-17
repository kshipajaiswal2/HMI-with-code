const path = require('path');

let ExpressionEval = null;
try {
  ExpressionEval = require(path.join(__dirname, '../../public/expression-eval'));
} catch {
  ExpressionEval = null;
}

function stripBraces(ref) {
  return String(ref || '').trim().replace(/^\{|\}$/g, '').replace(/^\[PLC\]/i, '');
}

function tagCandidates(name) {
  const raw = String(name || '').trim();
  const inner = stripBraces(raw);
  const names = [raw, inner];
  if (inner && inner !== raw) names.push(`{${inner}}`);
  const plc = inner.match(/^\[PLC\](.+)$/i) || inner.match(/^(.+)$/);
  if (plc) {
    names.push(plc[1]);
    names.push(`PLC uploded Tags.${plc[1] || inner}`);
    names.push(`PLC uploaded Tags.${plc[1] || inner}`);
  }
  return [...new Set(names.filter(Boolean))];
}

class MacroService {
  constructor(tagService) {
    this.tagService = tagService;
    this.macros = {};
  }

  load(definitions) {
    const src = definitions && typeof definitions === 'object' ? definitions : {};
    const out = {};
    if (Array.isArray(src)) {
      for (const item of src) {
        const name = String(item?.name || '').trim();
        if (name) out[name] = Array.isArray(item.steps) ? item.steps : [];
      }
    } else {
      for (const [name, steps] of Object.entries(src)) {
        out[name] = Array.isArray(steps) ? steps : [];
      }
    }
    this.macros = out;
  }

  list() {
    return Object.keys(this.macros).filter((n) => n !== 'Untitled').sort((a, b) => a.localeCompare(b));
  }

  resolveTag(name) {
    for (const candidate of tagCandidates(name)) {
      const tag = this.tagService.get(candidate);
      if (tag) return tag;
    }
    return null;
  }

  tagSnapshot() {
    const tags = {};
    for (const [name, tag] of this.tagService.tags) tags[name] = tag.value;
    return tags;
  }

  coerce(expr, tags) {
    const s = String(expr ?? '').trim();
    if (s === '') return '';
    if (s === 'true' || s === 'True') return true;
    if (s === 'false' || s === 'False') return false;
    if (/^-?\d+$/.test(s)) return parseInt(s, 10);
    if (/^-?\d+\.\d+$/.test(s)) return Number(s);
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }
    const asTag = this.resolveTag(s);
    if (asTag && !/[=<>!+\-*/()]/.test(s) && !s.startsWith('=')) return asTag.value;
    if (ExpressionEval) {
      try {
        if (ExpressionEval.isExpression(s) || /[=<>!+\-*/(){}]/.test(s)) {
          return ExpressionEval.evaluate(s, tags);
        }
      } catch {
        /* fall through */
      }
    }
    return s;
  }

  run(name) {
    const key = String(name || '').trim();
    const steps = this.macros[key];
    if (!steps) return { ok: false, error: `Macro "${key}" not found` };
    const tags = this.tagSnapshot();
    const results = [];
    for (const step of steps) {
      const destName = stripBraces(step.tag || step.destination || '');
      if (!destName) continue;
      const value = this.coerce(step.expression ?? step.value ?? '', tags);
      const dest = this.resolveTag(destName);
      if (!dest) {
        results.push({ tag: destName, error: 'tag not found' });
        continue;
      }
      this.tagService.set(dest.name, value);
      tags[dest.name] = value;
      results.push({ tag: dest.name, value });
    }
    return { ok: true, name: key, results };
  }
}

module.exports = { MacroService };
