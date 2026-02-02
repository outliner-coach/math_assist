/**
 * 문제 생성기 - 템플릿에서 문제 생성
 */

import * as math from './math'
import type { Problem, ProblemTemplate } from './types'

// 시드 기반 난수 생성기 (재현 가능)
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

// 범위 내 랜덤 정수
function randomInt(min: number, max: number, random: () => number): number {
  return Math.floor(random() * (max - min + 1)) + min
}

// 배열 셔플 (Fisher-Yates)
function shuffleArray<T>(array: T[], random: () => number): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// 템플릿 문자열 평가 ({{a}}, {{lcm(a,b)}} 등)
function evaluateTemplate(template: string, params: Record<string, number>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const trimmedExpr = expr.trim()

    // 단순 변수
    if (params[trimmedExpr] !== undefined) {
      return String(params[trimmedExpr])
    }

    // 함수 호출 파싱
    const funcMatch = trimmedExpr.match(/^(\w+)\(([^)]+)\)$/)
    if (funcMatch) {
      const funcName = funcMatch[1]
      const args = funcMatch[2].split(',').map((arg: string) => {
        const trimmed = arg.trim()
        // 숫자 상수
        if (/^\d+$/.test(trimmed)) return parseInt(trimmed)
        // 변수
        return params[trimmed] ?? 0
      })

      switch (funcName) {
        case 'gcd':
          return String(math.gcd(args[0], args[1]))
        case 'lcm':
          return String(math.lcm(args[0], args[1]))
        case 'divisors':
          return math.divisors(args[0]).join(', ')
        case 'multiples':
          return math.formatNumberList(math.multiples(args[0], args[1] || 5), true)
        case 'commonDivisors':
          return math.commonDivisors(args[0], args[1]).join(', ')
        default:
          return `[${funcName}?]`
      }
    }

    // 산술 연산
    try {
      // 변수를 값으로 치환
      let evalExpr = trimmedExpr
      for (const [key, value] of Object.entries(params)) {
        evalExpr = evalExpr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value))
      }
      // 간단한 산술만 허용 (보안)
      if (/^[\d\s+\-*/().]+$/.test(evalExpr)) {
        return String(eval(evalExpr))
      }
    } catch {
      // 평가 실패
    }

    return `[${trimmedExpr}?]`
  })
}

// 파라미터 생성
function generateParams(
  schema: Record<string, { min: number; max: number }>,
  random: () => number
): Record<string, number> {
  const params: Record<string, number> = {}
  for (const [key, range] of Object.entries(schema)) {
    params[key] = randomInt(range.min, range.max, random)
  }
  return params
}

// 파라미터 키 생성 (중복 체크용)
function paramsKey(templateId: string, params: Record<string, number>): string {
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
  return `${templateId}:${sorted.map(([k, v]) => `${k}=${v}`).join(',')}`
}

// 단일 문제 생성
function generateSingleProblem(
  template: ProblemTemplate,
  params: Record<string, number>,
  index: number,
  random: () => number
): Problem {
  const prompt = evaluateTemplate(template.prompt_template, params)
  const correctAnswer = evaluateTemplate(`{{${template.solver_rule}}}`, params)
  const solutionSteps = template.solution_steps_template.map(step =>
    evaluateTemplate(step, params)
  )

  if (template.type === 'choice' && template.choices_template) {
    // 객관식: 보기 생성 및 셔플
    const choices = template.choices_template.map(choice =>
      evaluateTemplate(choice, params)
    )

    // 정답 위치 기억
    const correctValue = choices[0] // 첫 번째가 정답

    // 셔플
    const shuffled = shuffleArray(choices, random)
    const correctChoiceIndex = shuffled.indexOf(correctValue)

    return {
      index,
      templateId: template.id,
      params,
      prompt,
      type: 'choice',
      choices: shuffled,
      correctAnswer,
      correctChoiceIndex,
      solutionSteps
    }
  }

  return {
    index,
    templateId: template.id,
    params,
    prompt,
    type: 'number',
    correctAnswer,
    solutionSteps
  }
}

// 문제 세트 생성
export function generateProblems(
  templates: ProblemTemplate[],
  count: number = 10,
  seed?: number
): Problem[] {
  const actualSeed = seed ?? Date.now()
  const random = seededRandom(actualSeed)

  const problems: Problem[] = []
  const usedKeys = new Set<string>()

  let attempts = 0
  const maxAttempts = count * 10

  while (problems.length < count && attempts < maxAttempts) {
    attempts++

    // 랜덤 템플릿 선택
    const template = templates[Math.floor(random() * templates.length)]
    const params = generateParams(template.param_schema, random)
    const key = paramsKey(template.id, params)

    // 중복 체크
    if (usedKeys.has(key)) continue

    usedKeys.add(key)
    const problem = generateSingleProblem(template, params, problems.length, random)
    problems.push(problem)
  }

  return problems
}

// 세션 ID 생성
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
