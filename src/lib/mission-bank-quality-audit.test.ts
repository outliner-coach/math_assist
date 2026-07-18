import { describe, expect, it } from 'vitest'

import { generateMissionBankQualityReport } from '../../scripts/mission-bank-quality-core.js'

describe('mission bank quality audit', () => {
  it('keeps Grade 1/2 Beta and Grade 3 Alpha banks free of blocking quality issues', () => {
    const report = generateMissionBankQualityReport()

    expect(report.summary.templateCount).toBe(276)
    expect(report.summary.errorCount).toBe(0)
    expect(report.summary.warningCount).toBe(0)
  })
})
