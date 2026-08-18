import type { JsonValue } from '../contracts'
import { createG2FiniteDraftFamily, type G2FiniteDraftFamilyDefinition } from './g2-2-content-core'

const PACK_ID = 'pack-g2-2-table-graph'
const UNIT_ID = 'g2-2-table-graph'
const CONCEPT = 'g2-2-table-graph-table-graph'
function n(params: Readonly<Record<string, JsonValue>>, key: string): number { const value = params[key]; if (!Number.isSafeInteger(value) || (value as number) <= 0) throw new TypeError(`${key} must be positive`); return value as number }

const definitions: readonly G2FiniteDraftFamilyDefinition[] = [
  {
    familyId: 'g2-2-table-graph-survey-difference', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수04-03]', connectedStandards: ['[2수04-02]'],
    cognitiveDomain: 'applying', reasoningPattern: 'multi_step', representations: ['text', 'table', 'graph'],
    modelId: 'g2-table-graph-survey-difference-v1', unknownRole: 'largest-smallest-difference',
    requiredStudentActions: ['interpret_context', 'convert_representation', 'execute_calculation'],
    misconceptionRefs: ['table-graph-ignore-category'], visualSurface: 'table', visualValueKeys: ['apple', 'grape', 'melon'],
    cases: [{ apple: 7, grape: 4, melon: 6 }, { apple: 5, grape: 9, melon: 3 }],
    render: (p) => { const values = [n(p, 'apple'), n(p, 'grape'), n(p, 'melon')]; const answer = Math.max(...values) - Math.min(...values); return { prompt: `사과 ${values[0]}명, 포도 ${values[1]}명, 수박 ${values[2]}명인 표가 있어요. 가장 많은 것과 적은 것의 차는 몇 명일까요?`, answer: { format: 'number', normalized: String(answer) }, solutionSteps: [`가장 큰 수와 작은 수를 찾아요.`, `두 수의 차는 ${answer}명이에요.`], hintSteps: ['종류와 수를 맞춰 읽으세요.', '가장 큰 수에서 가장 작은 수를 빼세요.'] } },
  },
  {
    familyId: 'g2-2-table-graph-missing-category', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수04-02]', connectedStandards: ['[2수04-03]'],
    cognitiveDomain: 'reasoning', reasoningPattern: 'inverse', representations: ['text', 'table'],
    modelId: 'g2-table-graph-missing-count-v1', unknownRole: 'missing-category-count',
    requiredStudentActions: ['select_relevant_data', 'infer_missing_value', 'verify_result'],
    misconceptionRefs: ['table-graph-ignore-category'], visualSurface: 'table', visualValueKeys: ['total', 'first', 'second'],
    cases: [{ total: 18, first: 7, second: 5 }, { total: 24, first: 8, second: 9 }],
    render: (p) => { const total = n(p, 'total'), first = n(p, 'first'), second = n(p, 'second'), answer = total - first - second; return { prompt: `세 종류를 조사한 수는 모두 ${total}개예요. 두 종류가 ${first}개와 ${second}개라면 나머지는 몇 개일까요?`, answer: { format: 'number', normalized: String(answer) }, solutionSteps: [`알려진 두 수는 ${first + second}개예요.`, `${total}-${first}-${second}=${answer}`], hintSteps: ['전체에서 알려진 두 종류를 빼세요.', '세 수를 더해 전체인지 확인하세요.'] } },
  },
  {
    familyId: 'g2-2-table-graph-claim-error', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수04-03]', connectedStandards: ['[2수04-02]'],
    cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', representations: ['text', 'graph'],
    modelId: 'g2-table-graph-largest-claim-v1', unknownRole: 'valid-largest-category',
    requiredStudentActions: ['interpret_context', 'compare_strategies', 'evaluate_claim'],
    misconceptionRefs: ['table-graph-ignore-category'], visualSurface: 'diagram', visualValueKeys: ['soccer', 'baseball', 'dodgeball'],
    cases: [{ soccer: 8, baseball: 5, dodgeball: 6 }, { soccer: 4, baseball: 9, dodgeball: 7 }],
    render: (p) => { const entries = [['축구', n(p, 'soccer')], ['야구', n(p, 'baseball')], ['피구', n(p, 'dodgeball')]] as const; const actual = [...entries].sort((a, b) => b[1] - a[1])[0][0]; const choices = ['가', '나']; return { prompt: `가: 첫 줄인 축구가 가장 많아. 나: 표식 수를 세면 ${actual}가 가장 많아. 누구 말이 맞나요?`, answer: { format: 'choice', normalized: '나' }, choices, correctChoiceIndex: 1, solutionSteps: ['각 종목의 표식 수를 세어요.', `${actual}의 수가 가장 커서 나가 맞아요.`], hintSteps: ['줄의 위치만 보지 마세요.', '각 줄의 표식 수를 비교하세요.'] } },
  },
  {
    familyId: 'g2-2-table-graph-key-sufficiency', packId: PACK_ID, packVersion: 1, unitId: UNIT_ID,
    conceptIds: [CONCEPT], primaryStandard: '[2수04-03]', connectedStandards: ['[2수04-02]'],
    cognitiveDomain: 'reasoning', reasoningPattern: 'data_sufficiency', representations: ['text', 'graph'],
    modelId: 'g2-table-graph-key-sufficiency-v1', unknownRole: 'enough-graph-key-data',
    requiredStudentActions: ['select_relevant_data', 'test_constraint', 'evaluate_claim'],
    misconceptionRefs: ['table-graph-count-marks-not-scale'], visualSurface: 'diagram', visualValueKeys: ['marks', 'per-mark', 'has-key'],
    cases: [{ marks: 4, 'per-mark': 2, 'has-key': 1 }, { marks: 5, 'per-mark': 3, 'has-key': 2 }],
    render: (p) => { const hasKey = n(p, 'has-key') === 1; const answer = hasKey ? '구할 수 있어요' : '표식 한 개의 뜻이 필요해요'; const choices = ['구할 수 있어요', '표식 한 개의 뜻이 필요해요']; return { prompt: `표식이 ${n(p, 'marks')}개예요.${hasKey ? ` 표식 한 개는 ${n(p, 'per-mark')}명을 뜻해요.` : ''} 사람 수를 구할 수 있을까요?`, answer: { format: 'choice', normalized: answer }, choices, correctChoiceIndex: choices.indexOf(answer), solutionSteps: [hasKey ? '표식 수와 한 개의 뜻이 모두 있어요.' : '표식 수만 있고 한 개가 몇 명인지 없어요.', answer], hintSteps: ['표식 한 개가 몇 명인지 보세요.', '필요한 정보가 모두 있는지 확인하세요.'] } },
  },
]

export const G2_2_TABLE_GRAPH_DRAFT_FAMILIES = Object.freeze(definitions.map(createG2FiniteDraftFamily))
