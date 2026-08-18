import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'
function n(p: Readonly<Record<string, JsonValue>>, k: string): number { const v = p[k]; if (!Number.isSafeInteger(v)) throw new TypeError(k); return v as number }
export function oracleG2TableGraphProblem(problem: GeneratedApplicationProblemV1): string {
  const p = problem.params
  switch (problem.familyId) {
    case 'g2-2-table-graph-survey-difference': { const xs = [n(p, 'apple'), n(p, 'grape'), n(p, 'melon')]; return String(Math.max(...xs) - Math.min(...xs)) }
    case 'g2-2-table-graph-missing-category': return String(n(p, 'total') - n(p, 'first') - n(p, 'second'))
    case 'g2-2-table-graph-claim-error': return '나'
    case 'g2-2-table-graph-key-sufficiency': return n(p, 'has-key') === 1 ? '구할 수 있어요' : '표식 한 개의 뜻이 필요해요'
    default: throw new TypeError(`unsupported Grade 2 table-graph family ${problem.familyId}`)
  }
}
