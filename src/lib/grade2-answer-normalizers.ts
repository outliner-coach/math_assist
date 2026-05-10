export type Grade2AnswerType =
  | 'choice'
  | 'integer'
  | 'length'
  | 'time-of-day'
  | 'duration'
  | 'label'

export type Grade2StructuredLengthInput = {
  meters?: string | number | null
  centimeters?: string | number | null
}

export type Grade2StructuredTimeInput = {
  hours?: string | number | null
  minutes?: string | number | null
}

export interface Grade2NormalizerResult {
  ok: boolean
  value?: number | string
  error?: string
}

function isBlank(value: string | number | null | undefined): boolean {
  return value === null || value === undefined || String(value).trim() === ''
}

function parseNonNegativeInteger(
  value: string | number | null | undefined,
  label: string
): Grade2NormalizerResult {
  if (isBlank(value)) return { ok: true, value: 0 }

  const text = String(value).trim()
  if (!/^\d+$/.test(text)) {
    return { ok: false, error: `${label}에는 0 이상의 정수만 써요.` }
  }

  return { ok: true, value: Number(text) }
}

export function normalizeGrade2IntegerAnswer(input: string): Grade2NormalizerResult {
  const text = input.trim()
  if (text === '') return { ok: false, error: '답을 써요.' }
  if (!/^\d+$/.test(text)) return { ok: false, error: '숫자만 써요.' }
  return { ok: true, value: Number(text) }
}

export function normalizeGrade2LabelAnswer(input: string): Grade2NormalizerResult {
  const value = input.trim().replace(/\s+/g, ' ')
  if (!value) return { ok: false, error: '답을 골라요.' }
  return { ok: true, value }
}

export function normalizeGrade2LengthAnswer(
  input: string | Grade2StructuredLengthInput
): Grade2NormalizerResult {
  if (typeof input === 'string') {
    const text = input.trim().toLowerCase().replace(/\s+/g, '')
    if (!text) return { ok: false, error: '길이를 써요.' }

    const cmOnly = text.match(/^(\d+)cm$/)
    if (cmOnly) return { ok: true, value: Number(cmOnly[1]) }

    const mOnly = text.match(/^(\d+)m$/)
    if (mOnly) return { ok: true, value: Number(mOnly[1]) * 100 }

    const mixed = text.match(/^(\d+)m(\d+)cm$/)
    if (mixed) {
      const meters = Number(mixed[1])
      const centimeters = Number(mixed[2])
      if (centimeters >= 100) {
        return { ok: false, error: 'cm 칸은 100보다 작은 수로 써요.' }
      }
      return { ok: true, value: meters * 100 + centimeters }
    }

    return { ok: false, error: 'm와 cm가 보이게 써요.' }
  }

  if (isBlank(input.meters) && isBlank(input.centimeters)) {
    return { ok: false, error: '길이를 써요.' }
  }

  const metersResult = parseNonNegativeInteger(input.meters, 'm 칸')
  if (!metersResult.ok) return metersResult
  const centimetersResult = parseNonNegativeInteger(input.centimeters, 'cm 칸')
  if (!centimetersResult.ok) return centimetersResult

  const meters = Number(metersResult.value ?? 0)
  const centimeters = Number(centimetersResult.value ?? 0)
  if (centimeters >= 100) {
    return { ok: false, error: 'cm 칸은 100보다 작은 수로 써요.' }
  }

  return { ok: true, value: meters * 100 + centimeters }
}

export function normalizeGrade2TimeOfDayAnswer(
  input: string | Grade2StructuredTimeInput
): Grade2NormalizerResult {
  if (typeof input === 'string') {
    const text = input.trim().replace(/\s+/g, '')
    if (!text) return { ok: false, error: '시각을 써요.' }

    const colon = text.match(/^(\d{1,2}):(\d{1,2})$/)
    const korean = text.match(/^(\d{1,2})시(\d{1,2})분$/)
    const match = colon ?? korean
    if (!match) return { ok: false, error: '시와 분을 함께 써요.' }

    const hours = Number(match[1])
    const minutes = Number(match[2])
    if (hours < 0 || hours > 23) return { ok: false, error: '시는 0부터 23까지 써요.' }
    if (minutes < 0 || minutes >= 60) return { ok: false, error: '분은 0부터 59까지 써요.' }
    return { ok: true, value: hours * 60 + minutes }
  }

  if (isBlank(input.hours) && isBlank(input.minutes)) {
    return { ok: false, error: '시각을 써요.' }
  }

  const hoursResult = parseNonNegativeInteger(input.hours, '시 칸')
  if (!hoursResult.ok) return hoursResult
  const minutesResult = parseNonNegativeInteger(input.minutes, '분 칸')
  if (!minutesResult.ok) return minutesResult

  const hours = Number(hoursResult.value ?? 0)
  const minutes = Number(minutesResult.value ?? 0)
  if (hours > 23) return { ok: false, error: '시는 0부터 23까지 써요.' }
  if (minutes >= 60) return { ok: false, error: '분은 0부터 59까지 써요.' }

  return { ok: true, value: hours * 60 + minutes }
}

export function normalizeGrade2DurationAnswer(
  input: string | Grade2StructuredTimeInput
): Grade2NormalizerResult {
  if (typeof input === 'string') {
    const text = input.trim().replace(/\s+/g, '')
    if (!text) return { ok: false, error: '시간을 써요.' }

    const minutesOnly = text.match(/^(\d+)분$/)
    if (minutesOnly) return { ok: true, value: Number(minutesOnly[1]) }

    const hoursOnly = text.match(/^(\d+)시간$/)
    if (hoursOnly) return { ok: true, value: Number(hoursOnly[1]) * 60 }

    const mixed = text.match(/^(\d+)시간(\d+)분$/)
    if (mixed) {
      const hours = Number(mixed[1])
      const minutes = Number(mixed[2])
      if (minutes >= 60) return { ok: false, error: '분은 0부터 59까지 써요.' }
      return { ok: true, value: hours * 60 + minutes }
    }

    return { ok: false, error: '시간과 분이 보이게 써요.' }
  }

  if (isBlank(input.hours) && isBlank(input.minutes)) {
    return { ok: false, error: '시간을 써요.' }
  }

  const hoursResult = parseNonNegativeInteger(input.hours, '시간 칸')
  if (!hoursResult.ok) return hoursResult
  const minutesResult = parseNonNegativeInteger(input.minutes, '분 칸')
  if (!minutesResult.ok) return minutesResult

  const hours = Number(hoursResult.value ?? 0)
  const minutes = Number(minutesResult.value ?? 0)
  if (minutes >= 60) return { ok: false, error: '분은 0부터 59까지 써요.' }

  return { ok: true, value: hours * 60 + minutes }
}

export function normalizeGrade2Answer(
  answerType: Grade2AnswerType,
  input: string | Grade2StructuredLengthInput | Grade2StructuredTimeInput
): Grade2NormalizerResult {
  switch (answerType) {
    case 'integer':
      return normalizeGrade2IntegerAnswer(String(input))
    case 'length':
      return normalizeGrade2LengthAnswer(input as string | Grade2StructuredLengthInput)
    case 'time-of-day':
      return normalizeGrade2TimeOfDayAnswer(input as string | Grade2StructuredTimeInput)
    case 'duration':
      return normalizeGrade2DurationAnswer(input as string | Grade2StructuredTimeInput)
    case 'choice':
    case 'label':
      return normalizeGrade2LabelAnswer(String(input))
    default:
      return { ok: false, error: '지원하지 않는 답안 형식이에요.' }
  }
}

export function checkGrade2Answer(
  answerType: Grade2AnswerType,
  userAnswer: string | Grade2StructuredLengthInput | Grade2StructuredTimeInput,
  correctAnswer: string
): Grade2NormalizerResult & { correct: boolean } {
  const normalizedUser = normalizeGrade2Answer(answerType, userAnswer)
  if (!normalizedUser.ok) return { ...normalizedUser, correct: false }

  const normalizedCorrect = normalizeGrade2Answer(answerType, correctAnswer)
  if (!normalizedCorrect.ok) {
    return { ok: false, correct: false, error: '정답 데이터가 올바르지 않아요.' }
  }

  return {
    ok: true,
    correct: normalizedUser.value === normalizedCorrect.value,
    value: normalizedUser.value,
  }
}
