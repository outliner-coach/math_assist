import type { JsonValue } from '../contracts'
import { createG2SemesterOneFamilyRecipe, numberParam } from './g2-1-family-support'
import { buildG2SemesterOneMultiplicationScene } from './g2-1-multiplication-visual'

const CONCEPT = 'g2-1-multiplication-multiplication-meaning'
const ADD = 'g2-multiplication-add-factors'
const SWAP = 'g2-multiplication-swap-meaning'
function choice(answer: string, choices: string[]) { return { answer: { format: 'choice' as const, normalized: answer }, choices, correctChoiceIndex: choices.indexOf(answer) } }
const definitions = [
  {
    familyId: 'g2-1-multiplication-group-total', cognitiveDomain: 'applying' as const, reasoningPattern: 'representation_shift' as const, estimatedSteps: 2, modelId: 'g2-multiplication-equal-groups-total-v1', unknownRole: 'total-items', requiredStudentActions: ['interpret_context', 'convert_representation', 'execute_calculation'] as const, misconceptionRefs: [ADD],
    cases: [{ groups: 3, each: 4 }, { groups: 5, each: 2 }, { groups: 4, each: 6 }],
    render: (p: Readonly<Record<string, JsonValue>>) => { const groups = numberParam(p, 'groups'); const each = numberParam(p, 'each'); const total = groups * each; return { prompt: `접시 ${groups}개에 귤이 ${each}개씩 있어요. 귤은 모두 몇 개일까요?`, answer: { format: 'number' as const, normalized: String(total) }, solutionSteps: [`${each}을 ${groups}번 더해요.`, `${groups}×${each}=${total}`], hintSteps: ['모든 묶음의 수가 같은지 보아요.', '한 묶음의 수를 묶음 수만큼 더해요.'] } },
  },
  {
    familyId: 'g2-1-multiplication-missing-groups', cognitiveDomain: 'reasoning' as const, reasoningPattern: 'inverse' as const, estimatedSteps: 3, modelId: 'g2-multiplication-missing-group-count-v1', unknownRole: 'number-of-groups', requiredStudentActions: ['interpret_context', 'infer_missing_value', 'choose_model', 'verify_result'] as const, misconceptionRefs: [ADD],
    cases: [{ each: 3, total: 12 }, { each: 4, total: 20 }, { each: 3, total: 18 }],
    render: (p: Readonly<Record<string, JsonValue>>) => { const each = numberParam(p, 'each'); const total = numberParam(p, 'total'); const groups = total / each; return { prompt: `블록 ${total}개를 ${each}개씩 같은 묶음으로 만들어요. 몇 묶음일까요?`, answer: { format: 'number' as const, normalized: String(groups) }, solutionSteps: [`${each}개씩 묶어 ${total}이 될 때까지 세어요.`, `${each}이 ${groups}번이면 ${total}이에요.`], hintSteps: ['한 묶음의 수만큼 차례로 묶어요.', '반복한 횟수가 묶음 수예요.'] } },
  },
  {
    familyId: 'g2-1-multiplication-array-claim', cognitiveDomain: 'reasoning' as const, reasoningPattern: 'error_analysis' as const, estimatedSteps: 3, modelId: 'g2-multiplication-array-claim-v1', unknownRole: 'valid-array-claim', requiredStudentActions: ['interpret_context', 'evaluate_claim', 'convert_representation', 'verify_result'] as const, misconceptionRefs: [ADD, SWAP],
    cases: [{ groups: 3, each: 4, aTotal: 12, bTotal: 7 }, { groups: 5, each: 2, aTotal: 7, bTotal: 10 }, { groups: 4, each: 6, aTotal: 24, bTotal: 10 }],
    render: (p: Readonly<Record<string, JsonValue>>) => { const groups = numberParam(p, 'groups'); const each = numberParam(p, 'each'); const aTotal = numberParam(p, 'aTotal'); const bTotal = numberParam(p, 'bTotal'); const total = groups * each; const answer = aTotal === total ? '가' : '나'; const claims = [`가: ${groups}묶음에 ${each}개씩, 모두 ${aTotal}개`, `나: ${groups}묶음에 ${each}개씩, 모두 ${bTotal}개`]; return { prompt: `배열을 바르게 설명한 친구는 누구일까요? ${claims.join(' ')}`, ...choice(answer, ['가', '나']), solutionSteps: ['같은 수가 몇 번 있는지 세어요.', `${each}을 ${groups}번 더한 ${total}이 맞아요.`], hintSteps: ['묶음 수와 한 묶음의 수를 더하지 않아요.', '반복 덧셈으로 확인해요.'] } },
  },
  {
    familyId: 'g2-1-multiplication-model-check', cognitiveDomain: 'reasoning' as const, reasoningPattern: 'model_and_check' as const, estimatedSteps: 3, modelId: 'g2-multiplication-rotated-array-model-v1', unknownRole: 'matching-group-description', requiredStudentActions: ['compare_strategies', 'test_constraint', 'convert_representation', 'verify_result'] as const, misconceptionRefs: [SWAP],
    cases: [{ groups: 2, each: 5 }, { groups: 3, each: 4 }, { groups: 4, each: 3 }],
    render: (p: Readonly<Record<string, JsonValue>>) => { const groups = numberParam(p, 'groups'); const each = numberParam(p, 'each'); const answer = `${groups}묶음에 ${each}개씩`; const choices = [answer, `${each}묶음에 ${groups}개씩`, `${groups}+${each}개`]; return { prompt: `그림을 돌리지 않고 본 묶음 설명을 고르세요.`, ...choice(answer, choices), solutionSteps: [`묶음은 ${groups}개예요.`, `한 묶음에는 ${each}개씩 있어요.`], hintSteps: ['가로와 세로를 바꾸어 말하지 않아요.', '묶음 수와 한 묶음의 수를 따로 확인해요.'] } },
  },
] as const

export const G2_1_MULTIPLICATION_FAMILY_RECIPES = definitions.map((definition) => createG2SemesterOneFamilyRecipe({ ...definition, packId: 'pack-g2-1-multiplication', unitId: 'g2-1-multiplication', conceptIds: [CONCEPT], primaryStandard: '[2수01-10]', connectedStandards: [], representations: ['text', 'diagram'], contextType: 'real_world', readingLoad: 'low', requiredStudentActions: [...definition.requiredStudentActions], cases: definition.cases, visual: { semantics: 'schematic', generatorId: 'g2-equal-groups' }, scene: (params, rendered) => buildG2SemesterOneMultiplicationScene(definition.familyId, params, rendered) }))
