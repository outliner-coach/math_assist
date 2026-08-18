import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { buildApprovedGrade5PracticeProblemCandidates } from './grade5-practice-runtime'
import { GRADE5_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade5-registry'
import { buildApprovedGrade6PracticeProblemCandidates } from './grade6-practice-runtime'
import { GRADE6_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade6-registry'
import {
  applicationSlotCount,
  buildApprovedPracticeProblemCandidates,
  planCognitiveDomainApplicationPlacements,
} from './practice-runtime'
import type { ApplicationProblemRegistryV1 } from './registry'

function source(relativePath: string): string {
  const path = join(process.cwd(), 'src/lib/application-problems', relativePath)
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

function workspaceSource(relativePath: string): string {
  const path = join(process.cwd(), relativePath)
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

function approved(registry: ApplicationProblemRegistryV1): ApplicationProblemRegistryV1 {
  const approveFamily = <T extends ApplicationProblemRegistryV1['releaseLedger'][number]>(
    family: T,
  ): T => ({
    ...family,
    releaseStatus: 'approved',
    approval: {
      ownerStatus: 'approved',
      ownerId: 'runtime-shard-test-owner',
      approvedAt: '2026-07-23T00:00:00.000Z',
      evidenceRefs: ['src/lib/application-problems/practice-runtime.test.ts'],
      expertStatus: 'not-reviewed',
    },
  })
  return {
    entries: registry.entries.map((entry) => ({
      ...entry,
      family: approveFamily(entry.family),
    })),
    releaseLedger: registry.releaseLedger.map(approveFamily),
  }
}

describe('practice application runtime shards', () => {
  it('keeps each grade registry out of the shared practice runtime', () => {
    const shared = source('practice-runtime.ts')
    const grade5 = source('grade5-practice-runtime.ts')
    const grade6 = source('grade6-practice-runtime.ts')

    expect(shared).not.toContain("from './grade5-registry'")
    expect(shared).not.toContain("from './grade6-registry'")
    expect(grade5).toContain("from './grade5-registry'")
    expect(grade5).not.toContain("from './grade6-registry'")
    expect(grade6).toContain("from './grade6-registry'")
    expect(grade6).not.toContain("from './grade5-registry'")
  })

  it('loads grade-specific candidate and renderer shards dynamically from the shared route', () => {
    const client = workspaceSource('src/app/practice/[conceptId]/PracticeClient.tsx')
    const visual = workspaceSource('src/components/ApplicationPracticeVisual.tsx')

    expect(client).not.toMatch(/^import .*grade[56]-practice-runtime/m)
    expect(client).toContain("import('@/lib/application-problems/grade5-practice-runtime')")
    expect(client).toContain("import('@/lib/application-problems/grade6-practice-runtime')")
    expect(visual).not.toMatch(/^import Grade[56]Application/m)
    expect(visual).toContain("import('./Grade5ApplicationGeometryVisual')")
    expect(visual).toContain("import('./Grade6ApplicationRatioVisual')")
  })

  it('keeps the shared compatibility API inert without an explicit registry', () => {
    expect(buildApprovedPracticeProblemCandidates({
      grade: 5,
      conceptId: 'area-001',
    })).toEqual([])
    expect(buildApprovedPracticeProblemCandidates({
      grade: 6,
      conceptId: 'g6ratio-001',
    })).toEqual([])
  })

  it('builds Grade 5 candidates through the Grade 5-only runtime shard', () => {
    expect(buildApprovedGrade5PracticeProblemCandidates({
      conceptId: 'area-001',
      registry: approved(GRADE5_APPLICATION_PROBLEM_REGISTRY_V1),
    }).map((candidate) => candidate.id)).toEqual([
      'g5-area-composite-inverse@1',
      'g5-area-overlap-reconstruction@1',
    ])
  })

  it('builds Grade 6 candidates through the Grade 6-only runtime shard', () => {
    expect(buildApprovedGrade6PracticeProblemCandidates({
      conceptId: 'g6ratio-001',
      registry: approved(GRADE6_APPLICATION_PROBLEM_REGISTRY_V1),
    }).map((candidate) => candidate.id)).toEqual([
      'g6-ratio-part-whole@1',
      'g6-ratio-relative-comparison@1',
      'g6-ratio-representation-check@1',
    ])
  })
})

describe('cognitive-domain-aware application placement', () => {
  const baseSlots = [
    { id: 'k1', cognitiveDomain: 'knowing' as const },
    { id: 'k2', cognitiveDomain: 'knowing' as const },
    { id: 'a1', cognitiveDomain: 'applying' as const },
    { id: 'a2', cognitiveDomain: 'applying' as const },
    { id: 'r1', cognitiveDomain: 'reasoning' as const },
  ]
  const applications = [
    { familyId: 'apply-one', version: 1, cognitiveDomain: 'applying' as const },
    { familyId: 'apply-two', version: 1, cognitiveDomain: 'applying' as const },
    { familyId: 'reason-one', version: 1, cognitiveDomain: 'reasoning' as const },
  ]

  it.each([
    [2, 'basic', 6, 1],
    [3, 'basic', 3, 1],
    [4, 'basic', 3, 1],
    [5, 'basic', 5, 1],
    [5, 'focused', 10, 2],
    [6, 'basic', 5, 1],
    [6, 'focused', 10, 2],
  ] as const)('requires Grade %s %s sessions to have %s total and %s application slots', (
    grade,
    mode,
    sessionCount,
    expectedApplications,
  ) => {
    expect(applicationSlotCount({ grade, mode, sessionCount })).toBe(expectedApplications)
  })

  it('replaces only matching applying/reasoning slots and preserves length and K/A/R counts', () => {
    const result = planCognitiveDomainApplicationPlacements({
      grade: 5,
      mode: 'basic',
      sessionCount: 5,
      baseSlots,
      applications,
      rotationSeed: 0,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.slots).toHaveLength(5)
    expect(result.slots.filter((slot) => slot.kind === 'application')).toHaveLength(1)
    expect(result.slots.find((slot) => slot.baseSlotId === 'k1')?.kind).toBe('base')
    expect(result.slots.find((slot) => slot.baseSlotId === 'k2')?.kind).toBe('base')
    expect(result.slots.map((slot) => slot.cognitiveDomain).sort()).toEqual(
      baseSlots.map((slot) => slot.cognitiveDomain).sort(),
    )
    expect(result.slots.filter((slot) => slot.kind === 'application').every(
      (slot) => slot.application?.cognitiveDomain === slot.cognitiveDomain,
    )).toBe(true)
  })

  it('fails atomically when all required slots cannot be filled safely', () => {
    const result = planCognitiveDomainApplicationPlacements({
      grade: 5,
      mode: 'focused',
      sessionCount: 10,
      baseSlots: [...baseSlots, ...baseSlots],
      applications: [applications[0]],
      rotationSeed: 0,
    })

    expect(result).toEqual({
      ok: false,
      code: 'insufficient_safe_application_slots',
      requiredApplicationCount: 2,
    })
    expect('slots' in result).toBe(false)
  })

  it('rotates deterministically so eligible families are not permanently starved', () => {
    const selected = [0, 1, 2].map((rotationSeed) => {
      const result = planCognitiveDomainApplicationPlacements({
        grade: 5,
        mode: 'basic',
        sessionCount: 5,
        baseSlots,
        applications,
        rotationSeed,
      })
      expect(result.ok).toBe(true)
      return result.ok
        ? result.slots.find((slot) => slot.kind === 'application')?.application?.familyId
        : undefined
    })

    expect(selected).toEqual(['apply-one', 'apply-two', 'reason-one'])
    const repeated = planCognitiveDomainApplicationPlacements({
      grade: 5,
      mode: 'basic',
      sessionCount: 5,
      baseSlots,
      applications,
      rotationSeed: 1,
    })
    expect(repeated.ok && repeated.slots.find((slot) => slot.kind === 'application')?.application?.familyId)
      .toBe('apply-two')
  })
})
