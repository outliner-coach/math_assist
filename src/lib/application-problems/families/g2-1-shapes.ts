import type { JsonValue } from '../contracts'
import type { ApplicationProblemRenderedContentV1 } from '../generator'
import { createG2SemesterOneFamilyRecipe, numberParam, stringParam } from './g2-1-family-support'
import { buildG2SemesterOneShapesScene } from './g2-1-shapes-visual'

const PACK_ID = 'pack-g2-1-shapes'
const UNIT_ID = 'g2-1-shapes'
const SOLID = 'g2-1-shapes-solid-shapes'
const PLANE = 'g2-1-shapes-plane-shapes'
const FLAT = 'g2-shapes-flat-solid-confusion'
const DIRECTION = 'g2-shapes-size-direction-name'
const COUNT = 'g2-shapes-side-vertex-count'

function choice(answer: string, choices: string[]) {
  return { answer: { format: 'choice' as const, normalized: answer }, choices, correctChoiceIndex: choices.indexOf(answer) }
}

const definitions = [
  {
    familyId: 'g2-1-shapes-object-match', conceptIds: [SOLID], primaryStandard: '[2수03-01]', connectedStandards: ['[2수03-02]'],
    cognitiveDomain: 'applying' as const, reasoningPattern: 'representation_shift' as const,
    representations: ['text', 'diagram'] as const, estimatedSteps: 2,
    modelId: 'g2-shapes-object-solid-match-v1', unknownRole: 'matching-solid-name',
    requiredStudentActions: ['interpret_context', 'convert_representation', 'choose_model'] as const,
    misconceptionRefs: [FLAT],
    cases: [{ object: '공' }, { object: '휴지심' }, { object: '상자' }],
    render: (p: Readonly<Record<string, JsonValue>>) => {
      const object = stringParam(p, 'object'); const answer = object === '공' ? '구' : object === '휴지심' ? '원기둥' : '직육면체'
      return { prompt: `${object}과 가장 닮은 입체도형은 무엇일까요?`, ...choice(answer, ['직육면체', '원기둥', '구']), solutionSteps: [`${object}의 겉모양을 살펴요.`, `${answer}과 닮았어요.`], hintSteps: ['평면이 아니라 쌓거나 굴릴 수 있는 모양을 찾아요.', '각진 곳과 둥근 곳을 살펴요.'] }
    },
  },
  {
    familyId: 'g2-1-shapes-border-build', conceptIds: [PLANE], primaryStandard: '[2수03-03]', connectedStandards: ['[2수03-04]', '[2수03-05]'],
    cognitiveDomain: 'applying' as const, reasoningPattern: 'multi_step' as const,
    representations: ['text', 'diagram'] as const, estimatedSteps: 2,
    modelId: 'g2-shapes-border-construction-v1', unknownRole: 'constructed-plane-shape',
    requiredStudentActions: ['interpret_context', 'choose_model', 'convert_representation'] as const,
    misconceptionRefs: [DIRECTION, COUNT],
    cases: [{ sides: 3, vertices: 3 }, { sides: 4, vertices: 4 }, { sides: 0, vertices: 0 }],
    render: (p: Readonly<Record<string, JsonValue>>) => {
      const sides = numberParam(p, 'sides'); const vertices = numberParam(p, 'vertices'); const answer = sides === 3 && vertices === 3 ? '삼각형' : sides === 4 && vertices === 4 ? '사각형' : '원'
      const condition = sides === 0 ? '곧은 변과 꼭짓점이 없는' : `곧은 변 ${sides}개와 꼭짓점 ${vertices}개가 있는`
      return { prompt: `${condition} 모양은 무엇일까요?`, ...choice(answer, ['삼각형', '사각형', '원']), solutionSteps: [`변과 꼭짓점을 따로 세어요.`, `조건에 맞는 모양은 ${answer}이에요.`], hintSteps: ['크기와 놓인 방향은 보지 않아요.', '곧은 변이 있는지 먼저 살펴요.'] }
    },
  },
  {
    familyId: 'g2-1-shapes-hidden-layer', conceptIds: [SOLID], primaryStandard: '[2수03-02]',
    cognitiveDomain: 'reasoning' as const, reasoningPattern: 'inverse' as const,
    representations: ['text', 'equation', 'diagram'] as const, estimatedSteps: 3,
    modelId: 'g2-shapes-stack-layer-inverse-v1', unknownRole: 'top-layer-count',
    requiredStudentActions: ['interpret_context', 'infer_missing_value', 'choose_model', 'verify_result'] as const,
    misconceptionRefs: [FLAT],
    cases: [{ total: 7, bottom: 4 }, { total: 9, bottom: 6 }, { total: 12, bottom: 7 }],
    render: (p: Readonly<Record<string, JsonValue>>) => {
      const total = numberParam(p, 'total'); const bottom = numberParam(p, 'bottom'); const top = total - bottom
      return { prompt: `쌓기나무는 모두 ${total}개이고 아래층은 ${bottom}개예요. 위층은 몇 개일까요?`, answer: { format: 'number' as const, normalized: String(top) }, solutionSteps: ['평면 그림의 칸만 세지 않고 아래층과 위층에 쌓인 입체를 모두 세어요.', `${total}-${bottom}=${top}`], hintSteps: ['평면 모양이 아니라 위아래로 쌓인 입체예요.', '전체에서 아래층 수를 빼면 위층 수가 돼요.'] }
    },
  },
  {
    familyId: 'g2-1-shapes-property-claim', conceptIds: [SOLID, PLANE], primaryStandard: '[2수03-05]', connectedStandards: ['[2수03-01]'],
    cognitiveDomain: 'reasoning' as const, reasoningPattern: 'error_analysis' as const,
    representations: ['text', 'diagram'] as const, estimatedSteps: 3,
    modelId: 'g2-shapes-property-claim-v1', unknownRole: 'valid-speaker',
    requiredStudentActions: ['interpret_context', 'evaluate_claim', 'compare_strategies', 'verify_result'] as const,
    misconceptionRefs: [DIRECTION],
    cases: [{ shape: '삼각형', aSides: 3, bSides: 4 }, { shape: '사각형', aSides: 3, bSides: 4 }, { shape: '원', aSides: 1, bSides: 0 }],
    render: (p: Readonly<Record<string, JsonValue>>) => {
      const shape = stringParam(p, 'shape'); const aSides = numberParam(p, 'aSides'); const bSides = numberParam(p, 'bSides'); const expectedSides = shape === '삼각형' ? 3 : shape === '사각형' ? 4 : 0; const answer = aSides === expectedSides ? '가' : '나'; const claims = [`가: 곧은 변 ${aSides}개`, `나: 곧은 변 ${bSides}개`]
      return { prompt: `돌려 놓은 ${shape}을 바르게 말한 친구는 누구일까요? ${claims.join(' ')}`, ...choice(answer, ['가', '나']), solutionSteps: ['놓인 방향이 달라도 곧은 변 수는 같아요.', `${answer}의 설명이 맞아요.`], hintSteps: ['놓인 방향만으로 이름을 바꾸지 않아요.', '곧은 변을 하나씩 세어요.'] }
    },
  },
  {
    familyId: 'g2-1-shapes-condition-check', conceptIds: [PLANE], primaryStandard: '[2수03-04]', connectedStandards: ['[2수03-05]'],
    cognitiveDomain: 'reasoning' as const, reasoningPattern: 'constraint' as const,
    representations: ['text', 'diagram'] as const, estimatedSteps: 3,
    modelId: 'g2-shapes-two-condition-filter-v1', unknownRole: 'shape-satisfying-properties',
    requiredStudentActions: ['select_relevant_data', 'test_constraint', 'compare_strategies', 'verify_result'] as const,
    misconceptionRefs: [COUNT],
    cases: [{ sides: 3, vertices: 3 }, { sides: 4, vertices: 4 }, { sides: 0, vertices: 0 }],
    render: (p: Readonly<Record<string, JsonValue>>) => {
      const sides = numberParam(p, 'sides'); const vertices = numberParam(p, 'vertices'); const answer = sides === 3 && vertices === 3 ? '삼각형' : sides === 4 && vertices === 4 ? '사각형' : '원'
      return { prompt: `곧은 변 ${sides}개, 꼭짓점 ${vertices}개 조건을 모두 만족하는 모양을 고르세요.`, ...choice(answer, ['삼각형', '사각형', '원']), solutionSteps: ['첫째 조건과 둘째 조건을 하나씩 확인해요.', `두 조건에 맞는 모양은 ${answer}이에요.`], hintSteps: ['조건 하나만 맞는 모양은 빼요.', '변과 꼭짓점 수가 모두 맞아야 해요.'] }
    },
  },
] as const

export const G2_1_SHAPES_FAMILY_RECIPES = definitions.map((definition) => createG2SemesterOneFamilyRecipe({
  ...definition,
  packId: PACK_ID,
  unitId: UNIT_ID,
  conceptIds: [...definition.conceptIds],
  connectedStandards: 'connectedStandards' in definition ? [...definition.connectedStandards] : [],
  representations: [...definition.representations],
  requiredStudentActions: [...definition.requiredStudentActions],
  cases: definition.cases,
  visual: { semantics: 'schematic', generatorId: 'g2-shape-cards' },
  scene: (params, rendered) => buildG2SemesterOneShapesScene(definition.familyId, params, rendered),
}))
