import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { buildGrade2MissionCatalog } from './grade2-runtime'
import { isGrade2ApplicationMission } from './grade2-adapter'

describe('Grade 2 application mission catalog boundary', () => {
  it('returns a safe blocked result instead of throwing when application generation is exhausted', () => {
    const result = buildGrade2MissionCatalog(42, () => {
      throw new Error('all deterministic seeds failed')
    })

    expect(result).toEqual({ status: 'blocked' })
  })

  it('keeps 144 stable mission identities and replaces one safe Grade 2 practice slot', () => {
    const result = buildGrade2MissionCatalog(42)

    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.missions).toHaveLength(144)
      const applicationMissions = result.missions.filter(isGrade2ApplicationMission)
      expect(applicationMissions).toHaveLength(1)
      expect(applicationMissions[0]).toMatchObject({
        unitId: 'g2-2-length',
        mode: 'practice',
        applicationPlacement: {
          schemaVersion: 'grade2-application-placement-v1',
          baseMissionId: applicationMissions[0].id,
          baseSeed: 42,
        },
      })
      expect(applicationMissions[0].cognitiveDomain).not.toBe('knowing')
      expect(result.missions.filter(({ unitId, mode }) => (
        unitId === 'g2-2-length' && mode === 'practice'
      ))).toHaveLength(6)
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
