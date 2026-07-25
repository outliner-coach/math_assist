import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  GRADE4_ACTIVITY_ITEM_COUNT,
  getGrade4Activity,
  getGrade4MissionBank,
  grade4MissionTemplates,
  grade4Units,
  validateGrade4MissionBank,
} from './grade4-problems'

const ledger = JSON.parse(readFileSync(join(process.cwd(), 'public/data/curriculum-allocations-v1.json'), 'utf8'))

describe('Grade 4 Bridge release bank', () => {
  it('keeps every reviewed unit at ten K4/A4/R2 templates', () => {
    const result = validateGrade4MissionBank(ledger)

    expect(result.errors).toEqual([])
    expect(grade4Units).toHaveLength(2)
    expect(grade4Units.map((unit) => unit.id)).toEqual([
      'unit-4-1-large-numbers',
      'unit-4-1-multiplication-division',
    ])
    expect(grade4MissionTemplates).toHaveLength(20)
    expect(result.summary).toMatchObject({
      unitCount: 2,
      templateCount: 20,
      knowingCount: 8,
      applyingCount: 8,
      reasoningCount: 4,
      reasoningFamilyCount: 4,
      representationCount: 5,
    })

    for (const unit of grade4Units) {
      expect(unit.releaseStatus).toBe('released')
      const templates = grade4MissionTemplates.filter((item) => item.unitId === unit.id)
      expect(templates).toHaveLength(10)
      expect(templates.filter((item) => item.cognitiveDomain === 'knowing')).toHaveLength(4)
      expect(templates.filter((item) => item.cognitiveDomain === 'applying')).toHaveLength(4)
      expect(templates.filter((item) => item.cognitiveDomain === 'reasoning')).toHaveLength(2)
      expect(new Set(templates.map((item) => item.problemFamily)).size).toBe(10)
      expect(new Set(templates.map((item) => item.representation)).size).toBeGreaterThanOrEqual(2)
    }
  })

  it('builds a deterministic three-item activity with K/A/R coverage', () => {
    const first = getGrade4Activity('unit-4-1-large-numbers', 20260721, 0)
    const repeated = getGrade4Activity('unit-4-1-large-numbers', 20260721, 0)

    expect(first).toEqual(repeated)
    expect(first).toHaveLength(GRADE4_ACTIVITY_ITEM_COUNT)
    expect(first.map((mission) => mission.cognitiveDomain).sort()).toEqual(['applying', 'knowing', 'reasoning'])
    expect(new Set(first.map((mission) => mission.id)).size).toBe(first.length)
  })

  it('varies concrete prompts across activity runs while keeping choice integrity', () => {
    const first = getGrade4MissionBank(20260721)
    const later = getGrade4MissionBank(20260729)
    const changed = first.filter((mission, index) => (
      mission.prompt !== later[index].prompt || mission.correctAnswer !== later[index].correctAnswer
    ))

    expect(changed.length).toBeGreaterThanOrEqual(7)
    for (const mission of first.filter((item) => item.answerType === 'choice')) {
      expect(mission.choices).toHaveLength(4)
      expect(new Set(mission.choices).size).toBe(4)
      expect(mission.choices.filter((choice) => choice === mission.correctAnswer)).toHaveLength(1)
    }
  })

  it('solves every constraint-digit variant and keeps all choices unique and non-negative', () => {
    const template = grade4MissionTemplates.find((item) => item.id === 'g4-big-09')!

    for (let variant = 1; variant <= 9; variant += 1) {
      const mission = template.build(variant, variant)
      const boundary = 460_000 + variant * 1_000
      const validDigits = Array.from({ length: 10 }, (_, digit) => digit)
        .filter((digit) => 405_000 + digit * 10_000 < boundary)
      const expected = Math.max(...validDigits)
      const choices = (mission.choices ?? []).map(Number)

      expect(Number(mission.correctAnswer), `variant ${variant}`).toBe(expected)
      expect(new Set(choices).size, `variant ${variant}`).toBe(4)
      expect(choices.filter((choice) => choice === expected), `variant ${variant}`).toHaveLength(1)
      expect(choices.every((choice) => Number.isInteger(choice) && choice >= 0), `variant ${variant}`).toBe(true)
    }
  })

  it('keeps every two-digit division variant mathematically consistent', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === 'unit-4-1-multiplication-division')
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-div-01', 'g4-div-02', 'g4-div-03', 'g4-div-04', 'g4-div-05',
      'g4-div-06', 'g4-div-07', 'g4-div-08', 'g4-div-09', 'g4-div-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        } else {
          expect(Number.isSafeInteger(Number(mission.correctAnswer)), `${template.id} variant ${variant}`).toBe(true)
          expect(Number(mission.correctAnswer), `${template.id} variant ${variant}`).toBeGreaterThanOrEqual(0)
        }
      }

      const exact = templates.get('g4-div-01')!.build(variant, variant)
      expect(Number(exact.visualConfig.dividend) % Number(exact.visualConfig.divisor)).toBe(0)
      expect(Number(exact.correctAnswer)).toBe(
        Number(exact.visualConfig.dividend) / Number(exact.visualConfig.divisor),
      )

      for (const id of ['g4-div-02', 'g4-div-03', 'g4-div-07', 'g4-div-10']) {
        const mission = templates.get(id)!.build(variant, variant)
        const dividend = Number(mission.visualConfig.dividend)
        const divisor = Number(mission.visualConfig.divisor)
        expect(divisor).toBeGreaterThanOrEqual(10)
        expect(dividend % divisor).toBeGreaterThan(0)
        expect(dividend % divisor).toBeLessThan(divisor)
      }

      const capacity = templates.get('g4-div-06')!.build(variant, variant)
      expect(Number(capacity.correctAnswer)).toBe(
        Math.ceil(Number(capacity.visualConfig.left) / Number(capacity.visualConfig.right)),
      )

      const inverse = templates.get('g4-div-08')!.build(variant, variant)
      expect(Number(inverse.correctAnswer)).toBe(
        Number(inverse.visualConfig.divisor) * Number(inverse.visualConfig.givenQuotient)
        + Number(inverse.visualConfig.givenRemainder),
      )

      const trial = templates.get('g4-div-10')!.build(variant, variant)
      expect(Number(trial.correctAnswer)).toBe(
        Number(trial.visualConfig.divisor) * Number(trial.visualConfig.trialQuotient)
        - Number(trial.visualConfig.dividend),
      )
    }
  })

  it('rejects a Grade 4 unit whose ledger entry is still planned', () => {
    const plannedLedger = {
      ...ledger,
      allocations: ledger.allocations.map((allocation: { standardCode: string }) => (
        allocation.standardCode === '[4수01-07]'
          ? { ...allocation, reviewStatus: 'curriculum-reviewed', coverageStatus: 'planned', existingContentRefs: [] }
          : allocation
      )),
    }

    expect(validateGrade4MissionBank(plannedLedger).errors).toContain(
      'unit-4-1-multiplication-division: ledger release mismatch for [4수01-07]',
    )
  })
})
