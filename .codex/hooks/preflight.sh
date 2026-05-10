#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if ! command -v codex >/dev/null 2>&1; then
  echo "ERROR: codex CLI is not installed or is not on PATH." >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: harness must run inside a git worktree." >&2
  exit 1
fi

if [ ! -f AGENTS.md ]; then
  echo "ERROR: AGENTS.md is required for Codex project instructions." >&2
  exit 1
fi

if [ ! -f .codex/config.toml ]; then
  echo "ERROR: .codex/config.toml is required for harness hook paths." >&2
  exit 1
fi

if grep -Eq '^hooks[[:space:]]*=' .codex/config.toml; then
  echo "ERROR: .codex/config.toml must not set top-level 'hooks = ...'; Codex CLI parses hooks as a table." >&2
  exit 1
fi

for key in preflight tdd_guard post_step; do
  if ! grep -Eq "^[[:space:]]*${key}[[:space:]]*=" .codex/config.toml; then
    echo "ERROR: .codex/config.toml must define hook_paths.${key}." >&2
    exit 1
  fi
done

if [ ! -x .codex/hooks/preflight.sh ]; then
  echo "ERROR: .codex/hooks/preflight.sh must exist and be executable." >&2
  exit 1
fi

if [ ! -x .codex/hooks/tdd-guard.sh ]; then
  echo "ERROR: .codex/hooks/tdd-guard.sh must exist and be executable." >&2
  exit 1
fi

if [ ! -x .codex/hooks/post-step.sh ]; then
  echo "ERROR: .codex/hooks/post-step.sh must exist and be executable." >&2
  exit 1
fi
