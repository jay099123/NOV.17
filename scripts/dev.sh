#!/usr/bin/env bash
set -euo pipefail
NOV17_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -x "$NOV17_ROOT/.tools/node/bin/node" ]]; then
  export PATH="$NOV17_ROOT/.tools/node/bin:$PATH"
fi
if ! command -v node >/dev/null 2>&1; then
  printf 'Please install Node.js 22 or newer.\n' >&2
  exit 1
fi
cd "$NOV17_ROOT"
if [[ ! -d node_modules ]]; then
  npm ci
fi
exec npm run dev -- "$@"
