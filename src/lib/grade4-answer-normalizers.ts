export type Grade4AnswerType = 'choice' | 'integer' | 'decimal'

export type Grade4AnswerResult =
  | { ok: true; correct: boolean }
  | { ok: false; error: string }

const INTEGER_PATTERN = /^[+-]?\d+$/
const DECIMAL_PATTERN = /^[+-]?\d+(?:\.\d+)?$/

function normalizedDecimal(value: string): string {
  const negative = value.startsWith('-')
  const unsigned = value.replace(/^[+-]/, '')
  const [wholePart, fractionPart = ''] = unsigned.split('.')
  const whole = wholePart.replace(/^0+(?=\d)/, '') || '0'
  const fraction = fractionPart.replace(/0+$/, '')
  const magnitude = fraction ? `${whole}.${fraction}` : whole
  return negative && magnitude !== '0' ? `-${magnitude}` : magnitude
}

export function checkGrade4Answer(
  answerType: Grade4AnswerType,
  rawAnswer: string,
  correctAnswer: string,
): Grade4AnswerResult {
  const answer = rawAnswer.trim()
  if (answerType === 'choice') {
    if (!answer) return { ok: false, error: '보기에서 답을 하나 골라요.' }
    return { ok: true, correct: answer === correctAnswer }
  }

  if (answerType === 'decimal') {
    if (!DECIMAL_PATTERN.test(answer)) {
      return { ok: false, error: '답을 빠짐없는 소수로 써요.' }
    }
    if (!DECIMAL_PATTERN.test(correctAnswer)) {
      throw new Error(`Invalid Grade 4 decimal answer: ${correctAnswer}`)
    }
    return { ok: true, correct: normalizedDecimal(answer) === normalizedDecimal(correctAnswer) }
  }

  if (!INTEGER_PATTERN.test(answer)) {
    return { ok: false, error: '답을 빠짐없는 숫자로 써요.' }
  }
  if (!INTEGER_PATTERN.test(correctAnswer)) {
    throw new Error(`Invalid Grade 4 integer answer: ${correctAnswer}`)
  }
  return { ok: true, correct: BigInt(answer) === BigInt(correctAnswer) }
}
