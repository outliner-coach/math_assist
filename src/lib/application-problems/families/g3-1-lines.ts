import { createGrade3ApplicationFamilyRecipe } from './g3-family-support'

const PACK = 'pack-g3-1-lines'
const UNIT = 'g3-1-lines'
const CONCEPTS = ['g3-1-lines-line-angle']
const STANDARDS = ['[4수03-01]', '[4수03-02]']
const MISCONCEPTIONS = ['g3-lines-endpoint-confusion', 'g3-angle-size-by-arm-length']
const common = { packId: PACK, unitId: UNIT, conceptIds: CONCEPTS, primaryStandard: STANDARDS[0], connectedStandards: [STANDARDS[1]], representations: ['text', 'diagram'] as const, visualMode: 'lines' as const, visualGeneratorId: 'g3-line-angle-diagram', visualDescription: '선의 방향과 각의 벌어진 정도를 같은 길이의 두 선으로 나타낸 그림' }

export const G3_1_LINES_FAMILY_RECIPES = [
  { familyId: 'g3-1-lines-map-classification', cognitiveDomain: 'applying' as const, reasoningPattern: 'representation_shift' as const, estimatedSteps: 2, modelId: 'g3-lines-map-classification-v1', unknownRole: 'two-classifications', requiredStudentActions: ['interpret_context', 'convert_representation', 'choose_model'] as const, misconceptionRefs: MISCONCEPTIONS, cases: [{ lineKind: '직선', angle: 45 }, { lineKind: '선분', angle: 90 }, { lineKind: '반직선', angle: 120 }] },
  { familyId: 'g3-1-lines-angle-constraint', cognitiveDomain: 'reasoning' as const, reasoningPattern: 'constraint' as const, estimatedSteps: 3, modelId: 'g3-lines-angle-constraint-v1', unknownRole: 'valid-angle', requiredStudentActions: ['test_constraint', 'compare_strategies', 'verify_result'] as const, misconceptionRefs: ['g3-angle-size-by-arm-length'], cases: [{ low: 30, high: 70, candidate: 50, angle: 50 }, { low: 80, high: 100, candidate: 90, angle: 90 }, { low: 100, high: 150, candidate: 125, angle: 125 }] },
  { familyId: 'g3-1-lines-property-check', cognitiveDomain: 'reasoning' as const, reasoningPattern: 'model_and_check' as const, estimatedSteps: 2, modelId: 'g3-lines-property-model-v1', unknownRole: 'claim-validity', requiredStudentActions: ['choose_model', 'evaluate_claim', 'verify_result'] as const, misconceptionRefs: ['g3-lines-endpoint-confusion'], cases: [{ lineKind: '직선', claimedKind: '선분' }, { lineKind: '선분', claimedKind: '선분' }, { lineKind: '반직선', claimedKind: '직선' }] },
  { familyId: 'g3-1-lines-classification-error', cognitiveDomain: 'reasoning' as const, reasoningPattern: 'error_analysis' as const, estimatedSteps: 2, modelId: 'g3-lines-angle-error-v1', unknownRole: 'correct-angle-kind', requiredStudentActions: ['convert_representation', 'evaluate_claim', 'verify_result'] as const, misconceptionRefs: ['g3-angle-size-by-arm-length'], cases: [{ angle: 35, claimedKind: '둔각' }, { angle: 90, claimedKind: '예각' }, { angle: 135, claimedKind: '직각' }] },
].map((definition) => createGrade3ApplicationFamilyRecipe({ ...common, ...definition, conceptIds: [...common.conceptIds], connectedStandards: [...common.connectedStandards], requiredStudentActions: [...definition.requiredStudentActions], misconceptionRefs: [...definition.misconceptionRefs], cases: definition.cases }))
