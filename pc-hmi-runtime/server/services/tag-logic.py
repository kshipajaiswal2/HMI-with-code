#!/usr/bin/env python3
"""Evaluate computed HMI tag logic rules. Reads JSON from stdin, writes results to stdout."""
import ast
import json
import sys

SAFE_BUILTINS = {
    "all": all,
    "any": any,
    "min": min,
    "max": max,
    "abs": abs,
    "round": round,
    "int": int,
    "float": float,
    "bool": bool,
    "str": str,
    "len": len,
}


# Rules come from project files, and restricting builtins alone does not sandbox eval()
# (e.g. ().__class__.__subclasses__()), so each expression is checked against the small
# grammar tag logic actually needs before it is evaluated.
ALLOWED_NODES = (
    ast.Expression, ast.BoolOp, ast.And, ast.Or, ast.UnaryOp, ast.Not, ast.USub, ast.UAdd,
    ast.BinOp, ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Mod, ast.FloorDiv,
    ast.Compare, ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt, ast.GtE, ast.In, ast.NotIn,
    ast.IfExp, ast.Call, ast.Name, ast.Load, ast.Store, ast.Constant, ast.List, ast.Tuple,
    ast.Subscript, ast.Attribute, ast.GeneratorExp, ast.comprehension,
)


def check_expression(expr):
    tree = ast.parse(expr, mode="eval")
    for node in ast.walk(tree):
        if not isinstance(node, ALLOWED_NODES):
            raise ValueError(f"{type(node).__name__} is not allowed in tag logic")
        if isinstance(node, ast.Attribute) and not (
            node.attr == "get" and isinstance(node.value, ast.Name) and node.value.id == "tags"
        ):
            raise ValueError("only tags.get(...) attribute access is allowed")
        if isinstance(node, ast.Name) and node.id.startswith("_"):
            raise ValueError("names starting with _ are not allowed")
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id not in SAFE_BUILTINS:
            raise ValueError(f"{node.func.id}() is not allowed")
    return compile(tree, "<tag logic>", "eval")


def coerce(value, tag_type):
    if tag_type == "bool":
        return bool(value)
    if tag_type == "int":
        return int(value)
    if tag_type == "float":
        return float(value)
    return str(value)


def main():
    payload = json.load(sys.stdin)
    tags = dict(payload.get("tags") or {})
    rules = payload.get("rules") or []
    results = {}

    for rule in rules:
        name = rule.get("name")
        expr = rule.get("logic")
        tag_type = rule.get("type") or "bool"
        if not name or not expr:
            continue
        try:
            env = {"__builtins__": SAFE_BUILTINS, "tags": tags}
            value = eval(check_expression(expr), env, env)
            value = coerce(value, tag_type)
            results[name] = value
            tags[name] = value
        except Exception as exc:
            results[name] = {"error": str(exc)}

    json.dump(results, sys.stdout)


if __name__ == "__main__":
    main()
