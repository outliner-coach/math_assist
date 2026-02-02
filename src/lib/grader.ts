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

    const sign = whole < 0 ? -1 : 1
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

  // ".5" → "0.5" 정규화
  const normalized = trimmed.startsWith('.') ? '0' + trimmed : trimmed

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

    if (userAnswer !== null) {
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
      solutionSteps: problem.solutionSteps
    }
  })
}

// 점수 계산
export function calculateScore(results: SubmissionResult[]): number {
  return results.filter(r => r.correct).length
}
