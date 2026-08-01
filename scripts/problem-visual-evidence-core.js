const EVIDENCE_SCHEMA_VERSION = 1
const REQUIRED_STATES = Object.freeze(['pre', 'hint', 'revealed'])
const REQUIRED_VIEWPORTS = Object.freeze({
  mobile: Object.freeze({ width: 390, height: 844 }),
  tablet: Object.freeze({ width: 1024, height: 768 }),
})
const EXPECTED_VISUAL_ITEM_COUNT = 1013
const PASS_NOTE = (
  ' T14 실제 렌더러 브라우저 증거에서 제출 전·힌트·정답 공개 상태와 '
  + '390×844 모바일·1024×768 태블릿을 다시 확인해 위 브라우저 증거 '
  + '차단 사유를 해소함.'
)

function stableCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
}

function stableJson(value) {
  const canonicalize = candidate => {
    if (
      candidate === null
      || typeof candidate === 'string'
      || typeof candidate === 'number'
      || typeof candidate === 'boolean'
    ) return candidate
    if (Array.isArray(candidate)) return candidate.map(canonicalize)
    return Object.fromEntries(
      Object.keys(candidate)
        .sort(stableCompare)
        .map(key => [key, canonicalize(candidate[key])])
    )
  }
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function visualReceiptItems(ledgers) {
  return ledgers.flatMap(ledger => (
    Array.isArray(ledger?.items)
      ? ledger.items.filter(item => item?.evidence?.preAnswer !== null)
      : []
  ))
}

function validateVisualBrowserEvidence(
  report,
  ledgers,
  expectedCount = EXPECTED_VISUAL_ITEM_COUNT
) {
  const errors = []
  if (!isRecord(report)) return ['visual browser evidence must be an object']
  if (report.schemaVersion !== EVIDENCE_SCHEMA_VERSION) {
    errors.push(`visual browser evidence schemaVersion must be ${EVIDENCE_SCHEMA_VERSION}`)
  }
  if (report.catalogVisualItemCount !== expectedCount) {
    errors.push(`visual catalog count must be ${expectedCount}`)
  }
  if (report.reviewedItemCount !== expectedCount) {
    errors.push(`reviewed visual item count must be ${expectedCount}`)
  }
  if (report.storagePreserved !== true) {
    errors.push('visual browser evidence must preserve learner storage')
  }
  if (!Array.isArray(report.browserErrors) || report.browserErrors.length !== 0) {
    errors.push('visual browser evidence must contain zero browser errors')
  }
  if (
    !isRecord(report.viewports)
    || report.viewports.mobile?.width !== REQUIRED_VIEWPORTS.mobile.width
    || report.viewports.mobile?.height !== REQUIRED_VIEWPORTS.mobile.height
    || report.viewports.tablet?.width !== REQUIRED_VIEWPORTS.tablet.width
    || report.viewports.tablet?.height !== REQUIRED_VIEWPORTS.tablet.height
  ) {
    errors.push('visual browser evidence viewports must be mobile 390x844 and tablet 1024x768')
  }
  if (
    !Array.isArray(report.states)
    || JSON.stringify(report.states) !== JSON.stringify(REQUIRED_STATES)
  ) {
    errors.push('visual browser evidence states must be pre, hint, and revealed')
  }
  if (!Array.isArray(report.items)) {
    errors.push('visual browser evidence items must be an array')
    return errors
  }
  if (report.items.length !== expectedCount) {
    errors.push(`visual browser evidence must contain ${expectedCount} items`)
  }
  if (
    !isRecord(report.summary)
    || report.summary.passed !== expectedCount
    || report.summary.failed !== 0
  ) {
    errors.push(`visual browser evidence summary must be ${expectedCount} passed and 0 failed`)
  }

  const evidenceById = new Map()
  for (const item of report.items) {
    const reviewId = typeof item?.reviewId === 'string' ? item.reviewId : '<missing>'
    if (evidenceById.has(reviewId)) {
      errors.push(`duplicate visual evidence reviewId: ${reviewId}`)
      continue
    }
    evidenceById.set(reviewId, item)
    if (item?.passed !== true || !Array.isArray(item?.errors) || item.errors.length !== 0) {
      errors.push(`${reviewId}: visual evidence did not pass`)
    }
    if (typeof item?.contentHash !== 'string' || item.contentHash.length === 0) {
      errors.push(`${reviewId}: visual evidence contentHash is missing`)
    }
    if (!Array.isArray(item?.variants) || item.variants.length === 0) {
      errors.push(`${reviewId}: visual evidence variants are missing`)
      continue
    }
    const variantKeys = new Set()
    for (const variant of item.variants) {
      const variantKey = typeof variant?.key === 'string' ? variant.key : '<missing>'
      if (variantKeys.has(variantKey)) {
        errors.push(`${reviewId}: duplicate visual evidence variant ${variantKey}`)
      }
      variantKeys.add(variantKey)
      for (const viewport of Object.keys(REQUIRED_VIEWPORTS)) {
        for (const state of REQUIRED_STATES) {
          if (variant?.viewports?.[viewport]?.[state] !== true) {
            errors.push(`${reviewId}: ${variantKey}/${viewport}/${state} did not pass`)
          }
        }
      }
    }
  }

  const receipts = visualReceiptItems(ledgers)
  if (receipts.length !== expectedCount) {
    errors.push(`editorial receipts must contain ${expectedCount} visual items`)
  }
  const receiptById = new Map()
  for (const receipt of receipts) {
    if (receiptById.has(receipt.reviewId)) {
      errors.push(`duplicate visual receipt reviewId: ${receipt.reviewId}`)
      continue
    }
    receiptById.set(receipt.reviewId, receipt)
    const evidenceItem = evidenceById.get(receipt.reviewId)
    if (!evidenceItem) {
      errors.push(`missing visual evidence reviewId: ${receipt.reviewId}`)
    } else if (evidenceItem.contentHash !== receipt.contentHash) {
      errors.push(`stale visual evidence contentHash: ${receipt.reviewId}`)
    }
  }
  for (const reviewId of evidenceById.keys()) {
    if (!receiptById.has(reviewId)) {
      errors.push(`unknown visual evidence reviewId: ${reviewId}`)
    }
  }
  return errors
}

function applyVisualBrowserEvidence(
  report,
  ledgers,
  artifactPath,
  expectedCount = EXPECTED_VISUAL_ITEM_COUNT
) {
  const errors = validateVisualBrowserEvidence(report, ledgers, expectedCount)
  if (errors.length > 0) throw new Error(errors.join('\n'))
  const evidenceIds = new Set(report.items.map(item => item.reviewId))

  return ledgers.map(ledger => ({
    ...ledger,
    items: ledger.items.map(item => {
      if (!evidenceIds.has(item.reviewId)) return item
      return {
        ...item,
        status: 'pass',
        note: item.note.endsWith(PASS_NOTE.trim())
          ? item.note
          : `${item.note}${PASS_NOTE}`,
        evidence: {
          ...item.evidence,
          preAnswer: true,
          hint: true,
          revealed: true,
          mobile: true,
          tablet: true,
          artifacts: Array.from(new Set([
            ...item.evidence.artifacts,
            artifactPath,
          ])).sort(stableCompare),
        },
      }
    }),
  }))
}

module.exports = {
  EVIDENCE_SCHEMA_VERSION,
  EXPECTED_VISUAL_ITEM_COUNT,
  PASS_NOTE,
  REQUIRED_STATES,
  REQUIRED_VIEWPORTS,
  applyVisualBrowserEvidence,
  stableJson,
  validateVisualBrowserEvidence,
  visualReceiptItems,
}
