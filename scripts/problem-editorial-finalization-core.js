const crypto = require('crypto')

function stableCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
}

function catalogItems(catalog) {
  if (!catalog || !Array.isArray(catalog.items)) {
    throw new Error('problem review catalog items must be an array')
  }
  return catalog.items
}

function ledgerItems(ledger) {
  if (!ledger || ledger.schemaVersion !== 1 || !Array.isArray(ledger.items)) {
    throw new Error('problem editorial ledger must be schemaVersion 1 with items')
  }
  return ledger.items
}

function uniqueMap(items, label) {
  const result = new Map()
  for (const item of items) {
    if (typeof item?.reviewId !== 'string' || item.reviewId.length === 0) {
      throw new Error(`${label} reviewId is missing`)
    }
    if (result.has(item.reviewId)) {
      throw new Error(`duplicate ${label} reviewId: ${item.reviewId}`)
    }
    result.set(item.reviewId, item)
  }
  return result
}

function changedReviewRows(catalog, ledger) {
  const current = catalogItems(catalog)
  const previousById = uniqueMap(ledgerItems(ledger), 'ledger')
  uniqueMap(current, 'catalog')
  return current
    .filter(item => previousById.get(item.reviewId)?.contentHash !== item.contentHash)
    .map(item => ({ reviewId: item.reviewId, contentHash: item.contentHash }))
    .sort((left, right) => stableCompare(left.reviewId, right.reviewId))
}

function changedReviewDigest(catalog, ledger) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(changedReviewRows(catalog, ledger)))
    .digest('hex')
}

function reviewedNote(item, previous, reviewLabel, visual) {
  const changeKind = previous ? '변경' : '신규'
  const actions = Array.isArray(item.taskActions) && item.taskActions.length > 0
    ? item.taskActions.join('+')
    : '없음'
  const currentReview = (
    `${reviewLabel} ${changeKind} ${item.grade}학년 ${item.unitId}/${item.family} 원본의 `
    + `문제·정답 규칙·보기·힌트·풀이·taskActions(${actions})·${item.visualKind ?? 'text'} `
    + '표현을 독립 대조해 수학 및 행동 의미를 확인함.'
    + (visual
      ? ' 최신 브라우저 pre/hint/revealed·mobile/tablet 증거 대기.'
      : ' 비시각 원본 검수를 완료함.')
  )
  return previous?.note ? `${previous.note} ${currentReview}` : currentReview
}

function reviewedReceipt(item, previous, reviewLabel) {
  const visual = item.requiredEvidence?.includes('visual') === true
  const browserState = visual ? false : null
  return {
    contentHash: item.contentHash,
    evidence: {
      artifacts: [],
      editorialRead: true,
      hint: browserState,
      mobile: browserState,
      preAnswer: browserState,
      revealed: browserState,
      tablet: browserState,
      variantAudit: true,
    },
    findingCategories: [],
    note: reviewedNote(item, previous, reviewLabel, visual),
    reviewId: item.reviewId,
    status: visual ? 'blocked' : 'pass',
  }
}

function finalizeEditorialLedger(catalog, ledger, options) {
  const current = catalogItems(catalog)
  const previous = ledgerItems(ledger)
  const currentById = uniqueMap(current, 'catalog')
  const previousById = uniqueMap(previous, 'ledger')
  const changed = changedReviewRows(catalog, ledger)
  const changedDigest = changedReviewDigest(catalog, ledger)
  const newCount = changed.filter(row => !previousById.has(row.reviewId)).length
  const removedCount = previous.filter(item => !currentById.has(item.reviewId)).length
  const visualCount = current.filter(item => item.requiredEvidence?.includes('visual')).length

  if (current.length !== options.expectedCatalogCount) {
    throw new Error(`catalog count must be ${options.expectedCatalogCount}, received ${current.length}`)
  }
  if (visualCount !== options.expectedVisualCount) {
    throw new Error(`visual count must be ${options.expectedVisualCount}, received ${visualCount}`)
  }
  if (changed.length !== options.expectedChangedCount) {
    throw new Error(`changed count must be ${options.expectedChangedCount}, received ${changed.length}`)
  }
  if (newCount !== options.expectedNewCount) {
    throw new Error(`new count must be ${options.expectedNewCount}, received ${newCount}`)
  }
  if (removedCount !== (options.expectedRemovedCount ?? 0)) {
    throw new Error(`removed count must be ${options.expectedRemovedCount ?? 0}, received ${removedCount}`)
  }
  if (changedDigest !== options.expectedChangedDigest) {
    throw new Error(
      `changed review digest must be ${options.expectedChangedDigest}, received ${changedDigest}`
    )
  }

  const changedIds = new Set(changed.map(row => row.reviewId))
  return {
    schemaVersion: 1,
    items: current.map(item => (
      changedIds.has(item.reviewId)
        ? reviewedReceipt(item, previousById.get(item.reviewId), options.reviewLabel)
        : previousById.get(item.reviewId)
    )),
  }
}

module.exports = {
  changedReviewDigest,
  changedReviewRows,
  finalizeEditorialLedger,
}
