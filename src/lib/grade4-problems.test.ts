import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  GRADE4_ACTIVITY_ITEM_COUNT,
  GRADE4_DECIMAL_UNIT_ID,
  GRADE4_DECIMAL_ADD_SUB_UNIT_ID,
  GRADE4_ESTIMATION_UNIT_ID,
  GRADE4_EQUALITY_UNIT_ID,
  GRADE4_FRACTION_ADD_SUB_UNIT_ID,
  GRADE4_PATTERNS_UNIT_ID,
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
    expect(grade4Units).toHaveLength(8)
    expect(grade4Units.map((unit) => unit.id)).toEqual([
      'unit-4-1-large-numbers',
      'unit-4-1-multiplication-division',
      'unit-4-1-arithmetic-estimation',
      'unit-4-2-decimals',
      'unit-4-2-fraction-add-sub',
      'unit-4-2-decimal-add-sub',
      'unit-4-2-patterns',
      'unit-4-2-equality',
    ])
    expect(grade4MissionTemplates).toHaveLength(80)
    expect(result.summary).toMatchObject({
      unitCount: 8,
      templateCount: 80,
      knowingCount: 32,
      applyingCount: 32,
      reasoningCount: 16,
      reasoningFamilyCount: 16,
      representationCount: 9,
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

  it('derives every arithmetic estimate from the displayed operands', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_ESTIMATION_UNIT_ID)
        .map((item) => [item.id, item]),
    )
    const nearest = (value: number, place: number) => Math.round(value / place) * place

    expect(Array.from(templates.keys())).toEqual([
      'g4-est-01', 'g4-est-02', 'g4-est-03', 'g4-est-04', 'g4-est-05',
      'g4-est-06', 'g4-est-07', 'g4-est-08', 'g4-est-09', 'g4-est-10',
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

      for (const id of ['g4-est-01', 'g4-est-05']) {
        const addition = templates.get(id)!.build(variant, variant)
        expect(Number(addition.correctAnswer)).toBe(
          nearest(Number(addition.visualConfig.left), 100) + nearest(Number(addition.visualConfig.right), 100),
        )
      }

      const subtraction = templates.get('g4-est-02')!.build(variant, variant)
      expect(Number(subtraction.correctAnswer)).toBe(
        nearest(Number(subtraction.visualConfig.left), 100) - nearest(Number(subtraction.visualConfig.right), 100),
      )

      for (const id of ['g4-est-03', 'g4-est-07']) {
        const multiplication = templates.get(id)!.build(variant, variant)
        expect(Number(multiplication.correctAnswer)).toBe(
          nearest(Number(multiplication.visualConfig.left), 10) * Number(multiplication.visualConfig.right),
        )
      }

      for (const id of ['g4-est-04', 'g4-est-08']) {
        const division = templates.get(id)!.build(variant, variant)
        expect(Number(division.correctAnswer)).toBe(
          nearest(Number(division.visualConfig.left), 100) / Number(division.visualConfig.right),
        )
      }

      const budget = templates.get('g4-est-06')!.build(variant, variant)
      expect(Number(budget.correctAnswer)).toBe(
        nearest(Number(budget.visualConfig.left), 1_000) - nearest(Number(budget.visualConfig.right), 1_000),
      )

      const strategy = templates.get('g4-est-10')!.build(variant, variant)
      const factor = Number(strategy.visualConfig.left)
      const count = Number(strategy.visualConfig.right)
      const tensError = Math.abs(factor * count - nearest(factor, 10) * count)
      const hundredsError = Math.abs(factor * count - nearest(factor, 100) * count)
      expect(tensError).toBeLessThan(hundredsError)
      expect(strategy.correctAnswer).toContain('십 단위')

      const correction = templates.get('g4-est-09')!.build(variant, variant)
      const correctedEstimate = nearest(Number(correction.visualConfig.left), 100)
        + nearest(Number(correction.visualConfig.right), 100)
      expect(correction.correctAnswer).toContain(correctedEstimate.toLocaleString('ko-KR'))

      for (const id of ['g4-est-01', 'g4-est-02', 'g4-est-05', 'g4-est-09']) {
        const mission = templates.get(id)!.build(variant, variant)
        expect(Number(mission.visualConfig.left) % 100, `${id} left variant ${variant}`).not.toBe(50)
        expect(Number(mission.visualConfig.right) % 100, `${id} right variant ${variant}`).not.toBe(50)
      }
      for (const id of ['g4-est-04', 'g4-est-08']) {
        const mission = templates.get(id)!.build(variant, variant)
        expect(Number(mission.visualConfig.left) % 100, `${id} variant ${variant}`).not.toBe(50)
      }
      for (const id of ['g4-est-03', 'g4-est-07', 'g4-est-10']) {
        const mission = templates.get(id)!.build(variant, variant)
        expect(Number(mission.visualConfig.left) % 10, `${id} variant ${variant}`).not.toBe(5)
      }
      expect(Number(budget.visualConfig.left) % 1_000, `g4-est-06 left variant ${variant}`).not.toBe(500)
      expect(Number(budget.visualConfig.right) % 1_000, `g4-est-06 right variant ${variant}`).not.toBe(500)
    }
  })

  it('keeps every two- and three-place decimal variant exact and unambiguous', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_DECIMAL_UNIT_ID)
        .map((item) => [item.id, item]),
    )
    const fromParts = (config: Record<string, string | number | boolean>) => (
      Number(config.ones)
      + Number(config.tenths) / 10
      + Number(config.hundredths) / 100
      + Number(config.thousandths) / 1_000
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-dec-01', 'g4-dec-02', 'g4-dec-03', 'g4-dec-04', 'g4-dec-05',
      'g4-dec-06', 'g4-dec-07', 'g4-dec-08', 'g4-dec-09', 'g4-dec-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        } else if (template.answerType === 'decimal') {
          expect(mission.correctAnswer, `${template.id} variant ${variant}`).toMatch(/^\d+\.\d+$/)
        } else {
          expect(Number.isSafeInteger(Number(mission.correctAnswer)), `${template.id} variant ${variant}`).toBe(true)
        }
      }

      for (const id of ['g4-dec-01', 'g4-dec-03']) {
        const mission = templates.get(id)!.build(variant, variant)
        expect(Number(mission.correctAnswer)).toBeCloseTo(fromParts(mission.visualConfig), 10)
      }

      const placeValue = templates.get('g4-dec-02')!.build(variant, variant)
      expect(Number(placeValue.correctAnswer)).toBe(Number(placeValue.visualConfig.hundredths) / 100)

      const comparison = templates.get('g4-dec-04')!.build(variant, variant)
      const expectedSymbol = Number(comparison.visualConfig.left) < Number(comparison.visualConfig.right) ? '<' : '>'
      expect(comparison.correctAnswer).toBe(expectedSymbol)

      const greatest = templates.get('g4-dec-07')!.build(variant, variant)
      const digits = [
        Number(greatest.visualConfig.card1),
        Number(greatest.visualConfig.card2),
        Number(greatest.visualConfig.card3),
      ].sort((a, b) => b - a)
      expect(greatest.correctAnswer).toBe(`0.${digits.join('')}`)

      const missingDigit = templates.get('g4-dec-10')!.build(variant, variant)
      expect(Number(missingDigit.correctAnswer)).toBe(Number(missingDigit.visualConfig.thresholdDigit) - 1)
    }
  })

  it('keeps every like-denominator fraction operation exact and answer-safe', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_FRACTION_ADD_SUB_UNIT_ID)
        .map((item) => [item.id, item]),
    )
    const parse = (value: string) => {
      const match = value.match(/^(?:(\d+) )?(\d+)\/(\d+)$/)
      if (!match) throw new Error(`invalid test fraction ${value}`)
      return {
        numerator: Number(match[1] ?? 0) * Number(match[3]) + Number(match[2]),
        denominator: Number(match[3]),
      }
    }

    expect(Array.from(templates.keys())).toEqual([
      'g4-frac-01', 'g4-frac-02', 'g4-frac-03', 'g4-frac-04', 'g4-frac-05',
      'g4-frac-06', 'g4-frac-07', 'g4-frac-08', 'g4-frac-09', 'g4-frac-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        } else {
          const parsed = parse(mission.correctAnswer)
          expect(parsed.denominator, `${template.id} variant ${variant}`).toBeGreaterThan(0)
          expect(parsed.numerator, `${template.id} variant ${variant}`).toBeGreaterThan(0)
        }
      }

      for (const id of ['g4-frac-01', 'g4-frac-03', 'g4-frac-05']) {
        const mission = templates.get(id)!.build(variant, variant)
        const answer = parse(mission.correctAnswer)
        expect(answer.denominator).toBe(Number(mission.visualConfig.denominator))
        expect(answer.numerator).toBe(
          Number(mission.visualConfig.firstNumerator) + Number(mission.visualConfig.secondNumerator),
        )
      }

      for (const id of ['g4-frac-02', 'g4-frac-04', 'g4-frac-06']) {
        const mission = templates.get(id)!.build(variant, variant)
        const answer = parse(mission.correctAnswer)
        expect(answer.denominator).toBe(Number(mission.visualConfig.denominator))
        expect(answer.numerator).toBe(
          Number(mission.visualConfig.firstNumerator) - Number(mission.visualConfig.secondNumerator),
        )
      }

      const missing = templates.get('g4-frac-07')!.build(variant, variant)
      expect(parse(missing.correctAnswer).numerator).toBe(
        Number(missing.visualConfig.totalNumerator) - Number(missing.visualConfig.firstNumerator),
      )
      expect(missing.visualConfig).not.toHaveProperty('resultNumerator')
    }
  })

  it('derives every hundredths decimal operation from aligned integer place values', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_DECIMAL_ADD_SUB_UNIT_ID)
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-dop-01', 'g4-dop-02', 'g4-dop-03', 'g4-dop-04', 'g4-dop-05',
      'g4-dop-06', 'g4-dop-07', 'g4-dop-08', 'g4-dop-09', 'g4-dop-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        } else {
          expect(mission.correctAnswer, `${template.id} variant ${variant}`).toMatch(/^\d+\.\d{2}$/)
        }
        expect(mission.visualConfig).not.toHaveProperty('resultScaled')
      }

      for (const id of ['g4-dop-01', 'g4-dop-02', 'g4-dop-05']) {
        const mission = templates.get(id)!.build(variant, variant)
        expect(Math.round(Number(mission.correctAnswer) * 100)).toBe(
          Number(mission.visualConfig.leftScaled) + Number(mission.visualConfig.rightScaled),
        )
      }
      for (const id of ['g4-dop-03', 'g4-dop-04', 'g4-dop-06']) {
        const mission = templates.get(id)!.build(variant, variant)
        expect(Math.round(Number(mission.correctAnswer) * 100)).toBe(
          Number(mission.visualConfig.leftScaled) - Number(mission.visualConfig.rightScaled),
        )
      }
      const missing = templates.get('g4-dop-07')!.build(variant, variant)
      expect(Math.round(Number(missing.correctAnswer) * 100)).toBe(
        Number(missing.visualConfig.totalScaled) - Number(missing.visualConfig.leftScaled),
      )
    }
  })

  it('derives every missing pattern value from the visible sequence, table, or calculation rows', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_PATTERNS_UNIT_ID)
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-pat-01', 'g4-pat-02', 'g4-pat-03', 'g4-pat-04', 'g4-pat-05',
      'g4-pat-06', 'g4-pat-07', 'g4-pat-08', 'g4-pat-09', 'g4-pat-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        } else {
          expect(mission.correctAnswer, `${template.id} variant ${variant}`).toMatch(/^\d+$/)
        }
        expect(mission.visualConfig).not.toHaveProperty('answer')
        expect(mission.visualConfig).not.toHaveProperty('result')
        expect(mission.visualConfig).not.toHaveProperty('targetValue')
      }

      const sequence = templates.get('g4-pat-01')!.build(variant, variant)
      expect(Number(sequence.correctAnswer)).toBe(
        Number(sequence.visualConfig.value4)
        + (Number(sequence.visualConfig.value2) - Number(sequence.visualConfig.value1)),
      )

      const correspondence = templates.get('g4-pat-02')!.build(variant, variant)
      const inputStep = Number(correspondence.visualConfig.input2) - Number(correspondence.visualConfig.input1)
      const outputStep = Number(correspondence.visualConfig.output2) - Number(correspondence.visualConfig.output1)
      expect(Number(correspondence.correctAnswer)).toBe(
        Number(correspondence.visualConfig.output3) + outputStep / inputStep,
      )

      const stage = templates.get('g4-pat-05')!.build(variant, variant)
      const stageStep = Number(stage.visualConfig.value2) - Number(stage.visualConfig.value1)
      expect(Number(stage.correctAnswer)).toBe(
        Number(stage.visualConfig.value1)
        + (Number(stage.visualConfig.requestedPosition) - 1) * stageStep,
      )

      const calculation = templates.get('g4-pat-07')!.build(variant, variant)
      expect(Number(calculation.correctAnswer)).toBe(
        Number(calculation.visualConfig.factor) * Number(calculation.visualConfig.requestedPosition),
      )
    }
  })

  it('derives every missing equality quantity from the two displayed sides', () => {
    const templates = new Map(
      grade4MissionTemplates
        .filter((item) => item.unitId === GRADE4_EQUALITY_UNIT_ID)
        .map((item) => [item.id, item]),
    )

    expect(Array.from(templates.keys())).toEqual([
      'g4-eq-01', 'g4-eq-02', 'g4-eq-03', 'g4-eq-04', 'g4-eq-05',
      'g4-eq-06', 'g4-eq-07', 'g4-eq-08', 'g4-eq-09', 'g4-eq-10',
    ])

    for (let variant = 1; variant <= 9; variant += 1) {
      for (const template of templates.values()) {
        const mission = template.build(variant, variant)
        if (mission.choices) {
          expect(new Set(mission.choices).size, `${template.id} variant ${variant}`).toBe(4)
          expect(mission.choices.filter((choice) => choice === mission.correctAnswer), `${template.id} variant ${variant}`).toHaveLength(1)
        } else {
          expect(mission.correctAnswer, `${template.id} variant ${variant}`).toMatch(/^\d+$/)
        }
        expect(mission.visualConfig).not.toHaveProperty('missingValue')
        expect(mission.visualConfig).not.toHaveProperty('result')
      }

      const missingAddend = templates.get('g4-eq-01')!.build(variant, variant)
      expect(Number(missingAddend.correctAnswer)).toBe(
        Number(missingAddend.visualConfig.rightTotal) - Number(missingAddend.visualConfig.leftKnown),
      )

      const missingMinuend = templates.get('g4-eq-02')!.build(variant, variant)
      expect(Number(missingMinuend.correctAnswer)).toBe(
        Number(missingMinuend.visualConfig.rightTotal) + Number(missingMinuend.visualConfig.leftKnown),
      )

      const balancedBags = templates.get('g4-eq-05')!.build(variant, variant)
      expect(Number(balancedBags.correctAnswer)).toBe(
        Number(balancedBags.visualConfig.leftTotal) - Number(balancedBags.visualConfig.rightKnown),
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
