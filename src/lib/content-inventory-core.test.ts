import { describe, expect, it } from 'vitest'

import {
  buildCanonicalMathSignature,
  buildContentInventory,
  serializeContentInventory,
} from '../../scripts/content-inventory-core.js'

const authoredAdd = {
  reviewId: '3:mission:add-001',
  published: true,
  origin: 'authored',
  curriculumStandards: ['[4수01-01]'],
  problemFamily: 'challenge: missing-addend',
  solutionRule: 'x + 3',
  contextType: 'pure_math',
  representationTypes: ['equation', 'text'],
  taskActions: ['calculate', 'reason'],
  reasoningPattern: 'inverse',
  options: ['3', '5', '7', '9'],
  numericParameters: { x: 2 },
  stageOrder: 1,
}

const generatedAddVariant = {
  ...authoredAdd,
  reviewId: '3:mission:add-001-retry-2',
  origin: 'generated_variant',
  authoredSourceId: '3:mission:add-001',
  problemFamily: 'retry: missing-addend',
  solutionRule: 'x + 99',
  representationTypes: ['text', 'equation'],
  taskActions: ['reason', 'calculate'],
  options: ['9', '7', '5', '3'],
  numericParameters: { x: 42 },
  stageOrder: 99,
}

const authoredStory = {
  ...authoredAdd,
  reviewId: '3:mission:add-story-001',
  problemFamily: 'missing-addend',
  contextType: 'daily_life',
  representationTypes: ['story', 'equation'],
  taskActions: ['model', 'calculate'],
}

describe('content inventory and canonical math signatures', () => {
  it('ignores IDs, prefixes, numbers, option order, and stage order in a signature', () => {
    expect(buildCanonicalMathSignature(authoredAdd)).toBe(
      buildCanonicalMathSignature(generatedAddVariant)
    )
    expect(buildCanonicalMathSignature(authoredAdd)).toBe(
      buildCanonicalMathSignature({
        ...generatedAddVariant,
        problemFamily: 'retry-2: missing-addend',
      })
    )
  })

  it('preserves each required semantic dimension in a signature', () => {
    const base = buildCanonicalMathSignature(authoredAdd)
    const changes = [
      { curriculumStandards: ['[4수01-02]'] },
      { problemFamily: 'missing-factor' },
      { solutionRule: 'x * 3' },
      { contextType: 'daily_life' },
      { representationTypes: ['table'] },
      { taskActions: ['compare'] },
      { reasoningPattern: 'error_analysis' },
    ]

    for (const change of changes) {
      expect(buildCanonicalMathSignature({ ...authoredAdd, ...change })).not.toBe(base)
    }
  })

  it('preserves digits that are part of semantic category labels', () => {
    expect(buildCanonicalMathSignature({
      ...authoredAdd,
      problemFamily: '2-step-addition',
    })).not.toBe(buildCanonicalMathSignature({
      ...authoredAdd,
      problemFamily: '3-step-addition',
    }))

    expect(buildCanonicalMathSignature({
      ...authoredAdd,
      representationTypes: ['2d-model'],
    })).not.toBe(buildCanonicalMathSignature({
      ...authoredAdd,
      representationTypes: ['3d-model'],
    }))
  })

  it('keeps all five inventory counts separate and permits generated variants to share a signature', () => {
    const result = buildContentInventory({
      publishedSources: [authoredAdd, generatedAddVariant, authoredStory],
      sessionItems: [
        { sessionId: 'basic-1', itemId: 'item-1' },
        { sessionId: 'basic-1', itemId: 'item-2' },
        { sessionId: 'practice-1', itemId: 'item-1' },
        { sessionId: 'practice-1', itemId: 'item-2' },
        { sessionId: 'practice-1', itemId: 'item-3' },
      ],
    })

    expect(result.errors).toEqual([])
    expect(result.counts).toEqual({
      publishedSourceCount: 3,
      authoredSourceCount: 2,
      canonicalMathSignatureCount: 2,
      generatedVariantCount: 1,
      sessionItemCount: 5,
    })
  })

  it('rejects authored sources that differ only by ignored variant details', () => {
    const duplicateAuthored = {
      ...generatedAddVariant,
      reviewId: '3:mission:add-002',
      origin: 'authored',
      authoredSourceId: undefined,
    }
    const result = buildContentInventory({
      publishedSources: [authoredAdd, duplicateAuthored],
      sessionItems: [],
    })

    expect(result.errors).toContainEqual(expect.objectContaining({
      code: 'duplicate_authored_math_signature',
      field: 'canonicalMathSignature',
      sourceId: '3:mission:add-002',
      conflictingSourceId: '3:mission:add-001',
    }))
  })

  it('reports the exact source and field for invalid fixtures', () => {
    const result = buildContentInventory({
      publishedSources: [{
        reviewId: 'broken',
        published: true,
        origin: 'generated_variant',
        curriculumStandards: [],
        problemFamily: '',
        solutionRule: '',
        contextType: '',
        representationTypes: [],
        taskActions: [],
        reasoningPattern: '',
      }],
      sessionItems: [{}],
    })

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'missing_authored_source_id',
        sourceId: 'broken',
        field: 'authoredSourceId',
      }),
      expect.objectContaining({
        code: 'missing_curriculum_standard',
        sourceId: 'broken',
        field: 'curriculumStandards',
      }),
      expect.objectContaining({
        code: 'missing_problem_family',
        sourceId: 'broken',
        field: 'problemFamily',
      }),
      expect.objectContaining({
        code: 'invalid_session_item',
        sourceId: expect.stringContaining('sessionItems[0:'),
        field: 'sessionId',
      }),
    ]))
  })

  it('serializes byte-identical reports regardless of input order', () => {
    const forward = buildContentInventory({
      publishedSources: [authoredAdd, generatedAddVariant, authoredStory],
      sessionItems: [
        { sessionId: 'practice', itemId: 'b' },
        { sessionId: 'practice', itemId: 'a' },
      ],
    })
    const reversed = buildContentInventory({
      publishedSources: [authoredStory, generatedAddVariant, authoredAdd],
      sessionItems: [
        { sessionId: 'practice', itemId: 'a' },
        { sessionId: 'practice', itemId: 'b' },
      ],
    })

    expect(serializeContentInventory(forward)).toBe(
      serializeContentInventory(reversed)
    )
  })

  it('serializes invalid fixtures deterministically when their input order changes', () => {
    const invalidSources = [
      { ...authoredAdd, reviewId: 'duplicate' },
      { ...authoredStory, reviewId: 'duplicate' },
      {
        published: true,
        origin: 'generated_variant',
        curriculumStandards: ['[4수01-01]'],
        problemFamily: 'missing-addend',
        solutionRule: 'x + 8',
        contextType: 'pure_math',
        representationTypes: ['text'],
        taskActions: ['calculate'],
        reasoningPattern: 'inverse',
      },
    ]
    const forward = buildContentInventory({
      publishedSources: invalidSources,
      sessionItems: [{ itemId: 'a' }, { sessionId: 'practice' }],
    })
    const reversed = buildContentInventory({
      publishedSources: [...invalidSources].reverse(),
      sessionItems: [{ sessionId: 'practice' }, { itemId: 'a' }],
    })

    expect(serializeContentInventory(forward)).toBe(
      serializeContentInventory(reversed)
    )
  })
})
