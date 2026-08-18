import type { JsonValue } from '../contracts'
import type { ApplicationProblemRenderedContentV1 } from '../generator'
import type { ApplicationVisualDiagramSceneV1, ApplicationVisualSceneV1 } from '../visual-model'
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
    return {
      schemaVersion: 'application-visual-v1',
      surface: 'diagram',
      semantics: 'schematic',
      viewBox: { width: 104, height: 58 },
      scale: { x: 1, y: 1 },
      description: { before: { text: `${object}과 닮은 입체 모양 세 가지`, disclosure: 'given' } },
      primitives: [
        { key: 'cuboid-front', kind: 'rect', x: 2, y: 8, width: 20, height: 16, disclosure: 'given', styleRole: 'primary', emphasis: 'normal' },
        { key: 'cuboid-back', kind: 'rect', x: 8, y: 2, width: 20, height: 16, disclosure: 'given', styleRole: 'secondary', emphasis: 'normal' },
        { key: 'cuboid-edge-a', kind: 'line', x1: 2, y1: 8, x2: 8, y2: 2, disclosure: 'given', styleRole: 'primary', emphasis: 'normal' },
        { key: 'cuboid-edge-b', kind: 'line', x1: 22, y1: 24, x2: 28, y2: 18, disclosure: 'given', styleRole: 'primary', emphasis: 'normal' },
        { key: 'cylinder-body', kind: 'rect', x: 42, y: 8, width: 16, height: 22, disclosure: 'given', styleRole: 'primary', emphasis: 'normal' },
        { key: 'cylinder-top', kind: 'circle', cx: 50, cy: 8, radius: 8, disclosure: 'given', styleRole: 'secondary', emphasis: 'normal' },
        { key: 'cylinder-bottom', kind: 'circle', cx: 50, cy: 30, radius: 8, disclosure: 'given', styleRole: 'secondary', emphasis: 'normal' },
        { key: 'sphere-outline', kind: 'circle', cx: 82, cy: 18, radius: 14, disclosure: 'given', styleRole: 'primary', emphasis: 'normal' },
        { key: 'sphere-equator', kind: 'polyline', points: [{ x: 68, y: 18 }, { x: 75, y: 14 }, { x: 82, y: 13 }, { x: 89, y: 14 }, { x: 96, y: 18 }, { x: 89, y: 22 }, { x: 82, y: 23 }, { x: 75, y: 22 }, { x: 68, y: 18 }], disclosure: 'given', styleRole: 'secondary', emphasis: 'normal' },
      ],
      labels: [
        { key: 'cuboid-label', x: 15, y: 40, content: { before: { text: '직육면체', disclosure: 'given' } }, styleRole: 'primary' },
        { key: 'cylinder-label', x: 50, y: 40, content: { before: { text: '원기둥', disclosure: 'given' } }, styleRole: 'primary' },
        { key: 'sphere-label', x: 82, y: 40, content: { before: { text: '구', disclosure: 'given' } }, styleRole: 'primary' },
        { key: 'answer-label', x: 2, y: 52, content: { before: { text: '답: ?', disclosure: 'identifier' }, after: { text: `답: ${answer}`, disclosure: 'solution' } }, styleRole: 'accent' },
      ],
      constraints: [
        { kind: 'topology', firstKey: 'cuboid-front', secondKey: 'cuboid-back', relation: 'overlap' },
      ],
    } satisfies ApplicationVisualDiagramSceneV1
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
