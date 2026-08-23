import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    // Local-only working surfaces that must never be staged (see AGENTS.md).
    // Nested agent worktrees duplicate product sources and would otherwise be
    // scanned as if they were part of the app.
    '.dryforge/**',
    '.claude/**',
    '.codex/**',
    '.omo/**',
    '.vscode/**',
    'e2e-screenshots/**',
    'next-env.d.ts',
  ]),
])
