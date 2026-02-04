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

// 함수 호출 평가
function evaluateFunction(funcName: string, args: number[]): string | null {
  switch (funcName) {
    // 약수/배수/공약수/공배수
    case 'gcd':
      return String(math.gcd(args[0], args[1]))
    case 'lcm':
      return String(math.lcm(args[0], args[1]))
    case 'divisors':
      return math.divisors(args[0]).join(', ')
    case 'divisorCount':
      return String(math.divisorCount(args[0]))
    case 'smallestDivisorOverOne':
      return String(math.smallestDivisorOverOne(args[0]))
    case 'largestProperDivisor':
      return String(math.largestProperDivisor(args[0]))
    case 'secondLargestDivisor':
      return String(math.secondLargestDivisor(args[0]))
    case 'multiples':
      return math.formatNumberList(math.multiples(args[0], args[1] || 5), true)
    case 'commonDivisors':
      return math.commonDivisors(args[0], args[1]).join(', ')

    // 분수 약분/통분
    case 'reduceFrac':
      return math.reduceFrac(args[0], args[1])
    case 'reducedNum':
      return String(math.reducedNum(args[0], args[1]))
    case 'reducedDen':
      return String(math.reducedDen(args[0], args[1]))
    case 'reduceFracOff':
      return math.reduceFracOff(args[0], args[1], args[2])
    case 'commonDen':
      return String(math.commonDen(args[0], args[1]))
    case 'convertNum1':
      return String(math.convertNum1(args[0], args[1], args[2]))
    case 'convertNum2':
      return String(math.convertNum2(args[0], args[1], args[2]))

    // 분수 사칙연산
    case 'fracAdd':
      return math.fracAdd(args[0], args[1], args[2], args[3])
    case 'fracAddOff':
      return math.fracAddOff(args[0], args[1], args[2], args[3], args[4])
    case 'fracSub':
      return math.fracSub(args[0], args[1], args[2], args[3])
    case 'fracSubOff':
      return math.fracSubOff(args[0], args[1], args[2], args[3], args[4])
    case 'fracMul':
      return math.fracMul(args[0], args[1], args[2], args[3])
    case 'fracMulOff':
      return math.fracMulOff(args[0], args[1], args[2], args[3], args[4])

    // 반올림/올림/버림
    case 'roundTo':
      return String(math.roundTo(args[0], args[1]))
    case 'ceilTo':
      return String(math.ceilTo(args[0], args[1]))
    case 'floorTo':
      return String(math.floorTo(args[0], args[1]))

    // 소수
    case 'dec1':
      return math.dec1(args[0])
    case 'decTimesNat':
      return math.decTimesNat(args[0], args[1])
    case 'decTimesNatOff':
      return math.decTimesNatOff(args[0], args[1], args[2])
    case 'decTimesDec':
      return math.decTimesDec(args[0], args[1])
    case 'decTimesDecOff':
      return math.decTimesDecOff(args[0], args[1], args[2])

    // 평균/합계
    case 'avg3':
      return String(math.avg3(args[0], args[1], args[2]))
    case 'avg4':
      return String(math.avg4(args[0], args[1], args[2], args[3]))
    case 'sum3':
      return String(math.sum3(args[0], args[1], args[2]))
    case 'sum4':
      return String(math.sum4(args[0], args[1], args[2], args[3]))

    default:
      return null
  }
}

// 인자 문자열을 숫자로 평가 (변수, 리터럴, 산술식 지원)
function evaluateArg(argStr: string, params: Record<string, number>): number {
  const trimmed = argStr.trim()
  // 리터럴 정수
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed)
  // 단순 변수
  if (params[trimmed] !== undefined) return params[trimmed]
  // 산술식 (예: f * p, a + 1)
  let evalExpr = trimmed
  for (const [key, value] of Object.entries(params)) {
    evalExpr = evalExpr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value))
  }
  if (/^[\d\s+\-*/().]+$/.test(evalExpr)) {
    try { return eval(evalExpr) } catch { return 0 }
  }
  return 0
}

// 표현식 내 함수 호출을 값으로 치환
function replaceFunctionCalls(expr: string, params: Record<string, number>): string {
  // 함수 호출 패턴: funcName(arg1, arg2, ...)
  return expr.replace(/(\w+)\(([^)]+)\)/g, (match, funcName, argsStr) => {
    const args = argsStr.split(',').map((arg: string) => evaluateArg(arg, params))
    const result = evaluateFunction(funcName, args)
    return result !== null ? result : match
  })
}

// 템플릿 문자열 평가 ({{a}}, {{lcm(a,b)}} 등)
function evaluateTemplate(template: string, params: Record<string, number>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const trimmedExpr = expr.trim()

    // 단순 변수
    if (params[trimmedExpr] !== undefined) {
      return String(params[trimmedExpr])
    }

    // 함수 호출만 있는 경우 (예: divisors(n), reduceFrac(f * p, f * q))
    const funcMatch = trimmedExpr.match(/^(\w+)\(([^)]+)\)$/)
    if (funcMatch) {
      const funcName = funcMatch[1]
      const args = funcMatch[2].split(',').map((arg: string) => evaluateArg(arg, params))
      const result = evaluateFunction(funcName, args)
      if (result !== null) return result
    }

    // 산술 연산 (함수 호출 포함 가능)
    try {
      // 1. 함수 호출을 먼저 값으로 치환
      let evalExpr = replaceFunctionCalls(trimmedExpr, params)

      // 2. 변수를 값으로 치환
      for (const [key, value] of Object.entries(params)) {
        evalExpr = evalExpr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value))
      }

      // 3. 간단한 산술만 허용 (보안)
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
  const hintSteps = template.hint_steps_template
    ? template.hint_steps_template.map(step => evaluateTemplate(step, params))
    : undefined

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
      setId: template.set_id,
      params,
      prompt,
      type: 'choice',
      choices: shuffled,
      correctAnswer,
      correctChoiceIndex,
      solutionSteps,
      hintSteps
    }
  }

  return {
    index,
    templateId: template.id,
    setId: template.set_id,
    params,
    prompt,
    type: 'number',
    correctAnswer,
    solutionSteps,
    hintSteps
  }
}

// 문제 세트 생성
export function generateProblems(
  templates: ProblemTemplate[],
  options?: {
    count?: number
    setId?: 'A' | 'B' | 'C'
    difficultyMix?: { 1: number; 2: number; 3: number }
    seed?: number
  }
): Problem[] {
  const count = options?.count ?? 10
  const setId = options?.setId ?? 'A'
  const difficultyMix = options?.difficultyMix ?? { 1: 4, 2: 4, 3: 2 }
  const actualSeed = options?.seed ?? Date.now()
  const random = seededRandom(actualSeed)

  const setTemplates = templates.filter(t => t.set_id === setId)
  const totalMix = Object.values(difficultyMix).reduce((a, b) => a + b, 0)
  if (totalMix !== count) {
    throw new Error(`difficultyMix total (${totalMix}) must match count (${count})`)
  }

  const byDifficulty: Record<1 | 2 | 3, ProblemTemplate[]> = {
    1: [],
    2: [],
    3: []
  }

  for (const template of setTemplates) {
    byDifficulty[template.difficulty].push(template)
  }

  for (const level of [1, 2, 3] as const) {
    if (byDifficulty[level].length < difficultyMix[level]) {
      throw new Error(
        `Not enough templates for set ${setId}, difficulty ${level}: ` +
        `${byDifficulty[level].length} < ${difficultyMix[level]}`
      )
    }
  }

  const selectedTemplates: ProblemTemplate[] = []
  for (const level of [1, 2, 3] as const) {
    const shuffled = shuffleArray(byDifficulty[level], random)
    selectedTemplates.push(...shuffled.slice(0, difficultyMix[level]))
  }

  const orderedTemplates = shuffleArray(selectedTemplates, random)

  const problems: Problem[] = []
  const usedKeys = new Set<string>()

  orderedTemplates.forEach((template, idx) => {
    let attempts = 0
    const maxAttempts = 20
    let params = generateParams(template.param_schema, random)
    let key = paramsKey(template.id, params)

    while (usedKeys.has(key) && attempts < maxAttempts) {
      attempts++
      params = generateParams(template.param_schema, random)
      key = paramsKey(template.id, params)
    }

    if (usedKeys.has(key)) {
      throw new Error(`Failed to generate unique params for template ${template.id}`)
    }

    usedKeys.add(key)
    const problem = generateSingleProblem(template, params, idx, random)
    problems.push(problem)
  })

  return problems
}

// 세션 ID 생성
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
