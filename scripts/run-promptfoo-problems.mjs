#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HTML_REPORT_PATH = path.join(REPOSITORY_ROOT, 'public/reports/promptfoo-problem-quality.html')
const JSON_REPORT_PATH = path.join(REPOSITORY_ROOT, 'out/promptfoo/problem-quality.json')

export function stripTrailingWhitespace(source) {
  return source.replace(/[\t ]+(?=\r?\n|$)/g, '')
}

export function normalizeHtmlReport(reportPath = HTML_REPORT_PATH) {
  const source = readFileSync(reportPath, 'utf8')
  const normalized = stripTrailingWhitespace(source)
  if (normalized !== source) writeFileSync(reportPath, normalized)
}

export function runPromptfooProblemQuality() {
  mkdirSync(path.dirname(HTML_REPORT_PATH), { recursive: true })
  mkdirSync(path.dirname(JSON_REPORT_PATH), { recursive: true })

  const executable = process.platform === 'win32' ? 'promptfoo.cmd' : 'promptfoo'
  const result = spawnSync(executable, [
    'eval',
    '-c',
    'promptfooconfig.problem-quality.yaml',
    '--no-progress-bar',
    '-o',
    HTML_REPORT_PATH,
    '-o',
    JSON_REPORT_PATH,
  ], {
    cwd: REPOSITORY_ROOT,
    env: process.env,
    stdio: 'inherit',
  })

  if (result.status !== 0) return result.status ?? 1
  normalizeHtmlReport()
  return 0
}

const invokedDirectly = Boolean(process.argv[1])
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (invokedDirectly) process.exitCode = runPromptfooProblemQuality()
