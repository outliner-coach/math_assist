import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ProblemCard from '@/components/ProblemCard'
import { createAttemptReceipt, createContentDedupeKey } from './attempt-receipt'
import { gradeSession } from './grader'
import { generateProblems } from './problem-generator'
import { createSessionId } from './session'
import type { ProblemTemplate } from './types'

const templates = JSON.parse(readFileSync(
  join(process.cwd(), 'public/data/templates/g6ratio.json'),
  'utf8',
)) as ProblemTemplate[]

describe('Grade 6 Study release slice', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each(['A', 'B', 'C'] as const)('keeps set %s at 10 templates with 4/4/2 difficulty and K/A/R', (setId) => {
    const setTemplates = templates.filter((template) => template.set_id === setId)
    const byDifficulty = [1, 2, 3].map((difficulty) => setTemplates.filter((template) => template.difficulty === difficulty).length)
    const byDomain = ['knowing', 'applying', 'reasoning'].map((domain) => (
      setTemplates.filter((template) => template.blueprint?.cognitiveDomain === domain).length
    ))

    expect(setTemplates).toHaveLength(10)
    expect(byDifficulty).toEqual([4, 4, 2])
    expect(byDomain).toEqual([4, 4, 2])
  })

  it('uses materially different A/B/C families and keeps proportion-only standards out of 6-1', () => {
    const familySets = (['A', 'B', 'C'] as const).map((setId) => new Set(
      templates.filter((template) => template.set_id === setId).map((template) => template.problem_family),
    ))

    expect(new Set(templates.map((template) => template.problem_family))).toHaveLength(30)
    expect([...familySets[0]].filter((family) => familySets[1].has(family))).toEqual([])
    expect([...familySets[0]].filter((family) => familySets[2].has(family))).toEqual([])
    expect([...familySets[1]].filter((family) => familySets[2].has(family))).toEqual([])
    expect(templates.every((template) => template.blueprint?.primaryStandard !== '[6수02-04]')).toBe(true)
    expect(templates.some((template) => template.problem_family?.includes('equivalent-ratio'))).toBe(false)
    expect(templates.some((template) => template.problem_family?.includes('missing-ratio-term'))).toBe(false)
  })

  it.each([
    ['A', 5, { 1: 2, 2: 2, 3: 1 }],
    ['A', 10, { 1: 4, 2: 4, 3: 2 }],
    ['B', 5, { 1: 2, 2: 2, 3: 1 }],
    ['B', 10, { 1: 4, 2: 4, 3: 2 }],
    ['C', 5, { 1: 2, 2: 2, 3: 1 }],
    ['C', 10, { 1: 4, 2: 4, 3: 2 }],
  ] as const)('generates and deterministically grades set %s with %i items', (setId, count, difficultyMix) => {
    const problems = generateProblems(templates, { count, setId, difficultyMix, seed: 6200 + count })
    const results = gradeSession(problems, problems.map((problem) => problem.correctAnswer))

    expect(problems).toHaveLength(count)
    expect(new Set(problems.map((problem) => problem.prompt)).size).toBe(count)
    expect(results.every((result) => result.correct)).toBe(true)
  })

  it('does not expose an answer-only value in the unchecked Grade 6 problem DOM', () => {
    vi.stubGlobal('React', React)
    const problems = generateProblems(templates, {
      count: 10,
      setId: 'A',
      difficultyMix: { 1: 4, 2: 4, 3: 2 },
      seed: 6207,
    })
    const decimalProblem = problems.find((problem) => problem.templateId === 'tmpl-g6ratio-A-07')
    expect(decimalProblem?.correctAnswer).toBe('0.5')

    const html = renderToStaticMarkup(createElement(ProblemCard, {
      problem: decimalProblem!,
      answer: null,
      checked: false,
      onAnswer: () => undefined,
    }))

    expect(html).not.toContain('0.5')
    expect(html).not.toContain('correctAnswer')
    expect(html).not.toContain('정답:')
  })

  it.each(['A', 'B', 'C'] as const)('renders every unchecked set %s problem without answer metadata', (setId) => {
    vi.stubGlobal('React', React)
    const problems = generateProblems(templates, {
      count: 10,
      setId,
      difficultyMix: { 1: 4, 2: 4, 3: 2 },
      seed: 6400 + setId.charCodeAt(0),
    })

    for (const problem of problems) {
      const html = renderToStaticMarkup(createElement(ProblemCard, {
        problem,
        answer: null,
        checked: false,
        onAnswer: () => undefined,
      }))
      expect(html).not.toContain('data-answer')
      expect(html).not.toContain('correctAnswer')
      expect(html).not.toContain('정답:')
    }
  })

  it('generates a real quantitative ratio table for each reasoning comparison set', () => {
    for (const setId of ['A', 'B', 'C'] as const) {
      const problems = generateProblems(templates, {
        count: 10,
        setId,
        difficultyMix: { 1: 4, 2: 4, 3: 2 },
        seed: 6500 + setId.charCodeAt(0),
      })
      const tableProblem = problems.find((problem) => problem.visual?.type === 'ratio_table')
      expect(tableProblem?.blueprint).toMatchObject({
        cognitiveDomain: 'reasoning',
        visualSemantics: 'quantitative',
      })
      expect(tableProblem?.visual).toMatchObject({
        type: 'ratio_table',
        semantics: 'quantitative',
        props: { columns: ['모둠', '해낸 수', '전체 수'] },
      })
    }
  })

  it('uses a Grade 6-prefixed sketch session and an answer-free Grade 6 receipt', () => {
    const sessionId = createSessionId(100, 6)
    const receipt = createAttemptReceipt({
      learnerId: null,
      sessionId,
      activityId: 'g6ratio-001',
      grade: 6,
      itemId: '0:tmpl-g6ratio-A-01',
      attemptOrdinal: 0,
      variantKey: 'tmpl-g6ratio-A-01:p=3',
      contentReleaseId: 'grade6-ratio-v1',
      responseStatus: 'checked',
      correct: true,
      usedHint: false,
      checkedAt: 200,
      dedupeKey: createContentDedupeKey({ prompt: '비를 구하세요', correctAnswer: '6' }),
    })
    const serialized = JSON.stringify(receipt)

    expect(sessionId).toMatch(/^grade6_session_100_/)
    expect(receipt).toMatchObject({ grade: 6, contentReleaseId: 'grade6-ratio-v1' })
    expect(serialized).not.toContain('"answer"')
    expect(serialized).not.toContain('strokes')
  })
})
