const fs = require('fs')
const path = require('path')

const {
  applyVisualBrowserEvidence,
  stableJson,
} = require('./problem-visual-evidence-core')

const ROOT_DIR = path.join(__dirname, '..')
const EVIDENCE_ARTIFACT = 'docs/tracking/problem-visual-browser-evidence-v1.json'
const RECEIPT_PATHS = [
  'docs/tracking/problem-editorial-review-work/grade1-3.json',
  'docs/tracking/problem-editorial-review-work/grade4.json',
  'docs/tracking/problem-editorial-review-work/grade5.json',
  'docs/tracking/problem-editorial-review-work/grade6.json',
]

function readJson(relativePath) {
  const filePath = path.join(ROOT_DIR, relativePath)
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`${relativePath} could not be read: ${error.message}`)
  }
}

function main() {
  const report = readJson(EVIDENCE_ARTIFACT)
  const ledgers = RECEIPT_PATHS.map(readJson)
  const updated = applyVisualBrowserEvidence(
    report,
    ledgers,
    EVIDENCE_ARTIFACT
  )

  for (let index = 0; index < RECEIPT_PATHS.length; index += 1) {
    fs.writeFileSync(
      path.join(ROOT_DIR, RECEIPT_PATHS[index]),
      stableJson(updated[index])
    )
  }
  console.log(
    `Applied browser evidence to ${report.items.length} visual editorial receipts`
  )
}

if (require.main === module) {
  try {
    main()
  } catch (error) {
    console.error('Visual browser evidence application failed:')
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

module.exports = {
  EVIDENCE_ARTIFACT,
  RECEIPT_PATHS,
  main,
}
