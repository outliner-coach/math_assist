import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'

function n(params: Readonly<Record<string, JsonValue>>, key: string): number {
  const value = params[key]
  if (!Number.isSafeInteger(value)) throw new TypeError(`${key} must be an integer`)
  return value as number
}
function text(minutes: number): string { const hour = Math.floor(minutes / 60) % 12 || 12; return `${hour}시 ${minutes % 60}분` }

export function oracleG2TimeProblem(problem: GeneratedApplicationProblemV1): string {
  const p = problem.params
  switch (problem.familyId) {
    case 'g2-2-time-finish-time': return text(n(p, 'start-hour') * 60 + n(p, 'start-minute') + n(p, 'elapsed'))
    case 'g2-2-time-find-start': return text(n(p, 'end-hour') * 60 + n(p, 'end-minute') - n(p, 'elapsed'))
    case 'g2-2-time-clock-reading-error': return '나'
    case 'g2-2-time-calendar-check': return n(p, 'weeks') * 7 === n(p, 'claimed-days') ? '맞아요' : '틀려요'
    default: throw new TypeError(`unsupported Grade 2 time family ${problem.familyId}`)
  }
}
