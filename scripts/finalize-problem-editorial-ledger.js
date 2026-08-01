const fs = require('fs')
const path = require('path')

const {
  changedReviewDigest,
  finalizeEditorialLedger,
} = require('./problem-editorial-finalization-core')
const { stableJson } = require('./problem-visual-evidence-core')

const ROOT_DIR = path.join(__dirname, '..')
const CATALOG_PATH = path.join(ROOT_DIR, 'out', 'quality', 'problem-review-catalog.json')
const LEDGER_PATH = path.join(ROOT_DIR, 'docs', 'tracking', 'problem-editorial-review-v1.json')
const REVIEW_CONTRACTS = Object.freeze([
  Object.freeze({
    expectedCatalogCount: 1622,
    expectedVisualCount: 1013,
    expectedChangedCount: 284,
    expectedNewCount: 82,
    expectedRemovedCount: 0,
    expectedChangedDigest: '6e3e0fd951efa3c6b6d5d8891c81e58b646faac2ebdf79c80846be8355be8ac0',
    reviewLabel: 'T14',
  }),
  Object.freeze({
    expectedCatalogCount: 1622,
    expectedVisualCount: 1013,
    expectedChangedCount: 155,
    expectedNewCount: 0,
    expectedRemovedCount: 0,
    expectedChangedDigest: 'e99c3fdabd6a75e88c765d6921e721eb1a65b52b6e7a0b821969e3044e370681',
    reviewLabel: 'T14-corrective',
  }),
])

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function isCurrent(catalog, ledger) {
  if (!Array.isArray(catalog?.items) || !Array.isArray(ledger?.items)) return false
  if (catalog.items.length !== REVIEW_CONTRACTS[0].expectedCatalogCount) return false
  if (ledger.items.length !== catalog.items.length) return false
  const ledgerById = new Map(ledger.items.map(item => [item.reviewId, item.contentHash]))
  return catalog.items.every(item => ledgerById.get(item.reviewId) === item.contentHash)
}

function main() {
  const catalog = readJson(CATALOG_PATH)
  const ledger = readJson(LEDGER_PATH)
  if (isCurrent(catalog, ledger)) {
    console.log(`Problem editorial ledger is already current: ${ledger.items.length} items`)
    return
  }
  const digest = changedReviewDigest(catalog, ledger)
  const contract = REVIEW_CONTRACTS.find(candidate => (
    candidate.expectedChangedDigest === digest
  ))
  if (!contract) {
    throw new Error(`changed review digest is not independently approved: ${digest}`)
  }
  const finalized = finalizeEditorialLedger(catalog, ledger, contract)
  fs.writeFileSync(LEDGER_PATH, stableJson(finalized))
  console.log(
    `Finalized independently reviewed editorial ledger: ${finalized.items.length} items; `
    + `${contract.expectedVisualCount} visual receipts await fresh browser evidence`
  )
}

if (require.main === module) {
  try {
    main()
  } catch (error) {
    console.error('Problem editorial ledger finalization failed:')
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

module.exports = {
  CATALOG_PATH,
  LEDGER_PATH,
  REVIEW_CONTRACTS,
  isCurrent,
  main,
}
