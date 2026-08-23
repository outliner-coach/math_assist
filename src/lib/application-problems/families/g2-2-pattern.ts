import type { JsonValue } from '../contracts'
import { createG2FiniteDraftFamily, type G2FiniteDraftFamilyDefinition } from './g2-2-content-core'

const PACK_ID = 'pack-g2-2-pattern', UNIT_ID = 'g2-2-pattern', CONCEPT = 'g2-2-pattern-pattern'
function n(p: Readonly<Record<string, JsonValue>>, k: string): number { const v = p[k]; if (!Number.isSafeInteger(v) || (v as number) <= 0) throw new TypeError(k); return v as number }

const definitions: readonly G2FiniteDraftFamilyDefinition[] = [
  {
    familyId: 'g2-2-pattern-step-application', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수02-01]', connectedStandards: ['[2수02-02]'],
    cognitiveDomain: 'applying', reasoningPattern: 'multi_step', representations: ['text', 'diagram', 'table'],
    modelId: 'g2-pattern-repeated-step-v1', unknownRole: 'later-pattern-value',
    requiredStudentActions: ['interpret_context', 'choose_model', 'execute_calculation'],
    misconceptionRefs: ['pattern-add-once-only'], visualSurface: 'table', visualValueKeys: ['start', 'step', 'position'],
    cases: [{ start: 4, step: 3, position: 5 }, { start: 7, step: 4, position: 6 }],
    render: (p) => { const start = n(p, 'start'), step = n(p, 'step'), position = n(p, 'position'), answer = start + step * (position - 1); return { prompt: `${start}에서 시작해 ${step}씩 커지는 수 배열의 ${position}번째 수는 무엇일까요?`, answer: { format: 'number', normalized: String(answer) }, solutionSteps: [`첫 수 뒤로 ${step}을 ${position - 1}번 더해요.`, `${position}번째 수는 ${answer}이에요.`], hintSteps: ['첫 수는 이미 첫 번째예요.', '다음 자리마다 같은 수를 더하세요.'] } },
  },
  {
    familyId: 'g2-2-pattern-find-start', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수02-01]', connectedStandards: ['[2수02-02]'],
    cognitiveDomain: 'reasoning', reasoningPattern: 'inverse', representations: ['text', 'table'],
    modelId: 'g2-pattern-later-value-to-start-v1', unknownRole: 'starting-value',
    requiredStudentActions: ['convert_representation', 'infer_missing_value', 'verify_result'],
    misconceptionRefs: ['pattern-add-once-only'], visualSurface: 'table', visualValueKeys: ['step', 'position', 'later'],
    cases: [{ step: 5, position: 4, later: 23 }, { step: 4, position: 6, later: 29 }],
    render: (p) => { const step = n(p, 'step'), position = n(p, 'position'), later = n(p, 'later'), answer = later - step * (position - 1); return { prompt: `${step}씩 커지는 배열의 ${position}번째 수가 ${later}예요. 첫 수는 무엇일까요?`, answer: { format: 'number', normalized: String(answer) }, solutionSteps: [`${later}에서 ${step}을 ${position - 1}번 거꾸로 빼요.`, `첫 수는 ${answer}이에요.`], hintSteps: ['뒤에서 앞으로 같은 수를 빼세요.', '다시 커지는 배열을 만들어 확인하세요.'] } },
  },
  {
    familyId: 'g2-2-pattern-broken-term', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수02-01]', connectedStandards: ['[2수02-02]'],
    cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', representations: ['text', 'diagram'],
    modelId: 'g2-pattern-broken-term-claim-v1', unknownRole: 'incorrect-pattern-position',
    requiredStudentActions: ['convert_representation', 'evaluate_claim', 'verify_result'],
    misconceptionRefs: ['pattern-change-step'], visualSurface: 'diagram', visualValueKeys: ['start', 'step', 'wrong-position'],
    cases: [{ start: 3, step: 4, 'wrong-position': 4 }, { start: 6, step: 5, 'wrong-position': 5 }],
    render: (p) => { const start = n(p, 'start'), step = n(p, 'step'), pos = n(p, 'wrong-position'); const expected = start + step * (pos - 1), shown = expected + 1; const choices = ['맞아요', '틀려요']; return { prompt: `${start}에서 ${step}씩 커지는 배열의 ${pos}번째 수를 ${shown}이라고 했어요. 맞을까요?`, answer: { format: 'choice', normalized: '틀려요' }, choices, correctChoiceIndex: 1, solutionSteps: [`같은 수 ${step}을 차례로 더해요.`, `${pos}번째는 ${expected}이므로 틀려요.`], hintSteps: ['매번 더한 수가 같은지 보세요.', '처음부터 차례로 적어 보세요.'] } },
  },
  {
    familyId: 'g2-2-pattern-far-step', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수02-02]', connectedStandards: ['[2수02-01]'],
    cognitiveDomain: 'reasoning', reasoningPattern: 'pattern_generalization', representations: ['text', 'table'],
    modelId: 'g2-pattern-far-position-rule-v1', unknownRole: 'far-position-value',
    requiredStudentActions: ['choose_model', 'convert_representation', 'verify_result'],
    misconceptionRefs: ['pattern-add-once-only', 'pattern-change-step'], visualSurface: 'table', visualValueKeys: ['start', 'step', 'position'],
    cases: [{ start: 2, step: 6, position: 8 }, { start: 5, step: 7, position: 9 }],
    render: (p) => { const start = n(p, 'start'), step = n(p, 'step'), position = n(p, 'position'), answer = start + step * (position - 1); return { prompt: `첫 수가 ${start}이고 매번 ${step}씩 커져요. 모두 쓰지 않고 ${position}번째 수를 구하세요.`, answer: { format: 'number', normalized: String(answer) }, solutionSteps: [`첫 수 뒤에는 ${position - 1}번 변해요.`, `${start}+${step}×${position - 1}=${answer}`], hintSteps: ['자리 수보다 한 번 적게 변해요.', '같은 변화를 여러 번 묶어 보세요.'] } },
  },
]
export const G2_2_PATTERN_DRAFT_FAMILIES = Object.freeze(definitions.map(createG2FiniteDraftFamily))
