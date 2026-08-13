const { generateApplicationProblemQualityReport } = require('./application-problem-quality-core')

function main() {
  const report = generateApplicationProblemQualityReport()
  for (const error of report.errors) {
    const identity = [
      error.packId,
      error.family,
      Number.isSafeInteger(error.seed) ? `seed=${error.seed}` : undefined,
      error.corpusId,
    ].filter(Boolean).join(' ')
    console.error(`[${error.code}]${identity ? ` ${identity}:` : ''} ${error.message}`)
  }
  console.log(`Application packs: ${report.summary.familyCount} families, ${report.summary.errorCount} errors`)
  if (report.summary.errorCount > 0) process.exitCode = 1
}

main()
