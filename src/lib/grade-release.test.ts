import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  getCurriculumGradeReleaseState,
  isCurriculumGradeReleased,
} from './grade-release'

function response(value: unknown, ok = true): Response {
  return { ok, json: async () => value } as Response
}

describe('curriculum grade release gate', () => {
  it('opens only an explicitly released grade from the public ledger', async () => {
    const releasedFetch = vi.fn(async () => response({ releaseState: { grade6: 'released' } }))
    const candidateFetch = vi.fn(async () => response({ releaseState: { grade6: 'release-candidate' } }))

    await expect(isCurriculumGradeReleased(6, releasedFetch)).resolves.toBe(true)
    await expect(isCurriculumGradeReleased(6, candidateFetch)).resolves.toBe(false)
    expect(releasedFetch).toHaveBeenCalledWith('/data/curriculum-allocations-v1.json')
  })

  it('fails closed for fetch, JSON, schema, and unknown-state failures', async () => {
    await expect(isCurriculumGradeReleased(6, vi.fn(async () => response({}, false)))).resolves.toBe(false)
    await expect(isCurriculumGradeReleased(6, vi.fn(async () => response({ releaseState: {} })))).resolves.toBe(false)
    await expect(isCurriculumGradeReleased(6, vi.fn(async () => response({ releaseState: { grade6: 'preview' } })))).resolves.toBe(false)
    await expect(isCurriculumGradeReleased(6, vi.fn(async () => { throw new Error('offline') }))).resolves.toBe(false)
  })

  it('returns the reviewed candidate state without treating it as released', async () => {
    const fetchImpl = vi.fn(async () => response({ releaseState: { grade6: 'release-candidate' } }))

    await expect(getCurriculumGradeReleaseState(6, fetchImpl)).resolves.toBe('release-candidate')
  })

  it('opens the current public Grade 6 ledger after reviewed promotion', async () => {
    const ledger = JSON.parse(readFileSync(
      join(process.cwd(), 'public/data/curriculum-allocations-v1.json'),
      'utf8',
    ))
    const fetchImpl = vi.fn(async () => response(ledger))

    await expect(getCurriculumGradeReleaseState(6, fetchImpl)).resolves.toBe('released')
    await expect(isCurriculumGradeReleased(6, fetchImpl)).resolves.toBe(true)
  })
})
