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
