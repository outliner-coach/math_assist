import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterAll, describe, expect, it } from 'vitest'

import type { ProblemReviewSource } from './problem-review-catalog'

const require = createRequire(import.meta.url)
const reviewCore = require('../../scripts/problem-review-catalog-core.js')
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
  it('uses fixed Grade 4 boundary builds and their actual visual outputs', () => {
    const calls: Array<[number, number]> = []
    const templates = [{
      id: 'g4-fixture-01',
      unitId: 'g4-unit',
      curriculumCode: '[4수01-01]',
      problemFamily: 'g4-family',
      representation: 'context',
      answerType: 'integer',
      supportTool: 'none',
      hintSteps: ['Read the values.'],
      promptTemplate: 'Raw Grade 4 prompt',
      taskActions: ['calculate'],
      visualSemantics: 'quantitative',
      build(variant: number, choiceSeed: number) {
        calls.push([variant, choiceSeed])
        return {
          prompt: `Built prompt ${variant}`,
          choices: [`${variant}`, `${variant + 1}`],
          correctAnswer: `${variant}`,
          solutionSteps: [`Built solution ${variant}`],
          visualModel: 'actual-grade4-visual',
          visualConfig: { variant, choiceSeed },
        }
      },
    }]
    const units = [{
      id: 'g4-unit',
      semester: '4-2',
      releaseStatus: 'released',
    }]

    const [source] = reviewCore.adaptGrade4Templates(templates, units)

    expect(calls).toEqual(
      reviewCore.GRADE4_REVIEW_BUILD_CASES.map(
        ({ variant, choiceSeed }: { variant: number; choiceSeed: number }) =>
          [variant, choiceSeed]
      )
    )
    expect(source.visualKind).toBe('actual-grade4-visual')
    expect(source.content.visual.kind).toBe('actual-grade4-visual')
    expect(source.content.reviewVariants).toHaveLength(2)
    expect(source.content.reviewVariants[0]).toMatchObject({
      prompt: 'Built prompt 1',
      correctAnswer: '1',
      visualKind: 'actual-grade4-visual',
    })
  })

  it('changes the Grade 4 hash when an external helper changes generated review content', () => {
    let helperPrompt = 'Helper output before'
    const template = {
      id: 'g4-helper-01',
      unitId: 'g4-unit',
      curriculumCode: '[4수01-01]',
      problemFamily: 'g4-helper-family',
      representation: 'context',
      answerType: 'choice',
      supportTool: 'none',
      hintSteps: ['Hint'],
      promptTemplate: 'Raw prompt stays fixed',
      taskActions: ['reason'],
      visualSemantics: 'schematic',
      build(variant: number) {
        return {
          prompt: `${helperPrompt} ${variant}`,
          choices: ['A', 'B'],
          correctAnswer: 'A',
          solutionSteps: [`${helperPrompt} solution`],
          visualModel: 'helper-visual',
          visualConfig: { label: helperPrompt },
        }
      },
    }
    const units = [{ id: 'g4-unit', semester: '4-1', releaseStatus: 'released' }]
    const beforeSource = reviewCore.adaptGrade4Templates([template], units)[0]
    const before = reviewCore.buildCatalog([beforeSource])

    helperPrompt = 'Helper output after'
    const afterSource = reviewCore.adaptGrade4Templates([template], units)[0]
    const after = reviewCore.buildCatalog([afterSource])

    expect(template.build.toString()).not.toContain('Helper output before')
    expect(after.items[0].contentHash).not.toBe(before.items[0].contentHash)
  })

  it.each([
    ['missing concept_id', { id: 'tmpl-missing-concept-id' }],
    ['unknown concept_id', { id: 'tmpl-unknown-concept', concept_id: 'missing-concept' }],
  ])('reports Grade 5/6 %s with the source ID', (_label, template) => {
    expect(() =>
      reviewCore.adaptPracticeTemplates(5, [template], [], [])
    ).toThrow(new RegExp(`${template.id}.*concept`, 'i'))
  })

  it('reports a missing practice unit lookup with the source ID', () => {
    const template = { id: 'tmpl-missing-unit', concept_id: 'known-concept' }
    const concept = { id: 'known-concept', unit_id: 'missing-unit' }

    expect(() =>
      reviewCore.adaptPracticeTemplates(6, [template], [concept], [])
    ).toThrow(/tmpl-missing-unit.*unit.*missing-unit/i)
  })

  it('preserves Grade 5/6 scaffold and tool sources in required evidence', () => {
    const template = {
      id: 'tmpl-support-A-01',
      concept_id: 'support-001',
      type: 'integer',
      problem_family: 'support-family',
      prompt_template: 'Use the supplied supports.',
      choices_template: [],
      solver_rule: '4',
      hint_steps_template: ['Use the grid.'],
      solution_steps_template: ['The result is 4.'],
      taskActions: ['construct'],
      scaffold: { kind: 'worked-grid', rows: 2 },
      tool: { kind: 'ruler', unit: 'cm' },
    }
    const concept = { id: 'support-001', unit_id: 'unit-5-support' }
    const unit = { id: 'unit-5-support', grade: 5, semester: '5-2' }

    const [source] = reviewCore.adaptPracticeTemplates(
      5,
      [template],
      [concept],
      [unit]
    )

    expect(source.requiredEvidence).toEqual(['text', 'tool', 'scaffold'])
    expect(source.content.scaffold).toEqual(template.scaffold)
    expect(source.content.tool).toEqual(template.tool)
  })

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
