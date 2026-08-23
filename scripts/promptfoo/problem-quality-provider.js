const {
  analyzeRenderedPromptQuality,
  buildParamSamples,
  calculateDifficultySignal,
  evaluateTemplate,
  extractNumericMagnitude,
  loadConceptMap,
  loadProblemGenerator,
  loadTemplateCatalog,
  stableParamsKey,
  validateTemplates
} = require('../problem-quality-core')
const {
  generateApplicationProblemReviewQualityReport,
  loadCanonicalApplicationUnitIdentities,
} = require('../application-problem-quality-report')

const catalog = loadTemplateCatalog()
const conceptMap = loadConceptMap()
const catalogByFile = new Map(catalog.map(entry => [entry.file, entry.templates]))
const templatesByConcept = catalog.flatMap(entry =>
  entry.templates.map(template => ({ ...template, __file: entry.file }))
).reduce((acc, template) => {
  acc[template.concept_id] = acc[template.concept_id] || []
  acc[template.concept_id].push(template)
  return acc
}, {})
const { generateProblems } = loadProblemGenerator()

function toNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function findTemplate(file, templateId) {
  const templates = catalogByFile.get(file) || []
  const template = templates.find(entry => entry.id === templateId)
  if (!template) {
    throw new Error(`Unknown template: ${file} ${templateId}`)
  }
  return template
}

function summarizeIssues(issues) {
  return issues.reduce((acc, issue) => {
    acc[issue.code] = (acc[issue.code] || 0) + 1
    return acc
  }, {})
}

function summarizeApplicationReviewCoverage(report) {
  const unitReports = Array.isArray(report?.unitReports) ? report.unitReports : []
  const issues = []
  const identities = new Set()
  const canonicalIdentities = new Set(loadCanonicalApplicationUnitIdentities())
  const supportedStatuses = new Set([
    'pending',
    'partial',
    'baseline-pilot',
    'candidate',
    'released',
  ])

  for (const unit of unitReports) {
    const identity = `${unit?.grade}:${unit?.unitId}`
    if (!Number.isSafeInteger(unit?.grade) || typeof unit?.unitId !== 'string' || unit.unitId === '') {
      issues.push({ code: 'application_review_unit_identity', message: `invalid unit identity ${identity}` })
      continue
    }
    if (identities.has(identity)) {
      issues.push({ code: 'application_review_duplicate_unit', message: `duplicate unit ${identity}` })
    }
    identities.add(identity)
    if (!canonicalIdentities.has(identity)) {
      issues.push({ code: 'application_review_unit_identity', message: `${identity} is not in the canonical inventory` })
    }
    if (!supportedStatuses.has(unit.rolloutStatus)) {
      issues.push({ code: 'application_review_rollout_status', message: `${identity} has unsupported status ${unit.rolloutStatus}` })
    }
  }
  for (const identity of canonicalIdentities) {
    if (!identities.has(identity)) {
      issues.push({ code: 'application_review_unit_identity', message: `canonical unit ${identity} is missing` })
    }
  }
  if (
    unitReports.length !== 62 ||
    (report?.summary?.unitCount !== undefined && report.summary.unitCount !== 62)
  ) {
    issues.push({
      code: 'application_review_unit_count',
      message: `review coverage requires the canonical 62 units, got ${unitReports.length}`,
    })
  }
  if ((report?.summary?.errorCount ?? 0) > 0) {
    issues.push(...(report.errors ?? []).map(error => ({
      code: error.code ?? 'application_review_source_audit',
      message: error.message ?? String(error),
    })))
  }
  const reviewedFamilies = Array.isArray(report?.reviewedFamilies) ? report.reviewedFamilies : []
  const familyEvidence = Array.isArray(report?.familyEvidence) ? report.familyEvidence : []
  const evidenceByKey = new Map()
  for (const evidence of familyEvidence) {
    if (evidenceByKey.has(evidence?.key)) {
      issues.push({
        code: 'application_review_duplicate_family_evidence',
        message: `duplicate family evidence ${evidence?.key}`,
      })
    }
    evidenceByKey.set(evidence?.key, evidence)
  }
  const reviewedKeys = new Set()
  for (const reviewed of reviewedFamilies) {
    if (reviewedKeys.has(reviewed?.key)) {
      issues.push({
        code: 'application_review_duplicate_family',
        message: `duplicate reviewed family ${reviewed?.key}`,
      })
      continue
    }
    reviewedKeys.add(reviewed?.key)
    const evidence = evidenceByKey.get(reviewed?.key)
    if (!evidence) {
      issues.push({
        code: 'application_review_family_evidence',
        message: `${reviewed?.key} (${reviewed?.source}) has no family evidence`,
      })
      continue
    }
    if (evidence.source !== reviewed.source || evidence.status !== 'passed') {
      issues.push({
        code: 'application_review_family_evidence',
        message: `${reviewed.key} family evidence is ${evidence.status ?? 'missing'} or has the wrong source`,
      })
    }
    for (const kind of ['representative', 'boundary']) {
      const reviewCase = Array.isArray(evidence.cases)
        ? evidence.cases.find((candidate) => candidate?.kind === kind)
        : undefined
      const code = `application_review_family_${kind}_evidence`
      if (!reviewCase) {
        issues.push({ code, message: `${reviewed.key} has no ${kind} evidence` })
        continue
      }
      const requiredStatuses = [
        ['status', reviewCase.status],
        ['oracle', reviewCase.oracleStatus],
        ['visual', reviewCase.visualStatus],
        ['disclosure', reviewCase.disclosureStatus],
        ['proof', reviewCase.proofStatus],
      ]
      const failed = requiredStatuses.filter(([, status]) => status !== 'passed')
      if (failed.length > 0) {
        issues.push({
          code,
          message: `${reviewed.key} ${kind} evidence failed: ${failed.map(([name, status]) => `${name}=${status ?? 'missing'}`).join(', ')}`,
        })
      }
    }
    if (
      evidence.proof?.proven !== true ||
      !Number.isSafeInteger(evidence.proof?.checkedCount) ||
      evidence.proof.checkedCount < 1
    ) {
      issues.push({
        code: 'application_review_family_proof_evidence',
        message: `${reviewed.key} has no passing family proof evidence`,
      })
    }
  }
  const byGrade = Object.fromEntries(
    [...new Set(unitReports.map(unit => unit.grade))]
      .sort((left, right) => left - right)
      .map(grade => [grade, unitReports.filter(unit => unit.grade === grade).length])
  )

  return {
    auditType: 'application_review_coverage',
    issueCount: issues.length,
    issues,
    unitCount: unitReports.length,
    byGrade,
    statusCounts: unitReports.reduce((counts, unit) => {
      counts[unit.rolloutStatus] = (counts[unit.rolloutStatus] || 0) + 1
      return counts
    }, {}),
  }
}

function evaluateTemplateClarity(file, templateId, sampleCount) {
  const template = findTemplate(file, templateId)
  const paramsList = buildParamSamples(template.param_schema, sampleCount, template.id.length * 211)
  const issues = []
  const promptSamples = []

  for (const params of paramsList) {
    const prompt = evaluateTemplate(template.prompt_template, params)
    promptSamples.push({ params, prompt })

    for (const warning of analyzeRenderedPromptQuality(template, prompt)) {
      issues.push({
        code: warning.code,
        message: warning.message,
        params,
        prompt
      })
    }
  }

  return {
    auditType: 'template_clarity',
    file,
    templateId,
    conceptId: template.concept_id,
    sampleCount: paramsList.length,
    issueCount: issues.length,
    issueCodes: summarizeIssues(issues),
    examples: issues.slice(0, 5),
    promptSamples: promptSamples.slice(0, 3)
  }
}

function evaluateSessionQuality(conceptId, setId, seed) {
  const templates = templatesByConcept[conceptId] || []
  const issues = []

  try {
    const problems = generateProblems(templates, { count: 10, setId, seed })
    const promptSet = new Set()
    const keySet = new Set()
    const difficultyCounts = { 1: 0, 2: 0, 3: 0 }
    const templateIndex = Object.fromEntries(templates.map(template => [template.id, template]))

    for (const problem of problems) {
      promptSet.add(problem.prompt)
      keySet.add(`${problem.templateId}:${stableParamsKey(problem.params)}`)
      const difficulty = templateIndex[problem.templateId]?.difficulty
      if (difficulty) {
        difficultyCounts[difficulty] += 1
      }
    }

    if (promptSet.size !== problems.length) {
      issues.push({
        code: 'duplicate_prompt_in_session',
        message: `${conceptId} ${setId} seed ${seed}: rendered prompt text repeats in one session`
      })
    }

    if (keySet.size !== problems.length) {
      issues.push({
        code: 'duplicate_problem_in_session',
        message: `${conceptId} ${setId} seed ${seed}: same template+params repeated in one session`
      })
    }

    if (difficultyCounts[1] !== 4 || difficultyCounts[2] !== 4 || difficultyCounts[3] !== 2) {
      issues.push({
        code: 'session_difficulty_mix',
        message: `${conceptId} ${setId} seed ${seed}: expected 4/4/2, got ${difficultyCounts[1]}/${difficultyCounts[2]}/${difficultyCounts[3]}`
      })
    }

    return {
      auditType: 'session_quality',
      conceptId,
      conceptTitle: conceptMap[conceptId]?.concept_title || conceptId,
      setId,
      seed,
      issueCount: issues.length,
      issues,
      problemCount: problems.length,
      prompts: problems.map(problem => problem.prompt)
    }
  } catch (error) {
    return {
      auditType: 'session_quality',
      conceptId,
      conceptTitle: conceptMap[conceptId]?.concept_title || conceptId,
      setId,
      seed,
      issueCount: 1,
      issues: [{
        code: 'session_generation_failed',
        message: error.message
      }],
      problemCount: 0,
      prompts: []
    }
  }
}

function evaluateDifficultyProgression(conceptId, sampleCount) {
  const templates = templatesByConcept[conceptId] || []
  const signalBuckets = { 1: [], 2: [], 3: [] }

  for (const template of templates) {
    const answerSamples = buildParamSamples(
      template.param_schema,
      sampleCount,
      template.id.length * 211
    ).map(params => ({
      answer: evaluateTemplate(`{{${template.solver_rule}}}`, params),
      answerMagnitude: extractNumericMagnitude(
        evaluateTemplate(`{{${template.solver_rule}}}`, params)
      )
    }))

    signalBuckets[template.difficulty].push({
      templateId: template.id,
      signal: calculateDifficultySignal(template, answerSamples)
    })
  }

  const averages = {
    1: signalBuckets[1].reduce((sum, entry) => sum + entry.signal, 0) / signalBuckets[1].length,
    2: signalBuckets[2].reduce((sum, entry) => sum + entry.signal, 0) / signalBuckets[2].length,
    3: signalBuckets[3].reduce((sum, entry) => sum + entry.signal, 0) / signalBuckets[3].length
  }
  const issues = []

  if (averages[1] >= averages[2]) {
    issues.push({
      code: 'difficulty_order_1_2',
      message: `difficulty 1 average (${averages[1].toFixed(2)}) should be below difficulty 2 (${averages[2].toFixed(2)})`
    })
  }

  if (averages[2] >= averages[3]) {
    issues.push({
      code: 'difficulty_order_2_3',
      message: `difficulty 2 average (${averages[2].toFixed(2)}) should be below difficulty 3 (${averages[3].toFixed(2)})`
    })
  }

  return {
    auditType: 'difficulty_progression',
    conceptId,
    conceptTitle: conceptMap[conceptId]?.concept_title || conceptId,
    issueCount: issues.length,
    issues,
    averages: {
      1: Number(averages[1].toFixed(2)),
      2: Number(averages[2].toFixed(2)),
      3: Number(averages[3].toFixed(2))
    }
  }
}

class ProblemQualityProvider {
  constructor(options = {}) {
    this.providerId = options.id || 'math-assist-problem-quality'
  }

  id() {
    return this.providerId
  }

  async callApi(_prompt, context) {
    const vars = context?.vars || {}
    const auditType = vars.auditType

    switch (auditType) {
      case 'template_validation':
        return {
          output: {
            auditType,
            ...validateTemplates({ sampleCount: toNumber(vars.sampleCount, 16) })
          }
        }
      case 'template_clarity':
        return {
          output: evaluateTemplateClarity(
            vars.file,
            vars.templateId,
            toNumber(vars.sampleCount, 16)
          )
        }
      case 'session_quality':
        return {
          output: evaluateSessionQuality(
            vars.conceptId,
            vars.setId,
            toNumber(vars.seed, 11)
          )
        }
      case 'difficulty_progression':
        return {
          output: evaluateDifficultyProgression(
            vars.conceptId,
            toNumber(vars.sampleCount, 16)
          )
        }
      case 'application_metadata': {
        const report = generateApplicationProblemReviewQualityReport({ mode: 'work' })
        return {
          output: {
            auditType,
            issueCount: report.summary.errorCount,
            issues: report.errors,
            summary: report.summary,
            packReports: report.packReports,
          }
        }
      }
      case 'application_review_coverage': {
        return {
          output: summarizeApplicationReviewCoverage(
            generateApplicationProblemReviewQualityReport({ mode: 'work' })
          )
        }
      }
      default:
        throw new Error(`Unsupported audit type: ${auditType}`)
    }
  }
}

module.exports = ProblemQualityProvider
module.exports.summarizeApplicationReviewCoverage = summarizeApplicationReviewCoverage
