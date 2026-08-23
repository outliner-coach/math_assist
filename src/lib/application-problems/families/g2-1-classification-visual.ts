import type { JsonValue } from '../contracts'
import type { ApplicationProblemRenderedContentV1 } from '../generator'
import type { ApplicationVisualSceneV1 } from '../visual-model'
import { numberParam, stringParam } from './g2-1-family-support'
import { buildG2TableScene } from './g2-1-visual-primitives'

export function buildG2SemesterOneClassificationScene(familyId: string, params: Readonly<Record<string, JsonValue>>, rendered: ApplicationProblemRenderedContentV1): ApplicationVisualSceneV1 {
  const answer = rendered.answer.normalized
  if (familyId === 'g2-1-classification-missing-count') {
    const first = numberParam(params, 'first'); const second = numberParam(params, 'second'); const total = numberParam(params, 'total')
    return buildG2TableScene({ caption: '분류한 두 범주와 전체 개수', categories: [stringParam(params, 'firstName'), stringParam(params, 'secondName'), '전체'], counts: [first, second, total], answer })
  }
  if (familyId === 'g2-1-classification-rule-check') {
    return buildG2TableScene({ caption: `${stringParam(params, 'rule')}이 ${stringParam(params, 'required')}인지 확인`, categories: ['물건의 특징', '기준의 특징'], counts: [1, 1], answer })
  }
  const first = numberParam(params, 'first'); const second = numberParam(params, 'second'); const third = numberParam(params, 'third')
  return buildG2TableScene({ caption: '같은 기준으로 분류한 결과', categories: [stringParam(params, 'firstName'), stringParam(params, 'secondName'), stringParam(params, 'thirdName')], counts: [first, second, third], answer })
}
