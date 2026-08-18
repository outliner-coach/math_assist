// @vitest-environment jsdom

import * as React from 'react'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GRADE2_APPLICATION_PROBLEM_REGISTRY_V1 } from '@/lib/application-problems/grade2-registry'
import type { Grade2ApplicationMissionV1 } from '@/lib/application-problems/grade2-adapter'
import { buildApprovedGrade2ApplicationMissions } from '@/lib/application-problems/grade2-runtime'
import type { ApplicationProblemRegistryV1 } from '@/lib/application-problems/registry'
import type { Grade2Mission } from '@/lib/grade2-problems'
import {
  GRADE2_PROGRESS_KEY,
  GRADE2_PROGRESS_RECOVERY_EVIDENCE_KEY,
  activateGrade2ApplicationMissionSnapshot,
  createInitialGrade2Progress,
  recordGrade2Attempt,
} from '@/lib/grade2-progress'

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    createElement('a', props, children),
}))

vi.mock('@/components/grade2', () => ({
  Grade2MissionCard: ({ mission }: { mission: Grade2Mission }) => createElement('div', {
    'data-testid': 'mock-grade2-mission-card',
    'data-mission-id': mission.id,
    'data-instance-id': (mission as Partial<Grade2ApplicationMissionV1>).applicationSource?.instanceId,
  }),
}))

vi.mock('@/components/adventure', () => ({
  AdventureProgressPanel: () => null,
}))

vi.mock('@/components', () => ({
  ScratchPad: () => null,
}))

import Grade2GameClient from './Grade2GameClient'
import Grade2UnitSelectionClient from './Grade2UnitSelectionClient'

function approvedRegistry(): ApplicationProblemRegistryV1 {
  const approveFamily = <T extends ApplicationProblemRegistryV1['releaseLedger'][number]>(
    family: T,
  ): T => family.familyId === 'g2-length-route-total'
    ? {
        ...family,
        releaseStatus: 'approved' as const,
        approval: {
          ownerStatus: 'approved' as const,
          ownerId: 'grade2-client-test-owner',
          approvedAt: '2026-07-23T00:00:00.000Z',
          evidenceRefs: ['src/app/grade/2/Grade2GameClient.application.test.ts'],
          expertStatus: 'not-reviewed' as const,
        },
      }
    : family
  return {
    entries: GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry) => ({
      ...entry,
      family: approveFamily(entry.family),
    })),
    releaseLedger: GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger.map(approveFamily),
  }
}

function approvedApplicationMission(seed = 42): Grade2ApplicationMissionV1 {
  return buildApprovedGrade2ApplicationMissions(seed, approvedRegistry())[0]
}

function quarantinedRegistry(familyId: string): ApplicationProblemRegistryV1 {
  const quarantineFamily = <T extends ApplicationProblemRegistryV1['releaseLedger'][number]>(
    family: T,
  ): T => family.familyId === familyId
    ? { ...family, releaseStatus: 'quarantined' as const }
    : family
  return {
    entries: GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry) => ({
      ...entry,
      family: quarantineFamily(entry.family),
    })),
    releaseLedger: GRADE2_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger.map(quarantineFamily),
  }
}

describe('Grade 2 application learning boundary', () => {
  let container: HTMLDivElement
  let root: Root | null
  let storageData: Map<string, string>

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    vi.stubGlobal('React', React)
    storageData = new Map()
    const storage = {
      getItem: (key: string) => storageData.get(key) ?? null,
      setItem: (key: string, value: string) => storageData.set(key, value),
      removeItem: (key: string) => storageData.delete(key),
    }
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage })
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    if (root) await act(async () => root?.unmount())
    root = null
    container.remove()
    vi.unstubAllGlobals()
  })

  it('restores a stored application mission and earned reward after it leaves new generation', async () => {
    const mission = approvedApplicationMission()
    const completed = recordGrade2Attempt(activateGrade2ApplicationMissionSnapshot(
      createInitialGrade2Progress(100),
      mission,
    ), mission, true, {
      now: 200,
      variantKey: `${mission.id}:${mission.applicationSource.instanceId}`,
    })
    storageData.set(GRADE2_PROGRESS_KEY, JSON.stringify(completed))

    await act(async () => {
      root?.render(createElement(Grade2GameClient, {
        initialUnitId: 'g2-2-length',
        initialMode: 'practice',
        applicationProblemRegistry: approvedRegistry(),
      }))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="mock-grade2-mission-card"]')?.getAttribute('data-mission-id'))
      .toBe(mission.id)
    expect(container.querySelector('[data-testid="grade2-reward-measureTape"]')?.textContent)
      .toContain('1개')
    expect(JSON.parse(storageData.get(GRADE2_PROGRESS_KEY) ?? 'null').latestMissionId)
      .toBe(mission.id)
  })

  it('shows a safe error and saves nothing when mission generation is exhausted', async () => {
    await act(async () => {
      root?.render(createElement(Grade2GameClient, {
        initialUnitId: 'g2-2-length',
        initialMode: 'practice',
        applicationMissionProvider: () => {
          throw new Error('all seeds failed')
        },
      }))
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="grade2-application-generation-error"]')).not.toBeNull()
    expect(storageData.has(GRADE2_PROGRESS_KEY)).toBe(false)
  })

  it('also catches generation exhaustion on the unit-selection route', async () => {
    await act(async () => {
      root?.render(createElement(Grade2UnitSelectionClient, {
        applicationMissionProvider: () => {
          throw new Error('all seeds failed')
        },
      }))
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="grade2-application-generation-error"]')).not.toBeNull()
    expect(storageData.has(GRADE2_PROGRESS_KEY)).toBe(false)
  })

  it('archives an application mission when it is selected before the first answer', async () => {
    const mission = approvedApplicationMission()
    await act(async () => {
      root?.render(createElement(Grade2GameClient, {
        initialUnitId: 'g2-2-length',
        initialMode: 'practice',
        applicationMissionProvider: () => [mission],
        applicationProblemRegistry: approvedRegistry(),
      }))
      await Promise.resolve()
      await Promise.resolve()
    })

    await act(async () => {
      ;(container.querySelector(
        `[data-testid="grade2-mission-node-${mission.unitMissionOrder}"]`,
      ) as HTMLButtonElement)
        .dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
      await Promise.resolve()
    })

    const stored = JSON.parse(storageData.get(GRADE2_PROGRESS_KEY) ?? 'null')
    const instanceId = stored.activeApplicationInstanceIdByMissionId[mission.id]
    expect(instanceId).toBeTruthy()
    expect(stored.applicationMissionSnapshotsByInstanceId[instanceId]).toMatchObject({
      id: mission.id,
    })
  })

  it('replaces a blocked unsolved instance explicitly without deleting its evidence', async () => {
    const damagedMission = approvedApplicationMission(42)
    const replacementMission = approvedApplicationMission(999)
    const activated = activateGrade2ApplicationMissionSnapshot(
      createInitialGrade2Progress(100),
      damagedMission,
    )
    const damagedInstanceId = damagedMission.applicationSource.instanceId
    const damagedRaw = JSON.stringify({
      ...activated,
      latestMissionId: damagedMission.id,
      selectedUnitId: damagedMission.unitId,
      applicationMissionSnapshotsByInstanceId: {
        ...activated.applicationMissionSnapshotsByInstanceId,
        [damagedInstanceId]: { ...damagedMission, correctAnswer: '999cm' },
      },
    })
    storageData.set(GRADE2_PROGRESS_KEY, damagedRaw)

    await act(async () => {
      root?.render(createElement(Grade2GameClient, {
        initialUnitId: 'g2-2-length',
        initialMode: 'practice',
        applicationMissionProvider: () => [replacementMission],
        applicationProblemRegistry: approvedRegistry(),
      }))
      await Promise.resolve()
      await Promise.resolve()
    })

    const replaceButton = container.querySelector(
      '[data-testid="grade2-replace-blocked-application"]',
    ) as HTMLButtonElement
    expect(replaceButton).not.toBeNull()

    await act(async () => {
      replaceButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
      await Promise.resolve()
    })

    const stored = JSON.parse(storageData.get(GRADE2_PROGRESS_KEY) ?? 'null')
    expect(stored.applicationMissionSnapshotsByInstanceId[damagedInstanceId])
      .toBeUndefined()
    expect(stored.activeApplicationInstanceIdByMissionId[damagedMission.id])
      .toBe(replacementMission.applicationSource.instanceId)
    expect(stored.applicationMissionSnapshotsByInstanceId[replacementMission.applicationSource.instanceId])
      .toEqual(replacementMission)
    expect(JSON.parse(storageData.get(GRADE2_PROGRESS_RECOVERY_EVIDENCE_KEY) ?? 'null'))
      .toEqual({ schemaVersion: 1, damagedProgressSources: [damagedRaw] })
  })

  it('keeps a completed application reward on its canonical shell while recovery is blocked', async () => {
    const mission = approvedApplicationMission(42)
    const completed = recordGrade2Attempt(
      activateGrade2ApplicationMissionSnapshot(createInitialGrade2Progress(100), mission),
      mission,
      true,
      { now: 200 },
    )
    const instanceId = mission.applicationSource.instanceId
    storageData.set(GRADE2_PROGRESS_KEY, JSON.stringify({
      ...completed,
      applicationMissionSnapshotsByInstanceId: {
        ...completed.applicationMissionSnapshotsByInstanceId,
        [instanceId]: { ...mission, rewardId: 'clockStar' },
      },
    }))

    await act(async () => {
      root?.render(createElement(Grade2GameClient, {
        initialUnitId: 'g2-2-length',
        initialMode: 'practice',
        applicationMissionProvider: () => [mission],
        applicationProblemRegistry: approvedRegistry(),
      }))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="grade2-blocked-application-replacement"]'))
      .not.toBeNull()
    expect(container.querySelector('[data-testid="grade2-reward-measureTape"]')?.textContent)
      .toContain('1개')
    expect(container.querySelector('[data-testid="grade2-reward-clockStar"]')?.textContent)
      .toContain('0개')
  })

  it('hides a quarantined problem and preserves progress when no higher approved replacement exists', async () => {
    const mission = approvedApplicationMission(42)
    const activated = activateGrade2ApplicationMissionSnapshot(
      createInitialGrade2Progress(100),
      mission,
    )
    const storedProgress = {
      ...activated,
      latestMissionId: mission.id,
      selectedUnitId: mission.unitId,
    }
    const raw = JSON.stringify(storedProgress)
    storageData.set(GRADE2_PROGRESS_KEY, raw)

    await act(async () => {
      root?.render(createElement(Grade2GameClient, {
        initialUnitId: 'g2-2-length',
        initialMode: 'practice',
        applicationProblemRegistry: quarantinedRegistry(mission.applicationSource.familyId),
      }))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="grade2-blocked-application-replacement"]'))
      .not.toBeNull()
    expect(container.querySelector('[data-testid="grade2-replace-blocked-application"]'))
      .toBeNull()
    expect(container.querySelector('[data-testid="mock-grade2-mission-card"]'))
      .toBeNull()
    expect(container.textContent).not.toContain(mission.prompt)
    expect(storageData.get(GRADE2_PROGRESS_KEY)).toBe(raw)
  })
})
