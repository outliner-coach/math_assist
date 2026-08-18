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
import { oracleG2FactsProblem } from './g2-2-facts.oracle'
import { proveG2FactsFamilies } from './g2-2-facts.proof'
import { validateG2FactsVisual } from './g2-2-facts.visual'
import {
  G2_2_LENGTH_DRAFT_FAMILIES,
} from './g2-2-length'
import { oracleG2LengthDraftProblem } from './g2-2-length.oracle'
import { proveG2LengthDraftFamilies } from './g2-2-length.proof'
import { validateG2LengthDraftVisual } from './g2-2-length.visual'
import {
  G2_2_PATTERN_DRAFT_FAMILIES,
} from './g2-2-pattern'
import { oracleG2PatternProblem } from './g2-2-pattern.oracle'
import { proveG2PatternFamilies } from './g2-2-pattern.proof'
import { validateG2PatternVisual } from './g2-2-pattern.visual'
import {
  G2_2_PLACE_VALUE_DRAFT_FAMILIES,
} from './g2-2-place-value'
import { oracleG2PlaceValueProblem } from './g2-2-place-value.oracle'
import { proveG2PlaceValueFamilies } from './g2-2-place-value.proof'
import { validateG2PlaceValueVisual } from './g2-2-place-value.visual'
import {
  G2_2_TABLE_GRAPH_DRAFT_FAMILIES,
} from './g2-2-table-graph'
import { oracleG2TableGraphProblem } from './g2-2-table-graph.oracle'
import { proveG2TableGraphFamilies } from './g2-2-table-graph.proof'
import { validateG2TableGraphVisual } from './g2-2-table-graph.visual'
import {
  G2_2_TIME_DRAFT_FAMILIES,
} from './g2-2-time'
import { oracleG2TimeProblem } from './g2-2-time.oracle'
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
