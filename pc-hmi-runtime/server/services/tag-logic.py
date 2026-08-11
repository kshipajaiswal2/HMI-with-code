#!/usr/bin/env python3
"""Evaluate computed HMI tag logic rules. Reads JSON from stdin, writes results to stdout."""
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
            value = eval(expr, env, env)
            value = coerce(value, tag_type)
            results[name] = value
            tags[name] = value
        except Exception as exc:
            results[name] = {"error": str(exc)}

    json.dump(results, sys.stdout)


if __name__ == "__main__":
    main()
