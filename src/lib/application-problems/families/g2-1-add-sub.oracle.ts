import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'
function n(p: Readonly<Record<string, JsonValue>>, key: string) { const v = p[key]; if (!Number.isSafeInteger(v)) throw new TypeError(key); return v as number }
function s(p: Readonly<Record<string, JsonValue>>, key: string) { const v = p[key]; if (typeof v !== 'string') throw new TypeError(key); return v }
export function evaluateG2SemesterOneAddSubOracle(problem: GeneratedApplicationProblemV1): string {
  const p = problem.params
  switch (problem.familyId) {
    case 'g2-1-add-sub-story-total': return String(n(p, 'first') + n(p, 'added') - n(p, 'removed'))
    case 'g2-1-add-sub-missing-start': return String(n(p, 'end') - n(p, 'added'))
    case 'g2-1-add-sub-strategy-compare': {
      const operation = s(p, 'operation')
      const result = operation === 'add' ? n(p, 'first') + n(p, 'second') : n(p, 'first') - n(p, 'second')
      return n(p, 'aResult') === result ? '가' : '나'
    }
    case 'g2-1-add-sub-operation-check': {
      const expectedOperation = s(p, 'story') === '모두' ? 'add' : 'subtract'
      return s(p, 'aOperation') === expectedOperation ? '가' : '나'
    }
    default: throw new TypeError(`unknown Grade 2 add-sub family ${problem.familyId}`)
  }
}
