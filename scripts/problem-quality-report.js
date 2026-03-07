const fs = require('fs')
const path = require('path')
const { generateProblemQualityReport } = require('./problem-quality-core')

function parseArgs(argv) {
  const args = {
    strictWarnings: false,
    outputDir: path.join(__dirname, '..', 'out', 'quality'),
    format: 'both'
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--strict-warnings') {
      args.strictWarnings = true
    } else if (arg === '--json') {
      args.format = 'json'
    } else if (arg === '--markdown') {
      args.format = 'markdown'
    } else if (arg === '--output-dir') {
      args.outputDir = path.resolve(argv[index + 1])
      index += 1
    }
  }

  return args
}

function renderMarkdown(report) {
  const lines = [
    '# Problem Quality Report',
    '',
    `- template files: ${report.summary.templateFiles}`,
    `- templates: ${report.summary.templateCount}`,
    `- concepts: ${report.summary.conceptCount}`,
    `- samples per template: ${report.summary.sampleCountPerTemplate}`,
    `- session seeds: ${report.summary.sessionSeeds.join(', ')}`,
    `- errors: ${report.summary.errorCount}`,
    `- warnings: ${report.summary.warningCount}`,
    '',
    '## Concept Difficulty Summary',
    '',
    '| Concept | Templates | Avg Signal (1/2/3) | Avg Magnitude (1/2/3) |',
    '| --- | ---: | --- | --- |'
  ]

  for (const summary of report.conceptSummaries) {
    lines.push(
      `| ${summary.title} (\`${summary.conceptId}\`) | ${summary.templateCount} | ${summary.avgSignals[1]} / ${summary.avgSignals[2]} / ${summary.avgSignals[3]} | ${summary.avgMagnitudes[1]} / ${summary.avgMagnitudes[2]} / ${summary.avgMagnitudes[3]} |`
    )
  }

  lines.push('', '## Errors', '')
  if (report.errors.length === 0) {
    lines.push('- none')
  } else {
    for (const issue of report.errors) {
      lines.push(`- [${issue.code}] ${issue.message}`)
    }
  }

  lines.push('', '## Warnings', '')
  if (report.warnings.length === 0) {
    lines.push('- none')
  } else {
    for (const issue of report.warnings.slice(0, 100)) {
      lines.push(`- [${issue.code}] ${issue.message}`)
    }
    if (report.warnings.length > 100) {
      lines.push(`- ... ${report.warnings.length - 100} more warnings in JSON report`)
    }
  }

  return lines.join('\n')
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const report = generateProblemQualityReport()

  fs.mkdirSync(args.outputDir, { recursive: true })

  const jsonPath = path.join(args.outputDir, 'problem-quality-report.json')
  const markdownPath = path.join(args.outputDir, 'problem-quality-report.md')

  if (args.format === 'json' || args.format === 'both') {
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2))
  }

  if (args.format === 'markdown' || args.format === 'both') {
    fs.writeFileSync(markdownPath, renderMarkdown(report))
  }

  console.log(`Problem quality report written to ${args.outputDir}`)
  console.log(`Errors: ${report.summary.errorCount}, warnings: ${report.summary.warningCount}`)

  if (report.errors.length > 0 || (args.strictWarnings && report.warnings.length > 0)) {
    process.exit(1)
  }
}

main()
