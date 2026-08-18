import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import type {
  ApplicationProblemFamilyV1,
  GeneratedApplicationProblemV1,
  UnitKnowledgePackV1,
} from '../contracts'
import { parseUnitKnowledgePackV1 } from '../contracts'
import {
  G2_2_FACTS_DRAFT_FAMILIES,
} from './g2-2-facts'
import { oracleG2FactsProblem, verifyG2FactsProblem } from './g2-2-facts.oracle'
import { proveG2FactsFamilies } from './g2-2-facts.proof'
import { validateG2FactsVisual } from './g2-2-facts.visual'
import {
  G2_2_LENGTH_DRAFT_FAMILIES,
} from './g2-2-length'
import { oracleG2LengthDraftProblem, verifyG2LengthDraftProblem } from './g2-2-length.oracle'
import { proveG2LengthDraftFamilies } from './g2-2-length.proof'
import { validateG2LengthDraftVisual } from './g2-2-length.visual'
import {
  G2_2_PATTERN_DRAFT_FAMILIES,
} from './g2-2-pattern'
import { oracleG2PatternProblem, verifyG2PatternProblem } from './g2-2-pattern.oracle'
import { proveG2PatternFamilies } from './g2-2-pattern.proof'
import { validateG2PatternVisual } from './g2-2-pattern.visual'
import {
  G2_2_PLACE_VALUE_DRAFT_FAMILIES,
} from './g2-2-place-value'
import { oracleG2PlaceValueProblem, verifyG2PlaceValueProblem } from './g2-2-place-value.oracle'
import { proveG2PlaceValueFamilies } from './g2-2-place-value.proof'
import { validateG2PlaceValueVisual } from './g2-2-place-value.visual'
import {
  G2_2_TABLE_GRAPH_DRAFT_FAMILIES,
} from './g2-2-table-graph'
import { oracleG2TableGraphProblem, verifyG2TableGraphProblem } from './g2-2-table-graph.oracle'
import { proveG2TableGraphFamilies } from './g2-2-table-graph.proof'
import { validateG2TableGraphVisual } from './g2-2-table-graph.visual'
import {
  G2_2_TIME_DRAFT_FAMILIES,
} from './g2-2-time'
import { oracleG2TimeProblem, verifyG2TimeProblem } from './g2-2-time.oracle'
import { proveG2TimeFamilies } from './g2-2-time.proof'
import { validateG2TimeVisual } from './g2-2-time.visual'
import {
  generateG2LengthClaimCheck,
} from './g2-length-claim-check'
import {
  generateG2LengthMissingSegment,
} from './g2-length-missing-segment'
import {
  generateG2LengthRouteTotal,
} from './g2-length-route-total'
import type { G2FiniteDraftFamily } from './g2-2-content-core'

function loadPack(filename: string): UnitKnowledgePackV1 {
  return parseUnitKnowledgePackV1(JSON.parse(readFileSync(
    resolve(process.cwd(), 'public/data/application-problems/packs', filename),
    'utf8',
  )))
}

const units = [
  {
    unitId: 'g2-2-place-value',
    packFile: 'g2-2-place-value.json',
    packVersion: 1,
    coreConceptIds: ['g2-2-place-value-place-value', 'g2-2-place-value-number-comparison'],
    requiredRepresentations: ['text', 'diagram'],
    families: G2_2_PLACE_VALUE_DRAFT_FAMILIES,
    oracle: oracleG2PlaceValueProblem,
    verify: verifyG2PlaceValueProblem,
    visual: validateG2PlaceValueVisual,
    prove: proveG2PlaceValueFamilies,
  },
  {
    unitId: 'g2-2-facts',
    packFile: 'g2-2-facts.json',
    packVersion: 1,
    coreConceptIds: ['g2-2-facts-multiplication-facts'],
    requiredRepresentations: ['text', 'table', 'diagram'],
    families: G2_2_FACTS_DRAFT_FAMILIES,
    oracle: oracleG2FactsProblem,
    verify: verifyG2FactsProblem,
    visual: validateG2FactsVisual,
    prove: proveG2FactsFamilies,
  },
  {
    unitId: 'g2-2-length',
    packFile: 'g2-2-length-v2.json',
    packVersion: 2,
    coreConceptIds: ['g2-2-length-length'],
    requiredRepresentations: ['text', 'diagram'],
    families: G2_2_LENGTH_DRAFT_FAMILIES,
    oracle: oracleG2LengthDraftProblem,
    verify: verifyG2LengthDraftProblem,
    visual: validateG2LengthDraftVisual,
    prove: proveG2LengthDraftFamilies,
  },
  {
    unitId: 'g2-2-time',
    packFile: 'g2-2-time.json',
    packVersion: 1,
    coreConceptIds: ['g2-2-time-time'],
    requiredRepresentations: ['text', 'diagram'],
    families: G2_2_TIME_DRAFT_FAMILIES,
    oracle: oracleG2TimeProblem,
    verify: verifyG2TimeProblem,
    visual: validateG2TimeVisual,
    prove: proveG2TimeFamilies,
  },
  {
    unitId: 'g2-2-table-graph',
    packFile: 'g2-2-table-graph.json',
    packVersion: 1,
    coreConceptIds: ['g2-2-table-graph-table-graph'],
    requiredRepresentations: ['text', 'table', 'graph'],
    families: G2_2_TABLE_GRAPH_DRAFT_FAMILIES,
    oracle: oracleG2TableGraphProblem,
    verify: verifyG2TableGraphProblem,
    visual: validateG2TableGraphVisual,
    prove: proveG2TableGraphFamilies,
  },
  {
    unitId: 'g2-2-pattern',
    packFile: 'g2-2-pattern.json',
    packVersion: 1,
    coreConceptIds: ['g2-2-pattern-pattern'],
    requiredRepresentations: ['text', 'diagram', 'table'],
    families: G2_2_PATTERN_DRAFT_FAMILIES,
    oracle: oracleG2PatternProblem,
    verify: verifyG2PatternProblem,
    visual: validateG2PatternVisual,
    prove: proveG2PatternFamilies,
  },
] as const

function publicVisualJson(problem: GeneratedApplicationProblemV1): string {
  const clone = structuredClone(problem.visual.mathModel)
  const removeHidden = (value: unknown): void => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) return value.forEach(removeHidden)
    delete (value as Record<string, unknown>).after
    Object.values(value as Record<string, unknown>).forEach(removeHidden)
  }
  removeHidden(clone)
  return JSON.stringify(clone)
}

describe('Grade 2 semester-two complete application content', () => {
  it.each(units)('$unitId has a complete draft pack grounded in the actual base bank', (unit) => {
    const pack = loadPack(unit.packFile)
    expect(pack).toMatchObject({
      unitId: unit.unitId,
      grade: 2,
      semester: '2-2',
      version: unit.packVersion,
      coverageStatus: 'complete',
      releaseStatus: 'draft',
      approval: { ownerStatus: 'pending', evidenceRefs: [], expertStatus: 'not-reviewed' },
    })
    expect(pack.concepts.map(({ conceptId }) => conceptId)).toEqual(
      expect.arrayContaining(unit.coreConceptIds),
    )
    expect(pack.familyRefs).toEqual(
      expect.arrayContaining(unit.families.map(({ family }) => ({
        familyId: family.familyId,
        version: family.version,
      }))),
    )

    const applyingConcepts = new Set(unit.families
      .filter(({ family }) => family.cognitiveDomain === 'applying')
      .flatMap(({ family }) => family.conceptIds))
    expect(unit.coreConceptIds.every((conceptId) => applyingConcepts.has(conceptId))).toBe(true)

    const reasoning = unit.families.filter(({ family }) => family.cognitiveDomain === 'reasoning')
    expect(reasoning.length).toBeGreaterThanOrEqual(3)
    expect(new Set(reasoning.map(({ family }) => family.reasoningPattern)).size)
      .toBeGreaterThanOrEqual(3)
    reasoning.forEach(({ family }) => {
      const nonComputational = family.requiredStudentActions.filter(
        (action) => action !== 'execute_calculation',
      )
      expect(new Set(nonComputational).size).toBeGreaterThanOrEqual(2)
    })

    const representations = new Set(unit.families.flatMap(({ family }) => family.representations))
    expect(unit.requiredRepresentations.every((representation) => representations.has(representation)))
      .toBe(true)

    const misconceptionIds = new Set(pack.concepts.flatMap(({ misconceptions }) =>
      misconceptions.map(({ id }) => id)))
    const usedMisconceptions = new Set(unit.families.flatMap(({ family }) => family.misconceptionRefs))
    expect([...misconceptionIds].every((id) => usedMisconceptions.has(id))).toBe(true)
  })

  it.each(units)('$unitId exhausts every finite case with independent answer and visual checks', (unit) => {
    const reports = unit.prove()
    expect(reports).toHaveLength(unit.families.length)
    expect(reports.every((report) => report.proven)).toBe(true)

    unit.families.forEach((draft: G2FiniteDraftFamily) => {
      expect(draft.family).toMatchObject({
        schemaVersion: 'application-problem-family-v1',
        unitId: unit.unitId,
        releaseStatus: 'draft',
        proofMode: 'exhaustive',
        runtimeMode: 'deterministic-generator',
        approval: { ownerStatus: 'pending', evidenceRefs: [], expertStatus: 'not-reviewed' },
      })
      expect(draft.reviewCases.map(({ kind }) => kind)).toEqual(
        expect.arrayContaining(['representative', 'boundary']),
      )
      draft.cases.forEach((_, variantIndex) => {
        const first = draft.generate({ seed: 0, variantIndex })
        const second = draft.generate({ seed: 0, variantIndex })
        expect(first).toEqual(second)
        expect(first.answer.normalized).toBe(unit.oracle(first))
        expect(unit.verify(first)).toEqual([])
        expect(unit.visual(first)).toBe(true)
        expect(publicVisualJson(first)).not.toContain('"disclosure":"solution"')

        const tampered = structuredClone(first)
        const model = tampered.visual.mathModel as { rows?: unknown[]; primitives?: unknown[] }
        if (model.rows) model.rows = []
        if (model.primitives) model.primitives = []
        expect(unit.visual(tampered)).toBe(false)
      })
    })
  })

  it.each(units)('$unitId independent verifier rejects every corrupted contract surface', (unit) => {
    unit.families.forEach((draft: G2FiniteDraftFamily) => {
      const original = draft.generate({ seed: 0, variantIndex: 0 })
      const corruptions: GeneratedApplicationProblemV1[] = []

      const prompt = structuredClone(original)
      prompt.prompt = '손상된 문제 문장'
      corruptions.push(prompt)

      const solution = structuredClone(original)
      solution.solutionSteps = ['손상된 풀이']
      corruptions.push(solution)

      const answer = structuredClone(original)
      answer.answer.normalized = answer.answer.normalized === '9999' ? '9998' : '9999'
      corruptions.push(answer)

      if (original.choices) {
        const choices = structuredClone(original)
        const wrongIndex = choices.correctChoiceIndex === 0 ? 1 : 0
        choices.choices![wrongIndex] = '엉뚱한 보기'
        corruptions.push(choices)
      }

      const visual = structuredClone(original)
      const model = visual.visual.mathModel as {
        rows?: Array<{ cells: Array<{ numericValue?: number }> }>
        primitives?: Array<{ x2?: number }>
      }
      if (model.rows) model.rows[0].cells[1].numericValue = 9999
      if (model.primitives) model.primitives[0].x2 = Number(model.primitives[0].x2) + 1
      corruptions.push(visual)

      const a11y = structuredClone(original)
      const publicModel = a11y.visual.mathModel as {
        rows?: Array<{ cells: Array<{ before?: { text: string } }> }>
        labels?: Array<{ content: { before?: { text: string } } }>
      }
      if (publicModel.rows?.[0].cells[0].before) {
        publicModel.rows[0].cells[0].before.text += ` 정답 ${original.answer.normalized}`
      }
      if (publicModel.labels?.[0].content.before) {
        publicModel.labels[0].content.before.text += ` 정답 ${original.answer.normalized}`
      }
      corruptions.push(a11y)

      corruptions.forEach((corrupted) => {
        expect(unit.verify(corrupted), `${draft.family.familyId} accepted corrupted evidence`)
          .not.toEqual([])
      })
    })
  })

  it.each([
    { label: 'shop price', families: G2_2_PLACE_VALUE_DRAFT_FAMILIES, familyId: 'g2-2-place-value-shop-order', unitToken: '원' },
    { label: 'cookie total', families: G2_2_FACTS_DRAFT_FAMILIES, familyId: 'g2-2-facts-two-trays', unitToken: '개' },
    { label: 'row count', families: G2_2_FACTS_DRAFT_FAMILIES, familyId: 'g2-2-facts-missing-groups', unitToken: '줄' },
    { label: 'survey difference', families: G2_2_TABLE_GRAPH_DRAFT_FAMILIES, familyId: 'g2-2-table-graph-survey-difference', unitToken: '명' },
    { label: 'missing category', families: G2_2_TABLE_GRAPH_DRAFT_FAMILIES, familyId: 'g2-2-table-graph-missing-category', unitToken: '개' },
  ] as const)('$label independently proves the answer unit in the final calculation', ({
    families,
    familyId,
    unitToken,
  }) => {
    const draft = families.find(({ family }) => family.familyId === familyId)!
    draft.cases.forEach((_, variantIndex) => {
      const problem = draft.generate({ seed: 0, variantIndex })
      expect(problem.solutionSteps.at(-1)).toContain(unitToken)
    })
  })

  it('never serializes an omitted graph key or an answer-driving flag before submission', () => {
    const draft = G2_2_TABLE_GRAPH_DRAFT_FAMILIES.find(
      ({ family }) => family.familyId === 'g2-2-table-graph-key-sufficiency',
    )!
    const missingKey = draft.generate({ seed: 0, variantIndex: 1 })
    expect(missingKey.prompt).not.toContain(String(missingKey.params['per-mark']))
    const serialized = publicVisualJson(missingKey)
    expect(serialized).not.toContain('per-mark')
    expect(serialized).not.toContain('표식 한 개의 수')
    expect(serialized).not.toContain('has-key')
    expect(serialized).not.toContain('표식 뜻 정보')
  })

  it.each(units)('$unitId proves every executable finite-domain boundary class', (unit) => {
    unit.families.forEach((draft: G2FiniteDraftFamily) => {
      expect(draft.boundaryEvidence.length).toBeGreaterThan(0)
      const boundaryReviewIds = new Set(draft.reviewCases
        .filter(({ kind }) => kind === 'boundary')
        .flatMap(({ boundaryClassIds }) => boundaryClassIds))
      draft.boundaryEvidence.forEach((boundary) => {
        expect(boundary.variantIndexes.length).toBeGreaterThan(0)
        expect(boundaryReviewIds.has(boundary.classId)).toBe(true)
        boundary.variantIndexes.forEach((variantIndex) => {
          expect(boundary.matches(draft.cases[variantIndex])).toBe(true)
        })
      })
    })
  })

  it('keeps the approved Grade 2 length V1 pack and normal snapshots byte-for-byte meaningful', () => {
    const baselinePack = loadPack('g2-2-length.json')
    expect(baselinePack).toMatchObject({
      packId: 'pack-g2-2-length',
      version: 1,
      coverageStatus: 'pilot',
      releaseStatus: 'approved',
    })

    const snapshots = [
      generateG2LengthRouteTotal({ seed: 0, variantIndex: 0 }),
      generateG2LengthMissingSegment({ seed: 0, variantIndex: 0 }),
      generateG2LengthClaimCheck({ seed: 0, variantIndex: 0 }),
    ]
    expect(snapshots.map((problem) => ({
      familyId: problem.familyId,
      packVersion: problem.packVersion,
      prompt: problem.prompt,
      answer: problem.answer.normalized,
      generatorId: problem.visual.generatorId,
    }))).toEqual([
      {
        familyId: 'g2-length-route-total',
        packVersion: 1,
        prompt: '첫 길은 1m 10cm, 다음 길은 25cm와 20cm예요. 세 길이는 모두 몇 cm일까요?',
        answer: '155',
        generatorId: 'g2-length-route-bars',
      },
      {
        familyId: 'g2-length-missing-segment',
        packVersion: 1,
        prompt: '세 구간을 이은 전체는 1m 80cm예요. 그림의 ? 길이는 몇 cm일까요?',
        answer: '110',
        generatorId: 'g2-length-missing-bars',
      },
      {
        familyId: 'g2-length-claim-check',
        packVersion: 1,
        prompt: '세 길이는 1m 10cm, 25cm, 20cm예요. 가: 모두 155cm야. 나: 모두 65cm야. 누구 말이 맞나요?',
        answer: '가',
        generatorId: 'g2-length-claim-bars',
      },
    ])
  })
})

// Keeps the imported contract type checked in this focused suite.
const _familyTypeCheck: ApplicationProblemFamilyV1 | undefined = undefined
void _familyTypeCheck
