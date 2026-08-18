const fs = require('fs')
const path = require('path')
const {
  generateApplicationProblemQualityReport,
  parseApplicationAuditSelection,
} = require('./application-problem-quality-core')

const ROOT_DIR = path.join(__dirname, '..')

function loadTypeScriptModule(relativePath) {
  const ts = require('typescript')
  const previous = require.extensions['.ts']
  require.extensions['.ts'] = (loadedModule, filename) => {
    const source = fs.readFileSync(filename, 'utf8')
    loadedModule._compile(ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText, filename)
  }
  try {
    return require(path.join(ROOT_DIR, relativePath))
  } finally {
    if (previous) require.extensions['.ts'] = previous
    else delete require.extensions['.ts']
  }
}

function loadCanonicalApplicationUnitIdentities() {
  const { APPLICATION_UNIT_INVENTORY_V1 } = loadTypeScriptModule(
    'src/lib/application-problems/authoring-catalog.ts',
  )
  return APPLICATION_UNIT_INVENTORY_V1.map((unit) => `${unit.grade}:${unit.unitId}`)
}

function generateApplicationProblemReviewQualityReport(selection = { mode: 'work' }) {
  const report = generateApplicationProblemQualityReport(selection)
  const { getApplicationProblemReviewData } = loadTypeScriptModule('src/lib/problem-review.ts')
  const review = getApplicationProblemReviewData()
  return {
    ...report,
    reviewedFamilies: review.reviewedFamilies,
    familyEvidence: review.familyEvidence,
    canonicalUnitIdentities: review.units.map((unit) => `${unit.grade}:${unit.unitId}`),
  }
}

function renderMarkdown(report) {
  const lines = [
    '# Application Problem Quality Report',
    '',
    `- knowledge packs: ${report.summary.packCount}`,
    `- families: ${report.summary.familyCount}`,
    `- draft families: ${report.summary.draftFamilyCount}`,
    `- approved families: ${report.summary.approvedFamilyCount}`,
    `- errors: ${report.summary.errorCount}`,
    '',
    '## Pack comparison',
    '',
    '| Pack | Standards | Concepts | Cognitive domains | Reasoning patterns | Representations | Misconceptions | Release | Approval |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const pack of report.packReports) {
    lines.push(`| ${pack.packId} | ${pack.standardCodes.join(', ')} | ${pack.conceptIds.join(', ')} | ${pack.cognitiveDomains.join(', ')} | ${pack.reasoningPatterns.join(', ')} | ${pack.representations.join(', ')} | ${pack.misconceptionRefs.join(', ')} | ${pack.releaseStatus} | ${pack.approvalStatus} |`)
  }
  const unitReports = Array.isArray(report.unitReports) ? report.unitReports : []
  lines.push(
    '',
    `## Unit rollout (${unitReports.length})`,
    '',
    '| Grade | Unit | Status | Candidate complete | Production complete | Pack refs |',
    '| --- | --- | --- | --- | --- | --- |',
  )
  for (const unit of unitReports) {
    lines.push(`| ${unit.grade} | ${unit.unitId} | ${unit.rolloutStatus} | ${unit.candidateComplete ? 'yes' : 'no'} | ${unit.productionComplete ? 'yes' : 'no'} | ${(unit.packRefs ?? []).join(', ')} |`)
  }
  const familyEvidence = Array.isArray(report.familyEvidence) ? report.familyEvidence : []
  const evidenceByKey = new Map(familyEvidence.map((evidence) => [evidence.key, evidence]))
  const reviewedFamilies = Array.isArray(report.reviewedFamilies)
    ? report.reviewedFamilies
    : familyEvidence.map((evidence) => ({ key: evidence.key, source: evidence.source ?? 'production' }))
  lines.push(
    '',
    '## Family verification evidence',
    '',
    '| Family | Source | Status | Representative | Boundary | Oracle | Visual | Disclosure | Proof | Issues |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  )
  if (reviewedFamilies.length === 0) lines.push('| none | n/a | missing | missing | missing | missing | missing | missing | missing | no reviewed families |')
  for (const reviewed of reviewedFamilies) {
    const evidence = evidenceByKey.get(reviewed.key)
    const representative = evidence?.cases?.find((reviewCase) => reviewCase.kind === 'representative')
    const boundary = evidence?.cases?.find((reviewCase) => reviewCase.kind === 'boundary')
    const caseStatuses = [representative, boundary]
    const statusSummary = (property) => caseStatuses.every((reviewCase) => reviewCase?.[property] === 'passed')
      ? 'passed'
      : caseStatuses.some((reviewCase) => reviewCase?.[property] === 'blocked')
        ? 'blocked'
        : caseStatuses.some((reviewCase) => reviewCase?.[property] === 'failed')
          ? 'failed'
          : 'missing'
    const evidenceIssues = evidence ? (evidence.issues ?? []) : ['missing family evidence']
    lines.push(`| ${reviewed.key} | ${reviewed.source} | ${evidence?.status ?? 'missing'} | representative: ${representative?.status ?? 'missing'} | boundary: ${boundary?.status ?? 'missing'} | ${statusSummary('oracleStatus')} | ${statusSummary('visualStatus')} | ${statusSummary('disclosureStatus')} | ${statusSummary('proofStatus')} | ${evidenceIssues.join('; ')} |`)
  }
  lines.push('', '## Errors', '')
  if (report.errors.length === 0) lines.push('- none')
  for (const error of report.errors) {
    const context = [error.packId, error.family, error.seed === undefined ? undefined : `seed=${error.seed}`, error.corpusId].filter(Boolean).join(' ')
    lines.push(`- [${error.code}]${context ? ` ${context}:` : ''} ${error.message}`)
  }
  return `${lines.join('\n')}\n`
}

function main() {
  const outputDir = path.join(ROOT_DIR, 'out', 'quality')
  const selection = parseApplicationAuditSelection(process.argv.slice(2))
  const report = generateApplicationProblemReviewQualityReport(selection)
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(path.join(outputDir, 'application-problem-quality-report.json'), `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(path.join(outputDir, 'application-problem-quality-report.md'), renderMarkdown(report))
  console.log(`Application problem quality report written to ${outputDir}`)
  console.log(`Errors: ${report.summary.errorCount} (${selection.mode} mode)`)
  if (report.summary.errorCount > 0) process.exitCode = 1
}

if (require.main === module) main()

module.exports = {
  generateApplicationProblemReviewQualityReport,
  loadCanonicalApplicationUnitIdentities,
  main,
  renderMarkdown,
}
