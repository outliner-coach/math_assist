import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'
function n(p: Readonly<Record<string, JsonValue>>, k: string): number { const v = p[k]; if (!Number.isSafeInteger(v)) throw new TypeError(k); return v as number }
export function oracleG2PatternProblem(problem: GeneratedApplicationProblemV1): string { const p = problem.params; switch (problem.familyId) {
  case 'g2-2-pattern-step-application': case 'g2-2-pattern-far-step': return String(n(p, 'start') + n(p, 'step') * (n(p, 'position') - 1))
  case 'g2-2-pattern-find-start': return String(n(p, 'later') - n(p, 'step') * (n(p, 'position') - 1))
  case 'g2-2-pattern-broken-term': return '틀려요'
  default: throw new TypeError(`unsupported Grade 2 pattern family ${problem.familyId}`)
} }
