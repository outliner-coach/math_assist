import type { JsonValue } from './contracts'
import type {
  ApplicationVisualContent,
  ApplicationVisualDiagramConstraint,
  ApplicationVisualDiagramSceneV1,
  ApplicationVisualDisclosure,
  ApplicationVisualLabel,
  ApplicationVisualPrimitive,
} from './visual-model'

export interface HistoricalG2LengthRouteTotalCase extends Record<string, JsonValue> {
  longCm: number
  middleCm: number
  lastCm: number
}

export interface HistoricalG2LengthMissingSegmentCase extends Record<string, JsonValue> {
  totalCm: number
  knownA: number
  knownB: number
  missingPosition: number
}

export type HistoricalG2LengthWrongClaimStrategy =
  | 'meter-tenfold-add'
  | 'mixed-concat-add'
  | 'operate-before-alignment'
  | 'missing-addition'

interface HistoricalG2RouteClaimBase extends Record<string, JsonValue> {
  baseCaseId: string
  scenario: 'route-total'
  wrongStrategy: Exclude<HistoricalG2LengthWrongClaimStrategy, 'missing-addition'>
  longCm: number
  middleCm: number
  lastCm: number
}

interface HistoricalG2MissingClaimBase extends Record<string, JsonValue> {
  baseCaseId: string
  scenario: 'missing-segment'
  wrongStrategy: 'missing-addition'
  totalCm: number
  knownA: number
  knownB: number
  missingPosition: number
}

type HistoricalG2LengthClaimCheckBaseCase =
  | HistoricalG2RouteClaimBase
  | HistoricalG2MissingClaimBase

export type HistoricalG2LengthClaimCheckCase =
  HistoricalG2LengthClaimCheckBaseCase & {
    correctClaimPosition: 0 | 1
    claimACm: number
    claimBCm: number
  }

const ROUTE_LONG_CM = [110, 130, 150] as const
const ROUTE_MIDDLE_CM = [25, 45, 65] as const
const ROUTE_LAST_CM = [20, 40] as const

export const HISTORICAL_G2_LENGTH_ROUTE_TOTAL_CASES:
readonly HistoricalG2LengthRouteTotalCase[] = Object.freeze(
  ROUTE_LONG_CM.flatMap((longCm) =>
    ROUTE_MIDDLE_CM.flatMap((middleCm) =>
      ROUTE_LAST_CM.map((lastCm) => Object.freeze({ longCm, middleCm, lastCm })),
    ),
  ),
)

const MISSING_TOTAL_CM = [180, 210, 240] as const
const MISSING_KNOWN_A = [40, 60] as const
const MISSING_KNOWN_B = [30, 50, 70] as const
const MISSING_POSITIONS = [0, 1, 2] as const

export const HISTORICAL_G2_LENGTH_MISSING_SEGMENT_CASES:
readonly HistoricalG2LengthMissingSegmentCase[] = Object.freeze(
  MISSING_TOTAL_CM.flatMap((totalCm) =>
    MISSING_KNOWN_A.flatMap((knownA) =>
      MISSING_KNOWN_B.flatMap((knownB) =>
        MISSING_POSITIONS.map((missingPosition) =>
          Object.freeze({ totalCm, knownA, knownB, missingPosition }),
        ),
      ),
    ),
  ),
)

const HISTORICAL_G2_LENGTH_CLAIM_BASE_CASES:
readonly HistoricalG2LengthClaimCheckBaseCase[] = Object.freeze([
  { baseCaseId: 'meter-1', scenario: 'route-total', wrongStrategy: 'meter-tenfold-add', longCm: 110, middleCm: 25, lastCm: 20 },
  { baseCaseId: 'meter-2', scenario: 'route-total', wrongStrategy: 'meter-tenfold-add', longCm: 130, middleCm: 45, lastCm: 20 },
  { baseCaseId: 'meter-3', scenario: 'route-total', wrongStrategy: 'meter-tenfold-add', longCm: 150, middleCm: 25, lastCm: 40 },
  { baseCaseId: 'meter-4', scenario: 'route-total', wrongStrategy: 'meter-tenfold-add', longCm: 110, middleCm: 65, lastCm: 40 },
  { baseCaseId: 'concat-1', scenario: 'route-total', wrongStrategy: 'mixed-concat-add', longCm: 205, middleCm: 30, lastCm: 20 },
  { baseCaseId: 'concat-2', scenario: 'route-total', wrongStrategy: 'mixed-concat-add', longCm: 207, middleCm: 40, lastCm: 30 },
  { baseCaseId: 'concat-3', scenario: 'route-total', wrongStrategy: 'mixed-concat-add', longCm: 305, middleCm: 20, lastCm: 40 },
  { baseCaseId: 'concat-4', scenario: 'route-total', wrongStrategy: 'mixed-concat-add', longCm: 309, middleCm: 50, lastCm: 20 },
  { baseCaseId: 'align-1', scenario: 'route-total', wrongStrategy: 'operate-before-alignment', longCm: 130, middleCm: 40, lastCm: 20 },
  { baseCaseId: 'align-2', scenario: 'route-total', wrongStrategy: 'operate-before-alignment', longCm: 150, middleCm: 30, lastCm: 40 },
  { baseCaseId: 'align-3', scenario: 'route-total', wrongStrategy: 'operate-before-alignment', longCm: 110, middleCm: 60, lastCm: 30 },
  { baseCaseId: 'align-4', scenario: 'route-total', wrongStrategy: 'operate-before-alignment', longCm: 140, middleCm: 20, lastCm: 50 },
  { baseCaseId: 'missing-1', scenario: 'missing-segment', wrongStrategy: 'missing-addition', totalCm: 180, knownA: 40, knownB: 30, missingPosition: 0 },
  { baseCaseId: 'missing-2', scenario: 'missing-segment', wrongStrategy: 'missing-addition', totalCm: 210, knownA: 60, knownB: 50, missingPosition: 1 },
  { baseCaseId: 'missing-3', scenario: 'missing-segment', wrongStrategy: 'missing-addition', totalCm: 240, knownA: 70, knownB: 30, missingPosition: 2 },
  { baseCaseId: 'missing-4', scenario: 'missing-segment', wrongStrategy: 'missing-addition', totalCm: 180, knownA: 60, knownB: 70, missingPosition: 1 },
].map((entry) => Object.freeze(entry)) as HistoricalG2LengthClaimCheckBaseCase[])

function trueClaimValue(base: HistoricalG2LengthClaimCheckBaseCase): number {
  return base.scenario === 'route-total'
    ? base.longCm + base.middleCm + base.lastCm
    : base.totalCm - base.knownA - base.knownB
}

function falseClaimValue(base: HistoricalG2LengthClaimCheckBaseCase): number {
  if (base.scenario === 'missing-segment') {
    return base.totalCm + base.knownA + base.knownB
  }
  const meters = Math.floor(base.longCm / 100)
  const centimeters = base.longCm % 100
  if (base.wrongStrategy === 'meter-tenfold-add') {
    return meters * 10 + centimeters + base.middleCm + base.lastCm
  }
  if (base.wrongStrategy === 'mixed-concat-add') {
    return Number(`${meters}${centimeters}`) + base.middleCm + base.lastCm
  }
  return meters + centimeters + base.middleCm + base.lastCm
}

export const HISTORICAL_G2_LENGTH_CLAIM_CHECK_CASES:
readonly HistoricalG2LengthClaimCheckCase[] = Object.freeze(
  HISTORICAL_G2_LENGTH_CLAIM_BASE_CASES.flatMap((base) => {
    const correctCm = trueClaimValue(base)
    const wrongCm = falseClaimValue(base)
    return ([0, 1] as const).map((correctClaimPosition) =>
      Object.freeze({
        ...base,
        correctClaimPosition,
        claimACm: correctClaimPosition === 0 ? correctCm : wrongCm,
        claimBCm: correctClaimPosition === 1 ? correctCm : wrongCm,
      }),
    )
  }),
)

export function historicalG2LengthCaseIndex(
  seed: number,
  variantIndex: number,
  domainSize: number,
): number {
  if (!Number.isSafeInteger(seed)) throw new TypeError('seed must be a safe integer')
  if (!Number.isSafeInteger(variantIndex) || variantIndex < 0) {
    throw new TypeError('variantIndex must be a non-negative safe integer')
  }
  if (!Number.isSafeInteger(domainSize) || domainSize < 1) {
    throw new TypeError('domainSize must be a positive safe integer')
  }
  const floorModSeed = ((seed % domainSize) + domainSize) % domainSize
  return (floorModSeed + (variantIndex % domainSize)) % domainSize
}

export function historicalG2MixedLength(cm: number): string {
  if (!Number.isSafeInteger(cm) || cm <= 0) throw new TypeError('cm must be positive')
  const meters = Math.floor(cm / 100)
  const centimeters = cm % 100
  if (meters === 0) return `${centimeters}cm`
  if (centimeters === 0) return `${meters}m`
  return `${meters}m ${centimeters}cm`
}

function givenText(text: string): ApplicationVisualContent {
  return { before: { text, disclosure: 'given' } }
}

function identifierThenSolution(before: string, after: string): ApplicationVisualContent {
  return {
    before: { text: before, disclosure: 'identifier' },
    after: { text: after, disclosure: 'solution' },
  }
}

function solutionText(text: string): ApplicationVisualContent {
  return { after: { text, disclosure: 'solution' } }
}

interface HistoricalG2LengthSceneInput {
  lengthsCm: readonly [number, number, number]
  labels: readonly [
    ApplicationVisualContent,
    ApplicationVisualContent,
    ApplicationVisualContent,
  ]
  segmentDisclosures?: readonly [
    ApplicationVisualDisclosure,
    ApplicationVisualDisclosure,
    ApplicationVisualDisclosure,
  ]
  description: ApplicationVisualContent
  total?: {
    lengthCm: number
    content: ApplicationVisualContent
    disclosure: ApplicationVisualDisclosure
    emphasis?: 'normal' | 'answer'
  }
}

function historicalG2ConnectedLengthScene(
  input: HistoricalG2LengthSceneInput,
): ApplicationVisualDiagramSceneV1 {
  const startX = 17
  const totalY = 22
  const segmentY = 64
  const labelY = 82
  const totalCm = input.lengthsCm.reduce((sum, value) => sum + value, 0)
  const disclosures = input.segmentDisclosures ?? ['given', 'given', 'given']
  const colors = ['primary', 'secondary', 'accent'] as const
  let cursor = startX
  const primitives: ApplicationVisualPrimitive[] = input.lengthsCm.map(
    (lengthCm, index) => {
      const primitive = {
        key: `segment-${index}`,
        kind: 'line' as const,
        x1: cursor,
        y1: segmentY,
        x2: cursor + lengthCm,
        y2: segmentY,
        disclosure: disclosures[index],
        styleRole: colors[index],
        emphasis: 'normal' as const,
      }
      cursor += lengthCm
      return primitive
    },
  )
  const labels: ApplicationVisualLabel[] = input.lengthsCm.map((lengthCm, index) => {
    const priorLength = input.lengthsCm
      .slice(0, index)
      .reduce((sum, value) => sum + value, 0)
    return {
      key: `segment-label-${index}`,
      x: startX + priorLength + lengthCm / 2,
      y: labelY,
      content: input.labels[index],
      styleRole: colors[index],
    }
  })
  const constraints: ApplicationVisualDiagramConstraint[] = input.lengthsCm.map(
    (lengthCm, index) => ({
      kind: 'segment-length',
      primitiveKey: `segment-${index}`,
      expected: lengthCm,
    }),
  )
  if (input.total) {
    primitives.push({
      key: 'whole-length',
      kind: 'line',
      x1: startX,
      y1: totalY,
      x2: startX + input.total.lengthCm,
      y2: totalY,
      disclosure: input.total.disclosure,
      styleRole: 'muted',
      emphasis: input.total.emphasis ?? 'normal',
    })
    labels.push({
      key: 'whole-label',
      x: startX + input.total.lengthCm / 2,
      y: 10,
      content: input.total.content,
      styleRole: 'muted',
    })
    constraints.push({
      kind: 'segment-length',
      primitiveKey: 'whole-length',
      expected: input.total.lengthCm,
    })
  }
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'quantitative',
    viewBox: { width: totalCm + 34, height: 96 },
    scale: { x: 1, y: 1 },
    description: input.description,
    primitives,
    labels,
    constraints,
  }
}

function missingLengths(
  model: HistoricalG2LengthMissingSegmentCase,
): [number, number, number] {
  const missingCm = model.totalCm - model.knownA - model.knownB
  const known = [model.knownA, model.knownB]
  let knownIndex = 0
  return [0, 1, 2].map((position) => {
    if (position === model.missingPosition) return missingCm
    const length = known[knownIndex]
    knownIndex += 1
    return length
  }) as [number, number, number]
}

export function historicalG2RouteScene(
  model: HistoricalG2LengthRouteTotalCase,
): ApplicationVisualDiagramSceneV1 {
  const totalCm = model.longCm + model.middleCm + model.lastCm
  return historicalG2ConnectedLengthScene({
    lengthsCm: [model.longCm, model.middleCm, model.lastCm],
    labels: [
      givenText(historicalG2MixedLength(model.longCm)),
      givenText(`${model.middleCm}cm`),
      givenText(`${model.lastCm}cm`),
    ],
    description: givenText('이어진 세 길이를 cm 크기에 맞게 나타낸 그림'),
    total: {
      lengthCm: totalCm,
      content: solutionText(`${totalCm}cm`),
      disclosure: 'solution',
      emphasis: 'answer',
    },
  })
}

export function historicalG2MissingScene(
  model: HistoricalG2LengthMissingSegmentCase,
): ApplicationVisualDiagramSceneV1 {
  const lengthsCm = missingLengths(model)
  const missingCm = model.totalCm - model.knownA - model.knownB
  return historicalG2ConnectedLengthScene({
    lengthsCm,
    labels: lengthsCm.map((lengthCm, position) =>
      position === model.missingPosition
        ? identifierThenSolution('?', `${missingCm}cm`)
        : givenText(`${lengthCm}cm`),
    ) as [ApplicationVisualContent, ApplicationVisualContent, ApplicationVisualContent],
    segmentDisclosures: [0, 1, 2].map((position) =>
      position === model.missingPosition ? 'identifier' : 'given',
    ) as ['given' | 'identifier', 'given' | 'identifier', 'given' | 'identifier'],
    description: givenText('전체와 두 부분을 보고 빠진 길이를 찾는 그림'),
    total: {
      lengthCm: model.totalCm,
      content: givenText(historicalG2MixedLength(model.totalCm)),
      disclosure: 'given',
    },
  })
}

function claimSpeaker(model: HistoricalG2LengthClaimCheckCase): '가' | '나' {
  const correctCm = trueClaimValue(model)
  return model.claimACm === correctCm ? '가' : '나'
}

export function historicalG2ClaimScene(
  model: HistoricalG2LengthClaimCheckCase,
): ApplicationVisualDiagramSceneV1 {
  const speaker = claimSpeaker(model)
  const description: ApplicationVisualContent = {
    before: { text: '문제에 주어진 길이만 크기에 맞게 나타낸 그림', disclosure: 'given' },
    after: { text: `맞는 말은 ${speaker}예요.`, disclosure: 'solution' },
  }
  if (model.scenario === 'route-total') {
    return historicalG2ConnectedLengthScene({
      lengthsCm: [model.longCm, model.middleCm, model.lastCm],
      labels: [
        givenText(historicalG2MixedLength(model.longCm)),
        givenText(`${model.middleCm}cm`),
        givenText(`${model.lastCm}cm`),
      ],
      description,
    })
  }
  const lengthsCm = missingLengths(model)
  const missingCm = model.totalCm - model.knownA - model.knownB
  return historicalG2ConnectedLengthScene({
    lengthsCm,
    labels: lengthsCm.map((lengthCm, position) =>
      position === model.missingPosition
        ? identifierThenSolution('?', `${missingCm}cm`)
        : givenText(`${lengthCm}cm`),
    ) as [ApplicationVisualContent, ApplicationVisualContent, ApplicationVisualContent],
    segmentDisclosures: [0, 1, 2].map((position) =>
      position === model.missingPosition ? 'identifier' : 'given',
    ) as ['given' | 'identifier', 'given' | 'identifier', 'given' | 'identifier'],
    description,
    total: {
      lengthCm: model.totalCm,
      content: givenText(historicalG2MixedLength(model.totalCm)),
      disclosure: 'given',
    },
  })
}
