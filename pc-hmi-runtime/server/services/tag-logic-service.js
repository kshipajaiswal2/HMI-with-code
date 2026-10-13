const { spawnSync } = require('child_process');
const path = require('path');

const ESTOP_CHAIN = [
  'Safety.S_All_E_Stop_Healthy',
  'Safety.RIO01_SDI_01',
  'Safety.RIO01_SDI_02',
  'Safety.RIO01_SDI_03',
  'Safety.RIO01_SDI_04',
  'Safety.RIO01_SDI_07',
  'Safety.RIO01_SDI_08',
  'Safety.RIO01_SDI_11',
  'Safety.RIO01_SDI_12',
  'Safety.RIO01_SDI_15',
  'Safety.RIO01_SDI_16',
  'Safety.RIO01_SDI_17',
  'Safety.RIO01_SDI_18',
  'Safety.RIO01_SDI_19',
  'Safety.RIO01_SDI_20'
];

class TagLogicService {
  constructor(tagService) {
    this.tagService = tagService;
    this.rules = [];
    this.pythonCmd = process.env.PYTHON || 'python';
    this.scriptPath = path.join(__dirname, 'tag-logic.py');
    this.lastEngine = 'none';
  }

  loadRules(tagDefinitions) {
    this.rules = (tagDefinitions || [])
      .filter((def) => def.logic && String(def.logic).trim())
      .map((def) => ({
        name: def.name,
        logic: String(def.logic).trim(),
        type: def.type || 'bool',
        computed: def.computed === true
      }));
  }

  getRules() {
    return this.rules.map((rule) => ({ ...rule }));
  }

  snapshotTagValues() {
    const tags = {};
    for (const [name, tag] of this.tagService.tags.entries()) {
      tags[name] = tag.value;
    }
    return tags;
  }

  evaluate() {
    if (!this.rules.length) {
      this.lastEngine = 'none';
      return { updated: [], engine: this.lastEngine };
    }

    const tags = this.snapshotTagValues();
    const results = this.runPython(tags) || this.runJsFallback(tags);
    const updated = [];

    for (const rule of this.rules) {
      const value = results[rule.name];
      if (value && typeof value === 'object' && value.error) continue;
      const tag = this.tagService.get(rule.name);
      if (!tag) continue;
      if (tag.value !== value) {
        this.tagService.set(rule.name, value);
        updated.push(rule.name);
      }
    }

    return { updated, engine: this.lastEngine };
  }

  runPython(tags) {
    try {
      const proc = spawnSync(this.pythonCmd, [this.scriptPath], {
        input: JSON.stringify({ tags, rules: this.rules }),
        encoding: 'utf8',
        timeout: 5000,
        windowsHide: true
      });
      if (proc.error || proc.status !== 0) return null;
      const parsed = JSON.parse(proc.stdout || '{}');
      const hasError = Object.values(parsed).some(
        (value) => value && typeof value === 'object' && value.error
      );
      if (hasError) return null;
      this.lastEngine = 'python';
      return parsed;
    } catch {
      return null;
    }
  }

  translatePythonLogicToJs(logic) {
    let expr = String(logic).trim();
    expr = expr.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
    expr = expr.replace(
      /all\(tags\.get\(n,\s*false\)\s+for\s+n\s+in\s+(\[[^\]]+\])\)/gi,
      '$1.every((n) => Boolean(tags[n]))'
    );
    expr = expr.replace(
      /tags\.get\(\s*('[^']+'|"[^"]+")\s*,\s*false\s*\)/gi,
      '(tags[$1] ?? false)'
    );
    return expr;
  }

  // Rules come from project files and are compiled with new Function below, so only the small
  // vocabulary the translated tag logic uses is accepted: no other identifiers (process,
  // require, eval, constructor...), no statements or template strings, and no string keys that
  // could reach a constructor (e.g. tags['A']['constructor']['constructor']('code')).
  static assertSafeJsLogic(expr) {
    const strings = expr.match(/'[^'\\]*'|"[^"\\]*"/g) || [];
    if (strings.some((s) => /constructor|prototype|__/.test(s))) throw new Error('Disallowed string in tag logic');
    const code = expr.replace(/'[^'\\]*'|"[^"\\]*"/g, '""');
    if (/[`;{}\\]|=(?!=|>)/.test(code.replace(/[=!]==?|[<>]=/g, ''))) throw new Error('Disallowed syntax in tag logic');
    for (const word of code.match(/[A-Za-z_$][\w$]*/g) || []) {
      if (!TagLogicService.JS_LOGIC_WORDS.has(word)) throw new Error(`"${word}" is not allowed in tag logic`);
    }
  }

  runJsFallback(tags) {
    const ctx = Object.assign(Object.create(null), tags);
    const results = {};

    for (const rule of this.rules) {
      try {
        const expr = this.translatePythonLogicToJs(rule.logic);
        TagLogicService.assertSafeJsLogic(expr);
        const fn = new Function('tags', 'Math', `"use strict"; return (${expr});`);
        let value = fn(ctx, Math);
        if (rule.type === 'bool') value = Boolean(value);
        else if (rule.type === 'int') value = parseInt(value, 10);
        else if (rule.type === 'float') value = parseFloat(value);
        else value = String(value);
        results[rule.name] = value;
        ctx[rule.name] = value;
      } catch (err) {
        results[rule.name] = { error: err.message };
      }
    }

    this.lastEngine = 'javascript';
    return results;
  }

  isComputed(name) {
    return this.rules.some((rule) => rule.name === name && rule.computed);
  }

  /** Inject Safety ladder + header tags when missing from project.json (not when tags were cleared). */
  static mergeBuiltinSafetyTags(tagDefinitions) {
    const list = tagDefinitions || [];
    if (!list.length) return [];

    const byName = new Map(list.map((t) => [t.name, { ...t }]));
    for (const name of ESTOP_CHAIN) {
      if (!byName.has(name)) {
        byName.set(name, { name, type: 'bool', description: name });
      }
    }
    const chainList = JSON.stringify(ESTOP_CHAIN);
    if (!byName.has('System.All_E_Stop_Healthy')) {
      byName.set('System.All_E_Stop_Healthy', {
        name: 'System.All_E_Stop_Healthy',
        type: 'bool',
        computed: true,
        description: 'All E-Stop chain healthy (computed)',
        logic: `all(tags.get(n, False) for n in ${chainList})`
      });
    }
    if (!byName.has('System.Healthy')) {
      byName.set('System.Healthy', {
        name: 'System.Healthy',
        type: 'bool',
        computed: true,
        description: 'System healthy (computed)',
        logic: "tags.get('System.All_E_Stop_Healthy', False)"
      });
    }
    return [...byName.values()];
  }

  /** Header / overview tags used by Template.json when not defined in project tags. */
  static mergeBuiltinRuntimeTags(tagDefinitions) {
    const list = tagDefinitions || [];
    const byName = new Map(list.map((t) => [t.name, { ...t }]));
    const builtins = [
      { name: 'System.AutoMode', type: 'bool', description: '1=Auto, 0=Manual' },
      { name: 'System.Running', type: 'bool', description: 'Line running' },
      { name: 'Comm.PLCConnected', type: 'bool', description: 'PLC communication' },
      { name: 'Comm.ScanRate', type: 'float', description: 'PLC scan rate ms' }
    ];
    for (const def of builtins) {
      if (!byName.has(def.name)) byName.set(def.name, def);
    }
    return [...byName.values()];
  }
}

TagLogicService.ESTOP_CHAIN = ESTOP_CHAIN;
TagLogicService.JS_LOGIC_WORDS = new Set([
  'tags', 'n', 'true', 'false', 'null', 'undefined', 'every', 'some', 'Boolean', 'Number',
  'Math', 'min', 'max', 'abs', 'round', 'floor', 'ceil'
]);

module.exports = { TagLogicService };
