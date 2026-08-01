const fs = require('fs')
const path = require('path')

const {
  ROOT_DIR,
  loadReleaseSourceRecords,
  validateReleaseCurriculum,
} = require('./content-release-adapter')

const LEDGER_PATH = path.join(ROOT_DIR, 'public', 'data', 'curriculum-allocations-v1.json')
const AUTHORING_PATH = path.join(
  ROOT_DIR,
  'workstreams',
  '_shared',
  'grade1-2-curriculum-allocation-v1.json'
)

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function stableCompare(left, right) {
  return String(left) < String(right) ? -1 : String(left) > String(right) ? 1 : 0
}

function normalizeStandardCode(value) {
  const trimmed = String(value ?? '').trim()
  return trimmed.startsWith('[') ? trimmed : `[${trimmed}]`
}

function releaseGrade12Allocation(allocation) {
  return {
    standardCode: allocation.standardCode,
    officialText: allocation.officialText,
    band: allocation.band,
    assignedGrade: allocation.assignedGrade,
    semester: allocation.semester,
    unitId: allocation.unitId,
    prerequisiteCodes: [],
    sourceUrl: allocation.sourceUrl,
    sourcePageDescriptor: allocation.sourcePageDescriptor,
    reviewStatus: 'released',
    coverageStatus: 'existing-reference',
    existingContentRefs: [`grade${allocation.assignedGrade}:${allocation.unitId}`],
    allocationRationale: allocation.allocationRationale,
    reviewedBy: 'grade1-6-content-structure-release-2026-08-01',
    ...(allocation.otherGradeReviewIntent
      ? { otherGradeReviewIntent: allocation.otherGradeReviewIntent }
      : {}),
  }
}

function withProblemReferences(allocation, records) {
  const standardCode = normalizeStandardCode(allocation.standardCode)
  const matching = records.filter((record) => (
    record.qualityMetadata.standards.includes(standardCode)
  ))
  const directContentRefs = matching
    .filter((record) => record.grade === allocation.assignedGrade && record.unitId === allocation.unitId)
    .map((record) => record.reviewId)
    .sort(stableCompare)
  const reviewContentRefs = matching
    .filter((record) => record.grade !== allocation.assignedGrade)
    .map((record) => record.reviewId)
    .sort(stableCompare)
  return {
    ...allocation,
    directContentRefs,
    reviewContentRefs,
  }
}

function buildFinalCurriculumLedger({ ledger, grade12Authoring, records }) {
  const existingGrade12 = (ledger.allocations ?? []).filter((allocation) => allocation.band === '1-2')
  const grade12Source = existingGrade12.length > 0
    ? existingGrade12
    : grade12Authoring.allocations.map(releaseGrade12Allocation)
  const existingUpperGrades = (ledger.allocations ?? []).filter((allocation) => allocation.band !== '1-2')
  const allocations = [...grade12Source, ...existingUpperGrades]
    .map((allocation) => withProblemReferences(allocation, records))
    .sort((left, right) => stableCompare(left.standardCode, right.standardCode))

  return {
    schemaVersion: ledger.schemaVersion,
    curriculumNotice: ledger.curriculumNotice,
    reviewedAt: '2026-08-01',
    releaseState: {
      grade1: 'released',
      grade2: 'released',
      grade3: 'released',
      grade4: 'released',
      grade5: 'released',
      grade6: 'released',
    },
    allocations,
  }
}

function main() {
  const ledger = readJson(LEDGER_PATH)
  const grade12Authoring = fs.existsSync(AUTHORING_PATH)
    ? readJson(AUTHORING_PATH)
    : { allocations: ledger.allocations.filter((allocation) => allocation.band === '1-2') }
  const records = loadReleaseSourceRecords(ROOT_DIR)
  const finalized = buildFinalCurriculumLedger({ ledger, grade12Authoring, records })
  const validation = validateReleaseCurriculum(finalized, records)
  const errors = [...validation.directCoverage.errors, ...validation.roleErrors]
  if (errors.length > 0) {
    throw new Error(errors.map((error) => JSON.stringify(error)).join('\n'))
  }
  fs.writeFileSync(LEDGER_PATH, `${JSON.stringify(finalized, null, 2)}\n`)
  console.log(
    `Curriculum direct links finalized: ${finalized.allocations.length} standards, `
    + `${validation.summary.directContentLinkCount} direct links, `
    + `${validation.summary.reviewContentLinkCount} review links.`
  )
}

if (require.main === module) {
  try {
    main()
  } catch (error) {
    console.error('Curriculum direct-link finalization failed:')
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

module.exports = {
  buildFinalCurriculumLedger,
  main,
}
