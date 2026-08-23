import type { JsonValue } from '../contracts'
import type { ApplicationProblemRenderedContentV1 } from '../generator'
import type { ApplicationVisualSceneV1 } from '../visual-model'
import { numberParam } from './g2-1-family-support'
import { buildG2ShapeScene } from './g2-1-visual-primitives'

export function buildG2SemesterOneMultiplicationScene(familyId: string, params: Readonly<Record<string, JsonValue>>, rendered: ApplicationProblemRenderedContentV1): ApplicationVisualSceneV1 {
  const answer = rendered.answer.normalized
  if (familyId === 'g2-1-multiplication-missing-groups') {
    const total = numberParam(params, 'total'); const each = numberParam(params, 'each')
    return buildG2ShapeScene({ description: '전체 수와 한 묶음의 수', shapeCounts: [total, each], labels: [`전체 ${total}개`, `한 묶음 ${each}개`], answer })
  }
  const groups = numberParam(params, 'groups'); const each = numberParam(params, 'each')
  return buildG2ShapeScene({ description: '같은 수씩 놓인 묶음', shapeCounts: Array.from({ length: groups }, () => each), labels: Array.from({ length: groups }, (_, index) => `${index + 1}묶음`), answer })
}
