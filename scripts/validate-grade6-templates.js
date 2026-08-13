const fs = require('fs')
const path = require('path')

const { validateGrade6Release } = require('./grade6-validation-core')

const root = path.join(__dirname, '..')
const units = JSON.parse(fs.readFileSync(path.join(root, 'public/data/units.json'), 'utf8'))
const concepts = JSON.parse(fs.readFileSync(path.join(root, 'public/data/concepts.json'), 'utf8'))
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'public/data/curriculum-allocations-v1.json'), 'utf8'))
const grade6UnitIds = new Set(units.filter((unit) => unit.grade === 6).map((unit) => unit.id))
const grade6Concepts = concepts.filter((concept) => grade6UnitIds.has(concept.unit_id))
const templatesByConcept = {}

for (const concept of grade6Concepts) {
  const prefix = concept.id.split('-')[0]
  const templatePath = path.join(root, 'public/data/templates', `${prefix}.json`)
  if (fs.existsSync(templatePath)) {
    templatesByConcept[concept.id] = JSON.parse(fs.readFileSync(templatePath, 'utf8'))
  }
}

const result = validateGrade6Release({ units, concepts, ledger, templatesByConcept })
if (result.errors.length > 0) {
  console.error('Grade 6 template validation failed:')
  for (const error of result.errors) console.error(` - ${error}`)
  process.exit(1)
}

console.log(
  `Grade 6 validation passed: ${result.summary.unitCount} units, ` +
  `${result.summary.conceptCount} concepts, ${result.summary.templateCount} templates; ` +
  'A/B/C 10 each; 5/10 generation ready.',
)
