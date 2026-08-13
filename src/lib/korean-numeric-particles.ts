type KoreanNumericParticle =
  | '은'
  | '는'
  | '이'
  | '가'
  | '을'
  | '를'
  | '과'
  | '와'
  | '으로'
  | '로'

const numericUnitPronunciations: Record<string, string> = {
  kg: '킬로그램',
  km: '킬로미터',
  cm: '센티미터',
  mm: '밀리미터',
  m: '미터',
  L: '리터',
  mL: '밀리리터',
  g: '그램',
  'cm²': '제곱센티미터',
  'm²': '제곱미터',
  'km²': '제곱킬로미터',
  '°': '도',
  '%': '퍼센트',
}
const numericUnits = [
  ...Object.keys(numericUnitPronunciations),
  '개',
  '명',
  '번',
  '초',
  '분',
  '시',
  '일',
  '주',
  '년',
  '쪽',
  '권',
  '줄',
  '점',
  '배',
  '장',
  '칸',
  '곳',
  '회',
  '자루',
  '봉지',
  '상자',
].sort((left, right) => right.length - left.length)

const numericParticlePattern = new RegExp(
  `(?<![\\dA-Za-z])(\\d[\\d,]*(?:\\.\\d+)?(?:\\s*(?:${numericUnits.join('|')}))?)(으로|로|은|는|이|가|을|를|과|와)(?=$|[\\s.,!?…;:)\\]}'"”’])`,
  'g',
)
const fractionParticlePattern = new RegExp(
  `(?<![/\\dA-Za-z])((?:\\d[\\d,]*\\s+)?(\\d[\\d,]*)/(\\d[\\d,]*))(으로|로|은|는|이|가|을|를|과|와)(?=$|[\\s.,!?…;:)\\]}'"”’])`,
  'g',
)

function finalSound(value: string): {
  hasBatchim: boolean
  hasRieulBatchim: boolean
} {
  const trimmed = value.trim()
  const unit = numericUnits.find(candidate => trimmed.endsWith(candidate))
  const spokenEnding = unit === undefined
    ? trimmed.replaceAll(',', '').at(-1)
    : (numericUnitPronunciations[unit] ?? unit).at(-1)

  if (spokenEnding === undefined) {
    return { hasBatchim: false, hasRieulBatchim: false }
  }

  const hangulOffset = spokenEnding.charCodeAt(0) - 0xac00
  if (hangulOffset >= 0 && hangulOffset <= 0xd7a3 - 0xac00) {
    const finalConsonant = hangulOffset % 28
    return {
      hasBatchim: finalConsonant !== 0,
      hasRieulBatchim: finalConsonant === 8,
    }
  }

  return {
    hasBatchim: ['0', '1', '3', '6', '7', '8'].includes(spokenEnding),
    hasRieulBatchim: ['1', '7', '8'].includes(spokenEnding),
  }
}

function correctParticle(
  value: string,
  pronunciationValue: string,
  particle: KoreanNumericParticle,
): string {
  const { hasBatchim, hasRieulBatchim } = finalSound(pronunciationValue)
  if (particle === '은' || particle === '는') {
    return `${value}${hasBatchim ? '은' : '는'}`
  }
  if (particle === '이' || particle === '가') {
    return `${value}${hasBatchim ? '이' : '가'}`
  }
  if (particle === '을' || particle === '를') {
    return `${value}${hasBatchim ? '을' : '를'}`
  }
  if (particle === '과' || particle === '와') {
    return `${value}${hasBatchim ? '과' : '와'}`
  }
  return `${value}${hasBatchim && !hasRieulBatchim ? '으로' : '로'}`
}

function isDivisionSlashSurface(text: string, start: number, end: number): boolean {
  return /\/\s*$/.test(text.slice(0, start))
    || /^\s*(?:나눗셈|나누|나눕|나눠|나눈|나눌)/.test(text.slice(end))
}

export function correctKoreanNumericParticles(text: string): string {
  const fractionsCorrected = text.replace(
    fractionParticlePattern,
    (
      matched: string,
      value: string,
      numerator: string,
      _denominator: string,
      particle: KoreanNumericParticle,
      offset: number,
      source: string,
    ) => {
      if (isDivisionSlashSurface(source, offset, offset + matched.length)) return matched
      return correctParticle(value, numerator, particle)
    },
  )

  return fractionsCorrected.replace(
    numericParticlePattern,
    (
      matched: string,
      value: string,
      particle: KoreanNumericParticle,
      offset: number,
      source: string,
    ) => {
      if (isDivisionSlashSurface(source, offset, offset + matched.length)) return matched
      return correctParticle(value, value, particle)
    },
  )
}
