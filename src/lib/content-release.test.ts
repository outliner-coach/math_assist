import { describe, expect, it } from 'vitest'

import { resolveContentReleaseId } from './content-release'

describe('content release IDs', () => {
  it('keeps Grade 5 stable and separates each released Grade 6 concept', () => {
    expect(resolveContentReleaseId(5, 'area-001')).toBe('grade5-static-v1')
    expect(resolveContentReleaseId(6, 'g6ratio-001')).toBe('grade6-ratio-v1')
    expect(resolveContentReleaseId(6, 'g6fractiondiv-001')).toBe('grade6-fraction-division-v1')
    expect(resolveContentReleaseId(6, 'g6fractiondecimal-001')).toBe('grade6-fraction-decimal-v1')
    expect(resolveContentReleaseId(6, 'g6decimaldiv-001')).toBe('grade6-decimal-division-v1')
    expect(resolveContentReleaseId(6, 'g6proportion-001')).toBe('grade6-proportion-v1')
    expect(resolveContentReleaseId(6, 'g6prismpyramid-001')).toBe('grade6-prism-pyramid-v1')
    expect(resolveContentReleaseId(6, 'g6roundsolid-001')).toBe('grade6-round-solid-v1')
    expect(resolveContentReleaseId(6, 'g6spatial-001')).toBe('grade6-spatial-reasoning-v1')
    expect(resolveContentReleaseId(6, 'g6circle-001')).toBe('grade6-circle-measurement-v1')
    expect(resolveContentReleaseId(6, 'g6volume-001')).toBe('grade6-surface-area-volume-v1')
    expect(resolveContentReleaseId(6, 'g6ratiograph-001')).toBe('grade6-ratio-graphs-v1')
  })

  it('fails closed for an unknown Grade 6 concept', () => {
    expect(() => resolveContentReleaseId(6, 'g6unknown-001')).toThrow(/알 수 없는 6학년 개념/)
  })
})
