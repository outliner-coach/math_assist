const fs = require('fs')
const path = require('path')

const {
  RENDERER_REVIEW_VERSION_REGISTRY,
  ROOT_DIR,
  buildCatalog,
  catalogBytes,
  loadActualSources,
  loadContractModule,
} = require('./problem-review-catalog-core')

const outputPath = path.join(
  ROOT_DIR,
  'docs',
  'tracking',
  'problem-editorial-review-work',
  'grade6.json',
)

const decisionsPath = path.join(
  ROOT_DIR,
  'docs',
  'tracking',
  'problem-editorial-review-work',
  'grade6-decisions.json',
)

const DECISION_ITEM_KEYS = [
  'reviewId',
  'status',
  'editorialRead',
  'variantAudit',
  'findings',
  'note',
  'evidence',
]
const FINDING_KEYS = ['category', 'resolved', 'note']
const EVIDENCE_KEYS = [
  'preAnswer',
  'hint',
  'revealed',
  'mobile',
  'tablet',
  'artifacts',
]

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function exactKeys(value, expected) {
  if (!isRecord(value)) return false
  const actual = Object.keys(value).sort()
  const normalizedExpected = [...expected].sort()
  return actual.length === normalizedExpected.length
    && actual.every((key, index) => key === normalizedExpected[index])
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function loadDecisions(filePath = decisionsPath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function validateDecision(decision, catalogItem) {
  const reviewId = decision?.reviewId ?? catalogItem.reviewId
  if (decision.status !== 'pass' && decision.status !== 'blocked') {
    throw new Error(`${reviewId}: review decision requires an explicit status; there is no default pass`)
  }
  if (!exactKeys(decision, DECISION_ITEM_KEYS)) {
    throw new Error(`${reviewId}: review decision has missing or unexpected fields`)
  }
  if (decision.editorialRead !== true || decision.variantAudit !== true) {
    throw new Error(`${reviewId}: editorialRead and variantAudit must be explicit true decisions`)
  }
  if (!nonEmptyString(decision.note)) {
    throw new Error(`${reviewId}: review decision note is required`)
  }
  if (!Array.isArray(decision.findings)) {
    throw new Error(`${reviewId}: review decision findings must be an array`)
  }

  const allowedCategories = new Set(
    loadContractModule().EDITORIAL_FINDING_CATEGORIES,
  )
  const openFindings = []
  for (const finding of decision.findings) {
    if (!exactKeys(finding, FINDING_KEYS)) {
      throw new Error(`${reviewId}: finding has missing or unexpected fields`)
    }
    if (!allowedCategories.has(finding.category)) {
      throw new Error(`${reviewId}: unsupported finding category ${finding.category}`)
    }
    if (typeof finding.resolved !== 'boolean' || !nonEmptyString(finding.note)) {
      throw new Error(`${reviewId}: finding requires explicit resolved and note values`)
    }
    if (!finding.resolved) openFindings.push(finding)
  }
  if (openFindings.length > 0 && decision.status !== 'blocked') {
    throw new Error(`${reviewId}: open finding requires explicit blocked status`)
  }

  if (!exactKeys(decision.evidence, EVIDENCE_KEYS)) {
    throw new Error(`${reviewId}: review decision evidence has missing or unexpected fields`)
  }
  const hasVisual = catalogItem.content.visual !== null
  for (const key of ['preAnswer', 'hint', 'revealed', 'mobile', 'tablet']) {
    const value = decision.evidence[key]
    if (!hasVisual && value !== null) {
      throw new Error(`${reviewId}: non-visual evidence.${key} must be null`)
    }
    if (hasVisual && typeof value !== 'boolean') {
      throw new Error(`${reviewId}: visual evidence.${key} must be an explicit boolean`)
    }
    if (hasVisual && decision.status === 'pass' && value !== true) {
      throw new Error(`${reviewId}: visual pass requires evidence.${key}=true`)
    }
  }
  if (!Array.isArray(decision.evidence.artifacts)) {
    throw new Error(`${reviewId}: evidence.artifacts must be an explicit array`)
  }
}

function createReceipt(decisions = loadDecisions()) {
  if (
    !isRecord(decisions)
    || decisions.schemaVersion !== 1
    || !Array.isArray(decisions.items)
  ) {
    throw new Error('Grade 6 review decisions require schemaVersion 1 and an items array')
  }
  const catalog = buildCatalog(
    loadActualSources(ROOT_DIR).filter((source) => source.grade === 6),
    RENDERER_REVIEW_VERSION_REGISTRY,
  )
  const catalogById = new Map(catalog.items.map((item) => [item.reviewId, item]))
  const decisionById = new Map()
  for (const decision of decisions.items) {
    if (!isRecord(decision) || !nonEmptyString(decision.reviewId)) {
      throw new Error('Grade 6 review decision reviewId is required')
    }
    if (!catalogById.has(decision.reviewId)) {
      throw new Error(`unknown explicit review decision: ${decision.reviewId}`)
    }
    if (decisionById.has(decision.reviewId)) {
      throw new Error(`duplicate explicit review decision: ${decision.reviewId}`)
    }
    decisionById.set(decision.reviewId, decision)
  }

  const receipt = {
    schemaVersion: 1,
    items: catalog.items.map((item) => {
      const decision = decisionById.get(item.reviewId)
      if (!decision) {
        throw new Error(`missing explicit review decision: ${item.reviewId}`)
      }
      validateDecision(decision, item)

      return {
        reviewId: item.reviewId,
        contentHash: item.contentHash,
        status: decision.status,
        findingCategories: Array.from(new Set(
          decision.findings.map((finding) => finding.category),
        )),
        note: decision.note,
        evidence: {
          editorialRead: decision.editorialRead,
          variantAudit: decision.variantAudit,
          ...decision.evidence,
        },
      }
    }),
  }

  const expectedBlockedErrors = new Set(
    receipt.items
      .filter((item) => item.status === 'blocked')
      .map((item) => `blocked editorial status: ${item.reviewId}`),
  )
  const unexpectedErrors = loadContractModule()
    .validateEditorialLedger(catalog, receipt)
    .filter((error) => !expectedBlockedErrors.has(error))
  if (unexpectedErrors.length > 0) {
    throw new Error(unexpectedErrors.join('\n'))
  }
  return receipt
}

function serializeReceipt(receipt = createReceipt()) {
  return catalogBytes(receipt)
}

if (require.main === module) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, serializeReceipt())
  console.log(`Wrote Grade 6 editorial receipt to ${outputPath}`)
}

module.exports = {
  createReceipt,
  loadDecisions,
  serializeReceipt,
}
