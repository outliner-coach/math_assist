const {
  generateApplicationProblemQualityReport,
  parseApplicationAuditSelection,
} = require('./application-problem-quality-core')

function main() {
  const selection = parseApplicationAuditSelection(process.argv.slice(2))
  const report = generateApplicationProblemQualityReport(selection)
  for (const error of report.errors) {
    const identity = [
      error.packId,
      error.family,
      Number.isSafeInteger(error.seed) ? `seed=${error.seed}` : undefined,
      error.corpusId,
    ].filter(Boolean).join(' ')
    console.error(`[${error.code}]${identity ? ` ${identity}:` : ''} ${error.message}`)
  }
  console.log(`Application packs: ${report.summary.unitCount} units, ${report.summary.familyCount} families, ${report.summary.errorCount} errors (${selection.mode} mode)`)
  if (report.summary.errorCount > 0) process.exitCode = 1
}

main()
