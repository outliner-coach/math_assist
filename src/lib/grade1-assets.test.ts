import { describe, expect, it } from 'vitest'

import {
  grade1MapAssets,
  grade1Mascots,
  grade1Objects,
  grade1Rewards,
} from './grade1-assets'

describe('grade1 asset manifest', () => {
  it('exposes project-local grade 1 assets with accessible labels', () => {
    const meaningfulAssets = [
      ...Object.values(grade1Mascots),
      grade1MapAssets.adventureMap,
      ...Object.values(grade1Rewards),
      ...Object.values(grade1Objects),
    ]

    expect(meaningfulAssets.length).toBeGreaterThan(0)
    for (const entry of meaningfulAssets) {
      expect(entry.src).toMatch(/\/assets\/grade1\/.+\.png$/)
      expect(entry.alt.trim().length).toBeGreaterThan(0)
    }
  })

  it('marks purely decorative map nodes as decorative', () => {
    expect(grade1MapAssets.stageOpen.decorative).toBe(true)
    expect(grade1MapAssets.stageComplete.decorative).toBe(true)
    expect(grade1MapAssets.stageLocked.decorative).toBe(true)
  })
})
