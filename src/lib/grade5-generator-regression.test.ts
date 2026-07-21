import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { generateProblems } from './problem-generator'
import type { ProblemTemplate } from './types'

const templateDirectory = join(process.cwd(), 'public/data/templates')
const grade5TemplateFiles = readdirSync(templateDirectory)
  .filter((file) => file.endsWith('.json') && !file.startsWith('g6'))
  .sort()

describe('Grade 5 safe arithmetic generator regression', () => {
  it.each(grade5TemplateFiles)('generates every %s set without unresolved arithmetic', (file) => {
    const templates = JSON.parse(
      readFileSync(join(templateDirectory, file), 'utf8'),
    ) as ProblemTemplate[]

    const setIds = ['A', 'B', 'C'] as const
    for (let setIndex = 0; setIndex < setIds.length; setIndex += 1) {
      const setId = setIds[setIndex]
      const options = { count: 10, setId, seed: 50_000 + setIndex }
      const problems = generateProblems(templates, options)
      const repeated = generateProblems(templates, options)

      expect(problems).toHaveLength(10)
      expect(repeated).toEqual(problems)
      for (const problem of problems) {
        const rendered = JSON.stringify({
          prompt: problem.prompt,
          correctAnswer: problem.correctAnswer,
          choices: problem.choices,
          solutionSteps: problem.solutionSteps,
          hintSteps: problem.hintSteps,
          visual: problem.visual,
        })
        expect(rendered).not.toMatch(/\[[^\]]+\?\]/)
        expect(problem.correctAnswer).not.toBe('NaN')
        expect(problem.correctAnswer).not.toBe('Infinity')
        expect(problem.correctAnswer).not.toBe('-Infinity')
      }
    }
  })
})
