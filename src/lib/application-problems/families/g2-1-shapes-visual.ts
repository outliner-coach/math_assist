import type { JsonValue } from '../contracts'
import type { ApplicationProblemRenderedContentV1 } from '../generator'
import type { ApplicationVisualSceneV1 } from '../visual-model'
import { numberParam, stringParam } from './g2-1-family-support'
import { buildG2ShapeScene } from './g2-1-visual-primitives'

export function buildG2SemesterOneShapesScene(
  familyId: string,
  params: Readonly<Record<string, JsonValue>>,
  rendered: ApplicationProblemRenderedContentV1,
): ApplicationVisualSceneV1 {
  const answer = rendered.answer.normalized
  if (familyId === 'g2-1-shapes-hidden-layer') {
    const total = numberParam(params, 'total')
    const bottom = numberParam(params, 'bottom')
    return buildG2ShapeScene({
      description: '전체 쌓기나무와 아래층을 나누어 본 그림',
      shapeCounts: [total, bottom],
      labels: [`전체 ${total}개`, `아래층 ${bottom}개`],
      answer,
    })
  }
  if (familyId === 'g2-1-shapes-object-match') {
    const object = stringParam(params, 'object')
    return buildG2ShapeScene({
      description: `${object}과 닮은 모양을 찾는 카드`,
      shapeCounts: [1, 1, 1],
      labels: ['직육면체', '원기둥', '구'],
      answer,
    })
  }
  if (familyId === 'g2-1-shapes-border-build' || familyId === 'g2-1-shapes-condition-check') {
    const sides = numberParam(params, 'sides')
    const vertices = numberParam(params, 'vertices')
    return buildG2ShapeScene({
      description: '곧은 변과 꼭짓점 조건을 나타낸 모양 카드',
      shapeCounts: [Math.max(sides, 1), Math.max(vertices, 1)],
      labels: [`곧은 변 ${sides}개`, `꼭짓점 ${vertices}개`],
      answer,
    })
  }
  const aSides = numberParam(params, 'aSides')
  const bSides = numberParam(params, 'bSides')
  return buildG2ShapeScene({
    description: '두 친구의 도형 설명을 확인하는 카드',
    shapeCounts: [Math.max(aSides, 1), Math.max(bSides, 1)],
    labels: [`가: 변 ${aSides}개`, `나: 변 ${bSides}개`],
    answer,
  })
}
