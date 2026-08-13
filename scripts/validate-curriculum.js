const fs = require('fs')
const path = require('path')

const { validateCurriculumLedger } = require('./curriculum-validation-core.js')
const {
  loadReleaseSourceRecords,
  validateReleaseCurriculum,
} = require('./content-release-adapter.js')

const ROOT_DIR = path.join(__dirname, '..')

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8'))
}

const ledger = readJson('public/data/curriculum-allocations-v1.json')
const units = readJson('public/data/units.json')
const concepts = readJson('public/data/concepts.json')
const grade1Source = fs.readFileSync(path.join(ROOT_DIR, 'src/lib/grade1-problems.ts'), 'utf8')
const grade2Source = fs.readFileSync(path.join(ROOT_DIR, 'src/lib/grade2-problems.ts'), 'utf8')
const grade3Source = fs.readFileSync(path.join(ROOT_DIR, 'src/lib/grade3-problems.ts'), 'utf8')
const grade4Source = fs.readFileSync(path.join(ROOT_DIR, 'src/lib/grade4-problems.ts'), 'utf8')
const guestHomeSource = fs.readFileSync(path.join(ROOT_DIR, 'src/lib/guest-home.ts'), 'utf8')
const templates = Object.fromEntries(concepts.map((concept) => {
  const prefix = concept.id.split('-')[0]
  return [concept.id, readJson(`public/data/templates/${prefix}.json`)]
}))

const result = validateCurriculumLedger({
  ledger,
  grade1Source,
  grade2Source,
  grade3Source,
  grade4Source,
  guestHomeSource,
  units,
  concepts,
  templates,
})
const directResult = validateReleaseCurriculum(ledger, loadReleaseSourceRecords(ROOT_DIR))
const allErrors = [
  ...result.errors,
  ...directResult.directCoverage.errors,
  ...directResult.roleErrors,
]

if (allErrors.length > 0) {
  console.error('Curriculum allocation validation failed:')
  for (const error of allErrors) {
    console.error(` - [${error.code}]${error.standardCode ? ` ${error.standardCode}` : ''} ${error.message}`)
  }
  process.exit(1)
}

console.log(
  `Curriculum allocation validation passed: ${result.summary.total} standards ` +
  `(1-2 ${result.summary.grade12Total}, 3-4 ${result.summary.grade34Total}, 5-6 ${result.summary.grade56Total}), ` +
  `${result.summary.existingReferenceCount} current references, ` +
  `${directResult.summary.directContentLinkCount} direct problem links, ` +
  `Grades 1-6 released.`
)
