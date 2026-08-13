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
import {
  serializeTemplates as serializeFractionDecimalTemplates,
  templates as generatedFractionDecimalTemplates,
} from '../../scripts/generate-grade6-fraction-decimal-templates.js'
import {
  serializeTemplates as serializeDecimalDivisionTemplates,
  templates as generatedDecimalDivisionTemplates,
} from '../../scripts/generate-grade6-decimal-division-templates.js'
import {
  serializeTemplates as serializeProportionTemplates,
  templates as generatedProportionTemplates,
} from '../../scripts/generate-grade6-proportion-templates.js'
import {
  serializeTemplates as serializePrismPyramidTemplates,
  templates as generatedPrismPyramidTemplates,
} from '../../scripts/generate-grade6-prism-pyramid-templates.js'
import {
  serializeTemplates as serializeRoundSolidTemplates,
  templates as generatedRoundSolidTemplates,
} from '../../scripts/generate-grade6-round-solid-templates.js'
import {
  serializeTemplates as serializeSpatialTemplates,
  templates as generatedSpatialTemplates,
} from '../../scripts/generate-grade6-spatial-templates.js'
import {
  serializeTemplates as serializeCircleTemplates,
  templates as generatedCircleTemplates,
} from '../../scripts/generate-grade6-circle-templates.js'
import {
  serializeTemplates as serializeVolumeTemplates,
  templates as generatedVolumeTemplates,
} from '../../scripts/generate-grade6-volume-templates.js'
import {
  serializeTemplates as serializeRatioGraphTemplates,
  templates as generatedRatioGraphTemplates,
} from '../../scripts/generate-grade6-ratio-graph-templates.js'
import { evaluateTemplate } from '../../scripts/problem-quality-core.js'

const ratioTemplates = JSON.parse(readFileSync(
  join(process.cwd(), 'public/data/templates/g6ratio.json'),
  'utf8',
)) as ProblemTemplate[]
const fractionDivisionTemplates = JSON.parse(readFileSync(
  join(process.cwd(), 'public/data/templates/g6fractiondiv.json'),
  'utf8',
)) as ProblemTemplate[]
const fractionDecimalTemplates = JSON.parse(readFileSync(
  join(process.cwd(), 'public/data/templates/g6fractiondecimal.json'),
  'utf8',
)) as ProblemTemplate[]
const decimalDivisionTemplates = JSON.parse(readFileSync(
  join(process.cwd(), 'public/data/templates/g6decimaldiv.json'),
  'utf8',
)) as ProblemTemplate[]
const proportionTemplates = JSON.parse(readFileSync(
  join(process.cwd(), 'public/data/templates/g6proportion.json'),
  'utf8',
)) as ProblemTemplate[]
const prismPyramidTemplates = JSON.parse(readFileSync(
  join(process.cwd(), 'public/data/templates/g6prismpyramid.json'),
  'utf8',
)) as ProblemTemplate[]
const roundSolidTemplates = JSON.parse(readFileSync(
  join(process.cwd(), 'public/data/templates/g6roundsolid.json'),
  'utf8',
)) as ProblemTemplate[]
const spatialTemplates = JSON.parse(readFileSync(
  join(process.cwd(), 'public/data/templates/g6spatial.json'),
  'utf8',
)) as ProblemTemplate[]
const circleTemplates = JSON.parse(readFileSync(
  join(process.cwd(), 'public/data/templates/g6circle.json'),
  'utf8',
)) as ProblemTemplate[]
const volumeTemplates = JSON.parse(readFileSync(
  join(process.cwd(), 'public/data/templates/g6volume.json'),
  'utf8',
)) as ProblemTemplate[]
const ratioGraphTemplates = JSON.parse(readFileSync(
  join(process.cwd(), 'public/data/templates/g6ratiograph.json'),
  'utf8',
)) as ProblemTemplate[]
const releasedConceptTemplates = [
  ['g6ratio-001', ratioTemplates],
  ['g6fractiondiv-001', fractionDivisionTemplates],
  ['g6fractiondecimal-001', fractionDecimalTemplates],
  ['g6decimaldiv-001', decimalDivisionTemplates],
  ['g6proportion-001', proportionTemplates],
  ['g6prismpyramid-001', prismPyramidTemplates],
  ['g6roundsolid-001', roundSolidTemplates],
  ['g6spatial-001', spatialTemplates],
  ['g6circle-001', circleTemplates],
  ['g6volume-001', volumeTemplates],
  ['g6ratiograph-001', ratioGraphTemplates],
] as const

const allowedTaskActions = new Set([
  'recognize',
  'classify',
  'compare',
  'calculate',
  'measure',
  'construct',
  'model',
  'interpret',
  'explain',
  'analyze_error',
  'reason',
])

type ReviewedGrade6Template = ProblemTemplate & {
  taskActions?: string[]
}

describe('Grade 6 Study release slice', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each(releasedConceptTemplates)(
    'keeps %s at 30 templates with A/B/C difficulty and K/A/R 4/4/2',
    (conceptId, templates) => {
      expect(templates).toHaveLength(30)
      expect(templates.every((template) => template.concept_id === conceptId)).toBe(true)
      for (const setId of ['A', 'B', 'C'] as const) {
        const setTemplates = templates.filter((template) => template.set_id === setId)
        const byDifficulty = [1, 2, 3].map((difficulty) => (
          setTemplates.filter((template) => template.difficulty === difficulty).length
        ))
        const byDomain = ['knowing', 'applying', 'reasoning'].map((domain) => (
          setTemplates.filter((template) => template.blueprint?.cognitiveDomain === domain).length
        ))

        expect(setTemplates).toHaveLength(10)
        expect(byDifficulty).toEqual([4, 4, 2])
        expect(byDomain).toEqual([4, 4, 2])
      }
    },
  )

  it('keeps explicit source-owned quality metadata on every released template', () => {
    for (const [, templates] of releasedConceptTemplates) {
      for (const template of templates as ReviewedGrade6Template[]) {
        expect(template.taskActions, template.id).toEqual(expect.any(Array))
        expect(template.taskActions?.length, template.id).toBeGreaterThan(0)
        expect(
          template.taskActions?.every((action) => allowedTaskActions.has(action)),
          template.id,
        ).toBe(true)

        if (template.visual_template) {
          expect(template.blueprint?.visualSemantics, template.id).toBe(
            template.visual_template.semantics,
          )
        } else {
          expect(template.blueprint?.visualSemantics, template.id).toBeUndefined()
        }
      }
    }
  })

  it('uses recognition metadata and question-specific hints for ratio terms', () => {
    const expectations = [
      ['tmpl-g6ratio-A-01', ['recognize', 'interpret'], '기준량'],
      ['tmpl-g6ratio-A-02', ['recognize', 'interpret'], '비교하는 양'],
      ['tmpl-g6ratio-B-01', ['recognize', 'interpret'], '앞 항'],
      ['tmpl-g6ratio-B-02', ['recognize', 'interpret'], '뒤 항'],
      ['tmpl-g6ratio-C-01', ['recognize', 'interpret'], '비교하는 양'],
      ['tmpl-g6ratio-C-02', ['recognize', 'interpret'], '기준량'],
    ] as const

    for (const [templateId, taskActions, hintKeyword] of expectations) {
      const template = ratioTemplates.find((item) => item.id === templateId) as ReviewedGrade6Template
      expect(template.taskActions, templateId).toEqual(taskActions)
      expect(template.hint_steps_template?.join(' '), templateId).toContain(hintKeyword)
      expect(template.hint_steps_template?.join(' '), templateId).not.toContain(
        '분수, 소수, 백분율',
      )
    }
  })

  it('keeps fractional bottle answers semantically aligned with the decimal-division prompt', () => {
    const template = decimalDivisionTemplates.find(
      (item) => item.id === 'tmpl-g6decimaldiv-A-06',
    )

    expect(template?.prompt_template).toContain('몇 병 분량인가요?')
    expect(template?.solution_steps_template.join(' ')).toContain('병 분량')
    expect(template?.solver_rule).toBe('(p + 5) / 5')
  })

  it('audits every allowed Grade 6 numeric variant and long deterministic seed', () => {
    let variantCount = 0
    const longSeeds = [0, 1, 2_026_072_600, 2_147_483_647, 4_294_967_295]

    for (const [, templates] of releasedConceptTemplates) {
      for (const template of templates) {
        const { min, max } = template.param_schema.p
        for (let p = min; p <= max; p += 1) {
          variantCount += 1
          const params = { p }
          const rendered = [
            evaluateTemplate(template.prompt_template, params),
            ...template.solution_steps_template.map((step) => evaluateTemplate(step, params)),
            ...(template.hint_steps_template ?? []).map((step) => evaluateTemplate(step, params)),
          ]
          const solution = template.solution_steps_template.map(
            (step) => evaluateTemplate(step, params),
          )
          const answer = evaluateTemplate(`{{${template.solver_rule}}}`, params)
          const escapedAnswer = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const answerToken = new RegExp(`(^|[^0-9.])${escapedAnswer}([^0-9.]|$)`)

          expect(rendered.every((text) => text.trim().length > 0), `${template.id} p=${p}`).toBe(true)
          expect(rendered.some((text) => text.includes('{{')), `${template.id} p=${p}`).toBe(false)
          expect(Number.isFinite(Number(answer)) || /^-?\d+\/\d+$/.test(answer), `${template.id} p=${p}`).toBe(true)
          expect(Number(answer) >= 0 || /^-?\d+\/\d+$/.test(answer), `${template.id} p=${p}`).toBe(true)
          expect(solution.some((step) => answerToken.test(step)), `${template.id} p=${p}`).toBe(true)
        }
      }

      for (const setId of ['A', 'B', 'C'] as const) {
        for (const seed of longSeeds) {
          const options = {
            count: 10,
            setId,
            difficultyMix: { 1: 4, 2: 4, 3: 2 },
            seed,
          } as const
          expect(generateProblems(templates, options)).toEqual(generateProblems(templates, options))
        }
      }
    }

    expect(variantCount).toBe(1_633)
  })

  it('renders every allowed Grade 6 visual variant without unchecked answer payloads', () => {
    vi.stubGlobal('React', React)
    let renderedVariantCount = 0

    for (const [, templates] of releasedConceptTemplates) {
      for (const template of templates.filter((item) => item.visual_template)) {
        const { min, max } = template.param_schema.p
        for (let targetP = min; targetP <= max; targetP += 1) {
          const difficultyMix = { 1: 0, 2: 0, 3: 0 }
          difficultyMix[template.difficulty] = 1
          let problem

          for (let seed = 0; seed < 100 && problem === undefined; seed += 1) {
            const candidate = generateProblems([template], {
              count: 1,
              setId: template.set_id,
              difficultyMix,
              seed,
            })[0]
            if (candidate.params.p === targetP) problem = candidate
          }

          expect(problem, `${template.id} p=${targetP}`).toBeDefined()
          const html = renderToStaticMarkup(createElement(ProblemCard, {
            problem: problem!,
            answer: null,
            checked: false,
            onAnswer: () => undefined,
          }))

          expect(html, `${template.id} p=${targetP}`).not.toContain('data-answer')
          expect(html, `${template.id} p=${targetP}`).not.toContain('correctAnswer')
          expect(html, `${template.id} p=${targetP}`).not.toContain('정답:')
          expect(JSON.stringify(problem!.visual), `${template.id} p=${targetP}`).not.toMatch(
            /"(?:answer|result|target|product|correctAnswer)":/,
          )
          renderedVariantCount += 1
        }
      }
    }

    expect(renderedVariantCount).toBe(707)
  })

  it('uses materially different A/B/C families and keeps proportion-only standards out of 6-1', () => {
    const familySets = (['A', 'B', 'C'] as const).map((setId) => new Set(
      ratioTemplates.filter((template) => template.set_id === setId).map((template) => template.problem_family),
    ))

    expect(new Set(ratioTemplates.map((template) => template.problem_family))).toHaveLength(30)
    expect([...familySets[0]].filter((family) => familySets[1].has(family))).toEqual([])
    expect([...familySets[0]].filter((family) => familySets[2].has(family))).toEqual([])
    expect([...familySets[1]].filter((family) => familySets[2].has(family))).toEqual([])
    expect(ratioTemplates.every((template) => template.blueprint?.primaryStandard !== '[6수02-04]')).toBe(true)
    expect(ratioTemplates.some((template) => template.problem_family?.includes('equivalent-ratio'))).toBe(false)
    expect(ratioTemplates.some((template) => template.problem_family?.includes('missing-ratio-term'))).toBe(false)
  })

  it('maps fraction division to both released standards with disjoint set families', () => {
    const primaryStandards = new Set(fractionDivisionTemplates.map((template) => template.blueprint?.primaryStandard))
    const familySets = (['A', 'B', 'C'] as const).map((setId) => new Set(
      fractionDivisionTemplates
        .filter((template) => template.set_id === setId)
        .map((template) => template.problem_family),
    ))

    expect(primaryStandards).toEqual(new Set(['[6수01-10]', '[6수01-11]']))
    expect(new Set(fractionDivisionTemplates.map((template) => template.problem_family))).toHaveLength(30)
    expect([...familySets[0]].filter((family) => familySets[1].has(family))).toEqual([])
    expect([...familySets[0]].filter((family) => familySets[2].has(family))).toEqual([])
    expect([...familySets[1]].filter((family) => familySets[2].has(family))).toEqual([])
  })

  it('maps fraction-decimal relations to its released standard with disjoint set families', () => {
    const familySets = (['A', 'B', 'C'] as const).map((setId) => new Set(
      fractionDecimalTemplates
        .filter((template) => template.set_id === setId)
        .map((template) => template.problem_family),
    ))

    expect(fractionDecimalTemplates.every(
      (template) => template.blueprint?.primaryStandard === '[6수01-12]',
    )).toBe(true)
    expect(new Set(fractionDecimalTemplates.map((template) => template.problem_family))).toHaveLength(30)
    expect([...familySets[0]].filter((family) => familySets[1].has(family))).toEqual([])
    expect([...familySets[0]].filter((family) => familySets[2].has(family))).toEqual([])
    expect([...familySets[1]].filter((family) => familySets[2].has(family))).toEqual([])
  })

  it('reproduces the committed fraction-decimal bank and resolves every parameter value', () => {
    expect(serializeFractionDecimalTemplates()).toBe(readFileSync(
      join(process.cwd(), 'public/data/templates/g6fractiondecimal.json'),
      'utf8',
    ))
    expect(generatedFractionDecimalTemplates).toEqual(fractionDecimalTemplates)

    for (const template of fractionDecimalTemplates) {
      const { min, max } = template.param_schema.p
      for (let p = min; p <= max; p += 1) {
        const params = { p }
        const rendered = [
          evaluateTemplate(template.prompt_template, params),
          ...template.solution_steps_template.map((step) => evaluateTemplate(step, params)),
          ...(template.hint_steps_template ?? []).map((step) => evaluateTemplate(step, params)),
        ]
        const answer = evaluateTemplate(`{{${template.solver_rule}}}`, params)

        expect(answer, `${template.id} p=${p}`).toMatch(/^-?\d+(?:\.\d+|\/\d+)?$/)
        expect(rendered, `${template.id} p=${p}`).not.toContain(expect.stringContaining('?]'))
      }
    }
  })

  it('maps decimal division to both released standards with disjoint set families', () => {
    const primaryStandards = new Set(decimalDivisionTemplates.map(
      (template) => template.blueprint?.primaryStandard,
    ))
    const familySets = (['A', 'B', 'C'] as const).map((setId) => new Set(
      decimalDivisionTemplates
        .filter((template) => template.set_id === setId)
        .map((template) => template.problem_family),
    ))

    expect(primaryStandards).toEqual(new Set(['[6수01-14]', '[6수01-15]']))
    expect(new Set(decimalDivisionTemplates.map((template) => template.problem_family))).toHaveLength(30)
    expect([...familySets[0]].filter((family) => familySets[1].has(family))).toEqual([])
    expect([...familySets[0]].filter((family) => familySets[2].has(family))).toEqual([])
    expect([...familySets[1]].filter((family) => familySets[2].has(family))).toEqual([])
  })

  it('reproduces the committed decimal-division bank and resolves every parameter value', () => {
    expect(serializeDecimalDivisionTemplates()).toBe(readFileSync(
      join(process.cwd(), 'public/data/templates/g6decimaldiv.json'),
      'utf8',
    ))
    expect(generatedDecimalDivisionTemplates).toEqual(decimalDivisionTemplates)

    for (const template of decimalDivisionTemplates) {
      const { min, max } = template.param_schema.p
      for (let p = min; p <= max; p += 1) {
        const params = { p }
        const rendered = [
          evaluateTemplate(template.prompt_template, params),
          ...template.solution_steps_template.map((step) => evaluateTemplate(step, params)),
          ...(template.hint_steps_template ?? []).map((step) => evaluateTemplate(step, params)),
        ]
        const answer = evaluateTemplate(`{{${template.solver_rule}}}`, params)

        expect(answer, `${template.id} p=${p}`).toMatch(/^-?\d+(?:\.\d+)?$/)
        expect(rendered.some((text) => text.includes('?]')), `${template.id} p=${p}`).toBe(false)
      }
    }
  })

  it('maps proportion and proportional distribution to both released standards', () => {
    const primaryStandards = new Set(proportionTemplates.map(
      (template) => template.blueprint?.primaryStandard,
    ))
    const familySets = (['A', 'B', 'C'] as const).map((setId) => new Set(
      proportionTemplates
        .filter((template) => template.set_id === setId)
        .map((template) => template.problem_family),
    ))

    expect(primaryStandards).toEqual(new Set(['[6수02-04]', '[6수02-05]']))
    expect(new Set(proportionTemplates.map((template) => template.problem_family))).toHaveLength(30)
    expect([...familySets[0]].filter((family) => familySets[1].has(family))).toEqual([])
    expect([...familySets[0]].filter((family) => familySets[2].has(family))).toEqual([])
    expect([...familySets[1]].filter((family) => familySets[2].has(family))).toEqual([])
  })

  it('reproduces the committed proportion bank and resolves every parameter value', () => {
    expect(serializeProportionTemplates()).toBe(readFileSync(
      join(process.cwd(), 'public/data/templates/g6proportion.json'),
      'utf8',
    ))
    expect(generatedProportionTemplates).toEqual(proportionTemplates)

    for (const template of proportionTemplates) {
      const { min, max } = template.param_schema.p
      for (let p = min; p <= max; p += 1) {
        const params = { p }
        const rendered = [
          evaluateTemplate(template.prompt_template, params),
          ...template.solution_steps_template.map((step) => evaluateTemplate(step, params)),
          ...(template.hint_steps_template ?? []).map((step) => evaluateTemplate(step, params)),
        ]
        const answer = evaluateTemplate(`{{${template.solver_rule}}}`, params)

        expect(answer, `${template.id} p=${p}`).toMatch(/^\d+$/)
        expect(rendered.some((text) => text.includes('?]')), `${template.id} p=${p}`).toBe(false)
      }
    }
  })

  it('maps prisms, pyramids, and prism nets to both released standards', () => {
    const primaryStandards = new Set(prismPyramidTemplates.map(
      (template) => template.blueprint?.primaryStandard,
    ))
    const familySets = (['A', 'B', 'C'] as const).map((setId) => new Set(
      prismPyramidTemplates
        .filter((template) => template.set_id === setId)
        .map((template) => template.problem_family),
    ))

    expect(primaryStandards).toEqual(new Set(['[6수03-05]', '[6수03-06]']))
    expect(new Set(prismPyramidTemplates.map((template) => template.problem_family))).toHaveLength(30)
    expect([...familySets[0]].filter((family) => familySets[1].has(family))).toEqual([])
    expect([...familySets[0]].filter((family) => familySets[2].has(family))).toEqual([])
    expect([...familySets[1]].filter((family) => familySets[2].has(family))).toEqual([])
  })

  it('reproduces the prism-pyramid bank and keeps every visual tied to base sides', () => {
    expect(serializePrismPyramidTemplates()).toBe(readFileSync(
      join(process.cwd(), 'public/data/templates/g6prismpyramid.json'),
      'utf8',
    ))
    expect(generatedPrismPyramidTemplates).toEqual(prismPyramidTemplates)

    for (const template of prismPyramidTemplates) {
      const { min, max } = template.param_schema.p
      for (let p = min; p <= max; p += 1) {
        const params = { p }
        const rendered = [
          evaluateTemplate(template.prompt_template, params),
          ...template.solution_steps_template.map((step) => evaluateTemplate(step, params)),
          ...(template.hint_steps_template ?? []).map((step) => evaluateTemplate(step, params)),
        ]
        const answer = evaluateTemplate(`{{${template.solver_rule}}}`, params)

        expect(answer, `${template.id} p=${p}`).toMatch(/^\d+$/)
        expect(rendered.some((text) => text.includes('?]')), `${template.id} p=${p}`).toBe(false)
      }

      if (template.visual_template) {
        expect(template.visual_template.semantics).toBe('quantitative')
        expect(template.visual_template.baseSides).toBe('{{p}}')
        expect(['poly-solid', 'prism-net']).toContain(template.visual_template.type)
        expect(template.blueprint).toMatchObject({
          visualSemantics: 'quantitative',
        })
        expect(template.blueprint?.representations).toContain('diagram')
      }
    }
  })

  it('maps round solids and cylinder nets to both released standards', () => {
    const primaryStandards = new Set(roundSolidTemplates.map(
      (template) => template.blueprint?.primaryStandard,
    ))
    const familySets = (['A', 'B', 'C'] as const).map((setId) => new Set(
      roundSolidTemplates
        .filter((template) => template.set_id === setId)
        .map((template) => template.problem_family),
    ))

    expect(primaryStandards).toEqual(new Set(['[6수03-07]', '[6수03-08]']))
    expect(new Set(roundSolidTemplates.map((template) => template.problem_family))).toHaveLength(30)
    expect([...familySets[0]].filter((family) => familySets[1].has(family))).toEqual([])
    expect([...familySets[0]].filter((family) => familySets[2].has(family))).toEqual([])
    expect([...familySets[1]].filter((family) => familySets[2].has(family))).toEqual([])
  })

  it('reproduces the round-solid bank and keeps every visual structural', () => {
    expect(serializeRoundSolidTemplates()).toBe(readFileSync(
      join(process.cwd(), 'public/data/templates/g6roundsolid.json'),
      'utf8',
    ))
    expect(generatedRoundSolidTemplates).toEqual(roundSolidTemplates)

    for (const template of roundSolidTemplates) {
      const { min, max } = template.param_schema.p
      for (let p = min; p <= max; p += 1) {
        const params = { p }
        const rendered = [
          evaluateTemplate(template.prompt_template, params),
          ...template.solution_steps_template.map((step) => evaluateTemplate(step, params)),
          ...(template.hint_steps_template ?? []).map((step) => evaluateTemplate(step, params)),
        ]
        const answer = evaluateTemplate(`{{${template.solver_rule}}}`, params)

        expect(answer, `${template.id} p=${p}`).toMatch(/^\d+$/)
        expect(rendered.some((text) => text.includes('?]')), `${template.id} p=${p}`).toBe(false)
      }

      if (template.visual_template) {
        expect(template.visual_template.semantics).toBe('quantitative')
        expect(['round-solid', 'cylinder-net']).toContain(template.visual_template.type)
        expect([1, '{{p}}']).toContain(template.visual_template.copies)
        expect(template.blueprint).toMatchObject({
          visualSemantics: 'quantitative',
        })
        expect(template.blueprint?.representations).toContain('diagram')
      }
    }
  })

  it('maps cube-stack counting and projections to both released standards', () => {
    const primaryStandards = new Set(spatialTemplates.map(
      (template) => template.blueprint?.primaryStandard,
    ))
    const familySets = (['A', 'B', 'C'] as const).map((setId) => new Set(
      spatialTemplates
        .filter((template) => template.set_id === setId)
        .map((template) => template.problem_family),
    ))

    expect(primaryStandards).toEqual(new Set(['[6수03-09]', '[6수03-10]']))
    expect(new Set(spatialTemplates.map((template) => template.problem_family))).toHaveLength(30)
    expect([...familySets[0]].filter((family) => familySets[1].has(family))).toEqual([])
    expect([...familySets[0]].filter((family) => familySets[2].has(family))).toEqual([])
    expect([...familySets[1]].filter((family) => familySets[2].has(family))).toEqual([])
  })

  it('reproduces the spatial bank and derives every prompt and visual from one height grid', () => {
    expect(serializeSpatialTemplates()).toBe(readFileSync(
      join(process.cwd(), 'public/data/templates/g6spatial.json'),
      'utf8',
    ))
    expect(generatedSpatialTemplates).toEqual(spatialTemplates)

    for (const template of spatialTemplates) {
      const { min, max } = template.param_schema.p
      for (let p = min; p <= max; p += 1) {
        const params = { p }
        const rendered = [
          evaluateTemplate(template.prompt_template, params),
          ...template.solution_steps_template.map((step) => evaluateTemplate(step, params)),
          ...(template.hint_steps_template ?? []).map((step) => evaluateTemplate(step, params)),
        ]
        const answer = evaluateTemplate(`{{${template.solver_rule}}}`, params)

        expect(answer, `${template.id} p=${p}`).toMatch(/^\d+$/)
        expect(rendered.some((text) => text.includes('?]')), `${template.id} p=${p}`).toBe(false)
      }

      expect(template.visual_template).toMatchObject({
        type: 'cube-stack',
        semantics: 'quantitative',
      })
      expect(template.visual_template?.heights.flat().filter(
        (height: unknown) => height === '{{p}}',
      )).toHaveLength(1)
      expect(template.blueprint).toMatchObject({
        visualSemantics: 'quantitative',
      })
      expect(template.blueprint?.representations).toContain('diagram')
    }
  })

  it('maps circle measurement, circumference, and area to both released standards', () => {
    const primaryStandards = new Set(circleTemplates.map(
      (template) => template.blueprint?.primaryStandard,
    ))
    const familySets = (['A', 'B', 'C'] as const).map((setId) => new Set(
      circleTemplates
        .filter((template) => template.set_id === setId)
        .map((template) => template.problem_family),
    ))

    expect(primaryStandards).toEqual(new Set(['[6수03-15]', '[6수03-16]']))
    expect(new Set(circleTemplates.map((template) => template.problem_family))).toHaveLength(30)
    expect([...familySets[0]].filter((family) => familySets[1].has(family))).toEqual([])
    expect([...familySets[0]].filter((family) => familySets[2].has(family))).toEqual([])
    expect([...familySets[1]].filter((family) => familySets[2].has(family))).toEqual([])
  })

  it('reproduces the circle bank and resolves every decimal from one circle model', () => {
    expect(serializeCircleTemplates()).toBe(readFileSync(
      join(process.cwd(), 'public/data/templates/g6circle.json'),
      'utf8',
    ))
    expect(generatedCircleTemplates).toEqual(circleTemplates)

    for (const template of circleTemplates) {
      const { min, max } = template.param_schema.p
      for (let p = min; p <= max; p += 1) {
        const params = { p }
        const rendered = [
          evaluateTemplate(template.prompt_template, params),
          ...template.solution_steps_template.map((step) => evaluateTemplate(step, params)),
          ...(template.hint_steps_template ?? []).map((step) => evaluateTemplate(step, params)),
        ]
        const answer = evaluateTemplate(`{{${template.solver_rule}}}`, params)

        expect(answer, `${template.id} p=${p}`).toMatch(/^\d+(?:\.\d+)?$/)
        expect(rendered.some((text) => text.includes('?]')), `${template.id} p=${p}`).toBe(false)
      }

      expect(template.visual_template).toMatchObject({
        type: 'circle-measurement',
        semantics: 'quantitative',
        pi: 3.14,
      })
      expect(template.blueprint).toMatchObject({
        visualSemantics: 'quantitative',
      })
      expect(template.blueprint?.representations).toContain('diagram')
    }
  })

  it('maps surface area, volume units, and volume to all three released standards', () => {
    const primaryStandards = new Set(volumeTemplates.map(
      (template) => template.blueprint?.primaryStandard,
    ))
    const familySets = (['A', 'B', 'C'] as const).map((setId) => new Set(
      volumeTemplates
        .filter((template) => template.set_id === setId)
        .map((template) => template.problem_family),
    ))

    expect(primaryStandards).toEqual(new Set(['[6수03-17]', '[6수03-18]', '[6수03-19]']))
    expect(new Set(volumeTemplates.map((template) => template.problem_family))).toHaveLength(30)
    expect([...familySets[0]].filter((family) => familySets[1].has(family))).toEqual([])
    expect([...familySets[0]].filter((family) => familySets[2].has(family))).toEqual([])
    expect([...familySets[1]].filter((family) => familySets[2].has(family))).toEqual([])
  })

  it('reproduces the volume bank and resolves dimensions, units, and integer answers', () => {
    expect(serializeVolumeTemplates()).toBe(readFileSync(
      join(process.cwd(), 'public/data/templates/g6volume.json'),
      'utf8',
    ))
    expect(generatedVolumeTemplates).toEqual(volumeTemplates)

    for (const template of volumeTemplates) {
      const { min, max } = template.param_schema.p
      for (let p = min; p <= max; p += 1) {
        const params = { p }
        const rendered = [
          evaluateTemplate(template.prompt_template, params),
          ...template.solution_steps_template.map((step) => evaluateTemplate(step, params)),
          ...(template.hint_steps_template ?? []).map((step) => evaluateTemplate(step, params)),
        ]
        const answer = evaluateTemplate(`{{${template.solver_rule}}}`, params)

        expect(answer, `${template.id} p=${p}`).toMatch(/^\d+$/)
        expect(rendered.some((text) => text.includes('?]')), `${template.id} p=${p}`).toBe(false)
      }

      expect(template.visual_template).toMatchObject({
        type: 'cuboid',
        semantics: 'quantitative',
      })
      expect(template.blueprint).toMatchObject({
        visualSemantics: 'quantitative',
      })
      expect(template.blueprint?.representations).toContain('diagram')
    }
  })

  it('maps ratio graphs and data inquiry to both released standards with disjoint families', () => {
    const primaryStandards = new Set(ratioGraphTemplates.map(
      (template) => template.blueprint?.primaryStandard,
    ))
    const familySets = (['A', 'B', 'C'] as const).map((setId) => new Set(
      ratioGraphTemplates
        .filter((template) => template.set_id === setId)
        .map((template) => template.problem_family),
    ))

    expect(primaryStandards).toEqual(new Set(['[6수04-02]', '[6수04-03]']))
    expect(new Set(ratioGraphTemplates.map((template) => template.problem_family))).toHaveLength(30)
    expect([...familySets[0]].filter((family) => familySets[1].has(family))).toEqual([])
    expect([...familySets[0]].filter((family) => familySets[2].has(family))).toEqual([])
    expect([...familySets[1]].filter((family) => familySets[2].has(family))).toEqual([])
  })

  it('reproduces the ratio-graph bank and keeps every graph positive and at 100 percent', () => {
    expect(serializeRatioGraphTemplates()).toBe(readFileSync(
      join(process.cwd(), 'public/data/templates/g6ratiograph.json'),
      'utf8',
    ))
    expect(generatedRatioGraphTemplates).toEqual(ratioGraphTemplates)

    for (const template of ratioGraphTemplates) {
      const { min, max } = template.param_schema.p
      for (let p = min; p <= max; p += 1) {
        const params = { p }
        const rendered = [
          evaluateTemplate(template.prompt_template, params),
          ...template.solution_steps_template.map((step) => evaluateTemplate(step, params)),
          ...(template.hint_steps_template ?? []).map((step) => evaluateTemplate(step, params)),
        ]
        const answer = evaluateTemplate(`{{${template.solver_rule}}}`, params)
        const percentages = template.visual_template.props.segments.map(
          (item: { percent: string | number }) => (
            typeof item.percent === 'number'
              ? item.percent
              : Number(evaluateTemplate(item.percent, params))
          ),
        )

        expect(answer, `${template.id} p=${p}`).toMatch(/^\d+$/)
        expect(percentages.every((percent: number) => percent > 0)).toBe(true)
        expect(percentages.reduce((sum: number, percent: number) => sum + percent, 0)).toBe(100)
        expect(rendered.some((text) => text.includes('?]')), `${template.id} p=${p}`).toBe(false)
      }

      expect(template.visual_template).toMatchObject({
        type: 'ratio_graph',
        semantics: 'quantitative',
      })
      expect(['band', 'circle']).toContain(template.visual_template.props.kind)
      expect(template.blueprint).toMatchObject({
        visualSemantics: 'quantitative',
      })
      expect(template.blueprint?.representations).toContain('graph')
    }
  })

  it.each([
    ['A', 5, { 1: 2, 2: 2, 3: 1 }],
    ['A', 10, { 1: 4, 2: 4, 3: 2 }],
    ['B', 5, { 1: 2, 2: 2, 3: 1 }],
    ['B', 10, { 1: 4, 2: 4, 3: 2 }],
    ['C', 5, { 1: 2, 2: 2, 3: 1 }],
    ['C', 10, { 1: 4, 2: 4, 3: 2 }],
  ] as const)('generates and deterministically grades set %s with %i items', (setId, count, difficultyMix) => {
    const problems = generateProblems(ratioTemplates, { count, setId, difficultyMix, seed: 6200 + count })
    const results = gradeSession(problems, problems.map((problem) => problem.correctAnswer))

    expect(problems).toHaveLength(count)
    expect(new Set(problems.map((problem) => problem.prompt)).size).toBe(count)
    expect(results.every((result) => result.correct)).toBe(true)
  })

  it.each(['A', 'B', 'C'] as const)(
    'generates and grades every fraction-division problem in set %s',
    (setId) => {
      const problems = generateProblems(fractionDivisionTemplates, {
        count: 10,
        setId,
        difficultyMix: { 1: 4, 2: 4, 3: 2 },
        seed: 6610 + setId.charCodeAt(0),
      })
      const results = gradeSession(problems, problems.map((problem) => problem.correctAnswer))

      expect(problems).toHaveLength(10)
      expect(new Set(problems.map((problem) => problem.prompt))).toHaveLength(10)
      expect(problems.every((problem) => /^-?\d+(?:\/\d+)?$/.test(problem.correctAnswer))).toBe(true)
      expect(results.every((result) => result.correct)).toBe(true)
    },
  )

  it.each(['A', 'B', 'C'] as const)(
    'generates and grades every fraction-decimal problem in set %s',
    (setId) => {
      const problems = generateProblems(fractionDecimalTemplates, {
        count: 10,
        setId,
        difficultyMix: { 1: 4, 2: 4, 3: 2 },
        seed: 6710 + setId.charCodeAt(0),
      })
      const results = gradeSession(problems, problems.map((problem) => problem.correctAnswer))

      expect(problems).toHaveLength(10)
      expect(new Set(problems.map((problem) => problem.prompt))).toHaveLength(10)
      expect(problems.every((problem) => /^-?\d+(?:\.\d+|\/\d+)?$/.test(problem.correctAnswer))).toBe(true)
      expect(results.every((result) => result.correct)).toBe(true)
    },
  )

  it.each(['A', 'B', 'C'] as const)(
    'generates and grades every decimal-division problem in set %s',
    (setId) => {
      const problems = generateProblems(decimalDivisionTemplates, {
        count: 10,
        setId,
        difficultyMix: { 1: 4, 2: 4, 3: 2 },
        seed: 6810 + setId.charCodeAt(0),
      })
      const results = gradeSession(problems, problems.map((problem) => problem.correctAnswer))

      expect(problems).toHaveLength(10)
      expect(new Set(problems.map((problem) => problem.prompt))).toHaveLength(10)
      expect(problems.every((problem) => /^-?\d+(?:\.\d+)?$/.test(problem.correctAnswer))).toBe(true)
      expect(results.every((result) => result.correct)).toBe(true)
    },
  )

  it.each(['A', 'B', 'C'] as const)(
    'generates and grades every proportion problem in set %s',
    (setId) => {
      const problems = generateProblems(proportionTemplates, {
        count: 10,
        setId,
        difficultyMix: { 1: 4, 2: 4, 3: 2 },
        seed: 6910 + setId.charCodeAt(0),
      })
      const results = gradeSession(problems, problems.map((problem) => problem.correctAnswer))

      expect(problems).toHaveLength(10)
      expect(new Set(problems.map((problem) => problem.prompt))).toHaveLength(10)
      expect(problems.every((problem) => /^\d+$/.test(problem.correctAnswer))).toBe(true)
      expect(results.every((result) => result.correct)).toBe(true)
    },
  )

  it.each(['A', 'B', 'C'] as const)(
    'generates, renders, and grades every prism-pyramid problem in set %s',
    (setId) => {
      vi.stubGlobal('React', React)
      const problems = generateProblems(prismPyramidTemplates, {
        count: 10,
        setId,
        difficultyMix: { 1: 4, 2: 4, 3: 2 },
        seed: 7010 + setId.charCodeAt(0),
      })
      const results = gradeSession(problems, problems.map((problem) => problem.correctAnswer))

      expect(problems).toHaveLength(10)
      expect(new Set(problems.map((problem) => problem.prompt))).toHaveLength(10)
      expect(problems.every((problem) => /^\d+$/.test(problem.correctAnswer))).toBe(true)
      expect(results.every((result) => result.correct)).toBe(true)
      for (const problem of problems) {
        if (problem.visual?.type === 'poly-solid' || problem.visual?.type === 'prism-net') {
          expect(problem.visual.baseSides).toBe(problem.params.p)
        }
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
    },
  )

  it.each(['A', 'B', 'C'] as const)(
    'generates, renders, and grades every round-solid problem in set %s',
    (setId) => {
      vi.stubGlobal('React', React)
      const problems = generateProblems(roundSolidTemplates, {
        count: 10,
        setId,
        difficultyMix: { 1: 4, 2: 4, 3: 2 },
        seed: 7110 + setId.charCodeAt(0),
      })
      const results = gradeSession(problems, problems.map((problem) => problem.correctAnswer))

      expect(problems).toHaveLength(10)
      expect(new Set(problems.map((problem) => problem.prompt))).toHaveLength(10)
      expect(problems.every((problem) => /^\d+$/.test(problem.correctAnswer))).toBe(true)
      expect(results.every((result) => result.correct)).toBe(true)
      for (const problem of problems) {
        if (problem.visual?.type === 'round-solid' || problem.visual?.type === 'cylinder-net') {
          expect([1, problem.params.p]).toContain(problem.visual.copies)
        }
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
    },
  )

  it.each(['A', 'B', 'C'] as const)(
    'generates, renders, and grades every spatial problem in set %s',
    (setId) => {
      vi.stubGlobal('React', React)
      const problems = generateProblems(spatialTemplates, {
        count: 10,
        setId,
        difficultyMix: { 1: 4, 2: 4, 3: 2 },
        seed: 7210 + setId.charCodeAt(0),
      })
      const results = gradeSession(problems, problems.map((problem) => problem.correctAnswer))

      expect(problems).toHaveLength(10)
      expect(new Set(problems.map((problem) => problem.prompt))).toHaveLength(10)
      expect(problems.every((problem) => /^\d+$/.test(problem.correctAnswer))).toBe(true)
      expect(results.every((result) => result.correct)).toBe(true)
      for (const problem of problems) {
        expect(problem.visual?.type).toBe('cube-stack')
        if (problem.visual?.type === 'cube-stack') {
          const total = problem.visual.heights.flat().reduce((sum, height) => sum + height, 0)
          expect(total).toBeGreaterThanOrEqual(Number(problem.params.p))
          expect(problem.visual.heights.flat()).toContain(Number(problem.params.p))
        }
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
    },
  )

  it.each(['A', 'B', 'C'] as const)(
    'generates, renders, and grades every circle problem in set %s',
    (setId) => {
      vi.stubGlobal('React', React)
      const problems = generateProblems(circleTemplates, {
        count: 10,
        setId,
        difficultyMix: { 1: 4, 2: 4, 3: 2 },
        seed: 7310 + setId.charCodeAt(0),
      })
      const results = gradeSession(problems, problems.map((problem) => problem.correctAnswer))

      expect(problems).toHaveLength(10)
      expect(new Set(problems.map((problem) => problem.prompt))).toHaveLength(10)
      expect(problems.every((problem) => /^\d+(?:\.\d+)?$/.test(problem.correctAnswer))).toBe(true)
      expect(results.every((result) => result.correct)).toBe(true)
      for (const problem of problems) {
        expect(problem.visual?.type).toBe('circle-measurement')
        if (problem.visual?.type === 'circle-measurement') {
          expect(problem.visual.pi).toBe(3.14)
          expect(problem.visual.radius).toBeGreaterThan(0)
          expect(problem.visual.copies ?? 1).toBeGreaterThanOrEqual(1)
        }
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
    },
  )

  it.each(['A', 'B', 'C'] as const)(
    'generates, renders, and grades every surface-area and volume problem in set %s',
    (setId) => {
      vi.stubGlobal('React', React)
      const problems = generateProblems(volumeTemplates, {
        count: 10,
        setId,
        difficultyMix: { 1: 4, 2: 4, 3: 2 },
        seed: 7410 + setId.charCodeAt(0),
      })
      const results = gradeSession(problems, problems.map((problem) => problem.correctAnswer))

      expect(problems).toHaveLength(10)
      expect(new Set(problems.map((problem) => problem.prompt))).toHaveLength(10)
      expect(problems.every((problem) => /^\d+$/.test(problem.correctAnswer))).toBe(true)
      expect(results.every((result) => result.correct)).toBe(true)
      for (const problem of problems) {
        expect(problem.visual?.type).toBe('cuboid')
        if (problem.visual?.type === 'cuboid') {
          expect(problem.visual.width).toBeGreaterThan(0)
          expect(problem.visual.height).toBeGreaterThan(0)
          expect(problem.visual.depth).toBeGreaterThan(0)
        }
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
    },
  )

  it.each(['A', 'B', 'C'] as const)(
    'generates, renders, and grades every ratio-graph problem in set %s',
    (setId) => {
      vi.stubGlobal('React', React)
      const problems = generateProblems(ratioGraphTemplates, {
        count: 10,
        setId,
        difficultyMix: { 1: 4, 2: 4, 3: 2 },
        seed: 7510 + setId.charCodeAt(0),
      })
      const results = gradeSession(problems, problems.map((problem) => problem.correctAnswer))

      expect(problems).toHaveLength(10)
      expect(new Set(problems.map((problem) => problem.prompt))).toHaveLength(10)
      expect(problems.every((problem) => /^\d+$/.test(problem.correctAnswer))).toBe(true)
      expect(results.every((result) => result.correct)).toBe(true)
      for (const problem of problems) {
        expect(problem.visual?.type).toBe('ratio_graph')
        if (problem.visual?.type === 'ratio_graph') {
          expect(problem.visual.props.segments).toHaveLength(3)
          expect(problem.visual.props.segments.reduce(
            (sum, item) => sum + item.percent,
            0,
          )).toBe(100)
        }
        const html = renderToStaticMarkup(createElement(ProblemCard, {
          problem,
          answer: null,
          checked: false,
          onAnswer: () => undefined,
        }))
        expect(html).toContain('problem-diagram-ratio-graph')
        expect(html).not.toContain('data-answer')
        expect(html).not.toContain('correctAnswer')
        expect(html).not.toContain('정답:')
      }
    },
  )

  it('does not expose an answer-only value in the unchecked Grade 6 problem DOM', () => {
    vi.stubGlobal('React', React)
    const problems = generateProblems(ratioTemplates, {
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
    const problems = generateProblems(ratioTemplates, {
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
      const problems = generateProblems(ratioTemplates, {
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
