import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('problem review server file tracing', () => {
  it('scopes JSON reads below the two approved static roots', () => {
    const source = fs.readFileSync(path.join(__dirname, 'problem-review.ts'), 'utf8')
    expect(source).not.toContain('path.join(process.cwd(), ...segments)')
    expect(source).toContain(
      "path.join(process.cwd(), 'public', 'data', ...segments)",
    )
    expect(source).toContain(
      "path.join(process.cwd(), 'docs', 'tracking', fileName)",
    )
  })
})
