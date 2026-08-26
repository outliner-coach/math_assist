import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  APP_RELEASE_LABEL,
  CONTENT_RELEASE_LABEL,
  POLICY_UPDATED_LABEL,
} from './app-release-info'

describe('app release info placeholders', () => {
  it('provides non-empty display labels without fabricating version numbers', () => {
    expect(APP_RELEASE_LABEL.length).toBeGreaterThan(0)
    expect(CONTENT_RELEASE_LABEL.length).toBeGreaterThan(0)
    expect(APP_RELEASE_LABEL).not.toMatch(/\d+\.\d+/)
    expect(CONTENT_RELEASE_LABEL).not.toMatch(/\d+\.\d+/)
  })

  it('provides the policy update date in an unambiguous format', () => {
    expect(POLICY_UPDATED_LABEL).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('marks the placeholder for later release wiring', () => {
    const source = fs.readFileSync(path.join(__dirname, 'app-release-info.ts'), 'utf8')
    expect(source).toContain('TODO')
  })
})
