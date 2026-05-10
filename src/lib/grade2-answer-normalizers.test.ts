import { describe, expect, it } from 'vitest'

import {
  checkGrade2Answer,
  normalizeGrade2DurationAnswer,
  normalizeGrade2LengthAnswer,
  normalizeGrade2TimeOfDayAnswer,
} from './grade2-answer-normalizers'

describe('grade2 answer normalizers', () => {
  it('normalizes equivalent length answers to centimeters', () => {
    expect(normalizeGrade2LengthAnswer('120cm')).toMatchObject({ ok: true, value: 120 })
    expect(normalizeGrade2LengthAnswer('1m 20cm')).toMatchObject({ ok: true, value: 120 })
    expect(normalizeGrade2LengthAnswer({ meters: '1', centimeters: '20' })).toMatchObject({
      ok: true,
      value: 120,
    })
  })

  it('blocks invalid structured length input before grading', () => {
    expect(normalizeGrade2LengthAnswer({ meters: '', centimeters: '' })).toMatchObject({
      ok: false,
    })
    expect(normalizeGrade2LengthAnswer({ meters: '1', centimeters: '100' })).toMatchObject({
      ok: false,
      error: expect.stringContaining('100보다 작은'),
    })
    expect(normalizeGrade2LengthAnswer({ meters: '-1', centimeters: '20' })).toMatchObject({
      ok: false,
    })
  })

  it('keeps time-of-day separate from duration', () => {
    expect(normalizeGrade2TimeOfDayAnswer('3:25')).toMatchObject({ ok: true, value: 205 })
    expect(normalizeGrade2TimeOfDayAnswer('3시 25분')).toMatchObject({
      ok: true,
      value: 205,
    })
    expect(normalizeGrade2DurationAnswer('3시간 25분')).toMatchObject({
      ok: true,
      value: 205,
    })
    expect(normalizeGrade2TimeOfDayAnswer('3시간 25분')).toMatchObject({ ok: false })
  })

  it('validates minute ranges for structured time inputs', () => {
    expect(normalizeGrade2TimeOfDayAnswer({ hours: '3', minutes: '60' })).toMatchObject({
      ok: false,
    })
    expect(normalizeGrade2DurationAnswer({ hours: '1', minutes: '60' })).toMatchObject({
      ok: false,
    })
  })

  it('checks grade2 answers through the matching answer type', () => {
    expect(checkGrade2Answer('length', { meters: '1', centimeters: '20' }, '120cm')).toMatchObject({
      ok: true,
      correct: true,
    })
    expect(checkGrade2Answer('time-of-day', { hours: '3', minutes: '25' }, '3:25')).toMatchObject({
      ok: true,
      correct: true,
    })
    expect(checkGrade2Answer('duration', { hours: '3', minutes: '25' }, '3시간 25분')).toMatchObject({
      ok: true,
      correct: true,
    })
  })
})
