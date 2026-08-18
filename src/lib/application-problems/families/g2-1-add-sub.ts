import type { JsonValue } from '../contracts'
import { createG2SemesterOneFamilyRecipe, numberParam, stringParam } from './g2-1-family-support'
import { buildG2SemesterOneAddSubScene } from './g2-1-add-sub-visual'

const CONCEPT = 'g2-1-add-sub-addition-subtraction'
const OPERATION = 'g2-add-sub-operation-word'
const MISSING = 'g2-add-sub-missing-part-add'

function choice(answer: string, choices: string[]) { return { answer: { format: 'choice' as const, normalized: answer }, choices, correctChoiceIndex: choices.indexOf(answer) } }

const definitions = [
  {
    familyId: 'g2-1-add-sub-story-total', primaryStandard: '[2수01-05]', connectedStandards: ['[2수01-06]', '[2수01-08]'],
    cognitiveDomain: 'applying' as const, reasoningPattern: 'multi_step' as const,
    representations: ['text', 'equation', 'diagram'] as const, estimatedSteps: 3,
    modelId: 'g2-add-sub-change-story-v1', unknownRole: 'final-count',
    requiredStudentActions: ['interpret_context', 'choose_model', 'execute_calculation', 'verify_result'] as const,
    misconceptionRefs: [OPERATION],
    cases: [{ first: 24, added: 18, removed: 7 }, { first: 36, added: 25, removed: 19 }, { first: 48, added: 17, removed: 28 }],
    render: (p: Readonly<Record<string, JsonValue>>) => { const first = numberParam(p, 'first'); const added = numberParam(p, 'added'); const removed = numberParam(p, 'removed'); const answer = first + added - removed; return { prompt: `구슬이 ${first}개 있었어요. ${added}개를 받고 ${removed}개를 주었어요. 몇 개 남았을까요?`, answer: { format: 'number' as const, normalized: String(answer) }, solutionSteps: [`${first}+${added}=${first + added}`, `${first + added}-${removed}=${answer}`], hintSteps: ['받은 구슬은 먼저 더해요.', '준 구슬은 그다음 빼요.'] } },
  },
  {
    familyId: 'g2-1-add-sub-missing-start', primaryStandard: '[2수01-09]', connectedStandards: ['[2수01-07]'],
    cognitiveDomain: 'reasoning' as const, reasoningPattern: 'inverse' as const,
    representations: ['text', 'equation', 'diagram'] as const, estimatedSteps: 3,
    modelId: 'g2-add-sub-initial-amount-inverse-v1', unknownRole: 'initial-count',
    requiredStudentActions: ['interpret_context', 'infer_missing_value', 'choose_model', 'verify_result'] as const,
    misconceptionRefs: [MISSING],
    cases: [{ added: 18, end: 45 }, { added: 27, end: 63 }, { added: 39, end: 82 }],
    render: (p: Readonly<Record<string, JsonValue>>) => { const added = numberParam(p, 'added'); const end = numberParam(p, 'end'); const start = end - added; return { prompt: `스티커에 ${added}개를 더했더니 ${end}개가 되었어요. 처음에는 몇 개였을까요?`, answer: { format: 'number' as const, normalized: String(start) }, solutionSteps: [`처음 수는 ${end}-${added}로 구해요.`, `${end}-${added}=${start}`], hintSteps: ['마지막 수가 전체예요.', '전체에서 더한 수를 빼요.'] } },
  },
  {
    familyId: 'g2-1-add-sub-strategy-compare', primaryStandard: '[2수01-06]', connectedStandards: ['[2수01-07]'],
    cognitiveDomain: 'reasoning' as const, reasoningPattern: 'compare_methods' as const,
    representations: ['text', 'equation', 'diagram'] as const, estimatedSteps: 3,
    modelId: 'g2-add-sub-strategy-equivalence-v1', unknownRole: 'valid-strategy',
    requiredStudentActions: ['compare_strategies', 'evaluate_claim', 'execute_calculation', 'verify_result'] as const,
    misconceptionRefs: [OPERATION],
    cases: [{ first: 38, second: 27, operation: 'add', aResult: 65, bResult: 55 }, { first: 52, second: 28, operation: 'subtract', aResult: 34, bResult: 24 }, { first: 46, second: 19, operation: 'add', aResult: 55, bResult: 65 }],
    render: (p: Readonly<Record<string, JsonValue>>) => { const first = numberParam(p, 'first'); const second = numberParam(p, 'second'); const operation = stringParam(p, 'operation'); const aResult = numberParam(p, 'aResult'); const bResult = numberParam(p, 'bResult'); const symbol = operation === 'add' ? '+' : '-'; const result = operation === 'add' ? first + second : first - second; const answer = aResult === result ? '가' : '나'; const claims = [`가: ${first}${symbol}${second}=${aResult}`, `나: ${first}${symbol}${second}=${bResult}`]; return { prompt: `계산 방법이 맞는 친구는 누구일까요? ${claims.join(' ')}`, ...choice(answer, ['가', '나']), solutionSteps: ['일의 자리와 십의 자리를 차례로 계산해요.', `${answer}의 결과 ${result}가 맞아요.`], hintSteps: ['두 방법의 결과를 각각 확인해요.', '원래 식에 맞는 결과를 골라요.'] } },
  },
  {
    familyId: 'g2-1-add-sub-operation-check', primaryStandard: '[2수01-05]', connectedStandards: ['[2수01-08]', '[2수01-09]'],
    cognitiveDomain: 'reasoning' as const, reasoningPattern: 'error_analysis' as const,
    representations: ['text', 'equation', 'diagram'] as const, estimatedSteps: 3,
    modelId: 'g2-add-sub-context-operation-error-v1', unknownRole: 'correct-operation-claim',
    requiredStudentActions: ['interpret_context', 'choose_model', 'evaluate_claim', 'verify_result'] as const,
    misconceptionRefs: [OPERATION, MISSING],
    cases: [{ first: 45, second: 18, story: '남은 수', aOperation: 'subtract', bOperation: 'add' }, { first: 27, second: 16, story: '모두', aOperation: 'subtract', bOperation: 'add' }, { first: 63, second: 29, story: '차이', aOperation: 'subtract', bOperation: 'add' }],
    render: (p: Readonly<Record<string, JsonValue>>) => { const first = numberParam(p, 'first'); const second = numberParam(p, 'second'); const story = stringParam(p, 'story'); const aOperation = stringParam(p, 'aOperation'); const bOperation = stringParam(p, 'bOperation'); const expectedOperation = story === '모두' ? 'add' : 'subtract'; const answer = aOperation === expectedOperation ? '가' : '나'; const expression = (operation: string) => `${first}${operation === 'add' ? '+' : '-'}${second}`; const claims = [`가: ${expression(aOperation)}`, `나: ${expression(bOperation)}`]; return { prompt: `${first}과 ${second}로 ${story}를 구하는 식을 바르게 고른 친구는 누구일까요? ${claims.join(' ')}`, ...choice(answer, ['가', '나']), solutionSteps: [`${story}의 뜻에 맞는 연산을 정해요.`, `${answer}가 고른 식 ${expression(expectedOperation)}이 맞아요.`], hintSteps: ['무엇을 묻는지 먼저 말해 보아요.', '전체면 더하고, 남은 수나 차이면 빼요.'] } },
  },
] as const

export const G2_1_ADD_SUB_FAMILY_RECIPES = definitions.map((definition) => createG2SemesterOneFamilyRecipe({
  ...definition,
  packId: 'pack-g2-1-add-sub', unitId: 'g2-1-add-sub', conceptIds: [CONCEPT],
  connectedStandards: [...definition.connectedStandards], representations: [...definition.representations], requiredStudentActions: [...definition.requiredStudentActions], cases: definition.cases,
  visual: { semantics: 'quantitative', generatorId: 'g2-add-sub-bars' },
  scene: (params, rendered) => buildG2SemesterOneAddSubScene(definition.familyId, params, rendered),
}))
