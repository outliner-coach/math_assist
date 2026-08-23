import type { JsonValue } from '../contracts'
import type { ApplicationProblemRenderedContentV1 } from '../generator'
import type { ApplicationVisualSceneV1 } from '../visual-model'
import { numberParam } from './g2-1-family-support'
import { buildG2BarScene } from './g2-1-visual-primitives'

export function buildG2SemesterOneAddSubScene(
  familyId: string,
  params: Readonly<Record<string, JsonValue>>,
  rendered: ApplicationProblemRenderedContentV1,
): ApplicationVisualSceneV1 {
  const answer = rendered.answer.normalized
  if (familyId === 'g2-1-add-sub-story-total') {
    const first = numberParam(params, 'first'); const added = numberParam(params, 'added'); const removed = numberParam(params, 'removed')
    return buildG2BarScene({ description: '처음, 들어온 수, 나간 수를 나타낸 막대', values: [first, added, removed], labels: [`처음 ${first}`, `들어옴 ${added}`, `나감 ${removed}`], answer })
  }
  if (familyId === 'g2-1-add-sub-missing-start') {
    const added = numberParam(params, 'added'); const end = numberParam(params, 'end')
    return buildG2BarScene({ description: '들어온 수와 마지막 수를 나타낸 막대', values: [added, end], labels: [`들어옴 ${added}`, `마지막 ${end}`], answer })
  }
  const first = numberParam(params, 'first'); const second = numberParam(params, 'second')
  return buildG2BarScene({ description: '두 수와 두 친구의 계산 방법을 확인하는 막대', values: [first, second], labels: [`첫째 수 ${first}`, `둘째 수 ${second}`], answer })
}
