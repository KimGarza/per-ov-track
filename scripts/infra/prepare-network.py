"""Validate and merge nonsecret network parameters. Does not contact AWS."""
import argparse
import ipaddress
import json
import re
from pathlib import Path


def prepare(root, environment):
    if environment != 'dev':
        raise ValueError('Only dev networking is configured for deployment.')
    directory = root / 'infra' / 'overrides' / environment
    merged = {}
    for name in ['_global', 'network']:
        rows = json.loads((directory / f'{name}.json').read_text())
        if not isinstance(rows, list):
            raise ValueError(f'{name}.json must be a parameter array.')
        keys = set()
        for row in rows:
            if not isinstance(row, dict) or set(row) != {'ParameterKey', 'ParameterValue'}:
                raise ValueError(f'Invalid parameter in {name}.json.')
            key, value = row['ParameterKey'], row['ParameterValue']
            if not isinstance(key, str) or not isinstance(value, str) or key in keys:
                raise ValueError(f'Duplicate or non-string parameter in {name}.json.')
            if name == 'network' and key in {'Environment', 'AppName'}:
                raise ValueError('Environment and AppName belong only in _global.json.')
            keys.add(key)
            merged[key] = value
    required = {'Environment', 'AppName', 'VpcCidr', 'PrivateSubnetACidr', 'PrivateSubnetBCidr'}
    if set(merged) != required or merged['Environment'] != environment:
        raise ValueError('Network parameter names or environment do not match the target.')
    if not re.fullmatch(r'[a-z][a-z0-9-]*', merged['AppName']):
        raise ValueError('AppName is not a valid resource-name prefix.')
    vpc, a, b = [ipaddress.IPv4Network(merged[k], strict=True) for k in
                 ['VpcCidr', 'PrivateSubnetACidr', 'PrivateSubnetBCidr']]
    if not 16 <= vpc.prefixlen <= 28 or any(not 16 <= s.prefixlen <= 28 for s in [a, b]):
        raise ValueError('AWS IPv4 subnet/VPC prefixes must be between /16 and /28.')
    if not a.subnet_of(vpc) or not b.subnet_of(vpc) or a.overlaps(b):
        raise ValueError('Subnets must be disjoint and inside the VPC CIDR.')
    return merged


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--environment', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    parameters = prepare(Path(__file__).resolve().parents[2], args.environment)
    args.output.write_text(json.dumps(parameters, indent=2) + '\n')
    print(f"Validated {args.environment}-{parameters['AppName']}-network parameters.")
