export type Grade3AnswerType =
  | 'choice'
  | 'integer'
  | 'label'
  | 'fraction'
  | 'decimal'
  | 'length'
  | 'time-of-day'
  | 'duration'
  | 'capacity'
  | 'weight'
  | 'angle'

export type Grade3StructuredFractionInput = {
  numerator?: string | number | null
  denominator?: string | number | null
}

export type Grade3StructuredLengthInput = {
  kilometers?: string | number | null
  meters?: string | number | null
  centimeters?: string | number | null
  millimeters?: string | number | null
}

export type Grade3StructuredTimeInput = {
  hours?: string | number | null
  minutes?: string | number | null
  seconds?: string | number | null
}

export type Grade3StructuredCapacityInput = {
  liters?: string | number | null
  milliliters?: string | number | null
}

export type Grade3StructuredWeightInput = {
  kilograms?: string | number | null
  grams?: string | number | null
}

export type Grade3StructuredAnswerInput =
  | string
  | Grade3StructuredFractionInput
  | Grade3StructuredLengthInput
  | Grade3StructuredTimeInput
  | Grade3StructuredCapacityInput
  | Grade3StructuredWeightInput

export interface Grade3NormalizerResult {
  ok: boolean
  value?: number | string
  error?: string
  dataError?: boolean
}

function isBlank(value: string | number | null | undefined): boolean {
  return value === null || value === undefined || String(value).trim() === ''
}

function parseNonNegativeInteger(
  value: string | number | null | undefined,
  label: string,
  blankValue = 0
): Grade3NormalizerResult {
  if (isBlank(value)) return { ok: true, value: blankValue }
  const text = String(value).trim()
  if (!/^\d+$/.test(text)) return { ok: false, error: `${label}에는 0 이상의 정수만 써요.` }
  return { ok: true, value: Number(text) }
}

function gcd(a: number, b: number): number {
  let left = Math.abs(a)
  let right = Math.abs(b)
  while (right !== 0) {
    const next = left % right
    left = right
    right = next
  }
  return left || 1
}

function fractionValue(numerator: number, denominator: number): Grade3NormalizerResult {
  if (denominator === 0) return { ok: false, error: '분모는 0이 될 수 없어요.' }
  if (numerator < 0 || denominator < 0) return { ok: false, error: '분수에는 0 이상의 수를 써요.' }
  const divisor = gcd(numerator, denominator)
  return { ok: true, value: `${numerator / divisor}/${denominator / divisor}` }
}

export function normalizeGrade3IntegerAnswer(input: string): Grade3NormalizerResult {
  const text = input.trim()
  if (!text) return { ok: false, error: '답을 써요.' }
  if (!/^\d+$/.test(text)) return { ok: false, error: '숫자만 써요.' }
  return { ok: true, value: Number(text) }
}

export function normalizeGrade3LabelAnswer(input: string): Grade3NormalizerResult {
  const value = input.trim().replace(/\s+/g, ' ')
  if (!value) return { ok: false, error: '답을 골라요.' }
  return { ok: true, value }
}

export function normalizeGrade3FractionAnswer(
  input: string | Grade3StructuredFractionInput
): Grade3NormalizerResult {
  if (typeof input === 'string') {
    const text = input.trim().replace(/\s+/g, '')
    if (!text) return { ok: false, error: '분수를 써요.' }
    const match = text.match(/^(\d+)\/(\d+)$/)
    if (!match) return { ok: false, error: '분자/분모 모양으로 써요.' }
    return fractionValue(Number(match[1]), Number(match[2]))
  }

  if (isBlank(input.numerator) && isBlank(input.denominator)) {
    return { ok: false, error: '분수를 써요.' }
  }
  const numerator = parseNonNegativeInteger(input.numerator, '분자 칸')
  if (!numerator.ok) return numerator
  const denominator = parseNonNegativeInteger(input.denominator, '분모 칸')
  if (!denominator.ok) return denominator
  return fractionValue(Number(numerator.value ?? 0), Number(denominator.value ?? 0))
}

export function normalizeGrade3DecimalAnswer(input: string): Grade3NormalizerResult {
  const text = input.trim()
  if (!text) return { ok: false, error: '소수를 써요.' }
  if (!/^\d+(?:\.\d{1,3})?$/.test(text)) {
    return { ok: false, error: '소수는 숫자와 소수점으로 써요.' }
  }
  return { ok: true, value: Number(text) }
}

export function normalizeGrade3LengthAnswer(
  input: string | Grade3StructuredLengthInput
): Grade3NormalizerResult {
  if (typeof input === 'string') {
    const text = input.trim().toLowerCase().replace(/\s+/g, '')
    if (!text) return { ok: false, error: '길이를 써요.' }
    const km = text.match(/^(\d+)km$/)
    if (km) return { ok: true, value: Number(km[1]) * 1000000 }
    const m = text.match(/^(\d+)m$/)
    if (m) return { ok: true, value: Number(m[1]) * 1000 }
    const cm = text.match(/^(\d+)cm$/)
    if (cm) return { ok: true, value: Number(cm[1]) * 10 }
    const mm = text.match(/^(\d+)mm$/)
    if (mm) return { ok: true, value: Number(mm[1]) }
    const cmMm = text.match(/^(\d+)cm(\d+)mm$/)
    if (cmMm) {
      const millimeters = Number(cmMm[2])
      if (millimeters >= 10) return { ok: false, error: 'mm 칸은 10보다 작은 수로 써요.' }
      return { ok: true, value: Number(cmMm[1]) * 10 + millimeters }
    }
    const kmM = text.match(/^(\d+)km(\d+)m$/)
    if (kmM) {
      const meters = Number(kmM[2])
      if (meters >= 1000) return { ok: false, error: 'm 칸은 1000보다 작은 수로 써요.' }
      return { ok: true, value: Number(kmM[1]) * 1000000 + meters * 1000 }
    }
    return { ok: false, error: '길이 단위가 보이게 써요.' }
  }

  if (
    isBlank(input.kilometers) &&
    isBlank(input.meters) &&
    isBlank(input.centimeters) &&
    isBlank(input.millimeters)
  ) {
    return { ok: false, error: '길이를 써요.' }
  }

  const kilometers = parseNonNegativeInteger(input.kilometers, 'km 칸')
  if (!kilometers.ok) return kilometers
  const meters = parseNonNegativeInteger(input.meters, 'm 칸')
  if (!meters.ok) return meters
  const centimeters = parseNonNegativeInteger(input.centimeters, 'cm 칸')
  if (!centimeters.ok) return centimeters
  const millimeters = parseNonNegativeInteger(input.millimeters, 'mm 칸')
  if (!millimeters.ok) return millimeters

  const m = Number(meters.value ?? 0)
  const mm = Number(millimeters.value ?? 0)
  if (m >= 1000) return { ok: false, error: 'm 칸은 1000보다 작은 수로 써요.' }
  if (mm >= 10) return { ok: false, error: 'mm 칸은 10보다 작은 수로 써요.' }

  return {
    ok: true,
    value:
      Number(kilometers.value ?? 0) * 1000000 +
      m * 1000 +
      Number(centimeters.value ?? 0) * 10 +
      mm,
  }
}

export function normalizeGrade3TimeOfDayAnswer(
  input: string | Grade3StructuredTimeInput
): Grade3NormalizerResult {
  if (typeof input === 'string') {
    const text = input.trim().replace(/\s+/g, '')
    if (!text) return { ok: false, error: '시각을 써요.' }
    const match = text.match(/^(\d{1,2})(?::|시)(\d{1,2})(?::|분)(\d{1,2})초?$/)
    if (!match) return { ok: false, error: '시, 분, 초를 함께 써요.' }
    return normalizeGrade3TimeOfDayAnswer({
      hours: match[1],
      minutes: match[2],
      seconds: match[3],
    })
  }

  if (isBlank(input.hours) && isBlank(input.minutes) && isBlank(input.seconds)) {
    return { ok: false, error: '시각을 써요.' }
  }
  const hours = parseNonNegativeInteger(input.hours, '시 칸')
  if (!hours.ok) return hours
  const minutes = parseNonNegativeInteger(input.minutes, '분 칸')
  if (!minutes.ok) return minutes
  const seconds = parseNonNegativeInteger(input.seconds, '초 칸')
  if (!seconds.ok) return seconds
  const h = Number(hours.value ?? 0)
  const m = Number(minutes.value ?? 0)
  const s = Number(seconds.value ?? 0)
  if (h > 23) return { ok: false, error: '시는 0부터 23까지 써요.' }
  if (m >= 60) return { ok: false, error: '분은 0부터 59까지 써요.' }
  if (s >= 60) return { ok: false, error: '초는 0부터 59까지 써요.' }
  return { ok: true, value: h * 3600 + m * 60 + s }
}

export function normalizeGrade3DurationAnswer(
  input: string | Grade3StructuredTimeInput
): Grade3NormalizerResult {
  if (typeof input === 'string') {
    const text = input.trim().replace(/\s+/g, '')
    if (!text) return { ok: false, error: '걸린 시간을 써요.' }
    const secondsOnly = text.match(/^(\d+)초$/)
    if (secondsOnly) return { ok: true, value: Number(secondsOnly[1]) }
    const mixed = text.match(/^(?:(\d+)시간)?(?:(\d+)분)?(?:(\d+)초)?$/)
    if (!mixed || !mixed[0]) return { ok: false, error: '시간, 분, 초가 보이게 써요.' }
    return normalizeGrade3DurationAnswer({
      hours: mixed[1] ?? '',
      minutes: mixed[2] ?? '',
      seconds: mixed[3] ?? '',
    })
  }

  if (isBlank(input.hours) && isBlank(input.minutes) && isBlank(input.seconds)) {
    return { ok: false, error: '걸린 시간을 써요.' }
  }
  const hours = parseNonNegativeInteger(input.hours, '시간 칸')
  if (!hours.ok) return hours
  const minutes = parseNonNegativeInteger(input.minutes, '분 칸')
  if (!minutes.ok) return minutes
  const seconds = parseNonNegativeInteger(input.seconds, '초 칸')
  if (!seconds.ok) return seconds
  const m = Number(minutes.value ?? 0)
  const s = Number(seconds.value ?? 0)
  if (m >= 60) return { ok: false, error: '분은 0부터 59까지 써요.' }
  if (s >= 60) return { ok: false, error: '초는 0부터 59까지 써요.' }
  return { ok: true, value: Number(hours.value ?? 0) * 3600 + m * 60 + s }
}

export function normalizeGrade3CapacityAnswer(
  input: string | Grade3StructuredCapacityInput
): Grade3NormalizerResult {
  if (typeof input === 'string') {
    const text = input.trim().toLowerCase().replace(/\s+/g, '')
    if (!text) return { ok: false, error: '들이를 써요.' }
    const ml = text.match(/^(\d+)ml$/)
    if (ml) return { ok: true, value: Number(ml[1]) }
    const l = text.match(/^(\d+)l$/)
    if (l) return { ok: true, value: Number(l[1]) * 1000 }
    const mixed = text.match(/^(\d+)l(\d+)ml$/)
    if (mixed) {
      const milliliters = Number(mixed[2])
      if (milliliters >= 1000) return { ok: false, error: 'mL 칸은 1000보다 작은 수로 써요.' }
      return { ok: true, value: Number(mixed[1]) * 1000 + milliliters }
    }
    return { ok: false, error: 'L와 mL가 보이게 써요.' }
  }

  if (isBlank(input.liters) && isBlank(input.milliliters)) {
    return { ok: false, error: '들이를 써요.' }
  }
  const liters = parseNonNegativeInteger(input.liters, 'L 칸')
  if (!liters.ok) return liters
  const milliliters = parseNonNegativeInteger(input.milliliters, 'mL 칸')
  if (!milliliters.ok) return milliliters
  const ml = Number(milliliters.value ?? 0)
  if (ml >= 1000) return { ok: false, error: 'mL 칸은 1000보다 작은 수로 써요.' }
  return { ok: true, value: Number(liters.value ?? 0) * 1000 + ml }
}

export function normalizeGrade3WeightAnswer(
  input: string | Grade3StructuredWeightInput
): Grade3NormalizerResult {
  if (typeof input === 'string') {
    const text = input.trim().toLowerCase().replace(/\s+/g, '')
    if (!text) return { ok: false, error: '무게를 써요.' }
    const g = text.match(/^(\d+)g$/)
    if (g) return { ok: true, value: Number(g[1]) }
    const kg = text.match(/^(\d+)kg$/)
    if (kg) return { ok: true, value: Number(kg[1]) * 1000 }
    const mixed = text.match(/^(\d+)kg(\d+)g$/)
    if (mixed) {
      const grams = Number(mixed[2])
      if (grams >= 1000) return { ok: false, error: 'g 칸은 1000보다 작은 수로 써요.' }
      return { ok: true, value: Number(mixed[1]) * 1000 + grams }
    }
    return { ok: false, error: 'kg와 g가 보이게 써요.' }
  }

  if (isBlank(input.kilograms) && isBlank(input.grams)) {
    return { ok: false, error: '무게를 써요.' }
  }
  const kilograms = parseNonNegativeInteger(input.kilograms, 'kg 칸')
  if (!kilograms.ok) return kilograms
  const grams = parseNonNegativeInteger(input.grams, 'g 칸')
  if (!grams.ok) return grams
  const g = Number(grams.value ?? 0)
  if (g >= 1000) return { ok: false, error: 'g 칸은 1000보다 작은 수로 써요.' }
  return { ok: true, value: Number(kilograms.value ?? 0) * 1000 + g }
}

export function normalizeGrade3AngleAnswer(input: string): Grade3NormalizerResult {
  const text = input.trim().replace(/\s+/g, '').replace(/도$/, '')
  if (!text) return { ok: false, error: '각도를 써요.' }
  if (!/^\d+$/.test(text)) return { ok: false, error: '각도는 숫자로 써요.' }
  const value = Number(text)
  if (value < 0 || value > 360) return { ok: false, error: '각도는 0도부터 360도까지 써요.' }
  return { ok: true, value }
}

export function normalizeGrade3Answer(
  answerType: Grade3AnswerType,
  input: Grade3StructuredAnswerInput
): Grade3NormalizerResult {
  switch (answerType) {
    case 'choice':
    case 'label':
      return normalizeGrade3LabelAnswer(String(input))
    case 'integer':
      return normalizeGrade3IntegerAnswer(String(input))
    case 'fraction':
      return normalizeGrade3FractionAnswer(input as string | Grade3StructuredFractionInput)
    case 'decimal':
      return normalizeGrade3DecimalAnswer(String(input))
    case 'length':
      return normalizeGrade3LengthAnswer(input as string | Grade3StructuredLengthInput)
    case 'time-of-day':
      return normalizeGrade3TimeOfDayAnswer(input as string | Grade3StructuredTimeInput)
    case 'duration':
      return normalizeGrade3DurationAnswer(input as string | Grade3StructuredTimeInput)
    case 'capacity':
      return normalizeGrade3CapacityAnswer(input as string | Grade3StructuredCapacityInput)
    case 'weight':
      return normalizeGrade3WeightAnswer(input as string | Grade3StructuredWeightInput)
    case 'angle':
      return normalizeGrade3AngleAnswer(String(input))
    default:
      return { ok: false, error: '지원하지 않는 답안 형식이에요.' }
  }
}

export function checkGrade3Answer(
  answerType: Grade3AnswerType,
  userAnswer: Grade3StructuredAnswerInput,
  correctAnswer: string
): Grade3NormalizerResult & { correct: boolean } {
  const normalizedUser = normalizeGrade3Answer(answerType, userAnswer)
  if (!normalizedUser.ok) return { ...normalizedUser, correct: false }

  const normalizedCorrect = normalizeGrade3Answer(answerType, correctAnswer)
  if (!normalizedCorrect.ok) {
    return {
      ok: false,
      correct: false,
      dataError: true,
      error: '정답 데이터가 올바르지 않아요.',
    }
  }

  return {
    ok: true,
    correct: normalizedUser.value === normalizedCorrect.value,
    value: normalizedUser.value,
  }
}
