import { createGrade3ApplicationFamilyRecipe } from './g3-family-support'

const PACK = 'pack-g3-1-add-sub'
const UNIT = 'g3-1-add-sub'
const CONCEPT = 'g3-1-add-sub-addition-subtraction'
const STANDARD = '[4수01-03]'
const MISCONCEPTION = 'g3-add-sub-place-alignment'
const common = { packId: PACK, unitId: UNIT, conceptIds: [CONCEPT], primaryStandard: STANDARD, connectedStandards: [], representations: ['text', 'equation', 'diagram'] as const, visualMode: 'bars' as const, visualGeneratorId: 'g3-add-sub-bars', visualDescription: '세 자리 수의 변화 관계를 막대 길이로 나타낸 그림' }

export const G3_1_ADD_SUB_FAMILY_RECIPES = [
  { familyId: 'g3-1-add-sub-story-change', cognitiveDomain: 'applying' as const, reasoningPattern: 'multi_step' as const, estimatedSteps: 3, modelId: 'g3-add-sub-change-v1', unknownRole: 'final-count', requiredStudentActions: ['interpret_context', 'choose_model', 'execute_calculation', 'verify_result'] as const, misconceptionRefs: [MISCONCEPTION], cases: [{ start: 325, added: 148, removed: 96 }, { start: 417, added: 286, removed: 175 }, { start: 538, added: 247, removed: 319 }] },
  { familyId: 'g3-1-add-sub-missing-start', cognitiveDomain: 'reasoning' as const, reasoningPattern: 'inverse' as const, estimatedSteps: 3, modelId: 'g3-add-sub-inverse-v1', unknownRole: 'initial-count', requiredStudentActions: ['interpret_context', 'infer_missing_value', 'verify_result'] as const, misconceptionRefs: [MISCONCEPTION], cases: [{ added: 178, end: 523 }, { added: 296, end: 714 }, { added: 349, end: 861 }] },
  { familyId: 'g3-1-add-sub-strategy-check', cognitiveDomain: 'reasoning' as const, reasoningPattern: 'compare_methods' as const, estimatedSteps: 3, modelId: 'g3-add-sub-strategy-v1', unknownRole: 'valid-strategy', requiredStudentActions: ['compare_strategies', 'evaluate_claim', 'execute_calculation', 'verify_result'] as const, misconceptionRefs: [MISCONCEPTION], cases: [{ a: 347, b: 286, claimed: 633 }, { a: 458, b: 175, claimed: 623 }, { a: 569, b: 248, claimed: 817 }] },
  { familyId: 'g3-1-add-sub-operation-error', cognitiveDomain: 'reasoning' as const, reasoningPattern: 'error_analysis' as const, estimatedSteps: 3, modelId: 'g3-add-sub-operation-error-v1', unknownRole: 'correct-result', requiredStudentActions: ['interpret_context', 'evaluate_claim', 'execute_calculation', 'verify_result'] as const, misconceptionRefs: [MISCONCEPTION], cases: [{ start: 426, change: 187, relation: 'add' }, { start: 735, change: 268, relation: 'subtract' }, { start: 584, change: 319, relation: 'add' }] },
].map((definition) => createGrade3ApplicationFamilyRecipe({ ...common, ...definition, requiredStudentActions: [...definition.requiredStudentActions], cases: definition.cases }))
