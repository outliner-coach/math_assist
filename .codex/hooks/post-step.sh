#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

.codex/hooks/tdd-guard.sh
npm run lint
npm run build
npm run test
