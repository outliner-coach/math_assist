import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

type Template = {
  id: string
  prompt_template: string
}

const templates = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'public/data/templates/commonden.json'),
    'utf8'
  )
) as Template[]

describe('commonden prompt clarity', () => {
  it('does not keep ambiguous prompt wording that hides the fractions', () => {
    const bannedPrompts = new Set([
      '{{n1}}/{{d1}}를 통분했을 때 분자는?',
      '{{n2}}/{{d2}}를 통분했을 때 분자는?',
      '통분한 뒤 첫 번째 분자에서 두 번째 분자를 빼면?'
    ])

    const ambiguousTemplates = templates.filter((template) =>
      bannedPrompts.has(template.prompt_template)
    )

    expect(ambiguousTemplates).toEqual([])
  })

  it('renders fraction-heavy prompts with KaTeX-friendly fraction notation', () => {
    const fractionPrompts = templates.filter((template) =>
      template.prompt_template.includes('통분')
    )

    for (const template of fractionPrompts) {
      expect(template.prompt_template).toContain('\\frac')
    }
  })
})
