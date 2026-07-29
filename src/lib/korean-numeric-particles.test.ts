import { describe, expect, it } from 'vitest'

import { correctKoreanNumericParticles } from './korean-numeric-particles'

describe('Korean numeric particles', () => {
  it.each([
    ['77가 72보다 큽니다.', '77이 72보다 큽니다.'],
    ['6/12를 기약분수로 나타냅니다.', '6/12을 기약분수로 나타냅니다.'],
    ['10/8로 고칩니다.', '10/8으로 고칩니다.'],
    ['6를 더합니다.', '6을 더합니다.'],
    ['9을 더합니다.', '9를 더합니다.'],
    ['3 kg로 나타냅니다.', '3 kg으로 나타냅니다.'],
    ['5 cm으로 옮깁니다.', '5 cm로 옮깁니다.'],
    ['12 / 5으로 나눕니다.', '12 / 5으로 나눕니다.'],
    ['5이므로 다음 단계로 갑니다.', '5이므로 다음 단계로 갑니다.'],
  ])('%s', (input, expected) => {
    expect(correctKoreanNumericParticles(input)).toBe(expected)
  })
})
