import type { GeneratedApplicationProblemV1, JsonValue } from '../contracts'

function n(p: Readonly<Record<string, JsonValue>>, key: string) { const value = p[key]; if (!Number.isSafeInteger(value)) throw new TypeError(key); return value as number }
function s(p: Readonly<Record<string, JsonValue>>, key: string) { const value = p[key]; if (typeof value !== 'string') throw new TypeError(key); return value }

export function evaluateG2SemesterOneShapesOracle(problem: GeneratedApplicationProblemV1): string {
  const p = problem.params
  switch (problem.familyId) {
    case 'g2-1-shapes-object-match': {
      const object = s(p, 'object')
      if (object === '공') return '구'
      if (object === '휴지심') return '원기둥'
      if (object === '상자') return '직육면체'
      throw new TypeError('unknown solid object')
    }
    case 'g2-1-shapes-border-build':
    case 'g2-1-shapes-condition-check': {
      const sides = n(p, 'sides'); const vertices = n(p, 'vertices')
      if (sides === 3 && vertices === 3) return '삼각형'
      if (sides === 4 && vertices === 4) return '사각형'
      if (sides === 0 && vertices === 0) return '원'
      throw new RangeError('unsupported plane-shape properties')
    }
    case 'g2-1-shapes-hidden-layer': return String(n(p, 'total') - n(p, 'bottom'))
    case 'g2-1-shapes-property-claim': {
      const shape = s(p, 'shape')
      const expectedSides = shape === '삼각형' ? 3 : shape === '사각형' ? 4 : shape === '원' ? 0 : -1
      if (expectedSides < 0) throw new TypeError('unknown plane shape')
      return n(p, 'aSides') === expectedSides ? '가' : '나'
    }
    default: throw new TypeError(`unknown Grade 2 shapes family ${problem.familyId}`)
  }
}
