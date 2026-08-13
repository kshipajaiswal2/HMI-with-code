/** Browser-side tag expression evaluation (Python-style, same as tag-logic fallback). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ExpressionEval = factory();
  }
}(typeof self !== 'undefined' ? self : this, function expressionEvalFactory() {
  const EXPR_PREFIX = '=';

  function isExpression(ref) {
    const s = String(ref || '').trim();
    if (!s) return false;
    if (s.startsWith(EXPR_PREFIX)) return true;
    if (/tags\.get\s*\(/i.test(s)) return true;
    if (/\bif\b|\band\b|\bor\b|\bnot\b|\belse\b/i.test(s) && /[<>=!+\-*\/()]/.test(s)) return true;
    if (/^\(.+\s+if\s+.+\s+else\s+.+\)$/i.test(s)) return true;
    return false;
  }

  function normalizeExpression(ref) {
    const s = String(ref || '').trim();
    if (s.startsWith(EXPR_PREFIX)) return s.slice(1).trim();
    return s;
  }

  function translatePythonLogicToJs(logic) {
    let expr = String(logic).trim();
    expr = expr.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
    expr = expr.replace(/\band\b/gi, '&&').replace(/\bor\b/gi, '||').replace(/\bnot\b/gi, '!');
    expr = expr.replace(
      /([\s\S]+?)\s+if\s+([\s\S]+?)\s+else\s+([\s\S]+)/i,
      '($2 ? $1 : $3)'
    );
    expr = expr.replace(
      /all\(tags\.get\(n,\s*false\)\s+for\s+n\s+in\s+(\[[^\]]+\])\)/gi,
      '$1.every((n) => Boolean(tags[n]))'
    );
    expr = expr.replace(
      /any\(tags\.get\(n,\s*false\)\s+for\s+n\s+in\s+(\[[^\]]+\])\)/gi,
      '$1.some((n) => Boolean(tags[n]))'
    );
    expr = expr.replace(
      /tags\.get\(\s*('[^']+'|"[^"]+")\s*,\s*false\s*\)/gi,
      '(tags[$1] ?? false)'
    );
    expr = expr.replace(
      /tags\.get\(\s*('[^']+'|"[^"]+")\s*,\s*(\d+(?:\.\d+)?|true|false|null)\s*\)/gi,
      '(tags[$1] ?? $2)'
    );
    return expr;
  }

  function extractTagRefs(ref) {
    const expr = normalizeExpression(ref);
    const refs = new Set();
    if (!isExpression(ref)) {
      const plain = String(ref || '').trim();
      if (plain) refs.add(plain);
      return [...refs];
    }
    const re = /tags\.get\(\s*['"]([^'"]+)['"]/gi;
    let m;
    while ((m = re.exec(expr))) refs.add(m[1]);
    return [...refs];
  }

  function resolveBinding(ref) {
    const raw = String(ref || '').trim();
    if (!raw) return { type: 'none' };
    if (isExpression(raw)) {
      return { type: 'expression', expr: normalizeExpression(raw), raw };
    }
    return { type: 'tag', name: raw, raw };
  }

  function evaluate(expr, tags) {
    const logic = normalizeExpression(expr);
    if (!logic) return undefined;
    if (!isExpression(logic) && !/tags\.get|[<>!=+\-*\/()]/.test(logic)) {
      return tags[logic];
    }
    const js = translatePythonLogicToJs(logic);
    const fn = new Function('tags', 'Math', `"use strict"; return (${js});`);
    return fn(tags, Math);
  }

  function checkSyntax(expr) {
    const logic = normalizeExpression(expr);
    if (!logic) return { ok: false, message: 'Expression is empty.' };
    try {
      const js = translatePythonLogicToJs(logic);
      // eslint-disable-next-line no-new
      new Function('tags', 'Math', `"use strict"; return (${js});`);
      evaluate(logic, {});
      return { ok: true, message: 'Syntax OK.' };
    } catch (err) {
      return { ok: false, message: err.message || String(err) };
    }
  }

  function bindExpression(ref, callback, ctx) {
    const binding = resolveBinding(ref);
    if (binding.type === 'none') return;
    if (binding.type === 'tag') {
      ctx.bindTag(binding.name, callback);
      return;
    }
    const refs = extractTagRefs(binding.raw);
    const update = () => {
      const snap = {};
      refs.forEach((name) => {
        snap[name] = ctx.getTagValue(name);
      });
      try {
        callback(evaluate(binding.expr, snap));
      } catch {
        callback(undefined);
      }
    };
    update();
    refs.forEach((name) => ctx.bindTag(name, update));
  }

  return {
    EXPR_PREFIX,
    isExpression,
    normalizeExpression,
    translatePythonLogicToJs,
    extractTagRefs,
    resolveBinding,
    evaluate,
    checkSyntax,
    bindExpression
  };
}));
