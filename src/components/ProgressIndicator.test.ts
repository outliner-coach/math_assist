import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('ProgressIndicator', () => {
  it('keeps the current problem pulse without moving the button hit box', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ProgressIndicator.tsx'), 'utf8')
    const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
    const keyframes = css.slice(css.indexOf('@keyframes pulse-ring'), css.indexOf('.animate-pulse-ring'))

    expect(source).toContain('data-testid={`progress-step-${i + 1}`}')
    expect(source).toContain('animate-pulse-ring')
    expect(keyframes).not.toContain('transform:')
  })
})
