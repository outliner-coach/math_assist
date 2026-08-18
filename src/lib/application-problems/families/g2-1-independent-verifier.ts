import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'
import { parseApplicationVisualSceneV1 } from '../visual-model'
import { evaluateG2SemesterOneAddSubOracle } from './g2-1-add-sub.oracle'
import { evaluateG2SemesterOneClassificationOracle } from './g2-1-classification.oracle'
import {
  exactStringSet,
  requiredString,
  safeInteger,
  type G2ContractIssue,
} from './g2-1-contract-support'
import { evaluateG2SemesterOneLengthOracle } from './g2-1-length.oracle'
import { evaluateG2SemesterOneMultiplicationOracle } from './g2-1-multiplication.oracle'
import { evaluateG2SemesterOnePlaceValueOracle } from './g2-1-place-value.oracle'
import { evaluateG2SemesterOneShapesOracle } from './g2-1-shapes.oracle'

function issue(
  issues: G2ContractIssue[],
  surface: G2ContractIssue['surface'],
  code: string,
  message: string,
): void {
  issues.push({ surface, code, message })
}

function oracle(problem: GeneratedApplicationProblemV1): string {
  if (problem.familyId.startsWith('g2-1-add-sub-')) return evaluateG2SemesterOneAddSubOracle(problem)
  if (problem.familyId.startsWith('g2-1-classification-')) return evaluateG2SemesterOneClassificationOracle(problem)
  if (problem.familyId.startsWith('g2-1-length-')) return evaluateG2SemesterOneLengthOracle(problem)
  if (problem.familyId.startsWith('g2-1-multiplication-')) return evaluateG2SemesterOneMultiplicationOracle(problem)
  if (problem.familyId.startsWith('g2-1-place-value-')) return evaluateG2SemesterOnePlaceValueOracle(problem)
  if (problem.familyId.startsWith('g2-1-shapes-')) return evaluateG2SemesterOneShapesOracle(problem)
  throw new TypeError(`unsupported Grade 2 semester-one family ${problem.familyId}`)
}

function promptTokens(problem: GeneratedApplicationProblemV1): string[] {
  const p = problem.params
  const n = (key: string) => String(safeInteger(p, key))
  const s = (key: string) => requiredString(p, key)
  switch (problem.familyId) {
    case 'g2-1-add-sub-story-total': return [n('first'), n('added'), n('removed')]
    case 'g2-1-add-sub-missing-start': return [n('added'), n('end')]
    case 'g2-1-add-sub-strategy-compare': return [n('first'), n('second'), n('aResult'), n('bResult')]
    case 'g2-1-add-sub-operation-check': return [n('first'), n('second'), '식을 바르게']
    case 'g2-1-classification-sort-count': return [s('target')]
    case 'g2-1-classification-missing-count': return [n('total'), n('first'), n('second'), s('missingName')]
    case 'g2-1-classification-rule-check': return [s('rule'), s('required'), s('item')]
    case 'g2-1-classification-claim-check': return [n('aTotal'), n('bTotal')]
    case 'g2-1-length-ruler-gap':
    case 'g2-1-length-broken-ruler': return [n('start'), n('end'), 'cm']
    case 'g2-1-length-estimate-check': return [s('object'), `${n('estimate')}${s('unit')}`]
    case 'g2-1-length-claim-check': return [n('start'), n('end'), n('aClaim'), n('bClaim'), 'cm']
    case 'g2-1-multiplication-group-total': return [n('groups'), n('each')]
    case 'g2-1-multiplication-missing-groups': return [n('total'), n('each')]
    case 'g2-1-multiplication-array-claim': return [n('groups'), n('each'), n('aTotal'), n('bTotal')]
    case 'g2-1-multiplication-model-check': return ['묶음 설명']
    case 'g2-1-place-value-build-number': return [n('hundreds'), n('tens'), n('ones')]
    case 'g2-1-place-value-compare-orders': return [n('left'), n('right')]
    case 'g2-1-place-value-missing-digit': return [n('hundreds'), n('ones'), '□']
    case 'g2-1-place-value-claim-check': return [n('number'), n('aValue'), n('bValue')]
    case 'g2-1-place-value-between-check': return [n('low'), n('high')]
    case 'g2-1-shapes-object-match': return [s('object'), '입체도형']
    case 'g2-1-shapes-border-build': return safeInteger(p, 'sides') === 0
      ? ['곧은 변과 꼭짓점이 없는']
      : [n('sides'), n('vertices')]
    case 'g2-1-shapes-condition-check': return [n('sides'), n('vertices')]
    case 'g2-1-shapes-hidden-layer': return [n('total'), n('bottom')]
    case 'g2-1-shapes-property-claim': return [s('shape'), n('aSides'), n('bSides')]
    default: throw new TypeError(`missing prompt contract for ${problem.familyId}`)
  }
}

function expectedChoices(problem: GeneratedApplicationProblemV1): string[] | undefined {
  const p = problem.params
  const n = (key: string) => safeInteger(p, key)
  switch (problem.familyId) {
    case 'g2-1-add-sub-strategy-compare':
    case 'g2-1-add-sub-operation-check':
    case 'g2-1-classification-claim-check':
    case 'g2-1-length-claim-check':
    case 'g2-1-multiplication-array-claim':
    case 'g2-1-place-value-claim-check':
    case 'g2-1-shapes-property-claim': return ['가', '나']
    case 'g2-1-classification-rule-check': return ['넣어요', '넣지 않아요']
    case 'g2-1-length-estimate-check': return ['알맞아요', '너무 짧아요', '너무 길어요', '단위가 틀려요']
    case 'g2-1-multiplication-model-check': return [
      `${n('groups')}묶음에 ${n('each')}개씩`,
      `${n('each')}묶음에 ${n('groups')}개씩`,
      `${n('groups')}+${n('each')}개`,
    ]
    case 'g2-1-place-value-compare-orders': return [String(n('left')), String(n('right')), '같아요']
    case 'g2-1-place-value-between-check': return [String(n('candidate')), String(n('low') - 1), String(n('high') + 1)]
    case 'g2-1-shapes-object-match': return ['직육면체', '원기둥', '구']
    case 'g2-1-shapes-border-build':
    case 'g2-1-shapes-condition-check': return ['삼각형', '사각형', '원']
    default: return undefined
  }
}

function allBeforeText(value: unknown, texts: string[] = []): string[] {
  if (!value || typeof value !== 'object') return texts
  if (Array.isArray(value)) {
    value.forEach((entry) => allBeforeText(entry, texts))
    return texts
  }
  const record = value as Record<string, unknown>
  const before = record.before
  if (before && typeof before === 'object' && typeof (before as Record<string, unknown>).text === 'string') {
    texts.push((before as Record<string, unknown>).text as string)
  }
  Object.entries(record).forEach(([key, entry]) => {
    if (key !== 'after') allBeforeText(entry, texts)
  })
  return texts
}

function verifyVisual(problem: GeneratedApplicationProblemV1, issues: G2ContractIssue[]): void {
  let scene
  try {
    scene = parseApplicationVisualSceneV1(problem.visual.mathModel)
  } catch (error) {
    issue(issues, 'visual', 'invalid_visual_model', error instanceof Error ? error.message : String(error))
    return
  }
  const publicText = allBeforeText(scene).join(' ')
  if (publicText.includes(`답: ${problem.answer.normalized}`)) {
    issue(issues, 'visual', 'pre_submit_answer_exposure', 'public visual text exposes the answer')
  }
  if (scene.surface === 'table') {
    if (scene.rows.length === 0) issue(issues, 'visual', 'empty_table_visual', 'required table has no rows')
    scene.rows.forEach((row) => row.cells.forEach((cell) => {
      if (cell.numericValue !== undefined && cell.before?.text !== String(cell.numericValue)) {
        issue(issues, 'visual', 'table_numeric_mismatch', `${row.key} text and numeric value disagree`)
      }
      if (cell.numericValue !== undefined && cell.numericDisclosure !== 'given') {
        issue(issues, 'visual', 'table_disclosure_mismatch', `${row.key} numeric value is not a given`)
      }
    }))
    return
  }

  const primitiveByKey = new Map(scene.primitives.map((primitive) => [primitive.key, primitive]))
  if (scene.primitives.length === 0) issue(issues, 'visual', 'empty_diagram_visual', 'required diagram has no primitives')
  scene.constraints.forEach((constraint) => {
    if (constraint.kind === 'area') {
      const primitive = primitiveByKey.get(constraint.primitiveKey)
      const actual = primitive?.kind === 'rect' ? primitive.width * primitive.height : undefined
      if (actual === undefined || actual <= 0 || actual !== constraint.expected) {
        issue(issues, 'visual', 'area_relation_mismatch', `${constraint.primitiveKey} area is inconsistent`)
      }
    } else if (constraint.kind === 'segment-length') {
      const primitive = primitiveByKey.get(constraint.primitiveKey)
      const actual = primitive?.kind === 'line'
        ? Math.hypot(primitive.x2 - primitive.x1, primitive.y2 - primitive.y1)
        : undefined
      if (actual === undefined || Math.abs(actual - constraint.expected) > 1e-9) {
        issue(issues, 'visual', 'segment_relation_mismatch', `${constraint.primitiveKey} length is inconsistent`)
      }
    } else if (constraint.kind === 'topology') {
      if (!primitiveByKey.has(constraint.firstKey) || !primitiveByKey.has(constraint.secondKey)) {
        issue(issues, 'visual', 'topology_relation_mismatch', 'topology references a missing primitive')
      }
    }
  })

  if (problem.familyId === 'g2-1-place-value-build-number') {
    const values = [safeInteger(problem.params, 'hundreds'), safeInteger(problem.params, 'tens'), safeInteger(problem.params, 'ones')]
    values.forEach((value, index) => {
      const primitive = primitiveByKey.get(`bar-${index}`)
      if (value === 0 ? primitive !== undefined : primitive?.kind !== 'rect' || primitive.width !== value || primitive.height !== 14) {
        issue(issues, 'visual', 'zero_or_place_area_mismatch', `place ${index} does not encode ${value}`)
      }
    })
  }
  if (problem.familyId === 'g2-1-place-value-missing-digit') {
    const h = safeInteger(problem.params, 'hundreds')
    const t = safeInteger(problem.params, 'tens')
    const o = safeInteger(problem.params, 'ones')
    const keys = scene.primitives.map(({ key }) => key)
    const count = (prefix: string) => keys.filter((key) => key.startsWith(prefix)).length
    if (count('hundred-') !== h || count('ten-') !== t || count('one-') !== o) {
      issue(issues, 'visual', 'hidden_digit_model_mismatch', 'base-ten blocks do not independently encode the givens')
    }
    const invalidBlock = scene.primitives.some((primitive) => {
      if (primitive.kind !== 'rect') return true
      if (primitive.key.startsWith('hundred-')) return primitive.width !== 10 || primitive.height !== 10
      if (primitive.key.startsWith('ten-')) return primitive.width !== 10 || primitive.height !== 1
      if (primitive.key.startsWith('one-')) return primitive.width !== 1 || primitive.height !== 1
      return true
    })
    if (invalidBlock) {
      issue(issues, 'visual', 'base_ten_block_scale_mismatch', 'hundred, ten, and one blocks do not preserve their independent area ratio')
    }
    const total = h * 100 + t * 10 + o
    if (publicText.includes(String(total)) || publicText.includes(`십 ${t}개`)) {
      issue(issues, 'visual', 'hidden_digit_text_exposure', 'hidden digit is stated instead of represented for counting')
    }
  }
  if (problem.familyId === 'g2-1-shapes-object-match') {
    const requiredKeys = ['cuboid-front', 'cuboid-back', 'cylinder-body', 'cylinder-top', 'sphere-outline', 'sphere-equator']
    if (!requiredKeys.every((key) => primitiveByKey.has(key)) ||
      !scene.constraints.some((constraint) => constraint.kind === 'topology')) {
      issue(issues, 'visual', 'solid_topology_missing', 'solid choices are not represented by independent topology')
    }
  }
}

export function verifyIndependentG2SemesterOneProblem(
  problem: GeneratedApplicationProblemV1,
): G2ContractIssue[] {
  const issues: G2ContractIssue[] = []
  let expectedAnswer: string
  let requiredTokens: string[]
  let choices: string[] | undefined
  try {
    expectedAnswer = oracle(problem)
    requiredTokens = promptTokens(problem)
    choices = expectedChoices(problem)
  } catch (error) {
    issue(issues, 'params', 'invalid_reviewed_parameters', error instanceof Error ? error.message : String(error))
    return issues
  }
  requiredTokens.forEach((token) => {
    if (!problem.prompt.includes(token)) issue(issues, 'prompt', 'missing_prompt_given', `prompt omits ${token}`)
  })
  if (problem.familyId === 'g2-1-place-value-missing-digit') {
    const p = problem.params
    const total = safeInteger(p, 'hundreds') * 100 + safeInteger(p, 'tens') * 10 + safeInteger(p, 'ones')
    if (problem.prompt.includes(String(total)) || problem.prompt.includes(`십 ${safeInteger(p, 'tens')}개`)) {
      issue(issues, 'prompt', 'hidden_digit_prompt_exposure', 'prompt exposes the hidden digit')
    }
  }
  if (problem.answer.normalized !== expectedAnswer) {
    issue(issues, 'answer', 'independent_answer_mismatch', 'answer disagrees with raw-parameter calculation')
  }
  if (choices) {
    if (!problem.choices || !exactStringSet(problem.choices, choices)) {
      issue(issues, 'choices', 'independent_choice_set_mismatch', 'choice set disagrees with raw parameters')
    }
    if (problem.choices?.[problem.correctChoiceIndex ?? -1] !== expectedAnswer) {
      issue(issues, 'choices', 'independent_choice_index_mismatch', 'choice index does not select the calculated answer')
    }
  } else if (problem.choices !== undefined || problem.correctChoiceIndex !== undefined) {
    issue(issues, 'choices', 'unexpected_choice_contract', 'number answer unexpectedly has choices')
  }
  const solution = problem.solutionSteps.join(' ')
  const solutionTokens = problem.familyId === 'g2-1-multiplication-model-check'
    ? [String(safeInteger(problem.params, 'groups')), String(safeInteger(problem.params, 'each'))]
    : problem.familyId === 'g2-1-multiplication-array-claim'
      ? [String(safeInteger(problem.params, 'groups') * safeInteger(problem.params, 'each'))]
      : [expectedAnswer]
  if (problem.solutionSteps.length < 2 || solutionTokens.some((token) => !solution.includes(token))) {
    issue(issues, 'solution', 'independent_solution_mismatch', 'solution does not show the calculated result')
  }
  const hints = problem.hintSteps.join(' ')
  if (problem.hintSteps.length < 2 || hints.includes(`답: ${expectedAnswer}`)) {
    issue(issues, 'hint', 'hint_disclosure_or_gap', 'hints must scaffold without stating the answer')
  }
  verifyVisual(problem, issues)
  return issues
}
