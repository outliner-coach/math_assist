import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterAll, describe, expect, it } from 'vitest'

import type { ProblemReviewSource } from './problem-review-catalog'

const fixtureDir = mkdtempSync(path.join(tmpdir(), 'problem-review-catalog-test-'))
const generateScript = path.join(process.cwd(), 'scripts', 'generate-problem-review-catalog.js')
const ledgerScript = path.join(process.cwd(), 'scripts', 'check-problem-editorial-ledger.js')

afterAll(() => {
  rmSync(fixtureDir, { recursive: true, force: true })
})

function sourceForGrade(grade: 1 | 2 | 3 | 4 | 5 | 6): ProblemReviewSource {
  return {
    grade,
    sourceKind: grade <= 4 ? 'mission' : 'template',
    sourceId: `fixture-${grade}`,
    semester: grade === 1 ? null : `${grade}-2`,
    unitId: grade === 1 ? 'fixture-island' : `fixture-unit-${grade}`,
    conceptId: grade >= 5 ? `fixture-concept-${grade}` : null,
    family: `fixture-family-${grade}`,
    curriculumCodes: [`[${grade}수01-01]`],
    answerKind: 'number',
    taskActions: ['calculate'],
    requiredEvidence: ['text'],
    visualKind: null,
    visualSemantics: 'none',
    rendererReviewKey: 'none',
    isPublic: true,
    content: {
      prompt: `Fixture prompt ${grade}`,
      choices: [],
      answerRule: { solver: 'grade' },
      hints: ['Fixture hint'],
      solution: ['Fixture solution'],
      scaffold: null,
      tool: null,
      visual: null,
    },
  }
}

function writeSources(name: string, sources: ProblemReviewSource[]) {
  const sourcePath = path.join(fixtureDir, name)
  writeFileSync(sourcePath, JSON.stringify({
    rendererReviewVersions: { none: '1' },
    sources,
  }))
  return sourcePath
}

describe('problem review catalog scripts', () => {
  it('writes a byte-identical catalog twice from a complete Grade 1-6 fixture', () => {
    const sourcesPath = writeSources(
      'complete-sources.json',
      ([1, 2, 3, 4, 5, 6] as const).map(sourceForGrade)
    )
    const firstOutput = path.join(fixtureDir, 'catalog-1.json')
    const secondOutput = path.join(fixtureDir, 'catalog-2.json')

    execFileSync(process.execPath, [
      generateScript,
      '--sources',
      sourcesPath,
      '--output',
      firstOutput,
    ])
    execFileSync(process.execPath, [
      generateScript,
      '--sources',
      sourcesPath,
      '--output',
      secondOutput,
    ])

    expect(readFileSync(firstOutput)).toEqual(readFileSync(secondOutput))
  })

  it('exits nonzero with the review ID and missing explicit metadata field', () => {
    const source = sourceForGrade(2)
    const sourcesPath = writeSources('missing-metadata.json', [
      { ...source, taskActions: [] },
    ])
    const outputPath = path.join(fixtureDir, 'should-not-exist.json')
    const result = spawnSync(process.execPath, [
      generateScript,
      '--sources',
      sourcesPath,
      '--output',
      outputPath,
    ], { encoding: 'utf8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('2:mission:fixture-2')
    expect(result.stderr).toContain('taskActions')
  })

  it('checks a complete ledger and exits nonzero for stale content', () => {
    const sourcesPath = writeSources(
      'ledger-sources.json',
      ([1, 2, 3, 4, 5, 6] as const).map(sourceForGrade)
    )
    const catalogPath = path.join(fixtureDir, 'ledger-catalog.json')
    execFileSync(process.execPath, [
      generateScript,
      '--sources',
      sourcesPath,
      '--output',
      catalogPath,
    ])
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'))
    const ledger = {
      schemaVersion: 1,
      items: catalog.items.map((item: { reviewId: string; contentHash: string }) => ({
        reviewId: item.reviewId,
        contentHash: item.contentHash,
        status: 'pass',
        findingCategories: [],
        note: 'Fixture review complete.',
        evidence: {
          editorialRead: true,
          variantAudit: true,
          preAnswer: true,
          hint: true,
          revealed: true,
          mobile: true,
          tablet: true,
          artifacts: [`out/quality/${item.reviewId}.png`],
        },
      })),
    }
    const ledgerPath = path.join(fixtureDir, 'ledger.json')
    writeFileSync(ledgerPath, JSON.stringify(ledger))

    const pass = spawnSync(process.execPath, [
      ledgerScript,
      '--catalog',
      catalogPath,
      '--ledger',
      ledgerPath,
    ], { encoding: 'utf8' })
    expect(pass.status).toBe(0)

    ledger.items[0].contentHash = '0'.repeat(64)
    writeFileSync(ledgerPath, JSON.stringify(ledger))
    const stale = spawnSync(process.execPath, [
      ledgerScript,
      '--catalog',
      catalogPath,
      '--ledger',
      ledgerPath,
    ], { encoding: 'utf8' })
    expect(stale.status).toBe(1)
    expect(stale.stderr).toMatch(/stale.*1:mission:fixture-1/i)
  })
})
