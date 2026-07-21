const fs = require('fs')
const path = require('path')

const {
  inspectProblemBlueprintMeta,
  loadProblemGenerator,
} = require('./problem-quality-core')

const ROOT = path.join(__dirname, '..')
const units = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/units.json'), 'utf8'))
const concepts = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/concepts.json'), 'utf8'))
const templates = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/templates/g6ratio.json'), 'utf8'))
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/curriculum-allocations-v1.json'), 'utf8'))
const { generateProblems } = loadProblemGenerator()

const errors = []
const grade6Units = units.filter((unit) => unit.grade === 6)
const grade6UnitIds = new Set(grade6Units.map((unit) => unit.id))
const grade6Concepts = concepts.filter((concept) => grade6UnitIds.has(concept.unit_id))
const grade6ConceptIds = new Set(grade6Concepts.map((concept) => concept.id))
const ledgerRows = ledger.allocations.filter((row) => row.assignedGrade === 6 && grade6UnitIds.has(row.unitId))
const ledgerStandards = new Set(ledgerRows.map((row) => row.standardCode))

function fail(message) {
  errors.push(message)
}

for (const unit of grade6Units) {
  if (!/^unit-6-[12]-[a-z0-9-]+$/.test(unit.id)) fail(`invalid Grade 6 unit id: ${unit.id}`)
  if (unit.semester !== '6-1' && unit.semester !== '6-2') fail(`invalid Grade 6 semester: ${unit.id}`)
}
for (const concept of grade6Concepts) {
  if (!/^g6[a-z0-9]+-\d{3}$/.test(concept.id)) fail(`invalid Grade 6 concept id: ${concept.id}`)
}
if (!grade6UnitIds.has('unit-6-1-ratio')) fail('unit-6-1-ratio is missing')
if (!grade6ConceptIds.has('g6ratio-001')) fail('g6ratio-001 is missing')

for (const concept of grade6Concepts) {
  const conceptTemplates = templates.filter((template) => template.concept_id === concept.id)
  if (conceptTemplates.length !== 30) fail(`${concept.id}: expected 30 templates, got ${conceptTemplates.length}`)

  for (const setId of ['A', 'B', 'C']) {
    const setTemplates = conceptTemplates.filter((template) => template.set_id === setId)
    const difficulties = [1, 2, 3].map((difficulty) => setTemplates.filter((template) => template.difficulty === difficulty).length)
    const domains = ['knowing', 'applying', 'reasoning'].map((domain) => setTemplates.filter((template) => template.blueprint?.cognitiveDomain === domain).length)
    if (setTemplates.length !== 10 || difficulties.join('/') !== '4/4/2') {
      fail(`${concept.id} set ${setId}: expected difficulty 4/4/2, got ${difficulties.join('/')}`)
    }
    if (domains.join('/') !== '4/4/2') {
      fail(`${concept.id} set ${setId}: expected K/A/R 4/4/2, got ${domains.join('/')}`)
    }

    const otherSetFamilies = new Set(conceptTemplates
      .filter((template) => template.set_id !== setId)
      .map((template) => template.problem_family))
    const overlaps = setTemplates
      .map((template) => template.problem_family)
      .filter((family) => otherSetFamilies.has(family))
    if (overlaps.length > 0) fail(`${concept.id} set ${setId}: families overlap another set: ${overlaps.join(', ')}`)

    for (const count of [5, 10]) {
      for (const seed of [6101, 6102, 6103]) {
        try {
          const generated = generateProblems(conceptTemplates, {
            count,
            setId,
            seed,
            difficultyMix: count === 5 ? { 1: 2, 2: 2, 3: 1 } : { 1: 4, 2: 4, 3: 2 },
          })
          if (generated.length !== count) fail(`${concept.id} set ${setId}: generated ${generated.length}/${count}`)
          if (new Set(generated.map((problem) => problem.prompt)).size !== generated.length) {
            fail(`${concept.id} set ${setId} seed ${seed}: duplicate rendered prompts`)
          }
        } catch (error) {
          fail(`${concept.id} set ${setId} seed ${seed}: ${error.message}`)
        }
      }
    }
  }

  const families = new Set(conceptTemplates.map((template) => template.problem_family))
  const reasoningFamilies = new Set(conceptTemplates
    .filter((template) => template.blueprint?.cognitiveDomain === 'reasoning')
    .map((template) => template.problem_family))
  const representations = new Set(conceptTemplates.flatMap((template) => template.blueprint?.representations ?? []))
  if (families.size < 8) fail(`${concept.id}: expected at least 8 problem families, got ${families.size}`)
  if (reasoningFamilies.size < 2) fail(`${concept.id}: expected at least 2 reasoning families, got ${reasoningFamilies.size}`)
  if (representations.size < 2) fail(`${concept.id}: expected at least 2 representations, got ${representations.size}`)
}

for (const template of templates) {
  if (!grade6ConceptIds.has(template.concept_id)) fail(`${template.id}: unknown Grade 6 concept ${template.concept_id}`)
  const inspection = inspectProblemBlueprintMeta(template)
  for (const issue of inspection.issues) fail(`${template.id}: ${issue.code} ${issue.message}`)
  const referenced = [template.blueprint?.primaryStandard, ...(template.blueprint?.connectedStandards ?? [])]
  if (referenced.includes('[6수02-04]')) fail(`${template.id}: proportion standard [6수02-04] belongs to a later release`)
  if (/equivalent-ratio|missing-ratio-term/.test(template.problem_family ?? '')) {
    fail(`${template.id}: proportion problem family belongs to a later release`)
  }
  if (template.blueprint?.representations?.includes('table')) {
    if (template.visual_template?.type !== 'ratio_table' || template.visual_template?.semantics !== 'quantitative') {
      fail(`${template.id}: table representation requires a quantitative ratio_table visual`)
    }
  }
  for (const standard of referenced) {
    if (!ledgerStandards.has(standard)) fail(`${template.id}: ledger does not assign ${standard} to this Grade 6 release unit`)
  }
}

for (const standard of ['[6수02-02]', '[6수02-03]']) {
  if (!templates.some((template) => template.blueprint?.primaryStandard === standard)) {
    fail(`released standard ${standard} has no primary template mapping`)
  }
  const row = ledgerRows.find((entry) => entry.standardCode === standard)
  if (!row) fail(`released standard ${standard} is missing from the curriculum ledger`)
  if (row?.reviewStatus !== 'released' || row?.coverageStatus !== 'existing-reference') {
    fail(`released standard ${standard} is not promoted to released/existing-reference`)
  }
  if (!row?.existingContentRefs?.includes('grade6:g6ratio-001')) {
    fail(`released standard ${standard} does not reference grade6:g6ratio-001`)
  }
}
if (ledger.releaseState?.grade6 !== 'released') {
  fail(`Grade 6 ledger state must be released after the public home and recovery gates pass`)
}

if (errors.length > 0) {
  console.error('Grade 6 template validation failed:')
  for (const error of errors) console.error(` - ${error}`)
  process.exit(1)
}

console.log(`Grade 6 validation passed: ${grade6Units.length} unit, ${grade6Concepts.length} concept, ${templates.length} templates; A/B/C 10 each; 5/10 generation ready.`)
