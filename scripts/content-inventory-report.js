const fs = require('fs')
const path = require('path')

const {
  ROOT_DIR,
  buildContentReleaseReport,
  stableJson,
} = require('./content-release-adapter')

function renderMarkdown(report) {
  const lines = [
    '# Grade 1-6 Content Inventory',
    '',
    `- Published sources: ${report.summary.publishedSourceCount}`,
    `- Authored sources: ${report.summary.authoredSourceCount}`,
    `- Canonical math signatures: ${report.summary.canonicalMathSignatureCount}`,
    `- Generated variants: ${report.summary.generatedVariantCount}`,
    `- Errors: ${report.summary.errorCount}`,
    '',
    '| Grade | Published | Authored | Math signatures | Generated variants | Basic | Practice |',
    '| ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]
  for (const grade of report.grades) {
    lines.push(
      `| ${grade.grade} | ${grade.publishedSourceCount} | ${grade.authoredSourceCount} | `
      + `${grade.canonicalMathSignatureCount} | ${grade.generatedVariantCount} | `
      + `${grade.sessionItemCount.basic} | ${grade.sessionItemCount.practice} |`
    )
  }
  if (report.errors.length > 0) {
    lines.push('', '## Errors', '')
    for (const error of report.errors) lines.push(`- \`${error.code}\`: ${error.message}`)
  }
  return `${lines.join('\n')}\n`
}

function main() {
  const report = buildContentReleaseReport()
  const outputDir = path.join(ROOT_DIR, 'out', 'quality')
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(path.join(outputDir, 'content-inventory-v1.json'), stableJson(report))
  fs.writeFileSync(path.join(outputDir, 'content-inventory-v1.md'), renderMarkdown(report))
  console.log(`Content inventory written: ${outputDir}`)
  console.log(`Published: ${report.summary.publishedSourceCount}, errors: ${report.summary.errorCount}`)
  if (report.summary.errorCount > 0) process.exitCode = 1
}

main()
