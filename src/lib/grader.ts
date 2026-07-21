/**
 * 채점기 - 답안 정규화 및 비교
 */

import { gcd } from './math'
import type { NormalizedValue, Problem, SubmissionResult } from './types'

// 분수를 정규화된 형태로 파싱
function parseFraction(input: string): NormalizedValue | null {
  const trimmed = input.trim()

  // 대분수: "1 2/3" 형식
  const mixedMatch = trimmed.match(/^(-?\d+)\s+(\d+)\/(\d+)$/)
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1])
    const num = parseInt(mixedMatch[2])
    const den = parseInt(mixedMatch[3])
    if (den === 0) return null

    const sign = mixedMatch[1].startsWith('-') ? -1 : 1
    const totalNum = sign * (Math.abs(whole) * den + num)
    const g = gcd(Math.abs(totalNum), den)

    return {
      type: 'fraction',
      numerator: totalNum / g,
      denominator: den / g
    }
  }

  // 분수: "2/3" 형식
  const fractionMatch = trimmed.match(/^(-?\d+)\/(\d+)$/)
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1])
    const den = parseInt(fractionMatch[2])
    if (den === 0) return null

    const g = gcd(Math.abs(num), den)
    return {
      type: 'fraction',
      numerator: num / g,
      denominator: den / g
    }
  }

  return null
}

// 소수를 정규화된 형태로 파싱
function parseDecimal(input: string): NormalizedValue | null {
  const trimmed = input.trim()

  // parseFloat는 "1/", "1." 같은 부분 입력도 1로 처리하므로
  // 지원하는 소수 형식 전체가 일치한 뒤에만 숫자로 변환한다.
  if (!/^-?(?:\d+\.\d+|\.\d+)$/.test(trimmed)) return null

  // ".5" → "0.5", "-.5" → "-0.5" 정규화
  const normalized = trimmed.replace(/^(-?)\./, '$10.')

  const num = parseFloat(normalized)
  if (isNaN(num)) return null

  // 소수를 분수로 변환
  const decimalStr = normalized.includes('.') ? normalized.split('.')[1] : ''
  const denominator = Math.pow(10, decimalStr.length)
  const numerator = Math.round(num * denominator)

  const g = gcd(Math.abs(numerator), denominator)

  return {
    type: 'decimal',
    numerator: numerator / g,
    denominator: denominator / g
  }
}

// 정수를 정규화된 형태로 파싱
function parseInteger(input: string): NormalizedValue | null {
  const trimmed = input.trim()
  const num = parseInt(trimmed)

  if (isNaN(num) || trimmed !== num.toString()) return null

  return {
    type: 'integer',
    numerator: num,
    denominator: 1
  }
}

// 입력값 정규화
export function normalizeAnswer(input: string): NormalizedValue | null {
  if (!input || typeof input !== 'string') return null

  const trimmed = input.trim()
  if (trimmed === '') return null

  // 분수/대분수 먼저 시도
  const fraction = parseFraction(trimmed)
  if (fraction) return fraction

  // 정수 시도
  const integer = parseInteger(trimmed)
  if (integer) return integer

  // 소수 시도
  const decimal = parseDecimal(trimmed)
  if (decimal) return decimal

  return null
}

// 숫자 입력이 채점 가능한 완성 형식인지 확인하고 학습자용 안내를 반환
export function getNumberAnswerInputError(input: string): string | null {
  if (normalizeAnswer(input)) return null

  const trimmed = typeof input === 'string' ? input.trim() : ''
  if (!trimmed) return '답을 숫자로 입력해 주세요.'
  if (trimmed === '-') return '음수 기호 뒤에 숫자를 입력해 주세요.'
  if (trimmed === '.' || trimmed === '-.' || /^-?\d+\.$/.test(trimmed)) {
    return '소수점 뒤에 숫자를 입력해 주세요.'
  }
  if (trimmed.includes('/') || /\s/.test(trimmed)) {
    return '분수는 1/2처럼 분자와 분모를 모두 입력하고, 대분수는 1 1/2처럼 입력해 주세요.'
  }

  return '정수, 소수, 분수 또는 대분수 모양으로 입력해 주세요.'
}

// 두 정규화된 값 비교
export function compareNormalized(a: NormalizedValue, b: NormalizedValue): boolean {
  // 분수로 통일하여 비교 (교차 곱셈)
  return a.numerator * b.denominator === b.numerator * a.denominator
}

// 숫자 입력 채점
export function checkNumberAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normalizedUser = normalizeAnswer(userAnswer)
  const normalizedCorrect = normalizeAnswer(correctAnswer)

  if (!normalizedUser || !normalizedCorrect) return false

  return compareNormalized(normalizedUser, normalizedCorrect)
}

// 객관식 채점
export function checkChoiceAnswer(userChoice: number, correctChoice: number): boolean {
  return userChoice === correctChoice
}

// 전체 세션 채점
export function gradeSession(
  problems: Problem[],
  answers: (string | null)[]
): SubmissionResult[] {
  return problems.map((problem, index) => {
    const userAnswer = answers[index]
    let correct = false

    if (userAnswer !== null && userAnswer.trim() !== '') {
      if (problem.type === 'choice') {
        const userChoice = parseInt(userAnswer)
        correct = !isNaN(userChoice) && userChoice === problem.correctChoiceIndex
      } else {
        correct = checkNumberAnswer(userAnswer, problem.correctAnswer)
      }
    }

    return {
      index,
      correct,
      userAnswer,
      correctAnswer: problem.correctAnswer,
      solutionSteps: problem.solutionSteps,
      problem
    }
  })
}

// 점수 계산
export function calculateScore(results: SubmissionResult[]): number {
  return results.filter(r => r.correct).length
}
