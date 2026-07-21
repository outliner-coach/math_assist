const fs = require('fs')
const os = require('os')
const path = require('path')
const ts = require('typescript')

const ROOT_DIR = path.join(__dirname, '..')
const SOURCE_PATH = path.join(ROOT_DIR, 'src', 'lib', 'grade4-problems.ts')
const LEDGER_PATH = path.join(ROOT_DIR, 'public', 'data', 'curriculum-allocations-v1.json')

function loadGrade4ProblemModule() {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  })
  const outPath = path.join(os.tmpdir(), `grade4-problems-${process.pid}.cjs`)
  fs.writeFileSync(outPath, compiled.outputText)
  try {
    delete require.cache[outPath]
    return require(outPath)
  } finally {
    try { fs.unlinkSync(outPath) } catch { /* Best-effort cleanup only. */ }
  }
}

const { grade4MissionTemplates, validateGrade4MissionBank } = loadGrade4ProblemModule()
const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'))
const result = validateGrade4MissionBank(ledger)

if (result.errors.length > 0) {
  console.error('Grade 4 release-candidate validation failed:')
  for (const error of result.errors) console.error(' -', error)
  process.exit(1)
}
for (const warning of result.warnings) console.warn('Warning:', warning)
console.log(`Grade 4 release-candidate validation passed: ${grade4MissionTemplates.length} templates, K/A/R ${result.summary.knowingCount}/${result.summary.applyingCount}/${result.summary.reasoningCount}.`)
