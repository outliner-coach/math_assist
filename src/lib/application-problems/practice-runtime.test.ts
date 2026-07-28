import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { buildApprovedGrade5PracticeProblemCandidates } from './grade5-practice-runtime'
import { GRADE5_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade5-registry'
import { buildApprovedGrade6PracticeProblemCandidates } from './grade6-practice-runtime'
import { GRADE6_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade6-registry'
import { buildApprovedPracticeProblemCandidates } from './practice-runtime'
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
