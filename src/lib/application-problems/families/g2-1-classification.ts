import type { JsonValue } from '../contracts'
import { createG2SemesterOneFamilyRecipe, numberParam, stringParam } from './g2-1-family-support'
import { buildG2SemesterOneClassificationScene } from './g2-1-classification-visual'

const CONCEPT = 'g2-1-classification-classification'
const CHANGE = 'g2-classification-changing-rule'
const DOUBLE = 'g2-classification-double-count'
function choice(answer: string, choices: string[]) { return { answer: { format: 'choice' as const, normalized: answer }, choices, correctChoiceIndex: choices.indexOf(answer) } }
const definitions = [
  {
    familyId: 'g2-1-classification-sort-count', cognitiveDomain: 'applying' as const, reasoningPattern: 'multi_step' as const, estimatedSteps: 2, modelId: 'g2-classification-table-target-count-v1', unknownRole: 'target-category-count', requiredStudentActions: ['interpret_context', 'select_relevant_data', 'execute_calculation'] as const, misconceptionRefs: [CHANGE, DOUBLE],
    cases: [
      { firstName: '빨강', secondName: '파랑', thirdName: '노랑', first: 3, second: 5, third: 2, target: '파랑' },
      { firstName: '과일', secondName: '동물', thirdName: '탈것', first: 4, second: 2, third: 6, target: '과일' },
      { firstName: '세모', secondName: '네모', thirdName: '동그라미', first: 7, second: 3, third: 5, target: '네모' },
    ],
    render: (p: Readonly<Record<string, JsonValue>>) => { const names = [stringParam(p, 'firstName'), stringParam(p, 'secondName'), stringParam(p, 'thirdName')]; const counts = [numberParam(p, 'first'), numberParam(p, 'second'), numberParam(p, 'third')]; const target = stringParam(p, 'target'); const answer = counts[names.indexOf(target)]; return { prompt: `표에서 ${target}으로 분류된 것은 몇 개일까요?`, answer: { format: 'number' as const, normalized: String(answer) }, solutionSteps: [`${target} 줄만 찾아요.`, `${target}은 ${answer}개예요.`], hintSteps: ['분류 기준을 바꾸지 않아요.', '찾은 줄의 표식을 한 번씩 세어요.'] } },
  },
  {
    familyId: 'g2-1-classification-missing-count', cognitiveDomain: 'reasoning' as const, reasoningPattern: 'inverse' as const, estimatedSteps: 3, modelId: 'g2-classification-missing-category-v1', unknownRole: 'missing-category-count', requiredStudentActions: ['interpret_context', 'infer_missing_value', 'choose_model', 'verify_result'] as const, misconceptionRefs: [DOUBLE],
    cases: [
      { firstName: '빨강', secondName: '파랑', missingName: '노랑', first: 4, second: 3, total: 10 },
      { firstName: '동물', secondName: '탈것', missingName: '과일', first: 5, second: 2, total: 12 },
      { firstName: '세모', secondName: '네모', missingName: '동그라미', first: 6, second: 7, total: 18 },
    ],
    render: (p: Readonly<Record<string, JsonValue>>) => { const first = numberParam(p, 'first'); const second = numberParam(p, 'second'); const total = numberParam(p, 'total'); const missing = total - first - second; const missingName = stringParam(p, 'missingName'); return { prompt: `전체 ${total}개 중 두 종류가 ${first}개와 ${second}개예요. ${missingName}은 몇 개일까요?`, answer: { format: 'number' as const, normalized: String(missing) }, solutionSteps: [`센 두 종류는 ${first}+${second}=${first + second}개예요.`, `${total}-${first + second}=${missing}`], hintSteps: ['전체에서 이미 센 두 종류를 빼요.', '세 범주의 합이 전체와 같은지 확인해요.'] } },
  },
  {
    familyId: 'g2-1-classification-rule-check', cognitiveDomain: 'reasoning' as const, reasoningPattern: 'constraint' as const, estimatedSteps: 3, modelId: 'g2-classification-single-rule-filter-v1', unknownRole: 'item-membership', requiredStudentActions: ['interpret_context', 'test_constraint', 'select_relevant_data', 'verify_result'] as const, misconceptionRefs: [CHANGE],
    cases: [
      { rule: '색', required: '빨간색', item: '빨간 공', actual: '빨간색' },
      { rule: '바퀴', required: '있음', item: '사과', actual: '없음' },
      { rule: '모양', required: '세모', item: '세모 표지판', actual: '세모' },
    ],
    render: (p: Readonly<Record<string, JsonValue>>) => { const rule = stringParam(p, 'rule'); const required = stringParam(p, 'required'); const item = stringParam(p, 'item'); const actual = stringParam(p, 'actual'); const answer = actual === required ? '넣어요' : '넣지 않아요'; return { prompt: `${rule}이 ${required}인 기준으로 분류할 때 ${item}을 넣을까요?`, ...choice(answer, ['넣어요', '넣지 않아요']), solutionSteps: [`${item}의 ${rule}은 ${actual}이에요.`, `따라서 ${answer}`], hintSteps: ['처음 정한 기준 하나만 사용해요.', '물건의 다른 특징은 잠시 보지 않아요.'] } },
  },
  {
    familyId: 'g2-1-classification-claim-check', cognitiveDomain: 'reasoning' as const, reasoningPattern: 'error_analysis' as const, estimatedSteps: 3, modelId: 'g2-classification-total-claim-v1', unknownRole: 'valid-counting-claim', requiredStudentActions: ['interpret_context', 'evaluate_claim', 'execute_calculation', 'verify_result'] as const, misconceptionRefs: [CHANGE, DOUBLE],
    cases: [
      { firstName: '빨강', secondName: '파랑', thirdName: '노랑', first: 3, second: 4, third: 2, aTotal: 9, bTotal: 10 },
      { firstName: '동물', secondName: '탈것', thirdName: '과일', first: 5, second: 2, third: 4, aTotal: 12, bTotal: 11 },
      { firstName: '세모', secondName: '네모', thirdName: '원', first: 6, second: 3, third: 5, aTotal: 14, bTotal: 15 },
    ],
    render: (p: Readonly<Record<string, JsonValue>>) => { const first = numberParam(p, 'first'); const second = numberParam(p, 'second'); const third = numberParam(p, 'third'); const aTotal = numberParam(p, 'aTotal'); const bTotal = numberParam(p, 'bTotal'); const total = first + second + third; const answer = aTotal === total ? '가' : '나'; const claims = [`가: 전체 ${aTotal}개`, `나: 전체 ${bTotal}개`]; return { prompt: `같은 기준으로 센 결과를 바르게 말한 친구는 누구일까요? ${claims.join(' ')}`, ...choice(answer, ['가', '나']), solutionSteps: ['세 범주를 한 번씩 더해요.', `${first}+${second}+${third}=${total}이므로 ${answer}가 맞아요.`], hintSteps: ['같은 물건을 두 번 세지 않아요.', '범주별 개수의 합을 구해요.'] } },
  },
] as const

export const G2_1_CLASSIFICATION_FAMILY_RECIPES = definitions.map((definition) => createG2SemesterOneFamilyRecipe({ ...definition, packId: 'pack-g2-1-classification', unitId: 'g2-1-classification', conceptIds: [CONCEPT], primaryStandard: '[2수04-01]', connectedStandards: [], representations: ['text', 'table'], contextType: 'real_world', readingLoad: 'low', requiredStudentActions: [...definition.requiredStudentActions], cases: definition.cases, visual: { semantics: 'quantitative', generatorId: 'g2-classification-table' }, scene: (params, rendered) => buildG2SemesterOneClassificationScene(definition.familyId, params, rendered) }))
