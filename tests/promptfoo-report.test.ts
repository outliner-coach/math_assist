import { describe, expect, it } from 'vitest'
import { stripTrailingWhitespace } from '../scripts/run-promptfoo-problems.mjs'

describe('Promptfoo problem-quality report normalization', () => {
  it('removes trailing spaces and tabs without changing visible HTML content', () => {
    const source = '<main>\n  <p>통과</p>  \n\t\n</main>\t\n'

    expect(stripTrailingWhitespace(source)).toBe('<main>\n  <p>통과</p>\n\n</main>\n')
  })
})
