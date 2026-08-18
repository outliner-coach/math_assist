import type { JsonValue } from '../contracts'
import type {
  ApplicationVisualDiagramConstraint,
  ApplicationVisualDiagramSceneV1,
  ApplicationVisualPrimitive,
} from '../visual-model'

export type G3VisualMode = 'bars' | 'lines' | 'circle'

function numericEntries(params: Readonly<Record<string, JsonValue>>) {
  return Object.entries(params).filter(
    (entry): entry is [string, number] => Number.isFinite(entry[1]) && (entry[1] as number) > 0,
  )
}

function stableKey(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/[^a-z0-9-]+/g, '-')
}

const LEARNER_PARAMETER_LABELS: Readonly<Record<string, string>> = {
  a: '첫째 수',
  added: '더한 수',
  b: '둘째 수',
  boxes: '상자 수',
  c: '셋째 수',
  candidate: '후보',
  change: '변화량',
  claimed: '주장한 값',
  claimedDecimalNumerator: '주장한 소수 분자',
  claimedEach: '주장한 묶음 크기',
  claimedG: '주장한 그램',
  claimedKind: '주장한 종류',
  claimedMl: '주장한 밀리리터',
  claimedMm: '주장한 밀리미터',
  claimedQuotient: '주장한 몫',
  cm: '센티미터',
  decimalNumerator: '소수 분자',
  denominator: '분모',
  divisor: '나누는 수',
  each: '한 묶음',
  end: '끝 수',
  endMinute: '끝 분',
  endSecond: '끝 초',
  extra: '추가 수',
  factor: '곱하는 수',
  firstM: '첫 거리(미터)',
  g: '그램',
  groups: '묶음 수',
  high: '큰 각',
  highNumerator: '큰 분자',
  hour: '시',
  kg: '킬로그램',
  km: '킬로미터',
  leftNumerator: '왼쪽 분자',
  liters: '리터',
  low: '작은 각',
  lowNumerator: '작은 분자',
  milliliters: '밀리리터',
  minute: '분',
  m: '미터',
  mm: '밀리미터',
  numerator: '분자',
  otherNumerator: '다른 분자',
  packs: '묶음 수',
  quotient: '몫',
  relation: '관계',
  remainder: '나머지',
  removed: '덜어 낸 수',
  rightNumerator: '오른쪽 분자',
  shaded: '색칠한 수',
  split: '나눈 수',
  start: '처음 수',
  startMinute: '시작 분',
  startSecond: '시작 초',
  target: '목표 수',
  total: '전체',
  totalM: '전체 거리(미터)',
  totalMl: '전체 밀리리터',
  usedMl: '사용한 밀리리터',
  whole: '전체 수',
}

function learnerParameterLabel(key: string): string {
  return LEARNER_PARAMETER_LABELS[key] ?? key
}

function answerLabel(answer: string, y: number) {
  return {
    key: 'answer-label',
    x: 4,
    y,
    content: {
      before: { text: '답: ?', disclosure: 'identifier' as const },
      after: { text: `답: ${answer}`, disclosure: 'solution' as const },
    },
    styleRole: 'accent' as const,
  }
}

function barsScene(input: {
  familyId: string
  params: Readonly<Record<string, JsonValue>>
  answer: string
  description: string
}): ApplicationVisualDiagramSceneV1 {
  const entries = numericEntries(input.params).slice(0, 6)
  const maximum = Math.max(1, ...entries.map(([, value]) => value))
  const scale = maximum > 180 ? 180 / maximum : 1
  const primitives: ApplicationVisualPrimitive[] = entries.map(([key, value], index) => ({
    key: `bar-${stableKey(key)}`,
    kind: 'rect',
    x: 70,
    y: 8 + index * 18,
    width: value * scale,
    height: 8,
    disclosure: 'given',
    styleRole: index % 2 === 0 ? 'primary' : 'secondary',
    emphasis: 'normal',
  }))
  const constraints: ApplicationVisualDiagramConstraint[] = entries.map(([key, value]) => ({
    kind: 'area',
    primitiveKey: `bar-${stableKey(key)}`,
    expected: value * scale * 8,
  }))
  const answerY = 18 + entries.length * 18
  const labelText = (key: string, value: number, index: number): string => {
    if (input.familyId === 'g3-2-graph-data-sufficiency') {
      const hasCategoryLabels = input.params.hasCategoryLabels === true
      if (!hasCategoryLabels) return `막대 ${index + 1} 높이 ${value}`
      if (key === 'a') return `가 ${value}`
      if (key === 'b') return `나 ${value}`
    }
    return `${learnerParameterLabel(key)} ${value}`
  }
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'quantitative',
    viewBox: { width: 320, height: answerY + 12 },
    scale: { x: 1, y: 1 },
    description: { before: { text: input.description, disclosure: 'given' } },
    primitives,
    labels: [
      ...entries.map(([key, value], index) => ({
        key: `label-${stableKey(key)}`,
        targetKey: `bar-${stableKey(key)}`,
        x: 70 + value * scale / 2,
        y: 14 + index * 18,
        content: { before: { text: labelText(key, value, index), disclosure: 'given' as const } },
        styleRole: 'primary' as const,
      })),
      { ...answerLabel(input.answer, answerY), x: 70 },
    ],
    constraints,
  }
}

function linesScene(input: {
  params: Readonly<Record<string, JsonValue>>
  answer: string
  description: string
}): ApplicationVisualDiagramSceneV1 {
  const rawAngle = input.params.angle
  const angle = typeof rawAngle === 'number' && rawAngle > 0 && rawAngle < 180 ? rawAngle : 90
  const radians = angle * Math.PI / 180
  const length = 45
  const originX = 55
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'quantitative',
    viewBox: { width: 130, height: 90 },
    scale: { x: 1, y: 1 },
    description: { before: { text: input.description, disclosure: 'given' } },
    primitives: [
      { key: 'ray-base', kind: 'line', x1: originX, y1: 58, x2: originX + length, y2: 58, disclosure: 'given', styleRole: 'primary', emphasis: 'normal' },
      { key: 'ray-angle', kind: 'line', x1: originX, y1: 58, x2: originX + length * Math.cos(radians), y2: 58 - length * Math.sin(radians), disclosure: 'given', styleRole: 'secondary', emphasis: 'normal' },
    ],
    labels: [
      { key: 'angle-label', x: 72, y: 24, content: { before: { text: `${angle}°`, disclosure: 'given' } }, styleRole: 'primary' },
      answerLabel(input.answer, 78),
    ],
    constraints: [
      { kind: 'segment-length', primitiveKey: 'ray-base', expected: length },
      { kind: 'segment-length', primitiveKey: 'ray-angle', expected: length },
    ],
  }
}

function circleScene(input: {
  familyId: string
  params: Readonly<Record<string, JsonValue>>
  answer: string
  description: string
}): ApplicationVisualDiagramSceneV1 {
  const rawRadius = input.params.radius
  const rawDiameter = input.params.diameter ?? input.params.targetDiameter
  const radius = typeof rawRadius === 'number' && rawRadius > 0
    ? rawRadius
    : typeof rawDiameter === 'number' && rawDiameter > 0
      ? rawDiameter / 2
      : 4
  const displayScale = radius > 20 ? 20 / radius : 1
  const shownRadius = radius * displayScale
  const centerX = 34
  const centerY = 34
  const diameterIsGiven = input.familyId === 'g3-2-circle-missing-radius'
    || input.familyId === 'g3-2-circle-construction-constraint'
  const measureKey = diameterIsGiven ? 'diameter' : 'radius'
  const measurePrimitive: ApplicationVisualPrimitive = diameterIsGiven
    ? {
        key: measureKey,
        kind: 'line',
        x1: centerX - shownRadius,
        y1: centerY,
        x2: centerX + shownRadius,
        y2: centerY,
        disclosure: 'given',
        styleRole: 'secondary',
        emphasis: 'normal',
      }
    : {
        key: measureKey,
        kind: 'line',
        x1: centerX,
        y1: centerY,
        x2: centerX + shownRadius,
        y2: centerY,
        disclosure: 'given',
        styleRole: 'secondary',
        emphasis: 'normal',
      }
  const measureValue = diameterIsGiven ? Number(rawDiameter) : radius
  const measureLabel = input.familyId === 'g3-2-circle-construction-constraint'
    ? `목표 지름 ${measureValue}`
    : diameterIsGiven
      ? `지름 ${measureValue}`
      : `반지름 ${measureValue}`
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'quantitative',
    viewBox: { width: 110, height: 82 },
    scale: { x: 1, y: 1 },
    description: { before: { text: input.description, disclosure: 'given' } },
    primitives: [
      { key: 'circle', kind: 'circle', cx: centerX, cy: centerY, radius: shownRadius, disclosure: 'given', styleRole: 'primary', emphasis: 'normal' },
      measurePrimitive,
    ],
    labels: [
      { key: `${measureKey}-label`, targetKey: measureKey, x: centerX, y: centerY, content: { before: { text: measureLabel, disclosure: 'given' } }, styleRole: 'primary' },
      answerLabel(input.answer, 72),
    ],
    constraints: [
      { kind: 'segment-length', primitiveKey: measureKey, expected: diameterIsGiven ? shownRadius * 2 : shownRadius },
      { kind: 'area', primitiveKey: 'circle', expected: Math.PI * shownRadius * shownRadius },
    ],
  }
}

export function buildGrade3ApplicationScene(input: {
  familyId: string
  params: Readonly<Record<string, JsonValue>>
  answer: string
  mode: G3VisualMode
  description: string
}): ApplicationVisualDiagramSceneV1 {
  if (input.mode === 'lines') return linesScene(input)
  if (input.mode === 'circle') return circleScene(input)
  return barsScene(input)
}
