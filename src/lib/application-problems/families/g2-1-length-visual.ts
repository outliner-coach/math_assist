import type { JsonValue } from '../contracts'
import type { ApplicationProblemRenderedContentV1 } from '../generator'
import type { ApplicationVisualSceneV1 } from '../visual-model'
import { numberParam, stringParam } from './g2-1-family-support'
import { buildG2BarScene } from './g2-1-visual-primitives'

export function buildG2SemesterOneLengthScene(familyId: string, params: Readonly<Record<string, JsonValue>>, rendered: ApplicationProblemRenderedContentV1): ApplicationVisualSceneV1 {
  const answer = rendered.answer.normalized
  if (familyId === 'g2-1-length-estimate-check') {
    const estimate = numberParam(params, 'estimate'); const low = numberParam(params, 'low'); const high = numberParam(params, 'high'); const object = stringParam(params, 'object'); const unit = stringParam(params, 'unit'); const expectedUnit = stringParam(params, 'expectedUnit'); const toCentimeters = (value: number, valueUnit: string) => valueUnit === 'm' ? value * 100 : value
    return buildG2BarScene({ description: `${object}의 어림값과 알맞은 범위`, values: [toCentimeters(estimate, unit), toCentimeters(low, expectedUnit), toCentimeters(high, expectedUnit)], labels: [`어림 ${estimate}${unit}`, `낮은 기준 ${low}${expectedUnit}`, `높은 기준 ${high}${expectedUnit}`], answer })
  }
  const start = numberParam(params, 'start'); const end = numberParam(params, 'end')
  const values = familyId === 'g2-1-length-claim-check' ? [start + 1, end + 1, numberParam(params, 'aClaim') + 1, numberParam(params, 'bClaim') + 1] : [start + 1, end + 1]
  const labels = familyId === 'g2-1-length-claim-check' ? [`시작 ${start}cm`, `끝 ${end}cm`, `가 ${numberParam(params, 'aClaim')}cm`, `나 ${numberParam(params, 'bClaim')}cm`] : [`시작 ${start}cm`, `끝 ${end}cm`]
  return buildG2BarScene({ description: '자의 시작 눈금과 끝 눈금을 나타낸 그림', values, labels, answer })
}
