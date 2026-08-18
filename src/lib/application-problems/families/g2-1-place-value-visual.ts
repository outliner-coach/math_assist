import type { ApplicationProblemRenderedContentV1 } from '../generator'
import type { ApplicationVisualDiagramSceneV1, ApplicationVisualPrimitive, ApplicationVisualSceneV1 } from '../visual-model'
import type { JsonValue } from '../contracts'
import { numberParam } from './g2-1-family-support'
import { buildG2BarScene } from './g2-1-visual-primitives'

export function buildG2SemesterOnePlaceValueScene(
  familyId: string,
  params: Readonly<Record<string, JsonValue>>,
  rendered: ApplicationProblemRenderedContentV1,
): ApplicationVisualSceneV1 {
  const answer = rendered.answer.normalized
  if (familyId === 'g2-1-place-value-missing-digit') {
    const hundreds = numberParam(params, 'hundreds')
    const tens = numberParam(params, 'tens')
    const ones = numberParam(params, 'ones')
    const primitives: ApplicationVisualPrimitive[] = [
      ...Array.from({ length: hundreds }, (_, index): ApplicationVisualPrimitive => ({ key: `hundred-${index}`, kind: 'rect', x: index * 12, y: 0, width: 10, height: 10, disclosure: 'given', styleRole: 'primary', emphasis: 'normal' })),
      ...Array.from({ length: tens }, (_, index): ApplicationVisualPrimitive => ({ key: `ten-${index}`, kind: 'rect', x: index * 12, y: 18, width: 10, height: 1, disclosure: 'given', styleRole: 'secondary', emphasis: 'normal' })),
      ...Array.from({ length: ones }, (_, index): ApplicationVisualPrimitive => ({ key: `one-${index}`, kind: 'rect', x: index * 3, y: 28, width: 1, height: 1, disclosure: 'given', styleRole: 'accent', emphasis: 'normal' })),
    ]
    return {
      schemaVersion: 'application-visual-v1',
      surface: 'diagram',
      semantics: 'quantitative',
      viewBox: { width: Math.max(hundreds * 12, tens * 12, ones * 3, 30) + 8, height: 62 },
      scale: { x: 1, y: 1 },
      description: { before: { text: '백 모형, 십 모형, 일 모형을 나타낸 그림', disclosure: 'given' } },
      primitives,
      labels: [
        { key: 'hundreds-label', x: 2, y: 42, content: { before: { text: '백 모형', disclosure: 'given' } }, styleRole: 'primary' },
        { key: 'tens-label', x: 20, y: 42, content: { before: { text: '십 모형', disclosure: 'given' } }, styleRole: 'secondary' },
        { key: 'ones-label', x: 38, y: 42, content: { before: { text: '일 모형', disclosure: 'given' } }, styleRole: 'accent' },
        { key: 'answer-label', x: 2, y: 55, content: { before: { text: '답: ?', disclosure: 'identifier' }, after: { text: `답: ${answer}`, disclosure: 'solution' } }, styleRole: 'accent' },
      ],
      constraints: primitives.map((primitive) => ({ kind: 'area' as const, primitiveKey: primitive.key, expected: primitive.kind === 'rect' ? primitive.width * primitive.height : 0 })),
    } satisfies ApplicationVisualDiagramSceneV1
  }
  if (familyId === 'g2-1-place-value-build-number') {
    const hundreds = numberParam(params, 'hundreds')
    const tens = numberParam(params, 'tens')
    const ones = numberParam(params, 'ones')
    return buildG2BarScene({
      description: '백, 십, 일 모형의 개수를 나타낸 그림',
      values: [hundreds, tens, ones],
      labels: [`백 ${hundreds}개`, `십 ${tens}개`, `일 ${ones}개`],
      answer,
    })
  }
  if (familyId === 'g2-1-place-value-compare-orders') {
    const left = numberParam(params, 'left')
    const right = numberParam(params, 'right')
    return buildG2BarScene({
      description: '두 수의 크기를 같은 눈금으로 나타낸 그림',
      values: [left, right],
      labels: [String(left), String(right)],
      answer,
    })
  }
  if (familyId === 'g2-1-place-value-claim-check') {
    const number = numberParam(params, 'number')
    const aValue = numberParam(params, 'aValue')
    const bValue = numberParam(params, 'bValue')
    return buildG2BarScene({
      description: '두 친구가 말한 수를 비교하는 그림',
      values: [number, aValue, bValue],
      labels: [`확인할 수 ${number}`, `가의 수 ${aValue}`, `나의 수 ${bValue}`],
      answer,
    })
  }
  const low = numberParam(params, 'low')
  const candidate = numberParam(params, 'candidate')
  const high = numberParam(params, 'high')
  return buildG2BarScene({
    description: '작은 수부터 큰 수까지 놓은 수 카드',
    values: [low, candidate, high],
    labels: [String(low), String(candidate), String(high)],
    answer,
  })
}
