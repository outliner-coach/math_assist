import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'
import { parseApplicationVisualSceneV1 } from '../visual-model'

export interface G2IndependentProblemExpectation {
  answer: string
  prompt: string
  solutionSteps: readonly string[]
  hintSteps: readonly string[]
  choices?: readonly string[]
  visualSurface: 'diagram' | 'table'
  visualValueKeys: readonly string[]
  requiredUnitTokens?: readonly string[]
}

const EXPECTED_PUBLIC_VISUAL_LABELS: Readonly<Record<string, string>> = Object.freeze({
  first: '첫째 수', second: '둘째 수', third: '셋째 수',
  thousands: '천의 자리', 'threshold-hundreds': '기준 백의 자리', tens: '십의 자리',
  d1: '수 카드 1', d2: '수 카드 2', d3: '수 카드 3', d4: '수 카드 4', limit: '기준 수',
  'first-groups': '첫 접시 묶음', 'second-groups': '둘째 접시 묶음', each: '한 묶음의 수',
  total: '전체', dan: '단', factor: '곱하는 수',
  'rows-a': '첫 배열의 줄', 'cols-a': '첫 배열의 한 줄', 'rows-b': '둘째 배열의 줄', 'cols-b': '둘째 배열의 한 줄',
  'object-length': '물건 길이', 'ruler-length': '도구 길이', estimate: '어림한 길이', measured: '잰 길이',
  whole: '전체 길이', known: '아는 길이', 'short-ruler': '짧은 자 길이',
  'start-hour': '시작 시', 'start-minute': '시작 분', elapsed: '걸린 분',
  'end-hour': '끝난 시', 'end-minute': '끝난 분', hour: '시침', 'minute-hand-number': '분침 숫자',
  weeks: '주 수', 'claimed-days': '말한 날 수',
  apple: '사과', grape: '포도', melon: '수박', soccer: '축구', baseball: '야구', dodgeball: '피구',
  marks: '표식 수', 'per-mark': '표식 한 개의 수',
  start: '첫 수', step: '변화량', position: '자리', later: '뒤의 수', 'wrong-position': '확인할 자리',
})

function expectedPublicVisualLabel(key: string): string {
  const label = EXPECTED_PUBLIC_VISUAL_LABELS[key]
  if (!label) throw new TypeError(`independent visual label is missing for ${key}`)
  return label
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value) ?? 'undefined'
}

function safeInteger(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new TypeError(`${key} must be a positive safe integer`)
  }
  return value as number
}

function containsPrivateVisualData(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(containsPrivateVisualData)
  const record = value as Record<string, unknown>
  if ('after' in record) return true
  if (record.disclosure === 'solution' || record.disclosure === 'intermediate') return true
  if (record.numericDisclosure === 'solution' || record.numericDisclosure === 'intermediate') return true
  if (record.emphasis === 'answer') return true
  return Object.values(record).some(containsPrivateVisualData)
}

function verifyTableVisual(
  problem: GeneratedApplicationProblemV1,
  expectedKeys: readonly string[],
  issues: string[],
): void {
  const scene = parseApplicationVisualSceneV1(problem.visual.mathModel)
  if (scene.surface !== 'table') {
    issues.push('visual surface is not the independently expected table')
    return
  }
  if (
    scene.caption.before?.text !== '문제에 주어진 수를 표로 나타냈어요.' ||
    scene.caption.before.disclosure !== 'given' ||
    stableJson(scene.columns) !== stableJson([
      { before: { text: '항목', disclosure: 'given' } },
      { before: { text: '주어진 수', disclosure: 'given' } },
    ])
  ) {
    issues.push('visual table public caption or columns contain unexpected accessibility text')
  }
  const actualKeys = scene.rows.map(({ key }) => key)
  const expectedRowKeys = expectedKeys.map((key) => `given-${key}`)
  if (stableJson(actualKeys) !== stableJson(expectedRowKeys)) {
    issues.push('visual table exposes a missing, hidden, or unexpected value key')
  }
  const ratioIndexes = expectedKeys.length > 1
    ? expectedKeys.slice(1).map((_, index) => index + 1)
    : [0]
  const expectedConstraints = ratioIndexes.map((index) => ({
    kind: 'table-ratio',
    numerator: { rowKey: `given-${expectedKeys[index]}`, columnIndex: 1 },
    denominator: { rowKey: `given-${expectedKeys[0]}`, columnIndex: 1 },
    expected: safeInteger(problem.params, expectedKeys[index]) /
      safeInteger(problem.params, expectedKeys[0]),
  }))
  if (stableJson(scene.constraints) !== stableJson(expectedConstraints)) {
    issues.push('visual table relation constraints do not prove the public value ratios')
  }
  scene.rows.forEach((row, index) => {
    const key = expectedKeys[index]
    if (!key || row.cells.length !== 2) {
      issues.push(`visual table row ${index} does not have the required two-cell relation`)
      return
    }
    const expected = safeInteger(problem.params, key)
    const valueCell = row.cells[1]
    if (valueCell.numericValue !== expected || valueCell.numericDisclosure !== 'given') {
      issues.push(`visual table row ${key} does not encode the raw given value`)
    }
    if (valueCell.before?.text !== String(expected) || valueCell.before.disclosure !== 'given') {
      issues.push(`visual table row ${key} does not publicly state the raw given value`)
    }
    if (
      row.cells[0].before?.disclosure !== 'given' ||
      row.cells[0].before.text !== expectedPublicVisualLabel(key)
    ) {
      issues.push(`visual table row ${key} does not publicly identify the given`)
    }
  })
}

function verifyDiagramVisual(
  problem: GeneratedApplicationProblemV1,
  expectedKeys: readonly string[],
  issues: string[],
): void {
  const scene = parseApplicationVisualSceneV1(problem.visual.mathModel)
  if (scene.surface !== 'diagram') {
    issues.push('visual surface is not the independently expected diagram')
    return
  }
  if (
    scene.description?.before?.text !== '문제에 주어진 양만 길이에 맞게 나타낸 그림' ||
    scene.description.before.disclosure !== 'given'
  ) {
    issues.push('visual diagram contains unexpected public accessibility description')
  }
  const expectedPrimitiveKeys = expectedKeys.map((key) => `given-${key}`)
  if (stableJson(scene.primitives.map(({ key }) => key)) !== stableJson(expectedPrimitiveKeys)) {
    issues.push('visual diagram exposes a missing, hidden, or unexpected value key')
  }
  if (scene.labels.length !== expectedKeys.length || scene.constraints.length !== expectedKeys.length) {
    issues.push('visual diagram relation counts do not match the public givens')
  }
  expectedKeys.forEach((key, index) => {
    const expected = safeInteger(problem.params, key)
    const primitive = scene.primitives[index]
    if (
      !primitive ||
      primitive.kind !== 'line' ||
      primitive.key !== `given-${key}` ||
      primitive.x2 - primitive.x1 !== expected ||
      primitive.y1 !== primitive.y2 ||
      primitive.disclosure !== 'given' ||
      primitive.emphasis !== 'normal'
    ) {
      issues.push(`visual diagram primitive ${key} does not encode the raw given length`)
    }
    const label = scene.labels[index]
    if (
      !label ||
      label.key !== `label-${key}` ||
      label.targetKey !== `given-${key}` ||
      label.content.before?.disclosure !== 'given' ||
      label.content.before.text !== `${expectedPublicVisualLabel(key)} ${expected}`
    ) {
      issues.push(`visual diagram label ${key} does not identify the raw given`)
    }
    const constraint = scene.constraints[index]
    if (
      !constraint ||
      constraint.kind !== 'segment-length' ||
      constraint.primitiveKey !== `given-${key}` ||
      constraint.expected !== expected
    ) {
      issues.push(`visual diagram constraint ${key} does not prove the raw given relation`)
    }
  })
}

export function verifyIndependentG2Problem(
  problem: GeneratedApplicationProblemV1,
  expectation: G2IndependentProblemExpectation,
): string[] {
  const issues: string[] = []
  if (problem.prompt !== expectation.prompt) issues.push('prompt does not state the independently expected givens')
  if (problem.answer.normalized !== expectation.answer) issues.push('answer does not match independent calculation')
  if (stableJson(problem.solutionSteps) !== stableJson(expectation.solutionSteps)) {
    issues.push('solution steps do not show the independent calculation and result')
  }
  if (stableJson(problem.hintSteps) !== stableJson(expectation.hintSteps)) {
    issues.push('hint steps do not match the independent strategy')
  }

  if (expectation.choices) {
    if (!problem.choices || problem.correctChoiceIndex === undefined) {
      issues.push('choice contract is missing')
    } else {
      const actualChoices = [...problem.choices].sort()
      const expectedChoices = [...expectation.choices].sort()
      if (stableJson(actualChoices) !== stableJson(expectedChoices)) {
        issues.push('choices do not match the independent choice set')
      }
      if (problem.choices[problem.correctChoiceIndex] !== expectation.answer) {
        issues.push('correct choice index does not point to the independent answer')
      }
    }
  } else if (problem.choices !== undefined || problem.correctChoiceIndex !== undefined) {
    issues.push('non-choice problem unexpectedly exposes choices')
  }

  const solutionContract = problem.solutionSteps.join('\n')
  expectation.requiredUnitTokens?.forEach((unit) => {
    if (!solutionContract.includes(unit)) issues.push(`required unit ${unit} is missing from the solution`)
  })

  if (!problem.visual.mathModel) {
    issues.push('required visual model is missing')
    return issues
  }
  if (containsPrivateVisualData(problem.visual.mathModel)) {
    issues.push('pre-submit visual contains answer-only or hidden data')
  }
  try {
    if (expectation.visualSurface === 'table') {
      verifyTableVisual(problem, expectation.visualValueKeys, issues)
    } else {
      verifyDiagramVisual(problem, expectation.visualValueKeys, issues)
    }
  } catch (error) {
    issues.push(`visual contract failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  return issues
}
