export type Grade4AnswerType = 'choice' | 'integer'

export type Grade4AnswerResult =
  | { ok: true; correct: boolean }
  | { ok: false; error: string }

const INTEGER_PATTERN = /^[+-]?\d+$/

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

  if (!INTEGER_PATTERN.test(answer)) {
    return { ok: false, error: '답을 빠짐없는 숫자로 써요.' }
  }
  if (!INTEGER_PATTERN.test(correctAnswer)) {
    throw new Error(`Invalid Grade 4 integer answer: ${correctAnswer}`)
  }
  return { ok: true, correct: BigInt(answer) === BigInt(correctAnswer) }
}
