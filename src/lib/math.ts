/**
 * 수학 유틸리티 함수
 */

// 최대공약수 (유클리드 호제법)
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.floor(a))
  b = Math.abs(Math.floor(b))
  while (b !== 0) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}

// 최소공배수
export function lcm(a: number, b: number): number {
  a = Math.abs(Math.floor(a))
  b = Math.abs(Math.floor(b))
  if (a === 0 || b === 0) return 0
  return (a * b) / gcd(a, b)
}

// 약수 배열
export function divisors(n: number): number[] {
  n = Math.abs(Math.floor(n))
  if (n === 0) return []
  const result: number[] = []
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      result.push(i)
      if (i !== n / i) {
        result.push(n / i)
      }
    }
  }
  return result.sort((a, b) => a - b)
}

// 배수 배열
export function multiples(n: number, count: number): number[] {
  n = Math.abs(Math.floor(n))
  if (n === 0) return []
  const result: number[] = []
  for (let i = 1; i <= count; i++) {
    result.push(n * i)
  }
  return result
}

// 기약분수로 변환
export function reduce(numerator: number, denominator: number): { num: number; den: number } {
  if (denominator === 0) {
    throw new Error('분모가 0일 수 없습니다')
  }

  const sign = (numerator < 0) !== (denominator < 0) ? -1 : 1
  numerator = Math.abs(Math.floor(numerator))
  denominator = Math.abs(Math.floor(denominator))

  const g = gcd(numerator, denominator)
  return {
    num: sign * (numerator / g),
    den: denominator / g
  }
}

// 공약수 배열
export function commonDivisors(a: number, b: number): number[] {
  const divisorsA = divisors(a)
  const divisorsB = new Set(divisors(b))
  return divisorsA.filter(d => divisorsB.has(d))
}

// 공배수 배열 (특정 범위 내)
export function commonMultiples(a: number, b: number, count: number): number[] {
  const lcmValue = lcm(a, b)
  return multiples(lcmValue, count)
}

// 숫자 배열을 문자열로 (예: "6, 12, 18, ...")
export function formatNumberList(nums: number[], addEllipsis = true): string {
  const str = nums.join(', ')
  return addEllipsis ? str + ', ...' : str
}

// 약수의 개수
export function divisorCount(n: number): number {
  return divisors(n).length
}

// 1을 제외한 가장 작은 약수
export function smallestDivisorOverOne(n: number): number {
  const ds = divisors(n)
  for (const d of ds) {
    if (d > 1) return d
  }
  return 1
}

// 자기 자신을 제외한 가장 큰 약수
export function largestProperDivisor(n: number): number {
  const ds = divisors(n)
  if (ds.length <= 1) return 1
  return ds[ds.length - 2]
}

// 두 번째로 큰 약수
export function secondLargestDivisor(n: number): number {
  const ds = divisors(n)
  if (ds.length <= 1) return 1
  return ds[ds.length - 2]
}

// --- 분수 관련 함수 ---

// 약분 결과를 문자열로 ("분자/분모")
export function reduceFrac(num: number, den: number): string {
  const r = reduce(num, den)
  if (r.den === 1) return String(r.num)
  return `${r.num}/${r.den}`
}

// 약분된 분자
export function reducedNum(num: number, den: number): number {
  return reduce(num, den).num
}

// 약분된 분모
export function reducedDen(num: number, den: number): number {
  return reduce(num, den).den
}

// 약분 오프셋 (분자에 offset을 더한 기약분수)
export function reduceFracOff(num: number, den: number, offset: number): string {
  const r = reduce(num + offset, den)
  if (r.den === 1) return String(r.num)
  return `${r.num}/${r.den}`
}

// 통분 공통 분모
export function commonDen(d1: number, d2: number): number {
  return lcm(d1, d2)
}

// 통분 결과 - 첫째 분수의 새 분자
export function convertNum1(n1: number, d1: number, d2: number): number {
  const cd = lcm(d1, d2)
  return n1 * (cd / d1)
}

// 통분 결과 - 둘째 분수의 새 분자
export function convertNum2(n2: number, d1: number, d2: number): number {
  const cd = lcm(d1, d2)
  return n2 * (cd / d2)
}

// 분수 덧셈 (기약분수 문자열)
export function fracAdd(n1: number, d1: number, n2: number, d2: number): string {
  const cd = lcm(d1, d2)
  const newN = n1 * (cd / d1) + n2 * (cd / d2)
  return reduceFrac(newN, cd)
}

// 분수 덧셈 오프셋 (분자에 offset 더하고 약분)
export function fracAddOff(n1: number, d1: number, n2: number, d2: number, offset: number): string {
  const cd = lcm(d1, d2)
  const newN = n1 * (cd / d1) + n2 * (cd / d2) + offset
  return reduceFrac(newN, cd)
}

// 분수 뺄셈 (기약분수 문자열)
export function fracSub(n1: number, d1: number, n2: number, d2: number): string {
  const cd = lcm(d1, d2)
  const newN = n1 * (cd / d1) - n2 * (cd / d2)
  return reduceFrac(newN, cd)
}

// 분수 뺄셈 오프셋
export function fracSubOff(n1: number, d1: number, n2: number, d2: number, offset: number): string {
  const cd = lcm(d1, d2)
  const newN = n1 * (cd / d1) - n2 * (cd / d2) + offset
  return reduceFrac(newN, cd)
}

// 분수 곱셈 (기약분수 문자열)
export function fracMul(n1: number, d1: number, n2: number, d2: number): string {
  return reduceFrac(n1 * n2, d1 * d2)
}

// 분수 곱셈 오프셋
export function fracMulOff(n1: number, d1: number, n2: number, d2: number, offset: number): string {
  return reduceFrac(n1 * n2 + offset, d1 * d2)
}

// --- 반올림/올림/버림 ---

// 반올림 (place 단위: 10=십의자리, 100=백의자리)
export function roundTo(n: number, place: number): number {
  return Math.round(n / place) * place
}

// 올림
export function ceilTo(n: number, place: number): number {
  return Math.ceil(n / place) * place
}

// 버림
export function floorTo(n: number, place: number): number {
  return Math.floor(n / place) * place
}

// --- 소수 관련 함수 ---

// 정수를 소수로 표시 (n을 10^places로 나눔)
export function dec1(n: number): string {
  return (n / 10).toString()
}

// 소수(1자리) × 자연수
export function decTimesNat(a: number, b: number): string {
  const result = (a * b) / 10
  return Number.isInteger(result) ? result.toString() : result.toString()
}

// 소수(1자리) × 자연수 오프셋 (0.1 단위 offset)
export function decTimesNatOff(a: number, b: number, off: number): string {
  const result = (a * b + off) / 10
  return Number.isInteger(result) ? result.toString() : result.toString()
}

// 소수(1자리) × 소수(1자리)
export function decTimesDec(a: number, b: number): string {
  const result = (a * b) / 100
  return result.toString()
}

// 소수(1자리) × 소수(1자리) 오프셋 (0.01 단위)
export function decTimesDecOff(a: number, b: number, off: number): string {
  const result = (a * b + off) / 100
  return result.toString()
}

// --- 평균 ---

// 세 수의 평균
export function avg3(a: number, b: number, c: number): number {
  return Math.round((a + b + c) / 3 * 10) / 10
}

// 네 수의 평균
export function avg4(a: number, b: number, c: number, d: number): number {
  return (a + b + c + d) / 4
}

// 세 수의 합
export function sum3(a: number, b: number, c: number): number {
  return a + b + c
}

// 네 수의 합
export function sum4(a: number, b: number, c: number, d: number): number {
  return a + b + c + d
}
