import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'
import { resolveApplicationVisual } from '../visual-validator'

interface IndependentResult {
  answer: string
  work: string
}

function hasAnswerOnlyDisclosure(value: unknown, answer: string): boolean {
  if (Array.isArray(value)) return value.some((entry) => hasAnswerOnlyDisclosure(entry, answer))
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  const before = record.before && typeof record.before === 'object'
    ? record.before as { text?: unknown; disclosure?: unknown }
    : null
  const after = record.after && typeof record.after === 'object'
    ? record.after as { disclosure?: unknown }
    : null
  if (before && typeof before.text === 'string') {
    if (before.disclosure === 'solution' || before.disclosure === 'intermediate') return true
    if (before.disclosure === 'given') return false
    if (
      (after?.disclosure === 'solution' || after?.disclosure === 'intermediate')
      && before.text.trim() === answer
    ) return true
  }
  return Object.entries(record).some(([key, entry]) => (
    key !== 'after' && hasAnswerOnlyDisclosure(entry, answer)
  ))
}

function answerIsPublicBeforeSubmission(problem: GeneratedApplicationProblemV1): boolean {
  const answer = problem.answer.normalized.trim()
  return answer !== '' && hasAnswerOnlyDisclosure(problem.visual, answer)
}

function publicVisualLabelTexts(problem: GeneratedApplicationProblemV1): string[] {
  const model = problem.visual.mathModel as {
    labels?: Array<{ content?: { before?: { text?: unknown } } }>
  }
  return (model.labels ?? []).flatMap(({ content }) => (
    typeof content?.before?.text === 'string' ? [content.before.text] : []
  ))
}

function grade3VisualDisclosureIssues(problem: GeneratedApplicationProblemV1): string[] {
  const labels = publicVisualLabelTexts(problem)
  if (problem.familyId === 'g3-2-circle-missing-radius') {
    const derivedRadius = n(problem.params, 'diameter') / 2
    if (labels.includes(`반지름 ${derivedRadius}`)) {
      return ['derived radius is public before submission']
    }
  }
  if (problem.familyId === 'g3-2-circle-construction-constraint') {
    const derivedRadius = n(problem.params, 'targetDiameter') / 2
    if (labels.includes(`반지름 ${derivedRadius}`)) {
      return ['derived radius is public before submission']
    }
  }
  if (
    problem.familyId === 'g3-2-graph-data-sufficiency'
    && !b(problem.params, 'hasCategoryLabels')
    && labels.some((label) => /^(?:a|b|가|나)(?:\s|$)/.test(label))
  ) {
    return ['hidden graph category names are public']
  }
  return []
}

export function grade3AnswerIsPublicBeforeSubmission(
  problem: GeneratedApplicationProblemV1,
): boolean {
  return answerIsPublicBeforeSubmission(problem)
    || grade3VisualDisclosureIssues(problem).length > 0
}

function n(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value)) throw new TypeError(`${key} must be a safe integer`)
  return value as number
}

function s(params: Readonly<Record<string, JsonValue>>, key: string): string {
  const value = params[key]
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${key} must be text`)
  return value
}

function b(params: Readonly<Record<string, JsonValue>>, key: string): boolean {
  const value = params[key]
  if (typeof value !== 'boolean') throw new TypeError(`${key} must be boolean`)
  return value
}

function angleKind(angle: number): '예각' | '직각' | '둔각' {
  return angle < 90 ? '예각' : angle === 90 ? '직각' : '둔각'
}

function lineDescription(kind: string): string {
  switch (kind) {
    case '직선': return '양쪽으로 끝없이 이어지는 선'
    case '반직선': return '한 점에서 시작해 한쪽으로 끝없이 이어지는 선'
    case '선분': return '두 점을 곧게 이은 선'
    default: throw new TypeError(`unsupported line kind ${kind}`)
  }
}

function independentResult(problem: GeneratedApplicationProblemV1): IndependentResult {
  const p = problem.params
  switch (problem.familyId) {
    case 'g3-1-add-sub-story-change': { const x = n(p, 'start') + n(p, 'added') - n(p, 'removed'); return { answer: String(x), work: `${n(p, 'start')}+${n(p, 'added')}-${n(p, 'removed')}=${x}` } }
    case 'g3-1-add-sub-missing-start': { const x = n(p, 'end') - n(p, 'added'); return { answer: String(x), work: `${n(p, 'end')}-${n(p, 'added')}=${x}` } }
    case 'g3-1-add-sub-strategy-check': { const x = n(p, 'a') + n(p, 'b'); return { answer: n(p, 'claimed') === x ? '맞아요' : '다시 계산해야 해요', work: `${n(p, 'a')}+${n(p, 'b')}=${x}` } }
    case 'g3-1-add-sub-operation-error': { const add = s(p, 'relation') === 'add'; const x = add ? n(p, 'start') + n(p, 'change') : n(p, 'start') - n(p, 'change'); return { answer: String(x), work: `${n(p, 'start')}${add ? '+' : '-'}${n(p, 'change')}=${x}` } }
    case 'g3-1-lines-map-classification': { const kind = s(p, 'lineKind'); const angle = n(p, 'angle'); return { answer: `${kind}, ${angleKind(angle)}`, work: `${lineDescription(kind)}은 ${kind}, ${angle}°는 ${angleKind(angle)}` } }
    case 'g3-1-lines-angle-constraint': return { answer: `${n(p, 'candidate')}°`, work: `${n(p, 'low')}<${n(p, 'candidate')}<${n(p, 'high')}` }
    case 'g3-1-lines-property-check': { const kind = s(p, 'lineKind'); return { answer: kind === s(p, 'claimedKind') ? '맞아요' : '아니에요', work: `${lineDescription(kind)}은 ${kind}` } }
    case 'g3-1-lines-classification-error': { const angle = n(p, 'angle'); const kind = angleKind(angle); return { answer: kind, work: `${angle}°는 ${kind}` } }
    case 'g3-1-division-sharing-plan': { const x = n(p, 'total') / n(p, 'groups'); return { answer: String(x), work: `${n(p, 'total')}÷${n(p, 'groups')}=${x}` } }
    case 'g3-1-division-missing-total': { const x = n(p, 'groups') * n(p, 'each'); return { answer: String(x), work: `${n(p, 'groups')}×${n(p, 'each')}=${x}` } }
    case 'g3-1-division-model-check': { const x = n(p, 'total') / n(p, 'groups'); return { answer: x === n(p, 'claimedEach') ? '맞아요' : '아니에요', work: `${n(p, 'total')}÷${n(p, 'groups')}=${x}` } }
    case 'g3-1-division-fact-error': { const x = n(p, 'total') / n(p, 'divisor'); return { answer: String(x), work: `${n(p, 'total')}÷${n(p, 'divisor')}=${x}` } }
    case 'g3-1-multiply-two-step-total': { const x = n(p, 'boxes') * n(p, 'each') - n(p, 'removed'); return { answer: String(x), work: `${n(p, 'boxes')}×${n(p, 'each')}-${n(p, 'removed')}=${x}` } }
    case 'g3-1-multiply-missing-groups': { const x = n(p, 'total') / n(p, 'each'); return { answer: String(x), work: `${n(p, 'total')}÷${n(p, 'each')}=${x}` } }
    case 'g3-1-multiply-strategy-compare': { const x = n(p, 'a') * n(p, 'b'); return { answer: x === n(p, 'claimed') ? '맞아요' : '아니에요', work: `${n(p, 'a')}×${n(p, 'b')}=${x}` } }
    case 'g3-1-multiply-product-error': { const x = n(p, 'a') * n(p, 'b'); return { answer: String(x), work: `${n(p, 'a')}×${n(p, 'b')}=${x}` } }
    case 'g3-1-length-time-trip-conversion': { const metres = n(p, 'km') * 1000 + n(p, 'm'); const minutes = n(p, 'hour') * 60 + n(p, 'minute'); return { answer: `${metres}m, ${minutes}분`, work: `${n(p, 'km')}×1000+${n(p, 'm')}=${metres}, ${n(p, 'hour')}×60+${n(p, 'minute')}=${minutes}` } }
    case 'g3-1-length-time-missing-distance': { const x = n(p, 'totalM') - n(p, 'firstM'); return { answer: String(x), work: `${n(p, 'totalM')}-${n(p, 'firstM')}=${x}` } }
    case 'g3-1-length-time-elapsed-time': { const x = n(p, 'endMinute') * 60 + n(p, 'endSecond') - n(p, 'startMinute') * 60 - n(p, 'startSecond'); return { answer: String(x), work: `(${n(p, 'endMinute')}×60+${n(p, 'endSecond')})-(${n(p, 'startMinute')}×60+${n(p, 'startSecond')})=${x}` } }
    case 'g3-1-length-time-unit-claim-error': { const x = n(p, 'cm') * 10 + n(p, 'mm'); return { answer: String(x), work: `${n(p, 'cm')}×10+${n(p, 'mm')}=${x}` } }
    case 'g3-1-fraction-decimal-tenths-conversion': { const x = n(p, 'shaded'); return { answer: `${x}/10 = 0.${x}`, work: `${x}부분은 ${x}/10이고 소수로 0.${x}` } }
    case 'g3-1-fraction-decimal-missing-parts': { const x = n(p, 'total') - n(p, 'shaded'); return { answer: String(x), work: `${n(p, 'total')}-${n(p, 'shaded')}=${x}` } }
    case 'g3-1-fraction-decimal-representation-check': { const x = n(p, 'numerator'); return { answer: x === n(p, 'decimalNumerator') ? '같아요' : '달라요', work: `${x}/10=0.${x}` } }
    case 'g3-1-fraction-decimal-decimal-claim-error': { const x = n(p, 'numerator'); return { answer: `0.${x}`, work: `${x}/10=0.${x}` } }
    case 'g3-2-multiply-box-total': { const x = n(p, 'packs') * n(p, 'each') + n(p, 'extra'); return { answer: String(x), work: `${n(p, 'packs')}×${n(p, 'each')}+${n(p, 'extra')}=${x}` } }
    case 'g3-2-multiply-missing-factor': { const x = n(p, 'total') / n(p, 'factor'); return { answer: String(x), work: `${n(p, 'total')}÷${n(p, 'factor')}=${x}` } }
    case 'g3-2-multiply-distributive-check': { const x = n(p, 'a') * n(p, 'b'); return { answer: x === n(p, 'claimed') ? '맞아요' : '아니에요', work: `${n(p, 'a')}×${n(p, 'b')}=${x}` } }
    case 'g3-2-multiply-product-error': { const x = n(p, 'a') * n(p, 'b'); return { answer: String(x), work: `${n(p, 'a')}×${n(p, 'b')}=${x}` } }
    case 'g3-2-division-share-remainder': { const q = Math.floor(n(p, 'total') / n(p, 'divisor')); const r = n(p, 'total') % n(p, 'divisor'); return { answer: `${q}개씩, ${r}개 남아요`, work: `${n(p, 'total')}=${n(p, 'divisor')}×${q}+${r}` } }
    case 'g3-2-division-missing-dividend': { const x = n(p, 'divisor') * n(p, 'quotient') + n(p, 'remainder'); return { answer: String(x), work: `${n(p, 'divisor')}×${n(p, 'quotient')}+${n(p, 'remainder')}=${x}` } }
    case 'g3-2-division-remainder-constraint': return { answer: String(n(p, 'candidate')), work: `0≤나머지<${n(p, 'divisor')}` }
    case 'g3-2-division-quotient-error': { const q = Math.floor(n(p, 'total') / n(p, 'divisor')); const r = n(p, 'total') % n(p, 'divisor'); return { answer: `${q}, 나머지 ${r}`, work: `${n(p, 'total')}=${n(p, 'divisor')}×${q}+${r}` } }
    case 'g3-2-circle-compass-diameter': { const x = n(p, 'radius') * 2; return { answer: String(x), work: `${n(p, 'radius')}×2=${x}` } }
    case 'g3-2-circle-missing-radius': { const x = n(p, 'diameter') / 2; return { answer: String(x), work: `${n(p, 'diameter')}÷2=${x}` } }
    case 'g3-2-circle-construction-constraint': { const x = n(p, 'opening') * 2; return { answer: x === n(p, 'targetDiameter') ? '그릴 수 있어요' : '그릴 수 없어요', work: `${n(p, 'opening')}×2=${x}` } }
    case 'g3-2-circle-property-error': { const x = n(p, 'radius') * 2; return { answer: String(x), work: `${n(p, 'radius')}×2=${x}` } }
    case 'g3-2-fraction-form-and-compare': { const left = n(p, 'whole') * n(p, 'denominator') + n(p, 'numerator'); const right = n(p, 'otherNumerator'); return { answer: left > right ? '대분수가 더 커요' : left < right ? '가분수가 더 커요' : '같아요', work: `${n(p, 'whole')}와 ${n(p, 'numerator')}/${n(p, 'denominator')}=${left}/${n(p, 'denominator')}` } }
    case 'g3-2-fraction-missing-numerator': return { answer: String(n(p, 'candidate')), work: `${n(p, 'lowNumerator')}<${n(p, 'candidate')}<${n(p, 'highNumerator')}` }
    case 'g3-2-fraction-representation-shift': { const x = n(p, 'whole') * n(p, 'denominator') + n(p, 'numerator'); return { answer: `${x}/${n(p, 'denominator')}`, work: `${n(p, 'whole')}×${n(p, 'denominator')}+${n(p, 'numerator')}=${x}` } }
    case 'g3-2-fraction-comparison-error': { const left = n(p, 'leftNumerator'); const right = n(p, 'rightNumerator'); return { answer: left > right ? '왼쪽이 더 커요' : left < right ? '오른쪽이 더 커요' : '같아요', work: `분모가 같으므로 ${left}와 ${right}을 비교` } }
    case 'g3-2-capacity-weight-measure-pair': { const ml = n(p, 'liters') * 1000 + n(p, 'milliliters'); const grams = n(p, 'kg') * 1000 + n(p, 'g'); return { answer: `${ml}mL, ${grams}g`, work: `${n(p, 'liters')}×1000+${n(p, 'milliliters')}=${ml}, ${n(p, 'kg')}×1000+${n(p, 'g')}=${grams}` } }
    case 'g3-2-capacity-weight-missing-capacity': { const x = n(p, 'totalMl') - n(p, 'usedMl'); return { answer: String(x), work: `${n(p, 'totalMl')}-${n(p, 'usedMl')}=${x}` } }
    case 'g3-2-capacity-weight-conversion-compare': { const x = n(p, 'liters') * 1000 + n(p, 'milliliters'); return { answer: x === n(p, 'claimedMl') ? '맞아요' : '아니에요', work: `${n(p, 'liters')}×1000+${n(p, 'milliliters')}=${x}` } }
    case 'g3-2-capacity-weight-weight-error': { const x = n(p, 'kg') * 1000 + n(p, 'g'); return { answer: String(x), work: `${n(p, 'kg')}×1000+${n(p, 'g')}=${x}` } }
    case 'g3-2-graph-table-to-bar': { const target = s(p, 'target'); const x = target === '가' ? n(p, 'a') : target === '나' ? n(p, 'b') : n(p, 'c'); return { answer: String(x), work: `${target}의 표 값 ${x}을 막대 높이로 옮김` } }
    case 'g3-2-graph-missing-category': { const x = n(p, 'total') - n(p, 'a') - n(p, 'b'); return { answer: String(x), work: `${n(p, 'total')}-${n(p, 'a')}-${n(p, 'b')}=${x}` } }
    case 'g3-2-graph-claim-error': { const values = [['가', n(p, 'a')], ['나', n(p, 'b')], ['다', n(p, 'c')]] as const; const answer = [...values].sort((x, y) => y[1] - x[1])[0][0]; return { answer, work: `세 막대의 높이를 비교하면 ${answer}가 가장 큼` } }
    case 'g3-2-graph-data-sufficiency': return { answer: b(p, 'hasCategoryLabels') ? '충분해요' : '부족해요', work: b(p, 'hasCategoryLabels') ? `이름과 높이를 연결해 ${n(p, 'a')}와 ${n(p, 'b')}을 비교` : '높이는 알아도 어느 막대가 어느 항목인지 알 수 없음' }
    default: throw new TypeError(`unknown Grade 3 application family ${problem.familyId}`)
  }
}

const PROMPT_TOKENS: Readonly<Record<string, string>> = {
  'g3-1-add-sub-story-change': '남은 책', 'g3-1-add-sub-missing-start': '처음 구슬', 'g3-1-add-sub-strategy-check': '방법이 맞는지', 'g3-1-add-sub-operation-error': '버스',
  'g3-1-lines-map-classification': '차례로 분류', 'g3-1-lines-angle-constraint': '각을 고르세요', 'g3-1-lines-property-check': '주장이 맞는지', 'g3-1-lines-classification-error': '올바른 분류',
  'g3-1-division-sharing-plan': '똑같이 나누면', 'g3-1-division-missing-total': '역관계', 'g3-1-division-model-check': '한 묶음', 'g3-1-division-fact-error': '올바른 몫',
  'g3-1-multiply-two-step-total': '남은 것은', 'g3-1-multiply-missing-groups': '역으로', 'g3-1-multiply-strategy-compare': '계산한 방법', 'g3-1-multiply-product-error': '올바른 곱',
  'g3-1-length-time-trip-conversion': '함께 쓰세요', 'g3-1-length-time-missing-distance': '남은 거리', 'g3-1-length-time-elapsed-time': '걸린 시간', 'g3-1-length-time-unit-claim-error': '올바른 mm',
  'g3-1-fraction-decimal-tenths-conversion': '분수와 소수', 'g3-1-fraction-decimal-missing-parts': '색칠하지 않은', 'g3-1-fraction-decimal-representation-check': '같은 양인지', 'g3-1-fraction-decimal-decimal-claim-error': '올바른 소수',
  'g3-2-multiply-box-total': '낱개', 'g3-2-multiply-missing-factor': '빠진 수', 'g3-2-multiply-distributive-check': '나눈 방법', 'g3-2-multiply-product-error': '올바른 곱',
  'g3-2-division-share-remainder': '몇 개가 남을까요', 'g3-2-division-missing-dividend': '어떤 수', 'g3-2-division-remainder-constraint': '나머지가 될 수', 'g3-2-division-quotient-error': '올바른 몫과 나머지',
  'g3-2-circle-compass-diameter': '컴퍼스', 'g3-2-circle-missing-radius': '반지름', 'g3-2-circle-construction-constraint': '그릴 수 있는지', 'g3-2-circle-property-error': '올바른 지름',
  'g3-2-fraction-form-and-compare': '크기를 비교', 'g3-2-fraction-missing-numerator': '분자를 고르세요', 'g3-2-fraction-representation-shift': '가분수로', 'g3-2-fraction-comparison-error': '올바른 비교',
  'g3-2-capacity-weight-measure-pair': '작은 단위', 'g3-2-capacity-weight-missing-capacity': '남은 양', 'g3-2-capacity-weight-conversion-compare': '맞는지 판단', 'g3-2-capacity-weight-weight-error': '올바른 g',
  'g3-2-graph-table-to-bar': '막대 높이', 'g3-2-graph-missing-category': '다의 값', 'g3-2-graph-claim-error': '실제 가장 큰', 'g3-2-graph-data-sufficiency': '정보가 충분',
}

function expectedChoices(problem: GeneratedApplicationProblemV1, answer: string): string[] | undefined {
  const p = problem.params
  if (problem.familyId === 'g3-1-add-sub-strategy-check') return ['맞아요', '다시 계산해야 해요']
  if (['g3-1-lines-property-check', 'g3-1-division-model-check', 'g3-1-multiply-strategy-compare', 'g3-2-multiply-distributive-check', 'g3-2-capacity-weight-conversion-compare'].includes(problem.familyId)) return ['맞아요', '아니에요']
  if (problem.familyId === 'g3-1-lines-angle-constraint') return [`${n(p, 'candidate')}°`, `${n(p, 'low') - 5}°`, `${n(p, 'high') + 5}°`]
  if (problem.familyId === 'g3-1-lines-classification-error') return ['예각', '직각', '둔각']
  if (problem.familyId === 'g3-1-fraction-decimal-representation-check') return ['같아요', '달라요']
  if (problem.familyId === 'g3-2-division-remainder-constraint') return [String(n(p, 'candidate')), String(n(p, 'divisor')), String(n(p, 'divisor') + 1)]
  if (problem.familyId === 'g3-2-circle-construction-constraint') return ['그릴 수 있어요', '그릴 수 없어요']
  if (problem.familyId === 'g3-2-fraction-form-and-compare') return ['대분수가 더 커요', '가분수가 더 커요', '같아요']
  if (problem.familyId === 'g3-2-fraction-missing-numerator') return [String(n(p, 'candidate')), String(n(p, 'lowNumerator')), String(n(p, 'highNumerator'))]
  if (problem.familyId === 'g3-2-fraction-comparison-error') return ['왼쪽이 더 커요', '오른쪽이 더 커요', '같아요']
  if (problem.familyId === 'g3-2-graph-claim-error') return ['가', '나', '다']
  if (problem.familyId === 'g3-2-graph-data-sufficiency') return ['충분해요', '부족해요']
  return undefined
}

function hasHiddenAnswer(value: unknown, answer: string): boolean {
  if (Array.isArray(value)) return value.some((entry) => hasHiddenAnswer(entry, answer))
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  const before = record.before as { text?: unknown; disclosure?: unknown } | undefined
  const after = record.after as { text?: unknown; disclosure?: unknown } | undefined
  if (
    before?.text === '답: ?' &&
    before.disclosure === 'identifier' &&
    after?.text === `답: ${answer}` &&
    after.disclosure === 'solution'
  ) return true
  return Object.values(record).some((entry) => hasHiddenAnswer(entry, answer))
}

export function evaluateGrade3ApplicationOracle(problem: GeneratedApplicationProblemV1): string {
  return independentResult(problem).answer
}

export function verifyGrade3ApplicationProblem(problem: GeneratedApplicationProblemV1): string[] {
  const issues: string[] = []
  let expected: IndependentResult
  try {
    expected = independentResult(problem)
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)]
  }
  if (problem.answer.normalized !== expected.answer) issues.push('independent answer mismatch')
  const expectedChoiceList = expectedChoices(problem, expected.answer)
  if (
    JSON.stringify([...(problem.choices ?? [])].sort()) !==
    JSON.stringify([...(expectedChoiceList ?? [])].sort())
  ) issues.push('choice contract mismatch')
  if (
    expectedChoiceList &&
    (problem.correctChoiceIndex === undefined || problem.choices?.[problem.correctChoiceIndex] !== expected.answer)
  ) issues.push('correct choice index mismatch')
  if (!expectedChoiceList && problem.correctChoiceIndex !== undefined) issues.push('unexpected correct choice index')
  const token = PROMPT_TOKENS[problem.familyId]
  if (!token || !problem.prompt.includes(token)) issues.push('prompt semantic token mismatch')
  const publicQuestionText = [problem.prompt, ...(problem.choices ?? [])].join(' ')
  for (const value of Object.values(problem.params)) {
    if (
      (typeof value === 'number' || typeof value === 'string') &&
      !['add', 'subtract', '직선', '선분', '반직선'].includes(String(value)) &&
      !publicQuestionText.includes(String(value))
    ) {
      issues.push(`prompt omits declared given ${String(value)}`)
    }
  }
  const expectedSolutions = [
    `주어진 관계를 식이나 그림으로 나타내면 ${expected.work}입니다.`,
    `조건을 다시 확인하면 답은 ${expected.answer}입니다.`,
  ]
  if (JSON.stringify(problem.solutionSteps) !== JSON.stringify(expectedSolutions)) issues.push('solution contract mismatch')
  const expectedHints = [
    '주어진 값과 구하려는 값을 먼저 구분하세요.',
    '관계를 식이나 그림으로 나타낸 뒤 원래 조건에 맞는지 확인하세요.',
  ]
  if (JSON.stringify(problem.hintSteps) !== JSON.stringify(expectedHints)) issues.push('hint contract mismatch')
  const resolution = resolveApplicationVisual(problem.visual)
  if (resolution.status !== 'ready') {
    issues.push(`visual contract is not ready: ${'issues' in resolution ? resolution.issues.map(({ code }) => code).join(',') : resolution.status}`)
  }
  if (answerIsPublicBeforeSubmission(problem)) issues.push('answer-only value is public before submission')
  issues.push(...grade3VisualDisclosureIssues(problem))
  if (!hasHiddenAnswer(problem.visual.mathModel, expected.answer)) issues.push('visual answer disclosure pair mismatch')
  return issues
}
