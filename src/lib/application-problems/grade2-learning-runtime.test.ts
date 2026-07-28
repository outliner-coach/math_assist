import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { buildGrade2MissionCatalog } from './grade2-runtime'

describe('Grade 2 application mission catalog boundary', () => {
  it('returns a safe blocked result instead of throwing when application generation is exhausted', () => {
    const result = buildGrade2MissionCatalog(42, () => {
      throw new Error('all deterministic seeds failed')
    })

    expect(result).toEqual({ status: 'blocked' })
  })

  it('keeps all legacy missions and appends the three approved V1 missions', () => {
    const result = buildGrade2MissionCatalog(42)

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.missions).toHaveLength(147)
      expect(result.missions.slice(0, 144).every((mission) => !mission.applicationSource)).toBe(true)
      expect(result.missions.slice(144).map((mission) => mission.applicationSource.familyId)).toEqual([
        'g2-length-route-total',
        'g2-length-missing-segment',
        'g2-length-claim-check',
      ])
    }
  })

  it('keeps the V1 snapshot authority independent from current Grade 2 family recipes', () => {
    const validator = readFileSync(
      fileURLToPath(new URL('./grade2-snapshot-validator.ts', import.meta.url)),
      'utf8',
    )
    const historicalData = readFileSync(
      fileURLToPath(new URL('./grade2-v1-snapshot-data.ts', import.meta.url)),
      'utf8',
    )
    const historicalVisualResolver = readFileSync(
      fileURLToPath(new URL('./grade2-v1-visual-resolution.ts', import.meta.url)),
      'utf8',
    )
    const interactionGate = readFileSync(
      fileURLToPath(new URL('./grade2-interaction-gate.ts', import.meta.url)),
      'utf8',
    )

    expect(validator).not.toMatch(/from ['"]\.\/families\//)
    expect(validator).not.toMatch(/from ['"]\.\/grade2-visual-resolution/)
    expect(historicalData).not.toMatch(/from ['"]\.\/families\//)
    expect(historicalData).not.toMatch(/\bgenerateG2Length/)
    expect(historicalVisualResolver).not.toMatch(/from ['"]\.\/families\//)
    expect(interactionGate).not.toMatch(/from ['"]\.\/grade2-visual-resolution/)
  })
})
