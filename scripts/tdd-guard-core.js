const { execFileSync } = require('node:child_process')

const DEFAULT_PRODUCT_PATTERNS = [
  /^src\/(?!.+\.(test|spec)\.[tj]sx?$).+\.(ts|tsx|js|jsx|css)$/,
  /^public\/data\/.+\.json$/
]

const DEFAULT_TEST_PATTERNS = [
  /^src\/.+\.(test|spec)\.[tj]sx?$/,
  /^e2e\/.+\.(test|spec)\.[tj]sx?$/,
  /^scripts\/.+(test|spec).+\.(js|ts|tsx)$/
]

const DEFAULT_IGNORED_PATTERNS = [
  /^\.codex\//,
  /^\.github\//,
  /^docs\//,
  /^handoffs\//,
  /^harness_framework\//,
  /^phases\//,
  /^references\//,
  /^workstreams\//,
  /^node_modules\//,
  /^\.next\//,
  /^out\//,
  /^public\/reports\//,
  /^package-lock\.json$/,
  /^package\.json$/,
  /^AGENTS\.md$/,
  /^TODO\.md$/
]

const GUARD_PATTERNS = [
  /^\.codex\/config\.toml$/,
  /^\.codex\/hooks\/.+$/,
  /^scripts\/tdd-guard-core\.js$/
]

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '')
}

function matchesAny(filePath, patterns) {
  const normalized = normalizePath(filePath)
  return patterns.some((pattern) => pattern.test(normalized))
}

function parsePorcelainStatus(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const rawPath = line.slice(3)
      if (rawPath.includes(' -> ')) {
        return rawPath.split(' -> ').pop()
      }
      return rawPath
    })
    .map(normalizePath)
}

function classifyChangedFiles(files, options = {}) {
  const productPatterns = options.productPatterns ?? DEFAULT_PRODUCT_PATTERNS
  const testPatterns = options.testPatterns ?? DEFAULT_TEST_PATTERNS
  const ignoredPatterns = options.ignoredPatterns ?? DEFAULT_IGNORED_PATTERNS

  const changedFiles = Array.from(new Set(files.map(normalizePath))).sort()
  const guardFiles = changedFiles.filter((file) => matchesAny(file, GUARD_PATTERNS))
  const testFiles = changedFiles.filter((file) => matchesAny(file, testPatterns))
  const productFiles = changedFiles.filter((file) => {
    if (matchesAny(file, ignoredPatterns)) return false
    if (matchesAny(file, testPatterns)) return false
    return matchesAny(file, productPatterns)
  })

  return {
    changedFiles,
    guardFiles,
    productFiles,
    testFiles
  }
}

function evaluateTddGuard(files, options = {}) {
  const classification = classifyChangedFiles(files, options)
  const allowNoTest = options.allowNoTest === true

  if (classification.productFiles.length === 0) {
    return {
      ...classification,
      allowed: true,
      reason: 'No production code changes detected.'
    }
  }

  if (classification.testFiles.length > 0) {
    return {
      ...classification,
      allowed: true,
      reason: 'Production changes include test changes.'
    }
  }

  if (allowNoTest) {
    return {
      ...classification,
      allowed: true,
      reason: 'Production changes without tests allowed by TDD_GUARD_ALLOW_NO_TEST.'
    }
  }

  return {
    ...classification,
    allowed: false,
    reason: [
      'TDD violation: production code changed without a test change.',
      'Next legal action: add or update one focused test that captures the requested behavior,',
      'run it, then implement only the minimum production code needed to pass.'
    ].join(' ')
  }
}

function evaluatePorcelainStatus(output, options = {}) {
  return evaluateTddGuard(parsePorcelainStatus(output), options)
}

function formatTddGuardResult(result) {
  const stdout = []
  const stderr = []

  if (result.guardFiles.length > 0) {
    stderr.push(`tdd-guard: guard files changed: ${result.guardFiles.join(', ')}`)
  }

  if (result.allowed) {
    stdout.push(`tdd-guard: allow - ${result.reason}`)
    if (result.productFiles.length > 0) {
      stdout.push(`tdd-guard: production files: ${result.productFiles.join(', ')}`)
      stdout.push(`tdd-guard: test files: ${result.testFiles.join(', ')}`)
    }
    return { exitCode: 0, stdout, stderr }
  }

  stderr.push(`tdd-guard: deny - ${result.reason}`)
  stderr.push(`tdd-guard: production files: ${result.productFiles.join(', ')}`)
  stderr.push('tdd-guard: no matching test files changed in this step')
  return { exitCode: 1, stdout, stderr }
}

function runCli({ cwd = process.cwd(), env = process.env } = {}) {
  const status = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
    cwd,
    encoding: 'utf8'
  })

  if (status.trim() === '') {
    console.log('tdd-guard: no changes detected')
    return 0
  }

  const result = evaluatePorcelainStatus(status, {
    allowNoTest: env.TDD_GUARD_ALLOW_NO_TEST === '1'
  })
  const rendered = formatTddGuardResult(result)

  for (const line of rendered.stdout) console.log(line)
  for (const line of rendered.stderr) console.error(line)

  return rendered.exitCode
}

if (require.main === module) {
  process.exit(runCli())
}

module.exports = {
  DEFAULT_IGNORED_PATTERNS,
  DEFAULT_PRODUCT_PATTERNS,
  DEFAULT_TEST_PATTERNS,
  GUARD_PATTERNS,
  classifyChangedFiles,
  evaluateTddGuard,
  evaluatePorcelainStatus,
  formatTddGuardResult,
  parsePorcelainStatus
}
