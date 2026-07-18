const fs = require('fs')
const os = require('os')
const path = require('path')
const ts = require('typescript')

const ROOT_DIR = path.join(__dirname, '..')
const SOURCE_PATH = path.join(ROOT_DIR, 'src', 'lib', 'grade3-problems.ts')

function loadGrade3ProblemModule() {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  })

  const outPath = path.join(os.tmpdir(), `grade3-problems-${process.pid}.cjs`)
  fs.writeFileSync(outPath, compiled.outputText)
  try {
    delete require.cache[outPath]
    return require(outPath)
  } finally {
    try {
      fs.unlinkSync(outPath)
    } catch {
      // Best-effort cleanup only.
    }
  }
}

const {
  grade3MissionTemplates,
  validateGrade3MissionBank,
} = loadGrade3ProblemModule()

const result = validateGrade3MissionBank()

if (result.errors.length > 0) {
  console.error('Grade 3 mission validation failed:')
  for (const error of result.errors) {
    console.error(' -', error)
  }
  process.exit(1)
}

for (const warning of result.warnings) {
  console.warn('Warning:', warning)
}

console.log(`Grade 3 mission validation passed: ${grade3MissionTemplates.length} templates.`)
