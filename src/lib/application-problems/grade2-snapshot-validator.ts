import type { Grade2Mission } from '../grade2-problems'
import type { Grade2ApplicationMissionV1 } from './grade2-adapter'
import type { GeneratedApplicationVisualV1, JsonValue } from './contracts'
import { isGrade2ReplacementApplicationMissionSemanticallyValid } from './grade2-replacement-snapshot-validator'
import {
  HISTORICAL_G2_LENGTH_CLAIM_CHECK_CASES,
  HISTORICAL_G2_LENGTH_MISSING_SEGMENT_CASES,
  HISTORICAL_G2_LENGTH_ROUTE_TOTAL_CASES,
  historicalG2ClaimScene,
  historicalG2LengthCaseIndex,
  historicalG2MissingScene,
  historicalG2MixedLength,
  historicalG2RouteScene,
  type HistoricalG2LengthClaimCheckCase,
  type HistoricalG2LengthMissingSegmentCase,
  type HistoricalG2LengthRouteTotalCase,
  type HistoricalG2LengthWrongClaimStrategy,
} from './grade2-v1-snapshot-data'
import { resolveApplicationVisual } from './visual-validator'

interface HistoricalMissionShellExpectation {
  missionId: string
  unitId: string
  semester: Grade2Mission['semester']
  mode: Grade2Mission['mode']
  cognitiveDomain: Grade2Mission['cognitiveDomain']
  stageOrder: number
  unitMissionOrder: number
  skill: Grade2Mission['skill']
  difficultyStep: Grade2Mission['difficultyStep']
  curriculumCode: string
  directCurriculumCodes: string[]
  curriculumText: string
  taskActions: Grade2Mission['taskActions']
  visualSemantics: Grade2Mission['visualSemantics']
  learnerGoal: string
  parentSummaryTag: string
  answerType: 'length' | 'choice'
  answerConfig: Grade2Mission['answerConfig']
  params: Grade2Mission['params']
  visualModel: Grade2Mission['visualModel']
  visualConfig: Grade2Mission['visualConfig']
  rewardId: Grade2Mission['rewardId']
}

interface HistoricalContentExpectation extends HistoricalMissionShellExpectation {
  correctAnswer: string
  prompt: string
  choices?: string[]
  correctChoiceIndex?: number
  hintSteps: string[]
  solutionSteps: string[]
  visualGeneratorId: string
  visualMathModel: JsonValue
}

function historicalMissionShell(
  input: Pick<
    HistoricalMissionShellExpectation,
    | 'missionId'
    | 'stageOrder'
    | 'unitMissionOrder'
    | 'learnerGoal'
    | 'parentSummaryTag'
    | 'answerType'
  >,
): HistoricalMissionShellExpectation {
  const isRouteTotal = input.missionId === 'g2-2-length-application-route-total-v1'
  const isClaimCheck = input.missionId === 'g2-2-length-application-claim-check-v1'
  return {
    ...input,
    unitId: 'g2-2-length',
    semester: '2-2',
    mode: 'practice',
    cognitiveDomain: isRouteTotal ? 'applying' : 'reasoning',
    skill: 'length',
    difficultyStep: 'applied',
    curriculumCode: '[2수03-13]',
    directCurriculumCodes: ['[2수03-13]', '[2수03-11]'],
    curriculumText: '여러 가지 방법으로 길이를 재고 길이의 합과 차를 구할 수 있다.',
    taskActions: isRouteTotal
      ? ['interpret', 'model', 'calculate']
      : isClaimCheck
        ? ['interpret', 'analyze_error', 'reason']
        : ['interpret', 'model', 'reason'],
    visualSemantics: 'quantitative',
    answerConfig: input.answerType === 'choice'
      ? { kind: 'choice' }
      : { kind: 'length', unit: 'cm', inputLabel: '길이를 cm로 써요' },
    params: {},
    visualModel: 'length-bars',
    visualConfig: {
      leftLabel: '길이',
      leftCm: 1,
      rightLabel: '길이',
      rightCm: 1,
    },
    rewardId: 'measureTape',
  }
}

function canonical(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(canonical)
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonical(entry)]),
  )
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right))
}

function finiteCase<T extends Readonly<Record<string, JsonValue>>>(
  cases: readonly T[],
  params: Readonly<Record<string, JsonValue>>,
  seed: number,
  variantIndex: number,
): T | null {
  const mathematicalParams = Object.fromEntries(
    Object.entries(params).filter(([key]) => key !== '__generation'),
  )
  const expected = cases[historicalG2LengthCaseIndex(seed, variantIndex, cases.length)]
  return sameJson(expected, mathematicalParams) ? expected : null
}

type HistoricalApplicationMission = Grade2Mission & {
  applicationSource: {
    schemaVersion: 'generated-application-problem-v1'
    instanceId: string
    familyId: string
    generatorVersion: number
    packId: string
    packVersion: number
    seed: number
    variantIndex: number
    curriculumCodes: string[]
  }
  applicationParams: Record<string, JsonValue>
  applicationVisual: {
    role: 'required' | 'support' | 'none'
    semantics?: 'decorative' | 'schematic' | 'quantitative'
    generatorId?: string
    answerCritical: boolean
    generatorVersion?: number
    mathModel?: JsonValue
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asApplicationMission(mission: Grade2Mission): HistoricalApplicationMission {
  const candidate = mission as Partial<HistoricalApplicationMission>
  if (
    !isRecord(candidate.applicationSource) ||
    candidate.applicationSource.schemaVersion !== 'generated-application-problem-v1' ||
    !isRecord(candidate.applicationParams) ||
    !isRecord(candidate.applicationVisual)
  ) {
    throw new TypeError('Grade 2 application snapshot is incomplete')
  }
  return candidate as HistoricalApplicationMission
}

function routeExpectation(
  mission: ReturnType<typeof asApplicationMission>,
): HistoricalContentExpectation | null {
  const model = finiteCase<HistoricalG2LengthRouteTotalCase>(
    HISTORICAL_G2_LENGTH_ROUTE_TOTAL_CASES,
    mission.applicationParams,
    mission.applicationSource.seed,
    mission.applicationSource.variantIndex,
  )
  if (!model) return null
  const totalCm = model.longCm + model.middleCm + model.lastCm
  return {
    ...historicalMissionShell({
      missionId: 'g2-2-length-application-route-total-v1',
      stageOrder: 145,
      unitMissionOrder: 13,
      learnerGoal: 'm와 cm를 같은 단위로 바꾸어 이어진 길이를 구해요.',
      parentSummaryTag: 'length-route-application',
      answerType: 'length',
    }),
    correctAnswer: `${totalCm}cm`,
    prompt: `첫 길은 ${historicalG2MixedLength(model.longCm)}, 다음 길은 ${model.middleCm}cm와 ${model.lastCm}cm예요. 세 길이는 모두 몇 cm일까요?`,
    hintSteps: [
      'm가 있는 길이를 먼저 cm로 바꾸어 보세요.',
      '같은 cm끼리 세 길이를 더해 보세요.',
    ],
    solutionSteps: [
      `${historicalG2MixedLength(model.longCm)}는 ${model.longCm}cm예요.`,
      `${model.longCm}+${model.middleCm}+${model.lastCm}=${totalCm}`,
      `세 길이는 모두 ${totalCm}cm예요.`,
    ],
    visualGeneratorId: 'g2-length-route-bars',
    visualMathModel: historicalG2RouteScene(model) as unknown as JsonValue,
  }
}

function missingExpectation(
  mission: ReturnType<typeof asApplicationMission>,
): HistoricalContentExpectation | null {
  const model = finiteCase<HistoricalG2LengthMissingSegmentCase>(
    HISTORICAL_G2_LENGTH_MISSING_SEGMENT_CASES,
    mission.applicationParams,
    mission.applicationSource.seed,
    mission.applicationSource.variantIndex,
  )
  if (!model) return null
  const missingCm = model.totalCm - model.knownA - model.knownB
  return {
    ...historicalMissionShell({
      missionId: 'g2-2-length-application-missing-segment-v1',
      stageOrder: 146,
      unitMissionOrder: 14,
      learnerGoal: '전체 길이에서 아는 부분을 빼어 빠진 길이를 구해요.',
      parentSummaryTag: 'length-missing-application',
      answerType: 'length',
    }),
    correctAnswer: `${missingCm}cm`,
    prompt: `세 구간을 이은 전체는 ${historicalG2MixedLength(model.totalCm)}예요. 그림의 ? 길이는 몇 cm일까요?`,
    hintSteps: [
      '전체 길이를 cm로 바꾸어 보세요.',
      '전체에서 아는 두 길이를 빼 보세요.',
    ],
    solutionSteps: [
      `${historicalG2MixedLength(model.totalCm)}는 ${model.totalCm}cm예요.`,
      `아는 두 길이는 ${model.knownA}+${model.knownB}=${model.knownA + model.knownB}cm예요.`,
      `${model.totalCm}-${model.knownA}-${model.knownB}=${missingCm}`,
      `빠진 길이는 ${missingCm}cm예요.`,
    ],
    visualGeneratorId: 'g2-length-missing-bars',
    visualMathModel: historicalG2MissingScene(model) as unknown as JsonValue,
  }
}

function strategyCorrection(strategy: HistoricalG2LengthWrongClaimStrategy): string {
  if (strategy === 'meter-tenfold-add') return '1m는 10cm가 아니라 100cm로 바꾸어요.'
  if (strategy === 'mixed-concat-add') return 'm와 cm의 수를 붙이지 말고 m를 100cm씩 바꾸어요.'
  if (strategy === 'operate-before-alignment') return '보이는 수부터 더하지 말고 모두 cm로 맞추어요.'
  return '전체와 부분을 더하지 말고 전체에서 아는 부분을 빼어요.'
}

function claimCorrectCm(model: HistoricalG2LengthClaimCheckCase): number {
  return model.scenario === 'route-total'
    ? model.longCm + model.middleCm + model.lastCm
    : model.totalCm - model.knownA - model.knownB
}

function claimExpectation(
  mission: ReturnType<typeof asApplicationMission>,
): HistoricalContentExpectation | null {
  const model = finiteCase<HistoricalG2LengthClaimCheckCase>(
    HISTORICAL_G2_LENGTH_CLAIM_CHECK_CASES,
    mission.applicationParams,
    mission.applicationSource.seed,
    mission.applicationSource.variantIndex,
  )
  if (!model) return null
  const correctCm = claimCorrectCm(model)
  const speaker = model.claimACm === correctCm ? '가' : '나'
  const situation = model.scenario === 'route-total'
    ? `세 길이는 ${historicalG2MixedLength(model.longCm)}, ${model.middleCm}cm, ${model.lastCm}cm예요.`
    : `전체는 ${historicalG2MixedLength(model.totalCm)}이고 아는 두 부분은 ${model.knownA}cm, ${model.knownB}cm예요.`
  const claimSubject = model.scenario === 'route-total' ? '모두' : '?의 길이는'
  return {
    ...historicalMissionShell({
      missionId: 'g2-2-length-application-claim-check-v1',
      stageOrder: 147,
      unitMissionOrder: 15,
      learnerGoal: '두 설명을 길이 관계와 비교하여 맞는 말을 찾아요.',
      parentSummaryTag: 'length-claim-application',
      answerType: 'choice',
    }),
    correctAnswer: speaker,
    prompt: `${situation} 가: ${claimSubject} ${model.claimACm}cm야. 나: ${claimSubject} ${model.claimBCm}cm야. 누구 말이 맞나요?`,
    choices: ['가', '나'],
    correctChoiceIndex: speaker === '가' ? 0 : 1,
    hintSteps: [
      '문제의 길이를 모두 cm로 나타내 보세요.',
      '가와 나의 수를 하나씩 확인해 보세요.',
    ],
    solutionSteps: [
      model.scenario === 'route-total'
        ? `세 길이를 모두 cm로 바꾸어 더하면 ${correctCm}cm예요.`
        : `전체에서 아는 두 부분을 빼면 ${correctCm}cm예요.`,
      `가의 말은 ${model.claimACm}cm, 나의 말은 ${model.claimBCm}cm예요.`,
      `${correctCm}cm라고 말한 ${speaker}가 맞아요.`,
      strategyCorrection(model.wrongStrategy),
    ],
    visualGeneratorId: 'g2-length-claim-bars',
    visualMathModel: historicalG2ClaimScene(model) as unknown as JsonValue,
  }
}

function sourceIsInternallyConsistent(
  mission: ReturnType<typeof asApplicationMission>,
): boolean {
  const source = mission.applicationSource
  return (
    source.generatorVersion === 1 &&
    source.packId === 'pack-g2-2-length' &&
    source.packVersion === 1 &&
    Number.isSafeInteger(source.seed) &&
    Number.isSafeInteger(source.variantIndex) &&
    source.variantIndex >= 0 &&
    source.instanceId === `${source.familyId}@${source.generatorVersion}:${source.seed}:${source.variantIndex}` &&
    sameJson(source.curriculumCodes, ['[2수03-13]', '[2수03-11]'])
  )
}

function historicalReplacementContentMatches(
  mission: ReturnType<typeof asApplicationMission>,
  expectation: HistoricalContentExpectation | null,
): boolean {
  const replacementAnswer = expectation?.answerType === 'length'
    ? expectation.correctAnswer.replace(/cm$/, '')
    : expectation?.correctAnswer
  return Boolean(expectation) && sourceIsInternallyConsistent(mission) && (
    mission.correctAnswer === replacementAnswer &&
    mission.prompt === expectation!.prompt &&
    sameJson(mission.choices, expectation!.choices) &&
    mission.correctChoiceIndex === expectation!.correctChoiceIndex &&
    sameJson(mission.hintSteps, expectation!.hintSteps) &&
    sameJson(mission.solutionSteps, expectation!.solutionSteps) &&
    mission.applicationVisual.generatorId === expectation!.visualGeneratorId &&
    mission.applicationVisual.generatorVersion === 1 &&
    mission.applicationVisual.role === 'required' &&
    mission.applicationVisual.semantics === 'quantitative' &&
    mission.applicationVisual.answerCritical === true &&
    sameJson(mission.applicationVisual.mathModel, expectation!.visualMathModel)
  )
}

export function isGrade2ApplicationMissionSemanticallyValid(
  mission: Grade2Mission,
): boolean {
  try {
    const applicationMission = asApplicationMission(mission)
    const replacement = applicationMission as Grade2ApplicationMissionV1
    if (replacement.applicationPlacement !== undefined) {
      const historicalExpectation = applicationMission.applicationSource.familyId === 'g2-length-route-total'
        ? routeExpectation(applicationMission)
        : applicationMission.applicationSource.familyId === 'g2-length-missing-segment'
          ? missingExpectation(applicationMission)
          : applicationMission.applicationSource.familyId === 'g2-length-claim-check'
            ? claimExpectation(applicationMission)
            : null
      return isGrade2ReplacementApplicationMissionSemanticallyValid(replacement, {
        historicalContentValid: historicalReplacementContentMatches(
          applicationMission,
          historicalExpectation,
        ),
      })
    }
    if (!sourceIsInternallyConsistent(applicationMission)) return false
    const expectation = applicationMission.applicationSource.familyId === 'g2-length-route-total'
      ? routeExpectation(applicationMission)
      : applicationMission.applicationSource.familyId === 'g2-length-missing-segment'
        ? missingExpectation(applicationMission)
        : applicationMission.applicationSource.familyId === 'g2-length-claim-check'
          ? claimExpectation(applicationMission)
          : null
    if (!expectation) return false
    return (
      applicationMission.id === expectation.missionId &&
      applicationMission.unitId === expectation.unitId &&
      applicationMission.semester === expectation.semester &&
      applicationMission.mode === expectation.mode &&
      applicationMission.cognitiveDomain === expectation.cognitiveDomain &&
      applicationMission.stageOrder === expectation.stageOrder &&
      applicationMission.unitMissionOrder === expectation.unitMissionOrder &&
      applicationMission.skill === expectation.skill &&
      applicationMission.difficultyStep === expectation.difficultyStep &&
      applicationMission.curriculumCode === expectation.curriculumCode &&
      sameJson(applicationMission.directCurriculumCodes, expectation.directCurriculumCodes) &&
      applicationMission.curriculumText === expectation.curriculumText &&
      sameJson(applicationMission.taskActions, expectation.taskActions) &&
      applicationMission.visualSemantics === expectation.visualSemantics &&
      applicationMission.learnerGoal === expectation.learnerGoal &&
      applicationMission.parentSummaryTag === expectation.parentSummaryTag &&
      applicationMission.answerType === expectation.answerType &&
      sameJson(applicationMission.answerConfig, expectation.answerConfig) &&
      sameJson(applicationMission.params, expectation.params) &&
      applicationMission.correctAnswer === expectation.correctAnswer &&
      applicationMission.prompt === expectation.prompt &&
      sameJson(applicationMission.choices, expectation.choices) &&
      applicationMission.correctChoiceIndex === expectation.correctChoiceIndex &&
      applicationMission.visualModel === expectation.visualModel &&
      sameJson(applicationMission.visualConfig, expectation.visualConfig) &&
      sameJson(applicationMission.hintSteps, expectation.hintSteps) &&
      sameJson(applicationMission.solutionSteps, expectation.solutionSteps) &&
      applicationMission.rewardId === expectation.rewardId &&
      applicationMission.applicationVisual.generatorId === expectation.visualGeneratorId &&
      applicationMission.applicationVisual.generatorVersion === 1 &&
      applicationMission.applicationVisual.role === 'required' &&
      applicationMission.applicationVisual.semantics === 'quantitative' &&
      applicationMission.applicationVisual.answerCritical === true &&
      sameJson(
        applicationMission.applicationVisual.mathModel,
        expectation.visualMathModel,
      ) &&
      resolveApplicationVisual(
        applicationMission.applicationVisual as GeneratedApplicationVisualV1,
      ).status === 'ready'
    )
  } catch {
    return false
  }
}
