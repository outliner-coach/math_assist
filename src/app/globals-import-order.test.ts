import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Next.js CSS import compatibility', () => {
  it('keeps CSS imports ahead of framework directives and style rules', () => {
    const globalCss = fs.readFileSync(path.join(__dirname, 'globals.css'), 'utf8')
    expect(globalCss.trimStart().startsWith("@import 'katex/dist/katex.min.css';")).toBe(true)
  })
})
