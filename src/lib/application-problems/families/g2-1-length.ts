import type { JsonValue } from '../contracts'
import { createG2SemesterOneFamilyRecipe, numberParam, stringParam } from './g2-1-family-support'
import { buildG2SemesterOneLengthScene } from './g2-1-length-visual'

const CONCEPT = 'g2-1-length-length'
const END = 'g2-length-end-mark-only'
const SENSE = 'g2-length-unit-sense'
function choice(answer: string, choices: string[]) { return { answer: { format: 'choice' as const, normalized: answer }, choices, correctChoiceIndex: choices.indexOf(answer) } }

const definitions = [
  {
    familyId: 'g2-1-length-ruler-gap', primaryStandard: '[2수03-10]', connectedStandards: ['[2수03-06]'], cognitiveDomain: 'applying' as const, reasoningPattern: 'representation_shift' as const,
    representations: ['text', 'diagram'] as const, estimatedSteps: 2, modelId: 'g2-length-ruler-interval-v1', unknownRole: 'measured-length', requiredStudentActions: ['interpret_context', 'convert_representation', 'execute_calculation'] as const, misconceptionRefs: [END],
    cases: [{ start: 0, end: 7 }, { start: 2, end: 9 }, { start: 5, end: 13 }],
    render: (p: Readonly<Record<string, JsonValue>>) => { const start = numberParam(p, 'start'); const end = numberParam(p, 'end'); const length = end - start; return { prompt: `리본이 자의 ${start}cm부터 ${end}cm까지 놓였어요. 길이는 몇 cm일까요?`, answer: { format: 'number' as const, normalized: String(length) }, solutionSteps: ['끝 눈금에서 시작 눈금을 빼요.', `${end}-${start}=${length}`], hintSteps: ['눈금의 숫자가 아니라 눈금 사이를 보아요.', '시작이 0이 아니면 빼야 해요.'] } },
  },
  {
    familyId: 'g2-1-length-broken-ruler', primaryStandard: '[2수03-10]', connectedStandards: ['[2수03-06]'], cognitiveDomain: 'reasoning' as const, reasoningPattern: 'inverse' as const,
    representations: ['text', 'equation', 'diagram'] as const, estimatedSteps: 3, modelId: 'g2-length-broken-ruler-inverse-v1', unknownRole: 'object-length-from-offset', requiredStudentActions: ['interpret_context', 'infer_missing_value', 'choose_model', 'verify_result'] as const, misconceptionRefs: [END],
    cases: [{ start: 3, end: 8 }, { start: 6, end: 14 }, { start: 9, end: 18 }],
    render: (p: Readonly<Record<string, JsonValue>>) => { const start = numberParam(p, 'start'); const end = numberParam(p, 'end'); const length = end - start; return { prompt: `0이 지워진 자에서 연필의 두 끝이 ${start}cm와 ${end}cm예요. 연필은 몇 cm일까요?`, answer: { format: 'number' as const, normalized: String(length) }, solutionSteps: [`${end}에서 시작 눈금 ${start}를 빼요.`, `${end}-${start}=${length}`], hintSteps: ['끝 눈금만 답으로 쓰지 않아요.', '두 눈금 사이의 칸 수를 구해요.'] } },
  },
  {
    familyId: 'g2-1-length-estimate-check', primaryStandard: '[2수03-12]', connectedStandards: ['[2수03-06]'], cognitiveDomain: 'reasoning' as const, reasoningPattern: 'model_and_check' as const,
    representations: ['text', 'diagram'] as const, estimatedSteps: 3, modelId: 'g2-length-benchmark-estimate-v1', unknownRole: 'estimate-validity', requiredStudentActions: ['interpret_context', 'test_constraint', 'compare_strategies', 'verify_result'] as const, misconceptionRefs: [SENSE],
    cases: [{ object: '연필', estimate: 15, unit: 'cm', expectedUnit: 'cm', low: 10, high: 25 }, { object: '교실 문', estimate: 2, unit: 'cm', expectedUnit: 'm', low: 1, high: 3 }, { object: '지우개', estimate: 80, unit: 'cm', expectedUnit: 'cm', low: 3, high: 12 }],
    render: (p: Readonly<Record<string, JsonValue>>) => { const object = stringParam(p, 'object'); const estimate = numberParam(p, 'estimate'); const unit = stringParam(p, 'unit'); const expectedUnit = stringParam(p, 'expectedUnit'); const low = numberParam(p, 'low'); const high = numberParam(p, 'high'); const answer = unit !== expectedUnit ? '단위가 틀려요' : estimate > high ? '너무 길어요' : estimate < low ? '너무 짧아요' : '알맞아요'; return { prompt: `${object}의 길이를 ${estimate}${unit}라고 어림했어요. 알맞은 판단을 고르세요.`, ...choice(answer, ['알맞아요', '너무 짧아요', '너무 길어요', '단위가 틀려요']), solutionSteps: ['1cm와 1m 기준 물건을 떠올려요.', `이 어림은 ${answer}`], hintSteps: ['물건의 실제 크기를 떠올려요.', '수와 단위를 함께 확인해요.'] } },
  },
  {
    familyId: 'g2-1-length-claim-check', primaryStandard: '[2수03-10]', connectedStandards: ['[2수03-06]', '[2수03-12]'], cognitiveDomain: 'reasoning' as const, reasoningPattern: 'error_analysis' as const,
    representations: ['text', 'equation', 'diagram'] as const, estimatedSteps: 3, modelId: 'g2-length-endmark-claim-v1', unknownRole: 'valid-measurement-claim', requiredStudentActions: ['interpret_context', 'evaluate_claim', 'infer_missing_value', 'verify_result'] as const, misconceptionRefs: [END, SENSE],
    cases: [{ start: 3, end: 9, aClaim: 9, bClaim: 6 }, { start: 4, end: 11, aClaim: 7, bClaim: 11 }, { start: 8, end: 15, aClaim: 15, bClaim: 7 }],
    render: (p: Readonly<Record<string, JsonValue>>) => { const start = numberParam(p, 'start'); const end = numberParam(p, 'end'); const aClaim = numberParam(p, 'aClaim'); const bClaim = numberParam(p, 'bClaim'); const correct = end - start; const answer = aClaim === correct ? '가' : '나'; const claims = [`가: ${aClaim}cm`, `나: ${bClaim}cm`]; return { prompt: `${start}cm부터 ${end}cm까지 잰 결과를 바르게 말한 친구는 누구일까요? ${claims.join(' ')}`, ...choice(answer, ['가', '나']), solutionSteps: [`${end}-${start}=${correct}`, `${answer}의 ${correct}cm가 맞아요.`], hintSteps: ['끝 눈금만 길이로 쓰지 않아요.', '끝에서 시작을 빼요.'] } },
  },
] as const

export const G2_1_LENGTH_FAMILY_RECIPES = definitions.map((definition) => createG2SemesterOneFamilyRecipe({ ...definition, packId: 'pack-g2-1-length', unitId: 'g2-1-length', conceptIds: [CONCEPT], connectedStandards: [...definition.connectedStandards], representations: [...definition.representations], requiredStudentActions: [...definition.requiredStudentActions], cases: definition.cases, visual: { semantics: 'quantitative', generatorId: 'g2-ruler-bars' }, scene: (params, rendered) => buildG2SemesterOneLengthScene(definition.familyId, params, rendered) }))
