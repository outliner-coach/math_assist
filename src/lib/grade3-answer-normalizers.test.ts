import { describe, expect, it } from 'vitest'

import {
  checkGrade3Answer,
  normalizeGrade3AngleAnswer,
  normalizeGrade3CapacityAnswer,
  normalizeGrade3DurationAnswer,
  normalizeGrade3FractionAnswer,
  normalizeGrade3LengthAnswer,
  normalizeGrade3TimeOfDayAnswer,
  normalizeGrade3WeightAnswer,
} from './grade3-answer-normalizers'

describe('grade3 answer normalizers', () => {
  it('normalizes structured fraction answers and rejects invalid denominators', () => {
    expect(normalizeGrade3FractionAnswer({ numerator: '2', denominator: '5' })).toMatchObject({
      ok: true,
      value: '2/5',
    })
    expect(normalizeGrade3FractionAnswer('2/4')).toMatchObject({ ok: true, value: '1/2' })
    expect(normalizeGrade3FractionAnswer({ numerator: '1', denominator: '0' })).toMatchObject({
      ok: false,
    })
  })

  it('normalizes length, capacity, and weight with bounded smaller-unit fields', () => {
    expect(normalizeGrade3LengthAnswer({ centimeters: '4', millimeters: '7' })).toMatchObject({
      ok: true,
      value: 47,
    })
    expect(normalizeGrade3LengthAnswer({ kilometers: '1', meters: '20' })).toMatchObject({
      ok: true,
      value: 1020000,
    })
    expect(normalizeGrade3LengthAnswer({ centimeters: '4', millimeters: '10' })).toMatchObject({
      ok: false,
    })
    expect(normalizeGrade3CapacityAnswer({ liters: '1', milliliters: '250' })).toMatchObject({
      ok: true,
      value: 1250,
    })
    expect(normalizeGrade3CapacityAnswer({ liters: '1', milliliters: '1000' })).toMatchObject({
      ok: false,
    })
    expect(normalizeGrade3WeightAnswer({ kilograms: '2', grams: '300' })).toMatchObject({
      ok: true,
      value: 2300,
    })
    expect(normalizeGrade3WeightAnswer({ kilograms: '2', grams: '1000' })).toMatchObject({
      ok: false,
    })
  })

  it('normalizes time with seconds and separates time-of-day from duration', () => {
    expect(normalizeGrade3TimeOfDayAnswer({ hours: '3', minutes: '25', seconds: '40' })).toMatchObject({
      ok: true,
      value: 12340,
    })
    expect(normalizeGrade3TimeOfDayAnswer({ hours: '3', minutes: '25', seconds: '60' })).toMatchObject({
      ok: false,
    })
    expect(normalizeGrade3DurationAnswer({ hours: '', minutes: '2', seconds: '50' })).toMatchObject({
      ok: true,
      value: 170,
    })
    expect(normalizeGrade3DurationAnswer({ hours: '', minutes: '2', seconds: '60' })).toMatchObject({
      ok: false,
    })
  })

  it('normalizes angles and checks answers through matching answer type', () => {
    expect(normalizeGrade3AngleAnswer('120도')).toMatchObject({ ok: true, value: 120 })
    expect(normalizeGrade3AngleAnswer('361')).toMatchObject({ ok: false })
    expect(checkGrade3Answer('fraction', { numerator: '2', denominator: '4' }, '1/2')).toMatchObject({
      ok: true,
      correct: true,
    })
    expect(checkGrade3Answer('capacity', { liters: '1', milliliters: '900' }, '1L900mL')).toMatchObject({
      ok: true,
      correct: true,
    })
    expect(checkGrade3Answer('angle', '120', '120도')).toMatchObject({
      ok: true,
      correct: true,
    })
  })
})
