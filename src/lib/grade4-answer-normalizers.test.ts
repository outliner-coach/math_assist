import { describe, expect, it } from 'vitest'

import { checkGrade4Answer } from './grade4-answer-normalizers'

describe('Grade 4 answer normalization', () => {
  it('accepts full signed integer strings and equivalent surrounding whitespace', () => {
    expect(checkGrade4Answer('integer', ' 430000 ', '430000')).toEqual({ ok: true, correct: true })
    expect(checkGrade4Answer('integer', '-12', '-12')).toEqual({ ok: true, correct: true })
  })

  it('separates incomplete or partial numeric input from a mathematical wrong answer', () => {
    expect(checkGrade4Answer('integer', '', '430000')).toMatchObject({ ok: false })
    expect(checkGrade4Answer('integer', '-', '430000')).toMatchObject({ ok: false })
    expect(checkGrade4Answer('integer', '430000원', '430000')).toMatchObject({ ok: false })
    expect(checkGrade4Answer('integer', '430001', '430000')).toEqual({ ok: true, correct: false })
  })

  it('grades choices by exact declared value without natural-language inference', () => {
    expect(checkGrade4Answer('choice', '453000', '453000')).toEqual({ ok: true, correct: true })
    expect(checkGrade4Answer('choice', '왼쪽', '오른쪽')).toEqual({ ok: true, correct: false })
  })

  it('compares decimals exactly while keeping incomplete decimal input unrecorded', () => {
    expect(checkGrade4Answer('decimal', ' 0.70 ', '0.7')).toEqual({ ok: true, correct: true })
    expect(checkGrade4Answer('decimal', '2.609', '2.609')).toEqual({ ok: true, correct: true })
    expect(checkGrade4Answer('decimal', '2.608', '2.609')).toEqual({ ok: true, correct: false })
    expect(checkGrade4Answer('decimal', '.', '0.7')).toMatchObject({ ok: false })
    expect(checkGrade4Answer('decimal', '0.', '0.7')).toMatchObject({ ok: false })
    expect(checkGrade4Answer('decimal', '-', '0.7')).toMatchObject({ ok: false })
  })

  it('compares equivalent fractions and mixed numbers while rejecting incomplete forms', () => {
    expect(checkGrade4Answer('fraction', ' 4/6 ', '2/3')).toEqual({ ok: true, correct: true })
    expect(checkGrade4Answer('fraction', '7/5', '1 2/5')).toEqual({ ok: true, correct: true })
    expect(checkGrade4Answer('fraction', '1 3/5', '1 2/5')).toEqual({ ok: true, correct: false })
    expect(checkGrade4Answer('fraction', '1/', '2/3')).toMatchObject({ ok: false })
    expect(checkGrade4Answer('fraction', '1 1/', '6/5')).toMatchObject({ ok: false })
    expect(checkGrade4Answer('fraction', '2/0', '2/3')).toMatchObject({ ok: false })
  })
})
