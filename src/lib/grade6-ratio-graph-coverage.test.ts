import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  serializeTemplates,
  templates as generatedTemplates,
} from '../../scripts/generate-grade6-ratio-graph-templates.js'
import { evaluateTemplate } from '../../scripts/problem-quality-core.js'

type CognitiveDomain = 'knowing' | 'applying' | 'reasoning'

type RatioGraphTemplate = {
  id: string
  set_id: 'A' | 'B' | 'C'
  problem_family: string
  prompt_template: string
  solver_rule: string
  solution_steps_template: string[]
  visual_template: {
    type: string
    semantics: string
    props: {
      kind: string
      segments: Array<{ label: string; percent: number | string }>
    }
  }
  blueprint: {
    cognitiveDomain: CognitiveDomain
    primaryStandard: string
    connectedStandards?: string[]
  }
}

const committedTemplates = JSON.parse(readFileSync(
  join(process.cwd(), 'public/data/templates/g6ratiograph.json'),
  'utf8',
)) as RatioGraphTemplate[]

function directlySupportedStandards(template: RatioGraphTemplate) {
  return [
    template.blueprint.primaryStandard,
    ...(template.blueprint.connectedStandards ?? []),
  ]
}

describe('Grade 6 ratio-graph direct curriculum coverage', () => {
  it('keeps a knowing and applying source for every directly supported standard', () => {
    const standards = new Set(committedTemplates.flatMap(directlySupportedStandards))

    expect(committedTemplates.some((template) => (
      template.blueprint.primaryStandard === '[6수04-03]' &&
      template.blueprint.cognitiveDomain === 'knowing'
    ))).toBe(true)

    for (const standard of standards) {
      const domains = new Set(
        committedTemplates
          .filter((template) => directlySupportedStandards(template).includes(standard))
          .map((template) => template.blueprint.cognitiveDomain),
      )

      expect(domains.has('knowing'), `${standard} knowing`).toBe(true)
      expect(domains.has('applying'), `${standard} applying`).toBe(true)
    }
  })

  it('preserves the stable inventory, per-set K/A/R mix, disjoint families, and generated JSON', () => {
    expect(committedTemplates).toHaveLength(30)
    expect(serializeTemplates()).toBe(`${JSON.stringify(committedTemplates, null, 2)}\n`)
    expect(generatedTemplates.map((template: RatioGraphTemplate) => template.id)).toEqual(
      committedTemplates.map((template) => template.id),
    )

    const allFamilies = committedTemplates.map((template) => template.problem_family)
    expect(new Set(allFamilies).size).toBe(30)

    for (const setId of ['A', 'B', 'C'] as const) {
      const setTemplates = committedTemplates.filter((template) => template.set_id === setId)
      const domainCounts = ['knowing', 'applying', 'reasoning'].map((domain) => (
        setTemplates.filter((template) => template.blueprint.cognitiveDomain === domain).length
      ))

      expect(setTemplates).toHaveLength(10)
      expect(domainCounts).toEqual([4, 4, 2])
    }
  })

  it('derives the corrected survey prompt, answer, solution, and graph from one model', () => {
    const template = committedTemplates.find(
      (item) => item.id === 'tmpl-g6ratiograph-A-04',
    )

    expect(template?.blueprint).toMatchObject({
      cognitiveDomain: 'knowing',
      primaryStandard: '[6수04-03]',
      connectedStandards: ['[6수04-02]'],
    })
    expect(template?.visual_template).toMatchObject({
      type: 'ratio_graph',
      semantics: 'quantitative',
      props: { kind: 'circle' },
    })

    for (const p of [2, 3, 4]) {
      const params = { p }
      const prompt = evaluateTemplate(template!.prompt_template, params)
      const answer = Number(evaluateTemplate(`{{${template!.solver_rule}}}`, params))
      const solution = template!.solution_steps_template.map(
        (step) => evaluateTemplate(step, params),
      )
      const segmentPercents = template!.visual_template.props.segments.map((segment) => (
        typeof segment.percent === 'number'
          ? segment.percent
          : Number(evaluateTemplate(segment.percent, params))
      ))
      const readingCount = p * 2
      const exerciseCount = 6

      expect(prompt).toContain(`책 읽기 ${readingCount}명과 운동 ${exerciseCount}명`)
      expect(segmentPercents).toEqual([
        readingCount / 20 * 100,
        exerciseCount / 20 * 100,
        (20 - readingCount - exerciseCount) / 20 * 100,
      ])
      expect(answer).toBe(segmentPercents[0] + segmentPercents[1])
      expect(solution.some((step) => step.includes(`${answer}%`))).toBe(true)
    }

    expect(JSON.stringify(template?.visual_template)).not.toMatch(
      /"(answer|correct|result|target|product)":/i,
    )
  })
})
