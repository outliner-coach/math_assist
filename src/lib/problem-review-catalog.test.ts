import { describe, expect, it } from 'vitest'

import {
  buildProblemReviewCatalog,
  createProblemReviewItem,
  stableJsonStringify,
  validateEditorialLedger,
  type ProblemReviewCatalog,
  type ProblemReviewSource,
  type RendererReviewVersionRegistry,
} from './problem-review-catalog'

const rendererVersions: RendererReviewVersionRegistry = Object.fromEntries(
  Array.from({ length: 6 }, (_, index) => [`grade-${index + 1}`, '1'])
)

function sourceForGrade(grade: 1 | 2 | 3 | 4 | 5 | 6): ProblemReviewSource {
  const hasScaffold = grade === 3
  const hasTool = grade === 4

  return {
    grade,
    sourceKind: grade <= 4 ? 'mission' : 'template',
    sourceId: `source-${grade}`,
    semester: grade === 1 ? null : `${grade}-1`,
    unitId: grade === 1 ? 'island-1' : `unit-${grade}`,
    conceptId: grade >= 5 ? `concept-${grade}` : null,
    family: `family-${grade}`,
    curriculumCodes: [`[${grade}수01-02]`, `[${grade}수01-01]`, `[${grade}수01-02]`],
    answerKind: 'choice',
    taskActions: ['recognize'],
    requiredEvidence: [
      'text',
      'visual',
      ...(hasTool ? (['tool'] as const) : []),
      ...(hasScaffold ? (['scaffold'] as const) : []),
    ],
    visualKind: 'clock-face',
    visualSemantics: 'quantitative',
    rendererReviewKey: `grade-${grade}`,
    isPublic: true,
    content: {
      prompt: `Grade ${grade} prompt`,
      choices: ['1', '2', '3', '4'],
      answerRule: { solver: '2' },
      hints: ['Look at the given values.'],
      solution: ['The answer follows from the rule.'],
      scaffold: hasScaffold ? { kind: 'reader', prompt: 'Read it.' } : null,
      tool: hasTool ? { kind: 'ruler' } : null,
      visual: { kind: 'clock-face', config: { hour: 3 } },
    },
  }
}

function completeCatalog(): ProblemReviewCatalog {
  return buildProblemReviewCatalog(
    ([1, 2, 3, 4, 5, 6] as const).map(sourceForGrade),
    rendererVersions
  )
}

function completeLedger(catalog: ProblemReviewCatalog) {
  return {
    schemaVersion: 1,
    items: catalog.items.map(item => ({
      reviewId: item.reviewId,
      contentHash: item.contentHash,
      status: 'pass',
      findingCategories: [],
      note: 'Reviewed against the catalog and rendered variants.',
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
}

describe('problem review catalog contract', () => {
  it('builds a deterministic, reviewId-sorted catalog from complete Grade 1-6 fixtures', () => {
    const catalog = completeCatalog()
    const repeated = buildProblemReviewCatalog(
      ([6, 3, 1, 5, 2, 4] as const).map(sourceForGrade),
      { ...rendererVersions }
    )

    expect(catalog.items.map(item => item.reviewId)).toEqual([
      '1:mission:source-1',
      '2:mission:source-2',
      '3:mission:source-3',
      '4:mission:source-4',
      '5:template:source-5',
      '6:template:source-6',
    ])
    expect(catalog.items[0]).toMatchObject({
      semester: null,
      unitId: 'island-1',
      conceptId: null,
      family: 'family-1',
      curriculumCodes: ['[1수01-01]', '[1수01-02]'],
    })
    expect(stableJsonStringify(catalog)).toBe(stableJsonStringify(repeated))
  })

  it.each([
    ['family', { family: '' }],
    ['taskActions', { taskActions: [] }],
    ['visualSemantics', { visualSemantics: undefined }],
  ])('rejects missing required %s metadata instead of inferring it', (field, patch) => {
    expect(() =>
      createProblemReviewItem(
        { ...sourceForGrade(2), ...patch } as ProblemReviewSource,
        rendererVersions
      )
    ).toThrow(new RegExp(`2:mission:source-2.*${field}`, 'i'))
  })

  it('requires text plus every real visual, tool, and scaffold evidence mode', () => {
    const source = sourceForGrade(3)
    expect(() =>
      createProblemReviewItem(
        { ...source, requiredEvidence: ['text', 'visual'] },
        rendererVersions
      )
    ).toThrow(/3:mission:source-3.*scaffold/i)

    expect(() =>
      createProblemReviewItem(
        { ...sourceForGrade(4), requiredEvidence: ['text', 'visual'] },
        rendererVersions
      )
    ).toThrow(/4:mission:source-4.*tool/i)
  })

  it('keeps the actual answer and visual contracts and validates the renderer registry', () => {
    const source = sourceForGrade(5)
    const item = createProblemReviewItem(
      {
        ...source,
        answerKind: 'fraction',
        visualKind: 'fraction-strip',
        content: {
          ...source.content,
          visual: { kind: 'fraction-strip', config: { parts: 4 } },
        },
      },
      rendererVersions
    )

    expect(item.answerKind).toBe('fraction')
    expect(item.visualKind).toBe('fraction-strip')
    expect(item.rendererReviewVersion).toBe('1')
    expect(() =>
      createProblemReviewItem(
        { ...source, rendererReviewKey: 'unregistered-renderer' },
        rendererVersions
      )
    ).toThrow(/unregistered-renderer.*renderer review version/i)
  })

  it('allows only null semester for Grade 1 sources', () => {
    expect(() =>
      createProblemReviewItem(
        { ...sourceForGrade(1), semester: '1-1' },
        rendererVersions
      )
    ).toThrow(/1:mission:source-1.*semester.*null/i)
  })

  it.each([
    ['prompt', (source: ProblemReviewSource) => ({ ...source.content, prompt: 'Changed prompt' })],
    ['choices', (source: ProblemReviewSource) => ({ ...source.content, choices: ['4', '3', '2', '1'] })],
    ['answer rule', (source: ProblemReviewSource) => ({ ...source.content, answerRule: { solver: '3' } })],
    ['hint', (source: ProblemReviewSource) => ({ ...source.content, hints: ['Changed hint'] })],
    ['solution', (source: ProblemReviewSource) => ({ ...source.content, solution: ['Changed solution'] })],
    ['scaffold', (source: ProblemReviewSource) => ({ ...source.content, scaffold: { kind: 'changed' } })],
    ['visual', (source: ProblemReviewSource) => ({ ...source.content, visual: { kind: 'clock-face', config: { hour: 4 } } })],
  ])('changes contentHash when %s changes', (_label, mutateContent) => {
    const source = sourceForGrade(3)
    const before = createProblemReviewItem(source, rendererVersions)
    const after = createProblemReviewItem(
      { ...source, content: mutateContent(source) },
      rendererVersions
    )
    expect(after.contentHash).not.toBe(before.contentHash)
  })

  it('changes contentHash for answer kind, curriculum codes, and renderer review version', () => {
    const source = sourceForGrade(5)
    const before = createProblemReviewItem(source, rendererVersions)
    const changedAnswer = createProblemReviewItem(
      { ...source, answerKind: 'label' },
      rendererVersions
    )
    const changedCurriculum = createProblemReviewItem(
      { ...source, curriculumCodes: ['[5수01-09]'] },
      rendererVersions
    )
    const changedRenderer = createProblemReviewItem(source, {
      ...rendererVersions,
      'grade-5': '2',
    })

    expect(new Set([
      before.contentHash,
      changedAnswer.contentHash,
      changedCurriculum.contentHash,
      changedRenderer.contentHash,
    ])).toHaveLength(4)
  })
})

describe('editorial ledger validation', () => {
  it('accepts a complete ledger and rejects missing and duplicate review IDs', () => {
    const catalog = completeCatalog()
    const ledger = completeLedger(catalog)

    expect(validateEditorialLedger(catalog, ledger)).toEqual([])
    expect(validateEditorialLedger(catalog, {
      ...ledger,
      items: ledger.items.slice(1),
    }).join('\n')).toMatch(/missing.*1:mission:source-1/i)
    expect(validateEditorialLedger(catalog, {
      ...ledger,
      items: [...ledger.items, ledger.items[0]],
    }).join('\n')).toMatch(/duplicate.*1:mission:source-1/i)
  })

  it('rejects stale hashes, blocked items, and invalid or incomplete evidence', () => {
    const catalog = completeCatalog()
    const ledger = completeLedger(catalog)
    const first = ledger.items[0]

    expect(validateEditorialLedger(catalog, {
      ...ledger,
      items: [{ ...first, contentHash: '0'.repeat(64) }, ...ledger.items.slice(1)],
    }).join('\n')).toMatch(/stale.*1:mission:source-1/i)

    expect(validateEditorialLedger(catalog, {
      ...ledger,
      items: [{
        ...first,
        status: 'blocked',
        findingCategories: ['math'],
      }, ...ledger.items.slice(1)],
    }).join('\n')).toMatch(/blocked.*1:mission:source-1/i)

    expect(validateEditorialLedger(catalog, {
      ...ledger,
      items: [{
        ...first,
        evidence: { ...first.evidence, mobile: false, artifacts: [] },
      }, ...ledger.items.slice(1)],
    }).join('\n')).toMatch(/evidence.*(mobile|artifacts)/i)
  })

  it('rejects invalid finding categories and public catalog items without curriculum codes', () => {
    const catalog = completeCatalog()
    const ledger = completeLedger(catalog)
    const first = ledger.items[0]

    expect(validateEditorialLedger(catalog, {
      ...ledger,
      items: [{
        ...first,
        findingCategories: ['invented_category'],
      }, ...ledger.items.slice(1)],
    }).join('\n')).toMatch(/findingCategories.*invented_category/i)

    const emptyCurriculumCatalog = {
      ...catalog,
      items: [{ ...catalog.items[0], curriculumCodes: [] }, ...catalog.items.slice(1)],
    }
    expect(validateEditorialLedger(emptyCurriculumCatalog, ledger).join('\n')).toMatch(
      /public.*curriculumCodes.*1:mission:source-1/i
    )
  })
})
