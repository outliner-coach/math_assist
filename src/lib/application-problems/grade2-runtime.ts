import {
  getGrade2Missions,
  type Grade2Mission,
  type Grade2MissionProvider,
} from '../grade2-problems'
import { adaptGeneratedApplicationProblemToGrade2, type Grade2ApplicationMissionV1 } from './grade2-adapter'
import { GRADE2_APPLICATION_PROBLEM_REGISTRY_V1 } from './grade2-registry'
import type { ApplicationProblemRegistryV1 } from './registry'
import {
  approvedRuntimeEntriesById,
  generateRegisteredApplicationProblemWithRetry,
} from './runtime-integration'

interface Grade2ApplicationPlacementV1 {
  familyId: string
  missionId: string
  unitMissionOrder: number
  learnerGoal: string
  parentSummaryTag: string
  answerType: 'length' | 'choice'
}

const GRADE2_APPLICATION_PLACEMENTS: readonly Grade2ApplicationPlacementV1[] = Object.freeze([
  {
    familyId: 'g2-length-route-total',
    missionId: 'g2-2-length-application-route-total-v1',
    unitMissionOrder: 13,
    learnerGoal: 'm와 cm를 같은 단위로 바꾸어 이어진 길이를 구해요.',
    parentSummaryTag: 'length-route-application',
    answerType: 'length',
  },
  {
    familyId: 'g2-length-missing-segment',
    missionId: 'g2-2-length-application-missing-segment-v1',
    unitMissionOrder: 14,
    learnerGoal: '전체 길이에서 아는 부분을 빼어 빠진 길이를 구해요.',
    parentSummaryTag: 'length-missing-application',
    answerType: 'length',
  },
  {
    familyId: 'g2-length-claim-check',
    missionId: 'g2-2-length-application-claim-check-v1',
    unitMissionOrder: 15,
    learnerGoal: '두 설명을 길이 관계와 비교하여 맞는 말을 찾아요.',
    parentSummaryTag: 'length-claim-application',
    answerType: 'choice',
  },
])

function grade2Shell(
  placement: Grade2ApplicationPlacementV1,
  primaryStandard: string,
): Grade2Mission {
  const choice = placement.answerType === 'choice'
  return {
    id: placement.missionId,
    unitId: 'g2-2-length',
    semester: '2-2',
    stageOrder: 132 + placement.unitMissionOrder,
    unitMissionOrder: placement.unitMissionOrder,
    skill: 'length',
    difficultyStep: 'applied',
    curriculumCode: primaryStandard,
    learnerGoal: placement.learnerGoal,
    parentSummaryTag: placement.parentSummaryTag,
    prompt: '응용 길이 문제를 준비하고 있어요.',
    answerType: placement.answerType,
    answerConfig: choice
      ? { kind: 'choice' }
      : { kind: 'length', unit: 'cm', inputLabel: '길이를 cm로 써요' },
    params: {},
    ...(choice ? { choices: ['가', '나'], correctChoiceIndex: 0 } : {}),
    correctAnswer: choice ? '가' : '1cm',
    visualModel: 'length-bars',
    visualConfig: { leftLabel: '길이', leftCm: 1, rightLabel: '길이', rightCm: 1 },
    hintSteps: ['문제의 길이를 확인해요.', '같은 단위로 바꾸어 생각해요.'],
    solutionSteps: ['길이 관계를 차례로 확인해요.'],
    rewardId: 'measureTape',
  }
}

export function buildApprovedGrade2ApplicationMissions(
  seed: number,
  registry: ApplicationProblemRegistryV1 = GRADE2_APPLICATION_PROBLEM_REGISTRY_V1,
): Grade2ApplicationMissionV1[] {
  const entries = approvedRuntimeEntriesById(registry)
  return GRADE2_APPLICATION_PLACEMENTS.flatMap((placement) => {
    const entry = entries.get(placement.familyId)
    if (!entry) return []
    const problem = generateRegisteredApplicationProblemWithRetry({
      registry,
      entry,
      seed,
      variantIndex: 0,
    })
    return [adaptGeneratedApplicationProblemToGrade2({
      shell: grade2Shell(placement, entry.family.primaryStandard),
      problem,
      mapAnswer: ({ answer }) => placement.answerType === 'length'
        ? `${answer.normalized}cm`
        : answer.normalized,
    })]
  })
}

export type Grade2MissionCatalogResult =
  | { status: 'ready'; missions: Grade2Mission[] }
  | { status: 'blocked' }

export function buildGrade2MissionCatalog(
  seed: number,
  applicationMissionProvider: Grade2MissionProvider = buildApprovedGrade2ApplicationMissions,
): Grade2MissionCatalogResult {
  try {
    return {
      status: 'ready',
      missions: getGrade2Missions(seed, applicationMissionProvider),
    }
  } catch {
    return { status: 'blocked' }
  }
}
