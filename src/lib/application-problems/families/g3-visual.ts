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
    x: 4,
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
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'quantitative',
    viewBox: { width: 220, height: answerY + 12 },
    scale: { x: 1, y: 1 },
    description: { before: { text: input.description, disclosure: 'given' } },
    primitives,
    labels: [
      ...entries.map(([key, value], index) => ({
        key: `label-${stableKey(key)}`,
        targetKey: `bar-${stableKey(key)}`,
        x: 4 + value * scale / 2,
        y: 14 + index * 18,
        content: { before: { text: `${key} ${value}`, disclosure: 'given' as const } },
        styleRole: 'primary' as const,
      })),
      answerLabel(input.answer, answerY),
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
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'quantitative',
    viewBox: { width: 110, height: 82 },
    scale: { x: 1, y: 1 },
    description: { before: { text: input.description, disclosure: 'given' } },
    primitives: [
      { key: 'circle', kind: 'circle', cx: centerX, cy: centerY, radius: shownRadius, disclosure: 'given', styleRole: 'primary', emphasis: 'normal' },
      { key: 'radius', kind: 'line', x1: centerX, y1: centerY, x2: centerX + shownRadius, y2: centerY, disclosure: 'given', styleRole: 'secondary', emphasis: 'normal' },
    ],
    labels: [
      { key: 'radius-label', targetKey: 'radius', x: centerX + shownRadius / 2, y: centerY, content: { before: { text: `반지름 ${radius}`, disclosure: 'given' } }, styleRole: 'primary' },
      answerLabel(input.answer, 72),
    ],
    constraints: [
      { kind: 'segment-length', primitiveKey: 'radius', expected: shownRadius },
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
