const { validateTemplates } = require('./problem-quality-core')

const result = validateTemplates()

if (result.errors.length > 0) {
  console.error('Template validation failed:')
  for (const err of result.errors) {
    console.error(' -', err.message)
  }
  process.exit(1)
}

const coverage = result.blueprintCoverage.summary
console.log('Template validation passed.')
console.log(
  `Blueprint metadata: ${coverage.completeCount}/${coverage.templateCount} complete ` +
  `(${coverage.missingCount} missing, ${coverage.invalidCount} invalid).`
)
