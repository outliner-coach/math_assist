import { describe, expect, it } from 'vitest'

import {
  advanceMissionSketchRun,
  createMissionSketchKey,
  normalizeMissionSketchRunOrdinal,
  resolveMissionSketchStatus,
} from './mission-sketch-identity'

describe.each([1, 2, 3] as const)('Grade %i mission sketch identity', (grade) => {
  it('is stable for reload and isolates another item or restarted run', () => {
    const input = {
      grade,
      sessionRunKey: 'run-7',
      missionId: 'mission-01',
      variantKey: 'variant-a',
    }
    const first = createMissionSketchKey(input)

    expect(createMissionSketchKey({ ...input })).toEqual(first)
    expect(createMissionSketchKey({ ...input, missionId: 'mission-02' })).not.toEqual(first)
    expect(createMissionSketchKey({ ...input, sessionRunKey: 'run-8' })).not.toEqual(first)
    expect(first.learnerId).toBeNull()
  })
})

it('makes completed and expired mission sketches read-only', () => {
  expect(resolveMissionSketchStatus({ completed: false, now: 100 })).toBe('active')
  expect(resolveMissionSketchStatus({ completed: true, now: 100 })).toBe('completed')
  expect(resolveMissionSketchStatus({ completed: false, expiresAt: 99, now: 100 })).toBe('expired')
  expect(resolveMissionSketchStatus({ completed: true, expiresAt: 101, now: 100 })).toBe('completed')
})

it('rejects an incomplete persistent identity', () => {
  expect(() => createMissionSketchKey({
    grade: 1,
    sessionRunKey: '',
    missionId: 'mission-01',
    variantKey: 'variant-a',
  })).toThrow(/sessionRunKey/)
})

it('normalizes legacy run state and advances without mutating other progress fields', () => {
  expect(normalizeMissionSketchRunOrdinal(undefined)).toBe(0)
  expect(normalizeMissionSketchRunOrdinal(-1)).toBe(0)
  expect(normalizeMissionSketchRunOrdinal(1.5)).toBe(0)

  const progress = { completedMissionIds: ['mission-01'], missionSketchRunOrdinal: 7 }
  expect(advanceMissionSketchRun(progress)).toEqual({
    completedMissionIds: ['mission-01'],
    missionSketchRunOrdinal: 8,
  })
  expect(progress.missionSketchRunOrdinal).toBe(7)
})
