const fs = require('fs')
const path = require('path')
const { generateApplicationProblemQualityReport } = require('./application-problem-quality-core')

const ROOT_DIR = path.join(__dirname, '..')

function renderMarkdown(report) {
  const lines = [
    '# Application Problem Quality Report',
    '',
    `- knowledge packs: ${report.summary.packCount}`,
    `- families: ${report.summary.familyCount}`,
    `- draft families: ${report.summary.draftFamilyCount}`,
    `- approved families: ${report.summary.approvedFamilyCount}`,
    `- errors: ${report.summary.errorCount}`,
    '',
    '## Pack comparison',
    '',
    '| Pack | Standards | Concepts | Cognitive domains | Reasoning patterns | Representations | Misconceptions | Release | Approval |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const pack of report.packReports) {
    lines.push(`| ${pack.packId} | ${pack.standardCodes.join(', ')} | ${pack.conceptIds.join(', ')} | ${pack.cognitiveDomains.join(', ')} | ${pack.reasoningPatterns.join(', ')} | ${pack.representations.join(', ')} | ${pack.misconceptionRefs.join(', ')} | ${pack.releaseStatus} | ${pack.approvalStatus} |`)
  }
  lines.push('', '## Errors', '')
  if (report.errors.length === 0) lines.push('- none')
  for (const error of report.errors) {
    const context = [error.packId, error.family, error.seed === undefined ? undefined : `seed=${error.seed}`, error.corpusId].filter(Boolean).join(' ')
    lines.push(`- [${error.code}]${context ? ` ${context}:` : ''} ${error.message}`)
  }
  return `${lines.join('\n')}\n`
}

function main() {
  const outputDir = path.join(ROOT_DIR, 'out', 'quality')
  const report = generateApplicationProblemQualityReport()
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(path.join(outputDir, 'application-problem-quality-report.json'), `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(path.join(outputDir, 'application-problem-quality-report.md'), renderMarkdown(report))
  console.log(`Application problem quality report written to ${outputDir}`)
  console.log(`Errors: ${report.summary.errorCount}`)
  if (report.summary.errorCount > 0) process.exitCode = 1
}

main()

module.exports = { renderMarkdown }
