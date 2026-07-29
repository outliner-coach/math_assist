const fs = require('fs')
const path = require('path')

const {
  ROOT_DIR,
  RENDERER_REVIEW_VERSION_REGISTRY,
  buildCatalog,
  catalogBytes,
  loadActualSources,
  readSourceFixture,
} = require('./problem-review-catalog-core')

function readOption(args, option) {
  const index = args.indexOf(option)
  if (index === -1) return undefined
  const value = args[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`${option} requires a path`)
  return path.resolve(value)
}

function main(args = process.argv.slice(2)) {
  const sourceFixturePath = readOption(args, '--sources')
  const outputPath = readOption(args, '--output')
    ?? path.join(ROOT_DIR, 'out', 'quality', 'problem-review-catalog.json')
  const fixture = sourceFixturePath ? readSourceFixture(sourceFixturePath) : null
  const sources = fixture?.sources ?? loadActualSources(ROOT_DIR)
  const rendererReviewVersions =
    fixture?.rendererReviewVersions ?? RENDERER_REVIEW_VERSION_REGISTRY
  const catalog = buildCatalog(sources, rendererReviewVersions)

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, catalogBytes(catalog))
  console.log(`Problem review catalog written: ${outputPath} (${catalog.items.length} items)`)
}

try {
  main()
} catch (error) {
  console.error('Problem review catalog generation failed:')
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}

module.exports = { main }
