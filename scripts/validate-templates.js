const { validateTemplates } = require('./problem-quality-core')

const result = validateTemplates()

if (result.errors.length > 0) {
  console.error('Template validation failed:')
  for (const err of result.errors) {
    console.error(' -', err.message)
  }
  process.exit(1)
}

console.log('Template validation passed.')
