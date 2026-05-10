const fs = require('fs')
const path = require('path')

const { generateMissionBankQualityReport } = require('./mission-bank-quality-core')

const ROOT_DIR = path.join(__dirname, '..')
const OUTPUT_DIR = path.join(ROOT_DIR, 'out', 'quality')

function renderMarkdown(report) {
  const lines = [
    '# Mission Bank Quality Report',
    '',
    `- Templates: ${report.summary.templateCount}`,
    `- Errors: ${report.summary.errorCount}`,
    `- Warnings: ${report.summary.warningCount}`,
    '',
    '## Grade Summary',
    '',
    '| Grade | Templates | Errors | Warnings |',
    '| --- | ---: | ---: | ---: |',
  ]

  for (const grade of report.gradeReports) {
    lines.push(`| ${grade.grade} | ${grade.templateCount} | ${grade.errors.length} | ${grade.warnings.length} |`)
  }

  if (report.errors.length > 0) {
    lines.push('', '## Errors', '')
    for (const issue of report.errors) {
      lines.push(`- \`${issue.code}\`: ${issue.message}`)
    }
  }

  if (report.warnings.length > 0) {
    lines.push('', '## Warnings', '')
    for (const issue of report.warnings) {
      lines.push(`- \`${issue.code}\`: ${issue.message}`)
    }
  }

  if (report.errors.length === 0 && report.warnings.length === 0) {
    lines.push('', 'No mission-bank quality issues found.')
  }

  return `${lines.join('\n')}\n`
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const report = generateMissionBankQualityReport()
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'mission-bank-quality-report.json'),
    `${JSON.stringify(report, null, 2)}\n`
  )
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'mission-bank-quality-report.md'),
    renderMarkdown(report)
  )

  console.log(`Mission bank quality report written to ${OUTPUT_DIR}`)
  console.log(`Errors: ${report.summary.errorCount}, warnings: ${report.summary.warningCount}`)

  if (report.summary.errorCount > 0 || report.summary.warningCount > 0) {
    process.exit(1)
  }
}

main()
