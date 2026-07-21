import { describe, expect, it } from 'vitest'

import { resolveExperiencePreset } from './experience-preset'

describe('experience preset resolver', () => {
  it.each([
    [1, 'play', 1, 1, 3, 'full', 'mission', 'low'],
    [2, 'play', 1, 1, 3, 'full', 'mission', 'low'],
    [3, 'bridge', 3, 3, 5, 'companion', 'chapter', 'medium'],
    [4, 'bridge', 3, 3, 5, 'companion', 'chapter', 'medium'],
    [5, 'study', 5, 5, 10, 'coach', 'mastery', 'high'],
    [6, 'study', 5, 5, 10, 'coach', 'mastery', 'high'],
  ] as const)(
    'resolves Grade %i to the age-appropriate presentation contract',
    (grade, ageBand, minItems, defaultItems, maxItems, mascotMode, rewardCadence, textDensity) => {
      expect(resolveExperiencePreset(grade)).toEqual({
        ageBand,
        minItems,
        defaultItems,
        maxItems,
        mascotMode,
        rewardCadence,
        textDensity,
        baseScratchTools: ['pen', 'eraser', 'undo', 'clear'],
        supportToolLimit: 1,
      })
    },
  )

  it('returns stable frozen contracts and rejects unsupported grades', () => {
    const preset = resolveExperiencePreset(5)

    expect(resolveExperiencePreset(5)).toBe(preset)
    expect(Object.isFrozen(preset)).toBe(true)
    expect(Object.isFrozen(preset.baseScratchTools)).toBe(true)
    expect(() => resolveExperiencePreset(0)).toThrow(RangeError)
    expect(() => resolveExperiencePreset(7)).toThrow(RangeError)
  })
})
