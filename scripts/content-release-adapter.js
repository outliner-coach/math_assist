const fs = require('fs')
const os = require('os')
const path = require('path')
const ts = require('typescript')

const { buildCanonicalMathSignature } = require('./content-inventory-core')
const { validateDirectCurriculumCoverage } = require('./curriculum-direct-link-core')

const ROOT_DIR = path.join(__dirname, '..')
const EXPECTED_SOURCE_COUNTS = Object.freeze({
  1: 98,
  2: 144,
  3: 120,
  4: 150,
  5: 780,
  6: 330,
})
const SESSION_ITEM_COUNTS = Object.freeze({
  1: Object.freeze({ basic: 7, practice: 7 }),
  2: Object.freeze({ basic: 6, practice: 6 }),
  3: Object.freeze({ basic: 3, practice: 3 }),
  4: Object.freeze({ basic: 3, practice: 3 }),
  5: Object.freeze({ basic: 5, practice: 10 }),
  6: Object.freeze({ basic: 5, practice: 10 }),
})

function stableCompare(left, right) {
  return String(left) < String(right) ? -1 : String(left) > String(right) ? 1 : 0
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort(stableCompare).map((key) => [key, canonicalize(value[key])])
    )
  }
  return value
}

function stableJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`
}

function normalizeStandardCode(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  const trimmed = value.trim()
  return trimmed.startsWith('[') ? trimmed : `[${trimmed}]`
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort(stableCompare)
}

function compileTsModule(sourcePath, moduleName) {
  const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  })
  const outPath = path.join(
    os.tmpdir(),
    `${moduleName}-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.cjs`
  )
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

function rangeCombinationCount(schema, sourceId) {
  let count = 1
  for (const [name, range] of Object.entries(schema ?? {})) {
    if (!Number.isInteger(range?.min) || !Number.isInteger(range?.max) || range.max < range.min) {
      throw new Error(`${sourceId}: invalid parameter range ${name}`)
    }
    count *= range.max - range.min + 1
  }
  return count
}

function normalizePromptStructure(value) {
  return String(value ?? '').replace(/\d+(?:\.\d+)?/g, '#').replace(/\s+/g, ' ').trim()
}

function semanticFieldsForMission(grade, template) {
  if (grade === 1) {
    return {
      problemFamily: template.problemFamily,
      solutionRule: template.solverRule,
      contextType: template.contextType,
      representationTypes: template.representationTypes,
      taskActions: template.taskActions,
      reasoningPattern: template.reasoningPattern,
    }
  }
  if (grade === 2) {
    return {
      problemFamily: String(template.learnerGoal).replace(/ 연습$/u, ''),
      solutionRule: template.solverRule,
      contextType: template.parentSummaryTag,
      representationTypes: [template.answerType, template.visualModel],
      taskActions: template.taskActions,
      reasoningPattern: template.cognitiveDomain,
    }
  }
  if (grade === 3) {
    return {
      problemFamily: `${template.skill}:${normalizePromptStructure(template.learnerGoal)}`,
      solutionRule: template.correctAnswer,
      contextType: template.parentSummaryTag,
      representationTypes: [
        template.answerType,
        template.visualModel,
        template.scaffoldConfig?.kind,
      ].filter(Boolean),
      taskActions: template.taskActions,
      reasoningPattern: template.cognitiveDomain,
    }
  }
  return {
    problemFamily: template.problemFamily,
    solutionRule: template.problemFamily,
    contextType: template.learnerGoal,
    representationTypes: [template.answerType, template.representation, template.supportTool],
    taskActions: template.taskActions,
    reasoningPattern: template.cognitiveDomain,
  }
}

function missionRecord(grade, template) {
  const declaredCodes = grade === 1
    ? template.curriculumCodes
    : template.directCurriculumCodes ?? template.curriculumCodes ?? [template.curriculumCode]
  const standards = uniqueSorted(
    (declaredCodes ?? []).map(normalizeStandardCode)
  )
  const semantic = semanticFieldsForMission(grade, template)
  const semester = grade === 1 ? null : template.semester
  const unitId = grade === 1 ? template.islandId : template.unitId
  const availableModes = grade <= 2
    ? [template.mode]
    : ['basic', 'practice']
  const reviewId = `${grade}:mission:${template.id}`
  const paramSchema = template.paramSchema ?? {}
  const generatedVariantCount = grade === 4
    ? 9
    : grade === 3
      ? 1
      : rangeCombinationCount(paramSchema, reviewId)

  return {
    reviewId,
    grade,
    sourceKind: 'mission',
    sourceId: template.id,
    semester,
    unitId,
    conceptId: null,
    published: true,
    origin: 'authored',
    qualityMetadata: { standards },
    curriculumStandards: standards,
    cognitiveDomain: template.cognitiveDomain,
    availableModes,
    generatedVariantCount,
    authoredSourceKey: template.authoredSourceKey ?? template.id,
    ...semantic,
  }
}

function practiceRecord(grade, template, concept, unit) {
  const blueprint = template.blueprint ?? {}
  const standards = uniqueSorted([
    blueprint.primaryStandard,
    ...(blueprint.connectedStandards ?? []),
  ].map(normalizeStandardCode))
  const reviewId = `${grade}:template:${template.id}`
  return {
    reviewId,
    grade,
    sourceKind: 'template',
    sourceId: template.id,
    semester: unit.semester,
    unitId: unit.id,
    conceptId: concept.id,
    published: true,
    origin: 'authored',
    qualityMetadata: { standards },
    curriculumStandards: standards,
    cognitiveDomain: blueprint.cognitiveDomain,
    availableModes: ['basic', 'practice'],
    generatedVariantCount: rangeCombinationCount(template.param_schema, reviewId),
    authoredSourceKey: template.id,
    problemFamily: blueprint.problemFamily ?? template.problem_family,
    solutionRule: template.solver_rule,
    contextType: blueprint.contextType,
    representationTypes: blueprint.representations ?? [],
    taskActions: blueprint.taskActions ?? [],
    reasoningPattern: blueprint.reasoningPattern,
    rawTemplate: template,
  }
}

function loadReleaseSourceRecords(rootDir = ROOT_DIR) {
  const records = []
  for (const grade of [1, 2, 3, 4]) {
    const module = compileTsModule(
      path.join(rootDir, 'src', 'lib', `grade${grade}-problems.ts`),
      `grade${grade}-content-release-source`
    )
    const templates = module[`grade${grade}MissionTemplates`]
    records.push(...templates.map((template) => missionRecord(grade, template)))
  }

  const dataDir = path.join(rootDir, 'public', 'data')
  const units = JSON.parse(fs.readFileSync(path.join(dataDir, 'units.json'), 'utf8'))
  const concepts = JSON.parse(fs.readFileSync(path.join(dataDir, 'concepts.json'), 'utf8'))
  const unitById = new Map(units.map((unit) => [unit.id, unit]))
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]))
  const templateDir = path.join(dataDir, 'templates')
  for (const fileName of fs.readdirSync(templateDir).filter((name) => name.endsWith('.json')).sort()) {
    const templates = JSON.parse(fs.readFileSync(path.join(templateDir, fileName), 'utf8'))
    for (const template of templates) {
      const concept = conceptById.get(template.concept_id)
      const unit = concept ? unitById.get(concept.unit_id) : undefined
      if (!unit || ![5, 6].includes(unit.grade)) continue
      records.push(practiceRecord(unit.grade, template, concept, unit))
    }
  }
  return records.sort((left, right) => stableCompare(left.reviewId, right.reviewId))
}

function exactGrade5Payload(template) {
  const { id: _id, set_id: _setId, ...payload } = template
  return stableJson(payload)
}

function buildContentReleaseReport(records = loadReleaseSourceRecords()) {
  const errors = []
  const grades = []

  for (const grade of [1, 2, 3, 4, 5, 6]) {
    const gradeRecords = records.filter((record) => record.grade === grade)
    if (gradeRecords.length !== EXPECTED_SOURCE_COUNTS[grade]) {
      errors.push({
        code: 'published_source_count',
        grade,
        message: `Grade ${grade} expects ${EXPECTED_SOURCE_COUNTS[grade]} sources, got ${gradeRecords.length}`,
      })
    }
    const signatures = gradeRecords.map((record) => buildCanonicalMathSignature(record))
    if (grade <= 3 && new Set(signatures).size !== gradeRecords.length) {
      errors.push({
        code: 'duplicate_authored_math_signature',
        grade,
        message: `Grade ${grade} has ${gradeRecords.length - new Set(signatures).size} duplicate authored signatures`,
      })
    }

    grades.push({
      grade,
      publishedSourceCount: gradeRecords.length,
      authoredSourceCount: gradeRecords.length,
      canonicalMathSignatureCount: new Set(signatures).size,
      generatedVariantCount: gradeRecords.reduce((sum, record) => sum + record.generatedVariantCount, 0),
      sessionItemCount: SESSION_ITEM_COUNTS[grade],
    })
  }

  const grade5ByConcept = new Map()
  for (const record of records.filter((entry) => entry.grade === 5)) {
    const bucket = grade5ByConcept.get(record.conceptId) ?? []
    bucket.push(record)
    grade5ByConcept.set(record.conceptId, bucket)
  }
  for (const [conceptId, conceptRecords] of [...grade5ByConcept.entries()].sort(([left], [right]) => stableCompare(left, right))) {
    const seen = new Map()
    for (const record of conceptRecords) {
      const signature = exactGrade5Payload(record.rawTemplate)
      const first = seen.get(signature)
      if (first) {
        errors.push({
          code: 'grade5_exact_payload_duplicate',
          conceptId,
          sourceId: record.sourceId,
          conflictingSourceId: first,
          message: `${record.sourceId} duplicates ${first} after removing id and set_id`,
        })
      } else {
        seen.set(signature, record.sourceId)
      }
    }
  }

  const scopeGroups = new Map()
  for (const record of records) {
    const scopeId = record.grade >= 5 ? record.conceptId : record.unitId
    const key = `${record.grade}:${scopeId}`
    const bucket = scopeGroups.get(key) ?? []
    bucket.push(record)
    scopeGroups.set(key, bucket)
  }
  for (const [scopeId, scopeRecords] of [...scopeGroups.entries()].sort(([left], [right]) => stableCompare(left, right))) {
    const reasoningCount = scopeRecords.filter((record) => record.cognitiveDomain === 'reasoning').length
    if (reasoningCount < 2) {
      errors.push({
        code: 'scope_reasoning_minimum',
        scopeId,
        message: `${scopeId} needs at least two reasoning sources, got ${reasoningCount}`,
      })
    }
  }

  return {
    schemaVersion: 1,
    summary: {
      publishedSourceCount: grades.reduce((sum, grade) => sum + grade.publishedSourceCount, 0),
      authoredSourceCount: grades.reduce((sum, grade) => sum + grade.authoredSourceCount, 0),
      canonicalMathSignatureCount: grades.reduce((sum, grade) => sum + grade.canonicalMathSignatureCount, 0),
      generatedVariantCount: grades.reduce((sum, grade) => sum + grade.generatedVariantCount, 0),
      errorCount: errors.length,
    },
    grades,
    errors: errors.sort((left, right) => stableCompare(stableJson(left), stableJson(right))),
  }
}

function validateReleaseCurriculum(ledger, records = loadReleaseSourceRecords()) {
  const publishedSources = records.map((record) => ({
    reviewId: record.reviewId,
    grade: record.grade,
    sourceKind: record.sourceKind,
    published: true,
    qualityMetadata: record.qualityMetadata,
  }))
  const directCoverage = validateDirectCurriculumCoverage({
    allocations: ledger.allocations,
    publishedSources,
  })
  const recordsById = new Map(records.map((record) => [record.reviewId, record]))
  const roleErrors = []

  for (const allocation of ledger.allocations ?? []) {
    const direct = (allocation.directContentRefs ?? [])
      .map((reviewId) => recordsById.get(reviewId))
      .filter(Boolean)
    const wrongScope = direct.filter((record) => record.unitId !== allocation.unitId)
    if (wrongScope.length > 0) {
      roleErrors.push({
        code: 'direct_ref_scope_mismatch',
        standardCode: allocation.standardCode,
        sourceRefs: wrongScope.map((record) => record.reviewId).sort(stableCompare),
      })
    }
    if (!direct.some((record) => (
      record.cognitiveDomain === 'knowing' || record.availableModes.includes('basic')
    ))) {
      roleErrors.push({
        code: 'missing_foundation_direct_ref',
        standardCode: allocation.standardCode,
      })
    }
    if (!direct.some((record) => record.cognitiveDomain === 'applying')) {
      roleErrors.push({
        code: 'missing_applying_direct_ref',
        standardCode: allocation.standardCode,
      })
    }
  }

  return {
    directCoverage,
    roleErrors: roleErrors.sort((left, right) => stableCompare(stableJson(left), stableJson(right))),
    summary: {
      ...directCoverage.summary,
      roleErrorCount: roleErrors.length,
    },
  }
}

module.exports = {
  EXPECTED_SOURCE_COUNTS,
  ROOT_DIR,
  SESSION_ITEM_COUNTS,
  buildContentReleaseReport,
  loadReleaseSourceRecords,
  stableJson,
  validateReleaseCurriculum,
}
