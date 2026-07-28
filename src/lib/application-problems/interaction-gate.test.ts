import { describe, expect, it } from 'vitest'

import { getAdventureVariantKey } from '../adventure-progression'
import type { Grade2Mission } from '../grade2-problems'
import type { Problem } from '../types'
import {
  adaptGeneratedApplicationProblemToGrade2,
  type Grade2ApplicationMissionV1,
} from './grade2-adapter'
import { GRADE2_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade2-registry'
import {
  grade2MissionVariantSignature,
  resolveGrade2MissionInteraction,
} from './grade2-interaction-gate'
import {
  generateG2LengthMissingSegment,
} from './families/g2-length-missing-segment'
import {
  generateG5PerimeterBoundaryRebuildProblem,
} from './families/grade5-geometry-families'
import { generateG6RatioPartWhole } from './families/g6-ratio'
import { GRADE5_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade5-registry'
import { resolveGrade5ApplicationGeometryVisual } from './grade5-visual-resolution'
import { GRADE6_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade6-registry'
import {
  resolveGrade6ApplicationRatioProblem,
  resolveGrade6ApplicationRatioVisual,
} from './grade6-visual-resolution'
import { canGradePracticeProblem } from './practice-interaction-gate'
import type { ApplicationProblemRegistryV1 } from './registry'
import { adaptGeneratedApplicationProblemToPractice } from './template-adapter'

function grade2Mission(seed: number): Grade2ApplicationMissionV1 {
  const generated = generateG2LengthMissingSegment({ seed, variantIndex: 0 })
  return adaptGeneratedApplicationProblemToGrade2({
    shell: {
      id: 'g2-2-length-application-missing-segment-v1',
      unitId: 'g2-2-length',
      semester: '2-2',
      stageOrder: 146,
      unitMissionOrder: 14,
      skill: 'length',
      difficultyStep: 'applied',
      curriculumCode: '[2수03-13]',
      learnerGoal: '전체 길이에서 아는 부분을 빼어 빠진 길이를 구해요.',
      parentSummaryTag: 'length-missing-application',
      prompt: '준비 중',
      answerType: 'length',
      answerConfig: { kind: 'length', unit: 'cm', inputLabel: '길이를 cm로 써요' },
      params: {},
      correctAnswer: '1cm',
      visualModel: 'length-bars',
      visualConfig: { leftLabel: '길이', leftCm: 1, rightLabel: '길이', rightCm: 1 },
      hintSteps: ['힌트'],
      solutionSteps: ['풀이'],
      rewardId: 'measureTape',
    },
    problem: generated,
    mapAnswer: ({ answer }) => `${answer.normalized}cm`,
  })
}

function practiceProblem(
  generated:
    | ReturnType<typeof generateG5PerimeterBoundaryRebuildProblem>
    | ReturnType<typeof generateG6RatioPartWhole>,
  difficulty: 1 | 2 | 3,
): Problem {
  return adaptGeneratedApplicationProblemToPractice({
    problem: generated,
    placement: {
      index: 0,
      templateId: `application-${generated.familyId}-v1`,
      setId: 'A',
      difficulty,
    },
    mapParams: (params) => Object.fromEntries(
      Object.entries(params).filter(
        (entry): entry is [string, number] => typeof entry[1] === 'number',
      ),
    ),
  })
}

function withReleaseStatus(
  registry: ApplicationProblemRegistryV1,
  familyId: string,
  releaseStatus: 'approved' | 'draft' | 'quarantined' | 'retired',
): ApplicationProblemRegistryV1 {
  const updateFamily = <T extends ApplicationProblemRegistryV1['entries'][number]['family']>(
    family: T,
  ): T => family.familyId === familyId
    ? {
        ...family,
        releaseStatus,
        ...(releaseStatus === 'approved'
          ? {
              approval: {
                ownerStatus: 'approved' as const,
                ownerId: 'interaction-gate-test-owner',
                approvedAt: '2026-07-23T00:00:00.000Z',
                evidenceRefs: ['src/lib/application-problems/interaction-gate.test.ts'],
                expertStatus: 'not-reviewed' as const,
              },
            }
          : {}),
      }
    : family
  return {
    entries: registry.entries.map((entry) => ({
      ...entry,
      family: updateFamily(entry.family),
    })),
    releaseLedger: registry.releaseLedger.map(updateFamily),
  }
}

describe('application interaction gates', () => {
  it('preserves the legacy Grade 2 fingerprint but includes the canonical application visual', () => {
    const legacy = {
      ...grade2Mission(0),
      applicationSource: undefined,
      applicationParams: undefined,
      applicationVisual: undefined,
    } as unknown as Grade2Mission
    const legacySignature = JSON.stringify([
      legacy.prompt,
      legacy.correctAnswer,
      legacy.choices,
      legacy.visualConfig,
    ])
    const variants = [0, 1, 2].map(grade2Mission)

    expect(grade2MissionVariantSignature(legacy)).toBe(legacySignature)
    expect(variants.map((mission) => mission.prompt)).toEqual([
      variants[0].prompt,
      variants[0].prompt,
      variants[0].prompt,
    ])
    expect(variants.map((mission) => mission.correctAnswer)).toEqual([
      variants[0].correctAnswer,
      variants[0].correctAnswer,
      variants[0].correctAnswer,
    ])
    expect(new Set(variants.map((mission) => getAdventureVariantKey(
      mission.id,
      grade2MissionVariantSignature(mission),
    ))).size).toBe(3)
  })

  it('blocks malformed Grade 2 required visuals before answer submission', () => {
    const mission = grade2Mission(0) as Grade2Mission & { applicationVisual?: unknown }
    delete mission.applicationVisual

    expect(resolveGrade2MissionInteraction(mission)).toBe('blocked')

    const wrongAnswer = {
      ...grade2Mission(0),
      correctAnswer: '999cm',
    }
    expect(resolveGrade2MissionInteraction(wrongAnswer)).toBe('blocked')
  })

  it('blocks a Grade 2 snapshot whose source identity was moved to another seed', () => {
    const mission = grade2Mission(0)
    const approvedRegistry = withReleaseStatus(
      GRADE2_APPLICATION_PROBLEM_REGISTRY_V1,
      mission.applicationSource.familyId,
      'approved',
    )
    const forgedSeed = 1
    const forged = {
      ...mission,
      applicationSource: {
        ...mission.applicationSource,
        seed: forgedSeed,
        instanceId: `${mission.applicationSource.familyId}@${mission.applicationSource.generatorVersion}:${forgedSeed}:${mission.applicationSource.variantIndex}`,
      },
    }

    expect(resolveGrade2MissionInteraction(mission, approvedRegistry)).toBe('ready')
    expect(resolveGrade2MissionInteraction(forged, approvedRegistry)).toBe('blocked')
  })

  it('blocks every mutation of the immutable Grade 2 mission shell', () => {
    const mission = grade2Mission(0)
    const approvedRegistry = withReleaseStatus(
      GRADE2_APPLICATION_PROBLEM_REGISTRY_V1,
      mission.applicationSource.familyId,
      'approved',
    )
    const mutations: Array<{
      field: string
      apply(candidate: Record<string, unknown>): void
    }> = [
      { field: 'unitId', apply: (candidate) => { candidate.unitId = 'g2-2-time' } },
      { field: 'semester', apply: (candidate) => { candidate.semester = '2-1' } },
      { field: 'stageOrder', apply: (candidate) => { candidate.stageOrder = 999 } },
      { field: 'unitMissionOrder', apply: (candidate) => { candidate.unitMissionOrder = 99 } },
      { field: 'skill', apply: (candidate) => { candidate.skill = 'time' } },
      { field: 'difficultyStep', apply: (candidate) => { candidate.difficultyStep = 'easy' } },
      { field: 'curriculumCode', apply: (candidate) => { candidate.curriculumCode = '[2수03-08]' } },
      { field: 'learnerGoal', apply: (candidate) => { candidate.learnerGoal = '다른 목표' } },
      { field: 'parentSummaryTag', apply: (candidate) => { candidate.parentSummaryTag = 'other-tag' } },
      { field: 'answerType', apply: (candidate) => { candidate.answerType = 'number' } },
      { field: 'answerConfig', apply: (candidate) => {
        candidate.answerConfig = { kind: 'length', unit: 'cm', inputLabel: '다른 입력' }
      } },
      { field: 'params', apply: (candidate) => { candidate.params = { legacy: 1 } } },
      { field: 'visualModel', apply: (candidate) => { candidate.visualModel = 'ruler-line' } },
      { field: 'visualConfig', apply: (candidate) => {
        candidate.visualConfig = {
          leftLabel: '길이',
          leftCm: 1,
          rightLabel: '길이',
          rightCm: 2,
        }
      } },
      { field: 'rewardId', apply: (candidate) => { candidate.rewardId = 'clockStar' } },
    ]

    expect(resolveGrade2MissionInteraction(mission, approvedRegistry)).toBe('ready')
    for (const mutation of mutations) {
      const candidate = JSON.parse(JSON.stringify(mission)) as Record<string, unknown>
      mutation.apply(candidate)
      expect(
        resolveGrade2MissionInteraction(candidate as unknown as Grade2Mission, approvedRegistry),
        mutation.field,
      ).toBe('blocked')
    }
  })

  it('uses approved production defaults while blocking quarantine and preserving retirement', () => {
    const grade2 = grade2Mission(0)
    const grade5 = generateG5PerimeterBoundaryRebuildProblem({ seed: 0, variantIndex: 0 })
    const grade6 = generateG6RatioPartWhole({ seed: 0, variantIndex: 0 })
    const approvedGrade2Registry = withReleaseStatus(
      GRADE2_APPLICATION_PROBLEM_REGISTRY_V1,
      grade2.applicationSource.familyId,
      'approved',
    )

    expect(resolveGrade2MissionInteraction(grade2)).toBe('ready')
    expect(resolveGrade2MissionInteraction(grade2, approvedGrade2Registry)).toBe('ready')
    expect(resolveGrade2MissionInteraction(grade2, {
      entries: approvedGrade2Registry.entries,
      releaseLedger: [
        approvedGrade2Registry.releaseLedger.find(
          (family) => family.familyId === grade2.applicationSource.familyId,
        )!,
        approvedGrade2Registry.releaseLedger.find(
          (family) => family.familyId === grade2.applicationSource.familyId,
        )!,
      ],
    })).toBe('blocked')
    expect(resolveGrade2MissionInteraction(grade2, withReleaseStatus(
      GRADE2_APPLICATION_PROBLEM_REGISTRY_V1,
      grade2.applicationSource.familyId,
      'quarantined',
    ))).toBe('blocked')
    expect(resolveGrade2MissionInteraction(grade2, withReleaseStatus(
      GRADE2_APPLICATION_PROBLEM_REGISTRY_V1,
      grade2.applicationSource.familyId,
      'retired',
    ))).toBe('ready')
    expect(resolveGrade2MissionInteraction(grade2, {
      entries: [],
      releaseLedger: [],
    })).toBe('blocked')
    const approvedGrade5Registry = withReleaseStatus(
      GRADE5_APPLICATION_PROBLEM_REGISTRY_V1,
      grade5.familyId,
      'approved',
    )
    const approvedGrade6Registry = withReleaseStatus(
      GRADE6_APPLICATION_PROBLEM_REGISTRY_V1,
      grade6.familyId,
      'approved',
    )
    expect(resolveGrade5ApplicationGeometryVisual(grade5).status).toBe('ready')
    expect(resolveGrade5ApplicationGeometryVisual(grade5, approvedGrade5Registry).status)
      .toBe('ready')
    expect(resolveGrade5ApplicationGeometryVisual(grade5, {
      entries: [],
      releaseLedger: [],
    }).status)
      .toBe('blocked')
    expect(resolveGrade5ApplicationGeometryVisual(grade5, withReleaseStatus(
      GRADE5_APPLICATION_PROBLEM_REGISTRY_V1,
      grade5.familyId,
      'retired',
    )).status).toBe('ready')
    expect(resolveGrade6ApplicationRatioProblem(grade6).status).toBe('ready')
    expect(resolveGrade6ApplicationRatioProblem(grade6, approvedGrade6Registry).status)
      .toBe('ready')
    expect(resolveGrade6ApplicationRatioProblem(grade6, {
      entries: [],
      releaseLedger: [],
    }).status)
      .toBe('blocked')
    expect(resolveGrade6ApplicationRatioProblem(grade6, withReleaseStatus(
      GRADE6_APPLICATION_PROBLEM_REGISTRY_V1,
      grade6.familyId,
      'retired',
    )).status).toBe('ready')
    expect(resolveGrade5ApplicationGeometryVisual(grade5, withReleaseStatus(
      GRADE5_APPLICATION_PROBLEM_REGISTRY_V1,
      grade5.familyId,
      'quarantined',
    )).status).toBe('blocked')
    expect(resolveGrade6ApplicationRatioVisual(
      grade6.visual,
      grade6,
      withReleaseStatus(GRADE6_APPLICATION_PROBLEM_REGISTRY_V1, grade6.familyId, 'quarantined'),
    ).status).toBe('blocked')
  })

  it('keeps historical release tombstones usable without retaining maker runtimes', () => {
    const grade2 = grade2Mission(0)
    const approved = withReleaseStatus(
      GRADE2_APPLICATION_PROBLEM_REGISTRY_V1,
      grade2.applicationSource.familyId,
      'approved',
    )
    const retiredFamily = {
      ...approved.releaseLedger!.find(
        (family) => family.familyId === grade2.applicationSource.familyId,
      )!,
      releaseStatus: 'retired' as const,
    }

    expect(resolveGrade2MissionInteraction(grade2, {
      entries: [],
      releaseLedger: [retiredFamily],
    })).toBe('ready')
    expect(resolveGrade2MissionInteraction(grade2, {
      entries: [],
      releaseLedger: [{ ...retiredFamily, releaseStatus: 'quarantined' }],
    })).toBe('blocked')
  })

  it('allows legacy practice but blocks malformed required Grade 5/6 snapshots', async () => {
    const legacy: Problem = {
      index: 0,
      templateId: 'legacy',
      setId: 'A',
      params: {},
      prompt: '1+1은?',
      type: 'number',
      correctAnswer: '2',
      solutionSteps: ['1+1=2'],
    }
    const grade5 = practiceProblem(
      generateG5PerimeterBoundaryRebuildProblem({ seed: 0, variantIndex: 0 }),
      2,
    ) as Problem & { applicationVisual?: unknown }
    const grade6 = practiceProblem(generateG6RatioPartWhole({ seed: 0, variantIndex: 0 }), 2)
    const approvedGrade6Registry = withReleaseStatus(
      GRADE6_APPLICATION_PROBLEM_REGISTRY_V1,
      grade6.applicationSource!.familyId,
      'approved',
    )
    delete grade5.applicationVisual

    expect(await canGradePracticeProblem(legacy, 5)).toBe(true)
    expect(await canGradePracticeProblem(grade5, 5)).toBe(false)
    expect(await canGradePracticeProblem(grade6, 6)).toBe(true)
    expect(await canGradePracticeProblem(grade6, 6, approvedGrade6Registry)).toBe(true)
    expect(await canGradePracticeProblem(grade6, 5)).toBe(false)

    const distractorIndex = grade6.choices!.findIndex((choice) => choice !== grade6.correctAnswer)
    const wrongGrade6Answer = {
      ...grade6,
      correctAnswer: grade6.choices![distractorIndex],
      correctChoiceIndex: distractorIndex,
    }
    expect(await canGradePracticeProblem(wrongGrade6Answer, 6, approvedGrade6Registry)).toBe(false)
  })

  it('does not reinterpret a source-stripped application snapshot as a legacy problem', async () => {
    const generated = generateG6RatioPartWhole({ seed: 0, variantIndex: 0 })
    const complete = practiceProblem(generated, 2)
    const approvedRegistry = withReleaseStatus(
      GRADE6_APPLICATION_PROBLEM_REGISTRY_V1,
      generated.familyId,
      'approved',
    )
    const stripped = {
      ...complete,
      correctAnswer: '999',
    } as Problem & { applicationSource?: unknown }
    delete stripped.applicationSource

    expect(await canGradePracticeProblem(stripped, 6, approvedRegistry)).toBe(false)
    expect(await canGradePracticeProblem({
      ...complete,
      applicationSource: null,
    } as unknown as Problem, 6, approvedRegistry)).toBe(false)
  })
})
