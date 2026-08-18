import type { ApplicationProblemRenderedContentV1 } from '../generator'
import type { ApplicationVisualSceneV1 } from '../visual-model'
import type { JsonValue } from '../contracts'
import { numberParam } from './g2-1-family-support'
import { buildG2BarScene } from './g2-1-visual-primitives'

export function buildG2SemesterOnePlaceValueScene(
  familyId: string,
  params: Readonly<Record<string, JsonValue>>,
  rendered: ApplicationProblemRenderedContentV1,
): ApplicationVisualSceneV1 {
  const answer = rendered.answer.normalized
  if (familyId === 'g2-1-place-value-build-number' || familyId === 'g2-1-place-value-missing-digit') {
    const hundreds = numberParam(params, 'hundreds')
    const tens = numberParam(params, 'tens')
    const ones = numberParam(params, 'ones')
    return buildG2BarScene({
      description: '백, 십, 일 모형의 개수를 나타낸 그림',
      values: [hundreds, Math.max(tens, 1), Math.max(ones, 1)],
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
