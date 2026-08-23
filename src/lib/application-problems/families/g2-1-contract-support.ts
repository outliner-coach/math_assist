import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'
import type { ApplicationVisualDiagramSceneV1, ApplicationVisualSceneV1, ApplicationVisualTableSceneV1 } from '../visual-model'

export type G2ContractSurface = 'params' | 'prompt' | 'answer' | 'choices' | 'solution' | 'hint' | 'visual'

export interface G2ContractIssue {
  code: string
  surface: G2ContractSurface
  message: string
}

export interface G2ExpectedContract {
  answer: string
  answerFormat: 'number' | 'choice'
  promptRequired: readonly string[]
  promptForbidden?: readonly string[]
  choices?: readonly string[]
  solutionRequired: readonly string[]
  hintRequired?: readonly string[]
}

function issue(issues: G2ContractIssue[], surface: G2ContractSurface, code: string, message: string): void {
  issues.push({ surface, code, message })
}

export function safeInteger(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new TypeError(key)
  return value as number
}

export function requiredString(params: Readonly<Record<string, JsonValue>>, key: string): string {
  const value = params[key]
  if (typeof value !== 'string' || value.length === 0) throw new TypeError(key)
  return value
}

export function validateBaseContract(
  problem: GeneratedApplicationProblemV1,
  expected: G2ExpectedContract,
): G2ContractIssue[] {
  const issues: G2ContractIssue[] = []
  for (const token of expected.promptRequired) {
    if (!problem.prompt.includes(token)) issue(issues, 'prompt', 'missing_prompt_given', `prompt must include ${token}`)
  }
  for (const token of expected.promptForbidden ?? []) {
    if (problem.prompt.includes(token)) issue(issues, 'prompt', 'exposed_prompt_value', `prompt must omit ${token}`)
  }
  if (problem.answer.format !== expected.answerFormat || problem.answer.normalized !== expected.answer) {
    issue(issues, 'answer', 'answer_relation_mismatch', 'answer must be recomputed from raw parameters')
  }
  if (expected.answerFormat === 'choice') {
    if (JSON.stringify(problem.choices) !== JSON.stringify(expected.choices)) {
      issue(issues, 'choices', 'choice_set_mismatch', 'choices must match the independently derived candidates')
    }
    if (problem.choices?.[problem.correctChoiceIndex ?? -1] !== expected.answer) {
      issue(issues, 'choices', 'choice_index_mismatch', 'correct choice index must point to the derived answer')
    }
  } else if (problem.choices !== undefined || problem.correctChoiceIndex !== undefined) {
    issue(issues, 'choices', 'unexpected_choices', 'number answers must not carry choices')
  }
  const solution = problem.solutionSteps.join(' ')
  if (problem.solutionSteps.length < 2) issue(issues, 'solution', 'incomplete_solution', 'solution needs at least two checked steps')
  for (const token of expected.solutionRequired) {
    if (!solution.includes(token)) issue(issues, 'solution', 'missing_solution_relation', `solution must include ${token}`)
  }
  const hints = problem.hintSteps.join(' ')
  if (problem.hintSteps.length < 2 || /답\s*:/.test(hints)) {
    issue(issues, 'hint', 'hint_disclosure', 'hints must scaffold without stating an answer')
  }
  for (const token of expected.hintRequired ?? []) {
    if (!hints.includes(token)) issue(issues, 'hint', 'missing_hint_path', `hints must exercise ${token}`)
  }
  return issues
}

export function diagramScene(problem: GeneratedApplicationProblemV1): ApplicationVisualDiagramSceneV1 | null {
  const scene = problem.visual.mathModel as unknown as ApplicationVisualSceneV1
  return scene?.surface === 'diagram' ? scene : null
}

export function tableScene(problem: GeneratedApplicationProblemV1): ApplicationVisualTableSceneV1 | null {
  const scene = problem.visual.mathModel as unknown as ApplicationVisualSceneV1
  return scene?.surface === 'table' ? scene : null
}

export function rectWidths(scene: ApplicationVisualDiagramSceneV1): number[] {
  return scene.primitives.flatMap((primitive) => primitive.kind === 'rect' ? [primitive.width] : [])
}

export function labelText(scene: ApplicationVisualDiagramSceneV1): string {
  return scene.labels.flatMap((label) => label.content.before?.text ?? []).join(' ')
}

export function addVisualIssue(issues: G2ContractIssue[], ok: boolean, message: string): void {
  if (!ok) issue(issues, 'visual', 'independent_visual_relation_mismatch', message)
}

export function exactStringSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && new Set(left).size === left.length && left.every((entry) => right.includes(entry))
}
