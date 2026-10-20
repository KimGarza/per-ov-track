#!/usr/bin/env python3
"""Merge environment parameters and validate required CloudFormation inputs.

No AWS calls. Does not deploy resources. Configuration precedence:
overrides/<env>/global.json < overrides/<env>/<stack>.json.
"""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "infra"
STACKS = (
    "network", "security", "secrets", "rds", "cognito-base",
    "ses", "lambda", "routing", "cognito-finalize", "monitoring",
)
ALLOWED = {"dev", "stage", "prod"}
PARAM = re.compile(r"^  ([A-Za-z][A-Za-z0-9]*):(?:\\s|$)")


def read_parameters(path):
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("Parameters"), dict):
        raise ValueError(f"{path}: expected an object with a Parameters object")
    return data["Parameters"]


def template_parameters(path):
    # Parse only the top-level Parameters block, avoiding dependencies on YAML tag handlers.
    lines = path.read_text(encoding="utf-8").splitlines()
    inside = False
    declared = {}
    current = None
    for line in lines:
        if line == "Parameters:":
            inside = True
            continue
        if inside and line and not line.startswith((" ", "#")):
            break
        if not inside:
            continue
        match = PARAM.match(line)
        if match:
            current = match.group(1)
            declared[current] = False
        elif current and re.match(r"^    Default:", line):
            declared[current] = True
    if not declared:
        raise ValueError(f"{path}: no template parameters found")
    return declared


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--environment", required=True, choices=sorted(ALLOWED))
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    env = args.environment
    overrides = ROOT / "overrides" / env
    global_params = read_parameters(overrides / "global.json")
    if global_params.get("env") != env:
        raise ValueError(f"{overrides}/global.json must set Parameters.env to {env!r}")
    result = {}
    errors = []
    for stack in STACKS:
        path = ROOT / "templates" / f"{stack}.yaml"
        declared = template_parameters(path)
        params = {**global_params, **read_parameters(overrides / f"{stack}.json")}
        if params.get("env") != env:
            errors.append(f"{stack}: env mismatch")
        unknown = set(params) - set(declared)
        if unknown:
            errors.append(f"{stack}: unexpected parameters: {sorted(unknown)}")
        missing = [name for name, has_default in declared.items()
                   if not has_default and name not in params]
        if missing:
            errors.append(f"{stack}: missing required parameters: {missing}")
        result[stack] = [
            {"ParameterKey": name, "ParameterValue": str(value).lower()
             if isinstance(value, bool) else str(value)}
            for name, value in params.items() if name in declared
        ]
    if errors:
        raise ValueError("Preflight failed before AWS deployment:\n" + "\n".join(errors))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"Validated {len(STACKS)} stacks for {env}. No AWS resources modified.")


if __name__ == "__main__":
    main()
