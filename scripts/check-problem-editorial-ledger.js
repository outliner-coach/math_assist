const fs = require('fs')
const path = require('path')

const {
  ROOT_DIR,
  loadContractModule,
} = require('./problem-review-catalog-core')

function readOption(args, option) {
  const index = args.indexOf(option)
  if (index === -1) return undefined
  const value = args[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`${option} requires a path`)
  return path.resolve(value)
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`${label} could not be read at ${filePath}: ${error.message}`)
  }
}

function main(args = process.argv.slice(2)) {
  const catalogPath = readOption(args, '--catalog')
    ?? path.join(ROOT_DIR, 'out', 'quality', 'problem-review-catalog.json')
  const ledgerPath = readOption(args, '--ledger')
    ?? path.join(ROOT_DIR, 'docs', 'tracking', 'problem-editorial-review-v1.json')
  const catalog = readJson(catalogPath, 'Problem review catalog')
  const ledger = readJson(ledgerPath, 'Editorial ledger')
  const errors = loadContractModule().validateEditorialLedger(catalog, ledger)
  if (errors.length > 0) {
    throw new Error(errors.join('\n'))
  }
  console.log(`Editorial ledger passed: ${ledgerPath} (${catalog.items.length} items)`)
}

try {
  main()
} catch (error) {
  console.error('Editorial ledger validation failed:')
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}

module.exports = { main }
